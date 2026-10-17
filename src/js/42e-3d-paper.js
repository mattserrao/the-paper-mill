  /* ---- v6 Paper-craft: the tabletop ----
     The feeling: cut-out paper pieces on a table, moved by a hand. So:
       stop-motion  the scene (figures, machines, vehicles, effects) advances on "twos", about 12 drawings a second; between
                    drawings nothing is updated or redrawn, unless the camera moves (it stays smooth). Paused and still: nothing
                    is drawn at all.
       ink          every folded-card part gets its inked edges once, at start-up (fold lines and outlines as fixed, slightly
                    wavering lines), so there is no per-frame outline pass.
       table        no sky dome or clouds; the mill sits on paper, and the camera is a person leaning over a table: a limited
                    tilt and turn, free pan and zoom. */
  if(G3.style==="paper"){
    const STEP_MS=1000/12,INKC=new THREE.Color("#2b2320");
    // inked edges: the shared outline materials become opaque ink, and every sizeable card part gets its fold lines baked once
    edgeMat.color.copy(INKC);edgeMat.transparent=false;edgeMat.opacity=1;edgeSoft.color.copy(INKC);edgeSoft.opacity=0.55;
    // ink sits on the fold, so it is drawn a hair in front of the faces it outlines (a depth bias in the line shader) instead of
    // fighting them for the same depth
    const inkBias=sh=>{sh.vertexShader=sh.vertexShader.replace("#include <project_vertex>","#include <project_vertex>\ngl_Position.z-=0.0015*gl_Position.w;");};
    const inkMat=new THREE.LineBasicMaterial({color:INKC});inkMat.onBeforeCompile=inkBias;inkMat.customProgramCacheKey=()=>"pmink";G3.inkMat=inkMat;
    for(const m of [edgeMat,edgeSoft]){m.onBeforeCompile=inkBias;m.customProgramCacheKey=()=>"pmink";}
    // (v6.1: the hairline ink on every part is gone; bold outlines come from one merged shell, built with the shadows below)
    edgeMat.transparent=true;edgeMat.opacity=0.38;edgeSoft.opacity=0.25;   // the game's own fold lines stay, as light pencil
    /* bold ink: each sizeable piece gets an ink "shell" child: its own shape, swollen outward a few centimetres and drawn inside
       out (back faces) in ink, so only the rim that pokes past the piece shows, as a thick outline at every angle. Shells are
       added now, before the scenery batching runs, so they batch with everything else (a handful of draws in all), and a
       piece that moves carries its shell with it. Swell directions point away from the piece's centre (per axis, so long
       beams get an even rim); shapes are shared between pieces of the same shape and size. */
    {const W=0.085,INKM=new THREE.MeshBasicMaterial({color:INKC,side:THREE.BackSide,fog:false});G3.inkHullMat=INKM;
      const HC=new Map(),_s=new THREE.Vector3(),_c=new THREE.Vector3(),_d=new THREE.Vector3(),_p=new THREE.Vector3();let n=0,tri=0;const todo=[];
      scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.isBatchedMesh)return;const m=o.material;
        if(!m||Array.isArray(m)||!m.isMeshBasicMaterial||m.emissive===undefined||m.transparent||!o.visible)return;
        const g=o.geometry,pa=g&&g.attributes.position;if(!pa||pa.count>1600||o.userData.inkHull)return;
        o.updateWorldMatrix(true,false);if(o.matrixWorld.determinant()<0||m.side!==THREE.FrontSide||(g.parameters&&g.parameters.openEnded))return;   // (mirrored pieces and open or two-sided shells: an inside-out copy would show through them)
        if(!g.boundingBox)g.computeBoundingBox();o.getWorldScale(_s);const b=g.boundingBox,sx=(b.max.x-b.min.x)*Math.abs(_s.x),sy=(b.max.y-b.min.y)*Math.abs(_s.y),sz=(b.max.z-b.min.z)*Math.abs(_s.z);
        if(Math.max(sx,sy,sz)<0.4||(sy<0.25&&sx*sz>30))return;todo.push([o,sx,sy,sz]);});
      for(const [o,sx,sy,sz] of todo){const g=o.geometry,k=g.uuid+"|"+[_s.x,_s.y,_s.z].map(v=>v.toFixed(2)).join();o.getWorldScale(_s);
        let hg=HC.get(k);
        if(!hg){hg=g.clone();const pa=hg.attributes.position,b=g.boundingBox;b.getCenter(_c);
          const ex=Math.max(b.max.x-b.min.x,1e-3),ey=Math.max(b.max.y-b.min.y,1e-3),ez=Math.max(b.max.z-b.min.z,1e-3);
          for(let i=0;i<pa.count;i++){_p.fromBufferAttribute(pa,i);_d.set((_p.x-_c.x)/ex,(_p.y-_c.y)/ey,(_p.z-_c.z)/ez);if(_d.lengthSq()<1e-8)_d.set(0,1,0);_d.normalize();
            pa.setXYZ(i,_p.x+_d.x*W/Math.max(Math.abs(_s.x),1e-3),_p.y+_d.y*W/Math.max(Math.abs(_s.y),1e-3),_p.z+_d.z*W/Math.max(Math.abs(_s.z),1e-3));}
          pa.needsUpdate=true;hg.computeBoundingSphere();hg.computeBoundingBox();HC.set(k,hg);}
        const h=new THREE.Mesh(hg,INKM);h.userData.inkHull=true;h.raycast=()=>{};h.castShadow=false;h.receiveShadow=false;o.add(h);n++;tri+=(hg.index?hg.index.count:hg.attributes.position.count)/3;}
      diag(`paper ink: ${n} pieces outlined (${HC.size} shapes, ${tri|0} triangles)`);}
    /* paper drop shadows: each standing piece throws a flat, hard-edged shadow down and to the right on the table, as a lamp over
       the table would. Built once, after the static batching has listed the pieces that don't move: every one is flattened
       onto the ground along the light (a planar shadow), all merged into one mesh drawn in one call. A stencil lets each
       pixel darken only once, so overlapping shadows stay one even tone like a single sheet of shade. */
    const hull2=P=>{P=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
      for(const p of P){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
      for(let i=P.length-1;i>=0;i--){const p=P[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}return lo.slice(0,-1).concat(up.slice(0,-1));};
    G3.paperShadow=()=>{if(G3.paperShadowDone||!G3.SM||!G3.SM.done||!G3.SM.list)return;G3.paperShadowDone=true;
      const SX=0.62,SZ=0.42,pos=[],_v=new THREE.Vector3(),_bb=new THREE.Box3();let parts=0;
      // (roofs throw no table shadow: they lift away when you zoom in, and their shade would sit on the floor inside)
      const roofSet=new Set();try{roofs.forEach(g=>g.traverse(x=>roofSet.add(x)));}catch(e){}
      for(const r of G3.SM.list){const o=r.o;if(!o||!o.isMesh||r.proxyOnly||roofSet.has(o))continue;const m=o.material;if(!m||Array.isArray(m)||m.transparent)continue;
        const g=o.geometry,pa=g&&g.attributes.position;if(!pa||pa.count>4000)continue;o.updateWorldMatrix(true,false);
        if(!g.boundingBox)g.computeBoundingBox();if(g.boundingBox.max.y-g.boundingBox.min.y<0.05&&g.boundingBox.max.y<0.2)continue;
        // the shadow lies on whatever the piece stands on (its own lowest point: the floor slab, a deck, the yard)
        _bb.copy(g.boundingBox).applyMatrix4(o.matrixWorld);const base=_bb.min.y>1.2?0:_bb.min.y,tall=_bb.max.y-base;   // (raised parts, like a tank on its tower, throw onto the ground)
        if(tall<0.25||(tall<1.2&&(_bb.max.x-_bb.min.x)*(_bb.max.z-_bb.min.z)>60))continue;   // floors, slabs and pads cast nothing
        // a cut-paper shadow is a simple shape: the piece's own box, flattened along the light, traced round as one polygon
        const bx=g.boundingBox,pts=[];for(let c=0;c<8;c++){_v.set(c&1?bx.max.x:bx.min.x,c&2?bx.max.y:bx.min.y,c&4?bx.max.z:bx.min.z).applyMatrix4(o.matrixWorld);
          const h=Math.max(0,_v.y-base);pts.push([_v.x+h*SX,_v.z+h*SZ]);}
        const hl=hull2(pts),y=base+0.05;for(let k=1;k<hl.length-1;k++)pos.push(hl[0][0],y,hl[0][1],hl[k][0],y,hl[k][1],hl[k+1][0],y,hl[k+1][1]);parts++;}
      // ink on moving parts would be one extra draw each (the static batches can't take them): keep ink only where it was batched
      {const rec=new Set(G3.SM.list.map(r=>r.o));let cut=0;const drop=[];scene.traverse(o=>{if(o.userData&&(o.userData.inkEdge||o.userData.inkHull)&&!rec.has(o))drop.push(o);});
        drop.forEach(o=>{o.parent&&o.parent.remove(o);cut++;});diag(`paper ink: ${cut} lines on moving parts dropped`);}
      if(!pos.length)return;const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.computeBoundingSphere();
      const sm=new THREE.MeshBasicMaterial({color:new THREE.Color("#2b2320"),transparent:true,opacity:0.42,depthWrite:false,side:THREE.DoubleSide,fog:false,
        polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilZPass:THREE.ReplaceStencilOp});
      // pulled toward the camera a little, so the shade reaches over floor slabs and pads that sit just above a piece's foot
      sm.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace("#include <project_vertex>","#include <project_vertex>\ngl_Position.z-=0.004*gl_Position.w;");};sm.customProgramCacheKey=()=>"pmshade";
      const mesh=new THREE.Mesh(g,sm);mesh.renderOrder=1;mesh.frustumCulled=false;mesh.userData.noNav=true;mesh.raycast=()=>{};scene.add(mesh);G3.paperShadowMesh=mesh;
      diag(`paper shadows: ${parts} pieces, ${(pos.length/9|0)} triangles, one draw`);};
    // the table: no sky dome or clouds (the background and fog are the paper colour, which the day/night still tints)
    if(G3.SKY){const K=G3.SKY;for(const k of ["dome","clouds","mist"]){const o=K[k]&&(K[k].isObject3D?K[k]:K[k].mesh);if(o)o.visible=false;}K.tick=null;}
    // light: one multiplier for every paper surface, from full day white to a cool, dim night
    const NIGHT=new THREE.Color(0.30,0.34,0.50),WHITE=new THREE.Color(1,1,1);
    function paperLight(){const day=Math.max(0,Math.min(1,(hemi.intensity/(LEG*baseHemi)-0.3)/0.7));G3.styleU.stLight.value.copy(NIGHT).lerp(WHITE,day);G3.styleU.stDay.value=day;}
    // stop-motion frame pacing: full updates on the step, camera-only redraws between steps
    G3.noFallback=true;   // (12 drawings a second is the design, not a slow device: the quality fallback must not react to it)
    const base=G3.frame,lc=new Float64Array(7).fill(NaN);let acc=0,lastStep=-1e9;
    const camKey=()=>{const p=camera.position,q=camera.quaternion,v=[p.x,p.y,p.z,q.x,q.y,q.z,q.w];let ch=false;for(let i=0;i<7;i++)if(lc[i]!==v[i]){ch=true;lc[i]=v[i];}return ch;};
    G3.paperSteps=0;G3.paperCamDraws=0;
    G3.frame=function(rdt){const now=performance.now();acc+=rdt;
      if(now-lastStep>=STEP_MS-4||G3.paperEvery){lastStep=now;const a=Math.min(acc,0.25);acc=0;G3.paperSteps++;
        paperLight();if(G3.paperDollTick)G3.paperDollTick(now);if(!G3.paperShadowDone)G3.paperShadow();base(a);camKey();return;}
      try{placeCam();if(camKey()){G3.paperCamDraws++;if(G3.SM&&G3.SM.bms)for(const b of G3.SM.bms)b.perObjectFrustumCulled=true;
        scene.matrixWorldAutoUpdate=false;renderer.render(scene,camera);scene.matrixWorldAutoUpdate=true;}}catch(e){console.error("paper frame",e);}};
    diag("paper: stop-motion 12/s, camera smooth");

    /* paper effects: flames become layered torn-paper cut-outs and smoke/steam puffs become cotton-wool card clouds, each with
       an inked edge. Same particle system and textures, just redrawn, so no new draws or shaders. */
    {const rn=(()=>{let q=7;return()=>{q=(q*1664525+1013904223)>>>0;return q/4294967296;};})(),INK="#2b2320";
      const redo=(t,draw)=>{const c=t.image,x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);draw(x,c.width,c.height);t.needsUpdate=true;};
      // a teardrop flame tongue; three stacked (orange, yellow, cream) make one cut-paper flame
      const flame=(x,cx,by,w,h,col,ink)=>{x.beginPath();x.moveTo(cx,by-h);x.bezierCurveTo(cx+w*0.25,by-h*0.62,cx+w,by-h*0.42,cx+w*0.62,by-h*0.1);
        x.quadraticCurveTo(cx,by+h*0.06,cx-w*0.62,by-h*0.1);x.bezierCurveTo(cx-w,by-h*0.42,cx-w*0.25,by-h*0.62,cx,by-h);x.closePath();x.fillStyle=col;x.fill();
        if(ink){x.strokeStyle=INK;x.lineWidth=2.5;x.lineJoin="round";x.stroke();}};
      if(TX&&TX.flame)redo(TX.flame,(x,w,h)=>{flame(x,w/2,h*0.95,w*0.44,h*0.9,"#ee6328",true);flame(x,w/2,h*0.93,w*0.3,h*0.62,"#ffb43c",false);flame(x,w/2,h*0.92,w*0.15,h*0.34,"#fff0c6",false);});
      if(TX&&TX.puff)redo(TX.puff,(x,w)=>{const bl=[];for(let k=0;k<7;k++){const a=k/7*Math.PI*2;bl.push([w/2+Math.cos(a)*w*0.2,w/2+Math.sin(a)*w*0.16,w*(0.15+rn()*0.06)]);}bl.push([w/2,w/2,w*0.22]);
        x.lineWidth=5;x.strokeStyle="rgba(43,35,32,0.55)";bl.forEach(([a,b,r])=>{x.beginPath();x.arc(a,b,r,0,7);x.stroke();});
        x.fillStyle="#fbf8f1";bl.forEach(([a,b,r])=>{x.beginPath();x.arc(a,b,r,0,7);x.fill();});
        x.fillStyle="rgba(170,160,150,0.35)";bl.forEach(([a,b,r])=>{x.beginPath();x.arc(a+r*0.25,b+r*0.3,r*0.6,0,7);x.fill();});});}
  }
