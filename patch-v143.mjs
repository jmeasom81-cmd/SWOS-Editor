import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.43.0';
if(!fs.existsSync(FILE))throw new Error('SWOS Studio v1.43.0 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.42.0</title>'))throw new Error('SWOS Studio v1.43.0 build failed: expected v1.42.0 output was not found.');
html=html.replace('<title>SWOS Studio v1.42.0</title>','<title>SWOS Studio v1.43.0</title>');
html=html.replaceAll("var BUILD='v1.42.0';","var BUILD='v1.43.0';");

const installArchiveMarker="if(old&&old.version!==next.version)write(PREVIOUS_KEY,old);";
if(!html.includes(installArchiveMarker))throw new Error('SWOS Studio v1.43.0 build failed: database install archive marker was not found.');
html=html.replace(installArchiveMarker,"if(old&&old.version!==next.version){write(PREVIOUS_KEY,old);try{if(window.swosDbHistoryArchive)window.swosDbHistoryArchive(old);}catch(e){}}");

const rollbackArchiveMarker="var cur=installed();try{if(cur)write(PREVIOUS_KEY,cur);write(INSTALLED_KEY,prev);applySnapshot(prev);draw('Rolled back to football data '+prev.version+'.','good');}";
if(!html.includes(rollbackArchiveMarker))throw new Error('SWOS Studio v1.43.0 build failed: database rollback archive marker was not found.');
html=html.replace(rollbackArchiveMarker,"var cur=installed();try{if(cur){write(PREVIOUS_KEY,cur);try{if(window.swosDbHistoryArchive)window.swosDbHistoryArchive(cur);}catch(e){}}write(INSTALLED_KEY,prev);applySnapshot(prev);draw('Rolled back to football data '+prev.version+'.','good');}");

