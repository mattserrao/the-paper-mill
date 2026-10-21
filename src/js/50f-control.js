/* ---- v6.7 the control room: the DCS screens' trend pane (beside the picture), trending any tag, relationship analysis,
   and the new QCS (quality), PLAN (planning) and WATER screens. All read-only on the sim. The tags and their history:
   11d-tags.js. The screens open from Report > Control room, the operator consoles in the mill, and the second screen. ---- */
const DCS_SCREENS=[["SPOT","SPOT","Stock prep"],["WET","WET","Wet end"],["DET","DET","Dry end"],["UTIL","UTIL","Utilities"],["WATER","WATER","Water"],
  ["QCS","QCS","Quality"],["PLAN","PLAN","Planning"],["TREND","TREND","Trends"]];
const DCS_SCR={SPOT:{title:"STOCK PREP · DCS"},WET:{title:"WET END · DCS"},DET:{title:"DRY END · DCS"},UTIL:{title:"UTILITIES · DCS"},WATER:{title:"WATER · DCS"},
  QCS:{title:"QUALITY · QCS"},PLAN:{title:"PLANNING"},TREND:{title:"TRENDS"}};
AREA_N.WATER="Water";

/* ---------- the trend pane ---------- */
const TR_DEF={SPOT:["cp","amps","mcCons","refkw"],WET:["vac","couchSol","pl","pressSol"],DET:["st3","steam","moist","tension"],UTIL:["steam","boiler","tss"],
  WATER:["fresh","evap","outfall","wcl"],QCS:["moist","bw","off"],PLAN:["yard","fg","openo","lateo"],TREND:["speed","prod","moist","steam"]};
const TR_COL=["#7fb2ff","#ffb02e","#4fd18b","#ff7a8a","#c08bff","#3fc6d6"],TR_MAX=6;
const TR_RNG=[["1h","1 h",60],["6h","6 h",360],["24h","24 h",1440],["48h","48 h",2880],["7d","7 d",10080],["run","Run",Infinity]];
const TRUI={pens:{},rng:"6h",mode:"tr",hx:null,show:true,view:"pic",xy:{},rel:null,relRes:null,relKey:"",k:""};
// the picture's tag keys that are a different tag id
const TAGMAP={lvl:"chest",flow:"fan",hdr:"boiler",ifl:"fresh",ofl:"outfall",rej:"rejt",rolls:"conv",spool:"reel",wdt:"cut",stm:"boiler",chv:"chestg",mcv:"mcg",
  wcv:"wcg",shw:"shower",mk:"makeup",ovr:"wwover",pw:null,wret:null,dil:null,seal:null};
const trTagOf=k=>k in TAGMAP?TAGMAP[k]:TAGI[k]!=null?k:null;
const trScr=()=>KUI.st||"TREND";
const trPens=()=>{const a=trScr();if(!TRUI.pens[a])TRUI.pens[a]=(TR_DEF[a]||TR_DEF.TREND).slice();return TRUI.pens[a];};
const trSpan=()=>(TR_RNG.find(r=>r[0]===TRUI.rng)||TR_RNG[1])[2];
const trQ=sel=>{const o=$("dcsOv");return o?o.querySelector(sel):null;};
function trToggle(id){const p=trPens(),i=p.indexOf(id);if(i>=0)p.splice(i,1);else{if(p.length>=TR_MAX)p.pop();p.push(id);}
  if(TRUI.mode!=="tr")TRUI.mode="tr";trBuild();trDraw(true);}
function trOptions(sel){return Object.entries(TAG_AREA).map(([a,n])=>`<optgroup label="${n}">${TAGS.filter(t=>t[2]===a).map(t=>`<option value="${t[0]}"${t[0]===sel?" selected":""}>${t[1]}${t[3]?" ("+t[3]+")":""}</option>`).join("")}</optgroup>`).join("");}
function trBuild(){const el=$("dcsTrp");if(!el)return;const p=trPens();
  const head=`<div class="trh"><div class="seg trr" role="group" aria-label="Range">${TR_RNG.map(([k,l])=>`<button type="button" data-trr="${k}" aria-pressed="${TRUI.rng===k}">${l}</button>`).join("")}</div>
    <div class="seg trm" role="group" aria-label="View">${[["tr","Trend"],["xy","X–Y"],["rel","Moves with"]].map(([k,l])=>`<button type="button" data-trm="${k}" aria-pressed="${TRUI.mode===k}">${l}</button>`).join("")}</div></div>`;
  let body="";
  if(TRUI.mode==="tr")body=`<div class="trcv"><canvas id="trCv"></canvas></div><div class="trcur" id="trCur">&nbsp;</div>
    <div class="trpens">${p.map((id,i)=>`<div class="trpen"><i style="background:${TR_COL[i]}"></i><span>${tagName(id)}<small>${tagUnit(id)}${!tagHasLong(id)&&trSpan()>2880?" · last 48 h only":""}</small></span><b data-trv="${i}">–</b><em data-trs="${i}"></em><button type="button" data-trx="${id}" aria-label="Remove ${tagName(id)}">✕</button></div>`).join("")||`<p class="dcsfield">No pens. Add one below.</p>`}</div>
    <div class="tradd"><select id="trAdd" aria-label="Add a pen"${p.length>=TR_MAX?" disabled":""}><option value="">${p.length>=TR_MAX?"Six pens: remove one to add":"+ Add a pen…"}</option>${trOptions()}</select><small>${KUI.st&&MIMIC[KUI.st]?"or tap a reading on the picture":""}</small></div>`;
  else if(TRUI.mode==="xy"){const X=TRUI.xy.x||p[0]||"speed",Y=TRUI.xy.y||p[1]||"prod";
    body=`<div class="trsel"><label>X <select id="trX">${trOptions(X)}</select></label><label>Y <select id="trY">${trOptions(Y)}</select></label></div>
      <div class="trcv"><canvas id="trXY"></canvas></div><p class="trstat" id="trXYs">&nbsp;</p>
      <p class="dcsfield">Each dot is one reading (fainter is older). r near +1 or −1: the two move together; near 0: no straight-line link. A delay is checked up to ${trSpan()>2880?"12 hours":"an hour"} either way.</p>`;}
  else{const T=TRUI.rel||p[0]||"speed";
    body=`<div class="trsel"><label>What moves with <select id="trRelT">${trOptions(T)}</select></label></div><div class="trrel" id="trRel"></div>
      <p class="dcsfield">Readings that rise and fall with this one over the range, strongest first, allowing a delay of up to ${trSpan()>2880?"12 hours":"an hour"} either way. Moving together isn't proof that one causes the other.</p>`;}
  el.innerHTML=head+body;TRUI.k="";TRUI.relKey="";}
