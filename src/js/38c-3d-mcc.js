  /* ---- v6.10 the MCC (motor control centre) and the electrical tech ----
     A brick-and-block electrical building on the lawn south of the machine hall, the same pop-away roof as the shop:
     inside, the three drive lineups (MCC-1 stock prep, MCC-2 the machine's sectional drives, MCC-3 the winder) and the
     incoming switchgear, a status light on every drive, a desk and a rack of spare drives. Outside on its pad, the
     transformer; a duct bank runs south to the riser pole at the fence, where the overhead feeder from the substation
     comes in (the poles outside the fence are scenery, 42b: LM.feeder). The electrical tech (03f manning, 07i model)
     works from here: drive changeouts at the lineup, motor jobs and ADX rounds out at the machines with a test cart,
     breaker resets after a blackout. The model decides everything; this only shows it. ---- */
  const MCC={x0:4,x1:18,z0:24,z1:31,h:4.4,door:[11,24],desk:[6.4,25.6],riser:[20,62],tx:[20.2,27]};G3.MCC=MCC;
  // where the rounds and the repairs happen at each critical machine (walkable spots, checked against the nav grid), and what to face
  const ASPOT={pulp:[14,-8,16,-14],refA:[56.5,-12.2,60,-14],refB:[57.2,-8.8,60,-8.5],fan:[52,-6.5,51,-9.3],couch:[50,15.2,50,9],pr1:[39,15.2,39,9],pr2:[34.5,15.2,34.5,9],
    dry:[14,16.4,14,9],reel:[-3,16.4,-4,9],wind:[-14.6,14.6,-16,9]};G3.ASPOT=ASPOT;
  // ---- the building ----
  slab(MCC.x0-1,MCC.x1+4,MCC.z0-1.2,MCC.z1+1,M.slab,0.03);box2(MCC.x0,MCC.x1,MCC.z0,MCC.z1,1.2);
  {const W=MCC.x1-MCC.x0,D=MCC.z1-MCC.z0,H=MCC.h,cx=(MCC.x0+MCC.x1)/2,cz=(MCC.z0+MCC.z1)/2,dx=MCC.door[0];
    ribWall(W,H,0.3,cx,H/2,MCC.z1);ribWall(0.3,H,D,MCC.x0,H/2,cz);ribWall(0.3,H,D,MCC.x1,H/2,cz);
    ribWall(dx-0.9-MCC.x0,H,0.3,(MCC.x0+dx-0.9)/2,H/2,MCC.z0);ribWall(MCC.x1-(dx+0.9),H,0.3,(dx+0.9+MCC.x1)/2,H/2,MCC.z0);ribWall(1.8,H-2.4,0.3,dx,2.4+(H-2.4)/2,MCC.z0);
    const rm=mat("brand",{transparent:true,roughness:0.55}),rg=new THREE.Group();scene.add(rg);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(W+0.6,0.35,D+0.6),rm);roof.position.set(cx,H+0.17,cz);roof.castShadow=true;rg.add(roof);
    // rooftop: the drive room's cooling units (the drives make heat)
    const ac=mat("g-metal",{transparent:true,metalness:0.35,roughness:0.5});[7,15].forEach(x=>{const u=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.9,1.4),ac);u.position.set(x,H+0.8,cz+1.2);u.castShadow=true;rg.add(u);});
    rg.userData.mats=[rm,ac];roofs.push(rg);
    // the front, toward the hall: windows, the sign and the door
    const fw=[5.6,8.2,14.2,16.4].map(v=>[MCC.x1-v,1.4,1.4,1.0]);const fs=facade(W,H-0.1,fw,[MCC.x1-13.6,3.05,4.2,0.7,"MCC · ELECTRICAL"],MCC.x1-dx);fs.rotation.y=Math.PI;fs.position.set(cx,(H-0.1)/2,MCC.z0-0.17);scene.add(fs);
    box(1.6,2.3,0.12,M.ink,dx,1.15,MCC.z0-0.05,scene,false);box(2.2,0.12,1.0,M.brand,dx,2.6,MCC.z0-0.55,scene,false);
    // the danger sign by the door
    {const c=document.createElement("canvas");c.width=128;c.height=96;const g=c.getContext("2d");g.fillStyle="#ffffff";g.fillRect(0,0,128,96);g.fillStyle="#c8281e";g.fillRect(0,0,128,30);
      g.fillStyle="#ffffff";g.font="900 22px system-ui,sans-serif";g.textAlign="center";g.fillText("DANGER",64,23);g.fillStyle="#1c2233";g.font="800 15px system-ui,sans-serif";g.fillText("HIGH VOLTAGE",64,55);g.fillText("480 V",64,78);
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.6),new THREE.MeshBasicMaterial({map:t}));p.rotation.y=Math.PI;p.position.set(dx+1.4,1.6,MCC.z0-0.19);scene.add(p);}
    blob(cx,cz,9);}
  // ---- the lineups: a cabinet per drive along the back wall, facing the door; the incoming section at the east end ----
  const LEDM={run:new THREE.MeshBasicMaterial({color:lin0("#3fe08a")}),idle:new THREE.MeshBasicMaterial({color:lin0("#e8b23a")}),fault:new THREE.MeshBasicMaterial({color:lin0("#ff3b2f")}),off:new THREE.MeshBasicMaterial({color:lin0("#4a5262")})};
  const cabM=mat("g-frame",{metalness:0.2,roughness:0.6}),modM={old:M.bad,new:M.ok};
  const CAB={},CABZ=MCC.z1-0.55,dynMark=o=>{if(G3.SM&&G3.SM.dyn)G3.SM.dyn.add(o);else (G3.dynLater||(G3.dynLater=[])).push(o);return o;};
  function mccPlate(txt,x,y,z){const c=document.createElement("canvas");c.width=192;c.height=40;const g=c.getContext("2d");g.fillStyle="#1c2233";g.fillRect(0,0,192,40);g.fillStyle="#ffffff";g.font="800 24px system-ui,sans-serif";g.textAlign="center";g.fillText(txt,96,29);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.25),new THREE.MeshBasicMaterial({map:t}));p.rotation.y=Math.PI;p.position.set(x,y,z);scene.add(p);return p;}
  {let x=MCC.x0+1.0;LINEUPS.forEach(([ln,,tag])=>{const list=ASSETS.filter(A=>A.ln===ln),x0=x;
      list.forEach(A=>{const g=new THREE.Group();g.position.set(x+0.42,0,CABZ);scene.add(g);
        box(0.84,2.3,0.6,cabM,0,1.15,0,g);box(0.84,0.12,0.64,M.ink,0,2.36,0,g,false);
        // the door, hinged on its west edge, with a light and a keypad; the drive module behind it
        const hinge=new THREE.Group();hinge.position.set(-0.4,0,-0.31);g.add(hinge);dynMark(hinge);const dr=box(0.8,2.1,0.04,cabM,0.4,1.1,0,hinge,false);dr.userData.noNav=true;
        const led=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,0.03),LEDM.run);led.position.set(0.62,1.85,-0.03);hinge.add(led);box(0.22,0.16,0.03,M.ink,0.4,1.55,-0.03,hinge,false);
        const mod=dynMark(box(0.6,0.7,0.4,modM.new,0,1.1,0.02,g,false));mod.visible=false;
        CAB[A.id]={g,hinge,led,mod,home:[x+0.42,CABZ],stand:[x+0.42,CABZ-1.25],open:0};x+=0.9;});
      mccPlate(tag,(x0+x-0.08)/2,2.65,CABZ-0.32);x+=0.45;});
    // incoming: the main breaker and the 480 V bus, two wider sections
    [0,1].forEach(k=>{box(1.1,2.4,0.7,cabM,x+0.55+k*1.15,1.2,CABZ+0.05,scene);box(0.18,0.18,0.03,LEDM.run,x+0.85+k*1.15,1.95,CABZ-0.31,scene,false);});
    mccPlate("MAIN 480 V",x+1.1,2.75,CABZ-0.3);CAB.main={stand:[x+1.1,CABZ-1.3]};
    // the desk with the tester's laptop, and the rack of spare drives
    box(1.6,0.08,0.8,M.kraft,MCC.desk[0],0.78,MCC.desk[1]-0.45,scene,false);[-0.7,0.7].forEach(s=>box(0.08,0.74,0.7,M.steel,MCC.desk[0]+s,0.37,MCC.desk[1]-0.45,scene,false));
    box(0.42,0.03,0.3,M.ink,MCC.desk[0],0.84,MCC.desk[1]-0.5,scene,false);
    box(0.5,2.0,1.8,M.steel,MCC.x1-0.6,1.0,MCC.z0+1.4,scene);for(let k=0;k<3;k++)box(0.42,0.36,0.5,M.ok,MCC.x1-0.6,0.5+k*0.62,MCC.z0+1.0+(k%2)*0.6,scene,false);}
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
  function elecBuild(){if(ET.w)return;const w=worker(elecM,M.hatTeam.A,{vest:HIVIS.orange,radio:true});w.position.set(MCC.desk[0],0,MCC.desk[1]);ET.w=w;
    const c=new THREE.Group();box(0.8,0.7,0.5,M.ink,0,0.55,0,c);box(0.5,0.32,0.08,M.ok,0.05,1.06,-0.05,c,false);box(0.06,0.7,0.5,M.steel,-0.43,1.0,0,c,false);
    [[-0.3,-0.2],[-0.3,0.2],[0.3,-0.2],[0.3,0.2]].forEach(([a,b])=>cylZ(0.09,0.06,M.ink,a,0.09,b,8,c));c.userData.load=true;c.position.set(MCC.desk[0]+1.6,0,MCC.desk[1]+0.6);scene.add(c);dynMark(c);ET.cart=c;}
  elecBuild();   // (built with the scene, so the start-up precompile sees it)
  const rlyJob=()=>{if(!S||!S.inc)return null;for(const i of S.inc)if(ENEED(i.id)&&i.eSlot===0)return i;return null;};
  const rlyRnd=(who)=>{const R=S&&S.rel;if(!R||!R.rd)return null;for(const x of R.rd.list)if(x.who===who&&x.st==="go")return x;return null;};
  // where the tech should be now, and doing what: [x, z, faceX, faceZ, pose, what]
  function elecWant(){const j=rlyJob();
    if(j){const p=1-j.left/Math.max(1,j.total);
      if(j.id==="drivefail"&&CAB[j.asset]){const c=CAB[j.asset];return [c.stand[0],c.stand[1],c.home[0],c.home[1],j.eGo?"fix":"run","cab",j,p];}
      if(j.id==="motorfail"&&ASPOT[j.asset]){const s=ASPOT[j.asset];return [s[0],s[1],s[2],s[3],j.eGo?"fix":"run","motor",j,p];}
      return [CAB.main.stand[0],CAB.main.stand[1],CAB.main.stand[0],CABZ,j.eGo?"fix":"run","main",j,p];}
    const x=rlyRnd("e");if(x&&x.a.length){const f=(S.t-x.t0)/Math.max(1,x.len),a=x.a[f<0.5?0:Math.min(x.a.length-1,1)],s=ASPOT[a];if(s)return [s[0]+0.8,s[1]+(s[1]>5?0:0.9),s[2],s[3],"type","adx",null,0];}
    return [MCC.desk[0],MCC.desk[1],MCC.desk[0],MCC.desk[1]-1,"type","home",null,0];}
  function elecUpdate(rdt,now){if(!S)return;elecBuild();const w=ET.w,want=elecWant(),[tx,tz,fx,fz,ps,what,job,p]=want;
    {const m=manNow&&manNow(),T=m&&m.elec&&m.elec.who&&m.elec.who.team,hm=T&&M.hatTeam[T];if(hm&&w.userData.hats[0].material!==hm)for(const h of w.userData.hats)h.material=hm;}
    const sp=4.2*clamp(simRate()/20,1,3.5);
    // the cart goes along on ADX rounds (pushed in front), otherwise it waits by the desk
    const cartOut=what==="adx";
    if(moveP(w,tx,tz,what==="adx"?sp*0.75:sp,rdt)){face(w,fx,fz,rdt);pose(w,ps==="run"?"idle":ps,now);
      if(ps==="fix"&&Math.random()<rdt*4){const a=w.rotation.y;for(let j=0;j<2;j++)emit("spark",w.position.x+Math.cos(a)*0.8,1.3,w.position.z-Math.sin(a)*0.8,R()*3,1.5+Math.random()*2,R()*3,0.3,0.18,"#7fd0ff",1);}}
    else pose(w,what==="adx"?"pull":"walk",now);
    {const c=ET.cart,a=w.rotation.y;if(cartOut){c.position.x=w.position.x+Math.cos(a)*0.95;c.position.z=w.position.z-Math.sin(a)*0.95;c.rotation.y=a;}
      else if(Math.hypot(c.position.x-(MCC.desk[0]+1.6),c.position.z-(MCC.desk[1]+0.6))>0.05){c.position.set(MCC.desk[0]+1.6,0,MCC.desk[1]+0.6);c.rotation.y=0;}}
    // the cabinets: lights follow each drive; the one being changed has its door open and the module coming out and going in
    for(const A of ASSETS){const c=CAB[A.id];if(!c)continue;const st=S.rel?rlyDrvSt(A.id):"run",m=st==="run"?LEDM.run:st==="idle"?LEDM.idle:st==="off"?LEDM.off:LEDM.fault;if(c.led.material!==m)c.led.material=m;
      const busy=job&&job.id==="drivefail"&&job.asset===A.id&&job.eGo,tgt=busy&&p>0.08&&p<0.92?1:0;c.open+=(tgt-c.open)*Math.min(1,rdt*3);c.hinge.rotation.y=-c.open*1.7;
      if(busy&&p>0.2&&p<0.85){c.mod.visible=true;const k=p<0.5?(p-0.2)/0.3:1-(p-0.55)/0.3,kk=clamp(k,0,1);c.mod.material=p<0.5?modM.old:modM.new;c.mod.position.set(-0.55*kk,1.1-0.3*kk,0.02-1.0*kk);}
      else if(c.mod.visible)c.mod.visible=false;}}
  G3.elecUpdate=elecUpdate;
