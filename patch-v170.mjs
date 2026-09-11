import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.70.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.69.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.69.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-research.1')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .1; found ${manifest.version}.`);
if(!packs.clubs?.['birmingham-city']||Object.keys(packs.clubs['birmingham-city'].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Birmingham City research pack is missing or incomplete.`);
if(packs.packCount!==21||packs.playerCount!==336)throw new Error(`SWOS Studio ${BUILD} build failed: expected 21 research packs / 336 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==1)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 research and Championship 1/24 research with 24/24 identity.`);
if(queue.progress?.researchReadyClubs!==1||queue.totals?.clubs!==23||queue.totals?.stagedPlayers!==368||queue.totals?.requiredEvidenceCells!==1104||queue.next?.clubId!=='blackburn-rovers')throw new Error(`SWOS Studio ${BUILD} build failed: Championship queue did not shrink cleanly to 23 clubs with Blackburn Rovers next.`);
if(intake.progress?.researchReadyClubs!==1||intake.progress?.researchPendingClubs!==23||intake.totals?.clubs!==23||intake.totals?.requiredEvidenceCells!==1104)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale after Birmingham promotion.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==1||validation.totals?.researchClubs!==21||validation.totals?.researchPlayers!==336)throw new Error(`SWOS Studio ${BUILD} build failed: England research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.69.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:1,champTarget:24,totalResearchClubs:21,totalResearchPlayers:336,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<style id="swos-v170-research-style">
.v170-progress{height:8px;border-radius:999px;background:#07111f;border:1px solid var(--line);overflow:hidden}.v170-progress span{display:block;height:100%;background:var(--green);width:4.1667%}
</style>
<script id="swos-v170-birmingham-research-layer">
(function(){
'use strict';var BUILD='v1.70.0',META=${embedded};
function render(){
 var anchor=document.getElementById('v169-research-engine')||document.getElementById('v168-championship-research');if(!anchor)return false;
 if(!document.getElementById('v170-birmingham-research')){var box=document.createElement('div');box.id='v170-birmingham-research';box.className='card stack';box.innerHTML='<strong>✅ Birmingham City — first Championship research pack promoted</strong><span class="about">Birmingham City has cleared the complete evidence gate: all 16 selected identities now have sourced age, current market value and an exact SWOS position code.</span><div class="v170-progress"><span></span></div><span class="about">Championship research coverage: <b>'+META.champReady+' / '+META.champTarget+'</b>. England now has <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">The pending queue has automatically shrunk to 23 clubs. Next evidence target: <b>'+META.next+'</b>.</span><span class="feature-status available">1 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
 if(!document.getElementById('v170-release-card')){var a=document.getElementById('v169-release-card')||document.getElementById('v168-release-card');if(a){var c=document.createElement('div');c.id='v170-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.70.0 — Birmingham City research promotion</strong><span class="about">• First Championship club promoted through the new division-aware research engine.</span><span class="about">• Birmingham City contributes an exact 16-player, identity-matched research pack with sourced age, market value and SWOS position.</span><span class="about">• Championship research moves to 1 / 24 while Premier League remains protected at 20 / 20.</span><span class="about">• Pending Championship research automatically recalculates to 23 clubs / 368 players / 1,104 required evidence cells.</span><span class="about">• Blackburn Rovers is now the next research target.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
 document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;
}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v170-birmingham-research-layer')||!html.includes('<title>SWOS Studio v1.70.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Birmingham research layer missing.`);
console.log(`SWOS Studio v1.70.0 Birmingham research promotion complete · Championship 1/24 · all research 21 clubs / 336 players · next ${queue.next.clubName} · binary writes locked.`);
