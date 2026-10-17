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
      if(bb.max.y<0.35||bb.max.y-bb.min.y<0.2||Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z,bb.max.y-bb.min.y)<0.7||bb.max.x-bb.min.x>140||bb.max.z-bb.min.z>140)return;   // flat, buried or a whole scenery sector
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
  /* v6.1 t2: multi-material meshes (a deck plate with a grating top, a gauge plate with a printed face...) draw once per
     material group and can't be batched. On the first frame, before the static merge, each one keeps its first material's
     faces and gets one child per other material holding that material's faces (same transform, so moving or hiding the
     original still moves or hides all of it). The parts then batch with everything else. Cut-out actors are left alone. */
  G3.splitMulti=()=>{let n=0,parts=0;const cache=new Map(),L=[];
    scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isBatchedMesh||o.isSkinnedMesh||!Array.isArray(o.material))return;
      const g=o.geometry;if(!g||!g.groups||!g.groups.length||g.morphAttributes&&Object.keys(g.morphAttributes).length)return;
      for(let x=o;x&&x!==scene;x=x.parent)if(x.userData&&x.userData.cut)return;L.push(o);});
    for(const o of L){const g=o.geometry,ms=o.material,byM=new Map();
      for(const gr of g.groups){const m=ms[gr.materialIndex];if(!m)continue;if(!byM.has(m))byM.set(m,[]);byM.get(m).push(gr);}
      const subs=[];for(const [m,grs] of byM){const ck=g.uuid+"|"+grs.map(x=>x.start+":"+x.count).join(",");let sg=cache.get(ck);
        if(!sg){sg=new THREE.BufferGeometry();for(const k in g.attributes)sg.setAttribute(k,g.attributes[k]);
          const src=g.index?g.index.array:null,cnt=grs.reduce((a,x)=>a+x.count,0),idx=new Uint32Array(cnt);let w=0;
          for(const x of grs)for(let i=0;i<x.count;i++)idx[w++]=src?src[x.start+i]:x.start+i;
          sg.setIndex(new THREE.BufferAttribute(idx,1));sg.computeBoundingSphere();sg.computeBoundingBox();cache.set(ck,sg);}
        subs.push([m,sg]);}
      if(!subs.length)continue;
      o.geometry=subs[0][1];o.material=subs[0][0];
      for(let i=1;i<subs.length;i++){const c=new THREE.Mesh(subs[i][1],subs[i][0]);c.castShadow=o.castShadow;c.receiveShadow=o.receiveShadow;c.renderOrder=o.renderOrder;o.add(c);parts++;}
      n++;}
    diag(`multi-material meshes split: ${n} (${parts} extra parts)`);};
  /* v6.1 t3 sign atlas: small opaque signs and tags (unlit planes, each with its own canvas texture) are a draw each. On the
     first frame, before the static merge, every such texture that isn't tiled is copied into one shared 2048 canvas, the
     plane's UVs are pointed at its spot, and all of them share one material, so they batch into one draw. A texture the game
     redraws later (its version changes) is copied again (checked twice a second). */
  G3.atlasSigns=()=>{const W=2048,cv=document.createElement("canvas");cv.width=W;cv.height=W;const x=cv.getContext("2d");
    const L=[],seen=new Map();let rowY=0,rowH=0,cx=0,n=0;
    scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isBatchedMesh||o.layers.mask!==1)return;const m=o.material;
      if(!m||Array.isArray(m)||m.type!=="MeshBasicMaterial"||m.transparent||m.opacity<1||!m.map||m.alphaMap||m.vertexColors||o.renderOrder)return;
      const t=m.map,im=t.image;if(!im||!(im instanceof HTMLCanvasElement)||im.width>512||im.height>256)return;
      if(t.wrapS!==THREE.ClampToEdgeWrapping||t.wrapT!==THREE.ClampToEdgeWrapping||t.repeat.x!==1||t.repeat.y!==1||t.offset.x||t.offset.y||t.rotation)return;
      if(!m.color.equals(new THREE.Color(1,1,1)))return;const g=o.geometry;if(!g||!g.attributes.uv||g.attributes.uv.count>64)return;
      for(let p=o;p&&p!==scene;p=p.parent)if(p.userData&&p.userData.cut)return;
      L.push(o);});
    if(L.length<3)return;
    const mat=new THREE.MeshBasicMaterial({map:null});
    const place=t=>{let r=seen.get(t);if(r)return r;const im=t.image,w=im.width+4,h=im.height+4;if(cx+w>W){cx=0;rowY+=rowH;rowH=0;}if(rowY+h>W)return null;
      r={t,x:cx+2,y:rowY+2,w:im.width,h:im.height,v:t.version};seen.set(t,r);cx+=w;rowH=Math.max(rowH,h);
      x.drawImage(im,r.x,r.y);x.drawImage(im,0,0,im.width,1,r.x,r.y-2,im.width,2);x.drawImage(im,0,im.height-1,im.width,1,r.x,r.y+im.height,im.width,2);   // (a 2 px apron so mipmaps don't bleed)
      return r;};
    for(const o of L){const r=place(o.material.map);if(!r)continue;
      const g=o.geometry.clone(),uv=g.attributes.uv,fy=o.material.map.flipY!==false;
      for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i),py=fy?(1-v):v;uv.setXY(i,(r.x+u*r.w)/W,1-(r.y+py*r.h)/W);}
      o.geometry=g;o.material=mat;n++;}
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;mat.map=tex;
    G3.signAtlas={tex,seen};diag(`sign atlas: ${n} signs, ${seen.size} textures in one`);
    UI_TICKS.push(k=>{if(k%2)return;let ch=false;for(const r of seen.values())if(r.t.version!==r.v){r.v=r.t.version;x.clearRect(r.x,r.y,r.w,r.h);x.drawImage(r.t.image,r.x,r.y);ch=true;}if(ch)tex.needsUpdate=true;});};
