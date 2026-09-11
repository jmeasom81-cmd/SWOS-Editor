import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT='football-db',DIST='dist/football-db';
const files=['manifest.json','identities.json','research-packs.json','coverage.json','research-queue.json','research-intake.json','validation.json','squad-model.json','schema-v1.json'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const rel of files){const src=path.join(ROOT,rel),dst=path.join(DIST,rel);if(!fs.existsSync(src)||!fs.existsSync(dst))throw new Error(`Static DB consistency failed: ${rel} missing from source or dist.`);const a=sha(src),b=sha(dst);if(a!==b)throw new Error(`Static DB consistency failed: ${rel} SHA mismatch ${a} != ${b}.`)}
const read=rel=>JSON.parse(fs.readFileSync(path.join(DIST,rel),'utf8'));
const manifest=read('manifest.json'),identities=read('identities.json'),packs=read('research-packs.json'),coverage=read('coverage.json'),queue=read('research-queue.json'),intake=read('research-intake.json'),validation=read('validation.json');
const pl=identities.divisionCoverage?.premierLeague||{};
if(pl.clubs!==20||pl.players!==375)throw new Error('Static DB consistency failed: Premier League identity foundation is not 20 clubs / 375 players.');
if(manifest.coverage?.premierLeague?.identityReadyClubs!==20||manifest.coverage?.premierLeague?.identityPlayers!==375)throw new Error('Static DB consistency failed: manifest Premier League identity totals regressed.');
if(manifest.coverage?.englandClubs?.identityReadyClubs!==identities.clubCount||manifest.coverage?.englandClubs?.identityPlayers!==identities.playerCount)throw new Error('Static DB consistency failed: manifest England identity totals do not match identity feed.');
if(packs.packCount!==20||packs.playerCount!==320)throw new Error('Static DB consistency failed: Premier League research totals are not 20 packs / 320 players.');
const plCoverage=coverage.divisions?.find(d=>d.code===0);if(coverage.summary?.identityReady!==identities.clubCount||coverage.summary?.researchReady!==20||plCoverage?.identityReady!==20||plCoverage?.researchReady!==20)throw new Error('Static DB consistency failed: deployed coverage disagrees with identities or Premier League completion.');
if(queue.totals?.clubs!==0||queue.totals?.stagedPlayers!==0||queue.next!=null)throw new Error('Static DB consistency failed: Premier League research queue should be empty.');
if(intake.totals?.clubs!==0||intake.totals?.players!==0||intake.next!=null)throw new Error('Static DB consistency failed: Premier League research intake should be empty.');
if(validation.status!=='pass'||validation.databaseVersion!==manifest.version||validation.totals?.clubs!==20||validation.totals?.players!==320||validation.totals?.identityClubs!==identities.clubCount||validation.totals?.identityPlayers!==identities.playerCount)throw new Error('Static DB consistency failed: validation report is stale or incomplete.');
const publication=read('publication.json');if(publication.databaseVersion!==manifest.version||publication.resources?.length<files.length)throw new Error('Static DB consistency failed: publication receipt is incomplete.');
if(fs.existsSync(path.join(DIST,'identity-expansion-queue.json'))){const iq=read('identity-expansion-queue.json'),ii=read('identity-intake.json');const champ=coverage.divisions?.find(d=>d.code===1);if(iq.totals?.identityReady!==champ?.identityReady||ii.totals?.identityReady!==champ?.identityReady)throw new Error('Static DB consistency failed: Championship identity queue/intake disagree with coverage.');}

const championshipPipeline=['championship-research-queue.json','championship-research-intake.json','championship-research-evidence/schema-v1.json'];
if(championshipPipeline.some(rel=>fs.existsSync(path.join(ROOT,rel)))){
  for(const rel of championshipPipeline){
    const src=path.join(ROOT,rel),dst=path.join(DIST,rel);
    if(!fs.existsSync(src)||!fs.existsSync(dst))throw new Error(`Static DB consistency failed: Championship research resource ${rel} missing from source or dist.`);
    if(sha(src)!==sha(dst))throw new Error(`Static DB consistency failed: Championship research resource ${rel} SHA mismatch.`);
  }
  const cq=read('championship-research-queue.json'),ci=read('championship-research-intake.json'),champ=coverage.divisions?.find(d=>d.code===1);
  if(champ?.identityReady!==24||champ?.researchReady!==0)throw new Error('Static DB consistency failed: Championship research staging requires 24/24 identity-ready and 0/24 research-ready.');
  if(cq.totals?.clubs!==24||cq.totals?.stagedPlayers!==384||cq.totals?.requiredEvidenceCells!==1152||cq.next?.clubId!=='birmingham-city')throw new Error('Static DB consistency failed: Championship research queue must contain 24 clubs / 384 players / 1152 cells with Birmingham City first.');
  if(ci.totals?.clubs!==24||ci.totals?.players!==384||ci.totals?.requiredEvidenceCells!==1152||ci.totals?.requiredEvidenceCellsComplete!==0||ci.totals?.promotionReadyClubs!==0||ci.nextEvidenceRequired?.clubId!=='birmingham-city')throw new Error('Static DB consistency failed: Championship research intake foundation is not cleanly staged at 0/1152 evidence cells.');
  const published=new Set((publication.resources||[]).map(r=>r.path));
  for(const rel of championshipPipeline)if(!published.has(rel))throw new Error(`Static DB consistency failed: publication receipt omits ${rel}.`);
}
console.log(`Static football-db consistency PASS · ${files.length} core hashes match · England identities ${identities.clubCount}/92 · PL research 20/20${fs.existsSync(path.join(DIST,'championship-research-queue.json'))?' · Championship research staged 24/24 clubs':''}`);
