import fs from 'node:fs';

const COVERAGE='football-db/coverage.json';
const IDENTITIES='football-db/identities.json';
const OUT='football-db/identity-expansion-queue.json';
for(const file of [COVERAGE,IDENTITIES])if(!fs.existsSync(file))throw new Error(`Identity expansion queue: missing ${file}.`);
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const rows=(coverage.clubs||[])
  .filter(c=>c.division===1)
  .sort((a,b)=>a.name.localeCompare(b.name));
if(rows.length!==24)throw new Error(`Identity expansion queue: expected 24 Championship clubs, found ${rows.length}.`);
const queue=rows.map((c,i)=>({
  order:i+1,
  clubId:c.id,
  clubName:c.name,
  division:1,
  divisionName:'Championship',
  status:Array.isArray(identities.clubs?.[c.id])&&identities.clubs[c.id].length?'identity-ready':'identity-evidence-required',
  publishedPlayers:Array.isArray(identities.clubs?.[c.id])?identities.clubs[c.id].length:0,
  requiredSelectedPlayers:16,
  requiredFields:['footballName','group','nationality','source'],
  optionalFields:['shirt','notes']
}));
const pending=queue.filter(c=>c.status!=='identity-ready');
const out={
  schemaVersion:1,
  season:'2026/27',
  generatedAt:new Date().toISOString(),
  division:{code:1,name:'Championship',clubs:24},
  policy:{
    selectedPlayersPerClub:16,
    identityEvidenceRequired:true,
    sourceRequiredPerPlayer:true,
    minimumRoleMix:{Goalkeeper:2,Defender:4,Midfielder:4,Forward:2},
    noFabricatedIdentities:true,
    autoPromote:false,
    researchRemainsBlockedUntilIdentityReady:true,
    binaryWritesRemainLocked:true
  },
  totals:{clubs:queue.length,identityReady:queue.length-pending.length,evidenceRequired:pending.length},
  next:pending.length?{clubId:pending[0].clubId,clubName:pending[0].clubName}:null,
  queue
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
if(fs.existsSync('dist')){fs.mkdirSync('dist/football-db',{recursive:true});fs.copyFileSync(OUT,'dist/football-db/identity-expansion-queue.json');}
console.log(`Published Championship identity expansion queue · ${out.totals.identityReady}/24 identity ready · ${out.totals.evidenceRequired} evidence required · next ${out.next?.clubName||'complete'}`);
