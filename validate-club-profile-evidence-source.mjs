import fs from 'node:fs';
import path from 'node:path';

const COVERAGE='football-db/coverage.json';
const DIR='football-db/club-profile-evidence';
for(const file of [COVERAGE,path.join(DIR,'schema-v1.json')])if(!fs.existsSync(file))throw new Error(`Club profile evidence validation: missing ${file}.`);
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const eligible=new Set((coverage.clubs||[]).filter(c=>(c.division===0||c.division===1)&&c.stages?.researchPack?.status==='ready').map(c=>c.id));
if(eligible.size!==44)throw new Error(`Club profile evidence validation: expected 44 eligible clubs, found ${eligible.size}.`);

const formations=["4-4-2","5-4-1","4-5-1","5-3-2","3-5-2","4-3-3","4-2-4","3-4-3","Sweeper","5-2-3","Attack","Defend","User A","User B","User C","User D","User E","User F"];
const styles=["Plain","Colored sleeves","Vertical stripes","Horizontal stripes"];
const files=fs.readdirSync(DIR).filter(f=>f.endsWith('.json')&&f!=='schema-v1.json').sort();
const errors=[];
function sourcesOk(v){return Array.isArray(v)&&v.length>0&&v.every(s=>String(s||'').trim())}
function kitOk(kit,where){
  if(!kit||typeof kit!=='object'){errors.push(`${where}: kit object required`);return;}
  if(!Number.isInteger(kit.styleCode)||kit.styleCode<0||kit.styleCode>3)errors.push(`${where}: styleCode must be 0-3`);
  if(styles[kit.styleCode]!==kit.style)errors.push(`${where}: style must match native style code ${kit.styleCode}`);
  for(const key of ['shirt1','shirt2','shorts','socks'])if(!Number.isInteger(kit[key])||kit[key]<0||kit[key]>9)errors.push(`${where}: ${key} must be colour code 0-9`);
  if(!sourcesOk(kit.sources))errors.push(`${where}: at least one source is required`);
}
for(const file of files){
  const full=path.join(DIR,file);let doc;
  try{doc=JSON.parse(fs.readFileSync(full,'utf8'));}catch(e){errors.push(`${file}: invalid JSON ${e.message}`);continue;}
  const id=file.replace(/\.json$/,'');
  if(!eligible.has(id)){errors.push(`${file}: ${id} is not an eligible research-ready club`);continue;}
  if(doc.schemaVersion!==1||doc.season!=='2026/27'||doc.clubId!==id)errors.push(`${file}: invalid evidence envelope`);
  if(!/^2026-\d{2}-\d{2}$/.test(String(doc.snapshot||'')))errors.push(`${file}: snapshot must be a 2026 ISO date`);
  if(!String(doc.sourceSummary||'').trim())errors.push(`${file}: sourceSummary required`);
  if(!String(doc.manager?.fullName||'').trim())errors.push(`${file}: manager fullName required`);
  if(!String(doc.manager?.swosName||'').trim()||String(doc.manager.swosName).length>24)errors.push(`${file}: manager swosName must be 1-24 chars`);
  if(!sourcesOk(doc.manager?.sources))errors.push(`${file}: manager source required`);
  if(!String(doc.formation?.observedFormation||'').trim())errors.push(`${file}: observed formation required`);
  if(!Number.isInteger(doc.formation?.swosTacticCode)||doc.formation.swosTacticCode<0||doc.formation.swosTacticCode>17)errors.push(`${file}: swosTacticCode must be 0-17`);
  else if(formations[doc.formation.swosTacticCode]!==doc.formation.swosFormation)errors.push(`${file}: formation label/code mismatch`);
  if(!sourcesOk(doc.formation?.sources))errors.push(`${file}: formation source required`);
  kitOk(doc.kits?.home,`${file}/home`);
  kitOk(doc.kits?.away,`${file}/away`);
}
if(errors.length)throw new Error(`Club profile evidence validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
console.log(`Club profile evidence validation PASS · ${files.length} complete evidence file(s) · native SWOS translation enforced.`);
