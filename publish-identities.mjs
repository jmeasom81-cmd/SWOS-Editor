import fs from 'node:fs';
import path from 'node:path';

const SOURCE='index.html';
const OUT='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const PACK_DIR='football-db/identity-packs';
const CORRECTIONS='football-db/identity-corrections.json';
if(!fs.existsSync(SOURCE))throw new Error('Identity publisher failed: index.html is missing.');
if(!fs.existsSync(MANIFEST))throw new Error('Identity publisher failed: manifest.json is missing.');
const html=fs.readFileSync(SOURCE,'utf8');

function extractJson(startMarker,endMarker,label){
  const start=html.indexOf(startMarker);if(start<0)throw new Error(`Identity publisher failed: ${label} start marker not found.`);
  const jsonStart=start+startMarker.length,end=html.indexOf(endMarker,jsonStart);if(end<0)throw new Error(`Identity publisher failed: ${label} end marker not found.`);
  try{return JSON.parse(html.slice(jsonStart,end).trim())}catch(e){throw new Error(`Identity publisher failed: ${label} is not valid JSON: ${e.message}`)}
}
function extractBalanced(marker,open,close,label){
  const markerAt=html.indexOf(marker);if(markerAt<0)throw new Error(`Identity publisher failed: ${label} marker not found.`);
  const start=html.indexOf(open,markerAt+marker.length);if(start<0)throw new Error(`Identity publisher failed: ${label} opening ${open} not found.`);
  let depth=0,quote=null,escaped=false;
  for(let i=start;i<html.length;i++){
    const c=html[i];
    if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote=null;continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c===open)depth++;else if(c===close){depth--;if(depth===0)return html.slice(start,i+1)}
  }
  throw new Error(`Identity publisher failed: ${label} closing ${close} not found.`);
}
function validateRow(row,label){
  const name=String(row?.footballName||'').trim();if(!name)throw new Error(`${label}: footballName is required.`);
  if(!['Goalkeeper','Defender','Midfielder','Forward'].includes(row.group))throw new Error(`${label}:${name} invalid broad role ${row.group}.`);
  if(!String(row.nationality||'').trim())throw new Error(`${label}:${name} nationality is required.`);
  if(row.shirt!=null&&(!Number.isInteger(row.shirt)||row.shirt<1||row.shirt>99))throw new Error(`${label}:${name} shirt must be null or 1-99.`);
  if(!String(row.source||'').trim())throw new Error(`${label}:${name} source is required.`);
  return name;
}

const clubs=extractJson('const PL_2627_VERIFIED_IDENTITIES=',';\n  const PL_2627_U21_CANDIDATES=','verified identities');
const u21Candidates=extractJson('const PL_2627_U21_CANDIDATES=',';\n  function identityReadyClubIds','U21 candidates');
const plLiteral=extractBalanced('const PL_2627_PACK=','{','}','Premier League structure');
const eflLiteral=extractBalanced('const ENGLAND_2627_EFL_CLUBS=','[',']','EFL structure');
let plPack,efl;
try{plPack=Function(`"use strict";return (${plLiteral});`)()}catch(e){throw new Error(`Identity publisher failed: PL structure parse: ${e.message}`)}
try{efl=JSON.parse(eflLiteral)}catch(e){throw new Error(`Identity publisher failed: EFL structure parse: ${e.message}`)}
const divisionByClub=new Map([...(plPack.clubs||[]).map(c=>[c.id,0]),...(efl||[]).map(c=>[c.id,c.division])]);

const published=[];
const appliedCorrections=[];
const deferredCorrections=[];
let snapshot='2026-09-09';

if(fs.existsSync(PACK_DIR)){
  for(const file of fs.readdirSync(PACK_DIR).filter(f=>f.endsWith('.json')).sort()){
    const pack=JSON.parse(fs.readFileSync(path.join(PACK_DIR,file),'utf8'));
    if(pack.schemaVersion!==1||pack.season!=='2026/27')throw new Error(`${file}: invalid identity-pack envelope.`);
    for(const [clubId,rows] of Object.entries(pack.clubs||{})){
      if(!divisionByClub.has(clubId))throw new Error(`${file}:${clubId} is not in the mapped 92-club England structure.`);
      if(!Array.isArray(rows)||!rows.length)throw new Error(`${file}:${clubId} must contain identity rows.`);
      const seen=new Set();
      for(const row of rows){const name=validateRow(row,`${file}:${clubId}`),key=name.toLocaleLowerCase('en');if(seen.has(key))throw new Error(`${file}:${clubId} duplicate footballName ${name}.`);seen.add(key)}
      clubs[clubId]=rows;
      published.push({clubId,file,players:rows.length,division:divisionByClub.get(clubId)});
    }
    if(pack.snapshot&&pack.snapshot>snapshot)snapshot=pack.snapshot;
  }
}

