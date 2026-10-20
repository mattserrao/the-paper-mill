/* ---- v6.10 the Reliability screen (RELIAB) and the drive load page (DRIVES) in the control room, the changeouts on the
   outage plan, and the reliability line on the upset cards. The model is 07i-assets.js. Both screens are live (the mill
   keeps running at your speed) and sit with the DCS screens, so the trend pane works beside them. ---- */
DCS_SCREENS.splice(4,0,["DRV","DRIVES","Drives: each drive's load, trended"],["REL","RELIAB","Reliability: rounds, vibration, ADX motor tests"]);
DCS_SCR.DRV={title:"DRIVES · MCC"};DCS_SCR.REL={title:"RELIABILITY"};
TR_DEF.DRV=["dl_pulp","dl_refA","dl_refB","dl_dry"];TR_DEF.REL=["dl_refA","dl_pr1","mcckw"];
AREA_N.DRV="Drives";AREA_N.REL="Reliability";
const RUI={sel:"refA",key:""};
const rlyChip=(t,cls,sub,extra)=>`<span class="rch ${cls||""}"${extra||""}><b>${t}</b>${sub?`<small>${sub}</small>`:""}</span>`;
const rlyWho=x=>{if(x.who==="e"){const m=manNow();return (m.elec&&m.elec.who&&m.elec.who.name)||"Electrical tech";}const m=manNow(),r=m.techs[+x.who.slice(1)];return r&&r.who?r.who.name:(r?r.home.name:"Tech");};

/* ---------- DRIVES: the MCC lineups ---------- */
function drvBuild(b){b.appendChild(kEl("div","dcsal",`<b>Alarms</b><ul id="dcsAl"></ul>`));
  b.appendChild(kEl("div","drvw",`<div class="qcsv" id="drvTop"></div><div id="drvL"></div>`));
  b.appendChild(kEl("p","dcsfield","Load is the drive's output against its rated power. Tap a load to trend it. Over about 95% a drive trips more often; over 100% it also wears its motor and bearings faster. A tripped drive reads zero until the electrical tech changes it."));}
function drvRefresh(){const el=$("drvL");if(!el)return;const r=knobRead(),R=S.rel;let kw=0,run=0,flt=0;const al=[];
  const rows=LINEUPS.map(([ln,name,tag])=>{const list=ASSETS.filter(A=>A.ln===ln).map(A=>{const L=Math.max(0,rlyLoad(A.id,r)),st=rlyDrvSt(A.id,L),T=rlyTemp(A.id,L);kw+=L/100*A.kw;if(st==="run")run++;if(st==="fault"||st==="trip")flt++;
      if(st==="fault")al.push([`DRIVE FAULT · ${A.n.toUpperCase()}`,true]);else if(st==="trip")al.push([`MOTOR TRIPPED · ${A.n.toUpperCase()}`,true]);
      else if(L>100)al.push([`DRIVE OVERLOAD · ${A.n.toUpperCase()} ${Math.round(L)}%`,L>110]);else if(L>95)al.push([`DRIVE LOAD HI · ${A.n.toUpperCase()}`,false]);
      if(T>72)al.push([`DRIVE TEMP HI · ${A.n.toUpperCase()} ${Math.round(T)} °C`,T>78]);
      const cls=L>100?"bad":L>95?"warn":"",stc={run:"ok",idle:"",off:"",fault:"bad",trip:"bad"}[st],stn={run:"RUN",idle:"IDLE",off:"OFF · OUTAGE",fault:"FAULT",trip:"TRIPPED"}[st];
      return `<tr><td><b>${A.n}</b><small>${A.kw.toLocaleString()} kW VFD</small></td><td><span class="dst ${stc}">${stn}</span></td>
        <td><button type="button" class="dbar trk" data-trk="dl_${A.id}" title="Trend ${A.n} drive load"><i style="width:${clamp(L,0,130)/1.3}%" class="${cls}"></i><em>${Math.round(L)} %</em></button></td><td class="${T>72?"bad":""}">${Math.round(T)} °C</td></tr>`;}).join("");
    return `<section class="plsec"><div class="dcssub">${tag} · ${name}</div><table><thead><tr><th>Drive</th><th>Status</th><th>Load</th><th>Heat sink</th></tr></thead><tbody>${list}</tbody></table></section>`;}).join("");
  const h=`<section class="plsec drvsub"><div class="dcssub">Substation → MCC</div><p class="dcsfield">${outOn()?"Planned outage: the lineups are locked out.":active("lightning")||active("birdline")?"<span class=\"bad\">Blackout: no power from the substation.</span>":active("brownout")?"The utility has cut the mill back (brownout).":"13.8 kV from the substation, stepped down to 480 V for the drives."}</p></section>`+rows;
  if(el._h!==h){el._h=h;el.innerHTML=h;}
  const top=`<div><small>MCC power</small><b>${Math.round(kw).toLocaleString()} kW</b><small>10 drives</small></div><div><small>Running</small><b>${run}</b><small>of ${ASSETS.length}</small></div><div><small>Faulted</small><b class="${flt?"bad":""}">${flt}</b><small>${flt?"electrical tech called":"none"}</small></div><div><small>Electrical tech</small><b>${rlyElecNow()}</b><small>${(manNow().elec&&manNow().elec.who.name)||""}</small></div>`;
  const t=$("drvTop");if(t&&t._h!==top){t._h=top;t.innerHTML=top;}
  const ul=$("dcsAl"),ah=al.length?al.map(([x,hi])=>`<li class="${hi?"hi":""}">${x}</li>`).join(""):'<li class="none">No alarms</li>';if(ul&&ul._h!==ah){ul._h=ah;ul.innerHTML=ah;}}
