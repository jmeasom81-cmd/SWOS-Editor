import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.34.0';
if(!fs.existsSync(FILE)) throw new Error('SWOS Studio v1.34.0 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.33.1</title>')) throw new Error('SWOS Studio v1.34.0 build failed: expected v1.33.1 generated output was not found.');

html=html.replace('<title>SWOS Studio v1.33.1</title>','<title>SWOS Studio v1.34.0</title>');
html=html.replace("const BUILD = 'v1.33.1';","const BUILD = 'v1.34.0';");
html=html.replace("document.title='SWOS Studio v1.33.1';","document.title='SWOS Studio v1.34.0';");
html=html.replace("el.textContent=el.textContent.replace('v1.33.0','v1.33.1')","el.textContent=el.textContent.replace('v1.33.0','v1.34.0')");

const css=`
<style id="swos-v134-world-styles">
  .career-world-card{border:1px solid rgba(88,166,255,.5);background:linear-gradient(180deg,rgba(88,166,255,.09),rgba(9,20,33,.96));border-radius:14px;padding:13px;margin-top:14px;box-shadow:var(--shadow)}
  .career-world-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.career-world-head strong{font-size:15px}.career-world-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}
  .world-safety{border:1px solid rgba(66,209,132,.35);background:rgba(66,209,132,.06);border-radius:10px;padding:9px;margin-top:10px;font-size:9px;color:var(--muted);line-height:1.45}.world-safety strong{color:#8effbc}
  .world-checkpoints{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.world-checkpoint{border:1px solid var(--line);background:#07111f;border-radius:11px;padding:10px}.world-checkpoint strong{display:block;font-size:11px}.world-checkpoint p{font-size:8px;color:var(--muted);line-height:1.4;margin:4px 0 8px}.world-checkpoint .btn{width:100%;min-height:40px;font-size:10px;padding:8px}
  .world-draft{border:1px solid rgba(245,213,71,.35);background:rgba(245,213,71,.05);border-radius:11px;padding:10px;margin-top:10px}.world-draft-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.world-draft-head strong{font-size:11px}.world-moves{display:grid;gap:5px;margin-top:8px;max-height:280px;overflow:auto}.world-move{border-top:1px solid rgba(38,61,92,.7);padding-top:6px;font-size:9px;line-height:1.35}.world-move:first-child{border-top:0;padding-top:0}.world-move b{color:var(--text)}.world-move span{color:var(--muted)}
  .world-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.world-history{font-size:9px;color:var(--muted);margin-top:9px;line-height:1.45}.world-season-missing{border:1px dashed rgba(245,213,71,.55);border-radius:10px;padding:9px;margin-top:10px;color:#ffe978;font-size:9px;line-height:1.4}
  .world-stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}.world-stat{background:#07111f;border:1px solid var(--line);border-radius:9px;padding:8px;text-align:center}.world-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase}.world-stat strong{display:block;margin-top:2px;font-size:15px}
  @media(max-width:520px){.world-checkpoints,.world-actions{grid-template-columns:1fr}.world-stat-row{gap:4px}.world-stat{padding:7px 3px}}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v134-world-layer">
(function(){
  'use strict';
  var VERSION='v1.34.0';
  var STORE_PREFIX='career-world-v1:';

  function clean(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  function norm(v){return String(v||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim();}
  function hash(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(seed){var a=hash(seed)||1;return function(){a+=0x6D2B79F5;var t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
  function shuffle(items,r){var a=items.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var x=a[i];a[i]=a[j];a[j]=x;}return a;}
  function key(){return STORE_PREFIX+String((typeof state!=='undefined'&&state.fileName)||'unknown');}
  function emptyWorld(){return {version:1,draft:null,approved:[]};}
  async function getWorld(){var raw=await appStoreGet(key());var w=raw&&typeof raw==='object'?raw:emptyWorld();return {version:1,draft:w.draft&&Array.isArray(w.draft.moves)?w.draft:null,approved:Array.isArray(w.approved)?w.approved.slice(0,40):[]};}
  async function saveWorld(w){return appStoreSet(key(),{version:1,draft:w.draft||null,approved:(w.approved||[]).slice(0,40)});}
  function clubs(){return (typeof PL_2627_PACK!=='undefined'&&Array.isArray(PL_2627_PACK.clubs))?PL_2627_PACK.clubs:[];}
  function clubById(id){return clubs().find(function(c){return c.id===id;});}
  function userClubId(){
    if(typeof state==='undefined'||!state.career)return '';
    var n=norm(state.career.club);
    var c=clubs().find(function(x){return norm(x.name)===n||(x.aliases||[]).some(function(a){return norm(a)===n;});});
    return c?c.id:'';
  }
  function basePlayers(){
    if(typeof seasonSquadFor!=='function')return [];
    var out=[];clubs().forEach(function(c){(seasonSquadFor(c.id)||[]).forEach(function(p){out.push({id:p.id,name:p.displayName||p.officialName||'Player',baseClubId:c.id});});});return out;
  }
  function ownership(world){
    var own={};basePlayers().forEach(function(p){own[p.id]=p.baseClubId;});
    (world.approved||[]).slice().sort(function(a,b){return Number(a.time||0)-Number(b.time||0);}).forEach(function(batch){(batch.moves||[]).forEach(function(m){if(own[m.playerId])own[m.playerId]=m.toId;});});
    return own;
  }
  function seasonMoved(world,season){var set=new Set();(world.approved||[]).filter(function(x){return x.season===season;}).forEach(function(x){(x.moves||[]).forEach(function(m){set.add(m.playerId);});});return set;}
  function checkpointId(season,type){return String(season||'').trim()+'|'+type;}
  function targetFor(type){return type==='january'?8:16;}
  function labelFor(type){return type==='january'?'January Transfer Window':'Summer / New Season Window';}

  async function generate(type){
    if(typeof state==='undefined'||!state.fileName)return;
    var cp=await getCareerPlus(state.fileName),season=String(cp.seasonLabel||'').trim();
    if(!season){alert('Set and save a Career+ season label first, for example 2026/27 or Season 3.');return;}
    var world=await getWorld(),id=checkpointId(season,type);
    if((world.approved||[]).some(function(x){return x.id===id;})){alert(labelFor(type)+' is already approved for '+season+'.');return;}
    var own=ownership(world),players=basePlayers(),blocked=userClubId(),moved=seasonMoved(world,season),r=rng(String(state.fileName)+'|'+id+'|career-world-v1');
    var counts={};clubs().forEach(function(c){counts[c.id]=0;});Object.keys(own).forEach(function(pid){if(counts[own[pid]]!=null)counts[own[pid]]++;});
    var candidates=shuffle(players.filter(function(p){return own[p.id]&&own[p.id]!==blocked&&!moved.has(p.id);}),r),moves=[],wanted=targetFor(type);
    for(var i=0;i<candidates.length&&moves.length<wanted;i++){
      var p=candidates[i],fromId=own[p.id];
      if((counts[fromId]||0)<=18)continue;
      var dests=clubs().filter(function(c){return c.id!==fromId&&c.id!==blocked&&(counts[c.id]||0)<32;});
      if(!dests.length)continue;
      dests=shuffle(dests,r);
      var to=dests[Math.floor(r()*Math.min(dests.length,8))]||dests[0],from=clubById(fromId);
      if(!from||!to)continue;
      moves.push({playerId:p.id,player:p.name,fromId:fromId,from:from.name,toId:to.id,to:to.name});
      own[p.id]=to.id;counts[fromId]=(counts[fromId]||0)-1;counts[to.id]=(counts[to.id]||0)+1;
    }
    world.draft={id:id,type:type,season:season,label:labelFor(type),created:Date.now(),moves:moves};
    await saveWorld(world);await renderCard(true);
  }

  async function clearDraft(){var w=await getWorld();w.draft=null;await saveWorld(w);await renderCard(true);}

  async function approveDraft(){
    if(typeof state==='undefined'||!state.fileName)return;
    var world=await getWorld(),d=world.draft;if(!d||!Array.isArray(d.moves)||!d.moves.length)return;
    if((world.approved||[]).some(function(x){return x.id===d.id;})){world.draft=null;await saveWorld(world);await renderCard(true);return;}
    var now=Date.now(),cp=await getCareerPlus(state.fileName);cp.transfer=cp.transfer||defaultTransferCentre();cp.transfer.worldMoves=Array.isArray(cp.transfer.worldMoves)?cp.transfer.worldMoves:[];
    var news=d.moves.map(function(m,i){return {id:'world-'+hash(d.id+'|'+m.playerId).toString(36),time:now+i,player:m.player,from:m.from,to:m.to,fee:0,note:'Career World · '+d.label+' · simulated AI transfer'};});
    cp.transfer.worldMoves=news.concat(cp.transfer.worldMoves).slice(0,150);
    cp.timeline=Array.isArray(cp.timeline)?cp.timeline:[];
    cp.timeline.unshift({id:'world-window-'+hash(d.id).toString(36),type:'note',time:now,seasonLabel:d.season,title:'Career World · '+d.label,note:d.moves.length+' simulated AI transfers approved and published to World Transfer News. Companion-only: no SWOS career-file players were moved.'});
    await setCareerPlus(state.fileName,cp);
    world.approved.unshift({id:d.id,type:d.type,season:d.season,label:d.label,time:now,moves:d.moves});world.draft=null;await saveWorld(world);
    await renderCard(true);
  }

  function statusFor(world,season,type){var id=checkpointId(season,type);return (world.approved||[]).find(function(x){return x.id===id;});}
  function movesHtml(moves){return (moves||[]).map(function(m){return '<div class="world-move"><b>'+clean(m.player)+'</b><br><span>'+clean(m.from)+' → '+clean(m.to)+'</span></div>';}).join('');}

  async function renderCard(force){
    if(typeof state==='undefined'||!state.career||!state.fileName)return;
    var h1=Array.from(document.querySelectorAll('h1')).find(function(h){return /Career\+ Hub|Transfer Centre/i.test(h.textContent||'');});
    if(!h1){var old=document.getElementById('v134-career-world');if(old)old.remove();return;}
    var cp=await getCareerPlus(state.fileName),season=String(cp.seasonLabel||'').trim(),world=await getWorld(),jan=season?statusFor(world,season,'january'):null,sum=season?statusFor(world,season,'summer'):null,d=world.draft;
    var signature=[state.fileName,season,jan&&jan.time,sum&&sum.time,d&&d.id,d&&d.created,(world.approved||[]).length].join('|');
    var card=document.getElementById('v134-career-world');if(card&&!force&&card.dataset.signature===signature)return;
    if(!card){card=document.createElement('section');card.id='v134-career-world';card.className='career-world-card';var anchor=h1.nextElementSibling; if(anchor)anchor.insertAdjacentElement('beforebegin',card); else h1.insertAdjacentElement('afterend',card);}
    card.dataset.signature=signature;
    var scope=clubs().length+' Premier League clubs · companion simulation';
    card.innerHTML='<div class="career-world-head"><div><strong>🌍 Career World</strong><p>'+clean(scope)+'. Two controlled transfer checkpoints per season.</p></div><span class="feature-status beta">Beta</span></div>'+
      '<div class="world-safety"><strong>Safe by design:</strong> this engine creates a fictional Career+ world and publishes approved moves to World Transfer News. It does not alter player records inside your .CAR file.</div>'+
      (season?'':'<div class="world-season-missing">Set a <b>Season label</b> in Career+ Season setup first. That gives January and Summer their own permanent checkpoint for each season.</div>')+
      '<div class="world-stat-row"><div class="world-stat"><small>Season</small><strong>'+clean(season||'—')+'</strong></div><div class="world-stat"><small>Windows approved</small><strong>'+((jan?1:0)+(sum?1:0))+'/2</strong></div><div class="world-stat"><small>Career World history</small><strong>'+world.approved.length+'</strong></div></div>'+
      '<div class="world-checkpoints">'+
        '<div class="world-checkpoint"><strong>January</strong><p>Smaller mid-season AI transfer window. Once approved, the same season/window cannot be generated twice.</p><button class="btn btn-blue" id="worldJan" '+(!season||jan?'disabled':'')+'>'+(jan?'✓ January approved':'Generate January preview')+'</button></div>'+
        '<div class="world-checkpoint"><strong>Summer / New Season</strong><p>Larger end-of-season world update. This is separate from the real-world master database update.</p><button class="btn btn-blue" id="worldSummer" '+(!season||sum?'disabled':'')+'>'+(sum?'✓ Summer approved':'Generate Summer preview')+'</button></div>'+
      '</div>'+
      (d?'<div class="world-draft"><div class="world-draft-head"><strong>'+clean(d.label)+' preview · '+d.moves.length+' moves</strong><span class="feature-status beta">Review first</span></div><div class="world-moves">'+movesHtml(d.moves)+'</div><div class="world-actions"><button class="btn btn-green" id="worldApprove">Approve & publish</button><button class="btn" id="worldClear">Discard preview</button></div></div>':'')+
      '<div class="world-history">Generation is deterministic for a career + season + window, so discarding and regenerating does not produce a different lucky draw. Approved ownership is carried forward into later Career World checkpoints. Your managed club is excluded whenever it can be matched to the maintained club database.</div>';
    var j=document.getElementById('worldJan'),s=document.getElementById('worldSummer'),a=document.getElementById('worldApprove'),x=document.getElementById('worldClear');
    if(j)j.onclick=function(){generate('january');};if(s)s.onclick=function(){generate('summer');};if(a)a.onclick=approveDraft;if(x)x.onclick=clearDraft;
  }

  function updateRoadmap(){
    Array.from(document.querySelectorAll('.future-card')).forEach(function(card){var s=card.querySelector('strong'),p=card.querySelector('p'),b=card.querySelector('.feature-status');if(!s)return;
      if(/Career World$/i.test((s.textContent||'').trim())){if(b){b.className='feature-status beta';b.textContent='Beta';}if(p)p.textContent='Companion engine now live: deterministic AI transfer previews, review/approval and permanent Career+ World Transfer News. .CAR movement remains under construction.';}
      if(/January \+ Summer World Updates/i.test(s.textContent||'')){if(b){b.className='feature-status beta';b.textContent='Beta';}if(p)p.textContent='Two controlled Career World checkpoints are now live as companion simulations. Player-value evolution and verified .CAR application come later.';}
    });
  }

  function releaseNote(){if(document.getElementById('v134-release-card'))return;var anchor=document.getElementById('v1331-release-card')||document.getElementById('v133-release-card');if(!anchor)return;var c=document.createElement('div');c.id='v134-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in v1.34.0 — Career World foundation</strong><span class="about">• Added two controlled fictional-world checkpoints: January and Summer / New Season.</span><span class="about">• Transfer previews are deterministic, reviewable and only become permanent after approval.</span><span class="about">• Approved moves feed the existing Career+ World Transfer News and timeline instead of creating a second history system.</span><span class="about">• Simulated ownership carries forward into later checkpoints and duplicate same-season player moves are blocked.</span><span class="about">• The managed club is protected where it matches the maintained database. No .CAR player records are changed in this build.</span>';anchor.insertAdjacentElement('beforebegin',c);}

  async function apply(){
    document.title='SWOS Studio '+VERSION;document.querySelectorAll('.eyebrow').forEach(function(el){if(/v1\.33\.1/.test(el.textContent||''))el.textContent=el.textContent.replace('v1.33.1',VERSION);});
    updateRoadmap();releaseNote();await renderCard(false);
  }
  var busy=false;function queue(){if(busy)return;busy=true;requestAnimationFrame(function(){Promise.resolve(apply()).catch(function(e){console.warn('Career World layer',e);}).finally(function(){busy=false;});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');
fs.writeFileSync(FILE,html,'utf8');
console.log('Built SWOS Studio '+BUILD+' Career World foundation.');
