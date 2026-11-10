import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const audit=JSON.parse(fs.readFileSync('dist/data/source-audit-2026-27.json','utf8'));
assert.equal(audit.summary.players,1472);
assert.equal(audit.clubs.length,92);
const page=fs.readFileSync('game-qa.html','utf8');
const code=fs.readFileSync('scripts/game-qa-core.js','utf8');
if(!page.includes('<script src="/game-qa-core.js"></script>'))throw Error('QA core not loaded');
const scripts=[...page.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if(scripts.length!==1)throw Error('QA must contain exactly one inline controller');
new vm.Script(code);
new vm.Script(scripts[0][1]);
fs.copyFileSync('game-qa.html','dist/game-qa.html');
fs.copyFileSync('scripts/game-qa-core.js','dist/game-qa-core.js');
function insert(filename,anchor,link){
 let data=fs.readFileSync(filename,'utf8');
 if(data.split(anchor).length!==2||data.includes(link))throw Error('Game QA nav unexpected '+filename);
 data=data.replace(anchor,anchor+link);
 fs.writeFileSync(filename,data);
}
insert('dist/index.html',
 '<a class="btn btn-blue big section-gap" href="/club-dossier.html">2026/27 Club Research Dossiers</a>',
 '<a class="btn btn-blue big section-gap" href="/game-qa.html">Magic DOSBox Test Workspace</a>');
insert('dist/development-status.html',
 '<a href="/club-dossier.html">Club dossiers</a>',
 '<a href="/game-qa.html">Real-game testing</a>');
console.log('SWOS Magic DOSBox QA workspace built; file inspection is local and direct installation stays locked.');
