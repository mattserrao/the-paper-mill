  /* ---- per-frame update from sim state ---- */
  const m4=new THREE.Matrix4(),v3=new THREE.Vector3(),tmp=new THREE.Vector3();
  function lerpAng(a,b,t){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*t;}
  function placeTruck(t,role,rdt){const key=t.id??t;let g=truckMap.get(key);const kind=t.kind||role.kind,L=LANE[kind];
    if(!g){const pool=truckPool[kind];g=pool.find(o=>!o.userData.busy)||(()=>{const o=makeTruck(kind);pool.push(o);return o;})();
      g.userData.busy=true;truckMap.set(key,g);g.position.set(-110,0,L.inZ);g.userData.heading=0;g.userData.phase=null;g.userData.route=[];g.userData.done=false;}
    g.userData.seen=true;g.visible=true;
    const phase=role.leaving?"leave":role.docked?"dock":"q",dz=role.leaving?W(0,t.ty)[1]:role.docked?W(0,kind==="in"?inY(role.d):outY(role.d))[1]:0;
    if(phase!==g.userData.phase){g.userData.route=routeFor(g,kind,phase,t,dz);g.userData.phase=phase;}
    const R2=g.userData.route;
    if(phase==="q"){const qx=L.qMax-(role.k||0)*7;driveTo(g,{x:qx,z:L.inZ},Math.min(16,Math.max(3,Math.abs(qx-g.position.x)*1.2))*TSC(),rdt);}
    else if(R2.length)stepRoute(g,L,rdt);
    else if(phase==="dock"){g.userData.heading=lerpAng(g.userData.heading,Math.PI,Math.min(1,rdt*3));g.rotation.y=g.userData.heading;}
    g.userData.wheels.forEach(w=>w.rotation.z=-(g.userData.spin||0));
    const open=phase==="dock"&&!R2.length;g.userData.doorL.rotation.y=open?-1.4:0;g.userData.doorR.rotation.y=open?1.4:0;
    if(R2.length&&Math.random()<rdt*3){const st=g.userData.stack,a=g.rotation.y,c=Math.cos(a),sn=Math.sin(a);emit("smoke",g.position.x+st[0]*c+st[2]*sn,st[1],g.position.z-st[0]*sn+st[2]*c,0.3,1.4,0,1.4,0.7,"#8c919b",0.45);}
    const frac=g.userData.kind==="in"?t.load/P.truckLoad:t.load/P.truckRolls,n=Math.round(clamp(frac,0,1)*8);g.userData.frac=frac;
    g.userData.cargo.forEach((c,k)=>c.visible=k<n);}
  // reel turn-up: at 100% the sheet transfers to the new spool in the primary arms, the full reel is kicked down the rails,
  // the arms lower the new reel onto the rails, and the crane (strongback) takes the full reel away and brings a new spool
  const sm=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},A120=120*Math.PI/180,A105=105*Math.PI/180;
  function reelUpdate(rdt,rr){const f=clamp(C.simSpeed/30,1,3),dt=rdt*f;
    if(TU.seen<0)TU.seen=S.tot.turnups;
    if(S.tot.turnups>TU.seen){TU.seen=S.tot.turnups;TU.t=0;TU.kick=true;TU.kx=DX-(DR+RM);TU.armHas=false;}   // v2.9.3: silent (its ringing clunk every reel was the repeating "ding")
    TU.t+=dt;const spinV=(S.pm==="run"?1:0)*rdt*6;
    // building reel: in the arms right after turn-up, then on the rails against the drum
    let bx,by,phi=Math.PI;if(TU.t<1.6){phi=A120+(Math.PI-A120)*sm(TU.t/1.6);bx=DX+Math.cos(phi)*(DR+rr);by=DY+Math.sin(phi)*(DR+rr);}else{bx=DX-(DR+rr);by=DY;}
    nipPhi=phi;reelB.set(rr);reelB.g.position.set(bx,by,zc);reelB.spin.rotation.z-=spinV/Math.max(rr,0.5);
    secC.forEach(g=>g.position.x=(TU.t<0.5?DX-(DR+RM):TU.t<1.6?DX-(DR+RM)+(RM-R0)*sm((TU.t-0.5)/1.1):bx)-0.55);
    // kicked full reel rolls to the end stops and waits for the crane
    if(TU.kick){TU.kx=DX-(DR+RM)+(KX-(DX-(DR+RM)))*(1-Math.pow(1-clamp(TU.t/1.0,0,1),2));reelK.g.visible=true;reelK.set(RM);reelK.g.position.set(TU.kx,DY,zc);if(TU.t<1)reelK.spin.rotation.z-=spinV*(1-TU.t)/RM;}else reelK.g.visible=false;
    // primary arms: lower the new reel, go back up empty, take the next spool from the crane, lower it onto the drum
    let a,d;if(TU.t<1.6){a=phi;d=DR+rr;reelN.g.visible=false;}
    else if(!TU.armHas){const k=sm((TU.t-1.6)/0.8);a=Math.PI+(A105-Math.PI)*k;d=DR+rr+(DR+R0+0.35-(DR+rr))*k;reelN.g.visible=false;}
    else{TU.armT=(TU.armT||0)+dt;const k=sm(TU.armT/0.8);a=A105+(A120-A105)*k;d=DR+R0+0.35-0.35*k;reelN.g.visible=true;reelN.set(R0);
      reelN.g.position.set(DX+Math.cos(a)*d,DY+Math.sin(a)*d,zc);if(k>=1)reelN.spin.rotation.z-=spinV/R0;}
    prim.forEach(p=>{p.g.rotation.z=a;p.a.scale.x=d;p.a.position.x=d/2;p.cup.position.x=d;});
    if(S.pm==="run")popeDrum.rotation.z+=rdt*6/DR;
    // empty spools come back to the rack once a reel has gone to the winder
    if(rackSpools.every(m=>!m.g.visible)&&!CR.jobs.some(j=>j.kind==="spool"))rackSpools.forEach(m=>m.g.visible=true);}
  let lastLabel=0;

