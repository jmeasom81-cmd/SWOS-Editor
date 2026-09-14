import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

export function runChampionshipResearchRelease(previousBuild,patch,version){
  let preservedHtml=null;
  function run(step){if(!fs.existsSync(step))throw new Error(`SWOS ${version} build runner: missing ${step}`);if(preservedHtml!==null)fs.writeFileSync('dist/index.html',preservedHtml);console.log(`\n▶ ${step}`);execFileSync(process.execPath,[step],{stdio:'inherit'});if(fs.existsSync('dist/index.html')&&(step.startsWith('patch-')||preservedHtml===null))preservedHtml=fs.readFileSync('dist/index.html');else if(preservedHtml!==null)fs.writeFileSync('dist/index.html',preservedHtml);}
  run(previousBuild);
  // Re-publish the completed identity feed at each wrapper boundary. This
  // prevents a nested build host from exposing the penultimate promotion file.
  run('publish-identities.mjs');
  run('publish-coverage.mjs');
  run('publish-identity-expansion-queue.mjs');
  run('publish-identity-evidence-intake.mjs');
  for(const step of ['promote-championship-research-evidence.mjs','publish-coverage.mjs','publish-championship-research-queue.mjs','validate-championship-research-evidence-source.mjs','publish-championship-research-intake.mjs','validate-england-research-expansion.mjs','publish-football-db-dist.mjs','validate-football-db-dist.mjs',patch])run(step);
  console.log(`\nSWOS Studio ${version} build chain complete.`);
}
