import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.77.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.76.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.76.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-research.8')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .8; found ${manifest.version}.`);
for(const id of ['birmingham-city','blackburn-rovers','bolton-wanderers','bristol-city','burnley','cardiff-city','charlton-athletic','derby-county'])if(!packs.clubs?.[id]||Object.keys(packs.clubs[id].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} research pack missing or incomplete.`);
if(packs.packCount!==28||packs.playerCount!==448)throw new Error(`SWOS Studio ${BUILD} build failed: expected 28 research packs / 448 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==8)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 8/24 research.`);
if(queue.progress?.researchReadyClubs!==8||queue.totals?.clubs!==16||queue.totals?.stagedPlayers!==256||queue.totals?.requiredEvidenceCells!==768||queue.next?.clubId!=='lincoln-city')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 16 clubs with Lincoln City next.`);
if(intake.progress?.researchReadyClubs!==8||intake.progress?.researchPendingClubs!==16||intake.totals?.clubs!==16||intake.totals?.requiredEvidenceCells!==768)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==8||validation.totals?.researchClubs!==28||validation.totals?.researchPlayers!==448)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.76.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:8,totalResearchClubs:28,totalResearchPlayers:448,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v177-derby-research-layer">
(function(){
'use strict';var BUILD='v1.77.0',META=${embedded};
function render(){var anchor=document.getElementById('v176-charlton-research')||document.getElementById('v175-cardiff-research');if(!anchor)return false;
if(!document.getElementById('v177-derby-research')){var box=document.createElement('div');box.id='v177-derby-research';box.className='card stack';box.innerHTML='<strong>✅ Derby County research pack promoted</strong><span class="about">Derby County has cleared the exact-16 evidence gate with current-club verification separated from valuation evidence where summer transfers occurred.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Sixteen Championship clubs remain in the research queue.</span><span class="feature-status available">8 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v177-release-card')){var a=document.getElementById('v176-release-card')||document.getElementById('v175-release-card');if(a){var c=document.createElement('div');c.id='v177-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.77.0 — Derby County research promotion</strong><span class="about">• Derby becomes the eighth Championship research-ready club.</span><span class="about">• All 16 selected identities carry sourced age, valuation and SWOS-position evidence.</span><span class="about">• Current Derby roster evidence is kept separate from latest valuation records for recent transfers.</span><span class="about">• Championship research reaches 8 / 24 while Premier League remains protected at 20 / 20.</span><span class="about">• Remaining Championship research is 16 clubs / 256 players / 768 mandatory evidence cells.</span><span class="about">• Lincoln City is next. TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v177-derby-research-layer')||!html.includes('<title>SWOS Studio v1.77.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Derby County research layer missing.`);
console.log(`SWOS Studio v1.77.0 Derby County research promotion complete · Championship 8/24 · all research 28 clubs / 448 players · next ${queue.next.clubName} · binary writes locked.`);
