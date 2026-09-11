import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/research-queue.json';
const INTAKE='football-db/research-intake.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.56.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
if(!html.includes('<title>SWOS Studio v1.55.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.55.0 output was not found.`);
if(packs.packCount!==12||packs.playerCount!==192)throw new Error(`SWOS Studio ${BUILD} build failed: expected 12 packs / 192 players after Brentford promotion; found ${packs.packCount} / ${packs.playerCount}.`);
const brentford=packs.clubs?.brentford;
if(!brentford||Object.keys(brentford.players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Brentford promoted pack is missing or incomplete.`);
const bc=(coverage.clubs||[]).find(c=>c.id==='brentford');
if(bc?.stages?.researchPack?.status!=='ready'||bc?.stages?.swos16?.status!=='builder-ready')throw new Error(`SWOS Studio ${BUILD} build failed: Brentford did not become Research Ready / SWOS16 Builder Ready.`);
if(coverage?.summary?.identityReady!==20||coverage?.summary?.researchReady!==12)throw new Error(`SWOS Studio ${BUILD} build failed: expected 20 identity-ready / 12 research-ready clubs.`);
if(queue.totals?.clubs!==8||queue.totals?.stagedPlayers!==128)throw new Error(`SWOS Studio ${BUILD} build failed: expected remaining queue 8 clubs / 128 players; found ${queue.totals?.clubs} / ${queue.totals?.stagedPlayers}.`);
if(queue.next?.clubId!=='brighton'||intake.next?.clubId!=='brighton')throw new Error(`SWOS Studio ${BUILD} build failed: Brighton should be the next evidence task.`);
if(manifest.version!=='2026.27-foundation.12')throw new Error(`SWOS Studio ${BUILD} build failed: expected database foundation.12; found ${manifest.version}.`);

html=html.replace('<title>SWOS Studio v1.55.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={packs:packs.packCount,players:packs.playerCount,identityReady:coverage.summary.identityReady,researchReady:coverage.summary.researchReady,remaining:queue.totals.clubs,staged:queue.totals.stagedPlayers,next:queue.next.clubName,databaseVersion:manifest.version};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v156-brentford-promotion-layer">
(function(){'use strict';var BUILD='v1.56.0',META=${embedded};function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
function render(){var anchor=document.getElementById('v145-workbench')||document.getElementById('v144-coverage-centre');if(!anchor)return false;var box=document.getElementById('v146-data-expansion');if(!box){box=document.createElement('section');box.id='v146-data-expansion';box.className='v146-data-expansion';anchor.insertAdjacentElement('beforebegin',box);}box.innerHTML='<div class="v146-data-head"><div><strong>✅ Brentford Evidence Promoted</strong><p>The guarded promotion pipeline has now advanced a second club end-to-end from identity staging through sourced evidence, authoritative publication and validation.</p></div><span class="feature-status available">12 / 20 research-ready</span></div><div class="v146-data-grid"><div class="v146-data-stat good"><small>Identity-ready</small><b>'+META.identityReady+' / 20</b></div><div class="v146-data-stat good"><small>Research packs</small><b>'+META.packs+' / 20</b></div><div class="v146-data-stat"><small>Researched players</small><b>'+META.players+'</b></div><div class="v146-data-stat next"><small>Next evidence task</small><b>'+esc(META.next)+'</b></div></div><div class="v146-data-foot"><b>Database '+esc(META.databaseVersion)+':</b> Brentford is now Research Ready and SWOS 16 Builder Ready. '+META.remaining+' clubs / '+META.staged+' staged players remain in the evidence queue. No incomplete club is promoted. TEAM.* and .CAR writes remain locked.</div>';if(!document.getElementById('v156-release-card')){var a=document.getElementById('v155-release-card')||document.getElementById('v154-release-card');if(a){var c=document.createElement('div');c.id='v156-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.56.0 — Brentford guarded research promotion</strong><span class="about">• Brentford becomes research pack 12, taking the database to 192 researched players.</span><span class="about">• All 16 Brentford players passed sourced age, market-value and exact-position requirements.</span><span class="about">• The promotion engine advances one complete club at a time so every database milestone remains independently validated.</span><span class="about">• Coverage and the active research queue are rebuilt after each promotion.</span><span class="about">• '+esc(META.next)+' is now the next evidence task.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v156-brentford-promotion-layer')||!html.includes('Brentford Evidence Promoted'))throw new Error(`SWOS Studio ${BUILD} build failed: Brentford promotion UI missing.`);
if(!html.includes('<title>SWOS Studio v1.56.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title not updated.`);
console.log(`SWOS Studio ${BUILD} Brentford evidence promotion complete · ${packs.packCount} packs / ${packs.playerCount} players · next ${queue.next.clubName}.`);
