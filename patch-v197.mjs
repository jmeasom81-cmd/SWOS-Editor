import fs from 'node:fs';

const FILE='dist/index.html',QUEUE='football-db/league-two-identity-expansion-queue.json',INTAKE='football-db/league-two-identity-intake.json',IDENTITIES='football-db/identities.json',COVERAGE='football-db/coverage.json',PACKS='football-db/research-packs.json',VALIDATION='football-db/validation.json',RESEARCH_VALIDATION='football-db/research-expansion-validation.json',MANIFEST='football-db/manifest.json',BUILD='v1.97.0';
for(const file of [FILE,QUEUE,INTAKE,IDENTITIES,COVERAGE,PACKS,VALIDATION,RESEARCH_VALIDATION,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.96.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.96.0 output.`);
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8')),intake=JSON.parse(fs.readFileSync(INTAKE,'utf8')),identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8')),coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8')),packs=JSON.parse(fs.readFileSync(PACKS,'utf8')),validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8')),researchValidation=JSON.parse(fs.readFileSync(RESEARCH_VALIDATION,'utf8')),manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const pl=coverage.divisions?.find(d=>d.code===0),champ=coverage.divisions?.find(d=>d.code===1),l1=coverage.divisions?.find(d=>d.code===2),l2=coverage.divisions?.find(d=>d.code===3);
if(manifest.version!=='2026.27-england-identity.92'||identities.clubCount!==92||identities.playerCount!==1527)throw new Error(`SWOS Studio ${BUILD} build failed: identity or database version totals are stale.`);
if(identities.divisionCoverage?.premierLeague?.clubs!==20||identities.divisionCoverage?.championship?.clubs!==24||identities.divisionCoverage?.leagueOne?.clubs!==24||identities.divisionCoverage?.leagueTwo?.clubs!==24||identities.divisionCoverage?.leagueTwo?.players!==384)throw new Error(`SWOS Studio ${BUILD} build failed: division identity totals are inconsistent.`);
if(pl?.researchReady!==20||champ?.researchReady!==24||l1?.researchReady!==24||l2?.identityReady!==24||l2?.researchReady!==0)throw new Error(`SWOS Studio ${BUILD} build failed: division coverage totals are inconsistent.`);
if(packs.packCount!==68||packs.playerCount!==1088)throw new Error(`SWOS Studio ${BUILD} build failed: research must remain at 68 clubs / 1,088 players.`);
if(queue.status!=='complete'||queue.totals?.identityReady!==24||queue.totals?.evidenceRequired!==0||queue.next!==null)throw new Error(`SWOS Studio ${BUILD} build failed: League Two identity queue is not closed.`);
if(intake.status!=='complete'||intake.totals?.identityReady!==24||intake.totals?.promotionReadyClubs!==0||intake.next!==null)throw new Error(`SWOS Studio ${BUILD} build failed: League Two identity intake is not closed.`);
if(validation.status!=='pass'||validation.databaseVersion!==manifest.version||validation.totals?.leagueTwoIdentityClubs!==24||validation.totals?.leagueTwoIdentityPlayers!==384)throw new Error(`SWOS Studio ${BUILD} build failed: League Two identity validation is stale.`);
if(researchValidation.status!=='pass'||researchValidation.databaseVersion!==manifest.version||researchValidation.totals?.researchClubs!==68||researchValidation.totals?.researchPlayers!==1088||researchValidation.divisions?.leagueTwo?.researchReady!==0)throw new Error(`SWOS Studio ${BUILD} build failed: England research validation is stale.`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed.`);

html=html.replace('<title>SWOS Studio v1.96.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={identityClubs:identities.clubCount,identityPlayers:identities.playerCount,researchClubs:packs.packCount,researchPlayers:packs.playerCount};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v197-league-two-identity-complete-layer">
(function(){
'use strict';var BUILD='v1.97.0',META=${embedded};
function render(){var anchor=document.getElementById('v196-league-one-research-complete')||document.getElementById('v195-league-one-complete');if(!anchor)return false;
if(!document.getElementById('v197-league-two-identity-complete')){var box=document.createElement('div');box.id='v197-league-two-identity-complete';box.className='card stack';box.innerHTML='<strong>👤 League Two identity foundation — complete</strong><span class="about">All <b>24 / 24 League Two clubs</b> now have evidence-gated, balanced 16-player current identity packs.</span><span class="about">England identity coverage is now <b>'+META.identityClubs+' / 92 clubs</b> with <b>'+META.identityPlayers+' selected players</b>.</span><span class="about">League Two ages, published market values and exact SWOS positions are <b>not generated yet</b>; those remain the next separate research stage. England research stays at '+META.researchClubs+' clubs / '+META.researchPlayers+' players.</span><span class="feature-status available">24 / 24 LEAGUE TWO IDENTITIES READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
if(!document.getElementById('v197-release-card')){var a=document.getElementById('v196-release-card')||document.getElementById('v195-release-card');if(a){var c=document.createElement('div');c.id='v197-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.97.0 — League Two identity foundation complete</strong><span class="about">• 384 current League Two players passed the exact-16 identity and balanced-role guard.</span><span class="about">• All 92 England clubs now have selected player identities.</span><span class="about">• League Two values, ages and exact SWOS positions remain deliberately unresearched.</span><span class="about">• The League Two identity queue and intake are closed cleanly.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v197-league-two-identity-complete-layer')||!html.includes('<title>SWOS Studio v1.97.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: completion UI layer missing.`);
console.log('SWOS Studio v1.97.0 League Two identity completion · 24/24 · England identities 92 clubs / 1,527 players · research 68 clubs / 1,088 players · binary writes locked.');
