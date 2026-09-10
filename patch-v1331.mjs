import fs from 'node:fs';

const FILE = 'dist/index.html';
const BUILD = 'v1.33.1';
if (!fs.existsSync(FILE)) throw new Error('SWOS Studio v1.33.1 build failed: dist/index.html is missing.');
let html = fs.readFileSync(FILE, 'utf8');
if (!html.includes('<title>SWOS Studio v1.33.0</title>')) throw new Error('SWOS Studio v1.33.1 build failed: expected v1.33.0 generated output was not found.');

html = html.replace('<title>SWOS Studio v1.33.0</title>', '<title>SWOS Studio v1.33.1</title>');
html = html.replace("const BUILD = 'v1.33.0';", "const BUILD = 'v1.33.1';");
html = html.replace('No new SWOS write routines are added by v1.33.0.', 'No new SWOS write routines are added by v1.33.1.');

const css = `
<style id="swos-v1331-squad-pool-styles">
  .squad-model-card{border:1px solid rgba(66,209,132,.48);background:linear-gradient(180deg,rgba(66,209,132,.08),rgba(9,20,33,.95));border-radius:14px;padding:13px;margin-top:12px}
  .squad-model-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  .squad-model-head strong{font-size:14px}.squad-model-head p{margin:4px 0 0;color:var(--muted);font-size:10px;line-height:1.4}
  .squad-model-counts{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}
  .squad-model-stat{border:1px solid var(--line);background:#07111f;border-radius:10px;padding:9px;text-align:center}
  .squad-model-stat small{display:block;font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;line-height:1.25}
  .squad-model-stat strong{display:block;font-size:18px;margin-top:3px}
  .squad-model-stat.installed strong{color:var(--green)}.squad-model-stat.pool strong{color:var(--blue)}
  .squad-pool-details{margin-top:10px!important}.squad-pool-columns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
  .squad-pool-column{border:1px solid var(--line);background:#07111f;border-radius:10px;padding:9px}
  .squad-pool-column h4{font-size:9px;text-transform:uppercase;letter-spacing:.07em;margin:0 0 7px;color:var(--muted)}
  .squad-pool-person{display:flex;align-items:center;gap:6px;padding:5px 0;border-top:1px solid rgba(38,61,92,.5);font-size:9px}
  .squad-pool-person:first-of-type{border-top:0}.squad-pool-person span:first-child{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pool-player-badge{font-size:7px;font-weight:900;border-radius:999px;padding:2px 5px;border:1px solid rgba(88,166,255,.42);color:#9fcbff;white-space:nowrap}
  .pool-player-badge.installed{border-color:rgba(66,209,132,.5);color:#8effbc}
  .identity-row.squad-pool-retained{border-left:3px solid rgba(88,166,255,.6)}
  .identity-row.squad-installed{border-left:3px solid rgba(66,209,132,.7)}
  .identity-main>.pool-player-badge{margin-left:2px}
  .squad-model-explainer{font-size:9px;color:var(--muted);line-height:1.45;margin-top:9px}
  @media(max-width:520px){.squad-pool-columns{grid-template-columns:1fr}.squad-model-counts{gap:5px}.squad-model-stat{padding:8px 4px}.squad-model-stat strong{font-size:16px}}
</style>`;
html = html.replace('</head>', css + '\n</head>');

