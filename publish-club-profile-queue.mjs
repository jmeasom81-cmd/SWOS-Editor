import fs from 'node:fs';

const COVERAGE='football-db/coverage.json';
const PROFILES='football-db/club-profiles.json';
const MANIFEST='football-db/manifest.json';
const OUT='football-db/club-profile-queue.json';
for(const file of [COVERAGE,PROFILES,MANIFEST])if(!fs.existsSync(file))throw new Error(`Club profile queue: missing ${file}.`);

const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const profiles=JSON.parse(fs.readFileSync(PROFILES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));

const eligible=(coverage.clubs||[])
  .filter(c=>(c.division===0||c.division===1)&&c.stages?.researchPack?.status==='ready')
  .sort((a,b)=>a.division-b.division||a.name.localeCompare(b.name));
if(eligible.length!==44)throw new Error(`Club profile queue: expected 44 research-ready Premier League + Championship clubs, found ${eligible.length}.`);

const published=new Set(Object.keys(profiles.clubs||{}));
for(const id of published)if(!eligible.some(c=>c.id===id))throw new Error(`Club profile queue: published profile ${id} is not currently eligible.`);
const pending=eligible.filter(c=>!published.has(c.id));

const queue=pending.map((c,index)=>({
  order:index+1,
  clubId:c.id,
  clubName:c.name,
  division:c.division,
  divisionName:c.divisionName,
  status:'evidence-required',
  requiredSections:['manager','formation','homeKit','awayKit'],
  translationTarget:{
    manager:'SWOS coach field (max 24 chars)',
    formation:'one of 18 SWOS tactic codes',
    homeKit:'4 shirt styles + 10-colour palette',
    awayKit:'4 shirt styles + 10-colour palette'
  }
}));

const out={
  schemaVersion:1,
  season:'2026/27',
  generatedAt:new Date().toISOString(),
  status:pending.length?'active':'complete',
  scope:'Premier League + Championship clubs with completed 16-player research packs',
  policy:{
    evidenceRequired:true,
    managerSourceRequired:true,
    formationSourceRequired:true,
    homeKitSourceRequired:true,
    awayKitSourceRequired:true,
    translateOnlyToNativeSwosOptions:true,
    autoPromote:false,
    binaryWritesRemainLocked:true
  },
  totals:{
    eligibleClubs:eligible.length,
    profileReadyClubs:published.size,
    pendingClubs:pending.length,
    pendingEvidenceSections:pending.length*4
  },
  next:queue[0]?{clubId:queue[0].clubId,clubName:queue[0].clubName}:null,
  queue
};
if(!published.size&&out.next?.clubId!=='arsenal')throw new Error(`Club profile queue: clean foundation should start with Arsenal; found ${out.next?.clubName||'none'}.`);
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');

manifest.resources=manifest.resources||{};
manifest.resources.clubProfiles=PROFILES;
manifest.resources.clubProfileQueue=OUT;
manifest.resources.clubProfileEvidenceSchema='football-db/club-profile-evidence/schema-v1.json';
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.clubProfileEvidencePipeline=true;
manifest.dataModel.nativeSwosFormationTranslation=true;
manifest.dataModel.nativeSwosKitTranslation=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Club profile queue tracks '));
manifest.notes.push(`Club profile queue tracks ${eligible.length} eligible research-ready clubs; ${published.size} profile-ready and ${pending.length} pending across ${pending.length*4} required evidence sections.`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');

if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db/club-profile-evidence',{recursive:true});
  fs.copyFileSync(OUT,'dist/football-db/club-profile-queue.json');
  fs.copyFileSync(PROFILES,'dist/football-db/club-profiles.json');
  fs.copyFileSync('football-db/club-profile-evidence/schema-v1.json','dist/football-db/club-profile-evidence/schema-v1.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}
console.log(`Club profile queue · ${published.size}/44 ready · ${pending.length} pending · ${pending.length*4} evidence sections · next ${out.next?.clubName||'complete'} · writes locked.`);
