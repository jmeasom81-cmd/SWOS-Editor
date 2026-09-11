import fs from 'node:fs';

const FILE='dist/index.html';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const IDENTITIES='football-db/identities.json';
const COVERAGE='football-db/coverage.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.68.0';
for(const file of [FILE,QUEUE,INTAKE,IDENTITIES,COVERAGE,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.67.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.67.0 output was not found.`);
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
if(manifest.version!=='2026.27-england-identity.44')throw new Error(`SWOS Studio ${BUILD} build failed: expected completed Championship identity DB .44; found ${manifest.version}.`);
if(identities.clubCount!==44||identities.playerCount!==759)throw new Error(`SWOS Studio ${BUILD} build failed: expected 44 England identity clubs / 759 selected identities.`);
if(champ?.identityReady!==24||champ?.researchReady!==0||pl?.researchReady!==20)throw new Error(`SWOS Studio ${BUILD} build failed: expected Championship 24/24 identity-ready, 0/24 research-ready and PL research 20/20.`);
if(queue.status!=='active'||queue.totals?.clubs!==24||queue.totals?.stagedPlayers!==384||queue.totals?.requiredEvidenceCells!==1152||queue.next?.clubId!=='birmingham-city')throw new Error(`SWOS Studio ${BUILD} build failed: Championship research queue is not the expected 24 clubs / 384 players / 1152 cells starting at Birmingham City.`);
const complete=Number(intake.totals?.requiredEvidenceCellsComplete||0),ready=Number(intake.totals?.promotionReadyClubs||0);
if(intake.totals?.clubs!==24||intake.totals?.players!==384||intake.totals?.requiredEvidenceCells!==1152||complete<0||complete>1152||ready<0||ready>24)throw new Error(`SWOS Studio ${BUILD} build failed: Championship research intake counters are invalid.`);
if(complete!==ready*48)throw new Error(`SWOS Studio ${BUILD} build failed: evidence files must arrive as complete 16-player club packs (expected ${ready*48} complete cells, found ${complete}).`);
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${BUILD} build failed: binary write locks changed unexpectedly.`);

html=html.replace('<title>SWOS Studio v1.67.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const next=intake.nextPromotionReady?.clubName||intake.nextEvidenceRequired?.clubName||queue.next?.clubName||'Complete';
const meta={identityClubs:44,identityPlayers:759,champClubs:24,stagedPlayers:384,requiredCells:1152,completeCells:complete,promotionReady:ready,next,plResearch:20};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<style id="swos-v168-research-pipeline-style">
.v168-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.v168-stat{border:1px solid var(--line);background:#091421;border-radius:9px;padding:8px;text-align:center}.v168-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase}.v168-stat strong{display:block;font-size:14px;margin-top:3px}.v168-progress{height:8px;border-radius:999px;background:#07111f;border:1px solid var(--line);overflow:hidden}.v168-progress span{display:block;height:100%;background:var(--green)}@media(max-width:520px){.v168-grid{grid-template-columns:1fr 1fr}}
</style>
<script id="swos-v168-championship-research-layer">
(function(){
'use strict';var BUILD='v1.68.0',META=${embedded};
function render(){
 var anchor=document.getElementById('v167-championship-complete-summary')||document.getElementById('v166-southampton-summary');if(!anchor)return false;
 if(!document.getElementById('v168-championship-research')){var box=document.createElement('div');box.id='v168-championship-research';box.className='card stack';var pct=Math.round((META.completeCells/META.requiredCells)*100);box.innerHTML='<strong>🔬 Championship Research Pipeline — staged</strong><span class="about">Identity work is complete, so the next layer is separated properly: age, market value and exact SWOS position must be evidenced for every selected player before a club can become research-ready.</span><div class="v168-grid"><div class="v168-stat"><small>Clubs staged</small><strong>'+META.champClubs+' / 24</strong></div><div class="v168-stat"><small>Players</small><strong>'+META.stagedPlayers+'</strong></div><div class="v168-stat"><small>Required cells</small><strong>'+META.requiredCells+'</strong></div><div class="v168-stat"><small>Evidence staged</small><strong>'+META.completeCells+'</strong></div></div><div class="v168-progress"><span style="width:'+pct+'%"></span></div><span class="about">Next pipeline target: <b>'+META.next+'</b>. '+META.promotionReady+' complete club evidence pack(s) currently pass the staging guard. A club only promotes when all 16 identity-matched players have sourced age, market value and position evidence.</span><span class="about">Research-ready coverage is still 0 / 24 at this foundation checkpoint. Staging future evidence does not silently promote it, and no TEAM.* or .CAR bytes are touched.</span><span class="feature-status beta">RESEARCH PIPELINE READY · EVIDENCE GATED</span>';anchor.insertAdjacentElement('afterend',box);}
 if(!document.getElementById('v168-release-card')){var a=document.getElementById('v167-release-card')||document.getElementById('v166-release-card');if(a){var c=document.createElement('div');c.id='v168-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.68.0 — Championship research foundation</strong><span class="about">• All 24 identity-ready Championship clubs are staged into a separate research queue.</span><span class="about">• 384 selected players create exactly 1,152 mandatory evidence cells: age, market value and SWOS position.</span><span class="about">• Research evidence schema and preflight validation reject partial clubs, unknown player names, missing sources and invalid values.</span><span class="about">• Future evidence files can be present without breaking this milestone; promotion remains a separate guarded action.</span><span class="about">• Championship research is isolated from the already-complete Premier League research pipeline.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
 document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;
}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v168-championship-research-layer')||!html.includes('<title>SWOS Studio v1.68.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: Championship research pipeline layer missing.`);
console.log(`SWOS Studio v1.68.0 Championship research foundation staged · 24 clubs · 384 players · ${complete}/1152 evidence cells staged · ${ready} promotion-ready · binary writes locked.`);
