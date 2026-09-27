import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.86.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.85.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.85.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);

if(manifest.version!=='2026.27-england-research.17')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .17; found ${manifest.version}.`);
if(!packs.clubs?.southampton||Object.keys(packs.clubs.southampton.players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Southampton research pack missing or incomplete.`);
const identityNames=new Set((identities.clubs?.southampton||[]).map(p=>p.footballName));
const researchNames=new Set(Object.keys(packs.clubs.southampton.players||{}));
if(identityNames.size!==16||researchNames.size!==16||identityNames.has('Joshua Quarshie')||!identityNames.has('Keven Schlotterbeck'))throw new Error(`SWOS Studio ${BUILD} build failed: corrected Southampton identity/research sets are invalid.`);
for(const name of identityNames)if(!researchNames.has(name))throw new Error(`SWOS Studio ${BUILD} build failed: Southampton research pack is missing identity player ${name}.`);
if(packs.packCount!==37||packs.playerCount!==592)throw new Error(`SWOS Studio ${BUILD} build failed: expected 37 research packs / 592 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==17)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 17/24 research.`);
if(queue.progress?.researchReadyClubs!==17||queue.totals?.clubs!==7||queue.totals?.stagedPlayers!==112||queue.totals?.requiredEvidenceCells!==336||queue.next?.clubId!=='stoke-city')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 7 clubs with Stoke City next.`);
if(intake.progress?.researchReadyClubs!==17||intake.progress?.researchPendingClubs!==7||intake.totals?.clubs!==7||intake.totals?.players!==112||intake.totals?.requiredEvidenceCells!==336)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==17||validation.totals?.researchClubs!==37||validation.totals?.researchPlayers!==592)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.85.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:17,totalResearchClubs:37,totalResearchPlayers:592,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v186-southampton-research-layer">
(function(){
'use strict';var BUILD='v1.86.0',META=${embedded};
function render(){var anchor=document.getElementById('v185-sheffield-research')||document.getElementById('v184-qpr-research');if(!anchor)return false;
if(!document.getElementById('v186-southampton-research')){var box=document.createElement('div');box.id='v186-southampton-research';box.className='card stack';box.innerHTML='<strong>✅ Southampton research pack promoted</strong><span class="about">Joshua Quarshie is removed after his Sturm Graz loan and current centre-back Keven Schlotterbeck enters one-for-one before the exact-16 evidence gate is allowed to pass.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Seven Championship clubs remain.</span><span class="feature-status available">17 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v186-release-card')){var a=document.getElementById('v185-release-card')||document.getElementById('v184-release-card');if(a){var c=document.createElement('div');c.id='v186-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.86.0 — Southampton roster correction + research promotion</strong><span class="about">• The post-window guard catches Joshua Quarshie\'s season-long Sturm Graz loan.</span><span class="about">• Keven Schlotterbeck replaces him one-for-one as a current Southampton centre-back.</span><span class="about">• Nathan Wood remains current and uses separate live-match evidence where the squad valuation page is incomplete.</span><span class="about">• Southampton then passes all 48 mandatory age, value and exact-position evidence cells.</span><span class="about">• Championship research reaches 17 / 24; Stoke City is next.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v186-southampton-research-layer')||!html.includes('<title>SWOS Studio v1.86.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Southampton research layer missing.`);
console.log(`SWOS Studio v1.86.0 Southampton research promotion complete · Championship 17/24 · all research 37 clubs / 592 players · next ${queue.next.clubName} · binary writes locked.`);
