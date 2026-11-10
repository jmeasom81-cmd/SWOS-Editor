import assert from 'node:assert/strict';
import fs from 'node:fs';
const kits=JSON.parse(fs.readFileSync('data/kit-research-2026-27.json','utf8'));
const pack=JSON.parse(fs.readFileSync('data/kit-component-evidence-2026-11-10.json','utf8'));
assert.equal(kits.clubs.length,92);
assert.equal(new Set(kits.clubs.map(c=>c.clubId)).size,92);
assert.equal(kits.clubs.filter(c=>c.fullComponentsSourced).length,39);
assert.equal(pack.entries.length,3);
for(const e of pack.entries){
 const k=kits.clubs.find(c=>c.clubId===e.clubId);
 assert.ok(k&&k.fullComponentsSourced);
 assert.equal(k.home.shorts,e.homeShorts);
 assert.equal(k.home.socks,e.homeSocks);
 assert.equal(k.checkedAt,'2026-11-10');
 assert.deepEqual(k.componentSources,e.componentSources);
 for(const u of Object.values(e.componentSources))assert.match(u,/^https:\/\//);
}
for(const k of kits.clubs){
 if(k.fullComponentsSourced)assert.ok(Number.isInteger(k.home.shorts)&&Number.isInteger(k.home.socks),'Incomplete '+k.clubId);
}
const page=fs.readFileSync('dist/kit-guide-2026-27.html','utf8');
const csv=fs.readFileSync('dist/downloads/SWOS_Kits_2026-27.csv','utf8');
assert.ok(page.includes('39</strong><span>Full home component refs'));
assert.ok(page.includes('53</strong><span>Full kits needing sources'));
assert.ok(page.includes('Shorts evidence')&&page.includes('Socks evidence'));
assert.ok(csv.includes('Shorts evidence URL')&&csv.includes('Socks evidence URL'));
const app=fs.readFileSync('dist/index.html','utf8');
// This test runs immediately after the kit-guide builder; final installer-lock
// assertions are enforced by the later gameplay/test-pack and QA tests.
assert.ok(app.includes('href="/kit-guide-2026-27.html"'),'Kit-guide navigation must exist');
console.log('Verified full-kit sources: Arsenal, Fulham, Manchester City; 39 complete / 53 outstanding.');