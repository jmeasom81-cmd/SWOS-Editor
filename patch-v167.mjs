import fs from 'node:fs';

const FILE='dist/index.html',IDENTITIES='football-db/identities.json',COVERAGE='football-db/coverage.json',QUEUE='football-db/identity-expansion-queue.json',INTAKE='football-db/identity-intake.json',MANIFEST='football-db/manifest.json',VALIDATION='football-db/validation.json';
const BUILD='v1.67.0';
for(const file of [FILE,IDENTITIES,COVERAGE,QUEUE,INTAKE,MANIFEST,VALIDATION])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.66.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.66.0 output was not found.`);

const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
const finalIds=['stoke-city','swansea-city','watford','west-bromwich-albion','west-ham-united','wolverhampton-wanderers','wrexham'];

if(manifest.version!=='2026.27-england-identity.44')throw new Error(`SWOS Studio ${BUILD} build failed: expected england identity DB .44; found ${manifest.version}.`);
for(const id of finalIds)if(!Array.isArray(identities.clubs?.[id])||identities.clubs[id].length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} is not a validated 16-player identity pack.`);
if(identities.clubCount!==44||identities.playerCount!==759||identities.divisionCoverage?.championship?.clubs!==24||identities.divisionCoverage?.championship?.players!==384)throw new Error(`SWOS Studio ${BUILD} build failed: expected 44 England identity clubs / 759 players with all 24 Championship clubs.`);
if(champ?.identityReady!==24||champ?.researchReady!==0||pl?.identityReady!==20||pl?.researchReady!==20)throw new Error(`SWOS Studio ${BUILD} build failed: expected Championship 24 identity-ready / 0 research-ready and Premier League 20 / 20.`);
if(coverage.summary?.identityReady!==44||coverage.summary?.researchReady!==20)throw new Error(`SWOS Studio ${BUILD} build failed: England coverage summary is inconsistent.`);
if(queue.totals?.identityReady!==24||queue.totals?.evidenceRequired!==0||queue.next!==null)throw new Error(`SWOS Studio ${BUILD} build failed: Championship identity queue is not complete.`);
if(intake.totals?.identityReady!==24||intake.next!==null||intake.totals?.promotionReadyClubs!==0)throw new Error(`SWOS Studio ${BUILD} build failed: Championship identity intake is not closed cleanly.`);
if(validation.status!=='pass'||validation.totals?.identityClubs!==44||validation.totals?.championshipIdentityClubs!==24)throw new Error(`SWOS Studio ${BUILD} build failed: identity expansion validation is stale.`);

html=html.replace('<title>SWOS Studio v1.66.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={englandIdentityClubs:44,englandIdentityPlayers:759,champReady:24,champPlayers:384,plResearch:20,databaseVersion:manifest.version,completed:['Stoke City','Swansea City','Watford','West Bromwich Albion','West Ham United','Wolverhampton Wanderers','Wrexham']};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v167-championship-complete-layer">
(function(){
'use strict';var BUILD='v1.67.0',META=${embedded};
function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
function render(){
  var panel=document.getElementById('v159-championship-identity');
  if(panel){
    var head=panel.querySelector('.v159-head div');
    if(head)head.innerHTML='<strong>🏆 Championship Identity Expansion — Complete</strong><p>All 24 Championship clubs now have evidence-gated 16-player 2026/27 identity packs. The identity queue is closed cleanly; the next safe phase is Championship player research, not binary installation.</p>';
    var stats=panel.querySelector('.v159-stats');
    if(stats)stats.innerHTML='<div class="v159-stat"><small>England identity</small><b>'+META.englandIdentityClubs+' / 92</b></div><div class="v159-stat"><small>Championship ready</small><b>24 / 24 ✓</b></div><div class="v159-stat"><small>Champ players</small><b>'+META.champPlayers+'</b></div><div class="v159-stat"><small>Next phase</small><b>Research</b></div>';
  }
  var anchor=document.getElementById('v166-southampton-summary')||document.getElementById('v165-sheffield-united-summary')||panel;
  if(!anchor)return false;
  if(!document.getElementById('v167-championship-complete-summary')){
    var box=document.createElement('div');box.id='v167-championship-complete-summary';box.className='card stack';
    box.innerHTML='<strong>Championship identity foundation complete ✓</strong><span class="about">The final seven clubs have cleared the same exact-16, role-balance, uniqueness and source-evidence guards: '+META.completed.map(esc).join(' · ')+'.</span><span class="about">The Championship now contains '+META.champPlayers+' selected current identities across all 24 clubs. England carries '+META.englandIdentityPlayers+' selected identities across '+META.englandIdentityClubs+' clubs.</span><span class="about">No Championship club remains in the identity evidence queue. Research attributes remain a separate evidence stage so identity completion cannot silently invent player ability.</span><span class="feature-status available">24 / 24 CHAMPIONSHIP IDENTITY READY ✓</span>';
    anchor.insertAdjacentElement('afterend',box);
  }
  if(!document.getElementById('v167-release-card')){
    var a=document.getElementById('v166-release-card')||document.getElementById('v165-release-card');
    if(a){var c=document.createElement('div');c.id='v167-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.67.0 — Championship identity complete</strong><span class="about">• Stoke City, Swansea City, Watford, West Bromwich Albion, West Ham United, Wolverhampton Wanderers and Wrexham complete the division.</span><span class="about">• Championship identity coverage is now 24 / 24 clubs and 384 selected players.</span><span class="about">• England identity coverage reaches 44 / 92 clubs and 759 selected players.</span><span class="about">• A source-only preflight validates every Championship evidence file before any promotion begins.</span><span class="about">• The identity queue must finish at zero outstanding clubs or this build fails.</span><span class="about">• Premier League research remains 20 / 20. Championship research is deliberately still 0 / 24 until its separate evidence packs are built.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}
  }
  document.title='SWOS Studio '+BUILD;
  var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;
  return true;
}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v167-championship-complete-layer')||!html.includes('<title>SWOS Studio v1.67.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Championship completion layer missing.`);
console.log(`SWOS Studio ${BUILD} Championship identity foundation complete · 24/24 · England 44/92 · 759 selected identities · research next · binary writes locked.`);
