/* ---- v6.5 b5 the dryer limit (claude/dryer-limit-spec.md): speed, water and steam, live ----
   Water to evaporate = paper t/h x water per ton (0.93 / press-out solids - 1 = 1.11 t/t at 44%; the shoe press makes it
   48%, -16%), times the wet end's water factor (the fiddly knobs' K.W: refiner gap, forming vacuum, press load). The 3rd
   section's demand is calibrated on PM3 data: the grade's own median pressure at its median rate, +3.0 kPa per extra t/h
   on 23m, scaled by basis weight for the other grades; the 1st section knob takes some of it (K's d1). The auto loop holds
   7% reel moisture while demand is between its floor (70% of the grade's base) and the ceiling (DRY.ceil). Above the
   ceiling the sheet goes wet (+0.15% per kPa short; below the floor it over-dries the same way). Past the moisture spec
   (10%) the paper fails on quality and goes to the beater, and the crew slows the machine (1% a minute) until it's back
   under 9%, then lets the speed recover (0.5% a minute) while there's headroom. In every mode but zen; AUTO doesn't trim
   ahead of time. Steam = 1.3 t per t of water (TAPPI dryer norm); past the boiler's 62 t/h the header sags and the
   ceiling with it. No dice: seasons replay identically. The knob model (07b) reads its moisture from here. */
// ceil: PM3's 3rd section tops out at 171 kPa; the game's ceiling is 180 so a fully upgraded mill (with the shoe press)
// runs clean (peak 170 in hands-off seasons); without the shoe press, heavy grades at full speed run damp (to ~9.4%)
const DRY={ceil:180,ceilFloor:0.7,perKpa:0.15,spec:10,back:9,slope23:3.0,wpt0:0.93/0.44-1,boiler:62,stPerW:1.3,
  base:{"23m":122,"26m":126,"30m":138,"33HT":135}};   // (median 3rd-section kPa by grade, PM3 Sep 2025 - Mar 2026)
function dryState(){if(!S.dry)S.dry={m:7,st3:DRY.base[C.grade]||122,dem:122,trim:0,steam:0,hdr:1,load:0.7,maxDem:0,wet:false};return S.dry;}
const dryWpt=()=>0.93/(0.44+0.04*LV("shoe"))-1;   // water per ton of paper into the dryers
const drySlope=g=>DRY.slope23*(GRADES[g].bw/GRADES["23m"].bw);
const dryRef=g=>BASE.K*GRADES[g].sp*GRADES[g].bw;   // the grade's standard t/h (what the base pressure was measured at)
// the ceiling, less what a sagging boiler header takes off it
const dryCeil=D=>DRY.ceil-60*Math.max(0,1-D.hdr);
// 3rd-section demand (kPa) at a given paper rate
function dryDemand(tph){const g=C.grade,K=S.knob,W=K&&K.any?(K.W||1):1,d1=K&&K.any?(K.d1x||0):0,b=DRY.base[g]||122;
  const water=tph*dryWpt()*W,water0=dryRef(g)*DRY.wpt0;
  return b+drySlope(g)/DRY.wpt0*(water-water0)-b*d1;}
// the paper rate the dryers can take before the sheet goes wet (for the bottleneck view)
function dryCapTph(){const D=dryState(),g=C.grade,K=S.knob,W=K&&K.any?(K.W||1):1,d1=K&&K.any?(K.d1x||0):0,b=DRY.base[g]||122,s=drySlope(g)/DRY.wpt0,k=s*dryWpt()*W;
  return k>0?Math.max(0,(dryCeil(D)-b+b*d1+s*dryRef(g)*DRY.wpt0)/k):1e9;}
function dryTick(dt){const D=dryState(),g=C.grade,b=DRY.base[g]||122,run=S.pm==="run";
  const tph=run?P.K*S.pmSpeed*GRADES[g].bw:0;
  const dem=run?dryDemand(tph):b*0.5;D.dem=ease(D.dem,dem,dt,3);if(run&&!S.zen&&D.dem>D.maxDem)D.maxDem=D.dem;
  // steam and the boiler (a boiler trip still stops the machine on its own; 04-upsets)
  const water=tph*dryWpt()*((S.knob&&S.knob.any&&S.knob.W)||1);D.steam=ease(D.steam,run?water*DRY.stPerW:0,dt,4);
  D.hdr=ease(D.hdr,D.steam>DRY.boiler?Math.max(0.6,1-(D.steam-DRY.boiler)/DRY.boiler*1.5):1,dt,20);
  const ceil=dryCeil(D),floor=b*DRY.ceilFloor;D.st3=run?clamp(D.dem,floor,ceil):b;D.load=D.dem/ceil;
  const tgt=run?7+(D.dem>ceil?(D.dem-ceil)*DRY.perKpa:D.dem<floor?(D.dem-floor)*DRY.perKpa:0):7;D.m=Math.max(0.5,ease(D.m,tgt,dt,10));
  // a wet sheet fails the moisture spec: the crew slows the machine until it's back in spec, then lets it recover
  const wasWet=D.wet;if(!S.zen&&run&&D.m>DRY.spec)D.wet=true;else if(D.m<DRY.back)D.wet=false;
  if(D.wet&&!wasWet)log("QCS: the sheet is coming off the reel wet. The crew is slowing the machine to dry it.","warn");
  if(D.wet)D.trim=Math.min(0.4,D.trim+0.01*dt);else if(D.trim>0&&D.dem<ceil-4)D.trim=Math.max(0,D.trim-0.005*dt);
  if(!D.wet&&wasWet)log("QCS: moisture back in spec. The machine is coming back up to speed.","ok");}
// mods (04-upsets mods()): the crew's speed trim, and wet-sheet breaks in the dryers when the knob model isn't running
function dryMods(m){const D=S.dry;if(!D||S.zen)return;if(D.trim>0)m.speedCap=Math.min(m.speedCap,1-D.trim);
  const K=S.knob;if(!(K&&K.any)&&D.m>13)m.breakMul*=1+(D.m-13)*0.8;}
// paper sent to the beater for moisture when the knob model isn't running (it handles it when it is)
function dryOff(){const D=S.dry,K=S.knob;if(!D||S.zen||(K&&K.any))return 0;return D.m>DRY.spec?clamp((D.m-DRY.spec)/4,0,1):D.m<4?clamp((4-D.m)/2,0,1):0;}
const dryLimited=()=>!!(S.dry&&S.pm==="run"&&S.dry.dem>=dryCeil(S.dry)-0.5);
