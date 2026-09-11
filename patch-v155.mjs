import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/research-queue.json';
const INTAKE='football-db/research-intake.json';
const MANIFEST='football-db/manifest.json';
const BUILD='v1.55.0';
for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
if(!html.includes('<title>SWOS Studio v1.54.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.54.0 output was not found.`);
if(packs.packCount!==11||packs.playerCount!==176)throw new Error(`SWOS Studio ${BUILD} build failed: expected 11 packs / 176 players after Bournemouth promotion; found ${packs.packCount} / ${packs.playerCount}.`);
const bournemouth=packs.clubs?.bournemouth;
if(!bournemouth||Object.keys(bournemouth.players||{}).length!==16)throw new Error(`SWOS Studio ${BUILD} build failed: Bournemouth promoted pack is missing or incomplete.`);
const bc=(coverage.clubs||[]).find(c=>c.id==='bournemouth');
if(bc?.stages?.researchPack?.status!=='ready'||bc?.stages?.swos16?.status!=='builder-ready')throw new Error(`SWOS Studio ${BUILD} build failed: Bournemouth did not become Research Ready / SWOS16 Builder Ready.`);
if(coverage?.summary?.identityReady!==20||coverage?.summary?.researchReady!==11)throw new Error(`SWOS Studio ${BUILD} build failed: expected 20 identity-ready / 11 research-ready clubs.`);
if(queue.totals?.clubs!==9||queue.totals?.stagedPlayers!==144)throw new Error(`SWOS Studio ${BUILD} build failed: expected remaining queue 9 clubs / 144 players.`);
if(queue.next?.clubId!=='brentford'||intake.next?.clubId!=='brentford')throw new Error(`SWOS Studio ${BUILD} build failed: Brentford should be the next evidence task.`);
if(manifest.version!=='2026.27-foundation.11')throw new Error(`SWOS Studio ${BUILD} build failed: expected database foundation.11; found ${manifest.version}.`);

html=html.replace('<title>SWOS Studio v1.54.0</title>',`<title>SWOS Studio ${BUILD}</title>`);
const meta={packs:packs.packCount,players:packs.playerCount,identityReady:coverage.summary.identityReady,researchReady:coverage.summary.researchReady,remaining:queue.totals.clubs,staged:queue.totals.stagedPlayers,next:queue.next.clubName,databaseVersion:manifest.version};
const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v155-bournemouth-promotion-layer">
(function(){'use strict';var BUILD='v1.55.0',META=${embedded};function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
function render(){var anchor=document.getElementById('v145-workbench')||document.getElementById('v144-coverage-centre');if(!anchor)return false;var box=document.getElementById('v146-data-expansion');if(!box){box=document.createElement('section');box.id='v146-data-expansion';box.className='v146-data-expansion';anchor.insertAdjacentElement('beforebegin',box);}box.innerHTML='<div class="v146-data-head"><div><strong>✅ Bournemouth Evidence Promoted</strong><p>The first club has passed the new evidence guard end-to-end: identity staging → sourced evidence → 16-player promotion → database validation → refreshed coverage.</p></div><span class="feature-status available">11 / 20 research-ready</span></div><div class="v146-data-grid"><div class="v146-data-stat good"><small>Identity-ready</small><b>'+META.identityReady+' / 20</b></div><div class="v146-data-stat good"><small>Research packs</small><b>'+META.packs+' / 20</b></div><div class="v146-data-stat"><small>Researched players</small><b>'+META.players+'</b></div><div class="v146-data-stat next"><small>Next evidence task</small><b>'+esc(META.next)+'</b></div></div><div class="v146-data-foot"><b>Database '+esc(META.databaseVersion)+':</b> Bournemouth is now Research Ready and SWOS 16 Builder Ready. '+META.remaining+' clubs / '+META.staged+' staged players remain in the evidence queue. The authoritative promotion was generated from complete sourced evidence; no missing values were guessed. TEAM.* and .CAR writes remain locked.</div>';if(!document.getElementById('v155-release-card')){var a=document.getElementById('v154-release-card')||document.getElementById('v153-release-card');if(a){var c=document.createElement('div');c.id='v155-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.55.0 — first guarded research promotion</strong><span class="about">• AFC Bournemouth becomes research pack 11, taking the database to 176 researched players.</span><span class="about">• All 16 Bournemouth players passed sourced age, market-value and exact-position requirements before promotion.</span><span class="about">• The promotion engine converts only fully complete evidence into authoritative research data; incomplete clubs remain untouched.</span><span class="about">• Coverage and the research queue are rebuilt after promotion, moving the next task automatically to '+esc(META.next)+'.</span><span class="about">• The Research Evidence Editor now loads only the remaining active queue.</span><span class="about">• TEAM.* and established .CAR writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}var tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();})();
</script>`;
html=html.replace('</body>',js+'\n</body>');fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v155-bournemouth-promotion-layer')||!html.includes('Bournemouth Evidence Promoted'))throw new Error(`SWOS Studio ${BUILD} build failed: Bournemouth promotion UI missing.`);
if(!html.includes('<title>SWOS Studio v1.55.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title not updated.`);
console.log(`SWOS Studio ${BUILD} Bournemouth evidence promotion complete · ${packs.packCount} packs / ${packs.playerCount} players · next ${queue.next.clubName}.`);
