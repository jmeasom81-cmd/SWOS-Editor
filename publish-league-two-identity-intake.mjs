import fs from 'node:fs';
import path from 'node:path';

const QUEUE='football-db/league-two-identity-expansion-queue.json',DIR='football-db/league-two-identity-evidence',OUT='football-db/league-two-identity-intake.json';
if(!fs.existsSync(QUEUE))throw new Error('League Two identity intake: queue is missing.');
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8')),minimum={Goalkeeper:2,Defender:4,Midfielder:4,Forward:2},allowed=Object.keys(minimum),evidence={};
for(const file of fs.readdirSync(DIR).filter(f=>f.endsWith('.json')&&f!=='schema-v1.json').sort()){const doc=JSON.parse(fs.readFileSync(path.join(DIR,file),'utf8'));if(doc.schemaVersion!==1||doc.season!=='2026/27'||!doc.clubId||!Array.isArray(doc.players))throw new Error(`${file}: invalid League Two identity evidence envelope.`);if(evidence[doc.clubId])throw new Error(`${file}: duplicate evidence for ${doc.clubId}.`);evidence[doc.clubId]={...doc,file};}
const clubs=[];let evidencePlayers=0,completeClubs=0;
for(const q of queue.queue||[]){
  const published=q.status==='identity-ready',ev=evidence[q.clubId]||null,errors=[],players=ev?.players||[],seen=new Set(),roles={Goalkeeper:0,Defender:0,Midfielder:0,Forward:0};
  for(const p of players){const name=String(p?.footballName||'').trim(),key=name.toLocaleLowerCase('en');if(!name)errors.push('blank footballName');else if(seen.has(key))errors.push(`duplicate footballName ${name}`);else seen.add(key);if(!allowed.includes(p?.group))errors.push(`${name||'player'} invalid group ${p?.group}`);else roles[p.group]++;if(!String(p?.nationality||'').trim())errors.push(`${name||'player'} missing nationality`);if(p?.shirt!=null&&(!Number.isInteger(p.shirt)||p.shirt<1||p.shirt>99))errors.push(`${name||'player'} invalid shirt`);if(!String(p?.source||'').trim())errors.push(`${name||'player'} missing source`);}
  if(ev&&players.length!==16)errors.push(`expected exactly 16 players; found ${players.length}`);if(ev)for(const [group,min] of Object.entries(minimum))if(roles[group]<min)errors.push(`${group} minimum ${min}; found ${roles[group]}`);
  const evidenceComplete=!!ev&&errors.length===0&&players.length===16;if(evidenceComplete){completeClubs++;evidencePlayers+=16;}
  clubs.push({order:q.order,clubId:q.clubId,clubName:q.clubName,published,evidenceFile:ev?.file||null,evidenceComplete,promotionReady:!published&&evidenceComplete,status:published?'identity-ready':evidenceComplete?'promotion-ready':ev?'attention':'evidence-required',playerCount:players.length,roleCounts:roles,errors,players:evidenceComplete?players:[]});
}
const promotionReady=clubs.filter(c=>c.promotionReady),next=clubs.find(c=>!c.published)||null;
const out={schemaVersion:1,season:'2026/27',generatedAt:new Date().toISOString(),status:next?'active':'complete',policy:{exactly16:true,minimumRoleMix:minimum,uniqueFootballNames:true,sourceRequiredPerPlayer:true,noFabricatedIdentities:true,autoPromote:false,binaryWritesRemainLocked:true},totals:{clubs:24,identityReady:clubs.filter(c=>c.published).length,evidenceCompleteClubs:completeClubs,evidencePlayers,promotionReadyClubs:promotionReady.length},next:next?{clubId:next.clubId,clubName:next.clubName,status:next.status}:null,promotionReadyClubIds:promotionReady.map(c=>c.clubId),clubs};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
console.log(`League Two identity intake · ${out.totals.identityReady}/24 published · ${out.totals.promotionReadyClubs} promotion-ready · next ${out.next?.clubName||'complete'}.`);
