import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.41.0';
if(!fs.existsSync(FILE))throw new Error('SWOS Studio v1.41.0 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.40.0</title>'))throw new Error('SWOS Studio v1.41.0 build failed: expected v1.40.0 output was not found.');
html=html.replace('<title>SWOS Studio v1.40.0</title>','<title>SWOS Studio v1.41.0</title>');
html=html.replaceAll("var BUILD='v1.40.0';","var BUILD='v1.41.0';");

const css=`
<style id="swos-v141-data-update-styles">
  .db-update-card{border:1px solid rgba(66,209,132,.58);background:linear-gradient(180deg,rgba(66,209,132,.08),rgba(7,17,31,.98));border-radius:14px;padding:14px;margin:14px 0;box-shadow:var(--shadow)}
  .db-update-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.db-update-head strong{font-size:15px}.db-update-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}
  .db-update-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:11px}.db-update-stat{border:1px solid var(--line);background:#07111f;border-radius:10px;padding:10px}.db-update-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase;letter-spacing:.07em}.db-update-stat b{display:block;font-size:14px;margin-top:3px}.db-update-stat span{display:block;color:var(--muted);font-size:8px;margin-top:3px;line-height:1.35}
  .db-update-status{border:1px solid var(--line);background:#07111f;border-radius:10px;padding:10px;margin-top:9px;font-size:9px;line-height:1.45;color:var(--muted)}.db-update-status.good{border-color:rgba(66,209,132,.5);color:#b8f8d2}.db-update-status.warn{border-color:rgba(245,213,71,.5);color:#ffe978}.db-update-status.error{border-color:rgba(255,107,107,.5);color:#ffbec4}
  .db-update-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.db-update-actions .btn{min-height:42px;font-size:10px;padding:8px}.db-update-safe{font-size:8px;color:var(--muted);line-height:1.45;margin-top:9px}.db-update-safe b{color:var(--green)}
  @media(max-width:520px){.db-update-grid,.db-update-actions{grid-template-columns:1fr}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v141-data-update-layer">
(function(){
  'use strict';
  var BUILD='v1.41.0';
  var INSTALLED_KEY='swos-football-db-installed-v1';
  var PREVIOUS_KEY='swos-football-db-previous-v1';
  var MANIFEST='football-db/manifest.json';
  var VALIDATION='football-db/validation.json';
  var IDENTITIES='football-db/identities.json';
  var PACKS='football-db/research-packs.json';
  var latestManifest=null;
  var busy=false;
  var originalIdentityLoader=null;
  var originalPackLoader=null;

  function clean(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(e){return null;}}
  function write(key,value){localStorage.setItem(key,JSON.stringify(value));}
  function installed(){return read(INSTALLED_KEY);}
  function previous(){return read(PREVIOUS_KEY);}
  function niceDate(v){if(!v)return '—';try{return new Date(v).toLocaleString();}catch(e){return v;}}
  async function json(url){var r=await fetch(url+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error(url+' returned HTTP '+r.status);return await r.json();}

  function validateBundle(m,v,i,p){
    if(!m||!m.version||!m.databaseId)throw new Error('Published database manifest is invalid.');
    if(!v||v.status!=='pass'||v.databaseVersion!==m.version)throw new Error('Published database validation report does not match the manifest.');
    var pl=(m.coverage&&m.coverage.premierLeague)||{};
    if(!i||i.schemaVersion!==1||i.season!==m.season||!i.clubs)throw new Error('Published identity feed is invalid.');
    if(i.clubCount!==Object.keys(i.clubs).length)throw new Error('Identity club totals do not match.');
    if(pl.identityReadyClubs!=null&&i.clubCount!==pl.identityReadyClubs)throw new Error('Identity coverage does not match the manifest.');
    if(!p||p.schemaVersion!==1||p.season!==m.season||!p.clubs)throw new Error('Published research-pack feed is invalid.');
    if(p.packCount!==Object.keys(p.clubs).length)throw new Error('Research-pack club totals do not match.');
    if(pl.researchPackClubs!=null&&p.packCount!==pl.researchPackClubs)throw new Error('Research-pack coverage does not match the manifest.');
    if(pl.researchPackPlayers!=null&&p.playerCount!==pl.researchPackPlayers)throw new Error('Research-pack player totals do not match the manifest.');
    return true;
  }

  async function downloadSnapshot(){
    var all=await Promise.all([json(MANIFEST),json(VALIDATION),json(IDENTITIES),json(PACKS)]),m=all[0],v=all[1],i=all[2],p=all[3];
    validateBundle(m,v,i,p);
    latestManifest=m;
    return {version:m.version,databaseId:m.databaseId,season:m.season,publishedAt:m.publishedAt,installedAt:new Date().toISOString(),validation:{status:v.status,checks:v.totals&&v.totals.checks||null},identities:i,researchPacks:p,manifest:m};
  }

  function applySnapshot(s){
    if(!s)return;
    try{
      if(s.identities&&typeof publishedIdentityFeed!=='undefined'){
        publishedIdentityFeed=s.identities;
        if(typeof publishedIdentityStatus!=='undefined')publishedIdentityStatus={source:'published',mode:'installed',checkedAt:new Date().toISOString(),error:null,clubs:s.identities.clubCount,players:s.identities.playerCount,u21:s.identities.u21PlayerCount,version:s.version};
        window.dispatchEvent(new CustomEvent('swos:identity-source',{detail:typeof publishedIdentityStatus!=='undefined'?publishedIdentityStatus:{source:'published'}}));
      }
      if(s.researchPacks&&typeof publishedResearchPackFeed!=='undefined'){
        publishedResearchPackFeed=s.researchPacks;
        if(typeof publishedResearchPackStatus!=='undefined')publishedResearchPackStatus={source:'published',mode:'installed',checkedAt:new Date().toISOString(),error:null,version:s.version,clubs:s.researchPacks.packCount,players:s.researchPacks.playerCount};
        window.dispatchEvent(new CustomEvent('swos:research-pack-source',{detail:typeof publishedResearchPackStatus!=='undefined'?publishedResearchPackStatus:{source:'published'}}));
      }
    }catch(e){}
  }

  function installLoaderWrappers(){
    try{
      if(!originalIdentityLoader&&typeof loadPublishedIdentityFeed==='function'){
        originalIdentityLoader=loadPublishedIdentityFeed;
        loadPublishedIdentityFeed=async function(force){
          var s=installed();
          if(s&&!force){applySnapshot(s);return s.identities;}
          if(s&&force){try{await originalIdentityLoader(true);}catch(e){}applySnapshot(s);return s.identities;}
          return await originalIdentityLoader(!!force);
        };
      }
      if(!originalPackLoader&&typeof loadPublishedResearchPackFeed==='function'){
        originalPackLoader=loadPublishedResearchPackFeed;
        loadPublishedResearchPackFeed=async function(force){
          var s=installed();
          if(s&&!force){applySnapshot(s);return s.researchPacks;}
          if(s&&force){try{await originalPackLoader(true);}catch(e){}applySnapshot(s);return s.researchPacks;}
          return await originalPackLoader(!!force);
        };
      }
    }catch(e){}
  }

  async function ensureInitialSnapshot(){
    var s=installed();if(s){applySnapshot(s);return s;}
    try{s=await downloadSnapshot();write(INSTALLED_KEY,s);applySnapshot(s);return s;}catch(e){return null;}
  }

  async function checkLatest(){
    var m=await json(MANIFEST);if(!m||!m.version)throw new Error('Published manifest is invalid.');latestManifest=m;return m;
  }

  async function installLatest(){
    if(busy)return;busy=true;draw('Downloading and validating the latest football data…','warn');
    try{
      var next=await downloadSnapshot(),old=installed();
      if(old&&old.version!==next.version)write(PREVIOUS_KEY,old);
      write(INSTALLED_KEY,next);applySnapshot(next);draw('Football data '+next.version+' is now active on this device.','good');
    }catch(e){draw('Update stopped: '+String(e&&e.message||e),'error');}
    finally{busy=false;}
  }

  function rollback(){
    var prev=previous();if(!prev)return;
    var cur=installed();try{if(cur)write(PREVIOUS_KEY,cur);write(INSTALLED_KEY,prev);applySnapshot(prev);draw('Rolled back to football data '+prev.version+'.','good');}catch(e){draw('Rollback failed: '+String(e&&e.message||e),'error');}
  }

  function statusText(s,m){
    if(!s)return 'No local football-data snapshot is installed yet.';
    if(!m)return 'Installed snapshot is ready. Check the published channel for a newer version.';
    return s.version===m.version?'Up to date — this device is using the latest validated football data.':'Update available — '+s.version+' is installed and '+m.version+' is published.';
  }

  function draw(message,tone){
    var anchor=document.getElementById('v135-football-db-card')||document.getElementById('v138-db-health');
    if(!anchor)return;
    var s=installed(),m=latestManifest,p=previous();
    var card=document.getElementById('v141-db-update');if(!card){card=document.createElement('section');card.id='v141-db-update';card.className='db-update-card';anchor.insertAdjacentElement('afterend',card);}
    var updateAvailable=!!(s&&m&&s.version!==m.version);
    card.innerHTML='<div class="db-update-head"><div><strong>🔄 Football Data Update</strong><p>Studio can now keep a validated football-data snapshot on this device independently from the Studio software version.</p></div><span class="feature-status '+(updateAvailable?'beta':'available')+'">'+(updateAvailable?'UPDATE':'READY')+'</span></div>'+
      '<div class="db-update-grid"><div class="db-update-stat"><small>Installed on this device</small><b>'+clean(s?s.version:'Not installed')+'</b><span>'+(s?'Installed '+clean(niceDate(s.installedAt)):'Studio will create a safe local snapshot')+'</span></div><div class="db-update-stat"><small>Latest published</small><b>'+clean(m?m.version:'Check required')+'</b><span>'+(m?'Published '+clean(m.publishedAt||'—'):'Tap Check for update')+'</span></div></div>'+
      '<div class="db-update-status '+clean(tone||((s&&m&&s.version===m.version)?'good':'warn'))+'">'+clean(message||statusText(s,m))+'</div>'+
      '<div class="db-update-actions"><button class="btn btn-blue" id="v141Check">Check for update</button><button class="btn btn-green" id="v141Install">'+(updateAvailable?'Install latest football data':'Refresh installed football data')+'</button></div>'+
      (p?'<button class="btn" id="v141Rollback" style="width:100%;margin-top:8px">Roll back to '+clean(p.version)+'</button>':'')+
      '<div class="db-update-safe"><b>Safe boundary:</b> this only changes Studio\'s football-data snapshot. It does not alter TEAM.* files and it never injects real-world data into an existing .CAR career.</div>';
    var c=document.getElementById('v141Check');if(c)c.onclick=async function(){if(busy)return;busy=true;c.disabled=true;c.textContent='Checking…';try{var fresh=await checkLatest();var cur=installed();draw(cur&&cur.version===fresh.version?'No update needed — '+fresh.version+' is already installed.':'New football data is available: '+fresh.version+'.',cur&&cur.version===fresh.version?'good':'warn');}catch(e){draw('Could not check the published channel: '+String(e&&e.message||e),'error');}finally{busy=false;}};
    var i=document.getElementById('v141Install');if(i)i.onclick=installLatest;
    var r=document.getElementById('v141Rollback');if(r)r.onclick=rollback;
  }

  function releaseNotes(){
    if(document.getElementById('v141-release-card'))return;
    var anchor=document.getElementById('v140-release-card')||document.getElementById('v139-release-card');if(!anchor)return;
    var card=document.createElement('div');card.id='v141-release-card';card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.41.0 — Updateable football-data snapshots</strong><span class="about">• Studio now keeps an installed football-data version separately from the Studio software version.</span><span class="about">• Check for update compares the installed snapshot with the latest published database manifest.</span><span class="about">• Refresh / Install downloads manifest, validation report, verified identities and research packs together and refuses the update if the bundle does not validate.</span><span class="about">• The active identity and research-pack loaders can use the installed snapshot rather than silently drifting to a different published version.</span><span class="about">• The previous snapshot is retained for rollback when a newer database version is installed.</span><span class="about">• TEAM.* and existing .CAR files remain completely outside this update process.</span>';
    anchor.insertAdjacentElement('beforebegin',card);
  }

  async function start(){
    document.title='SWOS Studio '+BUILD;
    var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;
    releaseNotes();installLoaderWrappers();
    var s=await ensureInitialSnapshot();
    try{await checkLatest();}catch(e){}
    if(s)applySnapshot(s);
    draw();
  }
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){Promise.resolve(start()).finally(function(){queued=false;});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(function(){if(document.getElementById('v135-football-db-card')&&!document.getElementById('v141-db-update'))queue();}).observe(document.body,{childList:true,subtree:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');

fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v141-data-update-layer')||!html.includes('Football Data Update'))throw new Error('SWOS Studio v1.41.0 build failed: update snapshot layer was not installed.');
console.log('SWOS Studio '+BUILD+' football-data snapshot updater build complete.');
