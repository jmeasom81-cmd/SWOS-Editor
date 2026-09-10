import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.46.0';

for(const file of [FILE,PACKS,COVERAGE,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));

if(!html.includes('<title>SWOS Studio v1.45.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.45.0 output was not found.`);
if(packs.packCount!==6||packs.playerCount!==96)throw new Error(`SWOS Studio ${BUILD} build failed: expected 6 packs / 96 players; found ${packs.packCount} / ${packs.playerCount}.`);
const chelseaPack=packs.clubs?.chelsea;
if(!chelseaPack||Object.keys(chelseaPack.players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Chelsea 16-player research pack is missing or incomplete.`);
if(coverage?.summary?.researchReady!==6||coverage?.summary?.swos16BuilderReady!==6)throw new Error(`SWOS Studio ${BUILD} build failed: coverage did not advance to 6 research/SWOS16-ready clubs.`);
const chelseaCoverage=(coverage.clubs||[]).find(c=>c.id==='chelsea');
if(chelseaCoverage?.stages?.researchPack?.status!=='ready'||chelseaCoverage?.stages?.swos16?.status!=='builder-ready')throw new Error(`SWOS Studio ${BUILD} build failed: Chelsea coverage stages are not ready.`);
if(manifest.version!=='2026.27-foundation.6')throw new Error(`SWOS Studio ${BUILD} build failed: expected database 2026.27-foundation.6; found ${manifest.version}.`);

const nextResearch=(coverage.clubs||[])
  .filter(c=>c.stages?.identity?.status==='ready'&&c.stages?.researchPack?.status!=='ready')
  .sort((a,b)=>a.division-b.division||a.name.localeCompare(b.name))[0];
if(nextResearch?.id!=='everton')throw new Error(`SWOS Studio ${BUILD} build failed: expected Everton as next research-pack task; found ${nextResearch?.name||'none'}.`);

html=html.replace('<title>SWOS Studio v1.45.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
html=html.replaceAll("var BUILD='v1.45.0';",`var BUILD='${BUILD}';`);

const css=String.raw`
<style id="swos-v146-data-expansion-styles">
  .v146-data-expansion{border:1px solid rgba(66,209,132,.46);background:linear-gradient(180deg,rgba(66,209,132,.075),rgba(7,17,31,.985));border-radius:13px;padding:12px;margin:10px 0;box-shadow:var(--shadow)}
  .v146-data-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.v146-data-head strong{font-size:14px}.v146-data-head p{margin:4px 0 0;color:var(--muted);font-size:9px;line-height:1.45}
  .v146-data-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.v146-data-stat{border:1px solid var(--line);background:#07111f;border-radius:9px;padding:8px}.v146-data-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase}.v146-data-stat b{display:block;font-size:13px;margin-top:3px}.v146-data-stat.good b{color:var(--green)}.v146-data-stat.next b{color:#caa7ff}
  .v146-data-foot{margin-top:8px;color:var(--muted);font-size:8px;line-height:1.45}.v146-data-foot b{color:var(--text)}
  @media(max-width:620px){.v146-data-grid{grid-template-columns:repeat(2,1fr)}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const meta={
  build:BUILD,
  databaseVersion:manifest.version,
  packs:packs.packCount,
  players:packs.playerCount,
  premierLeagueClubs:manifest.coverage?.premierLeague?.clubs||20,
  chelseaPlayers:Object.keys(chelseaPack.players||{}).length,
  nextResearch:{id:nextResearch.id,name:nextResearch.name},
  teamWriteReady:manifest.installation?.teamWriteReady===true,
  careerWriteReady:manifest.installation?.careerWriteReady===true
};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v146-data-expansion-layer">
(function(){
  'use strict';
  var BUILD='v1.46.0';
  var META=${embedded};
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function card(){
    var anchor=document.getElementById('v145-workbench')||document.getElementById('v144-coverage-centre');
    if(!anchor)return;
    var box=document.getElementById('v146-data-expansion');
    if(!box){box=document.createElement('section');box.id='v146-data-expansion';box.className='v146-data-expansion';anchor.insertAdjacentElement('beforebegin',box);}
    box.innerHTML='<div class="v146-data-head"><div><strong>⚽ Football Data Expansion</strong><p>The production queue is now advancing the actual 2026/27 database one club at a time. Published status comes only from validated data files.</p></div><span class="feature-status available">6th pack published</span></div>'+
      '<div class="v146-data-grid"><div class="v146-data-stat good"><small>Premier League packs</small><b>'+META.packs+' / '+META.premierLeagueClubs+'</b></div><div class="v146-data-stat"><small>Researched players</small><b>'+META.players+'</b></div><div class="v146-data-stat good"><small>Chelsea</small><b>'+META.chelseaPlayers+' / 16 ✓</b></div><div class="v146-data-stat next"><small>Next research pack</small><b>'+esc(META.nextResearch.name)+'</b></div></div>'+
      '<div class="v146-data-foot"><b>Database '+esc(META.databaseVersion)+':</b> Chelsea is now Research Ready and SWOS 16 Builder Ready. Summer arrivals retain current value/role evidence without being credited with another club’s 2025/26 output. TEAM.* and .CAR writes remain locked.</div>';
  }
  function releaseNotes(){
    if(document.getElementById('v146-release-card'))return;
    var anchor=document.getElementById('v145-release-card')||document.getElementById('v144-release-card');if(!anchor)return;
    var c=document.createElement('div');c.id='v146-release-card';c.className='card stack v133-release-card';
    c.innerHTML='<strong>New in v1.46.0 — Chelsea research pack + incremental club pipeline</strong><span class="about">• Chelsea becomes the sixth evidence-backed 16-player Premier League research pack, taking the published database to 96 researched players.</span><span class="about">• The Club Coverage Centre now marks Chelsea Research Ready and SWOS 16 Builder Ready directly from the published feed.</span><span class="about">• The Research Workbench automatically advances the next pack task to Everton.</span><span class="about">• New club packs can now be maintained as individual validated source files and merged into the authoritative feed during the build.</span><span class="about">• Summer arrivals do not inherit prior-club 2025/26 output as current-club statistics.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';
    anchor.insertAdjacentElement('beforebegin',c);
  }
  function apply(){document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;card();releaseNotes();}
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){try{apply();}finally{queued=false;}});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');

if(!html.includes('swos-v146-data-expansion-layer')||!html.includes('6th pack published'))throw new Error(`SWOS Studio ${BUILD} build failed: data-expansion UI was not installed.`);
if(!html.includes('<title>SWOS Studio v1.46.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title was not updated.`);
console.log(`SWOS Studio ${BUILD} Chelsea research expansion complete · ${packs.packCount} packs / ${packs.playerCount} players · next research pack ${nextResearch.name}.`);
