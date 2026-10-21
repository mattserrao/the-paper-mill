/* ---- v6.3 process flow overview (Settings > View > Process flow); v6.5 ranges, the history and the detail panel ----
   A control-room picture of the whole mill for the current mill day (6am to 6am), or yesterday: inputs on the left, the
   mill's areas in a row, outputs on the right. The band through the areas is drawn as wide as the money spent so far
   (a value build-up Sankey): each input drops in where it's spent, and what comes out the end meets the day's revenue.
   Waste is tons, drawn as thin dashed lines (not to scale). Tap anything for its breakdown. Reads only (11b-pflow.js);
   the game keeps running at the player's speed while it's open (v6.3.0-f2; f1 slowed it to 1 min/s). On narrow screens the
   picture runs top to bottom. */
const PFUI={open:false,mode:"t",sel:null,h:"",tab:null,zoom:"7d",prior:true,hx:{},view:"$",rp:null,play:false,base:null};   // (v6.7: view $ / $/t / tons; rp: the replayed hour)
const PF_LINES={yard:["Bale yard"],pulper:["Pulper"],stock:["Stock prep"],pm:["Paper","machine"],winder:["Winder"],ship:["Warehouse","& shipping"],site:["Site &","admin"]};
const PF_CATN=Object.fromEntries(PF_CATS.map(c=>[c[0],c])),PF_AN=Object.fromEntries(PF_AREAS.map(a=>[a[0],a]));
const pfT=v=>(Math.abs(v)>=100?Math.round(v).toLocaleString():(+v).toFixed(1))+" t";
const pfPerT=(v,t)=>t>0.5?money(v/t)+"/t":"–";
function pfOv(){let o=$("pfOv");if(o)return o;
  o=kEl("div","overlay top dcsov pfov");o.id="pfOv";o.hidden=true;
  o.innerHTML=`<div class="dcs pf" role="dialog" aria-modal="true" aria-labelledby="pf-h"><div class="dcsh"><b id="pf-h"></b>
    <div class="seg pfrange" role="group" aria-label="Range"><button type="button" data-pd="t">Today</button><button type="button" data-pd="y">Yesterday</button><button type="button" data-pd="w">7 d</button><button type="button" data-pd="r">Run</button></div>
    <div class="seg pfview" role="group" aria-label="Show">${[["$","$"],["pt","$/ton"],["t","Tons"]].map(([k,l])=>`<button type="button" data-pv2="${k}">${l}</button>`).join("")}</div>
    <label class="pfprior" title="Include the ${HIST_PRIOR} days before you took over"><input type="checkbox" id="pfPrior" checked/> Prior days</label>
    <button type="button" class="dcspop" data-popout="pf"${POPOK()&&!POP.on?"":" hidden"} title="Open in its own window, for a second monitor">⧉ Second screen</button><button aria-label="Close" class="dcsx" id="pfClose">✕</button></div>
    <div class="dcsb pfb" id="pfBody"><div class="pfcol pfin" id="pfIn"></div><div class="pfmid"><div class="pfoee" id="pfOee"></div><div class="pfmap mimicw" id="pfMap"></div><div class="pfrep" id="pfRep"></div></div><div class="pfcol pfout" id="pfOut"></div></div>
    <div class="pfpanel" id="pfPanel" hidden role="region" aria-label="Details"></div>
    <div class="dcsf"><span id="pfClock"></span><span id="pfNote">Live: the mill keeps running</span></div></div>`;
  document.body.appendChild(o);
  $("pfClose").addEventListener("click",()=>pfClose());
  o.addEventListener("click",e=>{if(e.target===o){pfClose();return;}
    const pd=e.target.closest("[data-pd]");if(pd){if(pd.disabled)return;PFUI.mode=pd.dataset.pd;PFUI.sel=null;PFUI.rp=null;PFUI.play=false;pfRender(true);return;}
    const pv=e.target.closest("[data-pv2]");if(pv){PFUI.view=pv.dataset.pv2;pfRender(true);return;}
    const rp=e.target.closest("[data-rp]");if(rp){const k=rp.dataset.rp,[h0,h1]=pfRpWin();if(k==="live"){PFUI.rp=null;PFUI.play=false;}else if(k==="play"){if(PFUI.rp==null||PFUI.rp>=h1-1)PFUI.rp=h0;PFUI.play=!PFUI.play;}pfRender(true);return;}
    const dc=e.target.closest("[data-pfdcs]");if(dc){const a=dc.dataset.pfdcs;if(!POP.on)pfClose();openStation(a,"dcs");return;}
    if(e.target.closest("#pfPopX")){PFUI.sel=null;pfRender(true);return;}
    const tb=e.target.closest("[data-ptab]");if(tb){PFUI.tab=tb.dataset.ptab;pfRender(true);return;}
    const zm=e.target.closest("[data-pz]");if(zm){PFUI.zoom=zm.dataset.pz;pfRender(true);return;}
    const t=e.target.closest("[data-pf]");if(t){let k=t.dataset.pf;if(k.startsWith("drop:"))k="node:"+k.split(":")[1];if(PFUI.sel!==k)PFUI.tab=null;PFUI.sel=PFUI.sel===k?null:k;pfRender(true);}});
  o.querySelector("#pfPrior").addEventListener("change",e=>{PFUI.prior=e.target.checked;pfRender(true);});
  o.addEventListener("input",e=>{if(e.target.id==="pfRpS"){PFUI.rp=+e.target.value;PFUI.play=false;pfRender(true);}});
  o.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-pf][tabindex]")){e.preventDefault();e.target.dispatchEvent(new (e.target.ownerDocument.defaultView||window).MouseEvent("click",{bubbles:true}));}});
  return o;}
function pfOpen(){if(POP.on){PFUI.open=true;G3.pfOpen=true;popShow("pf");pfRender(true);return;}   // v6.5.1: popped out, it switches the second screen to the flow
  const o=pfOv();if(G3.closeKnobUI)G3.closeKnobUI();PFUI.open=true;G3.pfOpen=true;PFUI.sel=null;PFUI.mode="t";PFUI.rp=null;PFUI.play=false;o.hidden=false;pfRender(true);kuiSync();
  setTimeout(()=>{try{$("pfClose").focus({preventScroll:true});}catch(_){}},0);}
function pfClose(){if(POP.on)return;   // (v6.5.1: a popped-out flow stays up until docked)
  pfCtlHome();G3.pfCtlOn=false;const o=$("pfOv");if(o)o.hidden=true;const was=PFUI.open;PFUI.open=false;G3.pfOpen=false;kuiSync();if(was)try{$("gl").focus({preventScroll:true});}catch(_){}}
// the picture runs top to bottom on narrow screens
const pfVert=()=>{const o=$("pfOv"),w=(o&&o.ownerDocument.defaultView)||window;return w.matchMedia("(max-width:760px)").matches;};   // (v6.5.1: of the window it is in)

/* ---- status of each area right now (today only) ---- */
const PF_LAMP={dry:["#ffb02e","Dryer-limited"],run:["#4fd18b","Running"],upset:["#ffb02e","Upset"],brk:["#ffb02e","Sheet break"],hay:["#ffb02e","Hayout"],down:["#ff6b5e","Down"],held:["#8ea4c4","Held back"]};
function pfLamp(a){const M=S.M||{},up=(S.inc||[]).some(i=>pfRepArea(i.id)===a);
  switch(a){case "yard":return M.docksClosed?"down":up?"upset":"run";
    case "pulper":return M.pulperDown?"down":up?"upset":"run";
    case "pm":return S.pm==="run"?(up?"upset":dryLimited()||(S.dry&&S.dry.trim>0.001)?"dry":"run"):S.pm==="break"?"brk":S.pm==="spools"||S.pm==="full"?"held":"down";
    case "winder":return S.wd==="hayout"?"hay":M.winderDown?"down":S.wdBlocked?"held":"run";
    case "site":return null;default:return up?"upset":"run";}}
// tons through each area: now (t/h) for today, the day's tons for yesterday
function pfRate(a,D,live){const R=S.rates||{};
  if(live){const v={yard:R.unload,pulper:R.feed,stock:R.fiberIn,pm:R.prod,winder:R.cut,ship:(R.load||0)*(C.rollW?C.rollW.v:12.5)}[a];return v==null?"":Math.round(v)+" t/h";}
  const v={pulper:D.W.feed,stock:D.W.feed-D.W.rej,pm:D.made,ship:D.shipT}[a];return v==null?"":pfT(v);}

