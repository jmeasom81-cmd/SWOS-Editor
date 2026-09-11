import fs from 'node:fs';

const COVERAGE='football-db/coverage.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const OUT='football-db/research-queue.json';
for(const file of [COVERAGE,IDENTITIES,MANIFEST])if(!fs.existsSync(file))throw new Error(`Research queue publisher: missing ${file}.`);
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));

const pending=(coverage.clubs||[])
  .filter(c=>c.division===0&&c.stages?.identity?.status==='ready'&&c.stages?.researchPack?.status!=='ready')
  .sort((a,b)=>a.name.localeCompare(b.name));

const queue=pending.map((club,index)=>{
  const rows=identities.clubs?.[club.id]||[];
  if(rows.length<16)throw new Error(`Research queue publisher: ${club.name} has only ${rows.length} identity rows; at least 16 required.`);
  const selected=rows.slice(0,16).map((row,slot)=>({
    slot:slot+1,
    footballName:row.footballName,
    group:row.group,
    nationality:row.nationality,
    shirt:row.shirt??null,
    identitySource:row.source,
    research:{
      age:'pending',
      marketValueM:'pending',
      swosPosition:'pending',
      minutes:'pending-or-not-applicable',
      goals:'pending-or-not-applicable',
      assists:'pending-or-not-applicable'
    }
  }));
  return {
    order:index+1,
    clubId:club.id,
    clubName:club.name,
    identityPlayersAvailable:rows.length,
    stagedPlayers:selected.length,
    status:'evidence-required',
    requiredEvidence:['age','marketValueM','swosPosition'],
    optionalPerformanceEvidence:['minutes','goals','assists'],
    players:selected
  };
});

const out={
  schemaVersion:1,
  season:manifest.season,
  generatedAt:new Date().toISOString(),
  status:queue.length?'active':'complete',
  policy:{
    exactPackSize:16,
    identityMustBeReady:true,
    publishOnlyWhenRequiredEvidenceComplete:true,
    noFabricatedValues:true,
    binaryWritesRemainLocked:true
  },
  totals:{clubs:queue.length,stagedPlayers:queue.reduce((n,c)=>n+c.stagedPlayers,0)},
  next:queue[0]?{clubId:queue[0].clubId,clubName:queue[0].clubName}:null,
  queue
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
manifest.resources=manifest.resources||{};
manifest.resources.researchQueue=OUT;
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.evidenceResearchQueue=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Evidence research queue staged '));
manifest.notes.push(`Evidence research queue staged ${out.totals.clubs} Premier League clubs / ${out.totals.stagedPlayers} identity-verified player slots without fabricating missing research fields.`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db',{recursive:true});
  fs.copyFileSync(OUT,'dist/football-db/research-queue.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}
console.log(`Published evidence research queue · ${out.totals.clubs} clubs / ${out.totals.stagedPlayers} staged player slots · next ${out.next?.clubName||'complete'}`);
