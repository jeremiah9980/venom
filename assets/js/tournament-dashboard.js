(() => {
  'use strict';

  const TEAM_CONFIGS = {
    '12u': {
      dataUrl: 'assets/data/ncs-tournament.json',
      label: '12U OPEN',
      teamPageUrl: 'https://www.playncs.com/Fastpitch/Teams/Details/87660/texas-venom-12u',
      defaultDivision: '12U OPEN',
    },
    '14u': {
      dataUrl: 'assets/data/ncs-tournament-14u.json',
      label: '14U',
      teamPageUrl: 'https://www.playncs.com/fastpitch/Teams/Details/87549/texas-venom-14u',
      defaultDivision: '14U',
    },
  };

  const CENTRAL_TZ = 'America/Chicago';
  const state = { data: null, filter: 'all', team: '12u', refreshTimer: null, countdownTimer: null };
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function norm(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function isVenom(name) {
    const value = norm(name);
    return value === 'texas venom' || value.includes('texas venom');
  }

  function formatSync(timestamp) {
    const date = new Date(timestamp);
    if (!timestamp || Number.isNaN(date.getTime())) return 'Awaiting first sync';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: CENTRAL_TZ,
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(date) + ' CT';
  }

  function gameStatus(game) {
    const value = String(game.status || 'scheduled').toLowerCase();
    if (value === 'final') return 'Final';
    if (value === 'live') return 'Live';
    return 'Scheduled';
  }

  function teamRow(team, label = '') {
    const score = team?.score;
    const pending = score === null || score === undefined || score === '';
    return `<div class="team-row ${isVenom(team?.name) ? 'venom' : ''}">
      <div class="team-name">${esc(team?.name || 'TBD')}${label ? `<small>${esc(label)}</small>` : ''}</div>
      <div class="team-score ${pending ? 'pending' : ''}">${pending ? '—' : esc(score)}</div>
    </div>`;
  }

  function gameCard(game, compact = false) {
    const status = String(game.status || 'scheduled').toLowerCase();
    const venomGame = isVenom(game.home?.name) || isVenom(game.away?.name);
    return `<article class="${compact ? 'bracket-game' : 'game-card'} ${venomGame ? 'team-game' : ''} ${status}">
      <div class="game-top">
        <div class="game-round">${esc(game.round || (game.stage === 'bracket' ? 'Bracket' : 'Pool Play'))}</div>
        <div class="game-when"><strong>${esc(game.time || 'Time TBD')}</strong>${esc(game.date || '')}</div>
      </div>
      <div class="matchup">
        ${teamRow(game.home, isVenom(game.home?.name) ? 'Texas Venom' : '')}
        ${teamRow(game.away, isVenom(game.away?.name) ? 'Texas Venom' : '')}
      </div>
      <div class="game-bottom">
        <span class="game-status ${status}">${gameStatus(game)}</span>
        <span class="game-field">${esc(game.field || 'Field TBD')}</span>
      </div>
    </article>`;
  }

  function renderStatus(data) {
    const status = data.sync_status || 'waiting_for_schedule';
    const config = TEAM_CONFIGS[state.team];
    const dotClass = status === 'live' ? '' : status === 'stale' ? 'stale' : 'waiting';
    const title = status === 'live' ? 'NCS Schedule Connected' : status === 'stale' ? 'Showing Last Successful Sync' : 'Waiting for NCS Schedule';
    const sourceUrl = data.event?.source_url || config.teamPageUrl;
    $('sync-status').innerHTML = `
      <div class="status-line"><span class="live-dot ${dotClass}"></span><div class="status-title">${title}</div></div>
      <p class="status-copy">${esc(data.sync_message || '')}</p>
      <div class="sync-meta">
        <span><i class="ti ti-refresh"></i> Last sync: ${esc(formatSync(data.generated_at))}</span>
        <a href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer"><i class="ti ti-external-link"></i> Open NCS ${esc(config.label)} page</a>
      </div>`;
  }

  function renderStats(data) {
    const games = Array.isArray(data.games) ? data.games : [];
    const teamGames = Array.isArray(data.team_games) ? data.team_games : [];
    const poolGames = teamGames.filter(game => game.stage !== 'bracket');
    const finals = games.filter(game => game.status === 'final').length;
    $('stat-venom-games').textContent = teamGames.length;
    $('stat-pool-games').textContent = poolGames.length;
    $('stat-division-games').textContent = games.length;
    $('stat-finals').textContent = finals;
    $('stat-bracket').textContent = data.bracket?.published ? 'OPEN' : 'LOCKED';
  }

  function renderTeamGames(data) {
    const games = (data.team_games || []).filter(game => game.stage !== 'bracket');
    const container = $('venom-pool-games');
    if (!games.length) {
      container.innerHTML = `<div class="dashboard-empty"><i class="ti ti-calendar-clock"></i><h3>Pool schedule not posted yet</h3><p>This section will populate automatically with Texas Venom's pool opponents, game times, fields, and live scores as soon as NCS publishes them.</p></div>`;
      return;
    }
    container.innerHTML = games.map(game => gameCard(game)).join('');
  }

  function filteredGames(data) {
    const games = Array.isArray(data.games) ? data.games : [];
    if (state.filter === 'pool') return games.filter(game => game.stage !== 'bracket');
    if (state.filter === 'bracket') return games.filter(game => game.stage === 'bracket');
    if (state.filter === 'venom') return games.filter(game => isVenom(game.home?.name) || isVenom(game.away?.name));
    return games;
  }

  function renderScoreboard(data) {
    const config = TEAM_CONFIGS[state.team];
    const divisionLabel = data.event?.division || config.defaultDivision;
    const scoreBoardLabel = $('scoreboard-label');
    if (scoreBoardLabel) scoreBoardLabel.textContent = `${divisionLabel} Division`;

    const games = filteredGames(data);
    const out = $('division-scoreboard');
    if (!games.length) {
      out.innerHTML = `<div class="dashboard-empty"><i class="ti ti-scoreboard"></i><h3>No games available</h3><p>The ${esc(divisionLabel)} scoreboard will appear here as soon as the official NCS schedule is available.</p></div>`;
      return;
    }
    out.innerHTML = `<div class="scoreboard-wrap"><table class="scoreboard">
      <thead><tr><th>Date / Time</th><th>Round</th><th>Matchup</th><th>Field</th><th>Status</th><th>Score</th></tr></thead>
      <tbody>${games.map(game => {
        const venom = isVenom(game.home?.name) || isVenom(game.away?.name);
        const homeScore = game.home?.score ?? '—';
        const awayScore = game.away?.score ?? '—';
        return `<tr class="${venom ? 'venom-row' : ''}">
          <td>${esc(game.date || 'TBD')}<br><strong>${esc(game.time || 'Time TBD')}</strong></td>
          <td>${esc(game.round || (game.stage === 'bracket' ? 'Bracket' : 'Pool Play'))}</td>
          <td class="match">${esc(game.home?.name || 'TBD')}<br><span style="color:var(--g3);font-weight:500">vs.</span> ${esc(game.away?.name || 'TBD')}</td>
          <td>${esc(game.field || 'TBD')}</td>
          <td><span class="game-status ${esc(game.status || 'scheduled')}">${gameStatus(game)}</span></td>
          <td class="score">${esc(homeScore)}–${esc(awayScore)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  }

  function renderBracket(data) {
    const config = TEAM_CONFIGS[state.team];
    const sourceUrl = data.event?.source_url || config.teamPageUrl;
    const bracket = data.bracket || { published: false, rounds: [] };
    const out = $('bracket-board');
    if (!bracket.published || !Array.isArray(bracket.rounds) || !bracket.rounds.length) {
      out.innerHTML = `<div class="bracket-locked"><div><i class="ti ti-lock"></i><h3>Bracket board locked</h3><p>NCS has not published the ${esc(config.label)} elimination bracket yet. The board will unlock automatically once bracket games are posted.</p><a class="btn-primary" href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">Check NCS <i class="ti ti-external-link"></i></a></div></div>`;
      return;
    }
    out.innerHTML = `<div class="bracket-board">${bracket.rounds.map(round => `
      <section class="bracket-round"><h3 class="round-title">${esc(round.name || 'Bracket')}</h3><div class="round-games">${(round.games || []).map(game => gameCard(game, true)).join('')}</div></section>
    `).join('')}</div>`;
  }

  function renderUpcoming(data) {
    const events = Array.isArray(data.upcoming_tournaments) ? data.upcoming_tournaments : [];
    const out = $('upcoming-tournaments');
    if (!events.length) {
      out.innerHTML = '<div class="dashboard-empty"><h3>No upcoming events found</h3><p>The sync will continue checking the Texas Venom NCS team page.</p></div>';
      return;
    }
    out.innerHTML = events.map(event => `<a class="upcoming-card" href="${esc(event.url)}" target="_blank" rel="noopener noreferrer">
      <div class="upcoming-date">${esc(event.dates || 'Date TBD')}</div>
      <h3>${esc(event.name)}</h3>
      <div class="upcoming-meta">
        <span><i class="ti ti-map-pin"></i>${esc(event.location || 'Location TBD')}</span>
        <span><i class="ti ti-ball-baseball"></i>${esc(event.division || 'Divisions TBD')}</span>
        ${event.registered_teams ? `<span><i class="ti ti-users"></i>${esc(event.registered_teams)} teams</span>` : ''}
      </div>
    </a>`).join('');
  }

  function startCountdown(data) {
    clearInterval(state.countdownTimer);
    const startStr = data.event?.start_date;
    const endStr = data.event?.end_date;
    if (!startStr || !endStr) {
      $('countdown-value').textContent = '—';
      $('countdown-sub').textContent = 'No tournament scheduled yet';
      return;
    }
    const start = new Date(`${startStr}T00:00:00-05:00`);
    const end = new Date(`${endStr}T23:59:59-05:00`);
    const eventName = data.event?.name || 'Tournament';
    const tick = () => {
      const now = new Date();
      let value = '';
      let sub = '';
      if (now < start) {
        const diff = start - now;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        value = `${days}d ${hours}h ${minutes}m`;
        sub = 'until tournament weekend';
      } else if (now <= end) {
        value = 'GAME ON';
        sub = `${eventName} is underway`;
      } else {
        value = 'COMPLETE';
        sub = 'final results remain available below';
      }
      $('countdown-value').textContent = value;
      $('countdown-sub').textContent = sub;
    };
    tick();
    state.countdownTimer = setInterval(tick, 30000);
  }

  function render(data) {
    state.data = data;
    const config = TEAM_CONFIGS[state.team];
    const eventName = data.event?.name || `Texas Venom ${config.label} Tournament`;
    $('event-name').textContent = eventName;
    $('event-location').textContent = data.event?.location || '—';
    $('event-division').textContent = data.event?.division || config.defaultDivision;
    $('event-dates').textContent = data.event?.start_date
      ? (data.event.start_date === data.event.end_date
          ? new Date(`${data.event.start_date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : `${new Date(`${data.event.start_date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${new Date(`${data.event.end_date}T12:00:00`).toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`)
      : '—';
    renderStatus(data);
    renderStats(data);
    renderTeamGames(data);
    renderScoreboard(data);
    renderBracket(data);
    renderUpcoming(data);
    startCountdown(data);
  }

  // Position the team-switcher bar below the sticky nav
  function adjustSwitcherTop() {
    const nav = document.querySelector('nav');
    const bar = document.querySelector('.team-switcher-bar');
    if (nav && bar) bar.style.top = nav.offsetHeight + 'px';
  }

  async function load() {
    // Capture team at call time; discard response if a newer switch has happened
    const team = state.team;
    const config = TEAM_CONFIGS[team];
    try {
      const response = await fetch(`${config.dataUrl}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Tournament feed returned ${response.status}`);
      if (team !== state.team) return; // stale — a different team was selected while fetching
      render(await response.json());
    } catch (error) {
      if (team !== state.team) return;
      console.error(error);
      $('sync-status').innerHTML = `<div class="status-line"><span class="live-dot stale"></span><div class="status-title">Dashboard feed unavailable</div></div><p class="status-copy">${esc(error.message)}</p>`;
    }
  }

  // Team switcher
  document.querySelectorAll('.team-tab').forEach(button => {
    button.addEventListener('click', () => {
      const team = button.dataset.team;
      if (team === state.team) return;
      state.team = team;
      state.filter = 'all';
      document.querySelectorAll('.team-tab').forEach(tab => {
        tab.classList.toggle('active', tab === button);
        tab.setAttribute('aria-pressed', String(tab === button));
      });
      // Reset scoreboard filter tabs
      document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.filter === 'all'));
      load();
    });
  });

  // Scoreboard filter tabs
  document.querySelectorAll('.dashboard-tab').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.dashboard-tab').forEach(item => item.classList.toggle('active', item === button));
      state.filter = button.dataset.filter || 'all';
      if (state.data) renderScoreboard(state.data);
    });
  });

  $('manual-refresh')?.addEventListener('click', load);

  // Adjust switcher position once nav is rendered, then on resize
  adjustSwitcherTop();
  window.addEventListener('resize', adjustSwitcherTop);

  load();
  state.refreshTimer = setInterval(load, 60000);
})();
