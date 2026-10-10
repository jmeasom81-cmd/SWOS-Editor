import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Regression test: missing football evidence must never become numeric zero.
// This intentionally checks the actual functions embedded in the published editor.
const html = fs.readFileSync('index.html', 'utf8');
function functionSource(name) {
  const label = 'function ' + name + '(';
  const i = html.indexOf(label);
  assert.ok(i >= 0, 'Missing editor helper: ' + name);
  const start = html.indexOf('{', i + label.length);
  assert.ok(start >= 0, 'Unclosed helper: ' + name);
  let depth = 0, quote = null, escape = false;
  for (let j = start; j < html.length; j++) {
    const ch = html[j];
    if (quote) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return html.slice(i, j + 1);
  }
  throw new Error('Cannot extract ' + name);
}
const names = ['evidenceNumberPresent', 'ageBandFromAge', 'inferTierFromEvidence', 'blend07', 'evidenceTo07', 'clamp07'];
const source = names.map(functionSource).join('\n') + '\n';
const run = expression => vm.runInNewContext(source + '\n(' + expression + ')', Object.create(null), {timeout: 1500});

assert.equal(run('evidenceNumberPresent(null)'), false);
assert.equal(run('evidenceNumberPresent(undefined)'), false);
assert.equal(run('evidenceNumberPresent("")'), false);
assert.equal(run('evidenceNumberPresent(" ")'), false);
assert.equal(run('evidenceNumberPresent(0)'), true);
assert.equal(run('evidenceNumberPresent(0.25)'), true);
assert.equal(run('evidenceNumberPresent("n/a")'), false);
assert.equal(run('blend07(5, null, 0.8)'), 5, 'Blank skills must preserve the baseline');
assert.equal(run('blend07(5, undefined, 0.8)'), 5);
assert.equal(run('blend07(5, 0, 0.8)'), 1, 'Real zero is a valid skill observation');
assert.equal(run('ageBandFromAge(null)'), 'unknown');
assert.equal(run('ageBandFromAge(0)'), 'unknown');
assert.equal(run('ageBandFromAge(19)'), 'u21');
assert.equal(run('inferTierFromEvidence({marketValueM:null, importance:null})'), 'starter');
assert.equal(run('inferTierFromEvidence({marketValueM:null, importance:80})'), 'strong');
assert.equal(run('inferTierFromEvidence({marketValueM:0, importance:80})'), 'fringe');

const critical = [
  'const filled=keys.filter(k=>evidenceNumberPresent(e?.[k])).length;',
  'const hasMarket=evidenceNumberPresent(e?.marketValueM);',
  'if(!evidenceNumberPresent(raw.marketValueM)){missingValues++;clubResult.valueMissing++}',
  'if(evidenceNumberPresent(raw.marketValueM)){after[o+P.value]=nearestValueIndexFromMillions(raw.marketValueM);valuesWritten++}',
  'if(evidenceNumberPresent(r.raw.marketValueM)){after[o+P.value]=nearestValueIndexFromMillions(r.raw.marketValueM);valuesWritten++}',
  'const shirt=evidenceNumberPresent(raw.shirt)?Number(raw.shirt):null;',
  'const shirt=evidenceNumberPresent(r.ident.shirt)?Number(r.ident.shirt):null;'
];
for (const fragment of critical) assert.ok(html.includes(fragment), 'Missing safe preview guard: ' + fragment);

const master = JSON.parse(fs.readFileSync('data/master-2026-27.json','utf8'));
assert.equal(master.clubs.length, 92);
assert.equal(new Set(master.clubs.map(c=>c.clubId)).size, 92);
assert.equal(master.clubs.reduce((n,c)=>n+c.players.length,0), 1472);
for (const [division,size] of Object.entries({'Premier League':20,Championship:24,'League One':24,'League Two':24}))
  assert.equal(master.clubs.filter(c=>c.division===division).length,size,'Division size: '+division);
// Parse the actual client-side application so a malformed review panel cannot ship.
const scripts = html.split('<script>').slice(1).map(part=>part.split('</script>')[0])
  .filter(part=>part.includes('const TEAM_RECORD_SIZE='));
assert.equal(scripts.length, 1, 'Exactly one SWOS application script should be present');
assert.doesNotThrow(()=>new vm.Script(scripts[0], {filename:'index.html script'}), 'Editor must be syntactically valid JavaScript');

