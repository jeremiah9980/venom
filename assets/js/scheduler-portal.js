/* ============================================================
   scheduler-portal.js — renders the Scheduler Portal.
   Reads three committed data files (no tokens, pure consumer):
     data/ncs-tournaments.json        NCS tracker — tournament
                                      weekends per team (hourly)
     assets/data/ncs-tournament.json  live NCS event feed — pool
                                      play games + scores (10 min)
     assets/data/events.json          GameChanger calendar (30 min)
     assets/data/gc-links.json        optional GC chat deep links
   ============================================================ */

const GC_DATA_URL   = "assets/data/events.json";
const NCS_TRACKER_URL = "data/ncs-tournaments.json";
const NCS_LIVE_URL  = "assets/data/ncs-tournament.json";
const GC_LINKS_URL  = "assets/data/gc-links.json";
const GC_TEAM_URL   = "https://web.gc.com/teams";
const VENOM_RE      = /texas\s*venom/i;

const state = { all: [], team: "ALL", weekends: 0 };
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v == null ? "" : v)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/* ── date helpers ──────────────────────────────────────── */
function parseDay(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  return isNaN(d) ? null : d;
}
function fmtSyncedAt(iso) {
  if (!iso) return "—";
  const d = new Date(iso); if (isNaN(d)) return "—";
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr === 1 ? "" : "s"} ago`;
  const days = Math.floor(hr / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
function fmtDate(iso) {
  if (!iso) return { day: "?", month: "TBD", weekday: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d)) return { day: "?", month: "TBD", weekday: "", time: "" };
  return {
    day:     d.getDate().toString().padStart(2, "0"),
    month:   d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    weekday: d.toLocaleString("en-US", { weekday: "long" }),
    time:    d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

/* ============================================================
   TOURNAMENT WEEKENDS — NCS tracker blocks + released pool play
   ============================================================ */

function normalizeName(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/* Match the live NCS event feed to a tracker event: prefer the
   event id, fall back to a loose name match on the same dates. */
function liveMatchesEvent(live, ev) {
  if (!live || !live.event) return false;
  const liveId = String(live.event.id ?? "");
  if (liveId && String(ev.event_id ?? "") === liveId) return true;
  const a = normalizeName(live.event.name), b = normalizeName(ev.title);
  if (a && b && (a.includes(b) || b.includes(a))) return true;
  return !!(live.event.start_date && live.event.start_date === ev.start_date);
}

function venomGames(live) {
  const games = (live && Array.isArray(live.games)) ? live.games : [];
  return games.filter(g =>
    VENOM_RE.test(g?.home?.name || "") || VENOM_RE.test(g?.away?.name || ""));
}

function gameChip(g) {
  const isHome = VENOM_RE.test(g?.home?.name || "");
  const opp = isHome ? (g?.away?.name || "TBD") : (g?.home?.name || "TBD");
  const us  = isHome ? g?.home : g?.away;
  const them = isHome ? g?.away : g?.home;
  const played = us?.score != null && them?.score != null;
  const score = played ? ` <span class="g-score">${esc(us.score)}–${esc(them.score)}</span>` : "";
  const round = g.round && !/pool/i.test(g.round) ? esc(g.round) : "Pool";
  return `
    <div class="wk-game${played ? " final" : ""}">
      <div class="g-time"><b>${esc(g.time || "TBD")}</b><span>${esc(g.date || "")}</span></div>
      <div class="g-opp">${played ? "F" : round} · vs ${esc(opp)}${score}</div>
      <div class="g-field">${esc(g.field || "Field TBD")}</div>
    </div>`;
}

function weekendBlock(wk) {
  const start = parseDay(wk.start_date), end = parseDay(wk.end_date || wk.start_date);
  const mo = start ? start.toLocaleString("en-US", { month: "short" }).toUpperCase() : "TBD";
  const days = start && end && end.getDate() !== start.getDate()
    ? `${start.getDate()}–${end.getDate()}` : (start ? `${start.getDate()}` : "?");
  const dow = start && end && end.getDate() !== start.getDate()
    ? `${start.toLocaleString("en-US",{weekday:"short"})}–${end.toLocaleString("en-US",{weekday:"short"})}`
    : (start ? start.toLocaleString("en-US",{weekday:"short"}) : "");

  const now = new Date();
  const isLive = start && end && now >= new Date(start.getTime() - 12*3600e3) && now <= new Date(end.getTime() + 12*3600e3);

  const entries = wk.entries.map(en => {
    const teamPills = en.teams.map(t => `<span class="wk-team">${esc(t)}</span>`).join("");
    const typeFlag = en.event_type && !/^tournament$/i.test(en.event_type)
      ? `<span class="wk-flag type">${esc(en.event_type)}</span>` : "";
    const gamesBlock = en.games.length ? `
      <div class="wk-games">
        <div class="wk-games-label">Pool play — game times released</div>
        <div class="wk-game-grid">${en.games.map(gameChip).join("")}</div>
        ${en.liveNote ? `<div class="wk-note">${esc(en.liveNote)}</div>` : ""}
      </div>` : `
      <div class="wk-games">
        <div class="wk-flag tbd" style="display:inline-block;">Game times not posted yet</div>
        <div class="wk-note">The tracker checks NCS every 10 minutes — pool-play times appear here the moment they're released.</div>
      </div>`;
    return `
      <div class="wk-entry">
        <div class="wk-head">${teamPills}${isLive ? '<span class="wk-flag live">This weekend</span>' : ""}${typeFlag}</div>
        <h3 class="wk-title">${esc(en.title)}</h3>
        <div class="wk-sub">
          ${en.format ? `<span><i class="ti ti-tournament"></i>${esc(en.format)}</span>` : ""}
          ${en.location ? `<span><i class="ti ti-map-pin"></i>${esc(en.location)}</span>` : ""}
          ${en.director ? `<span><i class="ti ti-user"></i>${esc(en.director)}</span>` : ""}
          ${en.source_url ? `<span><i class="ti ti-external-link"></i><a href="${esc(en.source_url)}" target="_blank" rel="noopener">NCS event page</a></span>` : ""}
        </div>
        ${gamesBlock}
      </div>`;
  }).join('<div style="height:18px"></div>');

  return `
    <article class="wk${isLive ? " wk-live" : ""}">
      <div class="wk-rail">
        <span class="wk-mo">${esc(mo)}</span>
        <span class="wk-days">${esc(days)}</span>
        <span class="wk-dow">${esc(dow)}</span>
      </div>
      <div class="wk-body">${entries}</div>
    </article>`;
}

function buildWeekends(tracker, live) {
  const byWeekend = new Map();
  const teams = (tracker && tracker.teams) ? Object.values(tracker.teams) : [];

  for (const teamBlock of teams) {
    const age = teamBlock?.team?.age || (teamBlock?.team_key || "").toUpperCase();
    for (const ev of (teamBlock.events || [])) {
      if (!ev.start_date) continue;
      const key = `${ev.start_date}|${ev.end_date || ev.start_date}`;
      if (!byWeekend.has(key)) {
        byWeekend.set(key, { start_date: ev.start_date, end_date: ev.end_date || ev.start_date, entries: [] });
      }
      const wk = byWeekend.get(key);
      // Same tournament listed for both teams → one entry, two team pills
      const existing = wk.entries.find(en => en.event_id && en.event_id === ev.event_id);
      if (existing) {
        if (!existing.teams.includes(age)) existing.teams.push(age);
        continue;
      }
      const entry = {
        event_id: ev.event_id,
        title: ev.title || "NCS Tournament",
        event_type: ev.event_type || "",
        format: ev.format || "",
        location: ev.location || "",
        director: ev.director || "",
        source_url: ev.source_url || "",
        teams: [age],
        games: [],
        liveNote: "",
      };
      if (liveMatchesEvent(live, ev)) {
        entry.games = venomGames(live);
        if (entry.games.length && live.sync_message) entry.liveNote = live.sync_message;
        if (!entry.location && live.event?.location) entry.location = live.event.location;
      }
      wk.entries.push(entry);
    }
  }

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 2);
  const weekends = [...byWeekend.values()]
    .filter(wk => { const end = parseDay(wk.end_date); return end && end >= cutoff; })
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  state.weekends = weekends.length;
  $("#count-weekends").textContent = weekends.length;

  if (!weekends.length) {
    $("#weekend-list").innerHTML = `
      <div class="ev-empty">
        <i class="ti ti-calendar-off"></i>
        <h3>No tournament weekends scheduled</h3>
        <p>When a team is registered for an NCS tournament, the weekend appears here automatically on the next tracker sync.</p>
      </div>`;
    return;
  }
  $("#weekend-list").innerHTML = weekends.map(weekendBlock).join("");
}

/* ============================================================
   GAMECHANGER CALENDAR (events.json)
   ============================================================ */

function typeBadge(type) {
  const map = {
    game:       { lbl: "GAME",       cls: "tg" },
    practice:   { lbl: "PRACTICE",   cls: "tp" },
    tournament: { lbl: "TOURNAMENT", cls: "tt" },
    scrimmage:  { lbl: "SCRIMMAGE",  cls: "ts" },
    meeting:    { lbl: "MEETING",    cls: "tm" },
    event:      { lbl: "EVENT",      cls: "te" },
    other:      { lbl: "EVENT",      cls: "te" },
  };
  const v = map[type] || map.other;
  return `<span class="ev-type ${v.cls}">${v.lbl}</span>`;
}

function locationLink(loc) {
  if (!loc) return "";
  const q = encodeURIComponent(loc);
  return `<a class="ev-loc" href="https://maps.google.com/?q=${q}" target="_blank" rel="noopener">
    <i class="ti ti-map-pin"></i>${esc(loc)}
  </a>`;
}

function eventCard(e, { past = false } = {}) {
  const d = fmtDate(e.start);
  const opp = e.opponent ? `<div class="ev-opp">vs <b>${esc(e.opponent)}</b></div>` : "";
  const notes = (e.notes || e.description || "").trim();
  const notesBlock = notes ? `
    <div class="ev-notes">
      <div class="ev-notes-label"><i class="ti ti-notes"></i> Notes</div>
      <div class="ev-notes-body">${esc(notes).replace(/\n/g, "<br>")}</div>
    </div>` : "";
  const teamPill = e.team ? `<span class="ev-team">${esc(e.team)}</span>` : "";
  return `
    <article class="ev ${past ? "ev-past" : ""}">
      <div class="ev-date">
        <div class="ev-day">${d.day}</div>
        <div class="ev-month">${d.month}</div>
      </div>
      <div class="ev-body">
        <div class="ev-meta">
          ${typeBadge(e.type)}
          ${teamPill}
          <span class="ev-when">${d.weekday} · ${d.time}</span>
        </div>
        <h3 class="ev-title">${esc(e.title || "Untitled event")}</h3>
        ${opp}
        ${locationLink(e.location)}
        ${notesBlock}
        <div class="ev-actions">
          <a href="${GC_TEAM_URL}" target="_blank" rel="noopener" class="ev-cta">
            <i class="ti ti-external-link"></i> Open in GameChanger
          </a>
          ${e.location ? `<a href="https://maps.google.com/?q=${encodeURIComponent(e.location)}" target="_blank" rel="noopener" class="ev-cta ev-cta-ghost">
            <i class="ti ti-navigation"></i> Directions</a>` : ""}
        </div>
      </div>
    </article>`;
}

function render() {
  const now = new Date();
  const events = state.team === "ALL"
    ? state.all
    : state.all.filter(e => e.team === state.team);

  const upcoming = events.filter(e => e.start && new Date(e.start) >= now)
                         .sort((a, b) => a.start.localeCompare(b.start));
  const past     = events.filter(e => e.start && new Date(e.start) <  now)
                         .sort((a, b) => b.start.localeCompare(a.start))
                         .slice(0, 5);

  $("#count-upcoming").textContent = upcoming.length;
  $("#count-past").textContent     = past.length;

  if (upcoming.length === 0) {
    $("#upcoming-list").innerHTML = `
      <div class="ev-empty">
        <i class="ti ti-calendar-off"></i>
        <h3>No upcoming events</h3>
        <p>When events sync from GameChanger, they'll appear here. If you expect events: check that the sync workflow has run and that the team filter above is set correctly.</p>
      </div>`;
  } else {
    $("#upcoming-list").innerHTML = upcoming.map(e => eventCard(e)).join("");
  }

  if (past.length === 0) {
    $("#past-list").innerHTML = `<div class="ev-empty-sm">No recent events to show.</div>`;
  } else {
    $("#past-list").innerHTML = past.map(e => eventCard(e, { past: true })).join("");
  }
}

function setTeam(team) {
  state.team = team;
  document.querySelectorAll(".tabs button").forEach(b => {
    b.classList.toggle("active", b.dataset.team === team);
  });
  render();
}

/* ============================================================
   TEAM CHAT TILES (optional gc-links.json)
   ============================================================ */
function renderChatTiles(links) {
  const teams = (links && Array.isArray(links.teams)) ? links.teams.filter(t => t.chat_url) : [];
  if (!teams.length) return; // keep the default single tile
  $("#chat-grid").innerHTML = teams.map(t => `
    <a class="chat-tile" href="${esc(t.chat_url)}" target="_blank" rel="noopener">
      <div class="chat-tile-icon"><i class="ti ti-message-circle-2"></i></div>
      <div>
        <h3>${esc(t.team)} Team Chat</h3>
        <p>${esc(t.note || "Opens this team's chat in the GameChanger app.")}</p>
      </div>
      <div class="arrow"><i class="ti ti-arrow-right"></i></div>
    </a>`).join("");
}

/* ============================================================
   INIT
   ============================================================ */
async function init() {
  const errors = [];

  // NCS tracker + live feed → weekend blocks
  let tracker = null, live = null;
  try { tracker = await fetchJSON(NCS_TRACKER_URL); } catch (e) { errors.push("NCS tracker data unavailable"); }
  try { live = await fetchJSON(NCS_LIVE_URL); } catch (e) { /* optional — times just show as TBD */ }
  try {
    buildWeekends(tracker, live);
    $("#sync-ncs").textContent = tracker ? `updated ${fmtSyncedAt(tracker.generated_at)}` : "unavailable";
  } catch (e) {
    console.error("weekend build failed:", e);
    errors.push("Couldn't build tournament weekends");
    $("#weekend-list").innerHTML = `
      <div class="ev-empty">
        <i class="ti ti-alert-circle"></i>
        <h3>Couldn't load the NCS tracker</h3>
        <p>The tracker data file is missing or unreadable. Run the "Update NCS Tournaments" workflow from the repo Actions tab, then reload.</p>
      </div>`;
  }

  // GameChanger chat deep links (optional)
  try { renderChatTiles(await fetchJSON(GC_LINKS_URL)); } catch (e) { /* default tile stays */ }

  // GameChanger calendar
  try {
    const data = await fetchJSON(GC_DATA_URL);
    state.all = (data.events || []).map(e => ({ ...e }));

    $("#sync-status").textContent = `GC synced ${fmtSyncedAt(data.synced_at)}`;
    $("#sync-count").textContent  = `${data.count || state.all.length} event${state.all.length === 1 ? "" : "s"}`;
    if (data.errors && data.errors.length) errors.push(...data.errors);

    const teamsWithEvents = [...new Set(state.all.map(e => e.team).filter(Boolean))].sort();
    const tabs = $("#team-tabs");
    tabs.innerHTML = `<button data-team="ALL" class="active">All<span>${state.all.length}</span></button>` +
      teamsWithEvents.map(t => {
        const n = state.all.filter(e => e.team === t).length;
        return `<button data-team="${esc(t)}">${esc(t)}<span>${n}</span></button>`;
      }).join("");
    tabs.querySelectorAll("button").forEach(b => b.addEventListener("click", () => setTeam(b.dataset.team)));

    setTeam("ALL");
  } catch (err) {
    console.error("portal load failed:", err);
    $("#sync-status").textContent = "GC sync data unavailable";
    $("#upcoming-list").innerHTML = `
      <div class="ev-empty">
        <i class="ti ti-alert-circle"></i>
        <h3>Couldn't load events</h3>
        <p>The events file is missing or unreadable. If this is the first deploy: add your GameChanger iCal URLs as repository secrets and run the sync workflow from the Actions tab. See <code>GC_INTEGRATION.md</code> for setup.</p>
      </div>`;
  }

  if (errors.length) {
    $("#sync-errors").style.display = "block";
    $("#sync-errors").innerHTML = `<i class="ti ti-alert-triangle"></i> ${errors.map(esc).join("; ")}`;
  }
}

document.addEventListener("DOMContentLoaded", init);
