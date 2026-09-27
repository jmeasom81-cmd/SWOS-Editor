import fs from 'node:fs';

const INTAKE='football-db/league-two-research-intake.json';
const PACKS='football-db/research-packs.json';
const MANIFEST='football-db/manifest.json';
const COVERAGE='football-db/coverage.json';
const IDENTITIES='football-db/identities.json';
for(const file of [INTAKE,PACKS,MANIFEST,COVERAGE,IDENTITIES])if(!fs.existsSync(file))throw new Error(`League Two research promotion: missing ${file}.`);
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const coverage=JSON.parse(fs.readFileSync(COVERAGE,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const ready=(intake.clubs||[]).find(c=>c.promotionReady);
if(!ready){console.log('League Two research promotion · no club is currently promotion-ready');process.exit(0);}
if(ready.readyPlayers!==16||ready.players?.length!==16)throw new Error(`League Two research promotion: ${ready.clubName} does not contain 16 complete players.`);
if(packs.clubs?.[ready.clubId])throw new Error(`League Two research promotion: ${ready.clubName} already exists in research-packs.json.`);
const identityRows=identities.clubs?.[ready.clubId]||[];
if(identityRows.length!==16)throw new Error(`League Two research promotion: ${ready.clubName} identity pack is not exactly 16 players.`);
const expected=new Set(identityRows.map(p=>p.footballName));
const sources=new Set(),players={};
for(const row of ready.players){
  if(!expected.has(row.footballName))throw new Error(`League Two research promotion: ${row.footballName} is not in ${ready.clubName}'s identity 16.`);
  if(!row.ready||row.requiredComplete!==3||row.sourcesComplete!==true)throw new Error(`League Two research promotion: ${ready.clubName}/${row.footballName} is incomplete.`);
  const age=row.fields?.age?.value,marketValueM=row.fields?.marketValueM?.value,position=row.fields?.position?.value;
  if(!Number.isFinite(Number(age))||Number(age)<15||Number(age)>50)throw new Error(`League Two research promotion: invalid age for ${row.footballName}.`);
  if(!Number.isFinite(Number(marketValueM))||Number(marketValueM)<0)throw new Error(`League Two research promotion: invalid market value for ${row.footballName}.`);
  if(!Number.isInteger(position)||position<0||position>7)throw new Error(`League Two research promotion: invalid SWOS position for ${row.footballName}.`);
  if(!Array.isArray(row.evidenceSources)||!row.evidenceSources.length)throw new Error(`League Two research promotion: missing source for ${row.footballName}.`);
  row.evidenceSources.forEach(s=>sources.add(s));
  const p={age:Number(age),marketValueM:Number(marketValueM),position};
  for(const key of ['minutes','goals','assists'])if(row.fields?.[key]?.status==='complete')p[key]=Number(row.fields[key].value);
  players[row.footballName]=p;
}
if(Object.keys(players).length!==16)throw new Error(`League Two research promotion: ${ready.clubName} did not produce 16 unique player records.`);

packs.clubs=packs.clubs||{};
packs.clubs[ready.clubId]={
  clubId:ready.clubId,
  label:ready.clubName,
  kind:'Evidence-gated League Two 2026/27 research pack',
  source:[...sources].join(' + '),
  evidenceNotes:[
    'Promoted only after all 16 published identities matched complete sourced age, market-value and SWOS-position evidence.',
    'A marketValueM of 0 is allowed only when the cited source publishes no market value; it is never an estimate.',
    'The source evidence file remains independently auditable.',
    'TEAM.* and .CAR writes remain locked.'
  ],
  players
};
const clubRows=Object.values(packs.clubs);
packs.packCount=clubRows.length;
packs.playerCount=clubRows.reduce((n,c)=>n+Object.keys(c.players||{}).length,0);
packs.snapshot='2026-09-27';
packs.generation=packs.generation||{};
packs.generation.leagueTwoEvidencePromotedClubIds=[...(packs.generation.leagueTwoEvidencePromotedClubIds||[]),ready.clubId].filter((v,i,a)=>a.indexOf(v)===i);

const divisionById=new Map((coverage.clubs||[]).map(c=>[c.id,c.division]));
let plCount=0,champCount=0,leagueOneCount=0,leagueTwoCount=0;
for(const id of Object.keys(packs.clubs)){
  const d=divisionById.get(id);
  if(d===0)plCount++;else if(d===1)champCount++;else if(d===2)leagueOneCount++;else if(d===3)leagueTwoCount++;
  else throw new Error(`League Two research promotion: unknown division for ${id}.`);
}
if(plCount!==20||champCount!==24||leagueOneCount!==24)throw new Error(`League Two research promotion: completed upper divisions regressed (PL ${plCount}/20, Championship ${champCount}/24, League One ${leagueOneCount}/24).`);
if(leagueTwoCount<1||leagueTwoCount>24||packs.packCount!==68+leagueTwoCount||packs.playerCount!==packs.packCount*16)throw new Error('League Two research promotion: pack totals are inconsistent.');

manifest.version=`2026.27-england-research-l2.${leagueTwoCount}`;
manifest.publishedAt='2026-09-27';
manifest.coverage=manifest.coverage||{};
for(const key of ['premierLeague','championship','leagueOne','leagueTwo','englandClubs'])manifest.coverage[key]=manifest.coverage[key]||{};
manifest.coverage.premierLeague.researchPackClubs=20;manifest.coverage.premierLeague.researchPackPlayers=320;
manifest.coverage.championship.researchPackClubs=24;manifest.coverage.championship.researchPackPlayers=384;
manifest.coverage.leagueOne.researchPackClubs=24;manifest.coverage.leagueOne.researchPackPlayers=384;
manifest.coverage.leagueTwo.researchPackClubs=leagueTwoCount;manifest.coverage.leagueTwo.researchPackPlayers=leagueTwoCount*16;
manifest.coverage.englandClubs.researchPackClubs=packs.packCount;manifest.coverage.englandClubs.researchPackPlayers=packs.playerCount;
manifest.dataModel=manifest.dataModel||{};manifest.dataModel.multiDivisionResearchPacks=true;manifest.dataModel.leagueTwoEvidencePromotion=true;
manifest.dataRevisions=manifest.dataRevisions||{};
manifest.dataRevisions.identity='2026.27-england-identity.92';
manifest.dataRevisions.championshipResearch=24;
manifest.dataRevisions.leagueOneResearch=24;
manifest.dataRevisions.leagueTwoResearch=leagueTwoCount;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('League Two research promotion published '));
manifest.notes.push(`League Two research promotion published ${ready.clubId}; League Two research coverage is now ${leagueTwoCount}/24 while the top three divisions remain complete.`);
fs.writeFileSync(PACKS,JSON.stringify(packs,null,2)+'\n','utf8');
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){fs.mkdirSync('dist/football-db',{recursive:true});fs.copyFileSync(PACKS,'dist/football-db/research-packs.json');fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');}
console.log(`League Two research promotion complete · ${ready.clubId} · League Two ${leagueTwoCount}/24 · all research ${packs.packCount} clubs / ${packs.playerCount} players · DB ${manifest.version}`);
