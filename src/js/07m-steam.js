/* ---- v6.13 Steam and Sheet: the dryer cans, the steam and condensate cascade, the hood air and the energy KPIs ----
   (plan: claude/v613-steam-sheet-plan.md, parts A2 and B)
   The 20 cans. The 3D machine has 20 dryer cans: the 1st section is cans 1-6, the 2nd 7-12 and the 3rd 13-20. Each
   section dries its share of the water (STM.share); each can its section's share split evenly. The dryer model (07d)
   still works out the whole section's load and moisture; the cans only say how much of it can't be dried because a can
   is full of condensate (flooded): the rest of the cans have to make up for it, so the 3rd section's demand goes up by
   1 / (1 - lost). Untouched no can floods and the factor is exactly 1.
   The cascade. Steam goes to the 3rd section; what blows through its syphons goes to the thermocompressor (TC-304),
   which recompresses it with motive steam back into the 3rd section's header; the 2nd section's blow-through feeds the
   1st, and the 1st's goes to the surface condenser. The syphons need a differential pressure (ΔP, kPa) across them to
   lift the condensate out of a spinning can, and more the faster the machine runs (STM.needK a 300 fpm over 2,632 fpm).
   Short of it the cans flood, from the back of the section forward; over it more steam blows through, and past
   STM.btWaste of a section's steam the extra goes to the condenser and is wasted. AUTO schedules every section's ΔP with
   speed (need + STM.margin), so an untouched machine never floods or wastes. PDC-304 (the 7th control loop, 07h) holds
   the 3rd section's ΔP with the thermocompressor's motive steam valve; the hand valve on the motive line in the dryer
   basement (a fiddly knob, "tcv") caps what it can deliver.
   A broken syphon (the "syphon" upset, tellable: the IR gun finds a cold can on the dry end round) floods one can
   whatever the ΔP. The daily dry end round also takes an IR survey of all 20 can shells (S.stm.ir), stale like the
   vibration data.
   The hood. The water the dryers evaporate goes into the hood air. Exhaust air carries it out: humidity H (g water / kg dry
   air) = the supply air's + the water / the dry air. AUTO holds 160 g/kg with the exhaust fan and supply follows at 95%
   of the exhaust (the hood runs a little negative). Over 200 g/kg the pockets dry slower (more demand); past the dew
   point condensate drips from the hood (spots on the sheet, breaks). Under 120 the extra air is heated for nothing. Supply
   over exhaust spills hood air into the machine room. The machine room's humidity: the hood's spill, the wet end's vapour
   and the fog fan; with the fog fan down AUTO raises the hood exhaust to take some of it, and over ~75% RH the roof drips.
   The supply air coils use STM.air of the dryer steam (in today's steam bill); heat recovery (an upgrade) saves STM.hrK of
   it. Energy: condensate comes back to the power house (85% standard); what doesn't is made up with fresh water that has
   to be heated, so steam costs more per ton. Untouched, every factor here is exactly 1 and nothing extra is charged.
   Seasons, survival and free play; zen keeps the plain dryer model. No dice except the upset's own stream. ---- */
const STM={cans:20,sec:[[0,6],[6,12],[12,20]],share:[0.25,0.30,0.45],need0:[5,14,23],needK:4,spRef:2632,margin:12,dpMax:80,
  flSpan:15,flUp:10,flDn:5,drvK:1.5,bt0:0.03,btK:0.004,btWaste:0.15,tcK:60,
  H:160,Hhi:200,Hdrip:215,Hlo:120,exhAuto:75,supK:0.95,air:0.12,hrK:0.55,ret:0.85,fuelK:0.25,hum0:55,humWet:7,fogUp:15,
  irStale:24*60,irUnknown:72*60};
