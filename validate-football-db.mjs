import fs from 'node:fs';

const readJson=(path)=>{
  if(!fs.existsSync(path))throw new Error(`Missing required football database file: ${path}`);
  try{return JSON.parse(fs.readFileSync(path,'utf8'))}catch(e){throw new Error(`Invalid JSON in ${path}: ${e.message}`)}
};

const manifest=readJson('football-db/manifest.json');
const packs=readJson('football-db/research-packs.json');
const identities=readJson('football-db/identities.json');
const model=readJson('football-db/squad-model.json');
const schema=readJson('football-db/schema-v1.json');
const checks=[];
const check=(id,label,condition,detail)=>{
  const pass=!!condition;
  checks.push({id,label,pass,detail});
  if(!pass)throw new Error(`Football database validation failed [${id}]: ${detail}`);
};

check('manifest-schema','Manifest schema',manifest.schemaVersion===1,`schemaVersion ${manifest.schemaVersion}; required 1`);
check('manifest-id','Database identity',manifest.databaseId==='england-modern',`databaseId ${manifest.databaseId}; required england-modern`);
check('manifest-season','Season alignment',manifest.season===packs.season&&manifest.season===identities.season&&manifest.season===model.season,`Manifest ${manifest.season}, packs ${packs.season}, identities ${identities.season}, model ${model.season}`);
check('resource-pack','Research-pack resource',manifest.resources?.researchPacks==='football-db/research-packs.json',`Research-pack resource: ${manifest.resources?.researchPacks||'missing'}`);
check('resource-identities','Verified-identity resource',manifest.resources?.verifiedIdentities==='football-db/identities.json',`Verified-identity resource: ${manifest.resources?.verifiedIdentities||'missing'}`);
check('resource-model','Squad-model resource',manifest.resources?.squadModel==='football-db/squad-model.json',`Squad-model resource: ${manifest.resources?.squadModel||'missing'}`);
check('resource-schema','Club-schema resource',manifest.resources?.clubRecordSchema==='football-db/schema-v1.json',`Club-schema resource: ${manifest.resources?.clubRecordSchema||'missing'}`);
check('schema-shape','Club schema shape',schema.type==='object'&&schema.properties?.squad?.properties?.swos16PlayerIds?.minItems===16&&schema.properties?.squad?.properties?.swos16PlayerIds?.maxItems===16,'Installed SWOS player IDs constrained to exactly 16');
check('model-capacity','TEAM capacity',model.layers?.installedSwos16?.capacity===16,`Installed SWOS capacity ${model.layers?.installedSwos16?.capacity}; required 16`);
check('career-boundary','Career isolation',model.careerRules?.existingCareerAutoUpdate===false&&model.careerRules?.realWorldDatabaseInjection===false,'Existing-career auto-update and real-world database injection are both blocked');
check('write-lock','Binary write lock',model.writeSafety?.teamWriteEnabled===false&&model.writeSafety?.careerWriteEnabled===false&&manifest.installation?.teamWriteReady===false&&manifest.installation?.careerWriteReady===false,'TEAM.* and .CAR writes remain locked in this foundation release');

const clubs=Object.values(packs.clubs||{});
const playerRows=[];
for(const club of clubs){
  const entries=Object.entries(club.players||{});
  check(`pack-${club.clubId}-identity`,`${club.label||club.clubId} identity`,!!club.clubId&&entries.length>0,`${club.label||'Club'} stable clubId ${club.clubId||'missing'}; ${entries.length} player rows`);
  check(`pack-${club.clubId}-size`,`${club.label||club.clubId} pack size`,entries.length===16,`${club.label||club.clubId}: ${entries.length} researched players; required 16 for the current pack format`);
  for(const [name,p] of entries){
    const prefix=`${club.clubId}:${name}`;
    check(`position-${prefix}`,`${name} position`,Number.isInteger(p.position)&&p.position>=0&&p.position<=7,`${prefix} SWOS position ${p.position}; allowed range 0-7`);
    check(`age-${prefix}`,`${name} age`,Number.isFinite(Number(p.age))&&Number(p.age)>=15&&Number(p.age)<=50,`${prefix} age ${p.age}; allowed range 15-50`);
    check(`value-${prefix}`,`${name} market value`,Number.isFinite(Number(p.marketValueM))&&Number(p.marketValueM)>=0,`${prefix} marketValueM ${p.marketValueM}; must be finite and non-negative`);
    for(const key of ['minutes','goals','assists']){
      if(p[key]!=null)check(`${key}-${prefix}`,`${name} ${key}`,Number.isFinite(Number(p[key]))&&Number(p[key])>=0,`${prefix} ${key} ${p[key]}; must be finite and non-negative`);
    }
    playerRows.push({clubId:club.clubId,name,...p});
  }
}

