import fs from 'node:fs';

const FILE='dist/index.html';
const PUB='dist/football-db/publication.json';
const COVERAGE='dist/football-db/coverage.json';
const PACKS='dist/football-db/research-packs.json';
const VALIDATION='dist/football-db/validation.json';
const BUILD='v1.58.1';
for(const file of [FILE,PUB,COVERAGE,PACKS,VALIDATION])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.58.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.58.0 output was not found.`);
const pub=JSON.parse(fs.readFileSync(PUB,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
if(pub.databaseVersion!=='2026.27-foundation.20'||coverage.summary?.researchReady!==20||packs.packCount!==20||packs.playerCount!==320||validation.status!=='pass')throw new Error(`SWOS Studio ${BUILD} build failed: static database publication is not final.`);
html=html.replace('<title>SWOS Studio v1.58.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const js=String.raw`
<script id="swos-v1581-static-db-consistency-layer">
(function(){
'use strict';var BUILD='v1.58.1';
function render(){
  var anchor=document.getElementById('v146-data-expansion')||document.getElementById('v145-workbench');if(!anchor)return false;
  var note=document.getElementById('v1581-static-db-note');
  if(!note){note=document.createElement('div');note.id='v1581-static-db-note';note.className='card stack';note.innerHTML='<strong>Static database publication verified</strong><span class="about">The downloadable/browser football database now goes through a final source→dist SHA-256 consistency gate. Coverage, manifest, identities, research packs, queue, intake and validation report are published from the same final database state.</span><span class="feature-status available">STATIC DATA 20 / 20 ✓</span>';anchor.insertAdjacentElement('afterend',note);}
  if(!document.getElementById('v1581-release-card')){var a=document.getElementById('v158-release-card')||document.getElementById('v157-release-card');if(a){var c=document.createElement('div');c.id='v1581-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.58.1 — static database consistency gate</strong><span class="about">• Fixes the stale static coverage snapshot that could show an earlier research total after a successful multi-stage build.</span><span class="about">• A final publisher now copies every authoritative football-data resource only after all promotion stages have finished.</span><span class="about">• A SHA-256 gate compares source and deployed static resources before the build can pass.</span><span class="about">• Premier League completion remains 20 research packs / 320 researched players.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}
  document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;
}
var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v1581-static-db-consistency-layer')||!html.includes('<title>SWOS Studio v1.58.1</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: release layer missing.`);
console.log(`SWOS Studio ${BUILD} static database consistency release complete · ${packs.packCount} packs / ${packs.playerCount} players.`);
