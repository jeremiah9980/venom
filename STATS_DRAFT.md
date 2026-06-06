# Stats Draft — Spring 2026 (GameChanger)

> Reference document. **Do not publish player profile pages without written parent media-release on file.**
> Source: GameChanger team stats — Texas Venom 10U, Spring 2026, 25-13.

## Aubrey B. — #2

**Slug:** `aubrey-b` &nbsp; **Filename:** `aubrey-b.html` &nbsp; **Photo:** `assets/players/aubrey-b.jpg`

| Stat | Value | | Stat | Value |
|---|---|---|---|---|
| GP | 37 | | RBI | 18 |
| PA | 62 | | R   | 23 |
| AB | 46 | | BB  | 14 |
| AVG | .522 | | SO  | 12 |
| OBP | .645 | | K-L | 4 |
| SLG | .696 | | HBP | 2 |
| OPS | 1.341 | | SAC | 0 |
| H   | 24 | | SF  | 0 |
| 1B  | 19 | | ROE | 2 |
| 2B  | 3  | | FC  | 1 |
| 3B  | 1  | | SB  | 13 |
| HR  | 1  | | SB% | 92.86 |
|     |    | | CS  | 1 |
|     |    | | PIK | 0 |

**Suggested tagline tokens** &mdash; tag line: `IMPACT PLAYER`; positions: customize from family.

---

## Addison S. — #3

**Slug:** `addison-s` &nbsp; **Filename:** `addison-s.html` &nbsp; **Photo:** `assets/players/addison-s.jpg`

| Stat | Value | | Stat | Value |
|---|---|---|---|---|
| GP | 22 | | RBI | 13 |
| PA | 44 | | R   | 18 |
| AB | 36 | | BB  | 5  |
| AVG | .444 | | SO  | 7 |
| OBP | .535 | | K-L | 1 |
| SLG | .667 | | HBP | 2 |
| OPS | 1.202 | | SAC | 1 |
| H   | 16 | | SF  | 0 |
| 1B  | 11 | | ROE | 0 |
| 2B  | 3  | | FC  | 1 |
| 3B  | 1  | | SB  | 17 |
| HR  | 1  | | SB% | 94.44 |
|     |    | | CS  | 1 |
|     |    | | PIK | 0 |

---

## Publishing checklist (per player)

1. **Parent media-release on file** (written, scoped to public web display on the team site).
2. Copy `player-profile.html` to `<slug>.html`.
3. Fill the `[ TOKEN ]` placeholders with the values above + coach/family/teammate quotes.
4. Drop the parent-cleared photo at `assets/players/<slug>.jpg` (and optional `<slug>-action-1/2/3.jpg`).
5. Add the slug to the `LIVE_PROFILES` array in `roster.html`:
   ```js
   const LIVE_PROFILES = ['aubrey-b','addison-s'];
   ```
6. The roster card auto-lights-up.

**Removal:** delete the `<slug>.html` file (and photos) + remove the slug from `LIVE_PROFILES`. Card reverts.
