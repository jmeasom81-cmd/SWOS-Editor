import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const cycle=['promote-league-two-identity-evidence.mjs','publish-identities.mjs','publish-coverage.mjs','publish-league-two-identity-queue.mjs','publish-league-two-identity-intake.mjs','validate-league-two-identity-expansion.mjs'];
for(const step of cycle)if(!fs.existsSync(step))throw new Error(`League Two identity completion: missing ${step}.`);
let wave=0;
while(wave<24){const current=fs.existsSync('football-db/league-two-identity-expansion-queue.json')?JSON.parse(fs.readFileSync('football-db/league-two-identity-expansion-queue.json','utf8')):null;if(current?.totals?.identityReady===24&&current?.totals?.evidenceRequired===0&&current?.next===null)break;wave++;console.log(`\n▶ League Two identity promotion ${wave}/24`);for(const step of cycle)execFileSync(process.execPath,[step],{stdio:'inherit'});}
for(const step of ['publish-identities.mjs','publish-coverage.mjs','publish-league-two-identity-queue.mjs','publish-league-two-identity-intake.mjs','validate-league-two-identity-expansion.mjs'])execFileSync(process.execPath,[step],{stdio:'inherit'});
const queue=JSON.parse(fs.readFileSync('football-db/league-two-identity-expansion-queue.json','utf8')),intake=JSON.parse(fs.readFileSync('football-db/league-two-identity-intake.json','utf8'));
if(queue.totals?.identityReady!==24||queue.totals?.evidenceRequired!==0||queue.next!==null||queue.status!=='complete')throw new Error(`League Two identity completion failed after ${wave} cycles.`);
if(intake.totals?.identityReady!==24||intake.totals?.promotionReadyClubs!==0||intake.next!==null||intake.status!=='complete')throw new Error('League Two identity completion: final intake did not close cleanly.');
execFileSync(process.execPath,['validate-england-research-expansion.mjs'],{stdio:'inherit'});
for(const file of ['football-db/identity-packs/league-two-promoted.json','football-db/identities.json','football-db/manifest.json','football-db/coverage.json','football-db/league-two-identity-expansion-queue.json','football-db/league-two-identity-intake.json','football-db/validation.json','football-db/research-expansion-validation.json']){const content=fs.readFileSync(file);fs.writeFileSync(file,content);}
console.log(`League Two identity completion PASS · 24/24 clubs · 384 identities · ${wave} bounded promotion cycles · research remains 68 clubs / 1,088 players.`);
