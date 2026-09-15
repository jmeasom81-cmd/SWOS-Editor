import fs from 'node:fs';
import path from 'node:path';

const DIR='football-db/league-two-identity-evidence';
const COVERAGE='football-db/coverage.json';
const ROLE_MIN={Goalkeeper:2,Defender:4,Midfielder:4,Forward:2};
const GROUPS=new Set(Object.keys(ROLE_MIN));
for(const file of [COVERAGE,path.join(DIR,'schema-v1.json')])if(!fs.existsSync(file))throw new Error(`League Two identity evidence validation: missing ${file}.`);
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const expected=new Set((coverage.clubs||[]).filter(c=>c.division===3).map(c=>c.id));
if(expected.size!==24)throw new Error(`League Two identity evidence validation: mapped structure has ${expected.size}/24 clubs.`);
const files=fs.readdirSync(DIR).filter(file=>file.endsWith('.json')&&file!=='schema-v1.json').sort();
const errors=[];let players=0;
if(files.length!==24)errors.push(`expected 24 club evidence files; found ${files.length}`);
for(const file of files){
  const full=path.join(DIR,file);let doc;
  try{doc=JSON.parse(fs.readFileSync(full,'utf8'));}catch(e){errors.push(`${file}: invalid JSON (${e.message})`);continue;}
  const clubId=file.replace(/\.json$/,'');
  if(!expected.has(clubId))errors.push(`${file}: ${clubId} is not a mapped League Two club`);
  if(doc.schemaVersion!==1||doc.season!=='2026/27'||doc.clubId!==clubId)errors.push(`${file}: invalid evidence envelope`);
  if(!/^2026-\d{2}-\d{2}$/.test(String(doc.snapshot||'')))errors.push(`${file}: snapshot must be a 2026 ISO date`);
  if(!String(doc.sourceSummary||'').trim())errors.push(`${file}: sourceSummary is required`);
  if(!Array.isArray(doc.players)||doc.players.length!==16){errors.push(`${file}: expected exactly 16 players; found ${Array.isArray(doc.players)?doc.players.length:'non-array'}`);continue;}
  players+=doc.players.length;
  const names=new Set(),shirts=new Set(),roles={Goalkeeper:0,Defender:0,Midfielder:0,Forward:0};
  for(const [index,p] of doc.players.entries()){
    const at=`${file} player ${index+1}`,name=String(p?.footballName||'').trim(),key=name.toLocaleLowerCase('en');
    if(!name)errors.push(`${at}: footballName is required`);else if(names.has(key))errors.push(`${file}: duplicate footballName ${name}`);else names.add(key);
    if(!GROUPS.has(p?.group))errors.push(`${at}: invalid group ${p?.group||'(missing)'}`);else roles[p.group]++;
    if(!String(p?.nationality||'').trim())errors.push(`${at}: nationality is required`);
    if(!String(p?.source||'').includes('footballsquads.co.uk/eng/2026-2027/fltwo/'))errors.push(`${at}: current League Two source URL is required`);
    if(p?.shirt!=null){if(!Number.isInteger(p.shirt)||p.shirt<1||p.shirt>99)errors.push(`${at}: shirt must be 1-99 or null`);else if(shirts.has(p.shirt))errors.push(`${file}: duplicate shirt ${p.shirt}`);else shirts.add(p.shirt);}
    const allowed=new Set(['footballName','group','nationality','shirt','source','notes']);for(const key of Object.keys(p||{}))if(!allowed.has(key))errors.push(`${at}: unexpected field ${key}`);
  }
  for(const [group,min] of Object.entries(ROLE_MIN))if(roles[group]<min)errors.push(`${file}: ${group} count ${roles[group]} is below ${min}`);
  const allowedTop=new Set(['schemaVersion','season','clubId','snapshot','sourceSummary','players']);for(const key of Object.keys(doc))if(!allowedTop.has(key))errors.push(`${file}: unexpected top-level field ${key}`);
}
for(const id of expected)if(!files.includes(`${id}.json`))errors.push(`${id}: evidence file is missing`);
if(errors.length)throw new Error(`League Two identity evidence validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
console.log(`League Two identity evidence validation PASS · 24 club files · ${players} selected current players · exact-16 and role gates clean.`);
