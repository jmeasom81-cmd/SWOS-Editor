import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.73.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.72.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.72.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-research.4')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .4; found ${manifest.version}.`);
for(const id of ['birmingham-city','blackburn-rovers','bolton-wanderers','bristol-city'])if(!packs.clubs?.[id]||Object.keys(packs.clubs[id].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} research pack missing or incomplete.`);
if(packs.packCount!==24||packs.playerCount!==384)throw new Error(`SWOS Studio ${BUILD} build failed: expected 24 research packs / 384 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==4)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 4/24 research.`);
if(queue.progress?.researchReadyClubs!==4||queue.totals?.clubs!==20||queue.totals?.stagedPlayers!==320||queue.totals?.requiredEvidenceCells!==960||queue.next?.clubId!=='burnley')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 20 clubs with Burnley next.`);
if(intake.progress?.researchReadyClubs!==4||intake.progress?.researchPendingClubs!==20||intake.totals?.clubs!==20||intake.totals?.requiredEvidenceCells!==960)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==4||validation.totals?.researchClubs!==24||validation.totals?.researchPlayers!==384)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.72.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:4,totalResearchClubs:24,totalResearchPlayers:384,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v173-bristol-research-layer">
(function(){
'use strict';var BUILD='v1.73.0',META=${embedded};
function render(){var anchor=document.getElementById('v172-bolton-research')||document.getElementById('v171-blackburn-research');if(!anchor)return false;
if(!document.getElementById('v173-bristol-research')){var box=document.createElement('div');box.id='v173-bristol-research';box.className='card stack';box.innerHTML='<strong>✅ Bristol City research pack promoted</strong><span class="about">Bristol City has cleared the exact-16 evidence guard with sourced age, valuation and SWOS-position data for every selected player.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Twenty Championship clubs remain in the research queue.</span><span class="feature-status available">4 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v173-release-card')){var a=document.getElementById('v172-release-card')||document.getElementById('v171-release-card');if(a){var c=document.createElement('div');c.id='v173-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.73.0 — Bristol City research promotion</strong><span class="about">• Bristol City becomes the fourth Championship research-ready club.</span><span class="about">• All 16 records match the published identity selection and carry sourced age, market value and SWOS position.</span><span class="about">• Championship research reaches 4 / 24 while Premier League remains protected at 20 / 20.</span><span class="about">• Remaining work is 20 clubs / 320 players / 960 mandatory evidence cells.</span><span class="about">• Burnley is next.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v173-bristol-research-layer')||!html.includes('<title>SWOS Studio v1.73.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Bristol City research layer missing.`);
console.log(`SWOS Studio v1.73.0 Bristol City research promotion complete · Championship 4/24 · all research 24 clubs / 384 players · next ${queue.next.clubName} · binary writes locked.`);
