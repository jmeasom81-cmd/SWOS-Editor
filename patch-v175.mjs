import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.75.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.74.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.74.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-research.6')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .6; found ${manifest.version}.`);
for(const id of ['birmingham-city','blackburn-rovers','bolton-wanderers','bristol-city','burnley','cardiff-city'])if(!packs.clubs?.[id]||Object.keys(packs.clubs[id].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} research pack missing or incomplete.`);
if(packs.packCount!==26||packs.playerCount!==416)throw new Error(`SWOS Studio ${BUILD} build failed: expected 26 research packs / 416 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==6)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 6/24 research.`);
if(queue.progress?.researchReadyClubs!==6||queue.totals?.clubs!==18||queue.totals?.stagedPlayers!==288||queue.totals?.requiredEvidenceCells!==864||queue.next?.clubId!=='charlton-athletic')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 18 clubs with Charlton Athletic next.`);
if(intake.progress?.researchReadyClubs!==6||intake.progress?.researchPendingClubs!==18||intake.totals?.clubs!==18||intake.totals?.requiredEvidenceCells!==864)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==6||validation.totals?.researchClubs!==26||validation.totals?.researchPlayers!==416)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.74.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:6,totalResearchClubs:26,totalResearchPlayers:416,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v175-cardiff-research-layer">
(function(){
'use strict';var BUILD='v1.75.0',META=${embedded};
function render(){var anchor=document.getElementById('v174-burnley-research')||document.getElementById('v173-bristol-research');if(!anchor)return false;
if(!document.getElementById('v175-cardiff-research')){var box=document.createElement('div');box.id='v175-cardiff-research';box.className='card stack';box.innerHTML='<strong>✅ Cardiff City research pack promoted</strong><span class="about">Cardiff City has cleared the exact-16 evidence gate with current roster verification, sourced valuations and explicit SWOS position mapping.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Eighteen Championship clubs remain in the research queue.</span><span class="feature-status available">6 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v175-release-card')){var a=document.getElementById('v174-release-card')||document.getElementById('v173-release-card');if(a){var c=document.createElement('div');c.id='v175-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.75.0 — Cardiff City research promotion</strong><span class="about">• Cardiff becomes the sixth Championship research-ready club.</span><span class="about">• All 16 selected identities carry sourced age, market value and SWOS position evidence.</span><span class="about">• Current 2026/27 squad evidence is separated from valuation sources where needed.</span><span class="about">• Championship research reaches 6 / 24 while Premier League stays protected at 20 / 20.</span><span class="about">• Remaining Championship research is 18 clubs / 288 players / 864 mandatory evidence cells.</span><span class="about">• Charlton Athletic is next. TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v175-cardiff-research-layer')||!html.includes('<title>SWOS Studio v1.75.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Cardiff City research layer missing.`);
console.log(`SWOS Studio v1.75.0 Cardiff City research promotion complete · Championship 6/24 · all research 26 clubs / 416 players · next ${queue.next.clubName} · binary writes locked.`);
