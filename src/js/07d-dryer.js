/* ---- v6.5 b5 the dryer limit (claude/dryer-limit-spec.md): speed, water and steam, live ----
   Water to evaporate = paper t/h x water per ton (0.93 / press-out solids - 1 = 1.11 t/t at 44%; the shoe press makes it
   48%, -16%), times the wet end's water factor (the fiddly knobs' K.W: refiner gap, forming vacuum, press load). The 3rd
   section's demand starts at the grade's base pressure at its standard rate (DRY.base), +2.9 kPa per extra t/h
   on 24, scaled by basis weight for the other grades; the 1st section knob takes some of it (K's d1). The auto loop holds
   8% reel moisture (DRY.m0; 7% before v6.5.3) while demand is between its floor (70% of the grade's base) and the ceiling (DRY.ceil). Above the
   ceiling the sheet goes wet (+0.15% per kPa short; below the floor it over-dries the same way). Past the moisture spec
   (10%) the paper fails on quality and goes to the beater, and the crew slows the machine (1% a minute) until it's back
   under 9%, then lets the speed recover (0.5% a minute) while there's headroom. In every mode but zen; AUTO doesn't trim
   ahead of time. Steam = 1.3 t per t of water (TAPPI dryer norm); past the boiler's 62 t/h the header sags and the
   ceiling with it. On a sheet break the steam keeps flowing and the surplus is vented (v6.5.7). No dice: seasons replay identically. The knob model (07b) reads its moisture from here. */
// ceil: 180 kPa, set so a fully upgraded mill (with the shoe press)
// runs clean (peak 170 in hands-off seasons); without the shoe press, heavy grades at full speed run damp (to ~9.4%)
const DRY={hold:0.3,m0:8,ceil:180,ceilFloor:0.7,perKpa:0.15,spec:10,back:9,slopeRef:2.9,wpt0:0,boiler:62,stPerW:1.3,
  base:{"24":120,"28":127,"31":136,"34Super":133}};   // (3rd-section kPa by grade at its standard rate; v6.7.1 grade set)
DRY.wpt0=(1-DRY.m0/100)/0.44-1;   // water evaporated per ton of paper at standard press solids
function dryState(){if(!S.dry)S.dry={m:DRY.m0,st3:DRY.base[C.grade]||DRY.base["24"],dem:DRY.base["24"],trim:0,steam:0,hdr:1,load:0.7,maxDem:0,wet:false};return S.dry;}
const dryWpt=()=>(1-DRY.m0/100)/(psStd()/100)-1;   // (v6.5.6: on the 8% setpoint; it assumed 7%)   // water per ton of paper into the dryers
const drySlope=g=>DRY.slopeRef*(GRADES[g].bw/GRADES["24"].bw);
const dryRef=g=>BASE.K*GRADES[g].sp*GRADES[g].bw;   // the grade's standard t/h (what the base pressure was measured at)
// the ceiling, less what a sagging boiler header takes off it
const dryCeil=D=>DRY.ceil-60*Math.max(0,1-D.hdr);
// 3rd-section demand (kPa) at a given paper rate, before the fiddly knobs
function dryDemand0(tph){const g=C.grade,b=DRY.base[g]||DRY.base["24"];return b+drySlope(g)/DRY.wpt0*(tph*dryWpt()-dryRef(g)*DRY.wpt0);}
// v6.5.2: the fiddly knobs' load on the dryers is a ratio of that (r = the wet end's water factor less the 1st section's
// share, 1 = normal). The 3rd section's auto loop takes up to ±30% of it (a); past that the knobs move the moisture
// (20 points of moisture per unit of r, the v5.6 knob model). Before v6.5.2 the knobs added kPa to the demand and the
// whole range up to the ceiling soaked them up, so on a mill with headroom the wet-end knobs did nothing but cost steam.
function dryKnob(){const K=S.knob;if(!(K&&K.any))return {r:1,a:1};const r=(K.W||1)-(K.d1x||0);return {r,a:clamp(r,0.7,1.3)};}
// the paper rate the dryers can take before the sheet goes wet (for the bottleneck view)
function dryCapTph(){const D=dryState(),g=C.grade,b=DRY.base[g]||DRY.base["24"],s=drySlope(g)/DRY.wpt0,k=s*dryWpt();
  return k>0?Math.max(0,(dryCeil(D)/dryKnob().a-b+s*dryRef(g)*DRY.wpt0)/k):1e9;}
