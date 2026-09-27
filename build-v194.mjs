import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

function run(step){
  if(!fs.existsSync(step))throw new Error(`SWOS v1.94 build runner: missing ${step}`);
  console.log(`\n▶ ${step}`);
  execFileSync(process.execPath,[step],{stdio:'inherit'});
}

run('build-v193.mjs');

for(const step of [
  'publish-coverage.mjs',
  'publish-club-profile-queue.mjs',
  'validate-club-profile-evidence-source.mjs',
  'publish-club-profile-intake.mjs',
  'validate-club-profiles.mjs',
  'patch-v194.mjs'
])run(step);

console.log('\nSWOS Studio v1.94.0 club-profile foundation build chain complete.');
