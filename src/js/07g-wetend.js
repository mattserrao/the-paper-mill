/* ---- v6.8 relationships: the wet end's water and the basis weight loop, refining energy and strength, bale water in the
   pulper, and cleaner / screen pressure drop (claude/relations-v68-plan.md). No dice anywhere: seasons replay identically.
   Untouched (standard refining, the BW loop in AUTO on the grade's target, clean stock, the silo overflowing) every
   multiplier here is exactly 1, so production, steam and the water balance are as they were before v6.8.

   Headbox and basis weight. The fan pump's flow is set by speed (jet-to-wire ratio): the design headbox flow carries the
   setpoint's fiber at 0.8 % (WE.hbc). Thick stock comes from the machine chest through the basis weight valve; its fiber
   (valve x machine chest consistency) is what makes the sheet, so basis weight = setpoint x delivered / design fiber, and
   headbox consistency moves with it. The rest of the headbox flow is white water from the silo, pumped in at the fan pump
   to dilute the thick stock down. AUTO: the valve follows speed and the setpoint (feed-forward) and an integral trim
   corrects what the QCS measures, which reads WE.dead minutes late (the scanner and the transport), so a disturbance shows
   on the trend before it is corrected. MANUAL: the valve holds the operator's %, and speed changes move the weight.

   Machine water. Headbox water = fiber x (100 / HB consistency - 1). Drained on the table and at the couch: the headbox
   water less what the sheet carries at couch solids. Most of it falls to the white water silo; the vacuum boxes' share
   (more with more vacuum) goes to the seal pit and the long circuit. Press water (couch to press solids) goes to the
   save-all and the white water chest. The water chest (07f) still books the net; the silo's storage is the difference.

   White water silo. In: table and couch drainage. Out: the fan pump's dilution. It runs full and overflows to the white
   water chest; it draws down when dilution needs more than drains in (thick stock, high vacuum). Below 25 % it makes up
   from the white water chest (WE.make); below 15 % the fan pump cavitates (headbox consistency and weight swing); held
   under 8 % the sheet breaks at the wet end. While the machine is down the crew fills it back to 60 %.

   Refining. The refiners' knob is specific energy (kWh/t, standard 60); the plate gap follows. More energy: lower
   freeness, slower drainage (lower couch solids, 07b dewater), and more ring crush. Ring crush scales with basis weight,
   so more refining lets the BW setpoint come down and still pass the strength spec; paper is sold by area (v6.11.2), so
   a lighter sheet sells more ft² a ton (and a heavier one fewer). Refining power is billed as energy (more or less than standard).

   Bale water: wet bales thin the pulper; the dilution loop takes the water back out over WE.cpTau minutes.
   Cleaners and screens: pressure drop builds with dirty bales (and a fine screen with its load); past a clean level
   the rejects carry good fiber with them, so the yield falls. */
const WE={lwM:1.03,lwTau:45,hbc:0.8,mc0:3.2,dead:3,tauI:8,trimMin:-0.10,trimMax:0.05,valveMax:100,
  silo:60000/264.172,over:0.85,makeL:0.25,make:120,cav:0.15,trip:0.08,tripMin:30,refill:0.6,seal0:0.18,sealK:0.006,
  kwh0:60,kwhMin:20,kwhMax:130,rctK:0.0045,rctStk:0.05,rctDraw:0.04,rctSpec:0.97,kwhCost:0.07,
  cpK:0.12,cpTau:20,dirt:0.8,dirtRef:0.1,rejOn:1.1,rejW:{hd:0.03,lc:0.04,lw:0.03,fs:0.05},fs0:30*KP};   // (v6.13.2: fine screen ΔP in psi)
