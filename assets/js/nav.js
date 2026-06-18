const NAV_HTML=`<nav><div class="nav-inner"><a class="nav-brand" href="index.html"><img src="assets/venom-logo.jpg" alt="Texas Venom logo">Texas Venom <span>SELECT SOFTBALL</span></a><div class="nav-links"><a href="index.html">Home</a><a href="teams.html">Teams</a><a href="portal.html">Portal</a><a href="tournament-dashboard.html">Tournament</a><a href="standards.html">Standards</a><a href="coaching.html">Coaching</a><a href="team-info.html">Team Info</a><a href="about.html">About</a><a href="docs.html">Documents</a><a href="rallyiq.html">RallyIQ</a><a href="contact.html">Contact</a><a href="https://jeremiah9980.github.io/ncs-monitor/ncs-dashboard.html" target="_blank" rel="noopener noreferrer">NCS Dashboard</a><a href="fundraising.html">Support Us</a></div><button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="false"><i class="ti ti-sun-filled theme-icon-sun"></i><i class="ti ti-moon-filled theme-icon-moon"></i></button></div></nav>`;

function currentTheme(){const h=document.documentElement;if(h.classList.contains('theme-dark')||h.dataset.theme==='dark')return'dark';if(h.classList.contains('theme-light')||h.dataset.theme==='light')return'light';return matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'}

function setTheme(theme,persist=true){const next=theme==='dark'?'dark':'light',h=document.documentElement;h.classList.remove('theme-light','theme-dark');h.classList.add(`theme-${next}`);h.dataset.theme=next;h.style.colorScheme=next;if(persist)try{localStorage.setItem('venom-theme',next);localStorage.setItem('texas-venom-theme',next)}catch{}const b=document.querySelector('.theme-toggle');if(b){b.setAttribute('aria-pressed',String(next==='dark'));b.setAttribute('aria-label',`Switch to ${next==='dark'?'light':'dark'} mode`)}}

function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}

async function fixRosterPhotos(path){
  if(path!=='roster-12u.html'&&path!=='roster-12u')return;

  const aubrey=document.querySelector('img[alt="Aubrey Balcom"]');
  if(aubrey){
    aubrey.style.objectFit='contain';
    aubrey.style.objectPosition='center top';
    aubrey.style.background='#f3edff';
  }

  const johnny=document.querySelector('img[alt="Johnny Rogers"]');
  if(johnny){
    johnny.removeAttribute('onerror');
    johnny.style.removeProperty('display');
    johnny.parentElement?.classList.remove('no-photo');
    johnny.src='assets/players/johnny-r.svg?v=2';
  }

  try{
    await loadScript('assets/js/kassidy-image-1.js?v=1');
    await loadScript('assets/js/kassidy-image-2.js?v=1');
    await loadScript('assets/js/kassidy-image-3.js?v=1');
    const kassidy=document.querySelector('img[alt="Kassidy Cargill"]');
    if(kassidy&&window.KASSIDY_IMAGE_PARTS?.length===3){
      kassidy.removeAttribute('onerror');
      kassidy.style.removeProperty('display');
      kassidy.parentElement?.classList.remove('no-photo');
      kassidy.style.objectFit='cover';
      kassidy.style.objectPosition='center 24%';
      kassidy.src='data:image/jpeg;base64,'+window.KASSIDY_IMAGE_PARTS.join('');
    }
  }catch(error){console.warn('Unable to load Kassidy roster image',error)}
}

setTheme(currentTheme(),false);

document.addEventListener('DOMContentLoaded',()=>{
  document.body.insertAdjacentHTML('afterbegin',NAV_HTML);
  const path=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-links a').forEach(a=>{if(a.getAttribute('href')===path||(path==='portal'&&a.getAttribute('href')==='portal.html'))a.classList.add('active')});
  fixRosterPhotos(path);
  setTheme(currentTheme(),false);
  document.querySelector('.theme-toggle')?.addEventListener('click',()=>setTheme(currentTheme()==='dark'?'light':'dark'));
});