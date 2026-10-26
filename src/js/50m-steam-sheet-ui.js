/* ---- v6.13 Steam and Sheet: the screens (plan: claude/v613-steam-sheet-plan.md, part D) ----
   STEAM (a DCS picture like the others): the three dryer sections' syphons, the thermocompressor and PDC-304, the condenser
   and the condensate back to the power house, and the hood's air with the fog fan. PROFILE: consistency and solids from the
   headbox to the reel on a log scale, section by section, with the grade's standard as a ghost line and the "Ride the
   sheet" camera. BREAKS: the break risk now (the tightrope gauge and a waterfall of what makes it likelier) and the break
   log, each break's causes as a fishbone. ENERGY: steam, power and condensate per ton against the grade's standard and the
   best day. The side elevation across the top of the WET and DET pictures, and the SPC charts on QCS. All read only. ---- */
DCS_SCREENS.splice(DCS_SCREENS.findIndex(s=>s[0]==="DET")+1,0,["STM","STEAM","Steam & air: syphons, condensate, hood"]);
DCS_SCREENS.push(["PROF","PROFILE","Machine profile: solids, headbox to reel"],["BRK","BREAKS","Breaks: the risk now, the causes, the log"],["NRG","ENERGY","Steam, power and condensate per ton"]);
DCS_SCR.STM={title:"STEAM & AIR · DCS"};DCS_SCR.PROF={title:"MACHINE PROFILE"};DCS_SCR.BRK={title:"SHEET BREAKS"};DCS_SCR.NRG={title:"ENERGY"};
AREA_N.STM="Steam & air";
TR_DEF.STM=["dp3","dpneed","hoodH","cret"];TR_DEF.PROF=["couchSol","pressSol","moist"];TR_DEF.BRK=["brkr","tbf","stk"];TR_DEF.NRG=["stpt","kwht","usdt","cret"];
const MT6=(x,y,k,t,f,c)=>[x,y,k,t,f,c];
const sf1=v=>v==null||v!==v?"–":(+v).toFixed(1);
MIMIC.STM={title:"STEAM & AIR",h:322,trends:[["dp3","3rd section ΔP psi","#7fb2ff",0,10],["hoodH","Hood humidity g/kg","#ffb02e",0,260]],
  eq:[[8,10,98,44,"POWER HOUSE"],[478,58,104,34,"TC-304"],[40,118,170,54,"1ST SECTION"],[228,118,170,54,"2ND SECTION"],[416,118,204,54,"3RD SECTION"],
    [8,206,84,34,"CONDENSER","s"],[110,214,510,22,"CONDENSATE RECEIVERS","s"],[40,264,230,40,"DRYER HOOD"],[288,264,100,40,"EXHAUST FAN"],[404,264,104,40,()=>LV("heatrec")?"SUPPLY · HEAT REC":"SUPPLY FAN"],[524,264,100,40,"FOG FAN"]],
  ln:[["M106 32 H632 V118 H620"],["M530 32 V58"],["M500 92 V118"],["M318 32 V118"],["M125 32 V118"],["M610 118 V75 H582",1],["M228 150 H210",1],["M40 145 H24 V206",1],
    ["M200 172 V214",1],["M388 172 V214",1],["M610 172 V214",1],["M110 225 H100 V54",1],["M270 284 H288"],["M388 284 H404"]],
  tags:[MT6(52,68,"stst","STEAM",()=>S.dry&&S.dry.steam>0.5?sf1(S.dry.steam)+" t/h":"–"),MT6(52,82,"stret","RETURN",()=>S.stm?Math.round(S.stm.ret*100)+"%":"–"),MT6(52,96,"stmk","MAKEUP",()=>S.stm?fmtGpm(GPM(S.stm.mk)):"–"),
    MT6(125,166,"st1s","STEAM",()=>Math.round(knobVal("st1"))+" psig"),MT6(313,166,"st2s","STEAM",()=>S.dry?Math.round(dryP2(S.dry))+" psig":"–"),MT6(518,166,"st3s","STEAM",()=>S.dry?Math.round(S.dry.st3)+" psig":"–"),
    MT6(125,188,"dp1","ΔP",()=>S.stm?sf1(S.stm.dp[0])+" psi":"–",()=>S.stm&&S.pm==="run"&&S.stm.dp[0]<stmNeed(0)?"bad":""),MT6(125,200,"nd1","NEED",()=>S.pm==="run"?sf1(stmNeed(0))+" psi":"–"),
    MT6(313,188,"dp2","ΔP",()=>S.stm?sf1(S.stm.dp[1])+" psi":"–",()=>S.stm&&S.pm==="run"&&S.stm.dp[1]<stmNeed(1)?"bad":""),MT6(313,200,"nd2","NEED",()=>S.pm==="run"?sf1(stmNeed(1))+" psi":"–"),
    MT6(518,188,"dp3","ΔP",()=>S.stm?sf1(S.stm.dp[2])+" psi":"–",()=>S.stm&&S.pm==="run"&&S.stm.dp[2]<stmNeed(2)?"bad":""),MT6(518,200,"dpneed","NEED",()=>S.pm==="run"?sf1(stmNeed(2))+" psi":"–"),
    MT6(430,108,"bt3","BLOW",()=>S.stm&&S.pm==="run"?Math.round(S.stm.bt[2]*100)+"%":"–",()=>S.stm&&S.stm.bt[2]>STM.btWaste?"warn":""),MT6(540,108,"tcmax","REACH",()=>sf1(stmTcMax())+" psi",()=>stmTcMax()<stmSp()?"bad":""),
    MT6(50,254,"btwaste","WASTE",()=>S.stm?sf1(S.stm.waste)+" t/h":"–",()=>S.stm&&S.stm.waste>0.3?"warn":""),MT6(365,250,"cret","RETURN",()=>S.stm?Math.round(S.stm.ret*100)+"%":"–",()=>S.stm&&S.stm.ret<0.8?"warn":""),
    MT6(155,256,"hoodH","HUMIDITY",()=>S.stm&&S.pm==="run"?Math.round(S.stm.H)+" g/kg":"–",()=>S.stm&&S.stm.H>STM.Hhi?"bad":S.stm&&S.stm.H<STM.Hlo&&S.pm==="run"?"warn":""),MT6(155,318,"dew","DEW PT",()=>S.stm&&S.pm==="run"?Math.round(stmDew(S.stm.H))+" °C":"–"),
    MT6(338,318,"exh","EXH",()=>S.stm?Math.round(S.stm.exh)+"% "+(S.stm.exhM==="auto"?"AUTO":"MAN"):"–"),MT6(456,318,"sup","SUP",()=>S.stm?Math.round(S.stm.sup)+"% "+(S.stm.supM==="auto"?"AUTO":"MAN"):"–"),
    MT6(574,256,"hum","ROOM RH",()=>S.stm?Math.round(S.stm.hum)+"%":"–",()=>S.stm&&S.stm.hum>74?"bad":""),MT6(574,318,"fog","",()=>motStatus("fog")!=="run"||active("fogfan")?"DOWN":"RUNNING",()=>motStatus("fog")!=="run"||active("fogfan")?"bad":""),
    MT6(572,22,"air","AIR COILS",()=>S.stm?sf1(S.stm.air)+" t/h":"–")]};
