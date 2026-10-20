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
const priorities=['URGENT','HIGH','MEDIUM','LOW','REVIEWED','CLEAR'];
assert.equal(priorities.reduce((n,k)=>n+data.summary[k.toLowerCase()],0),1472);
assert.ok(data.players.every(p=>priorities.includes(p.researchPriority)&&Array.isArray(p.researchIssues)&&typeof p.nextResearchAction==='string'));
assert.equal(data.summary.urgent,data.players.filter(p=>p.researchPriority==='URGENT').length);
assert.equal(data.summary.high,data.players.filter(p=>p.researchPriority==='HIGH').length);
assert.equal(data.players.filter(p=>p.reviewStatus==='membership_check').length,0);
assert.equal(data.players.filter(p=>p.reviewStatus==='membership_source_matched').length,2);
assert.equal(data.summary.urgent,5);
assert.equal(data.summary.ready,1234);
assert.equal(data.summary.squadLinked,764);
assert.ok(data.players.filter(p=>p.researchPriority==='REVIEWED').every(p=>p.reviewStatus==='value_unpublished'&&p.marketValueM===null));
assert.ok(page.includes('Next 15 clubs to research'));
assert.ok(page.includes('SWOS_Research_Priority_2026-27.csv'));
const priorityCsv=fs.readFileSync('dist/downloads/SWOS_Research_Priority_2026-27.csv','utf8');
assert.equal(priorityCsv.trim().split(/\r?\n/).length,1473-data.summary.clear);
console.log('SWOS priority audit: '+data.summary.urgent+' urgent, '+data.summary.high+' high, '+data.summary.medium+' squad links to research.');
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

const batchO=JSON.parse(fs.readFileSync('data/valuation-verification-batch-o-2026-10-20.json','utf8'));
assert.equal(data.valuationReviewFlags.length,batchO.discrepancyFlags.length);
assert.equal(new Set(data.valuationReviewFlags.map(v=>v.clubId+'|'+v.player)).size,3);
for(const v of batchO.valued){const p=data.players.find(p=>p.clubId===v.clubId&&p.player===v.player);assert.ok(p);assert.equal(p.marketValueM,v.convertedGbpM);assert.equal(p.valueSourceUrl,v.sourceUrl);}
for(const v of batchO.noPublishedValue){const p=data.players.find(p=>p.clubId===v.clubId&&p.player===v.player);assert.ok(p);assert.equal(p.marketValueM,null);assert.equal(p.reviewStatus,'value_unpublished');}
assert.ok(page.includes('Player shirt-number discrepancies'));

// Batch P: new first-party club evidence must not be mistaken for a valuation.
const clubBatch=JSON.parse(fs.readFileSync('data/leicester-official-16-player-audit-2026-10-20.json','utf8'));
assert.equal(clubBatch.players.length,16);
assert.equal(data.summary.officialClubLinked,50);
assert.equal(data.clubs.find(c=>c.clubId===clubBatch.clubId).officialClubLinked,16);
assert.equal(data.verifiedNameCorrections.length,1);
assert.equal(data.verifiedNameCorrections[0].to,'Tommy Watson');
assert.ok(!data.players.some(p=>p.clubId==='leicester-city'&&p.player==='Tom Watson'));
for(const x of clubBatch.players){
 const p=data.players.find(p=>p.clubId===clubBatch.clubId&&p.player===x.player);
 assert.ok(p,'Official club player missing '+x.player);
 assert.equal(p.shirt,x.shirt);
 assert.equal(p.officialClubSourceUrl,x.sourceUrl);
 assert.equal(p.officialClubShirtNumber,x.shirt);
 assert.equal(p.officialClubSourceDate,x.sourceDate);
 assert.equal(p.squadSourceUrl,x.sourceUrl);
}
assert.ok(page.includes('Verified identity corrections'));
assert.ok(page.includes('Official club roster or lineup verified'));
assert.ok(csv.includes('Official club squad evidence URL'));
console.log('Leicester official club audit: 16/16 shirt and squad evidence sources; Tommy Watson #23 corrected.');

// Batch Q: independent Sky Sports match sheets must remain distinct from official club-issued sources.
const barnBatch=JSON.parse(fs.readFileSync('data/barnsley-lineup-verification-batch-q-2026-10-20.json','utf8'));
assert.equal(barnBatch.season,'2026/27');
assert.equal(barnBatch.players.length,16);
assert.equal(data.summary.independentMatchLinked,16);
assert.equal(data.clubs.find(c=>c.clubId===barnBatch.clubId).independentMatchLinked,16);
assert.equal(data.summary.officialClubLinked,50,'Independent match sheets cannot inflate first-party club verification');
assert.equal(data.summary.squadLinked,764);
for(const e of barnBatch.players){
 const p=data.players.find(p=>p.clubId==='barnsley'&&p.player===e.player);
 assert.ok(p,'Missing Barnsley player '+e.player);
 assert.equal(p.shirt,e.shirt);
 assert.equal(p.matchLineupSourceUrl,e.sourceUrl);
 assert.equal(p.matchLineupShirtNumber,e.shirt);
 assert.equal(p.matchLineupSourceDate,e.matchDate);
 assert.equal(p.matchLineupRole,e.lineupRole);
 assert.equal(p.squadSourceUrl,e.sourceUrl);
 assert.equal(p.officialClubSourceUrl,null);
}
assert.ok(page.includes('2026/27 independent match sheet verified'));
assert.ok(csv.includes('Independent match evidence URL'));
console.log('Barnsley match-sheet audit: 16 dated squad sources, no change to valuation totals.');

