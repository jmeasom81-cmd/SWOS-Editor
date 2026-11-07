import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const page=fs.readFileSync('dist/club-dossier.html','utf8');
const audit=JSON.parse(fs.readFileSync('dist/data/source-audit-2026-27.json','utf8'));
assert.equal(audit.season,'2026/27');
assert.equal(audit.clubs.length,92);
assert.equal(audit.players.length,1472);
assert.equal(new Set(audit.clubs.map(c=>c.clubId)).size,92,'Duplicate club ID');
for(const c of audit.clubs){
 const ps=audit.players.filter(p=>p.clubId===c.clubId);
 assert.equal(ps.length,16,'16 player records expected for '+c.club);
 assert.equal(ps.filter(p=>p.squadSourceUrl).length,c.squadLinked);
 assert.equal(ps.filter(p=>p.essentialReady).length,c.ready);
 assert.equal(ps.filter(p=>p.marketValueM===null).length,16-c.priced);
}
assert.ok(page.includes("fetch('/data/source-audit-2026-27.json'"),'Live source audit must feed dossier');
assert.ok(page.includes('read-only research')||page.includes('Read-only research'));
for(const s of ['onlyOpen','previous','next','csv','print','club','division','sourceLinks','exportCell','membershipReviewCount','researchPriority','Print / save PDF'])
 assert.ok(page.includes(s),'Missing dossier feature '+s);
const match=page.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,'Inline app script missing');
assert.doesNotThrow(()=>new vm.Script(match[1]),'Dossier browser JS must parse');
const app=fs.readFileSync('dist/index.html','utf8');
const dashboard=fs.readFileSync('dist/development-status.html','utf8');
const research=fs.readFileSync('dist/research-queue.html','utf8');
for(const p of [app,dashboard,research])assert.ok(p.includes('href="/club-dossier.html"'),'Dossier navigation missing');
assert.ok(app.includes('SWOS Studio v1.37.0')&&app.includes('id="exportSwosTestZip"'),'SWOS editor/game test functionality damaged');
assert.ok(!app.includes('id="installSeasonUpdate"'),'Direct installation must stay locked');
assert.ok(!fs.existsSync('dist/data/login-identities.json'),'Do not produce tracking identities from anonymous visits');
console.log('SWOS club dossier verified: all 92 clubs, 1,472 players, source links, print and CSV controls, safe navigation and locked game installer.');
