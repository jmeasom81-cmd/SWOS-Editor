import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.81.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.80.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.80.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);

if(manifest.version!=='2026.27-england-research.12')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .12; found ${manifest.version}.`);
if(!packs.clubs?.['norwich-city']||Object.keys(packs.clubs['norwich-city'].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Norwich City research pack missing or incomplete.`);
const identityNames=new Set((identities.clubs?.['norwich-city']||[]).map(p=>p.footballName));
const researchNames=new Set(Object.keys(packs.clubs['norwich-city'].players||{}));
if(identityNames.size!==16||researchNames.size!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Norwich identity/research sets must both contain exactly 16 players.`);
for(const name of identityNames)if(!researchNames.has(name))throw new Error(`SWOS Studio ${BUILD} build failed: Norwich research pack is missing identity player ${name}.`);
if(packs.packCount!==32||packs.playerCount!==512)throw new Error(`SWOS Studio ${BUILD} build failed: expected 32 research packs / 512 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==12)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 12/24 research.`);
if(queue.progress?.researchReadyClubs!==12||queue.totals?.clubs!==12||queue.totals?.stagedPlayers!==192||queue.totals?.requiredEvidenceCells!==576||queue.next?.clubId!=='portsmouth')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 12 clubs with Portsmouth next.`);
if(intake.progress?.researchReadyClubs!==12||intake.progress?.researchPendingClubs!==12||intake.totals?.clubs!==12||intake.totals?.players!==192||intake.totals?.requiredEvidenceCells!==576)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==12||validation.totals?.researchClubs!==32||validation.totals?.researchPlayers!==512)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.80.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:12,totalResearchClubs:32,totalResearchPlayers:512,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v181-norwich-research-layer">
(function(){
'use strict';var BUILD='v1.81.0',META=${embedded};
function render(){var anchor=document.getElementById('v180-millwall-research')||document.getElementById('v179-middlesbrough-research');if(!anchor)return false;
if(!document.getElementById('v181-norwich-research')){var box=document.createElement('div');box.id='v181-norwich-research';box.className='card stack';box.innerHTML='<strong>✅ Norwich City research pack promoted</strong><span class="about">All 16 selected Norwich identities passed the current-squad, age, market-value and exact SWOS-position checks without requiring a post-window replacement.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. The Championship research programme is now exactly halfway complete.</span><span class="feature-status available">12 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v181-release-card')){var a=document.getElementById('v180-release-card')||document.getElementById('v179-release-card');if(a){var c=document.createElement('div');c.id='v181-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.81.0 — Norwich City research promotion</strong><span class="about">• Norwich City passes the exact-16 identity-matched research gate.</span><span class="about">• Ages are aligned to the 11 September 2026 snapshot rather than blindly copying stale displayed ages.</span><span class="about">• Full-back, midfield, wing and striker roles are mapped to explicit SWOS position codes.</span><span class="about">• Championship research reaches 12 / 24 and England reaches 32 research-ready clubs / 512 researched players.</span><span class="about">• Portsmouth is next with 12 Championship clubs still pending.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v181-norwich-research-layer')||!html.includes('<title>SWOS Studio v1.81.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Norwich research layer missing.`);
console.log(`SWOS Studio v1.81.0 Norwich research promotion complete · Championship 12/24 · all research 32 clubs / 512 players · next ${queue.next.clubName} · binary writes locked.`);
