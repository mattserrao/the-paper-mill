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
  b.appendChild(kEl("div","mimicw drvsl",`<svg viewBox="0 0 640 150" class="mimic" role="img" aria-label="Single-line diagram"><g id="drvSL"></g></svg>`));
  b.appendChild(kEl("div","drvw",`<div class="qcsv" id="drvTop"></div><div id="drvL"></div>`));
  b.appendChild(kEl("p","dcsfield","Load is the drive's output against its rated power. Tap a load to trend it (a marked bar is on the trend). Over about 95% a drive trips more often; over 100% it also wears its motor and bearings faster. A tripped drive reads zero until the electrical tech changes it."));}
function drvRefresh(){const el=$("drvL");if(!el)return;const r=knobRead(),R=S.rel,pens=trPens();let kw=0,run=0,flt=0;const al=[];
  if(rlyBlack())al.push(["LOSS OF SUPPLY · 13.8 kV FEEDER DEAD",true]);else if(active("brownout"))al.push([`BROWNOUT · FEEDER ${rlyMV().toFixed(1)} kV`,false]);
  const rows=LINEUPS.map(([ln,name,tag])=>{const list=ASSETS.filter(A=>A.ln===ln).map(A=>{const L=Math.max(0,rlyLoad(A.id,r)),st=rlyDrvSt(A.id,L),T=rlyTemp(A.id,L);kw+=L/100*A.kw;if(st==="run")run++;if(st==="fault"||st==="trip"||st==="nodc")flt++;
      if(st==="nodc"){}else if(st==="fault")al.push([`DRIVE FAULT · ${A.n.toUpperCase()}`,true]);else if(st==="trip")al.push([`MOTOR TRIPPED · ${A.n.toUpperCase()}`,true]);
      else if(L>100)al.push([`DRIVE OVERLOAD · ${A.n.toUpperCase()} ${Math.round(L)}%`,L>110]);else if(L>95)al.push([`DRIVE LOAD HI · ${A.n.toUpperCase()}`,false]);
      if(T>72)al.push([`DRIVE TEMP HI · ${A.n.toUpperCase()} ${Math.round(T)} °C`,T>78]);
      const cls=L>100?"bad":L>95?"warn":"",stc={run:"ok",idle:"",off:"",lock:"warn",fault:"bad",trip:"bad",nodc:"bad"}[st],stn={run:"RUN",idle:"IDLE",off:"OFF · OUTAGE",lock:"LOCKED OUT · REPAIR",fault:"FAULT",trip:"TRIPPED",nodc:"NO DC"}[st];
      return `<tr><td><b>${A.n}</b><small>${A.kw.toLocaleString()} kW VFD</small></td><td><span class="dst ${stc}">${stn}</span></td>
        <td><button type="button" class="dbar trk${pens.includes("dl_"+A.id)?" on":""}" data-trk="dl_${A.id}" aria-pressed="${pens.includes("dl_"+A.id)}" title="${pens.includes("dl_"+A.id)?"Trended: tap to stop":"Tap to trend"} ${A.n} drive load"><i style="width:${clamp(L,0,130)/1.3}%" class="${cls}"></i><em>${Math.round(L)} %</em></button></td><td class="${T>72?"bad":""}">${Math.round(T)} °C</td><td class="${R.a[A.id].dh<40?"bad":R.a[A.id].dh<60?"warn":""}">${Math.round(R.a[A.id].dh)}%${R.a[A.id].patch?" · patched":""}</td></tr>`;}).join("");
    if(rlyRectDown(ln))al.push([`${tag} RECTIFIER FAULT · DC BUS DOWN`,true]);
    return `<section class="plsec"><div class="dcssub">${tag} · ${name} · DC bus ${Math.round(rlyDC(ln))} V · rectifier health ${Math.round(R.rf[ln])}%</div><table><thead><tr><th>Drive</th><th>Status</th><th>Load</th><th>Heat sink</th><th>Health</th></tr></thead><tbody>${list}</tbody></table></section>`;}).join("");
  const h=`<section class="plsec drvsub"><div class="dcssub">Power</div><p class="dcsfield">${outOn()?"Planned outage: the lineups are locked out and tested dead.":rlyBlack()?"<span class=\"bad\">Blackout: no power from the substation.</span>":active("brownout")?"The utility has cut the mill back (brownout): the feeder sags 8%.":"115 kV from the utility, 13.8 kV across the site, 480 V into the rectifiers, about 650 V DC to the drives."}</p></section>`+rows;
  drvSL();
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
  b.appendChild(kEl("p","dcsfield",`Every maintenance tech does one vibration round a shift (one machine, the most overdue first) and the electrical tech one ADX motor-test round, unless they're called to an upset first: then the round is skipped. Readings go gray after a day and Unknown after three. A round that finds a failing bearing or motor shows it here: plan the repair before it fails. More maintenance techs (Upgrades → Maintenance) means more rounds.`));
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
      what=x.st==="plan"?`<em>${when}</em>`:x.st==="go"?`<em class="ok">walking: ${x.a.map(id=>ASSETN[id].n).join(", ")}</em>`:x.st==="done"?`<em>done: ${x.a.map(id=>ASSETN[id].n).join(", ")||"nothing due"}</em>`:x.st==="out"?`<em>not run: planned outage</em>`:`<em class="bad">${x.st==="abandon"?"abandoned":"skipped"}: ${x.why}</em>`;
      return `<div class="rrd ${x.st}"><b>${k}</b><span>${escHTML(w)}</span>${what}</div>`;}).join(""):"";
  {const e=$("rlyRd");if(e&&e._h!==rd){e._h=rd;e.innerHTML=rd;}}
  // the table
  const outg=!!(S.outg&&S.season&&S.season.on&&!S.free);
  const rows=ASSETS.map(A=>{const a=R.a[A.id],L=Math.max(0,rlyLoad(A.id,r)),st=rlyDrvSt(A.id,L),c=R.chg[A.id]||{},bk=(S.outg&&S.outg.plan&&S.outg.plan.rly&&S.outg.plan.rly[A.id])||{},cq=[...Object.keys(bk).map(k=>RLY.plan[k].n+" ✓"),...Object.keys(c).map(k=>RLY.plan[k].n+(Object.keys(bk).length?" (after)":""))].join(", ");
    const dcls={fault:"bad",trip:"bad",nodc:"bad",lock:"warn",run:L>100?"bad":L>95?"warn":"ok",idle:"",off:""}[st];
    return `<tr data-rsel="${A.id}" class="${RUI.sel===A.id?"cur":""}"><td><b>${A.n}</b><small>${LINEN[A.ln][2]}${a.pin?` · next ${a.pin==="vib"?"vibration":"ADX"} round`:""}</small></td><td>${rlyVibCell(a)}</td><td>${rlyAdxCell(a)}</td>
      <td>${rlyChip(st==="fault"?"Fault":st==="trip"?"Tripped":st==="nodc"?"No DC":st==="lock"?"Locked out":st==="off"?"Off":Math.round(L)+" %",dcls,st==="run"?Math.round(rlyTemp(A.id,L))+" °C":st==="idle"?"idle":"")}</td>${outg?`<td>${cq?`<small class="rbk">${cq}</small>`:"<small>–</small>"}</td>`:""}</tr>`;}).join("");
  const h=`<table><thead><tr><th>Equipment</th><th>Vibration</th><th>ADX motor</th><th>Drive</th>${outg?"<th>Next outage</th>":""}</tr></thead><tbody>${rows}</tbody></table>`;
  if(tb._h!==h){tb._h=h;tb.innerHTML=h;}
  // the selected asset
  const A=ASSETN[RUI.sel],a=R.a[RUI.sel],dt=$("rlyDet");if(!A||!dt)return;
  const v=a.lv,x=a.la,vg=rlyAge(v),xg=rlyAge(x),vimm=v&&v.st==="imm"&&vg.cls!=="unk"&&rlyPend(A.id,"vib"),ximm=x&&(x.st==="imm"&&rlyPend(A.id,"adx")||x.st==="alarm")&&xg.cls!=="unk",busy=!!rlyIncOf(A.id)||active(rlyFixEv.vib)||active(rlyFixEv.adx),fm=`machine down ${RLY.fixMin[0]}–${RLY.fixMin[1]} min`;
  const hist=(L,f)=>L.length?`<div class="rhist">${L.slice().reverse().map(f).join("")}</div>`:"";
  const c=R.chg[A.id]||{},booked=S.outg&&S.outg.plan&&S.outg.plan.rly&&S.outg.plan.rly[A.id];
  const chg=!outg?`<p class="dcsfield">Changeouts are booked for planned outages; ${S.free?"free play has none":"there are none in this mode"}.</p>`:
    `<div class="rchg">${["b","m","d"].map(k=>`<button type="button" data-rchg="${A.id}:${k}" aria-pressed="${!!c[k]}"><b>${RLY.plan[k].n}</b><small>${moneyX(RLY.plan[k].cost)} · +${RLY.plan[k].min} min</small></button>`).join("")}</div>
     <p class="dcsfield">${booked?`Booked for outage ${S.outg.k}: ${Object.keys(booked).map(k=>RLY.plan[k].n.toLowerCase()).join(", ")}. `:""}${booked?"That plan is approved; ticked items go on the plan for the outage after it.":"Ticked items go on the next outage plan (24 h before it) and are paid when you approve it."} New parts come back at full health.</p>`;
  const L=Math.max(0,rlyLoad(A.id,r)),st=rlyDrvSt(A.id,L);
  const det=`<div class="rdh"><b>${A.n}</b><small>${LINEN[A.ln][1]} (${LINEN[A.ln][2]}) · ${A.kw.toLocaleString()} kW VFD · if it fails: ${A.stop.toLowerCase().replace(/\.$/,"")}</small></div>
    <div class="rdg"><section class="plsec"><div class="dcssub">Vibration (maintenance)</div>${rlyVibCell(a)}<p class="dcsfield">${v&&vg.cls!=="unk"?VIBST[v.st][2]+".":"No recent reading: the last rounds didn't get to it, or were skipped."}</p>
      ${hist(a.hv,([t,mm,s])=>s==="fix"?`<div><span>${dhm(t)}</span><em class="ok">Repaired · new bearing</em></div>`:`<div><span>${dhm(t)}</span><em class="${VIBST[s][1]}">${mm} mm/s · ${VIBST[s][0]}</em></div>`)}
      <div class="ract"><button type="button" class="kstd" data-rpin="${A.id}:vib" aria-pressed="${a.pin==="vib"}"${on?"":" disabled"}>${a.pin==="vib"?"Pinned for the next round":"Pin to the next vibration round"}</button>
      ${vimm?`<button type="button" class="rfix" data-rfix="${A.id}:vib"${busy?" disabled":""}>Plan repair · ${moneyX(rlyFixCost(A.id,"vib"))}<small>change the bearing now: ${fm}</small></button>`:""}</div></section>
    <section class="plsec"><div class="dcssub">ADX motor test (electrical)</div>${rlyAdxCell(a)}<p class="dcsfield">${x&&xg.cls!=="unk"?(x.st==="good"?"Winding, insulation and rotor all healthy.":`Finding: ${ADXMODE[a.am]}.`):"No recent test."}</p>
      ${hist(a.ha,([t,hh,s])=>s==="fix"?`<div><span>${dhm(t)}</span><em class="ok">Repaired · spare motor fitted</em></div>`:`<div><span>${dhm(t)}</span><em class="${ADXST[s][1]}">health ${hh}% · ${ADXST[s][0]}</em></div>`)}
      <div class="ract"><button type="button" class="kstd" data-rpin="${A.id}:adx" aria-pressed="${a.pin==="adx"}"${on?"":" disabled"}>${a.pin==="adx"?"Pinned for the next test":"Pin to the next ADX test"}</button>
      ${ximm?`<button type="button" class="rfix" data-rfix="${A.id}:adx"${busy?" disabled":""}>${x&&x.st==="alarm"?"Swap the motor early":"Plan repair"} · ${moneyX(rlyFixCost(A.id,"adx"))}<small>swap in the spare motor now: ${fm}</small></button>`:""}</div></section>
    <section class="plsec"><div class="dcssub">Drive</div>${rlyChip(st==="fault"?"Fault":st==="trip"?"Tripped":st==="nodc"?"No DC":st==="lock"?"Locked out":st==="off"?"Off":Math.round(L)+" % load",{fault:"bad",trip:"bad",nodc:"bad",lock:"warn",run:L>100?"bad":L>95?"warn":"ok"}[st]||"",st==="run"||st==="idle"?Math.round(rlyTemp(A.id,L))+" °C heat sink":"")}
      <p class="dcsfield">Drive health <b>${Math.round(a.dh)}%</b>${a.patch?" · patched (faults 3× as often until replaced)":""}${rlyRst(A.id)?` · ${rlyRst(A.id)} reset${rlyRst(A.id)>1?"s":""} in the last day`:""}. Drives fail without warning. Keep them under about 95% load; lightning and brownouts shorten their lives. <button type="button" class="linkb" data-trk="dl_${A.id}">Trend its load</button></p></section></div>
    <div class="dcssub">${booked?"Changeout at the outage after":"Changeout at the next planned outage"}</div>${chg}`;
  const key=det;if(dt._h!==key){if(!dt.contains(document.activeElement)||RUI.key===""){dt._h=key;dt.innerHTML=det;}}RUI.key="x";}

