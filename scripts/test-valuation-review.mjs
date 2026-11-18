import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const data=JSON.parse(fs.readFileSync('dist/data/valuation-leads-2026-27.json','utf8'));
const audit=JSON.parse(fs.readFileSync('dist/data/source-audit-2026-27.json','utf8'));
const html=fs.readFileSync('dist/valuation-review.html','utf8');
assert.equal(data.rows.length,20);
assert.equal(data.openLeads,20);
assert.equal(data.conflicts,3);
assert.equal(data.missing,audit.players.filter(p=>p.marketValueM===null).length);
for(const r of data.rows){const p=audit.players.find(p=>p.clubId===r.clubId&&p.player===r.player);assert.equal(p.marketValueM,null);assert.ok(r.eurThousands>0&&r.sourceUrl.startsWith('https://'));assert.ok(html.includes(r.sourceUrl));}
assert.equal(data.unresolved.length,2);
assert.ok(html.includes('nothing applied to the master or game'));
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
assert.equal((html.match(/<tr data-player=/g)||[]).length,20);
assert.equal(fs.readFileSync('dist/downloads/SWOS_Valuation_Leads_2026-27.csv','utf8').trimEnd().split('\r\n').length,21);
assert.ok(fs.readFileSync('dist/index.html','utf8').includes('href="/valuation-review.html"'));
console.log('Valuation review: published estimates separated from verified master, 20 leads / 3 conflicts / 2 unresolved, CSV and UI validated.');