function trLayout(){const o=$("dcsOv");if(!o)return;const d=o.querySelector(".dcs"),w=o.ownerDocument.defaultView||window,narrow=w.matchMedia("(max-width:1000px)").matches,a=KUI.st;
  const only=a==="TREND",split=!narrow&&TRUI.show&&!only,vt=narrow&&!only&&TRUI.view==="trend";
  d.classList.toggle("split",split);d.classList.toggle("trendonly",only);d.classList.toggle("v-trend",vt);
  o.querySelectorAll("[data-trv]").forEach(b=>b.setAttribute("aria-pressed",String((b.dataset.trv==="trend")===(vt||only))));
  const t=o.querySelector("[data-trt]");if(t){t.setAttribute("aria-pressed",String(TRUI.show));t.textContent=TRUI.show?"Trend ◂":"Trend ▸";t.hidden=only;}
  {const v=o.querySelector(".dcsview");if(v)v.hidden=only;}
  TRUI.k="";trDraw(true);}
function trWire(o){
  o.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-trk],[data-trr],[data-trm],[data-trx],[data-tradd]");if(!t)return;
    if(t.dataset.trk){trToggle(t.dataset.trk);const n=o.ownerDocument.defaultView.matchMedia("(max-width:1000px)").matches;if(n&&!o.querySelector(".dcs").classList.contains("v-trend")){const c=$("dcsClock");if(c)c.textContent=`${tagName(t.dataset.trk)}: ${trPens().includes(t.dataset.trk)?"added to":"taken off"} the trend`;}return;}
    if(t.dataset.trr){TRUI.rng=t.dataset.trr;TRUI.hx=null;trBuild();trDraw(true);return;}
    if(t.dataset.trm){TRUI.mode=t.dataset.trm;trBuild();trDraw(true);return;}
    if(t.dataset.trx){const p=trPens(),i=p.indexOf(t.dataset.trx);if(i>=0)p.splice(i,1);trBuild();trDraw(true);return;}
    if(t.dataset.tradd){const p=trPens();if(!p.includes(t.dataset.tradd)){if(p.length>=TR_MAX)p.pop();p.push(t.dataset.tradd);}TRUI.mode="tr";trBuild();trDraw(true);}});
  o.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.dataset&&e.target.dataset.trk){e.preventDefault();trToggle(e.target.dataset.trk);}});
  o.addEventListener("change",e=>{const id=e.target.id;
    if(id==="trAdd"&&e.target.value){const p=trPens();if(!p.includes(e.target.value)&&p.length<TR_MAX)p.push(e.target.value);trBuild();trDraw(true);}
    else if(id==="trX"){TRUI.xy.x=e.target.value;trDraw(true);}else if(id==="trY"){TRUI.xy.y=e.target.value;trDraw(true);}
    else if(id==="trRelT"){TRUI.rel=e.target.value;TRUI.relKey="";trDraw(true);}});
  const pos=e=>{const cv=e.target.closest&&e.target.closest("#trCv");if(!cv||!cv._g)return;const r=cv.getBoundingClientRect(),g=cv._g;TRUI.hx=clamp((e.clientX-r.left-g.L)/(g.R-g.L),0,1);TRUI.k="";trDraw(true);};
  o.addEventListener("pointermove",pos);o.addEventListener("pointerdown",pos);
  o.addEventListener("pointerout",e=>{if(e.pointerType==="mouse"&&e.target.id==="trCv"){TRUI.hx=null;TRUI.k="";trDraw(true);}});
  (o.ownerDocument.defaultView||window).addEventListener("resize",()=>{if(KUI.st)trLayout();});}
// the time window: [t0, t1] in sim minutes, newest at the right
function trWin(){const span=trSpan(),t1=S.t;if(span!==Infinity)return [t1-span,t1];
  const H=S.hist,first=H&&H.rows.length?H.rows[0][0]*60:(TG.len?TG.t[(TG.i-TG.len+TG.n)%TG.n]:0);return [Math.min(first,t1-60),t1];}
