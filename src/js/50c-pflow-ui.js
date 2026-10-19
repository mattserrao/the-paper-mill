/* ---- v6.3 process flow overview (Settings > View > Process flow) ----
   A control-room picture of the whole mill for the current mill day (6am to 6am), or yesterday: inputs on the left, the
   mill's areas in a row, outputs on the right. The band through the areas is drawn as wide as the money spent so far
   (a value build-up Sankey): each input drops in where it's spent, and what comes out the end meets the day's revenue.
   Waste is tons, drawn as thin dashed lines (not to scale). Tap anything for its breakdown. Reads only (11b-pflow.js);
   the game keeps running at the player's speed while it's open (v6.3.0-f2; f1 slowed it to 1 min/s). On narrow screens the
   picture runs top to bottom. */
const PFUI={open:false,mode:"t",sel:null,h:""};
const PF_LINES={yard:["Bale yard"],pulper:["Pulper"],stock:["Stock prep"],pm:["Paper","machine"],winder:["Winder"],ship:["Warehouse","& shipping"],site:["Site &","admin"]};
const PF_CATN=Object.fromEntries(PF_CATS.map(c=>[c[0],c])),PF_AN=Object.fromEntries(PF_AREAS.map(a=>[a[0],a]));
const pfT=v=>(Math.abs(v)>=100?Math.round(v).toLocaleString():(+v).toFixed(1))+" t";
const pfPerT=(v,t)=>t>0.5?money(v/t)+"/t":"–";
function pfOv(){let o=$("pfOv");if(o)return o;
  o=kEl("div","overlay top dcsov pfov");o.id="pfOv";o.hidden=true;
  o.innerHTML=`<div class="dcs pf" role="dialog" aria-modal="true" aria-labelledby="pf-h"><div class="dcsh"><b id="pf-h"></b>
    <div class="seg" role="group" aria-label="Mill day"><button type="button" data-pd="t">Today</button><button type="button" data-pd="y">Yesterday</button></div>
    <button aria-label="Close" class="dcsx" id="pfClose">✕</button></div>
    <div class="dcsb pfb" id="pfBody"><div class="pfcol pfin" id="pfIn"></div><div class="pfmap mimicw" id="pfMap"></div><div class="pfcol pfout" id="pfOut"></div></div>
    <div class="pfpop" id="pfPop" hidden></div>
    <div class="dcsf"><span id="pfClock"></span><span id="pfNote">Live: the mill keeps running</span></div></div>`;
  document.body.appendChild(o);
  $("pfClose").addEventListener("click",()=>pfClose());
  o.addEventListener("click",e=>{if(e.target===o){pfClose();return;}
    const pd=e.target.closest("[data-pd]");if(pd){if(pd.disabled)return;PFUI.mode=pd.dataset.pd;PFUI.sel=null;pfRender(true);return;}
    if(e.target.closest("#pfPopX")){PFUI.sel=null;pfRender(true);return;}
    const t=e.target.closest("[data-pf]");if(t){PFUI.sel=PFUI.sel===t.dataset.pf?null:t.dataset.pf;pfRender(true);}});
  o.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-pf][tabindex]")){e.preventDefault();e.target.dispatchEvent(new MouseEvent("click",{bubbles:true}));}});
  return o;}
function pfOpen(){const o=pfOv();if(G3.closeKnobUI)G3.closeKnobUI();PFUI.open=true;G3.pfOpen=true;PFUI.sel=null;PFUI.mode="t";o.hidden=false;pfRender(true);kuiSync();
  setTimeout(()=>{try{$("pfClose").focus({preventScroll:true});}catch(_){}},0);}
function pfClose(){const o=$("pfOv");if(o)o.hidden=true;const was=PFUI.open;PFUI.open=false;G3.pfOpen=false;kuiSync();if(was)try{$("gl").focus({preventScroll:true});}catch(_){}}
// the picture runs top to bottom on narrow screens
const pfVert=()=>window.matchMedia("(max-width:760px)").matches;

