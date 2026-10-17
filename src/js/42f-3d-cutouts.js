  /* ---- v6.1 iso: 2D cut-outs for workers, fork-trucks and delivery trucks ----
     Only these three (userData.cut = "person", "lift" or "truck", set where they are built: 33 worker(), 27 forklift() and
     clamp3(), 26 makeTruck()). Everything else stays 3D.
     The camera never turns, so each of them is drawn as a flat card facing the camera: a picture of the 3D model taken once
     from the iso angle, with a paper edge and an ink line round it, packed into an atlas. A picture is taken the first time
     a look is needed: the model as it stands (pose, load, doors), one of 8 headings. The game keeps moving and posing the
     3D models as before, but they sit on a hidden layer (CUT_LAYER) and never reach the screen.
     Pictures: the model is moved into a small scene with daylight-fixed lights matching the main scene's light set (so no
     new shaders), drawn twice into a corner of the canvas (on black and on white, to recover its alpha), read back and
     finished in a 2D canvas, then copied into the atlas. At most CAP_N pictures a frame, before the main render.
     Cards update at 12 per second (stop-motion), each with an offset dark-paper drop shadow (40c's stencil, so it merges
     with the building shadows). One draw per atlas for the cards and one for their shadows. */
  {const CUT_LAYER=26,FPS=12,CAP_N=2,AW=2048,PAD=4,INK="#2b1d12",PAPERC="#fbf6ea";
   const KIND={person:{R:1.3,cy:1.0,ppm:36,at:0},lift:{R:2.0,cy:1.1,ppm:34,at:1},truck:{R:4.2,cy:1.4,ppm:30,at:1}};
   const CUT=G3.CUT={actors:[],cells:new Map(),queue:[],qset:new Set(),caps:0,full:0,t:0,ok:true};
   // --- atlases: a shelf packer over a 2048 square each ---
   function atlas(){const data=new Uint8Array(AW*AW*4);const t=new THREE.DataTexture(data,AW,AW,THREE.RGBAFormat,THREE.UnsignedByteType);
     t.flipY=false;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=4;t.needsUpdate=true;
     return {tex:t,rows:[],nextY:0,full:false};}
   function alloc(A,s){for(const r of A.rows)if(r.h===s&&r.x+s<=AW){const x=r.x;r.x+=s+PAD;return [x,r.y];}
     if(A.nextY+s>AW){A.full=true;return null;}const r={y:A.nextY,h:s,x:s+PAD};A.nextY+=s+PAD;A.rows.push(r);return [0,r.y];}
   const ATL=[atlas(),atlas()];
   // --- the card material: atlas colour, cut at the paper edge; shadows are the same cards in dark paper ---
   const aa=renderer.getContext().getContextAttributes().antialias;
   const VS=`attribute vec4 aRect;varying vec2 vUv;void main(){vUv=vec2(aRect.x+uv.x*aRect.z,aRect.y+(1.0-uv.y)*aRect.w);
     gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`;
   const FS=`uniform sampler2D map;uniform float uLit;uniform float uCut;varying vec2 vUv;void main(){vec4 c=texture2D(map,vUv);if(c.a<uCut)discard;
     gl_FragColor=vec4(c.rgb*uLit,c.a);}`;
   const FSS=`uniform sampler2D map;uniform vec3 uCol;uniform float uA;varying vec2 vUv;void main(){vec4 c=texture2D(map,vUv);if(c.a<0.5)discard;gl_FragColor=vec4(uCol,uA);}`;
   const lit={value:1};
   const GEO=new THREE.PlaneGeometry(1,1);
   const sets=ATL.map((A,i)=>{const N=i?96:420,rect=new THREE.InstancedBufferAttribute(new Float32Array(N*4),4);rect.setUsage(THREE.DynamicDrawUsage);
     const g1=GEO.clone();g1.setAttribute("aRect",rect);const g2=GEO.clone();g2.setAttribute("aRect",rect);
     const m1=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:FS,uniforms:{map:{value:A.tex},uLit:lit,uCut:{value:aa?0.04:0.5}},alphaToCoverage:aa,fog:false,toneMapped:false});
     const dc=new THREE.Color(G3.DROP?G3.DROP.col:"#2e2433");
     const m2=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:FSS,uniforms:{map:{value:A.tex},uCol:{value:new THREE.Vector3(dc.r,dc.g,dc.b)},uA:{value:G3.DROP?G3.DROP.op:0.36}},
       transparent:true,depthWrite:false,fog:false,toneMapped:false,
       stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilZPass:THREE.ReplaceStencilOp,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp});
     const card=new THREE.InstancedMesh(g1,m1,N),shad=new THREE.InstancedMesh(g2,m2,N);
     [card,shad].forEach((o,k)=>{o.count=0;o.frustumCulled=false;o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);o.userData.smBatch=true;o.renderOrder=k?1:0;o.name=k?"cut-out shadows":"cut-outs";scene.add(o);});
     return {N,rect,card,shad};});
   // --- the picture-taking scene: same light types and counts as the main scene, fixed daylight ---
   const cs=new THREE.Scene(),ch=new THREE.HemisphereLight(0xffffff,0x888888,0.5*LEG),cd=new THREE.DirectionalLight(0xfff4e6,1.4*LEG),cp=new THREE.PointLight(0xff7a1f,0,45,0);
   cs.add(ch,cd,cd.target,cp);[ch,cd,cp].forEach(l=>l.layers.enable(CUT_LAYER));cp.position.set(0,-500,0);
   const cc=new THREE.OrthographicCamera(-1,1,1,-1,1,400);cc.layers.set(0);cc.layers.enable(CUT_LAYER);cc.layers.enable(30);
   // view direction (unit, from the target toward the camera) and screen right/up, from the fixed main camera
   const toCam=new THREE.Vector3(),cRight=new THREE.Vector3(),cUp=new THREE.Vector3();
   function basis(){camera.updateMatrixWorld();const e=camera.matrixWorld.elements;cRight.set(e[0],e[1],e[2]).normalize();cUp.set(e[4],e[5],e[6]).normalize();toCam.set(e[8],e[9],e[10]).normalize();}
   // --- finding them: anything built with userData.cut, rescanned every 2 s (pools grow during play) ---
   function rescan(){const seen=new Set(CUT.actors.map(a=>a.o));scene.traverse(o=>{if(o.userData&&o.userData.cut&&KIND[o.userData.cut]&&!seen.has(o)){
       let up=o.parent,nested=false;for(;up&&up!==scene;up=up.parent)if(up.userData&&up.userData.cut){nested=true;break;}   // (a driver inside a truck is part of the truck)
       if(!nested)CUT.actors.push({o,kind:o.userData.cut,K:KIND[o.userData.cut],cell:null,hid:false,hT:0});}});}
   const shown=o=>{for(let x=o;x;x=x.parent){if(!x.visible)return false;if(x===scene)return true;}return false;};
   function hide(a,on){a.o.traverse(c=>{if(c.isMesh||c.isLine||c.isPoints){const want=on?CUT_LAYER:0;if(on?c.layers.mask!==1<<CUT_LAYER:c.layers.mask===1<<CUT_LAYER)c.layers.set(want);}});a.hid=on;}
   // the look of one actor right now: every node's visibility and material, and its moving parts in coarse steps
   const q=(v,s)=>Math.round(v/s);
   function lookKey(a){const o=a.o,u=o.userData;let k=a.kind+":";o.traverse(c=>{if(c===o)return;k+=c.visible?(c.isMesh&&c.material?c.material.id.toString(36):"v"):"-";});
     if(a.kind==="person"&&u.legs){k+="|"+q(u.legs[0].rotation.z,0.45)+","+q(u.arms[0].rotation.z,0.45)+","+q(u.arms[1].rotation.z,0.45)+","+q(u.arms[1].rotation.x,0.9)+","+q(u.torso.rotation.z,0.3)+","+q(u.armM?u.armM[1].scale.y:1,0.3)+(u.tool&&u.tool.visible?","+q(u.tool.rotation.x,0.6):"");}
     else if(a.kind==="lift"&&u.load)k+="|"+q(u.load.position.y,0.3);
     else if(a.kind==="truck")k+="|"+(u.doorL?q(u.doorL.rotation.y,0.6)+","+q(u.doorR.rotation.y,0.6):"");
     return k;}
   const _m=new THREE.Matrix4(),_p=new THREE.Vector3();
   function heading(o){const e=o.matrixWorld.elements;return (((Math.round(Math.atan2(-e[2],e[0])/(Math.PI/4))%8)+8)%8);}
   // --- taking one picture ---
   const gl=renderer.getContext();let bufK=null,bufW=null;
   const cvO=document.createElement("canvas"),cvS=document.createElement("canvas"),cvC=document.createElement("canvas");
   function finish(px){   // black/white pair -> straight-alpha picture with a paper edge and an ink line, in cvC
     const id=new ImageData(px,px),d=id.data;
     for(let y=0;y<px;y++){const ry=(px-1-y)*px*8,wy=ry+px*4,o0=y*px*4;   // (read back bottom-up: black in the left half, white in the right)
       for(let x=0;x<px;x++){const ib=ry+x*4,iw=wy+x*4,o=o0+x*4;const kb=bufK[ib],kg=bufK[ib+1],kbb=bufK[ib+2];
         const al=1-((bufK[iw]-kb)+(bufK[iw+1]-kg)+(bufK[iw+2]-kbb))/765;
         if(al<=0.004){d[o+3]=0;continue;}d[o]=Math.min(255,kb/al);d[o+1]=Math.min(255,kg/al);d[o+2]=Math.min(255,kbb/al);d[o+3]=Math.round(Math.min(1,al)*255);}}
     cvO.width=cvO.height=cvS.width=cvS.height=cvC.width=cvC.height=px;cvO.getContext("2d").putImageData(id,0,0);
     const xs=cvS.getContext("2d"),xc=cvC.getContext("2d");xc.clearRect(0,0,px,px);
     const sil=col=>{xs.globalCompositeOperation="copy";xs.drawImage(cvO,0,0);xs.globalCompositeOperation="source-in";xs.fillStyle=col;xs.fillRect(0,0,px,px);xs.globalCompositeOperation="source-over";};
     const ring=(r,n)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2,rr=r*(0.86+0.14*Math.sin(i*2.7+px));xc.drawImage(cvS,Math.cos(a)*rr,Math.sin(a)*rr);}};   // (a slightly uneven line: cut by hand)
     sil(INK);ring(3.1,16);sil(PAPERC);ring(1.9,12);xc.drawImage(cvO,0,0);}
   function capture(a,key,dir,A){const K=a.K,s=Math.round(2*K.R*K.ppm),cw=renderer.domElement.width,chh=renderer.domElement.height,px=Math.min(s,Math.floor(cw/2)-2,chh-2);if(px<24)return null;
     const at=alloc(A,px);if(!at)return null;
     const o=a.o,par=o.parent,p0=o.position.clone(),ry=o.rotation.y,vis=o.visible;
     // pose it at the origin of the picture scene, facing heading dir
     cs.add(o);o.position.set(0,0,0);o.rotation.y=dir*Math.PI/4;o.visible=true;o.updateMatrixWorld(true);
     cs.fog=scene.fog;   // (the same fog object: fog is part of the shader, and the picture is far nearer than it starts)
     ch.color.copy(hemi.color);ch.groundColor.copy(hemi.groundColor);cd.color.copy(sun.color);cd.position.copy(sun.position).sub(sun.target.position);cd.target.position.set(0,0,0);cd.updateMatrixWorld();cd.target.updateMatrixWorld();
     cc.left=-K.R;cc.right=K.R;cc.top=K.R;cc.bottom=-K.R;cc.updateProjectionMatrix();cc.position.set(0,K.cy,0).addScaledVector(toCam,150);cc.quaternion.copy(camera.quaternion);cc.updateMatrixWorld();
     const pr=renderer.getPixelRatio(),cl=renderer.getClearColor(new THREE.Color()),ca=renderer.getClearAlpha(),ac=renderer.autoClear,bg=cs.background;
     renderer.autoClear=false;renderer.setRenderTarget(null);renderer.setScissorTest(true);
     [[0,0x000000],[px,0xffffff]].forEach(([x0,col])=>{renderer.setViewport(x0/pr,0,px/pr,px/pr);renderer.setScissor(x0/pr,0,px/pr,px/pr);renderer.setClearColor(col,1);renderer.clear(true,true,false);renderer.render(cs,cc);});
     if(!bufK||bufK.length<px*px*8)bufK=new Uint8Array(px*px*8);
     gl.readPixels(0,0,px*2,px,gl.RGBA,gl.UNSIGNED_BYTE,bufK);
     renderer.setScissorTest(false);const sz=renderer.getSize(new THREE.Vector2());renderer.setViewport(0,0,sz.x,sz.y);renderer.setClearColor(cl,ca);renderer.autoClear=ac;
     // put it back exactly as it was
     if(par)par.add(o);else cs.remove(o);o.position.copy(p0);o.rotation.y=ry;o.visible=vis;o.updateMatrixWorld(true);
     finish(px);
     const src=new THREE.DataTexture(new Uint8Array(cvC.getContext("2d").getImageData(0,0,px,px).data.buffer),px,px,THREE.RGBAFormat,THREE.UnsignedByteType);
     renderer.copyTextureToTexture(src,A.tex,null,new THREE.Vector2(at[0],at[1]));src.dispose();
     CUT.caps++;return {r:[at[0]/AW,at[1]/AW,px/AW,px/AW],a:K.at,w:2*K.R};}
   // --- every frame (43-3d-frame.js, after the moving batches, before the render) ---
   let scanT=0;
   G3.cutTick=now=>{if(!CUT.ok)return;try{
     if(now>scanT){scanT=now+2000;rescan();}
     // pictures still owed, oldest first (CAP_N a frame)
     let n=0;while(CUT.queue.length&&n<CAP_N){const [a,key,dir]=CUT.queue.shift();CUT.qset.delete(key);if(CUT.cells.has(key)||!shown(a.o))continue;
       const A=ATL[a.K.at];if(A.full){CUT.full++;continue;}if(!n)basis();const c=capture(a,key,dir,A);n++;if(c)CUT.cells.set(key,c);}
     if(now<CUT.t)return;CUT.t=now+1000/FPS;basis();
     {const k=G3.nightK!=null?G3.nightK:0;lit.value=1-0.62*k;}
     const cnt=[0,0];
     for(const a of CUT.actors){const o=a.o;if(!shown(o)){continue;}
       const dir=heading(o),look=lookKey(a),key=look+"#"+dir;let c=CUT.cells.get(key);
       if(!c){if(!CUT.qset.has(key)){CUT.qset.add(key);CUT.queue.push([a,key,dir]);}c=a.cell;}
       if(!c){if(a.hid)hide(a,false);continue;}   // never pictured yet: the 3D model stays for a frame or two
       a.cell=c;if(!a.hid||now>a.hT){a.hT=now+1000;hide(a,true);}   // (re-checked every second: pools add parts later)
       const S2=sets[c.a],i=cnt[c.a];if(i>=S2.N)continue;cnt[c.a]++;
       o.getWorldPosition(_p);_p.y+=a.K.cy;_p.addScaledVector(toCam,a.K.R);
       _m.makeRotationFromQuaternion(camera.quaternion).scale(_v3.set(c.w,c.w,1)).setPosition(_p);S2.card.setMatrixAt(i,_m);
       const off=c.w*0.05;_p.addScaledVector(cRight,off).addScaledVector(cUp,-off*0.8).addScaledVector(toCam,-0.02);_m.setPosition(_p);S2.shad.setMatrixAt(i,_m);
       S2.rect.setXYZW(i,c.r[0],c.r[1],c.r[2],c.r[3]);}
     sets.forEach((S2,i)=>{S2.card.count=S2.shad.count=cnt[i];S2.card.instanceMatrix.needsUpdate=S2.shad.instanceMatrix.needsUpdate=true;S2.rect.needsUpdate=true;S2.shad.visible=!G3.shadowsOff;});
   }catch(e){CUT.ok=false;console.error("cut-outs failed",e);diag("cut-outs: failed, 3D models back: "+String(e&&e.message||e).slice(0,120));CUT.actors.forEach(a=>hide(a,false));sets.forEach(S2=>{S2.card.visible=S2.shad.visible=false;});}};
   const _v3=new THREE.Vector3();
   CUT.stats=()=>({actors:CUT.actors.length,cells:CUT.cells.size,caps:CUT.caps,queue:CUT.queue.length,full:CUT.full,rows:ATL.map(A=>A.nextY)});}
