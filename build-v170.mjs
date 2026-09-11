import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

function run(step){
  if(!fs.existsSync(step))throw new Error(`SWOS v1.70 build runner: missing ${step}`);
  console.log(`\n▶ ${step}`);
  execFileSync(process.execPath,[step],{stdio:'inherit'});
}

// Rebuild the guarded v1.68 foundation first.
run('build.mjs');

// Apply the division-aware research engine milestone.
for(const step of [
  'validate-england-research-expansion.mjs',
  'publish-football-db-dist.mjs',
  'validate-football-db-dist.mjs',
  'patch-v169.mjs'
])run(step);

// Promote Birmingham City only after its complete 16-player sourced evidence pack passes preflight.
for(const step of [
  'publish-championship-research-queue.mjs',
  'validate-championship-research-evidence-source.mjs',
  'publish-championship-research-intake.mjs',
  'promote-championship-research-evidence.mjs',
  'publish-coverage.mjs',
  'publish-championship-research-queue.mjs',
  'validate-championship-research-evidence-source.mjs',
  'publish-championship-research-intake.mjs',
  'validate-england-research-expansion.mjs',
  'publish-football-db-dist.mjs',
  'validate-football-db-dist.mjs',
  'patch-v170.mjs'
])run(step);

console.log('\nSWOS Studio v1.70.0 build chain complete.');
