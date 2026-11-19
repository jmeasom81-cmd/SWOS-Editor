import assert from 'node:assert/strict';
import fs from 'node:fs';
const raw=JSON.parse(fs.readFileSync('data/master-2026-27.json','utf8'));
const master=JSON.parse(fs.readFileSync('dist/data/master-2026-27.json','utf8'));
const audit=JSON.parse(fs.readFileSync('dist/data/source-audit-2026-27.json','utf8'));
const batch=JSON.parse(fs.readFileSync('data/championship-reconciliation-v-2026-11-19.json','utf8'));
assert.equal(batch.entries.length,62);
assert.equal(batch.entries.filter(e=>e.kind==='official').length,15);
assert.equal(batch.unresolved.length,2);
assert.equal(new Set(batch.entries.map(e=>e.clubId+'|'+e.player)).size,62);
for(const e of batch.entries){
 const before=raw.clubs.find(c=>c.clubId===e.clubId).players.find(p=>p.player===e.player);
 const after=master.clubs.find(c=>c.clubId===e.clubId).players.find(p=>p.player===e.player);
 const p=audit.players.find(p=>p.clubId===e.clubId&&p.player===e.player);
 for(const f of ['shirt','nationality','position','marketValueM'])assert.equal(after[f],before[f],e.player+' changed '+f);
 assert.equal(p.squadSourceUrl,e.sourceUrl);
 if(e.kind==='official'){assert.equal(p.officialClubSourceUrl,e.sourceUrl);assert.equal(p.officialClubShirtNumber,e.shirt);assert.equal(p.officialClubSourceDate,e.sourceDate);}
 else{assert.equal(p.independentSeasonRosterUrl,e.sourceUrl);assert.equal(p.independentSeasonRosterNumber,e.shirt);assert.equal(p.officialClubSourceUrl,null);}
}
for(const e of batch.unresolved){const p=audit.players.find(p=>p.clubId===e.clubId&&p.player===e.player);assert.equal(p.squadSourceUrl,null);}
assert.equal(audit.summary.squadLinked,868);assert.equal(audit.summary.officialClubLinked,65);assert.equal(audit.summary.independentSeasonRosterLinked,164);assert.equal(audit.summary.priced,1234);assert.equal(audit.players.length,1472);
console.log('Roster V: 62 new links (15 club-issued, 47 independent); two Swansea reviews held; all stored gameplay fields unchanged.');
