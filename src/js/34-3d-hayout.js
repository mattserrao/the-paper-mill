  /* ---- hayout (v2.8.2, light): a short burst of 30 sheets (one instanced draw call) and a paper heap that shrinks as the crew cleans ---- */
  const HN=30,hayI=new THREE.InstancedMesh(new THREE.BoxGeometry(1.4,0.04,1),paperDS,HN);hayI.frustumCulled=false;hayI.visible=false;scene.add(hayI);
  const hayS=[],hM4=new THREE.Matrix4(),hQ=new THREE.Quaternion(),hE=new THREE.Euler(),hP=new THREE.Vector3(),hSc=new THREE.Vector3(1,1,1);
  for(let k=0;k<HN;k++)hayS.push({p:[0,0,0],v:[0,0,0],r:[0,0,0],sp:[0,0,0],k:0});
  const heapG=new SphG(1,12,6,0,Math.PI*2,0,Math.PI/2),heap=new THREE.Mesh(heapG,paperDS);heap.position.set(-18.7,0,zc);heap.visible=false;scene.add(heap);G3.hayParts=[hayI,heap];
  let shake=0;
  function hayFx(rdt,now){const ep=EP.hay,on=!!(ep&&now<ep.until),age=on?(now-ep.t0)/1000:99,left=on?(ep.until-now)/1000:0;
    if(on&&!ep.burst){ep.burst=true;hayS.forEach(s=>{s.p=[-18.7+(Math.random()-0.5)*2,3.8,zc+(Math.random()-0.5)*3];s.v=[(Math.random()-0.5)*6,4+Math.random()*4,(Math.random()-0.5)*6];
      s.r=[Math.random()*3,Math.random()*3,Math.random()*3];s.sp=[Math.random()*6,Math.random()*6,Math.random()*6];s.k=Math.random()*6;});}
    // burst: about 2.5 s of sheets popping up and fluttering down, then hidden
    hayI.visible=on&&age<2.6;
    if(hayI.visible){for(let k=0;k<HN;k++){const s=hayS[k];s.v[1]=Math.max(-3,s.v[1]-7*rdt);
        s.p[0]+=(s.v[0]+Math.sin(now/220+s.k))*rdt;s.p[1]=Math.max(0.05,s.p[1]+s.v[1]*rdt);s.p[2]+=(s.v[2]+Math.cos(now/260+s.k))*rdt;
        if(s.p[1]>0.05){s.r[0]+=s.sp[0]*rdt;s.r[1]+=s.sp[1]*rdt;s.r[2]+=s.sp[2]*rdt;}
        hE.set(s.r[0],s.r[1],s.r[2]);hQ.setFromEuler(hE);hP.set(s.p[0],s.p[1],s.p[2]);hM4.compose(hP,hQ,hSc);hayI.setMatrixAt(k,hM4);}
      hayI.instanceMatrix.needsUpdate=true;}
    // heap: grows as the sheets land, shrinks to nothing as the crew clears it
    heap.visible=on&&age>0.5;
    if(heap.visible){const g=Math.min(1,(age-0.5)/1.5),sh=S.wd==="hayout"?Math.max(0.25,Math.min(1,(S.hayLeft||0)/Math.max(1,S.hayTotal||1))):Math.min(1,left/0.9),f=Math.max(0.01,g*sh);
      heap.scale.set(3.2*f,0.9*f,2.6*f);}
    shake=0;
  }

  function crewUpdate(rdt,now){
    if(seenHay<0||S.tot.hayouts<seenHay)seenHay=S.tot.hayouts;
    if(seenBrk<0||S.tot.breaks<seenBrk)seenBrk=S.tot.breaks;
    if(S.tot.hayouts>seenHay){seenHay=S.tot.hayouts;EP.hay={t0:now,until:now+4000};}
    if(EP.hay&&S.wd==="hayout")EP.hay.until=Math.max(EP.hay.until,now+900);
    // the crew works the oldest machine/winder job first
    const head=S.crewQ&&S.crewQ[0],hk=head?head.k:null;let here=false;
    const hayOn=hk==="hay",brkOn=hk==="brk",yardBrk=brkOn&&S.brkType!=="reel"&&head.go;
    if(yardBrk&&!EP.brk)EP.brk={launched:false};
    {const ri=S.inc.find(x=>x.id==="runner");if(ri&&ri.real!==RUN.seen){RUN.seen=ri.real;RUN.t0=now;RUN.until=now+2*(RX0-RX1)/RSP*1000;crew.forEach(w=>w.userData.chase=false);}
      RUN.on=now<RUN.until;runnerW.visible=RUN.on;
      if(RUN.on){const d=(now-RUN.t0)/1000*RSP,L=RX0-RX1,out=d<L;RUN.dir=out?-1:1;RUN.x=out?RX0-d:RX1+(d-L);RUN.z=16.1+1.1*Math.sin(d/3.2)+(out?0:0.6);
        runnerW.position.set(RUN.x,0,RUN.z);runnerW.rotation.y=out?Math.PI:0;pose(runnerW,"flail",now);}}
    // machine crew
    const dryOn=hk==="dryerfire";
    crew.forEach(w=>{if(w.userData.ry&&!w.userData.brk)w.userData.ry=0;});if(!dryOn)crewHose.forEach(m=>m.visible=false);
    airLines.forEach(g=>g.forEach(m=>m.visible=false));
    // celebrate when the tail gets on the reel: a quick round of high fives
    if(G3.prevPm==="break"&&S.pm!=="break"&&hiWho.size){EP.hi5={until:now+2600,who:[...hiWho]};}
    if(G3.prevWrap&&!S.inc.some(x=>x.id==="wrap")&&wrapWho.size){EP.hi5={until:now+2600,who:[...wrapWho]};}
    if(S.pm!=="break")hiWho.clear();if(!S.inc.some(x=>x.id==="wrap"))wrapWho.clear();
    G3.prevPm=S.pm;G3.prevWrap=S.inc.some(x=>x.id==="wrap");
    ropes.forEach(m=>m.visible=false);spears.forEach(m=>m.visible=false);
    const tvOn=CONSOLES.map(()=>false);
    crew.forEach((w,i)=>{let tx,tz,act,fx=null;
      if(dryOn){fireCrew(w,i,rdt,now);if(Math.hypot(w.position.x-FIRESPOT[i][0],w.position.z-FIRESPOT[i][1])<0.4)here=true;return;}
      if(hayOn){if(!EP.hay)EP.hay={t0:now-2000,until:now+900,burst:true};const age=now-EP.hay.t0,shuttle=i%2===1,ph=((age/1800)+i*0.37)%2,s=HAY[i];
        if(age<1100){tx=w.position.x;tz=w.position.z;act="look";fx=[-18.7,zc];}
        else if(shuttle&&ph>1){tx=-12;tz=15.6;act="dump";}
        else{tx=s[0];tz=s[1];act="clean";fx=[-18.7,zc];}
        const arrived=act==="look"||moveP(w,tx,tz,10,rdt);if(arrived&&act==="clean")here=true;
        if(arrived&&fx)face(w,fx[0],fx[1],rdt);pose(w,arrived?act:(shuttle&&act==="dump"?"carry":"run"),now);return;}
      // v3.2.0: the slice was run out to the couch and broke the sheet: the wet-end operator swears, walks to the L/B gauge and resets it
      if(G3.slcFix&&G3.slcFix.i===i){const F=G3.slcFix;F.t+=rdt;const B=slcBubble;
        if(F.ph==="swear"){pose(w,"flail",now);face(w,57.15,zc,rdt);if(F.t>2.2){F.ph="walk";F.t=0;}}
        else if(F.ph==="walk"){if(moveP(w,56.45,12.85,7,rdt)){F.ph="fix";F.t=0;}else pose(w,"run",now);}
        else{face(w,57.15,12.3,rdt);pose(w,"type",now);if(F.t>2.6){G3.SLC.v=G3.SLC.h=0;G3.SLC.dirty=true;G3.slcFix=null;B.visible=false;G3.onSlcReset&&G3.onSlcReset();return;}}
        B.visible=F.ph!=="fix"||F.t<0.6;B.position.set(w.position.x,2.75+0.06*Math.sin(now/120),w.position.z);B.material.opacity=F.ph==="swear"?1:Math.max(0,1-F.t/1.2);return;}
      if(brkOn){[tx,tz]=(BRKSPOT[S.brkType]||RT)[i];const arrived=moveP(w,tx,tz,10,rdt);if(arrived){face(w,tx,zc,rdt);here=true;}
        const air=arrived&&head.go&&tx>-4&&tx<28;pose(w,arrived?(air?"air":"rethread"):"run",now);
        if(air){const [nx,,nz]=nozzlePos(w),a=w.rotation.y;hoseTo(airLines[i],nx-Math.cos(a)*0.45,1.35,nz+Math.sin(a)*0.45,w.position.x+0.4,2.6,w.position.z<zc?zc-CD/2-0.4:zc+CD/2+0.4);
          if(Math.random()<rdt*12)emit("steam",nx,1.45,nz,Math.cos(a)*5,1.2+Math.random(),-Math.sin(a)*5,0.55,0.45,"#ffffff",0.55);}
        hiWho.add(i);return;}
      if(hk==="wrap"){const wi=S.inc.find(x=>x.id==="wrap"),cx=canX(wi?wi.can:5);const order=HOME.map((h,j)=>[Math.abs(h[0]-cx),j]).sort((a,b)=>a[0]-b[0]).map(a=>a[1]),r=order.indexOf(i);
        if(r<3){wrapWho.add(i);const gx=cx-1.6+r*1.6,gz=13.5,ok=moveP(w,gx,gz,9,rdt);
          if(ok){face(w,gx,zc,rdt);here=true;const prog=wi&&wi.go?1-wi.left/wi.total:0;
            if(prog<0.7){pose(w,"spear",now);const a=w.rotation.y,j=Math.sin(now/180+r*2)*0.35;stretch2(spears[r],w.position.x+Math.cos(a)*0.5,1.45,w.position.z-Math.sin(a)*0.5,cx-0.6+r*0.6,5.9+j*0.3,zc+CD/2-1.1-j);
              if(wi&&wi.go&&Math.random()<rdt*8)emit("chip",cx+R()*1.5,6+Math.random(),zc+CD/2-1,R()*2,2+Math.random()*2,2+Math.random()*2,1.2,0.3,"#c8a477",1);}
            else pose(w,"rethread",now);}
          else pose(w,"run",now);return;}}
      if(SITES[hk]){const order=HOME.map((h,j)=>[Math.hypot(h[0]-SITES[hk].c[0],h[1]-SITES[hk].c[1]),j]).sort((a,b)=>a[0]-b[0]).map(a=>a[1]),r=order.indexOf(i);
        if(r<4){const st=SITES[hk],sp2=st.p[r];const arrived=moveP(w,sp2[0],sp2[1],9,rdt);if(arrived){face(w,st.c[0],st.c[1],rdt);here=true;}pose(w,arrived?st.a:"run",now);
          if(arrived&&st.a==="fix"&&Math.random()<rdt*3){const [nx,,nz]=nozzlePos(w);emit("spark",nx,1.1,nz,R()*3,2+Math.random()*2,R()*3,0.4,0.2,"#ff8a1f",1);}return;}}
      const job=(hk==="felt"||hk==="fabric")&&JOBS[hk]&&CLOTH[hk].ep&&now-JOBS[hk].t<1500?JOBS[hk]:null;
      if(job){const order=HOME.map((h,j)=>[Math.abs(h[0]-job.x),j]).sort((a,b)=>a[0]-b[0]).map(a=>a[1]),r=order.indexOf(i);
        if(r<4){let gx,gz,act,lx,lz;
          // fabric: two operators head round to the drive side while two carry the crate; then everyone pulls it on with ropes
          if(job.id==="fabric"&&(job.ph==="install"||job.ph==="set"||(job.ph==="carry"&&r>=2))){w.userData.side="back";
            gx=job.x-2.7+r*1.8;gz=BACKZ;const arrived=goSide(w,gx,gz,11,rdt);
            if(arrived){face(w,gx,zc,rdt);here=true;const a=w.rotation.y;
              if(job.ph==="install"&&job.cov<0.995){pose(w,"pull",now);const lz2=zc+CD/2-0.1-job.cov*(CD-0.2),ez=zc-CD/2+0.05;rope(ropes[r],w.position.x+Math.cos(a)*0.65,1.3,w.position.z-Math.sin(a)*0.65,gx,3.0,ez);if(lz2>ez+0.05)rope(ropes[r+4],gx,3.0,ez,gx,2.98,lz2);}
              else pose(w,"idle",now);}
            else pose(w,"run",now);return;}
          if(job.ph==="run"||job.ph==="bare"){here=here||Math.hypot(w.position.x-(job.x-3.6+r*2.4),w.position.z-(job.hz+(r%2?1.9:-1.2)))<0.5;gx=job.x-3.6+r*2.4;gz=job.hz+(r%2?1.9:-1.2);act=job.ph==="run"?"look":"clean";lx=job.x;lz=job.hz;}
          else if(job.ph==="carry"&&job.id==="fabric"){gx=job.tube[0]+(r?2.7:-2.7);gz=job.tube[1]+(r?0.75:-0.75);act="haul";}
          else if(job.ph==="carry"){gx=job.tube[0]-2.4+r*1.6;gz=job.tube[1]+(r%2?0.75:-0.75);act="haul";}
          else if(job.ph==="set"){gx=job.tube[0]-2.4+r*1.6;gz=job.tube[1]+(r%2?0.9:-0.9);act="clean";lx=job.x;lz=job.tube[1];}
          else{gx=job.x-2.7+r*1.8;gz=13.25;act=job.ph==="seam"?"fix":"rethread";lx=gx;lz=zc;}
          const arrived=moveP(w,gx,gz,job.ph==="carry"?12:9,rdt);
          if(job.ph==="carry"){if(arrived)w.rotation.y=Math.PI;pose(w,arrived?"haul":"run",now);}
          else{if(arrived&&lx!==undefined)face(w,lx,lz,rdt);pose(w,arrived?act:"run",now);}return;}}
      const u=w.userData;
      if(EP.hi5&&now<EP.hi5.until){const who=EP.hi5.who,k=who.indexOf(i);if(k>=0&&who.length>1){const pj=who[k%2?k-1:(k+1<who.length?k+1:k-1)],pw=crew[pj];
        const mx=(w.position.x+pw.position.x)/2,mz=(w.position.z+pw.position.z)/2,dx=w.position.x-pw.position.x,dz=w.position.z-pw.position.z,d=Math.hypot(dx,dz)||1;
        const ok=moveP(w,mx+dx/d*0.42,mz+dz/d*0.42,6,rdt);if(ok){face(w,pw.position.x,pw.position.z,rdt);pose(w,"hi5",now);if(Math.random()<rdt*3)emit("spark",mx,2.35,mz,R()*2,1.5,R()*2,0.4,0.25,"#ffd23f",1);}else pose(w,"run",now);return;}}
      if(u.side==="back"){if(goSide(w,AROUND,14.8,9,rdt))u.side=null;else{pose(w,"run",now);return;}}
      if(u.side==="stock"&&(u.ry||0)>0.02){if(!moveP(w,RAG.top[0],RAG.top[1],3,rdt)&&Math.hypot(w.position.x-RAG.top[0],w.position.z-RAG.top[1])>0.2&&!u.ragDown){pose(w,"walk",now);return;}u.ragDown=true;
        if(!ragClimb(w,false,rdt)){pose(w,"walk",now);return;}u.ragDown=false;u.ry=0;}
      if(u.side==="stock"){if(goRoute(w,"ragback",[[RAG.foot[0],-1.5],[67,-1.2],[67,17.4],[HOME[i][0],15.2]],8,rdt)){u.side=null;u.rk=null;}else{pose(w,"run",now);return;}}
      if(RUN.on){if(!u.chase&&Math.abs(RUN.x-w.position.x)<11)u.chase=true;
        if(u.chase){const back=2.4+(i%3)*1.3;moveP(w,RUN.x-RUN.dir*back,RUN.z+(i%2?0.9:-0.9),8.4,rdt);pose(w,"run",now);return;}}
      else u.chase=false;
      // idle: drift around their own patch of the aisle, stop to watch the machine or point something out
      if(!u.lunch&&!u.vend&&VEND.user<0&&Math.random()<rdt*0.006){u.vend=true;u.vt=0;VEND.user=i;}
      if(u.vend){const a=moveP(w,VEND.x+0.1,VEND.z-1.0,4.2,rdt);if(a){face(w,VEND.x,VEND.z+1,rdt);u.vt+=rdt;pose(w,u.vt<2.2?"type":"idle",now);if(u.vt>4){u.vend=false;VEND.user=-1;u.wt=0;}}else pose(w,"walk",now);return;}
      if(FOOD.open&&u.ate!==FOOD.id&&!u.lunch&&Math.random()<rdt*0.12){u.lunch=true;u.lt=0;}
      if(u.lunch){if(!FOOD.open){u.lunch=false;}else{const q=FOOD.spot(i),a=moveP(w,q[0],q[1],4.2,rdt);
        if(a){face(w,FOOD.x,FOOD.z,rdt);u.lt+=rdt;pose(w,u.lt>2.5?"inspect":"idle",now);if(u.lt>6){u.lunch=false;u.ate=FOOD.id;u.wt=0;}}else pose(w,"walk",now);return;}}
      // when the mill is running sweet: catwalk rounds, feet up at the console, smoke breaks and picnic tables
      const calm=!S.inc.length&&S.pm==="run"&&S.wd!=="hayout"&&!S.wdBlocked&&!RUN.on;
      if(!calm&&u.brk){u.brk=null;u.ry=0;BRK.smoke.delete(i);BRK.pic.delete(i);}
      if(calm&&!u.brk&&!u.lunch&&!u.vend&&Math.random()<rdt*0.01){const r=Math.random();
        if(r<0.3&&(i===2||i===3)&&!BRK.walk){u.brk={k:"walk",ri:0,pt:0};BRK.walk=true;}
        else if(r<0.6&&BRK.smoke.size<2){u.brk={k:"smoke",t:0,s:[65.6+BRK.smoke.size*1.2,21.2]};BRK.smoke.add(i);}
        else if(BRK.pic.size<3){const tb=[28,33,38][Math.floor(Math.random()*3)];u.brk={k:"pic",t:0,s:[tb+(Math.random()<0.5?-0.5:0.5),40-0.75]};BRK.pic.add(i);}}
      if(u.brk){const b=u.brk;
        if(b.k==="walk"){if(walkRoute(w,G3.pmRoute,b,rdt,now)){u.brk=null;BRK.walk=false;u.ry=0;}return;}
        const [sx,sz]=b.s,a=moveP(w,sx,sz,4,rdt);
        if(a){b.t+=rdt;if(b.k==="smoke"){face(w,66.5,22.6,rdt);pose(w,"smoke",now);if(Math.sin(now/1000*0.9+w.userData.ph)>0.3&&Math.random()<rdt*5){const [nx,,nz]=nozzlePos(w);emit("smoke",nx-0.4,1.85,nz,0.1,0.5,0,1.6,0.35,"#d8dbe0",0.5);}}
          else{face(w,sx,40,rdt);pose(w,"sit",now);}
          if(b.t>(b.k==="smoke"?14:18)){u.brk=null;BRK.smoke.delete(i);BRK.pic.delete(i);u.wt=0;}}
        else pose(w,"walk",now);return;}
      // idle: check in at their console, then wander their stretch of the machine and watch it run
      const op=OPS[i],hasC=i<6;
      if(!u.wt||now>u.wt){const atC=hasC&&(u.act!=="type")&&Math.random()<0.45;
        if(atC){const chill=calm&&Math.random()<0.45;u.wx=op[0][0];u.wz=chill?14.55:op[0][1];u.act=chill?"relax":"type";u.wt=now+(chill?9000:4000)+Math.random()*4000;}
        else{u.wx=op[1]+Math.random()*(op[2]-op[1]);u.wz=14.0+Math.random()*1.6;u.act=Math.random()<0.4?"inspect":"idle";u.wt=now+3500+Math.random()*6000;}}
      // v3.0.1 zen: more feet-up time at the console with the game on; a manager within sight sends them back to busy work
      if(G3.zen&&hasC){const boss=mgrNear(w.position.x,w.position.z,9);
        if(boss&&u.act==="relax"){u.act="type";u.wz=op[0][1];u.wt=now+7000+Math.random()*3000;u.caught=true;}
        else if(boss&&u.caught){u.wt=Math.max(u.wt,now+3000);}
        else if(!boss&&u.caught&&now>u.wt-2000){u.caught=false;}
        if(!boss&&!u.caught&&u.act!=="relax"&&u.act!=="type"&&Math.random()<rdt*0.05){u.wx=op[0][0];u.wz=14.55;u.act="relax";u.wt=now+14000+Math.random()*8000;}}
      const far=Math.hypot(u.wx-w.position.x,u.wz-w.position.z)>7,arrived=moveP(w,u.wx,u.wz,far?7:1.6,rdt);
      const kick=u.act==="relax"&&(calm||G3.zen);if(hasC&&G3.zen&&kick&&arrived)tvOn[CONSOLES.reduce((b,c,j)=>Math.abs(c-op[0][0])<Math.abs(CONSOLES[b]-op[0][0])?j:b,0)]=true;
      if(arrived)face(w,u.wx,u.act==="type"||u.act==="relax"?13.2:zc,rdt);pose(w,arrived?(u.act==="relax"&&!kick?"type":u.act):(far?"run":"walk"),now);});
    G3.tvOn=tvOn;tvOn.forEach((on,ci)=>G3.conTV&&G3.conTV(ci,on));
    // stock prep operators walk their rounds: along the screening line, up the stair tower onto the thickener deck, and back
    spOps.forEach((w,k)=>{const u=w.userData,inc=S.inc.find(x=>SPJOB[x.id]);
      // the stock prep operator restarts a broken ragger tail: up the platform stair, then throws fresh ragger rope into the tub
      if(k===0){const rinc=S.inc.find(x=>x.id==="ragger");
        if(rinc){u.sr=null;if(!u.ragUp){u.ry=0;if(!goRoute(w,"ragpre",ragApproach(w),6,rdt)){pose(w,"run",now);return;}}
          if(!ragClimb(w,true,rdt)){pose(w,u.ragUp?"walk":"run",now);return;}
          if(!moveP(w,RAG.stand[0],RAG.stand[1],2.5,rdt)){pose(w,"walk",now);return;}
          face(w,16,-13.5,rdt);if(hk==="ragger")here=true;const prog=working("ragger")?1-rinc.left/Math.max(1e-6,rinc.total):0;
          pose(w,prog<0.72?"throw":"look",now);
          if(prog<0.72&&working("ragger")){const ph=(now/1000+u.ph)*1.4%1;if(ph>0.55&&ph<0.66&&!u.thrown){u.thrown=true;
              for(let q=0;q<5;q++)emit("chip",w.position.x+0.3,4.9,w.position.z-0.4,0.5+Math.random()*0.6,3.0+Math.random(),-2.4-Math.random()*1.4,1.3,0.34,"#3b3631",1);}
            if(ph<0.5)u.thrown=false;}
          return;}
        if(u.ragUp){if(Math.hypot(w.position.x-RAG.top[0],w.position.z-RAG.top[1])>0.2&&!u.ragDown){moveP(w,RAG.top[0],RAG.top[1],2.5,rdt);pose(w,"walk",now);return;}
          u.ragDown=true;if(!ragClimb(w,false,rdt)){pose(w,"walk",now);return;}u.ragDown=false;u.ry=0;u.ragBack=true;}
        if(u.ragBack){if(goRoute(w,"ragback",[[RAG.foot[0],-19.6],[22,-19.6]],5,rdt)){u.ragBack=false;u.rk=null;}else{pose(w,"walk",now);return;}}}
      if(k===1&&inc&&inc.id==="ragger"&&!goRoute(w,"ragpre",ragApproach(w),6,rdt)){pose(w,"run",now);return;}
      if(k===1&&!(inc&&inc.id==="ragger")&&(u.rk==="ragpre"||u.rk==="ragback")){if(goRoute(w,"ragback",[[RAG.foot[0]-0.6,-7.4],[RAG.foot[0]-0.6,-19.6],[22,-19.6]],5,rdt))u.rk=null;else{pose(w,"walk",now);return;}}
      if(inc){u.ry=0;u.sr=null;const sp=SPJOB[inc.id],a=moveP(w,sp[0]+k*1.4,sp[1]+1.2,6,rdt);if(a)face(w,sp[0],sp[1]-2,rdt);pose(w,a?(k?"look":"clean"):"run",now);return;}
      if(!u.sr)u.sr={ri:0,pt:0,which:k};const R2=k===0?G3.thkRoute:SPGROUND;if(walkRoute(w,R2,u.sr,rdt,now))u.sr=null;});
    // yard crews jump off their trucks and run to the machine on a sheet break
    if(head&&here)head.here=true;
    if(yardBrk&&EP.brk&&!EP.brk.launched){EP.brk.launched=true;let k=0;
      const spots=[];lifts.forEach((g,i)=>{if(g.visible&&i<Math.floor(S.effDrv+1e-9))spots.push([g.position.x,g.position.z]);});
      loaders.forEach((g,i)=>{if(g.visible&&i<Math.floor(S.effHum+1e-9))spots.push([g.position.x,g.position.z]);});
      spots.forEach(([x,z])=>{let h=helpers[k];if(!h){h=worker(M.warn,skin);helpers.push(h);}h.visible=true;h.position.set(x,0,z);h.userData.from=[x,z];h.userData.out=true;k++;});
      for(;k<helpers.length;k++){helpers[k].visible=false;helpers[k].userData.out=false;}}
    let away=false;
    helpers.forEach((h,k)=>{if(!h.userData.out)return;away=true;
      if(yardBrk){const [tx,tz]=RTY[k%RTY.length];const a=moveP(h,tx,tz,11,rdt);if(a)face(h,tx,zc,rdt);pose(h,a?"rethread":"run",now);}
      else{const [fx2,fz]=h.userData.from;if(moveP(h,fx2,fz,11,rdt)){h.visible=false;h.userData.out=false;}else pose(h,"run",now);}});
    if(!yardBrk)EP.brk=null;
    G3.yardFrozen=away;
    brigadeUpdate(rdt,now);techUpdate(rdt,now);if(G3.outageVis)try{G3.outageVis(rdt,now);}catch(e){if(!G3.ovErr){G3.ovErr=1;console.error("outage visuals",e);}}ambUpdate(rdt,now);if(G3.janUpdate)G3.janUpdate(rdt,now);
    // winder machinery
    const cutting=S.rates.cut>0.5&&S.wd!=="hayout"&&!CR.hideUnwind;
    const nP0=craneUpdate(rdt);
    const ur=0.35+1.65*Math.sqrt(Math.min(S.winderBuf,P.jumbo)/P.jumbo);unwind.scale.set(ur,ur,1);unwind.visible=S.winderBuf>0.2&&!CR.hideUnwind;
    const sr=0.25+0.75*Math.min(1,S.winderAcc/C.rollW.v),RR=0.62*sr;setRolls.forEach(r=>{r.scale.set(RR,RR,1);r.position.y=0.75+Math.sqrt(Math.max(0.01,(0.5+RR)*(0.5+RR)-0.3025));r.visible=S.wd!=="hayout";if(cutting)r.rotation.z-=rdt*10/Math.max(0.3,sr);});
    if(cutting){unwind.rotation.z+=rdt*6;drums.forEach(d=>d.rotation.z+=rdt*12);}
    web.visible=cutting&&unwind.visible;
    const inFlight=[CR.j,...CR.jobs].filter(Boolean),nPark=clamp(nP0-inFlight.filter(j=>j.kind==="park"&&!j.dropped).length+inFlight.filter(j=>j.fromPark&&!j.picked).length,0,parked.length);parked.forEach((g,k)=>g.children[2].visible=g.children[3].visible=k<nPark);
    hayFx(rdt,now);
  }

