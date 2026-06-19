(() => {
  function instagramEmbed(containerId, profileUrl, label) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const quote = document.createElement('blockquote');
    quote.className = 'instagram-media';
    quote.dataset.instgrmPermalink = `${profileUrl}?utm_source=ig_embed&utm_campaign=loading`;
    quote.dataset.instgrmVersion = '14';
    quote.style.cssText = 'background:#fff;border:0;border-radius:12px;box-shadow:none;margin:0;max-width:540px;min-width:280px;padding:0;width:100%;';

    const fallback = document.createElement('div');
    fallback.className = 'social-embed-fallback';
    fallback.innerHTML = `<div><i class="ti ti-brand-instagram"></i><strong>${label}</strong><p>Instagram will load the live profile here. Privacy settings or content blockers may prevent the embedded view.</p><a class="social-btn social-btn-instagram" href="${profileUrl}" target="_blank" rel="noopener noreferrer">View Profile</a></div>`;
    quote.appendChild(fallback);
    container.appendChild(quote);
  }

  function facebookEmbed(containerId, profileUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const iframe = document.createElement('iframe');
    const encoded = encodeURIComponent(profileUrl);
    iframe.className = 'social-facebook-frame';
    iframe.title = 'Texas Venom Facebook page';
    iframe.loading = 'lazy';
    iframe.src = `https://www.facebook.com/plugins/page.php?href=${encoded}&tabs=timeline&width=500&height=560&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
    iframe.setAttribute('allowfullscreen', 'true');
    container.appendChild(iframe);
  }

  instagramEmbed('team-instagram-embed', 'https://www.instagram.com/texas_venom_softball/', 'Texas Venom on Instagram');
  instagramEmbed('coach-instagram-embed', 'https://www.instagram.com/chris_bm_89/', 'Coach Chris on Instagram');
  facebookEmbed('team-facebook-embed', 'https://www.facebook.com/profile.php?id=61578371575821');

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.instagram.com/embed.js';
  script.onload = () => window.instgrm?.Embeds?.process();
  document.body.appendChild(script);
})();