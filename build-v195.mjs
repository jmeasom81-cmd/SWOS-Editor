import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const steps=['build-v194.mjs','complete-league-one-identities.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v195.mjs'];
for(const step of steps){if(!fs.existsSync(step))throw new Error(`SWOS v1.95 build runner: missing ${step}.`);console.log(`\n▶ ${step}`);execFileSync(process.execPath,[step],{stdio:'inherit'});}console.log('\nSWOS Studio v1.95.0 build chain complete.');
