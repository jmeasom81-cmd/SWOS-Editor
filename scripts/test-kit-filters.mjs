import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('dist/kit-guide-2026-27.html','utf8');
const kits=JSON.parse(fs.readFileSync('data/kit-research-2026-27.json','utf8'));
const pending=kits.clubs.filter(c=>!c.fullComponentsSourced).length;
assert.equal((html.match(/data-kit-status="pending"/g)||[]).length,pending);
assert.equal((html.match(/data-kit-status="complete"/g)||[]).length,92-pending);
assert.ok(html.includes('SWOS_Kits_Pending_2026-27.csv'));
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements=Object.fromEntries(['kit-search','kit-division','kit-status','kit-reset','kit-count'].map(id=>[id,{value:'',addEventListener(type,fn){this[type]=fn}}]));
const cards=[{dataset:{kitName:'Bristol City',kitDivision:'Championship',kitStatus:'pending'}},{dataset:{kitName:'Wigan Athletic',kitDivision:'League One',kitStatus:'complete'}}];
const sections=cards.map(c=>({querySelector(){return c.hidden?null:c}}));
const document={getElementById:id=>elements[id],querySelectorAll:q=>q.startsWith('article')?cards:sections};
vm.runInNewContext(script,{document});
assert.equal(elements['kit-count'].textContent,'2 of 92 clubs shown');
elements['kit-search'].value=' WIGAN ';elements['kit-search'].input();assert.equal(cards[0].hidden,true);assert.equal(cards[1].hidden,false);assert.equal(sections[0].hidden,true);
elements['kit-status'].value='pending';elements['kit-status'].change();assert.ok(cards.every(c=>c.hidden));
elements['kit-reset'].click();assert.ok(cards.every(c=>!c.hidden));
elements['kit-division'].value='Championship';elements['kit-division'].change();assert.equal(cards[1].hidden,true);
const csv=fs.readFileSync('dist/downloads/SWOS_Kits_Pending_2026-27.csv','utf8');
assert.equal(csv.trimEnd().split('\r\n').length,pending+1);
console.log('Kit filters: status, case-insensitive search, division, reset, empty section and pending CSV verified.');

for(const k of kits.clubs.filter(c=>c.componentResearchLead)){assert.ok(html.includes('href="'+k.componentResearchLead+'"'));assert.ok(csv.includes(k.componentResearchLead));}
assert.ok(csv.includes('Unverified product lead'));
