/* ---------- 3D view (three.js r186) ---------- */
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
  // v4.2.3: ask the browser for its default GPU (on a laptop with two, the integrated one) unless the player pinned Ultra.
  // "high-performance" woke the discrete GPU on dual-GPU laptops for every player, which drains the battery much faster.
  // Phones have one GPU, so they're unaffected. Picking Ultra already offers a reload, which is when this takes effect.
  G3.gpuPref=(()=>{let g="";try{g=localStorage.getItem("paper-mill-gfx")||"";}catch(e){}const q=new URLSearchParams(location.search).get("gfx");if(q)g=q;return g==="ultra"?"high-performance":"default";})();
  try{renderer=new THREE.WebGLRenderer({canvas:glc,stencil:true,antialias:!matchMedia("(pointer: coarse)").matches&&(window.devicePixelRatio||1)<1.5,powerPreference:G3.gpuPref});}   // (v15: no MSAA on high-DPI screens, where the extra pixels already smooth edges)
  catch(e){no3D();return;}
  if(!renderer.getContext()){no3D();return;}
  // r150+ reads every shader's error log on first draw, which forces the GPU to finish compiling right then:
  // a multi-second freeze the first time upsets appear. The game's shaders are fixed, so skip the check and let
  // the start-up precompile (G3.prewarm) do the work up front as intended.
  renderer.debug.checkShaderErrors=false;
  G3.ok=true;
  /* v5.5 perf: three.js recomposes the local matrix of every auto-updating node on every frame (about 4,900 here: people
     and vehicle parts, effects built up front, overlays), then multiplies it with the parent's, whether or not anything
     moved. Skip the recompose when position, rotation and scale are unchanged since the last one; the world matrix is then
     recomputed only when a parent moved (three.js passes that down as "force"). Re-parenting clears the cache, so a node
     moved to another parent picks up its new world matrix on the next frame as before. */
  if(!THREE.Object3D.prototype.__pmMatrixSkip){const P=THREE.Object3D.prototype,um=P.updateMatrix,add=P.add,rem=P.remove;P.__pmMatrixSkip=true;
    /* v6.1 t6: an invisible object and everything under it skip the per-frame world-matrix pass (the game builds many effect,
       crew and civics groups up front and keeps them hidden: about a third of the scene). When one is shown again its
       matrices are brought up to date on that same pass (a changed local matrix, or a moved parent, still updates it), and
       getWorldPosition() updates on demand as before. */
    {const umw=P.updateMatrixWorld;P.updateMatrixWorld=function(force){if(!this.visible&&this.parent)return;return umw.call(this,force);};}
    P.updateMatrix=function(){const p=this.position,q=this.quaternion,s=this.scale;let c=this._mc;
      if(c!==undefined&&c[0]===p.x&&c[1]===p.y&&c[2]===p.z&&c[3]===q.x&&c[4]===q.y&&c[5]===q.z&&c[6]===q.w&&c[7]===s.x&&c[8]===s.y&&c[9]===s.z)return;
      if(c===undefined)c=this._mc=new Float64Array(10);c[0]=p.x;c[1]=p.y;c[2]=p.z;c[3]=q.x;c[4]=q.y;c[5]=q.z;c[6]=q.w;c[7]=s.x;c[8]=s.y;c[9]=s.z;um.call(this);};
    P.add=function(...a){for(const o of a)if(o&&o._mc)o._mc=undefined;return add.apply(this,a);};
    P.remove=function(...a){for(const o of a)if(o&&o._mc)o._mc=undefined;return rem.apply(this,a);};}
  const mobile=matchMedia("(pointer: coarse)").matches;
  /* v4.1 graphics tiers. Auto picks from the device (phones: Medium, or Low with little memory; desktops: High, or Ultra on a
     discrete GPU); the player can pin one in Controls. Pixel ratio, shadow refresh, shadow map size, weather particles and
     far-scenery shadows and the shadow softness change live; the lighting model and scenery density take effect on the next load. */
  // v15: px is each tier's budget of rendered pixels (drawing buffer); the pixel ratio is lowered to stay within it
  // v5.7.3 bare: the bones only. Flat unlit colours (one matcap), plain boxes, no shadows, nothing outside the fence but the
  // ground and roads, no sky, no ambient life, token upset effects, 30 FPS. Picked by the player only (Auto never), on reload.
  const GFX_TIERS={low:{pr:1,px:0.9e6,shadow:1024,soft:false,hz:10,scenery:0.5,wx:600,lambert:true,far:false},
    medium:{pr:1.25,px:1.6e6,shadow:1024,soft:false,hz:15,scenery:0.85,wx:1000,lambert:true,far:false},
    high:{pr:2,px:2.4e6,shadow:2048,soft:true,hz:24,scenery:1,wx:2000,lambert:true,far:false},
    ultra:{pr:2,px:4.2e6,shadow:4096,soft:true,hz:60,scenery:1.4,wx:2600,lambert:true,far:true}};   // (v6.1 t2: Lambert on every tier: the paper look needs no PBR)
  const gpuName=(()=>{try{const gl=renderer.getContext(),x=gl.getExtension("WEBGL_debug_renderer_info");return x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);}catch(e){return "";}})();
  // (v15: Auto no longer picks Ultra; desktops get High, held to a smaller pixel budget and 1024 shadows unless the GPU is
  // a known discrete one; Ultra is the player's choice)
  const discrete=/NVIDIA|GeForce|RTX|Radeon RX|Radeon Pro|Arc\(TM\)/i.test(gpuName)&&(navigator.hardwareConcurrency||4)>=8;
  const gfxAuto=mobile?((navigator.deviceMemory||4)<4?"low":"medium"):"high";
  let gfxPick="auto";try{gfxPick=localStorage.getItem("paper-mill-gfx")||"auto";}catch(e){}
  {const q=new URLSearchParams(location.search).get("gfx");if(q&&GFX_TIERS[q])gfxPick=q;}   // ?gfx=low|medium|high|ultra (tests)
  if(!GFX_TIERS[gfxPick])gfxPick="auto";
  const GFX=G3.GFX={...GFX_TIERS[gfxPick==="auto"?gfxAuto:gfxPick],tier:gfxPick==="auto"?gfxAuto:gfxPick,pick:gfxPick,auto:gfxAuto,gpu:String(gpuName).slice(0,60)};
  GFX.loaded=GFX.tier;const BARE=G3.bare=GFX.tier==="bare";if(gfxPick==="auto"&&!mobile&&!discrete){GFX.px=1.9e6;GFX.shadow=1024;}
  // the pixel ratio for a canvas of w x h CSS px: the tier's ratio, the screen's, and the pixel budget, whichever is lowest
  G3.prFor=(w,h)=>G3.prFixed||Math.max(0.75,Math.min(GFX.pr,window.devicePixelRatio||1,Math.sqrt(GFX.px/Math.max(1,w*h))));
  {const gl=renderer.getContext();G3.multiDraw=!!gl.getExtension("WEBGL_multi_draw");
    diag(`multi-draw: ${G3.multiDraw?"yes (a batch is one draw)":"NO (three.js draws each batched object separately)"} · antialias ${gl.getContextAttributes().antialias?"on":"off"} · GPU preference ${G3.gpuPref}`);}
  diag(`graphics: ${GFX.tier}${gfxPick==="auto"?" (auto)":""} on ${GFX.gpu||"unknown GPU"}`);
  renderer.setPixelRatio(G3.prFor(innerWidth,innerHeight));
  // the shadow pass redraws every shadow-casting object, so refresh it a few times a second instead of every frame (v2.8.4: desktop too)
  renderer.shadowMap.autoUpdate=false;G3.shadowHz=GFX.hz;
  // v2.8.4: round shapes get only as many sides as their size needs at this zoom (unit shapes that get scaled up keep 24)
  const segCap=(r,s)=>Math.max(3,Math.min(s,r===1?12:r<0.45?6:r<4?8:12));   // (v6.1 t7: 6-12 sides; tanks and rolls read as folded card)   // (v5.7.3: bare keeps round things to a few sides)
  class CylG extends THREE.CylinderGeometry{constructor(rt=1,rb=1,h=1,rs=32,hs=1,oe=false,ts=0,tl=Math.PI*2){super(rt,rb,h,segCap(Math.max(rt,rb),rs),hs,oe,ts,tl);}}
  class SphG extends THREE.SphereGeometry{constructor(r=1,ws=32,hs=16,...a){super(r,Math.max(3,Math.min(ws,8)),Math.max(2,Math.min(hs,6)),...a);}}
  class RingG extends THREE.RingGeometry{constructor(a=0.5,b=1,ts=32,...x){super(a,b,Math.max(3,Math.min(ts,16)),...x);}}
  class CircG extends THREE.CircleGeometry{constructor(r=1,sg=32,...x){super(r,Math.max(3,Math.min(sg,12)),...x);}}
  renderer.shadowMap.enabled=false;   /* v6.1 iso: no shadow maps; flat drop shadows instead (40c) */renderer.shadowMap.type=THREE.PCFShadowMap;   // (r186 dropped PCFSoft; the soft tiers widen the PCF kernel instead)
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const scene=new THREE.Scene();G3.scene=scene;G3.renderer=renderer;
  // v6.1 iso: workers, fork-trucks and delivery trucks are drawn as 2D cut-outs (42f); they stay out of the static merge
  const cutMark=(g,kind)=>{g.userData.cut=kind;if(G3.CUT&&G3.CUT.adopt)G3.CUT.adopt(g);if(G3.SM&&G3.SM.dyn)G3.SM.dyn.add(g);else (G3.dynLater||(G3.dynLater=[])).push(g);return g;};
  /* v6.1 iso: a fixed isometric orthographic camera. cam.r (29) still means "how far out": the view is as tall as a
     perspective camera with an 18 degree field would see at that distance, so every zoom number in the game keeps its meaning.
     The camera itself sits ISO_D back along the view line; fov and aspect are kept for the code that reads them. */
  const ISO_D=1200;
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,1,ISO_D*2.6);camera.fov=18;camera.aspect=16/9;camera.isIso=true;
  camera.isoFit=(rr)=>{const hh=rr*Math.tan(camera.fov*Math.PI/360),hw=hh*camera.aspect;
    if(camera.top!==hh||camera.right!==hw){camera.left=-hw;camera.right=hw;camera.top=hh;camera.bottom=-hh;camera.updateProjectionMatrix();}};

  /* ---- v6.1 t8: the paper palette ----
     One deliberate set of 40 colours for the whole mill and its scenery: a muted base of papers, krafts, slates and inks,
     natural greens, earths and waters, and a few strong accents (safety yellow, orange, alarm red, pipe blue, brick) that
     stand out because little else is saturated. Every lit material and every scenery colour snaps to its nearest swatch
     (in Lab, so "nearest" is what the eye sees); the mill's brand colour is the one colour kept exactly as chosen. */
  const PAPER_PAL=["#f6f1e6","#ece4d2","#d9cdb4","#c4b08c","#a8895f","#8a6a45","#e3e6ea","#c5cad1","#9aa2ad","#6f7884","#4a5260","#2f3540","#1f1a17",
    "#a9c4cf","#8fb3c9","#5f8aa8","#3e6787","#b9cf8f","#8fb36e","#5f8f55","#3f6b48","#2c4a36",
    "#f2c230","#e8823a","#d9534a","#a23b2e","#c98a4b","#e7b8a0",
    "#e8dbb6","#d8c9a2","#b9a27a","#7f6a4f","#5a4a3a","#6fa3b8","#4a7f9e",
    "#e9e7e1","#b8b4ab","#8c8a86","#6e6c69","#ffffff"];
  const PALQ=(()=>{const lab=h=>{const c=new THREE.Color(h);const f=v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);const r=f(c.r),g=f(c.g),b=f(c.b);
      let X=(r*0.4124+g*0.3576+b*0.1805)/0.95047,Y=r*0.2126+g*0.7152+b*0.0722,Z=(r*0.0193+g*0.1192+b*0.9505)/1.08883;const t=v=>v>0.008856?Math.cbrt(v):7.787*v+16/116;
      X=t(X);Y=t(Y);Z=t(Z);return [116*Y-16,500*(X-Y),200*(Y-Z)];};
    const P=PAPER_PAL.map(h=>[h,lab(h)]),cache=new Map();
    return hex=>{hex=String(hex).toLowerCase();let v=cache.get(hex);if(v)return v;const L=lab(hex);let best=P[0][0],bd=1e9;
      for(const [h,q] of P){const d=(L[0]-q[0])**2+(L[1]-q[1])**2+(L[2]-q[2])**2;if(d<bd){bd=d;best=h;}}cache.set(hex,best);return best;};})();
  G3.PAPER_PAL=PAPER_PAL;G3.palQ=PALQ;
  /* palette: every material is bound to a CSS token so theme switches recolor the scene */
  const MATS=[];
  // v2.9.0: phones get the much cheaper Lambert lighting model instead of physically based shading (same colours, flatter sheen)
  // v5.7.3 bare: every lit material becomes one unlit matcap material (a soft top-lit ball): flat colour with just enough
  // shading to tell a box's top from its sides, and no lights, shadows or fog in the shader
  let MCAP=null;
  function bareMat(o){const r={};for(const k of ["color","map","alphaMap","transparent","opacity","side","vertexColors","depthWrite","depthTest","alphaTest","polygonOffset","polygonOffsetFactor","polygonOffsetUnits","visible"])if(o&&o[k]!==undefined)r[k]=o[k];
    if(!MCAP){const c=document.createElement("canvas");c.width=c.height=64;const x=c.getContext("2d"),gr=x.createRadialGradient(26,20,4,32,32,34);gr.addColorStop(0,"#ffffff");gr.addColorStop(0.7,"#e6e6e6");gr.addColorStop(1,"#bdbdbd");x.fillStyle=gr;x.fillRect(0,0,64,64);
      MCAP=new THREE.CanvasTexture(c);MCAP.colorSpace=THREE.SRGBColorSpace;}
    r.matcap=MCAP;r.fog=false;return new THREE.MeshMatcapMaterial(r);}
  G3.bareMat=bareMat;
  function StdMat(o){if(BARE)return bareMat(o);if(!GFX.lambert)return new THREE.MeshStandardMaterial(o);const r=Object.assign({},o||{});delete r.roughness;delete r.metalness;delete r.flatShading;delete r.envMapIntensity;delete r.roughnessMap;delete r.metalnessMap;return new THREE.MeshLambertMaterial(r);}
  function tok(name){return getComputedStyle(document.documentElement).getPropertyValue("--"+name).trim()||"#888";}
  function mat(token,opts={}){const m=new StdMat(Object.assign({roughness:0.72,metalness:0.04,flatShading:false},opts));m.userData.token=token;MATS.push(m);return m;}
  // v4.1 pass 3: an InstancedMesh gets its own copy of a shared material (palette token kept, so brand colours still reach it):
  // three.js re-derives a material's shader parameters every time the same material switches between an instanced mesh and a
  // plain one, which cost about 6 re-derivations (24 KB of garbage) per frame on the bales, rolls and ink trim
  function instMat(m){if(Array.isArray(m))return m.map(instMat);const c=m.clone();c.userData=Object.assign({},m.userData);if(MATS.includes(m))MATS.push(c);return c;}
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
  sun.castShadow=false;const sz=GFX.shadow;sun.shadow.mapSize.set(sz,sz);
  Object.assign(sun.shadow.camera,{left:-90,right:90,top:60,bottom:-60,near:10,far:250});sun.shadow.bias=-0.0004;sun.shadow.radius=GFX.soft?5:3;sun.shadow.normalBias=0.04;
  /* v5.5 perf: three.js's PCF shadow lookup takes 5 rotated-disk samples per lit pixel. The soft tiers keep all 5; the
     phone tiers (no soft shadows anyway) take 3 (?taps=1|3|5 overrides for tests): a fifth of the pixel work on every
     shadow-receiving surface, for a slightly grainier edge that the phone's pixel density hides. Patched into the shader
     chunk before the start-up precompile, so no shader is rebuilt later. */
  {const q=new URLSearchParams(location.search).get("taps"),taps=GFX.taps=q?Math.max(1,Math.min(5,+q)):(GFX.soft?5:3);
    if(taps<5&&THREE.ShaderChunk&&/vogelDiskSample\( 0, 5, phi \)/.test(THREE.ShaderChunk.shadowmap_pars_fragment)){
      const c=THREE.ShaderChunk.shadowmap_pars_fragment,i0=c.indexOf("shadow = (\n\t\t\t\t\ttexture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi )"),i1=c.indexOf(") * 0.2;",i0);
      if(i0>0&&i1>i0){const lines=[];for(let k=0;k<taps;k++)lines.push(taps===1?"texture( shadowMap, vec3( shadowCoord.xy, shadowCoord.z ) )":`texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( ${k}, ${taps}, phi ) * radius, shadowCoord.z ) )`);
        THREE.ShaderChunk.shadowmap_pars_fragment=c.slice(0,i0)+"shadow = (\n\t\t\t\t\t"+lines.join(" +\n\t\t\t\t\t")+"\n\t\t\t\t"+`) * ${(1/taps).toFixed(6)};`+c.slice(i1+") * 0.2;".length);
        diag(`shadows: ${taps}-tap lookup`);}}}
  sun.target.position.set(-5,0,5);scene.add(sun,sun.target);
  let baseHemi=0.85,baseSun=0.9;

  /* helpers */
  const W=(x,y)=>[(x-600)/10,(y-330)/10];
  // v4.1 pass 3: a rounded box is 316 triangles at High/Ultra; phones get a coarser bevel (140 on Medium, 92 on Low), which
  // reads the same at phone size and takes a third off the static and moving batches
  const RB={},RBQ=GFX.tier==="low"?[1,2]:GFX.lambert?[2,2]:[3,4];
  function rboxGeo(w,h,d){const k=w+"|"+h+"|"+d;if(RB[k])return RB[k];const r=Math.min(0.16,Math.min(w,h,d)*0.2),s=new THREE.Shape(),ww=w-2*r,dd=d-2*r,c=Math.min(r*0.6,ww/2,dd/2);
    s.moveTo(-ww/2+c,-dd/2);s.lineTo(ww/2-c,-dd/2);s.quadraticCurveTo(ww/2,-dd/2,ww/2,-dd/2+c);s.lineTo(ww/2,dd/2-c);s.quadraticCurveTo(ww/2,dd/2,ww/2-c,dd/2);
    s.lineTo(-ww/2+c,dd/2);s.quadraticCurveTo(-ww/2,dd/2,-ww/2,dd/2-c);s.lineTo(-ww/2,-dd/2+c);s.quadraticCurveTo(-ww/2,-dd/2,-ww/2+c,-dd/2);
    const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(0.001,h-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:RBQ[0],curveSegments:RBQ[1]});
    g.rotateX(-Math.PI/2);g.translate(0,-(h-2*r)/2,0);g.computeVertexNormals();g.userData.shared=true;return RB[k]=g;}
  // v6.1 t7: plain boxes (12 triangles; a rounded box was 92-316), one shared geometry per size
  const BXG={};const boxGeo=(w,h,d)=>{const k=w+"|"+h+"|"+d;let g=BXG[k];if(!g){g=new THREE.BoxGeometry(w,h,d);g.userData.shared=true;BXG[k]=g;}return g;};
  function box(w,h,d,m,x,y,z,parent=scene,shadow=true){const o=new THREE.Mesh(boxGeo(w,h,d),m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;}
  function cylZ(r,len,m,x,y,z,seg=24,parent=scene){const g=new CylG(r,r,len,seg);g.rotateX(Math.PI/2);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const edgeSoft=new THREE.LineBasicMaterial({color:new THREE.Color("#3c4559").convertSRGBToLinear(),transparent:true,opacity:0.22});
  const edgeMat=new THREE.LineBasicMaterial({color:lin0("#3c4559"),transparent:true,opacity:0.42});
  function lin0(c){return new THREE.Color(c).convertSRGBToLinear();}
  function edges(o,mt=edgeMat,ang=25){if(BARE)return new THREE.Group();   /* (v5.7.3 bare: no outlines) */const e=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,ang),mt);o.add(e);return e;}
  const aoC=document.createElement("canvas");aoC.width=4;aoC.height=64;{const x=aoC.getContext("2d"),g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,"rgba(28,34,51,0.34)");g.addColorStop(0.35,"rgba(28,34,51,0.14)");g.addColorStop(1,"rgba(28,34,51,0)");x.fillStyle=g;x.fillRect(0,0,4,64);}
  const aoTex=new THREE.CanvasTexture(aoC);const aoMat=new THREE.MeshBasicMaterial({map:aoTex,transparent:true,depthWrite:false});
  const aoRC=document.createElement("canvas");aoRC.width=aoRC.height=128;{const x=aoRC.getContext("2d"),g=x.createRadialGradient(64,64,30,64,64,64);g.addColorStop(0,"rgba(28,34,51,0.38)");g.addColorStop(0.5,"rgba(28,34,51,0.16)");g.addColorStop(1,"rgba(28,34,51,0)");x.fillStyle=g;x.fillRect(0,0,128,128);}
  const aoRMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(aoRC),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  // soft darkening on the ground along a wall base: side = which side of the line gets it
  function skirt(x0,z0,x1,z1,w=1.8,parent=scene){const len=Math.hypot(x1-x0,z1-z0),p=new THREE.Mesh(new THREE.PlaneGeometry(len,w),aoMat);p.rotation.x=-Math.PI/2;
    const ang=Math.atan2(z1-z0,x1-x0);p.rotation.z=-ang;p.position.set((x0+x1)/2,0.035,(z0+z1)/2);p.userData.aoDecal=true;parent.add(p);return p;}
  function box2(x0,x1,z0,z1,w=1.8){skirt(x0,z0-w/2,x1,z0-w/2,w);skirt(x0,z1+w/2,x1,z1+w/2,w);skirt(x0-w/2,z0,x0-w/2,z1,w);skirt(x1+w/2,z0,x1+w/2,z1,w);}
  function blob(x,z,r){const p=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),aoRMat);p.rotation.x=-Math.PI/2;p.position.set(x,0.04,z);p.userData.aoDecal=true;scene.add(p);return p;}
  // (aoDecal: the static merge bakes these ground shadings into one mesh per material; as transparent planes they would be a draw each)
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

  const M={ground:mat("g-ground"),slab:mat("g-slab"),asphalt:mat("g-asphalt"),wall:mat("g-wall"),metal:mat("g-metal",{metalness:0.35,roughness:0.5}),
    kraft:mat("kraft"),stock:mat("stock"),paper:mat("paperc",{roughness:0.95}),ink:mat("ink"),warn:mat("warn"),ok:mat("ok"),bad:mat("bad"),
    lane:mat("g-lane"),glass:mat("g-wall",{transparent:true,opacity:0.3,depthWrite:false,side:THREE.DoubleSide,roughness:0.2}),robot:mat("stock",{roughness:0.4}),off:mat("smoke")};
  M.liquid=mat("pulp",{roughness:0.75});M.pulp=mat("pulp",{roughness:0.3});M.efork=mat("stock");
  M.steel=mat("g-frame",{metalness:0.25,roughness:0.55});M.brand=mat("brand",{roughness:0.55});M.fork=mat("g-fork",{roughness:0.5});M.wind=mat("g-glass",{roughness:0.2,metalness:0.3});
  M.robot=mat("brand",{roughness:0.4});
  // v4.1 pass 3: people. Skin, role hats (yellow operators, blue maintenance, white managers, green visitors) and hi-vis vests
  M.skin=mat("g-skin");M.hatBlue=M.stock;M.hatGreen=M.ok;   // (shared materials: no new batch looks)
  // (the orange keeps mat()'s roughness and metalness: a moving batch's look leaves out colour, so the vests share a batch)
  const HIVIS={orange:new StdMat({color:lin0("#ff7a1a"),roughness:0.72,metalness:0.04}),yellow:M.warn,band:M.metal};
  // one shared amber beacon material and the driver's head/hat shapes: a new material per vehicle would mean a new moving batch each
  M.beacon=new THREE.MeshBasicMaterial({color:lin0("#ff8a1f")});const DRV_HEAD=new SphG(1,8,6),DRV_HAT=new SphG(1,8,4,0,Math.PI*2,0,Math.PI/2);
  const HAT_DOME=new SphG(1,12,5,0,Math.PI*2,0,Math.PI/2),HAT_BRIM=new CylG(1,1,1,16);   // workers' hard hats (33)
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
  // v4.1 v20 surface wear: a second, coarser layer on the concrete (traffic lanes polished darker, tyre scuffs at the turns,
  // a few big stains), drawn over the 8 m tile above; and asphalt gets its own 32 m wear tile: tyre tracks, oil drips at
  // the stops, patched trenches, crack lines, sun-faded patches
  {const c=floorTex.image,x=c.getContext("2d"),W=c.width;
    for(let k=0;k<5;k++){x.strokeStyle=`rgba(70,68,64,${rnd(0.05,0.09)})`;x.lineWidth=rnd(2,4);x.beginPath();const cx=rnd(0,W),cy=rnd(0,W),r=rnd(30,80),a0=rnd(0,6.28);x.arc(cx,cy,r,a0,a0+rnd(0.8,1.8));x.stroke();}
    for(let k=0;k<4;k++){const cx=rnd(0,W),cy=rnd(0,W),r=rnd(10,26);const g2=x.createRadialGradient(cx,cy,0,cx,cy,r);g2.addColorStop(0,"rgba(70,62,52,0.13)");g2.addColorStop(1,"rgba(70,62,52,0)");x.fillStyle=g2;x.fillRect(0,0,W,W);}
    floorTex.needsUpdate=true;}
  const asphTex=texC(512,512,(x,W)=>{x.fillStyle="#f4f4f2";x.fillRect(0,0,W,W);
    for(let k=0;k<30;k++){const cx=rnd(0,W),cy=rnd(0,W),r=rnd(30,120),g=x.createRadialGradient(cx,cy,0,cx,cy,r),l=Math.random()<0.5;g.addColorStop(0,l?"rgba(255,255,250,0.14)":"rgba(40,40,44,0.13)");g.addColorStop(1,"rgba(128,128,128,0)");x.fillStyle=g;x.fillRect(0,0,W,W);}
    for(let k=0;k<9000;k++){const v=Math.random()<0.5?rnd(150,200):rnd(235,255);x.fillStyle=`rgba(${v},${v},${v},${rnd(0.15,0.4)})`;x.fillRect(rnd(0,W),rnd(0,W),1.2,1.2);}
    // tyre tracks: two worn bands along the lane, darker with rubber
    [W*0.3,W*0.7].forEach(y0=>{for(const o of [-14,14]){const g=x.createLinearGradient(0,y0+o-9,0,y0+o+9);g.addColorStop(0,"rgba(30,30,32,0)");g.addColorStop(0.5,"rgba(30,30,32,0.17)");g.addColorStop(1,"rgba(30,30,32,0)");x.fillStyle=g;x.fillRect(0,y0+o-9,W,18);}});
    // oil drips, patched trench, cracks
    for(let k=0;k<10;k++){const cx=rnd(0,W),cy=rnd(0,W),r=rnd(4,14),g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,"rgba(20,18,16,0.22)");g.addColorStop(1,"rgba(20,18,16,0)");x.fillStyle=g;x.fillRect(cx-r,cy-r,2*r,2*r);}
    x.fillStyle="rgba(30,30,34,0.10)";x.fillRect(rnd(0,W*0.6),rnd(0,W),rnd(90,200),rnd(14,24));x.fillRect(rnd(0,W),0,rnd(10,18),W);
    x.strokeStyle="rgba(25,25,28,0.22)";x.lineWidth=1.1;for(let k=0;k<9;k++){x.beginPath();let px=rnd(0,W),py=rnd(0,W);x.moveTo(px,py);for(let s2=0;s2<9;s2++){px+=rnd(-16,16);py+=rnd(-16,16);x.lineTo(px,py);}x.stroke();}},true);
  asphTex.repeat.set(0.25,0.25);M.asphalt.map=asphTex;M.asphalt.needsUpdate=true;
  // v20 roofs: galvanised steel sheet (not the brand colour): standing seams, a faded, dirt-streaked surface, rust runs
  // from the fixings and the odd replaced (brighter) panel; one 12 m tile
  const roofTex=texC(512,512,(x,W)=>{for(let i=0;i<W;i+=16){const v=Math.round(rnd(148,168));x.fillStyle=`rgb(${v},${v+4},${v+9})`;x.fillRect(i,0,16,W);x.fillStyle="rgba(255,255,255,0.18)";x.fillRect(i,0,2,W);x.fillStyle="rgba(0,0,0,0.12)";x.fillRect(i+14,0,2,W);}
    for(let k=0;k<3;k++){const i=Math.floor(rnd(0,W/16))*16;x.fillStyle="rgba(235,240,245,0.35)";x.fillRect(i+2,0,12,W);}
    for(let k=0;k<26;k++){const cx=rnd(0,W),cy=rnd(0,W),r=rnd(30,110),g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,`rgba(70,64,52,${rnd(0.08,0.18)})`);g.addColorStop(1,"rgba(70,64,52,0)");x.fillStyle=g;x.fillRect(0,0,W,W);}
    for(let k=0;k<40;k++){const px=Math.floor(rnd(0,W/16))*16+rnd(3,13),py=rnd(0,W),L=rnd(20,90),g=x.createLinearGradient(px,py,px,py+L);g.addColorStop(0,"rgba(140,70,30,0.35)");g.addColorStop(1,"rgba(140,70,30,0)");x.fillStyle=g;x.fillRect(px-1.5,py,3,L);}
    for(let k=0;k<3000;k++){x.fillStyle=`rgba(40,40,40,${rnd(0.03,0.1)})`;x.fillRect(rnd(0,W),rnd(0,W),1.5,1.5);}},true);
  roofTex.repeat.set(1/12,1/12);G3.roofTex=roofTex;
  // v20: flat roofs on the small buildings (gatehouse, scale house, intake, power house, office, booths): a grey membrane
  // with ponding stains and patched seams, instead of the trim colour
  const flatTex=texC(256,256,(x,W)=>{x.fillStyle="#8d9196";x.fillRect(0,0,W,W);for(let k=0;k<2500;k++){const v=rnd(110,175);x.fillStyle=`rgba(${v},${v},${v+4},0.5)`;x.fillRect(rnd(0,W),rnd(0,W),1.5,1.5);}
    for(let k=0;k<9;k++){const cx=rnd(0,W),cy=rnd(0,W),r=rnd(18,60),g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,"rgba(60,58,52,0.25)");g.addColorStop(1,"rgba(60,58,52,0)");x.fillStyle=g;x.fillRect(0,0,W,W);}
    x.strokeStyle="rgba(50,50,52,0.35)";x.lineWidth=2;for(let k=1;k<4;k++){x.beginPath();x.moveTo(0,k*W/4+rnd(-4,4));x.lineTo(W,k*W/4+rnd(-4,4));x.stroke();}
    x.fillStyle="rgba(40,40,42,0.25)";x.fillRect(rnd(20,120),rnd(20,120),rnd(40,90),rnd(30,60));},false);
  M.roofFlat=new StdMat({map:flatTex,roughness:0.9});M.roofFlat.color.set(0xffffff);
  G3.roofMat=()=>{const m=new StdMat({map:roofTex,transparent:true,roughness:0.62,metalness:0.3,side:THREE.DoubleSide});m.color.set(0xffffff);return m;};
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
  // v4.1 pass 3: one shared material; the rib pitch comes from each wall's own uvs (per face, along its length) instead of a
  // texture clone with its own repeat, so the 22 walls batch into one draw instead of 22
  const ribM=mat("g-wall",{map:ribTex,roughness:0.8});
  function ribWall(w,hh,d,x,y,z,parent=scene){const g=new THREE.BoxGeometry(w,hh,d),uv=g.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*((i<8?d:w)/0.55));   // faces 0-1 run along z, the rest along x
    const o=new THREE.Mesh(g,ribM);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);edges(o);
    const trim=new THREE.Mesh(new THREE.BoxGeometry(w+0.06,0.32,d+0.06),M.brand);trim.position.set(x,y+hh/2-0.13,z);/* cap sits 3 cm proud of the wall so their tops never share a plane */parent.add(trim);edges(trim);return o;}
  // strapped OCC bales and paper roll end-caps
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
  /* v5.5 perf: an InstancedMesh with count 0 draws nothing, but three.js still walks it, switches its program and refreshes
     its uniforms in every pass (about 10 of them per frame: bale and roll grades not on site). "visible" becomes an accessor
     that reads false while the mesh is empty; the game's own true/false goes on underneath and shows again with the first
     instance. (G3.emptyHide also runs over any InstancedMesh added later: 43-3d-frame.js) */
  G3.emptyHide=o=>{if(!o.isInstancedMesh||o.__emptyHide)return;o.__emptyHide=true;let v=o.visible;Object.defineProperty(o,"visible",{get(){return v&&this.count>0;},set(x){v=!!x;},configurable:true,enumerable:true});};
  // v6.1 t8: one instanced mesh per shape for all three grades (was one per grade, each with its own texture): the grade is
  // the bale's palette colour (A kraft, B lighter mixed paper, C grey-brown junk)
  /* v6.1 t10: an instanced set's data goes to the GPU only when it actually changed since the last upload (most of them were
     flagged every frame whether anything moved or not). n = instances in use. */
  G3.chg=(a,n)=>{if(!a)return false;const len=Math.min(a.array.length,(n==null?a.count:n)*a.itemSize),A=a.array;let c=a.__c;if(!c||c.length!==A.length)c=a.__c=new Float32Array(A.length).fill(NaN);
    let d=false;for(let i=0;i<len;i++)if(A[i]!==c[i]){d=true;break;}if(d){for(let i=0;i<len;i++)c[i]=A[i];a.needsUpdate=true;}return d;};
  const GRADE_COL=["#a8895f","#c4b08c","#7f6a4f"].map(h=>lin0(h));
  function graded(geo,n,opts={}){const m=new StdMat({color:0xffffff,roughness:0.95});const o=new THREE.InstancedMesh(geo,m,n);o.castShadow=true;if(opts.recv)o.receiveShadow=true;o.count=0;
    o.setColorAt(0,GRADE_COL[0]);scene.add(o);G3.emptyHide(o);let k=0;
    return {reset(){k=0;},put(g,m4){if(k<n){o.setMatrixAt(k,m4);o.setColorAt(k,GRADE_COL[g]||GRADE_COL[0]);k++;}},done(){o.count=k;G3.chg(o.instanceMatrix,k);G3.chg(o.instanceColor,k);}};}
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
  // v6.1 t8: the surface textures the paper look replaces with flat palette colour (40c paperize); animated or lettered ones are kept
  G3.decorTex=new Set([floorTex,asphTex,roofTex,flatTex,canTex,tankTex,pipeTex,motorTex,ribTex,capTex,...M.baleG.map(m=>m.map),M.bale.map].filter(Boolean));
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

