import fs from 'node:fs';

const FILE='dist/index.html';
const INTAKE='football-db/research-intake.json';
const QUEUE='football-db/research-queue.json';
const BUILD='v1.53.0';
for(const file of [FILE,INTAKE,QUEUE])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
if(!html.includes('<title>SWOS Studio v1.52.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.52.0 output was not found.`);
if(intake.totals?.clubs!==10||intake.totals?.players!==160)throw new Error(`SWOS Studio ${BUILD} build failed: research intake must cover 10 clubs / 160 players.`);
if(intake.totals?.requiredEvidenceCells!==480)throw new Error(`SWOS Studio ${BUILD} build failed: expected 480 required evidence cells; found ${intake.totals?.requiredEvidenceCells}.`);
if(intake.policy?.autoPromote!==false||intake.policy?.noFabricatedValues!==true)throw new Error(`SWOS Studio ${BUILD} build failed: evidence safety policy is not intact.`);
if(intake.next?.clubId!==queue.next?.clubId)throw new Error(`SWOS Studio ${BUILD} build failed: queue and intake next-club pointers disagree.`);
for(const club of intake.clubs||[]){
  if(club.totalPlayers!==16||club.players?.length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${club.clubName} intake is not exactly 16 players.`);
  if(club.promotionReady&&club.readyPlayers!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${club.clubName} promotion guard is inconsistent.`);
}

html=html.replace('<title>SWOS Studio v1.52.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={
  build:BUILD,
  clubs:intake.totals.clubs,
  players:intake.totals.players,
  cells:intake.totals.requiredEvidenceCells,
  cellsComplete:intake.totals.requiredEvidenceCellsComplete,
  playersComplete:intake.totals.playersResearchComplete,
  promotionReady:intake.totals.promotionReadyClubs,
  next:intake.next?.clubName||'Complete'
};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v153-research-intake-layer">
(function(){
  'use strict';
  var BUILD='v1.53.0';
  var META=${embedded};
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function render(){
    var anchor=document.getElementById('v145-workbench')||document.getElementById('v144-coverage-centre');if(!anchor)return false;
    var box=document.getElementById('v146-data-expansion');if(!box){box=document.createElement('section');box.id='v146-data-expansion';box.className='v146-data-expansion';anchor.insertAdjacentElement('beforebegin',box);}
    var pct=META.cells?Math.round(META.cellsComplete*100/META.cells):0;
    box.innerHTML='<div class="v146-data-head"><div><strong>🔬 Research Evidence Intake</strong><p>The second-half Premier League queue now has a strict evidence gate. A player needs age, market value and exact SWOS position evidence before becoming complete; a club needs all 16 players complete before it can be promoted.</p></div><span class="feature-status beta">Promotion guard active</span></div>'+
      '<div class="v146-data-grid"><div class="v146-data-stat"><small>Required evidence</small><b>'+META.cellsComplete+' / '+META.cells+'</b></div><div class="v146-data-stat"><small>Players complete</small><b>'+META.playersComplete+' / '+META.players+'</b></div><div class="v146-data-stat good"><small>Promotion-ready clubs</small><b>'+META.promotionReady+' / '+META.clubs+'</b></div><div class="v146-data-stat next"><small>Current evidence task</small><b>'+esc(META.next)+'</b></div></div>'+
      '<div class="v146-data-foot"><b>Evidence completeness: '+pct+'%.</b> No club is auto-promoted. Source references are mandatory for submitted evidence, optional performance fields stay optional, and missing required values remain pending rather than inferred. TEAM.* and .CAR writes remain locked.</div>';
    if(!document.getElementById('v153-release-card')){
      var relAnchor=document.getElementById('v152-release-card')||document.getElementById('v151-release-card');if(relAnchor){
        var c=document.createElement('div');c.id='v153-release-card';c.className='card stack v133-release-card';
        c.innerHTML='<strong>New in v1.53.0 — Research Evidence Intake + promotion guard</strong><span class="about">• A published evidence schema now defines the fields allowed into second-half research packs.</span><span class="about">• The pipeline tracks 480 required evidence cells across 160 staged players: age, market value and exact SWOS position.</span><span class="about">• Each evidence row must carry at least one source reference.</span><span class="about">• Clubs cannot be promoted until all 16 staged players pass every required field.</span><span class="about">• Automatic promotion is deliberately disabled; the generated intake report makes readiness auditable before publication.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';
        relAnchor.insertAdjacentElement('beforebegin',c);
      }
    }
    document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;return true;
  }
  var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v153-research-intake-layer')||!html.includes('Promotion guard active'))throw new Error(`SWOS Studio ${BUILD} build failed: research intake UI was not installed.`);
if(!html.includes('<title>SWOS Studio v1.53.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title was not updated.`);
console.log(`SWOS Studio ${BUILD} research evidence intake complete · ${meta.cellsComplete}/${meta.cells} evidence cells · ${meta.promotionReady} promotion-ready clubs · next ${meta.next}.`);
