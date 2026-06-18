(() => {
  'use strict';

  const DATA_URL = 'assets/data/ncs-tournament.json';
  const CENTRAL_TZ = 'America/Chicago';
  const state = { data: null, filter: 'all', refreshTimer: null, countdownTimer: null };
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
    if (Number.isNaN(date.getTime())) return 'Awaiting first sync';
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
    const dotClass = status === 'live' ? '' : status === 'stale' ? 'stale' : 'waiting';
    const title = status === 'live' ? 'NCS Schedule Connected' : status === 'stale' ? 'Showing Last Successful Sync' : 'Waiting for NCS Schedule';
    $('sync-status').innerHTML = `
      <div class="status-line"><span class="live-dot ${dotClass}"></span><div class="status-title">${title}</div></div>
      <p class="status-copy">${esc(data.sync_message || '')}</p>
      <div class="sync-meta">
        <span><i class="ti ti-refresh"></i> Last sync: ${esc(formatSync(data.generated_at))}</span>
        <a href="${esc(data.event?.source_url)}" target="_blank" rel="noopener noreferrer"><i class="ti ti-external-link"></i> Open official NCS schedule</a>
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
    const games = filteredGames(data);
    const out = $('division-scoreboard');
    if (!games.length) {
      out.innerHTML = `<div class="dashboard-empty"><i class="ti ti-scoreboard"></i><h3>No games available</h3><p>The 12U OPEN scoreboard will appear here as soon as the official NCS schedule is available.</p></div>`;
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
    const bracket = data.bracket || { published: false, rounds: [] };
    const out = $('bracket-board');
    if (!bracket.published || !Array.isArray(bracket.rounds) || !bracket.rounds.length) {
      out.innerHTML = `<div class="bracket-locked"><div><i class="ti ti-lock"></i><h3>Bracket board locked</h3><p>NCS has not published the 12U OPEN elimination bracket yet. The board will unlock automatically and begin updating every score once bracket games are posted.</p><a class="btn-primary" href="${esc(data.event?.source_url)}" target="_blank" rel="noopener noreferrer">Check NCS <i class="ti ti-external-link"></i></a></div></div>`;
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
    const start = new Date(`${data.event?.start_date || '2026-06-20'}T00:00:00-05:00`);
    const end = new Date(`${data.event?.end_date || '2026-06-21'}T23:59:59-05:00`);
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
        sub = 'Dingers for Dads is underway';
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
    $('event-name').textContent = data.event?.name || 'NCS Tournament';
    $('event-location').textContent = data.event?.location || 'Taylor / Lorena, TX';
    $('event-division').textContent = data.event?.division || '12U OPEN';
    $('event-dates').textContent = 'June 20–21, 2026';
    renderStatus(data);
    renderStats(data);
    renderTeamGames(data);
    renderScoreboard(data);
    renderBracket(data);
    renderUpcoming(data);
    startCountdown(data);
  }

  async function load() {
    try {
      const response = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Tournament feed returned ${response.status}`);
      render(await response.json());
    } catch (error) {
      console.error(error);
      $('sync-status').innerHTML = `<div class="status-line"><span class="live-dot stale"></span><div class="status-title">Dashboard feed unavailable</div></div><p class="status-copy">${esc(error.message)}</p>`;
    }
  }

  document.querySelectorAll('.dashboard-tab').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.dashboard-tab').forEach(item => item.classList.toggle('active', item === button));
      state.filter = button.dataset.filter || 'all';
      if (state.data) renderScoreboard(state.data);
    });
  });

  $('manual-refresh')?.addEventListener('click', load);
  load();
  state.refreshTimer = setInterval(load, 60000);
})();
