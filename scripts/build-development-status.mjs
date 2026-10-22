import fs from 'node:fs';
import vm from 'node:vm';
const audit=JSON.parse(fs.readFileSync('dist/data/source-audit-2026-27.json','utf8'));
const kits=JSON.parse(fs.readFileSync('data/kit-research-2026-27.json','utf8'));
let app=fs.readFileSync('dist/index.html','utf8');
const files=['dist/research-queue.html','dist/source-audit-2026-27.html','dist/downloads/SWOS_Master_2026-27.xlsx','dist/downloads/SWOS_Research_Priority_2026-27.csv'];
for(const file of files)if(!fs.existsSync(file))throw Error('SWOS handover missing '+file);
if(audit.season!=='2026/27'||audit.summary.players!==1472||audit.clubs.length!==92||kits.clubs.length!==92)throw Error('Handover needs 92 clubs and 1,472 players');
if(!app.includes('SWOS Studio v1.37.0')||!app.includes('id="exportSwosTestZip"')||app.includes('id="installSeasonUpdate"'))throw Error('Unsafe SWOS version / installation status');
const kitMap=new Map(kits.clubs.map(c=>[c.clubId,c]));
if(kitMap.size!==92)throw Error('Duplicate kit clubs');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v).toLocaleString('en-GB');
const metric=(n,label,detail)=>'<article class="metric"><strong>'+fmt(n)+'</strong><b>'+esc(label)+'</b><small>'+esc(detail)+'</small></article>';
const sum=audit.summary;
const fullKits=audit.clubs.filter(c=>kitMap.get(c.clubId)?.fullComponentsSourced===true).length;
const missingValue=audit.players.filter(p=>p.marketValueM==null||p.marketValueM==='').length;
const cards=[
 metric(92,'Clubs across four leagues','20 PL / 24 Championship / 24 League One / 24 League Two'),
 metric(sum.ready,'Essential fields filled','Out of 1,472; not the same as source verification'),
 metric(sum.squadLinked,'Individual squad evidence links','A link is not final membership confirmation'),
 metric(fullKits,'Fully sourced home kits','Of 92 clubs'),
 metric(missingValue,'Missing valuations','Unknown values are never automatically zero'),
 metric(sum.valuedWithoutIndividualSource,'Valuations needing evidence','Recorded values without an individual source URL')
].join('');
const workload=c=>c.urgent*8+c.high*4+c.membershipReviewCount*8+c.squadUnlinked+c.valuedWithoutIndividualSource/2+(c.fullHomeKit?0:4);
const rows=audit.clubs.slice().sort((a,b)=>workload(b)-workload(a)||a.club.localeCompare(b.club)).map(c=>{
 if(!kitMap.has(c.clubId))throw Error('Missing kit '+c.clubId);
 return '<tr data-division="'+esc(c.division)+'" data-club="'+esc(c.club.toLowerCase())+'"><td><b>'+esc(c.club)+'</b><small>'+esc(c.division)+'</small></td><td>'+fmt(c.ready)+'/16</td><td>'+fmt(c.squadLinked)+'/16</td><td>'+fmt(16-c.priced)+'</td><td>'+fmt(c.valuedWithoutIndividualSource)+'</td><td>'+(c.fullHomeKit?'Sourced':'Partial')+'</td><td>'+fmt(c.urgent)+' urgent / '+fmt(c.high)+' high</td></tr>';
}).join('\n');
const divisions=audit.divisions.map(d=>'<article class="division"><strong>'+esc(d.division)+'</strong><span>'+fmt(d.ready)+'/'+fmt(d.players)+' fields filled</span><span>'+fmt(d.squadLinked)+' squad links</span><span>'+fmt(d.urgent)+' urgent</span></article>').join('');
let html=fs.readFileSync('development-status-template.html','utf8');
const slots={'__STATS__':cards,'__ROWS__':rows,'__DIVISIONS__':divisions,'__DATA_DATE__':esc(audit.generatedAt),'__BUILD_DATE__':new Date().toISOString().slice(0,10)};
for(const [key,value] of Object.entries(slots)){if(html.split(key).length!==2)throw Error('Bad placeholder '+key);html=html.replace(key,value);}
fs.writeFileSync('dist/development-status.html',html);
const anchor='<a class="btn btn-blue big section-gap" href="/research-queue.html">2026/27 Research Worklist</a>';
if(!app.includes(anchor))throw Error('Research worklist nav changed');
const link='<a class="btn btn-blue big section-gap" href="/development-status.html">SWOS Development Progress</a>';
if(app.includes(link))throw Error('Duplicate development link');
app=app.replace(anchor,anchor+link);
fs.writeFileSync('dist/index.html',app);
console.log('SWOS handover: '+fmt(sum.ready)+' essential records, '+fmt(sum.squadLinked)+' squad links, '+fmt(fullKits)+' sourced kits and '+fmt(missingValue)+' unknown valuations. Installer still locked.');
