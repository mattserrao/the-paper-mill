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
    /* Folded-card simplification and bold ink, applied to every paper part (machines, buildings, props, vehicles):
       - strokes: thin long parts (rails, posts, rungs, small pipes: two sides under 0.2 m) are no longer modelled tubes or bars;
         each becomes a drawn stroke, two crossed flat strips (4 triangles instead of 12-40), in its own colour
       - crumbs: parts smaller than ~0.2 m all round (bolts, brackets, nameplates) are left off; lights and glowing parts stay
       - ink: each chunky part (at least 0.25 m thick, 0.8 m long) gets an ink "shell" child: its own shape, swollen outward a few
         centimetres and drawn inside out (back faces) in ink, so only the rim that pokes past the part shows, as a bold outline
         at every angle. Shells are added before the scenery batching runs, so they batch with everything else, and a part that
         moves carries its shell. Mirrored, open and two-sided parts get none (an inside-out copy would show through them). */
    const W_INK=0.085,INKM=new THREE.MeshBasicMaterial({color:INKC,side:THREE.BackSide,fog:false});G3.inkHullMat=INKM;
    const HC=new Map(),SC=new Map(),DS=new Map(),_s=new THREE.Vector3(),_c=new THREE.Vector3(),_d=new THREE.Vector3(),_p=new THREE.Vector3();
    const PS={hull:0,hullTri:0,stroke:0,strokeSaved:0,crumb:0};G3.paperStats=PS;
    const triOf=g=>(g.index?g.index.count:g.attributes.position.count)/3;
    const paperPart=o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.isBatchedMesh||o.userData.inkHull||o.userData.stroke)return false;const m=o.material;
      return !!m&&!Array.isArray(m)&&m.isMeshBasicMaterial&&m.emissive!==undefined&&!m.transparent&&o.visible;};
    function dims(o){const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();o.getWorldScale(_s);const b=g.boundingBox;
      return [(b.max.x-b.min.x)*Math.abs(_s.x),(b.max.y-b.min.y)*Math.abs(_s.y),(b.max.z-b.min.z)*Math.abs(_s.z)];}
    // a stroke: two crossed strips along the part's long axis, filling its own box (in the part's geometry space)
    function strokeGeo(g){let sg=SC.get(g.uuid);if(sg)return sg;const b=g.boundingBox,c=b.getCenter(new THREE.Vector3()),e=b.getSize(new THREE.Vector3());
      const ax=e.x>=e.y&&e.x>=e.z?0:e.y>=e.z?1:2,u=(ax+1)%3,v=(ax+2)%3,P=[];const pt=(a,bu,bv)=>{const q=[0,0,0];q[ax]=c.getComponent(ax)+a*e.getComponent(ax)/2;q[u]=c.getComponent(u)+bu*e.getComponent(u)/2;q[v]=c.getComponent(v)+bv*e.getComponent(v)/2;return q;};
      for(const [du,dv] of [[1,0],[0,1]]){const A=pt(-1,-du,-dv),B=pt(1,-du,-dv),C=pt(1,du,dv),D=pt(-1,du,dv);P.push(...A,...B,...C,...A,...C,...D);}
      // same layout as the game's own shapes (indexed, with normals and texture coordinates) so strokes batch with everything else
      sg=new THREE.BufferGeometry();sg.setAttribute("position",new THREE.Float32BufferAttribute(P,3));const nv=P.length/3;
      sg.setAttribute("normal",new THREE.Float32BufferAttribute(new Array(nv*3).fill(0).map((_,i)=>i%3===1?1:0),3));sg.setAttribute("uv",new THREE.Float32BufferAttribute(new Array(nv*2).fill(0.5),2));
      sg.setIndex([...Array(nv).keys()]);sg.computeBoundingSphere();sg.computeBoundingBox();SC.set(g.uuid,sg);return sg;}
    function dbl(m){let c=DS.get(m);if(!c){c=m.clone();c.side=THREE.DoubleSide;c.userData=Object.assign({},m.userData);if(MATS.includes(m))MATS.push(c);DS.set(m,c);}return c;}
    function addHull(o,sx,sy,sz){const g=o.geometry;o.getWorldScale(_s);const k=g.uuid+"|"+[_s.x,_s.y,_s.z].map(v=>v.toFixed(2)).join();let hg=HC.get(k);
      if(!hg){hg=g.clone();const pa=hg.attributes.position,b=g.boundingBox;b.getCenter(_c);
        const ex=Math.max(b.max.x-b.min.x,1e-3),ey=Math.max(b.max.y-b.min.y,1e-3),ez=Math.max(b.max.z-b.min.z,1e-3);
        for(let i=0;i<pa.count;i++){_p.fromBufferAttribute(pa,i);_d.set((_p.x-_c.x)/ex,(_p.y-_c.y)/ey,(_p.z-_c.z)/ez);if(_d.lengthSq()<1e-8)_d.set(0,1,0);_d.normalize();
          pa.setXYZ(i,_p.x+_d.x*W_INK/Math.max(Math.abs(_s.x),1e-3),_p.y+_d.y*W_INK/Math.max(Math.abs(_s.y),1e-3),_p.z+_d.z*W_INK/Math.max(Math.abs(_s.z),1e-3));}
        pa.needsUpdate=true;hg.computeBoundingSphere();hg.computeBoundingBox();HC.set(k,hg);}
      const h=new THREE.Mesh(hg,INKM);h.userData.inkHull=true;h.raycast=()=>{};h.castShadow=false;h.receiveShadow=false;o.add(h);PS.hull++;PS.hullTri+=triOf(hg);}
    // one part through the rules; vehicle parts keep their small bits only if they glow (lights) and are never turned to strokes
    // when they are wheels (round, short)
    function cardify(o,vehicle){if(!paperPart(o))return;const m=o.material,g=o.geometry;if(!g||!g.attributes.position)return;
      o.updateWorldMatrix(true,false);const [sx,sy,sz]=dims(o),mx=Math.max(sx,sy,sz),mn=Math.min(sx,sy,sz),md=sx+sy+sz-mx-mn;
      const glow=m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)>0.02;
      if(mx<0.2&&!glow&&!o.userData.keep){o.visible=false;PS.crumb++;return;}
      if(vehicle)return;   // (vehicles: the rest is done per vehicle, as one merged outline)
      if(md<0.2&&mx>0.6&&!glow&&g.attributes.position.count<=400){const t0=triOf(g);o.geometry=strokeGeo(g);o.material=dbl(m);o.userData.stroke=true;PS.stroke++;PS.strokeSaved+=t0-4;return;}
      if(o.matrixWorld.determinant()<0||m.side!==THREE.FrontSide||(g.parameters&&g.parameters.openEnded)||g.attributes.position.count>1600)return;
      if(mn>=0.25&&mx>=0.8&&!(sy<0.25&&sx*sz>30))addHull(o,sx,sy,sz);}
    G3.paperCardify=cardify;
    {const all=[];scene.traverse(o=>{if(o.isMesh&&!(o.userData&&o.userData.legs))all.push(o);});
      // (worker figures are paper dolls already; their hidden 3D parts are skipped by the visibility check)
      for(const o of all)cardify(o,false);
      diag(`paper card: ${PS.stroke} parts drawn as strokes (${PS.strokeSaved|0} triangles saved), ${PS.crumb} crumbs left off, ${PS.hull} outlined (${PS.hullTri|0} triangles)`);}
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
    /* vehicles as hand-moved paper pieces: any group on the table that travels (trucks, trains, forklifts, loaders, cars,
       the food truck) is found the first time it moves, gets the card rules and ink above, and from then on is "pushed by a
       hand": on each stop-motion step it hops a little and tips side to side while it moves, and settles flat when it stops.
       Its parts move into an inner "puppet" group so the game's own position and heading are never touched. Each one also
       drags a flat cut-paper shadow along (all vehicle shadows are one instanced batch: one draw). */
    const VEH=new Map(),VLAST=new WeakMap(),VSKIP=new WeakSet(),VMAX=96;G3.noVehPaper=new URLSearchParams(location.search).has("novehpaper");G3.paperVehicles=VEH;
    const vsc=document.createElement("canvas");vsc.width=vsc.height=64;{const x=vsc.getContext("2d");x.fillStyle="#fff";x.beginPath();x.roundRect?x.roundRect(4,8,56,48,14):x.rect(4,8,56,48);x.fill();}
    const vsm=new THREE.MeshBasicMaterial({color:INKC,alphaMap:new THREE.CanvasTexture(vsc),alphaTest:0.5,transparent:true,opacity:0.36,depthWrite:false,fog:false,
      polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilZPass:THREE.ReplaceStencilOp});
    const vsg=new THREE.PlaneGeometry(1,1);vsg.rotateX(-Math.PI/2);const VSH=new THREE.InstancedMesh(vsg,vsm,VMAX);VSH.count=0;VSH.frustumCulled=false;VSH.renderOrder=1;VSH.userData.noNav=true;VSH.raycast=()=>{};scene.add(VSH);
    const _wp=new THREE.Vector3(),_wq=new THREE.Quaternion(),_ws=new THREE.Vector3(),_m4=new THREE.Matrix4(),_e=new THREE.Euler(0,0,0,"YXZ"),_bx=new THREE.Box3();
    const shownW=o=>{for(let x=o;x;x=x.parent)if(!x.visible)return false;return true;};
    function vehicleAdopt(g){let n=0;g.traverse(o=>{if(o.isMesh)n++;});if(n<3)return null;
      // measure in the group's own frame
      const pm=g.matrix.clone(),pp=g.parent;g.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(g.matrixWorld).invert();_bx.makeEmpty();
      g.traverse(o=>{if(o.isMesh&&o.visible&&o.geometry){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(_m4.multiplyMatrices(inv,o.matrixWorld));_bx.union(b);}});
      if(_bx.isEmpty())return null;const sz=_bx.getSize(new THREE.Vector3()),foot=Math.max(sz.x,sz.z);g.getWorldPosition(_wp);
      // only things that roll along the ground (cranes and hoists overhead move too, but are machinery, not pieces pushed about)
      if(foot<1.2||foot>80||Math.abs(_wp.y+_bx.min.y)>0.7||sz.y>1.8*foot){VSKIP.add(g);return null;}
      const pup=new THREE.Group();pup.userData.puppet=true;const kids=g.children.slice();for(const k of kids)pup.add(k);g.add(pup);
      g.traverse(o=>{if(o.isMesh)cardify(o,true);});
      // one ink outline for the whole vehicle (one draw): the shells of its big parts (body, cab, trailer, tank: 1 m and up, so
      // cargo and wheels, which come and go or spin, have none), merged in the puppet's own frame
      {pup.updateMatrixWorld(true);const pinv=new THREE.Matrix4().copy(pup.matrixWorld).invert(),parts=[];
        pup.traverse(o=>{if(!paperPart(o)||!o.geometry||!o.geometry.attributes.position||o.geometry.attributes.position.count>1600)return;const m=o.material;
          if(m.side!==THREE.FrontSide||(o.geometry.parameters&&o.geometry.parameters.openEnded))return;const [sx,sy,sz]=dims(o);if(Math.max(sx,sy,sz)<1.0||Math.min(sx,sy,sz)<0.25)return;
          const before=o.children.length;addHull(o,sx,sy,sz);const h=o.children[o.children.length-1];if(o.children.length===before)return;
          o.remove(h);const hg=h.geometry.index?h.geometry.toNonIndexed():h.geometry.clone();hg.applyMatrix4(_m4.multiplyMatrices(pinv,o.matrixWorld));
          parts.push(hg.attributes.position.array);});
        if(parts.length){const n=parts.reduce((a,b)=>a+b.length,0),arr=new Float32Array(n);let k=0;for(const a of parts){arr.set(a,k);k+=a.length;}
          const mg=new THREE.BufferGeometry();mg.setAttribute("position",new THREE.BufferAttribute(arr,3));mg.computeBoundingSphere();
          const vm=new THREE.Mesh(mg,INKM);vm.userData.inkHull=true;vm.raycast=()=>{};pup.add(vm);}}
      const v={g,pup,box:_bx.clone(),h:sz.y,moving:0,ph:Math.random()*6};VEH.set(g,v);return v;}
    function vehiclesStep(step){
      // find newly moving groups (top level, or one level down: the train's cars ride on a train group)
      const scan=o=>{if(!o.isGroup||VEH.has(o)||VSKIP.has(o)||o.userData.legs||o.userData.puppet)return;o.getWorldPosition(_wp);const l=VLAST.get(o);
        if(l){const d=Math.hypot(_wp.x-l.x,_wp.z-l.z);if(d>0.02&&d<40&&shownW(o))vehicleAdopt(o);l.copy(_wp);}else VLAST.set(o,_wp.clone());};
      for(const c of scene.children){scan(c);if(c.isGroup&&!VEH.has(c)&&c.children.length<12)for(const cc of c.children)scan(cc);}
      let n=0;
      for(const v of VEH.values()){const g=v.g;g.getWorldPosition(_wp);const l=VLAST.get(g)||_wp.clone();const mv=Math.hypot(_wp.x-l.x,_wp.z-l.z)>0.01;VLAST.set(g,_wp.clone());
        v.moving=mv?3:Math.max(0,v.moving-1);const on=v.moving>0;   // (keeps hopping for a few steps after a stop, then settles)
        v.pup.position.y=on&&(step+(v.ph|0))%2?0.09:0;v.pup.rotation.z=on?((step+(v.ph|0))%2?0.035:-0.035):0;v.pup.rotation.x=on?Math.sin(step*0.9+v.ph)*0.02:0;
        if(n<VMAX&&shownW(g)){g.matrixWorld.decompose(_wp,_wq,_ws);_e.setFromQuaternion(_wq,"YXZ");const b=v.box,cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;
          _p.set(cx,0,cz).applyQuaternion(_wq).add(_wp);const off=v.h*0.42;_e.x=0;_e.z=0;_wq.setFromEuler(_e);
          _m4.compose(_p.set(_p.x+0.62*off,_wp.y+0.06,_p.z+0.42*off),_wq,_ws.set((b.max.x-b.min.x)*1.02,1,(b.max.z-b.min.z)*1.02));VSH.setMatrixAt(n++,_m4);}}
      VSH.count=n;VSH.instanceMatrix.needsUpdate=true;}
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
        paperLight();if(G3.paperDollTick)G3.paperDollTick(now);try{if(!G3.noVehPaper)vehiclesStep(G3.paperSteps);}catch(e){if(!G3.vehErr){G3.vehErr=1;console.error("paper vehicles",e);}}if(!G3.paperShadowDone)G3.paperShadow();base(a);camKey();return;}
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
