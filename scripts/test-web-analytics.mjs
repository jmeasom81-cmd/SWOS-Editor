import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const all=[];
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else if(e.isFile()&&p.endsWith('.html'))all.push(p);}}
scan('dist');
assert.ok(all.length>=4,'Expected at least 4 published site pages');
for(const file of all){
 const html=fs.readFileSync(file,'utf8');
 const headEnd=html.search(/<\/head\s*>/i);
 assert.ok(headEnd>0,'Missing head in '+file);
 const head=html.slice(0,headEnd);
 const realTags=head.match(/<script\b[^>]*\bsrc\s*=\s*["']\/_vercel\/insights\/script\.js["'][^>]*>\s*<\/script>/gi)||[];
 assert.equal(realTags.length,1,'Expected one real analytics script in document head: '+file);
 assert.ok(head.includes('window.va=window.va||function()'),'Missing analytics bootstrap in head: '+file);
}
const app=fs.readFileSync('dist/index.html','utf8');
assert.ok(app.includes('SWOS Studio v1.37.0'),'Do not remove game test suite');
assert.ok(app.includes('id="exportSwosTestZip"'),'Test package removed');
assert.ok(!app.includes('id="installSeasonUpdate"'),'Unsafe direct game installation enabled');
const analyticsBuilder=fs.readFileSync('scripts/build-web-analytics.mjs','utf8');
assert.ok(analyticsBuilder.includes("const output='dist'"),'Analytics must operate only on generated site files');
assert.ok(!analyticsBuilder.includes("writeFileSync('index.html'"),'Analytics may not overwrite the source editor');
console.log('SWOS Web Analytics: tracking code appears exactly once on all '+all.length+' generated HTML pages; originals preserved and live game installer remains locked.');