/* ---- the picture (SVG). u runs along the flow, v across it; the narrow-screen layout swaps them ---- */
function pfSVG(D,live){const vert=pfVert(),NU=104,NV=112,GAP=30,PAD=vert?24:10,n=PF_AREAS.length,U=PAD*2+n*NU+(n-1)*GAP+36,v0=vert?120:150,v1=v0+NV,vc=v0+NV/2,wE=v1+46,V=vert?wE+150:wE+66;
  const X=(u,v)=>vert?[v,u]:[u,v],o=[];
  const poly=pts=>pts.map(p=>X(p[0],p[1]).map(q=>q.toFixed(1)).join(",")).join(" ");
  const rect=(u,v,du,dv,attr)=>{const [x,y]=X(u,v),[w,h]=vert?[dv,du]:[du,dv];return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0,w).toFixed(1)}" height="${Math.max(0,h).toFixed(1)}" ${attr}/>`;};
  const txt=(x,y,s,cls,anc)=>`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}"${anc?` style="text-anchor:${anc}"`:""}>${s}</text>`;
  const uOf=i=>PAD+i*(NU+GAP);
  // each area's adds (positive parts are drawn), the running total and the scale
  const adds=PF_AREAS.map(([a])=>PF_CATS.map(([c])=>[c,Math.max(0,D.by[a][c]||0)]).filter(x=>x[1]>0)),tot=adds.map(l=>l.reduce((s,x)=>s+x[1],0));
  const cum=[];tot.reduce((s,v,i)=>(cum[i]=s+v),0);const all=cum[n-1]||0,maxAdd=Math.max(1,...tot);
  const k=all>0?Math.min((NV-20)/all,(NU-12)/maxAdd):0;
  o.push(`<svg viewBox="0 0 ${vert?V:U} ${vert?U:V}" class="mimic pfsvg${vert?" vert":""}" role="img" aria-label="Process flow of the mill">`);
  o.push(`<defs><marker id="pfArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#8ea4c4"/></marker></defs>`);
  // the carried band: between areas, as wide as the money spent so far; out the far end to the outputs
  for(let i=0;i<n;i++){const w=k*cum[i];if(w<=0.05)continue;const a=uOf(i)+NU,b=i<n-1?uOf(i+1):U-14;
    o.push(`<polygon points="${poly([[a,vc-w/2],[b,vc-w/2],[b,vc+w/2],[a,vc+w/2]])}" class="pfband"/>`);
    if(i===n-1)o.push(`<polygon points="${poly([[b,vc-w/2-5],[U-2,vc],[b,vc+w/2+5]])}" class="pfband"/>`);}
  // the drops: each input coming in where it's spent
  PF_AREAS.forEach(([a],i)=>{let u=uOf(i)+6;adds[i].forEach(([c,v])=>{const w=Math.max(1.5,k*v);
      o.push(`<g data-pf="drop:${a}:${c}" class="pfhit">${rect(u,34,w,v0-34,`fill="${PF_CATN[c][2]}" class="pfdrop"`)}${rect(u-2,34,w+4,v0-34,`fill="transparent"`)}</g>`);u+=w;});
    if(tot[i]>0){const [x,y]=vert?[4,uOf(i)-3]:[uOf(i)+NU/2,24];o.push(txt(x,y,"+"+(PFUI.view==="pt"?pfPerT(tot[i],D.made):money(tot[i])),"pfadd",vert?"start":"middle"));}});
  // the waste: thin dashed lines off the bottom (tons, not to scale) and the broke loop back to the pulper
  const wl=(i,du,lines,cls)=>{const u=uOf(i)+du;o.push(`<polyline points="${poly([[u,v1],[u,wE]])}" class="pfwaste" marker-end="url(#pfArr)"/>`);
    lines.forEach((s,j)=>{const [x,y]=vert?[wE+6,u-4+j*17]:[u,wE+20+j*17];o.push(txt(x,y,s,j?"pfwv"+(cls?" "+cls:""):"pfwl",vert?"start":"middle"));});};
  const W=D.W,iP=1,iM=3;
  o.push(`<g data-pf="out:waste" class="pfhit">`);
  wl(iP,NU/2-14,["Rejects → landfill",pfT(W.rej)]);
  if(W.bale>0.05)wl(0,NU/2,["Bales lost",pfT(W.bale)]);
  wl(iM,NU-20,W.fine>0?["Effluent fiber",pfT(W.eff),"Permit fine "+money(W.fine)]:["Effluent fiber",pfT(W.eff)],W.fine>0?"bad":"");
  {const a=uOf(iM)+20,b=uOf(iP)+NU-16,vv=v1+26;o.push(`<polyline points="${poly([[a,v1],[a,vv],[b,vv],[b,v1+2]])}" class="pfbroke" marker-end="url(#pfArr)"/>`);
    const uc=uOf(2)+NU/2,[x,y]=vert?[vv+6,uc+4]:[uc,vv+18];o.push(txt(x,y,"Broke "+pfT(W.broke)+" repulped","pfwv",vert?"start":"middle"));}
  o.push(`</g>`);
  // the areas (text in screen space, so it reads the same both ways)
  PF_AREAS.forEach(([a],i)=>{const u=uOf(i),[x,y]=X(u,v0),[w,h]=vert?[NV,NU]:[NU,NV],cx=x+w/2,cy=y+h/2,L=PF_LINES[a],lp=live?pfLamp(a):null,sel=PFUI.sel==="node:"+a;
    const up=live&&(S.inc||[]).some(q=>pfRepArea(q.id)===a);   // (v6.7: an area with an upset flashes red)
    let g=`<g data-pf="node:${a}" class="pfhit" tabindex="0" role="button" aria-label="${PF_AN[a][2]}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" class="meq pfnode${sel?" sel":""}${up?" pfup":""}"/>`;
    const top=cy-(L.length>1?32:24);L.forEach((s,j)=>g+=txt(cx,top+j*17,s,"mtl pfnl"));
    g+=txt(cx,cy+(L.length>1?20:14),tot[i]>0?(PFUI.view==="pt"?pfPerT(tot[i],D.made):money(tot[i])):"–","pfnv");
    const r=pfRate(a,D,live);if(r)g+=txt(cx,cy+(L.length>1?37:33),r,"pfnr");
    g+=pfCapSVG(a,D,live,x,y,w,h);
    if(lp)g+=`<circle cx="${x+w-9}" cy="${y+9}" r="4.5" fill="${PF_LAMP[lp][0]}"><title>${PF_LAMP[lp][1]}</title></circle>`;
    o.push(g+"</g>");});
  o.push("</svg>");o.push(`<p class="pfcap">The blue band is as wide as the money spent so far ${live?"today":"that day"}${PFUI.view==="pt"?", shown per ton of paper made":""}; each input drops in where it's spent. Waste is tons (not to scale). The bar in each area is its throughput against what it can do. Tap anything for its breakdown.</p>`);return o.join("");}

/* ---- inputs and outputs (HTML) ---- */
function pfInputs(D){const t=D.made,pt=PFUI.view==="pt",B=pfBase(D);let h=`<div class="dcssub">Inputs · ${PFUI.rp!=null?"that hour":PF_RNAME[PFUI.mode]}</div>`;
  PF_CATS.forEach(([c,name,col])=>{const v=D.cat[c];h+=`<button type="button" class="pfrow${PFUI.sel==="cat:"+c?" sel":""}" data-pf="cat:${c}"><i style="background:${col}"></i><span>${name}${pfChip(B,c,v,t)}</span><b>${pt?pfPerT(v,t):money(v)}</b><small>${pt?money(v):pfPerT(v,t)}</small></button>`;});
  h+=`<div class="pfrow tot"><i></i><span>Total cost${pfChip(B,"cost",D.cost,t)}</span><b>${pt?pfPerT(D.cost,t):money(D.cost)}</b><small>${pt?money(D.cost):pfPerT(D.cost,t)}</small></div>`;
  if(B)h+=`<p class="pfcmp">▲▼ per ton made against the 7 days before${B.y?"; hover for yesterday":""}.</p>`;
  return h;}
