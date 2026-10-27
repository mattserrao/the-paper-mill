/* ---- v6.13.3 Headbox & Fan Pump (plan: claude/headbox-fanpump-v6133-plan.md) ----
   Headbox total head. The classic calculation (TAPPI TIP 0502-17, "theoretical head"): the head that spouts the jet at its
   speed, H = (V/100)² / K with V the jet speed in fpm (J/W × wire speed) and K 23.165 for ft of water, 53.336 for psi,
   1.9304 for inches. The headbox pressure the gauge reads is a little more (÷ Cv², Cv 0.97): hbPsi() (07n).
   The fan pump. A centrifugal pump on a VFD: its head curve at full speed is H = FP.h0 − FP.b·Q², and the affinity laws
   scale it with speed (Q ∝ N, H ∝ N², power ∝ N³): H(Q, n) = FP.h0·n² − FP.b·Q² (n = rpm / FP.rpm). Its efficiency peaks
   (FP.eta) at the best efficiency point, FP.qb·n, and falls off either side.
   The system it pumps against (total dynamic head, TDH): the lift to the headbox (FP.stat), the headbox's own pressure
   (the jet's head), and the friction terms that grow with Q²: the inlet header and tube bank (FP.kHb), the machine
   screen (FP.kScr, times 1 + its plugging) and the piping (FP.kPipe).
   AUTO (the J/W loop): the drive finds the rpm where the pump's curve meets the system at the wet end's flow, which holds
   the jet at the J/W setpoint. Sized for the fastest machine the upgrades allow, so on a clean screen it never runs out of
   speed: untouched, the jet is exactly the setpoint and the game plays as v6.13.2. At 100% rpm (a badly plugged screen on
   a fast machine) it can't: the jet gets what head is left and the J/W sags below the setpoint (07n hbJw: the rush/drag,
   formation, MD/CD, STFI and breaks follow). MANUAL (free play only): the rpm is the operator's, so the J/W follows the
   machine (a speed or grade change moves it). The wet end's flow stays the mass balance's (07g): the pump sets the jet.
   Drive load: kW = Q·H/(3960·η) hp ÷ the motor's 0.96, of the 900 kW drive (07i rlyLoad). The power bill is cost-neutral
   with v6.13.2: what the old flat load drew more than this is in the balance of plant (07i ELEC.bop).
   The machine screen plugs with stickies: toward an equilibrium set by the furnish (stkFurn, 07n: Mixed Waste fastest)
   and the tons, over about three days, and only a planned outage's wash-up clears it. The daily Round through screens &
   refiners reads its ΔP (04b). NPSH: what the white water silo's level gives the suction against what the pump needs at
   this flow; the silo's low-level cavitation (07g W.cav) is where they cross. Season, survival and free play; zen keeps
   AUTO and no plugging. ---- */
const FP={rpm:890,h0:185,b:25/26000/26000,qb:26000,eta:0.84,mot:0.96,stat:15,qd:19300,kHb:3.5/19300/19300,kScr:4/0.4335/19300/19300,kPipe:11/19300/19300,
  nMin:0.30,nIdle:0.40,qIdle:0.25,plugTau:72,plugEq:0.5,plugBack:0.25,npsh0:17.5,npshL:25,npshR:21.25,psiFt:0.4335,
  plugWarn:0.8,plugHi:1.2};
