import fs from 'node:fs';

const FILE='dist/index.html';
const IDENTITIES='football-db/identities.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/identity-expansion-queue.json';
const INTAKE='football-db/identity-intake.json';
const MANIFEST='football-db/manifest.json';
const VALIDATION='football-db/validation.json';
const BUILD='v1.60.0';
for(const file of [FILE,IDENTITIES,COVERAGE,QUEUE,INTAKE,MANIFEST,VALIDATION])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.59.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.59.0 output was not found.`);
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8')),coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8')),queue=JSON.parse(fs.readFileSync(QUEUE,'utf8')),intake=JSON.parse(fs.readFileSync(INTAKE,'utf8')),manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8')),validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
const expectedIds=['birmingham-city','blackburn-rovers','bolton-wanderers','bristol-city','burnley','cardiff-city'];
if(manifest.version!=='2026.27-england-identity.26')throw new Error(`SWOS Studio ${BUILD} build failed: expected england identity DB .26; found ${manifest.version}.`);
if(identities.clubCount!==26||identities.playerCount!==471||identities.divisionCoverage?.championship?.clubs!==6||identities.divisionCoverage?.championship?.players!==96)throw new Error(`SWOS Studio ${BUILD} build failed: expected 26 England identity clubs / 471 players with 6 Championship clubs.`);
for(const id of expectedIds)if(!Array.isArray(identities.clubs?.[id])||identities.clubs[id].length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${id} is not a validated 16-player identity pack.`);
if(champ?.identityReady!==6||champ?.researchReady!==0||pl?.identityReady!==20||pl?.researchReady!==20)throw new Error(`SWOS Studio ${BUILD} build failed: expected Championship 6 identity-ready / 0 research-ready and Premier League 20 / 20.`);
if(coverage.summary?.identityReady!==26||coverage.summary?.researchReady!==20)throw new Error(`SWOS Studio ${BUILD} build failed: England coverage summary is inconsistent.`);
if(queue.totals?.identityReady!==6||queue.totals?.evidenceRequired!==18||queue.next?.clubId!=='charlton-athletic')throw new Error(`SWOS Studio ${BUILD} build failed: Championship queue should advance to Charlton Athletic.`);
if(intake.totals?.identityReady!==6||intake.next?.clubId!=='charlton-athletic')throw new Error(`SWOS Studio ${BUILD} build failed: final identity intake should show six published clubs and Charlton next.`);
if(validation.status!=='pass'||validation.totals?.identityClubs!==26||validation.totals?.championshipIdentityClubs!==6)throw new Error(`SWOS Studio ${BUILD} build failed: identity expansion validation is stale.`);

html=html.replace('<title>SWOS Studio v1.59.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={englandIdentityClubs:identities.clubCount,englandIdentityPlayers:identities.playerCount,champReady:champ.identityReady,champPending:24-champ.identityReady,next:queue.next.clubName,plResearch:pl.researchReady,databaseVersion:manifest.version,wave:['Birmingham City','Blackburn Rovers','Bolton Wanderers','Bristol City','Burnley','Cardiff City']};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v160-championship-wave-layer">
(function(){
'use strict';var BUILD='v1.60.0',META=${embedded};
function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
function render(){
  var panel=document.getElementById('v159-championship-identity');
  if(panel){var head=panel.querySelector('.v159-head div');if(head)head.innerHTML='<strong>🏆 Championship Identity Expansion — Wave 1</strong><p>Six Championship clubs now have evidence-gated 16-player current identity packs. The pipeline remains deliberately sequential: every club must pass exact size, role balance, uniqueness and source checks before publication.</p>';var stats=panel.querySelector('.v159-stats');if(stats)stats.innerHTML='<div class="v159-stat"><small>England identity</small><b>'+META.englandIdentityClubs+' / 92</b></div><div class="v159-stat"><small>Championship ready</small><b>'+META.champReady+' / 24</b></div><div class="v159-stat"><small>PL research</small><b>'+META.plResearch+' / 20 ✓</b></div><div class="v159-stat"><small>Next club</small><b>'+esc(META.next)+'</b></div>';}
  var anchor=panel||document.getElementById('v1581-static-db-note')||document.getElementById('v146-data-expansion');if(!anchor)return false;
  if(!document.getElementById('v160-wave-summary')){var box=document.createElement('div');box.id='v160-wave-summary';box.className='card stack';box.innerHTML='<strong>Championship Wave 1 validated</strong><span class="about">'+META.wave.map(esc).join(' · ')+'</span><span class="about">England identity coverage is now '+META.englandIdentityClubs+' / 92 clubs and '+META.englandIdentityPlayers+' current selected identities. Championship research remains blocked until each identity pack is followed by its own research evidence.</span><span class="feature-status available">6 / 24 IDENTITY READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}
  if(!document.getElementById('v160-release-card')){var a=document.getElementById('v159-release-card')||document.getElementById('v1581-release-card')||document.getElementById('v158-release-card');if(a){var c=document.createElement('div');c.id='v160-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.60.0 — Championship identity wave 1</strong><span class="about">• Blackburn Rovers, Bolton Wanderers, Bristol City, Burnley and Cardiff City join Birmingham City through the guarded identity pipeline.</span><span class="about">• England identity coverage advances to 26 / 92 clubs and 471 selected current identities.</span><span class="about">• Every Championship pack contains exactly 16 unique sourced players with enforced role-balance minimums.</span><span class="about">• The next evidence target is '+esc(META.next)+'.</span><span class="about">• Premier League research remains complete at 20 / 20 and 320 researched players.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
  document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;
}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v160-championship-wave-layer')||!html.includes('<title>SWOS Studio v1.60.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Championship wave layer missing.`);
console.log(`SWOS Studio ${BUILD} Championship identity wave 1 complete · 6/24 ready · England ${identities.clubCount}/92 identity clubs · next ${queue.next.clubName} · ${intake.totals?.promotionReadyClubs||0} further evidence-ready.`);
