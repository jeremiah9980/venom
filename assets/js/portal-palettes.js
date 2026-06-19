(() => {
  const palettes = [
    {id:'powder',name:'Powder Venom',note:'Powder · purple · yellow',colors:['#DCEEFF','#5B2A86','#FFD84D']},
    {id:'lavender',name:'Lavender Strike',note:'Lavender · violet · neon',colors:['#EEE7FF','#6D28D9','#D7FF33']},
    {id:'midnight',name:'Midnight Gold',note:'Deep plum · violet · gold',colors:['#12081F','#7C3AED','#FACC15']},
    {id:'slate-orchid',name:'Slate Orchid',note:'Purple gray · orchid · butter',colors:['#D8D4E3','#7E22CE','#FDE68A']},
    {id:'ice-plum',name:'Ice Plum',note:'Ice blue · plum · sunflower',colors:['#E7F3FF','#4C1D95','#FFC928']}
  ];

  function applyPalette(id){
    const selected = palettes.some(p => p.id === id) ? id : 'powder';
    document.documentElement.dataset.portalPalette = selected;
    document.body.classList.add('palette-demo');
    try { localStorage.setItem('venom-portal-palette', selected); } catch (_) {}
    document.querySelectorAll('.portal-palette-btn').forEach(btn => {
      const active = btn.dataset.palette === selected;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function buildDock(){
    const dock = document.createElement('aside');
    dock.className = 'portal-palette-dock';
    dock.setAttribute('aria-label','Portal color scheme demos');
    dock.innerHTML = `
      <div class="portal-palette-head">
        <div class="portal-palette-title"><i class="ti ti-palette"></i> UI Color Demos</div>
        <button class="portal-palette-close" type="button" aria-label="Hide palette selector"><i class="ti ti-x"></i></button>
      </div>
      <div class="portal-palette-grid">
        ${palettes.map(p => `<button class="portal-palette-btn" type="button" data-palette="${p.id}" aria-pressed="false">
          <span class="portal-palette-swatches">${p.colors.map(c => `<i style="background:${c}"></i>`).join('')}</span>
          <span class="portal-palette-label">${p.name}<small>${p.note}</small></span>
        </button>`).join('')}
      </div>`;

    const trigger = document.createElement('button');
    trigger.className = 'portal-palette-trigger';
    trigger.type = 'button';
    trigger.innerHTML = '<i class="ti ti-palette"></i> Color Demos';

    document.body.append(dock, trigger);
    dock.querySelectorAll('.portal-palette-btn').forEach(btn => btn.addEventListener('click', () => applyPalette(btn.dataset.palette)));
    dock.querySelector('.portal-palette-close').addEventListener('click', () => dock.classList.add('is-hidden'));
    trigger.addEventListener('click', () => dock.classList.remove('is-hidden'));

    let saved = 'powder';
    try { saved = localStorage.getItem('venom-portal-palette') || 'powder'; } catch (_) {}
    applyPalette(saved);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildDock);
  else buildDock();
})();
