/* ---- v6.13.3 Headbox & Fan Pump: the fan pump faceplate (the model is 07p; plan: claude/headbox-fanpump-v6133-plan.md) ----
   Tap the fan pump on the SPOT picture, the headbox on the WET picture, or the "Fan pump & headbox" button under either.
   Left: the pump's head-flow curves at 60-100% speed (the affinity laws), the curve it's on now, the best efficiency line,
   the system curve and the operating point (it jitters off the curve while the silo's low level has the pump cavitating).
   Right, three tabs: Pump (speed, flow, TDH, power, efficiency, NPSH; AUTO/MANUAL in free play; the TDH's make-up; the
   machine screen), Headbox (the TAPPI total head calculation, step by step) and Learn (the words). It opens over the DCS,
   which already runs the game at 1 min/s. Season, survival and free play; not zen. */
const FUI={open:false,tab:"pump"};
const FTABS=[["pump","Pump"],["hb","Headbox"],["learn","Learn"]];
const FGLOSS=[
  ["Total head (headbox)","The head that spouts the jet at its speed: H = (V/100)² ÷ K, V the jet in fpm (J/W × wire speed); K is 23.165 for feet of water, 53.336 for psi, 1.9304 for inches (TAPPI TIP 0502-17). The gauge reads a little more, ÷ Cv² (0.97²), for the slice's losses."],
  ["Total dynamic head (TDH)","Everything the fan pump pushes against, in feet of water: the lift up to the headbox, the headbox's own pressure, and the friction of the piping, the machine screen and the headbox's header and tube bank. Friction grows with flow squared."],
  ["Pump curve","The head a pump makes at each flow, at one speed: most at shut-off, falling as the flow rises."],
  ["System curve","The head the system needs at each flow: the fixed lift plus everything that grows with flow squared. The pump runs where its curve crosses it."],
  ["Affinity laws","On a VFD: flow follows speed, head follows speed squared, power follows speed cubed. A 10% slower pump makes 19% less head and uses 27% less power."],
  ["Best efficiency point (BEP)","The flow where the pump turns the most of its shaft power into head (84% here). It moves with speed; running well right or left of it wastes power and wears the pump."],
  ["NPSH","Net positive suction head: how far the suction stays above boiling. Available comes from the white water silo's level; required rises with flow. When available falls below required the pump cavitates: vapor pockets collapse in the impeller and the flow and head swing."],
  ["Machine screen","The pressure screen between the fan pump and the headbox. Stickies slowly plug its baskets; its ΔP climbs, the fan pump speeds up to hold the jet, and the next planned outage's wash-up cleans them."],
  ["J/W loop","The fan pump's AUTO: its speed is trimmed to hold the jet at the J/W setpoint. If it reaches full speed the jet sags below the setpoint. In free play its speed can go to MANUAL: then the jet follows the machine."]];
function fpDcsSvg(a){if(S.zen)return "";
  if(a==="SPOT")return `<g data-fan="pump" class="fanhit" role="button" tabindex="0" aria-label="Fan pump faceplate"><title>Fan pump: tap for its curve and faceplate</title><rect x="6" y="202" width="86" height="48" rx="7" class="fanhr"/></g>`;
  if(a==="WET")return `<g data-fan="hb" class="fanhit" role="button" tabindex="0" aria-label="Headbox and fan pump faceplate"><title>Headbox: tap for its total head and the fan pump</title><rect x="12" y="78" width="78" height="74" rx="7" class="fanhr"/></g>`;
  return "";}
function fpDcsRow(a,b){if(S.zen||(a!=="SPOT"&&a!=="WET"))return;const w=kEl("div","vlvrows");w.appendChild(kEl("div","dcssub","Approach flow · tap for the faceplate"));
  const r=kEl("button","vlvrow",`<b>FAN PUMP</b><span>Pump curve & headbox total head</span><i data-fanrow>–</i>`);r.type="button";r.addEventListener("click",()=>openFan(a==="WET"?"hb":"pump"));w.appendChild(r);b.appendChild(w);}
