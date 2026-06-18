/* ============================================================
   nav.js — injects the site nav and wires the theme toggle.
   Theme INIT is handled by an inline <script> in <head> of each
   page (prevents FOUC). This file only handles the toggle UI.
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
    <button class="theme-toggle" type="button" aria-label="Toggle light/dark theme" title="Toggle theme">
      <i class="ti ti-sun-filled theme-icon-sun"></i>
      <i class="ti ti-moon-filled theme-icon-moon"></i>
    </button>
  </div>
</nav>`;

function setTheme(theme) {
  const html = document.documentElement;
  html.classList.remove('theme-light', 'theme-dark');
  html.classList.add('theme-' + theme);
  try { localStorage.setItem('venom-theme', theme); } catch (e) { /* private mode */ }
}

function toggleTheme() {
  const current = document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

  // Highlight active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Wire the theme toggle
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);

  // Follow OS preference changes if user hasn't explicitly chosen
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem('venom-theme')) {
          setTheme(e.matches ? 'dark' : 'light');
          // Remove the auto-set so the system can keep tracking
          localStorage.removeItem('venom-theme');
        }
      } catch (_) {}
    });
  }
});
