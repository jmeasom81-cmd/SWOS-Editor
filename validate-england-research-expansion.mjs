import fs from 'node:fs';

const PACKS='football-db/research-packs.json';
const COVERAGE='football-db/coverage.json';
const IDENTITIES='football-db/identities.json';
const MANIFEST='football-db/manifest.json';
const INTAKE='football-db/championship-research-intake.json';
const OUT='football-db/research-expansion-validation.json';
for(const file of [PACKS,COVERAGE,IDENTITIES,MANIFEST,INTAKE])if(!fs.existsSync(file))throw new Error(`England research expansion validation: missing ${file}.`);
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const divisionById=new Map((coverage.clubs||[]).map(c=>[c.id,c.division]));
const checks=[];const check=(label,ok,detail)=>{checks.push({label,pass:!!ok,detail});if(!ok)throw new Error(`England research expansion validation failed: ${label} · ${detail}`);};

let plClubs=0,champClubs=0,otherClubs=0,totalPlayers=0;
for(const [clubId,club] of Object.entries(packs.clubs||{})){
  const d=divisionById.get(clubId),entries=Object.entries(club.players||{});
  check(`${clubId} mapped`,d!=null,`research club must exist in 92-club structure`);
  check(`${clubId} exact 16`,entries.length===16,`${entries.length} player rows`);
  if(d===0)plClubs++;else if(d===1)champClubs++;else otherClubs++;
  const identityNames=d===1?new Set((identities.clubs?.[clubId]||[]).map(p=>p.footballName)):null;
  if(d===1)check(`${clubId} identity 16`,identityNames.size===16,`${identityNames.size} published identity names`);
  for(const [name,p] of entries){
    totalPlayers++;
    check(`${clubId}/${name} age`,Number.isFinite(Number(p.age))&&Number(p.age)>=15&&Number(p.age)<=50,`age ${p.age}`);
    check(`${clubId}/${name} value`,Number.isFinite(Number(p.marketValueM))&&Number(p.marketValueM)>=0,`marketValueM ${p.marketValueM}`);
    check(`${clubId}/${name} position`,Number.isInteger(p.position)&&p.position>=0&&p.position<=7,`position ${p.position}`);
    if(d===1)check(`${clubId}/${name} identity match`,identityNames.has(name),`player must match published Championship identity 16 exactly`);
    for(const key of ['minutes','goals','assists'])if(p[key]!=null)check(`${clubId}/${name} ${key}`,Number.isFinite(Number(p[key]))&&Number(p[key])>=0,`${key} ${p[key]}`);
  }
}
check('Premier League research complete',plClubs===20,`${plClubs}/20 clubs`);
check('No lower-division research yet',otherClubs===0,`${otherClubs} League One/Two packs`);
check('Pack count',packs.packCount===plClubs+champClubs,`declared ${packs.packCount}, actual ${plClubs+champClubs}`);
check('Player count',packs.playerCount===totalPlayers&&totalPlayers===packs.packCount*16,`declared ${packs.playerCount}, actual ${totalPlayers}`);
const pl=coverage.divisions?.find(d=>d.code===0),champ=coverage.divisions?.find(d=>d.code===1);
check('PL coverage',pl?.researchReady===20,`coverage ${pl?.researchReady}/20`);
check('Championship coverage',champ?.identityReady===24&&champ?.researchReady===champClubs,`identity ${champ?.identityReady}/24, research ${champ?.researchReady}/${champClubs}`);
check('England coverage',coverage.summary?.researchReady===packs.packCount,`coverage ${coverage.summary?.researchReady}, packs ${packs.packCount}`);
check('Championship intake progress',intake.progress?.researchReadyClubs===champClubs&&intake.progress?.researchPendingClubs===24-champClubs,`intake ready ${intake.progress?.researchReadyClubs}, pending ${intake.progress?.researchPendingClubs}`);
check('Binary locks',manifest.installation?.teamWriteReady===false&&manifest.installation?.careerWriteReady===false,'TEAM.* and .CAR installation must remain disabled');

const result={
  schemaVersion:1,
  status:'pass',
  season:'2026/27',
  databaseVersion:manifest.version,
  validatedAt:new Date().toISOString(),
  divisions:{premierLeague:{researchReady:plClubs,players:plClubs*16},championship:{researchReady:champClubs,players:champClubs*16,pending:24-champClubs},leagueOne:{researchReady:0},leagueTwo:{researchReady:0}},
  totals:{researchClubs:packs.packCount,researchPlayers:totalPlayers,checks:checks.length},
  guarantees:{championshipIdentityReady:24,championshipResearchIdentityMatched:true,exactPackSize:16,noFabricatedPromotion:true,teamWriteEnabled:false,careerWriteEnabled:false},
  checks
};
fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n','utf8');
manifest.resources=manifest.resources||{};manifest.resources.researchExpansionValidation=OUT;
manifest.coverage=manifest.coverage||{};manifest.coverage.premierLeague=manifest.coverage.premierLeague||{};manifest.coverage.championship=manifest.coverage.championship||{};manifest.coverage.englandClubs=manifest.coverage.englandClubs||{};
manifest.coverage.premierLeague.researchPackClubs=20;manifest.coverage.premierLeague.researchPackPlayers=320;
manifest.coverage.championship.researchPackClubs=champClubs;manifest.coverage.championship.researchPackPlayers=champClubs*16;
manifest.coverage.englandClubs.researchPackClubs=packs.packCount;manifest.coverage.englandClubs.researchPackPlayers=totalPlayers;
manifest.dataModel=manifest.dataModel||{};manifest.dataModel.multiDivisionResearchValidation=true;
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){fs.mkdirSync('dist/football-db',{recursive:true});fs.copyFileSync(OUT,'dist/football-db/research-expansion-validation.json');fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');}
console.log(`England research expansion validation PASS · PL 20/20 · Championship ${champClubs}/24 · ${packs.packCount} total packs / ${totalPlayers} players · binary writes locked.`);
