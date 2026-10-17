  /* ---------- v5.2 civics in the world, and the camera pull ----------
     The four civics meters show in the mill and the town once they leave Steady:
       Community  Strained: a petition table at the gate, the town's windows dim. Crisis: a protest at the gate, windows
                  dimmer still. Excellent: a "proud of our mill" banner and balloons over the gate.
       Labor      Strained: the car park thins out, a staff meeting by the office. Crisis: a picket line at the car-park
                  gate and an emptier lot. Excellent: a crew barbecue and a full lot.
       Machinery  Strained: steam and drips off the machine, puddles, amber beacons on the hall. Crisis: sparks too, red
                  beacons flashing. Excellent: green beacons.
       Economy    Strained: the mill's order board turns amber. Crisis: red, and a competitor's billboard on the road.
                  Excellent: green, and customer trucks queue at the gate.
     The civic upsets, warnings, crises and rewards (09d) get their own scenes from the same parts (a reporter's van, dead
     fish on the river, a retirement party...), shown while the event is on and for a few sim hours after its card.
     Everything is built while the start screen is up (with the upset effects, so every shader is compiled before play)
     and only shown or hidden afterwards. Nothing here touches the sim: it reads S.civ, S.fx and S.inc.
     Camera pull: when a major upset, crisis or reward starts, the camera glides there, holds about 4 seconds and goes
     back, unless the player has touched the view in the last few seconds (then it stays put), or turned it off in
     Settings ("Fly to big moments"). */
  const CV={parts:{},built:false,want:{},wantT:-1e9,seen:{}};
  const CPH=matchMedia("(pointer: coarse)").matches?0.5:1;   // phones: half the ambient particles
  const cvM=(()=>{const c={};return h=>c[h]||(c[h]=new StdMat({color:lin0(h),roughness:0.8}));})();
  const TOWN=["#c75b4a","#4a78b8","#5f9e6e","#d4a24a","#8a6bb8","#e07a9b","#4aa6a6","#7d8590","#b8743a","#3e5f8a"],HAIR=["#2b2420","#5a3b25","#c9a36b","#7a7a7a","#3a2a1f"];
  const GATE=[FENCE.x0-1.5,4.4];
  // a painted board: canvas text, redrawn when the text changes (the material and shader stay the same)
  function cvBoard(w,h,px=256){const c=document.createElement("canvas");c.width=px;c.height=Math.round(px*h/w);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
    // two single-sided faces back to back, so the text reads the right way round from either side
    const m=new THREE.MeshBasicMaterial({map:t,toneMapped:false}),pg=new THREE.PlaneGeometry(w,h),mesh=new THREE.Group(),f=new THREE.Mesh(pg,m),bk=new THREE.Mesh(pg,m);bk.rotation.y=Math.PI;bk.position.z=-0.01;mesh.add(f,bk);let kt=null,kb=null,kf=null,ke=null;
    mesh.userData.set=(text,bg="#f4efe2",fg="#1c2233",edge=null)=>{if(text===kt&&bg===kb&&fg===kf&&edge===ke)return;kt=text;kb=bg;kf=fg;ke=edge;const x=c.getContext("2d"),W=c.width,H=c.height;x.fillStyle=bg;x.fillRect(0,0,W,H);
      if(edge){x.strokeStyle=edge;x.lineWidth=Math.max(4,H*0.07);x.strokeRect(x.lineWidth/2,x.lineWidth/2,W-x.lineWidth,H-x.lineWidth);}
      const lines=String(text).split("\n");let fs=H*0.8/lines.length;x.font=`800 ${fs}px "Plus Jakarta Sans",system-ui,sans-serif`;const wMax=Math.max(...lines.map(l=>x.measureText(l).width));if(wMax>W*0.88)fs*=W*0.88/wMax;
      x.font=`800 ${fs}px "Plus Jakarta Sans",system-ui,sans-serif`;x.fillStyle=fg;x.textAlign="center";x.textBaseline="middle";lines.forEach((l,i)=>x.fillText(l,W/2,H/2+(i-(lines.length-1)/2)*fs*1.05));t.needsUpdate=true;};
    return mesh;}
  // a townsperson: a worker figure without the hard hat (the dome is kept as hair)
  function townie(i){const p=worker(cvM(TOWN[i%TOWN.length]),cvM(HAIR[i%HAIR.length]));const t=p.userData.torso;t.children.forEach(o=>{if(o.isMesh&&o.material===cvM(HAIR[i%HAIR.length])&&o.scale.y<0.1)o.visible=false;});return p;}
  // a sign on a stick, held above the head
  // (v5.2 review: signs with the same slogan and colour share one painted material and geometry, so they batch together)
  const SIGNM={},SIGNG=new THREE.PlaneGeometry(1.9,1.15);
  function handSign(p,text,i){const bg=["#f4efe2","#ffe066","#ffffff","#ffd0c4"][i%4],k=text+"|"+bg;let m=SIGNM[k];
    if(!m){const src=cvBoard(1.9,1.15,192);src.userData.set(text,bg,"#1c2233","#1c2233");m=SIGNM[k]=src.children[0].material;}
    const b=new THREE.Group(),f=new THREE.Mesh(SIGNG,m),bk=new THREE.Mesh(SIGNG,m);bk.rotation.y=Math.PI;bk.position.z=-0.01;b.add(f,bk);b.position.set(0.25,2.55,0);b.rotation.y=Math.PI/2;
    const st=new THREE.Mesh(cubeG,M.kraft);st.scale.set(0.07,1.5,0.07);st.position.set(0.25,1.75,0);p.userData.torso.add(st,b);return b;}
  // an easel / A-frame sign on the ground
  function easel(g,x,z,ry,w=2.6,h=1.5){const e=new THREE.Group();e.position.set(x,0,z);e.rotation.y=ry;g.add(e);const b=cvBoard(w,h,256);b.position.y=h/2+0.5;e.add(b);
    [-1,1].forEach(s=>{const l=new THREE.Mesh(cubeG,M.kraft);l.scale.set(0.08,h+0.6,0.08);l.position.set(s*w*0.42,(h+0.6)/2,-0.05);e.add(l);});return b;}
  function simpleTruck(g,col,x,z,ry){const t=new THREE.Group();t.position.set(x,0,z);t.rotation.y=ry;g.add(t);box(2.2,2.3,2.4,cvM(col),3.6,1.55,0,t);box(0.08,0.9,2.0,M.wind,4.72,2.0,0,t,false);
    box(7.4,2.8,2.5,cvM("#eef0f2"),-1.6,1.9,0,t);box(7.6,0.3,2.3,M.ink,-1.0,0.45,0,t,false);[[3.6,1],[3.6,-1],[-3.4,1],[-3.4,-1],[-2.2,1],[-2.2,-1]].forEach(([a,b])=>cylZ(0.45,0.32,M.ink,a,0.45,b*1.15,14,t));return t;}
  function ring(n,cx,cz,r){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return [cx+Math.cos(a)*r,cz+Math.sin(a)*r];});}
  /* ---- the parts: each is built once, hidden, and shown with a level k (1 = the meter, 2 = the event, which is bigger) ---- */
  const BUILD={
    protest(g){const ppl=[],T=["CLEAN AIR\nNOW","OUR\nTOWN","NO MORE\nTRUCKS","MILL:\nLISTEN!","SAVE OUR\nRIVER","HEAR US"];
      for(let i=0;i<12;i++){const p=townie(i),x=GATE[0]-4.5-(i%3)*1.6+Math.random()*0.5,z=-3+Math.floor(i/3)*3.6+(i%3)*0.9;p.position.set(x,0,z);p.rotation.y=0;g.add(p);handSign(p,T[i%T.length],i);ppl.push(p);}
      const bars=[[-5.3],[13]].map(([z])=>{const b=new THREE.Group();b.position.set(GATE[0]-2.6,0,z);g.add(b);box(0.2,0.2,3.2,M.warn,0,1.0,0,b);[-1.4,1.4].forEach(s=>{box(0.12,1.1,0.12,M.ink,0,0.55,s,b,false);});return b;});
      return {spot:[GATE[0]-6,GATE[1]],tick(now,rdt,k){ppl.forEach((p,i)=>{p.visible=i<(k>1?12:7);if(p.visible){pose(p,i%3?"flail":"point",now+i*170);p.position.y=Math.abs(Math.sin(now/260+i))*0.12;}});bars.forEach(b=>b.visible=k>1);}};},
    petition(g){const x=GATE[0]-15,z=18.5,tb=new THREE.Group();tb.position.set(x,0,z);g.add(tb);box(2.4,0.1,1.0,cvM("#e9e4da"),0,0.95,0,tb);[-1,1].forEach(s=>box(0.08,0.95,0.9,M.ink,s*1.05,0.47,0,tb,false));
      box(0.5,0.04,0.36,cvM("#ffffff"),-0.4,1.02,0,tb,false);const a=townie(3),b=townie(6);a.position.set(x-0.3,0,z-1.1);b.position.set(x+1.6,0,z+0.6);a.rotation.y=Math.PI/2;b.rotation.y=Math.PI;g.add(a,b);
      const sg=easel(g,x-3,z-0.4,0,2.6,1.4);return {spot:[x,z],tick(now,rdt,k,txt){sg.userData.set(txt||"SIGN THE\nPETITION","#ffe066","#1c2233","#1c2233");pose(a,"inspect",now);pose(b,"phone",now);}};},
    gateBanner(g){const cx=GATE[0]-4,z=17.5,x0=cx-5,x1=cx+5;[x0,x1].forEach(x=>box(0.25,5.4,0.25,M.ink,x,2.7,z,g));const b=cvBoard(x1-x0-0.4,1.8,512);b.position.set(cx,4.4,z+0.15);g.add(b);
      const balloons=[];for(let i=0;i<8;i++){const s=new THREE.Mesh(sphereG,cvM(["#e84393","#f2b51d","#2ec4b6","#e4572e"][i%4]));s.scale.set(0.42,0.52,0.42);g.add(s);balloons.push([s,i<4?x0:x1,i]);}
      return {spot:[cx,z-2],tick(now,rdt,k,txt){b.userData.set(txt||"PROUD OF OUR MILL","#1f8a4c","#ffffff","#f2b51d");
        balloons.forEach(([s,x,i])=>{s.position.set(x+((i%4)-1.5)*0.45,6+(i%4)*0.55+Math.sin(now/500+i*1.7)*0.2,z+Math.sin(now/700+i)*0.3);});}};},
    picket(g){const ppl=[],T=["ON\nSTRIKE","FAIR\nSHIFTS","SAFE\nSTAFFING","WE RUN\nTHIS MILL"];const X=FENCE.x1+3.5;
      for(let i=0;i<8;i++){const p=worker(cvM(["#3e5f8a","#5b6270","#7d4e2b"][i%3]),M.warn);g.add(p);handSign(p,T[i%4],i+1);ppl.push(p);}
      const barrel=new THREE.Mesh(new CylG(0.45,0.45,1.1,14),cvM("#5b6270"));barrel.position.set(X+3,0.55,24);barrel.castShadow=true;g.add(barrel);
      return {spot:[X,31],tick(now,rdt,k){ppl.forEach((p,i)=>{p.visible=i<(k>1?8:5);if(!p.visible)return;const z=26+((now/1000*1.1+i*1.9)%14);const back=Math.floor((now/1000*1.1+i*1.9)/14)%2;
          const zz=back?40-(z-26):z;p.position.set(X+(i%2)*2.4,0,zz);p.rotation.y=back?Math.PI/2:-Math.PI/2;pose(p,"walk",now);});
        if(Math.random()<rdt*14)emitA("fire",X+3+R()*0.4,1.25,24+R()*0.4,R()*0.4,1.2,R()*0.4,0.7,0.7,"#ffb03a",0.9);if(Math.random()<rdt*4)emitA("smoke",X+3,1.8,24,R()*0.5,1.5,R()*0.5,2.4,1.4,"#6f7684",0.45);}};},
    bbq(g){const x=44,z=37;const gr=new THREE.Group();gr.position.set(x,0,z);g.add(gr);box(1.3,0.5,0.8,M.ink,0,1.0,0,gr);[-0.5,0.5].forEach(s=>box(0.08,0.9,0.08,M.ink,s,0.45,0,gr,false));
      const tb=new THREE.Group();tb.position.set(x+3.2,0,z+0.6);g.add(tb);box(2.6,0.1,1.1,cvM("#a5743f"),0,0.82,0,tb);[-1,1].forEach(s=>box(2.6,0.08,0.35,cvM("#8c5f33"),0,0.48,s*0.85,tb,false));
      const crew=[0,1,2,3].map(i=>{const p=worker(cvM(["#3e5f8a","#7d4e2b","#5f9e6e","#5b6270"][i]),M.warn);g.add(p);return p;});
      crew[0].position.set(x-1,0,z);crew[0].rotation.y=0;crew[1].position.set(x+2.2,0,z+1.7);crew[1].rotation.y=Math.PI/2;crew[2].position.set(x+4.2,0,z+1.7);crew[2].rotation.y=Math.PI/2;crew[3].position.set(x+3.4,0,z-0.9);crew[3].rotation.y=-Math.PI/2;
      return {spot:[x+2,z],tick(now,rdt){pose(crew[0],"fix",now);pose(crew[1],"relax",now);pose(crew[2],"point",now);pose(crew[3],"look",now);
        if(Math.random()<rdt*6)emitA("smoke",x+R()*0.6,1.4,z+R()*0.4,R()*0.4,1.4,R()*0.4,2.2,1.1,"#c9ced6",0.5);}};},
    huddle(g){const cx=34,cz=35.4,crew=ring(6,cx,cz,1.9).map(([x,z],i)=>{const p=worker(cvM(["#3e5f8a","#7d4e2b","#5f9e6e","#5b6270","#8a6bb8","#b8743a"][i]),M.warn);p.position.set(x,0,z);p.rotation.y=Math.atan2(-(cz-z),cx-x);g.add(p);return p;});
      const cake=new THREE.Group();cake.position.set(cx,0,cz);g.add(cake);box(1.4,0.08,0.9,cvM("#e9e4da"),0,0.9,0,cake);[-0.6,0.6].forEach(s=>box(0.08,0.9,0.8,M.ink,s,0.45,0,cake,false));
      const ck=new THREE.Mesh(new CylG(0.32,0.32,0.3,18),cvM("#f6d6e0"));ck.position.y=1.09;cake.add(ck);
      const sg=easel(g,cx,cz-3.2,0,3,1.5);sg.parent.scale.setScalar(1.35);
      return {spot:[cx,cz],tick(now,rdt,k,txt,o){sg.userData.set(txt||"STAFF\nMEETING","#f4efe2","#1c2233","#1c2233");cake.visible=!!(o&&o.cake);
        crew.forEach((p,i)=>{pose(p,o&&o.cheer?"flail":["look","point","look","phone","look","look"][i],now+i*230);p.position.y=o&&o.cheer?Math.abs(Math.sin(now/240+i))*0.25:0;});
        if(o&&o.cheer&&Math.random()<rdt*10)emitA("chip",cx+R()*2,4+Math.random()*2,cz+R()*2,R()*3,2+Math.random()*3,R()*3,2.2,0.32,["#e84393","#f2b51d","#2ec4b6","#4a78b8"][(Math.random()*4)|0],1);}};},
    newsvan(g){const x=GATE[0]-8,z=-10;const v=new THREE.Group();v.position.set(x,0,z);g.add(v);box(5.2,2.4,2.2,cvM("#f4efe2"),0,1.5,0,v);box(1.4,1.6,2.1,cvM("#f4efe2"),3.1,1.1,0,v);box(0.06,0.8,1.8,M.wind,3.82,1.5,0,v,false);
      [[-1.6,1],[-1.6,-1],[2.6,1],[2.6,-1]].forEach(([a,b])=>cylZ(0.42,0.3,M.ink,a,0.42,b*1.1,14,v));const dish=new THREE.Mesh(new SphG(0.8,16,8,0,Math.PI*2,0,Math.PI/2.5),cvM("#c9ced6"));dish.position.set(-1,3.1,0);dish.rotation.z=0.8;v.add(dish);
      const lg=cvBoard(3.4,0.9,256);lg.userData.set("NEWS 7","#d6382c","#ffffff");lg.position.set(0,1.7,1.12);v.add(lg);const lg2=lg.clone();lg2.position.z=-1.12;lg2.rotation.y=Math.PI;v.add(lg2);
      const rep=townie(1),cam=townie(7);rep.position.set(x+5.5,0,z+2.6);cam.position.set(x+2.6,0,z+3.2);rep.rotation.y=Math.PI*0.75;cam.rotation.y=0;g.add(rep,cam);
      const camBox=new THREE.Mesh(cubeG,M.ink);camBox.scale.set(0.5,0.35,0.3);camBox.position.set(0.3,1.75,0.32);cam.userData.torso.add(camBox);
      return {spot:[x,z],tick(now){pose(rep,"point",now);pose(cam,"look",now);dish.rotation.y=Math.sin(now/3000)*0.4;}};},
    board(g){const x=16,z=42;[-4,4].forEach(s=>box(0.3,6,0.3,M.ink,x+s,3,z,g));const b=cvBoard(10,4.4,512);b.position.set(x,5.6,z+0.2);g.add(b);box(10.4,4.8,0.25,M.ink,x,5.6,z,g);
      return {spot:[x,z],tick(now,rdt,k,txt,o){const c=(o&&o.col)||"amber",C={amber:["#2a2f3c","#ffb020"],red:["#2a2f3c","#ff5a4d"],green:["#173d2a","#7fe0a3"]}[c];b.userData.set(txt||"ORDERS ▼",C[0],C[1],C[1]);}};},
    rival(g){const x=GATE[0]-16,z=29;[-3.6,3.6].forEach(s=>box(0.3,6.5,0.3,M.ink,x+s,3.2,z,g));const b=cvBoard(8.4,4.2,512);b.position.set(x,5.6,z+0.2);g.add(b);box(8.8,4.6,0.25,M.ink,x,5.6,z,g);
      b.userData.set("RIVERSIDE PAPER\nNOW 10% CHEAPER","#1d4f91","#ffffff","#ffd44a");return {spot:[x,z],tick(){}};},
    beacons(g){const L=[];for(let i=0;i<6;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#ffffff"),transparent:true,depthWrite:false,toneMapped:false}));s.position.set(-8+i*11,10.6,i%2?2.6:15.4);g.add(s);
        box(0.22,10,0.22,M.ink,s.position.x,5,s.position.z,g,false);box(0.5,0.4,0.5,M.ink,s.position.x,10.2,s.position.z,g,false);L.push(s);}
      const C={red:lin("#ff3b30"),amber:lin("#ffb020"),green:lin("#38d27a")};
      return {spot:[19,9],tick(now,rdt,k,txt,o){const c=(o&&o.col)||"amber",fast=c==="red"?180:c==="amber"?420:900;L.forEach((s,i)=>{s.material.color.copy(C[c]);const on=c==="green"?0.75+0.25*Math.sin(now/600+i):(((now/fast)|0)+i)%2;s.scale.setScalar(on?2.6:0.9);});}};},
    leaks(g){const P=[[-2,8.2,8.2],[14,8.4,10],[30,8.2,8.2],[44,7.6,10]],pud=P.map(([x,,z])=>{const m=new THREE.Mesh(new CircG(1,24),FM.water);m.rotation.x=-Math.PI/2;m.position.set(x,0.09,z+(z>9?2:-2));m.scale.setScalar(1.6);g.add(m);return m;});
      return {spot:[20,9],tick(now,rdt,k){P.forEach(([x,y,z],i)=>{for(let q=0;q<2;q++)if(Math.random()<rdt*(k>1?22:12)*CPH)emitA("steam",x+R(),y,z+R(),R()*1.2,1.6+Math.random(),R()*1.2,2.2,3+Math.random()*1.8,"#cfd6de",0.9);
          if(Math.random()<rdt*8*CPH)emitA("drop",x+R()*0.6,3,z+(z>9?2:-2),0,-1,0,0.6,0.3,"#8fc3e0",0.9);
          if(k>1&&Math.random()<rdt*3){for(let q=0;q<8;q++)emitA("spark",x,1.2,z+(z>9?3.5:-3.5),R()*6,2+Math.random()*4,R()*6,0.5,0.28,"#ffb23e",1);}});pud.forEach((m,i)=>m.scale.setScalar(1.5+0.15*Math.sin(now/900+i)));}};},
    fish(g){const RZ=riverAt(0),zs=RZ[0]+RZ[1]-3,fm=cvM("#d9dee4"),F=[];for(let i=0;i<22;i++){const f=new THREE.Mesh(sphereG,fm);f.scale.set(0.8,0.2,0.3);f.position.set(-14+Math.random()*30,0.12,zs-Math.random()*7);f.rotation.y=Math.random()*6;g.add(f);F.push(f);}
      const a=townie(2),b=townie(8);a.position.set(-4,0,zs+7);b.position.set(-1.5,0,zs+7.6);a.rotation.y=b.rotation.y=Math.PI/2;g.add(a,b);
      return {spot:[0,zs],tick(now){F.forEach((f,i)=>{f.position.y=0.1+Math.sin(now/700+i)*0.05;f.rotation.z=Math.sin(now/900+i)*0.2;});pose(a,"point",now);pose(b,"phone",now);}};},
    noise(g){const R0=[];const rm=new THREE.MeshBasicMaterial({color:lin("#ffd44a"),transparent:true,opacity:0.6,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
      for(let i=0;i<3;i++){const r=new THREE.Mesh(new RingG(0.92,1,48),rm.clone());r.rotation.x=-Math.PI/2;r.position.set(-72,1.2+i*0.1,-16);g.add(r);R0.push(r);}
      return {spot:[-72,-16],tick(now){R0.forEach((r,i)=>{const p=((now/2200)+i/3)%1;r.scale.setScalar(4+p*36);r.material.opacity=0.6*(1-p);});}};},
    inspector(g){const a=worker(cvM("#f4efe2"),cvM("#ffffff")),b=worker(cvM("#3e5f8a"),M.warn);g.add(a,b);a.position.set(-4,0,2.6);b.position.set(-6,0,2.2);const st={x:-4,dir:1,stop:0};
      return {spot:[18,4],tick(now,rdt){if(st.stop>0){st.stop-=rdt;pose(a,"inspect",now);pose(b,"point",now);face(a,st.x,9,rdt);face(b,st.x,9,rdt);return;}
        st.x+=st.dir*rdt*1.6;if(st.x>46||st.x<-4){st.dir*=-1;}if(Math.random()<rdt*0.25)st.stop=3+Math.random()*3;a.position.x=st.x;b.position.x=st.x-st.dir*2;a.rotation.y=b.rotation.y=st.dir>0?0:Math.PI;pose(a,"walk",now);pose(b,"walk",now+200);}};},
    recruiter(g){const x=FENCE.x1+7,z=19;const car=new THREE.Group();car.position.set(x,0,z);car.rotation.y=Math.PI/2;g.add(car);box(4.2,0.9,1.8,cvM("#111418"),0,0.7,0,car);box(2.3,0.75,1.66,cvM("#111418"),-0.2,1.45,0,car);box(2.2,0.6,1.7,M.wind,-0.2,1.45,0,car,false);
      [[-1.3,1],[-1.3,-1],[1.3,1],[1.3,-1]].forEach(([a,b])=>cylZ(0.36,0.25,M.ink,a,0.36,b*0.85,14,car));const p=townie(9);p.position.set(x-2,0,z+2.6);p.rotation.y=Math.PI;g.add(p);handSign(p,"NOW HIRING\n$$$",1);
      return {spot:[x,z],tick(now){pose(p,"point",now);}};},
    tagout(g){const zn=zone(g,-6,56,4.4,13.8),sg=easel(g,26,25.5,0,3.6,1.7);sg.userData.set("LOCKED OUT\nINSURER ORDER","#d6382c","#ffffff","#ffffff");return {spot:[20,9],tick(now){zn(now);}};},
    queue(g){const T=[["#1d4f91",0],["#d6382c",1],["#1f8a4c",2],["#f2b51d",3]].map(([c,i])=>simpleTruck(g,c,GATE[0]-12-i*10.5,12.6,0));return {spot:[GATE[0]-20,12],tick(now,rdt,k){T.forEach((t,i)=>t.visible=i<(k>1?4:3));}};},
    signWh(g){const s=easel(g,-60,36,0);return {spot:[-60,30],tick(now,rdt,k,txt){s.userData.set(txt||"QUALITY HOLD","#ffe066","#1c2233","#1c2233");}};},
    signGate(g){const s=easel(g,FENCE.x0+7,-9.5,0,3,1.6);return {spot:[FENCE.x0+7,-9.5],tick(now,rdt,k,txt){s.userData.set(txt||"NOTICE","#f4efe2","#1c2233","#1c2233");}};},
    signHall(g){const s=easel(g,-12,24.5,0,3.4,1.7);return {spot:[-12,22],tick(now,rdt,k,txt,o){const c=(o&&o.col)||"cream",C={cream:["#f4efe2","#1c2233"],red:["#d6382c","#ffffff"],green:["#1f8a4c","#ffffff"]}[c];s.userData.set(txt||"NOTICE",C[0],C[1],C[1]);}};},
    // particle-only scenes (no meshes; the group is empty)
    fx(g){return {spot:[0,0],tick(){}};}};
  const PART_IDS=Object.keys(BUILD).filter(k=>k!=="fx");
  // built a few scenes per frame during the start-up precompile (v5.2 review: all at once stalled the page for seconds on
  // slow devices, and the title music with it); civBuild() finishes whatever is left in one go
  const toBuild=G3.bare?[]:[...PART_IDS];   // (v5.7.3 bare: no civics scenery in the world)
  function buildOne(id){try{const g=new THREE.Group();g.visible=false;scene.add(g);const P=CV.parts[id]=Object.assign({g,id},BUILD[id](g));
      P.tick(performance.now(),0,2,null,{});   // a first paint of its boards, so their textures upload before play
    }catch(e){diag(`civics scene "${id}" failed: ${String(e&&e.message||e).slice(0,100)}`);}}
  G3.civBuildStep=t0=>{while(toBuild.length&&performance.now()-t0<8)buildOne(toBuild.shift());if(!toBuild.length)CV.built=true;return CV.built;};
  function civBuild(){while(toBuild.length)buildOne(toBuild.shift());CV.built=true;}
  G3.civBuild=civBuild;
  G3.civShowAll=shown=>{civBuild();for(const id in CV.parts){const g=CV.parts[id].g;if(!g.visible){g.visible=true;shown.push(g);}}};
  /* ---- what is wanted: the meters (priority 1) and the civic events (priority 2) ---- */
  // event → parts: [part, k, text, options]
  const EVP={
    odor:[["fx",1,null,{odor:1}]],council:[["petition",2,"NO TRUCKS\nON MAIN ST"]],reporter:[["newsvan",2]],sponsor:[["gateBanner",2,"TOWN FAIR · SPONSOR WANTED"]],
    hothall:[["fx",1,null,{heat:1}]],retire:[["huddle",2,"HAPPY\nRETIREMENT!",{cake:1,cheer:1}]],nearmiss:[["huddle",2,"SAFETY\nSTAND-DOWN"],["signWh",2,"DOCK CLOSED\nGUARD AUDIT"]],
    complaint:[["signWh",2,"QUALITY HOLD\nCUSTOMER CLAIM"]],rush:[["queue",2],["signGate",2,"RUSH ORDER\n900 t"]],pricecut:[["rival",2]],green:[["signHall",2,"RECYCLED-CONTENT\nAUDIT TODAY",{col:"green"}],["fx",1,null,{green:1}]],
    occshort:[["signGate",2,"OCC SHORT\nTHIS WEEK"]],chemlate:[["signHall",2,"WAITING ON\nRETENTION AID"]],energyspike:[["board",2,"POWER PRICES ▲",{col:"amber"}],["fx",1,null,{zap:1}]],
    flu:[["fx",1,null,{lot:0.7}]],poach:[["recruiter",2]],inspector:[["inspector",2]],dcs:[["beacons",2,null,{col:"red"}],["signHall",2,"CONTROL SYSTEM\nDOWN",{col:"red"}]],
    moisture:[["fx",1,null,{steam:1}]],freight:[["queue",1],["board",2,"FREIGHT RATES ▲",{col:"amber"}]],noise:[["noise",2]],fishkill:[["fish",2]],
    w_sickout:[["fx",1,null,{lot:0.4}],["signHall",2,"SHORT SHIFTS\nTODAY"]],w_petition:[["petition",2]],w_watch:[["board",2,"KEY CUSTOMER:\nON WATCH",{col:"amber"}]],
    w_vibration:[["leaks",2],["beacons",2,null,{col:"amber"}]],
    c_walkout:[["picket",2],["fx",1,null,{lot:0.15}]],c_protest:[["protest",2]],c_custwalk:[["board",2,"KEY CUSTOMER\nLOST",{col:"red"}],["rival",2]],
    c_shutdown:[["tagout",2],["beacons",2,null,{col:"red"}]],
    r_L:[["huddle",2,"THANK YOU\nCREW!",{cheer:1}]],r_C:[["gateBanner",2,"THANK YOU, NEIGHBORS"],["fx",1,null,{fireworks:1}]],r_E:[["queue",2],["board",2,"NEW LONG-TERM\nCONTRACT ▲",{col:"green"}]],
    r_M:[["beacons",2,null,{col:"green"}],["signHall",2,"RECORD RUN\nWEEK!",{col:"green"}],["fx",1,null,{confetti:1}]]};
  // meter band → parts
  const MTP={
    C:{sn:[["petition",1]],cr:[["protest",1]],ex:[["gateBanner",1]]},
    L:{sn:[["huddle",1],["fx",1,null,{lot:0.6}]],cr:[["picket",1],["fx",1,null,{lot:0.3}]],ex:[["bbq",1]]},
    M:{sn:[["leaks",1],["beacons",1,null,{col:"amber"}]],cr:[["leaks",2],["beacons",1,null,{col:"red"}]],ex:[["beacons",1,null,{col:"green"}]]},
    E:{sn:[["board",1,"ORDERS ▼",{col:"amber"}]],cr:[["board",1,"CUSTOMERS\nLEAVING ▼▼",{col:"red"}],["rival",1]],ex:[["board",1,"RECORD ORDERS ▲",{col:"green"}],["queue",1]]}};
  const WINK={sn:0.55,cr:0.25};
  const LINGER=240;   // sim minutes an event's scene stays after its card (events with a running effect stay while it runs)
  const bandOf=v=>v<CIV.crisis?"cr":v<CIV.warn?"sn":v>CIV.reward?"ex":null;
  function evActive(){const V=S.civ,on=[];if(!V)return on;const seen=CV.seen;
    const mark=id=>{const s=seen[id];if(s)s.t=S.t;else seen[id]={t:S.t,t0:S.t};};   // (updated in place)
    for(const f of S.fx)if(f&&f.civ){const id=f.id==="c_walkout2"?"c_walkout":f.id;if(EVP[id])mark(id);}
    if(V.cur&&EVP[V.cur.id])mark(V.cur.id);
    if(V.pending&&V.pending.d&&EVP[V.pending.d.id])mark(V.pending.d.id);
    for(const q of V.q)if(q.applied&&EVP[q.id])mark(q.id);
    if(G3.civTestIds)for(const id of G3.civTestIds)if(EVP[id])mark(id);   // (test hook: show an event's scene)
    for(const id in seen){const s=seen[id];if(S.t-s.t<=LINGER&&S.t>=s.t)on.push(id);else delete seen[id];}
    return on.sort((a,b)=>seen[b].t0-seen[a].t0);}   // newest first: its words win on a shared board
  // what to show: the meters (priority 1) and the civic events (priority 2); worked out 4 times a second, not every frame
  function computeWant(){const want={};let winK=1;
    const put=(L,pri)=>{for(const [id,k,txt,o] of L){if(id==="fx"){const w=want.fx||(want.fx={k:1,pri:0,o:{}}),pl=w.o.lot;Object.assign(w.o,o||{});if(o&&o.lot!=null)w.o.lot=Math.min(pl??1,o.lot);continue;}
      const w=want[id];if(!w||pri>w.pri||(pri===w.pri&&k>w.k))want[id]={k:Math.max(k,w?w.k:0),pri,txt:txt||null,o:o||null};else w.k=Math.max(w.k,k);}};
    const on=!!(S&&S.civ&&civOn()&&!G3.zen);let evs=null;
    if(on){for(const k of CIVK){const b=bandOf(S.civ.m[k]);if(b&&MTP[k][b])put(MTP[k][b],1);if(k==="C"&&WINK[b])winK=WINK[b];}
      evs=evActive();for(const id of evs)put(EVP[id],2);}
    want.winK=winK;want.evs=evs;return want;}
  /* ---- camera pull ---- */
  const PULL={on:null,touch:0,last:-1e9,incSeen:new WeakSet(),civSeen:{},pend:null};
  // (a pull carrying a choice card hands the card over whenever it ends early, so the card always opens)
  const handCard=P=>{if(P&&P.card){const f=P.card;P.card=null;f();}};
  const touched=()=>{PULL.touch=performance.now();if(PULL.on&&PULL.on.phase!=="back"){handCard(PULL.on);PULL.on=null;}};
  ["pointerdown","wheel","touchstart"].forEach(t=>host.addEventListener(t,touched,{passive:true}));glc.addEventListener("keydown",touched);
  const MAJOR=new Set(["dryerfire","balefire","shaft","tornado","lightning","flood","overflow","chestover","hdblow","thkblow","beaver","fight","flares","refclash",
    "c_walkout","c_protest","c_custwalk","c_shutdown","dcs","fishkill","r_L","r_C","r_E","r_M"]);
  function civSpot(id){const L=EVP[id];if(!L)return null;const p=CV.parts[L[0][0]];return p&&L[0][0]!=="fx"?p.spot:null;}
  const pullBlocked=()=>!camPullOn()||G3.rounding||S.zen||G3.zen||G3.cineOn||(G3.tut&&G3.tut.on)||(G3.following&&G3.following())||(S.outg&&S.outg.watch);
  function pullTo(id,card){const now=performance.now();if(pullBlocked()||!G3.on)return false;
    if(now-PULL.touch<5000||now-PULL.last<12000||PULL.on)return false;const sp=G3.spotOf(id)||civSpot(id);if(!sp)return false;
    const c=G3.camGet(),to=[sp[0],sp[1],Math.min(90,Math.max(55,c[2]*0.4)),c[3],0.9];
    PULL.last=now;PULL.on={id,back:c,to,t:now,phase:"go",card:card||null};G3.camGlide(to);diag("camera: fly to "+id+(card?" (then its card)":""));return true;}
  // v5.4: a major upset's choice card pauses the game at once; the camera flies there first and the card opens on arrival
  G3.civPullCard=(id,show)=>{if(!MAJOR.has(id)||!CV.built)return false;if(S&&S.inc)for(const inc of S.inc)if(inc.id===id)PULL.incSeen.add(inc);return pullTo(id,show);};
  // go: glide there; hold: about 4 s once it arrives (or after 4 s of gliding at most); back: glide home. A pull asked for
  // while the game is paused (a crisis opens its choice card at once) waits until play resumes.
  function pullTick(){const now=performance.now();
    if(PULL.pend&&!PULL.on&&running&&!(S.cards&&S.cards.open)){const id=PULL.pend;PULL.pend=null;pullTo(id);}
    const P=PULL.on;if(!P)return;if(G3.cineOn){handCard(P);PULL.on=null;return;}   // (the bird cut-scene takes the camera and puts it back itself)
    if(P.phase==="go"){const c=G3.camGet(),near=Math.hypot(c[0]-P.to[0],c[1]-P.to[1])<4&&Math.abs(c[2]-P.to[2])<8;if(near||now-P.t>(P.card?2500:4000)){P.phase="hold";P.t=now;handCard(P);}}
    else if(P.phase==="hold"&&(!running||(S.cards&&S.cards.open)))P.t=now;   // (the hold waits while a card is open)
    else if(P.phase==="hold"&&now-P.t>4000){P.phase="back";P.t=now;G3.camGlide(P.back);}   // (a touch or key during go or hold cancels the pull: the view stays where the player put it)
    else if(P.phase==="back"&&now-P.t>2500)PULL.on=null;}
  // a run starting or coming back: whatever is already going on doesn't pull the camera (called from play(), 51)
  G3.civReset=()=>{const evs=S&&S.civ&&civOn()?evActive():[];for(const k in PULL.civSeen)delete PULL.civSeen[k];for(const id of evs)PULL.civSeen[id]=1;
    if(S&&S.inc)for(const inc of S.inc)PULL.incSeen.add(inc);PULL.pend=null;PULL.on=null;CV.wantT=-1e9;};
  G3.civSpots=()=>{const o={};for(const id in CV.parts)o[id]=CV.parts[id].spot;return o;};   // (test hook)
  /* ---- every frame ---- */
  const lot={k:1},NOFX={};
  G3.civTick=(rdt,now)=>{if(!CV.built)return;
    if(now-CV.wantT>250){CV.wantT=now;CV.want=computeWant();const evs=CV.want.evs;
      // camera pulls: a new major civic event, or a new major upset
      if(evs){for(const id of evs)if(!PULL.civSeen[id]){PULL.civSeen[id]=1;if(MAJOR.has(id))PULL.pend=id;}for(const id in PULL.civSeen)if(!evs.includes(id))delete PULL.civSeen[id];}
      if(S&&S.inc&&!G3.zen)for(const inc of S.inc){if(PULL.incSeen.has(inc))continue;PULL.incSeen.add(inc);if(MAJOR.has(inc.id)&&running)PULL.pend=inc.id;}}
    const want=CV.want;pullTick();
    for(const id in CV.parts){const p=CV.parts[id],w=want[id];if(!w){if(p.g.visible)p.g.visible=false;continue;}p.g.visible=true;
      try{p.tick(now,rdt,w.k,w.txt,w.o);}catch(e){if(!p.err){p.err=1;diag("civics scene "+id+": "+String(e&&e.message||e).slice(0,80));}}}
    // the town's lit windows and the car park
    G3.civWinK=want.winK||1;const f=want.fx&&want.fx.o||NOFX;const lk=f.lot??1;lot.k+=(lk-lot.k)*Math.min(1,rdt*0.5);G3.civLotK=lot.k;
    if(f===NOFX)return;
    // particle scenes (through emitA: they never crowd out a real upset's fire and smoke)
    if(f.odor&&Math.random()<rdt*10*CPH)emitA("smoke",4+Math.random()*24,1.5+Math.random()*2.5,-14+R()*8,0.6+Math.random()*0.6,0.25,0.8+Math.random(),6,7+Math.random()*5,"#8a9a4e",0.55);
    if(f.heat&&Math.random()<rdt*16*CPH)emitA("steam",-4+Math.random()*50,0.6+Math.random()*2,Math.random()<0.5?2+Math.random()*2.5:8+Math.random()*2,R()*0.3,0.7,R()*0.3,2.5,3,"#ffa45c",0.4);
    if(f.steam&&Math.random()<rdt*20*CPH)emitA("steam",-6+Math.random()*30,8+Math.random()*1.5,9.1+R()*4,R(),1.6,R(),2.6,3.4,"#cfd6de",0.85);
    if(f.green&&Math.random()<rdt*12)emitA("spark",Math.random()*30,4+Math.random()*4,-14+R()*8,R()*1.5,1.5,R()*1.5,1.4,0.35,"#7fe0a3",0.9);
    if(f.zap){const u=G3.scenery&&G3.scenery.util&&G3.scenery.util.substation,sx=u?u[0]:74,sz=u?u[1]:-10;if(Math.random()<rdt*6)for(let q=0;q<14;q++)emitA("spark",sx+R()*3,7+Math.random()*3,sz+R()*3,R()*9,2+Math.random()*7,R()*9,0.6,0.42,"#9fd4ff",1);}
    if(f.confetti&&Math.random()<rdt*14)emitA("chip",-4+Math.random()*50,9+Math.random()*3,9+R()*10,R()*3,1+Math.random()*2,R()*3,2.4,0.4,["#e84393","#f2b51d","#2ec4b6","#4a78b8","#7fe0a3"][(Math.random()*5)|0],1);
    if(f.fireworks&&Math.random()<rdt*0.9){const fx=GATE[0]-10+R()*20,fy=26+Math.random()*10,fz=GATE[1]+R()*20,c=["#ff5fa2","#ffd44a","#7fe0a3","#9fd4ff"][(Math.random()*4)|0];
      for(let q=0;q<40;q++){const a=Math.random()*6.28,b=Math.random()*3.14,v=6+Math.random()*3;emitA("spark",fx,fy,fz,Math.cos(a)*Math.sin(b)*v,Math.cos(b)*v,Math.sin(a)*Math.sin(b)*v,1.3,0.45,c,1);}}};