// ring crush (lbf/6 in) of each grade at its target weight and standard refining; the spec is 97 % of it
// v6.13.2 Real Numbers: ring crush at recycled-medium levels (lbf/6 in; 26-lb recycled medium runs ~30). It was 60/67/75/84,
// about twice real; the spec (0.97 x) and AUTO-LW are ratios, so the trimming is unchanged
const RCT0={"24":30,"28":35,"31":40,"34Super":46};
// refining: specific energy <-> plate gap (mm) <-> freeness (mL CSF)
const gapOf=e=>clamp(0.5-(e-WE.kwh0)*0.35/60,0.08,1.0);
const eOfGap=g=>WE.kwh0+(0.5-g)*60/0.35;
const csfOf=g=>450+(g-0.5)*446;
// drainage factor on couch solids from freeness (07b dewater): slower with lower freeness, a little faster above standard
const eDrain=csf=>csf<450?1-(450-csf)/450*0.8:1+(csf-450)/450*0.25;
function weState(){if(!S.we)S.we={L:WE.silo*WE.over,c:1,m:"auto",v:50,trim:0,q:[],bw:null,hbc:WE.hbc,cav:0,H:0,cpc:0,fs:WE.fs0,f:{}};return S.we;}
// v6.8: an older save's refiner knob held the plate gap (mm); it's specific energy now
function weMigrate(){const K=S&&S.knob;if(K&&K.v&&K.v.ref!=null&&K.v.ref<=1.5)K.v.ref=Math.round(eOfGap(K.v.ref));
  // v6.13: before, the slice opening set the jet's speed (J/W 0.985 + 0.02 x opening); now the fan pump holds a J/W setpoint and
  // the slice sets the headbox consistency: an older save keeps its J/W, with the slice back at its standard opening
  if(S&&!S.hb&&K&&K.v&&K.v.sv){S.hb={jw:Math.round((HB.jw0+0.02*K.v.sv)*1000)/1000};K.v.sv=0;K.any=true;}}
const bwStd=()=>(GRADES[C.grade]||GRADES["24"]).bw;
const bwSp=()=>bwStd()*(1+(S.we?S.we.trim:0));
// refining energy the stock on the machine has had (lagged through the chest by the knob model)
/* v6.12.1-t7 the refiners' power cap: they can put REFCAP.kw into the stock between them (x1.3 with the refiner upgrade), so the
   specific energy they deliver (kWh/t; 1 HPDT = 17.9 kWh/t) is the setpoint or what that power spreads over the tonnage,
   whichever is less. At 60 kWh/t that holds to 40 t/h (52 with the upgrade); past it the refining, and its strength,
   falls away. gapOf/eOfGap: the plate gap for an energy and back */
const REFCAP={kw:2400,up:1.3},HPDT=17.9;
const refCap=()=>REFCAP.kw*(LV("refiner")?REFCAP.up:1);
const refTph=()=>S.pm==="run"?Math.max(0,S.rates.fiberUse||0):0;
const refEff=set=>{const t=refTph();return t>0?Math.min(set,refCap()/t):set;};
const kwhNow=()=>{const K=S.knob;return K&&K.any&&K.x?eOfGap(K.x.fr):refEff(K?knobVal("ref"):WE.kwh0);};
// machine chest consistency (07b knobRead shows it): the agitator's swings, thick stock from an empty water chest
function mcCons(){const K=S.knob,sw=K&&K.any&&!S.zen&&K.x?K.x.sw:0,t=S.t;return WE.mc0+sw*0.9*(Math.sin(t*0.21+3)*0.6+Math.sin(t*0.21*2.7+6)*0.4)+(S.wat?S.wat.shortK*0.6:0)+vlvMc();}   // (v6.9: + pulper consistency swings, NV-101, 07h)
// fiber t/h the design headbox flow is sized for (the setpoint at this speed)
const weU0=sp=>P.K*Math.max(sp,1)*bwSp()/P.pmLoss;
const weUstd=()=>{const g=GRADES[C.grade]||GRADES["24"];return P.K*g.sp*g.bw/P.pmLoss;};
const wobW=(f,k)=>Math.sin(S.t*f+k)*0.6+Math.sin(S.t*f*2.7+k*2)*0.4;
// the basis weight valve (%) the AUTO loop asks for at this speed
const weValveAuto=sp=>50*weU0(sp)/weUstd()*S.we.c;
// the basis weight the machine is actually making (the loop's process value, before the QCS sees it)
function bwTrue(){const W=weState();if(S.pm!=="run")return bwSp();if(vlvT("FV-201"))return S.vlv.lp["FV-201"].y;   // (v6.9: FV-201's model once touched, 07h)
 const mr=mcCons()/WE.mc0,cv=1+W.cav*0.06*wobW(0.9,17);
  if(W.m==="auto")return bwSp()*W.c*mr*cv;   // (the valve's feed-forward cancels speed exactly; written this way so untouched it is exactly the setpoint)
  const sp=Math.max(S.pmSpeed,P.minSpeed*0.5);return bwSp()*weUstd()*(W.v/50)*mr/weU0(sp)*cv;}
// what the QCS reads: the weight WE.dead minutes ago
function bwMeas(){const W=weState(),q=W.q,t=S.t-WE.dead;if(!q.length)return W.bw!=null?W.bw:bwSp();
  let v=q[0][1];for(const r of q){if(r[0]<=t)v=r[1];else break;}return v;}
