import fs from 'node:fs';
import path from 'node:path';

const FILE='dist/index.html';
const BUILD='v1.35.0';

if(!fs.existsSync(FILE)) throw new Error('SWOS Studio v1.35.0 build failed: dist/index.html is missing.');

let html=fs.readFileSync(FILE,'utf8');

if(!html.includes('<title>SWOS Studio v1.34.0</title>')) {
  throw new Error('SWOS Studio v1.35.0 build failed: expected v1.34.0 generated output was not found.');
}

html=html.replace('<title>SWOS Studio v1.34.0</title>','<title>SWOS Studio v1.35.0</title>');
html=html.replace("const BUILD = 'v1.34.0';","const BUILD = 'v1.35.0';");
html=html.replace("var VERSION='v1.34.0';","var VERSION='v1.35.0';");

const css=`
<style id="swos-v135-transfer-allowance-styles">
  .transfer-allowance-meter{border:1px solid rgba(245,213,71,.42);background:linear-gradient(180deg,rgba(245,213,71,.08),rgba(9,20,33,.94));border-radius:12px;padding:11px;margin-top:10px}
  .transfer-allowance-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
  .transfer-allowance-head strong{font-size:14px}
  .transfer-allowance-head span{font-size:11px;font-weight:900;white-space:nowrap}
  .transfer-allowance-bar{height:9px;border-radius:999px;overflow:hidden;background:#07111f;border:1px solid var(--line);margin-top:9px}
  .transfer-allowance-fill{height:100%;background:linear-gradient(90deg,var(--green),var(--yellow));transition:width .2s ease}
  .transfer-allowance-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}
  .transfer-allowance-stat{border:1px solid var(--line);background:#07111f;border-radius:9px;padding:8px;text-align:center}
  .transfer-allowance-stat small{display:block;color:var(--muted);font-size:7px;text-transform:uppercase;letter-spacing:.06em}
  .transfer-allowance-stat b{display:block;font-size:16px;margin-top:2px}
  .transfer-allowance-note{font-size:9px;color:var(--muted);line-height:1.45;margin-top:8px}
  .transfer-allowance-meter.unlimited{border-color:rgba(66,209,132,.55);background:linear-gradient(180deg,rgba(66,209,132,.09),rgba(9,20,33,.94))}
  .transfer-allowance-meter.unlimited .transfer-allowance-head span{color:var(--green)}
  .transfer-allowance-meter.exhausted{border-color:rgba(255,102,102,.55)}
  .transfer-allowance-meter.exhausted .transfer-allowance-head span{color:var(--red)}
  @media(max-width:430px){.transfer-allowance-stats{gap:5px}.transfer-allowance-stat{padding:7px 4px}.transfer-allowance-stat b{font-size:14px}}
</style>`;

html=html.replace('</head>',css+'\n</head>');

