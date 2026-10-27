/* ---- v6.9 The Valves Update: six control loops with real valves and PID tuning (claude/valves-v69-plan.md) ----
   NV-101 pulper consistency, LV-104 machine chest level, FV-201 basis weight, LV-202 white water silo level, and the dryer
   steam cascade: QC-300 reel moisture setting PV-302 / PV-303, the 2nd and 3rd section steam pressures.
   Untouched (S.vlv missing, or a loop not in it) every loop is the game's own v6.8 model: the faceplates only read it, so
   an untouched mill plays and checksums exactly as before. The first change the player makes to a loop (mode, setpoint,
   output, tuning, valve settings, a bump test) hands that loop to this model, from where it is (bumpless). Put back on
   its standard tuning and settled for VLV.hold minutes, it hands back to the game's model.
   The loops run on 1 s sub-steps, 15 to each 15 s sim step, with the boundary conditions (speed, load, flows) taken at
   the end of the step before. While a faceplate is open the main loop runs the sub-steps as the game clock reaches them
   (vlvCatch), so the trend moves second by second; the step finishes the rest. Same sub-steps either way: deterministic,
   no dice.
   Each loop: ISA PID (Kc, Ti and Td in minutes, derivative on PV with a filter, conditional anti-windup, bumpless
   transfer and tuning changes), a positioner with deadband and hysteresis, an actuator with a stroke time and
   stick-slip friction, a linear or equal-% trim, a first-order or integrating process with dead time, and a little
   deterministic measurement noise. */
const VLV={sub:15,Pmax:700,siloQ:240,mcK:13.75,mcStd:0.55,hold:10,harm:240,cpTau:60,cpK:0.06};
const vwob=(t,f,k)=>Math.sin(t*f+k)*0.6+Math.sin(t*f*2.7+k*2)*0.4;
// valve characteristic: flow fraction at a stem position x (0..1); and the stem position for a flow fraction
const vch=(v,x)=>{x=clamp(x,0,1);if(v.ch!=="eq")return x;const R=v.R||50;return (Math.pow(R,x-1)-1/R)/(1-1/R);};
const vchInv=(v,f)=>{f=clamp(f,0,1);if(v.ch!=="eq")return f;const R=v.R||50;return clamp(1+Math.log(f*(1-1/R)+1/R)/Math.log(R),0,1);};
const VDEF=[
  {id:"NV-101",name:"Pulper consistency",area:"SPOT",medium:"dilution water",where:"Pulper, stock prep",
    what:"Dilution water into the pulper tub holds its consistency. Thick stock trips the rotor; thin stock overflows the tub and starves the chest.",
    pv:{n:"Pulper consistency",u:"%",lo:0,hi:10,dp:2},sp0:5,spLim:[3,7],act:-1,tune:{kc:1.2,ti:20,td:0},
    valve:{ch:"lin",R:50,stroke:10,db:0.4,hys:0.3,stick:0.5},proc:{type:"fo",th:30,tau:1200},noise:0.02,lam:20,tol:0.1,bump:6000},
  {id:"LV-104",name:"Machine chest level",area:"SPOT",medium:"refined stock",where:"Stock chest pump through the refiners",
    what:"Refined stock from the storage chest fills the machine chest. Run it empty and the machine starves; overfill it and stock goes to the sewer.",
    pv:{n:"Machine chest level",u:"%",lo:0,hi:100,dp:0},sp0:69,spLim:[30,90],act:1,tune:{kc:1.0,ti:16,td:0},
    valve:{ch:"lin",R:50,stroke:12,db:0.5,hys:0.3,stick:0.5},proc:{type:"int",th:5},noise:0.25,lam:8,tol:2,bump:360},
  {id:"FV-201",name:"Basis weight",area:"WET",medium:"thick stock",where:"Thick stock to the fan pump",ff:true,
    what:"The basis weight valve meters thick stock to the fan pump. The scanner reads the weight 3 minutes later, so this loop always looks at the past.",
    pv:{n:"Basis weight (QCS)",u:"lb",lo:0,hi:()=>2*bwStd(),dp:2},sp0:()=>bwSp(),spLim:()=>[+(bwStd()*(1+WE.trimMin)).toFixed(2),+(bwStd()*(1+WE.trimMax)).toFixed(2)],act:1,tune:{kc:0.06,ti:0.35,td:0},
    valve:{ch:"lin",R:50,stroke:8,db:0.3,hys:0.2,stick:0.3},proc:{type:"fo",th:180,tau:20},noise:0.04,lam:3,tol:()=>bwSp()*0.01,bump:480},
  {id:"LV-202",name:"White water silo level",area:"WET",medium:"white water makeup",where:"White water chest to the silo",
    what:"Makeup from the white water chest keeps the silo from running low. Normally the table drains more than the fan pump takes, the silo overflows and this valve sits shut.",
    pv:{n:"WW silo level",u:"%",lo:0,hi:100,dp:0},sp0:25,spLim:[10,80],act:1,tune:{kc:11,ti:20,td:0},
    valve:{ch:"lin",R:50,stroke:15,db:0.5,hys:0.3,stick:0.5},proc:{type:"int",th:3},noise:0.08,lam:10,tol:2,bump:1200,bsz:15,shutOK:true},
  {id:"QC-300",ctl:true,name:"Reel moisture",area:"DET",where:"QCS scanner at the reel",slaves:["PV-302","PV-303"],
    what:"The moisture controller sets the 2nd and 3rd section steam pressures (PV-302 and PV-303 on CAS) to hold the reel at 8%. Tune the steam loops first: the inner loops must be quick for the outer one to work.",
    pv:{n:"Reel moisture (QCS)",u:"%",lo:0,hi:20,dp:2},sp0:8,spLim:[5,11],act:-1,tune:{kc:0.57,ti:3,td:0},out:{u:"psig",k:3},proc:{type:"fo",th:60,tau:180},noise:0.05,lam:4,tol:0.3,bump:900},
  {id:"PV-302",name:"2nd section steam",area:"DET",medium:"steam",where:"Steam header to the 2nd dryer section",cas:true,master:"QC-300",ratio:0.75,
    what:"Steam pressure in the 2nd dryer section. On CAS its setpoint comes from the moisture controller (75% of the 3rd section's: 90 psig to its 120 on the standard).",
    pv:{n:"2nd section pressure",u:"psig",lo:0,hi:300,dp:0},sp0:90,spLim:[0,175],act:1,tune:{kc:0.7,ti:0.5,td:0},
    valve:{ch:"eq",R:50,stroke:6,db:0.3,hys:0.2,stick:0.4},proc:{type:"fo",th:2,tau:30},noise:0.4,lam:0.5,tol:3,bump:180},
  {id:"PV-303",name:"3rd section steam",area:"DET",medium:"steam",where:"Steam header to the 3rd dryer section",cas:true,master:"QC-300",ratio:1,
    what:"Steam pressure in the 3rd dryer section, the main drying load. On CAS its setpoint comes from the moisture controller.",
    pv:{n:"3rd section pressure",u:"psig",lo:0,hi:300,dp:0},sp0:120,spLim:[0,175],act:1,tune:{kc:0.6,ti:0.5,td:0},
    valve:{ch:"eq",R:50,stroke:6,db:0.3,hys:0.2,stick:0.4},proc:{type:"fo",th:2,tau:30},noise:0.5,lam:0.5,tol:3,bump:180},
  // v6.13 the 7th loop (07m): the 3rd section's syphon differential pressure, held with the thermocompressor's motive steam
  {id:"PDC-304",name:"3rd section syphon ΔP",area:"STM",medium:"motive steam",where:"Thermocompressor TC-304, dryer basement",
    what:"The thermocompressor's motive steam holds the differential pressure across the 3rd section's syphons. Too little and the cans fill with condensate and run cold; too much and steam blows straight through to the condenser. Its setpoint follows machine speed (the faster the cans spin, the harder the condensate is to lift) unless you set one.",
    pv:{n:"3rd section ΔP",u:"psi",lo:0,hi:80*KP,dp:2},sp0:()=>stmSp(),spLim:[5*KP,70*KP],act:1,tune:{kc:0.9,ti:0.35,td:0},
    valve:{ch:"lin",R:50,stroke:8,db:0.3,hys:0.2,stick:0.3},proc:{type:"fo",th:3,tau:20},noise:0.3*KP,lam:0.6,tol:1.5*KP,bump:180}];
