import fs from 'node:fs';

const QUEUE='football-db/championship-research-queue.json';
const IDENTITIES='football-db/identities.json';
const OUT_DIR='football-db/championship-research-drafts';
const MANIFEST='football-db/manifest.json';

for(const file of [QUEUE,IDENTITIES,MANIFEST]){
  if(!fs.existsSync(file)) throw new Error(`Championship research draft: missing ${file}.`);
}

const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const identities=JSON.parse(fs.readFileSync(IDENTITIES,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const next=queue.next;

if(!next){
  console.log('Championship research draft · division complete, no next club.');
  process.exit(0);
}

const queued=(queue.queue||[]).find(c=>c.clubId===next.clubId);
if(!queued) throw new Error(`Championship research draft: next club ${next.clubId} is not present in the queue.`);

const identityRows=identities.clubs?.[next.clubId]||[];
if(identityRows.length!==16) throw new Error(`Championship research draft: ${next.clubName} must have exactly 16 verified identities; found ${identityRows.length}.`);

const queuedNames=new Set((queued.players||[]).map(p=>p.footballName));
if(queuedNames.size!==16) throw new Error(`Championship research draft: ${next.clubName} queue does not expose 16 unique players.`);
for(const row of identityRows){
  if(!queuedNames.has(row.footballName)) throw new Error(`Championship research draft: identity mismatch for ${row.footballName}.`);
}

fs.mkdirSync(OUT_DIR,{recursive:true});
const outPath=`${OUT_DIR}/${next.clubId}.json`;

const players={};
for(const row of identityRows){
  players[row.footballName]={
    identity:{
      group:row.group,
      nationality:row.nationality,
      shirt:row.shirt??null,
      source:row.source
    },
    research:{
      age:null,
      marketValueM:null,
      position:null,
      minutes:null,
      goals:null,
      assists:null,
      sources:[]
    },
    status:'evidence-required'
  };
}

const draft={
  schemaVersion:1,
  season:'2026/27',
  clubId:next.clubId,
  clubName:next.clubName,
  generatedAt:new Date().toISOString(),
  status:'under-construction',
  publicationPolicy:{
    exactIdentityPlayers:16,
    requiredFields:['age','marketValueM','position'],
    sourcesRequiredPerPlayer:true,
    autoPromote:false,
    incompleteDraftNeverEntersPublishedResearchPacks:true,
    binaryWritesRemainLocked:true
  },
  progress:{
    players:16,
    playersComplete:0,
    requiredEvidenceCells:48,
    requiredEvidenceCellsComplete:0
  },
  players
};

fs.writeFileSync(outPath,JSON.stringify(draft,null,2)+'\n','utf8');

manifest.resources=manifest.resources||{};
manifest.resources.championshipResearchDraft=outPath;
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.championshipResearchDraftWorkbench=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Championship research workbench staged '));
manifest.notes.push(`Championship research workbench staged ${next.clubName} as an under-construction exact-16 draft; no incomplete values are admitted to published research packs.`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');

if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db/championship-research-drafts',{recursive:true});
  fs.copyFileSync(outPath,`dist/${outPath}`);
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}

console.log(`Championship research workbench · ${next.clubName} staged · 16 verified identities · 48 evidence cells pending · publication locked.`);
