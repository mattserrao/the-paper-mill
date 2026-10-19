  /* ---- v5.7 tells: the clearly failing equipment a Round can spot (the model is 04b-tells.js, the UI 51e-tells-ui.js) ----
     One small prop per tellable upset, at that equipment, built before the first frame from shared materials and kept out
     of the static merge. They are only shown during a Round, and only the ones the dice have actually queued in
     the walked area. Each has a big tap target: a tap within TAP_PX of it on screen (or of its projected 2.5 m radius)
     counts, so it works on a phone. An operator in hi-vis walks the area's stops while the Round runs. */
  {const TG=new THREE.Group();TG.visible=false;scene.add(TG);(G3.dynLater||(G3.dynLater=[])).push(TG);   // (kept out of the static merge: SM is made in 40)
    const KIT={},TAP_PX=44;
    const disc=new CircG(1,24),puddle=(g,x,z,r,m)=>{const p=new THREE.Mesh(disc,m||FM.pulp);p.rotation.x=-Math.PI/2;p.position.set(x,0.07,z);p.scale.setScalar(r);g.add(p);return p;};
    const cyl=(r,h,m,x,y,z,g,rz,rx)=>{const c=new THREE.Mesh(new CylG(r,r,h,12),m);c.position.set(x,y,z);if(rz)c.rotation.z=rz;if(rx)c.rotation.x=rx;g.add(c);return c;};
    // ---- props (local coordinates; +x along the machine) ----
    function pump(g){box(1.7,0.22,0.9,M.steel,0,0.11,0,g,false);const w=new THREE.Group();w.position.set(0,0.62,0);g.add(w);
      cyl(0.36,0.95,M.bad,-0.35,0,0,w,Math.PI/2);cyl(0.42,0.28,M.brand,0.45,0,0,w,Math.PI/2);box(0.24,0.3,0.3,M.warn,0.12,0,0,w,false);return {w,top:[0,1.2,0]};}
    function motor(g){box(1.2,0.2,0.8,M.steel,0,0.1,0,g,false);const w=new THREE.Group();w.position.set(0,0.65,0);g.add(w);
      cyl(0.42,1.0,M.bad,0,0,0,w,Math.PI/2);box(0.3,0.3,0.4,M.ink,0,0.45,0,w,false);return {w,top:[0,1.3,0]};}
    function flange(g){cyl(0.22,3,M.metal,0,0.9,0,g,Math.PI/2);cyl(0.36,0.14,M.steel,0,0.9,0,g,Math.PI/2);cyl(0.12,0.9,M.metal,-1.2,0.45,0,g);return {top:[0,0.95,0]};}
    function hot(g){box(0.9,1.2,0.9,M.steel,0,0.6,0,g,false);const h=box(0.62,0.48,0.62,M.bad,0,1.38,0,g,false);cyl(0.1,1.6,M.metal,0,1.4,0,g,0,Math.PI/2);return {w:h,top:[0,1.6,0]};}
    function pallets(g){for(let k=0;k<5;k++)box(1.2,0.14,1.0,M.kraft,0,0.08+k*0.17,0,g,false);
      const ht=new THREE.Group();ht.position.set(0.95,0,0.05);g.add(ht);box(0.5,0.7,0.36,M.steel,0,0.35,0,ht,false);const gl=new THREE.Mesh(cubeG,M.beacon);gl.scale.set(0.04,0.42,0.28);gl.position.set(-0.26,0.38,0);ht.add(gl);
      return {glow:gl,top:[0.5,0.9,0]};}
    function forklift(g){box(1.8,0.9,1.1,M.warn,0,0.75,0,g);box(0.12,2.0,1.0,M.ink,1.0,1.1,0,g,false);box(1.0,0.06,0.15,M.metal,1.5,0.15,0.3,g,false);box(1.0,0.06,0.15,M.metal,1.5,0.15,-0.3,g,false);
      [[-0.6,0.56],[-0.6,-0.56],[0.6,0.56],[0.6,-0.56]].forEach(([x,z])=>cyl(0.3,0.22,M.ink,x,0.3,z,g,0,Math.PI/2));const w=new THREE.Group();g.add(w);return {top:[0,1.4,0],w};}
    function bucket(g){cyl(0.3,0.45,M.warn,0,0.23,0,g);return {top:[0,0.5,0]};}
    function panel(g){box(1.2,1.6,0.5,M.steel,0,0.8,0,g);const gl=new THREE.Mesh(cubeG,M.beacon);gl.scale.set(0.5,0.3,0.04);gl.position.set(0,1.2,0.27);g.add(gl);return {glow:gl,top:[0,1.7,0]};}
    function ice(g){for(let k=0;k<7;k++){const b=box(0.5+((k*37)%5)/10,0.25,0.4+((k*13)%4)/10,M.paper,-1.4+k*0.45,0.12+(k%2)*0.1,((k*7)%3-1)*0.25,g,false);b.rotation.y=k*0.6;}cyl(0.12,2.4,M.metal,0,0.5,0,g,Math.PI/2);return {top:[0,0.6,0]};}
    function streak(g){box(2.2,0.08,1.2,M.steel,0,1.0,0,g,false);for(let k=0;k<9;k++){const b=new THREE.Mesh(sphereG,FM.slime);b.scale.set(0.18+(k%3)*0.06,0.06,0.12);b.position.set(-0.9+k*0.22,1.06,((k*5)%3-1)*0.3);g.add(b);}cyl(0.06,1.0,M.steel,-1,0.5,0.5,g);cyl(0.06,1.0,M.steel,1,0.5,-0.5,g);return {top:[0,1.2,0]};}
    function lint(g){for(let k=0;k<8;k++){const b=new THREE.Mesh(sphereG,M.paper);b.scale.set(0.5+(k%3)*0.2,0.22+(k%2)*0.12,0.45);b.position.set(-1.2+k*0.34,0.15,((k*3)%3-1)*0.35);g.add(b);}return {top:[0,0.5,0]};}
    function drive(g){box(1.4,1.2,1.2,M.steel,-1.0,0.6,0,g);const w=new THREE.Group();w.position.set(0.4,0.75,0);g.add(w);cyl(0.32,0.5,M.warn,0,0,0,w,Math.PI/2);cyl(0.14,1.6,M.metal,0.9,0,0,w,Math.PI/2);return {w,top:[0,1.4,0]};}
    function blade(g){box(2.4,0.12,0.3,M.metal,0,1.1,0,g,false);const w=new THREE.Group();w.position.set(0,1.1,0.2);g.add(w);box(2.3,0.04,0.25,M.steel,0,0,0,w,false);cyl(0.05,1.1,M.steel,-1.1,0.55,0,g);cyl(0.05,1.1,M.steel,1.1,0.55,0,g);return {w,top:[0,1.3,0]};}
    function glass(g){box(0.8,1.2,0.6,M.steel,0,0.6,0,g,false);const s=new THREE.Mesh(cubeG,M.bad);s.scale.set(0.3,0.36,0.05);s.position.set(0,0.95,0.31);g.add(s);cyl(0.1,1.6,M.metal,0,0.95,-0.6,g,0,Math.PI/2);return {glow:s,top:[0,1.3,0]};}
    // ---- where each tell sits: [x, z, prop, effect, rotation, extra] (ground level; checked against the area screenshots) ----
    const SC=1.8;   // tells are drawn larger than life: exaggerated, so they read from the round's camera
    const DEF={
      balefire:[-14,-8.3,pallets,"heat",0],fleet:[-14,-15.2,forklift,"oil",Math.PI],roof:[-36,23.5,bucket,"roof",0],
      ragger:[10.5,-9.5,motor,"smoke",0],overflow:[22,-8,flange,"wet",0],hdblow:[27.5,-7.5,flange,"spray",0],lwplug:[9,-18.5,flange,"spray",0],lcplug:[26.6,-27,flange,"sand",0],
      cscreen:[14.5,-27.5,pump,"shake",0],fscreen:[20,-27.5,pump,"rattle",0],refclash:[60.6,-6.6,pump,"shake",Math.PI/2],thkblow:[35,-9,flange,"spray",0],dye:[30.5,-6,glass,"dye",0],
      fabric:[48,15.6,hot,"hot",0],felt:[35,15.6,hot,"hot",0],slime:[42,15.6,streak,"slime",0],fogfan:[52,-4.5,motor,"smoke",0],
      shaft:[12,15.6,drive,"shake",0],dryerfire:[4,3.4,lint,"lint",0],wrap:[24,15.6,blade,"chatter",0],steamjoint:[14,3.4,flange,"steam",0],winderdown:[-22,16.5,motor,"hot",0],tiedrolls:[-17.6,16.4,blade,"chatter",0],
      boiler:[74,-7,pump,"smoke",0],permit:[null,-42,lint,"outfall",0],icedintake:[-30,-52.5,ice,"",0],brownout:[null,null,panel,"flicker",0]};
    const R=()=>Math.random()-0.5;
    for(const id in DEF){const [x,z,make,fx,ry]=DEF[id],g=new THREE.Group();g.rotation.y=ry||0;g.scale.setScalar(SC);TG.add(g);g.visible=false;
      const parts=make(g);if(fx==="wet"||fx==="oil"||fx==="spray"||fx==="roof"||fx==="sand")puddle(g,0.6,0.5,1.1,fx==="oil"?FM.scab:fx==="roof"?FM.water:FM.pulp);
      if(fx==="outfall")puddle(g,0,0,2.4,FM.slime);
      KIT[id]={id,g,fx,parts,x,z,place:id==="permit"?()=>[LAYOUT.wx(30),-42]:id==="brownout"?()=>{const p=G3.scenery&&G3.scenery.util&&G3.scenery.util.substation;return p?[p[0]+4,p[1]+4]:[70,-6];}:null};}
    const posOf=k=>{if(k.place){const [x,z]=k.place();k.x=x;k.z=z;}return [k.x,k.z];};
    // ---- the operator who walks the round ----
    const op=worker(M.stock,M.warn,{vest:HIVIS.orange,radio:true});op.visible=false;
    // the walk: past every place a tell can be in the area (the same route whatever is there), from one end to the other
    const AREA=a=>(TAREAK[a]||{ids:[]}).ids.filter(id=>KIT[id]&&(!EV[id].env||EV[id].env===SITE.env));
    function route(a){const pts=AREA(a).map(id=>{const [x,z]=posOf(KIT[id]);return [x,z-1.8];});pts.sort((p,q)=>p[0]-q[0]);
      if(pts.length===1)pts.push([pts[0][0]+4,pts[0][1]]);return pts;}
    const RND={on:false,a:null,t:0,len:15,pts:[],L:0,seg:[],shown:new Set(),hits:new Set(),camT:0,touch:0,done:null};
    G3.tellRoundOn=()=>RND.on;
    host.addEventListener("pointerdown",()=>{RND.touch=performance.now();},{passive:true});
    // start: the camera goes over, the operator appears at the first stop
    G3.tellRound=(a,secs,done)=>{if(RND.on)return false;const pts=route(a);if(!pts.length)return false;
      let L=0;const seg=[0];for(let k=1;k<pts.length;k++){L+=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);seg.push(L);}
      Object.assign(RND,{on:true,a,t:0,len:secs||15,pts,L,seg,done:done||null,camT:-1e9});RND.shown.clear();RND.hits.clear();
      TG.visible=true;op.visible=true;op.position.set(pts[0][0],0,pts[0][1]);op.updateMatrixWorld(true);G3.rounding=true;
      const cx=pts.reduce((s,p)=>s+p[0],0)/pts.length,cz=pts.reduce((s,p)=>s+p[1],0)/pts.length,span=Math.max(...pts.map(p=>Math.hypot(p[0]-cx,p[1]-cz)));
      RND.wide=span<12;RND.cx=cx;RND.cz=cz;RND.r=58;RND.ph=0.62;   // (a steeper view than usual: less is hidden behind tanks and conveyors)   // (close enough that the roofs fade out: 22-3d-floors.js)
      if(G3.camTo){if(RND.wide)G3.camTo(cx,cz,RND.r,undefined,RND.ph);else G3.camTo(pts[0][0],pts[0][1],RND.r,undefined,RND.ph);}return true;};
    G3.tellRoundStop=()=>{if(!RND.on)return;RND.on=false;G3.rounding=false;TG.visible=false;op.visible=false;for(const id in KIT)KIT[id].g.visible=false;RND.shown.clear();};
    G3.tellRoundLeft=()=>RND.on?Math.max(0,RND.len-RND.t):0;
    // which tells show: the ones queued in this area (an upset that fires mid-walk disappears; a caught one vanishes)
    function syncShown(){const q=(S.tell&&S.tell.q)||[],want=new Set();for(const p of q)if(p.area===RND.a&&KIT[p.id]&&!RND.hits.has(p.id))want.add(p.id);
      for(const id in KIT){const k=KIT[id],on=want.has(id);if(k.g.visible!==on){if(on){const [x,z]=posOf(k);k.g.position.set(x,0,z);k.g.updateMatrixWorld(true);}k.g.visible=on;}}
      RND.shown=want;}
    // a tap: the nearest shown tell within reach on screen
    const _v=new THREE.Vector3(),_e=new THREE.Vector3();
    G3.tellTap=e=>{if(!RND.on||!RND.shown.size)return false;const r=glc.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;let best=null,bd=1e9;
      for(const id of RND.shown){const k=KIT[id],t=k.parts.top;_v.set(k.x,t[1]*SC*0.6,k.z);_e.copy(_v).add(_e.set(0,2.5,0));
        _v.project(camera);_e.project(camera);if(_v.z>1)continue;const sx=(_v.x+1)/2*r.width,sy=(1-_v.y)/2*r.height,ex=(_e.x+1)/2*r.width,ey=(1-_e.y)/2*r.height;
        const reach=Math.max(TAP_PX,Math.hypot(ex-sx,ey-sy)),d=Math.hypot(px-sx,py-sy);if(d<=reach&&d<bd){bd=d;best=id;}}
      if(!best)return false;RND.hits.add(best);const k=KIT[best];
      for(let i=0;i<26;i++)emit("spark",k.x+R()*1.2,1.4,k.z+R()*1.2,R()*5,4+Math.random()*4,R()*5,0.7,0.3,"#5ee08a",1);
      k.g.visible=false;RND.shown.delete(best);if(G3.onTellCaught)G3.onTellCaught(best);return true;};
    // the screen position of a shown tell (tests)
    G3.tellScreen=id=>{const k=KIT[id];if(!k||!k.g.visible)return null;const r=glc.getBoundingClientRect(),t=k.parts.top;_v.set(k.x,t[1]*SC*0.6,k.z).project(camera);return [r.left+(_v.x+1)/2*r.width,r.top+(1-_v.y)/2*r.height,_v.z];};
    G3.tellSeek=f=>{if(RND.on)RND.t=f*RND.len;};G3.tellOp=()=>[op.position.x,op.position.z];
    G3.tellHold=ms=>{RND.touch=performance.now()+(ms||60000);};   // (tests: the camera stays where the tool put it)
    G3.tellShowAll=on=>{TG.visible=!!on;for(const id in KIT){const k=KIT[id],[x,z]=posOf(k);k.g.position.set(x,0,z);k.g.updateMatrixWorld(true);k.g.visible=!!on;}};   // (layout checks)
    G3.tellKits=()=>Object.keys(KIT);
    G3.tellPos=id=>KIT[id]?posOf(KIT[id]):null;
    // for the prewarm's one render: everything shown, so nothing compiles mid-round
    G3.tellWarm=shown=>{if(!TG.visible){TG.visible=true;shown.push(TG);}for(const id in KIT)if(!KIT[id].g.visible){KIT[id].g.visible=true;shown.push(KIT[id].g);}if(!op.visible){op.visible=true;shown.push(op);}};
    // ---- every frame ----
    let flick=0;
    G3.tellFrame=(rdt,now)=>{if(!RND.on)return;
      if(running&&!document.hidden)RND.t+=rdt;
      syncShown();
      // the operator: along the route at an even pace, a short look at each stop
      {const f=Math.min(1,RND.t/Math.max(1,RND.len-1)),d=f*RND.L;let k=1;while(k<RND.seg.length-1&&RND.seg[k]<d)k++;
        const a=RND.pts[k-1],b=RND.pts[k],sl=RND.seg[k]-RND.seg[k-1]||1,u=clamp((d-RND.seg[k-1])/sl,0,1),x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u;
        op.position.set(x,0,z);op.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);pose(op,f>=1?"inspect":u<0.12&&k>1?"inspect":"walk",now);op.updateMatrixWorld(true);
        // a long gap (the utilities are spread out) is driven: the figure hides while it covers it
        op.visible=!(sl>30&&u>0.08&&u<0.92);
        // a wide area: the camera keeps the operator in view unless the player moved it in the last 3 s
        if(!RND.wide&&now-RND.camT>1500&&now-RND.touch>3000){RND.camT=now;if(G3.camTo)G3.camTo(x,z,RND.r,undefined,RND.ph);}}
      // what each tell does
      if(rdt>0)for(const id of RND.shown){const k=KIT[id],x=k.x,z=k.z,p=k.parts,top=[p.top[0]*SC,p.top[1]*SC,p.top[2]*SC];
        if(p.w){const s=k.fx==="shake"||k.fx==="rattle"?0.16:k.fx==="chatter"?0.12:0.06;p.w.rotation.x=Math.sin(now/37)*s;p.w.rotation.z=Math.sin(now/29)*s*0.6;p.w.updateMatrixWorld(true);}
        const ty=top[1];
        switch(k.fx){
          case "smoke":case "hot":case "heat":if(Math.random()<rdt*14)emit("smoke",x+R()*0.8,ty+0.3,z+R()*0.8,R()*0.4,1.4+Math.random()*0.8,R()*0.4,3.2,1.6+Math.random()*1.0,k.fx==="heat"?"#4a4f57":"#59606b",0.8);
            if(k.fx!=="smoke"&&Math.random()<rdt*18)emit("spark",x+R()*0.8,ty,z+R()*0.8,R()*3,3+Math.random()*3,R()*3,0.6,0.22,"#ffb347",1);break;
          case "spray":case "wet":if(Math.random()<rdt*45)emit("drop",x+R()*0.5,1.7,z,R()*3.5,1.5+Math.random()*2,1.8+Math.random()*2.4,0.8,0.22,"#c9b08a",0.95);break;
          case "sand":if(Math.random()<rdt*40)emit("chip",x+R()*0.5,1.7,z+R()*0.5,R()*2,1,R()*2,0.9,0.16,"#b9a27a",1);break;
          case "oil":if(Math.random()<rdt*16)emit("drop",x+R()*1.2,0.9,z+R()*0.8,0,-0.5,0,0.6,0.18,"#3b2f22",1);if(Math.random()<rdt*4)emit("smoke",x+R(),1.6,z,R()*0.3,1,R()*0.3,2.4,1.2,"#6b6b6b",0.5);break;
          case "roof":if(Math.random()<rdt*30)emit("drop",x+R()*0.8,8,z+R()*0.8,0,-2,0,0.8,0.2,"#9fc5e8",0.95);break;
          case "steam":if(Math.random()<rdt*36)emit("steam",x+R()*0.4,1.7,z+0.5,R()*2,3+Math.random()*2,2+Math.random()*1.5,1.8,1.2+Math.random()*0.8,"#f2f4f6",0.85);break;
          case "rattle":case "shake":case "chatter":if(Math.random()<rdt*12)emit("spark",x+R()*1,ty*0.8,z+R()*1,R()*4,3+Math.random()*3,R()*4,0.5,0.22,"#ffd27a",1);if(Math.random()<rdt*3)emit("smoke",x,ty,z,R()*0.3,1,R()*0.3,2.2,1.2,"#7a7f88",0.5);break;
          case "lint":if(Math.random()<rdt*8)emit("smoke",x+R()*3,0.8,z+R()*1.5,R()*0.3,1.2,R()*0.3,3,1.8,"#6b707a",0.65);if(Math.random()<rdt*6)emit("fire",x+R()*2,0.5,z+R(),0,0.6,0,0.5,0.5,"#ff8a3a",0.8);break;
          case "slime":if(Math.random()<rdt*12)emit("drop",x+R()*3,1.9,z+R()*1.5,0,-0.3,0,0.8,0.22,"#7c8a3a",1);break;
          case "outfall":if(Math.random()<rdt*14)emit("smoke",x+R()*4,0.4,z+R()*4,R()*0.3,0.5,R()*0.3,2.4,2.2,"#d9c79a",0.7);break;
          case "flicker":if(Math.random()<rdt*10)emit("spark",x+R(),ty,z+0.6,R()*3,2+Math.random()*3,2,0.5,0.22,"#bfe3ff",1);break;
          case "dye":if(Math.random()<rdt*14)emit("drop",x+R()*0.4,1.8,z+0.6,R()*1.5,1,1.5,0.8,0.22,["#d64fd6","#3fb6e0","#f2c230"][(Math.random()*3)|0],1);break;}
        if(p.glow){flick+=rdt;const on=k.fx==="flicker"?Math.sin(now/45)+Math.sin(now/17)>0.2:Math.sin(now/180)>-0.3;if(p.glow.visible!==on)p.glow.visible=on;}}
      if(RND.t>=RND.len){const d=RND.done;G3.tellRoundStop();if(d)d();}};
  }
