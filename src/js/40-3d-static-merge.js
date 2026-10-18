  /* ---- static scenery batching (v4, three.js BatchedMesh) ----
     On the very first frame, before anything is drawn, every plain opaque mesh is moved into one BatchedMesh per material
     (and shadow flags and vertex layout); a material used by just one object leaves that object alone. Each distinct
     shape is stored once per batch and drawn with one multi-draw call, so the originals never reach the GPU and phones
     get the merge too. The originals stay
     in the scene graph on a hidden layer and are watched (every frame for the first 10 s, then twice a second): anything
     that moves, shows or hides, swaps material or edits its geometry just has its instance hidden and is drawn on its own
     again. Edge outlines, mirrored meshes and roof parts (which fade per roof) still bake into one geometry per material
     and map cell (the v2.9 path, smBuild); a change there rebuilds that one baked batch. */
  const SM={t0:0,done:false,list:[],batches:new Map(),bms:[],dyn:new WeakSet(),checkT:0,queue:null,handedBack:0};G3.SM=SM;(G3.dynLater||[]).forEach(o=>SM.dyn.add(o));   // (v5.7: objects built before SM existed, e.g. the tells)
  // device checks: ?nosm turns the static batching off, ?nodb only the moving batches (each object then draws on its own)
  const BQ=new URLSearchParams(location.search);if(BQ.has("nosm")){SM.off=true;SM.done=true;}
  const _smV=new THREE.Vector3(),_smN=new THREE.Vector3(),_smM3=new THREE.Matrix3(),SMCELL=90,SMLAYER=31;
  function smShown(o){let x=o;for(;x&&x!==scene;x=x.parent){if(!x.visible)return false;if(x.__pg)return true;}return x===scene;}   // (t10: a parked group stands in for the scene)
  /* v5.5 perf: frozen originals are parked in a holder outside the scene graph (SMHOLD), so neither three.js's per-frame
     matrix update nor its render traversal visits them (about 2,500 nodes a frame on a phone). Their record keeps the
     logical parent (r.par) for the watch (position, rotation, scale and parent matrix) and for the hand-back. */
  const SMHOLD=new THREE.Group();SMHOLD.name="parked originals";SM.holder=SMHOLD;
  const smPar=r=>(r.par&&r.o.parent===SMHOLD)?r.par:r.o.parent;
  function smShownR(r){const o=r.o;if(o.parent!==SMHOLD)return smShown(o);if(!o.visible)return false;const p=r.par;return p===scene?true:!!p&&smShown(p);}
  function smExcluded(o){for(let x=o;x&&x!==scene;x=x.parent){if(roofs.includes(x)||SM.dyn.has(x)||x.userData.car||x.userData.act)return true;}return false;}   // (t12: parked cars and activity props move sooner or later: moving batches from the start)
  function smRecord(o){return {o,m:Float64Array.from(o.matrixWorld.elements),mat:o.material,geo:o.geometry,ver:o.geometry.attributes.position.version,key:null};}
  function smSame(r){const o=r.o;if(o.material!==r.mat||o.geometry!==r.geo||o.geometry.attributes.position.version!==r.ver||!smShownR(r))return false;
    if(r.frozen){if(!o.position.equals(r.fp)||!o.quaternion.equals(r.fq)||!o.scale.equals(r.fs))return false;
      const par=smPar(r);if(!par)return false;const e=par.matrixWorld.elements,m=r.pm;for(let i=0;i<16;i++)if(Math.abs(e[i]-m[i])>1e-5)return false;return true;}
    const e=o.matrixWorld.elements,m=r.m;for(let i=0;i<16;i++)if(Math.abs(e[i]-m[i])>1e-5)return false;return true;}
  /* originals drawn by a batch don't need their matrices recomputed every frame: freeze them once the start-up watch
     (10 s) is over and watch their position, rotation, scale and parent instead. Unfrozen on hand-back. */
  function smFreeze(r){const o=r.o;if(r.frozen||!o.parent)return;r.frozen=true;r.fp=o.position.clone();r.fq=o.quaternion.clone();r.fs=o.scale.clone();
    r.pm=Float64Array.from(o.parent.matrixWorld.elements);o.matrixAutoUpdate=false;o.matrixWorldAutoUpdate=false;
    // (leaves only: a parked node's children would never be drawn. Direct children of the scene only: game code reaches
    // parts of its groups by position, e.g. g.children[2], and taking a child out of a group would shift those positions)
    if(!BQ.has("nopark")&&!o.children.length&&o.parent===scene){r.par=o.parent;SMHOLD.add(o);o.__smRec=r;o.add=smParkedAdd;}}
  // a child added to a parked node brings the node back into the scene first (still frozen), so the child is drawn
  function smUnpark(r){const o=r.o;if(o.parent!==SMHOLD)return;SMHOLD.remove(o);delete o.add;delete o.__smRec;if(r.par)r.par.add(o);r.par=null;}
  function smParkedAdd(...a){if(this.__smRec)smUnpark(this.__smRec);return THREE.Object3D.prototype.add.apply(this,a);}
  /* v6.1 t10: whole groups whose every part is a frozen, batched original (buildings, racks, machine frames) are parked
     out of the scene graph too, not only loose parts: three.js then neither updates nor walks ~3,000 nodes a frame. The
     group's own position, rotation, scale and visibility are watched; any change (or a child added) brings it back. */
  const SPG=[];SM.pg=SPG;
  function grpAdd(...a){if(this.__pg)grpUnpark(this.__pg);return THREE.Object3D.prototype.add.apply(this,a);}
  function grpUnpark(e){const g=e.g;if(!g.__pg)return;SMHOLD.remove(g);delete g.__pg;delete g.add;scene.add(g);g.updateMatrixWorld(true);e.out=true;SM.pgOut=(SM.pgOut||0)+1;}
  function grpPark(){if(BQ.has("nogpark"))return;const rec=new Map();for(const r of SM.list)rec.set(r.o,r);let n=0,nodes=0;
    for(const g of [...scene.children]){if(g.isMesh||g.isLine||g.isLight||g.isCamera||g.isBatchedMesh||g.isInstancedMesh||g===SMHOLD||!g.children.length||!g.visible)continue;
      if(SM.dyn.has(g)||roofs.includes(g)||g.userData.smBatch||g.userData.cut||g.userData.car||g.userData.act)continue;let ok=true,c=0;
      g.traverse(x=>{if(!ok)return;c++;if(x===g)return;
        if(SM.dyn.has(x)||roofs.includes(x)||x.isLight||x.isCamera||x.isSprite||x.isPoints||x.isInstancedMesh||x.isBatchedMesh||(x.userData&&(x.userData.cut||x.userData.smBatch))||!x.visible){ok=false;return;}
        if(x.isMesh||x.isLine){const r=rec.get(x);if(!r||!r.frozen||r.proxyOnly||r.single||!(r.bm||r.key)||x.layers.mask!==((1<<SMLAYER)>>>0))ok=false;}
        else if(x.type!=="Group"&&x.type!=="Object3D")ok=false;});
      if(!ok)continue;const e={g,p:g.position.clone(),q:g.quaternion.clone(),s:g.scale.clone()};g.updateMatrixWorld(true);
      SMHOLD.add(g);g.__pg=e;g.add=grpAdd;SPG.push(e);n++;nodes+=c;}
    SM.pgN=(SM.pgN||0)+n;SM.pgNodes=(SM.pgNodes||0)+nodes;if(n)diag(`static groups parked: ${n} (${nodes} nodes out of the scene graph)`);}
  SM.grpPark=grpPark;
  function grpWatch(){for(const e of SPG){if(e.out)continue;const g=e.g;if(!g.visible||!g.position.equals(e.p)||!g.quaternion.equals(e.q)||!g.scale.equals(e.s))grpUnpark(e);}}
  function smThaw(r){for(let x=r.o.parent;x;x=x.parent)if(x.__pg){grpUnpark(x.__pg);break;}   // (t10: anything in a parked group that starts to move brings its group back first)
    {const o=r.o;if(o.userData.fullGeo){o.geometry=o.userData.fullGeo;delete o.userData.fullGeo;}}   // (v6.1 t7: a moving object gets its full shape back)
    if(!r.frozen)return;r.frozen=false;smUnpark(r);const o=r.o;o.matrixAutoUpdate=true;o.matrixWorldAutoUpdate=true;o.updateMatrixWorld(true);}
  function smOK(o){if(!(o.isMesh||o.isLineSegments)||o.isInstancedMesh||o.isSkinnedMesh||o.isSprite||o.isPoints)return false;
    // edge outlines are faint (transparent) lines; merged per material and map cell they look the same, so they're allowed
    // (v4.1 pass 3: the ground shadings under walls and machines are transparent too, but static and flat: baked, below)
    const m=o.material,g=o.geometry;if(!m||Array.isArray(m)||(!o.isLineSegments&&(m.transparent||m.opacity<1)&&!o.userData.aoDecal)||o.renderOrder||!g||!g.isBufferGeometry)return false;
    if(o.layers.mask!==1||o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender)return false;
    const a=g.attributes;if(!a.position||a.position.itemSize!==3)return false;for(const k in a)if(k!=="position"&&k!=="normal"&&k!=="uv")return false;
    if(o.isMesh&&!a.normal)return false;if(g.morphAttributes&&Object.keys(g.morphAttributes).length)return false;
    if(g.drawRange.start!==0||g.drawRange.count!==Infinity)return false;return true;}
  function smBuild(key){const b=SM.batches.get(key);const par=b.parent||scene;if(b.mesh){par.remove(b.mesh);b.mesh.geometry.dispose();b.mesh=null;}
    const L=b.recs;if(!L.length)return;const line=b.line,hasUV=b.uv;let nv=0,ni=0;
    L.forEach(r=>{const g=r.o.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;});
    const CS=b.lvc?4:3;
    const pos=new Float32Array(nv*3),nor=line?null:new Float32Array(nv*3),uv=hasUV?new Float32Array(nv*2):null,col=b.vc||b.lvc?new Float32Array(nv*CS):null,idx=new Uint32Array(ni);let vo=0,io=0;
    L.forEach(r=>{const o=r.o,g=o.geometry,P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,mw=r.mw||o.matrixWorld,flip=!line&&mw.determinant()<0;
      if(!line)_smM3.getNormalMatrix(mw);
      for(let i=0;i<P.count;i++){_smV.set(P.getX(i),P.getY(i),P.getZ(i)).applyMatrix4(mw);pos[(vo+i)*3]=_smV.x;pos[(vo+i)*3+1]=_smV.y;pos[(vo+i)*3+2]=_smV.z;
        if(nor){_smN.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(_smM3).normalize();nor[(vo+i)*3]=_smN.x;nor[(vo+i)*3+1]=_smN.y;nor[(vo+i)*3+2]=_smN.z;}
        if(uv&&U){uv[(vo+i)*2]=U.getX(i);uv[(vo+i)*2+1]=U.getY(i);}
        if(col){const c=o.material.color,j=(vo+i)*CS;col[j]=c.r;col[j+1]=c.g;col[j+2]=c.b;if(CS===4)col[j+3]=b.a1?1:o.material.opacity;}}
      r.v0=vo;r.vn=P.count;r.bk=b;
      const I=g.index,n=I?I.count:P.count;
      if(!line&&flip)for(let k=0;k<n;k+=3){const a=I?I.getX(k):k,b2=I?I.getX(k+1):k+1,c=I?I.getX(k+2):k+2;idx[io+k]=vo+a;idx[io+k+1]=vo+c;idx[io+k+2]=vo+b2;}
      else for(let k=0;k<n;k++)idx[io+k]=vo+(I?I.getX(k):k);
      vo+=P.count;io+=n;});
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));if(nor)geo.setAttribute("normal",new THREE.BufferAttribute(nor,3));
    if(uv)geo.setAttribute("uv",new THREE.BufferAttribute(uv,2));if(col)geo.setAttribute("color",new THREE.BufferAttribute(col,CS));geo.setIndex(new THREE.BufferAttribute(idx,1));geo.computeBoundingSphere();
    const mesh=line?new THREE.LineSegments(geo,b.mat):new THREE.Mesh(geo,b.mat);mesh.castShadow=b.cast;mesh.receiveShadow=b.recv;mesh.matrixAutoUpdate=false;mesh.userData.smBatch=true;mesh.name=b.vc?"flat batch":b.lvc?"outline batch":b.roof?"roof batch":"baked batch";
    par.add(mesh);b.mesh=mesh;if(b.lv){b.lv.forEach(m=>{if(m){par.remove(m);m.geometry.dispose();}});b.lv=null;}if(b.lod)lodApply(b);}
  /* v6.1 t10 detail per zoom step: in the map-wide flat batches the biggest things come first, so at the far zoom steps the
     draw simply stops before the small parts (railings, bolts, journals) that would be under a pixel there anyway. */
  /* v6.1 t10 detail per zoom step. Each map-wide flat batch gets a simpler twin per far zoom step, made the first time that
     step is used: round things rebuilt with fewer sides (a cylinder's own recipe, so the shape is the same), parts too
     small to cover a pixel there left out, faces turned away from the fixed camera dropped. The step picks which twin
     draws. Colour changes and hand-backs reach the twins too. ?nolod = always full detail. */
  const LOD_R=[0.3,0.1],LOD_SEG=[6,8];   // (whole-site step, mid steps: smallest part kept (bounding radius, m); most sides on a round part)
  const smRad=r=>{if(r.rad!=null)return r.rad;const g=r.o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();return r.rad=g.boundingSphere.radius*(r.mw||r.o.matrixWorld).getMaxScaleOnAxis();};
  const SIMP=new Map(),_bA=new THREE.Box3(),_bB=new THREE.Box3(),ROTS=[[0,0,0],[Math.PI/2,0,0],[-Math.PI/2,0,0],[0,0,Math.PI/2],[0,0,-Math.PI/2],[Math.PI,0,0]];
  function simpGeo(g,seg){const k=g.uuid+"|"+seg;let v=SIMP.get(k);if(v!==undefined)return v;v=g;try{const P=g.parameters,t=g.type;let h=null;
      if(P&&t==="CylinderGeometry"&&P.radialSegments>seg)h=new THREE.CylinderGeometry(P.radiusTop,P.radiusBottom,P.height,seg,1,P.openEnded,P.thetaStart,P.thetaLength);
      else if(P&&t==="SphereGeometry"&&P.widthSegments>seg)h=new THREE.SphereGeometry(P.radius,seg,Math.max(3,Math.ceil(seg*0.6)),P.phiStart,P.phiLength,P.thetaStart,P.thetaLength);
      else if(P&&t==="TorusGeometry"&&P.tubularSegments>seg*2)h=new THREE.TorusGeometry(P.radius,P.tube,Math.min(P.radialSegments,4),seg*2,P.arc);
      else if(P&&t==="CircleGeometry"&&P.segments>seg)h=new THREE.CircleGeometry(P.radius,seg,P.thetaStart,P.thetaLength);
      if(h){// (the original may have been turned after it was made: find the turn that fits its bounds, else keep the original)
        g.computeBoundingBox();_bA.copy(g.boundingBox);let ok=null;
        for(const [rx,ry,rz] of ROTS){const c=h.clone();if(rx)c.rotateX(rx);if(rz)c.rotateZ(rz);c.computeBoundingBox();_bB.copy(c.boundingBox);
          const e=Math.max(_bA.min.distanceTo(_bB.min),_bA.max.distanceTo(_bB.max));if(e<0.02*Math.max(0.05,_bA.getSize(_smV).length())){ok=c;break;}c.dispose();}
        h.dispose();if(ok){ok.deleteAttribute("uv");v=ok;}}}catch(e){v=g;}SIMP.set(k,v);return v;}
  const VDIR=new THREE.Vector3(Math.sin(Math.acos(Math.sqrt(1/3)))*Math.sin(-Math.PI/4),Math.sqrt(1/3),Math.sin(Math.acos(Math.sqrt(1/3)))*Math.cos(-Math.PI/4));
  function bakeLevel(b,k){const R=LOD_R[k],SEG=LOD_SEG[k],L=[];for(const r of b.recs)if(r.v0!=null&&smRad(r)>=R)L.push([r,simpGeo(r.o.userData.fullGeo||r.o.geometry,SEG)]);
    let nv=0,ni=0;for(const [r,g] of L){nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
    const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),col=new Float32Array(nv*3),idx=new Uint32Array(ni);let vo=0,io=0;
    for(const [r,g] of L){const o=r.o,P=g.attributes.position,N=g.attributes.normal,mw=r.mw||o.matrixWorld,flip=mw.determinant()<0,c=o.material.color;_smM3.getNormalMatrix(mw);
      for(let i=0;i<P.count;i++){_smV.set(P.getX(i),P.getY(i),P.getZ(i)).applyMatrix4(mw);const j=(vo+i)*3;pos[j]=_smV.x;pos[j+1]=_smV.y;pos[j+2]=_smV.z;
        _smN.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(_smM3).normalize();nor[j]=_smN.x;nor[j+1]=_smN.y;nor[j+2]=_smN.z;col[j]=c.r;col[j+1]=c.g;col[j+2]=c.b;}
      const I=g.index,n=I?I.count:P.count;
      for(let q=0;q<n;q+=3){let a=vo+(I?I.getX(q):q),bb=vo+(I?I.getX(q+1):q+1),cc=vo+(I?I.getX(q+2):q+2);if(flip){const t=bb;bb=cc;cc=t;}
        const ux=pos[bb*3]-pos[a*3],uy=pos[bb*3+1]-pos[a*3+1],uz=pos[bb*3+2]-pos[a*3+2],wx=pos[cc*3]-pos[a*3],wy=pos[cc*3+1]-pos[a*3+1],wz=pos[cc*3+2]-pos[a*3+2];
        if(b.mat.side===THREE.FrontSide&&(uy*wz-uz*wy)*VDIR.x+(uz*wx-ux*wz)*VDIR.y+(ux*wy-uy*wx)*VDIR.z<=1e-7)continue;idx[io++]=a;idx[io++]=bb;idx[io++]=cc;}
      (r.lv||(r.lv=[]))[k]=[vo,P.count];vo+=P.count;}
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));geo.setAttribute("normal",new THREE.BufferAttribute(nor,3));geo.setAttribute("color",new THREE.BufferAttribute(col,3));
    geo.setIndex(new THREE.BufferAttribute(idx.slice(0,io),1));geo.computeBoundingSphere();
    const m=new THREE.Mesh(geo,b.mat);m.matrixAutoUpdate=false;m.userData.smBatch=true;m.name="flat batch (zoom step "+k+")";(b.parent||scene).add(m);
    for(const r of b.recs)if(r.lv&&r.lv[k]&&!L.some(x=>x[0]===r))r.lv[k]=null;return m;}
  let lodK=-1;G3.lodLevel=()=>lodK;
  function lodApply(b){if(!b.mesh)return;const k=G3.lodOff||BQ.has("nolod")?-1:lodK;
    if(k>=0&&!(b.lv&&b.lv[k])){try{(b.lv||(b.lv=[]))[k]=bakeLevel(b,k);}catch(e){smErr("zoom detail",e);b.lod=false;return;}}
    b.mesh.visible=k<0;if(b.lv)b.lv.forEach((m,i)=>{if(m)m.visible=i===k;});}
  G3.lodSet=k=>{if(k===lodK)return;lodK=k;SM.batches.forEach(b=>{if(b.lod)lodApply(b);});
    // (flat BatchedMeshes: parts under a pixel at this step are simply switched off in their batch)
    const kk=G3.lodOff||BQ.has("nolod")?-1:k;for(const bm of SM.bms){const L=bm.userData.lodRecs;if(!L)continue;for(const r of L){if(r.out||r.bm!==bm)continue;const on=kk<0||smRad(r)>=LOD_R[kk];if(on!==(r.lodOn!==false)){r.lodOn=on;bm.setVisibleAt(r.iid,on);}}}};
  // (a colour change or a hand-back, applied to an object's vertices in every built twin as well)
  function lvEach(r,fn){const b=r.bk;if(!b||!b.lv||!r.lv)return;b.lv.forEach((m,k)=>{const e=r.lv[k];if(m&&e)fn(m,e[0],e[1]);});}
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
  // v4.0.1: moving batches are white and give each object its own color (BatchedMesh.setColorAt), so things that
  // differ only in color share one draw. Their copy stays out of MATS (the palette would tint it) and skips color sync.
  function flatMat(m){const c=m.clone();c.userData={};c.color.setRGB(1,1,1);MSYNC.push([c,m,true]);return c;}   // (white; colour per object)
  const FLATB=!BQ.has("noflat");
  function dbMat(m){const c=m.clone();c.userData=Object.assign({},m.userData);if(!DBMAT)c.color.setRGB(1,1,1);if(!DBCOL)c.vertexColors=true;if(MROW)mrowMat(c);MSYNC.push([c,m,true]);return c;}
  // same look as the batch: compared at 8-bit precision (look-alike materials differ in the last float bits)
  const colorSame=(a,b)=>a.color.getHex()===b.color.getHex()&&(!a.emissive||(a.emissive.getHex()===b.emissive.getHex()&&a.emissiveIntensity===b.emissiveIntensity));
  const emSame=(a,b)=>!a.emissive||(a.emissive.getHex()===b.emissive.getHex()&&a.emissiveIntensity===b.emissiveIntensity);
  function matSync(){for(let k=0;k<MSYNC.length;k++){const e=MSYNC[k],c=e[0],m=e[1],nc=e[2];if(!nc&&!c.color.equals(m.color))c.color.copy(m.color);
    if(m.emissive&&!c.emissive.equals(m.emissive))c.emissive.copy(m.emissive);if(m.emissiveIntensity!==c.emissiveIntensity)c.emissiveIntensity=m.emissiveIntensity;}}
  // the look of a moving batch leaves out color (and the palette token that sets it): each object carries its own
  const dbLookCache=new WeakMap(),dbLookIds=new Map();
  function dbLookId(m){let v=dbLookCache.get(m);if(v===undefined){
      const s=smLook(Object.assign(Object.create(m),{color:null,userData:{}}));v=dbLookIds.get(s);if(v===undefined){v=dbLookIds.size;dbLookIds.set(s,v);}dbLookCache.set(m,v);}return v;}
  const sigCache=new WeakMap();const smSigC=g=>{let v=sigCache.get(g);if(v===undefined){v=smSig(g);sigCache.set(g,v);}return v;};
  const smSig=g=>Object.keys(g.attributes).sort().map(k=>k+g.attributes[k].itemSize+(g.attributes[k].normalized?"n":"")).join(",")+(g.index?"|i":"|n");
  // one BatchedMesh for a group of records that share material, shadow flags and vertex layout
  // (flat batches on the vertex-colour path: one coloured copy of a shape per colour, shared by every object of that colour)
  const FLATVC=new Map();const flatGeo=r=>{const g=r.o.geometry,h=r.o.material.color.getHex(),k=g.uuid+"|"+h;let v=FLATVC.get(k);if(!v){v=vcGeo(g,r.o.material.color);FLATVC.set(k,v);}return v;};
  function bmBuild(grp){const geos=new Map();let nv=0,ni=0;const vc=grp.flat&&!DBCOL,gOf=r=>vc?flatGeo(r):r.o.geometry;
    for(const r of grp.recs){const g=gOf(r);if(!geos.has(g)){geos.set(g,-1);nv+=g.attributes.position.count;ni+=g.index?g.index.count:0;}}
    const mr=grp.flat&&MROW;const fm=grp.flat?flatMat(grp.mat):null;if(fm&&vc)fm.vertexColors=true;if(mr)mrowMat(fm);
    const bm=new THREE.BatchedMesh(grp.recs.length,nv,Math.max(ni,1),fm||bmMat(grp.mat));if(mr){mrowBM(bm);bm.userData.lodRecs=grp.recs;}
    for(const g of geos.keys())geos.set(g,bm.addGeometry(g));
    for(const r of grp.recs){r.bm=bm;r.shared=true;r.iid=bm.addInstance(geos.get(gOf(r)));if(vc)r.flatVC=true;bm.setMatrixAt(r.iid,r.o.matrixWorld);r.o.layers.set(SMLAYER);
      if(grp.flat){r.flat=true;r.hex=r.o.material.color.getHex();if(mr)bm.mrowCol(r.iid,r.o.material.color);else if(!vc)bm.setColorAt(r.iid,r.o.material.color);}}
    // v5.5 perf: per-object frustum culling is on again (phones look at a third of the mill at the default zoom, so most
    // batched triangles were off-screen vertex work); three.js rebuilds each batch's draw list per pass for it, which the
    // benchmark showed to be cheaper than drawing everything. No sorting (the batches are opaque).
    bm.perObjectFrustumCulled=!BQ.has("nocull");bm.sortObjects=false;
    bm.castShadow=grp.cast;bm.receiveShadow=grp.recv;bm.matrixAutoUpdate=false;bm.userData.smBatch=true;bm.name="scenery batch";
    bm.computeBoundingBox();bm.computeBoundingSphere();scene.add(bm);SM.bms.push(bm);}
  /* v6.1 t2 flat batches: with no shadow maps and one lighting model, untextured opaque materials that differ only in colour
     share one batch: white, each object carrying its own colour (BatchedMesh.setColorAt, the moving batches' method). The
     watch (smWatch) copies a material's colour change to its objects instead of handing them back. ~50 draws became a few. */
  const flatOK=m=>FLATB&&!m.transparent&&m.opacity===1&&!m.vertexColors&&SMMAPS.every(k=>!m[k])&&(!m.emissive||m.emissive.getHex()===0);
  const FVC=+(BQ.get("fvcell")||0);   // (map cell for the flat batches, m; 0 = map-wide)
  function smMerge(){const groups=new Map(),shd=renderer.shadowMap.enabled;
    for(const r of SM.list){const o=r.o,g=o.geometry;if(r.proxyOnly)continue;
      // v6.1 t3: on iPhone/iPad (or wherever batch colours fail) a flat look is baked instead: one plain vertex-coloured
      // mesh per look and 90 m map cell, the method the scenery already uses there (a BatchedMesh's per-object colour draws grey)
      // v6.1 t10: everywhere now (not only iPhone), map-wide (no 90 m cells: the fixed view sees most of the map, and ~40k
      // vertices cost the GPU nothing next to a draw each), without texture coordinates (nothing flat samples a texture)
      if(o.isMesh&&!o.userData.aoDecal&&flatOK(o.material)&&(BQ.has("flatbake")||(!MROW&&(DBMAT||DBOFF)))){   /* (t10: with colour in the matrix, flat looks stay BatchedMeshes everywhere: one draw per look AND per-object culling; baking is the fallback) */
        let cx=0,cz=0;if(FVC){if(!g.boundingSphere)g.computeBoundingSphere();_smV.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);cx=Math.floor(_smV.x/FVC);cz=Math.floor(_smV.z/FVC);}
        const key=["FV",smLook(Object.assign(Object.create(o.material),{color:null,userData:{}})),cx,cz].join("|");
        let b=SM.batches.get(key);if(!b){const fm=flatMat(o.material);fm.vertexColors=true;b={recs:[],mat:fm,line:false,uv:false,cast:o.castShadow,recv:o.receiveShadow,mesh:null,vc:true,lod:!BQ.has("nolod")};SM.batches.set(key,b);}
        b.recs.push(r);r.key=key;r.flat=true;r.flatVC=true;r.hex=o.material.color.getHex();continue;}
      if(o.isMesh&&o.matrixWorld.determinant()>0&&!o.userData.aoDecal){const flat=flatOK(o.material)&&!DBOFF&&!DBMAT;
        const key=[flat?"F/"+smLook(Object.assign(Object.create(o.material),{color:null,userData:{}})):smLook(o.material),shd&&o.castShadow?1:0,shd&&o.receiveShadow?1:0,smSig(g)].join("|");
        let G=groups.get(key);if(!G){G={recs:[],mat:o.material,cast:o.castShadow,recv:o.receiveShadow,flat};groups.set(key,G);}G.recs.push(r);continue;}
      // outlines and mirrored meshes: bake per material and 90 m map cell (off-screen cells are still culled)
      if(!g.boundingSphere)g.computeBoundingSphere();_smV.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);
      // (a ground shading decal goes in one map-wide batch per material: two draws for all of them, never culled)
      const line=!!o.isLineSegments,uv=!!g.attributes.uv,cell=o.userData.aoDecal||o.isLineSegments?0:SMCELL,   /* (v6.1 t8: outlines map-wide, one draw per line style) */
        // (v6.1 t10: all outline styles in one draw: each line's colour and opacity go into its vertices)
        lm=o.material,lvc=line&&!BQ.has("linestyles")&&lm.type==="LineBasicMaterial"&&!lm.map&&!lm.vertexColors,
        key=lvc?["LV",lm.depthTest?1:0,lm.depthWrite?1:0,lm.blending].join("|"):[line?"L":"M",o.material.uuid,o.castShadow?1:0,o.receiveShadow?1:0,uv?1:0,cell?Math.floor(_smV.x/cell):0,cell?Math.floor(_smV.z/cell):0].join("|");
      let b=SM.batches.get(key);if(!b){const bmat=lvc?new THREE.LineBasicMaterial({vertexColors:true,transparent:true,depthTest:lm.depthTest,depthWrite:lm.depthWrite,blending:lm.blending,fog:lm.fog,toneMapped:lm.toneMapped}):o.material;
        b={recs:[],mat:bmat,line,uv:lvc?false:uv,cast:o.castShadow,recv:o.receiveShadow,mesh:null,lvc};SM.batches.set(key,b);}
      b.recs.push(r);r.key=key;}
    // a group of one gains nothing from batching: that object simply stays as it is and is no longer watched
    groups.forEach(G=>{if(G.recs.length>1)bmBuild(G);else G.recs[0].single=true;});
    // roofs fade with zoom, so each roof is baked inside its own group (it keeps fading and hiding as a whole)
    let roofN=0;roofs.forEach((g,gi)=>{g.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(g.matrixWorld).invert();
      g.traverse(o=>{if(o===g||!smOK(o)&&!(o.isMesh&&o.material&&!Array.isArray(o.material)&&o.material.transparent))return;if(o.isInstancedMesh||Array.isArray(o.material)||o.layers.mask!==1)return;
        const a=o.geometry&&o.geometry.attributes;if(!a||!a.position||(o.isMesh&&!a.normal))return;for(const k in a)if(k!=="position"&&k!=="normal"&&k!=="uv")return;
        let x=o;for(;x&&x!==g;x=x.parent)if(!x.visible)return;
        const line=!!o.isLineSegments;if(!line&&!o.isMesh)return;const uv=!!a.uv,om=o.material,MS=g.userData.mats||[];
        // v6.1 t10: a roof's untextured parts share one vertex-coloured draw, and its outlines another (glass keeps its own: it
        // fades to a different opacity). The shared materials join the roof's fade list, so they lift and fade with it.
        const one=!BQ.has("roofsplit")&&!om.map&&om!==MS[2]&&(line?om.type==="LineBasicMaterial":(om.type==="MeshLambertMaterial"||om.type==="MeshStandardMaterial")),
          key=one?[line?"RL":"RV",gi,line?0:om.side].join("|"):["R",gi,line?"L":"M",om.uuid,o.castShadow?1:0,o.receiveShadow?1:0,uv?1:0].join("|");
        let b=SM.batches.get(key);if(!b){let bmat=om;
          if(one){bmat=line?new THREE.LineBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,opacity:om.opacity}):new THREE.MeshLambertMaterial({vertexColors:true,side:om.side,transparent:om.transparent,opacity:om.opacity,depthWrite:om.depthWrite});
            if(g.userData.mats)g.userData.mats.push(bmat);}
          b={recs:[],mat:bmat,line,uv:one?false:uv,cast:o.castShadow,recv:o.receiveShadow,mesh:null,parent:g,roof:true,vc:one&&!line,lvc:one&&line,a1:one};SM.batches.set(key,b);}
        b.recs.push({o,mw:new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld),key});roofN++;});});
    SM.queue=[...SM.batches.keys()];SM.roofN=roofN;shBuild();
    // (the merged roofs bake their colours: a brand or theme change re-bakes them)
    if(!SM.rbHook){SM.rbHook=true;const rb=G3.rebrand;G3.rebrand=()=>{if(rb)rb();SM.batches.forEach((b,k)=>{if(b.roof&&(b.vc||b.lvc)&&b.mesh)try{smBuild(k);}catch(e){}});};}}
  // baked batches are built a few per frame (no single long stall at start-up, which phones punish)
  const kindRank=o=>o.isBatchedMesh?(o._colorsTexture?4:3):o.isInstancedMesh?(o.instanceColor?2:1):0,kindCmp=(a,b)=>kindRank(a)-kindRank(b);
  function sortKinds(){const c=scene.children;for(let i=1;i<c.length;i++)if(kindRank(c[i-1])>kindRank(c[i])){c.sort(kindCmp);return;}}   // (v5.2: an O(n) check first; a full sort only when out of order)   // (stable: everything else keeps its order; also after each moving-batch build, so new batches and trucks fall in line)
  function smStep(){const N=mobile?6:30;for(let i=0;i<N&&SM.queue.length;i++){const key=SM.queue.shift(),b=SM.batches.get(key);
      if(!b.roof)b.recs=b.recs.filter(r=>smSame(r));smBuild(key);b.recs.forEach(r=>r.o.layers.set(SMLAYER));}
    if(SM.queue.length)return;SM.done=true;
    // v4.1 pass 3: the shadow pass visits the scene's children in order and re-derives its depth shader (a few KB of garbage
    // and a cache-key string each time) whenever it steps between a plain mesh, an instanced mesh and a batch. Grouping the
    // children by kind once here cuts that to a handful of switches per pass. Draw order is unaffected: the main pass sorts.
    sortKinds();
    const inst=SM.bms.reduce((a,b)=>a+b.instanceCount,0),baked=[...SM.batches.values()].reduce((a,b)=>a+(b.roof?0:b.recs.length),0);
    console.info(`scenery: ${inst} objects in ${SM.bms.length} batched meshes; ${baked} outlines/mirrored + ${SM.roofN} roof parts baked into ${SM.batches.size} batches; shadows: ${SH.meshes.length} proxies`);}
  // anything that changes is handed back (drawn on its own again): a batched instance is just hidden, a baked batch is rebuilt
  function vcRange(mesh,v0,n,c){const a=mesh.geometry.attributes.color;if(!a)return;const A=a.array,st=a.itemSize;for(let i=v0;i<v0+n;i++){A[i*st]=c.r;A[i*st+1]=c.g;A[i*st+2]=c.b;}a.addUpdateRange(v0*st,n*st);a.needsUpdate=true;}
  /* v6.1 t12: an object whose colour has changed once (beacons, alarm and status lights) is followed every frame from then
     on, so it blinks in time; the watch itself still runs twice a second */
  SM.anim=new Set();
  G3.smColTick=()=>{if(!SM.anim.size)return;for(const r of SM.anim){if(r.out){SM.anim.delete(r);continue;}const c=r.o.material.color,h=c.getHex();if(h===r.hex)continue;
      if(r.bm&&r.bm.mrowCol&&!r.out){r.hex=h;r.bm.mrowCol(r.iid,c);}else if(r.bm&&!r.flatVC){r.hex=h;r.bm.setColorAt(r.iid,c);}else if(r.flatVC&&!r.bm&&r.bk&&r.bk.mesh&&r.v0!=null){r.hex=h;vcRange(r.bk.mesh,r.v0,r.vn,c);lvEach(r,(m,v0,n)=>vcRange(m,v0,n,c));}}};
  function smWatch(){const dirty=SM.dirty||(SM.dirty=new Set());
    const freeze=performance.now()-SM.t0>10000;
    // (v4.1 pass 3: compacted in place twice a second instead of filtered into a new 2,700-entry array)
    const keep=r=>{let recol=false;if(r.flat&&smSame(r)){const h=r.o.material.color.getHex();if(h!==r.hex){SM.anim.add(r);if(r.flatVC&&!r.bm&&r.bk&&r.bk.mesh&&r.v0!=null){r.hex=h;vcRange(r.bk.mesh,r.v0,r.vn,r.o.material.color);lvEach(r,(m,v0,n)=>vcRange(m,v0,n,r.o.material.color));}else if(r.flatVC||!r.bm)recol=true;else{r.hex=h;if(r.bm.mrowCol)r.bm.mrowCol(r.iid,r.o.material.color);else r.bm.setColorAt(r.iid,r.o.material.color);}}}   // (v6.1 t2: a flat batch follows colour changes; t10: a baked one rewrites that object's vertex colours in place)
      const bmat=r.bm?r.bm.material:r.bk?r.bk.mat:null;   // (t10: baked records have no BatchedMesh; reading r.bm.material threw and stopped the whole watch on iPhone)
      if(!recol&&smSame(r)&&!(r.shared&&!r.flat&&bmat&&!colorSame(r.o.material,bmat))&&!(r.flat&&bmat&&!emSame(r.o.material,bmat))){if(freeze&&(r.bm||r.key))smFreeze(r);return true;}
      smThaw(r);
      if(r.shadow){r.o.castShadow=true;r.shadow=false;if(!shDrop(r))SH.dirty=true;}   // v4.0.1: cut it out of the proxy instead of rebuilding it
      if(r.bm){r.out=true;r.bm.setVisibleAt(r.iid,false);r.o.layers.set(0);SM.dyn.add(r.o);SM.handedBack++;return false;}
      if(r.single||r.proxyOnly){SM.dyn.add(r.o);SM.handedBack++;return false;}
      if(r.o.layers.mask===1&&!r.key)return true;
      r.o.layers.set(0);SM.dyn.add(r.o);SM.handedBack++;const b=SM.batches.get(r.key);if(b){b.recs=b.recs.filter(x=>x!==r);
        // (t10: in a baked batch the object's vertices are folded to a point: one small upload instead of rebuilding the batch)
        if(r.bk===b&&b.mesh&&r.v0!=null&&!b.roof){const a=b.mesh.geometry.attributes.position;a.array.fill(0,r.v0*3,(r.v0+r.vn)*3);a.addUpdateRange(r.v0*3,r.vn*3);a.needsUpdate=true;r.v0=null;
          lvEach(r,(m,v0,n)=>{const p=m.geometry.attributes.position;p.array.fill(0,v0*3,(v0+n)*3);p.addUpdateRange(v0*3,n*3);p.needsUpdate=true;});r.lv=null;}
        else dirty.add(r.key);}return false;};
    if(SPG.length)grpWatch();
    const L=SM.list;let w=0;for(let i=0;i<L.length;i++){const r=L[i];if(keep(r))L[w++]=r;}if(w<L.length)L.length=w;
    if(freeze&&!SM.pgDone&&performance.now()-SM.t0>30000){SM.pgDone=true;   /* (t12: parked after 30 s, once the start-of-play movers have shown themselves) */try{grpPark();}catch(e){smErr("parking groups",e);}}
    if(dirty.size){let n=0;for(const k of dirty){if(n++>=2)break;dirty.delete(k);smBuild(k);}}
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
  function shBuild(){if(!renderer.shadowMap.enabled)return;   /* (v6.1: no shadow maps, no proxies) */SH.builds=(SH.builds||0)+1;for(const m of SH.meshes){scene.remove(m);m.geometry.dispose();}SH.meshes=[];
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
  // v4.2.5: batching failures go to Diagnostics (the first 5, then a count), not only the console or nowhere
  const smErr=(what,e)=>{SM.errs=(SM.errs||0)+1;if(SM.errs<=5)diag(`batching: ${what} failed: ${String(e&&e.message||e).slice(0,120)}`);else if(SM.errs===6)diag("batching: more failures, not logged");};
  function smTick(now){if(SM.off)return;
    if(!SM.t0){SM.t0=now;try{scene.updateMatrixWorld(true);try{if(G3.paperize)G3.paperize();}catch(e){console.error("paperize failed",e);}try{if(G3.atlasSigns)G3.atlasSigns();}catch(e){console.error("sign atlas failed",e);}try{if(G3.splitMulti)G3.splitMulti();scene.updateMatrixWorld(true);}catch(e){console.error("split failed",e);}try{if(G3.dropBuild)G3.dropBuild();}catch(e){console.error("drop shadows failed",e);}smSnapshot();try{if(G3.stripBack&&!BQ.has("nostrip"))G3.stripBack(SM.list);}catch(e){console.error("strip failed",e);}smMerge();}
      catch(e){console.error("scenery batching failed",e);smErr("scenery batching (batching off)",e);SM.off=true;SM.done=true;SM.list.forEach(r=>{r.o.layers.set(0);if(r.bm)r.bm.visible=false;});}return;}
    if(SM.queue&&SM.queue.length){try{smStep();}catch(e){console.error("scenery baking failed",e);smErr("scenery baking",e);SM.queue=[];SM.done=true;}return;}
    if(now>SM.checkT){SM.checkT=now+(now-SM.t0<10000?0:500);try{smWatch();}catch(e){smErr("watch for moved objects",e);}}}
  /* ---- moving things, batched per look (v4) ----
     People, vehicles, loads and anything else drawn on its own share a few materials, so every opaque, single-material
     mesh that shares its look with at least two others is drawn through a dynamic BatchedMesh: one draw per look,
     whatever moves. The originals keep being animated by the game on a hidden layer; right before each render, every
     instance takes its original's current world matrix and visibility. An original that swaps material or geometry
     leaves its batch and is drawn on its own again. Every 3 s, new things join an existing batch (batches are made with
     room to grow); a new look gets its own batch once three things share it. */
  const DB={list:[],bms:[],t:0,n:0};G3.DB=DB;
  // v4.1 pass 7: per-object colours (BatchedMesh.setColorAt, a float texture read in the vertex shader) came out white on
  // iPhone Safari (people, forklifts, frames and railings all grey). Each object instead gets its own copy of its geometry in
  // the batch with its colour baked in as vertex colours (the material has vertexColors), still one draw per look.
  // The vertex-colour path is also lighter everywhere (fewer leftover objects drawn on their own: 199 vs 231 main-pass draws
  // on the phone benchmark), so it is the default on every device; ?dbcol=1 brings back the colour texture for comparison.
  // v4.1 pass 8: neither colour method could be checked on the device that failed (iPhone), so the game checks for itself:
  // a red cube is drawn off-screen as a one-object batch with each method and the pixel read back. The first method that
  // comes out red is used; if neither does, moving things are drawn one by one (correct colours, more draws). ?dbcol=1/0
  // forces the texture / vertex-colour method. The result goes to the diagnostics log.
  function batchProbe(){const out={};try{
      const rt=new THREE.WebGLRenderTarget(4,4),sc=new THREE.Scene(),cam=new THREE.OrthographicCamera(-1,1,1,-1,0.1,10),red=new THREE.Color(1,0,0),g=new THREE.BoxGeometry(0.9,1.6,1.6);
      sc.add(new THREE.AmbientLight(0xffffff,Math.PI));cam.position.z=5;const shNeed=renderer.shadowMap.needsUpdate,cc=renderer.getClearColor(new THREE.Color()),ca=renderer.getClearAlpha();
      // two objects in one batch, red on the left and green on the right: both must come out in their own colour
      const green=new THREE.Color(0,1,0),M4=new THREE.Matrix4();
      for(const mode of ["vc","tex"]){const m=new StdMat({color:0xffffff});if(mode==="vc")m.vertexColors=true;
        const bm=new THREE.BatchedMesh(4,g.attributes.position.count*4,g.index.count*4,m);bm.perObjectFrustumCulled=false;bm.frustumCulled=false;
        [[red,-0.5],[green,0.5]].forEach(([c,x])=>{const ii=bm.addInstance(bm.addGeometry(mode==="vc"?vcGeo(g,c):g));if(mode==="tex")bm.setColorAt(ii,c);bm.setMatrixAt(ii,M4.makeTranslation(x,0,0));});
        sc.add(bm);renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,1);renderer.clear();renderer.render(sc,cam);
        const L=new Uint8Array(4),Rr=new Uint8Array(4);renderer.readRenderTargetPixels(rt,0,1,1,1,L);renderer.readRenderTargetPixels(rt,3,1,1,1,Rr);renderer.setRenderTarget(null);sc.remove(bm);bm.dispose();m.dispose();
        out[mode]=L[0]>110&&L[1]<90&&L[2]<90&&Rr[1]>110&&Rr[0]<90&&Rr[2]<90;out[mode+"px"]=Array.from(L).join(",")+"/"+Array.from(Rr).join(",");}
      rt.dispose();g.dispose();renderer.setClearColor(cc,ca);renderer.shadowMap.needsUpdate=shNeed;}catch(e){out.err=String(e).slice(0,80);}return out;}
  /* v6.1 t10 colour in the matrix: each moving object's colour rides in the unused bottom row of its own instance matrix
     (the batch's matrix texture: the one per-object channel that demonstrably works on iPhone, since every batch's
     positions come out right there). The batch shader reads it and clears it before using the matrix. So every device
     gets one batch per look whatever the colours (iPhone had one per colour: ~45 draws), objects share their batch's
     geometry (no coloured copy each), and a colour change or a move uploads just that object's 64 bytes. ?dbold = before. */
  const MROW=!BQ.has("dbold")&&!BQ.get("dbcol");G3.MROW=MROW;
  function mrowMat(c){c.onBeforeCompile=sh=>{sh.vertexShader="varying vec3 vMrow;\n"+sh.vertexShader.replace("#include <batching_vertex>",
      "#include <batching_vertex>\n#ifdef USE_BATCHING\nvMrow=vec3(batchingMatrix[0][3],batchingMatrix[1][3],batchingMatrix[2][3]);batchingMatrix[0][3]=0.0;batchingMatrix[1][3]=0.0;batchingMatrix[2][3]=0.0;\n#else\nvMrow=vec3(1.0);\n#endif");
    sh.fragmentShader="varying vec3 vMrow;\n"+sh.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );","vec4 diffuseColor = vec4( diffuse*vMrow, opacity );");};
    c.customProgramCacheKey=()=>"mrow";c.vertexColors=false;return c;}
  G3.mrowMat=mrowMat;
  // (more than this many objects changed in one batch in a frame: upload its whole matrix texture once instead)
  const MR_MAX=24;
  function mrowBM(bm){bm.userData.mrow=true;
    const mark=(T,o)=>{if(T.userData.full)return;if(T.updateRanges.length>=MR_MAX){T.clearUpdateRanges();T.userData.full=true;}else T.addUpdateRange(o,16);};
    bm.setMatrixAt=function(i,m){const T=this._matricesTexture,A=T.image.data,o=i*16,r=A[o+3],g=A[o+7],b=A[o+11];m.toArray(A,o);A[o+3]=r;A[o+7]=g;A[o+11]=b;A[o+15]=1;mark(T,o);T.needsUpdate=true;return this;};
    bm.getMatrixAt=function(i,m){m.fromArray(this._matricesTexture.image.data,i*16);const e=m.elements;e[3]=e[7]=e[11]=0;e[15]=1;return m;};
    bm.mrowCol=(i,c)=>{const T=bm._matricesTexture,A=T.image.data,o=i*16;A[o+3]=c.r;A[o+7]=c.g;A[o+11]=c.b;mark(T,o);T.needsUpdate=true;};}
  const BPR=BQ.get("dbcol")||MROW?{}:batchProbe();
  let DBCOL=BQ.get("dbcol")==="1"||(!BQ.get("dbcol")&&!BPR.vc&&!!BPR.tex);// v4.1 pass 9: on iPhone and iPad both methods pass the probe yet the real batches still draw grey (shown on an iPhone,
  // iOS 18.7, Apple GPU); drawing moving things one by one (?nodb) shows correct colours there, so iOS uses that.
  // ?dbcol=0 (vertex) or ?dbcol=1 (texture) still forces batches on for testing.
  const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  // v4.1 v15: iOS gets colour-keyed moving batches instead of drawing one by one: the batch's own material carries the
  // colour (exactly as the static batches do, which draw correctly there), so no per-object colour method is used at all;
  // things of one look but different colours go to different batches. ?dbios=off goes back to one by one.
  const DBMAT=!MROW&&IOS&&!BQ.get("dbcol")&&BQ.get("dbios")!=="off";if(DBMAT||MROW)DBCOL=true;
  const DBOFF=!MROW&&!BQ.get("dbcol")&&!DBMAT&&(IOS||(!BPR.vc&&!BPR.tex));G3.DBCOL=DBCOL;G3.DBMAT=DBMAT;
  diag(`batch colours: vertex ${BPR.vc===undefined?"-":BPR.vc?"ok":"FAIL ("+BPR.vcpx+")"}, texture ${BPR.tex===undefined?"-":BPR.tex?"ok":"FAIL ("+BPR.texpx+")"}${BPR.err?" error "+BPR.err:""} -> ${MROW?"colour in the matrix":DBOFF?(IOS?"iOS: ":"")+"moving things drawn one by one":DBMAT?"iOS: colour-keyed batches":DBCOL?"texture":"vertex"}`);const DBLAYER=30,DBOK=new Set(["MeshStandardMaterial","MeshLambertMaterial","MeshBasicMaterial","MeshPhongMaterial","MeshMatcapMaterial"]);
  function dbOK(o){if(!o.isMesh||o.isInstancedMesh||o.isBatchedMesh||o.isSkinnedMesh||o.userData.smBatch||o.renderOrder)return false;
    // (t10 QA: never a part of a cut-out actor: their parts keep frozen world matrices, so a batch drew them where the
    // picture was last taken: floating limbs, and trucks as bare red and blue boxes in the wrong place)
    if(G3.CUT&&G3.CUT.ok)for(let x=o;x;x=x.parent)if(x.userData&&x.userData.cut)return false;
    const m=o.material,g=o.geometry;if(!m||Array.isArray(m)||!DBOK.has(m.type)||m.transparent||m.opacity<1||!g||!g.isBufferGeometry)return false;
    if(o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender)return false;const a=g.attributes;if(!a.position||!a.normal)return false;
    for(const k in a)if(k!=="position"&&k!=="normal"&&k!=="uv")return false;if(g.morphAttributes&&Object.keys(g.morphAttributes).length)return false;
    return g.drawRange.start===0&&g.drawRange.count===Infinity&&o.matrixWorld.determinant()>0;}
  function dbRelease(){if(DB.q)DB.q.clear();for(const r of DB.list)if(r.o.layers.mask===1<<DBLAYER)r.o.layers.set(0);for(const b of DB.bms){scene.remove(b);b.dispose();}DB.list=[];DB.bms=[];DB.byKey=new Map();}
  DB.byKey=new Map();DB.full=0;const DBMIN=3;   // (t10: with colour out of the look, two things sharing one are worth a batch)
  const dbKey=o=>dbLookId(o.material)+"|"+(renderer.shadowMap.enabled?(o.castShadow?1:0)+""+(o.receiveShadow?1:0):"")+"|"+smSigC(o.geometry)+(DBMAT?"|"+o.material.color.getHex():"");
  // a geometry that shares g's buffers and adds a colour attribute filled with c (for the vertex-colour path)
  function vcGeo(g,c,h){const n=g.attributes.position.count;if(!h){h=new THREE.BufferGeometry();for(const k in g.attributes)h.setAttribute(k,g.attributes[k]);if(g.index)h.setIndex(g.index);
      h.setAttribute("color",new THREE.BufferAttribute(new Float32Array(n*3),3));}
    const a=h.attributes.color.array;for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}h.attributes.color.needsUpdate=true;return h;}
  G3.vcGeo=vcGeo;const VCG=new WeakMap();
  // recolour one object in place: write its colour into the batch's own colour buffer over that geometry's vertex range
  // (three r186 keeps the ranges in _geometryInfo); no allocation, one small upload
  function vcSet(bm,gid,c){const gi=bm._geometryInfo[gid],at=bm.geometry.attributes.color;if(!gi||!at)return;const a=at.array,s=gi.vertexStart,n=gi.vertexCount;
    for(let i=s;i<s+n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}at.addUpdateRange(s*3,n*3);at.needsUpdate=true;}
  // (vertex-colour path: a slot freed by an object that left this batch is reused by the next object of the same shape, so
  // batches don't grow as forklift loads, people and trucks come and go)
  const vcFree=(B,r)=>{if(MROW&&B&&r.bm&&r.iid!=null&&!r.freed){r.freed=true;try{r.bm.deleteInstance(r.iid);}catch(e){}return;}if(DBCOL||!B)return;let f=B.free.get(r.geo);if(!f)B.free.set(r.geo,f=[]);f.push(r.iid,r.gid);};
  function dbAdd(B,o){const g=o.geometry,c=o.material.color;let gid=DBCOL?B.geos.get(g):undefined,vg=null;
    const fr=!DBCOL&&B.free.get(g);
    if(fr&&fr.length){gid=fr.pop();const iid=fr.pop();vcSet(B.bm,gid,c);B.bm.setVisibleAt(iid,true);
      const r={o,B,bm:B.bm,iid,gid,vg:true,mat:o.material,geo:g,ver:g.attributes.position.version,cr:c.r,cg:c.g,cb:c.b};
      if(B.wait){B.wait.push(r);B.bm.setMatrixAt(iid,o.matrixWorld);return true;}DB.list.push(r);o.layers.set(DBLAYER);return true;}
    if(gid===undefined){const nv=g.attributes.position.count,ni=g.index?g.index.count:0;if(B.bm.unusedVertexCount<nv||B.bm.unusedIndexCount<ni)return false;
      if(B.bm.instanceCount>=B.bm.maxInstanceCount)return false;
      // (vertex-colour path: one geometry per object; the batch copies the data, so one scratch copy per shape is refilled)
      if(DBCOL){gid=B.bm.addGeometry(g);B.geos.set(g,gid);}else{let h=VCG.get(g);h=vcGeo(g,c,h);VCG.set(g,h);gid=B.bm.addGeometry(h);vg=true;}}
    if(B.bm.instanceCount>=B.bm.maxInstanceCount)return false;
    const iid=B.bm.addInstance(gid);if(MROW)B.bm.mrowCol(iid,c);else if(DBCOL&&!DBMAT)B.bm.setColorAt(iid,c);
    const r={o,B,bm:B.bm,iid,gid,vg,mat:o.material,geo:g,ver:g.attributes.position.version,cr:c.r,cg:c.g,cb:c.b};
    if(B.wait){B.wait.push(r);B.bm.setMatrixAt(iid,o.matrixWorld);return true;}
    DB.list.push(r);o.layers.set(DBLAYER);return true;}
  // a batch per look, with room to grow, so things created later join without rebuilding anything
  function dbNew(key,L){const geos=new Map();let nv=0,ni=0;
    for(const o of L){const g=o.geometry;if(!DBCOL||!geos.has(g)){geos.set(g,-1);nv+=g.attributes.position.count;ni+=g.index?g.index.count:0;}}
    // (vertex-colour path: every object takes its own vertices, so leave much more room for things that join later)
    const gr=DBCOL?1.5:3,bm=new THREE.BatchedMesh(Math.ceil(L.length*gr)+8,Math.ceil(nv*gr)+(DBCOL?64:2048),Math.max(Math.ceil(ni*gr)+(DBCOL?96:3072),1),dbMat(L[0].material));
    bm.perObjectFrustumCulled=false;bm.sortObjects=false;bm.frustumCulled=false;bm.castShadow=L[0].castShadow;bm.receiveShadow=L[0].receiveShadow;
    bm.matrixAutoUpdate=false;bm.userData.smBatch=true;bm.name="moving batch";scene.add(bm);DB.bms.push(bm);
    if(MROW)mrowBM(bm);const B={bm,geos:new Map(),free:new Map()};
    if(!G3.warm){DB.byKey.set(key,B);for(const o of L)dbAdd(B,o);return;}
    // v4.0.1: a batch made mid-play is filled but kept hidden while its shader compiles in the background; its objects
    // keep drawing on their own until then, so a new batch never stalls a frame on a shader compile
    B.wait=[];for(const o of L)dbAdd(B,o);bm.visible=false;DB.pending=(DB.pending||0)+1;(DB.pendKeys||(DB.pendKeys=new Set())).add(key);
    const go=()=>{DB.pending--;DB.pendKeys.delete(key);if(!DB.bms.includes(bm))return;const W=B.wait;B.wait=null;DB.byKey.set(key,B);
      for(const r of W){const o=r.o;if(o.parent&&o.layers.mask===1&&o.material===r.mat&&o.geometry===r.geo&&dbOK(o)){DB.list.push(r);o.layers.set(DBLAYER);}else{if(!MROW)bm.setVisibleAt(r.iid,false);vcFree(B,r);}}
      bm.visible=true;DB.n=DB.list.length;DB.late=(DB.late||0)+1;};
    try{renderer.compileAsync(bm,camera,scene).then(go,go);}catch(e){go();}}
  function dbBuild(){DB.builds=(DB.builds||0)+1;
    // (v4.0.1: no regroup on new brand colors: moving batches carry each object's color, updated as it changes)
    const pend=new Map();
    scene.traverse(o=>{if(o.layers.mask!==1||!dbOK(o))return;const key=dbKey(o),B=DB.byKey.get(key);if(B&&dbAdd(B,o))return;
      let L=pend.get(key);if(!L){L=[];pend.set(key,L);}L.push(o);});DB.n=DB.list.length;
    // new looks get their own batch once three or more things share them (checked at most every 15 s after the first pass)
    const now=performance.now();if(DB.full&&now-DB.full<15000)return;DB.full=now;
    // v4.0.1: mid-play, new batches are queued and made one per frame (dbTick): making them all in one frame uploaded
    // every new batch's buffers and textures at once, a dropped frame on the iPhone ~10 s after a burst of upsets
    const Q=DB.q||(DB.q=new Map());
    pend.forEach((L,key)=>{if(L.length>=DBMIN&&!(DB.pendKeys&&DB.pendKeys.has(key))){if(G3.warm)Q.set(key,L);else dbNew(key,L);}});DB.n=DB.list.length;sortKinds();}
  function dbNext(){const Q=DB.q;if(!Q||!Q.size)return;const [key,L0]=Q.entries().next().value;Q.delete(key);
    const L=L0.filter(o=>o.parent&&o.layers.mask===1&&dbOK(o)&&dbKey(o)===key);if(L.length>=DBMIN&&!(DB.pendKeys&&DB.pendKeys.has(key)))dbNew(key,L);}   // (a full batch of the same look gets a second one)
  G3.dbForce=()=>{if(SM.done&&!SM.off&&!DBOFF&&!BQ.has("nodb")){try{dbBuild();}catch(e){console.error("moving batches failed",e);}}};
  // called right before each render: world matrices are brought up to date once here, and the render skips its own pass
  G3.dbTick=()=>{if(SM.off||!SM.done||DBOFF||BQ.has("nodb"))return;const now=performance.now();try{dbNext();}catch(e){console.error("moving batch failed",e);}if(now>DB.t){DB.t=now+3000;try{dbBuild();}catch(e){console.error("moving batches failed",e);SM.off=true;dbRelease();return;}}
    scene.updateMatrixWorld();matSync();let out=false;const fn=DB.fn=(DB.fn||0)+1;if(MROW)for(const b of DB.bms)b._matricesTexture.userData.full=false;
    // things that haven't changed for a second are checked every 4th frame (a still forklift starting to move shows
    // up within 4 frames); everything else every frame
    for(const r of DB.list){const o=r.o;if(r.gone)continue;
      // (v6.1 t6: parts of a hidden group, the bulk of this list, cost one check while their group stays hidden)
      if(r.vis===false&&r.top&&!r.top.visible&&r.top.parent===scene&&o.layers.mask===1<<DBLAYER)continue;
      if(r.top===undefined){let t=o;while(t.parent&&t.parent!==scene)t=t.parent;r.top=t;}
      if(r.idle>60&&((fn+r.iid)&7))continue;   // (t6: settled parts checked every 8th frame)
      const bc=r.bm.material,om=o.material;
      if(om!==r.mat||o.geometry!==r.geo||o.geometry.attributes.position.version!==r.ver||o.layers.mask!==1<<DBLAYER||!emSame(om,bc)){r.gone=true;out=true;if(!MROW)r.bm.setVisibleAt(r.iid,false);vcFree(r.B,r);if(o.layers.mask===1<<DBLAYER)o.layers.set(0);continue;}
      // only touch the batch when something changed (each change re-uploads that batch's matrix texture)
      let ch=false;{const c=om.color;if(c.r!==r.cr||c.g!==r.cg||c.b!==r.cb){
        if(DBMAT){r.gone=true;out=true;r.bm.setVisibleAt(r.iid,false);if(o.layers.mask===1<<DBLAYER)o.layers.set(0);continue;}   // (iOS: a new colour means another batch)
        r.cr=c.r;r.cg=c.g;r.cb=c.b;if(MROW)r.bm.mrowCol(r.iid,c);else if(DBCOL)r.bm.setColorAt(r.iid,c);else vcSet(r.bm,r.gid,c);ch=true;}}
      const vis=smShown(o);if(vis!==r.vis){r.vis=vis;ch=true;r.bm.setVisibleAt(r.iid,vis);}
      // (v15: the cache is Float64 like the world matrix; a Float32 copy never compared equal, so still things were rewritten
      // every frame, their batch's matrix texture re-uploaded, and the every-4th-frame check for idle things never kicked in)
      if(vis){const e=o.matrixWorld.elements,m=r.m||(r.m=new Float64Array(16).fill(NaN));let mc=false;for(let i=0;i<16;i++)if(e[i]!==m[i]){mc=true;m[i]=e[i];}
        if(mc){ch=true;r.bm.setMatrixAt(r.iid,o.matrixWorld);DB.mup=(DB.mup||0)+1;}}
      r.idle=ch?0:(r.idle||0)+1;}
    if(out)DB.list=DB.list.filter(r=>!r.gone);
    // (t10: a batch with nothing showing is skipped, not drawn empty: checked every 8th frame)
    if(!(fn&7)){const on=DB.onS||(DB.onS=new Set());on.clear();for(const r of DB.list)if(r.vis)on.add(r.bm);DB.byKey.forEach(B=>{if(!B.wait)B.bm.visible=on.has(B.bm);});}};