// Batch R: source-classification, 2026/27 matched names/numbers, and price integrity.
const batchR=JSON.parse(fs.readFileSync('data/bromley-wigan-squad-evidence-batch-r-2026-10-20.json','utf8'));
assert.equal(batchR.season,'2026/27');
assert.equal(batchR.clubs.length,2);
assert.equal(batchR.clubs.reduce((n,c)=>n+c.players.length,0),32);
assert.equal(data.summary.independentSeasonRosterLinked,75);
assert.equal(data.clubs.find(c=>c.clubId==='bromley').officialClubLinked,16);
assert.equal(data.clubs.find(c=>c.clubId==='wigan-athletic').independentSeasonRosterLinked,16);
assert.equal(data.clubs.find(c=>c.clubId==='wigan-athletic').officialClubLinked,2);
assert.equal(data.summary.officialClubLinked,50);
for(const c of batchR.clubs){
 const actual=data.players.filter(p=>p.clubId===c.clubId);
 assert.equal(actual.length,16);
 for(const v of c.players){
  const p=actual.find(p=>p.player===v.player);
  assert.ok(p,'Batch R missing player '+v.player);
  assert.equal(p.shirt,v.shirt);
  assert.equal(p.squadSourceUrl,v.officialShirtSourceUrl||c.sourceUrl);
  if(c.clubId==='bromley'){
   assert.equal(p.officialClubSourceUrl,c.sourceUrl);
   assert.equal(p.officialClubShirtNumber,v.shirt);
   assert.equal(p.independentSeasonRosterUrl,null);
  }else{
   assert.equal(p.independentSeasonRosterUrl,c.sourceUrl);
   assert.equal(p.independentSeasonRosterNumber,v.shirt);
   assert.equal(p.independentSeasonRosterClassification,c.classification);
   assert.equal(p.officialClubSourceUrl,v.officialShirtSourceUrl||null);
  }
 }
}
assert.ok(page.includes('Independent 2026/27 season roster linked'));
assert.ok(csv.includes('Independent season roster URL'));
assert.equal(data.summary.ready,1234);
assert.equal(data.summary.priced,1234);
console.log('Batch R: 16 first-party Bromley shirt references, 16 independent Wigan season records, 2 official merch cross-checks.');

// Batch S: 75 named current-season squad matches across five League Two clubs; five Exeter source gaps stay unresolved.
const batchS=JSON.parse(fs.readFileSync('data/league-two-squad-verification-batch-s-2026-10-20.json','utf8'));
assert.equal(batchS.season,'2026/27');
assert.equal(batchS.clubs.length,5);
assert.equal(batchS.summary.sourceMatched,75);
assert.equal(batchS.summary.officialClubMatched,16);
assert.equal(batchS.summary.independentSourceMatched,59);
assert.equal(data.membershipReviewFlags.length,5);
assert.equal(data.summary.membershipReviewCount,5);
assert.equal(data.summary.officialClubLinked,50);
assert.equal(data.summary.independentSeasonRosterLinked,75);
assert.equal(data.summary.squadLinked,764);
assert.equal(data.summary.urgent,5);
for(const c of batchS.clubs){
 const local=data.players.filter(p=>p.clubId===c.clubId);
 assert.equal(local.length,16);
 for(const v of c.players){
  const p=local.find(p=>p.player===v.player);
  assert.ok(p,'Missing season squad player '+c.clubId+' '+v.player);
  assert.equal(p.shirt,v.shirt);
  assert.equal(p.squadSourceUrl,c.sourceUrl);
  if(c.classification==='official_current_club_first_team_page'){
   assert.equal(p.officialClubSourceUrl,c.sourceUrl);
   assert.equal(p.officialClubShirtNumber,v.shirt);
  }else{
   assert.equal(p.independentSeasonRosterUrl,c.sourceUrl);
   assert.equal(p.independentSeasonRosterNumber,v.shirt);
  }
 }
 for(const f of c.flags){
  const p=local.find(p=>p.player===f.player);
  assert.ok(p,'Missing flagged record '+f.player);
  assert.equal(p.membershipReviewStatus,f.reviewStatus);
  assert.equal(p.squadSourceUrl,null);
  assert.equal(p.researchPriority,'URGENT');
 }
}
assert.ok(page.includes('Unconfirmed 2026/27 squad membership'));
assert.ok(page.includes('Current squad membership needs review'));
assert.ok(csv.includes('Independent season roster URL'));
console.log('Batch S: 75 sourced League Two player records and 5 unresolved Exeter membership checks, no invented valuations.');
