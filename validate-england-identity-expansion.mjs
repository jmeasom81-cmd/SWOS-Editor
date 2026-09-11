import fs from 'node:fs';
import crypto from 'node:crypto';

const read=p=>{if(!fs.existsSync(p))throw new Error(`England identity validation: missing ${p}.`);try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){throw new Error(`England identity validation: invalid JSON in ${p}: ${e.message}`)}};
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest=read('football-db/manifest.json'),identities=read('football-db/identities.json'),packs=read('football-db/research-packs.json'),model=read('football-db/squad-model.json'),schema=read('football-db/schema-v1.json'),coverage=read('football-db/coverage.json');
const checks=[];const check=(id,condition,detail)=>{const pass=!!condition;checks.push({id,pass,detail});if(!pass)throw new Error(`England identity validation failed [${id}]: ${detail}`)};
const identityEntries=Object.entries(identities.clubs||{}),identityPlayers=identityEntries.reduce((n,[,rows])=>n+(rows?.length||0),0),packEntries=Object.entries(packs.clubs||{}),packPlayers=packEntries.reduce((n,[,c])=>n+Object.keys(c.players||{}).length,0);
const champIds=new Set((coverage.clubs||[]).filter(c=>c.division===1).map(c=>c.id));
const champEntries=identityEntries.filter(([id])=>champIds.has(id));
const champCount=champEntries.length,champPlayers=champEntries.reduce((n,[,rows])=>n+(rows?.length||0),0);
const expectedIdentityClubs=20+champCount,expectedIdentityPlayers=375+(champCount*16),expectedVersion=`2026.27-england-identity.${expectedIdentityClubs}`;

check('season',manifest.season==='2026/27'&&identities.season==='2026/27'&&packs.season==='2026/27','season must remain 2026/27');
check('structure-championship',champIds.size===24,`mapped Championship clubs ${champIds.size}; required 24`);
check('pl-identity-foundation',identities.divisionCoverage?.premierLeague?.clubs===20&&identities.divisionCoverage?.premierLeague?.players===375,'Premier League identity foundation must remain 20 clubs / 375 players');
check('championship-range',champCount>=1&&champCount<=24,`Championship identity coverage ${champCount}/24; required staged range 1-24`);
check('championship-feed-count',identities.divisionCoverage?.championship?.clubs===champCount&&identities.divisionCoverage?.championship?.players===champPlayers,`Feed Championship totals ${identities.divisionCoverage?.championship?.clubs}/${identities.divisionCoverage?.championship?.players}; actual ${champCount}/${champPlayers}`);
check('lower-divisions-blocked',(identities.divisionCoverage?.leagueOne?.clubs||0)===0&&(identities.divisionCoverage?.leagueTwo?.clubs||0)===0,'League One/Two identity publication must remain blocked during Championship expansion');
check('england-identity-count',identities.clubCount===expectedIdentityClubs&&identityEntries.length===expectedIdentityClubs&&identities.playerCount===expectedIdentityPlayers&&identityPlayers===expectedIdentityPlayers,`England identity total ${identities.clubCount}/${identities.playerCount}; expected ${expectedIdentityClubs}/${expectedIdentityPlayers}`);
check('manifest-england-identity',manifest.coverage?.englandClubs?.identityReadyClubs===expectedIdentityClubs&&manifest.coverage?.englandClubs?.identityPlayers===expectedIdentityPlayers,`Manifest England identity totals ${manifest.coverage?.englandClubs?.identityReadyClubs}/${manifest.coverage?.englandClubs?.identityPlayers}; expected ${expectedIdentityClubs}/${expectedIdentityPlayers}`);
check('manifest-pl-identity',manifest.coverage?.premierLeague?.identityReadyClubs===20&&manifest.coverage?.premierLeague?.identityPlayers===375,'Manifest Premier League identity totals must remain 20 / 375');
check('manifest-championship-identity',manifest.coverage?.championship?.identityReadyClubs===champCount&&manifest.coverage?.championship?.identityPlayers===champPlayers,`Manifest Championship identity totals ${manifest.coverage?.championship?.identityReadyClubs}/${manifest.coverage?.championship?.identityPlayers}; expected ${champCount}/${champPlayers}`);
check('database-version',manifest.version===expectedVersion,`Manifest version ${manifest.version}; expected ${expectedVersion}`);
check('research-foundation',packs.packCount===20&&packEntries.length===20&&packs.playerCount===320&&packPlayers===320,'Premier League research foundation must remain 20 packs / 320 players');
check('write-lock',manifest.installation?.teamWriteReady===false&&manifest.installation?.careerWriteReady===false&&model.writeSafety?.teamWriteEnabled===false&&model.writeSafety?.careerWriteEnabled===false,'TEAM.* and .CAR writes must remain locked');
check('schema-16',schema.properties?.squad?.properties?.swos16PlayerIds?.minItems===16&&schema.properties?.squad?.properties?.swos16PlayerIds?.maxItems===16,'Installed SWOS squad capacity remains exactly 16');

