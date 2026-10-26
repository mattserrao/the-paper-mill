  // ---- fog remediation fan: pulls wet-end vapour out of the machine room through a duct in the back (drive-side) wall
  {const X=49.5,Z=-4.2,HH=13.4,stk=mat("g-wall",{roughness:0.55});
    box(3.6,3.2,3.0,M.steel,X,1.6,Z);box(3.8,0.25,3.2,M.roofFlat,X,3.3,Z,scene,false);[-1,1].forEach(d=>box(0.08,2.2,2.2,gratM,X+d*1.81,1.5,Z,scene,false));   // fan housing, louvres
    box(1.1,0.9,0.9,M.ink,X+2.3,0.45,Z+0.6,scene);box(0.6,0.5,0.15,M.ok,X+2.3,1.2,Z+1.06,scene,false);   // motor + starter
    const st=new THREE.Mesh(new CylG(0.95,1.05,HH+6-3.3,20),stk);st.position.set(X,3.3+(HH+6-3.3)/2,Z);st.castShadow=true;scene.add(st);
    [7,12,17].forEach(y=>{const b=new THREE.Mesh(new CylG(1.06,1.06,0.2,20),M.steel);b.position.set(X,y,Z);scene.add(b);});
    const cap=new THREE.Mesh(new CylG(1.4,1.4,0.15,20),M.ink);cap.position.set(X,HH+6.6,Z);scene.add(cap);[-0.8,0.8].forEach(dx=>box(0.1,0.6,0.1,M.ink,X+dx,HH+6.3,Z,scene,false));
    // duct from the hall's back wall down into the fan housing
    box(2.2,2.2,6.4,stk,X,5.9,Z+3.9,scene);box(2.2,4.6-3.3+1.1,2.2,stk,X,(3.3+5.9)/2,Z+0.9,scene);
    const rot=new THREE.Group();rot.position.set(X,HH+6.05,Z);scene.add(rot);[0,1,2,3].forEach(k=>{const bl=box(1.5,0.05,0.3,M.steel,0,0,0,rot,false);bl.rotation.y=k*Math.PI/4;bl.rotation.x=0.4;});
    const c=document.createElement("canvas");c.width=256;c.height=96;const x=c.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,256,96);x.fillStyle="#1c2233";x.font="800 26px system-ui,sans-serif";x.textAlign="center";x.fillText("FOG REMEDIATION",128,40);x.fillText("FAN",128,74);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.0,0.75),new THREE.MeshBasicMaterial({map:t}));pl.position.set(X,2.2,Z-1.52);pl.rotation.y=Math.PI;scene.add(pl);
    G3.fogFan={rot,spin:1,top:[X,HH+6.8,Z]};}
  // switchback stair tower beside the chest, with a bridge onto the thickener deck
  {const XA=42.3,XB=43.9,Z0=-19.6,Z1=-13.6,R=PH/4;
    for(let f=0;f<4;f++){const up=f%2===0,x=up?XA:XB;flight([x,f*R,up?Z0:Z1],[x,(f+1)*R,up?Z1:Z0],1.2);}
    for(let f=1;f<4;f++){const zz=f%2?Z1+0.75:Z0-0.75;walkway(XA-0.6,zz,XB+0.6,zz,f*R,1.5,[0,0],false);}
    walkway(XA-0.6,Z0-0.75,XB+0.6,Z0-0.75,PH,1.5,[1,0],false);walkway(XA-0.6,-17.2,XA-0.6,Z0-0.0,PH,1.0,[0,0],false);
    walkway(DX1,-16.4,XA-0.6,-16.4,PH,1.2,[1,1],false);
    [[XA-0.75,Z0-1.5],[XB+0.75,Z0-1.5],[XA-0.75,Z1+1.5],[XB+0.75,Z1+1.5]].forEach(([x,z])=>box(0.22,PH+1.1,0.22,M.brand,x,(PH+1.1)/2,z,scene));
    G3.thkRoute=[[24,0,-21.4],[38,0,-21.6],[XA,0,Z0-0.2],[XA,R,Z1],[XB,R,Z1+0.4],[XB,2*R,Z0],[XA,2*R,Z0-0.4],[XA,3*R,Z1],[XB,3*R,Z1+0.4],[XB,PH,Z0],[XA-0.3,PH,Z0-0.4],[XA-0.3,PH,-16.4],[DX1-0.6,PH,-16.4],[33.0,PH,-17.6,4,"inspect"],[38.0,PH,-12.4,3,"inspect"],[DX1-0.6,PH,-16.4],[XA-0.3,PH,-16.4],[XA-0.3,PH,Z0-0.4],[XB,PH,Z0],[XB,3*R,Z1+0.4],[XA,3*R,Z1],[XA,2*R,Z0-0.4],[XB,2*R,Z0],[XB,R,Z1+0.4],[XA,R,Z1],[XA,0,Z0-0.2],[38,0,-21.6],[24,0,-21.4]];}
  const sealW=[sealT(26.4,-17.6,"#b8986e","CLOUDY"),sealT(26.4,-13.9,"#8fcbe8","CLEAR")];
  const sealSpill=[[26.4,-17.6],[26.4,-13.9]].map(([x,z])=>{const m=new THREE.Mesh(new CircG(1,28),new StdMat({color:0xffffff,transparent:true,opacity:0.7,roughness:0.15,depthWrite:false}));
    m.rotation.x=-Math.PI/2;m.position.set(x-1.2,0.08,z);m.scale.setScalar(0.01);m.visible=false;scene.add(m);return m;});
  // filtrate model: the first part of each disk sector's rotation carries fines (cloudy); the spider valve sets where that split is
  const SPD={v:0.35,tc:420,tl:40,qc:0,ql:0,lc:0.6,ll:0.6,spill:[0,0],hist:[],acc:0};G3.SPD=SPD;
  function spiderStep(dtm){const F=Math.max(5,(S.rates.fiberIn||0)*2.4+8),k0=0.32,hi=1500,lo=25,v=SPD.v;
    const tc=v<=k0?hi:(hi*k0+lo*(v-k0))/v, tl=v>=k0?lo:(hi*(k0-v)+lo*(1-k0))/(1-v);
    const a=Math.min(1,dtm/6);SPD.tc+=(tc*(0.95+0.1*Math.random())-SPD.tc)*a;SPD.tl+=(tl*(0.93+0.14*Math.random())-SPD.tl)*a;
    SPD.qc=F*v;SPD.ql=F*(1-v);
    const capC=0.45*F,capL=0.8*F,VOL=60;let rem=Math.min(dtm,30);while(rem>0){const h=Math.min(0.4,rem);rem-=h;
      SPD.lc=clamp(SPD.lc+h*(SPD.qc-capC*Math.sqrt(Math.max(0,SPD.lc)))/VOL,0,1.05);SPD.ll=clamp(SPD.ll+h*(SPD.ql-capL*Math.sqrt(Math.max(0,SPD.ll)))/VOL,0,1.05);}
    [SPD.lc,SPD.ll].forEach((l,i)=>{SPD.spill[i]=l>=1?Math.min(1,SPD.spill[i]+dtm/40):Math.max(0,SPD.spill[i]-dtm/300);});
    // contaminated clear filtrate (fines carrying over) loads up the disks: they start to labour and, if it goes on, the thickener blows out
    if(!S.inc.some(i=>i.id==="thkblow")){const over=SPD.tl-150;SPD.strain=clamp((SPD.strain||0)+(over>0?dtm*(1+over/300)/240:-dtm/120),0,1);
      if(SPD.strain>=1&&!S.zen){SPD.strain=0;trigger("thkblow");SPD.v=0.35;SPD.reset=true;log("Contaminated clear filtrate overloaded the disk thickener. Operators reset the spider valve.","bad");}}
    SPD.acc+=dtm;if(SPD.acc>=2){SPD.acc=0;SPD.hist.push([SPD.tc,SPD.tl,SPD.qc,SPD.ql]);if(SPD.hist.length>180)SPD.hist.shift();}}
  const cClear=lin0("#9fd2ec"),cDirty=lin0("#7a5636");
  G3.spiderFrame=(rdt)=>{if(rdt>0)spiderStep(rdt*simRate());
    [[SPD.lc,SPD.tc],[SPD.ll,SPD.tl]].forEach(([l,t],i)=>{const w=sealW[i];w.position.y=0.3+2.2*Math.min(1,l);{const q=clamp((t-45)/200,0,1);w.material.color.copy(cClear).lerp(cDirty,q*q*(3-2*q));}
      const sp=sealSpill[i],k=SPD.spill[i];sp.visible=k>0.02;sp.scale.set(0.8+2.6*k,0.8+2.2*k,1);sp.material.color.copy(w.material.color);
      if(l>=1&&rdt>0&&Math.random()<rdt*12){const a=Math.random()*6.28;emit("drop",26.4+Math.cos(a)*1.5,2.8,(i?-13.9:-17.6)+Math.sin(a)*1.5,Math.cos(a)*1.2,0.5,Math.sin(a)*1.2,0.7,0.26,"#"+w.material.color.clone().convertLinearToSRGB().getHexString(),0.9);}});
    if(G3.spiderWheel)G3.spiderWheel.rotation.x=SPD.v*12;};
  spool([[31.0,PH+2.35,-15.3],[26.4,PH+2.35,-15.3],[26.4,PH+2.35,-17.6],[26.4,3.0,-17.6]],0.16,M.ww);
  spool([[31.0,PH+2.85,-14.7],[26.4,PH+2.85,-14.7],[26.4,PH+2.85,-13.9],[26.4,3.0,-13.9]],0.16,M.ww);
  // thickened stock drops straight from the repulper hopper into the chest below
  spool([[38.4,PH-0.6,-11.45],[38.4,PH-1.3,-11.45],[36.2,PH-1.3,-13.2],[36.2,10.4,-13.2]],0.28,M.stock);
  // v2.9.19: the stock line runs overhead (it used to lie on the ground and wall off the stock-prep yard)
  // v6.12.1-t5/t6: stock chest > stock chest pump (LV-104) > refiners (in the hall's approach bay, 39) > machine chest >
  // machine chest pump > fan pump (behind the headbox) > machine screen > headbox. Three legs, each on its own path:
  // 1 the stock chest pump stands at the chest's east outlet (clear of the thickener platform's corner column) and sends
  //   the stock straight up to 7.6 m, east along z -10.2 and north over the hall's back wall at x 66 to the refiners'
  //   inlet header (39); 2 the refiners' outlet comes back over the wall at x 68.7 (8.6 m), out to z -13, up to 11.2 m and
  //   west over the machine chest into its open top; 3 the machine chest pump to the fan pump suction (below)
  {const X=41.2,Z=-10.2,k=1.2,g=pumpModel();g.scale.setScalar(k);g.position.set(X,0.25,Z);blob(X+0.4,Z,1.8);
   {const c=document.createElement("canvas");c.width=256;c.height=48;const x=c.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,256,48);x.fillStyle="#1c2233";x.font="800 20px system-ui,sans-serif";x.textAlign="center";x.fillText("STOCK CHEST PUMP",128,33);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.3),new THREE.MeshBasicMaterial({map:t}));pl.position.set(X+0.4,0.55,Z+0.65);scene.add(pl);}
   spool([[38.2,1.15,-13.2],[38.2,1.15,Z],[X-0.95*k,1.15,Z]],0.26,M.stock);
   spool([[X-0.7*k,2.17,Z],[X-0.7*k,7.6,Z],[66.0,7.6,Z],[66.0,7.6,4.0]],0.32,M.stock);}
  slab(44.2,52.8,-18.4,-7.6,M.slab,0.032);
  // machine chest (v6.12.1-t5): the same tiled, open-top concrete chest as the stock chest, at half its volume (the same
  // 10 m height, radius 4.2/sqrt 2), with a bridge agitator and a level gauge facing the camera. The level is the sim's
  // machine chest level (07g mcLvlNow): it runs down when the refiners clash and the machine trips at 10 % (43)
  {const MX=47.6,MZ=-15.0,MR=4.2/Math.SQRT2,MH=10;blob(MX,MZ,MR+1.4);
    const tO=tileOut.clone(),tI=tileIn.clone();tO.needsUpdate=tI.needsUpdate=true;tO.repeat.set(10,5);tI.repeat.set(10,5);
    const cO=mat("g-tile",{map:tO,roughness:0.6}),cI=mat("g-tile",{map:tI,roughness:0.5,side:THREE.BackSide});
    const mc=new THREE.Group();mc.position.set(MX,0,MZ);scene.add(mc);
    const sh=new THREE.Mesh(new CylG(MR,MR,MH,36,1,true),cO);sh.position.y=MH/2;sh.castShadow=true;sh.receiveShadow=true;mc.add(sh);
    const si=new THREE.Mesh(new CylG(MR-0.06,MR-0.06,MH-0.1,36,1,true),cI);si.position.y=MH/2;mc.add(si);
    const rim=new THREE.Mesh(new RingG(MR-0.06,MR+0.02,40),M.steel);rim.rotation.x=-Math.PI/2;rim.position.y=MH+0.01;mc.add(rim);
    const br=new THREE.Mesh(new CylG(MR+0.04,MR+0.04,0.4,36),M.steel);br.position.y=0.2;mc.add(br);
    [2.5,5,7.5].forEach(y=>{const b=new THREE.Mesh(new CylG(MR+0.012,MR+0.012,0.12,36,1,true),M.steel);b.position.y=y;mc.add(b);});
    const liq=new THREE.Mesh(new CircG(MR-0.06,36),surfMat);liq.rotation.x=-Math.PI/2;liq.position.y=MH*0.69;mc.add(liq);
    // agitator bridge across the top (east-west, clear of the inlet that drops in on the north side)
    box(MR*2+0.6,0.45,0.9,M.steel,0,MH+0.25,0,mc);box(1.3,1.1,1.3,M.brand,0,MH+1.0,0,mc);{const s=new THREE.Mesh(new CylG(0.12,0.12,8,8),M.metal);s.position.y=6.4;mc.add(s);}
    // level gauge: scale plate, sight glass, fill, the setpoint (green) and trip (red) marks
    const gg=new THREE.Group();gg.position.set(-MR*0.38,0,MR*0.93);gg.rotation.y=-0.39;mc.add(gg);
    {const pl=new THREE.Mesh(new THREE.BoxGeometry(1.2,10.2,0.12),[M.steel,M.steel,M.steel,M.steel,new StdMat({map:gsTex,roughness:0.7}),M.steel]);pl.position.set(0,5.1,0);gg.add(pl);
     const tb=new THREE.Mesh(new CylG(0.2,0.2,9.8,16,1,true),M.glass);tb.position.set(0.25,5.1,0.22);gg.add(tb);
     [0.15,10.05].forEach(y=>{const c=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,0.5),M.steel);c.position.set(0.25,y,0.18);gg.add(c);});}
    const gf=new THREE.Mesh(new CylG(0.15,0.15,1,12),M.liquid);gf.position.set(0.25,0,0.22);gg.add(gf);
    const tT=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.12,0.14),M.ok),tL=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.12,0.14),M.bad);tT.position.set(0.1,0.2+0.69*9.8,0.14);tL.position.set(0.1,0.2+0.10*9.8,0.14);gg.add(tT,tL);
    G3.MC3={liq,gf};
    // name plate, on the side away from the gauge
    {const c=document.createElement("canvas");c.width=256;c.height=48;const x=c.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,256,48);x.fillStyle="#1c2233";x.font="800 26px system-ui,sans-serif";x.textAlign="center";x.fillText("MACHINE CHEST",128,33);
     const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.4,0.45),new THREE.MeshBasicMaterial({map:t}));pl.position.set(MX+MR*0.55,4.4,MZ+MR*0.84+0.03);pl.rotation.y=0.58;scene.add(pl);}
    // refined stock back from the refiners (39: up from the outlet header and out over the back wall at x 68.7): south at
    // 8.6 m to z -13, up over the chest at 11.2 m, west, and down into its open top on the north-east side
    spool([[68.7,8.6,4.0],[68.7,8.6,-13.0],[68.7,11.2,-13.0],[49.0,11.2,-13.0],[49.0,11.2,-13.8],[49.0,9.6,-13.8]],0.32,M.stock);
    // machine chest pump: draws the bottom of the chest on its north-east side and sends the stock to the fan pump suction:
    // up to 4.2 m, east along z -10.4, round the north of the white water riser and down into the fan pump's suction tee
    // (pump nozzles, 20 pumpModel at scale k: suction face at X-0.95k, height 0.75k; discharge on top at X-0.7k, 1.6k)
    {const g=pumpModel();g.scale.setScalar(1.2);g.position.set(48.8,0.25,-10.4);blob(49.2,-10.4,1.8);
     {const c=document.createElement("canvas");c.width=256;c.height=48;const x=c.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,256,48);x.fillStyle="#1c2233";x.font="800 20px system-ui,sans-serif";x.textAlign="center";x.fillText("MACHINE CHEST PUMP",128,33);
     const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.3),new THREE.MeshBasicMaterial({map:t}));pl.position.set(49.2,0.55,-9.75);scene.add(pl);}
     spool([[47.0,1.15,-12.2],[47.0,1.15,-10.4],[47.66,1.15,-10.4]],0.26,M.stock);
     spool([[47.96,2.17,-10.4],[47.96,4.2,-10.4],[57.0,4.2,-10.4],[57.0,4.2,-12.4],[58.6,4.2,-12.4],[58.6,1.75,-12.4],[58.6,1.75,-11]],0.32,M.stock);}
    // fan pump (v6.12.1: on the old refiner pad, the "basement" pump right behind the headbox's drive-side inlet): a big
    // end-suction pump, twice the size of the others, on its own plinth. Its suction tee takes refined stock from the machine
    // chest pump (from the north) and base ply white water from the silo (x 46, along z -9)
    slab(57.4,67.4,-14.2,-3.0,M.slab,0.032);
    {const g=pumpModel();g.scale.setScalar(2);g.position.set(62.6,0.25,-11);box(5.6,0.25,2.4,M.steel,63.5,0.125,-11,scene);blob(63.4,-11,3.2);
     {const c=document.createElement("canvas");c.width=256;c.height=48;const x=c.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,256,48);x.fillStyle="#1c2233";x.font="800 26px system-ui,sans-serif";x.textAlign="center";x.fillText("FAN PUMP",128,33);
     const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.34),new THREE.MeshBasicMaterial({map:t}));pl.position.set(64.0,0.6,-9.78);scene.add(pl);}
     spool([[46.0,0.15,3.0],[46.0,5.6,3.0],[46.0,5.6,-9.0],[58.6,5.6,-9.0],[58.6,1.75,-9.0],[58.6,1.75,-11]],0.28,M.ww);
     spool([[58.6,1.75,-11],[60.7,1.75,-11]],0.34,M.stock);
     // machine screen (visual, v6.12.1): a vertical pressure screen between the fan pump and the hall; thin stock in on the
     // north side, accepts out of the south side and over the back wall into the headbox header
     {const SX=61.2,SZ=-5.6,R=1.0,H=2.6;const sh=new THREE.Mesh(new CylG(R,R,H,24),M.tank);sh.position.set(SX,0.35+H/2,SZ);sh.castShadow=true;sh.receiveShadow=true;scene.add(sh);
      const dm=new THREE.Mesh(new THREE.SphereGeometry(R,24,8,0,Math.PI*2,0,Math.PI/2),M.steel);dm.position.set(SX,0.35+H,SZ);dm.castShadow=true;scene.add(dm);
      const mo=new THREE.Mesh(new CylG(0.45,0.45,0.9,16),M.motor);mo.position.set(SX,0.35+H+R+0.35,SZ);mo.castShadow=true;scene.add(mo);
      box(2.4,0.35,2.4,M.steel,SX,0.17,SZ,scene);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>box(0.14,0.6,0.14,M.ink,SX+a*0.85,0.5,SZ+b*0.85,scene,false));blob(SX,SZ,2.2);
      const pr=new THREE.Mesh(new CylG(0.12,0.12,1.2,10),M.metal);pr.rotation.z=Math.PI/2;pr.position.set(SX-R-0.4,0.9,SZ);scene.add(pr);   // (rejects nozzle)
      {const c=document.createElement("canvas");c.width=256;c.height=48;const x=c.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,256,48);x.fillStyle="#1c2233";x.font="800 22px system-ui,sans-serif";x.textAlign="center";x.fillText("MACHINE SCREEN",128,33);
     const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.3),new THREE.MeshBasicMaterial({map:t}));pl.position.set(SX,1.15,SZ+R+0.03);scene.add(pl);}}
     spool([[61.2,3.45,-11],[61.2,4.2,-11],[61.2,4.2,-8.0],[61.2,2.4,-8.0],[61.2,2.4,-6.6]],0.34,M.stock);
     spool([[61.2,0.9,-4.6],[61.2,0.9,-3.6],[61.2,7.6,-3.6],[61.2,7.6,3.6],[60.75,7.6,3.6],[60.75,7.6,5.85],[60.75,1.9,5.85]],0.34,M.stock);}}   // into the top of the tapered header, drive-side end (and the machine chest block)

  // paper machine
  const zc=9.1,CD=6.4;
  const DX=-5.6,DY=4.2,DR=0.9,RM=2.2,R0=0.45,KX=DX-(DR+RM)-2.6,ZJ=CD/2+0.45;let nipPhi=Math.PI;
  // v3.2.0 headbox: an angular hydraulic headbox. Tapered manifold behind, tube bank body, converging nozzle down to the slice lip,
  // a row of slice actuators on the nozzle, stiffener ribs, side plates, and the L/B gauge on the tending side
  const HB=G3.HB={lipX:55.0,lipY:3.1};
  {const hbM=mat(M.steel.userData.token,{roughness:0.42,metalness:0.3,flatShading:true}),hbD=mat(M.ink.userData.token,{roughness:0.5,metalness:0.25,flatShading:true}),hbS=mat(M.metal.userData.token,{roughness:0.38,metalness:0.4,flatShading:true});
    const mk=(pts,depth,m,z0)=>{const sh=new THREE.Shape();pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false});
      const o=new THREE.Mesh(g,m);o.position.z=z0;o.castShadow=o.receiveShadow=true;scene.add(o);return o;};
    // v6.11 Blender redesign (tools/blender/hb_new.py): a stand with jacking pads, a tapered inlet header (drive-side inlet,
    // tending-side recirculation), the tube bank, bolted side plates, slice beam and actuators, the apron, a deck with a ladder
    // and a ladder. Same footprint; HB.lip is still the moving slice lip.
    const ZD=zc-CD/2,ZT=zc+CD/2;
    box(4,0.12,0.7,hbD,58,0.06,5.55,scene,false);
    box(0.45,0.85,0.45,hbM,56.5,0.55,5.55,scene,false);
    box(0.45,0.85,0.45,hbM,59.5,0.55,5.55,scene,false);
    box(3.9,0.3,0.55,hbM,58,1.05,5.55,scene,false);
    box(0.6,0.12,0.6,hbS,56.5,1.26,5.55,scene,false);
    box(0.6,0.12,0.6,hbS,59.5,1.26,5.55,scene,false);
    box(4,0.12,0.7,hbD,58,0.06,12.65,scene,false);
    box(0.45,0.85,0.45,hbM,56.5,0.55,12.65,scene,false);
    box(0.45,0.85,0.45,hbM,59.5,0.55,12.65,scene,false);
    box(3.9,0.3,0.55,hbM,58,1.05,12.65,scene,false);
    box(0.6,0.12,0.6,hbS,56.5,1.26,12.65,scene,false);
    box(0.6,0.12,0.6,hbS,59.5,1.26,12.65,scene,false);
    box(0.5,0.35,7.6,hbM,56.5,1.05,9.1,scene,false);
    box(0.5,0.35,7.6,hbM,59.5,1.05,9.1,scene,false);
    {const o=mk([[59.6, 1.2], [59.6, 3.35], [59.25, 3.7], [57.5, 3.7], [55.55, 3.22], [55.15, 3.12], [55.15, 2.98], [55.45, 2.95], [56.35, 2.45], [56.75, 1.2]],6.4,hbM,5.9);edges(o,undefined,20);}
    {const o=mk([[59.660000000000004, 1.15], [59.660000000000004, 3.35], [59.31, 3.7600000000000002], [57.5, 3.7600000000000002], [55.529999999999994, 3.22], [55.129999999999995, 3.12], [55.129999999999995, 2.98], [55.43, 2.95], [56.35, 2.45], [56.75, 1.15]],0.14,hbD,5.76);edges(o,undefined,20);}
    {const o=mk([[59.660000000000004, 1.15], [59.660000000000004, 3.35], [59.31, 3.7600000000000002], [57.5, 3.7600000000000002], [55.529999999999994, 3.22], [55.129999999999995, 3.12], [55.129999999999995, 2.98], [55.43, 2.95], [56.35, 2.45], [56.75, 1.15]],0.14,hbD,12.3);edges(o,undefined,20);}
    cylZ(0.05,0.04,hbS,59.2,3.44,12.46,6);
    cylZ(0.05,0.04,hbS,58.633,3.37,12.46,6);
    cylZ(0.05,0.04,hbS,58.067,3.3,12.46,6);
    cylZ(0.05,0.04,hbS,57.5,3.23,12.46,6);
    cylZ(0.05,0.04,hbS,56.933,3.16,12.46,6);
    cylZ(0.05,0.04,hbS,56.367,3.09,12.46,6);
    cylZ(0.05,0.04,hbS,55.8,3.02,12.46,6);
    box(0.5,2.1,6.2,hbS,59.85,2.25,9.1,scene,false);
    box(0.58,0.1,6.3,hbD,59.85,1.35,9.1,scene,false);
    box(0.58,0.1,6.3,hbD,59.85,2.25,9.1,scene,false);
    box(0.58,0.1,6.3,hbD,59.85,3.15,9.1,scene,false);
    {const g=new CylG(0.38,0.75,6.8,14);g.rotateX(Math.PI/2);const o=new THREE.Mesh(g,hbM);o.position.set(60.75,1.75,9.1);o.castShadow=true;scene.add(o);edges(o,undefined,30);}
    cylZ(0.95,0.18,hbD,60.75,1.75,5.58,14);
    cylZ(0.48,0.14,hbD,60.75,1.75,12.78,12);
    spool([[60.75,1.75,12.8],[60.75,1.75,13.4],[60.75,0.4,13.4]],0.26,M.stock);
    {const g=new CylG(0.28,0.28,0.06,10);g.rotateZ(-Math.PI/2);const o=new THREE.Mesh(g,M.warn);o.position.set(61.05,1.75,13.4);o.castShadow=true;scene.add(o);}
    box(0.7,0.55,0.3,hbM,60.6,0.95,6.5,scene,false);
    box(0.7,0.55,0.3,hbM,60.6,0.95,9.1,scene,false);
    box(0.7,0.55,0.3,hbM,60.6,0.95,11.7,scene,false);
    {const o=box(2,0.28,6.5,hbS,56.55,3.6,9.1,scene,false);o.rotation.set(0,0,0.241);};
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,6.35,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,6.35);o.castShadow=true;scene.add(o);}
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,6.961,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,6.961);o.castShadow=true;scene.add(o);}
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,7.572,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,7.572);o.castShadow=true;scene.add(o);}
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,8.183,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,8.183);o.castShadow=true;scene.add(o);}
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,8.794,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,8.794);o.castShadow=true;scene.add(o);}
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,9.406,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,9.406);o.castShadow=true;scene.add(o);}
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,10.017,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,10.017);o.castShadow=true;scene.add(o);}
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,10.628,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,10.628);o.castShadow=true;scene.add(o);}
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,11.239,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,11.239);o.castShadow=true;scene.add(o);}
    {const o=box(0.34,0.5,0.34,hbD,56.25,3.95,11.85,scene,false);o.rotation.set(0,0,0.241);};
    {const g=new CylG(0.12,0.12,0.35,8);const o=new THREE.Mesh(g,hbS);o.position.set(56.3,4.35,11.85);o.castShadow=true;scene.add(o);}
    box(0.08,0.08,6.4,M.warn,56.25,4.22,9.1,scene,false);
    HB.lip=box(0.42,0.1,6.44,hbS,55.33,3.13,9.1,scene,false);
    box(0.55,0.06,6.4,hbS,55.22,2.93,9.1,scene,false);
    box(1.75,0.06,6.9,hbS,58.4,3.76,9.1,scene,false);
    box(0.06,1,0.06,M.warn,57.6,4.29,5.7,scene,false);
    box(0.06,1,0.06,M.warn,58.45,4.29,5.7,scene,false);
    box(0.06,1,0.06,M.warn,59.3,4.29,5.7,scene,false);
    box(1.8,0.06,0.06,M.warn,58.45,4.79,5.7,scene,false);
    box(1.8,0.06,0.06,M.warn,58.45,4.29,5.7,scene,false);
    box(1.8,0.14,0.04,M.warn,58.45,3.86,5.7,scene,false);
    box(0.06,1,0.06,M.warn,57.6,4.29,12.5,scene,false);
    box(0.06,1,0.06,M.warn,58.45,4.29,12.5,scene,false);
    box(0.06,1,0.06,M.warn,59.3,4.29,12.5,scene,false);
    box(1.8,0.06,0.06,M.warn,58.45,4.79,12.5,scene,false);
    box(1.8,0.06,0.06,M.warn,58.45,4.29,12.5,scene,false);
    box(1.8,0.14,0.04,M.warn,58.45,3.86,12.5,scene,false);
    box(0.06,3.9,0.06,M.warn,59.55,1.95,13.05,scene,false);
    box(0.06,3.9,0.06,M.warn,60.05,1.95,13.05,scene,false);
    box(0.5,0.04,0.05,M.warn,59.8,0.4,13.05,scene,false);
    box(0.5,0.04,0.05,M.warn,59.8,0.82,13.05,scene,false);
    box(0.5,0.04,0.05,M.warn,59.8,1.24,13.05,scene,false);
    box(0.5,0.04,0.05,M.warn,59.8,1.66,13.05,scene,false);
    box(0.5,0.04,0.05,M.warn,59.8,2.08,13.05,scene,false);
    box(0.5,0.04,0.05,M.warn,59.8,2.5,13.05,scene,false);
    box(0.5,0.04,0.05,M.warn,59.8,2.92,13.05,scene,false);
    box(0.5,0.04,0.05,M.warn,59.8,3.34,13.05,scene,false);
    box(0.5,0.04,0.05,M.warn,59.8,3.76,13.05,scene,false);
    box(0.16,0.1,6.6,M.brand,59.45,3.66,9.1,scene,false);
    box(0.7,0.5,0.04,hbD,58.75,2.3,12.46,scene,false);
    // L/B gauge on the tending side: chart paper behind a red pointer, in a dark frame
    const gc=document.createElement("canvas");gc.width=256;gc.height=192;HB.gc=gc;const gt=new THREE.CanvasTexture(gc);gt.colorSpace=THREE.SRGBColorSpace;HB.gt=gt;
    const GZ=zc+CD/2+0.14;const fr=box(1.1,0.84,0.08,hbD,57.15,2.95,GZ+0.04,scene,false);
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.0,0.75),new THREE.MeshBasicMaterial({map:gt,toneMapped:false}));pl.position.set(57.15,2.95,GZ+0.085);scene.add(pl);
    G3.sliceHit=[pl,fr];}
  box(14,0.25,CD,M.steel,47.8,2.4,zc);                                     // forming table
  const wireRolls=[cylZ(0.5,CD+0.4,M.metal,41,2.4,zc),cylZ(0.5,CD+0.4,M.metal,54.5,2.4,zc)];
  /* v6.12.1-t7 the forming table's zones, headbox to couch, as boxes across the table under the fabric (their ends stand out
     past it on both sides, coloured by zone): the forming board, three gravity boxes, three low vacuum boxes and four high
     vacuum flatboxes, with a name plate under each group on the tending side. On the drive side a short leg from each
     vacuum box drops to a header at 2.15 m (head height, clear of anyone walking under it), which runs to the liquid ring
     vacuum pump on the floor by the back wall, with its separator and a vent up through the roof */
  {const ZS=[{n:"FORMING BOARD",c:"#8d96a3",x:[53.7],w:0.6,vac:false},{n:"GRAVITY BOXES",c:"#9fc6e8",x:[52.5,51.65,50.8],w:0.6,vac:true},
      {n:"LOW VACUUM",c:"#4f8fd1",x:[49.6,48.75,47.9],w:0.6,vac:true},{n:"HIGH VACUUM",c:"#24508f",x:[46.6,45.7,44.8,43.9],w:0.7,vac:true}];
    const Y=2.71,H=0.32,ZL=CD+0.9,ZD=zc-CD/2-0.45,HY=2.15,legs=[];
    ZS.forEach(zz=>{const m=new StdMat({color:lin0(zz.c),roughness:0.6,metalness:0.2});
      zz.x.forEach(x=>{box(zz.w,H,ZL,m,x,Y,zc,scene);box(zz.w+0.06,0.05,ZL+0.04,M.ink,x,Y+H/2,zc,scene,false);if(zz.vac)legs.push(x);});
      const cx=(zz.x[0]+zz.x[zz.x.length-1])/2,c=document.createElement("canvas");c.width=256;c.height=40;const g=c.getContext("2d");g.fillStyle=zz.c;g.fillRect(0,0,256,40);g.fillStyle="#ffffff";g.fillRect(4,4,248,32);
      g.fillStyle="#1c2233";g.font="800 20px system-ui,sans-serif";g.textAlign="center";g.fillText(zz.n,128,28);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
      const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.27),new THREE.MeshBasicMaterial({map:t}));pl.position.set(cx,2.05,zc+CD/2+0.48);scene.add(pl);box(1.76,0.33,0.04,M.ink,cx,2.05,zc+CD/2+0.45,scene,false);});
    legs.forEach(x=>pipe([[x,Y-0.1,ZD],[x,HY,ZD]],0.07,M.steel));
    const PX=50.2,PZ=3.55;pipe([[legs[legs.length-1],HY,ZD],[legs[0],HY,ZD]],0.16,M.steel);spool([[PX,HY,ZD],[PX,HY,PZ+0.3],[PX,1.4,PZ+0.3]],0.16,M.steel);
    // the liquid ring pump: casing, coupling guard and motor on a base plate; the separator beside it and its vent
    box(3.6,0.2,1.3,M.steel,PX+0.7,0.1,PZ,scene);
    {const k=cylZ(0.55,1.0,M.motor,PX,0.78,PZ,20);k.rotation.y=Math.PI/2;const e=cylZ(0.6,0.08,M.steel,PX-0.5,0.78,PZ,20);e.rotation.y=Math.PI/2;
     box(0.5,0.5,0.55,M.warn,PX+0.75,0.75,PZ,scene,false);const mo=cylZ(0.45,1.3,M.motor,PX+1.65,0.7,PZ,16);mo.rotation.y=Math.PI/2;box(0.4,0.3,0.4,M.ink,PX+1.65,1.25,PZ,scene,false);}
    {const sp=new THREE.Mesh(new CylG(0.4,0.4,1.6,16),M.tank);sp.position.set(PX-1.4,1.0,PZ);sp.castShadow=true;scene.add(sp);pipe([[PX-0.6,0.78,PZ],[PX-1.0,0.78,PZ]],0.12,M.steel);pipe([[PX-1.4,1.8,PZ],[PX-1.4,9.5,PZ]],0.1,M.steel);}
    {const c=document.createElement("canvas");c.width=256;c.height=48;const g=c.getContext("2d");g.fillStyle="#ffffff";g.fillRect(0,0,256,48);g.fillStyle="#1c2233";g.font="800 24px system-ui,sans-serif";g.textAlign="center";g.fillText("VACUUM PUMP",128,33);
     const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.28),new THREE.MeshBasicMaterial({map:t}));pl.position.set(PX+0.7,0.45,PZ+0.67);scene.add(pl);}
    G3.FZ3={pump:[PX,PZ]};}
  // twin press: 1st press nip at x 37, 2nd press nip at x 32, each with its own top felt and one tandem bottom felt
  const press=[cylZ(1.05,CD+0.4,M.metal,37,4.45,zc,18),cylZ(1.05,CD+0.4,M.metal,37,2.35,zc,18),cylZ(1.2,CD+0.4,M.metal,32,4.6,zc,18),cylZ(1.2,CD+0.4,M.metal,32,2.2,zc,18)];
  M.felt=mat("g-felt",{roughness:1});
  const fc=document.createElement("canvas");fc.width=64;fc.height=4;const fx2=fc.getContext("2d");fx2.fillStyle="#fff";fx2.fillRect(0,0,64,4);fx2.fillStyle="#9a9a9a";fx2.fillRect(0,0,10,4);
  const feltTex=new THREE.CanvasTexture(fc);feltTex.wrapS=THREE.RepeatWrapping;feltTex.colorSpace=THREE.SRGBColorSpace;
  const feltMat=mat("g-felt",{map:feltTex,side:THREE.DoubleSide,flatShading:false,roughness:1});
  // v6.12.1-t6: each felt has its own texture, a plain felt with one seam line that comes round once per turn of the loop
  // (u runs 0..1 round the loop: once=true); the forming fabric keeps the old pattern every 2.5 m. 43 moves each felt's
  // texture by its own loop length, in its own direction (userData.dir: the press felts' lower runs go with the sheet)
  function seamTex(h=4){const c=document.createElement("canvas");c.width=256;c.height=h;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,256,h);x.fillStyle="#8a8a8a";x.fillRect(0,0,4,h);
    const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.userData.c=c;return t;}
  function feltLoop(pts,lm=feltMat,once=false){const P2=[...pts,pts[0]],pos=[],uv=[],idx=[];let acc=0,L0=0;for(let i=1;i<P2.length;i++)L0+=Math.hypot(P2[i][0]-P2[i-1][0],P2[i][1]-P2[i-1][1]);const uk=once?1/L0:1/2.5;
    P2.forEach((p,i)=>{if(i)acc+=Math.hypot(p[0]-P2[i-1][0],p[1]-P2[i-1][1]);pos.push(p[0],p[1],-(CD-0.2),p[0],p[1],0);uv.push(acc*uk,0,acc*uk,1);if(i){const b=(i-1)*2;idx.push(b,b+1,b+2,b+1,b+3,b+2);}});
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
    const m=new THREE.Mesh(g,lm);m.position.z=zc+CD/2-0.1;m.castShadow=true;m.receiveShadow=true;scene.add(m);
    {const acc2=[0];for(let i=1;i<P2.length;i++)acc2.push(acc2[i-1]+Math.hypot(P2[i][0]-P2[i-1][0],P2[i][1]-P2[i-1][1]));m.userData.path={pts:P2,acc:acc2,L:acc2[acc2.length-1],segs:P2.length-1};}
    return m;}
  // forming fabric (wire) loop over the table and around the breast and couch rolls
  const wireTex=feltTex.clone();wireTex.needsUpdate=true;const wireMat=mat("g-wire",{map:wireTex,side:THREE.DoubleSide,roughness:0.55});
  const wireLoop=feltLoop([[40.9,2.93],[54.6,2.93],[55.05,2.4],[54.6,1.87],[40.9,1.87],[40.45,2.4]],wireMat);
  const feltMeshes=[];
  const feltGuides=[];
  function guide(x,y){feltGuides.push(cylZ(0.28,CD+0.2,M.steel,x,y,zc,10));}
  // 1st press top felt
  // (v5.6: the pick-up felt is the 1st press top felt; it has its own felt texture so the knobs can paint oscillator
  // stripes into it, 40b-3d-knobs.js)
  {const t=seamTex(32);G3.pfCanvas=t.userData.c;G3.pfTex=t;
    const m=feltLoop([[35.6,3.47],[38.4,3.47],[39.4,5.6],[39.2,7.1],[35.2,7.1],[34.9,5.6]],mat("g-felt",{map:t,side:THREE.DoubleSide,flatShading:false,roughness:1}),true);m.userData.dir=1;feltMeshes.push(m);}[[39.4,5.6],[39.2,7.1],[35.2,7.1],[34.9,5.6]].forEach(p=>{guide(...p);feltGuides[feltGuides.length-1].userData.s=-1;});
  // 2nd press top felt
  {const m=feltLoop([[30.5,3.47],[33.5,3.47],[34.2,6.1],[33.8,7.6],[30.3,7.6],[29.8,6.1]],mat("g-felt",{map:seamTex(),side:THREE.DoubleSide,flatShading:false,roughness:1}),true);m.userData.dir=1;feltMeshes.push(m);}[[34.2,6.1],[33.8,7.6],[30.3,7.6],[29.8,6.1]].forEach(p=>{guide(...p);feltGuides[feltGuides.length-1].userData.s=-1;});
  // tandem bottom felt: picks the sheet up off the wire and carries it through both nips
  {const m=feltLoop([[41.2,2.95],[38,3.32],[30.6,3.32],[29.6,2.4],[29.6,0.55],[40.6,0.55],[41.6,1.7]],mat("g-felt",{map:seamTex(),side:THREE.DoubleSide,flatShading:false,roughness:1}),true);m.userData.dir=-1;feltMeshes.push(m);}[[29.6,2.4],[29.6,0.55],[40.6,0.55],[41.6,1.7]].forEach(p=>guide(...p));
  // press frames make the section stand out
  // v6.11 Blender redesign (tools/blender/press_new.py): press stands with bearing housings and top-loading cylinders, a felt-run
  // girder each side carrying the upper guide-roll bearings, pedestals under the lower guide rolls, sole plates, Uhle boxes,
  // felt showers and a hydraulic power unit
  {box(13.6,0.16,0.9,M.ink,35,0.08,5.35,scene,false);
   box(0.34,8.35,0.42,M.steel,35.7,4.175,5.35,scene,false);
   box(0.34,8.35,0.42,M.steel,38.3,4.175,5.35,scene,false);
   box(3.05,0.45,0.55,M.steel,37,1.25,5.35,scene,false);
   box(0.78,0.78,0.55,M.ink,37,2.35,5.35,scene,false);
   box(0.78,0.78,0.55,M.ink,37,4.45,5.35,scene,false);
   {const g=new CylG(0.22,0.22,3.15,10);const o=new THREE.Mesh(g,M.metal);o.position.set(37,6.675,5.35);o.castShadow=true;scene.add(o);}
   {const g=new CylG(0.09,0.09,0.45,8);const o=new THREE.Mesh(g,M.warn);o.position.set(37,5.15,5.35);o.castShadow=true;scene.add(o);}
   box(0.7,0.18,0.7,M.steel,37,8.1,5.35,scene,false);
   cylZ(0.32,0.08,M.metal,37,2.35,5,12);
   cylZ(0.32,0.08,M.metal,37,4.45,5,12);
   box(0.34,8.35,0.42,M.steel,30.55,4.175,5.35,scene,false);
   box(0.34,8.35,0.42,M.steel,33.45,4.175,5.35,scene,false);
   box(3.35,0.45,0.55,M.steel,32,0.95,5.35,scene,false);
   box(0.78,0.78,0.55,M.ink,32,2.2,5.35,scene,false);
   box(0.78,0.78,0.55,M.ink,32,4.6,5.35,scene,false);
   {const g=new CylG(0.22,0.22,3,10);const o=new THREE.Mesh(g,M.metal);o.position.set(32,6.75,5.35);o.castShadow=true;scene.add(o);}
   {const g=new CylG(0.09,0.09,0.45,8);const o=new THREE.Mesh(g,M.warn);o.position.set(32,5.3,5.35);o.castShadow=true;scene.add(o);}
   box(0.7,0.18,0.7,M.steel,32,8.1,5.35,scene,false);
   cylZ(0.32,0.08,M.metal,32,2.2,5,12);
   cylZ(0.32,0.08,M.metal,32,4.6,5,12);
   box(12.6,0.4,0.42,M.steel,34.9,8.35,5.35,scene,false);
   box(0.36,0.5,0.36,M.steel,30,7.83,5.35,scene,false);
   box(0.36,0.5,0.36,M.steel,35,7.83,5.35,scene,false);
   box(0.36,0.5,0.36,M.steel,39.8,7.83,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,39.4,5.6,5.35,scene,false);
   box(0.18,2.5,0.18,M.metal,39.4,6.975,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,39.2,7.1,5.35,scene,false);
   box(0.18,1,0.18,M.metal,39.2,7.725,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,35.2,7.1,5.35,scene,false);
   box(0.18,1,0.18,M.metal,35.2,7.725,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,34.9,5.6,5.35,scene,false);
   box(0.18,2.5,0.18,M.metal,34.9,6.975,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,34.2,6.1,5.35,scene,false);
   box(0.18,2,0.18,M.metal,34.2,7.225,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,33.8,7.6,5.35,scene,false);
   box(0.18,0.5,0.18,M.metal,33.8,7.975,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,30.3,7.6,5.35,scene,false);
   box(0.18,0.5,0.18,M.metal,30.3,7.975,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,29.8,6.1,5.35,scene,false);
   box(0.18,2,0.18,M.metal,29.8,7.225,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,29.6,2.4,5.35,scene,false);
   box(0.4,2.2,0.4,M.steel,29.6,1.1,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,29.6,0.55,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,40.6,0.55,5.35,scene,false);
   box(0.5,0.5,0.4,M.ink,41.6,1.7,5.35,scene,false);
   box(0.4,1.5,0.4,M.steel,41.6,0.75,5.35,scene,false);
   box(13.6,0.16,0.9,M.ink,35,0.08,12.85,scene,false);
   box(0.34,8.35,0.42,M.steel,35.7,4.175,12.85,scene,false);
   box(0.34,8.35,0.42,M.steel,38.3,4.175,12.85,scene,false);
   box(3.05,0.45,0.55,M.steel,37,1.25,12.85,scene,false);
   box(0.78,0.78,0.55,M.ink,37,2.35,12.85,scene,false);
   box(0.78,0.78,0.55,M.ink,37,4.45,12.85,scene,false);
   {const g=new CylG(0.22,0.22,3.15,10);const o=new THREE.Mesh(g,M.metal);o.position.set(37,6.675,12.85);o.castShadow=true;scene.add(o);}
   {const g=new CylG(0.09,0.09,0.45,8);const o=new THREE.Mesh(g,M.warn);o.position.set(37,5.15,12.85);o.castShadow=true;scene.add(o);}
   box(0.7,0.18,0.7,M.steel,37,8.1,12.85,scene,false);
   cylZ(0.32,0.08,M.metal,37,2.35,13.2,12);
   cylZ(0.32,0.08,M.metal,37,4.45,13.2,12);
   box(0.34,8.35,0.42,M.steel,30.55,4.175,12.85,scene,false);
   box(0.34,8.35,0.42,M.steel,33.45,4.175,12.85,scene,false);
   box(3.35,0.45,0.55,M.steel,32,0.95,12.85,scene,false);
   box(0.78,0.78,0.55,M.ink,32,2.2,12.85,scene,false);
   box(0.78,0.78,0.55,M.ink,32,4.6,12.85,scene,false);
   {const g=new CylG(0.22,0.22,3,10);const o=new THREE.Mesh(g,M.metal);o.position.set(32,6.75,12.85);o.castShadow=true;scene.add(o);}
   {const g=new CylG(0.09,0.09,0.45,8);const o=new THREE.Mesh(g,M.warn);o.position.set(32,5.3,12.85);o.castShadow=true;scene.add(o);}
   box(0.7,0.18,0.7,M.steel,32,8.1,12.85,scene,false);
   cylZ(0.32,0.08,M.metal,32,2.2,13.2,12);
   cylZ(0.32,0.08,M.metal,32,4.6,13.2,12);
   box(12.6,0.4,0.42,M.steel,34.9,8.35,12.85,scene,false);
   box(0.36,0.5,0.36,M.steel,30,7.83,12.85,scene,false);
   box(0.36,0.5,0.36,M.steel,35,7.83,12.85,scene,false);
   box(0.36,0.5,0.36,M.steel,39.8,7.83,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,39.4,5.6,12.85,scene,false);
   box(0.18,2.5,0.18,M.metal,39.4,6.975,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,39.2,7.1,12.85,scene,false);
   box(0.18,1,0.18,M.metal,39.2,7.725,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,35.2,7.1,12.85,scene,false);
   box(0.18,1,0.18,M.metal,35.2,7.725,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,34.9,5.6,12.85,scene,false);
   box(0.18,2.5,0.18,M.metal,34.9,6.975,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,34.2,6.1,12.85,scene,false);
   box(0.18,2,0.18,M.metal,34.2,7.225,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,33.8,7.6,12.85,scene,false);
   box(0.18,0.5,0.18,M.metal,33.8,7.975,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,30.3,7.6,12.85,scene,false);
   box(0.18,0.5,0.18,M.metal,30.3,7.975,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,29.8,6.1,12.85,scene,false);
   box(0.18,2,0.18,M.metal,29.8,7.225,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,29.6,2.4,12.85,scene,false);
   box(0.4,2.2,0.4,M.steel,29.6,1.1,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,29.6,0.55,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,40.6,0.55,12.85,scene,false);
   box(0.5,0.5,0.4,M.ink,41.6,1.7,12.85,scene,false);
   box(0.4,1.5,0.4,M.steel,41.6,0.75,12.85,scene,false);
   box(0.5,0.35,6.4,M.metal,37.2,6.82,9.1,scene,false);
   box(0.5,0.35,6.4,M.metal,32,7.32,9.1,scene,false);
   box(0.5,0.35,6.4,M.metal,35,0.3,9.1,scene,false);
   cylZ(0.07,6.6,M.stock,38.6,7.5,9.1,8);
   cylZ(0.07,6.6,M.stock,31.2,8,9.1,8);
   cylZ(0.07,6.6,M.stock,34,0.95,9.1,8);
   box(1.6,1,0.9,M.stock,34.5,0.5,4.05,scene,false);
   box(1.4,0.06,0.7,M.ink,34.5,1.03,4.05,scene,false);}
  const shoeMat=M.stock;
  const cansTop=[],cansBot=[];
  // can ends sample one flat spot of the brushed texture (no streaks across the heads)
  const canGeoFix=o=>{const g=o.geometry,uv=g.attributes.uv,side=g.groups[0].count,idx=g.index,capV=new Set(),sideV=new Set();for(let k=0;k<side;k++)sideV.add(idx.getX(k));for(let k=side;k<idx.count;k++)capV.add(idx.getX(k));
    sideV.forEach(v=>uv.setX(v,uv.getX(v)*0.484));capV.forEach(v=>uv.setXY(v,0.5+uv.getX(v)*0.5,0.5+uv.getY(v)*0.5));return o;};
  for(let i=0;i<10;i++){cansTop.push(canGeoFix(cylZ(1.3,CD,M.can,(872-i*32-600)/10,5.4,zc,16)));cansBot.push(canGeoFix(cylZ(1.3,CD,M.can,(856-i*32-600)/10,2.4,zc,16)));}
  /* v6.1 t3: the 20 spinning dryer cans are one instanced draw. The cans stay as the game's handles (rotated in 43) on a hidden
     layer, out of the static merge; canInst copies their matrices into the instanced mesh each drawn frame. */
  const canInst=(()=>{const all=cansTop.concat(cansBot);all.forEach(o=>{o.layers.set(27);(G3.dynLater||(G3.dynLater=[])).push(o);});
    const im=new THREE.InstancedMesh(all[0].geometry,instMat(M.can),all.length);all.forEach((o,i)=>{o.updateMatrix();im.setMatrixAt(i,o.matrix);});
    im.computeBoundingSphere();im.userData.smBatch=true;im.name="dryer cans";scene.add(im);
    // (v6.1 t10: flat-coloured cylinders turning on their own axis look the same at every angle: no per-frame upload; ?canspin brings it back)
    const spin=/[?&]canspin/.test(location.search);let once=false;
    return ()=>{if(!spin&&once)return;once=true;for(let i=0;i<all.length;i++){const o=all[i];o.updateMatrix();im.setMatrixAt(i,o.matrix);}im.instanceMatrix.needsUpdate=true;};})();
  // machine frame rails + dryer hood frame
  [zc-CD/2-0.6,zc+CD/2+0.6].forEach(z=>{box(74,0.5,0.4,M.steel,26,0.25,z);for(let x=-6;x<=30;x+=6)box(0.35,7.4,0.35,M.steel,x,3.7,z);box(37,0.35,0.35,M.steel,12,7.4,z);});
  // v6.11 Blender redesign (tools/blender/hood_new.py): the dryer hood as a baked cutaway: full drive-side wall, the back part of
  // the roof, stepped end walls and a low tending-side skirt with inked cut edges, so the cans stay in view; exhaust stacks and
  // a supply-air duct on the roof (under the crossover bridge)
  {box(34,8,0.14,M.metal,12,4,5.05,scene,false);
   box(0.07,7.7,0.03,M.steel,-3,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,-1,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,1,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,3,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,5,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,7,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,9,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,11,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,13,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,15,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,17,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,19,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,21,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,23,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,25,4,5.135,scene,false);
   box(0.07,7.7,0.03,M.steel,27,4,5.135,scene,false);
   box(34,0.35,0.2,M.steel,12,0.175,5.05,scene,false);
   box(34.2,0.18,3.69,M.metal,12,8.09,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,-3,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,-1,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,1,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,3,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,5,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,7,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,9,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,11,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,13,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,15,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,17,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,19,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,21,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,23,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,25,8.195,6.825,scene,false);
   box(0.07,0.03,3.55,M.steel,27,8.195,6.825,scene,false);
   box(34.2,0.22,0.1,M.ink,12,8.09,8.62,scene,false);
   box(0.14,8,3.55,M.metal,-5,4,6.825,scene,false);
   box(0.14,3.6,3.95,M.metal,-5,1.8,10.575,scene,false);
   box(0.18,0.1,3.95,M.ink,-5,3.6,10.575,scene,false);
   box(0.18,4.4,0.1,M.ink,-5,5.8,8.6,scene,false);
   box(0.14,8,3.55,M.metal,29,4,6.825,scene,false);
   box(0.14,3.6,3.95,M.metal,29,1.8,10.575,scene,false);
   box(0.18,0.1,3.95,M.ink,29,3.6,10.575,scene,false);
   box(0.18,4.4,0.1,M.ink,29,5.8,8.6,scene,false);
   box(0.16,0.5,6.6,M.ink,29.01,3.9,9.1,scene,false);
   box(0.16,2.2,1.2,M.steel,-5.01,1.1,6.825,scene,false);
   box(34,1.2,0.14,M.metal,12,0.6,12.55,scene,false);
   box(34,0.1,0.18,M.ink,12,1.2,12.55,scene,false);
   box(1.4,0.06,0.04,M.steel,1,1,12.64,scene,false);
   box(1.4,0.06,0.04,M.steel,13,1,12.64,scene,false);
   box(1.4,0.06,0.04,M.steel,25,1,12.64,scene,false);
   {const g=new CylG(0.6,0.6,0.9,12);const o=new THREE.Mesh(g,M.metal);o.position.set(4,8.63,6.6);o.castShadow=true;scene.add(o);}
   {const g=new CylG(0.7,0.7,0.12,12);const o=new THREE.Mesh(g,M.ink);o.position.set(4,9.1,6.6);o.castShadow=true;scene.add(o);}
   {const g=new CylG(0.6,0.6,0.9,12);const o=new THREE.Mesh(g,M.metal);o.position.set(20,8.63,6.6);o.castShadow=true;scene.add(o);}
   {const g=new CylG(0.7,0.7,0.12,12);const o=new THREE.Mesh(g,M.ink);o.position.set(20,9.1,6.6);o.castShadow=true;scene.add(o);}
   box(10,0.42,0.8,M.steel,12,8.39,6,scene,false);
   box(0.5,0.4,0.2,M.ok,10,5.6,5.22,scene,false);}
  /* v6.11.1 the dryer hood's front (tools/blender/hood_front_new.py): the tending-side wall, the front of the roof and the upper end
     walls close the cutaway over the cans, with six lifting doors on chains from a header along the top of their guides. The
     doors go up on their own on a sheet break or whenever the machine is down, and drop again once it runs. The fiddly knob
     (07b "hood") raises them while it runs; 2 s after they are up, the doors and the whole front section fly away like the
     roofs (lift and fade), leaving the v6.11 cutaway, and come back the other way when the knob is closed. Two groups of a
     few merged meshes with their own materials (so they can fade), kept out of the static and moving batches. */
  {const HX0=-5,HX1=29,ZF=12.55,ZD0=12.62,ZD1=12.70,DY0=1.25,DY1=6.15,LIFTD=4.6,HDR=10.95,
     SEAMS=[-5,1.2,7.4,13.5,14.5,19.3,24.1,29],DOORS=[[-4.92,1.12],[1.28,7.32],[7.48,13.42],[14.58,19.22],[19.38,24.02],[24.18,28.92]];
   const HMt={metal:instMat(M.metal),steel:instMat(M.steel),ink:instMat(M.ink),warn:instMat(M.warn)},HMl=Object.values(HMt);
   // boxes by material, merged into one mesh each: [x0,x1,y0,y1,z0,z1]
   const mk=()=>({metal:[],steel:[],ink:[],warn:[]});
   function merged(L,m,parent){const P=[],N=[],U=[],I=[];for(const [x0,x1,y0,y1,z0,z1] of L){const g=new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0);g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
       const b=P.length/3;P.push(...g.attributes.position.array);N.push(...g.attributes.normal.array);U.push(...g.attributes.uv.array);for(const i of g.index.array)I.push(i+b);g.dispose();}
     const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(P,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(N,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(U,2));g.setIndex(I);
     const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;o.userData.smBatch=true;parent.add(o);return o;}
   const FG=new THREE.Group(),DG=new THREE.Group();FG.name="dryer hood front";DG.name="dryer hood doors";scene.add(FG);FG.add(DG);(G3.dynLater||(G3.dynLater=[])).push(FG);
   // ---- the fixed front: fascia over the doors, the panel under the crossover bridge, the front of the roof, the upper end walls, guides and header ----
   {const B=mk();
    B.metal.push([HX0,HX1,DY1+0.05,8.0,ZF-0.07,ZD0],[13.5,14.5,1.2,DY1+0.05,ZF-0.07,ZD0],[HX0-0.1,HX1+0.1,8.0,8.18,8.6,ZD0+0.02]);
    B.ink.push([HX0,HX1,DY1,DY1+0.1,ZF-0.07,ZD0+0.02],[HX0-0.1,HX1+0.1,7.95,8.2,ZD0-0.04,ZD0+0.06]);
    for(let x=HX0+2;x<HX1-0.5;x+=2)B.steel.push([x-0.035,x+0.035,8.18,8.21,8.6,ZF]);
    for(const xe of [HX0,HX1]){B.metal.push([xe-0.07,xe+0.07,3.6,8.0,8.6,ZF]);B.ink.push([xe-0.09,xe+0.09,0,8.0,ZF-0.05,ZF+0.05]);}
    // door guides at every seam (the two beside the crossover bridge stop under its deck), the header with its drive shaft and gear motor
    for(const x of SEAMS){const top=x>13&&x<15?8.6:HDR;B.steel.push([x-0.08,x+0.08,1.2,top,ZD0,ZD1+0.05]);B.ink.push([x-0.1,x+0.1,top-0.06,top,ZD0,ZD1+0.07]);}
    B.steel.push([HX0-0.15,HX1+0.15,HDR,HDR+0.22,ZD0-0.02,ZD1+0.12]);B.ink.push([HX0-0.15,HX1+0.15,HDR+0.2,HDR+0.26,ZD0-0.02,ZD1+0.12]);
    B.warn.push([27.6,28.6,HDR+0.26,HDR+0.86,ZD0,ZD1+0.2]);B.ink.push([26.9,27.6,HDR+0.36,HDR+0.76,ZD0+0.05,ZD1+0.15]);
    for(const k in B)if(B[k].length)merged(B[k],HMt[k],FG);}
   // the chains from the header to each door's lifting lugs (one mesh hung from the header: shortened as the doors rise)
   const CH=(()=>{const L=[];DOORS.forEach(([a,b])=>[a+0.45,b-0.45].forEach(x=>L.push([x-0.025,x+0.025,-1,0,ZD0+0.02,ZD0+0.06])));const o=merged(L,HMt.ink,FG);o.position.y=HDR;o.castShadow=false;return o;})();
   // ---- the six doors: panel, inked top and bottom edges, two stiffeners, a sight glass, the handle, a tag and the lugs ----
   {const B=mk();
    DOORS.forEach(([a,b])=>{const c=(a+b)/2;
      B.metal.push([a,b,DY0,DY1,ZD0,ZD1]);B.ink.push([a,b,DY1-0.1,DY1,ZD0-0.01,ZD1+0.02],[a,b,DY0,DY0+0.1,ZD0-0.01,ZD1+0.02]);
      for(const y of [2.85,4.45])B.steel.push([a+0.15,b-0.15,y-0.05,y+0.05,ZD1,ZD1+0.05]);
      B.steel.push([c-0.56,c+0.56,3.24,4.01,ZD1,ZD1+0.03]);B.ink.push([c-0.48,c+0.48,3.32,3.93,ZD1,ZD1+0.045]);
      B.warn.push([c-0.7,c+0.7,1.6,1.7,ZD1,ZD1+0.06],[a+0.25,a+0.75,5.4,5.75,ZD1,ZD1+0.03]);
      for(const x of [a+0.45,b-0.45])B.ink.push([x-0.09,x+0.09,DY1,DY1+0.16,ZD0+0.01,ZD1-0.01]);});
    for(const k in B)merged(B[k],HMt[k],DG);}
   // ---- the animation (43 calls this every frame): u = doors up (0..1), f = front section flown away (0..1) ----
   const HOOD={u:0,f:0,a:1,want:false,upT:0,knob:false,last:false};G3.HOOD=HOOD;
   const ss=t=>t*t*(3-2*t);let shownA=-1;
   function hoodShow(a){if(a===shownA)return;shownA=a;const solid=a>0.995;FG.visible=a>0.02;FG.position.y=(1-a)*(1-a)*9;
     for(const m of HMl){if(m.transparent!==!solid){m.transparent=!solid;m.needsUpdate=true;}m.depthWrite=solid;m.opacity=a;}
     const sh=a>0.6;FG.traverse(o=>{if(o.isMesh&&o!==CH)o.castShadow=sh;});}
   // (the prewarm draws it half faded, so the transparent shaders are compiled at start-up, 31)
   G3.hoodWarm=on=>hoodShow(on?0.5:HOOD.a);
   G3.hoodTick=rdt=>{if(!(rdt>0))return;const knob=!S.zen&&knobVal("hood")===1,auto=S.pm!=="run"||outOn()||!!(G3.sheetRide&&G3.sheetRide.on)||!!G3.zenHood;   // (v6.13: the sheet camera lifts the doors to look in, 50m)
     if(knob&&!HOOD.knob&&HOOD.u<0.5)try{AUDIO.sfx("hiss",400);}catch(_){}   // (the hood's air cylinders letting go)
     if(!knob&&HOOD.knob&&HOOD.u>0.5&&!auto)try{AUDIO.sfx("clunk",400);}catch(_){}
     HOOD.knob=knob;HOOD.want=knob||auto||HOOD.f>0.002;
     const u0=HOOD.u;HOOD.u=clamp(HOOD.u+(HOOD.want?1:-1)*rdt/2.2,0,1);
     if(HOOD.u>=1&&u0<1)HOOD.upT=0;if(HOOD.u>=1)HOOD.upT+=rdt;
     // steam rolling out from under the doors as they open on a hot hood
     if(HOOD.want&&HOOD.u>0.05&&HOOD.u<0.9&&HOOD.f<0.5&&Math.random()<rdt*14)emitA("steam",HX0+Math.random()*(HX1-HX0),DY0+0.5+Math.random()*1.5,ZD1+0.3,(Math.random()-0.5)*0.4,0.5+Math.random()*0.4,0.35,3,2.4+Math.random()*2,"#eef1f4",0.45);
     const ft=(knob||!!(G3.sheetRide&&G3.sheetRide.on))&&HOOD.u>=1&&HOOD.upT>=2?1:0;   /* (v6.13: and for the sheet camera, so it can look in) */HOOD.f=Math.abs(ft-HOOD.f)<0.004?ft:HOOD.f+(ft-HOOD.f)*(1-Math.exp(-Math.min(0.25,rdt)*11));
     HOOD.a=1-HOOD.f;hoodShow(HOOD.a);
     const lift=ss(HOOD.u)*LIFTD;if(DG.position.y!==lift){DG.position.y=lift;CH.scale.y=Math.max(0.01,HDR-(DY1+0.16+lift));}};
   CH.scale.y=HDR-(DY1+0.16);}
  // reel + stand, winder, roll conveyor
  const popeDrum=cylZ(DR,CD,M.metal,DX,DY,zc,32);for(let k=0;k<8;k++){const a=k/8*Math.PI*2;box(0.06,0.06,CD,M.steel,Math.cos(a)*DR,Math.sin(a)*DR,0,popeDrum,false);}
  cylZ(0.2,CD+1.8,M.ink,DX,DY,zc,10);[zc-ZJ,zc+ZJ].forEach(z=>{
    box(DX-(KX-1.4),0.35,0.5,M.steel,(DX+KX-1.4)/2-0.3,DY-0.42,z);for(let x=DX-0.6;x>=KX-1;x-=3)box(0.4,DY-0.6,0.4,M.steel,x,(DY-0.6)/2,z);box(0.5,0.9,0.6,M.bad,KX-RM*0+(-0.95),DY+0.1,z);});
  // v6.11 Blender redesign (tools/blender/reelwind_new.py): reel drum stands with base plates and bearings, capped rails, the
  // drive-side drum motor and gearbox
  {box(1.9,0.12,0.8,M.ink,-5.6,0.06,5.45,scene,false);
   box(0.32,3.9,0.5,M.steel,-6.15,1.95,5.45,scene,false);
   box(0.32,3.9,0.5,M.steel,-5.05,1.95,5.45,scene,false);
   box(1.45,0.3,0.55,M.steel,-5.6,3.75,5.45,scene,false);
   box(0.8,0.8,0.62,M.ink,-5.6,4.2,5.45,scene,false);
   box(7.1,0.08,0.32,M.metal,-9.45,4,5.45,scene,false);
   box(0.7,0.1,0.7,M.ink,-6.2,0.05,5.45,scene,false);
   box(0.7,0.1,0.7,M.ink,-9.2,0.05,5.45,scene,false);
   box(0.7,0.1,0.7,M.ink,-12.2,0.05,5.45,scene,false);
   box(1.9,0.12,0.8,M.ink,-5.6,0.06,12.75,scene,false);
   box(0.32,3.9,0.5,M.steel,-6.15,1.95,12.75,scene,false);
   box(0.32,3.9,0.5,M.steel,-5.05,1.95,12.75,scene,false);
   box(1.45,0.3,0.55,M.steel,-5.6,3.75,12.75,scene,false);
   box(0.8,0.8,0.62,M.ink,-5.6,4.2,12.75,scene,false);
   box(7.1,0.08,0.32,M.metal,-9.45,4,12.75,scene,false);
   box(0.7,0.1,0.7,M.ink,-6.2,0.05,12.75,scene,false);
   box(0.7,0.1,0.7,M.ink,-9.2,0.05,12.75,scene,false);
   box(0.7,0.1,0.7,M.ink,-12.2,0.05,12.75,scene,false);
   cylZ(0.48,1.1,M.stock,-5.6,4.2,4.5,14);
   box(0.7,0.7,0.6,M.steel,-5.6,4.2,5.3,scene,false);
   box(1,3.85,0.9,M.steel,-5.6,1.925,4.5,scene,false);}
  // one reel spool model: steel shell + long journals, paper scaled on as it builds
  function spoolModel(parent){const g=new THREE.Group();parent.add(g);const spin=new THREE.Group();g.add(spin);cylZ(R0,CD+0.4,M.steel,0,0,0,20,spin);cylZ(0.22,CD+2.2,M.ink,0,0,0,10,spin);
    const pg=new CylG(1,1,CD,40);pg.rotateX(Math.PI/2);const paper=new THREE.Mesh(pg,ROLLM);paper.castShadow=paper.receiveShadow=true;spin.add(paper);
    const mk=box(0.07,0.07,CD+0.02,M.ink,0,1,0,spin,false);
    return {g,spin,paper,set(R){paper.visible=R>R0+0.02;if(paper.visible)paper.scale.set(R,R,1);mk.position.y=Math.max(R,R0)+0.01;}};}
  const reelB=spoolModel(scene),reelK=spoolModel(scene),reelN=spoolModel(scene);reelK.g.visible=false;
  const reel=reelB.paper;
  const prim=[zc-ZJ,zc+ZJ].map(z=>{const g=new THREE.Group();g.position.set(DX,DY,z);scene.add(g);const a=box(1,0.3,0.3,M.brand,0.5,0,0,g);cylZ(0.34,0.4,M.ink,0,0,0,14,g);const cup=cylZ(0.28,0.45,M.ink,1,0,0,14,g);return {g,a,cup};});
  const secC=[zc-ZJ,zc+ZJ].map(z=>{const g=new THREE.Group();scene.add(g);box(0.8,0.5,0.6,M.brand,0,DY-0.05,z,g);box(0.25,0.9,0.4,M.brand,0.15,DY+0.3,z,g);return g;});
  // turn-up state: TU.t counts visual seconds since the last turn-up
  const TU={t:99,seen:-1,armHas:true,armAng:120*Math.PI/180,armD:DR+R0,kick:false,kx:0};
  // roll handling: kicker ramp off the winder drums, upender, then a roll conveyor south and west through the warehouse door
  {const rp=new THREE.Mesh(new THREE.BoxGeometry(2.4,0.18,4.8),M.steel);rp.position.set(-21.7,0.95,zc);rp.rotation.z=0.33;rp.castShadow=true;scene.add(rp);
    [-2.5,2.5].forEach(dz=>box(2.4,0.6,0.1,M.warn,-21.7,1.2,zc+dz,scene,false));box(0.5,1.2,0.5,M.brand,-20.6,0.6,zc-2.6,scene,false);
    box(1.6,0.7,1.8,M.brand,-22.9,0.35,zc,scene);
    box(1.5,0.5,19.4-zc+1.0,M.steel,-22.9,0.25,(zc+19.4)/2+0.3,scene);box(7.6,0.5,1.5,M.steel,-26.6,0.25,19.4,scene);
    [[-22.15,(zc+19.4)/2],[-23.65,(zc+19.4)/2]].forEach(([x,z])=>box(0.08,0.25,19.4-zc,M.warn,x,0.6,z+0.3,scene,false));
    box(0.3,0.9,1.6,M.bad,-30.5,0.45,19.4,scene,false);}
  const rollGeo=new CylG(0.62,0.62,1.4,24);
  const _rc=new THREE.Color(),_one=new THREE.Vector3(1,1,1),qB=new THREE.Quaternion(),_yAx=new THREE.Vector3(0,1,0),_eu=new THREE.Euler(),_sc=new THREE.Vector3();const beltRolls=new THREE.InstancedMesh(rollGeo,ROLLC(),16);{const c=new THREE.Color(1,1,1);for(let k=0;k<16;k++)beltRolls.setColorAt(k,c);}beltRolls.castShadow=true;beltRolls.frustumCulled=false;scene.add(beltRolls);   // (v6.5.7: its bounds were taken once, before any roll was placed, so it vanished whenever the origin was off screen)

  // sheet ribbon along the machine
  const tc=document.createElement("canvas");tc.width=64;tc.height=4;const tx=tc.getContext("2d");tx.fillStyle="#fff";tx.fillRect(0,0,64,4);tx.fillStyle="#c8c8c8";tx.fillRect(0,0,6,4);
  const sheetTex=new THREE.CanvasTexture(tc);sheetTex.wrapS=THREE.RepeatWrapping;sheetTex.colorSpace=THREE.SRGBColorSpace;
  const sheetMat=mat("paperc",{map:sheetTex,side:THREE.DoubleSide,flatShading:false,roughness:1});
  // the sheet runs over the top cans and under the bottom cans (serpentine), with true tangent lines between them
  const sheetPre=[[55.1,3.07],[54.0,2.95],[41,3.0],[37,3.4],[32,3.4],[29,3.6]],CANR=1.34;
  const canCirc=[];for(let i=0;i<10;i++){canCirc.push({x:(872-i*32-600)/10,y:5.4,d:1});canCirc.push({x:(856-i*32-600)/10,y:2.4,d:-1});}
  // v6.11 the remoisturizing spray boom (standard, 07k): a beam across the sheet between the last dryer and the reel, 12 nozzle
  // zones on its underside, a water header from the drive side
  {const X=-3.3,Y=5.3,Z0=zc-CD/2-0.25,Z1=zc+CD/2+0.25,L=Z1-Z0;box(0.42,0.36,L,M.steel,X,Y,zc,scene,false);box(0.46,0.06,L+0.1,M.ink,X,Y-0.21,zc,scene,false);
    for(let k=0;k<12;k++){const z=Z0+0.15+(k+0.5)*(L-0.3)/12;box(0.12,0.14,0.12,M.stock,X,Y-0.3,z,scene,false);}
    [Z0-0.05,Z1+0.05].forEach(z=>box(0.16,Y,0.16,M.steel,X,Y/2,z,scene,false));pipe([[X,Y+0.25,Z0],[X,Y+0.25,Z0-1.2],[X,0.6,Z0-1.2]],0.1,M.ww);}
  // Pope reel: the sheet wraps the reel drum and goes into the nip with the building reel (or the new spool right after turn-up)
  canCirc.push({x:DX,y:DY,d:1,r:DR});
  // tangent point on circle c for a straight run between the circle and point q; "out" = leaving the circle toward q
  const tanPt=(c,q,out)=>{const CR0=c.r||CANR,dx=q[0]-c.x,dy=q[1]-c.y,D=Math.hypot(dx,dy),ph=Math.atan2(dy,dx),al=Math.acos(Math.min(1,CR0/D));let best=null,bv=-9;
    for(const sg of [1,-1]){const th=ph+sg*al,tx=c.x+CR0*Math.cos(th),ty=c.y+CR0*Math.sin(th),vx=c.d*-Math.sin(th),vy=c.d*Math.cos(th),lx=out?q[0]-tx:tx-q[0],ly=out?q[1]-ty:ty-q[1],v=(vx*lx+vy*ly)/Math.hypot(lx,ly);if(v>bv){bv=v;best=th;}}return best;};
  function sheetPath(reelR){const pts=[...sheetPre],key=[0,1,2,3,4,5],end=[DX+(DR+0.02)*Math.cos(nipPhi),DY+(DR+0.02)*Math.sin(nipPhi)];
    for(let i=0;i<canCirc.length;i++){const c=canCirc[i],prev=i?[(canCirc[i-1].x+c.x)/2,(canCirc[i-1].y+c.y)/2]:sheetPre[sheetPre.length-1],next=i<canCirc.length-1?[(canCirc[i+1].x+c.x)/2,(canCirc[i+1].y+c.y)/2]:end;
      const t0=tanPt(c,prev,false);let t1=tanPt(c,next,true),dl=(t1-t0)*c.d;while(dl<0)dl+=Math.PI*2;while(dl>Math.PI*2)dl-=Math.PI*2;
      const n=Math.max(3,Math.ceil(dl/0.3)),cr=(c.r||CANR)+(c.r?0.03:0);for(let k=0;k<=n;k++){const th=t0+c.d*dl*k/n;pts.push([c.x+cr*Math.cos(th),c.y+cr*Math.sin(th)]);if(k===Math.floor(n/2))key.push(pts.length-1);}}
    pts.push(end);key.push(pts.length-1);return {pts,key};}
  // v4.1 pass 3: the sheet is one geometry updated in place as the reel grows (it was rebuilt from scratch, arrays, normals
  // and all, every time the nip moved 0.02 rad: the single largest steady allocation in the game at speed)
  let sheetKey=[],sheetN=0;const SHEET_CAP=512;
  const sheetG=new THREE.BufferGeometry(),sheetPos=new Float32Array(SHEET_CAP*6),sheetUV=new Float32Array(SHEET_CAP*4),sheetIdx=new Uint16Array((SHEET_CAP-1)*6);
  sheetG.setAttribute("position",new THREE.BufferAttribute(sheetPos,3));sheetG.setAttribute("uv",new THREE.BufferAttribute(sheetUV,2));sheetG.setAttribute("normal",new THREE.BufferAttribute(new Float32Array(SHEET_CAP*6),3));sheetG.setIndex(new THREE.BufferAttribute(sheetIdx,1));
  const sheetMesh=new THREE.Mesh(sheetG,sheetMat);sheetMesh.receiveShadow=true;sheetMesh.frustumCulled=false;scene.add(sheetMesh);
  function buildSheet(reelR){G3.sheetBuilds=(G3.sheetBuilds||0)+1;const sp=sheetPath(reelR),pts=sp.pts,n=Math.min(pts.length,SHEET_CAP);sheetKey=sp.key;let acc=0;
    for(let i=0;i<n;i++){const p=pts[i];if(i)acc+=Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]);const v=i*6,u=i*4;
      sheetPos[v]=p[0];sheetPos[v+1]=p[1];sheetPos[v+2]=zc-CD/2+0.2;sheetPos[v+3]=p[0];sheetPos[v+4]=p[1];sheetPos[v+5]=zc+CD/2-0.2;sheetUV[u]=acc/3;sheetUV[u+1]=0;sheetUV[u+2]=acc/3;sheetUV[u+3]=1;
      if(i){const b=(i-1)*2,q=(i-1)*6;sheetIdx[q]=b;sheetIdx[q+1]=b+1;sheetIdx[q+2]=b+2;sheetIdx[q+3]=b+1;sheetIdx[q+4]=b+3;sheetIdx[q+5]=b+2;}}
    for(let q=(n-1)*6;q<(sheetN-1)*6;q++)sheetIdx[q]=0;   // a shorter path: the old tail becomes degenerate triangles (no normals from it)
    sheetN=n;sheetG.attributes.position.needsUpdate=true;sheetG.attributes.uv.needsUpdate=true;sheetG.index.needsUpdate=true;sheetG.computeVertexNormals();sheetG.attributes.normal.needsUpdate=true;}
  buildSheet(1);let sheetR=1;
  /* v6.12.1-t5 tail threading: after a break the sheet goes back through the machine one section at a time (presses,
     first dryer section, second dryer section, reel). In each section a narrow tail on the tending side (+z, the operators'
     aisle) is fed through first, then it is widened out to the full sheet across that section. tailMesh is the tail (or the
     widening sheet) over the section being threaded; it shares the sheet's uv, normals and index and has its own positions.
     THR.at(from,th) maps the rethread's progress th (0..1) to {full: key the full sheet reaches, a, b: points the tail spans,
     w: its width}. Visual only: the rethread takes as long as before */
  const THR={secs:[2,5,16,26,27],TW:0.32,FW:CD-0.4};
  const tailPos=new Float32Array(SHEET_CAP*6),tailG=new THREE.BufferGeometry();tailG.setAttribute("position",new THREE.BufferAttribute(tailPos,3));
  tailG.setAttribute("uv",sheetG.attributes.uv);tailG.setAttribute("normal",sheetG.attributes.normal);tailG.setIndex(sheetG.index);
  const tailMesh=new THREE.Mesh(tailG,sheetMat);tailMesh.receiveShadow=true;tailMesh.frustumCulled=false;tailMesh.visible=false;scene.add(tailMesh);
  THR.at=(from,th)=>{const B=[from,...THR.secs.filter(k=>k>from)];const n=B.length-1;if(n<1||th>=1)return {full:27,a:0,b:0,w:0};if(th<=0)return {full:from,a:0,b:0,w:0};
    const f=th*n,i=Math.min(n-1,Math.floor(f)),u=f-i,pa=sheetKey[B[i]]||0,pb=sheetKey[Math.min(B[i+1],sheetKey.length-1)]||pa;
    return u<0.6?{full:B[i],a:pa,b:pa+Math.max(1,Math.round((pb-pa)*u/0.6)),w:THR.TW}:{full:B[i],a:pa,b:pb,w:THR.TW+(THR.FW-THR.TW)*clamp((u-0.6)/0.35,0,1)};};
  // the tail over points a..b, w wide from the tending-side edge of the sheet
  THR.set=(a,b,w)=>{const z1=zc+CD/2-0.2,z0=z1-w;b=Math.min(b,sheetN-1);if(b<=a){tailMesh.visible=false;return;}
    for(let i=a;i<=b;i++){const v=i*6;tailPos[v]=sheetPos[v];tailPos[v+1]=sheetPos[v+1];tailPos[v+2]=z0;tailPos[v+3]=sheetPos[v+3];tailPos[v+4]=sheetPos[v+4];tailPos[v+5]=z1;}
    tailG.attributes.position.needsUpdate=true;tailG.setDrawRange(a*6,(b-a)*6);tailMesh.visible=true;};
  THR.mesh=tailMesh;G3.THR=THR;
  // v3.2.0 slice + wet line. G3.SLC.v = vertical slice (-1 closed .. +1 open), .h = horizontal lip (-1 back .. +1 forward).
  // Cosmetic only: the lip moves, the jet tips up or down and lands nearer or further, and the wavy wet line slides along the wire.
  const SLC=G3.SLC={v:0,h:0,dirty:true};
  const _geo={lipX:0,lipY:0,land:0,wet:0};   // (one reused object: this is read every frame)
  SLC.geo=()=>{const lipX=55.12-0.22*SLC.h;_geo.lipX=lipX;_geo.lipY=3.1+0.07*SLC.v;_geo.land=lipX-(1.0+0.6*SLC.v+0.25*SLC.h);_geo.wet=50.2-1.9*SLC.v-1.0*SLC.h;return _geo;};
  const WN=48,wetPos=new Float32Array((WN+1)*2*3),edgePos=new Float32Array((WN+1)*2*3),wIdx=[];for(let i=0;i<WN;i++){const b=i*2;wIdx.push(b,b+1,b+2,b+1,b+3,b+2);}
  const wetG=new THREE.BufferGeometry();wetG.setAttribute("position",new THREE.BufferAttribute(wetPos,3));wetG.setIndex(wIdx);
  const edgeG=new THREE.BufferGeometry();edgeG.setAttribute("position",new THREE.BufferAttribute(edgePos,3));edgeG.setIndex(wIdx);
  const wetM=new THREE.MeshStandardMaterial({color:0xa69a86,roughness:0.12,metalness:0.25,transparent:true,opacity:0.28,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:THREE.DoubleSide});
  const edgeM=new THREE.MeshBasicMaterial({color:0xf3efe2,transparent:true,opacity:0.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,side:THREE.DoubleSide});
  const jetPos=new Float32Array(12),jetG=new THREE.BufferGeometry();jetG.setAttribute("position",new THREE.BufferAttribute(jetPos,3));jetG.setIndex([0,1,2,1,3,2]);
  const jetMesh=new THREE.Mesh(jetG,wetM);jetMesh.renderOrder=3;jetMesh.frustumCulled=false;scene.add(jetMesh);
  const wetMesh=new THREE.Mesh(wetG,wetM),edgeMesh=new THREE.Mesh(edgeG,edgeM);wetMesh.renderOrder=3;edgeMesh.renderOrder=4;wetMesh.frustumCulled=edgeMesh.frustumCulled=false;scene.add(wetMesh);scene.add(edgeMesh);
  let jetK="",wetT=0;G3.sliceFrame=(now,show)=>{{const s=slcGet();if(SLC.v!==s.v||SLC.h!==s.h){SLC.v=s.v;SLC.h=s.h;SLC.dirty=true;}}   // (v6.5.5: the sim's knob state is the slice's truth: saves, restores, new games)
    const g=SLC.geo();
    if(SLC.dirty){SLC.dirty=false;sheetPre[0][0]=g.lipX;sheetPre[0][1]=g.lipY-0.03;sheetPre[1][0]=g.land;buildSheet(sheetR);if(G3.HB&&G3.HB.lip)G3.HB.lip.position.set(g.lipX+0.21,g.lipY+0.03,zc);G3.drawLB&&G3.drawLB();}
    wetMesh.visible=edgeMesh.visible=jetMesh.visible=show;if(!show)return;
    {const zA=zc-CD/2+0.2,zB=zc+CD/2-0.2,y0=g.lipY-0.015,y1=2.97;jetPos[0]=g.lipX;jetPos[1]=y0;jetPos[2]=zA;jetPos[3]=g.lipX;jetPos[4]=y0;jetPos[5]=zB;jetPos[6]=g.land-0.05;jetPos[7]=y1;jetPos[8]=zA;jetPos[9]=g.land-0.05;jetPos[10]=y1;jetPos[11]=zB;const jk=g.lipX+"|"+g.lipY+"|"+g.land;if(jk!==jetK){jetK=jk;jetG.attributes.position.needsUpdate=true;}}if(now<wetT)return;wetT=now+83;   /* (t10: the wet line ripples at 12 frames a second, like the cut-outs) */const t=now/1000,Y=3.0,z0=zc-CD/2+0.2,z1=zc+CD/2-0.2;
    for(let i=0;i<=WN;i++){const z=z0+(z1-z0)*i/WN,w=g.wet+0.18*Math.sin(z*1.9+t*0.7)+0.08*Math.sin(z*4.7-t*1.3)+0.035*Math.sin(z*11+t*2.1),o=i*6;
      wetPos[o]=w;wetPos[o+1]=Y;wetPos[o+2]=z;wetPos[o+3]=g.land-0.05;wetPos[o+4]=Y;wetPos[o+5]=z;
      edgePos[o]=w-0.03;edgePos[o+1]=Y+0.004;edgePos[o+2]=z;edgePos[o+3]=w+0.04;edgePos[o+4]=Y+0.004;edgePos[o+5]=z;}
    wetG.attributes.position.needsUpdate=true;edgeG.attributes.position.needsUpdate=true;if(!wetG.boundingSphere)wetG.computeBoundingSphere();};
  // the L/B gauge: chart paper with the lip position as a red pointer (B up the side = vertical slice, L along the bottom = horizontal)
  G3.drawLB=(c)=>{const tgt=[G3.HB&&G3.HB.gc,c||document.getElementById("slcT")].filter(Boolean);
    tgt.forEach(cv=>{const x=cv.getContext("2d"),W=cv.width,H=cv.height,m=W*0.1,gw=W-m*1.5,gh=H-m*1.6,ox=m,oy=m*0.6;
      x.fillStyle="#f5f1de";x.fillRect(0,0,W,H);
      for(let k=0;k<=20;k++){const bold=k%5===0;x.strokeStyle=bold?"#9fc49a":"#d3e6cd";x.lineWidth=bold?Math.max(1.5,W/220):Math.max(0.7,W/600);
        x.beginPath();x.moveTo(ox+gw*k/20,oy);x.lineTo(ox+gw*k/20,oy+gh);x.stroke();if(k<=14){x.beginPath();x.moveTo(ox,oy+gh*k/14);x.lineTo(ox+gw,oy+gh*k/14);x.stroke();}}
      // sweet-spot band
      x.fillStyle="rgba(63,160,90,0.12)";x.fillRect(ox+gw*0.3,oy+gh*0.3,gw*0.4,gh*0.4);
      x.fillStyle="#3b4a5a";x.font=`700 ${Math.round(W/16)}px system-ui,sans-serif`;x.fillText("Slice opening",ox+4,oy+W/14);
      x.font=`600 ${Math.round(W/26)}px system-ui,sans-serif`;x.fillStyle="#5d6b78";x.textAlign="center";x.fillText("L · horizontal",ox+gw/2,H-W*0.025);
      x.save();x.translate(W*0.045,oy+gh/2);x.rotate(-Math.PI/2);x.fillText("B · vertical",0,0);x.restore();x.textAlign="left";
      const px=ox+gw*(0.5+0.42*SLC.h),py=oy+gh*(0.5-0.42*SLC.v);
      x.strokeStyle="#c8281e";x.lineWidth=Math.max(2,W/120);x.beginPath();x.moveTo(ox+gw,oy+gh);x.lineTo(px,py);x.stroke();
      x.fillStyle="#c8281e";x.beginPath();x.arc(px,py,Math.max(4,W/40),0,7);x.fill();x.strokeStyle="#fff";x.lineWidth=Math.max(1,W/260);x.stroke();});
    if(G3.HB&&G3.HB.gt)G3.HB.gt.needsUpdate=true;};

  // inventory: bale stacks and roll stacks
  // bale rows sit between forklift aisles: z -7.3, the walking-floor aisle at -11.5, and -15.7; a cross lane runs along the dock wall at x -32.3
  const BALEROWS=[-5.6,-9.0,-14.0,-17.4],FKA=[-7.3,-11.5,-15.7],FKLANE=-32.3;
  function fkLeg(A,B){const P=[A];if(Math.abs(A[1]-B[1])>0.05){P.push([FKLANE,A[1]],[FKLANE,B[1]]);}P.push(B);
    let L=0;const seg=[];for(let i=1;i<P.length;i++){const d=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);seg.push(d);L+=d;}return {P,seg,L};}
  function fkAt(leg,t){let d=t*leg.L;for(let i=0;i<leg.seg.length;i++){const a=leg.P[i],b=leg.P[i+1];if(d<=leg.seg[i]||i===leg.seg.length-1){const k=leg.seg[i]>0?Math.min(1,d/leg.seg[i]):0;return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,Math.atan2(-(b[1]-a[1]),b[0]-a[0]||1e-6)];}d-=leg.seg[i];}const e=leg.P[leg.P.length-1];return [e[0],e[1],0];}
  const bales=graded(new THREE.BoxGeometry(1.2,0.9,1.2),168,{recv:true}),baleM=[];
  {const m4=new THREE.Matrix4();for(let i=0;i<168;i++){const layer=i%3,col=Math.floor(i/3)%14,row=Math.floor(i/42);
    m4.makeTranslation(-30+col*1.45,0.5+layer*0.92,BALEROWS[row]);baleM.push(m4.clone());}}
  let baleShown=-1;
  const rolls=new THREE.InstancedMesh(rollGeo,instMat(ROLLM),84);rolls.castShadow=true;rolls.receiveShadow=true;scene.add(rolls);
  {const m4=new THREE.Matrix4();for(let i=0;i<84;i++){m4.makeTranslation(-45+(i%12)*1.75,0.74,31.2-Math.floor(i/12)*1.7);rolls.setMatrixAt(i,m4);}}

