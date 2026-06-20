const NAV_HTML=`<nav><div class="nav-inner"><a class="nav-brand" href="index.html"><img src="assets/venom-logo.jpg" alt="Texas Venom logo">Texas Venom <span>SELECT SOFTBALL</span></a><div class="nav-links"><a href="index.html">Home</a><a href="teams.html">Teams</a><a href="portal.html">Portal</a><a href="tournament-dashboard.html">Tournament</a><a href="standards.html">Standards</a><a href="team-info.html">Team Info</a><a href="rallyiq.html">RallyIQ</a><a href="https://jeremiah9980.github.io/ncs-monitor/ncs-dashboard.html" target="_blank" rel="noopener noreferrer">NCS Dashboard</a><a href="fundraising.html">Support Us</a></div><div class="theme-switcher" role="group" aria-label="Color theme"><button type="button" class="theme-option" data-theme-value="light">Light</button><button type="button" class="theme-option" data-theme-value="mid">Mid</button><button type="button" class="theme-option" data-theme-value="dark">Dark</button></div></div></nav>`;

function loadGoogleAnalytics(){
  if(document.querySelector('script[data-venom-ga="G-3K836ZGQPE"]'))return;
  const external=document.createElement('script');
  external.async=true;
  external.src='https://www.googletagmanager.com/gtag/js?id=G-3K836ZGQPE';
  external.dataset.venomGa='G-3K836ZGQPE';
  document.head.appendChild(external);

  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag('js',new Date());
  window.gtag('config','G-3K836ZGQPE');
}

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

function injectRosterStats(path){
  if(path!=='roster-12u.html'&&path!=='roster-12u')return;
  const stats={
    'Penny Bridgewaters':{avg:'.441',obp:'.542',ops:'1.254',sb:'12',note:'36 GP • 26 H • 28 RBI • 33 R'},
    'Aubrey Balcom':{avg:'.522',obp:'.645',ops:'1.341',sb:'13',note:'37 GP • 24 H • 18 RBI • 23 R'},
    'Kynsington Elliott':{avg:'.431',obp:'.663',ops:'1.114',sb:'40',note:'38 GP • 22 H • 7 RBI • 47 R'},
    'Gracelyn Welch':{avg:'.407',obp:'.548',ops:'1.159',sb:'9',note:'38 GP • 22 H • 26 RBI • 29 R'},
    'Hadley Wiegers':{avg:'.295',obp:'.449',ops:'.777',sb:'11',note:'38 GP • 18 H • 22 RBI • 27 R'},
    'Addison Popkoff':{avg:'.485',obp:'.595',ops:'1.232',sb:'11',note:'38 GP • 32 H • 32 RBI • 34 R'},
    'Saraya Palmer':{avg:'.407',obp:'.508',ops:'1.045',sb:'5',note:'38 GP • 22 H • 18 RBI • 21 R'},
    'Payton Riser':{avg:'.222',obp:'32',ops:'46',sb:'36',labels:['AVG','GP','PA','AB'],note:'Partial line shown from collected screenshots.'},
    'Emily Lambdin':{avg:'.300',obp:'.553',ops:'.987',sb:'10',note:'31 GP • 9 H • 11 RBI • 11 R'}
  };

  if(!document.getElementById('roster-stats-styles')){
    const style=document.createElement('style');
    style.id='roster-stats-styles';
    style.textContent='.player-stats{margin-top:14px;padding-top:14px;border-top:1px solid var(--g4)}.stats-label{margin-bottom:9px;color:var(--blue2);font-family:var(--body);font-size:9px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase}.stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.stat{padding:8px 7px;border:1px solid var(--g4);border-radius:6px;background:linear-gradient(180deg,#fff,#fbf9f3);text-align:center}.stat strong{display:block;color:var(--blue);font-family:var(--display);font-size:17px;line-height:1}.stat span{display:block;margin-top:4px;color:var(--muted);font-family:var(--body);font-size:8px;font-weight:900;letter-spacing:1px;text-transform:uppercase}.stat-note{margin-top:10px;color:var(--muted);font-family:var(--body);font-size:10px;font-weight:700;line-height:1.35}html.theme-dark .player-stats,html[data-theme="dark"] .player-stats{border-color:#43364a}html.theme-dark .stat,html[data-theme="dark"] .stat{background:#120d16;border-color:#43364a}html.theme-dark .stat span,html[data-theme="dark"] .stat span,html.theme-dark .stat-note,html[data-theme="dark"] .stat-note{color:#cfc6d8}@media(max-width:640px){.stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}';
    document.head.appendChild(style);
  }

  document.querySelectorAll('.player-card').forEach(card=>{
    const name=card.querySelector('.player-name')?.textContent?.trim();
    const body=card.querySelector('.player-body');
    if(!name||!body||body.querySelector('.player-stats'))return;
    const s=stats[name];
    const wrap=document.createElement('div');
    wrap.className='player-stats';
    if(s){
      const labels=s.labels||['AVG','OBP','OPS','SB'];
      wrap.innerHTML=`<div class="stats-label">Spring 2026 Batting</div><div class="stat-grid"><div class="stat"><strong>${s.avg}</strong><span>${labels[0]}</span></div><div class="stat"><strong>${s.obp}</strong><span>${labels[1]}</span></div><div class="stat"><strong>${s.ops}</strong><span>${labels[2]}</span></div><div class="stat"><strong>${s.sb}</strong><span>${labels[3]}</span></div></div><div class="stat-note">${s.note}</div>`;
    }else if(name==='Kassidy Cargill'||name==='Johnny Rogers'){
      wrap.innerHTML='<div class="stats-label">Stats Pending</div><div class="stat-note">No matching Spring 2026 Venom stat line was included in the collected screenshots.</div>';
    }else{
      return;
    }
    const profileLink=body.querySelector('.player-profile-link');
    if(profileLink)body.insertBefore(wrap,profileLink);else body.appendChild(wrap);
  });
}

function updateFooterStaff(){
  const footer=document.querySelector('footer');
  if(!footer)return;

  let staff=footer.querySelector('.footer-coaching-staff');
  if(!staff){
    staff=document.createElement('div');
    staff.className='footer-coaching-staff';
    footer.appendChild(staff);
  }

  staff.textContent='Head Coach: Chris Balcom • Ast Coach: Jameson Riser · Welch';

  if(!document.getElementById('footer-coaching-staff-styles')){
    const style=document.createElement('style');
    style.id='footer-coaching-staff-styles';
    style.textContent='.footer-coaching-staff{width:100%;margin-top:14px;padding-top:14px;border-top:1px solid rgba(198,255,0,.18);text-align:center;font-family:var(--display);font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:var(--venom-silver)}';
    document.head.appendChild(style);
  }
}

loadGoogleAnalytics();
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
  injectRosterStats(path);
  updateFooterStaff();
  setTheme(currentTheme(),false);
  document.querySelectorAll('.theme-option').forEach(btn=>btn.addEventListener('click',()=>setTheme(btn.dataset.themeValue)));
});