/* ---- v6.5.1 second screen: the DCS and the process flow pop out into their own window, for a second monitor ----
   Desktop only (a mouse and a big screen; ?popout forces it for tests). Nothing is copied or synced: the game writes the
   window itself (a copy of the stylesheet, a bar, an empty main) and moves the two screens' elements into it. The same
   code keeps running them from this page, on the same S, refreshed by the same UI ticks; $() looks in the second window
   for ids this page doesn't have (08-ui-wiring.js). While popped out the DCS doesn't slow the game (kuiSync), neither
   screen closes (closeStation / pfClose do nothing), and opening either from the mill (an operator console, Settings)
   switches the second screen to it. Closing the window, Dock back, or leaving this page puts both screens back here. */
const POPOK=()=>{try{if(new URLSearchParams(location.search).has("popout"))return true;
    return matchMedia("(hover:hover) and (pointer:fine)").matches&&Math.max(window.screen.width,window.screen.height)>=1100;}catch(_){return false;}};
/* v6.8.3: the second screen is the whole control room. It opens on the same tiles as Report > Control room; a tile fills
   the window with that app, and "← Control room" in the bar comes back. Views: home, pf (process flow), dcs (the DCS
   and its PLAN / QCS / WATER / TREND screens, by KUI.st), rm (relationship map) and man (manning). Opening any of them
   from the game window while popped out (a console in the mill, a control room tile) switches the second screen to it. */
const POPV={home:1,pf:1,dcs:1,rm:1,man:1};
const POP_APPS=[["pf","Process flow","Money and tons through the mill"],["dcs","DCS","Stock prep, wet end, dry end, utilities"],["PLAN","Planning","Orders, inventory, trucks, OCC recipe"],
  ["QCS","Quality","Specs, off-spec log, beater"],["WATER","Water","Fresh water and the water balance"],["TREND","Trends","Trend anything, find what moves together"],
  ["REL","Reliability","Rounds, vibration and ADX motor tests"],["DRV","Drives","The MCC lineups: each drive's load"],["rm","Relationship map","What drives each reading, and what it moves"],["man","Manning","Who's on shift, vacations and cover"]];
const POP_DCS=new Set(["dcs","PLAN","QCS","WATER","TREND","REL","DRV"]);
const popApp=k=>POP_APPS.find(a=>a[0]===k);
// the bar's title for a view
function popTitle(v){if(v==="dcs"){const a=popApp(KUI.st);return a?a[1]:"DCS · "+(KUI.st||"SPOT");}const a=popApp(v);return a?a[1]:"";}
// a tile (or a button elsewhere) asked for k: a view, or one of the DCS's own screens
function popGo(k){if(POP_DCS.has(k)){if(S.zen)return;if(k==="dcs"){POP.inApp=true;try{openStation(KUI.st&&!["PLAN","QCS","WATER","TREND","DRV","REL"].includes(KUI.st)?KUI.st:(KUI.last||"SPOT"),"dcs");}finally{POP.inApp=false;}}
    else{POP.inApp=true;try{openStation(k,"dcs");}finally{POP.inApp=false;}}popShow("dcs");return;}
  popShow(k);}
try{const v=localStorage.getItem("paper-mill-popview");if(POPV[v])POP.view=v;}catch(_){}
function popShow(v){if(!POP.on)return;if(!POPV[v])v="home";if(S.zen&&v==="dcs")v="home";const was=POP.view;
  POP.view=v;try{localStorage.setItem("paper-mill-popview",v);}catch(_){}
  // the relationship map and manning are opened and closed with their view (the flow and the DCS stay live while popped out)
  POP.inApp=true;try{if(was==="rm"&&v!=="rm"&&RMUI.open)rmClose();if(was==="man"&&v!=="man"&&MANUI.open)manClose();
    if(v==="rm"&&!RMUI.open)rmOpen();if(v==="man"&&!MANUI.open)manOpen();}finally{POP.inApp=false;}
  const d=POP.w.document,m=d.getElementById("popMain");if(m)m.dataset.v=v;
  const bk=d.getElementById("popBack");if(bk)bk.hidden=v==="home";const at=d.getElementById("popApp");if(at)at.textContent=v==="home"?"":popTitle(v);
  if(v==="dcs"){if(!KUI.st)KUI.st="SPOT";stationBuild();}if(v==="pf")pfRender(true);popTiles();}