function pfOutputs(D){const W=D.W,mx=Math.max(D.revenue,D.cost,1),pos=D.profit>=0;
  return `<div class="dcssub">Outputs</div>
    <button type="button" class="pfbox${PFUI.sel==="out:paper"?" sel":""}" data-pf="out:paper"><b>Paper</b>
      <div><span>Shipped</span><em>${pfT(D.shipT)}</em><em>${money(D.revenue)}</em></div>
      <div><span>Made</span><em>${pfT(D.made)}</em><em>worth ${money(W.val)}</em></div></button>
    <button type="button" class="pfbox${PFUI.sel==="out:waste"?" sel":""}" data-pf="out:waste"><b>Waste</b>
      <div><span>Rejects → landfill</span><em>${pfT(W.rej)}</em></div><div><span>Effluent fiber</span><em>${pfT(W.eff)}</em></div>
      ${W.bale>0.05?`<div><span>Bales lost</span><em>${pfT(W.bale)}</em></div>`:""}${W.spill>0.05?`<div><span>Stock spilled</span><em>${pfT(W.spill)}</em></div>`:""}${W.scrap>0.05?`<div><span>Rolls scrapped</span><em>${pfT(W.scrap)}</em></div>`:""}<div><span>Broke (repulped)</span><em>${pfT(W.broke)}</em></div>
      ${W.fine>0?`<div class="bad"><span>Permit fines</span><em>${money(W.fine)}</em></div>`:""}</button>
    <button type="button" class="pfbox pfprof${PFUI.sel==="out:profit"?" sel":""}" data-pf="out:profit"><b>${pos?"Profit":"Loss"}</b>
      <div class="pfbar"><span>Revenue</span><i style="width:${(D.revenue/mx*100).toFixed(1)}%" class="r"></i></div>
      <div class="pfbar"><span>Cost</span><i style="width:${(D.cost/mx*100).toFixed(1)}%" class="c"></i></div>
      <strong class="${pos?"ok":"bad"}">${money(D.profit)}</strong><small>${D.shipT>0.5?money(D.profit/D.shipT)+" per ton shipped":"no paper shipped yet"}</small></button>`;}

/* ---- v6.5 the range: today, yesterday (the day books, 11b), the last 7 days or the whole run (hourly history, 11c) ---- */
const PF_RNAME={t:"today",y:"yesterday",w:"last 7 days",r:"the run"};
const pfNowH=()=>Math.floor(S.t/60);
function pfRangeD(){const m=PFUI.mode;
  if(m==="t")return S.pf?pfCalc(S.pf):null;if(m==="y")return S.pf&&S.pf.prev||null;
  const h1=pfNowH()+1,h0=m==="w"?h1-168:-1e9,rows=histRows(h0,h1,PFUI.prior);if(!rows.length)return null;
  const D=histSum(rows,rows[0][0]*60,h1*60);D.h0=rows[0][0];D.h1=h1;return D;}
// rows (and downtime by cause) for a chart window; prior hours always shown (shaded)
function histWin(h0,h1){const H=S.hist;if(!H)return {rows:[],dn:[]};const rows=[],dn=[];
  H.rows.forEach((r,i)=>{if(r[0]>=h0&&r[0]<h1){rows.push(r);dn.push(H.dn[i]||0);}});
  if(S.ph&&S.ph.h>=h0&&S.ph.h<h1){rows.push(histRow(S.ph));dn.push(S.ph.dn);}return {rows,dn};}
const pfDayLbl=h=>{const d=Math.floor(h/24);return d<0?`Day ${d}`:`Day ${d+1}`;};
const pfHourLbl=h=>`${pfDayLbl(h)} · ${clockOf(((h%24)+24)%24*60)}`;

/* ---- what each thing trends. A series: [label, colour, row => value]; kinds: line (averages, hourly points), bar (sums,
   hourly bars over 24 h or daily bars over 7 days and the run), stack (summed bars stacked), pct (sum of a / sum of b) ---- */
