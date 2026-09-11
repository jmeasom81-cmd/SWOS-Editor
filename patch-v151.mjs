import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const IDENTITIES='football-db/identities.json';
const COVERAGE='football-db/coverage.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.51.0';

for(const file of [FILE,PACKS,IDENTITIES,COVERAGE,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));

if(!html.includes('<title>SWOS Studio v1.50.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.50.0 output was not found.`);
if(identities.clubCount!==20)throw new Error(`SWOS Studio ${BUILD} build failed: expected all 20 Premier League clubs identity-ready; found ${identities.clubCount}.`);
if(identities.playerCount!==375)throw new Error(`SWOS Studio ${BUILD} build failed: expected 375 published senior identities; found ${identities.playerCount}.`);
if(coverage?.summary?.identityReady!==20)throw new Error(`SWOS Studio ${BUILD} build failed: coverage identity-ready total is ${coverage?.summary?.identityReady}; required 20.`);
if(packs.packCount!==10||packs.playerCount!==160)throw new Error(`SWOS Studio ${BUILD} build failed: research foundation should remain 10 packs / 160 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(manifest.coverage?.premierLeague?.identityReadyClubs!==20||manifest.coverage?.premierLeague?.identityPlayers!==375)throw new Error(`SWOS Studio ${BUILD} build failed: manifest identity totals do not reflect full Premier League coverage.`);

const pending=(coverage.clubs||[])
  .filter(c=>c.division===0&&c.stages?.identity?.status==='ready'&&c.stages?.researchPack?.status!=='ready')
  .sort((a,b)=>a.name.localeCompare(b.name));
if(pending.length!==10)throw new Error(`SWOS Studio ${BUILD} build failed: expected 10 identity-ready clubs awaiting research; found ${pending.length}.`);
if(pending[0]?.id!=='bournemouth')throw new Error(`SWOS Studio ${BUILD} build failed: expected Bournemouth to reopen the research queue; found ${pending[0]?.name||'none'}.`);

html=html.replace('<title>SWOS Studio v1.50.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={
  build:BUILD,
  databaseVersion:manifest.version,
  identityClubs:identities.clubCount,
  identityPlayers:identities.playerCount,
  researchPacks:packs.packCount,
  researchedPlayers:packs.playerCount,
  pendingResearch:pending.length,
  nextResearch:pending[0].name,
  teamWriteReady:manifest.installation?.teamWriteReady===true,
  careerWriteReady:manifest.installation?.careerWriteReady===true
};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v151-full-identity-layer">
(function(){
  'use strict';
  var BUILD='v1.51.0';
  var META=${embedded};
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function render(){
    var anchor=document.getElementById('v145-workbench')||document.getElementById('v144-coverage-centre');
    if(!anchor)return false;
    var box=document.getElementById('v146-data-expansion');
    if(!box){box=document.createElement('section');box.id='v146-data-expansion';box.className='v146-data-expansion';anchor.insertAdjacentElement('beforebegin',box);}
    box.innerHTML='<div class="v146-data-head"><div><strong>⚽ Premier League Identity Coverage Complete</strong><p>The identity pipeline is now incremental and all 20 Premier League clubs have a validated current identity foundation. Research can continue without embedding more squads into the app bundle.</p></div><span class="feature-status available">20 / 20 identity-ready ✓</span></div>'+
      '<div class="v146-data-grid"><div class="v146-data-stat good"><small>Identity-ready clubs</small><b>'+META.identityClubs+' / 20</b></div><div class="v146-data-stat"><small>Published identities</small><b>'+META.identityPlayers+'</b></div><div class="v146-data-stat good"><small>Research packs</small><b>'+META.researchPacks+' / 20</b></div><div class="v146-data-stat next"><small>Next research pack</small><b>'+esc(META.nextResearch)+'</b></div></div>'+
      '<div class="v146-data-foot"><b>Database '+esc(META.databaseVersion)+':</b> '+META.pendingResearch+' Premier League clubs are now identity-ready and waiting for evidence-backed research packs. No values or ratings were fabricated to force them ready. TEAM.* and .CAR writes remain locked.</div>';
    if(!document.getElementById('v151-release-card')){
      var relAnchor=document.getElementById('v150-release-card')||document.getElementById('v149-release-card')||document.getElementById('v148-release-card')||document.getElementById('v147-release-card')||document.getElementById('v146-release-card');
      if(relAnchor){
        var c=document.createElement('div');c.id='v151-release-card';c.className='card stack v133-release-card';
        c.innerHTML='<strong>New in v1.51.0 — full Premier League identity coverage</strong><span class="about">• The remaining ten Premier League clubs are now published through an incremental identity-pack layer rather than being hard-coded into SWOS Studio.</span><span class="about">• Identity coverage advances from 10 to 20 clubs and from 215 to 375 published senior identities.</span><span class="about">• Bournemouth, Brentford, Brighton, Coventry City, Crystal Palace, Fulham, Hull City, Ipswich Town, Leeds United and Sunderland are now Identity Ready.</span><span class="about">• Research status deliberately remains 10 / 20: identity evidence does not masquerade as market-value, performance or SWOS-rating research.</span><span class="about">• The Research Workbench reopens with '+esc(META.nextResearch)+' first in the evidence queue.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';
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

if(!html.includes('swos-v151-full-identity-layer')||!html.includes('20 / 20 identity-ready'))throw new Error(`SWOS Studio ${BUILD} build failed: full identity coverage UI was not installed.`);
if(!html.includes('<title>SWOS Studio v1.51.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title was not updated.`);
console.log(`SWOS Studio ${BUILD} full Premier League identity expansion complete · ${identities.clubCount} clubs / ${identities.playerCount} identities · ${pending.length} research packs queued.`);
