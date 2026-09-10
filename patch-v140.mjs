import fs from 'node:fs';

const FILE='dist/index.html';
const BUILD='v1.40.0';
if(!fs.existsSync(FILE))throw new Error('SWOS Studio v1.40.0 build failed: dist/index.html is missing.');
let html=fs.readFileSync(FILE,'utf8');
if(!html.includes('<title>SWOS Studio v1.39.0</title>'))throw new Error('SWOS Studio v1.40.0 build failed: expected v1.39.0 output was not found.');
html=html.replace('<title>SWOS Studio v1.39.0</title>','<title>SWOS Studio v1.40.0</title>');
html=html.replaceAll("var BUILD='v1.39.0';","var BUILD='v1.40.0';");

const start=html.indexOf('  async function chooseGameFolder(){');
const end=html.indexOf('\n  async function ensureGameFolder(){',start);
if(start<0||end<0)throw new Error('SWOS Studio v1.40.0 build failed: chooseGameFolder block not found.');
const replacement=`  async function scanNestedGameFolders(parentHandle){
    const root=await entriesOf(parentHandle),dirs=root.filter(x=>x.handle.kind==="directory"),found=[];
    for(const entry of dirs){
      try{const info=await scanGameFolder(entry.handle);if(info.looksValid)found.push({handle:entry.handle,info,parentName:parentHandle.name})}catch(e){}
    }
    return found
  }
  async function resolveGameFolderSelection(selectedHandle){
    const directInfo=await scanGameFolder(selectedHandle);
    if(directInfo.looksValid)return{handle:selectedHandle,info:directInfo,nested:false};
    const candidates=await scanNestedGameFolders(selectedHandle);
    if(candidates.length===1){
      const hit=candidates[0];hit.info.detectedFrom=selectedHandle.name;return{handle:hit.handle,info:hit.info,nested:true,parentName:selectedHandle.name}
    }
    if(candidates.length>1){
      const names=candidates.map(x=>x.info.folderName).join(", ");
      throw new Error("Studio found more than one SWOS installation inside "+selectedHandle.name+": "+names+". Choose the specific game folder you want to use.")
    }
    throw new Error("This does not look like a SWOS game folder, and Studio could not find one immediately inside it. Choose the folder that contains the SWOS EXE and DATA folder, such as SWOS1617.")
  }
  async function chooseGameFolder(){
    if(!directoryApiAvailable){alert("This browser cannot remember a whole SWOS folder. Use Chrome on Android, or continue with the individual file picker.");return false}
    try{
      const selected=await window.showDirectoryPicker({id:"swos-studio-game-folder",mode:"readwrite"});
      const selectedPermission=await getPermission(selected,true);if(selectedPermission!=="granted")throw new Error("Folder access was not granted.");
      const resolved=await resolveGameFolderSelection(selected),handle=resolved.handle,info=resolved.info;
      const p=await getPermission(handle,true);if(p!=="granted")throw new Error("Studio found the SWOS game folder but could not get permission to use it.");
      setup.handle=handle;setup.info=info;setup.permission="granted";setup.remembered=true;setup.checked=true;setup.error=null;
      await handleStoreSet(handle);await loadBackupStatus();
      if(resolved.nested)state.message="Found "+info.folderName+" automatically inside "+resolved.parentName+". SWOS Studio will remember the game folder itself from now on.";
      return true
    }catch(e){if(e?.name!=="AbortError")alert(e.message);return false}
  }`;
html=html.slice(0,start)+replacement+html.slice(end);

const oldHelp='Only select the main <strong>GAME</strong> folder. Studio finds the rest underneath it automatically — including the DATA folder and your .CAR careers.';
const newHelp='Select the SWOS game folder itself — for example <strong>SWOS1617</strong>. If you accidentally choose the folder immediately above it, Studio now checks one level down and can automatically connect a single valid SWOS installation. DATA is then found underneath and .CAR careers stay in the game folder.';
if(html.includes(oldHelp))html=html.replace(oldHelp,newHelp);

