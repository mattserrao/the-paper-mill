/* ---- v6.9 The Valves Update: the valves on the DCS pictures, the faceplate and the tuning panel (claude/valves-v69-plan.md) ----
   Each loop's valve is drawn on its area's DCS picture (SPOT, WET, DET) with its % open and mode; tap it to open the
   faceplate. One panel, six tabs: Operate (mode, setpoint, output, the valve, loop health), Tune (Kc / Ti / Td, live or
   staged, a setpoint step with its scores and a ghost of the last one), Bump test (step the output, fit the process,
   Lambda tuning from it), Valve (its trim, stroke, deadband and friction; editable in free play), Learn (the words) and
   Challenges (five tuning puzzles on a sandbox copy of a loop; the mill is untouched).
   While it's open the game runs on the tuning clock (real time, 5x, 20x or 60x: 60x is the knobs' 1 min/s): the loops
   step second by second as the clock reaches them (vlvCatch, 07h), so the trend moves smoothly. Season, survival and
   free play; not zen. */
const VUI={id:null,tab:"op",clk:5,win:10,staged:null,live:true,step:null,ghost:null,lam:1,form:"PI",gl:null,ch:null,chT:{},chRes:null,chPlay:0,bsz:{}};
try{const c=+localStorage.getItem("paper-mill-tclk");if([1,5,20,60].includes(c))VUI.clk=c;}catch(_){}
const VTABS=[["op","Operate"],["tune","Tune"],["bump","Bump test"],["valve","Valve"],["learn","Learn"],["ch","Challenges"]];
const VGLOSS={
  pv:["PV","Process value: what the transmitter measures right now (a level, a pressure, a consistency)."],
  sp:["SP","Setpoint: where you want the PV. In CAS another controller sets it."],
  op:["OP","Output: what the controller asks the valve for, 0 to 100%. The valve may not get there at once (stroke time) or exactly (deadband, stiction)."],
  man:["MAN","Manual: the operator sets the output, the controller watches. Switching back to AUTO is bumpless."],
  auto:["AUTO","Automatic: the controller moves the output to hold the PV at the operator's setpoint."],
  cas:["CAS","Cascade: this loop's setpoint comes from another controller (the master). The inner loop must be faster than the outer one."],
  iman:["IMAN","Initialisation manual: a master whose slaves aren't on CAS. Its output just tracks their setpoints, so it's ready to take over without a bump."],
  kc:["Kc","Controller gain: % of output per % of error (both as a share of the PV's span). Too high and the loop rings; too low and it's lazy."],
  ti:["Ti","Integral time, minutes: how long the integral takes to repeat the proportional action. Shorter is stronger. It's what removes offset."],
  td:["Td","Derivative time, minutes: reacts to how fast the PV is changing. Helps slow processes, amplifies noise. Most mill loops run PI (Td 0)."],
  pf:["PV filter","Seconds of smoothing on the measurement before the controller sees it. Calms a noisy PV but adds lag the loop has to live with."],
  dead:["Dead time","The delay before a move shows up at all: transport, a scanner's travel. Nothing the controller does can beat it."],
  tau:["Time constant τ","For a self-regulating process: how long it takes to get 63% of the way to its new level after a step."],
  int:["Integrating process","A level: a small imbalance between in and out never settles, it just keeps rising or falling. The controller has to find the exact balance."],
  selfreg:["Self-regulating process","Settles at a new value after a step in the output (a consistency, a pressure)."],
  bump:["Bump test","Put the loop in MAN, wait for it to settle, step the output, and watch: how much the PV moves (gain), how long before it starts (dead time) and how fast (τ)."],
  lambda:["Lambda tuning","Pick how quickly the loop should respond (λ, minutes) and calculate Kc and Ti from the bump test. Bigger λ is calmer and more robust."],
  windup:["Windup","The integral keeps growing while the valve is already at its stop, then overshoots when it comes off. These controllers stop integrating at a stop (anti-windup)."],
  bumpless:["Bumpless transfer","Changing mode or tuning doesn't kick the valve: the integral is reset so the output carries on from where it was."],
  db:["Deadband","How far the output has to change before the positioner moves the valve at all."],
  hys:["Hysteresis","The valve lands a little short of where it was asked, depending on which way it came from."],
  stick:["Stiction","Static friction in the packing: the stem sticks, the output builds until it breaks free, then it jumps. It makes a sawtooth cycle no tuning can remove."],
  stroke:["Stroke time","Seconds for the actuator to go from shut to wide open. The valve can't move faster than this."],
  cv:["Cv and trim","How much the valve passes, and how the flow follows the stem: linear (flow ∝ opening) or equal-% (each extra % of travel adds the same share of flow, so the gain rises as it opens)."],
  ff:["Feed-forward","Moving the valve for a disturbance you can measure before it upsets the PV. FV-201 follows machine speed this way; the PID only trims."],
  act:["Action","Reverse: the PV rises as the valve opens, so a high PV closes it. Direct: the opposite (more dilution water, lower consistency)."]};
const vgl=k=>`<button type="button" class="vglq" data-gl="${k}" aria-label="What is ${VGLOSS[k][0]}?">?</button>`;
const vfx=(v,d)=>(v==null||v!==v)?"–":(+v).toFixed(d);
const vlvFmtPV=(d,v)=>vfx(v,d.pv.dp)+" "+d.pv.u;
const vlvBlocked=()=>!S||S.zen||(G3.tut&&G3.tut.on);

/* ---- the DCS pictures: where each valve sits and its symbol ----
   {x, y, id, r: 90 for a vertical line, lx / ly / an: where its two-line tag sits, ld: a leader line to the tag} */
