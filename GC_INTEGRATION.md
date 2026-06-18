# GameChanger Calendar Integration — Setup

How the Family Portal syncs schedule data from GameChanger without exposing your account token. **Read this once before deploying.**

## What this is

A GitHub Action runs every 30 minutes (and on demand). It:
1. Fetches your team's GameChanger iCal feed using a private token stored as a repository secret.
2. Parses the events.
3. Writes `assets/data/events.json` and commits if anything changed.

The portal page (`portal.html`) reads the committed JSON. **The token never appears in the public repo, the deployed site, or the page source.**

---

## One-time setup

### 1. Get your iCal URLs from GameChanger

In the GameChanger app, for **each team** (10U, 12U, 14U):
- Open the team → **Schedule** tab → top-right share icon → **Copy Calendar Link** (or "Subscribe to calendar").
- You'll get a URL that starts with `webcal://api.team-manager.gc.com/ics-calendar-documents/user/<uuid>.ics?teamId=<uuid>&token=<long-string>`.
- That `token=` part is a bearer credential. Treat it like a password.

### 2. Add the URLs as repository secrets

On GitHub: **Settings → Secrets and variables → Actions → New repository secret.**

Add one or more of these (whichever teams you have):

| Secret name | Value |
|---|---|
| `GC_ICAL_10U` | The full iCal URL for the 10U team |
| `GC_ICAL_12U` | The full iCal URL for the 12U team |
| `GC_ICAL_14U` | The full iCal URL for the 14U team |

You can add just one to start. The portal handles single or multi-team feeds the same way.

### 3. Enable the workflow

The workflow file is already at `.github/workflows/sync-gc-calendar.yml`. After your first push to the repo:
- Go to **Actions** tab.
- If prompted, enable workflows for the repo.
- Find "Sync GameChanger Calendar" in the sidebar.
- Click **Run workflow** to trigger the first sync manually.

After ~30 seconds, check that `assets/data/events.json` has been updated with real events. The portal page should now show your schedule.

### 4. Verify the portal

Open `portal.html` in your browser (or visit your GitHub Pages URL). You should see:
- Sync banner showing how recently the data refreshed
- Team filter tabs (one per synced team)
- Upcoming events as cards with date, opponent, location, GC deep-link

---

## How it stays secure

**The token never lives in the public repo.**

| Where the token *could* leak | What this setup does |
|---|---|
| In HTML source | Never written to HTML. Portal only reads `events.json`. |
| In JavaScript | Never written to JS. Sync logic runs server-side in the Action. |
| In `events.json` | Sync script writes events, not URLs. |
| In commit history | Commits made by `venom-portal-bot` only ever touch `events.json`. |
| In Action logs | GitHub automatically masks secret values in workflow logs. |

If you ever suspect a token has leaked:
1. Open the GC app → Schedule → Share → **Reset calendar link** (or similar — wording varies by version). This rotates the token, invalidating the old one.
2. Copy the new URL.
3. Update the corresponding `GC_ICAL_*` secret in GitHub.
4. Run the workflow manually to confirm the new token works.

---

## Operation

### Sync frequency
- **Cron**: every 30 minutes (line: `cron: "*/30 * * * *"` in the workflow file).
- **Manual**: click "Run workflow" in the Actions tab.
- **On push**: when the sync script or workflow file changes.

### Failure modes

- **All teams 403**: Tokens may have been rotated by GC, or your GH Action's egress IP is being blocked. Regenerate the URLs from the app and update secrets.
- **One team 403, others OK**: That team's token specifically was rotated. Update just that secret.
- **Workflow doesn't commit**: There were no changes. This is normal — the script only commits when `events.json` actually differs from the last version.

### Adjusting sync frequency
Edit `.github/workflows/sync-gc-calendar.yml`:
```yaml
schedule:
  - cron: "*/15 * * * *"   # every 15 min, more aggressive
  - cron: "0 */2 * * *"    # every 2 hours, more conservative
```

---

## Architecture

```
GameChanger              GitHub Actions                Public repo
   │                          │                            │
   │   token=secret           │                            │
   │   ◄──────────────────────│  (every 30 min)           │
   │   iCal feed              │                            │
   │   ──────────────────────►│                            │
   │                          │  parse + sanitize          │
   │                          │  ──────────────────────►   │
   │                          │  commit events.json        │
   │                                                       │
                                                          ▼
                                                 GitHub Pages
                                                 (public site)
                                                          │
                                              portal.html │
                                              reads JSON  │
                                              renders     ▼
                                                       Parents
```

The token only moves through the private Actions runtime. The public surface only ever sees parsed, sanitized event data.

---

## Chat (GameChanger Team Chat)

**The portal does not embed GameChanger chat.** GC's chat is a closed in-app feature with no public API or export. Any "integration" claiming to do it would be either fake or violating GC's ToS (and likely to break at the next app update).

What the portal does instead: a "Team Chat in GameChanger" tile that deep-links into the GC web app. Tap it, GC opens, you're in the chat. This is the only honest path.

If you want a chat surface that *lives on your domain* and that you control (separate from GC), that's a different feature — a 30-line embed of Discord webhooks or a self-hosted thread system. Ask if you want it.

---

## Files involved

```
.github/workflows/sync-gc-calendar.yml    GH Action — scheduled sync
scripts/sync-gc-calendar.py               Sync script — runs in the Action
assets/data/events.json                   Public sanitized event data (committed)
assets/js/portal.js                       Browser rendering — reads events.json
portal.html                               The portal page itself
```

That's it. No services to host, no databases to manage, no servers to keep alive. The GitHub Action is the entire backend.
