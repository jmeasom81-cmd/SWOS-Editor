import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.87.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.86.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.86.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);

if(manifest.version!=='2026.27-england-research.18')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .18; found ${manifest.version}.`);
if(!packs.clubs?.['stoke-city']||Object.keys(packs.clubs['stoke-city'].players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Stoke City research pack missing or incomplete.`);
const identityNames=new Set((identities.clubs?.['stoke-city']||[]).map(p=>p.footballName));
const researchNames=new Set(Object.keys(packs.clubs['stoke-city'].players||{}));
if(identityNames.size!==16||researchNames.size!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Stoke City identity/research sets must both contain exactly 16 players.`);
for(const stale of ['Tatsuki Seko','Sorba Thomas'])if(identityNames.has(stale)||researchNames.has(stale))throw new Error(`SWOS Studio ${BUILD} build failed: stale Stoke player ${stale} survived correction.`);
for(const current of ['Jack McGlynn','Million Manhoef'])if(!identityNames.has(current)||!researchNames.has(current))throw new Error(`SWOS Studio ${BUILD} build failed: corrected Stoke player ${current} is missing.`);
for(const name of identityNames)if(!researchNames.has(name))throw new Error(`SWOS Studio ${BUILD} build failed: Stoke City research pack is missing identity player ${name}.`);
if(packs.packCount!==38||packs.playerCount!==608)throw new Error(`SWOS Studio ${BUILD} build failed: expected 38 research packs / 608 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==18)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 18/24 research.`);
if(queue.progress?.researchReadyClubs!==18||queue.totals?.clubs!==6||queue.totals?.stagedPlayers!==96||queue.totals?.requiredEvidenceCells!==288||queue.next?.clubId!=='swansea-city')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 6 clubs with Swansea City next.`);
if(intake.progress?.researchReadyClubs!==18||intake.progress?.researchPendingClubs!==6||intake.totals?.clubs!==6||intake.totals?.players!==96||intake.totals?.requiredEvidenceCells!==288)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==18||validation.totals?.researchClubs!==38||validation.totals?.researchPlayers!==608)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.86.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:18,totalResearchClubs:38,totalResearchPlayers:608,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v187-stoke-research-layer">
(function(){
'use strict';var BUILD='v1.87.0',META=${embedded};
function render(){var anchor=document.getElementById('v186-southampton-research')||document.getElementById('v185-sheffield-research');if(!anchor)return false;
if(!document.getElementById('v187-stoke-research')){var box=document.createElement('div');box.id='v187-stoke-research';box.className='card stack';box.innerHTML='<strong>✅ Stoke City research pack promoted</strong><span class="about">The post-window guard removes Tatsuki Seko and Sorba Thomas after their moves, then admits current Stoke players Jack McGlynn and Million Manhoef one-for-one before research publication.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Six Championship clubs remain.</span><span class="feature-status available">18 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v187-release-card')){var a=document.getElementById('v186-release-card')||document.getElementById('v185-release-card');if(a){var c=document.createElement('div');c.id='v187-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.87.0 — Stoke roster correction + three-club research batch</strong><span class="about">• Sheffield United, Southampton and Stoke City have all passed the exact-16 evidence gate in this batched release.</span><span class="about">• Southampton removes loaned-out Joshua Quarshie and adds current centre-back Keven Schlotterbeck.</span><span class="about">• Stoke removes departed Tatsuki Seko and Sorba Thomas, adding current Jack McGlynn and Million Manhoef.</span><span class="about">• The clean-build validator now recognises the schema-only Championship bootstrap state without masking genuinely partial pipelines.</span><span class="about">• Championship research reaches 18 / 24; Swansea City is next.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v187-stoke-research-layer')||!html.includes('<title>SWOS Studio v1.87.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Stoke City research layer missing.`);
console.log(`SWOS Studio v1.87.0 Stoke City research promotion complete · Championship 18/24 · all research 38 clubs / 608 players · next ${queue.next.clubName} · binary writes locked.`);
