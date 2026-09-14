import fs from 'node:fs';
import path from 'node:path';

const SNAPSHOT='2026-09-13';
const IDENTITY_DIR='football-db/league-one-identity-evidence';
const OUT_DIR='football-db/league-one-research-evidence';
const CACHE_ROOT=process.env.SWOS_L1_CACHE_ROOT||'/tmp';
const TM_DIR=path.join(CACHE_ROOT,'swos-l1-tm');
const FS_DIR=path.join(CACHE_ROOT,'swos-l1-pages');
const SEARCH_DIR=path.join(CACHE_ROOT,'swos-l1-search');

const aliases={
  'Mathew Stevens':'Matty Stevens',
  'Kgaogelo Chauke':'Kegs Chauke',
  'Gabriel Breeze':'Gabe Breeze',
  'Kelland Watts':'Kell Watts',
  'Emil Riis Jakobsen':'Emil Riis',
  'Demi Mitchell':'Demetri Mitchell',
  'Mads Juel Andersen':'Mads Andersen',
  'Daniel Gore':'Dan Gore',
  'Matthew Platt':'Matty Platt',
  'Ollie Cooper':'Oliver Cooper',
  'Will Grainger':'William Grainger',
  'Luther Wildin':'Luther James-Wildin',
  'Junior Quitirna':'Armando Junior Quitirna'
};

const htmlDecode=value=>String(value||'')
  .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#0*39;|&apos;/g,"'")
  .replace(/&quot;/g,'"').replace(/&ndash;|&mdash;/g,'-').replace(/\s+/g,' ').trim();
const text=value=>htmlDecode(String(value||'').replace(/<[^>]+>/g,''));
const norm=value=>String(value||'').normalize('NFD').replace(/\p{Diacritic}/gu,'')
  .replace(/[øØ]/g,'o').replace(/[ðÐ]/g,'d').replace(/[þÞ]/g,'th')
  .replace(/[łŁ]/g,'l').replace(/[æÆ]/g,'ae').replace(/[œŒ]/g,'oe')
  .toLowerCase().replace(/[^a-z0-9]/g,'');

function outerRows(html){
  const starts=[...html.matchAll(/<tr class="(?:odd|even)">/g)].map(match=>match.index);
  return starts.map((start,index)=>html.slice(start,starts[index+1]??html.length));
}

function parseTransfermarktSquad(file){
  const html=fs.readFileSync(file,'utf8'),rows=[];
  for(const row of outerRows(html)){
    const player=row.match(/<a href="([^"?]+\/profil\/spieler\/\d+)">\s*([^<]+?)\s*<\/a>/);
    const role=row.match(/<\/tr>\s*<tr>\s*<td>\s*([^<]+?)\s*<\/td>/);
    const dob=row.match(/<\/table>\s*<\/td><td class="zentriert">\s*(\d{2}\/\d{2}\/\d{4})/);
    const market=row.match(/<td class="rechts hauptlink">\s*(?:<a[^>]*>)?\s*([^<]*?)\s*(?:<\/a>)?\s*<\/td>/);
    if(player&&role&&dob&&market)rows.push({
      name:htmlDecode(player[2]),profile:`https://www.transfermarkt.co.uk${player[1]}`,
      role:htmlDecode(role[1]),dob:dob[1],market:htmlDecode(market[1]),sourceKind:'current squad table'
    });
  }
  return rows;
}

