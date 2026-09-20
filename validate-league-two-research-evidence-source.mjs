import fs from 'node:fs';
import path from 'node:path';

const IDENTITY_DIR='football-db/league-two-identity-evidence';
const RESEARCH_DIR='football-db/league-two-research-evidence';
for(const dir of [IDENTITY_DIR,RESEARCH_DIR])if(!fs.existsSync(dir))throw new Error(`League Two research validation: missing ${dir}.`);
if(!fs.existsSync(path.join(RESEARCH_DIR,'schema-v1.json')))throw new Error('League Two research validation: missing research schema.');

const identityFiles=fs.readdirSync(IDENTITY_DIR).filter(f=>f.endsWith('.json')&&f!=='schema-v1.json').sort();
if(identityFiles.length!==24)throw new Error(`League Two research validation: expected 24 identity files, found ${identityFiles.length}.`);
const identities=new Map(identityFiles.map(file=>{
  const doc=JSON.parse(fs.readFileSync(path.join(IDENTITY_DIR,file),'utf8'));
  return [doc.clubId,{file,doc}];
}));
const files=fs.readdirSync(RESEARCH_DIR).filter(f=>f.endsWith('.json')&&f!=='schema-v1.json').sort();
const errors=[];let players=0;
function validNumber(v,min,max=Infinity){return Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max;}

for(const name of files){
  const full=path.join(RESEARCH_DIR,name);let doc;
  try{doc=JSON.parse(fs.readFileSync(full,'utf8'));}catch(e){errors.push(`${name}: invalid JSON (${e.message})`);continue;}
  const id=name.replace(/\.json$/,'');
  const identity=identities.get(id);
  if(!identity){errors.push(`${name}: ${id} has no League Two identity evidence file`);continue;}
  if(doc.schemaVersion!==1)errors.push(`${name}: schemaVersion must be 1`);
  if(doc.season!=='2026/27')errors.push(`${name}: season must be 2026/27`);
  if(doc.clubId!==id)errors.push(`${name}: clubId ${doc.clubId||'(missing)'} must match filename ${id}`);
  if(!/^2026-\d{2}-\d{2}$/.test(String(doc.snapshot||'')))errors.push(`${name}: snapshot must be a 2026 ISO date`);
  if(!String(doc.sourceSummary||'').trim())errors.push(`${name}: sourceSummary is required`);
  const identityRows=identity.doc.players||[];
  if(identityRows.length!==16){errors.push(`${identity.file}: expected exactly 16 identity players, found ${identityRows.length}`);continue;}
  const rows=doc.players&&typeof doc.players==='object'&&!Array.isArray(doc.players)?doc.players:null;
  if(!rows){errors.push(`${name}: players must be an object keyed by footballName`);continue;}
  const names=Object.keys(rows),expected=new Set(identityRows.map(p=>p.footballName));
  if(names.length!==16)errors.push(`${name}: expected exactly 16 researched players, found ${names.length}`);
  for(const n of names)if(!expected.has(n))errors.push(`${name}: ${n} is not in the committed League Two identity 16`);
  for(const n of expected)if(!Object.prototype.hasOwnProperty.call(rows,n))errors.push(`${name}: identity player ${n} is missing research evidence`);
  for(const [footballName,p] of Object.entries(rows)){
    players++;const at=`${name}/${footballName}`;
    if(!validNumber(p?.age,15,50))errors.push(`${at}: age must be 15-50`);
    if(!validNumber(p?.marketValueM,0))errors.push(`${at}: marketValueM must be >= 0`);
    if(!Number.isInteger(p?.position)||p.position<0||p.position>7)errors.push(`${at}: position must be integer 0-7`);
    if(!Array.isArray(p?.sources)||!p.sources.length||p.sources.some(s=>!String(s||'').trim()))errors.push(`${at}: at least one source is required`);
    for(const key of ['minutes','goals','assists'])if(p?.[key]!=null&&!validNumber(p[key],0))errors.push(`${at}: ${key} must be >= 0 when supplied`);
    const allowed=new Set(['age','marketValueM','position','minutes','goals','assists','sources','notes']);
    for(const key of Object.keys(p||{}))if(!allowed.has(key))errors.push(`${at}: unexpected field ${key}`);
  }
}
if(errors.length)throw new Error(`League Two research evidence validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
console.log(`League Two research evidence validation PASS · ${files.length} complete club evidence file(s) · ${players} researched players · exact committed identity matching enforced · binary writes untouched.`);
