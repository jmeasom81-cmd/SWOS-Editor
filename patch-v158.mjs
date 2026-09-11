import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const IDENTITIES='football-db/identities.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/research-queue.json';
const INTAKE='football-db/research-intake.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.58.0';
for(const file of [FILE,PACKS,IDENTITIES,COVERAGE,QUEUE,INTAKE,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));

if(!html.includes('<title>SWOS Studio v1.57.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.57.0 output was not found.`);
if(identities.clubCount!==20||identities.playerCount!==375)throw new Error(`SWOS Studio ${BUILD} build failed: full Premier League identity coverage is not intact.`);
if(!Array.isArray(identities.generation?.appliedCorrections)||!identities.generation.appliedCorrections.some(x=>x.clubId==='crystal-palace'))throw new Error(`SWOS Studio ${BUILD} build failed: Crystal Palace post-window identity correction was not applied.`);
if(packs.packCount!==20||packs.playerCount!==320)throw new Error(`SWOS Studio ${BUILD} build failed: expected 20 packs / 320 researched players; found ${packs.packCount} / ${packs.playerCount}.`);
if(coverage?.summary?.identityReady!==20||coverage?.summary?.researchReady!==20)throw new Error(`SWOS Studio ${BUILD} build failed: expected 20 identity-ready / 20 research-ready clubs.`);
const premier=(coverage.clubs||[]).filter(c=>c.division===0);
if(premier.length!==20||premier.some(c=>c.stages?.identity?.status!=='ready'||c.stages?.researchPack?.status!=='ready'||c.stages?.swos16?.status!=='builder-ready'))throw new Error(`SWOS Studio ${BUILD} build failed: at least one Premier League club is not fully builder-ready.`);
if(queue.totals?.clubs!==0||queue.totals?.stagedPlayers!==0||queue.next!=null)throw new Error(`SWOS Studio ${BUILD} build failed: research queue should be empty after full promotion.`);
if(intake.totals?.clubs!==0||intake.totals?.players!==0||intake.next!=null)throw new Error(`SWOS Studio ${BUILD} build failed: research intake should be empty after full promotion.`);
if(manifest.version!=='2026.27-foundation.20')throw new Error(`SWOS Studio ${BUILD} build failed: expected database foundation.20; found ${manifest.version}.`);
for(const id of ['bournemouth','brentford','brighton','coventry','crystal-palace','fulham','hull','ipswich','leeds','sunderland']){
  if(!packs.clubs?.[id]||Object.keys(packs.clubs[id].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} evidence-promoted pack missing or incomplete.`);
}

html=html.replace('<title>SWOS Studio v1.57.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={packs:packs.packCount,players:packs.playerCount,identityReady:coverage.summary.identityReady,researchReady:coverage.summary.researchReady,databaseVersion:manifest.version,corrections:identities.generation.appliedCorrections.length};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v158-premier-league-research-complete-layer">
(function(){
'use strict';
var BUILD='v1.58.0',META=${embedded};
function render(){
  var anchor=document.getElementById('v145-workbench')||document.getElementById('v144-coverage-centre');if(!anchor)return false;
  var box=document.getElementById('v146-data-expansion');if(!box){box=document.createElement('section');box.id='v146-data-expansion';box.className='v146-data-expansion';anchor.insertAdjacentElement('beforebegin',box);}
  box.innerHTML='<div class="v146-data-head"><div><strong>🏁 Premier League Research Foundation Complete</strong><p>All 20 Premier League clubs now have validated current identities and evidence-gated 16-player research packs. The second-half queue has been fully promoted without bypassing the source and validation rules.</p></div><span class="feature-status available">20 / 20 research-ready ✓</span></div>'+
    '<div class="v146-data-grid"><div class="v146-data-stat good"><small>Identity-ready</small><b>'+META.identityReady+' / 20</b></div><div class="v146-data-stat good"><small>Research-ready</small><b>'+META.researchReady+' / 20</b></div><div class="v146-data-stat good"><small>Researched players</small><b>'+META.players+'</b></div><div class="v146-data-stat good"><small>Evidence queue</small><b>Complete</b></div></div>'+
    '<div class="v146-data-foot"><b>Database '+META.databaseVersion+':</b> '+META.packs+' club packs / '+META.players+' researched players are published. Post-window identity corrections remain auditable. No missing ratings were invented to finish the milestone. TEAM.* and established .CAR writes remain locked.</div>';
  var editor=document.getElementById('v154-evidence-editor');if(editor)editor.style.display='none';
  if(!document.getElementById('v158-release-card')){
    var a=document.getElementById('v157-release-card')||document.getElementById('v156-release-card');
    if(a){var c=document.createElement('div');c.id='v158-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.58.0 — Premier League research foundation complete</strong><span class="about">• Coventry City, Crystal Palace, Fulham, Hull City, Ipswich Town, Leeds United and Sunderland complete the guarded second-half promotion wave.</span><span class="about">• Premier League coverage reaches 20 / 20 identity-ready, 20 / 20 research-ready and 320 researched SWOS16 player slots.</span><span class="about">• Crystal Palace uses an auditable post-window identity correction rather than silently preserving an outdated player.</span><span class="about">• Every second-half club passed the same 16-player age, market-value, exact-position and source-reference gate.</span><span class="about">• The research queue and intake are now empty by design; the next database milestone can move beyond the Premier League.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}
  }
  document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;
}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v158-premier-league-research-complete-layer')||!html.includes('20 / 20 research-ready'))throw new Error(`SWOS Studio ${BUILD} build failed: completion UI missing.`);
if(!html.includes('<title>SWOS Studio v1.58.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title not updated.`);
console.log(`SWOS Studio ${BUILD} Premier League research foundation complete · ${packs.packCount} packs / ${packs.playerCount} players · queue empty.`);
