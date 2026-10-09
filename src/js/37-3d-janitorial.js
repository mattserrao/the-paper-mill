  /* ---- v3.2.1 janitorial: trash cans fill through the day, a night janitor empties them and mops; ride-on scrubbers work the hall and the warehouse at night (visual only) ---- */
  {const NIGHT=hr=>hr>=20.5||hr<5.5;
    // trash cans (instanced: bodies, contents, overflow litter)
    const CANS=[[59.7,13.6],[27.7,13.6],[-3.3,13.6],[51.4,23.6],[64.0,21.2],[30.6,41.4],[35.4,41.4],[-12.6,15.6]].map(([x,z],i)=>({x,z,f:0.15+Math.random()*0.4,r:0.055+Math.random()*0.05,seed:i*7.3}));
    const NB=CANS.length,LIT=10;
    const bodyI=new THREE.InstancedMesh(new CylG(0.32,0.28,0.95,14),cloth0b("#3f6e57"),NB),rimI=new THREE.InstancedMesh(new CylG(0.34,0.34,0.07,14),M.ink,NB),
      fillI=new THREE.InstancedMesh(new CylG(0.29,0.29,1,10),cloth0b("#d9cbb0"),NB),litI=new THREE.InstancedMesh(new THREE.BoxGeometry(0.24,0.04,0.18),new StdMat({roughness:0.9}),NB*LIT);
    const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),col=new THREE.Color(),LC=["#f2f0ea","#c9a46e","#d23b3b","#3a6fc9","#f2c230","#e9e6df"];
    CANS.forEach((c,i)=>{m4.makeTranslation(c.x,0.475,c.z);bodyI.setMatrixAt(i,m4);m4.makeTranslation(c.x,0.97,c.z);rimI.setMatrixAt(i,m4);
      for(let k=0;k<LIT;k++){litI.setColorAt(i*LIT+k,col.set(LC[(i+k)%LC.length]).convertSRGBToLinear());}});
    [bodyI,rimI,fillI,litI].forEach(o=>{o.castShadow=o===bodyI;o.receiveShadow=true;o.userData.noNav=true;scene.add(o);});
    const drawCans=()=>{CANS.forEach((c,i)=>{const f=Math.min(c.f,1.35),h=Math.max(0.02,Math.min(f,1)*0.88);
        q.identity();ps.set(c.x,0.06+h/2,c.z);sc.set(1,h,1);m4.compose(ps,q,sc);fillI.setMatrixAt(i,m4);
        // overflowing: a heap above the rim and litter on the ground around the can
        if(f>1){/* heap */ps.set(c.x,0.95,c.z);sc.set(1,Math.min(0.35,(f-1)*1.2),1);m4.compose(ps,q,sc);fillI.setMatrixAt(i,m4);}
        const n=f>1.02?Math.min(LIT,Math.ceil((f-1.02)/0.33*LIT)):0;
        for(let k=0;k<LIT;k++){const a=c.seed+k*2.39,r=0.5+((k*37)%10)/14;if(k<n){q.setFromAxisAngle(_up,a*1.7);ps.set(c.x+Math.cos(a)*r,0.03,c.z+Math.sin(a)*r);sc.set(1,1,1);}else{ps.set(0,-50,0);sc.set(0.001,0.001,0.001);}
          m4.compose(ps,q,sc);litI.setMatrixAt(i*LIT+k,m4);}q.identity();});
      fillI.instanceMatrix.needsUpdate=true;litI.instanceMatrix.needsUpdate=true;};
    const _up=new THREE.Vector3(0,1,0);drawCans();
    // the janitor and the cart
    const jan=worker(cloth0b("#5b4b8a"),cloth0b("#2d2d3a"));jan.visible=false;
    const cart=new THREE.Group();scene.add(cart);cart.visible=false;cart.userData.noNav=true;
    box(0.7,0.62,0.48,cloth0b("#44474f"),0,0.52,0,cart,false);box(0.72,0.06,0.5,M.ink,0,0.85,0,cart,false);
    {const b=new THREE.Mesh(new CylG(0.17,0.15,0.28,10),M.warn);b.position.set(-0.48,0.3,0);cart.add(b);const mop=new THREE.Mesh(new CylG(0.025,0.025,1.3,6),M.metal);mop.position.set(-0.48,0.9,0.05);mop.rotation.z=0.15;cart.add(mop);}
    [-0.25,0.25].forEach(dx=>[-0.2,0.2].forEach(dz=>{const w=new THREE.Mesh(new CylG(0.07,0.07,0.05,8),M.ink);w.rotation.x=Math.PI/2;w.position.set(dx,0.07,dz);cart.add(w);}));
    const MOP=[[58,15.3],[26,15.3],[-5,15.3]],HOMEJ=[OFF.door[0],OFF.door[1]];
    const J={st:"off",q:[],t:0,tgt:null};G3.janitor={jan,J,cans:CANS};
    // ride-on floor scrubbers: one for the machine hall aisle, one for the warehouse lanes
    function scrubber(park,loop){const g=new THREE.Group();g.position.set(park[0],0,park[1]);scene.add(g);g.userData.noNav=true;
      box(1.5,0.55,0.95,M.warn,0,0.5,0,g);box(0.6,0.5,0.85,M.warn,-0.35,0.95,0,g,false);box(0.35,0.12,0.5,M.ink,0.05,0.82,0,g,false);box(0.08,0.4,0.4,M.ink,-0.1,1.0,0,g,false);
      box(0.5,0.18,1.05,M.ink,0.72,0.15,0,g,false);box(0.12,0.1,1.15,M.ink,-0.8,0.1,0,g,false);
      const bl=new THREE.Mesh(new SphG(0.09,8,6),new THREE.MeshBasicMaterial({color:0xffa31a,toneMapped:false}));bl.position.set(-0.45,1.32,0);g.add(bl);
      [[0.45,0.45],[0.45,-0.45],[-0.5,0.45],[-0.5,-0.45]].forEach(([x,z])=>{const w=new THREE.Mesh(new CylG(0.18,0.18,0.12,10),M.ink);w.rotation.x=Math.PI/2;w.position.set(x,0.18,z);g.add(w);});
      const drv=worker(cloth0b("#5b4b8a"),cloth0b("#2d2d3a"));g.add(drv);drv.position.set(-0.05,0.55,0);drv.rotation.y=0;drv.visible=false;
      const hit=new THREE.Mesh(new THREE.BoxGeometry(4,3,3),new THREE.MeshBasicMaterial());hit.position.y=1.2;hit.visible=false;g.add(hit);
      return {g,drv,bl,park,loop,i:0,st:"park",hd:0,lap:0,drop:0,hit};}
    const SCR=G3.scrubbers=[scrubber([60.5,19.0],[[-19.5,19.0],[-19.5,17.9],[60.5,17.9],[60.5,19.0]]),scrubber([-28.5,17.2],[[-46.6,17.2],[-46.6,30.5],[-47.6,30.5],[-47.6,16.3],[-28.5,16.3],[-28.5,17.2]])];
    // wet trail behind the scrubbers: little puddles that shrink away
    const WT=60,wetI=new THREE.InstancedMesh(new CircG(0.6,12),new THREE.MeshStandardMaterial({color:0x6f8494,roughness:0.06,metalness:0.25,transparent:true,opacity:0.45,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),WT);
    wetI.renderOrder=2;wetI.userData.noNav=true;scene.add(wetI);const wet=[];let wk=0;for(let k=0;k<WT;k++){wet.push({x:0,z:0,t:99});}
    const wrot=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
    let lastT=null,wetAcc=0;
    G3.janUpdate=(rdt,now)=>{if(!S)return;const hr=((S.t+360)/60)%24,night=NIGHT(hr);
      // litter builds during the working day
      if(lastT===null)lastT=S.t;const dh=Math.max(0,Math.min(60,(S.t-lastT)/60));lastT=S.t;
      if(dh>0&&hr>=6&&hr<20){CANS.forEach(c=>c.f=Math.min(1.35,c.f+c.r*dh*(0.7+0.6*Math.random())));drawCans();}
      // janitor
      if(J.st==="off"&&night&&rdt>0){J.q=CANS.filter(c=>c.f>0.12);if(J.q.length){J.st="cans";jan.visible=cart.visible=true;jan.position.set(HOMEJ[0],0,HOMEJ[1]);J.t=0;J.tgt=null;}}
      if(J.st==="done"&&!night&&hr>=6&&hr<20)J.st="off";
      if(jan.visible&&rdt>0){
        if(J.st==="cans"&&!J.tgt){if(!J.q.length){J.st="mop";J.mq=MOP.slice();}
          else{const p=jan.position;J.q.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));const c=J.q.shift();J.tgt={c,x:c.x+(c.z<20?0:0.9),z:c.z+(c.z<20?0.95:0)};J.t=0;}}
        if(J.st==="mop"&&!J.tgt){if(!J.mq.length||!night)J.st="home";else{const m=J.mq.shift();J.tgt={x:m[0],z:m[1],mop:true};J.t=0;}}
        if(J.st==="home"&&!J.tgt)J.tgt={x:HOMEJ[0],z:HOMEJ[1],home:true};
        const T=J.tgt;if(T){const arr=moveP(jan,T.x,T.z,2.2,rdt);
          if(!arr)pose(jan,"walk",now);
          else{J.t+=rdt;if(T.c){face(jan,T.c.x,T.c.z,rdt);pose(jan,"dump",now);if(J.t>2.4){T.c.f=0;drawCans();J.tgt=null;}}
            else if(T.mop){pose(jan,"clean",now);if(J.t>6)J.tgt=null;}
            else if(T.home){jan.visible=cart.visible=false;J.tgt=null;J.st="done";}}}
        // the cart rides in front of the janitor
        const a=jan.rotation.y;cart.position.set(jan.position.x+Math.cos(a)*0.85,0,jan.position.z-Math.sin(a)*0.85);cart.rotation.y=a;}
      // scrubbers
      SCR.forEach(R=>{const g=R.g;if(R.st==="park"){R.drv.visible=false;R.bl.visible=false;if(!night)R.did=false;if(night&&!R.did&&rdt>0&&(hr>=20.5||hr<3.5)){R.st="run";R.did=true;R.i=0;R.lap=0;}return;}
        R.drv.visible=true;R.bl.visible=Math.sin(now/180)>0;pose(R.drv,"sit",now);if(rdt<=0)return;
        const back=R.lap>=2||!night,tg=back?R.park:R.loop[R.i],dx=tg[0]-g.position.x,dz=tg[1]-g.position.z,d=Math.hypot(dx,dz);
        if(d<0.15){if(back){R.st="park";g.rotation.y=Math.PI;return;}R.i++;if(R.i>=R.loop.length){R.i=0;R.lap++;}return;}
        const want=Math.atan2(-dz,dx);g.rotation.y=lerpAng(g.rotation.y,want,Math.min(1,rdt*3));const st=Math.min(d,1.6*rdt*clamp(1-Math.abs(((want-g.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI)/1.2,0.15,1));
        g.position.x+=dx/d*st;g.position.z+=dz/d*st;
        R.drop+=st;if(R.drop>0.7){R.drop=0;const w=wet[wk];wk=(wk+1)%WT;const a=g.rotation.y;w.x=g.position.x-Math.cos(a)*0.95;w.z=g.position.z+Math.sin(a)*0.95;w.t=0;}});
      wetAcc+=rdt;if(wetAcc>0.1){const dt2=wetAcc;wetAcc=0;wet.forEach((w,k)=>{w.t+=dt2;const k2=w.t<14?1-w.t/14:0;ps.set(w.x,0.045,w.z);sc.set(k2*(0.9+0.2*Math.sin(k)),k2*(1.3+0.2*Math.cos(k)),1);if(k2<=0){ps.y=-50;sc.set(0.001,0.001,1);}m4.compose(ps,wrot,sc);wetI.setMatrixAt(k,m4);});wetI.instanceMatrix.needsUpdate=true;}};}
  function ambUpdate(rdt,now){envUpdate(rdt,now);
    {const bi=S.inc.find(x=>x.id==="birdhay");if(bi&&bi.real!==PG.seen){PG.seen=bi.real;PG.t0=now;}
      const u=(now-PG.t0)/1600;if(PG.seen&&u<=1){const s=u*u,x=-2+(-18.7+2)*s,y=10.5-8*s,z=zc+4-4*s;pigeon.visible=true;pigeon.position.set(x,y,z);pigeon.rotation.y=Math.PI;
        const f=Math.sin(now/30)*0.9;pigeon.userData.p1.rotation.x=f;pigeon.userData.p2.rotation.x=-f;if(u>0.97){for(let k=0;k<14;k++)emit("chip",-18.7+R(),2.6,zc+R(),R()*4,2+Math.random()*3,R()*4,1.4,0.25,k%2?"#d7d9de":"#6b6f78",1);PG.seen="done";}}}
    {const fi=S.inc.find(x=>x.id==="flares");if(fi&&fi.real!==FL.seen){FL.seen=fi.real;FL.until=now+7000;}
      if(now<FL.until&&rdt>0){const cols=["#ff3b3b","#ffd23f","#ff6bd6","#5dff8a","#ff8a1f"];
        for(let k=0;k<3;k++)if(Math.random()<rdt*14){const c=cols[Math.floor(Math.random()*cols.length)];emit("spark",16+R()*2,3.2,-13.5+R()*2,R()*5,12+Math.random()*10,R()*5,1.8,0.6,c,1);}
        if(Math.random()<rdt*6)emit("smoke",16+R()*2,3.4,-13.5+R()*2,R(),2.2,R(),2.6,2.2,"#e9b8c8",0.5);}}if(rdt<=0){parties.forEach(P2=>P2.members.forEach(m=>pose(m,"idle",now)));return;}
    for(const k in ambT)ambT[k]-=rdt;
    const has=k=>parties.some(p=>p.kind===k);
    // office staff, managers and tours keep day hours (6 a.m. to 6 p.m.): they come out of the office and at 6 p.m. head back in
    const hrA=((S.t+360)/60)%24,dayOn=hrA>=6&&hrA<18;
    if(dayOn){if(ambT.tour<=0){ambT.tour=80+Math.random()*80;if(!has("tour")&&hrA>=8&&hrA<16)startTour();}
      if(ambT.mgr<=0){ambT.mgr=60+Math.random()*60;if(!has("mgr")&&hrA<17.5)startMgr();}
      if(ambT.office<=0){ambT.office=14+Math.random()*16;if(parties.filter(p=>p.kind==="office").length<2&&hrA<17.6)startOffice();}
      if(!ambUpdate.wasDay){ambT.office=Math.min(ambT.office,1.5);ambT.mgr=Math.min(ambT.mgr,6);}}
    else parties.forEach(P2=>{if(P2.home||!["tour","mgr","office"].includes(P2.kind))return;P2.home=true;const L=P2.members[0];
      P2.path=[[L.position.x,Math.abs(L.position.z-AIS)<2?L.position.z:AIS,0],[OFF.door[0],AIS,0],[OFF.door[0],OFF.door[1],0]];P2.i=0;P2.wait=0;});
    ambUpdate.wasDay=dayOn;
    if(ambT.birds<=0){ambT.birds=30+Math.random()*40;if(!flock)startBirds();}
    if(ambT.food<=0&&FOOD.state==="off"){FOOD.state="in";FOOD.t=0;FOOD.id++;truck.visible=true;truck.rotation.y=0;truck.position.set(95,0,FOOD.z);}
    for(let k=parties.length-1;k>=0;k--)if(!partyUpdate(parties[k],rdt,now))parties.splice(k,1);
    // birds
    BIRDS.forEach((b,k)=>{if(!(k===5&&PG.seen&&PG.seen!=="done"&&(now-PG.t0)<1600))b.visible=false;});
    if(flock){flock.x+=flock.dir*11*rdt;const t=now/1000;
      for(let k=0;k<flock.n;k++){const b=BIRDS[k],o=flock.offs[k];b.visible=true;b.position.set(flock.x-flock.dir*o[0],10.2+o[2]+Math.sin(t*2+k)*0.6,flock.z+o[1]+Math.sin(t*1.3+k*2)*0.8);
        b.rotation.y=flock.dir<0?Math.PI:0;const f=Math.sin(t*16+b.userData.ph)*0.9;b.userData.p1.rotation.x=f;b.userData.p2.rotation.x=-f;}
      if(flock.x<-30||flock.x>76)flock=null;}
    // food truck
    G3.foodBox=truck.visible?[truck.position.x-4.3,truck.position.x+4.3,truck.position.z-1.9,truck.position.z+1.9]:null;
    if(FOOD.state==="in"){truck.position.x=Math.max(FOOD.x,truck.position.x-12*rdt);if(truck.position.x<=FOOD.x){FOOD.state="open";FOOD.open=true;FOOD.t=0;}}
    else if(FOOD.state==="open"){FOOD.t+=rdt;if(FOOD.t>50){FOOD.state="out";FOOD.open=false;truck.rotation.y=Math.PI;}}
    else if(FOOD.state==="out"){truck.position.x+=12*rdt;if(truck.position.x>95){truck.visible=false;FOOD.state="off";ambT.food=110+Math.random()*90;}}}

