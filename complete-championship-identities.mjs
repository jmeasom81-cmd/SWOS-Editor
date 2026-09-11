import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const cycle=[
  'promote-identity-evidence.mjs',
  'publish-identities.mjs',
  'validate-england-identity-expansion.mjs',
  'publish-coverage.mjs',
  'publish-identity-expansion-queue.mjs',
  'publish-identity-evidence-intake.mjs'
];

for(const step of cycle)if(!fs.existsSync(step))throw new Error(`Championship completion: missing ${step}`);

for(let wave=1;wave<=7;wave++){
  console.log(`\n▶ Championship completion promotion ${wave}/7`);
  for(const step of cycle)execFileSync(process.execPath,[step],{stdio:'inherit'});
}

const queue=JSON.parse(fs.readFileSync('football-db/identity-expansion-queue.json','utf8'));
const intake=JSON.parse(fs.readFileSync('football-db/identity-intake.json','utf8'));
if(queue.totals?.identityReady!==24||queue.totals?.evidenceRequired!==0||queue.next!==null)throw new Error(`Championship completion failed: expected 24/24 identity-ready with no next club; found ${queue.totals?.identityReady}/24 and next ${queue.next?.clubName||'none'}.`);
if(intake.totals?.identityReady!==24||intake.next!==null||intake.totals?.promotionReadyClubs!==0)throw new Error('Championship completion failed: final intake is not closed cleanly.');
console.log('Championship identity completion PASS · 24/24 clubs identity-ready · no evidence queue remains.');
