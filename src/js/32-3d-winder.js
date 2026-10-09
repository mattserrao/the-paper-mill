  /* ---- winder, waiting reels, roof trusses ---- */
  const paperDS=basic("paperc",{side:THREE.DoubleSide});
  slab(-29,-6,-2.5,3,M.slab,0.03);
  const wd=new THREE.Group();wd.position.set(-18.7,0,zc);scene.add(wd);
  [-2.7,2.7].forEach(z=>{box(0.5,3.8,0.5,M.steel,-2.6,1.9,z,wd);box(0.5,3.8,0.5,M.steel,3.4,1.9,z,wd);box(6.5,0.4,0.5,M.steel,0.4,3.9,z,wd);});
  const unwind=cylZ(1,4.8,M.paper,2.6,2.4,0,22,wd);cylZ(0.22,5.8,M.steel,2.6,2.4,0,8,wd);
  const drums=[cylZ(0.5,5,M.metal,-1.3,0.75,0,12,wd),cylZ(0.5,5,M.metal,-2.4,0.75,0,12,wd)];
  // v2.9.7: the winder builds ONE roll at a time (the sim's roll), the same size as the rolls on the conveyor
  const setRolls=[cylZ(1,1.4,M.paper,-1.85,1.75,0,24,wd)];
  // upender: a hinged plate at the head of the roll conveyor that tips each roll from lying down to standing up
  const UPX=-22.9,UPZ=zc+0.7,UPY=0.5,UPC=1.32;
  const upender=new THREE.Group();upender.position.set(UPX,UPY,UPZ);scene.add(upender);
  box(1.5,0.08,1.45,M.steel,0,0.04,-0.72,upender,false);box(1.5,1.1,0.08,M.steel,0,0.55,0.0,upender,false);
  box(0.25,0.5,0.25,M.ink,-0.9,-0.25,0,scene,false);
  const web=new THREE.Mesh(new THREE.PlaneGeometry(4.6,4.6),paperDS);web.rotation.x=-Math.PI/2;web.position.set(0.4,2.2,0);wd.add(web);
  box(1.2,1.2,0.8,M.steel,0,0.6,4.3,wd);box(1.1,0.5,0.1,M.robot,0,1.25,3.95,wd,false);
  const SPR={x:-13.4,z:3.6};[-2.2,2.2].forEach(dz=>{});[SPR.z-ZJ+0.4,SPR.z+ZJ-0.4].forEach(()=>{});
  const rackSpools=[0,1,2].map(k=>{const m=spoolModel(scene);m.g.position.set(SPR.x-k*1.2,0.75,SPR.z+0.6);m.set(R0);return m;});
  [SPR.x-1.2].forEach(x=>{box(3.4,0.3,0.4,M.steel,x,0.35,SPR.z+0.6-ZJ,scene);box(3.4,0.3,0.4,M.steel,x,0.35,SPR.z+0.6+ZJ,scene);});
  const parked=[0,1,2,3].map(k=>{const g=new THREE.Group();g.position.set(-11.8-k*4.1,0,-0.2);scene.add(g);
    box(0.35,1.1,4.6,M.steel,-1.3,0.55,0,g);box(0.35,1.1,4.6,M.steel,1.3,0.55,0,g);cylZ(2,5.2,M.paper,0,2.15,0,22,g);cylZ(0.22,6.2,M.steel,0,2.15,0,8,g);return g;});
  // overhead crane: carries full reels from the reel to storage and from storage to the winder unwind
  const CR={x:-8,z:zc,y:9.6,jobs:[],j:null,t:0,hidePark:0,hideUnwind:false,lastTurn:-1,lastBuf:0,lastPark:0};
  const crane=new THREE.Group();scene.add(crane);
  {[-2.4,13.4].forEach(z=>{box(21.4,0.35,0.4,M.warn,-15.9,11.4,z,scene,false);for(let x=-26;x<=-6;x+=10)box(0.2,1.6,0.2,M.metal,x,12.2,z,scene,false);});}
  const crBridge=new THREE.Group();scene.add(crBridge);box(0.7,0.7,16.4,M.warn,0,11,5.5,crBridge);box(0.9,0.5,0.9,M.ink,0,11.6,-2.4,crBridge,false);box(0.9,0.5,0.9,M.ink,0,11.6,13.4,crBridge,false);
  const crTrolley=box(1.6,0.7,1.4,M.ink,0,10.45,0,crBridge);
  const crCable=new THREE.Mesh(new CylG(0.04,0.04,1,6),M.ink);scene.add(crCable);
  // reel strongback: rigid lifting beam longer than the spool, fixed legs ending in J-hooks that cradle the journals
  const ZH=CD/2+0.9,SB=0.8+RM+0.6;
  const crHook=new THREE.Group();scene.add(crHook);
  {box(0.7,0.6,0.55,M.warn,0,0.25,0,crHook,false);cylZ(0.24,0.6,M.ink,0,0.3,0,12,crHook);
   [-1.2,1.2].forEach(z=>{const a=new THREE.Vector3(0,-0.2,0),b=new THREE.Vector3(0,-0.7,z),d=b.clone().sub(a);const r=new THREE.Mesh(new CylG(0.035,0.035,d.length(),6),M.ink);r.position.copy(a).add(b).multiplyScalar(0.5);r.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());crHook.add(r);});
   box(0.45,0.07,2*ZH+0.4,M.warn,0,-0.75,0,crHook,false);box(0.45,0.07,2*ZH+0.4,M.warn,0,-1.1,0,crHook,false);box(0.09,0.32,2*ZH+0.4,M.warn,0,-0.92,0,crHook,false);
   [-ZH,ZH].forEach(z=>{box(0.32,SB-1.1,0.2,M.warn,0,-(1.1+SB)/2,z,crHook,false);box(0.85,0.16,0.28,M.ink,0.05,-SB-0.32,z,crHook,false);box(0.14,0.5,0.28,M.ink,0.42,-SB-0.1,z,crHook,false);});}
  const carried=spoolModel(crHook);carried.g.position.y=-SB;carried.g.visible=false;
  const UNW=[-16.1,2.4,zc],REELP=[KX,DY,zc],parkP=k=>[-11.8-k*4.1,2.15,-0.2],SPOOLP=()=>[SPR.x-Math.max(0,rackSpools.filter(m=>m.g.visible).length-1)*1.2,0.75,SPR.z+0.6],ARMP=()=>[DX+Math.cos(105*Math.PI/180)*(DR+R0+0.35),DY+Math.sin(105*Math.PI/180)*(DR+R0+0.35),zc];
  function craneUpdate(rdt){const nPark=Math.max(0,reelsAtWinder()-1);
    if(CR.lastTurn<0){CR.lastTurn=S.tot.turnups;CR.lastPark=nPark;}
    // v2.9.5: a turn-up and a stored reel going to the unwind can land in the same frame (fast game speeds): handle both,
    // never one or the other, so the storage rail always matches the sim
    let parksAdded=0;
    if(S.tot.turnups>CR.lastTurn){const n=Math.min(2,S.tot.turnups-CR.lastTurn);CR.lastTurn=S.tot.turnups;
      for(let i=0;i<n;i++){if(i===0&&CR.lastBuf<0.3){CR.jobs.push({a:REELP,b:UNW,kind:"unw",fromReel:true,delay:0.8});CR.hideUnwind=true;}
        else{CR.jobs.push({a:REELP,b:parkP(Math.max(0,nPark-1)),kind:"park",fromReel:true,delay:0.8});parksAdded++;}}
      CR.jobs.push({a:SPOOLP(),b:ARMP(),kind:"spool"});}
    {const moved=Math.min(2,CR.lastPark+parksAdded-nPark);for(let i=0;i<moved;i++)if(S.winderBuf>0.3){CR.jobs.unshift({a:parkP(nPark+i),b:UNW,kind:"unw",fromPark:true});CR.hideUnwind=true;}}
    CR.lastPark=nPark;CR.lastBuf=S.winderBuf;
    while(CR.jobs.length>3){const j=CR.jobs.shift();if(j.fromPark)CR.extraPark=Math.max(0,(CR.extraPark||0)-1);if(j.kind==="park")CR.hidePark=Math.max(0,CR.hidePark-1);if(j.kind==="spool"){TU.armHas=true;TU.armT=9;}if(j.fromReel)TU.kick=false;}
    if(!CR.j&&!CR.jobs.length&&TU.t>4&&!TU.armHas){TU.armHas=true;TU.armT=9;}
    if(!CR.j&&CR.jobs.length){CR.j=CR.jobs.shift();CR.t=0;CR.j.s=[CR.x,CR.z];}
    const per=P.jumbo/Math.max(5,S.rates.prod||30)*60/Math.max(1,C.simSpeed),T=clamp(per*0.25,0.6,4)*(CR.jobs.length?0.7:1);   // v2.9.5: each reel makes up to 3 crane moves, so a move must take well under a third of a reel
    if(CR.j&&rdt>0&&(CR.j.delay||0)>0){CR.j.delay-=rdt;}
    else if(CR.j&&rdt>0){const j=CR.j;CR.t+=rdt/T;const u=CR.t,L=(a,b,k)=>a+(b-a)*clamp(k,0,1),hi=10.0;let x,z,y,on=false;
      if(u<0.2){x=L(j.s[0],j.a[0],u/0.2);z=L(j.s[1],j.a[2],u/0.2);y=hi;}
      else if(u<0.3){x=j.a[0];z=j.a[2];y=L(hi,j.a[1]+SB,(u-0.2)/0.1);}
      else if(u<0.4){x=j.a[0];z=j.a[2];y=L(j.a[1]+SB,hi,(u-0.3)/0.1);on=true;}
      else if(u<0.75){const k=(u-0.4)/0.35;x=L(j.a[0],j.b[0],k);z=L(j.a[2],j.b[2],k);y=hi;on=true;}
      else if(u<0.87){x=j.b[0];z=j.b[2];y=L(hi,j.b[1]+SB,(u-0.75)/0.12);on=true;}
      else{x=j.b[0];z=j.b[2];y=L(j.b[1]+SB,hi,(u-0.87)/0.13);}
      carried.g.visible=on;carried.set(j.kind==="spool"?R0:RM);
      if(u>=0.3&&!j.picked){j.picked=true;if(j.fromPark)CR.extraPark=Math.max(0,(CR.extraPark||0)-1);if(j.kind==="spool"){const m=rackSpools.filter(m=>m.g.visible).pop();if(m)m.g.visible=false;}else if(j.fromReel)TU.kick=false;}
      if(u>=0.87&&!j.dropped){j.dropped=true;if(j.kind==="park")CR.hidePark=Math.max(0,CR.hidePark-1);else if(j.kind==="spool"){TU.armHas=true;TU.armT=0;}else CR.hideUnwind=false;}
      CR.x=x;CR.z=z;CR.y=y;if(u>=1)CR.j=null;}
    else if(!CR.j)carried.g.visible=false;
    if(!CR.j&&!CR.jobs.length){CR.hideUnwind=false;CR.hidePark=0;CR.extraPark=0;}
    crBridge.position.x=CR.x;crTrolley.position.z=CR.z;crHook.position.set(CR.x,CR.y,CR.z);
    crCable.position.set(CR.x,(10.1+CR.y+0.55)/2,CR.z);crCable.scale.y=Math.max(0.1,10.1-(CR.y+0.55));
    return nPark;}
  {const t=new THREE.Group();scene.add(t);
    for(let x=-24;x<=56;x+=16)box(0.2,0.25,13.4,M.metal,x,13,9.3,t,false);
    box(80.4,0.25,0.2,M.metal,16,13,2.6,t,false);for(let x=-24;x<=56;x+=16)box(0.22,13,0.22,M.metal,x,6.5,2.6,t,false);}
  box(2.2,0.06,2.2,M.ink,-12,0.06,15.6,scene,false);   // broke hole by the winder

