#!/usr/bin/env python3
"""Sync the Texas Venom NCS tournament dashboard from PlayNCS."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "data" / "ncs-tournament.json"
TEAM_URL = "https://www.playncs.com/fastpitch/Teams/Details/73839/texas-venom"
SCHEDULE_URL = "https://www.playncs.com/fastpitch/Events/Schedule/12287/3p-sports-dingers-for-dads-6gg?division=12U%20OPEN"
TEAM_NAME = "Texas Venom"
USER_AGENT = "Mozilla/5.0 (compatible; TexasVenomTournamentDashboard/1.0; +https://jeremiah9980.github.io/venom/)"

DATE_RE = re.compile(r"\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?\s*,?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?\b", re.I)
TIME_RE = re.compile(r"\b\d{1,2}:\d{2}\s*(?:AM|PM)\b", re.I)
FIELD_RE = re.compile(r"\b(?:Field|Fld|Diamond)\s*#?\s*[A-Za-z0-9-]+\b", re.I)
EVENT_ID_RE = re.compile(r"/Events/(?:Details|Schedule)/(\d+)/", re.I)
TEAM_LINK_RE = re.compile(r"/Teams/Details/", re.I)
BRACKET_WORDS = ("bracket", "championship", "semifinal", "semi-final", "quarterfinal", "quarter-final", "elimination", "round of")


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalized(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", clean(value).lower()).strip()


def load_existing() -> dict:
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def fetch(url: str) -> tuple[str, int]:
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
    return response.text, response.status_code


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


def parse_upcoming(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    events: list[dict] = []
    seen: set[int] = set()

    for anchor in soup.find_all("a", href=EVENT_ID_RE):
        href = anchor.get("href", "")
        id_match = EVENT_ID_RE.search(href)
        name = clean(anchor.get_text(" ", strip=True))
        if not id_match or not name:
            continue
        event_id = int(id_match.group(1))
        if event_id in seen:
            continue

        container = anchor
        for parent in anchor.parents:
            if not isinstance(parent, Tag):
                continue
            parent_text = clean(parent.get_text(" | ", strip=True))
            if len(parent_text) > len(name) + 10 and (DATE_RE.search(parent_text) or re.search(r"\bJun\s+\d", parent_text, re.I)):
                container = parent
                break
        text = clean(container.get_text(" | ", strip=True))
        date_match = re.search(r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?\b", text, re.I)
        location_match = re.search(r"\b([A-Za-z][A-Za-z /.-]+,\s*TX)\b", text)
        teams_match = re.search(r"Registered Teams:\s*(\d+)", text, re.I)
        divisions_match = re.search(r"((?:\d{1,2}U(?:\s*[·,/&]\s*)?)+)", text, re.I)

        seen.add(event_id)
        events.append(
            {
                "id": event_id,
                "name": name,
                "dates": clean(date_match.group(0)) if date_match else "",
                "location": clean(location_match.group(1)) if location_match else "",
                "division": clean(divisions_match.group(1)) if divisions_match else "",
                "registered_teams": int(teams_match.group(1)) if teams_match else None,
                "url": urljoin("https://www.playncs.com", href),
            }
        )
    return events[-8:]


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


def main() -> int:
    existing = load_existing()
    payload = existing or {}
    now = datetime.now(timezone.utc).isoformat()
    errors: list[str] = []
    statuses: dict[str, int | None] = {"schedule": None, "team": None}

    games: list[dict] = []
    upcoming: list[dict] = []

    try:
        schedule_html, statuses["schedule"] = fetch(SCHEDULE_URL)
        games = parse_schedule(schedule_html)
    except Exception as exc:  # noqa: BLE001
        errors.append(f"Schedule fetch: {exc}")

    try:
        team_html, statuses["team"] = fetch(TEAM_URL)
        upcoming = parse_upcoming(team_html)
    except Exception as exc:  # noqa: BLE001
        errors.append(f"Team page fetch: {exc}")

    if games:
        payload["games"] = games
        payload["team_games"] = [game for game in games if is_team_game(game)]
        payload["bracket"] = make_bracket(games)
        payload["sync_status"] = "live"
        payload["sync_message"] = f"Loaded {len(games)} division game(s) from NCS."
    elif payload.get("games"):
        payload["sync_status"] = "stale"
        payload["sync_message"] = "NCS returned no parseable games; preserving the last successful scoreboard."
    else:
        payload["games"] = []
        payload["team_games"] = []
        payload["bracket"] = {"published": False, "rounds": []}
        payload["sync_status"] = "waiting_for_schedule"
        payload["sync_message"] = "NCS has not published a parseable 12U OPEN schedule yet."

    if upcoming:
        payload["upcoming_tournaments"] = upcoming

    payload["generated_at"] = now
    payload.setdefault(
        "event",
        {
            "id": 12287,
            "name": "3P Sports Dingers for Dads 6GG",
            "start_date": "2026-06-20",
            "end_date": "2026-06-21",
            "location": "Taylor / Lorena, TX",
            "division": "12U OPEN",
            "registered_teams": 58,
            "source_url": SCHEDULE_URL,
        },
    )
    payload.setdefault("team", {"id": "26-73839", "name": TEAM_NAME, "source_url": TEAM_URL})
    payload["source"] = {
        "schedule_url": SCHEDULE_URL,
        "team_url": TEAM_URL,
        "last_http_status": statuses,
        "last_error": "; ".join(errors) if errors else None,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(
        f"Wrote {OUT.relative_to(ROOT)}: {len(payload.get('games', []))} games, "
        f"{len(payload.get('team_games', []))} Texas Venom games, bracket={payload.get('bracket', {}).get('published')}"
    )
    if errors:
        print(" | ".join(errors))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
