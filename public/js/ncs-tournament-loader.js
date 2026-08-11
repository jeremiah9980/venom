/*
  NCS Tournament Loader

  Usage on 12U tracker page:
    <section id="ncsTournamentTracker" data-team="12u"></section>
    <script src="/public/js/ncs-tournaments.js"></script>
    <script src="/public/js/ncs-tournament-loader.js"></script>

  Usage on 14U tracker page:
    <section id="ncsTournamentTracker" data-team="14u"></section>
    <script src="/public/js/ncs-tournaments.js"></script>
    <script src="/public/js/ncs-tournament-loader.js"></script>
*/
(function () {
  const root = document.getElementById("ncsTournamentTracker");
  if (!root) return;

  const teamKey = (root.dataset.team || "12u").toLowerCase();
  const index = window.TEXAS_VENOM_NCS_INDEX || {};
  const teamIndex = index.teams && index.teams[teamKey];
  const dataPath = root.dataset.source || (teamIndex && teamIndex.data_path) || `/data/ncs-tournaments-${teamKey}.json`;

  const fmtDate = (value) => {
    if (!value) return "";
    const date = new Date(value + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const dollars = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  };

  const renderError = (message) => {
    root.innerHTML = `<div class="ncs-tracker-error">${message}</div>`;
  };

  const render = (payload) => {
    if (!payload || !payload.team || !Array.isArray(payload.events)) {
      renderError(`No NCS tournament data found for ${teamKey}.`);
      return;
    }

    root.innerHTML = `
      <div class="ncs-tracker-head">
        <div>
          <h2>${payload.team.label} NCS Tournament Tracker</h2>
          <p>${payload.team.ncs_team_id} • ${payload.team.division} • ${payload.team.home}</p>
        </div>
        <a href="${payload.team.ncs_url}" target="_blank" rel="noopener">Official NCS Team Page</a>
      </div>
      <div class="ncs-tracker-grid">
        ${payload.events.map((event) => `
          <article class="ncs-event-card ${event.verify_division ? "verify" : ""}">
            <div class="ncs-event-date">
              <strong>${fmtDate(event.start_date)}${event.end_date && event.end_date !== event.start_date ? "–" + fmtDate(event.end_date).replace(/[A-Za-z]+ /, "") : ""}</strong>
              <span>${event.event_type || "NCS Event"}</span>
            </div>
            <div class="ncs-event-body">
              <h3>${event.title}</h3>
              <p>${event.location || ""}${event.director ? " • " + event.director : ""}</p>
              <p>${event.format || ""}${event.registered_teams !== null && event.registered_teams !== undefined ? " • Registered Teams: " + event.registered_teams : ""}${event.entry_fee ? " • " + dollars(event.entry_fee) : ""}</p>
              <p>${Array.isArray(event.divisions) ? event.divisions.join(" · ") : ""}</p>
              ${event.verify_division ? `<p class="ncs-verify-note">${event.verify_note || "Verify division before publishing this event."}</p>` : ""}
              ${event.source_url ? `<a href="${event.source_url}" target="_blank" rel="noopener">Open NCS Event</a>` : ""}
            </div>
          </article>
        `).join("")}
      </div>
    `;
  };

  fetch(dataPath, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(render)
    .catch((error) => renderError(`Unable to load ${dataPath}: ${error.message}`));
})();
