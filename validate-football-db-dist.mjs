import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT='football-db',DIST='dist/football-db';
const files=['manifest.json','identities.json','research-packs.json','coverage.json','research-queue.json','research-intake.json','validation.json','squad-model.json','schema-v1.json'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const rel of files){const src=path.join(ROOT,rel),dst=path.join(DIST,rel);if(!fs.existsSync(src)||!fs.existsSync(dst))throw new Error(`Static DB consistency failed: ${rel} missing from source or dist.`);const a=sha(src),b=sha(dst);if(a!==b)throw new Error(`Static DB consistency failed: ${rel} SHA mismatch ${a} != ${b}.`)}
const read=rel=>JSON.parse(fs.readFileSync(path.join(DIST,rel),'utf8'));
const manifest=read('manifest.json'),identities=read('identities.json'),packs=read('research-packs.json'),coverage=read('coverage.json'),queue=read('research-queue.json'),intake=read('research-intake.json'),validation=read('validation.json');
const plIdentity=identities.divisionCoverage?.premierLeague||{};
if(plIdentity.clubs!==20||plIdentity.players!==375)throw new Error('Static DB consistency failed: Premier League identity foundation is not 20 clubs / 375 players.');
if(manifest.coverage?.premierLeague?.identityReadyClubs!==20||manifest.coverage?.premierLeague?.identityPlayers!==375)throw new Error('Static DB consistency failed: manifest Premier League identity totals regressed.');
if(manifest.coverage?.englandClubs?.identityReadyClubs!==identities.clubCount||manifest.coverage?.englandClubs?.identityPlayers!==identities.playerCount)throw new Error('Static DB consistency failed: manifest England identity totals do not match identity feed.');

const divisionById=new Map((coverage.clubs||[]).map(c=>[c.id,c.division]));
let plResearch=0,champResearch=0,otherResearch=0,totalResearchPlayers=0;
for(const [id,club] of Object.entries(packs.clubs||{})){
  const count=Object.keys(club.players||{}).length;if(count!==16)throw new Error(`Static DB consistency failed: ${id} research pack has ${count} players, expected 16.`);
  totalResearchPlayers+=count;const d=divisionById.get(id);if(d===0)plResearch++;else if(d===1)champResearch++;else otherResearch++;
}
if(plResearch!==20)throw new Error(`Static DB consistency failed: Premier League research foundation regressed to ${plResearch}/20.`);
if(otherResearch!==0)throw new Error(`Static DB consistency failed: unexpected lower-division research packs (${otherResearch}).`);
if(packs.packCount!==plResearch+champResearch||packs.playerCount!==totalResearchPlayers||totalResearchPlayers!==packs.packCount*16)throw new Error('Static DB consistency failed: research pack totals are inconsistent.');
const plCoverage=coverage.divisions?.find(d=>d.code===0),champCoverage=coverage.divisions?.find(d=>d.code===1);
if(coverage.summary?.identityReady!==identities.clubCount||coverage.summary?.researchReady!==packs.packCount||plCoverage?.identityReady!==20||plCoverage?.researchReady!==20||champCoverage?.researchReady!==champResearch)throw new Error('Static DB consistency failed: deployed coverage disagrees with research/identity resources.');
if(queue.totals?.clubs!==0||queue.totals?.stagedPlayers!==0||queue.next!=null)throw new Error('Static DB consistency failed: Premier League research queue should be empty.');
if(intake.totals?.clubs!==0||intake.totals?.players!==0||intake.next!=null)throw new Error('Static DB consistency failed: Premier League research intake should be empty.');
if(validation.status!=='pass'||validation.totals?.clubs!==20||validation.totals?.players!==320||validation.totals?.identityClubs!==identities.clubCount||validation.totals?.identityPlayers!==identities.playerCount)throw new Error('Static DB consistency failed: legacy Premier League/identity validation report is incomplete.');

const publication=read('publication.json');if(publication.databaseVersion!==manifest.version||publication.resources?.length<files.length)throw new Error('Static DB consistency failed: publication receipt is incomplete.');
if(fs.existsSync(path.join(DIST,'identity-expansion-queue.json'))){const iq=read('identity-expansion-queue.json'),ii=read('identity-intake.json');if(iq.totals?.identityReady!==champCoverage?.identityReady||ii.totals?.identityReady!==champCoverage?.identityReady)throw new Error('Static DB consistency failed: Championship identity queue/intake disagree with coverage.');}