function fpAlarms(L,wet){if(S.zen||!S.fp)return;const F=S.fp,run=F.st==="run";
  if(wet){if(run&&Math.abs(hbJw()-hbJwSp())>0.004)L.push([`J/W DEVIATION · ${hbJw().toFixed(3)} VS ${hbJwSp().toFixed(3)} SP`,Math.abs(hbJw()-hbJwSp())>0.01]);return;}
  if(run&&F.sat)L.push(["FAN PUMP AT FULL SPEED · JET BELOW J/W SETPOINT",true]);
  else if(run&&F.n>0.95)L.push(["FAN PUMP SPEED HI",false]);
  if(fpMan())L.push(["FAN PUMP SPEED ON MANUAL",false]);
  if(run&&F.plug>=FP.plugWarn)L.push([`MACHINE SCREEN ΔP HI · ${fpScrDp().toFixed(1)} PSI`,F.plug>=FP.plugHi]);
  {const m=fpNpshM();if(m!=null&&m<4)L.push([m<0?"FAN PUMP CAVITATING · NPSH BELOW REQUIRED":"FAN PUMP NPSH MARGIN LO",m<0]);}}
function fanOv(){let o=$("fanOv");if(o){const h=vlvHost();if(o.parentNode!==h)h.appendChild(o);return o;}
  o=kEl("div","overlay top vlvov fanov");o.id="fanOv";o.hidden=true;
  o.innerHTML=`<div class="dcs vlvp" role="dialog" aria-modal="true" aria-labelledby="fan-h"><div class="dcsh"><b id="fan-h">FAN PUMP · APPROACH FLOW</b><span class="vlvwh">machine chest + white water → fan pump → machine screen → headbox</span>
      <button type="button" class="dcsx" id="fanClose" aria-label="Close">✕</button>
      <div class="vlvtabs" role="tablist" aria-label="Fan pump">${FTABS.map(([k,l])=>`<button type="button" role="tab" data-ft="${k}">${l}</button>`).join("")}</div></div>
    <div class="vlvb"><div class="vlvtr"><div class="vlvtrh"><span class="dcsleg" id="fanLeg"></span></div>
      <canvas id="fanCv" width="760" height="420" aria-label="Fan pump head against flow: the pump's curves, the system curve and the operating point"></canvas><div class="vlvhl" id="fanHl"></div></div>
      <div class="vlvpane" id="fanPane"></div></div>
    <div class="dcsf vlvf"><span id="fanSt"></span><span class="vlvwh">Curves: H = ${FP.h0}·n² − b·Q² · rated ${FP.rpm} rpm · ${FP.qb.toLocaleString()} gpm at BEP</span></div></div>`;
  vlvHost().appendChild(o);
  $("fanClose").addEventListener("click",()=>closeFan());
  o.addEventListener("click",e=>{if(e.target===o){closeFan();return;}const t=e.target.closest("[data-ft],[data-fm]");if(!t)return;
    if(t.dataset.ft){FUI.tab=t.dataset.ft;fanBuild();}
    else if(t.dataset.fm){fpSetMode(t.dataset.fm);fanBuild();}});
  return o;}
function openFan(tab){if(!S||S.zen)return;const o=fanOv();FUI.open=true;FUI.tab=tab==="hb"?"hb":tab==="learn"?"learn":"pump";o.hidden=false;fanBuild();
  setTimeout(()=>{try{$("fanClose").focus({preventScroll:true});}catch(_){}},0);}
