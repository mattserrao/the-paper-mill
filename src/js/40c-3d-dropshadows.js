  /* ---- v6.1 iso: drop shadows ----
     No shadow maps on this branch. On the first frame (just before the static merge, 40) every shown, opaque, lit mesh
     that stands up off the ground gets a flat dark-paper shadow: the outline of its bounding box pushed along DROP (to the
     right of the screen and a little toward the viewer) by its height, laid on the ground. All of them go into one mesh,
     one draw. The stencil darkens each pixel once, so overlapping shadows read as one sheet of dark paper, not a stack.
     The cut-outs (32c) draw their own, with the same stencil. Nothing is recomputed per frame; a shadow does not follow
     a part that moves later (cranes, reels), which reads fine at this size. */
  const DROP={x:0.2,z:0.42,y:0.05,col:"#2e2433",op:0.36};G3.DROP=DROP;
  const dropMat=new THREE.MeshBasicMaterial({color:lin0(DROP.col),transparent:true,opacity:DROP.op,depthWrite:false,
    side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
    stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilZPass:THREE.ReplaceStencilOp,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp});
  G3.dropMat=dropMat;
  // 2D convex hull (monotone chain) of [x,z] points
  function hull2(P){P.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(P.length<3)return P;const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const lo=[],up=[];for(const p of P){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
    for(let i=P.length-1;i>=0;i--){const p=P[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
    up.pop();lo.pop();return lo.concat(up);}
  const LIT=new Set(["MeshStandardMaterial","MeshLambertMaterial","MeshMatcapMaterial","MeshPhongMaterial"]);
  G3.dropBuild=()=>{if(G3.dropMesh)return;const t0=performance.now();
    const skip=new Set();if(G3.scenery&&G3.scenery.parts)G3.scenery.parts.forEach(p=>skip.add(p));if(G3.terrain)skip.add(G3.terrain);
    const shown=o=>{for(let x=o;x;x=x.parent){if(!x.visible)return false;if(x===scene)return true;}return false;};
    const actor=o=>{for(let x=o;x&&x!==scene;x=x.parent)if(x.userData&&x.userData.cut)return true;return false;};
    const pos=[],v=new THREE.Vector3(),bb=new THREE.Box3();let n=0;
    scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isBatchedMesh||o.isSkinnedMesh||skip.has(o)||o.layers.mask!==1)return;
      const m=Array.isArray(o.material)?o.material[0]:o.material;if(!m||!LIT.has(m.type)||m.transparent&&m.opacity<0.9||o.userData.aoDecal||o.castShadow===false)return;
      const g=o.geometry;if(!g||!g.attributes.position)return;if(!g.boundingBox)g.computeBoundingBox();if(!shown(o)||actor(o))return;
      bb.copy(g.boundingBox).applyMatrix4(o.matrixWorld);
      if(bb.max.y<0.35||bb.max.y-bb.min.y<0.2||bb.max.x-bb.min.x>140||bb.max.z-bb.min.z>140)return;   // flat, buried or a whole scenery sector
      const b=g.boundingBox,P=[];
      for(let i=0;i<8;i++){v.set(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).applyMatrix4(o.matrixWorld);const h=Math.max(0,v.y);P.push([v.x+h*DROP.x,v.z+h*DROP.z]);
        if(v.y<1.2)P.push([v.x,v.z]);}   // (a box standing on the ground keeps its own footprint inside the shadow)
      const H=hull2(P);if(H.length<3)return;
      const yAt=(x,z)=>(G3.terrainH?G3.terrainH(x,z):0)+DROP.y;
      const cx=H.reduce((a,p)=>a+p[0],0)/H.length,cz=H.reduce((a,p)=>a+p[1],0)/H.length,cy=yAt(cx,cz);
      for(let i=0;i<H.length;i++){const a=H[i],c=H[(i+1)%H.length];pos.push(cx,cy,cz,c[0],yAt(c[0],c[1]),c[1],a[0],yAt(a[0],a[1]),a[1]);}n++;});
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,dropMat);mesh.name="drop shadows";mesh.renderOrder=1;mesh.userData.smBatch=true;scene.add(mesh);G3.dropMesh=mesh;
    if(G3.SM&&G3.SM.dyn)G3.SM.dyn.add(mesh);
    diag(`drop shadows: ${n} objects, ${pos.length/9|0} triangles, ${(performance.now()-t0).toFixed(0)} ms`);};