/* ---- status of each area right now (today only) ---- */
const PF_LAMP={run:["#4fd18b","Running"],upset:["#ffb02e","Upset"],brk:["#ffb02e","Sheet break"],hay:["#ffb02e","Hayout"],down:["#ff6b5e","Down"],held:["#8ea4c4","Held back"]};
function pfLamp(a){const M=S.M||{},up=(S.inc||[]).some(i=>pfRepArea(i.id)===a);
  switch(a){case "yard":return M.docksClosed?"down":up?"upset":"run";
    case "pulper":return M.pulperDown?"down":up?"upset":"run";
    case "pm":return S.pm==="run"?(up?"upset":"run"):S.pm==="break"?"brk":S.pm==="spools"||S.pm==="full"?"held":"down";
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
    if(tot[i]>0){const [x,y]=vert?[4,uOf(i)-3]:[uOf(i)+NU/2,24];o.push(txt(x,y,"+"+money(tot[i]),"pfadd",vert?"start":"middle"));}});
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
    let g=`<g data-pf="node:${a}" class="pfhit" tabindex="0" role="button" aria-label="${PF_AN[a][2]}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" class="meq pfnode${sel?" sel":""}"/>`;
    const top=cy-(L.length>1?32:24);L.forEach((s,j)=>g+=txt(cx,top+j*17,s,"mtl pfnl"));
    g+=txt(cx,cy+(L.length>1?20:14),tot[i]>0?money(tot[i]):"–","pfnv");
    const r=pfRate(a,D,live);if(r)g+=txt(cx,cy+(L.length>1?40:36),r,"pfnr");
    if(lp)g+=`<circle cx="${x+w-9}" cy="${y+9}" r="4.5" fill="${PF_LAMP[lp][0]}"><title>${PF_LAMP[lp][1]}</title></circle>`;
    o.push(g+"</g>");});
  o.push("</svg>");o.push(`<p class="pfcap">The blue band is as wide as the money spent so far ${live?"today":"that day"}; each input drops in where it's spent. Waste is tons (not to scale). Tap anything for its breakdown.</p>`);return o.join("");}

/* ---- inputs and outputs (HTML) ---- */
function pfInputs(D){const t=D.made;let h=`<div class="dcssub">Inputs · ${PFUI.mode==="y"?"yesterday":"today"}</div>`;
  PF_CATS.forEach(([c,name,col])=>{const v=D.cat[c];h+=`<button type="button" class="pfrow${PFUI.sel==="cat:"+c?" sel":""}" data-pf="cat:${c}"><i style="background:${col}"></i><span>${name}</span><b>${money(v)}</b><small>${pfPerT(v,t)}</small></button>`;});
  h+=`<div class="pfrow tot"><i></i><span>Total cost</span><b>${money(D.cost)}</b><small>${pfPerT(D.cost,t)}</small></div>`;
  return h;}
function pfOutputs(D){const W=D.W,mx=Math.max(D.revenue,D.cost,1),pos=D.profit>=0;
  return `<div class="dcssub">Outputs</div>
    <button type="button" class="pfbox${PFUI.sel==="out:paper"?" sel":""}" data-pf="out:paper"><b>Paper</b>
      <div><span>Shipped</span><em>${pfT(D.shipT)}</em><em>${money(D.revenue)}</em></div>
      <div><span>Made</span><em>${pfT(D.made)}</em><em>worth ${money(W.val)}</em></div></button>
    <button type="button" class="pfbox${PFUI.sel==="out:waste"?" sel":""}" data-pf="out:waste"><b>Waste</b>
      <div><span>Rejects → landfill</span><em>${pfT(W.rej)}</em></div><div><span>Effluent fiber</span><em>${pfT(W.eff)}</em></div>
      ${W.bale>0.05?`<div><span>Bales lost</span><em>${pfT(W.bale)}</em></div>`:""}<div><span>Broke (repulped)</span><em>${pfT(W.broke)}</em></div>
      ${W.fine>0?`<div class="bad"><span>Permit fines</span><em>${money(W.fine)}</em></div>`:""}</button>
    <button type="button" class="pfbox pfprof${PFUI.sel==="out:profit"?" sel":""}" data-pf="out:profit"><b>${pos?"Profit":"Loss"}</b>
      <div class="pfbar"><span>Revenue</span><i style="width:${(D.revenue/mx*100).toFixed(1)}%" class="r"></i></div>
      <div class="pfbar"><span>Cost</span><i style="width:${(D.cost/mx*100).toFixed(1)}%" class="c"></i></div>
      <strong class="${pos?"ok":"bad"}">${money(D.profit)}</strong><small>${D.shipT>0.5?money(D.profit/D.shipT)+" per ton shipped":"no paper shipped yet"}</small></button>`;}