function dryTick(dt){const D=dryState(),g=C.grade,b=DRY.base[g]||DRY.base["24"],run=S.pm==="run";
  const tph=run?P.K*S.pmSpeed*(S.we&&S.we.bw||GRADES[g].bw):0;   // (v6.8: the weight being made, 07g)
  const A=dryKnob(),dem0=run?dryDemand0(tph):b*0.5,dem=run?dem0*A.a:b*0.5;D.dem=ease(D.dem,dem,dt,3);D.dem0=ease(D.dem0==null?dem0:D.dem0,dem0,dt,3);if(run&&!S.zen&&D.dem>D.maxDem)D.maxDem=D.dem;
  D.km=ease(D.km||0,run?20*(A.r-A.a):0,dt,10);   // (v6.5.2: moisture the knobs put past the auto loop's reach)
  // steam and the boiler (a boiler trip still stops the machine on its own; 04-upsets)
  const water=tph*dryWpt()*((S.knob&&S.knob.any&&S.knob.W)||1)*(hoodUp()?1+HOOD_STEAM:1);   // (v6.11.1: hood doors raised on the knob)
  // v6.5.7: on a sheet break the boiler isn't backed down: steam keeps flowing at the running rate, the cans condense a share
  // to stay hot (DRY.hold) and the rest is vented to atmosphere through the header vent on the roof (24-3d), and paid for
  const brk=S.pm==="break";if(run)D.runSt=D.steam;
  D.steam=ease(D.steam,run?water*DRY.stPerW:brk?(D.runSt||0):0,dt,4);D.vent=ease(D.vent||0,brk?D.steam*(1-DRY.hold):0,dt,0.5);
  if(brk&&!S.zen&&D.steam>0.5){const en=Math.max(0,energyCostT()-pfChemT()),wpt=dryWpt()*DRY.stPerW,v=wpt>0?D.steam*dt/60*en/wpt:0;   /* (v6.11.2: the per-ton bill is steam now) */
    if(v>0){spend(v,"energy");pfAdd("steam","pm",v);D.ventT=(D.ventT||0)+D.vent*dt/60;D.ventC=(D.ventC||0)+v*(1-DRY.hold);}}
  D.hdr=ease(D.hdr,D.steam>DRY.boiler?Math.max(0.6,1-(D.steam-DRY.boiler)/DRY.boiler*1.5):1,dt,20);
  // the floor is speed's (a slow machine over-dries); a knob that takes load off can take the 3rd section under it
  const ceil=dryCeil(D),floor=b*DRY.ceilFloor,under=D.dem0<floor;D.st3=run?clamp(D.dem,under?floor:0,ceil):b;D.load=D.dem/ceil;
  let tgt=run?DRY.m0+D.km+(D.dem>ceil?(D.dem-ceil)*DRY.perKpa:under?(D.dem0-floor)*DRY.perKpa:0):DRY.m0;
  // v6.5.4: the 2nd/3rd section on MANUAL (DET DCS) holds the operator's pressure instead of the moisture: less than
  // the load needs and the sheet comes off wetter, more and it over-dries (0.15% a kPa either way)
  // v6.9: once the steam cascade is touched (QC-300 / PV-302 / PV-303, 07h) its valves set the pressures and its model the moisture
  if(vlvT("QC-300")){const V=S.vlv;D.st3=Math.min(V.st3!=null?V.st3:D.st3,ceil);D.m=V.lp["QC-300"].y;}
  else{if(D.man!=null&&run){D.st3=Math.min(D.man,ceil);tgt=DRY.m0+D.km+(D.dem-D.st3)*DRY.perKpa;}D.m=Math.max(0.5,ease(D.m,tgt,dt,10));}
  // a wet sheet fails the moisture spec: the crew slows the machine until it's back in spec, then lets it recover.
  // (v6.5.2: only for the part slowing down can fix; what the knobs put past the auto loop waits for the knob to be traced)
  const wasWet=D.wet,ms=D.m-Math.max(0,D.km);if(!S.zen&&run&&ms>DRY.spec)D.wet=true;else if(ms<DRY.back)D.wet=false;
  if(D.wet&&!wasWet)log("QCS: the sheet is coming off the reel wet. The crew is slowing the machine to dry it.","warn");
  if(D.wet)D.trim=Math.min(0.4,D.trim+0.01*dt);else if(D.trim>0&&D.dem<ceil-4)D.trim=Math.max(0,D.trim-0.005*dt);
  if(!D.wet&&wasWet)log("QCS: moisture back in spec. The machine is coming back up to speed.","ok");}
// mods (04-upsets mods()): the crew's speed trim, and wet-sheet breaks in the dryers when the knob model isn't running
function dryMods(m){const D=S.dry;if(!D||S.zen)return;if(D.trim>0)m.speedCap=Math.min(m.speedCap,1-D.trim);
  const K=S.knob;if(!(K&&K.any)&&D.m>13)m.breakMul*=1+(D.m-13)*0.8;}
// (v6.5.3: whether the reel is in spec on moisture is the QCS spec check's call now, 07e-quality.js)
const dryLimited=()=>!!(S.dry&&S.pm==="run"&&S.dry.dem>=dryCeil(S.dry)-0.5);