function closeFan(){const o=$("fanOv");if(o)o.hidden=true;FUI.open=false;}
const fanBig=(k,l,sub)=>`<div><small>${l}</small><b data-fv="${k}">–</b>${sub?`<small data-fs="${k}"></small>`:""}</div>`;
function fanBuild(){const o=$("fanOv");if(!o||!FUI.open)return;
  o.querySelectorAll("[data-ft]").forEach(b=>{const on=b.dataset.ft===FUI.tab;b.setAttribute("aria-selected",String(on));b.setAttribute("aria-pressed",String(on));});
  const p=$("fanPane");p.dataset.tab=FUI.tab;
  if(FUI.tab==="pump"){const man=fpManOk();
    p.innerHTML=`<div class="vbig">${fanBig("rpm","Speed",1)}${fanBig("q","Flow",1)}${fanBig("h","TDH",1)}${fanBig("kw","Drive",1)}${fanBig("eff","Efficiency",1)}${fanBig("npsh","NPSH margin",1)}</div>
      <div class="vsub">Control</div>
      <div class="vrow"><span class="seg" role="group" aria-label="Fan pump speed mode"><button type="button" data-fm="auto">AUTO · J/W</button><button type="button" data-fm="man"${man?"":" disabled"}>MANUAL rpm</button></span><span class="vnote" id="fanJw"></span></div>
      ${man?`<div class="vtn" id="fanMan"><span class="vk">Speed</span><input type="range" min="${FP.nMin*100}" max="100" step="0.5" id="fanRpm" aria-label="Fan pump speed, % of ${FP.rpm} rpm"><span class="vnum1"><b id="fanRpmV">–</b></span></div>`:`<p class="vnote vsm">AUTO trims the speed to hold the jet at the J/W setpoint (WET DCS). Manual speed is a free play toy.</p>`}
      <div class="vsub">Total dynamic head</div><div class="fantdh" id="fanTdh"></div>
      <div class="vsub">Machine screen</div><p class="vnote" id="fanScr"></p>`;
    const r=$("fanRpm");if(r)r.addEventListener("input",()=>{fpSetRpm(+r.value);fanRefresh(true);});}
  else if(FUI.tab==="hb")p.innerHTML=`<p class="vwhat">The total head is what sets the jet's speed: the papermaker's calculation (TAPPI TIP 0502-17) from the jet speed you want, J/W × wire speed.</p>
      <div class="fancalc" id="fanCalc"></div>
      <p class="vnote vsm">The fan pump makes this head at the headbox and the rest of its TDH on the way there. On AUTO it holds the J/W setpoint; at full speed, or on a manual speed, the jet gets what head is left and the J/W follows.</p>`;
  else p.innerHTML=`<div class="vgls">${FGLOSS.map(([t,d])=>`<div><b>${t}</b>${d}</div>`).join("")}</div>`;
  fanRefresh(true);}
