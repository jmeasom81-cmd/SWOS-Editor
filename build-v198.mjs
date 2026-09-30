import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const steps=[
  'build-v197.mjs',
  'publish-league-two-research-queue.mjs',
  'validate-league-two-research-evidence-source.mjs',
  'publish-league-two-research-intake.mjs',
  'validate-england-research-expansion.mjs',
  'publish-football-db-dist.mjs',
  'validate-football-db-dist.mjs',
  'patch-v198.mjs'
];
for(const step of steps){
  if(!fs.existsSync(step))throw new Error(`SWOS v1.98 build runner: missing ${step}.`);
  console.log(`\n▶ ${step}`);
  execFileSync(process.execPath,[step],{stdio:'inherit'});
}
console.log('\nSWOS Studio v1.98.0 build chain complete.');