const stmOn=()=>!!(S&&!S.zen);
const STMN=["1st","2nd","3rd"];
function stmState(){if(!S.stm)S.stm={dp:[15,25,35],fl:new Array(STM.cans).fill(0),bt:[0,0,0],waste:0,H:STM.H,exh:STM.exhAuto,sup:STM.exhAuto*STM.supK,exhM:"auto",supM:"auto",
    exhSp:STM.exhAuto,supSp:STM.exhAuto*STM.supK,hum:62,ret:STM.ret,mk:0,air:0,drip:0,roof:0,ir:null,syph:-1,sp4:null,kpi:{st:0,kwh:0,usd:0}};return S.stm;}
// the ΔP each section needs at this speed, and what AUTO schedules (need + margin)
const stmNeed=(i,sp)=>Math.max(3,STM.need0[i]+STM.needK*((sp??(S.pm==="run"?S.pmSpeed:C.pmSp.v))-STM.spRef)/300);
const stmAuto=(i,sp)=>stmNeed(i,sp)+STM.margin;
// PDC-304's setpoint: AUTO's speed schedule unless the player has set one
const stmSp=()=>{const T=S.stm;return T&&T.sp4!=null?T.sp4:stmAuto(2);};
// the thermocompressor's reach: the motive hand valve (the knob) caps the 3rd section's ΔP
const stmTcMax=()=>STM.tcK*Math.pow(knobVal("tcv")/100,1.5);
// what flooded cans take off the drying (0 = none) and the demand factor that follows; the hood's slow drying on top
function stmLost(){const T=S.stm;if(!T||!stmOn())return 0;let l=0;for(let s=0;s<3;s++){const [a,b]=STM.sec[s],w=STM.share[s]/(b-a);for(let j=a;j<b;j++)l+=w*T.fl[j];}return Math.min(0.6,l);}
function stmDemF(){if(!stmOn()||!S.stm)return 1;const H=S.stm.H,h=H>STM.Hhi?1+0.004*(H-STM.Hhi):1;return h/(1-stmLost());}
// flooded can count (a can over half full counts), for the screens
const stmFlooded=()=>S.stm?S.stm.fl.filter(f=>f>0.5).length:0;
const stmFloodSum=()=>S.stm?S.stm.fl.reduce((a,f)=>a+f,0):0;
// the dryer section drive's extra load (%): every flooded can drags (07i rlyLoad)
const stmDrvAdd=()=>stmOn()?STM.drvK*stmFloodSum():0;
// $ per tonne of steam at today's price (the dryers' per-ton steam bill spread over the steam a ton takes, as 07d's vent)
const stmPrice=()=>{const wpt=dryWpt()*DRY.stPerW;return wpt>0?Math.max(0,energyCostT()-pfChemT())/wpt:0;};
// the shell temperature of can j (°C): its section's steam saturation, less what a flooded can loses
function stmShell(j){const T=S.stm,s=j<6?0:j<12?1:2,D=S.dry,run=S.pm==="run",p=s===0?knobVal("st1"):s===1?(D?D.st3*0.8:96):(D?D.st3:120);
  const sat=100+0.27*Math.max(0,p)-0.00035*p*p,f=T?T.fl[j]:0;return run||S.pm==="break"?sat-55*f:45;}