// every step, before the machine makes paper (07-sim-step.js): the loop, the pulper's bale water, the pressure drops
function weTick(dt){const W=weState(),run=S.pm==="run";
  // a grade change: the scanner's last readings were on the old grade's weight; carry them over so the loop doesn't chase the step
  if(W.g!==C.grade){if(W.g&&GRADES[W.g]){const f=bwStd()/GRADES[W.g].bw;for(const r of W.q)r[1]*=f;}W.g=C.grade;}
  W.bw=bwTrue();W.q.push([S.t,W.bw]);while(W.q.length>2&&W.q[1][0]<=S.t-WE.dead-0.5)W.q.shift();
  if(run&&W.m==="auto"&&!W.vl){const e=(bwSp()-bwMeas())/bwSp();W.c=clamp(W.c+dt/WE.tauI*e,0.5,1.6);}
  if(W.m==="auto"&&!W.vl)W.v=clamp(weValveAuto(Math.max(S.pmSpeed,P.minSpeed*0.5)),0,WE.valveMax);
  // v6.10 AUTO-LW: the lightweight optimizer. With ring crush to spare (more refining, less draw, cleaner bales) it trims the
  // basis weight setpoint down to hold the QCS's ring crush at WE.lwM over the grade's minimum; when strength falls it brings
  // the weight back up, never over the grade's target. Slow (WE.lwTau minutes) to ride out the QCS dead time. Held during a
  // grade change and while the sheet is off. On unless the player takes the setpoint to MANUAL (lw:false).
  if(S.chg&&W.lw!==false&&W.trim!==0)W.trim=0;   /* (t4: a grade change starts AUTO-LW over from the new grade's target) */
  // (v6.13: read the QCS fresh here rather than the last step's QNOW: a restored snapshot then replays exactly)
  if(run&&W.lw!==false&&!S.chg&&!S.zen){const q=qualMeasure(),tg=rctSpec()*WE.lwM,ts=stfiSpec()*WE.lwM,e=Math.min((q.rct-tg)/tg,(q.stfi-ts)/ts);W.trim=clamp(W.trim-dt/WE.lwTau*e,WE.trimMin,0);}   // (v6.13: the tighter of ring crush and STFI CD, 07n)
  // bale water in the pulper: a step in bale moisture thins the tub, and the dilution loop takes it back out
  if(baleOn()&&S.bq){const d=-WE.cpK*Math.max(0,S.bq.m-BALE.std)*100;W.cpd=d;W.cpc=ease(W.cpc||0,d,dt,WE.cpTau);}else{W.cpd=0;W.cpc=0;}
  // fine screen pressure drop: its load and the dirt in the stock
  {const ld=(S.rates.fiberIn||0)/Math.max(1,P.screenMax),on=motStatus("fscr")==="run"&&!(S.M&&S.M.pulperDown);
    W.fs=ease(W.fs,on?WE.fs0*(0.55+0.45*ld)*weDirt()+(active("fscreen")?30*KP:0):0,dt,10);}}
// the pulper's consistency dip from bale water (% points, negative while the loop catches up)
const cpBale=()=>S.we&&!S.zen&&!vlvT("NV-101")?(S.we.cpd||0)-(S.we.cpc||0):0;   // (v6.9: once touched, NV-101's model carries the bale water, 07h)
// how dirty the stock is: the yard mix's contamination (A bales clean, B and C dirty)
const weDirt=()=>baleOn()&&S.bq?1+WE.dirt*Math.max(0,S.bq.k-WE.dirtRef):1;
// pulper yield after the rejects that high pressure drop carries out with good fiber
function dpYield(){if(S.zen)return 1;let x=0;for(const k of ["hd","lc","lw"])x+=WE.rejW[k]*Math.max(0,purgeDp(k)/PURGE.base[k]-WE.rejOn);
  const fs=S.we?S.we.fs:WE.fs0;x+=WE.rejW.fs*Math.max(0,fs/WE.fs0-WE.rejOn);return clamp(1-x,0.7,1);}