MIMIC.STM.vlv=[{x:530,y:46,id:"PDC-304",r:-90,lx:544,ly:50,an:"start"}];
function stmAlarms(L){const T=S.stm;if(!T||S.zen)return;const run=S.pm==="run",al=(on,t,hi)=>{if(on)L.push([t,hi]);};
  for(let s=0;s<3;s++)al(run&&T.dp[s]<stmNeed(s)-0.5,`${STMN[s].toUpperCase()} SECTION ΔP LOW · SHORT OF WHAT THE SPEED NEEDS`,true);
  al(stmTcMax()<stmSp()-0.5,"TC-304 MOTIVE STEAM LIMITED · CHECK THE HAND VALVE",true);
  al(run&&T.bt[2]>STM.btWaste,"3RD SECTION BLOW-THROUGH HI · STEAM TO THE CONDENSER",false);
  al(run&&T.H>STM.Hhi,T.drip>0?"HOOD HUMIDITY HI · CONDENSATE DRIPPING":"HOOD HUMIDITY HI · DRYING SLOWED",T.drip>0);al(run&&T.H<STM.Hlo,"HOOD HUMIDITY LO · HEATING TOO MUCH AIR",false);
  al(T.sup>T.exh*1.02,"HOOD SUPPLY OVER EXHAUST · SPILLING INTO THE MACHINE ROOM",false);al(T.hum>74,T.roof>0?"MACHINE ROOM RH HI · ROOF DRIPPING":"MACHINE ROOM RH HI",T.roof>0);
  al(T.ret<0.8,"CONDENSATE RETURN LO · MAKEUP UP",false);}

/* ---- the side elevation across the top of the WET and DET pictures, with the break risk at its end ---- */
function shStripAdd(b,a){if(S.zen)return;const w=kEl("div","shstrip",`<canvas data-shs="${a}" aria-label="The sheet from the headbox to the reel: consistency and solids" role="img"></canvas><button type="button" class="reroll kstd" data-shride>▶ Ride the sheet</button>`);
  w.querySelector("[data-shride]").addEventListener("click",()=>shRide());b.prepend(w);}
