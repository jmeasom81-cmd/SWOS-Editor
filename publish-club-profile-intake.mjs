import fs from 'node:fs';
import path from 'node:path';

const QUEUE='football-db/club-profile-queue.json';
const DIR='football-db/club-profile-evidence';
const OUT='football-db/club-profile-intake.json';
const MANIFEST='football-db/manifest.json';
for(const file of [QUEUE,MANIFEST,path.join(DIR,'schema-v1.json')])if(!fs.existsSync(file))throw new Error(`Club profile intake: missing ${file}.`);
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const evidenceFiles=new Set(fs.readdirSync(DIR).filter(f=>f.endsWith('.json')&&f!=='schema-v1.json').map(f=>f.replace(/\.json$/,'')));
const clubs=(queue.queue||[]).map(c=>({
  order:c.order,clubId:c.clubId,clubName:c.clubName,
  evidenceFile:evidenceFiles.has(c.clubId)?`football-db/club-profile-evidence/${c.clubId}.json`:null,
  promotionReady:evidenceFiles.has(c.clubId),
  status:evidenceFiles.has(c.clubId)?'promotion-ready':'evidence-required'
}));
const ready=clubs.filter(c=>c.promotionReady);
const out={
  schemaVersion:1,season:'2026/27',generatedAt:new Date().toISOString(),
  progress:{profileReadyClubs:queue.totals?.profileReadyClubs||0,profilePendingClubs:clubs.length},
  totals:{clubs:clubs.length,promotionReadyClubs:ready.length,evidenceRequiredClubs:clubs.length-ready.length},
  nextPromotionReady:ready[0]?{clubId:ready[0].clubId,clubName:ready[0].clubName}:null,
  nextEvidenceRequired:clubs.find(c=>!c.promotionReady)?{clubId:clubs.find(c=>!c.promotionReady).clubId,clubName:clubs.find(c=>!c.promotionReady).clubName}:null,
  clubs
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
manifest.resources=manifest.resources||{};manifest.resources.clubProfileIntake=OUT;
manifest.dataModel=manifest.dataModel||{};manifest.dataModel.clubProfilePromotionGuard=true;
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){fs.copyFileSync(OUT,'dist/football-db/club-profile-intake.json');fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');}
console.log(`Club profile intake · ${out.progress.profileReadyClubs}/44 published · ${clubs.length} pending · ${ready.length} promotion-ready.`);