const V_=k=>r=>r[HCI[k]];
const HSUM=k=>k.reduce?(r=>k.reduce((a,x)=>a+(r[HCI[x]]||0),0)):V_(k);
const C_={fi:"#e07b39",fo:"#9b7fd6",occ:"#c08a4a",en:"#ffb02e",ch:"#3fc6d6",lab:"#4fd18b",mt:"#ff7a8a",ov:"#a7b4cf",bl:"#7fb2ff",pu:"#c08bff",wh:"#dbe6f6"};
const PF_TR={
  yard:[{t:"Bale yard inventory",u:"t",k:"line",s:[["Yard",C_.occ,V_("a.yard")]]},{t:"Trucks in",u:"trucks",k:"bar",s:[["Trucks",C_.bl,V_("n.in")]]},
    {t:"OCC price",u:"$/t",k:"line",s:[["OCC",C_.occ,V_("a.occp")]],ev:1},{t:"Inbound haul",u:"$/t",k:"line",s:[["Haul",C_.fi,V_("a.haul")]]},{t:"Unloading",u:"t/h",k:"line",s:[["Unloaded",C_.bl,V_("a.unload")]]}],
  pulper:[{t:"Pulper feed and fiber out",u:"t/h",k:"line",s:[["Bales fed",C_.occ,V_("a.feed")],["Fiber out",C_.bl,V_("a.fiber")]]},{t:"Yield",u:"%",k:"line",s:[["Yield",C_.lab,V_("a.yield")]]},
    {t:"Rotor",u:"A",k:"line",s:[["Rotor",C_.en,V_("a.amps")]],ev:1}],
  stock:[{t:"Fiber to the machine chest",u:"t/h",k:"line",s:[["Fiber",C_.bl,V_("a.fiber")]]},{t:"Stock chest level",u:"%",k:"line",s:[["Chest",C_.ch,V_("a.chest")]]},
    {t:"Refiners",u:"kW",k:"line",s:[["Load",C_.mt,V_("a.refkw")]],ev:1},{t:"Freeness",u:"mL CSF",k:"line",s:[["CSF",C_.lab,V_("a.csf")]]}],
  pm:[{t:"Reel speed",u:"fpm",k:"line",s:[["Speed",C_.bl,V_("a.speed")]],ev:1},{t:"Paper made",u:"t",k:"bar",s:[["Made",C_.lab,V_("made")]]},
    {t:"Basis weight",u:"lb/1000 ft²",k:"line",s:[["BW",C_.en,V_("a.bw")]]},{t:"Reel moisture",u:"%",k:"line",s:[["Moisture",C_.ch,V_("a.moist")]]},
    {t:"Dryer steam",u:"t/h",k:"line",s:[["Steam",C_.wh,V_("a.steam")]]},{t:"Dryer load",u:"% of the 3rd section's limit",k:"line",s:[["Load",C_.en,V_("a.dryl")]]},
    {t:"Speed trimmed for a wet sheet",u:"fpm",k:"line",s:[["Trim",C_.mt,V_("a.trim")]]},{t:"Energy",u:"$/t",k:"line",s:[["Energy",C_.en,V_("a.energyt")]]}],
  winder:[{t:"Winder",u:"t/h",k:"line",s:[["Cut",C_.bl,V_("a.cut")]],ev:1},{t:"Paper waiting at the winder",u:"t",k:"line",s:[["Reel store",C_.wh,V_("a.reel")]]},{t:"Hayouts",u:"",k:"bar",s:[["Hayouts",C_.en,V_("n.hay")]]}],
  ship:[{t:"Warehouse",u:"% full",k:"line",s:[["Warehouse",C_.wh,V_("a.fgp")]]},{t:"Paper shipped",u:"t",k:"bar",s:[["Shipped",C_.lab,V_("ship")]]},
    {t:"Trucks out",u:"trucks",k:"bar",s:[["Trucks",C_.bl,V_("n.out")]]},{t:"Outbound freight",u:"$/t",k:"line",s:[["Freight",C_.fo,V_("a.frout")]]},{t:"Paper price (grade on the machine)",u:"$/t",k:"line",s:[["Price",C_.lab,V_("a.price")]]}],
  site:[{t:"Admin costs",u:"$",k:"stack",s:[["Overhead",C_.ov,V_("s.ovh")],["Insurance",C_.pu,V_("s.prem")],["Civics",C_.ch,V_("s.civ")],["Maintenance crew",C_.mt,V_("s.tech")],["PM program",C_.en,V_("s.pmp")]]},
    {t:"Crew on site",u:"people",k:"line",s:[["Crew",C_.lab,V_("a.crew")]]},{t:"Wage",u:"$/h per worker",k:"line",s:[["Wage",C_.lab,V_("a.wage")]]},
    {t:"Civics meters",u:"0–100",k:"line",s:[["Economy",C_.en,V_("a.civE")],["Labor",C_.lab,V_("a.civL")],["Machinery",C_.bl,V_("a.civM")],["Community",C_.pu,V_("a.civC")]],opt:1}],
  "cat:fiber":[{t:"OCC price and haul",u:"$/t",k:"line",s:[["OCC",C_.occ,V_("a.occp")],["Haul",C_.fi,V_("a.haul")],["Delivered",C_.wh,r=>{const a=hv(r,"a.occp"),b=hv(r,"a.haul");return a==null||b==null?null:a+b;}]]},{t:"Fiber spend",u:"$",k:"bar",s:[["Fiber",C_.occ,V_("c.fiber")]]},{t:"Bales fed",u:"t",k:"bar",s:[["Bales",C_.occ,V_("w.feed")]]},{t:"Bale yard quality",u:"%",k:"line",s:[["Moisture",C_.bl,V_("a.balem")],["Stickies",C_.mt,V_("a.stk")]]},
    {t:"OCC market",u:"$/t vs normal",k:"line",s:[["Market",C_.wh,V_("a.mkt")]]}],
  "cat:frin":[{t:"Inbound haul",u:"$/t",k:"line",s:[["Haul",C_.fi,V_("a.haul")]]},{t:"Diesel",u:"$/gal",k:"line",s:[["Diesel",C_.wh,r=>{const v=hv(r,"a.fuel");return v==null?null:v*FR.dieselBase;}]]},
    {t:"Inbound freight spend",u:"$",k:"bar",s:[["Freight in",C_.fi,V_("c.frin")]]},{t:"Trucks in",u:"trucks",k:"bar",s:[["Trucks",C_.bl,V_("n.in")]]}],
  "cat:frout":[{t:"Outbound freight",u:"$/t",k:"line",s:[["Freight",C_.fo,V_("a.frout")]]},{t:"Diesel",u:"$/gal",k:"line",s:[["Diesel",C_.wh,r=>{const v=hv(r,"a.fuel");return v==null?null:v*FR.dieselBase;}]]},
    {t:"Outbound freight spend",u:"$",k:"bar",s:[["Freight out",C_.fo,V_("c.frout")]]},{t:"Paper shipped",u:"t",k:"bar",s:[["Shipped",C_.lab,V_("ship")]]}],
  "cat:energy":[{t:"Energy per ton",u:"$/t",k:"line",s:[["Energy",C_.en,V_("a.energyt")]]},{t:"Energy spend",u:"$",k:"stack",s:[["Steam",C_.en,V_("s.steam")],["Power",C_.bl,V_("s.power")]]},
    {t:"Dryer steam",u:"t/h",k:"line",s:[["Steam",C_.wh,V_("a.steam")]]}],
  "cat:chem":[{t:"Chemicals and water per ton",u:"$/t",k:"line",s:[["Chemicals",C_.ch,V_("a.chemt")]]},{t:"Chemicals spend",u:"$",k:"stack",s:[["Stock prep",C_.ch,V_("s.chs")],["Wet end",C_.bl,V_("s.chp")]]}],
  "cat:labor":[{t:"Labor spend",u:"$",k:"stack",s:[["Drivers",C_.lab,V_("s.drv")],["Loaders and robots",C_.bl,V_("s.ldr")]]},{t:"Crew on site",u:"people",k:"line",s:[["Crew",C_.lab,V_("a.crew")]]},
    {t:"Wage",u:"$/h per worker",k:"line",s:[["Wage",C_.lab,V_("a.wage")]]}],
  "cat:maint":[{t:"Maintenance spend",u:"$",k:"stack",s:[["Repairs and outages",C_.mt,V_("s.rep")],["Techs",C_.en,V_("s.tech")],["PM program",C_.bl,V_("s.pmp")],["Insurance",C_.pu,V_("s.prem")]],ev:2}],
  "cat:over":[{t:"Overhead and civics",u:"$",k:"stack",s:[["Overhead",C_.ov,V_("s.ovh")],["Civics",C_.ch,V_("s.civ")]]}],
  "out:paper":[{t:"Paper made and shipped",u:"t",k:"bar",s:[["Made",C_.lab,V_("made")],["Shipped",C_.bl,V_("ship")]]},{t:"Revenue",u:"$",k:"bar",s:[["Sales and deals",C_.bl,HSUM(["rev","deals"])],["Worth as made",C_.lab,V_("w.val")]]},
    {t:"Price (grade on the machine)",u:"$/t",k:"line",s:[["Price",C_.lab,V_("a.price")]]}],
  "out:waste":[{t:"Waste",u:"t",k:"stack",s:[["Rejects → landfill",C_.occ,V_("w.rej")],["Effluent fiber",C_.ch,V_("w.eff")],["Bales lost",C_.mt,V_("w.bale")],["Stock spilled",C_.pu,V_("w.spill")],["Rolls scrapped",C_.ov,V_("w.scrap")]]},
    {t:"Broke repulped",u:"t",k:"bar",s:[["Broke",C_.en,V_("w.broke")]]},{t:"Reject share of bales",u:"%",k:"pct",s:[["Rejects",C_.occ,r=>[hv(r,"w.rej"),hv(r,"w.feed")]]]}],
  "out:profit":[{t:"Operating profit",u:"$",k:"bar",pn:1,s:[["Profit",C_.lab,r=>hv(r,"rev")+hv(r,"deals")-PF_CATS.reduce((a,[c])=>a+hv(r,"c."+c),0)]]},
    {t:"Revenue and cost",u:"$",k:"bar",s:[["Revenue",C_.bl,HSUM(["rev","deals"])],["Cost",C_.ov,HSUM(PF_CATS.map(([c])=>"c."+c))]]},
    {t:"Cost per ton made",u:"$/t",k:"pct",mul:1,s:[["Cost",C_.ov,r=>[PF_CATS.reduce((a,[c])=>a+hv(r,"c."+c),0),hv(r,"made")]]]}]};
// uptime & quality, per area
const PF_UQ={
  yard:[{t:"Docks open",u:"%",k:"pct",s:[["Open",C_.lab,r=>[hv(r,"m.yard"),60]]]},{t:"Wet bales",u:"%",k:"line",s:[["Wet",C_.ch,V_("a.wet")]]},{t:"Bales lost",u:"t",k:"bar",s:[["Lost",C_.mt,V_("w.bale")]]}],
  pulper:[{t:"Running",u:"%",k:"pct",s:[["Running",C_.lab,r=>[hv(r,"m.pulp"),60]]]},{t:"Rejects",u:"% of bales",k:"pct",s:[["Rejects",C_.occ,r=>[hv(r,"w.rej"),hv(r,"w.feed")]]]}],
  stock:[{t:"Running",u:"%",k:"pct",s:[["Running",C_.lab,r=>[hv(r,"m.pulp"),60]]]},{t:"Freeness",u:"mL CSF",k:"line",s:[["CSF",C_.lab,V_("a.csf")]]}],
  pm:[{t:"Machine time",u:"h",k:"stack",s:[["Running",C_.lab,r=>hv(r,"m.pmrun")/60],["Sheet breaks",C_.en,r=>hv(r,"m.pmbrk")/60],["Down",C_.mt,r=>hv(r,"m.pmdown")/60],["Held back",C_.ov,r=>hv(r,"m.pmheld")/60]]},
    {t:"Sheet breaks",u:"",k:"bar",s:[["Breaks",C_.en,V_("n.brk")]]},{t:"Broke",u:"% of paper",k:"pct",s:[["Broke",C_.en,r=>[hv(r,"w.broke"),hv(r,"made")+hv(r,"w.broke")]]]},
    {t:"Basis weight",u:"lb/1000 ft²",k:"line",s:[["BW",C_.en,V_("a.bw")]]},{t:"Reel moisture",u:"%",k:"line",s:[["Moisture",C_.ch,V_("a.moist")]]}],
  winder:[{t:"Winder time",u:"h",k:"stack",s:[["Running",C_.lab,r=>hv(r,"m.wdrun")/60],["Hayouts",C_.en,r=>hv(r,"m.wdhay")/60],["Down",C_.mt,r=>hv(r,"m.wddown")/60],["Blocked",C_.ov,r=>hv(r,"m.wdblk")/60]]},
    {t:"Hayouts",u:"",k:"bar",s:[["Hayouts",C_.en,V_("n.hay")]]}],
  ship:[{t:"Shipping open",u:"%",k:"pct",s:[["Open",C_.lab,r=>[hv(r,"m.ship"),60]]]},{t:"Warehouse",u:"% full",k:"line",s:[["Warehouse",C_.wh,V_("a.fgp")]]}],
  site:[]};