/* ---------- the outage plan: changeouts ---------- */
G3.rlyPlanMount=function(host,paint){if(!host)return;if(!rlyOn()||!S.rel){host.innerHTML="";return;}const R=S.rel;
  const draw=()=>{const flag=ASSETS.filter(A=>{const a=R.a[A.id],v=a.lv,x=a.la;return R.chg[A.id]||(v&&v.st!=="good"&&S.t-v.t<RLY.unknown)||(x&&x.st!=="good"&&S.t-x.t<RLY.unknown)||!v||S.t-v.t>RLY.unknown;});
    const show=host._all?ASSETS:flag,t=rlyPlanTally(R.chg);
    host.innerHTML=`<div class="prep rplan"><div class="phead"><b>Equipment changeouts</b><span>${t.n?`${t.n} booked · ${moneyX(t.c)} · +${t.m} min`:"none booked"}</span></div>
      <div class="psub">From the Reliability screen: what the rounds flagged, and anything not measured lately. New parts come back at full health; each adds time to the outage (at most ${RLY.planCap} min).</div>
      ${show.map(A=>{const a=R.a[A.id],c=R.chg[A.id]||{},v=a.lv,x=a.la,ag=rlyAge(v);const why=!v||ag.cls==="unk"?"vibration unknown":VIBST[v.st][0].toLowerCase()+(x?" · ADX "+ADXST[x.st][0].toLowerCase():"");
        return `<div class="prow"><div><b>${A.n}</b><small>${why}</small></div><div class="pact rtog">${["b","m","d"].map(k=>`<button type="button" class="rtg" data-rpc="${A.id}:${k}" aria-pressed="${!!c[k]}"><i aria-hidden="true"></i>${RLY.plan[k].n} ${moneyX(RLY.plan[k].cost)}</button>`).join("")}</div></div>`;}).join("")||`<div class="prow"><small>Nothing flagged. Every machine measured lately reads good.</small></div>`}
      <button type="button" class="linkb" data-rpall>${host._all?"Show only what's flagged":"Show all ten"}</button></div>`;
    host.querySelectorAll("[data-rpc]").forEach(b=>b.addEventListener("click",()=>{const [id,k]=b.dataset.rpc.split(":");rlyChg(id,k);draw();if(paint)paint();}));
    const all=host.querySelector("[data-rpall]");if(all)all.addEventListener("click",()=>{host._all=!host._all;draw();});};
  draw();};

