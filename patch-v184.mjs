import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.84.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.83.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.83.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);

if(manifest.version!=='2026.27-england-research.15')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .15; found ${manifest.version}.`);
if(!packs.clubs?.['queens-park-rangers']||Object.keys(packs.clubs['queens-park-rangers'].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Queens Park Rangers research pack missing or incomplete.`);
const identityNames=new Set((identities.clubs?.['queens-park-rangers']||[]).map(p=>p.footballName));
const researchNames=new Set(Object.keys(packs.clubs['queens-park-rangers'].players||{}));
if(identityNames.size!==16||researchNames.size!==16)throw new Error(`SWOS Studio ${BUILD} build failed: QPR identity/research sets must both contain exactly 16 players.`);
for(const name of identityNames)if(!researchNames.has(name))throw new Error(`SWOS Studio ${BUILD} build failed: QPR research pack is missing identity player ${name}.`);
if(packs.packCount!==35||packs.playerCount!==560)throw new Error(`SWOS Studio ${BUILD} build failed: expected 35 research packs / 560 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==15)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 15/24 research.`);
if(queue.progress?.researchReadyClubs!==15||queue.totals?.clubs!==9||queue.totals?.stagedPlayers!==144||queue.totals?.requiredEvidenceCells!==432||queue.next?.clubId!=='sheffield-united')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 9 clubs with Sheffield United next.`);
if(intake.progress?.researchReadyClubs!==15||intake.progress?.researchPendingClubs!==9||intake.totals?.clubs!==9||intake.totals?.players!==144||intake.totals?.requiredEvidenceCells!==432)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==15||validation.totals?.researchClubs!==35||validation.totals?.researchPlayers!==560)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.83.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:15,totalResearchClubs:35,totalResearchPlayers:560,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v184-qpr-research-layer">
(function(){
'use strict';var BUILD='v1.84.0',META=${embedded};
function render(){var anchor=document.getElementById('v183-preston-research')||document.getElementById('v182-portsmouth-research');if(!anchor)return false;
if(!document.getElementById('v184-qpr-research')){var box=document.createElement('div');box.id='v184-qpr-research';box.className='card stack';box.innerHTML='<strong>✅ Queens Park Rangers research pack promoted</strong><span class="about">All 16 selected QPR identities are matched to sourced age, market-value and exact SWOS-position evidence. Loan status and summer birthdays are resolved against the current 2026/27 snapshot.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Nine Championship clubs remain.</span><span class="feature-status available">15 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v184-release-card')){var a=document.getElementById('v183-release-card')||document.getElementById('v182-release-card');if(a){var c=document.createElement('div');c.id='v184-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.84.0 — Queens Park Rangers research promotion</strong><span class="about">• QPR passes the exact-16 identity-matched research gate.</span><span class="about">• Pierce Charles and Glen Kamara retain current QPR loan status while market-value evidence remains traceable to the latest published valuation source.</span><span class="about">• Snapshot ages correct summer birthdays for Charles, Smyth, Poku, Saito and Koné.</span><span class="about">• Championship research reaches 15 / 24 and England reaches 35 research-ready clubs / 560 researched players.</span><span class="about">• Sheffield United is next with nine Championship clubs pending.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v184-qpr-research-layer')||!html.includes('<title>SWOS Studio v1.84.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: QPR research layer missing.`);
console.log(`SWOS Studio v1.84.0 QPR research promotion complete · Championship 15/24 · all research 35 clubs / 560 players · next ${queue.next.clubName} · binary writes locked.`);
