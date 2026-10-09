/* ---------- v3.0.0: planned outages (season mode) ----------
   Every 7th season day (days 7, 14, 21, 28) the mill takes a controlled 4-hour shutdown starting 8 AM. 24 h ahead the
   player sets a maintenance budget per area: $50k = 10% less reliable, $100k = no change, $200k = 20% more reliable.
   The new reliability takes effect when the outage ends and lasts until the next one. */
const OUT={every:7,hour:8,len:240,cost:[50e3,100e3,200e3],rel:[1.1,1,0.8],simCap:5,
  jobs:["1st press roll change","Forming fabric (wire) change","Pulper rotor and extraction plate change","Refiner plate change"],
  areas:[["stock","Stock prep","pulper, cleaners, screens, refiners, thickener"],["wet","Wet end","headbox, forming fabric, press felts"],["dry","Dry end","dryers, steam joints, reel, winder"]],
  ev:{stock:["refclash","ragger","overflow","dye","hdblow","lwplug","cscreen","fscreen","lcplug","thkblow","chestover"],wet:["fabric","felt","slime","fogfan"],dry:["shaft","dryerfire","wrap","steamjoint","winderdown","boiler"]},area:{}};
for(const a in OUT.ev)OUT.ev[a].forEach(id=>OUT.area[id]=a);
const outStart=k=>(OUT.every*k-1)*1440+(OUT.hour-6)*60;
function outRel(a){const o=S&&S.outg;return o&&o.rel?o.rel[a]:1;}
const outOn=()=>!!(S&&S.outg&&S.outg.on);
function outageTick(){const o=S.outg;if(!o||!S.season||!S.season.on||S.zen||S.over)return;
  if(o.on){if(S.t>=o.end)endOutage();return;}
  const st=outStart(o.k);if(st+OUT.len>S.season.end)return;
  if(!o.noticed&&S.t>=st-1440){if(S.cards&&S.cards.open)return;o.noticed=true;openOutagePlan();return;}
  if(o.noticed&&S.t>=st)beginOutage();}
let outEl=null;
function outShell(){if(!outEl){outEl=document.createElement("div");outEl.className="overlay";outEl.id="outOv";outEl.hidden=true;document.body.appendChild(outEl);}clearTimeout(outEl._t);outEl.classList.remove("note");return outEl;}
const outTime=t=>hhmm(t).replace(" · "," at ");
const hourOf=t=>{const h=Math.floor(((t+360)%1440)/60);return `${h%12||12} ${h<12?"AM":"PM"}`;};
function openOutagePlan(){const o=S.outg,st=outStart(o.k),first=o.k===1,pick={stock:1,wet:1,dry:1};
  running=false;S.cards.open={outage:true};
  const el=outShell(),k=n=>"$"+Math.round(n/1e3)+"k";
  const effTxt=(v,a)=>{const w=a==="stock"?"breakdowns":"breakdowns and sheet breaks";return v===0?["bad","Reliability −10%: more "+w]:v===2?["ok","Reliability +20%: fewer "+w]:["","Reliability unchanged"];};
  el.innerHTML=`<div class="modal deal outg" role="dialog" aria-modal="true" aria-labelledby="out-h"><span class="dk">Planned outage ${o.k} of 4 · sim paused</span>
    <h2 id="out-h">${first?"Your first planned outage":"Outage in 24 hours"}</h2>
    ${first?`<div class="intro"><p><b>What's an outage?</b> Planned downtime. Every 7 days the mill comes down on purpose for a controlled 4-hour shutdown, so crews can inspect, clean, repair and replace worn parts before they fail.</p>
      <p><b>Why it matters:</b> well-maintained equipment breaks down less and runs better, with fewer sheet breaks and hayouts. Your budget for each area sets its reliability until the next outage.</p></div>`:""}
    <p class="when">Starts <b>${outTime(st)}</b>, back up by <b>${hourOf(st+OUT.len)}</b> (4 hours, machine and stock prep down).<br>Major job: <b>${OUT.jobs[o.k-1]||"inspections"}</b>, plus new press felts.</p>
    <div>${OUT.areas.map(([a,n,d])=>`<div class="orow" data-a="${a}"><div><b>${n}</b><small>${d}</small></div><div class="seg">${OUT.cost.map((c,i)=>`<button data-v="${i}" aria-pressed="${i===1}">${k(c)}</button>`).join("")}</div><em class="eff"></em></div>`).join("")}</div>
    <div class="otot"><div><span>Outage budget</span><small id="out-cash"></small></div><b id="out-tot"></b></div>
    <div class="btns"><button class="primary" id="out-ok" style="flex:1">Approve budget</button></div></div>`;
  const paint=()=>{el.querySelectorAll(".orow").forEach(r=>{const a=r.dataset.a,v=pick[a];r.querySelectorAll(".seg button").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.v===v)));
      const [c,t]=effTxt(v,a),e=r.querySelector(".eff");e.className="eff "+c;e.textContent=t;});
    const tot=Object.values(pick).reduce((s,v)=>s+OUT.cost[v],0);document.getElementById("out-tot").textContent=money(tot);
    document.getElementById("out-cash").textContent="Cash on hand "+money(S.cash);document.getElementById("out-ok").textContent=`Approve ${money(tot)} budget`;};
  el.querySelectorAll(".orow").forEach(r=>r.querySelectorAll(".seg button").forEach(b=>b.addEventListener("click",()=>{pick[r.dataset.a]=+b.dataset.v;paint();})));
  document.getElementById("out-ok").addEventListener("click",()=>{const tot=Object.values(pick).reduce((s,v)=>s+OUT.cost[v],0);spend(tot,"repairs");
    o.plan={...pick};log(`Outage ${o.k} budget approved: ${money(tot)} (${OUT.areas.map(([a,n])=>n+" "+k(OUT.cost[pick[a]])).join(", ")})`,"warn");
    el.hidden=true;closeCard(true);});
  paint();el.hidden=false;AUDIO.sfx("cash",150);document.getElementById("out-ok").focus();}