const championshipPipeline=['championship-research-queue.json','championship-research-intake.json','championship-research-evidence/schema-v1.json'];
const championshipPipelinePresent=championshipPipeline.filter(rel=>fs.existsSync(path.join(ROOT,rel)));
const championshipSchemaOnly=championshipPipelinePresent.length===1&&championshipPipelinePresent[0]==='championship-research-evidence/schema-v1.json';
if(championshipPipelinePresent.length>0&&!championshipSchemaOnly&&championshipPipelinePresent.length!==championshipPipeline.length)throw new Error(`Static DB consistency failed: partial Championship research pipeline (${championshipPipelinePresent.join(', ')}).`);
if(championshipPipelinePresent.length===championshipPipeline.length){
  for(const rel of championshipPipeline){const src=path.join(ROOT,rel),dst=path.join(DIST,rel);if(!fs.existsSync(src)||!fs.existsSync(dst))throw new Error(`Static DB consistency failed: Championship research resource ${rel} missing from source or dist.`);if(sha(src)!==sha(dst))throw new Error(`Static DB consistency failed: Championship research resource ${rel} SHA mismatch.`);}
  const cq=read('championship-research-queue.json'),ci=read('championship-research-intake.json');
  const pending=24-champResearch,players=pending*16,cells=players*3;
  if(champCoverage?.identityReady!==24)throw new Error('Static DB consistency failed: Championship research pipeline requires all 24 identity-ready clubs.');
  if(cq.progress?.researchReadyClubs!==champResearch||cq.totals?.clubs!==pending||cq.totals?.stagedPlayers!==players||cq.totals?.requiredEvidenceCells!==cells)throw new Error('Static DB consistency failed: Championship research queue progress/totals are stale.');
  if(ci.progress?.researchReadyClubs!==champResearch||ci.totals?.clubs!==pending||ci.totals?.players!==players||ci.totals?.requiredEvidenceCells!==cells||ci.progress?.researchPendingClubs!==pending)throw new Error('Static DB consistency failed: Championship research intake progress/totals are stale.');
  if(ci.totals?.requiredEvidenceCellsComplete<0||ci.totals?.requiredEvidenceCellsComplete>cells||ci.totals?.promotionReadyClubs<0||ci.totals?.promotionReadyClubs>pending)throw new Error('Static DB consistency failed: Championship evidence completion counters are invalid.');
  if(champResearch===0&&cq.next?.clubId!=='birmingham-city')throw new Error('Static DB consistency failed: Championship research foundation must begin with Birmingham City.');
  if(champResearch===24&&(cq.next!==null||pending!==0))throw new Error('Static DB consistency failed: completed Championship research should have no pending queue.');
  const published=new Set((publication.resources||[]).map(r=>r.path));for(const rel of championshipPipeline)if(!published.has(rel))throw new Error(`Static DB consistency failed: publication receipt omits ${rel}.`);
}

const expansionRel='research-expansion-validation.json',expSrc=path.join(ROOT,expansionRel),expDst=path.join(DIST,expansionRel);
if(fs.existsSync(expSrc)){
  if(!fs.existsSync(expDst)||sha(expSrc)!==sha(expDst))throw new Error('Static DB consistency failed: research expansion validation source/dist mismatch.');
  const expansion=read(expansionRel);
  if(expansion.status!=='pass'||expansion.databaseVersion!==manifest.version||expansion.divisions?.premierLeague?.researchReady!==20||expansion.divisions?.championship?.researchReady!==champResearch||expansion.totals?.researchClubs!==packs.packCount||expansion.totals?.researchPlayers!==packs.playerCount)throw new Error('Static DB consistency failed: research expansion validation is stale.');
  if(!(publication.resources||[]).some(r=>r.path===expansionRel))throw new Error('Static DB consistency failed: publication receipt omits research expansion validation.');
}else if(validation.databaseVersion!==manifest.version){
  throw new Error('Static DB consistency failed: legacy validation version differs from manifest before research expansion validation exists.');
}
console.log(`Static football-db consistency PASS · ${files.length} core hashes match · England identities ${identities.clubCount}/92 · PL research 20/20 · Championship research ${champResearch}/24`);
