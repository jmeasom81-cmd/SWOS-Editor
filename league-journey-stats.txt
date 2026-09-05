import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const ljsSb = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let ljsLeagueId = null;
let ljsUserId = null;
let ljsContextPromise = null;
let ljsJourney = null;
let ljsJourneyAt = 0;
let ljsProfiles = null;
let ljsProfilesAt = 0;
let ljsJourneyMode = null;
let ljsPrimary = null;
let ljsRival = '';
let ljsStatsUser = null;
let ljsTimer = null;
const LJS_TTL = 60000;

const ljsEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ljsOrd = n => {
  n = Number(n || 0);
  const s = ['th','st','nd','rd'], v = n % 100;
  return `${n}${s[(v-20)%10] || s[v] || s[0]}`;
};

function ljsAddStyles(){
  if(document.getElementById('ljs-css')) return;
  const s = document.createElement('style');
  s.id = 'ljs-css';
  s.textContent = `
    .ljsJourneyCard{overflow:hidden}
    .ljsTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
    .ljsToggle{display:flex;background:#f0eff5;border-radius:11px;padding:3px;gap:2px}
    .ljsToggle button{border:0;background:transparent;border-radius:9px;padding:7px 9px;font-size:10px;font-weight:900;color:#6f6b7d}
    .ljsToggle button.active{background:#fff;color:#4b269d;box-shadow:0 2px 8px rgba(30,20,70,.10)}
    .ljsSelectors{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:11px 0}
    .ljsSelectWrap label{display:block;font-size:9px;font-weight:950;color:#777487;text-transform:uppercase;margin:0 0 4px 2px}
    .ljsSelectWrap select{width:100%;border:1px solid #ddd9e9;border-radius:11px;padding:9px 10px;background:#fff;color:#252137;font-size:11px;font-weight:800}
    .ljsGraphScroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid #ebe8f2;border-radius:14px;background:linear-gradient(180deg,#fff,#fbfaff)}
    .ljsGraphScroll svg{display:block}
    .ljsLegend{display:flex;gap:12px;flex-wrap:wrap;margin-top:9px;font-size:10px;color:#625e70;font-weight:800}
    .ljsDot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:-1px}
    .ljsDot.primary{background:#5a35b1}.ljsDot.rival{background:#d17a00}.ljsDot.other{background:#c9c7d3}
    .ljsHint{font-size:10px;color:#817d8d;line-height:1.4;margin-top:8px}
    .ljsPlayerCard .ljsPlayerHead{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
    .ljsPlayerCard select{max-width:100%;border:1px solid #d9d8e5;border-radius:11px;padding:9px 10px;background:#fff;font-size:11px;font-weight:850;color:#29243a}
    .ljsMiniGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}
    .ljsMini{background:#f6f5fa;border-radius:12px;padding:9px 6px;text-align:center}
    .ljsMini b{display:block;font-size:18px}.ljsMini span{font-size:8px;color:#797586;font-weight:900;text-transform:uppercase}
    .ljsSub{margin-top:12px;border-top:1px solid #eceaf2;padding-top:11px}
    .ljsSub h3{font-size:13px;margin:0 0 8px}
    .ljsMovement{font-weight:950}.ljsMovement.up{color:#08775c}.ljsMovement.down{color:#b52c3c}.ljsMovement.same{color:#716f82}
    .ljsRow{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #eeecf3;font-size:11px;align-items:center}
    .ljsRow:last-child{border-bottom:0}
    .ljsRow small{display:block;color:#858190;font-size:9px;margin-top:2px}
    .ljsPills{display:flex;gap:6px;flex-wrap:wrap}
    .ljsPill{background:#f0edf9;color:#51398b;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:850}
    .ljsEmpty{padding:18px;text-align:center;color:#777487;font-size:11px}
    @media(max-width:520px){.ljsSelectors{grid-template-columns:1fr}.ljsMiniGrid{grid-template-columns:repeat(3,1fr)}}
  `;
  document.head.appendChild(s);
}

