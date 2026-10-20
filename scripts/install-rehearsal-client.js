/* SWOS_INSTALL_REHEARSAL_BEGIN
   Read-only binary diff guard and export helpers for the 2026/27 England TEAM dry run.
   This code is injected INSIDE the existing SWOS Studio application closure.
   It never opens createWritable and never mutates TEAM game files. */
function auditEnglandRehearsal(before,after){
  if(!(before instanceof Uint8Array)||!(after instanceof Uint8Array))throw new Error("Preview audit needs two binary TEAM files.");
  if(before===after)throw new Error("Preview must be a separate byte-array copy.");
  const originalCount=validateTeam(before),candidateCount=validateTeam(after);
  if(originalCount!==candidateCount||before.length!==after.length)throw new Error("TEAM header, count or byte length changed.");
  const clubs=ENGLAND_2627_STRUCTURE.clubs;
  if(clubs.length!==92)throw new Error("Research structure no longer has 92 English clubs.");
  const slots=new Map();
  for(const club of clubs){
    const rec=seasonUpdateState.mapping[club.id];
    if(!Number.isInteger(rec?.teamIndex)||rec.teamIndex<0||rec.teamIndex>=originalCount)
      throw new Error("Invalid installation slot for "+club.name);
    if(slots.has(rec.teamIndex))throw new Error("Two clubs target the same TEAM slot: "+club.name+" / "+slots.get(rec.teamIndex).name);
    slots.set(rec.teamIndex,{name:club.name,reused:rec.method==="reused"});
  }
  const cats={division:0,clubName:0,selectionOrder:0,playerName:0,position:0,nationality:0,shirt:0,value:0};
  let changedBytes=0;
  const errors=[];
  for(let i=0;i<before.length;i++){
    if(before[i]===after[i])continue;
    changedBytes++;
    if(i<HEADER_SIZE){errors.push("TEAM header byte "+i+" changed");continue;}
    const teamIndex=Math.floor((i-HEADER_SIZE)/TEAM_RECORD_SIZE);
    const relative=(i-HEADER_SIZE)%TEAM_RECORD_SIZE;
    const mapped=slots.get(teamIndex);
    let category=null;
    if(relative===T.division)category="division";
    else if(mapped&&mapped.reused&&relative>=T.name&&relative<T.name+T.nameLength)category="clubName";
    else if(mapped&&relative>=T.order&&relative<T.order+16)category="selectionOrder";
    else if(mapped&&relative>=T.players&&relative<T.players+PLAYERS_PER_TEAM*PLAYER_RECORD_SIZE){
      const playerOffset=(relative-T.players)%PLAYER_RECORD_SIZE;
      if(playerOffset===P.nationality)category="nationality";
      else if(playerOffset===P.shirt)category="shirt";
      else if(playerOffset>=P.name&&playerOffset<P.name+P.nameLength)category="playerName";
      else if(playerOffset===P.multi){
        if((before[i]&31)!==(after[i]&31))errors.push("Player appearance/other flags changed at byte "+i);
        else category="position";
      }
      else if(playerOffset===P.value)category="value";
    }
    if(category)cats[category]++;
    else errors.push("Unapproved change at byte "+i+" (team "+teamIndex+", offset "+relative+")");
    if(errors.length>=12)break;
  }
  if(errors.length)throw new Error("Binary safety audit blocked candidate: "+errors.join("; "));
  if(changedBytes===0)throw new Error("Candidate is byte-for-byte identical to the original.");
  const reopened=parseTeamFileBytes(after,seasonUpdateState.english?.fileName||"TEAM.ENG");
  const selected=reopened.teams.filter(t=>t.division>=0&&t.division<=3);
  const counts=[0,1,2,3].map(x=>selected.filter(t=>t.division===x).length);
  const unique=new Set(selected.map(t=>normalizeClubName(t.name)));
  if(selected.length!==92||unique.size!==92||counts.join(",")!=="20,24,24,24")
    throw new Error("Candidate did not reopen with 92 unique teams in the expected four divisions.");
  return{changedBytes,categories:cats,topFourClubs:selected.length,uniqueClubNames:unique.size,divisionCounts:counts,sourceLength:before.length,candidateLength:after.length,allowedSlots:slots.size};
}
async function checkedEnglandRehearsal(){
  const source=seasonUpdateState.english,preview=seasonUpdateState.installPreview;
  if(!source?.fileHandle||!source.bytes||!preview?.previewBytes)throw new Error("Reconnect the original England TEAM file and run the full dry run first.");
  const f=await source.fileHandle.getFile();
  const fresh=new Uint8Array(await f.arrayBuffer());
  if(f.lastModified!==source.modified||!byteEqual(fresh,source.bytes))
    throw new Error("The original TEAM file changed since the rehearsal. Reanalyse it before exporting.");
  const check=auditEnglandRehearsal(fresh,preview.previewBytes);
  if(check.changedBytes!==preview.changedBytes)throw new Error("Preview diff count changed; rebuild the rehearsal.");
  return{source,preview,original:f,bytes:fresh,check};
}
function downloadEnglandRehearsalBytes(bytes,name,mime){
  const blob=new Blob([bytes],{type:mime||"application/octet-stream"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
  setTimeout(function(){URL.revokeObjectURL(url)},10000);
}
async function exportEnglandCandidate(){
  const result=await checkedEnglandRehearsal();
  const name=result.original.name.replace(/[^A-Za-z0-9._-]/g,"_");
  downloadEnglandRehearsalBytes(result.preview.previewBytes,name+".2026-27.CANDIDATE.bin");
}
async function exportEnglandOriginalCopy(){
  const result=await checkedEnglandRehearsal();
  const name=result.original.name.replace(/[^A-Za-z0-9._-]/g,"_");
  downloadEnglandRehearsalBytes(result.bytes,name+".ORIGINAL-BACKUP.bin");
}
async function englandSha256(bytes){
  if(!globalThis.crypto?.subtle)throw new Error("SHA-256 hashing requires a secure browser connection.");
  const digest=new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256",bytes));
  return Array.from(digest,b=>b.toString(16).padStart(2,"0")).join("");
}
async function exportEnglandRehearsalReport(){
  const result=await checkedEnglandRehearsal();
  const p=result.preview;
  const report={
    schemaVersion:1,description:"SWOS Studio England 2026/27 read-only binary rehearsal",
    readOnly:true,notGameTested:true,originalFileUnchanged:true,
    originalFile:result.original.name,season:"2026/27",
    originalSize:result.bytes.length,candidateSize:p.previewBytes.length,
    originalSHA256:await englandSha256(result.bytes),
    candidateSHA256:await englandSha256(p.previewBytes),
    audit:result.check,preparedPlayers:p.playersWritten,
    preservedUnverifiedValues:p.valuesPreserved,
    preservedLegacyPlayerSkillBytes:p.skillsPreserved,
    warning:"A passed structural rehearsal DOES NOT mean players have accurate skills or values. Legacy player skills and unpublished values remain in overwritten slots. Use only on a separate backup copy for testing.",
    clubChanges:p.clubChanges,playerChanges:p.playerChanges
  };
  const text=JSON.stringify(report,null,2);
  downloadEnglandRehearsalBytes(text,"SWOS-England-2026-27-Rehearsal.json","application/json");
}
/* SWOS_INSTALL_REHEARSAL_END */