const fanSet=(o,k,v,sub)=>{const e=o.querySelector(`[data-fv="${k}"]`);if(e&&e.textContent!==v)e.textContent=v;if(sub!=null){const s=o.querySelector(`[data-fs="${k}"]`);if(s&&s.textContent!==sub)s.textContent=sub;}};
function fanRefresh(force){const o=$("fanOv");if(!o||o.hidden||!FUI.open)return;if(S.zen){closeFan();return;}
  const F=fpState(),run=F.st==="run",off=F.st==="off";
  $("fanSt").textContent=off?"Fan pump drive OFF":`${run?(fpMan()?"MANUAL speed":F.sat?"AUTO · AT FULL SPEED":"AUTO · holding J/W"):"Machine down: recirculating at idle speed"} · Day ${Math.floor(S.t/1440)+1} ${clockOf(S.t)}`;
  $("fanLeg").innerHTML=`<i style="background:#4fd18b"></i>now <i style="background:#5c7398"></i>60–100% <i style="background:#ffb02e"></i>system <i style="background:#8ea4c4"></i>BEP`;
  if(FUI.tab==="pump"){const L=rlyKw("fan"),m=fpNpshM();
    fanSet(o,"rpm",off?"0":Math.round(F.n*FP.rpm)+" rpm",off?"":Math.round(F.n*100)+"% of "+FP.rpm);fanSet(o,"q",fmtGpm(F.q),run?"headbox flow":"recirculation");
    fanSet(o,"h",Math.round(F.h)+" ft",(F.h*FP.psiFt).toFixed(1)+" psi");fanSet(o,"kw",fmtHp(F.kw),Math.round(F.kw/L*100)+"% of "+hpRate(L));
    fanSet(o,"eff",off?"–":Math.round(F.eff*100)+"%",off?"":F.n>0.05?"BEP at "+fmtGpm(FP.qb*F.n):"");fanSet(o,"npsh",m==null?"–":(m>=0?"+":"−")+Math.abs(m).toFixed(1)+" ft",m==null?"":m<0?"CAVITATING":m<4?"low: silo level":"silo "+(S.we?Math.round(S.we.L/WE.silo*100):0)+"%");
    o.querySelectorAll("[data-fm]").forEach(b=>b.setAttribute("aria-pressed",String((b.dataset.fm==="man")===fpMan())));
    {const j=$("fanJw");if(j){const t=run?`J/W ${hbJw().toFixed(3)} · setpoint ${hbJwSp().toFixed(3)}${Math.abs(hbJw()-hbJwSp())>0.0005?" · OFF SETPOINT":""}`:"machine down";if(j.textContent!==t)j.textContent=t;j.classList.toggle("bad",run&&Math.abs(hbJw()-hbJwSp())>0.004);}}
    {const r=$("fanRpm"),v=$("fanRpmV"),mm=$("fanMan");if(mm)mm.style.opacity=fpMan()?"1":"0.55";if(r&&document.activeElement!==r)r.value=String(Math.round((fpMan()?F.nm:F.n)*200)/2);if(v)v.textContent=Math.round((fpMan()?F.nm:F.n)*FP.rpm)+" rpm";}
    {const t=$("fanTdh");if(t){const p=fpOn()?F.plug:0,q=F.q,rows=run?[["Lift to the headbox",FP.stat,"#5c7398"],["Headbox pressure",F.hbFt,"#4fd18b"],["Header & tube bank",FP.kHb*q*q,"#7fb2ff"],
        ["Machine screen",FP.kScr*(1+p)*q*q,p>=FP.plugWarn?"#ff8b7f":"#ffb02e"],["Piping",FP.kPipe*q*q,"#c3a6ff"]]:[];const tot=rows.reduce((a,r)=>a+r[1],0)||1;
      const h=run?`<div class="fanbar">${rows.map(r=>`<i style="width:${(r[1]/tot*100).toFixed(1)}%;background:${r[2]}" title="${r[0]}"></i>`).join("")}</div>`+
        rows.map(r=>`<div class="fanrow"><i style="background:${r[2]}"></i><span>${r[0]}</span><b>${r[1].toFixed(1)} ft</b><small>${(r[1]*FP.psiFt).toFixed(1)} psi</small></div>`).join("")+
        `<div class="fanrow tot"><i></i><span>Total dynamic head</span><b>${tot.toFixed(1)} ft</b><small>${(tot*FP.psiFt).toFixed(1)} psi</small></div>`:`<p class="vnote">The machine is down: the pump recirculates; no headbox head.</p>`;
      if(t._h!==h){t._h=h;t.innerHTML=h;}}}
    {const s=$("fanScr");if(s){const dp=fpScrDp(),cl=run?fpScrPsi(F.q,0):0,rd=F.rd;
      const t=!fpOn()?"":(run?`ΔP ${dp.toFixed(1)} psi (${cl.toFixed(1)} clean) · plugging ${Math.round(F.plug*100)}% over design${F.plug>=FP.plugWarn?": stickies in the baskets":""}. Cleared by a planned outage's wash-up.`:"Machine down.")
        +(rd?` Last round: ${rd.dp.toFixed(1)} psi, ${Math.max(0,Math.round((S.t-rd.t)/60))} h ago.`:" The daily Round through screens & refiners reads it.");
      if(s.textContent!==t)s.textContent=t;s.classList.toggle("bad",F.plug>=FP.plugWarn);}}}
  else if(FUI.tab==="hb"){const c=$("fanCalc");if(c){const run2=S.pm==="run";
      const w=S.pmSpeed/DCS_DRAW(),jw=hbJw(),v=jw*w,ps=fpThPsi(v),ft=fpThFt(v),inch=fpThIn(v),g=ps/HB_CV2;
      const h=run2?`<div class="fanstep"><span>Wire speed</span><b>${Math.round(w).toLocaleString()} fpm</b></div>
        <div class="fanstep"><span>× J/W${Math.abs(jw-hbJwSp())>0.0005?` (setpoint ${hbJwSp().toFixed(3)})`:""}</span><b>${jw.toFixed(3)}</b></div>
        <div class="fanstep hi"><span>= Jet speed V</span><b>${Math.round(v).toLocaleString()} fpm</b></div>
        <div class="fanform">Total head H = (V / 100)² ÷ K = (${(v/100).toFixed(2)})² ÷ K</div>
        <div class="fanstep"><span>K 53.336 → psi</span><b>${ps.toFixed(2)} psi</b></div>
        <div class="fanstep"><span>K 23.165 → feet of water</span><b>${ft.toFixed(1)} ft</b></div>
        <div class="fanstep"><span>K 1.9304 → inches of water</span><b>${Math.round(inch)} in</b></div>
        <div class="fanstep hi"><span>Headbox pressure (gauge) = H ÷ Cv², Cv 0.97</span><b>${g.toFixed(2)} psi</b></div>
        <div class="fanstep"><span>Rush / drag = (J/W − 1) × wire</span><b>${(jw-1)*w>=0?"+":"−"}${Math.abs(Math.round((jw-1)*w))} fpm</b></div>`:`<p class="vnote">The machine is down: no jet.</p>`;
      if(c._h!==h){c._h=h;c.innerHTML=h;}}}
  fanDraw(F);}
