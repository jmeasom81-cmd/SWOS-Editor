import fs from 'node:fs';
import path from 'node:path';

const IDENTITIES='football-db/identities.json';
const COVERAGE='football-db/coverage.json';
const DIR='football-db/championship-research-evidence';
for(const file of [IDENTITIES,COVERAGE,path.join(DIR,'schema-v1.json')])if(!fs.existsSync(file))throw new Error(`Championship research evidence validation: missing ${file}.`);
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const championshipIds=new Set((coverage.clubs||[]).filter(c=>c.division===1).map(c=>c.id));
if(championshipIds.size!==24)throw new Error(`Championship research evidence validation: expected 24 Championship club IDs, found ${championshipIds.size}.`);
const files=fs.readdirSync(DIR).filter(f=>f.endsWith('.json')&&f!=='schema-v1.json').sort();
const errors=[];let players=0;
function validNumber(v,min,max=Infinity){return Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max;}

for(const name of files){
  const full=path.join(DIR,name);let doc;
  try{doc=JSON.parse(fs.readFileSync(full,'utf8'));}catch(e){errors.push(`${name}: invalid JSON (${e.message})`);continue;}
  const id=name.replace(/\.json$/,'');
  if(!championshipIds.has(id)){errors.push(`${name}: ${id} is not a Championship club`);continue;}
  const identityRows=identities.clubs?.[id]||[];
  if(identityRows.length!==16){errors.push(`${name}: ${id} does not expose an exact 16-player identity pack`);continue;}
  if(doc.schemaVersion!==1)errors.push(`${name}: schemaVersion must be 1`);
  if(doc.season!=='2026/27')errors.push(`${name}: season must be 2026/27`);
  if(doc.clubId!==id)errors.push(`${name}: clubId ${doc.clubId||'(missing)'} must match filename ${id}`);
  if(!/^2026-\d{2}-\d{2}$/.test(String(doc.snapshot||'')))errors.push(`${name}: snapshot must be a 2026 ISO date`);
  if(!String(doc.sourceSummary||'').trim())errors.push(`${name}: sourceSummary is required`);
  const rows=doc.players&&typeof doc.players==='object'&&!Array.isArray(doc.players)?doc.players:null;
  if(!rows){errors.push(`${name}: players must be an object keyed by footballName`);continue;}
  const names=Object.keys(rows),expected=new Set(identityRows.map(p=>p.footballName));
  if(names.length!==16)errors.push(`${name}: expected exactly 16 researched players, found ${names.length}`);
  for(const n of names)if(!expected.has(n))errors.push(`${name}: ${n} is not in the published identity 16`);
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
  const allowedTop=new Set(['schemaVersion','season','clubId','snapshot','sourceSummary','players']);
  for(const key of Object.keys(doc))if(!allowedTop.has(key))errors.push(`${name}: unexpected top-level field ${key}`);
}
if(errors.length)throw new Error(`Championship research evidence validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
console.log(`Championship research evidence validation PASS · ${files.length} complete club evidence file(s) · ${players} researched players · exact identity matching enforced.`);
