#!/usr/bin/env python3
"""
Pull/refine NCS Fastpitch schedules for the Texas Venom site.

Hard scope:
  12U -> https://www.playncs.com/fastpitch/Teams/Details/87660/texas-venom-12u
  14U -> https://www.playncs.com/fastpitch/Teams/Details/87549/texas-venom-14u

Outputs:
  data/ncs-tournaments.json
  data/ncs-tournaments-12u.json
  data/ncs-tournaments-14u.json
  public/js/ncs-tournaments.js

Run:
  python3 -m pip install requests beautifulsoup4
  python3 refine-ncs-tournament.py --config ncs-teams.json --out data --js public/js/ncs-tournaments.js
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

NCS_BASE = "https://www.playncs.com"
EVENT_TYPES = {"Tournament", "Double Points Qualifier"}
MONTHS = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "sept": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}
ALLOWED_TEAM_KEYS = {"12u", "14u"}


@dataclass(frozen=True)
class TeamConfig:
    key: str
    label: str
    age: str
    ncs_team_id: str
    division: str
    home: str
    coach: str
    ncs_url: str


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def norm(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.lower())).strip()


def fetch_soup(url: str) -> BeautifulSoup:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; TexasVenomNCSBot/1.0; +https://texasvenom.site)"
    }
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")


def get_lines(soup: BeautifulSoup) -> list[str]:
    return [line for line in (clean(x) for x in soup.get_text("\n").splitlines()) if line]


def event_links(soup: BeautifulSoup) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    seen: set[str] = set()
    skip = {"", "who s coming", "divisions", "register", "team summary", "roster", "coaches", "upcoming events"}
    for anchor in soup.select("a[href*='/fastpitch/Events/Details/']"):
        href = urljoin(NCS_BASE, anchor.get("href") or "")
        title = clean(anchor.get_text(" "))
        match = re.search(r"/Events/Details/(\d+)/", href)
        if not match or norm(title) in skip:
            continue
        event_id = match.group(1)
        if event_id in seen:
            continue
        seen.add(event_id)
        links.append({"event_id": event_id, "title": title, "source_url": href})
    return links


def parse_date_range(label: str, now: datetime) -> tuple[str, str]:
    match = re.search(r"\b([A-Za-z]{3,4})\.?\s+(\d{1,2})(?:\s*-\s*(?:(\d{1,2})/)?(\d{1,2}))?\b", label)
    if not match:
        return "", ""
    month_name, start_day, end_month_number, end_day = match.groups()
    start_month = MONTHS[month_name.lower()]
    end_month = int(end_month_number) if end_month_number else start_month
    start_day = int(start_day)
    end_day = int(end_day or start_day)
    year = now.year + (1 if start_month < now.month - 1 else 0)
    return (
        datetime(year, start_month, start_day).date().isoformat(),
        datetime(year, end_month, end_day).date().isoformat(),
    )


def parse_team_meta(lines: list[str], fallback: TeamConfig) -> dict[str, str]:
    text = "\n".join(lines)
    team_id = re.search(r"Team ID:\s*([0-9-]+)", text)
    division = re.search(r"(\d+\s*&\s*Under\s+Division\s+[A-Z])", text, re.I)
    home = fallback.home
    if fallback.label in lines:
        idx = lines.index(fallback.label)
        if idx + 1 < len(lines):
            home = lines[idx + 1]
    coach = fallback.coach
    for idx, line in enumerate(lines):
        if line == "Name Role" and idx + 1 < len(lines):
            coach = re.sub(r"\s+Head Coach$", "", lines[idx + 1], flags=re.I).strip()
            break
    return {
        "key": fallback.key,
        "label": fallback.label,
        "age": fallback.age,
        "ncs_team_id": team_id.group(1) if team_id else fallback.ncs_team_id,
        "division": division.group(1) if division else fallback.division,
        "home": home,
        "coach": coach,
        "ncs_url": fallback.ncs_url,
    }


def parse_events(lines: list[str], links: list[dict[str, str]], team: TeamConfig) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    try:
        index = lines.index("Upcoming Events") + 1
    except ValueError:
        return []

    events: list[dict[str, Any]] = []
    link_index = 0

    while index < len(lines):
        if lines[index] == "Withdrawal Not Allowed" or lines[index].startswith("© "):
            break
        if lines[index] not in EVENT_TYPES:
            index += 1
            continue

        event_type = lines[index]
        index += 1
        while index < len(lines) and "|" not in lines[index] and lines[index] not in EVENT_TYPES:
            index += 1
        if index >= len(lines) or lines[index] in EVENT_TYPES:
            continue

        location, director = [clean(part) for part in lines[index].split("|", 1)]
        index += 1
        title = lines[index] if index < len(lines) else "Untitled NCS Event"
        index += 1

        block = [event_type, location + " | " + director, title]
        while index < len(lines) and lines[index] not in EVENT_TYPES and lines[index] != "Withdrawal Not Allowed" and not lines[index].startswith("© "):
            block.append(lines[index])
            index += 1

        date_label = next((x for x in block if re.search(r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2}", x, re.I)), "")
        start_date, end_date = parse_date_range(date_label, now)
        registered_match = next((re.search(r"Registered Teams:\s*(\d+)", x, re.I) for x in block if "Registered Teams" in x), None)
        registered_teams = int(registered_match.group(1)) if registered_match else None
        divisions_line = next((x for x in block if "·" in x and re.search(r"\b\d+U\b", x)), "")
        divisions = re.findall(r"\b\d+U\b", divisions_line)
        format_line = ""
        for item in block[3:]:
            if item == date_label or item.startswith("Registered Teams") or "·" in item:
                continue
            if item not in {"Who's Coming Divisions Register", "Who’s Coming Divisions Register"}:
                format_line = item
                break
        tags = [x for x in block if len(x) <= 40 and x.isupper() and x not in EVENT_TYPES]
        link = links[link_index] if link_index < len(links) else {}
        link_index += 1
        verify = bool(divisions and team.age.upper() not in {d.upper() for d in divisions})
        event = {
            "event_id": link.get("event_id", ""),
            "title": title,
            "event_type": event_type,
            "format": format_line,
            "start_date": start_date,
            "end_date": end_date,
            "date_label": date_label,
            "location": location,
            "director": director,
            "registered_teams": registered_teams,
            "divisions": divisions,
            "tags": tags[:8],
            "verify_division": verify,
            "source_url": link.get("source_url", ""),
        }
        if verify:
            event["verify_note"] = f"Listed on the {team.age} team page, but visible event divisions are {', '.join(divisions)}. Confirm with NCS/event director."
        events.append(event)

    return events


def load_config(path: Path) -> list[TeamConfig]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    teams = []
    for item in raw.get("teams", []):
        key = item["key"].lower()
        if key not in ALLOWED_TEAM_KEYS:
            raise ValueError(f"Blocked unexpected team key: {key}; only 12u and 14u are allowed.")
        teams.append(
            TeamConfig(
                key=key,
                label=item["label"],
                age=item["age"],
                ncs_team_id=item["ncs_team_id"],
                division=item.get("division", ""),
                home=item.get("home", ""),
                coach=item.get("coach", ""),
                ncs_url=item["ncs_url"],
            )
        )
    missing = ALLOWED_TEAM_KEYS - {team.key for team in teams}
    if missing:
        raise ValueError(f"Missing required tracked team(s): {', '.join(sorted(missing))}")
    return sorted(teams, key=lambda item: item.key)


def pull_team(team: TeamConfig) -> dict[str, Any]:
    soup = fetch_soup(team.ncs_url)
    lines = get_lines(soup)
    events = parse_events(lines, event_links(soup), team)
    return {
        "team_key": team.key,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "NCS Fastpitch team page",
        "team": parse_team_meta(lines, team),
        "events": events,
        "counts": {
            "events": len(events),
            "verify_division": sum(1 for event in events if event.get("verify_division")),
            "registered_team_total_shown_by_ncs": sum(event.get("registered_teams") or 0 for event in events),
        },
    }


def write_outputs(payload: dict[str, Any], out_dir: Path, js_path: Path | None) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for key, team_payload in payload["teams"].items():
        (out_dir / f"ncs-tournaments-{key}.json").write_text(json.dumps(team_payload, indent=2), encoding="utf-8")
    (out_dir / "ncs-tournaments.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    if js_path:
        js_path.parent.mkdir(parents=True, exist_ok=True)
        js_path.write_text("window.TEXAS_VENOM_NCS = " + json.dumps(payload, indent=2) + ";\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Pull Texas Venom 12U and 14U NCS tournament schedules.")
    parser.add_argument("--config", default="ncs-teams.json")
    parser.add_argument("--out", default="data")
    parser.add_argument("--js", default="public/js/ncs-tournaments.js")
    args = parser.parse_args()

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "NCS Fastpitch team pages",
        "tracked_teams_only": True,
        "teams": {},
    }
    for team in load_config(Path(args.config)):
        print(f"Pulling {team.label}: {team.ncs_url}", file=sys.stderr)
        payload["teams"][team.key] = pull_team(team)
    write_outputs(payload, Path(args.out), Path(args.js) if args.js else None)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
