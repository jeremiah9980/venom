#!/usr/bin/env python3
"""Sync live NCS tournament schedules for every tracked Texas Venom team.

Reads the tracked-team config (ncs-teams.json) and each team's tracker data
(data/ncs-tournaments-<key>.json, produced hourly by the Update NCS
Tournaments workflow), picks the current/next tournament per team, and
scrapes that event's schedule page on PlayNCS. When NCS publishes the
pool-play schedule, the games land in assets/data/ncs-tournament.json and
the Scheduler Portal renders them inside the matching weekend block.

Output shape: {"feeds": [<one per team>], ...legacy top-level fields kept
for older consumers, mirroring the primary feed}.
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urljoin

import requests
from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "data" / "ncs-tournament.json"
CONFIG = ROOT / "ncs-teams.json"
DATA_DIR = ROOT / "data"
TEAM_NAME = "Texas Venom"
USER_AGENT = "Mozilla/5.0 (compatible; TexasVenomTournamentDashboard/1.0; +https://jeremiah9980.github.io/venom/)"

DATE_RE = re.compile(r"\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?\s*,?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?\b", re.I)
TIME_RE = re.compile(r"\b\d{1,2}:\d{2}\s*(?:AM|PM)\b", re.I)
FIELD_RE = re.compile(r"\b(?:Field|Fld|Diamond)\s*#?\s*[A-Za-z0-9-]+\b", re.I)
TEAM_LINK_RE = re.compile(r"/Teams/Details/", re.I)
DIVISION_URL_RE = re.compile(r'(?:href|data-href)="([^"]*\?division=([^"&]+)[^"]*)"', re.I)
BRACKET_WORDS = ("bracket", "championship", "semifinal", "semi-final", "quarterfinal", "quarter-final", "elimination", "round of")


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalized(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", clean(value).lower()).strip()


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def fetch(url: str) -> str:
    response = requests.get(
        url,
        timeout=35,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    response.raise_for_status()
    return response.text


def nearest_heading(element: Tag) -> str:
    current: Tag | None = element
    for _ in range(6):
        if not current:
            break
        previous = current.find_previous(["h1", "h2", "h3", "h4", "h5", "legend"])
        if previous:
            heading = clean(previous.get_text(" ", strip=True))
            if heading:
                return heading
        current = current.parent if isinstance(current.parent, Tag) else None
    return ""


def unique_team_links(element: Tag) -> list[tuple[str, str]]:
    teams: list[tuple[str, str]] = []
    seen: set[str] = set()
    for anchor in element.find_all("a", href=TEAM_LINK_RE):
        name = clean(anchor.get_text(" ", strip=True))
        if not name:
            continue
        key = normalized(name)
        if key in seen:
            continue
        seen.add(key)
        teams.append((name, urljoin("https://www.playncs.com", anchor.get("href", ""))))
    return teams


def score_values(element: Tag, team_count: int) -> list[int]:
    scores: list[int] = []
    score_nodes = element.select('[class*="score" i], [data-score], [class*="runs" i]')
    for node in score_nodes:
        match = re.fullmatch(r"\s*(\d{1,2})\s*", clean(node.get_text(" ", strip=True)))
        if match:
            scores.append(int(match.group(1)))
    if len(scores) >= team_count:
        return scores[:team_count]

    if element.name == "tr":
        cells = [clean(cell.get_text(" ", strip=True)) for cell in element.find_all(["td", "th"])]
        candidates = [int(value) for value in cells if re.fullmatch(r"\d{1,2}", value)]
        if len(candidates) >= team_count:
            return candidates[-team_count:]
    return scores


def game_stage(element: Tag, combined: str) -> tuple[str, str]:
    heading = nearest_heading(element)
    context = f"{heading} {combined}".lower()
    stage = "bracket" if any(word in context for word in BRACKET_WORDS) else "pool"
    round_name = heading
    if stage == "bracket":
        round_match = re.search(
            r"(championship|finals?|semi[- ]?finals?|quarter[- ]?finals?|round of \d+|winner'?s bracket|loser'?s bracket|bracket[^|,;]*)",
            context,
            re.I,
        )
        if round_match:
            round_name = clean(round_match.group(1)).title()
        elif not round_name:
            round_name = "Bracket"
    elif not round_name or "schedule" in round_name.lower():
        round_name = "Pool Play"
    return stage, round_name


def parse_game(element: Tag, index: int) -> dict | None:
    teams = unique_team_links(element)
    if len(teams) < 2:
        return None

    combined = clean(element.get_text(" | ", strip=True))
    date_match = DATE_RE.search(combined)
    time_match = TIME_RE.search(combined)
    field_match = FIELD_RE.search(combined)
    stage, round_name = game_stage(element, combined)
    scores = score_values(element, 2)

    status_text = combined.lower()
    if len(scores) >= 2 or any(word in status_text for word in ("final", "complete", "completed")):
        status = "final"
    elif any(word in status_text for word in ("live", "in progress", "top ", "bottom ")):
        status = "live"
    else:
        status = "scheduled"

    home_score = scores[0] if len(scores) > 0 else None
    away_score = scores[1] if len(scores) > 1 else None
    game_key = "|".join(
        [stage, round_name, date_match.group(0) if date_match else "", time_match.group(0) if time_match else "", teams[0][0], teams[1][0]]
    )
    game_id = hashlib.sha1(game_key.encode("utf-8")).hexdigest()[:12]

    return {
        "id": game_id,
        "stage": stage,
        "round": round_name,
        "date": clean(date_match.group(0)) if date_match else "",
        "time": clean(time_match.group(0)).upper() if time_match else "",
        "field": clean(field_match.group(0)) if field_match else "",
        "status": status,
        "home": {"name": teams[0][0], "score": home_score, "url": teams[0][1]},
        "away": {"name": teams[1][0], "score": away_score, "url": teams[1][1]},
        "source_order": index,
        "source_text": combined[:500],
    }


def parse_schedule(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    candidates: list[Tag] = []

    for row in soup.find_all("tr"):
        if len(unique_team_links(row)) >= 2:
            candidates.append(row)

    selectors = (
        '[class*="game" i]',
        '[class*="match" i]',
        '[class*="schedule-row" i]',
        '[class*="bracket-game" i]',
        '[data-game-id]',
    )
    for selector in selectors:
        for element in soup.select(selector):
            if isinstance(element, Tag) and len(unique_team_links(element)) >= 2:
                candidates.append(element)

    games: list[dict] = []
    seen: set[str] = set()
    for index, candidate in enumerate(candidates):
        game = parse_game(candidate, index)
        if not game or game["id"] in seen:
            continue
        seen.add(game["id"])
        games.append(game)

    games.sort(key=lambda game: (game.get("date", ""), game.get("time", ""), game.get("source_order", 0)))
    for game in games:
        game.pop("source_order", None)
    return games


def make_bracket(games: list[dict]) -> dict:
    bracket_games = [game for game in games if game.get("stage") == "bracket"]
    rounds: list[dict] = []
    by_round: dict[str, list[dict]] = {}
    for game in bracket_games:
        by_round.setdefault(game.get("round") or "Bracket", []).append(game)
    for name, round_games in by_round.items():
        rounds.append({"name": name, "games": round_games})
    return {"published": bool(bracket_games), "rounds": rounds}


def is_team_game(game: dict) -> bool:
    target = normalized(TEAM_NAME)
    names = [normalized(game.get("home", {}).get("name")), normalized(game.get("away", {}).get("name"))]
    return any(target == name or target in name or name in target for name in names if name)


def parse_iso_date(value: object) -> date | None:
    try:
        return date.fromisoformat(clean(value))
    except (TypeError, ValueError):
        return None


def select_current_event(events: list[dict], today: date) -> dict | None:
    """The tournament in progress or the next one coming up."""
    best: dict | None = None
    for ev in events:
        end = parse_iso_date(ev.get("end_date") or ev.get("start_date"))
        start = parse_iso_date(ev.get("start_date"))
        if not end or not start or end < today:
            continue
        if best is None or start < parse_iso_date(best.get("start_date")):
            best = ev
    return best


def schedule_base_url(ev: dict) -> str:
    src = clean(ev.get("source_url"))
    if not src:
        return ""
    src = src.split("?")[0]
    if "/Events/Schedule/" in src:
        return src
    return src.replace("/Events/Details/", "/Events/Schedule/")


def find_division_url(html: str, base_url: str, age: str, division_label: str) -> str:
    """Pick the schedule division link matching this team's age (and class)."""
    pairs = [(url, unquote(div).replace("+", " ")) for url, div in DIVISION_URL_RE.findall(html)]
    if not pairs:
        return ""
    age_norm = age.lower()
    candidates = [(url, div) for url, div in pairs if age_norm in div.lower()]
    if not candidates:
        return ""
    class_match = re.search(r"division\s+([A-Z])\b", division_label, re.I)
    if class_match:
        letter = class_match.group(1).upper()
        for url, div in candidates:
            if re.search(rf"\b{letter}\b", div.upper()):
                return urljoin(base_url, url)
    return urljoin(base_url, candidates[0][0])