async function ljsEnsureContext(){
  if(ljsLeagueId && ljsUserId) return true;
  if(ljsContextPromise) return ljsContextPromise;
  ljsContextPromise = (async()=>{
    try{
      const {data:{session}} = await ljsSb.auth.getSession();
      if(!session) return false;
      ljsUserId = session.user.id;
      const {data,error} = await ljsSb.from('league_members')
        .select('league_id,status,joined_at')
        .eq('user_id',ljsUserId)
        .eq('status','active')
        .order('joined_at',{ascending:false});
      if(error) throw error;
      if(!data?.length) return false;
      ljsLeagueId = data[0].league_id;
      return true;
    }catch(e){
      console.warn('League Journey context:',e);
      return false;
    }finally{
      if(!ljsLeagueId) setTimeout(()=>{ljsContextPromise=null},1200);
    }
  })();
  return ljsContextPromise;
}

async function ljsLoadJourney(force=false){
  if(!await ljsEnsureContext()) throw new Error('League not ready yet');
  if(!force && ljsJourney && Date.now()-ljsJourneyAt<LJS_TTL) return ljsJourney;
  const {data,error} = await ljsSb.rpc('get_league_journey',{p_league_id:ljsLeagueId});
  if(error) throw error;
  ljsJourney = data || {};
  ljsJourneyAt = Date.now();
  if(!ljsJourneyMode) ljsJourneyMode = ljsJourney.default_mode || 'daily';
  if(!ljsPrimary) ljsPrimary = ljsJourney.current_user_id || ljsUserId;
  return ljsJourney;
}

async function ljsLoadProfiles(force=false){
  if(!await ljsEnsureContext()) throw new Error('League not ready yet');
  if(!force && ljsProfiles && Date.now()-ljsProfilesAt<LJS_TTL) return ljsProfiles;
  const {data,error} = await ljsSb.rpc('get_player_stats_profiles',{p_league_id:ljsLeagueId});
  if(error) throw error;
  ljsProfiles = data || {};
  ljsProfilesAt = Date.now();
  if(!ljsStatsUser) ljsStatsUser = ljsProfiles.current_user_id || ljsUserId;
  return ljsProfiles;
}

function ljsEntrant(d,id){ return (d.entrants||[]).find(x=>String(x.entrant_id)===String(id)); }
function ljsPosition(cp,id){ return (cp?.positions||[]).find(x=>String(x.entrant_id)===String(id)); }

function ljsGraphSvg(d,mode){
  const cps = mode==='matchweek' ? (d.matchweeks||[]) : (d.daily||[]);
  const entrants = d.entrants || [];
  if(!cps.length || !entrants.length) return '<div class="ljsEmpty">The journey graph will appear as results are scored.</div>';
  const count = entrants.length;
  const width = Math.max(620, 74 + (cps.length-1)*58);
  const plotTop = 28, plotBottom = 42, plotLeft = 44, plotRight = 18;
  const plotHeight = Math.max(250,(count-1)*10.5);
  const height = plotTop + plotHeight + plotBottom;
  const x = i => cps.length===1 ? plotLeft+(width-plotLeft-plotRight)/2 : plotLeft + i*((width-plotLeft-plotRight)/(cps.length-1));
  const y = p => plotTop + ((Number(p)-1)/Math.max(1,count-1))*plotHeight;
  const marks = [...new Set([1,5,10,15,20,25,count].filter(v=>v>=1&&v<=count))];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="League position journey">`;
  marks.forEach(p=>{
    const yy=y(p); svg += `<line x1="${plotLeft}" y1="${yy}" x2="${width-plotRight}" y2="${yy}" stroke="#ece9f2" stroke-width="1"/><text x="${plotLeft-9}" y="${yy+3}" text-anchor="end" font-size="9" fill="#8a8695">${p}</text>`;
  });
  cps.forEach((cp,i)=>{ svg += `<text x="${x(i)}" y="${height-15}" text-anchor="middle" font-size="9" font-weight="700" fill="#7d7889">${ljsEsc(cp.label||'')}</text>`; });

  const ordered = entrants.slice().sort((a,b)=>{
    const sa = String(a.entrant_id)===String(ljsPrimary)?2:String(a.entrant_id)===String(ljsRival)?1:0;
    const sb = String(b.entrant_id)===String(ljsPrimary)?2:String(b.entrant_id)===String(ljsRival)?1:0;
    return sa-sb;
  });
  ordered.forEach(en=>{
    const pts=[];
    cps.forEach((cp,i)=>{ const p=ljsPosition(cp,en.entrant_id); if(p) pts.push(`${x(i)},${y(p.position)}`); });
    if(!pts.length) return;
    const primary=String(en.entrant_id)===String(ljsPrimary), rival=String(en.entrant_id)===String(ljsRival), ai=en.entrant_type==='ai';
    const stroke=primary?'#5a35b1':rival?'#d17a00':'#c9c7d3';
    const sw=primary||rival?4:1.35;
    const opacity=primary||rival?1:.46;
    svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"${ai?' stroke-dasharray="5 4"':''}/>`;
    if(primary||rival){
      cps.forEach((cp,i)=>{ const p=ljsPosition(cp,en.entrant_id); if(!p)return; svg+=`<circle cx="${x(i)}" cy="${y(p.position)}" r="4.2" fill="${stroke}" stroke="#fff" stroke-width="1.5"><title>${ljsEsc(en.team_name)} · ${ljsEsc(cp.label)} · ${ljsOrd(p.position)} · ${p.points} pts</title></circle>`; });
    }
  });
  svg += '</svg>';
  return svg;
}

