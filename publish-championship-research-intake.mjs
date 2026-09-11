import fs from 'node:fs';
import path from 'node:path';

const QUEUE='football-db/championship-research-queue.json';
const EVIDENCE_DIR='football-db/championship-research-evidence';
const OUT='football-db/championship-research-intake.json';
const MANIFEST='football-db/manifest.json';
for(const file of [QUEUE,MANIFEST,path.join(EVIDENCE_DIR,'schema-v1.json')])if(!fs.existsSync(file))throw new Error(`Championship research intake: missing ${file}.`);
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
if(queue.totals?.clubs!==24||queue.totals?.stagedPlayers!==384)throw new Error('Championship research intake: expected a complete 24-club / 384-player queue.');

const evidenceByClub={};
for(const file of fs.readdirSync(EVIDENCE_DIR).filter(f=>f.endsWith('.json')&&f!=='schema-v1.json').sort()){
  const full=path.join(EVIDENCE_DIR,file);
  const doc=JSON.parse(fs.readFileSync(full,'utf8'));
  if(doc.schemaVersion!==1||doc.season!=='2026/27'||!doc.clubId||!doc.players)throw new Error(`${file}: invalid Championship research evidence envelope.`);
  if(evidenceByClub[doc.clubId])throw new Error(`${file}: duplicate Championship research evidence for ${doc.clubId}.`);
  evidenceByClub[doc.clubId]={...doc,file};
}
const queuedIds=new Set((queue.queue||[]).map(c=>c.clubId));
for(const id of Object.keys(evidenceByClub))if(!queuedIds.has(id))throw new Error(`Championship research intake: evidence exists for non-queued club ${id}.`);

const required=['age','marketValueM','position'];
const optional=['minutes','goals','assists'];
const clubs=[];
let requiredCells=0,completeCells=0,playersComplete=0;
for(const queued of queue.queue||[]){
  const evidence=evidenceByClub[queued.clubId]||null;
  const expectedNames=new Set((queued.players||[]).map(p=>p.footballName));
  if(evidence){
    const names=Object.keys(evidence.players||{});
    if(names.length!==16)throw new Error(`${evidence.file}: expected exactly 16 researched players, found ${names.length}.`);
    for(const name of names)if(!expectedNames.has(name))throw new Error(`${evidence.file}: ${name} is not in the staged ${queued.clubName} identity 16.`);
    for(const name of expectedNames)if(!Object.prototype.hasOwnProperty.call(evidence.players,name))throw new Error(`${evidence.file}: staged player ${name} is missing.`);
  }
  const players=(queued.players||[]).map(p=>{
    const ev=evidence?.players?.[p.footballName]||null;
    const fields={};let complete=0;
    for(const key of required){
      requiredCells++;
      const value=ev?.[key];
      const ok=key==='position'?Number.isInteger(value)&&value>=0&&value<=7:key==='age'?Number.isFinite(Number(value))&&Number(value)>=15&&Number(value)<=50:Number.isFinite(Number(value))&&Number(value)>=0;
      fields[key]={status:ok?'complete':'pending',value:ok?value:null};
      if(ok){completeCells++;complete++;}
    }
    for(const key of optional){
      const value=ev?.[key];
      if(value!=null&&(!Number.isFinite(Number(value))||Number(value)<0))throw new Error(`${queued.clubName}/${p.footballName}: invalid ${key}.`);
      fields[key]={status:value!=null?'complete':'optional',value:value??null};
    }
    const hasSources=Array.isArray(ev?.sources)&&ev.sources.length>0&&ev.sources.every(s=>String(s||'').trim());
    const ready=complete===required.length&&hasSources;
    if(ev&&!hasSources)throw new Error(`${queued.clubName}/${p.footballName}: research evidence has no valid source.`);
    if(ready)playersComplete++;
    return {
      slot:p.slot,
      footballName:p.footballName,
      identity:{group:p.group,nationality:p.nationality,shirt:p.shirt,source:p.identitySource},
      requiredComplete:complete,
      requiredTotal:required.length,
      sourcesComplete:hasSources,
      ready,
      fields,
      evidenceSources:ev?.sources||[],
      notes:ev?.notes||null
    };
  });
  const readyPlayers=players.filter(p=>p.ready).length;
  if(readyPlayers!==0&&readyPlayers!==16)throw new Error(`Championship research intake: ${queued.clubName} is partially ready (${readyPlayers}/16); only complete club evidence files are admitted.`);
  clubs.push({
    order:queued.order,
    clubId:queued.clubId,
    clubName:queued.clubName,
    evidenceFile:evidence?.file||null,
    readyPlayers,
    totalPlayers:players.length,
    promotionReady:readyPlayers===16,
    status:readyPlayers===16?'promotion-ready':'evidence-required',
    players
  });
}
const promotionReady=clubs.filter(c=>c.promotionReady);
const nextEvidenceRequired=clubs.find(c=>!c.promotionReady)||null;
const out={
  schemaVersion:1,
  season:'2026/27',
  generatedAt:new Date().toISOString(),
  division:{code:1,name:'Championship',clubs:24},
  policy:{
    requiredFields:required,
    sourceRequiredPerPlayer:true,
    optionalFields:optional,
    evidenceFilesMustContainExactIdentity16:true,
    promotionRequires16CompletePlayers:true,
    autoPromote:false,
    noFabricatedValues:true,
    binaryWritesRemainLocked:true
  },
  totals:{
    clubs:clubs.length,
    players:clubs.reduce((n,c)=>n+c.totalPlayers,0),
    playersResearchComplete:playersComplete,
    requiredEvidenceCells:requiredCells,
    requiredEvidenceCellsComplete:completeCells,
    promotionReadyClubs:promotionReady.length,
    evidenceRequiredClubs:clubs.length-promotionReady.length
  },
  nextEvidenceRequired:nextEvidenceRequired?{clubId:nextEvidenceRequired.clubId,clubName:nextEvidenceRequired.clubName,status:nextEvidenceRequired.status}:null,
  promotionReadyClubIds:promotionReady.map(c=>c.clubId),
  clubs
};
if(out.totals.clubs!==24||out.totals.players!==384||out.totals.requiredEvidenceCells!==1152)throw new Error('Championship research intake: structural totals are inconsistent.');
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
manifest.resources=manifest.resources||{};
manifest.resources.championshipResearchIntake=OUT;
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.championshipResearchIntake=true;
manifest.dataModel.championshipResearchPromotionGuard=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Championship research intake tracks '));
manifest.notes.push(`Championship research intake tracks ${requiredCells} required evidence cells across 384 selected players; ${completeCells} are complete and ${promotionReady.length} club(s) currently pass the research promotion guard.`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db',{recursive:true});
  fs.copyFileSync(OUT,'dist/football-db/championship-research-intake.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}
console.log(`Championship research intake published · 24 clubs / 384 players · ${completeCells}/1152 required evidence cells complete · ${promotionReady.length} promotion-ready club(s).`);
