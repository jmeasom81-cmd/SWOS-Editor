import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.37.0';
if(!fs.existsSync(FILE)) throw new Error('SWOS Studio v1.37.0 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.36.1</title>')) throw new Error('SWOS Studio v1.37.0 build failed: expected v1.36.1 output was not found.');

html=html.replace('<title>SWOS Studio v1.36.1</title>','<title>SWOS Studio v1.37.0</title>');
html=html.replaceAll("var BUILD='v1.36.1';","var BUILD='v1.37.0';");

const oldLookup='  function researchPackFor(clubId){return PL_2627_RESEARCH_PACKS[clubId]||null}';
if(!html.includes(oldLookup)) throw new Error('SWOS Studio v1.37.0 build failed: embedded research-pack lookup marker was not found.');
const newLookup=`  const PUBLISHED_RESEARCH_PACK_URL="football-db/research-packs.json";
  let publishedResearchPackFeed=null;
  let publishedResearchPackStatus={source:"embedded",checkedAt:null,error:null,version:null};
  function normalizePublishedResearchPack(raw,feed){
    if(!raw||typeof raw!=="object"||!raw.clubId||!raw.players||typeof raw.players!=="object")return null;
    const data={};
    for(const [name,row] of Object.entries(raw.players)){
      if(!name||!row||typeof row!=="object")continue;
      const out={...row};
      if(Number.isInteger(out.position)&&out.position>=0&&out.position<=7){}else delete out.position;
      for(const key of ["age","marketValueM","minutes","goals","assists"]){if(out[key]!=null&&!Number.isFinite(Number(out[key])))delete out[key]}
      data[name]=out
    }
    return{clubId:raw.clubId,label:raw.label||raw.clubId,players:Object.keys(data).length,kind:raw.kind||"Published research pack",source:raw.source||"SWOS Studio Football Database",snapshot:feed?.snapshot||null,data}
  }
  function researchPackFor(clubId){
    const remote=normalizePublishedResearchPack(publishedResearchPackFeed?.clubs?.[clubId],publishedResearchPackFeed);
    return remote||PL_2627_RESEARCH_PACKS[clubId]||null
  }`;
html=html.replace(oldLookup,newLookup);

const loaderStart=html.indexOf('  async function loadResearchPack(clubId){');
const loaderEnd=html.indexOf('\n\n  const ARSENAL_PILOT_META=',loaderStart);
if(loaderStart<0||loaderEnd<0) throw new Error('SWOS Studio v1.37.0 build failed: research-pack loader block was not found.');
const loader=`  async function loadPublishedResearchPackFeed(force=false){
    if(publishedResearchPackFeed&&!force)return publishedResearchPackFeed;
    try{
      const url=PUBLISHED_RESEARCH_PACK_URL+(force?('?t='+Date.now()):'');
      const response=await fetch(url,{cache:"no-store"});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const feed=await response.json();
      if(!feed||feed.schemaVersion!==1||feed.season!=="2026/27"||!feed.clubs||typeof feed.clubs!=="object")throw new Error("Invalid research-pack feed");
      const clubs=Object.values(feed.clubs),count=clubs.reduce((n,c)=>n+Object.keys(c?.players||{}).length,0);
      if(!clubs.length||!count)throw new Error("Published research-pack feed is empty");
      publishedResearchPackFeed=feed;
      publishedResearchPackStatus={source:"published",checkedAt:new Date().toISOString(),error:null,version:feed.snapshot||null,clubs:clubs.length,players:count};
      window.dispatchEvent(new CustomEvent("swos:research-pack-source",{detail:publishedResearchPackStatus}));
      return feed
    }catch(e){
      publishedResearchPackStatus={source:"embedded",checkedAt:new Date().toISOString(),error:String(e?.message||e),version:null,clubs:Object.keys(PL_2627_RESEARCH_PACKS).length,players:Object.values(PL_2627_RESEARCH_PACKS).reduce((n,p)=>n+Object.keys(p.data||{}).length,0)};
      window.dispatchEvent(new CustomEvent("swos:research-pack-source",{detail:publishedResearchPackStatus}));
      return null
    }
  }
  async function resolvedResearchPackFor(clubId,force=false){
    await loadPublishedResearchPackFeed(force);
    return researchPackFor(clubId)
  }
  async function loadResearchPack(clubId){
    const pack=await resolvedResearchPackFor(clubId);if(!pack)return 0;
    await loadSeasonIdentityOverrides();await loadSwosPositionState();await loadSwosRatingState();await loadSwosEvidenceState();await loadSwos16Selections();
    let loaded=0;
    for(const [name,raw] of Object.entries(pack.data||{})){
      const p=findModernCandidateByFootballName(clubId,name);
      if(!p)continue;
      const hasMinutes=Number.isFinite(Number(raw.minutes));
      const importance=hasMinutes?Math.max(0,Math.min(100,Math.round(Number(raw.minutes)/3420*100))):null;
      const evidence={
        age:raw.age??null,importance,marketValueM:raw.marketValueM??null,
        minutes:raw.minutes??null,goals:raw.goals??null,assists:raw.assists??null,
        pace:null,passing:null,shooting:null,aerial:null,defending:null,control:null,finishing:null,
        source:pack.source,snapshot:pack.snapshot,
        tier:inferTierFromEvidence({marketValueM:raw.marketValueM,importance}),
        ageBand:ageBandFromAge(raw.age)
      };
      swosEvidenceState.values[p.candidateId]=evidence;
      if(Number.isInteger(raw.position))swosPositionState.values[p.candidateId]=raw.position;
      swosRatingState.values[p.candidateId]=profileFromEvidence(p,evidence);
      loaded++
    }
    swos16State.selections[clubId]=bestSwos16CandidateIds(clubId);
    await saveSwosEvidenceState();await saveSwosPositionState();await saveSwosRatingState();await saveSwos16Selections();
    return loaded
  }
  async function loadAllResearchPacks(){
    const feed=await loadPublishedResearchPackFeed(false);
    const clubIds=feed?Object.keys(feed.clubs||{}):Object.keys(PL_2627_RESEARCH_PACKS);
    const result={};
    for(const clubId of clubIds)result[clubId]=await loadResearchPack(clubId);
    return result
  }`;
