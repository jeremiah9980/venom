#!/usr/bin/env python3
"""Normalize PlayNCS live-schedule data for the Scheduler Portal.

Runs after scripts/sync-ncs-tournament.py and cleans up parsed game rows in
assets/data/ncs-tournament.json: extracts game numbers, fills missing
day-of-week and venue fields from the raw source text, and recomputes the
Texas Venom game lists. Works on every team feed plus the legacy top-level
mirror — no event-specific values are hard-coded here.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "assets" / "data" / "ncs-tournament.json"

GAME_RE = re.compile(r"\bGame\s+(\d+)\b", re.I)
DAY_RE = re.compile(r"\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b", re.I)
VENUE_RE = re.compile(r"\b([A-Za-z][A-Za-z ]*(?:Athletic Complex|Sports Complex|Sports Park|Ball Park|Ballpark|Complex|Fields?)\s*#?\s*\d+)\b", re.I)


def norm(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def is_venom(game: dict) -> bool:
    names = [norm(game.get("home", {}).get("name")), norm(game.get("away", {}).get("name"))]
    return any("texas venom" in name for name in names)


def normalize_game(game: dict) -> dict:
    text = str(game.get("source_text") or "")
    number_match = GAME_RE.search(text)
    day_match = DAY_RE.search(text)
    venue_match = VENUE_RE.search(text)

    if number_match:
        game["game_number"] = int(number_match.group(1))
    if not game.get("date") and day_match:
        game["date"] = day_match.group(1).title()
    if not game.get("field") and venue_match:
        game["field"] = re.sub(r"\s+", " ", venue_match.group(1)).strip()
    return game


def normalize_games(games: list[dict]) -> list[dict]:
    games = [normalize_game(game) for game in games]
    games.sort(key=lambda game: (game.get("stage") == "bracket", game.get("game_number", 9999)))
    return games


def main() -> int:
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        print("No live tournament data to refine.")
        return 0

    total = 0
    for feed in data.get("feeds") or []:
        feed["games"] = normalize_games(feed.get("games") or [])
        feed["team_games"] = [game for game in feed["games"] if is_venom(game)]
        total += len(feed["games"])

    if isinstance(data.get("games"), list):
        data["games"] = normalize_games(data["games"])
        data["team_games"] = [game for game in data["games"] if is_venom(game)]
        total += len(data["games"])

    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Normalized {total} game row(s) across feeds.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
