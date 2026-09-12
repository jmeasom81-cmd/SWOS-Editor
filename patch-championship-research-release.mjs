import fs from 'node:fs';

const FILE='dist/index.html';
const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const QUEUE='football-db/championship-research-queue.json';
const INTAKE='football-db/championship-research-intake.json';
const VALIDATION='football-db/research-expansion-validation.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';

function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}

export function patchChampionshipResearchRelease(config){
  const {version,previousVersion,releaseId,previousReleaseId,clubId,clubName,champReady,next,stale=[],current=[],detail}=config;
  const build=`v${version}`;
  for(const file of [FILE,PACKS,COVERAGE,QUEUE,INTAKE,VALIDATION,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`SWOS Studio ${build} build failed: missing ${file}.`);
  let html=fs.readFileSync(FILE,'utf8');
  if(!html.includes(`<title>SWOS Studio v${previousVersion}</title>`))throw new Error(`SWOS Studio ${build} build failed: expected v${previousVersion} output was not found.`);
  const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
  const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
  const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
  const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
  const validation=JSON.parse(fs.readFileSync(VALIDATION,'utf8'));
  const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
  const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
  const champ=coverage.divisions?.find(d=>d.code===1),pl=coverage.divisions?.find(d=>d.code===0);
  const totalClubs=20+champReady,totalPlayers=totalClubs*16,pending=24-champReady,staged=pending*16,cells=staged*3;

  if(manifest.version!==`2026.27-england-research.${champReady}`)throw new Error(`SWOS Studio ${build} build failed: expected research DB .${champReady}; found ${manifest.version}.`);
  if(!packs.clubs?.[clubId]||Object.keys(packs.clubs[clubId].players||{}).length!==16)throw new Error(`SWOS Studio ${build} build failed: ${clubName} research pack missing or incomplete.`);
  const identityNames=new Set((identities.clubs?.[clubId]||[]).map(p=>p.footballName));
  const researchNames=new Set(Object.keys(packs.clubs[clubId].players||{}));
  if(identityNames.size!==16||researchNames.size!==16)throw new Error(`SWOS Studio ${build} build failed: ${clubName} identity/research sets must both contain exactly 16 players.`);
  for(const name of identityNames)if(!researchNames.has(name))throw new Error(`SWOS Studio ${build} build failed: ${clubName} research pack is missing identity player ${name}.`);
  for(const name of stale)if(identityNames.has(name)||researchNames.has(name))throw new Error(`SWOS Studio ${build} build failed: stale ${clubName} player ${name} survived correction.`);
  for(const name of current)if(!identityNames.has(name)||!researchNames.has(name))throw new Error(`SWOS Studio ${build} build failed: corrected ${clubName} player ${name} is missing.`);
  if(packs.packCount!==totalClubs||packs.playerCount!==totalPlayers)throw new Error(`SWOS Studio ${build} build failed: expected ${totalClubs} research packs / ${totalPlayers} players; found ${packs.packCount} / ${packs.playerCount}.`);
  if(pl?.researchReady!==20||champ?.identityReady!==24||champ?.researchReady!==champReady)throw new Error(`SWOS Studio ${build} build failed: expected PL 20/20 and Championship ${champReady}/24 research.`);
  if(queue.progress?.researchReadyClubs!==champReady||queue.progress?.researchPendingClubs!==pending||queue.totals?.clubs!==pending||queue.totals?.stagedPlayers!==staged||queue.totals?.requiredEvidenceCells!==cells)throw new Error(`SWOS Studio ${build} build failed: pending Championship queue totals are stale.`);
  if(next ? queue.next?.clubId!==next.id : queue.next!==null)throw new Error(`SWOS Studio ${build} build failed: expected next Championship club ${next?.name||'none'}.`);
  if(queue.status!==(pending?'active':'complete'))throw new Error(`SWOS Studio ${build} build failed: queue completion status is stale.`);
  if(intake.progress?.researchReadyClubs!==champReady||intake.progress?.researchPendingClubs!==pending||intake.totals?.clubs!==pending||intake.totals?.players!==staged||intake.totals?.requiredEvidenceCells!==cells)throw new Error(`SWOS Studio ${build} build failed: Championship intake progress is stale.`);
  if(validation.status!=='pass'||validation.divisions?.premierLeague?.researchReady!==20||validation.divisions?.championship?.researchReady!==champReady||validation.totals?.researchClubs!==totalClubs||validation.totals?.researchPlayers!==totalPlayers)throw new Error(`SWOS Studio ${build} build failed: research expansion validation is stale.`);
  if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error(`SWOS Studio ${build} build failed: binary write locks changed unexpectedly.`);

  html=html.replace(`<title>SWOS Studio v${previousVersion}</title>`,`<title>SWOS Studio ${build}</title>`);
  const meta={champReady,totalClubs,totalPlayers,pending,next:next?.name||null};
  const embedded=JSON.stringify(meta).replace(/</g,'\\u003c');
  const safeClub=escapeHtml(clubName),safeDetail=escapeHtml(detail);
  const nextLine=next?`Next evidence target: <b>${escapeHtml(next.name)}</b>. ${pending} Championship club${pending===1?' remains':'s remain'}.`:'The Championship research queue is now <b>complete</b>; every selected 16-player pack has passed the evidence gate.';
  const releaseSummary=next?`Championship research reaches ${champReady} / 24; ${escapeHtml(next.name)} is next.`:'Championship research reaches 24 / 24 and the division queue closes cleanly.';
  const js=`\n<script id="swos-${releaseId}-research-layer">\n(function(){\n'use strict';var BUILD='${build}',META=${embedded};\nfunction render(){var anchor=document.getElementById('${previousReleaseId}-research')||document.getElementById('v187-stoke-research');if(!anchor)return false;\nif(!document.getElementById('${releaseId}-research')){var box=document.createElement('div');box.id='${releaseId}-research';box.className='card stack';box.innerHTML='<strong>✅ ${safeClub} research pack promoted</strong><span class="about">${safeDetail}</span><span class="about">Championship research coverage: <b>'+META.champReady+' / 24</b>. England now carries <b>'+META.totalClubs+' research-ready clubs / '+META.totalPlayers+' researched players</b>.</span><span class="about">${nextLine}</span><span class="feature-status available">${champReady} / 24 CHAMPIONSHIP RESEARCH READY ✓</span>';anchor.insertAdjacentElement('afterend',box);}\nif(!document.getElementById('${releaseId}-release-card')){var a=document.getElementById('${previousReleaseId}-release-card')||document.getElementById('v187-release-card');if(a){var c=document.createElement('div');c.id='${releaseId}-release-card';c.className='card stack v133-release-card';c.innerHTML='<strong>New in ${build} — ${safeClub} research promotion</strong><span class="about">• ${safeDetail}</span><span class="about">• ${releaseSummary}</span><span class="about">• Exact-16 identity matching and complete age, market-value, position and source evidence remain mandatory.</span><span class="about">• TEAM.* and established .CAR binary writes remain locked.</span>';a.insertAdjacentElement('beforebegin',c);}}\n document.title='SWOS Studio '+BUILD;var b=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(b)b.textContent=BUILD;return true;}\nvar tries=0;function apply(){tries++;if(!render()&&tries<20)setTimeout(apply,100);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();\n})();\n</script>`;
  html=html.replace('</body>',js+'\n</body>');
  fs.writeFileSync(FILE,html,'utf8');
  if(!html.includes(`swos-${releaseId}-research-layer`)||!html.includes(`<title>SWOS Studio ${build}</title>`))throw new Error(`SWOS Studio ${build} build failed: ${clubName} research layer missing.`);
  console.log(`SWOS Studio ${build} ${clubName} research promotion complete · Championship ${champReady}/24 · all research ${totalClubs} clubs / ${totalPlayers} players · next ${next?.name||'complete'} · binary writes locked.`);
}