function rlyElecNow(){const j=S.inc.find(i=>ENEED(i.id)&&i.eSlot===0);if(j)return j.eGo?"On a job":"On the way";const R=S.rel,x=R&&R.rd.list.find(q=>q.who==="e"&&q.st==="go");return x?"ADX round":"In the MCC";}

/* ---------- RELIAB: rounds, vibration, ADX, drives, actions ---------- */
function rlyBuild(b){
  b.appendChild(kEl("div","dcsctl",`<div class="dcssub">This shift's rounds</div><div class="qcsv" id="rlyTop"></div><div class="rlyrd" id="rlyRd"></div>`));
  b.appendChild(kEl("div","dcsctl",`<div class="dcssub">Equipment · tap a row for its readings</div><div class="qtab rlytab" id="rlyTab"></div>`));
  b.appendChild(kEl("div","dcsctl rlydet",`<div id="rlyDet"></div>`));
  b.appendChild(kEl("p","dcsfield",`Every maintenance tech does one vibration round a shift (two machines, the most overdue first) and the electrical tech one ADX motor-test round, unless they're called to an upset first: then the round is skipped. Readings go grey after a day and Unknown after three. A round that finds a failing bearing or motor shows it here: plan the repair before it fails. More maintenance techs (Upgrades → Maintenance) means more rounds.`));
  const el=$("dcsOv");if(el&&!el._rly){el._rly=1;el.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-rsel],[data-rpin],[data-rfix],[data-rchg]");if(!t)return;
    if(t.dataset.rsel){RUI.sel=t.dataset.rsel;}
    else if(t.dataset.rpin){const [id,k]=t.dataset.rpin.split(":");rlyPin(id,k);}
    else if(t.dataset.rfix){const [id,k]=t.dataset.rfix.split(":");if(rlyFix(id,k))AUDIO.sfx("cash",120);}
    else if(t.dataset.rchg){const [id,k]=t.dataset.rchg.split(":");rlyChg(id,k);}
    RUI.key="";rlyRefresh();});}}
function rlyVibCell(a){const v=a.lv,g=rlyAge(v);if(!v||g.cls==="unk")return rlyChip("Unknown","unk",v?"last "+g.txt+" ago":"never measured");
  const s=VIBST[v.st];return rlyChip(s[0],g.cls==="stale"?"stale":s[1],`${v.v} mm/s · ${g.txt} ago`);}
