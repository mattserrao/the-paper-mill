  /* ---- v7.0 zone frames: where each block of the mill is drawn in the v7 site (03b ZONES) ----
     Everything is still built, animated and simulated in logical (v6) coordinates. A top-level object's world matrix
     gets its zone's transform on top (zApply, from the two matrix updates below), so the static merge, shadows, picking,
     the cut-outs and the camera all see the v7 site, and nothing that moves things around has to change.
     How a thing is placed in the mirrored hall block (H):
       - a group, or a mesh whose shape is not the same both ways along its own x: truly mirrored (handedness flips, as a
         left-hand machine is the mirror image of a right-hand one); the static merge bakes these on its mirrored path
       - a sign or facade (a flat textured card), a plain symmetric shape, and anything that moves about (people,
         vehicles, loads): "conjugate" mirrored: placed and turned as its mirror image would be but not flipped, so writing
         stays readable and movers stay in the moving batches (which take no mirrored matrices, 40)
     People and vehicles are zoned by where they stand each frame; everything else by where its footprint was when the
     zone pass ran (start of 42b and the first frame). Instanced meshes are zoned instance by instance, once.
     Objects marked userData.zd are already in site coordinates (the fence, the gates, the scenery, the sky). */
  const ZON=!LAYOUT6;
  const ZZ={};
  {const mk=(k,conj)=>{const Z=ZONES[k],pre=new THREE.Matrix4();
      if(Z.mir!=null)pre.set(-1,0,0,Z.mir, 0,1,0,0, 0,0,1,0, 0,0,0,1);else pre.makeTranslation(Z.dx,0,0);
      return {k,pre,post:conj&&Z.mir!=null?new THREE.Matrix4().makeScale(-1,1,1):null};};
   for(const k of Object.keys(ZONES)){ZZ[k]=mk(k,false);ZZ[k+"c"]=mk(k,true);}}
  const zFor=(x,z,conj)=>{const k=zoneOf(x,z);return conj?ZZ[k+"c"]:ZZ[k];};
  const zTop=p=>p===scene||p===null||(G3.SM&&p===G3.SM.holder)||!!(p&&p.__zcont);   // (a container group: its children are zoned one by one)
  function zApply(o){if(!zTop(o.parent))return;if(o.__zsc){o.matrixWorld.elements[12]+=scX(o.position.x)-o.position.x;return;}const z=o.__zdyn?zFor(o.position.x,o.position.z,true):o.__zz;if(!z)return;
    o.matrixWorld.premultiply(z.pre);if(z.post)o.matrixWorld.multiply(z.post);}
  // the two three.js (r186) world-matrix updates, as they are, plus zApply
  function zUMW(force){if(this.matrixAutoUpdate)this.updateMatrix();
    if(this.matrixWorldNeedsUpdate||force){if(this.matrixWorldAutoUpdate===true){const p=this.parent;if(p===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(p.matrixWorld,this.matrix);zApply(this);}
      this.matrixWorldNeedsUpdate=false;force=true;}
    const c=this.children;for(let i=0,l=c.length;i<l;i++)c[i].updateMatrixWorld(force);}
  function zUWM(up,down,force=false){const p=this.parent;if(up===true&&p!==null)p.updateWorldMatrix(true,false);
    if(this.matrixAutoUpdate)this.updateMatrix();
    if(this.matrixWorldNeedsUpdate||force){if(this.matrixWorldAutoUpdate===true){if(p===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(p.matrixWorld,this.matrix);zApply(this);}
      this.matrixWorldNeedsUpdate=false;force=true;}
    if(down===true){const c=this.children;for(let i=0,l=c.length;i<l;i++)c[i].updateWorldMatrix(false,true,force);}}
  function zSet(o,z,dyn){o.__zz=z;o.__zdyn=!!dyn;o.updateMatrixWorld=zUMW;o.updateWorldMatrix=zUWM;o.matrixWorldNeedsUpdate=true;}
  const ZMOVER=["legs","wheels","trike","car","load","act","cj","cut","truck","lift"];
  const isMover=o=>{const u=o.userData||{};for(const k of ZMOVER)if(u[k])return true;return false;};
  const SYM=new Set(["BoxGeometry","CylinderGeometry","PlaneGeometry","SphereGeometry","CircleGeometry","TorusGeometry","ConeGeometry","RingGeometry","CapsuleGeometry","IcosahedronGeometry","OctahedronGeometry"]);
  function zConj(o){if(!o.isMesh||o.children.length)return false;const g=o.geometry;if(!g)return false;
    if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;if(Math.abs(b.min.x+b.max.x)>0.02)return false;   // shifted off its own axis: not symmetric
    if(SYM.has(g.type))return true;
    return !!(o.material&&o.material.map&&b.max.z-b.min.z<0.01);}   // a flat textured card
  // an instanced mesh: each instance placed by its own zone, conjugate in H (the instance's shape is never flipped)
  const _zm=new THREE.Matrix4(),_zp=new THREE.Vector3();
  // (all its instances in one zone: the whole mesh is zoned instead, because some are re-posed every frame (the dryer
  // cans turn, rolls roll) and a per-instance change would be overwritten; truly mirrored in H)
  function zInst(o){if(o.userData.zd)return;o.updateMatrixWorld(true);const n=o.count,ks=new Set();
    for(let i=0;i<n;i++){o.getMatrixAt(i,_zm);_zm.premultiply(o.matrixWorld);_zp.setFromMatrixPosition(_zm);ks.add(zoneOf(_zp.x,_zp.z));}
    if(ks.size<=1){const k=ks.size?[...ks][0]:(()=>{const b=new THREE.Box3().setFromObject(o),c=b.getCenter(new THREE.Vector3());return b.isEmpty()?"H":zoneOf(c.x,c.z);})();
      o.__zz=null;zSet(o,ZZ[k],false);if(zoneMir(k))zFlip(o);return;}
    ZS.instSplit=(ZS.instSplit||0)+1;
    for(let i=0;i<n;i++){o.getMatrixAt(i,_zm);_zm.premultiply(o.matrixWorld);_zp.setFromMatrixPosition(_zm);const z=zFor(_zp.x,_zp.z,true);
      _zm.premultiply(z.pre);if(z.post)_zm.multiply(z.post);_zm.premultiply(_zinv.copy(o.matrixWorld).invert());o.setMatrixAt(i,_zm);}
    o.instanceMatrix.needsUpdate=true;if(o.computeBoundingSphere)o.computeBoundingSphere();if(o.computeBoundingBox)o.computeBoundingBox();o.__zz=null;}
  const _zinv=new THREE.Matrix4();
  // writing on a truly mirrored thing (the hall's lettering, painted signs inside a mirrored group) would read backwards: its
  // canvas texture is swapped for a copy flipped left to right, so the mirrored surface shows the picture the right way round
  const ZFLIP=new Map();
  function zFlipMat(m){if(!m||!m.map||!m.map.isCanvasTexture)return m;let c=ZFLIP.get(m);if(c)return c;
    c=m.clone();c.userData=Object.assign({},m.userData);const t=m.map.clone();t.repeat.x=-m.map.repeat.x;t.offset.x=1-m.map.offset.x;t.needsUpdate=true;c.map=t;
    if(MATS.includes(m))MATS.push(c);ZFLIP.set(m,c);ZS.flipped=(ZS.flipped||0)+1;return c;}
  function zFlip(o){o.traverse(c=>{if(!c.isMesh||c.isInstancedMesh)return;c.material=Array.isArray(c.material)?c.material.map(zFlipMat):zFlipMat(c.material);});}
  const ZS={n:0,dyn:0,inst:0,native:0,span:[],by:{}};G3.zones=ZS;
  // a container: a group standing at the origin, unturned, whose parts are spread over more than one zone (a set of route
  // markers, the knobs of several areas): it stays put and each of its children is zoned as if it stood on its own
  // (its children must stand at their own places in more than one zone: a group of parts all built round the origin is one
  // thing that gets moved about later, like a reel, and is zoned whole)
  const zIsCont=(o,bb)=>{if(!o.isGroup||o.position.lengthSq()>1e-6||o.quaternion.w<0.99999||Math.abs(o.scale.x-1)>1e-6||o.children.length<2)return false;
    if(new Set([zoneOf(bb.min.x,bb.min.z),zoneOf(bb.max.x,bb.max.z),zoneOf(bb.min.x,bb.max.z),zoneOf(bb.max.x,bb.min.z)]).size<2)return false;
    const ks=new Set();let n=0;for(const c of o.children){if(c.position.x*c.position.x+c.position.z*c.position.z<0.25)continue;n++;ks.add(zoneOf(c.position.x,c.position.z));}
    return n>=2&&ks.size>1;};
  function zonePass(){if(!ZON)return;scene.updateMatrixWorld(true);const parts=new Set((G3.scenery&&G3.scenery.parts)||[]);
    for(const o of scene.children.slice())zOne(o,parts,0);
    scene.updateMatrixWorld(true);}
  function zOne(o,parts,depth){const bb=new THREE.Box3(),v=new THREE.Vector3();{if(o.__zz!==undefined)return;o.__zz=null;
      if(o.isLight||o.isCamera||o.userData.zd||(o.userData.smBatch&&!o.userData.zLogical)||o.userData.terrain||parts.has(o)){ZS.native++;return;}   // (smBatch: the engine's own batches and pictures hold site-space matrices already)
      if(o.userData.zsc){o.__zsc=true;zSet(o,null,false);ZS.sc=(ZS.sc||0)+1;return;}   // (the activity scenes and rare sights: drawn warped like the scenery round them)
      if(o.isInstancedMesh){zInst(o);ZS.inst++;return;}
      if(isMover(o)){zSet(o,null,true);ZS.dyn++;return;}
      bb.makeEmpty();try{bb.setFromObject(o);}catch(e){}
      if(bb.isEmpty()){zSet(o,null,true);ZS.dyn++;return;}   // nothing to measure yet (an empty holder): goes by where it stands
      if(bb.max.x-bb.min.x>230||bb.max.z-bb.min.z>230){ZS.native++;return;}   // world-sized (the river, the ground): already in site coordinates
      if(depth<3&&zIsCont(o,bb)){o.__zcont=true;ZS.cont=(ZS.cont||0)+1;for(const c of o.children.slice())zOne(c,parts,depth+1);return;}
      bb.getCenter(v);const k=zoneOf(v.x,v.z),conj=zoneMir(k)&&zConj(o);zSet(o,ZZ[conj?k+"c":k],false);if(zoneMir(k)&&!conj)zFlip(o);ZS.n++;ZS.by[k]=(ZS.by[k]||0)+1;
      const k0=zoneOf(bb.min.x,bb.min.z),k1=zoneOf(bb.max.x,bb.max.z),k2=zoneOf(bb.min.x,bb.max.z),k3=zoneOf(bb.max.x,bb.min.z);
      if(k0!==k||k1!==k||k2!==k||k3!==k)ZS.span.push([o.name||o.type,k,+bb.min.x.toFixed(1),+bb.max.x.toFixed(1),+bb.min.z.toFixed(1),+bb.max.z.toFixed(1)]);}}
  G3.zonePass=zonePass;
  // place a thing by a logical point (an effect by its upset's spot): mirrored in H
  G3.zSetAt=(o,x,z)=>{if(!ZON)return;o.__zz=null;const k=zoneOf(x,z);zSet(o,ZZ[k],false);if(zoneMir(k))zFlip(o);};
  // things added to the scene after the pass (pins, spawned props and vehicles) go by where they stand each frame. Looked at
  // once the adding code has finished (a microtask later), so the engine's own batches (userData.smBatch, set right after
  // they are added) are left in site coordinates
  if(ZON){const add0=scene.add.bind(scene);
    const late=o=>{if(o.parent!==scene||o.__zz!==undefined||o.isLight||o.isCamera||o.isBatchedMesh||o.userData.zd||o.userData.smBatch)return;o.__zz=null;ZS.late=(ZS.late||0)+1;if(o.isInstancedMesh){zInst(o);return;}zSet(o,null,true);};   // (an instanced copy made later, like the dryer cans: by where its instances stand)
    scene.add=function(...a){add0(...a);if(G3.zonesOn)for(const o of a)if(o&&o.__zz===undefined)queueMicrotask(()=>late(o));return this;};}
  // a logical point -> site point (people, effects, pins and the camera use these)
  G3.sitePt=(x,z)=>ZON?sitePt(x,z):[x,z];
  G3.siteV=(v,out=v)=>{if(!ZON)return out.copy(v);const k=zoneOf(v.x,v.z);return out.set(siteX(k,v.x),v.y,v.z);};
  G3.zoneMirAt=(x,z)=>ZON&&zoneMir(zoneOf(x,z));
  // a thing's world matrix in logical coordinates (the walkers' path-finding grid is logical, 38): the zone taken back off
  // at the ancestor that carries it. Null for things built in site coordinates (userData.zd).
  const _zl1=new THREE.Matrix4(),_zl2=new THREE.Matrix4();
  G3.zLogMat=(o,out)=>{if(!ZON)return out.copy(o.matrixWorld);let t=null;
    for(let x=o;x;x=x.parent){if(x.userData&&x.userData.zd)return null;if((x.__zz||x.__zdyn)&&zTop(x.parent)){t=x;break;}}
    if(!t)return out.copy(o.matrixWorld);
    const pm=t.parent&&t.parent!==scene&&!(G3.SM&&t.parent===G3.SM.holder)?t.parent.matrixWorld:null;
    _zl1.copy(t.matrixWorld).invert().multiply(o.matrixWorld);   // o relative to t (no zone in it)
    out.multiplyMatrices(t.matrix,_zl1);if(pm)out.premultiply(pm);return out;};
  // a site point back to logical coordinates (the zone whose image it falls in)
  G3.siteToLogical=(x,z)=>{if(!ZON)return [x,z];for(const k of Object.keys(ZONES)){const Z=ZONES[k],lx=Z.mir!=null?Z.mir-x:x-Z.dx;if(zoneOf(lx,z)===k)return [lx,z];}return null;};

