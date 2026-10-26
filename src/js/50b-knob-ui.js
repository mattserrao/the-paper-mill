/* ---- v5.6 fiddly knobs: the knob panel, the SPOT / WET / DET DCS and QCS screens, and the fiddly knobs view switch ----
   A field knob opens its own small panel (tap the red hardware); the DCS-only knobs live on their area's DCS screen,
   opened from the operator consoles (stock prep's, and the three on the machine floor). With any of these open, or the
   spider valve or slice panel, the game runs at 1 min/s (simRate, 08-ui-wiring.js) and is back at the player's speed on
   close. The screens only read the sim (knobRead / KHIST, 07b-knobs.js); the only writes are the player's knob moves. */
const KUI={panel:null,st:null,tab:"dcs"};
const AREA_N={SPOT:"Stock prep",WET:"Wet end",DET:"Dry end",DRV:"Drives"};
// field knobs the DCS can also set remotely; the guide roll and the oscillator are set at the machine only
const KREMOTE=new Set(["pulp","ref","agit","couch"]);
function kuiSync(){const vc=G3.vlvUI&&!S.zen?G3.vlvUI():0;G3.vlvClk=vc;   // (v6.9: a valve faceplate runs the game on its tuning clock, 50k)
  G3.knobUI=!S.zen&&!!(vc||KUI.panel||(KUI.st&&DCS_SLOW.has(KUI.st)&&!POP.on)||!$("spider").hidden||!$("slice").hidden);}
// (v6.7: only the screens with controls slow the game; the read-only ones run at the player's speed)
const DCS_SLOW=new Set(["SPOT","WET","DET"]);
function kEl(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
const kf=(v,d=1)=>(+v).toFixed(d);

/* ---- one knob's control: used in the field panel and on the DCS ---- */
function knobCtl(id,where){const d=KNOBN[id],w=kEl("div","kctl"),key=where+"-"+id;w.dataset.k=id;
  if(id==="zones"){w.innerHTML=`<div class="kzcv"><canvas width="560" height="150" data-cd="${key}"></canvas></div><div class="kzones"></div>`;
    const zs=w.querySelector(".kzones");for(let i=0;i<KZONES;i++){const c=kEl("div","kz",`<button type="button" aria-label="Zone ${i+1} up" data-z="${i}" data-d="1">▲</button><b data-zv="${i}">0</b><button type="button" aria-label="Zone ${i+1} down" data-z="${i}" data-d="-1">▼</button><small>${i+1}</small>`);zs.appendChild(c);}
    zs.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const i=+b.dataset.z,K=knobState();knobSet("zones",[i,K.z[i]+(+b.dataset.d)]);kuiRefresh();});}
  else if(id==="guide"){w.innerHTML=`<div class="seg kseg" role="group" aria-label="Guide mode"><button type="button" data-gm="1">AUTO</button><button type="button" data-gm="0">MANUAL</button></div>
      <label class="spis"><span>Trim</span><input type="range" min="-40" max="40" step="1" data-gt aria-label="Guide trim"/><b data-gtv>0 mm</b></label>`;
    w.querySelectorAll("[data-gm]").forEach(b=>b.addEventListener("click",()=>{knobSet("guide",{gm:+b.dataset.gm});kuiRefresh();}));
    w.querySelector("[data-gt]").addEventListener("input",e=>{knobSet("guide",{gt:+e.target.value});kuiRefresh();});}
  else if(id==="cbox"){const d=KNOBN.cbox;w.innerHTML=`<canvas class="kcbox" width="340" height="215" data-cbcv aria-label="Couch roll cross-section: the suction box's position and the couch vacuum"></canvas>
      <label class="spis"><span>${d.min}°</span><input type="range" min="${d.min}" max="${d.max}" step="${d.step}" data-kv aria-label="${d.name} angle"/><span>+${d.max}°</span></label>
      <div class="kval"><b data-kvv></b><small>standard ${KNOB_IDEAL.cbox}°</small></div>`;
    w.querySelector("[data-kv]").addEventListener("input",e=>{knobSet("cbox",+e.target.value);kuiRefresh();});}
  else if(id==="couch"){w.innerHTML=`<div class="seg kseg" role="group" aria-label="Couch pit agitator"><button type="button" data-cv="1">RUN</button><button type="button" data-cv="0">STOP</button></div>`;
    w.querySelectorAll("[data-cv]").forEach(b=>b.addEventListener("click",()=>{knobSet("couch",+b.dataset.cv);kuiRefresh();}));}
  else if(id==="incomer"){w.innerHTML=`<div class="seg kseg" role="group" aria-label="MCC main incomer"><button type="button" data-iv="1">CLOSED</button><button type="button" data-iv="0">OPEN</button></div>`;
    w.querySelectorAll("[data-iv]").forEach(b=>b.addEventListener("click",()=>{knobSet("incomer",+b.dataset.iv);if(where==="p")closeKnob();else kuiRefresh();}));   /* (v6.12.1-t7: the field panel closes on the switch) */}
  else if(id==="hood"){w.innerHTML=`<div class="seg kseg" role="group" aria-label="Dryer hood doors"><button type="button" data-hv="0">CLOSED</button><button type="button" data-hv="1">RAISED</button></div>`;
    w.querySelectorAll("[data-hv]").forEach(b=>b.addEventListener("click",()=>{knobSet("hood",+b.dataset.hv);if(where==="p")closeKnob();else kuiRefresh();}));}
  else{const k=d.dk||1,dp=d.dp||0,st=d.dk?Math.pow(10,-dp):d.step,mn=+(d.min*k).toFixed(dp),mx=+(d.max*k).toFixed(dp);   // (v6.12.1-t7: dk shows a knob in other units, the high vacuum's kPa as inHg)
    w.innerHTML=`<label class="spis"><span>${mn}</span><input type="range" min="${mn}" max="${mx}" step="${st}" data-kv aria-label="${d.name}"/><span>${mx}</span></label>
      <div class="kval"><b data-kvv></b><small data-kvs>standard ${((id==="draw"?drawStd():KNOB_IDEAL[id])*k).toFixed(dp)} ${d.unit}</small></div>`;
    w.querySelector("[data-kv]").addEventListener("input",e=>{knobSet(id,+e.target.value/k);kuiRefresh();});}
  return w;}
