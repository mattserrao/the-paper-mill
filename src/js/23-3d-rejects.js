  // ---- rejects handling: compactor shed by the rail spur, two compactors with roll-off cans swapped by a green hauler once a day ----
  const CMP={bays:[-44.5,-38.5],dockX:-50.7,canX:-42.6,canY:1.25};
  slab(-160,-100,-37.2,-33.8,M.asphalt);slab(-100,-47.6,-48.6,-33.2,M.asphalt,0.03);slab(-47.6,-33.6,-48.2,-35,M.slab,0.04);
  for(let x=-156;x<-102;x+=4)box(2,0.02,0.16,M.lane,x,0.05,-35.5,scene,false);
  {const g=new THREE.Group(),rm=mat("brand",{transparent:true,roughness:0.6,side:THREE.DoubleSide});
    ribWall(0.3,5,13.2,-33.7,2.5,-41.6);ribWall(14,5,0.3,-40.6,2.5,-48.1);ribWall(10,1.2,0.25,-40.6,0.6,-41.5);    // back, north and a low divider
    [[-47.4,-35.1],[-47.4,-48],[-40.6,-35.1]].forEach(([x,z])=>box(0.3,5,0.3,M.steel,x,2.5,z));
    const roof=new THREE.Mesh(new THREE.BoxGeometry(14.6,0.25,13.8),rm);roof.position.set(-40.6,5.25,-41.6);roof.rotation.x=0.05;roof.castShadow=true;g.add(roof);
    g.userData.mats=[rm];g.userData.fade=[150,60];scene.add(g);roofs.push(g);
    // two stationary compactors (ram housing, hopper, power pack) with a rejects chute coming in through the back wall
    CMP.bays.forEach((bz,k)=>{box(3.8,1.6,2.4,M.brand,-37.6,0.8,bz);box(2.2,1.5,2.8,M.steel,-37.4,2.35,bz);box(2.4,0.12,3.0,M.ink,-37.4,3.1,bz,scene,false);
      box(1.1,1.0,1.0,M.ink,-35.2,0.5,bz+1.6);box(0.5,0.6,0.15,M.ok,-35.8,1.5,bz+1.25,scene,false);
      const ch=box(4.6,0.5,0.9,M.steel,-35.4,4.0,bz,scene);ch.rotation.z=-0.32;
      const c=document.createElement("canvas");c.width=96;c.height=48;const x=c.getContext("2d");x.fillStyle="#f5f2e8";x.fillRect(0,0,96,48);x.fillStyle="#1c2233";x.font="800 30px system-ui,sans-serif";x.textAlign="center";x.fillText("C"+(k+1),48,36);
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.6),new THREE.MeshBasicMaterial({map:t}));pl.position.set(-37.6,1.0,bz+1.22);scene.add(pl);});}
  // roll-off compactor cans (hook end faces west, toward the truck)
  function compCan(k){const g=new THREE.Group(),cm=new StdMat({color:lin0(["#2f5f73","#3b6b4f"][k]),roughness:0.6,metalness:0.2});
    box(6,1.9,2.4,cm,0,0.15,0,g);const lid=new THREE.Mesh(new CylG(1.2,1.2,6,16,1,false,0,Math.PI),cm);lid.rotation.z=Math.PI/2;lid.rotation.x=-Math.PI/2;lid.scale.set(1,1,0.35);lid.position.y=1.1;g.add(lid);
    for(let x=-2.4;x<=2.4;x+=1.2)box(0.12,1.9,2.5,M.ink,x,0.15,0,g,false);
    box(0.3,0.3,1.2,M.warn,-3.1,0.5,0,g,false);box(0.2,1.0,0.2,M.warn,-3.05,0.2,0,g,false);[-0.9,0.9].forEach(z=>box(6,0.2,0.2,M.ink,0,-0.85,z,g,false));
    g.castShadow=true;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g);return g;}
  CMP.cans=[0,1].map(k=>{const c=compCan(k);c.position.set(CMP.canX,CMP.canY,CMP.bays[k]);return c;});
  // the green roll-off truck (local +x is forward)
  const wTruck=new THREE.Group();wTruck.visible=false;scene.add(wTruck);
  {const gm=new StdMat({color:lin0("#2e8b57"),roughness:0.45,metalness:0.2});
    box(9.2,0.4,1.0,M.ink,-0.4,1.0,0,wTruck);box(2.3,2.4,2.4,gm,3.45,2.1,0,wTruck);box(0.1,0.95,2.1,M.wind,4.62,2.65,0,wTruck,false);box(0.3,0.16,1.7,M.warn,3.4,3.38,0,wTruck,false);
    box(0.4,0.5,2.5,M.metal,4.7,0.95,0,wTruck,false);box(0.9,0.9,0.5,M.metal,2.0,1.3,-0.95,wTruck,false);
    [-0.62,0.62].forEach(z=>box(6.4,0.24,0.22,gm,-1.3,1.33,z,wTruck,false));
    const c=document.createElement("canvas");c.width=256;c.height=64;const x=c.getContext("2d");x.fillStyle="#2e8b57";x.fillRect(0,0,256,64);x.fillStyle="#ffffff";x.font="800 26px system-ui,sans-serif";x.textAlign="center";x.fillText("WASTE SERVICES",128,42);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;[1,-1].forEach(sd=>{const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.0,0.5),new THREE.MeshBasicMaterial({map:t}));pl.position.set(3.45,1.6,sd*1.21);if(sd<0)pl.rotation.y=Math.PI;wTruck.add(pl);});
    CMP.wheels=[];[3.4,-1.6,-2.9].forEach(ax=>[-1.12,1.12].forEach(z=>{const w=cylZ(0.55,0.42,M.ink,ax,0.55,z,14,wTruck);CMP.wheels.push(w);}));}
  const hookArm=new THREE.Group();hookArm.position.set(1.9,1.4,0);wTruck.add(hookArm);box(0.35,2.2,0.35,new StdMat({color:lin0("#2e8b57")}),0,1.1,0,hookArm,false);box(0.8,0.3,0.3,M.warn,-0.35,2.15,0,hookArm,false);
  // path legs: polylines walked at a set speed; rev = backing up (truck faces against the direction of travel)
  const arcP=(cx,cz,r,a0,a1,n=10)=>Array.from({length:n+1},(_,k)=>{const a=(a0+(a1-a0)*k/n)*Math.PI/180;return [cx+r*Math.cos(a),cz+r*Math.sin(a)];});
  const sCurve=(x0,z0,x1,z1,n=10)=>Array.from({length:n+1},(_,k)=>{const f=k/n,e=f*f*(3-2*f);return [x0+(x1-x0)*f,z0+(z1-z0)*e];});
  function legsIn(bz){return [{v:9,pts:[[-128,-35.5],[-100,-35.5],...sCurve(-100,-35.5,-80,bz).slice(1),[-64,bz]]},{v:3,pts:arcP(-64,bz-4,4,90,0)},{v:2.2,rev:true,pts:[...arcP(-56,bz-4,4,180,90),[CMP.dockX,bz]]}];}
  function legsOut(bz){return [{v:8,pts:[[CMP.dockX,bz],[-80,bz],...sCurve(-80,bz,-100,-35.5).slice(1),[-128,-35.5]]}];}
  const WT={state:"idle",legs:null,li:0,d:0,t:0,bay:0,lastDay:null,carry:null};G3.WT=WT;
  function legLen(L){if(L.len)return L.len;let a=0;L.cum=[0];for(let i=1;i<L.pts.length;i++){a+=Math.hypot(L.pts[i][0]-L.pts[i-1][0],L.pts[i][1]-L.pts[i-1][1]);L.cum.push(a);}L.len=a;return a;}
  function legAt(L,d){for(let i=1;i<L.pts.length;i++)if(d<=L.cum[i]||i===L.pts.length-1){const a=L.pts[i-1],b=L.pts[i],f=clamp((d-L.cum[i-1])/Math.max(1e-6,L.cum[i]-L.cum[i-1]),0,1);return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,Math.atan2(-(b[1]-a[1]),b[0]-a[0])];}}
  function runLegs(dt){const L=WT.legs[WT.li];legLen(L);WT.d=Math.min(L.len,WT.d+L.v*dt);const [x,z,h]=legAt(L,WT.d);wTruck.position.set(x,0,z);
    const ry=L.rev?h+Math.PI:h;let dr=ry-wTruck.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));wTruck.rotation.y+=dr*Math.min(1,dt*10);CMP.wheels.forEach(w=>w.rotation.z-=(L.rev?-1:1)*L.v*dt/0.55);
    if(WT.d>=L.len-1e-3){WT.li++;WT.d=0;if(WT.li>=WT.legs.length)return true;}return false;}
  const bedPos=()=>wTruck.localToWorld(new THREE.Vector3(-1.6,2.45,0));
  G3.wasteFrame=rdt=>{if(rdt<=0)return;const dt=rdt*clamp(C.simSpeed/30,1,4),day=Math.floor((S.t+360-600)/1440),bz=CMP.bays[WT.bay],can=CMP.cans[WT.bay];
    if(WT.lastDay===null)WT.lastDay=day;
    if(WT.state==="idle"){if(day!==WT.lastDay){WT.lastDay=day;WT.bay=day%2===0?0:1;WT.state="in1";WT.legs=legsIn(CMP.bays[WT.bay]);WT.li=0;WT.d=0;wTruck.visible=true;wTruck.rotation.y=0;
        log(`Waste hauler is swapping compactor C${WT.bay+1}`,"");}return;}
    if(WT.state==="in1"||WT.state==="in2"){if(runLegs(dt)){WT.state=WT.state==="in1"?"load":"unload";WT.t=0;if(WT.state==="unload")scene.attach(can);}return;}
    if(WT.state==="load"||WT.state==="unload"){WT.t+=dt/4.5;const k=clamp(WT.t,0,1),u=WT.state==="load"?k:1-k,b=bedPos();
      can.position.set(CMP.canX+(b.x-CMP.canX)*u,CMP.canY+(b.y-CMP.canY)*u+Math.sin(Math.PI*u)*0.9,bz);can.rotation.set(0,0,-Math.sin(Math.PI*u)*0.32);hookArm.rotation.z=Math.sin(Math.PI*u)*0.9;
      if(WT.t>=1){hookArm.rotation.z=0;if(WT.state==="load"){wTruck.attach(can);WT.state="out1";}else{can.position.set(CMP.canX,CMP.canY,bz);can.rotation.set(0,0,0);WT.state="out2";}WT.legs=legsOut(bz);WT.li=0;WT.d=0;}return;}
    if(WT.state==="out1"||WT.state==="out2"){if(runLegs(dt)){if(WT.state==="out1"){WT.state="away";WT.t=0;wTruck.visible=false;}else{WT.state="idle";wTruck.visible=false;}}return;}
    if(WT.state==="away"){WT.t+=dt;if(WT.t>6){WT.state="in2";WT.legs=legsIn(bz);WT.li=0;WT.d=0;wTruck.visible=true;wTruck.rotation.y=0;}}};
  const doorWalls={in:new THREE.Group(),out:new THREE.Group()};scene.add(doorWalls.in,doorWalls.out);let doorKey="";
  function buildDoorWall(group,x,z0,z1,doorsZ,h,bayDir){group.clear();const gap=2.6,dh=3.1,edges=[z0,...doorsZ.flatMap(z=>[z-gap/2,z+gap/2]),z1];
    for(let i=0;i<edges.length;i+=2){const a=edges[i],b=edges[i+1];if(b-a>0.05)ribWall(0.3,h,b-a,x,h/2,(a+b)/2,group);}
    doorsZ.forEach(z=>{const lin=new THREE.Mesh(new THREE.BoxGeometry(0.3,h-dh,gap),M.wall);lin.position.set(x,dh+(h-dh)/2,z);lin.castShadow=true;group.add(lin);
      box(0.4,dh+0.2,0.22,M.brand,x-0.05,(dh+0.2)/2,z-gap/2-0.06,group,false);box(0.4,dh+0.2,0.22,M.brand,x-0.05,(dh+0.2)/2,z+gap/2+0.06,group,false);
      box(0.4,0.22,gap+0.34,M.brand,x-0.05,dh+0.1,z,group,false);box(0.12,0.9,gap-0.1,M.metal,x+0.12,dh-0.45,z,group,false);
      box(0.6,0.5,gap,M.ink,x-0.35,0.25,z,group,false);
      // painted truck bay in front of the door
      const bx=x+bayDir*3.3;[[0,-1.25],[0,1.25]].forEach(([_,dz])=>box(5.6,0.02,0.12,M.lane,bx,0.06,z+dz,group,false));box(0.12,0.02,2.6,M.lane,x+bayDir*6.1,0.06,z,group,false);});}
  function rebuildDoors(){const k=P.doors+"|"+P.shipDoors;if(k===doorKey)return;doorKey=k;
    buildDoorWall(doorWalls.in,-34.4,-23.5,-3,Array.from({length:P.doors},(_,d)=>W(0,inY(d))[1]),WH,-1);
    buildDoorWall(doorWalls.out,-49,14.8,32.2,Array.from({length:P.shipDoors},(_,d)=>W(0,outY(d))[1]),WH,-1);}

  // conveyor to pulper
  // walking-floor conveyor inside receiving: forklifts drop bales on the tail end, it carries them out through the wall
  const WF0=-18.5,WF1=-6.4,WFZ=-11.5,CUTX=-5.2;
  {box(WF1-WF0,0.5,2.2,M.steel,(WF0+WF1)/2,0.25,WFZ);const slatTex=(()=>{const c=document.createElement("canvas");c.width=64;c.height=8;const x=c.getContext("2d");x.fillStyle="#6b7383";x.fillRect(0,0,64,8);x.fillStyle="#3e4552";for(let i=0;i<64;i+=8)x.fillRect(i,0,2,8);const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.repeat.set((WF1-WF0)/1.2,1);return t;})();
    const slats=new THREE.Mesh(new THREE.PlaneGeometry(WF1-WF0,1.9),new StdMat({map:slatTex,roughness:0.7}));slats.rotation.x=-Math.PI/2;slats.position.set((WF0+WF1)/2,0.51,WFZ);scene.add(slats);G3.slats=slatTex;
    [-1.12,1.12].forEach(dz=>box(WF1-WF0,0.6,0.1,M.warn,(WF0+WF1)/2,0.8,WFZ+dz,scene,false));box(0.3,0.9,2.4,M.warn,WF0-0.15,0.45,WFZ,scene,false);}
  // guillotine wire cutter straddling the line just outside the wall
  const cutter=new THREE.Group();cutter.position.set(CUTX,0,WFZ);scene.add(cutter);
  {[-1.35,1.35].forEach(dz=>box(0.45,4.4,0.45,M.brand,0,2.2,dz,cutter));box(0.7,0.7,3.2,M.brand,0,4.6,0,cutter);box(0.9,0.9,0.9,M.ink,0,5.35,0,cutter);
    box(2.2,0.5,2.4,M.steel,0,0.25,0,cutter);box(0.9,0.2,0.9,M.bad,0.8,0.62,1.5,cutter,false);}
  const blade=new THREE.Group();cutter.add(blade);box(0.18,0.9,2.5,M.metal,0,0,0,blade);box(0.06,0.12,2.5,new StdMat({color:0xe8ecf2,metalness:0.9,roughness:0.2}),0,-0.5,0,blade,false);
  const rod=new THREE.Mesh(new CylG(0.1,0.1,1,8),M.metal);cutter.add(rod);
  box(1.4,0.8,1.2,M.ink,CUTX+0.3,0.4,WFZ+2.2);
  const cA=new THREE.Vector3(-4,0.4,-11.5),cB=new THREE.Vector3(13.0,4.3,-13.25),cDir=cB.clone().sub(cA),cLen=cDir.length();
  const belt=new THREE.Mesh(new THREE.BoxGeometry(cLen,0.3,1.6),M.steel);{const o=belt;o.position.copy(cA).add(cB).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),cDir.clone().normalize());o.castShadow=true;scene.add(o);
    [0.25,0.55,0.85].forEach(f=>{const p=cA.clone().lerp(cB,f);box(0.3,p.y,0.3,M.steel,p.x,p.y/2,p.z-0.6);box(0.3,p.y,0.3,M.steel,p.x,p.y/2,p.z+0.6);});}
  const beltBales=graded(new THREE.BoxGeometry(1.15,0.85,1.15),24);
  const baleWires=new THREE.InstancedMesh(new THREE.BoxGeometry(0.04,0.88,1.18),instMat(M.ink),72);scene.add(baleWires);
  const PATH=[[WF0+0.7,0.95,WFZ],[CUTX,0.95,WFZ],[cA.x,cA.y+0.55,cA.z],[cB.x,cB.y+0.55,cB.z]],PLEN=[0];for(let i=1;i<PATH.length;i++)PLEN.push(PLEN[i-1]+Math.hypot(PATH[i][0]-PATH[i-1][0],PATH[i][1]-PATH[i-1][1],PATH[i][2]-PATH[i-1][2]));
  function pathAt(d,out){for(let i=1;i<PATH.length;i++)if(d<=PLEN[i]){const f=(d-PLEN[i-1])/(PLEN[i]-PLEN[i-1]),a=PATH[i-1],b=PATH[i];out.set(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f);return true;}return false;}
  let wfOff=0,chop=0,baleCyc=0;
  // once the wires are cut the bale falls apart into slabs that spread out up the incline and tumble off the head pulley into the tub
  const baleChunks=graded(new THREE.BoxGeometry(0.56,0.28,1.1),150);
  const beltQ=belt.quaternion.clone(),cH=new THREE.Vector3(cDir.x,0,cDir.z).normalize(),hsh=n=>{const x=Math.sin(n*127.1+11.7)*43758.5453;return x-Math.floor(x);};
  const splashed=new Set(),splashRings=[];
  for(let k=0;k<8;k++){const m=new THREE.Mesh(new RingG(0.7,0.95,28),new THREE.MeshBasicMaterial({color:lin0("#d9c3a0"),transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);splashRings.push({m,t:9});}
  const REJ=["#3a6fc9","#f2f0ea","#f2c230","#2a2a2a","#9be0f0","#d23b3b"];
  function splashAt(x,z,gr=0){G3.rejBump(gr);const r=splashRings.find(o=>o.t>1)||splashRings[0];r.t=0;r.m.position.set(x,3.02,z);r.m.visible=true;
    for(let k=0;k<(gr===2?6:gr===1?2:0);k++){const a=Math.random()*6.28;emitA("chip",x,3.1,z,Math.cos(a)*1.4,1.6+Math.random()*1.6,Math.sin(a)*1.4,1.6,0.22+Math.random()*0.14,REJ[Math.floor(Math.random()*REJ.length)],1);}
    for(let k=0;k<7;k++){const a=Math.random()*6.28,sp=0.8+Math.random()*1.6;emitA("drop",x,3.05,z,Math.cos(a)*sp,2.4+Math.random()*2.2,Math.sin(a)*sp,0.8,0.22+Math.random()*0.12,"#8a6440",0.95);}}
  // floating trash on the stock: builds up as low-grade bales go in, slowly pulled out by the ragger and the cleaners
  const flot=[];let rejLvl=0.1;for(let k=0;k<16;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(0.36+Math.random()*0.3,0.04,0.22+Math.random()*0.2),new StdMat({color:lin0(REJ[k%REJ.length]),roughness:0.5}));
    m.userData={r:1.2+Math.random()*2.5,a:Math.random()*6.28,sp:0.6+Math.random()*0.5,th:k/16};m.visible=false;scene.add(m);flot.push(m);}
  G3.rejBump=gr=>{rejLvl=Math.min(1,rejLvl+(gr===2?0.08:gr===1?0.025:0));};
  function splashTick(rdt){rejLvl=Math.max(0.05,rejLvl-rdt*0.01);flot.forEach(m=>{const u=m.userData;m.visible=u.th<rejLvl&&pulpStock.visible&&pulpStock.position.y>2.6;if(!m.visible)return;u.a+=rdt*u.sp*0.6;
      m.position.set(16+Math.cos(u.a)*u.r,2.98,-13.5+Math.sin(u.a)*u.r);m.rotation.y=-u.a*1.3;});splashRings.forEach(o=>{if(o.t>1)return;o.t+=rdt/0.9;const k=Math.min(1,o.t);o.m.scale.setScalar(0.4+1.6*k);o.m.material.opacity=0.75*(1-k);if(o.t>1)o.m.visible=false;});}

  // pulper vat with rotor
  const pulper=new THREE.Group();pulper.position.set(16,0,-13.5);scene.add(pulper);blob(16,-13.5,6.4);blob(34.5,-15,6.6);
  {const v=new THREE.Mesh(new CylG(4.2,4.4,3.4,24,1,true),M.tank);v.position.y=1.7;v.castShadow=true;v.receiveShadow=true;pulper.add(v);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(4.2,0.15,6,28),M.steel);rim.rotation.x=Math.PI/2;rim.position.y=3.4;pulper.add(rim);
    const s=new THREE.Mesh(new CylG(4.05,4.05,0.2,24),M.pulp);s.position.y=2.9;pulper.add(s);}
  const rotor=new THREE.Group();rotor.position.y=3.05;pulper.add(rotor);
  // v3.0.1: the stock swirls in a vortex over the rotor, which sits out of sight on the tub floor
  {const c=document.createElement("canvas");c.width=c.height=256;const x=c.getContext("2d"),C0=128;
    const g=x.createRadialGradient(C0,C0,0,C0,C0,C0);g.addColorStop(0,"rgba(38,24,12,0.95)");g.addColorStop(0.18,"rgba(58,38,20,0.8)");g.addColorStop(0.45,"rgba(90,62,34,0.25)");g.addColorStop(1,"rgba(90,62,34,0)");x.fillStyle=g;x.fillRect(0,0,256,256);
    for(let arm=0;arm<5;arm++){x.beginPath();for(let k=0;k<=60;k++){const t=k/60,r=10+t*112,a=arm*2*Math.PI/5+t*3.6;const px=C0+Math.cos(a)*r,py=C0+Math.sin(a)*r;k?x.lineTo(px,py):x.moveTo(px,py);}
      x.strokeStyle=arm%2?"rgba(196,160,112,0.55)":"rgba(52,34,18,0.45)";x.lineWidth=arm%2?5:7;x.stroke();}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const vx=new THREE.Mesh(new CircG(3.9,48),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
    vx.rotation.x=-Math.PI/2;vx.position.y=-0.03;vx.renderOrder=2;rotor.add(vx);}
  const pulpStock=pulper.children[2];

  // chest tank: glass shell + liquid + target/low rings
  const chest=new THREE.Group();chest.position.set(34.5,0,-15);scene.add(chest);
  // tiled concrete chest, open at the top so you can look in at the stock level
  const tileC=document.createElement("canvas");tileC.width=128;tileC.height=128;{const x=tileC.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,128,128);
    for(let i=0;i<8;i++)for(let j=0;j<8;j++){const v=246-Math.floor(Math.random()*10);x.fillStyle=`rgb(${v},${v+1},${v+4})`;x.fillRect(i*16+1,j*16+1,14,14);}
    x.fillStyle="#c9ced9";for(let i=0;i<=8;i++){x.fillRect(i*16-1,0,2,128);x.fillRect(0,i*16-1,128,2);}}
  const tileOut=new THREE.CanvasTexture(tileC);tileOut.colorSpace=THREE.SRGBColorSpace;tileOut.wrapS=tileOut.wrapT=THREE.RepeatWrapping;tileOut.repeat.set(14,5);
  const tileIn=tileOut.clone();tileIn.needsUpdate=true;tileIn.repeat.set(14,5);
  const chestOut=mat("g-tile",{map:tileOut,roughness:0.6}),chestIn=mat("g-tile",{map:tileIn,roughness:0.5,side:THREE.BackSide});
  const shell=new THREE.Mesh(new CylG(1,1,10,40,1,true),chestOut);shell.position.y=5;shell.castShadow=true;shell.receiveShadow=true;chest.add(shell);
  const shellIn=new THREE.Mesh(new CylG(0.94,0.94,9.9,40,1,true),chestIn);shellIn.position.y=5;chest.add(shellIn);
  const shellRim=new THREE.Mesh(new RingG(0.94,1.02,48),M.steel);shellRim.rotation.x=-Math.PI/2;shellRim.position.y=10.01;chest.add(shellRim);
  const baseRing=new THREE.Mesh(new CylG(1.04,1.04,0.4,40),M.steel);baseRing.position.y=0.2;chest.add(baseRing);
  const bands=[2.5,5,7.5].map(y=>{const b=new THREE.Mesh(new CylG(1.012,1.012,0.12,40,1,true),M.steel);b.position.y=y;chest.add(b);return b;});
  // stock surface inside the chest, with a slow swirl from the agitator
  const swC=document.createElement("canvas");swC.width=swC.height=128;{const x=swC.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,128,128);x.strokeStyle="rgba(0,0,0,.12)";x.lineWidth=3;
    for(let k=0;k<5;k++){x.beginPath();for(let a=0;a<12;a+=0.1){const r=6+a*4.2;x.lineTo(64+Math.cos(a+k*1.26)*r,64+Math.sin(a+k*1.26)*r);}x.stroke();}}
  const swTex=new THREE.CanvasTexture(swC);swTex.colorSpace=THREE.SRGBColorSpace;
  const surfMat=mat("pulp",{map:swTex,roughness:0.35}),surfLow=mat("bad",{map:swTex,roughness:0.35});
  const liquid=new THREE.Mesh(new CircG(0.94,40),surfMat);liquid.rotation.x=-Math.PI/2;chest.add(liquid);
  // agitator bridge across the top
  const bridge=new THREE.Group();chest.add(bridge);
  // level gauge on the side facing the camera: backing plate with a scale, sight glass, fill, target and low marks
  const gauge=new THREE.Group();chest.add(gauge);
  const gsC=document.createElement("canvas");gsC.width=64;gsC.height=512;{const x=gsC.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,64,512);x.fillStyle="#1c2233";
    for(let i=0;i<=20;i++){const y=500-i*24;x.fillRect(i%2?38:30,y,i%2?16:26,2);if(i%4===0){x.font="600 14px system-ui,sans-serif";x.fillText(String(i*5),2,y+5);}}}
  const gsTex=new THREE.CanvasTexture(gsC);gsTex.colorSpace=THREE.SRGBColorSpace;
  const plate=new THREE.Mesh(new THREE.BoxGeometry(1.2,10.2,0.12),[M.steel,M.steel,M.steel,M.steel,new StdMat({map:gsTex,roughness:0.7}),M.steel]);plate.position.set(0,5.1,0);gauge.add(plate);
  const tube=new THREE.Mesh(new CylG(0.2,0.2,9.8,16,1,true),M.glass);tube.position.set(0.25,5.1,0.22);gauge.add(tube);
  const fill=new THREE.Mesh(new CylG(0.15,0.15,1,12),M.liquid);fill.position.set(0.25,0,0.22);gauge.add(fill);
  const tickT=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.12,0.14),M.ok),tickL=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.12,0.14),M.bad);tickT.position.set(0.1,0,0.14);tickL.position.set(0.1,0,0.14);gauge.add(tickT,tickL);
  [0.15,10.05].forEach(y=>{const c=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,0.5),M.steel);c.position.set(0.25,y,0.18);gauge.add(c);});
  const ringT=tickT,ringL=tickL;
  let chestR=0;
