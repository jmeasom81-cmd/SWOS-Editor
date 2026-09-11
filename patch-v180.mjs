import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.80.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.79.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.79.0 output was not found.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);

if(manifest.version!=='2026.27-england-research.11')throw new Error(`SWOS Studio ${BUILD} build failed: expected research DB .11; found ${manifest.version}.`);
if(!packs.clubs?.millwall||Object.keys(packs.clubs.millwall.players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Millwall research pack missing or incomplete.`);
const millwallNames=new Set((identities.clubs?.millwall||[]).map(p=>p.footballName));
if(millwallNames.has('Femi Azeez'))throw new Error(`SWOS Studio ${BUILD} build failed: departed Femi Azeez survived the Millwall correction.`);
if(!millwallNames.has('Lyndon Dykes'))throw new Error(`SWOS Studio ${BUILD} build failed: current Millwall striker Lyndon Dykes is missing.`);
if(millwallNames.size!==16)throw new Error(`SWOS Studio ${BUILD} build failed: corrected Millwall identity selection must remain exactly 16.`);
if(!Object.prototype.hasOwnProperty.call(packs.clubs.millwall.players,'Lyndon Dykes')||Object.prototype.hasOwnProperty.call(packs.clubs.millwall.players,'Femi Azeez'))throw new Error(`SWOS Studio ${BUILD} build failed: Millwall research pack does not match the corrected identity 16.`);
if(packs.packCount!==31||packs.playerCount!==496)throw new Error(`SWOS Studio ${BUILD} build failed: expected 31 research packs / 496 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==11)throw new Error(`SWOS Studio ${BUILD} build failed: expected PL 20/20 and Championship 11/24 research.`);
if(queue.progress?.researchReadyClubs!==11||queue.totals?.clubs!==13||queue.totals?.stagedPlayers!==208||queue.totals?.requiredEvidenceCells!==624||queue.next?.clubId!=='norwich-city')throw new Error(`SWOS Studio ${BUILD} build failed: pending Championship queue should be 13 clubs with Norwich City next.`);
if(intake.progress?.researchReadyClubs!==11||intake.progress?.researchPendingClubs!==13||intake.totals?.clubs!==13||intake.totals?.players!==208||intake.totals?.requiredEvidenceCells!==624)throw new Error(`SWOS Studio ${BUILD} build failed: Championship intake progress is stale.`);
if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==11||validation.totals?.researchClubs!==31||validation.totals?.researchPlayers!==496)throw new Error(`SWOS Studio ${BUILD} build failed: research expansion validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.79.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={champReady:11,totalResearchClubs:31,totalResearchPlayers:496,next:queue.next.clubName};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v180-millwall-research-layer">
(function(){
'use strict';var BUILD='v1.80.0',META=${embedded};
function render(){var anchor=document.getElementById('v179-middlesbrough-research')||document.getElementById('v178-lincoln-research');if(!anchor)return false;
if(!document.getElementById('v180-millwall-research')){var box=document.createElement('div');box.id='v180-millwall-research';box.className='card stack';box.innerHTML='<strong>✅ Millwall research pack promoted</strong><span class="about">The post-window guard removed Femi Azeez after his permanent Brighton transfer and substituted current Millwall striker Lyndon Dykes before any research values were published.</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalResearchClubs+' research-ready clubs / '+META.totalResearchPlayers+' researched players</b>.</span><span class="about">Next evidence target: <b>'+META.next+'</b>. Thirteen Championship clubs remain in the research queue.</span><span class="feature-status available">11 / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v180-release-card')){var a=document.getElementById('v179-release-card')||document.getElementById('v178-release-card');if(a){var c=document.createElement('div');c.id='v180-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.80.0 — Millwall post-window correction + research promotion</strong><span class="about">• Femi Azeez is removed from the selected Millwall identity 16 after his 2 September move to Brighton.</span><span class="about">• Lyndon Dykes enters one-for-one as a current Millwall forward, preserving the exact-16 role-balanced selection.</span><span class="about">• The Millwall pack then passes sourced age, market-value and exact SWOS-position checks.</span><span class="about">• Identity corrections can now be safely deferred during early incremental build stages and applied automatically once the relevant club pack exists.</span><span class="about">• Championship research reaches 11 / 24; Norwich City is next.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v180-millwall-research-layer')||!html.includes('<title>SWOS Studio v1.80.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Millwall research layer missing.`);
console.log(`SWOS Studio v1.80.0 Millwall research promotion complete · Championship 11/24 · all research 31 clubs / 496 players · next ${queue.next.clubName} · binary writes locked.`);
