import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('dist/data/source-audit-2026-27.json','utf8'));
const master=JSON.parse(fs.readFileSync('dist/data/master-2026-27.json','utf8'));
assert.equal(data.season,'2026/27');
assert.equal(data.summary.players,1472);
assert.equal(data.clubs.length,92);
assert.equal(data.players.length,1472);
assert.equal(data.divisions.length,4);
assert.equal(new Set(data.clubs.map(c=>c.clubId)).size,92);
assert.equal(data.summary.ready,master.clubs.flatMap(c=>c.players).filter(p=>['shirt','nationality','position','marketValueM'].every(k=>p[k]!==null&&p[k]!==undefined&&p[k]!=='')).length);
assert.equal(data.summary.squadLinked,data.players.filter(p=>p.squadSourceUrl).length);
assert.equal(data.summary.valuedWithoutIndividualSource,data.players.filter(p=>p.marketValueM!==null&&!p.valueSourceUrl).length);
assert.equal(data.summary.nameCollisionRows,data.players.filter(p=>p.sameNameOtherClubs.length).length);
assert.ok(data.players.every(p=>p.sameNameOtherClubs.every(c=>typeof c==='string'&&c.length>0)));
for(const c of data.clubs){
 const rows=data.players.filter(p=>p.clubId===c.clubId);
 assert.equal(rows.length,16,'SWOS team must contain 16 players: '+c.clubId);
 assert.equal(rows.filter(p=>p.squadSourceUrl).length,c.squadLinked);
 assert.ok(c.homeShirtSourceUrl.startsWith('https://'));
}
const page=fs.readFileSync('dist/source-audit-2026-27.html','utf8');
const gaps=fs.readFileSync('dist/gaps-2026-27.html','utf8');
const home=fs.readFileSync('dist/index.html','utf8');
assert.ok(page.includes('Squad &amp; Source Audit'));
assert.ok(!page.includes('__SWOS_SOURCE_AUDIT_DATA__'));
assert.ok(page.includes('const DATA='));
assert.ok(home.includes('href="/source-audit-2026-27.html"'));
assert.ok(gaps.includes('href="/source-audit-2026-27.html"'));
const csv=fs.readFileSync('dist/downloads/SWOS_Source_Audit_2026-27.csv','utf8');
assert.equal(csv.trim().split(/\r?\n/).length,1473,'Audit CSV header + 1,472 players');
console.log('SWOS source audit checked: '+data.summary.players+' rows, '+data.summary.squadLinked+' squad links, '+data.summary.valuedWithoutIndividualSource+' valuations lacking individual evidence links.');

// Official Premier League number verification preserves the independently recorded 2026/27 source.
const verification=JSON.parse(fs.readFileSync('data/premier-league-official-verification-batch-m-2026-10-10.json','utf8'));
assert.equal(verification.newlyVerified.length,10);
assert.equal(verification.newlyVerified.reduce((n,c)=>n+c.players.length,0),160);
assert.equal(data.summary.officialPLLinked,320);
assert.equal(data.divisions.find(d=>d.division==='Premier League').officialPLLinked,320);
for(const c of master.clubs.filter(c=>c.division==='Premier League')){
 for(const p of c.players){
  assert.equal(p.officialPLRosterUrl,verification.sourceUrl);
  assert.equal(p.officialPLRosterCheckedAt,verification.checkedAt);
  assert.equal(p.officialPLSquadNumber,p.shirt);
 }
}
for(const group of verification.newlyVerified){const c=master.clubs.find(c=>c.clubId===group.clubId);for(const x of group.players){const p=c.players.find(p=>p.player===x.player);assert.equal(p.shirt,x.shirt);}}
console.log('Official 2026/27 Premier League roster crosscheck: 320 player shirt numbers across all 20 clubs.');