function shStripDraw(){const cv=document.querySelector("#dcsOv canvas[data-shs]");if(!cv||S.zen)return;const key=Math.floor(S.t*4)+"|"+(cv.clientWidth||0);if(cv._k===key)return;cv._k=key;
  const [x,cw]=trCanvas(cv,86),P2=profNow(),X0=26,X1=cw-130,L=P2[P2.length-1][0],X=d=>X0+(X1-X0)*d/L,run=S.pm==="run";
  // the sheet: thicker and bluer where it's wetter (log of the water a ton of fiber carries)
  for(let i=0;i<P2.length-1;i++){const a=P2[i],b2=P2[i+1],w=v=>Math.log10(100/v-1+0.1),t=clamp((w(a[3])+0.2)/2.5,0,1);
    x.strokeStyle=run?`rgb(${Math.round(150+90*(1-t))},${Math.round(150+60*(1-t))},${Math.round(200+40*t)})`:"rgba(160,170,190,.4)";x.lineWidth=2+7*t;x.beginPath();x.moveTo(X(a[0]),43);x.lineTo(X(b2[0]),43);x.stroke();}
  x.font="600 10px system-ui,sans-serif";x.textAlign="center";
  // (labels on two rows, so neighbours never overlap)
  const pick=[[0,"Headbox"],[4,"Flatboxes"],[5,"Couch"],[7,LV("shoe")?"Shoe":"Press"],[9,"1st"],[10,"2nd"],[12,"Reel"]];
  pick.forEach(([i,n],k)=>{const p=P2[i],up=k%2===0;x.fillStyle="rgba(190,205,230,.85)";x.fillText(n,X(p[0]),up?13:25);x.fillStyle="#e8f0ff";x.fillText((p[3]<3?p[3].toFixed(2):p[3].toFixed(0))+"%",X(p[0]),up?66:78);
    x.strokeStyle="rgba(190,205,230,.3)";x.lineWidth=1;x.beginPath();x.moveTo(X(p[0]),up?16:28);x.lineTo(X(p[0]),38);x.moveTo(X(p[0]),48);x.lineTo(X(p[0]),up?56:68);x.stroke();});
  // cans (a flooded one dark blue: what the IR gun would see; the DCS itself only knows the drive load)
  // the break risk gauge at the end
  const B=brkRisk(),R=B.R*SH.rcal,gx=cw-114,lv=clamp(Math.log(R)/Math.log(4),-0.5,1);x.textAlign="left";x.fillStyle="rgba(190,205,230,.85)";x.fillText("BREAK RISK",gx,16);
  x.fillStyle="#1d2b44";x.fillRect(gx,24,100,12);x.fillStyle=R<1.05?"#4fd18b":R<1.6?"#ffb02e":"#ff6b5e";x.fillRect(gx+50,24,lv*50,12);x.fillStyle="#e8f0ff";x.fillRect(gx+49.5,21,1,18);
  x.font="700 14px system-ui,sans-serif";x.fillText(run?"× "+R.toFixed(2):"–",gx,56);x.font="600 10px system-ui,sans-serif";x.fillStyle="rgba(190,205,230,.85)";
  const tp=brTop(B)[0];x.fillText(run&&tp&&tp[0]!=="base"?tp[1].slice(0,21):"normal running",gx,72);}

/* ---- the custom screens ---- */
const XS={};
// PROFILE
XS.PROF={b(b){b.appendChild(kEl("div","dcstr",`<div class="dcssub">Consistency and solids, headbox to reel · log scale · ghost: the grade's standard</div><canvas id="prCv" aria-label="Machine profile chart" role="img"></canvas>
    <div class="prbtn"><button type="button" class="reroll" id="prRide">▶ Ride the sheet</button><small>A camera that travels with the web from the slice to the reel.</small></div>`));
    b.appendChild(kEl("div","dcsctl",`<div class="dcssub">Station by station</div><div class="qtab" id="prTab"></div>`));
    $("prRide").addEventListener("click",()=>shRide());},
  r(){const cv=$("prCv");if(!cv)return;const key=Math.floor(S.t*4)+"|"+(cv.clientWidth||0);if(cv._k===key)return;cv._k=key;
    const H=300,[x,cw]=trCanvas(cv,H),P2=profNow(),P0=profNow(true),L=P2[P2.length-1][0],l=40,r=cw-10,T=24,Bm=H-40,X=d=>l+(r-l)*d/L,Y=v=>Bm-(Math.log10(clamp(v,0.1,100))+1)/3*(Bm-T);
    // section bands
    const SEC=[["Headbox",0,1],["Forming",1,15],["Couch",15,17],["Presses",17,25],["Draw",25,27],["1st",27,37],["2nd",37,46.5],["3rd",46.5,58.5],["Reel",58.5,L]];
    SEC.forEach(([n,a,b2],i)=>{x.fillStyle=i%2?"rgba(255,255,255,.03)":"rgba(255,255,255,.07)";x.fillRect(X(a),T,X(b2)-X(a),Bm-T);x.fillStyle="rgba(190,205,230,.8)";x.font="600 11px system-ui,sans-serif";x.textAlign="center";x.fillText(n,(X(a)+X(b2))/2,T-8);});
    x.strokeStyle="rgba(190,205,230,.25)";x.lineWidth=1;x.font="600 10px system-ui,sans-serif";x.textAlign="right";
    for(const v of [0.1,0.3,1,3,10,30,100]){x.beginPath();x.moveTo(l,Y(v));x.lineTo(r,Y(v));x.stroke();x.fillStyle="rgba(190,205,230,.7)";x.fillText(v+"%",l-4,Y(v)+3);}
    const line=(pts,col,w,dash)=>{x.strokeStyle=col;x.lineWidth=w;x.setLineDash(dash||[]);x.beginPath();pts.forEach((p,i)=>i?x.lineTo(X(p[0]),Y(p[3])):x.moveTo(X(p[0]),Y(p[3])));x.stroke();x.setLineDash([]);};
    line(P0,"rgba(190,205,230,.45)",2,[5,5]);if(S.pm==="run")line(P2,"#7fb2ff",3);
    P2.forEach((p,i)=>{x.fillStyle="#e8f0ff";x.beginPath();x.arc(X(p[0]),Y(p[3]),3.5,0,7);x.fill();});
    x.textAlign="center";x.fillStyle="rgba(190,205,230,.85)";x.font="600 10px system-ui,sans-serif";
    // water removed a ton of paper between stations (t water / t)
    const wpt=c=>100/c-1;for(let i=1;i<P2.length;i++){const d=wpt(P2[i-1][3])-wpt(P2[i][3]);if(d>0.05&&X(P2[i][0])-X(P2[i-1][0])>26)x.fillText(d>=10?Math.round(d)+" t":d.toFixed(1)+" t",(X(P2[i-1][0])+X(P2[i][0]))/2,Bm+14);}
    x.textAlign="left";x.fillText("water out a ton of paper, between stations",l,Bm+30);
    const tb=$("prTab"),h=`<table><tr><th>Station</th><th>Section</th><th>Now</th><th>Standard</th></tr>${P2.map((p,i)=>`<tr><td>${p[2]}</td><td>${p[1]}</td><td>${S.pm==="run"?(p[3]<3?p[3].toFixed(2):p[3].toFixed(1))+"%":"–"}</td><td>${P0[i][3]<3?P0[i][3].toFixed(2):P0[i][3].toFixed(1)}%</td></tr>`).join("")}</table>`;if(tb._h!==h){tb._h=h;tb.innerHTML=h;}}};
