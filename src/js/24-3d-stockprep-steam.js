  /* ---- stock prep: pulper -> HD cleaner -> lightweight cleaners -> coarse screen -> fine screens -> LC cleaners -> disk thickener (on a platform over the chest) -> chest ---- */
  // clean pipework: orthogonal runs, flanged ends, supports under overhead runs
  const _fl=new THREE.Vector3(),_fu=new THREE.Vector3(0,1,0);
  function flange(p,q,r,m){_fl.set(q[0]-p[0],q[1]-p[1],q[2]-p[2]).normalize();const f=new THREE.Mesh(new CylG(r*1.55,r*1.55,0.14,16),m);
    f.position.set(p[0]+_fl.x*0.07,p[1]+_fl.y*0.07,p[2]+_fl.z*0.07);f.quaternion.setFromUnitVectors(_fu,_fl);scene.add(f);}
  function spool(pts,r,m){pipe(pts,r,m);flange(pts[0],pts[1],r,M.steel);const n=pts.length;flange(pts[n-1],pts[n-2],r,M.steel);}
  // ---- steam: elevated pipe rack from the power house to a header along the drive side of the dryers ----
  {const ins=new StdMat({color:lin0("#cfd4dc"),metalness:0.55,roughness:0.35}),Y=10.6,ZH=4.9,ZC=4.25;
    const S1=[[70,8,-7],[68.6,8,-7],[68.6,Y,-7],[68.6,Y,-0.35],[46,Y,-0.35],[46,Y+2.6,-0.35],[42,Y+2.6,-0.35],[42,Y,-0.35],[27.3,Y,-0.35],[27.3,Y,ZH],[-4.5,Y,ZH]];
    pipe(S1,0.32,ins);for(let i=1;i<S1.length-1;i++){const p=S1[i];const b=new THREE.Mesh(new SphG(0.34,12,8),ins);b.position.set(p[0],p[1],p[2]);scene.add(b);}   // insulated elbows
    flange(S1[0],S1[1],0.32,M.steel);
    // condensate return alongside
    pipe([[70,6.5,-5],[69.3,6.5,-5],[69.3,Y,-5],[69.3,Y,0.35],[27.95,Y,0.35],[27.95,Y,ZC],[-4.5,Y,ZC]],0.14,M.steel);
    // rack bents outside, hangers inside
    [66,59,52,38,31].forEach(x=>{box(0.3,Y-0.35,0.3,M.steel,x,(Y-0.35)/2,0,scene);box(0.26,0.26,2.0,M.steel,x,Y-0.45,0,scene,false);});
    box(0.3,Y-0.35,0.3,M.steel,69,(Y-0.35)/2,-3.5,scene);box(1.8,0.26,0.26,M.steel,69,Y-0.45,-3.5,scene,false);
    box(0.3,Y+2.25,0.3,M.steel,44,(Y+2.25)/2,0,scene);box(0.26,0.26,2.0,M.steel,44,Y+2.15,0,scene,false);box(0.26,0.26,2.0,M.steel,44,Y-0.45,0,scene,false);
    for(let x=22;x>=-4;x-=6.5){box(0.06,13.4-Y,0.06,M.ink,x,(13.4+Y)/2,ZH,scene,false);box(0.06,13.4-Y,0.06,M.ink,x,(13.4+Y)/2,ZC,scene,false);box(0.12,0.12,1.0,M.ink,x,Y-0.38,(ZH+ZC)/2,scene,false);}
    // a drop and rotary joint to the drive-side journal of every dryer can
    for(let i=0;i<10;i++)[[(872-i*32-600)/10,5.4],[(856-i*32-600)/10,2.4]].forEach(([x,y])=>{pipe([[x,Y,ZH],[x,y,ZH],[x,y,5.62]],0.07,ins);
      cylZ(0.17,0.32,M.brand,x,y,5.72,10);});}
  // boiler safety (pop-off) valve on the power house roof, with a vent stack and silencer; it lifts and roars during a boiler trip
  const POP={x:72,z:-7,lever:null};
  {pipe([[POP.x,9.2,POP.z],[POP.x,10.1,POP.z]],0.2,M.steel);const vb=new THREE.Mesh(new CylG(0.34,0.38,0.7,14),M.bad);vb.position.set(POP.x,10.45,POP.z);vb.castShadow=true;scene.add(vb);
    const bon=new THREE.Mesh(new CylG(0.16,0.2,0.9,10),M.bad);bon.position.set(POP.x,11.2,POP.z);scene.add(bon);
    const cap=new THREE.Mesh(new CylG(0.1,0.1,0.25,8),M.ink);cap.position.set(POP.x,11.75,POP.z);scene.add(cap);
    POP.lever=new THREE.Group();POP.lever.position.set(POP.x,11.6,POP.z);scene.add(POP.lever);box(0.9,0.06,0.06,M.ink,-0.4,0,0,POP.lever,false);
    pipe([[POP.x,10.45,POP.z],[POP.x+0.75,10.45,POP.z],[POP.x+0.75,15.2,POP.z]],0.24,M.steel);
    const sil=new THREE.Mesh(new CylG(0.55,0.55,1.5,16,1,true),M.steel);sil.position.set(POP.x+0.75,15.8,POP.z);sil.castShadow=true;scene.add(sil);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.06,6,18),M.ink);lip.rotation.x=Math.PI/2;lip.position.set(POP.x+0.75,16.55,POP.z);scene.add(lip);}
  G3.POP=POP;
  // grated catwalks with handrails, and stair flights between two points
  const gratM=(()=>{const c=document.createElement("canvas");c.width=c.height=32;const x=c.getContext("2d");x.fillStyle="#8d96a3";x.fillRect(0,0,32,32);x.fillStyle="#5d6672";for(let i=0;i<32;i+=6){x.fillRect(i,0,1.5,32);x.fillRect(0,i,32,1);}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,4);return new StdMat({map:t,roughness:0.7,metalness:0.3});})();
  function rail(a,b){pipe([[a[0],a[1]+1.05,a[2]],[b[0],b[1]+1.05,b[2]]],0.045,M.warn);pipe([[a[0],a[1]+0.55,a[2]],[b[0],b[1]+0.55,b[2]]],0.035,M.warn);
    const n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[2]-a[2])/1.8));for(let k=0;k<=n;k++){const t=k/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t;pipe([[x,y,z],[x,y+1.05,z]],0.035,M.warn);}}
  function walkway(x0,z0,x1,z1,y,w,sides=[1,1],posts=true){const L=Math.hypot(x1-x0,z1-z0),ax=x1!==x0,cx=(x0+x1)/2,cz=(z0+z1)/2;
    const d=new THREE.Mesh(new THREE.BoxGeometry(ax?L:w,0.16,ax?w:L),[M.steel,M.steel,gratM,M.steel,M.steel,M.steel]);d.position.set(cx,y-0.08,cz);d.castShadow=true;d.receiveShadow=true;scene.add(d);
    const ox=ax?0:w/2,oz=ax?w/2:0;if(sides[0])rail([x0-ox,y,z0-oz],[x1-ox,y,z1-oz]);if(sides[1])rail([x0+ox,y,z0+oz],[x1+ox,y,z1+oz]);
    if(posts){const n=Math.max(1,Math.round(L/6));for(let k=0;k<=n;k++){const t=k/n;[-1,1].forEach(sd=>box(0.16,y-0.16,0.16,M.steel,x0+(x1-x0)*t+sd*ox,(y-0.16)/2,z0+(z1-z0)*t+sd*oz,scene,false));}}}
  function flight(a,b,w){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],L=Math.hypot(dx,dz),yaw=Math.atan2(-dz,dx),n=Math.max(4,Math.round(dy/0.24));
    for(let k=0;k<n;k++){const t=(k+0.5)/n,g=new THREE.Mesh(new THREE.BoxGeometry(L/n+0.04,0.06,w),M.steel);g.position.set(a[0]+dx*t,a[1]+dy*(k+1)/n-0.03,a[2]+dz*t);g.rotation.y=yaw;scene.add(g);}
    const ox=Math.sin(yaw)*w/2,oz=Math.cos(yaw)*w/2;
    [-1,1].forEach(sd=>{pipe([[a[0]+sd*ox,a[1]-0.05,a[2]+sd*oz],[b[0]+sd*ox,b[1]-0.05,b[2]+sd*oz]],0.07,M.brand);rail([a[0]+sd*ox,a[1],a[2]+sd*oz],[b[0]+sd*ox,b[1],b[2]+sd*oz]);});}
  function post(x,z,h){box(0.22,h,0.22,M.steel,x,h/2,z,scene,false);box(1.0,0.14,0.5,M.steel,x,h-0.07,z,scene,false);}
  // ragger: a tail-extraction wheel on the pulper lip pulls a rope "tail" of wire and rags up out of the tub and down a floor chute,
  // with a small operator platform and stair beside it (used to restart a broken tail with fresh ragger rope)
  const RAG={x:16,z:-9.3,wy:5.0,wr:0.72,deck:[13.4,15.6,-10.0,-7.9],foot:[8.6,-8.9],top:[13.4,-8.9],stand:[14.6,-8.7],broken:false,grow:1};
  {const rx=RAG.x,rz=RAG.z;
    [-0.42,0.42].forEach(dx=>{box(0.16,RAG.wy-3.3,0.3,M.brand,rx+dx,(RAG.wy+3.3)/2,rz,scene);box(0.16,0.16,1.3,M.brand,rx+dx,3.45,rz,scene,false);});
    box(0.6,0.5,0.55,M.ink,rx+0.85,RAG.wy,rz,scene);box(0.3,0.3,0.3,M.steel,rx+0.6,RAG.wy,rz,scene,false);   // drive motor and gearbox
    {const c=new THREE.Mesh(new CylG(0.5,0.5,0.06,20),M.ink);c.position.set(rx,0.03,rz+0.75);scene.add(c);
     const k=new THREE.Mesh(new CylG(0.62,0.62,0.35,20,1,true),M.steel);k.position.set(rx,0.18,rz+0.75);scene.add(k);}   // floor chute to the reject compactor
    walkway(RAG.deck[0],(RAG.deck[2]+RAG.deck[3])/2,RAG.deck[1],(RAG.deck[2]+RAG.deck[3])/2,3.4,RAG.deck[3]-RAG.deck[2],[0,1],false);
    [[RAG.deck[0]+0.1,RAG.deck[2]+0.1],[RAG.deck[0]+0.1,RAG.deck[3]-0.1],[RAG.deck[1]-0.1,RAG.deck[3]-0.1]].forEach(([x,z])=>box(0.16,3.24,0.16,M.steel,x,1.62,z,scene,false));
    rail([RAG.deck[0],3.4,RAG.deck[2]],[RAG.deck[1],3.4,RAG.deck[2]]);
    flight([RAG.foot[0],0,RAG.foot[1]],[RAG.top[0],3.4,RAG.top[1]],1.0);}
  const ragWheel=new THREE.Group();ragWheel.position.set(RAG.x,RAG.wy,RAG.z);scene.add(ragWheel);
  {const rim=new THREE.Mesh(new THREE.TorusGeometry(RAG.wr,0.09,8,28),M.steel);rim.rotation.y=Math.PI/2;ragWheel.add(rim);
    for(let k=0;k<6;k++){const sp=box(0.08,RAG.wr*2,0.08,M.steel,0,0,0,ragWheel,false);sp.rotation.x=k*Math.PI/6;}
    const hub=new THREE.Mesh(new CylG(0.16,0.16,0.9,12),M.ink);hub.rotation.z=Math.PI/2;ragWheel.add(hub);
    for(let k=0;k<10;k++){const t=box(0.34,0.12,0.12,M.ink,0,Math.cos(k*0.628)*RAG.wr,Math.sin(k*0.628)*RAG.wr,ragWheel,false);t.rotation.x=k*0.628;}}   // gripper teeth
  // twisted rag rope texture
  const ropeTex=(()=>{const c=document.createElement("canvas");c.width=64;c.height=32;const x=c.getContext("2d");x.fillStyle="#3b3631";x.fillRect(0,0,64,32);
    for(let i=-32;i<96;i+=8){x.strokeStyle=i%16?"#5a5148":"#26221f";x.lineWidth=4;x.beginPath();x.moveTo(i,0);x.lineTo(i+16,32);x.stroke();}
    x.fillStyle="#9b8a6e";for(let k=0;k<14;k++)x.fillRect(Math.random()*64,Math.random()*32,3,2);x.fillStyle="#c9ced6";for(let k=0;k<6;k++)x.fillRect(Math.random()*64,Math.random()*32,4,1);
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;})();
  const ropeMat=new StdMat({map:ropeTex,roughness:0.95});
  function ragPts(){const P=[new THREE.Vector3(RAG.x+0.15,2.6,-12.4),new THREE.Vector3(RAG.x+0.05,3.0,-11.4),new THREE.Vector3(RAG.x,4.2,-10.25)],R=RAG.wr+0.12;
    for(let k=0;k<=10;k++){const a=Math.PI-k*Math.PI/10;P.push(new THREE.Vector3(RAG.x,RAG.wy+R*Math.sin(a),RAG.z+R*Math.cos(a)));}
    P.push(new THREE.Vector3(RAG.x,3.6,RAG.z+R),new THREE.Vector3(RAG.x,1.6,RAG.z+R+0.02),new THREE.Vector3(RAG.x,-0.4,RAG.z+R+0.02));return P;}
  const ragTail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ragPts(),false,"centripetal"),90,0.17,8,false),ropeMat);ragTail.castShadow=true;scene.add(ragTail);
  ropeTex.repeat.set(26,1);
  // the broken-off tail: a loose end flopping on the stock surface, and a short frayed stub left in the wheel
  const ragLoose=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(0.9,0.1,0.5),new THREE.Vector3(1.7,0.05,0.1),new THREE.Vector3(2.4,0.12,0.7),new THREE.Vector3(3.0,0.0,0.4)]),30,0.17,8,false),ropeMat);
  ragLoose.geometry.translate(-1.5,0,-0.35);ragLoose.visible=false;scene.add(ragLoose);
  const ragStubPts=ragPts().slice(4);ragStubPts.unshift(new THREE.Vector3(RAG.x,RAG.wy-0.3,RAG.z-RAG.wr-0.3));
  const ragStub=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ragStubPts,false,"centripetal"),60,0.17,8,false),ropeMat);ragStub.visible=false;scene.add(ragStub);
  const ragTotal=ragTail.geometry.index.count;
  G3.ragFrame=(rdt,now,feeding)=>{const inc=S.inc.find(i=>i.id==="ragger");
    if(inc){const prog=working("ragger")?1-inc.left/Math.max(1e-6,inc.total):0,g=clamp((prog-0.7)/0.28,0,1);
      ragLoose.visible=g<0.3;ragStub.visible=g<0.98;ragTail.visible=g>0;ragTail.geometry.setDrawRange(0,Math.floor(ragTotal*g/3)*3);
      const a=now/1400;ragLoose.position.set(16+Math.cos(a)*1.6,2.95,-13.5+Math.sin(a)*1.6);ragLoose.rotation.y=-a+Math.sin(now/600)*0.3;
      ragWheel.rotation.x-=rdt*(g>0?0.5:2.2);}
    else{ragLoose.visible=ragStub.visible=false;ragTail.visible=true;ragTail.geometry.setDrawRange(0,Infinity);
      if(feeding){ragWheel.rotation.x-=rdt*0.35;ropeTex.offset.x=(ropeTex.offset.x-rdt*0.0035)%1;}}};
  const PH=12.4,ZL=-23,TY=2.6,TZ=-4.5;            // platform deck height; screening line row
  // flood light poles on the disk thickener deck (they light up at night with the mill lights)
  [[31.2,-17.5],[39,-12.5]].forEach(([x,z])=>{box(0.14,4.6,0.14,M.steel,x,PH+2.3,z,scene,false);box(0.9,0.22,0.5,M.ink,x,PH+4.65,z,scene,false);});
  slab(8,33,-26.5,-19.6,M.slab,0.035);blob(21,ZL,9);
  // HD cleaner between the pulper and the screening line: tangential inlet at the top, accepts out the top, junk trap at the bottom
  {const hx=25.8,hz=-10.6,hc=new THREE.Group();hc.position.set(hx,0,hz);scene.add(hc);blob(hx,hz,1.8);
    const top=new THREE.Mesh(new CylG(0.75,0.75,1.4,20),M.steel);top.position.y=5.6;top.castShadow=true;hc.add(top);
    const cone=new THREE.Mesh(new CylG(0.75,0.18,3.0,20),M.steel);cone.position.y=3.4;cone.castShadow=true;hc.add(cone);
    const cap=new THREE.Mesh(new CylG(0.5,0.78,0.3,20),M.metal);cap.position.y=6.45;hc.add(cap);
    box(0.45,0.45,0.45,M.warn,0,1.65,0,hc,false);const jp=new THREE.Mesh(new CylG(0.13,0.13,0.9,10),M.metal);jp.position.y=1.0;hc.add(jp);box(0.45,0.45,0.45,M.warn,0,0.75,0,hc,false);
    box(1.3,0.6,1.0,M.ink,0,0.3,1.0,hc);[[-0.8,-0.8],[0.8,-0.8],[-0.8,0.8],[0.8,0.8]].forEach(([a,b])=>box(0.14,4.9,0.14,M.steel,a,2.45,b,hc,false));box(1.9,0.12,1.9,M.steel,0,4.9,0,hc,false);}
  spool([[20.2,1,-11.5],[25.0,1,-11.5],[25.0,5.9,-11.5],[25.4,5.9,-11.5]],0.26,M.stock);
  fieldPump(22.2,1,-11.5,-Math.PI/2);
  // HD accepts: up onto a pipe rack, south past the pulper, west along the rack and down into the lightweight cleaners
  spool([[25.8,6.6,-10.6],[25.8,7.6,-10.6],[25.8,7.6,-19.9],[11.2,7.6,-19.9],[11.2,7.6,ZL],[11.2,4.1,ZL]],0.24,M.stock);
  [[25.8,-15.4],[25.8,-19.9],[20,-19.9],[14.4,-19.9]].forEach(([x,z])=>post(x,z,7.35));
  // pressure screen: housing, basket band, motor on top, inlet stub on the west side, accepts stub on the east
  function screen(x,z,h,band){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);blob(x,z,1.4);
    box(1.9,0.35,1.9,M.steel,0,0.17,0,g);const body=new THREE.Mesh(new CylG(0.75,0.75,h,22),M.steel);body.position.y=0.35+h/2;body.castShadow=true;g.add(body);
    const b=new THREE.Mesh(new CylG(0.77,0.77,0.22,22),band);b.position.y=0.35+h*0.62;g.add(b);
    const cap=new THREE.Mesh(new CylG(0.55,0.78,0.3,22),M.metal);cap.position.y=0.5+h;g.add(cap);
    const mo=new THREE.Mesh(new CylG(0.42,0.42,0.9,16),M.stock);mo.position.y=1.1+h;mo.castShadow=true;g.add(mo);box(0.5,0.18,0.5,M.ink,0,1.62+h,0,g,false);
    box(0.12,0.12,0.5,M.bad,0,0.55,0.95,g,false);return g;}
  // lightweight (reverse) cleaners, X-Clone style: two rings of small cleaners around a central manifold
  {const g=new THREE.Group();g.position.set(11.2,0,ZL);scene.add(g);blob(11.2,ZL,1.8);box(2.6,0.3,2.6,M.steel,0,0.15,0,g);
    const core=new THREE.Mesh(new CylG(0.45,0.45,3.4,16),M.steel);core.position.y=2.0;core.castShadow=true;g.add(core);
    const capT=new THREE.Mesh(new CylG(0.6,0.6,0.3,16),M.brand);capT.position.y=3.8;g.add(capT);
    for(let ring=0;ring<2;ring++)for(let k=0;k<10;k++){const a=k/10*Math.PI*2+ring*0.31,c=new THREE.Mesh(new CylG(0.11,0.05,1.25,8),M.metal);
      c.position.set(Math.cos(a)*0.95,1.35+ring*1.45,Math.sin(a)*0.95);c.rotation.z=Math.cos(a)*0.55;c.rotation.x=-Math.sin(a)*0.55;c.castShadow=true;g.add(c);}
    [0.95,2.4].forEach(y=>{const r=new THREE.Mesh(new THREE.TorusGeometry(0.95,0.07,6,24),M.stock);r.rotation.x=Math.PI/2;r.position.y=y+0.65;g.add(r);});
    box(0.9,0.6,0.8,M.bad,-1.2,0.3,1.4,g);}
  screen(15.2,ZL,2.0,M.warn);                                          // coarse screen (holed basket)
  screen(19.2,ZL-1.0,2.6,M.ok);screen(19.2,ZL+1.0,2.6,M.ok);           // fine screens (slotted baskets)
  box(1.2,0.8,1.0,M.bad,15.2,0.4,ZL-1.9);box(1.0,0.7,0.9,M.bad,19.2,0.35,ZL-2.5);
  // grade-level connections on one elevation, west inlet / east outlet
  spool([[12.4,1.2,ZL],[14.45,1.2,ZL]],0.22,M.stock);
  spool([[15.95,1.2,ZL],[17.6,1.2,ZL],[17.6,1.2,ZL-1.0],[18.45,1.2,ZL-1.0]],0.2,M.stock);spool([[17.6,1.2,ZL],[17.6,1.2,ZL+1.0],[18.45,1.2,ZL+1.0]],0.2,M.stock);
  spool([[19.95,1.2,ZL-1.0],[20.8,1.2,ZL-1.0],[20.8,1.2,ZL+1.0],[19.95,1.2,ZL+1.0]],0.2,M.stock);
  spool([[20.8,1.2,ZL],[22.4,1.2,ZL]],0.22,M.stock);fieldPump(21.7,1.2,ZL,0);
  // LC cleaner bank: rack, inlet / accepts / reject headers, two rows of inverted cones (second row comes with the Screens & cleaners upgrade)
  const BX0=23,BX1=30.2;
  {box(BX1-BX0+0.6,0.2,2.4,M.steel,(BX0+BX1)/2,2.4,ZL,scene,false);
    [[BX0-0.2,-1.0],[BX1+0.2,-1.0],[BX0-0.2,1.0],[BX1+0.2,1.0]].forEach(([x,dz])=>box(0.14,2.4,0.14,M.steel,x,1.2,ZL+dz,scene,false));
    for(let i=0;i<14;i++){const x=BX0+0.3+i*((BX1-BX0-0.6)/13);const c=new THREE.Mesh(new CylG(0.17,0.05,1.6,10),M.metal);c.position.set(x,1.55,ZL-0.35);c.castShadow=true;scene.add(c);
      const t=new THREE.Mesh(new CylG(0.18,0.18,0.25,10),M.steel);t.position.set(x,2.45,ZL-0.35);scene.add(t);}
    spool([[22.4,1.2,ZL],[22.4,2.85,ZL],[22.4,2.85,ZL-0.35],[BX1+0.2,2.85,ZL-0.35]],0.15,M.stock);
    pipe([[BX0-0.3,0.55,ZL],[BX1+0.4,0.55,ZL],[BX1+0.4,0.55,ZL+1.6]],0.11,mat("pulp"));box(1.5,0.9,1.2,M.ink,BX1+0.4,0.45,ZL+2.3,scene);}
  // LC accepts up the riser to the thickener on the chest platform
  spool([[BX0-0.2,3.15,ZL+0.35],[31.2,3.15,ZL+0.35],[31.2,PH+3.3,ZL+0.35],[31.2,PH+3.3,-16.4],[33.2,PH+3.3,-16.4],[33.2,PH+2.7,-16.4]],0.22,M.stock);
  post(31.2,-20.6,PH+3.05);
  // platform over the stock chest: grated deck on four tall columns, handrails, caged ladder
  const DX0=29.6,DX1=40.4,DZ0=-18.2,DZ1=-11.8,DCX=(DX0+DX1)/2,DCZ=(DZ0+DZ1)/2;
  {const gC=document.createElement("canvas");gC.width=gC.height=64;const x=gC.getContext("2d");x.fillStyle="#8d96a3";x.fillRect(0,0,64,64);x.fillStyle="#5d6672";for(let i=0;i<64;i+=8){x.fillRect(i,0,2,64);x.fillRect(0,i,64,1);}
    const gT=new THREE.CanvasTexture(gC);gT.colorSpace=THREE.SRGBColorSpace;gT.wrapS=gT.wrapT=THREE.RepeatWrapping;gT.repeat.set(11,6.5);
    const deck=new THREE.Mesh(new THREE.BoxGeometry(DX1-DX0,0.3,DZ1-DZ0),[M.steel,M.steel,new StdMat({map:gT,roughness:0.7,metalness:0.3}),M.steel,M.steel,M.steel]);
    deck.position.set(DCX,PH-0.15,DCZ);deck.castShadow=true;deck.receiveShadow=true;scene.add(deck);
    for(const cx of [DX0-0.2,DX1+0.2])for(const cz of [DZ0-0.2,DZ1+0.2])box(0.4,PH-0.3,0.4,M.brand,cx,(PH-0.3)/2,cz);
    [DZ0-0.2,DZ1+0.2].forEach(z=>box(DX1-DX0+0.8,0.45,0.3,M.brand,DCX,PH-0.55,z,scene,false));[DX0-0.2,DX1+0.2].forEach(x=>box(0.3,0.45,DZ1-DZ0+0.8,M.brand,x,PH-0.55,DCZ,scene,false));
    [[[DX0,DZ0],[DX1,DZ0]],[[DX0,DZ1],[DX1,DZ1]],[[DX0,DZ0],[DX0,DZ1]],[[DX1,DZ0],[DX1,DZ1]]].forEach(([a,b])=>{pipe([[a[0],PH+1.1,a[1]],[b[0],PH+1.1,b[1]]],0.05,M.warn);pipe([[a[0],PH+0.55,a[1]],[b[0],PH+0.55,b[1]]],0.04,M.warn);
      const n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/1.8));for(let k=0;k<=n;k++){const t=k/n;pipe([[a[0]+(b[0]-a[0])*t,PH,a[1]+(b[1]-a[1])*t],[a[0]+(b[0]-a[0])*t,PH+1.1,a[1]+(b[1]-a[1])*t]],0.04,M.warn);}});
    const lx=DX1+0.75,lz=DZ1-0.4;[-0.28,0.28].forEach(dz=>box(0.07,PH+1.1,0.07,M.warn,lx,(PH+1.1)/2,lz+dz,scene,false));for(let y=0.4;y<PH;y+=0.45)box(0.06,0.05,0.56,M.warn,lx,y,lz,scene,false);
    for(let y=2.4;y<PH+1;y+=1.1){const h=new THREE.Mesh(new THREE.TorusGeometry(0.45,0.035,4,16,Math.PI),M.warn);h.rotation.set(Math.PI/2,0,-Math.PI/2);h.position.set(lx,y,lz);scene.add(h);}}
  // the disk thickener sits on the deck, centred over the chest
  const thk=new THREE.Group();thk.position.set(34.5-26,PH,-15-TZ);scene.add(thk);
  {const vm=mat("g-wall",{side:THREE.DoubleSide,roughness:0.55});
    const vg=new CylG(1.95,1.95,6,32,1,true,Math.PI/2,Math.PI);vg.rotateZ(Math.PI/2);const vat=new THREE.Mesh(vg,vm);vat.position.set(26,TY,TZ);vat.castShadow=true;vat.receiveShadow=true;thk.add(vat);
    [23,29].forEach(x=>{const eg=new CircG(1.95,32,Math.PI,Math.PI);eg.rotateY(Math.PI/2);const e=new THREE.Mesh(eg,vm);e.position.set(x,TY,TZ);e.castShadow=true;thk.add(e);});
    [-1,1].forEach(sd=>{box(6.2,0.14,0.14,M.steel,26,TY+0.03,TZ+sd*1.97,thk,false);});
    box(5.4,1.0,2.6,M.steel,26,0.5,TZ,thk);[23.3,28.7].forEach(x=>box(0.3,TY-0.4,3.4,M.steel,x,(TY-0.4)/2,TZ,thk));
    const sl=new THREE.Mesh(new THREE.PlaneGeometry(5.96,3.7),M.pulp);sl.rotation.x=-Math.PI/2;sl.position.set(26,TY-0.35,TZ);thk.add(sl);}
  const dC=document.createElement("canvas");dC.width=dC.height=128;{const x=dC.getContext("2d");x.fillStyle="#b7bec8";x.fillRect(0,0,128,128);
    x.fillStyle="#9a7a58";x.beginPath();x.arc(64,64,62,0,7);x.arc(64,64,40,0,7,true);x.fill();x.strokeStyle="#4a5260";x.lineWidth=2.5;
    for(let k=0;k<16;k++){const a=k/16*Math.PI*2;x.beginPath();x.moveTo(64+Math.cos(a)*18,64+Math.sin(a)*18);x.lineTo(64+Math.cos(a)*63,64+Math.sin(a)*63);x.stroke();}
    x.beginPath();x.arc(64,64,62,0,7);x.stroke();x.fillStyle="#5d6672";x.beginPath();x.arc(64,64,18,0,7);x.fill();}
  const dTex=new THREE.CanvasTexture(dC);dTex.colorSpace=THREE.SRGBColorSpace;
  const dFace=new StdMat({map:dTex,roughness:0.6,metalness:0.15});
  const disks=new THREE.Group();disks.position.set(26,TY,TZ);thk.add(disks);
  {const sh=new CylG(0.22,0.22,7.6,12);sh.rotateZ(Math.PI/2);const s=new THREE.Mesh(sh,M.metal);s.position.set(0.3,0,0);disks.add(s);
    const dg=new CylG(1.7,1.7,0.12,28);dg.rotateZ(Math.PI/2);
    for(let k=0;k<11;k++){const d=new THREE.Mesh(dg,[M.steel,dFace,dFace]);d.position.x=-2.5+k*0.5;d.castShadow=true;disks.add(d);}}
  // drive: gearbox + motor on the far end, filtrate valve on the near end
  box(0.9,1.3,1.2,M.steel,29.7,TY-0.1,TZ,thk);box(0.9,TY-0.75,1.2,M.steel,29.7,(TY-0.75)/2,TZ,thk);
  {const mg=new CylG(0.5,0.5,1.4,16);mg.rotateZ(Math.PI/2);const mo=new THREE.Mesh(mg,M.brand);mo.position.set(30.9,TY-0.4,TZ);mo.castShadow=true;thk.add(mo);}
  // spider (filtrate) valve: splits the disk filtrate between the cloudy and clear seal chests. Click it to adjust (easter egg)
  // v2.9.15: sits 0.8 m lower (it clipped the overhead pipe), fed by a short drop from the disk shaft
  {const VY=TY-0.8;pipe([[22.65,TY,TZ],[22.65,VY+0.45,TZ]],0.2,M.steel,thk);
    const vg2=new CylG(0.62,0.62,0.5,16);vg2.rotateZ(Math.PI/2);const v=new THREE.Mesh(vg2,M.steel);v.position.set(22.65,VY,TZ);v.castShadow=true;thk.add(v);
    const hw=new THREE.Mesh(new THREE.TorusGeometry(0.42,0.06,6,18),M.bad);hw.rotation.y=Math.PI/2;hw.position.set(22.25,VY+0.2,TZ);thk.add(hw);
    const sp=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.8,0.08),M.bad);sp.position.set(22.25,VY+0.2,TZ);thk.add(sp);const sp2=sp.clone();sp2.rotation.x=Math.PI/2;thk.add(sp2);
    const hb=new THREE.Mesh(new SphG(1.5,8,6),new THREE.MeshBasicMaterial());hb.visible=false;hb.position.set(22.45,VY+0.1,TZ);thk.add(hb);
    G3.spiderHit=[hb,v,hw,sp,sp2];G3.spiderWheel=hw;}
  // knock-off shower headers above the disks
  pipe([[22.8,TY+2.05,TZ+0.55],[29.2,TY+2.05,TZ+0.55]],0.09,M.metal,thk);pipe([[22.8,TY+2.05,TZ-0.55],[29.2,TY+2.05,TZ-0.55]],0.09,M.metal,thk);
  pipe([[22.8,TY+2.05,TZ-0.55],[22.4,TY+2.05,TZ-0.55],[22.4,TY+2.05,TZ+0.55],[22.8,TY+2.05,TZ+0.55]],0.09,M.metal,thk);
  pipe([[22.4,TY+2.05,TZ],[21.6,TY+2.05,TZ],[21.6,0.05,TZ]],0.09,M.metal,thk);
  // discharge chute down to the repulper and stock pump
  {const ch=box(6.0,0.12,1.8,M.steel,26,TY+0.5,TZ+2.6,thk,false);ch.rotation.x=-0.55;
    box(6.2,0.9,1.0,M.steel,26,1.25,TZ+3.55,thk);box(1.2,1.6,1.2,M.steel,29.9,0.8,TZ+3.55,thk);
    const hp=new THREE.Mesh(new CylG(0.55,0.3,0.9,14),M.steel);hp.position.set(29.9,-0.15,TZ+3.55);hp.castShadow=true;thk.add(hp);}
  // filtrate drop legs from the valve down to the (larger) cloudy and clear seal chests beside the chest
  const sealT=(x,z,col,txt)=>{const R2=1.5,H2=2.8;const t=new THREE.Mesh(new CylG(R2,R2,H2,28,1,true),M.tank);t.position.set(x,H2/2,z);t.castShadow=true;scene.add(t);blob(x,z,2.2);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(R2,0.08,6,32),M.steel);rim.rotation.x=Math.PI/2;rim.position.set(x,H2,z);scene.add(rim);
    [0.9,1.9].forEach(y=>{const b=new THREE.Mesh(new CylG(R2+0.02,R2+0.02,0.1,28,1,true),M.steel);b.position.set(x,y,z);scene.add(b);});
    const w=new THREE.Mesh(new CircG(R2-0.05,28),new StdMat({color:lin0(col),roughness:0.15,metalness:0.1}));w.rotation.x=-Math.PI/2;w.position.set(x,H2-0.3,z);scene.add(w);
    const sc=document.createElement("canvas");sc.width=128;sc.height=40;const c=sc.getContext("2d");c.fillStyle="#ffffff";c.fillRect(0,0,128,40);c.fillStyle=col;c.fillRect(0,0,12,40);c.fillStyle="#1c2233";c.font="800 24px system-ui,sans-serif";c.textAlign="center";c.fillText(txt,70,29);
    const st=new THREE.CanvasTexture(sc);st.colorSpace=THREE.SRGBColorSpace;const sg=new THREE.Mesh(new THREE.PlaneGeometry(2.4,0.75),new THREE.MeshBasicMaterial({map:st,toneMapped:false}));sg.position.set(x,1.4,z+R2+0.06);scene.add(sg);
    return w;};