/* ---- the breakdown pop-up ---- */
function pfRows(rows){return rows.filter(Boolean).map(([k,v,c])=>`<div class="${c||""}"><span>${k}</span><b>${v}</b></div>`).join("");}
function pfPop(D,live){const s=PFUI.sel;if(!s)return "";const [kind,a,b]=s.split(":"),t=D.made;let title="",rows=[],note="";
  const repAt=x=>Object.entries(D.rep).filter(([id])=>id!=="outage"&&pfRepArea(id)===x).map(([id,v])=>[EV[id]?EV[id].name:id,money(v)]);
  if(kind==="cat"){const c=a,[,name]=PF_CATN[c];title=name;
    Object.entries(D.sub[c]||{}).forEach(([k,v])=>{if(Math.abs(v)>0.5)rows.push([k,money(v)]);});
    rows.push(["Total",money(D.cat[c]),"tot"],["Per ton made",pfPerT(D.cat[c],t)]);
    const ar=PF_AREAS.filter(([x])=>Math.abs(D.by[x][c]||0)>0.5).map(([x,,full])=>[full,money(D.by[x][c])]);if(ar.length)rows.push(["Where it went","","hd"],...ar);
    if(live){const cm=P.costMul||1;
      if(c==="fiber")rows.push(["Now","","hd"],["OCC price",money(P.occPrice)+"/t"],["Bales fed today",pfT(D.W.feed)],["Pulper yield",Math.round(P.yieldF*100)+" %"]);
      if(c==="energy")rows.push(["Now","","hd"],["Energy per ton",money(Math.max(0,energyCost()-pfChemT()))+"/t"],["Grade steam","×"+(P.steamMul||1).toFixed(2)],["Shoe press and APC","×"+(P.energyMul||1).toFixed(2)],P.siteEnergy?["Site",(P.siteEnergy-(P.siteChem||0)>=0?"+":"−")+money(Math.abs(P.siteEnergy-(P.siteChem||0)))+"/t"]:null,cm!==1?["Survival costs","×"+cm.toFixed(2)]:null);
      if(c==="chem")rows.push(["Now","","hd"],["Chemicals and water per ton",money(pfChemT())+"/t"],P.refSave?["Refiner upgrade","−"+money(P.refSave)+"/t"]:null,P.siteChem?["Site",(P.siteChem>=0?"+":"−")+money(Math.abs(P.siteChem))+"/t"]:null,cm!==1?["Survival costs","×"+cm.toFixed(2)]:null);
      if(c==="labor")rows.push(["Now","","hd"],["Drivers on shift",String(Math.round(C.drivers.v))],["Loaders on shift",String(Math.round(C.loaders.v))],P.robots?["Robot loaders",String(P.robots)]:null);}
    if(c==="maint"){const r=Object.entries(D.rep).map(([id,v])=>[id==="outage"?"Outage budget":EV[id]?EV[id].name:id,money(v)]);if(r.length)rows.push(["Bills today","","hd"],...r);}
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
      ["Made (good paper)",pfT(D.made)],["Worth at today's prices",money(D.W.val)],["Broke to the beater",pfT(D.W.broke)]];
    if(live)rows.push(["Now","","hd"],["Grade on the machine",C.grade],["Price",money(priceOf(C.grade))+"/t"]);
    note="Revenue lands when a truck leaves, so it comes in lumps. \"Worth\" values the paper as it comes off the reel.";}
  else if(a==="waste"){title="Waste";const W=D.W;
    rows=[["Bales fed",pfT(W.feed)],["Rejects → landfill",pfT(W.rej)],["Share of bales",W.feed>0.5?Math.round(W.rej/W.feed*100)+" %":"–"],W.bale>0.05?["Bales lost (fire, rain, beavers)",pfT(W.bale)]:null,
      ["Effluent fiber (white water)",pfT(W.eff)],["Broke, back to the pulper",pfT(W.broke)],W.fine>0?["Wastewater permit fines",money(W.fine)+(W.fines>1?" ("+W.fines+")":""),"bad"]:null];
    note="Waste is tons, shown for interest: landfill and effluent don't cost anything on their own. Broke isn't lost; it goes round again.";}
  else if(a==="profit"){title=D.profit>=0?"Profit":"Loss";rows=[["Revenue",money(D.revenue),"tot"]];
    PF_CATS.forEach(([c,name])=>rows.push([name,"−"+money(D.cat[c])]));
    rows.push([D.profit>=0?"Profit":"Loss",money(D.profit),"tot "+(D.profit>=0?"ok":"bad")],["Per ton shipped",D.shipT>0.5?money(D.profit/D.shipT):"–"],["Per ton made",pfPerT(D.profit,t)]);
    if(D.upg)rows.push(["Upgrades bought (not counted)",money(D.upg)]);
    note="Operating money for the mill day. Upgrades are a choice, so they're left out.";}
  return `<div class="pfph"><b>${title}</b><button type="button" class="dcsx" id="pfPopX" aria-label="Close breakdown">✕</button></div><div class="pfpr">${pfRows(rows)}</div>${note?`<p class="pfpn">${note}</p>`:""}`;}

