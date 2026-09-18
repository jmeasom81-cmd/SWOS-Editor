// TAILORED WHATSAPP REMINDERS V1
// Enhances the existing owner WhatsApp reminder so completed players are never confused.
// Adds group-outstanding wording and individual per-player reminder buttons.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const twrSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

const TWR_APP='https://jmeasom81-cmd.github.io/Premier-League-Predictions-/';
let twrCtx=null,twrData=null,twrBusy=false,twrStyle='friendly',twrObserverTimer=null;

const twrEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const twrArr=v=>Array.isArray(v)?v:[];

function twrCss(){
  if(document.getElementById('twr-v1-css'))return;
  const s=document.createElement('style');
  s.id='twr-v1-css';
  s.textContent=`
    .twrBanner{background:#eefaf6;border:1px solid #b8e5d5;border-radius:13px;padding:10px 11px;margin-bottom:10px;font-size:10px;line-height:1.45;color:#356357}
    .twrBanner b{color:#08775c}
    .twrPeople{display:grid;gap:7px}
    .twrPerson{border:1px solid #ebe8f1;border-radius:13px;padding:10px;background:#faf9fd}
    .twrPersonTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .twrPerson b{font-size:10.5px}.twrPerson small{display:block;font-size:8px;color:#817d8c;margin-top:3px;line-height:1.35}
    .twrCount{font-size:9px;font-weight:950;color:#8a6500;white-space:nowrap}
    .twrButtons{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
    .twrBtn{border:0;border-radius:9px;padding:8px;font-size:9px;font-weight:950}
    .twrBtn.copy{background:#efeff6;color:#343047}
    .twrBtn.wa{background:#128c7e;color:#fff}
    .twrGroupLabel{font-size:9px;font-weight:950;color:#08775c;margin-bottom:6px}
    .twrEmpty{font-size:10px;color:#716f82;text-align:center;padding:8px}
  `;
  document.head.appendChild(s);
}

async function twrContext(){
  if(twrCtx)return twrCtx;
  const {data:{session}}=await twrSb.auth.getSession();
  if(!session)return null;

  const {data,error}=await twrSb
    .from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error)throw error;
  if(!data?.length)return null;

  twrCtx={userId:session.user.id,leagueId:data[0].league_id};
  return twrCtx;
}

async function twrLoad(force=false){
  if(twrBusy)return twrData;
  if(twrData&&!force)return twrData;
  twrBusy=true;
  try{
    const c=await twrContext();
    if(!c)return null;
    const {data,error}=await twrSb.rpc('get_owner_tailored_whatsapp_reminder',{
      p_league_id:c.leagueId
    });
    if(error)throw error;
    twrData=data||{};
    return twrData;
  }finally{
    twrBusy=false;
  }
}

function twrFirstName(x){
  return String(x?.display_name||'Player').trim().split(/\s+/)[0]||'Player';
}

function twrDate(iso,short=false){
  if(!iso)return 'No deadline';
  return new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/London',
    weekday:short?'short':'long',
    day:short?'numeric':undefined,
    month:short?'short':undefined,
    hour:'2-digit',
    minute:'2-digit'
  }).format(new Date(iso));
}

function twrNames(rows){
  const names=rows.map(twrFirstName);
  if(!names.length)return '';
  if(names.length===1)return names[0];
  if(names.length===2)return `${names[0]} and ${names[1]}`;
  return `${names.slice(0,-1).join(', ')} and ${names[names.length-1]}`;
}

function twrLine(x,compact=false){
  const n=Number(x.missing||0);
  return compact
    ? `${twrFirstName(x)} ${n} left · ${twrDate(x.next_missing_lock,true)}`
    : `• ${x.display_name||'Player'} — *${n} ${n===1?'prediction':'predictions'} left* · next missing deadline ${twrDate(x.next_missing_lock,false)}`;
}