const trShown=()=>{const o=$("dcsOv");if(!o||o.hidden||!KUI.st)return false;const d=o.querySelector(".dcs");return d.classList.contains("split")||d.classList.contains("trendonly")||d.classList.contains("v-trend");};
function trCanvas(cv,h){const w=cv.ownerDocument.defaultView||window,dpr=Math.min(2,w.devicePixelRatio||1),cw=cv.clientWidth||400;
  if(cv.width!==Math.round(cw*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(cw*dpr);cv.height=Math.round(h*dpr);cv.style.height=h+"px";}
  const x=cv.getContext("2d");x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle="#0f1b2d";x.fillRect(0,0,cw,h);return [x,cw];}
const trTimeLbl=(t,span)=>span<=1440?clockOf(t):span<=2880?`D${Math.floor(t/1440)+1} ${clockOf(t).replace(":00","")}`:`Day ${Math.floor(t/1440)+1}`;
function trDraw(force){if(!trShown())return;const key=[TRUI.mode,TRUI.rng,trPens().join(),TRUI.hx,Math.floor(S.t),TRUI.xy.x,TRUI.xy.y,TRUI.rel].join("|");
  if(!force&&key===TRUI.k)return;TRUI.k=key;
  if(TRUI.mode==="tr")trDrawLines();else if(TRUI.mode==="xy")trDrawXY();else trDrawRel();}
function trDrawLines(){const cv=trQ("#trCv");if(!cv)return;const H=250,[x,cw]=trCanvas(cv,H),[t0,t1]=trWin(),L=8,R=cw-8,T=10,B=H-22,X=t=>L+(t-t0)/Math.max(1,t1-t0)*(R-L),span=t1-t0,pens=trPens();
  x.strokeStyle="rgba(140,170,210,.15)";x.lineWidth=1;for(let k=1;k<4;k++){x.beginPath();x.moveTo(L,T+(B-T)*k/4);x.lineTo(R,T+(B-T)*k/4);x.stroke();}
  // time labels and day lines
  x.fillStyle="rgba(190,205,230,.75)";x.font="600 10px system-ui,sans-serif";x.textAlign="center";
  const step=span<=60?15:span<=360?60:span<=1440?240:span<=2880?480:span<=10080?1440:Math.max(1440,Math.ceil(span/1440/8)*1440);
  for(let t=Math.ceil(t0/step)*step;t<=t1;t+=step){const xx=X(t);x.strokeStyle=t%1440===0?"rgba(79,209,139,.35)":"rgba(140,170,210,.12)";x.beginPath();x.moveTo(xx,T);x.lineTo(xx,B);x.stroke();if(xx>L+20&&xx<R-20)x.fillText(trTimeLbl(t,span),xx,H-6);}
  if(t0<0){x.fillStyle="rgba(142,164,196,.10)";x.fillRect(X(t0),T,X(Math.min(0,t1))-X(t0),B-T);}
  const cur=TRUI.hx==null?null:t0+TRUI.hx*(t1-t0),vals=[];let any=false;
  pens.forEach((id,i)=>{const sr=tagSeries(id,t0,t1);let lo=Infinity,hi=-Infinity;for(const v of sr.v){if(v<lo)lo=v;if(v>hi)hi=v;}
    if(!(hi>-Infinity)){vals.push([null,null,null]);return;}any=true;
    if(hi-lo<Math.max(Math.abs(hi)*0.02,1e-6)){const c=(hi+lo)/2,w=Math.max(Math.abs(c)*0.05,1);lo=c-w;hi=c+w;}const pad=(hi-lo)*0.08;lo-=pad;hi+=pad;
    const Y=v=>B-(v-lo)/(hi-lo)*(B-T);x.strokeStyle=TR_COL[i];x.lineWidth=1.8;x.beginPath();let on=false,pt=-1e9;
    for(let k=0;k<sr.t.length;k++){const t=sr.t[k],v=sr.v[k],gap=t-pt>(sr.hourly&&t<(TG.len?TG.t[(TG.i-TG.len+TG.n)%TG.n]:Infinity)?90:8);pt=t;const xx=X(t),y=Y(v);if(!on||gap){x.moveTo(xx,y);on=true;}else x.lineTo(xx,y);}x.stroke();
    let cv0=sr.v.length?sr.v[sr.v.length-1]:null;if(cur!=null){let best=null,bd=1e9;for(let k=0;k<sr.t.length;k++){const d=Math.abs(sr.t[k]-cur);if(d<bd){bd=d;best=sr.v[k];}}cv0=bd<=(span>2880?90:6)?best:null;}
    vals.push([cv0,lo+pad,hi-pad]);});
  if(!any){x.fillStyle="rgba(190,205,230,.8)";x.font="600 13px system-ui,sans-serif";x.fillText(TG.len<2?"Collecting data… (a reading every 2 game minutes)":"No readings in this range",(L+R)/2,(T+B)/2);}
  if(cur!=null){const xx=X(cur);x.strokeStyle="rgba(255,255,255,.55)";x.beginPath();x.moveTo(xx,T);x.lineTo(xx,B);x.stroke();}
  cv._g={L,R};
  {const c=trQ("#trCur"),t=cur!=null?`Day ${Math.floor(cur/1440)+1} · ${clockOf(cur)}`:`Now · Day ${Math.floor(S.t/1440)+1} · ${clockOf(S.t)}`;if(c&&c.textContent!==t)c.textContent=t;}
  pens.forEach((id,i)=>{const b=trQ(`[data-trv="${i}"]`),s=trQ(`[data-trs="${i}"]`),[v,lo,hi]=vals[i]||[];if(b){const t=tagFmt(id,v);if(b.textContent!==t)b.textContent=t;}
    if(s){const t=lo==null?"":`${tagFmt(id,lo).replace(" "+tagUnit(id),"")} – ${tagFmt(id,hi).replace(" "+tagUnit(id),"")}`;if(s.textContent!==t)s.textContent=t;}});}

/* ---------- relationship analysis ---------- */
// aligned readings over the window: 2-minute rows from the ring (48 h and less), else the hourly history
function relData(){const [t0,t1]=trWin(),out={dt:2,n:0,col:{}};
  if(t1-t0<=2880+1&&TG.len&&TG.S===S){const idx=[];for(let n=0;n<TG.len;n++){const i=(TG.i-TG.len+n+TG.n)%TG.n;if(TG.t[i]>=t0&&TG.t[i]<=t1)idx.push(i);}
    out.n=idx.length;TAGS.forEach((t,j)=>{const a=new Float64Array(idx.length);for(let k=0;k<idx.length;k++)a[k]=TG.v[j][idx[k]];out.col[t[0]]=a;});return out;}
  out.dt=60;const rows=S.hist?S.hist.rows.filter(r=>r[0]*60>=t0&&r[0]*60<=t1):[];out.n=rows.length;
  TAGS.forEach(t=>{if(!t[5]||HCI[t[5]]==null)return;const c=HCI[t[5]],a=new Float64Array(rows.length);rows.forEach((r,k)=>{const v=r[c];a[k]=v==null?NaN:v;});out.col[t[0]]=a;});return out;}
function pear(x,y,lag){let n=0,sx=0,sy=0,sxx=0,syy=0,sxy=0;const N=x.length;
  for(let i=Math.max(0,-lag);i<N&&i+lag<N;i++){const a=x[i],b=y[i+lag];if(a!==a||b!==b)continue;n++;sx+=a;sy+=b;sxx+=a*a;syy+=b*b;sxy+=a*b;}
  if(n<12)return {r:0,n};const vx=sxx-sx*sx/n,vy=syy-sy*sy/n;if(vx<=1e-9*Math.max(1,sxx)||vy<=1e-9*Math.max(1,syy))return {r:0,n,flat:true};
  return {r:(sxy-sx*sy/n)/Math.sqrt(vx*vy),n,sl:(sxy-sx*sy/n)/vx,ic:(sy-((sxy-sx*sy/n)/vx)*sx)/n};}
function bestLag(x,y,maxL){const r0=pear(x,y,0);let best={...r0,lag:0};for(let L=-maxL;L<=maxL;L++){if(!L)continue;const p=pear(x,y,L);if(p.n>=12&&Math.abs(p.r)>Math.abs(best.r)+0.02)best={...p,lag:L};}return {best,r0};}
const lagTxt=(lag,dt,a,b)=>{if(!lag)return "at the same time";const m=Math.abs(lag)*dt,t=m>=90?(m/60).toFixed(m>=600?0:1)+" h":m+" min";return lag>0?`${b} follows ${a} by about ${t}`:`${b} leads ${a} by about ${t}`;};
function trDrawXY(){const cv=trQ("#trXY"),st=trQ("#trXYs");if(!cv)return;const p=trPens(),X=TRUI.xy.x||p[0]||"speed",Y=TRUI.xy.y||p[1]||"prod",D=relData(),x0=D.col[X],y0=D.col[Y];
  const H=260,[x,cw]=trCanvas(cv,H),L=46,R=cw-10,T=10,B=H-30;
  if(!x0||!y0){x.fillStyle="rgba(190,205,230,.8)";x.font="600 12px system-ui,sans-serif";x.textAlign="center";x.fillText("One of these has no history this far back: pick 48 h or less",(L+R)/2,H/2);if(st)st.textContent=" ";return;}
  let xl=Infinity,xh=-Infinity,yl=Infinity,yh=-Infinity,n=0;for(let i=0;i<x0.length;i++){const a=x0[i],b=y0[i];if(a!==a||b!==b)continue;n++;xl=Math.min(xl,a);xh=Math.max(xh,a);yl=Math.min(yl,b);yh=Math.max(yh,b);}
  if(n<12){x.fillStyle="rgba(190,205,230,.8)";x.font="600 12px system-ui,sans-serif";x.textAlign="center";x.fillText("Not enough readings yet",(L+R)/2,H/2);if(st)st.textContent=" ";return;}
  const fx=xh-xl||1,fy=yh-yl||1;xl-=fx*0.05;xh+=fx*0.05;yl-=fy*0.05;yh+=fy*0.05;const PX=v=>L+(v-xl)/(xh-xl)*(R-L),PY=v=>B-(v-yl)/(yh-yl)*(B-T);
  x.strokeStyle="rgba(140,170,210,.18)";x.strokeRect(L,T,R-L,B-T);x.fillStyle="rgba(190,205,230,.75)";x.font="600 10px system-ui,sans-serif";
  x.textAlign="right";[yl,(yl+yh)/2,yh].forEach(v=>x.fillText(tagFmt(Y,v).replace(" "+tagUnit(Y),""),L-4,PY(v)+3));x.textAlign="center";[xl,(xl+xh)/2,xh].forEach(v=>x.fillText(tagFmt(X,v).replace(" "+tagUnit(X),""),PX(v),B+13));
  x.fillText(tagName(X)+(tagUnit(X)?" ("+tagUnit(X)+")":""),(L+R)/2,H-3);
  for(let i=0;i<x0.length;i++){const a=x0[i],b=y0[i];if(a!==a||b!==b)continue;x.fillStyle=`rgba(127,178,255,${(0.15+0.75*i/x0.length).toFixed(2)})`;x.fillRect(PX(a)-1.5,PY(b)-1.5,3,3);}
  const maxL=D.dt===2?30:12,{best,r0}=bestLag(x0,y0,maxL);
  if(r0.sl!=null){x.strokeStyle="#ffb02e";x.lineWidth=1.5;x.beginPath();x.moveTo(PX(xl),PY(r0.ic+r0.sl*xl));x.lineTo(PX(xh),PY(r0.ic+r0.sl*xh));x.stroke();}
  if(st){const t=r0.flat?"One of them doesn't move in this range, so there's nothing to compare.":`r = ${r0.r.toFixed(2)} over ${r0.n} readings (${Math.abs(r0.r)>=0.7?"strong":Math.abs(r0.r)>=0.4?"moderate":Math.abs(r0.r)>=0.2?"weak":"no clear"} link${r0.r<-0.2?", opposite ways":""}).`+(best.lag?` Strongest with a delay: ${lagTxt(best.lag,D.dt,tagName(X).toLowerCase(),tagName(Y).toLowerCase())} (r = ${best.r.toFixed(2)}).`:"");if(st.textContent!==t)st.textContent=t;}}
function trDrawRel(){const el=trQ("#trRel");if(!el)return;const p=trPens(),T=TRUI.rel||p[0]||"speed",key=[T,TRUI.rng,Math.floor(S.t/30)].join("|");if(TRUI.relKey===key)return;TRUI.relKey=key;
  const D=relData(),x0=D.col[T];if(!x0||D.n<12){el.innerHTML=`<p class="dcsfield">${!x0?"This reading has no history this far back: pick 48 h or less.":"Not enough readings yet: give it a little longer."}</p>`;return;}
  const maxL=D.dt===2?30:12,res=[];
  for(const t of TAGS){const id=t[0];if(id===T||!D.col[id])continue;const {best,r0}=bestLag(x0,D.col[id],maxL);if(r0.flat||!(Math.abs(best.r)>=0.3))continue;
    if(Math.abs(r0.r)>0.995)continue;   // (the same reading in other units: chest level and volume)
    res.push({id,r:best.r,lag:best.lag,n:best.n});}
  res.sort((a,b)=>Math.abs(b.r)-Math.abs(a.r));
  el.innerHTML=res.length?res.slice(0,14).map(o=>`<div class="trrr"><span><b>${tagName(o.id)}</b><small>${o.r>0?"rises with it":"falls as it rises"} · ${lagTxt(o.lag,D.dt,tagName(T).toLowerCase(),tagName(o.id).toLowerCase())}</small></span><i><s style="width:${Math.round(Math.abs(o.r)*100)}%;background:${o.r>0?"#4fd18b":"#ff7a8a"}"></s></i><em>${o.r.toFixed(2)}</em><button type="button" data-tradd="${o.id}" title="Trend it">+ trend</button></div>`).join("")
    :`<p class="dcsfield">Nothing moves clearly with ${tagName(T).toLowerCase()} in this range.</p>`;}

/* ---------- QCS: the quality screen ---------- */
function qcsBuild(b){
  b.appendChild(kEl("div","qcshead",`<div class="qcsst" id="qcsSt"></div><div class="qcsv" id="qcsV"></div>`));
  b.appendChild(kEl("div","dcsctl",`<div class="dcssub">Beater &amp; on spec</div><div class="qcsv" id="qcsBk"></div>`));
  b.appendChild(kEl("div","dcstr",`<div class="dcssub">CD moisture profile · 12 zones (spec ±1.5 %)</div><canvas width="640" height="170" id="qcsCd"></canvas>`));
  b.appendChild(kEl("div","qcsdef",`<div class="dcssub">Web inspection</div><div class="qcsgrid" id="qcsDef"></div>`));
  b.appendChild(kEl("div","dcsctl",`<div class="dcssub">Spec sheet</div><div class="qtab" id="qcsSpec"></div>`));
  b.appendChild(kEl("div","dcsctl",`<div class="dcssub">Off-spec log · newest first</div><div class="qtab" id="qcsLog"></div>`));
  b.appendChild(kEl("div","dcsctl",`<div class="dcssub">Grade changes</div><div class="qtab" id="qcsGc"></div>`));}
const dhm=t=>`D${Math.floor(t/1440)+1} ${clockOf(t)}`;
const durTxt=m=>m>=90?(m/60).toFixed(1)+" h":Math.max(1,Math.round(m))+" min";
function qcsRefresh(){const Q=S.q||{},put=(id,h)=>{const e=$(id);if(e&&e._h!==h){e._h=h;e.innerHTML=h;}};
  const made=Q.made||0,off=Q.off||0,today=S.pf&&S.pf.W?S.pf.W.broke:0;
  put("qcsBk",`<div><small>On spec · the run</small><b>${made>0.5?((1-off/made)*100).toFixed(1)+" %":"–"}</b><small>${Math.round(made-off).toLocaleString()} t good</small></div>
    <div><small>To the beater today</small><b>${Math.round(today)} t</b><small>${Math.round(S.tot.broke||0).toLocaleString()} t this run</small></div>
    <div><small>Beater bay</small><b>${Math.round(Q.bank||0)} t</b><small>waiting to repulp</small></div><div><small>Repulped</small><b>${Math.round(S.tot.repulped||0).toLocaleString()} t</b><small>back to the stock chest</small></div>`);
  put("qcsSpec",`<table><thead><tr><th>Grade</th><th>Basis weight</th><th>Ring crush</th><th>Moisture</th><th>Color</th></tr></thead><tbody>${Object.entries(QSPEC).map(([g,s])=>{const b=qBw(g);return `<tr${g===C.grade?' class="cur"':""}><td>${g}${g===C.grade?" · on the machine":""}</td><td>${b[0].toFixed(2)}–${b[1].toFixed(2)} lb</td><td>min ${Math.round((RCT0[g]||60)*WE.rctSpec*10)/10} lbf</td><td>${s.m[0]}–${s.m[1]} %</td><td>${s.shade}</td></tr>`;}).join("")}</tbody></table>`);
  const L=(Q.log||[]).slice().reverse(),cur=Q.cur?[{...Q.cur,live:true}]:[];
  put("qcsLog",cur.length||L.length?`<table><thead><tr><th>When</th><th>How long</th><th>Grade</th><th>Why</th><th>To beater</th></tr></thead><tbody>${cur.concat(L).slice(0,15).map(s=>`<tr${s.live?' class="live"':""}><td>${dhm(s.t0)}</td><td>${s.live?"now · ":""}${durTxt(s.t1-s.t0+1)}</td><td>${s.g}</td><td>${s.why}</td><td>${(Math.round(s.tons*10)/10)} t</td></tr>`).join("")}</tbody></table>`:`<p class="dcsfield">No off-spec paper yet this run.</p>`);
  const G=(Q.gc||[]).slice().reverse();
  put("qcsGc",G.length?`<table><thead><tr><th>When</th><th>Change</th><th>Transition</th></tr></thead><tbody>${G.slice(0,10).map(c=>`<tr><td>${dhm(c.t)}</td><td>${c.from} → ${c.to}</td><td>${c.tons} t to the beater</td></tr>`).join("")}</tbody></table>`:`<p class="dcsfield">No grade changes yet this run.</p>`);}

/* ---------- PLAN: the planning screen (read only) ---------- */
function planRefresh(){const el=$("planBox");if(!el)return;const R=S.rates||{},pl=S.plan||{},rw=C.rollW.v,O=ordOn()?ordState():null,Q=bqOn()?bqState():null;
  const sec=(t,h)=>`<section class="plsec"><div class="dcssub">${t}</div>${h}</section>`;
  // production plan
  const tph=Math.max(1,R.prod||0),camp=[[C.grade,Math.max(0,pl.left||0),true]];
  {const q=(pl.q||[]).map(x=>[x.g,x.t]);let i=pl.cur&&pl.cur.i!==undefined?pl.cur.i:pl.i;const nx=[];for(let k=0;k<4;k++){i=(i+1)%WHEEL.length;const g=WHEEL[i],c=GCOST[g];nx.push([g,(c.mix[0]+c.mix[1])/2]);}
    q.concat(nx).slice(0,4).forEach(([g,t])=>camp.push([g,t,false]));}
  let acc=0;const prodH=camp.map(([g,t,cur],k)=>{const h=t/tph;const st=acc;acc+=h;return `<tr${cur?' class="cur"':""}><td>${cur?"Now":k===1&&pl.q&&pl.q.length?"Next (rush)":"Then"}</td><td>${g}</td><td>${cur?Math.round(t).toLocaleString()+" t left":"~"+Math.round(t).toLocaleString()+" t"}</td><td>${cur?"~"+durTxt(h*60)+" more":"from ~"+durTxt(st*60)}</td></tr>`;}).join("");
  const plan=`<p class="dcsfield">The market planner runs the grade wheel (${WHEEL.join(" → ")}) and books customer orders for each campaign. ${S.chg?`<b>Grade change to ${S.chg.to} in progress: ${S.chg.left.toFixed(1)} t of transition left.</b>`:""}</p>
    <table><thead><tr><th></th><th>Grade</th><th>Tons</th><th>Time at ${Math.round(tph)} t/h</th></tr></thead><tbody>${prodH}</tbody></table>`;
  // orders
  let ord="<p class=\"dcsfield\">Zen mode: no order book.</p>";
  if(O){const K=O.k,open=O.list.filter(o=>o.st==="open").sort((a,b)=>a.due-b.due),done=O.list.filter(o=>o.st!=="open").sort((a,b)=>b.done-a.done).slice(0,5),tons=K.onT+K.lateT;
    const st=o=>{const left=o.r-Math.round(o.sh),late=S.t>o.due+ORD.grace;return late?["bad","late "+durTxt((S.t-o.due)).replace(" "," ")]:o.ld>o.sh+0.5?["ok","loading"]:Math.floor(ordFree(o.g))>=Math.min(left,P.truckRolls)?["ok","ready"]:C.grade===o.g?["","making"]:["","waiting for "+o.g];};
    ord=`<div class="qcsv"><div><small>On-time delivery</small><b>${tons>0?Math.round(K.onT/tons*100)+" %":"–"}</b><small>${Math.round(tons).toLocaleString()} t on orders</small></div><div><small>Open orders</small><b>${open.length}</b><small>${open.filter(o=>S.t>o.due+ORD.grace).length} late · ${K.canc} canceled</small></div>
      <div><small>Spot market</small><b>${Math.round(K.spot)} t</b><small>−${money(K.spotV)} under list</small></div><div><small>Chargebacks</small><b>${money(K.chg)}</b><small>${K.dry} dry run${K.dry===1?"":"s"}</small></div></div>
      <table><thead><tr><th>#</th><th>Customer</th><th>Grade</th><th>Rolls shipped</th><th>Due</th><th>Status</th></tr></thead><tbody>${open.map(o=>{const s=st(o);return `<tr class="${s[0]==="bad"?"late":""}"><td>${o.id}</td><td>${ordCust(o)}</td><td>${o.g}</td><td>${Math.round(o.sh)} / ${o.r}${o.ld>o.sh+0.5?` <small>(${Math.round(o.ld-o.sh)} loading)</small>`:""}</td><td>${dhm(o.due)}</td><td class="${s[0]}">${s[1]}</td></tr>`;}).join("")||`<tr><td colspan="6">No open orders.</td></tr>`}</tbody></table>
      ${done.length?`<div class="dcssub">Recently closed</div><table><tbody>${done.map(o=>`<tr><td>${o.id}</td><td>${ordCust(o)}</td><td>${o.g}</td><td>${o.r} rolls</td><td>${o.st==="cancelled"?'<span class="bad">canceled</span>':o.done>o.due+ORD.grace?'<span class="bad">late</span>':'<span class="ok">on time</span>'}</td><td>${dhm(o.done)}</td></tr>`).join("")}</tbody></table>`:""}`;}
  // inventory
  const grades=Object.keys(GRADES),inv=grades.map(g=>{const have=fgOf(g),need=O?ordNeed(g):0,onT=S.outDock.filter(t=>t&&t.g===g).reduce((a,t)=>a+Math.max(0,t.want-t.load),0),free=have-onT,s=free-need;
    return `<tr${g===C.grade?' class="cur"':""}><td>${g}</td><td>${Math.round(have)} rolls · ${Math.round(have*rw)} t</td><td>${O?Math.round(need):"–"}</td><td class="${O&&s<-0.5?"bad":O&&s>=P.truckRolls?"ok":""}">${O?(s>=0?"+":"")+Math.round(s):"–"}</td></tr>`;}).join("");
  const yd=(R.feed||0)>0.5?S.yard/(R.feed*24):null,ch=(R.fiberUse||0)>0.5?S.tank/R.fiberUse:null;
  const invH=`<table><thead><tr><th>Warehouse</th><th>In stock</th><th>Open orders need</th><th>Surplus / short</th></tr></thead><tbody>${inv}</tbody></table>
    <div class="qcsv"><div><small>Warehouse</small><b>${Math.round(S.fg/P.fgCap*100)} %</b><small>${Math.round(S.fg)} of ${Math.round(P.fgCap)} rolls</small></div>
      <div><small>Bale yard</small><b>${Math.round(S.yard).toLocaleString()} t</b><small>${yd!=null?yd.toFixed(1)+" days at today's feed":"pulper idle"}</small></div>
      ${Q?`<div><small>Bales</small><b>${(Q.m*100).toFixed(1)} %</b><small>moisture · ${bqBand(Q.k)} · stickies ${Math.round(Q.ck*100)} %</small></div>`:""}
      <div><small>Stock chest</small><b>${Math.round(S.tank)} t</b><small>${ch!=null?durTxt(ch*60)+" of stock":"machine idle"}</small></div>
      <div><small>Paper at the winder</small><b>${Math.round(S.winderBuf+S.reel)} t</b><small>reel and store</small></div><div><small>Beater bay</small><b>${Math.round((S.q&&S.q.bank)||0)} t</b><small>to repulp</small></div></div>`;
  // trucks
  const inD=S.inDock.slice(0,P.doors).map((t,d)=>`<tr><td>Door ${d+1}</td><td>${t?`${Math.round(t.load)} t left${t.q?` · ${BT[t.q]?BT[t.q].n:t.q} · ${(t.m*100).toFixed(1)} % moisture`:""}`:"empty"}</td></tr>`).join("");
  const outD=S.outDock.slice(0,P.shipDoors).map((t,d)=>{if(!t)return `<tr><td>Door ${d+1}</td><td>empty</td></tr>`;const o=!t.spot&&t.oid&&ordGet(t.oid);return `<tr><td>Door ${d+1}</td><td>${t.g?`${t.spot?"Spot load":o?`#${o.id} ${ordCust(o)}`:"Order"} · ${t.g} · ${Math.round(t.load)} of ${Math.round(t.want||P.truckRolls)} rolls`:`${Math.round(t.load)} rolls`}</td></tr>`;}).join("");
  const trk=`<div class="plcols"><div><div class="dcssub">Inbound bales</div><p class="dcsfield">${C.inRate.v.toFixed(1)} trucks/h ${C.inRate.auto?"(auto)":"(hand)"} · ${S.inQ.length} waiting${Q?` · loads in: ${Q.A} A · ${Q.C} C · ${Q.M} MW`:""}</p><table><tbody>${inD}</tbody></table></div>
    <div><div class="dcssub">Outbound paper</div><p class="dcsfield">${C.outRate.v.toFixed(2)} trucks/h ${C.outRate.auto?"(auto: called for what's ready)":"(hand)"} · ${S.outQ.length} waiting${O&&O.k.dry?` · ${O.k.dry} dry runs`:""}</p><table><tbody>${outD}</tbody></table></div></div>`;
  const h=sec("Production plan",plan)+(Q?sec("OCC recipe",recHtml(Q)):"")+sec("Order book",ord)+sec("Inventory",invH)+sec("Trucks",trk);if(el._h!==h){el._h=h;el.innerHTML=h;}}
const bqOn=()=>typeof baleOn==="function"&&baleOn();
/* v6.8.3 OCC recipe editor (05b): bales per feed cycle for each kind, with its price, rejects and pile, the feed sequence
   with the bale going in now, and what the recipe costs. The buttons are handled by one listener on the document. */
function recHtml(Q){const r=Q.rec,N=recN(r),Y=recPiles(),R=S.rates||{},sq=recSeqC(r),cur=Math.floor(Q.fed+1e-9)%N,feed=R.feed||0;
  const rows=BTK.map(q=>{const b=BT[q],sh=r[q]/N,dy=feed>0.5?Y[q]/(feed*sh*24):null;
    return `<tr><td><i class="recsw rec${q}"></i>${b.n}</td><td>${money(btPrice(q))}/t <small>${b.dp>0?"+":b.dp<0?"−":"±"}$${Math.abs(b.dp)}</small></td><td>${Math.round(b.rej*100)} %</td>
      <td class="recy">${Math.round(Y[q]).toLocaleString()} t${dy!=null?`<small>${dy.toFixed(1)} d</small>`:""}</td>
      <td class="recst"><button type="button" data-rec="${q}-" aria-label="One fewer ${b.n}"${r[q]<=1?" disabled":""}>−</button><b>${r[q]}</b><button type="button" data-rec="${q}+" aria-label="One more ${b.n}"${r[q]>=RECMAX?" disabled":""}>+</button></td></tr>`;}).join("");
  const cost=BTK.reduce((a,q)=>a+r[q]*btPrice(q),0)/N,rj=1-recY(r),rate=recRate(),slow=rate<P.pulperMax-0.05;
  const chips=sq.map((q,i)=>`<i class="recb rec${q}${i===cur?" on":""}" title="${BT[q].n}">${BT[q].s}</i>`).join("");
  const mw=Y.M<=0.5&&r.M>0,out=BTK.filter(q=>Y[q]<=0.5).map(q=>BT[q].n);
  return `<p class="dcsfield">The pulper is fed in this order, bale by bale, and the trucks bring whichever kind is short. A bales cost more and pulp clean; Mixed Waste is cheap but a quarter of it goes to landfill.</p>
    <table class="rect"><thead><tr><th>Bale</th><th>Price</th><th>Rejects</th><th>Yard</th><th>Per cycle</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="recseq" aria-label="Feed sequence">${chips}</div>
    <div class="qcsv"><div><small>Recipe cost</small><b>${money(cost)}/t</b><small>${N} bales a cycle</small></div>
      <div><small>Pulper rejects</small><b>${(rj*100).toFixed(1)} %</b><small>now ${((1-Q.fy)*100).toFixed(1)} % · landfill $${LANDFILL}/t</small></div>
      <div><small>Pulper top rate</small><b class="${slow?"bad":""}">${Math.round(rate)} t/h</b><small>${slow?"slowed by Mixed Waste":"full rate"}</small></div>
      <div><small>Landfill so far</small><b>${money(Q.lf)}</b><small>this run</small></div></div>
    ${out.length?`<p class="dcsfield bad">Out of ${out.join(" and ")}: the feed skips ${out.length>1?"them":"it"} until a truck brings more.</p>`:""}`;}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-rec]");if(!b||b.disabled||!bqOn())return;const Q=bqState(),q=b.dataset.rec[0],d=b.dataset.rec[1]==="+"?1:-1;
  Q.rec[q]=clamp(Q.rec[q]+d,1,RECMAX);planRefresh();});