MIMIC.SPOT.vlv=[{x:56,y:172,id:"NV-101",lx:56,ly:188,an:"middle"},{x:307,y:226,id:"LV-104",lx:307,ly:160,an:"middle",ld:[307,176,307,215]}];
MIMIC.SPOT.ln.push(["M0 172 H104 V116",1]);   // (dilution water up into the pulper through NV-101)
MIMIC.WET.vlv=[{x:30,y:30,id:"FV-201",r:-90,lx:44,ly:26,an:"start"},{x:80,y:236,id:"LV-202",lx:80,ly:259,an:"middle"}];
MIMIC.WET.ln.push(["M30 0 V80"],["M0 236 H110",1]);   // (thick stock down into the headbox through FV-201; white water makeup into the silo through LV-202)
MIMIC.DET.ln=MIMIC.DET.ln.map(l=>l[0].startsWith("M640 66 H177")?["M640 30 H177 V80 M300 30 V80 M390 30 V80",1]:l);   // (the steam header feeds the 2nd and 3rd sections through PV-302 and PV-303)
MIMIC.DET.vlv=[{x:300,y:52,id:"PV-302",r:-90,lx:312,ly:49,an:"start"},{x:390,y:52,id:"PV-303",r:-90,lx:402,ly:49,an:"start"},{x:452,y:246,id:"QC-300",lx:470,ly:243,an:"start"}];
function vlvSym(e){const {x,y,id}=e,d=VD[id],an=e.an||"middle";
  const lab=`<text x="${e.lx}" y="${e.ly}" class="vlab" text-anchor="${an}" data-vl="${id}">${id}</text><text x="${e.lx}" y="${e.ly+12}" class="vlab2" text-anchor="${an}" data-vl2="${id}">–</text>`;
  const ld=e.ld?`<line x1="${e.ld[0]}" y1="${e.ld[1]}" x2="${e.ld[2]}" y2="${e.ld[3]}" class="vld"/>`:"";
  if(d.ctl)return `<g class="vsym vctl" data-vlv="${id}" role="button" tabindex="0" aria-label="${id} ${d.name}"><title>${id} · ${d.name}: tap for the faceplate</title><circle cx="${x}" cy="${y}" r="13" class="vbub"/><line x1="${x-13}" y1="${y}" x2="${x+13}" y2="${y}" class="vbubl"/>
    <text x="${x}" y="${y-3}" class="vbt">QC</text><text x="${x}" y="${y+10}" class="vbt">300</text>${lab}</g>`;
  const rot=e.r?` transform="rotate(${e.r} ${x} ${y})"`:"";
  return `<g class="vsym" data-vlv="${id}" role="button" tabindex="0" aria-label="${id} ${d.name}"><title>${id} · ${d.name}: tap for the faceplate</title>${ld}<g${rot}><rect x="${x-14}" y="${y-20}" width="28" height="28" class="vhit"/>
    <path d="M${x-10} ${y-6}L${x-10} ${y+6}L${x} ${y}Z M${x+10} ${y-6}L${x+10} ${y+6}L${x} ${y}Z" class="vbody" data-vb="${id}"/>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y-10}" class="vstem"/><path d="M${x-7} ${y-10}A7 7 0 0 1 ${x+7} ${y-10}Z" class="vact"/></g>${lab}</g>`;}
function vlvDcsSvg(a){const M=MIMIC[a];if(!M||!M.vlv||S.zen)return "";return M.vlv.map(vlvSym).join("");}
// the area's loops as a row of buttons under the picture (big enough to tap on a phone)
function vlvDcsRows(a,b){const M=MIMIC[a];if(!M||!M.vlv||S.zen)return;const w=kEl("div","vlvrows");w.appendChild(kEl("div","dcssub","Control loops · tap for the faceplate"));
  for(const e of M.vlv){const d=VD[e.id],r=kEl("button","vlvrow",`<b>${e.id}</b><span>${d.name}</span><i data-vr="${e.id}">–</i>`);r.type="button";r.addEventListener("click",()=>openVlv(e.id));w.appendChild(r);}b.appendChild(w);}
// a valve's look: the body fills with its opening; amber on MAN, red when its loop is in trouble
function vlvDcsSync(o){o.querySelectorAll("[data-vlv]").forEach(g=>{const id=g.dataset.vlv,d=VD[id],v=vlvView(id);
    const pos=v.pos,op=d.ctl?(v.op*d.out.k).toFixed(0)+" kPa":pos<0.5?"SHUT":pos>99.5?"OPEN":Math.round(pos)+"%",l2=`${op} ${v.m}`;
    const b=g.querySelector("[data-vl2]");if(b.textContent!==l2)b.textContent=l2;
    const tt=`${id} · ${d.name}: PV ${vfx(v.pv,d.pv.dp)} ${d.pv.u}, SP ${vfx(v.sp,d.pv.dp)}. Tap for the faceplate.`,ti=g.querySelector("title");if(ti.textContent!==tt)ti.textContent=tt;
    const st=v.m==="MAN"?"man":vlvAlarm(id)?"bad":v.t?"tch":"ok";if(g.dataset.st!==st){g.dataset.st=st;g.setAttribute("class","vsym"+(d.ctl?" vctl":"")+" st-"+st);}
    const bd=g.querySelector("[data-vb]");if(bd){const f=(0.12+0.88*clamp(pos/100,0,1)).toFixed(2);if(bd.dataset.f!==f){bd.dataset.f=f;bd.style.fillOpacity=f;}}
    const r=o.querySelector(`[data-vr="${id}"]`);if(r){const t=`${l2} · ${vfx(v.pv,d.pv.dp)} ${d.pv.u}`;if(r.textContent!==t)r.textContent=t;r.className="st-"+st;}});}
// is a loop in trouble right now (for the DCS alarm list and the symbol)? cached per UI tick
const VAL={t:-1,h:{}};
function vlvAlarm(id){if(VAL.t!==S.t){VAL.t=S.t;VAL.h={};}if(VAL.h[id]===undefined){const d=VD[id],h=vlvHealth(id,vlvTrace(id,Math.max(10,(d.proc.th/60+(d.proc.tau||0)/60)*6)));VAL.h[id]=["osc","stick","dead","sat"].includes(h.k)?h:null;}return VAL.h[id];}
// the DCS alarm list (50d dcsAlarms calls this for its area)
function vlvAlarms(a,L){if(S.zen)return;for(const d of VDEF){if(d.area!==a)continue;const v=vlvView(d.id);
  if(v.m==="MAN")L.push([`${d.id} ${d.name.toUpperCase()} ON MANUAL`,false]);
  const h=vlvAlarm(d.id);if(h)L.push([`${d.id} ${({osc:"OSCILLATING",stick:"VALVE STICKING",dead:"CYCLING",sat:"VALVE AT LIMIT"})[h.k]}`,h.k!=="sat"]);}}

/* ---- the panel ---- */
function vlvOv(){let o=$("vlvOv");if(o)return o;
  o=kEl("div","overlay top vlvov");o.id="vlvOv";o.hidden=true;
  o.innerHTML=`<div class="dcs vlvp" role="dialog" aria-modal="true" aria-labelledby="vlv-h"><div class="dcsh"><b id="vlv-h"></b><span class="vlvwh" id="vlvWh"></span>
      <button type="button" class="dcsx" id="vlvClose" aria-label="Close">✕</button>
      <div class="vlvtabs" role="tablist" aria-label="Faceplate">${VTABS.map(([k,l])=>`<button type="button" role="tab" data-vt="${k}">${l}</button>`).join("")}</div></div>
    <div class="vlvb"><div class="vlvtr"><div class="vlvtrh"><span class="dcsleg" id="vlvLeg"></span><span class="seg vlvwin" role="group" aria-label="Trend window">${[2,10,30,60].map(m=>`<button type="button" data-vw="${m}">${m} min</button>`).join("")}</span></div>
      <canvas id="vlvCv" width="760" height="300" aria-label="Trend of setpoint, process value and output"></canvas><div class="vlvhl" id="vlvHl"></div></div>
      <div class="vlvpane" id="vlvPane"></div></div>
    <div class="dcsf vlvf"><span id="vlvSt"></span><span class="vlvclk">Tuning clock <span class="seg" role="group" aria-label="Tuning clock">${[[1,"Real time"],[5,"5×"],[20,"20×"],[60,"60×"]].map(([c,l])=>`<button type="button" data-ck="${c}">${l}</button>`).join("")}</span></span></div></div>`;
  document.body.appendChild(o);
  $("vlvClose").addEventListener("click",()=>closeVlv());
  o.addEventListener("click",e=>{if(e.target===o){closeVlv();return;}
    const t=e.target.closest("[data-vt],[data-vw],[data-ck],[data-gl]");if(!t)return;
    if(t.dataset.vt){VUI.tab=t.dataset.vt;vlvBuild();}
    else if(t.dataset.vw){VUI.win=+t.dataset.vw;vlvRefresh();}
    else if(t.dataset.ck){VUI.clk=+t.dataset.ck;try{localStorage.setItem("paper-mill-tclk",String(VUI.clk));}catch(_){}kuiSync();vlvRefresh();}
    else if(t.dataset.gl){const k=t.dataset.gl,p=t.closest(".vlvpane,.vlvtr");VUI.gl=VUI.gl===k?null:k;vlvGloss(p);}});
  o.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();closeVlv();}});
  return o;}
