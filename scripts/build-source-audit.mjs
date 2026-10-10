import fs from 'node:fs';
const master=JSON.parse(fs.readFileSync('dist/data/master-2026-27.json','utf8'));
const kits=JSON.parse(fs.readFileSync('data/kit-research-2026-27.json','utf8'));
if(master.season!=='2026/27'||master.clubs.length!==92||master.playerCount!==1472||kits.clubs.length!==92)throw new Error('Source audit: unexpected season or master shape');
const kitById=new Map(kits.clubs.map(k=>[k.clubId,k]));
const playerRows=[];
const nameOwners=new Map();
const essential=p=>['shirt','nationality','position','marketValueM'].every(k=>p[k]!==null&&p[k]!==undefined&&p[k]!=='');
const normalizeName=n=>String(n).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
for(const c of master.clubs){
 for(const p of c.players){
  const key=normalizeName(p.player);
  const owners=nameOwners.get(key)||new Set();
  owners.add(c.clubId);
  nameOwners.set(key,owners);
  playerRows.push({
   clubId:c.clubId,club:c.club,division:c.division,player:p.player,
   shirt:p.shirt,nationality:p.nationality,position:p.position,marketValueM:p.marketValueM,
   essentialReady:essential(p),
   squadSourceUrl:p.seasonSquadSourceUrl||null,
   shirtSourceUrl:p.shirtEvidenceUrl||null,
   valueSourceUrl:p.marketValueSourceUrl||null,
   nationalitySourceUrl:p.nationalityEvidenceUrl||null
  });
 }
}
for(const p of playerRows){
 p.sameNameOtherClubs=[...(nameOwners.get(normalizeName(p.player))||[])].filter(id=>id!==p.clubId).map(id=>master.clubs.find(c=>c.clubId===id)?.club||id);
}
const sum=rows=>({
 players:rows.length,
 ready:rows.filter(p=>p.essentialReady).length,
 squadLinked:rows.filter(p=>p.squadSourceUrl).length,
 squadUnlinked:rows.filter(p=>!p.squadSourceUrl).length,
 priced:rows.filter(p=>p.marketValueM!==null).length,
 valueLinked:rows.filter(p=>p.marketValueM!==null&&p.valueSourceUrl).length,
 valuedWithoutIndividualSource:rows.filter(p=>p.marketValueM!==null&&!p.valueSourceUrl).length,
 shirtLinked:rows.filter(p=>p.shirtSourceUrl).length,
 nationalityLinked:rows.filter(p=>p.nationalitySourceUrl).length,
 nameCollisionRows:rows.filter(p=>p.sameNameOtherClubs.length).length
});
const summary=sum(playerRows);
const clubs=master.clubs.map(c=>{
 const players=playerRows.filter(p=>p.clubId===c.clubId),kit=kitById.get(c.clubId);
 if(players.length!==16||!kit)throw new Error('Source audit: missing club or kit '+c.clubId);
 return {clubId:c.clubId,club:c.club,division:c.division,...sum(players),homeShirtSourceUrl:kit.sourceUrl,fullHomeKit:!!kit.fullComponentsSourced};
});
const divisions=['Premier League','Championship','League One','League Two'].map(division=>({division,...sum(playerRows.filter(p=>p.division===division))}));
if(summary.players!==1472||clubs.length!==92||summary.ready!==master.clubs.flatMap(c=>c.players).filter(essential).length)throw new Error('Source audit: source-of-truth count mismatch');
const data={season:master.season,generatedAt:master.generatedAt,summary,divisions,clubs,players:playerRows};
fs.mkdirSync('dist/data',{recursive:true});
fs.mkdirSync('dist/downloads',{recursive:true});
fs.writeFileSync('dist/data/source-audit-2026-27.json',JSON.stringify(data,null,2)+'\n');
const csv=v=>{
 let s=String(v??'');
 if(/^[=+\-@\t\r]/.test(s))s="'"+s;
 return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
};
const headers=['Division','Club','Player','Shirt','Nationality','Position code','Value GBP millions','Essentials filled','Individual 2026-27 squad link','Individual market value link','Shirt evidence link','Nationality evidence link','Possible same-name clubs','Squad source URL','Value source URL','Shirt source URL','Nationality source URL'];
const rows=[headers,...playerRows.map(p=>[p.division,p.club,p.player,p.shirt,p.nationality,p.position,p.marketValueM,p.essentialReady?'YES':'NO',p.squadSourceUrl?'LINKED':'NOT LINKED',p.valueSourceUrl?'LINKED':'NOT LINKED',p.shirtSourceUrl?'LINKED':'NOT LINKED',p.nationalitySourceUrl?'LINKED':'NOT LINKED',p.sameNameOtherClubs.join('; '),p.squadSourceUrl,p.valueSourceUrl,p.shirtSourceUrl,p.nationalitySourceUrl])];
fs.writeFileSync('dist/downloads/SWOS_Source_Audit_2026-27.csv','\uFEFF'+rows.map(r=>r.map(csv).join(',')).join('\r\n')+'\r\n');
const template=fs.readFileSync('source-audit-template.html','utf8');
const placeholder='__SWOS_SOURCE_AUDIT_DATA__';
if(template.split(placeholder).length!==2)throw new Error('Source audit: template data placeholder not unique');
const safeJson=JSON.stringify(data).replace(/</g,'\\u003c');
fs.writeFileSync('dist/source-audit-2026-27.html',template.replace(placeholder,safeJson));
let app=fs.readFileSync('dist/index.html','utf8');
const homeAnchor='<a class="btn btn-blue big section-gap" href="/gaps-2026-27.html">2026/27 Data Gaps · live research queue</a>';
if(!app.includes(homeAnchor))throw new Error('Source audit: data gaps home link changed');
app=app.replace(homeAnchor,homeAnchor+'<a class="btn btn-blue big section-gap" href="/source-audit-2026-27.html">2026/27 Squad & Source Audit</a>');
fs.writeFileSync('dist/index.html',app);
let gaps=fs.readFileSync('dist/gaps-2026-27.html','utf8');
const gapAnchor='<a href="/kit-guide-2026-27.html">Kit reference ↗</a>';
if(!gaps.includes(gapAnchor))throw new Error('Source audit: gap page nav changed');
gaps=gaps.replace(gapAnchor,gapAnchor+'<a href="/source-audit-2026-27.html">Squad & source audit ↗</a>');
fs.writeFileSync('dist/gaps-2026-27.html',gaps);
console.log('SWOS source audit: '+summary.ready+' essentials-filled, '+summary.squadLinked+' squad-source links, '+summary.valuedWithoutIndividualSource+' values lacking an individual evidence URL.');