const VD=Object.fromEntries(VDEF.map(d=>[d.id,d]));
const VGRP=id=>VD[id].master||VD[id].slaves?["QC-300","PV-302","PV-303"]:[id];
const vF=(x,...a)=>typeof x==="function"?x(...a):x;
const vSpan=d=>[vF(d.pv.lo),vF(d.pv.hi)];
const vTol=d=>vF(d.tol);
const vSp0=d=>vF(d.sp0);
const vDefMode=d=>d.cas?"CAS":"AUTO";
const vlvOn=()=>!!(S&&!S.zen);
const vlvT=id=>!!(S&&S.vlv&&S.vlv.lp[id]);

/* ---- the engine: one world (the live mill's S.vlv, or a challenge sandbox) ---- */
function vNew(d,vw){const L={m:vw.m==="IMAN"?"AUTO":vw.m,sp:vw.sp,op:vw.op,pos:vw.pos,tgt:vw.pos,mv:0,I:0,Dd:0,pvp:null,bump:1,
    y:vw.y,pvm:vw.pv,pvf:vw.pv,dq:[],kc:d.tune.kc,ti:d.tune.ti,td:d.tune.td,pf:0,v:Object.assign({},d.valve||{}),e:0,P:0,Dv:0};
  const n=Math.max(1,Math.round(d.proc.th));for(let i=0;i<n;i++)L.dq.push(vw.y);return L;}
// ISA PID on % of span: e = action x (SP - PV); OP = Kc e + I + D + feed-forward
function vPid(d,L,pv,ff){const [lo,hi]=vSpan(d),sp=Math.max(1e-9,hi-lo),dtm=1/60,e=d.act*(L.sp-pv)/sp*100,x=d.act*(pv-lo)/sp*100;
  const P=L.kc*e;let D=0;
  if(L.td>0){const tf=Math.max(L.td*0.1,dtm);if(L.pvp==null)L.pvp=x;L.Dd=(tf*L.Dd-L.kc*L.td*(x-L.pvp))/(tf+dtm);D=L.Dd;}else L.Dd=0;L.pvp=x;
  if(L.bump){L.I=L.op-ff-P-D;L.bump=0;}
  const Ii=L.ti>0?L.I+L.kc*dtm/L.ti*e:L.I,u=P+Ii+D+ff;
  if(!((u>100&&e>0)||(u<0&&e<0)))L.I=Ii;   // (conditional integration: no windup against a stop)
  L.op=clamp(P+L.I+D+ff,0,100);L.P=P;L.Dv=D;L.e=e;}
// positioner (deadband + hysteresis as backlash) and the actuator (stroke time, stick-slip)
function vAct(L){const v=L.v,bl=((v.db||0)+(v.hys||0))/2,c=L.op;
  if(c>=99.9)L.tgt=100;else if(c<=0.1)L.tgt=0;else if(c>L.tgt+bl)L.tgt=c-bl;else if(c<L.tgt-bl)L.tgt=c+bl;
  const g=L.tgt-L.pos,r=100/Math.max(1,v.stroke||1);
  if(!L.mv&&Math.abs(g)>Math.max(0.01,v.stick||0))L.mv=1;
  if(L.mv){const s=clamp(g,-r,r);L.pos=clamp(L.pos+s,0,100);if(Math.abs(g)<=r)L.mv=0;}}
// the processes (1 s): B is the boundary from the game, W the world
const VP={
  "NV-101":(L,B)=>{if(B.pd)return;const yss=5-8*(vch(L.v,L.pos/100)-0.5)+(B.cd||0);L.y+=(yss-L.y)*(1-Math.exp(-1/1200));},   // (a 20-minute tub: the knobs' rule that trouble takes a while to show)
  "LV-104":(L,B,W)=>{let y=L.y+VLV.mcK/60*(vch(L.v,L.pos/100)/VLV.mcStd*(B.ref==null?1:B.ref)-B.qo);if(y>100){W.acc.mco+=y-100;y=100;}L.y=Math.max(0,y);},
  "FV-201":(L,B)=>{if(!B.run)return;const yss=B.bsp*B.ustd*vch(L.v,L.pos/100)*2*B.mr*B.cv/B.u0;L.y+=(yss-L.y)*(1-Math.exp(-1/20));},
  "LV-202":(L,B,W)=>{const cap=WE.silo,mk=VLV.siloQ*vch(L.v,L.pos/100)/3600;W.acc.make+=mk;let t=L.y/100*cap+(B.net||0)/3600+mk;const top=cap*WE.over;
    if(t>top){W.acc.over+=t-top;t=top;}L.y=Math.max(0,t)/cap*100;},
  "QC-300":(L,B,W)=>{const a=W.lp["PV-302"],b=W.lp["PV-303"],p3=b?b.y:B.st3,h3=dryHp(p3,2,B.g),h2=a?dryHp(a.y,1,B.g):h3,eff=0.5*h2+0.5*h3;W.st3=dryPh(eff,2,B.g);   // (v6.13.2-t3: the cans' heat, from each section's steam temperature over the sheet)
    const mss=B.run?DRY.m0+(B.km||0)+(B.dem-eff)*DRY.perPsi:DRY.m0;L.y=Math.max(0.5,L.y+(mss-L.y)*(1-Math.exp(-1/180)));},
  "PV-302":(L,B)=>{const p=Math.min(B.pcap2,VLV.Pmax*0.75*vch(L.v,L.pos/100)*B.hdr/B.lf);L.y+=(p-L.y)*(1-Math.exp(-1/30));},
  "PV-303":(L,B)=>{const p=Math.min(B.pcap,VLV.Pmax*vch(L.v,L.pos/100)*B.hdr/B.lf);L.y+=(p-L.y)*(1-Math.exp(-1/30));},
  "PDC-304":(L,B)=>{const p=Math.min(B.tcmax??60*KP,70*KP*vch(L.v,L.pos/100))*(B.run?1:0.6);L.y+=(p-L.y)*(1-Math.exp(-1/20));}};   // (v6.13: 50% motive gives the standard 5.1 psi (35 kPa); the hand valve caps it)
