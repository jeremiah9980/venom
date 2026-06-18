(() => {
  const THEME_KEY = 'texas-venom-theme';
  const validThemes = ['light', 'dark'];

  function preferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (validThemes.includes(saved)) return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function ensureThemeStyles() {
    if (document.getElementById('venom-theme-modes')) return;
    const link = document.createElement('link');
    link.id = 'venom-theme-modes';
    link.rel = 'stylesheet';
    link.href = 'assets/css/theme-modes.css?v=20260618';
    document.head.appendChild(link);
  }

  function updateThemeColor(theme) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme === 'dark' ? '#08040D' : '#F7F5FA';
  }

  function applyTheme(theme, persist = true) {
    const nextTheme = validThemes.includes(theme) ? theme : 'light';
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    updateThemeColor(nextTheme);
    if (persist) localStorage.setItem(THEME_KEY, nextTheme);

    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const nextMode = nextTheme === 'dark' ? 'light' : 'dark';
    const icon = button.querySelector('.theme-toggle-icon');
    const label = button.querySelector('.theme-toggle-label');
    if (icon) icon.textContent = nextTheme === 'dark' ? '☾' : '☀';
    if (label) label.textContent = nextTheme === 'dark' ? 'Dark' : 'Light';
    button.dataset.theme = nextTheme;
    button.setAttribute('aria-label', `Switch to ${nextMode} mode`);
    button.setAttribute('title', `Switch to ${nextMode} mode`);
    button.setAttribute('aria-pressed', String(nextTheme === 'dark'));
  }

  ensureThemeStyles();
  applyTheme(preferredTheme(), false);

  const NAV_HTML = `
  <nav>
    <div class="nav-inner">
      <a class="nav-brand" href="index.html">
        <img src="assets/venom-logo.jpg" alt="Texas Venom logo">
        Texas Venom <span>SELECT SOFTBALL</span>
      </a>
      <div class="nav-links">
        <a href="index.html">Home</a>
        <a href="teams.html">Teams</a>
        <a href="portal.html">Portal</a>
        <a href="standards.html">Standards</a>
        <a href="coaching.html">Coaching</a>
        <a href="team-info.html">Team Info</a>
        <a href="about.html">About</a>
        <a href="board.html">Board</a>
        <a href="bylaws.html">Bylaws</a>
        <a href="finances.html">Finances</a>
        <a href="policies.html">Policies</a>
        <a href="docs.html">Documents</a>
        <a href="rallyiq.html">RallyIQ</a>
        <a href="contact.html">Contact</a>
        <a href="fundraising.html">Support Us</a>
      </div>
      <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle color theme" aria-pressed="false">
        <span class="theme-toggle-icon" aria-hidden="true">☀</span>
        <span class="theme-toggle-label">Light</span>
      </button>
    </div>
  </nav>`;

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      if (link.getAttribute('href') === path) link.classList.add('active');
    });

    const button = document.getElementById('theme-toggle');
    applyTheme(document.documentElement.dataset.theme || preferredTheme(), false);
    button?.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  });
})();
