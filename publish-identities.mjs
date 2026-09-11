import fs from 'node:fs';
import path from 'node:path';

const SOURCE='index.html';
const OUT='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const PACK_DIR='football-db/identity-packs';
const CORRECTIONS='football-db/identity-corrections.json';
if(!fs.existsSync(SOURCE)) throw new Error('Identity publisher failed: index.html is missing.');
if(!fs.existsSync(MANIFEST)) throw new Error('Identity publisher failed: manifest.json is missing.');
const html=fs.readFileSync(SOURCE,'utf8');

function extractJson(startMarker,endMarker,label){
  const start=html.indexOf(startMarker);
  if(start<0) throw new Error(`Identity publisher failed: ${label} start marker not found.`);
  const jsonStart=start+startMarker.length;
  const end=html.indexOf(endMarker,jsonStart);
  if(end<0) throw new Error(`Identity publisher failed: ${label} end marker not found.`);
  try{return JSON.parse(html.slice(jsonStart,end).trim())}
  catch(e){throw new Error(`Identity publisher failed: ${label} is not valid JSON: ${e.message}`)}
}
function validateRow(row,label){
  const name=String(row?.footballName||'').trim();
  if(!name)throw new Error(`${label}: footballName is required.`);
  if(!['Goalkeeper','Defender','Midfielder','Forward'].includes(row.group))throw new Error(`${label}:${name} invalid broad role ${row.group}.`);
  if(!String(row.nationality||'').trim())throw new Error(`${label}:${name} nationality is required.`);
  if(row.shirt!=null&&(!Number.isInteger(row.shirt)||row.shirt<1||row.shirt>99))throw new Error(`${label}:${name} shirt must be null or 1-99.`);
  if(!String(row.source||'').trim())throw new Error(`${label}:${name} source is required.`);
  return name;
}

const clubs=extractJson('const PL_2627_VERIFIED_IDENTITIES=',';\n  const PL_2627_U21_CANDIDATES=','verified identities');
const u21Candidates=extractJson('const PL_2627_U21_CANDIDATES=',';\n  function identityReadyClubIds','U21 candidates');
const published=[];
const appliedCorrections=[];
let snapshot='2026-09-09';

if(fs.existsSync(PACK_DIR)){
  for(const file of fs.readdirSync(PACK_DIR).filter(f=>f.endsWith('.json')).sort()){
    const pack=JSON.parse(fs.readFileSync(path.join(PACK_DIR,file),'utf8'));
    if(pack.schemaVersion!==1)throw new Error(`${file}: identity-pack schemaVersion must be 1.`);
    if(pack.season!=='2026/27')throw new Error(`${file}: identity-pack season must be 2026/27.`);
    for(const [clubId,rows] of Object.entries(pack.clubs||{})){
      if(!Array.isArray(rows)||!rows.length)throw new Error(`${file}:${clubId} must contain identity rows.`);
      const seen=new Set();
      for(const row of rows){
        const name=validateRow(row,`${file}:${clubId}`),key=name.toLocaleLowerCase('en');
        if(seen.has(key))throw new Error(`${file}:${clubId} duplicate footballName ${name}.`);
        seen.add(key);
      }
      clubs[clubId]=rows;
      published.push({clubId,file,players:rows.length});
    }
    if(pack.snapshot&&pack.snapshot>snapshot)snapshot=pack.snapshot;
  }
}

if(fs.existsSync(CORRECTIONS)){
  const corrections=JSON.parse(fs.readFileSync(CORRECTIONS,'utf8'));
  if(corrections.schemaVersion!==1||corrections.season!=='2026/27')throw new Error('identity-corrections.json: invalid envelope.');
  for(const [clubId,change] of Object.entries(corrections.clubs||{})){
    if(!Array.isArray(clubs[clubId]))throw new Error(`Identity correction: unknown club ${clubId}.`);
    const remove=new Set((change.remove||[]).map(x=>String(x).trim().toLocaleLowerCase('en')));
    const before=clubs[clubId].length;
    let rows=clubs[clubId].filter(row=>!remove.has(String(row.footballName).trim().toLocaleLowerCase('en')));
    if(before-rows.length!==remove.size)throw new Error(`Identity correction ${clubId}: not every requested removal matched exactly once.`);
    for(const row of change.add||[]){
      const name=validateRow(row,`identity-corrections.json:${clubId}`);
      if(rows.some(x=>String(x.footballName).trim().toLocaleLowerCase('en')===name.toLocaleLowerCase('en')))throw new Error(`Identity correction ${clubId}: duplicate add ${name}.`);
      rows.push(row);
    }
    if(rows.length!==before)throw new Error(`Identity correction ${clubId}: correction changed squad size ${before} -> ${rows.length}; replacements must be one-for-one.`);
    clubs[clubId]=rows;
    appliedCorrections.push({clubId,removed:[...(change.remove||[])],added:(change.add||[]).map(x=>x.footballName),note:change.note||null});
  }
  if(corrections.snapshot&&corrections.snapshot>snapshot)snapshot=corrections.snapshot;
}

const clubIds=Object.keys(clubs);
const playerCount=Object.values(clubs).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0);
const u21PlayerCount=Object.values(u21Candidates).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0);
const out={
  schemaVersion:1,
  season:'2026/27',
  snapshot,
  status:clubIds.length===20?'premier-league-identity-complete':'identity-ready-foundation',
  clubCount:clubIds.length,
  playerCount,
  u21ClubCount:Object.keys(u21Candidates).length,
  u21PlayerCount,
  clubs,
  u21Candidates,
  generation:{mode:'embedded-base-plus-identity-packs',identityPackFiles:[...new Set(published.map(x=>x.file))],publishedClubIds:published.map(x=>x.clubId),correctionsFile:fs.existsSync(CORRECTIONS)?CORRECTIONS:null,appliedCorrections},
  safety:{
    source:'Verified SWOS Studio identity layer + incremental identity packs + auditable corrections',
    teamWriteReady:false,
    careerWriteReady:false,
    note:'Identity publication changes football-data lookup only. It does not enable TEAM.* or .CAR writes.'
  }
};
fs.mkdirSync('football-db',{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');

const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
manifest.publishedAt=snapshot;
manifest.coverage=manifest.coverage||{};
manifest.coverage.premierLeague=manifest.coverage.premierLeague||{};
manifest.coverage.premierLeague.identityReadyClubs=clubIds.length;
manifest.coverage.premierLeague.identityPlayers=playerCount;
manifest.coverage.premierLeague.u21Candidates=u21PlayerCount;
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.incrementalIdentityPacks=true;
manifest.dataModel.identityCorrections=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Incremental identity publisher merged ')&&!String(x).startsWith('Identity correction layer applied '));
if(published.length)manifest.notes.push(`Incremental identity publisher merged ${published.map(x=>x.clubId).join(', ')}; ${clubIds.length} Premier League clubs / ${playerCount} senior identities now published.`);
if(appliedCorrections.length)manifest.notes.push(`Identity correction layer applied ${appliedCorrections.length} post-window replacement(s): ${appliedCorrections.map(x=>x.clubId).join(', ')}.`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');

if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db',{recursive:true});
  fs.copyFileSync(OUT,'dist/football-db/identities.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}
console.log(`Published identity feed · ${clubIds.length} clubs · ${playerCount} verified senior identities · ${u21PlayerCount} U21 candidates · ${published.length} incremental clubs · ${appliedCorrections.length} correction(s)`);
