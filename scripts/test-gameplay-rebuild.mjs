import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const master=JSON.parse(fs.readFileSync('data/master-2026-27.json','utf8'));
const html=fs.readFileSync('dist/index.html','utf8');
const source=fs.readFileSync('scripts/gameplay-rebuild-client.js','utf8');
assert.ok(html.includes('<title>SWOS Studio v1.36.0</title>'));
assert.ok(html.includes('applyEnglandGameplayRebuild(candidate);'));
assert.ok(html.includes('gameplayReport:p.gameplayReport||null'));
assert.ok(html.includes('else category="skills"'));
assert.ok(!html.includes('id="installSeasonUpdate"'),'Direct installer must remain locked.');
const players=master.clubs.flatMap(c=>c.players);
assert.equal(master.clubs.length,92);assert.equal(players.length,1472);
assert.equal(players.filter(p=>p.marketValueM===null).length,238);
const data=Object.fromEntries(master.clubs.map(c=>[c.clubId,c.players.map(p=>[p.player,p.position,p.marketValueM,p.minutes,p.goals,p.assists,p.age])]));
const T={name:5,nameLength:19,division:25,order:60,players:76};
const P={nationality:0,shirt:2,name:3,nameLength:23,multi:26,passing:28,shootHead:29,tackleControl:30,speedFinish:31,value:32};
const HEADER_SIZE=2,TEAM_RECORD_SIZE=684,PLAYER_RECORD_SIZE=38,PLAYERS_PER_TEAM=16;
const bytes=new Uint8Array(HEADER_SIZE+92*TEAM_RECORD_SIZE);
bytes[0]=0;bytes[1]=92;
function swosSafeName(value){
 let s=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9 .'-]+/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
 if(s.length<=23)return s;const parts=s.split(' ');
 if(parts.length>1){const short=parts[0][0]+'. '+parts.slice(1).join(' ');if(short.length<=23)return short}
 return s.slice(0,23).trim();
}
function readText(b,o,len){let s='';for(let i=0;i<len;i++){const v=b[o+i];if(!v)break;s+=String.fromCharCode(v)}return s.trimEnd();}
function textAt(b,o,len,text){for(let j=0;j<Math.min(len,text.length);j++)b[o+j]=text.charCodeAt(j)}
let allClubs=[],allPlayers=[];
master.clubs.forEach((c,ci)=>{
 const off=HEADER_SIZE+ci*TEAM_RECORD_SIZE;
 const dn=['Premier League','Championship','League One','League Two'].indexOf(c.division);
 assert.ok(dn>=0);
 bytes[off+T.division]=dn;
 allClubs.push({clubId:c.clubId,name:c.club,slot:ci,division:dn});
 c.players.forEach((p,pi)=>{
  const o=off+T.players+pi*PLAYER_RECORD_SIZE;
  const name=swosSafeName(p.player);
  textAt(bytes,o+P.name,P.nameLength,name);
  bytes[o+P.multi]=((p.position&7)<<5)|11;
  bytes[o+P.passing]=0xA7;bytes[o+P.shootHead]=0x77;bytes[o+P.tackleControl]=0x77;bytes[o+P.speedFinish]=0x77;
  bytes[o+P.value]=44;
  allPlayers.push({club:c.club,slot:pi+1,newName:name});
 });
});
const original=bytes.slice(),candidate=bytes.slice();
const ctx={Uint8Array,Array,Map,Set,String,Math,Number,Error,console,HEADER_SIZE,TEAM_RECORD_SIZE,PLAYER_RECORD_SIZE,PLAYERS_PER_TEAM,T,P,
 SWOS_GAMEPLAY_DATA_2627:data,swosSafeName,readText,
 nearestValueIndexFromMillions:m=>Math.max(0,Math.min(49,Math.round(m*3))),
 seasonUpdateState:{english:{bytes:original,fileName:'TEAM.001'}}};
