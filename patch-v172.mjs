import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.72.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.71.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.71.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-research.3')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .3; found ${manifest.version}.`);
for(const id of ['birmingham-city','blackburn-rovers','bolton-wanderers'])if(!packs.clubs?.[id]||Object.keys(packs.clubs[id].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} research pack missing or incomplete.`);
const boltonNames=new Set((identities.clubs?.['bolton-wanderers']||[]).map(p=>p.footballName));
if(boltonNames.size!==16||boltonNames.has('Joel Randall')||!boltonNames.has('Luca Stephenson'))throw new Error(`SWOS Studio ${BUILD} build failed: Bolton identity correction was not applied before research promotion.`);
if(!packs.clubs['bolton-wanderers'].players?.['Luca Stephenson']||packs.clubs['bolton-wanderers'].players?.['Joel Randall'])throw new Error(`SWOS Studio ${BUILD} build failed: Bolton research pack does not match corrected identity selection.`);
if(packs.packCount!==23||packs.playerCount!==368)throw new Error(`SWOS Studio ${BUILD} build failed: expected 23 research packs / 368 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==3)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 3/24 research.`);
if(queue.progress?.researchReadyClubs!==3||queue.totals?.clubs!==21||queue.totals?.stagedPlayers!==336||queue.totals?.requiredEvidenceCells!==1008||queue.next?.clubId!=='bristol-city')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 21 clubs with Bristol City next.`);
if(intake.progress?.researchReadyClubs!==3||intake.progress?.researchPendingClubs!==21||intake.totals?.clubs!==21||intake.totals?.requiredEvidenceCells!==1008)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==3||validation.totals?.researchClubs!==23||validation.totals?.researchPlayers!==368)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.71.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:3,totalResearchClubs:23,totalResearchPlayers:368,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v172-bolton-research-layer">
(function(){
'use strict';var BUILD='v1.72.0',META=${embedded};
function render(){var anchor=document.getElementById('v171-blackburn-research')||document.getElementById('v170-birmingham-research');if(!anchor)return false;
if(!document.getElementById('v172-bolton-research')){var box=document.createElement('div');box.id='v172-bolton-research';box.className='card stack';box.innerHTML='<strong>✅ Bolton Wanderers research pack promoted</strong><span class="about">Bolton reached the research gate only after a post-window roster check corrected the selected identity 16: Joel Randall is out on loan and current signing Luca Stephenson replaces him in the working database.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. The correction is auditable and the research pack matches the corrected 16 exactly.</span><span class="feature-status available">3 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v172-release-card')){var a=document.getElementById('v171-release-card')||document.getElementById('v170-release-card');if(a){var c=document.createElement('div');c.id='v172-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.72.0 — Bolton roster drift guard + research promotion</strong><span class="about">• A current-squad cross-check caught Joel Randall\'s season-long Chesterfield loan before research publication.</span><span class="about">• The identity correction layer replaces him one-for-one with Luca Stephenson, preserving an exact current 16 and role balance.</span><span class="about">• Bolton then passes the sourced age, market-value and SWOS-position research gate.</span><span class="about">• Championship research advances to 3 / 24; Premier League remains protected at 20 / 20.</span><span class="about">• Remaining Championship research: 21 clubs / 336 players / 1,008 mandatory evidence cells. Bristol City is next.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v172-bolton-research-layer')||!html.includes('<title>SWOS Studio v1.72.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Bolton research layer missing.`);
console.log(`SWOS Studio v1.72.0 Bolton research promotion complete · Championship 3/24 · all research 23 clubs / 368 players · next ${queue.next.clubName} · binary writes locked.`);
