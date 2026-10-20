import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const html=fs.readFileSync('dist/index.html','utf8');
const client=fs.readFileSync('scripts/test-pack-client.js','utf8');
assert.ok(html.includes('<title>SWOS Studio v1.37.0</title>'));
assert.ok(html.includes('id="exportSwosTestZip"'));
assert.ok(html.includes('id="pickSwosCopiedTeam"'));
assert.ok(html.includes('id="exportSwosTestReport"'));
assert.ok(html.includes('swosGameTestHtml()'));
assert.ok(!html.includes('id="installSeasonUpdate"'),'Do not unlock the original installer');
const digest=async bytes=>createHash('sha256').update(bytes).digest('hex');
const byteEqual=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const original=new Uint8Array([0,92,1,2,3,4,5,6]);
const candidate=new Uint8Array([0,92,1,2,3,4,5,9]);
const originalFile={name:'TEAM.005'};
const info={
 original:originalFile,bytes:original,
 preview:{previewBytes:candidate,gameplayReport:{
  skillsRebuilt:1472,sourceValueCount:1234,placeholderValueCount:238,
  linkedValueCount:599,unlinkedValueCount:635
 }},
 check:{topFourClubs:92,divisionCounts:[20,24,24,24],categories:{playerName:20,skills:200}}
};
const ctx={
 Uint8Array,TextEncoder,TextDecoder,DataView,Error,Map,Set,String,Number,Array,Math,console,
 englandSha256:digest,checkedEnglandRehearsal:async()=>info,byteEqual,
 downloadEnglandRehearsalBytes:()=>{throw Error('Do not download during tests')},
 parseTeamFileBytes:bytes=>({teams:Array.from({length:92},(_,i)=>({division:i<20?0:i<44?1:i<68?2:3}))}),
 seasonUpdateState:{},
 esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'),
};
vm.runInNewContext(client,ctx,{timeout:3000});
assert.equal(typeof ctx.swosTestZip,'function');
assert.equal(ctx.swosZipCrc32(new TextEncoder().encode('123456789')),0xcbf43926);
assert.throws(()=>ctx.swosTestZip([{path:'../evil',data:'x'}]),/Unsafe/);
assert.throws(()=>ctx.swosTestZip([{path:'/bad',data:'x'}]),/Unsafe/);
assert.throws(()=>ctx.swosTestZip([{path:'okay',data:'x'},{path:'okay',data:'y'}]),/Unsafe/);
const pack=await ctx.swosPrepareTestPack(info);
assert.ok(pack.bytes.length>original.length+candidate.length);
assert.equal(pack.manifest.original.sha256,await digest(original));
assert.equal(pack.manifest.candidate.sha256,await digest(candidate));
assert.equal(pack.manifest.gameTested,false);
assert.equal(pack.manifest.gameExecutableIncluded,false);
assert.equal(pack.manifest.players,1472);
assert.equal(pack.files.length,6);
let cursor=0;
const view=new DataView(pack.bytes.buffer);
const found={};
for(const entry of pack.files){
 assert.equal(view.getUint32(cursor,true),0x04034b50,'ZIP local file header');
 assert.equal(view.getUint16(cursor+8,true),0,'ZIP must store bytes without compression');
 const checksum=view.getUint32(cursor+14,true),bytes=view.getUint32(cursor+18,true);
 const nameLength=view.getUint16(cursor+26,true),extra=view.getUint16(cursor+28,true);
 const name=new TextDecoder().decode(pack.bytes.slice(cursor+30,cursor+30+nameLength));
 const contents=pack.bytes.slice(cursor+30+nameLength+extra,cursor+30+nameLength+extra+bytes);
 assert.equal(name,entry.path);assert.equal(checksum,ctx.swosZipCrc32(contents));
 assert.deepEqual(contents,entry.data instanceof Uint8Array?entry.data:new TextEncoder().encode(entry.data));
 found[name]=contents;cursor+=30+nameLength+extra+bytes;
}
assert.equal(view.getUint32(cursor,true),0x02014b50,'ZIP central directory exists');
assert.ok(found['CANDIDATE-TEST-COPY-ONLY/TEAM.005']);
assert.ok(found['BACKUP-ORIGINAL-KEEP-SAFE/TEAM.005']);
assert.ok(new TextDecoder().decode(found['READ_ME_FIRST.txt']).includes('NEVER overwrite the original'));
assert.ok(new TextDecoder().decode(found['CHECKSUMS-SHA256.txt']).includes(await digest(candidate)));
function picked(name,bytes){return{name,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}}
const exact=await ctx.swosCheckTestCopyFile(picked('TEAM.005',candidate));
assert.equal(exact.status,'EXACT_CANDIDATE');
assert.equal(exact.actualSha256,await digest(candidate));
assert.equal(exact.topFourClubs,92);
assert.deepEqual(exact.divisionCounts,[20,24,24,24]);
const old=await ctx.swosCheckTestCopyFile(picked('TEAM.005',original));
assert.equal(old.status,'ORIGINAL_UNCHANGED');
assert.equal((await ctx.swosCheckTestCopyFile(picked('TEAM.009',candidate))).status,'WRONG_FILE');
const corrupt=candidate.slice();corrupt[7]++;
const broken=await ctx.swosCheckTestCopyFile(picked('TEAM.005',corrupt));
assert.equal(broken.status,'WRONG_FILE');
assert.ok(broken.firstMismatchingOffsets.includes(7));
assert.equal((await ctx.swosCheckTestCopyFile(picked('TEAM.005',new Uint8Array([1])))).status,'WRONG_FILE');
const htmlPart=ctx.swosGameTestHtml();
assert.ok(htmlPart.includes('Not checked'));
assert.equal((htmlPart.match(/data-swos-test="/g)||[]).length,6);
assert.ok(!htmlPart.includes('checked="checked"'));
assert.deepEqual(original,new Uint8Array([0,92,1,2,3,4,5,6]),'Original buffer unchanged');
console.log('SWOS v1.37 test package: valid ZIP headers/CRC/6 members, checksum manifests, correct TEAM filename, copy-only safety instructions, candidate/original/mismatch checks, 6 unticked manual QA criteria.');
