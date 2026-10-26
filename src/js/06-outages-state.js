/* ---------- v3.0.0: planned outages (season mode) ----------
   Every 7th season day (days 7, 14, 21, 28) the mill takes a controlled 4-hour shutdown starting 8 AM. 24 h ahead the
   player sets a maintenance budget per area: $20k = 10% less reliable, $70k = no change, $170k = 20% more reliable
   (survival from v5.0.6: $40k = 35% less, $70k, $120k = 25% more; see OUT below)
   (v10 economy balance: was $50k / $100k / $200k).
   The new reliability takes effect when the outage ends and lasts until the next one. */
const OUT={get every(){return survRun()?SURV.every:7;},   // v4.4.0-t3: survival has an outage every 4 days (a wave), seasons every 7
  hour:8,len:240,
  // v5.0.6 survival: the cheapest budget won by ~6 days (repairs don't rise with the wave, so $20k for 10% more breakdowns
  // was a bargain) and the top one lost. Survival now: $40k = 35% more breakdowns, $70k = no change, $120k = 25% fewer
  // (10 matched seeds, buyer bot, desert, Chip: cheapest 40.2 d, standard 42.6, top when cash > $1.5M 45.0). Seasons unchanged.
  get cost(){return survRun()?[40e3,70e3,120e3]:[20e3,70e3,170e3];},get rel(){return survRun()?[1.35,1,0.75]:[1.1,1,0.8];},
  simCap:5,   // simCap: the clock while the player watches the crews (v5.0.6: opt-in)
 
  jobs:["1st press roll change","Forming fabric (wire) change","Pulper rotor and extraction plate change","Refiner plate change"],
  areas:[["stock","Stock prep","pulper, cleaners, screens, refiners, thickener"],["wet","Wet end","headbox, forming fabric, press felts"],["dry","Dry end","dryers, steam joints, reel, winder"]],
  ev:{stock:["refclash","ragger","overflow","dye","hdblow","lwplug","cscreen","fscreen","lcplug","thkblow","chestover"],wet:["fabric","felt","slime","fogfan"],dry:["shaft","dryerfire","wrap","steamjoint","winderdown","tiedrolls","boiler"]},area:{}};
for(const a in OUT.ev)OUT.ev[a].forEach(id=>OUT.area[id]=a);
const outStart=k=>(OUT.every*k-1)*1440+(OUT.hour-6)*60;
// v4.3: which of the four major jobs outage k does (1-4). A season has four outages; in survival they go round again.
const outJob=k=>((k-1)%OUT.jobs.length)+1;
function outRel(a){const o=S&&S.outg;return o&&o.rel?o.rel[a]:1;}
const outOn=()=>!!(S&&S.outg&&S.outg.on);
function outageTick(){const o=S.outg;if(!o||!S.season||!S.season.on||S.zen||S.over)return;
  if(o.on){if(S.t>=o.end)endOutage();return;}
  const st=outStart(o.k);if(st+OUT.len>S.season.end)return;
  if(!o.noticed&&S.t>=st-1440){if(S.cards&&S.cards.open)return;if(S.civ&&(S.civ.pending||S.civ.cur))return;   /* (v5.1 QA: waits for a standing-order toast) */o.noticed=true;openOutagePlan();return;}
  if(o.noticed&&S.t>=st)beginOutage();}
