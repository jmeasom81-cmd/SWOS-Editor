import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT='football-db';
const DIST='dist/football-db';
const required=[
  'manifest.json',
  'identities.json',
  'research-packs.json',
  'coverage.json',
  'research-queue.json',
  'research-intake.json',
  'validation.json',
  'squad-model.json',
  'schema-v1.json'
];
const optional=[
  'research-evidence/schema-v1.json',
  'identity-evidence/schema-v1.json',
  'identity-expansion-queue.json',
  'identity-intake.json'
];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.mkdirSync(DIST,{recursive:true});
const resources=[];
for(const rel of required){
  const src=path.join(ROOT,rel),dst=path.join(DIST,rel);
  if(!fs.existsSync(src))throw new Error(`Football DB dist finalizer: missing required ${src}.`);
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.copyFileSync(src,dst);
  resources.push({path:rel,sha256:sha(src),bytes:fs.statSync(src).size,required:true});
}
for(const rel of optional){
  const src=path.join(ROOT,rel);if(!fs.existsSync(src))continue;
  const dst=path.join(DIST,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);
  resources.push({path:rel,sha256:sha(src),bytes:fs.statSync(src).size,required:false});
}
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.json'),'utf8'));
const publication={schemaVersion:1,databaseVersion:manifest.version,season:manifest.season,publishedAt:new Date().toISOString(),mode:'authoritative-source-to-static-dist-finalizer',resources,safety:{teamWriteReady:false,careerWriteReady:false,note:'Static publication never enables TEAM.* or .CAR writes.'}};
fs.writeFileSync(path.join(DIST,'publication.json'),JSON.stringify(publication,null,2)+'\n','utf8');
console.log(`Published final football-db static bundle · ${resources.length} resources · DB ${manifest.version}`);
