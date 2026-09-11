import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.83.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.82.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.82.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);

if(manifest.version!=='2026.27-england-research.14')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .14; found ${manifest.version}.`);
if(!packs.clubs?.['preston-north-end']||Object.keys(packs.clubs['preston-north-end'].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Preston North End research pack missing or incomplete.`);
const identityNames=new Set((identities.clubs?.['preston-north-end']||[]).map(p=>p.footballName));
const researchNames=new Set(Object.keys(packs.clubs['preston-north-end'].players||{}));
if(identityNames.size!==16||researchNames.size!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Preston identity/research sets must both contain exactly 16 players.`);
for(const name of identityNames)if(!researchNames.has(name))throw new Error(`SWOS Studio ${BUILD} build failed: Preston research pack is missing identity player ${name}.`);
if(packs.packCount!==34||packs.playerCount!==544)throw new Error(`SWOS Studio ${BUILD} build failed: expected 34 research packs / 544 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==14)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 14/24 research.`);
if(queue.progress?.researchReadyClubs!==14||queue.totals?.clubs!==10||queue.totals?.stagedPlayers!==160||queue.totals?.requiredEvidenceCells!==480||queue.next?.clubId!=='queens-park-rangers')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 10 clubs with Queens Park Rangers next.`);
if(intake.progress?.researchReadyClubs!==14||intake.progress?.researchPendingClubs!==10||intake.totals?.clubs!==10||intake.totals?.players!==160||intake.totals?.requiredEvidenceCells!==480)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==14||validation.totals?.researchClubs!==34||validation.totals?.researchPlayers!==544)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.82.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:14,totalResearchClubs:34,totalResearchPlayers:544,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v183-preston-research-layer">
(function(){
'use strict';var BUILD='v1.83.0',META=${embedded};
function render(){var anchor=document.getElementById('v182-portsmouth-research')||document.getElementById('v181-norwich-research');if(!anchor)return false;
if(!document.getElementById('v183-preston-research')){var box=document.createElement('div');box.id='v183-preston-research';box.className='card stack';box.innerHTML='<strong>✅ Preston North End research pack promoted</strong><span class="about">The current 16-player Preston selection is matched to sourced age, market-value and exact SWOS-position evidence. Summer birthdays and late-window moves are resolved against the 11 September snapshot rather than copied from stale profile displays.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Ten Championship clubs remain.</span><span class="feature-status available">14 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v183-release-card')){var a=document.getElementById('v182-release-card')||document.getElementById('v181-release-card');if(a){var c=document.createElement('div');c.id='v183-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.83.0 — Preston North End research promotion</strong><span class="about">• Preston passes the exact-16 identity-matched research gate.</span><span class="about">• Harry Clarke, Liam Gibbs and Stanley Mills use current transfer evidence when older valuation pages lag their Preston registrations.</span><span class="about">• Snapshot ages are corrected for summer birthdays, including Iversen, Storey, Devine, Small and Lang.</span><span class="about">• Championship research reaches 14 / 24 and England reaches 34 research-ready clubs / 544 researched players.</span><span class="about">• Queens Park Rangers is next with ten Championship clubs pending.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v183-preston-research-layer')||!html.includes('<title>SWOS Studio v1.83.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Preston research layer missing.`);
console.log(`SWOS Studio v1.83.0 Preston research promotion complete · Championship 14/24 · all research 34 clubs / 544 players · next ${queue.next.clubName} · binary writes locked.`);