let outEl=null;
function outShell(){if(!outEl){outEl=document.createElement("div");outEl.className="overlay";outEl.id="outOv";outEl.hidden=true;document.body.appendChild(outEl);}clearTimeout(outEl._t);outEl.classList.remove("note");return outEl;}
const outTime=t=>hhmm(t).replace(" · "," at ");
const hourOf=t=>{const h=Math.floor(((t+360)%1440)/60);return `${h%12||12} ${h<12?"AM":"PM"}`;};
function openOutagePlan(){if(G3.yieldUI)G3.yieldUI();const o=S.outg,st=outStart(o.k),first=o.k===1,d0=S.cash<0?0:1,pick={stock:d0,wet:d0,dry:d0};   // v5.0.4: in the red, the budgets start at the cheapest
  const COST=OUT.cost,lp=leadPlanNew();   // v4.4 survival leaders: lp is the leader's pick for this outage (and the run's one change of leader)
  running=false;S.cards.open={outage:true};
  const el=outShell(),k=n=>"$"+Math.round(n/1e3)+"k";
  const relPct=v=>Math.round(Math.abs(1-OUT.rel[v])*100);   // (v5.0.6: from OUT.rel, which differs in survival)
  const effTxt=(v,a)=>{const w=a==="stock"?"breakdowns":"breakdowns and sheet breaks";return v===0?["bad",`Reliability −⁠${relPct(0)}%: more `+w]:v===2?["ok",`Reliability +${relPct(2)}%: fewer `+w]:["","Reliability unchanged"];};
  el.innerHTML=`<div class="modal deal outg" role="dialog" aria-modal="true" aria-labelledby="out-h"><span class="dk">${survOn()?`Wave ${o.k} · planned outage`:`Planned outage ${o.k} of 4`} · sim paused</span>
    <h2 id="out-h">${first?"Your first planned outage":"Outage in 24 hours"}</h2>
    ${first?`<div class="intro"><p><b>What's an outage?</b> Planned downtime. Every ${OUT.every} days the mill comes down on purpose for a controlled 4-hour shutdown, so crews can inspect, clean, repair and replace worn parts before they fail.</p>
      <p><b>Why it matters:</b> well-maintained equipment breaks down less and runs better, with fewer sheet breaks and hayouts. Your budget for each area sets its reliability until the next outage.</p></div>`:""}
    <p class="when">Starts <b>${outTime(st)}</b>, back up by <b>${hourOf(st+OUT.len)}</b> (4 hours, machine and stock prep down).<br>Major job: <b>${OUT.jobs[outJob(o.k)-1]||"inspections"}</b>, plus new press felts.</p>${survOn()?survPlanNote(o.k):""}<div id="out-lead"></div><div id="out-prep"></div><div id="out-rly"></div>${typeof civPlanHTML==="function"?civPlanHTML():""}
    <div>${OUT.areas.map(([a,n,d])=>`<div class="orow" data-a="${a}"><div><b>${n}</b><small>${d}</small></div><div class="seg">${COST.map((c,i)=>`<button data-v="${i}" aria-pressed="${i===d0}">${k(c)}</button>`).join("")}</div><em class="eff"></em></div>`).join("")}</div>
    <div class="otot"><div><span>Outage budget</span><small id="out-cash"></small></div><b id="out-tot"></b></div>
    <div class="btns"><button class="primary" id="out-ok" style="flex:1">Approve budget</button></div></div>`;
  const paint=()=>{el.querySelectorAll(".orow").forEach(r=>{const a=r.dataset.a,v=pick[a];r.querySelectorAll(".seg button").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.v===v)));
      const [c,t]=effTxt(v,a),e=r.querySelector(".eff");e.className="eff "+c;e.textContent=t;});
    const tot=Object.values(pick).reduce((s,v)=>s+COST[v],0)+civPlanCost(o._civ&&o._civ.civ)+rlyPlanCost();document.getElementById("out-tot").textContent=money(tot);
    document.getElementById("out-cash").textContent="Cash on hand "+money(S.cash);document.getElementById("out-ok").textContent=`Approve ${money(tot)} budget`;};
  el.querySelectorAll(".orow").forEach(r=>r.querySelectorAll(".seg button").forEach(b=>b.addEventListener("click",()=>{pick[r.dataset.a]=+b.dataset.v;paint();})));
  document.getElementById("out-ok").addEventListener("click",()=>{const tot=Object.values(pick).reduce((s,v)=>s+COST[v],0);spend(tot,"repairs");OUT.areas.forEach(([a])=>pfAdd("rep",a==="stock"?"stock":"pm",COST[pick[a]]));pfAdd("repid","outage",tot);histEv("outage",tot);
    const cpc=o._civ&&o._civ.civ;if(cpc&&civPlanCost(cpc))civPay(civPlanCost(cpc));   // v5.1 civics levers
    o.plan={...pick};if(cpc)o.plan.civ=cpc;delete o._civ;rlyPlanBook(o);   /* v6.10 changeouts (07i) */if(lp)o.plan.lead={to:lp.to,pick:lp.pick};log(`Outage ${o.k} budget approved: ${money(tot)} (${OUT.areas.map(([a,n])=>n+" "+k(COST[pick[a]])).join(", ")})`,"warn");
    el.hidden=true;closeCard(true);});
  o._civ={};if(civOn()){civPlanWire(el,o._civ);el.querySelectorAll(".civplan .seg button").forEach(b=>b.addEventListener("click",()=>paint()));}
  paint();if(lp)leadPlanMount(document.getElementById("out-lead"),lp);if(G3.prepMount)G3.prepMount(document.getElementById("out-prep"));if(G3.rlyPlanMount)G3.rlyPlanMount(document.getElementById("out-rly"),paint);   /* v5.7 outage prep */el.hidden=false;AUDIO.sfx("cash",150);document.getElementById("out-ok").focus({preventScroll:true});el.querySelector(".modal").scrollTop=0;}   // v5.0.4: opens at the top