// BREAKS
const BRUI={sel:-1};
XS.BRK={b(b){b.appendChild(kEl("div","dcstr",`<div class="dcssub">The break risk now · the open draw on a tightrope: the sheet's tension against its wet strength</div><canvas id="brCv" aria-label="Break risk and what makes it likelier" role="img"></canvas>`));
    b.appendChild(kEl("div","dcsctl",`<div class="dcssub">Break log · newest first · tap one for its fishbone</div><div class="qtab" id="brLog"></div><canvas id="brFish" aria-label="Fishbone of a break's causes" role="img"></canvas>`));
    $("brLog").addEventListener("click",e=>{const t=e.target.closest("[data-bri]");if(!t)return;BRUI.sel=+t.dataset.bri;const f=$("brFish");if(f)f._k="";XS.BRK.r();});},
  r(){const cv=$("brCv");if(!cv)return;const B=brkRisk(),key=Math.floor(S.t*2)+"|"+(cv.clientWidth||0);
    if(cv._k!==key){cv._k=key;const H=290,[x,cw]=trCanvas(cv,H),run=S.pm==="run",R=B.R*SH.rcal;
      // the tightrope: tension (left) against wet strength (right); the rope sags toward the weaker side
      const K=S.knob,xx=K&&K.any&&K.x?K.x:null,ps=xx&&xx.ps!=null?xx.ps:psStd()+shPsAdd()+shCsAdd(),T=Math.max(0.7,1+0.42*(knobVal("draw")-drawStd())),ws=Math.exp(0.05*(ps-44)),q=T/ws;
      x.fillStyle="rgba(190,205,230,.85)";x.font="600 12px system-ui,sans-serif";x.fillText(`Tension ${T.toFixed(2)} (draw ${knobVal("draw").toFixed(2)}%, needs ${drawReq().toFixed(2)}%)`,12,22);x.textAlign="right";x.fillText(`Wet strength ${ws.toFixed(2)} (press solids ${ps.toFixed(1)}%)`,cw-12,22);x.textAlign="left";
      const mid=cw/2,sag=clamp((q-1)*60,-30,40);x.strokeStyle=q>1.1?"#ff6b5e":q>1?"#ffb02e":"#4fd18b";x.lineWidth=3;x.beginPath();x.moveTo(30,50);x.quadraticCurveTo(mid,50+20+sag,cw-30,50);x.stroke();
      x.fillStyle="#e8f0ff";[30,cw-30].forEach(px=>x.fillRect(px-3,40,6,22));
      x.font="700 22px system-ui,sans-serif";x.fillText(run?"× "+R.toFixed(2):"machine down",12,112);x.font="600 11px system-ui,sans-serif";x.fillStyle="rgba(190,205,230,.85)";x.fillText("break risk against a well-run machine on standard (× 1.00)",12,128);
      // the waterfall: each contributor's share on a log scale, so they add
      const xs=B.parts.map(p=>[p[1],Math.log(p[2])]);if(B.ev>0.001)xs.push(["Upsets and events",Math.log(1+B.ev/Math.max(0.01,P.gradeBrk*SH.rcal))]);xs.push(["Calibration (programs, grade)",Math.log(SH.rcal)]);
      const span=Math.max(0.3,xs.reduce((m,a)=>m+Math.abs(a[1]),0)),bx=230,bw=cw-bx-60,Zx=bx+bw/2,Xs=v=>Zx+v/span*bw;let acc=0;
      xs.forEach(([n,v],i)=>{const y=142+i*14;if(y>H-6)return;x.fillStyle="rgba(190,205,230,.85)";x.font="600 10px system-ui,sans-serif";x.textAlign="left";x.fillText(n,12,y+8);
        const a0=Xs(acc),a1=Xs(acc+v);x.fillStyle=v>0.002?"#ff6b5e":v<-0.002?"#4fd18b":"rgba(190,205,230,.3)";x.fillRect(Math.min(a0,a1),y,Math.max(1,Math.abs(a1-a0)),9);acc+=v;
        x.textAlign="right";x.fillText((v>=0?"+":"−")+Math.round(Math.abs(Math.exp(v)-1)*100)+"%",cw-6,y+8);});
      x.strokeStyle="rgba(190,205,230,.4)";x.beginPath();x.moveTo(Zx,138);x.lineTo(Zx,H-4);x.stroke();}
    const L=(S.brl||[]).slice().reverse(),lg=$("brLog"),WH={reel:"at the reel",dryer:"into the dryers",press:"at the wet end"};
    const h=L.length?`<table><tr><th>When</th><th>Where</th><th>Risk</th><th>Top causes</th></tr>${L.slice(0,12).map((r,i)=>`<tr data-bri="${i}" class="${i===BRUI.sel?"sel":""}" role="button" tabindex="0"><td>${dhm(r.t)}</td><td>${WH[r.loc]||r.loc}</td><td>× ${(r.R*SH.rcal).toFixed(2)}</td><td>${r.top.map(t=>`${t[1]} ${Math.round(t[2]*100)}%`).join(" · ")}</td></tr>`).join("")}</table>`:"<p>No sheet breaks yet this run.</p>";
    if(lg._h!==h){lg._h=h;lg.innerHTML=h;}
    const f=$("brFish"),r0=L[BRUI.sel<0?0:BRUI.sel];if(f){const k2=(r0?r0.t:"none")+"|"+(f.clientWidth||0);if(f._k!==k2){f._k=k2;brFish(f,r0);}}}};