const oldConnected='<strong>${esc(info.folderName)} is connected</strong><span>SWOS Studio can use this folder directly.</span>';
const newConnected='<strong>${esc(info.folderName)} is connected</strong><span>${info.detectedFrom?`Found automatically inside ${esc(info.detectedFrom)}. `:""}SWOS Studio can use this folder directly.</span>';
if(html.includes(oldConnected))html=html.replace(oldConnected,newConnected);

const css=`\n<style id="swos-v140-folder-styles">\n  .folder-route-card{border:1px solid rgba(88,166,255,.5);background:rgba(88,166,255,.06);border-radius:12px;padding:12px;margin-top:12px}.folder-route{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:7px;margin-top:9px}.folder-route>div{border:1px solid var(--line);background:#07111f;border-radius:9px;padding:8px}.folder-route small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase}.folder-route b{display:block;font-size:10px;margin-top:3px}.folder-route .arrow{border:0;background:transparent;padding:0;color:var(--blue);font-weight:900}\n</style>`;
html=html.replace('</head>',css+'\n</head>');

const js=String.raw`\n<script id="swos-v140-folder-layer">\n(function(){\n  'use strict';\n  var BUILD='v1.40.0';\n  function addGuide(){\n    if(document.getElementById('v140-folder-guide'))return;\n    var actions=document.querySelector('.setup-actions');if(!actions)return;\n    var card=document.createElement('div');card.id='v140-folder-guide';card.className='folder-route-card';\n    card.innerHTML='<strong>📁 Where Studio puts things</strong><div class="about" style="margin-top:4px">Connect the game folder once. Studio keeps the two locations separate automatically.</div><div class="folder-route"><div><small>Game folder</small><b>SWOS1617 · careers (.CAR) · EXE</b></div><div class="arrow">→</div><div><small>Inside DATA</small><b>TEAM.* · POOLPLYR.DAT</b></div></div><div class="tiny" style="margin-top:8px">If you choose the parent folder by mistake, Studio now checks its immediate subfolders. One valid SWOS installation is connected automatically; multiple installs are listed so you can choose the right one.</div>';
    actions.insertAdjacentElement('beforebegin',card);\n  }\n  function releaseNotes(){\n    if(document.getElementById('v140-release-card'))return;\n    var anchor=document.getElementById('v139-release-card')||document.getElementById('v138-release-card');if(!anchor)return;\n    var card=document.createElement('div');card.id='v140-release-card';card.className='card stack v133-release-card';\n    card.innerHTML='<strong>New in v1.40.0 — Smarter SWOS folder setup</strong><span class="about">• Studio now recognises a valid game root by its SWOS EXE plus DATA folder, not by folder name alone.</span><span class="about">• If the selected folder is one level too high, Studio searches its immediate subfolders.</span><span class="about">• A single valid installation such as SWOS1617 is connected automatically and remembered directly.</span><span class="about">• If multiple SWOS installations are found, Studio names them and asks you to choose the specific one instead of guessing.</span><span class="about">• Setup now explains clearly that careers belong in the game folder while TEAM.* and POOLPLYR.DAT belong inside DATA.</span><span class="about">• No binary editing behaviour changed.</span>';\n    anchor.insertAdjacentElement('beforebegin',card);\n  }\n  function apply(){document.title='SWOS Studio '+BUILD;var badge=document.querySelector('#v133-build-status-panel .build-status-head>.feature-status.beta');if(badge)badge.textContent=BUILD;releaseNotes();if(document.querySelector('#chooseSetup,#reconnectHere,#refreshSetup'))addGuide();}\n  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){try{apply();}finally{queued=false;}});}\n  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();\n  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});\n})();\n</script>`;
html=html.replace('</body>',js+'\n</body>');

fs.writeFileSync(FILE,html,'utf8');
if(!html.includes('resolveGameFolderSelection')||!html.includes('SWOS1617 · careers (.CAR) · EXE'))throw new Error('SWOS Studio v1.40.0 build failed: smart folder layer was not installed.');
if((html.match(/async function chooseGameFolder\(\)/g)||[]).length!==1)throw new Error('SWOS Studio v1.40.0 build failed: expected exactly one chooseGameFolder function.');
console.log('SWOS Studio '+BUILD+' smart folder detection build complete.');
