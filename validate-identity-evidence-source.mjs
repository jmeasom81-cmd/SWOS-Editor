import fs from 'node:fs';
import path from 'node:path';

const DIR='football-db/identity-evidence';
const SCHEMA=path.join(DIR,'schema-v1.json');
const EXPECTED_SEASON='2026/27';
const ROLE_MIN={Goalkeeper:2,Defender:4,Midfielder:4,Forward:2};
const VALID_GROUPS=new Set(Object.keys(ROLE_MIN));

if(!fs.existsSync(DIR)||!fs.statSync(DIR).isDirectory())throw new Error('Identity evidence source validation: evidence directory is missing.');
if(!fs.existsSync(SCHEMA))throw new Error('Identity evidence source validation: schema-v1.json is missing.');

const files=fs.readdirSync(DIR).filter(name=>name.endsWith('.json')&&name!=='schema-v1.json').sort();
if(!files.length)throw new Error('Identity evidence source validation: no club evidence files found.');

const errors=[];
let players=0;
for(const name of files){
  const file=path.join(DIR,name);
  let data;
  try{data=JSON.parse(fs.readFileSync(file,'utf8'));}
  catch(e){errors.push(`${name}: invalid JSON (${e.message})`);continue;}
  const expectedId=name.replace(/\.json$/,'');
  if(data.schemaVersion!==1)errors.push(`${name}: schemaVersion must be 1`);
  if(data.season!==EXPECTED_SEASON)errors.push(`${name}: season must be ${EXPECTED_SEASON}`);
  if(data.clubId!==expectedId)errors.push(`${name}: clubId ${data.clubId||'(missing)'} must match filename ${expectedId}`);
  if(!/^2026-\d{2}-\d{2}$/.test(String(data.snapshot||'')))errors.push(`${name}: invalid snapshot ${data.snapshot||'(missing)'}`);
  if(!String(data.sourceSummary||'').trim())errors.push(`${name}: sourceSummary is required`);
  if(!Array.isArray(data.players)||data.players.length!==16){errors.push(`${name}: expected exactly 16 players, found ${Array.isArray(data.players)?data.players.length:'non-array'}`);continue;}
  players+=data.players.length;
  const seenNames=new Set(),seenShirts=new Set(),roles={Goalkeeper:0,Defender:0,Midfielder:0,Forward:0};
  data.players.forEach((p,i)=>{
    const at=`${name} player ${i+1}`;
    const footballName=String(p?.footballName||'').trim();
    if(!footballName)errors.push(`${at}: footballName is required`);
    const nk=footballName.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    if(nk&&seenNames.has(nk))errors.push(`${name}: duplicate footballName ${footballName}`);else if(nk)seenNames.add(nk);
    if(!VALID_GROUPS.has(p?.group))errors.push(`${at}: invalid group ${p?.group||'(missing)'}`);else roles[p.group]++;
    if(!String(p?.nationality||'').trim())errors.push(`${at}: nationality is required`);
    if(!String(p?.source||'').trim())errors.push(`${at}: source is required`);
    if(p?.shirt!==null&&p?.shirt!==undefined){
      if(!Number.isInteger(p.shirt)||p.shirt<1||p.shirt>99)errors.push(`${at}: shirt must be an integer 1-99 or null`);
      else if(seenShirts.has(p.shirt))errors.push(`${name}: duplicate shirt number ${p.shirt}`);else seenShirts.add(p.shirt);
    }
    const allowed=new Set(['footballName','group','nationality','shirt','source','notes']);
    for(const key of Object.keys(p||{}))if(!allowed.has(key))errors.push(`${at}: unexpected field ${key}`);
  });
  for(const [role,min] of Object.entries(ROLE_MIN))if(roles[role]<min)errors.push(`${name}: ${role} count ${roles[role]} is below minimum ${min}`);
  const allowedTop=new Set(['schemaVersion','season','clubId','snapshot','sourceSummary','players']);
  for(const key of Object.keys(data))if(!allowedTop.has(key))errors.push(`${name}: unexpected top-level field ${key}`);
}

if(errors.length)throw new Error(`Identity evidence source validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
console.log(`Identity evidence source validation PASS · ${files.length} Championship evidence files · ${players} selected player records · exact-16 and role gates clean.`);
