import fs from 'node:fs';

const FILE='dist/index.html';
const INTAKE='football-db/research-intake.json';
const BUILD='v1.54.0';
for(const file of [FILE,INTAKE])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${BUILD} build failed: missing ${file}.`);
let html=fs.readFileSync(FILE,'utf8');
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
if(!html.includes('<title>SWOS Studio v1.53.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: expected v1.53.0 output was not found.`);
if(intake.totals?.clubs!==10||intake.totals?.players!==160)throw new Error(`SWOS Studio ${BUILD} build failed: evidence editor requires the 10-club / 160-player intake.`);
html=html.replace('<title>SWOS Studio v1.53.0</title>',`<title>SWOS Studio ${BUILD}</title>`);

const css=String.raw`
<style id="swos-v154-evidence-editor-styles">
  .v154-editor{border:1px solid rgba(202,167,255,.45);background:linear-gradient(180deg,rgba(133,84,194,.08),rgba(7,17,31,.98));border-radius:14px;padding:13px;margin:10px 0;box-shadow:var(--shadow)}
  .v154-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.v154-head strong{font-size:14px}.v154-head p{font-size:9px;color:var(--muted);margin:4px 0 0;line-height:1.45}
  .v154-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.v154-grid .full{grid-column:1/-1}.v154-grid label{display:block;font-size:7px;text-transform:uppercase;color:var(--muted);margin-bottom:4px;font-weight:900}
  .v154-grid input,.v154-grid select{width:100%;height:40px;border-radius:9px;border:1px solid var(--line);background:#07111f;color:var(--text);padding:0 9px}
  .v154-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.v154-actions .btn{min-height:40px;font-size:10px;flex:1}.v154-status{margin-top:9px;font-size:8px;color:var(--muted);line-height:1.45}.v154-status b{color:var(--text)}
  @media(max-width:620px){.v154-grid{grid-template-columns:1fr}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v154-evidence-editor-layer">
(function(){
'use strict';
var BUILD='v1.54.0',INTAKE_URL='football-db/research-intake.json',STORE='swos-research-evidence:v1:';
var intake=null,club=null,player=null;
function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
function num(v){if(v===''||v==null)return undefined;var n=Number(v);return Number.isFinite(n)?n:undefined;}
function loadClub(id){try{return JSON.parse(localStorage.getItem(STORE+id)||'{"players":{}}')}catch(e){return {players:{}}}}
function saveClub(id,data){localStorage.setItem(STORE+id,JSON.stringify(data));}
function completeRow(r){return !!r&&Number(r.age)>=15&&Number(r.age)<=50&&Number(r.marketValueM)>=0&&Number.isInteger(Number(r.position))&&Number(r.position)>=0&&Number(r.position)<=7&&Array.isArray(r.sources)&&r.sources.length>0;}
function formValues(){
 var src=(document.getElementById('v154Source')?.value||'').trim(),r={};
 var age=num(document.getElementById('v154Age')?.value),mv=num(document.getElementById('v154Value')?.value),pos=num(document.getElementById('v154Position')?.value),min=num(document.getElementById('v154Minutes')?.value),g=num(document.getElementById('v154Goals')?.value),a=num(document.getElementById('v154Assists')?.value);
 if(age!==undefined)r.age=age;if(mv!==undefined)r.marketValueM=mv;if(pos!==undefined)r.position=pos;if(min!==undefined)r.minutes=min;if(g!==undefined)r.goals=g;if(a!==undefined)r.assists=a;if(src)r.sources=[src];return r;
}
function populate(){
 if(!club||!player)return;var d=loadClub(club.clubId),r=d.players?.[player.footballName]||{};
 [['v154Age','age'],['v154Value','marketValueM'],['v154Position','position'],['v154Minutes','minutes'],['v154Goals','goals'],['v154Assists','assists']].forEach(function(x){var el=document.getElementById(x[0]);if(el)el.value=r[x[1]]??'';});
 var s=document.getElementById('v154Source');if(s)s.value=(r.sources||[])[0]||'';status();
}
function status(msg){
 var box=document.getElementById('v154Status');if(!box||!club)return;var d=loadClub(club.clubId),rows=d.players||{},ready=(club.players||[]).filter(function(p){return completeRow(rows[p.footballName]);}).length;
 box.innerHTML=(msg?'<b>'+esc(msg)+'</b><br>':'')+'Local evidence: <b>'+ready+' / 16 players complete</b>. Export becomes promotion-eligible only when all 16 have age, market value, exact position and a source.';
}
function renderPlayerOptions(){var psel=document.getElementById('v154Player');if(!psel||!club)return;psel.innerHTML=(club.players||[]).map(function(p){return '<option value="'+esc(p.footballName)+'">'+esc(p.footballName)+' · '+esc(p.identity?.group||'')+'</option>';}).join('');player=club.players[0]||null;populate();}
function render(){
 var anchor=document.getElementById('v146-data-expansion')||document.getElementById('v145-workbench');if(!anchor||document.getElementById('v154-evidence-editor'))return false;
 var box=document.createElement('section');box.id='v154-evidence-editor';box.className='v154-editor';
 box.innerHTML='<div class="v154-head"><div><strong>📝 Research Evidence Editor</strong><p>Enter sourced research without touching the authoritative database. Work is stored locally on this device until you export a schema-compatible evidence file.</p></div><span class="feature-status beta">LOCAL DRAFT</span></div>'+
 '<div class="v154-grid"><div><label>Club</label><select id="v154Club"></select></div><div><label>Player</label><select id="v154Player"></select></div><div><label>Age *</label><input id="v154Age" inputmode="numeric" placeholder="e.g. 24"></div><div><label>Market value €m *</label><input id="v154Value" inputmode="decimal" placeholder="e.g. 25"></div><div><label>SWOS position 0–7 *</label><select id="v154Position"><option value="">Pending</option>'+[0,1,2,3,4,5,6,7].map(function(n){return '<option value="'+n+'">'+n+'</option>';}).join('')+'</select></div><div><label>Minutes (optional)</label><input id="v154Minutes" inputmode="numeric"></div><div><label>Goals (optional)</label><input id="v154Goals" inputmode="numeric"></div><div><label>Assists (optional)</label><input id="v154Assists" inputmode="numeric"></div><div class="full"><label>Evidence source *</label><input id="v154Source" placeholder="Source name / reference"></div></div>'+
 '<div class="v154-actions"><button class="btn btn-green" id="v154Save">Save player evidence</button><button class="btn btn-blue" id="v154Export">Export club JSON</button><button class="btn" id="v154Import">Import evidence JSON</button><input type="file" accept="application/json,.json" id="v154File" class="hidden"></div><div class="v154-status" id="v154Status"></div>';
 anchor.insertAdjacentElement('afterend',box);
 var csel=document.getElementById('v154Club');csel.innerHTML=(intake.clubs||[]).map(function(c){return '<option value="'+esc(c.clubId)+'">'+esc(c.clubName)+'</option>';}).join('');club=intake.clubs[0]||null;renderPlayerOptions();
 csel.onchange=function(){club=(intake.clubs||[]).find(function(c){return c.clubId===csel.value;})||intake.clubs[0];renderPlayerOptions();};
 document.getElementById('v154Player').onchange=function(e){player=(club.players||[]).find(function(p){return p.footballName===e.target.value;})||club.players[0];populate();};
 document.getElementById('v154Save').onclick=function(){if(!club||!player)return;var d=loadClub(club.clubId);d.schemaVersion=1;d.season='2026/27';d.clubId=club.clubId;d.snapshot=new Date().toISOString().slice(0,10);d.sourceSummary='SWOS Studio local research evidence draft';d.players=d.players||{};var r=formValues();if(!r.sources){status('A source is required before this row can be saved.');return;}d.players[player.footballName]=r;saveClub(club.clubId,d);status('Saved '+player.footballName+'.');};
 document.getElementById('v154Export').onclick=function(){if(!club)return;var d=loadClub(club.clubId);d.schemaVersion=1;d.season='2026/27';d.clubId=club.clubId;d.snapshot=d.snapshot||new Date().toISOString().slice(0,10);d.sourceSummary=d.sourceSummary||'SWOS Studio local research evidence draft';d.players=d.players||{};var blob=new Blob([JSON.stringify(d,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=club.clubId+'-research-evidence.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},500);status('Exported '+club.clubName+' evidence JSON.');};
 document.getElementById('v154Import').onclick=function(){document.getElementById('v154File').click();};
 document.getElementById('v154File').onchange=async function(e){var f=e.target.files?.[0];if(!f)return;try{var d=JSON.parse(await f.text());if(d.schemaVersion!==1||d.season!=='2026/27'||!d.clubId||!d.players)throw new Error('Invalid evidence file');var target=(intake.clubs||[]).find(function(c){return c.clubId===d.clubId;});if(!target)throw new Error('Club is not in the active research intake');var allowed=new Set((target.players||[]).map(function(p){return p.footballName;}));Object.keys(d.players).forEach(function(n){if(!allowed.has(n))throw new Error('Unexpected player: '+n);});saveClub(d.clubId,d);club=target;csel.value=d.clubId;renderPlayerOptions();status('Imported '+target.clubName+' evidence.');}catch(err){status('Import rejected: '+(err?.message||err));}finally{e.target.value='';}};
 return true;
}
async function apply(){try{var r=await fetch(INTAKE_URL,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);intake=await r.json();render();}catch(e){}document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v154-evidence-editor-layer')||!html.includes('Research Evidence Editor'))throw new Error(`SWOS Studio ${BUILD} build failed: evidence editor was not installed.`);
if(!html.includes('<title>SWOS Studio v1.54.0</title>'))throw new Error(`SWOS Studio ${BUILD} build failed: title was not updated.`);
console.log(`SWOS Studio ${BUILD} interactive research evidence editor installed · local save/import/export enabled for ${intake.totals.players} staged players.`);
