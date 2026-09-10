import fs from 'node:fs';

const source='football-db/manifest.json';
const targetDir='dist/football-db';
const target=targetDir+'/manifest.json';

if(!fs.existsSync(source)) throw new Error('SWOS Studio v1.35.0 build failed: football database manifest is missing.');
fs.mkdirSync(targetDir,{recursive:true});
fs.copyFileSync(source,target);

const manifest=JSON.parse(fs.readFileSync(target,'utf8'));
if(!manifest.version||!manifest.databaseId) throw new Error('SWOS Studio v1.35.0 build failed: football database manifest is invalid.');
console.log('Published football database manifest '+manifest.version+' into dist.');
