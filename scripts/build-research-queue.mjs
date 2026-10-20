import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// This builder only publishes a read-only view and never edits the source master.
const ROOT='dist';
const pagePath='research-queue.html';
const integrationPath='data/york-crawley-exeter-integration-t-2026-10-20.json';
const liveMaster=JSON.parse(fs.readFileSync(path.join(ROOT,'data/master-2026-27.json'),'utf8'));
const integration=JSON.parse(fs.readFileSync(integrationPath,'utf8'));
const page=fs.readFileSync(pagePath,'utf8');
if(liveMaster.season!=='2026/27'||liveMaster.clubs.length!==92||liveMaster.clubs.reduce((n,c)=>n+(c.players||[]).length,0)!==1472)
 throw Error('Research queue: unexpected season, club count or squad shape.');
if(integration.season!==liveMaster.season||integration.clubs.length!==3)
 throw Error('Research queue: missing 2026/27 membership evidence.');
const flags=integration.clubs.flatMap(c=>(c.flags||[]).map(f=>({...f,clubId:c.clubId})));
const sourceMatched=integration.clubs.reduce((n,c)=>n+c.players.length,0);
if(sourceMatched!==43||flags.length!==5)
 throw Error('Research queue: York/Crawley/Exeter review tally changed; re-check prior findings.');
for(const f of flags){
 const club=liveMaster.clubs.find(c=>c.clubId===f.clubId);
 if(!club||!club.players.some(p=>p.player===f.player&&p.shirt===f.shirt))
  throw Error('Research queue: pending membership record changed: '+f.player);
}
const scripts=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
if(scripts.length!==1)throw Error('Research queue: expected one inline application script');
new vm.Script(scripts[0][1],{filename:pagePath});
if(!page.includes('master-2026-27.json')||!page.includes(integrationPath.split('/').pop())||!page.includes('Export CSV'))
 throw Error('Research queue: missing live master, review data or CSV export.');
fs.mkdirSync(path.join(ROOT,'data'),{recursive:true});
fs.copyFileSync(pagePath,path.join(ROOT,pagePath));
fs.copyFileSync(integrationPath,path.join(ROOT,integrationPath));
// Link the new view from the built editor and the existing research pages.
const navLink='<a class="btn btn-blue big section-gap" href="/source-audit-2026-27.html">2026/27 Squad & Source Audit</a>';
const workLink='<a class="btn btn-blue big section-gap" href="/research-queue.html">2026/27 Research Worklist</a>';
const editorPath=path.join(ROOT,'index.html');
let editor=fs.readFileSync(editorPath,'utf8');
if(!editor.includes(navLink))throw Error('Research queue: expected source-audit navigation was not found.');
if(!editor.includes(workLink)){
 editor=editor.replace(navLink,navLink+workLink);
 fs.writeFileSync(editorPath,editor);
}
const gapPath=path.join(ROOT,'gaps-2026-27.html');
let gaps=fs.readFileSync(gapPath,'utf8');
const gapAnchor='<a href="/source-audit-2026-27.html">Squad & source audit ↗</a>';
const gapLink='<a href="/research-queue.html">Research worklist ↗</a>';
if(!gaps.includes(gapAnchor))throw Error('Research queue: expected gap-page navigation was not found.');
if(!gaps.includes(gapLink)){
 gaps=gaps.replace(gapAnchor,gapAnchor+gapLink);
 fs.writeFileSync(gapPath,gaps);
}
console.log('SWOS research queue: published '+liveMaster.clubs.length+' clubs, '+flags.length+' protected Exeter membership reviews; original master and game files unchanged.');
