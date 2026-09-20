import fs from 'node:fs';
import path from 'node:path';

const IDENTITY_DIR='football-db/league-two-identity-evidence';
const RESEARCH_DIR='football-db/league-two-research-evidence';
const OUT='football-db/league-two-research-status.json';

for(const dir of [IDENTITY_DIR,RESEARCH_DIR])if(!fs.existsSync(dir))throw new Error(`League Two status: missing ${dir}.`);

const identityFiles=fs.readdirSync(IDENTITY_DIR).filter(f=>f.endsWith('.json')&&f!=='schema-v1.json').sort();
if(identityFiles.length!==24)throw new Error(`League Two status: expected 24 identity files, found ${identityFiles.length}.`);

const clubs=identityFiles.map((file,index)=>{
  const identity=JSON.parse(fs.readFileSync(path.join(IDENTITY_DIR,file),'utf8'));
  const clubId=identity.clubId||file.replace(/\.json$/,'');
  const researchPath=path.join(RESEARCH_DIR,file);
  const researchReady=fs.existsSync(researchPath);
  let researchedPlayers=0;
  if(researchReady){
    const evidence=JSON.parse(fs.readFileSync(researchPath,'utf8'));
    const expected=new Set((identity.players||[]).map(p=>p.footballName));
    const actual=Object.keys(evidence.players||{});
    if(expected.size!==16||actual.length!==16||actual.some(name=>!expected.has(name)))throw new Error(`League Two status: ${clubId} research evidence does not match its exact identity 16.`);
    researchedPlayers=actual.length;
  }
  return {order:index+1,clubId,researchReady,researchPlayers:researchedPlayers};
});

const ready=clubs.filter(c=>c.researchReady);
const pending=clubs.filter(c=>!c.researchReady);
const out={
  schemaVersion:1,
  season:'2026/27',
  generatedAt:new Date().toISOString(),
  division:{code:3,name:'League Two',clubs:24},
  progress:{
    identityReadyClubs:24,
    researchReadyClubs:ready.length,
    researchPendingClubs:pending.length,
    researchedPlayers:ready.reduce((n,c)=>n+c.researchPlayers,0)
  },
  next:pending[0]?{clubId:pending[0].clubId,order:pending[0].order}:null,
  readyClubIds:ready.map(c=>c.clubId),
  pendingClubIds:pending.map(c=>c.clubId),
  policy:{
    exactIdentity16:true,
    noFabricatedValues:true,
    unavailableMarketValueEncodedAsZero:true,
    teamWritesLocked:true,
    careerWritesLocked:true
  },
  clubs
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
console.log(`League Two research status · ${ready.length}/24 clubs · ${out.progress.researchedPlayers} players · next ${out.next?.clubId||'complete'} · TEAM/CAR writes locked.`);
