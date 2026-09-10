import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.39.0';
if(!fs.existsSync(FILE)) throw new Error('SWOS Studio v1.39.0 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.38.0</title>')) throw new Error('SWOS Studio v1.39.0 build failed: expected v1.38.0 output was not found.');
html=html.replace('<title>SWOS Studio v1.38.0</title>','<title>SWOS Studio v1.39.0</title>');
html=html.replaceAll("var BUILD='v1.38.0';","var BUILD='v1.39.0';");

const identityFns='  function identityReadyClubIds(){return Object.keys(PL_2627_VERIFIED_IDENTITIES)}\n  function identityReadyClubCount(){return identityReadyClubIds().length}';
if(!html.includes(identityFns)) throw new Error('SWOS Studio v1.39.0 build failed: identity readiness marker not found.');
const identityLayer=`  const PUBLISHED_IDENTITY_URL="football-db/identities.json";
  let publishedIdentityFeed=null;
  let publishedIdentityStatus={source:"embedded",checkedAt:null,error:null,clubs:Object.keys(PL_2627_VERIFIED_IDENTITIES).length,players:null,u21:null};
  function publishedIdentitySourceFor(clubId){return publishedIdentityFeed?.clubs?.[clubId]||PL_2627_VERIFIED_IDENTITIES[clubId]||[]}
  function u21CandidatesFor(clubId){return publishedIdentityFeed?.u21Candidates?.[clubId]||PL_2627_U21_CANDIDATES[clubId]||[]}
  function identityReadyClubIds(){return Object.keys(publishedIdentityFeed?.clubs||PL_2627_VERIFIED_IDENTITIES)}
  function identityReadyClubCount(){return identityReadyClubIds().length}
  async function loadPublishedIdentityFeed(force=false){
    if(publishedIdentityFeed&&!force)return publishedIdentityFeed;
    try{
      const response=await fetch(PUBLISHED_IDENTITY_URL+(force?('?t='+Date.now()):''),{cache:"no-store"});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const feed=await response.json();
      if(!feed||feed.schemaVersion!==1||feed.season!=="2026/27"||!feed.clubs||typeof feed.clubs!=="object")throw new Error('Invalid identity feed');
      const clubIds=Object.keys(feed.clubs),players=Object.values(feed.clubs).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0),u21=Object.values(feed.u21Candidates||{}).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0);
      if(feed.clubCount!==clubIds.length||feed.playerCount!==players||clubIds.length<10)throw new Error('Identity feed totals do not validate');
      publishedIdentityFeed=feed;
      publishedIdentityStatus={source:"published",checkedAt:new Date().toISOString(),error:null,clubs:clubIds.length,players,u21,version:feed.snapshot||null};
      window.dispatchEvent(new CustomEvent("swos:identity-source",{detail:publishedIdentityStatus}));
      return feed
    }catch(e){
      const players=Object.values(PL_2627_VERIFIED_IDENTITIES).reduce((n,rows)=>n+rows.length,0),u21=Object.values(PL_2627_U21_CANDIDATES).reduce((n,rows)=>n+rows.length,0);
      publishedIdentityStatus={source:"embedded",checkedAt:new Date().toISOString(),error:String(e?.message||e),clubs:Object.keys(PL_2627_VERIFIED_IDENTITIES).length,players,u21,version:null};
      window.dispatchEvent(new CustomEvent("swos:identity-source",{detail:publishedIdentityStatus}));
      return null
    }
  }`;
html=html.replace(identityFns,identityLayer);

const verifiedStart=html.indexOf('  function verifiedIdentityFor(clubId,officialName){');
const verifiedEnd=html.indexOf('\n  function swosSafeName(value){',verifiedStart);
if(verifiedStart<0||verifiedEnd<0) throw new Error('SWOS Studio v1.39.0 build failed: verifiedIdentityFor block not found.');
const verifiedFn=`  function verifiedIdentityFor(clubId,officialName){
    const source=publishedIdentitySourceFor(clubId),off=new Set(identityTokens(officialName));
    let best=null;
    for(const rec of source){const t=identityTokens(rec.footballName);if(!t.length)continue;const hits=t.filter(x=>off.has(x)).length,score=hits/t.length;if(!best||score>best.score)best={rec,score}}
    if(best&&best.score>=0.8)return best.rec;
    const surnameMatches=source.filter(rec=>{const t=identityTokens(rec.footballName);return t.length&&off.has(t[t.length-1])});
    return surnameMatches.length===1?surnameMatches[0]:null
  }`;
html=html.slice(0,verifiedStart)+verifiedFn+html.slice(verifiedEnd);

const renderMarker='  async function renderSeasonSquads(){';
if(!html.includes(renderMarker)) throw new Error('SWOS Studio v1.39.0 build failed: renderSeasonSquads marker not found.');
html=html.replace(renderMarker,renderMarker+'\n    await loadPublishedIdentityFeed(false);');
const u21Old='u21=selectedClub?(PL_2627_U21_CANDIDATES[selectedClub.id]||[]):[];';
if(!html.includes(u21Old)) throw new Error('SWOS Studio v1.39.0 build failed: U21 lookup marker not found.');
html=html.replace(u21Old,'u21=selectedClub?u21CandidatesFor(selectedClub.id):[];');