// the home tiles: the DCS screens are off in zen, as in Report > Control room
function popTiles(){const d=POP.w&&POP.w.document;if(!d)return;d.querySelectorAll("[data-pa]").forEach(b=>{const off=!!S.zen&&POP_DCS.has(b.dataset.pa);if(b.disabled!==off)b.disabled=off;});
  if(POP.view==="dcs"){const at=d.getElementById("popApp"),t=popTitle("dcs");if(at&&at.textContent!==t)at.textContent=t;}}
// the window takes the page's look: light or dark, the brand colour, season locks, zen
const POPCLS=["dark","season-lock","zen","surv","app"];
function popSkin(){const d=POP.w.document,b=d.body,want="pmpop "+POPCLS.filter(c=>document.body.classList.contains(c)).join(" ");
  if(b.className!==want.trim())b.className=want.trim();
  const st=document.documentElement.style.cssText;if(d.documentElement.style.cssText!==st)d.documentElement.style.cssText=st;
  const t=`${MILL.name||"The Paper Mill"} · Second screen`;if(d.title!==t)d.title=t;const h=d.getElementById("popT");if(h&&h.textContent!==t.toUpperCase())h.textContent=t.toUpperCase();
  popTiles();if(S.zen&&POP.view==="dcs")popShow("home");}
function popMsg(t){const e=POP.w&&POP.w.document.getElementById("popMsg");if(e)e.textContent=t||"";}
function popOpen(v){v=v==="both"||!v?"home":v;
  if(POP.on){let ok=false;try{ok=POP.w&&!POP.w.closed;}catch(_){}if(ok){popGo(v);try{POP.w.focus();}catch(_){}return true;}popDock();}
  const sw=window.screen,W=Math.min(1600,(sw.availWidth||1440)-40),H=Math.min(1000,(sw.availHeight||900)-60);
  let w=null;try{w=window.open("","pmSecondScreen",`popup=yes,width=${W},height=${H}`);}catch(_){}
  if(!w){BANNERS.push({text:"The browser blocked the second screen. Allow pop-ups for this page, then try again.",t:null,tag:"WINDOW"});while(BANNERS.length>3)BANNERS.splice(1,1);diag("popout: blocked");return false;}
  const d=w.document;d.open();d.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>The Paper Mill · Second screen</title></head><body class="pmpop"></body></html>');d.close();
  document.querySelectorAll('head style,head link[rel="stylesheet"]').forEach(n=>d.head.appendChild(d.importNode(n,true)));
  d.body.innerHTML=`<header class="popbar"><button type="button" class="pb popback" id="popBack" hidden>← Control room</button><b id="popT"></b><span class="popapp" id="popApp"></span>
    <span class="sp"></span><span id="popMsg"></span><button type="button" class="pb" id="popMove" hidden title="Move this window to the screen the game isn't on">Move to other monitor</button>
    <button type="button" class="pb" id="popDock" title="Put the DCS and process flow back in the game window">Dock back</button></header><main class="popmain" id="popMain"><section class="pophome" id="popHome" aria-label="Control room"><div class="crh"><b>Control room</b><small>Pick a screen. ← Control room in the bar brings you back here.</small></div>
    <div class="crg">${POP_APPS.map(([k,l,s])=>`<button type="button" data-pa="${k}"><b>${l}</b><small>${s}</small></button>`).join("")}</div></section></main>`;
  POP.w=w;POP.on=true;
  const so=stationOv(),po=pfOv(),ro=rmOv(),mo=manOv(),m=d.getElementById("popMain");m.append(so,po,ro,mo);so.hidden=false;po.hidden=false;
  if(!KUI.st)KUI.st="SPOT";if(!PFUI.open){PFUI.sel=null;PFUI.mode="t";}PFUI.open=true;G3.pfOpen=true;
  pfPtr(d);
  d.querySelectorAll("[data-pa]").forEach(b=>b.addEventListener("click",()=>popGo(b.dataset.pa)));
  d.getElementById("popBack").addEventListener("click",()=>popShow("home"));
  d.getElementById("popDock").addEventListener("click",()=>popDock());
  const mv=d.getElementById("popMove");if("getScreenDetails" in w){mv.hidden=false;mv.addEventListener("click",()=>popMove());}
  w.addEventListener("pagehide",()=>{if(POP.w===w)popDock(true);});
  w.addEventListener("resize",()=>{if(POP.on&&POP.view!=="dcs")pfRender(true);});
  // Escape: first clears a selection in the flow, then goes back to the control room
  d.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(G3.VUI&&G3.VUI.id&&G3.vlvClose){e.preventDefault();G3.vlvClose();return;}if(PFUI.sel&&POP.view==="pf"){e.preventDefault();PFUI.sel=null;pfRender(true);return;}
    if(POP.view!=="home"){e.preventDefault();popShow("home");}});
  popSkin();POP.view="home";popGo(v);kuiSync();try{w.focus();}catch(_){}
  diag("popout: opened ("+v+")");return true;}