function outNote(head,body,ms){const el=outShell();el.classList.add("note");
  el.innerHTML=`<div class="modal deal" role="status"><span class="dk">Planned outage</span><h2>${head}</h2><p>${body}</p><div class="btns"><div class="dtimer"><i style="animation-duration:${ms/1000}s"></i></div></div></div>`;
  el.hidden=false;const m=el.querySelector(".modal");m.addEventListener("click",()=>{el.hidden=true;},{once:true});el._t=setTimeout(()=>{el.hidden=true;},ms);}
function beginOutage(){const o=S.outg,st=S.t;if(!o.plan)o.plan={stock:1,wet:1,dry:1};o.on=true;o.end=st+OUT.len;
  // slow the clock so the crews can be watched; the old speed comes back when the outage ends
  o.spd=C.simSpeed;if(C.simSpeed>OUT.simCap){setSimSpeed(OUT.simCap);}
  addFx({id:"pout",left:OUT.len,mods:{pmDown:"planned outage",pulperDown:1}});AUDIO.sfx("clunk",400);
  log(`Planned outage ${o.k} has begun: down until ${hourOf(o.end)}`,"warn");BANNERS.push({text:`Planned outage: the mill is down until ${hourOf(o.end)}.`,t:null,kind:"good",tag:"OUTAGE"});
  outNote("Outage has begun",`The mill is down for planned maintenance: ${(OUT.jobs[o.k-1]||"inspections").toLowerCase()} and new press felts. Started ${hourOf(st)}, ends ${outTime(o.end)}.`,5000);}
