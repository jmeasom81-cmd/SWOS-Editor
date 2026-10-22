import fs from 'node:fs';
import path from 'node:path';

// Add Vercel's official, cookie-free Web Analytics snippet only to generated
// HTML in dist/. Never touch index.html or the versioned research/game files.
// The Vercel project owner must enable Analytics in the project dashboard.
const output='dist';
const expected=['index.html','research-queue.html','source-audit-2026-27.html','development-status.html'];
for(const file of expected)if(!fs.existsSync(path.join(output,file)))throw Error('Analytics: expected page missing '+file);
const snippet='<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script>\n<script defer src="/_vercel/insights/script.js"></script>';
const signature='/_vercel/insights/script.js';
const list=[];
function traverse(directory){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory())traverse(file);
  else if(entry.isFile()&&entry.name.toLowerCase().endsWith('.html'))list.push(file);
 }
}
traverse(output);
if(list.length<expected.length)throw Error('Analytics: not all pages discovered');
let inserted=0;
for(const file of list){
 const original=fs.readFileSync(file,'utf8');
 const found=original.split(signature).length-1;
 if(found>1)throw Error('Analytics: duplicate snippets already present in '+file);
 if(found===1){
  if(!original.includes('window.va=window.va||function()'))throw Error('Analytics: existing snippet incomplete in '+file);
  continue;
 }
 const headEnd=/<\/head\s*>/i.exec(original);
 if(!headEnd||!/<head(?:\s[^>]*)?>/i.test(original.slice(0,headEnd.index)))throw Error('Analytics: no HTML head in '+file);
 const updated=original.slice(0,headEnd.index)+snippet+'\n'+original.slice(headEnd.index);
 fs.writeFileSync(file,updated);
 inserted++;
}
console.log('SWOS Web Analytics: '+list.length+' HTML pages checked, '+inserted+' scripts inserted into generated pages. Account-level Analytics must be enabled in Vercel and a new deployment made afterwards.');
