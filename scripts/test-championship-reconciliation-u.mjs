import assert from 'node:assert/strict';
import fs from 'node:fs';
const raw=JSON.parse(fs.readFileSync('data/master-2026-27.json','utf8'));
const master=JSON.parse(fs.readFileSync('dist/data/master-2026-27.json','utf8'));
const audit=JSON.parse(fs.readFileSync('dist/data/source-audit-2026-27.json','utf8'));
const batch=JSON.parse(fs.readFileSync('data/championship-reconciliation-u-2026-11-18.json','utf8'));
assert.equal(batch.season,'2026/27');
const seen=new Set();let newLinks=0,checks=0;
for(const c of batch.clubs){
 for(const e of [...c.players,...c.discrepancies,...c.membership]){const key=c.clubId+'|'+e.player;assert.ok(!seen.has(key));seen.add(key);checks++;}
 for(const e of c.players){
  const before=raw.clubs.find(x=>x.clubId===c.clubId).players.find(x=>x.player===e.player);
  const after=master.clubs.find(x=>x.clubId===c.clubId).players.find(x=>x.player===e.player);
  const p=audit.players.find(x=>x.clubId===c.clubId&&x.player===e.player);
  assert.equal(after.shirt,before.shirt);assert.equal(after.marketValueM,before.marketValueM);
  assert.equal(after.nationality,before.nationality);assert.equal(after.position,before.position);
  if(!e.alreadyLinked){newLinks++;assert.equal(p.squadSourceUrl,c.sourceUrl);assert.equal(p.independentSeasonRosterNumber,e.shirt);assert.equal(p.independentSeasonRosterClassification,c.classification);assert.equal(p.officialClubSourceUrl,null);}
 }
 for(const e of c.discrepancies){const p=audit.players.find(x=>x.clubId===c.clubId&&x.player===e.player);assert.equal(p.shirt,e.stored);assert.equal(p.researchPriority,'URGENT');assert.ok(audit.valuationReviewFlags.some(f=>f.clubId===c.clubId&&f.player===e.player&&f.sourceValue===e.sourceValue));}
 for(const e of c.membership){const p=audit.players.find(x=>x.clubId===c.clubId&&x.player===e.player);assert.ok(p);assert.equal(p.membershipReviewStatus,e.reviewStatus);assert.equal(p.researchPriority,'URGENT');assert.ok(audit.membershipReviewFlags.some(f=>f.clubId===c.clubId&&f.player===e.player));}
}
assert.equal(checks,48);assert.equal(newLinks,42);assert.ok(audit.summary.squadLinked>=806,'Later evidence batches must not reduce total linked squads');
assert.equal(audit.summary.priced,1234);assert.equal(audit.summary.players,1472);
assert.ok(fs.readFileSync('dist/source-audit-2026-27.html','utf8').includes('loan_away_review'));
console.log('Integration U: 48 Championship slots reviewed; 42 new independent squad links; four shirt conflicts and one loan flagged, no gameplay data changed.');