// a master's slaves are all on CAS (and present): otherwise the master tracks them (IMAN)
function vCasOK(W,d){const sl=d.slaves.filter(s=>W.lp[s]);return sl.length>0&&sl.every(s=>W.lp[s].m==="CAS");}
// one 1 s sub-step of the whole world. ts: time in seconds (noise only)
function vSub(W,ts){const B=W.B;
  // controllers: masters first, then the slaves they set
  for(const d of VDEF){const L=W.lp[d.id];if(!L)continue;const pv=L.pf>0?L.pvf:L.pvm;
    if(d.ctl){const ok=vCasOK(W,d),[lo,hi]=vSpan(d);L.e=d.act*(L.sp-pv)/(hi-lo)*100;
      if(!ok){const sid=[...d.slaves].reverse().find(s=>W.lp[s]);if(sid)L.op=clamp(W.lp[sid].sp/(d.out.k*VD[sid].ratio),0,100);L.bump=1;}
      else if(L.m==="MAN")L.bump=1;else vPid(d,L,pv,0);
      if(ok)for(const s of d.slaves){const Ls=W.lp[s];if(Ls&&Ls.m==="CAS")Ls.sp=L.op*d.out.k*VD[s].ratio;}
      continue;}
    const ff=d.ff?(B.ff||0):0;
    if(L.m==="MAN"){L.bump=1;const [lo,hi]=vSpan(d);L.e=d.act*(L.sp-pv)/(hi-lo)*100;}else vPid(d,L,pv,ff);}
  for(const d of VDEF){const L=W.lp[d.id];if(L&&!d.ctl)vAct(L);}
  for(const d of VDEF){const L=W.lp[d.id];if(L)VP[d.id](L,B,W);}
  // measurement: dead time, noise and the PV filter
  for(const d of VDEF){const L=W.lp[d.id];if(!L)continue;const n=Math.max(1,Math.round(d.proc.th));L.dq.push(L.y);while(L.dq.length>n)L.dq.shift();
    const [lo,hi]=vSpan(d),k=VDEF.indexOf(d)*1.7;L.pvm=clamp(L.dq[0]+d.noise*(vwob(ts,0.21,k)*0.7+Math.sin(ts*1.9+k*3)*0.3),lo,hi);
    L.pvf=L.pf>0?L.pvf+(L.pvm-L.pvf)/(L.pf+1):L.pvm;}}

/* ---- the live mill ---- */
// what each loop reads now: from this model when it has the loop, else from the game's own (read only)
function vlvView(id){const d=VD[id],W=S.vlv,L=W&&W.lp[id];
  if(L){const m=d.ctl&&!vCasOK(W,d)?"IMAN":L.m;return {t:1,m,sp:L.sp,pv:L.pvm,y:L.y,op:L.op,pos:d.ctl?L.op:L.pos,e:L.e};}
  const run=S.pm==="run",We=S.we,D=S.dry;
  switch(id){
    case "NV-101":{const K=S.knob,cp=(K&&K.any&&K.x?K.x.cp:5)+cpBale(),op=clamp(knobVal("pulp")+((We&&We.cpc)||0)/0.08,0,100);return {m:"AUTO",sp:5,pv:cp,y:cp,op,pos:op};}
    case "LV-104":{if(S.mcl!=null){const out=!!(S.M&&S.M.refOut),op=out?100:clamp(VLV.mcStd*100*MCH.fill,0,100);return {m:"AUTO",sp:69,pv:S.mcl,y:S.mcl,op,pos:op};}   // (v6.9.2: refiners down or refilling: the real level; AUTO opens the valve)
      const lv=69+vwob(S.t,0.02,2)*3,q=run?(S.rates.fiberUse||0)/Math.max(1e-6,weUstd()):0,op=clamp(VLV.mcStd*100*q+vwob(S.t,0.05,21)*1.2,0,100);return {m:"AUTO",sp:69,pv:lv,y:lv,op,pos:op};}
    case "FV-201":{const pv=run&&We?bwMeas():bwSp(),y=We&&We.bw!=null?We.bw:pv,op=We?We.v:50;return {m:We&&We.m==="manual"?"MAN":"AUTO",sp:bwSp(),pv,y,op,pos:op};}
    case "LV-202":{const lv=We?We.L/WE.silo*100:WE.over*100,op=clamp(((We&&We.f.make)||0)/VLV.siloQ*100,0,100);return {m:"AUTO",sp:WE.makeL*100,pv:lv,y:lv,op,pos:op};}
    case "PDC-304":{const T=S.stm,y=T?T.dp[2]:35*KP,op=clamp(y/(70*KP)*100,0,100);return {m:"AUTO",sp:stmSp(),pv:S.pm==="run"?y+vwob(S.t,0.17,31)*0.3*KP:y,y,op,pos:op};}   // (v6.13, 07m: AUTO's speed schedule)
    case "QC-300":{const m=D?D.m:DRY.m0,st=D?D.st3:(DRY.pStd[C.grade]||120),pv=run?m+vwob(S.t,0.13,4)*0.25:m;return {m:"AUTO",sp:DRY.m0,pv,y:m,op:st/d.out.k,pos:st/d.out.k};}
    default:{const p3=D?D.st3:(DRY.pStd[C.grade]||120),st=id==="PV-302"?(D?dryP2(D):p3*0.75):p3,b=DRY.base[C.grade]||72,dem=D?D.dem:b,lf=Math.sqrt(Math.max(0.3*b,dem)/b),hdr=D?D.hdr:1;
      const op=vchInv(d.valve,st*lf/(VLV.Pmax*d.ratio*hdr))*100;return {m:"CAS",sp:st,pv:st,y:st,op,pos:op};}}}
