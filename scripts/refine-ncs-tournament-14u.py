#!/usr/bin/env python3
"""Normalize PlayNCS tournament feed details for the Venom 14U dashboard."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "assets" / "data" / "ncs-tournament-14u.json"
TEAM_URL = "https://www.playncs.com/fastpitch/Teams/Details/87549/texas-venom-14u"

GAME_RE = re.compile(r"\bGame\s+(\d+)\b", re.I)
DAY_RE = re.compile(r"\b(Sat|Sun)\b", re.I)
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


def main() -> int:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    games = [normalize_game(game) for game in data.get("games", [])]
    games.sort(key=lambda game: (game.get("stage") == "bracket", game.get("game_number", 9999)))
    data["games"] = games
    data["team_games"] = [game for game in games if is_venom(game)]

    if games:
        data["sync_message"] = f"Loaded {len(games)} division game(s), including {len(data['team_games'])} Texas Venom game(s), from NCS."

    # Preserve upcoming tournaments scraped from the team page; no hardcoded events for 14U yet
    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Normalized {len(games)} games and {len(data['team_games'])} Texas Venom games (14U)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
