/* ---- v6.14 the guided grade change (free play only; an EDU mode later) ----
   Instead of the crew's automatic change (setGrade, 06: an instant switch with a fixed transition to the beater), the
   player walks the machine from one grade to the next in steps, speed and weight together: each step moves the basis
   weight setpoint a share of the way and the speed with it, so the tons an hour (and the dryers' load) hold steady. The
   weight loop and the QCS take a few minutes to catch up (its dead time), and the dryers follow the tons, so a step
   wants time to settle: the coach shows when weight and moisture are back. The old grade stays on the machine (and its
   spec on the QCS) until the last step, so the in-between paper goes to the beater through the normal spec check (07e):
   a quick, steady change makes less of it than the crew's automatic one; rushed steps swing the moisture and make more.
   State: S.gg={from,to,n,k,bw0,bw1,sp0,sp1,bw,t,off0,made0,auto} (saved with the run). ---- */
const GG={lbStep:1.25,settle:4,bwTol:0.01};
const ggOn=()=>!!(S&&S.free&&!S.zen);
const ggStepOf=(G,k)=>{const f=k/G.n,bw=G.bw0+(G.bw1-G.bw0)*f,sp=G.sp0*G.bw0/bw*Math.pow((G.sp1*G.bw1)/(G.sp0*G.bw0),f);return {bw,sp};};
// start: the plan for a change to grade `to`
function ggStart(to){if(!ggOn()||S.gg||to===C.grade||!GRADES[to]||S.chg)return false;const from=C.grade,bw0=bwSp(),bw1=GRADES[to].bw,sp0=C.pmSp.v,sp1=GRADES[to].sp+P.spBonus+(S.perk.sp[to]||0);
  const n=Math.max(2,Math.ceil(Math.abs(bw1-bw0)/GG.lbStep));
  S.gg={from,to,n,k:0,bw0,bw1,sp0,sp1,bw:bw0,t:S.t,ts:S.t,off0:S.q.off||0,made0:S.q.made||0,auto:Math.round((4+2*Math.abs(bw1-GRADES[from].bw))*10)/10};
  const W=weState();W.trim=0;C.pmSp.auto=false;
  log(`Guided grade change ${from} → ${to}: ${n} steps, speed and weight together. The crew's automatic change would send about ${S.gg.auto.toFixed(0)} t to the beater.`,"ok");return true;}
// the next step (now, settled or not)
function ggNext(){const G=S.gg;if(!G||G.k>=G.n)return;G.k++;const st=ggStepOf(G,G.k);G.bw=st.bw;C.pmSp.v=Math.round(st.sp);G.ts=S.t;
  if(G.k===G.n){C.grade=G.to;applyUpgrades();const pl=S.plan;if(pl){const c=GCOST[G.to];pl.cur=null;pl.left=(c.mix[0]+c.mix[1])/2;}
    log(`Guided grade change: last step. ${G.to} is on the machine now; the QCS judges it on ${G.to}'s spec.`,"ok");}
  else log(`Guided grade change, step ${G.k} of ${G.n}: weight to ${G.bw.toFixed(2)} lb, speed to ${C.pmSp.v.toLocaleString()} fpm.`,"");}
// is the machine settled on this step: weight at its setpoint on the QCS, moisture in the grade's spec, a few minutes on
function ggSettled(){const G=S.gg;if(!G||S.pm!=="run")return {ok:false,bw:false,m:false,t:false};const sp=QSPEC[C.grade]||QSPEC["24"],m=S.dry?S.dry.m:DRY.m0;
  const bw=Math.abs(bwMeas()-G.bw)<=GG.bwTol*G.bw,mo=m>=sp.m[0]&&m<=sp.m[1],t=S.t-G.ts>=GG.settle;return {ok:bw&&mo&&t,bw,m:mo,t};}
// every step: the last step settled = done; the planner waits while a change is under way
function ggTick(){const G=S.gg;if(!G)return;if(!ggOn()){ggEnd("auto");return;}
  if(G.k===G.n&&ggSettled().ok)ggEnd("done");}
// finish: done (the coach's change) or handed to the crew (their automatic change from wherever it is)
function ggEnd(how){const G=S.gg;if(!G)return;const off=Math.max(0,(S.q.off||0)-G.off0),mins=Math.round(S.t-G.t);
  S.gg=null;C.pmSp.auto=true;const W=weState();W.trim=0;
  if(how==="done"){G.res={off,mins,auto:G.auto};S.ggLast=G;{const L=S.q.gc||(S.q.gc=[]);L.push({t:Math.round(S.t),from:G.from,to:G.to,tons:Math.round(off*10)/10,guided:true});if(L.length>20)L.shift();}
    log(`Guided grade change ${G.from} → ${G.to} done in ${mins} min: ${off.toFixed(1)} t to the beater (the crew's automatic change: about ${G.auto.toFixed(0)} t).`,off<=G.auto?"ok":"warn");}
  else{if(C.grade!==G.to){C.grade=G.from;setGrade(G.to);}log("Guided grade change handed back to the crew.","");}}