const PF_DNN={brk:"Sheet breaks",hay:"Winder hayouts"};
const pfDnArea=id=>id==="brk"?"pm":id==="hay"?"winder":pfRepArea(id);

/* ---- charts (canvas, the DCS look) ---- */
function pfWin(){const h1=pfNowH()+1,n=PFUI.zoom==="24h"?24:PFUI.zoom==="7d"?168:1e9,H=S.hist;
  const first=H&&H.rows.length?H.rows[0][0]:0,h0=Math.max(first,h1-n);return [h0,h1];}
// buckets: hourly over 24 h; daily for sums over 7 days and the run; lines stay hourly
function pfSeries(spec,rows){const daily=PFUI.zoom!=="24h"&&spec.k!=="line",B=new Map();
  for(const r of rows){const b=daily?Math.floor(r[0]/24)*24:r[0];let o=B.get(b);if(!o){o={h:b,n:0,v:spec.s.map(()=>spec.k==="pct"?[0,0]:spec.k==="line"?[0,0]:0)};B.set(b,o);}o.n++;
    spec.s.forEach((x,i)=>{const v=x[2](r);if(spec.k==="pct"){if(v&&v[1]>0){o.v[i][0]+=v[0]||0;o.v[i][1]+=v[1];}}else if(spec.k==="line"){if(v!=null&&v===v){o.v[i][0]+=v;o.v[i][1]++;}}else o.v[i]+=v||0;});}
  const out=[...B.values()].sort((a,b)=>a.h-b.h).map(o=>({h:o.h,w:daily?24:1,v:o.v.map(x=>Array.isArray(x)?(x[1]>0?(spec.k==="pct"?x[0]/x[1]*(spec.mul||100):x[0]/x[1]):null):x)}));
  return {pts:out,daily};}
const pfFmt=(v,u)=>v==null?"–":u==="$"?money(v):Math.abs(v)>=1000?Math.round(v).toLocaleString():Math.abs(v)>=100?Math.round(v)+"":Math.abs(v)>=10?v.toFixed(1):v.toFixed(2);
function pfChartHTML(spec,i){const leg=spec.s.length>1?`<span class="pfleg">${spec.s.map(x=>`<span><i style="background:${x[1]}"></i>${x[0]}</span>`).join("")}</span>`:"";
  return `<div class="pfch"><div class="pfcht"><b>${spec.t}</b><small>${spec.u}${spec.k!=="line"&&spec.k!=="pct"&&spec.u!=="h"?"":""}</small>${leg}</div><canvas data-ch="${i}" height="120"></canvas><div class="pfchr" data-chr="${i}">&nbsp;</div></div>`;}
function pfDraw(cv,spec,W0){const dpr=Math.min(2,(cv.ownerDocument.defaultView||window).devicePixelRatio||1),cw=cv.clientWidth||400,ch=120;if(cv.width!==Math.round(cw*dpr)){cv.width=Math.round(cw*dpr);cv.height=ch*dpr;}
  const x=cv.getContext("2d");x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle="#0f1b2d";x.fillRect(0,0,cw,ch);
  const [h0,h1]=W0,{rows}=PFUI.win,{pts,daily}=pfSeries(spec,rows),L=40,R=cw-6,T=8,Bm=ch-16,X=h=>L+(h-h0)/Math.max(1,h1-h0)*(R-L);
  // prior hours shaded
  if(h0<0){x.fillStyle="rgba(142,164,196,.10)";x.fillRect(X(h0),T,X(Math.min(0,h1))-X(h0),Bm-T);x.fillStyle="rgba(142,164,196,.7)";x.font="600 10px system-ui,sans-serif";x.fillText("before you",X(h0)+4,Bm-4);}
  let lo=Infinity,hi=-Infinity;const bar=spec.k!=="line"&&spec.k!=="pct",stack=spec.k==="stack";
  for(const p of pts){if(stack){let s=0;p.v.forEach(v=>s+=v||0);hi=Math.max(hi,s);lo=Math.min(lo,0);}else p.v.forEach(v=>{if(v!=null){lo=Math.min(lo,v);hi=Math.max(hi,v);}});}
  if(!(hi>-Infinity)){x.fillStyle="rgba(190,205,230,.7)";x.font="600 12px system-ui,sans-serif";x.fillText("No data yet",L+8,ch/2);return pts;}
  if(bar||spec.k==="pct"||spec.pn){lo=Math.min(0,lo);hi=Math.max(0,hi);}
  {const m=Math.max(Math.abs(hi),Math.abs(lo));if(hi-lo<Math.max(m*0.04,1e-6)){const c=(hi+lo)/2,w=Math.max(m*0.05,1);hi=c+w;lo=bar?Math.min(0,lo):c-w;}}   // (a flat line gets a sensible scale, not ±0.5)
  const pad=(hi-lo)*0.08,pos=lo>=0;if(!bar&&spec.k!=="pct")lo-=pad;if(pos)lo=Math.max(0,lo);hi+=pad;
  const Y=v=>Bm-(v-lo)/(hi-lo)*(Bm-T);
  x.strokeStyle="rgba(140,170,210,.16)";x.lineWidth=1;x.fillStyle="rgba(190,205,230,.75)";x.font="600 10px system-ui,sans-serif";x.textAlign="right";
  for(let k=0;k<=2;k++){const v=lo+(hi-lo)*k/2,y=Y(v);x.beginPath();x.moveTo(L,y);x.lineTo(R,y);x.stroke();x.fillText(pfFmt(v,spec.u).replace("$",""),L-3,y+3);}
  // day lines and labels
  x.textAlign="center";const nd=(h1-h0)/24,step=nd>20?7:nd>8?2:1;
  for(let d=Math.ceil(h0/24);d*24<h1;d++){const xx=X(d*24);x.strokeStyle=d===0?"rgba(79,209,139,.5)":"rgba(140,170,210,.12)";x.beginPath();x.moveTo(xx,T);x.lineTo(xx,Bm);x.stroke();
    if(((d%step)+step)%step===0||nd<=2)x.fillText(nd<=2?clockOf(0)+" "+pfDayLbl(d*24).replace("Day ","D"):pfDayLbl(d*24).replace("Day ","D"),xx,ch-4);}
  if(nd<=2){for(let h=Math.ceil(h0/6)*6;h<h1;h+=6)if(h%24){x.fillText(clockOf(((h%24)+24)%24*60).replace(":00",""),X(h),ch-4);}}
  // marks (clipped to the plot)
  x.save();x.beginPath();x.rect(L,0,R-L,ch);x.clip();
  if(bar){const nS=spec.s.length,bw=Math.max(1,(X(h0+(daily?24:1))-X(h0))-(daily?3:1));
    for(const p of pts){const x0=X(p.h)+(daily?1.5:0.5);if(stack){let acc=0;p.v.forEach((v,i)=>{if(!v)return;x.fillStyle=spec.s[i][1];const y0=Y(acc),y1=Y(acc+v);x.fillRect(x0,y1,bw,y0-y1);acc+=v;});}
      else{const w=nS>1?bw/nS:bw;p.v.forEach((v,i)=>{if(v==null)return;x.fillStyle=spec.pn&&v<0?"#ff6b5e":spec.s[i][1];const y0=Y(0),y1=Y(v);x.fillRect(x0+i*w,Math.min(y0,y1),Math.max(1,w-(nS>1?1:0)),Math.abs(y0-y1));});}}}
  else spec.s.forEach((sr,i)=>{x.strokeStyle=sr[1];x.lineWidth=1.8;x.beginPath();let on=false;
    for(const p of pts){const v=p.v[i];if(v==null){on=false;continue;}const xx=X(p.h+(p.w/2)),y=Y(v);if(!on){x.moveTo(xx,y);on=true;}else x.lineTo(xx,y);}x.stroke();});
  x.restore();
  // bills as markers along the top
  if(spec.ev&&S.hist){x.fillStyle="#ff7a8a";for(const [t,id] of S.hist.ev){const h=t/60;if(h<h0||h>=h1)continue;if(spec.ev===1&&id!=="outage"&&pfRepArea(id)!==PFUI.area)continue;const xx=X(h);x.beginPath();x.moveTo(xx-4,T);x.lineTo(xx+4,T);x.lineTo(xx,T+6);x.fill();}}
  // the crosshair
  const hx=PFUI.hx[cv.dataset.ch];if(hx!=null){const h=h0+hx*(h1-h0);x.strokeStyle="rgba(255,255,255,.55)";x.lineWidth=1;x.beginPath();x.moveTo(X(h),T);x.lineTo(X(h),Bm);x.stroke();}
  cv._g={h0,h1,L,R};return pts;}
