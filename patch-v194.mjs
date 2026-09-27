import fs from 'node:fs';

const FILE='dist/index.html';
const COVERAGE='football-db/coverage.json';
const RESEARCH_QUEUE='football-db/championship-research-queue.json';
const PROFILE_QUEUE='football-db/club-profile-queue.json';
const PROFILE_INTAKE='football-db/club-profile-intake.json';
const PROFILES='football-db/club-profiles.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.94.0';

for(const file of [FILE,COVERAGE,RESEARCH_QUEUE,PROFILE_QUEUE,PROFILE_INTAKE,PROFILES,MANIFEST]){
  if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
}

let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.93.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.93.0 output was not found.`);

const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const researchQueue=JSON.parse(fs.readFileSync(RESEARCH_QUEUE,'utf8'));
const queue=JSON.parse(fs.readFileSync(PROFILE_QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(PROFILE_INTAKE,'utf8'));
const profiles=JSON.parse(fs.readFileSync(PROFILES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const pl=coverage.divisions?.find(d=>d.code===0),champ=coverage.divisions?.find(d=>d.code===1);

if(manifest.version!=='2026.27-england-research.24')throw new Error(`SWOS Studio ${BUILD} build failed: player-research DB version changed unexpectedly (${manifest.version}).`);
if(pl?.researchReady!==20||champ?.researchReady!==24||champ?.identityReady!==24)throw new Error(`SWOS Studio ${BUILD} build failed: completed PL/Championship research coverage regressed.`);
if(researchQueue.status!=='complete'||researchQueue.next!==null||researchQueue.totals?.clubs!==0)throw new Error(`SWOS Studio ${BUILD} build failed: Championship player-research queue reopened unexpectedly.`);

if(profiles.profileCount!==0||Object.keys(profiles.clubs||{}).length!==0)throw new Error(`SWOS Studio ${BUILD} build failed: profile foundation should begin at 0/44 published profiles.`);
if(queue.status!=='active'||queue.totals?.eligibleClubs!==44||queue.totals?.profileReadyClubs!==0||queue.totals?.pendingClubs!==44||queue.totals?.pendingEvidenceSections!==176||queue.next?.clubId!=='arsenal')throw new Error(`SWOS Studio ${BUILD} build failed: club-profile queue foundation totals are invalid.`);
if(intake.progress?.profileReadyClubs!==0||intake.progress?.profilePendingClubs!==44||intake.totals?.clubs!==44)throw new Error(`SWOS Studio ${BUILD} build failed: club-profile intake foundation is invalid.`);
if(coverage.summary?.managerReady!==0||coverage.summary?.formationReady!==0||coverage.summary?.kitsReady!==0)throw new Error(`SWOS Studio ${BUILD} build failed: coverage should expose zero completed club profiles at foundation.`);

if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false||profiles.safety?.teamWriteReady!==false||profiles.safety?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: profile foundation must not unlock binary writes.`);

html=html.replace('<title>SWOS Studio v1.93.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={eligible:44,pending:44,sections:176,next:'Arsenal'};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v194-profile-foundation-layer">
(function(){
'use strict';var BUILD='v1.94.0',META=${embedded};
function render(){
  var anchor=document.getElementById('v193-research')||document.getElementById('v192-research');
  if(!anchor)return false;
  if(!document.getElementById('v194-profile-foundation')){
    var box=document.createElement('div');
    box.id='v194-profile-foundation';
    box.className='card stack';
    box.innerHTML='<strong>🧠 Club profile engine — new phase started</strong>'+
      '<span class="about">Player research is complete for the Premier League and Championship. The next evidence layer now translates real-world <b>manager, formation, home kit and away kit</b> data into fields SWOS can actually store.</span>'+
      '<span class="about">Native limits are enforced: manager names fit the 24-character coach field, formations map to one of 18 SWOS tactics, and kits map to 4 shirt styles / 10 game colours.</span>'+
      '<span class="about"><b>'+META.eligible+' clubs eligible · '+META.pending+' pending · '+META.sections+' evidence sections</b>. First target: <b>'+META.next+'</b>.</span>'+
      '<span class="about">This is evidence/translation only. No TEAM.* installation or career overwrite is enabled.</span>'+
      '<span class="feature-status beta">PROFILE ENGINE · UNDER CONSTRUCTION</span>';
    anchor.insertAdjacentElement('afterend',box);
  }
  if(!document.getElementById('v194-release-card')){
    var a=document.getElementById('v193-release-card')||document.getElementById('v192-release-card');
    if(a){
      var c=document.createElement('div');
      c.id='v194-release-card';
      c.className='card stack v133-release-card';
      c.innerHTML='<strong>New in v1.94.0 — native SWOS club-profile pipeline</strong>'+
        '<span class="about">• New evidence schema for manager, preferred formation, home kit and away kit.</span>'+
        '<span class="about">• New 44-club queue covering all research-complete Premier League and Championship clubs.</span>'+
        '<span class="about">• Coverage can now report manager / formation / kits as ready rather than permanently pending.</span>'+
        '<span class="about">• Evidence validation rejects formations and kit settings that SWOS cannot represent natively.</span>'+
        '<span class="about">• Arsenal is the first profile evidence target.</span>'+
        '<span class="about">• TEAM.* and established .CAR binary writes remain locked behind the separate installer-safety gate.</span>';
      a.insertAdjacentElement('beforebegin',c);
    }
  }
  document.title='SWOS Studio '+BUILD;
  var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');
  if(b)b.textContent=BUILD;
  return true;
}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;

html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v194-profile-foundation-layer')||!html.includes('<title>SWOS Studio v1.94.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: profile foundation UI layer missing.`);

console.log('SWOS Studio v1.94.0 profile foundation complete · 44 eligible clubs · Arsenal next · binary writes locked.');