// a break's fishbone: the six bones, each contributor on its bone, the heaviest in red
function brFish(cv,r){const H=220,[x,cw]=trCanvas(cv,H);x.font="600 11px system-ui,sans-serif";
  if(!r){x.fillStyle="rgba(190,205,230,.8)";x.fillText("No breaks to explain yet.",12,24);return;}
  const bones=["Machine","Method","Material","Measurement","Crew & events","Environment"],sx=20,ex=cw-130,my=H/2;
  x.strokeStyle="#9ab3d6";x.lineWidth=3;x.beginPath();x.moveTo(sx,my);x.lineTo(ex,my);x.stroke();
  x.fillStyle="#ff6b5e";x.beginPath();x.moveTo(ex,my-22);x.lineTo(ex+10,my);x.lineTo(ex,my+22);x.fill();x.fillStyle="#e8f0ff";x.font="700 12px system-ui,sans-serif";x.fillText("Break "+({reel:"at the reel",dryer:"into the dryers",press:"at the wet end"}[r.loc]||""),ex+14,my+4);
  const items={};for(const [k,v] of Object.entries(r.c||{}))if(v>1.001){(items[BRKM[k]]||(items[BRKM[k]]=[])).push([BRKN[k],v]);}
  if(r.ev>0.005)(items["Crew & events"]||(items["Crew & events"]=[])).push(["Upsets and events",1+r.ev]);
  if(r.top&&r.top[0]&&(r.top[0][0]==="turnup"||r.top[0][0]==="knob"))(items.Machine||(items.Machine=[])).push([r.top[0][1],2]);
  const top=r.top&&r.top[0]?r.top[0][1]:"";
  bones.forEach((n,i)=>{const up=i%2===0,bx2=sx+60+Math.floor(i/2)*((ex-sx-80)/3),ty=up?18:H-18;x.strokeStyle="#5f7fa8";x.lineWidth=2;x.beginPath();x.moveTo(bx2,ty);x.lineTo(bx2+50,my);x.stroke();
    x.fillStyle="#cfe0ff";x.font="700 11px system-ui,sans-serif";x.fillText(n,bx2-10,up?12:H-4);
    (items[n]||[]).forEach(([t,v],j)=>{const yy=up?32+j*14:H-32-j*14;x.fillStyle=t===top?"#ff6b5e":"#e8f0ff";x.font="600 10px system-ui,sans-serif";x.fillText(`${t} ×${v.toFixed(2)}`,bx2+6+j*2,yy);});
    if(!(items[n]||[]).length){x.fillStyle="rgba(190,205,230,.4)";x.font="600 10px system-ui,sans-serif";x.fillText("normal",bx2+8,up?32:H-32);}});}
