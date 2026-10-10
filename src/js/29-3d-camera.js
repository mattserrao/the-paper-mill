  /* ---- camera controls: drag to orbit, wheel/pinch to zoom ---- */
  const target=new THREE.Vector3(-14,0,5);const DEF={th:-0.2,ph:0.96,r:305};const cam={...DEF};
  const DEFT=target.clone();let goal=null;
  // v3.1.0 tutorial: glide the camera to a spot and mark it with a pulsing ring and a light beam
  // on phones the tutorial card covers the lower half: aim past the spot so it sits in the upper half of the screen
  G3.camTo=(x,z,r,th,ph)=>{th=th??DEF.th;const k=host.clientWidth<600?r*0.13:0;goal={t:new THREE.Vector3(x+Math.sin(th)*k,0,z+Math.cos(th)*k),r,th,ph:ph??0.9};};
  G3.camHome=()=>{goal={t:DEFT.clone(),r:DEF.r,th:DEF.th,ph:DEF.ph};};
  G3.camSet=c=>{goal=null;target.set(c[0],0,c[1]);cam.r=c[2];cam.th=c[3];cam.ph=c[4];};   // tests and screenshots
  {const hm=new THREE.MeshBasicMaterial({color:lin0("#ffb020"),transparent:true,opacity:0.85,depthWrite:false,depthTest:false,side:THREE.DoubleSide,toneMapped:false});
   const ring=new THREE.Mesh(new RingG(0.86,1,64),hm);ring.rotation.x=-Math.PI/2;ring.renderOrder=20;ring.visible=false;scene.add(ring);
   const bm=new THREE.MeshBasicMaterial({color:lin0("#ffd27a"),transparent:true,opacity:0.18,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
   const beam=new THREE.Mesh(new CylG(1,1,1,32,1,true),bm);beam.renderOrder=19;beam.visible=false;scene.add(beam);
   const HI={on:false,x:0,z:0,r:6};
   G3.tutHi=(x,z,r)=>{if(x==null){HI.on=false;ring.visible=beam.visible=false;return;}Object.assign(HI,{on:true,x,z,r});};
   G3.tutTick=now=>{if(!HI.on)return;ring.visible=beam.visible=true;const ph=(now/1400)%1;ring.position.set(HI.x,0.15,HI.z);ring.scale.setScalar(HI.r*(0.92+0.16*ph));hm.opacity=0.9-0.45*ph;
     beam.position.set(HI.x,9,HI.z);beam.scale.set(HI.r*0.9,18,HI.r*0.9);bm.opacity=0.10+0.06*Math.sin(now/300);};}
  // move the look-at point across the ground, in screen directions
  function panBy(dx,dy){goal=null;folEnd();const s=cam.r*(host.clientWidth<600?1.35:1)*0.00098;
    const rx=Math.cos(cam.th),rz=-Math.sin(cam.th),fx=-Math.sin(cam.th),fz=-Math.cos(cam.th);
    target.x=clamp(target.x-(rx*dx-fx*dy)*s,-85,70);target.z=clamp(target.z-(rz*dx-fz*dy)*s,-40,48);}
  // v3.3.4: follow Uncle Brian on the hall scrubber; drag still orbits, wheel/pinch zoom in close, any pan or camera jump ends it
  const FOL={on:false,r:30,n:0};
  const folEnd=()=>{if(!FOL.on)return;FOL.on=false;G3.onFollowEnd&&G3.onFollowEnd();};
  G3.follow=on=>{if(on){goal=null;FOL.on=true;FOL.r=30;FOL.n=0;}else folEnd();};
  G3.following=()=>FOL.on;
  // camera, every frame: ride along with Uncle Brian if following, glide toward a camera goal if one is set,
  // then place the orbit camera around its target (one function; v3 built this by wrapping it twice)
  function placeCam(){if(FOL.on){const R=G3.scrubbers&&G3.scrubbers[0];if(goal||(S&&S.zen)||!R)folEnd();
      else{const g=R.g.position;target.x+=(g.x-target.x)*0.1;target.z+=(g.z-target.z)*0.1;cam.r+=(FOL.r-cam.r)*0.08;if(FOL.n++<90)cam.ph+=(0.62-cam.ph)*0.06;G3.lastMove=performance.now();}}
    if(goal){G3.lastMove=performance.now();target.lerp(goal.t,0.12);cam.r+=(goal.r-cam.r)*0.12;cam.th=lerpAng(cam.th,goal.th,0.12);cam.ph+=(goal.ph-cam.ph)*0.12;
      goal.n=(goal.n||0)+1;if(goal.n>150||target.distanceTo(goal.t)<0.2&&Math.abs(goal.r-cam.r)<0.5)goal=null;}
    const rr=cam.r*((G3.vw||host.clientWidth)<600?1.35:1);
    camera.position.set(target.x+rr*Math.sin(cam.ph)*Math.sin(cam.th),target.y+rr*Math.cos(cam.ph),target.z+rr*Math.sin(cam.ph)*Math.cos(cam.th));
    // v4.1: never inside scenery (tall city blocks, mesas, trees): stay 3 m above the tallest thing in this 8 m cell
    if(G3.sceneryH){const h=G3.sceneryH(camera.position.x,camera.position.z);if(h>0&&camera.position.y<h+3)camera.position.y=h+3;}
    camera.lookAt(target);}
  const ptrs=new Map();let pinch0=0,r0=0,mid0=null,panBtn=false;
  const mid=()=>{const [a,b]=[...ptrs.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)};};
  glc.addEventListener("contextmenu",e=>e.preventDefault());
  glc.addEventListener("pointerdown",e=>{glc.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});goal=null;
    panBtn=e.button===2||e.button===1||e.shiftKey;
    if(ptrs.size===2){const m=mid();pinch0=m.d;r0=FOL.on?FOL.r:cam.r;mid0=m;}});
  glc.addEventListener("pointermove",e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(ptrs.size===1){if(panBtn)panBy(dx,dy);else{cam.th-=dx*0.006;if(e.pointerType!=="touch")cam.ph=clamp(cam.ph-dy*0.005,0.25,1.35);}}
    p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===2){const m=mid();if(pinch0>0){if(FOL.on)FOL.r=clamp(r0*pinch0/m.d,10,120);else cam.r=clamp(r0*pinch0/m.d,50,420);}if(mid0&&!FOL.on)panBy(m.x-mid0.x,m.y-mid0.y);mid0=m;}});
  const up=e=>{ptrs.delete(e.pointerId);pinch0=0;mid0=null;};glc.addEventListener("pointerup",up);glc.addEventListener("pointercancel",up);
  // easter egg: click the spider valve on the disk thickener
  {const rc=new THREE.Raycaster(),nd=new THREE.Vector2();if(rc.layers)rc.layers.enableAll();let downAt=null,hoverT=0;
    const hit=e=>{const r=glc.getBoundingClientRect();nd.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);rc.setFromCamera(nd,camera);
      if(G3.spiderHit&&rc.intersectObjects(G3.spiderHit,false).length)return "spider";if(G3.sliceHit&&rc.intersectObjects(G3.sliceHit,false).length)return "slice";if(G3.scrubbers&&rc.intersectObject(G3.scrubbers[0].hit,false).length)return "brian";return false;};
    glc.addEventListener("pointerdown",e=>{downAt=[e.clientX,e.clientY,performance.now()];});
    glc.addEventListener("pointerup",e=>{if(!downAt)return;const m=Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1]),t=performance.now()-downAt[2];downAt=null;if(m<6&&t<500){const li=G3.lblAt(e);if(li){G3.flyTo(li);return;}const h=hit(e);if(h==="spider")openSpider();else if(h==="slice")openSlice();else if(h==="brian")openBrian();}});
    glc.addEventListener("pointermove",e=>{const n=performance.now();if(n-hoverT<120||ptrs.size)return;hoverT=n;glc.style.cursor=G3.lblAt(e)||hit(e)?"pointer":"";});}
  glc.addEventListener("wheel",e=>{e.preventDefault();goal=null;if(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)&&!e.ctrlKey)panBy(-e.deltaX||-e.deltaY,0);else if(FOL.on)FOL.r=clamp(FOL.r*Math.exp(e.deltaY*(e.ctrlKey?0.01:0.001)),10,120);else cam.r=clamp(cam.r*Math.exp(e.deltaY*(e.ctrlKey?0.01:0.001)),50,420);},{passive:false});
  // keyboard: arrows/WASD move, Q/E rotate, +/- zoom
  glc.addEventListener("keydown",e=>{const k=e.key.toLowerCase(),st=24;let used=true;
    if(k==="arrowleft"||k==="a")panBy(st,0);else if(k==="arrowright"||k==="d")panBy(-st,0);else if(k==="arrowup"||k==="w")panBy(0,st);else if(k==="arrowdown"||k==="s")panBy(0,-st);
    else if(k==="q")cam.th+=0.08;else if(k==="e")cam.th-=0.08;else if(k==="+"||k==="=")cam.r=clamp(cam.r*0.9,50,420);else if(k==="-")cam.r=clamp(cam.r*1.1,50,420);else used=false;
    if(used){e.preventDefault();goal=null;}});
  // on-screen pad: press and hold to move
  let padDir=null;
  $("pad").querySelectorAll("button").forEach(b=>{const [px,py]=b.dataset.p.split(",").map(Number);
    b.addEventListener("pointerdown",e=>{e.preventDefault();b.setPointerCapture(e.pointerId);padDir=[px,py];});
    ["pointerup","pointercancel","pointerleave"].forEach(t=>b.addEventListener(t,()=>padDir=null));});
  G3.padTick=rdt=>{if(padDir)panBy(-padDir[0]*500*rdt,-padDir[1]*500*rdt);};
  const JUMPS={trucks:[-62,2,118],recv:[-21,-13,100],pulp:[24,-15,100],pm:[22,9,130],wd:[-17,7,72],wh:[-37,24,105],shop:[57,-21,48]};
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
  document.querySelectorAll("#jumps button").forEach(b=>b.addEventListener("click",()=>{const [x,z,r]=JUMPS[b.dataset.j];goal={t:new THREE.Vector3(x,0,z),r,th:DEF.th,ph:0.88};}));
  $("viewReset").addEventListener("click",()=>{goal={t:DEFT.clone(),r:DEF.r,th:DEF.th,ph:DEF.ph};});
  $("viewShadows").addEventListener("change",e=>{renderer.shadowMap.enabled=e.target.checked;renderer.shadowMap.needsUpdate=true;MATS.forEach(m=>m.needsUpdate=true);});
  // v4.1: change graphics tier while playing (what can change live; see GFX_TIERS in 20-3d-setup.js)
  G3.setGfx=pick=>{if(pick!=="auto"&&!GFX_TIERS[pick])return;const t=GFX_TIERS[pick==="auto"?GFX.auto:pick];GFX.pick=pick;GFX.tier=pick==="auto"?GFX.auto:pick;
    try{localStorage.setItem("paper-mill-gfx",pick);}catch(e){}
    renderer.setPixelRatio(Math.min(t.pr,window.devicePixelRatio||1));resize();G3.shadowHz=t.hz;GFX.pr=t.pr;GFX.hz=t.hz;
    if(sun.shadow.mapSize.x!==t.shadow){sun.shadow.mapSize.set(t.shadow,t.shadow);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}renderer.shadowMap.needsUpdate=true;}sun.shadow.radius=t.soft?5:3;
    if(G3.wxRange)G3.wxRange(t.wx);if(G3.scenery)G3.scenery.parts.forEach(p=>{if(p.userData.scenery!=="near")p.castShadow=t.far;});
    diag(`graphics: ${GFX.tier}${pick==="auto"?" (auto)":""}; lighting model and scenery density change on the next load`);
    document.querySelectorAll("#gfxSeg button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.g===pick)));};

  function resize(){G3.lastMove=performance.now();const w=host.clientWidth,h=host.clientHeight;G3.vw=w;G3.vh=h;   // v4.0.1: cached for the label code
  host.classList.toggle("compact",w<640);if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(host);

