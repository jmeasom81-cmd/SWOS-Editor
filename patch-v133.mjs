import fs from 'node:fs';
import path from 'node:path';

const SOURCE = 'index.html';
const OUT_DIR = 'dist';
const BUILD = 'v1.33.0';

if (!fs.existsSync(SOURCE)) {
  throw new Error('SWOS Studio build failed: index.html was not found.');
}

let html = fs.readFileSync(SOURCE, 'utf8');
if (!html.includes('<title>SWOS Studio v1.32.1</title>')) {
  throw new Error('SWOS Studio build failed: expected v1.32.1 base was not found. Refusing to patch an unknown source.');
}

html = html.replace('<title>SWOS Studio v1.32.1</title>', `<title>SWOS Studio ${BUILD}</title>`);
html = html.replace('SWOS made simple · v1.32.1', `SWOS made simple · ${BUILD}`);

const overlayCss = `
<style id="swos-v133-status-styles">
  .feature-status{display:inline-flex;align-items:center;justify-content:center;min-height:20px;padding:3px 7px;border-radius:999px;font-size:8px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;line-height:1;border:1px solid transparent;white-space:nowrap}
  .feature-status.available{background:rgba(66,209,132,.14);border-color:rgba(66,209,132,.55);color:#8effbc}
  .feature-status.beta{background:rgba(245,213,71,.12);border-color:rgba(245,213,71,.55);color:#ffe978}
  .feature-status.building{background:rgba(88,166,255,.12);border-color:rgba(88,166,255,.5);color:#9fcbff}
  .studio-tile.has-feature-status{position:relative;padding-top:34px}
  .studio-tile.has-feature-status>.feature-status{position:absolute;top:9px;right:9px}
  .simple-option.has-feature-status{position:relative;padding-right:108px}
  .simple-option.has-feature-status>.feature-status{position:absolute;right:34px;top:50%;transform:translateY(-50%)}
  .quick-action.has-feature-status{position:relative;padding-top:25px}
  .quick-action.has-feature-status>.feature-status{position:absolute;top:4px;right:4px;font-size:6px;padding:2px 5px;min-height:16px}
  .build-status-panel{border:1px solid rgba(88,166,255,.46);background:linear-gradient(180deg,rgba(88,166,255,.08),rgba(13,24,40,.88));border-radius:14px;padding:13px;margin:0 0 14px;box-shadow:var(--shadow)}
  .build-status-head{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}
  .build-status-head strong{font-size:14px;color:var(--text)}
  .build-status-panel p{font-size:11px;color:var(--muted);margin:7px 0 0;line-height:1.45}
  .build-status-legend{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
  .future-section{margin:16px 0 4px}
  .future-section h3{margin-bottom:4px}
  .future-section>p{font-size:11px;color:var(--muted);margin:0 0 10px}
  .future-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .future-card{border:1px solid rgba(88,166,255,.3);background:#091421;border-radius:11px;padding:11px;min-height:104px;opacity:.9}
  .future-card .future-top{display:flex;gap:7px;align-items:center;justify-content:space-between;margin-bottom:7px}
  .future-card strong{font-size:12px;line-height:1.25}
  .future-card p{font-size:9px;color:var(--muted);line-height:1.45;margin:0}
  .future-card .feature-status{flex:0 0 auto}
  .under-construction-note{border:1px dashed rgba(88,166,255,.48);background:rgba(88,166,255,.06);border-radius:11px;padding:10px 11px;font-size:10px;color:var(--muted);line-height:1.45;margin-top:9px}
  .under-construction-note strong{display:block;color:#9fcbff;font-size:10px;margin-bottom:3px}
  .v133-release-card{border-color:rgba(88,166,255,.52)!important;background:rgba(88,166,255,.07)!important}
  .v133-release-card>strong{color:#9fcbff!important}
  @media(max-width:520px){.future-grid{grid-template-columns:1fr}.simple-option.has-feature-status{padding-right:100px}.build-status-head{align-items:center}}
</style>`;

if (!html.includes('</head>')) throw new Error('SWOS Studio build failed: </head> marker missing.');
html = html.replace('</head>', `${overlayCss}\n</head>`);

