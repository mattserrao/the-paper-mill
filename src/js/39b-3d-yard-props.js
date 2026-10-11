  /* ---- v4.1 pass 3: the mill's own landmark and the yard clutter that says "paper mill" ----
     All static (batched on the first frame; the water tower's name texture is one extra material). Everything here is
     placed on ground the walkers, trucks and scenery already keep clear of; it is in the scene before the scenery's
     keep-out grid is built, so trees never land on it. */
  const YP=G3.YP={},panelM=M.panelWhite||(M.panelWhite=mat("panel"));
  // one atlas for the mill-name signs (the tank band in the top 128 rows, the gate sign below it): one material, so the
  // tank and the gate sign batch into one draw; redrawn whenever the mill is renamed
  const SC=document.createElement("canvas");SC.width=1024;SC.height=300;const signTex=new THREE.CanvasTexture(SC);signTex.colorSpace=THREE.SRGBColorSpace;signTex.anisotropy=4;
  const signM=new StdMat({map:signTex,roughness:0.55}),SIGNV=128/300,signDraws=[];
  function drawSigns(){const x=SC.getContext("2d");x.clearRect(0,0,1024,300);signDraws.forEach(f=>f(x));signTex.needsUpdate=true;}
  {const rb0=G3.rebrand;G3.rebrand=()=>{rb0&&rb0();drawSigns();};}
  // the water tower: four legs, a riser, a tank with the mill name round it, a conical roof, a catwalk and a beacon
  {const TX=-2,TZ=46,H=21,R=4.3;YP.tower=[TX,TZ,H+9.5];
    const legM=M.steel;[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{box(0.42,H,0.42,legM,TX+a*3.1,H/2,TZ+b*3.1);
      box(0.9,0.12,0.9,M.ink,TX+a*3.1,0.06,TZ+b*3.1,scene,false);});
    [6,12.5,19].forEach((y,i)=>{box(6.6,0.18,0.18,legM,TX,y,TZ-3.1,scene,false);box(6.6,0.18,0.18,legM,TX,y,TZ+3.1,scene,false);box(0.18,0.18,6.6,legM,TX-3.1,y,TZ,scene,false);box(0.18,0.18,6.6,legM,TX+3.1,y,TZ,scene,false);
      // x bracing on each face between rings
      [[0,-3.1,0],[0,3.1,0],[-3.1,0,1],[3.1,0,1]].forEach(([dx,dz,ax])=>{for(const s of [1,-1]){const br=box(0.1,7.4,0.1,legM,TX+dx,y-3.2,TZ+dz,scene,false);if(ax)br.rotation.x=s*0.72;else br.rotation.z=s*0.72;}});});
    const riser=new THREE.Mesh(new CylG(0.38,0.38,H+0.5,12),M.steel);riser.position.set(TX,(H+0.5)/2,TZ);riser.castShadow=true;scene.add(riser);
    signDraws.push(x=>{const b=tok("brand");x.fillStyle="#f4f4f1";x.fillRect(0,0,1024,128);
      x.fillStyle="rgba(0,0,0,0.06)";for(let y=0;y<128;y+=32)x.fillRect(0,y,1024,1);x.fillStyle=b;x.fillRect(0,11,1024,11);x.fillRect(0,106,1024,11);
      x.textAlign="center";x.textBaseline="middle";let n=MILL.name.toUpperCase(),fs=76;
      for(;;){x.font=`800 ${fs}px "Plus Jakarta Sans",system-ui,sans-serif`;if(x.measureText(n).width<=470||fs<=34)break;fs-=4;}      // shrink to fit, then clip
      while(x.measureText(n).width>470&&n.length>4)n=n.slice(0,-2).trim()+"…";
      [256,768].forEach(cx=>{x.fillStyle=b;x.fillText(n,cx,64);});});
    // the tank wall is an open cylinder (its uv rows map to the atlas band); the bottom cone meets the wall, the roof covers the top
    const tg=new CylG(R,R,6.4,28,1,true),tuv=tg.attributes.uv;for(let i=0;i<tuv.count;i++)tuv.setY(i,1-SIGNV+tuv.getY(i)*SIGNV);
    const tank=new THREE.Mesh(tg,signM);tank.position.set(TX,H+3.2,TZ);tank.castShadow=true;tank.receiveShadow=true;scene.add(tank);
    const bottom=new THREE.Mesh(new CylG(R,2.2,1.6,28),M.steel);bottom.position.set(TX,H-0.8,TZ);bottom.castShadow=true;scene.add(bottom);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(R+0.35,2.4,28),M.brand);roof.position.set(TX,H+6.4+1.2,TZ);roof.castShadow=true;scene.add(roof);
    const walk=new THREE.Mesh(new THREE.TorusGeometry(R+0.55,0.14,5,28),M.steel);walk.rotation.x=Math.PI/2;walk.position.set(TX,H+0.15,TZ);scene.add(walk);
    const rail=new THREE.Mesh(new THREE.TorusGeometry(R+0.75,0.05,4,28),M.ink);rail.rotation.x=Math.PI/2;rail.position.set(TX,H+1.2,TZ);scene.add(rail);
    for(let k=0;k<12;k++){const a=k/12*6.283;box(0.06,1.1,0.06,M.ink,TX+Math.cos(a)*(R+0.75),H+0.7,TZ+Math.sin(a)*(R+0.75),scene,false);}
    // ladder up one leg, lamp on top
    for(let y=1;y<H;y+=0.7)box(0.5,0.05,0.05,M.ink,TX-3.1,y,TZ-3.55,scene,false);[-0.25,0.25].forEach(dx=>box(0.05,H,0.05,M.ink,TX-3.1+dx,H/2,TZ-3.55,scene,false));
    box(0.1,1.2,0.1,M.ink,TX,H+6.4+2.4,TZ,scene,false);G3.extraBeacons=(G3.extraBeacons||[]).concat([[TX,H+6.4+3.1,TZ]]);
    blob(TX,TZ,7);}
  // bale stacks between the receiving shed and the rail spur (where the train drops them): plain boxes, one shared
  // geometry (a rounded box here would be 29 x 316 triangles for the same look from any distance a player sees them)
  const baleBox=new THREE.BoxGeometry(1.3,0.95,1.3);baleBox.userData.shared=true;
  {const bg=baleBox;
    for(let st=0;st<5;st++)for(let r=0;r<2;r++)for(let l=0;l<3;l++){if(st===3&&l===2)continue;const b=new THREE.Mesh(bg,M.baleG[1]);b.position.set(-30+st*4+(r?0.15:0),0.48+l*0.96,-25.4-r*1.4);b.rotation.y=(st*7+l*3)%2?0.04:-0.03;b.castShadow=true;b.receiveShadow=true;scene.add(b);}}
  // south of the warehouse: pallet stacks, a dumpster, a stack of empty roll cores
  {const kraft=M.kraft;[[-44,36],[-41.5,36],[-39,36.4]].forEach(([x,z],k)=>{for(let l=0;l<7+(k%2)*3;l++){box(1.2,0.1,1.0,kraft,x,0.07+l*0.16,z,scene,false);[-0.45,0,0.45].forEach(dx=>box(0.1,0.08,1.0,M.ink,x+dx,0.11+l*0.16+0.02,z,scene,false));}});
    for(let r=0;r<3;r++)for(let c=0;c<4-r;c++){const core=cylZ(0.17,2.4,M.kraft,-34+c*0.36+r*0.18,0.17+r*0.3,36.2,10);core.rotation.y=0;}
    YP.dumpster=(x,z,ry=0)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);const dm=M.ok;
      const body=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.3,1.4),dm);body.position.y=0.75;body.castShadow=true;body.receiveShadow=true;g.add(body);box(1.15,0.1,1.42,dm,-0.6,1.42,0,g,false);   // (a plain box: the one green rounded box would be a batch of its own)const lid=box(1.15,0.1,1.42,dm,0.6,1.5,0,g,false);lid.rotation.z=-0.35;lid.position.y=1.6;
      [[-0.9,-0.55],[0.9,-0.55],[-0.9,0.55],[0.9,0.55]].forEach(([a,b])=>cylZ(0.09,0.08,M.ink,a,0.09,b,8,g));box(0.08,0.9,1.2,M.ink,-1.22,0.75,0,g,false);return g;};
    YP.dumpster(-27.5,36.5,0.1);}
  // by the office: an OCC compactor and its dumpster, a vending-machine-sized recycling cage
  {const g=new THREE.Group();g.position.set(45.8,0,29);scene.add(g);const steel=M.steel,blue=M.brand;
    box(3.0,2.0,2.0,blue,0,1.0,0,g);box(2.2,1.0,2.1,steel,0.2,2.5,0,g);box(1.6,0.08,1.6,M.ink,-0.4,3.0,0,g,false);                         // body, hopper, lid
    const ram=new THREE.Mesh(new CylG(0.18,0.18,1.6,10),M.metal);ram.rotation.z=Math.PI/2;ram.position.set(-2.1,1.2,0);g.add(ram);box(0.9,0.8,0.8,M.ink,-2.6,1.0,0,g);   // ram cylinder + power pack
    box(0.5,0.6,0.08,panelM,1.3,1.4,1.05,g,false);box(0.12,0.12,0.12,M.bad,1.45,1.55,1.1,g,false);box(0.12,0.12,0.12,M.ok,1.2,1.55,1.1,g,false);    // control panel
    YP.dumpster(45.8,32.6,0);
    const cage=new THREE.Group();cage.position.set(43,0,29.5);scene.add(cage);[[-0.7,-0.5],[0.7,-0.5],[-0.7,0.5],[0.7,0.5]].forEach(([a,b])=>box(0.06,1.6,0.06,M.metal,a,0.8,b,cage,false));
    box(1.5,0.06,1.1,M.metal,0,1.62,0,cage,false);const cb=new THREE.Mesh(baleBox,M.baleG[1]);cb.scale.set(1.05,0.9,0.75);cb.position.y=0.45;cb.castShadow=true;cb.receiveShadow=true;cage.add(cb);}   // (same look as the bale stacks)
  // forklift charging bay off the receiving apron
  {const X=-58.5,Z=-13;slab(X-2.2,X+2.2,Z-1.8,Z+1.8,M.slab,0.025);box(4.4,1.6,0.25,M.steel,X,0.8,Z-1.75);box(4.6,0.12,0.4,M.brand,X,1.66,Z-1.75,scene,false);
    [-1.2,1.2].forEach(dx=>{box(0.6,1.1,0.4,M.steel,X+dx,0.55,Z-1.45);box(0.5,0.25,0.05,M.ok,X+dx,0.95,Z-1.22,scene,false);
      const cb=new THREE.Mesh(new CylG(0.03,0.03,1.4,6),M.ink);cb.rotation.x=0.9;cb.position.set(X+dx+0.25,0.5,Z-0.8);scene.add(cb);});
    box(0.12,0.12,3.6,M.warn,X,0.06,Z-1.4,scene,false);
    if(G3.GFX&&!G3.GFX.lambert){const c=document.createElement("canvas");c.width=256;c.height=64;const x=c.getContext("2d");x.fillStyle="#1c2233";x.fillRect(0,0,256,64);x.fillStyle="#f2c230";x.font="800 30px system-ui,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText("CHARGING",128,33);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sg=new THREE.Mesh(new THREE.PlaneGeometry(2.0,0.5),new THREE.MeshBasicMaterial({map:t}));sg.position.set(X,1.3,Z-1.6);scene.add(sg);}}
  // flagpoles by the office door: the mill's flag and a safety flag
  {[[56.6,20.4,"brand"],[58.6,20.4,"ok"]].forEach(([x,z,tk],k)=>{const p=new THREE.Mesh(new CylG(0.05,0.07,9,8),M.steel);p.position.set(x,4.5,z);p.castShadow=true;scene.add(p);
      const ball=new THREE.Mesh(new SphG(0.12,8,6),M.brand);ball.position.set(x,9.05,z);scene.add(ball);
      const fm=k?M.ok:M.brand;
      const fg=new THREE.BoxGeometry(1.7,1.05,0.04);fg.translate(0.85,0,0);const fl=new THREE.Mesh(fg,fm);fl.position.set(x+0.06,8.3,z);fl.rotation.y=0.55;fl.castShadow=true;scene.add(fl);
      if(G3.GFX&&(G3.GFX.tier==="high"||G3.GFX.tier==="ultra"))(YP.flags||(YP.flags=[])).push(fl);
      box(0.5,0.08,0.5,M.ink,x,0.04,z,scene,false);});}
  // the gate sign outside the fence, read by every truck coming in
  {const gx=-106,gz=-12;[-1.3,1.3].forEach(dz=>box(0.14,2.8,0.14,M.ink,gx,1.4,gz+dz,scene,false));
    // drawn into the atlas below the tank band (512 x 172 at row 128)
    signDraws.push(x=>{x.save();x.translate(0,128);const b=tok("brand");x.fillStyle="#ffffff";x.fillRect(0,0,512,172);x.fillStyle=b;x.fillRect(0,0,512,64);x.fillStyle="#fff";x.beginPath();x.arc(40,32,20,0,7);x.fill();x.fillStyle=b;x.beginPath();x.arc(40,32,7,0,7);x.fill();
      x.textAlign="left";x.fillStyle="#ffffff";x.font='800 31px "Plus Jakarta Sans",system-ui,sans-serif';x.textBaseline="middle";let n=MILL.name;while(x.measureText(n).width>430&&n.length>4)n=n.slice(0,-2).trim()+"…";x.fillText(n,72,33);
      x.fillStyle="#1c2233";x.font='700 27px "Plus Jakarta Sans",system-ui,sans-serif';x.fillText("OCC RECEIVING  →  SCALE",26,100);x.font='600 20px system-ui,sans-serif';x.fillStyle="#555";x.fillText("Visitors report to the office · Speed limit 15",26,140);x.restore();});
    drawSigns();
    const pg=new THREE.PlaneGeometry(3.3,1.1),puv=pg.attributes.uv;for(let i=0;i<puv.count;i++)puv.setXY(i,puv.getX(i)*0.5,puv.getY(i)*(1-SIGNV));
    const pl=new THREE.Mesh(pg,signM);pl.position.set(gx+0.1,2.2,gz);pl.rotation.y=Math.PI/2;pl.castShadow=true;pl.receiveShadow=true;scene.add(pl);   // same flags as the tank: one batch
    box(3.4,1.2,0.08,M.ink,gx-0.02,2.2,gz,scene,false).rotation.y=Math.PI/2;}
