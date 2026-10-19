/* ---- v6.5.1 second screen: the DCS and the process flow pop out into their own window, for a second monitor ----
   Desktop only (a mouse and a big screen; ?popout forces it for tests). Nothing is copied or synced: the game writes the
   window itself (a copy of the stylesheet, a bar, an empty main) and moves the two screens' elements into it. The same
   code keeps running them from this page, on the same S, refreshed by the same UI ticks; $() looks in the second window
   for ids this page doesn't have (08-ui-wiring.js). While popped out the DCS doesn't slow the game (kuiSync), neither
   screen closes (closeStation / pfClose do nothing), and opening either from the mill (an operator console, Settings)
   switches the second screen to it. Closing the window, Dock back, or leaving this page puts both screens back here. */
const POPOK=()=>{try{if(new URLSearchParams(location.search).has("popout"))return true;
    return matchMedia("(hover:hover) and (pointer:fine)").matches&&Math.max(window.screen.width,window.screen.height)>=1100;}catch(_){return false;}};
const POPV={dcs:"DCS",pf:"Process flow",both:"Both"};
try{const v=localStorage.getItem("paper-mill-popview");if(POPV[v])POP.view=v;}catch(_){}
// which screen shows: an area or the flow opened from the mill shows its own screen, unless both are up side by side
function popShow(v,force){if(!POP.on)return;if(S.zen&&v==="dcs")v="pf";if(POP.view==="both"&&!force)v="both";
  POP.view=v;try{localStorage.setItem("paper-mill-popview",v);}catch(_){}
  const d=POP.w.document,m=d.getElementById("popMain");if(m)m.dataset.v=v;
  d.querySelectorAll("[data-pv]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.pv===v)));
  if(v!=="pf"){if(!KUI.st)KUI.st="SPOT";stationBuild();}if(v!=="dcs")pfRender(true);}
// the window takes the page's look: light or dark, the brand colour, season locks, zen
const POPCLS=["dark","season-lock","zen","surv","app"];
function popSkin(){const d=POP.w.document,b=d.body,want="pmpop "+POPCLS.filter(c=>document.body.classList.contains(c)).join(" ");
  if(b.className!==want.trim())b.className=want.trim();
  const st=document.documentElement.style.cssText;if(d.documentElement.style.cssText!==st)d.documentElement.style.cssText=st;
  const t=`${MILL.name||"The Paper Mill"} · Second screen`;if(d.title!==t)d.title=t;const h=d.getElementById("popT");if(h&&h.textContent!==t.toUpperCase())h.textContent=t.toUpperCase();
  d.querySelectorAll('[data-pv="dcs"],[data-pv="both"]').forEach(x=>x.disabled=!!S.zen);if(S.zen&&POP.view!=="pf")popShow("pf",true);}
function popMsg(t){const e=POP.w&&POP.w.document.getElementById("popMsg");if(e)e.textContent=t||"";}
function popOpen(v){v=POPV[v]?v:POP.view;
  if(POP.on){let ok=false;try{ok=POP.w&&!POP.w.closed;}catch(_){}if(ok){popShow(v,true);try{POP.w.focus();}catch(_){}return true;}popDock();}
  const sw=window.screen,W=Math.min(1600,(sw.availWidth||1440)-40),H=Math.min(1000,(sw.availHeight||900)-60);
  let w=null;try{w=window.open("","pmSecondScreen",`popup=yes,width=${W},height=${H}`);}catch(_){}
  if(!w){BANNERS.push({text:"The browser blocked the second screen. Allow pop-ups for this page, then try again.",t:null,tag:"WINDOW"});while(BANNERS.length>3)BANNERS.splice(1,1);diag("popout: blocked");return false;}
  const d=w.document;d.open();d.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>The Paper Mill · Second screen</title></head><body class="pmpop"></body></html>');d.close();
  document.querySelectorAll('head style,head link[rel="stylesheet"]').forEach(n=>d.head.appendChild(d.importNode(n,true)));
  d.body.innerHTML=`<header class="popbar"><b id="popT"></b><div class="seg" role="group" aria-label="Show">${Object.entries(POPV).map(([k,l])=>`<button type="button" data-pv="${k}">${l}</button>`).join("")}</div>
    <span class="sp"></span><span id="popMsg"></span><button type="button" class="pb" id="popMove" hidden title="Move this window to the screen the game isn't on">Move to other monitor</button>
    <button type="button" class="pb" id="popDock" title="Put the DCS and process flow back in the game window">Dock back</button></header><main class="popmain" id="popMain"><div id="popZen">No DCS in Zen mode: the process flow keeps running.</div></main>`;
  POP.w=w;POP.on=true;
  const so=stationOv(),po=pfOv(),m=d.getElementById("popMain");m.append(so,po);so.hidden=false;po.hidden=false;
  if(!KUI.st)KUI.st="SPOT";if(!PFUI.open){PFUI.sel=null;PFUI.mode="t";}PFUI.open=true;G3.pfOpen=true;
  pfPtr(d);
  d.querySelectorAll("[data-pv]").forEach(b=>b.addEventListener("click",()=>popShow(b.dataset.pv,true)));
  d.getElementById("popDock").addEventListener("click",()=>popDock());
  const mv=d.getElementById("popMove");if("getScreenDetails" in w){mv.hidden=false;mv.addEventListener("click",()=>popMove());}
  w.addEventListener("pagehide",()=>{if(POP.w===w)popDock(true);});
  w.addEventListener("resize",()=>{if(POP.on&&POP.view!=="dcs")pfRender(true);});
  d.addEventListener("keydown",e=>{if(e.key==="Escape"&&PFUI.sel){e.preventDefault();PFUI.sel=null;pfRender(true);}});
  popSkin();popShow(v,true);kuiSync();try{w.focus();}catch(_){}
  diag("popout: opened ("+v+")");return true;}
// on to another monitor, where the browser can say which (Chrome and Edge, with the person's permission)
async function popMove(){const w=POP.w;if(!w)return;try{const sd=await w.getScreenDetails(),cx=window.screenX+window.outerWidth/2,cy=window.screenY+window.outerHeight/2;
    const s=sd.screens.find(s=>!(cx>=s.left&&cx<s.left+s.width&&cy>=s.top&&cy<s.top+s.height));
    if(!s){popMsg("Only one monitor found");return;}w.moveTo(s.availLeft,s.availTop);w.resizeTo(s.availWidth,s.availHeight);popMsg("");}
  catch(e){popMsg("Drag this window to your other monitor");}}
// back into the game window: both screens closed, the area controls home (they may be in the flow's Controls tab)
function popDock(closing){if(!POP.on)return;const so=$("dcsOv"),po=$("pfOv"),w=POP.w;
  try{pfCtlHome();}catch(_){}
  POP.on=false;POP.w=null;
  [so,po].forEach(o=>{if(o){o.hidden=true;try{document.body.appendChild(o);}catch(_){}}});
  KUI.st=null;PFUI.open=false;G3.pfOpen=false;G3.pfCtlOn=false;kuiSync();
  if(!closing)try{if(w&&!w.closed)w.close();}catch(_){}
  diag("popout: docked");}
G3.popOpen=popOpen;G3.popDock=popDock;G3.popState=()=>({on:POP.on,view:POP.view,st:KUI.st,pf:PFUI.open});   // (tests: tools/popoutcheck.py)
// the Second screen buttons (DCS and process flow headers, Settings > View): desktop only, hidden once popped out
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-popout]");if(b){e.preventDefault();popOpen(b.dataset.popout);}});
{const row=$("v2viewrow");if(row){const b=kEl("button","pfopen","⧉ Second screen");b.type="button";b.id="popBtn";b.dataset.popout="both";b.hidden=true;
    b.title="DCS and process flow in their own window, for a second monitor";row.appendChild(b);
    b.addEventListener("click",()=>{const x=document.querySelector('#v2sheet header button[aria-label="Close panel"]');if(x)x.click();},true);}}
UI_TICKS.push(()=>{const ok=POPOK();
  if(POP.on){let gone=true;try{gone=!POP.w||POP.w.closed;}catch(_){}if(gone){popDock(true);return;}popSkin();}
  [$("popBtn"),...(POP.on?[]:[$("dcsOv"),$("pfOv")].filter(Boolean).map(o=>o.querySelector("[data-popout]")))].forEach(b=>{if(b){const h=!ok||POP.on;if(b.hidden!==h)b.hidden=h;}});});
addEventListener("pagehide",()=>{try{if(POP.w&&!POP.w.closed)POP.w.close();}catch(_){}});
