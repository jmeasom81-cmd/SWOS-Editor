/* SWOS QA core v1: local-only file inspection and non-automated release evidence. */
const SwosQaCore=(()=>{
 'use strict';
 const CHECKS=[
  {key:'duplicate',label:'I made a separate copy of my entire working SWOS GAME folder',help:'Keep the original game folder and existing careers untouched.'},
  {key:'profile',label:'Magic DOSBox uses a different profile pointing at the copied game',help:'The live/original Magic DOSBox profile must still point to the original.'},
  {key:'divisions',label:'I saw all four divisions with 20 / 24 / 24 / 24 clubs',help:'Inspect the in-game club lists, not only the imported TEAM file.'},
  {key:'players',label:'I checked updated names, shirt numbers and positions at three clubs',help:'Check at least one club from each of three different divisions.'},
  {key:'match',label:'I played a full test match without crashes or broken teams',help:'Record the two clubs and note any problems seen during play.'},
  {key:'career',label:'I created, saved, closed and reopened a NEW test career',help:'Do not use an existing personal career save for this test.'}
 ];
 function requireBytes(input){if(!(input instanceof Uint8Array))throw Error('Expected binary file bytes');return input;}
 function isSha(s){return typeof s==='string'&&/^[a-f0-9]{64}$/i.test(s);}
 function validateManifest(m){
  if(!m||typeof m!=='object'||m.format!=='SWOS_STUDIO_2026_27_TEST_ONLY'||m.schemaVersion!==1)throw Error('Not a supported SWOS Studio v1.37 test manifest');
  if(!/^TEAM\.\d{1,5}$/i.test(m.filename||''))throw Error('Manifest must name an England TEAM.nnn file');
  if(!isSha(m.original?.sha256)||!isSha(m.candidate?.sha256)||m.original.sha256.toLowerCase()===m.candidate.sha256.toLowerCase())throw Error('Invalid or identical source and candidate checksums');
  if(!Number.isSafeInteger(m.candidate.size)||m.candidate.size<2000||m.candidate.size>12000000)throw Error('Invalid candidate size');
  if(!Number.isSafeInteger(m.original.size)||m.original.size<2000||m.original.size>12000000)throw Error('Invalid original size');
  if(m.gameTested!==false||m.gameExecutableIncluded!==false||m.originalUnmodified!==true)throw Error('This is not a protected copy-only test pack');
  if(m.players!==1472||m.topFourClubs!==92||!Array.isArray(m.divisionCounts)||m.divisionCounts.join(',')!=='20,24,24,24')throw Error('Unexpected 2026/27 league shape');
  return m;
 }
 function parseZip(input){
  const bytes=requireBytes(input);
  if(bytes.length<50||bytes.length>12000000)throw Error('Invalid or excessively large test ZIP');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const decoder=new TextDecoder();
  const entries=new Map();
  let at=0,foundCentral=false;
  for(let i=0;i<32;i++){
   if(at+4>bytes.length)break;
   const sig=view.getUint32(at,true);
   if(sig===0x02014b50){foundCentral=true;break;}
   if(sig!==0x04034b50)throw Error('Unexpected ZIP header');
   if(at+30>bytes.length)throw Error('Truncated ZIP entry');
   const flags=view.getUint16(at+6,true),method=view.getUint16(at+8,true);
   const compressed=view.getUint32(at+18,true),raw=view.getUint32(at+22,true);
   const pathLen=view.getUint16(at+26,true),extraLen=view.getUint16(at+28,true);
   if(method!==0||compressed!==raw||(flags&0x08))throw Error('Only the uncompressed SWOS test ZIP is accepted');
   const begin=at+30+pathLen+extraLen,end=begin+raw;
   if(begin>bytes.length||end>bytes.length)throw Error('Truncated ZIP payload');
   const name=decoder.decode(bytes.subarray(at+30,at+30+pathLen));
   if(!name||name.startsWith('/')||name.includes('\\')||name.split('/').some(s=>s===''||s==='.'||s==='..')||entries.has(name))throw Error('Unsafe or duplicate ZIP member');
   entries.set(name,bytes.slice(begin,end));at=end;
  }
  if(!foundCentral||entries.size!==6)throw Error('Expected the six-file SWOS test package');
  const json=entries.get('manifest.json');if(!json)throw Error('Missing manifest.json');
  let manifest;try{manifest=validateManifest(JSON.parse(decoder.decode(json)))}catch(e){throw Error('Manifest: '+e.message)}
  const candidate=entries.get('CANDIDATE-TEST-COPY-ONLY/'+manifest.filename);
  const original=entries.get('BACKUP-ORIGINAL-KEEP-SAFE/'+manifest.filename);
  if(!candidate||!original)throw Error('ZIP is missing original or candidate file');
  if(candidate.length!==manifest.candidate.size||original.length!==manifest.original.size)throw Error('ZIP TEAM file size disagrees with manifest');
  if(!entries.has('READ_ME_FIRST.txt')||!entries.has('CHECKSUMS-SHA256.txt')||!entries.has('GAME-TEST-CHECKLIST.json'))throw Error('Missing test-pack instructions or checks');
  return {manifest,candidate,original};
 }
 function inspectTeam(input){
  const bytes=requireBytes(input);
  if(bytes.length<2)throw Error('Invalid TEAM header');
  const count=(bytes[0]<<8)|bytes[1],teamBytes=684;
  if(count<92||count>300||bytes.length!==2+count*teamBytes)throw Error('Invalid England TEAM file length / club count');
  const divisions=[0,0,0,0];
  for(let i=0;i<count;i++){
   const d=bytes[2+i*teamBytes+25];
   if(d<4)divisions[d]++;
  }
  if(divisions.join(',')!=='20,24,24,24')throw Error('Four English division sizes do not match 20/24/24/24');
  return {totalTeams:count,topFourClubs:divisions.reduce((a,b)=>a+b,0),divisionCounts:divisions};
 }
 function assess(manifest,fileCheck,steps,packageChecked){
  const blockers=[];
  if(!manifest)blockers.push('Import a SWOS test ZIP');
  else if(!packageChecked)blockers.push('Import and verify the original SWOS ZIP, not only a loose manifest');
  if(!fileCheck||fileCheck.status!=='EXACT_CANDIDATE')blockers.push('Verify the candidate TEAM file inside your copied GAME/DATA');
  for(const step of CHECKS){
   const v=steps&&steps[step.key];
   if(v!=='PASS')blockers.push(step.label+(v==='FAIL'?' (reported failed)':' (not completed)'));
  }
  return {userReportedComplete:blockers.length===0,blockers};
 }
 return {CHECKS,validateManifest,parseZip,inspectTeam,assess};
})();