function outNote(head,body,ms,btn){   // v5.0.5: with an event card open, the notice waits until the card is answered, so it never covers the card's buttons
  // v5.0.6: it also waits while the card's result toast is showing, so it never lands on top of it
  {const d=document.getElementById("dealOv"),busy=()=>!!(d&&!d.hidden&&((S.cards&&S.cards.open&&S.cards.open.c)||d.classList.contains("dealres")));clearInterval(outNote._w);
   if(busy()){outNote._w=setInterval(()=>{if(!busy()){clearInterval(outNote._w);if(S.outg&&S.outg.on||!btn)outNote(head,body,ms,btn);}},200);return;}}
  const el=outShell();el.classList.add("note");
  el.innerHTML=`<div class="modal deal" role="status"><span class="dk">Planned outage</span><h2>${head}</h2><p>${body}</p><div class="btns">${btn?`<button class="primary" id="out-watch">${btn.label}</button>`:""}<div class="dtimer"><i style="animation-duration:${ms/1000}s"></i></div></div></div>`;
  el.hidden=false;const m=el.querySelector(".modal");m.addEventListener("click",()=>{el.hidden=true;},{once:true});
  if(btn)el.querySelector("#out-watch").addEventListener("click",btn.on);   // (the click also closes the notice, through the modal's own listener)
  el._t=setTimeout(()=>{el.hidden=true;},ms);}
// v5.0.6: the "Outage has begun" notice offers to slow the clock (OUT.simCap) and fly the camera to the job
const OUT_CAM={1:"pm",2:"pm",3:"pulp",4:"pulp"};
function outWatch(){const o=S.outg;if(!o||!o.on)return;o.watch=true;if(G3.jump)G3.jump(OUT_CAM[outJob(o.k)]||"pm",0.7);log(`Watching the outage crews at ${OUT.simCap} min/s (− or + to speed back up)`,"ok");}
const outNoteHide=()=>{if(outEl&&outEl.classList.contains("note")){clearTimeout(outEl._t);clearInterval(outNote._w);outEl.hidden=true;}};
function beginOutage(){const o=S.outg,st=S.t;if(!o.plan)o.plan={stock:1,wet:1,dry:1};o.on=true;o.watch=false;o.end=st+OUT.len;
  if(S.lead&&o.plan.lead&&o.plan.lead.to)leadChange(o.plan.lead.to);   // v4.4: the one change of leader happens as the outage starts
  // (the clock runs at no more than OUT.simCap while o.on, through simRate(); the player's own speed is left alone)
  addFx({id:"pout",left:OUT.len,mods:{pmDown:"planned outage",pulperDown:1}});AUDIO.sfx("clunk",400);
  if(typeof civOutageBegin==="function")civOutageBegin(o,st);   // v5.1 civics: Labor sets how long it runs
  prepBegin(o,st);   // v5.7 outage prep: completed checklist items take minutes off
  rlyOutageBegin(o);   // v6.10: booked changeouts add minutes (07i)
  log(`Planned outage ${o.k} has begun: down until ${clockOf(o.end)}`,"warn");BANNERS.push({text:`Planned outage: the mill is down until ${clockOf(o.end)}.`,t:null,kind:"good",tag:"OUTAGE"});
  const canWatch=C.simSpeed>OUT.simCap&&!TURBO_FAST(C.simSpeed);   // (at 5 min/s or slower there is nothing to slow down)
  outNote("Outage has begun",`The mill is down for planned maintenance: ${(OUT.jobs[outJob(o.k)-1]||"inspections").toLowerCase()} and new press felts. Started ${hourOf(st)}, ends ${outTime(o.end)}.${o.prep?`<br><b>${prepLine(o.prep.n,o.prep.m)}.</b>`:""}`,canWatch?7000:5000,canWatch?{label:"Watch the crews",on:outWatch}:null);}