if(fs.existsSync(CORRECTIONS)){
  const corrections=JSON.parse(fs.readFileSync(CORRECTIONS,'utf8'));
  if(corrections.schemaVersion!==1||corrections.season!=='2026/27')throw new Error('identity-corrections.json: invalid envelope.');
  for(const [clubId,change] of Object.entries(corrections.clubs||{})){
    if(!divisionByClub.has(clubId))throw new Error(`Identity correction: ${clubId} is not in the mapped 92-club England structure.`);
    if(!Array.isArray(clubs[clubId])){
      deferredCorrections.push({clubId,reason:'identity club has not been published yet'});
      continue;
    }
    const remove=new Set((change.remove||[]).map(x=>String(x).trim().toLocaleLowerCase('en'))),before=clubs[clubId].length;
    let rows=clubs[clubId].filter(row=>!remove.has(String(row.footballName).trim().toLocaleLowerCase('en')));
    if(before-rows.length!==remove.size)throw new Error(`Identity correction ${clubId}: not every requested removal matched exactly once.`);
    for(const row of change.add||[]){
      const name=validateRow(row,`identity-corrections.json:${clubId}`);
      if(rows.some(x=>String(x.footballName).trim().toLocaleLowerCase('en')===name.toLocaleLowerCase('en')))throw new Error(`Identity correction ${clubId}: duplicate add ${name}.`);
      rows.push(row);
    }
    if(rows.length!==before)throw new Error(`Identity correction ${clubId}: replacements must be one-for-one.`);
    clubs[clubId]=rows;
    appliedCorrections.push({clubId,removed:[...(change.remove||[])],added:(change.add||[]).map(x=>x.footballName),note:change.note||null});
  }
  if(corrections.snapshot&&corrections.snapshot>snapshot)snapshot=corrections.snapshot;
}

const clubIds=Object.keys(clubs);
const playerCount=Object.values(clubs).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0);
const u21PlayerCount=Object.values(u21Candidates).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0);
const divisionStats=code=>{const ids=clubIds.filter(id=>divisionByClub.get(id)===code);return {clubs:ids.length,players:ids.reduce((n,id)=>n+(clubs[id]?.length||0),0)}};
const pl=divisionStats(0),championship=divisionStats(1),leagueOne=divisionStats(2),leagueTwo=divisionStats(3);
if(pl.clubs!==20)throw new Error(`Identity publisher failed: Premier League identity foundation regressed to ${pl.clubs}/20.`);

const out={
  schemaVersion:1,
  season:'2026/27',
  snapshot,
  status:clubIds.length===92?'england-identity-complete':clubIds.length>20?'england-identity-expanding':'premier-league-identity-complete',
  clubCount:clubIds.length,
  playerCount,
  u21ClubCount:Object.keys(u21Candidates).length,
  u21PlayerCount,
  divisionCoverage:{premierLeague:pl,championship,leagueOne,leagueTwo},
  clubs,
  u21Candidates,
  generation:{
    mode:'embedded-base-plus-identity-packs',
    identityPackFiles:[...new Set(published.map(x=>x.file))],
    publishedClubIds:published.map(x=>x.clubId),
    correctionsFile:fs.existsSync(CORRECTIONS)?CORRECTIONS:null,
    appliedCorrections,
    deferredCorrections
  },
  safety:{source:'Verified SWOS Studio identity layer + incremental identity packs + auditable corrections',teamWriteReady:false,careerWriteReady:false,note:'Identity publication changes football-data lookup only. It does not enable TEAM.* or .CAR writes.'}
};
fs.mkdirSync('football-db',{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');

const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
manifest.publishedAt=snapshot;
manifest.coverage=manifest.coverage||{};
manifest.coverage.premierLeague=manifest.coverage.premierLeague||{};
manifest.coverage.englandClubs=manifest.coverage.englandClubs||{};
manifest.coverage.championship=manifest.coverage.championship||{};
manifest.coverage.leagueOne=manifest.coverage.leagueOne||{};
manifest.coverage.leagueTwo=manifest.coverage.leagueTwo||{};
manifest.coverage.premierLeague.identityReadyClubs=pl.clubs;
manifest.coverage.premierLeague.identityPlayers=pl.players;
manifest.coverage.premierLeague.u21Candidates=u21PlayerCount;
manifest.coverage.championship.identityReadyClubs=championship.clubs;
manifest.coverage.championship.identityPlayers=championship.players;
manifest.coverage.leagueOne.identityReadyClubs=leagueOne.clubs;
manifest.coverage.leagueOne.identityPlayers=leagueOne.players;
manifest.coverage.leagueTwo.identityReadyClubs=leagueTwo.clubs;
manifest.coverage.leagueTwo.identityPlayers=leagueTwo.players;
manifest.coverage.englandClubs.identityReadyClubs=clubIds.length;
manifest.coverage.englandClubs.identityPlayers=playerCount;
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.incrementalIdentityPacks=true;
manifest.dataModel.identityCorrections=true;
manifest.dataModel.deferredIdentityCorrections=true;
manifest.dataModel.multiDivisionIdentityCoverage=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Incremental identity publisher merged ')&&!String(x).startsWith('Identity correction layer applied ')&&!String(x).startsWith('Identity correction layer deferred ')&&!String(x).startsWith('England identity coverage now '));
if(published.length)manifest.notes.push(`Incremental identity publisher merged ${published.map(x=>x.clubId).join(', ')}.`);
if(appliedCorrections.length)manifest.notes.push(`Identity correction layer applied ${appliedCorrections.length} post-window replacement(s): ${appliedCorrections.map(x=>x.clubId).join(', ')}.`);
if(deferredCorrections.length)manifest.notes.push(`Identity correction layer deferred ${deferredCorrections.length} correction(s) until their club identity packs are published: ${deferredCorrections.map(x=>x.clubId).join(', ')}.`);
manifest.notes.push(`England identity coverage now ${clubIds.length}/92 clubs (${pl.clubs}/20 Premier League, ${championship.clubs}/24 Championship, ${leagueOne.clubs}/24 League One, ${leagueTwo.clubs}/24 League Two).`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db',{recursive:true});
  fs.copyFileSync(OUT,'dist/football-db/identities.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}
console.log(`Published identity feed · England ${clubIds.length}/92 clubs / ${playerCount} senior identities · PL ${pl.clubs}/20 · Championship ${championship.clubs}/24 · ${appliedCorrections.length} correction(s) applied · ${deferredCorrections.length} deferred`);