function vlvGloss(p){document.querySelectorAll(".vglpop").forEach(x=>x.remove());const k=VUI.gl;if(!k||!p)return;const b=p.querySelector(`[data-gl="${k}"]`);if(!b)return;
  const pop=kEl("div","vglpop",`<b>${VGLOSS[k][0]}</b> ${VGLOSS[k][1]}`);pop.setAttribute("role","note");(b.closest(".vrow,.vglh,label,div")||p).after(pop);}
function openVlv(id,tab){if(vlvBlocked()||!VD[id])return;const o=vlvOv();if(VUI.id!==id){VUI.step=null;VUI.ghost=null;VUI.staged=null;VUI.gl=null;}
  VUI.id=id;if(tab)VUI.tab=tab;if(VUI.tab==="ch"&&!VUI.ch)VUI.ch=null;o.hidden=false;vlvBuild();kuiSync();
  setTimeout(()=>{try{$("vlvClose").focus({preventScroll:true});}catch(_){}},0);}
function closeVlv(){const o=$("vlvOv");if(o)o.hidden=true;VUI.id=null;VUI.chPlay=0;document.querySelectorAll(".vglpop").forEach(x=>x.remove());kuiSync();}
function vlvBuild(){const o=$("vlvOv");if(!o||!VUI.id)return;const id=VUI.id,d=VD[id];
  $("vlv-h").textContent=`${id} · ${d.name}`;$("vlvWh").textContent=d.where;
  o.querySelectorAll("[data-vt]").forEach(b=>{const on=b.dataset.vt===VUI.tab;b.setAttribute("aria-selected",String(on));b.setAttribute("aria-pressed",String(on));
    b.hidden=b.dataset.vt==="valve"&&d.ctl;});
  if(VUI.tab==="valve"&&d.ctl)VUI.tab="op";
  const p=$("vlvPane");p.replaceChildren();p.dataset.tab=VUI.tab;
  ({op:vpOp,tune:vpTune,bump:vpBump,valve:vpValve,learn:vpLearn,ch:vpCh})[VUI.tab](p,d);
  vlvRefresh(true);}

/* -- Operate -- */
function vpOp(p,d){const id=d.id;
  p.innerHTML=`<div class="vhealth" id="vH"></div>
    <div class="vrow"><span class="vk">Mode ${vgl("man")}</span><span class="seg vmode" role="group" aria-label="Mode">${["MAN","AUTO"].concat(d.cas?["CAS"]:[]).map(m=>`<button type="button" data-m="${m}">${m}</button>`).join("")}</span></div>
    <div class="vbig"><div><small>PV ${vgl("pv")}</small><b id="vPV">–</b><small>${d.pv.n}</small></div>
      <div><small>SP ${vgl("sp")}</small><span class="vnum"><button type="button" data-spd="-1" aria-label="Setpoint down">−</button><input type="number" id="vSP" step="${vspStep(d)}" aria-label="Setpoint"/><button type="button" data-spd="1" aria-label="Setpoint up">+</button></span><small id="vSPn"></small></div>
      <div><small>${d.ctl?"OUT":"OP"} ${vgl("op")}</small><span class="vnum"><button type="button" data-opd="-1" aria-label="Output down">−</button><input type="number" id="vOP" step="1" min="0" max="100" aria-label="Output"/><button type="button" data-opd="1" aria-label="Output up">+</button></span><small id="vOPn"></small></div></div>
    ${d.ctl?"":`<div class="vrow vpos"><span class="vk">Valve</span><div class="vbar" aria-hidden="true"><i id="vBarC"></i><i id="vBarA"></i></div><span id="vPos"></span></div>`}
    <p class="vnote" id="vNote"></p>
    <p class="vwhat">${d.what}</p>
    <div class="vbtns"><button type="button" class="reroll" data-go="tune">Tune ▸</button><button type="button" class="reroll" id="vRev">Standard tuning</button>${d.ctl?d.slaves.map(s=>`<button type="button" class="reroll" data-open="${s}">${s} ▸</button>`).join(""):d.master?`<button type="button" class="reroll" data-open="${d.master}">${d.master} ▸</button>`:""}</div>`;
  p.querySelectorAll("[data-m]").forEach(b=>b.addEventListener("click",()=>{vlvSetMode(id,b.dataset.m);vlvRefresh(true);}));
  const sp=$("vSP"),op=$("vOP");
  sp.addEventListener("change",()=>{vlvSetSP(id,+sp.value);vlvRefresh(true);});
  op.addEventListener("change",()=>{vlvSetOP(id,+op.value);vlvRefresh(true);});
  p.querySelectorAll("[data-spd]").forEach(b=>b.addEventListener("click",()=>{const v=vlvView(id);vlvSetSP(id,v.sp+(+b.dataset.spd)*vspStep(d));vlvRefresh(true);}));
  p.querySelectorAll("[data-opd]").forEach(b=>b.addEventListener("click",()=>{const v=vlvView(id);vlvSetOP(id,v.op+(+b.dataset.opd));vlvRefresh(true);}));
  p.querySelector("[data-go]").addEventListener("click",()=>{VUI.tab="tune";vlvBuild();});
  p.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openVlv(b.dataset.open)));
  $("vRev").addEventListener("click",()=>{vlvRevert(id);vlvRefresh(true);});}
const vspStep=d=>d.pv.u==="kPa"?1:d.pv.u==="%"&&d.pv.hi>50?1:d.pv.dp>=2?0.05:0.1;

