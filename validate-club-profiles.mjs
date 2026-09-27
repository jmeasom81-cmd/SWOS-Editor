import fs from 'node:fs';

const PROFILES='football-db/club-profiles.json';
const COVERAGE='football-db/coverage.json';
const MANIFEST='football-db/manifest.json';
for(const file of [PROFILES,COVERAGE,MANIFEST])if(!fs.existsSync(file))throw new Error(`Club profile validation: missing ${file}.`);
const profiles=JSON.parse(fs.readFileSync(PROFILES,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const eligible=new Set((coverage.clubs||[]).filter(c=>(c.division===0||c.division===1)&&c.stages?.researchPack?.status==='ready').map(c=>c.id));
const rows=Object.entries(profiles.clubs||{});
if(eligible.size!==44)throw new Error(`Club profile validation: expected 44 eligible clubs, found ${eligible.size}.`);
if(profiles.profileCount!==rows.length)throw new Error('Club profile validation: profileCount mismatch.');
for(const [id,p] of rows){
  if(!eligible.has(id))throw new Error(`Club profile validation: ${id} is not eligible.`);
  if(!p.manager?.swosName||String(p.manager.swosName).length>24)throw new Error(`Club profile validation: ${id} manager invalid.`);
  if(!Number.isInteger(p.formation?.swosTacticCode)||p.formation.swosTacticCode<0||p.formation.swosTacticCode>17)throw new Error(`Club profile validation: ${id} formation invalid.`);
  for(const k of ['home','away'])if(!p.kits?.[k]||!Number.isInteger(p.kits[k].styleCode))throw new Error(`Club profile validation: ${id} ${k} kit invalid.`);
}
if(profiles.safety?.teamWriteReady!==false||profiles.safety?.careerWriteReady!==false||manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false)throw new Error('Club profile validation: binary write lock changed.');
console.log(`Club profile validation PASS · ${rows.length}/44 published profiles · native formation/kit translation · writes locked.`);
