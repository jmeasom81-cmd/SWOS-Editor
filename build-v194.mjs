import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const steps=['build-v193.mjs','validate-league-one-identity-evidence-source.mjs','publish-league-one-identity-queue.mjs','publish-league-one-identity-intake.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v194.mjs'];
for(const step of steps){if(!fs.existsSync(step))throw new Error(`SWOS v1.94 build runner: missing ${step}.`);console.log(`\n▶ ${step}`);execFileSync(process.execPath,[step],{stdio:'inherit'});}console.log('\nSWOS Studio v1.94.0 build chain complete.');