const css=`
<style id="swos-v139-identity-styles">
  .identity-feed-card{border:1px solid rgba(88,166,255,.55);background:linear-gradient(180deg,rgba(88,166,255,.08),rgba(7,17,31,.97));border-radius:14px;padding:14px;margin:14px 0;box-shadow:var(--shadow)}
  .identity-feed-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.identity-feed-head strong{font-size:15px}.identity-feed-head p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0}.identity-feed-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.identity-feed-stat{border:1px solid var(--line);background:#07111f;border-radius:9px;padding:8px}.identity-feed-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase}.identity-feed-stat b{display:block;font-size:13px;margin-top:3px}.identity-feed-source{margin-top:9px;font-size:8px;color:var(--muted)}.identity-feed-source b.published{color:var(--green)}.identity-feed-source b.fallback{color:var(--yellow)}
</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v139-identity-layer">
(function(){
  'use strict';
  var BUILD='v1.39.0';
  function clean(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  function draw(detail){
    var anchor=document.getElementById('v138-db-health')||document.getElementById('v1361-published-packs');if(!anchor)return;
    var card=document.getElementById('v139-identity-feed');if(!card){card=document.createElement('section');card.id='v139-identity-feed';card.className='identity-feed-card';anchor.insertAdjacentElement('afterend',card);}
    var d=detail||{},published=d.source==='published';
    card.innerHTML='<div class="identity-feed-head"><div><strong>🪪 Verified Identity Feed</strong><p>The ten completed Premier League identity passes now live behind the football-data channel. Studio uses this feed first and keeps its embedded copy only as a fallback.</p></div><span class="feature-status '+(published?'available':'beta')+'">'+(published?'LIVE':'FALLBACK')+'</span></div>'+
      '<div class="identity-feed-grid"><div class="identity-feed-stat"><small>Identity-ready clubs</small><b>'+clean(d.clubs||10)+'/20</b></div><div class="identity-feed-stat"><small>Senior identities</small><b>'+clean(d.players||215)+'</b></div><div class="identity-feed-stat"><small>U21 candidates</small><b>'+clean(d.u21||19)+'</b></div></div>'+
      '<div class="identity-feed-source">Source: <b class="'+(published?'published':'fallback')+'">'+(published?'Independent football-data feed ✓':'Embedded safety fallback')+'</b></div>'+
      '<button class="btn btn-blue" id="v139RefreshIdentity" style="width:100%;margin-top:10px">Recheck identity feed</button>';
    var b=document.getElementById('v139RefreshIdentity');if(b)b.onclick=async function(){b.disabled=true;b.textContent='Checking…';try{if(typeof loadPublishedIdentityFeed==='function')await loadPublishedIdentityFeed(true);}finally{draw(typeof publishedIdentityStatus==='object'?publishedIdentityStatus:{source:'embedded'});}};
  }
  function releaseNotes(){
    if(document.getElementById('v139-release-card'))return;
    var anchor=document.getElementById('v138-release-card')||document.getElementById('v137-release-card');if(!anchor)return;
    var card=document.createElement('div');card.id='v139-release-card';card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.39.0 — Published verified identities</strong><span class="about">• All 10 completed Premier League identity passes are now exposed through the independent Football Database.</span><span class="about">• 215 verified senior identities and 19 separately held U21 candidates are validated before publication.</span><span class="about">• The Premier League squad screen checks the published identity feed before matching names, shirt numbers, broad roles and nationalities.</span><span class="about">• If the feed is unreachable or invalid, Studio safely falls back to the embedded verified copy.</span><span class="about">• The database validator now checks identity counts, duplicate names, role groups, shirt-number ranges, nationality/source presence and manifest totals.</span><span class="about">• No TEAM.* or .CAR write routines are enabled.</span>';
    anchor.insertAdjacentElement('beforebegin',card);
  }
  async function probe(){try{if(typeof loadPublishedIdentityFeed==='function')await loadPublishedIdentityFeed(false);}catch(e){}draw(typeof publishedIdentityStatus==='object'?publishedIdentityStatus:{source:'embedded',clubs:10,players:215,u21:19});}
  function apply(){document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;releaseNotes();probe();}
  window.addEventListener('swos:identity-source',function(e){draw(e.detail||{});});
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){Promise.resolve(apply()).finally(function(){queued=false;});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
})();
</script>`;
html=html.replace('</body>',js+'\n</body>');

fs.writeFileSync(FILE,html,'utf8');
const identitySrc='football-db/identities.json',identityDst='dist/football-db/identities.json';
if(!fs.existsSync(identitySrc))throw new Error('SWOS Studio v1.39.0 build failed: published identity file is missing.');
const feed=JSON.parse(fs.readFileSync(identitySrc,'utf8'));
if(feed.clubCount!==10||feed.playerCount!==215||feed.u21PlayerCount!==19)throw new Error(`SWOS Studio v1.39.0 build failed: unexpected identity totals ${feed.clubCount}/${feed.playerCount}/${feed.u21PlayerCount}.`);
fs.mkdirSync('dist/football-db',{recursive:true});fs.copyFileSync(identitySrc,identityDst);
if(!html.includes('loadPublishedIdentityFeed')||!html.includes('Verified Identity Feed'))throw new Error('SWOS Studio v1.39.0 build failed: published identity layer was not installed.');
if((html.match(/function verifiedIdentityFor\(clubId,officialName\)/g)||[]).length!==1)throw new Error('SWOS Studio v1.39.0 build failed: expected exactly one verified identity matcher.');
console.log('SWOS Studio '+BUILD+' published identity feed build complete.');