function endOutage(){const o=S.outg,pl=o.plan||{stock:1,wet:1,dry:1};o.on=false;o.watch=false;outNoteHide();   // v5.0.6: at the player's speed the outage can end before its 7 s notice does
  S.fx=S.fx.filter(f=>f.id!=="pout");S.M=mods();
  o.spd=null;   // (v5.0.1: nothing to restore: the outage only capped the running speed, see simRate)
  o.rel={stock:OUT.rel[pl.stock],wet:OUT.rel[pl.wet],dry:OUT.rel[pl.dry]};
  const rp=v=>Math.round(Math.abs(1-OUT.rel[v])*100),txt=OUT.areas.map(([a,n])=>`${n} ${pl[a]===2?rp(2)+"% fewer":pl[a]===0?rp(0)+"% more":"the usual rate (budget kept it even)"}`).join(" · ");   // (t4: plain words, not ±0%)
  BANNERS.push({text:`Outage ${o.k} complete. Breakdowns until the next outage: ${txt}`,t:null,kind:"good",tag:"OUTAGE"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Outage ${o.k} complete. Breakdowns until the next outage: ${txt}`,"ok");
  if(!survOn())outNote("Outage complete",`Restarting the mill. Breakdowns until the next outage: ${txt}.`,4000);   // (survival: the wave report card says it)
  if(S.lead)leadOutageEnd(pl.lead);   // v4.4: the leader's pick for this outage is now part of the mill
  if(S.lead&&leadOverrun()>0){const m=leadOverrun();addFx({id:"felrun",left:m,mods:{pmDown:"project tie-ins"}});   // v4.4.0-t3: Felicity's projects make outages overrun
    log(`Project tie-ins: the machine stays down ${m>=60?(m/60).toFixed(m%60?1:0)+" h":m+" min"} longer.`,"warn");}
  if(typeof civOutageEnd==="function")civOutageEnd(o,pl);   // v5.1 civics: the levers, an overrun
  rlyOutageEnd(o,pl);   // v6.10: the major job and the booked changeouts renew their equipment (07i)
  prepEnd(o,OUT.areas.reduce((s,[a])=>s+(OUT.cost[pl[a]]||0),0));o.prep=null;   // v5.7 outage prep: part of the budget back
  o.k++;o.noticed=false;o.plan=null;if(survOn())survWaveStart();}
const HAYLINES=["HAYOUT! Paper is shooting to the roof!","Winder hayout! Every PM hand to the dry end!","Hayout! It's snowing paper in the winder aisle.","Hayout! The set exploded off the drums."];
// a hayout ruins the outer wraps of the set on the winder (about 3 t), not the whole 12.5 t roll
// v2.9.5: reels at the winder (on the unwind + in storage); a reel turns up a fraction over 100 t, which used to make the
// unwind reel count as "more than one" and block storage, so the machine stopped with storage empty
// v6.11: a lot is [grade, quantity, roll width in inches] (100" when not given: the standard roll). Quantities of rolls are in
// standard-roll units (C.rollW.v tons each), so a 90" roll is 0.9 of a unit and every tons conversion stays rolls x C.rollW.v
// v6.11.2: a lot is [grade, quantity, width, area ratio]: the ratio is the grade's target weight over the weight it was made at
// (1.05 = 5% more ft² a ton than standard), blended by quantity when lots merge. Paper is sold by area (07g areaF).
function lotPut(L,g,q,w,a){if(!(q>0))return;w=w||100;a=a||1;const t=L[L.length-1];if(t&&t[0]===g&&(t[2]||100)===w){const r=t[3]||1;if(a!==r)t[3]=(r*t[1]+a*q)/(t[1]+q);t[1]+=q;}else L.push([g,q,w,a]);}
// take q from the front of lots L (into lots `out` if given); returns what was taken
function lotTake(L,q,out){let got=0;while(q>1e-9&&L.length){const h=L[0],k=Math.min(h[1],q);h[1]-=k;q-=k;got+=k;if(out)lotPut(out,h[0],k,h[2],h[3]);if(h[1]<=1e-9)L.shift();}return got;}
// the quantity-weighted area ratio of lots L (1 when empty)
function lotA(L){let q=0,a=0;for(const l of L||[]){q+=l[1];a+=l[1]*(l[3]||1);}return q>1e-9?a/q:1;}
// the value of lots of rolls at today's price for each grade
const lotValue=(L,tPerRoll,add=0)=>L.reduce((s,[g,q,,a])=>s+q*tPerRoll*(priceOf(g)*(a||1)+add),0);   // (v6.11.2: sold by area)
function reelsAtWinder(){return Math.max(0,Math.ceil(S.winderBuf/P.jumbo-0.005));}
function hayout(a=rand("upx"),b=rand("upx")){AUDIO.sfx("hayout",600);S.wd="hayout";S.hayLeft=40+a*40;S.hayTotal=S.hayLeft;enqueue("hay");
  const extra=Math.min(S.winderBuf,2+b*4),wraps=Math.min(S.winderAcc,P.jumbo/32),loss=extra+wraps;S.winderBuf-=extra;S.winderAcc-=wraps;lotTake(S.lots.buf,extra);lotTake(S.lots.acc,wraps);S.tot.broke+=loss;S.tot.hayouts++;S.q.bank+=loss;pfW("broke",loss);   // (v6.5.6: hayout broke goes to the beater bay and is repulped; it used to vanish)
 
  BANNERS.push({text:HAYLINES[Math.floor(Math.random()*HAYLINES.length)],t:null,id:"hay"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Winder hayout: ${loss.toFixed(1)} t of paper to the beater`,"bad");}
function initCtrl(){
  C={inRate:{v:1.8,auto:true},drivers:{v:3,auto:true},pulper:{v:40,auto:true},lvlTarget:{v:50},lowLevel:{v:30},
     pmSp:{v:2632,auto:true},rollW:{v:100/8},loaders:{v:2,auto:true},outRate:{v:1,auto:true},grade:"24",breaks:true,hays:true,wdr:{v:45,auto:true},simSpeed:10};
}
function initState(){
  S={u:UNITS_V,date0:new Date().setHours(0,0,0,0),wx:"clear",wxLeft:360,wet:0,crewQ:[],brkType:"dryer",breakTotal:1,hayTotal:1,t:0,yard:700,tank:0.50*P.tankCap,fg:40,pmSpeed:C.pmSp.v,pm:"run",breakLeft:0,reel:8,winderBuf:0,winderAcc:0,
     inPhase:0.6,inJit:1,outPhase:0.3,outJit:1,inQ:[],inDock:[null,null,null],outQ:[],outDock:[null,null,null],leaving:[],
     rates:{feed:0,unload:0,fiberIn:0,prod:0,fiberUse:0,load:0,rolls:0,cut:0},
     tot:{inTrucks:0,inTons:0,turned:0,prodT:0,rolls:0,shipped:0,outTrucks:0,breaks:0,breakMin:0,turnups:0,pot:0,incidents:0,hayouts:0,hayMin:0,broke:0},wd:"run",hayLeft:0,
     trend:[],trendAcc:0,conv:0,inc:[],lastInc:0,feed:[],M:baseMods(),effDrv:C.drivers.v,effLd:C.loaders.v,effHum:C.loaders.v};
  S.up={};S.cash=ECON.start;S.ledger={rev:0,occ:0,frin:0,frout:0,energy:0,labor:0,overhead:0,repairs:0,premium:0,upgrades:0,deals:0};
  // v4.1 v16: paper keeps the grade it was made as all the way to the truck: each stage holds lots [grade, amount] in
  // order (reel and winder stores in t, conveyor and warehouse in rolls) that move first-in first-out with the scalars
  S.lots={reel:[[C.grade,S.reel]],buf:[],acc:[],conv:[],fg:[[C.grade,S.fg]]};
  S.q={made:0,off:0,bank:0};S.fx=[];S.perk={chem:0,sp:{},price:{},energy:0,winder:0};S.chg=null;
  seedRun((Math.random()*2**32)|0);S.profitRate=0;S.opb=null;S.over=null;S.shipT=0;
  Object.assign(P,BASE);applyUpgrades();
  C.rollW.v=P.jumbo/P.rollsPerReel;const g=GRADES[C.grade]; C.pmSp.v=g.sp+P.spBonus+(S.perk.sp[C.grade]||0); C.wdr.v=Math.min(P.winderMax,P.K*C.pmSp.v*g.bw*1.25);
  const demand=P.K*g.sp*g.bw/P.pmLoss; C.pulper.v=demand/P.yieldF;
  C.inRate.v=C.pulper.v/P.truckLoad; C.drivers.v=Math.ceil(2*C.pulper.v/P.driverRate+0.15);
  const rph=P.K*g.sp*g.bw/C.rollW.v; C.loaders.v=Math.ceil(rph*1.15/P.loaderRate); C.outRate.v=rph/P.truckRolls;
  S.rates.fiberIn=demand; S.rates.prod=demand*P.pmLoss; S.rates.feed=C.pulper.v;
}
// market-driven planner: a hidden production queue that walks the grade wheel and buys the OCC blend for it
// v4: every source of luck has its own stream, drawn on a fixed schedule (see step), so all players in the same
// season week face the same dice at the same sim time: upsets, sheet breaks, hayouts, weather, truck timing
function seedRun(seed){S.seed=seed>>>0;const k=S.seed;S.bn=bnFor(S.seed);S.rng={plan:k^0x9e3779b9,card:k^0x85ebca6b,up:k^0x27d4eb2f,upx:k^0x165667b1,
    brk:k^0xd3a2646c,brkx:k^0xfd7046c5,hay:k^0xb55a4f09,wx:k^0x7feb352d,flow:k^0x846ca68b,lead:k^0x2c1b3c6d,rel:k^0x2545f491,relx:k^0x632be5ab};   // (v6.10: rel, relx for the reliability model, 07i)
  C.grade="24";const c=GCOST["24"];
  S.plan={i:0,q:[],cur:null,left:c.mix[0]+rand("plan")*(c.mix[1]-c.mix[0]),mkt:0,mktLeft:7*1440,disc:null,hot:null};
  S.cards={next:1440*(1+0.5*rand("card")),open:null,pend:[],seen:{}};applyUpgrades();
  ordInit();}   // v6.6: the order book for the run (its own dice streams, ord and bale; 05b)
function setGrade(to){const from=C.grade;if(to===from)return;
  const off=4+2*Math.abs(GRADES[to].bw-GRADES[from].bw);S.chg={left:off,total:off,from,to};C.grade=to;applyUpgrades();{const L=S.q.gc||(S.q.gc=[]);L.push({t:Math.round(S.t),from,to,tons:Math.round(off*10)/10});if(L.length>20)L.shift();}   // (v6.7: for the quality screen)
  log(`Grade change ${from} → ${to} (market orders): about ${off.toFixed(0)} t to the beater during the transition`,"warn");}
function planTick(dt,good){const pl=S.plan;
  pl.left-=good;
  if(pl.left<=0){let nx;
    if(pl.q.length){nx=pl.q.shift();pl.cur=nx;}
    else{if(pl.cur&&pl.cur.i!==undefined)pl.i=pl.cur.i;pl.cur=null;pl.i=(pl.i+1)%WHEEL.length;const g=WHEEL[pl.i],c=GCOST[g];nx={g,t:c.mix[0]+rand("plan")*(c.mix[1]-c.mix[0])};}
    pl.left=nx.t;setGrade(nx.g);if(ordOn())ordCampaign(nx.g,nx.t,S.t);}   // v6.6: customers order most of the campaign
  pl.mktLeft-=dt;
  if(pl.mktLeft<=0){pl.mktLeft=7*1440;const d=Math.round((rand("plan")*2-1)*25),m=clamp(pl.mkt+d,-50,50),ch=m-pl.mkt;pl.mkt=m;applyUpgrades();
    if(ch)log(`OCC market: ${ch>0?"up":"down"} $${Math.abs(ch)}/t this week`,ch>0?"warn":"ok");}}

initCtrl(); initState();

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=(cur,tgt,dt,tau)=>cur+(tgt-cur)*Math.min(1,dt/tau);

function autoControl(dt){
  const g=GRADES[C.grade], level=S.tank/P.tankCap*100;
  if(C.pmSp.auto) C.pmSp.v=g.sp+P.spBonus+(S.perk.sp[C.grade]||0);
  const pmWants = (S.pm==="full"||S.pm==="incident"||S.pm==="spools")?0:P.K*C.pmSp.v*g.bw/P.pmLoss;
  if(C.pulper.auto){
    const fiber=pmWants+(C.lvlTarget.v-level)/100*P.tankCap/1.5;
    C.pulper.v=ease(C.pulper.v,clamp(fiber/P.yieldF,0,Math.min(P.pulperMax,P.screenMax/P.yieldF)),dt,4);
  }
  if(C.inRate.auto){
    const queuePenalty=S.inQ.length*0.015;
    const r=C.pulper.v/P.truckLoad+(P.yardTarget-S.yard)/(P.truckLoad*10)-queuePenalty;
    C.inRate.v=ease(C.inRate.v,clamp(r,0,8),dt,10);
  }
  if(C.drivers.auto){
    const need=((P.autoFeed?0:C.pulper.v)+C.inRate.v*P.truckLoad)/P.driverRate;
    if(need>C.drivers.v-0.1) C.drivers.v=Math.min(10,Math.ceil(need+0.1));
    else if(need<C.drivers.v-1.3) C.drivers.v=Math.max(1,C.drivers.v-1);
  }
  const rph=Math.max(S.rates.prod, S.pm==="run"?P.K*C.pmSp.v*g.bw*0.9:0)/C.rollW.v;
  if(C.outRate.auto&&ordOn()){C.outRate.v=ease(C.outRate.v,ordAutoRate(),dt,10);}   // v6.6: trucks for what is ready to ship
  else if(C.outRate.auto){
    const r=rph/P.truckRolls+(S.fg-P.fgTarget)/(P.truckRolls*8)-S.outQ.length*0.01;
    C.outRate.v=ease(C.outRate.v,clamp(r,0,10),dt,10);
  }
  if(C.wdr.auto){const pot=P.K*C.pmSp.v*g.bw,tgt=S.winderBuf>P.jumbo*1.05?P.winderMax:pot*1.25;C.wdr.v=ease(C.wdr.v,clamp(tgt,0,P.winderMax),dt,5);}
  if(C.loaders.auto){
    const need=(C.outRate.v*P.truckRolls*1.1+(S.rates.rolls||11)*1.15)/P.loaderRate-P.robots;
    if(need>C.loaders.v-0.1) C.loaders.v=Math.min(10,Math.ceil(need+0.1));
    else if(need<C.loaders.v-1.3) C.loaders.v=Math.max(P.robots>0?0:1,C.loaders.v-1);
  }
}

let TRUCKID=0;
function newTruck(kind){return kind==="in"?{id:++TRUCKID,load:P.truckLoad}:{id:++TRUCKID,load:0};}

