  /* ---- vehicles ---- */
  // tractor-trailer: cab-over-axle tractor with sleeper, grille, lights, mirrors, tanks, stack; 53' style box trailer
  const chromeM=new StdMat({color:0xdfe4ea,metalness:0.85,roughness:0.25}),tailM=new THREE.MeshBasicMaterial({color:lin0("#ff3b30")}),headM=new THREE.MeshBasicMaterial({color:lin0("#fff6d6")});
  const wheelG=new CylG(0.4,0.4,0.3,18);wheelG.rotateX(Math.PI/2);const hubG=new CylG(0.2,0.2,0.32,12);hubG.rotateX(Math.PI/2);
  function makeTruck(kind){const g=new THREE.Group(),wheels=[];
    // tractor
    box(2.1,0.22,1.1,M.ink,1.75,0.62,0,g,false);                                   // frame rails
    box(1.0,1.55,1.84,M.brand,2.35,1.55,0,g);                                      // cab
    box(0.6,1.25,1.8,M.brand,1.55,1.42,0,g);                                       // sleeper
    box(0.7,0.28,1.8,M.brand,1.6,2.17,0,g,false);                                  // fairing
    box(0.06,0.6,1.55,M.wind,2.86,1.86,0,g,false);                                 // windshield
    [-0.93,0.93].forEach(z=>box(0.5,0.45,0.05,M.wind,2.45,1.9,z,g,false));          // side windows
    box(0.12,0.78,1.4,chromeM,2.9,1.02,0,g,false);                                 // grille
    box(0.18,0.2,1.95,chromeM,2.93,0.55,0,g,false);                                // bumper
    [-0.7,0.7].forEach(z=>{const h=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.14,0.26),headM);h.position.set(2.97,0.82,z);g.add(h);
      box(0.06,0.42,0.1,M.ink,2.75,1.95,z*1.45,g,false);});                         // headlights + mirrors
    [-0.95,0.95].forEach(z=>{const t=new THREE.Mesh(new CylG(0.24,0.24,0.75,14),chromeM);t.rotation.z=Math.PI/2;t.position.set(1.6,0.7,z);g.add(t);}); // fuel tanks
    const stack=new THREE.Mesh(new CylG(0.07,0.07,1.5,10),chromeM);stack.position.set(1.85,2.15,0.85);g.add(stack);g.userData.stack=[1.85,2.95,0.85];
    box(0.5,0.08,0.7,M.ink,1.15,0.8,0,g,false);                                    // fifth wheel
    let doorL,doorR;
    if(kind==="chem"){   // stainless chemical tank trailer with a hazard placard, walkway and hose cabinet
      const tm=new StdMat({color:0xd9dee5,metalness:0.75,roughness:0.28});box(4.0,0.16,1.2,M.ink,-1.05,0.72,0,g,false);
      const tk=new THREE.Mesh(new CylG(0.82,0.82,3.9,20),tm);tk.rotation.z=Math.PI/2;tk.position.set(-1.05,1.62,0);tk.castShadow=true;g.add(tk);
      [-3.0,0.9].forEach(x=>{const e=new THREE.Mesh(new SphG(0.82,16,10),tm);e.scale.set(0.25,1,1);e.position.set(x,1.62,0);g.add(e);});
      [-2.1,-1.05,0].forEach(x=>{const r=new THREE.Mesh(new CylG(0.85,0.85,0.08,20,1,true),M.steel);r.rotation.z=Math.PI/2;r.position.set(x,1.62,0);g.add(r);});
      box(2.4,0.05,0.4,gratM,-1.05,2.47,0,g,false);box(0.3,0.25,0.3,M.ink,-1.05,2.55,0,g,false);
      const pc=document.createElement("canvas");pc.width=pc.height=64;const px=pc.getContext("2d");px.translate(32,32);px.rotate(Math.PI/4);px.fillStyle="#f5f5f0";px.fillRect(-20,-20,40,40);px.strokeStyle="#1c2233";px.lineWidth=3;px.strokeRect(-17,-17,34,34);
      px.rotate(-Math.PI/4);px.fillStyle="#1c2233";px.font="bold 14px system-ui,sans-serif";px.textAlign="center";px.fillText("8",0,12);const ptx=new THREE.CanvasTexture(pc);
      [1,-1].forEach(sd=>{const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.55),new THREE.MeshBasicMaterial({map:ptx,transparent:true}));pl.position.set(-1.05,1.62,sd*0.84);if(sd<0)pl.rotation.y=Math.PI;g.add(pl);});
      box(0.5,0.45,0.35,M.ink,-1.05,0.95,0.78,g,false);
      const hose=new THREE.Mesh(new CylG(0.07,0.07,1,8),M.ink);hose.visible=false;scene.add(hose);g.userData.hose=hose;
      doorL=new THREE.Object3D();doorR=new THREE.Object3D();g.add(doorL,doorR);}
    else{
    // trailer
    box(4.0,0.16,1.8,M.ink,-1.05,0.84,0,g,false);
    [-0.92,0.92].forEach(z=>{const sd=new THREE.Mesh(new THREE.BoxGeometry(4.0,1.32,0.06),[M.wall,M.wall,M.wall,M.wall,M.trailer,M.trailer]);sd.position.set(-1.05,1.6,z);sd.castShadow=true;g.add(sd);});
    box(4.0,0.06,1.86,M.wall,-1.05,2.27,0,g,false);box(0.06,1.32,1.86,M.wall,0.95,1.6,0,g,false);
    doorL=box(0.05,1.3,0.92,M.wall,-3.07,1.6,-0.46,g,false);doorR=box(0.05,1.3,0.92,M.wall,-3.07,1.6,0.46,g,false);
    box(0.06,1.3,0.03,M.ink,-3.1,1.6,0,g,false);[-0.82,0.82].forEach(z=>{const t=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.12,0.18),tailM);t.position.set(-3.1,0.98,z);g.add(t);});
    box(0.12,0.12,1.8,M.ink,-3.0,0.6,0,g,false);                                   // ICC bumper
    [-0.75,0.75].forEach(z=>{box(0.08,0.55,0.08,M.ink,0.2,0.48,z,g,false);box(0.25,0.06,0.25,M.ink,0.2,0.2,z,g,false);}); // landing gear
    [-2.95,-2.95].forEach((x,k)=>box(0.04,0.5,0.4,M.ink,-2.2,0.45,k?0.9:-0.9,g,false));   // mud flaps
    }
    // wheels: steer, tandem drive, tandem trailer
    [2.35,1.25,0.6,-2.0,-2.75].forEach(x=>[-0.82,0.82].forEach(z=>{const w=new THREE.Mesh(wheelG,M.ink);w.position.set(x,0.4,z);g.add(w);
      const hb=new THREE.Mesh(hubG,chromeM);hb.position.set(x,0.4,z);g.add(hb);wheels.push(w);}));
    const cargo=[];for(let k=0;k<(kind==="chem"?0:8);k++){const c=kind==="in"?box(0.8,0.72,0.78,M.bale,-2.5+(k%4)*0.9,1.32,(Math.floor(k/4)?0.42:-0.42),g)
      :(()=>{const r=new THREE.Mesh(new CylG(0.4,0.4,0.9,18),ROLLM);r.position.set(-2.5+(k%4)*0.9,1.4,Math.floor(k/4)?0.42:-0.42);r.castShadow=true;g.add(r);return r;})();cargo.push(c);}
    Object.assign(g.userData,{cargo,kind,heading:0,wheels,doorL,doorR,stack:[1.85,2.95,0.85]});scene.add(g);return g;}   // merge: the chem tanker stores its hose here first
  // OCC trailer yard west of receiving: dropped trailers waiting to be pulled to a door
  slab(-92,-56,-26.4,-7.6,M.asphalt,0.022);slab(-60,-56,-7.6,-5.0,M.asphalt,0.022);
  for(let x=-90;x<=-58;x+=2.7){box(0.12,0.02,4.6,M.lane,x-1.35,0.05,-23.6,scene,false);box(0.12,0.02,4.6,M.lane,x-1.35,0.05,-10.4,scene,false);}
  box(2.0,2.2,1.6,mat("g-wall"),-58.6,1.1,-17,scene);box(2.2,0.18,1.8,M.brand,-58.6,2.29,-17,scene,false);box(0.9,0.7,0.05,M.wind,-58.6,1.4,-16.18,scene,false);   // yard booth
  const yardTr=[];
  function dropTrailer(x,z,face,open){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=face;scene.add(g);
    box(4.0,0.16,1.8,M.ink,0,0.84,0,g,false);[-0.92,0.92].forEach(zz=>{const sd=new THREE.Mesh(new THREE.BoxGeometry(4.0,1.32,0.06),[M.wall,M.wall,M.wall,M.wall,M.trailer,M.trailer]);sd.position.set(0,1.6,zz);sd.castShadow=true;g.add(sd);});
    box(4.0,0.06,1.86,M.wall,0,2.27,0,g,false);box(0.06,1.32,1.86,M.wall,2.0,1.6,0,g,false);
    if(open){[-0.42,0.42].forEach(zz=>box(0.8,0.72,0.78,M.baleG[Math.floor(Math.random()*3)],-1.5,1.32,zz,g));const d=box(0.05,1.3,0.92,M.wall,-2.05,1.6,-1.32,g,false);d.rotation.y=-1.4;}
    else box(0.06,1.32,1.86,M.wall,-2.02,1.6,0,g,false);
    [-0.75,0.75].forEach(zz=>{box(0.08,0.62,0.08,M.ink,1.25,0.48,zz,g,false);box(0.25,0.06,0.25,M.ink,1.25,0.18,zz,g,false);});
    [-1.0,-1.75].forEach(xx=>[-0.82,0.82].forEach(zz=>{const w=new THREE.Mesh(wheelG,M.ink);w.position.set(xx,0.4,zz);g.add(w);}));
    yardTr.push(g);return g;}
  for(let k=0;k<12;k++){const x=-88.65+k*2.7;dropTrailer(x,-23.6,-Math.PI/2,k%5===2);dropTrailer(x,-10.4,Math.PI/2,k%4===1);}
  yardTr.sort(()=>Math.random()-0.5);G3.yardTr=yardTr;
  // trucks drive their own 3D routes on the roads and aprons and back into the docks (the sim only says queue / dock / leave)
  const LANE={in:{inZ:-3.1,outZ:-4.5,apronX:[-53,-34.4],dockX:-37.45,turnX:-46,qMax:-41.5},out:{inZ:12.9,outZ:12.0,apronX:[-60,-49],dockX:-52.05,turnX:-57.5,qMax:-53.2}};
  function routeFor(g,kind,phase,t,dz){const L=LANE[kind],x=g.position.x;
    if(phase==="q")return [];
    const s=dz>L.inZ?1:-1,lane=x<L.qMax-0.5?[{x:L.qMax,z:L.inZ,fast:true}]:[];
    const dock=[...lane,{x:Math.max(x,L.qMax)+1.2,z:L.inZ+s*2.2,lock:1},{x:L.turnX+3,z:dz-s*3.2,lock:1},{x:L.turnX,z:dz-s*0.4,lock:1},{x:L.dockX,z:dz,rev:true,lock:1}];
    if(phase==="dock")return dock;
    const leave=[{x:L.turnX-1,z:dz,lock:1},{x:L.turnX-1.5,z:L.outZ+(dz>L.outZ?1.5:-1.5),lock:1},{x:L.turnX-4,z:L.outZ,lock:1},{x:-150,z:L.outZ,end:true,fast:true}];
    // a truck that never made it onto its dock finishes backing in before pulling out again -- unless the apron is busy:
    // then it pulls straight out of the queue (otherwise, at high sim speed, finished trucks pile up at the apron forever)
    const busyApron=L.lock&&L.lock!==g&&L.lock.visible&&L.lock.userData.busy;
    if((g.userData.phase==="q"||!g.userData.phase)&&busyApron)return [{x:x-2,z:L.outZ},{x:-150,z:L.outZ,end:true,fast:true}];
    return (g.userData.phase==="dock"&&g.userData.route.length?g.userData.route.slice():g.userData.phase==="q"||!g.userData.phase?dock:[]).concat(leave);}
  const TSC=()=>clamp(C.simSpeed/10,1,6);   // trucks keep pace with the sim clock at higher game speeds
  // one truck manoeuvres on each apron at a time; the others hold at the apron entrance or on their dock
  function stepRoute(g,L,rdt){const R2=g.userData.route,w=R2[0];if(!w)return;
    if(w.lock){if(L.lock&&L.lock!==g&&L.lock.visible&&L.lock.userData.route.some(v=>v.lock))return;
      if(L===LANE.in&&CHEM.want&&CHEM.g!==g&&L.lock!==g)return;   // a waiting chemical tanker goes next, so OCC trucks can't starve it
      L.lock=g;}
    if(driveTo(g,w,(w.rev?3.2:w.fast?16:7)*TSC(),rdt)){if(w.end)g.userData.done=true;R2.shift();if(L.lock===g&&!R2.some(v=>v.lock))L.lock=null;}}
  function driveTo(g,wp,speed,rdt){const dx=wp.x-g.position.x,dz=wp.z-g.position.z,d=Math.hypot(dx,dz);if(d<0.25)return true;
    const s=Math.min(d,speed*rdt);g.position.x+=dx/d*s;g.position.z+=dz/d*s;let h=Math.atan2(-dz,dx);if(wp.rev)h+=Math.PI;
    g.userData.heading=lerpAng(g.userData.heading,h,Math.min(1,rdt*(wp.rev?3:5)));g.rotation.y=g.userData.heading;g.userData.spin=(g.userData.spin||0)+(wp.rev?-1:1)*s/0.4;return false;}
  const truckPool={in:[],out:[]},truckMap=new Map();
  // chemical tanker: every so often it backs onto a free receiving door, hooks up a hose, unloads and leaves (visual only)
  const CHEM={g:null,st:"away",t:25,d:-1,dz:0},_ha=new THREE.Vector3(),_hb=new THREE.Vector3(),_hup=new THREE.Vector3(0,1,0);