// ENERGY
XS.NRG={b(b){b.appendChild(kEl("div","qcshead",`<div class="qcsv" id="ngV"></div>`));
    b.appendChild(kEl("div","dcsctl",`<div class="dcssub">Where the steam goes · t/h</div><canvas id="ngCv" aria-label="Steam use" role="img"></canvas>`));
    b.appendChild(kEl("div","dcsctl",`<div class="dcssub">What moves it</div><p class="dcsfield">Drier sheet out of the presses (press load, the steam box, the shoe press) means less water for the dryers. Flooded cans and a humid hood make the rest of the cans work harder. Blow-through over 15% of a section's steam goes to the condenser. Every point of condensate that doesn't come back is fresh water the boiler has to heat. Heat recovery on the hood saves most of the supply air's steam. Power follows the drives' loads: refining, vacuum, presses and the dryers' drive.</p>`));},
  r(){const T=S.stm,v=$("ngV");if(!T||!v)return;const K=T.kpi,run=S.pm==="run",B=T.best||(T.best={});
    if(run&&(S.rates.prod||0)>20){const d=Math.floor(S.t/1440);if(B.d!==d){B.d=d;B.st=Math.min(B.st||9,K.st);B.kwh=Math.min(B.kwh||9e3,K.kwh);B.usd=Math.min(B.usd||9e3,K.usd);}}
    const tile=(n,val,sub,cls)=>`<div${cls?` class="${cls}"`:""}><small>${n}</small><b>${val}</b><small>${sub}</small></div>`;
    const h=[tile("Steam per ton",run?K.st.toFixed(2)+" t/t":"–",`best so far ${B.st&&B.st<9?B.st.toFixed(2):"–"}`),tile("Power per ton",run?Math.round(K.kwh)+" kWh/t":"–",`best so far ${B.kwh&&B.kwh<9e3?Math.round(B.kwh):"–"}`),
      tile("Energy per ton",run?money(K.usd)+"/t":"–","steam and power"),tile("Condensate return",Math.round(T.ret*100)+"%","standard "+Math.round(STM.ret*100)+"%",T.ret<0.8?"qout":""),
      tile("Boiler makeup",fmtGpm(GPM(T.mk)),"fresh water to heat"),tile("Blow-through waste",sf1(T.waste)+" t/h","to the condenser",T.waste>0.3?"qout":""),tile("Supply air coils",sf1(T.air)+" t/h",LV("heatrec")?"with heat recovery":"no heat recovery"),
      tile("Power",Math.round(K.kw||0).toLocaleString()+" kW","drives and plant")].join("");if(v._h!==h){v._h=h;v.innerHTML=h;}
    const cv=$("ngCv");if(!cv)return;const key=Math.floor(S.t)+"|"+(cv.clientWidth||0);if(cv._k===key)return;cv._k=key;const H=140,[x,cw]=trCanvas(cv,H),D=S.dry,st=D?D.steam:0;
    const parts=[["1st section",st*STM.share[0],"#7fb2ff"],["2nd section",st*STM.share[1],"#5f8fd8"],["3rd section",st*STM.share[2],"#3f6fb8"],["Air coils",T.air,"#c08bff"],["To the condenser",T.waste,"#ff6b5e"],["Vented (break)",S.pm==="break"?D.vent||0:0,"#ffb02e"]];
    const tot=Math.max(1,parts.reduce((a,p)=>a+p[1],0));let xx=10;const w=cw-20;
    parts.forEach(([n,q,c])=>{const ww=q/tot*w;if(ww<0.5)return;x.fillStyle=c;x.fillRect(xx,20,ww,34);if(ww>60){x.fillStyle="#0f1b2d";x.font="700 11px system-ui,sans-serif";x.fillText(n,xx+4,34);x.fillText(sf1(q)+" t/h",xx+4,48);}xx+=ww;});
    x.fillStyle="rgba(190,205,230,.85)";x.font="600 11px system-ui,sans-serif";x.fillText(`Total ${sf1(tot)} t/h · the boiler makes up to ${DRY.boiler} t/h · condensate back ${Math.round(T.ret*100)}%`,10,76);
    parts.forEach(([n,q,c],i)=>{x.fillStyle=c;x.fillRect(10+(i%3)*((cw-20)/3),88+Math.floor(i/3)*22,10,10);x.fillStyle="rgba(190,205,230,.9)";x.fillText(`${n}: ${sf1(q)} t/h`,24+(i%3)*((cw-20)/3),97+Math.floor(i/3)*22);});}};

/* ---- SPC on the QCS screen: individuals and moving-range charts, limits, Cpk, run rules ---- */
const SPC={k:"bw",win:480};
const SPCV={bw:["Basis weight","bw","lb"],moist:["Moisture","moist","%"],rct:["Ring crush","rct","lbf"],stfi:["STFI CD","stfi","kN/m"]};
function spcSpec(k){const sp=QSPEC[C.grade]||QSPEC["24"];if(k==="bw"){const b=qBw(C.grade);return [b[0],b[1]];}if(k==="moist")return [sp.m[0],sp.m[1]];if(k==="rct")return [rctSpec(),null];return [stfiSpec(),null];}
function spcData(k){const t1=S.t,s=tagSeries(SPCV[k][1],t1-SPC.win,t1),out=[];let last=-1e9;for(let i=0;i<s.t.length;i++)if(s.t[i]-last>=10){out.push(s.v[i]);last=s.t[i];}return out;}
// Western Electric rules: 1 beyond 3σ, 2 of 3 beyond 2σ (same side), 4 of 5 beyond 1σ, 8 on one side
function spcRules(v,m,sg){const f=new Array(v.length).fill(0),z=v.map(a=>(a-m)/sg);
  for(let i=0;i<v.length;i++){if(Math.abs(z[i])>3)f[i]=1;
    if(i>=2){for(const sgn of [1,-1]){const c=[z[i],z[i-1],z[i-2]].filter(a=>a*sgn>2).length;if(c>=2&&z[i]*sgn>2)f[i]=f[i]||2;}}
    if(i>=4){for(const sgn of [1,-1]){const c=[0,1,2,3,4].filter(j=>z[i-j]*sgn>1).length;if(c>=4&&z[i]*sgn>1)f[i]=f[i]||3;}}
    if(i>=7){const sg2=Math.sign(z[i]);if(sg2&&[0,1,2,3,4,5,6,7].every(j=>Math.sign(z[i-j])===sg2))f[i]=f[i]||4;}}
  return f;}
