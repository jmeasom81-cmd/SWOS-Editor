import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.79.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.78.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.78.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-research.10')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .10; found ${manifest.version}.`);
for(const id of ['birmingham-city','blackburn-rovers','bolton-wanderers','bristol-city','burnley','cardiff-city','charlton-athletic','derby-county','lincoln-city','middlesbrough'])if(!packs.clubs?.[id]||Object.keys(packs.clubs[id].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} research pack missing or incomplete.`);
const boroNames=new Set((identities.clubs?.middlesbrough||[]).map(p=>p.footballName));
for(const stale of ['Seny Dieng','Finley Munroe','Morgan Whittaker'])if(boroNames.has(stale))throw new Error(`SWOS Studio ${BUILD} build failed: stale Middlesbrough identity ${stale} survived correction.`);
for(const current of ['Radek Vitek','Ashley Phillips','Amario Cozier-Duberry'])if(!boroNames.has(current))throw new Error(`SWOS Studio ${BUILD} build failed: corrected Middlesbrough identity ${current} is missing.`);
if(boroNames.size!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Middlesbrough corrected selection must remain exactly 16.`);
if(packs.packCount!==30||packs.playerCount!==480)throw new Error(`SWOS Studio ${BUILD} build failed: expected 30 research packs / 480 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==10)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 10/24 research.`);
if(queue.progress?.researchReadyClubs!==10||queue.totals?.clubs!==14||queue.totals?.stagedPlayers!==224||queue.totals?.requiredEvidenceCells!==672||queue.next?.clubId!=='millwall')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 14 clubs with Millwall next.`);
if(intake.progress?.researchReadyClubs!==10||intake.progress?.researchPendingClubs!==14||intake.totals?.clubs!==14||intake.totals?.requiredEvidenceCells!==672)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==10||validation.totals?.researchClubs!==30||validation.totals?.researchPlayers!==480)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.78.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:10,totalResearchClubs:30,totalResearchPlayers:480,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v179-middlesbrough-research-layer">
(function(){
'use strict';var BUILD='v1.79.0',META=${embedded};
function render(){var anchor=document.getElementById('v178-lincoln-research')||document.getElementById('v177-derby-research');if(!anchor)return false;
if(!document.getElementById('v179-middlesbrough-research')){var box=document.createElement('div');box.id='v179-middlesbrough-research';box.className='card stack';box.innerHTML='<strong>✅ Middlesbrough research pack promoted</strong><span class="about">The post-window roster guard caught three stale identities before research publication. Seny Dieng, Finley Munroe and Morgan Whittaker were replaced one-for-one by current-role equivalents before the exact-16 research pack was admitted.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Fourteen Championship clubs remain in the research queue.</span><span class="feature-status available">10 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v179-release-card')){var a=document.getElementById('v178-release-card')||document.getElementById('v177-release-card');if(a){var c=document.createElement('div');c.id='v179-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.79.0 — Middlesbrough roster correction + research promotion</strong><span class="about">• A fresh post-window check removed three no-longer-current selected players before research publication.</span><span class="about">• Radek Vitek, Ashley Phillips and Amario Cozier-Duberry enter through the auditable one-for-one identity correction layer.</span><span class="about">• Middlesbrough then passes the exact-16 sourced age, market-value and SWOS-position research gate.</span><span class="about">• Championship research reaches 10 / 24 while Premier League remains protected at 20 / 20.</span><span class="about">• Remaining Championship research is 14 clubs / 224 players / 672 mandatory evidence cells.</span><span class="about">• Millwall is next. TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v179-middlesbrough-research-layer')||!html.includes('<title>SWOS Studio v1.79.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Middlesbrough research layer missing.`);
console.log(`SWOS Studio v1.79.0 Middlesbrough research promotion complete · Championship 10/24 · all research 30 clubs / 480 players · next ${queue.next.clubName} · binary writes locked.`);