const expectedNewValues = {
  'sheffield-wednesday': {
    'Joe Lumley':400, 'Max Lowe':1800, 'Ricardo Santos':350,
    'Liam Palmer':100, 'Liam Cooper':200, 'Sean Fusire':900,
    'Callum Slattery':700, 'Barry Bannan':200, 'Louie Barry':2500, 'Jamal Lowe':500
  },
  'wigan-athletic': {'Joe Walsh':1500}
};
for (const [clubId, records] of Object.entries(expectedNewValues)) {
  const club = master.clubs.find(c=>c.clubId===clubId);
  assert.ok(club, 'Missing verified club: '+clubId);
  for (const [name, euroThousands] of Object.entries(records)) {
    const player = club.players.find(p=>p.player===name);
    assert.ok(player, 'Missing researched player: '+name);
    assert.equal(player.marketValueM, Math.round(euroThousands*0.846328)/1000, 'Wrong GBP market value: '+name);
    assert.equal(player.marketValueSourceEuroK,euroThousands);
    assert.equal(player.marketValueFxRate,0.846328);
    assert.ok(player.marketValueSourceUrl?.includes('transfermarkt.'), 'No source URL for '+name);
    if (!(clubId==='sheffield-wednesday' && name==='Joe Lumley')) assert.ok(player.seasonSquadSourceUrl, 'No squad link for '+name);
    else assert.ok(!player.seasonSquadSourceUrl, 'Current profile cannot certify the season-specific squad for '+name);
  }
}
const batchD = JSON.parse(fs.readFileSync('data/league-one-squad-review-batch-d-2026-10-09.json','utf8'));
const reviewCount = batchD.clubs.reduce((n,c)=>n+c.squadReviews.length,0);
assert.equal(reviewCount,8);
assert.ok(html.includes('2026/27 squad number and membership reviews'));
assert.ok(html.includes('data-master-review-club'));
for (const reviewed of batchD.clubs) assert.ok(html.includes(reviewed.id));
assert.equal(master.clubs.flatMap(c=>c.players).filter(p=>p.marketValueM===null).length,262,'Unexpected valuations tally');
const l2batch=JSON.parse(fs.readFileSync('data/league-two-verified-values-batch-a-2026-10-09.json','utf8'));
assert.equal(l2batch.clubs.length,3);
assert.equal(l2batch.clubs.reduce((n,c)=>n+c.players.length,0),32);
assert.equal(l2batch.clubs.reduce((n,c)=>n+c.squadReviews.length,0),9);
for(const c of l2batch.clubs){const club=master.clubs.find(x=>x.clubId===c.id);assert.ok(club);for(const r of c.players){const p=club.players.find(x=>x.player===r.name);assert.ok(p,'No L2 record '+r.name);assert.equal(p.marketValueSourceEuroK,r.eurThousands);assert.equal(p.marketValueM,Math.round(r.eurThousands*l2batch.referenceFxRateEurGbp)/1000);assert.ok(p.seasonSquadSourceUrl);}}
assert.ok(html.includes('Oliver Smith and Cole Stockton'));
console.log('Research safety: verified 92 clubs, 1,472 players, 11 sourced additions, eight reviews and editor syntax.');

const batchB=JSON.parse(fs.readFileSync('data/league-two-verified-values-batch-b-2026-10-09.json','utf8'));
assert.equal(batchB.clubs.length,15,'Batch B should cover 15 unique League Two clubs');
assert.equal(new Set(batchB.clubs.map(c=>c.id)).size,15,'No duplicate source clubs');
assert.equal(batchB.clubs.reduce((n,c)=>n+c.players.length,0),122,'Batch B source value count');
for(const c of batchB.clubs){const club=master.clubs.find(x=>x.clubId===c.id);assert.ok(club);for(const v of c.players){const p=club.players.find(p=>p.player===v.name);assert.ok(p,'Missing player '+v.name);assert.equal(p.marketValueSourceEuroK,v.eurThousands);assert.equal(p.marketValueM,Math.round(v.eurThousands*batchB.referenceFxRateEurGbp)/1000);assert.equal(p.marketValueSourceUrl,c.sourceUrl);assert.equal(p.seasonSquadSourceUrl,c.sourceUrl);}}
assert.ok(html.includes('William Boyle as Will Boyle'),'Review notes must be visible');
console.log('League Two batch B: 15 clubs, 122 individually sourced values, review safeguards checked.');