// a can's shell temperature with nothing wrong (its section's steam), for the survey's "cold can" call
function stmShellStd(j){const T=S.stm,f=T?T.fl[j]:0;return stmShell(j)+55*f;}
function stmTick(dt){if(!stmOn())return;const T=stmState(),run=S.pm==="run",D=S.dry||dryState(),h=dt/60;
  // ---- ΔP per section: AUTO's schedule; PDC-304 (the valve model, 07h) once touched; the hand valve's cap ----
  const cap=stmTcMax();
  for(let s=0;s<3;s++){let tgt=s===2?Math.min(stmSp(),cap):stmAuto(s);
    if(s===2&&vlvT("PDC-304"))tgt=S.vlv.lp["PDC-304"].y;
    if(!run)tgt=s===2?Math.min(stmAuto(2,P.minSpeed),cap):stmAuto(s,P.minSpeed);
    T.dp[s]=s===2&&vlvT("PDC-304")?tgt:ease(T.dp[s],tgt,dt,1);}
  // ---- the cans: flood where the ΔP is short of what the speed needs (from the back of each section), or a broken syphon ----
  const sy=T.syph;
  for(let s=0;s<3;s++){const [a,b]=STM.sec[s],n=b-a,d=run?stmNeed(s)-T.dp[s]:-1,nT=clamp(d/STM.flSpan,0,1)*n;
    for(let j=a;j<b;j++){const k=b-1-j,t=j===sy?1:clamp(nT-k,0,1),f=T.fl[j];
      T.fl[j]=t>f?ease(f,t,dt,STM.flUp):t<f?ease(f,t,dt,STM.flDn):f;if(T.fl[j]<1e-4&&t===0)T.fl[j]=0;}}
  // ---- blow-through and the steam it wastes (past STM.btWaste of a section's steam, it goes to the condenser) ----
  let waste=0;const st=run?D.steam:0;
  for(let s=0;s<3;s++){const m=T.dp[s]-stmNeed(s),bt=clamp(STM.bt0+STM.btK*m,0,0.6);T.bt[s]=run?bt:0;waste+=run?Math.max(0,bt-STM.btWaste)*st*STM.share[s]:0;}
  T.waste=ease(T.waste,waste,dt,2);
  // ---- the hood ----
  const evap=run?D.steam/DRY.stPerW:0,E0=Math.max(1,dryRef("24")*DRY.wpt0),Hin=stmHin(),A0=E0*1000/((STM.H-stmHin0())*STM.exhAuto/100);   // (A0: t/h of dry air at 100% exhaust)
  const fog=motStatus("fog")!=="run"||active("fogfan");
  if(T.exhM==="auto"){const need=evap>0?evap*1000/(STM.H-Hin)/A0*100:STM.exhAuto*0.4;T.exhSp=clamp(need*(fog?1+STM.fogUp/100:1),20,100);}
  if(T.supM==="auto")T.supSp=T.exhSp*STM.supK;
  T.exh=ease(T.exh,T.exhSp,dt,2);T.sup=ease(T.sup,T.supSp,dt,2);
  const A=Math.max(1e-6,A0*T.exh/100);T.H=evap>0?Hin+evap*1000/A:Hin+8;
  T.drip=run?clamp((T.H-STM.Hdrip)/40,0,1):0;
  // machine room humidity: the hood's spill (supply over exhaust), the wet end's vapour, the fog fan (exhaust raised for it on AUTO)
  const spill=Math.max(0,(T.sup-T.exh)/Math.max(1,T.exh)),hum=STM.hum0+(run?STM.humWet:STM.humWet*0.4)+spill*120+(fog?24-(T.exhM==="auto"?10:0):0);
  T.hum=clamp(hum,20,100);T.roof=run?clamp((T.hum-74)/12,0,1):0;
  // ---- the supply air coils: their steam follows the supply air flow against what AUTO would run (in today's bill) ----
  const Aauto=evap>0?evap*1000/(STM.H-Hin)*STM.supK:A0*STM.exhAuto/100*0.4*STM.supK,Asup=A0*T.sup/100,airF=Aauto>0?Asup/Aauto:1;
  T.air=STM.air*st*airF*(1-STM.hrK*LV("heatrec"));
  // ---- condensate back to the power house; the makeup, and what heating it costs ----
  const vent=S.pm==="break"?(D.vent||0):0,lossSt=T.waste*0.5+(active("steamjoint")?0.08*Math.max(st,D.steam):0)+vent,steam=Math.max(1e-6,D.steam);
  T.ret=D.steam>0.5?clamp(STM.ret-lossSt/steam,0,STM.ret):STM.ret;T.mk=D.steam*(1-T.ret);
  // the extra charged on top of the per-ton steam bill: wasted blow-through, supply air off AUTO's, the makeup's fuel
  if(D.steam>0.5){const pr=stmPrice(),xs=T.waste+STM.air*st*(airF*(1-STM.hrK*LV("heatrec"))-1)+(T.ret<STM.ret?STM.fuelK*(STM.ret-T.ret)*D.steam:0);
    if(Math.abs(xs)>1e-9&&pr>0){const v=xs*h*pr;spend(v,"energy");pfAdd("steam","pm",v);}}
  // ---- the KPIs: steam a ton (dryers + air coils + waste), kWh a ton, energy $ a ton ----
  // (every 2 sim minutes: the electric load reads every drive, which isn't worth doing every step for a 30-minute average)
  if(Math.floor(S.t/2)!==T.kk){const dtk=T.kk==null?dt:Math.min(30,(Math.floor(S.t/2)-T.kk)*2);T.kk=Math.floor(S.t/2);const p=run?(S.rates.prod||0):0,K=T.kpi,kw=stmKw(),st2=D.steam+T.air+T.waste,dt2=dtk;
    K.st=ease(K.st,p>1?st2/p:K.st,dt2,30);K.kwh=ease(K.kwh,p>1?kw/p:K.kwh,dt2,30);K.kw=kw;
    K.usd=ease(K.usd,p>1?(st2*stmPrice()+kw*ELEC.price*pwrMul())/p:K.usd,dt2,30);}}
