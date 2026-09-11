import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const steps=[
  'publish-identities.mjs',
  'validate-football-db.mjs',
  'publish-coverage.mjs',
  'patch-v133.mjs',
  'patch-v1331.mjs',
  'patch-v134.mjs',
  'patch-v135.mjs',
  'patch-v1351.mjs',
  'patch-v136.mjs',
  'patch-v1361.mjs',
  'patch-v137.mjs',
  'patch-v138.mjs',
  'patch-v139.mjs',
  'patch-v140.mjs',
  'patch-v141.mjs',
  'patch-v142.mjs',
  'patch-v143.mjs',
  'patch-v144.mjs',
  'patch-v145.mjs',
  'publish-club-packs.mjs',
  'validate-football-db.mjs',
  'publish-coverage.mjs',
  'patch-v146.mjs',
  'patch-v147.mjs',
  'patch-v148.mjs',
  'patch-v149.mjs',
  'patch-v150.mjs'
];

for(const step of steps){
  if(!fs.existsSync(step))throw new Error(`SWOS build runner: missing ${step}`);
  console.log(`\n▶ ${step}`);
  execFileSync(process.execPath,[step],{stdio:'inherit'});
}
console.log('\nSWOS Studio build chain complete.');
