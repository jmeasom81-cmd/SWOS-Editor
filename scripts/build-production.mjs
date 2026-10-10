import {spawnSync} from 'node:child_process';
const steps = [
  "scripts/test-research-safety.mjs",
  "patch-v133.mjs",
  "patch-v1331.mjs",
  "patch-v134.mjs",
  "scripts/build-master-tracker.mjs",
  "scripts/build-kit-guide.mjs",
  "scripts/build-gap-review.mjs",
  "scripts/build-source-audit.mjs",
  "scripts/test-source-audit.mjs"
];
for (const file of steps) {
 console.log('[SWOS build] '+file);
 const run=spawnSync(process.execPath,[file],{stdio:'inherit',env:process.env});
 if (run.error) {console.error(run.error);process.exit(1);}
 if (run.status!==0) {console.error('[SWOS build failed] '+file);process.exit(run.status||1);}
}
console.log('[SWOS build] All '+steps.length+' steps completed.');
