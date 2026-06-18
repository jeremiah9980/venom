/* ============================================================
   portal.js — fetches assets/data/events.json (committed by the
   sync workflow) and renders the family-portal event surface.
   No tokens or secrets touch this file. Pure consumer.
   ============================================================ */

const DATA_URL = "assets/data/events.json";
// Public team ID — safe to publish, this alone does not grant access
const GC_TEAM_URL = "https://web.gc.com/teams";

const state = { all: [], filtered: [], team: "ALL" };

const $ = (s) => document.querySelector(s);

function fmtDate(iso) {
  if (!iso) return { day: "?", month: "TBD", weekday: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d)) return { day: "?", month: "TBD", weekday: "", time: "" };
  return {
    day:     d.getDate().toString().padStart(2, "0"),
    month:   d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    weekday: d.toLocaleString("en-US", { weekday: "long" }),
    time:    d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" }),
    iso:     d.toISOString(),
  };
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
    <i class="ti ti-map-pin"></i>${loc}
  </a>`;
}

function eventCard(e, { past = false } = {}) {
  const d = fmtDate(e.start);
  const opp = e.opponent ? `<div class="ev-opp">vs <b>${e.opponent}</b></div>` : "";
  const desc = e.description ? `<div class="ev-desc">${e.description.replace(/\n/g, "<br>")}</div>` : "";
  const teamPill = e.team ? `<span class="ev-team">${e.team}</span>` : "";
  const gcLink = `${GC_TEAM_URL}`;
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
        <h3 class="ev-title">${e.title || "Untitled event"}</h3>
        ${opp}
        ${locationLink(e.location)}
        ${desc}
        <div class="ev-actions">
          <a href="${gcLink}" target="_blank" rel="noopener" class="ev-cta">
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

  // counts
  $("#count-upcoming").textContent = upcoming.length;
  $("#count-past").textContent     = past.length;

  // upcoming list
  if (upcoming.length === 0) {
    $("#upcoming-list").innerHTML = `
      <div class="ev-empty">
        <i class="ti ti-calendar-off"></i>
        <h3>No upcoming events</h3>
        <p>When events sync from GameChanger, they'll appear here. If you expect events to show up: check that the sync workflow has run and that the team filter above is set correctly.</p>
      </div>`;
  } else {
    $("#upcoming-list").innerHTML = upcoming.map(e => eventCard(e)).join("");
  }

  // recent list
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
  // Update counts in the chips
  const teamCount = team === "ALL" ? state.all.length : state.all.filter(e => e.team === team).length;
  $("#filter-count").textContent = teamCount;
  render();
}

async function init() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.all = (data.events || []).map(e => ({ ...e }));

    // Sync banner
    $("#sync-status").textContent = `Synced ${fmtSyncedAt(data.synced_at)}`;
    $("#sync-count").textContent  = `${data.count || state.all.length} event${state.all.length === 1 ? "" : "s"}`;
    $("#sync-teams").textContent  = (data.teams_synced && data.teams_synced.length)
      ? data.teams_synced.join(" · ")
      : "no teams synced yet";

    if (data.errors && data.errors.length) {
      $("#sync-errors").style.display = "block";
      $("#sync-errors").innerHTML = `<i class="ti ti-alert-triangle"></i> Sync errors: ${data.errors.join("; ")}`;
    }

    // Show team filter only for teams that actually have events
    const teamsWithEvents = [...new Set(state.all.map(e => e.team).filter(Boolean))].sort();
    const tabs = $("#team-tabs");
    tabs.innerHTML = `<button data-team="ALL" class="active">All<span>${state.all.length}</span></button>` +
      teamsWithEvents.map(t => {
        const n = state.all.filter(e => e.team === t).length;
        return `<button data-team="${t}">${t}<span>${n}</span></button>`;
      }).join("");
    tabs.querySelectorAll("button").forEach(b => b.addEventListener("click", () => setTeam(b.dataset.team)));

    setTeam("ALL");
  } catch (err) {
    console.error("portal load failed:", err);
    $("#sync-status").textContent = "Sync data unavailable";
    $("#upcoming-list").innerHTML = `
      <div class="ev-empty">
        <i class="ti ti-alert-circle"></i>
        <h3>Couldn't load events</h3>
        <p>The events file is missing or unreadable. If this is the first deploy: add your GameChanger iCal URLs as repository secrets and run the sync workflow from the Actions tab. See <code>GC_INTEGRATION.md</code> for setup.</p>
      </div>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