const officialRochdale=JSON.parse(fs.readFileSync('data/league-two-rochdale-official-numbers-2026-10-09.json','utf8'));
const rochdaleClub=master.clubs.find(c=>c.clubId==='rochdale');
assert.equal(Object.keys(officialRochdale.officialShirts).length,14,'Official Rochdale source should confirm 14 shirts');
for(const [name,shirt] of Object.entries(officialRochdale.officialShirts)){const p=rochdaleClub.players.find(p=>p.player===name);assert.ok(p);assert.equal(p.shirt,shirt,'Official shirt differs '+name);assert.equal(p.shirtEvidenceUrl,officialRochdale.clubs[0].sourceUrl);assert.equal(p.seasonSquadSourceUrl,officialRochdale.clubs[0].sourceUrl);}
for(const name of officialRochdale.notConfirmed){const p=rochdaleClub.players.find(p=>p.player===name);assert.ok(p);assert.equal(p.shirtEvidenceUrl ?? null,null,'Unconfirmed shirt must stay unverified');}
assert.equal(master.clubs.flatMap(c=>c.players).filter(p=>p.marketValueM===null).length,262,'Valuations tally after League Two batch C');
console.log('Rochdale: 14 official 2026/27 numbers confirmed, 2 pending.');

// Batch C: each market value is tied to a named season-squad source, not a guessed valuation.
const batchC=JSON.parse(fs.readFileSync('data/league-two-verified-values-batch-c-2026-10-09.json','utf8'));
assert.equal(batchC.clubs.length,6);
assert.equal(new Set(batchC.clubs.map(c=>c.id)).size,6);
assert.equal(batchC.clubs.reduce((n,c)=>n+c.players.length,0),42);
assert.equal(batchC.clubs.reduce((n,c)=>n+c.squadReviews.length,0),13);
for(const c of batchC.clubs){const club=master.clubs.find(x=>x.clubId===c.id);assert.ok(club,'Missing source club');for(const r of c.players){const p=club.players.find(x=>x.player===r.name);assert.ok(p,'Missing source player '+r.name);assert.equal(p.marketValueSourceEuroK,r.eurThousands);assert.equal(p.marketValueM,Math.round(r.eurThousands*batchC.referenceFxRateEurGbp)/1000);assert.equal(p.marketValueSourceUrl,c.sourceUrl);assert.equal(p.seasonSquadSourceUrl,c.id==='rochdale'?officialRochdale.clubs[0].sourceUrl:c.sourceUrl);}}
for(const [clubId,name] of [['newport-county','Matt Smith'],['oldham-athletic','Emmanuel Monthe'],['tranmere-rovers','Joe Murphy'],['walsall','Lewis Simper'],['york-city','Ollie Pearce'],['rochdale','Mani Dieseruvwe']]){const p=master.clubs.find(c=>c.clubId===clubId).players.find(p=>p.player===name);assert.ok(p);assert.equal(p.marketValueM,null,'Unverified missing valuation must remain blank: '+name);}
assert.ok(html.includes('Matt Smith in the SWOS pack'));
console.log('League Two batch C: 42 season-linked values across six clubs; aliases and missing estimates preserved.');