/* -- Tune -- */
const VTN={kc:[0.005,50,"","Kc"],ti:[0.02,200,"min","Ti"],td:[0,10,"min","Td"],pf:[0,60,"s","PV filter"]};
// sliders on a log scale (Td and the filter: 0 at the left)
const vToS=(k,v)=>{const [a,b]=VTN[k];if(k==="td"||k==="pf"){if(v<=0)return 0;const lo=k==="td"?0.005:0.5;return Math.round(1000*(0.05+0.95*Math.log(Math.max(v,lo)/lo)/Math.log(b/lo)));}return Math.round(1000*Math.log(v/a)/Math.log(b/a));};
const vOfS=(k,s)=>{const [a,b]=VTN[k];const r3=x=>+(+x).toPrecision(3);if(k==="td"||k==="pf"){if(s<50)return 0;const lo=k==="td"?0.005:0.5;return r3(lo*Math.pow(b/lo,(s/1000-0.05)/0.95));}return r3(a*Math.pow(b/a,s/1000));};
function vTuneNow(id){const L=S.vlv&&S.vlv.lp[id],d=VD[id];return L?{kc:L.kc,ti:L.ti,td:L.td,pf:L.pf||0}:{kc:d.tune.kc,ti:d.tune.ti,td:d.tune.td,pf:0};}
function vpTune(p,d){const id=d.id,cas=()=>vlvView(id).m==="CAS";
  p.innerHTML=`<div class="vhealth" id="vH"></div>
    <div class="vrow"><span class="vk">Changes</span><span class="seg" role="group" aria-label="When changes apply"><button type="button" data-lv="1">Live</button><button type="button" data-lv="0">Apply button</button></span></div>
    ${["kc","ti","td","pf"].map(k=>`<div class="vtn"><span class="vk">${VTN[k][3]} ${vgl(k)}</span><input type="range" min="0" max="1000" step="1" data-ts="${k}" aria-label="${VTN[k][3]}"/><span class="vnum1"><input type="number" step="any" data-tn="${k}" aria-label="${VTN[k][3]} value"/><small>${VTN[k][2]}</small></span></div>`).join("")}
    <div class="vbtns"><button type="button" class="reroll vpri" id="vApply" hidden>Apply</button><button type="button" class="reroll" id="vStd">Standard ${vfx(d.tune.kc,3)} / ${vfx(d.tune.ti,2)}</button></div>
    <div class="vsub">Setpoint step ${vgl("bumpless")}</div>
    <div class="vbtns"><button type="button" class="reroll" data-st="-1">Step SP −${vstepSz(d)} ${d.pv.u}</button><button type="button" class="reroll" data-st="1">Step SP +${vstepSz(d)} ${d.pv.u}</button></div>
    <p class="vnote" id="vStN"></p>
    <div class="qcsgrid vscore" id="vSc"></div>`;
  const get=()=>VUI.staged||vTuneNow(id);
  const set=(k,v)=>{const t=Object.assign({},get(),{[k]:v});if(VUI.live){vlvSetTune(id,{[k]:v});VUI.staged=null;}else VUI.staged=t;vTuneSync(p,id);vlvRefresh(true);};
  p.querySelectorAll("[data-ts]").forEach(r=>r.addEventListener("input",()=>set(r.dataset.ts,vOfS(r.dataset.ts,+r.value))));
  p.querySelectorAll("[data-tn]").forEach(r=>r.addEventListener("change",()=>{const k=r.dataset.tn,[a,b]=VTN[k];set(k,clamp(+r.value||0,k==="td"||k==="pf"?0:a,b));}));
  p.querySelectorAll("[data-lv]").forEach(b=>b.addEventListener("click",()=>{VUI.live=b.dataset.lv==="1";if(VUI.live&&VUI.staged){vlvSetTune(id,VUI.staged);VUI.staged=null;}vTuneSync(p,id);}));
  $("vApply").addEventListener("click",()=>{if(VUI.staged){vlvSetTune(id,VUI.staged);VUI.staged=null;}vTuneSync(p,id);vlvRefresh(true);});
  $("vStd").addEventListener("click",()=>{vlvSetTune(id,{kc:d.tune.kc,ti:d.tune.ti,td:d.tune.td,pf:0});VUI.staged=null;vTuneSync(p,id);vlvRefresh(true);});
  p.querySelectorAll("[data-st]").forEach(b=>b.addEventListener("click",()=>{if(cas()||vlvView(id).m==="MAN")return;vStepGo(id,+b.dataset.st);vlvRefresh(true);}));
  vTuneSync(p,id);}
const vstepSz=d=>d.id==="FV-201"?0.25:d.pv.u==="kPa"?5:d.id==="QC-300"?0.5:d.pv.u==="%"&&d.pv.hi>50?5:0.2;
function vTuneSync(p,id){const t=VUI.staged||vTuneNow(id);
  p.querySelectorAll("[data-ts]").forEach(r=>{if(actEl(r)!==r)r.value=vToS(r.dataset.ts,t[r.dataset.ts]);});
  p.querySelectorAll("[data-tn]").forEach(r=>{if(actEl(r)!==r)r.value=t[r.dataset.tn];});
  p.querySelectorAll("[data-lv]").forEach(b=>b.setAttribute("aria-pressed",String((b.dataset.lv==="1")===VUI.live)));
  const ap=$("vApply");if(ap)ap.hidden=!VUI.staged;}
// a setpoint step: keep the response, score it, and keep the last one as a ghost on the trend
function vStepGo(id,dir){const d=VD[id],v=vlvView(id);if(VUI.step&&VUI.step.id===id&&VUI.step.pts.length>5)VUI.ghost=VUI.step;
  const sp1=v.sp+dir*vstepSz(d);vlvSetSP(id,sp1);const v2=vlvView(id);VUI.step={id,t0:S.t+(S.vlv&&S.vlv.sub?S.vlv.sub/60:0),sp0:v.sp,sp1:v2.sp,dir,pts:[],op0:v.pos};}
// the step's scores: overshoot, settling time (inside 5% of the step), IAE and valve travel
function vStepScore(st){const tr=vlvTrace(st.id,120),pts=[];let trav=0,lp=null;
  for(let i=0;i<tr.t.length;i++){if(tr.t[i]<st.t0)continue;pts.push([tr.t[i]-st.t0,tr.pv[i]]);if(lp!=null)trav+=Math.abs(tr.pos[i]-lp);lp=tr.pos[i];}
  st.pts=pts;const h=st.sp1-st.sp0;if(!h||pts.length<3)return null;
  let peak=0,iae=0,settle=null;for(let i=0;i<pts.length;i++){const [t,y]=pts[i],f=(y-st.sp0)/h;peak=Math.max(peak,f);if(i)iae+=Math.abs(st.sp1-y)*(t-pts[i-1][0]);}
  for(let i=pts.length-1;i>=0;i--){if(Math.abs((pts[i][1]-st.sp1)/h)>0.05){settle=i<pts.length-1?pts[i+1][0]:null;break;}if(i===0)settle=0;}
  return {os:Math.max(0,(peak-1)*100),settle,iae,trav,el:pts[pts.length-1][0]};}

