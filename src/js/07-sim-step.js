function step(dt){
  // this step's dice, drawn every step whatever the mill is doing, so the streams stay in step for every player
  const L={brk:rand("brk"),brkType:rand("brk"),brkLen:rand("brk"),hay:rand("hay"),hayLen:rand("hay"),hayLoss:rand("hay")};
  S.t+=dt;
  // v2.9.13: daily production (a mill day runs 6am to 6am, and S.t=0 is 6am) and the best day so far
  {const di=Math.floor(S.t/1440);if(!S.pd)S.pd={i:di,start:S.tot.prodT,rec:0};
    if(di>S.pd.i){const made=S.tot.prodT-S.pd.start;if(made>S.pd.rec)S.pd.rec=made;S.pd.i=di;S.pd.start=S.tot.prodT;}}
  pfDay();pfHour();   // v6.3 process flow: the mill day's books (11b); v6.5 the hour's history row (11c)

  fuelTick();   // v6.5 freight: the weekly diesel index
  chaosTick(dt);
  cardTick(dt);
  civTick(dt);   // v5.1 civics
  outageTick();
  rlyTick(dt);   // v6.10 reliability: shift rounds, wear, faults (07i)
  const M=S.M=mods();
  autoControl(dt);
  vlvTick(dt);   // v6.9 the control valves (07h; nothing until a loop is touched)
  knobTick(dt);   // v5.6 fiddly knobs (returns at once unless a knob was moved)
  dcsTick(dt);   // v6.5 b3 DCS motors and reject purges (07c; nothing until the DCS is used)
  dryTick(dt);   // v6.5 b5 the dryer limit: water, steam, moisture (07d)
  weTick(dt);   // v6.8 the basis weight loop, bale water in the pulper, screen pressure drop (07g)
  // 1 inbound arrivals
  // weather: changes every few hours; snow and fog slow the trucks, rain soaks bales
  if(S.wx===undefined){S.wx="clear";S.wxLeft=360;S.wet=0;}
  S.wxLeft-=dt;if(S.wxLeft<=0){const r=rand("wx"),w=P.siteWx||[0.55,0.75,0.87];const nx=r<w[0]?"clear":r<w[1]?"rain":r<w[2]?"fog":"snow";if(nx!==S.wx&&nx!=="clear")log(`Weather: ${WXN[nx].toLowerCase()} rolling in`,"warn");S.wx=nx;S.wxLeft=240+rand("wx")*600;}
  S.wet=clamp(S.wet+dt*(S.wx==="rain"?1/90:S.wx==="snow"?1/240:-1/360),0,1);
  const wxTruck=S.wx==="snow"?0.7:S.wx==="fog"?0.85:1,siteIn=P.siteIn||1;
  if(!M.noIn) S.inPhase+=dt*C.inRate.v/60*S.inJit*wxTruck*siteIn;
  while(S.inPhase>=1){S.inPhase-=1;S.inJit=0.6+rand("flow")*0.8;
    if(S.inQ.length<P.maxQueue){const tr=baleGrade(newTruck("in"));if(!baleGate(tr))S.inQ.push(tr);S.tot.inTrucks++;} else S.tot.turned++;}
  if(!M.docksClosed) for(let d=0;d<P.doors;d++) if(!S.inDock[d]&&S.inQ.length) S.inDock[d]=S.inQ.shift();
  // 2 receiving: drivers split between pulper feed and unloading
  const level0=S.tank/P.tankCap;
  let want=M.pulperDown?0:C.pulper.v*M.feedMul;
  if(level0>0.97) want=Math.min(want,S.rates.fiberUse/P.yieldF);
  want=Math.min(want,P.screenMax/(P.yieldF*M.yieldMul||1));   // v4.1: the screens pass at most screenMax t/h of fiber
  want=Math.min(want,recRate());   // v6.8.3: Mixed Waste over its usual share slows the pulper
  const effDrv=Math.min(C.drivers.v,M.drvCap); S.effDrv=effDrv;
  let cap=effDrv*P.driverRate*dt/60*M.recvMul;
  const feedRes=P.autoFeed?(M.recvMul>0?want*dt/60:0):Math.min(want*dt/60,cap); if(!P.autoFeed)cap-=feedRes;
  let unloaded=0;
  for(let d=0;d<P.doors;d++){const tr=S.inDock[d]; if(!tr||M.docksClosed)continue;
    const u=Math.min(tr.load,P.doorRate*dt/60,cap,Math.max(0,P.yardCap-S.yard));
    const paid=baleUnload(tr,u,S.yard);   // v6.6: paid as air-dry weight; the yard mix
    tr.load-=u;cap-=u;S.yard+=u;unloaded+=u;S.tot.inTons+=u;pfW("in",u);
    {const dc=S.plan.disc,dt2=dc?Math.min(paid,dc.t):0;spend(paid*P.occPrice-dt2*(dc?dc.v:0),"occ");spend(u*frInRate(),"frin");if(dc){dc.t-=dt2;if(dc.t<=1e-6)S.plan.disc=null;}}
    if(tr.load<=0.001){S.leaving.push({...tr,ty:inY(d),kind:"in"});if(S.leaving.length>24)S.leaving.shift();S.inDock[d]=null;}}
  const feed=Math.min(feedRes,S.yard);recTake(feed,dt);S.yard-=feed;WQ.f+=feed;   // (v6.8.3: off the piles in recipe order)
  // 3 pulper → chest
  if(M.yardEat){const y0=S.yard;S.yard=Math.max(0,S.yard-M.yardEat*dt/60);pfW("bale",y0-S.yard);}
  const BF=baleFeed(),fiberIn=feed*BF.sf*P.yieldF*M.yieldMul*BF.yk*dpYield(),rejT=feed*BF.sf-fiberIn;pfW("feed",feed);pfW("rej",rejT);WQ.rej+=rejT;WQ.bw+=feed*BF.e;
  if(baleOn()&&rejT>0){const lf=rejT*LANDFILL*(P.costMul||1);spend(lf,"occ");bqState().lf+=lf;}   // v6.8.3: rejects hauled to landfill   // v6.6: water over 10% isn't fiber; contamination is rejects
  baleTick(dt,fiberIn);
  // (v6.5.6: stock the chest has no room for goes over the top to the sewer, and is booked as spilled; it used to vanish)
  {const t1=S.tank+fiberIn,cl=Math.max(0,t1-P.tankCap);S.tank=t1-cl;if(cl>0){pfW("spill",cl);WQ.clip+=cl;}WQ.fi+=fiberIn-cl;}
  // 5 paper machine
  const level=S.tank/P.tankCap*100, low=C.lowLevel.v;
  const pmDn=mcTick(dt,M)?"machine chest low level, refiners down":M.pmDown,fromMc=!!M.refOut&&!vlvT("LV-104");   // v6.9.2: refiners down, the machine runs on what's in the machine chest (07g)
  if(pmDn){ if(S.pm!=="incident"){ S.pm="incident"; S.lastDown=pmDn; } }
  else if(S.pm==="incident"){ if(level>8)rethread("after the shutdown"+(S.lastDown?" ("+S.lastDown+")":"")); else S.pm="down"; S.pmSpeed=Math.min(S.pmSpeed,P.minSpeed); }
  if(S.pm==="break"){if(working("brk"))S.breakLeft-=dt*leadRethread();S.tot.breakMin+=dt;if(S.breakLeft<=0&&level>8){S.pm="run";S.pmSpeed=Math.min(C.pmSp.v,P.minSpeed+300);}}
  else if(S.pm==="down"){if(level>=Math.max(20,low*0.8)){rethread("after running out of stock");S.pmSpeed=P.minSpeed;}}
  else if(S.pm==="full"){if(S.fg<P.fgCap*0.95){S.pm="run";S.pmSpeed=P.minSpeed;}}
  else if(S.pm==="spools"){if(reelsAtWinder()<=P.storeReels){S.pm="run";S.pmSpeed=P.minSpeed;}}
  let prod=0;
  if(S.pm==="run"){
    let tgt=C.pmSp.v*M.speedCap;
    if(level<low){const f=clamp((level-5)/(low-5),0,1);
      const supply=(S.rates.fiberIn*P.pmLoss)/(P.K*bwSp());
      tgt=Math.min(C.pmSp.v,Math.max(supply,C.pmSp.v*f));}
    tgt=Math.max(Math.min(tgt,C.pmSp.v*M.speedCap),P.minSpeed);
    const r=P.ramp*dt; S.pmSpeed+=clamp(tgt-S.pmSpeed,-r*2,r);
    if(level<5){S.pm="down";}
    else if(S.reel>=P.jumbo&&reelsAtWinder()>P.storeReels){S.pm="spools";}
    else if(L.brk<dt/390*0.25*P.breakBase*(outRel("wet")+outRel("dry"))/2*((C.breaks?P.gradeBrk:0)+(M.breakMul-1))){S.pm="break";const r=L.brkType;S.brkType=r<0.45?"reel":r<0.8?"dryer":"press";
      S.breakLeft=2*(S.brkType==="reel"?4+L.brkLen*6:S.brkType==="dryer"?12+L.brkLen*14:26+L.brkLen*20);S.breakTotal=S.breakLeft;S.tot.breaks++;enqueue("brk");AUDIO.sfx("snap",2500);
      log(`Sheet break ${S.brkType==="reel"?"at the reel (short)":S.brkType==="dryer"?"before the dryers":"before the presses (long)"}`,"warn");brkNote();}
    if(S.pm==="run"){
      prod=P.K*S.pmSpeed*S.we.bw*dt/60;   // (v6.8: the weight the BW loop is making, 07g)
      const use=prod/P.pmLoss;
      if(!fromMc&&use>S.tank){prod=S.tank*P.pmLoss;}
      if(!fromMc)S.tank-=prod/P.pmLoss;pfW("eff",prod/P.pmLoss-prod);WQ.u+=prod/P.pmLoss;WQ.p+=prod;
    }
  }
  if(S.pm!=="run") S.pmSpeed=ease(S.pmSpeed,0,dt,3);
  baseLoadTick(dt);   // v6.6: a stopped machine still draws power and keeps the boiler banked
  let beat=0;
  if(prod>0){{const ec=prod*energyCost();spend(ec,"energy");pfEnergy(prod,ec);}knobSteamCost(prod);
    {const de=kwhNow()-WE.kwh0;if(de&&!S.zen){const v=de*prod/P.pmLoss*WE.kwhCost*P.energyMul*(P.costMul||1);spend(v,"energy");pfAdd("power","stock",v);}}   // v6.8 refining power above (or below) standard
  S.q.made+=prod;
    // v6.5.3: the spec check (07e): weight, moisture or color out and the whole reel is beater; then a grade change's
    // transition tons; then the other knob defects' share
    let off=0;if(qualTick().off)off=prod;
    else if(S.chg){off=Math.min(prod,S.chg.left);S.chg.left-=off;if(S.chg.left<=1e-6){log(`Grade change to ${S.chg.to} complete: back on spec`,"ok");S.chg=null;}}
    {const kf=knobOff();if(kf>0)off=Math.min(prod,off+(prod-off)*kf);}   // v5.6: a moved knob sending part of the reel to the beater (defects other than weight and moisture)
    // (v6.5.3: off-spec paper stays on the reel as beater and is wound into beater rolls; before, it vanished here)
    if(off>0){pfW("broke",off);S.tot.broke+=off;S.q.off+=off;prod-=off;beat=off;}
    if(S.plan.hot&&C.grade==="34Super")S.plan.hot.made+=prod;
    {const ps=premShare();if(ps>0&&prod>0&&!S.zen){const v=prod*priceOf(C.grade)*ps;earn(v);S.tot.prem=(S.tot.prem||0)+v;}}   // v6.8 the lightweight premium, paid as the on-spec paper is made
    if(S.pf&&prod>0)pfW("val",prod*priceOf(C.grade)*(1+premShare()));}
  qLog(dt,beat);   // v6.7 the off-spec log (07e)
  S.reel+=prod+beat;lotPut(S.lots.reel,C.grade,prod);lotPut(S.lots.reel,"beater",beat); S.tot.prodT+=prod; {const pt=P.K*C.pmSp.v*bwSp()*dt/60;S.tot.pot+=pt;pfW("pot",pt);}   // (v6.7: potential tons at the setpoint speed, by the hour, for the process flow)
  planTick(dt,prod);
  if(S.reel>=P.jumbo&&reelsAtWinder()<=P.storeReels){S.winderBuf+=S.reel;lotTake(S.lots.reel,S.reel,S.lots.buf);S.reel=0;S.lots.reel.length=0;S.tot.turnups++;}
  // 6 winder
  if(S.wd==="hayout"){if(working("hay"))S.hayLeft-=dt*leadRethread();S.tot.hayMin+=dt;if(S.hayLeft<=0){S.wd="run";log("Winder cleaned up and running again","ok");}}
  if(S.conv===undefined)S.conv=0;const convFull=S.conv>P.convCap-2+1e-6;S.wdBlocked=convFull;   // (v6.5.7: a set is two rolls, so the conveyor needs room for both)
  const cut=S.wd==="hayout"||M.winderDown||convFull?0:Math.min(S.winderBuf,C.wdr.v*dt/60); S.winderBuf-=cut;
  // v6.5.3: the winder splices the off-spec sections out of the set and winds them onto beater rolls of their own
  {const T=[];lotTake(S.lots.buf,cut,T);let bt=0;for(const [k,q] of T){if(k==="beater")bt+=q;else lotPut(S.lots.acc,k,q);}S.winderAcc+=cut-bt;S.beatAcc=(S.beatAcc||0)+bt;S.beatEnd=cut>0&&bt<=1e-9;}
  if(cut>0&&L.hay<dt/720*0.75*P.hayBase*outRel("dry")*((C.hays?1:0)+(M.hayMul-1)))hayout(L.hayLen,L.hayLoss);
  let rollsMade=0;
  // (a roll takes the grade that makes up most of its paper: one roll at a grade change is part old, part new)
  // v6.5.7: the winder winds a set of two rolls side by side (the reel is slit in two); both come off together
  while(S.winderAcc>=2*C.rollW.v-1e-9){for(let k=0;k<2;k++){const w=Math.min(S.winderAcc,C.rollW.v);S.winderAcc-=w;const T=[];lotTake(S.lots.acc,w,T);let g=C.grade,best=-1;for(const [k2,q] of T)if(q>best){best=q;g=k2;}
    lotPut(S.lots.conv,g,1);S.conv+=1;rollsMade++;S.tot.rolls++;}}
  // v6.5.3: a beater roll goes to the beater bay (27-3d draws it there from S.tot.beater) and round to the pulper
  // (full rolls while the off-spec section lasts; when good paper comes through again the rest goes on a short roll)
  // (v6.5.7: in sets of two, like the good rolls)
  while((S.beatAcc||0)>=2*C.rollW.v-1e-6||(S.beatEnd&&(S.beatAcc||0)>0.05)){const q=Math.min(S.beatAcc,2*C.rollW.v);S.beatAcc=Math.max(0,S.beatAcc-q);
    S.tot.beater=(S.tot.beater||0)+2*C.rollW.v;S.tot.beatRolls=(S.tot.beatRolls||0)+2;S.q.bank+=q;}
  beaterTick(dt);waterTick(dt);   // (v6.5.6: the water that went with all of that, 07f)
  // 6 outbound
  if(!M.noOut) S.outPhase+=dt*C.outRate.v/60*S.outJit*wxTruck;
  while(S.outPhase>=1){S.outPhase-=1;S.outJit=0.6+rand("flow")*0.8;
    if(S.outQ.length<P.maxQueue){S.outQ.push(newTruck("out"));S.tot.outTrucks++;}}
  if(!ordOn())for(let d=0;d<P.shipDoors;d++) if(!S.outDock[d]&&S.outQ.length) S.outDock[d]=S.outQ.shift();   // (v6.6: with the order book a truck docks only with a job, ordDocks)
  const effHum=Math.min(C.loaders.v,M.ldrCap); S.effHum=effHum; const effLd=effHum+P.robots; S.effLd=effLd;
  let lcap=effLd*P.loaderRate*dt/60*M.clampMul, loaded=0;
  // clamp trucks first clear the roll conveyor into the warehouse (more urgently as it fills), then load trucks
  {const u=S.conv/P.convCap,docked=S.outDock.some(Boolean),share=docked?(u>0.6?0.9:0.5):1;
    const put=Math.max(0,Math.min(S.conv,P.fgCap-S.fg,lcap*share));S.conv-=put;S.fg+=put;lotTake(S.lots.conv,put,S.lots.fg);lcap-=put;S.rates.put=ease(S.rates.put||0,put*60/dt,dt,6);}
  if(ordOn()){loaded=ordDocks(dt,lcap);}   // v6.6 the order book (05b)
  else{
  // v5.0.4: with a shipping bottleneck the doors' combined rate fills one truck at a time (door by door), so trucks leave
  // through the day instead of every truck crawling for a day; capacity (doors x rate) and the dock-door upgrade are unchanged
  let pool=S.bn==="ship"?P.shipDoors*P.doorRolls*dt/60:Infinity;
  for(let d=0;d<P.shipDoors;d++){const tr=S.outDock[d]; if(!tr)continue;
    const l=Math.min(P.truckRolls-tr.load,pool===Infinity?P.doorRolls*dt/60:pool,lcap,S.fg);pool-=l;
    tr.load+=l;lcap-=l;S.fg-=l;loaded+=l;lotTake(S.lots.fg,l,tr.lots||(tr.lots=[]));
    if(tr.load>=P.truckRolls-1e-6){S.leaving.push({...tr,ty:outY(d),kind:"out"});if(S.leaving.length>24)S.leaving.shift();S.outDock[d]=null;S.tot.shipped+=P.truckRolls;const tons=P.truckRolls*C.rollW.v;S.shipT+=tons;spend(tons*frOutRate(),"frout");earn(lotValue(tr.lots||[[C.grade,P.truckRolls]],C.rollW.v));}}   // (v16: each roll at its own grade's price)
  }
  ordTick(dt);
  spend(((C.drivers.v+C.loaders.v+P.techs+(P.elec||0))*(ECON.wage+(P.siteWage||0))*(P.costMul||1)*leadWage()*civWage()+P.robots*ECON.robot+P.pmCost)*dt/60,"labor");
  pfLabor(dt);
  spend((ECON.overhead+(P.siteOver||0))*dt/60,"overhead"); if(P.premium)spend(P.premium*dt/60,"premium");
  // v3.1.2: profit/day is OPERATING profit over the last 12 game hours: good paper is valued as it comes off the machine (tons x price),
  // less OCC, energy, labor, overhead and insurance. One-offs (upgrades, outage budgets, repair bills, card deals) are left out,
  // and so is the lumpy timing of truck departures. Cash and the season score are unchanged.
  if(!S.over&&!S.free&&!S.zen&&S.cash<ECON.bankrupt&&!(S.season&&S.season.on)&&!(S.season&&S.season.done&&!S.season.more)){S.over="bankrupt";showOverlay();}   // v5.0.5: not at the end of a season or survival run (its own results show); only in sandbox play or after "one more turn"
  rcTick(dt);
  seasonTick();
  // smoothed rates (per hour)
  const R=S.rates,k=v=>v*60/dt;
  R.feed=ease(R.feed,k(feed),dt,6);R.unload=ease(R.unload,k(unloaded),dt,6);R.fiberIn=ease(R.fiberIn,k(fiberIn),dt,6);
  R.prod=ease(R.prod,k(prod),dt,6);R.fiberUse=ease(R.fiberUse,k(prod/P.pmLoss),dt,6);R.load=ease(R.load,k(loaded),dt,6);R.rolls=ease(R.rolls,k(rollsMade),dt,10);R.cut=ease(R.cut,k(cut),dt,6);
  // v5.0.4: profit per day is the real cash change (sales and deals in, every cost out, repairs and outage budgets too); only
  // upgrades are left out, as they're a choice. Read from the ledger, so money moved between steps (a budget approved) counts too.
  {const L1=S.ledger,T=L1.rev+(L1.deals||0)-(L1.occ+(L1.frin||0)+(L1.frout||0)+L1.energy+L1.labor+L1.overhead+L1.premium+L1.repairs),op=S.opLast==null?0:T-S.opLast;S.opLast=T;const NB=432,B=S.opb&&S.opb.b.length===NB?S.opb:(S.opb={b:new Array(NB).fill(0),i:-1,sum:0});if(B.sum==null)B.sum=B.b.reduce((a,v)=>a+v,0);
    // v4.4.0-t3: profit per day is the last 24 game hours (144 ten-minute buckets); shown from the end of the first day
    // v5.0.5: averaged over the last 3 days (432 ten-minute buckets, with a running sum), so one truck or one repair bill doesn't flip it
    const bi=Math.floor(S.t/10);if(bi!==B.i){for(let j=Math.max(B.i+1,bi-NB+1);j<=bi;j++){const k=((j%NB)+NB)%NB;B.sum-=B.b[k];B.b[k]=0;}B.i=bi;}
    B.b[bi%NB]+=op;B.sum+=op;S.profitRate=B.sum*1440/Math.min(NB*10,Math.max(10,S.t));}
  // trend every 10 sim min
  S.trendAcc+=dt;
  if(S.trendAcc>=10){S.trendAcc-=10;S.trend.push([S.tank/P.tankCap,S.pmSpeed/3300,S.yard/P.yardCap,S.fg/P.fgCap]);if(S.trend.length>144)S.trend.shift();}
  vlvCapture();   // v6.9 the valves' boundary for the next 15 s, and their trend points (07h)
  histTick(dt);   // v6.5 history: the hour's readings and minutes (11c)
  tagTick();   // v6.7 the control room's tag history (11d; reads only)
}