const js=String.raw`
<script id="swos-v135-transfer-allowance-layer">
(function(){
  var LIMIT=5;
  function safe(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function allowance(counter){
    var n=Number(counter);
    if(n===255)return {mode:'unlimited',used:null,left:null,pct:100,label:'Unlimited'};
    if(Number.isInteger(n)&&n>=0&&n<=LIMIT){
      return {mode:n>=LIMIT?'exhausted':'normal',used:n,left:Math.max(0,LIMIT-n),pct:Math.max(0,Math.min(100,(n/LIMIT)*100)),label:(LIMIT-n)+' left'};
    }
    return {mode:'unknown',used:n,left:null,pct:0,label:'Counter '+safe(n)};
  }
  function meterMarkup(counter){
    var a=allowance(counter);
    if(a.mode==='unlimited'){
      return '<div class="transfer-allowance-meter unlimited" data-transfer-counter="'+counter+'">'+
        '<div class="transfer-allowance-head"><strong>Season transfer allowance</strong><span>UNLIMITED</span></div>'+
        '<div class="transfer-allowance-stats"><div class="transfer-allowance-stat"><small>Normal cap</small><b>5</b></div><div class="transfer-allowance-stat"><small>Mode</small><b>FF</b></div><div class="transfer-allowance-stat"><small>Remaining</small><b>∞</b></div></div>'+
        '<div class="transfer-allowance-note">Unlimited mode is already verified in this career format. The separate squad-size limit still applies.</div>'+
      '</div>';
    }
    if(a.mode==='unknown'){
      return '<div class="transfer-allowance-meter" data-transfer-counter="'+counter+'">'+
        '<div class="transfer-allowance-head"><strong>Season transfer allowance</strong><span>NON-STANDARD</span></div>'+
        '<div class="transfer-allowance-stats"><div class="transfer-allowance-stat"><small>Normal cap</small><b>5</b></div><div class="transfer-allowance-stat"><small>Raw counter</small><b>'+safe(counter)+'</b></div><div class="transfer-allowance-stat"><small>Remaining</small><b>?</b></div></div>'+
        '<div class="transfer-allowance-note">Studio will not guess a remaining allowance for an unexpected counter value.</div>'+
      '</div>';
    }
    return '<div class="transfer-allowance-meter '+(a.mode==='exhausted'?'exhausted':'')+'" data-transfer-counter="'+counter+'">'+
      '<div class="transfer-allowance-head"><strong>Season transfer allowance</strong><span>'+a.left+' LEFT</span></div>'+
      '<div class="transfer-allowance-bar"><div class="transfer-allowance-fill" style="width:'+a.pct+'%"></div></div>'+
      '<div class="transfer-allowance-stats"><div class="transfer-allowance-stat"><small>Used</small><b>'+a.used+'/5</b></div><div class="transfer-allowance-stat"><small>Remaining</small><b>'+a.left+'</b></div><div class="transfer-allowance-stat"><small>Counter</small><b>'+a.used+'</b></div></div>'+
      '<div class="transfer-allowance-note">The normal SWOS career cap is five purchases per season. Your verified test saves showed this byte increasing 0 → 1 → 2 after successive purchases, so Studio can now turn the raw counter into a useful remaining allowance.</div>'+
    '</div>';
  }
  function insertMeter(card,counter,anchor){
    if(!card)return;
    var old=card.querySelector(':scope > .transfer-allowance-meter');
    var sig=String(counter);
    if(old&&old.dataset.transferCounter===sig)return;
    if(old)old.remove();
    var wrap=document.createElement('div');
    wrap.innerHTML=meterMarkup(counter);
    var meter=wrap.firstElementChild;
    if(anchor&&anchor.parentNode===card)anchor.insertAdjacentElement('afterend',meter); else card.appendChild(meter);
  }
  function updateSimple(counter){
    var cards=Array.from(document.querySelectorAll('.friendly-card'));
    var card=cards.find(function(c){var h=c.querySelector('h3');return h&&/Unlimited transfers/i.test(h.textContent||'');});
    if(card)insertMeter(card,counter,card.querySelector('.row'));
    Array.from(document.querySelectorAll('.fact')).forEach(function(f){
      var s=f.querySelector('small'),b=f.querySelector('strong');
      if(s&&b&&/^Transfers$/i.test((s.textContent||'').trim())){
        var a=allowance(counter);
        b.textContent=a.mode==='unlimited'?'Unlimited':a.mode==='unknown'?'Counter '+counter:a.left+' left';
      }
    });
  }
  function updateAdvanced(counter){
    var cards=Array.from(document.querySelectorAll('.card.stack'));
    var card=cards.find(function(c){var h=c.querySelector('h3');return h&&/Career transfers/i.test(h.textContent||'');});
    if(!card)return;
    insertMeter(card,counter,card.querySelector('.facts'));
    var facts=Array.from(card.querySelectorAll('.fact'));
    facts.forEach(function(f){
      var s=f.querySelector('small'),b=f.querySelector('strong');
      if(!s||!b||!/Transfer mode/i.test(s.textContent||''))return;
      var a=allowance(counter);
      if(a.mode==='unlimited')b.textContent='UNLIMITED · FF';
      else if(a.mode==='unknown')b.textContent='Counter '+counter;
      else b.textContent=a.left+' left · '+a.used+'/5 used';
    });
  }
  function releaseNote(){
    if(document.getElementById('v135-release-card'))return;
    var anchor=document.getElementById('v134-release-card')||document.getElementById('v1331-release-card')||document.getElementById('v133-release-card');
    if(!anchor)return;
    var card=document.createElement('div');
    card.id='v135-release-card';
    card.className='card stack v133-release-card';
    card.innerHTML='<strong>New in v1.35.0 — Transfer Allowance</strong>'+
      '<span class="about">• Career screens now translate the verified transfer-control byte into purchases used and purchases remaining.</span>'+
      '<span class="about">• Normal careers use the documented five-purchase seasonal allowance; FF continues to display as Unlimited.</span>'+
      '<span class="about">• Unexpected counter values are shown as non-standard rather than guessed.</span>'+
      '<span class="about">• This release is display-only for transfer allowance. It adds no new .CAR write routine.</span>';
    anchor.insertAdjacentElement('beforebegin',card);
  }
  function updateVersion(){
    document.title='SWOS Studio v1.35.0';
    document.querySelectorAll('.eyebrow').forEach(function(el){
      var t=el.textContent||'';
      if(/v1\.34\.0/.test(t))el.textContent=t.replace('v1.34.0','v1.35.0');
    });
  }
  function apply(){
    updateVersion();
    releaseNote();
    if(typeof state==='undefined'||state.kind!=='career'||!state.career)return;
    var counter=state.career.transferCounter;
    updateSimple(counter);
    updateAdvanced(counter);
  }
  var busy=false;
  function queue(){
    if(busy)return;
    busy=true;
    requestAnimationFrame(function(){
      try{apply();}catch(e){console.warn('Transfer allowance layer',e);}
      finally{busy=false;}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue);else queue();
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
})();
</script>`;

html=html.replace('</body>',js+'\n</body>');

fs.writeFileSync(FILE,html,'utf8');
console.log('Built SWOS Studio '+BUILD+' Transfer Allowance.');