function ljsJourneyInner(d){
  const entrants=d.entrants||[];
  if(!ljsPrimary || !entrants.some(x=>String(x.entrant_id)===String(ljsPrimary))) ljsPrimary=d.current_user_id||entrants[0]?.entrant_id||'';
  if(ljsRival && !entrants.some(x=>String(x.entrant_id)===String(ljsRival))) ljsRival='';
  const mode=ljsJourneyMode||d.default_mode||'daily';
  const cps=mode==='matchweek'?(d.matchweeks||[]):(d.daily||[]);
  const last=cps[cps.length-1];
  const me=ljsEntrant(d,ljsPrimary), rp=ljsEntrant(d,ljsRival), mePos=ljsPosition(last,ljsPrimary), rPos=ljsPosition(last,ljsRival);
  const opts=entrants.map(e=>`<option value="${ljsEsc(e.entrant_id)}" ${String(e.entrant_id)===String(ljsPrimary)?'selected':''}>${ljsEsc(e.badge||'⚽')} ${ljsEsc(e.team_name)}${String(e.entrant_id)===String(d.current_user_id)?' (You)':''}</option>`).join('');
  const rivalOpts=entrants.filter(e=>String(e.entrant_id)!==String(ljsPrimary)).map(e=>`<option value="${ljsEsc(e.entrant_id)}" ${String(e.entrant_id)===String(ljsRival)?'selected':''}>${ljsEsc(e.badge||'⚽')} ${ljsEsc(e.team_name)}</option>`).join('');
  return `<div class="ljsTop"><div><div class="section" style="margin-bottom:3px"><h2>📈 League Journey</h2></div><div class="notice">See how every team has moved through the league.</div></div><div class="ljsToggle"><button data-ljs-mode="daily" class="${mode==='daily'?'active':''}">Detailed</button><button data-ljs-mode="matchweek" class="${mode==='matchweek'?'active':''}">Matchweek</button></div></div>
  <div class="ljsSelectors"><div class="ljsSelectWrap"><label>Highlight</label><select data-ljs-primary>${opts}</select></div><div class="ljsSelectWrap"><label>Compare with</label><select data-ljs-rival><option value="">No rival selected</option>${rivalOpts}</select></div></div>
  <div class="ljsGraphScroll">${ljsGraphSvg(d,mode)}</div>
  <div class="ljsLegend"><span><i class="ljsDot primary"></i>${ljsEsc(me?.team_name||'Selected')}${mePos?` · ${ljsOrd(mePos.position)}`:''}</span>${rp?`<span><i class="ljsDot rival"></i>${ljsEsc(rp.team_name)}${rPos?` · ${ljsOrd(rPos.position)}`:''}</span>`:''}<span><i class="ljsDot other"></i>Rest of league</span></div>
  <div class="ljsHint">${mode==='daily'?'Detailed view records the table after each day on which Premier League fixtures are scored.':'Matchweek view shows the table after completed fixture rounds.'} ${Number(d.latest_closed_matchweek||0)<6?'Detailed remains the default until Matchweek 6 is complete.':''} The AI line is dashed.</div>`;
}

