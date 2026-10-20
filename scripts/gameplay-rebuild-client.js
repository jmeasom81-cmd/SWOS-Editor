/* SWOS_GAMEPLAY_REBUILD_V136
  Provisional game balance, NOT verified player scouting data. Deterministic.
  Requires build-injected const SWOS_GAMEPLAY_DATA_2627 keyed by stable clubId.
  Writes ONLY skills/value bytes of the 1,472 already selected 2026/27 TEAM records.
  Does not modify the original file, career, pools, appearance or kits.
*/
function gameplayPresent(v){return typeof v==='number'&&Number.isFinite(v)&&v>=0}
function gameplayClamp(v){return Math.max(0,Math.min(7,Math.round(v)))}
function gameplayTemplate(position){
  return [
    [2,1,1,2,3,3,1], // goalkeeper - SWOS has no dedicated keeper skill; keep outfield modest
    [4,2,3,5,4,5,2], // RB
    [4,2,3,5,4,5,2], // LB
    [3,2,5,6,3,3,2], // CB
    [5,4,2,3,5,6,4], // RW
    [5,4,2,3,5,6,4], // LW
    [5,4,3,4,5,4,3], // CM
    [4,5,4,2,5,5,6]  // striker
  ][position];
}
function gameplayRatings(profile,division,position){
  if(!Number.isInteger(position)||position<0||position>7)throw Error('Unsupported player position');
  if(![0,1,2,3].includes(division))throw Error('Unsupported English division');
  const [name,sourcePosition,value,minutes,goals,assists,age,sourceUrl]=profile;
  const base=gameplayTemplate(position);
  const divisionOffset=[1.0,0,-0.55,-0.85][division];
  const medians=[25,2.5,0.6,0.25];
  const hasValue=gameplayPresent(value);
  const ratio=hasValue?Math.log2(Math.max(0.025,value)/medians[division]):0;
  const valueOffset=hasValue?Math.max(-1.2,Math.min(1.2,ratio*.38)):0;
  const roleWeights=[1,1,1,1,1,1,1];
  const levels=base.map((v,i)=>gameplayClamp(v+(divisionOffset+valueOffset)*(v<=2?.55:1)*roleWeights[i]));
  // Minutes and returns boost only a suitable skill for sufficiently large samples;
  // no missing/null minutes, goals or assists are interpreted as zero.
  if(gameplayPresent(minutes)&&minutes>=900){
    if(gameplayPresent(goals)&&(position===7||position===4||position===5)){
      const g90=goals*90/minutes;
      if(g90>=0.5)levels[6]=gameplayClamp(levels[6]+1);
    }
    if(gameplayPresent(assists)&&(position===4||position===5||position===6)){
      const a90=assists*90/minutes;
      if(a90>=0.3)levels[0]=gameplayClamp(levels[0]+1);
    }
  }
  // Do not invent ages or penalise players with unknown age.
  if(gameplayPresent(age)&&age>=34&&position!==0)levels[5]=gameplayClamp(levels[5]-.5);
  const fallback=[2.5,.45,.15,.075][division]; // gameplay ONLY, not a sourced market estimate
  const valueIndex=nearestValueIndexFromMillions(hasValue?value:fallback);
  if(!Number.isInteger(valueIndex)||valueIndex<0||valueIndex>49)
    throw Error('Invalid SWOS valuation index for '+name);
  if(!Array.isArray(levels)||levels.length!==7||levels.some(v=>!Number.isInteger(v)||v<0||v>7))
    throw Error('Invalid gameplay skill levels for '+name);
  return{
    levels,valueIndex,valueStatus:hasValue?(sourceUrl?'linked_master_value':'master_value_unlinked'):'gameplay_placeholder',
    skillsStatus:hasValue?'role_division_and_value_model':'role_division_template',
    goalsUsed:gameplayPresent(minutes)&&minutes>=900&&gameplayPresent(goals),
    assistsUsed:gameplayPresent(minutes)&&minutes>=900&&gameplayPresent(assists),
    ageUsed:gameplayPresent(age),marketValueM:hasValue?value:null
  };
}
function gameplayEncodeSkills(bytes,o,levels){
  if(levels.length!==7||levels.some(v=>!Number.isInteger(v)||v<0||v>7))
    throw Error('Unsafe SWOS skills');
  // The passing byte's high nibble is not documented as a skill. Preserve it.
  bytes[o+P.passing]=(bytes[o+P.passing]&0xF0)|levels[0];
  bytes[o+P.shootHead]=(levels[1]<<4)|levels[2];
  bytes[o+P.tackleControl]=(levels[3]<<4)|levels[4];
  bytes[o+P.speedFinish]=(levels[5]<<4)|levels[6];
}
function gameplayReadSkills(bytes,o){
  return[
    bytes[o+P.passing]&15,
    bytes[o+P.shootHead]>>4,bytes[o+P.shootHead]&15,
    bytes[o+P.tackleControl]>>4,bytes[o+P.tackleControl]&15,
    bytes[o+P.speedFinish]>>4,bytes[o+P.speedFinish]&15
  ];
}
function gameplayNorm(s){
  return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9]/g,'').toUpperCase();
}
function gameDataSlotMatches(modelName,actualName){
  const a=gameplayNorm(modelName),b=gameplayNorm(actualName);
  if(!a||!b)return false;
  // Truncated SWOS names are permitted only where the shorter string is >= 12 chars
  // and shares an exact beginning. No fuzzy cross-player substitutions.
  const rendered=gameplayNorm(swosSafeName(modelName));
  return a===b||rendered===b||(b.length>=12&&a.startsWith(b));
}
function applyEnglandGameplayRebuild(preview){
  const source=seasonUpdateState.english;
  if(!preview?.previewBytes||!source?.bytes||!Array.isArray(preview.playerChanges))
    throw Error('Missing TEAM rehearsal or original source');
  const expected=92*16;
  if(preview.playerChanges.length!==expected||preview.clubsMapped!==92)
    throw Error('Gameplay rebuild requires all 1,472 prepared player slots.');
  const after=preview.previewBytes;
  if(after===source.bytes)throw Error('Must not edit source TEAM bytes');
  const clubMap=new Map(preview.clubChanges.map(c=>[c.name,c]));
  if(clubMap.size!==92)throw Error('Duplicate club names in preview');
  const used=new Set(),records=[],summaries={};
  let sourceValueCount=0,placeholderValueCount=0,linkedValueCount=0,unlinkedValueCount=0,evidenceSupportedSkills=0,positionOnlySkills=0;
  for(const p of preview.playerChanges){
    const c=clubMap.get(p.club);
    if(!c||!Number.isInteger(c.slot)||c.slot<0)throw Error('Unmapped gameplay club '+p.club);
    const modelClub=SWOS_GAMEPLAY_DATA_2627[c.clubId];
    if(!modelClub||modelClub.length!==16)throw Error('Missing model for '+c.clubId);
    if(!Number.isInteger(p.slot)||p.slot<1||p.slot>16)throw Error('Unsafe player slot '+p.slot);
    const slotKey=c.clubId+':'+p.slot;
    if(used.has(slotKey))throw Error('Duplicate game slot '+slotKey);
    used.add(slotKey);
    const profile=modelClub[p.slot-1];
    const o=HEADER_SIZE+c.slot*TEAM_RECORD_SIZE+T.players+(p.slot-1)*PLAYER_RECORD_SIZE;
    const gameName=readText(after,o+P.name,P.nameLength);
    if(!gameDataSlotMatches(profile[0],gameName)){
      throw Error('Player order differs from master for '+p.club+' slot '+p.slot+
        ': expected '+profile[0]+', got '+gameName+'. Do not use this candidate.');
    }
    const position=(after[o+P.multi]>>5)&7;
    const result=gameplayRatings(profile,c.division,position);
    gameplayEncodeSkills(after,o,result.levels);
    after[o+P.value]=result.valueIndex;
    const decoded=gameplayReadSkills(after,o);
    if(decoded.join(',')!==result.levels.join(',')||after[o+P.value]!==result.valueIndex)
      throw Error('SWOS gameplay encoding verification failed at '+slotKey);
    if(!summaries[c.clubId])summaries[c.clubId]={club:p.club,division:c.division,players:0,publishedValues:0,gameplayPlaceholders:0};
    summaries[c.clubId].players++;
    if(result.valueStatus!=='gameplay_placeholder'){
      sourceValueCount++;summaries[c.clubId].publishedValues++;evidenceSupportedSkills++;
      if(result.valueStatus==='linked_master_value')linkedValueCount++;else unlinkedValueCount++;
    }
    else{placeholderValueCount++;summaries[c.clubId].gameplayPlaceholders++;positionOnlySkills++}
    records.push({
      clubId:c.clubId,club:p.club,slot:p.slot,player:profile[0],position,
      valueSource:result.valueStatus,individualValueSourceUrl:profile[7]||null,marketValueM:result.marketValueM,
      valueIndex:result.valueIndex,ratings:result.levels,
      ratingsMethod:result.skillsStatus,ageUsed:result.ageUsed,
      goalsUsed:result.goalsUsed,assistsUsed:result.assistsUsed
    });
  }
  if(used.size!==expected||sourceValueCount+placeholderValueCount!==expected)
    throw Error('Not all 1,472 game player records were rebuilt');
  const recomputed=records.filter(r=>r.ratings.some(v=>v<0||v>7)||r.valueIndex>49);
  if(recomputed.length)throw Error('Invalid game encoding found');
  const result={
    schemaVersion:1,model:'SWOS v1.36 experimental division/role balance',
    notIndividuallyScouted:true,sourcePlayerCount:expected,
    skillsRebuilt:expected,evidenceSupportedSkills,positionOnlySkills,
    valuesWritten:expected,sourceValueCount,linkedValueCount,unlinkedValueCount,placeholderValueCount,
    oldPlayerSkillsReused:0,oldPlayerValuesReused:0,
    sourceData:'2026/27 maintained SWOS master with raw playing statistics where available',
    warning:'Skill profiles are deterministic position/division heuristics, not independent scouting grades. Of 1,234 recorded master valuations, individual evidence links are missing for many entries; these are labelled separately. Blank valuations use GAMEPLAY PLACEHOLDERS, not financial estimates. This candidate is NOT approved for live installation or match accuracy.',
    clubs:summaries,players:records
  };
  // The pre-existing TEAM builder counted bytes before player abilities were rebuilt.
  // Recompute the final diff, otherwise the safe export freshness guard rejects every valid v1.36 candidate.
  let finalChanged=0;
  if(after.length!==source.bytes.length)throw Error('Gameplay rebuild changed TEAM file length');
  for(let i=0;i<after.length;i++)if(after[i]!==source.bytes[i])finalChanged++;
  if(!finalChanged)throw Error('Gameplay rebuild produced no TEAM changes');
  preview.changedBytes=finalChanged;
  preview.gameplayReport=result;
  preview.skillsPreserved=0;preview.valuesPreserved=0;
  preview.skillsRebuilt=expected;preview.placeholderValues=placeholderValueCount;
  return result;
}
/* SWOS_GAMEPLAY_REBUILD_V136_END */