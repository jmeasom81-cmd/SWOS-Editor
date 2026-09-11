import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const steps=['build.mjs','validate-england-research-expansion.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v169.mjs'];
for(const step of steps){
  if(!fs.existsSync(step))throw new Error(`SWOS v1.69 wrapper: missing ${step}`);
  console.log(`\n▶ v1.69 ${step}`);
  execFileSync(process.execPath,[step],{stdio:'inherit'});
}
console.log('\nSWOS Studio v1.69 wrapper complete.');
