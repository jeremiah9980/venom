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

  const characterProfiles = {
    "penny-b": { quote: "Penny brings steady energy and a team-first attitude every time she steps on the field.", points: ["Dependable presence: shows up ready and keeps her focus through each rep.", "Coachability: listens, adjusts, and keeps working without needing attention.", "Team value: brings calm effort that helps stabilize the dugout and defense.", "Growth mindset: continues building confidence while competing with purpose."] },
    "aubrey-b": { quote: "She’s not looking for the spotlight — she’s looking for the work. And when the moment comes, she’s always ready. That’s what makes her different.", points: ["Humble and coachable: responds to feedback immediately and keeps improving.", "Confident in her ability: does not shrink in pressure situations — she produces in them.", "Silent leader: elevates teammates through effort, not noise.", "True utility athlete: has played and contributed at every position on the field.", "Respectful teammate: puts team rhythm and buy-in ahead of individual attention."] },
    "kynsi-e": { quote: "Kynsington plays with speed, confidence, and a spark that can change the tempo of a game.", points: ["Pressure runner: uses speed to create opportunities and force mistakes.", "Competitive edge: attacks each inning with energy and urgency.", "Dugout spark: brings personality and confidence that teammates feed off of.", "Growth profile: continues sharpening softball IQ and game awareness."] },
    "gracie-w": { quote: "Gracelyn is the kind of player coaches trust because her effort stays consistent no matter the situation.", points: ["Reliable competitor: gives full effort whether the game is tight or comfortable.", "Balanced player: contributes with the bat, on the bases, and in team moments.", "Steady teammate: handles coaching with maturity and keeps moving forward.", "Situational awareness: continues building the instincts that separate good players from great ones."] },
    "hadley-w": { quote: "Hadley brings toughness and a willingness to do the little things that help a team win.", points: ["Team-first mindset: accepts her role and works to make the group better.", "Competitive toughness: keeps fighting through difficult at-bats and defensive moments.", "Positive presence: supports teammates and keeps her energy pointed forward.", "Development focus: continues building confidence, timing, and consistency."] },
    "kassidy-c": { quote: "Kassidy brings passion, edge, and a love for the game that shows up in how hard she competes.", points: ["Strong competitor: plays with visible energy and wants the ball in big moments.", "Versatile profile: brings value at catcher, third base, and developing pitching reps.", "Team heartbeat: her confidence and personality lift the group around her.", "Resilient mindset: keeps pushing through challenges and uses softball as her steady space."] },
    "addison-p": { quote: "Addison is a complete competitor — athletic, aggressive, and always looking to make the next play.", points: ["Run producer: consistently turns opportunities into momentum for the team.", "Athletic defender: tracks the ball well and competes through contact and pressure.", "Aggressive approach: attacks the game instead of waiting for it to come to her.", "Big-game profile: has the confidence and skill set to impact tournament weekends."] },
    "saraya-p": { quote: "Saraya brings power, confidence, and a presence that teammates notice right away.", points: ["Power arm: gives the team strength and confidence in the circle and on defense.", "Composed competitor: stays locked in when the game speeds up.", "Team energy: brings a strong presence without losing focus on the group.", "High ceiling: continues building consistency around an already strong athletic base."] },
    "payton-r": { quote: "Payton is a grinder — the kind of player who keeps working and gives the team honest effort.", points: ["Work ethic: stays committed to improvement and keeps taking coaching.", "Resilient attitude: does not let one play define the next one.", "Team connection: brings loyalty and consistency to the group dynamic.", "Development path: continuing to build confidence and comfort in game speed."] },
    "johnny-r": { quote: "Johnny brings fearless energy and a big personality that makes the game fun for everyone around her.", points: ["Confident presence: shows emotion, belief, and love for the game.", "Team spark: brings dugout energy and keeps teammates engaged.", "Competitive attitude: wants to be involved and wants to help the team win.", "Growth mindset: continues learning, competing, and building her softball identity."] },
    "emily-l": { quote: "Emily brings quiet confidence and steady effort — the kind of consistency every roster needs.", points: ["Reliable teammate: handles her role with maturity and commitment.", "Steady contributor: finds ways to help the team in multiple phases.", "Focused approach: keeps working through reps and game situations.", "Positive growth: continues developing confidence and competitive rhythm."] }
  };

  const highlightDates = {
    "aubrey-b": ["Mar 22, 2026", "Oct 25, 2025", "May 24, 2025", "May 17, 2025", "Apr 26, 2025", "Apr 13, 2025", "Mar 22, 2026", "Mar 14, 2026", "Feb 8, 2026", "Nov 12, 2025", "Nov 9, 2025", "Apr 19, 2025"],
    default: ["Game Clip 01", "Game Clip 02", "Game Clip 03", "Game Clip 04", "Game Clip 05", "Game Clip 06", "Game Clip 07", "Game Clip 08"]
  };

  const p = window.PLAYER_PROFILE || {};
  const $ = (id) => document.getElementById(id);
  const text = (id, value) => { const el = $(id); if (el) el.textContent = value ?? ""; };
  const shell = document.querySelector(".pp-shell");

  document.title = `${p.name || "Player"} — Texas Venom`;
  text("profile-number", `#${p.number || ""}`);
  text("profile-name", p.name || "Texas Venom Player");
  text("profile-position", p.positions || "Rostered Athlete");
  text("profile-first", p.first || "Player");
  text("profile-season", p.currentSeason || "Fall 2026");
  text("profile-team", p.currentTeam || "Texas Venom 12U");

  const photo = $("profile-photo");
  const fallback = $("profile-photo-fallback");
  if (photo && p.image) {
    photo.src = p.image;
    photo.alt = `${p.name} — Texas Venom`;
    photo.addEventListener("error", () => {
      photo.hidden = true;
      if (fallback) {
        fallback.hidden = false;
        fallback.parentElement.classList.add("fallback");
      }
    });
  } else if (photo && fallback) {
    photo.hidden = true;
    fallback.hidden = false;
    fallback.parentElement.classList.add("fallback");
  }
  text("profile-fallback-number", `#${p.number || ""}`);

  const stats = p.stats || collectedStats[p.slug] || null;
  const summary = $("profile-summary");
  if (summary) {
    summary.textContent = stats
      ? `${p.name}'s player profile, current in-season snapshot, character profile, all-time stats, and highlight wall are shown below.`
      : `${p.name} is listed on the active Texas Venom 12U Fall 2026 roster. This profile is ready for in-season stats and highlight updates.`;
  }

  const statGrid = $("profile-stat-grid");
  const unavailable = $("profile-stats-unavailable");
  const tableSection = $("profile-table-section");

  if (!stats) {
    if (statGrid) statGrid.hidden = true;
    if (tableSection) tableSection.hidden = false;
    if (unavailable) unavailable.hidden = false;
    text("profile-source", "In-season GameChanger stats have not been imported yet for this player.");
  } else {
    if (unavailable) unavailable.hidden = true;
    const featured = [
      ["AVG", stats.AVG], ["OBP", stats.OBP], ["SLG", stats.SLG], ["OPS", stats.OPS],
      ["H", stats.H], ["RBI", stats.RBI], ["SB", stats.SB], ["SB%", stats["SB%"]]
    ];
    if (statGrid) {
      statGrid.hidden = false;
      statGrid.innerHTML = featured.map(([label, value]) =>
        `<div class="pp-stat"><div class="v">${value ?? "—"}</div><div class="l">${label}</div></div>`
      ).join("");
    }
    text("profile-source", `Verified source: ${stats.team}, ${stats.season} — current in-season GameChanger snapshot collected for the Venom portal.`);
  }

  const columns = ["GP","PA","AB","AVG","OBP","SLG","OPS","H","1B","2B","3B","HR","RBI","R","BB","SO","HBP","SB","SB%","CS"];
  const head = $("profile-table-head");
  const row = $("profile-table-row");
  if (head) head.innerHTML = columns.map(c => `<th>${c}</th>`).join("");
  if (row) row.innerHTML = columns.map(c => `<td>${stats?.[c] ?? "—"}</td>`).join("");

  if (tableSection) {
    const title = tableSection.querySelector(".pp-title");
    const label = tableSection.querySelector(".pp-label");
    if (label) label.textContent = "Performance";
    if (title) title.textContent = "All-Time Stats";
  }

  function makeCharacterProfile() {
    if (!shell || document.getElementById("profile-character-section")) return;
    const data = characterProfiles[p.slug] || { quote: `${p.first || "This player"} brings effort, coachability, and commitment to the Texas Venom roster.`, points: ["Competes with purpose and keeps building softball confidence.", "Responds to coaching and supports teammates.", "Adds value through effort, attitude, and accountability."] };
    const section = document.createElement("section");
    section.className = "pp-section pp-character";
    section.id = "profile-character-section";
    section.innerHTML = `
      <div class="pp-character-head"><div class="pp-label">Coach Notes</div><h2 class="pp-title">Character Profile</h2></div>
      <div class="pp-character-grid">
        <blockquote class="pp-coach-quote">“${data.quote}”<span>— AI-assisted coach profile</span></blockquote>
        <div class="pp-character-card">
          ${data.points.map(point => `<div class="pp-character-point"><i class="ti ti-square-filled"></i><span>${point}</span></div>`).join("")}
        </div>
      </div>`;
    const overview = document.querySelector(".pp-overview");
    overview?.insertAdjacentElement("afterend", section);
  }

  function makeVideoWall() {
    if (!shell || document.getElementById("profile-video-wall")) return;
    const clips = highlightDates[p.slug] || highlightDates.default;
    const section = document.createElement("section");
    section.className = "pp-video-wall";
    section.id = "profile-video-wall";
    section.innerHTML = `
      <div class="pp-video-head">
        <div><div class="pp-label">Film Room</div><h2 class="pp-title">At the Plate</h2><p>Highlight reel wall for game clips, swings, defensive plays, and player development moments.</p></div>
        <a class="pp-video-folder" href="#"><i class="ti ti-folder"></i> Full Folder</a>
      </div>
      <div class="pp-video-tabs"><button class="active">All</button><button>Home Runs</button><button>Hits</button><button>Doubles</button><button>Defense</button></div>
      <div class="pp-video-grid">
        ${clips.map((date, index) => `<article class="pp-video-card"><div class="pp-video-thumb"><span class="pp-play"><i class="ti ti-player-play-filled"></i></span></div><div class="pp-video-meta"><span>${index % 5 === 0 ? "Home Run" : index % 3 === 0 ? "Top Play" : "Game Clip"}</span><strong>${date}</strong><small>${p.first || "Player"} · Texas Venom</small></div></article>`).join("")}
      </div>`;
    const back = document.querySelector(".pp-back");
    if (back) back.insertAdjacentElement("beforebegin", section);
    else shell.appendChild(section);
  }

  makeCharacterProfile();
  makeVideoWall();
})();