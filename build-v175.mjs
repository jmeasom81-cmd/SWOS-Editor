import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

function run(step){if(!fs.existsSync(step))throw new Error(`SWOS v1.75 build runner: missing ${step}`);console.log(`\n▶ ${step}`);execFileSync(process.execPath,[step],{stdio:'inherit'});}

run('build-v174.mjs');

for(const step of [
  'promote-championship-research-evidence.mjs',
  'publish-coverage.mjs',
  'publish-championship-research-queue.mjs',
  'validate-championship-research-evidence-source.mjs',
  'publish-championship-research-intake.mjs',
  'validate-england-research-expansion.mjs',
  'publish-football-db-dist.mjs',
  'validate-football-db-dist.mjs',
  'patch-v175.mjs'
])run(step);

console.log('\nSWOS Studio v1.75.0 build chain complete.');
