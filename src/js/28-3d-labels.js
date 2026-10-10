  /* ---- labels: v4.1 draws every floating label (section labels and incident labels) on one 2D canvas inside #labels3d.
     As HTML they cost a style recalc, layout, repaint and layer commit every frame (60 nodes with every upset going); now
     each label's pill is drawn once into its own small offscreen canvas when its text changes (at most 5 times a second)
     and each frame only copies those at their projected spots, and only when something moved. The look follows the
     CSS (.lbl, .lbl.inc, compact view); colors and fonts are re-read only when the palette changes or a web font loads.
     #labels3d.lbl-idle fades section labels out, .lbl-off hides all of them, zen hides #labels3d, and anything that
     hides #labels3d (the autotest's "HTML labels hidden" phase) hides the canvas with it. Incident labels stay
     clickable: a tap without a drag on the 3D view is tested against their drawn boxes (29-3d-camera.js). */
  const labelHost=$("labels3d");
  const lc=document.createElement("canvas");lc.id="lbl2d";lc.setAttribute("aria-hidden","true");labelHost.appendChild(lc);
  // when CSS hides the overlay (zen, the autotest's labels-hidden phase, the diagnostics switch) its box collapses: skip drawing
  try{new ResizeObserver(en=>{const r=en[en.length-1].contentRect;const hid=!(r.width>0&&r.height>0);if(hid!==LB.hid){LB.hid=hid;LB.force=true;LB.shown=0;}}).observe(lc);}catch(e){}
  const lx=lc.getContext("2d"),LREC=[],LB=G3.LB={nd:0,np:0,w:0,h:0,d:0,gen:1,pal:-1,cmp:null,a:1,p:1,sig:0,shown:0,force:true};
  const lblNew=(inc,id)=>{const R={inc,id,a:null,b:"",bad:false,ver:0,pv:-1,pg:-1,vis:false,x:0,y:0,cv:null,W:0,H:0,m:0,on:false,rx:0,ry:0};LREC.push(R);return R;};
  const lblSet=(R,a,b,bad)=>{if(R.a!==a||R.b!==b||R.bad!==bad){R.a=a;R.b=b;R.bad=bad;R.ver++;}};
  try{if(document.fonts){document.fonts.addEventListener("loadingdone",()=>{LB.gen++;});document.fonts.ready.then(()=>{LB.gen++;});}}catch(e){}
  const mixW=(hex,k)=>{const m=/^#?([0-9a-f]{6})$/i.exec(hex);if(!m)return hex;const n=parseInt(m[1],16),c=s=>Math.round(((n>>s)&255)*k+255*(1-k));return `rgb(${c(16)},${c(8)},${c(0)})`;};
  function lblStyle(){LB.fb=tok("f-body");LB.ink=tok("ink");LB.muted=tok("muted");LB.bad=tok("bad");LB.brand=tok("brand");LB.incLine=mixW(LB.bad,0.45);LB.gen++;}
  const rr=(X,x,y,w,h,r)=>{r=Math.min(r,w/2,h/2);X.beginPath();X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath();};
  // one label's pill, drawn at the overlay's pixel ratio into its own canvas (box W x H CSS px, plus a margin m for the shadow)
  function pill(R){const C=LB.cmp,d=LB.d,inc=R.inc,showS=!C;R.cv=R.cv||document.createElement("canvas");const X=R.cv.getContext("2d");
    const bs=C?10.5:11,lb=1.3*bs,ls=14.3,fB=`700 ${bs}px ${LB.fb}`,fS=`500 11px ${LB.fb}`;
    X.font=fB;const mb=X.measureText(R.a||""),wb=11+mb.width;let ws=0,ms=null;if(showS){X.font=fS;ms=X.measureText(R.b||"");ws=ms.width;}
    const asc=(m,s)=>m.fontBoundingBoxAscent!=null?[m.fontBoundingBoxAscent,m.fontBoundingBoxDescent]:[0.93*s,0.24*s];
    let W,H,pl,pt;
    if(inc){pl=10;pt=4;W=2+20+Math.max(wb,ws);H=2+8+lb+(showS?ls:0);}
    else if(C){pl=5;pt=1;W=2+10+wb;H=2+2+lb;}
    else{pl=7;pt=2;W=2+16+wb+6+ws;H=2+4+Math.max(lb,ls);}
    W=Math.ceil(W);H=Math.ceil(H);
    const sh=inc?[6,18,"rgba(214,56,44,.18)"]:[2,8,"rgba(28,34,51,.08)"],m=Math.ceil(sh[0]+sh[1])+1,rad=inc?12:999;
    R.W=W;R.H=H;R.m=m;R.sw=Math.ceil((W+2*m)*d);R.sh=Math.ceil((H+2*m)*d);
    // the canvas is only reallocated when the pill outgrows it (text changes up to 5 times a second)
    if(R.cv.width<R.sw||R.cv.height<R.sh||R.cd!==d){R.cd=d;R.cv.width=Math.ceil(R.sw/32)*32;R.cv.height=Math.max(R.sh,R.cv.height);}
    else{X.setTransform(1,0,0,1,0,0);X.clearRect(0,0,R.cv.width,R.cv.height);}
    X.setTransform(d,0,0,d,m*d,m*d);
    // shadow outside the box only (like box-shadow), then the box over it
    X.save();rr(X,0,0,W,H,rad);X.shadowColor=sh[2];X.shadowBlur=sh[1]*d;X.shadowOffsetY=sh[0]*d;X.fillStyle="#000";X.fill();
    X.shadowColor="transparent";X.globalCompositeOperation="destination-out";X.fill();X.restore();
    rr(X,0,0,W,H,rad);X.fillStyle=inc?"rgba(255,255,255,.92)":"rgba(255,255,255,.9)";X.fill();
    rr(X,0.5,0.5,W-1,H-1,rad-0.5);X.lineWidth=1;X.strokeStyle=inc?LB.incLine:R.bad?LB.bad:"rgba(225,228,238,.9)";X.stroke();
    const red=inc||R.bad,x0=1+pl,yb=1+pt,line=(m2,s,lh,top)=>{const [A,D]=asc(m2,s);return top+(lh-(A+D))/2+A;};
    const rowH=inc?lb:Math.max(lb,showS?ls:0),bTop=inc?yb:yb+(rowH-lb)/2,bBase=line(mb,bs,lb,bTop);
    X.fillStyle=red?LB.bad:LB.brand;X.beginPath();X.arc(x0+3,bBase-4,3,0,Math.PI*2);X.fill();
    X.textBaseline="alphabetic";X.font=fB;X.fillStyle=red?LB.bad:LB.ink;X.fillText(R.a||"",x0+11,bBase);
    if(showS){X.font=fS;X.fillStyle=LB.muted;if(inc)X.fillText(R.b||"",x0,line(ms,11,ls,yb+lb));else X.fillText(R.b||"",x0+wb+6,line(ms,11,ls,yb+(rowH-ls)/2));}
    R.pv=R.ver;R.pg=LB.gen;LB.np++;}
  // per frame, after every label's spot is known: redraw the overlay only if something moved, changed or is fading
  let lblT=0;
  function lblPaint(now){const dt=lblT?Math.min(100,now-lblT):0;lblT=now;
    if(G3.zen||LB.hid){LB.force=true;return;}
    if(LB.pal!==PAL_V){LB.pal=PAL_V;lblStyle();}
    const w=G3.vw||host.clientWidth,h=G3.vh||host.clientHeight,d=Math.min(2,window.devicePixelRatio||1);
    if(w!==LB.w||h!==LB.h||d!==LB.d){if(d!==LB.d)LB.gen++;LB.w=w;LB.h=h;LB.d=d;lc.width=Math.round(w*d);lc.height=Math.round(h*d);LB.force=true;}
    const cmp=host.classList.contains("compact");if(cmp!==LB.cmp){LB.cmp=cmp;LB.gen++;}
    const cl=labelHost.classList,off=cl.contains("lbl-off"),idle=cl.contains("lbl-idle");
    // section labels fade like the CSS transition they had (opacity .6s ease); Off hides at once
    {const goal=idle?0:1;if(off)LB.p=0;else if(LB.p!==goal)LB.p=goal?Math.min(1,LB.p+dt/600):Math.max(0,LB.p-dt/600);
      const p=LB.p;LB.a=p<=0?0:p>=1?1:p*p*(3-2*p);}
    let sig=Math.round(LB.a*1000)+(off?7:0);
    for(let i=0;i<LREC.length;i++){const R=LREC[i];R.on=R.vis&&R.a!=null&&!off&&(R.inc||LB.a>0);if(!R.on)continue;
      if(R.pv!==R.ver||R.pg!==LB.gen)pill(R);sig=(sig*31+R.x*7+R.y*13+R.ver*3+i+1)%2147483647;}
    sig=(sig*31+LB.gen)%2147483647;
    if(!LB.force&&sig===LB.sig)return;LB.force=false;LB.sig=sig;LB.nd++;
    lx.setTransform(1,0,0,1,0,0);lx.clearRect(0,0,lc.width,lc.height);let n=0;
    for(let i=0;i<LREC.length;i++){const R=LREC[i];if(!R.on)continue;lx.globalAlpha=R.inc?1:LB.a;n++;
      R.rx=R.x-R.W/2;R.ry=R.y-R.H;lx.drawImage(R.cv,0,0,R.sw,R.sh,Math.round((R.rx-R.m)*d),Math.round((R.ry-R.m)*d),R.sw,R.sh);}
    lx.globalAlpha=1;LB.shown=n;}
  // which incident label (topmost first) is under a pointer event on the 3D view; for taps and the hover cursor
  G3.lblAt=e=>{if(G3.zen||LB.hid||!LB.shown||labelHost.classList.contains("lbl-off"))return null;
    const r=glc.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
    for(let i=LREC.length-1;i>=0;i--){const R=LREC[i];if(R.inc&&R.on&&px>=R.rx&&px<=R.rx+R.W&&py>=R.ry&&py<=R.ry+R.H)return R.id;}return null;};
  G3.lblCount=()=>[LREC.filter(R=>R.a!=null).length,LREC.filter(R=>R.on).length];
  const LABELS=[
    {p:[-70,0,-8],t:()=>["1 Inbound OCC",S.inQ.length?S.inQ.length+" trucks waiting":"road clear"]},
    {p:[-21,2.8,-24],t:()=>["2 Receiving",f0(S.yard)+" t bales"]},
    {p:[16,4.5,-18.5],t:()=>["3 Pulper",f1(S.rates.feed)+" t/h"]},
    {p:[25.8,7.2,-13.2],t:()=>["HD cleaner",S.M.pulperDown?"stopped":"pulling grit & staples"]},
    {p:[34.5,PH+5.0,-15],t:()=>["Disk thickener",S.M.pulperDown?"stopped":"cloudy · clear filtrate"]},
    {p:[11.2,5.4,ZL],t:()=>["Lightweight cleaners",S.inc.some(i=>i.id==="lwplug")?"plugged":"plastics & wax out"]},
    {p:[15.2,4.4,ZL],t:()=>["Coarse screen",S.inc.some(i=>i.id==="cscreen")?"down":"holed basket"]},
    {p:[19.2,5.0,ZL],t:()=>["Fine screens",S.inc.some(i=>i.id==="fscreen")?"down":"slotted baskets"]},
    {p:[26.6,3.9,ZL],t:()=>["LC cleaners",S.inc.some(i=>i.id==="lcplug")?"plugged":"sand & grit out"]},
    {p:[41.2,9.4,-15],t:()=>["4 Stock chest",f0(S.tank/P.tankCap*100)+" %"]},
    {p:[58,5.6,zc],t:()=>{const D=G3.SLC;if(!D)return ["Headbox",""];const g=D.geo();return ["Headbox",G3.slcFix?"resetting the slice":"slice "+(12+3*D.v).toFixed(1)+" mm · wet line "+(g.lipX-g.wet).toFixed(1)+" m"];},cls:()=>!!G3.slcFix},
    {p:[47.6,11.6,-15.0],t:()=>["Machine chest","refined stock"]},
    {p:[49.8,3.6,-9.3],t:()=>["Fan pump",S.pm==="run"?"to the headbox":"idling"]},
    {p:[44,0.6,12.9],t:()=>["Base ply silo","white water under the wire"]},
    {p:[34.5,9.6,zc-1.5],t:()=>["Twin press",LV("shoe")?"shoe in 2nd press":"tandem bottom felt"]},
    {p:[10,8.4,zc],t:()=>["5 "+NAME+(S.pm==="run"?"":" · "+({break:"sheet break "+({reel:"at the reel",dryer:"before the dryers",press:"before the presses"}[S.brkType]||"")+(working("brk")?": rethreading":": crew on the way"),down:"no stock",full:"warehouse full",spools:"winder backed up",incident:S.M.pmDown||"down"}[S.pm]||"")),f0(S.pmSpeed)+" fpm · "+f1(S.rates.prod)+" t/h"],cls:()=>S.pm==="run"?"":"bad"},
    {p:[-10,9.2,zc],t:()=>["Reel",f1(S.reel)+" / "+P.jumbo+" t"]},
    {p:[-20,1.5,zc+4],t:()=>["6 Winder"+(S.wd==="hayout"?" · HAYOUT!":""),S.wd==="hayout"?"crew cleaning up":Math.max(0,reelsAtWinder()-1)+"/"+P.storeReels+" reels stored · "+f1(S.rates.cut)+" t/h"],cls:()=>S.wd==="hayout"},
    {p:[-36.4,3.2,14.8],t:()=>["7 Roll warehouse",f0(S.fg)+" rolls"]},
  ];
  LABELS.forEach(L=>{L.lb=lblNew(false);L.v=new THREE.Vector3(...L.p);});
  const banner=$("banner3d"),chips=$("chips3d");
  // click a disaster (chip, breaking banner or its floating label) to fly the camera there
  G3.spotOf=id=>id==="hay"?[-17,7]:id==="brk"?[12,9]:PINS[id]?[PINS[id][0],PINS[id][2]]:null;
  G3.flyTo=id=>{const sp=G3.spotOf(id);if(!sp)return;goal={t:new THREE.Vector3(sp[0],0,sp[1]),r:62,th:DEF.th,ph:0.88};};
  chips.addEventListener("click",e=>{const b=e.target.closest("button");if(b)G3.flyTo(b.dataset.id);});
  banner.addEventListener("click",()=>{const b=BANNERS[0];if(b&&b.id)G3.flyTo(b.id);});