function ljsBindJourney(card,d){
  card.querySelectorAll('[data-ljs-mode]').forEach(b=>b.addEventListener('click',()=>{ ljsJourneyMode=b.dataset.ljsMode; card.innerHTML=ljsJourneyInner(d); ljsBindJourney(card,d); }));
  card.querySelector('[data-ljs-primary]')?.addEventListener('change',e=>{ ljsPrimary=e.target.value; if(String(ljsRival)===String(ljsPrimary)) ljsRival=''; card.innerHTML=ljsJourneyInner(d); ljsBindJourney(card,d); });
  card.querySelector('[data-ljs-rival]')?.addEventListener('change',e=>{ ljsRival=e.target.value; card.innerHTML=ljsJourneyInner(d); ljsBindJourney(card,d); });
}

async function ljsInjectJourney(){
  const main=document.getElementById('main');
  const onTable=!!document.querySelector('#nav button[data-v="table"].active');
  if(!main||!onTable||main.querySelector('.ljsJourneyCard')) return;
  const leagueHead=[...main.querySelectorAll('.card .section h2')].find(h=>h.textContent.trim()==='League table');
  if(!leagueHead) return;
  const tableCard=leagueHead.closest('.card');
  const card=document.createElement('div'); card.className='card ljsJourneyCard'; card.innerHTML='<div class="ljsEmpty">Building League Journey…</div>';
  tableCard.insertAdjacentElement('afterend',card);
  try{ const d=await ljsLoadJourney(); if(!card.isConnected)return; card.innerHTML=ljsJourneyInner(d); ljsBindJourney(card,d); }
  catch(e){ console.warn('League Journey:',e); if(card.isConnected) card.innerHTML=`<div class="ljsEmpty">Couldn’t load League Journey yet.<br>${ljsEsc(e.message||e)}</div>`; }
}

function ljsMovementHtml(n){
  n=Number(n||0); if(n>0)return `<span class="ljsMovement up">↑ ${n}</span>`; if(n<0)return `<span class="ljsMovement down">↓ ${Math.abs(n)}</span>`; return `<span class="ljsMovement same">—</span>`;
}

