import fs from 'node:fs';
import vm from 'node:vm';
const page='dist/kit-guide-2026-27.html';
let html=fs.readFileSync(page,'utf8');
const kits=JSON.parse(fs.readFileSync('data/kit-research-2026-27.json','utf8'));
const master=JSON.parse(fs.readFileSync('dist/data/master-2026-27.json','utf8'));
const lookup=new Map(kits.clubs.map(k=>[k.clubId,k]));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let marked=0;
html=html.replace(/<article class="card" id="([^"]+)">/g,(full,id)=>{
 const c=master.clubs.find(x=>x.clubId===id),k=lookup.get(id);if(!c||!k)throw Error('Unknown kit '+id);
 marked++;
 return '<article class="card" id="'+id+'" data-kit-name="'+esc(c.club)+'" data-kit-division="'+esc(c.division)+'" data-kit-status="'+(k.fullComponentsSourced?'complete':'pending')+'">';
});
if(marked!==92)throw Error('Kit filters require 92 cards');
const controls='<div class="kit-filters"><label>Search club<input id="kit-search" type="search" placeholder="Club name"></label><label>Division<select id="kit-division"><option value="">All divisions</option>'+['Premier League','Championship','League One','League Two'].map(d=>'<option>'+d+'</option>').join('')+'</select></label><label>Research status<select id="kit-status"><option value="">All kits</option><option value="pending">Needs evidence</option><option value="complete">Complete references</option></select></label><button id="kit-reset" type="button">Reset</button><a href="/downloads/SWOS_Kits_Pending_2026-27.csv">Download pending kit worklist</a><p id="kit-count" aria-live="polite">92 of 92 clubs shown</p></div>';
if(!html.includes('<section class="division"'))throw Error('No kit division section');
html=html.replace('<section class="division"',controls+'<section class="division"');
html=html.replace('</style>','[hidden]{display:none!important}.kit-filters{margin:18px 0;display:flex;align-items:end;gap:12px;flex-wrap:wrap;padding:14px;background:#142840;border:1px solid #415b77;border-radius:12px}.kit-filters label{display:grid;gap:5px;font-size:13px;flex:1;min-width:145px}.kit-filters input,.kit-filters select,.kit-filters button{font:inherit;color:inherit;background:#0b1626;border:1px solid #65809b;border-radius:8px;padding:9px;min-height:42px}.kit-filters a{color:#a3ecc7;font-size:13px;padding:10px}.kit-filters p{flex-basis:100%;margin:0;font-size:13px}</style>');
const script="function matchesKit(record, query, division, status) {\n  return (!query || record.name.toLowerCase().includes(query.trim().toLowerCase())) &&\n         (!division || record.division === division) &&\n         (!status || record.status === status);\n}\nfunction updateKitFilters(){\n  const query=document.getElementById('kit-search').value;\n  const division=document.getElementById('kit-division').value;\n  const status=document.getElementById('kit-status').value;\n  let count=0;\n  document.querySelectorAll('article[data-kit-status]').forEach(card=>{\n    const match=matchesKit({name:card.dataset.kitName,division:card.dataset.kitDivision,status:card.dataset.kitStatus},query,division,status);\n    card.hidden=!match;\n    if(match)count++;\n  });\n  document.querySelectorAll('section.division').forEach(section=>{\n    section.hidden=!section.querySelector('article[data-kit-status]:not([hidden])');\n  });\n  document.getElementById('kit-count').textContent=count+' of 92 clubs shown';\n}\n['kit-search','kit-division','kit-status'].forEach(id=>document.getElementById(id).addEventListener(id==='kit-search'?'input':'change',updateKitFilters));\ndocument.getElementById('kit-reset').addEventListener('click',()=>{\n ['kit-search','kit-division','kit-status'].forEach(id=>document.getElementById(id).value='');\n updateKitFilters();\n});\nupdateKitFilters();";
new vm.Script(script);
html=html.replace('</body>','<script>'+script+'</script></body>');
fs.writeFileSync(page,html);
const rows=[['Division','Club','Missing shorts','Missing socks','Shirt reference','Research note']];
for(const c of master.clubs){const k=lookup.get(c.clubId);if(!k.fullComponentsSourced)rows.push([c.division,c.club,k.home.shorts===null?'YES':'',k.home.socks===null?'YES':'',k.sourceUrl,k.note]);}
const csv=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
fs.writeFileSync('dist/downloads/SWOS_Kits_Pending_2026-27.csv','\uFEFF'+rows.map(row=>row.map(csv).join(',')).join('\r\n')+'\r\n');
console.log('Kit worklist: searchable 92-club guide, '+(rows.length-1)+' pending rows exported.');