// strength: ring crush from refining, the measured weight and stickies; the spec is the grade's
const rctSpec=()=>Math.round((RCT0[C.grade]||30)*WE.rctSpec*10)/10;
// (v6.8.3: open draw: each % of draw over the 1.5 % standard stretches the sheet and takes 4 % off ring crush; less draw adds it)
function rctNow(bw){const ri=1+WE.rctK*(kwhNow()-WE.kwh0)-WE.rctStk*Math.max(0,((S.bq&&!S.zen)?S.bq.ck:0.1)-0.1)-WE.rctDraw*((S.zen?drawStd():knobVal("draw"))-drawStd());   // (v6.11.2: dry strength starch removed; v6.11.1 added its ring crush here)
  return (RCT0[C.grade]||30)*(bw/bwStd())*ri*shStrF();}   // (v6.13: formation and broke, 07n; 1 untouched)
// v6.11.2 paper is sold by area (MSF, thousand ft²), the way box plants buy it. The list price ($/t) is for a ton at the
// grade's target weight; a ton made lighter covers more ft² and sells for list × bwStd/bw, a heavier one for less. The player
// still sees tons: the ratio rides on every lot from the reel to the truck (06 lotPut) and is paid when the truck leaves.
const areaF=bw=>S.zen||!(bw>0)?1:bwStd()/bw;
const areaNow=()=>S.pm==="run"&&S.we&&S.we.bw>0?areaF(S.we.bw):1;            // the paper being made now (true weight)
const areaQcs=()=>areaF(S.pm==="run"&&S.we?bwMeas():bwSp());                   // what the QCS shows (or the setpoint when down)
const msfPerT=(g,a)=>2*(a||1)/((GRADES[g]||GRADES["24"]).bw/1000);            // MSF in a short ton: 2000 lb / (lb per 1000 ft²)
const priceEff=()=>priceOf(C.grade)*areaQcs();
const wcFmt=a=>{const p=(a-1)*100;return Math.abs(p)<0.05?"sells at list (by area)":`${p>0?"+":"−"}${Math.abs(p).toFixed(1)}% ${p>0?"light":"heavy"}, by area`;};                                     // $/t for the paper on the machine now
// the paper machine's water this step (07f waterTick, before its own sums): returns the change in the silo's water (t)
function weFlow(dt,u){const W=weState(),h=dt/60,F=W.f,run=S.pm==="run"&&u>0;
  const K=S.knob,x=K&&K.any&&K.x?K.x:null,cs=x&&x.cs!=null?x.cs:csStd(),ps=x&&x.ps!=null?x.ps:psStd(),vac=x?x.vac:30;
  const L0=W.L;let make=0,over=0,hb=0,dil=0,drain=0,seal=0,press=0,hbc=WE.hbc;
  if(run){const U=u/h,sp=Math.max(S.pmSpeed,1),mc=mcCons(),Qd=weU0(sp)*100/hbcSet(),Ft=U*100/mc,Dd=Math.max(0,Qd-Ft);
    const s=clamp(WE.seal0+WE.sealK*(vac-30),0.08,0.4),siloIn=Q=>Math.max(0,Q-U*100/cs)*(1-s);
    // the fan pump: full dilution while the silo has water; with it empty, only what drains in and the makeup (t/h)
    const avail=W.L/h+siloIn(Ft+Dd)+(W.L<WE.silo*WE.makeL?WE.make:0),D=Math.min(Dd,avail);
    const Q=Ft+D;hb=Q;dil=D;hbc=U/Q*100*(1+W.cav*0.12*wobW(1.3,19));drain=Math.max(0,Q-U*100/cs);seal=drain*s;press=U*Math.max(0,100/cs-100/ps);
    if(vlvT("LV-202")){const A=S.vlv.acc;make=A.make;over=A.over;W.net=drain-seal-D;}   // (v6.9: LV-202's sub-steps moved the level and booked the makeup and overflow; W.net is what they integrate next, 07h)   // (its sub-steps moved the level and booked the makeup and overflow)
    else{let L=W.L+(drain-seal-D)*h;
    if(L<WE.silo*WE.makeL){make=Math.min(WE.make*h,WE.silo*WE.makeL-L);L+=make;}
    if(L>WE.silo*WE.over){over=L-WE.silo*WE.over;L-=over;}
    W.L=Math.max(0,L);}}
  else if(vlvT("LV-202")){W.net=0;make=S.vlv.acc.make;over=S.vlv.acc.over;}
  else if(W.L<WE.silo*WE.refill){make=Math.min(WE.make*h,WE.silo*WE.refill-W.L);W.L+=make;}
  W.hbc=run?hbc:WE.hbc;
  W.cav=run?clamp((WE.cav-W.L/WE.silo)/WE.cav,0,1):0;
  // held nearly empty, the fan pump loses suction and the sheet goes at the wet end
  if(run&&!S.zen&&W.L/WE.silo<WE.trip){W.H+=dt/WE.tripMin;if(W.H>=1){W.H=0;weBreak();}}else W.H=Math.max(0,W.H-dt/120);
  const k=v=>v/h;F.hb=ease(F.hb||0,k(hb*h),dt,4);F.dil=ease(F.dil||0,k(dil*h),dt,4);F.drain=ease(F.drain||0,k(drain*h),dt,4);F.seal=ease(F.seal||0,k(seal*h),dt,4);
  F.press=ease(F.press||0,k(press*h),dt,4);F.over=ease(F.over||0,k(over),dt,4);F.make=ease(F.make||0,k(make),dt,4);
  return W.L-L0+(vlvT("LV-202")?S.vlv.acc.dL||0:0);}
