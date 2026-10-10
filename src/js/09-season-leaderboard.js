/* ---------- season mode + leaderboard (Supabase) ---------- */
const LB={url:"https://htlsrhdvloptctzwzbau.supabase.co",key:"sb_publishable_BSp3JNLLDR4dYPJf-EgPJg_g5t6VMa6"};   // public: the database only allows read + insert
const SEASON_DAYS=30;
const lbOn=()=>!!(LB.url&&LB.key);
const lbHdr=(x={})=>Object.assign({apikey:LB.key},LB.key.startsWith("eyJ")?{Authorization:"Bearer "+LB.key}:{},x);
function seasonLocks(on){["chaosOn","chaosLvl","chaosClear"].forEach(id=>{const el=$(id);if(el)el.disabled=on;});
  document.querySelectorAll('#chaosgrid input[type=checkbox]').forEach(el=>el.disabled=on);
  // v3.1.3: in a season upsets can't be set off by hand, and sheet breaks / hayouts can't be switched off
  document.querySelectorAll('#chaosgrid button.trig').forEach(el=>{el.disabled=on;el.title=on?"Locked during a season":"";});
  ["chaosRandom","v2dis"].forEach(id=>{const el=$(id);if(el){el.disabled=on;el.title=on?"Locked during a season":"";}});
  if(on){C.breaks=C.hays=true;}["breaks","hays"].forEach(id=>{const el=$(id);if(el){if(on)el.checked=true;el.disabled=on;}});
  document.body.classList.toggle("season-lock",on);
}
function startSeason(){newGame();S.season={on:true,end:SEASON_DAYS*1440,done:false};S.rc=null;S.outg={k:1,noticed:false,on:false,rel:{stock:1,wet:1,dry:1},plan:null};seedRun(Math.floor(Date.now()/6048e5)*2654435761);C.breaks=true;
  CH.on=true;$("chaosOn").checked=true;CH.lvl=1;$("chaosLvl").value=1;$("chaosLvlv").textContent="1×";
  EVENTS.forEach(e=>{CH.en[e.id]=true;const c=$("en-"+e.id);if(c)c.checked=true;});seasonLocks(true);
  BANNERS.push({text:`Season started: ${SEASON_DAYS} days. Make as much profit as you can.`,t:null,kind:"good"});bnNotice();}

