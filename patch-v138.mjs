import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.38.0';
if(!fs.existsSync(FILE)) throw new Error('SWOS Studio v1.38.0 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.37.0</title>')) throw new Error('SWOS Studio v1.38.0 build failed: expected v1.37.0 output was not found.');
html=html.replace('<title>SWOS Studio v1.37.0</title>','<title>SWOS Studio v1.38.0</title>');
html=html.replaceAll("var BUILD='v1.37.0';","var BUILD='v1.38.0';");

const css=`
<style id="swos-v138-health-styles">
  .db-health-card{border:1px solid rgba(66,209,132,.58);background:linear-gradient(180deg,rgba(66,209,132,.09),rgba(7,17,31,.97));border-radius:14px;padding:14px;margin:14px 0;box-shadow:var(--shadow)}
  .db-health-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.db-health-head strong{font-size:15px}.db-health-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}
  .db-health-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:11px}.db-health-stat{border:1px solid var(--line);background:#07111f;border-radius:9px;padding:8px}.db-health-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase}.db-health-stat b{display:block;font-size:13px;margin-top:3px}.db-health-stat b.good{color:var(--green)}
  .db-health-guarantees{display:grid;gap:6px;margin-top:10px}.db-health-row{display:flex;justify-content:space-between;gap:10px;border-top:1px solid rgba(38,61,92,.65);padding-top:6px;font-size:8px}.db-health-row span{color:var(--muted)}.db-health-row b{text-align:right}.db-health-row b.good{color:var(--green)}
  .db-health-note{font-size:8px;color:var(--muted);line-height:1.45;margin-top:9px}.db-health-note b{color:var(--text)}
  @media(max-width:620px){.db-health-grid{grid-template-columns:repeat(2,1fr)}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v138-health-layer">
(function(){
  'use strict';
  var BUILD='v1.38.0';
  var URL='football-db/validation.json';
  var reportCache=null;
  function clean(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  async function report(force){
    if(reportCache&&!force)return reportCache;
    var r=await fetch(URL+(force?('?t='+Date.now()):''),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);var x=await r.json();if(!x||x.status!=='pass'||!x.totals)throw new Error('Published validation report is invalid');reportCache=x;return x;
  }
  function row(label,value,good){return '<div class="db-health-row"><span>'+clean(label)+'</span><b class="'+(good?'good':'')+'">'+clean(value)+'</b></div>';}
  async function build(force){
    var anchor=document.getElementById('v1361-published-packs')||document.getElementById('v136-squad-architecture');if(!anchor){var old=document.getElementById('v138-db-health');if(old)old.remove();return;}
    var card=document.getElementById('v138-db-health');if(!card){card=document.createElement('section');card.id='v138-db-health';card.className='db-health-card';anchor.insertAdjacentElement('afterend',card);}
    try{
      var x=await report(!!force),g=x.guarantees||{},t=x.totals||{};
      card.innerHTML='<div class="db-health-head"><div><strong>🛡️ Football Database Health</strong><p>The published football data must pass this validator during the Vercel build. A bad pack now stops publication instead of quietly reaching the app.</p></div><span class="feature-status available">PASS</span></div>'+
        '<div class="db-health-grid"><div class="db-health-stat"><small>Validation</small><b class="good">PASS</b></div><div class="db-health-stat"><small>Checks passed</small><b>'+clean(t.checks||0)+'</b></div><div class="db-health-stat"><small>Research packs</small><b>'+clean(t.clubs||0)+'</b></div><div class="db-health-stat"><small>Players checked</small><b>'+clean(t.players||0)+'</b></div></div>'+
        '<div class="db-health-guarantees">'+
          row('Current research-pack size','Exactly '+clean(g.exactCurrentPackSize||16)+' each',true)+
          row('SWOS position codes',clean(g.swosPositionRange||'0-7')+' only',true)+
          row('Manifest totals','Matched to files',!!g.manifestCountsMatch)+
          row('Club schema','Exactly 16 installed SWOS IDs',!!g.clubSchemaRequires16)+
          row('Existing career auto-update',g.careerAutoUpdate===false?'Blocked':'Unexpected',g.careerAutoUpdate===false)+
          row('TEAM.* / .CAR writes',(g.teamWriteEnabled===false&&g.careerWriteEnabled===false)?'Locked':'Unexpected',g.teamWriteEnabled===false&&g.careerWriteEnabled===false)+
        '</div>'+
        '<div class="db-health-note"><b>Build gate:</b> invalid JSON, wrong pack totals, missing/invalid age or market value, SWOS positions outside 0–7, broken 16-player constraints, or an accidental binary-write unlock will fail the deployment.</div>'+
        '<button class="btn btn-blue" id="v138RefreshHealth" style="width:100%;margin-top:10px">Recheck published validation report</button>';
      var b=document.getElementById('v138RefreshHealth');if(b)b.onclick=function(){b.disabled=true;b.textContent='Checking…';build(true);};
    }catch(e){
      card.innerHTML='<div class="db-health-head"><div><strong>🛡️ Football Database Health</strong><p>The published validation report could not be confirmed from this page. No installer permissions are changed.</p></div><span class="feature-status beta">CHECK</span></div><div class="db-health-note">'+clean(e&&e.message||e)+'</div><button class="btn" id="v138RetryHealth" style="width:100%;margin-top:10px">Try again</button>';
      var r=document.getElementById('v138RetryHealth');if(r)r.onclick=function(){build(true);};
    }
  }
  function releaseNotes(){
    if(document.getElementById('v138-release-card'))return;
    var anchor=document.getElementById('v137-release-card')||document.getElementById('v1361-release-card');if(!anchor)return;
    var card=document.createElement('div');card.id='v138-release-card';card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.38.0 — Football Database build gate</strong><span class="about">• Every deployment now validates the independent football database before SWOS Studio is built.</span><span class="about">• Manifest totals must agree with the published files.</span><span class="about">• Each current research pack must contain exactly 16 players with valid age, market value and SWOS position data.</span><span class="about">• The club schema, three-layer squad model and career-isolation rules are checked automatically.</span><span class="about">• Any accidental TEAM.* or .CAR write unlock fails validation.</span><span class="about">• Added a visible Database Health report to Update SWOS.</span>';
    anchor.insertAdjacentElement('beforebegin',card);
  }
  function apply(){document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;releaseNotes();build(false);}
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){Promise.resolve(apply()).finally(function(){queued=false;});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
const src='football-db/validation.json',dst='dist/football-db/validation.json';
if(!fs.existsSync(src))throw new Error('SWOS Studio v1.38.0 build failed: validator did not create validation.json.');
const validation=JSON.parse(fs.readFileSync(src,'utf8'));if(validation.status!=='pass')throw new Error('SWOS Studio v1.38.0 build failed: football database did not pass validation.');
fs.mkdirSync('dist/football-db',{recursive:true});fs.copyFileSync(src,dst);
if(!html.includes('swos-v138-health-layer'))throw new Error('SWOS Studio v1.38.0 build failed: Database Health layer was not injected.');
console.log('SWOS Studio '+BUILD+' database health build complete.');
