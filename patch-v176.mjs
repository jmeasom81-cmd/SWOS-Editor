import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.76.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.75.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.75.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-research.7')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .7; found ${manifest.version}.`);
for(const id of ['birmingham-city','blackburn-rovers','bolton-wanderers','bristol-city','burnley','cardiff-city','charlton-athletic'])if(!packs.clubs?.[id]||Object.keys(packs.clubs[id].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} research pack missing or incomplete.`);
if(packs.packCount!==27||packs.playerCount!==432)throw new Error(`SWOS Studio ${BUILD} build failed: expected 27 research packs / 432 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==7)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 7/24 research.`);
if(queue.progress?.researchReadyClubs!==7||queue.totals?.clubs!==17||queue.totals?.stagedPlayers!==272||queue.totals?.requiredEvidenceCells!==816||queue.next?.clubId!=='derby-county')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 17 clubs with Derby County next.`);
if(intake.progress?.researchReadyClubs!==7||intake.progress?.researchPendingClubs!==17||intake.totals?.clubs!==17||intake.totals?.requiredEvidenceCells!==816)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==7||validation.totals?.researchClubs!==27||validation.totals?.researchPlayers!==432)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.75.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:7,totalResearchClubs:27,totalResearchPlayers:432,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v176-charlton-research-layer">
(function(){
'use strict';var BUILD='v1.76.0',META=${embedded};
function render(){var anchor=document.getElementById('v175-cardiff-research')||document.getElementById('v174-burnley-research');if(!anchor)return false;
if(!document.getElementById('v176-charlton-research')){var box=document.createElement('div');box.id='v176-charlton-research';box.className='card stack';box.innerHTML='<strong>✅ Charlton Athletic research pack promoted</strong><span class="about">Charlton Athletic has cleared the exact-16 research gate, including sourced fallbacks where a current Transfermarkt valuation was blank or lagged a summer move.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Seventeen Championship clubs remain in the research queue.</span><span class="feature-status available">7 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v176-release-card')){var a=document.getElementById('v175-release-card')||document.getElementById('v174-release-card');if(a){var c=document.createElement('div');c.id='v176-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.76.0 — Charlton Athletic research promotion</strong><span class="about">• Charlton becomes the seventh Championship research-ready club.</span><span class="about">• All 16 selected identities carry sourced age, valuation and SWOS-position evidence.</span><span class="about">• Current alternative valuation sources are documented where Transfermarkt is blank or predates a 2026 move.</span><span class="about">• Championship research reaches 7 / 24 while Premier League remains protected at 20 / 20.</span><span class="about">• Remaining Championship research is 17 clubs / 272 players / 816 mandatory evidence cells.</span><span class="about">• Derby County is next. TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v176-charlton-research-layer')||!html.includes('<title>SWOS Studio v1.76.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Charlton research layer missing.`);
console.log(`SWOS Studio v1.76.0 Charlton research promotion complete · Championship 7/24 · all research 27 clubs / 432 players · next ${queue.next.clubName} · binary writes locked.`);