function endOutage(){const o=S.outg,pl=o.plan||{stock:1,wet:1,dry:1};o.on=false;S.fx=S.fx.filter(f=>f.id!=="pout");S.M=mods();
  if(o.spd&&C.simSpeed===OUT.simCap&&o.spd!==OUT.simCap){setSimSpeed(o.spd);}o.spd=null;
  o.rel={stock:OUT.rel[pl.stock],wet:OUT.rel[pl.wet],dry:OUT.rel[pl.dry]};
  const txt=OUT.areas.map(([a,n])=>`${n} ${pl[a]===2?"+20%":pl[a]===0?"−10%":"±0%"}`).join(" · ");
  BANNERS.push({text:`Outage ${o.k} complete. Reliability until the next outage: ${txt}`,t:null,kind:"good",tag:"OUTAGE"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Outage ${o.k} complete. Reliability until the next outage: ${txt}`,"ok");
  outNote("Outage complete",`Restarting the mill. Reliability until the next outage: ${txt}.`,4000);
  o.k++;o.noticed=false;o.plan=null;}
const HAYLINES=["HAYOUT! Paper is shooting to the roof!","Winder hayout! Every PM hand to the dry end!","Hayout! It's snowing paper in the winder aisle.","Hayout! The set exploded off the drums."];
// a hayout ruins the outer wraps of the set on the winder (about 3 t), not the whole 12.5 t roll
// v2.9.5: reels at the winder (on the unwind + in storage); a reel turns up a fraction over 100 t, which used to make the
// unwind reel count as "more than one" and block storage, so the machine stopped with storage empty
function reelsAtWinder(){return Math.max(0,Math.ceil(S.winderBuf/P.jumbo-0.005));}
function hayout(a=rand("upx"),b=rand("upx")){AUDIO.sfx("hayout",600);S.wd="hayout";S.hayLeft=40+a*40;S.hayTotal=S.hayLeft;enqueue("hay");
  const extra=Math.min(S.winderBuf,2+b*4),wraps=Math.min(S.winderAcc,P.jumbo/32),loss=extra+wraps;S.winderBuf-=extra;S.winderAcc-=wraps;S.tot.broke+=loss;S.tot.hayouts++;
  BANNERS.push({text:HAYLINES[Math.floor(Math.random()*HAYLINES.length)],t:null,id:"hay"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Winder hayout: ${loss.toFixed(1)} t of paper to broke`,"bad");}
function initCtrl(){
  C={inRate:{v:1.8,auto:true},drivers:{v:3,auto:true},pulper:{v:40,auto:true},lvlTarget:{v:69},lowLevel:{v:30},
     pmSp:{v:2736,auto:true},rollW:{v:100/8},loaders:{v:2,auto:true},outRate:{v:1,auto:true},grade:"23m",breaks:true,hays:true,wdr:{v:45,auto:true},simSpeed:10};
}
function initState(){
  S={date0:new Date().setHours(0,0,0,0),wx:"clear",wxLeft:360,wet:0,crewQ:[],brkType:"dryer",breakTotal:1,hayTotal:1,t:0,yard:700,tank:0.69*P.tankCap,fg:40,pmSpeed:C.pmSp.v,pm:"run",breakLeft:0,reel:8,winderBuf:0,winderAcc:0,
     inPhase:0.6,inJit:1,outPhase:0.3,outJit:1,inQ:[],inDock:[null,null,null],outQ:[],outDock:[null,null,null],leaving:[],
     rates:{feed:0,unload:0,fiberIn:0,prod:0,fiberUse:0,load:0,rolls:0,cut:0},
     tot:{inTrucks:0,inTons:0,turned:0,prodT:0,rolls:0,shipped:0,outTrucks:0,breaks:0,breakMin:0,turnups:0,pot:0,incidents:0,hayouts:0,hayMin:0,broke:0},wd:"run",hayLeft:0,
     trend:[],trendAcc:0,rollsVis:[],conv:0,inc:[],lastInc:0,feed:[],M:baseMods(),effDrv:C.drivers.v,effLd:C.loaders.v,effHum:C.loaders.v};
  S.up={};S.cash=ECON.start;S.ledger={rev:0,occ:0,energy:0,labor:0,overhead:0,repairs:0,premium:0,upgrades:0,deals:0};
  S.q={made:0,off:0,bank:0};S.fx=[];S.perk={chem:0,sp:{},price:{},energy:0,winder:0};S.chg=null;
  seedRun((Math.random()*2**32)|0);S.profitRate=0;S.opb=null;S.over=null;S.won=false;S.shipT=0;
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
function seedRun(seed){S.seed=seed>>>0;const k=S.seed;S.rng={plan:k^0x9e3779b9,card:k^0x85ebca6b,up:k^0x27d4eb2f,upx:k^0x165667b1,
    brk:k^0xd3a2646c,brkx:k^0xfd7046c5,hay:k^0xb55a4f09,wx:k^0x7feb352d,flow:k^0x846ca68b};
  C.grade="23m";const c=GCOST["23m"];
  S.plan={i:0,q:[],cur:null,left:c.mix[0]+rand("plan")*(c.mix[1]-c.mix[0]),mkt:0,mktLeft:7*1440,disc:null,hot:null};
  S.cards={next:1440*(1+0.5*rand("card")),open:null,pend:[],seen:{}};applyGrade();}
function setGrade(to){const from=C.grade;if(to===from)return;
  const off=4+2*Math.abs(GRADES[to].bw-GRADES[from].bw);S.chg={left:off,total:off,from,to};C.grade=to;applyUpgrades();
  log(`Grade change ${from} → ${to} (market orders): about ${off.toFixed(0)} t to the beater during the transition`,"warn");}
function planTick(dt,good){const pl=S.plan;
  pl.left-=good;
  if(pl.left<=0){let nx;
    if(pl.q.length){nx=pl.q.shift();pl.cur=nx;}
    else{if(pl.cur&&pl.cur.i!==undefined)pl.i=pl.cur.i;pl.cur=null;pl.i=(pl.i+1)%WHEEL.length;const g=WHEEL[pl.i],c=GCOST[g];nx={g,t:c.mix[0]+rand("plan")*(c.mix[1]-c.mix[0])};}
    pl.left=nx.t;setGrade(nx.g);}
  pl.mktLeft-=dt;
  if(pl.mktLeft<=0){pl.mktLeft=7*1440;const d=Math.round((rand("plan")*2-1)*15),m=clamp(pl.mkt+d,-30,30),ch=m-pl.mkt;pl.mkt=m;applyUpgrades();
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
    C.pulper.v=ease(C.pulper.v,clamp(fiber/P.yieldF,0,P.pulperMax),dt,4);
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
  if(C.outRate.auto){
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
function newTruck(kind){return kind==="in"?{id:++TRUCKID,load:P.truckLoad,x:-70,y:292,wait:0}:{id:++TRUCKID,load:0,x:-70,y:455,wait:0};}

