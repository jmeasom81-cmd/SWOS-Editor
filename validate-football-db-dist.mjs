import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT='football-db',DIST='dist/football-db';
const files=['manifest.json','identities.json','research-packs.json','coverage.json','research-queue.json','research-intake.json','validation.json','squad-model.json','schema-v1.json'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const rel of files){
  const src=path.join(ROOT,rel),dst=path.join(DIST,rel);
  if(!fs.existsSync(src)||!fs.existsSync(dst))throw new Error(`Static DB consistency failed: ${rel} missing from source or dist.`);
  const a=sha(src),b=sha(dst);if(a!==b)throw new Error(`Static DB consistency failed: ${rel} SHA mismatch ${a} != ${b}.`);
}
const read=rel=>JSON.parse(fs.readFileSync(path.join(DIST,rel),'utf8'));
const manifest=read('manifest.json'),identities=read('identities.json'),packs=read('research-packs.json'),coverage=read('coverage.json'),queue=read('research-queue.json'),intake=read('research-intake.json'),validation=read('validation.json');
if(manifest.version!=='2026.27-foundation.20')throw new Error(`Static DB consistency failed: manifest ${manifest.version}; expected foundation.20.`);
if(identities.clubCount!==20||identities.playerCount!==375)throw new Error('Static DB consistency failed: identity totals are not 20 clubs / 375 players.');
if(packs.packCount!==20||packs.playerCount!==320)throw new Error('Static DB consistency failed: research totals are not 20 packs / 320 players.');
if(coverage.summary?.identityReady!==20||coverage.summary?.researchReady!==20||coverage.divisions?.find(d=>d.code===0)?.researchReady!==20)throw new Error('Static DB consistency failed: deployed coverage is not 20/20 Premier League research-ready.');
if(queue.totals?.clubs!==0||queue.totals?.stagedPlayers!==0||queue.next!=null)throw new Error('Static DB consistency failed: queue should be empty.');
if(intake.totals?.clubs!==0||intake.totals?.players!==0||intake.next!=null)throw new Error('Static DB consistency failed: intake should be empty.');
if(validation.status!=='pass'||validation.databaseVersion!==manifest.version||validation.totals?.clubs!==20||validation.totals?.players!==320)throw new Error('Static DB consistency failed: validation report is stale or incomplete.');
const publication=read('publication.json');
if(publication.databaseVersion!==manifest.version||publication.resources?.length<files.length)throw new Error('Static DB consistency failed: publication receipt is incomplete.');
console.log(`Static football-db consistency PASS · ${files.length} source/dist hashes match · ${packs.packCount} packs / ${packs.playerCount} players · coverage 20/20`);
