const NAV_HTML = `
<nav>
  <div class="nav-inner">
    <a class="nav-brand" href="index.html">
      <img src="assets/venom-logo.jpg" alt="Texas Venom logo">
      Texas Venom <span>SELECT SOFTBALL</span>
    </a>
    <div class="nav-links">
      <a href="index.html">Home</a>
      <a href="about.html">About</a>
      <a href="board.html">Board</a>
      <a href="coaching.html">Coaching</a>
      <a href="bylaws.html">Bylaws</a>
      <a href="finances.html">Finances</a>
      <a href="policies.html">Policies</a>
      <a href="docs.html">Documents</a>
      <a href="fundraising.html">Support Us</a>
      <a href="rallyiq.html">RallyIQ</a>
      <a href="contact.html">Contact</a>
    </div>
  </div>
</nav>`;
document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', NAV_HTML);
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (path.endsWith(a.getAttribute('href').split('/').pop())) a.classList.add('active');
  });
});
