// frame rate is a player choice (Controls): Smooth = the display's rate (v4 default), Battery saver = 30 fps; remembered
let FRAME_CAP=0;try{if(localStorage.getItem("paper-mill-fps")==="saver")FRAME_CAP=30;}catch(e){}G3.cap=FRAME_CAP;
function setFpsMode(smooth){FRAME_CAP=smooth?0:30;G3.cap=FRAME_CAP;try{localStorage.setItem("paper-mill-fps",smooth?"smooth":"saver");}catch(e){}document.querySelectorAll("#fpsSeg button").forEach(b=>b.setAttribute("aria-pressed",String((b.dataset.fps==="smooth")===smooth)));diag("frame rate: "+(smooth?"smooth 60":"battery saver 30"));}
let last=performance.now(),uiAcc=0,uiN=0,lastPaint=0;
/* frame-time record (v4): every drawn frame's interval while the game runs, for Controls > Diagnostics and the 15 s
   snapshot. A 600-frame window (~10 s at 60 FPS) plus totals since play started. Paused time isn't counted. */
const FT={win:new Float32Array(600),n:0,i:0,total:0,over33:0,over50:0,worst:0,since:0,
  add(ms){this.win[this.i]=ms;this.i=(this.i+1)%this.win.length;if(this.n<this.win.length)this.n++;this.total++;if(ms>33.4)this.over33++;if(ms>50)this.over50++;if(ms>this.worst)this.worst=ms;},
  pct(){if(!this.n)return null;const a=Array.from(this.win.subarray(0,this.n)).sort((x,y)=>x-y),q=p=>a[Math.min(a.length-1,Math.floor(p*a.length))];
    return {p50:q(0.5),p95:q(0.95),p99:q(0.99),fps:1000/(a.reduce((s,v)=>s+v,0)/a.length)};},
  reset(){this.n=this.i=this.total=this.over33=this.over50=this.worst=0;this.since=performance.now();}};
G3.FT=FT;let ftLast=0,ftRun=false;
// v4: the sim always advances in fixed 15-sim-second steps (leftover time carries to the next frame), so the same
// season plays out the same way at any frame rate or game speed
const SIM_STEP=0.25;let simAcc=0;
const paneShown=el=>{if(!el)return false;const p=el.closest(".v2pane");return p?document.body.classList.contains("sheet-open")&&p.classList.contains("on"):true;};
function frame(now){
  if(BANNERS.length){const b=BANNERS[0];if(b.t===null)b.t=now;if(now-b.t>5000)BANNERS.shift();}
  const cap=G3.capOff?0:FRAME_CAP;
  if(cap&&now-last<1000/cap-3){requestAnimationFrame(frame);return;}
  frame.n=(frame.n||0)+1;const PFo=G3.PF,fT0=performance.now();if(PFo&&PFo.on){PFo.gaps.push(now-(PFo.lastNow||now));PFo.lastNow=now;}
  {if(running&&!document.hidden){if(!ftRun){ftRun=true;if(!FT.since)FT.reset();}else if(ftLast)FT.add(now-ftLast);ftLast=now;}else{ftRun=false;ftLast=0;}}
  const rdt=Math.max(0,Math.min(0.1,(now-last)/1000));last=now;
  // schedule the next frame first: a bug in one frame must never stop the game loop (v2.8.5: the sim step too)
  requestAnimationFrame(frame);
  if(running){try{simAcc=Math.min(simAcc+rdt*C.simSpeed,60);while(simAcc>=SIM_STEP&&running){step(SIM_STEP);simAcc-=SIM_STEP;}}catch(e){if(!frame.serr)frame.serr=0;if(frame.serr++<5)console.error("sim error",e);}}
  if(PFo&&PFo.on)PFo.acc["SIM (game logic step)"]=(PFo.acc["SIM (game logic step)"]||0)+(performance.now()-fT0);
  try{const live=running||now-(G3.lastMove||0)<2500||now-lastPaint>1000;
    if(live){lastPaint=now;
      if(G3.on&&G3.frame)G3.frame(running?rdt:0);}
    uiAcc+=rdt;if(uiAcc>0.2){uiAcc=0;uiN++;try{AUDIO.update(running&&!S.zen&&(S.inc.length>0||S.wd==="hayout"));}catch(_){}
      const uT=performance.now();if(paneShown($("cards")))syncControls();updateText();UI_TICKS.forEach(f=>{try{f(uiN);}catch(e){console.error("ui tick",e);}});
      if(paneShown($("chaosSec")))updateChaos();if(!$("brian").hidden)briUpd();if(paneShown($("shopSec")))updateShop();{const rn=document.getElementById("relnow");if(rn&&rn.offsetParent)updateRel();}if(paneShown($("trend")))drawTrend();
      if(PFo&&PFo.on)PFo.acc["UI panels (5x/s)"]=(PFo.acc["UI panels (5x/s)"]||0)+(performance.now()-uT);}}
  catch(e){if(!frame.errs)frame.errs=0;if(frame.errs++<5)console.error("frame error",e);}
  if(PFo&&PFo.on){const d=performance.now()-fT0;PFo.js.push(d);}
}
syncControls();updateText();updateChaos();updateShop();
requestAnimationFrame(frame);
