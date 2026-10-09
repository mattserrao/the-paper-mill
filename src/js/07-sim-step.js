function step(dt){
  // this step's dice, drawn every step whatever the mill is doing, so the streams stay in step for every player
  const L={brk:rand("brk"),brkType:rand("brk"),brkLen:rand("brk"),hay:rand("hay"),hayLen:rand("hay"),hayLoss:rand("hay")};
  S.t+=dt;
  // v2.9.13: daily production (a mill day runs 6am to 6am, and S.t=0 is 6am) and the best day so far
  {const di=Math.floor(S.t/1440);if(!S.pd)S.pd={i:di,start:S.tot.prodT,rec:0,recDay:0};
    if(di>S.pd.i){const made=S.tot.prodT-S.pd.start;if(made>S.pd.rec){S.pd.rec=made;S.pd.recDay=S.pd.i+1;}S.pd.i=di;S.pd.start=S.tot.prodT;}}
  const L0=S.ledger,op0=L0.occ+L0.energy+L0.labor+L0.overhead+L0.premium;
  chaosTick(dt);
  cardTick(dt);
  outageTick();
  const M=S.M=mods();
  autoControl(dt);
  const g=GRADES[C.grade];
  // 1 inbound arrivals
  // weather: changes every few hours; snow and fog slow the trucks, rain soaks bales
  if(S.wx===undefined){S.wx="clear";S.wxLeft=360;S.wet=0;}
  S.wxLeft-=dt;if(S.wxLeft<=0){const r=rand("wx");const nx=r<0.55?"clear":r<0.75?"rain":r<0.87?"fog":"snow";if(nx!==S.wx&&nx!=="clear")log(`Weather: ${WXN[nx].toLowerCase()} rolling in`,"warn");S.wx=nx;S.wxLeft=240+rand("wx")*600;}
  S.wet=clamp(S.wet+dt*(S.wx==="rain"?1/90:S.wx==="snow"?1/240:-1/360),0,1);
  const wxTruck=S.wx==="snow"?0.7:S.wx==="fog"?0.85:1;
  if(!M.noIn) S.inPhase+=dt*C.inRate.v/60*S.inJit*wxTruck;
  while(S.inPhase>=1){S.inPhase-=1;S.inJit=0.6+rand("flow")*0.8;
    if(S.inQ.length<P.maxQueue){S.inQ.push(newTruck("in"));S.tot.inTrucks++;} else S.tot.turned++;}
  S.inQ.forEach(t=>t.wait+=dt);
  if(!M.docksClosed) for(let d=0;d<P.doors;d++) if(!S.inDock[d]&&S.inQ.length) S.inDock[d]=S.inQ.shift();
  // 2 receiving: drivers split between pulper feed and unloading
  const level0=S.tank/P.tankCap;
  let want=M.pulperDown?0:C.pulper.v*M.feedMul;
  if(level0>0.97) want=Math.min(want,S.rates.fiberUse/P.yieldF);
  const effDrv=Math.min(C.drivers.v,M.drvCap); S.effDrv=effDrv;
  let cap=effDrv*P.driverRate*dt/60*M.recvMul;
  const feedRes=P.autoFeed?(M.recvMul>0?want*dt/60:0):Math.min(want*dt/60,cap); if(!P.autoFeed)cap-=feedRes;
  let unloaded=0;
  for(let d=0;d<P.doors;d++){const tr=S.inDock[d]; if(!tr||M.docksClosed)continue;
    const u=Math.min(tr.load,P.doorRate*dt/60,cap,Math.max(0,P.yardCap-S.yard));
    tr.load-=u;cap-=u;S.yard+=u;unloaded+=u;S.tot.inTons+=u;
    {const dc=S.plan.disc,dt2=dc?Math.min(u,dc.t):0;spend(u*P.occPrice-dt2*(dc?dc.v:0),"occ");if(dc){dc.t-=dt2;if(dc.t<=1e-6)S.plan.disc=null;}}
    if(tr.load<=0.001){S.leaving.push({...tr,ty:inY(d),kind:"in"});S.inDock[d]=null;}}
  const feed=Math.min(feedRes,S.yard); S.yard-=feed;
  // 3 pulper → chest
  if(M.yardEat) S.yard=Math.max(0,S.yard-M.yardEat*dt/60);
  const fiberIn=feed*P.yieldF*M.yieldMul; S.tank=Math.min(P.tankCap,S.tank+fiberIn);
  // 5 paper machine
  const level=S.tank/P.tankCap*100, low=C.lowLevel.v;
  if(M.pmDown){ if(S.pm!=="incident"){ S.pm="incident"; S.lastDown=M.pmDown; } }
  else if(S.pm==="incident"){ if(level>8)rethread("after the shutdown"+(S.lastDown?" ("+S.lastDown+")":"")); else S.pm="down"; S.pmSpeed=Math.min(S.pmSpeed,P.minSpeed); }
  if(S.pm==="break"){if(working("brk"))S.breakLeft-=dt;S.tot.breakMin+=dt;if(S.breakLeft<=0&&level>8){S.pm="run";S.pmSpeed=Math.min(C.pmSp.v,P.minSpeed+300);}}
  else if(S.pm==="down"){if(level>=Math.max(20,low*0.8)){rethread("after running out of stock");S.pmSpeed=P.minSpeed;}}
  else if(S.pm==="full"){if(S.fg<P.fgCap*0.95){S.pm="run";S.pmSpeed=P.minSpeed;}}
  else if(S.pm==="spools"){if(reelsAtWinder()<=P.storeReels){S.pm="run";S.pmSpeed=P.minSpeed;}}
  let prod=0;
  if(S.pm==="run"){
    let tgt=C.pmSp.v*M.speedCap;
    if(level<low){const f=clamp((level-5)/(low-5),0,1);
      const supply=(S.rates.fiberIn*P.pmLoss)/(P.K*g.bw);
      tgt=Math.min(C.pmSp.v,Math.max(supply,C.pmSp.v*f));}
    tgt=Math.max(Math.min(tgt,C.pmSp.v*M.speedCap),P.minSpeed);
    const r=P.ramp*dt; S.pmSpeed+=clamp(tgt-S.pmSpeed,-r*2,r);
    if(level<5){S.pm="down";}
    else if(S.reel>=P.jumbo&&reelsAtWinder()>P.storeReels){S.pm="spools";}
    else if(L.brk<dt/390*0.25*P.breakBase*(outRel("wet")+outRel("dry"))/2*((C.breaks?P.gradeBrk:0)+(M.breakMul-1))){S.pm="break";const r=L.brkType;S.brkType=r<0.45?"reel":r<0.8?"dryer":"press";
      S.breakLeft=2*(S.brkType==="reel"?4+L.brkLen*6:S.brkType==="dryer"?12+L.brkLen*14:26+L.brkLen*20);S.breakTotal=S.breakLeft;S.tot.breaks++;enqueue("brk");AUDIO.sfx("snap",2500);
      log(`Sheet break ${S.brkType==="reel"?"at the reel (short)":S.brkType==="dryer"?"before the dryers":"before the presses (long)"}`,"warn");brkNote();}
    if(S.pm==="run"){
      prod=P.K*S.pmSpeed*g.bw*dt/60;
      const use=prod/P.pmLoss;
      if(use>S.tank){prod=S.tank*P.pmLoss;}
      S.tank-=prod/P.pmLoss;
    }
  }
  if(S.pm!=="run") S.pmSpeed=ease(S.pmSpeed,0,dt,3);
  if(prod>0){spend(prod*energyCost(),"energy");S.q.made+=prod;
    let off=0;if(M.offSpec)off=prod;
    else if(S.chg){off=Math.min(prod,S.chg.left);S.chg.left-=off;if(S.chg.left<=1e-6){log(`Grade change to ${S.chg.to} complete: back on spec`,"ok");S.chg=null;}}
    if(off>0){S.tot.broke+=off;S.tot.beater=(S.tot.beater||0)+off;S.q.off+=off;S.q.bank+=off;prod-=off;}
    if(S.plan.hot&&C.grade==="33HT")S.plan.hot.made+=prod;}
  S.reel+=prod; S.tot.prodT+=prod; S.tot.pot+=P.K*C.pmSp.v*g.bw*dt/60;
  planTick(dt,prod);
  if(S.reel>=P.jumbo&&reelsAtWinder()<=P.storeReels){S.winderBuf+=S.reel;S.reel=0;S.tot.turnups++;}
  // 6 winder
  if(S.wd==="hayout"){if(working("hay"))S.hayLeft-=dt;S.tot.hayMin+=dt;if(S.hayLeft<=0){S.wd="run";log("Winder cleaned up and running again","ok");}}
  if(S.conv===undefined)S.conv=0;const convFull=S.conv>=P.convCap-1e-6;S.wdBlocked=convFull;
  const cut=S.wd==="hayout"||M.winderDown||convFull?0:Math.min(S.winderBuf,C.wdr.v*dt/60); S.winderBuf-=cut; S.winderAcc+=cut;
  if(cut>0&&L.hay<dt/720*0.75*P.hayBase*outRel("dry")*((C.hays?1:0)+(M.hayMul-1)))hayout(L.hayLen,L.hayLoss);
  let rollsMade=0;
  while(S.winderAcc>=C.rollW.v){S.winderAcc-=C.rollW.v;S.conv+=1;rollsMade++;S.tot.rolls++;}
  // 6 outbound
  if(!M.noOut) S.outPhase+=dt*C.outRate.v/60*S.outJit*wxTruck;
  while(S.outPhase>=1){S.outPhase-=1;S.outJit=0.6+rand("flow")*0.8;
    if(S.outQ.length<P.maxQueue){S.outQ.push(newTruck("out"));S.tot.outTrucks++;}}
  S.outQ.forEach(t=>t.wait+=dt);
  for(let d=0;d<P.shipDoors;d++) if(!S.outDock[d]&&S.outQ.length) S.outDock[d]=S.outQ.shift();
  const effHum=Math.min(C.loaders.v,M.ldrCap); S.effHum=effHum; const effLd=effHum+P.robots; S.effLd=effLd;
  let lcap=effLd*P.loaderRate*dt/60*M.clampMul, loaded=0;
  // clamp trucks first clear the roll conveyor into the warehouse (more urgently as it fills), then load trucks
  {const u=S.conv/P.convCap,docked=S.outDock.some(Boolean),share=docked?(u>0.6?0.9:0.5):1;
    const put=Math.max(0,Math.min(S.conv,P.fgCap-S.fg,lcap*share));S.conv-=put;S.fg+=put;lcap-=put;S.rates.put=ease(S.rates.put||0,put*60/dt,dt,6);}
  for(let d=0;d<P.shipDoors;d++){const tr=S.outDock[d]; if(!tr)continue;
    const l=Math.min(P.truckRolls-tr.load,P.doorRolls*dt/60,lcap,S.fg);
    tr.load+=l;lcap-=l;S.fg-=l;loaded+=l;
    if(tr.load>=P.truckRolls-1e-6){S.leaving.push({...tr,ty:outY(d),kind:"out"});S.outDock[d]=null;S.tot.shipped+=P.truckRolls;const tons=P.truckRolls*C.rollW.v;S.shipT+=tons;earn(tons*priceOf(C.grade));}}
  spend(((C.drivers.v+C.loaders.v+P.techs)*ECON.wage+P.robots*ECON.robot+P.pmCost)*dt/60,"labor");
  spend(ECON.overhead*dt/60,"overhead"); if(P.premium)spend(P.premium*dt/60,"premium");
  // v3.1.2: profit/day is OPERATING profit over the last 12 game hours: good paper is valued as it comes off the machine (tons x price),
  // less OCC, energy, labor, overhead and insurance. One-offs (upgrades, outage budgets, repair bills, card deals) are left out,
  // and so is the lumpy timing of truck departures. Cash and the season score are unchanged.
  if(!S.over&&!S.free&&!S.zen&&S.cash<ECON.bankrupt&&!(S.season&&S.season.on)){S.over="bankrupt";showOverlay("bankrupt");}
  if(!S.won&&!S.free&&!S.zen&&S.cash>=ECON.goal){S.won=true;if(!(S.season&&S.season.on))showOverlay("win");}
  rcTick(dt);
  seasonTick();
  // smoothed rates (per hour)
  const R=S.rates,k=v=>v*60/dt;
  R.feed=ease(R.feed,k(feed),dt,6);R.unload=ease(R.unload,k(unloaded),dt,6);R.fiberIn=ease(R.fiberIn,k(fiberIn),dt,6);
  R.prod=ease(R.prod,k(prod),dt,6);R.fiberUse=ease(R.fiberUse,k(prod/P.pmLoss),dt,6);R.load=ease(R.load,k(loaded),dt,6);R.rolls=ease(R.rolls,k(rollsMade),dt,10);R.cut=ease(R.cut,k(cut),dt,6);
  {const L1=S.ledger,op=prod*priceOf(C.grade)-(L1.occ+L1.energy+L1.labor+L1.overhead+L1.premium-op0),B=S.opb||(S.opb={b:new Array(72).fill(0),i:-1});
    const bi=Math.floor(S.t/10);if(bi!==B.i){for(let j=Math.max(B.i+1,bi-71);j<=bi;j++)B.b[((j%72)+72)%72]=0;B.i=bi;}
    B.b[bi%72]+=op;const span=Math.min(720,Math.max(10,S.t));S.profitRate=B.b.reduce((a,v)=>a+v,0)/span*1440;}
  // trend every 10 sim min
  S.trendAcc+=dt;
  if(S.trendAcc>=10){S.trendAcc-=10;S.trend.push([S.tank/P.tankCap,S.pmSpeed/3300,S.yard/P.yardCap,S.fg/P.fgCap]);if(S.trend.length>144)S.trend.shift();}
}