function rlyAdxCell(a){const v=a.la,g=rlyAge(v);if(!v||g.cls==="unk")return rlyChip("Unknown","unk",v?"last "+g.txt+" ago":"never tested");
  const s=ADXST[v.st];return rlyChip(s[0],g.cls==="stale"?"stale":s[1],`health ${v.h}% · ${g.txt} ago`);}
function rlyRefresh(){const tb=$("rlyTab");if(!tb)return;const R=rlyState(),D=R.rd,on=rlyOn(),r=knobRead();
  // the shift: rounds planned, walking, done, skipped
  const vib=D.list.filter(x=>x.k==="vib"),adx=D.list.filter(x=>x.k==="adx"),n=st=>x=>x.st===st,awaiting=ASSETS.filter(A=>{const a=R.a[A.id];return (a.lv&&a.lv.st==="imm"&&rlyPend(A.id,"vib"))||(a.la&&a.la.st==="imm"&&rlyPend(A.id,"adx"));}).length;
  const H=R.hist.slice(-14),hv=H.reduce((s,x)=>s+x.vd,0),hn=H.reduce((s,x)=>s+x.vn,0),ha=H.reduce((s,x)=>s+x.ad,0),han=H.reduce((s,x)=>s+x.an,0);
  const top=on?`<div><small>Vibration rounds</small><b>${vib.filter(n("done")).length} / ${vib.length}</b><small>${vib.filter(x=>x.st==="skip"||x.st==="abandon").length} skipped this shift</small></div>
    <div><small>ADX motor tests</small><b>${adx.filter(n("done")).length} / ${adx.length}</b><small>${adx.filter(x=>x.st==="skip"||x.st==="abandon").length?"skipped this shift":"electrical tech"}</small></div>
    <div><small>Last 7 days</small><b>${hn+han?Math.round((hv+ha)/(hn+han)*100):"–"} %</b><small>of rounds done</small></div>
    <div${awaiting?' class="qout"':""}><small>Faults found</small><b>${awaiting}</b><small>${awaiting?"plan the repair below":"none waiting"}</small></div>
    <div><small>This run</small><b>${R.caught} caught</b><small>${R.fails} failure${R.fails===1?"":"s"}</small></div>`:`<div><small>Rounds</small><b>–</b><small>${S.zen?"not in zen mode":"start a run"}</small></div>`;
  {const e=$("rlyTop");if(e&&e._h!==top){e._h=top;e.innerHTML=top;}}
  const rd=on?D.list.map(x=>{const w=rlyWho(x),k=x.k==="vib"?"Vibration":"ADX",when=clockOf(x.t0),
      what=x.st==="plan"?`<em>${when}</em>`:x.st==="go"?`<em class="ok">walking: ${x.a.map(id=>ASSETN[id].n).join(", ")}</em>`:x.st==="done"?`<em>done: ${x.a.map(id=>ASSETN[id].n).join(", ")||"nothing due"}</em>`:`<em class="bad">${x.st==="abandon"?"abandoned":"skipped"}: ${x.why}</em>`;
      return `<div class="rrd ${x.st}"><b>${k}</b><span>${escHTML(w)}</span>${what}</div>`;}).join(""):"";
  {const e=$("rlyRd");if(e&&e._h!==rd){e._h=rd;e.innerHTML=rd;}}
  // the table
  const outg=!!(S.outg&&S.season&&S.season.on&&!S.free);
  const rows=ASSETS.map(A=>{const a=R.a[A.id],L=Math.max(0,rlyLoad(A.id,r)),st=rlyDrvSt(A.id,L),c=R.chg[A.id]||{},cq=Object.keys(c).map(k=>RLY.plan[k].n).join(", ");
    const dcls={fault:"bad",trip:"bad",run:L>100?"bad":L>95?"warn":"ok",idle:"",off:""}[st];
    return `<tr data-rsel="${A.id}" class="${RUI.sel===A.id?"cur":""}"><td><b>${A.n}</b><small>${LINEN[A.ln][2]}${a.pin?` · next ${a.pin==="vib"?"vibration":"ADX"} round`:""}</small></td><td>${rlyVibCell(a)}</td><td>${rlyAdxCell(a)}</td>
      <td>${rlyChip(st==="fault"?"Fault":st==="trip"?"Tripped":st==="off"?"Off":Math.round(L)+" %",dcls,st==="run"?Math.round(rlyTemp(A.id,L))+" °C":st==="idle"?"idle":"")}</td>${outg?`<td>${cq?`<small class="rbk">${cq}</small>`:"<small>–</small>"}</td>`:""}</tr>`;}).join("");
  const h=`<table><thead><tr><th>Equipment</th><th>Vibration</th><th>ADX motor</th><th>Drive</th>${outg?"<th>Next outage</th>":""}</tr></thead><tbody>${rows}</tbody></table>`;
  if(tb._h!==h){tb._h=h;tb.innerHTML=h;}
  // the selected asset
  const A=ASSETN[RUI.sel],a=R.a[RUI.sel],dt=$("rlyDet");if(!A||!dt)return;
  const v=a.lv,x=a.la,vg=rlyAge(v),xg=rlyAge(x),vimm=v&&v.st==="imm"&&vg.cls!=="unk"&&rlyPend(A.id,"vib"),ximm=x&&x.st==="imm"&&xg.cls!=="unk"&&rlyPend(A.id,"adx"),busy=!!rlyIncOf(A.id);
  const hist=(L,f)=>L.length?`<div class="rhist">${L.slice().reverse().map(f).join("")}</div>`:"";
  const c=R.chg[A.id]||{},booked=S.outg&&S.outg.plan&&S.outg.plan.rly&&S.outg.plan.rly[A.id];
  const chg=!outg?`<p class="dcsfield">Changeouts are booked for planned outages; ${S.free?"free play has none":"there are none in this mode"}.</p>`:
    `<div class="rchg">${["b","m","d"].map(k=>`<button type="button" data-rchg="${A.id}:${k}" aria-pressed="${!!c[k]}"><b>${RLY.plan[k].n}</b><small>${money(RLY.plan[k].cost)} · +${RLY.plan[k].min} min</small></button>`).join("")}</div>
     <p class="dcsfield">${booked?`Booked for outage ${S.outg.k}: ${Object.keys(booked).map(k=>RLY.plan[k].n.toLowerCase()).join(", ")}. `:""}Ticked items go on the next outage plan (24 h before it) and are paid when you approve it. New parts come back at full health.</p>`;
  const L=Math.max(0,rlyLoad(A.id,r)),st=rlyDrvSt(A.id,L);
  const det=`<div class="rdh"><b>${A.n}</b><small>${LINEN[A.ln][1]} (${LINEN[A.ln][2]}) · ${A.kw.toLocaleString()} kW VFD · if it fails: ${A.stop.toLowerCase().replace(/\.$/,"")}</small></div>
    <div class="rdg"><section class="plsec"><div class="dcssub">Vibration (maintenance)</div>${rlyVibCell(a)}<p class="dcsfield">${v&&vg.cls!=="unk"?VIBST[v.st][2]+".":"No recent reading: the last rounds didn't get to it, or were skipped."}</p>
      ${hist(a.hv,([t,mm,s])=>`<div><span>${dhm(t)}</span><em class="${VIBST[s][1]}">${mm} mm/s · ${VIBST[s][0]}</em></div>`)}
      <div class="ract"><button type="button" class="kstd" data-rpin="${A.id}:vib" aria-pressed="${a.pin==="vib"}"${on?"":" disabled"}>${a.pin==="vib"?"Pinned for the next round":"Pin to the next vibration round"}</button>
      ${vimm?`<button type="button" class="rfix" data-rfix="${A.id}:vib"${busy?" disabled":""}>Plan repair · ${money(rlyFixCost(A.id,"vib"))}<small>change the bearing now, no downtime</small></button>`:""}</div></section>
    <section class="plsec"><div class="dcssub">ADX motor test (electrical)</div>${rlyAdxCell(a)}<p class="dcsfield">${x&&xg.cls!=="unk"?(x.st==="good"?"Winding, insulation and rotor all healthy.":`Finding: ${ADXMODE[a.am]}.`):"No recent test."}</p>
      ${hist(a.ha,([t,hh,s])=>`<div><span>${dhm(t)}</span><em class="${ADXST[s][1]}">health ${hh}% · ${ADXST[s][0]}</em></div>`)}
      <div class="ract"><button type="button" class="kstd" data-rpin="${A.id}:adx" aria-pressed="${a.pin==="adx"}"${on?"":" disabled"}>${a.pin==="adx"?"Pinned for the next test":"Pin to the next ADX test"}</button>
      ${ximm?`<button type="button" class="rfix" data-rfix="${A.id}:adx"${busy?" disabled":""}>Plan repair · ${money(rlyFixCost(A.id,"adx"))}<small>swap in the spare motor now, no downtime</small></button>`:""}</div></section>
    <section class="plsec"><div class="dcssub">Drive</div>${rlyChip(st==="fault"?"Fault":st==="trip"?"Tripped":st==="off"?"Off":Math.round(L)+" % load",{fault:"bad",trip:"bad",run:L>100?"bad":L>95?"warn":"ok"}[st]||"",st==="run"||st==="idle"?Math.round(rlyTemp(A.id,L))+" °C heat sink":"")}
      <p class="dcsfield">Drives fail without warning. Keep them under about 95% load; lightning and brownouts shorten their lives. <button type="button" class="linkb" data-trk="dl_${A.id}">Trend its load</button></p></section></div>
    <div class="dcssub">Changeout at the next planned outage</div>${chg}`;
  const key=det;if(dt._h!==key){if(!dt.contains(document.activeElement)||RUI.key===""){dt._h=key;dt.innerHTML=det;}}RUI.key="x";}

