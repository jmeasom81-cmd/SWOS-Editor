import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Read the same verified packs SWOS Studio actually uses. Never fabricate missing values.
const ROOT = 'dist';
const MASTER_PATH = 'data/master-2026-27.json';
const OUTPUT = path.join(ROOT, 'downloads');
const html = fs.readFileSync('index.html', 'utf8');
const baseline = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
const manifests = ['PL_2627_RESEARCH_PACKS','CHAMPIONSHIP_2627_RESEARCH_PACKS','LEAGUE_ONE_2627_RESEARCH_PACKS','LEAGUE_TWO_2627_RESEARCH_PACKS'];

function sourceObject(name) {
  const match = new RegExp('\\bconst\\s+' + name + '\\s*=\\s*\\{', 'm').exec(html);
  if (!match) throw new Error('Master tracker: missing source object ' + name);
  const start = match.index + match[0].lastIndexOf('{');
  let quote = '', escaped = false, depth = 0;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = '';
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('Master tracker: unclosed source object ' + name);
}
function parseLiteral(text) {
  return vm.runInNewContext('(' + text + ')', Object.create(null), {timeout: 2500});
}
const byId = new Map();
for (const name of manifests) {
  const manifestText = sourceObject(name).replace(/\bdata\s*:\s*([A-Za-z_$][\w$]*)/g, (_, id) => 'data:' + JSON.stringify(id));
  for (const [id, item] of Object.entries(parseLiteral(manifestText))) {
    if (byId.has(id)) throw new Error('Master tracker: duplicate club id ' + id);
    byId.set(id, item);
  }
}
if (byId.size !== 92 || baseline.clubs.length !== 92) throw new Error('Master tracker: expected exactly 92 unique clubs.');
let nameChanges = 0;
for (const club of baseline.clubs) {
  const meta = byId.get(club.clubId);
  if (!meta) throw new Error('Master tracker: no research pack for ' + club.club);
  const raw = parseLiteral(sourceObject(meta.data));
  const old = new Map(club.players.map(p => [p.player, p]));
  const names = Object.keys(raw);
  if (names.length !== 16 || new Set(names).size !== names.length) throw new Error('Master tracker: expected 16 unique players for ' + club.club);
  const currentNames = new Set(names);
  nameChanges += club.players.filter(p => !currentNames.has(p.player)).length;
  club.players = Object.entries(raw).map(([player, p]) => {
    const previous = old.get(player) || {};
    const field = name => p[name] ?? previous[name] ?? null;
    return {
      player, shirt: field('shirt'), nationality: field('nationality'),
      group: field('group'), position: field('position'), age: field('age'),
      marketValueM: field('marketValueM'), marketValueSourceUrl: field('marketValueSourceUrl'), marketValueCheckedAt: field('marketValueCheckedAt'), marketValueSourceEuroK: field('marketValueSourceEuroK'), marketValueFxRate: field('marketValueFxRate'), minutes: field('minutes'),
      goals: field('goals'), assists: field('assists'),
      ...(previous.identitySource ? {identitySource: previous.identitySource} : {})
    };
  });
  club.source = meta.source || club.source;
  club.snapshot = meta.snapshot || club.snapshot;
  club.kind = meta.kind || club.kind;
}
baseline.clubCount = baseline.clubs.length;
baseline.playerCount = baseline.clubs.reduce((n, c) => n + c.players.length, 0);
baseline.generatedAt = new Date().toISOString().slice(0, 10);
if (baseline.playerCount !== 1472) throw new Error('Master tracker: expected 1,472 players.');
fs.mkdirSync(path.join(ROOT, 'data'), {recursive:true});
fs.mkdirSync(OUTPUT, {recursive:true});
fs.writeFileSync(path.join(ROOT, MASTER_PATH), JSON.stringify(baseline, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'data/master-2026-27.ndjson'),
  [JSON.stringify({schemaVersion:baseline.schemaVersion,season:baseline.season,generatedAt:baseline.generatedAt,clubCount:baseline.clubCount,playerCount:baseline.playerCount}),...baseline.clubs.map(c => JSON.stringify(c))].join('\n') + '\n');

