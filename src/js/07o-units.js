/* ---- v6.13.2 Real Numbers: older saves into the new units (plan: claude/benchmarks-v6132-plan.md) ----
   v6.13.2 moved every pressure to psi and rescaled the numbers that were off real-mill levels:
   - the dryer section pressures, their setpoints and limits: psig = old kPa x ST_K (0.6, a rescale to real levels, 07d)
   - the syphon, cleaner and screen differentials: psi = old kPa x KP (a straight unit change, 07m, 07c)
   - ring crush: the grade's new RCT0 over its old one (07g)
   A new game is born with S.u=2. A save without it is from before, and restore (51c) converts it here once, before the
   valve loops are migrated, so a run carries on exactly where it was. ---- */
function unitsMigrate(){if(!S||(S.u||0)>=UNITS_V)return;const k=ST_K,sc=(o,f,ks)=>{if(o)for(const n of ks)if(typeof o[n]==="number")o[n]*=f;};
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
  S.u=UNITS_V;diag("save: older units converted (v6.13.2 psi, ring crush)");}