const overlayJs = String.raw`
<script id="swos-v133-status-layer">
(() => {
  'use strict';
  const BUILD = 'v1.33.0';
  const STATUS = {
    simpleCareer: ['available','Available'],
    simplePlayers: ['available','Available'],
    simpleScout: ['available','Available'],
    simpleKits: ['available','Available'],
    simpleEnhancements: ['available','Available'],
    simpleSafety: ['beta','Beta'],
    simpleUpdates: ['beta','Beta'],
    simplePlay: ['beta','Beta'],
    simpleCareerPlus: ['beta','Beta'],
    quickCareerPlus: ['beta','Beta']
  };

  function makeStatus(kind, label) {
    const span = document.createElement('span');
    span.className = 'feature-status ' + kind;
    span.textContent = label;
    span.setAttribute('aria-label', 'Feature status: ' + label);
    return span;
  }

  function decorateStatus(id, kind, label) {
    const el = document.getElementById(id);
    if (!el || el.dataset.v133Status === kind) return;
    const old = el.querySelector(':scope > .feature-status');
    if (old) old.remove();
    el.classList.add('has-feature-status');
    el.appendChild(makeStatus(kind, label));
    el.dataset.v133Status = kind;
  }

  function ensureHomeStatusPanel() {
    const grid = document.querySelector('.studio-grid');
    if (!grid || document.getElementById('v133-build-status-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'v133-build-status-panel';
    panel.className = 'build-status-panel';
    panel.innerHTML =
      '<div class="build-status-head">' +
        '<div><strong>SWOS Studio is in active development</strong><p>Use proven tools normally. Beta tools are available but should be used with a backup. Under Construction areas are visible so you can see what is coming, but they do not write unfinished changes into SWOS.</p></div>' +
        '<span class="feature-status beta">' + BUILD + '</span>' +
      '</div>' +
      '<div class="build-status-legend">' +
        '<span class="feature-status available">Available</span>' +
        '<span class="feature-status beta">Beta</span>' +
        '<span class="feature-status building">Under Construction</span>' +
      '</div>';
    grid.parentNode.insertBefore(panel, grid);
  }

  function ensureFutureSection() {
    const grid = document.querySelector('.studio-grid');
    if (!grid || document.getElementById('v133-future-section')) return;
    const section = document.createElement('section');
    section.id = 'v133-future-section';
    section.className = 'future-section';
    section.innerHTML =
      '<h3>What we are building next</h3>' +
      '<p>These areas are deliberately visible, but not exposed as half-working SWOS file tools.</p>' +
      '<div class="future-grid">' +
        '<div class="future-card"><div class="future-top"><strong>Full Modern Squad Pool</strong><span class="feature-status building">Under Construction</span></div><p>Keep each club\'s full real squad in Studio while SWOS still receives its selected 16 starting players.</p></div>' +
        '<div class="future-card"><div class="future-top"><strong>Career World</strong><span class="feature-status building">Under Construction</span></div><p>A living career layer for AI transfers, transfer news and world progression without silently changing your club.</p></div>' +
        '<div class="future-card"><div class="future-top"><strong>January + Summer World Updates</strong><span class="feature-status building">Under Construction</span></div><p>Controlled twice-seasonly career checkpoints for transfers and reviewed player-value movement.</p></div>' +
        '<div class="future-card"><div class="future-top"><strong>One-tap Football Data Update</strong><span class="feature-status building">Under Construction</span></div><p>Future published master databases can update real-world clubs, squads and divisions separately from the Studio app itself.</p></div>' +
      '</div>';
    const trust = grid.parentNode.querySelector('.studio-trust');
    if (trust) trust.insertAdjacentElement('afterend', section);
    else grid.insertAdjacentElement('afterend', section);
  }

  function ensureCareerPlusNote() {
    const btn = document.getElementById('simpleCareerPlus');
    if (!btn) return;
    const page = btn.closest('main') || document.querySelector('main');
    if (!page || document.getElementById('v133-careerplus-note')) return;
    const note = document.createElement('div');
    note.id = 'v133-careerplus-note';
    note.className = 'under-construction-note';
    note.innerHTML = '<strong>Career+ is Beta</strong>The existing companion tools remain usable. Automatic AI-world transfers and safe career squad expansion are still being decoded and are not enabled yet.';
    btn.insertAdjacentElement('afterend', note);
  }

  function ensureUpdateLabels() {
    const stages = Array.from(document.querySelectorAll('.update-stage'));
    if (!stages.length) return;
    for (const stage of stages) {
      const heading = stage.querySelector('h3');
      if (!heading || stage.dataset.v133Stage) continue;
      const text = heading.textContent || '';
      let kind = 'beta', label = 'Beta';
      if (/Safe Installer/i.test(text) || /Kits, managers & formations/i.test(text)) {
        kind = 'building'; label = 'Under Construction';
      } else if (/SWOS 16 Builder/i.test(text) || /Research Pack Centre/i.test(text) || /player rebuild/i.test(text)) {
        kind = 'beta'; label = 'Beta';
      } else if (/club|structure|map/i.test(text)) {
        kind = 'available'; label = 'Available';
      }
      const badge = makeStatus(kind, label);
      badge.style.marginLeft = '7px';
      heading.appendChild(badge);
      stage.dataset.v133Stage = kind;
    }

    if (!document.getElementById('v133-update-safety')) {
      const last = stages[stages.length - 1];
      const note = document.createElement('div');
      note.id = 'v133-update-safety';
      note.className = 'under-construction-note';
      note.innerHTML = '<strong>Safe Installer remains locked</strong>Modern football data, mapping, selection and research can be prepared here. This build still does not install the unfinished 92-club rebuild into TEAM.* files.';
      last.insertAdjacentElement('afterend', note);
    }
  }

  function ensureReleaseCard() {
    if (document.getElementById('v133-release-card')) return;
    const cards = Array.from(document.querySelectorAll('.card.stack'));
    const prior = cards.find(card => {
      const first = card.querySelector(':scope > strong');
      return first && /^New in v1\\.32\\.1/.test(first.textContent || '');
    });
    if (!prior) return;
    const card = document.createElement('div');
    card.id = 'v133-release-card';
    card.className = 'card stack v133-release-card';
    card.innerHTML = '<strong>New in v1.33.0 — Public build status</strong>' +
      '<span class="about">• Added clear Available / Beta / Under Construction states so the live app can keep serving proven tools while larger features are built.</span>' +
      '<span class="about">• Update SWOS remains accessible for safe preparation and research, while the unfinished England Safe Installer stays clearly marked Under Construction.</span>' +
      '<span class="about">• Added visible roadmap cards for Full Modern Squad Pool, Career World, January/Summer world updates and one-tap football-data updates.</span>' +
      '<span class="about">• Career+ remains usable as Beta; automatic world transfers and career squad expansion are not falsely presented as ready.</span>' +
      '<span class="about">• No new TEAM.* or .CAR write routines are introduced by this build.</span>';
    prior.insertAdjacentElement('beforebegin', card);
  }

  function updateVersionText() {
    document.title = 'SWOS Studio ' + BUILD;
    document.querySelectorAll('.eyebrow').forEach(el => {
      if ((el.textContent || '').includes('v1.32.1')) el.textContent = el.textContent.replace('v1.32.1', BUILD);
    });
    document.querySelectorAll('.notice.info strong').forEach(el => {
      if ((el.textContent || '').trim() === 'No SWOS files are changed by v1.32.1.') {
        el.textContent = 'No new SWOS write routines are added by v1.33.0.';
      }
    });
  }

  function apply() {
    updateVersionText();
    Object.entries(STATUS).forEach(([id, spec]) => decorateStatus(id, spec[0], spec[1]));
    ensureHomeStatusPanel();
    ensureFutureSection();
    ensureCareerPlusNote();
    ensureUpdateLabels();
    ensureReleaseCard();
  }

  let queued = false;
  const queueApply = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queueApply, {once:true});
  else queueApply();

  new MutationObserver(queueApply).observe(document.documentElement, {subtree:true, childList:true});
})();
</script>`

if (!html.includes('</body>')) throw new Error('SWOS Studio build failed: </body> marker missing.');
html = html.replace('</body>', `${overlayJs}\n</body>`);

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const entry of fs.readdirSync('.')) {
  if (['.git', '.vercel', OUT_DIR].includes(entry)) continue;
  if (['patch-v133.mjs', 'vercel.json'].includes(entry)) continue;
  fs.cpSync(entry, path.join(OUT_DIR, entry), { recursive: true });
}
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
console.log(`Built SWOS Studio ${BUILD} from verified v1.32.1 base.`);