/* ---- refresh: once a second while open (and at once on a tap) ---- */
function pfRender(force){if(!PFUI.open)return;const o=$("pfOv");if(!o)return;
  const prev=S.pf&&S.pf.prev;if(PFUI.mode==="y"&&!prev)PFUI.mode="t";
  o.querySelectorAll("[data-pd]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.pd===PFUI.mode));if(b.dataset.pd==="y"){b.disabled=!prev;b.title=prev?"":"After the first full mill day";}});
  $("pf-h").textContent=`${(typeof NAME==="string"&&NAME)||"PM1"} · PROCESS FLOW`;
  const live=PFUI.mode==="t",D=S.pf?(live?pfCalc(S.pf):prev):null;
  $("pfClock").textContent=D?(live?`Day ${D.day} · ${clockOf(S.t)} · ${D.h.toFixed(1)} h into the mill day (6am to 6am)`:`Day ${D.day} · the whole mill day`):"";
  $("pfNote").textContent=S.zen?"Zen: the books keep running, but money doesn't count here":"Live: the mill keeps running at your speed";
  if(!D){$("pfMap").innerHTML=`<p class="pfwait">The flow starts with the first game minute.</p>`;return;}
  const key=[PFUI.mode,PFUI.sel,pfVert()?1:0,Math.round(S.t*4)].join("|");if(!force&&key===PFUI.h)return;PFUI.h=key;
  const put=(id,h)=>{const e=$(id);if(e._h!==h){e._h=h;e.innerHTML=h;}};
  put("pfIn",pfInputs(D));put("pfMap",pfSVG(D,live));put("pfOut",pfOutputs(D));
  const pp=$("pfPop"),ph=pfPop(D,live);pp.hidden=!ph;put("pfPop",ph);}

// Settings > View: the button that opens it (next to the fiddly knobs view switch)
{const row=$("v2viewrow"),b=kEl("button","pfopen","Process flow");b.type="button";b.id="pfBtn";b.title="Inputs, process and outputs for today's mill day";row.appendChild(b);
  b.addEventListener("click",()=>{const x=document.querySelector('#v2sheet header button[aria-label="Close panel"]');if(x)x.click();pfOpen();});}
document.addEventListener("keydown",e=>{if(e.key!=="Escape"||!PFUI.open)return;e.preventDefault();e.stopPropagation();if(PFUI.sel){PFUI.sel=null;pfRender(true);}else pfClose();},true);
UI_TICKS.push(n=>{if(!PFUI.open)return;const m=$("v2menu");if(m&&!m.hidden){pfClose();return;}if(n%5===0)pfRender();});
addEventListener("resize",()=>{if(PFUI.open)pfRender(true);});
G3.pfOpenUI=pfOpen;G3.pfCloseUI=pfClose;G3.pfCalc=pfCalc;G3.simRate=simRate;   // (tests: tools/pflowcheck.py)