// the single-line diagram: utility -> substation transformer -> 13.8 kV feeder -> MCC transformer -> rectifiers -> DC buses -> drives
function drvSL(){const g=$("drvSL");if(!g)return;const mv=rlyMV(),lv=rlyLV(),blk=mv<=0,c=on=>on?"#4fd18b":"#ff6b5e",t=(x,y,s,cl,a)=>`<text x="${x}" y="${y}" class="mtg" style="text-anchor:${a||"start"}${cl?`;fill:${cl}`:""}">${s}</text>`;
  const xf=(x,y,on)=>`<circle cx="${x}" cy="${y-7}" r="9" fill="none" stroke="${c(on)}" stroke-width="2"/><circle cx="${x}" cy="${y+7}" r="9" fill="none" stroke="${c(on)}" stroke-width="2"/>`;
  let h=`<path d="M18 40 H62" stroke="${c(!blk)}" stroke-width="3"/>`+t(18,28,"UTILITY")+t(18,58,`${blk?0:PWR.util} kV`,"");
  h+=xf(76,40,!blk)+t(76,72,"SUBSTATION","","middle")+t(76,84,"115/13.8 kV","","middle");
  h+=`<path d="M90 40 H232" stroke="${c(!blk)}" stroke-width="3"/>`+t(160,30,`FEEDER ${mv.toFixed(1)} kV`,"","middle");
  h+=xf(246,40,!blk)+t(246,72,"MCC XFMR","","middle")+t(246,84,"13.8 kV/480 V","","middle");
  h+=`<path d="M260 40 H300 M300 40 V125" stroke="${c(!blk)}" stroke-width="3"/>`+t(282,30,`${Math.round(lv)} V`,"","middle");
  LINEUPS.forEach(([ln,,tag],k)=>{const y=28+k*45,dc=rlyDC(ln),ok=dc>0;
    h+=`<path d="M300 ${y} H340" stroke="${c(!blk)}" stroke-width="2"/><rect x="340" y="${y-12}" width="42" height="24" rx="3" fill="#1c2b45" stroke="${c(ok)}" stroke-width="2"/>${t(361,y+4,"AC/DC","","middle")}
      <path d="M382 ${y} H470" stroke="${c(ok)}" stroke-width="4"/>${t(426,y-6,`DC ${Math.round(dc)} V`,"","middle")}${t(476,y+4,(n=>tag+" · "+n+(n===1?" drive":" drives"))(ASSETS.filter(A=>A.ln===ln).length),"")}`;});
  if(g._h!==h){g._h=h;g.innerHTML=h;}}

