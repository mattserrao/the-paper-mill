  /* ---- v6.10 the MCC (motor control centre) and the electrical tech ----
     A brick-and-block electrical building on the lawn south of the machine hall, the same pop-away roof as the shop:
     inside, the three drive lineups (MCC-1 stock prep, MCC-2 the machine's sectional drives, MCC-3 the winder) and the
     incoming switchgear, a status light on every drive, a desk and a rack of spare drives. Outside on its pad, the
     transformer; a duct bank runs south to the riser pole at the fence, where the overhead feeder from the substation
     comes in (the poles outside the fence are scenery, 42b: LM.feeder). The electrical tech (03f manning, 07i model)
     works from here: drive changeouts at the lineup, motor jobs and ADX rounds out at the machines with a test cart,
     breaker resets after a blackout. The model decides everything; this only shows it. ---- */
  const MCC={x0:4,x1:18,z0:24,z1:31,h:4.4,door:[4,27.5],desk:[15.4,29.7],riser:[20,62],tx:[20.2,27]};G3.MCC=MCC;
  // where the rounds and the repairs happen at each critical machine (walkable spots, checked against the nav grid), and what to face
  const ASPOT={pulp:[14,-8,16,-14],refA:[56.5,-12.2,60,-14],refB:[57.2,-8.8,60,-8.5],fan:[52,-6.5,51,-9.3],couch:[50,15.2,50,9],pr1:[39,15.2,39,9],pr2:[34.5,15.2,34.5,9],
    dry:[14,16.4,14,9],reel:[-3,16.4,-4,9],wind:[-14.6,14.6,-16,9]};G3.ASPOT=ASPOT;
  // ---- the building: the lineups stand along the north wall facing the camera; the door is in the west wall; the south
  // wall above knee height lifts off with the roof (like the machine hall's shell), so the room shows in a close cutaway ----
  slab(MCC.x0-2,MCC.x1+4,MCC.z0-1,MCC.z1+1,M.slab,0.03);box2(MCC.x0,MCC.x1,MCC.z0,MCC.z1,1.2);
  {const W=MCC.x1-MCC.x0,D=MCC.z1-MCC.z0,H=MCC.h,cx=(MCC.x0+MCC.x1)/2,cz=(MCC.z0+MCC.z1)/2,dz=MCC.door[1];
    ribWall(W,H,0.3,cx,H/2,MCC.z0);ribWall(0.3,H,D,MCC.x1,H/2,cz);ribWall(W,1.1,0.3,cx,0.55,MCC.z1);
    ribWall(0.3,H,dz-0.9-MCC.z0,MCC.x0,H/2,(MCC.z0+dz-0.9)/2);ribWall(0.3,H,MCC.z1-(dz+0.9),MCC.x0,H/2,(dz+0.9+MCC.z1)/2);ribWall(0.3,H-2.4,1.8,MCC.x0,2.4+(H-2.4)/2,dz);
    const rm=mat("brand",{transparent:true,roughness:0.55}),wm=mat("g-wall",{transparent:true,roughness:0.7}),rg=new THREE.Group();scene.add(rg);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(W+0.6,0.35,D+0.6),rm);roof.position.set(cx,H+0.17,cz);roof.castShadow=true;rg.add(roof);
    const sw=new THREE.Mesh(new THREE.BoxGeometry(W+0.3,H-1.1,0.3),wm);sw.position.set(cx,1.1+(H-1.1)/2,MCC.z1);sw.castShadow=true;sw.receiveShadow=true;rg.add(sw);
    const gl=mat("g-glass",{transparent:true,roughness:0.12,metalness:0.45});[6.5,9.8,13.1,16.0].forEach(x=>{const g=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.0,0.08),gl);g.position.set(x,2.4,MCC.z1+0.17);rg.add(g);});
    // rooftop: the drive room's cooling units (the drives make heat)
    const ac=mat("g-metal",{transparent:true,metalness:0.35,roughness:0.5});[7,15].forEach(x=>{const u=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.9,1.4),ac);u.position.set(x,H+0.8,cz+1.2);u.castShadow=true;rg.add(u);});
    rg.userData.mats=[rm,wm,gl,ac];roofs.push(rg);
    // toward the hall: windows and the sign; the west end: the door, its canopy and the danger sign
    const fw=[2.0,4.6,9.4,12.0].map(v=>[v,1.4,1.4,1.0]);const fs=facade(W,H-0.1,fw.map(([c,...r])=>[W-c,...r]),[W-7.0,3.05,4.6,0.7,"MCC · ELECTRICAL"]);fs.rotation.y=Math.PI;fs.position.set(cx,(H-0.1)/2,MCC.z0-0.17);scene.add(fs);
    const fe=facade(D,H-0.1,[[1.4,1.4,1.2,1.0],[5.7,1.4,1.0,1.0]],null,dz-MCC.z0);fe.rotation.y=-Math.PI/2;fe.position.set(MCC.x0-0.17,(H-0.1)/2,cz);scene.add(fe);
    box(0.12,2.3,1.6,M.ink,MCC.x0-0.05,1.15,dz,scene,false).userData.noNav=true;   /* (an open doorway to the walkers) */box(1.0,0.12,2.2,M.brand,MCC.x0-0.55,2.6,dz,scene,false);
    {const c=document.createElement("canvas");c.width=128;c.height=96;const g=c.getContext("2d");g.fillStyle="#ffffff";g.fillRect(0,0,128,96);g.fillStyle="#c8281e";g.fillRect(0,0,128,30);
      g.fillStyle="#ffffff";g.font="900 22px system-ui,sans-serif";g.textAlign="center";g.fillText("DANGER",64,23);g.fillStyle="#1c2233";g.font="800 15px system-ui,sans-serif";g.fillText("HIGH VOLTAGE",64,55);g.fillText("480 V",64,78);
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.6),new THREE.MeshBasicMaterial({map:t}));p.rotation.y=-Math.PI/2;p.position.set(MCC.x0-0.19,1.6,dz+1.6);scene.add(p);}
    blob(cx,cz,9);}
  // ---- the lineups: a cabinet per drive along the back wall; the incoming section at the east end ----
  const LEDM={run:new THREE.MeshBasicMaterial({color:lin0("#3fe08a")}),idle:new THREE.MeshBasicMaterial({color:lin0("#e8b23a")}),fault:new THREE.MeshBasicMaterial({color:lin0("#ff3b2f")}),off:new THREE.MeshBasicMaterial({color:lin0("#4a5262")})};
  const cabM=mat("g-frame",{metalness:0.2,roughness:0.6}),modM={old:M.bad,new:M.ok};
  let RECT3={};const CAB={},CABZ=MCC.z0+0.55,dynMark=o=>{if(G3.SM&&G3.SM.dyn)G3.SM.dyn.add(o);else (G3.dynLater||(G3.dynLater=[])).push(o);return o;};
  function mccPlate(txt,x,y,z){const c=document.createElement("canvas");c.width=192;c.height=40;const g=c.getContext("2d");g.fillStyle="#1c2233";g.fillRect(0,0,192,40);g.fillStyle="#ffffff";g.font="800 24px system-ui,sans-serif";g.textAlign="center";g.fillText(txt,96,29);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.25),new THREE.MeshBasicMaterial({map:t}));p.position.set(x,y,z);scene.add(p);return p;}
  // v6.10 the power chain inside: the incoming 480 V section (from the transformer outside), then each lineup: its rectifier
  // (AC to ~650 V DC, a grey cabinet with a heat-sink grille) and its drives (inverters) on a copper DC busbar along the top
  const rectM=mat("g-metal",{metalness:0.3,roughness:0.5}),cuM=new StdMat({color:lin0("#c47a3a"),roughness:0.35,metalness:0.6});RECT3={};
  {let x=MCC.x0+0.6;
    LINEUPS.forEach(([ln,,tag])=>{const list=ASSETS.filter(A=>A.ln===ln),x0=x;
      // the rectifier
      box(0.86,2.4,0.68,rectM,x+0.43,1.2,CABZ-0.02,scene);for(let k=0;k<6;k++)box(0.6,0.05,0.03,M.ink,x+0.43,0.5+k*0.12,CABZ+0.33,scene,false);
      const rl=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.03),LEDM.run);rl.position.set(x+0.68,1.95,CABZ+0.34);scene.add(rl);dynMark(rl);
      RECT3[ln]={led:rl,stand:[x+0.43,CABZ+1.3],home:[x+0.43,CABZ]};x+=0.92;
      list.forEach(A=>{const g=new THREE.Group();g.position.set(x+0.34,0,CABZ);g.rotation.y=Math.PI;scene.add(g);
        box(0.68,2.3,0.6,cabM,0,1.15,0,g);box(0.68,0.12,0.64,M.ink,0,2.36,0,g,false);
        // the door, hinged on one edge, with a light and a keypad; the drive (inverter) module behind it
        const hinge=new THREE.Group();hinge.position.set(-0.32,0,-0.31);g.add(hinge);dynMark(hinge);const dr=box(0.64,2.1,0.04,cabM,0.32,1.1,0,hinge,false);dr.userData.noNav=true;
        const led=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,0.03),LEDM.run);led.position.set(0.5,1.85,-0.03);hinge.add(led);box(0.2,0.16,0.03,M.ink,0.32,1.55,-0.03,hinge,false);
        const mod=dynMark(box(0.5,0.7,0.4,modM.new,0,1.1,0.02,g,false));mod.visible=false;
        CAB[A.id]={g,hinge,led,mod,home:[x+0.34,CABZ],stand:[x+0.34,CABZ+1.3],open:0};x+=0.72;});
      // the DC bus: a copper bar over the rectifier and its drives
      box(x-x0-0.06,0.08,0.1,cuM,(x0+x-0.04)/2,2.5,CABZ+0.2,scene,false);
      mccPlate(tag+" · DC",(x0+x-0.04)/2,2.72,CABZ+0.32);x+=0.3;});
    // the incoming 480 V section (from the transformer outside the east wall) at the east end, in clear view (t5: it was by the door)
    [0,1].forEach(k=>{box(0.78,2.4,0.7,cabM,x+0.39+k*0.8,1.2,CABZ-0.05,scene);box(0.16,0.16,0.03,LEDM.run,x+0.6+k*0.8,1.95,CABZ+0.31,scene,false);});
    mccPlate("MAIN 480 V",x+0.8,2.75,CABZ+0.3);CAB.main={stand:[x+0.8,CABZ+1.35]};

    // the desk with the tester's laptop, and the rack of spare drives
    box(1.6,0.08,0.8,M.kraft,MCC.desk[0],0.78,MCC.desk[1]-0.45,scene,false);[-0.7,0.7].forEach(s=>box(0.08,0.74,0.7,M.steel,MCC.desk[0]+s,0.37,MCC.desk[1]-0.45,scene,false));
    box(0.42,0.03,0.3,M.ink,MCC.desk[0],0.84,MCC.desk[1]-0.5,scene,false);
    box(0.5,2.0,1.8,M.steel,MCC.x1-0.6,1.0,MCC.z1-3.3,scene);for(let k=0;k<3;k++)box(0.42,0.36,0.5,M.ok,MCC.x1-0.85,0.5+k*0.62,MCC.z1-3.7+(k%2)*0.6,scene,false);}
  // ---- the transformer on its pad, and the duct bank to the riser pole at the fence ----
  {const [tx,tz]=MCC.tx;slab(tx-1.6,tx+1.6,tz-1.8,tz+1.8,M.slab,0.05);box(2.2,2.2,2.6,M.steel,tx,1.1,tz);for(let k=0;k<6;k++)box(0.3,1.6,0.06,M.metal,tx+1.24,1.0,tz-1+k*0.4,scene,false);
    [-0.6,0,0.6].forEach(o=>{const b=new THREE.Mesh(new CylG(0.09,0.12,0.6,8),M.wind);b.position.set(tx,2.5,tz+o);scene.add(b);});
    box(1.2,0.25,0.25,M.ink,(tx+MCC.x1)/2-0.5,2.6,tz,scene,false);   // the cable bus into the building
    const [rx,rz]=MCC.riser,dm=mat("g-slab",{roughness:0.9});slab(rx-0.5,rx+0.5,tz+1.8,rz,dm,0.045);
    for(let z=tz+6;z<rz-2;z+=8)box(0.14,0.7,0.14,M.warn,rx+0.75,0.35,z,scene,false);
    const pole=new THREE.Mesh(new CylG(0.16,0.2,10,8),M.kraft);pole.position.set(rx,5,rz);pole.castShadow=true;scene.add(pole);
    box(2.6,0.16,0.16,M.kraft,rx,9.4,rz,scene,false);[-1.1,0,1.1].forEach(o=>{const n=new THREE.Mesh(new CylG(0.06,0.08,0.3,6),M.wind);n.position.set(rx+o,9.65,rz);scene.add(n);});
    box(0.18,9,0.18,M.ink,rx+0.24,4.5,rz,scene,false);   // the riser conduit down the pole
    {const c=document.createElement("canvas");c.width=64;c.height=64;const g=c.getContext("2d");g.fillStyle="#f2b807";g.beginPath();g.moveTo(32,4);g.lineTo(62,60);g.lineTo(2,60);g.closePath();g.fill();g.fillStyle="#1c2233";g.font="900 34px system-ui";g.textAlign="center";g.fillText("⚡",32,54);
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.6),new THREE.MeshBasicMaterial({map:t,transparent:true}));p.position.set(tx,1.5,tz-1.32);p.rotation.y=Math.PI;scene.add(p);}}

  // ---- the electrical tech: hard hat by team, orange vest, radio; a test cart for the ADX rounds ----
  const elecM=mat("g-tech");const ET={w:null,cart:null,st:"home",tgt:null,ph:0,job:null};G3.ET=ET;
  // v6.10 arc-flash PPE: an arc-rated suit (navy coverall and hood) with a tinted face shield, put on at the MCC door
  const arcM=new StdMat({color:lin0("#2a3f63"),roughness:0.8,metalness:0.02}),shieldM=new StdMat({color:lin0("#3a2a12"),roughness:0.15,metalness:0.4});
  function elecSuit(on){const w=ET.w,u=w.userData;if(!u||!!ET.suited===on)return;ET.suited=on;
    if(!u.suit0)u.suit0={body:u.body.material,arm:u.armM[0].material};
    u.body.material=on?arcM:u.suit0.body;u.armM.forEach(m=>m.material=on?arcM:u.suit0.arm);u.hood.visible=on;if(u.vestM)u.vestM.visible=!on;}
  function elecBuild(){if(ET.w)return;const w=worker(elecM,M.hatTeam.A,{vest:HIVIS.orange,radio:true});w.position.set(MCC.desk[0],0,MCC.desk[1]);ET.w=w;
    {const u=w.userData,hood=new THREE.Group();const hb=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.42,0.5),arcM);hb.position.set(0,1.1,0);hood.add(hb);
      const sh=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.24,0.38),shieldM);sh.position.set(0.25,1.1,0);hood.add(sh);hood.visible=false;u.torso.add(hood);u.hood=hood;
      u.torso.children.forEach(c=>{if(c.isMesh&&c.material===HIVIS.orange)u.vestM=c;});}
    const c=new THREE.Group();box(0.8,0.7,0.5,M.ink,0,0.55,0,c);box(0.5,0.32,0.08,M.ok,0.05,1.06,-0.05,c,false);box(0.06,0.7,0.5,M.steel,-0.43,1.0,0,c,false);
    [[-0.3,-0.2],[-0.3,0.2],[0.3,-0.2],[0.3,0.2]].forEach(([a,b])=>cylZ(0.09,0.06,M.ink,a,0.09,b,8,c));c.userData.load=true;c.position.set(MCC.desk[0]-1.8,0,MCC.desk[1]+0.6);scene.add(c);dynMark(c);ET.cart=c;}
  elecBuild();   // (built with the scene, so the start-up precompile sees it)
  const rlyJob=()=>{if(!S||!S.inc)return null;for(const i of S.inc)if(ENEED(i.id)&&i.eSlot===0)return i;return null;};
  const rlyRnd=(who)=>{const R=S&&S.rel;if(!R||!R.rd)return null;for(const x of R.rd.list)if(x.who===who&&x.st==="go")return x;return null;};
  // where the tech should be now, and doing what: [x, z, faceX, faceZ, pose, what]
  function elecWant(){const j=rlyJob();
    if(j){const p=1-j.left/Math.max(1,j.total);
      if(j.id==="drivefail"&&CAB[j.asset]){const c=CAB[j.asset];return [c.stand[0],c.stand[1],c.home[0],c.home[1],!j.eGo?"run":j.stage==="inv"||j.stage==="wait"||j.stage==="found"?"type":"fix","cab",j,p];}
      if(j.id==="rectfail"&&RECT3[j.line]){const r=RECT3[j.line];return [r.stand[0],r.stand[1],r.home[0],r.home[1],j.eGo?"fix":"run","rect",j,p];}
      if((j.id==="motorfail"||j.id==="planmot")&&ASPOT[j.asset]){const s=ASPOT[j.asset];return [s[0],s[1],s[2],s[3],j.eGo?"fix":"run","motor",j,p];}
      return [CAB.main.stand[0],CAB.main.stand[1],CAB.main.stand[0],CABZ,j.eGo?"fix":"run","main",j,p];}
    const x=rlyRnd("e");if(x&&x.a.length){const f=(S.t-x.t0)/Math.max(1,x.len),a=x.a[f<0.5?0:Math.min(x.a.length-1,1)],s=ASPOT[a];if(s)return [s[0]+0.8,s[1]+(s[1]>5?0:0.9),s[2],s[3],"type","adx",null,0];}
    return [MCC.desk[0],MCC.desk[1],MCC.desk[0],MCC.desk[1]-1,"type","home",null,0];}
  function elecUpdate(rdt,now){if(!S)return;elecBuild();const w=ET.w,want=elecWant(),[tx,tz,fx,fz,ps,what,job,p]=want;
    {const m=manNow&&manNow(),T=m&&m.elec&&m.elec.who&&m.elec.who.team,hm=T&&M.hatTeam[T];if(hm&&w.userData.hats[0].material!==hm)for(const h of w.userData.hats)h.material=hm;}
    const sp=4.2*clamp(simRate()/20,1,3.5);
    // the cart goes along on ADX rounds (pushed in front), otherwise it waits by the desk
    const cartOut=what==="adx";
    // in and out through the west door (the room is walled off from the walkers' grid): scripted legs between the room,
    // the door and the building's north-west corner, then the walkers' path-finding for the rest of the way
    const q=w.position,dz=MCC.door[1],inR=(x,z)=>x>MCC.x0-0.05&&x<MCC.x1&&z>MCC.z0&&z<MCC.z1,ti=inR(tx,tz),ri=inR(q.x,q.z),
      nearW=q.x<=MCC.x0-0.05&&q.x>MCC.x0-3.2&&q.z>MCC.z0-1.5&&q.z<MCC.z1+1,dIn=[MCC.x0+1.0,dz],dOut=[MCC.x0-1.4,dz],C1=[MCC.x0-1.6,MCC.z0-1.7];
    const line=(x,z)=>{const dx=x-q.x,dzz=z-q.z,d=Math.hypot(dx,dzz);if(d<0.06){q.x=x;q.z=z;return true;}const st=Math.min(d,sp*rdt);q.x+=dx/d*st;q.z+=dzz/d*st;w.rotation.y=Math.atan2(-dzz,dx);return false;};
    const onDoor=Math.abs(q.z-dz)<0.08&&q.x>MCC.x0-1.45&&q.x<MCC.x0+1.05;let scripted=true;
    const donning=()=>{if(!ET.donT)ET.donT=now;w.rotation.y=Math.PI;if(now-ET.donT<1800){pose(w,(((now-ET.donT)/450)|0)%2?"pull":"inspect",now);return true;}ET.donT=0;return false;};
    // already inside when an MCC job comes in (paperwork at the desk): the suit goes on where he stands; back at the desk it comes off
    if(ti&&ri){const mj=what==="cab"||what==="rect"||what==="main";if(mj!==!!ET.suited){if(!donning())elecSuit(mj);else{w.userData.wp=null;return elecLights(job,p,rdt);}}}
    if(ti&&!ri){if(onDoor&&!ET.suited&&Math.abs(q.x-dOut[0])<0.08){if(!donning())elecSuit(true);else{w.userData.wp=null;return elecLights(job,p,rdt);}}   // (at the door: the suit and hood go on)
      if(onDoor)line(dIn[0],dIn[1]);else if(nearW)line(dOut[0],dOut[1]);else scripted=false;}
    else if(!ti&&ri&&ET.suited&&onDoor&&Math.abs(q.x-dIn[0])<0.08){if(!donning())elecSuit(false);else return elecLights(job,p,rdt);}   // (and come off on the way out)
    else if(!ti&&ri){if(onDoor)line(dOut[0],dOut[1]);else line(dIn[0],dIn[1]);}
    else if(!ti&&nearW){if(onDoor&&q.x>dOut[0]+0.05)line(dOut[0],dOut[1]);else line(C1[0],C1[1]);}
    else scripted=false;
    if(scripted){w.userData.wp=null;w.userData.wpKey=null;pose(w,"walk",now);}
    else if(ti&&!ri&&moveP(w,C1[0],C1[1],sp,rdt)){q.x=C1[0]+0.01;q.z=C1[1]+0.4;}   // (back from a job: to the corner, then the scripted legs)
    else if(ti&&!ri)pose(w,"walk",now);
    else if(moveP(w,tx,tz,what==="adx"?sp*0.75:sp,rdt)){face(w,fx,fz,rdt);pose(w,ps==="run"?"idle":ps,now);
      if(ps==="fix"&&Math.random()<rdt*4){const a=w.rotation.y;for(let j=0;j<2;j++)emit("spark",w.position.x+Math.cos(a)*0.8,1.3,w.position.z-Math.sin(a)*0.8,R()*3,1.5+Math.random()*2,R()*3,0.3,0.18,"#7fd0ff",1);}}
    else pose(w,what==="adx"?"pull":"walk",now);
    {const c=ET.cart,a=w.rotation.y;if(cartOut){c.position.x=w.position.x+Math.cos(a)*0.95;c.position.z=w.position.z-Math.sin(a)*0.95;c.rotation.y=a;}
      else if(Math.hypot(c.position.x-(MCC.desk[0]-1.8),c.position.z-(MCC.desk[1]+0.6))>0.05){c.position.set(MCC.desk[0]-1.8,0,MCC.desk[1]+0.6);c.rotation.y=0;}}
    elecLights(job,p,rdt);}
  // the cabinets: lights follow each drive and rectifier; the drive being replaced has its door open and the module coming out and going in
  function elecLights(job,p,rdt){
    for(const [ln] of LINEUPS){const r=RECT3[ln];if(!r)continue;const m=outOn()?LEDM.off:rlyBlack()||rlyArc()?LEDM.off:rlyRectDown(ln)?LEDM.fault:LEDM.run;if(r.led.material!==m)r.led.material=m;}
    for(const A of ASSETS){const c=CAB[A.id];if(!c)continue;const st=S.rel?rlyDrvSt(A.id):"run",m=st==="run"?LEDM.run:st==="idle"?LEDM.idle:st==="off"||st==="lock"?LEDM.off:st==="nodc"?LEDM.off:LEDM.fault;if(c.led.material!==m)c.led.material=m;
      const busy=job&&job.id==="drivefail"&&job.asset===A.id&&job.eGo&&job.stage!=="reset",tgt=busy&&p>0.08&&p<0.92?1:0;c.open+=(tgt-c.open)*Math.min(1,rdt*3);c.hinge.rotation.y=-c.open*1.7;
      if(busy&&job.stage==="repl"&&p>0.2&&p<0.85){c.mod.visible=true;const k=p<0.5?(p-0.2)/0.3:1-(p-0.55)/0.3,kk=clamp(k,0,1);c.mod.material=p<0.5?modM.old:modM.new;c.mod.position.set(-0.55*kk,1.1-0.3*kk,0.02-1.0*kk);}
      else if(c.mod.visible)c.mod.visible=false;}}
  G3.elecUpdate=elecUpdate;G3.elecSuit=on=>elecSuit(on);