/* ---------- the outage plan: changeouts ---------- */
G3.rlyPlanMount=function(host,paint){if(!host)return;if(!rlyOn()||!S.rel){host.innerHTML="";return;}const R=S.rel;
  const draw=()=>{const flag=ASSETS.filter(A=>{const a=R.a[A.id],v=a.lv,x=a.la;return R.chg[A.id]||(v&&v.st!=="good"&&S.t-v.t<RLY.unknown)||(x&&x.st!=="good"&&S.t-x.t<RLY.unknown)||!v||S.t-v.t>RLY.unknown;});
    const show=host._all?ASSETS:flag,t=rlyPlanTally(R.chg);
    host.innerHTML=`<div class="prep rplan"><div class="phead"><b>Equipment changeouts</b><span>${t.n?`${t.n} booked · ${money(t.c)} · +${t.m} min`:"none booked"}</span></div>
      <div class="psub">From the Reliability screen: what the rounds flagged, and anything not measured lately. New parts come back at full health; each adds time to the outage (at most ${RLY.planCap} min).</div>
      ${show.map(A=>{const a=R.a[A.id],c=R.chg[A.id]||{},v=a.lv,x=a.la,ag=rlyAge(v);const why=!v||ag.cls==="unk"?"vibration unknown":VIBST[v.st][0].toLowerCase()+(x?" · ADX "+ADXST[x.st][0].toLowerCase():"");
        return `<div class="prow"><div><b>${A.n}</b><small>${why}</small></div><div class="pact"><div class="seg">${["b","m","d"].map(k=>`<button type="button" data-rpc="${A.id}:${k}" aria-pressed="${!!c[k]}">${RLY.plan[k].n} ${money(RLY.plan[k].cost)}</button>`).join("")}</div></div></div>`;}).join("")||`<div class="prow"><small>Nothing flagged. Every machine measured lately reads good.</small></div>`}
      <button type="button" class="linkb" data-rpall>${host._all?"Show only what's flagged":"Show all ten"}</button></div>`;
    host.querySelectorAll("[data-rpc]").forEach(b=>b.addEventListener("click",()=>{const [id,k]=b.dataset.rpc.split(":");rlyChg(id,k);draw();if(paint)paint();}));
    const all=host.querySelector("[data-rpall]");if(all)all.addEventListener("click",()=>{host._all=!host._all;draw();});};
  draw();};