function twrGroupMessage(d,style='friendly'){
  const rows=twrArr(d?.outstanding);
  const mw=Number(d?.target_matchweek||0);

  if(!rows.length){
    return `✅ Everyone has completed Matchweek ${mw}.\n\nNo reminder needed.`;
  }

  const who=twrNames(rows);

  if(style==='short'){
    return [
      `⏳ *MW${mw} — outstanding picks only*`,
      '',
      `${who}: this one is for you.`,
      `Everyone else is already complete ✅`,
      '',
      ...rows.map(x=>twrLine(x,true)),
      '',
      `Miss the lock = 0 points for that match.`,
      TWR_APP
    ].join('\n');
  }

  if(style==='banter'){
    return [
      `🚨 *Prediction intervention — MW${mw}*`,
      '',
      `This message is aimed at *${who}* only 😂`,
      `Everyone else can enjoy the rare feeling of being organised ✅`,
      '',
      ...rows.map(x=>twrLine(x,false)),
      '',
      `⏰ Your times above are your own next missing deadlines — not somebody else's.`,
      `Miss a lock and that game is a big fat 0️⃣.`,
      '',
      `📲 Sort yourselves out here:`,
      TWR_APP
    ].join('\n');
  }

  return [
    `⏳ *Premier League Predictions — outstanding picks only*`,
    '',
    `This reminder is for *${who}*.`,
    `If your name isn't listed, you've already completed Matchweek ${mw} ✅`,
    '',
    ...rows.map(x=>twrLine(x,false)),
    '',
    `⏰ Each deadline above is personalised to that player's next missing prediction.`,
    `If a fixture locks without a prediction, it scores 0 points.`,
    '',
    `📲 *Open the app:*`,
    TWR_APP
  ].join('\n');
}

function twrIndividualMessage(d,x,style='friendly'){
  const mw=Number(d?.target_matchweek||0);
  const name=twrFirstName(x);
  const missing=Number(x?.missing||0);
  const nextCount=Number(x?.next_missing_count||0);
  const deadline=twrDate(x?.next_missing_lock,false);
  const fixtures=twrArr(x?.next_fixtures);
  const firstFixture=fixtures[0];
  const fixtureText=firstFixture
    ? `${firstFixture.home_team} v ${firstFixture.away_team}${nextCount>1?` + ${nextCount-1} more at the same deadline`:''}`
    : '';

  if(style==='short'){
    return [
      `⏳ ${name} — MW${mw}`,
      `${missing} ${missing===1?'prediction':'predictions'} left.`,
      `Next missing deadline: ${deadline}.`,
      fixtureText||null,
      `Miss the lock = 0 pts.`,
      TWR_APP
    ].filter(Boolean).join('\n');
  }

  if(style==='banter'){
    return [
      `Oi ${name} 👀`,
      '',
      `You've still got *${missing} MW${mw} ${missing===1?'prediction':'predictions'}* to sort.`,
      `Your next missing ${nextCount===1?'pick locks':'picks lock'} *${deadline}*.`,
      fixtureText?`⚽ ${fixtureText}`:null,
      '',
      `Don't donate free points to the rest of us 😂`,
      `Miss the lock = 0 points.`,
      '',
      TWR_APP
    ].filter(Boolean).join('\n');
  }

  return [
    `Hi ${name} 👋`,
    '',
    `Quick prediction reminder — you still have *${missing} Matchweek ${mw} ${missing===1?'prediction':'predictions'}* outstanding.`,
    `Your next missing ${nextCount===1?'prediction locks':'predictions lock'} *${deadline}*.`,
    fixtureText?`⚽ ${fixtureText}`:null,
    '',
    `If a fixture locks without a prediction, it scores 0 points.`,
    '',
    `📲 Finish them here:`,
    TWR_APP
  ].filter(Boolean).join('\n');
}

