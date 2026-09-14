import fs from 'node:fs';

const COVERAGE='football-db/coverage.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const OUT='football-db/league-one-research-queue.json';
for(const file of [COVERAGE,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`League One research queue: missing ${file}.`);

const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const leagueOne=coverage.divisions?.find(d=>d.code===2);
if(leagueOne?.clubs!==24||leagueOne?.identityReady!==24)throw new Error(`League One research queue: identity foundation must remain 24/24; found ${leagueOne?.identityReady||0}/24.`);
const researchReady=Number(leagueOne?.researchReady||0);
if(!Number.isInteger(researchReady)||researchReady<0||researchReady>24)throw new Error(`League One research queue: invalid research-ready total ${leagueOne?.researchReady}.`);

const all=(coverage.clubs||[]).filter(c=>c.division===2).sort((a,b)=>a.name.localeCompare(b.name));
if(all.length!==24)throw new Error(`League One research queue: expected 24 League One clubs, found ${all.length}.`);
const pending=all.filter(c=>c.stages?.researchPack?.status!=='ready');
if(pending.length!==24-researchReady)throw new Error(`League One research queue: coverage says ${researchReady} research-ready but ${pending.length} clubs remain pending.`);

const queue=pending.map((club,index)=>{
  if(club.stages?.identity?.status!=='ready')throw new Error(`League One research queue: ${club.name} is not identity-ready.`);
  const identityRows=identities.clubs?.[club.id]||[];
  if(identityRows.length!==16)throw new Error(`League One research queue: ${club.name} must expose exactly 16 selected identities; found ${identityRows.length}.`);
  return {
    order:index+1,
    clubId:club.id,
    clubName:club.name,
    division:2,
    divisionName:'League One',
    status:'evidence-required',
    identityPlayersAvailable:identityRows.length,
    stagedPlayers:16,
    requiredEvidence:['age','marketValueM','position'],
    optionalPerformanceEvidence:['minutes','goals','assists'],
    players:identityRows.map((row,slot)=>({
      slot:slot+1,
      footballName:row.footballName,
      group:row.group,
      nationality:row.nationality,
      shirt:row.shirt??null,
      identitySource:row.source,
      research:{age:'evidence-required',marketValueM:'evidence-required',position:'evidence-required',minutes:'optional',goals:'optional',assists:'optional'}
    }))
  };
});

const stagedPlayers=queue.length*16,requiredEvidenceCells=stagedPlayers*3;
const out={
  schemaVersion:2,
  season:'2026/27',
  generatedAt:new Date().toISOString(),
  status:queue.length?'active':'complete',
  division:{code:2,name:'League One',clubs:24},
  progress:{researchReadyClubs:researchReady,researchPendingClubs:queue.length},
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
  totals:{clubs:queue.length,stagedPlayers,requiredEvidenceCells},
  next:queue[0]?{clubId:queue[0].clubId,clubName:queue[0].clubName}:null,
  queue
};
if(stagedPlayers!==(24-researchReady)*16||requiredEvidenceCells!==(24-researchReady)*48)throw new Error('League One research queue: derived totals are inconsistent.');
if(researchReady===0&&out.next?.clubId!=='afc-wimbledon')throw new Error(`League One research queue: clean foundation must begin with AFC Wimbledon; found ${out.next?.clubName||'none'}.`);
if(researchReady===24&&out.next!==null)throw new Error('League One research queue: complete division must not expose a next club.');

fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
manifest.resources=manifest.resources||{};
manifest.resources.leagueOneResearchQueue=OUT;
manifest.resources.leagueOneResearchEvidenceSchema='football-db/league-one-research-evidence/schema-v1.json';
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.leagueOneResearchQueue=true;
manifest.dataModel.leagueOneResearchEvidenceGate=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('League One research queue staged '));
manifest.notes.push(`League One research queue staged ${queue.length} pending club(s) / ${stagedPlayers} identity-verified player slots / ${requiredEvidenceCells} required evidence cells; ${researchReady}/24 clubs are already research-ready.`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db/league-one-research-evidence',{recursive:true});
  fs.copyFileSync(OUT,'dist/football-db/league-one-research-queue.json');
  fs.copyFileSync('football-db/league-one-research-evidence/schema-v1.json','dist/football-db/league-one-research-evidence/schema-v1.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}
console.log(`League One research queue · ${researchReady}/24 ready · ${queue.length} pending · ${stagedPlayers} staged players · next ${out.next?.clubName||'complete'} · binary writes locked.`);
