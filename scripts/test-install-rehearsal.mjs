import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('scripts/install-rehearsal-client.js','utf8');
const html=fs.readFileSync('dist/index.html','utf8');
assert.ok(html.includes('SWOS Studio v1.35.0'));
assert.ok(html.includes('id="exportRehearsalCandidate"'));
assert.ok(html.includes('id="exportRehearsalOriginal"'));
assert.ok(html.includes('id="exportRehearsalReport"'));
assert.ok(!html.includes('id="installSeasonUpdate"'),'Unsafe live install button must remain absent.');
assert.ok(html.includes('candidate.binarySafetyAudit=auditEnglandRehearsal('));
assert.ok(html.includes('original file stays untouched'));
const TEAM_RECORD_SIZE=684,PLAYER_RECORD_SIZE=38,PLAYERS_PER_TEAM=16,HEADER_SIZE=2;
const T={name:5,nameLength:19,tactic:24,division:25,homeKit:26,awayKit:31,order:60,players:76};
const P={nationality:0,shirt:2,name:3,nameLength:23,multi:26,passing:28,shootHead:29,value:32};
const count=100;
function makeOriginal(){
 const bytes=new Uint8Array(HEADER_SIZE+count*TEAM_RECORD_SIZE);
 bytes[0]=count>>8;bytes[1]=count&255;
 for(let idx=0;idx<count;idx++){
  const off=HEADER_SIZE+TEAM_RECORD_SIZE*idx;
  const text='CLUB'+String(idx).padStart(3,'0');
  for(let i=0;i<text.length;i++)bytes[off+T.name+i]=text.charCodeAt(i);
  bytes[off+T.division]=idx<20?0:idx<44?1:idx<68?2:idx<92?3:4;
 }
 return bytes;
}
function validateTeam(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<2)throw Error('invalid TEAM data');
 const teams=(bytes[0]<<8)|bytes[1];
 if(!teams||bytes.length!==HEADER_SIZE+teams*TEAM_RECORD_SIZE)throw Error('bad TEAM header or length');
 return teams;
}
function parseTeamFileBytes(bytes){
 const teams=validateTeam(bytes);
 return{teams:Array.from({length:teams},(_,index)=>{
  const off=HEADER_SIZE+index*TEAM_RECORD_SIZE;
  let name='';for(let i=0;i<T.nameLength;i++){const c=bytes[off+T.name+i];if(!c)break;name+=String.fromCharCode(c)}
  return{index,name,division:bytes[off+T.division]};
 })};
}
const structure={clubs:Array.from({length:92},(_,i)=>({id:'club'+i,name:'Club '+i}))};
const mapping=Object.fromEntries(structure.clubs.map((c,i)=>[c.id,{teamIndex:i,method:i===0?'reused':'exact'}]));
const sandbox={Uint8Array,Map,Set,Math,Number,String,Array,Error,console,
 HEADER_SIZE,TEAM_RECORD_SIZE,PLAYER_RECORD_SIZE,PLAYERS_PER_TEAM,T,P,
 validateTeam,parseTeamFileBytes,normalizeClubName:s=>String(s).trim().toUpperCase(),
 ENGLAND_2627_STRUCTURE:structure,seasonUpdateState:{mapping,english:{fileName:'TEAM.005'}}};
vm.runInNewContext(source,sandbox,{timeout:1500});
const audit=sandbox.auditEnglandRehearsal;
assert.equal(typeof audit,'function');
const before=makeOriginal(),after=before.slice();
const head=HEADER_SIZE;
after[head+T.name]=88; // only reused club-name slots may be renamed
after[head+T.players+P.name]=65; // safe player identity write
after[head+T.players+P.multi]=32; // position upper bits, low bits unchanged
after[head+T.players+P.nationality]=4;
after[head+T.players+P.shirt]=9;
after[head+T.players+P.value]=30;
after[head+T.order]=8;
after[head+T.division]=1;
after[head+20*TEAM_RECORD_SIZE+T.division]=0;
const valid=audit(before,after);
assert.equal(valid.topFourClubs,92);
assert.equal(valid.allowedSlots,92);
assert.equal(valid.categories.playerName,1);
assert.equal(valid.categories.position,1);
assert.equal(valid.categories.value,1);
assert.equal(valid.categories.selectionOrder,1);
assert.equal(valid.categories.clubName,1);
assert.equal(valid.categories.division,2);
assert.equal(valid.changedBytes,9);
assert.equal(before[head+T.players+P.name],0,'Dry run must not mutate the original.');

function shouldBlock(label,offset,value){
 const corrupted=after.slice();corrupted[offset]=value;
 assert.throws(()=>audit(before,corrupted),/blocked|failed|changed|invalid|unique|TEAM|divisions|Preview/i,label);
}
shouldBlock('old player skill data',head+T.players+P.passing,67);
shouldBlock('away kit corruption',head+T.awayKit,5);
shouldBlock('unmapped team player edited',head+99*TEAM_RECORD_SIZE+T.players+P.name,77);
shouldBlock('player low-bit corruption',head+T.players+P.multi,33);
shouldBlock('unexpected club rename',head+TEAM_RECORD_SIZE+T.name,66);
const doubled={...mapping,club1:{teamIndex:0,method:'exact'}};
sandbox.seasonUpdateState.mapping=doubled;
assert.throws(()=>audit(before,after),/same TEAM slot/);
sandbox.seasonUpdateState.mapping=mapping;
assert.throws(()=>audit(before,before),/separate byte-array/);
assert.throws(()=>audit(before,after.slice(0,-1)),/header|length/i);
const noChanges=before.slice();
assert.throws(()=>audit(before,noChanges),/identical/);
console.log('SWOS install rehearsal: 92 clubs verified; safe field edits allowed; old skills, kits, mapped slots, flags, header and byte length protected; direct live writer locked.');
