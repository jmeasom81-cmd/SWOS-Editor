import fs from 'node:fs';

const COVERAGE='football-db/coverage.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const OUT='football-db/championship-research-queue.json';
for(const file of [COVERAGE,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`Championship research queue: missing ${file}.`);

const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const champ=coverage.divisions?.find(d=>d.code===1);
if(champ?.clubs!==24||champ?.identityReady!==24)throw new Error(`Championship research queue: identity foundation must be 24/24 before research staging; found ${champ?.identityReady||0}/24.`);
if(champ?.researchReady!==0)throw new Error(`Championship research queue: expected research to start at 0/24; found ${champ?.researchReady||0}/24.`);

const rows=(coverage.clubs||[])
  .filter(c=>c.division===1)
  .sort((a,b)=>a.name.localeCompare(b.name));
if(rows.length!==24)throw new Error(`Championship research queue: expected 24 Championship clubs, found ${rows.length}.`);

const queue=rows.map((club,index)=>{
  if(club.stages?.identity?.status!=='ready')throw new Error(`Championship research queue: ${club.name} is not identity-ready.`);
  if(club.stages?.researchPack?.status==='ready')throw new Error(`Championship research queue: ${club.name} unexpectedly already has a research pack.`);
  const identityRows=identities.clubs?.[club.id]||[];
  if(identityRows.length!==16)throw new Error(`Championship research queue: ${club.name} must expose exactly 16 selected identities; found ${identityRows.length}.`);
  const players=identityRows.map((row,slot)=>({
    slot:slot+1,
    footballName:row.footballName,
    group:row.group,
    nationality:row.nationality,
    shirt:row.shirt??null,
    identitySource:row.source,
    research:{
      age:'evidence-required',
      marketValueM:'evidence-required',
      position:'evidence-required',
      minutes:'optional',
      goals:'optional',
      assists:'optional'
    }
  }));
  return {
    order:index+1,
    clubId:club.id,
    clubName:club.name,
    division:1,
    divisionName:'Championship',
    status:'evidence-required',
    identityPlayersAvailable:identityRows.length,
    stagedPlayers:players.length,
    requiredEvidence:['age','marketValueM','position'],
    optionalPerformanceEvidence:['minutes','goals','assists'],
    players
  };
});

const out={
  schemaVersion:1,
  season:'2026/27',
  generatedAt:new Date().toISOString(),
  status:'active',
  division:{code:1,name:'Championship',clubs:24},
  policy:{
    exactPackSize:16,
    identityMustBeReady:true,
    requiredEvidence:['age','marketValueM','position','sources'],
    optionalPerformanceEvidence:['minutes','goals','assists'],
    publishOnlyWhenAll16RequiredEvidenceComplete:true,
    noFabricatedValues:true,
    autoPromote:false,
    binaryWritesRemainLocked:true
  },
  totals:{
    clubs:queue.length,
    stagedPlayers:queue.reduce((n,c)=>n+c.stagedPlayers,0),
    requiredEvidenceCells:queue.reduce((n,c)=>n+c.stagedPlayers*3,0)
  },
  next:{clubId:queue[0].clubId,clubName:queue[0].clubName},
  queue
};
if(out.totals.stagedPlayers!==384||out.totals.requiredEvidenceCells!==1152)throw new Error(`Championship research queue: expected 384 player slots / 1152 required evidence cells; found ${out.totals.stagedPlayers} / ${out.totals.requiredEvidenceCells}.`);
if(out.next.clubId!=='birmingham-city')throw new Error(`Championship research queue: expected Birmingham City first; found ${out.next.clubName}.`);

fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
manifest.resources=manifest.resources||{};
manifest.resources.championshipResearchQueue=OUT;
manifest.resources.championshipResearchEvidenceSchema='football-db/championship-research-evidence/schema-v1.json';
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.championshipResearchQueue=true;
manifest.dataModel.championshipResearchEvidenceGate=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Championship research queue staged '));
manifest.notes.push('Championship research queue staged 24 clubs / 384 identity-verified player slots / 1152 required evidence cells. No player ability values are invented and binary writes remain locked.');
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db/championship-research-evidence',{recursive:true});
  fs.copyFileSync(OUT,'dist/football-db/championship-research-queue.json');
  fs.copyFileSync('football-db/championship-research-evidence/schema-v1.json','dist/football-db/championship-research-evidence/schema-v1.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}
console.log('Championship research queue staged · 24 clubs · 384 players · 1152 required evidence cells · next Birmingham City · binary writes locked.');
