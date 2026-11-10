import assert from 'node:assert/strict';
import fs from 'node:fs';
const master=JSON.parse(fs.readFileSync('data/kit-research-2026-27.json','utf8'));
const pack=JSON.parse(fs.readFileSync('data/kit-component-evidence-2026-11-10-batch-b.json','utf8'));
assert.equal(master.season,'2026/27');
assert.equal(master.clubs.length,92);
assert.equal(new Set(master.clubs.map(k=>k.clubId)).size,92);
assert.equal(pack.season,master.season);
assert.equal(pack.previousComplete,31);
assert.equal(pack.totalComplete,39);
assert.equal(pack.newlyComplete,8);
assert.equal(pack.entries.length,8);
assert.equal(new Set(pack.entries.map(e=>e.clubId)).size,8);
for(const item of pack.entries){
 const kit=master.clubs.find(k=>k.clubId===item.clubId);
 assert.ok(kit,'Missing club '+item.clubId);
 assert.equal(kit.fullComponentsSourced,true,item.clubId);
 assert.equal(kit.checkedAt,'2026-11-10');
 assert.equal(kit.home.shorts,item.home.shorts);
 assert.equal(kit.home.socks,item.home.socks);
 assert.ok(Number.isInteger(kit.home.shorts)&&kit.home.shorts>=0&&kit.home.shorts<=9);
 assert.ok(Number.isInteger(kit.home.socks)&&kit.home.socks>=0&&kit.home.socks<=9);
 assert.equal(kit.componentSources.shorts,item.sourceUrls.shorts);
 assert.equal(kit.componentSources.socks,item.sourceUrls.socks);
 for(const [kind,url] of Object.entries(kit.componentSources))assert.match(url,/^https:\/\/[^\/\s]+\//,kind+' for '+item.clubId);
 assert.ok(item.notes.length>50&&item.sourceClassification.length>12,'Provenance requires a meaningful explanation');
}
const complete=master.clubs.filter(k=>k.fullComponentsSourced).length;
assert.ok(complete>=pack.totalComplete,'Later verified batches must not reduce completed kit count');
assert.equal(master.clubs.filter(k=>!k.fullComponentsSourced).length,92-complete);
for(const kit of master.clubs)
 assert.equal(kit.fullComponentsSourced,kit.home.shorts!==null&&kit.home.socks!==null,'Unsubstantiated completeness: '+kit.clubId);
const summary=fs.readFileSync('dist/kit-guide-2026-27.html','utf8');
assert.ok(summary.includes(complete+'</strong><span>Full home component refs'));
assert.ok(summary.includes((92-complete)+'</strong><span>Full kits needing sources'));
for(const item of pack.entries){
 assert.ok(summary.includes('id="'+item.clubId+'"'),'Kit card missing '+item.clubId);
 assert.ok(summary.includes('href="'+item.sourceUrls.shorts+'"'),'Kit source not linked: '+item.clubId);
}
const exportFile=fs.readFileSync('dist/downloads/SWOS_Kits_2026-27.csv','utf8');
assert.ok(exportFile.includes('Shorts evidence URL')&&exportFile.includes('Socks evidence URL'));
// Direct installation and editor integrity are checked later in the full production pipeline.
console.log('SWOS verified kit component batch B: 8 updated clubs, '+complete+' complete, '+(92-complete)+' pending; sources and palette codes validated.');