html=html.slice(0,loaderStart)+loader+html.slice(loaderEnd);

const css=`
<style id="swos-v137-feed-styles">
  .feed-source-line{display:flex;align-items:center;justify-content:space-between;gap:9px;border:1px solid var(--line);background:#07111f;border-radius:9px;padding:8px 9px;margin-top:9px;font-size:8px}.feed-source-line span{color:var(--muted)}.feed-source-line b{font-size:8px;text-align:right}.feed-source-line .published{color:var(--green)}.feed-source-line .fallback{color:var(--yellow)}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v137-feed-status-layer">
(function(){
  'use strict';
  var BUILD='v1.37.0';
  function sourceLine(detail){
    var card=document.getElementById('v1361-published-packs');if(!card)return;
    var line=document.getElementById('v137-feed-source');if(!line){line=document.createElement('div');line.id='v137-feed-source';line.className='feed-source-line';var head=card.querySelector('.published-packs-head');if(head)head.insertAdjacentElement('afterend',line);else card.prepend(line);}
    var published=detail&&detail.source==='published';
    line.innerHTML='<span>Research Pack loader</span><b class="'+(published?'published':'fallback')+'">'+(published?'Independent football-data feed ✓':'Embedded safety fallback')+'</b>';
  }
  window.addEventListener('swos:research-pack-source',function(e){sourceLine(e.detail||{});});
  function releaseNotes(){
    if(document.getElementById('v137-release-card'))return;
    var anchor=document.getElementById('v1361-release-card')||document.getElementById('v136-release-card');if(!anchor)return;
    var card=document.createElement('div');card.id='v137-release-card';card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.37.0 — Live Research Pack feed</strong><span class="about">• The existing Research Pack loader now checks the separately published football-data feed before using embedded data.</span><span class="about">• Published pack values, positions and evidence can therefore change independently of the Studio software build.</span><span class="about">• Feed data is validated before it is accepted; invalid or unreachable data falls back to the proven embedded packs.</span><span class="about">• Load all available research packs now follows the published club list when the feed is healthy.</span><span class="about">• The UI shows whether the loader is using the independent feed or its embedded safety fallback.</span><span class="about">• No TEAM.* or .CAR write routines are enabled by this change.</span>';
    anchor.insertAdjacentElement('beforebegin',card);
  }
  async function probe(){
    try{if(typeof loadPublishedResearchPackFeed==='function'){await loadPublishedResearchPackFeed(false);sourceLine(typeof publishedResearchPackStatus==='object'?publishedResearchPackStatus:{source:'published'});}}
    catch(e){sourceLine({source:'embedded'});}
  }
  function apply(){document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;releaseNotes();probe();}
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){Promise.resolve(apply()).finally(function(){queued=false;});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');

fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('loadPublishedResearchPackFeed')||!html.includes('Independent football-data feed'))throw new Error('SWOS Studio v1.37.0 build failed: live feed loader was not installed.');
if((html.match(/async function loadResearchPack\(clubId\)/g)||[]).length!==1)throw new Error('SWOS Studio v1.37.0 build failed: expected exactly one research-pack loader.');
console.log('SWOS Studio '+BUILD+' live research-pack feed build complete.');
