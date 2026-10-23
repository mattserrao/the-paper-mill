  /* ---- v6.12 the whole-site picture ----
     At the widest zoom step (1x) of the fixed iso view the static world (the scenery batches and baked batches, the scenery
     sectors and the terrain: ~45 draws, ~55k triangles) does not change from one frame to the next, and the camera never
     turns. So it is drawn once into pictures (tiles of 1024 x 1024: colour as the screen would show it, and depth) and each
     frame the screen gets the tiles it needs as flat quads that also write their depth, with every live thing (people and
     trucks, cards, bales, rolls, effects, the sheet, the drop shadows, the signs, the night lights, the time-of-day grade)
     drawn over them as usual and hidden behind baked buildings by the baked depth.
     - Tiles are kept as the player pans (the whole pannable world, filled in as it is seen and in the background once the
       picture is steady; phones keep the nearest 8, about 64 MB). The camera is put on whole pixels of the picture's grid, so
       the tiles land pixel for pixel (a shift of under half a pixel).
     - A new picture (every tile again) when anything static changes: the lights (time of day, weather, a fire), a colour
       (season palette, brand), a part handed back from its batch, a roof, the size of the view. Small light changes are
       rounded first, so dawn and dusk take a step every second or so even at speed 120. More than 3 new pictures in a second
       (lightning, a fire's flicker) switches it off for 3 s.
     - Blinking lights stay live: a light whose colour changed in the last 3 s is drawn on its own over the picture.
     - Opt-in since t7 (?imp): on the iPhone it saved no GPU time and its rebuilds caused the only frames over 33 ms.
     - Off: without ?imp, away from 1x, the free camera, zen, or anything failing (falls back to drawing as before). */
  {const BL=24,TS=1024,CAP=mobile?8:16,ON=/[?&]imp(?:=1)?(?:&|$)/.test(location.search);
   const IMP=G3.IMP={active:false,gen:0,gens:0,bakes:0,tiles:new Map(),susp:0,hist:[],sig:"",prox:new Map(),objs:new Set(),fills:0,err:null};
   const bakeCam=new THREE.OrthographicCamera(-1,1,1,-1,1,ISO_D*2.6);bakeCam.layers.set(BL);
   const _r=new THREE.Vector3(),_u=new THREE.Vector3(),_f=new THREE.Vector3(),_b=new THREE.Vector3(),_d=new THREE.Vector3(),_sz=new THREE.Vector2();
   // the picture's fixed origin: where the iso camera stands for a target at (0,0,0)
   {const th=-Math.PI/4,ph=Math.acos(Math.sqrt(1/3));_b.set(ISO_D*Math.sin(ph)*Math.sin(th),ISO_D*Math.cos(ph),ISO_D*Math.sin(ph)*Math.cos(th));}
   // --- the tile quads: drawn first, writing colour and the picture's depth (moved to this camera) ---
   const QG=new THREE.BufferGeometry();QG.setAttribute("position",new THREE.Float32BufferAttribute([0,0,0,1,0,0,1,1,0,0,1,0],3));QG.setIndex([0,1,2,0,2,3]);
   const VS="uniform vec4 uRect;uniform vec2 uScr;void main(){vec2 p=(uRect.xy+position.xy*uRect.zw)/uScr*2.0-1.0;gl_Position=vec4(p,0.0,1.0);}";
   const FS="uniform sampler2D uCol;uniform sampler2D uDep;uniform vec2 uOrg;uniform float uDOff;void main(){ivec2 tc=clamp(ivec2(floor(gl_FragCoord.xy-uOrg)),ivec2(0),ivec2("+(TS-1)+"));"+
     "float d=texelFetch(uDep,tc,0).r;gl_FragColor=texelFetch(uCol,tc,0);gl_FragDepth=d>=1.0?1.0:clamp(d+uDOff,0.0,1.0);}";
   const grp=new THREE.Group();grp.name="whole-site picture";grp.userData.noNav=true;scene.add(grp);if(G3.SM&&G3.SM.dyn)G3.SM.dyn.add(grp);
   const quads=[];
   function quad(i){while(quads.length<=i){const m=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:FS,
       uniforms:{uRect:{value:new THREE.Vector4()},uScr:{value:new THREE.Vector2(1,1)},uCol:{value:null},uDep:{value:null},uOrg:{value:new THREE.Vector2()},uDOff:{value:0}},
       depthFunc:THREE.AlwaysDepth,depthWrite:true,depthTest:true,toneMapped:false,fog:false});
     const q=new THREE.Mesh(QG,m);q.frustumCulled=false;q.renderOrder=-1e6;q.visible=false;q.userData.noNav=true;q.userData.smBatch=true;grp.add(q);quads.push(q);}return quads[i];}
   // --- tiles: an 8-bit colour target holding the screen's own colours (tone-mapped, sRGB: rendered the way the screen is, see
   //     below) plus a 24-bit depth texture ---
   function newRT(){const dt=new THREE.DepthTexture(TS,TS);dt.type=THREE.UnsignedIntType;dt.minFilter=dt.magFilter=THREE.NearestFilter;
     const aa=renderer.getContext().getContextAttributes().antialias;   // (the screen's own antialiasing, so baked edges match live ones)
     const rt=new THREE.WebGLRenderTarget(TS,TS,{depthBuffer:true,depthTexture:dt,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,generateMipmaps:false,type:THREE.UnsignedByteType,samples:aa?4:0});
     /* (three.js tone-maps and sRGB-encodes only for the screen, or for a target flagged as an XR one, which then encodes into
        its texture's colour space. The target is made as plain RGBA8 first, then flagged: the shaders write exactly the
        screen's bytes, with the same shader programs (nothing new to compile), and the bytes are stored as they are.) */
     renderer.initRenderTarget(rt);rt.texture.colorSpace=THREE.SRGBColorSpace;rt.isXRRenderTarget=true;return rt;}
   function dropTile(k){const t=IMP.tiles.get(k);if(!t)return;t.rt.depthTexture.dispose();t.rt.dispose();IMP.tiles.delete(k);}
   function dropAll(){for(const k of [...IMP.tiles.keys()])dropTile(k);}
   // --- what goes into the picture: static, opaque, untextured, on the plain layer ---
   const okMat=m=>m&&!Array.isArray(m)&&!m.transparent&&!m.map&&m.opacity>=0.999&&m.visible!==false&&!m.isShaderMaterial;
   const shownUp=o=>{for(let x=o;x;x=x.parent){if(!x.visible)return false;if(x===scene)return true;}return false;};
   function staticList(){const L=[],SM=G3.SM;if(!SM||!SM.done||SM.off)return L;
     const add=o=>{if(o&&(o.isMesh||o.isLine||o.isLineSegments||o.isBatchedMesh)&&(o.layers.mask===1||o.layers.mask===1<<BL)&&okMat(o.material)&&shownUp(o))L.push(o);};
     for(const b of SM.bms){if(!b.userData.impW){const f=b.setVisibleAt;b.setVisibleAt=function(i,v){if(this.getVisibleAt(i)!==v)this.userData.impV=(this.userData.impV||0)+1;return f.call(this,i,v);};b.userData.impW=1;}add(b);}
     for(const b of SM.batches.values()){add(b.mesh);if(b.lv)b.lv.forEach(add);}
     if(G3.scenery&&G3.scenery.parts)G3.scenery.parts.forEach(add);add(G3.terrain);return L;}
   // --- the signature: everything the picture depends on, rounded so that changes under what the screen can show don't count ---
   const q3=v=>Math.round(v*400),qi=v=>Math.round(Math.log(Math.max(1e-4,v))/0.006),lights=[];let lightsN=-1,H1=0,H2=0;
   const hv=v=>{v=v|0;H1=Math.imul(H1^v,0x9e3779b1)+0x7f4a7c15|0;H2=Math.imul(H2+v,0x85ebca6b)^(H2>>>13);};   // (two running hashes: no strings per frame)
   const hc=c=>{hv(q3(c.r));hv(q3(c.g));hv(q3(c.b));};
   function sigOf(L,W,H,ppu){H1=17;H2=31;hv(W);hv(H);hv(Math.round(camera.top*1e3));hv(Math.round(camera.right*1e3));hv(Math.round(ppu*1e4));hv(G3.impBrand||0);
     const e=camera.quaternion;hv(Math.round(e.x*1e5));hv(Math.round(e.y*1e5));hv(Math.round(e.z*1e5));
     if(lightsN!==scene.children.length){lightsN=scene.children.length;lights.length=0;scene.traverse(o=>{if(o.isLight){lights.push(o);o.layers.enable(BL);}});}
     for(const l of lights){hv(l.visible&&l.intensity>1e-3?qi(l.intensity):-1);hc(l.color);if(l.groundColor)hc(l.groundColor);}
     if(scene.fog){hc(scene.fog.color);hv(scene.fog.near|0);hv(scene.fog.far|0);hv(Math.round((scene.fog.density||0)*1e5));}
     if(scene.background&&scene.background.isColor)hc(scene.background);
     for(const o of L){const m=o.material,g=o.geometry,w=o.matrixWorld.elements;hv(o.id);if(m.color)hc(m.color);
       if(m.emissive){hv(q3(m.emissive.r*m.emissiveIntensity));hv(q3(m.emissive.g*m.emissiveIntensity));hv(q3(m.emissive.b*m.emissiveIntensity));}
       hv(Math.round(w[12]*100));hv(Math.round(w[13]*100));hv(Math.round(w[14]*100));
       if(o.isBatchedMesh){hv(o.userData.impV||0);hv(o.instanceCount);}
       else if(g){hv(g.id);hv(g.attributes.position?g.attributes.position.version:0);hv(g.index?g.index.version:0);hv(g.drawRange.count);
         if(o.userData.scenery||o===G3.terrain)hv(g.attributes.color?g.attributes.color.version:0);}}   // (scenery and ground: the season's colours; a batch's own colour changes are blinking lights, drawn live)
     return H1+":"+H2;}
   // --- live lights: an object whose colour changed in the last 3 s is drawn on its own over the picture ---
   function proxies(now,live){const SM=G3.SM,seen=new Set();let ended=false;
     if(live&&SM&&SM.anim)for(const r of SM.anim){if(r.out||!r.o||!r.o.material||!r.o.material.color)continue;const h=r.o.material.color.getHex();
       if(r._ih===undefined){r._ih=h;r._it=0;}if(h!==r._ih){r._ih=h;r._it=now;}if(now-r._it>3000)continue;
       const inPic=r.bm?(()=>{try{return r.bm.getVisibleAt(r.iid);}catch(e){return false;}})():!!(r.lv&&r.lv[0]);if(!inPic)continue;
       seen.add(r);let p=IMP.prox.get(r);
       if(!p){const g=r.o.userData.fullGeo||r.o.geometry,m=r.o.material.clone();m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-4;
         p=new THREE.Mesh(g,m);p.matrixAutoUpdate=false;p.matrixWorldAutoUpdate=false;p.frustumCulled=false;p.userData.noNav=true;p.userData.smBatch=true;p.matrixWorld.copy(r.mw||r.o.matrixWorld);grp.add(p);IMP.prox.set(r,p);}
       p.material.color.copy(r.o.material.color);if(p.material.emissive&&r.o.material.emissive){p.material.emissive.copy(r.o.material.emissive);p.material.emissiveIntensity=r.o.material.emissiveIntensity;}p.visible=true;}
     for(const [r,p] of IMP.prox)if(!seen.has(r)){grp.remove(p);p.material.dispose();IMP.prox.delete(r);if(live)ended=true;}
     return ended;}   // (a light that settled on a new colour: the next picture takes it in)
   // --- switching the static set between the screen and the picture ---
   function setLayers(L){const now=new Set(L);
     for(const o of IMP.objs)if(!now.has(o)){o.layers.mask=o.userData.impMask||1;delete o.userData.impMask;}
     for(const o of now)if(o.layers.mask!==1<<BL){o.userData.impMask=o.layers.mask;o.layers.set(BL);}
     IMP.objs=now;}
   function off(){if(IMP.active){setLayers([]);quads.forEach(q=>q.visible=false);proxies(0,false);IMP.active=false;G3.cullCam=null;
       if(G3.SM&&G3.SM.bms)G3.SM.bms.forEach(b=>{b.perObjectFrustumCulled=true;});}}   // (their last cull was for a tile: cull for the screen this frame too)   // (cullCam: the static batches cull again for the screen)
   G3.impOff=()=>{off();IMP.err=IMP.err||"error";};
   G3.impStats=()=>({on:ON&&!IMP.err,active:IMP.active,tiles:IMP.tiles.size,gens:IMP.gens,bakes:IMP.bakes,fills:IMP.fills,suspended:performance.now()<IMP.susp,proxies:IMP.prox.size,static:IMP.objs.size,err:IMP.err});
   // a brand or theme change recolours everything: one new picture (36c rebrand hook)
   {const rb=G3.rebrand;if(rb)G3.rebrand=(...a)=>{const r=rb(...a);G3.impBrand=(G3.impBrand||0)+1;return r;};}
   // --- one tile: the static set alone, through an orthographic camera covering just that tile of the picture's grid ---
   function bake(i,j,ppu,gen){const k=i+","+j;let t=IMP.tiles.get(k);
     if(!t){if(IMP.tiles.size>=CAP){let lo=null;for(const [kk,tt] of IMP.tiles)if(!lo||tt.u<lo[1].u)lo=[kk,tt];if(lo)dropTile(lo[0]);}t={rt:newRT(),gen:-1,u:0};IMP.tiles.set(k,t);}
     bakeCam.position.copy(_b);bakeCam.quaternion.copy(camera.quaternion);bakeCam.left=i*TS/ppu;bakeCam.right=(i+1)*TS/ppu;bakeCam.bottom=j*TS/ppu;bakeCam.top=(j+1)*TS/ppu;
     bakeCam.near=camera.near;bakeCam.far=camera.far;bakeCam.updateProjectionMatrix();bakeCam.updateMatrixWorld();
     const rt0=renderer.getRenderTarget(),ac=renderer.autoClear,cull=G3.SM.bms.map(b=>b.perObjectFrustumCulled);
     G3.SM.bms.forEach(b=>{b.perObjectFrustumCulled=true;});   // (each batch culls to this tile; the screen culls again afterwards: cullCam)
     const mwa=scene.matrixWorldAutoUpdate;scene.matrixWorldAutoUpdate=false;   // (static: no matrix pass per tile)
     try{renderer.autoClear=true;renderer.setRenderTarget(t.rt);renderer.render(scene,bakeCam);}
     finally{renderer.setRenderTarget(rt0);renderer.autoClear=ac;scene.matrixWorldAutoUpdate=mwa;G3.SM.bms.forEach((b,n)=>{b.perObjectFrustumCulled=cull[n];});G3.cullCam=null;}
     t.gen=gen;IMP.bakes++;return t;}
   // --- every frame, just before the screen render (43) ---
   let still0=0,lastGenT=0;
   G3.impFrame=()=>{const now=performance.now();
     const want=ON&&!IMP.err&&!G3.impDisable&&!G3.freeCam&&camera===G3.camIso&&!(S&&S.zen)&&!G3.zen&&Math.abs((G3.camR||0)-R_MAX)<0.01&&!goal&&now>=IMP.susp&&G3.SM&&G3.SM.done&&!G3.SM.off;
     if(!want){off();return;}
     renderer.getDrawingBufferSize(_sz);const W=_sz.x,H=_sz.y;if(W<16||H<16){off();return;}
     const L=staticList();if(L.length<3){off();return;}
     setLayers(L);IMP.active=true;
     // the picture's grid: pixels per metre on the screen; the camera onto whole pixels of the grid
     camera.updateMatrixWorld();const e=camera.matrixWorld.elements;_r.set(e[0],e[1],e[2]).normalize();_u.set(e[4],e[5],e[6]).normalize();_f.set(-e[8],-e[9],-e[10]).normalize();
     const ppu=H/(camera.top-camera.bottom);_d.subVectors(camera.position,_b);
     const X0=(_d.dot(_r)+camera.left)*ppu,Y0=(_d.dot(_u)+camera.bottom)*ppu,fx=X0-Math.round(X0),fy=Y0-Math.round(Y0);
     camera.position.addScaledVector(_r,-fx/ppu).addScaledVector(_u,-fy/ppu);camera.updateMatrixWorld();IMP.snap=[-fx/ppu,-fy/ppu];
     const x0=Math.round(X0),y0=Math.round(Y0),dOff=_d.subVectors(_b,camera.position).dot(_f)/(camera.far-camera.near);
     // a new picture when anything it depends on changed
     const sig=sigOf(L,W,H,ppu);
     if(sig!==IMP.sig){IMP.sig=sig;IMP.gen++;IMP.gens++;lastGenT=now;IMP.hist=IMP.hist.filter(t=>now-t<1000);IMP.hist.push(now);
       if(IMP.hist.length>3){IMP.susp=now+3000;IMP.hist=[];IMP.sig="";off();return;}}   // (lightning, a fire's flicker: draw as before for a while)
     if(proxies(now,true)){IMP.sig="";}   // (a light settled: take it into the next picture)
     // the tiles on screen: made now if missing or old
     const i0=Math.floor(x0/TS),i1=Math.floor((x0+W-1)/TS),j0=Math.floor(y0/TS),j1=Math.floor((y0+H-1)/TS);let n=0;
     for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){let t=IMP.tiles.get(i+","+j);if(!t||t.gen!==IMP.gen)t=bake(i,j,ppu,IMP.gen);t.u=now;
       const q=quad(n++),U=q.material.uniforms,ox=i*TS-x0,oy=j*TS-y0;U.uRect.value.set(ox,oy,TS,TS);U.uScr.value.set(W,H);U.uOrg.value.set(ox,oy);U.uCol.value=t.rt.texture;U.uDep.value=t.rt.depthTexture;U.uDOff.value=dOff;q.visible=true;}
     for(let k=n;k<quads.length;k++)quads[k].visible=false;
     // the rest of the pannable world, one tile a frame, once the picture has been steady for 2 s and the camera is still
     if(G3.camBusy&&G3.camBusy())still0=now;
     if(now-lastGenT>2000&&now-still0>500&&IMP.tiles.size<CAP){const B=G3.panBox&&G3.panBox();let PR=null;
       if(B){PR=[1e9,-1e9,1e9,-1e9];for(const x of [B[0],B[1]])for(const z of [B[2],B[3]]){const a=x*_r.x+z*_r.z,c=x*_u.x+z*_u.z;PR[0]=Math.min(PR[0],a);PR[1]=Math.max(PR[1],a);PR[2]=Math.min(PR[2],c);PR[3]=Math.max(PR[3],c);}}
       if(PR){let best=null,bd=1e18;const ci=(i0+i1)/2,cj=(j0+j1)/2;
         for(let i=Math.floor((PR[0]+camera.left)*ppu/TS)-0;i<=Math.floor((PR[1]+camera.right)*ppu/TS);i++)for(let j=Math.floor((PR[2]+camera.bottom)*ppu/TS);j<=Math.floor((PR[3]+camera.top)*ppu/TS);j++){
           const t=IMP.tiles.get(i+","+j);if(t&&t.gen===IMP.gen)continue;const dd=(i-ci)*(i-ci)+(j-cj)*(j-cj);if(dd<bd){bd=dd;best=[i,j];}}
         if(best){bake(best[0],best[1],ppu,IMP.gen).u=now-1;IMP.fills++;}}}};}
