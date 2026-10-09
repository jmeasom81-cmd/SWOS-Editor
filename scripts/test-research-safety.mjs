import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Regression test: missing football evidence must never become numeric zero.
// This intentionally checks the actual functions embedded in the published editor.
const html = fs.readFileSync('index.html', 'utf8');
function functionSource(name) {
  const label = 'function ' + name + '(';
  const i = html.indexOf(label);
  assert.ok(i >= 0, 'Missing editor helper: ' + name);
  const start = html.indexOf('{', i + label.length);
  assert.ok(start >= 0, 'Unclosed helper: ' + name);
  let depth = 0, quote = null, escape = false;
  for (let j = start; j < html.length; j++) {
    const ch = html[j];
    if (quote) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return html.slice(i, j + 1);
  }
  throw new Error('Cannot extract ' + name);
}
const names = ['evidenceNumberPresent', 'ageBandFromAge', 'inferTierFromEvidence', 'blend07', 'evidenceTo07', 'clamp07'];
const source = names.map(functionSource).join('\n') + '\n';
const run = expression => vm.runInNewContext(source + '\n(' + expression + ')', Object.create(null), {timeout: 1500});

assert.equal(run('evidenceNumberPresent(null)'), false);
assert.equal(run('evidenceNumberPresent(undefined)'), false);
assert.equal(run('evidenceNumberPresent("")'), false);
assert.equal(run('evidenceNumberPresent(" ")'), false);
assert.equal(run('evidenceNumberPresent(0)'), true);
assert.equal(run('evidenceNumberPresent(0.25)'), true);
assert.equal(run('evidenceNumberPresent("n/a")'), false);
assert.equal(run('blend07(5, null, 0.8)'), 5, 'Blank skills must preserve the baseline');
assert.equal(run('blend07(5, undefined, 0.8)'), 5);
assert.equal(run('blend07(5, 0, 0.8)'), 1, 'Real zero is a valid skill observation');
assert.equal(run('ageBandFromAge(null)'), 'unknown');
assert.equal(run('ageBandFromAge(0)'), 'unknown');
assert.equal(run('ageBandFromAge(19)'), 'u21');
assert.equal(run('inferTierFromEvidence({marketValueM:null, importance:null})'), 'starter');
assert.equal(run('inferTierFromEvidence({marketValueM:null, importance:80})'), 'strong');
assert.equal(run('inferTierFromEvidence({marketValueM:0, importance:80})'), 'fringe');

const critical = [
  'const filled=keys.filter(k=>evidenceNumberPresent(e?.[k])).length;',
  'const hasMarket=evidenceNumberPresent(e?.marketValueM);',
  'if(!evidenceNumberPresent(raw.marketValueM)){missingValues++;clubResult.valueMissing++}',
  'if(evidenceNumberPresent(raw.marketValueM)){after[o+P.value]=nearestValueIndexFromMillions(raw.marketValueM);valuesWritten++}',
  'if(evidenceNumberPresent(r.raw.marketValueM)){after[o+P.value]=nearestValueIndexFromMillions(r.raw.marketValueM);valuesWritten++}',
  'const shirt=evidenceNumberPresent(raw.shirt)?Number(raw.shirt):null;',
  'const shirt=evidenceNumberPresent(r.ident.shirt)?Number(r.ident.shirt):null;'
];
for (const fragment of critical) assert.ok(html.includes(fragment), 'Missing safe preview guard: ' + fragment);

const master = JSON.parse(fs.readFileSync('data/master-2026-27.json','utf8'));
assert.equal(master.clubs.length, 92);
assert.equal(new Set(master.clubs.map(c=>c.clubId)).size, 92);
assert.equal(master.clubs.reduce((n,c)=>n+c.players.length,0), 1472);
for (const [division,size] of Object.entries({'Premier League':20,Championship:24,'League One':24,'League Two':24}))
  assert.equal(master.clubs.filter(c=>c.division===division).length,size,'Division size: '+division);
// Parse the actual client-side application so a malformed review panel cannot ship.
const scripts = [...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)]
  .map(m=>m[1]).filter(s=>s.includes('const TEAM_RECORD_SIZE='));
assert.equal(scripts.length, 1, 'Exactly one SWOS application script should be present');
assert.doesNotThrow(()=>new vm.Script(scripts[0], {filename:'index.html script'}), 'Editor must be syntactically valid JavaScript');

const expectedNewValues = {
  'sheffield-wednesday': {
    'Joe Lumley':400, 'Max Lowe':1800, 'Ricardo Santos':350,
    'Liam Palmer':100, 'Liam Cooper':200, 'Sean Fusire':900,
    'Callum Slattery':700, 'Barry Bannan':200, 'Louie Barry':2500, 'Jamal Lowe':500
  },
  'wigan-athletic': {'Joe Walsh':1500}
};
for (const [clubId, records] of Object.entries(expectedNewValues)) {
  const club = master.clubs.find(c=>c.clubId===clubId);
  assert.ok(club, 'Missing verified club: '+clubId);
  for (const [name, euroThousands] of Object.entries(records)) {
    const player = club.players.find(p=>p.player===name);
    assert.ok(player, 'Missing researched player: '+name);
    assert.equal(player.marketValueM, Math.round(euroThousands*0.846328)/1000, 'Wrong GBP market value: '+name);
    assert.equal(player.marketValueSourceEuroK,euroThousands);
    assert.equal(player.marketValueFxRate,0.846328);
    assert.ok(player.marketValueSourceUrl?.includes('transfermarkt.'), 'No source URL for '+name);
    assert.ok(player.seasonSquadSourceUrl, 'No squad link for '+name);
  }
}
const batchD = JSON.parse(fs.readFileSync('data/league-one-squad-review-batch-d-2026-10-09.json','utf8'));
const reviewCount = batchD.clubs.reduce((n,c)=>n+c.squadReviews.length,0);
assert.equal(reviewCount,8);
assert.ok(html.includes('2026/27 squad number and membership reviews'));
assert.ok(html.includes('data-master-review-club'));
for (const reviewed of batchD.clubs) assert.ok(html.includes(reviewed.id));
assert.equal(master.clubs.flatMap(c=>c.players).filter(p=>p.marketValueM===null).length,649,'Unexpected valuations tally');
console.log('Research safety: verified 92 clubs, 1,472 players, 11 sourced additions, eight reviews and editor syntax.');
