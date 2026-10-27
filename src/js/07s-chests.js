/* ---- v6.14.0 chests: the pulper's consistency swings carried, and damped, to the wire ----
   The stock between the pulper and the headbox passes two mixed chests, and each one damps a swing.
   Storage (stock) chest: well mixed, residence time V/Q (its stock inventory over the fiber the machine draws, CHS.tMin to
   CHS.tMax minutes). It holds about CHS.sc0 % stock, so it carries the pulper's deviation scaled by sc0 / 5 (pulper
   standard 5 %), through a first-order lag of that residence time.
   Machine chest: fed from the storage chest through a consistency control loop that dilutes it to WE.mc0 (3.2 %). The loop
   takes out all but CHS.pass of the storage chest's swing (scaled to 3.2 %), and the chest (about CHS.mcTau minutes of
   stock) lags what is left.
   Headbox: the machine chest's consistency moves the fiber through the basis weight valve (07g mcCons -> bwTrue), and the
   basis weight loop's integral trim and the fan pump's dilution take out what's slow; what reaches the headbox is the
   short, small part.
   A first-order chest of time constant tau passes a swing of period T at 1/sqrt(1 + (2 pi tau / T)^2): a 30-minute swing
   through a 2-hour chest keeps 4 % of itself, a day-long drift 79 %. Untouched (pulper on its standard) every term is 0.
   Before v6.14.0-t2 the machine chest only saw the pulper once the NV-101 loop was touched (07h cpl, cpK 0.06); the static
   gain here, sc0/5 x pass x 3.2/sc0 = 0.064, keeps that calibration. ---- */
const CHS={sc0:4.5,tMin:60,tMax:240,pass:0.1,mcTau:20};
const chOn=()=>!!(S&&!S.zen);
function chState(){if(!S.chs)S.chs={sc:0,mc:0};return S.chs;}
// the storage chest's residence time (min): its stock over what the machine draws
const chTau=()=>clamp((S.tank||0)/Math.max(1,(S.rates&&S.rates.fiberUse)||30)*60,CHS.tMin,CHS.tMax);
// every step: the pulper's deviation into the storage chest, then through the machine chest's consistency control
function chTick(dt){if(!chOn())return;const C3=chState(),cp=vlvView("NV-101").y,dp=Number.isFinite(cp)?cp-5:0,run=!(S.M&&S.M.pulperDown);
  if(run)C3.sc=ease(C3.sc,dp*CHS.sc0/5,dt,chTau());
  C3.mc=ease(C3.mc,C3.sc*CHS.pass*WE.mc0/CHS.sc0,dt,CHS.mcTau);}
// the storage chest's consistency (%) and the machine chest's deviation (% points) it causes (07g mcCons)
const chSc=()=>CHS.sc0+(chOn()&&S.chs?S.chs.sc:0);
const chMc=()=>chOn()&&S.chs?S.chs.mc:0;