const posNames = ['GK','RB','LB','D','RW/RM','LW/LM','M','A'];
const essential = ['shirt','nationality','position','marketValueM'];
const missing = p => essential.filter(k => p[k] === null || p[k] === undefined || p[k] === '');
const rowData = [];
const clubData = [];
const divisionStats = {};
for (const club of baseline.clubs) {
  const gaps = {shirt:0,nationality:0,position:0,marketValueM:0};
  let complete = 0;
  for (const p of club.players) {
    const absent = missing(p);
    for (const k of absent) gaps[k]++;
    if (!absent.length) complete++;
    rowData.push([club.division,club.club,club.clubId,p.player,p.shirt,p.nationality,p.group,p.position === null ? null : posNames[p.position] || 'Unknown',p.position,p.marketValueM,absent.length ? 'NEEDS RESEARCH':'READY',absent.map(k => k === 'marketValueM' ? 'value' : k).join(', '),club.source,club.snapshot,p.marketValueSourceUrl,p.marketValueCheckedAt,p.marketValueSourceEuroK,p.marketValueFxRate]);
  }
  clubData.push([club.division,club.club,club.players.length,complete,club.players.length-complete,gaps.shirt,gaps.nationality,gaps.position,gaps.marketValueM,'NOT VERIFIED']);
  const d = divisionStats[club.division] ||= {clubs:0,players:0,ready:0,essentialGaps:0};
  d.clubs++; d.players += club.players.length; d.ready += complete; d.essentialGaps += Object.values(gaps).reduce((a,b) => a+b, 0);
}
// Flag integrity risks without silently rewriting any verified game record.
const integrity = [];
const clubKeys = new Set();
const byPlayerName = new Map();
const expectedDivisions = {'Premier League':20,'Championship':24,'League One':24,'League Two':24};
for (const club of baseline.clubs) {
  if (clubKeys.has(club.clubId)) throw new Error('Duplicate club in master: '+club.clubId);
  clubKeys.add(club.clubId);
  const shirtOwners = new Map();
  for (const p of club.players) {
    if (Number.isInteger(p.shirt)) {
      const owner = shirtOwners.get(p.shirt);
      if (owner) integrity.push(['DUPLICATE SHIRT',club.division,club.club,p.player,'Shirt #'+p.shirt+' also used by '+owner,'Requires official squad-number verification']);
      else shirtOwners.set(p.shirt,p.player);
    }
    if (!Number.isInteger(p.position) || p.position < 0 || p.position > 7)
      integrity.push(['INVALID POSITION',club.division,club.club,p.player,'SWOS position is not a valid code 0-7','Review source']);
    if (p.marketValueM != null && (!Number.isFinite(p.marketValueM) || p.marketValueM < 0))
      integrity.push(['INVALID VALUE',club.division,club.club,p.player,'Value must be non-negative number in GBP millions','Review source']);
    const nameKey = p.player.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'');
    if (!byPlayerName.has(nameKey)) byPlayerName.set(nameKey, []);
    byPlayerName.get(nameKey).push({club:club.club,division:club.division,player:p.player});
  }
}
for (const duplicate of byPlayerName.values()) {
  if (duplicate.length <= 1) continue;
  for (const player of duplicate)
    integrity.push(['NAME COLLISION',player.division,player.club,player.player,
      'Same normalised name is listed for '+duplicate.map(p=>p.club).filter(c=>c!==player.club).join(', '),
      'May be different people; compare identities before editing']);
}
for (const [division, expected] of Object.entries(expectedDivisions)) {
  const actual = baseline.clubs.filter(c=>c.division===division).length;
  if (actual !== expected) throw new Error('Wrong 2026/27 division size: '+division+' is '+actual+' expected '+expected);
}
const headers = ['Division','Club','Club ID','Player','Shirt #','Nationality','Position group','SWOS position','Position code','Value (£m)','SWOS status','Missing essentials','Research source','Research snapshot','Value evidence URL','Value checked','Reference EUR k','EUR-GBP rate'];
const clubHeaders = ['Division','Club','Players','SWOS ready','Players needing work','Missing shirts','Missing nationality','Missing position','Missing value','Kit colours checked'];
const csvCell = v => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
fs.writeFileSync(path.join(OUTPUT, 'SWOS_Master_2026-27.csv'),
 '\uFEFF' + [headers, ...rowData].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n', 'utf8');
const audit = {
  season:baseline.season, generatedAt:baseline.generatedAt, source:'Live Studio research packs',
  clubs:baseline.clubCount, players:baseline.playerCount, valued:rowData.filter(r=>r[9]!=null).length,
  swosReady:rowData.filter(r=>r[10]==='READY').length, essentialGaps:rowData.reduce((a,r)=>a+(r[11]?r[11].split(', ').length:0),0),
  divisionStats, nameChangesSincePriorExport:nameChanges, qualityWarnings:integrity.length, qualityByType:integrity.reduce((o,r)=>(o[r[0]]=(o[r[0]]||0)+1,o),{}),
  kitReview:'Not verified; never mark kits complete solely from squad research'
};
fs.writeFileSync(path.join(ROOT, 'data/master-audit-2026-27.json'),JSON.stringify(audit,null,2)+'\n');

// Produce standards-compliant offline XLSX (no CDN and no install dependencies).
const xml = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const col = n => {let out='';for(n++;n;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out;};
const pos = (r,c) => col(c) + String(r);
function worksheet(rows, widths, opts={}) {
  const full = rows.map((values,ri) => {
    const cells = values.map((v,ci) => {
      const ref = pos(ri+1,ci);
      const isGap = ri>0 && opts.missingColumns && opts.missingColumns.includes(ci) && (v === null || v === undefined || v === '');
      const status = ri>0 && opts.statusColumn===ci;
      const style = ri===0 ? 1 : isGap ? 2 : status ? (v==='READY'?3:2) : 0;
      if (v===null || v===undefined || v==='') return '<c r="'+ref+'" s="'+style+'"/>';
      if (typeof v==='number' && Number.isFinite(v)) return '<c r="'+ref+'" s="'+style+'"><v>'+v+'</v></c>';
      return '<c r="'+ref+'" s="'+style+'" t="inlineStr"><is><t>'+xml(v)+'</t></is></c>';
    }).join('');
    return '<row r="'+(ri+1)+'">'+cells+'</row>';
  }).join('');
  const columns = widths.map((width,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+width+'" customWidth="1"/>').join('');
  const end = col(rows[0].length-1)+rows.length;
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<sheetViews><sheetView workbookViewId="0"><pane xSplit="2" ySplit="1" topLeftCell="C2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>'+
    '<sheetFormatPr defaultRowHeight="16"/><cols>'+columns+'</cols><sheetData>'+full+'</sheetData>'+
    (opts.filter?'<autoFilter ref="A1:'+end+'"/>':'')+'</worksheet>';
}
const sheets = [
  ['Players',[headers,...rowData],[20,27,23,27,10,18,17,16,14,15,19,28,52,18,60,16,16,16],{missingColumns:[4,5,7,8,9],statusColumn:10,filter:true}],
  ['Clubs',[clubHeaders,...clubData],[20,30,11,14,22,19,22,19,19,24],{filter:true}],
  ['Quality checks', [['Issue','Division','Club','Player','What needs checking','Next action'],...integrity],[23,20,29,30,80,55],{filter:true}],
  ['How to use',[
   ['SWOS 2026/27 MASTER TRACKER','What this workbook means'],
   ['Players','All 92 clubs, exactly 16 researched players per club'],
   ['Filter','Use the filter arrows on Players or Clubs to select division, team, position, missing fields or value'],
   ['Red blank cell','A required SWOS field is missing: shirt number, nationality, position or market value'],
   ['READY','The research pack has the five essential identity/value fields, not a guarantee it has been installed'],
   ['Market value','Values shown in GBP millions as currently recorded in Studio research, not a live valuation feed'],
   ['Valuation evidence','For individually researched values see the evidence URL, source amount in EUR thousands, exchange rate and checked date columns. Blank means unverified.'],
   ['Foreign exchange','October 9, 2026 EUR/GBP reference rate 0.846328; later rates must be recorded explicitly for each future batch.'],
   ['Kit colours','Separate review, not yet confirmed in this workbook'],
   ['Quality checks','This tab flags duplicate shirt numbers, player-name collisions, invalid position or value entries. Name collisions do not automatically imply a player belongs to two clubs.'],
   ['Age / goals / assists','Not included because SWOS does not need them in the current priority pass'],
   ['Source date','Each player inherits their club source/snapshot; generating the workbook does not reverify football facts'],
   ['Source of truth','Generated automatically from the same embedded research packs used by SWOS Studio'],
   ['Version','2026/27 master; regeneration on each Vercel build']
  ],[35,100],{}]
];
const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
'<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF0B1426"/><name val="Calibri"/></font><font><sz val="11"/><color rgb="FF9C2424"/><name val="Calibri"/></font></fonts>'+
'<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF5D547"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE4E4"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDFF3E7"/><bgColor indexed="64"/></patternFill></fill></fills>'+
'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+
'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
'<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1"/></cellXfs>'+
'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
const contents = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
...sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'),'</Types>'].join('');
const workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+
sheets.map((s,i)=>'<sheet name="'+xml(s[0])+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>';
const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
const workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+
'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
const files = [
 ['[Content_Types].xml',contents],['_rels/.rels',rels],['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',workbookRels],['xl/styles.xml',styles],
 ...sheets.map((s,i)=>['xl/worksheets/sheet'+(i+1)+'.xml',worksheet(s[1],s[2],s[3])])
];
const crcTable = new Uint32Array(256);
for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c&1)?0xEDB88320^(c>>>1):c>>>1;crcTable[i]=c>>>0;}
function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
function zip(entries){
 let length=0,centralLength=0;const local=[],central=[];
 for(const [name,text] of entries){
  const n=Buffer.from(name),data=Buffer.from(text,'utf8'),checksum=crc32(data);
  const head=Buffer.alloc(30);head.writeUInt32LE(0x04034b50,0);head.writeUInt16LE(20,4);head.writeUInt16LE(0,6);head.writeUInt16LE(0,8);head.writeUInt32LE(checksum,14);head.writeUInt32LE(data.length,18);head.writeUInt32LE(data.length,22);head.writeUInt16LE(n.length,26);
  const record=Buffer.alloc(46);record.writeUInt32LE(0x02014b50,0);record.writeUInt16LE(20,4);record.writeUInt16LE(20,6);record.writeUInt32LE(checksum,16);record.writeUInt32LE(data.length,20);record.writeUInt32LE(data.length,24);record.writeUInt16LE(n.length,28);record.writeUInt32LE(length,42);
  local.push(head,n,data);central.push(record,n);length+=head.length+n.length+data.length;centralLength+=record.length+n.length;
 }
 const foot=Buffer.alloc(22);foot.writeUInt32LE(0x06054b50,0);foot.writeUInt16LE(entries.length,8);foot.writeUInt16LE(entries.length,10);foot.writeUInt32LE(centralLength,12);foot.writeUInt32LE(length,16);
 return Buffer.concat([...local,...central,foot]);
}
fs.writeFileSync(path.join(OUTPUT,'SWOS_Master_2026-27.xlsx'),zip(files));
const appFile=path.join(ROOT,'index.html');
let live=fs.readFileSync(appFile,'utf8');
const anchor='<button class="btn big section-gap" id="masterCsvAll">Download full 92-club master CSV</button>';
if(!live.includes(anchor))throw new Error('Master tracker: cannot attach download button; existing editor layout changed.');
live=live.replace(anchor,anchor+'<a class="btn btn-green big section-gap" href="/downloads/SWOS_Master_2026-27.xlsx" download>Download formatted Excel workbook (.xlsx)</a>');
fs.writeFileSync(appFile,live,'utf8');
console.log('SWOS master exports: '+baseline.clubCount+' clubs, '+baseline.playerCount+' players, '+audit.valued+' valuations, '+audit.swosReady+' SWOS-ready. Workbook and CSV generated.');