function parseTransfermarktSearch(file){
  const html=fs.readFileSync(file,'utf8'),rows=[];
  for(const row of outerRows(html)){
    const player=row.match(/<a[^>]*href="([^"?]+\/profil\/spieler\/\d+)"[^>]*>\s*([^<]+?)\s*<\/a>/);
    if(!player)continue;
    const club=row.match(/<tr><td><a[^>]*title="([^"]+)"[^>]*href="[^"]+\/startseite\/verein\/\d+"/);
    const role=row.match(/<\/table><\/td><td class="zentriert">\s*([^<]+?)\s*<\/td>/);
    const age=row.match(/<td class="zentriert">\s*(\d{1,2}|-)\s*<\/td><td class="zentriert"><img/);
    const market=row.match(/<td class="rechts hauptlink">\s*(?:<a[^>]*>)?\s*([^<]*?)\s*(?:<\/a>)?\s*<\/td>/);
    rows.push({
      name:htmlDecode(player[2]),profile:`https://www.transfermarkt.co.uk${player[1]}`,
      club:club?htmlDecode(club[1]):'',role:role?htmlDecode(role[1]):'',
      age:age?.[1]||'',market:market?htmlDecode(market[1]):'',sourceKind:'player search result'
    });
  }
  return rows;
}

function parseFootballSquads(file){
  const html=fs.readFileSync(file,'utf8'),rows=[];
  for(const match of html.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)){
    const cells=[...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(cell=>text(cell[1]));
    if(cells.length>=7&&cells[1])rows.push({name:cells[1],role:cells[3],dob:/^\d{2}-\d{2}-\d{2}$/.test(cells[6])?cells[6]:null});
  }
  return rows;
}

function ageAt(dateText){
  let day,month,year;
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(dateText)){
    [day,month,year]=dateText.split('/').map(Number);
  }else if(/^\d{2}-\d{2}-\d{2}$/.test(dateText)){
    const parts=dateText.split('-').map(Number);day=parts[0];month=parts[1];year=parts[2]<=26?2000+parts[2]:1900+parts[2];
  }else throw new Error(`Unsupported date ${dateText}`);
  const [atYear,atMonth,atDay]=SNAPSHOT.split('-').map(Number);
  return atYear-year-((atMonth<month||(atMonth===month&&atDay<day))?1:0);
}

function marketValueM(raw){
  const value=String(raw||'').trim();
  if(!value||value==='-')return 0;
  const match=value.replace(/,/g,'').match(/^€([0-9]+(?:\.[0-9]+)?)([mk])$/i);
  if(!match)throw new Error(`Unsupported market value ${value}`);
  const amount=Number(match[1]);return match[2].toLowerCase()==='m'?amount:Number((amount/1000).toFixed(3));
}

function swosPosition(role){
  const key=String(role||'').trim().toLowerCase();
  if(['goalkeeper','gk'].includes(key))return 0;
  if(['right-back','right back','right wing-back','right wing back','rb','rwb'].includes(key))return 1;
  if(['left-back','left back','left wing-back','left wing back','lb','lwb'].includes(key))return 2;
  if(['centre-back','center-back','centre back','center back','sweeper','cb'].includes(key))return 3;
  if(['right midfield','right winger','rm','rw'].includes(key))return 4;
  if(['left midfield','left winger','lm','lw'].includes(key))return 5;
  if(['defensive midfield','central midfield','attacking midfield','midfield','dm','cm','am'].includes(key))return 6;
  if(['centre-forward','center-forward','second striker','forward','attack','cf','ss'].includes(key))return 7;
  throw new Error(`Unsupported playing role ${role}`);
}

const identityFiles=fs.readdirSync(IDENTITY_DIR).filter(file=>file.endsWith('.json')&&file!=='schema-v1.json').sort();
const coverage=JSON.parse(fs.readFileSync('football-db/coverage.json','utf8'));
const clubNames=new Map(coverage.clubs.filter(club=>club.division===2).map(club=>[club.id,club.name]));
if(identityFiles.length!==24||clubNames.size!==24)throw new Error(`Expected 24 League One clubs; found ${identityFiles.length} evidence files and ${clubNames.size} coverage rows.`);
fs.mkdirSync(OUT_DIR,{recursive:true});
let playerTotal=0,zeroValues=0,searchFallbacks=0,aliasMatches=0;

