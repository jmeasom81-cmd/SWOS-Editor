import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const steps=[
  'publish-identities.mjs','validate-football-db.mjs','publish-coverage.mjs',
  'patch-v133.mjs','patch-v1331.mjs','patch-v134.mjs','patch-v135.mjs','patch-v1351.mjs','patch-v136.mjs','patch-v1361.mjs','patch-v137.mjs','patch-v138.mjs','patch-v139.mjs','patch-v140.mjs','patch-v141.mjs','patch-v142.mjs','patch-v143.mjs','patch-v144.mjs','patch-v145.mjs',
  'publish-club-packs.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs',
  'patch-v146.mjs','patch-v147.mjs','patch-v148.mjs','patch-v149.mjs','patch-v150.mjs','patch-v151.mjs','patch-v152.mjs','patch-v153.mjs','patch-v154.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs','patch-v155.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs','patch-v156.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs','patch-v157.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs',
  'promote-research-evidence.mjs','validate-football-db.mjs','publish-coverage.mjs','publish-research-queue.mjs','publish-research-intake.mjs',
  'patch-v158.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v1581.mjs',

  'validate-identity-evidence-source.mjs',
  'publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs','promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v159.mjs',

  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-evidence-intake.mjs','publish-identity-expansion-queue.mjs',
  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v160.mjs',

  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs',
  'publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v161.mjs',

  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v162.mjs',

  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v163.mjs',

  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v164.mjs',

  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v165.mjs',

  'promote-identity-evidence.mjs','publish-identities.mjs','validate-england-identity-expansion.mjs','publish-coverage.mjs','publish-identity-expansion-queue.mjs','publish-identity-evidence-intake.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v166.mjs',

  'complete-championship-identities.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v167.mjs',

  'publish-championship-research-queue.mjs','validate-championship-research-evidence-source.mjs','publish-championship-research-intake.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v168.mjs',

  'validate-england-research-expansion.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs','patch-v169.mjs'
];

for(const step of steps){if(!fs.existsSync(step))throw new Error(`SWOS build runner: missing ${step}`);console.log(`\n▶ ${step}`);execFileSync(process.execPath,[step],{stdio:'inherit'});}
console.log('\nSWOS Studio build chain complete.');
