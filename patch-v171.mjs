import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.71.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.70.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.70.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-research.2')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .2; found ${manifest.version}.`);
for(const id of ['birmingham-city','blackburn-rovers'])if(!packs.clubs?.[id]||Object.keys(packs.clubs[id].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} research pack missing or incomplete.`);
if(packs.packCount!==22||packs.playerCount!==352)throw new Error(`SWOS Studio ${BUILD} build failed: expected 22 research packs / 352 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==2)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 2/24 research.`);
if(queue.progress?.researchReadyClubs!==2||queue.totals?.clubs!==22||queue.totals?.stagedPlayers!==352||queue.totals?.requiredEvidenceCells!==1056||queue.next?.clubId!=='bolton-wanderers')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 22 clubs with Bolton Wanderers next.`);
if(intake.progress?.researchReadyClubs!==2||intake.progress?.researchPendingClubs!==22||intake.totals?.clubs!==22||intake.totals?.requiredEvidenceCells!==1056)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==2||validation.totals?.researchClubs!==22||validation.totals?.researchPlayers!==352)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.70.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:2,totalResearchClubs:22,totalResearchPlayers:352,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v171-blackburn-research-layer">
(function(){
'use strict';var BUILD='v1.71.0',META=${embedded};
function render(){var anchor=document.getElementById('v170-birmingham-research')||document.getElementById('v169-research-engine');if(!anchor)return false;
if(!document.getElementById('v171-blackburn-research')){var box=document.createElement('div');box.id='v171-blackburn-research';box.className='card stack';box.innerHTML='<strong>✅ Blackburn Rovers research pack promoted</strong><span class="about">Blackburn Rovers has now passed the same exact-16 identity and evidence guard as Birmingham City.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. The queue recalculates automatically after each promotion.</span><span class="feature-status available">2 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v171-release-card')){var a=document.getElementById('v170-release-card')||document.getElementById('v169-release-card');if(a){var c=document.createElement('div');c.id='v171-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.71.0 — Blackburn Rovers research promotion</strong><span class="about">• Blackburn Rovers is the second Championship club through the evidence-gated research engine.</span><span class="about">• The pack contains 16 identity-matched players with sourced age, valuation and exact SWOS position.</span><span class="about">• Championship research advances to 2 / 24 without changing the completed Premier League 20 / 20 set.</span><span class="about">• Remaining work is 22 clubs / 352 staged players / 1,056 mandatory evidence cells.</span><span class="about">• Bolton Wanderers is next.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v171-blackburn-research-layer')||!html.includes('<title>SWOS Studio v1.71.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Blackburn research layer missing.`);
console.log(`SWOS Studio v1.71.0 Blackburn research promotion complete · Championship 2/24 · all research 22 clubs / 352 players · next ${queue.next.clubName} · binary writes locked.`);