function vlvState(){if(!S.vlv)S.vlv={lp:{},any:false,sub:0,w0:S.t,B:null,acc:{mco:0,make:0,over:0},calm:{},harm:{},lg:{},bt:null,btRes:null};return S.vlv;}
// the boundary for the next window of sub-steps (end of each sim step)
function vCap(){const W=S.vlv;if(!W)return;const B=W.B||(W.B={}),run=S.pm==="run",g=C.grade,D=S.dry||dryState(),We=weState(),b=DRY.base[g]||72;
  B.run=run;B.pd=!!(S.M&&S.M.pulperDown);B.ref=S.M&&S.M.refOut?0:1;B.cd=We.cpd||0;B.qo=run?(S.rates.fiberUse||0)/Math.max(1e-6,weUstd()):0;
  const sp=Math.max(S.pmSpeed,P.minSpeed*0.5);B.bsp=bwSp();B.ustd=weUstd();B.u0=weU0(sp);B.mr=mcCons()/WE.mc0;B.cv=1+We.cav*0.06*wobW(0.9,17);B.ff=50*B.u0/B.ustd-50;
  B.tcmax=stmTcMax();{const L4=W.lp["PDC-304"];if(L4&&(!S.stm||S.stm.sp4==null))L4.sp=stmSp();}   // (v6.13: on AUTO's schedule the setpoint follows speed)
  B.net=run?(We.net||0):0;B.dem=D.dem;B.km=D.km||0;B.g=g;B.ceil=dryCeil(D);B.pcap=dryPcap(D);B.pcap2=dryPh(B.ceil,1);B.hdr=D.hdr;B.lf=Math.sqrt(Math.max(0.3*b,D.dem)/b);B.st3=D.st3;
  // the basis weight setpoint is the grade's (and the lightweight trim); a grade change rescales what the scanner has seen
  const L=W.lp["FV-201"];if(L){if(W.g&&W.g!==g&&GRADES[W.g]){const f=bwStd()/GRADES[W.g].bw;L.y*=f;L.pvm*=f;L.pvf*=f;for(let i=0;i<L.dq.length;i++)L.dq[i]*=f;}L.sp=bwSp();}
  W.g=g;W.sub=0;W.w0=S.t;W.acc.mco=0;W.acc.make=0;W.acc.over=0;W.acc.dL=0;}
// run the window's sub-steps up to n (of 15)
function vlvRun(n){const W=S.vlv;if(!W||!W.B)return;n=Math.min(VLV.sub,n);
  while(W.sub<n){const t=W.w0+(W.sub+1)/60;vSub(W,t*60);W.sub++;vBtRec(W,t);vTrRec(W,t);}}
// with a faceplate open: run the sub-steps the clock has reached (the step finishes the window; same result)
function vlvCatch(acc){const W=S.vlv;if(!W||!W.any||S.zen||!W.B)return;vlvRun(Math.floor(acc*60+1e-6));}
// every step (07-sim-step.js), before the knobs and the machine: finish the window, hand the results to the game
function vlvTick(dt){const W=S.vlv;if(!W||!W.any||S.zen)return;if(!W.B)vCap();vlvRun(VLV.sub);
  if(W.lp["NV-101"]){const k=knobState();k.any=true;}   // (v6.14.0-t2: the swings reach the machine chest through 07s, touched or not)
  W.cpl=null;
  if(W.lp["FV-201"]){const We=weState();We.v=W.lp["FV-201"].pos;We.vl=true;}
  if(W.lp["LV-202"]){const We=weState(),L1=W.lp["LV-202"].y/100*WE.silo;W.acc.dL=L1-We.L;We.L=L1;}
  vConseq(dt);vCrew(dt);vHand(dt);}
// end of every step: the boundary for the next window, and the trend points of the loops still on the game's model
function vlvCapture(){if(S.zen)return;const W=S.vlv;if(W&&W.any)vCap();vTrStep();}
// machine chest consistency from pulper swings (07g mcCons adds this; 0 untouched)
const vlvMc=()=>chMc();   // (v6.14.0-t2: the storage and machine chests, 07s)
// what a loop being off does to the mill (the others act through the game's own models: the knobs, the QCS spec, the silo)
function vConseq(dt){const W=S.vlv,L=W.lp["LV-104"];
  if(L){const y=L.y;W.mcLow=y<15?(15-y)/15:0;
    if(y<15&&!W.lg.mcl){W.lg.mcl=1;log("Machine chest level low: the machine is slowing down so it doesn't run out of stock.","warn");}else if(y>25)W.lg.mcl=0;
    if(y<0.5&&S.pm==="run"){W.mcH=(W.mcH||0)+dt/3;if(W.mcH>=1){W.mcH=0;vBreak("Sheet break at the wet end: the machine chest ran empty and the fan pump lost its stock.");}}else W.mcH=Math.max(0,(W.mcH||0)-dt/10);
    if(W.acc.mco>0){const t=Math.min(S.tank,W.acc.mco*weUstd()/60/VLV.mcK);if(t>0){S.tank-=t;wSpill(t);W.mcOver=(W.mcOver||0)+t;}
      if(!W.lg.mco){W.lg.mco=1;log("The machine chest is overflowing: refined stock is going to the sewer.","bad");}W.acc.mco=0;}else if(y<95)W.lg.mco=0;}
  else W.mcLow=0;}
function vBreak(why){if(S.pm!=="run")return;S.pm="break";S.brkType="press";S.breakLeft=2*36;S.breakTotal=S.breakLeft;S.tot.breaks++;enqueue("brk");AUDIO.sfx("snap",2500);log(why,"warn");brkNote();brLog1("press","stock");}
function vlvMods(m){const W=S.vlv;if(!W||!W.any||S.zen)return;if(W.mcLow>0)m.speedCap=Math.min(m.speedCap,1-0.5*W.mcLow);}
// a loop that keeps hurting the mill: the crew finds it and puts it back on standard tuning (seasons and survival, not free play)
function vCrew(dt){const W=S.vlv;if(S.free)return;
  const bad={"PDC-304":()=>S.pm==="run"&&stmFlooded()>0,"LV-104":L=>L.y<15||L.y>97,"FV-201":()=>S.pm==="run"&&QNOW.out.includes("bw"),"LV-202":L=>S.pm==="run"&&L.y<WE.cav*100,"QC-300":()=>S.pm==="run"&&QNOW.out.includes("m")};
  for(const id in bad){const L=W.lp[id];if(!L){W.harm[id]=0;continue;}const g=VGRP(id);
    if(bad[id](L)&&!g.every(x=>vIsDef(x))){W.harm[id]=(W.harm[id]||0)+dt;if(W.harm[id]>=VLV.harm){W.harm[id]=0;
      const who={"PDC-304":"The dry-end operator","LV-104":"Stock prep","FV-201":"The wet-end operator","LV-202":"The wet-end operator","QC-300":"The process engineer"}[id];
      const man=g.some(x=>W.lp[x]&&W.lp[x].m==="MAN");g.forEach(x=>vlvRevert(x,true));
      log(`${who} traced the trouble to ${g.join(" / ")} ${man?"left on MAN":"tuned off standard"} and put ${g.length>1?"them":"it"} back on standard tuning.`,"ok");
      BANNERS.push({text:`Traced: ${g.join(", ")} tuning`,t:null,kind:"good",tag:"FIXED"});while(BANNERS.length>3)BANNERS.splice(1,1);}}
    else W.harm[id]=Math.max(0,(W.harm[id]||0)-dt*0.5);}}
