(() => {
  const originalFetch = window.fetch.bind(window);
  const TEAM_URL = 'https://www.playncs.com/fastpitch/Teams/Details/73839/texas-venom';
  const SCHEDULE_URL = 'https://www.playncs.com/fastpitch/Events/Schedule/12287/3p-sports-dingers-for-dads-6gg?division=12U%20OPEN';

  const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const isVenom = game => [game?.home?.name, game?.away?.name].some(name => norm(name).includes('texas venom'));

  function normalizeGame(game) {
    const copy = {...game};
    const text = String(copy.source_text || '');
    const number = text.match(/\bGame\s+(\d+)\b/i);
    const day = text.match(/\b(Sat|Sun)\b/i);
    const venue = text.match(/\b([A-Za-z][A-Za-z ]*(?:Athletic Complex|Sports Complex|Sports Park|Ball Park|Ballpark|Complex|Fields?)\s*#?\s*\d+)\b/i);
    if (number) copy.game_number = Number(number[1]);
    if (!copy.date && day) copy.date = day[1][0].toUpperCase() + day[1].slice(1).toLowerCase();
    if (!copy.field && venue) copy.field = venue[1].replace(/\s+/g, ' ').trim();
    return copy;
  }

  function normalizeData(data) {
    const games = (data.games || []).map(normalizeGame).sort((a, b) => {
      const stage = Number(a.stage === 'bracket') - Number(b.stage === 'bracket');
      return stage || (a.game_number || 9999) - (b.game_number || 9999);
    });
    data.games = games;
    data.team_games = games.filter(isVenom);
    if (games.length) data.sync_message = `Loaded ${games.length} division game(s), including ${data.team_games.length} Texas Venom game(s), from NCS.`;

    const existing = data.upcoming_tournaments || [];
    const current = existing.find(item => item.id === 12287) || {};
    data.upcoming_tournaments = [
      {
        ...current,
        id: 12287,
        name: '3P Sports Dingers for Dads 6GG',
        dates: 'Jun 20–21',
        location: current.location || 'Taylor / Lorena, TX',
        division: '12U OPEN',
        registered_teams: current.registered_teams || 58,
        url: SCHEDULE_URL
      },
      {
        id: null,
        name: '3P Sports 2nd Annual Double Play Derby — OPEN & C-CLASS',
        dates: 'Jun 27–28',
        location: 'Taylor, TX',
        division: '10U / 12U / 14U',
        registered_teams: 32,
        url: TEAM_URL
      }
    ];
    return data;
  }

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const input = String(args[0] || '');
    if (!input.includes('ncs-tournament.json') || !response.ok) return response;
    try {
      const data = normalizeData(await response.clone().json());
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}
      });
    } catch (error) {
      console.warn('Tournament feed normalization skipped:', error);
      return response;
    }
  };
})();
