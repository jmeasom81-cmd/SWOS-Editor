import fs from 'node:fs';

const FILE='dist/index.html';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const PROMOTER='promote-championship-research-evidence.mjs';
const COVERAGE='football-db/coverage.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.69.0';
for(const file of [FILE,QUEUE,INTAKE,VALIDATION,PROMOTER,COVERAGE,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.68.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.68.0 output was not found.`);
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(champ?.identityReady!==24||champ?.researchReady!==0||pl?.researchReady!==20)throw new Error(`SWOS Studio ${BUILD} build failed: research foundation must remain PL 20/20 and Championship 0/24 before first promotion.`);
if(queue.totals?.clubs!==24||queue.totals?.stagedPlayers!==384||queue.progress?.researchReadyClubs!==0)throw new Error(`SWOS Studio ${BUILD} build failed: Championship research queue is not staged at 24 pending clubs.`);
if(intake.progress?.researchReadyClubs!==0||intake.progress?.researchPendingClubs!==24)throw new Error(`SWOS Studio ${BUILD} build failed: Championship research intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==0||validation.totals?.researchClubs!==20||validation.totals?.researchPlayers!==320)throw new Error(`SWOS Studio ${BUILD} build failed: multi-division research validation did not pass cleanly.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);
const staged=Number(intake.totals?.requiredEvidenceCellsComplete||0),ready=Number(intake.totals?.promotionReadyClubs||0);
if(staged!==ready*48)throw new Error(`SWOS Studio ${BUILD} build failed: only whole 16-player evidence packs may be staged.`);

html=html.replace('<title>SWOS Studio v1.68.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={staged,ready,next:intake.nextPromotionReady?.clubName||intake.nextEvidenceRequired?.clubName||queue.next?.clubName||'Complete'};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v169-research-promotion-engine-layer">
(function(){
'use strict';var BUILD='v1.69.0',META=${embedded};
function render(){var anchor=document.getElementById('v168-championship-research')||document.getElementById('v167-championship-complete-summary');if(!anchor)return false;
if(!document.getElementById('v169-research-engine')){var box=document.createElement('div');box.id='v169-research-engine';box.className='card stack';box.innerHTML='<strong>⚙️ Championship Research Promotion Engine — ready</strong><span class="about">The research pipeline can now advance one fully evidenced club at a time without touching the completed Premier League research set. Every promoted club must match its published 16-player identity pack exactly.</span><span class="about">Current staged evidence: <b>'+META.ready+' complete club pack(s)</b> / '+META.staged+' mandatory cells. Next actionable club: <b>'+META.next+'</b>.</span><span class="about">The engine recalculates Championship and England research coverage separately, validates every 16-player pack and keeps lower divisions, TEAM.* writes and .CAR writes outside the promotion path.</span><span class="feature-status beta">PROMOTION ENGINE ARMED · FIRST PROMOTION NEXT</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v169-release-card')){var a=document.getElementById('v168-release-card')||document.getElementById('v167-release-card');if(a){var c=document.createElement('div');c.id='v169-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.69.0 — division-aware research promotion</strong><span class="about">• Added a Championship-specific evidence promotion engine rather than reusing the Premier League-only promoter.</span><span class="about">• Research queues and intake now shrink safely as clubs become research-ready.</span><span class="about">• Added England-wide research expansion validation with separate Premier League and Championship totals.</span><span class="about">• Static database validation now understands incremental Championship research packs while preserving PL 20 / 20.</span><span class="about">• v1.68 was made forward-compatible so future staged evidence cannot break the earlier foundation checkpoint.</span><span class="about">• No Championship research pack is auto-promoted in this release; evidence remains an explicit next step.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v169-research-promotion-engine-layer')||!html.includes('<title>SWOS Studio v1.69.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: research promotion engine layer missing.`);
console.log(`SWOS Studio v1.69.0 research promotion engine ready · PL 20/20 · Championship 0/24 · ${ready} evidence pack(s) staged · binary writes locked.`);
