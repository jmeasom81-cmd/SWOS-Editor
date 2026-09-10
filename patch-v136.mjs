import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.36.0';
if(!fs.existsSync(FILE)) throw new Error('SWOS Studio v1.36.0 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.35.0</title>')) throw new Error('SWOS Studio v1.36.0 build failed: expected v1.35.0 output was not found.');

html=html.replace('<title>SWOS Studio v1.35.0</title>','<title>SWOS Studio v1.36.0</title>');
html=html.replace("var BUILD='v1.35.0';","var BUILD='v1.36.0';");

const css=`
<style id="swos-v136-squad-styles">
  .squad-arch-card{border:1px solid rgba(163,113,247,.6);background:linear-gradient(180deg,rgba(163,113,247,.11),rgba(9,20,33,.97));border-radius:14px;padding:14px;margin:14px 0;box-shadow:var(--shadow)}
  .squad-arch-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.squad-arch-head strong{font-size:15px}.squad-arch-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}
  .squad-layer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.squad-layer{border:1px solid var(--line);background:#07111f;border-radius:11px;padding:10px;min-height:104px}.squad-layer small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase;letter-spacing:.07em}.squad-layer strong{display:block;font-size:14px;margin:5px 0}.squad-layer p{font-size:8px;color:var(--muted);line-height:1.42;margin:0}.squad-layer .feature-status{margin-top:8px}
  .squad-demo{border:1px solid rgba(88,166,255,.32);background:rgba(88,166,255,.05);border-radius:11px;padding:10px;margin-top:10px}.squad-demo-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.squad-demo-head strong{font-size:10px}.squad-demo-head label{font-size:8px;color:var(--muted);display:flex;align-items:center;gap:6px}.squad-demo input{width:58px;background:#07111f;color:var(--text);border:1px solid var(--line);border-radius:7px;padding:6px;font:inherit}
  .squad-demo-results{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.squad-demo-result{border-top:1px solid rgba(38,61,92,.7);padding-top:7px}.squad-demo-result small{display:block;color:var(--muted);font-size:7px}.squad-demo-result b{display:block;font-size:14px;margin-top:2px}
  .squad-rule-note{font-size:8px;color:var(--muted);line-height:1.45;margin-top:9px}.squad-rule-note b{color:var(--text)}
  .squad-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.squad-actions .btn{min-height:40px;font-size:9px;padding:8px 10px}.squad-contract{display:none;margin-top:10px;border-top:1px solid var(--line);padding-top:9px}.squad-contract.open{display:block}.squad-contract-row{display:flex;justify-content:space-between;gap:10px;padding:5px 0;font-size:8px}.squad-contract-row span{color:var(--muted)}.squad-contract-row b{text-align:right}
  @media(max-width:620px){.squad-layer-grid,.squad-demo-results,.squad-actions{grid-template-columns:1fr}.squad-layer{min-height:0}.squad-demo-head{align-items:flex-start;flex-direction:column}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v136-squad-layer">
(function(){
  'use strict';
  var BUILD='v1.36.0';
  var MODEL_URL='football-db/squad-model.json';
  var fallback={
    modelVersion:'1.0',
    layers:{
      fullModernSquad:{label:'Full Modern Squad',capacity:'uncapped-by-team-file'},
      installedSwos16:{label:'Installed SWOS 16',capacity:16,builderRules:{minimumGoalkeepers:2,minimumDefenders:4,minimumMidfielders:4,minimumForwards:2}},
      clubSquadPool:{label:'Club Squad Pool',capacity:'derived'}
    },
    careerRules:{existingCareerAutoUpdate:false,careerReserveImportStatus:'under-construction'},
    writeSafety:{teamWriteEnabled:false,careerWriteEnabled:false}
  };
  var modelPromise=null;
  function clean(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  async function model(){
    if(modelPromise)return modelPromise;
    modelPromise=fetch(MODEL_URL,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).catch(function(){return fallback;});
    return modelPromise;
  }
  function updateDemo(){
    var input=document.getElementById('v136SquadSize');if(!input)return;
    var full=Math.max(1,Math.min(60,parseInt(input.value||'29',10)||29));
    input.value=full;
    var installed=Math.min(16,full),pool=Math.max(0,full-installed);
    var a=document.getElementById('v136FullCount'),b=document.getElementById('v136InstalledCount'),c=document.getElementById('v136PoolCount'),line=document.getElementById('v136SquadExample');
    if(a)a.textContent=full;if(b)b.textContent=installed;if(c)c.textContent=pool;
    if(line)line.textContent=full<16?'This club does not yet have enough verified players for a complete SWOS 16.':('With '+full+' verified players, Studio keeps all '+full+', installs 16 into SWOS and retains '+pool+' in the club squad pool.');
  }
  function contractHtml(m){
    var l=m.layers||{},s=(l.installedSwos16||{}).builderRules||{},cr=m.careerRules||{},w=m.writeSafety||{};
    return '<div class="squad-contract-row"><span>Model version</span><b>'+clean(m.modelVersion||'1.0')+'</b></div>'+
      '<div class="squad-contract-row"><span>Physical TEAM capacity</span><b>'+clean((l.installedSwos16||{}).capacity||16)+' players</b></div>'+
      '<div class="squad-contract-row"><span>Builder minimums</span><b>'+clean(s.minimumGoalkeepers||2)+' GK · '+clean(s.minimumDefenders||4)+' DEF · '+clean(s.minimumMidfielders||4)+' MID · '+clean(s.minimumForwards||2)+' FWD</b></div>'+
      '<div class="squad-contract-row"><span>Existing career auto-update</span><b>'+(cr.existingCareerAutoUpdate?'Allowed':'Never')+'</b></div>'+
      '<div class="squad-contract-row"><span>TEAM.* writes</span><b>'+(w.teamWriteEnabled?'Enabled':'Locked')+'</b></div>'+
      '<div class="squad-contract-row"><span>Career reserve import</span><b>'+clean((cr.careerReserveImportStatus||'under-construction').replace(/-/g,' '))+'</b></div>';
  }
  async function build(){
    var dbCard=document.getElementById('v135-football-db-card');
    if(!dbCard){var old=document.getElementById('v136-squad-architecture');if(old)old.remove();return;}
    var m=await model(),l=m.layers||{},rules=(l.installedSwos16||{}).builderRules||{};
    var card=document.getElementById('v136-squad-architecture');
    if(!card){card=document.createElement('section');card.id='v136-squad-architecture';card.className='squad-arch-card';dbCard.insertAdjacentElement('afterend',card);}
    card.innerHTML='<div class="squad-arch-head"><div><strong>🧩 Squad Architecture</strong><p>A modern club is no longer treated as only 16 players. SWOS Studio now has a published three-layer roster model so the complete real-world squad can survive outside the fixed TEAM record.</p></div><span class="feature-status beta">Beta</span></div>'+
      '<div class="squad-layer-grid">'+
        '<div class="squad-layer"><small>Database layer</small><strong>'+clean((l.fullModernSquad||{}).label||'Full Modern Squad')+'</strong><p>Every verified first-team player is retained here. No player is discarded simply because TEAM.* has only 16 slots.</p><span class="feature-status beta">Database</span></div>'+
        '<div class="squad-layer"><small>Game layer</small><strong>'+clean((l.installedSwos16||{}).label||'Installed SWOS 16')+'</strong><p>Exactly 16 selected players form the physical SWOS team record. The existing balanced-selection rules still apply.</p><span class="feature-status available">16 slots</span></div>'+
        '<div class="squad-layer"><small>Companion layer</small><strong>'+clean((l.clubSquadPool||{}).label||'Club Squad Pool')+'</strong><p>Everyone outside the chosen 16 remains attached to the club for later selection, updates and future Career+ tools.</p><span class="feature-status beta">Retained</span></div>'+
      '</div>'+
      '<div class="squad-demo"><div class="squad-demo-head"><strong>See how the split works</strong><label>Verified modern squad <input id="v136SquadSize" type="number" min="1" max="60" value="29"></label></div>'+
        '<div class="squad-demo-results"><div class="squad-demo-result"><small>Full Modern Squad</small><b id="v136FullCount">29</b></div><div class="squad-demo-result"><small>Installed SWOS</small><b id="v136InstalledCount">16</b></div><div class="squad-demo-result"><small>Squad Pool</small><b id="v136PoolCount">13</b></div></div>'+
        '<div class="squad-rule-note" id="v136SquadExample">With 29 verified players, Studio keeps all 29, installs 16 into SWOS and retains 13 in the club squad pool.</div>'+
      '</div>'+
      '<div class="squad-rule-note"><b>Selection safety:</b> the SWOS 16 must contain exactly 16 unique players selected from the full squad. Current balance minimums are '+clean(rules.minimumGoalkeepers||2)+' GK, '+clean(rules.minimumDefenders||4)+' DEF, '+clean(rules.minimumMidfielders||4)+' MID and '+clean(rules.minimumForwards||2)+' FWD.</div>'+
      '<div class="squad-rule-note"><b>Career boundary:</b> this model does not push real-world squad changes into an established .CAR. Career reserve/import work stays Under Construction until the career slot/status behaviour is safely decoded.</div>'+
      '<div class="squad-actions"><button class="btn" id="v136Rules">View model contract</button><button class="btn" disabled>Career squad import · Under Construction</button></div>'+
      '<div class="squad-contract" id="v136Contract">'+contractHtml(m)+'</div>';
    var input=document.getElementById('v136SquadSize');if(input)input.oninput=updateDemo;
    var rulesBtn=document.getElementById('v136Rules');if(rulesBtn)rulesBtn.onclick=function(){var p=document.getElementById('v136Contract');if(!p)return;p.classList.toggle('open');rulesBtn.textContent=p.classList.contains('open')?'Hide model contract':'View model contract';};
    updateDemo();
  }
  function releaseNotes(){
    if(document.getElementById('v136-release-card'))return;
    var anchor=document.getElementById('v135-release-card')||document.getElementById('v134-release-card');if(!anchor)return;
    var card=document.createElement('div');card.id='v136-release-card';card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.36.0 — Full Squad → SWOS 16 → Squad Pool</strong><span class="about">• Published the first formal club-record schema for the independent Football Database.</span><span class="about">• Published the three-layer squad model: complete modern roster, physical SWOS 16 and retained club squad pool.</span><span class="about">• Added a live squad-size preview so the 16-player split and retained pool are visible before any installation work exists.</span><span class="about">• Preserved the existing balanced SWOS 16 minimums.</span><span class="about">• Existing careers remain isolated from real-world database updates; career reserve import stays locked.</span><span class="about">• No new TEAM.* or .CAR write routines are enabled.</span>';
    anchor.insertAdjacentElement('beforebegin',card);
  }
  function apply(){
    document.title='SWOS Studio '+BUILD;
    document.querySelectorAll('.eyebrow').forEach(function(el){var t=el.textContent||'';if(t.indexOf('v1.35.0')>=0)el.textContent=t.replace('v1.35.0',BUILD);});
    var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;
    releaseNotes();build();
  }
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){Promise.resolve(apply()).finally(function(){queued=false;});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');

fs.writeFileSync(FILE,html,'utf8');
fs.mkdirSync('dist/football-db',{recursive:true});
for(const name of ['manifest.json','schema-v1.json','squad-model.json']){
  const source='football-db/'+name;
  if(!fs.existsSync(source)) throw new Error('SWOS Studio v1.36.0 build failed: '+source+' is missing.');
  fs.copyFileSync(source,'dist/football-db/'+name);
  JSON.parse(fs.readFileSync(source,'utf8'));
}
if(!html.includes('swos-v136-squad-layer')||!html.includes('v136-squad-architecture')) throw new Error('SWOS Studio v1.36.0 build failed: squad architecture layer was not injected.');
console.log('SWOS Studio '+BUILD+' squad architecture build complete.');