const fpOn=()=>!!(S&&!S.zen);
function fpState(){if(!S.fp)S.fp={m:"auto",nm:0.7,n:0.67,plug:0,q:0,h:0,kw:0,jw:null,eff:FP.eta,st:"run",rd:null};return S.fp;}
// the TAPPI theoretical head of a jet speed V (fpm), in ft / psi / inches of water; and the jet speed a head gives
const fpThFt=v=>Math.pow(v/100,2)/23.165,fpThPsi=v=>Math.pow(v/100,2)/53.336,fpThIn=v=>Math.pow(v/100,2)/1.9304;
const fpVofTh=ft=>100*Math.sqrt(Math.max(0,ft)*23.165);
const HB_CV2=0.94;   // (Cv² of the slice: the gauge reads the theoretical head ÷ this, as hbPsi has since v6.13)
// the pump's head (ft) at flow q (gpm) and speed n (share of FP.rpm), and its efficiency there
const fpHead=(q,n)=>FP.h0*n*n-FP.b*q*q;
const fpEta=(q,n)=>{const r=n>0.05?q/(FP.qb*n):0;return clamp(FP.eta-0.9*(r-1)*(r-1),0.25,FP.eta);};
// the system's friction (ft) at flow q, with the screen's plugging p
const fpFric=(q,p)=>(FP.kHb+FP.kScr*(1+(p||0))+FP.kPipe)*q*q;
const fpScrPsi=(q,p)=>FP.kScr*(1+(p||0))*q*q*FP.psiFt;
// shaft-to-wire power (kW) at flow q (gpm) against head h (ft)
const fpKw=(q,h,eta)=>q>0&&h>0?q*h/(3960*eta)*0.7457/FP.mot:0;
const fpNpshA=()=>FP.npsh0+FP.npshL*(S.we?S.we.L/WE.silo:WE.over);
const fpNpshR=q=>FP.npshR*Math.pow(q/FP.qd,2);
// the J/W setpoint the fan pump is asked for (07n hbJwSp), and the jet speed (fpm) it means at this machine speed
const fpJetSp=()=>hbJwSp()*S.pmSpeed/DCS_DRAW();
// manual rpm: free play only (seasons and survival show the faceplate in AUTO)
const fpManOk=()=>!!(S&&S.free&&!S.zen);
const fpMan=()=>fpManOk()&&S.fp&&S.fp.m==="man";
function fpSetMode(m){if(!fpManOk())return;const F=fpState();if(m===F.m)return;if(m==="man")F.nm=Math.round(F.n*1000)/1000;   // (bumpless: manual starts where AUTO had it)
  F.m=m;log(`Fan pump speed to ${m==="man"?"MANUAL":"AUTO (holding J/W)"}`,"ok");}
function fpSetRpm(pct){if(!fpManOk())return;const F=fpState();F.m="man";F.nm=clamp(+pct/100,FP.nMin,1);}
// the operating point now: {st, q gpm, n, h ft, kw, eta, jw (null = the setpoint holds), hbFt, th (TAPPI ft), sat}
function fpSolve(F){
  const down=outOn()||(typeof rlyIncOf==="function"&&rlyIncOf("fan"))||(typeof rlyRectDown==="function"&&rlyRectDown("SP"));
  if(down)return {st:"off",q:0,n:0,h:0,kw:0,eta:FP.eta,jw:null,hbFt:0,th:0,sat:false};
  const p=fpOn()?F.plug:0;
  if(S.pm!=="run"){const n=FP.nIdle,q=FP.qd*FP.qIdle,h=fpHead(q,n),e=fpEta(q,n);return {st:"idle",q,n,h,kw:fpKw(q,h,e),eta:e,jw:null,hbFt:0,th:0,sat:false};}
  const q=Math.max(1,GPM(S.we&&S.we.f?S.we.f.hb||0:0)),fr=FP.stat+fpFric(q,p),v0=fpJetSp(),hb0=fpThFt(v0)/HB_CV2;
  let n,jw=null,hbFt=hb0,sat=false;
  if(fpMan()){n=F.nm;}
  else{const need=Math.sqrt((fr+hb0+FP.b*q*q)/FP.h0);n=need;if(need>1){n=1;sat=true;}}
  // off the J/W loop the slice is fixed, so the headbox's head goes with the flow squared like the friction: the pump runs
  // where its curve crosses that system curve, and the jet (and J/W) scale with the flow it delivers there
  let qo=q;
  if(fpMan()||sat){const c=hb0/(q*q),k=FP.kHb+FP.kScr*(1+p)+FP.kPipe;qo=Math.sqrt(Math.max(0,FP.h0*n*n-FP.stat)/(FP.b+k+c));
    jw=clamp(hbJwSp()*qo/q,0.85,1.15);qo=q*jw/hbJwSp();hbFt=c*qo*qo;}
  const h=FP.stat+fpFric(qo,p)+hbFt,e=fpEta(qo,n);
  return {st:"run",q:qo,n,h,kw:fpKw(qo,h,e),eta:e,jw,hbFt,th:hbFt*HB_CV2,sat};}
