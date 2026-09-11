import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.50.0';

for(const file of [FILE,PACKS,COVERAGE,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));

if(!html.includes('<title>SWOS Studio v1.49.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.49.0 output was not found.`);
if(packs.packCount!==10||packs.playerCount!==160)throw new Error(`SWOS Studio ${BUILD} build failed: expected 10 packs / 160 players; found ${packs.packCount} / ${packs.playerCount}.`);
const spursPack=packs.clubs?.tottenham;
if(!spursPack||Object.keys(spursPack.players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Tottenham Hotspur 16-player research pack is missing or incomplete.`);
if(coverage?.summary?.researchReady!==10||coverage?.summary?.swos16BuilderReady!==10)throw new Error(`SWOS Studio ${BUILD} build failed: coverage did not advance to 10 research/SWOS16-ready clubs.`);
const spursCoverage=(coverage.clubs||[]).find(c=>c.id==='tottenham');
if(spursCoverage?.stages?.researchPack?.status!=='ready'||spursCoverage?.stages?.swos16?.status!=='builder-ready')throw new Error(`SWOS Studio ${BUILD} build failed: Tottenham Hotspur coverage stages are not ready.`);
if(manifest.version!=='2026.27-foundation.10')throw new Error(`SWOS Studio ${BUILD} build failed: expected database 2026.27-foundation.10; found ${manifest.version}.`);

const identityReady=coverage?.summary?.identityReady||10;
const nextResearch=(coverage.clubs||[]).filter(c=>c.stages?.identity?.status==='ready'&&c.stages?.researchPack?.status!=='ready');
if(nextResearch.length!==0)throw new Error(`SWOS Studio ${BUILD} build failed: expected current identity-ready research queue to be complete; found ${nextResearch.length} outstanding.`);
if(identityReady!==10)throw new Error(`SWOS Studio ${BUILD} build failed: expected current identity foundation to remain 10 clubs; found ${identityReady}.`);

html=html.replace('<title>SWOS Studio v1.49.0</title>',`<title>SWOS Studio ${BUILD}</title>`);

const meta={
  build:BUILD,
  databaseVersion:manifest.version,
  packs:packs.packCount,
  players:packs.playerCount,
  premierLeagueClubs:manifest.coverage?.premierLeague?.clubs||20,
  spursPlayers:Object.keys(spursPack.players||{}).length,
  identityReady,
  identityRemaining:Math.max(0,(manifest.coverage?.premierLeague?.clubs||20)-identityReady),
  teamWriteReady:manifest.installation?.teamWriteReady===true,
  careerWriteReady:manifest.installation?.careerWriteReady===true
};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v150-tottenham-milestone-layer">
(function(){
  'use strict';
  var BUILD='v1.50.0';
  var META=${embedded};
  function render(){
    var anchor=document.getElementById('v145-workbench')||document.getElementById('v144-coverage-centre');
    if(!anchor)return false;
    var box=document.getElementById('v146-data-expansion');
    if(!box){box=document.createElement('section');box.id='v146-data-expansion';box.className='v146-data-expansion';anchor.insertAdjacentElement('beforebegin',box);}
    box.innerHTML='<div class="v146-data-head"><div><strong>⚽ Football Data Expansion</strong><p>The first verified identity foundation is now fully researched. The next production phase expands verified identities to the remaining Premier League clubs before their SWOS 16 packs are generated.</p></div><span class="feature-status available">10-club research milestone ✓</span></div>'+
      '<div class="v146-data-grid"><div class="v146-data-stat good"><small>Research packs</small><b>'+META.packs+' / '+META.premierLeagueClubs+'</b></div><div class="v146-data-stat"><small>Researched players</small><b>'+META.players+'</b></div><div class="v146-data-stat good"><small>Tottenham Hotspur</small><b>'+META.spursPlayers+' / 16 ✓</b></div><div class="v146-data-stat next"><small>Next production phase</small><b>Identity expansion</b></div></div>'+
      '<div class="v146-data-foot"><b>Database '+META.databaseVersion+':</b> all '+META.identityReady+' currently identity-ready clubs now have complete 16-player research packs. '+META.identityRemaining+' Premier League clubs remain to be identity-verified. TEAM.* and .CAR writes remain locked.</div>';
    if(!document.getElementById('v150-release-card')){
      var relAnchor=document.getElementById('v149-release-card')||document.getElementById('v148-release-card')||document.getElementById('v147-release-card')||document.getElementById('v146-release-card')||document.getElementById('v145-release-card')||document.getElementById('v144-release-card');
      if(relAnchor){
        var c=document.createElement('div');c.id='v150-release-card';c.className='card stack v133-release-card';
        c.innerHTML='<strong>New in v1.50.0 — Tottenham Hotspur + 10-club milestone</strong><span class="about">• Tottenham Hotspur becomes the tenth evidence-backed 16-player Premier League research pack, taking the published database to 160 researched players.</span><span class="about">• The pack uses the official post-window 25-player squad submitted on 3 September 2026 and June 2026 market-value evidence.</span><span class="about">• Tottenham is now Research Ready and SWOS 16 Builder Ready in Club Coverage Centre.</span><span class="about">• Every club in the original 10-club verified identity foundation now has a completed research pack.</span><span class="about">• Research Workbench now changes phase: expand verified identity coverage across the remaining 10 Premier League clubs, then continue producing SWOS 16 packs.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';
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

if(!html.includes('swos-v150-tottenham-milestone-layer')||!html.includes('10-club research milestone'))throw new Error(`SWOS Studio ${BUILD} build failed: Tottenham milestone UI was not installed.`);
if(!html.includes('<title>SWOS Studio v1.50.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title was not updated.`);
console.log(`SWOS Studio ${BUILD} Tottenham research milestone complete · ${packs.packCount} packs / ${packs.playerCount} players · identity expansion next.`);
