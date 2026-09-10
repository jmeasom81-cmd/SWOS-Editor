import fs from 'node:fs';

const FILE='dist/index.html';
const COVERAGE_FILE='football-db/coverage.json';
const BUILD='v1.45.0';
if(!fs.existsSync(FILE))throw new Error('SWOS Studio v1.45.0 build failed: dist/index.html is missing.');
if(!fs.existsSync(COVERAGE_FILE))throw new Error('SWOS Studio v1.45.0 build failed: football-db/coverage.json is missing.');
let html=fs.readFileSync(FILE,'utf8');
const coverage=JSON.parse(fs.readFileSync(COVERAGE_FILE,'utf8'));
if(coverage?.summary?.totalClubs!==92)throw new Error(`SWOS Studio v1.45.0 build failed: expected 92-club coverage, found ${coverage?.summary?.totalClubs||0}.`);
if(!html.includes('<title>SWOS Studio v1.44.0</title>'))throw new Error('SWOS Studio v1.45.0 build failed: expected v1.44.0 output was not found.');
html=html.replace('<title>SWOS Studio v1.44.0</title>','<title>SWOS Studio v1.45.0</title>');
html=html.replaceAll("var BUILD='v1.44.0';","var BUILD='v1.45.0';");

const css=String.raw`
<style id="swos-v145-workbench-styles">
  .research-workbench{border:1px solid rgba(182,118,255,.46);background:linear-gradient(180deg,rgba(182,118,255,.065),rgba(7,17,31,.985));border-radius:14px;padding:14px;margin:14px 0;box-shadow:var(--shadow)}
  .workbench-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.workbench-head strong{font-size:15px}.workbench-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}
  .workbench-mode{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:11px}.workbench-mode button{border:1px solid var(--line);background:#07111f;color:var(--muted);border-radius:9px;min-height:40px;padding:7px;font-size:8px;font-weight:900}.workbench-mode button.active{border-color:rgba(182,118,255,.75);color:#caa7ff;background:rgba(182,118,255,.08)}
  .workbench-grid{display:grid;grid-template-columns:minmax(250px,.9fr) minmax(0,1.35fr);gap:10px;margin-top:10px}.workbench-pane{border:1px solid var(--line);background:#07111f;border-radius:11px;padding:10px;min-width:0}.workbench-pane-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.workbench-pane-head strong{font-size:11px}.workbench-pane-head span{color:var(--muted);font-size:7px}
  .workbench-queue{display:grid;gap:6px;margin-top:8px}.workbench-task{width:100%;text-align:left;border:1px solid var(--line);background:#0a1625;color:var(--text);border-radius:9px;padding:8px;cursor:pointer}.workbench-task:hover,.workbench-task.active{border-color:rgba(182,118,255,.7);background:rgba(182,118,255,.07)}.workbench-task-top{display:flex;align-items:center;justify-content:space-between;gap:6px}.workbench-task b{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.workbench-task-num{font-size:7px;color:#caa7ff;font-weight:1000}.workbench-task span{display:block;color:var(--muted);font-size:7px;margin-top:3px;line-height:1.35}.workbench-task .local-reviewed{color:var(--green);font-weight:900}
  .workbench-empty{font-size:8px;color:var(--muted);line-height:1.5;padding:8px 0}.workbench-club-title{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.workbench-club-title h3{font-size:14px;margin:0}.workbench-club-title p{font-size:8px;color:var(--muted);margin:3px 0 0}.workbench-priority{border:1px solid rgba(182,118,255,.5);color:#caa7ff;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:1000;white-space:nowrap}
  .workbench-stage-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:9px}.workbench-stage{border:1px solid rgba(38,61,92,.75);border-radius:8px;padding:7px}.workbench-stage small{display:block;color:var(--muted);font-size:6px;text-transform:uppercase;letter-spacing:.05em}.workbench-stage b{display:block;font-size:9px;margin-top:2px}.workbench-stage.ready{border-color:rgba(66,209,132,.4)}.workbench-stage.ready b{color:var(--green)}.workbench-stage.current{border-color:rgba(182,118,255,.55);background:rgba(182,118,255,.05)}.workbench-stage.current b{color:#caa7ff}.workbench-stage.locked b{color:var(--yellow)}
  .workbench-brief{border:1px solid rgba(88,166,255,.35);background:rgba(88,166,255,.045);border-radius:9px;padding:9px;margin-top:8px}.workbench-brief strong{font-size:9px;color:var(--blue)}.workbench-brief ul{margin:6px 0 0;padding-left:17px}.workbench-brief li{font-size:8px;color:var(--muted);line-height:1.45;margin:3px 0}.workbench-notes{width:100%;min-height:75px;resize:vertical;border:1px solid var(--line);background:#050d18;color:var(--text);border-radius:9px;padding:9px;font:inherit;font-size:8px;line-height:1.45;margin-top:8px;outline:none}.workbench-notes:focus{border-color:rgba(182,118,255,.7)}
  .workbench-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:8px}.workbench-actions .btn{min-height:40px;font-size:8px;padding:7px}.workbench-local-note{font-size:7px;color:var(--muted);line-height:1.4;margin-top:7px}.workbench-local-note b{color:#caa7ff}.workbench-export-status{font-size:8px;color:var(--green);min-height:12px;margin-top:6px}
  .workbench-footer{font-size:8px;color:var(--muted);line-height:1.45;margin-top:10px}.workbench-footer b{color:var(--green)}
  @media(max-width:760px){.workbench-grid{grid-template-columns:1fr}.workbench-mode{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:480px){.workbench-stage-grid,.workbench-actions{grid-template-columns:1fr}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const embedded=JSON.stringify(coverage).replace(/</g,'\\u003c');
const js=String.raw`
<script id="swos-v145-workbench-layer">
(function(){
  'use strict';
  var BUILD='v1.45.0';
  var COVERAGE=${embedded};
  var INSTALLED_KEY='swos-football-db-installed-v1';
  var NOTES_KEY='swos-research-workbench-notes-v1';
  var REVIEWED_KEY='swos-research-workbench-reviewed-v1';
  var mode='next',selectedId=null,statusMessage='';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function read(key,fallback){try{var v=JSON.parse(localStorage.getItem(key)||'null');return v==null?fallback:v;}catch(e){return fallback;}}
  function write(key,v){try{localStorage.setItem(key,JSON.stringify(v));return true;}catch(e){return false;}}
  function installed(){return read(INSTALLED_KEY,null);}
  function researchCount(packs,id){var c=packs&&packs.clubs&&packs.clubs[id];return c?Object.keys(c.players||{}).length:0;}
  function liveClubs(){
    var s=installed();
    if(!s||s.season!==COVERAGE.season||!s.identities||!s.researchPacks)return COVERAGE.clubs.map(function(c){return JSON.parse(JSON.stringify(c));});
    return COVERAGE.clubs.map(function(c){var x=JSON.parse(JSON.stringify(c)),ids=Array.isArray(s.identities.clubs&&s.identities.clubs[c.id])?s.identities.clubs[c.id].length:0,p=researchCount(s.researchPacks,c.id),r=p===16;x.stages.identity={status:ids>0?'ready':'pending',players:ids};x.stages.researchPack={status:r?'ready':p>0?'attention':'pending',players:p};x.stages.swos16={status:r?'builder-ready':'blocked',players:r?16:0};x.stages.installer={status:s.manifest&&s.manifest.installation&&s.manifest.installation.teamWriteReady===true?'review-required':'locked'};x.nextStep=ids===0?'Verify current squad identity':!r?'Build 16-player research pack':'Research manager, formation and kits';return x;});
  }
  function missingPresentation(c){return c.stages.manager.status!=='ready'||c.stages.formation.status!=='ready'||c.stages.kits.status!=='ready';}
  function taskType(c){
    if(c.stages.identity.status==='ready'&&c.stages.researchPack.status!=='ready')return 'research';
    if(c.stages.researchPack.status==='ready'&&missingPresentation(c))return 'presentation';
    if(c.stages.identity.status!=='ready')return 'identity';
    return 'review';
  }
  function label(t){return t==='research'?'Build research pack':t==='presentation'?'Research presentation data':t==='identity'?'Verify club identity':'Review club';}
  function modeMatch(c){var t=taskType(c);if(mode==='next')return t!=='review';if(mode==='identity')return t==='identity';if(mode==='research')return t==='research';if(mode==='presentation')return t==='presentation';return true;}
  function priority(c){var t=taskType(c);if(mode==='next'){if(t==='research')return 0;if(t==='presentation')return 1;if(t==='identity')return 2;return 9;}return 0;}
  function queue(){return liveClubs().filter(modeMatch).sort(function(a,b){var p=priority(a)-priority(b);if(p)return p;if(a.division!==b.division)return a.division-b.division;return a.name.localeCompare(b.name);}).slice(0,10);}
  function notes(){return read(NOTES_KEY,{});}
  function reviewed(){return read(REVIEWED_KEY,{});}
  function stageState(s,type){if(!s)return 'Pending';if(s.status==='ready')return type==='identity'?((s.players||0)+' verified players'):type==='research'?((s.players||0)+' researched players'):'Ready';if(s.status==='builder-ready')return 'Builder ready';if(s.status==='attention')return (s.players||0)+' players · incomplete';if(s.status==='locked')return 'Locked';if(s.status==='blocked')return 'Blocked';return 'Pending';}
  function stageClass(s,isCurrent){if(isCurrent)return 'current';if(s&&(['ready','builder-ready'].includes(s.status)))return 'ready';if(s&&s.status==='locked')return 'locked';return '';}
  function taskBrief(c){var t=taskType(c),items=[];
    if(t==='identity')items=['Confirm the current senior squad against authoritative club/league sources.','Create stable player identities and retain unknown shirt numbers as blank rather than guessing.','Record evidence/provenance so later research packs can be audited.'];
    else if(t==='research')items=['Build exactly 16 evidence-backed players for the SWOS 16 Builder.','Verify detailed position, age/identity, current market-value evidence and relevant performance evidence.','Keep current-club 2025/26 output blank for summer arrivals where they did not play for the current club.'];
    else if(t==='presentation')items=['Research current manager and preferred formation from reliable current sources.','Research current home/away kit presentation without enabling binary writes.','Review the existing 16-player pack before any future installer-readiness decision.'];
    else items=['Review all published data stages and evidence before moving the club forward.'];
    return items;
  }
  function taskText(c){var t=taskType(c),s=c.stages;return ['SWOS Studio research task',c.name+' — '+c.divisionName,'Season: '+COVERAGE.season,'Task: '+label(t),'Identity: '+stageState(s.identity,'identity'),'Research pack: '+stageState(s.researchPack,'research'),'SWOS 16: '+stageState(s.swos16,'swos16'),'Manager: '+stageState(s.manager),'Formation: '+stageState(s.formation),'Kits: '+stageState(s.kits),'Installer: '+stageState(s.installer),'',...taskBrief(c).map(function(x,i){return (i+1)+'. '+x;}),'','Safety: This task is research/planning only. Do not write TEAM.* or modify an established .CAR career.'].join('\n');}
  async function copyText(text){if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return true;}var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');ta.remove();return ok;}
  function exportQueue(rows){var payload={schemaVersion:1,studioVersion:BUILD,season:COVERAGE.season,databaseVersion:COVERAGE.databaseVersion,generatedAt:new Date().toISOString(),mode:mode,tasks:rows.map(function(c,i){return {priority:i+1,clubId:c.id,club:c.name,division:c.divisionName,task:label(taskType(c)),stages:c.stages,nextStep:c.nextStep,brief:taskBrief(c)};}),safety:{teamWrites:false,careerWrites:false,note:'Research workbench export only; no game files are modified.'}};var blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='swos-research-queue-'+COVERAGE.season.replace('/','-')+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);}
  function queueButton(c,i,rev){var active=c.id===selectedId?' active':'',done=rev[c.id]&&rev[c.id][taskType(c)];return '<button class="workbench-task'+active+'" data-workbench-club="'+esc(c.id)+'"><div class="workbench-task-top"><b>'+esc(c.name)+'</b><span class="workbench-task-num">#'+(i+1)+'</span></div><span>'+esc(c.divisionName)+' · '+esc(label(taskType(c)))+'</span>'+(done?'<span class="local-reviewed">✓ Locally reviewed — authoritative status unchanged</span>':'')+'</button>';}
  function detail(c,n,rev){var t=taskType(c),s=c.stages,current={identity:t==='identity',research:t==='research',presentation:t==='presentation'};var brief=taskBrief(c).map(function(x){return '<li>'+esc(x)+'</li>';}).join('');var isReviewed=!!(rev[c.id]&&rev[c.id][t]);
    return '<div class="workbench-club-title"><div><h3>'+esc(c.name)+'</h3><p>'+esc(c.divisionName)+' · '+esc(COVERAGE.season)+'</p></div><span class="workbench-priority">'+esc(label(t))+'</span></div>'+
    '<div class="workbench-stage-grid">'+
      '<div class="workbench-stage '+stageClass(s.identity,current.identity)+'"><small>Identity</small><b>'+esc(stageState(s.identity,'identity'))+'</b></div>'+
      '<div class="workbench-stage '+stageClass(s.researchPack,current.research)+'"><small>Research pack</small><b>'+esc(stageState(s.researchPack,'research'))+'</b></div>'+
      '<div class="workbench-stage '+stageClass(s.swos16,false)+'"><small>SWOS 16</small><b>'+esc(stageState(s.swos16,'swos16'))+'</b></div>'+
      '<div class="workbench-stage '+stageClass(s.manager,current.presentation)+'"><small>Manager</small><b>'+esc(stageState(s.manager))+'</b></div>'+
      '<div class="workbench-stage '+stageClass(s.formation,current.presentation)+'"><small>Formation</small><b>'+esc(stageState(s.formation))+'</b></div>'+
      '<div class="workbench-stage '+stageClass(s.kits,current.presentation)+'"><small>Kits</small><b>'+esc(stageState(s.kits))+'</b></div>'+
      '<div class="workbench-stage '+stageClass(s.installer,false)+'"><small>Installer</small><b>'+esc(stageState(s.installer))+'</b></div>'+
      '<div class="workbench-stage"><small>Authoritative next step</small><b>'+esc(c.nextStep)+'</b></div>'+
    '</div><div class="workbench-brief"><strong>Research brief</strong><ul>'+brief+'</ul></div>'+
    '<textarea class="workbench-notes" id="v145Notes" placeholder="Local working notes for '+esc(c.name)+'…">'+esc(n[c.id]||'')+'</textarea>'+
    '<div class="workbench-actions"><button class="btn btn-blue" id="v145Copy">Copy task brief</button><button class="btn '+(isReviewed?'btn-green':'')+'" id="v145Reviewed">'+(isReviewed?'Reviewed locally ✓':'Mark locally reviewed')+'</button><button class="btn" id="v145ClearNote">Clear note</button></div>'+
    '<div class="workbench-local-note"><b>Local workflow only:</b> notes and “reviewed” flags stay on this device and never change the published football database or claim that a source stage is complete.</div>';
  }
  function modeButtons(){return [['next','Next safest work'],['research','Research packs'],['presentation','Manager / kits / shape'],['identity','Identity sweep']].map(function(x){return '<button data-workbench-mode="'+x[0]+'" class="'+(mode===x[0]?'active':'')+'">'+x[1]+'</button>';}).join('');}
  function draw(){var anchor=document.getElementById('v144-coverage-centre')||document.getElementById('v143-db-manager');if(!anchor)return;var rows=queue(),n=notes(),rev=reviewed();if(!selectedId||!rows.some(function(c){return c.id===selectedId;}))selectedId=rows[0]&&rows[0].id||null;var selected=rows.find(function(c){return c.id===selectedId;})||rows[0];var card=document.getElementById('v145-workbench');if(!card){card=document.createElement('section');card.id='v145-workbench';card.className='research-workbench';anchor.insertAdjacentElement('afterend',card);}
    card.innerHTML='<div class="workbench-head"><div><strong>🧪 Research Workbench</strong><p>Turn the 92-club coverage map into an ordered, repeatable production queue. The queue is calculated from real database stages — it never promotes a club because someone ticked a local box.</p></div><span class="feature-status beta">BETA</span></div><div class="workbench-mode">'+modeButtons()+'</div><div class="workbench-grid"><div class="workbench-pane"><div class="workbench-pane-head"><strong>Next '+rows.length+' tasks</strong><span>Deterministic queue</span></div><div class="workbench-queue">'+(rows.length?rows.map(function(c,i){return queueButton(c,i,rev);}).join(''):'<div class="workbench-empty">Nothing is currently waiting in this queue mode.</div>')+'</div><button class="btn" id="v145Export" style="width:100%;margin-top:8px" '+(rows.length?'':'disabled')+'>Export this queue as JSON</button><div class="workbench-export-status">'+esc(statusMessage)+'</div></div><div class="workbench-pane">'+(selected?detail(selected,n,rev):'<div class="workbench-empty">Choose another queue mode to continue.</div>')+'</div></div><div class="workbench-footer"><b>Priority logic:</b> “Next safest work” first advances clubs that already have verified identities into full research packs, then fills manager/formation/kit evidence for research-ready clubs, then moves on to identity gaps by division and club name. Nothing here enables binary installation.</div>';
    card.querySelectorAll('[data-workbench-mode]').forEach(function(b){b.onclick=function(){mode=this.getAttribute('data-workbench-mode')||'next';selectedId=null;statusMessage='';draw();};});card.querySelectorAll('[data-workbench-club]').forEach(function(b){b.onclick=function(){selectedId=this.getAttribute('data-workbench-club');statusMessage='';draw();};});
    var ta=document.getElementById('v145Notes');if(ta&&selected){ta.oninput=function(){var all=notes();all[selected.id]=this.value;write(NOTES_KEY,all);};}
    var cp=document.getElementById('v145Copy');if(cp&&selected)cp.onclick=async function(){try{await copyText(taskText(selected));statusMessage='Task brief copied.';}catch(e){statusMessage='Could not copy the task brief on this browser.';}draw();};
    var rv=document.getElementById('v145Reviewed');if(rv&&selected)rv.onclick=function(){var all=reviewed(),t=taskType(selected);all[selected.id]=all[selected.id]||{};all[selected.id][t]=!all[selected.id][t];write(REVIEWED_KEY,all);statusMessage=all[selected.id][t]?'Marked locally reviewed. Published readiness is unchanged.':'Local review marker removed.';draw();};
    var clr=document.getElementById('v145ClearNote');if(clr&&selected)clr.onclick=function(){var all=notes();delete all[selected.id];write(NOTES_KEY,all);statusMessage='Local note cleared.';draw();};
    var ex=document.getElementById('v145Export');if(ex)ex.onclick=function(){exportQueue(rows);statusMessage='Queue JSON exported. No game or database files were changed.';draw();};
  }
  function releaseNotes(){if(document.getElementById('v145-release-card'))return;var anchor=document.getElementById('v144-release-card')||document.getElementById('v143-release-card');if(!anchor)return;var card=document.createElement('div');card.id='v145-release-card';card.className='card stack v133-release-card';card.innerHTML='<strong>New in v1.45.0 — Research Workbench</strong><span class="about">• The 92-club coverage map now drives a deterministic “next work” queue instead of leaving database progress as a passive dashboard.</span><span class="about">• Queue modes separate research-pack work, manager/formation/kit evidence and identity verification.</span><span class="about">• Each club gets a stage-aware research brief, current evidence counts and its authoritative next safe step.</span><span class="about">• Local notes and review markers help manage research without ever changing published readiness.</span><span class="about">• The current queue can be exported as structured JSON for audit/research work. TEAM.* and .CAR writes remain locked.</span>';anchor.insertAdjacentElement('beforebegin',card);}
  function apply(){document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;releaseNotes();draw();}
  var queued=false;function queueDraw(){if(queued)return;queued=true;requestAnimationFrame(function(){try{apply();}finally{queued=false;}});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queueDraw,{once:true});else queueDraw();new MutationObserver(function(){if((document.getElementById('v144-coverage-centre')||document.getElementById('v143-db-manager'))&&!document.getElementById('v145-workbench'))queueDraw();}).observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',function(e){if([INSTALLED_KEY,NOTES_KEY,REVIEWED_KEY].includes(e.key)&&document.getElementById('v145-workbench'))draw();});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('swos-v145-workbench-layer')||!html.includes('Research Workbench')||!html.includes('Next safest work')||!html.includes('Export this queue as JSON')||!html.includes('authoritative status unchanged'))throw new Error('SWOS Studio v1.45.0 build failed: Research Workbench was not installed.');
console.log(`SWOS Studio ${BUILD} Research Workbench build complete · ${coverage.summary.totalClubs} clubs available to the queue.`);
