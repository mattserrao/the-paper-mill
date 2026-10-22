  /* ---- winder, waiting reels, roof trusses ---- */
  const paperDS=basic("paperc",{side:THREE.DoubleSide});
  slab(-29,-6,-2.5,3,M.slab,0.03);
  const wd=new THREE.Group();wd.position.set(-18.7,0,zc);scene.add(wd);
  /* v6.11 winder update (tools/blender/winder_new.py): a two-drum winder that reads as one. The web runs from the unwind
     stand (its brake holds the tension) over a guide roll on load cells and a bowed spreader roll, through the slitter
     section (top knives over the bottom band knife: two edge trims, blown down the trim ducts, and one centre slit for the
     sim's set of 2), down under a lead-in roll and up round the rear drum into the nip. The set builds on the rear and front
     drums under the rider roll, which rides up its guide columns as the rolls grow. The unwind sits 2 m further out and the
     pass line is 3.3 m up, so the winder operator can walk in under the running web to inspect the sheet (34-3d-hayout.js). */
  const WD={UX:4.6,UY:2.4,GX:2.3,GY:3.35,GR:0.16,BX:1.5,BY:3.3,BR:0.12,SLX:0.6,PASS:3.3,RDX:-1.3,FDX:-2.4,DY:0.75,DR:0.5,SX:-1.85,RIDR:0.26,LX:-0.35,LY:0.45,LR:0.12};G3.WD=WD;
  box(2.2,0.12,0.9,M.ink,4.6,0.06,-2.75,wd,false);{const o=box(0.3,2.3,0.45,M.steel,3.95,1.15,-2.75,wd,false);o.rotation.set(0,0,-0.208);};{const o=box(0.3,2.3,0.45,M.steel,5.25,1.15,-2.75,wd,false);o.rotation.set(0,0,0.208);};box(0.7,0.7,0.55,M.ink,4.6,2.4,-2.75,wd,false);box(0.22,3.25,0.3,M.steel,2.3,1.625,-2,wd,false);box(0.36,0.2,0.36,M.ok,2.3,3.13,-2,wd,false);box(0.3,0.26,0.3,M.ink,2.3,3.35,-2,wd,false);box(0.22,3.2,0.3,M.steel,1.5,1.6,-2,wd,false);box(0.28,0.24,0.28,M.ink,1.5,3.3,-2,wd,false);box(0.3,4.05,0.35,M.steel,-0.15,2.02,-2.75,wd,false);box(0.3,4.05,0.35,M.steel,1.2,2.02,-2.75,wd,false);box(1.75,0.3,0.4,M.steel,0.52,4.05,-2.75,wd,false);box(3,1.45,0.3,M.steel,-1.85,0.72,-2.75,wd,false);box(0.55,0.55,0.4,M.ink,-1.3,0.75,-2.75,wd,false);box(0.55,0.55,0.4,M.ink,-2.4,0.75,-2.75,wd,false);box(0.25,3.8,0.35,M.steel,-2.4,1.9,-2.75,wd,false);box(0.25,3.8,0.35,M.steel,-1.3,1.9,-2.75,wd,false);box(1.5,0.35,0.45,M.steel,-1.85,3.95,-2.75,wd,false);{const g=new CylG(0.13,0.13,1,10);const o=new THREE.Mesh(g,M.steel);o.position.set(-1.85,3.5,-2.75);o.castShadow=true;wd.add(o);}box(2.2,0.12,0.9,M.ink,4.6,0.06,2.75,wd,false);{const o=box(0.3,2.3,0.45,M.steel,3.95,1.15,2.75,wd,false);o.rotation.set(0,0,-0.208);};{const o=box(0.3,2.3,0.45,M.steel,5.25,1.15,2.75,wd,false);o.rotation.set(0,0,0.208);};box(0.7,0.7,0.55,M.ink,4.6,2.4,2.75,wd,false);box(0.22,3.25,0.3,M.steel,2.3,1.625,2,wd,false);box(0.36,0.2,0.36,M.ok,2.3,3.13,2,wd,false);box(0.3,0.26,0.3,M.ink,2.3,3.35,2,wd,false);box(0.22,3.2,0.3,M.steel,1.5,1.6,2,wd,false);box(0.28,0.24,0.28,M.ink,1.5,3.3,2,wd,false);box(0.3,4.05,0.35,M.steel,-0.15,2.02,2.75,wd,false);box(0.3,4.05,0.35,M.steel,1.2,2.02,2.75,wd,false);box(1.75,0.3,0.4,M.steel,0.52,4.05,2.75,wd,false);box(3,1.45,0.3,M.steel,-1.85,0.72,2.75,wd,false);box(0.55,0.55,0.4,M.ink,-1.3,0.75,2.75,wd,false);box(0.55,0.55,0.4,M.ink,-2.4,0.75,2.75,wd,false);box(0.25,3.8,0.35,M.steel,-2.4,1.9,2.75,wd,false);box(0.25,3.8,0.35,M.steel,-1.3,1.9,2.75,wd,false);box(1.5,0.35,0.45,M.steel,-1.85,3.95,2.75,wd,false);{const g=new CylG(0.13,0.13,1,10);const o=new THREE.Mesh(g,M.steel);o.position.set(-1.85,3.5,2.75);o.castShadow=true;wd.add(o);}cylZ(0.72,0.12,M.ink,4.6,2.4,-3.1,16,wd);box(0.5,0.9,0.3,M.steel,4.6,1.95,-3.25,wd,false);box(0.4,0.3,5.9,M.metal,0.6,3.78,0,wd,false);box(0.16,0.4,0.22,M.ink,0.6,3.48,-1.45,wd,false);cylZ(0.14,0.03,M.metal,0.6,3.38,-1.45,12,wd);box(0.16,0.4,0.22,M.ink,0.6,3.48,0,wd,false);cylZ(0.14,0.03,M.metal,0.6,3.38,0,12,wd);box(0.16,0.4,0.22,M.ink,0.6,3.48,1.45,wd,false);cylZ(0.14,0.03,M.metal,0.6,3.38,1.45,12,wd);cylZ(0.17,5.4,M.metal,0.6,3.13,0,12,wd);box(0.4,0.22,5.9,M.metal,0.6,2.75,0,wd,false);box(0.3,0.3,0.3,M.steel,0.15,2.7,-1.62,wd,false);{const g=new CylG(0.12,0.12,2.5,8);const o=new THREE.Mesh(g,M.steel);o.position.set(0.15,1.3,-1.62);o.castShadow=true;wd.add(o);}box(0.3,0.3,0.3,M.steel,0.15,2.7,1.62,wd,false);{const g=new CylG(0.12,0.12,2.5,8);const o=new THREE.Mesh(g,M.steel);o.position.set(0.15,1.3,1.62);o.castShadow=true;wd.add(o);}box(0.24,0.24,1.6,M.steel,0.15,0.12,-2.42,wd,false);box(0.24,0.24,3.24,M.steel,0.15,0.12,0,wd,false);box(1,1,0.9,M.steel,0.15,0.5,-3.6,wd,false);cylZ(0.38,0.12,M.ink,0.15,0.6,-4.1,12,wd);cylZ(0.42,0.9,M.stock,-1.85,0.75,-3.5,14,wd);box(0.9,0.75,0.9,M.steel,-1.85,0.37,-3.5,wd,false);box(0.12,0.12,5,M.warn,-3.15,1.15,0,wd,false);box(0.2,0.5,0.2,M.ink,-3.15,0.75,-2.45,wd,false);box(0.2,0.5,0.2,M.ink,-3.15,0.75,2.45,wd,false);box(0.35,0.5,0.2,M.warn,-0.6,1.4,3.3,wd,false);box(0.04,1.4,0.04,M.ink,-0.6,2.4,3.3,wd,false);cylZ(0.42,0.9,M.stock,5.5,1.2,-3.4,14,wd);
  // wound paper on the roll ends: growth rings round the core, a slightly darker outer wrap
  const endT=texC(128,128,(x,W)=>{const c=W/2;x.fillStyle="#c79b6c";x.fillRect(0,0,W,W);let sd=5;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
      for(let r=10;r<c;r+=2.2+rn()*1.6){x.strokeStyle=`rgba(90,58,30,${0.08+rn()*0.12})`;x.lineWidth=0.8+rn();x.beginPath();x.arc(c,c,r,0,7);x.stroke();}
      x.strokeStyle="rgba(70,45,22,0.55)";x.lineWidth=4;x.beginPath();x.arc(c,c,c-2,0,7);x.stroke();},false);
  const endM=new StdMat({map:endT,roughness:0.9});
  // (one material per mesh: the end faces are their own thin discs, so the batcher never has to split a moving roll)
  const rollG=(L,seg)=>{const g=new CylG(1,1,L,seg);g.rotateX(Math.PI/2);return g;},capG=new CircG(1,24);
  const roll=(L,seg,x,y,z)=>{const r=new THREE.Mesh(rollG(L,seg),M.paper);r.position.set(x,y,z);r.castShadow=true;[1,-1].forEach(s=>{const c=new THREE.Mesh(capG,endM);c.position.z=s*(L/2+0.004);if(s<0)c.rotation.y=Math.PI;r.add(c);});wd.add(r);return r;};
  const unwind=roll(4.8,24,WD.UX,WD.UY,0);cylZ(0.22,5.8,M.steel,WD.UX,WD.UY,0,8,wd);
  const drums=[cylZ(WD.DR,5,M.metal,WD.RDX,WD.DY,0,16,wd),cylZ(WD.DR,5,M.metal,WD.FDX,WD.DY,0,16,wd)];
  // guide, spreader and lead-in rolls
  [[WD.GX,WD.GY,WD.GR,3.4],[WD.BX,WD.BY,WD.BR,3.4],[WD.LX,WD.LY,WD.LR,3.3]].forEach(([x,y,r,L])=>cylZ(r,L,M.metal,x,y,0,12,wd));
  [-1.7,1.7].forEach(z=>box(0.2,0.45,0.25,M.ink,WD.LX,0.22,z,wd,false));
  // v6.5.7: the winder builds a SET of two rolls side by side on the drums (the sim's set), each the size of a roll on the conveyor
  const setRolls=[0.725,-0.725].map(z=>roll(1.4,24,WD.SX,1.75,z));
  const setCores=[0.725,-0.725].map(z=>cylZ(0.12,1.43,M.ink,WD.SX,1.75,z,10,wd));
  // the rider roll on its carriage, the carriage rods up into the cylinders on the crossheads
  const rider=new THREE.Group();rider.position.set(WD.SX,2.4,0);wd.add(rider);cylZ(WD.RIDR,3.1,M.steel,0,0,0,14,rider);box(0.5,0.3,5.9,M.warn,0,0.32,0,rider,false);
  [-2.75,2.75].forEach(z=>box(0.3,0.4,0.4,M.ink,0,0.32,z,rider,false));
  const rods=[-2.75,2.75].map(z=>{const o=new THREE.Mesh(new CylG(0.06,0.06,1,6),M.metal);o.position.set(WD.SX,3,z);wd.add(o);return o;});
  // the edge trims curl off at the knives and down into their nozzles
  // the web: one sheet up to the knives, two after them; strips along a path that follows the unwind and the set as they change
  const webMk=n=>{const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(new Float32Array(n*2*3),3));const ix=[];for(let i=0;i<n-1;i++){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}g.setIndex(ix);const o=new THREE.Mesh(g,paperDS);o.frustumCulled=false;wd.add(o);return o;};
  const wTan=(px,py,cx,cy,r,hiY)=>{const dx=px-cx,dy=py-cy,d=Math.hypot(dx,dy),b=Math.atan2(dy,dx),al=Math.acos(Math.min(1,r/d)),a1=b+al,a2=b-al;
    const p1=[cx+r*Math.cos(a1),cy+r*Math.sin(a1)],p2=[cx+r*Math.cos(a2),cy+r*Math.sin(a2)];return (hiY?p1[1]>=p2[1]:p1[0]>=p2[0])?p1:p2;};
  const WEBA=webMk(6),WEBB=[webMk(14),webMk(14)],WK={ru:-1,rr:-1,w:-1},IN=3.0/205;   // (v6.11: the 3 m web is 205" across: metres an inch)
  function wStrip(o,pts,z0,z1){const a=o.geometry.attributes.position.array;pts.forEach(([x,y],i)=>{a.set([x,y,z0,x,y,z1],i*6);});for(let i=pts.length;i<a.length/6;i++){const [x,y]=pts[pts.length-1];a.set([x,y,z0,x,y,z1],i*6);}
    o.geometry.attributes.position.needsUpdate=true;o.geometry.computeBoundingSphere();}
  function webUpdate(ru,RR,yc,W){W=W||100;if(W!==WK.w){WK.w=W;WK.rr=-1;trimSet(W);}if(Math.abs(ru-WK.ru)>0.01){WK.ru=ru;const gt=[WD.GX,WD.GY+WD.GR],u=wTan(gt[0],gt[1],WD.UX,WD.UY,ru,true);
      wStrip(WEBA,[u,[WD.GX+0.06,WD.GY+WD.GR],gt,[WD.BX,WD.BY+WD.BR],[WD.SLX+0.2,WD.PASS],[WD.SLX,WD.PASS]],-1.5,1.5);}
    if(Math.abs(RR-WK.rr)>0.004){WK.rr=RR;const P=[[WD.SLX,WD.PASS]],L=(cx,cy,r,a0,a1,n)=>{for(let k=0;k<=n;k++){const a=a0+(a1-a0)*k/n;P.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}};
      L(WD.LX,WD.LY,WD.LR,0.2,-2.6,3);   // down to the lead-in roll and under it
      const an=Math.atan2(yc-WD.DY,WD.SX-WD.RDX);L(WD.RDX,WD.DY,WD.DR,-0.75,an,8);   // up the rear drum's far side and over it into the nip
      const LW=W*IN;wStrip(WEBB[0],P,-LW-0.01,-0.01);wStrip(WEBB[1],P,0.01,LW+0.01);}}
  // upender: a hinged plate at the head of the roll conveyor that tips each roll from lying down to standing up
  const UPX=-22.9,UPZ=zc+0.7,UPY=0.5,UPC=1.32;
  const upender=new THREE.Group();upender.position.set(UPX,UPY,UPZ);scene.add(upender);
  box(1.5,0.08,1.45,M.steel,0,0.04,-0.72,upender,false);box(1.5,1.1,0.08,M.steel,0,0.55,0.0,upender,false);
  box(0.25,0.5,0.25,M.ink,-0.9,-0.25,0,scene,false);
  // v6.5.7: transfer table beside the upender: the second roll of a set waits here, then slides across onto the plate
  box(1.5,0.48,1.5,M.steel,UPX,0.24,zc-1.45,scene);box(0.12,0.5,1.5,M.brand,UPX-0.8,0.25,zc-1.45,scene,false);
  const web={set visible(v){WEBA.visible=WEBB[0].visible=WEBB[1].visible=v;}};   // (34: shown while the winder cuts)
  // v6.11 the dry-end (DE) pulper on the drive side: the trim fan blows the trim into it and it pumps the slurry back to the
  // stock chest (03g). A tub with its rim and agitator drive, the trim duct dropping in, and a name plate.
  {const X=WD.SLX-0.45,Z=-5.3;cylZ(0.05,0.01,M.ink,X,0,Z,4,wd);
   const tub=new THREE.Mesh(new CylG(1.15,1.05,1.3,18),M.steel);tub.position.set(X,0.65,Z);tub.castShadow=true;wd.add(tub);
   const rim=new THREE.Mesh(new CylG(1.22,1.22,0.12,18),M.ink);rim.position.set(X,1.32,Z);wd.add(rim);
   const pulp=new THREE.Mesh(new CircG(1.08,18),M.kraft);pulp.rotation.x=-Math.PI/2;pulp.position.set(X,1.36,Z);wd.add(pulp);
   box(2.5,0.16,0.3,M.steel,X,1.5,Z,wd,false);box(0.55,0.5,0.55,M.stock,X,1.82,Z,wd,false);box(0.35,0.3,0.35,M.ink,X+0.45,1.75,Z,wd,false);
   box(0.24,0.24,1.4,M.steel,X,1.6,Z+1.15,wd,false);box(0.24,1.2,0.24,M.steel,X,1.0,Z+1.75,wd,false);   // the trim duct from the fan, into the tub
   cylZ(0.14,1.4,M.ww,X-1.0,0.35,Z+0.8,10,wd);box(0.5,0.4,0.4,M.brand,X-1.0,0.25,Z+1.6,wd,false);   // stock pump back to the chest
   const c=document.createElement("canvas");c.width=256;c.height=48;const g=c.getContext("2d");g.fillStyle="#ffffff";g.fillRect(0,0,256,48);g.fillStyle="#1c2233";g.font="800 24px system-ui,sans-serif";g.textAlign="center";g.fillText("DE PULPER",128,33);
   const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.26),new THREE.MeshBasicMaterial({map:t}));pl.position.set(X,0.8,Z+1.13);wd.add(pl);}
  // the edge trims: what's left of the web outside the twin rolls (v6.11: wider at narrow widths)
  const TRIMS=[webMk(4),webMk(4)],TP=[[WD.SLX,WD.PASS],[WD.SLX-0.2,WD.PASS-0.12],[WD.SLX-0.38,WD.PASS-0.3],[WD.SLX-0.45,2.86]];
  function trimSet(W){const L=W*IN+0.01;wStrip(TRIMS[0],TP,-1.5,-L);wStrip(TRIMS[1],TP,L,1.5);}trimSet(100);
  G3.wdParts={setRolls,setCores,rider,rods,webUpdate,WD,WEBA,WEBB,unwind,IN};
  (G3.dynLater||(G3.dynLater=[])).push(rider,...rods,...setCores,...setRolls,WEBA,...WEBB,...TRIMS);   // (they move or change shape: never batched)
  box(1.2,1.2,0.8,M.steel,0,0.6,4.3,wd);box(1.1,0.5,0.1,M.robot,0,1.25,3.95,wd,false);
  // v6.11.2: the spare spool stand, west of the winder on the crane's line (z = zc): two rails at the journals carry the empty
  // spools side by side, so the crane only travels east-west to take one to the primary arms (it left the line before only
  // to reach the old floor rack, which reached into the unwind stand and the parked reels)
  const SPR={x:-24.5,dx:-1.0,y:1.22,z:zc,ry:0.98};
  const rackSpools=[0,1,2].map(k=>{const m=spoolModel(scene);m.g.position.set(SPR.x+k*SPR.dx,SPR.y,SPR.z);m.set(R0);return m;});
  {const x0=SPR.x+0.6,x1=SPR.x+2*SPR.dx-0.6,xm=(x0+x1)/2,L=x0-x1;
   [-ZJ,ZJ].forEach(dz=>{const z=SPR.z+dz;box(L,0.12,0.3,M.steel,xm,SPR.ry-0.06,z,scene);box(L,0.05,0.3,M.warn,xm,SPR.ry+0.005,z,scene,false);   // rail with a painted top
     [x0-0.12,x1+0.12].forEach(x=>{box(0.18,SPR.ry-0.12,0.18,M.steel,x,(SPR.ry-0.12)/2,z,scene);box(0.08,0.32,0.3,M.warn,x,SPR.ry+0.16,z,scene,false);});   // legs and end stops
     box(0.12,0.08,0.12,M.ink,xm,SPR.ry-0.2,z,scene,false);});
   box(L,0.08,0.12,M.steel,xm,0.25,SPR.z-ZJ+0.1,scene,false);box(L,0.08,0.12,M.steel,xm,0.25,SPR.z+ZJ-0.1,scene,false);}
  const parked=[0,1,2,3].map(k=>{const g=new THREE.Group();g.position.set(-11.8-k*4.1,0,-0.2);scene.add(g);
    box(0.35,1.1,4.6,M.steel,-1.3,0.55,0,g);box(0.35,1.1,4.6,M.steel,1.3,0.55,0,g);cylZ(2,5.2,M.paper,0,2.15,0,22,g);cylZ(0.22,6.2,M.steel,0,2.15,0,8,g);return g;});
  // overhead crane: carries full reels from the reel to storage and from storage to the winder unwind
  const CR={x:-8,z:zc,y:9.6,jobs:[],j:null,t:0,hidePark:0,hideUnwind:false,lastTurn:-1,lastBuf:0,lastPark:0};
  const crane=new THREE.Group();scene.add(crane);G3.CR=CR;   // (tests)
  {[-2.4,13.4].forEach(z=>{box(21.4,0.35,0.4,M.warn,-15.9,11.4,z,scene,false);for(let x=-26;x<=-6;x+=10)box(0.2,1.6,0.2,M.metal,x,12.2,z,scene,false);});}
  const crBridge=new THREE.Group();scene.add(crBridge);box(0.7,0.7,16.4,M.warn,0,11,5.5,crBridge);box(0.9,0.5,0.9,M.ink,0,11.6,-2.4,crBridge,false);box(0.9,0.5,0.9,M.ink,0,11.6,13.4,crBridge,false);
  const crTrolley=box(1.6,0.7,1.4,M.ink,0,10.45,0,crBridge);
  const crCable=new THREE.Mesh(new CylG(0.04,0.04,1,6),M.ink);scene.add(crCable);
  // reel strongback: rigid lifting beam longer than the spool, fixed legs ending in J-hooks that cradle the journals
  const ZH=CD/2+0.9,SB=0.8+RM+0.6;
  const crHook=new THREE.Group();scene.add(crHook);
  {box(0.7,0.6,0.55,M.warn,0,0.25,0,crHook,false);cylZ(0.24,0.6,M.ink,0,0.3,0,12,crHook);
   [-1.2,1.2].forEach(z=>{const a=new THREE.Vector3(0,-0.2,0),b=new THREE.Vector3(0,-0.7,z),d=b.clone().sub(a);const r=new THREE.Mesh(new CylG(0.035,0.035,d.length(),6),M.ink);r.position.copy(a).add(b).multiplyScalar(0.5);r.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());crHook.add(r);});
   box(0.45,0.07,2*ZH+0.4,M.warn,0,-0.75,0,crHook,false);box(0.45,0.07,2*ZH+0.4,M.warn,0,-1.1,0,crHook,false);box(0.09,0.32,2*ZH+0.4,M.warn,0,-0.92,0,crHook,false);
   [-ZH,ZH].forEach(z=>{box(0.32,SB-1.1,0.2,M.warn,0,-(1.1+SB)/2,z,crHook,false);box(0.85,0.16,0.28,M.ink,0.05,-SB-0.32,z,crHook,false);box(0.14,0.5,0.28,M.ink,0.42,-SB-0.1,z,crHook,false);});}
  const carried=spoolModel(crHook);carried.g.position.y=-SB;carried.g.visible=false;
  const UNW=[-18.7+WD.UX,WD.UY,zc],REELP=[KX,DY,zc],parkP=k=>[-11.8-k*4.1,2.15,-0.2],SPOOLP=()=>[SPR.x+Math.max(0,rackSpools.filter(m=>m.g.visible).length-1)*SPR.dx,SPR.y,SPR.z],ARMP=()=>[DX+Math.cos(105*Math.PI/180)*(DR+R0+0.35),DY+Math.sin(105*Math.PI/180)*(DR+R0+0.35),zc];
  function craneUpdate(rdt){const nPark=Math.max(0,reelsAtWinder()-1);
    if(CR.lastTurn<0){CR.lastTurn=S.tot.turnups;CR.lastPark=nPark;}
    // v2.9.5: a turn-up and a stored reel going to the unwind can land in the same frame (fast game speeds): handle both,
    // never one or the other, so the storage rail always matches the sim
    let parksAdded=0;
    if(S.tot.turnups>CR.lastTurn){const n=Math.min(2,S.tot.turnups-CR.lastTurn);CR.lastTurn=S.tot.turnups;
      // (v6.5.7: each reel going to storage takes its own stand; two in one frame used to be sent to the same one)
      const toUnw=CR.lastBuf<0.3?1:0,nParks=n-toUnw;
      for(let i=0;i<n;i++){if(i<toUnw){CR.jobs.push({a:REELP,b:UNW,kind:"unw",fromReel:true,delay:0.8});CR.hideUnwind=true;}
        else{CR.jobs.push({a:REELP,b:parkP(clamp(nPark-nParks+parksAdded,0,parked.length-1)),kind:"park",fromReel:true,delay:0.8});parksAdded++;}}
      CR.jobs.push({a:SPOOLP(),b:ARMP(),kind:"spool"});}
    {const moved=Math.min(2,CR.lastPark+parksAdded-nPark);for(let i=0;i<moved;i++)if(S.winderBuf>0.3){CR.jobs.unshift({a:parkP(nPark+i),b:UNW,kind:"unw",fromPark:true});CR.hideUnwind=true;}}
    CR.lastPark=nPark;CR.lastBuf=S.winderBuf;
    while(CR.jobs.length>3){const j=CR.jobs.shift();if(j.fromPark)CR.extraPark=Math.max(0,(CR.extraPark||0)-1);if(j.kind==="park")CR.hidePark=Math.max(0,CR.hidePark-1);if(j.kind==="spool"){TU.armHas=true;TU.armT=9;}if(j.fromReel)TU.kick=false;}
    if(!CR.j&&!CR.jobs.length&&TU.t>4&&!TU.armHas){TU.armHas=true;TU.armT=9;}
    if(!CR.j&&CR.jobs.length){CR.j=CR.jobs.shift();CR.t=0;CR.j.s=[CR.x,CR.z];}
    const per=P.jumbo/Math.max(5,S.rates.prod||30)*60/Math.max(1,simRate()),T=clamp(per*0.25,0.6,4)*(CR.jobs.length?0.7:1);   // v2.9.5: each reel makes up to 3 crane moves, so a move must take well under a third of a reel
    if(CR.j&&rdt>0&&(CR.j.delay||0)>0){CR.j.delay-=rdt;}
    else if(CR.j&&rdt>0){const j=CR.j;CR.t+=rdt/T;const u=CR.t,L=(a,b,k)=>a+(b-a)*clamp(k,0,1),hi=10.0;let x,z,y,on=false;
      if(u<0.2){x=L(j.s[0],j.a[0],u/0.2);z=L(j.s[1],j.a[2],u/0.2);y=hi;}
      else if(u<0.3){x=j.a[0];z=j.a[2];y=L(hi,j.a[1]+SB,(u-0.2)/0.1);}
      else if(u<0.4){x=j.a[0];z=j.a[2];y=L(j.a[1]+SB,hi,(u-0.3)/0.1);on=true;}
      else if(u<0.75){const k=(u-0.4)/0.35;x=L(j.a[0],j.b[0],k);z=L(j.a[2],j.b[2],k);y=hi;on=true;}
      else if(u<0.87){x=j.b[0];z=j.b[2];y=L(hi,j.b[1]+SB,(u-0.75)/0.12);on=true;}
      else{x=j.b[0];z=j.b[2];y=L(j.b[1]+SB,hi,(u-0.87)/0.13);}
      carried.g.visible=on;carried.set(j.kind==="spool"?R0:RM);
      if(u>=0.3&&!j.picked){j.picked=true;if(j.fromPark)CR.extraPark=Math.max(0,(CR.extraPark||0)-1);if(j.kind==="spool"){const m=rackSpools.filter(m=>m.g.visible).pop();if(m)m.g.visible=false;}else if(j.fromReel)TU.kick=false;}
      if(u>=0.87&&!j.dropped){j.dropped=true;if(j.kind==="park")CR.hidePark=Math.max(0,CR.hidePark-1);else if(j.kind==="spool"){TU.armHas=true;TU.armT=0;}else CR.hideUnwind=false;}
      CR.x=x;CR.z=z;CR.y=y;if(u>=1)CR.j=null;}
    else if(!CR.j)carried.g.visible=false;
    if(!CR.j&&!CR.jobs.length){CR.hideUnwind=false;CR.hidePark=0;CR.extraPark=0;}
    crBridge.position.x=CR.x;crTrolley.position.z=CR.z;crHook.position.set(CR.x,CR.y,CR.z);
    crCable.position.set(CR.x,(10.1+CR.y+0.55)/2,CR.z);crCable.scale.y=Math.max(0.1,10.1-(CR.y+0.55));
    return nPark;}
  {const t=new THREE.Group();scene.add(t);
    for(let x=-24;x<=56;x+=16)box(0.2,0.25,13.4,M.metal,x,13,9.3,t,false);
    box(80.4,0.25,0.2,M.metal,16,13,2.6,t,false);for(let x=-24;x<=56;x+=16)box(0.22,13,0.22,M.metal,x,6.5,2.6,t,false);}
  /* the broke hole by the winder (v6.1.3: read as a black square on the floor). Now a floor opening that looks like one:
     broke paper down in the pit, a yellow kick-plate round the edge and a yellow guard rail on three sides */
  {const HX=-12,HZ=15.6,W=2.2,pit=new StdMat({color:lin0("#6f5a3e"),roughness:0.95}),ylw=new StdMat({color:lin0("#e2b42a"),roughness:0.6});
    box(W-0.2,0.04,W-0.2,pit,HX,0.03,HZ,scene,false);
    for(let k=0;k<5;k++)box(0.5,0.05,0.35,M.kraft,HX-0.6+((k*0.53)%1.2),0.06,HZ-0.5+((k*0.37)%1.0),scene,false);   // scraps of broke in the pit
    [[0,-W/2],[0,W/2]].forEach(([dx,dz])=>box(W,0.1,0.12,ylw,HX+dx,0.05,HZ+dz,scene,false));[[-W/2,0],[W/2,0]].forEach(([dx,dz])=>box(0.12,0.1,W,ylw,HX+dx,0.05,HZ+dz,scene,false));
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>box(0.08,1.0,0.08,ylw,HX+sx*W/2,0.5,HZ+sz*W/2,scene,false));
    box(W,0.06,0.06,ylw,HX,1.0,HZ-W/2,scene,false);box(0.06,0.06,W,ylw,HX-W/2,1.0,HZ,scene,false);box(0.06,0.06,W,ylw,HX+W/2,1.0,HZ,scene,false);
    box(W,0.06,0.06,ylw,HX,0.55,HZ-W/2,scene,false);box(0.06,0.06,W,ylw,HX-W/2,0.55,HZ,scene,false);box(0.06,0.06,W,ylw,HX+W/2,0.55,HZ,scene,false);}

