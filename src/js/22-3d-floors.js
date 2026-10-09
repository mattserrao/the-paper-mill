  // ---- v2.9.14 lived-in floors: one painted canvas decal per building (bays, aisles, walkways, parking, scuffs, stains,
  // joints) = one draw call each, plus a few instanced props (pallets, bollards, bins, chargers, extinguishers) ----
  function floorDecal(x0,x1,z0,z1,ppm,paint){const W2=Math.round((x1-x0)*ppm),H2=Math.round((z1-z0)*ppm),c=document.createElement("canvas");c.width=W2;c.height=H2;
    const x=c.getContext("2d"),X=v=>(v-x0)*ppm,Z=v=>(v-z0)*ppm;paint(x,X,Z,ppm,W2,H2);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
    const m=new THREE.MeshLambertMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    const o=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),m);o.rotation.x=-Math.PI/2;o.position.set((x0+x1)/2,0.055,(z0+z1)/2);o.receiveShadow=true;o.renderOrder=1;scene.add(o);return o;}
  let dSeed=7;const drnd=()=>{dSeed=(dSeed*16807)%2147483647;return dSeed/2147483647;};
  const dScuffs=(x,X,Z,ppm,pts,n)=>{for(let k=0;k<n;k++){const [cx,cz,sp]=pts[Math.floor(drnd()*pts.length)],px=X(cx+(drnd()-0.5)*sp),pz=Z(cz+(drnd()-0.5)*sp*0.6),r=(0.6+drnd()*1.6)*ppm,a0=drnd()*6.28;
      x.strokeStyle=`rgba(30,30,34,${0.035+drnd()*0.06})`;x.lineWidth=(0.08+drnd()*0.07)*ppm;x.beginPath();x.arc(px,pz,r,a0,a0+0.4+drnd()*1.2);x.stroke();
      if(drnd()<0.5){x.beginPath();x.arc(px+0.28*ppm,pz+0.16*ppm,r,a0,a0+0.3+drnd()*0.8);x.stroke();}}};
  const dStains=(x,X,Z,ppm,x0,x1,z0,z1,n)=>{for(let k=0;k<n;k++){const px=X(x0+drnd()*(x1-x0)),pz=Z(z0+drnd()*(z1-z0)),r=(0.3+drnd()*1.1)*ppm;
      const g=x.createRadialGradient(px,pz,0,px,pz,r);g.addColorStop(0,`rgba(${drnd()<0.5?"60,48,30":"40,40,44"},${0.10+drnd()*0.1})`);g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.beginPath();x.ellipse(px,pz,r,r*(0.5+drnd()*0.5),drnd()*3,0,7);x.fill();}};
  const dJoints=(x,W2,H2,ppm)=>{x.strokeStyle="rgba(0,0,0,0.07)";x.lineWidth=2;for(let v=6*ppm;v<W2;v+=6*ppm){x.beginPath();x.moveTo(v,0);x.lineTo(v,H2);x.stroke();}for(let v=6*ppm;v<H2;v+=6*ppm){x.beginPath();x.moveTo(0,v);x.lineTo(W2,v);x.stroke();}};
  const dBox=(x,X,Z,a,b,c,d,col,w)=>{x.strokeStyle=col;x.lineWidth=w;x.strokeRect(X(a),Z(c),X(b)-X(a),Z(d)-Z(c));};
  const dHatch=(x,X,Z,ppm,a,b,c,d,c1,c2)=>{x.save();x.beginPath();x.rect(X(a),Z(c),X(b)-X(a),Z(d)-Z(c));x.clip();x.fillStyle=c1;x.fillRect(X(a),Z(c),X(b)-X(a),Z(d)-Z(c));x.strokeStyle=c2;x.lineWidth=0.18*ppm;
    for(let v=-40;v<80;v+=0.6){x.beginPath();x.moveTo(X(a+v),Z(c));x.lineTo(X(a+v+ (d-c)),Z(d));x.stroke();}x.restore();};
  const dDashH=(x,X,Z,ppm,a,b,z,col)=>{x.strokeStyle=col;x.lineWidth=0.12*ppm;x.setLineDash([1.2*ppm,0.9*ppm]);x.beginPath();x.moveTo(X(a),Z(z));x.lineTo(X(b),Z(z));x.stroke();x.setLineDash([]);};
  const dDashV=(x,X,Z,ppm,xx,c,d,col)=>{x.strokeStyle=col;x.lineWidth=0.12*ppm;x.setLineDash([1.2*ppm,0.9*ppm]);x.beginPath();x.moveTo(X(xx),Z(c));x.lineTo(X(xx),Z(d));x.stroke();x.setLineDash([]);};
  const dTxt=(x,X,Z,ppm,s2,cx,cz,size,col,rot=0)=>{x.save();x.translate(X(cx),Z(cz));x.rotate(rot);x.fillStyle=col;x.font=`800 ${size*ppm}px "Plus Jakarta Sans",system-ui,sans-serif`;x.textAlign="center";x.textBaseline="middle";x.fillText(s2,0,0);x.restore();};
  const YEL="rgba(242,184,7,0.85)",WHT="rgba(255,255,255,0.75)",GRN="rgba(46,160,90,0.55)";
  const PPM=mobile?20:32;
  // receiving shed  x -34.4..-8, z -23.5..-3
  floorDecal(-34.4,-8,-23.5,-3,PPM,(x,X,Z,ppm,W2,H2)=>{dJoints(x,W2,H2,ppm);dStains(x,X,Z,ppm,-34,-9,-23,-3.5,26);
    [-5.6,-9.0,-14.0,-17.4].forEach((r,i)=>{dBox(x,X,Z,-30.8,-10.4,r-0.75,r+0.75,YEL,0.1*ppm);dTxt(x,X,Z,ppm,"R"+(i+1),-31.6,r,0.7,"rgba(242,184,7,0.9)");});
    [-7.3,-11.5,-15.7].forEach(z=>dDashH(x,X,Z,ppm,-32,-9.5,z,WHT));dDashV(x,X,Z,ppm,-32.3,-21.5,-4.6,WHT);
    dHatch(x,X,Z,ppm,-34.3,-33.5,-23.4,-3.1,"rgba(242,184,7,0.35)","rgba(30,30,30,0.35)");          // keep the dock wall clear
    dHatch(x,X,Z,ppm,-9.3,-8.1,-23.4,-3.1,GRN,"rgba(255,255,255,0.45)");dTxt(x,X,Z,ppm,"WALKWAY",-8.7,-19,0.45,"#fff",Math.PI/2);
    for(let i=0;i<4;i++)dBox(x,X,Z,-14.2-i*2.6-1.1,-14.2-i*2.6+1.1,-22.9,-20.5,YEL,0.1*ppm);dTxt(x,X,Z,ppm,"FORKLIFT PARKING",-18.1,-20.0,0.5,"rgba(242,184,7,0.95)");
    dScuffs(x,X,Z,ppm,[[-32.3,-12,3],[-20,-7.3,10],[-20,-11.5,10],[-20,-15.7,10],[-31,-9,3],[-31,-14.5,3],[-31,-20,3],[-20.3,-11.5,3]],140);});
  const HALL={zf:20,xw:-23.15,doors:[{x:-22.05,w:2.2,h:3.2,open:true},{x:33,w:6,h:5,big:true},{x:53,w:1.8,h:2.4},{x:62.4,w:1.6,h:2.4}]};G3.HALL=HALL;
  // v3.2.1 machine hall  x -23.15..64.3, z 2.5..19.85: walkway lines, door crossings, keep-clear at the big door, crane load zones
  floorDecal(-23.15,64.3,2.5,19.85,mobile?14:24,(x,X,Z,ppm,W2,H2)=>{
    x.strokeStyle=YEL;x.lineWidth=0.12*ppm;[15.3,17.3].forEach(z=>{x.beginPath();x.moveTo(X(-19.5),Z(z));x.lineTo(X(63.5),Z(z));x.stroke();});
    for(let wx=-14;wx<62;wx+=12){dTxt(x,X,Z,ppm,"WALKWAY",wx,16.85,0.42,"rgba(242,184,7,0.9)");
      x.save();x.translate(X(wx+2.2),Z(16.3));x.fillStyle="rgba(242,184,7,0.9)";const s2=0.18*ppm;x.beginPath();x.arc(0,-s2*1.6,s2*0.55,0,7);x.fill();x.fillRect(-s2*0.35,-s2,s2*0.7,s2*1.3);x.fillRect(-s2*0.6,s2*0.3,s2*0.35,s2*1.1);x.fillRect(s2*0.25,s2*0.3,s2*0.35,s2*1.1);x.restore();}
    G3.HALL.doors.forEach(d=>{if(d.big){dHatch(x,X,Z,ppm,d.x-d.w/2,d.x+d.w/2,17.4,19.5,"rgba(242,184,7,0.35)","rgba(30,30,30,0.4)");dTxt(x,X,Z,ppm,"KEEP CLEAR",d.x,18.45,0.5,"#ffffff");}
      else if(!d.open){x.fillStyle="rgba(255,255,255,0.8)";for(let zz=17.45;zz<19.4;zz+=0.45)x.fillRect(X(d.x-d.w/2),Z(zz),X(d.x+d.w/2)-X(d.x-d.w/2),0.22*ppm);}});
    // v3.3 base ply silo: a grated pit under the whole wire footprint, and the white-water trench to the riser by the back wall
    {const a=41.5,b=54,c=6.2,d=12.0,T=0.7;
     // white water: cloudy grey-white water with a little foam and ripple
     {const g=x.createLinearGradient(0,Z(c),0,Z(d));g.addColorStop(0,"rgba(196,206,206,0.96)");g.addColorStop(0.5,"rgba(214,222,220,0.96)");g.addColorStop(1,"rgba(190,201,202,0.96)");x.fillStyle=g;x.fillRect(X(a),Z(c),X(b)-X(a),Z(d)-Z(c));
      for(let k=0;k<70;k++){const px=X(a+0.3+drnd()*(b-a-0.6)),pz=Z(c+0.3+drnd()*(d-c-0.6)),r=(0.25+drnd()*0.8)*ppm,gg=x.createRadialGradient(px,pz,0,px,pz,r);gg.addColorStop(0,"rgba(255,255,255,0.45)");gg.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=gg;x.fillRect(px-r,pz-r,r*2,r*2);}
      x.strokeStyle="rgba(150,166,170,0.35)";x.lineWidth=0.04*ppm;for(let k=0;k<26;k++){const px=X(a+0.5+drnd()*(b-a-1)),pz=Z(c+0.5+drnd()*(d-c-1)),w=(0.6+drnd()*1.4)*ppm;x.beginPath();x.moveTo(px-w,pz);x.quadraticCurveTo(px,pz-0.12*ppm,px+w,pz);x.stroke();}}
     // tiled border round the rim
     const tile=(x0,x1,z0,z1)=>{x.fillStyle="rgba(244,245,247,0.98)";x.fillRect(X(x0),Z(z0),X(x1)-X(x0),Z(z1)-Z(z0));x.strokeStyle="rgba(160,168,180,0.9)";x.lineWidth=Math.max(1,0.03*ppm);
       for(let v=x0;v<=x1+1e-6;v+=0.35){x.beginPath();x.moveTo(X(v),Z(z0));x.lineTo(X(v),Z(z1));x.stroke();}for(let v=z0;v<=z1+1e-6;v+=0.35){x.beginPath();x.moveTo(X(x0),Z(v));x.lineTo(X(x1),Z(v));x.stroke();}};
     tile(a-T,b+T,c-T,c);tile(a-T,b+T,d,d+T);tile(a-T,a,c,d);tile(b,b+T,c,d);
     x.strokeStyle="rgba(90,100,112,0.8)";x.lineWidth=0.06*ppm;x.strokeRect(X(a),Z(c),X(b)-X(a),Z(d)-Z(c));
     x.fillStyle="rgba(28,40,52,0.82)";x.fillRect(X(45.7),Z(3.0),X(46.3)-X(45.7),Z(c-T)-Z(3.0));x.strokeStyle="rgba(150,170,185,0.55)";x.lineWidth=0.05*ppm;for(let v=3.2;v<c-T;v+=0.3){x.beginPath();x.moveTo(X(45.7),Z(v));x.lineTo(X(46.3),Z(v));x.stroke();}}
    [[30,40,2.6,4.6],[21,29,2.6,4.6],[-20,-10,2.6,4.4]].forEach(([a,b,c,d])=>{dHatch(x,X,Z,ppm,a,b,c,d,"rgba(242,184,7,0.22)","rgba(30,30,30,0.32)");dBox(x,X,Z,a,b,c,d,YEL,0.1*ppm);dTxt(x,X,Z,ppm,"CRANE LOAD ZONE",(a+b)/2,(c+d)/2,0.42,"rgba(28,34,51,0.85)");});});
  // roll warehouse  x -49..-23.8, z 14.8..32.2
  floorDecal(-49,-23.8,14.8,32.2,PPM,(x,X,Z,ppm,W2,H2)=>{dJoints(x,W2,H2,ppm);dStains(x,X,Z,ppm,-48.5,-24.3,15.3,31.7,20);
    const ROWS="ABCDEFG";for(let k=0;k<84;k++){const cx=-45+(k%12)*1.75,cz=31.2-Math.floor(k/12)*1.7;dBox(x,X,Z,cx-0.78,cx+0.78,cz-0.74,cz+0.74,"rgba(255,255,255,0.32)",0.05*ppm);
      if(k%12===0)dTxt(x,X,Z,ppm,ROWS[Math.floor(k/12)],cx-1.3,cz,0.6,"rgba(242,184,7,0.9)");}
    dDashH(x,X,Z,ppm,-47.6,-24.5,17.0,WHT);dDashV(x,X,Z,ppm,-47.6,15.5,31.5,WHT);
    dHatch(x,X,Z,ppm,-37.3,-25.5,15.05,16.45,"rgba(220,60,60,0.25)","rgba(255,255,255,0.35)");dTxt(x,X,Z,ppm,"BEATER ROLLS",-31.4,15.75,0.42,"rgba(150,20,20,0.85)");
    for(let i=0;i<4;i++)dBox(x,X,Z,-45.2+i*2-0.9,-45.2+i*2+0.9,15.0,16.4,YEL,0.09*ppm);dTxt(x,X,Z,ppm,"CLAMP PARKING",-42.2,16.75,0.38,"rgba(242,184,7,0.95)");
    dHatch(x,X,Z,ppm,-24.6,-23.9,20.6,32.0,GRN,"rgba(255,255,255,0.45)");
    dScuffs(x,X,Z,ppm,[[-36,17,22],[-47.6,23,6],[-32,19.4,4],[-36,22,18],[-36,26,18]],120);});
  // props: pallet stacks, bins, chargers, bollards, extinguishers (instanced: a handful of draw calls in total)
  {const pal=new THREE.MeshLambertMaterial({color:lin0("#b8894f")}),red=new THREE.MeshLambertMaterial({color:lin0("#d63a2f")}),yel=new THREE.MeshLambertMaterial({color:lin0("#f2b807")}),
      blu=new THREE.MeshLambertMaterial({color:lin0("#2f6fd1")}),gry=new THREE.MeshLambertMaterial({color:lin0("#596273")}),m4=new THREE.Matrix4();
    const dInst=(geo,m,list,rotY)=>{const im=new THREE.InstancedMesh(geo,m,list.length);list.forEach((p,i)=>{m4.makeRotationY(p[3]||rotY||0);m4.setPosition(p[0],p[1],p[2]);im.setMatrixAt(i,m4);});im.castShadow=true;im.receiveShadow=true;scene.add(im);return im;};
    const pallets=[];[[-33,-22.4],[-33,-21.2],[-11,-3.8],[-48,31.4],[-48,30.2],[-24.6,15.5]].forEach(([px,pz],j)=>{const h=2+((j*7)%4);for(let k=0;k<h;k++)pallets.push([px,0.08+k*0.15,pz,(k%2)*0.08]);});
    dInst(new THREE.BoxGeometry(1.15,0.14,1.15),pal,pallets);
    dInst(new CylG(0.32,0.28,0.95,10),blu,[[-9.6,0.48,-4.0],[-24.4,0.48,31.6],[-48.4,0.48,15.4]]);                    // recycling bins
    dInst(new CylG(0.11,0.11,1.1,8),yel,[[-33.6,0.55,-23.1],[-33.6,0.55,-3.4],[-8.6,0.55,-12.9],[-8.6,0.55,-10.1],[-48.6,0.55,15.2],[-48.6,0.55,31.8],[-24.2,0.55,18.2],[-24.2,0.55,20.6]]);  // bollards
    dInst(new THREE.BoxGeometry(0.5,1.3,0.35),gry,[[-12.2,0.65,-23.2],[-17.4,0.65,-23.2],[-45.2,0.65,14.98],[-41.2,0.65,14.98]]);   // battery chargers
    dInst(new CylG(0.1,0.1,0.45,8),red,[[-8.3,1.2,-6.0],[-8.3,1.2,-20.0],[-34.1,1.2,-11.7],[-23.95,1.2,24.0],[-48.75,1.2,22.0],[-36,1.2,31.95]]);   // fire extinguishers on the walls
  }
  // machine hall: a cutaway shell, back and end walls only, so the machine stays in view
  ribWall(66,5.2,0.3,31,2.6,2.4);ribWall(0.3,5.2,13.8,64,2.6,9.3);
  {const s=new THREE.Mesh(new THREE.PlaneGeometry(26,3.25),signMat);s.position.set(51,3.1,2.57);scene.add(s);
   const s2=new THREE.Mesh(new THREE.PlaneGeometry(13,1.62),signMat);s2.position.set(-21.2,2.55,-2.83);scene.add(s2);}
  // sawtooth roofs in the brand color; they fade away as you zoom in
  const roofs=[];
  function sawRoof(x0,x1,z0,z1,y){const g=new THREE.Group(),n=Math.max(3,Math.round((x1-x0)/4.2)),tw=(x1-x0)/n,m=mat("brand",{transparent:true,roughness:0.55,side:THREE.DoubleSide}),gl=mat("g-glass",{transparent:true,roughness:0.15,metalness:0.4}),em=new THREE.LineBasicMaterial({color:lin0("#1c2233"),transparent:true,opacity:0.35});
    for(let i=0;i<n;i++){const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(tw,0);s.lineTo(tw,1.7);s.lineTo(0,0);
      const geo=new THREE.ExtrudeGeometry(s,{depth:z1-z0,bevelEnabled:false});const o=new THREE.Mesh(geo,m);o.position.set(x0+i*tw,y+0.07,z0);o.castShadow=true;g.add(o);edges(o,em,20);
      const glass=new THREE.Mesh(new THREE.PlaneGeometry(z1-z0-0.2,1.3),gl);glass.rotation.y=Math.PI/2;glass.position.set(x0+(i+1)*tw+0.07,y+0.87,(z0+z1)/2);g.add(glass);}
    g.userData.mats=[m,gl,em];scene.add(g);roofs.push(g);return g;}
  box2(-34.4,-8,-23.5,-3);box2(-49,-23.8,14.8,32.2);skirt(-2,1.2,64,1.2,2.4);skirt(65.2,2.4,65.2,16.2,2.4);
  sawRoof(-34.6,-7.85,-23.65,-2.85,WH);sawRoof(-49.15,-23.65,14.65,32.35,WH);
  // paper machine hall: full building seen from the air (walls, window bands, sawtooth roof), gone as soon as you zoom in
  // v3.2.1: the tending side is widened from z 16.75 out to HALL.zf (20), east of the first bay; the west bay stays where it was
  // so it doesn't run into the warehouse. Doors: a big roll-up door to the food truck lawn and two personnel doors.
  {const g=new THREE.Group(),HH=13.4,X0=-27.2,X1=64.3,Z0=2.25,Z1=16.75,ZA=-2.85,XA=-2.9,ZF=HALL.zf,XW=HALL.xw;
    const wm=mat("g-wall",{transparent:true,roughness:0.7}),gl=mat("g-glass",{transparent:true,roughness:0.12,metalness:0.45}),em=new THREE.LineBasicMaterial({color:lin0("#1c2233"),transparent:true,opacity:0.35}),bm=mat("brand",{transparent:true,roughness:0.55,side:THREE.DoubleSide});
    const add=(o,e)=>{o.castShadow=true;o.receiveShadow=true;g.add(o);if(e)edges(o,em,20);return o;};
    const wall=(w,h,d,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wm);o.position.set(x,y,z);return add(o,true);};
    // front (tending side): west bay at Z1, the rest at ZF with a short return wall, split around the doors
    wall(XW-X0,HH,0.3,(X0+XW)/2,HH/2,Z1);wall(0.3,HH-3.2,ZF-Z1,XW,3.2+(HH-3.2)/2,(Z1+ZF)/2);
    {let xa=XW;HALL.doors.forEach(d=>{const a=d.x-d.w/2,b=d.x+d.w/2;if(a-xa>0.05)wall(a-xa,HH,0.3,(xa+a)/2,HH/2,ZF);wall(d.w,HH-d.h,0.3,d.x,d.h+(HH-d.h)/2,ZF);xa=b;});wall(X1-xa,HH,0.3,(xa+X1)/2,HH/2,ZF);
     const dk=mat("ink",{transparent:true,roughness:0.6});g.userData.dk=dk;
     HALL.doors.forEach(d=>{if(d.big){const rb=new THREE.Mesh(new THREE.BoxGeometry(d.w+0.4,0.5,0.5),bm);rb.position.set(d.x,d.h+0.25,ZF+0.2);g.add(rb);
        [-1,1].forEach(sd=>{const j=new THREE.Mesh(new THREE.BoxGeometry(0.25,d.h,0.4),bm);j.position.set(d.x+sd*(d.w/2+0.05),d.h/2,ZF+0.1);g.add(j);});}
       else if(!d.open){const pnl=new THREE.Mesh(new THREE.BoxGeometry(d.w-0.1,d.h-0.05,0.36),dk);pnl.position.set(d.x,d.h/2,ZF);g.add(pnl);}});}
    // back wall: wider reel bay at the dry end (out to ZA) so the overhead crane and parked reels stay indoors
    wall(X1-XA,HH-5.3,0.3,(XA+X1)/2,5.3+(HH-5.3)/2,Z0);wall(XA-X0,HH,0.3,(X0+XA)/2,HH/2,ZA);wall(0.3,HH,Z0-ZA,XA,HH/2,(ZA+Z0)/2);
    wall(0.3,HH,Z1-ZA,X0,HH/2,(ZA+Z1)/2);wall(0.3,HH-5.3,ZF-Z0,X1,5.3+(HH-5.3)/2,(Z0+ZF)/2);
    const band=(y,h,w,pitch,z,dir,xa=X0,xb=X1)=>{for(let x=xa+2.2;x+w<xb-1;x+=pitch){if(y-h/2<5.6&&z===ZF&&HALL.doors.some(d=>x+w>d.x-d.w/2-0.4&&x<d.x+d.w/2+0.4))continue;const p=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.08),gl);p.position.set(x+w/2,y,z+dir*0.17);g.add(p);}};
    band(9.6,2.6,3.8,4.6,ZF,1,XW,X1);band(3.2,1.4,2.2,4.6,ZF,1,XW,X1);band(9.6,2.6,3.8,4.6,Z1,1,X0,XW+1.5);band(9.6,2.6,3.8,4.6,Z0,-1,XA,X1);band(9.6,2.6,3.8,4.6,ZA,-1,X0,XA);
    {const f=new THREE.Mesh(new THREE.BoxGeometry(X1-XW+0.4,0.5,0.4),bm);f.position.set((XW+X1)/2,HH-0.1,ZF);g.add(f);const f0=new THREE.Mesh(new THREE.BoxGeometry(XW-X0+0.4,0.5,0.4),bm);f0.position.set((X0+XW)/2,HH-0.1,Z1);g.add(f0);
     const f2=new THREE.Mesh(new THREE.BoxGeometry(X1-XA+0.2,0.5,0.4),bm);f2.position.set((XA+X1)/2,HH-0.1,Z0);g.add(f2);
     const f3=new THREE.Mesh(new THREE.BoxGeometry(XA-X0+0.4,0.5,0.4),bm);f3.position.set((X0+XA)/2,HH-0.1,ZA);g.add(f3);}
    [[X0,-1],[X1,1]].forEach(([x,dir])=>{for(let z=(x===X0?ZA:Z0)+2;z<(x===X1?ZF:Z1)-2.5;z+=3.4){const p=new THREE.Mesh(new THREE.BoxGeometry(0.08,2.6,2.4),gl);p.position.set(x+dir*0.17,9.6,z+1.2);g.add(p);}});
    const nA=Math.round((XA-X0)/4.4),nB=Math.round((X1-XA)/4.4);
    for(let i=0;i<nA+nB;i++){const bay=i<nA,tw=bay?(XA-X0)/nA:(X1-XA)/nB,xs=bay?X0+i*tw:XA+(i-nA)*tw,z0=bay?ZA:Z0,zf=xs>=XW-0.05?ZF:Z1,dz=zf-z0;
      const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(tw,0);sh.lineTo(tw,2.1);sh.lineTo(0,0);
      const o=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:dz,bevelEnabled:false}),bm);o.position.set(xs,HH+0.07,z0);add(o,true);
      const gp=new THREE.Mesh(new THREE.PlaneGeometry(dz-0.3,1.6),gl);gp.rotation.y=Math.PI/2;gp.position.set(xs+tw+0.07,HH+1.07,(z0+zf)/2);g.add(gp);}
    // dryer hood exhaust stacks through the roof (vapour plumes in envUpdate)

    g.userData.mats=[wm,gl,em,bm,g.userData.dk];g.userData.fade=[255,40];scene.add(g);roofs.push(g);}
  // close-up: a low ribbed base wall along the new tending-side line (so people use the doors), hatched thresholds and bollards at the doors
  {const ZF=HALL.zf;let xa=HALL.xw;HALL.doors.forEach(d=>{const a=d.x-d.w/2;if(a-xa>0.05)ribWall(a-xa,1.1,0.3,(xa+a)/2,0.55,ZF);xa=d.x+d.w/2;});ribWall(64.3-xa,1.1,0.3,(xa+64.3)/2,0.55,ZF);
   const hc=document.createElement("canvas");hc.width=128;hc.height=16;{const x=hc.getContext("2d");x.fillStyle="#f2b807";x.fillRect(0,0,128,16);x.fillStyle="#1c2233";for(let k=-2;k<18;k++){x.beginPath();x.moveTo(k*8,16);x.lineTo(k*8+4,16);x.lineTo(k*8+12,0);x.lineTo(k*8+8,0);x.fill();}}
   const ht=new THREE.CanvasTexture(hc);ht.colorSpace=THREE.SRGBColorSpace;ht.wrapS=THREE.RepeatWrapping;
   HALL.doors.forEach(d=>{const t=ht.clone();t.needsUpdate=true;t.repeat.set(d.w/1.2,1);const th=new THREE.Mesh(new THREE.PlaneGeometry(d.w,0.45),new THREE.MeshBasicMaterial({map:t}));th.rotation.x=-Math.PI/2;th.position.set(d.x,0.055,ZF);scene.add(th);
     if(d.big)[-1,1].forEach(sd=>{const b=new THREE.Mesh(new CylG(0.14,0.14,1.1,10),M.warn);b.position.set(d.x+sd*(d.w/2+0.35),0.55,ZF+0.5);b.castShadow=true;scene.add(b);});});}
  // roofs and the hall shell fade out as you zoom in. Fully shown, they render opaque (no transparency sorting); while fading they
  // stop writing depth, so overlapping roof panels can't hide each other in a draw-order-dependent way (that made them flicker
  // when the camera moves, which zen mode does all the time)
  G3.roofFade=r=>{roofs.forEach(g=>{const f=g.userData.fade||[170,70],a=clamp((r-f[0])/f[1],0,1),solid=a>0.995;g.visible=a>0.02;
    if(g.userData.a!==undefined&&Math.abs(g.userData.a-a)<0.002)return;g.userData.a=a;
    g.userData.mats.forEach((m,i)=>{const glassy=i===1||i===2,tr=glassy||!solid;if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true;}m.depthWrite=solid&&!glassy;
      m.opacity=i===1?a*0.75:i===2?a*0.35:a;});
    const sh=a>0.6;if(g.userData.sh!==sh){g.userData.sh=sh;g.children.forEach(c=>c.castShadow=sh);}});};
