import fs from 'node:fs';
import vm from 'node:vm';
const path='dist/index.html',html0=fs.readFileSync(path,'utf8');
const source=fs.readFileSync('scripts/gameplay-rebuild-client.js','utf8');
const master=JSON.parse(fs.readFileSync('data/master-2026-27.json','utf8'));
if(!html0.includes('<title>SWOS Studio v1.35.0</title>'))throw Error('v1.36 requires v1.35 first');
if(master.season!=='2026/27'||master.clubs.length!==92||master.clubs.some(c=>c.players.length!==16))throw Error('Unexpected gameplay dataset count');
const gameData=Object.fromEntries(master.clubs.map(c=>[c.clubId,c.players.map(p=>[p.player,p.position,p.marketValueM,p.minutes,p.goals,p.assists,p.age,p.marketValueSourceUrl])]));
const valueCount=master.clubs.flatMap(c=>c.players).filter(p=>p.marketValueM!=null).length;
if(valueCount!==1234)throw Error('Expected 1,234 researched valuations; abort if master changed');
if(master.clubs.reduce((n,c)=>n+c.players.length,0)!==1472)throw Error('Exactly 1,472 players required');
if(!source.includes('SWOS_GAMEPLAY_REBUILD_V136_END'))throw Error('Gameplay rebuild helper missing');
let html=html0;
function replaceOnce(a,b,label){const count=html.split(a).length-1;if(count!==1)throw Error('v1.36 expected unique '+label+' anchor; got '+count);html=html.replace(a,b);}
replaceOnce('<title>SWOS Studio v1.35.0</title>','<title>SWOS Studio v1.36.0</title>','title');
replaceOnce("document.title='SWOS Studio v1.35.0';","document.title='SWOS Studio v1.36.0';",'runtime title');
const safeJson=JSON.stringify(gameData).replace(/</g,'\\u003c');
replaceOnce('  function installerPreviewHtml(){','  const SWOS_GAMEPLAY_DATA_2627='+safeJson+';\n'+source+'\n  function installerPreviewHtml(){','gameplay model');
replaceOnce('      candidate.binarySafetyAudit=auditEnglandRehearsal(seasonUpdateState.english.bytes,candidate.previewBytes);',
 '      applyEnglandGameplayRebuild(candidate);\n      candidate.binarySafetyAudit=auditEnglandRehearsal(seasonUpdateState.english.bytes,candidate.previewBytes);','rebuild before binary audit');
replaceOnce('const cats={division:0,clubName:0,selectionOrder:0,playerName:0,position:0,nationality:0,shirt:0,value:0};',
 'const cats={division:0,clubName:0,selectionOrder:0,playerName:0,position:0,nationality:0,shirt:0,value:0,skills:0};','skill audit category');
replaceOnce('      else if(playerOffset===P.value)category="value";',
 '      else if(playerOffset===P.value)category="value";\n      else if(playerOffset===P.passing){\n        if((before[i]&0xF0)!==(after[i]&0xF0))errors.push("Undocumented upper passing nibble changed at "+i);\n        else if((after[i]&15)>7)errors.push("Passing nibble outside SWOS 0-7 range at "+i);\n        else category="skills";\n      }else if(playerOffset===P.shootHead||playerOffset===P.tackleControl||playerOffset===P.speedFinish){\n        if((after[i]>>4)>7||(after[i]&15)>7)errors.push("Skill nibble outside SWOS 0-7 range at "+i);\n        else category="skills";\n      }','skill byte whitelist');
const d='$'+'{';
replaceOnce('<div class="audit-item"><small>Unverified values preserved</small><strong>'+d+'p.valuesPreserved}</strong></div>',
 '<div class="audit-item"><small>Unpublished values: gameplay placeholders</small><strong>'+d+'p.gameplayReport?.placeholderValueCount??0}</strong></div>\n          <div class="audit-item"><small>All player skills rebuilt</small><strong>'+d+'p.gameplayReport?.skillsRebuilt??0}/1472</strong></div>\n          <div class="audit-item"><small>Original player skills reused</small><strong>'+d+'p.gameplayReport?.oldPlayerSkillsReused??"?"}</strong></div>',
 'preview counters');
replaceOnce('Direct installation remains locked in v1.35.','Direct installation remains locked in v1.36.','lock release');
replaceOnce('Real players currently inherit old SWOS skill bytes and unpublished values can inherit an unrelated player\\u0027s previous valuation.',
 'Player abilities now use provisional role/division profiles with market-value evidence where available; unpublished values receive explicitly tagged gameplay placeholders. These are NOT verified scouting grades or transfer estimates.',
 'accurate model warning');
replaceOnce('preservedUnverifiedValues:p.valuesPreserved,\n    preservedLegacyPlayerSkillBytes:p.skillsPreserved,',
 'gameplayPlaceholders:p.gameplayReport?.placeholderValueCount??null,\n    playerSkillsRebuilt:p.gameplayReport?.skillsRebuilt??null,\n    preservedLegacyPlayerSkillBytes:p.gameplayReport?.oldPlayerSkillsReused??null,\n    gameplayReport:p.gameplayReport||null,','JSON accuracy');
replaceOnce('Legacy player skills and unpublished values remain in overwritten slots. Use only on a separate backup copy for testing.',
 'All 1,472 skills are provisional gameplay-model output. Unknown valuations use labelled gameplay placeholders, never unrelated old-player values. Individual scouting accuracy and real-game compatibility remain unverified. Use only on a separate test copy.','JSON warning');
if(html.includes('id="installSeasonUpdate"'))throw Error('Unsafe live button accidentally enabled');
const scripts=html.split('<script>').slice(1).map(part=>part.split('</script>')[0]).filter(x=>x.includes('const TEAM_RECORD_SIZE='));
if(scripts.length!==1)throw Error('Cannot identify single built application');
new vm.Script(scripts[0],{filename:path});
fs.writeFileSync(path,html,'utf8');
console.log('SWOS v1.36: embedded '+master.clubs.length+' clubs / 1,472 deterministic player profiles; 238 explicitly provisional game-value placeholders and 635 unlinked master valuations; skills byte-audited; direct installation locked.');
