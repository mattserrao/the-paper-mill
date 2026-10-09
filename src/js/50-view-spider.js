// the mill is 3D only: G3.ok is false when WebGL is unavailable, and no3D() has already said so
function setView(){G3.on=G3.ok;$("view3d").hidden=!G3.on;$("jumps").hidden=!G3.on;}
function setFS(on){document.body.classList.toggle("fs",on);
  if(on){const el=$("view3d");if(el.requestFullscreen&&!document.fullscreenElement)el.requestFullscreen().catch(()=>{});}
  else if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&document.body.classList.contains("fs")){if(ZEN)setZen(false);else setFS(false);}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&ZEN){setZen(false);return;}if(e.key==="Escape"&&document.body.classList.contains("fs"))setFS(false);});
function openSlice(){$("spider").hidden=true;$("brian").hidden=true;$("slice").hidden=false;$("slcV").value=Math.round(G3.SLC.v*100);$("slcH").value=Math.round(G3.SLC.h*100);drawSlice();}
$("slcClose").addEventListener("click",()=>$("slice").hidden=true);
["slcV","slcH"].forEach(id=>$(id).addEventListener("input",e=>{if(G3.slcFix)return;G3.SLC[id==="slcV"?"v":"h"]=+e.target.value/100;G3.SLC.dirty=true;
  const g=G3.SLC.geo();if(g.lipX-g.wet>=6.8)slcBreak();drawSlice();}));
// v3.2.0: run the jet out to the couch and the sheet breaks; the wet-end operator comes over and puts the slice back
function slcBreak(){if(G3.slcFix)return;G3.slcFix={i:0,ph:"swear",t:0};
  if(S.pm==="run"){S.pm="break";S.brkType="press";S.breakLeft=2*(26+rand("brkx")*20);S.breakTotal=S.breakLeft;S.tot.breaks++;enqueue("brk");AUDIO.sfx("snap",2500);brkNote();}
  log("Sheet break! The slice was opened so far the wet line ran off the former. The wet-end operator is resetting it.","bad");
  ["slcV","slcH","slcReset"].forEach(id=>$(id).disabled=true);}
G3.onSlcReset=()=>{["slcV","slcH","slcReset"].forEach(id=>$(id).disabled=false);$("slcV").value=0;$("slcH").value=0;log("Slice reset to standard. Wet line is back where it belongs.","ok");drawSlice();};
$("slcReset").addEventListener("click",()=>{G3.SLC.v=G3.SLC.h=0;G3.SLC.dirty=true;$("slcV").value=0;$("slcH").value=0;drawSlice();});
function drawSlice(){const D=G3.SLC;if(!D||$("slice").hidden)return;const g=D.geo(),wl=g.lipX-g.wet;
  $("slcVv").textContent="B "+(12+3*D.v).toFixed(1)+" mm";$("slcHv").textContent="L "+(D.h>=0?"+":"")+(4*D.h).toFixed(1)+" mm";
  $("slcJ").textContent=(54.5-g.land).toFixed(2)+" m past the breast roll";$("slcW").textContent=wl.toFixed(1)+" m";
  const n=$("slcNote"),off=wl<4.1||wl>6.3;n.className="spin"+(off?" bad":"");
  if(G3.slcFix){n.className="spin bad";n.textContent="Sheet break! The wet line ran off the former. An operator is on the way to reset the slice.";G3.drawLB&&G3.drawLB();return;}
  n.textContent=wl<4.1?"Wet line is close to the headbox: the sheet is draining early. Open the slice or push the lip forward.":wl>6.3?"Wet line is creeping toward the couch: too much water on the wire. Close the slice or pull the lip back.":D.v<-0.7?"Jet is diving steeply into the wire. It's within range, but watch for rush.":"Jet and wet line look right.";
  G3.drawLB&&G3.drawLB();}