const identityClubs=Object.entries(identities.clubs||{});
const identityRows=[];
for(const [clubId,rows] of identityClubs){
  check(`identity-club-${clubId}`,`${clubId} identity list`,Array.isArray(rows)&&rows.length>0,`${clubId}: ${Array.isArray(rows)?rows.length:'invalid'} verified identity rows`);
  const seen=new Set();
  for(const row of rows||[]){
    const name=String(row?.footballName||'').trim();
    const key=name.toLocaleLowerCase('en');
    check(`identity-name-${clubId}:${key}`,`${clubId} identity name`,!!name,`${clubId}: footballName must not be blank`);
    check(`identity-unique-${clubId}:${key}`,`${name||clubId} uniqueness`,!seen.has(key),`${clubId}: duplicate footballName ${name}`);seen.add(key);
    check(`identity-group-${clubId}:${key}`,`${name} broad role`,['Goalkeeper','Defender','Midfielder','Forward'].includes(row?.group),`${clubId}:${name} role ${row?.group}; required Goalkeeper/Defender/Midfielder/Forward`);
    check(`identity-nationality-${clubId}:${key}`,`${name} nationality`,!!String(row?.nationality||'').trim(),`${clubId}:${name} nationality must not be blank`);
    check(`identity-shirt-${clubId}:${key}`,`${name} shirt number`,row?.shirt==null||(Number.isInteger(row.shirt)&&row.shirt>=1&&row.shirt<=99),`${clubId}:${name} shirt ${row?.shirt}; allowed null or 1-99`);
    check(`identity-source-${clubId}:${key}`,`${name} source`,!!String(row?.source||'').trim(),`${clubId}:${name} source must not be blank`);
    identityRows.push({clubId,...row});
  }
}

const u21Rows=[];
for(const [clubId,rows] of Object.entries(identities.u21Candidates||{})){
  check(`u21-club-${clubId}`,`${clubId} U21 list`,Array.isArray(rows)&&rows.length>0,`${clubId}: U21 candidate list must contain rows`);
  for(const row of rows||[]){
    const name=String(row?.footballName||'').trim();
    check(`u21-name-${clubId}:${name}`,`${name||clubId} U21 identity`,!!name&&row?.registration==='U21 candidate',`${clubId}:${name} must be marked U21 candidate`);
    check(`u21-group-${clubId}:${name}`,`${name} U21 broad role`,['Goalkeeper','Defender','Midfielder','Forward'].includes(row?.group),`${clubId}:${name} role ${row?.group}`);
    u21Rows.push({clubId,...row});
  }
}

check('pack-count','Research pack club count',packs.packCount===clubs.length,`Declared ${packs.packCount}; actual ${clubs.length}`);
check('player-count','Research pack player count',packs.playerCount===playerRows.length,`Declared ${packs.playerCount}; actual ${playerRows.length}`);
check('manifest-pack-count','Manifest research club count',manifest.coverage?.premierLeague?.researchPackClubs===clubs.length,`Manifest ${manifest.coverage?.premierLeague?.researchPackClubs}; actual ${clubs.length}`);
check('manifest-player-count','Manifest research player count',manifest.coverage?.premierLeague?.researchPackPlayers===playerRows.length,`Manifest ${manifest.coverage?.premierLeague?.researchPackPlayers}; actual ${playerRows.length}`);
check('identity-count','Verified identity club count',identities.clubCount===identityClubs.length,`Declared ${identities.clubCount}; actual ${identityClubs.length}`);
check('identity-player-count','Verified identity player count',identities.playerCount===identityRows.length,`Declared ${identities.playerCount}; actual ${identityRows.length}`);
check('identity-manifest-count','Manifest identity club count',manifest.coverage?.premierLeague?.identityReadyClubs===identityClubs.length,`Manifest ${manifest.coverage?.premierLeague?.identityReadyClubs}; actual ${identityClubs.length}`);
check('identity-manifest-players','Manifest identity player count',manifest.coverage?.premierLeague?.identityPlayers===identityRows.length,`Manifest ${manifest.coverage?.premierLeague?.identityPlayers}; actual ${identityRows.length}`);
check('u21-count','U21 candidate count',identities.u21PlayerCount===u21Rows.length&&manifest.coverage?.premierLeague?.u21Candidates===u21Rows.length,`Feed ${identities.u21PlayerCount}; manifest ${manifest.coverage?.premierLeague?.u21Candidates}; actual ${u21Rows.length}`);
check('england-target','England structure target',manifest.coverage?.englandClubs?.target===92&&manifest.coverage?.englandClubs?.mapped===92,`England structure ${manifest.coverage?.englandClubs?.mapped}/${manifest.coverage?.englandClubs?.target}; required 92/92`);

const result={
  schemaVersion:1,
  status:'pass',
  databaseId:manifest.databaseId,
  databaseVersion:manifest.version,
  season:manifest.season,
  validatedAt:new Date().toISOString(),
  totals:{clubs:clubs.length,players:playerRows.length,identityClubs:identityClubs.length,identityPlayers:identityRows.length,u21Candidates:u21Rows.length,checks:checks.length},
  guarantees:{
    exactCurrentPackSize:16,
    swosPositionRange:'0-7',
    manifestCountsMatch:true,
    identityFeedValidated:true,
    clubSchemaRequires16:true,
    careerAutoUpdate:false,
    teamWriteEnabled:false,
    careerWriteEnabled:false
  },
  checks
};
fs.writeFileSync('football-db/validation.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(`Football database validation PASS · ${clubs.length} packs / ${playerRows.length} researched players · ${identityClubs.length} identity clubs / ${identityRows.length} senior identities · ${checks.length} checks`);
