/* ============================================================
   nav.js — shared Venom navigation and persistent Light/Dark toggle
   ============================================================ */

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
      <a href="docs.html">Documents</a>
      <a href="rallyiq.html">RallyIQ</a>
      <a href="contact.html">Contact</a>
      <a href="fundraising.html">Support Us</a>
    </div>
    <button class="theme-toggle" type="button" aria-label="Switch color theme" title="Switch color theme" aria-pressed="false">
      <i class="ti ti-sun-filled theme-icon-sun" aria-hidden="true"></i>
      <i class="ti ti-moon-filled theme-icon-moon" aria-hidden="true"></i>
    </button>
  </div>
</nav>`;

function currentTheme() {
  if (document.documentElement.classList.contains('theme-dark')) return 'dark';
  if (document.documentElement.classList.contains('theme-light')) return 'light';
  const dataTheme = document.documentElement.dataset.theme;
  if (dataTheme === 'dark' || dataTheme === 'light') return dataTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme, persist = true) {
  const next = theme === 'dark' ? 'dark' : 'light';
  const html = document.documentElement;
  html.classList.remove('theme-light', 'theme-dark');
  html.classList.add('theme-' + next);
  html.dataset.theme = next;
  html.style.colorScheme = next;
  if (persist) {
    try {
      localStorage.setItem('venom-theme', next);
      localStorage.setItem('texas-venom-theme', next);
    } catch (_) {}
  }
  const btn = document.querySelector('.theme-toggle');
  if (btn) {
    btn.setAttribute('aria-pressed', String(next === 'dark'));
    btn.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`);
    btn.setAttribute('title', `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`);
  }
}

function toggleTheme() {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

function loadRosterArtwork() {
  const swaps = [
    ['img[src$="kassidy-c.jpg"]', 'assets/players/kassidy-c.svg?v=3'],
    ['img[src$="johnny-r.jpg"]', 'assets/players/johnny-r.svg?v=2']
  ];
  swaps.forEach(([selector, source]) => {
    const image = document.querySelector(selector);
    if (!image) return;
    image.removeAttribute('onerror');
    image.style.removeProperty('display');
    image.parentElement?.classList.remove('no-photo');
    image.src = source;
  });
}

setTheme(currentTheme(), false);

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path || (path === 'portal' && a.getAttribute('href') === 'portal.html')) {
      a.classList.add('active');
    }
  });

  loadRosterArtwork();

  const btn = document.querySelector('.theme-toggle');
  setTheme(currentTheme(), false);
  btn?.addEventListener('click', toggleTheme);

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', event => {
      try {
        if (!localStorage.getItem('venom-theme') && !localStorage.getItem('texas-venom-theme')) {
          setTheme(event.matches ? 'dark' : 'light', false);
        }
      } catch (_) {}
    });
  }
});