function briUpd(){const R=G3.scrubbers&&G3.scrubbers[0],on=G3.following&&G3.following();if(!R)return;
  $("briTxt").textContent=on?(R.st==="run"?"You're riding along. Drag to look around, scroll or pinch to zoom.":"He's parked for now. The camera will stay here until he heads out around 8:30 PM.")
    :R.st==="run"?"Keeping the hall floor spotless, one lap at a time.":"Off shift right now. He starts his rounds around 8:30 PM.";
  $("briGo").textContent=on?"Stop following":"Follow him";}
function openBrian(){$("spider").hidden=true;$("slice").hidden=true;$("brian").hidden=false;briUpd();}
$("briClose").addEventListener("click",()=>{$("brian").hidden=true;});
$("briGo").addEventListener("click",()=>{G3.follow(!G3.following());briUpd();});
G3.onFollowEnd=()=>{briUpd();};
function openSpider(){$("brian").hidden=true;$("slice").hidden=true;$("spider").hidden=false;$("spiV").value=Math.round(G3.SPD.v*100);drawSpider();}
$("spiClose").addEventListener("click",()=>$("spider").hidden=true);
$("spiV").addEventListener("input",e=>{G3.SPD.v=+e.target.value/100;drawSpider();});
function drawSpider(){const D=G3.SPD;if(!D||$("spider").hidden)return;
  $("spiTc").textContent=f0(D.tc)+" mg/L";$("spiTl").textContent=f0(D.tl)+" mg/L";$("spiQc").textContent=f0(D.qc)+" L/s · "+f0(Math.min(100,D.lc*100))+"% full";$("spiQl").textContent=f0(D.ql)+" L/s · "+f0(Math.min(100,D.ll*100))+"% full";
  const n=$("spiNote"),st=D.strain||0;n.className="spin"+(D.lc>=1||D.ll>=1||D.tl>150||st>0.05?" bad":"");
  if(D.reset){D.reset=false;$("spiV").value=Math.round(D.v*100);}
  n.textContent=st>0.05?`Dirty clear filtrate is loading up the disks: thickener struggling (${f0(st*100)}%). Send more filtrate to the cloudy side (slide right)!`:D.lc>=1?"Cloudy seal chest is overflowing.":D.ll>=1?"Clear seal chest is overflowing.":D.tl>200?"Fines are carrying over into the clear filtrate.":D.v>0.5?"Clear filtrate is very clean, but the cloudy chest is filling.":"Split looks healthy.";
  const c=$("spiT"),x=c.getContext("2d"),W=c.width,Hh=c.height,h=D.hist;x.clearRect(0,0,W,Hh);x.fillStyle="#fff";x.fillRect(0,0,W,Hh);
  x.strokeStyle="#e3e6ee";x.lineWidth=1;for(let k=1;k<4;k++){x.beginPath();x.moveTo(0,Hh*k/4);x.lineTo(W,Hh*k/4);x.stroke();}
  x.fillStyle="#7a8191";x.font="20px system-ui,sans-serif";x.fillText("TSS (log)",8,22);x.textAlign="right";x.fillText("flow (dashed)",W-8,22);x.textAlign="left";
  if(h.length<2)return;const X=i=>i/(179)*W,ly=v=>Hh-8-(Math.log10(Math.max(10,v))-1)/(Math.log10(2000)-1)*(Hh-36),fy=v=>Hh-8-v/Math.max(30,...h.map(r=>Math.max(r[2],r[3])))*(Hh-36);
  [[0,"#8a6644",ly,[]],[1,"#3fa0d0",ly,[]],[2,"#8a6644",fy,[10,8]],[3,"#3fa0d0",fy,[10,8]]].forEach(([k,col,Y,dash])=>{x.setLineDash(dash);x.strokeStyle=col;x.lineWidth=3;x.beginPath();h.forEach((r,i)=>i?x.lineTo(X(i),Y(r[k])):x.moveTo(X(i),Y(r[k])));x.stroke();});x.setLineDash([]);}
UI_TICKS.push(drawSpider);
const SPEEDS=[1,2,5,10,20,30,60,120];
function nudgeSpeed(d){const i=SPEEDS.findIndex(v=>v>=C.simSpeed);const n=SPEEDS[clamp((i<0?SPEEDS.length-1:i)+d,0,SPEEDS.length-1)];setSimSpeed(n);}
setView();