// Market-value evidence must never replace stronger official shirt or squad membership evidence.
const cian=rochdaleClub.players.find(p=>p.player==='Cian Hayes');
assert.equal(cian.marketValueSourceUrl,batchC.clubs.find(c=>c.id==='rochdale').sourceUrl);
assert.equal(cian.shirtEvidenceUrl,officialRochdale.clubs[0].sourceUrl);
assert.equal(cian.seasonSquadSourceUrl,officialRochdale.clubs[0].sourceUrl);
assert.equal((html.match(/\"Cian Hayes\":\{/g)||[]).length>=1,true);
console.log('Evidence priority: official Rochdale shirt source retained independently of market valuation.');

// Batch D: exact values, no partial alias matches or made-up zeros.
const batchD2627=JSON.parse(fs.readFileSync('data/league-two-verified-values-batch-d-2026-10-10.json','utf8'));
assert.equal(batchD2627.clubs.length,8);assert.equal(new Set(batchD2627.clubs.map(c=>c.id)).size,8);
assert.equal(batchD2627.clubs.reduce((n,c)=>n+c.players.length,0),31);
for(const c of batchD2627.clubs){const club=master.clubs.find(x=>x.clubId===c.id);assert.ok(club);for(const r of c.players){const p=club.players.find(x=>x.player===r.name);assert.ok(p,'Missing researched player '+r.name);assert.equal(p.marketValueSourceEuroK,r.eurThousands);assert.equal(p.marketValueM,Math.round(r.eurThousands*batchD2627.referenceFxRateEurGbp)/1000);assert.equal(p.marketValueSourceUrl,c.sourceUrl);assert.ok(p.seasonSquadSourceUrl);}}
for(const [id,name] of [['grimsby-town','Geza David Turi'],['crawley-town','Vito Mannone'],['crewe-alexandra','Lewis Billington'],['gillingham','Taite Holtam']]){const club=master.clubs.find(c=>c.clubId===id);const player=club.players.find(p=>p.player===name);assert.ok(player);assert.equal(player.marketValueM,null,'Unverified or missing valuation must stay blank: '+name);}
assert.ok(html.includes('Conor McCarthy: season source shirt #3'));
console.log('League Two batch D: 31 sourced values across eight clubs; unknowns, shirts and prior evidence preserved.');

// Batch E adds only exact matches, and records missing-value reasons for two clubs.
const batchE2627=JSON.parse(fs.readFileSync('data/league-two-verified-values-and-gap-review-batch-e-2026-10-10.json','utf8'));
assert.equal(batchE2627.clubs.length,7);assert.equal(new Set(batchE2627.clubs.map(c=>c.id)).size,7);
assert.equal(batchE2627.clubs.reduce((n,c)=>n+c.players.length,0),13);
assert.equal(batchE2627.clubs.filter(c=>c.players.length===0).length,2);
for(const c of batchE2627.clubs){const club=master.clubs.find(x=>x.clubId===c.id);assert.ok(club);for(const v of c.players){const p=club.players.find(x=>x.player===v.name);assert.ok(p,'Player missing '+v.name);assert.equal(p.marketValueSourceEuroK,v.eurThousands);assert.equal(p.marketValueM,Math.round(v.eurThousands*batchE2627.referenceFxRateEurGbp)/1000);assert.equal(p.marketValueSourceUrl,c.sourceUrl);assert.ok(p.seasonSquadSourceUrl);}}
for(const [id,name] of [['accrington-stanley','Louie Moulden'],['accrington-stanley','Stefan Mols'],['cheltenham-town','Andreas Weimann'],['exeter-city','Gwion Edwards'],['shrewsbury-town','Jack Price']]){const p=master.clubs.find(c=>c.clubId===id).players.find(p=>p.player===name);assert.ok(p);assert.equal(p.marketValueM,null,'Unconfirmed market value must stay unknown: '+name);}
assert.ok(html.includes('Accrington review: Louie Moulden'));
console.log('League Two batch E: 13 more sourced valuations across five clubs, plus seven-club review queue.');

// Batch F: independently verify Premier League shirt and nationality evidence.
const batchF=JSON.parse(fs.readFileSync('data/premier-league-values-and-official-squad-batch-f-2026-10-10.json','utf8'));
assert.equal(batchF.clubs.length,6);
assert.equal(batchF.clubs.reduce((n,c)=>n+c.players.length,0),52);
for(const c of batchF.clubs){const stored=master.clubs.find(x=>x.clubId===c.id);assert.ok(stored);for(const v of c.players){const p=stored.players.find(p=>p.player===v.name);assert.ok(p,'Missing valuation '+v.name);assert.equal(p.marketValueSourceEuroK,v.eurThousands);assert.equal(p.marketValueM,Math.round(v.eurThousands*batchF.referenceFxRateEurGbp)/1000);assert.equal(p.marketValueSourceUrl,v.valueSourceUrl);assert.equal(p.seasonSquadSourceUrl,v.squadEvidenceUrl);}for(const [name,fields] of Object.entries(c.officialPlayers)){const p=stored.players.find(p=>p.player===name);assert.ok(p);assert.equal(p.shirt,fields[0]);assert.equal(p.shirtEvidenceUrl,c.squadSourceUrl);if(fields[1])assert.equal(p.nationality,fields[1]);}}
for(const id of ['chelsea','brentford','bournemouth','nottingham-forest']){const c=master.clubs.find(c=>c.clubId===id);assert.ok(c.players.every(p=>p.marketValueM!=null&&p.shirt!=null&&p.nationality),'Premier club must have essential SWOS data: '+id);assert.equal(new Set(c.players.map(p=>p.shirt)).size,16,'Duplicate shirt '+id);}
assert.equal(master.clubs.flatMap(c=>c.players).filter(p=>p.marketValueM==null).length,262);
assert.equal(master.clubs.find(c=>c.clubId==='rochdale').players.find(p=>p.player==='Laurence Maguire').shirtEvidenceUrl,'https://rochdaleafc.co.uk/2026-27-squad-numbers-confirmed/');
console.log('Batch F: 52 market values, 32 official shirts, 16 nationalities; official squad evidence retained.');

// Batch G is exact-match research: missing data never implies a £0 valuation.
const plBatchG=JSON.parse(fs.readFileSync('data/premier-league-values-batch-g-2026-10-10.json','utf8'));
assert.equal(plBatchG.clubs.length,5);assert.equal(new Set(plBatchG.clubs.map(c=>c.id)).size,5);
assert.equal(plBatchG.clubs.reduce((n,c)=>n+c.players.length,0),61);
for(const record of plBatchG.clubs){const club=master.clubs.find(c=>c.clubId===record.id);assert.ok(club);for(const r of record.players){const p=club.players.find(p=>p.player===r.name);assert.ok(p,'Player missing '+record.id+'/'+r.name);assert.equal(p.marketValueSourceEuroK,r.eurThousands);assert.equal(p.marketValueM,Math.round(r.eurThousands*plBatchG.referenceFxRateEurGbp)/1000);assert.equal(p.marketValueSourceUrl,record.sourceUrl);assert.equal(p.seasonSquadSourceUrl,record.sourceUrl);}}
for(const [id,name] of [['coventry','Ben Wilson'],['fulham','Hugo Larsson'],['crystal-palace','Axel Disasi'],['sunderland','Kevin Danso']]){const p=master.clubs.find(c=>c.clubId===id).players.find(p=>p.player===name);assert.ok(p);assert.equal(p.marketValueM,null,'Uncertain value must remain unknown: '+name);}
assert.equal(master.clubs.find(c=>c.clubId==='brighton').players.filter(p=>p.marketValueM!=null).length,16);
assert.ok(html.includes('Ben Wilson shares a name'));
console.log('Premier League batch G: 61 sourced valuations across 5 clubs; unknowns and identity conflicts preserved.');

// Research batch H: no values may be inserted by a fuzzy or cross-club name match.
const plBatchH=JSON.parse(fs.readFileSync('data/premier-league-values-batch-h-2026-10-10.json','utf8'));
assert.equal(plBatchH.clubs.length,3);assert.equal(new Set(plBatchH.clubs.map(c=>c.id)).size,3);
assert.equal(plBatchH.clubs.reduce((n,c)=>n+c.players.length,0),34);
for(const record of plBatchH.clubs){const club=master.clubs.find(c=>c.clubId===record.id);assert.ok(club);for(const r of record.players){const p=club.players.find(p=>p.player===r.name);assert.ok(p,'Player absent '+record.id+'/'+r.name);assert.equal(p.marketValueSourceEuroK,r.eurThousands);assert.equal(p.marketValueM,Math.round(r.eurThousands*plBatchH.referenceFxRateEurGbp)/1000);assert.equal(p.marketValueSourceUrl,record.sourceUrl);assert.equal(p.seasonSquadSourceUrl,record.sourceUrl);}}
for(const [id,name] of [['leeds','James Trafford'],['hull','Konstantinos Tzolakis'],['ipswich','Exequiel Palacios']]){const p=master.clubs.find(c=>c.clubId===id).players.find(p=>p.player===name);assert.ok(p);assert.equal(p.marketValueM,null,'No guessed valuation '+id+'/'+name);}
assert.ok(html.includes('not independently matched in the cited Ipswich'));
console.log('Premier League batch H: 34 sourced valuations across three clubs; disputed members remain in research queue.');

// 2026/27 official shirt reference never automatically changes SWOS binary-team data.
const kitResearch=JSON.parse(fs.readFileSync('data/kit-research-2026-27.json','utf8'));
assert.equal(kitResearch.season,'2026/27');
assert.ok(kitResearch.clubs.length>=74 && kitResearch.clubs.length<=92,'Sourced kit reference coverage must not shrink');
assert.equal(new Set(kitResearch.clubs.map(c=>c.clubId)).size,kitResearch.clubs.length,'Kit clubs must be unique');
assert.equal(kitResearch.swosPalette.length,10);
assert.equal(kitResearch.swosPatterns.length,4);
assert.ok(kitResearch.clubs.filter(c=>c.fullComponentsSourced).length>=24,'At least 11 official full home kit references required');
for(const c of kitResearch.clubs){const stored=master.clubs.find(x=>x.clubId===c.clubId);assert.ok(stored,'Kit research refers to unknown club '+c.clubId);assert.equal(c.homeShirtSourced,true);assert.ok(c.sourceUrl.startsWith('https://'));const h=c.home;assert.ok(Number.isInteger(h.type)&&h.type>=0&&h.type<=3);for(const n of ['shirt1','shirt2'])assert.ok(Number.isInteger(h[n])&&h[n]>=0&&h[n]<=9);for(const n of ['shorts','socks'])assert.ok(h[n]===null||(Number.isInteger(h[n])&&h[n]>=0&&h[n]<=9));assert.equal(c.fullComponentsSourced,h.shorts!==null&&h.socks!==null);}
const checkKit=id=>kitResearch.clubs.find(c=>c.clubId===id).home;
assert.equal(checkKit('newcastle').type,2);assert.equal(checkKit('brentford').type,2);
assert.equal(checkKit('brighton').type,0,'Thin pinstripes cannot become heavy SWOS stripes');
assert.equal(checkKit('man-city').shorts,null,'Unknown shorts must remain unknown');
assert.ok(!master.clubs[0].homeKit,'Research references must never auto-edit the binary game record');
assert.ok(master.clubs.filter(c=>c.division==='Premier League').every(c=>kitResearch.clubs.some(k=>k.clubId===c.clubId)),'All 20 Premier League clubs must now have verified home shirts');
assert.ok(master.clubs.filter(c=>c.division==='Championship').every(c=>kitResearch.clubs.some(k=>k.clubId===c.clubId)),'All 24 Championship clubs must now have sourced home shirts');
assert.equal(checkKit('watford').socks,9,'Official Watford yellow socks');
assert.equal(checkKit('portsmouth').shorts,1,'Official Portsmouth white shorts');
assert.equal(checkKit('west-bromwich-albion').shorts,null,'West Brom shorts have two official alternatives: retain explicit uncertainty');
assert.ok(master.clubs.filter(c=>c.division==='League One').slice(0,15).every(c=>kitResearch.clubs.some(k=>k.clubId===c.clubId)),'First 15 League One clubs must have sourced 2026/27 home shirts');
assert.equal(checkKit('bradford-city').shorts,2,'Bradford City official black shorts');
assert.equal(checkKit('blackpool').socks,3,'Blackpool official tangerine socks');
assert.equal(checkKit('burton-albion').type,2,'2026/27 Burton has returned to amber-black stripes');
assert.equal(checkKit('burton-albion').socks,3,'Admiral verifies Burton orange socks');
assert.equal(checkKit('huddersfield-town').shorts,null,'Huddersfield shorts still need colour evidence');
assert.equal(checkKit('cambridge-united').type,0,'2026/27 Cambridge home shirt is plain amber, not 2025/26 stripes');
assert.ok(master.clubs.filter(c=>c.division==='League One').every(c=>kitResearch.clubs.some(k=>k.clubId===c.clubId)),'All League One clubs need sourced 2026/27 shirts');
assert.ok(master.clubs.filter(c=>c.division==='League Two').slice(0,6).every(c=>kitResearch.clubs.some(k=>k.clubId===c.clubId)),'First six League Two clubs need sourced 2026/27 shirt references');
assert.equal(checkKit('oxford-united').shorts,2,'Oxford Macron launch explicitly lists navy shorts');
assert.equal(checkKit('plymouth-argyle').socks,1,'Plymouth official white socks');
assert.equal(checkKit('reading').type,3,'Reading home design is blue-and-white hoops');
assert.equal(checkKit('wycombe-wanderers').shorts,2,'Wycombe navy shorts approximate black in SWOS');
assert.equal(checkKit('accrington-stanley').type,1,'Accrington retained red shirt with white sleeves');
assert.equal(checkKit('bristol-rovers').type,0,'SWOS has no blue-white quarter pattern; do not pretend this is a striped shirt');
assert.equal(checkKit('stevenage').type,0,'Stevenage white kit with red trim is not white-red full sleeves');
for (const k of kitResearch.clubs) if(k.secondarySourceUrl) assert.ok(/^https:\/\//.test(k.secondarySourceUrl),'Secondary evidence must link to a valid https source');
assert.equal(checkKit('crystal-palace').type,0,'Diagonal sash unavailable in SWOS');
assert.equal(checkKit('ipswich').shorts,1,'Official Ipswich white shorts');
assert.equal(checkKit('coventry').socks,5,'Official Coventry royal blue socks');
console.log('Kit research: '+kitResearch.clubs.length+' sourced 2026/27 home shirts, '+kitResearch.clubs.filter(c=>c.fullComponentsSourced).length+' full component references, SWOS approximations safeguarded.');
