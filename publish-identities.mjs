import fs from 'node:fs';

const SOURCE='index.html';
const OUT='football-db/identities.json';
if(!fs.existsSync(SOURCE)) throw new Error('Identity publisher failed: index.html is missing.');
const html=fs.readFileSync(SOURCE,'utf8');

function extractJson(startMarker,endMarker,label){
  const start=html.indexOf(startMarker);
  if(start<0) throw new Error(`Identity publisher failed: ${label} start marker not found.`);
  const jsonStart=start+startMarker.length;
  const end=html.indexOf(endMarker,jsonStart);
  if(end<0) throw new Error(`Identity publisher failed: ${label} end marker not found.`);
  try{return JSON.parse(html.slice(jsonStart,end).trim())}
  catch(e){throw new Error(`Identity publisher failed: ${label} is not valid JSON: ${e.message}`)}
}

const clubs=extractJson('const PL_2627_VERIFIED_IDENTITIES=',';\n  const PL_2627_U21_CANDIDATES=','verified identities');
const u21Candidates=extractJson('const PL_2627_U21_CANDIDATES=',';\n  function identityReadyClubIds','U21 candidates');
const clubIds=Object.keys(clubs);
const playerCount=Object.values(clubs).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0);
const u21PlayerCount=Object.values(u21Candidates).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0);

const out={
  schemaVersion:1,
  season:'2026/27',
  snapshot:'2026-09-09',
  status:'identity-ready-foundation',
  clubCount:clubIds.length,
  playerCount,
  u21ClubCount:Object.keys(u21Candidates).length,
  u21PlayerCount,
  clubs,
  u21Candidates,
  safety:{
    source:'Existing verified SWOS Studio identity layer',
    teamWriteReady:false,
    careerWriteReady:false,
    note:'Identity publication changes football-data lookup only. It does not enable TEAM.* or .CAR writes.'
  }
};
fs.mkdirSync('football-db',{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
console.log(`Published identity feed · ${clubIds.length} clubs · ${playerCount} verified senior identities · ${u21PlayerCount} U21 candidates`);