/* -- Bump test -- */
function vpBump(p,d){const id=d.id;VUI.bsz[id]=VUI.bsz[id]||d.bsz||5;
  p.innerHTML=`<div class="vsub">How it works ${vgl("bump")}</div>
    <ol class="vsteps"><li>The loop goes to MAN and holds its output while the PV settles a moment.</li><li>The output steps by the size below.</li><li>The PV is recorded until it settles (or, for a level, long enough to read its new slope).</li><li>A model is fitted and the loop goes back to its mode, bumpless.</li></ol>
    ${d.ctl?`<p class="vnote">On QC-300 the step goes to the steam setpoints: PV-302 and PV-303 must be on CAS.</p>`:""}
    <div class="vrow"><span class="vk">Step size</span><span class="vnum"><button type="button" data-bs="-1" aria-label="Smaller">−</button><input type="number" id="vBs" min="1" max="25" step="1" aria-label="Step size"/><button type="button" data-bs="1" aria-label="Bigger">+</button></span><small>% of output</small></div>
    <div class="vbtns"><button type="button" class="reroll vpri" id="vBgo">Start bump test</button><button type="button" class="reroll" id="vBst" hidden>Stop</button></div>
    <p class="vnote" id="vBn"></p><div class="vbres" id="vBr"></div>`;
  const bs=$("vBs");bs.value=VUI.bsz[id];bs.addEventListener("change",()=>{VUI.bsz[id]=clamp(Math.round(+bs.value||5),1,25);bs.value=VUI.bsz[id];});
  p.querySelectorAll("[data-bs]").forEach(b=>b.addEventListener("click",()=>{VUI.bsz[id]=clamp(VUI.bsz[id]+(+b.dataset.bs),1,25);bs.value=VUI.bsz[id];}));
  $("vBgo").addEventListener("click",()=>{if(!vlvBump(id,VUI.bsz[id]))$("vBn").textContent=d.ctl?"Put PV-302 and PV-303 on CAS first.":"Another bump test is running.";vlvRefresh(true);});
  $("vBst").addEventListener("click",()=>{vlvBumpStop();vlvRefresh(true);});
  vBumpRes(d);}