const js = `
<script id="swos-v1331-squad-pool-layer">
(function(){
  'use strict';

  function safeText(value){
    return String(value == null ? '' : value).replace(/[&<>\"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]});
  }

  function candidateName(player){return player.footballName || player.swosName || player.officialName || 'Player';}

  async function squadData(){
    try{
      if (typeof state === 'undefined' || state.view !== 'seasonSquads') return null;
      var clubId = state.seasonSquadClub || 'all';
      if (!clubId || clubId === 'all') return {all:true};
      if (typeof loadSwos16Selections === 'function') await loadSwos16Selections();
      if (typeof swos16CandidatePool !== 'function') return null;
      var full = swos16CandidatePool(clubId) || [];
      var selectedIds = new Set((swos16State && swos16State.selections && swos16State.selections[clubId]) || []);
      var installed = full.filter(function(p){return selectedIds.has(p.candidateId);});
      var pool = full.filter(function(p){return !selectedIds.has(p.candidateId);});
      var club = (PL_2627_PACK && PL_2627_PACK.clubs || []).find(function(c){return c.id === clubId;});
      return {all:false,clubId:clubId,club:club,full:full,installed:installed,pool:pool,selectedIds:selectedIds};
    }catch(e){console.warn('SWOS Studio squad-pool view could not be prepared',e);return null;}
  }

  function personRows(players,kind){
    if(!players.length) return '<div class="tiny">None yet.</div>';
    return players.map(function(p){
      var meta = [p.registration,p.group].filter(Boolean).join(' · ');
      return '<div class="squad-pool-person"><span>'+safeText(candidateName(p))+'</span><span class="pool-player-badge '+(kind==='installed'?'installed':'')+'">'+(kind==='installed'?'SWOS 16':'POOL')+'</span></div>' + (meta ? '<div class="tiny" style="margin-top:-3px;margin-bottom:3px">'+safeText(meta)+'</div>' : '');
    }).join('');
  }

  async function ensureSquadModel(){
    var heading = Array.from(document.querySelectorAll('h1')).find(function(el){return /2026\\/27 Premier League squads/i.test(el.textContent || '');});
    if(!heading) return;

    var pill = heading.parentElement && heading.parentElement.querySelector('.simple-pill');
    if(pill && /Modern Squad Database/i.test(pill.textContent || '')) pill.textContent='👥 Full Modern Squad Database';

    var data = await squadData();
    if(!data) return;
    var existing = document.getElementById('v1331-squad-model');
    if(data.all){
      if(existing) existing.remove();
      return;
    }

    var selectedCount = data.installed.length;
    var poolCount = data.pool.length;
    var card = existing || document.createElement('div');
    card.id='v1331-squad-model';
    card.className='squad-model-card';
    card.innerHTML =
      '<div class="squad-model-head"><div><strong>'+safeText(data.club ? data.club.name : 'Club')+' · Squad model</strong><p>Studio keeps the full current squad. The SWOS database still receives exactly 16 starting records; everyone else is retained rather than discarded.</p></div><span class="feature-status beta">Beta</span></div>'+
      '<div class="squad-model-counts">'+
        '<div class="squad-model-stat"><small>Full Modern Squad</small><strong>'+data.full.length+'</strong></div>'+
        '<div class="squad-model-stat installed"><small>Installed SWOS 16</small><strong>'+selectedCount+'/16</strong></div>'+
        '<div class="squad-model-stat pool"><small>Club Squad Pool</small><strong>'+poolCount+'</strong></div>'+
      '</div>'+
      '<div class="squad-model-explainer">The Club Squad Pool is Studio data only in this build. It is the foundation for future safe mid-career squad rotation; v1.33.1 does not insert these players into a .CAR file.</div>'+
      '<details class="squad-pool-details"><summary>View installed 16 and retained squad pool</summary><div class="squad-pool-columns">'+
        '<div class="squad-pool-column"><h4>Installed SWOS 16 · '+selectedCount+'</h4>'+personRows(data.installed,'installed')+'</div>'+
        '<div class="squad-pool-column"><h4>Retained Club Squad Pool · '+poolCount+'</h4>'+personRows(data.pool,'pool')+'</div>'+
      '</div></details>';

    if(!existing){
      var filters = heading.parentElement.querySelector('.scout-filters');
      if(filters) filters.insertAdjacentElement('beforebegin',card); else heading.insertAdjacentElement('afterend',card);
    }

    var rows = heading.parentElement.querySelectorAll('.identity-row');
    rows.forEach(function(row){
      var edit = row.querySelector('[data-edit-identity]');
      if(!edit) return;
      var id = edit.getAttribute('data-edit-identity');
      row.classList.remove('squad-installed','squad-pool-retained');
      var badge = row.querySelector(':scope > .identity-main > .pool-player-badge');
      if(badge) badge.remove();
      var installed = data.selectedIds.has(id);
      row.classList.add(installed?'squad-installed':'squad-pool-retained');
      var b=document.createElement('span'); b.className='pool-player-badge '+(installed?'installed':''); b.textContent=installed?'SWOS 16':'POOL';
      var main=row.querySelector(':scope > .identity-main'); if(main) main.insertBefore(b,edit);
    });

    var stages=heading.parentElement.querySelectorAll('.update-stage');
    stages.forEach(function(stage){
      var h=stage.querySelector('h3');
      if(h && /SWOS 16 Builder/i.test(h.textContent || '')){
        var raw=(h.textContent || '').replace(/SWOS 16 Builder/i,'Installed SWOS 16');
        var badges=h.querySelectorAll('.feature-status');
        if(!badges.length) h.textContent=raw;
        else {
          var badgeHtml=Array.from(badges).map(function(x){return x.outerHTML}).join('');
          h.innerHTML=safeText(raw.replace(/Beta|Available|Under Construction/g,'').trim())+' '+badgeHtml;
        }
      }
    });
  }

  function ensureReleaseNotes(){
    if(document.getElementById('v1331-release-card')) return;
    var prior=Array.from(document.querySelectorAll('.card.stack')).find(function(card){var s=card.querySelector(':scope > strong');return s && (s.textContent || '').indexOf('New in v1.32.1')===0;});
    if(!prior) return;
    if(!document.getElementById('v133-release-card')){
      var old=document.createElement('div'); old.id='v133-release-card'; old.className='card stack v133-release-card';
      old.innerHTML='<strong>New in v1.33.0 — Public build status</strong><span class="about">• Added clear Available / Beta / Under Construction states across the live app.</span><span class="about">• Unfinished 92-club installation and Career World writing remain visibly locked rather than half-enabled.</span><span class="about">• No new TEAM.* or .CAR write routines were introduced.</span>';
      prior.insertAdjacentElement('beforebegin',old);
    }
    var card=document.createElement('div'); card.id='v1331-release-card'; card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.33.1 — Full Squad Pool foundation</strong><span class="about">• Reframed the modern squad browser around Full Modern Squad → Installed SWOS 16 → Club Squad Pool.</span><span class="about">• Selected clubs now show live counts for the complete maintained squad, the chosen SWOS 16 and all retained players outside the 16.</span><span class="about">• Player rows show whether a player is currently in the SWOS 16 or retained in the Studio pool.</span><span class="about">• Added a compact view of both groups without discarding omitted real players.</span><span class="about">• Club Squad Pool remains companion-only; no .CAR insertion or TEAM.* installation has been enabled.</span>';
    var anchor=document.getElementById('v133-release-card') || prior; anchor.insertAdjacentElement('beforebegin',card);
  }

  function updateRoadmap(){
    var future=Array.from(document.querySelectorAll('.future-card')).find(function(card){var s=card.querySelector('strong');return s && /Full Modern Squad Pool/i.test(s.textContent || '');});
    if(future){
      var status=future.querySelector('.feature-status'); if(status){status.className='feature-status beta';status.textContent='Beta';}
      var p=future.querySelector('p'); if(p) p.textContent='Now live as a companion model: full maintained squad, selected SWOS 16 and retained Club Squad Pool. Career insertion remains under construction.';
    }
  }

  async function apply(){
    document.title='SWOS Studio v1.33.1';
    document.querySelectorAll('.eyebrow').forEach(function(el){if((el.textContent || '').includes('v1.33.0')) el.textContent=el.textContent.replace('v1.33.0','v1.33.1');});
    updateRoadmap();
    ensureReleaseNotes();
    await ensureSquadModel();
  }

  var busy=false;
  function queue(){if(busy)return;busy=true;requestAnimationFrame(function(){Promise.resolve(apply()).finally(function(){busy=false;});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
})();
</script>`;
html = html.replace('</body>', js + '\n</body>');
fs.writeFileSync(FILE, html, 'utf8');
console.log('Built SWOS Studio '+BUILD+' Full Squad Pool foundation.');
