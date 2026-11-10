import assert from 'node:assert/strict';
import fs from 'node:fs';
const research=JSON.parse(fs.readFileSync('data/kit-research-2026-27.json','utf8'));
const batch=JSON.parse(fs.readFileSync('data/kit-component-evidence-2026-11-10-batch-c.json','utf8'));
const complete=research.clubs.filter(c=>c.fullComponentsSourced).length;
assert.equal(research.season,'2026/27');
assert.equal(research.clubs.length,92);
assert.equal(new Set(research.clubs.map(c=>c.clubId)).size,92);
assert.equal(batch.previousComplete,39);
assert.equal(batch.newComplete,47);
assert.equal(batch.newlyComplete,8);
assert.equal(batch.entries.length,8);
assert.equal(new Set(batch.entries.map(e=>e.clubId)).size,8);
assert.ok(complete>=batch.newComplete);
for(const item of batch.entries){
 const club=research.clubs.find(c=>c.clubId===item.clubId);
 assert.ok(club&&club.fullComponentsSourced,'Missing researched club '+item.clubId);
 assert.equal(club.home.shorts,item.homeShorts,'Shorts mismatch '+item.clubId);
 assert.equal(club.home.socks,item.homeSocks,'Socks mismatch '+item.clubId);
 assert.equal(club.checkedAt,batch.checkedAt);
 assert.deepEqual(club.componentSources,item.componentSources);
 assert.ok(item.note.length>70&&item.sourceClassification.length>20);
 for(const uri of Object.values(item.componentSources))assert.match(uri,/^https:\/\/[^/\s]+\//);
 if(item.secondarySourceUrl)assert.match(item.secondarySourceUrl,/^https:\/\//);
}
for(const c of research.clubs)assert.equal(c.fullComponentsSourced,c.home.shorts!==null&&c.home.socks!==null,'Inconsistent full-kit status for '+c.clubId);
const guide=fs.readFileSync('dist/kit-guide-2026-27.html','utf8');
assert.ok(guide.includes(complete+'</strong><span>Full home component refs'));
assert.ok(guide.includes((92-complete)+'</strong><span>Full kits needing sources'));
for(const e of batch.entries){
 assert.ok(guide.includes('id="'+e.clubId+'"'),'Missing guide card '+e.clubId);
 assert.ok(guide.includes('href="'+e.componentSources.shorts+'"'),'Shorts evidence link missing '+e.clubId);
 assert.ok(guide.includes('href="'+e.componentSources.socks+'"'),'Socks evidence link missing '+e.clubId);
}
const csv=fs.readFileSync('dist/downloads/SWOS_Kits_2026-27.csv','utf8');
assert.ok(csv.includes('Shorts evidence URL')&&csv.includes('Socks evidence URL'));
console.log('SWOS kit evidence C: 8 2026/27 home kits source-checked; '+complete+' complete / '+(92-complete)+' pending.');