function spcBuild(b){if(S.zen)return;b.appendChild(kEl("div","dcstr",`<div class="dcssub">SPC · individuals and moving range · last 8 h, a reading every 10 min</div>
  <div class="seg kseg" role="group" aria-label="SPC variable" id="spcSel">${Object.entries(SPCV).map(([k,v])=>`<button type="button" data-spc="${k}" aria-pressed="${k===SPC.k}">${v[0]}</button>`).join("")}</div>
  <canvas id="spcCv" aria-label="SPC chart" role="img"></canvas><div class="qcsv" id="spcV"></div>`));
  $("spcSel").addEventListener("click",e=>{const t=e.target.closest("[data-spc]");if(!t)return;SPC.k=t.dataset.spc;document.querySelectorAll("#spcSel [data-spc]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.spc===SPC.k)));const c=$("spcCv");if(c)c._k="";spcDraw();});}
function spcDraw(){const cv=$("spcCv");if(!cv)return;const key=SPC.k+"|"+Math.floor(S.t/2)+"|"+(cv.clientWidth||0);if(cv._k===key)return;cv._k=key;
  const v=spcData(SPC.k),H=230,[x,cw]=trCanvas(cv,H),n=v.length,V=$("spcV");
  if(n<8){x.fillStyle="rgba(190,205,230,.8)";x.font="600 13px system-ui,sans-serif";x.fillText("Collecting: SPC needs an hour or two of readings.",12,30);if(V)V.innerHTML="";return;}
  const m=v.reduce((a,b)=>a+b,0)/n,mr=[];for(let i=1;i<n;i++)mr.push(Math.abs(v[i]-v[i-1]));const mrb=mr.reduce((a,b)=>a+b,0)/Math.max(1,mr.length),sg=Math.max(1e-6,mrb/1.128);
  const ucl=m+3*sg,lcl=m-3*sg,[lsl,usl]=spcSpec(SPC.k),fl=spcRules(v,m,sg);
  const lo=Math.min(lcl,lsl??Infinity,...v),hi=Math.max(ucl,usl??-Infinity,...v),pad=(hi-lo)*0.08||1,Y0=12,Y1=150,Y=a=>Y1-(a-(lo-pad))/((hi+pad)-(lo-pad))*(Y1-Y0),X=i=>40+(cw-60)*i/Math.max(1,n-1);
  const hl=(y,c,lab,dash)=>{x.strokeStyle=c;x.setLineDash(dash||[]);x.lineWidth=1.2;x.beginPath();x.moveTo(40,y);x.lineTo(cw-20,y);x.stroke();x.setLineDash([]);x.fillStyle=c;x.font="600 10px system-ui,sans-serif";x.textAlign="right";x.fillText(lab,cw-22,y-3);x.textAlign="left";};
  hl(Y(m),"#4fd18b","X̄ "+m.toFixed(2));hl(Y(ucl),"#ffb02e","UCL "+ucl.toFixed(2),[6,4]);hl(Y(lcl),"#ffb02e","LCL "+lcl.toFixed(2),[6,4]);
  if(lsl!=null)hl(Y(lsl),"#ff6b5e","LSL "+lsl.toFixed(2));if(usl!=null)hl(Y(usl),"#ff6b5e","USL "+usl.toFixed(2));
  x.strokeStyle="#7fb2ff";x.lineWidth=1.6;x.beginPath();v.forEach((a,i)=>i?x.lineTo(X(i),Y(a)):x.moveTo(X(i),Y(a)));x.stroke();
  v.forEach((a,i)=>{x.fillStyle=fl[i]?"#ff6b5e":"#e8f0ff";x.beginPath();x.arc(X(i),Y(a),fl[i]?4:2.5,0,7);x.fill();});
  // the moving range
  const mY0=170,mY1=H-8,mx=Math.max(3.267*mrb,...mr)||1,mYv=a=>mY1-a/mx*(mY1-mY0);x.strokeStyle="rgba(190,205,230,.5)";x.beginPath();mr.forEach((a,i)=>i?x.lineTo(X(i+1),mYv(a)):x.moveTo(X(i+1),mYv(a)));x.stroke();
  x.strokeStyle="#ffb02e";x.setLineDash([6,4]);x.beginPath();x.moveTo(40,mYv(3.267*mrb));x.lineTo(cw-20,mYv(3.267*mrb));x.stroke();x.setLineDash([]);x.fillStyle="rgba(190,205,230,.8)";x.font="600 10px system-ui,sans-serif";x.fillText("MR",6,mY0+10);
  const cpk=lsl!=null&&usl!=null?Math.min(usl-m,m-lsl)/(3*sg):lsl!=null?(m-lsl)/(3*sg):(usl-m)/(3*sg),nr=fl.filter(Boolean).length;
  const RN={1:"beyond 3σ",2:"2 of 3 beyond 2σ",3:"4 of 5 beyond 1σ",4:"8 on one side"},last=fl.slice().reverse().find(Boolean);
  const h=`<div><small>Cpk</small><b>${cpk.toFixed(2)}</b><small>${cpk>=1.33?"capable":cpk>=1?"just capable":"not capable: the spread is too wide for the spec"}</small></div><div><small>σ (from MR̄)</small><b>${sg.toFixed(3)}</b><small>${SPCV[SPC.k][2]}</small></div><div${nr?' class="qout"':""}><small>Run rules</small><b>${nr}</b><small>${nr?"last: "+RN[last]:"in control"}</small></div>`;
  if(V&&V._h!==h){V._h=h;V.innerHTML=h;}}

/* ---- "Ride the sheet": the camera travels with the web from the slice to the reel (29-3d-camera places it) ---- */
// [world x, y of the sheet, profile distance] keyframes; the camera stands on the tending side, a little upstream and above
const RIDE={on:false,t0:0,len:30000,pts:[[55.1,3.1,0],[51,3.0,4],[44,3.0,11],[40,3.2,15],[36,3.4,19],[33,3.4,22],[30,3.6,25],[27.2,4.4,28],[19.2,4.0,36],[9.6,4.0,45.5],[-3.2,4.0,58.5],[-6.5,3.5,61]]};
function shRide(){if(S.zen||!G3||!G3.camPersp)return;closeStation();RIDE.on=true;RIDE.t0=performance.now();G3.sheetRide=RIDE;
  let hud=$("rideHud");if(!hud){hud=kEl("div","ridehud","");hud.id="rideHud";hud.setAttribute("role","status");document.body.appendChild(hud);hud.addEventListener("click",()=>shRideEnd());}
  hud.hidden=false;const end=()=>shRideEnd();setTimeout(()=>document.addEventListener("pointerdown",end,{once:true}),300);}
function shRideEnd(){if(!RIDE.on)return;RIDE.on=false;const h=$("rideHud");if(h)h.hidden=true;if(G3)G3.lastMove=performance.now();}
// where the camera is along the ride (u 0..1) -> [x, y, profile distance]
function rideAt(u){const P2=RIDE.pts,n=P2.length-1,f=clamp(u,0,1)*n,i=Math.min(n-1,Math.floor(f)),k=f-i,a=P2[i],b=P2[i+1];return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];}
// the HUD: the section, solids where the camera is, speed, draw and the sheet's temperature
function rideHud(u){const h=$("rideHud");if(!h)return;const [, ,d]=rideAt(u),P2=profNow();let i=0;while(i<P2.length-2&&P2[i+1][0]<=d)i++;const a=P2[i],b=P2[i+1],k=clamp((d-a[0])/Math.max(0.01,b[0]-a[0]),0,1),c=a[3]+(b[3]-a[3])*k;
  const temp=d<15?44:d<25?48:d<37?60+(d-27)*1.5:d<46.5?76+(d-37)*0.6:d<58.5?84+(d-46.5)*0.6:86;
  const n=k>0.5?b:a,t=`<b>${n[1]==="Forming"?n[2]:n[1]}</b><span>${c<3?"consistency "+c.toFixed(2):"solids "+c.toFixed(1)}%</span><span>${Math.round(S.pmSpeed)} fpm</span><span>draw ${knobVal("draw").toFixed(2)}%</span><span>sheet ${Math.round(temp)} °C</span><small>tap to leave</small>`;if(h._h!==t){h._h=t;h.innerHTML=t;}}
G3.rideAt=rideAt;G3.rideHud=rideHud;G3.rideEnd=shRideEnd;G3.ride=shRide;
// tests (tools/checks): the sheet and the steam models
G3.sheet={setJw:hbSetJw,jw:hbJw,hbc:hbcSet,form:formF,tsr:tsrNow,stfi:()=>QNOW.stfi,stfiSpec,brk:brkRisk,where:brkWhere,prof:profNow,bkSet,bkLvl,reelSetNip,hard:reelHard,stk:()=>S.stk,stkClean,turnup:turnupRoll,log:brLog,top:brTop};
G3.dryP={satT,satP,ph:dryPh,hp:dryHp,p2:dryP2,ceil:dryCeil,pcap:dryPcap};
G3.steam={need:stmNeed,sp:stmSp,setSp:stmSetSp,setFan:stmSetFan,lost:stmLost,demF:stmDemF,flooded:stmFlooded,tcMax:stmTcMax,ir:stmIr,dew:stmDew,shell:stmShell};
