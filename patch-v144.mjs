import fs from 'node:fs';

const FILE='dist/index.html';
const COVERAGE_FILE='football-db/coverage.json';
const BUILD='v1.44.0';
if(!fs.existsSync(FILE))throw new Error('SWOS Studio v1.44.0 build failed: dist/index.html is missing.');
if(!fs.existsSync(COVERAGE_FILE))throw new Error('SWOS Studio v1.44.0 build failed: football-db/coverage.json is missing.');
let html=fs.readFileSync(FILE,'utf8');
const coverage=JSON.parse(fs.readFileSync(COVERAGE_FILE,'utf8'));
if(coverage?.summary?.totalClubs!==92)throw new Error(`SWOS Studio v1.44.0 build failed: coverage snapshot has ${coverage?.summary?.totalClubs||0}/92 clubs.`);
if(!html.includes('<title>SWOS Studio v1.43.0</title>'))throw new Error('SWOS Studio v1.44.0 build failed: expected v1.43.0 output was not found.');
html=html.replace('<title>SWOS Studio v1.43.0</title>','<title>SWOS Studio v1.44.0</title>');
html=html.replaceAll("var BUILD='v1.43.0';","var BUILD='v1.44.0';");

const css=String.raw`
<style id="swos-v144-coverage-styles">
  .coverage-centre{border:1px solid rgba(66,209,132,.45);background:linear-gradient(180deg,rgba(66,209,132,.065),rgba(7,17,31,.98));border-radius:14px;padding:14px;margin:14px 0;box-shadow:var(--shadow)}
  .coverage-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.coverage-head strong{font-size:15px}.coverage-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}
  .coverage-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:11px}.coverage-summary .cell{border:1px solid var(--line);background:#07111f;border-radius:10px;padding:9px;text-align:center}.coverage-summary small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase;letter-spacing:.04em}.coverage-summary b{display:block;font-size:15px;margin-top:3px}.coverage-summary span{display:block;color:var(--muted);font-size:7px;margin-top:2px}
  .coverage-progress{height:8px;border-radius:999px;background:#111f32;border:1px solid var(--line);overflow:hidden;margin-top:7px}.coverage-progress>i{display:block;height:100%;background:var(--green);min-width:0}
  .coverage-toolbar{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:11px}.coverage-search{height:42px;border-radius:10px;border:1px solid var(--line);background:#07111f;color:var(--text);padding:0 11px;outline:none}.coverage-search:focus{border-color:var(--green)}
  .coverage-filters{display:flex;gap:6px;overflow:auto;scrollbar-width:none;margin-top:8px;padding-bottom:3px}.coverage-filter{white-space:nowrap;border:1px solid var(--line);background:#07111f;color:var(--muted);border-radius:999px;padding:7px 9px;font-size:8px;font-weight:900}.coverage-filter.active{border-color:var(--green);color:var(--green);background:rgba(66,209,132,.08)}
  .coverage-queue{border:1px solid rgba(88,166,255,.4);background:rgba(88,166,255,.05);border-radius:10px;padding:10px;margin-top:10px}.coverage-queue strong{font-size:10px}.coverage-queue p{font-size:8px;color:var(--muted);line-height:1.4;margin:4px 0 0}.coverage-queue-items{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.coverage-queue-items span{border:1px solid var(--line);border-radius:999px;padding:4px 7px;font-size:7px;color:var(--blue);font-weight:900}
  .coverage-list-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:11px}.coverage-list-head strong{font-size:11px}.coverage-list-head span{font-size:8px;color:var(--muted)}
  .coverage-list{display:grid;gap:7px;margin-top:7px;max-height:570px;overflow:auto;padding-right:2px}.coverage-club{border:1px solid var(--line);background:#07111f;border-radius:10px;overflow:hidden}.coverage-club summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px;cursor:pointer}.coverage-club summary::-webkit-details-marker{display:none}.coverage-club-name{min-width:0}.coverage-club-name b{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.coverage-club-name span{display:block;color:var(--muted);font-size:7px;margin-top:2px}.coverage-stage-strip{display:flex;gap:4px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.coverage-stage{font-size:6px;font-weight:1000;border:1px solid var(--line);border-radius:999px;padding:3px 5px;color:var(--muted)}.coverage-stage.ready{border-color:rgba(66,209,132,.5);color:var(--green)}.coverage-stage.builder{border-color:rgba(88,166,255,.5);color:var(--blue)}.coverage-stage.locked{border-color:rgba(245,213,71,.45);color:var(--yellow)}
  .coverage-detail{border-top:1px solid var(--line);padding:9px}.coverage-detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.coverage-detail-item{border:1px solid rgba(38,61,92,.65);border-radius:8px;padding:7px}.coverage-detail-item small{display:block;color:var(--muted);font-size:6px;text-transform:uppercase}.coverage-detail-item b{display:block;font-size:9px;margin-top:2px}.coverage-next{font-size:8px;line-height:1.4;color:var(--muted);margin-top:7px}.coverage-next b{color:var(--blue)}
  .coverage-legend{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;font-size:7px;color:var(--muted)}.coverage-legend b{color:var(--text)}.coverage-safe{font-size:8px;color:var(--muted);line-height:1.45;margin-top:9px}.coverage-safe b{color:var(--green)}
  @media(max-width:620px){.coverage-summary{grid-template-columns:repeat(2,1fr)}.coverage-toolbar{grid-template-columns:1fr}.coverage-stage-strip{max-width:130px}.coverage-detail-grid{grid-template-columns:1fr 1fr}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const embedded=JSON.stringify(coverage).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v144-coverage-layer">
(function(){
  'use strict';
  var BUILD='v1.44.0';
  var BASE_COVERAGE=${embedded};
  var INSTALLED_KEY='swos-football-db-installed-v1';
  var filter='all',query='',expanded=false;
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function readInstalled(){try{return JSON.parse(localStorage.getItem(INSTALLED_KEY)||'null');}catch(e){return null;}}
  function researchCount(packs,id){var c=packs&&packs.clubs&&packs.clubs[id];return c?Object.keys(c.players||{}).length:0;}
  function liveCoverage(){
    var s=readInstalled();
    if(!s||s.season!==BASE_COVERAGE.season||!s.identities||!s.researchPacks)return BASE_COVERAGE;
    var clubs=BASE_COVERAGE.clubs.map(function(c){
      var x=JSON.parse(JSON.stringify(c)),ident=Array.isArray(s.identities.clubs&&s.identities.clubs[c.id])?s.identities.clubs[c.id].length:0,pack=researchCount(s.researchPacks,c.id),research=pack===16;
      x.stages.identity={status:ident>0?'ready':'pending',players:ident};
      x.stages.researchPack={status:research?'ready':pack>0?'attention':'pending',players:pack};
      x.stages.swos16={status:research?'builder-ready':'blocked',players:research?16:0};
      x.stages.installer={status:s.manifest&&s.manifest.installation&&s.manifest.installation.teamWriteReady===true?'review-required':'locked'};
      x.nextStep=ident===0?'Verify current squad identity':!research?'Build 16-player research pack':'Research manager, formation and kits';
      return x;
    });
    var summary=Object.assign({},BASE_COVERAGE.summary,{identityReady:clubs.filter(function(c){return c.stages.identity.status==='ready'}).length,researchReady:clubs.filter(function(c){return c.stages.researchPack.status==='ready'}).length,swos16BuilderReady:clubs.filter(function(c){return c.stages.swos16.status==='builder-ready'}).length,installerLocked:!(s.manifest&&s.manifest.installation&&s.manifest.installation.teamWriteReady===true)});
    summary.installerReady=summary.installerLocked?0:clubs.length;
    return Object.assign({},BASE_COVERAGE,{databaseVersion:s.version||BASE_COVERAGE.databaseVersion,clubs:clubs,summary:summary});
  }
  function matches(c){
    var q=query.trim().toLowerCase();if(q&&!(c.name.toLowerCase().includes(q)||c.divisionName.toLowerCase().includes(q)))return false;
    if(filter==='all')return true;
    if(filter.indexOf('div-')===0)return c.division===Number(filter.slice(4));
    if(filter==='identity')return c.stages.identity.status==='ready';
    if(filter==='research')return c.stages.researchPack.status==='ready';
    if(filter==='needs-work')return c.stages.researchPack.status!=='ready'||c.stages.manager.status!=='ready'||c.stages.kits.status!=='ready';
    return true;
  }
  function statusText(s,type){
    if(!s)return 'Pending';
    if(s.status==='ready')return type==='identity'?(s.players+' players verified'):type==='researchPack'?(s.players+' researched players'):'Ready';
    if(s.status==='builder-ready')return '16-player builder ready';
    if(s.status==='attention')return (s.players||0)+' players · needs review';
    if(s.status==='locked')return 'Locked for safety';
    if(s.status==='review-required')return 'Review required before writes';
    if(s.status==='blocked')return 'Waiting for research pack';
    return 'Pending';
  }
  function stagePill(label,s){var cls=s&&s.status==='ready'?'ready':s&&s.status==='builder-ready'?'builder':s&&s.status==='locked'?'locked':'';var mark=s&&s.status==='ready'?'✓':s&&s.status==='builder-ready'?'◉':s&&s.status==='locked'?'🔒':'·';return '<span class="coverage-stage '+cls+'">'+mark+' '+esc(label)+'</span>';}
  function clubHtml(c){return '<details class="coverage-club"><summary><div class="coverage-club-name"><b>'+esc(c.name)+'</b><span>'+esc(c.divisionName)+'</span></div><div class="coverage-stage-strip">'+stagePill('ID',c.stages.identity)+stagePill('PACK',c.stages.researchPack)+stagePill('16',c.stages.swos16)+stagePill('INSTALL',c.stages.installer)+'</div></summary><div class="coverage-detail"><div class="coverage-detail-grid"><div class="coverage-detail-item"><small>Identity</small><b>'+esc(statusText(c.stages.identity,'identity'))+'</b></div><div class="coverage-detail-item"><small>Research pack</small><b>'+esc(statusText(c.stages.researchPack,'researchPack'))+'</b></div><div class="coverage-detail-item"><small>SWOS 16</small><b>'+esc(statusText(c.stages.swos16,'swos16'))+'</b></div><div class="coverage-detail-item"><small>Manager</small><b>'+esc(statusText(c.stages.manager,'manager'))+'</b></div><div class="coverage-detail-item"><small>Formation</small><b>'+esc(statusText(c.stages.formation,'formation'))+'</b></div><div class="coverage-detail-item"><small>Kits</small><b>'+esc(statusText(c.stages.kits,'kits'))+'</b></div><div class="coverage-detail-item"><small>Installer</small><b>'+esc(statusText(c.stages.installer,'installer'))+'</b></div><div class="coverage-detail-item"><small>Division</small><b>'+esc(c.divisionName)+'</b></div></div><div class="coverage-next"><b>Next step:</b> '+esc(c.nextStep)+'</div></div></details>';}
  function summaryCell(label,value,total,sub){var pct=total?Math.max(0,Math.min(100,(value/total)*100)):0;return '<div class="cell"><small>'+esc(label)+'</small><b>'+esc(value)+' / '+esc(total)+'</b><span>'+esc(sub)+'</span><div class="coverage-progress"><i style="width:'+pct.toFixed(2)+'%"></i></div></div>';}
  function queueHtml(data){var rows=data.clubs.filter(function(c){return c.stages.identity.status==='ready'&&c.stages.researchPack.status!=='ready'}).sort(function(a,b){return a.name.localeCompare(b.name)});if(!rows.length)return '';return '<div class="coverage-queue"><strong>Closest to the next research stage</strong><p>These clubs already have verified identity foundations but do not yet have a complete 16-player research pack.</p><div class="coverage-queue-items">'+rows.map(function(c){return '<span>'+esc(c.name)+'</span>';}).join('')+'</div></div>';}
  function filterButtons(){return [['all','All 92'],['div-0','Premier League'],['div-1','Championship'],['div-2','League One'],['div-3','League Two'],['identity','Identity ready'],['research','Research ready'],['needs-work','Needs work']].map(function(x){return '<button type="button" class="coverage-filter '+(filter===x[0]?'active':'')+'" data-coverage-filter="'+x[0]+'">'+x[1]+'</button>';}).join('');}
  function draw(){
    var anchor=document.getElementById('v143-db-manager')||document.getElementById('v141-db-update');if(!anchor)return;
    var data=liveCoverage(),rows=data.clubs.filter(matches),s=data.summary;
    var card=document.getElementById('v144-coverage-centre');if(!card){card=document.createElement('section');card.id='v144-coverage-centre';card.className='coverage-centre';anchor.insertAdjacentElement('afterend',card);}
    card.innerHTML='<div class="coverage-head"><div><strong>🏟 Club Coverage Centre</strong><p>The build pipeline for every club in the England 2026/27 structure. Statuses are generated from Studio\'s real club structure and football-data feeds — not manually ticked off.</p></div><span class="feature-status beta">BETA</span></div>'+
      '<div class="coverage-summary">'+summaryCell('England structure',s.structureMapped,92,'mapped clubs')+summaryCell('Identity ready',s.identityReady,92,'verified club identities')+summaryCell('Research ready',s.researchReady,92,'16-player evidence packs')+summaryCell('SWOS 16',s.swos16BuilderReady,92,'builder-ready clubs')+'</div>'+
      queueHtml(data)+
      '<div class="coverage-toolbar"><input id="v144CoverageSearch" class="coverage-search" value="'+esc(query)+'" placeholder="Search 92 clubs…" aria-label="Search club coverage"><button class="btn" id="v144Expand">'+(expanded?'Collapse rows':'Expand visible rows')+'</button></div>'+
      '<div class="coverage-filters">'+filterButtons()+'</div>'+
      '<div class="coverage-list-head"><strong>'+esc(rows.length)+' clubs shown</strong><span>Football DB '+esc(data.databaseVersion||'built-in')+' · '+esc(data.season)+'</span></div>'+
      '<div class="coverage-list">'+rows.map(clubHtml).join('')+'</div>'+
      '<div class="coverage-legend"><span><b>✓</b> source stage ready</span><span><b>◉</b> SWOS 16 builder ready</span><span><b>·</b> work pending</span><span><b>🔒</b> binary installation locked</span></div>'+
      '<div class="coverage-safe"><b>Planning layer only.</b> Manager, formation and kit stages remain pending until separately researched. “SWOS 16 ready” means the 16-player research pack can enter the existing builder — it does not mean TEAM.* installation is enabled.</div>';
    var search=document.getElementById('v144CoverageSearch');if(search){search.oninput=function(){query=this.value;draw();var n=document.getElementById('v144CoverageSearch');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length);}};}
    card.querySelectorAll('[data-coverage-filter]').forEach(function(b){b.onclick=function(){filter=this.getAttribute('data-coverage-filter')||'all';draw();};});
    var ex=document.getElementById('v144Expand');if(ex)ex.onclick=function(){expanded=!expanded;card.querySelectorAll('.coverage-club').forEach(function(d){d.open=expanded;});ex.textContent=expanded?'Collapse rows':'Expand visible rows';};
    if(expanded)card.querySelectorAll('.coverage-club').forEach(function(d){d.open=true;});
  }
  function releaseNotes(){
    if(document.getElementById('v144-release-card'))return;
    var anchor=document.getElementById('v143-release-card')||document.getElementById('v142-release-card');if(!anchor)return;
    var card=document.createElement('div');card.id='v144-release-card';card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.44.0 — Club Coverage Centre</strong><span class="about">• Studio now tracks the full 92-club England rebuild as one visible production pipeline: 20 Premier League + 24 Championship + 24 League One + 24 League Two.</span><span class="about">• Club status is generated from the actual 2026/27 structure, verified identity feed and published research packs rather than manually maintained completion flags.</span><span class="about">• Search and filters show identity-ready clubs, research-ready clubs, each division or every club still needing work.</span><span class="about">• Each club exposes its next safe build step, while manager, formation and kit work remains explicitly pending.</span><span class="about">• SWOS 16 builder readiness is kept separate from TEAM.* installation. Binary installation remains locked.</span>';
    anchor.insertAdjacentElement('beforebegin',card);
  }
  function apply(){document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;releaseNotes();draw();}
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){try{apply();}finally{queued=false;}});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(function(){if((document.getElementById('v143-db-manager')||document.getElementById('v141-db-update'))&&!document.getElementById('v144-coverage-centre'))queue();}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('storage',function(e){if(e.key===INSTALLED_KEY&&document.getElementById('v144-coverage-centre'))draw();});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');

fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v144-coverage-layer')||!html.includes('Club Coverage Centre')||!html.includes('All 92')||!html.includes('SWOS 16 builder ready'))throw new Error('SWOS Studio v1.44.0 build failed: Club Coverage Centre was not installed.');
console.log(`SWOS Studio ${BUILD} Club Coverage Centre build complete · ${coverage.summary.totalClubs} clubs · ${coverage.summary.identityReady} identity ready · ${coverage.summary.researchReady} research ready.`);
