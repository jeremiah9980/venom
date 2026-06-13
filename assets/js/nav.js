const THEME_STORAGE_KEY = 'texas-venom-theme';

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (persist) localStorage.setItem(THEME_STORAGE_KEY, theme);

  const button = document.getElementById('theme-toggle');
  if (!button) return;

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
  button.setAttribute('title', `Switch to ${nextTheme} mode`);
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  button.querySelector('.theme-toggle-icon').innerHTML = theme === 'dark'
    ? '<i class="ti ti-sun"></i>'
    : '<i class="ti ti-moon"></i>';
  button.querySelector('.theme-toggle-label').textContent = theme === 'dark' ? 'Light' : 'Dark';
}

applyTheme(getPreferredTheme());

if (!document.querySelector('link[data-venom-theme-modes]')) {
  const modeStyles = document.createElement('link');
  modeStyles.rel = 'stylesheet';
  modeStyles.href = 'assets/css/theme-modes.css';
  modeStyles.dataset.venomThemeModes = 'true';
  document.head.appendChild(modeStyles);
}

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
    <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Switch color theme">
      <span class="theme-toggle-icon" aria-hidden="true"></span>
      <span class="theme-toggle-label">Theme</span>
    </button>
  </div>
</nav>`;

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  const button = document.getElementById('theme-toggle');
  button.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || getPreferredTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark', true);
  });

  applyTheme(document.documentElement.dataset.theme || getPreferredTheme());
});
