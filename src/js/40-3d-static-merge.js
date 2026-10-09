  /* ---- static scenery batching (v4, three.js BatchedMesh) ----
     On the very first frame, before anything is drawn, every plain opaque mesh is moved into one BatchedMesh per material
     (and shadow flags and vertex layout); a material used by just one object leaves that object alone. Each distinct
     shape is stored once per batch and drawn with one multi-draw call, so the originals never reach the GPU and phones
     get the merge too. The originals stay
     in the scene graph on a hidden layer and are watched (every frame for the first 10 s, then twice a second): anything
     that moves, shows or hides, swaps material or edits its geometry just has its instance hidden and is drawn on its own
     again. Edge outlines, mirrored meshes and roof parts (which fade per roof) still bake into one geometry per material
     and map cell (the v2.9 path, smBuild); a change there rebuilds that one baked batch. */
  const SM={t0:0,done:false,list:[],batches:new Map(),bms:[],dyn:new WeakSet(),checkT:0,queue:null,handedBack:0};G3.SM=SM;
  const _smV=new THREE.Vector3(),_smN=new THREE.Vector3(),_smM3=new THREE.Matrix3(),SMCELL=90,SMLAYER=31;
  function smShown(o){let x=o;for(;x&&x!==scene;x=x.parent)if(!x.visible)return false;return x===scene;}
  function smExcluded(o){for(let x=o;x&&x!==scene;x=x.parent){if(roofs.includes(x)||SM.dyn.has(x))return true;}return false;}
  function smRecord(o){return {o,m:Float64Array.from(o.matrixWorld.elements),mat:o.material,geo:o.geometry,ver:o.geometry.attributes.position.version,key:null};}
  function smSame(r){const o=r.o;if(o.material!==r.mat||o.geometry!==r.geo||o.geometry.attributes.position.version!==r.ver||!smShown(o))return false;
    if(r.frozen){if(!o.position.equals(r.fp)||!o.quaternion.equals(r.fq)||!o.scale.equals(r.fs))return false;
      const e=o.parent.matrixWorld.elements,m=r.pm;for(let i=0;i<16;i++)if(Math.abs(e[i]-m[i])>1e-5)return false;return true;}
    const e=o.matrixWorld.elements,m=r.m;for(let i=0;i<16;i++)if(Math.abs(e[i]-m[i])>1e-5)return false;return true;}
  /* originals drawn by a batch don't need their matrices recomputed every frame: freeze them once the start-up watch
     (10 s) is over and watch their position, rotation, scale and parent instead. Unfrozen on hand-back. */
  function smFreeze(r){const o=r.o;if(r.frozen||!o.parent)return;r.frozen=true;r.fp=o.position.clone();r.fq=o.quaternion.clone();r.fs=o.scale.clone();
    r.pm=Float64Array.from(o.parent.matrixWorld.elements);o.matrixAutoUpdate=false;o.matrixWorldAutoUpdate=false;}
  function smThaw(r){if(!r.frozen)return;r.frozen=false;r.o.matrixAutoUpdate=true;r.o.matrixWorldAutoUpdate=true;r.o.updateMatrixWorld(true);}
  function smOK(o){if(!(o.isMesh||o.isLineSegments)||o.isInstancedMesh||o.isSkinnedMesh||o.isSprite||o.isPoints)return false;
    // edge outlines are faint (transparent) lines; merged per material and map cell they look the same, so they're allowed
    const m=o.material,g=o.geometry;if(!m||Array.isArray(m)||(!o.isLineSegments&&(m.transparent||m.opacity<1))||o.renderOrder||!g||!g.isBufferGeometry)return false;
    if(o.layers.mask!==1||o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender)return false;
    const a=g.attributes;if(!a.position||a.position.itemSize!==3)return false;for(const k in a)if(k!=="position"&&k!=="normal"&&k!=="uv")return false;
    if(o.isMesh&&!a.normal)return false;if(g.morphAttributes&&Object.keys(g.morphAttributes).length)return false;
    if(g.drawRange.start!==0||g.drawRange.count!==Infinity)return false;return true;}
  function smBuild(key){const b=SM.batches.get(key);const par=b.parent||scene;if(b.mesh){par.remove(b.mesh);b.mesh.geometry.dispose();b.mesh=null;}
    const L=b.recs;if(!L.length)return;const line=b.line,hasUV=b.uv;let nv=0,ni=0;
    L.forEach(r=>{const g=r.o.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;});
    const pos=new Float32Array(nv*3),nor=line?null:new Float32Array(nv*3),uv=hasUV?new Float32Array(nv*2):null,idx=new Uint32Array(ni);let vo=0,io=0;
    L.forEach(r=>{const o=r.o,g=o.geometry,P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,mw=r.mw||o.matrixWorld,flip=!line&&mw.determinant()<0;
      if(!line)_smM3.getNormalMatrix(mw);
      for(let i=0;i<P.count;i++){_smV.set(P.getX(i),P.getY(i),P.getZ(i)).applyMatrix4(mw);pos[(vo+i)*3]=_smV.x;pos[(vo+i)*3+1]=_smV.y;pos[(vo+i)*3+2]=_smV.z;
        if(nor){_smN.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(_smM3).normalize();nor[(vo+i)*3]=_smN.x;nor[(vo+i)*3+1]=_smN.y;nor[(vo+i)*3+2]=_smN.z;}
        if(uv&&U){uv[(vo+i)*2]=U.getX(i);uv[(vo+i)*2+1]=U.getY(i);}}
      const I=g.index,n=I?I.count:P.count;
      if(!line&&flip)for(let k=0;k<n;k+=3){const a=I?I.getX(k):k,b2=I?I.getX(k+1):k+1,c=I?I.getX(k+2):k+2;idx[io+k]=vo+a;idx[io+k+1]=vo+c;idx[io+k+2]=vo+b2;}
      else for(let k=0;k<n;k++)idx[io+k]=vo+(I?I.getX(k):k);
      vo+=P.count;io+=n;});
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));if(nor)geo.setAttribute("normal",new THREE.BufferAttribute(nor,3));
    if(uv)geo.setAttribute("uv",new THREE.BufferAttribute(uv,2));geo.setIndex(new THREE.BufferAttribute(idx,1));geo.computeBoundingSphere();
    const mesh=line?new THREE.LineSegments(geo,b.mat):new THREE.Mesh(geo,b.mat);mesh.castShadow=b.cast;mesh.receiveShadow=b.recv;mesh.matrixAutoUpdate=false;mesh.userData.smBatch=true;
    par.add(mesh);b.mesh=mesh;}
  // multi-material meshes can't be batched, but if static they can still cast through the shadow proxy (proxyOnly)
  const smShadowOnly=o=>o.isMesh&&!o.isInstancedMesh&&!o.isBatchedMesh&&o.castShadow&&Array.isArray(o.material)&&!o.material.some(m=>m.transparent)&&o.layers.mask===1&&
    o.geometry&&o.geometry.attributes.position&&o.onBeforeRender===THREE.Object3D.prototype.onBeforeRender;
  function smSnapshot(){SM.list=[];scene.traverse(o=>{if(o.userData&&o.userData.smBatch)return;if(!smShown(o)||smExcluded(o))return;
    if(smOK(o))SM.list.push(smRecord(o));else if(smShadowOnly(o)){const r=smRecord(o);r.proxyOnly=true;SM.list.push(r);}});}
  // materials that look identical share a batch (many were created separately with the same settings); if one is later
  // changed on its own, the watcher sees its look diverge from the batch's material and hands that object back
  const SMMAPS=["map","emissiveMap","alphaMap","normalMap","roughnessMap","metalnessMap","aoMap","lightMap","bumpMap","envMap"],
    smHex=c=>c&&c.isColor?c.getHexString():"";
  function smLook(m){return [m.type,smHex(m.color),smHex(m.emissive),m.emissiveIntensity,m.roughness,m.metalness,...SMMAPS.map(k=>m[k]?m[k].uuid:""),
    m.side,m.flatShading,m.vertexColors,m.fog,m.toneMapped,m.polygonOffset,m.polygonOffsetFactor,m.polygonOffsetUnits,m.depthWrite,m.depthTest,
    m.alphaTest,m.wireframe,m.opacity,m.userData&&m.userData.token||""].join("/");}
  // a batch draws with its own copy of the material: three.js re-derives a material's shader settings every time the
  // same material switches between a batch and a plain mesh, which happened every frame (garbage and CPU). The copy
  // keeps the palette token, so brand-color changes still reach it.
  // each copy follows its source material's colors every frame, so a blinking light or color change shows at once;
  // batched objects with other (look-alike) materials then differ from the batch and are handed back
  const MSYNC=[];
  function bmMat(m){const c=m.clone();c.userData=Object.assign({},m.userData);if(MATS.includes(m))MATS.push(c);MSYNC.push([c,m]);return c;}
  // same look as the batch: compared at 8-bit precision (look-alike materials differ in the last float bits)
  const colorSame=(a,b)=>a.color.getHex()===b.color.getHex()&&(!a.emissive||(a.emissive.getHex()===b.emissive.getHex()&&a.emissiveIntensity===b.emissiveIntensity));
  function matSync(){for(const [c,m] of MSYNC){if(!c.color.equals(m.color))c.color.copy(m.color);
    if(m.emissive&&!c.emissive.equals(m.emissive))c.emissive.copy(m.emissive);if(m.emissiveIntensity!==c.emissiveIntensity)c.emissiveIntensity=m.emissiveIntensity;}}
  // looks are cached per material; a palette change (new brand colors) starts a new cache
  let lookCache=new WeakMap(),lookKey="";const lookIds=new Map();
  function lookId(m){if(paletteKey!==lookKey){lookKey=paletteKey;lookCache=new WeakMap();}let v=lookCache.get(m);
    if(v===undefined){const s=smLook(m);v=lookIds.get(s);if(v===undefined){v=lookIds.size;lookIds.set(s,v);}lookCache.set(m,v);}return v;}
  const sigCache=new WeakMap();const smSigC=g=>{let v=sigCache.get(g);if(v===undefined){v=smSig(g);sigCache.set(g,v);}return v;};
  const smSig=g=>Object.keys(g.attributes).sort().map(k=>k+g.attributes[k].itemSize+(g.attributes[k].normalized?"n":"")).join(",")+(g.index?"|i":"|n");
  // one BatchedMesh for a group of records that share material, shadow flags and vertex layout
  function bmBuild(grp){const geos=new Map();let nv=0,ni=0;
    for(const r of grp.recs){const g=r.o.geometry;if(!geos.has(g)){geos.set(g,-1);nv+=g.attributes.position.count;ni+=g.index?g.index.count:0;}}
    const bm=new THREE.BatchedMesh(grp.recs.length,nv,Math.max(ni,1),bmMat(grp.mat));
    for(const g of geos.keys())geos.set(g,bm.addGeometry(g));
    for(const r of grp.recs){r.bm=bm;r.shared=true;r.iid=bm.addInstance(geos.get(r.o.geometry));bm.setMatrixAt(r.iid,r.o.matrixWorld);r.o.layers.set(SMLAYER);}
    // no per-object culling or sorting: the scenery is light for any GPU, and culling would re-upload each batch's
    // draw list every pass (main + shadow). The draw list now only changes when an object is handed back.
    bm.perObjectFrustumCulled=false;bm.sortObjects=false;
    bm.castShadow=grp.cast;bm.receiveShadow=grp.recv;bm.matrixAutoUpdate=false;bm.userData.smBatch=true;bm.name="scenery batch";
    bm.computeBoundingBox();bm.computeBoundingSphere();scene.add(bm);SM.bms.push(bm);}
  function smMerge(){const groups=new Map();
    for(const r of SM.list){const o=r.o,g=o.geometry;if(r.proxyOnly)continue;
      if(o.isMesh&&o.matrixWorld.determinant()>0){const key=[smLook(o.material),o.castShadow?1:0,o.receiveShadow?1:0,smSig(g)].join("|");
        let G=groups.get(key);if(!G){G={recs:[],mat:o.material,cast:o.castShadow,recv:o.receiveShadow};groups.set(key,G);}G.recs.push(r);continue;}
      // outlines and mirrored meshes: bake per material and 90 m map cell (off-screen cells are still culled)
      if(!g.boundingSphere)g.computeBoundingSphere();_smV.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);
      const line=!!o.isLineSegments,uv=!!g.attributes.uv,key=[line?"L":"M",o.material.uuid,o.castShadow?1:0,o.receiveShadow?1:0,uv?1:0,Math.floor(_smV.x/SMCELL),Math.floor(_smV.z/SMCELL)].join("|");
      let b=SM.batches.get(key);if(!b){b={recs:[],mat:o.material,line,uv,cast:o.castShadow,recv:o.receiveShadow,mesh:null};SM.batches.set(key,b);}
      b.recs.push(r);r.key=key;}
    // a group of one gains nothing from batching: that object simply stays as it is and is no longer watched
    groups.forEach(G=>{if(G.recs.length>1)bmBuild(G);else G.recs[0].single=true;});
    // roofs fade with zoom, so each roof is baked inside its own group (it keeps fading and hiding as a whole)
    let roofN=0;roofs.forEach((g,gi)=>{g.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(g.matrixWorld).invert();
      g.traverse(o=>{if(o===g||!smOK(o)&&!(o.isMesh&&o.material&&!Array.isArray(o.material)&&o.material.transparent))return;if(o.isInstancedMesh||Array.isArray(o.material)||o.layers.mask!==1)return;
        const a=o.geometry&&o.geometry.attributes;if(!a||!a.position||(o.isMesh&&!a.normal))return;for(const k in a)if(k!=="position"&&k!=="normal"&&k!=="uv")return;
        let x=o;for(;x&&x!==g;x=x.parent)if(!x.visible)return;
        const line=!!o.isLineSegments;if(!line&&!o.isMesh)return;const uv=!!a.uv,key=["R",gi,line?"L":"M",o.material.uuid,o.castShadow?1:0,o.receiveShadow?1:0,uv?1:0].join("|");
        let b=SM.batches.get(key);if(!b){b={recs:[],mat:o.material,line,uv,cast:o.castShadow,recv:o.receiveShadow,mesh:null,parent:g,roof:true};SM.batches.set(key,b);}
        b.recs.push({o,mw:new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld),key});roofN++;});});
    SM.queue=[...SM.batches.keys()];SM.roofN=roofN;shBuild();}
  // baked batches are built a few per frame (no single long stall at start-up, which phones punish)
  function smStep(){const N=mobile?6:30;for(let i=0;i<N&&SM.queue.length;i++){const key=SM.queue.shift(),b=SM.batches.get(key);
      if(!b.roof)b.recs=b.recs.filter(r=>smSame(r));smBuild(key);b.recs.forEach(r=>r.o.layers.set(SMLAYER));}
    if(SM.queue.length)return;SM.done=true;
    const inst=SM.bms.reduce((a,b)=>a+b.instanceCount,0),baked=[...SM.batches.values()].reduce((a,b)=>a+(b.roof?0:b.recs.length),0);
    console.info(`scenery: ${inst} objects in ${SM.bms.length} batched meshes; ${baked} outlines/mirrored + ${SM.roofN} roof parts baked into ${SM.batches.size} batches; shadows: ${SH.meshes.length} proxies`);}
  // anything that changes is handed back (drawn on its own again): a batched instance is just hidden, a baked batch is rebuilt
  function smWatch(){const dirty=SM.dirty||(SM.dirty=new Set());
    const freeze=performance.now()-SM.t0>10000;
    SM.list=SM.list.filter(r=>{if(smSame(r)&&!(r.shared&&!colorSame(r.o.material,r.bm.material))){if(freeze&&(r.bm||r.key))smFreeze(r);return true;}
      smThaw(r);
      if(r.shadow){r.o.castShadow=true;r.shadow=false;if(!shDrop(r))SH.dirty=true;}   // v4.0.1: cut it out of the proxy instead of rebuilding it
      if(r.bm){r.bm.setVisibleAt(r.iid,false);r.o.layers.set(0);SM.dyn.add(r.o);SM.handedBack++;return false;}
      if(r.single||r.proxyOnly){SM.dyn.add(r.o);SM.handedBack++;return false;}
      if(r.o.layers.mask===1&&!r.key)return true;
      r.o.layers.set(0);SM.dyn.add(r.o);SM.handedBack++;const b=SM.batches.get(r.key);if(b){b.recs=b.recs.filter(x=>x!==r);dirty.add(r.key);}return false;});
    let n=0;for(const k of [...dirty]){if(n++>=2)break;dirty.delete(k);smBuild(k);}
    if(SH.dirty&&performance.now()>SH.t){SH.dirty=false;SH.t=performance.now()+5000;shBuild();}}
  /* ---- static shadow proxy (v4) ----
     The sun never moves, so everything static casts its shadow through two merged, position-only meshes (one for
     single-sided surfaces, one for double-sided) instead of ~200 separate draws per shadow refresh. The proxies are
     shown only during the shadow pass. Moving things (vehicles, people, anything handed back) still cast their own
     shadows; when a proxied object starts moving, it casts its own again and the proxy is rebuilt without it
     (at most every 5 s). */
  const SH={meshes:[],dirty:false,t:0,mat:[new THREE.MeshBasicMaterial({side:THREE.FrontSide}),new THREE.MeshBasicMaterial({side:THREE.DoubleSide})]};
  G3.SH=SH;
  {const sm=renderer.shadowMap,orig=sm.render.bind(sm);
    sm.render=(...a)=>{for(const m of SH.meshes)m.visible=true;try{orig(...a);}finally{for(const m of SH.meshes)m.visible=false;}};}
  function shBuild(){SH.builds=(SH.builds||0)+1;for(const m of SH.meshes){scene.remove(m);m.geometry.dispose();}SH.meshes=[];
    const parts=[[],[]];
    for(const r of SM.list){if(r.shadow===undefined)r.shadow=!!r.o.castShadow&&r.o.isMesh;if(!r.shadow)continue;
      const m0=Array.isArray(r.o.material)?r.o.material[0]:r.o.material;r.o.castShadow=false;parts[m0.side===THREE.FrontSide?0:1].push(r);}
    // batches and baked batches no longer cast: their objects' shadows come from the proxy (roofs keep their own)
    SM.bms.forEach(b=>b.castShadow=false);SM.batches.forEach(b=>{if(!b.roof&&b.mesh)b.mesh.castShadow=false;if(!b.roof)b.cast=false;});
    parts.forEach((L,k)=>{if(!L.length)return;let nv=0,ni=0;
      for(const r of L){const g=r.o.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
      const pos=new Float32Array(nv*3),idx=new Uint32Array(ni);let vo=0,io=0;
      for(const r of L){const g=r.o.geometry,P=g.attributes.position,I=g.index,mw=r.o.matrixWorld,flip=mw.determinant()<0,n=I?I.count:P.count;r.shK=SH.meshes.length;r.shV0=vo;r.shVN=P.count;
        const e=mw.elements,A=P.array,st=P.isInterleavedBufferAttribute?P.data.stride:3,of=P.isInterleavedBufferAttribute?P.offset:0;
        for(let i=0;i<P.count;i++){const j=i*st+of,x=A[j],y=A[j+1],z=A[j+2],w=1/(e[3]*x+e[7]*y+e[11]*z+e[15]),k=(vo+i)*3;
          pos[k]=(e[0]*x+e[4]*y+e[8]*z+e[12])*w;pos[k+1]=(e[1]*x+e[5]*y+e[9]*z+e[13])*w;pos[k+2]=(e[2]*x+e[6]*y+e[10]*z+e[14])*w;}
        if(flip)for(let q=0;q<n;q+=3){const a=I?I.getX(q):q,b2=I?I.getX(q+1):q+1,c=I?I.getX(q+2):q+2;idx[io+q]=vo+a;idx[io+q+1]=vo+c;idx[io+q+2]=vo+b2;}
        else for(let q=0;q<n;q++)idx[io+q]=vo+(I?I.getX(q):q);vo+=P.count;io+=n;}
      const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));geo.setIndex(new THREE.BufferAttribute(idx,1));
      const m=new THREE.Mesh(geo,SH.mat[k]);m.castShadow=true;m.receiveShadow=false;m.frustumCulled=false;m.matrixAutoUpdate=false;m.visible=false;
      m.userData.smBatch=true;m.userData.rev=SH.builds;m.name="shadow proxy";scene.add(m);SH.meshes.push(m);});
    renderer.shadowMap.needsUpdate=true;}
  // v4.0.1: an object that starts moving casts its own shadow, so its triangles leave the proxy. Collapsing its vertices
  // to the origin (zero-area triangles) uploads only that range; rebuilding the whole proxy cost a long frame each time
  function shDrop(r){const m=SH.meshes[r.shK];if(r.shK==null||!m||m.userData.rev!==SH.builds)return false;
    const a=m.geometry.attributes.position,i0=r.shV0*3,i1=i0+r.shVN*3;a.array.fill(0,i0,i1);
    a.addUpdateRange(i0,i1-i0);a.needsUpdate=true;r.shK=null;renderer.shadowMap.needsUpdate=true;SH.drops=(SH.drops||0)+1;return true;}
  function smTick(now){if(SM.off)return;
    if(!SM.t0){SM.t0=now;try{scene.updateMatrixWorld(true);smSnapshot();smMerge();}
      catch(e){console.error("scenery batching failed",e);SM.off=true;SM.done=true;SM.list.forEach(r=>{r.o.layers.set(0);if(r.bm)r.bm.visible=false;});}return;}
    if(SM.queue&&SM.queue.length){try{smStep();}catch(e){console.error("scenery baking failed",e);SM.queue=[];SM.done=true;}return;}
    if(now>SM.checkT){SM.checkT=now+(now-SM.t0<10000?0:500);try{smWatch();}catch(e){}}}
  /* ---- moving things, batched per look (v4) ----
     People, vehicles, loads and anything else drawn on its own share a few materials, so every opaque, single-material
     mesh that shares its look with at least two others is drawn through a dynamic BatchedMesh: one draw per look,
     whatever moves. The originals keep being animated by the game on a hidden layer; right before each render, every
     instance takes its original's current world matrix and visibility. An original that swaps material or geometry
     leaves its batch and is drawn on its own again. Every 3 s, new things join an existing batch (batches are made with
     room to grow); a new look gets its own batch once three things share it. */
  const DB={list:[],bms:[],t:0,n:0};G3.DB=DB;const DBLAYER=30,DBOK=new Set(["MeshStandardMaterial","MeshLambertMaterial","MeshBasicMaterial","MeshPhongMaterial"]);
  function dbOK(o){if(!o.isMesh||o.isInstancedMesh||o.isBatchedMesh||o.isSkinnedMesh||o.userData.smBatch||o.renderOrder)return false;
    const m=o.material,g=o.geometry;if(!m||Array.isArray(m)||!DBOK.has(m.type)||m.transparent||m.opacity<1||!g||!g.isBufferGeometry)return false;
    if(o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender)return false;const a=g.attributes;if(!a.position||!a.normal)return false;
    for(const k in a)if(k!=="position"&&k!=="normal"&&k!=="uv")return false;if(g.morphAttributes&&Object.keys(g.morphAttributes).length)return false;
    return g.drawRange.start===0&&g.drawRange.count===Infinity&&o.matrixWorld.determinant()>0;}
  function dbRelease(){for(const r of DB.list)if(r.o.layers.mask===1<<DBLAYER)r.o.layers.set(0);for(const b of DB.bms){scene.remove(b);b.dispose();}DB.list=[];DB.bms=[];DB.byKey=new Map();}
  DB.byKey=new Map();DB.full=0;
  const dbKey=o=>lookId(o.material)+"|"+(o.castShadow?1:0)+(o.receiveShadow?1:0)+"|"+smSigC(o.geometry);
  function dbAdd(B,o){const g=o.geometry;let gid=B.geos.get(g);
    if(gid===undefined){const nv=g.attributes.position.count,ni=g.index?g.index.count:0;if(B.bm.unusedVertexCount<nv||B.bm.unusedIndexCount<ni)return false;gid=B.bm.addGeometry(g);B.geos.set(g,gid);}
    if(B.bm.instanceCount>=B.bm.maxInstanceCount)return false;
    const iid=B.bm.addInstance(gid);DB.list.push({o,bm:B.bm,iid,mat:o.material,geo:g,ver:g.attributes.position.version});o.layers.set(DBLAYER);return true;}
  // a batch per look, with room to grow, so things created later join without rebuilding anything
  function dbNew(key,L){const geos=new Map();let nv=0,ni=0;
    for(const o of L){const g=o.geometry;if(!geos.has(g)){geos.set(g,-1);nv+=g.attributes.position.count;ni+=g.index?g.index.count:0;}}
    const bm=new THREE.BatchedMesh(Math.ceil(L.length*1.5)+8,Math.ceil(nv*1.5)+64,Math.max(Math.ceil(ni*1.5)+96,1),bmMat(L[0].material));
    bm.perObjectFrustumCulled=false;bm.sortObjects=false;bm.frustumCulled=false;bm.castShadow=L[0].castShadow;bm.receiveShadow=L[0].receiveShadow;
    bm.matrixAutoUpdate=false;bm.userData.smBatch=true;bm.name="moving batch";scene.add(bm);DB.bms.push(bm);
    const B={bm,geos:new Map()};DB.byKey.set(key,B);for(const o of L)dbAdd(B,o);}
  function dbBuild(){DB.builds=(DB.builds||0)+1;
    if(lookKey!==paletteKey&&DB.list.length){dbRelease();}   // new brand colors: regroup from scratch
    const pend=new Map();
    scene.traverse(o=>{if(o.layers.mask!==1||!dbOK(o))return;const key=dbKey(o),B=DB.byKey.get(key);if(B&&dbAdd(B,o))return;
      let L=pend.get(key);if(!L){L=[];pend.set(key,L);}L.push(o);});DB.n=DB.list.length;
    // new looks get their own batch once three or more things share them (checked at most every 15 s after the first pass)
    const now=performance.now();if(DB.full&&now-DB.full<15000)return;DB.full=now;
    pend.forEach((L,key)=>{if(L.length>=3)dbNew(key,L);});DB.n=DB.list.length;}
  G3.dbForce=()=>{if(SM.done&&!SM.off){try{dbBuild();}catch(e){console.error("moving batches failed",e);}}};
  // called right before each render: world matrices are brought up to date once here, and the render skips its own pass
  G3.dbTick=()=>{if(SM.off||!SM.done)return;const now=performance.now();if(now>DB.t){DB.t=now+3000;try{dbBuild();}catch(e){console.error("moving batches failed",e);SM.off=true;dbRelease();return;}}
    scene.updateMatrixWorld();matSync();let out=false;const fn=DB.fn=(DB.fn||0)+1;
    // things that haven't changed for a second are checked every 4th frame (a still forklift starting to move shows
    // up within 4 frames); everything else every frame
    for(const r of DB.list){const o=r.o;if(r.gone)continue;if(r.idle>60&&((fn+r.iid)&3))continue;
      const bc=r.bm.material,om=o.material;
      if(om!==r.mat||o.geometry!==r.geo||o.geometry.attributes.position.version!==r.ver||o.layers.mask!==1<<DBLAYER||!colorSame(om,bc)){r.gone=true;out=true;r.bm.setVisibleAt(r.iid,false);if(o.layers.mask===1<<DBLAYER)o.layers.set(0);continue;}
      // only touch the batch when something changed (each change re-uploads that batch's matrix texture)
      const vis=smShown(o);let ch=false;if(vis!==r.vis){r.vis=vis;ch=true;r.bm.setVisibleAt(r.iid,vis);}
      if(vis){const e=o.matrixWorld.elements,m=r.m||(r.m=new Float32Array(16).fill(NaN));let mc=false;for(let i=0;i<16;i++)if(e[i]!==m[i]){mc=true;m[i]=e[i];}
        if(mc){ch=true;r.bm.setMatrixAt(r.iid,o.matrixWorld);}}
      r.idle=ch?0:(r.idle||0)+1;}
    if(out)DB.list=DB.list.filter(r=>!r.gone);};
