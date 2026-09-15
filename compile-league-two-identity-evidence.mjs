import fs from 'node:fs';
import path from 'node:path';

const CACHE_DIR=process.env.SWOS_L2_PAGE_CACHE||'/tmp/swos-l2-pages';
const OUT_DIR='football-db/league-two-identity-evidence';
const SNAPSHOT='2026-09-15';
const clubs={
  'accrington-stanley':['Accrington Stanley','accring.htm'],'barnet':['Barnet','barnet.htm'],'bristol-rovers':['Bristol Rovers','bristolr.htm'],'cheltenham-town':['Cheltenham Town','chelt.htm'],'chesterfield':['Chesterfield','chestrf.htm'],'colchester-united':['Colchester United','colches.htm'],'crawley-town':['Crawley Town','crawley.htm'],'crewe-alexandra':['Crewe Alexandra','crewe.htm'],'exeter-city':['Exeter City','exeter.htm'],'fleetwood-town':['Fleetwood Town','fleetwood.htm'],'gillingham':['Gillingham','gilling.htm'],'grimsby-town':['Grimsby Town','grimsby.htm'],'newport-county':['Newport County','newport.htm'],'northampton-town':['Northampton Town','northam.htm'],'oldham-athletic':['Oldham Athletic','oldham.htm'],'port-vale':['Port Vale','portv.htm'],'rochdale':['Rochdale','rochdale.htm'],'rotherham-united':['Rotherham United','rother.htm'],'salford-city':['Salford City','salford.htm'],'shrewsbury-town':['Shrewsbury Town','shrews.htm'],'swindon-town':['Swindon Town','swindon.htm'],'tranmere-rovers':['Tranmere Rovers','tranmere.htm'],'walsall':['Walsall','walsall.htm'],'york-city':['York City','york.htm']
};
const nationality={ENG:'England',SCO:'Scotland',WAL:'Wales',NIR:'Northern Ireland',IRL:'Republic of Ireland',ALB:'Albania',ARG:'Argentina',ATG:'Antigua and Barbuda',AUS:'Australia',AUT:'Austria',BEL:'Belgium',BIH:'Bosnia and Herzegovina',BRA:'Brazil',BUL:'Bulgaria',CAN:'Canada',CMR:'Cameroon',COD:'DR Congo',CGO:'Congo',CHI:'Chile',COL:'Colombia',CRO:'Croatia',CUB:'Cuba',CYP:'Cyprus',CZE:'Czech Republic',DEN:'Denmark',ECU:'Ecuador',ESP:'Spain',FIN:'Finland',FRA:'France',FRO:'Faroe Islands',GAM:'The Gambia',GER:'Germany',GHA:'Ghana',GRE:'Greece',GRN:'Grenada',GUI:'Guinea',GUY:'Guyana',HON:'Honduras',HUN:'Hungary',ISL:'Iceland',ISR:'Israel',ITA:'Italy',JAM:'Jamaica',JPN:'Japan',KEN:'Kenya',KOR:'South Korea',KVX:'Kosovo',LCA:'Saint Lucia',LVA:'Latvia',MAR:'Morocco',MDA:'Moldova',MLT:'Malta',MSR:'Montserrat',MWI:'Malawi',NED:'Netherlands',NGA:'Nigeria',NOR:'Norway',NZL:'New Zealand',POL:'Poland',POR:'Portugal',ROU:'Romania',RSA:'South Africa',SEN:'Senegal',SKN:'Saint Kitts and Nevis',SLE:'Sierra Leone',SLO:'Slovenia',SRB:'Serbia',SUD:'Sudan',SVK:'Slovakia',SWE:'Sweden',SUI:'Switzerland',TUR:'Turkey',UGA:'Uganda',UKR:'Ukraine',URU:'Uruguay',USA:'United States',VEN:'Venezuela',ZIM:'Zimbabwe'};
const role={G:'Goalkeeper',D:'Defender',M:'Midfielder',F:'Forward'};
const entity={'&amp;':'&','&nbsp;':' ','&#39;':"'",'&quot;':'"','&aacute;':'á','&eacute;':'é','&iacute;':'í','&oacute;':'ó','&uacute;':'ú','&Aacute;':'Á','&Eacute;':'É','&ntilde;':'ñ','&Ntilde;':'Ñ','&oslash;':'ø','&Oslash;':'Ø','&ouml;':'ö','&uuml;':'ü','&ccedil;':'ç','&scaron;':'š','&Scaron;':'Š'};
const clean=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|nbsp|#39|quot|aacute|eacute|iacute|oacute|uacute|Aacute|Eacute|ntilde|Ntilde|oslash|Oslash|ouml|uuml|ccedil|scaron|Scaron);/g,m=>entity[m]||m).replace(/\s+/g,' ').trim();
function parse(file){
  const raw=fs.readFileSync(file,'utf8').split(/Players no longer at this club/i)[0],rows=[];
  for(const match of raw.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=[...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(x=>clean(x[1]));
    if(cells.length<4)continue;
    const shirt=/^\d{1,2}$/.test(cells[0])?Number(cells[0]):null,name=cells[1],nat=cells[2].toUpperCase(),group=role[cells[3].toUpperCase()];
    if(!name||name==='Name'||!group||!nat)continue;
    if(!nationality[nat])throw new Error(`${path.basename(file)}: unknown nationality code ${nat} for ${name}`);
    rows.push({footballName:name,group,nationality:nationality[nat],shirt});
  }
  const unique=[];for(const row of rows){if(!unique.some(x=>x.footballName.toLocaleLowerCase('en')===row.footballName.toLocaleLowerCase('en')))unique.push(row);}return unique;
}
function select16(rows,clubId){
  const target={Goalkeeper:2,Defender:5,Midfielder:5,Forward:4},minimum={Goalkeeper:2,Defender:4,Midfielder:4,Forward:2},selected=[];
  for(const [group,count] of Object.entries(target))selected.push(...rows.filter(x=>x.group===group).slice(0,count));
  for(const row of rows){if(selected.length>=16)break;if(!selected.includes(row))selected.push(row);}
  if(selected.length!==16)throw new Error(`${clubId}: only ${selected.length} eligible current players.`);
  const mix=Object.fromEntries(Object.keys(target).map(group=>[group,selected.filter(x=>x.group===group).length]));
  for(const [group,count] of Object.entries(minimum))if(mix[group]<count)throw new Error(`${clubId}: ${group} ${mix[group]} is below ${count}.`);
  return {selected,mix};
}

fs.mkdirSync(OUT_DIR,{recursive:true});let total=0;
for(const [clubId,[clubName,page]] of Object.entries(clubs)){
  const file=path.join(CACHE_DIR,page);if(!fs.existsSync(file))throw new Error(`${clubId}: missing ${file}`);
  const rows=parse(file),{selected,mix}=select16(rows,clubId),url=`https://www.footballsquads.co.uk/eng/2026-2027/fltwo/${page}`;
  const out={schemaVersion:1,season:'2026/27',clubId,snapshot:SNAPSHOT,sourceSummary:`${clubName} current 2026/27 first-team roster, shirt number, nationality and broad playing role from FootballSquads after the summer window. The selected 16 use a balanced mix of ${mix.Goalkeeper} goalkeepers, ${mix.Defender} defenders, ${mix.Midfielder} midfielders and ${mix.Forward} forwards.`,players:selected.map(p=>({...p,source:`${url} · current 2026/27 roster · ${p.shirt==null?'number unavailable':`#${p.shirt}`} · ${p.group}`}))};
  fs.writeFileSync(path.join(OUT_DIR,`${clubId}.json`),JSON.stringify(out,null,2)+'\n','utf8');total+=selected.length;
  console.log(`${clubName} · source ${rows.length} · selected 16 · ${mix.Goalkeeper}/${mix.Defender}/${mix.Midfielder}/${mix.Forward}`);
}
if(total!==384)throw new Error(`Compiled ${total} League Two identities instead of 384.`);
console.log(`League Two identity evidence compiled · 24 clubs / ${total} selected current players · exact-16 and minimum 2/4/4/2 role gates.`);
