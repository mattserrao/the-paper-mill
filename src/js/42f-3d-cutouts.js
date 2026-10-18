  /* ---- v6.1 iso: 2D cut-outs for workers, fork-trucks and delivery trucks ----
     Only these three (userData.cut = "person", "lift" or "truck", set where they are built: 33 worker(), 27 forklift() and
     clamp3(), 26 makeTruck()). Everything else stays 3D.
     The camera never turns, so each of them is drawn as a flat card facing the camera: a picture of the 3D model taken once
     from the iso angle, with a paper edge and an ink line round it, packed into an atlas. A picture is taken the first time
     a look is needed: the model as it stands (pose, load, doors), one of 8 headings. The game keeps moving and posing the
     3D models as before, but they sit on a hidden layer (CUT_LAYER) and never reach the screen.
     Pictures (v6.1 t2, all on the GPU, nothing read back): the model is moved into a small scene with daylight-fixed lights
     matching the main scene's light set, drawn into a small float render target (RT_A, 4x MSAA where WebGL2 allows), then a
     finishing pass draws it into its atlas cell (the atlas is a render target too): the same ACES tone mapping and sRGB
     encoding the screen uses, plus the paper edge and a slightly uneven ink line grown from its alpha. The t1 version read
     each picture back to the CPU (gl.readPixels), which stalled the GPU for every picture. At most CAP_N pictures a frame.
     Cards update at 12 per second (stop-motion), each with an offset dark-paper drop shadow (40c's stencil, so it merges
     with the building shadows). One draw per atlas for the cards and one for their shadows. */
  {const CUT_LAYER=26,FPS=15,CAP_N=1,CAP_BURST=4,AW=2048,AH=1024,PAD=4,INK="#2b1d12",PAPERC="#fbf6ea";
   const KIND={person:{R:1.3,cy:1.0,ppm:36,at:0},lift:{R:2.0,cy:1.1,ppm:34,at:1},truck:{R:4.2,cy:1.4,ppm:30,at:1}};
   const CUT=G3.CUT={actors:[],cells:new Map(),byKD:new Map(),byK:new Map(),queue:[],qset:new Set(),caps:0,full:0,resets:0,errs:0,t:0,ok:true,burst:0};
   // --- atlases: a shelf packer over a 2048 square each ---
   function atlas(){const rt=new THREE.WebGLRenderTarget(AW,AH,{depthBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter});
     rt.texture.anisotropy=4;rt.scissorTest=true;return {rt,tex:rt.texture,rows:[],nextY:0,full:false};}
   function alloc(A,s){for(const r of A.rows)if(r.h===s&&r.x+s<=AW){const x=r.x;r.x+=s+PAD;return [x,r.y];}
     if(A.nextY+s>AH){A.full=true;return null;}const r={y:A.nextY,h:s,x:s+PAD};A.nextY+=s+PAD;A.rows.push(r);return [0,r.y];}
   const ATL=[atlas(),atlas()];CUT.atl=ATL;
   // --- the card material: atlas colour, cut at the paper edge; shadows are the same cards in dark paper ---
   const aa=renderer.getContext().getContextAttributes().antialias;
   const VS=`attribute vec4 aRect;varying vec2 vUv;void main(){vUv=vec2(aRect.x+uv.x*aRect.z,aRect.y+uv.y*aRect.w);
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
   const LSC=0.5;   // (v6.1 t4: the picture is lit at half strength into an 8-bit target and doubled again in the finishing pass, so highlights up to 2x don't clip)
   const cs=new THREE.Scene(),ch=new THREE.HemisphereLight(0xffffff,0x888888,0.5*LEG*LSC),cd=new THREE.DirectionalLight(0xfff4e6,1.4*LEG*LSC),cp=new THREE.PointLight(0xff7a1f,0,45,0);
   cs.add(ch,cd,cd.target,cp);[ch,cd,cp].forEach(l=>l.layers.enable(CUT_LAYER));cp.position.set(0,-500,0);
   const cc=new THREE.OrthographicCamera(-1,1,1,-1,1,400);cc.layers.set(0);cc.layers.enable(CUT_LAYER);cc.layers.enable(30);
   // view direction (unit, from the target toward the camera) and screen right/up, from the fixed main camera
   const toCam=new THREE.Vector3(),cRight=new THREE.Vector3(),cUp=new THREE.Vector3();
   function basis(){camera.updateMatrixWorld();const e=camera.matrixWorld.elements;cRight.set(e[0],e[1],e[2]).normalize();cUp.set(e[4],e[5],e[6]).normalize();toCam.set(e[8],e[9],e[10]).normalize();}
   // --- finding them: anything built with userData.cut, rescanned every 2 s (pools grow during play) ---
   function rescan(){const seen=new Set(CUT.actors.map(a=>a.o));scene.traverse(o=>{if(o.userData&&o.userData.cut&&KIND[o.userData.cut]&&!seen.has(o)){
       let up=o.parent,nested=false;for(;up&&up!==scene;up=up.parent)if(up.userData&&up.userData.cut){nested=true;break;}   // (a driver inside a truck is part of the truck)
       if(!nested){const a={o,kind:o.userData.cut,K:KIND[o.userData.cut],cell:null,hid:false,hT:0};CUT.actors.push(a);if(CUT.ok)hide(a,true);   // (t6: hidden at once, so the moving batches never track them)
         // v6.1 t3: the hidden model's parts no longer get their world matrices every frame (about 2,000 nodes); a picture
         // forces them (updateMatrixWorld(true)) and getWorldPosition still works, only the root is kept current
         o.children.forEach(c=>{c.matrixWorldAutoUpdate=false;});}}});}
   const shown=o=>{for(let x=o;x;x=x.parent){if(!x.visible)return false;if(x===scene)return true;}return false;};
   function hide(a,on){a.o.traverse(c=>{if(c.isMesh||c.isLine||c.isPoints){const want=on?CUT_LAYER:0;if(on?c.layers.mask!==1<<CUT_LAYER:c.layers.mask===1<<CUT_LAYER)c.layers.set(want);}});a.hid=on;}
   // the look of one actor right now: every node's visibility and material, and its moving parts in coarse steps
   const q=(v,s)=>Math.round(v/s);CUT.POSE={leg:0.8,arm:1.0,lean:0.5,tool:0.7};CUT.free=/[?&]cutfree/.test(location.search);   // (t10: pose frames, 33)
   function lookKey(a){const o=a.o,u=o.userData;let k=a.kind+":";o.traverse(c=>{if(c===o)return;const mt=c.material;k+=c.visible?(c.isMesh&&mt?(Array.isArray(mt)?mt.map(x=>x.id.toString(36)).join("."):mt.id.toString(36)):"v"):"-";});
     if(a.kind==="person"&&u.legs){const P=CUT.POSE;k+="|"+q(u.legs[0].rotation.z,P.leg)+","+q(u.arms[0].rotation.z,P.arm)+","+q(u.arms[1].rotation.z,P.arm)+","+q(u.arms[1].rotation.x,0.9)+","+q(u.torso.rotation.z,P.lean)+","+q(u.armM?u.armM[1].scale.y:1,0.3)+(u.tool&&u.tool.visible?","+q(u.tool.rotation.x,P.tool):"");}
     else if(a.kind==="lift"&&u.load)k+="|"+q(u.load.position.y,0.3);
     else if(a.kind==="truck")k+="|"+(u.doorL?q(u.doorL.rotation.y,0.6)+","+q(u.doorR.rotation.y,0.6):"");
     return k;}
   const _m=new THREE.Matrix4(),_p=new THREE.Vector3();
   function heading(o){const e=o.matrixWorld.elements;return (((Math.round(Math.atan2(-e[2],e[0])/(Math.PI/4))%8)+8)%8);}
   // --- taking one picture ---
   const RTS=256,gl2=renderer.capabilities.isWebGL2!==false;
   const hf=!!(renderer.extensions.has("EXT_color_buffer_half_float")||renderer.extensions.has("EXT_color_buffer_float"));
   const RT_A=new THREE.WebGLRenderTarget(RTS,RTS,{type:THREE.UnsignedByteType,   /* (v6.1 t4: 8-bit everywhere; a half-float MSAA target isn't renderable on every phone) */samples:gl2?4:0,generateMipmaps:false,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
   RT_A.scissorTest=true;
   const finU={src:{value:RT_A.texture},uScale:{value:1},uPx:{value:64},uExp:{value:renderer.toneMappingExposure},uInk:{value:new THREE.Color(INK)},uPaper:{value:new THREE.Color(PAPERC)}};
   const fin=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:finU,depthTest:false,depthWrite:false,blending:THREE.NoBlending,toneMapped:false,fog:false,
     vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}",
     fragmentShader:`uniform sampler2D src;uniform float uScale,uPx,uExp;uniform vec3 uInk,uPaper;varying vec2 vUv;
       vec3 RRT(vec3 v){vec3 a=v*(v+0.0245786)-0.000090537;vec3 b=v*(0.983729*v+0.4329510)+0.238081;return a/b;}
       vec3 aces(vec3 c){const mat3 I=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));
         const mat3 O=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));c*=uExp/0.6;return clamp(O*RRT(I*c),0.0,1.0);}
       vec3 srgb(vec3 c){return mix(pow(c,vec3(0.41666))*1.055-vec3(0.055),c*12.92,vec3(lessThanEqual(c,vec3(0.0031308))));}
       float ringA(vec2 uv,float r,int n){float m=0.0;for(int i=0;i<16;i++){if(i>=n)break;float a=float(i)/float(n)*6.2831853;float rr=r*(0.86+0.14*sin(float(i)*2.7+uPx));
         vec2 q=uv+vec2(cos(a),sin(a))*rr/uPx;if(q.x>=0.0&&q.y>=0.0&&q.x<=1.0&&q.y<=1.0)m=max(m,texture2D(src,q*uScale).a);}return m;}
       void main(){vec4 o=texture2D(src,vUv*uScale);float ink=ringA(vUv,3.1,16),pap=ringA(vUv,1.9,12);
         vec3 c=o.a>0.004?srgb(aces(o.rgb/o.a/0.5)):vec3(0.0);
         vec3 col=mix(mix(uInk,uPaper,pap),c,o.a);float A=max(max(ink,pap),o.a);gl_FragColor=vec4(A>0.0?col:vec3(0.0),A);}`}));
   fin.frustumCulled=false;const finS=new THREE.Scene();finS.add(fin);const finC=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
   function capture(a,key,dir,A,mips){const K=a.K,px=Math.min(RTS-8,Math.round(2*K.R*K.ppm));
     const at=alloc(A,px);if(!at)return null;
     const o=a.o,par=o.parent,p0=o.position.clone(),ry=o.rotation.y,vis=o.visible;
     const cl=renderer.getClearColor(new THREE.Color()),ca=renderer.getClearAlpha(),ac=renderer.autoClear,rt0=renderer.getRenderTarget();
     o.children.forEach(c=>{c.matrixWorldAutoUpdate=true;});   // (t4: the frozen parts must follow the model into the picture; t3 drew them where they stood in the mill, so every picture came out empty)
     try{cs.add(o);o.position.set(0,0,0);o.rotation.y=dir*Math.PI/4;o.visible=true;o.updateMatrixWorld(true);
       cs.fog=scene.fog;   // (the same fog object: fog is part of the shader, and the picture is far nearer than it starts)
       ch.color.copy(hemi.color);ch.groundColor.copy(hemi.groundColor);cd.color.copy(sun.color);cd.position.copy(sun.position).sub(sun.target.position);cd.target.position.set(0,0,0);cd.updateMatrixWorld();cd.target.updateMatrixWorld();
       cc.left=-K.R;cc.right=K.R;cc.top=K.R;cc.bottom=-K.R;cc.updateProjectionMatrix();cc.position.set(0,K.cy,0).addScaledVector(toCam,150);cc.quaternion.copy(camera.quaternion);cc.updateMatrixWorld();
       renderer.autoClear=false;
       RT_A.viewport.set(0,0,px,px);RT_A.scissor.set(0,0,Math.min(RTS,px+8),Math.min(RTS,px+8));   /* (t5: cleared a little past the picture too) */renderer.setRenderTarget(RT_A);renderer.setClearColor(0x000000,0);renderer.clear(true,true,false);renderer.render(cs,cc);
       finU.uScale.value=px/RTS;finU.uPx.value=px;finU.uExp.value=renderer.toneMappingExposure;
       A.tex.generateMipmaps=mips!==false;   // (mipmaps once per frame, on its last picture: a 2048 x 1024 rebuild each time was a hitch)
       A.rt.viewport.set(at[0],at[1],px,px);A.rt.scissor.set(at[0],at[1],px,px);renderer.setRenderTarget(A.rt);renderer.render(finS,finC);
     }finally{   // put it back exactly as it was, and the renderer too
       renderer.setRenderTarget(rt0);renderer.setClearColor(cl,ca);renderer.autoClear=ac;
       if(par)par.add(o);else cs.remove(o);o.position.copy(p0);o.rotation.y=ry;o.visible=vis;o.updateMatrixWorld(true);o.children.forEach(c=>{c.matrixWorldAutoUpdate=false;});}
     CUT.caps++;return {r:[at[0]/AW,at[1]/AH,px/AW,px/AH],a:K.at,w:2*K.R};}
   // start-up: compile the picture shaders (the cut-outs' materials as drawn into RT_A) behind the "Getting the mill ready" screen
   G3.cutWarm=()=>{try{rescan();basis();const seen=new Set();for(const a of CUT.actors){const kk=a.kind;if(seen.size>40)break;
       let m=false;a.o.traverse(c=>{if(c.material&&!seen.has(c.material)){seen.add(c.material);m=true;}});if(m){const key="warm:"+CUT.caps;const c=capture(a,key,0,ATL[a.K.at]);if(c){CUT.cells.set(key,c);CUT.byKD.set(kk+"#0",c);CUT.byK.set(kk,c);}}}}
     catch(e){CUT.errs++;console.error("cut-out warm-up failed",e);}
     sets.forEach(S2=>{S2.card.count=S2.shad.count=1;});
     // v6.1 t4 self-test: read back the centre of one warm-up picture (once, at start-up). Empty means this device can't
     // render the pictures: the cut-outs stay off and the 3D models are shown, rather than nothing at all.
     try{const c=CUT.byK.get("person")||CUT.byK.get("lift")||CUT.byK.get("truck");if(c){const A=ATL[c.a],px=new Uint8Array(4*256);
         const cx=Math.round((c.r[0]+c.r[2]/2)*AW),cy=Math.round((c.r[1]+c.r[3]*0.45)*AH);renderer.readRenderTargetPixels(A.rt,cx-8,cy-8,16,16,px);
         let a=0;for(let i=3;i<px.length;i+=4)a=Math.max(a,px[i]);CUT.selfTest=a;if(a===0){CUT.ok=false;CUT.actors.forEach(x=>x.o.children.forEach(c=>{c.matrixWorldAutoUpdate=true;}));diag("cut-outs: pictures came out empty on this device; 3D models shown instead");}
         else diag("cut-outs: self-test ok");}}catch(e){CUT.selfTest=-1;}};   // (one card each so the start-up compile sees their shaders; the next tick resets the counts)
   // --- every frame (43-3d-frame.js, after the moving batches, before the render) ---
   let scanT=0;
   // an atlas that fills up starts over: its pictures are dropped and retaken as they are needed again
   function resetAtlas(i){const A=ATL[i];A.rows=[];A.nextY=0;A.full=false;CUT.resets++;
     for(const [k,c] of CUT.cells)if(c.a===i)CUT.cells.delete(k);for(const M2 of [CUT.byKD,CUT.byK])for(const [k,c] of M2)if(c.a===i)M2.delete(k);
     for(const a of CUT.actors)if(a.cell&&a.cell.a===i)a.cell=null;diag(`cut-outs: atlas ${i} full, starting it over`);}
   const want=(a,key,dir,first)=>{if(CUT.qset.has(key))return;CUT.qset.add(key);if(first)CUT.queue.unshift([a,key,dir]);else CUT.queue.push([a,key,dir]);};
   /* v6.1 t2: the paper always wins. A cut-out is hidden from the first frame it is seen, never shown in 3D again: until its
      own picture exists it borrows the nearest one (its last picture, else the last of its kind at that heading, else any of
      its kind), and one with no picture at all goes to the front of the queue. Errors are counted per picture or per
      actor and never switch the cut-outs off. */
   G3.cutTick=now=>{if(!CUT.ok)return;
     if(now>scanT){scanT=now+2000;try{rescan();}catch(e){CUT.errs++;}}
     if(!CUT.burst)CUT.burst=now+6000;   // (the first seconds take pictures faster: everyone needs one)
     let n=0;const capN=now<CUT.burst?CAP_BURST:CAP_N;
     while(CUT.queue.length&&n<capN){const [a,key,dir]=CUT.queue.shift();CUT.qset.delete(key);if(CUT.cells.has(key)||!shown(a.o))continue;
       let A=ATL[a.K.at];if(A.full){CUT.full++;resetAtlas(a.K.at);A=ATL[a.K.at];}if(!n)basis();n++;
       const lastOne=n>=capN||!CUT.queue.length;let c=null;try{c=capture(a,key,dir,A,lastOne);}catch(e){CUT.errs++;if(CUT.errs<6)console.error("cut-out picture failed",e);}
       if(c){CUT.cells.set(key,c);CUT.byKD.set(a.kind+"#"+dir,c);CUT.byK.set(a.kind,c);}}
     if(now<CUT.t)return;CUT.t=now+1000/FPS;CUT.tk=(CUT.tk||0)+1;basis();
     {const k=G3.nightK!=null?G3.nightK:0;lit.value=1-0.62*k;}
     const cnt=[0,0];
     for(const a of CUT.actors){const o=a.o;try{if(!shown(o))continue;
       if(!a.hid||now>a.hT){a.hT=now+300;hide(a,true);}   // (hidden at once; re-checked every second, pools add parts later)
       const dir=heading(o);if(!a.lk||((CUT.tk+(a.ix||(a.ix=CUT.actors.indexOf(a)+1)))&1))a.lk=lookKey(a);const key=a.lk+"#"+dir;   /* (t6: the look is re-read every other tick) */let c=CUT.cells.get(key);
       if(!c){want(a,key,dir,!a.cell);c=a.cell||CUT.byKD.get(a.kind+"#"+dir)||CUT.byK.get(a.kind);}
       if(!c)continue;a.cell=c;
       const S2=sets[c.a],i=cnt[c.a];if(i>=S2.N)continue;cnt[c.a]++;
       o.getWorldPosition(_p);_p.y+=a.K.cy;_p.addScaledVector(toCam,a.K.R);
       _m.makeRotationFromQuaternion(camera.quaternion).scale(_v3.set(c.w,c.w,1)).setPosition(_p);S2.card.setMatrixAt(i,_m);
       const off=c.w*0.05;_p.addScaledVector(cRight,off).addScaledVector(cUp,-off*0.8).addScaledVector(toCam,-0.02);_m.setPosition(_p);S2.shad.setMatrixAt(i,_m);
       S2.rect.setXYZW(i,c.r[0],c.r[1],c.r[2],c.r[3]);}catch(e){CUT.errs++;if(CUT.errs<6)console.error("cut-out failed",e);}}
     sets.forEach((S2,i)=>{S2.card.count=S2.shad.count=cnt[i];const n=cnt[i];G3.chg(S2.card.instanceMatrix,n);G3.chg(S2.shad.instanceMatrix,n);G3.chg(S2.rect,n);   /* (t10: only when something moved or changed picture) */S2.shad.visible=!G3.shadowsOff;});};
   const _v3=new THREE.Vector3();
   CUT.stats=()=>({actors:CUT.actors.length,cells:CUT.cells.size,caps:CUT.caps,queue:CUT.queue.length,full:CUT.full,resets:CUT.resets,errs:CUT.errs,rows:ATL.map(A=>A.nextY),
     shown3D:CUT.actors.filter(a=>shown(a.o)&&(!a.hid||(()=>{let l=0;a.o.traverse(c=>{if((c.isMesh||c.isLine)&&c.visible&&c.layers.mask!==1<<CUT_LAYER)l++;});return l;})())).length});
   // a lost and restored graphics context empties the atlases: take every picture again
   glc.addEventListener("webglcontextrestored",()=>{[0,1].forEach(resetAtlas);});}
