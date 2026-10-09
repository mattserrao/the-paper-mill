  /* ---- step 4: upgrades you can see ---- */
  const UPV={};
  function upg(id,build){const g=new THREE.Group();scene.add(g);build(g);UPV[id]=g;return g;}
  const motors=upg("drive",g=>{for(let k=0;k<3;k++){const m=new THREE.Group();box(1.6,1.4,1.4,M.stock,0,0.7,0,m);cylZ(0.25,1.2,M.metal,0,0.7,-1,8,m);m.position.set(2+k*9,0,zc-CD/2-2.2);g.add(m);}});
  const beacons=upg("monitor",g=>{for(let k=0;k<6;k++){const b=new THREE.Mesh(new CylG(0.22,0.22,0.5,8),M.robot);b.position.set(-4+k*7,7.85,zc+CD/2+0.6);g.add(b);}});
  const sprink=upg("fire",g=>{pipe([[-6,8.6,zc],[30,8.6,zc]],0.18,M.bad,g);for(let x=-4;x<=28;x+=4)box(0.12,0.5,0.12,M.bad,x,8.3,zc,g,false);});
  const cleaners=upg("clean",g=>{for(let i=0;i<14;i++){const x=BX0+0.3+i*((BX1-BX0-0.6)/13);const c=new THREE.Mesh(new CylG(0.17,0.05,1.6,10),M.metal);c.position.set(x,1.55,ZL+0.35);c.castShadow=true;g.add(c);
      const t=new THREE.Mesh(new CylG(0.18,0.18,0.25,10),M.steel);t.position.set(x,2.45,ZL+0.35);g.add(t);}});
  const detrash=upg("detrash",g=>{box(3,2.6,2.4,M.stock,22.5,1.3,-19.5,g);cylZ(0.4,2.8,M.metal,22.5,2.9,-19.5,8,g);});
  const annexes=[1,2].map(n=>upg("wh"+n,g=>{const z0=32.2+(n-1)*8,z1=z0+8;
    const f=new THREE.Mesh(new THREE.PlaneGeometry(25.2,8),M.slab);f.rotation.x=-Math.PI/2;f.position.set(-36.4,0.045,(z0+z1)/2);f.receiveShadow=true;g.add(f);
    ribWall(0.3,4.6,8,-49,2.3,(z0+z1)/2,g);ribWall(0.3,4.6,8,-23.8,2.3,(z0+z1)/2,g);ribWall(25.2,4.6,0.3,-36.4,2.3,z1,g);
    const im=new THREE.InstancedMesh(rollGeo,ROLLM,36),m=new THREE.Matrix4();for(let k=0;k<36;k++){m.makeTranslation(-45+(k%12)*1.75,0.74,z0+1.5+Math.floor(k/12)*2.2);im.setMatrixAt(k,m);}im.castShadow=true;g.add(im);g.userData.rolls=im;}));
  const walk=upg("safety",g=>{    [[-21.2,-2.6,26.4,0.5],[-36.4,14.4,25.2,0.5],[23,3.4,68,0.5],[23,15.6,68,0.5]].forEach(([x,z,w,d])=>box(w,0.03,d,M.warn,x,0.07,z,g,false));});
  // refiner upgrade: two large double-disc refiners in parallel off the chest-to-headbox stock line, each with its own motor
  const REF_MOTORS=[],REF_DOORS=[];   // v2.9.18: the twin refiners are standard equipment; the upgrade fits bigger motors
  const refiner=upg("refiner",g=>{const X=60.6,ZS=[-14,-8];
    ZS.forEach(z=>{box(7.2,0.45,3.4,M.steel,X+1.6,0.22,z,g);                                                              // skid
      const hg=new CylG(1.55,1.55,1.7,28);hg.rotateZ(Math.PI/2);const h=new THREE.Mesh(hg,M.brand);h.position.set(X,2.0,z);h.castShadow=true;g.add(h);   // disc housing
      {const fg=new CylG(1.7,1.7,0.18,28);fg.rotateZ(Math.PI/2);const f=new THREE.Mesh(fg,M.steel);f.position.set(X+0.95,2.0,z);g.add(f);}
      // v3.0.0: the door side (flange + gap adjuster) swings open on a hinge at its inner edge for plate changes
      {const s=z<-11?1:-1,door=new THREE.Group();door.position.set(X-0.95,0,z+s*1.7);g.add(door);
       const fg=new CylG(1.7,1.7,0.18,28);fg.rotateZ(Math.PI/2);const f=new THREE.Mesh(fg,M.steel);f.position.set(0,2.0,-s*1.7);f.castShadow=true;door.add(f);
       box(1.4,1.0,1.6,M.steel,-0.65,1.5,-s*1.7,door);const ad=new THREE.Mesh(new CylG(0.28,0.28,1.0,12),M.ink);ad.position.set(-0.65,2.4,-s*1.7);door.add(ad);
       const face=new THREE.Mesh(new CylG(1.3,1.3,0.04,28).rotateZ(Math.PI/2),M.steel);face.position.set(X-0.87,2.0,z);face.visible=false;g.add(face);
       REF_DOORS.push({door,face,s,x:X,z});}
      for(let k=0;k<10;k++){const a=k/10*Math.PI*2;box(0.3,0.12,0.12,M.ink,X+0.98,2.0+Math.cos(a)*1.68,z+Math.sin(a)*1.68,g,false);}   // flange bolts
      // gap adjuster: on the door (above)
      const sg=new CylG(0.22,0.22,1.6,12);sg.rotateZ(Math.PI/2);const sh=new THREE.Mesh(sg,M.metal);sh.position.set(X+1.75,2.0,z);g.add(sh);   // shaft + coupling
      const cg=new CylG(0.45,0.45,0.35,16);cg.rotateZ(Math.PI/2);const cp=new THREE.Mesh(cg,M.warn);cp.position.set(X+2.2,2.0,z);g.add(cp);
      const mg=new CylG(1.0,1.0,2.8,24);mg.rotateZ(Math.PI/2);const mo=new THREE.Mesh(mg,M.motor);mo.position.set(X+3.8,1.6,z);mo.castShadow=true;g.add(mo);REF_MOTORS.push(mo);   // motor
      for(let k=0;k<8;k++){const a=k/8*Math.PI*2;box(2.6,0.08,0.08,M.ink,X+3.8,1.6+Math.cos(a)*1.02,z+Math.sin(a)*1.02,g,false);}   // cooling fins
      box(0.7,0.6,0.7,M.ink,X+3.8,2.85,z,g,false);blob(X+1.5,z,3.6);});
    const P=0.24;   // inlet header from the stock line, over and down into each housing; outlets back to the line
    spool([[57,4.8,-11],[57.9,4.8,-11],[57.9,4.6,-11]],P,M.stock);spool([[57.9,4.6,-14],[57.9,4.6,-8]],P,M.stock);
    ZS.forEach(z=>{spool([[57.9,4.6,z],[X,4.6,z],[X,3.55,z]],P,M.stock);spool([[X,0.7,z+(z<-11?1.55:-1.55)],[X,0.7,-11],[56.2,0.7,-11]],0.2,M.stock);});
    // v3.3: refined stock rises from the outlet header and drops into the top of the machine chest
    spool([[56.2,0.7,-11],[56.2,0.7,-10.2],[56.2,10.8,-10.2],[49.2,10.8,-10.2],[49.2,10.8,-13.6],[49.2,9.6,-13.6]],0.32,M.stock);
    });
  const ctrl=upg("apc",g=>{box(6,3.2,4,M.wall,46,1.6,-6,g);box(5.4,1.1,0.1,M.robot,46,2.2,-3.95,g,false);box(6.4,0.3,4.4,M.steel,46,3.35,-6,g);});
  function upUpdate(now){
    motors.visible=LV("drive")>0;motors.children.forEach((m,k)=>m.visible=k<LV("drive"));
    beacons.visible=LV("monitor")>0;beacons.children.forEach((b,k)=>{b.visible=k<3*LV("monitor");b.material=((now/500+k)|0)%3===0?M.ok:M.robot;});
    sprink.visible=LV("fire")>0;cleaners.visible=LV("clean")>0;cleaners.children.forEach((c,k)=>c.visible=k<14*LV("clean"));
    detrash.visible=LV("detrash")>0;refiner.visible=true;{const k=LV("refiner")>0?1.3:1;REF_MOTORS.forEach(m=>m.scale.set(k>1?1.1:1,k,k));}walk.visible=LV("safety")>0;ctrl.visible=LV("apc")>0;
    annexes.forEach((a,k)=>{a.visible=LV("wh")>k;});
    // rolls fill main bay first, then annexes
    const total=Math.ceil(S.fg/(P.fgCap/(84+36*LV("wh"))));rolls.count=Math.min(84,total);rolls.instanceMatrix.needsUpdate=true;
    annexes.forEach((a,k)=>{const n=clamp(total-84-36*k,0,36);a.userData.rolls.count=n;a.userData.rolls.instanceMatrix.needsUpdate=true;});
    const ps=1+0.15*LV("pulper");pulper.scale.set(ps,1,ps);
    belt.material=P.autoFeed?M.robot:M.steel;
    lifts.forEach(l=>{if(l.children[0].material===M.fork&&LV("forklift"))l.children[0].material=M.efork;});
  }

  let fpsN=0,fpsT=0,quality=2;
  G3.frame=function(rdt){try{G3.frameBody(rdt);}catch(e){G3.fErr=(G3.fErr||0)+1;if(G3.fErr<6)console.error('3D frame error',e);try{renderer.render(scene,camera);}catch(_){}}};
  const shChecked=new WeakSet(),_shB=new THREE.Vector3(),_shS=new THREE.Vector3();
  function trimShadows(){scene.traverse(o=>{if(!o.isMesh||shChecked.has(o))return;shChecked.add(o);if(!o.castShadow||o.isInstancedMesh)return;
    const g=o.geometry;if(!g)return;if(!g.boundingBox)g.computeBoundingBox();g.boundingBox.getSize(_shB);o.getWorldScale(_shS);
    const d=[Math.abs(_shB.x*_shS.x),Math.abs(_shB.y*_shS.y),Math.abs(_shB.z*_shS.z)].sort((a,b)=>a-b);
    if(!(d[2]>=2&&d[1]>=0.6))o.castShadow=false;});renderer.shadowMap.needsUpdate=true;}
