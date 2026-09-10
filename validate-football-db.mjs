import fs from 'node:fs';

const readJson=(path)=>{
  if(!fs.existsSync(path))throw new Error(`Missing required football database file: ${path}`);
  try{return JSON.parse(fs.readFileSync(path,'utf8'))}catch(e){throw new Error(`Invalid JSON in ${path}: ${e.message}`)}
};

const manifest=readJson('football-db/manifest.json');
const packs=readJson('football-db/research-packs.json');
const model=readJson('football-db/squad-model.json');
const schema=readJson('football-db/schema-v1.json');
const checks=[];
const check=(id,label,condition,detail)=>{
  const pass=!!condition;
  checks.push({id,label,pass,detail});
  if(!pass)throw new Error(`Football database validation failed [${id}]: ${detail}`);
};

check('manifest-schema','Manifest schema',manifest.schemaVersion===1,`Expected schemaVersion 1; found ${manifest.schemaVersion}`);
check('manifest-id','Database identity',manifest.databaseId==='england-modern',`Expected england-modern; found ${manifest.databaseId}`);
check('manifest-season','Season alignment',manifest.season===packs.season&&manifest.season===model.season,`Manifest ${manifest.season}, packs ${packs.season}, model ${model.season}`);
check('resource-pack','Research-pack resource',manifest.resources?.researchPacks==='football-db/research-packs.json','Manifest must point to football-db/research-packs.json');
check('resource-model','Squad-model resource',manifest.resources?.squadModel==='football-db/squad-model.json','Manifest must point to football-db/squad-model.json');
check('resource-schema','Club-schema resource',manifest.resources?.clubRecordSchema==='football-db/schema-v1.json','Manifest must point to football-db/schema-v1.json');
check('schema-shape','Club schema shape',schema.type==='object'&&schema.properties?.squad?.properties?.swos16PlayerIds?.minItems===16&&schema.properties?.squad?.properties?.swos16PlayerIds?.maxItems===16,'Club schema must require exactly 16 SWOS player IDs');
check('model-capacity','TEAM capacity',model.layers?.installedSwos16?.capacity===16,`Expected Installed SWOS capacity 16; found ${model.layers?.installedSwos16?.capacity}`);
check('career-boundary','Career isolation',model.careerRules?.existingCareerAutoUpdate===false&&model.careerRules?.realWorldDatabaseInjection===false,'Existing careers must remain isolated from real-world database updates');
check('write-lock','Binary write lock',model.writeSafety?.teamWriteEnabled===false&&model.writeSafety?.careerWriteEnabled===false&&manifest.installation?.teamWriteReady===false&&manifest.installation?.careerWriteReady===false,'TEAM.* and .CAR writes must remain locked in this foundation release');

const clubs=Object.values(packs.clubs||{});
const playerRows=[];
for(const club of clubs){
  const entries=Object.entries(club.players||{});
  check(`pack-${club.clubId}-identity`,`${club.label||club.clubId} identity`,!!club.clubId&&entries.length>0,`${club.label||'Club'} must have a stable clubId and player rows`);
  check(`pack-${club.clubId}-size`,`${club.label||club.clubId} pack size`,entries.length===16,`${club.label||club.clubId} currently requires exactly 16 researched players; found ${entries.length}`);
  for(const [name,p] of entries){
    const prefix=`${club.clubId}:${name}`;
    check(`position-${prefix}`,`${name} position`,Number.isInteger(p.position)&&p.position>=0&&p.position<=7,`${prefix} has invalid SWOS position ${p.position}`);
    check(`age-${prefix}`,`${name} age`,Number.isFinite(Number(p.age))&&Number(p.age)>=15&&Number(p.age)<=50,`${prefix} has invalid age ${p.age}`);
    check(`value-${prefix}`,`${name} market value`,Number.isFinite(Number(p.marketValueM))&&Number(p.marketValueM)>=0,`${prefix} has invalid marketValueM ${p.marketValueM}`);
    for(const key of ['minutes','goals','assists']){
      if(p[key]!=null)check(`${key}-${prefix}`,`${name} ${key}`,Number.isFinite(Number(p[key]))&&Number(p[key])>=0,`${prefix} has invalid ${key} ${p[key]}`);
    }
    playerRows.push({clubId:club.clubId,name,...p});
  }
}

check('pack-count','Research pack club count',packs.packCount===clubs.length,`Declared ${packs.packCount}; actual ${clubs.length}`);
check('player-count','Research pack player count',packs.playerCount===playerRows.length,`Declared ${packs.playerCount}; actual ${playerRows.length}`);
check('manifest-pack-count','Manifest research club count',manifest.coverage?.premierLeague?.researchPackClubs===clubs.length,`Manifest ${manifest.coverage?.premierLeague?.researchPackClubs}; actual ${clubs.length}`);
check('manifest-player-count','Manifest research player count',manifest.coverage?.premierLeague?.researchPackPlayers===playerRows.length,`Manifest ${manifest.coverage?.premierLeague?.researchPackPlayers}; actual ${playerRows.length}`);
check('england-target','England structure target',manifest.coverage?.englandClubs?.target===92&&manifest.coverage?.englandClubs?.mapped===92,`Expected 92/92 mapped; found ${manifest.coverage?.englandClubs?.mapped}/${manifest.coverage?.englandClubs?.target}`);

const result={
  schemaVersion:1,
  status:'pass',
  databaseId:manifest.databaseId,
  databaseVersion:manifest.version,
  season:manifest.season,
  validatedAt:new Date().toISOString(),
  totals:{clubs:clubs.length,players:playerRows.length,checks:checks.length},
  guarantees:{
    exactCurrentPackSize:16,
    swosPositionRange:'0-7',
    manifestCountsMatch:true,
    clubSchemaRequires16:true,
    careerAutoUpdate:false,
    teamWriteEnabled:false,
    careerWriteEnabled:false
  },
  checks
};
fs.writeFileSync('football-db/validation.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(`Football database validation PASS · ${clubs.length} packs · ${playerRows.length} players · ${checks.length} checks`);