// is a loop back on everything standard?
function vIsDef(id){const d=VD[id],L=S.vlv&&S.vlv.lp[id];if(!L)return true;const T=d.tune;
  if(L.kc!==T.kc||L.ti!==T.ti||L.td!==T.td||(L.pf||0)!==0||L.m!==vDefMode(d))return false;
  if(d.valve)for(const k of ["ch","stroke","db","hys","stick"])if(L.v[k]!==d.valve[k])return false;
  if(id==="PDC-304")return !(S.stm&&S.stm.sp4!=null);   // (v6.13: back on AUTO's speed schedule)
  if(!d.cas&&id!=="FV-201"&&Math.abs(L.sp-vSp0(d))>1e-9)return false;return true;}
// standard and settled: the game's own model takes the loop back, from where it is
function vHand(dt){const W=S.vlv;const done=new Set();
  for(const d of VDEF){if(done.has(d.id)||!W.lp[d.id])continue;const g=VGRP(d.id);g.forEach(x=>done.add(x));
    if(W.bt&&g.includes(W.bt.id)){W.calm[d.id]=0;continue;}
    if(!g.every(x=>vIsDef(x))){W.calm[d.id]=0;continue;}
    const head=W.lp[g[0]],hd=VD[g[0]],tol=vTol(hd),e=Math.abs(head.pvm-head.sp);
    const ok=e<tol||(hd.shutOK&&head.pos<0.5&&head.y>=head.sp-tol);
    W.calm[d.id]=ok?(W.calm[d.id]||0)+dt:0;if(W.calm[d.id]>=VLV.hold){W.calm[d.id]=0;vUntouch(g);}}}
function vUntouch(g){const W=S.vlv,We=weState();
  for(const id of g){const L=W.lp[id];if(!L)continue;
    if(id==="NV-101"){const K=knobState();K.x.cp=5;We.cpc=(We.cpd||0)-(L.y-5);}
    if(id==="FV-201"){We.vl=false;We.m="auto";const sp=Math.max(S.pmSpeed,P.minSpeed*0.5);We.c=1;const base=weValveAuto(sp);We.c=clamp(base>0?We.v/base:1,0.5,1.6);}
    if(id==="LV-202")We.L=L.y/100*WE.silo;
    if(id==="QC-300"&&S.dry)S.dry.m=L.y;
    if(id==="PDC-304"&&S.stm)S.stm.dp[2]=L.y;
    delete W.lp[id];W.calm[id]=0;W.harm[id]=0;}
  W.any=Object.keys(W.lp).length>0;if(!W.any){W.B=null;W.mcLow=0;}}
// hand a loop (its whole group) to this model, from where the game has it
function vlvTouch(id){if(!vlvOn()||!VD[id])return null;const fresh=!S.vlv||!S.vlv.any,W=vlvState();
  for(const x of VGRP(id))if(!W.lp[x]){const d=VD[x];W.lp[x]=vNew(d,vlvView(x));
    if(x==="NV-101")knobState().any=true;if(x==="FV-201")weState().vl=true;}
  W.any=true;if(fresh||!W.B){W.sub=0;W.w0=S.t;vCap();}return W.lp[id];}

/* ---- what the player can do (the faceplate and the tuning panel; tests drive these too) ---- */
function vlvSetMode(id,m){const d=VD[id];if(!d||!vlvOn())return;if(m==="CAS"&&!d.cas)return;const L=vlvTouch(id);if(!L||L.m===m)return;
  if(S.vlv.bt&&S.vlv.bt.id===id)vlvBumpStop(true);L.m=m;L.bump=1;log(`${id} ${d.name.toLowerCase()} to ${m}`,"ok");}
function vlvSetSP(id,v){const d=VD[id];if(!d||!vlvOn())return;const [a,b]=vF(d.spLim);v=clamp(+v,a,b);
  if(id==="FV-201"){bwSetTrim(v);const L=S.vlv&&S.vlv.lp[id];if(L)L.sp=bwSp();return;}
  if(id==="PDC-304"){const L=vlvTouch(id);stmSetSp(v);if(L&&L.m!=="CAS")L.sp=stmSp();return;}   // (v6.13: a fixed setpoint instead of AUTO's speed schedule)
  const L=vlvTouch(id);if(L.m==="CAS")return;L.sp=v;}
function vlvSetOP(id,v){const d=VD[id];if(!d||!vlvOn())return;const L=vlvTouch(id);if(L.m!=="MAN"){if(S.vlv.bt&&S.vlv.bt.id===id)vlvBumpStop(true);L.m="MAN";L.bump=1;}L.op=clamp(+v,0,100);}
function vlvSetTune(id,o){const d=VD[id];if(!d||!vlvOn())return;const L=vlvTouch(id);
  if(o.kc!=null)L.kc=clamp(+o.kc,0,50);if(o.ti!=null)L.ti=clamp(+o.ti,0.02,999);if(o.td!=null)L.td=clamp(+o.td,0,30);if(o.pf!=null)L.pf=clamp(+o.pf,0,60);L.bump=1;}
// the valve itself: free play only (in a season the valves are what they are)
function vlvSetValve(id,o){const d=VD[id];if(!d||!d.valve||!vlvOn()||!S.free)return false;const L=vlvTouch(id);
  if(o.ch)L.v.ch=o.ch==="eq"?"eq":"lin";if(o.stroke!=null)L.v.stroke=clamp(+o.stroke,2,60);if(o.db!=null)L.v.db=clamp(+o.db,0,5);if(o.hys!=null)L.v.hys=clamp(+o.hys,0,5);if(o.stick!=null)L.v.stick=clamp(+o.stick,0,10);return true;}
// back on standard (the whole group): tuning, valve, mode and setpoint
function vlvRevert(id,quiet){const W=S.vlv;if(!W)return;for(const x of VGRP(id)){const L=W.lp[x],d=VD[x];if(!L)continue;
    if(x==="PDC-304"&&S.stm)S.stm.sp4=null;
    Object.assign(L,{kc:d.tune.kc,ti:d.tune.ti,td:d.tune.td,pf:0,m:vDefMode(d),bump:1});if(d.valve)L.v=Object.assign({},d.valve);if(!d.cas&&x!=="FV-201")L.sp=vSp0(d);if(x==="FV-201")L.sp=bwSp();}
  if(W.bt&&VGRP(id).includes(W.bt.id))W.bt=null;if(!quiet)log(`${VGRP(id).join(" / ")} back on standard tuning`,"ok");}
// the crew's hard reset after a knob incident on the pulper (07b knobSettle): the game's model takes the loop straight back
function vlvSettle(id){if(vlvT(id)){if(S.vlv.bt&&S.vlv.bt.id===id)S.vlv.bt=null;const L=S.vlv.lp[id];if(id==="NV-101")L.y=5;vUntouch(VGRP(id));}}
// the field knob for the pulper dilution valve drives NV-101 (manual at the valve)
const vlvPulpOP=()=>S.vlv&&S.vlv.lp["NV-101"]?Math.round(S.vlv.lp["NV-101"].op):null;

