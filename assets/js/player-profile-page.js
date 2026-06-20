(() => {
  const collectedStats = {
    "penny-b": { season: "Spring 2026", team: "Texas Venom 10U", GP: "36", AVG: ".441", OBP: ".542", OPS: "1.254", H: "26", RBI: "28", R: "33", SB: "12" },
    "aubrey-b": { season: "Spring 2026", team: "Texas Venom 10U", GP: "37", PA: "62", AB: "46", AVG: ".522", OBP: ".645", SLG: ".696", OPS: "1.341", H: "24", "1B": "19", "2B": "3", "3B": "1", HR: "1", RBI: "18", R: "23", BB: "14", SO: "12", HBP: "2", SB: "13", "SB%": "92.86%", CS: "1" },
    "kynsi-e": { season: "Spring 2026", team: "Texas Venom 10U", GP: "38", AVG: ".431", OBP: ".663", OPS: "1.114", H: "22", RBI: "7", R: "47", SB: "40" },
    "gracie-w": { season: "Spring 2026", team: "Texas Venom 10U", GP: "38", AVG: ".407", OBP: ".548", OPS: "1.159", H: "22", RBI: "26", R: "29", SB: "9" },
    "hadley-w": { season: "Spring 2026", team: "Texas Venom 10U", GP: "38", AVG: ".295", OBP: ".449", OPS: ".777", H: "18", RBI: "22", R: "27", SB: "11" },
    "addison-p": { season: "Spring 2026", team: "Texas Venom 10U", GP: "38", AVG: ".485", OBP: ".595", OPS: "1.232", H: "32", RBI: "32", R: "34", SB: "11" },
    "saraya-p": { season: "Spring 2026", team: "Texas Venom 10U", GP: "38", AVG: ".407", OBP: ".508", OPS: "1.045", H: "22", RBI: "18", R: "21", SB: "5" },
    "payton-r": { season: "Spring 2026", team: "Texas Venom 10U", GP: "32", PA: "46", AB: "36", AVG: ".222" },
    "emily-l": { season: "Spring 2026", team: "Texas Venom 10U", GP: "31", AVG: ".300", OBP: ".553", OPS: ".987", H: "9", RBI: "11", R: "11", SB: "10" }
  };

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

  const stats = p.stats || collectedStats[p.slug] || null;
  const summary = $("profile-summary");
  summary.textContent = stats
    ? `${p.name}'s verified GameChanger snapshot is shown below.`
    : `${p.name} is listed on the active Texas Venom 12U Fall 2026 roster.`;

  const statGrid = $("profile-stat-grid");
  const unavailable = $("profile-stats-unavailable");
  const tableSection = $("profile-table-section");

  if (!stats) {
    statGrid.hidden = true;
    tableSection.hidden = true;
    unavailable.hidden = false;
    text("profile-source", "No matching Spring 2026 Venom player-stat line was included in the collected screenshots.");
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

  text("profile-source", `Verified source: ${stats.team}, ${stats.season} — GameChanger team statistics collected for the Venom portal.`);
  const columns = ["GP","PA","AB","AVG","OBP","SLG","OPS","H","1B","2B","3B","HR","RBI","R","BB","SO","HBP","SB","SB%","CS"];
  $("profile-table-head").innerHTML = columns.map(c => `<th>${c}</th>`).join("");
  $("profile-table-row").innerHTML = columns.map(c => `<td>${stats[c] ?? "—"}</td>`).join("");
})();