/* ---------- WATER: the water screen ---------- */
const DW={shw:()=>fmtGpm(GPM((S.wat?S.wat.r.p:0)*WAT.shower)),seal:()=>fmtGpm(GPM(WAT.base)),pw:()=>fmtGpm(GPM((S.wat?S.wat.r.p:0)*((S.dry?S.dry.m:DRY.m0)/100))),
  dil:()=>fmtGpm(GPM(WAT.sw*((S.rates&&S.rates.fiberIn)||0))),wret:()=>fmtGpm(GPM(WAT.sw*((S.rates&&S.rates.fiberUse)||0))),mk:()=>fmtGpm(GPM(S.wat?S.wat.r.make:0)),ovr:()=>fmtGpm(GPM(S.wat?S.wat.r.over:0))};
MIMIC.WATER={title:"WATER",h:320,
  eq:[[10,40,90,54,"RIVER INTAKE"],[116,40,90,54,"FRESH WATER"],[222,40,110,54,"SHOWERS & SEALS"],[350,40,120,54,"PAPER MACHINE"],[488,40,140,54,"DRYERS"],
    [222,170,110,60,"STOCK PREP"],[350,170,120,60,"WW CHEST"],[488,170,140,60,"CLARIFIER"],[222,262,110,32,"LANDFILL","s"],[488,262,140,32,"OUTFALL","s"]],
  ln:[["M100 67 H116"],["M206 67 H222"],["M332 67 H350"],["M470 67 H488"],["M410 94 V170"],["M350 200 H332"],["M277 170 V130 H380 V94"],["M161 94 V150 H392 V170",1],
    ["M470 200 H488"],["M558 230 V262"],["M277 230 V262"],["M558 40 V22",1]],
  tags:[MT(55,108,"ifl","FLOW",DV.ifl),MT(55,122,"ice","ICE",DV.ice),MT(161,108,"twl","LEVEL",DV.twl),MT(110,16,"wuse","FRESH WATER USE",DV.wuse),
    MT(277,108,"shw","SHOWERS",DW.shw),MT(277,122,"seal","SEALS",DW.seal),MT(410,108,"pw","IN PAPER",DW.pw),MT(410,122,"wret","TO CHEST",DW.wret),
    MT(558,108,"evap","EVAP",DV.evap),MT(558,16,"evap2","STACK",DV.evap),MT(165,188,"dil","DILUTION",DW.dil),MT(165,202,"rej","REJECTS",DV.rej),MT(270,146,"mk","MAKEUP",DW.mk),
    MT(410,244,"wcl","LEVEL",DV.wcl),MT(410,258,"wcv","VOL",DV.wcv),MT(410,272,"wcf","",DV.wcf),
    MT(558,128,"perm","PERMIT",DV.perm),MT(558,142,"ovr","TO SEWER",DW.ovr),MT(558,156,"tss","TSS",DV.tss),MT(558,308,"ofl","FLOW",DV.ofl)]};
