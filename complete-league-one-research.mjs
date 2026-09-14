import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const cycle=[
  'promote-league-one-research-evidence.mjs',
  'publish-coverage.mjs',
  'publish-league-one-research-queue.mjs',
  'validate-league-one-research-evidence-source.mjs',
  'publish-league-one-research-intake.mjs',
  'validate-england-research-expansion.mjs'
];
for(const step of cycle)if(!fs.existsSync(step))throw new Error(`League One research completion: missing ${step}.`);

const distHtmlPath='dist/index.html';
const preservedDistHtml=fs.existsSync(distHtmlPath)?fs.readFileSync(distHtmlPath,'utf8'):null;
let wave=0;
while(wave<24){
  const current=fs.existsSync('football-db/league-one-research-queue.json')?JSON.parse(fs.readFileSync('football-db/league-one-research-queue.json','utf8')):null;
  if(current?.progress?.researchReadyClubs===24&&current?.totals?.clubs===0&&current?.next===null)break;
  wave++;
  console.log(`\n▶ League One research promotion ${wave}/24`);
  for(const step of cycle)execFileSync(process.execPath,[step],{stdio:'inherit'});
}

for(const step of ['publish-coverage.mjs','publish-league-one-research-queue.mjs','validate-league-one-research-evidence-source.mjs','publish-league-one-research-intake.mjs','validate-england-research-expansion.mjs'])execFileSync(process.execPath,[step],{stdio:'inherit'});
const queue=JSON.parse(fs.readFileSync('football-db/league-one-research-queue.json','utf8'));
const intake=JSON.parse(fs.readFileSync('football-db/league-one-research-intake.json','utf8'));
const packs=JSON.parse(fs.readFileSync('football-db/research-packs.json','utf8'));
if(queue.progress?.researchReadyClubs!==24||queue.totals?.clubs!==0||queue.totals?.stagedPlayers!==0||queue.next!==null||queue.status!=='complete')throw new Error(`League One research completion failed after ${wave} promotion cycles.`);
if(intake.progress?.researchReadyClubs!==24||intake.totals?.clubs!==0||intake.totals?.promotionReadyClubs!==0||intake.nextPromotionReady!==null)throw new Error('League One research completion: final intake did not close cleanly.');
if(packs.packCount!==68||packs.playerCount!==1088)throw new Error(`League One research completion: expected 68 packs / 1,088 players; found ${packs.packCount} / ${packs.playerCount}.`);
if(preservedDistHtml!==null)fs.writeFileSync(distHtmlPath,preservedDistHtml,'utf8');
for(const file of ['football-db/research-packs.json','football-db/manifest.json','football-db/coverage.json','football-db/league-one-research-queue.json','football-db/league-one-research-intake.json','football-db/research-expansion-validation.json']){const content=fs.readFileSync(file);fs.writeFileSync(file,content);}
console.log(`League One research completion PASS · 24/24 clubs · 384 researched players · ${wave} bounded promotions · England research 68 clubs / 1,088 players.`);
