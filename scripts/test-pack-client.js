/* SWOS_TEST_PACK_V137 — entirely read-only, standalone copy-only testing */
const SWOS_TEST_CHECKS=[
 ['duplicate','I made a separate copy of my entire SWOS GAME folder'],
 ['profile','Magic DOSBox is pointed at the COPY, not the original'],
 ['divisions','I checked the four divisions: 20 / 24 / 24 / 24 clubs'],
 ['players','I checked updated players at three different clubs'],
 ['match','I played a test match through to full time'],
 ['career','I created, saved and reopened a NEW test career']
];
function swosZipBytes(v){if(v instanceof Uint8Array)return v;if(typeof v==='string')return new TextEncoder().encode(v);throw Error('ZIP requires bytes or text')}
function swosZipCrc32(data){let x=0xFFFFFFFF;for(const b of data){x^=b;for(let i=0;i<8;i++)x=(x>>>1)^((x&1)?0xEDB88320:0)}return(x^0xFFFFFFFF)>>>0}
function swosTestZip(entries){
 if(!Array.isArray(entries)||!entries.length||entries.length>32)throw Error('Invalid ZIP file count');
 const members=[],names=new Set();let localSize=0,centralSize=0;
 for(const entry of entries){
  const name=entry.path;
  if(typeof name!=='string'||!name||name.startsWith('/')||name.includes('\\')||
     name.split('/').some(x=>!x||x==='.'||x==='..')||names.has(name))throw Error('Unsafe ZIP member path');
  names.add(name);
  const path=new TextEncoder().encode(name),data=swosZipBytes(entry.data);
  if(path.length>65535||data.length>0xFFFFFFFF)throw Error('ZIP member too large');
  members.push({path,data,crc:swosZipCrc32(data),offset:localSize});
  localSize+=30+path.length+data.length;centralSize+=46+path.length;
 }
 const out=new Uint8Array(localSize+centralSize+22),view=new DataView(out.buffer);let n=0;
 const w16=x=>{view.setUint16(n,x,true);n+=2};
 const w32=x=>{view.setUint32(n,x>>>0,true);n+=4};
 const raw=x=>{out.set(x,n);n+=x.length};
 for(const e of members){
  w32(0x04034b50);w16(20);w16(0x800);w16(0);w16(0);w16(0);
  w32(e.crc);w32(e.data.length);w32(e.data.length);w16(e.path.length);w16(0);
  raw(e.path);raw(e.data);
 }
 const offset=n;
 for(const e of members){
  w32(0x02014b50);w16(20);w16(20);w16(0x800);w16(0);w16(0);w16(0);
  w32(e.crc);w32(e.data.length);w32(e.data.length);w16(e.path.length);w16(0);
  w16(0);w16(0);w16(0);w32(0);w32(e.offset);raw(e.path);
 }
 w32(0x06054b50);w16(0);w16(0);w16(members.length);w16(members.length);
 w32(n-offset);w32(offset);w16(0);
 if(n!==out.length)throw Error('Bad ZIP final size');
 return out;
}
function swosTestInstructions(name){
 return [
  'SWOS 2026/27 — TEST COPY ONLY — READ THIS BEFORE USING',
  '',
  'This ZIP is NOT a complete game. It contains only the England TEAM update.',
  'NEVER overwrite the original GAME/DATA directory or existing careers.',
  '',
  '1. Close Magic DOSBox and make a separate COPY of the WHOLE working GAME folder.',
  '2. Use a file manager to extract CANDIDATE-TEST-COPY-ONLY/'+name,
  '3. Replace only the England '+name+' file in your DUPLICATED GAME/DATA.',
  '4. The rest of the duplicated GAME files must already exist.',
  '5. In Magic DOSBox, use a DIFFERENT profile pointed at the duplicated GAME.',
  '6. Check the 20/24/24/24 leagues, selected squads, match play, and a NEW career.',
  '7. In SWOS Studio, choose Check copied TEAM file from the duplicated GAME/DATA.',
  '8. Record real-game outcomes using the checklist and download the results.',
  '',
  'BACKUP-ORIGINAL-KEEP-SAFE/ contains the original England TEAM bytes.',
  'CHECKSUMS-SHA256.txt and manifest.json hold SHA-256 file fingerprints.',
  'Matching file hashes prove identity, NOT that the game or emulator worked.',
  '',
  'LIMITATIONS: player abilities are provisional gameplay heuristics.',
  '238 unavailable market values have tagged GAMEPLAY placeholders.',
  '635 further recorded market values lack an individual direct source URL.',
  'In-game career, matches and kits have NOT been independently validated.',
  'The live original SWOS installation is never touched by the ZIP exporter.'
 ].join('\r\n');
}
async function swosPrepareTestPack(result){
 const name=result.original.name;
 if(!/^TEAM\.\d{1,5}$/i.test(name))throw Error('Expected real England TEAM.nnn filename, found '+name);
 const original=result.bytes,candidate=result.preview.previewBytes;
 const originalSha=await englandSha256(original),candidateSha=await englandSha256(candidate);
 const model=result.preview.gameplayReport;
 if(model?.skillsRebuilt!==1472||model?.sourceValueCount!==1234||model?.placeholderValueCount!==238)
  throw Error('Full 1,472-player rehearsal needed before making test pack');
 const manifest={format:'SWOS_STUDIO_2026_27_TEST_ONLY',schemaVersion:1,
  originalUnmodified:true,gameTested:false,gameExecutableIncluded:false,
  filename:name,topFourClubs:result.check.topFourClubs,
  divisionCounts:result.check.divisionCounts,players:1472,
  linkedValueCount:model.linkedValueCount,unlinkedValueCount:model.unlinkedValueCount,
  placeholders:model.placeholderValueCount,
  original:{sha256:originalSha,size:original.length},
  candidate:{sha256:candidateSha,size:candidate.length},
  allowedChangedBytes:result.check.categories,
  warning:'Do not extract over the original GAME folder. Duplicate GAME first.'
 };
 const files=[
  {path:'READ_ME_FIRST.txt',data:swosTestInstructions(name)},
  {path:'CANDIDATE-TEST-COPY-ONLY/'+name,data:candidate},
  {path:'BACKUP-ORIGINAL-KEEP-SAFE/'+name,data:original},
  {path:'manifest.json',data:JSON.stringify(manifest,null,2)},
  {path:'CHECKSUMS-SHA256.txt',data:originalSha+'  BACKUP-ORIGINAL-KEEP-SAFE/'+name+'\n'+candidateSha+'  CANDIDATE-TEST-COPY-ONLY/'+name+'\n'},
  {path:'GAME-TEST-CHECKLIST.json',data:JSON.stringify(SWOS_TEST_CHECKS.map(([key,label])=>({key,label,passed:false})),null,2)}
 ];
 return{bytes:swosTestZip(files),files,manifest};
}
async function swosExportTestZip(){
 const result=await checkedEnglandRehearsal();
 const pack=await swosPrepareTestPack(result);
 downloadEnglandRehearsalBytes(pack.bytes,'SWOS-2026-27-TEST-COPY-ONLY.zip','application/zip');
}
async function swosCheckTestCopyFile(file){
 const r=await checkedEnglandRehearsal();
 if(!file||typeof file.arrayBuffer!=='function')throw Error('Select a TEAM file from your duplicated GAME/DATA folder');
 const found=new Uint8Array(await file.arrayBuffer()),expected=r.preview.previewBytes;
 const filenameOK=file.name.toUpperCase()===r.original.name.toUpperCase();
 const byteMatch=byteEqual(found,expected)&&filenameOK;
 const isOriginal=byteEqual(found,r.bytes)&&filenameOK;
 const actualSha=await englandSha256(found),expectedSha=await englandSha256(expected);
 let physicalClubs=null,divisions=null,parseError=null;
 try{
  const db=parseTeamFileBytes(found,file.name);
  physicalClubs=db.teams.filter(t=>t.division<=3).length;
  divisions=[0,1,2,3].map(d=>db.teams.filter(t=>t.division===d).length);
 }catch(e){parseError=String(e.message||e)}
 const mismatches=[];
 if(found.length===expected.length&&!byteMatch)for(let i=0;i<found.length&&mismatches.length<8;i++)if(found[i]!==expected[i])mismatches.push(i);
 return{
  status:byteMatch?'EXACT_CANDIDATE':isOriginal?'ORIGINAL_UNCHANGED':'WRONG_FILE',
  name:file.name,filenameOK,size:found.length,expectedSize:expected.length,
  actualSha256:actualSha,expectedSha256:expectedSha,
  topFourClubs:physicalClubs,divisionCounts:divisions,parseError,
  firstMismatchingOffsets:mismatches,
  note:byteMatch?'Exact candidate file confirmed. This does NOT prove Magic DOSBox runs it.':
   isOriginal?'This is the UNCHANGED ORIGINAL. Candidate not found in this selected location.':
   'Not the expected candidate. Do not proceed with game testing until the files match.'
 };
}
async function swosCheckPickedTestFile(file){
 const el=document.getElementById('swos-test-file-status');
 if(el)el.textContent='Checking copied file and SHA-256…';
 try{
  const v=await swosCheckTestCopyFile(file);
  seasonUpdateState.swosTestFileVerification=v;
  if(el)el.textContent=(v.status==='EXACT_CANDIDATE'?'✓ ': '⚠ ')+v.note+
    '  File: '+v.name+'; '+v.size+' bytes; SHA-256 '+v.actualSha256.slice(0,16)+'…';
 }catch(e){
  seasonUpdateState.swosTestFileVerification=null;
  if(el)el.textContent='File check stopped: '+String(e.message||e);
 }
}
function swosQa(){return seasonUpdateState.swosQa||(seasonUpdateState.swosQa={checks:{},notes:''})}
function swosGameTestHtml(){
 const qa=swosQa();
 return '<div class="update-stage pending section-gap"><h3>8 · Test on a separate Magic DOSBox copy</h3>'+
  '<p class="about">Your original GAME stays unchanged. Export this self-contained TEST MATERIALS ZIP (not the full game), install the candidate into a duplicated GAME folder, and confirm its bytes below. A byte match is not gameplay validation.</p>'+
  '<button class="btn btn-green big section-gap" id="exportSwosTestZip">Download test-copy package (.zip)</button>'+
  '<div class="field section-gap"><label>Verify the actual England TEAM file in the duplicated GAME/DATA</label>'+
  '<input id="pickSwosCopiedTeam" type="file" style="max-width:100%" />'+
  '<div class="tiny section-gap" id="swos-test-file-status">Not checked. No game files are modified by this validator.</div></div>'+
  '<div class="stack section-gap">'+SWOS_TEST_CHECKS.map(([key,label])=>
  '<label style="display:flex;gap:9px;align-items:flex-start;margin:9px 0"><input type="checkbox" data-swos-test="'+key+'" '+
  (qa.checks[key]?'checked':'')+'/><span>'+esc(label)+'</span></label>').join('')+'</div>'+
  '<div class="field section-gap"><label>What worked / what failed?</label>'+
  '<textarea rows="3" maxlength="4000" id="swos-test-notes" placeholder="Write the club, screen and outcome of any issue">'+esc(qa.notes||'')+'</textarea></div>'+
  '<button class="btn btn-blue big section-gap" id="exportSwosTestReport">Download my test report (.json)</button>'+
  '<p class="tiny section-gap">Manual checklist only. Nothing here unlocks the original game installer.</p></div>';
}
async function swosExportTestReport(){
 const r=await checkedEnglandRehearsal(),qa=swosQa();
 const checks=SWOS_TEST_CHECKS.map(([key,label])=>({key,label,userReportedPassed:!!qa.checks[key]}));
 const report={
  kind:'SWOS_2026_27_REAL_GAME_USER_REPORT',schemaVersion:1,
  sourceFile:r.original.name,model:'v1.36',
  candidateSha256:await englandSha256(r.preview.previewBytes),
  copiedTeamFileVerification:seasonUpdateState.swosTestFileVerification||null,
  checks,allUserReportedPassed:checks.every(x=>x.userReportedPassed),
  notes:qa.notes||'',
  caution:'User-reported outcomes only. A file checksum match alone is not evidence of game compatibility.'
 };
 downloadEnglandRehearsalBytes(JSON.stringify(report,null,2),'SWOS-2026-27-MagicDOSBox-test-report.json','application/json');
}
/* SWOS_TEST_PACK_V137_END */