const css=`
<style id="swos-v143-db-manager-styles">
  .db-manager{border:1px solid rgba(88,166,255,.55);background:linear-gradient(180deg,rgba(88,166,255,.08),rgba(7,17,31,.98));border-radius:14px;padding:14px;margin:14px 0;box-shadow:var(--shadow)}
  .db-manager-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.db-manager-head strong{font-size:15px}.db-manager-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}
  .db-manager-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:11px}.db-manager-stat{border:1px solid var(--line);background:#07111f;border-radius:10px;padding:10px}.db-manager-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase;letter-spacing:.07em}.db-manager-stat b{display:block;font-size:13px;margin-top:3px}.db-manager-stat span{display:block;color:var(--muted);font-size:8px;line-height:1.35;margin-top:3px}
  .db-manager-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.db-manager-actions .btn{min-height:42px;font-size:9px;padding:8px}
  .db-manager-report{border:1px solid var(--line);background:#07111f;border-radius:10px;padding:10px;margin-top:10px}.db-manager-report.good{border-color:rgba(66,209,132,.5)}.db-manager-report.warn{border-color:rgba(245,213,71,.5)}.db-manager-report.error{border-color:rgba(255,107,107,.5)}
  .db-manager-report-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.db-manager-report-head strong{font-size:11px}.db-manager-report-head span{font-size:8px;font-weight:900;border-radius:999px;padding:4px 7px;border:1px solid var(--line)}
  .db-check-list{display:grid;gap:5px;margin-top:8px}.db-check{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border-top:1px solid rgba(38,61,92,.55);padding-top:6px;font-size:8px}.db-check:first-child{border-top:0;padding-top:0}.db-check b{font-size:8px}.db-check span{color:var(--muted);text-align:right;line-height:1.35}.db-check.ok b{color:var(--green)}.db-check.fail b{color:var(--red)}
  .db-history{display:grid;gap:7px;margin-top:9px}.db-history-row{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--line);background:#07111f;border-radius:9px;padding:9px}.db-history-row strong{display:block;font-size:10px}.db-history-row span{display:block;color:var(--muted);font-size:7px;margin-top:2px}.db-history-tag{font-size:7px!important;font-weight:900!important;border:1px solid var(--line);border-radius:999px;padding:3px 6px;color:var(--text)!important;white-space:nowrap}.db-history-tag.current{border-color:rgba(66,209,132,.5);color:var(--green)!important}.db-history-tag.rollback{border-color:rgba(245,213,71,.5);color:var(--yellow)!important}
  .db-rollback-confirm{border:1px solid rgba(245,213,71,.55);background:rgba(245,213,71,.06);border-radius:10px;padding:10px;margin-top:9px}.db-rollback-confirm strong{font-size:10px;color:var(--yellow)}.db-rollback-confirm p{font-size:8px;color:var(--muted);line-height:1.45;margin:5px 0 9px}.db-rollback-confirm .row .btn{min-height:38px;font-size:9px}
  .db-manager-note{font-size:8px;color:var(--muted);line-height:1.45;margin-top:9px}.db-manager-note b{color:var(--blue)}
  @media(max-width:520px){.db-manager-grid,.db-manager-actions{grid-template-columns:1fr}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v143-db-manager-layer">
(function(){
  'use strict';
  var BUILD='v1.43.0';
  var INSTALLED_KEY='swos-football-db-installed-v1';
  var PREVIOUS_KEY='swos-football-db-previous-v1';
  var HISTORY_KEY='swos-football-db-history-v1';
  var MANIFEST='football-db/manifest.json';
  var latestPublished=null;
  var lastReport=null;
  var showHistory=false;
  var checking=false;

  function clean(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(e){return null;}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}}
  function installed(){return read(INSTALLED_KEY);}
  function previous(){return read(PREVIOUS_KEY);}
  function niceDate(v){if(!v)return '—';try{return new Date(v).toLocaleString();}catch(e){return String(v);}}
  function versionParts(v){return String(v||'0').replace(/^v/i,'').split('.').map(function(x){var n=parseInt(x,10);return Number.isFinite(n)?n:0;});}
  function versionAtLeast(current,minimum){var a=versionParts(current),b=versionParts(minimum),n=Math.max(a.length,b.length);for(var x=0;x<n;x++){var av=a[x]||0,bv=b[x]||0;if(av>bv)return true;if(av<bv)return false;}return true;}
  function sameSnapshot(a,b){return !!(a&&b&&a.version===b.version&&a.installedAt===b.installedAt);}

  function history(){var h=read(HISTORY_KEY);return Array.isArray(h)?h:[];}
  function archive(s){
    if(!s||!s.version)return;
    var h=history().filter(function(x){return x&&x.version&&!sameSnapshot(x,s);});
    h.unshift(s);if(h.length>3)h=h.slice(0,3);write(HISTORY_KEY,h);draw();
  }
  window.swosDbHistoryArchive=archive;

  function integrityLabel(s){var i=s&&s.validation&&s.validation.integrity;return i==='sha256-verified'?'SHA-256 verified':i==='server-validated'?'Validated build':i?'Recorded: '+i:'Not recorded';}
  function coverage(s){var m=s&&s.manifest||{},pl=m.coverage&&m.coverage.premierLeague||{};return {clubs:pl.clubs||20,identityClubs:pl.identityReadyClubs||0,identityPlayers:pl.identityPlayers||0,researchClubs:pl.researchPackClubs||0,researchPlayers:pl.researchPackPlayers||0};}

  function verifySnapshot(s){
    var checks=[];
    function add(name,ok,detail){checks.push({name:name,ok:!!ok,detail:detail||''});}
    if(!s){add('Snapshot installed',false,'No installed football database was found on this device.');return {ok:false,checks:checks};}
    var m=s.manifest||{},i=s.identities||{},p=s.researchPacks||{},pl=m.coverage&&m.coverage.premierLeague||{},min=m.minimumStudioVersion||s.minimumStudioVersion||'0';
    add('Snapshot installed',!!s.version,s.version||'Missing version');
    add('Manifest identity',!!m.databaseId&&m.version===s.version,(m.databaseId||'No database ID')+' · '+(m.version||'No manifest version'));
    add('Season alignment',!!s.season&&m.season===s.season&&i.season===s.season&&p.season===s.season,s.season||'Missing season');
    add('Identity schema',i.schemaVersion===1,'schema '+(i.schemaVersion==null?'?':i.schemaVersion));
    add('Research-pack schema',p.schemaVersion===1,'schema '+(p.schemaVersion==null?'?':p.schemaVersion));
    add('Identity coverage',i.clubCount===pl.identityReadyClubs&&i.playerCount===pl.identityPlayers,(i.clubCount||0)+' clubs · '+(i.playerCount||0)+' players');
    add('Research coverage',p.packCount===pl.researchPackClubs&&p.playerCount===pl.researchPackPlayers,(p.packCount||0)+' clubs · '+(p.playerCount||0)+' players');
    add('Published validation',s.validation&&s.validation.status==='pass',(s.validation&&s.validation.checks?s.validation.checks+' checks':'status '+((s.validation&&s.validation.status)||'missing')));
    add('Studio compatibility',versionAtLeast(BUILD,min),'requires '+min+' · running '+BUILD.replace(/^v/,''));
    add('Integrity record',!!(s.validation&&s.validation.integrity),integrityLabel(s));
    add('Game-file isolation',m.installation&&m.installation.teamWriteReady===false&&m.installation.careerWriteReady===false,'TEAM writes locked · career writes locked');
    return {ok:checks.every(function(c){return c.ok;}),checks:checks};
  }

  async function fetchLatest(){
    var r=await fetch(MANIFEST+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('Manifest returned HTTP '+r.status);var m=await r.json();if(!m||!m.version||!m.databaseId)throw new Error('Published manifest is invalid.');latestPublished=m;return m;
  }

  function reportHtml(report){
    if(!report)return '<div class="db-manager-report warn"><div class="db-manager-report-head"><strong>Verification has not been run yet</strong><span>READY</span></div><div class="about" style="margin-top:6px">Run Verify installed database to check the local snapshot against its own manifest and safety rules.</div></div>';
    var rows=report.checks.map(function(c){return '<div class="db-check '+(c.ok?'ok':'fail')+'"><b>'+(c.ok?'✓ ':'✕ ')+clean(c.name)+'</b><span>'+clean(c.detail)+'</span></div>';}).join('');
    return '<div class="db-manager-report '+(report.ok?'good':'error')+'"><div class="db-manager-report-head"><strong>'+(report.ok?'Installed database passed verification':'Installed database needs attention')+'</strong><span>'+(report.ok?'PASS':'STOP')+'</span></div><div class="db-check-list">'+rows+'</div></div>';
  }

  function dedupeSnapshots(list){var seen={};return list.filter(function(s){if(!s||!s.version)return false;var key=s.version+'|'+(s.installedAt||'');if(seen[key])return false;seen[key]=1;return true;});}
  function historyHtml(){
    if(!showHistory)return '';
    var cur=installed(),prev=previous(),items=dedupeSnapshots([cur,prev].concat(history()));
    if(!items.length)return '<div class="db-manager-report warn"><div class="about">No database snapshots have been recorded on this device yet.</div></div>';
    return '<div class="db-history">'+items.map(function(s){var tag=sameSnapshot(s,cur)?'<span class="db-history-tag current">CURRENT</span>':sameSnapshot(s,prev)?'<span class="db-history-tag rollback">ROLLBACK</span>':'<span class="db-history-tag">HISTORY</span>';return '<div class="db-history-row"><div><strong>'+clean(s.version)+'</strong><span>'+clean(s.season||'Season not recorded')+' · '+clean(niceDate(s.installedAt))+'</span></div>'+tag+'</div>';}).join('')+'</div>';
  }

  function draw(message,tone){
    var anchor=document.getElementById('v141-db-update')||document.getElementById('v142-integrity-strip')||document.getElementById('v135-football-db-card');if(!anchor)return;
    var s=installed(),m=latestPublished||s&&s.manifest||null,cov=coverage(s),min=m&&m.minimumStudioVersion||s&&s.minimumStudioVersion||'—',compatible=min==='—'?true:versionAtLeast(BUILD,min),writes=m&&m.installation||{},integrity=integrityLabel(s);
    var card=document.getElementById('v143-db-manager');if(!card){card=document.createElement('section');card.id='v143-db-manager';card.className='db-manager';var update=document.getElementById('v141-db-update');(update||anchor).insertAdjacentElement('afterend',card);}
    var state=lastReport?(lastReport.ok?'available':'construction'):'beta';
    var latestText=latestPublished?latestPublished.version:'Not checked';
    var updateState=s&&latestPublished?(s.version===latestPublished.version?'Up to date':'Update available'):'Check required';
    card.innerHTML='<div class="db-manager-head"><div><strong>🗄 Football Database Manager</strong><p>See exactly which real-world database Studio is using, verify it, compare it with the published channel and review rollback history.</p></div><span class="feature-status '+state+'">'+(lastReport?(lastReport.ok?'VERIFIED':'ATTENTION'):'BETA')+'</span></div>'+
      '<div class="db-manager-grid">'+
        '<div class="db-manager-stat"><small>Installed database</small><b>'+clean(s?s.version:'Not installed')+'</b><span>'+clean(s?s.season||'Season unknown':'No local snapshot')+'</span></div>'+
        '<div class="db-manager-stat"><small>Published channel</small><b>'+clean(latestText)+'</b><span>'+clean(updateState)+'</span></div>'+
        '<div class="db-manager-stat"><small>Compatibility</small><b>'+(compatible?'Compatible':'Studio update required')+'</b><span>Minimum Studio '+clean(min)+'</span></div>'+
        '<div class="db-manager-stat"><small>Integrity</small><b>'+clean(integrity)+'</b><span>'+(s&&s.validation&&s.validation.checks?clean(s.validation.checks)+' validation checks recorded':'Validation count unavailable')+'</span></div>'+
        '<div class="db-manager-stat"><small>PL identities</small><b>'+clean(cov.identityClubs)+' / '+clean(cov.clubs)+' clubs</b><span>'+clean(cov.identityPlayers)+' verified senior identities</span></div>'+
        '<div class="db-manager-stat"><small>Research packs</small><b>'+clean(cov.researchClubs)+' clubs</b><span>'+clean(cov.researchPlayers)+' researched players</span></div>'+
        '<div class="db-manager-stat"><small>TEAM installation</small><b>'+(writes.teamWriteReady===true?'Enabled':'Locked')+'</b><span>'+(writes.teamWriteReady===true?'Database explicitly allows TEAM writes':'Modern database cannot write TEAM.* yet')+'</span></div>'+
        '<div class="db-manager-stat"><small>Career injection</small><b>'+(writes.careerWriteReady===true?'Enabled':'Locked')+'</b><span>'+(writes.careerWriteReady===true?'Database explicitly allows career writes':'Existing .CAR careers stay isolated')+'</span></div>'+
      '</div>'+
      (message?'<div class="db-update-status '+clean(tone||'warn')+'" style="margin-top:10px">'+clean(message)+'</div>':'')+
      '<div class="db-manager-actions"><button class="btn btn-green" id="v143Verify">Verify installed database</button><button class="btn btn-blue" id="v143Published">Check published manifest</button><button class="btn" id="v143History">'+(showHistory?'Hide':'View')+' data history</button></div>'+
      reportHtml(lastReport)+historyHtml()+
      '<div class="db-manager-note"><b>Database and career are separate worlds.</b> Updating this real-world snapshot changes Studio research data only. An established career remains its own fictional universe.</div>';
    var verify=document.getElementById('v143Verify');if(verify)verify.onclick=function(){lastReport=verifySnapshot(installed());draw(lastReport.ok?'Local football database passed every Studio safety check.':'Verification found a problem. Do not rely on this snapshot until it is refreshed. ',lastReport.ok?'good':'error');};
    var pub=document.getElementById('v143Published');if(pub)pub.onclick=async function(){if(checking)return;checking=true;pub.disabled=true;pub.textContent='Checking…';try{var fresh=await fetchLatest(),cur=installed();draw(cur&&cur.version===fresh.version?'Published channel checked — '+fresh.version+' is already installed.':'Published channel checked — '+fresh.version+' is available.',cur&&cur.version===fresh.version?'good':'warn');}catch(e){draw('Published-channel check failed: '+String(e&&e.message||e),'error');}finally{checking=false;}};
    var h=document.getElementById('v143History');if(h)h.onclick=function(){showHistory=!showHistory;draw();};
  }

  function openRollbackConfirm(button){
    var card=document.getElementById('v141-db-update'),prev=previous(),cur=installed();if(!card||!prev)return;
    var old=document.getElementById('v143RollbackConfirm');if(old){old.remove();return;}
    var box=document.createElement('div');box.id='v143RollbackConfirm';box.className='db-rollback-confirm';
    box.innerHTML='<strong>Confirm database rollback</strong><p>This will switch Studio research data from '+clean(cur&&cur.version||'current')+' to '+clean(prev.version)+'. It will not alter TEAM.* or your .CAR career. The current snapshot will be retained in database history.</p><div class="row"><button class="btn btn-danger grow" id="v143RollbackYes">Roll back to '+clean(prev.version)+'</button><button class="btn grow" id="v143RollbackNo">Cancel</button></div>';
    button.insertAdjacentElement('afterend',box);
    document.getElementById('v143RollbackNo').onclick=function(){box.remove();};
    document.getElementById('v143RollbackYes').onclick=function(){button.dataset.v143Confirmed='1';box.remove();button.click();delete button.dataset.v143Confirmed;setTimeout(function(){lastReport=verifySnapshot(installed());draw('Rollback completed. The active database has been re-verified.',lastReport.ok?'good':'error');},50);};
  }

  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#v141Rollback');if(!b||b.dataset.v143Confirmed==='1')return;e.preventDefault();e.stopImmediatePropagation();openRollbackConfirm(b);},true);
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#v141Install');if(!b)return;var before=installed();setTimeout(function(){var after=installed();if(before&&after&&before.version!==after.version)archive(before);lastReport=verifySnapshot(after);draw();},1800);},true);
  window.addEventListener('storage',function(e){if(e.key===INSTALLED_KEY||e.key===PREVIOUS_KEY||e.key===HISTORY_KEY){lastReport=verifySnapshot(installed());draw();}});

  function releaseNotes(){
    if(document.getElementById('v143-release-card'))return;
    var anchor=document.getElementById('v142-release-card')||document.getElementById('v141-release-card');if(!anchor)return;
    var card=document.createElement('div');card.id='v143-release-card';card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.43.0 — Football Database Manager</strong><span class="about">• A dedicated database-management panel now shows installed version, published version, season, compatibility, integrity and live coverage.</span><span class="about">• Verify Installed Database checks manifest identity, season/schema alignment, identity and research totals, published validation, Studio compatibility, integrity state and game-file write locks.</span><span class="about">• Database history retains up to three superseded local snapshots for audit visibility.</span><span class="about">• Rollback now requires confirmation and clearly shows the version being left and the version being restored.</span><span class="about">• TEAM.* writes and real-world injection into existing .CAR careers remain locked.</span>';
    anchor.insertAdjacentElement('beforebegin',card);
  }

  function apply(){document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;releaseNotes();lastReport=verifySnapshot(installed());draw();}
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){try{apply();}finally{queued=false;}});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(function(){if(document.getElementById('v141-db-update')&&!document.getElementById('v143-db-manager'))queue();}).observe(document.body,{childList:true,subtree:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');

fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v143-db-manager-layer')||!html.includes('Verify installed database')||!html.includes('Confirm database rollback')||!html.includes('swos-football-db-history-v1'))throw new Error('SWOS Studio v1.43.0 build failed: database manager layer was not installed.');
console.log('SWOS Studio '+BUILD+' Football Database Manager build complete.');