// the dew point (°C) of air at H g water / kg dry air (Magnus, at 1 atm)
function stmDew(H){const x=Math.max(0.001,H/1000),pw=1013.25*x/(0.622+x),l=Math.log(pw/6.112);return 243.04*l/(17.625-l);}
// the supply air's own humidity (g/kg): outdoor air by site
const stmHin=()=>({swamp:14,desert:4,urban:8,rural:7})[SITE.env]||8;
const stmHin0=()=>8;
// the mill's electric load now (kW): the drives at their load and the balance of plant (07i pwrTick, without billing)
function stmKw(){const r=knobRead();let v=0;for(const A of ASSETS)v+=Math.max(0,rlyLoad(A.id,r))/100*rlyKw(A.id);return v+pwrBop();}
// mods: hood drips and roof drips put spots on the sheet (07-sim-step's beater share comes from stmOff)
const stmOff=()=>stmOn()&&S.stm&&S.pm==="run"?Math.min(0.08,0.06*S.stm.drip+0.02*S.stm.roof):0;
// the player's moves (STM DCS screen): PDC-304's setpoint (null = AUTO's speed schedule), the hood fans
function stmSetSp(v){if(S.zen)return;const T=stmState();T.sp4=v==null?null:clamp(+v,5,STM.dpMax);if(vlvT("PDC-304"))S.vlv.lp["PDC-304"].sp=stmSp();}
function stmSetFan(k,v){if(S.zen)return;const T=stmState();if(v==="auto"){T[k+"M"]="auto";return;}T[k+"M"]="manual";T[k+"Sp"]=clamp(+v,10,100);}
// the IR survey on the dry end round: every can shell's temperature, kept until the next one (07i rounds read the age)
function stmIr(){const T=stmState();T.ir={t:S.t,c:Array.from({length:STM.cans},(_,j)=>Math.round(stmShell(j)*10)/10)};}
const stmIrAge=()=>S.stm&&S.stm.ir?S.t-S.stm.ir.t:Infinity;
// the broken syphon upset: which can (the upset's own dice), and what it does when it runs (EV.syphon, 04)
function stmSyphonStart(i){const T=stmState();if(S.rng.syph==null)S.rng.syph=(S.seed^0x1b873593)|0;i.can=6+Math.floor(rand("syph")*14);T.syph=i.can;
  i.note=`can ${i.can+1} (${STMN[i.can<12?1:2]} section) flooding`;}
function stmSyphonEnd(){const T=S.stm;if(T)T.syph=-1;}
// the upset's phases: the can floods while the machine runs; after STM.syFind minutes the crew finds it and stops for the change
STM.syFind=120;
function stmSyphonMods(i){const run=i.total-i.left;return run>=STM.syFind?{pmDown:"syphon change"}:{};}