function vBumpRes(d){const box=$("vBr");if(!box)return;const W=S.vlv,r=W&&W.btRes&&W.btRes.id===d.id?W.btRes:null;if(box._r===r&&box._k===VUI.lam+VUI.form)return;box._r=r;box._k=VUI.lam+VUI.form;
  if(!r){box.innerHTML="";return;}
  const t=vLambda(d,r,VUI.lam,VUI.form),u=d.ctl?"%":"%";
  const model=r.type==="int"?`<b>Integrating</b> ${vgl("int")}: the PV ramps at ${vfx(r.Ki,4)} % of span a minute for every 1% of output; dead time ${vfx(r.th,2)} min.`
    :`<b>Self-regulating</b> ${vgl("selfreg")}: gain ${vfx(r.K,3)} (% of span per % ${u} output), time constant τ ${vfx(r.tau,2)} min ${vgl("tau")}, dead time θ ${vfx(r.th,2)} min ${vgl("dead")}.`+(r.settled===false?" <i>It hadn't quite settled: the gain may read low.</i>":"");
  box.innerHTML=`<div class="vsub">Result</div><p class="vmodel">${model}${r.cut?" <i>Stopped early: the level was near its limit.</i>":""}</p>
    <div class="vrow"><span class="vk">Lambda ${vgl("lambda")}</span><span class="seg" role="group" aria-label="Response">${["Conservative","Moderate","Aggressive"].map((l,i)=>`<button type="button" data-ls="${i}">${l}</button>`).join("")}</span>${r.type==="fo"?`<span class="seg" role="group" aria-label="Form">${["PI","PID"].map(f=>`<button type="button" data-lf="${f}">${f}</button>`).join("")}</span>`:""}</div>
    <div class="qcsgrid"><div><small>λ</small><b>${vfx(t.lam,2)}</b><small>min</small></div><div><small>Kc</small><b>${t.kc}</b><small>now ${vfx(vTuneNow(d.id).kc,3)}</small></div><div><small>Ti</small><b>${t.ti}</b><small>min · now ${vfx(vTuneNow(d.id).ti,2)}</small></div><div><small>Td</small><b>${t.td}</b><small>min</small></div></div>
    <div class="vbtns"><button type="button" class="reroll vpri" id="vUse">Use these</button></div>`;
  box.querySelectorAll("[data-ls]").forEach(b=>{b.setAttribute("aria-pressed",String(+b.dataset.ls===VUI.lam));b.addEventListener("click",()=>{VUI.lam=+b.dataset.ls;vBumpRes(d);});});
  box.querySelectorAll("[data-lf]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.lf===VUI.form));b.addEventListener("click",()=>{VUI.form=b.dataset.lf;vBumpRes(d);});});
  $("vUse").addEventListener("click",()=>{vlvSetTune(d.id,{kc:t.kc,ti:t.ti,td:t.td});VUI.tab="tune";vlvBuild();});}

/* -- Valve -- */
function vpValve(p,d){const id=d.id,L=()=>S.vlv&&S.vlv.lp[id],vv=()=>(L()&&L().v)||d.valve,ed=!!S.free;
  const row=(k,lab,u,min,max,step,note)=>`<div class="vtn"><span class="vk">${lab} ${vgl(k)}</span>${ed?`<input type="range" min="${min}" max="${max}" step="${step}" data-vv="${k}" aria-label="${lab}"/>`:"<span></span>"}<span class="vnum1"><b data-vvv="${k}"></b><small>${u}</small></span></div><p class="vnote vsm">${note}</p>`;
  p.innerHTML=`<div class="vchar"><svg viewBox="0 0 220 150" id="vChr" role="img" aria-label="Valve characteristic"></svg><div><div class="vrow"><span class="vk">Trim ${vgl("cv")}</span>${ed?`<span class="seg" role="group" aria-label="Trim"><button type="button" data-ch="lin">Linear</button><button type="button" data-ch="eq">Equal-%</button></span>`:`<b id="vChN"></b>`}</div>
      <p class="vnote vsm">Medium: ${d.medium}. Action: ${d.act>0?"reverse":"direct"} ${vgl("act")} (${d.act>0?"the PV rises as it opens":"the PV falls as it opens"}).</p></div></div>
    ${row("stroke","Stroke time","s",2,60,1,"Shut to wide open. Slow valves can't follow a fast controller.")}
    ${row("db","Deadband","%",0,5,0.1,"Output changes smaller than this don't move the valve.")}
    ${row("hys","Hysteresis","%",0,5,0.1,"It lands short, depending on the direction it came from.")}
    ${row("stick","Stiction","%",0,10,0.1,"The stem sticks until the output has moved this far, then jumps.")}
    ${ed?`<div class="vbtns"><button type="button" class="reroll" id="vVstd">Valve back to standard</button></div>`:`<p class="vnote">In free play you can change these to see what a worn or sticky valve does to a loop.</p>`}`;
  if(ed){p.querySelectorAll("[data-vv]").forEach(r=>r.addEventListener("input",()=>{vlvSetValve(id,{[r.dataset.vv]:+r.value});vValveSync(p,d);vlvRefresh(true);}));
    p.querySelectorAll("[data-ch]").forEach(b=>b.addEventListener("click",()=>{vlvSetValve(id,{ch:b.dataset.ch});vValveSync(p,d);vlvRefresh(true);}));
    $("vVstd").addEventListener("click",()=>{vlvSetValve(id,Object.assign({},d.valve));vValveSync(p,d);vlvRefresh(true);});}
  vValveSync(p,d);}
function vValveSync(p,d){const L=S.vlv&&S.vlv.lp[d.id],v=(L&&L.v)||d.valve,vw=vlvView(d.id);
  p.querySelectorAll("[data-vv]").forEach(r=>{if(actEl(r)!==r)r.value=v[r.dataset.vv];});p.querySelectorAll("[data-vvv]").forEach(b=>{const k=b.dataset.vvv;b.textContent=k==="stroke"?String(v[k]):(+v[k]).toFixed(1);});
  p.querySelectorAll("[data-ch]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.ch===v.ch)));const cn=$("vChN");if(cn)cn.textContent=v.ch==="eq"?"Equal-% (R 50)":"Linear";
  const sv=$("vChr");if(sv){let a="",b="";for(let i=0;i<=40;i++){const x=i/40;a+=(i?"L":"M")+(20+x*190).toFixed(1)+" "+(130-vch(v,x)*115).toFixed(1);b+=(i?"L":"M")+(20+x*190).toFixed(1)+" "+(130-x*115).toFixed(1);}
    const px=20+clamp(vw.pos/100,0,1)*190,py=130-vch(v,vw.pos/100)*115;
    sv.innerHTML=`<path d="M20 15V130H210" class="vax"/><path d="${b}" class="vref"/><path d="${a}" class="vcur"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" class="vpt"/><text x="115" y="146" class="vat">stem travel %</text><text x="8" y="72" class="vat" transform="rotate(-90 8 72)">flow</text><text x="${px.toFixed(0)}" y="${(py-9).toFixed(0)}" class="vat vptl">${Math.round(vw.pos)}%</text>`;}}

/* -- Learn -- */
function vpLearn(p,d){p.innerHTML=`<p class="vwhat">A control loop measures something (PV), compares it with where you want it (SP) and moves a valve (OP) to close the gap. Tuning is how hard and how patiently it does that. The game's loops start well tuned; break them, fix them, and watch what the mill does.</p>
  <div class="vgls">${Object.keys(VGLOSS).map(k=>`<div><b>${VGLOSS[k][0]}</b><span>${VGLOSS[k][1]}</span></div>`).join("")}</div>
  <p class="vnote">Rules of thumb: tune the inner loop of a cascade first; bump test from a steady process; on a dead-time loop keep λ at least the dead time; a level loop wants a long Ti (it's integrating already); if no tuning works, suspect the valve.</p>`;}

/* -- Challenges -- */
function vpCh(p,d){const sv=S.vlvc||{};
  if(!VUI.ch){p.innerHTML=`<p class="vwhat">Five puzzles on a sandbox copy of a loop: the mill keeps running untouched. Set the tuning, run it, and beat a careful engineer's Lambda tuning for three stars.</p>
      <div class="vchl">${VCHAL.map(c=>`<button type="button" class="vchc" data-c="${c.id}"><b>${c.title}</b><span>${c.loops.join(" + ")} · ${c.min} min</span><i aria-label="${sv[c.id]||0} of 3 stars">${"★".repeat(sv[c.id]||0)}${"☆".repeat(3-(sv[c.id]||0))}</i></button>`).join("")}</div>`;
    p.querySelectorAll("[data-c]").forEach(b=>b.addEventListener("click",()=>{VUI.ch=b.dataset.c;VUI.chRes=null;VUI.chT={};vlvBuild();}));return;}
  const c=VCH[VUI.ch];for(const id of c.loops)if(!VUI.chT[id])VUI.chT[id]=Object.assign({},VD[id].tune,c.start[id]);
  p.innerHTML=`<div class="vbtns"><button type="button" class="linkb" id="vChBk">← All challenges</button></div><div class="vsub">${c.title}</div><p class="vwhat">${c.brief}</p>
    ${c.loops.map(id=>`<div class="vsub">${id} · ${VD[id].name}</div>${["kc","ti","td"].map(k=>`<div class="vtn"><span class="vk">${VTN[k][3]} ${vgl(k)}</span><input type="range" min="0" max="1000" step="1" data-cs="${id}:${k}" aria-label="${id} ${VTN[k][3]}"/><span class="vnum1"><input type="number" step="any" data-cn="${id}:${k}" aria-label="${id} ${VTN[k][3]} value"/><small>${VTN[k][2]}</small></span></div>`).join("")}`).join("")}
    <div class="vbtns"><button type="button" class="reroll vpri" id="vChGo">Run</button><button type="button" class="reroll" id="vChRs">Starting tuning</button><button type="button" class="reroll" id="vChHt">Hint</button></div>
    <p class="vnote" id="vChHint" hidden></p><div class="qcsgrid" id="vChSc"></div>`;
  const sync=()=>{p.querySelectorAll("[data-cs]").forEach(r=>{const [id,k]=r.dataset.cs.split(":");if(actEl(r)!==r)r.value=vToS(k,VUI.chT[id][k]);});p.querySelectorAll("[data-cn]").forEach(r=>{const [id,k]=r.dataset.cn.split(":");if(actEl(r)!==r)r.value=VUI.chT[id][k];});};
  p.querySelectorAll("[data-cs]").forEach(r=>r.addEventListener("input",()=>{const [id,k]=r.dataset.cs.split(":");VUI.chT[id][k]=vOfS(k,+r.value);sync();}));
  p.querySelectorAll("[data-cn]").forEach(r=>r.addEventListener("change",()=>{const [id,k]=r.dataset.cn.split(":"),[a,b]=VTN[k];VUI.chT[id][k]=clamp(+r.value||0,k==="td"?0:a,b);sync();}));
  $("vChBk").addEventListener("click",()=>{VUI.ch=null;VUI.chRes=null;VUI.chPlay=0;vlvBuild();});
  $("vChRs").addEventListener("click",()=>{VUI.chT={};vlvBuild();});
  $("vChHt").addEventListener("click",()=>{const h=$("vChHint");h.hidden=!h.hidden;h.textContent=({shake:"Too much gain and too short a Ti. Bring Kc down a lot, then try Ti near the tub's 20-minute time constant.",
    wake:"An integrating level needs a long Ti, but this Kc is tiny. Lambda for a level: Kc = (2λ+θ)/(Ki(λ+θ)²), Ti = 2λ+θ. The chest's Ki is about 0.25 %/min per % of output.",
    stick:"Every reversal is a stick-slip jump. A slower, gentler loop reverses less: lower Kc, Ti about the tub's 20 minutes.",
    inner:"The inner steam loop rings at this tuning. Calm PV-303 first (Kc about 0.5, Ti 0.5 min); then the moisture loop can be quicker.",
    patience:"3 minutes of dead time. Lambda with λ = 3 min: Kc about 0.05, Ti about the 0.33-minute lag. Mostly integral, very little gain."})[c.id];});
  $("vChGo").addEventListener("click",()=>{const r=vlvChallenge(c.id,VUI.chT),st=vlvStars(c.id,r.score);vlvChSave(c.id,st);VUI.chRes=Object.assign(r,{st,ref:vlvChRef(c.id)});VUI.chPlay=performance.now();vChScore();vlvRefresh(true);});
  sync();vChScore();}
function vChScore(){const b=$("vChSc"),r=VUI.chRes;if(!b)return;if(!r){b.innerHTML="";return;}
  b.innerHTML=`<div><small>Stars</small><b class="vstar">${"★".repeat(r.st)}${"☆".repeat(3-r.st)}</b><small>${r.unstable?"unstable":r.st===3?"as good as a careful engineer":"keep tuning"}</small></div><div><small>Score</small><b>${isFinite(r.score)?vfx(r.score,1):"∞"}</b><small>engineer ${vfx(r.ref,1)} (lower is better)</small></div><div><small>IAE</small><b>${vfx(r.iae,1)}</b><small>% of span × min</small></div><div><small>Valve</small><b>${Math.round(r.trav)}%</b><small>travel · ${r.rev} reversals</small></div>`;}

/* ---- refresh (5 a second) and the trend ---- */
function vlvRefresh(force){const o=$("vlvOv");if(!o||o.hidden||!VUI.id)return;const id=VUI.id,d=VD[id],v=vlvView(id),tab=VUI.tab,W=S.vlv;
  o.querySelectorAll("[data-vw]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.vw===VUI.win)));{const w=o.querySelector(".vlvwin"),h=tab==="ch"&&!!VUI.chRes;if(w.hidden!==h)w.hidden=h;}
  o.querySelectorAll("[data-ck]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.ck===VUI.clk)));
  {const t=v.t?"On the valve model · 1 s updates":"Standard tuning on the game's own model · a point every 15 s",s=`Day ${Math.floor(S.t/1440)+1} · ${clockOf(S.t)} · ${t}`,e=$("vlvSt");if(e.textContent!==s)e.textContent=s;}
  const tr=vlvTrace(id,VUI.win);
  if(tab!=="ch"){const h=vlvHealth(id,vlvTrace(id,Math.max(10,(d.proc.th+(d.proc.tau||0))/60*6))),hb=$("vH");
    if(hb){const s=`<b class="vh-${h.k}">${h.txt}</b><span>${h.why}</span><small>${h.tip}</small>`;if(hb._h!==s){hb._h=s;hb.innerHTML=s;}}}
  if(tab==="op"){o.querySelectorAll("[data-m]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.m===v.m));b.disabled=d.ctl&&b.dataset.m!=="MAN"&&b.dataset.m!=="AUTO";});
    const pv=$("vPV"),sp=$("vSP"),op=$("vOP");pv.textContent=vlvFmtPV(d,v.pv);
    if(actEl(sp)!==sp)sp.value=vfx(v.sp,d.pv.dp);sp.disabled=v.m==="CAS";$("vSPn").textContent=v.m==="CAS"?`from ${d.master} (CAS)`:d.id==="FV-201"?`grade ${C.grade} target ${bwStd().toFixed(2)} lb`:`${vF(d.spLim)[0]}–${vF(d.spLim)[1]} ${d.pv.u}`;
    if(actEl(op)!==op)op.value=vfx(v.op,1);op.readOnly=v.m!=="MAN";$("vOPn").textContent=d.ctl?`→ ${Math.round(v.op*d.out.k)} kPa 3rd section`:v.m==="MAN"?"you set this":"the controller sets this";
    if(!d.ctl){const L=W&&W.lp[id],tg=L?L.tgt:v.pos;$("vBarC").style.left=clamp(v.op,0,100)+"%";$("vBarA").style.width=clamp(v.pos,0,100)+"%";
      $("vPos").textContent=v.pos<0.5?"SHUT":v.pos>99.5?"WIDE OPEN":`${vfx(v.pos,1)}% open`;}
    const n=$("vNote"),ff=d.ff&&W&&W.B?W.B.ff:null;
    const nt=v.m==="IMAN"?"PV-302 and PV-303 aren't on CAS: this controller is tracking them (IMAN).":d.id==="FV-201"?`Speed feed-forward ${vgl("ff")}: ${v.t&&ff!=null?(ff>=0?"+":"")+ff.toFixed(1)+"%":"built in"}. The scanner reads ${WE.dead} min late.`:d.cas&&v.m!=="CAS"?`Off CAS: QC-300 can't hold the moisture until this is back on CAS.`:"";
    if(n._h!==nt){n._h=nt;n.innerHTML=nt;}
    const rv=$("vRev");rv.disabled=!v.t||VGRP(id).every(x=>vIsDef(x));}
  if(tab==="tune"){const st=VUI.step&&VUI.step.id===id?vStepScore(VUI.step):null,g=$("vSc"),n=$("vStN");
    const nt=v.m==="CAS"?`On CAS: step the moisture setpoint on ${d.master}, or put this loop on AUTO to step it here.`:v.m==="MAN"?"On MAN: put it on AUTO to step the setpoint.":st?`Step ${st.el.toFixed(1)} min ago.`:"Step the setpoint to see the response; the last one stays on the trend as a ghost.";
    if(n.textContent!==nt)n.textContent=nt;
    const s=st?`<div><small>Overshoot</small><b>${vfx(st.os,0)}%</b><small>of the step</small></div><div><small>Settled</small><b>${st.settle!=null?vfx(st.settle,1):"–"}</b><small>min (to 5%)</small></div><div><small>IAE</small><b>${vfx(st.iae,2)}</b><small>${d.pv.u} × min</small></div><div><small>Valve travel</small><b>${vfx(st.trav,0)}%</b><small>since the step</small></div>`:"";
    if(g._h!==s){g._h=s;g.innerHTML=s;}
    if(force)vTuneSync($("vlvPane"),id);}
  if(tab==="bump"){const b=W&&W.bt&&W.bt.id===id?W.bt:null,other=W&&W.bt&&W.bt.id!==id;$("vBgo").hidden=!!b;$("vBst").hidden=!b;$("vBgo").disabled=!!other||S.pm!=="run"&&(id==="FV-201"||id==="QC-300");
    const n=$("vBn"),h=vlvHealth(id,vlvTrace(id,10));
    const nt=b?`${b.t<b.base?"Settling":"Recording the response"} · ${Math.max(0,Math.ceil((b.base+b.dur-b.t)/60))} min of mill time left (${Math.ceil((b.base+b.dur-b.t)/VUI.clk)} s at ${VUI.clk===1?"real time":VUI.clk+"×"}).`
      :other?`${W.bt.id} is bump testing; one at a time.`:S.pm!=="run"&&(id==="FV-201"||id==="QC-300")?"The machine is down: no sheet for the scanner.":h.k!=="steady"?`Heads up: the loop isn't steady (${h.txt.toLowerCase()}). A bump test from a moving process gives a poor model.`:d.shutOK&&v.pos<0.5?"The valve is shut and the silo overflowing: the level can't show the step. Draw the silo down first (more forming vacuum, or a higher setpoint).":"Ready. Faster on a quicker tuning clock.";
    if(n.textContent!==nt)n.textContent=nt;vBumpRes(d);}
  if(tab==="valve")vValveSync($("vlvPane"),d);
  // legend and trend
  const lg=tab==="ch"&&VUI.chRes?`<span><i style="background:#e8eef8"></i>SP</span><span><i style="background:#4fd18b"></i>PV</span><span><i style="background:#ffb02e"></i>${VD[VCH[VUI.ch].loops[0]].ctl?"OUT":"OP"}</span>${VCH[VUI.ch].loops[1]?`<span><i style="background:#c792ff"></i>${VCH[VUI.ch].loops[1]} PV</span>`:""}<span>sandbox</span>`
    :`<span><i style="background:#e8eef8"></i>SP</span><span><i style="background:#4fd18b"></i>PV ${d.pv.u}</span><span><i style="background:#ffb02e"></i>${d.ctl?"OUT":"OP"} %</span>${d.ctl?"":`<span><i style="background:#7fb2ff"></i>valve %</span>`}${VUI.ghost&&VUI.ghost.id===id?`<span><i style="background:#8ea4c4"></i>last step</span>`:""}`;
  const le=$("vlvLeg");if(le._h!==lg){le._h=lg;le.innerHTML=lg;}
  vlvDraw(tab==="ch"&&VUI.chRes?null:tr,d);}
function vlvDraw(tr,d){const cv=$("vlvCv");if(!cv)return;const box=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.max(280,box.width||560),Wc=Math.round(cw*dpr),Hc=Math.round(Math.max(190,cw*0.42)*dpr);
  if(cv.width!==Wc||cv.height!==Hc){cv.width=Wc;cv.height=Hc;}const x=cv.getContext("2d"),W=cv.width,H=cv.height,f=dpr,L=42*f,R=W-30*f,T=22*f,B=H-22*f;
  x.fillStyle="#0f1b2d";x.fillRect(0,0,W,H);x.font=`600 ${Math.round(11*f)}px system-ui,sans-serif`;
  let ser;if(!tr){const r=VUI.chRes,c=VCH[VUI.ch],o=r.trace,el=VUI.chPlay?Math.min(1,(performance.now()-VUI.chPlay)/5000):1,n=Math.max(2,Math.floor(o.t.length*el));
    ser={t:o.t.slice(0,n),sp:o.sp.slice(0,n),pv:o.pv.slice(0,n),op:o.op.slice(0,n),pos:VD[c.loops[0]].ctl?null:o.pos.slice(0,n),in:o.in.pv.length?o.in.pv.slice(0,n):null,t0:0,t1:c.min,d:VD[c.loops[0]]};d=ser.d;}
  else{const tn=tr.t.length?tr.t[tr.t.length-1]:S.t;ser={t:tr.t,sp:tr.sp,pv:tr.pv,op:tr.op,pos:d.ctl?null:tr.pos,t0:tn-VUI.win,t1:tn,d};}
  // PV scale: the data's range, never tighter than a few tolerances
  const all=ser.sp.concat(ser.pv);let lo=Math.min(...all),hi=Math.max(...all);if(!all.length){lo=vSpan(d)[0];hi=vSpan(d)[1];}
  const tol=vTol(d)*3,mid=(lo+hi)/2;if(hi-lo<tol*2){lo=mid-tol;hi=mid+tol;}const pad=(hi-lo)*0.1;lo-=pad;hi+=pad;
  const X=t=>L+(t-ser.t0)/(ser.t1-ser.t0||1)*(R-L),Y=v=>B-(v-lo)/(hi-lo)*(B-T),Yo=v=>B-v/100*(B-T);
  x.strokeStyle="rgba(140,170,210,.16)";x.lineWidth=1;for(let k=0;k<=4;k++){const y=T+(B-T)*k/4;x.beginPath();x.moveTo(L,y);x.lineTo(R,y);x.stroke();}
  x.fillStyle="#8ea4c4";x.textAlign="right";for(let k=0;k<=4;k++){const v=hi-(hi-lo)*k/4;x.fillText(vfx(v,d.pv.dp),L-5*f,T+(B-T)*k/4+4*f);}
  x.textAlign="left";for(let k=0;k<=4;k++)x.fillText(String(100-25*k),R+5*f,T+(B-T)*k/4+4*f);
  x.textAlign="center";const span=ser.t1-ser.t0;for(let k=0;k<=4;k++){const t=ser.t0+span*k/4;x.fillText(tr?(k===4?"now":"−"+vfx(span*(4-k)/4,span<5?1:0)+" min"):vfx(t,0)+" min",L+(R-L)*k/4,H-6*f);}
  const line=(ts,vs,col,w,yf,dash)=>{if(!vs||vs.length<2)return;x.strokeStyle=col;x.lineWidth=w*f;x.setLineDash(dash?dash.map(q=>q*f):[]);x.beginPath();let on=false;
    for(let i=0;i<vs.length;i++){if(ts[i]<ser.t0)continue;const px=X(ts[i]),py=yf(vs[i]);if(!on){x.moveTo(px,py);on=true;}else x.lineTo(px,py);}x.stroke();x.setLineDash([]);};
  x.save();x.beginPath();x.rect(L,T-2,R-L,B-T+4);x.clip();
  // the ghost: the last setpoint step's response, laid over this one's start
  if(tr&&VUI.ghost&&VUI.ghost.id===d.id&&VUI.step&&VUI.step.id===d.id){const g=VUI.ghost,s=VUI.step,k=(s.sp1-s.sp0)/((g.sp1-g.sp0)||1);
    line(g.pts.map(p=>s.t0+p[0]),g.pts.map(p=>s.sp0+(p[1]-g.sp0)*k),"#8ea4c4",1.6,Y,[4,3]);}
  line(ser.t,ser.op,"#ffb02e",1.6,Yo);if(ser.pos)line(ser.t,ser.pos,"#7fb2ff",1.2,Yo);
  if(ser.in){const ip=ser.in;let a=Math.min(...ip),b=Math.max(...ip);if(b-a<10){const m=(a+b)/2;a=m-5;b=m+5;}line(ser.t,ip,"#c792ff",1.4,v=>B-(v-a)/(b-a)*(B-T));}
  line(ser.t,ser.sp,"#e8eef8",1.6,Y,[6,4]);line(ser.t,ser.pv,"#4fd18b",2.4,Y);
  // the bump test's step, marked
  const bt=tr&&S.vlv&&S.vlv.bt&&S.vlv.bt.id===d.id?S.vlv.bt:null;if(bt&&bt.t>=bt.base){const ts=ser.t1-(bt.t-bt.base)/60;x.strokeStyle="#ffb02e";x.setLineDash([3*f,3*f]);x.beginPath();x.moveTo(X(ts),T);x.lineTo(X(ts),B);x.stroke();x.setLineDash([]);}
  x.restore();
  x.fillStyle="#8ea4c4";x.textAlign="left";x.fillText(d.pv.u,4*f,12*f);x.textAlign="right";x.fillText(tr||!VD[VCH[VUI.ch].loops[0]].ctl?"% open":"% out",W-4*f,12*f);
  if(tr&&tr.t.length<2){x.fillStyle="#c3d3ea";x.textAlign="center";x.fillText("Collecting the trend…",W/2,H/2);}}
UI_TICKS.push(()=>{if(VUI.id){const o=$("vlvOv");if(!o||o.hidden)return;if(S.zen){closeVlv();return;}vlvRefresh(false);if(VUI.chPlay&&performance.now()-VUI.chPlay>5200)VUI.chPlay=0;}});
// smoother trend while the challenge plays back or the clock runs fast
{let raf=0;const tick=()=>{raf=requestAnimationFrame(tick);if(VUI.id&&VUI.tab==="ch"&&VUI.chPlay){const t=performance.now();if(t-(tick.l||0)>60){tick.l=t;vlvRefresh(false);}}};raf=requestAnimationFrame(tick);}
G3.vlvUI=()=>VUI.id?VUI.clk/60:0;   // (kuiSync, 50b: the tuning clock while a faceplate is open)
G3.vlvOpen=openVlv;G3.vlvClose=closeVlv;G3.VUI=VUI;   // (tests)