// on to another monitor, where the browser can say which (Chrome and Edge, with the person's permission)
async function popMove(){const w=POP.w;if(!w)return;try{const sd=await w.getScreenDetails(),cx=window.screenX+window.outerWidth/2,cy=window.screenY+window.outerHeight/2;
    const s=sd.screens.find(s=>!(cx>=s.left&&cx<s.left+s.width&&cy>=s.top&&cy<s.top+s.height));
    if(!s){popMsg("Only one monitor found");return;}w.moveTo(s.availLeft,s.availTop);w.resizeTo(s.availWidth,s.availHeight);popMsg("");}
  catch(e){popMsg("Drag this window to your other monitor");}}
// back into the game window: both screens closed, the area controls home (they may be in the flow's Controls tab)
function popDock(closing){if(!POP.on)return;const so=$("dcsOv"),po=$("pfOv"),ro=$("rmOv"),mo=$("manOv"),w=POP.w;
  try{pfCtlHome();}catch(_){}
  POP.inApp=true;try{if(RMUI.open)rmClose();if(MANUI.open)manClose();}catch(_){}POP.inApp=false;
  try{if(G3.vlvClose&&G3.VUI&&G3.VUI.id)G3.vlvClose();}catch(_){}
  POP.on=false;POP.w=null;
  [so,po,ro,mo,document.getElementById("vlvOv")||(w&&!w.closed?w.document.getElementById("vlvOv"):null)].forEach(o=>{if(o){o.hidden=true;try{document.body.appendChild(o);}catch(_){}}});
  KUI.st=null;PFUI.open=false;G3.pfOpen=false;G3.pfCtlOn=false;kuiSync();
  if(!closing)try{if(w&&!w.closed)w.close();}catch(_){}
  diag("popout: docked");}
G3.popOpen=popOpen;G3.popDock=popDock;G3.popState=()=>({on:POP.on,view:POP.view,st:KUI.st,pf:PFUI.open});   // (tests: tools/popoutcheck.py)
// the Second screen buttons (DCS and process flow headers, Settings > View): desktop only, hidden once popped out
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-popout]");if(b){e.preventDefault();popOpen(b.dataset.popout);}});
{const row=$("v2viewrow");if(row){const b=kEl("button","pfopen","⧉ Second screen");b.type="button";b.id="popBtn";b.dataset.popout="home";b.hidden=true;
    b.title="The control room in its own window, for a second monitor";row.appendChild(b);
    b.addEventListener("click",()=>{const x=document.querySelector('#v2sheet header button[aria-label="Close panel"]');if(x)x.click();},true);}}
UI_TICKS.push(()=>{const ok=POPOK();
  if(POP.on){let gone=true;try{gone=!POP.w||POP.w.closed;}catch(_){}if(gone){popDock(true);return;}popSkin();}
  [$("popBtn"),...(POP.on?[]:[$("dcsOv"),$("pfOv")].filter(Boolean).map(o=>o.querySelector("[data-popout]")))].forEach(b=>{if(b){const h=!ok||POP.on;if(b.hidden!==h)b.hidden=h;}});});
addEventListener("pagehide",()=>{try{if(POP.w&&!POP.w.closed)POP.w.close();}catch(_){}});