TAGMAP.evap2="evap";TAGMAP.twl=null;TAGMAP.ice=null;TAGMAP.perm=null;TAGMAP.wcf=null;
PGX.WATER=[["intake",()=>stI("icedintake")],["tower",()=>active("icedintake")?"warn":"ok","tower"],["pumpBox",()=>"ok"],["headbox",()=>S.pm==="run"?"ok":"off"],["dryers",()=>S.pm==="run"?"ok":"off","d4"],
  ["pulper",()=>S.M&&S.M.pulperDown?"off":"ok","pulp"],["tank",()=>S.wat&&S.wat.short>0?"trip":S.wat&&S.wat.L<WAT.cap*0.25?"warn":"ok","wwc"],["clarifier",()=>or(stI("permit"),tssNow()>45?"warn":"ok")],
  ["landfill",()=>"ok"],["outfall",()=>"ok"]];
// the water screen's alarms (the river intake and the permit show here as well as on UTIL)
{const base=dcsAlarms;dcsAlarms=function(a,r,L){base(a,r,L);if(a!=="WATER")return;const al=(on,t,hi)=>{if(on)L.push([t,hi]);},W=S.wat;
  al(active("icedintake"),"RIVER INTAKE ICED · NO MAKEUP WATER",true);al(active("permit"),"WASTEWATER PERMIT EXCEEDED",true);
  al(!!(W&&W.short>0),"WHITE WATER CHEST EMPTY · STOCK THICK",true);al(!!(W&&W.short<=0&&W.L<WAT.cap*0.25),"WHITE WATER CHEST LEVEL LO",false);
  al(!!(W&&W.r.over>50),"WHITE WATER OVERFLOWING TO THE SEWER",false);al(tssNow()>45&&!active("permit"),"EFFLUENT TSS HI",false);};}
