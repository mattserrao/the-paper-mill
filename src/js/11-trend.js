/* ---------- Stats: 24-hour trend chart, theme colors, shared animation phases ---------- */
const tc=$("trend"),tctx=tc.getContext("2d");
// chart colors come from the CSS tokens; read once (they don't change while the page is open)
const col={};
function readColors(){const cs=getComputedStyle(document.documentElement);
  ["muted","line","stock","machine","kraft","ok"].forEach(k=>col[k]=cs.getPropertyValue("--"+k).trim());}
const DPR=()=>Math.min(2,window.devicePixelRatio||1);
function sizeTrend(){const d=DPR(),w=tc.clientWidth||1000;tc.width=w*d;tc.height=150*d;}
sizeTrend();window.addEventListener("resize",sizeTrend);
// animation phases advanced by the 3D frame (conveyor belt, chest swirl, sheet, dryer cans, forklifts)
const V={belt:0,swirl:0,sheet:0,cans:0,lifts:[],rollsAnim:0};
function drawTrend(){if(!col.muted)readColors();if(tc.width<4)sizeTrend();
  const d=DPR(),W=tc.width/d,H=150;tctx.setTransform(d,0,0,d,0,0);tctx.clearRect(0,0,W,H);
  const l=34,r=W-8,t=8,b=H-20;
  tctx.font='11px "IBM Plex Mono",monospace';tctx.fillStyle=col.muted;tctx.strokeStyle=col.line;tctx.lineWidth=1;tctx.textAlign="right";
  [0,50,100].forEach(v=>{const y=b-(b-t)*v/100;tctx.beginPath();tctx.moveTo(l,y);tctx.lineTo(r,y);tctx.stroke();tctx.fillText(v+"%",l-4,y+4);});
  tctx.textAlign="center";[-24,-18,-12,-6,0].forEach(h=>{const x=l+(r-l)*(h+24)/24;tctx.fillText(h===0?"now":h+"h",x,H-5);});
  const n=S.trend.length;if(n<2)return;
  [[0,col.stock],[1,col.machine],[2,col.kraft],[3,col.ok]].forEach(([i,c])=>{
    tctx.strokeStyle=c;tctx.lineWidth=i===0?2.4:1.6;tctx.beginPath();
    S.trend.forEach((p,j)=>{const x=l+(r-l)*(j+144-n)/143,y=b-(b-t)*clamp(p[i],0,1);j?tctx.lineTo(x,y):tctx.moveTo(x,y);});
    tctx.stroke();
    const p=S.trend[n-1];tctx.fillStyle=c;tctx.beginPath();tctx.arc(r,b-(b-t)*clamp(p[i],0,1),3,0,7);tctx.fill();
  });
}
