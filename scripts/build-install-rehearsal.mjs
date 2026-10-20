import fs from 'node:fs';
import vm from 'node:vm';

const file='dist/index.html';
const original=fs.readFileSync(file,'utf8');
const client=fs.readFileSync('scripts/install-rehearsal-client.js','utf8');
if(!original.includes('<title>SWOS Studio v1.34.0</title>'))throw new Error('v1.35 expected the existing v1.34 release.');
if(!client.includes('function auditEnglandRehearsal(')||!client.includes('SWOS_INSTALL_REHEARSAL_END'))
 throw new Error('Read-only rehearsal client missing.');
let html=original;
function replaceOnce(a,b,label){
 const count=html.split(a).length-1;
 if(count!==1)throw new Error('v1.35 anchor not unique for '+label+' (found '+count+')');
 html=html.replace(a,b);
}
replaceOnce('<title>SWOS Studio v1.34.0</title>','<title>SWOS Studio v1.35.0</title>','version');
replaceOnce('function installerPreviewHtml(){',client+'\n\n  function installerPreviewHtml(){','inject audit code');
replaceOnce('seasonUpdateState.installPreview=buildPremierInstallPreview()',
 'const candidate=buildPremierInstallPreview();\n      candidate.binarySafetyAudit=auditEnglandRehearsal(seasonUpdateState.english.bytes,candidate.previewBytes);\n      seasonUpdateState.installPreview=candidate',
 'audit during dry run');
replaceOnce('<button class="btn btn-green big section-gap" id="installSeasonUpdate">Install England 2026/27</button>',
 '<div class="notice error section-gap"><strong>Direct installation remains locked in v1.35.</strong><br>Real players currently inherit old SWOS skill bytes and unpublished values can inherit an unrelated player\\u0027s previous valuation. Rehearsal files are for testing on a COPY only; never overwrite the live GAME/DATA file with this candidate.</div>\n      <button class="btn big section-gap" disabled>Install into live TEAM file — locked until player-data quality + game testing pass</button>',
 'lock direct writer');
replaceOnce('<button class="btn btn-blue big section-gap" id="runInstallPreview">Build preview again</button>',
 '<button class="btn btn-blue big section-gap" id="exportRehearsalCandidate">Download candidate file (test COPY only)</button>\n      <button class="btn btn-blue big section-gap" id="exportRehearsalOriginal">Download exact original backup</button>\n      <button class="btn btn-blue big section-gap" id="exportRehearsalReport">Download SHA-256 + player-change audit JSON</button>\n      <button class="btn btn-blue big section-gap" id="runInstallPreview">Build preview again</button>',
 'add safe exports');
replaceOnce('<strong>Automatic rollback protection is armed.</strong><br>Install stores the untouched England TEAM file in Studio before writing, verifies the write byte-for-byte, then re-parses the installed database. If the source file changed since this preview, installation stops safely.',
 '<strong>Rehearsal only — your original TEAM file stays untouched.</strong><br>Export a separately named candidate, an exact original backup, and a hash-verified audit report. These do NOT install into SWOS. The app rechecks that your source file has not changed before every export.',
 'accurate release language');
replaceOnce('    const installSeason=document.getElementById("installSeasonUpdate");',
 '    for(const pair of [["exportRehearsalCandidate",exportEnglandCandidate],["exportRehearsalOriginal",exportEnglandOriginalCopy],["exportRehearsalReport",exportEnglandRehearsalReport]]){\n      const btn=document.getElementById(pair[0]);\n      if(btn)btn.onclick=async()=>{\n        btn.disabled=true;\n        try{await pair[1]()}catch(e){alert("Rehearsal export stopped: "+e.message)}\n        finally{btn.disabled=false}\n      };\n    }\n    const installSeason=document.getElementById("installSeasonUpdate");',
 'wire read-only exports');
if(html.includes('id="installSeasonUpdate"'))throw new Error('Live install control is still in generated HTML.');
const scripts=html.split('<script>').slice(1).map(s=>s.split('</script>')[0]).filter(s=>s.includes('const TEAM_RECORD_SIZE='));
if(scripts.length!==1)throw new Error('Missing original SWOS application script.');
new vm.Script(scripts[0],{filename:'dist/index.html'});
fs.writeFileSync(file,html);
console.log('SWOS v1.35: binary byte-scope guard + 3 read-only rehearsal exports; live file write remains locked.');
