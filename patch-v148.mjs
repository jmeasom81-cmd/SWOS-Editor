import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.48.0';

for(const file of [FILE,PACKS,COVERAGE,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));

if(!html.includes('<title>SWOS Studio v1.47.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.47.0 output was not found.`);
if(packs.packCount!==8||packs.playerCount!==128)throw new Error(`SWOS Studio ${BUILD} build failed: expected 8 packs / 128 players; found ${packs.packCount} / ${packs.playerCount}.`);
const newcastlePack=packs.clubs?.newcastle;
if(!newcastlePack||Object.keys(newcastlePack.players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Newcastle United 16-player research pack is missing or incomplete.`);
if(coverage?.summary?.researchReady!==8||coverage?.summary?.swos16BuilderReady!==8)throw new Error(`SWOS Studio ${BUILD} build failed: coverage did not advance to 8 research/SWOS16-ready clubs.`);
const newcastleCoverage=(coverage.clubs||[]).find(c=>c.id==='newcastle');
if(newcastleCoverage?.stages?.researchPack?.status!=='ready'||newcastleCoverage?.stages?.swos16?.status!=='builder-ready')throw new Error(`SWOS Studio ${BUILD} build failed: Newcastle United coverage stages are not ready.`);
if(manifest.version!=='2026.27-foundation.8')throw new Error(`SWOS Studio ${BUILD} build failed: expected database 2026.27-foundation.8; found ${manifest.version}.`);

const nextResearch=(coverage.clubs||[])
  .filter(c=>c.stages?.identity?.status==='ready'&&c.stages?.researchPack?.status!=='ready')
  .sort((a,b)=>a.division-b.division||a.name.localeCompare(b.name))[0];
if(nextResearch?.id!=='nottingham-forest')throw new Error(`SWOS Studio ${BUILD} build failed: expected Nottingham Forest as next research-pack task; found ${nextResearch?.name||'none'}.`);

html=html.replace('<title>SWOS Studio v1.47.0</title>',`<title>SWOS Studio ${BUILD}</title>`);

const meta={
  build:BUILD,
  databaseVersion:manifest.version,
  packs:packs.packCount,
  players:packs.playerCount,
  premierLeagueClubs:manifest.coverage?.premierLeague?.clubs||20,
  newcastlePlayers:Object.keys(newcastlePack.players||{}).length,
  nextResearch:{id:nextResearch.id,name:nextResearch.name},
  teamWriteReady:manifest.installation?.teamWriteReady===true,
  careerWriteReady:manifest.installation?.careerWriteReady===true
};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v148-newcastle-expansion-layer">
(function(){
  'use strict';
  var BUILD='v1.48.0';
  var META=${embedded};
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function render(){
    var anchor=document.getElementById('v145-workbench')||document.getElementById('v144-coverage-centre');
    if(!anchor)return false;
    var box=document.getElementById('v146-data-expansion');
    if(!box){box=document.createElement('section');box.id='v146-data-expansion';box.className='v146-data-expansion';anchor.insertAdjacentElement('beforebegin',box);}
    box.innerHTML='<div class="v146-data-head"><div><strong>⚽ Football Data Expansion</strong><p>The production queue is expanding the actual 2026/27 database club by club. Every ready status is generated from validated research files.</p></div><span class="feature-status available">Newcastle United pack published</span></div>'+
      '<div class="v146-data-grid"><div class="v146-data-stat good"><small>Premier League packs</small><b>'+META.packs+' / '+META.premierLeagueClubs+'</b></div><div class="v146-data-stat"><small>Researched players</small><b>'+META.players+'</b></div><div class="v146-data-stat good"><small>Newcastle United</small><b>'+META.newcastlePlayers+' / 16 ✓</b></div><div class="v146-data-stat next"><small>Next research pack</small><b>'+esc(META.nextResearch.name)+'</b></div></div>'+
      '<div class="v146-data-foot"><b>Database '+esc(META.databaseVersion)+':</b> Newcastle United is now Research Ready and SWOS 16 Builder Ready. The post-window first-team squad supersedes earlier summer snapshots. Summer arrivals keep current value/role evidence without inheriting another club’s 2025/26 output. TEAM.* and .CAR writes remain locked.</div>';
    if(!document.getElementById('v148-release-card')){
      var relAnchor=document.getElementById('v147-release-card')||document.getElementById('v146-release-card')||document.getElementById('v145-release-card')||document.getElementById('v144-release-card');
      if(relAnchor){
        var c=document.createElement('div');c.id='v148-release-card';c.className='card stack v133-release-card';
        c.innerHTML='<strong>New in v1.48.0 — Newcastle United research pack</strong><span class="about">• Newcastle United becomes the eighth evidence-backed 16-player Premier League research pack, taking the published database to 128 researched players.</span><span class="about">• The pack uses the club’s post-window first-team group after a heavily refreshed summer 2026 squad, avoiding departed-player contamination from earlier snapshots.</span><span class="about">• Newcastle United is now Research Ready and SWOS 16 Builder Ready in Club Coverage Centre.</span><span class="about">• The Research Workbench automatically advances to '+esc(META.nextResearch.name)+' as the next identity-ready club.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';
        relAnchor.insertAdjacentElement('beforebegin',c);
      }
    }
    document.title='SWOS Studio '+BUILD;
    var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;
    return true;
  }
  var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');

if(!html.includes('swos-v148-newcastle-expansion-layer')||!html.includes('Newcastle United pack published'))throw new Error(`SWOS Studio ${BUILD} build failed: Newcastle United expansion UI was not installed.`);
if(!html.includes('<title>SWOS Studio v1.48.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title was not updated.`);
console.log(`SWOS Studio ${BUILD} Newcastle United research expansion complete · ${packs.packCount} packs / ${packs.playerCount} players · next research pack ${nextResearch.name}.`);
