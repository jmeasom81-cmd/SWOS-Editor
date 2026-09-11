import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

function run(step){if(!fs.existsSync(step))throw new Error(`SWOS v1.72 build runner: missing ${step}`);console.log(`\n▶ ${step}`);execFileSync(process.execPath,[step],{stdio:'inherit'});}

// v1.71 rebuild applies the post-window identity correction from source and promotes Birmingham + Blackburn.
run('build-v171.mjs');

// Promote the next complete, corrected Championship pack: Bolton Wanderers.
for(const step of [
  'promote-championship-research-evidence.mjs',
  'publish-coverage.mjs',
  'publish-championship-research-queue.mjs',
  'validate-championship-research-evidence-source.mjs',
  'publish-championship-research-intake.mjs',
  'validate-england-research-expansion.mjs',
  'publish-football-db-dist.mjs',
  'validate-football-db-dist.mjs',
  'patch-v172.mjs'
])run(step);

console.log('\nSWOS Studio v1.72.0 build chain complete.');
