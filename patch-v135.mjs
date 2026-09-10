import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.35.0';
if(!fs.existsSync(FILE)) throw new Error('SWOS Studio v1.35.0 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.34.0</title>')) throw new Error('SWOS Studio v1.35.0 build failed: expected v1.34.0 generated output was not found.');

html=html.replace('<title>SWOS Studio v1.34.0</title>','<title>SWOS Studio v1.35.0</title>');
html=html.replace("document.title='SWOS Studio v1.34.0';","document.title='SWOS Studio v1.35.0';");
html=html.replace("el.textContent=el.textContent.replace('v1.33.0','v1.34.0')","el.textContent=el.textContent.replace('v1.33.0','v1.35.0')");

const css=`
<style id="swos-v135-db-styles">
  .football-db-card{border:1px solid rgba(88,166,255,.55);background:linear-gradient(180deg,rgba(88,166,255,.10),rgba(9,20,33,.96));border-radius:14px;padding:14px;margin:14px 0;box-shadow:var(--shadow)}
  .football-db-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.football-db-head strong{font-size:15px}.football-db-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}
  .football-db-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:11px}.football-db-stat{border:1px solid var(--line);background:#07111f;border-radius:10px;padding:10px}.football-db-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase;letter-spacing:.07em}.football-db-stat strong{display:block;font-size:15px;margin-top:3px;line-height:1.2}.football-db-stat span{display:block;color:var(--muted);font-size:8px;margin-top:3px;line-height:1.35}
  .football-db-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.football-db-actions .btn{min-height:42px;font-size:10px;padding:8px 10px}
  .football-db-note{border:1px dashed rgba(245,213,71,.48);background:rgba(245,213,71,.05);border-radius:10px;padding:9px;margin-top:10px;font-size:9px;color:var(--muted);line-height:1.45}.football-db-note strong{color:#ffe978}
  .football-db-check{font-size:8px;color:var(--muted);margin-top:8px;line-height:1.4}.football-db-check.ok{color:#8effbc}.football-db-check.warn{color:#ffe978}.football-db-check.error{color:#ffb7bc}
  .db-version-strip{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid rgba(38,61,92,.65);font-size:8px;color:var(--muted)}.db-version-strip b{color:var(--text)}
  .feedback-row{display:flex;gap:7px;align-items:center;justify-content:space-between;margin-top:10px;padding-top:9px;border-top:1px solid rgba(38,61,92,.65)}.feedback-row span{font-size:9px;color:var(--muted);line-height:1.35}.feedback-row .btn{min-height:36px;padding:7px 9px;font-size:9px;white-space:nowrap}
  .db-detail-list{display:grid;gap:6px;margin-top:8px}.db-detail-row{display:flex;justify-content:space-between;gap:12px;border-top:1px solid rgba(38,61,92,.55);padding-top:6px;font-size:9px}.db-detail-row:first-child{border-top:0;padding-top:0}.db-detail-row span{color:var(--muted)}.db-detail-row b{text-align:right}
  @media(max-width:520px){.football-db-grid,.football-db-actions{grid-template-columns:1fr}.feedback-row{align-items:flex-start;flex-direction:column}.feedback-row .btn{width:100%}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v135-db-layer">
(function(){
  'use strict';
  var BUILD='v1.35.0';
  var MANIFEST_URL='football-db/manifest.json';
  var CHECK_KEY='swos-football-db-last-check-v1';
  var manifestPromise=null;
  var manifestCache=null;
  var lastError='';

  var FALLBACK={
    schemaVersion:1,
    databaseId:'england-modern',
    version:'2026.27-foundation.1',
    season:'2026/27',
    publishedAt:'2026-09-10',
    minimumStudioVersion:'1.35.0',
    status:'foundation',
    coverage:{englandClubs:{target:92,mapped:92},premierLeague:{clubs:20,officialSeniorRegistrations:462,identityReadyClubs:10,researchPackClubs:5}},
    installation:{teamWriteReady:false,careerWriteReady:false}
  };

  function clean(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  function getChecked(){try{return JSON.parse(localStorage.getItem(CHECK_KEY)||'null');}catch(e){return null;}}
  function setChecked(m){try{localStorage.setItem(CHECK_KEY,JSON.stringify({version:m.version,publishedAt:m.publishedAt,checkedAt:new Date().toISOString()}));}catch(e){}}
  function prettyDate(v){if(!v)return '—';try{return new Date(v+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});}catch(e){return v;}}
  function checkedText(){var x=getChecked();if(!x||!x.checkedAt)return 'Not checked on this device yet';try{return 'Last checked '+new Date(x.checkedAt).toLocaleString();}catch(e){return 'Checked previously';}}

  async function loadManifest(force){
    if(force)manifestPromise=null;
    if(manifestPromise)return manifestPromise;
    manifestPromise=(async function(){
      try{
        var url=MANIFEST_URL+(force?('?t='+Date.now()):'');
        var r=await fetch(url,{cache:'no-store'});
        if(!r.ok)throw new Error('HTTP '+r.status);
        var m=await r.json();
        if(!m||!m.version||!m.databaseId)throw new Error('Invalid manifest');
        manifestCache=m;lastError='';return m;
      }catch(e){
        lastError=String(e&&e.message||e);manifestCache=FALLBACK;return FALLBACK;
      }
    })();
    return manifestPromise;
  }

  function detailHtml(m){
    var c=m.coverage||{},eng=c.englandClubs||{},pl=c.premierLeague||{},inst=m.installation||{};
    return '<div class="db-detail-list">'+
      '<div class="db-detail-row"><span>Database ID</span><b>'+clean(m.databaseId||'—')+'</b></div>'+
      '<div class="db-detail-row"><span>Schema</span><b>v'+clean(m.schemaVersion||1)+'</b></div>'+
      '<div class="db-detail-row"><span>Season</span><b>'+clean(m.season||'—')+'</b></div>'+
      '<div class="db-detail-row"><span>Published</span><b>'+clean(prettyDate(m.publishedAt))+'</b></div>'+
      '<div class="db-detail-row"><span>England structure</span><b>'+clean(eng.mapped||0)+' / '+clean(eng.target||92)+' clubs mapped</b></div>'+
      '<div class="db-detail-row"><span>PL senior registrations</span><b>'+clean(pl.officialSeniorRegistrations||0)+'</b></div>'+
      '<div class="db-detail-row"><span>PL identity coverage</span><b>'+clean(pl.identityReadyClubs||0)+' / '+clean(pl.clubs||20)+' clubs</b></div>'+
      '<div class="db-detail-row"><span>PL research packs</span><b>'+clean(pl.researchPackClubs||0)+' / '+clean(pl.clubs||20)+' clubs</b></div>'+
      '<div class="db-detail-row"><span>TEAM.* installation</span><b>'+(inst.teamWriteReady?'Ready':'Under Construction')+'</b></div>'+
      '<div class="db-detail-row"><span>Existing career injection</span><b>'+(inst.careerWriteReady?'Ready':'Locked')+'</b></div>'+
    '</div>';
  }

  async function buildCard(){
    var open=document.getElementById('openSeasonSquads');
    var heading=Array.from(document.querySelectorAll('h1')).find(function(h){return /Premier League 2026\/27|Update SWOS|England.*update/i.test(h.textContent||'');});
    if(!open&&!heading){var old=document.getElementById('v135-football-db-card');if(old)old.remove();return;}
    var m=await loadManifest(false),c=m.coverage||{},eng=c.englandClubs||{},pl=c.premierLeague||{};
    var existing=document.getElementById('v135-football-db-card');
    var card=existing||document.createElement('section');card.id='v135-football-db-card';card.className='football-db-card';
    card.innerHTML='<div class="football-db-head"><div><strong>⚽ Football Database</strong><p>Studio software and real-world football data are now treated as two separate versions. This is the update channel that will eventually let the app stay installed while football data changes independently.</p></div><span class="feature-status beta">Beta</span></div>'+
      '<div class="football-db-grid">'+
        '<div class="football-db-stat"><small>Studio software</small><strong>'+BUILD+'</strong><span>Editor and Career+ features</span></div>'+
        '<div class="football-db-stat"><small>Published football data</small><strong>'+clean(m.season||'—')+' · '+clean(m.version||'—')+'</strong><span>Published '+clean(prettyDate(m.publishedAt))+'</span></div>'+
        '<div class="football-db-stat"><small>England structure</small><strong>'+clean(eng.mapped||0)+' / '+clean(eng.target||92)+'</strong><span>Mapped club slots</span></div>'+
        '<div class="football-db-stat"><small>Premier League evidence</small><strong>'+clean(pl.identityReadyClubs||0)+' / '+clean(pl.clubs||20)+' identity</strong><span>'+clean(pl.researchPackClubs||0)+' research packs · '+clean(pl.officialSeniorRegistrations||0)+' senior registrations</span></div>'+
      '</div>'+
      '<div class="football-db-note"><strong>Important:</strong> checking the published football database does not write to TEAM.* or an existing .CAR. The one-tap 92-club installer remains Under Construction until the full dataset and write safety gate are ready.</div>'+
      '<div class="football-db-actions"><button class="btn btn-blue" id="v135CheckDb">Check published data</button><button class="btn" id="v135DbDetails">Database details</button></div>'+
      '<div id="v135DbCheck" class="football-db-check '+(lastError?'warn':'')+'">'+(lastError?'Using the bundled manifest because the published manifest could not be reached. ':'')+clean(checkedText())+'</div>'+
      '<details id="v135DbDetailsPanel" style="display:none;margin-top:9px"><summary>Published database manifest</summary>'+detailHtml(m)+'</details>';
    if(!existing){
      var target=open?open.closest('.update-stage'):null;
      if(target)target.insertAdjacentElement('beforebegin',card);
      else if(heading)heading.insertAdjacentElement('afterend',card);
    }
    var check=document.getElementById('v135CheckDb');if(check)check.onclick=async function(){
      check.disabled=true;check.textContent='Checking…';
      var fresh=await loadManifest(true);setChecked(fresh);lastError=lastError||'';
      await buildCard();
      var line=document.getElementById('v135DbCheck');if(line){line.className='football-db-check '+(lastError?'warn':'ok');line.textContent=lastError?'Published manifest could not be reached; bundled '+fresh.version+' is still available.':'Published data checked. Current version: '+fresh.version+'.';}
    };
    var details=document.getElementById('v135DbDetails');if(details)details.onclick=function(){var p=document.getElementById('v135DbDetailsPanel');if(!p)return;p.style.display=p.style.display==='none'?'block':'none';details.textContent=p.style.display==='none'?'Database details':'Hide details';};
  }

  async function updateHome(){
    var panel=document.getElementById('v133-build-status-panel');if(!panel)return;
    var versionBadge=panel.querySelector('.build-status-head>.feature-status.beta');if(versionBadge)versionBadge.textContent=BUILD;
    var m=await loadManifest(false);
    var strip=document.getElementById('v135-db-version-strip');if(!strip){strip=document.createElement('div');strip.id='v135-db-version-strip';strip.className='db-version-strip';panel.appendChild(strip);}
    strip.innerHTML='<span><b>Studio</b> '+BUILD+'</span><span>•</span><span><b>Football data</b> '+clean(m.season||'—')+' · '+clean(m.version||'—')+'</span>';
    var future=Array.from(document.querySelectorAll('.future-card')).find(function(card){var s=card.querySelector('strong');return s&&/One-tap Football Data Update/i.test(s.textContent||'');});
    if(future){var p=future.querySelector('p');if(p)p.textContent='Published database manifest is now live in Beta. One-tap installation into TEAM.* remains Under Construction until the full 92-club data and safety gate are ready.';}
    var feedback=document.getElementById('v135-feedback-row');if(!feedback){feedback=document.createElement('div');feedback.id='v135-feedback-row';feedback.className='feedback-row';feedback.innerHTML='<span>Found something wrong or want to suggest an improvement?</span><button class="btn" id="v135Feedback">Report a problem</button>';panel.appendChild(feedback);}
    var btn=document.getElementById('v135Feedback');if(btn)btn.onclick=function(){window.open('https://github.com/jmeasom81-cmd/SWOS-Editor/issues/new','_blank','noopener');};
  }

  function releaseNotes(){
    if(document.getElementById('v135-release-card'))return;
    var anchor=document.getElementById('v134-release-card')||document.getElementById('v1331-release-card')||document.getElementById('v133-release-card');
    if(!anchor)return;
    var card=document.createElement('div');card.id='v135-release-card';card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.35.0 — Separate Football Database channel</strong><span class="about">• Studio software and football data now have separate visible versions.</span><span class="about">• Added a published database manifest that can be updated independently of the main app build.</span><span class="about">• Update SWOS can check the current published data version without touching TEAM.* or a career file.</span><span class="about">• Added manifest details for the 92-club England structure, Premier League registration/identity/research coverage and write-safety status.</span><span class="about">• Added a public Report a problem route for live-user feedback.</span><span class="about">• One-tap 92-club installation remains deliberately Under Construction; no new binary write routines are enabled.</span>';
    anchor.insertAdjacentElement('beforebegin',card);
  }

  function apply(){
    document.title='SWOS Studio '+BUILD;
    document.querySelectorAll('.eyebrow').forEach(function(el){var t=el.textContent||'';if(/v1\.3[234]\.[01]/.test(t)||t.indexOf('v1.34.0')>=0)el.textContent=t.replace(/v1\.3[234]\.[01]/,BUILD);});
    releaseNotes();updateHome();buildCard();
  }
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){Promise.resolve(apply()).finally(function(){queued=false;});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
console.log('Built SWOS Studio '+BUILD+' separate Football Database channel.');
