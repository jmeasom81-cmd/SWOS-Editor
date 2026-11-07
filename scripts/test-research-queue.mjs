import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Regression: the visible research worklist must agree with the canonical
// source audit about linked squad evidence. No game or research files edited.
const html=fs.readFileSync('research-queue.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script,'Missing inline research application');
assert.doesNotThrow(()=>new vm.Script(script[1]),'Research app JS must parse');
const start=script[1].indexOf('var q=function');
const end=script[1].indexOf('function selected(){');
assert.ok(start>=0&&end>start,'Research helper functions moved');
const {squadEvidenceUrl,rowsForClub}=vm.runInNewContext(
 '(function(){'+script[1].slice(start,end)+';return {squadEvidenceUrl,rowsForClub}})()',
 Object.create(null),{timeout:3000}
);
const master=JSON.parse(fs.readFileSync('dist/data/master-2026-27.json','utf8'));
const audit=JSON.parse(fs.readFileSync('dist/data/source-audit-2026-27.json','utf8'));
assert.equal(master.clubs.length,92);
const all=master.clubs.flatMap(c=>c.players);
assert.equal(all.length,1472);
assert.equal(all.filter(p=>!!squadEvidenceUrl(p)).length,audit.summary.squadLinked,
 'Research worklist and source audit disagree on linked squad sources');
assert.equal(all.filter(p=>!squadEvidenceUrl(p)).length,audit.summary.squadUnlinked);
const cases=[
 ['Official league', 'officialPLRosterUrl'],
 ['Official club', 'officialClubSourceUrl'],
 ['Match sheet', 'matchLineupSourceUrl'],
 ['Independent roster', 'independentSeasonRosterUrl'],
 ['Season squad', 'seasonSquadSourceUrl'],
 ['No evidence', null]
].map(([player,field],i)=>{
 const p={player,shirt:i+1,marketValueM:null,nationality:'ENG'};
 if(field)p[field]='https://example.org/'+(i+1);
 return p;
});
const results=rowsForClub({clubId:'fixture',club:'Fixture FC',division:'League Two',players:cases},{});
assert.equal(results.length,6);
for(let i=0;i<5;i++){
 assert.ok(!results[i].issues.includes('squad'),cases[i].player+' has linked evidence');
 assert.ok(results[i].links.some(l=>l.url==='https://example.org/'+(i+1)),cases[i].player+' evidence link missing');
}
assert.ok(results[5].issues.includes('squad'),'Missing evidence must be flagged');
assert.equal(results[5].links.length,0);
assert.ok(html.includes("!squadEvidenceUrl(p)"),'Header metric and player flag must share predicate');
assert.ok(html.includes('Official league roster')&&html.includes('Match sheet'));
assert.ok(html.includes('READ ONLY')&&html.includes('Export CSV'));
console.log('SWOS research queue: '+audit.summary.squadLinked+' sourced / '+audit.summary.squadUnlinked+' unsourced players; source types and missing-source flags agree with the audit.');