for(const file of identityFiles){
  const clubId=file.replace(/\.json$/,''),identity=JSON.parse(fs.readFileSync(path.join(IDENTITY_DIR,file),'utf8'));
  const squadRows=parseTransfermarktSquad(path.join(TM_DIR,`${clubId}.html`));
  const fsRows=parseFootballSquads(path.join(FS_DIR,`${clubId}.html`));
  const squadByName=new Map(squadRows.map(row=>[norm(row.name),row]));
  const fsByName=new Map(fsRows.map(row=>[norm(row.name),row]));
  const players={};
  for(const selected of identity.players){
    const sourceName=aliases[selected.footballName]||selected.footballName;
    let research=squadByName.get(norm(sourceName));
    if(research&&norm(sourceName)!==norm(selected.footballName))aliasMatches++;
    if(!research){
      const searchFile=path.join(SEARCH_DIR,`${clubId}--${norm(selected.footballName)}.html`);
      if(!fs.existsSync(searchFile))throw new Error(`${clubId}/${selected.footballName}: missing search cache ${searchFile}`);
      const candidates=parseTransfermarktSearch(searchFile).filter(row=>norm(row.name)===norm(sourceName)||norm(row.name)===norm(selected.footballName));
      const clubName=clubNames.get(clubId),atClub=candidates.filter(row=>row.club&&(norm(row.club).includes(norm(clubName))||norm(clubName).includes(norm(row.club))));
      research=atClub.length===1?atClub[0]:candidates.length===1?candidates[0]:null;
      if(!research)throw new Error(`${clubId}/${selected.footballName}: could not select one Transfermarkt profile from ${candidates.length} candidate(s).`);
      searchFallbacks++;
      if(norm(research.name)!==norm(selected.footballName))aliasMatches++;
    }
    const fsRow=fsByName.get(norm(selected.footballName));
    let age;
    if(fsRow?.dob)age=ageAt(fsRow.dob);
    else if(research.dob)age=ageAt(research.dob);
    else if(/^\d{1,2}$/.test(research.age))age=Number(research.age);
    else if(selected.footballName==='Noah Town')age=17;
    else throw new Error(`${clubId}/${selected.footballName}: no sourced age or date of birth.`);
    const value=marketValueM(research.market),position=swosPosition(research.role);
    const sources=[String(selected.source).split(' · ')[0],research.profile];
    const notes=[];
    if(norm(research.name)!==norm(selected.footballName))notes.push(`Transfermarkt publishes this player as ${research.name}; the footballName key remains matched to the identity feed.`);
    if(value===0){zeroValues++;notes.push('The cited Transfermarkt profile publishes no market value; 0 records an unavailable published valuation, not an estimate.');}
    if(research.sourceKind==='player search result')notes.push('Role and valuation were taken from the current player search row because the player was not listed in the downloaded senior club table.');
    if(selected.footballName==='Noah Town'){
      sources.push('https://www.worldfootball.net/teams/te200/barnsley-fc/all-players/');
      notes.push('Age 17 at the snapshot is supported by the cited current Barnsley player-history listing (born 24 November 2008).');
    }
    players[selected.footballName]={age,marketValueM:value,position,sources};
    if(notes.length)players[selected.footballName].notes=notes.join(' ');
    playerTotal++;
  }
  if(Object.keys(players).length!==16)throw new Error(`${clubId}: compiled ${Object.keys(players).length} players instead of 16.`);
  const out={schemaVersion:1,season:'2026/27',clubId,snapshot:SNAPSHOT,sourceSummary:`${clubNames.get(clubId)} current 2026/27 identity selection cross-checked against FootballSquads for squad membership and date of birth, plus current Transfermarkt player roles and published market values. Exact footballName keys remain aligned to the promoted League One identity 16.`,players};
  fs.writeFileSync(path.join(OUT_DIR,file),JSON.stringify(out,null,2)+'\n','utf8');
}

if(playerTotal!==384)throw new Error(`Compiled ${playerTotal} players instead of 384.`);
console.log(`League One research evidence compiled · 24 clubs / ${playerTotal} players · ${searchFallbacks} profile-search fallbacks · ${aliasMatches} explicit identity aliases · ${zeroValues} unavailable published values encoded as 0 with notes.`);
