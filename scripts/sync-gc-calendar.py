#!/usr/bin/env python3
"""
sync-gc-calendar.py — pulls one or more GameChanger ICS feeds, normalizes
the events, and writes assets/data/events.json. The token never appears in
the public repo: feed URLs come from environment variables that are stored
as GitHub Actions secrets.

ENV vars (set in repo Settings → Secrets and variables → Actions):
  GC_ICAL_10U   — full iCal URL for the 10U team (optional)
  GC_ICAL_12U   — full iCal URL for the 12U team (optional)
  GC_ICAL_14U   — full iCal URL for the 14U team (optional)

At least one must be set. The script writes a single events.json containing
all events from all configured teams, tagged with `team`.

Run locally for testing:
  GC_ICAL_10U='webcal://...' python3 scripts/sync-gc-calendar.py
"""
import os, re, json, sys, urllib.request, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT  = ROOT / "assets" / "data" / "events.json"

TEAMS = {
    "10U": os.environ.get("GC_ICAL_10U", "").strip(),
    "12U": os.environ.get("GC_ICAL_12U", "").strip(),
    "14U": os.environ.get("GC_ICAL_14U", "").strip(),
}

UA = "Mozilla/5.0 (compatible; VenomPortalSync/1.0)"


def fetch_ics(url: str) -> str:
    """Fetch the .ics body. Tolerates webcal:// and https:// prefixes."""
    if url.startswith("webcal://"):
        url = "https://" + url[len("webcal://"):]
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/calendar, */*"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def unfold(text: str) -> str:
    """RFC 5545 line unfolding — continuation lines start with a space."""
    return re.sub(r"\r?\n[ \t]", "", text)


def parse_dt(value: str) -> str:
    """Convert iCal datetime to ISO 8601. Accepts 20260615T140000Z or 20260615."""
    v = value.strip()
    if re.match(r"^\d{8}T\d{6}Z?$", v):
        d = dt.datetime.strptime(v.replace("Z", ""), "%Y%m%dT%H%M%S")
        if v.endswith("Z"):
            d = d.replace(tzinfo=dt.timezone.utc)
        return d.isoformat()
    if re.match(r"^\d{8}$", v):
        d = dt.datetime.strptime(v, "%Y%m%d")
        return d.date().isoformat()
    return v


def classify(summary: str) -> str:
    s = (summary or "").lower()
    if "practice" in s: return "practice"
    if "tournament" in s or "bracket" in s or "pool" in s: return "tournament"
    if " vs " in s or " @ " in s or " at " in s: return "game"
    if "scrimmage" in s: return "scrimmage"
    if "meeting" in s or "parent" in s: return "meeting"
    if "fundraiser" in s or "event" in s: return "event"
    return "other"


def extract_opponent(summary: str) -> str | None:
    for sep in [" vs ", " VS ", " @ ", " at "]:
        if sep in summary:
            parts = summary.split(sep, 1)
            return parts[1].strip()
    return None


def parse_events(ics_text: str, team: str) -> list[dict]:
    text = unfold(ics_text)
    blocks = re.findall(r"BEGIN:VEVENT(.*?)END:VEVENT", text, re.S)
    out = []
    for blk in blocks:
        props = {}
        for line in blk.strip().splitlines():
            if ":" not in line: continue
            key, _, val = line.partition(":")
            key = key.split(";", 1)[0].strip()  # drop params like ;TZID=...
            props[key] = val.strip()
        if "SUMMARY" not in props:
            continue
        summary = props.get("SUMMARY", "")
        ev = {
            "id":          props.get("UID", "")[:64],
            "team":        team,
            "title":       summary,
            "start":       parse_dt(props.get("DTSTART", "")),
            "end":         parse_dt(props.get("DTEND", "")) if "DTEND" in props else None,
            "location":    props.get("LOCATION", "").replace("\\,", ",").replace("\\n", " "),
            "description": props.get("DESCRIPTION", "").replace("\\,", ",").replace("\\n", "\n"),
            "type":        classify(summary),
            "opponent":    extract_opponent(summary),
            "url":         props.get("URL", ""),
        }
        out.append(ev)
    return out


def main() -> int:
    all_events: list[dict] = []
    teams_synced: list[str] = []
    errors: list[str] = []

    for team, url in TEAMS.items():
        if not url:
            continue
        try:
            ics = fetch_ics(url)
            events = parse_events(ics, team)
            all_events.extend(events)
            teams_synced.append(team)
            print(f"  ✔ {team}: {len(events)} events", file=sys.stderr)
        except Exception as e:
            errors.append(f"{team}: {type(e).__name__}: {e}")
            print(f"  ✖ {team}: {e}", file=sys.stderr)

    if not teams_synced and not all_events:
        # nothing pulled — but still write a valid empty file so the portal renders
        print("WARN: no teams synced. Writing empty events.json", file=sys.stderr)

    all_events.sort(key=lambda e: (e.get("start") or "", e.get("team", "")))

    payload = {
        "synced_at":    dt.datetime.now(dt.timezone.utc).isoformat(),
        "teams_synced": teams_synced,
        "errors":       errors,
        "count":        len(all_events),
        "events":       all_events,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2))
    print(f"wrote {OUT.relative_to(ROOT)} ({len(all_events)} events)", file=sys.stderr)
    # exit 0 even on partial failure; GH Action workflow handles status separately
    return 0


if __name__ == "__main__":
    sys.exit(main())