for(const [clubId,rows] of champEntries){
  check(`champ-${clubId}-size`,Array.isArray(rows)&&rows.length===16,`${clubId}: ${Array.isArray(rows)?rows.length:'invalid'} identity rows; required exactly 16`);
  const unique=new Set((rows||[]).map(p=>String(p?.footballName||'').trim().toLocaleLowerCase('en')));
  check(`champ-${clubId}-unique`,unique.size===16,`${clubId}: football names must be 16 unique values`);
  const roles={Goalkeeper:0,Defender:0,Midfielder:0,Forward:0};
  for(const p of rows||[]){
    const name=String(p?.footballName||'').trim();
    check(`champ-${clubId}-name:${name}`,!!name,`${clubId}: blank footballName is not allowed`);
    check(`champ-${clubId}-source:${name}`,!!String(p?.source||'').trim(),`${clubId}:${name} source is required`);
    check(`champ-${clubId}-nat:${name}`,!!String(p?.nationality||'').trim(),`${clubId}:${name} nationality is required`);
    check(`champ-${clubId}-role:${name}`,['Goalkeeper','Defender','Midfielder','Forward'].includes(p?.group),`${clubId}:${name} role ${p?.group} invalid`);
    check(`champ-${clubId}-shirt:${name}`,p?.shirt==null||(Number.isInteger(p.shirt)&&p.shirt>=1&&p.shirt<=99),`${clubId}:${name} shirt ${p?.shirt}; allowed null or 1-99`);
    if(roles[p?.group]!=null)roles[p.group]++;
  }
  check(`champ-${clubId}-mix`,roles.Goalkeeper>=2&&roles.Defender>=4&&roles.Midfielder>=4&&roles.Forward>=2,`${clubId}: role mix GK ${roles.Goalkeeper}, DEF ${roles.Defender}, MID ${roles.Midfielder}, FWD ${roles.Forward}`);
}

const integrity={algorithm:'SHA-256',resources:{verifiedIdentities:{path:'football-db/identities.json',sha256:sha('football-db/identities.json')},researchPacks:{path:'football-db/research-packs.json',sha256:sha('football-db/research-packs.json')},squadModel:{path:'football-db/squad-model.json',sha256:sha('football-db/squad-model.json')},clubRecordSchema:{path:'football-db/schema-v1.json',sha256:sha('football-db/schema-v1.json')}}};
const result={schemaVersion:1,status:'pass',databaseId:manifest.databaseId,databaseVersion:manifest.version,season:manifest.season,validatedAt:new Date().toISOString(),scope:'England multi-division identity expansion with locked Premier League research foundation',totals:{clubs:packs.packCount,players:packs.playerCount,identityClubs:identities.clubCount,identityPlayers:identities.playerCount,championshipIdentityClubs:champCount,championshipIdentityPlayers:champPlayers,u21Candidates:identities.u21PlayerCount,checks:checks.length},guarantees:{premierLeagueIdentityComplete:true,premierLeagueResearchComplete:true,championshipIdentityExpansion:true,championshipIdentityReady:champCount,resourceIntegrity:true,careerAutoUpdate:false,teamWriteEnabled:false,careerWriteEnabled:false},integrity,checks};
fs.writeFileSync('football-db/validation.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(`England identity expansion validation PASS · ${identities.clubCount}/92 identity clubs · Championship ${champCount}/24 · PL research ${packs.packCount}/20 · ${checks.length} checks`);
