import fs from 'node:fs';
import {patchChampionshipResearchRelease} from './patch-championship-research-release.mjs';

patchChampionshipResearchRelease({
  version:'1.93.0',
  previousVersion:'1.92.0',
  releaseId:'v193',
  previousReleaseId:'v192',
  clubId:'wrexham',
  clubName:'Wrexham',
  champReady:24,
  next:null,
  detail:'Wrexham’s exact 16-player pack passes the complete sourced evidence gate, closing the Championship research queue at 24 of 24 clubs.'
});

// Final division-completion assertions are deliberately stricter than an ordinary club promotion.
const queue=JSON.parse(fs.readFileSync('football-db/championship-research-queue.json','utf8'));
const intake=JSON.parse(fs.readFileSync('football-db/championship-research-intake.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('football-db/manifest.json','utf8'));

if(queue.status!=='complete'||queue.next!==null||queue.totals?.clubs!==0||queue.totals?.stagedPlayers!==0||queue.totals?.requiredEvidenceCells!==0){
  throw new Error('SWOS Studio v1.93.0 build failed: Championship queue is not fully closed.');
}
if(intake.nextPromotionReady!==null||intake.nextEvidenceRequired!==null||intake.totals?.clubs!==0||intake.totals?.players!==0||intake.totals?.requiredEvidenceCells!==0){
  throw new Error('SWOS Studio v1.93.0 build failed: Championship intake still exposes pending work.');
}
if(manifest.installation?.teamWriteReady!==false||manifest.installation?.careerWriteReady!==false){
  throw new Error('SWOS Studio v1.93.0 build failed: research completion must not unlock binary writes.');
}
console.log('Championship research completion guard PASS · 24/24 · queue closed · binary writes still locked.');