async function twrCopy(text,btn){
  try{
    await navigator.clipboard.writeText(text);
  }catch{
    const t=document.createElement('textarea');
    t.value=text;
    t.style.position='fixed';
    t.style.opacity='0';
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
  if(btn){
    const old=btn.textContent;
    btn.textContent='✓ Copied';
    setTimeout(()=>btn.textContent=old,1200);
  }
}

function twrOpenWhatsApp(text){
  const url=`https://wa.me/?text=${encodeURIComponent(text)}`;
  const w=window.open(url,'_blank','noopener');
  if(!w)location.href=url;
}

function twrPeoplePanel(d){
  const rows=twrArr(d?.outstanding);
  if(!rows.length){
    return `<div class="waPanel twrIndividuals"><div class="waPanelHead"><h2>Individual reminders</h2><span>Outstanding only</span></div><div class="twrEmpty">✅ Nobody needs an individual reminder.</div></div>`;
  }

  return `<div class="waPanel twrIndividuals">
    <div class="waPanelHead"><h2>Individual reminders</h2><span>Only people still outstanding</span></div>
    <div class="twrBanner"><b>Completed players are excluded.</b> Each message below uses that person's own remaining count and next missing deadline.</div>
    <div class="twrPeople">
      ${rows.map((x,i)=>`<div class="twrPerson" data-twr-person="${i}">
        <div class="twrPersonTop">
          <div>
            <b>${twrEsc(x.badge||'⚽')} ${twrEsc(x.display_name||'Player')}</b>
            <small>${Number(x.completed||0)}/${Number(x.total||0)} done · next missing deadline ${twrEsc(twrDate(x.next_missing_lock,true))}</small>
          </div>
          <span class="twrCount">${Number(x.missing||0)} left</span>
        </div>
        <div class="twrButtons">
          <button type="button" class="twrBtn copy" data-twr-copy="${i}">Copy ${twrEsc(twrFirstName(x))}</button>
          <button type="button" class="twrBtn wa" data-twr-wa="${i}">WhatsApp ${twrEsc(twrFirstName(x))}</button>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

function twrApplyGroup(){
  const o=document.querySelector('.waOverlay');
  const box=o?.querySelector('.waText');
  if(!o||!box||!twrData)return;
  box.value=twrGroupMessage(twrData,twrStyle);

  const head=o.querySelector('.waPanelHead h2');
  if(head&&head.textContent==='WhatsApp message'){
    const span=head.parentElement?.querySelector('span');
    if(span)span.textContent='Outstanding players only';
  }
}

async function twrEnhance(force=false){
  const o=document.querySelector('.waOverlay');
  if(!o)return;

  try{
    const d=await twrLoad(force);
    if(!d||!document.querySelector('.waOverlay'))return;

    const body=o.querySelector('.waBody');
    if(!body)return;

    let banner=body.querySelector('.twrGroupBanner');
    if(!banner){
      banner=document.createElement('div');
      banner.className='twrBanner twrGroupBanner';
      const firstPanel=body.querySelector('.waPanel');
      if(firstPanel)firstPanel.after(banner);
      else body.prepend(banner);
    }

    const count=Number(d.outstanding_count||0);
    banner.innerHTML=count
      ? `<b>${count} ${count===1?'player is':'players are'} still outstanding.</b> The generated group message names only them. Anyone already complete is explicitly told they can ignore it.`
      : `<b>Everybody is complete.</b> No reminder needs to be sent.`;

    body.querySelector('.twrIndividuals')?.remove();
    const msgPanel=[...body.querySelectorAll('.waPanel')].find(p=>(p.querySelector('h2')?.textContent||'').includes('WhatsApp message'));
    if(msgPanel){
      msgPanel.insertAdjacentHTML('beforebegin',twrPeoplePanel(d));
    }

    body.querySelectorAll('[data-twr-copy]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const x=twrArr(d.outstanding)[Number(btn.dataset.twrCopy)];
        if(x)twrCopy(twrIndividualMessage(d,x,twrStyle),btn);
      });
    });

    body.querySelectorAll('[data-twr-wa]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const x=twrArr(d.outstanding)[Number(btn.dataset.twrWa)];
        if(x)twrOpenWhatsApp(twrIndividualMessage(d,x,twrStyle));
      });
    });

    twrApplyGroup();
  }catch(e){
    console.warn('Tailored WhatsApp reminders:',e);
  }
}

document.addEventListener('click',e=>{
  const styleBtn=e.target.closest?.('.waStyleBtn[data-wa-style]');
  if(styleBtn){
    twrStyle=styleBtn.dataset.waStyle||'friendly';
    setTimeout(()=>twrApplyGroup(),30);
  }
});

const twrObs=new MutationObserver(()=>{
  if(!document.querySelector('.waOverlay'))return;
  clearTimeout(twrObserverTimer);
  twrObserverTimer=setTimeout(()=>twrEnhance(false),180);
});
twrObs.observe(document.body,{childList:true,subtree:true});

window.addEventListener('focus',()=>{
  if(document.querySelector('.waOverlay')){
    twrData=null;
    twrEnhance(true);
  }
});

twrCss();
setTimeout(()=>twrEnhance(false),800);
