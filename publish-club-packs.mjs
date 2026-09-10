import fs from 'node:fs';
import path from 'node:path';

const PACKS='football-db/research-packs.json';
const MANIFEST='football-db/manifest.json';
const DIR='football-db/club-packs';

if(!fs.existsSync(PACKS))throw new Error('Club-pack publisher: research-packs.json is missing.');
if(!fs.existsSync(MANIFEST))throw new Error('Club-pack publisher: manifest.json is missing.');
if(!fs.existsSync(DIR))throw new Error('Club-pack publisher: club-packs directory is missing.');

const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const files=fs.readdirSync(DIR).filter(f=>f.endsWith('.json')).sort();
if(!files.length)throw new Error('Club-pack publisher: no club-pack files found.');

const published=[];
for(const file of files){
  const full=path.join(DIR,file);
  const club=JSON.parse(fs.readFileSync(full,'utf8'));
  if(club.schemaVersion!==1)throw new Error(`${file}: schemaVersion must be 1.`);
  if(club.season!==packs.season)throw new Error(`${file}: season ${club.season} does not match ${packs.season}.`);
  if(!club.clubId||!club.label)throw new Error(`${file}: clubId and label are required.`);
  const rows=Object.entries(club.players||{});
  if(rows.length!==16)throw new Error(`${file}: expected exactly 16 researched players; found ${rows.length}.`);
  const seen=new Set();
  for(const [name,p] of rows){
    const key=name.trim().toLocaleLowerCase('en');
    if(!key||seen.has(key))throw new Error(`${file}: blank or duplicate player name ${name}.`);
    seen.add(key);
    if(!Number.isInteger(p.position)||p.position<0||p.position>7)throw new Error(`${file}: ${name} position must be an integer 0-7.`);
    if(!Number.isFinite(Number(p.age))||Number(p.age)<15||Number(p.age)>50)throw new Error(`${file}: ${name} age is invalid.`);
    if(!Number.isFinite(Number(p.marketValueM))||Number(p.marketValueM)<0)throw new Error(`${file}: ${name} marketValueM is invalid.`);
    for(const k of ['minutes','goals','assists'])if(p[k]!=null&&(!Number.isFinite(Number(p[k]))||Number(p[k])<0))throw new Error(`${file}: ${name} ${k} is invalid.`);
  }
  packs.clubs[club.clubId]={
    clubId:club.clubId,
    label:club.label,
    kind:club.kind||'Published club research pack',
    source:club.source||'SWOS Studio Football Database',
    evidenceNotes:Array.isArray(club.evidenceNotes)?club.evidenceNotes:[],
    players:club.players
  };
  published.push({clubId:club.clubId,file,snapshot:club.snapshot||packs.snapshot});
}

const clubRows=Object.values(packs.clubs||{});
const playerCount=clubRows.reduce((n,c)=>n+Object.keys(c.players||{}).length,0);
const snapshots=[packs.snapshot,...published.map(x=>x.snapshot)].filter(Boolean).sort();
packs.snapshot=snapshots[snapshots.length-1]||packs.snapshot;
packs.packCount=clubRows.length;
packs.playerCount=playerCount;
packs.generation={mode:'base-plus-club-packs',clubPackFiles:published.map(x=>x.file),publishedClubIds:published.map(x=>x.clubId)};
fs.writeFileSync(PACKS,JSON.stringify(packs,null,2)+'\n','utf8');

manifest.version=`2026.27-foundation.${packs.packCount}`;
manifest.publishedAt=packs.snapshot;
manifest.coverage=manifest.coverage||{};
manifest.coverage.premierLeague=manifest.coverage.premierLeague||{};
manifest.coverage.premierLeague.researchPackClubs=packs.packCount;
manifest.coverage.premierLeague.researchPackPlayers=packs.playerCount;
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.incrementalClubPacks=true;
const note=`Incremental club-pack publisher merged ${published.map(x=>x.clubId).join(', ')} into the authoritative research feed; ${packs.packCount} clubs / ${packs.playerCount} researched players.`;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Incremental club-pack publisher merged '));
manifest.notes.push(note);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');

if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db',{recursive:true});
  fs.copyFileSync(PACKS,'dist/football-db/research-packs.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}

console.log(`Published incremental club packs · ${published.length} source file(s) · ${packs.packCount} packs / ${packs.playerCount} players · DB ${manifest.version}`);
