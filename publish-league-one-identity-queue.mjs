import fs from 'node:fs';

const COVERAGE='football-db/coverage.json',IDENTITIES='football-db/identities.json',OUT='football-db/league-one-identity-expansion-queue.json';
for(const file of [COVERAGE,IDENTITIES])if(!fs.existsSync(file))throw new Error(`League One identity queue: missing ${file}.`);
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8')),identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const rows=(coverage.clubs||[]).filter(c=>c.division===2).sort((a,b)=>a.name.localeCompare(b.name));
if(rows.length!==24)throw new Error(`League One identity queue: expected 24 clubs; found ${rows.length}.`);
const queue=rows.map((c,i)=>({order:i+1,clubId:c.id,clubName:c.name,division:2,divisionName:'League One',status:Array.isArray(identities.clubs?.[c.id])&&identities.clubs[c.id].length?'identity-ready':'identity-evidence-required',publishedPlayers:Array.isArray(identities.clubs?.[c.id])?identities.clubs[c.id].length:0,requiredSelectedPlayers:16,requiredFields:['footballName','group','nationality','source'],optionalFields:['shirt','notes']}));
const pending=queue.filter(c=>c.status!=='identity-ready');
const out={schemaVersion:1,season:'2026/27',generatedAt:new Date().toISOString(),division:{code:2,name:'League One',clubs:24},status:pending.length?'active':'complete',policy:{selectedPlayersPerClub:16,identityEvidenceRequired:true,sourceRequiredPerPlayer:true,minimumRoleMix:{Goalkeeper:2,Defender:4,Midfielder:4,Forward:2},noFabricatedIdentities:true,autoPromote:false,researchRemainsBlockedUntilIdentityReady:true,binaryWritesRemainLocked:true},totals:{clubs:24,identityReady:24-pending.length,evidenceRequired:pending.length},next:pending[0]?{clubId:pending[0].clubId,clubName:pending[0].clubName}:null,queue};
if(out.totals.identityReady===0&&out.next?.clubId!=='afc-wimbledon')throw new Error(`League One identity queue: foundation must begin with AFC Wimbledon; found ${out.next?.clubName||'none'}.`);
if(out.totals.identityReady===24&&(out.next!==null||out.status!=='complete'))throw new Error('League One identity queue: complete division must close cleanly.');
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
console.log(`League One identity queue · ${out.totals.identityReady}/24 ready · ${out.totals.evidenceRequired} evidence required · next ${out.next?.clubName||'complete'} · binary writes locked.`);
