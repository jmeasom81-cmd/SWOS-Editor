import fs from 'node:fs';

const INTAKE='football-db/research-intake.json';
const PACKS='football-db/research-packs.json';
const MANIFEST='football-db/manifest.json';
for(const file of [INTAKE,PACKS,MANIFEST])if(!fs.existsSync(file))throw new Error(`Research promotion: missing ${file}.`);
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const packs=JSON.parse(fs.readFileSync(PACKS,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const promoted=[];

for(const club of intake.clubs||[]){
  if(!club.promotionReady)continue;
  if(club.readyPlayers!==16||club.players?.length!==16)throw new Error(`Research promotion: ${club.clubName} claims ready without 16 complete players.`);
  const players={};
  const sources=new Set();
  for(const row of club.players){
    if(!row.ready||row.requiredComplete!==row.requiredTotal)throw new Error(`Research promotion: ${club.clubName}/${row.footballName} is incomplete.`);
    const age=row.fields?.age?.value,marketValueM=row.fields?.marketValueM?.value,position=row.fields?.position?.value;
    if(!Number.isFinite(Number(age))||!Number.isFinite(Number(marketValueM))||!Number.isInteger(position))throw new Error(`Research promotion: ${club.clubName}/${row.footballName} required evidence is invalid.`);
    if(!Array.isArray(row.evidenceSources)||!row.evidenceSources.length)throw new Error(`Research promotion: ${club.clubName}/${row.footballName} has no source.`);
    row.evidenceSources.forEach(s=>sources.add(s));
    const p={age:Number(age),marketValueM:Number(marketValueM),position};
    for(const key of ['minutes','goals','assists'])if(row.fields?.[key]?.status==='complete')p[key]=Number(row.fields[key].value);
    players[row.footballName]=p;
  }
  packs.clubs[club.clubId]={
    clubId:club.clubId,
    label:club.clubName,
    kind:'Evidence-gated 2026/27 research pack',
    source:[...sources].join(' + '),
    evidenceNotes:[
      'Promoted automatically only after all 16 staged identities passed the research evidence guard.',
      'Every player has sourced age, market-value and exact SWOS-position evidence.',
      'Optional performance fields are included only when separately supplied and validated.',
      'TEAM.* and .CAR writes remain locked.'
    ],
    players
  };
  promoted.push(club.clubId);
}
const clubRows=Object.values(packs.clubs||{});
packs.packCount=clubRows.length;
packs.playerCount=clubRows.reduce((n,c)=>n+Object.keys(c.players||{}).length,0);
packs.snapshot='2026-09-11';
packs.generation=packs.generation||{};
packs.generation.evidencePromotedClubIds=promoted;
fs.writeFileSync(PACKS,JSON.stringify(packs,null,2)+'\n','utf8');

manifest.version=`2026.27-foundation.${packs.packCount}`;
manifest.publishedAt=packs.snapshot;
manifest.coverage=manifest.coverage||{};
manifest.coverage.premierLeague=manifest.coverage.premierLeague||{};
manifest.coverage.premierLeague.researchPackClubs=packs.packCount;
manifest.coverage.premierLeague.researchPackPlayers=packs.playerCount;
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.evidencePromotion=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Evidence promotion published '));
manifest.notes.push(`Evidence promotion published ${promoted.length?promoted.join(', '):'no new clubs'}; authoritative research feed now contains ${packs.packCount} clubs / ${packs.playerCount} players.`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db',{recursive:true});
  fs.copyFileSync(PACKS,'dist/football-db/research-packs.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}
console.log(`Evidence promotion complete · ${promoted.length} promoted club(s): ${promoted.join(', ')||'none'} · ${packs.packCount} packs / ${packs.playerCount} players · DB ${manifest.version}`);