/* ---------- v6.10 the drive fault card: reset and go, or investigate (then run to the outage or replace) ---------- */
let rlyCardEl=null;
function rlyCardOpen(){const R=S.rel,q=R&&R.cur;if(!q)return;const inc=rlyDrvInc(q.a),A=ASSETN[q.a];if(!inc||!A||(q.step==="fault"&&inc.stage!=="wait")||(q.step==="found"&&inc.stage!=="found")){R.cur=null;return;}
  if(G3.yieldUI)G3.yieldUI();running=false;S.cards.open={rly:true};
  if(!rlyCardEl){rlyCardEl=document.createElement("div");rlyCardEl.className="overlay";rlyCardEl.id="rlyOv";rlyCardEl.hidden=true;document.body.appendChild(rlyCardEl);}
  const a=R.a[q.a],p=rlyRepOdds(q.a),cz=DRVCAUSE.find(x=>x[0]===inc.cause),b=RLY.drvBill*P.repairMul,stop=A.stop.replace(/\.$/,"").toLowerCase();
  const n=rlyRst(q.a),pf=rlyRstFail(q.a),rm=rlyRstMin(q.a);
  const ch=q.step==="fault"?[...(inc.noReset?[]:[["reset","Reset and go",`Back in about ${rm} minutes${n?` (reset ${n+1} today: each one takes longer and wears the drive more)`:""}. At ${Math.round(a.dh)}% health it faults again within a day ${Math.round(p*100)}% of the time${pf>0?`, and ${Math.round(pf*100)}% of the time the reset won't hold at all`:""}. A repeat fault takes 50% longer to sort out.`,"free"]]),
      ["inv","Investigate","The electrical tech pulls the fault log and meters the drive: 45–90 minutes down, then you know the cause and choose to run it to the outage or replace it.",moneyX(2e3)]]
    :[["patch","Run it to the outage",`Patched and back in about 15 minutes. Until it's replaced it faults ${RLY.patch}× as often; the drive replacement is ticked on the next outage plan.`,moneyX(4e3)],
      ["repl","Replace it now","Fit the spare drive from the MCC rack: 60–90 more minutes down, and the drive is new.",moneyX(b)]];
  rlyCardEl.innerHTML=`<div class="modal deal civ" role="dialog" aria-modal="true" aria-labelledby="rly-h"><span class="dk">${q.step==="fault"?"Drive fault":"Investigated"} · ${LINEN[A.ln][2]} · paused</span>
    <h2 id="rly-h">${A.n} drive${inc.rep&&q.step==="fault"?": faulted again":""}</h2>
    <p>${q.step==="fault"?inc.noReset?`The ${A.n} drive's reset didn't hold; ${stop}. It has to be investigated now.`:`The ${A.n} drive tripped and is showing a fault; ${stop}. Reset it and see, or find out why first?`:`Found: <b>${cz?cz[1]:"a worn drive"}</b>. ${cz?cz[2].charAt(0).toUpperCase()+cz[2].slice(1)+".":""}`}</p>
    <p class="cvrly"><b>Reliability data</b> drive health ${Math.round(a.dh)}% · load ${Math.round(inc.load||0)}% when it tripped${a.patch?" · already patched once":""}</p>
    <div class="civch">${ch.map(([k,n,d,c],i)=>`<button type="button" class="civbtn" data-rc="${k}"><span class="cvl">${"AB"[i]}</span><span class="cvb"><b>${n}</b><span class="cvrow"><span class="cvcost${c==="free"?" free":""}">${c}</span></span><small>${d}</small></span></button>`).join("")}</div></div>`;
  rlyCardEl.querySelectorAll("[data-rc]").forEach(btn=>btn.addEventListener("click",()=>{const inc2=rlyDrvInc(q.a);rlyCardEl.hidden=true;R.cur=null;S.cards.open=null;if(inc2)rlyDecide(inc2,btn.dataset.rc,false);
    const menu=document.getElementById("v2menu");running=!(menu&&!menu.hidden);}));
  rlyCardEl.hidden=false;AUDIO.sfx("cash",150);const f=rlyCardEl.querySelector(".civbtn");if(f)f.focus({preventScroll:true});}
UI_TICKS.push(()=>{const R=S&&S.rel,done=!S||S.over||(S.season&&S.season.done);if(rlyCardEl&&!rlyCardEl.hidden&&(done||!R||!R.cur)){rlyCardEl.hidden=true;if(S&&S.cards&&S.cards.open&&S.cards.open.rly)S.cards.open=null;}   // (game over or a new game: no stale card)
  if(!R||!R.q||done)return;
  if(R.cur&&!(S.cards&&S.cards.open)){rlyCardOpen();return;}   // (a reload: the card comes back)
  if(!R.cur&&R.q.length&&S.cards&&!S.cards.open&&!(S.civ&&(S.civ.cur||S.civ.pending))&&!S.over){R.cur=R.q.shift();rlyCardOpen();}
  if(rlyCardEl&&!rlyCardEl.hidden&&!R.cur){rlyCardEl.hidden=true;if(S.cards&&S.cards.open&&S.cards.open.rly)S.cards.open=null;}});