function knobCtlSync(w){const id=w.dataset.k,K=S.knob;
  if(id==="zones"){const z=K?K.z:[];w.querySelectorAll("[data-zv]").forEach(b=>{const v=z[+b.dataset.zv]||0;b.textContent=(v>0?"+":"")+v;b.classList.toggle("moved",v!==0);});}
  else if(id==="guide"){const v=K?K.v:KNOB_IDEAL;w.querySelectorAll("[data-gm]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.gm===v.gm)));
    const r=w.querySelector("[data-gt]");if(actEl(r)!==r)r.value=v.gt;w.querySelector("[data-gtv]").textContent=(v.gt>0?"+":"")+v.gt+" mm";}
  else if(id==="cbox"){const v=knobVal("cbox"),r=w.querySelector("[data-kv]");if(actEl(r)!==r)r.value=v;const b=w.querySelector("[data-kvv]");b.textContent=`${v>0?"+":v<0?"−":""}${Math.abs(v)}°`;b.classList.toggle("moved",!knobAt("cbox"));
    cboxDraw(w.querySelector("[data-cbcv]"),v);}
  else if(id==="couch"){const v=knobVal("couch");w.querySelectorAll("[data-cv]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.cv===v)));}
  else if(id==="incomer"){const v=knobVal("incomer");w.querySelectorAll("[data-iv]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.iv===v)));}
  else if(id==="hood"){const v=knobVal("hood");w.querySelectorAll("[data-hv]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.hv===v)));}
  else{const d=KNOBN[id],k=d.dk||1,v=knobVal(id)*k,r=w.querySelector("[data-kv]");if(actEl(r)!==r)r.value=v;const b=w.querySelector("[data-kvv]");b.textContent=`${v.toFixed(d.dp||0)} ${d.unit}`;b.classList.toggle("moved",!knobAt(id));
    if(id==="draw"){const q=drawReq(),sm=w.querySelector("[data-kvs]");if(sm)sm.textContent=`needs ${q.toFixed(1)} % at ${Math.round(S.pm==="run"?S.pmSpeed:C.pmSp.v).toLocaleString()} fpm`;b.classList.toggle("moved",knobVal("draw")<q-0.05);}}}
// a knob's own readings (process values an operator would see; no hints about what will go wrong)
function knobReadout(id,r){const R=(k,v)=>`<div><small>${k}</small><b>${v}</b></div>`;
  switch(id){
    case "pulp":return R("Pulper consistency",kf(r.cp)+" %")+R("Rotor",Math.round(r.amps)+" A")+R("Tub level",Math.round(r.pulpLvl)+" %");
    case "ref":return R("Energy",Math.round(r.kwh)+" kWh/t · "+kf(r.hpdt,2)+" HPDT")+R("Plate gap",kf(r.gap,2)+" mm")+R("Refiner load",Math.round(r.refkw).toLocaleString()+" / "+Math.round(r.refcap).toLocaleString()+" kW"+(r.kwh<r.refset-0.5?" · at max":""))+R("Freeness",Math.round(r.csf)+" mL CSF");
    case "agit":return R("Agitator",r.agit+" %")+R("Machine chest",Math.round(r.mcLvl)+" %")+R("Chest consistency",kf(r.mcCons,2)+" %");
    case "vac":return R("Flatboxes",kf(r.vacIn)+" inHg · PV-313 "+Math.round(r.hvv)+"%")+R("Vacuum pump",Math.round(r.vpkw)+" kW")+R("Couch solids",kf(r.couchSol)+" %");
    case "gbox":return R("Gravity boxes",kf(r.gbox)+" inHg · PV-311 "+Math.round(r.gbv)+"%")+R("Vacuum pump",Math.round(r.vpkw)+" kW")+R("Couch solids",kf(r.couchSol)+" %");
    case "lvac":return R("Low vacuum",kf(r.lvac)+" inHg · PV-312 "+Math.round(r.lvv)+"%")+R("Vacuum pump",Math.round(r.vpkw)+" kW")+R("Couch solids",kf(r.couchSol)+" %");
    case "cbox":return R("Couch vacuum",kf(r.cvacIn)+" inHg")+R("Box position",(r.cbox>0.05?"+":r.cbox<-0.05?"−":"")+kf(Math.abs(r.cbox))+"°")+R("Couch solids",kf(r.couchSol)+" %");
    case "press":return R("Nip load",Math.round(r.pl)+" kN/m")+R("After the presses",kf(r.pressSol)+" % solids");
    case "guide":return R("Fabric edge",(r.edge>=0?"+":"")+Math.round(r.edge)+" mm")+R("Guide travel used",r.gm?Math.round(Math.min(1,r.gtrav)*100)+" %":"manual");
    case "incomer":return R("Main breaker",knobVal("incomer")?"closed":"open")+R("480 V bus",Math.round(rlyLV())+" V")+R("Drive load",Math.round(rlyMccKw(r)).toLocaleString()+" kW");
    case "hood":{const h=G3.HOOD||{u:0,f:0};return R("Doors",h.u>0.98?"up":h.u>0.02?(h.want?"lifting…":"lowering…"):"closed")+R("Front section",h.f>0.98?"lifted off":h.f>0.02?"moving":"in place")+R("Dryer steam",r.steam>0?kf(r.steam)+" t/h":"–");}
    case "couch":return R("Agitator",r.couch?"running · 38 A":"stopped")+R("Pit level",Math.round(35+(S.pm==="run"?0:30)+r.cs*6)+" %");
    case "osc":return R("Shower stroke",Math.round(r.osc*0.14)+" /min")+R("Felt",r.stripes>0.15?"uneven":"clean");
    case "draw":return R("Open draw",kf(r.draw)+" % · needs "+kf(drawReq())+" %")+R("Sheet tension",r.run?kf(r.tension,2)+" kN/m":"–");
    case "st1":return R("1st section",Math.round(r.st1)+" kPa")+R("3rd section (auto)",Math.round(r.st3)+" kPa")+R("Reel moisture",r.run?kf(r.moist)+" %":"–");
    case "zones":return R("Reel moisture",r.run?kf(r.moist)+" %":"–")+R("Zones trimmed",(S.knob?S.knob.z.filter(v=>v).length:0)+" of 12");}
  return "";}

/* v6.12.1-t6 the couch suction box picture: the couch roll seen from the tending side, the fabric and sheet wrapping its
   top (coming in from the forming table on the right, leaving for the pick-up on the left), the suction box inside the
   shell drawn where it is now (the sim's lagged position; a ghost outline shows where it is being turned to), a degree
   scale round the roll, and the couch vacuum on a gauge beside it */
function cboxDraw(cv,set){if(!cv)return;const x=cv.getContext("2d"),W=cv.width,H=cv.height,K=S.knob,act=K&&K.x&&K.x.cb!=null?K.x.cb:CBOX.best,vac=cboxVac(act);
  const cx=128,cy=122,R=58,D=Math.PI/180,ang=a=>-Math.PI/2-(26+a)*D;   // (screen angle of a box centre a degrees from standard-ish: 26 deg past top dead centre, toward the pick-up)
  x.clearRect(0,0,W,H);x.fillStyle="#0f1b2d";x.fillRect(0,0,W,H);
  // degree scale outside the roll: -15 .. +15
  x.strokeStyle="#5d7392";x.fillStyle="#9ab3d6";x.font="600 10px system-ui,sans-serif";x.textAlign="center";x.lineWidth=1.5;
  for(let a=-15;a<=15;a+=5){const t=ang(a),r0=R+10,r1=R+(a%15?15:19);x.beginPath();x.moveTo(cx+Math.cos(t)*r0,cy+Math.sin(t)*r0);x.lineTo(cx+Math.cos(t)*r1,cy+Math.sin(t)*r1);x.stroke();
    if(a%15===0||a===0){const r2=R+29;x.fillText((a>0?"+":a<0?"−":"")+Math.abs(a)+"°",cx+Math.cos(t)*r2,cy+Math.sin(t)*r2+4);}}
  // the roll: drilled shell
  x.fillStyle="#2a3a52";x.beginPath();x.arc(cx,cy,R,0,7);x.fill();x.strokeStyle="#8d99ab";x.lineWidth=5;x.beginPath();x.arc(cx,cy,R-2,0,7);x.stroke();
  x.fillStyle="#0f1b2d";for(let k=0;k<36;k++){const t=k/36*6.283;x.beginPath();x.arc(cx+Math.cos(t)*(R-2),cy+Math.sin(t)*(R-2),1.1,0,7);x.fill();}
  // the suction box: a wedge inside the shell, with its seal strips
  const box=(a,fill,stroke)=>{const t0=ang(a)-20*D,t1=ang(a)+20*D;x.beginPath();x.moveTo(cx+Math.cos(t0)*14,cy+Math.sin(t0)*14);x.arc(cx,cy,R-6,t0,t1);x.lineTo(cx+Math.cos(t1)*14,cy+Math.sin(t1)*14);x.closePath();
    if(fill){x.fillStyle=fill;x.fill();}if(stroke){x.strokeStyle=stroke;x.lineWidth=1.5;x.setLineDash([4,3]);x.stroke();x.setLineDash([]);}
    if(fill){x.strokeStyle="#ffb02e";x.lineWidth=4;[t0,t1].forEach(t=>{x.beginPath();x.moveTo(cx+Math.cos(t)*(R-14),cy+Math.sin(t)*(R-14));x.lineTo(cx+Math.cos(t)*(R-5),cy+Math.sin(t)*(R-5));x.stroke();});}};
  if(Math.abs(set-act)>0.3)box(set,null,"#9ab3d6");
  const k=clamp((vac-30)/32,0,1);box(act,`rgba(${Math.round(80+40*(1-k))},${Math.round(150+60*k)},${Math.round(220)},0.85)`);
  // pointer on the scale at the box's centre
  {const t=ang(act);x.fillStyle="#ffb02e";x.beginPath();x.moveTo(cx+Math.cos(t)*(R+9),cy+Math.sin(t)*(R+9));x.lineTo(cx+Math.cos(t+0.06)*(R+1),cy+Math.sin(t+0.06)*(R+1));x.lineTo(cx+Math.cos(t-0.06)*(R+1),cy+Math.sin(t-0.06)*(R+1));x.fill();}
  // the fabric over the top: in from the table on the right, round the couch; the sheet leaves it
  // past the suction zone for the pick-up felt (drawn going away down-left, clear of the scale)
  {const tw=Math.PI/2+70*D;x.strokeStyle="#c9d4e2";x.lineWidth=3;x.beginPath();x.moveTo(W-112,cy-R-3);x.lineTo(cx,cy-R-3);x.arc(cx,cy,R+3,-Math.PI/2,-tw,true);x.stroke();
   const sw=Math.PI/2+58*D,px=cx+Math.cos(-sw)*(R+6),py=cy+Math.sin(-sw)*(R+6);x.strokeStyle="#f3efe2";x.lineWidth=2;x.beginPath();x.moveTo(px,py);x.lineTo(px-30,py+42);x.stroke();
   x.fillStyle="#9ab3d6";x.textAlign="left";x.fillText("from the table",W-170,cy-R-10);x.fillText("sheet to the pick-up",4,Math.min(H-6,py+56));}
  // rotation arrow
  x.strokeStyle="#5d7392";x.lineWidth=1.5;x.beginPath();x.arc(cx,cy,22,-0.6,-2.5,true);x.stroke();
  // the vacuum gauge
  const gx=W-58,gy=34,gh=150,vmax=70,lev=clamp(vac/vmax,0,1);x.fillStyle="#1b2a40";x.fillRect(gx,gy,22,gh);
  x.fillStyle=vac>55?"#4fd18b":vac>45?"#ffb02e":"#ff7a8a";x.fillRect(gx,gy+gh*(1-lev),22,gh*lev);x.strokeStyle="#5d7392";x.strokeRect(gx,gy,22,gh);
  x.fillStyle="#9ab3d6";x.textAlign="right";for(let v=0;v<=70;v+=10){const y=gy+gh*(1-v/vmax);x.fillRect(gx-4,y,4,1);if(v%20===0)x.fillText(String(v),gx-6,y+3);}
  x.textAlign="center";x.fillStyle="#e8eef7";x.font="700 12px system-ui,sans-serif";x.fillText(kf(vac)+" kPa",gx+11,gy+gh+16);x.font="600 10px system-ui,sans-serif";x.fillStyle="#9ab3d6";x.fillText("VACUUM",gx+11,gy-8);}

/* ---- the field knob panel (a small floating card, like the spider valve's) ---- */
function knobPanel(){let p=$("knobP");if(p)return p;
  p=kEl("div","spider knobp");p.id="knobP";p.hidden=true;p.setAttribute("role","dialog");p.setAttribute("aria-labelledby","kp-h");
  p.innerHTML=`<div class="spih"><b id="kp-h"></b><span id="kpWhere"></span><button aria-label="Close" id="kpClose">✕</button></div><p class="kptip" id="kpTip"></p><div id="kpCtl"></div><div class="spir krd" id="kpRead"></div><p class="spin" id="kpNote"></p>
    <div class="kpbtns"><button class="reroll" id="kpReset" type="button">Set back to standard</button><button class="reroll" id="kpDcs" type="button"></button></div>`;
  $("view3d").appendChild(p);
  $("kpClose").addEventListener("click",()=>closeKnob());
  $("kpReset").addEventListener("click",()=>{const id=KUI.panel;if(!id||!S.knob)return;knobReset(id);kuiRefresh();});
  $("kpDcs").addEventListener("click",()=>{const id=KUI.panel;if(id)openStation(KNOBN[id].area);});
  return p;}
function openKnob(id){if(S.zen||!KNOBN[id])return;const p=knobPanel();["spider","slice","brian"].forEach(k=>$(k).hidden=true);closeStation(true);
  const d=KNOBN[id];KUI.panel=id;$("kp-h").textContent=d.name;$("kpWhere").textContent=d.where.toLowerCase();$("kpTip").textContent=d.tip;
  const c=$("kpCtl");c.replaceChildren(knobCtl(id,"p"));$("kpDcs").textContent=`Open the ${AREA_N[d.area].toLowerCase()} DCS`;p.hidden=false;kuiSync();kuiRefresh();}
function closeKnob(){const p=$("knobP");if(p)p.hidden=true;KUI.panel=null;kuiSync();}

/* ---- the DCS / QCS screens ---- */
function stationOv(){let o=$("dcsOv");if(o)return o;
  o=kEl("div","overlay top dcsov");o.id="dcsOv";o.hidden=true;
  o.innerHTML=`<div class="dcs" role="dialog" aria-modal="true" aria-labelledby="dcs-h"><div class="dcsh"><b id="dcs-h"></b>
    <div class="dcsst" role="group" aria-label="Screen">${DCS_SCREENS.map(([k,l,t])=>`<button type="button" data-a="${k}" title="${t}">${l}</button>`).join("")}</div>
    <div class="seg dcsview" role="group" aria-label="Show"><button type="button" data-trv="pic">Picture</button><button type="button" data-trv="trend">Trend</button></div>
    <button type="button" class="dcspop dcstrt" data-trt aria-pressed="true" title="Show or hide the trend beside the picture">Trend ▸</button>
    <button type="button" class="dcspop" data-popout="dcs"${POPOK()&&!POP.on?"":" hidden"} title="Open in its own window, for a second monitor">⧉ Second screen</button><button aria-label="Close" class="dcsx" id="dcsClose">✕</button></div>
    <div class="dcsb" id="dcsBody"><div class="dcsmain" id="dcsMain"></div><aside class="dcstrp" id="dcsTrp" aria-label="Trend"></aside></div><div class="dcsf"><span id="dcsClock"></span><span id="dcsSlow"></span></div></div>`;
  document.body.appendChild(o);
  $("dcsClose").addEventListener("click",()=>closeStation());
  o.addEventListener("click",e=>{if(e.target===o)closeStation();const v=e.target.closest&&e.target.closest("[data-vlv]");if(v)openVlv(v.dataset.vlv);});   // (v6.9: tap a valve for its faceplate, 50k)
  o.addEventListener("keydown",e=>{const v=(e.key==="Enter"||e.key===" ")&&e.target.closest&&e.target.closest("[data-vlv]");if(v){e.preventDefault();openVlv(v.dataset.vlv);}});
  o.querySelectorAll("[data-a]").forEach(b=>b.addEventListener("click",()=>{KUI.st=b.dataset.a;KUI.tab=b.dataset.a==="QCS"?"qcs":"dcs";stationBuild();kuiSync();}));
  o.querySelectorAll("[data-trv]").forEach(b=>b.addEventListener("click",()=>{TRUI.view=b.dataset.trv;trLayout();}));
  o.querySelector("[data-trt]").addEventListener("click",()=>{TRUI.show=!TRUI.show;trLayout();});
  trWire(o);

  return o;}
function openStation(a,tab){if(tab==="qcs")a="QCS";if(S.zen||!DCS_SCR[a])return;tab=a==="QCS"?"qcs":"dcs";
  if(POP.on){KUI.st=a;if(tab)KUI.tab=tab;popShow("dcs");stationBuild();kuiSync();return;}   // v6.5.1: popped out, it just switches the second screen to this area
  closeKnob();["spider","slice","brian"].forEach(k=>$(k).hidden=true);const o=stationOv();KUI.st=a;if(tab)KUI.tab=tab;o.hidden=false;stationBuild();kuiSync();
  setTimeout(()=>{try{$("dcsClose").focus({preventScroll:true});}catch(_){}},0);}
function closeStation(quiet){if(POP.on)return;   // (v6.5.1: a popped-out DCS stays up until docked)
  const o=$("dcsOv"),was=o&&!o.hidden;if(o)o.hidden=true;KUI.st=null;if(!quiet){kuiSync();if(was)try{$("gl").focus({preventScroll:true});}catch(_){}}}
// the process picture for each area: equipment boxes and live tags. Coordinates in a 640 x 230 view box.
const MIMIC={
  SPOT:{title:"STOCK PREP",eq:[[14,80,96,70,"PULPER"],[132,95,74,40,"SCREENS"],[228,80,80,70,"STOCK CHEST"],[330,95,78,40,"REFINERS"],[430,80,92,70,"MACHINE CHEST"],[546,100,80,30,"FAN PUMP"]],
    tags:[[62,172,"cp","CONS",r=>kf(r.cp)+"%"],[62,194,"amps","ROTOR",r=>Math.round(r.amps)+" A"],[62,66,"pulpLvl","LEVEL",r=>Math.round(r.pulpLvl)+"%"],[268,172,"lvl","LEVEL",()=>Math.round(S.tank/P.tankCap*100)+"%"],
      [369,172,"gap","GAP",r=>kf(r.gap,2)+" mm"],[369,194,"refkw","LOAD",r=>Math.round(r.refkw)+" kW"],[369,80,"csf","CSF",r=>Math.round(r.csf)+" mL"],[476,172,"mcCons","CONS",r=>kf(r.mcCons,2)+"%"],[476,194,"agit","AGIT",r=>r.agit+"%"],[586,150,"flow","FLOW",()=>S.pm==="run"?Math.round(S.pmSpeed*1.9)+" L/s":"0 L/s"]],
    trends:[["cp","Pulper consistency %","#ffb02e",0,10],["amps","Rotor A","#4fd18b",0,700],["mcCons","Machine chest cons %","#7fb2ff",2.4,4.0],["refkw","Refiner kW","#ff7a8a",0,4000]]},
  WET:{title:"WET END",eq:[[14,80,74,70,"HEADBOX"],[104,105,190,25,"FORMING TABLE"],[308,90,64,50,"COUCH"],[388,90,104,50,"PICK-UP FELT"],[508,80,118,70,"TWIN PRESS"]],
    tags:[[51,172,"zones","ZONES",r=>(S.knob?S.knob.z.filter(v=>v).length:0)+"/12"],[150,150,"gbox","GRAV",r=>kf(r.gbox)+" inHg"],[205,150,"lvac","LOW",r=>kf(r.lvac)+" inHg"],[260,150,"vac","HIGH",r=>kf(r.vacIn)+" inHg"],[199,88,"edge","EDGE",r=>(r.edge>=0?"+":"")+Math.round(r.edge)+" mm"],[199,194,"gtrav","GUIDE",r=>r.gm?"AUTO "+Math.round(Math.min(1,r.gtrav)*100)+"%":"MAN"],
      [340,172,"couchSol","SOL",r=>kf(r.couchSol)+"%"],[340,194,"cs","PIT",r=>r.couch?"RUN":"STOP"],[440,172,"osc","OSC",r=>Math.round(r.osc)+"%"],[567,172,"pl","LOAD",r=>Math.round(r.pl)+" kN/m"],[567,194,"pressSol","SOL",r=>kf(r.pressSol)+"%"]],
    trends:[["vacIn","Flatbox vacuum inHg","#7fb2ff",0,18],["couchSol","Couch solids %","#4fd18b",12,24],["pl","Press load kN/m","#ffb02e",40,160],["pressSol","Press solids %","#ff7a8a",38,50]]},
  DET:{title:"DRY END",eq:[[14,90,80,50,"OPEN DRAW"],[112,75,130,80,"1ST SECTION"],[260,75,170,80,"2ND / 3RD SECTION"],[448,85,74,60,"REEL"],[546,20,80,40,"BOILER"]],
    tags:[[54,172,"draw","DRAW",r=>kf(r.draw)+"% / "+kf(drawReq())],[54,194,"tension","TENS",r=>r.run?kf(r.tension,2):"–"],[177,172,"st1","STEAM",r=>Math.round(r.st1)+" kPa"],[345,172,"st3","AUTO",r=>Math.round(r.st3)+" kPa"],[345,194,"steam","FLOW",r=>r.steam>0.5?kf(r.steam)+" t/h":"–"],
      [485,172,"moist","MOIST",r=>r.run?kf(r.moist)+"%":"–"],[485,194,"bw","BW",r=>r.run?kf(r.bw,2):"–"],[586,78,"boiler","HEADER",r=>Math.round(r.boiler*100)+"%"],[485,72,"speed","SPEED",r=>Math.round(r.speed)+" fpm"]],
    trends:[["st3","3rd section steam kPa","#ffb02e",40,200],["steam","Steam flow t/h","#7fb2ff",0,70],["moist","Reel moisture %","#4fd18b",0,14],["tension","Draw tension kN/m","#ff7a8a",0,2.5]]}};
// alarms from the current readings: what a DCS would flash. They point at symptoms, not at the knob behind them.
function knobAlarms(a,r){const L=[],al=(on,txt,hi)=>{if(on)L.push([txt,hi]);};const K=S.knob;
  if(a==="SPOT"){al(r.cp>6.5,"PULPER CONS HI",r.cp>7.2);al(r.cp<3.5,"PULPER CONS LO",r.cp<2.6);al(r.pulpLvl>92,"PULPER LEVEL HI",r.pulpLvl>100);al(r.amps>520,"ROTOR AMPS HI",r.amps>560);
    al(r.gap<0.25,"REFINER GAP LO",r.gap<0.18);al(Math.abs(r.mcCons-3.2)>0.35,"MACHINE CHEST CONS DEV",Math.abs(r.mcCons-3.2)>0.6);}
  else if(a==="WET"){al(r.vac<18,"FLATBOX VACUUM LO",r.vac<12);al(r.gbox<0.4,"GRAVITY BOX VACUUM LO",false);al(r.lvac<3,"LOW VACUUM LO",false);al((K&&K.wear||0)>0.4,"FORMING FABRIC WEAR HI",(K&&K.wear||0)>0.75);al(Math.abs(r.edge)>12,"FABRIC EDGE DEV",Math.abs(r.edge)>35);al(r.gm&&r.gtrav>0.85,"GUIDE AT END OF TRAVEL",r.gtrav>=1);
    al(r.cs>0.6&&S.pm!=="run","COUCH PIT LEVEL HI",r.cs>1.2);al(r.pl>125,"PRESS LOAD HI",r.pl>135);al(r.couchSol<16,"COUCH SOLIDS LO",r.couchSol<14);al(K&&K.F&&K.F.cd>0,"CD PROFILE OUT",true);}
  else if(a==="DET"&&r.run){al(S.dry&&r.st3>=dryCeil(S.dry)-1,"3RD SECTION STEAM AT MAX",true);al(r.boiler<0.8,"STEAM HEADER LO",r.boiler<0.7);al(r.run&&r.moist>9.5,"REEL MOISTURE HI",r.moist>11);al(r.run&&r.moist<6.5,"REEL MOISTURE LO",r.moist<6);
    al(r.run&&r.draw<drawReq()-0.05,"OPEN DRAW LOW FOR SPEED · NEEDS "+kf(drawReq())+" %",r.draw<drawReq()-0.3);al(r.run&&r.tension>1.3,"DRAW TENSION HI",r.tension>1.5);al(r.run&&r.tension<0.85,"DRAW TENSION LO",r.tension<0.7);
    al(QNOW.out.includes("bw"),"BASIS WEIGHT OFF SPEC",true);al(QNOW.out.includes("m"),"MOISTURE OFF SPEC",true);al(QNOW.out.includes("shade"),"COLOR OFF SPEC",true);}   // (v6.5.3: the QCS spec check)
  else if(a==="DET")al(r.boiler<0.8,"STEAM HEADER LO",r.boiler<0.7);
  {const q=qualStatus();if(r.run&&q.off>0.02)L.unshift([`MAKING BEATER · ${q.why.toUpperCase()}`,true]);}   // (v6.5.4: on every screen, first)
  dcsAlarms(a,r,L);   // v6.5 b3: upsets on the screen of the equipment they hit, motors, purges, the dry end's states (50d)
  return L;}
function stationBuild(){const o=$("dcsOv");if(!o||!KUI.st)return;const a=KUI.st,M2=MIMIC[a],b=$("dcsMain");if(o._st!==a){o._st=a;o.querySelectorAll(".dcsb").forEach(e=>{e.scrollTop=0;});requestAnimationFrame(()=>o.querySelectorAll(".dcsb").forEach(e=>{e.scrollTop=0;}));}   /* (v6.10 t4: a new screen opens at the top) */KUI.tab=a==="QCS"?"qcs":"dcs";if(a!=="PLAN"&&a!=="QCS"&&a!=="TREND"&&a!=="WATER"&&a!=="DRV"&&a!=="REL"&&!XS[a])KUI.last=a;
  $("dcs-h").textContent=`${(typeof NAME==="string"&&NAME)||"PM1"} · `+DCS_SCR[a].title;   // (v6.5.2: the machine's own name, as on the process flow and the 3D label)
  {const sl=$("dcsSlow");if(sl)sl.textContent=POP.on?"Second screen · the mill keeps running at your speed":DCS_SLOW.has(a)?"Game slowed to 1 min/s while this screen is open":"Live: the mill keeps running at your speed";}
  o.querySelectorAll("[data-a]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.a===a)));
  b.replaceChildren();
  if(M2){
    const svg=[`<svg viewBox="0 0 640 ${M2.h||210}" class="mimic" role="img" aria-label="Process picture">`];
    if(M2.ln)M2.ln.forEach(([d,st])=>svg.push(`<path d="${d}" class="mln${st?" st":""}"/>`));   // (v6.5 b3: the pictures draw their own lines, 50d)
    else{for(let i=0;i<M2.eq.length-1;i++){const e=M2.eq[i],n=M2.eq[i+1];if(a==="DET"&&i===3)continue;svg.push(`<line x1="${e[0]+e[2]}" y1="${e[1]+e[3]/2}" x2="${n[0]}" y2="${n[1]+n[3]/2}" class="mln"/>`);}
      if(a==="DET")svg.push(`<path d="M586 60 V 66 H 177 V 75 M345 66 V 75" class="mln st"/>`);}
    M2.eq.forEach((e,i)=>{const pic=dcsPic(a,e,i);if(pic){svg.push(pic);return;}const [x,y,w,h,t,sm]=e;   /* (v6.5 b4: pictograms, 50d) */
      svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="meq${sm?" sm":""}"/><text x="${x+w/2}" y="${y+h/2+4}" class="mtl${sm?" sm":""}">${typeof t==="function"?t():t}</text>`);});
    // (v6.7: a tag that can be trended is a button: tap it to add it to the trend)
    M2.tags.forEach(([x,y,k,t])=>{const tg=trTagOf(k);svg.push(`<text x="${x}" y="${y}" class="mtg${tg?" trk":""}"${tg?` data-trk="${tg}" role="button" tabindex="0"`:""}><title>${tg?"Trend "+tagName(tg):""}</title><tspan class="mtk">${t} </tspan><tspan data-tag="${k}">–</tspan></text>`);});
    svg.push(vlvDcsSvg(a));   // v6.9: the control valves (50k)
    svg.push("</svg>");b.appendChild(kEl("div","mimicw",svg.join("")));
    b.appendChild(kEl("div","dcsal",`<b>Alarms</b><ul id="dcsAl"></ul>`));vlvDcsRows(a,b);   // (v6.9: the area's control valves as buttons too, 50k)
    if(a==="WATER")b.appendChild(kEl("div","dcsctl",`<div class="dcssub">Water balance · the run so far</div><div class="wbal" id="wBal"></div>`));
    const ids=KNOBS.filter(k=>k.area===a&&(k.dcs||KREMOTE.has(k.id))&&k.id!=="pulp").map(k=>k.id),fld=KNOBS.filter(k=>k.area===a&&k.field&&!KREMOTE.has(k.id));   // (v6.9: the pulper dilution valve is NV-101, on the picture)
    const cs=kEl("div","dcsctl");cs.appendChild(kEl("div","dcssub","Setpoints"));dcsSetRows(a,cs);
    ids.forEach(id=>{const row=kEl("div","dcsrow"+(id==="zones"?" wide":""));row.dataset.ord=id;row.appendChild(kEl("div","dcsn",`<b>${KNOBN[id].name}</b><small>${KNOBN[id].field?"remote from the DCS":"DCS"}</small>`));row.appendChild(knobCtl(id,"d"));
      const rd=kEl("div","spir krd");rd.dataset.rd=id;row.appendChild(rd);row.appendChild(kEl("button","reroll kstd","Standard")).addEventListener("click",()=>{knobReset(id);kuiRefresh();});cs.appendChild(row);
      if(id==="zones"){const bt=kEl("div","dcsbeat","");bt.id="dcsBeat";bt.dataset.ord="beat";bt.hidden=true;bt.setAttribute("role","status");cs.appendChild(bt);}});   // v6.5.4: making-beater alert under the dilution zones
    dcsOrder(a,cs);   // (v6.11.2: rows in the order the stock meets them, under section headings, 50d)
    if(fld.length)cs.appendChild(kEl("p","dcsfield",`Set at the machine, not from here: ${fld.map(k=>`<button type="button" class="linkb" data-fk="${k.id}">${k.name.toLowerCase()}</button>`).join(", ")}. Look for the red knobs on the floor.`));
    cs.querySelectorAll("[data-fk]").forEach(x=>x.addEventListener("click",()=>{const id=x.dataset.fk;closeStation();if(G3.knobFly)G3.knobFly(id);openKnob(id);}));
    b.appendChild(cs);dcsMotRows(a,b);}
  else if(a==="QCS")qcsBuild(b);
  else if(a==="PLAN")b.appendChild(kEl("div","plan","")).id="planBox";
  else if(a==="DRV")drvBuild(b);else if(a==="REL")rlyBuild(b);   // v6.10 (50l)
  else if(XS[a])XS[a].b(b);   // v6.13 the machine profile, breaks and energy screens (50m)
  if(M2&&(a==="WET"||a==="DET"))shStripAdd(b,a);   // v6.13 the side elevation and the break risk (50m)
  trBuild();trLayout();kuiRefresh();}
function kuiRefresh(){if(!KUI.panel&&!KUI.st)return;const r=knobRead();
  if(KUI.panel){const id=KUI.panel;document.querySelectorAll("#kpCtl .kctl").forEach(knobCtlSync);{const h=knobReadout(id,r),e=$("kpRead");if(e._h!==h){e._h=h;e.innerHTML=h;}}
    const n=$("kpNote"),moved=!knobAt(id),busy=S.knob&&S.knob.inc.some(i=>i.cause.includes(id));n.className="spin"+(moved?" bad":"");
    n.textContent=busy?"A crew is working on trouble out here.":moved?`Moved off standard (${knobFmt(id)}). Things may take a while to show up, and not always here.`:"At standard.";
    $("kpReset").disabled=!moved;if(id==="zones")kuiCd(document.querySelector('#kpCtl canvas[data-cd]'),r);}
  if(KUI.st){const o=$("dcsOv"),a=KUI.st,M2=MIMIC[a];$("dcsClock").textContent=`Day ${Math.floor(S.t/1440)+1} · ${clockOf(S.t)}`;
    if(M2){o.querySelectorAll("[data-tag]").forEach(t=>{const g=M2.tags.find(q=>q[2]===t.dataset.tag);if(g){const v=g[4](r);if(t.textContent!==v)t.textContent=v;if(g[5]){const c=g[5]();t.classList.toggle("tal",c==="bad");t.classList.toggle("twn",c==="warn");}}});
      o.querySelectorAll(".dcsctl .kctl").forEach(knobCtlSync);o.querySelectorAll("[data-rd]").forEach(d=>{const h=knobReadout(d.dataset.rd,r);if(d._h!==h){d._h=h;d.innerHTML=h;}});
      const al=knobAlarms(a,r),ul=$("dcsAl"),h=al.length?al.map(([t,hi])=>`<li class="${hi?"hi":""}">${t}</li>`).join(""):'<li class="none">No alarms</li>';if(ul&&ul._h!==h){ul._h=h;ul.innerHTML=h;}
      {const bt=$("dcsBeat");if(bt){const q=qualStatus(),on=r.run&&q.off>0.02,t=on?`⚠ MAKING BEATER · ${q.why.toUpperCase()} · ${q.off>=0.99?"the whole reel":Math.round(q.off*100)+"% of the reel"} to the beater`:"";if(bt.hidden===on)bt.hidden=!on;if(bt.textContent!==t)bt.textContent=t;}}
      o.querySelectorAll(".dcsrow canvas[data-cd]").forEach(c=>kuiCd(c,r));dcsSync();dcsPicSync(a);vlvDcsSync(o);if(a==="WATER")waterRefresh();}
    else if(a==="QCS"){const K=S.knob,F=(K&&K.F)||{},st=$("qcsSt");
      // v6.5.3: the spec check (07e) names what's out; the grade change and the other knob defects after it
      const qs=qualStatus(),sh=!r.run?["MACHINE DOWN","down"]:QNOW.out.length?[`OFF SPEC · ${qs.why} · rolls to the beater`,"bad"]:S.chg?["GRADE CHANGE · weight in transition · rolls to the beater","warn"]:qs.off>0.02?[`REJECTING · ${qs.why} · ${Math.round(qs.off*100)}% to the beater`,"bad"]:["ON SPEC","ok"];
      if(st._h!==sh[0]){st._h=sh[0];st.textContent=sh[0];st.className="qcsst "+sh[1];}
      // v6.5.3: each reading against the grade's spec (QSPEC, 07e); red when it's out
      const g=GRADES[C.grade],sp=QSPEC[C.grade]||QSPEC["24"],qv=$("qcsV"),qo=k=>r.run&&QNOW.out.includes(k)?' class="qout"':"",rg=(a,d)=>`spec ${a[0].toFixed(d)}–${a[1].toFixed(d)}`;
      const shn=((document.querySelector('#paperColor button[aria-pressed="true"]')||{}).dataset||{}).c==="white"?"white":"brown";
      const qh=`<div><small>Grade</small><b>${C.grade}</b><small>target ${g.bw} lb · ${DRY.m0.toFixed(1)} %</small></div><div${qo("bw")}><small>Basis weight</small><b>${r.run?kf(QNOW.bw,2):"–"}</b><small>${rg(qBw(C.grade),2)}${bwSp()<g.bw-0.005?` · set ${bwSp().toFixed(2)}`:""}</small></div><div${qo("rct")}><small>Ring crush</small><b>${r.run?kf(QNOW.rct,1):"–"}</b><small>min ${rctSpec()} lbf${S.zen?"":` · ${wcFmt(areaQcs())}`}</small></div>${S.zen?"":`<div${qo("stfi")}><small>STFI CD</small><b>${r.run?kf(QNOW.stfi,2):"–"}</b><small>min ${stfiSpec()} kN/m · MD/CD ${tsrNow().toFixed(2)}</small></div><div><small>Formation</small><b>${r.run?formIdx():"–"}</b><small>index · 100 standard</small></div><div><small>Reel hardness</small><b>${Math.round(reelHard())}</b><small>${reelHard()<55?"soft: rolls telescope":reelHard()>70?"hard: rolls crack":"standard "+SH.hard0}</small></div>`}<div${qo("m")}><small>Moisture</small><b>${r.run?kf(r.moist):"–"} %</b><small>${rg(sp.m,1)}</small></div><div${qo("shade")}><small>Color</small><b>${QNOW.shade?"ON SHADE":"OFF SHADE"}</b><small>spec ${shn}</small></div><div><small>Reel speed</small><b>${Math.round(r.speed)}</b><small>fpm</small></div>`;if(qv._h!==qh){qv._h=qh;qv.innerHTML=qh;}
      if(cdOn()){cdDraw($("qcsCd"),r);cdActSync();const rl=$("qcsRolls");if(rl){const o=(S.cd&&S.cd.off)||[[],[]],h=r.run?[0,1].map(s=>`<span class="${o[s].length?"bad":"ok"}">${CDSIDE[s]} roll: ${o[s].length?o[s].join(", "):"on spec"}</span>`).join(""):"";if(rl._h!==h){rl._h=h;rl.innerHTML=h;}}}else kuiCd($("qcsCd"),r);
      const D=[["Wrinkles",F.wrinkles],["Crush marks",F.crush],["Felt stripes",F.stripes],["CD streaks",F.cd],["Weight swings",F.bw],["Wet sheet",F.wet],["Dry sheet",F.dry]];
      const h=D.map(([n,v])=>{const c=v>0.01?Math.round(4+v*80):0;return `<div class="${c?"hit":""}"><small>${n}</small><b>${c}</b><small>/ reel</small></div>`;}).join("");const dd=$("qcsDef");if(dd._h!==h){dd._h=h;dd.innerHTML=h;}qcsRefresh();}
    else if(a==="PLAN")planRefresh();
    else if(a==="DRV")drvRefresh();else if(a==="REL")rlyRefresh();   // v6.10 (50l)
    else if(XS[a])XS[a].r();   // v6.13 (50m)
    if(M2&&(a==="WET"||a==="DET"))shStripDraw();
    trDraw();}}
// CD moisture profile: a bar per zone up from 3 %, the ±1.5 % spec band round the reel average, the 8 % target
function kuiCd(cv,r){if(!cv)return;const x=cv.getContext("2d"),W=cv.width,H=cv.height,z=r.zones,lo=3,hi=11,Y=v=>H-18-clamp((v-lo)/(hi-lo),0,1)*(H-30);
  x.fillStyle="#0f1b2d";x.fillRect(0,0,W,H);
  if(!r.run){x.fillStyle="rgba(190,205,230,.8)";x.font="600 18px system-ui,sans-serif";x.textAlign="center";x.fillText("Scanner parked: no sheet",W/2,H/2);x.textAlign="left";return;}
  const m=r.moist;x.fillStyle="rgba(79,209,139,.16)";x.fillRect(0,Y(m+1.5),W,Y(m-1.5)-Y(m+1.5));
  const bw=W/z.length;z.forEach((v,i)=>{const bad=Math.abs(v-m)>1.5;x.fillStyle=bad?"#ff6b5e":"#5f8fd8";const y=Y(v);x.fillRect(i*bw+6,y,bw-12,H-18-y);
    x.fillStyle="rgba(190,205,230,.75)";x.font="600 13px system-ui,sans-serif";x.textAlign="center";x.fillText(String(i+1),i*bw+bw/2,H-3);});
  x.strokeStyle="rgba(79,209,139,.85)";x.setLineDash([6,6]);x.lineWidth=1.5;x.beginPath();x.moveTo(0,Y(DRY.m0));x.lineTo(W,Y(DRY.m0));x.stroke();x.setLineDash([]);
  x.textAlign="left";x.fillStyle="rgba(190,205,230,.8)";x.font="600 12px system-ui,sans-serif";x.fillText(DRY.m0+" % target",6,Y(DRY.m0)-4);}
function clockOf(t){const m=((Math.floor(t)+360)%1440+1440)%1440,h=Math.floor(m/60),mm=m%60;return `${(h%12)||12}:${String(mm).padStart(2,"0")} ${h<12?"AM":"PM"}`;}
// Escape closes the DCS or the knob panel and nothing else (capture phase: the sheet and fullscreen handlers don't see it)
document.addEventListener("keydown",e=>{if(e.key!=="Escape"||!(KUI.st||KUI.panel))return;e.preventDefault();e.stopPropagation();if(KUI.st)closeStation();else closeKnob();},true);
UI_TICKS.push(()=>{if(S.zen&&(KUI.panel||KUI.st)){closeKnob();closeStation();}kuiSync();if((KUI.panel||KUI.st)&&!(S.zen&&POP.on))kuiRefresh();});
// taps in the 3D view (29-3d-camera.js) and labels in the knob view (40b)
G3.knobTap=h=>{if(!h||S.zen)return;if(h.k==="knob")openKnob(h.id);else if(h.k==="station")openStation(h.a,"dcs");else if(h.k==="spider")openSpider();else if(h.k==="slice")openSlice();};
G3.openKnob=openKnob;G3.openStation=openStation;G3.slcSet=slcSet;G3.hayout=()=>hayout();G3.qual=()=>({bw:QNOW.bw,m:QNOW.m,shade:QNOW.shade,out:[...QNOW.out],status:qualStatus(),spec:QSPEC[C.grade]});   // (v6.5.3: tests)
  G3.yieldUI=()=>{try{if(G3.VUI&&G3.VUI.id&&G3.vlvClose&&!POP.on)G3.vlvClose();if(!POP.on){closeKnob();closeStation();}else if(KUI.panel)closeKnob();}catch(_){}};   // (v6.9.2: cards, the outage plan and the pause menu draw under these)
  G3.closeKnobUI=()=>{closeKnob();closeStation();};
["spiClose","slcClose"].forEach(id=>$(id).addEventListener("click",()=>setTimeout(kuiSync,0)));

/* ---- the fiddly knobs view switch (Settings > View) and its chip ---- */
{const row=$("v2viewrow"),lab=kEl("label","check",`<input id="knobView" type="checkbox"/> Fiddly knobs view`);row.appendChild(lab);
  const chip=kEl("div","kvchip",`<b>Fiddly knobs</b><span>Tap a red knob</span><button type="button" id="kvExit">Exit</button>`);chip.id="kvChip";chip.hidden=true;$("view3d").appendChild(chip);
  const set=on=>{on=!!on&&!S.zen;if(G3.knobView)G3.knobView(on);$("knobView").checked=on;chip.hidden=!on;document.body.classList.toggle("kview",on);};
  $("knobView").addEventListener("change",e=>{set(e.target.checked);if(e.target.checked){const x=document.querySelector('#v2sheet header button[aria-label="Close panel"]');if(x)x.click();}});
  $("kvExit").addEventListener("click",()=>set(false));G3.setKnobView=set;
  UI_TICKS.push(()=>{if(S.zen&&G3.kvOn)set(false);});}