const pfQ=sel=>{const o=$("pfOv");return o?o.querySelector(sel):null;};
function pfReadout(spec,pts,i){const el=pfQ(`[data-chr="${i}"]`);if(!el)return;const hx=PFUI.hx[i];
  if(hx==null||!pts.length){const last=pts[pts.length-1];const t=last?`${PFUI.zoom==="24h"||spec.k==="line"?"Latest":"Today"}: `+spec.s.map((s,j)=>(spec.s.length>1?s[0]+" ":"")+pfFmt(last.v[j],spec.u)+(spec.u&&spec.u!=="$"?" "+spec.u:"")).join(" · "):"";if(el.textContent!==t)el.textContent=t||" ";return;}
  const cv=pfQ(`canvas[data-ch="${i}"]`),g=cv&&cv._g;if(!g)return;const h=g.h0+hx*(g.h1-g.h0);let p=null;for(const q of pts)if(q.h<=h)p=q;if(!p)return;
  let t=(p.w===24?pfDayLbl(p.h):pfHourLbl(p.h))+": "+spec.s.map((s,j)=>(spec.s.length>1?s[0]+" ":"")+pfFmt(p.v[j],spec.u)+(spec.u&&spec.u!=="$"?" "+spec.u:"")).join(" · ");
  if(S.hist){const evs=S.hist.ev.filter(([tt,id])=>tt/60>=p.h&&tt/60<p.h+p.w&&(spec.ev===2||id==="outage"||pfRepArea(id)===PFUI.area));if(evs.length&&spec.ev)t+=" · "+evs.slice(0,3).map(([,id,v])=>(id==="outage"?"Outage budget":EV[id]?EV[id].name:id)+" "+money(v)).join(", ");}
  el.textContent=t;}
function pfCharts(){const P2=$("pfPanel");if(!P2||P2.hidden)return;PFUI.win=histWin(...pfWin());const W0=pfWin();
  P2.querySelectorAll("canvas[data-ch]").forEach(cv=>{const i=cv.dataset.ch,spec=PFUI.specs[i];if(!spec)return;const pts=pfDraw(cv,spec,W0);pfReadout(spec,pts||[],i);});}
// tap or drag on a chart reads it out; leaving clears it (desktop)
// (v6.5.1: bound on the main page here, and on the second screen when the flow pops out, 50e)
function pfPtr(doc){doc.addEventListener("pointermove",e=>{const cv=e.target.closest&&e.target.closest("#pfPanel canvas[data-ch]");if(!cv||!cv._g)return;const r=cv.getBoundingClientRect(),g=cv._g;
  PFUI.hx[cv.dataset.ch]=clamp((e.clientX-r.left-g.L)/(g.R-g.L),0,0.9999);pfCharts();});
doc.addEventListener("pointerdown",e=>{const cv=e.target.closest&&e.target.closest("#pfPanel canvas[data-ch]");if(!cv)return;const r=cv.getBoundingClientRect(),g=cv._g;if(!g)return;
  PFUI.hx[cv.dataset.ch]=clamp((e.clientX-r.left-g.L)/(g.R-g.L),0,0.9999);pfCharts();});
doc.addEventListener("pointerout",e=>{const cv=e.target.closest&&e.target.closest("#pfPanel canvas[data-ch]");if(!cv||e.pointerType!=="mouse")return;delete PFUI.hx[cv.dataset.ch];pfCharts();});}
pfPtr(document);

