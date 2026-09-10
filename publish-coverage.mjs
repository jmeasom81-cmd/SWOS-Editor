import fs from 'node:fs';

const SOURCE='index.html';
const OUT='football-db/coverage.json';
const readJson=(path)=>{
  if(!fs.existsSync(path))throw new Error(`Coverage publisher failed: missing ${path}`);
  try{return JSON.parse(fs.readFileSync(path,'utf8'))}
  catch(e){throw new Error(`Coverage publisher failed: invalid JSON in ${path}: ${e.message}`)}
};
if(!fs.existsSync(SOURCE))throw new Error('Coverage publisher failed: index.html is missing.');
const html=fs.readFileSync(SOURCE,'utf8');

function extractBalanced(marker,open,close,label){
  const markerAt=html.indexOf(marker);
  if(markerAt<0)throw new Error(`Coverage publisher failed: ${label} marker not found.`);
  const start=html.indexOf(open,markerAt+marker.length);
  if(start<0)throw new Error(`Coverage publisher failed: ${label} opening ${open} not found.`);
  let depth=0,quote=null,escaped=false;
  for(let i=start;i<html.length;i++){
    const c=html[i];
    if(quote){
      if(escaped){escaped=false;continue}
      if(c==='\\'){escaped=true;continue}
      if(c===quote)quote=null;
      continue;
    }
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c===open)depth++;
    else if(c===close){depth--;if(depth===0)return html.slice(start,i+1)}
  }
  throw new Error(`Coverage publisher failed: ${label} closing ${close} not found.`);
}

const plLiteral=extractBalanced('const PL_2627_PACK=','{','}','Premier League pack');
let plPack;
try{plPack=Function(`"use strict";return (${plLiteral});`)()}
catch(e){throw new Error(`Coverage publisher failed: Premier League pack could not be parsed: ${e.message}`)}
const eflLiteral=extractBalanced('const ENGLAND_2627_EFL_CLUBS=','[',']','EFL club list');
let efl;
try{efl=JSON.parse(eflLiteral)}
catch(e){throw new Error(`Coverage publisher failed: EFL club list is not valid JSON: ${e.message}`)}

const identities=readJson('football-db/identities.json');
const packs=readJson('football-db/research-packs.json');
const manifest=readJson('football-db/manifest.json');
const divisions=[
  {code:0,name:'Premier League',target:20},
  {code:1,name:'Championship',target:24},
  {code:2,name:'League One',target:24},
  {code:3,name:'League Two',target:24}
];
const all=[...(plPack.clubs||[]).map(c=>({...c,division:0})),...efl];
if(all.length!==92)throw new Error(`Coverage publisher failed: expected 92 England clubs, found ${all.length}.`);
const ids=all.map(c=>c.id),unique=new Set(ids);
if(unique.size!==92)throw new Error(`Coverage publisher failed: club IDs are not unique (${unique.size}/92 unique).`);
for(const d of divisions){
  const actual=all.filter(c=>c.division===d.code).length;
  if(actual!==d.target)throw new Error(`Coverage publisher failed: ${d.name} has ${actual} clubs; expected ${d.target}.`);
}
for(const id of Object.keys(identities.clubs||{}))if(!unique.has(id))throw new Error(`Coverage publisher failed: identity club ${id} is not in the 92-club structure.`);
for(const id of Object.keys(packs.clubs||{}))if(!unique.has(id))throw new Error(`Coverage publisher failed: research-pack club ${id} is not in the 92-club structure.`);

function researchCount(id){const club=packs.clubs?.[id];return club?Object.keys(club.players||{}).length:0}
const writeLocked=manifest.installation?.teamWriteReady!==true;
const clubs=all.map(c=>{
  const identityCount=Array.isArray(identities.clubs?.[c.id])?identities.clubs[c.id].length:0;
  const packPlayers=researchCount(c.id);
  const researchReady=packPlayers===16;
  const identityReady=identityCount>0;
  let nextStep='Verify current squad identity';
  if(identityReady&&!researchReady)nextStep='Build 16-player research pack';
  if(researchReady)nextStep='Research manager, formation and kits';
  return {
    id:c.id,
    name:c.name,
    division:c.division,
    divisionName:divisions.find(d=>d.code===c.division)?.name||`Division ${c.division}`,
    stages:{
      identity:{status:identityReady?'ready':'pending',players:identityCount},
      researchPack:{status:researchReady?'ready':packPlayers>0?'attention':'pending',players:packPlayers},
      swos16:{status:researchReady?'builder-ready':'blocked',players:researchReady?16:0},
      manager:{status:'pending'},
      formation:{status:'pending'},
      kits:{status:'pending'},
      installer:{status:writeLocked?'locked':'review-required'}
    },
    nextStep
  };
});

const summary={
  totalClubs:clubs.length,
  structureMapped:manifest.coverage?.englandClubs?.mapped||0,
  identityReady:clubs.filter(c=>c.stages.identity.status==='ready').length,
  researchReady:clubs.filter(c=>c.stages.researchPack.status==='ready').length,
  swos16BuilderReady:clubs.filter(c=>c.stages.swos16.status==='builder-ready').length,
  managerReady:0,
  formationReady:0,
  kitsReady:0,
  installerReady:writeLocked?0:clubs.length,
  installerLocked:writeLocked
};
if(summary.identityReady!==identities.clubCount)throw new Error(`Coverage publisher failed: identity summary ${summary.identityReady} does not match identity feed ${identities.clubCount}.`);
if(summary.researchReady!==packs.packCount)throw new Error(`Coverage publisher failed: research summary ${summary.researchReady} does not match research feed ${packs.packCount}.`);

const divisionSummary=divisions.map(d=>{
  const rows=clubs.filter(c=>c.division===d.code);
  return {
    code:d.code,name:d.name,target:d.target,
    clubs:rows.length,
    identityReady:rows.filter(c=>c.stages.identity.status==='ready').length,
    researchReady:rows.filter(c=>c.stages.researchPack.status==='ready').length,
    swos16BuilderReady:rows.filter(c=>c.stages.swos16.status==='builder-ready').length
  };
});

const out={
  schemaVersion:1,
  season:manifest.season,
  databaseVersion:manifest.version,
  generatedAt:new Date().toISOString(),
  source:'SWOS Studio England 2026/27 structure + published football database resources',
  summary,
  divisions:divisionSummary,
  clubs,
  safety:{
    teamWriteReady:manifest.installation?.teamWriteReady===true,
    careerWriteReady:manifest.installation?.careerWriteReady===true,
    note:'Coverage is planning/status data only. It never writes TEAM.* or .CAR files.'
  }
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
console.log(`Published club coverage · ${summary.totalClubs} clubs · ${summary.identityReady} identity ready · ${summary.researchReady} research ready · TEAM installer ${summary.installerLocked?'LOCKED':'REVIEW REQUIRED'}`);
