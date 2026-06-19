const NAV_HTML=`<nav><div class="nav-inner"><a class="nav-brand" href="index.html"><img src="assets/venom-logo.jpg" alt="Texas Venom logo">Texas Venom <span>SELECT SOFTBALL</span></a><div class="nav-links"><a href="index.html">Home</a><a href="teams.html">Teams</a><a href="portal.html">Portal</a><a href="tournament-dashboard.html">Tournament</a><a href="standards.html">Standards</a><a href="team-info.html">Team Info</a><a href="rallyiq.html">RallyIQ</a><a href="https://jeremiah9980.github.io/ncs-monitor/ncs-dashboard.html" target="_blank" rel="noopener noreferrer">NCS Dashboard</a><a href="fundraising.html">Support Us</a></div><div class="theme-switcher" role="group" aria-label="Color theme"><button type="button" class="theme-option" data-theme-value="light">Light</button><button type="button" class="theme-option" data-theme-value="mid">Mid</button><button type="button" class="theme-option" data-theme-value="dark">Dark</button></div></div></nav>`;

function currentTheme(){
  const saved=localStorage.getItem('venom-theme');
  return ['light','mid','dark'].includes(saved)?saved:'mid';
}

function setTheme(theme,persist=true){
  const next=['light','mid','dark'].includes(theme)?theme:'mid';
  const h=document.documentElement;
  h.classList.remove('theme-light','theme-mid','theme-dark');
  h.classList.add(`theme-${next}`);
  h.dataset.theme=next;
  h.style.colorScheme=next==='dark'?'dark':'light';
  if(persist){
    try{
      localStorage.setItem('venom-theme',next);
      localStorage.setItem('texas-venom-theme',next);
    }catch{}
  }
  document.querySelectorAll('.theme-option').forEach(btn=>{
    const active=btn.dataset.themeValue===next;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(active));
  });
}

function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}

function loadStylesheet(href){if(document.querySelector(`link[href="${href}"]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}

function showRosterImage(image,source,options={}){
  if(!image)return;
  image.removeAttribute('onerror');
  image.style.removeProperty('display');
  image.parentElement?.classList.remove('no-photo');
  image.style.objectFit=options.objectFit||'cover';
  if(options.objectPosition)image.style.objectPosition=options.objectPosition;
  image.src=source;
}

async function fixRosterPhotos(path){
  if(path!=='roster-12u.html'&&path!=='roster-12u')return;

  const aubrey=document.querySelector('img[alt="Aubrey Balcom"]');
  if(aubrey){
    aubrey.style.objectFit='contain';
    aubrey.style.objectPosition='center top';
    aubrey.style.background='#f3edff';
  }

  showRosterImage(document.querySelector('img[alt="Kynsington Elliott"]'),'kynsi-e.jpg?v=20260618-5');
  showRosterImage(document.querySelector('img[alt="Hadley Wiegers"]'),'hadley-w.jpg?v=20260618-5');
  showRosterImage(document.querySelector('img[alt="Saraya Palmer"]'),'saraya-p.jpg?v=20260618-5');
  showRosterImage(document.querySelector('img[alt="Johnny Rogers"]'),'assets/players/johnny-r.svg?v=3');

  const kassidy=document.querySelector('img[alt="Kassidy Cargill"]');
  try{
    await loadScript('assets/js/kassidy-image-1.js?v=2');
    await loadScript('assets/js/kassidy-image-2.js?v=2');
    await loadScript('assets/js/kassidy-image-3.js?v=2');
    if(kassidy&&window.KASSIDY_IMAGE_PARTS?.length===3){
      showRosterImage(kassidy,'data:image/jpeg;base64,'+window.KASSIDY_IMAGE_PARTS.join(''),{objectPosition:'center 24%'});
    }else{
      showRosterImage(kassidy,'assets/players/kassidy-c.svg?v=3');
    }
  }catch(error){
    showRosterImage(kassidy,'assets/players/kassidy-c.svg?v=3');
    console.warn('Unable to load Kassidy roster image parts; using SVG fallback',error);
  }
}

function linkRosterProfiles(path){
  if(path!=='roster-12u.html'&&path!=='roster-12u')return;
  const profiles={
    'Penny Bridgewaters':'penny-b.html',
    'Aubrey Balcom':'aubrey-b.html',
    'Kynsington Elliott':'kynsi-e.html',
    'Gracelyn Welch':'gracie-w.html',
    'Hadley Wiegers':'hadley-w.html',
    'Kassidy Cargill':'kassidy-c.html',
    'Addison Popkoff':'addison-p.html',
    'Saraya Palmer':'saraya-p.html',
    'Payton Riser':'payton-r.html',
    'Johnny Rogers':'johnny-r.html',
    'Emily Lambdin':'emily-l.html'
  };

  if(!document.getElementById('player-profile-link-styles')){
    const style=document.createElement('style');
    style.id='player-profile-link-styles';
    style.textContent='.player-profile-link{display:inline-flex;align-items:center;gap:7px;margin-top:13px;font-family:var(--display);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.35px;color:var(--primary);text-decoration:none}.player-profile-link:hover{text-decoration:underline}html[data-theme="dark"] .player-profile-link{color:var(--accent)}';
    document.head.appendChild(style);
  }

  document.querySelectorAll('.player-card').forEach(card=>{
    const image=card.querySelector('.player-photo img');
    const href=profiles[image?.alt];
    const body=card.querySelector('.player-body');
    if(!href||!body||body.querySelector('.player-profile-link'))return;
    const link=document.createElement('a');
    link.className='player-profile-link';
    link.href=href;
    link.innerHTML='<i class="ti ti-id"></i> View Player Profile';
    body.appendChild(link);
  });
}

loadStylesheet('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');
loadStylesheet('assets/css/ncs-mid-theme.css?v=20260619-2');
setTheme(currentTheme(),false);

document.addEventListener('DOMContentLoaded',()=>{
  document.body.insertAdjacentHTML('afterbegin',NAV_HTML);
  document.querySelectorAll('a[href="coaching.html"],a[href="about.html"]').forEach(a=>a.remove());
  const path=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-links a').forEach(a=>{if(a.getAttribute('href')===path||(path==='portal'&&a.getAttribute('href')==='portal.html'))a.classList.add('active')});
  fixRosterPhotos(path);
  linkRosterProfiles(path);
  setTheme(currentTheme(),false);
  document.querySelectorAll('.theme-option').forEach(btn=>btn.addEventListener('click',()=>setTheme(btn.dataset.themeValue)));
});