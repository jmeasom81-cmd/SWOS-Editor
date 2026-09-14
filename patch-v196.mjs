import fs from 'node:fs';

const FILE='dist/index.html',QUEUE='football-db/league-one-research-queue.json',INTAKE='football-db/league-one-research-intake.json',IDENTITIES='football-db/identities.json',COVERAGE='football-db/coverage.json',PACKS='football-db/research-packs.json',VALIDATION='football-db/research-expansion-validation.json',MANIFEST='football-db/manifest.json',BUILD='v1.96.0';
for(const file of [FILE,QUEUE,INTAKE,IDENTITIES,COVERAGE,PACKS,VALIDATION,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.95.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.95.0 output.`);
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8')),intake=JSON.parse(fs.readFileSync(INTAKE,'utf8')),identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8')),coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8')),packs=JSON.parse(fs.readFileSync(PACKS,'utf8')),validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8')),manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const pl=coverage.divisions?.find(d=>d.code===0),champ=coverage.divisions?.find(d=>d.code===1),l1=coverage.divisions?.find(d=>d.code===2),l2=coverage.divisions?.find(d=>d.code===3);
if(manifest.version!=='2026.27-england-research-l1.24'||identities.clubCount!==68||identities.playerCount!==1143)throw new Error(`SWOS Studio ${BUILD} build failed: identity or database version totals are stale.`);
if(pl?.researchReady!==20||champ?.researchReady!==24||l1?.identityReady!==24||l1?.researchReady!==24||l2?.researchReady!==0)throw new Error(`SWOS Studio ${BUILD} build failed: division research totals are inconsistent.`);
if(packs.packCount!==68||packs.playerCount!==1088)throw new Error(`SWOS Studio ${BUILD} build failed: expected 68 research packs / 1,088 researched players.`);
if(queue.status!=='complete'||queue.progress?.researchReadyClubs!==24||queue.totals?.clubs!==0||queue.next!==null)throw new Error(`SWOS Studio ${BUILD} build failed: League One research queue is not closed.`);
if(intake.progress?.researchReadyClubs!==24||intake.totals?.clubs!==0||intake.totals?.promotionReadyClubs!==0||intake.nextPromotionReady!==null)throw new Error(`SWOS Studio ${BUILD} build failed: League One research intake is not closed.`);
if(validation.status!=='pass'||validation.databaseVersion!==manifest.version||validation.divisions?.leagueOne?.researchReady!==24||validation.totals?.researchClubs!==68||validation.totals?.researchPlayers!==1088)throw new Error(`SWOS Studio ${BUILD} build failed: England research validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed.`);

html=html.replace('<title>SWOS Studio v1.95.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={identityClubs:identities.clubCount,identityPlayers:identities.playerCount,researchClubs:packs.packCount,researchPlayers:packs.playerCount,leagueOnePlayers:384};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v196-league-one-research-complete-layer">
(function(){
'use strict';var BUILD='v1.96.0',META=${embedded};
function render(){var anchor=document.getElementById('v195-league-one-complete')||document.getElementById('v194-league-one-foundation');if(!anchor)return false;
if(!document.getElementById('v196-league-one-research-complete')){var box=document.createElement('div');box.id='v196-league-one-research-complete';box.className='card stack';box.innerHTML='<strong>🔬 League One research — complete</strong><span class="about">All <b>24 / 24 League One clubs</b> now have evidence-gated 16-player research packs covering age, published market value and exact SWOS position.</span><span class="about">England research coverage is now <b>'+META.researchClubs+' clubs / '+META.researchPlayers+' players</b>: Premier League 20 / 20, Championship 24 / 24 and League One 24 / 24.</span><span class="about">Identity coverage remains '+META.identityClubs+' / 92 clubs with '+META.identityPlayers+' selected identities. League Two is still held behind its own future evidence stage.</span><span class="feature-status available">24 / 24 LEAGUE ONE RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v196-release-card')){var a=document.getElementById('v195-release-card')||document.getElementById('v194-release-card');if(a){var c=document.createElement('div');c.id='v196-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.96.0 — League One research complete</strong><span class="about">• 384 League One players passed the exact-identity age, market-value and SWOS-position guard.</span><span class="about">• 68 England clubs and 1,088 players are now research-ready across the top three divisions.</span><span class="about">• Missing published valuations remain explicitly unavailable; no values were guessed.</span><span class="about">• The League One queue and intake are closed cleanly.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v196-league-one-research-complete-layer')||!html.includes('<title>SWOS Studio v1.96.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: completion UI layer missing.`);
console.log('SWOS Studio v1.96.0 League One research completion · 24/24 · England research 68 clubs / 1,088 players · binary writes locked.');