/* ---- bump test: MAN, wait for a baseline, step the output, record, fit a model, put the loop back ---- */
function vlvBump(id,size){const d=VD[id];if(!d||!vlvOn())return false;if(S.vlv&&S.vlv.bt)return false;const L=vlvTouch(id),W=S.vlv;
  if(d.ctl&&!vCasOK(W,d))return false;const prev=d.ctl?(L.m==="MAN"?"MAN":"AUTO"):L.m,op0=L.op;size=+size||d.bsz||5;
  const dop=op0+size>100?-Math.abs(size):op0-size<0?Math.abs(size):size;
  if(L.m!=="MAN"){L.m="MAN";L.bump=1;}W.bt={id,t:0,base:clamp(Math.round(d.bump*0.15),30,240),dur:d.bump,op0,dop,prev,rec:[]};W.btRes=null;return true;}
function vlvBumpStop(quiet){const W=S.vlv;if(!W||!W.bt)return;const b=W.bt,L=W.lp[b.id];W.bt=null;if(L&&!quiet){L.m=b.prev;L.bump=1;}}
function vBtRec(W,t){const b=W.bt;if(!b)return;const L=W.lp[b.id],d=VD[b.id];if(!L||L.m!=="MAN"){W.bt=null;return;}
  b.rec.push(L.pvm);b.t++;if(b.t===b.base)L.op=clamp(b.op0+b.dop,0,100);
  const [lo,hi]=vSpan(d),f=(L.pvm-lo)/(hi-lo),runaway=d.proc.type==="int"&&b.t>b.base&&(f<0.06||f>0.94);
  if(b.t>=b.base+b.dur||runaway){W.btRes=Object.assign(vFit(d,b.rec,b.base,b.dop),{id:b.id,at:t,cut:runaway});W.bt=null;L.m=b.prev;L.bump=1;}}
const vAvg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
function vSlope(a){const n=a.length;if(n<2)return 0;const mx=(n-1)/2,my=vAvg(a);let sxy=0,sxx=0;for(let i=0;i<n;i++){sxy+=(i-mx)*(a[i]-my);sxx+=(i-mx)*(i-mx);}return sxy/sxx;}
// fit a process model to a bump test: rec = PV each second, step at index base, dop = the output step (%)
function vFit(d,rec,base,dop){const [lo,hi]=vSpan(d),span=hi-lo,toP=v=>v/span*100;
  const sm=rec.map((_,i)=>vAvg(rec.slice(Math.max(0,i-4),i+5)));   // (5 s either side: the noise out)
  const pre=sm.slice(0,base),y0=vAvg(pre.slice(-15)),s0=vSlope(pre),aft=sm.slice(base),n=aft.length;
  if(d.proc.type==="int"){const half=aft.slice(Math.floor(n/2)),s1=vSlope(half),km=Math.floor(n/2)+(half.length-1)/2,ym=vAvg(half);
    const Ki=toP(s1-s0)*60/dop;   // %span per minute per % output
    // (dead time: where the new slope's line leaves the old baseline)
    const kx=Math.abs(s1-s0)>1e-9?(y0-ym+s1*km)/(s1-s0):0;
    return {type:"int",Ki,th:clamp(kx,0,n)/60,sub:"integrating",dy:toP(s1*60)};}
  const yEnd=vAvg(aft.slice(-Math.max(5,Math.floor(n*0.1)))),dy=yEnd-y0,K=toP(dy)/dop;
  const tAt=f=>{for(let i=0;i<n;i++)if((aft[i]-y0)/(dy||1e-9)>=f)return i;return n;};
  const t28=tAt(0.283),t63=tAt(0.632),tau=Math.max(1,1.5*(t63-t28)),th=Math.max(0,t63-tau);
  const late=aft.slice(-Math.floor(n*0.2)),settled=Math.abs(vSlope(late))*late.length<Math.abs(dy)*0.05;
  return {type:"fo",K,tau:tau/60,th:th/60,settled,sub:"self-regulating"};}
// Lambda tuning from a fitted model: speed 0 conservative, 1 moderate, 2 aggressive; form "PI" or "PID"
function vLambda(d,f,speed,form){const r3=v=>+(+v).toPrecision(3);
  if(f.type==="int"){const Ki=Math.max(1e-6,Math.abs(f.Ki)),th=f.th,lam=[2,1,0.5][speed]*d.lam;
    return {kc:r3((2*lam+th)/(Ki*(lam+th)*(lam+th))),ti:r3(2*lam+th),td:0,lam:r3(lam)};}
  // (self-regulating: λ from the dead time, or a quarter of τ on a lag-dominant loop; Ti = τ, but never more than
  // 4(λ + θ), so a slow process still gets rid of a disturbance in good time: Skogestad's SIMC refinement of Lambda)
  const K=Math.max(1e-6,Math.abs(f.K)),tau=Math.max(f.tau,0.01),th=f.th,m=Math.max(th,tau/4),lam=[2*m,m,Math.max(th,m/2)][speed];
  if(form==="PID")return {kc:r3((tau+th/2)/(K*(lam+th/2))),ti:r3(Math.min(tau+th/2,4*(lam+th))),td:r3(tau*th/(2*tau+th)),lam:r3(lam)};
  return {kc:r3(tau/(K*(lam+th))),ti:r3(Math.min(tau,4*(lam+th))),td:0,lam:r3(lam)};}

/* ---- the trend: 1 s points while the model has a loop, a point a step while the game's model has it (outside S) ---- */
const VT={S:null,n:3600,b:{}};
function vTrBuf(id){if(VT.S!==S){VT.S=S;VT.b={};}return VT.b[id]||(VT.b[id]={i:0,len:0,t:new Float64Array(VT.n),sp:new Float32Array(VT.n),pv:new Float32Array(VT.n),op:new Float32Array(VT.n),pos:new Float32Array(VT.n)});}
function vTrPush(id,t,sp,pv,op,pos){const B=vTrBuf(id),i=B.i;B.t[i]=t;B.sp[i]=sp;B.pv[i]=pv;B.op[i]=op;B.pos[i]=pos;B.i=(i+1)%VT.n;B.len=Math.min(VT.n,B.len+1);}
function vTrRec(W,t){for(const d of VDEF){const L=W.lp[d.id];if(!L)continue;const v=vlvView(d.id);vTrPush(d.id,t,v.sp,v.pv,v.op,v.pos);}}
function vTrStep(){const W=S.vlv;for(const d of VDEF){if(W&&W.lp[d.id])continue;const v=vlvView(d.id);vTrPush(d.id,S.t,v.sp,v.pv,v.op,v.pos);}}
// points in the last `min` minutes: {t,sp,pv,op,pos} arrays, oldest first
function vlvTrace(id,min){const B=vTrBuf(id),o={t:[],sp:[],pv:[],op:[],pos:[]};if(!B.len)return o;const tn=B.t[(B.i-1+VT.n)%VT.n],t0=tn-min;
  for(let k=0;k<B.len;k++){const i=(B.i-B.len+k+VT.n)%VT.n;if(B.t[i]<t0)continue;o.t.push(B.t[i]);o.sp.push(B.sp[i]);o.pv.push(B.pv[i]);o.op.push(B.op[i]);o.pos.push(B.pos[i]);}return o;}

