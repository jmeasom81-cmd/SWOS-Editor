import fs from 'node:fs';

const INTAKE='football-db/identity-intake.json';
const OUT='football-db/identity-packs/championship-promoted.json';
const MANIFEST='football-db/manifest.json';
for(const file of [INTAKE,MANIFEST])if(!fs.existsSync(file))throw new Error(`Identity promotion: missing ${file}.`);
const intake=JSON.parse(fs.readFileSync(INTAKE,'utf8'));
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const ready=(intake.clubs||[]).find(c=>c.promotionReady);
if(!ready){console.log('Identity promotion complete · no Championship club is currently promotion-ready');process.exit(0)}
if(ready.playerCount!==16||ready.players?.length!==16||ready.errors?.length)throw new Error(`Identity promotion: ${ready.clubName} is not a clean 16-player intake.`);
const counts=ready.roleCounts||{};
if((counts.Goalkeeper||0)<2||(counts.Defender||0)<4||(counts.Midfielder||0)<4||(counts.Forward||0)<2)throw new Error(`Identity promotion: ${ready.clubName} does not meet minimum role mix.`);
let pack={schemaVersion:1,season:'2026/27',snapshot:'2026-09-11',source:'Guarded Championship identity evidence promotion',clubs:{}};
if(fs.existsSync(OUT))pack=JSON.parse(fs.readFileSync(OUT,'utf8'));
pack.schemaVersion=1;pack.season='2026/27';pack.snapshot='2026-09-11';pack.source='Guarded Championship identity evidence promotion';pack.clubs=pack.clubs||{};
if(pack.clubs[ready.clubId])throw new Error(`Identity promotion: ${ready.clubId} is already present in ${OUT}.`);
pack.clubs[ready.clubId]=ready.players.map(p=>({footballName:p.footballName,shirt:p.shirt??null,group:p.group,nationality:p.nationality,source:p.source}));
fs.mkdirSync('football-db/identity-packs',{recursive:true});fs.writeFileSync(OUT,JSON.stringify(pack,null,2)+'\n','utf8');
const promotedCount=Object.keys(pack.clubs).length;
manifest.version=`2026.27-england-identity.${20+promotedCount}`;
manifest.publishedAt='2026-09-11';manifest.dataModel=manifest.dataModel||{};manifest.dataModel.identityEvidencePromotion=true;manifest.resources=manifest.resources||{};manifest.resources.identityExpansionQueue='football-db/identity-expansion-queue.json';manifest.resources.identityIntake='football-db/identity-intake.json';manifest.resources.identityEvidenceSchema='football-db/identity-evidence/schema-v1.json';manifest.notes=Array.isArray(manifest.notes)?manifest.notes:[];manifest.notes=manifest.notes.filter(x=>!String(x).startsWith('Championship identity promotion published '));manifest.notes.push(`Championship identity promotion published ${ready.clubId}; ${promotedCount} Championship identity club(s) now flow through the evidence guard.`);fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
console.log(`Identity promotion complete · ${ready.clubId} promoted · Championship ${promotedCount}/24 staged identity clubs · DB ${manifest.version}`);