function fanDraw(F){const cv=$("fanCv");if(!cv)return;const box=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.max(280,box.width||760),ch=Math.round(cw*0.56);
  if(cv.width!==Math.round(cw*dpr)||cv.height!==Math.round(ch*dpr)){cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);}
  const x=cv.getContext("2d");x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,cw,ch);x.fillStyle="#0f1b2d";x.fillRect(0,0,cw,ch);
  const L=44,R=10,T=10,B=30,QM=32000,HM=200,X=q=>L+(cw-L-R)*q/QM,Y=h=>T+(ch-T-B)*(1-h/HM);
  x.font="10px system-ui,sans-serif";x.strokeStyle="#22324f";x.fillStyle="#8ea4c4";x.lineWidth=1;
  for(let q=0;q<=QM;q+=4000){x.beginPath();x.moveTo(X(q),Y(0));x.lineTo(X(q),Y(HM));x.stroke();x.textAlign="center";x.fillText(q/1000+"k",X(q),ch-B+13);}
  for(let h=0;h<=HM;h+=25){x.beginPath();x.moveTo(X(0),Y(h));x.lineTo(X(QM),Y(h));x.stroke();x.textAlign="right";x.fillText(String(h),L-5,Y(h)+3);}
  x.textAlign="center";x.fillText("flow, gpm",L+(cw-L-R)/2,ch-3);x.save();x.translate(11,T+(ch-T-B)/2);x.rotate(-Math.PI/2);x.fillText("head, ft",0,0);x.restore();
  const line=(pts,col,w,dash)=>{x.strokeStyle=col;x.lineWidth=w;x.setLineDash(dash||[]);x.beginPath();pts.forEach(([q,h],i)=>{const px=X(q),py=Y(Math.min(HM,h));i?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();x.setLineDash([]);};
  x.textAlign="left";
  for(const n of [0.6,0.7,0.8,0.9,1]){const c=fpCurve(n,QM,40);line(c,"#5c7398",n===1?1.6:1);const l=c[Math.min(c.length-1,4)];x.fillStyle="#8ea4c4";x.fillText(Math.round(n*100)+"%",X(l[0])+3,Y(l[1])-3);}
  // the best efficiency line: H = n²(h0 − b·qb²) at Q = qb·n
  {const k=FP.h0-FP.b*FP.qb*FP.qb,pts=[];for(let i=0;i<=20;i++){const n=0.3+0.7*i/20;pts.push([FP.qb*n,k*n*n]);}line(pts,"#8ea4c4",1,[2,4]);}
  const run=F.st==="run";
  if(F.st!=="off"&&F.n>0.05)line(fpCurve(F.n,QM,60),"#4fd18b",2.4);
  if(run)line(fpSysCurve(QM,40),"#ffb02e",1.8,[6,4]);
  if(F.st!=="off"){const cav=S.we&&S.we.cav>0&&run?S.we.cav:0,jq=cav?wobW(2.3,5)*900*cav:0,jh=cav?wobW(3.1,8)*8*cav:0,px=X(F.q+jq),py=Y(F.h+jh);
    x.strokeStyle="rgba(255,176,46,.35)";x.setLineDash([2,3]);x.beginPath();x.moveTo(px,Y(0));x.lineTo(px,py);x.lineTo(X(0),py);x.stroke();x.setLineDash([]);
    x.fillStyle=cav?"#ff8b7f":F.sat?"#ff8b7f":"#ffb02e";x.beginPath();x.arc(px,py,6,0,Math.PI*2);x.fill();x.strokeStyle="#0f1b2d";x.lineWidth=2;x.stroke();
    x.fillStyle="#dbe6f6";x.font="600 11px system-ui,sans-serif";const lab=`${fmtGpm(F.q)} · ${Math.round(F.h)} ft · ${Math.round(F.n*100)}%`;x.textAlign=px>cw*0.6?"right":"left";x.fillText(lab,px+(px>cw*0.6?-10:10),py-9);
    if(F.sat||cav){x.fillStyle="#ff8b7f";x.fillText(cav?"CAVITATING":"FULL SPEED: J/W SAGS",px+(px>cw*0.6?-10:10),py+16);}}
  const hl=$("fanHl");if(hl){const t=run?`On the ${Math.round(F.n*100)}% curve where it crosses the system: ${fmtHp(F.kw)} at ${Math.round(F.eff*100)}% efficiency.`:F.st==="idle"?"Machine down: idling on recirculation.":"Drive off.";if(hl.textContent!==t)hl.textContent=t;}}
UI_TICKS.push(()=>{if(FUI.open){const o=$("fanOv");if(!o||o.hidden)return;fanRefresh(false);}
  const r=document.querySelector("[data-fanrow]");if(r&&S&&S.fp){const F=S.fp,t=F.st==="off"?"OFF":`${Math.round(F.n*FP.rpm)} rpm · ${Math.round(F.h)} ft`;if(r.textContent!==t)r.textContent=t;}});
// Escape closes the faceplate first (before the DCS's own handler)
window.addEventListener("keydown",e=>{if(e.key==="Escape"&&FUI.open){e.preventDefault();e.stopPropagation();closeFan();}},true);
G3.fan={state:fpState,solve:fpSolve,setMode:fpSetMode,setRpm:fpSetRpm,head:fpHead,eta:fpEta,kw:fpKw,load:fpLoad,jw:fpJw,npsh:fpNpshM,scrDp:fpScrDp,
  th:{psi:hbThPsi,ft:hbThFt,inch:hbThIn},manOk:fpManOk,round:fpRound,trend:fpTrend,open:openFan,close:closeFan,get ui(){return FUI;},FP};