/* ---- loop health in plain words, from the trend ---- */
function vlvHealth(id,tr){const d=VD[id],v=vlvView(id),tol=vTol(d),n=tr?tr.t.length:0;
  const H=(k,txt,why,tip)=>({k,txt,why,tip});
  if(v.m==="MAN")return H("man","In MAN","The controller isn't moving the valve: it holds where the operator put it.","Switch to AUTO when the process is steady; the change is bumpless.");
  if(v.m==="IMAN")return H("man","Waiting for CAS","The steam loops aren't on CAS, so this controller's output just follows their setpoints.","Put PV-302 and PV-303 on CAS to close the moisture loop.");
  if(S.pm!=="run"&&(id==="FV-201"||id==="QC-300"))return H("man","Machine down","No sheet: the scanner has nothing to read.","It picks up again when the sheet is back on.");
  if(n<8)return H("steady","Collecting","Not enough trend yet to judge the loop.","Give it a minute.");
  const e=tr.pv.map((p,i)=>p-tr.sp[i]),ae=e.map(Math.abs),mae=vAvg(ae);
  const sat=tr.pos.filter(p=>p<0.5||p>99.5).length/n;
  if(d.shutOK&&vAvg(tr.pos)<0.5&&vAvg(e)>-tol)return H("steady","Steady · valve shut","The silo is overflowing: the table drains more than the fan pump takes, so there's nothing to make up.","Normal. The valve opens if vacuum or thick stock draws the silo down.");
  if(sat>0.5&&mae>tol)return H("sat",vAvg(tr.pos)>50?"Saturated · wide open":"Saturated · shut","The valve is at its stop and still can't hold the setpoint. More gain won't help: it can't open any further.","Look at the setpoint or the load, not the tuning.");
  // oscillation: crossings of the setpoint with a little hysteresis
  let cr=0,s=0;for(const x of e){const q=x>tol*0.5?1:x<-tol*0.5?-1:0;if(q&&q!==s){if(s)cr++;s=q;}}
  const amp=(Math.max(...e)-Math.min(...e))/2,span=(tr.t[n-1]-tr.t[0])||1,per=cr>1?2*span/cr:0;
  if(cr>=4&&amp>tol*0.75){
    // stick-slip: the valve sits still most of the time and moves in jumps while the output ramps
    let flat=0,jumps=0;const gap=[];for(let i=1;i<n;i++){const dp=Math.abs(tr.pos[i]-tr.pos[i-1]);if(dp<0.02)flat++;else if(dp>0.25)jumps++;gap.push(Math.abs(tr.op[i]-tr.pos[i]));}
    gap.sort((a,b)=>a-b);const g90=gap[Math.floor(gap.length*0.9)]||0;
    if(d.valve&&flat/n>0.5&&jumps>=4&&g90>1.2)return H("stick","Valve sticking","Sawtooth output, square valve moves: the stem sticks, the output winds up until it breaks free, and it overshoots. Tuning can't fix friction.","Lower the gain and lengthen Ti to slow the cycle down; in the mill you'd call maintenance to repack or rebuild the valve.");
    if(d.proc.th>=60&&per>0&&per<6*d.proc.th/60)return H("dead","Fighting the past",`It swings every ${per.toFixed(1)} min against ${(d.proc.th/60).toFixed(0)} min of dead time: the controller keeps correcting things it can't see yet.`,"Less gain and more patience: Lambda tuning with λ at least the dead time.");
    return H("osc","Oscillating",`Swinging ±${amp.toFixed(d.pv.dp)} ${d.pv.u} every ${per.toFixed(1)} min: too much gain, or too little Ti.`,"Halve Kc, or double Ti. A bump test gives you a starting point.");}
  const one=e.filter(x=>x>tol).length,oth=e.filter(x=>x<-tol).length;
  if(mae>tol&&Math.max(one,oth)/n>0.6&&cr<=1)return H("slow","Sluggish","The PV is a long way off the setpoint and creeping back slowly.","More gain, or a shorter Ti. Mind the dead time.");
  return H("steady","Steady",`Within ±${(+tol).toFixed(d.pv.dp)} ${d.pv.u} of the setpoint.`,"Try a setpoint step to see how it responds.");}

/* ---- tuning challenges: a sandbox copy of a loop, run headless (the mill is untouched) ---- */
const VCHAL=[
  {id:"shake",title:"Tame the shake",loops:["NV-101"],min:120,start:{"NV-101":{kc:25,ti:0.6,td:0}},ev:[[2,"cd",-0.6],[60,"sp","NV-101",5.5]],
    brief:"The pulper consistency loop is swinging. Bale water hits at 2 min and the setpoint steps to 5.5% at 60 min. Calm it down without making it sluggish."},
  {id:"wake",title:"Wake it up",loops:["LV-104"],min:40,start:{"LV-104":{kc:0.15,ti:60,td:0}},ev:[[2,"qo",1.25],[20,"qo",0.9]],
    brief:"The machine chest level loop barely moves. The machine speeds up at 2 min and slows at 20 min. A level is an integrating process: Ti works differently here."},
  {id:"stick",title:"It's not you, it's the valve",loops:["NV-101"],min:120,start:{"NV-101":{kc:10,ti:1,td:0}},valve:{"NV-101":{stick:2.5}},ev:[[2,"cd",-0.4],[60,"cd",0]],trW:0,rvW:1.5,
    brief:"This dilution valve sticks (2.5% stiction). No tuning makes it steady: every reversal of the valve is a jump. Find the calmest response with the fewest valve reversals."},
  {id:"inner",title:"Inner first",loops:["QC-300","PV-303"],min:30,start:{"QC-300":{kc:0.57,ti:3,td:0},"PV-303":{kc:2.6,ti:0.12,td:0}},ev:[[3,"dem",9],[18,"dem",-6]],
    brief:"The moisture loop (outer) sets the 3rd section steam (inner) on CAS. The drying load rises at 3 min and falls at 18 min. Tune the inner loop first."},
  {id:"patience",title:"Patience",loops:["FV-201"],min:40,start:{"FV-201":{kc:0.5,ti:0.25,td:0}},ev:[[2,"mr",1.04]],
    brief:"The basis weight loop reads 3 minutes late. The machine chest thickens 4% at 2 min. Aggressive tuning goes unstable: find the fastest calm response."},
  {id:"syphon",title:"Hold the syphons",loops:["PDC-304"],min:20,start:{"PDC-304":{kc:0.12,ti:2.5,td:0}},ev:[[2,"sp","PDC-304",42*KP],[11,"sp","PDC-304",31*KP]],
    brief:"The 3rd section's syphon ΔP loop is lazy: the machine speeds up at 2 min (setpoint to 6.1 psi) and slows at 11 min (4.5 psi). Short of the setpoint the cans flood. A quick loop with a small dead time: make it keep up."}];
