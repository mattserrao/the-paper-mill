  /* ---- v3.0.0: planned outage jobs ----
     Every outage: maintenance technicians change the press felts (the felt-change animation, driven by the outage clock).
     Outage 1: 1st press roll change with a wet-end overhead crane (new rolls staged on cradles the day before).
     Outage 2: forming fabric (wire) change.
     Outage 3: pulper rotor change: the tub is drained, a mobile crane lifts the old rotor and extraction plate out and sets the new ones (staged the day before).
     Outage 4: refiner plate change: a stack of new plates is staged the day before; the doors swing open and the plates are swapped, one refiner at a time.
     All work runs on the outage clock and is finished by ~93% of the 4-hour window. */
  const OV={crew:[],ropes:[],stg:null,lastK:0};
  const sst=v=>v<=0?0:v>=1?1:v*v*(3-2*v),seg=(f,a,b)=>clamp((f-a)/(b-a),0,1),lrp=(a,b,u)=>a+(b-a)*u;
  function outPhase(){const o=S&&S.outg;if(!o||!o.on)return -1;return clamp((S.t-(o.end-OUT.len))/OUT.len,0,1);}
  function pwl(f,xs,ys){if(f<=xs[0])return ys[0];for(let i=1;i<xs.length;i++)if(f<=xs[i])return ys[i-1]+(ys[i]-ys[i-1])*(f-xs[i-1])/(xs[i]-xs[i-1]);return ys[ys.length-1];}
  const CL_Y=[0,0.16,0.44,0.64,1],CL_X={felt:[0.06,0.15,0.62,0.72,0.93],fabric:[0.07,0.16,0.40,0.50,0.86]};
  // cloth-change progress for the outage (null when the outage isn't driving that cloth)
  function outCloth(id){const f=outPhase();if(f<0)return null;if(id==="fabric"&&S.outg.k!==2)return null;const X=CL_X[id];if(f<X[0]||f>X[4]+0.015)return null;return pwl(f,X,CL_Y);}
  G3.outCloth=outCloth;
  const ocM=()=>M.panelWhite||(M.panelWhite=mat("panel"));
  const ENTRY={hall:[65.6,15.4],shop:[56,-18.2]};
  function tech(i,from){let w=OV.crew[i];if(!w){w=worker(techM,ocM());w.visible=false;OV.crew[i]=w;}
    if(!w.visible){const e=ENTRY[from]||ENTRY.hall;w.position.set(e[0],0,e[1]);w.userData.from=from;w.visible=true;}w.userData.used=true;return w;}
  // walk to a spot, then face and act; returns true once there
  function go(w,x,z,act,lx,lz,rdt,now,sp=7,moving="run"){const a=moveP(w,x,z,sp,rdt);if(a){if(lx!=null)face(w,lx,lz,rdt);pose(w,act,now);}else pose(w,moving,now);return a;}
  for(let k=0;k<8;k++){const m=new THREE.Mesh(new CylG(0.05,0.05,1,6),M.ink);m.visible=false;scene.add(m);OV.ropes.push(m);}
  // felt / wire crews: the same choreography the machine crew uses for a cloth change, done by technicians
  function clothCrew(ws,job,rdt,now){if(!job)return;ws.forEach((w,r)=>{let gx,gz,act,lx,lz;
      if(job.id==="fabric"&&(job.ph==="install"||job.ph==="set"||(job.ph==="carry"&&r>=2))){gx=job.x-2.7+r*1.8;gz=BACKZ;
        if(moveP(w,gx,gz,9,rdt)){face(w,gx,zc,rdt);const a=w.rotation.y;
          if(job.ph==="install"&&job.cov<0.995){pose(w,"pull",now);const lz2=zc+CD/2-0.1-job.cov*(CD-0.2),ez=zc-CD/2+0.05;
            rope(OV.ropes[r],w.position.x+Math.cos(a)*0.65,1.3,w.position.z-Math.sin(a)*0.65,gx,3.0,ez);if(lz2>ez+0.05)rope(OV.ropes[r+4],gx,3.0,ez,gx,2.98,lz2);}
          else pose(w,"idle",now);}
        else pose(w,"run",now);return;}
      if(job.ph==="run"||job.ph==="bare"){gx=job.x-3.6+r*2.4;gz=job.hz+(r%2?1.9:-1.2);act=job.ph==="run"?"look":"clean";lx=job.x;lz=job.hz;}
      else if(job.ph==="carry"&&job.id==="fabric"){gx=job.tube[0]+(r?2.7:-2.7);gz=job.tube[1]+(r?0.75:-0.75);act="haul";}
      else if(job.ph==="carry"){gx=job.tube[0]-2.4+r*1.6;gz=job.tube[1]+(r%2?0.75:-0.75);act="haul";}
      else if(job.ph==="set"){gx=job.tube[0]-2.4+r*1.6;gz=job.tube[1]+(r%2?0.9:-0.9);act="clean";lx=job.x;lz=job.tube[1];}
      else{gx=job.x-2.7+r*1.8;gz=13.25;act=job.ph==="seam"?"fix":"rethread";lx=gx;lz=zc;}
      const arrived=moveP(w,gx,gz,job.ph==="carry"?12:9,rdt);
      if(job.ph==="carry"){if(arrived)w.rotation.y=Math.PI;pose(w,arrived?"haul":"run",now);}
      else{if(arrived&&lx!==undefined)face(w,lx,lz,rdt);pose(w,arrived?act:"run",now);}});}

  /* -- wet-end overhead crane (permanent, parked over the headbox end) -- */
  const HC={x:62,z:9.6,hy:11.4,yaw:0,load:null};
  {const RY=12.9;[2.95,16.35].forEach(z=>{box(36.5,0.32,0.4,M.warn,45.9,RY,z,scene,false);for(let x=29;x<=63;x+=8.5)box(0.2,13.4-RY,0.2,M.metal,x,(13.4+RY)/2,z,scene,false);});}
  const hcBridge=new THREE.Group();scene.add(hcBridge);box(0.7,0.7,13.8,M.warn,0,12.5,9.65,hcBridge);[2.95,16.35].forEach(z=>box(1.0,0.45,0.9,M.ink,0,12.95,z,hcBridge,false));
  const hcTrolley=box(1.5,0.55,1.3,M.ink,0,11.95,9.6,hcBridge);
  const hcCable=new THREE.Mesh(new CylG(0.04,0.04,1,6),M.ink);scene.add(hcCable);
  const hcHook=new THREE.Group();scene.add(hcHook);box(0.6,0.55,0.5,M.warn,0,0,0,hcHook,false);
  const hcBeam=new THREE.Group();hcHook.add(hcBeam);box(0.28,0.24,7.0,M.warn,0,-0.62,0,hcBeam,false);
  [-2.9,2.9].forEach(z=>box(0.05,0.62,0.05,M.ink,0,-1.05,z,hcBeam,false));
  [-1.6,1.6].forEach(z=>{const s=new THREE.Mesh(new CylG(0.03,0.03,0.75,5),M.ink);s.position.set(0,-0.35,z*0.5);s.rotation.x=z>0?0.9:-0.9;hcBeam.add(s);});
  // hook point (x,y,z) is the roll centre; the hook block sits 2.2 above it
  function hcSet(x,z,ry,yaw,beam){HC.x=x;HC.z=z;HC.ry=ry;hcBridge.position.x=x;hcTrolley.position.z=z;const hy=ry+2.2;
    hcHook.position.set(x,hy,z);hcBeam.rotation.y=yaw;hcBeam.visible=beam;const top=11.68,L=Math.max(0.05,top-hy-0.27);hcCable.position.set(x,hy+0.27+L/2,z);hcCable.scale.set(1,L,1);}
  hcSet(62,9.6,8.6,0,false);
  /* -- mobile crane (comes in for the pulper job) -- */
  const MCm=new THREE.Group();MCm.visible=false;scene.add(MCm);
  const mcTurret=new THREE.Group(),mcBoom=new THREE.Group(),mcOut=[];
  {box(9,0.9,2.5,M.fork,0,1.15,0,MCm);box(2.2,1.7,2.5,M.fork,3.7,2.3,0,MCm);box(0.08,0.75,2.2,M.wind,4.82,2.6,0,MCm,false);
   [-3.1,-1.7,2.0,3.4].forEach(x=>[-1.2,1.2].forEach(z=>cylZ(0.55,0.42,M.ink,x,0.55,z,14,MCm)));
   [[-3.6,1],[-3.6,-1],[2.6,1],[2.6,-1]].forEach(([x,s])=>{const g=new THREE.Group();g.position.set(x,0.95,s*1.0);MCm.add(g);box(0.35,0.3,1.6,M.warn,0,0,s*0.8,g,false);box(0.16,0.85,0.16,M.ink,0,-0.45,s*1.5,g,false);box(0.7,0.08,0.7,M.ink,0,-0.88,s*1.5,g,false);g.userData.s=s;mcOut.push(g);});
   mcTurret.position.set(-1.4,1.6,0);MCm.add(mcTurret);box(2.8,0.9,2.3,M.fork,0,0.45,0,mcTurret);box(1.0,1.2,0.9,M.wind,0.4,1.4,-0.75,mcTurret,false);box(1.2,0.7,2.0,M.ink,-1.5,0.85,0,mcTurret,false);
   mcBoom.position.set(0.9,1.1,0.25);mcTurret.add(mcBoom);{const g=new THREE.BoxGeometry(1,0.55,0.55);g.translate(0.5,0,0);const b=new THREE.Mesh(g,M.fork);b.castShadow=true;mcBoom.add(b);mcBoom.userData.b=b;
     const g2=new THREE.BoxGeometry(1,0.4,0.4);g2.translate(0.5,0,0);const b2=new THREE.Mesh(g2,M.warn);mcBoom.add(b2);mcBoom.userData.fly=b2;}}
  // v4.1 pass 3: the crane gets its detail back: cab glazing with frames, mirrors, a beacon and exhaust, hazard stripes on the
  // bumpers and counterweight, a boom hoist ram, a sheave head on the boom base, and striped outrigger pads
  {const stripeM=new StdMat({map:texC(64,8,(x)=>{for(let i=0;i<4;i++){x.fillStyle=i%2?"#ffffff":"#e0343c";x.fillRect(i*16,0,16,8);}},true),roughness:0.6});
    box(0.06,0.95,0.08,M.ink,4.85,2.6,-1.08,MCm,false);box(0.06,0.95,0.08,M.ink,4.85,2.6,1.08,MCm,false);box(0.06,0.08,2.24,M.ink,4.85,3.08,0,MCm,false);box(0.06,0.08,2.24,M.ink,4.85,2.14,0,MCm,false);   // window frames
    [-1.0,1.0].forEach(z=>box(0.08,0.32,0.26,M.ink,4.3,2.95,z*1.38,MCm,false));                                                                     // mirrors
    [[2.6,0.6],[-3.2,0.6],[2.6,-0.6],[-3.2,-0.6]].forEach(([x,z])=>box(0.4,0.14,0.1,stripeM,x,0.72,z*2.1,MCm,false));                                  // bumper stripes
    const bcn=new THREE.Mesh(DRV_HEAD,M.beacon);bcn.scale.setScalar(0.14);bcn.position.set(3.7,3.3,0.8);MCm.add(bcn);         // beacon
    const ex=new THREE.Mesh(new CylG(0.08,0.08,1.4,8),M.ink);ex.position.set(2.9,3.4,-0.95);MCm.add(ex);                                                 // exhaust stack
    box(0.3,0.5,2.0,stripeM,-2.1,0.85,0,mcTurret,false);box(1.1,0.08,0.08,M.warn,-0.9,1.3,1.0,mcTurret,false);box(1.1,0.08,0.08,M.warn,-0.9,1.3,-1.0,mcTurret,false);   // counterweight stripe, handrails
    const sheave=new THREE.Mesh(new CylG(0.3,0.3,0.7,12),M.ink);sheave.rotation.x=Math.PI/2;sheave.position.set(0.2,0.2,0);mcBoom.add(sheave);           // sheave head at the boom foot
    const ram=box(2.3,0.2,0.2,M.metal,1.6,-0.5,0,mcBoom,false);ram.rotation.z=0.32;const ramB=box(1.2,0.3,0.3,M.ink,0.9,-0.32,0,mcBoom,false);ramB.rotation.z=0.32;   // hoist ram
    mcOut.forEach(g=>{const pd=g.children[2];if(pd)pd.material=stripeM;});}
  const mcCable=new THREE.Mesh(new CylG(0.04,0.04,1,6),M.ink);mcCable.visible=false;scene.add(mcCable);
  const mcHook=new THREE.Group();mcHook.visible=false;scene.add(mcHook);box(0.5,0.5,0.4,M.warn,0,0,0,mcHook,false);box(0.52,0.18,0.42,M.ink,0,-0.2,0,mcHook,false);
  const _mp=new THREE.Vector3();
  // aim the boom so the hook hangs at (hx,hy,hz); the hook block is 0.9 above the load point
  function mcAim(hx,hy,hz,ext){const yaw0=MCm.rotation.y;mcTurret.getWorldPosition(_mp);const yaw=Math.atan2(-(hz-_mp.z),hx-_mp.x);mcTurret.rotation.y=yaw-yaw0;
    const px=_mp.x+Math.cos(yaw)*0.9,pz=_mp.z-Math.sin(yaw)*0.9,py=_mp.y+1.1,r=Math.max(2,Math.hypot(hx-px,hz-pz)),th=Math.max(hy+4.2,7.5),a=Math.atan2(th-py,r),L=Math.hypot(r,th-py);
    mcBoom.rotation.z=a;mcBoom.userData.b.scale.x=L*0.55*ext+0.01;mcBoom.userData.fly.scale.x=L;const hk=hy+0.9;mcHook.position.set(hx,hk,hz);
    const cl=Math.max(0.05,th-hk-0.25);mcCable.position.set(hx,hk+0.25+cl/2,hz);mcCable.scale.set(1,cl,1);}
  /* -- staged / carried parts -- */
  const shinyM=new StdMat({color:lin0("#dfe5ec"),metalness:0.85,roughness:0.22}),wornM=new StdMat({color:lin0("#6b5a4c"),metalness:0.3,roughness:0.85}),woodM=new StdMat({color:lin0("#a9814f"),roughness:0.85});
  const pressM=press[0].material;
  function mkRoll(m){const r=cylZ(1.05,CD+0.4,m,0,0,0,18);r.visible=false;[-1,1].forEach(s=>cylZ(0.32,0.5,M.ink,0,0,s*(CD/2+0.45),10,r));return r;}
  const R1={oldT:mkRoll(pressM),oldB:mkRoll(pressM),newT:mkRoll(shinyM),newB:mkRoll(shinyM)};
  const cradle=(x,z,h)=>{const g=new THREE.Group();g.position.set(x,0,z);g.visible=false;scene.add(g);[-2.9,2.9].forEach(dx=>{box(0.5,h,1.5,woodM,dx,h/2,0,g);});return g;};
  const T1=[43.9,14.6],T2=[51.4,14.6],D1=[37,3.95],D2=[44.4,3.95],RY1=1.5,RYD=1.2;
  const cradT=[cradle(T1[0],T1[1],0.6),cradle(T2[0],T2[1],0.6)],cradD=[cradle(D1[0],D1[1],0.3),cradle(D2[0],D2[1],0.3)];
  function rotorModel(m,pm){const g=new THREE.Group();g.visible=false;scene.add(g);const pl=new THREE.Mesh(new CylG(1.25,1.25,0.12,24),pm);pl.position.y=0.06;pl.castShadow=true;g.add(pl);
    const hub=new THREE.Mesh(new CylG(0.42,0.5,0.55,16),m);hub.position.y=0.45;hub.castShadow=true;g.add(hub);
    for(let k=0;k<4;k++){const v=box(1.05,0.32,0.18,m,0,0.42,0,g,false);const a=k*Math.PI/2;v.position.set(Math.cos(a)*0.7,0.42,Math.sin(a)*0.7);v.rotation.y=-a;}
    const eye=new THREE.Mesh(new CylG(0.08,0.08,0.7,6),M.ink);eye.position.y=1.0;g.add(eye);return g;}
  const ROT={old:rotorModel(wornM,wornM),neu:rotorModel(shinyM,shinyM),pallet:null};
  ROT.pallet=box(2.6,0.18,2.6,woodM,0,0.09,0,scene);ROT.pallet.visible=false;
  const PAL=[12.6,-6.0],OLDR=[9.0,-6.0],PCX=16,PCZ=-13.5,MCP=[21,-4.6];
  mcPark();   // v3.3.3: the mobile crane is always on site, parked beside the pulper
  const plateG=new CylG(0.75,0.75,0.05,22);
  function stack(x,z,m,n){const g=new THREE.Group();g.position.set(x,0,z);g.visible=false;scene.add(g);box(1.7,0.15,1.7,woodM,0,0.075,0,g);
    const ps=[];for(let k=0;k<n;k++){const p=new THREE.Mesh(plateG,m);p.position.y=0.18+k*0.06;p.rotation.y=k*0.7;g.add(p);ps.push(p);}g.userData.ps=ps;return g;}
  const STK={neu:stack(55.0,-13.6,shinyM,4),used:stack(55.0,-8.8,wornM,4)};
  const carryP=[0,1].map(()=>{const m=new THREE.Mesh(plateG,shinyM);m.visible=false;scene.add(m);return m;});
  function holdPlate(m,w,mat){m.material=mat;m.visible=true;const a=w.rotation.y;m.position.set(w.position.x+Math.cos(a)*0.55,1.15,w.position.z-Math.sin(a)*0.55);m.rotation.set(0,a,Math.PI/2);}
  [hcBridge,hcHook,hcCable,MCm,mcCable,mcHook,ROT.old,ROT.neu,ROT.pallet,STK.neu,STK.used,...Object.values(R1),...cradT,...cradD,pulpStock,rotor,press[0],press[1],...REF_DOORS.map(d=>d.door),...REF_DOORS.map(d=>d.face)].forEach(o=>SM.dyn.add(o));

  /* -- staging the day before: a real-time scene so it reads at any game speed -- */
  function stageWant(){const o=S&&S.outg;if(!o||!o.plan||o.on||!S.season||!S.season.on)return 0;const st=outStart(o.k);return S.t>=st-1140&&S.t<st?o.k:0;}
  function staged(k,v){if(k===1){cradT.forEach(c=>c.visible=v);R1.newT.visible=R1.newB.visible=v;if(v){R1.newT.position.set(T1[0],RY1,T1[1]);R1.newT.rotation.set(0,Math.PI/2,0);R1.newB.position.set(T2[0],RY1,T2[1]);R1.newB.rotation.set(0,Math.PI/2,0);}}
    if(k===3){ROT.pallet.visible=ROT.neu.visible=v;if(v){ROT.pallet.position.set(PAL[0],0.09,PAL[1]);ROT.neu.position.set(PAL[0],0.18,PAL[1]);ROT.neu.scale.setScalar(1);}}
    if(k===4){STK.neu.visible=v;STK.neu.userData.ps.forEach(p=>p.visible=v);}}
  function stageTick(rdt,now){const k=stageWant(),o=S.outg;
    if(!k){if(OV.stg&&!(o&&o.on&&OV.stg.k===o.k))OV.stg=null;return false;}
    if(!OV.stg||OV.stg.k!==k)OV.stg={k,t0:now,done:false};const st=OV.stg,age=(now-st.t0)/1000;
    if(k===2){return false;}
    if(st.gone){return false;}
    const a=tech(4,k===1?"hall":"shop"),b=tech(5,k===1?"hall":"shop");
    if(k===1){// the hall crane lowers each new roll onto its cradle while two techs guide it
      cradT.forEach(c=>c.visible=true);const per=7;
      [[R1.newT,T1,0],[R1.newB,T2,1]].forEach(([r,T,i])=>{const u=clamp((age-1-i*per)/per,0,1);if(u<=0){r.visible=false;return;}r.visible=true;
        const y=lrp(9.4,RY1,sst(seg(u,0.15,0.85)));r.position.set(T[0],y,T[1]);r.rotation.set(0,Math.PI/2,0);if(u<1&&u>0){hcSet(T[0],T[1],y,Math.PI/2,true);}});
      if(age>2*per+1.2)hcSet(lrp(T2[0],62,clamp((age-2*per-1.2)/3,0,1)),9.6,8.6,0,false);
      const cur=age<1+per?T1:T2;go(a,cur[0]-3.9,cur[1]+0.9,"point",cur[0],cur[1],rdt,now);go(b,cur[0]+3.9,cur[1]+0.9,"look",cur[0],cur[1],rdt,now);
      if(age>2*per+4){st.done=true;}}
    if(k===3){// two techs set the pallet with the new rotor and extraction plate by the pulper
      const arr=go(a,PAL[0]-1.6,PAL[1]+1.4,"fix",PAL[0],PAL[1],rdt,now)&go(b,PAL[0]+1.6,PAL[1]+1.4,"fix",PAL[0],PAL[1],rdt,now);
      if(arr&&!st.t1)st.t1=now;const u=st.t1?clamp((now-st.t1)/3500,0,1):0;ROT.pallet.visible=ROT.neu.visible=u>0;
      ROT.pallet.position.set(PAL[0],0.09,PAL[1]);ROT.neu.position.set(PAL[0],0.18,PAL[1]);ROT.neu.scale.setScalar(0.4+0.6*sst(u));if(u>=1&&now-st.t1>5000)st.done=true;}
    if(k===4){// two techs carry the new plates out of the shop one by one and stack them by the refiners
      STK.neu.visible=true;const ps=STK.neu.userData.ps;if(st.n==null){st.n=0;st.trip=[0,0];}
      [a,b].forEach((w,i)=>{if(st.n>=4){go(w,ENTRY.shop[0],ENTRY.shop[1],"idle",null,null,rdt,now,5,"walk");carryP[i].visible=false;return;}
        const out=st.trip[i]%2===0;if(out){carryP[i].visible=false;if(go(w,ENTRY.shop[0]+i*0.8,ENTRY.shop[1]+0.4,"idle",null,null,rdt,now,5,"walk"))st.trip[i]++;}
        else{holdPlate(carryP[i],w,shinyM);if(moveP(w,55.0+(i?0.95:-0.95),-13.6+0.6,4,rdt)){face(w,55,-13.6,rdt);pose(w,"clean",now);st.n++;st.trip[i]++;carryP[i].visible=false;}else pose(w,"haul",now);}});
      ps.forEach((p,j)=>p.visible=j<st.n);if(st.n>=4&&!st.t2)st.t2=now;if(st.t2&&now-st.t2>3000)st.done=true;}
    if(st.done){// walk back and go inside
      let n=0;[a,b].forEach(w=>{const e=ENTRY[w.userData.from]||ENTRY.hall;if(moveP(w,e[0],e[1],5,rdt)){w.visible=false;n++;}else pose(w,"walk",now);w.userData.used=true;});if(n===2)st.gone=true;}
    return true;}

  /* -- the outage itself -- */
  function crewHome(i,rdt,now){const w=OV.crew[i];if(!w||!w.visible||w.userData.used)return;const e=ENTRY[w.userData.from]||ENTRY.hall;if(moveP(w,e[0],e[1],7,rdt))w.visible=false;else pose(w,"run",now);}
  const MVS=[];
  function job1(f,rdt,now){// press roll change in the 1st press: top out, bottom out, new bottom in, new top in
    const TOP=[37,4.45,zc],BOT=[37,2.35,zc],LIFT=9.35;cradT.forEach(c=>c.visible=f<0.62);cradD.forEach(c=>c.visible=true);
    const MV=[[0.15,0.26,R1.oldT,[...TOP,0],[D1[0],RYD,D1[1],Math.PI/2]],[0.26,0.37,R1.oldB,[...BOT,0],[D2[0],RYD,D2[1],Math.PI/2]],
      [0.37,0.49,R1.newB,[T2[0],RY1,T2[1],Math.PI/2],[...BOT,0]],[0.49,0.60,R1.newT,[T1[0],RY1,T1[1],Math.PI/2],[...TOP,0]]];
    press[0].visible=f<0.15||f>=0.60;press[1].visible=f<0.26||f>=0.49;
    R1.oldT.visible=f>=0.15;R1.oldB.visible=f>=0.26;R1.newT.visible=f<0.60;R1.newB.visible=f<0.49;
    let hook=null;
    MV.forEach(([a,b,r,A,B],i)=>{const u=seg(f,a,b);
      if(u<=0){MVS[i]=null;if(r===R1.newT||r===R1.newB){r.position.set(A[0],A[1],A[2]);r.rotation.set(0,A[3],0);}return;}
      if(u>=1){r.position.set(B[0],B[1],B[2]);r.rotation.set(0,B[3],0);return;}
      if(!MVS[i])MVS[i]={x:HC.x,z:HC.z,y:HC.ry};const H0=MVS[i];
      // empty hook rises, travels over, comes down and slings the roll; the roll lifts, turns, travels and is set down
      const q=[seg(u,0,0.08),seg(u,0.08,0.18),seg(u,0.18,0.26),seg(u,0.26,0.4),seg(u,0.4,0.48),seg(u,0.48,0.74),seg(u,0.74,0.95)].map(sst);
      let x=A[0],y=A[1],z=A[2],yw=A[3];
      if(u<0.26){const hy=u<0.08?lrp(H0.y,LIFT,q[0]):u<0.18?LIFT:lrp(LIFT,A[1],q[2]),hx=lrp(H0.x,A[0],q[1]),hz=lrp(H0.z,A[2],q[1]);
        hcSet(hx,hz,hy,A[3],true);r.position.set(A[0],A[1],A[2]);r.rotation.set(0,A[3],0);}
      else{y=lrp(A[1],LIFT,q[3]);yw=lrp(A[3],B[3],q[4]);x=lrp(A[0],B[0],q[5]);z=lrp(A[2],B[2],q[5]);if(u>=0.74)y=lrp(LIFT,B[1],q[6]);
        r.position.set(x,y,z);r.rotation.set(0,yw,0);hcSet(x,z,y,yw,true);}
      hook={x,z};});
    if(f>=0.60){const u1=sst(seg(f,0.60,0.62)),u2=sst(seg(f,0.62,0.67));if(!MVS[9])MVS[9]={x:HC.x,z:HC.z,y:HC.ry};const H0=MVS[9];
      hcSet(lrp(H0.x,62,u2),lrp(H0.z,9.6,u2),lrp(H0.y,8.6,u1),0,f<0.64);}
    // two techs sling and guide each lift from the tending-side aisle, clear of the felt crew
    if(f<0.62){const a=tech(4,"hall"),b=tech(5,"hall"),pick=hook&&hook.z>13;const bx=pick?hook.x:46.5;
      go(a,bx-3.9,16.25,pick?"fix":"look",hook?hook.x:37,hook?hook.z:zc,rdt,now);go(b,bx+3.9,16.25,pick?"fix":"point",hook?hook.x:37,hook?hook.z:zc,rdt,now);}}
  // parked: beside the pulper, boom stowed, outriggers in
  function mcPark(){MCm.visible=true;MCm.position.set(MCP[0],0,MCP[1]);MCm.rotation.y=0;mcTurret.rotation.y=0;mcBoom.rotation.z=0.04;mcBoom.userData.b.scale.x=4.6;mcBoom.userData.fly.scale.x=6.8;
    mcOut.forEach(g=>{g.position.z=g.userData.s*1.0;const lg=g.children[1],pd=g.children[2];lg.scale.y=0.3;lg.position.y=-0.425*0.3;pd.position.y=-0.85*0.3-0.03;});}
  function job3(f,rdt,now){// pulper rotor change with a mobile crane
    MCm.visible=true;
    // v3.3.3: the crane truck lives beside the pulper (it used to drive in past the fog fan and clip it); it just sets up where it is
    MCm.position.set(MCP[0],0,MCP[1]);MCm.rotation.y=0;
    const outr=sst(seg(f,0.08,0.11))*(1-sst(seg(f,0.86,0.9)));
    mcOut.forEach(g=>{g.position.z=g.userData.s*(1.0+outr*1.3);const lg=g.children[1],pd=g.children[2],k=0.3+0.7*outr;lg.scale.y=k;lg.position.y=-0.425*k;pd.position.y=-0.85*k-0.03;});
    // drain and refill
    const lvl=f<0.5?lrp(2.9,0.32,sst(seg(f,0.03,0.16))):lrp(0.32,2.9,sst(seg(f,0.66,0.8)));pulpStock.position.y=lvl;rotor.visible=lvl>2.6;
    ROT.pallet.visible=true;ROT.pallet.position.set(PAL[0],0.09,PAL[1]);ROT.old.visible=true;ROT.neu.visible=lvl<2.75;
    const IN=[PCX,0.22,PCZ],REST=[MCP[0]-3.5,4.2,MCP[1]-1.5];let H=REST;
    if(f<0.16){ROT.old.position.set(...IN);ROT.neu.position.set(PAL[0],0.18,PAL[1]);ROT.neu.visible=true;}
    else if(f<0.38){const u=seg(f,0.16,0.38),q=[seg(u,0,0.25),seg(u,0.25,0.45),seg(u,0.45,0.78),seg(u,0.78,1)].map(sst);ROT.neu.position.set(PAL[0],0.18,PAL[1]);ROT.neu.visible=true;
      if(u<0.25){ROT.old.position.set(...IN);H=[lrp(REST[0],PCX,q[0]),lrp(REST[1],1.3,q[0]),lrp(REST[2],PCZ,q[0])];}
      else{let y=lrp(0.22,5.0,q[1]),x=lrp(PCX,OLDR[0],q[2]),z=lrp(PCZ,OLDR[1],q[2]);if(u>=0.78)y=lrp(5.0,0.02,q[3]);ROT.old.position.set(x,y,z);H=[x,y+1.1,z];}}
    else if(f<0.64){const u=seg(f,0.38,0.64),q=[seg(u,0,0.2),seg(u,0.2,0.38),seg(u,0.38,0.75),seg(u,0.75,1)].map(sst);ROT.old.position.set(OLDR[0],0.02,OLDR[1]);ROT.neu.visible=true;
      if(u<0.2){ROT.neu.position.set(PAL[0],0.18,PAL[1]);H=[lrp(OLDR[0],PAL[0],q[0]),lrp(1.1,1.3,q[0]),lrp(OLDR[1],PAL[1],q[0])];}
      else{let y=lrp(0.18,5.0,q[1]),x=lrp(PAL[0],PCX,q[2]),z=lrp(PAL[1],PCZ,q[2]);if(u>=0.75)y=lrp(5.0,0.22,q[3]);ROT.neu.position.set(x,y,z);H=[x,y+1.1,z];}}
    else{ROT.old.position.set(OLDR[0],0.02,OLDR[1]);ROT.neu.position.set(...IN);const u=sst(seg(f,0.64,0.72));H=[lrp(PCX,REST[0],u),lrp(1.3,REST[1],u),lrp(PCZ,REST[2],u)];}
    MCm.updateMatrixWorld(true);const rig=f>=0.11&&f<0.86;mcHook.visible=mcCable.visible=rig;
    if(rig)mcAim(H[0],H[1],H[2],1);else{mcTurret.rotation.y=0;mcBoom.rotation.z=0.04;mcBoom.userData.b.scale.x=4.6;mcBoom.userData.fly.scale.x=6.8;}
    if(f<0.88){const a=tech(4,"shop"),b=tech(5,"shop");const wk=f>=0.38&&f<0.5?[PAL[0]+2.0,PAL[1]+0.2,PAL[0],PAL[1]]:[PCX+3.4,PCZ+4.3,PCX,PCZ];
      go(a,wk[0],wk[1],f<0.16?"look":"point",wk[2],wk[3],rdt,now);go(b,12.2,-10.6,f<0.16||f>0.64?"look":"fix",PCX,PCZ,rdt,now);}}
  // walk round an open refiner door rather than through it (door lines at z -12.3 and -9.7, open toward -x up to x 56.2)
  function goR(w,x,z,act,lx,lz,rdt,now,sp,mv){for(const d of REF_DOORS){if(d.door.rotation.y===0)continue;const zl=d.z+d.s*1.7;
      if(Math.sign(w.position.z-zl)!==Math.sign(z-zl)&&w.position.x>55.6){return go(w,55.25,zl+(w.position.z<zl?-0.55:0.55),act,lx,lz,rdt,now,sp,mv)&&false;}}
    return go(w,x,z,act,lx,lz,rdt,now,sp,mv);}
  function job4(f,rdt,now){// refiner plates: open the door, unbolt, carry the old plates out and the new ones in, bolt up, close; refiner A then B
    STK.neu.visible=true;const nps=STK.neu.userData.ps,ups=STK.used.userData.ps;let nNew=4,nUsed=0,busy=null;
    carryP[0].visible=carryP[1].visible=false;
    REF_DOORS.forEach((d,i)=>{const u=seg(f,i?0.5:0.06,i?0.9:0.46);
      const open=sst(seg(u,0,0.14))*(1-sst(seg(u,0.88,1)));d.door.rotation.y=d.s*open*1.62;d.face.visible=open>0.08;
      const trip=k=>seg(u,0.30+k*0.25,0.30+(k+1)*0.25);let outN=0,inN=0;for(let k=0;k<2;k++){if(trip(k)>=0.45)outN++;if(trip(k)>=0.5)inN++;}
      nNew-=inN;nUsed+=outN;const t0=trip(0);d.face.material=t0>0.95||u>=0.55?shinyM:wornM;d.face.visible=open>0.08&&!(t0>0.05&&t0<0.95);
      if(u>0&&u<1)busy={d,u,trip};});
    nps.forEach((p,j)=>p.visible=j<nNew);ups.forEach((p,j)=>p.visible=j<nUsed);STK.used.visible=nUsed>0;
    if(f>=0.92)return;
    const a=tech(4,"shop"),b=tech(5,"shop");
    if(!busy){goR(a,56.6,-12.9,"look",58,-14,rdt,now,6,"walk");goR(b,56.6,-9.1,"look",58,-8,rdt,now,6,"walk");return;}
    const {d,u,trip}=busy,fx=d.x-2.05,fz=d.z,aside=d.z-d.s*2.3;
    if(u<0.16||u>0.86){goR(a,57.1,aside,"point",d.x-1,fz,rdt,now,6);goR(b,55.9,aside+d.s*0.7,"look",d.x-1,fz,rdt,now,6);return;}
    if(u<0.30||u>=0.80){goR(a,fx,fz-0.55,"fix",d.x,fz,rdt,now,6);goR(b,fx,fz+0.55,"fix",d.x,fz,rdt,now,6);return;}
    const t=trip(u<0.55?0:1);
    // tech a takes an old plate to the used stack; tech b fetches a new one from the new stack and fits it
    if(t<0.45){holdPlate(carryP[0],a,wornM);goR(a,55.9,-9.7,"clean",55,-8.8,rdt,now,5,"haul");if(carryP[0].visible)holdPlate(carryP[0],a,wornM);}
    else goR(a,fx,fz-0.55,"fix",d.x,fz,rdt,now,6);
    if(t<0.5)goR(b,55.9,-12.8,"clean",55,-13.6,rdt,now,6);
    else if(t<0.95){goR(b,fx,fz+0.55,"fix",d.x,fz,rdt,now,5,"haul");holdPlate(carryP[1],b,shinyM);}
    else goR(b,fx,fz+0.55,"fix",d.x,fz,rdt,now,6);}
  function outageReset(){press[0].visible=press[1].visible=true;Object.values(R1).forEach(r=>r.visible=false);cradT.forEach(c=>c.visible=false);cradD.forEach(c=>c.visible=false);
    hcSet(62,9.6,8.6,0,false);mcHook.visible=mcCable.visible=false;mcPark();ROT.old.visible=ROT.neu.visible=ROT.pallet.visible=false;pulpStock.position.y=2.9;rotor.visible=true;
    STK.neu.visible=STK.used.visible=false;carryP.forEach(m=>m.visible=false);REF_DOORS.forEach(d=>{d.door.rotation.y=0;d.face.visible=false;});}
  let ovActive=false;
  function outageVis(rdt,now){const f=outPhase(),o=S.outg;OV.crew.forEach(w=>{if(w)w.userData.used=false;});OV.ropes.forEach(m=>m.visible=false);
    if(f<0){if(ovActive){ovActive=false;outageReset();}
      const sg=stageTick(rdt,now);if(!sg&&OV.lastK){}
      // keep what was staged in place until the outage starts
      if(!sg&&o&&o.plan&&!o.on){const k=stageWant();if(k)staged(k,true);}
      OV.crew.forEach((w,i)=>crewHome(i,rdt,now));return;}
    if(!ovActive){ovActive=true;outageReset();staged(o.k,true);OV.stg=null;}
    // felts every outage (crew 0-3); wire on outage 2 (crew 4-7)
    const fj=outCloth("felt")!=null&&JOBS.felt?JOBS.felt:null;
    if(fj||f<CL_X.felt[0]){const ws=[0,1,2,3].map(i=>tech(i,"hall"));if(fj&&now-(fj.t||0)<1500)clothCrew(ws,fj,rdt,now);
      else ws.forEach((w,r)=>go(w,34.8-3.6+r*2.4,14.1+(r%2?1.9:-1.2),"look",34.8,14.1,rdt,now));}
    if(o.k===2){const wj=outCloth("fabric")!=null&&JOBS.fabric?JOBS.fabric:null;if(wj||f<CL_X.fabric[0]){const ws=[4,5,6,7].map(i=>tech(i,"hall"));
        if(wj&&now-(wj.t||0)<1500)clothCrew(ws,wj,rdt,now);else ws.forEach((w,r)=>go(w,47.7-3.6+r*2.4,14.1+(r%2?1.9:-1.2),"look",47.7,14.1,rdt,now));}}
    if(o.k===1)job1(f,rdt,now);if(o.k===3)job3(f,rdt,now);if(o.k===4)job4(f,rdt,now);
    OV.crew.forEach((w,i)=>crewHome(i,rdt,now));}
  G3.outageVis=outageVis;
  const TRUCK_FAR=330;

