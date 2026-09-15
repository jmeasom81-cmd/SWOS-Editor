import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const steps=['build-v196.mjs','validate-league-two-identity-evidence-source.mjs','publish-league-two-identity-queue.mjs','publish-league-two-identity-intake.mjs','complete-league-two-identities.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v197.mjs'];
let preservedHtml=null;
for(const step of steps){if(!fs.existsSync(step))throw new Error(`SWOS v1.97 build runner: missing ${step}.`);if(preservedHtml!==null)fs.writeFileSync('dist/index.html',preservedHtml);console.log(`\n▶ ${step}`);execFileSync(process.execPath,[step],{stdio:'inherit'});if(fs.existsSync('dist/index.html')&&(step.startsWith('patch-')||preservedHtml===null))preservedHtml=fs.readFileSync('dist/index.html');else if(preservedHtml!==null)fs.writeFileSync('dist/index.html',preservedHtml);}
console.log('\nSWOS Studio v1.97.0 build chain complete.');