const VCH=Object.fromEntries(VCHAL.map(c=>[c.id,c]));
function vSbB(){return {g:"24",run:true,pd:false,cd:0,qo:1,bsp:bwStd(),ustd:1,u0:1,mr:1,cv:1,ff:0,net:0,dem:72,km:0,ceil:82.5,pcap:165,pcap2:dryPh(82.5,1,"24"),hdr:1,lf:1,st3:120,tcmax:60*KP};}
// a challenge run: tune = {loopId:{kc,ti,td}}; returns the trace (per second) and the score
function vlvChallenge(cid,tune){const c=VCH[cid],B=vSbB(),W={lp:{},B,acc:{mco:0,make:0,over:0}};
  const fsp={"NV-101":5,"LV-104":69,"FV-201":B.bsp,"QC-300":8,"PV-303":120,"PDC-304":35*KP};
  const fsy={"NV-101":[50,5],"LV-104":[55,69],"FV-201":[50,B.bsp],"QC-300":[40,8],"PV-303":[vchInv(VD["PV-303"].valve,120/VLV.Pmax)*100,120],"PDC-304":[50,35*KP]};
  for(const id of c.loops){const d=VD[id],[op,y]=fsy[id];const L=vNew(Object.assign({},d,{tune:Object.assign({},d.tune,c.start[id],tune&&tune[id])}),{m:d.cas?"CAS":"AUTO",sp:fsp[id],op,pos:op,y,pv:y});
    if(c.valve&&c.valve[id])Object.assign(L.v,c.valve[id]);W.lp[id]=L;}
  const main=c.loops[0],[lo,hi]=vSpan(VD[main]);
  const N=c.min*60,o={t:[],sp:[],pv:[],op:[],pos:[],in:{sp:[],pv:[]}};let iae=0,trav=0,rev=0,ld=0,early=0,late=0;
  const ev=c.ev.map(e=>e.slice());
  for(let s=1;s<=N;s++){const tm=s/60;
    for(const e of ev)if(!e.done&&tm>=e[0]){e.done=1;if(e[1]==="sp")W.lp[e[2]].sp=e[3];else if(e[1]==="dem")B.dem+=e[2];else B[e[1]]=e[2];}
    const vm=c.loops.find(i=>!VD[i].ctl),p0=W.lp[vm].pos;vSub(W,s);const L=W.lp[main];
    const er=Math.abs(L.sp-L.pvm)/(hi-lo)*100;iae+=er/60;if(s>N*0.8)late=Math.max(late,er);else if(s>N*0.4&&s<=N*0.6)early=Math.max(early,er);
    {const dp=W.lp[vm].pos-p0;trav+=Math.abs(dp);if(dp&&ld&&Math.sign(dp)!==ld)rev++;if(dp)ld=Math.sign(dp);}   // (the valve: the inner loop's, under a master)
    if(s%2===0){o.t.push(tm);o.sp.push(L.sp);o.pv.push(L.pvm);o.op.push(L.op);o.pos.push(VD[main].ctl?L.op:L.pos);
      const In=c.loops[1]&&W.lp[c.loops[1]];if(In){o.in.sp.push(In.sp);o.in.pv.push(In.pvm);}}}
  const score=iae+trav*(c.trW!=null?c.trW:0.015)+rev*(c.rvW||0),unstable=late>Math.max(early*1.3,1)&&late>8;
  return {trace:o,iae,trav,rev,score:unstable?Infinity:score,unstable};}
// the reference: what a careful engineer gets. Lambda (moderate) from the true model, then a coarse search around it,
// loop by loop, inner loops first (headless; once per challenge, cached)
const VCHREF={shake:45.41,wake:13.50,stick:34.87,inner:27.55,patience:16.69,syphon:8.97};   // (v6.13: syphon)   // (v6.9.2: precomputed, the same within 1% on every grade; the search below froze the first Run for ~0.5 s, more on a phone)
function vlvChRef(cid){if(VCHREF[cid]!=null)return VCHREF[cid];const c=VCH[cid];
  const fit={"PDC-304":{type:"fo",K:0.875,tau:0.33,th:0.05},"NV-101":{type:"fo",K:-0.8,tau:20,th:0.5},"LV-104":{type:"int",Ki:0.25,th:0.08},"FV-201":{type:"fo",K:1,tau:0.33,th:3},"QC-300":{type:"fo",K:-0.94,tau:3,th:1.3},"PV-303":{type:"fo",K:1.68,tau:0.5,th:0.04}};
  const t={};for(const id of c.loops)t[id]=vLambda(VD[id],fit[id],1,"PI");let best=vlvChallenge(cid,t).score;
  const order=c.loops.slice().reverse();
  for(let pass=0;pass<2;pass++)for(const id of order){const b0=Object.assign({},t[id]);let bt=b0;
    for(const km of [0.25,0.5,1,2,4])for(const tm of [0.1,0.25,0.5,1,2]){if(km===1&&tm===1)continue;const tr=Object.assign({},t,{[id]:{kc:b0.kc*km,ti:b0.ti*tm,td:0}}),s=vlvChallenge(cid,tr).score;if(s<best){best=s;bt=tr[id];}}
    t[id]=bt;}
  return VCHREF[cid]=best;}
function vlvStars(cid,score){if(!isFinite(score))return 0;const r=vlvChRef(cid);return score<=r*1.2?3:score<=r*1.7?2:score<=r*3?1:0;}
// best stars per mill (saved with the run; nothing to do with the mill's own loops)
function vlvChSave(cid,st){const c=S.vlvc||(S.vlvc={});if(st>(c[cid]||0))c[cid]=st;}
// v6.9: older saves: the 2nd/3rd section steam held on MANUAL (D.man) and the basis weight valve on MANUAL are the new loops
function vlvMigrate(){if(!S||S.zen)return;const D=S.dry,We=S.we;
  if(D&&D.man!=null){const p=D.man;D.man=null;vlvTouch("QC-300");const W=S.vlv;W.lp["PV-303"].m="AUTO";W.lp["PV-303"].sp=p;W.lp["PV-302"].m="AUTO";W.lp["PV-302"].sp=p*0.75;W.lp["QC-300"].bump=1;}
  if(We&&We.m==="manual"&&!We.vl){const v=We.v;We.m="auto";const L=vlvTouch("FV-201");L.m="MAN";L.op=v;L.bump=1;}
  const K=S.knob;if(K&&K.v&&K.v.pulp!==KNOB_IDEAL.pulp){const v=K.v.pulp;K.v.pulp=KNOB_IDEAL.pulp;vlvSetOP("NV-101",v);}}
