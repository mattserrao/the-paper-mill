  /* ---- v5.6 fiddly knobs in 3D (the model is 07b-knobs.js, the panels and DCS screens 50b-knob-ui.js) ----
     Red knob hardware where a field knob lives, a stock prep (SPOT) console beside the two on the machine floor, tap
     targets for both, the visible trouble a moved knob causes (fabric walking off, a fluttering draw, stripes on the
     pick-up felt, steam off the dryer roof), and the fiddly knobs view: the mill washed out under a pale veil with only
     the red knobs and their labels on top. Everything here is built before the first frame (compiled by the prewarm). */
  {const KX={};G3.KX=KX;
    const plate=(txt,w,x,y,z,ry)=>{const c=document.createElement("canvas");c.width=256;c.height=48;const g=c.getContext("2d");g.fillStyle="#ffffff";g.fillRect(0,0,256,48);g.fillStyle="#c8281e";g.fillRect(0,0,10,48);
      g.fillStyle="#1c2233";g.font="800 24px system-ui,sans-serif";g.textAlign="center";g.fillText(txt,133,33);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
      const p=new THREE.Mesh(new THREE.PlaneGeometry(w,w*48/256),new THREE.MeshBasicMaterial({map:t}));p.position.set(x,y,z);p.rotation.y=ry||0;scene.add(p);return p;};
    // a red handwheel valve on a short water pipe
    function wheelValve(x,y,z,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry||0;scene.add(g);
      const p=new THREE.Mesh(new CylG(0.14,0.14,y+0.4,10),M.metal);p.position.set(0,(y+0.4)/2,-0.35);g.add(p);
      box(0.42,0.42,0.42,M.steel,0,y,-0.35,g,false);box(0.08,0.5,0.08,M.steel,0,y+0.3,-0.35,g,false);
      const w=new THREE.Group();w.position.set(0,y+0.58,-0.35);g.add(w);const tor=new THREE.Mesh(new THREE.TorusGeometry(0.3,0.045,6,18),M.bad);tor.rotation.x=Math.PI/2;w.add(tor);
      [0,1].forEach(k=>{const s=box(0.6,0.04,0.04,M.bad,0,0,0,w,false);s.rotation.y=k*Math.PI/2;});return {g,w,at:[x,y+0.6,z]};}
    // a red local control station on a post (start/stop, speed pot)
    function station(x,z,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry||0;scene.add(g);
      box(0.1,1.1,0.1,M.steel,0,0.55,0,g,false);box(0.5,0.62,0.28,M.bad,0,1.32,0,g);
      box(0.12,0.12,0.06,M.ok,-0.1,1.45,0.16,g,false);box(0.12,0.12,0.06,M.ink,0.1,1.45,0.16,g,false);
      const pot=new THREE.Mesh(new CylG(0.07,0.07,0.06,10),M.ink);pot.rotation.x=Math.PI/2;pot.position.set(0,1.2,0.16);g.add(pot);return {g,at:[x,1.6,z]};}
    // ---- field knobs ----
    const pv=wheelValve(21.0,1.3,-10.6,0);plate("DILUTION",1.0,21.0,2.55,-10.25);KX.pulp={at:pv.at,w:pv.w};
    const rv=wheelValve(58.9,1.5,-11.0,Math.PI/2);plate("PLATE GAP",1.0,58.55,2.75,-11.0,-Math.PI/2);KX.ref={at:rv.at,w:rv.w};
    const as=station(51.4,-11.4,-Math.PI/4);plate("AGITATOR",0.8,51.4,2.0,-11.25,-Math.PI/4);KX.agit={at:as.at};
    const gs=station(46.2,13.05,0);plate("GUIDE",0.7,46.2,2.0,13.21);KX.guide={at:gs.at};
    const cs=station(43.4,13.05,0);plate("COUCH PIT",0.8,43.4,2.0,13.21);KX.couch={at:cs.at};   // (v6.12.1-t6: swapped with the couch box)
    // v6.12.1-t6: the couch suction box's position control, on a post by the couch roll (the couch pit agitator's station moved east to make room)
    const cbs=station(40.4,13.05,0);plate("COUCH BOX",0.8,40.4,2.0,13.21);KX.cbox={at:cbs.at};
    const os=station(35.0,13.15,0);plate("OSCILLATOR",0.8,35.0,2.0,13.31);KX.osc={at:os.at};
    // v6.11.1: the dryer hood doors' raise / lower station, on a post under the tending-side catwalk
    const hs=station(3.0,13.15,0);plate("HOOD DOORS",0.8,3.0,2.0,13.31);KX.hood={at:hs.at};
    // v6.10 t5: the MCC main incomer's breaker handle, on the incoming 480 V section inside the MCC (38c)
    {const x=CAB.main.stand[0],z=CABZ+0.36,g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(0.5,0.7,0.08,M.ink,0,1.35,0,g,false);
      const h=box(0.12,0.42,0.12,M.bad,0.08,1.42,0.08,g);h.rotation.z=-0.35;box(0.2,0.12,0.14,M.bad,-0.12,1.12,0.07,g,false);
      plate("MAIN INCOMER",0.8,x,2.0,z+0.06);KX.incomer={at:[x,1.6,z+0.3]};}
    // the couch pit agitator motor itself, low on the tending side
    {const m=new THREE.Mesh(new CylG(0.32,0.32,0.8,12),M.motor);m.rotation.z=Math.PI/2;m.position.set(41.2,0.45,12.75);scene.add(m);}
    // ---- the stock prep console (SPOT), like the machine floor's: desk, two screens, a stool; the screens face the operator ----
    // (v6.11.2: moved from under the wet-end pipe racks to the stock prep pad's north-west corner, by the effluent transfer tank,
    //  where the iso camera can see it; the screens and stools face the camera's side)
    const SPC=[6.4,-22.9];
    {const g=new THREE.Group();g.position.set(SPC[0],0,SPC[1]);scene.add(g);box(2.0,1.0,0.7,M.steel,0,0.5,0,g);const top=box(2.0,0.12,0.75,M.ink,0,1.05,0.05,g,false);top.rotation.x=0.35;
      const c=document.createElement("canvas");c.width=128;c.height=80;const x=c.getContext("2d");x.fillStyle="#13233a";x.fillRect(0,0,128,80);x.strokeStyle="#4fd18b";x.lineWidth=2;x.strokeRect(10,14,34,30);x.strokeRect(54,24,26,22);x.strokeRect(90,14,28,34);
      x.beginPath();x.moveTo(44,30);x.lineTo(54,34);x.moveTo(80,34);x.lineTo(90,30);x.stroke();x.fillStyle="#ffb02e";x.fillRect(8,58,50,7);x.fillStyle="#9ab3d6";x.fillRect(66,58,52,7);
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sm=new THREE.MeshBasicMaterial({map:t,toneMapped:false});
      [-0.5,0.5].forEach(dx=>{box(0.08,0.5,0.08,M.ink,dx,1.35,-0.25,g,false);box(0.85,0.55,0.08,M.ink,dx,1.75,-0.25,g,false);const sc=new THREE.Mesh(new THREE.PlaneGeometry(0.76,0.47),sm);sc.position.set(dx,1.75,-0.205);g.add(sc);});
      [-0.6,0.6].forEach(dx=>{const ch=new THREE.Group();ch.position.set(SPC[0]+dx,0,SPC[1]+1.35);scene.add(ch);box(0.55,0.08,0.55,M.ink,0,0.5,0,ch,false);box(0.55,0.6,0.08,M.ink,0,0.85,0.26,ch,false);box(0.08,0.5,0.08,M.steel,0,0.25,0,ch,false);});
      blob(SPC[0],SPC[1],1.6);plate("SPOT · STOCK PREP DCS",1.6,SPC[0],0.62,SPC[1]+0.36);}
    // stations: where each DCS lives (the machine floor's three consoles, and stock prep's)
    const ST=[{a:"SPOT",at:[SPC[0],1.6,SPC[1]]},{a:"WET",at:[58,1.6,13.4]},{a:"DET",at:[26,1.6,13.4]},{a:"DET",at:[-5,1.6,13.4]}];
    // v6.11.2: the computer on the MCC desk (38c) opens the Drives page
    {const MC=G3.MCC;if(MC)ST.push({a:"DRV",at:[MC.desk[0],1.0,MC.desk[1]-0.45],r:1.1});}
    // ---- tap targets: invisible spheres outside the scene (never drawn, never batched), with their matrices set once ----
    const HG=new THREE.SphereGeometry(1,8,6),HM=new THREE.MeshBasicMaterial(),HITS=[];
    const addHit=(at,r,tag)=>{const m=new THREE.Mesh(HG,HM);m.position.set(at[0],at[1],at[2]);m.scale.setScalar(r);m.updateMatrixWorld(true);m.userData.tag=tag;HITS.push(m);return m;};
    for(const id in KX)addHit(KX[id].at,1.3,{k:"knob",id});
    ST.forEach(s=>addHit(s.at,s.r||1.6,{k:"station",a:s.a}));
    // in the knob view the markers are the targets, bigger and wherever they float
    G3.knobFly=id=>{const k=KX[id];if(k&&G3.camTo)G3.camTo(k.at[0],k.at[2],46);};
    G3.knobHit=rc=>{if(G3.zen||S.zen)return null;const h=rc.intersectObjects(G3.kvOn?KVHITS:HITS,false);return h.length?h[0].object.userData.tag:null;};
    // ---- the fiddly knobs view ----
    const veilM=new THREE.MeshBasicMaterial({color:lin0("#e9ecf2"),transparent:true,opacity:0.86,depthTest:false,depthWrite:false,toneMapped:false});
    const veil=new THREE.Mesh(new THREE.PlaneGeometry(1,1),veilM);veil.renderOrder=9990;veil.frustumCulled=false;veil.visible=false;scene.add(veil);SM.dyn.add(veil);
    const mkM=new THREE.MeshBasicMaterial({color:lin0("#d6382c"),depthTest:false,depthWrite:false,transparent:true,toneMapped:false});
    const ringM=new THREE.MeshBasicMaterial({color:lin0("#d6382c"),depthTest:false,depthWrite:false,transparent:true,opacity:0.5,side:THREE.DoubleSide,toneMapped:false});
    const dotG=new THREE.SphereGeometry(0.55,16,10),ringG=new THREE.RingGeometry(0.85,1.15,28),stemG=new THREE.CylinderGeometry(0.06,0.06,1,6);
    const KVG=new THREE.Group();KVG.visible=false;scene.add(KVG);SM.dyn.add(KVG);const KVHITS=[],MARKS=[];
    // every knob in the view: the field knobs, the DCS-only knobs at their console, and the two knobs that were already there
    const KVL=[["pulp"],["ref"],["agit"],["guide"],["couch"],["osc"],["incomer"],["hood"],["zones","WET",[58,1.6,13.4]],["draw","DET",[-5,1.6,13.4]],["spider",null,[33,PH+1.2,-17.6]],["slice",null,[57.15,2.95,12.7]]];
    KVL.forEach(([id,st,pos])=>{const at=pos||KX[id].at,g=new THREE.Group();g.position.set(at[0],at[1]+2.2,at[2]);KVG.add(g);
      const d=new THREE.Mesh(dotG,mkM);d.renderOrder=9995;g.add(d);const r=new THREE.Mesh(ringG,ringM);r.renderOrder=9994;g.add(r);
      const s=new THREE.Mesh(stemG,mkM);s.scale.y=2.2;s.position.y=-1.1;s.renderOrder=9993;g.add(s);
      const lb=lblNew(true,"knob:"+(st?"station:"+st:id));MARKS.push({id,st,g,r,lb,v:new THREE.Vector3(at[0],at[1]+3.6,at[2])});
      const tag=id==="spider"?{k:"spider"}:id==="slice"?{k:"slice"}:st?{k:"station",a:st}:{k:"knob",id};
      const hm=new THREE.Mesh(HG,HM);hm.position.set(at[0],at[1]+2.2,at[2]);hm.scale.setScalar(2.2);hm.updateMatrixWorld(true);hm.userData.tag=tag;KVHITS.push(hm);});
    // (the section labels' Off setting would hide the knobs' labels too: lifted while the view is up, put back after)
    let kvLblOff=false;
    // shown for the prewarm's one render, so the view's shaders are compiled at start-up, not when it is first turned on
    G3.warmShow=shown=>{[veil,KVG].forEach(o=>{if(!o.visible){o.visible=true;shown.push(o);}});};
    G3.knobView=on=>{on=!!on;if(on===!!G3.kvOn)return;G3.kvOn=on;veil.visible=KVG.visible=on;if(!on)MARKS.forEach(m=>m.lb.vis=false);LB.force=true;
      if(on){kvLblOff=labelHost.classList.contains("lbl-off");labelHost.classList.remove("lbl-off");}else if(kvLblOff)labelHost.classList.add("lbl-off");
      // the spider valve sits inside the thickener's group: put its marker where it really is in the world
      if(G3.kvOn&&!KVG.userData.sp&&G3.spiderHit){KVG.userData.sp=1;const p=new THREE.Vector3();G3.spiderHit[0].updateWorldMatrix(true,false);G3.spiderHit[0].getWorldPosition(p);
        const i=KVL.findIndex(r=>r[0]==="spider"),m=MARKS[i];m.g.position.set(p.x,p.y+2.2,p.z);m.v.set(p.x,p.y+3.6,p.z);KVHITS[i].position.set(p.x,p.y+2.2,p.z);KVHITS[i].updateMatrixWorld(true);}};
    // a tap on a knob's label in the view opens it too (labels are drawn on the 2D overlay, 29-3d-camera.js asks here first)
    G3.lblTap=id=>{if(typeof id!=="string"||!id.startsWith("knob:"))return false;const t=id.slice(5);
      if(t.startsWith("station:"))G3.knobTap({k:"station",a:t.slice(8)});else if(t==="spider"||t==="slice")G3.knobTap({k:t});else G3.knobTap({k:"knob",id:t});return true;};
    const _q=new THREE.Vector3(),_d=new THREE.Vector3();
    G3.kvVeil=veil;
    // ---- v6.11.2 the known defects view (Rounds screen): the mill greyed out, a labelled bullseye on each known defect,
    // orange for mechanical, blue for electrical ----
    const DVG=new THREE.Group();DVG.visible=false;scene.add(DVG);SM.dyn.add(DVG);const DV={on:false,pins:new Map(),t:0};
    const dvM={m:new THREE.MeshBasicMaterial({color:lin0("#e8590c"),depthTest:false,depthWrite:false,transparent:true,toneMapped:false}),e:new THREE.MeshBasicMaterial({color:lin0("#1c7ed6"),depthTest:false,depthWrite:false,transparent:true,toneMapped:false}),w:new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false,depthWrite:false,transparent:true,toneMapped:false})};
    const ring1=new THREE.RingGeometry(0.95,1.3,32),ring2=new THREE.RingGeometry(0.45,0.7,28),dot=new THREE.CircleGeometry(0.25,20),disc=new THREE.CircleGeometry(1.32,32);
    // (t6: early-warning findings get a small faded pin with no pulse; serious ones and spotted tells keep the full bullseye)
    const dvF={};for(const k in dvM){dvF[k]=dvM[k].clone();dvF[k].opacity=0.5;}
    function dvPin(d){const g=new THREE.Group(),b=new THREE.Group();g.add(b);const MM=d.early?dvF:dvM,M2=MM[d.k];
      [[disc,MM.w,9991],[ring1,M2,9992],[ring2,M2,9992],[dot,M2,9993]].forEach(([geo,m,o])=>{const x=new THREE.Mesh(geo,m);x.renderOrder=o;b.add(x);});
      const s=new THREE.Mesh(stemG,M2);s.scale.y=d.early?1.4:2.2;s.position.y=d.early?-0.7:-1.1;s.renderOrder=9990;g.add(s);
      const y=d.early?2.6:3.4;g.position.set(d.at[0],y,d.at[1]);DVG.add(g);return {g,b,lb:lblNew(true,"defect:"+d.id),v:new THREE.Vector3(d.at[0],y+(d.early?1.0:1.5),d.at[1]),d,early:!!d.early};}
    function dvSync(){const L=knownDefects(),keep=new Set();for(const d of L){keep.add(d.id);let p=DV.pins.get(d.id);if(p&&p.early!==!!d.early){DVG.remove(p.g);p.lb.vis=false;p=null;}if(!p){p=dvPin(d);DV.pins.set(d.id,p);}p.d=d;}
      for(const [id,p] of DV.pins)if(!keep.has(id)){DVG.remove(p.g);p.lb.vis=false;DV.pins.delete(id);}return L.length;}
    G3.defectView=on=>{on=!!on&&!S.zen;if(on===DV.on)return DV.pins.size;DV.on=on;G3.dvOn=on;DVG.visible=on;veil.visible=on||!!G3.kvOn;LB.force=true;
      if(on){if(labelHost.classList.contains("lbl-off")){DV.lblOff=true;labelHost.classList.remove("lbl-off");}return dvSync();}
      for(const p of DV.pins.values())p.lb.vis=false;if(DV.lblOff){DV.lblOff=false;labelHost.classList.add("lbl-off");}return 0;};
    G3.defectCount=()=>knownDefects().length;
    function dvFrame(now){if(!DV.on)return;if(now-DV.t>1000){DV.t=now;dvSync();}
      {const d=camera.near*1.2,h=(camera.isIso?camera.top-camera.bottom:2*d*Math.tan(camera.fov*Math.PI/360))*1.15;camera.getWorldDirection(_d);veil.position.copy(camera.position).addScaledVector(_d,d);veil.quaternion.copy(camera.quaternion);veil.scale.set(h*camera.aspect,h,1);veil.updateMatrixWorld();}
      const w=G3.vw||host.clientWidth,hh=G3.vh||host.clientHeight,pulse=0.5+0.5*Math.sin(now/300);
      for(const p of DV.pins.values()){p.b.lookAt(camera.position);const s=p.early?0.6:1+0.15*pulse;p.b.scale.set(s,s,s);p.g.updateMatrixWorld(true);_q.copy(p.v).project(camera);
        const vis=_q.z<1&&Math.abs(_q.x)<1.05&&Math.abs(_q.y)<1.05;p.lb.vis=vis;if(!vis)continue;p.lb.x=Math.round((_q.x+1)/2*w);p.lb.y=Math.round((1-_q.y)/2*hh);
        const cd=G3.camDist||camera.position.distanceTo(p.v);if(p.early&&cd>110){p.lb.vis=false;continue;}   // (early pins are labelled once zoomed in)
        lblSet(p.lb,p.d.a,cd>170?"":p.d.b,p.d.k==="m");}}
    function kvFrame(now){if(!G3.kvOn)return;
      if(labelHost.classList.contains("lbl-off")){kvLblOff=true;labelHost.classList.remove("lbl-off");}   // (the labels intro may switch them off meanwhile)
      // (the scene's automatic matrix update is off while moving batches draw, 43-3d-frame.js: update these by hand)
      {const d=camera.near*1.2,h=(camera.isIso?camera.top-camera.bottom:2*d*Math.tan(camera.fov*Math.PI/360))*1.15;camera.getWorldDirection(_d);veil.position.copy(camera.position).addScaledVector(_d,d);veil.quaternion.copy(camera.quaternion);veil.scale.set(h*camera.aspect,h,1);veil.updateMatrixWorld();}   // (just past the near plane, which moves with the zoom)
      const w=G3.vw||host.clientWidth,hh=G3.vh||host.clientHeight,doTxt=now-(kvFrame.t||0)>200;if(doTxt)kvFrame.t=now;
      const pulse=0.5+0.5*Math.sin(now/260);
      MARKS.forEach(m=>{m.r.lookAt(camera.position);const s=1+0.35*pulse;m.r.scale.set(s,s,s);m.r.position.set(0,0,0);
        m.g.updateMatrixWorld(true);_q.copy(m.v).project(camera);const vis=_q.z<1&&Math.abs(_q.x)<1.05&&Math.abs(_q.y)<1.05;m.lb.vis=vis;if(!vis)return;
        m.lb.x=Math.round((_q.x+1)/2*w);m.lb.y=Math.round((1-_q.y)/2*hh);
        if(doTxt||m.lb.a==null){let a,b,bad;
          if(m.id==="spider"){a="Spider valve";b="disk thickener";bad=false;}
          else if(m.id==="slice"){a="Headbox slice";b="L/B gauge";bad=!!(G3.SLC&&(G3.SLC.v||G3.SLC.h));}
          else if(m.st){const ids=KNOBS.filter(k=>k.dcs&&k.area===m.st).map(k=>k.id),moved=ids.filter(i=>!knobAt(i));a=(m.st==="WET"?"Wet end DCS":"Dry end DCS");
            b=moved.length?moved.map(i=>KNOBN[i].name+": "+knobFmt(i)).join(" · "):ids.map(i=>KNOBN[i].name).join(" · ");bad=moved.length>0;}
          else{a=KNOBN[m.id].name;b=knobAt(m.id)?"standard · "+knobFmt(m.id):"moved · "+knobFmt(m.id);bad=!knobAt(m.id);}
          if((G3.camDist||camera.position.distanceTo(m.v))>170)b=bad?"moved":"";   // zoomed out: names only, so they don't pile up
          lblSet(m.lb,a,b,bad);}});}
    // ---- what a moved knob looks like ----
    // the pick-up felt (1st press top felt) gets its own felt texture so stripes can be painted into it (same shader as the other felts)
    let pfLvl=-1;
    function paintStripes(k){const c=G3.pfCanvas;if(!c)return;const x=c.getContext("2d"),W=c.width,H=c.height;x.fillStyle="#fff";x.fillRect(0,0,W,H);x.fillStyle="#8a8a8a";x.fillRect(0,0,4,H);   /* (v6.12.1-t6: the seam, once per turn) */
      if(k>0.02){x.fillStyle=`rgba(92,64,30,${Math.min(0.95,0.35+k*0.7)})`;[0.12,0.29,0.47,0.66,0.83].forEach((v,i)=>x.fillRect(0,Math.round(v*H),W,Math.max(1,Math.round(H*(0.035+0.02*(i%2))))));}
      G3.pfTex.needsUpdate=true;}
    let wire0=null,flut=false;
    G3.knobFrame=(rdt,now)=>{const K=S.knob,on=!!(K&&K.any)&&!S.zen;
      // stripes building up on the pick-up felt
      {const st=on?K.x.st:0,q=Math.round(st*20)/20;if(q!==pfLvl){pfLvl=q;paintStripes(q);}}
      // the forming fabric walking toward the tending side (the guide roll out of travel, or on manual)
      if(wire0===null)wire0=wireLoop.position.z;{const e=on?clamp(K.edge,-60,60):0,z=wire0+e*0.012;if(Math.abs(wireLoop.position.z-z)>1e-4){wireLoop.position.z=z;wireLoop.updateMatrixWorld();}}
      // a slack open draw flutters going into the dryers
      {const k=on&&S.pm==="run"?clamp((K.x.dl-0.08)/0.4,0,1):0;
        if(k>0){flut=true;sheetPre[5][1]=3.6+Math.sin(now/70)*0.18*k+Math.sin(now/31)*0.08*k;sheetPre[4][1]=3.4+Math.sin(now/53+1)*0.06*k;buildSheet(sheetR);}
        else if(flut){flut=false;sheetPre[5][1]=3.6;sheetPre[4][1]=3.4;buildSheet(sheetR);}}
      // more steam off the dryer roof (and the power house) when the dryers are working harder
      if(on&&rdt>0&&K.sf>1.03&&S.pm==="run"){const k=Math.min(1,(K.sf-1)/0.3);
        if(Math.random()<rdt*10*k)emit("steam",2+Math.random()*24,14.6,zc+R()*4,R()*0.6+0.4,2.6+Math.random()*1.6,R()*0.6,3.4,2.2+Math.random()*1.6,"#f4f6f8",0.55);
        if(K.x.bs>0.2&&Math.random()<rdt*6*K.x.bs)emit("steam",76+R(),15,-10+R(),R()*0.5,3+Math.random()*2,R()*0.5,3,2.4,"#eef1f5",0.6);}
      // a thick pulper: the handwheel turned shut; a thin one, wide open (just the wheel's angle)
      if(K){const turn=(w,a)=>{if(Math.abs(w.rotation.y-a)>1e-4){w.rotation.y=a;w.updateMatrixWorld(true);}};turn(KX.pulp.w,(K.v.pulp-50)/50*Math.PI);turn(KX.ref.w,(gapOf(K.v.ref)-0.5)*Math.PI*3);}
      kvFrame(now);dvFrame(now);};
    // ---- breakdowns only a knob causes: their effects and pins (31-3d-upset-fx.js builds and precompiles them) ----
    FXDEF.rotortrip=g=>spFx(g,16,-13.5,2.6,8);
    FXDEF.couchpit=g=>spFx(g,40.6,11.4,0.6,6);
    FXDEF.oscfail=g=>(now,rdt)=>{if(Math.random()<rdt*8)emit("steam",35.5+Math.random()*3.5,7.4,zc+R()*5,R()*0.4,0.8+Math.random(),R()*0.4,1.6,1.1,"#dfe7ee",0.5);};
    // v6.10 t5: the arc flash at the main incomer. A blinding electric-blue fireball (a saturated blue halo and a white-hot
    // core, flickering; normal blending, since additive light vanishes on the mill's pale ground), thick jagged arcs
    // crawling over the switchgear and out to the walls, a shower of molten sparks, a blue flash over the whole screen while
    // the MCC is in view, and a camera jolt; then re-strikes for a few seconds, and smoke pouring out of the door and roof.
    {const halo=spriteTex((x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.12,"rgba(225,245,255,1)");g.addColorStop(0.3,"rgba(80,170,255,0.9)");g.addColorStop(0.6,"rgba(30,90,255,0.45)");g.addColorStop(1,"rgba(20,40,200,0)");x.fillStyle=g;x.fillRect(0,0,w,w);},128);
      const sm=()=>new THREE.SpriteMaterial({map:halo,transparent:true,depthWrite:false,depthTest:false,toneMapped:false});
      const arcM=new THREE.MeshBasicMaterial({color:lin0("#e9f7ff"),transparent:true,depthWrite:false,depthTest:false,toneMapped:false});
      const arcM2=new THREE.MeshBasicMaterial({color:lin0("#2f8cff"),transparent:true,depthWrite:false,depthTest:false,toneMapped:false});
      const ringM=new THREE.MeshBasicMaterial({map:halo,transparent:true,depthWrite:false,toneMapped:false});
      const NA=14,NP=12,SEG=NA*(NP-1),segG=new THREE.BoxGeometry(1,1,1),_m=new THREE.Matrix4(),_p=new THREE.Vector3(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_u=new THREE.Vector3(0,1,0),_d=new THREE.Vector3();
      let flashEl=null;const flash=o=>{if(!flashEl){flashEl=document.createElement("div");flashEl.className="arcflashfx";document.body.appendChild(flashEl);}const v=o.toFixed(2);if(flashEl.style.opacity!==v)flashEl.style.opacity=v;};
      UI_TICKS.push(()=>{if(flashEl&&flashEl.style.opacity!=="0.00"&&!(S&&S.inc&&S.inc.some(i=>i.id==="arcflash")))flash(0);});   // (a fast clock can clear the flash before its last frame)
      FXDEF.arcflash=g=>{const x=CAB.main.stand[0],z=CABZ+0.5,y=1.5;
        const big=new THREE.Sprite(sm());big.position.set(x,y,z);big.renderOrder=9980;g.add(big);
        const core=new THREE.Sprite(sm());core.position.set(x,y,z+0.1);core.renderOrder=9983;g.add(core);
        const floor=new THREE.Mesh(new THREE.PlaneGeometry(1,1),ringM);floor.rotation.x=-Math.PI/2;floor.position.set(x,0.06,z+1.4);g.add(floor);
        // the arcs: thick segments (WebGL lines are 1 px), white-hot ones and blue ones
        const mkI=m=>{const im=new THREE.InstancedMesh(segG,m,SEG);im.renderOrder=9982;im.frustumCulled=false;im.count=0;g.add(im);return im;};const hot=mkI(arcM),blue=mkI(arcM2);
        const pts=[];for(let i=0;i<NP;i++)pts.push(new THREE.Vector3());
        const bolt=(tx,ty,tz)=>{for(let i=0;i<NP;i++){const f=i/(NP-1),j=Math.sin(f*Math.PI)*0.7,e=i&&i<NP-1;pts[i].set(x+(tx-x)*f+(e?R()*j:0),y+(ty-y)*f+(e?R()*j:0),z+(tz-z)*f+(e?R()*j*0.6:0));}};
        const put=(im,w)=>{for(let i=0;i<NP-1;i++){const a=pts[i],b=pts[i+1];_d.subVectors(b,a);const L=_d.length();if(L<1e-4)continue;_p.addVectors(a,b).multiplyScalar(0.5);_q.setFromUnitVectors(_u,_d.normalize());_s.set(w,L,w);_m.compose(_p,_q,_s);im.setMatrixAt(im.count++,_m);}};
        let lastB=0,shook=0;
        return (now,rdt,inc)=>{const f=inc&&inc.real?performance.now()-inc.real:9e9;
          const blast=f<3000?1-f/3000:0,re=f>=3000&&f<9000&&Math.sin(f/90)*Math.sin(f/37)>0.5?0.6:0,k=Math.max(blast,re),fl=k>0?0.7+Math.random()*0.3:0;
          big.visible=core.visible=floor.visible=k>0;
          if(k>0){const s=(8+blast*26)*fl;big.scale.set(s,s,1);big.material.opacity=Math.min(1,0.45+k*0.55)*fl;const c=(2+blast*6)*fl;core.scale.set(c,c,1);core.material.opacity=1;
            const r=5+blast*12;floor.scale.set(r,r,1);ringM.opacity=0.8*k*fl;}
          // the screen flash and a jolt, only when the MCC is on screen
          {let on=0;if(blast>0){_p.set(x,y,z).project(camera);on=_p.z<1&&Math.abs(_p.x)<1.1&&Math.abs(_p.y)<1.1?1:0;}flash(on?Math.min(0.65,blast*blast*0.85*fl):0);
            if(on&&!shook&&G3.camShake){shook=1;G3.camShake(0.9);}if(!inc||f>9e3)shook=0;}
          const live=k>0;arcM.opacity=live?fl:0;arcM2.opacity=live?0.9*fl:0;
          if(live&&now-lastB>40){lastB=now;hot.count=blue.count=0;const n=Math.round(4+k*(NA-4));
            for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,d=1.4+Math.random()*(2+blast*7),up=i%4===0&&blast>0.3;bolt(up?x+R()*1.5:x+Math.cos(a)*d,up?MCC.h+2+Math.random()*4*blast:Math.max(0.05,y+R()*2+(i%3===0?1.8:0)),up?z+R()*1.5:z+Math.abs(Math.sin(a))*d*0.9);put(i%3?blue:hot,(i%3?0.16:0.11)*(0.6+0.6*k));
              if(i%2===0){bolt(pts[NP-1].x+R()*1.8,Math.max(0.05,pts[NP-1].y+R()*1.4),pts[NP-1].z+R()*1.8);put(blue,0.08);}}   // (forks off the end)
            hot.instanceMatrix.needsUpdate=blue.instanceMatrix.needsUpdate=true;}
          else if(!live&&(hot.count||blue.count)){hot.count=blue.count=0;}
          g.updateMatrixWorld(true);   // (the scene's automatic matrix update is off, 43-3d-frame.js)
          if(rdt<=0)return;
          if(blast>0&&Math.random()<rdt*160*blast)emitA("spark",x+R()*0.6,y+R()*0.5,z+Math.random()*0.4,R()*11,1+Math.random()*8,1+Math.random()*9,0.8+Math.random()*0.6,0.26+Math.random()*0.2,Math.random()<0.4?"#ffffff":Math.random()<0.6?"#4aa3ff":"#ffd27a",1);
          if(re>0&&Math.random()<rdt*35)emitA("spark",x+R()*0.4,y+R()*0.4,z+0.2,R()*6,1+Math.random()*4,Math.random()*5,0.5,0.22,"#9fd2ff",1);
          if(f<10000&&Math.random()<rdt*(f<3000?16:6))emitA("smoke",x+R()*1.4,y+1+Math.random(),z+0.6+R()*0.8,R()*0.7,1.3+Math.random(),R()*0.7,3.4,2+Math.random()*1.4,"#3f444d",0.65);
          if(Math.random()<rdt*4)emitA("smoke",MCC.door[0]-0.7+R()*0.4,2.3,MCC.door[1]+R()*0.7,-0.8+R()*0.3,0.9+Math.random()*0.5,R()*0.3,3.4,1.6,"#5d636e",0.6);
          if(Math.random()<rdt*3)emitA("smoke",x+R()*2,MCC.h+0.6,z+1.5+R()*1.5,R()*0.4,1.4,R()*0.4,4,2.4,"#5d636e",0.5);};};}
    PINS.arcflash=[CAB.main.stand[0],7,CABZ+0.5,"bolt"];
    PINS.rotortrip=[16,9,-13.5,"bolt"];PINS.couchpit=[40.6,7,12.2,"water"];PINS.oscfail=[37,11,zc,"!"];
  }
