  /* ---- step 1: static plant ---- */
  const grassM=new StdMat({color:lin0("#b4cf9f"),roughness:0.95});
  slab(-400,400,-300,300,grassM,0);
  slab(-140,-95,-5.2,-2.4,M.asphalt);slab(-140,-95,11.2,13.8,M.asphalt);
  slab(-95,-34.4,-5.2,-2.4,M.asphalt);              // inbound road
  slab(-53,-34.4,-24.5,-2.4,M.asphalt,0.03);        // receiving apron
  slab(-95,-49,11.2,13.8,M.asphalt);                // outbound road
  slab(-67,-49,11.2,33,M.asphalt,0.03);             // shipping apron
  slab(-27.2,64,3,14.8,M.slab,0.03);slab(-23.8,64,14.8,19.85,M.slab,0.03);slab(-27.2,-2.9,-2.9,3,M.slab,0.031); // machine hall floor + reel bay along the back
  slab(4,47,-25,-2,M.slab,0.03);                    // stock prep pad
  for(let x=-92;x<-36;x+=4)box(2,0.02,0.16,M.lane,x,0.05,-3.8,scene,false);
  for(let x=-92;x<-50;x+=4)box(2,0.02,0.16,M.lane,x,0.05,12.5,scene,false);
  for(let x=-138;x<-94;x+=4){box(2,0.02,0.16,M.lane,x,0.05,-3.8,scene,false);box(2,0.02,0.16,M.lane,x,0.05,12.5,scene,false);}
  /* ======== the site outside the buildings ======== */
  const SITE={x0:-100,x1:92,z0:-52,z1:64};
  const ENV={};
  const wood=new StdMat({color:lin0("#9a7350"),roughness:0.9}),conc=mat("g-wall",{roughness:0.8});
  // perimeter fence with gaps for the roads, the rail spur and the food-truck gate
  {const fc=document.createElement("canvas");fc.width=fc.height=32;const x=fc.getContext("2d");x.strokeStyle="rgba(90,98,112,.9)";x.lineWidth=1.4;x.beginPath();x.moveTo(0,0);x.lineTo(32,32);x.moveTo(32,0);x.lineTo(0,32);x.stroke();
    const ft=new THREE.CanvasTexture(fc);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;const fm=new THREE.MeshBasicMaterial({map:ft,transparent:true,opacity:0.55,side:THREE.DoubleSide,depthWrite:false});
    const posts=[],H2=2.4;
    function run(ax,az,bx,bz){const L=Math.hypot(bx-ax,bz-az);if(L<0.5)return;const t=fm.clone();t.map=ft.clone();t.map.needsUpdate=true;t.map.repeat.set(L/1.2,H2/1.2);
      const pl=new THREE.Mesh(new THREE.PlaneGeometry(L,H2),t);pl.position.set((ax+bx)/2,H2/2,(az+bz)/2);pl.rotation.y=-Math.atan2(bz-az,bx-ax);scene.add(pl);
      pipe([[ax,H2,az],[bx,H2,bz]],0.05,M.metal);for(let k=0;k<=Math.ceil(L/4);k++){const f=k/Math.ceil(L/4);posts.push([ax+(bx-ax)*f,az+(bz-az)*f]);}}
    const W0=SITE.x0,W1=SITE.x1,Z0=SITE.z0,Z1=SITE.z1;
    run(W0,Z0,W1,Z0);run(W0,Z1,W1,Z1);
    [[Z0,-37.4],[-33.6,-31],[-27,-6],[-1.6,10.4],[14.6,Z1]].forEach(([a,b])=>run(W0,a,W0,b));
    [[Z0,30.5],[34.5,Z1]].forEach(([a,b])=>run(W1,a,W1,b));
    const pg=new CylG(0.08,0.08,2.6,6),pm=new THREE.InstancedMesh(pg,M.metal,posts.length),m4=new THREE.Matrix4();
    posts.forEach((p,k)=>{m4.makeTranslation(p[0],1.3,p[1]);pm.setMatrixAt(k,m4);});scene.add(pm);}
  // guard gate between the two roads, with boom barriers
  {const gx=SITE.x0-1.5,gz=4.4;box(3,2.6,3,conc,gx,1.3,gz);box(3.4,0.25,3.4,M.brand,gx,2.75,gz);box(3.02,0.8,2.2,M.wind,gx,1.75,gz,scene,false);
    const sc=document.createElement("canvas");sc.width=128;sc.height=8;const x=sc.getContext("2d");for(let i=0;i<8;i++){x.fillStyle=i%2?"#ffffff":"#e0343c";x.fillRect(i*16,0,16,8);}
    const st=new THREE.CanvasTexture(sc);st.colorSpace=THREE.SRGBColorSpace;const bm=new StdMat({map:st,roughness:0.6});
    [[-1.6,1],[14.6,-1]].forEach(([z,dir])=>{box(0.5,1.1,0.5,M.ink,SITE.x0,0.55,z,scene,false);const arm=new THREE.Group();arm.position.set(SITE.x0,1.05,z);scene.add(arm);
      const a=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.16,4.2),bm);a.position.z=-dir*2.1;arm.add(a);arm.rotation.x=dir*1.15;});
    ENV.gate=[gx,gz];}
  // truck scale where the inbound queue stops, with a scale house and a weight display
  {box(8,0.14,3.0,M.steel,-40.7,0.07,-3.8,scene,false);[-4,4].forEach(dx=>box(0.12,0.16,3.0,M.lane,-40.7+dx,0.09,-3.8,scene,false));
    box(3.2,2.6,2.4,conc,-41,1.3,-0.4);box(3.5,0.22,2.7,M.brand,-41,2.7,-0.4);box(2.2,0.8,0.08,M.wind,-41,1.7,-1.62,scene,false);
    const dc=document.createElement("canvas");dc.width=256;dc.height=80;const dt2=new THREE.CanvasTexture(dc);dt2.colorSpace=THREE.SRGBColorSpace;
    const dm=new THREE.Mesh(new THREE.PlaneGeometry(2.4,0.75),new THREE.MeshBasicMaterial({map:dt2,toneMapped:false}));dm.position.set(-37.2,2.4,-1.95);dm.rotation.y=Math.PI;scene.add(dm);box(0.12,2.2,0.12,M.ink,-37.2,1.1,-1.95,scene,false);
    ENV.scale={ctx:dc.getContext("2d"),tex:dt2,last:""};}
  // river along the back with banks, an intake pump house and an outfall
  {const rc=document.createElement("canvas");rc.width=rc.height=128;const x=rc.getContext("2d");x.fillStyle="#7fb0cf";x.fillRect(0,0,128,128);x.strokeStyle="rgba(255,255,255,.35)";x.lineWidth=2;
    for(let k=0;k<10;k++){x.beginPath();const y=k*13+4;for(let i=0;i<=128;i+=8)x.lineTo(i,y+3*Math.sin(i/12+k));x.stroke();}
    const rt=new THREE.CanvasTexture(rc);rt.colorSpace=THREE.SRGBColorSpace;rt.wrapS=rt.wrapT=THREE.RepeatWrapping;rt.repeat.set(40,1.5);ENV.riverTex=rt;
    const sand=new StdMat({color:lin0("#d9cba6"),roughness:1});slab(-400,400,-75,-57,sand,0.006);
    slab(-400,400,-72,-60,new StdMat({map:rt,roughness:0.15,metalness:0.1}),0.012);
    box(4,3,4,conc,-30,1.5,-55.5);box(4.4,0.3,4.4,M.brand,-30,3.1,-55.5);pipe([[-30,0.8,-57.5],[-30,0.8,-59],[-30,-0.5,-61]],0.35,M.metal);
    // fresh water from the river intake, up and over into the stock line that feeds the cleaners and screens on to stock storage
    {const fw=mat("water",{roughness:0.4});pipe([[-30,0.7,-53.5],[-30,0.7,-31.5],[-4,0.7,-31.5],[-4,0.7,-25.7],[4,0.7,-25.7],[4,6.0,-25.7],[11.2,6.0,-25.7],[11.2,6.0,-23.3]],0.32,fw);
     [[4,0.7,-25.7],[4,6.0,-25.7],[11.2,6.0,-25.7]].forEach(([x,y,z])=>{const b=new THREE.Mesh(new SphG(0.34,12,8),fw);b.position.set(x,y,z);scene.add(b);});
     const tee=new THREE.Mesh(new CylG(0.36,0.36,0.5,12),M.steel);tee.rotation.x=Math.PI/2;tee.position.set(11.2,6.0,-23.25);scene.add(tee);
     const vb=new THREE.Mesh(new CylG(0.42,0.42,0.5,12),M.steel);vb.rotation.z=Math.PI/2;vb.position.set(7.6,6.0,-25.7);scene.add(vb);
     const hw=new THREE.Mesh(new THREE.TorusGeometry(0.32,0.05,6,16),M.bad);hw.rotation.x=Math.PI/2;hw.position.set(7.6,6.75,-25.7);scene.add(hw);box(0.08,0.7,0.08,M.ink,7.6,6.4,-25.7,scene,false);
     [4,11.2].forEach(x=>box(0.22,5.6,0.22,M.steel,x+0.6,2.8,-25.7,scene,false));}
    pipe([[32,0.6,-46.5],[32,0.6,-58.5],[32,0.1,-60.5]],0.4,M.metal);ENV.outfall=[32,0.2,-61];}
  // wastewater treatment: clarifier with a turning bridge, aeration pond with aerators
  {const cx=10,cz=-40,r=7;slab(1,46,-49,-31,M.slab,0.025);
    const wall=new THREE.Mesh(new CylG(r,r,2.2,48,1,true),mat("g-wall",{side:THREE.DoubleSide}));wall.position.set(cx,1.1,cz);wall.castShadow=true;scene.add(wall);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(r,0.18,6,48),M.steel);rim.rotation.x=Math.PI/2;rim.position.set(cx,2.2,cz);scene.add(rim);
    ENV.wwM=new StdMat({color:lin0("#86b3a6"),roughness:0.2});ENV.wwBase=lin0("#86b3a6");ENV.wwBad=lin0("#8c6e4b");
    {const t=texC(256,256,(x,W)=>{const c0=W/2;x.fillStyle="#ffffff";x.fillRect(0,0,W,W);
       for(let k=0;k<26;k++){x.strokeStyle=`rgba(90,80,60,${0.05+Math.random()*0.07})`;x.lineWidth=1+Math.random()*2.5;x.beginPath();x.arc(c0,c0,12+k*4.4+Math.random()*2,0,7);x.stroke();}
       for(let k=0;k<5;k++){const a=k/5*Math.PI*2+0.3;x.strokeStyle="rgba(70,60,45,0.12)";x.lineWidth=5;x.beginPath();x.moveTo(c0+Math.cos(a)*20,c0+Math.sin(a)*20);x.lineTo(c0+Math.cos(a+0.25)*124,c0+Math.sin(a+0.25)*124);x.stroke();}
       for(let k=0;k<40;k++){const a=Math.random()*6.28,rr=104+Math.random()*20,g=x.createRadialGradient(c0+Math.cos(a)*rr,c0+Math.sin(a)*rr,0,c0+Math.cos(a)*rr,c0+Math.sin(a)*rr,6+Math.random()*8);g.addColorStop(0,"rgba(120,100,70,0.3)");g.addColorStop(1,"rgba(120,100,70,0)");x.fillStyle=g;x.fillRect(0,0,W,W);}
       const g2=x.createRadialGradient(c0,c0,0,c0,c0,22);g2.addColorStop(0,"rgba(80,70,55,0.35)");g2.addColorStop(1,"rgba(80,70,55,0)");x.fillStyle=g2;x.fillRect(0,0,W,W);},false);
     ENV.wwM2=new StdMat({color:lin0("#86b3a6"),roughness:0.2,map:t});}
    const wtr=new THREE.Mesh(new CircG(r-0.1,48),ENV.wwM2);wtr.rotation.x=-Math.PI/2;wtr.position.set(cx,1.9,cz);scene.add(wtr);
    const well=new THREE.Mesh(new CylG(1,1,2.4,20),M.steel);well.position.set(cx,1.3,cz);scene.add(well);
    ENV.bridge=new THREE.Group();ENV.bridge.position.set(cx,2.5,cz);scene.add(ENV.bridge);box(r,0.35,0.9,M.warn,r/2,0,0,ENV.bridge);box(0.1,1.2,0.6,M.ink,r-0.5,-0.6,0,ENV.bridge,false);
    const px0=22,px1=42,pz0=-46,pz1=-34;[[px0,px1,pz0,pz0],[px0,px1,pz1,pz1],[px0,px0,pz0,pz1],[px1,px1,pz0,pz1]].forEach(([a,b,c,d])=>box(Math.max(0.4,b-a),1.3,Math.max(0.4,d-c),conc,(a+b)/2,0.65,(c+d)/2));
    const pond=new THREE.Mesh(new THREE.PlaneGeometry(px1-px0-0.4,pz1-pz0-0.4),ENV.wwM);pond.rotation.x=-Math.PI/2;pond.position.set((px0+px1)/2,1.0,(pz0+pz1)/2);scene.add(pond);
    ENV.aer=[[27,-42],[37,-42],[27,-38],[37,-38]];ENV.aer.forEach(([x,z])=>{const a=new THREE.Mesh(new CylG(0.7,0.7,0.4,12),M.warn);a.position.set(x,1.15,z);scene.add(a);});
    // effluent transfer tank and pump between stock prep and the clarifier (visual only)
    {const T=[10,-28.6],R=1.45,H=3.4;const tk=new THREE.Mesh(new CylG(R,R,H,24),M.tank);tk.position.set(T[0],H/2,T[1]);tk.castShadow=true;tk.receiveShadow=true;scene.add(tk);
      const lid=new THREE.Mesh(new CylG(R+0.06,R+0.06,0.14,24),M.steel);lid.position.set(T[0],H+0.07,T[1]);scene.add(lid);
      [0.8,2.3].forEach(y=>{const bd=new THREE.Mesh(new CylG(R+0.02,R+0.02,0.1,24,1,true),M.steel);bd.position.set(T[0],y,T[1]);scene.add(bd);});
      box(0.5,0.3,0.5,M.steel,T[0]+0.5,H+0.25,T[1]-0.3,scene,false);box(0.08,2.6,0.08,M.warn,T[0]-R-0.05,1.6,T[1]+0.25,scene,false);box(0.12,0.12,0.12,M.bad,T[0]-R-0.06,2.2,T[1]+0.25,scene,false);
      [-0.3,0.3].forEach(dz=>box(0.06,H+0.9,0.06,M.warn,T[0]+R+0.15,(H+0.9)/2,T[1]+dz,scene,false));for(let y=0.4;y<H+0.6;y+=0.4)box(0.06,0.06,0.6,M.warn,T[0]+R+0.15,y,T[1],scene,false);
      const c=document.createElement("canvas");c.width=256;c.height=48;const x=c.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,256,48);x.fillStyle="#1c2233";x.font="800 24px system-ui,sans-serif";x.textAlign="center";x.fillText("EFFLUENT TRANSFER",128,33);
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.0,0.38),new THREE.MeshBasicMaterial({map:t}));pl.position.set(T[0],2.75,T[1]+R+0.02);scene.add(pl);
      pipe([[10,0.8,-25.2],[10,0.8,-27.2]],0.3,M.stock);
      box(1.1,0.6,0.9,M.brand,11.9,0.45,-30.6,scene);box(0.7,0.55,0.6,M.ink,12.85,0.45,-30.6,scene,false);    // transfer pump and motor
      pipe([[10,0.6,-30.0],[10,0.6,-30.6],[11.4,0.6,-30.6]],0.22,M.stock);pipe([[11.9,0.9,-30.6],[11.9,0.9,-31.4],[10,0.9,-31.4],[10,2.4,-31.4],[10,2.4,-33]],0.26,M.stock);}pipe([[17.1,1.4,-40],[22,1.4,-40]],0.3,M.metal);ENV.ww=[cx,cz];}
  // power house and boiler stack, steam header into the machine hall
  {const x0=70,x1=82,z0=-16,z1=-4,h=9;const b=box(x1-x0,h,z1-z0,conc,(x0+x1)/2,h/2,(z0+z1)/2);edges(b);box(x1-x0+0.4,0.4,z1-z0+0.4,M.brand,(x0+x1)/2,h+0.2,(z0+z1)/2);
    [z0-0.03,z1+0.03].forEach(z=>box(x1-x0-2,1.2,0.1,M.wind,(x0+x1)/2,5.6,z,scene,false));box(0.1,1.2,z1-z0-2,M.wind,x0-0.03,5.6,(z0+z1)/2,scene,false);
    box(0.12,3,2.2,M.ink,x0-0.05,1.5,-10,scene,false);
    const stT=texC(128,512,(x,W,H)=>{x.fillStyle="#f3f2ef";x.fillRect(0,0,W,H);for(let k=0;k<900;k++){const v=Math.random()<0.5?190:255;x.fillStyle=`rgba(${v},${v},${v-6},0.25)`;x.fillRect(Math.random()*W,Math.random()*H,1.5,1.5);}
      for(let k=1;k<23;k++){const y=H-k*H/22.7;x.fillStyle="rgba(95,92,86,0.38)";x.fillRect(0,y,W,1.6);x.fillStyle="rgba(255,255,255,0.6)";x.fillRect(0,y+1.6,W,1);
        x.fillStyle="rgba(110,106,98,0.35)";for(let d=0;d<8;d++)x.fillRect(d*16+5+(k%2)*8,y+H/45,1.6,1.6);}
      const g=x.createLinearGradient(0,0,0,H*0.3);g.addColorStop(0,"rgba(55,52,50,0.55)");g.addColorStop(1,"rgba(55,52,50,0)");x.fillStyle=g;x.fillRect(0,0,W,H*0.3);
      for(let k=0;k<10;k++){const px=Math.random()*W,len=H*(0.05+Math.random()*0.2),gg=x.createLinearGradient(0,H*0.1,0,H*0.1+len);gg.addColorStop(0,"rgba(60,58,55,0.25)");gg.addColorStop(1,"rgba(60,58,55,0)");x.fillStyle=gg;x.fillRect(px,H*0.1,2+Math.random()*3,len);}},false);
    const st=new THREE.Mesh(new CylG(1.2,1.6,34,20),mat("g-wall",{roughness:0.8,map:stT}));st.position.set(79,17,-6.5);st.castShadow=true;scene.add(st);
    [30.5,32.5].forEach(y=>{const bd=new THREE.Mesh(new CylG(1.24,1.24,1,20),M.bad);bd.position.set(79,y,-6.5);scene.add(bd);});
    const drum=cylZ(1.1,5,M.steel,74,10.2,-10,16);drum.rotation.y=Math.PI/2;
    ENV.stack=[79,34.2,-6.5];}
  // rail spur along the back of receiving, with a train that drops off boxcars
  {const tie=new THREE.InstancedMesh(new THREE.BoxGeometry(0.35,0.14,2.6),wood,170),m4=new THREE.Matrix4();let n=0;for(let x=-139;x<-9&&n<170;x+=0.8){m4.makeTranslation(x,0.07,-29);tie.setMatrixAt(n++,m4);}tie.count=n;scene.add(tie);
    [-29.7,-28.3].forEach(z=>box(131,0.16,0.12,M.metal,-74.5,0.2,z,scene,false));box(0.6,1.1,2.6,M.bad,-9,0.55,-29,scene,false);
    const T=new THREE.Group();scene.add(T);const TW=[];
    const wG=new CylG(0.42,0.42,0.16,14);wG.rotateX(Math.PI/2);
    function bogie(parent,x){const b=new THREE.Group();b.position.x=x;parent.add(b);box(2.4,0.35,2.2,M.ink,0,0.62,0,b,false);
      [-0.7,0.7].forEach(ax=>[-0.7,0.7].forEach(z=>{const w=new THREE.Mesh(wG,M.metal);w.position.set(ax,0.42,z);b.add(w);TW.push(w);}));}
    function coupler(parent,x){box(0.8,0.22,0.3,M.ink,x,0.95,0,parent,false);}
    // GP-style road switcher: long hood, cab, short hood, walkways with handrails, headlights, horn, exhaust stack
    const loco=new THREE.Group();T.add(loco);box(13,0.35,3.0,M.ink,0,1.05,0,loco);
    box(8.0,2.4,2.2,M.brand,-1.6,2.4,0,loco);box(2.4,3.0,2.9,M.brand,3.6,2.75,0,loco);box(2.2,1.6,2.0,M.brand,5.9,2.0,0,loco);
    box(0.06,0.85,2.4,M.wind,4.82,3.55,0,loco,false);[-1.47,1.47].forEach(z=>box(1.6,0.8,0.05,M.wind,3.6,3.55,z,loco,false));
    box(2.6,0.12,3.0,M.ink,3.6,4.3,0,loco,false);box(8.2,0.08,0.06,M.warn,-1.5,1.9,1.45,loco,false);box(8.2,0.08,0.06,M.warn,-1.5,1.9,-1.45,loco,false);
    for(let x=-5.4;x<=2.2;x+=1.9)[-1.45,1.45].forEach(z=>box(0.06,0.85,0.06,M.warn,x,1.5,z,loco,false));
    [-3.4,-1.2].forEach(x=>{const f=new THREE.Mesh(new CylG(0.55,0.55,0.12,16),M.ink);f.position.set(x,3.62,0);loco.add(f);});
    const ls=new THREE.Mesh(new CylG(0.16,0.2,0.5,10),M.ink);ls.position.set(1.2,3.8,0);loco.add(ls);
    [6.95,-5.6].forEach(x=>{const hl=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.18,0.5),new THREE.MeshBasicMaterial({color:0xfff6d6}));hl.position.set(x,2.55,0);loco.add(hl);});
    box(0.4,0.4,2.8,M.warn,6.6,0.95,0,loco,false);bogie(loco,-4.2);bogie(loco,3.9);coupler(loco,6.8);coupler(loco,-6.8);
    // consist: two boxcars of finished rolls (doors open while spotted) and a bulkhead flat of OCC bales
    const cars=[];
    [["#9b3d2a","box"],["#3d5f8c","box"],["#5b6270","flat"]].forEach(([hex,kind],k)=>{const c=new THREE.Group();c.position.x=-14-k*13;T.add(c);cars.push(c);const cm=cloth0b(hex);
      box(12.2,0.3,2.9,M.ink,0,1.0,0,c);bogie(c,-4.4);bogie(c,4.4);coupler(c,6.3);coupler(c,-6.3);
      if(kind==="box"){box(12,3.3,2.8,cm,0,2.8,0,c);for(let x=-5.5;x<=5.5;x+=1.1)[-1.42,1.42].forEach(z=>box(0.06,3.2,0.04,cm,x,2.8,z,c,false));
        box(12,0.1,0.6,M.ink,0,4.48,0,c,false);[-5.8,5.8].forEach(x=>box(0.08,2.6,0.4,M.ink,x,2.6,1.45,c,false));
        const dr=box(2.6,2.7,0.08,cloth0b("#5a2318"),0,2.6,1.47,c);c.userData.door=dr;
        const sg=new THREE.Mesh(new THREE.PlaneGeometry(4,0.5),new THREE.MeshBasicMaterial({map:(()=>{const cc=document.createElement("canvas");cc.width=256;cc.height=32;const x=cc.getContext("2d");x.fillStyle="#ffffff";x.font='800 22px "IBM Plex Mono",monospace';x.fillText(k?"PMRX 220418":"PMRX 104772",8,24);const t=new THREE.CanvasTexture(cc);t.colorSpace=THREE.SRGBColorSpace;return t;})(),transparent:true}));sg.position.set(-3.4,3.9,1.43);c.add(sg);}
      else{box(12,0.4,2.8,cm,0,1.35,0,c);[-5.8,5.8].forEach(x=>box(0.3,2.8,2.8,cm,x,2.9,0,c));
        const b2=new THREE.InstancedMesh(new THREE.BoxGeometry(1.3,0.95,1.3),M.bale,24),m4b=new THREE.Matrix4();let n2=0;
        for(let i=0;i<8;i++)for(let l=0;l<3;l++){m4b.makeTranslation(-4.9+i*1.4,2.05+l*0.97,(l%2?0.35:-0.35));b2.setMatrixAt(n2++,m4b);}b2.castShadow=true;c.add(b2);}});
    ENV.trainWheels=TW;ENV.trainCars=cars;ENV.locoStack=[1.2,4.1];
    T.position.set(-180,0,-29);ENV.train={g:T,state:"away",t:60};}
  // day-staff cars drive in through the east gate in the morning and leave in the evening, one at a time so they queue nicely
  const CARQ={inQ:[],outQ:[],t:0,init:false};
  function carPath(c,arrive){const G=[[100,32.5],[89.5,32.5],[89.5,c.aisle],[c.sx,c.aisle]],P=arrive?[...G,[c.sx,c.sz]]:[[c.sx,c.sz],...G.slice().reverse()];
    let L=0;const cum=[0];for(let i=1;i<P.length;i++){L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);cum.push(L);}return {P,cum,L,d:0,revUntil:arrive?0:cum[1]};}
  function carsUpdate(rdt,hr){if(!ENV.cars)return;const f=clamp(C.simSpeed/20,1,4),want=c=>!c.day||(hr>=c.arr&&hr<c.dep);
    if(!CARQ.init){CARQ.init=true;ENV.cars.forEach(c=>{c.st=want(c)?"parked":"gone";c.g.visible=c.st==="parked";c.g.position.set(c.sx,0,c.sz);c.g.rotation.y=Math.PI/2;});}
    ENV.cars.forEach(c=>{if(c.st==="gone"&&want(c)&&!CARQ.inQ.includes(c)){CARQ.inQ.push(c);c.st="queued";}
      else if(c.st==="parked"&&!want(c)&&!CARQ.outQ.includes(c)){CARQ.outQ.push(c);c.st="waiting";}});
    CARQ.t-=rdt;if(CARQ.t<=0){const c=CARQ.outQ.shift()||CARQ.inQ.shift();if(c){const arrive=c.st==="queued";c.path=carPath(c,arrive);c.st=arrive?"in":"out";c.g.visible=true;CARQ.t=0.5/f;}}
    ENV.cars.forEach(c=>{if(c.st!=="in"&&c.st!=="out")return;const p=c.path,rev=p.d<p.revUntil;p.d=Math.min(p.L,p.d+(rev?3:10)*f*rdt);
      let i=1;while(i<p.P.length-1&&p.d>p.cum[i])i++;const a=p.P[i-1],b=p.P[i],k=clamp((p.d-p.cum[i-1])/Math.max(1e-6,p.cum[i]-p.cum[i-1]),0,1);
      c.g.position.set(a[0]+(b[0]-a[0])*k,0,a[1]+(b[1]-a[1])*k);const h=Math.atan2(-(b[1]-a[1]),b[0]-a[0])+(rev?Math.PI:0);let dr=h-c.g.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));c.g.rotation.y+=dr*Math.min(1,rdt*8*f);
      if(p.d>=p.L){if(c.st==="in")c.st="parked";else{c.st="gone";c.g.visible=false;}}});}
  // employee parking lot, cars come and go with the shifts
  {slab(66,88,38,56,M.asphalt,0.02);for(let r=0;r<3;r++)for(let k=0;k<=8;k++)box(0.12,0.02,4.4,M.panelW0||(M.panelW0=mat("panel")),67+k*2.6,0.05,40.6+r*6.2,scene,false);
    slab(60.5,66,31.5,33.4,M.slab,0.025);
    const cols=["#c0392b","#2c3e50","#ecf0f1","#7f8c8d","#2980b9","#16a085","#f1c40f","#34495e","#d35400","#bdc3c7"];ENV.cars=[];
    for(let r=0;r<3;r++)for(let k=0;k<8;k++){const g=new THREE.Group();g.position.set(68.3+k*2.6,0,40.6+r*6.2);g.rotation.y=Math.PI/2;scene.add(g);const cm=cloth0b(cols[(k*7+r*3)%cols.length]);
      box(4.2,0.9,1.8,cm,0,0.7,0,g);box(2.3,0.75,1.66,cm,-0.2,1.45,0,g);box(2.2,0.6,1.7,M.wind,-0.2,1.45,0,g,false);
      ENV.cars.push({g,ord:Math.random(),sx:68.3+k*2.6,sz:40.6+r*6.2,aisle:r===2?49.9:43.7,st:"parked"});}
    ENV.cars.sort((a,b)=>a.ord-b.ord);
    // the first third belong to the shift crews (always here); the rest are day staff who arrive around 6 a.m. and leave around 6 p.m.
    const nShift=Math.round(ENV.cars.length*0.34);ENV.cars.forEach((c,k)=>{c.day=k>=nShift;const f=(k-nShift)/Math.max(1,ENV.cars.length-nShift);c.arr=5.2+f*1.5;c.dep=17.9+f*1.4;});
    slab(88,91,31.4,56,M.asphalt,0.021);slab(86,100,31.4,33.6,M.asphalt,0.021);}
  // smoking shelter, picnic tables by the food truck spot, safety board
  {const sx=66.5,sz=22;[[-1.4,-0.8],[1.4,-0.8],[-1.4,0.8],[1.4,0.8]].forEach(([a,b])=>box(0.1,2.4,0.1,M.metal,sx+a,1.2,sz+b,scene,false));
    box(3.2,0.12,2.0,mat("g-glass",{transparent:true,opacity:0.5}),sx,2.45,sz);box(3,1.5,0.06,mat("g-glass",{transparent:true,opacity:0.35}),sx,1.3,sz+0.95,scene,false);box(2.4,0.1,0.5,wood,sx,0.5,sz+0.6,scene,false);
    box(0.25,0.9,0.25,M.metal,sx+1.9,0.45,sz-0.4,scene,false);
    [[28,40],[33,40],[38,40]].forEach(([x,z])=>{box(2.2,0.09,0.9,wood,x,0.8,z,scene,false);[-0.65,0.65].forEach(dz=>box(2.2,0.07,0.32,wood,x,0.48,z+dz,scene,false));[-0.8,0.8].forEach(dx=>box(0.1,0.8,1.4,wood,x+dx,0.4,z,scene,false));});
    slab(26,40,30.8,34.4,M.asphalt,0.02);
    const sc=document.createElement("canvas");sc.width=512;sc.height=256;const st=new THREE.CanvasTexture(sc);st.colorSpace=THREE.SRGBColorSpace;
    const bd=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.8),new THREE.MeshBasicMaterial({map:st,toneMapped:false}));bd.position.set(44,2.1,22.9);scene.add(bd);box(3.8,2,0.12,M.ink,44,2.1,22.8,scene,false);
    [-1.6,1.6].forEach(dx=>box(0.14,1.2,0.14,M.ink,44+dx,0.6,22.8,scene,false));ENV.board={ctx:sc.getContext("2d"),tex:st,last:""};}
  // trees: dense outside the fence, scattered on the lawns inside, kept off every road and building
  {const KEEP=[[-145,-33,-6.5,-1],[-145,-48,10,15],[-55,-6,-26,-1.5],[-69,-22,9,50],[-27,67,1,23.5],[2,46,-27,-1],[47,67,-29,-13],[47,67,-14,-1],[47,63,21,32],[18,96,29,36],[64,90,36,58],[68,85,-19,-2],[0,48,-50,-29],
      [-145,-6,-32,-26],[64,69,-2,20],[-33,-27,-58,-29],[-6,6,-33,-24],[24,42,36,42],[63,70,19,25],[42,46,21,25],[-110,-90,-1,10],[-165,-30,-50,-32.6],[-50,-4,-4,14],[-96,-52,-28,-6],[-44,-38,-2,1.5],[30,34,-62,-44],[-405,405,-78,-54]];
    const ok=(x,z)=>!KEEP.some(([a,b,c,d])=>x>a-2&&x<b+2&&z>c-2&&z<d+2);
    const pts=[];let guard=0;
    while(pts.length<300&&guard<6000){guard++;const inside=Math.random()<0.35,x=inside?SITE.x0+Math.random()*(SITE.x1-SITE.x0):-200+Math.random()*400,z=inside?SITE.z0+Math.random()*(SITE.z1-SITE.z0):-130+Math.random()*270;
      const out=x<SITE.x0-3||x>SITE.x1+3||z<SITE.z0-3||z>SITE.z1+3;if(!inside&&!out)continue;if(!inside&&Math.hypot(x-0,z-5)>200)continue;if(!ok(x,z))continue;
      if(pts.some(p=>Math.hypot(p[0]-x,p[1]-z)<3.2))continue;pts.push([x,z,0.75+Math.random()*0.7]);}
    const trunk=new THREE.InstancedMesh(new CylG(0.22,0.3,2.2,6),wood,pts.length),crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.9,0),new StdMat({roughness:0.9,flatShading:true}),pts.length);
    const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color(),greens=["#6fa76b","#5f9a63","#7cb072","#8ab879","#5b8f5c","#4f8257","#94bf6e","#6a9a4f","#7aa88a"],autumn=["#c9a24a","#d08a3c","#b9673a"],barks=["#ffffff","#e6dcd2","#d4c8bb","#f2e8dc"];
    pts.forEach(([x,z,s],k)=>{m4.compose(new THREE.Vector3(x,1.1*s,z),q,new THREE.Vector3(s,s,s));trunk.setMatrixAt(k,m4);
      m4.compose(new THREE.Vector3(x,(2.2+1.4)*s,z),q.setFromEuler(new THREE.Euler(0,Math.random()*3,0)),new THREE.Vector3(s*1.05,s*1.25,s*1.05));crown.setMatrixAt(k,m4);q.identity();
      const r=Math.random(),hx=r<0.07?autumn[Math.floor(Math.random()*autumn.length)]:greens[Math.floor(Math.random()*greens.length)];
      c.set(hx).offsetHSL(0,(Math.random()-0.5)*0.06,(Math.random()-0.5)*0.07);crown.setColorAt(k,c.convertSRGBToLinear());trunk.setColorAt(k,c.set(barks[k%barks.length]).convertSRGBToLinear());});
    trunk.castShadow=crown.castShadow=true;scene.add(trunk,crown);}
  // street lamps along the roads, the front of the hall and the parking lot
  {const L=[];for(let x=-130;x<-68;x+=16){L.push([x,-6.2]);L.push([x,15]);}for(let x=-20;x<=60;x+=16)L.push([x===44?38.5:x,22.6]);for(let x=68;x<=88;x+=10)L.push([x,57.4]);L.push([60,36]);L.push([46,30]);
    const pole=new THREE.InstancedMesh(new CylG(0.08,0.1,6,6),M.metal,L.length),head=new THREE.InstancedMesh(new THREE.BoxGeometry(0.9,0.2,0.4),new THREE.MeshBasicMaterial({color:0xffffff}),L.length);
    const poolT=spriteTex((x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.45,"rgba(255,255,255,0.6)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,w);});
    const poolM=new THREE.MeshBasicMaterial({map:poolT,color:lin0("#ffd98a"),transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,}),pools=new THREE.InstancedMesh(new THREE.PlaneGeometry(9,9),poolM,L.length);pools.renderOrder=3;
    const m4=new THREE.Matrix4(),rx=new THREE.Matrix4().makeRotationX(-Math.PI/2);
    L.forEach(([x,z],k)=>{m4.makeTranslation(x,3,z);pole.setMatrixAt(k,m4);m4.makeTranslation(x,6,z);head.setMatrixAt(k,m4);m4.makeTranslation(x,0.1,z).multiply(rx);pools.setMatrixAt(k,m4);});
    scene.add(pole,head,pools);ENV.lampHead=head.material;ENV.lampPool=poolM;}
  // puddles show up on the asphalt when it has been raining
  {ENV.pudM=new StdMat({color:lin0("#5d6a80"),roughness:0.05,metalness:0.3,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    [[-70,-3.8,3,1],[-55,-3.4,2,0.8],[-40,-12,2.6,1.4],[-55,22,3,1.6],[-80,12.6,2.4,0.8],[72,46,3,1.6],[80,52,2,1],[30,32.6,2.4,1],[-30,-30,2,1]].forEach(([x,z,a,b])=>{const p=new THREE.Mesh(new CircG(1,20),ENV.pudM);p.rotation.x=-Math.PI/2;p.scale.set(a,b,1);p.position.set(x,0.045,z);scene.add(p);});}
  function cloth0b(h){return new StdMat({color:lin0(h),roughness:0.6});}
  // painted walkway and zone lines
  [[-25,64,2.9],[-25,64,16.4]].forEach(([a,b,z])=>{for(let x=a;x<b;x+=2.4)box(1.3,0.02,0.14,M.lane,x,0.06,z,scene,false);});
  [[4,44,-24.6],[4,44,-2.3]].forEach(([a,b,z])=>box(b-a,0.02,0.14,M.lane,(a+b)/2,0.06,z,scene,false));

  // receiving shed: floor, three walls, door wall rebuilt when docks change
  slab(-34.4,-8,-23.5,-3,M.slab,0.04);
  const WH=4.6;ribWall(26.4,WH,0.3,-21.2,WH/2,-23.5);ribWall(26.4,WH,0.3,-21.2,WH/2,-3);ribWall(0.3,WH,10.8,-8,WH/2,-18.1);ribWall(0.3,WH,7.3,-8,WH/2,-6.65);ribWall(0.3,WH-2.3,2.4,-8,2.3+(WH-2.3)/2,-11.5);
  // warehouse: floor + walls
  slab(-49,-23.8,14.8,32.2,M.slab,0.04);
  ribWall(25.2,WH,0.3,-36.4,WH/2,14.8);ribWall(25.2,WH,0.3,-36.4,WH/2,32.2);ribWall(0.3,WH,3.3,-23.8,WH/2,16.45);ribWall(0.3,WH,11.5,-23.8,WH/2,26.45);ribWall(0.3,WH-2.5,2.6,-23.8,2.5+(WH-2.5)/2,19.4);

