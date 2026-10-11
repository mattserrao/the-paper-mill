  // ---- beater (off-spec) rolls: staged in a bay in the warehouse, trucked round to receiving and sent back up the line ----
  // The beater truck has its own side-loading spots so it never fights the sim's trucks for a door:
  // a door in the warehouse south wall (outbound road side) and a door in the receiving south wall by the walking floor.
  const BEAT={seen:null,bay:[],line:[],carry:0};G3.BEAT=BEAT;
  const initCol=im=>{const c=new THREE.Color(1,1,1);for(let k=0;k<im.instanceMatrix.count;k++)im.setColorAt(k,c);};
  const bayMesh=new THREE.InstancedMesh(rollGeo,ROLLC(),20);initCol(bayMesh);bayMesh.castShadow=true;scene.add(bayMesh);bayMesh.count=0;
  const bayPos=k=>[-36.6+(k%10)*1.15,15.75];
  const WDOOR=-39.6,RDOOR=-9.5;
  slab(-49,-36.5,11.2,13.8,M.asphalt,0.021);slab(-36,-5,-2.6,1.2,M.asphalt,0.021);
  [[WDOOR,14.62,0],[RDOOR,-3.18,0]].forEach(([x,z])=>{box(2.4,3.0,0.08,M.ink,x,1.5,z,scene,false);box(2.7,0.2,0.12,M.brand,x,3.08,z,scene,false);[-1,1].forEach(sd=>box(0.14,3.1,0.12,M.brand,x+sd*1.27,1.55,z,scene,false));});
  const BT={g:null,st:"away",t:20,legs:[],cargo:[],unl:0};G3.BT=BT;
  const lineMesh=new THREE.InstancedMesh(new CylG(0.5,0.5,1.15,16),ROLLC(),10);initCol(lineMesh);lineMesh.castShadow=true;scene.add(lineMesh);lineMesh.count=0;
  const _bc=new THREE.Color(),_bq=new THREE.Quaternion(),_bz=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0));
  let rfork=null;
  function btTruck(){const g=makeTruck("out");g.userData.cargo.forEach(c=>{c.material=[new StdMat({roughness:0.8}),M.rollCap,M.rollCap];c.visible=false;});g.visible=false;return g;}
  function bayDraw(){bayMesh.count=Math.min(20,BEAT.bay.length);BEAT.bay.slice(0,20).forEach((c,k)=>{const [x,z]=bayPos(k%10);m4.makeTranslation(x,0.74+Math.floor(k/10)*1.42,z);bayMesh.setMatrixAt(k,m4);bayMesh.setColorAt(k,_bc.set(c));});
    bayMesh.instanceMatrix.needsUpdate=true;if(bayMesh.instanceColor)bayMesh.instanceColor.needsUpdate=true;}
  function cargoDraw(){if(!BT.g)return;BT.g.userData.cargo.forEach((c,k)=>{c.visible=k<BT.cargo.length;if(c.visible)c.material[0].color.set(BT.cargo[k]);});}
  function btGo(legs,st){BT.legs=legs;BT.st=st;}
  function beaterUpdate(rdt){if(rdt<=0)return;
    const per=P.jumbo/8,made=Math.floor((S.tot.beater||0)/per);if(BEAT.seen===null)BEAT.seen=made;
    if(made>BEAT.seen){const RV=G3.rollVis;for(let k=0;k<Math.min(4,made-BEAT.seen);k++)if(RV)RV.list.push({d:-3.2-k*1.5,spin:0,col:"#"+dyeReel.color.clone().convertLinearToSRGB().getHexString()});BEAT.seen=made;}
    if(!BT.g)BT.g=btTruck();const g=BT.g,u=g.userData;
    // drive the current list of legs (rev = backing up)
    if(BT.legs.length){const w=BT.legs[0];if(driveTo(g,w,(w.rev?3:8)*TSC(),rdt))BT.legs.shift();u.wheels.forEach(wh=>wh.rotation.z=-(u.spin||0));
      if(Math.random()<rdt*3){const st=u.stack,a=g.rotation.y,c=Math.cos(a),sn=Math.sin(a);emit("smoke",g.position.x+st[0]*c+st[2]*sn,st[1],g.position.z-st[0]*sn+st[2]*c,0.3,1.4,0,1.4,0.7,"#8c919b",0.45);}
      if(BT.legs.length)return;}
    const side=open=>{u.doorL.rotation.y=open?-1.4:0;u.doorR.rotation.y=open?1.4:0;};
    if(BT.st==="away"){BT.t-=rdt*TSC()/3;if(BEAT.bay.length>=4&&BT.t<=0){BT.cargo=[];cargoDraw();g.visible=true;g.position.set(-150,0,12.9);u.heading=0;g.rotation.y=0;
        btGo([{x:-60,z:12.9},{x:-50,z:12.95},{x:WDOOR+1.05,z:12.95}],"toShip");log("Truck in to collect beater rolls for repulping","");}}
    else if(BT.st==="toShip"){BT.st="load";}
    else if(BT.st==="load"){side(false);if((!BEAT.bay.length&&!BEAT.carry)||BT.cargo.length>=8){btGo([{x:-58,z:12.9,rev:true},{x:-64,z:12.0},{x:-150,z:12.0,fast:true}],"leaving1");}}
    else if(BT.st==="leaving1"){g.visible=false;BT.t=5;BT.st="transit";}
    else if(BT.st==="transit"){BT.t-=rdt*TSC()/3;if(BT.t<=0){g.visible=true;g.position.set(-150,0,-2.6);u.heading=0;g.rotation.y=0;btGo([{x:-38,z:-2.6},{x:-31,z:0},{x:RDOOR+1.05,z:0}],"toRecv");}}
    else if(BT.st==="toRecv"){BT.st="unload";BT.unl=0;}
    else if(BT.st==="unload"){if(!BT.cargo.length&&!BT.unl)btGo([{x:-30,z:0,rev:true},{x:-37,z:-2.4,rev:true},{x:-44,z:-4.5},{x:-150,z:-4.5,fast:true}],"leaving2");}
    else if(BT.st==="leaving2"){g.visible=false;BT.st="away";BT.t=30;}
    // receiving clamp: lift each roll off the truck's side, through the door, onto the walking floor
    if(!rfork){rfork=clamp3(M.ok);rfork.visible=false;rfork.userData.load.material=[new StdMat({roughness:0.8}),M.rollCap,M.rollCap];rfork.userData.job=null;rfork.position.set(RDOOR,0,-5);}
    {const f=rfork,J=f.userData;f.visible=BT.st==="unload"||!!J.job||!!(J.back&&J.back.length);
      if(!J.job&&!(J.back&&J.back.length)&&BT.st==="unload"&&BT.cargo.length){J.job={pts:[[RDOOR,-4.5],[RDOOR,-1.95]],i:0,ph:0};}
      if(J.job){const j=J.job,p=j.pts[j.i];f.userData.load.visible=j.ph===1;
        if(moveVeh(f,p[0],p[1],3.5*TSC(),rdt)){j.i++;if(j.i>=j.pts.length){
          if(j.ph===0){j.col=BT.cargo.pop();cargoDraw();BT.unl=1;J.load.material[0].color.set(j.col||"#fff");j.ph=1;j.i=0;j.pts=[[RDOOR,-3.2],[RDOOR,-9.3]];}
          else{BEAT.line.push({d:RDOOR-(WF0+0.7),col:j.col});J.job=null;BT.unl=0;J.back=[[RDOOR,-5]];}}}}
      else if(J.back&&J.back.length){f.userData.load.visible=false;if(moveVeh(f,J.back[0][0],J.back[0][1],3.5*TSC(),rdt))J.back.shift();}}
    // beater rolls ride the walking floor and the incline into the pulper
    const run=S.rates.feed>0.3,sp=run?Math.min(2.2,0.35+S.rates.feed*0.03):0.5,LEND=PLEN[PLEN.length-1];let n=0;
    BEAT.line.forEach(r=>{r.d+=rdt*sp;});
    BEAT.line=BEAT.line.filter(r=>{if(r.d>LEND+0.6){splashAt(cB.x+cH.x*0.6,cB.z+cH.z*0.6,1);return false;}return true;});
    BEAT.line.forEach(r=>{if(n>=10)return;if(r.d<=LEND){pathAt(r.d,v3);_bq.copy(_bz);if(r.d>PLEN[2])_bq.premultiply(beltQ);v3.y+=0.05;}else{const e=r.d-LEND;v3.set(cB.x+cH.x*e,cB.y+0.5-2.5*e*e,cB.z+cH.z*e);_bq.copy(_bz);}
      m4.compose(v3,_bq,_one);lineMesh.setMatrixAt(n,m4);lineMesh.setColorAt(n,_bc.set(r.col||"#fff"));n++;});
    lineMesh.count=n;lineMesh.instanceMatrix.needsUpdate=true;if(lineMesh.instanceColor)lineMesh.instanceColor.needsUpdate=true;
    bayDraw();}
  // warehouse clamp trucks. Lanes: aisle along the south wall (z 17) and a lane inside the shipping doors (x -47.5).
  // Truck 0 tends the roll conveyor (rolls into the stacks, beater rolls into the bay); the rest load trucks at the doors.
  const AIS2=17.0,LANEX=-47.6,slot=k=>{k=Math.max(0,Math.min(83,k));return [-45+(k%12)*1.75,31.2-Math.floor(k/12)*1.7];};
  const via=(from,to)=>{const P2=[[from[0],AIS2]];if(Math.abs(to[0]-from[0])>0.3)P2.push([to[0],AIS2]);P2.push(to);return P2;};
  function clampJob(g,i,rdt){const J=g.userData.cj||(g.userData.cj={path:[],carry:null,after:null,wait:0}),sp=3.2*TSC();
    if(!g.userData.load.material.isMaterial&&!g.userData.lm){g.userData.lm=[new StdMat({roughness:0.8}),M.rollCap,M.rollCap];g.userData.load.material=g.userData.lm;}
    g.userData.load.visible=!!J.carry;if(J.carry)g.userData.lm[0].color.set(J.carry.col||"#ffffff");
    if(J.path.length){const p=J.path[0];if(moveVeh(g,p[0],p[1],sp,rdt)){J.path.shift();if(!J.path.length&&J.after){const f=J.after;J.after=null;f();}}return;}
    if(J.wait>0){J.wait-=rdt;return;}
    const n=rolls.count,here=[g.position.x,g.position.z];
    if(i===0){const RV=G3.rollVis,f=RV&&RV.list[0];
      if(f&&RV.CL&&f.d>=RV.CL-0.05){J.path=via(here,[-31.9,19.4]);J.after=()=>{const r=RV.list[0];if(!r||r.d<RV.CL-0.3){J.wait=0.5;return;}RV.list.shift();J.carry={col:r.col};
          const to=r.col?[bayPos(BEAT.bay.length)[0],16.9]:(()=>{const s2=slot(n);return [s2[0],s2[1]-1.45];})();BEAT.carry+=r.col?1:0;
          J.path=via([-31.9,19.4],to);if(r.col)J.path.push([to[0],16.85]);J.after=()=>{if(r.col){BEAT.bay.push(r.col);BEAT.carry--;}J.carry=null;J.wait=0.4;};};}
      else{J.path=via(here,[-33.5,AIS2]);J.wait=1;}
      return;}
    // shipping: beater truck first, then any docked outbound truck
    if(BT.st==="load"&&BEAT.bay.length&&BT.cargo.length+BEAT.carry<8){const k=BEAT.bay.length-1,[bx]=bayPos(k);BEAT.carry++;
      J.path=via(here,[bx,AIS2]);J.path.push([bx,16.85]);J.after=()=>{const col=BEAT.bay.pop();if(!col){BEAT.carry--;return;}J.carry={col};
        J.path=[[bx,AIS2],[WDOOR,AIS2],[WDOOR,15.4]];J.after=()=>{BT.cargo.push(col);cargoDraw();BEAT.carry--;J.carry=null;J.path=[[WDOOR,AIS2]];};};return;}
    const docks=[...Array(P.shipDoors).keys()].filter(d=>S.outDock[d]);
    if(docks.length&&n>0&&S.M.clampMul!==0){const d=docks[i%docks.length],dz=W(0,outY(d))[1],s2=slot(n-1-((i*5)%Math.min(12,n)));
      J.path=via(here,[s2[0],s2[1]-1.45]);J.after=()=>{J.carry={col:null};J.path=[[s2[0],AIS2],[LANEX,AIS2],[LANEX,dz]];J.after=()=>{J.carry=null;J.path=[[LANEX+1.4,dz]];J.wait=0.3;};};return;}
    J.path=via(here,[-38-i*2.2,AIS2]);J.wait=0.6;}
  function moveVeh(g,tx,tz,sp,rdt){const dx=tx-g.position.x,dz=tz-g.position.z,d=Math.hypot(dx,dz);if(d<0.15)return true;const st=Math.min(d,sp*rdt);g.position.x+=dx/d*st;g.position.z+=dz/d*st;
    g.rotation.y=lerpAng(g.rotation.y,Math.atan2(-dz,dx),Math.min(1,rdt*10));return false;}
  function chemUpdate(rdt){if(!CHEM.g){CHEM.g=makeTruck("chem");CHEM.g.visible=false;}const g=CHEM.g,L=LANE.in,u=g.userData;if(rdt<=0)return;
    if(CHEM.st==="away"){CHEM.t-=rdt*TSC()/3;if(CHEM.t>0)return;const free=[...Array(P.doors).keys()].filter(d=>!S.inDock[d]);
      if(S.inQ.length||!free.length){CHEM.t=4;return;}
      CHEM.d=free[Math.floor(Math.random()*free.length)];CHEM.dz=W(0,inY(CHEM.d))[1];g.visible=true;g.position.set(-150,0,L.inZ);u.heading=0;g.rotation.y=0;u.phase=null;u.route=[];u.done=false;
      u.route=routeFor(g,"in","dock",null,CHEM.dz);u.phase="dock";CHEM.st="in";log("Chemical delivery truck arriving at receiving","");}
    else if(CHEM.st==="in"){CHEM.want=u.route.length&&u.route[0].lock&&L.lock!==g;if(u.route.length)stepRoute(g,L,rdt);else{CHEM.want=false;CHEM.st="unload";CHEM.t=9;}}
    else if(CHEM.st==="unload"){CHEM.t-=rdt;u.heading=lerpAng(u.heading,Math.PI,Math.min(1,rdt*3));g.rotation.y=u.heading;
      g.updateMatrixWorld();_ha.set(-1.05,0.95,0.78);g.localToWorld(_ha);_hb.set(-34.6,1.1,CHEM.dz-1.55);const h=u.hose,dd=_hb.clone().sub(_ha),len=dd.length();
      h.visible=CHEM.t<8.4&&CHEM.t>0.6;h.position.copy(_ha).add(_hb).multiplyScalar(0.5);h.quaternion.setFromUnitVectors(_hup,dd.normalize());h.scale.set(1,len,1);
      if(CHEM.t<=0||S.inDock[CHEM.d]){h.visible=false;CHEM.want=false;u.route=routeFor(g,"in","leave",null,CHEM.dz);u.phase="leave";CHEM.st="out";}}
    else if(CHEM.st==="out"){if(u.route.length)stepRoute(g,L,rdt);if(u.done||!u.route.length){g.visible=false;CHEM.st="away";CHEM.t=120+Math.random()*120;}}
    u.wheels.forEach(w=>w.rotation.z=-(u.spin||0));
    if((CHEM.st==="in"||CHEM.st==="out")&&Math.random()<rdt*3){const st=u.stack,a=g.rotation.y,c=Math.cos(a),sn=Math.sin(a);emit("smoke",g.position.x+st[0]*c+st[2]*sn,st[1],g.position.z-st[0]*sn+st[2]*c,0.3,1.4,0,1.4,0.7,"#8c919b",0.45);}}
  function cage(g){[[-0.45,-0.36],[-0.45,0.36],[0.3,-0.36],[0.3,0.36]].forEach(([x,z])=>box(0.07,1.0,0.07,M.ink,x,1.4,z,g,false));box(0.85,0.07,0.8,M.ink,-0.07,1.92,0,g,false);
    // v4.1 pass 3: a driver (seat, hi-vis vest, head, hard hat) instead of a black block
    box(0.34,0.3,0.36,M.ink,-0.2,0.98,0,g,false);box(0.3,0.36,0.3,HIVIS.orange,-0.12,1.3,0,g,false).receiveShadow=false;   // (same flags as a walker's vest: one batch)
    const hd=new THREE.Mesh(DRV_HEAD,M.skin);hd.scale.setScalar(0.17);hd.position.set(-0.1,1.62,0);g.add(hd);const ht=new THREE.Mesh(DRV_HAT,M.warn);ht.scale.set(0.21,0.17,0.21);ht.position.set(-0.1,1.66,0);g.add(ht);
    const bc=new THREE.Mesh(DRV_HEAD,M.beacon);bc.scale.setScalar(0.07);bc.position.set(-0.07,1.98,0.3);g.add(bc);[[-0.35,-0.42],[-0.35,0.42],[0.35,-0.42],[0.35,0.42]].forEach(([x,z])=>cylZ(0.2,0.16,M.ink,x,0.2,z,12,g));}
  function forklift(m){const g=new THREE.Group();box(1.15,0.62,0.85,M.fork,0,0.55,0,g);box(0.3,0.55,0.82,M.ink,-0.62,0.62,0,g);cage(g);
    box(0.08,1.8,0.08,M.ink,0.66,1.0,-0.28,g,false);box(0.08,1.8,0.08,M.ink,0.66,1.0,0.28,g,false);box(0.75,0.06,0.12,M.ink,1.02,0.22,-0.2,g,false);box(0.75,0.06,0.12,M.ink,1.02,0.22,0.2,g,false);
    const load=box(0.72,0.62,0.72,M.bale,1.02,0.58,0,g);g.userData.load=load;scene.add(g);return g;}
  function clamp3(m){const g=new THREE.Group();box(1.15,0.62,0.85,M.fork,0,0.55,0,g);box(0.3,0.55,0.82,M.ink,-0.62,0.62,0,g);cage(g);
    box(0.08,1.9,0.08,M.ink,0.66,1.05,-0.3,g,false);box(0.08,1.9,0.08,M.ink,0.66,1.05,0.3,g,false);box(0.5,0.62,0.08,M.brand,0.98,0.95,-0.48,g,false);box(0.5,0.62,0.08,M.brand,0.98,0.95,0.48,g,false);
    const r=new THREE.Mesh(new CylG(0.4,0.4,0.9,18),ROLLM);r.position.set(0.95,0.95,0);g.add(r);g.userData.load=r;scene.add(g);return g;}
  function robot(){const g=new THREE.Group();box(1.1,0.35,1.1,M.robot,0,0.3,0,g);const l=box(0.3,0.08,0.3,M.ok,0,0.52,0,g,false);g.userData.light=l;scene.add(g);return g;}
  const lifts=[],loaders=[],robots=[];
  function ensure(arr,n,make){while(arr.length<n)arr.push(make());arr.forEach((o,i)=>o.visible=i<n);}