/* ---- the panel: tabs for the thing tapped ---- */
function pfRows(rows){return rows.filter(Boolean).map(([k,v,c])=>`<div class="${c||""}"><span>${k}</span><b>${v}</b></div>`).join("");}
function pfBreak(D,live){const s=PFUI.sel;const [kind,a,b]=s.split(":"),t=D.made;let title="",rows=[],note="";
  const repAt=x=>Object.entries(D.rep).filter(([id])=>id!=="outage"&&pfRepArea(id)===x).map(([id,v])=>[EV[id]?EV[id].name:id,money(v)]);
  if(kind==="cat"){const c=a,[,name]=PF_CATN[c];title=name;
    Object.entries(D.sub[c]||{}).forEach(([k,v])=>{if(Math.abs(v)>0.5)rows.push([k,money(v)]);});
    rows.push(["Total",money(D.cat[c]),"tot"],["Per ton made",pfPerT(D.cat[c],t)]);
    const ar=PF_AREAS.filter(([x])=>Math.abs(D.by[x][c]||0)>0.5).map(([x,,full])=>[full,money(D.by[x][c])]);if(ar.length)rows.push(["Where it went","","hd"],...ar);
    if(live){const cm=P.costMul||1;
      if(c==="fiber")rows.push(["Now","","hd"],["OCC price",money(P.occPrice)+"/t"],["Bales fed, "+PF_RNAME[PFUI.mode],pfT(D.W.feed)],["Pulper yield",Math.round(P.yieldF*100)+" %"]);
      if(c==="energy")rows.push(["Now","","hd"],["Energy per ton",money(Math.max(0,energyCost()-pfChemT()))+"/t"],["Grade steam","×"+(P.steamMul||1).toFixed(2)],["Shoe press and APC","×"+(P.energyMul||1).toFixed(2)],P.siteEnergy?["Site",(P.siteEnergy-(P.siteChem||0)>=0?"+":"−")+money(Math.abs(P.siteEnergy-(P.siteChem||0)))+"/t"]:null,cm!==1?["Survival costs","×"+cm.toFixed(2)]:null);
      if(c==="chem")rows.push(["Now","","hd"],["Chemicals and water per ton",money(pfChemT())+"/t"],P.refSave?["Refiner upgrade","−"+money(P.refSave)+"/t"]:null,P.siteChem?["Site",(P.siteChem>=0?"+":"−")+money(Math.abs(P.siteChem))+"/t"]:null,cm!==1?["Survival costs","×"+cm.toFixed(2)]:null);
      if(c==="frin"||c==="frout"){const base=c==="frin"?FR.inBase+(P.siteHaul||0):FR.outBase+(P.siteFreight||0),fx=c==="frout"?frFx():0;
        rows.push(["Now","","hd"],[c==="frin"?"Haul per ton of bales":"Freight per ton shipped",money(c==="frin"?frInRate():frOutRate())+"/t"],["Site base",money(base)+"/t"],["Diesel",`$${(fuelIdx()*FR.dieselBase).toFixed(2)}/gal · rate ×${frFuel().toFixed(2)}`],
          ["Weather",`${(WXN[S.wx]||S.wx||"clear").toLowerCase()} ×${frWx().toFixed(2)}`],frEv()>1?["Detours","×"+frEv().toFixed(2),"bad"]:null,fx?["Deals and events",(fx>0?"+":"−")+money(Math.abs(fx))+"/t",fx>0?"bad":"ok"]:null,
          c==="frin"&&cm!==1?["Survival costs","×"+cm.toFixed(2)]:null);}
      if(c==="labor")rows.push(["Now","","hd"],["Drivers on shift",String(Math.round(C.drivers.v))],["Loaders on shift",String(Math.round(C.loaders.v))],P.robots?["Robot loaders",String(P.robots)]:null);}
    if(c==="maint"){const r=Object.entries(D.rep).map(([id,v])=>[id==="outage"?"Outage budget":EV[id]?EV[id].name:id,money(v)]);if(r.length)rows.push(["Bills, "+PF_RNAME[PFUI.mode],"","hd"],...r);}
    if(c==="over")note="Site-wide costs: they join the flow at Site & admin.";}
  else if(kind==="node"||kind==="drop"){const x=a,full=PF_AN[x][2],lp=live?pfLamp(x):null;title=full;
    if(lp)rows.push(["Status",PF_LAMP[lp][1],lp==="run"?"ok":lp==="down"?"bad":""]);
    const r=pfRate(x,D,live);if(r)rows.push([live?"Through now":"Through the day",r]);
    let sum=0;PF_CATS.forEach(([c,name])=>{const v=D.by[x][c]||0;if(Math.abs(v)>0.5){rows.push([name,money(v),b===c?"sel":""]);sum+=v;}});
    rows.push(["Added here",money(sum),"tot"],["Per ton made",pfPerT(sum,t)]);
    const rp=repAt(x);if(rp.length)rows.push(["Repair bills","","hd"],...rp);
    if(x==="site")note="Costs that belong to the whole mill: overhead, insurance, the maintenance crew, civics, and bills not tied to one area.";
    if(x==="pm")note="Energy here is mostly dryer steam. Chemicals split between stock prep and the wet end.";}
  else if(a==="paper"){title="Paper";
    rows=[["Shipped",pfT(D.shipT)],["Sales",money(D.rev)],D.deals?["Deals and trials",money(D.deals)]:null,["Revenue",money(D.revenue),"tot"],
      ["Made (good paper)",pfT(D.made)],["Worth at the prices of the day",money(D.W.val)],["Broke to the beater",pfT(D.W.broke)]];
    if(live)rows.push(["Now","","hd"],["Grade on the machine",C.grade],["Price",money(priceOf(C.grade))+"/t"]);
    note="Revenue lands when a truck leaves, so it comes in lumps. \"Worth\" values the paper as it comes off the reel.";}
  else if(a==="waste"){title="Waste";const W=D.W;
    rows=[["Bales fed",pfT(W.feed)],["Rejects → landfill",pfT(W.rej)],["Share of bales",W.feed>0.5?Math.round(W.rej/W.feed*100)+" %":"–"],W.bale>0.05?["Bales lost (fire, rain, beavers)",pfT(W.bale)]:null,
      ["Effluent fiber (white water)",pfT(W.eff)],["Broke, back to the pulper",pfT(W.broke)],W.spill>0.05?["Stock spilled (chest overflow, to the sewer)",pfT(W.spill),"bad"]:null,W.scrap>0.05?["Finished rolls scrapped (fire, wind)",pfT(W.scrap),"bad"]:null,W.fine>0?["Wastewater permit fines",money(W.fine)+(W.fines>1?" ("+W.fines+")":""),"bad"]:null];
    note="Waste is tons, shown for interest: landfill and effluent don't cost anything on their own. Broke isn't lost; it goes round again.";}
  else if(a==="profit"){title=D.profit>=0?"Profit":"Loss";rows=[["Revenue",money(D.revenue),"tot"]];
    PF_CATS.forEach(([c,name])=>rows.push([name,"−"+money(D.cat[c])]));
    rows.push([D.profit>=0?"Profit":"Loss",money(D.profit),"tot "+(D.profit>=0?"ok":"bad")],["Per ton shipped",D.shipT>0.5?money(D.profit/D.shipT):"–"],["Per ton made",pfPerT(D.profit,t)]);
    if(D.upg)rows.push(["Upgrades bought (not counted)",money(D.upg)]);
    note=`Operating money for ${PF_RNAME[PFUI.mode]}. Upgrades are a choice, so they're left out.`;}
  return {title,rows,note};}

function pfTabs(sel){const [kind,a]=sel.split(":");return kind==="node"?[["tr","Trends"],...(a==="site"?[]:[["ct","Controls"]]),["co","Costs"],["uq","Uptime & quality"]]:sel==="out:profit"?[["wf","Where it went"],["tr","Trends"],["bk","Breakdown"]]:[["tr","Trends"],["bk","Breakdown"]];}
const PF_DCS={yard:["PLAN"],pulper:["SPOT"],stock:["SPOT"],pm:["WET","DET","QCS"],winder:["DET"],ship:["PLAN"],site:["UTIL","WATER"]};
/* ---- v6.5 the area controls live here (they were Settings > Area controls). The #cards section moves between a hidden
   holder and the Controls tab; CSS shows only this area's cards. Same rules as before: on AUTO and locked in a season
   or survival run (09-season-leaderboard.js seasonLocks), free in Free Play. ---- */
const PF_CARDA=["yard","yard","pulper","stock","pm","winder","ship"];
function pfCtlHome(){const cs=$("cards"),h=$("pfHold");if(cs&&h&&cs.parentNode!==h)h.appendChild(cs);}
function pfCtlMount(a){const cs=$("cards"),t=$("pfCtl");if(!cs||!t)return;cs.dataset.area=a;if(cs.parentNode!==t)t.appendChild(cs);G3.pfCtlOn=true;}
{const cs=$("cards"),d=$("areactl");if(cs){const h=kEl("div","pfhold");h.id="pfHold";h.hidden=true;document.body.appendChild(h);
    cs.querySelectorAll(":scope > .card").forEach((c,i)=>c.dataset.a=PF_CARDA[i]||"site");h.appendChild(cs);}
  if(d){const n=kEl("div","setgrp pfctlnote",`<span>Area controls are in <b>Report → Control room → Process flow</b>: tap an area, then <b>Controls</b>.</span><button type="button" id="pfCtlGo">Open process flow</button>`);n.id="areactl";d.replaceWith(n);
    $("pfCtlGo").addEventListener("click",()=>{const x=document.querySelector('#v2sheet header button[aria-label="Close panel"]');if(x)x.click();pfOpen();});}}
