import fs from 'node:fs';
import path from 'node:path';

const QUEUE='football-db/research-queue.json';
const EVIDENCE_DIR='football-db/research-evidence';
const OUT='football-db/research-intake.json';
const MANIFEST='football-db/manifest.json';
for(const file of [QUEUE,MANIFEST])if(!fs.existsSync(file))throw new Error(`Research intake: missing ${file}.`);
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const required=['age','marketValueM','position'];
const optional=['minutes','goals','assists'];

const evidenceByClub={};
if(fs.existsSync(EVIDENCE_DIR)){
  for(const file of fs.readdirSync(EVIDENCE_DIR).filter(f=>f.endsWith('.json')&&f!=='schema-v1.json').sort()){
    const full=path.join(EVIDENCE_DIR,file);
    const doc=JSON.parse(fs.readFileSync(full,'utf8'));
    if(doc.schemaVersion!==1||doc.season!=='2026/27'||!doc.clubId||!doc.players)throw new Error(`${file}: invalid research evidence envelope.`);
    if(evidenceByClub[doc.clubId])throw new Error(`${file}: duplicate research evidence for ${doc.clubId}.`);
    evidenceByClub[doc.clubId]={...doc,file};
  }
}

function validRequired(key,value){
  if(key==='position')return Number.isInteger(value)&&value>=0&&value<=7;
  if(key==='age')return Number.isFinite(Number(value))&&Number(value)>=15&&Number(value)<=50;
  if(key==='marketValueM')return Number.isFinite(Number(value))&&Number(value)>=0;
  return false;
}
function validOptional(value){return value==null||(Number.isFinite(Number(value))&&Number(value)>=0)}

const clubs=[];
let requiredCells=0,completeCells=0,playersComplete=0;
for(const queued of queue.queue||[]){
  const evidence=evidenceByClub[queued.clubId];
  const expectedNames=new Set((queued.players||[]).map(p=>p.footballName));
  if(evidence){
    for(const name of Object.keys(evidence.players||{}))if(!expectedNames.has(name))throw new Error(`${evidence.file}: ${name} is not in the staged ${queued.clubName} 16.`);
  }
  const players=(queued.players||[]).map(p=>{
    const ev=evidence?.players?.[p.footballName]||null;
    if(ev&&!Array.isArray(ev.sources))throw new Error(`${queued.clubName}:${p.footballName} evidence must include sources.`);
    const fields={};
    let complete=0;
    for(const key of required){
      requiredCells++;
      const ok=!!ev&&validRequired(key,ev[key]);
      fields[key]={status:ok?'complete':'pending',value:ok?ev[key]:null};
      if(ok){completeCells++;complete++;}
    }
    for(const key of optional){
      if(ev?.[key]!=null&&!validOptional(ev[key]))throw new Error(`${queued.clubName}:${p.footballName}:${key} is invalid.`);
      fields[key]={status:ev?.[key]!=null?'complete':'optional',value:ev?.[key]??null};
    }
    const ready=complete===required.length;
    if(ready)playersComplete++;
    return {
      slot:p.slot,
      footballName:p.footballName,
      identity:{group:p.group,nationality:p.nationality,shirt:p.shirt,source:p.identitySource},
      requiredComplete:complete,
      requiredTotal:required.length,
      ready,
      fields,
      evidenceSources:ev?.sources||[],
      notes:ev?.notes||null
    };
  });
  const readyPlayers=players.filter(p=>p.ready).length;
  clubs.push({
    order:queued.order,
    clubId:queued.clubId,
    clubName:queued.clubName,
    evidenceFile:evidence?.file||null,
    readyPlayers,
    totalPlayers:players.length,
    promotionReady:readyPlayers===16,
    status:readyPlayers===16?'promotion-ready':readyPlayers?'in-progress':'evidence-required',
    players
  });
}
const promotionReady=clubs.filter(c=>c.promotionReady);
const next=clubs.find(c=>!c.promotionReady)||null;
const out={
  schemaVersion:1,
  season:queue.season,
  generatedAt:new Date().toISOString(),
  policy:{
    requiredFields:required,
    optionalFields:optional,
    evidenceSourceRequired:true,
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
    promotionReadyClubs:promotionReady.length
  },
  next:next?{clubId:next.clubId,clubName:next.clubName,status:next.status}:null,
  promotionReadyClubIds:promotionReady.map(c=>c.clubId),
  clubs
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
manifest.resources=manifest.resources||{};
manifest.resources.researchIntake=OUT;
manifest.resources.researchEvidenceSchema='football-db/research-evidence/schema-v1.json';
manifest.dataModel=manifest.dataModel||{};
manifest.dataModel.researchEvidenceIntake=true;
manifest.dataModel.researchPromotionGuard=true;
manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];
manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Research evidence intake tracks '));
manifest.notes.push(`Research evidence intake tracks ${out.totals.requiredEvidenceCells} required evidence cells across ${out.totals.players} staged players; ${out.totals.requiredEvidenceCellsComplete} are complete and ${out.totals.promotionReadyClubs} clubs currently pass the promotion guard.`);
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
if(fs.existsSync('dist')){
  fs.mkdirSync('dist/football-db/research-evidence',{recursive:true});
  fs.copyFileSync(OUT,'dist/football-db/research-intake.json');
  fs.copyFileSync('football-db/research-evidence/schema-v1.json','dist/football-db/research-evidence/schema-v1.json');
  fs.copyFileSync(MANIFEST,'dist/football-db/manifest.json');
}
console.log(`Published research intake · ${clubs.length} clubs / ${out.totals.players} players · ${completeCells}/${requiredCells} required evidence cells complete · ${promotionReady.length} promotion-ready clubs`);