function waterRefresh(){const e=$("wBal");if(!e||!S.wat)return;const T=S.wat.tot,mg=v=>fmtGal(GAL(v||0)),paper=T.paper||0;
  const inn=[["Fresh water",T.fresh],["Water in the bales",T.bale],["Water in repulped beater",T.rep]],out=[["Up the dryer stack",T.evap],["In the paper",T.prod],["With the rejects",T.rej],["With the clarifier sludge",T.sludge],["Treated outfall",T.out]];
  const si=inn.reduce((a,x)=>a+(x[1]||0),0),so=out.reduce((a,x)=>a+(x[1]||0),0);
  const h=`<div class="wcol"><b>In</b>${inn.map(([k,v])=>`<div><span>${k}</span><em>${mg(v)}</em></div>`).join("")}<div class="tot"><span>Total in</span><em>${mg(si)}</em></div></div>
    <div class="wcol"><b>Out</b>${out.map(([k,v])=>`<div><span>${k}</span><em>${mg(v)}</em></div>`).join("")}<div class="tot"><span>Total out</span><em>${mg(so)}</em></div></div>
    <p class="dcsfield">Fresh water per ton of paper: <b>${paper>1?Math.round(GAL(T.fresh/paper)).toLocaleString()+" gal/ton":"–"}</b>. In less out (${mg(si-so)}) is the change in the water held in the white water chest and in the stock (${si-so<0?"they hold less than when the run started":"they hold more than when the run started"}).</p>`;
  if(e._h!==h){e._h=h;e.innerHTML=h;}}
G3.ctl={trPens,trToggle,relData,bestLag,TRUI,tagSeries,tagNow};   // (tests: tools/controlcheck.py)