// a sheet break from the fan pump cavitating (no dice: a fixed rethread at the wet end)
function weBreak(){if(S.pm!=="run")return;S.pm="break";S.brkType="press";S.breakLeft=2*36;S.breakTotal=S.breakLeft;S.tot.breaks++;enqueue("brk");AUDIO.sfx("snap",2500);
  log("Sheet break at the wet end: the white water silo ran low and the fan pump cavitated.","warn");brkNote();brLog1("press","stock");}
// the BW loop from the DCS (50d)
function bwSetMode(m){if(S.zen)return;const W=weState();if(m===W.m)return;
  if(m==="auto"){const sp=Math.max(S.pmSpeed,P.minSpeed*0.5),c0=W.c;W.c=1;const base=weValveAuto(sp);W.c=clamp(base>0?W.v/base:c0,0.5,1.6);}   // (bumpless: the trim takes over where the valve is)
  W.m=m;log(`Basis weight control to ${m==="auto"?"AUTO":"MANUAL"}`,"ok");}
function bwSetValve(v){if(S.zen)return;const W=weState();W.m="manual";W.v=clamp(+v,0,WE.valveMax);}
function bwSetTrim(lb){if(S.zen)return;const W=weState();W.lw=false;W.trim=clamp(+lb/bwStd()-1,WE.trimMin,WE.trimMax);}

/* ---------- v6.9.2 the refiners and the machine chest (v6.12.1-t5: back to this order, with the refiners in the hall's
   approach bay: stock chest > refiners > machine chest > machine chest pump > fan pump): the refiners take stock from the stock (storage) chest and feed the
   machine chest; the machine draws the machine chest. With the refiner plates clashed (an upset's refOut) nothing goes
   forward: the machine runs the chest down at its draw (the LV-104 model's 13.75 %/min at standard) and trips on low
   level; back on line the refiners refill it at twice the standard flow, out of the stock chest, and the machine rethreads
   once it's back over the restart level. Untouched and undisturbed the level is LV-104's steady 69 % (S.mcl null). With
   LV-104 on the valve model (07h) the valve model owns the level and its inflow stops instead. ---------- */
const MCH={sp:69,trip:10,restart:35,k:13.75,fill:2};
const mcLvlNow=()=>vlvT("LV-104")?S.vlv.lp["LV-104"].y:(S.mcl==null?MCH.sp:S.mcl);
function mcTick(dt,M){if(S.zen){S.mcl=null;S.mcTrip=false;S.refq=null;return false;}
  const out=!!M.refOut,own=vlvT("LV-104"),ustd=Math.max(1e-6,weUstd()),q=S.pm==="run"?(S.rates.fiberUse||0)/ustd:0;
  S.refq=out?0:null;   // (null: the refiners pass what the machine draws; the reading works it out)
  if(!own){let y=S.mcl==null?MCH.sp:S.mcl;
    if(out)y=Math.max(0,y-MCH.k*q*dt);
    else if(y<MCH.sp){const dy=Math.min(MCH.sp-y,MCH.k*Math.max(0,MCH.fill-q)*dt),tk=dy*ustd/60/MCH.k,got=Math.min(S.tank,tk);
      S.tank-=got;y+=tk>0?dy*got/tk:0;S.refq=MCH.fill;}
    S.mcl=(!out&&y>=MCH.sp-1e-6)?null:y;}
  const y=mcLvlNow();
  if(!S.mcTrip&&out&&y<=MCH.trip){S.mcTrip=true;log("Machine chest low level: with the refiners down nothing is coming forward. The paper machine is shut down.","bad");}
  else if(S.mcTrip&&!out&&y>=MCH.restart){S.mcTrip=false;log("The refiners are back and the machine chest is filling: the machine is coming back up.","ok");}
  return !!S.mcTrip;}
