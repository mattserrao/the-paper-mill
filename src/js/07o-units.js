/* ---- v6.13.2 Real Numbers: older saves into the new units (plan: claude/benchmarks-v6132-plan.md) ----
   v6.13.2 moved every pressure to psi and rescaled the numbers that were off real-mill levels:
   - the dryer section pressures, their setpoints and limits: psig = old kPa x ST_K (0.6, a rescale to real levels, 07d)
   - the syphon, cleaner and screen differentials: psi = old kPa x KP (a straight unit change, 07m, 07c)
   - ring crush: the grade's new RCT0 over its old one (07g)
   A new game is born with S.u=2. A save without it is from before, and restore (51c) converts it here once, before the
   valve loops are migrated, so a run carries on exactly where it was. ---- */
function unitsMigrate(){if(!S||(S.u||0)>=UNITS_V)return;if((S.u||0)<2)unitsMigrate2();unitsMigrate3();S.u=UNITS_V;}
function unitsMigrate2(){const k=ST_K,sc=(o,f,ks)=>{if(o)for(const n of ks)if(typeof o[n]==="number")o[n]*=f;};
  // the dryers (07d) and the 1st section knob (07b)
  sc(S.dry,k,["st3","dem","dem0","maxDem","man"]);
  if(S.knob&&S.knob.v&&typeof S.knob.v.st1==="number")S.knob.v.st1=Math.round(S.knob.v.st1*k/3)*3;
  // the steam cascade (07m): the syphon ΔPs and PDC-304's fixed setpoint
  const T=S.stm;if(T){if(Array.isArray(T.dp))T.dp=T.dp.map(v=>v*KP);if(typeof T.sp4==="number")T.sp4*=KP;}
  // the control loops (07h): every pressure a loop holds (PV, setpoint, the measurement's dead-time queue)
  const W=S.vlv;if(W&&W.lp){for(const [id,f] of [["PV-302",k],["PV-303",k],["PDC-304",KP]]){const L=W.lp[id];if(!L)continue;
      sc(L,f,["sp","y","pvm","pvf","pvp"]);if(Array.isArray(L.dq))L.dq=L.dq.map(v=>v*f);}
    if(typeof W.st3==="number")W.st3*=k;if(W.B){sc(W.B,k,["dem","ceil","st3"]);sc(W.B,KP,["tcmax"]);}W.bt=null;}
  if(S.we&&typeof S.we.fs==="number")S.we.fs*=KP;   // the fine screen's ΔP (07g)
  // the cleaners' ΔP (07c): the purge state's readings
  const pg=S.dcs&&S.dcs.pg;if(pg)for(const c in pg){const p=pg[c];{const o=PURGE_OLD[c];if(p&&typeof p.dp==="number"&&o)p.dp=PURGE.base[c]+(p.dp-o.b)*(PURGE.trip[c]-PURGE.base[c])/(o.t-o.b);}}
  // ring crush (07g): the last QCS reading, its history column
  const g=C&&C.grade,rr=g&&RCT0_OLD[g]?RCT0[g]/RCT0_OLD[g]:0.5;if(typeof QNOW.rct==="number")QNOW.rct*=rr;
  // the hourly history (11c): the columns that hold a pressure or ring crush
  if(S.hist&&S.hist.rows&&typeof HCI!=="undefined"){const cd=HCI["a.dp3"],cr=HCI["a.rct"];
    for(const r of S.hist.rows){if(cd!=null&&typeof r[cd]==="number")r[cd]*=KP;if(cr!=null&&typeof r[cr]==="number")r[cr]*=rr;}}
  S.u=2;diag("save: older units converted (v6.13.2 psi, ring crush)");}
/* v6.13.2-t3 (S.u 3): the 3rd section's number was a load on a psig scale (72 on grade 24); it is now a real pressure
   through heat transfer (07d). The old number is the load (D.h3), the pressure is what that load needs (dryPh). The
   loops' pressures map the same way, the 2nd section through its own curve; the moisture controller's output keeps
   the pressure it was asking for; the 1st section knob moves to the new standard (40 psig for the old 42). */
function unitsMigrate3(){const D=S.dry;
  if(D){if(typeof D.st3==="number"){D.h3=D.st3;D.st3=dryPh(D.h3);}if(typeof D.man==="number")D.man=dryPh(D.man);}
  if(S.knob&&S.knob.v&&typeof S.knob.v.st1==="number"){const v=S.knob.v.st1;S.knob.v.st1=clamp(Math.round((v>42?40+(v-42)/108*60:v*40/42)/2)*2,0,100);}   // (the same share of the drying, 07b st1D)
  const W=S.vlv;if(W&&W.lp){const mp={"PV-303":v=>dryPh(v),"PV-302":v=>dryPh(v/0.8,1)};
    for(const id in mp){const L=W.lp[id];if(!L)continue;const f=mp[id];for(const n of ["sp","y","pvm","pvf"])if(typeof L[n]==="number")L[n]=f(L[n]);
      if(Array.isArray(L.dq))L.dq=L.dq.map(f);L.pvp=null;L.bump=1;}
    const Q=W.lp["QC-300"];if(Q&&typeof Q.op==="number"){Q.op=clamp(dryPh(Q.op*1.8)/3,0,100);Q.bump=1;}
    if(typeof W.st3==="number")W.st3=dryPh(W.st3);
    if(W.B){if(typeof W.B.st3==="number")W.B.st3=dryPh(W.B.st3);W.B.g=C.grade;if(typeof W.B.ceil==="number"){W.B.ceil=dryHp(DRY.lim);W.B.pcap=dryPh(W.B.ceil);W.B.pcap2=dryPh(W.B.ceil,1);}}
    W.bt=null;}
  diag("save: dryer steam to real pressures (v6.13.2-t3)");}
