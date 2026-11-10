import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const core=fs.readFileSync('dist/game-qa-core.js','utf8');
const html=fs.readFileSync('dist/game-qa.html','utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(js,'Game QA controller script missing');
assert.doesNotThrow(()=>new vm.Script(core));
assert.doesNotThrow(()=>new vm.Script(js[1]));
const context={Uint8Array,DataView,TextDecoder,TextEncoder,Error,Map,Set,Array,Number,String,Math};
const qa=vm.runInNewContext(core+'\nSwosQaCore',context,{timeout:3000});
assert.equal(qa.CHECKS.length,6);
const makeTeam=()=>{
 const arr=new Uint8Array(2+100*684);
 arr[0]=0;arr[1]=100;
 for(let i=0;i<100;i++)arr[2+i*684+25]=i<20?0:i<44?1:i<68?2:i<92?3:4;
 return arr;
};
const team=makeTeam();
assert.equal(qa.inspectTeam(team).topFourClubs,92);
assert.equal(qa.inspectTeam(team).divisionCounts.join(','),'20,24,24,24');
const bad=team.slice();bad[2+24*684+25]=0;
assert.throws(()=>qa.inspectTeam(bad),/division/i);
assert.throws(()=>qa.inspectTeam(team.slice(0,-1)),/length/);
const hash=b=>createHash('sha256').update(b).digest('hex');
const original=team.slice();original[3]=5;
const candidate=team.slice();candidate[3]=6;
const manifest={format:'SWOS_STUDIO_2026_27_TEST_ONLY',schemaVersion:1,filename:'TEAM.005',
 gameTested:false,gameExecutableIncluded:false,originalUnmodified:true,players:1472,topFourClubs:92,divisionCounts:[20,24,24,24],
 original:{sha256:hash(original),size:original.length},candidate:{sha256:hash(candidate),size:candidate.length}};
assert.equal(qa.validateManifest(manifest).filename,'TEAM.005');
assert.throws(()=>qa.validateManifest({...manifest,gameTested:true}),/protected/);
assert.throws(()=>qa.validateManifest({...manifest,players:1473}),/league shape/);
assert.throws(()=>qa.validateManifest({...manifest,candidate:{sha256:hash(original),size:candidate.length}}),/checksums/);
function zip(parts){
 const entries=[];let len=0;
 for(const [name,bytes] of parts){
  const nb=new TextEncoder().encode(name),data=bytes instanceof Uint8Array?bytes:new TextEncoder().encode(bytes);
  entries.push({nb,data,at:len});len+=30+nb.length+data.length;
 }
 let central=0;for(const e of entries)central+=46+e.nb.length;
 const result=new Uint8Array(len+central+22),view=new DataView(result.buffer);let p=0;
 const w16=x=>{view.setUint16(p,x,true);p+=2},w32=x=>{view.setUint32(p,x,true);p+=4},wraw=x=>{result.set(x,p);p+=x.length};
 for(const e of entries){w32(0x04034b50);w16(20);w16(0x800);w16(0);w16(0);w16(0);w32(0);w32(e.data.length);w32(e.data.length);w16(e.nb.length);w16(0);wraw(e.nb);wraw(e.data)}
 const start=p;
 for(const e of entries){w32(0x02014b50);w16(20);w16(20);w16(0x800);w16(0);w16(0);w16(0);w32(0);w32(e.data.length);w32(e.data.length);w16(e.nb.length);w16(0);w16(0);w16(0);w16(0);w32(0);w32(e.at);wraw(e.nb)}
 w32(0x06054b50);w16(0);w16(0);w16(entries.length);w16(entries.length);w32(p-start);w32(start);w16(0);
 return result;
}
const files=[
 ['READ_ME_FIRST.txt','Do not overwrite the original'],
 ['CANDIDATE-TEST-COPY-ONLY/TEAM.005',candidate],
 ['BACKUP-ORIGINAL-KEEP-SAFE/TEAM.005',original],
 ['manifest.json',JSON.stringify(manifest)],
 ['CHECKSUMS-SHA256.txt',hash(original)+' '+hash(candidate)],
 ['GAME-TEST-CHECKLIST.json','[]']
];
const pack=zip(files);
const parsed=qa.parseZip(pack);
assert.equal(parsed.manifest.players,1472);
assert.deepEqual([...parsed.candidate],[...candidate]);
assert.deepEqual([...parsed.original],[...original]);
assert.throws(()=>qa.parseZip(new Uint8Array([1,2,3])),/Invalid/);
assert.throws(()=>qa.parseZip(zip(files.slice(0,5))),/six-file/);
const statuses=Object.fromEntries(qa.CHECKS.map(x=>[x.key,'PASS']));
const complete={status:'EXACT_CANDIDATE'};
assert.equal(qa.assess(manifest,complete,statuses,true).userReportedComplete,true);
assert.equal(qa.assess(manifest,complete,{...statuses,match:'FAIL'},true).userReportedComplete,false);
assert.equal(qa.assess(manifest,complete,statuses,false).userReportedComplete,false);
assert.equal(qa.assess(manifest,null,statuses,true).userReportedComplete,false);
assert.equal(qa.assess(manifest,complete,statuses,true).blockers.length,0);
assert.ok(html.includes('localStorage')&&html.includes('crypto.subtle.digest')&&html.includes('Print test record'));
assert.ok(!html.includes('fetch('),'Local-only QA must not send files to a server');
const editor=fs.readFileSync('dist/index.html','utf8');
assert.ok(editor.includes('href="/game-qa.html"'));
assert.ok(editor.includes('id="exportSwosTestZip"'));
assert.ok(!editor.includes('id="installSeasonUpdate"'));
assert.ok(fs.readFileSync('dist/development-status.html','utf8').includes('href="/game-qa.html"'));
console.log('SWOS real-game workspace: ZIP integrity checks, local SHA-256, 92-club binary parsing, six manual QA gates, local state and blocked direct installation validated.');