function pfPanelHTML(D,live){const sel=PFUI.sel,[kind,a]=sel.split(":"),tabs=pfTabs(sel);if(!PFUI.tab||!tabs.some(t=>t[0]===PFUI.tab))PFUI.tab=tabs[0][0];
  if(a==="site"&&PFUI.tab==="uq")PFUI.tab="tr";
  PFUI.area=kind==="node"?a:null;const B=pfBreak(D,live),specs=[];let body="";
  const zoom=`<div class="seg pfzoom" role="group" aria-label="Chart range">${[["24h","24 h"],["7d","7 d"],["run","Run"]].map(([k,l])=>`<button type="button" data-pz="${k}" aria-pressed="${PFUI.zoom===k}">${l}</button>`).join("")}</div>`;
  const charts=list=>list.filter(c=>!c.opt||(S.hist&&S.hist.rows.some(r=>hv(r,"a.civE")!=null))).map(c=>{specs.push(c);return pfChartHTML(c,specs.length-1);}).join("");
  if(PFUI.tab==="tr"){body=zoom+charts(kind==="node"?PF_TR[a]:PF_TR[sel]||[]);if(S.zen&&kind!=="node")body=zoom+charts((PF_TR[sel]||[]).filter(c=>c.u!=="$"));}
  else if(PFUI.tab==="ct")body=`<p class="pfpn pflock">${document.body.classList.contains("season-lock")?"<b>AUTO · locked during a season or survival run.</b> The mill runs these itself; Free Play lets you run them by hand.":"Free play: move a slider, or tap AUTO to hand it back to the mill."}</p><div id="pfCtl"></div>`;
  else if(PFUI.tab==="bk")body=`<div class="pfpr">${pfRows(B.rows)}</div>${B.note?`<p class="pfpn">${B.note}</p>`:""}`;
  else if(PFUI.tab==="wf")body=pfWaterfall(D);
  else if(PFUI.tab==="co"){const W=histWin(...pfWin()),all=histWin(-1e9,pfNowH()+1);
    const sp={t:"Cost added here",u:"$",k:"stack",s:PF_CATS.filter(([c])=>[...all.rows].some(r=>hv(r,"b."+a+"."+c))).map(([c,n,col])=>[n,col,V_("b."+a+"."+c)])};
    const tot=(rows,c)=>rows.reduce((s,r)=>s+(hv(r,"b."+a+"."+c)||0),0),made=rows=>rows.reduce((s,r)=>s+(hv(r,"made")||0),0),mw=made(W.rows),ma=made(all.rows);
    const tr=sp.s.map(([n],j)=>{const c=PF_CATS.find(x=>x[1]===n)[0],w=tot(W.rows,c),r=tot(all.rows,c);return [n,`${money(w)} · ${mw>0.5?money(w/mw):"–"}/t <small>(run ${ma>0.5?money(r/ma):"–"}/t)</small>`];});
    if(!sp.s.length)sp.s=[["Maintenance",PF_CATN.maint[2],V_("b."+a+".maint")]];   // (an area with no costs yet still gets its chart)
    body=`<div class="pfpr">${pfRows(B.rows)}</div>`+zoom+charts([sp])+`<div class="dcssub pfsub">This chart range against the whole run</div><div class="pfpr">${pfRows(tr)}</div>`;}
  else if(PFUI.tab==="uq"){const W=histWin(...pfWin()),dn={};W.dn.forEach(o=>{if(o)for(const k in o)if(pfDnArea(k)===a)dn[k]=(dn[k]||0)+o[k];});
    const cs=Object.entries(dn).sort((x,y)=>y[1]-x[1]).slice(0,8),mx=cs.length?cs[0][1]:1;
    const cause=cs.length?cs.map(([k,m])=>`<div class="pfdn"><span>${PF_DNN[k]||(EV[k]?EV[k].name:k)}</span><i><s style="width:${(m/mx*100).toFixed(0)}%"></s></i><b>${m>=90?(m/60).toFixed(1)+" h":Math.round(m)+" min"}</b></div>`).join(""):`<p class="pfpn">No downtime in this range.</p>`;
    body=zoom+charts(PF_UQ[a]||[])+`<div class="dcssub pfsub">Downtime by cause · ${PFUI.zoom==="24h"?"last 24 h":PFUI.zoom==="7d"?"last 7 days":"the run"}</div>${cause}`;}
  PFUI.specs=specs;
  const dl=kind==="node"&&!S.zen?(PF_DCS[a]||[]).map(x=>`<button type="button" class="pfdcs" data-pfdcs="${x}">${x}${x==="PLAN"||x==="QCS"?"":" DCS"} ↗</button>`).join(""):"";
  return `<div class="pfph"><b>${B.title}</b>${dl}<button type="button" class="dcsx" id="pfPopX" aria-label="Close details">✕</button></div>
    <div class="pftabs" role="tablist">${tabs.map(([k,l])=>`<button type="button" role="tab" data-ptab="${k}" aria-selected="${PFUI.tab===k}"${a==="site"&&k==="uq"?" hidden":""}>${l}</button>`).join("")}</div><div class="pfpb">${body}</div>`;}

/* ---- refresh: once a second while open (and at once on a tap) ---- */
function pfRender(force){if(!PFUI.open)return;const o=$("pfOv");if(!o)return;
  const prev=S.pf&&S.pf.prev,hasH=!!(S.hist&&S.hist.rows.length);if(PFUI.mode==="y"&&!prev)PFUI.mode="t";
  o.querySelectorAll("[data-pd]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.pd===PFUI.mode));if(b.dataset.pd==="y"){b.disabled=!prev;b.title=prev?"":"After the first full mill day";}if(b.dataset.pd==="w"||b.dataset.pd==="r")b.disabled=!hasH;});
  const pr=o.querySelector(".pfprior");pr.hidden=!(PFUI.mode==="w"||PFUI.mode==="r")||!(S.hist&&S.hist.bf);
  $("pf-h").textContent=`${(typeof NAME==="string"&&NAME)||"PM1"} · PROCESS FLOW`;
  o.querySelectorAll("[data-pv2]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.pv2===PFUI.view)));
  if(PFUI.play&&PFUI.rp!=null){const [,h1]=pfRpWin();PFUI.rp=Math.min(h1-1,PFUI.rp+1);if(PFUI.rp>=h1-1)PFUI.play=false;}
  const live=PFUI.mode==="t"&&PFUI.rp==null,D=PFUI.rp!=null?pfRpD():pfRangeD();
  $("pfClock").textContent=D&&PFUI.rp!=null?`Replay · ${pfHourLbl(PFUI.rp)} · one hour`:D?(live?`Day ${D.day} · ${clockOf(S.t)} · ${D.h.toFixed(1)} h into the mill day (6am to 6am)`:PFUI.mode==="y"?`Day ${D.day} · the whole mill day`:`${pfHourLbl(D.h0)} to now · ${D.h} h`):"";
  $("pfNote").textContent=BF.busy?`Loading the last ${HIST_PRIOR} days… ${Math.round(BF.p*100)}%`:S.zen?"Zen: the books keep running, but money doesn't count here":"Live: the mill keeps running at your speed";
  if(!D){$("pfMap").innerHTML=`<p class="pfwait">The flow starts with the first game minute.</p>`;return;}
  const key=[PFUI.mode,PFUI.prior,PFUI.sel,PFUI.tab,PFUI.zoom,pfVert()?1:0,Math.round(S.t*4),PFUI.view,PFUI.rp,PFUI.play].join("|");if(!force&&key===PFUI.h){pfCharts();return;}
  const skey=[PFUI.sel,PFUI.tab,PFUI.zoom,PFUI.mode].join("|");PFUI.h=key;
  const put=(id,h)=>{const e=$(id);if(e._h!==h){e._h=h;e.innerHTML=h;}};
  put("pfIn",PFUI.view==="t"?pfInputsT(D):pfInputs(D));put("pfMap",PFUI.view==="t"?pfSVGt(D,live):pfSVG(D,live));put("pfOut",pfOutputs(D));put("pfOee",pfOEE());pfRepHTML();
  const pp=$("pfPanel");pp.hidden=!PFUI.sel;$("pfOv").querySelector(".dcs").classList.toggle("panel",!!PFUI.sel);
  G3.pfCtlOn=false;
  if(!PFUI.sel)pfCtlHome();
  if(PFUI.sel){const b0=pp.querySelector(".pfpb");pp._sc=b0?b0.scrollTop:0;const h=pfPanelHTML(D,live);if(force||pp._k!==skey||PFUI.tab==="bk"||PFUI.tab==="co"){const same=pp._k&&pp._k.split("|").slice(0,2).join()===skey.split("|").slice(0,2).join();if(pp._h!==h)pfCtlHome();put("pfPanel",h);pp._k=skey;const b=pp.querySelector(".pfpb"),b0=pp._sc||0;if(b)b.scrollTop=same?b0:0;}if(PFUI.tab==="ct"&&PFUI.area)pfCtlMount(PFUI.area);else pfCtlHome();pfCharts();}}

// (v6.7: the process flow opens from Report > Control room, 51i; it was a button in Settings > View)
document.addEventListener("keydown",e=>{if(e.key!=="Escape"||!PFUI.open)return;e.preventDefault();e.stopPropagation();if(PFUI.sel){PFUI.sel=null;pfRender(true);}else pfClose();},true);
UI_TICKS.push(n=>{if(!PFUI.open)return;const m=$("v2menu");if(m&&!m.hidden&&!POP.on){pfClose();return;}if(n%5===0)pfRender();});
G3.pfSel=(k,tab,zoom)=>{PFUI.sel=k;PFUI.tab=tab||null;if(zoom)PFUI.zoom=zoom;pfRender(true);};G3.pfMode=m=>{PFUI.mode=m;pfRender(true);};G3.histSum=histSum;G3.histRows=histRows;   // (tests)
addEventListener("resize",()=>{if(PFUI.open)pfRender(true);});
G3.pfOpenUI=pfOpen;G3.pfCloseUI=pfClose;G3.pfCalc=pfCalc;G3.simRate=simRate;   // (tests: tools/pflowcheck.py)
