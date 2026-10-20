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
   officialPLRosterUrl:p.officialPLRosterUrl||null,officialPLSquadNumber:p.officialPLSquadNumber??null,
   officialClubSourceUrl:p.officialClubSourceUrl||null,officialClubShirtNumber:p.officialClubShirtNumber??null,officialClubSourceDate:p.officialClubSourceDate||null,officialClubSourceKind:p.officialClubSourceKind||null,
   matchLineupSourceUrl:p.matchLineupSourceUrl||null,matchLineupSourceDate:p.matchLineupSourceDate||null,matchLineupShirtNumber:p.matchLineupShirtNumber??null,matchLineupRole:p.matchLineupRole||null,

   squadSourceUrl:p.officialPLRosterUrl||p.officialClubSourceUrl||p.matchLineupSourceUrl||p.seasonSquadSourceUrl||null,
   shirtSourceUrl:p.officialPLRosterUrl||p.officialClubSourceUrl||p.matchLineupSourceUrl||p.shirtEvidenceUrl||null,
   valueSourceUrl:p.marketValueSourceUrl||null,
   nationalitySourceUrl:p.nationalityEvidenceUrl||null
  });
 }
}
for(const p of playerRows){
 p.sameNameOtherClubs=[...(nameOwners.get(normalizeName(p.player))||[])].filter(id=>id!==p.clubId).map(id=>master.clubs.find(c=>c.clubId===id)?.club||id);
}
// Keep evidence and completeness distinct. A source is a research lead, not proof of squad membership.
const reviewPack=JSON.parse(fs.readFileSync('data/gap-research-review-2026-10-10.json','utf8'));
if(reviewPack.season!==master.season)throw new Error('Priority queue: research season mismatch');
const reviews=new Map();
for(const r of reviewPack.reviews){
 const key=r.clubId+'|'+r.player;
 if(reviews.has(key))throw new Error('Priority queue: duplicate review '+key);
 reviews.set(key,r);
}
const priorityOrder={URGENT:0,HIGH:1,MEDIUM:2,LOW:3,REVIEWED:4,CLEAR:5};
for(const p of playerRows){
 const review=reviews.get(p.clubId+'|'+p.player);
 const missingCore=['shirt','nationality','position'].filter(key=>p[key]===null||p[key]===undefined||p[key]==='');
 const missingValue=p.marketValueM===null||p.marketValueM===undefined||p.marketValueM==='';
 const unpublished=review?.status==='value_unpublished';
 const membership=review?.status==='membership_check';
 const membershipMatched=review?.status==='membership_source_matched';
 const issues=[];
 if(membership)issues.push('Squad membership needs independent check');
 if(membershipMatched)issues.push('Squad membership source-matched; no official club confirmation recorded');
 for(const f of missingCore)issues.push('Missing '+(f==='shirt'?'shirt number':f));
 if(missingValue)issues.push(unpublished?'Market value unavailable in reviewed source':'Missing numerical market valuation');
 if(!p.squadSourceUrl)issues.push('No individual season squad source linked');
 if(!missingValue&&!p.valueSourceUrl)issues.push('Recorded valuation lacks individual evidence link');
 if(p.sameNameOtherClubs.length)issues.push('Same-name player in other club: '+p.sameNameOtherClubs.join(', '));
 p.reviewStatus=review?.status||null;
 p.reviewCheckedAt=review?.checkedAt||null;
 p.reviewSourceUrl=review?.sourceUrl||null;
 p.researchIssues=issues;
 p.researchPriority=membership||missingCore.length?'URGENT':
   missingValue&&!unpublished?'HIGH':
   !p.squadSourceUrl?'MEDIUM':
   !missingValue&&!p.valueSourceUrl||p.sameNameOtherClubs.length?'LOW':
   missingValue&&unpublished?'REVIEWED':'CLEAR';
 p.nextResearchAction=membership?'Confirm 2026/27 club membership before changing the roster':
   missingCore.length?'Find a current-season source for '+missingCore.join(', '):
   missingValue&&!unpublished?'Find a published numerical valuation; never fill with zero':
   !p.squadSourceUrl?'Find independent 2026/27 squad evidence':
   !missingValue&&!p.valueSourceUrl?'Link evidence for the recorded market value':
   p.sameNameOtherClubs.length?'Resolve identity before assuming a duplicate transfer':
   unpublished?'No numerical value found in reviewed source; revisit only with new evidence':'No priority action identified';
}
for(const key of reviews.keys())if(!playerRows.some(p=>p.clubId+'|'+p.player===key))throw new Error('Priority queue: reviewed player not found '+key);
const sum=rows=>({
 players:rows.length,
 ready:rows.filter(p=>p.essentialReady).length,
 squadLinked:rows.filter(p=>p.squadSourceUrl).length,
 officialPLLinked:rows.filter(p=>p.officialPLRosterUrl).length,
 officialClubLinked:rows.filter(p=>p.officialClubSourceUrl).length,
 independentMatchLinked:rows.filter(p=>p.matchLineupSourceUrl).length,
 squadUnlinked:rows.filter(p=>!p.squadSourceUrl).length,
 priced:rows.filter(p=>p.marketValueM!==null).length,
 valueLinked:rows.filter(p=>p.marketValueM!==null&&p.valueSourceUrl).length,
 valuedWithoutIndividualSource:rows.filter(p=>p.marketValueM!==null&&!p.valueSourceUrl).length,
 shirtLinked:rows.filter(p=>p.shirtSourceUrl).length,
 nationalityLinked:rows.filter(p=>p.nationalitySourceUrl).length,
 urgent:rows.filter(p=>p.researchPriority==='URGENT').length,
 high:rows.filter(p=>p.researchPriority==='HIGH').length,
 medium:rows.filter(p=>p.researchPriority==='MEDIUM').length,
 low:rows.filter(p=>p.researchPriority==='LOW').length,
 reviewed:rows.filter(p=>p.researchPriority==='REVIEWED').length,
 clear:rows.filter(p=>p.researchPriority==='CLEAR').length,
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
const batchO=JSON.parse(fs.readFileSync('data/valuation-verification-batch-o-2026-10-20.json','utf8'));
for(const issue of batchO.discrepancyFlags){
 const source=master.clubs.find(c=>c.clubId===issue.clubId)?.players.find(p=>p.player===issue.player);
 if(!source||source[issue.field]!==issue.stored)throw new Error('Source audit: unresolved shirt difference changed '+issue.player);
}
const officialClubBatch=JSON.parse(fs.readFileSync('data/leicester-official-16-player-audit-2026-10-20.json','utf8'));
if(officialClubBatch.season!==master.season||officialClubBatch.players.length!==16)throw new Error('Official club verification batch invalid');
const data={season:master.season,generatedAt:master.generatedAt,summary,divisions,clubs,valuationReviewFlags:batchO.discrepancyFlags,verifiedNameCorrections:[{club:officialClubBatch.club,...officialClubBatch.nameFix,sourceUrl:officialClubBatch.players.find(p=>p.player===officialClubBatch.nameFix.to)?.sourceUrl}],players:playerRows};
fs.mkdirSync('dist/data',{recursive:true});
fs.mkdirSync('dist/downloads',{recursive:true});
fs.writeFileSync('dist/data/source-audit-2026-27.json',JSON.stringify(data,null,2)+'\n');
const csv=v=>{
 let s=String(v??'');
 if(/^[=+\-@\t\r]/.test(s))s="'"+s;
 return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
};
const headers=['Division','Club','Player','Shirt','Nationality','Position code','Value GBP millions','Essentials filled','Individual 2026-27 squad link','Individual market value link','Shirt evidence link','Nationality evidence link','Official PL squad source','Official PL shirt number','Official club squad evidence URL','Official club shirt number','Official club published date','Official club evidence type','Independent match evidence URL','Match evidence date','Match evidence shirt number','Match role','Possible same-name clubs','Squad source URL','Value source URL','Shirt source URL','Nationality source URL'];
const rows=[headers,...playerRows.map(p=>[p.division,p.club,p.player,p.shirt,p.nationality,p.position,p.marketValueM,p.essentialReady?'YES':'NO',p.squadSourceUrl?'LINKED':'NOT LINKED',p.valueSourceUrl?'LINKED':'NOT LINKED',p.shirtSourceUrl?'LINKED':'NOT LINKED',p.nationalitySourceUrl?'LINKED':'NOT LINKED',p.officialPLRosterUrl||'',p.officialPLSquadNumber??'',p.officialClubSourceUrl||'',p.officialClubShirtNumber??'',p.officialClubSourceDate||'',p.officialClubSourceKind||'',p.matchLineupSourceUrl||'',p.matchLineupSourceDate||'',p.matchLineupShirtNumber??'',p.matchLineupRole||'',p.sameNameOtherClubs.join('; '),p.squadSourceUrl,p.valueSourceUrl,p.shirtSourceUrl,p.nationalitySourceUrl])];
fs.writeFileSync('dist/downloads/SWOS_Source_Audit_2026-27.csv','\uFEFF'+rows.map(r=>r.map(csv).join(',')).join('\r\n')+'\r\n');
const queue=playerRows.filter(p=>p.researchPriority!=='CLEAR').sort((a,b)=>
 priorityOrder[a.researchPriority]-priorityOrder[b.researchPriority]||
 a.division.localeCompare(b.division)||a.club.localeCompare(b.club)||a.player.localeCompare(b.player));
const queueHeaders=['Research priority','Division','Club','Player','Shirt','Nationality','SWOS position','Value GBP millions','Recommended next action','Research issues','Research review status','Review evidence URL','Squad evidence URL','Valuation evidence URL','Official club evidence URL','Match-sheet evidence URL','Same-name clubs'];
const queueRows=[queueHeaders,...queue.map(p=>[p.researchPriority,p.division,p.club,p.player,p.shirt,p.nationality,p.position,p.marketValueM,p.nextResearchAction,p.researchIssues.join(' | '),p.reviewStatus,p.reviewSourceUrl,p.squadSourceUrl,p.valueSourceUrl,p.officialClubSourceUrl,p.matchLineupSourceUrl,p.sameNameOtherClubs.join('; ')])];
fs.writeFileSync('dist/downloads/SWOS_Research_Priority_2026-27.csv','\uFEFF'+queueRows.map(r=>r.map(csv).join(',')).join('\r\n')+'\r\n');
if(queue.length!==summary.players-summary.clear)throw new Error('Priority queue: count disagrees with audit');
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
