import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.74.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.73.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.73.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-research.5')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .5; found ${manifest.version}.`);
for(const id of ['birmingham-city','blackburn-rovers','bolton-wanderers','bristol-city','burnley'])if(!packs.clubs?.[id]||Object.keys(packs.clubs[id].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} research pack missing or incomplete.`);
if(packs.packCount!==25||packs.playerCount!==400)throw new Error(`SWOS Studio ${BUILD} build failed: expected 25 research packs / 400 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==5)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 5/24 research.`);
if(queue.progress?.researchReadyClubs!==5||queue.totals?.clubs!==19||queue.totals?.stagedPlayers!==304||queue.totals?.requiredEvidenceCells!==912||queue.next?.clubId!=='cardiff-city')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 19 clubs with Cardiff City next.`);
if(intake.progress?.researchReadyClubs!==5||intake.progress?.researchPendingClubs!==19||intake.totals?.clubs!==19||intake.totals?.requiredEvidenceCells!==912)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==5||validation.totals?.researchClubs!==25||validation.totals?.researchPlayers!==400)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.73.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:5,totalResearchClubs:25,totalResearchPlayers:400,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v174-burnley-research-layer">
(function(){
'use strict';var BUILD='v1.74.0',META=${embedded};
function render(){var anchor=document.getElementById('v173-bristol-research')||document.getElementById('v172-bolton-research');if(!anchor)return false;
if(!document.getElementById('v174-burnley-research')){var box=document.createElement('div');box.id='v174-burnley-research';box.className='card stack';box.innerHTML='<strong>✅ Burnley research pack promoted</strong><span class="about">Burnley has passed the exact-16 evidence gate with current-squad checks kept separate from valuation evidence where market-value pages still reference a previous club.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Nineteen Championship clubs remain in the research queue.</span><span class="feature-status available">5 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v174-release-card')){var a=document.getElementById('v173-release-card')||document.getElementById('v172-release-card');if(a){var c=document.createElement('div');c.id='v174-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.74.0 — Burnley research promotion</strong><span class="about">• Burnley becomes the fifth Championship research-ready club.</span><span class="about">• All 16 records match the published identity selection and carry sourced age, market value and SWOS position.</span><span class="about">• Roster evidence and valuation evidence are explicitly separated where a valuation source still shows a previous club.</span><span class="about">• Championship research reaches 5 / 24 while Premier League remains protected at 20 / 20.</span><span class="about">• Remaining work is 19 clubs / 304 players / 912 mandatory evidence cells.</span><span class="about">• Cardiff City is next. TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v174-burnley-research-layer')||!html.includes('<title>SWOS Studio v1.74.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Burnley research layer missing.`);
console.log(`SWOS Studio v1.74.0 Burnley research promotion complete · Championship 5/24 · all research 25 clubs / 400 players · next ${queue.next.clubName} · binary writes locked.`);
