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

// Preserve the already-patched Studio shell while the data-only promotion
// subprocesses advance the remaining Championship clubs. Some build hosts
// restore the pre-subprocess dist file after a nested runner exits.
const distHtmlPath='dist/index.html';
const preservedDistHtml=fs.existsSync(distHtmlPath)?fs.readFileSync(distHtmlPath,'utf8'):null;

for(const step of cycle)if(!fs.existsSync(step))throw new Error(`Championship completion: missing ${step}`);

let wave=0;
while(wave<24){
  const current=fs.existsSync('football-db/identity-expansion-queue.json')?JSON.parse(fs.readFileSync('football-db/identity-expansion-queue.json','utf8')):null;
  if(current?.totals?.identityReady===24&&current?.totals?.evidenceRequired===0&&current?.next===null)break;
  wave++;
  console.log(`\n▶ Championship completion promotion ${wave} (bounded at 24)`);
  for(const step of cycle)execFileSync(process.execPath,[step],{stdio:'inherit'});
}

// Refresh every derived identity resource once more from the completed state.
for(const step of ['publish-identities.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs','validate-england-identity-expansion.mjs'])execFileSync(process.execPath,[step],{stdio:'inherit'});

const queue=JSON.parse(fs.readFileSync('football-db/identity-expansion-queue.json','utf8'));
const intake=JSON.parse(fs.readFileSync('football-db/identity-intake.json','utf8'));
if(queue.totals?.identityReady!==24||queue.totals?.evidenceRequired!==0||queue.next!==null)throw new Error(`Championship completion failed after ${wave} bounded promotion cycle(s): expected 24/24 identity-ready with no next club; found ${queue.totals?.identityReady}/24 and next ${queue.next?.clubName||'none'}.`);
if(intake.totals?.identityReady!==24||intake.next!==null||intake.totals?.promotionReadyClubs!==0)throw new Error('Championship completion failed: final intake is not closed cleanly.');
if(preservedDistHtml!==null)fs.writeFileSync(distHtmlPath,preservedDistHtml,'utf8');
for(const file of ['football-db/identity-packs/championship-promoted.json','football-db/identities.json','football-db/manifest.json','football-db/coverage.json','football-db/identity-expansion-queue.json','football-db/identity-intake.json','football-db/validation.json']){const content=fs.readFileSync(file);fs.writeFileSync(file,content);}
console.log(`Championship identity completion PASS · 24/24 clubs identity-ready · no evidence queue remains · ${wave} completion cycle(s) used.`);