function ljsPlayerInner(d){
  const players=d.players||[];
  if(!ljsStatsUser || !players.some(x=>String(x.user_id)===String(ljsStatsUser))) ljsStatsUser=d.current_user_id||players[0]?.user_id||'';
  const p=players.find(x=>String(x.user_id)===String(ljsStatsUser));
  if(!p) return '<div class="ljsEmpty">Player stats will appear after results are scored.</div>';
  const opts=players.map(x=>`<option value="${ljsEsc(x.user_id)}" ${String(x.user_id)===String(ljsStatsUser)?'selected':''}>${ljsEsc(x.badge||'⚽')} ${ljsEsc(x.team_name)}${String(x.user_id)===String(d.current_user_id)?' (You)':''}</option>`).join('');
  const st=p.prediction_style||{}, totalCalls=Number(st.home||0)+Number(st.draw||0)+Number(st.away||0);
  const pct=v=>totalCalls?Math.round(Number(v||0)*100/totalCalls):0;
  const pop=p.most_predicted_score;
  const best=p.best_matchweek,worst=p.worst_matchweek;
  const mws=(p.matchweeks||[]).slice().reverse();
  return `<div class="ljsPlayerHead"><div><div class="section" style="margin-bottom:3px"><h2>👤 Player Stats</h2></div><div class="notice">Switch player to explore anyone in the league.</div></div><select data-ljs-stats-user>${opts}</select></div>
  <div class="ljsMiniGrid"><div class="ljsMini"><b>${ljsOrd(p.current_position)}</b><span>Position</span></div><div class="ljsMini"><b>${p.points??0}</b><span>Points</span></div><div class="ljsMini"><b>${p.exacts??0}</b><span>Exacts</span></div><div class="ljsMini"><b>${p.outcome_pct??0}%</b><span>Outcome</span></div><div class="ljsMini"><b>${p.points_per_prediction??0}</b><span>Pts / pick</span></div><div class="ljsMini"><b>${p.missed??0}</b><span>Missed</span></div></div>
  <div class="ljsSub"><h3>📍 Season position</h3><div class="ljsPills"><span class="ljsPill">Highest ${ljsOrd(p.highest_position)}</span><span class="ljsPill">Lowest ${ljsOrd(p.lowest_position)}</span><span class="ljsPill">Last MW ${ljsMovementHtml(p.last_mw_movement)}</span><span class="ljsPill">${p.gap_to_leader??0} pts off leader</span></div></div>
  <div class="ljsSub"><h3>🏆 Matchweek performance</h3><div class="ljsMiniGrid"><div class="ljsMini"><b>${p.matchweek_wins??0}</b><span>MW wins</span></div><div class="ljsMini"><b>${p.top_three_finishes??0}</b><span>Top 3s</span></div><div class="ljsMini"><b>${p.weeks_above_average??0}</b><span>Above avg</span></div></div>${best?`<div class="ljsRow"><span><b>Best round</b><small>Matchweek ${best.matchweek}</small></span><b>${best.points} pts · ${ljsOrd(best.position)}</b></div>`:''}${worst?`<div class="ljsRow"><span><b>Lowest round</b><small>Matchweek ${worst.matchweek}</small></span><b>${worst.points} pts · ${ljsOrd(worst.position)}</b></div>`:''}</div>
  <div class="ljsSub"><h3>🔮 Prediction style</h3><div class="ljsPills"><span class="ljsPill">Home ${pct(st.home)}%</span><span class="ljsPill">Draw ${pct(st.draw)}%</span><span class="ljsPill">Away ${pct(st.away)}%</span>${pop?`<span class="ljsPill">Favourite score ${pop.home}–${pop.away} ×${pop.uses}</span>`:''}${st.avg_goals!==null&&st.avg_goals!==undefined?`<span class="ljsPill">${st.avg_goals} predicted goals / match</span>`:''}</div></div>
  <div class="ljsSub"><h3>📅 Completed matchweeks</h3>${mws.length?mws.map(x=>`<div class="ljsRow"><span><b>MW${x.matchweek}</b><small>${x.exacts} exact${Number(x.exacts)===1?'':'s'} · weekly ${ljsOrd(x.weekly_position)}</small></span><span style="text-align:right"><b>${x.points} pts</b><small>League ${ljsOrd(x.league_position)}</small></span></div>`).join(''):'<div class="notice">No completed matchweeks yet.</div>'}</div>`;
}

function ljsBindPlayer(card,d){
  card.querySelector('[data-ljs-stats-user]')?.addEventListener('change',e=>{ ljsStatsUser=e.target.value; card.innerHTML=ljsPlayerInner(d); ljsBindPlayer(card,d); });
}

async function ljsInjectPlayerStats(){
  const main=document.getElementById('main');
  const onStats=!!document.querySelector('#nav button[data-v="stats"].active');
  if(!main||!onStats||main.querySelector('.ljsPlayerCard')) return;
  const statsHead=[...main.querySelectorAll('.card .section h2')].find(h=>h.textContent.replace('📊','').trim()==='Stats');
  if(!statsHead) return;
  const intro=statsHead.closest('.card');
  const card=document.createElement('div'); card.className='card ljsPlayerCard'; card.innerHTML='<div class="ljsEmpty">Building player stats…</div>';
  intro.insertAdjacentElement('afterend',card);
  try{
    const d=await ljsLoadProfiles(); if(!card.isConnected)return;
    const oldSeason=[...main.querySelectorAll('.card .section h2')].find(h=>h.textContent.trim()==='Your season')?.closest('.card');
    if(oldSeason) oldSeason.style.display='none';
    card.innerHTML=ljsPlayerInner(d); ljsBindPlayer(card,d);
  }catch(e){ console.warn('Player Stats:',e); if(card.isConnected) card.innerHTML=`<div class="ljsEmpty">Couldn’t load player stats yet.<br>${ljsEsc(e.message||e)}</div>`; }
}

async function ljsMaybeInject(){
  try{ await ljsInjectJourney(); await ljsInjectPlayerStats(); }catch(e){ console.warn('Journey/Stats injection:',e); }
}

ljsAddStyles();
setTimeout(ljsMaybeInject,700);
new MutationObserver(()=>{ clearTimeout(ljsTimer); ljsTimer=setTimeout(ljsMaybeInject,180); }).observe(document.body,{childList:true,subtree:true});
setInterval(ljsMaybeInject,1800);
