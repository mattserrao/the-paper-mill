/* ---------- season mode + leaderboard (Supabase) ---------- */
const LB={url:"https://htlsrhdvloptctzwzbau.supabase.co",key:"sb_publishable_BSp3JNLLDR4dYPJf-EgPJg_g5t6VMa6"};   // public: the database only allows read + insert
const SEASON_DAYS=30;
const lbOn=()=>!!(LB.url&&LB.key);
const lbHdr=(x={})=>Object.assign({apikey:LB.key},LB.key.startsWith("eyJ")?{Authorization:"Bearer "+LB.key}:{},x);
const lockWhy=auto=>`Locked ${auto?"on AUTO ":""}${survRun()?"in a survival run":"during a season"}`;
function seasonLocks(on){["chaosOn","chaosLvl","chaosClear"].forEach(id=>{const el=$(id);if(el)el.disabled=on;});
  document.querySelectorAll('#chaosgrid input[type=checkbox]').forEach(el=>el.disabled=on);
  // v3.1.3: in a season upsets can't be set off by hand, and sheet breaks / hayouts can't be switched off
  document.querySelectorAll('#chaosgrid button.trig').forEach(el=>{el.disabled=on;el.title=on?lockWhy():"";});
  {const el=$("chaosRandom");if(el){el.disabled=on;el.title=on?lockWhy():"";}}
  if(on){C.breaks=C.hays=true;}["breaks","hays"].forEach(id=>{const el=$(id);if(el){if(on)el.checked=true;el.disabled=on;}});
  // v4.2.1: in a season the area controls run on AUTO and are locked (paper colour is only a look, so it stays free)
  if(on)AUTOKEYS.forEach(k=>{if(C[k])C[k].auto=true;});
  document.querySelectorAll('#cards .row[data-key] input,#cards .row[data-key] button.auto,#balance').forEach(el=>{el.disabled=on;el.title=on?lockWhy(1):"";});
  document.body.classList.toggle("season-lock",on);
}
// v4.3: startSeason(true) starts a survival run: the same start with no end date (see 03c-survival.js)
function startSeason(surv){newGame();S.season=surv?{on:true,surv:true,end:1e12,done:false}:{on:true,end:SEASON_DAYS*1440,done:false};S.rc=null;S.outg={k:1,noticed:false,on:false,rel:{stock:1,wet:1,dry:1},plan:null};seedRun(Math.floor(Date.now()/6048e5)*2654435761);
  // v4.2.5: the bottleneck is rolled fresh for every season (it used to come from the week's seed, so the whole week shared
  // one and the first buy was always the same). Picked before the season starts, like the "any" site, so it draws no
  // stream: the week's dice are unchanged. It is saved with the season (S.bn).
  S.bn=BN_IDS[Math.floor(Math.random()*BN_IDS.length)];applyUpgrades();
  S.pal=Math.floor(Math.random()*4);   // v6.1 iso: the season's palette (spring, summer, autumn, winter; 36c), cosmetic like the bottleneck
  if(typeof civStart==="function")civStart();   // v5.1 civics: the four meters start (the leader, picked next, sets their values)
  C.breaks=true;
  CH.on=true;$("chaosOn").checked=true;CH.lvl=1;$("chaosLvl").value=1;$("chaosLvlv").textContent="1×";
  EVENTS.forEach(e=>{CH.en[e.id]=true;const c=$("en-"+e.id);if(c)c.checked=true;});seasonLocks(true);
  S.rc={i:0,p:rcAcc(),s:rcAcc(),cards:[]};   // v5.0.4: the first report card starts with the run, so upgrades bought before the first step count (it used to start at the first step)
  BANNERS.push(surv?{text:"Survival: every outage starts a rougher, dearer wave. Last as long as you can.",t:null,kind:"good",tag:"SURVIVAL"}:{text:`Season started: ${SEASON_DAYS} days. Make as much profit as you can.`,t:null,kind:"good",tag:"SEASON"});bnNotice();if(G3.labelIntro)G3.labelIntro();}

