  /* ---- camera controls: drag to orbit, wheel/pinch to zoom ---- */
  const target=new THREE.Vector3(-14,0,5);
  /* v6.1 iso: the camera never turns or tilts. ISO_TH looks across the mill from the south-west corner (45 degrees),
     ISO_PH is the true isometric elevation (35.26 degrees above the ground). Everything that used to set th/ph still may:
     placeCam pins them. Zoom rests on whole-number steps of the widest view (1x, 2x, 3x ... 12x), so pixels per metre are
     always a clean multiple and the ink lines stay crisp; between steps the zoom eases over a few frames. */
  const ISO_TH=-Math.PI/4,ISO_PH=Math.acos(Math.sqrt(1/3)),R_MAX=760,R_K=[1,2,3,4,6,8,12],R_STEPS=R_K.map(k=>R_MAX/k);
  const rStep=r=>{let b=R_STEPS[0];for(const v of R_STEPS)if(Math.abs(Math.log(v/r))<Math.abs(Math.log(b/r)))b=v;return b;};
  const rNext=(r,dir)=>{const i=R_STEPS.indexOf(rStep(r));return R_STEPS[clamp(i+dir,0,R_STEPS.length-1)];};
  G3.rSteps=R_STEPS;G3.rStep=rStep;
  const DEF={th:ISO_TH,ph:ISO_PH,r:R_MAX/3};const cam={...DEF};let rShown=DEF.r;
  const DEFT=target.clone();let goal=null;
  // v3.1.0 tutorial: glide the camera to a spot and mark it with a pulsing ring and a light beam
  // on phones the tutorial card covers the lower half: aim past the spot so it sits in the upper half of the screen
  G3.camTo=(x,z,r,th,ph)=>{th=th??DEF.th;const k=host.clientWidth<600?r*0.13:0;goal={t:new THREE.Vector3(x+Math.sin(th)*k,0,z+Math.cos(th)*k),r,th,ph:ph??0.9};};
  G3.camGlide=c=>{goal={t:new THREE.Vector3(c[0],c[5]||0,c[1]),r:c[2],th:c[3],ph:c[4]};};   // v5.2: glide to an exact view (the camera pull, 31b)
  G3.camHome=()=>{goal={t:DEFT.clone(),r:DEF.r,th:DEF.th,ph:DEF.ph};};
  G3.camSet=c=>{goal=null;target.set(c[0],c[5]||0,c[1]);cam.r=c[2];cam.th=c[3];cam.ph=c[4];};   // tests and screenshots
  G3.camGet=()=>[target.x,target.z,cam.r,cam.th,cam.ph,target.y];   // (v4.2.4: the bird cut-scene puts the camera back)
  {const hm=new THREE.MeshBasicMaterial({color:lin0("#ffb020"),transparent:true,opacity:0.85,depthWrite:false,depthTest:false,side:THREE.DoubleSide,toneMapped:false});
   const ring=new THREE.Mesh(new RingG(0.86,1,64),hm);ring.rotation.x=-Math.PI/2;ring.renderOrder=20;ring.visible=false;scene.add(ring);
   const bm=new THREE.MeshBasicMaterial({color:lin0("#ffd27a"),transparent:true,opacity:0.18,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
   const beam=new THREE.Mesh(new CylG(1,1,1,32,1,true),bm);beam.renderOrder=19;beam.visible=false;scene.add(beam);
   const HI={on:false,x:0,z:0,r:6};
   G3.tutHi=(x,z,r)=>{if(x==null){HI.on=false;ring.visible=beam.visible=false;return;}Object.assign(HI,{on:true,x,z,r});};
   G3.tutTick=now=>{if(!HI.on)return;ring.visible=beam.visible=true;const ph=(now/1400)%1;ring.position.set(HI.x,0.15,HI.z);ring.scale.setScalar(HI.r*(0.92+0.16*ph));hm.opacity=0.9-0.45*ph;
     beam.position.set(HI.x,9,HI.z);beam.scale.set(HI.r*0.9,18,HI.r*0.9);bm.opacity=0.10+0.06*Math.sin(now/300);};}
  // move the look-at point across the ground, in screen directions
  function panBy(dx,dy){goal=null;folEnd();const rr=rShown*(host.clientWidth<600?1.35:1),wpp=2*rr*Math.tan(camera.fov*Math.PI/360)/Math.max(1,host.clientHeight),s=wpp;
    const rx=Math.cos(cam.th),rz=-Math.sin(cam.th),fx=-Math.sin(cam.th)/Math.cos(ISO_PH),fz=-Math.cos(cam.th)/Math.cos(ISO_PH);   // (v6.1: screen up runs along the ground, foreshortened by the view angle)
    // (v14: zoomed out the pan reaches the whole site, so the outer scenery can be looked over)
    const wk=clamp((cam.r-300)/300,0,1);target.x=clamp(target.x-(rx*dx-fx*dy)*s,-85-260*wk,70+260*wk);target.z=clamp(target.z-(rz*dx-fz*dy)*s,-40-200*wk,48+200*wk);}
  // v3.3.4: follow Uncle Brian on the hall scrubber; drag still orbits, wheel/pinch zoom in close, any pan or camera jump ends it
  const FOL={on:false,r:30,n:0};
  const folEnd=()=>{if(!FOL.on)return;FOL.on=false;G3.onFollowEnd&&G3.onFollowEnd();};
  G3.follow=on=>{if(on){goal=null;FOL.on=true;FOL.r=30;FOL.n=0;}else folEnd();};
  G3.following=()=>FOL.on;
  // camera, every frame: ride along with Uncle Brian if following, glide toward a camera goal if one is set,
  // then place the orbit camera around its target (one function; v3 built this by wrapping it twice)
  // swap the live camera; leaving zen goes back to the iso view where the shot left off, on the nearest zoom step
  function camSwap(free){camera=free?camPersp:camIso;if(free){camPersp.aspect=(G3.vw||host.clientWidth)/Math.max(1,G3.vh||host.clientHeight);camPersp.updateProjectionMatrix();}
    else{cam.r=rStep(clamp(cam.r,R_STEPS[R_STEPS.length-1],R_MAX));rShown=cam.r;}G3.camFree=free;G3.lastMove=performance.now();if(G3.onCamSwap)G3.onCamSwap(free);
    // (v6.2 z2: the river's ripple lines are packed for the iso view; seen in perspective they alias into streaks, so the free camera
    // gets wider ripples and anisotropic filtering)
    const RT=ENV.riverTex;if(RT){RT.repeat.x=free?6:40;RT.repeat.y=free?0.45:1.5;RT.anisotropy=free?8:1;RT.needsUpdate=true;}}
  function placeCam(){if(FOL.on){const R=G3.scrubbers&&G3.scrubbers[0];if(goal||(S&&S.zen)||!R)folEnd();
      else{const g=R.g.position;target.x+=(g.x-target.x)*0.1;target.z+=(g.z-target.z)*0.1;cam.r+=(FOL.r-cam.r)*0.08;if(FOL.n++<90)cam.ph+=(0.62-cam.ph)*0.06;G3.lastMove=performance.now();}}
    if(goal){G3.lastMove=performance.now();target.lerp(goal.t,0.12);cam.r+=(goal.r-cam.r)*0.12;cam.th=lerpAng(cam.th,goal.th,0.12);cam.ph+=(goal.ph-cam.ph)*0.12;
      goal.n=(goal.n||0)+1;if(goal.n>150||target.distanceTo(goal.t)<0.2&&Math.abs(goal.r-cam.r)<0.5){goal=null;if(!(G3.zenFree&&S&&S.zen))cam.r=rStep(cam.r);}}
    // v6.2 test: zen with the free camera: the shot's angles and distance as they are, through the perspective camera
    const free=!!(G3.zenFree&&S&&S.zen);if(free!==(camera===camPersp))camSwap(free);
    if(free){cam.r=clamp(cam.r,4,900);rShown=cam.r;G3.camR=cam.r;G3.camDist=cam.r;const sp=Math.sin(cam.ph);
      camPersp.position.set(target.x+cam.r*sp*Math.sin(cam.th),target.y+cam.r*Math.cos(cam.ph),target.z+cam.r*sp*Math.cos(cam.th));
      if(camPersp.position.y<0.4)camPersp.position.y=0.4;camPersp.lookAt(target);return;}
    // v6.1 iso: angles pinned; the shown zoom eases to the nearest whole-number step of whatever cam.r asks for
    cam.th=ISO_TH;cam.ph=ISO_PH;cam.r=clamp(cam.r,R_STEPS[R_STEPS.length-1]*0.8,R_MAX);
    {const want=goal?cam.r:rStep(cam.r);const k=Math.abs(Math.log(want/rShown));rShown=k<0.004?want:Math.exp(Math.log(rShown)+(Math.log(want)-Math.log(rShown))*0.35);}
    const rr=rShown*((G3.vw||host.clientWidth)<600?1.35:1);G3.camR=rShown;G3.camDist=rr;
    camera.position.set(target.x+ISO_D*Math.sin(cam.ph)*Math.sin(cam.th),target.y+ISO_D*Math.cos(cam.ph),target.z+ISO_D*Math.sin(cam.ph)*Math.cos(cam.th));
    camera.lookAt(target);camera.isoFit(rr);}
  const ptrs=new Map();let pinch0=0,r0=0,mid0=null,panBtn=false;
  const mid=()=>{const [a,b]=[...ptrs.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)};};
  glc.addEventListener("contextmenu",e=>e.preventDefault());
  glc.addEventListener("pointerdown",e=>{glc.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});goal=null;
    panBtn=e.button===2||e.button===1||e.shiftKey;
    if(ptrs.size===2){const m=mid();pinch0=m.d;r0=FOL.on?FOL.r:cam.r;mid0=m;}});
  glc.addEventListener("pointermove",e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(ptrs.size===1)panBy(dx,dy);   // (v6.1 iso: the camera never turns, so any drag pans)
    p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===2){const m=mid();if(pinch0>0){if(FOL.on)FOL.r=clamp(r0*pinch0/m.d,10,120);else cam.r=rStep(clamp(r0*pinch0/m.d,50,760));}if(mid0&&!FOL.on)panBy(m.x-mid0.x,m.y-mid0.y);mid0=m;}});
  const up=e=>{ptrs.delete(e.pointerId);pinch0=0;mid0=null;};glc.addEventListener("pointerup",up);glc.addEventListener("pointercancel",up);
  // easter egg: click the spider valve on the disk thickener
  {const rc=new THREE.Raycaster(),nd=new THREE.Vector2();if(rc.layers)rc.layers.enableAll();let downAt=null,hoverT=0;
    const hit=e=>{const r=glc.getBoundingClientRect();nd.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);rc.setFromCamera(nd,camera);
      if(G3.knobHit){const k=G3.knobHit(rc);if(k)return k;}   // v5.6 fiddly knobs and the DCS consoles (40b)
      if(G3.spiderHit&&rc.intersectObjects(G3.spiderHit,false).length)return "spider";if(G3.sliceHit&&rc.intersectObjects(G3.sliceHit,false).length)return "slice";if(G3.scrubbers&&rc.intersectObject(G3.scrubbers[0].hit,false).length)return "brian";return false;};
    glc.addEventListener("pointerdown",e=>{downAt=[e.clientX,e.clientY,performance.now()];});
    glc.addEventListener("pointerup",e=>{if(!downAt)return;const m=Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1]),t=performance.now()-downAt[2];downAt=null;if(m<6&&t<500){if(G3.tellTap&&G3.tellTap(e))return;   /* v5.7: a tell on a Round comes first */const li=G3.lblAt(e);if(li){if(G3.lblTap&&G3.lblTap(li))return;G3.flyTo(li);return;}const h=hit(e);if(h&&h.k)G3.knobTap(h);else if(h==="spider")openSpider();else if(h==="slice")openSlice();else if(h==="brian")openBrian();else if(G3.infoTap)G3.infoTap(e);}});   // (v6.10: click for info, 38d)
    glc.addEventListener("pointermove",e=>{const n=performance.now();if(n-hoverT<120||ptrs.size)return;hoverT=n;glc.style.cursor=G3.lblAt(e)||hit(e)?"pointer":"";});}
  let wAcc=0;glc.addEventListener("wheel",e=>{e.preventDefault();goal=null;if(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)&&!e.ctrlKey)panBy(-e.deltaX||-e.deltaY,0);else if(FOL.on)FOL.r=clamp(FOL.r*Math.exp(e.deltaY*(e.ctrlKey?0.01:0.001)),10,120);else{wAcc+=e.deltaY*(e.ctrlKey?10:1);if(Math.abs(wAcc)>=60){cam.r=rNext(cam.r,wAcc>0?-1:1);wAcc=0;}}},{passive:false});   // (v6.1: one zoom step per wheel notch)
  // keyboard: arrows/WASD move, Q/E rotate, +/- zoom
  glc.addEventListener("keydown",e=>{const k=e.key.toLowerCase(),st=24;let used=true;
    if(k==="arrowleft"||k==="a")panBy(st,0);else if(k==="arrowright"||k==="d")panBy(-st,0);else if(k==="arrowup"||k==="w")panBy(0,st);else if(k==="arrowdown"||k==="s")panBy(0,-st);
    else if(k==="+"||k==="=")cam.r=rNext(cam.r,1);else if(k==="-")cam.r=rNext(cam.r,-1);else used=false;   // (v6.1: no turning; zoom by whole steps)
    if(used){e.preventDefault();goal=null;}});
  // on-screen pad: press and hold to move
  let padDir=null;
  $("pad").querySelectorAll("button").forEach(b=>{const [px,py]=b.dataset.p.split(",").map(Number);
    b.addEventListener("pointerdown",e=>{e.preventDefault();b.setPointerCapture(e.pointerId);padDir=[px,py];});
    ["pointerup","pointercancel","pointerleave"].forEach(t=>b.addEventListener(t,()=>padDir=null));});
  // v6.1 t2: is the camera moving (or about to)? The stop-motion world (52) draws every frame only then
  G3.camBusy=()=>!!goal||FOL.on||ptrs.size>0||!!padDir||Math.abs(rShown-(goal?cam.r:rStep(cam.r)))>0.01||performance.now()-(G3.lastMove||0)<300||!!G3.cineHold;   // (v6.1 t3: zen is stop-motion too)
  G3.padTick=rdt=>{if(padDir)panBy(-padDir[0]*500*rdt,-padDir[1]*500*rdt);};
  const JUMPS={site:[0,30,700,0.62],trucks:[-62,2,118],recv:[-21,-13,100],pulp:[24,-15,100],pm:[22,9,130],wd:[-17,7,72],wh:[-37,24,105],shop:[57,-21,48],mcc:[11,27,52]};   // (v6.10: mcc)
  // section labels: Auto fades them out after a few idle seconds, On keeps them, Off hides them
  let lblMode="auto";try{lblMode=localStorage.getItem("paper-mill-labels")||"auto";}catch(e){}
  G3.lastMove=performance.now();
  function setLbl(m){lblMode=m;document.querySelectorAll("#lblMode button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.m===m)));
    labelHost.classList.toggle("lbl-off",m==="off");G3.lastMove=performance.now();
    try{localStorage.setItem("paper-mill-labels",m);}catch(e){}}
  document.querySelectorAll("#lblMode button").forEach(b=>b.addEventListener("click",()=>setLbl(b.dataset.m)));
  const poke=()=>{G3.lastMove=performance.now();};
  ["pointerdown","pointermove","wheel","keydown","touchstart"].forEach(t=>glc.addEventListener(t,poke,{passive:true}));
  document.addEventListener("keydown",poke,{passive:true});document.addEventListener("pointerdown",poke,{passive:true});
  $("pad").addEventListener("pointerdown",poke);
  G3.labelIdle=now=>{if(!G3.lblStarted){G3.lblStarted=1;G3.lastMove=now+2500;}labelHost.classList.toggle("lbl-idle",lblMode==="auto"&&now-G3.lastMove>3500);};
  setLbl(lblMode);
  G3.jump=(j,zoom=1)=>{const v=JUMPS[j];if(!v)return;const [x,z,r,ph]=v;folEnd();goal={t:new THREE.Vector3(x,0,z),r:r*zoom,th:DEF.th,ph:ph||0.88};};   // (v5.0.6: also the outage notice's Watch the crews)
  document.querySelectorAll("#jumps button").forEach(b=>b.addEventListener("click",()=>G3.jump(b.dataset.j)));
  $("viewReset").addEventListener("click",()=>{goal={t:DEFT.clone(),r:DEF.r,th:DEF.th,ph:DEF.ph};});
  // v4.2.4: the Shadows switch fades the sun's shadow to nothing and stops refreshing the shadow map. It never turns the
  // shadow map off, because that recompiles every shader (a long freeze on phones). shadow.intensity is a uniform.
  $("viewShadows").addEventListener("change",e=>{const on=e.target.checked;G3.shadowsOff=!on;if(G3.dropMesh)G3.dropMesh.visible=on;});   // (v6.1 iso: the flat drop shadows, 40c and 32c)
  // v4.1: change graphics tier while playing (what can change live; see GFX_TIERS in 20-3d-setup.js)
  G3.setGfx=pick=>{if(pick!=="auto"&&!GFX_TIERS[pick])return;const t=GFX_TIERS[pick==="auto"?GFX.auto:pick];GFX.pick=pick;GFX.tier=pick==="auto"?GFX.auto:pick;
    try{localStorage.setItem("paper-mill-gfx",pick);}catch(e){}
    GFX.pr=t.pr;GFX.px=t.px;G3.prFixed=0;resize();G3.shadowHz=t.hz;GFX.hz=t.hz;
    if(sun.shadow.mapSize.x!==t.shadow){sun.shadow.mapSize.set(t.shadow,t.shadow);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}renderer.shadowMap.needsUpdate=true;}sun.shadow.radius=t.soft?5:3;
    if(G3.wxRange)G3.wxRange(t.wx);if(G3.scenery){G3.scenery.farOff=false;G3.scenery.parts.forEach(p=>{p.visible=true;if(p.userData.scenery!=="near")p.castShadow=t.far;});}
    // (v15: what needs a reload — lighting model, round-shape detail, scenery density — is offered as a button)
    {const nb=$("gfxReload");if(nb)nb.hidden=GFX.tier===GFX.loaded;}
    diag(`graphics: ${GFX.tier}${pick==="auto"?" (auto)":""}; lighting model and scenery density change on the next load`);
    document.querySelectorAll("#gfxSeg button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.g===pick)));};

  function resize(){G3.lastMove=performance.now();const w=host.clientWidth,h=host.clientHeight;G3.vw=w;G3.vh=h;   // v4.0.1: cached for the label code
  host.classList.toggle("compact",w<640);if(!w||!h)return;{const pr=G3.prFor(w,h);if(Math.abs(pr-renderer.getPixelRatio())>0.01)renderer.setPixelRatio(pr);}renderer.setSize(w,h,false);camIso.aspect=w/h;camIso.top=NaN;camIso.isoFit(camera===camIso?(G3.camDist||DEF.r):rStep(cam.r));camPersp.aspect=w/h;camPersp.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(host);

