/* ---- v6.14 the headbox side door (plan: claude/v6140-plan.md, 7) ----
   The tending-side access door on the headbox is held by its gasket and clamps. When the machine comes back after a
   stock-off (the stock chest ran out, or the machine chest tripped it), the fan pump brings the headbox up to pressure
   from empty, and a tired seal can let the door go: stock sprays out and floods the floor round the forming table, the
   machine is down for a clean-up and re-seal, and there's a repair bill (upset hbdoor, 04). The odds on each such restart:
   HBD.p0, times 1 + HBD.wK x the seal's wear (0..1, building over about HBD.days of running; a planned outage re-seats it),
   doubled for a quick restart (back within HBD.hot minutes of going down). Its own dice stream ("hbdoor"), so every other
   upset keeps its timing. A worn seal weeps first: the wet end Round spots it (04b tellRoundEnd) and the crew re-seats the
   gasket for a share of the bill, no downtime. Season, survival and free play; not zen. ---- */
const HBD={p0:0.05,wK:3,hot:30,days:12,lo:0.45};
const hbdOn=()=>!!(S&&!S.zen&&typeof tellsOn==="function"&&tellsOn());
function hbdState(){if(!S.hbd)S.hbd={w:0.15,t0:null,pm:S.pm,out:false};return S.hbd;}
function hbdTick(dt){if(!hbdOn())return;const D=hbdState();
  if(S.pm==="run")D.w=Math.min(1,D.w+dt/(HBD.days*1440));
  const stockOff=S.pm==="down"||(S.pm==="incident"&&S.mcTrip);
  if(stockOff&&D.t0==null)D.t0=S.t;
  if(D.t0!=null&&D.pm!=="run"&&(S.pm==="break"||S.pm==="run")&&!stockOff){hbdRestart(D);D.t0=null;}   // (back up: the rethread after the stock-off)
  const on=outOn();if(D.out&&!on){D.w=0;}D.out=on;D.pm=S.pm;}
function hbdRestart(D){if(active("hbdoor"))return;const quick=S.t-D.t0<HBD.hot,p=HBD.p0*(1+HBD.wK*D.w)*(quick?2:1);
  if(S.rng.hbdoor==null)S.rng.hbdoor=((S.seed||1)^0x7a3d91c5)|0;
  if(rand("hbdoor")<p){D.w=0.1;trigger("hbdoor");}}
// the wet end Round sees a weeping seal: re-seat the gasket now (a share of the bill, no downtime)
function hbdRound(){if(!hbdOn())return 0;const D=hbdState();if(D.w<HBD.lo)return 0;const T=tellState(),bill=(REPAIR.hbdoor||0)*P.repairMul,cost=bill*TELL.cut;
  if(cost>0)spend(cost,"repairs");T.n++;T.saved+=bill-cost;T.cn.hbdoor=(T.cn.hbdoor||0)+1;D.w=0.05;
  if(civOn())civAdd(TELL.catchCiv,"Caught early");
  log(`Caught early: stock weeping from the headbox side door's gasket. The crew re-seated it: ${money(cost)}, no downtime (a door blow-out on the next stock-off restart avoided).`,"ok");return 1;}
const hbdTrend=a=>a==="wet"&&hbdOn()&&S.hbd&&S.hbd.w>=HBD.lo?1:0;
