/* ---------- 3D view (Three.js r128) ---------- */
const G3={on:false,ok:false};
// no WebGL: say so plainly instead of showing an empty page
function no3D(){G3.ok=false;$("no3d").hidden=false;$("no3d-retry").onclick=()=>location.reload();diag("3D unavailable: no WebGL");}
(function init3D(){
  const host=$("view3d"),glc=$("gl");
  if(!THREE){no3D();return;}
  let renderer;
  // if the phone/GPU drops the WebGL context (memory pressure), ask the browser to give it back instead of leaving a frozen picture
  glc.addEventListener("webglcontextlost",e=>{e.preventDefault();G3.lost=true;console.warn("WebGL context lost; waiting for restore");
    // if the phone doesn't hand the graphics back, say so plainly and offer a reload instead of leaving a frozen picture
    setTimeout(()=>{if(!G3.lost||document.getElementById("glLostMsg"))return;const d=document.createElement("div");d.id="glLostMsg";
      d.style.cssText="position:fixed;inset:auto 16px 96px 16px;z-index:300;background:var(--panel,#fff);color:var(--ink,#111);border:1px solid var(--line,#ccc);border-radius:12px;padding:12px 14px;font:500 14px system-ui;box-shadow:0 10px 30px rgba(0,0,0,.25);display:flex;gap:10px;align-items:center";
      d.innerHTML='<span style="flex:1">Your device reset the 3D graphics (low memory).</span><button style="font:600 14px system-ui;padding:8px 12px;border-radius:8px">Reload</button>';
      d.querySelector("button").onclick=()=>location.reload();document.body.appendChild(d);},4000);},false);
  glc.addEventListener("webglcontextrestored",()=>{G3.lost=false;console.warn("WebGL context restored");{const m=document.getElementById("glLostMsg");if(m)m.remove();}
    try{G3.scene&&G3.scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{m.needsUpdate=true;["map","alphaMap","emissiveMap"].forEach(k=>{if(m[k])m[k].needsUpdate=true;});});
      if(o.geometry&&o.geometry.attributes)for(const k in o.geometry.attributes)o.geometry.attributes[k].needsUpdate=true;if(o.geometry&&o.geometry.index)o.geometry.index.needsUpdate=true;});
      if(G3.renderer)G3.renderer.shadowMap.needsUpdate=true;}catch(e){}},false);
  try{renderer=new THREE.WebGLRenderer({canvas:glc,antialias:!matchMedia("(pointer: coarse)").matches,powerPreference:"high-performance"});}
  catch(e){no3D();return;}
  if(!renderer.getContext()){no3D();return;}
  // r150+ reads every shader's error log on first draw, which forces the GPU to finish compiling right then:
  // a multi-second freeze the first time upsets appear. The game's shaders are fixed, so skip the check and let
  // the start-up precompile (G3.prewarm) do the work up front as intended.
  renderer.debug.checkShaderErrors=false;
  G3.ok=true;
  const mobile=matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(mobile?1.25:2,window.devicePixelRatio||1));
  // the shadow pass redraws every shadow-casting object, so refresh it 15x a second instead of every frame (v2.8.4: desktop too)
  renderer.shadowMap.autoUpdate=false;G3.shadowHz=15;
  // v2.8.4: round shapes get only as many sides as their size needs at this zoom (unit shapes that get scaled up keep 24)
  const segCap=(r,s)=>Math.max(3,Math.min(s,r===1?24:r<0.15?6:r<0.45?10:r<1.2?16:r<4?20:28));
  class CylG extends THREE.CylinderGeometry{constructor(rt=1,rb=1,h=1,rs=32,hs=1,oe=false,ts=0,tl=Math.PI*2){super(rt,rb,h,segCap(Math.max(rt,rb),rs),hs,oe,ts,tl);}}
  class SphG extends THREE.SphereGeometry{constructor(r=1,ws=32,hs=16,...a){super(r,Math.max(3,Math.min(ws,16)),Math.max(2,Math.min(hs,10)),...a);}}
  class RingG extends THREE.RingGeometry{constructor(a=0.5,b=1,ts=32,...x){super(a,b,Math.max(3,Math.min(ts,32)),...x);}}
  class CircG extends THREE.CircleGeometry{constructor(r=1,sg=32,...x){super(r,Math.max(3,Math.min(sg,32)),...x);}}
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const scene=new THREE.Scene();G3.scene=scene;G3.renderer=renderer;
  const camera=new THREE.PerspectiveCamera(18,16/9,2,1400);

  /* palette: every material is bound to a CSS token so theme switches recolor the scene */
  const MATS=[];
  // v2.9.0: phones get the much cheaper Lambert lighting model instead of physically based shading (same colours, flatter sheen)
  function StdMat(o){if(!mobile)return new THREE.MeshStandardMaterial(o);const r=Object.assign({},o||{});delete r.roughness;delete r.metalness;delete r.flatShading;delete r.envMapIntensity;delete r.roughnessMap;delete r.metalnessMap;return new THREE.MeshLambertMaterial(r);}
  function tok(name){return getComputedStyle(document.documentElement).getPropertyValue("--"+name).trim()||"#888";}
  function mat(token,opts={}){const m=new StdMat(Object.assign({roughness:0.72,metalness:0.04,flatShading:false},opts));m.userData.token=token;MATS.push(m);return m;}
  let paletteKey="",skyHex="#b3bbcb";
  let palV=-1;
  function applyPalette(){if(palV===PAL_V)return;palV=PAL_V;   // only after rollMill or setPaper (see PAL_V)
    const key=["g-sky","g-ground","bg","ink","brand","paperc"].map(tok).join();
    if(key===paletteKey)return;paletteKey=key;skyHex=tok("g-sky");
    MATS.forEach(m=>m.color.set(tok(m.userData.token)).convertSRGBToLinear());
    scene.background=new THREE.Color(tok("g-sky")).convertSRGBToLinear();
    
    hemi.color.set("#ffffff");hemi.groundColor.set(tok("g-ground")).convertSRGBToLinear();
    baseHemi=0.5;baseSun=1.4;if(G3.rebrand)G3.rebrand();
  }

  /* lights */
  // three r155+ dropped the legacy light units: scaling every intensity by π reproduces the r128 look
  const LEG=Math.PI;
  const hemi=new THREE.HemisphereLight(0xffffff,0x888888,0.85*LEG);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff4e6,1.5*LEG);sun.position.set(-75,95,48);
  sun.castShadow=true;const sz=1024;sun.shadow.mapSize.set(sz,sz);
  Object.assign(sun.shadow.camera,{left:-90,right:90,top:60,bottom:-60,near:10,far:250});sun.shadow.bias=-0.0004;sun.shadow.radius=3;sun.shadow.normalBias=0.04;
  sun.target.position.set(-5,0,5);scene.add(sun,sun.target);
  let baseHemi=0.85,baseSun=0.9;

  /* helpers */
  const W=(x,y)=>[(x-600)/10,(y-330)/10];
  const RB={};
  function rboxGeo(w,h,d){const k=w+"|"+h+"|"+d;if(RB[k])return RB[k];const r=Math.min(0.16,Math.min(w,h,d)*0.2),s=new THREE.Shape(),ww=w-2*r,dd=d-2*r,c=Math.min(r*0.6,ww/2,dd/2);
    s.moveTo(-ww/2+c,-dd/2);s.lineTo(ww/2-c,-dd/2);s.quadraticCurveTo(ww/2,-dd/2,ww/2,-dd/2+c);s.lineTo(ww/2,dd/2-c);s.quadraticCurveTo(ww/2,dd/2,ww/2-c,dd/2);
    s.lineTo(-ww/2+c,dd/2);s.quadraticCurveTo(-ww/2,dd/2,-ww/2,dd/2-c);s.lineTo(-ww/2,-dd/2+c);s.quadraticCurveTo(-ww/2,-dd/2,-ww/2+c,-dd/2);
    const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(0.001,h-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,curveSegments:4});
    g.rotateX(-Math.PI/2);g.translate(0,-(h-2*r)/2,0);g.computeVertexNormals();g.userData.shared=true;return RB[k]=g;}
  function box(w,h,d,m,x,y,z,parent=scene,shadow=true){const o=new THREE.Mesh(Math.min(w,h,d)>=0.45?rboxGeo(w,h,d):new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;}
  function cylZ(r,len,m,x,y,z,seg=24,parent=scene){const g=new CylG(r,r,len,seg);g.rotateX(Math.PI/2);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const edgeSoft=new THREE.LineBasicMaterial({color:new THREE.Color("#3c4559").convertSRGBToLinear(),transparent:true,opacity:0.22});
  const edgeMat=new THREE.LineBasicMaterial({color:lin0("#3c4559"),transparent:true,opacity:0.42});
  function lin0(c){return new THREE.Color(c).convertSRGBToLinear();}
  function edges(o,mt=edgeMat,ang=25){const e=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,ang),mt);o.add(e);return e;}
  const aoC=document.createElement("canvas");aoC.width=4;aoC.height=64;{const x=aoC.getContext("2d"),g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,"rgba(28,34,51,0.34)");g.addColorStop(0.35,"rgba(28,34,51,0.14)");g.addColorStop(1,"rgba(28,34,51,0)");x.fillStyle=g;x.fillRect(0,0,4,64);}
  const aoTex=new THREE.CanvasTexture(aoC);const aoMat=new THREE.MeshBasicMaterial({map:aoTex,transparent:true,depthWrite:false});
  const aoRC=document.createElement("canvas");aoRC.width=aoRC.height=128;{const x=aoRC.getContext("2d"),g=x.createRadialGradient(64,64,30,64,64,64);g.addColorStop(0,"rgba(28,34,51,0.38)");g.addColorStop(0.5,"rgba(28,34,51,0.16)");g.addColorStop(1,"rgba(28,34,51,0)");x.fillStyle=g;x.fillRect(0,0,128,128);}
  const aoRMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(aoRC),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  // soft darkening on the ground along a wall base: side = which side of the line gets it
  function skirt(x0,z0,x1,z1,w=1.8,parent=scene){const len=Math.hypot(x1-x0,z1-z0),p=new THREE.Mesh(new THREE.PlaneGeometry(len,w),aoMat);p.rotation.x=-Math.PI/2;
    const ang=Math.atan2(z1-z0,x1-x0);p.rotation.z=-ang;p.position.set((x0+x1)/2,0.035,(z0+z1)/2);parent.add(p);return p;}
  function box2(x0,x1,z0,z1,w=1.8){skirt(x0,z0-w/2,x1,z0-w/2,w);skirt(x0,z1+w/2,x1,z1+w/2,w);skirt(x0-w/2,z0,x0-w/2,z1,w);skirt(x1+w/2,z0,x1+w/2,z1,w);}
  function blob(x,z,r){const p=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),aoRMat);p.rotation.x=-Math.PI/2;p.position.set(x,0.04,z);scene.add(p);return p;}
  function slab(x0,x1,z0,z1,m,y=0.02){const pg=new THREE.PlaneGeometry(x1-x0,z1-z0);if(m&&m.map){const uv=pg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(x1-x0)/8,uv.getY(i)*(z1-z0)/8);}
    const o=new THREE.Mesh(pg,m);o.rotation.x=-Math.PI/2;o.position.set((x0+x1)/2,y,(z0+z1)/2);o.receiveShadow=true;scene.add(o);if(x1-x0<300)edges(o,edgeSoft,1);return o;}
  // end-suction centrifugal pump on a skid: volute, bearing frame, coupling guard, motor
  function pumpModel(parent=scene){const g=new THREE.Group();parent.add(g);
    box(2.5,0.2,1.0,M.steel,0.15,0.1,0,g);
    const vg=new CylG(0.55,0.55,0.5,20);vg.rotateZ(Math.PI/2);const v=new THREE.Mesh(vg,M.metal);v.position.set(-0.7,0.75,0);v.castShadow=true;g.add(v);
    const ng=new CylG(0.2,0.2,0.5,12);const dn=new THREE.Mesh(ng,M.metal);dn.position.set(-0.7,1.35,0);g.add(dn);
    box(0.5,0.55,0.45,M.steel,-0.15,0.6,0,g);box(0.45,0.4,0.42,M.warn,0.3,0.68,0,g,false);
    const mg=new CylG(0.42,0.42,1.0,18);mg.rotateZ(Math.PI/2);const mo=new THREE.Mesh(mg,M.motor);mo.position.set(1.0,0.75,0);mo.castShadow=true;g.add(mo);
    const fg=new CylG(0.38,0.38,0.18,18);fg.rotateZ(Math.PI/2);const fan=new THREE.Mesh(fg,M.ink);fan.position.set(1.58,0.75,0);g.add(fan);
    box(0.3,0.25,0.3,M.ink,1.0,1.25,0,g,false);return g;}
  function fieldPump(x,y,z,rot){const g=pumpModel();g.rotation.y=rot;g.position.set(x+0.7*Math.cos(rot),y-0.75,z-0.7*Math.sin(rot));blob(x+0.4*Math.sin(-rot),z,1.6);return g;}
  function pipe(pts,r,m,parent=scene){const up=new THREE.Vector3(0,1,0);
    for(let i=0;i<pts.length-1;i++){const a=new THREE.Vector3(...pts[i]),b=new THREE.Vector3(...pts[i+1]),d=b.clone().sub(a),L=d.length();
      const tex=m===M.stock&&M.pipeStock,cg=new CylG(r,r,L,10);if(tex){const uv=cg.attributes.uv;for(let k=0;k<uv.count;k++)uv.setY(k,uv.getY(k)*L/3);}
      const o=new THREE.Mesh(cg,tex?M.pipeStock:m);o.position.copy(a).add(b).multiplyScalar(0.5);o.quaternion.setFromUnitVectors(up,d.normalize());o.castShadow=true;parent.add(o);}
    pts.slice(1,-1).forEach(p=>{const s=new THREE.Mesh(new SphG(r*1.15,10,8),m);s.position.set(...p);parent.add(s);});}

  const M={ground:mat("g-ground"),slab:mat("g-slab"),asphalt:mat("g-asphalt"),wall:mat("g-wall"),steel:mat("machine",{metalness:0.3,roughness:0.6}),metal:mat("g-metal",{metalness:0.35,roughness:0.5}),
    kraft:mat("kraft"),stock:mat("stock"),paper:mat("paperc",{roughness:0.95}),ink:mat("ink"),warn:mat("warn"),ok:mat("ok"),bad:mat("bad"),
    lane:mat("g-lane"),glass:mat("g-wall",{transparent:true,opacity:0.3,depthWrite:false,side:THREE.DoubleSide,roughness:0.2}),robot:mat("stock",{roughness:0.4}),off:mat("smoke")};
  M.liquid=mat("pulp",{roughness:0.75});M.pulp=mat("pulp",{roughness:0.3});M.efork=mat("stock");
  M.steel=mat("g-frame",{metalness:0.25,roughness:0.55});M.brand=mat("brand",{roughness:0.55});M.fork=mat("g-fork",{roughness:0.5});M.wind=mat("g-glass",{roughness:0.2,metalness:0.3});
  M.robot=mat("brand",{roughness:0.4});
  // v3.2.1 textures: drawn once into small canvases and shared, so no extra draw calls or per-frame work
  const texC=(w,h,draw,rep2)=>{const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    if(rep2){t.wrapS=t.wrapT=THREE.RepeatWrapping;}t.anisotropy=4;return t;};
  const rnd=(a,b)=>a+Math.random()*(b-a);
  // 1 + 4: concrete floor and pads. Speckle, soft mottling, saw-cut joints every 4 m, the odd oil drip and rust ring (one 8 m tile)
  const floorTex=texC(256,256,(x,W)=>{x.fillStyle="#f2f2f0";x.fillRect(0,0,W,W);
    for(let k=0;k<14;k++){const g=x.createRadialGradient(rnd(0,W),rnd(0,W),0,rnd(0,W),rnd(0,W),rnd(30,90));const a=rnd(0.02,0.05);g.addColorStop(0,`rgba(120,118,110,${a})`);g.addColorStop(1,"rgba(120,118,110,0)");x.fillStyle=g;x.fillRect(0,0,W,W);}
    for(let k=0;k<2600;k++){const v=Math.random()<0.5?rnd(150,190):rnd(235,255);x.fillStyle=`rgba(${v},${v},${v-4},${rnd(0.15,0.4)})`;x.fillRect(rnd(0,W),rnd(0,W),1,1);}
    x.fillStyle="rgba(110,110,105,0.35)";[0,128].forEach(p=>{x.fillRect(p,0,1.5,W);x.fillRect(0,p,W,1.5);});
    const ring=(cx,cy,r,col)=>{const g=x.createRadialGradient(cx,cy,r*0.2,cx,cy,r);g.addColorStop(0,col.replace("A","0.10"));g.addColorStop(0.75,col.replace("A","0.16"));g.addColorStop(1,col.replace("A","0"));x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();};
    ring(70,190,13,"rgba(60,55,50,A)");ring(200,60,9,"rgba(60,55,50,A)");ring(172,214,7,"rgba(150,90,40,A)");ring(40,52,5,"rgba(60,55,50,A)");
    x.strokeStyle="rgba(90,88,84,0.12)";x.lineWidth=1;for(let k=0;k<3;k++){x.beginPath();let px=rnd(0,W),py=rnd(0,W);x.moveTo(px,py);for(let s2=0;s2<6;s2++){px+=rnd(-14,14);py+=rnd(-14,14);x.lineTo(px,py);}x.stroke();}},true);
  M.slab.map=floorTex;M.slab.needsUpdate=true;
  // 7: dryer cans: brushed / polished steel with circumferential machining marks and a couple of doctor-blade scuffs
  // left half: the shell (machining marks around the can); top-right square: the can head with a bolted rectangular manway
  const canTex=texC(256,256,(x,W,H)=>{const SW=124;for(let y=0;y<H;y++){const v=Math.round(rnd(200,250));x.fillStyle=`rgb(${v},${v},${v+3})`;x.fillRect(0,y,SW,1);}
    const g=x.createLinearGradient(0,0,SW,0);g.addColorStop(0,"rgba(255,255,255,0)");g.addColorStop(0.45,"rgba(255,255,255,0.35)");g.addColorStop(0.55,"rgba(255,255,255,0.35)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,SW,H);
    x.fillStyle="rgba(70,70,75,0.18)";x.fillRect(20,0,3,H);x.fillRect(82,0,2,H);x.fillStyle="rgba(140,110,70,0.25)";x.fillRect(0,0,SW,6);x.fillRect(0,H-6,SW,6);
    // head, drawn in the 128 x 128 square at the top right (canvas y 0..128)
    const cx=192,cy=64,R=63;x.fillStyle="#d9dadd";x.fillRect(128,0,128,128);
    const hg=x.createRadialGradient(cx-14,cy-14,4,cx,cy,R);hg.addColorStop(0,"#eef0f2");hg.addColorStop(1,"#c3c6cc");x.fillStyle=hg;x.beginPath();x.arc(cx,cy,R,0,7);x.fill();
    x.strokeStyle="rgba(60,64,72,0.55)";x.lineWidth=2;x.beginPath();x.arc(cx,cy,R-1.5,0,7);x.stroke();
    x.fillStyle="#4a4f58";for(let k=0;k<24;k++){const a=k/24*Math.PI*2;x.beginPath();x.arc(cx+Math.cos(a)*(R-6),cy+Math.sin(a)*(R-6),1.6,0,7);x.fill();}
    // journal hub
    x.fillStyle="#5a606a";x.beginPath();x.arc(cx,cy,13,0,7);x.fill();x.fillStyle="#2f333a";x.beginPath();x.arc(cx,cy,6,0,7);x.fill();
    x.fillStyle="#8a8f98";for(let k=0;k<8;k++){const a=k/8*Math.PI*2;x.beginPath();x.arc(cx+Math.cos(a)*10,cy+Math.sin(a)*10,1.3,0,7);x.fill();}
    // manway: a raised rectangular cover plate (~20% of the head) between the hub and the rim, bolted all round
    const mx=cx-26,my=cy+18,mw=52,mh=30;
    const RR=12,rp=(ox,oy,w,h,r)=>{x.beginPath();x.moveTo(ox+r,oy);x.arcTo(ox+w,oy,ox+w,oy+h,r);x.arcTo(ox+w,oy+h,ox,oy+h,r);x.arcTo(ox,oy+h,ox,oy,r);x.arcTo(ox,oy,ox+w,oy,r);x.closePath();};
    x.fillStyle="rgba(0,0,0,0.28)";rp(mx+2.5,my+2.5,mw,mh,RR);x.fill();
    const mg=x.createLinearGradient(mx,my,mx+mw,my+mh);mg.addColorStop(0,"#e7e9ec");mg.addColorStop(1,"#b4b8bf");x.fillStyle=mg;rp(mx,my,mw,mh,RR);x.fill();
    x.strokeStyle="#4a4f58";x.lineWidth=1.6;rp(mx+0.8,my+0.8,mw-1.6,mh-1.6,RR-0.8);x.stroke();x.strokeStyle="rgba(255,255,255,0.6)";x.lineWidth=1;rp(mx+2.4,my+2.4,mw-4.8,mh-4.8,RR-2.4);x.stroke();
    const bolt=(bx,by)=>{x.fillStyle="#3c4048";x.beginPath();x.arc(bx,by,1.9,0,7);x.fill();x.fillStyle="rgba(255,255,255,0.65)";x.beginPath();x.arc(bx-0.6,by-0.6,0.7,0,7);x.fill();};
    // bolts follow the rounded outline: evenly spaced along an inset path (straight runs and corner arcs)
    {const ins=5,ri=RR-ins,L0=mw-2*RR,L1=mh-2*RR,arc=Math.PI/2*ri,P=2*(L0+L1)+4*arc,n=20;
     const at=d=>{const segs=[[L0,t=>[mx+RR+t,my+ins]],[arc,t=>{const a=-Math.PI/2+t/ri;return [mx+mw-RR+Math.cos(a)*ri,my+RR+Math.sin(a)*ri];}],[L1,t=>[mx+mw-ins,my+RR+t]],[arc,t=>{const a=t/ri;return [mx+mw-RR+Math.cos(a)*ri,my+mh-RR+Math.sin(a)*ri];}],
       [L0,t=>[mx+mw-RR-t,my+mh-ins]],[arc,t=>{const a=Math.PI/2+t/ri;return [mx+RR+Math.cos(a)*ri,my+mh-RR+Math.sin(a)*ri];}],[L1,t=>[mx+ins,my+mh-RR-t]],[arc,t=>{const a=Math.PI+t/ri;return [mx+RR+Math.cos(a)*ri,my+RR+Math.sin(a)*ri];}]];
       for(const [len,f] of segs){if(d<=len)return f(d);d-=len;}return segs[0][1](0);};
     for(let k=0;k<n;k++){const [bx,by]=at(k*P/n);bolt(bx,by);}}
    x.fillStyle="#6b7079";x.fillRect(cx-9,my+mh/2-2.5,18,5);x.fillStyle="#9aa0a8";x.fillRect(cx-9,my+mh/2-2.5,18,1.5);},false);
  M.can=mat("g-metal",{map:canTex,metalness:0.4,roughness:0.32});
  // 9: steel tanks: plate courses with weld seams, staggered vertical welds, a stock tide line near the top with drips
  const tankTex=texC(256,128,(x,W,H)=>{x.fillStyle="#f6f6f4";x.fillRect(0,0,W,H);
    for(let k=0;k<600;k++){x.fillStyle=`rgba(120,120,118,${rnd(0.03,0.08)})`;x.fillRect(rnd(0,W),rnd(0,H),rnd(2,8),1);}
    const seamH=y=>{x.fillStyle="rgba(80,82,88,0.45)";x.fillRect(0,y,W,1.5);x.fillStyle="rgba(255,255,255,0.6)";x.fillRect(0,y+1.5,W,1);};
    const seamV=(px,y0,y1)=>{x.fillStyle="rgba(80,82,88,0.4)";x.fillRect(px,y0,1.5,y1-y0);x.fillStyle="rgba(255,255,255,0.5)";x.fillRect(px+1.5,y0,1,y1-y0);};
    [43,86].forEach(seamH);[[0,43,[40,168]],[43,86,[104,232]],[86,128,[40,168]]].forEach(([a,b,xs])=>xs.forEach(px=>seamV(px,a,b)));
    const g=x.createLinearGradient(0,10,0,24);g.addColorStop(0,"rgba(140,100,60,0)");g.addColorStop(0.5,"rgba(140,100,60,0.28)");g.addColorStop(1,"rgba(140,100,60,0)");x.fillStyle=g;x.fillRect(0,10,W,14);
    for(let k=0;k<14;k++){const px=rnd(0,W),len=rnd(8,40),gg=x.createLinearGradient(0,18,0,18+len);gg.addColorStop(0,"rgba(130,95,55,0.25)");gg.addColorStop(1,"rgba(130,95,55,0)");x.fillStyle=gg;x.fillRect(px,18,rnd(1,2.5),len);}},false);
  M.tank=mat("g-wall",{map:tankTex,roughness:0.55,metalness:0.1,side:THREE.DoubleSide});
  // 10: stock lines: a coupling band every 3 m and a flow arrow (the texture runs along each pipe in the direction of flow)
  const pipeTex=texC(64,96,(x,W,H)=>{x.fillStyle="#d4d4d4";x.fillRect(0,0,W,H);x.fillStyle="#9c9c9c";x.fillRect(0,0,W,5);x.fillStyle="#ffffff";x.fillRect(0,5,W,1.5);x.fillStyle="#bdbdbd";x.fillRect(0,H-2,W,2);
    x.fillStyle="#ffffff";x.beginPath();x.moveTo(32,26);x.lineTo(42,40);x.lineTo(35,40);x.lineTo(35,60);x.lineTo(29,60);x.lineTo(29,40);x.lineTo(22,40);x.closePath();x.fill();},true);
  M.pipeStock=mat("stock",{map:pipeTex,roughness:0.6});
  // 13: TEFC motors: cast cooling fins along the frame, a nameplate, conduit box shadow
  const motorTex=texC(256,64,(x,W,H)=>{x.fillStyle="#e2e2e2";x.fillRect(0,0,W,H);for(let k=0;k<32;k++){const px=k*8;x.fillStyle="#9a9a9a";x.fillRect(px,4,2.5,H-8);x.fillStyle="#ffffff";x.fillRect(px+2.5,4,1.2,H-8);}
    x.fillStyle="#bdbdbd";x.fillRect(0,0,W,4);x.fillRect(0,H-4,W,4);x.fillStyle="#f4f1e6";x.fillRect(52,22,26,18);x.strokeStyle="#6a6a6a";x.lineWidth=1;x.strokeRect(52.5,22.5,25,17);
    x.fillStyle="#7a7a7a";for(let k=0;k<4;k++)x.fillRect(55,26+k*3.4,k%2?14:19,1.2);},false);
  M.motor=mat("stock",{map:motorTex,roughness:0.5});
  // ribbed cladding for building walls
  const ribC=document.createElement("canvas");ribC.width=32;ribC.height=4;{const x=ribC.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,32,4);x.fillStyle="#e3e6ee";x.fillRect(0,0,4,4);x.fillStyle="#f1f3f8";x.fillRect(4,0,3,4);x.fillStyle="#d7dbe6";x.fillRect(28,0,4,4);}
  const ribTex=new THREE.CanvasTexture(ribC);ribTex.wrapS=ribTex.wrapT=THREE.RepeatWrapping;ribTex.colorSpace=THREE.SRGBColorSpace;
  function ribWall(w,hh,d,x,y,z,parent=scene){const len=Math.max(w,d),t=ribTex.clone();t.needsUpdate=true;t.repeat.set(len/0.55,1);
    const m=mat("g-wall",{map:t,roughness:0.8});const o=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);edges(o);
    const trim=new THREE.Mesh(new THREE.BoxGeometry(w+0.06,0.32,d+0.06),M.brand);trim.position.set(x,y+hh/2-0.13,z);/* cap sits 3 cm proud of the wall so their tops never share a plane */parent.add(trim);edges(trim);return o;}
  // strapped OCC bales and paper roll end-caps
  const baleC=document.createElement("canvas");baleC.width=64;baleC.height=64;{const x=baleC.getContext("2d");x.fillStyle="#b07a43";x.fillRect(0,0,64,64);
    for(let i=0;i<260;i++){x.fillStyle=Math.random()<0.5?"rgba(90,55,25,.18)":"rgba(255,235,200,.16)";x.fillRect(Math.random()*64,Math.random()*64,6+Math.random()*10,1.5);}
    x.fillStyle="#f4efe6";x.fillRect(16,0,3,64);x.fillRect(44,0,3,64);}
  const baleTex=new THREE.CanvasTexture(baleC);baleTex.colorSpace=THREE.SRGBColorSpace;
  M.bale=mat("panel",{map:gradeTex(0),roughness:0.95});
  // OCC bale grades: A is clean brown corrugated; B carries mixed paper; C is low grade with plastics, coated board and trash (more rejects)
  function gradeTex(g){const c=document.createElement("canvas");c.width=c.height=64;const x=c.getContext("2d");x.fillStyle=g===2?"#8f6a45":g===1?"#a7784a":"#b07a43";x.fillRect(0,0,64,64);
    // v3.2.1: crushed boxes in mixed kraft tones, a white-liner panel or two, scraps of print and corrugated flute edges
    {const tones=g===2?["#8a6440","#9a7048","#7d5a3a","#a57c52"]:["#b07a43","#c08a50","#9c6a3a","#c69a64","#a87445"];
     for(let k=0;k<16;k++){x.fillStyle=tones[k%tones.length];x.globalAlpha=0.7;x.fillRect(Math.random()*60-6,Math.random()*60-6,8+Math.random()*16,5+Math.random()*10);}
     x.globalAlpha=0.85;for(let k=0;k<(g===2?1:3);k++){x.fillStyle="#e9e3d6";x.fillRect(Math.random()*54,Math.random()*56,7+Math.random()*6,4+Math.random()*4);}
     const ink=["#2a5aa8","#c23b2b","#1f6b45","#2a2a2a"];for(let k=0;k<4;k++){const px=Math.random()*56,py=Math.random()*58;x.fillStyle=ink[k];x.globalAlpha=0.55;x.fillRect(px,py,6,1.4);x.fillRect(px,py+2.4,4,1.2);}
     x.globalAlpha=0.35;x.fillStyle="#5a3c20";for(let k=0;k<5;k++){const py=Math.random()*62,px=Math.random()*40;for(let f=0;f<14;f+=2)x.fillRect(px+f,py,1,1.6);}
     x.globalAlpha=1;}
    for(let i=0;i<220;i++){x.fillStyle=Math.random()<0.5?"rgba(90,55,25,.2)":"rgba(255,235,200,.15)";x.fillRect(Math.random()*64,Math.random()*64,6+Math.random()*10,1.5);}
    const bits=g===1?[["#e9e6df",14],["#c9c4ba",8],["#d23b3b",2],["#3a6fc9",2]]:[["#f2f0ea",22],["#cfd8e3",10],["#3a6fc9",8],["#f2c230",6],["#2a2a2a",6],["#d23b3b",5],["#9be0f0",8]];
    if(g)bits.forEach(([col,n])=>{for(let k=0;k<n;k++){x.fillStyle=col;x.globalAlpha=0.75+Math.random()*0.25;const w=3+Math.random()*(g===2?9:7),h=2+Math.random()*5;x.fillRect(Math.random()*64,Math.random()*64,w,h);}});x.globalAlpha=1;
    if(g===2){x.strokeStyle="rgba(220,235,245,.7)";x.lineWidth=1;for(let k=0;k<6;k++){x.beginPath();x.moveTo(Math.random()*64,Math.random()*64);x.quadraticCurveTo(Math.random()*64,Math.random()*64,Math.random()*64,Math.random()*64);x.stroke();}}
    x.fillStyle="rgba(40,25,10,.35)";x.fillRect(19,0,1.2,64);x.fillRect(47,0,1.2,64);x.fillStyle="#d9d6cf";x.fillRect(16,0,3,64);x.fillRect(44,0,3,64);x.fillStyle="#ffffff";x.fillRect(16.5,0,1,64);x.fillRect(44.5,0,1,64);
    x.fillStyle="rgba(28,34,51,.85)";x.fillRect(50,50,12,12);x.fillStyle="#ffffff";x.font="bold 11px system-ui,sans-serif";x.fillText("ABC"[g],52.5,60);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
  M.baleG=[0,1,2].map(g=>mat("panel",{map:g?gradeTex(g):(()=>{const t=gradeTex(0);return t;})(),roughness:0.95}));
  // three instanced meshes, one per grade, filled each frame through put(); counts follow automatically
  function graded(geo,n,opts={}){const ms=M.baleG.map(m=>{const o=new THREE.InstancedMesh(geo,m,n);o.castShadow=true;if(opts.recv)o.receiveShadow=true;o.count=0;scene.add(o);return o;});
    const k=[0,0,0];return {reset(){k[0]=k[1]=k[2]=0;},put(g,m4){if(k[g]<n)ms[g].setMatrixAt(k[g]++,m4);},done(){ms.forEach((o,i)=>{o.count=k[i];o.instanceMatrix.needsUpdate=true;});}};}
  const hsh2=n=>{const x=Math.sin(n*91.7+3.1)*43758.5453;return x-Math.floor(x);};
  // grade mix: mostly A and B; junk OCC deliveries swing it heavily toward C
  const gradeOf=(id,junk)=>{const r=hsh2(id);return junk?(r<0.2?0:r<0.5?1:2):(r<0.5?0:r<0.85?1:2);};
  const capC=document.createElement("canvas");capC.width=128;capC.height=128;
  function drawCap(){const x=capC.getContext("2d");x.fillStyle=tok("paperc");x.fillRect(0,0,128,128);
    x.strokeStyle="rgba(60,45,30,.22)";for(let r=18;r<62;r+=5){x.beginPath();x.arc(64,64,r,0,7);x.stroke();}x.fillStyle="#8c6a45";x.beginPath();x.arc(64,64,14,0,7);x.fill();x.fillStyle="#4e3a24";x.beginPath();x.arc(64,64,8,0,7);x.fill();}
  drawCap();
  const capTex=new THREE.CanvasTexture(capC);capTex.colorSpace=THREE.SRGBColorSpace;
  M.rollCap=mat("panel",{map:capTex,roughness:0.9});
  const ROLLM=[M.paper,M.rollCap,M.rollCap];
  // separate materials for instanced meshes that carry per-roll colors (a shared material can't serve meshes with and without instance colors)
  const ROLLC=()=>[M.paper.clone(),M.rollCap.clone(),M.rollCap.clone()];
  // trailer side graphics carry the mill name and brand color
  const trC=document.createElement("canvas");trC.width=512;trC.height=160;const trTex=new THREE.CanvasTexture(trC);trTex.colorSpace=THREE.SRGBColorSpace;trTex.anisotropy=4;
  function drawTrailer(){const x=trC.getContext("2d"),b=tok("brand");x.fillStyle="#ffffff";x.fillRect(0,0,512,160);x.fillStyle=b;x.fillRect(0,118,512,42);
    x.fillStyle=b;x.beginPath();x.arc(52,62,26,0,7);x.fill();x.fillStyle="#fff";x.beginPath();x.arc(52,62,9,0,7);x.fill();
    x.fillStyle=b;x.font='800 34px "Plus Jakarta Sans",system-ui,sans-serif';x.textBaseline="middle";let n=MILL.name;while(x.measureText(n).width>410&&n.length>4)n=n.slice(0,-2);
    if(n!==MILL.name)n=n.trim()+"…";x.fillText(n,92,62);trTex.needsUpdate=true;}
  M.trailer=new StdMat({map:trTex,roughness:0.6});
  // building signage
  const sgC=document.createElement("canvas");sgC.width=1024;sgC.height=128;const sgTex=new THREE.CanvasTexture(sgC);sgTex.colorSpace=THREE.SRGBColorSpace;sgTex.anisotropy=4;
  function drawSign(){const x=sgC.getContext("2d"),b=tok("brand");x.clearRect(0,0,1024,128);x.fillStyle=b;x.beginPath();x.arc(60,64,40,0,7);x.fill();x.fillStyle="#fff";x.beginPath();x.arc(60,64,14,0,7);x.fill();
    x.fillStyle=b;x.font='800 64px "Plus Jakarta Sans",system-ui,sans-serif';x.textBaseline="middle";x.fillText(MILL.name,120,66);sgTex.needsUpdate=true;}
  const signMat=new THREE.MeshBasicMaterial({map:sgTex,transparent:true});
  G3.rebrand=()=>{drawTrailer();drawSign();drawCap();capTex.needsUpdate=true;};

