import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.36.1';
if(!fs.existsSync(FILE)) throw new Error('SWOS Studio v1.36.1 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.36.0</title>')) throw new Error('SWOS Studio v1.36.1 build failed: expected v1.36.0 output was not found.');
html=html.replace('<title>SWOS Studio v1.36.0</title>','<title>SWOS Studio v1.36.1</title>');
html=html.replaceAll("var BUILD='v1.36.0';","var BUILD='v1.36.1';");

const css=`
<style id="swos-v1361-pack-styles">
  .published-packs{border:1px solid rgba(66,209,132,.5);background:linear-gradient(180deg,rgba(66,209,132,.08),rgba(9,20,33,.96));border-radius:14px;padding:14px;margin:14px 0;box-shadow:var(--shadow)}
  .published-packs-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.published-packs-head strong{font-size:15px}.published-packs-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}
  .published-pack-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.published-pack-stat{border:1px solid var(--line);background:#07111f;border-radius:9px;padding:8px}.published-pack-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase}.published-pack-stat b{display:block;font-size:14px;margin-top:2px}
  .published-pack-list{display:grid;gap:7px;margin-top:10px}.published-pack-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--line);background:#07111f;border-radius:10px;padding:9px}.published-pack-row strong{display:block;font-size:11px}.published-pack-row span{display:block;color:var(--muted);font-size:8px;margin-top:2px}.published-pack-count{font-size:9px;font-weight:900;color:var(--green);white-space:nowrap}
  .published-pack-foot{font-size:8px;color:var(--muted);line-height:1.45;margin-top:9px}.published-pack-foot b{color:var(--text)}
  @media(max-width:520px){.published-pack-summary{grid-template-columns:1fr}.published-pack-row{align-items:flex-start}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v1361-pack-layer">
(function(){
  'use strict';
  var BUILD='v1.36.1';
  var URL='football-db/research-packs.json';
  var cache=null;
  function clean(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  async function load(force){
    if(cache&&!force)return cache;
    var r=await fetch(URL+(force?('?t='+Date.now()):''),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);cache=await r.json();return cache;
  }
  function counts(players){var rows=Object.values(players||{});return {players:rows.length,values:rows.filter(function(x){return Number.isFinite(Number(x.marketValueM));}).length,stats:rows.filter(function(x){return Number.isFinite(Number(x.minutes));}).length};}
  async function build(force){
    var anchor=document.getElementById('v136-squad-architecture');if(!anchor){var old=document.getElementById('v1361-published-packs');if(old)old.remove();return;}
    var box=document.getElementById('v1361-published-packs');if(!box){box=document.createElement('section');box.id='v1361-published-packs';box.className='published-packs';anchor.insertAdjacentElement('afterend',box);}
    try{
      var d=await load(!!force),clubs=Object.values(d.clubs||{}),total=clubs.reduce(function(n,c){return n+counts(c.players).players;},0),stats=clubs.reduce(function(n,c){return n+counts(c.players).stats;},0),values=clubs.reduce(function(n,c){return n+counts(c.players).values;},0);
      box.innerHTML='<div class="published-packs-head"><div><strong>📦 Published Research Packs</strong><p>The first researched player packs now live in the independent Football Database rather than only inside the SWOS Studio app bundle.</p></div><span class="feature-status available">Published</span></div>'+
        '<div class="published-pack-summary"><div class="published-pack-stat"><small>Clubs published</small><b>'+clubs.length+'</b></div><div class="published-pack-stat"><small>Packaged players</small><b>'+total+'</b></div><div class="published-pack-stat"><small>With match output</small><b>'+stats+'</b></div></div>'+
        '<div class="published-pack-list">'+clubs.map(function(c){var x=counts(c.players);return '<div class="published-pack-row"><div><strong>'+clean(c.label)+'</strong><span>'+clean(c.kind||'Research pack')+' · '+x.values+'/'+x.players+' with values · '+x.stats+'/'+x.players+' with match output</span></div><div class="published-pack-count">'+x.players+' players</div></div>';}).join('')+'</div>'+
        '<div class="published-pack-foot"><b>What this changes:</b> future data corrections can be published independently of the Studio code. The current in-app loaders are still preserved while we migrate them onto this feed; nothing here writes to TEAM.* or .CAR.</div>'+
        '<button class="btn btn-blue" id="v1361RefreshPacks" style="width:100%;margin-top:10px">Refresh published packs</button>';
      var b=document.getElementById('v1361RefreshPacks');if(b)b.onclick=function(){b.disabled=true;b.textContent='Refreshing…';build(true);};
    }catch(e){
      box.innerHTML='<div class="published-packs-head"><div><strong>📦 Published Research Packs</strong><p>The independent pack feed could not be loaded on this attempt. Existing embedded research packs remain available.</p></div><span class="feature-status beta">Retry</span></div><button class="btn" id="v1361Retry" style="width:100%;margin-top:10px">Try again</button>';
      var r=document.getElementById('v1361Retry');if(r)r.onclick=function(){build(true);};
    }
  }
  function releaseNotes(){
    if(document.getElementById('v1361-release-card'))return;
    var anchor=document.getElementById('v136-release-card')||document.getElementById('v135-release-card');if(!anchor)return;
    var card=document.createElement('div');card.id='v1361-release-card';card.className='card stack v133-release-card';card.innerHTML='<strong>New in v1.36.1 — Research packs moved onto the data channel</strong><span class="about">• Published Arsenal, Liverpool, Aston Villa, Manchester City and Manchester United research packs as a separate football-database resource.</span><span class="about">• 80 existing packaged players now have a versioned home outside the main app bundle.</span><span class="about">• Added live published-pack coverage to Update SWOS.</span><span class="about">• This is a migration layer only: the existing embedded loaders remain intact while the feed is proven.</span><span class="about">• No new TEAM.* or .CAR writes are enabled.</span>';anchor.insertAdjacentElement('beforebegin',card);
  }
  function apply(){document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;releaseNotes();build(false);}
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){Promise.resolve(apply()).finally(function(){queued=false;});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
const src='football-db/research-packs.json',dst='dist/football-db/research-packs.json';
if(!fs.existsSync(src)) throw new Error('SWOS Studio v1.36.1 build failed: research pack resource is missing.');
fs.mkdirSync('dist/football-db',{recursive:true});fs.copyFileSync(src,dst);const packs=JSON.parse(fs.readFileSync(src,'utf8'));
if(packs.packCount!==5||packs.playerCount!==80) throw new Error('SWOS Studio v1.36.1 build failed: expected 5 packs / 80 players.');
if(!html.includes('swos-v1361-pack-layer')) throw new Error('SWOS Studio v1.36.1 build failed: published pack layer was not injected.');
console.log('SWOS Studio '+BUILD+' independent research-pack build complete.');