vm.runInNewContext(source,ctx,{timeout:3000});
const fresh=()=>({previewBytes:candidate.slice(),playerChanges:allPlayers.map(x=>({...x})),clubChanges:allClubs,clubsMapped:92});
const preview=fresh();
const res=ctx.applyEnglandGameplayRebuild(preview);
assert.equal(res.skillsRebuilt,1472);
assert.equal(res.oldPlayerSkillsReused,0);
assert.equal(res.oldPlayerValuesReused,0);
assert.ok(Number.isInteger(preview.changedBytes)&&preview.changedBytes>0);
assert.equal(preview.changedBytes,preview.previewBytes.reduce((n,v,i)=>n+(v!==original[i]?1:0),0),'Export diff guard needs the FINAL number of changed bytes');
assert.equal(res.sourceValueCount,1234);
assert.equal(res.placeholderValueCount,238);
assert.equal(res.players.length,1472);
assert.equal(Object.keys(res.clubs).length,92);
assert.ok(res.players.every(p=>p.ratings.every(x=>Number.isInteger(x)&&x>=0&&x<=7)));
assert.ok(res.players.filter(p=>p.valueSource==='gameplay_placeholder').every(p=>p.marketValueM===null));
assert.ok(res.players.find(p=>p.player==='Declan Rice')?.valueSource==='published_source');
assert.ok(res.players.find(p=>p.player==='Alfie McNally')?.valueSource==='gameplay_placeholder');
assert.deepEqual(original,bytes,'The input original must remain byte-identical after model');
for(let i=0;i<master.clubs.length;i++){
 const c=master.clubs[i];
 for(let j=0;j<16;j++){
  const o=HEADER_SIZE+i*TEAM_RECORD_SIZE+T.players+j*PLAYER_RECORD_SIZE;
  const got=ctx.gameplayReadSkills(preview.previewBytes,o);
  assert.equal(got.length,7);assert.ok(got.every(n=>n>=0&&n<=7));
  assert.equal(preview.previewBytes[o+P.passing]&0xF0,0xA0,'Upper passing nibble must be untouched');
  assert.equal(preview.previewBytes[o+P.multi]&31,11,'Appearance/low position flags preserved');
  assert.notEqual(preview.previewBytes[o+P.value],44,'All legacy unrelated values replaced');
 }
}
const preview2=fresh();
ctx.applyEnglandGameplayRebuild(preview2);
assert.deepEqual(preview.previewBytes,preview2.previewBytes,'Same input must always produce the same candidate');
assert.throws(()=>ctx.gameplayRatings(['Bad',3,null,null,null,null,null],5,3),/division/);
assert.throws(()=>ctx.gameplayRatings(['Bad',9,null,null,null,null,null],0,9),/position/);
assert.throws(()=>ctx.gameplayEncodeSkills(new Uint8Array(40),0,[9,3,4,5,3,4,7]),/Unsafe/);
const wrong=fresh();
wrong.playerChanges[0].slot=2;
assert.throws(()=>ctx.applyEnglandGameplayRebuild(wrong),/Player order differs|Duplicate game slot/);
const tampered=fresh();
tampered.previewBytes[HEADER_SIZE+T.players+P.name]=90;
assert.throws(()=>ctx.applyEnglandGameplayRebuild(tampered),/Player order differs/);
const partial=fresh();partial.playerChanges.pop();
assert.throws(()=>ctx.applyEnglandGameplayRebuild(partial),/1,472/);
const boosted=ctx.gameplayRatings(['Forward',7,5,1400,16,8,24],1,7);
const baseline=ctx.gameplayRatings(['Forward',7,5,1400,0,0,24],1,7);
assert.ok(boosted.levels[6]>=baseline.levels[6],'Goal impact should be non-negative');
assert.ok(boosted.levels[0]>=baseline.levels[0],'Assists impact should be non-negative');
assert.equal(ctx.gameplayRatings(['Unnamed',7,null,null,null,null,null],2,7).valueStatus,'gameplay_placeholder');
console.log('SWOS v1.36 full game rehearsal: deterministic 1,472/1,472 skills, 1,234 sourced values, 238 labelled gameplay placeholders, no inherited player ratings or fees; bytes and mapping regression tests passed.');