def build_feed(team: dict, today: date) -> dict:
    key = clean(team.get("key")).lower()
    age = clean(team.get("age")) or key.upper()
    feed: dict = {
        "team_key": key,
        "age": age,
        "team": {
            "id": team.get("ncs_team_id"),
            "name": clean(team.get("label")) or f"{TEAM_NAME} {age}",
            "source_url": team.get("ncs_url"),
        },
        "event": None,
        "schedule_url": "",
        "games": [],
        "team_games": [],
        "status": "no_event",
        "message": "No current or upcoming NCS tournament in the tracker data.",
    }

    tracker = load_json(DATA_DIR / f"ncs-tournaments-{key}.json")
    ev = select_current_event(tracker.get("events") or [], today)
    if not ev:
        return feed

    feed["event"] = {
        "id": ev.get("event_id"),
        "name": clean(ev.get("title")),
        "start_date": ev.get("start_date"),
        "end_date": ev.get("end_date") or ev.get("start_date"),
        "location": clean(ev.get("location")),
        "division": age,
        "source_url": ev.get("source_url"),
    }

    base_url = schedule_base_url(ev)
    if not base_url:
        feed["status"] = "waiting_for_schedule"
        feed["message"] = "Tracker event has no NCS schedule link yet."
        return feed

    try:
        base_html = fetch(base_url)
    except Exception as exc:  # noqa: BLE001
        feed["status"] = "error"
        feed["message"] = f"Schedule fetch failed: {exc}"
        return feed

    division_url = find_division_url(base_html, base_url, age, clean(team.get("division")))
    games: list[dict] = []
    if division_url:
        feed["schedule_url"] = division_url
        try:
            games = parse_schedule(fetch(division_url))
        except Exception as exc:  # noqa: BLE001
            feed["status"] = "error"
            feed["message"] = f"Division schedule fetch failed: {exc}"
            return feed
    else:
        # Some events publish games directly on the base schedule page.
        feed["schedule_url"] = base_url
        games = parse_schedule(base_html)

    if games:
        feed["games"] = games
        feed["team_games"] = [game for game in games if is_team_game(game)]
        feed["status"] = "live"
        feed["message"] = (
            f"Loaded {len(games)} division game(s), including "
            f"{len(feed['team_games'])} {TEAM_NAME} game(s), from NCS."
        )
    else:
        feed["status"] = "waiting_for_schedule"
        feed["message"] = f"NCS has not published a parseable {age} schedule for this event yet."
    return feed


def main() -> int:
    config = load_json(CONFIG)
    teams = config.get("teams") or []
    today = datetime.now(timezone.utc).date()

    feeds = [build_feed(team, today) for team in teams]

    payload: dict = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "PlayNCS event schedule pages (per tracked team)",
        "feeds": feeds,
    }

    # Legacy top-level mirror of the primary feed (first with games, else first
    # with an event) so older consumers of this file keep working.
    primary = next((f for f in feeds if f["games"]), None) or next((f for f in feeds if f["event"]), None)
    if primary:
        payload["event"] = primary["event"]
        payload["team"] = primary["team"]
        payload["games"] = primary["games"]
        payload["team_games"] = primary["team_games"]
        payload["bracket"] = make_bracket(primary["games"])
        payload["sync_status"] = primary["status"]
        payload["sync_message"] = primary["message"]
    else:
        payload["games"] = []
        payload["team_games"] = []
        payload["bracket"] = {"published": False, "rounds": []}
        payload["sync_status"] = "no_event"
        payload["sync_message"] = "No current or upcoming NCS tournaments in the tracker data."

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    for feed in feeds:
        print(f"{feed['age']}: {feed['status']} — {feed['message']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
