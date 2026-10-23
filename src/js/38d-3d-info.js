  /* ---- v6.10 click for info: tap a person, a vehicle or a piece of equipment for a small pop-up with who or what it is
     and what it's doing, live. Picked in screen space: every candidate's anchor point is projected and the nearest one
     inside a few pixels wins (people and vehicles before equipment, nearer the camera first). The game keeps running;
     the pop-up refreshes with the UI tick and closes on a tap elsewhere, ✕ or Escape. Read-only on the sim. ---- */
  const INFO={el:null,cur:null,key:""};G3.INFO=INFO;
  const _iv=new THREE.Vector3();
  const team=p=>p&&p.team?`${p.team} team`:"";
  const hatDot=p=>p&&p.team?`<i class="manhat" style="background:${MAN.HAT[p.team]}"></i>`:"";
  // who a figure is, from the manning model (03f): the person on shift in that seat (covering if someone's on vacation)
  function personRow(kind,k){const m=manNow();if(kind==="t")return m.techs[k];if(kind==="e")return m.elec;return m.ops[k];}
  function techDoing(T){if(T.inc){const i=S.inc.find(x=>x.id===T.inc);return T.state==="walk"?`working on: ${EV[T.inc].name.toLowerCase()}`:`on the way to: ${EV[T.inc].name.toLowerCase()}`+(i&&i.asset?` (${ASSETN[i.asset].n})`:"");}
    if(T.rnd)return T.state==="walk"?`vibration round: measuring the ${ASSETN[T.rnd].n} bearings`:`vibration round: heading to the ${ASSETN[T.rnd].n}`;
    if(T.state==="home2"||T.state==="back"||T.state==="inside")return "heading back to the shop";if(T.state==="chase"||T.state==="cmount")return "chasing a runner out of the hall";return "in the shop: bench work";}
  function elecDoing(){const j=S.inc.find(i=>ENEED(i.id)&&i.eSlot===0);if(j){const w=j.eGo?"working on":"on the way to";
      if(j.id==="drivefail")return `${j.eGo&&j.stage==="inv"?"reading the fault log on":w} the ${ASSETN[j.asset].n} drive`;if(j.id==="rectfail")return `${w} the ${LINEN[j.line][2]} rectifier`;
      if(j.id==="motorfail")return `${w} the ${ASSETN[j.asset].n} motor`;return `${w}: ${EV[j.id].name.toLowerCase()} (resetting the main breaker)`;}
    const R=S.rel,x=R&&R.rd.list.find(q=>q.who==="e"&&q.st==="go");if(x)return `ADX round: testing the ${x.a.map(a=>ASSETN[a].n).join(" and ")} motors`;
    return "in the MCC: paperwork and drive checks";}
  function opDoing(k){if(S.pm==="break"&&k<7)return working("brk")?"rethreading the sheet":"heading to the break";if(S.wd==="hayout"&&k<7)return "cleaning up the hayout";
    if(k>=7)return S.M&&S.M.pulperDown?"stock prep: waiting on the pulper":"stock prep: watching the pulper and screens";return S.pm==="run"?"machine floor: running the machine":"machine floor: the machine is down";}
  function personHTML(kind,k){const r=personRow(kind,k);if(!r)return null;const w=r.who||r.home,role=kind==="t"?"Maintenance tech":kind==="e"?"Electrical tech":k<7?"Machine floor operator":"Stock prep operator";
    const cov=r.cover?`<p class="ipc">Covering for ${escHTML(r.home.name)} (${r.cover.type==="swap"?"a swap":"overtime"} from ${r.cover.from} team)</p>`:"";
    const doing=kind==="t"?techDoing(techs[k]):kind==="e"?elecDoing():opDoing(k);const m=manNow();
    return {t:`${hatDot(w)}${escHTML(w.name)}`,s:`${role} · ${team(w)} · ${m.K==="D"?"days":"nights"}`,b:`${cov}<p>${escHTML(doing.charAt(0).toUpperCase()+doing.slice(1))}${kind==="e"&&ET.suited?" · in arc-flash PPE":""}.</p>`};}
  // vehicles
  function truckOf(id){for(const L of [S.inQ,S.inDock,S.outQ,S.outDock,S.leaving])for(const t of L||[])if(t&&t.id===id)return t;return null;}
  function truckHTML(id){const t=truckOf(id);if(!t)return {t:"Truck",s:"leaving the site",b:""};const ib=S.inQ.includes(t)||S.inDock.includes(t)||(t.load>100&&!t.g&&!t.want),d=S.inDock.indexOf(t),od=S.outDock.indexOf(t);
    if(ib)return {t:"OCC truck",s:d>=0?`receiving door ${d+1} · unloading`:"inbound, waiting for a door",b:`<p>${Math.round(t.load)} t of bales${t.q?` · ${BT[t.q]?BT[t.q].n:t.q}`:""}${t.m?` · ${(t.m*100).toFixed(1)} % moisture`:""}</p>`};
    if(!t.g&&!t.want&&!t.spot&&!t.oid)return {t:"OCC truck",s:S.leaving.includes(t)?"empty, on its way out":"empty",b:"<p>Bales unloaded at receiving</p>"};   // (t4: an emptied bale truck)
    const o=!t.spot&&t.oid&&typeof ordGet==="function"&&ordGet(t.oid);
    return {t:t.spot?"Spot-market truck":"Customer truck",s:od>=0?`shipping door ${od+1} · loading`:S.leaving.includes(t)?"on its way out":"waiting for a door",
      b:`<p>${t.g?`Grade ${t.g}${GRADE_PLAIN[t.g]?` (${GRADE_PLAIN[t.g]})`:""} · `:""}${Math.round(t.load)}${t.want?` of ${Math.round(t.want)}`:""} rolls${o?` · order #${o.id} for ${escHTML(ordCust(o))}`:""}</p>`};}
  // equipment: anchor [x, y, z], name, area, live readings (and the critical machines' reliability)
  const EQ=()=>{const r=knobRead(),f1=v=>(Math.round(v*10)/10).toLocaleString(),R=S.rates||{},sub=G3.scenery&&G3.scenery.util&&G3.scenery.util.substation,wt=YP&&YP.tower;
    return [
      [[16,3,-13.5],"Pulper","Stock prep",()=>`Feed ${f1(R.feed||0)} t/h · consistency ${f1(r.cp)} % · rotor ${Math.round(r.amps)} A`,"pulp"],
      [[17,3,-20.4],"Screens and cleaners","Stock prep",()=>`Fiber ${f1(R.fiberIn||0)} t/h · yield ${Math.round(P.yieldF*((S.M&&S.M.yieldMul)||1)*100)} % · fine screen load ${Math.round((R.fiberIn||0)/Math.max(1,P.screenMax)*100)} %`],
      [[34.5,8,-15],"Stock chest","Stock prep",()=>`Level ${Math.round(S.tank/P.tankCap*100)} % · ${Math.round(S.tank)} t of fiber`],
      [[60.6,3,-11],"Twin refiners","Stock prep",()=>`${Math.round(r.kwh)} kWh/t · ${Math.round(r.refkw)} kW · freeness ${Math.round(r.csf)} mL CSF`,["refA","refB"]],
      [[51,3,-9.3],"Fan pump","Stock prep",()=>`Headbox flow ${Math.round(S.we?GPM(S.we.f.hb||0):0).toLocaleString()} gpm`,"fan"],
      [[58,4,9.1],"Headbox and forming table","Wet end",()=>`Headbox consistency ${S.we?S.we.hbc.toFixed(2):"–"} % · vacuum ${f1(r.vac)} kPa · couch solids ${f1(r.couchSol)} %`,"couch"],
      [[37,4,9.1],"Twin press","Wet end",()=>`Load ${Math.round(r.pl)} kN/m · press solids ${f1(r.pressSol)} %`,["pr1","pr2"]],
      [[12,5,9.1],"Dryers","Dry end",()=>`Steam ${r.steam>0.5?f1(r.steam)+" t/h":"–"} · 3rd section ${Math.round(r.st3)} kPa · reel moisture ${r.run?f1(r.moist)+" %":"–"}`,"dry"],
      [[-4,4,9.1],"Reel","Dry end",()=>`${Math.round(S.pmSpeed)} fpm · ${f1(S.reel)} of 100 t on the reel`,"reel"],
      [[-18.7,4,9.1],"Winder","Dry end",()=>S.wd==="hayout"?"Hayout: crew cleaning up":`${f1(R.cut||0)} t/h · ${Math.max(0,reelsAtWinder()-1)}/${P.storeReels} reels stored`,"wind"],
      [[[-31.4,1.2,15.75],[-35,1.2,15.75],[-27.8,1.2,15.75]],"Beater bay","Shipping",()=>{const t=(S.q&&S.q.bank)||0,n=G3.BEAT?G3.BEAT.bay.length:0;return `${Math.round(t).toLocaleString()} t of beater to repulp · ${n} roll${n===1?"":"s"} in the bay${G3.BT&&G3.BT.st!=="away"?" · truck taking them to receiving":""}`;}],   // v6.11.2
      [[-36.4,3,23],"Roll warehouse","Shipping",()=>`${Math.round(S.fg)} of ${Math.round(P.fgCap)} rolls · ${S.outQ.length} trucks waiting`],
      [[-21,3,-13],"Receiving and bale yard","Yard",()=>`${Math.round(S.yard).toLocaleString()} t of bales · unloading ${f1(R.unload||0)} t/h · ${S.inQ.length} trucks waiting`],
      [[76,8,-10],"Boiler house","Utilities",()=>`Steam header ${Math.round(r.boiler*100)} % · ${r.steam>0.5?f1(r.steam):"0"} t/h`],
      [[[11,4,27.5],[11,2.4,26],[11,2.4,29],...[...Object.values(CAB),...Object.values(RECT3)].map(c=>{const h=c&&(c.home||c.stand);return h?[h[0],1.4,h[1]]:null;}).filter(Boolean)],"MCC (motor control center)","Electrical",()=>`480 V in · DC buses ${LINEUPS.map(([l])=>Math.round(rlyDC(l))).join(" / ")} V · ${Math.round(rlyMccKw(r)).toLocaleString()} kW on the drives`,null,"drv"],
      [[20.2,2.5,27],"MCC transformer","Electrical",()=>`13.8 kV to 480 V · ${rlyBlack()?"dead (blackout)":`${rlyMV().toFixed(1)} kV in`}`],
      sub?[[sub[0],4,sub[1]],"Substation","Electrical",()=>`115 kV from the utility to 13.8 kV for the mill · ${rlyBlack()?"tripped: blackout":active("brownout")?"brownout: the utility cut the mill back":"normal"}`]:null,
      wt?[[wt[0],wt[2]-6,wt[1]],"Water tower","Utilities",()=>`Fresh water ${S.wat&&S.wat.r?Math.round(GPM(S.wat.r.fresh)).toLocaleString()+" gpm":"–"}`]:null,
      [[LAYOUT.wx(22),3,-40],"Wastewater plant","Utilities",()=>`Effluent TSS ${Math.round(tssNow())} mg/L · outfall ${S.wat&&S.wat.r?Math.round(GPM(S.wat.r.out)).toLocaleString()+" gpm":"–"}`]].filter(Boolean);};
  function relLine(id){if(Array.isArray(id))return id.map(relLine).join("");if(!S.rel||!ASSETN[id])return "";const a=S.rel.a[id],v=a.lv,x=a.la,g=rlyAge(v),gx=rlyAge(x),L=Math.max(0,rlyLoad(id)),st=rlyDrvSt(id,L);
    return `<div class="iprel"><b>${ASSETN[id].n} motor and drive</b>${rlyChip(!v||g.cls==="unk"?"Vibration unknown":VIBST[v.st][0],!v||g.cls==="unk"?"unk":g.cls==="stale"?"stale":VIBST[v.st][1],v?g.txt+" ago":"never")}${rlyChip(!x||gx.cls==="unk"?"ADX unknown":"ADX "+ADXST[x.st][0].toLowerCase(),!x||gx.cls==="unk"?"unk":gx.cls==="stale"?"stale":ADXST[x.st][1],x?gx.txt+" ago":"never")}${rlyChip(st==="run"?Math.round(L)+" % load":st.toUpperCase(),{run:L>100?"bad":L>95?"warn":"ok",fault:"bad",trip:"bad",nodc:"bad"}[st]||"")}
      <button type="button" class="linkb" data-iprel="${id}">Open Reliability</button></div>`;}
  // every candidate: [kind, key, world point, the object (for visibility), pixel radius]
  function cands(){const out=[];const P3=(o,y)=>[o.position.x,(o.position.y||0)+y,o.position.z];
    techs.forEach((T,k)=>{if(k<P.techs&&T.w.visible)out.push(["p","t"+k,P3(T.w,1.1),T.w,24]);});
    if(typeof crew!=="undefined")crew.forEach((w,k)=>{if(w.visible)out.push(["p","o"+k,P3(w,1.1),w,24]);});
    if(typeof spOps!=="undefined")spOps.forEach((w,k)=>{if(w.visible)out.push(["p","o"+(7+k),P3(w,1.1),w,24]);});
    if(ET.w&&ET.w.visible){const q=ET.w.position,inM=q.x>MCC.x0&&q.x<MCC.x1&&q.z>MCC.z0&&q.z<MCC.z1;if(!inM||camera.position.distanceTo(q)<45)out.push(["p","e",P3(ET.w,1.1),ET.w,24]);}
    (G3.liftObjs||[]).forEach((g,k)=>{if(g.visible)out.push(["v","f"+k,P3(g,1),g,26]);});
    (G3.loaderObjs||[]).forEach((g,k)=>{if(g.visible)out.push(["v","c"+k,P3(g,1),g,26]);});
    truckMap.forEach((g,id)=>{if(g.visible)out.push(["v","k"+id,P3(g,2),g,40]);});
    EQ().forEach((q,k)=>{if(Array.isArray(q[0][0]))q[0].forEach(pt=>out.push(["q","q"+k,pt,null,34]));else out.push(["q","q"+k,q[0],null,46]);});return out;}
  function pick(e){const r=renderer.domElement.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let best=null,bd=1e9;
    for(const c of cands()){G3.siteV(_iv.set(c[2][0],c[2][1],c[2][2])).project(camera);if(_iv.z>1||_iv.z<-1)continue;const sx=(_iv.x+1)/2*r.width,sy=(1-_iv.y)/2*r.height,d=Math.hypot(sx-mx,sy-my);
      if(d>c[4])continue;const score=d+(c[0]==="q"?30:0)+_iv.z*4;if(score<bd){bd=score;best=c;}}
    return best;}
  function infoHTML(c){if(!c)return null;const k=c[1];
    if(c[0]==="p")return personHTML(k[0],+k.slice(1)||0);
    if(k[0]==="f"){const i=+k.slice(1),busy=i<Math.floor(S.effDrv+1e-9);return {t:`Forklift ${i+1}`,s:"Receiving · bale yard",b:`<p>${busy?(S.M&&S.M.recvMul===0?"Stopped: receiving is closed":"Moving bales: trucks to the yard and the yard to the pulper conveyor"):"Parked: not needed this hour"} · ${Math.round(C.drivers.v)} drivers on</p>`};}
    if(k[0]==="c"){const i=+k.slice(1);return {t:`Clamp truck ${i+1}`,s:"Roll warehouse",b:`<p>Loading rolls onto trucks · ${Math.round(S.rates.load||0)} rolls/h · ${Math.round(C.loaders.v)} on</p>`};}
    if(k[0]==="k")return truckHTML(+k.slice(1));
    const q=EQ()[+k.slice(1)];if(!q)return null;return {t:q[1],s:q[2],b:`<p>${q[3]()}</p>${q[4]?relLine(q[4]):""}${q[5]==="drv"?`<button type="button" class="linkb" data-ipdrv>Open Drives</button>`:""}`};}
  function infoClose(){if(INFO.el)INFO.el.hidden=true;INFO.cur=null;}
  function infoDraw(){const h=infoHTML(INFO.cur);if(!h){infoClose();return;}const html=`<div class="iph"><b>${h.t}</b><button type="button" class="ipx" aria-label="Close">✕</button></div><small>${escHTML(h.s)}</small>${h.b}`;
    if(INFO.key!==html){INFO.key=html;INFO.el.innerHTML=html;}}
  G3.infoTap=e=>{if(!S)return false;const c=pick(e);if(!c){if(INFO.cur){infoClose();return true;}return false;}
    if(!INFO.el){INFO.el=document.createElement("div");INFO.el.className="infopop";INFO.el.id="infoPop";INFO.el.setAttribute("role","dialog");INFO.el.hidden=true;document.body.appendChild(INFO.el);
      INFO.el.addEventListener("click",ev=>{if(ev.target.closest(".ipx")){infoClose();return;}const b=ev.target.closest("[data-iprel]");if(b){if(RUI)RUI.sel=b.dataset.iprel;infoClose();openStation("REL","dcs");return;}if(ev.target.closest("[data-ipdrv]")){infoClose();openStation("DRV","dcs");}});}
    INFO.cur=c;INFO.key="";infoDraw();INFO.el.hidden=false;
    const W=window.innerWidth,H=window.innerHeight,w=Math.min(300,W-16),x=clamp(e.clientX+14,8,W-w-8),hh=INFO.el.offsetHeight||140,y=clamp(e.clientY-hh-14,8,H-hh-8);
    INFO.el.style.left=x+"px";INFO.el.style.top=(e.clientY-hh-14<8?Math.min(H-hh-8,e.clientY+18):y)+"px";INFO.el.style.width=w+"px";return true;};
  G3.infoPick=(x,y)=>{const c=pick({clientX:x,clientY:y});return c?[c[0],c[1]]:null;};   // (tests)
  UI_TICKS.push(()=>{if(INFO.cur&&INFO.el&&!INFO.el.hidden){const o=INFO.cur[3];if(o&&!o.visible){infoClose();return;}infoDraw();}});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&INFO.cur)infoClose();});
