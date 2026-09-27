import fs from 'node:fs';

const INTAKE='football-db/club-profile-intake.json';
const PROFILES='football-db/club-profiles.json';
const MANIFEST='football-db/manifest.json';
for(const file of [INTAKE,PROFILES,MANIFEST])if(!fs.existsSync(file))throw new Error(`Club profile promotion: missing ${file}.`);
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const profiles=JSON.parse(fs.readFileSync(PROFILES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const ready=(intake.clubs||[]).find(c=>c.promotionReady);
if(!ready){console.log('Club profile promotion · no club is currently promotion-ready');process.exit(0);}
if(profiles.clubs?.[ready.clubId])throw new Error(`Club profile promotion: ${ready.clubName} already published.`);
const evidence=JSON.parse(fs.readFileSync(ready.evidenceFile,'utf8'));
profiles.clubs=profiles.clubs||{};
profiles.clubs[ready.clubId]={
  clubId:ready.clubId,
  clubName:ready.clubName,
  evidenceSnapshot:evidence.snapshot,
  sourceSummary:evidence.sourceSummary,
  manager:evidence.manager,
  formation:evidence.formation,
  kits:evidence.kits
};
profiles.profileCount=Object.keys(profiles.clubs).length;
profiles.snapshot=evidence.snapshot>String(profiles.snapshot||'')?evidence.snapshot:profiles.snapshot;
profiles.safety={teamWriteReady:false,careerWriteReady:false,note:'Profile publication does not enable binary writes.'};
fs.writeFileSync(PROFILES,JSON.stringify(profiles,null,2)+'\n','utf8');

manifest.resources=manifest.resources||{};manifest.resources.clubProfiles=PROFILES;
manifest.coverage=manifest.coverage||{};manifest.coverage.englandClubs=manifest.coverage.englandClubs||{};
manifest.coverage.englandClubs.clubProfileReady=profiles.profileCount;
manifest.dataRevisions=manifest.dataRevisions||{};manifest.dataRevisions.clubProfiles=profiles.profileCount;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Club profile promotion published '));
manifest.notes.push(`Club profile promotion published ${ready.clubId}; ${profiles.profileCount}/44 Premier League + Championship profiles are ready.`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){fs.copyFileSync(PROFILES,'dist/football-db/club-profiles.json');fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');}
console.log(`Club profile promotion complete · ${ready.clubId} · ${profiles.profileCount}/44 profiles · binary writes locked.`);
