import fs from 'node:fs';
import vm from 'node:vm';
const file='dist/index.html',base=fs.readFileSync(file,'utf8');
const client=fs.readFileSync('scripts/test-pack-client.js','utf8');
if(!base.includes('<title>SWOS Studio v1.36.0</title>'))throw Error('Test pack expects v1.36');
if(!client.includes('SWOS_TEST_PACK_V137_END'))throw Error('Missing test-pack helper');
let html=base;
function once(a,b,label){const count=html.split(a).length-1;if(count!==1)throw Error('v1.37 '+label+' anchor count '+count);html=html.replace(a,b);}
once('<title>SWOS Studio v1.36.0</title>','<title>SWOS Studio v1.37.0</title>','title');
once("document.title='SWOS Studio v1.36.0';","document.title='SWOS Studio v1.37.0';",'runtime title');
once('  function installerPreviewHtml(){',client+'\n  function installerPreviewHtml(){','inject read-only ZIP functionality');
once("installerPreviewHtml():''}","installerPreviewHtml()+(seasonUpdateState.installPreview?swosGameTestHtml():''):''}",'append game test section');
const handlers=[
'    const swosTestZip=document.getElementById("exportSwosTestZip");',
'    if(swosTestZip)swosTestZip.onclick=async()=>{',
'      swosTestZip.disabled=true;',
'      try{await swosExportTestZip()}catch(e){alert("Test package stopped: "+e.message)}',
'      finally{swosTestZip.disabled=false}',
'    };',
'    const swosCopiedInput=document.getElementById("pickSwosCopiedTeam");',
'    if(swosCopiedInput)swosCopiedInput.onchange=async()=>{',
'      const selected=swosCopiedInput.files&&swosCopiedInput.files[0];',
'      if(selected)await swosCheckPickedTestFile(selected);',
'    };',
'    document.querySelectorAll("[data-swos-test]").forEach(box=>{',
'      box.onchange=()=>{swosQa().checks[box.dataset.swosTest]=!!box.checked};',
'    });',
'    const swosNotes=document.getElementById("swos-test-notes");',
'    if(swosNotes)swosNotes.oninput=()=>{swosQa().notes=swosNotes.value};',
'    const swosTestReport=document.getElementById("exportSwosTestReport");',
'    if(swosTestReport)swosTestReport.onclick=async()=>{',
'      swosTestReport.disabled=true;',
'      try{await swosExportTestReport()}catch(e){alert("Game test report stopped: "+e.message)}',
'      finally{swosTestReport.disabled=false}',
'    };'
].join('\n');
once('    const installPreview=document.getElementById("runInstallPreview");',handlers+'\n    const installPreview=document.getElementById("runInstallPreview");','wire test UI');
if(html.includes('id="installSeasonUpdate"'))throw Error('Original installation enabled unexpectedly');
if(!html.includes('id="exportSwosTestZip"')||!html.includes('SWOS_TEST_PACK_V137_END'))
 throw Error('Game test pack not inserted');
const scripts=html.split('<script>').slice(1).map(x=>x.split('</script>')[0]).filter(x=>x.includes('const TEAM_RECORD_SIZE='));
if(scripts.length!==1)throw Error('Failed to locate one SWOS application script');
new vm.Script(scripts[0],{filename:file});
fs.writeFileSync(file,html);
console.log('SWOS v1.37: copy-only ZIP and exact copied TEAM checksum validator added; 6 user-observed game QA checks; original file install still locked.');
