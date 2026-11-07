import assert from 'node:assert/strict';
import fs from 'node:fs';
const audit=JSON.parse(fs.readFileSync('dist/data/source-audit-2026-27.json','utf8'));
assert.equal(audit.season,'2026/27');
assert.equal(audit.clubs.length,92);
assert.equal(audit.players.length,1472);
for(const c of audit.clubs)assert.equal(audit.players.filter(p=>p.clubId===c.clubId).length,16,'Incorrect squad size '+c.clubId);
const source=fs.readFileSync('club-dossier.html','utf8');
if(!source.includes("fetch('/data/source-audit-2026-27.json'")||!source.includes('Print / save PDF')||!source.includes('Export club CSV'))throw Error('Dossier template missing features');
fs.writeFileSync('dist/club-dossier.html',source);
function appendAfter(filename,anchor,link){
 let html=fs.readFileSync(filename,'utf8');
 if(!html.includes(anchor)||html.includes(link))throw Error('Dossier: expected clean navigation at '+filename);
 html=html.replace(anchor,anchor+link);
 fs.writeFileSync(filename,html);
}
appendAfter('dist/index.html',
 '<a class="btn btn-blue big section-gap" href="/development-status.html">SWOS Development Progress</a>',
 '<a class="btn btn-blue big section-gap" href="/club-dossier.html">2026/27 Club Research Dossiers</a>');
appendAfter('dist/development-status.html',
 '<a href="/research-queue.html">Research worklist</a>',
 '<a href="/club-dossier.html">Club dossiers</a>');
appendAfter('dist/research-queue.html',
 '<a class="back" href="./">← Back to editor</a>',
 '<a class="back" href="/club-dossier.html">Club dossiers</a>');
console.log('SWOS club dossier: 92 clubs with exactly 16 audited player records each; original game files unchanged.');
