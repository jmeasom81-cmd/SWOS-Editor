import fs from 'node:fs';

const INTAKE='football-db/league-two-identity-intake.json',OUT='football-db/identity-packs/league-two-promoted.json',MANIFEST='football-db/manifest.json';
for(const file of [INTAKE,MANIFEST])if(!fs.existsSync(file))throw new Error(`League Two identity promotion: missing ${file}.`);
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8')),manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8')),ready=(intake.clubs||[]).find(c=>c.promotionReady);
if(!ready){console.log('League Two identity promotion · no club is currently promotion-ready');process.exit(0);}
if(ready.playerCount!==16||ready.players?.length!==16||ready.errors?.length)throw new Error(`League Two identity promotion: ${ready.clubName} is not a clean 16-player intake.`);
const counts=ready.roleCounts||{};if((counts.Goalkeeper||0)<2||(counts.Defender||0)<4||(counts.Midfielder||0)<4||(counts.Forward||0)<2)throw new Error(`League Two identity promotion: ${ready.clubName} fails the role mix.`);
let pack={schemaVersion:1,season:'2026/27',snapshot:'2026-09-15',source:'Guarded League Two identity evidence promotion',clubs:{}};
if(fs.existsSync(OUT))pack=JSON.parse(fs.readFileSync(OUT,'utf8'));pack.clubs=pack.clubs||{};
if(pack.clubs[ready.clubId])throw new Error(`League Two identity promotion: ${ready.clubId} is already published.`);
pack.clubs[ready.clubId]=ready.players.map(p=>({footballName:p.footballName,shirt:p.shirt??null,group:p.group,nationality:p.nationality,source:p.source,...(p.notes?{notes:p.notes}:{})}));
fs.mkdirSync('football-db/identity-packs',{recursive:true});fs.writeFileSync(OUT,JSON.stringify(pack,null,2)+'\n','utf8');
const promoted=Object.keys(pack.clubs).length;manifest.version=`2026.27-england-identity.${68+promoted}`;manifest.publishedAt='2026-09-15';manifest.resources=manifest.resources||{};manifest.resources.leagueTwoIdentityExpansionQueue='football-db/league-two-identity-expansion-queue.json';manifest.resources.leagueTwoIdentityIntake='football-db/league-two-identity-intake.json';manifest.resources.leagueTwoIdentityEvidenceSchema='football-db/league-two-identity-evidence/schema-v1.json';manifest.dataModel=manifest.dataModel||{};manifest.dataModel.leagueTwoIdentityEvidencePromotion=true;manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('League Two identity promotion published '));manifest.notes.push(`League Two identity promotion published ${ready.clubId}; ${promoted}/24 League Two clubs now pass the identity guard.`);fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
console.log(`League Two identity promotion · ${ready.clubId} · ${promoted}/24 · DB ${manifest.version}.`);
