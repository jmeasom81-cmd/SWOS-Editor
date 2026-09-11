import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.82.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.81.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.81.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);

if(manifest.version!=='2026.27-england-research.13')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .13; found ${manifest.version}.`);
if(!packs.clubs?.portsmouth||Object.keys(packs.clubs.portsmouth.players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Portsmouth research pack missing or incomplete.`);
const identityNames=new Set((identities.clubs?.portsmouth||[]).map(p=>p.footballName));
const researchNames=new Set(Object.keys(packs.clubs.portsmouth.players||{}));
if(identityNames.size!==16||researchNames.size!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Portsmouth identity/research sets must both contain exactly 16 players.`);
for(const name of identityNames)if(!researchNames.has(name))throw new Error(`SWOS Studio ${BUILD} build failed: Portsmouth research pack is missing identity player ${name}.`);
if(packs.packCount!==33||packs.playerCount!==528)throw new Error(`SWOS Studio ${BUILD} build failed: expected 33 research packs / 528 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==13)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 13/24 research.`);
if(queue.progress?.researchReadyClubs!==13||queue.totals?.clubs!==11||queue.totals?.stagedPlayers!==176||queue.totals?.requiredEvidenceCells!==528||queue.next?.clubId!=='preston-north-end')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 11 clubs with Preston North End next.`);
if(intake.progress?.researchReadyClubs!==13||intake.progress?.researchPendingClubs!==11||intake.totals?.clubs!==11||intake.totals?.players!==176||intake.totals?.requiredEvidenceCells!==528)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==13||validation.totals?.researchClubs!==33||validation.totals?.researchPlayers!==528)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.81.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:13,totalResearchClubs:33,totalResearchPlayers:528,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v182-portsmouth-research-layer">
(function(){
'use strict';var BUILD='v1.82.0',META=${embedded};
function render(){var anchor=document.getElementById('v181-norwich-research')||document.getElementById('v180-millwall-research');if(!anchor)return false;
if(!document.getElementById('v182-portsmouth-research')){var box=document.createElement('div');box.id='v182-portsmouth-research';box.className='card stack';box.innerHTML='<strong>✅ Portsmouth research pack promoted</strong><span class="about">All 16 Portsmouth identities are matched to sourced age, current-role and latest-published market-value evidence. Parent-club valuation pages for Benjamin Arthur and older Abu Kamara records are treated only as valuation evidence, while current Portsmouth roster sources control club identity.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Eleven Championship clubs remain.</span><span class="feature-status available">13 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v182-release-card')){var a=document.getElementById('v181-release-card')||document.getElementById('v180-release-card');if(a){var c=document.createElement('div');c.id='v182-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.82.0 — Portsmouth research promotion</strong><span class="about">• Portsmouth passes the exact-16 current-squad research gate.</span><span class="about">• Benjamin Arthur is correctly treated as a current Portsmouth loanee even though older valuation pages retain Brentford ownership.</span><span class="about">• Abu Kamara is correctly treated as a current Portsmouth player after his August 2026 permanent return.</span><span class="about">• Wing roles for Segecic, Murphy, Kamara and Umeh-Chibueze are mapped explicitly rather than collapsed into generic attack.</span><span class="about">• Championship research reaches 13 / 24; Preston North End is next.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v182-portsmouth-research-layer')||!html.includes('<title>SWOS Studio v1.82.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Portsmouth research layer missing.`);
console.log(`SWOS Studio v1.82.0 Portsmouth research promotion complete · Championship 13/24 · all research 33 clubs / 528 players · next ${queue.next.clubName} · binary writes locked.`);