// every step (07-sim-step, after the water): the screen's plugging, the operating point, the jet the pump delivers
function fpTick(dt){const F=fpState(),h=dt/60;
  if(!fpOn()){F.plug=0;F.m="auto";}
  else if(F.m==="man"&&!fpManOk())F.m="auto";
  if(fpOn()&&S.pm==="run"){const eq=FP.plugEq*Math.pow(typeof stkFurn==="function"?stkFurn():1,1.5)*clamp((S.rates.prod||0)/35,0,1.6),d=eq-F.plug;
    F.plug=Math.max(0,F.plug+d*h/FP.plugTau*(d<0?FP.plugBack:1));}
  // a planned outage just ended: the wash-up pulled the screen baskets and cleaned them
  const on=outOn();if(F.out&&!on&&F.plug>0){F.plug=0;log("Outage wash-up: the machine screen's baskets are clean; its pressure drop is back to design.","ok");}F.out=on;
  const r=fpSolve(F);F.st=r.st;F.n=r.n;F.q=r.q;F.h=r.h;F.kw=r.kw;F.eff=r.eta;F.jw=r.jw;F.hbFt=r.hbFt;F.sat=r.sat;}
// the drive's load (% of its rating) for 07i rlyLoad: 0 when off
const fpLoad=()=>{const F=S&&S.fp;if(!F)return null;return F.kw/rlyKw("fan")*100;};
// the actual J/W (07n hbJw): the setpoint unless the pump can't hold it, or the rpm is manual
const fpJw=()=>S&&S.fp&&S.fp.jw!=null&&S.pm==="run"&&!S.zen?S.fp.jw:null;
const fpNpshM=()=>{const F=S&&S.fp;if(!F||F.st!=="run")return null;const m=fpNpshA()-fpNpshR(F.q);return S.we&&S.we.cav>0?Math.min(m,-S.we.cav*6):m;};
const fpScrDp=()=>{const F=S&&S.fp;if(!F||F.st!=="run")return 0;return fpScrPsi(F.q,fpOn()?F.plug:0);};
// headbox total head (TAPPI) and headbox pressure at the jet's actual speed
const hbJetAct=()=>hbJw()*S.pmSpeed/DCS_DRAW();
const hbThPsi=()=>fpThPsi(hbJetAct()),hbThFt=()=>fpThFt(hbJetAct()),hbThIn=()=>fpThIn(hbJetAct());
// the daily Round through screens & refiners reads the machine screen's ΔP (04b tellRoundEnd)
function fpRound(){const F=fpState();if(!fpOn())return;const dp=fpScrDp(),clean=fpScrPsi(F.q||FP.qd,0);F.rd={t:S.t,dp,clean,plug:F.plug};
  if(F.plug>=FP.plugWarn)log(`Round: the machine screen reads ${dp.toFixed(1)} psi ΔP (${clean.toFixed(1)} clean). Stickies are plugging the baskets: the fan pump is working harder${F.sat?" and is out of speed":""}. The next outage's wash-up clears it.`,"warn");
  else log(`Round: machine screen ΔP ${dp.toFixed(1)} psi (${clean.toFixed(1)} clean). Fan pump at ${Math.round(F.n*100)}% speed.`,"");}
// the Area Trend Report (04b tellTrend): climbing as the screen plugs, fast when the pump is near its top speed
const fpTrend=a=>{if(a!=="scr"||!fpOn()||!S.fp)return 0;const F=S.fp;return F.sat||F.n>0.95?2:F.plug>=FP.plugWarn?1:0;};
// a pump curve sample for the faceplate: [q, h] points at speed n from shut-off to flow qMax
function fpCurve(n,qMax,k){const out=[];for(let i=0;i<=k;i++){const q=qMax*i/k,h=fpHead(q,n);if(h<0)break;out.push([q,h]);}return out;}
function fpSysCurve(qMax,k){const F=S.fp,p=fpOn()&&F?F.plug:0,hb=S.pm==="run"&&F?F.hbFt||0:0,q0=Math.max(1,F&&F.q||FP.qd),out=[];
  // the headbox term scales with the jet (which in the mill follows the flow at a fixed slice): Q² like the friction
  for(let i=0;i<=k;i++){const q=qMax*i/k;out.push([q,FP.stat+fpFric(q,p)+hb*(q/q0)*(q/q0)]);}return out;}
// (G3.fan, the test hook, is set in 50o with the faceplate: G3 isn't made yet here)
