(() => {
  const p = window.PLAYER_PROFILE || {};
  const $ = (id) => document.getElementById(id);
  const text = (id, value) => { const el = $(id); if (el) el.textContent = value ?? ""; };

  document.title = `${p.name || "Player"} — Texas Venom`;
  text("profile-number", `#${p.number || ""}`);
  text("profile-name", p.name || "Texas Venom Player");
  text("profile-position", p.positions || "Rostered Athlete");
  text("profile-first", p.first || "Player");
  text("profile-season", p.currentSeason || "Fall 2026");
  text("profile-team", p.currentTeam || "Texas Venom 12U");

  const photo = $("profile-photo");
  const fallback = $("profile-photo-fallback");
  if (p.image) {
    photo.src = p.image;
    photo.alt = `${p.name} — Texas Venom`;
    photo.addEventListener("error", () => {
      photo.hidden = true;
      fallback.hidden = false;
      fallback.parentElement.classList.add("fallback");
    });
  } else {
    photo.hidden = true;
    fallback.hidden = false;
    fallback.parentElement.classList.add("fallback");
  }
  text("profile-fallback-number", `#${p.number || ""}`);

  const summary = $("profile-summary");
  summary.textContent = p.stats
    ? `${p.name}'s verified GameChanger snapshot is shown below.`
    : `${p.name} is listed on the active Texas Venom 12U Fall 2026 roster.`;

  const stats = p.stats || null;
  const statGrid = $("profile-stat-grid");
  const unavailable = $("profile-stats-unavailable");
  const tableSection = $("profile-table-section");

  if (!stats) {
    statGrid.hidden = true;
    tableSection.hidden = true;
    unavailable.hidden = false;
    text("profile-source", "No player-stat export is currently available in the repository. The existing GameChanger connection supplies schedule data only.");
    return;
  }

  unavailable.hidden = true;
  const featured = [
    ["AVG", stats.AVG], ["OBP", stats.OBP], ["SLG", stats.SLG], ["OPS", stats.OPS],
    ["H", stats.H], ["RBI", stats.RBI], ["SB", stats.SB], ["SB%", stats["SB%"]]
  ];
  statGrid.innerHTML = featured.map(([label, value]) =>
    `<div class="pp-stat"><div class="v">${value ?? "—"}</div><div class="l">${label}</div></div>`
  ).join("");

  text("profile-source", `Verified source: ${stats.team}, ${stats.season} — GameChanger team statistics stored in the site repository.`);
  const columns = ["GP","PA","AB","AVG","OBP","SLG","OPS","H","1B","2B","3B","HR","RBI","R","BB","SO","HBP","SB","SB%","CS"];
  $("profile-table-head").innerHTML = columns.map(c => `<th>${c}</th>`).join("");
  $("profile-table-row").innerHTML = columns.map(c => `<td>${stats[c] ?? "—"}</td>`).join("");
})();