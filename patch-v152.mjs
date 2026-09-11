import fs from 'node:fs';

const FILE='dist/index.html';
const QUEUE='football-db/research-queue.json';
const IDENTITIES='football-db/identities.json';
const PACKS='football-db/research-packs.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.52.0';
for(const file of [FILE,QUEUE,IDENTITIES,PACKS,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));

if(!html.includes('<title>SWOS Studio v1.51.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.51.0 output was not found.`);
if(identities.clubCount!==20||identities.playerCount!==375)throw new Error(`SWOS Studio ${BUILD} build failed: full Premier League identity coverage is not intact.`);
if(packs.packCount!==10||packs.playerCount!==160)throw new Error(`SWOS Studio ${BUILD} build failed: research baseline should remain 10 packs / 160 players.`);
if(queue.totals?.clubs!==10||queue.totals?.stagedPlayers!==160)throw new Error(`SWOS Studio ${BUILD} build failed: expected 10 clubs / 160 staged research slots; found ${queue.totals?.clubs} / ${queue.totals?.stagedPlayers}.`);
if(queue.next?.clubId!=='bournemouth')throw new Error(`SWOS Studio ${BUILD} build failed: expected Bournemouth at head of evidence queue.`);
for(const club of queue.queue||[]){
  if(club.stagedPlayers!==16||club.players?.length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: ${club.clubName} does not have exactly 16 staged players.`);
  if(club.status!=='evidence-required')throw new Error(`SWOS Studio ${BUILD} build failed: ${club.clubName} research status must remain evidence-required.`);
}

html=html.replace('<title>SWOS Studio v1.51.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={
  build:BUILD,
  databaseVersion:manifest.version,
  clubs:queue.totals.clubs,
  stagedPlayers:queue.totals.stagedPlayers,
  next:queue.next.clubName,
  names:(queue.queue||[]).map(c=>c.clubName),
  researchPacks:packs.packCount,
  identityClubs:identities.clubCount
};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v152-research-queue-layer">
(function(){
  'use strict';
  var BUILD='v1.52.0';
  var META=${embedded};
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function render(){
    var anchor=document.getElementById('v145-workbench')||document.getElementById('v144-coverage-centre');
    if(!anchor)return false;
    var box=document.getElementById('v146-data-expansion');
    if(!box){box=document.createElement('section');box.id='v146-data-expansion';box.className='v146-data-expansion';anchor.insertAdjacentElement('beforebegin',box);}
    var queueText=META.names.map(function(n,i){return (i+1)+'. '+esc(n);}).join(' · ');
    box.innerHTML='<div class="v146-data-head"><div><strong>🧪 Evidence Research Queue</strong><p>All remaining Premier League clubs now have a deterministic 16-player research intake. Identity is locked first; age, value, SWOS position and performance evidence must be completed before a club can become Research Ready.</p></div><span class="feature-status beta">Evidence required</span></div>'+
      '<div class="v146-data-grid"><div class="v146-data-stat good"><small>Identity coverage</small><b>'+META.identityClubs+' / 20</b></div><div class="v146-data-stat"><small>Research ready</small><b>'+META.researchPacks+' / 20</b></div><div class="v146-data-stat"><small>Staged player slots</small><b>'+META.stagedPlayers+'</b></div><div class="v146-data-stat next"><small>Next club</small><b>'+esc(META.next)+'</b></div></div>'+
      '<div class="v146-data-foot"><b>Queue:</b> '+queueText+'<br><b>Publication rule:</b> identity alone never creates ratings. Required evidence must be complete; missing evidence remains pending rather than guessed. TEAM.* and .CAR writes remain locked.</div>';
    if(!document.getElementById('v152-release-card')){
      var relAnchor=document.getElementById('v151-release-card')||document.getElementById('v150-release-card')||document.getElementById('v149-release-card');
      if(relAnchor){
        var c=document.createElement('div');c.id='v152-release-card';c.className='card stack v133-release-card';
        c.innerHTML='<strong>New in v1.52.0 — deterministic evidence research queue</strong><span class="about">• The ten identity-ready clubs without research packs are staged automatically from published data.</span><span class="about">• Every queued club has exactly 16 identity-verified player slots.</span><span class="about">• Required research fields are tracked explicitly: age, market value and SWOS position. Performance evidence remains optional where it genuinely does not apply.</span><span class="about">• Missing fields stay pending; the pipeline will not invent values simply to make a club pass.</span><span class="about">• Bournemouth is now the first evidence task, followed by the remaining clubs in deterministic order.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';
        relAnchor.insertAdjacentElement('beforebegin',c);
      }
    }
    document.title='SWOS Studio '+BUILD;
    var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;
    return true;
  }
  var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v152-research-queue-layer')||!html.includes('Evidence Research Queue'))throw new Error(`SWOS Studio ${BUILD} build failed: research queue UI was not installed.`);
if(!html.includes('<title>SWOS Studio v1.52.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title was not updated.`);
console.log(`SWOS Studio ${BUILD} evidence research queue complete · ${queue.totals.clubs} clubs / ${queue.totals.stagedPlayers} player slots · next ${queue.next.clubName}.`);
