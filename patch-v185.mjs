import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.85.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.84.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.84.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);

if(manifest.version!=='2026.27-england-research.16')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .16; found ${manifest.version}.`);
if(!packs.clubs?.['sheffield-united']||Object.keys(packs.clubs['sheffield-united'].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Sheffield United research pack missing or incomplete.`);
const sheffieldIdentities=new Set((identities.clubs?.['sheffield-united']||[]).map(p=>p.footballName));
const sheffieldResearch=new Set(Object.keys(packs.clubs['sheffield-united'].players||{}));
if(sheffieldIdentities.size!==16||sheffieldResearch.size!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Sheffield United identity/research sets must both contain exactly 16 players.`);
for(const name of sheffieldIdentities)if(!sheffieldResearch.has(name))throw new Error(`SWOS Studio ${BUILD} build failed: Sheffield United research pack is missing identity player ${name}.`);
const southamptonNames=new Set((identities.clubs?.southampton||[]).map(p=>p.footballName));
const stokeNames=new Set((identities.clubs?.['stoke-city']||[]).map(p=>p.footballName));
if(southamptonNames.has('Joshua Quarshie')||!southamptonNames.has('Keven Schlotterbeck'))throw new Error(`SWOS Studio ${BUILD} build failed: Southampton post-window correction was not applied.`);
for(const stale of ['Tatsuki Seko','Sorba Thomas'])if(stokeNames.has(stale))throw new Error(`SWOS Studio ${BUILD} build failed: stale Stoke identity ${stale} survived correction.`);
for(const current of ['Jack McGlynn','Million Manhoef'])if(!stokeNames.has(current))throw new Error(`SWOS Studio ${BUILD} build failed: corrected Stoke identity ${current} is missing.`);
if(packs.packCount!==36||packs.playerCount!==576)throw new Error(`SWOS Studio ${BUILD} build failed: expected 36 research packs / 576 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==16)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 16/24 research.`);
if(queue.progress?.researchReadyClubs!==16||queue.totals?.clubs!==8||queue.totals?.stagedPlayers!==128||queue.totals?.requiredEvidenceCells!==384||queue.next?.clubId!=='southampton')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 8 clubs with Southampton next.`);
if(intake.progress?.researchReadyClubs!==16||intake.progress?.researchPendingClubs!==8||intake.totals?.clubs!==8||intake.totals?.players!==128||intake.totals?.requiredEvidenceCells!==384)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==16||validation.totals?.researchClubs!==36||validation.totals?.researchPlayers!==576)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.84.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:16,totalResearchClubs:36,totalResearchPlayers:576,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v185-sheffield-research-layer">
(function(){
'use strict';var BUILD='v1.85.0',META=${embedded};
function render(){var anchor=document.getElementById('v184-qpr-research')||document.getElementById('v183-preston-research');if(!anchor)return false;
if(!document.getElementById('v185-sheffield-research')){var box=document.createElement('div');box.id='v185-sheffield-research';box.className='card stack';box.innerHTML='<strong>✅ Sheffield United research pack promoted</strong><span class="about">All 16 selected Sheffield United identities match current post-window squad evidence and sourced age, market-value and exact SWOS-position fields.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Eight Championship clubs remain.</span><span class="feature-status available">16 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v185-release-card')){var a=document.getElementById('v184-release-card')||document.getElementById('v183-release-card');if(a){var c=document.createElement('div');c.id='v185-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.85.0 — Sheffield United research promotion</strong><span class="about">• Sheffield United passes the exact-16 identity-matched research gate.</span><span class="about">• The Ollie/Oliver Arblaster name variant remains tied to one published SWOS identity rather than creating a duplicate.</span><span class="about">• Current right/left-back and wide-midfield roles are mapped explicitly.</span><span class="about">• Southampton and Stoke post-window identity corrections are applied before their research stages can publish.</span><span class="about">• Championship research reaches 16 / 24; Southampton is next.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v185-sheffield-research-layer')||!html.includes('<title>SWOS Studio v1.85.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Sheffield United research layer missing.`);
console.log(`SWOS Studio v1.85.0 Sheffield United research promotion complete · Championship 16/24 · all research 36 clubs / 576 players · next ${queue.next.clubName} · binary writes locked.`);
