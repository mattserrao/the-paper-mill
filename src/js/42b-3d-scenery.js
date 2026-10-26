  /* ---- v4.1 scenery: the world around the core mill, from the environment (SITE.env) and the mill seed (SITE.seed) ----
     Built once, after every other static object exists, so it can keep clear of all of them:
     1. A keep-out grid (2 m cells) is filled from the bounding boxes of every visible mesh and every instance of every
        instanced mesh (buildings, tanks, roads, aprons, fences, lamps, rail), plus the river, the rail line, the truck
        roads, the food-truck pitch and the staff-car road. Each placed object then marks its own footprint, so scenery
        never overlaps the mill or itself.
     2. Off-site roads (the highway the trucks use, the east access road for staff cars, a bridge over the river) and the
        rail line to the horizon.
     3. Environment kits: low-poly assets (trees, buildings, mesas, cacti, cypress, reeds...) and utilities that go with
        the site's pros and cons (water tower, substation, solar farm, barge dock...) in seeded spots near the fence.
     Everything is merged into a handful of vertex-coloured meshes (one per map sector, ~5 draws in all; only the one
     around the mill casts shadows). Walkers path round scenery trunks inside the yard (G3.navBoxes), and the camera is
     kept above scenery (G3.sceneryH). */
  {const ENVK=SITE.env,RNG=siteRng((SITE.seed*2654435761)^(ENV_IDS.indexOf(ENVK)+1)*40503),rr=(a,b)=>a+RNG()*(b-a),pick=a=>a[Math.floor(RNG()*a.length)];
    const F=FENCE,FD=G3.FOOD;
    /* ---------- 1. keep-out grid ---------- */
    const KX0=-420,KZ0=-320,KC=2,KNX=420,KNZ=320,KO=new Uint8Array(KNX*KNZ);   // 840 x 640 m
    const kIdx=(x,z)=>{const i=Math.floor((x-KX0)/KC),j=Math.floor((z-KZ0)/KC);return i<0||j<0||i>=KNX||j>=KNZ?-1:j*KNX+i;};
    function kMark(x0,x1,z0,z1,v=1){const i0=Math.max(0,Math.floor((x0-KX0)/KC)),i1=Math.min(KNX-1,Math.floor((x1-KX0)/KC)),j0=Math.max(0,Math.floor((z0-KZ0)/KC)),j1=Math.min(KNZ-1,Math.floor((z1-KZ0)/KC));
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)if(KO[j*KNX+i]<v)KO[j*KNX+i]=v;}
    // free: no cell within radius r is taken (water cells, value 2, are fine for water plants)
    function kFree(x,z,r,water){const i0=Math.floor((x-r-KX0)/KC),i1=Math.floor((x+r-KX0)/KC),j0=Math.floor((z-r-KZ0)/KC),j1=Math.floor((z+r-KZ0)/KC);
      if(i0<0||j0<0||i1>=KNX||j1>=KNZ)return false;
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const v=KO[j*KNX+i];if(v===1||v===3||(v===2&&!water))return false;}return true;}
    {const bb=new THREE.Box3(),m4=new THREE.Matrix4(),gb=new THREE.Box3();scene.updateMatrixWorld(true);
      scene.traverse(o=>{if(!o.isMesh||!o.geometry)return;for(let x=o;x&&x!==scene;x=x.parent){if(!x.visible)return;const u=x.userData||{};if(u.legs||u.wheels||u.load||u.trike)return;}
        if(o.layers.mask!==1&&!o.isInstancedMesh)return;
        const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();gb.copy(g.boundingBox);
        const one=b=>{if(b.max.x-b.min.x>300||b.max.z-b.min.z>300)return;const m=b.max.y<0.3?0.8:1.6;kMark(b.min.x-m,b.max.x+m,b.min.z-m,b.max.z+m);};
        if(o.isInstancedMesh){for(let k=0;k<o.count;k++){o.getMatrixAt(k,m4);m4.premultiply(o.matrixWorld);bb.copy(gb).applyMatrix4(m4);one(bb);}}
        else{bb.copy(gb).applyMatrix4(o.matrixWorld);one(bb);}});}
    // the river and its banks (water plants allowed); v13: along the site's river line
    for(let x=-420;x<420;x+=2){const [zc,hw]=riverAt(x+1);kMark(x,x+2,zc-hw-3,zc+hw+3,2);}
    // the river line sampled every metre for the terrain (the levelling asks for it at every vertex)
    const RZT=new Float32Array(882*2);for(let i=0;i<882;i++){const r=riverAt(i-441);RZT[i*2]=r[0];RZT[i*2+1]=r[1];}
    const rDist=(x,z)=>{const i=Math.max(0,Math.min(881,Math.round(x)+441));return Math.abs(z-RZT[i*2])-RZT[i*2+1];};
    kMark(-420,-139,-33,-25,1);                                        // the rail line out to the horizon
    if(FD)kMark(FD.x-6,FD.x+6,FD.z-3,FD.z+6,1);                        // food-truck pitch (the truck is hidden until lunch)
    kMark(-150,-95,-8,17,1);                                           // truck roads up to the gate and the turning space
    const inside=(x,z,m=0)=>x>F.x0+m&&x<F.x1-m&&z>F.z0+m&&z<F.z1-m;
    /* ---------- geometry merger: vertex colours, flat normals, one mesh per sector ---------- */
    // sectors: the land round the fence ("near", shadowed) and the rest, in one mesh on phones and five on desktops
    // v15: away from the mill the land is cut into a grid of ~210 m chunks (up to 12 meshes), each with its own bounds, so
    // chunks behind the camera or off screen are culled whole; only Low folds everything outside the mill's ring into one
    const SEC={near:{p:[],c:[],n:0},far:{p:[],c:[],n:0}},secOf=(x,z)=>{if(x>-110&&x<100&&z>-60&&z<75)return "near";if(DEN<0.6)return "far";
      const k="g"+Math.max(0,Math.min(3,Math.floor((x+420)/210)))+"_"+Math.max(0,Math.min(2,Math.floor((z+320)/214)));return SEC[k]?k:(SEC[k]={p:[],c:[],n:0},k);};
    const _v=new THREE.Vector3(),_m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_e=new THREE.Euler(),_col=new THREE.Color();
    const TPL={};
    function tpl(k,make,fix){if(TPL[k])return TPL[k];let g=make();if(g.index)g=g.toNonIndexed();const a=g.attributes.position.array;
      // hand-built shapes: turn every triangle to face away from the shape's axis (x = z = 0, at the triangle's own height)
      if(fix)for(let t=0;t<a.length;t+=9){const ux=a[t+3]-a[t],uy=a[t+4]-a[t+1],uz=a[t+5]-a[t+2],vx=a[t+6]-a[t],vy=a[t+7]-a[t+1],vz=a[t+8]-a[t+2];
        const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,cx=(a[t]+a[t+3]+a[t+6])/3,cy=(a[t+1]+a[t+4]+a[t+7])/3,cz=(a[t+2]+a[t+5]+a[t+8])/3;
        if(nx*cx+ny*(cy-fix)+nz*cz<0)for(let k=0;k<3;k++){const s=a[t+3+k];a[t+3+k]=a[t+6+k];a[t+6+k]=s;}}
      return TPL[k]=a;}
    // add a template with a transform and colour; shade darkens toward the base for a little ambient occlusion
    function add(arr,x,y,z,sx,sy,sz,ry,hex,shade=0.18,sec,rx=0,rz=0){const S2=SEC[sec==="near"?"near":secOf(x,z)];_col.set(G3.palQ?G3.palQ(hex):hex).convertSRGBToLinear();y+=hAt(x,z);
      _e.set(rx,ry,rz);_q.setFromEuler(_e);_m.compose(_v.set(x,y,z),_q,_s.set(sx,sy,sz));const e=_m.elements;
      let lo=1e9,hi=-1e9;for(let i=1;i<arr.length;i+=3){lo=Math.min(lo,arr[i]);hi=Math.max(hi,arr[i]);}const span=Math.max(1e-6,hi-lo);
      for(let i=0;i<arr.length;i+=3){const ax=arr[i],ay=arr[i+1],az=arr[i+2];
        S2.p.push(e[0]*ax+e[4]*ay+e[8]*az+e[12],e[1]*ax+e[5]*ay+e[9]*az+e[13],e[2]*ax+e[6]*ay+e[10]*az+e[14]);
        const k=1-shade*(1-(ay-lo)/span);S2.c.push(_col.r*k,_col.g*k,_col.b*k);}S2.n+=arr.length/9;}
    // templates (unit size, base at y=0, no hidden bottom faces)
    const T={box:tpl("box",()=>{const g=new THREE.BoxGeometry(1,1,1);g.translate(0,0.5,0);const ng=g.toNonIndexed(),a=ng.attributes.position.array,keep=[];
        for(let t=0;t<a.length;t+=9){const ys=[a[t+1],a[t+4],a[t+7]];if(ys.every(y=>y<1e-6))continue;for(let k=0;k<9;k++)keep.push(a[t+k]);}
        const out=new THREE.BufferGeometry();out.setAttribute("position",new THREE.Float32BufferAttribute(keep,3));return out;}),
      ico:tpl("ico",()=>new THREE.IcosahedronGeometry(1,0)),
      cyl6:tpl("cyl6",()=>{const g=new THREE.CylinderGeometry(1,1,1,6,1,true);g.translate(0,0.5,0);return g;}),
      cyl10:tpl("cyl10",()=>{const g=new THREE.CylinderGeometry(1,1,1,10,1,false);g.translate(0,0.5,0);return g;}),
      tri3:tpl("tri3",()=>{const g=new THREE.CylinderGeometry(0.7,1,1,3,1,true);g.translate(0,0.5,0);return g;}),
      cone6:tpl("cone6",()=>{const g=new THREE.ConeGeometry(1,1,6,1,true);g.translate(0,0.5,0);return g;}),
      cone4:tpl("cone4",()=>{const g=new THREE.ConeGeometry(1,1,4,1,true);g.translate(0,0.5,0);return g;}),
      dome:tpl("dome",()=>new THREE.SphereGeometry(1,8,3,0,Math.PI*2,0,Math.PI/2)),
      // gable roof: ridge along x, eaves at y=0, ridge at y=1, width 1 (z), length 1 (x)
      gable:tpl("gable",()=>{const v=[-0.5,0,-0.5, 0.5,0,-0.5, 0.5,1,0, -0.5,0,-0.5, 0.5,1,0, -0.5,1,0, 0.5,0,0.5, -0.5,0,0.5, -0.5,1,0, 0.5,0,0.5, -0.5,1,0, 0.5,1,0,
        -0.5,0,0.5, -0.5,0,-0.5, -0.5,1,0, 0.5,0,-0.5, 0.5,0,0.5, 0.5,1,0];const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(v,3));return g;},0.2),
      quad:tpl("quad",()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g;}),
      mound:tpl("mound",()=>{const g=new THREE.SphereGeometry(1,7,3,0,Math.PI*2,0,Math.PI/2);return g;})};
    // flat polygon on the ground (water patches, fields): a fan of triangles, pre-transformed
    function poly(pts,y,hex,sec){const S2=SEC[sec==="near"?"near":secOf(pts[0][0],pts[0][1])];_col.set(hex).convertSRGBToLinear();let cx=0,cz=0;pts.forEach(p=>{cx+=p[0];cz+=p[1];});cx/=pts.length;cz/=pts.length;y+=hAt(cx,cz);
      for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];S2.p.push(cx,y,cz,b[0],y,b[1],a[0],y,a[1]);for(let k=0;k<3;k++)S2.c.push(_col.r,_col.g,_col.b);S2.n++;}}
    // camera height floor and walker obstacles
    const HC=8,HNX=106,HNZ=80,HX0=-424,HZ0=-320,HM=new Float32Array(HNX*HNZ);
    function hMark(x,z,r,h){const i0=Math.max(0,Math.floor((x-r-HX0)/HC)),i1=Math.min(HNX-1,Math.floor((x+r-HX0)/HC)),j0=Math.max(0,Math.floor((z-r-HZ0)/HC)),j1=Math.min(HNZ-1,Math.floor((z+r-HZ0)/HC));
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)HM[j*HNX+i]=Math.max(HM[j*HNX+i],h);}
    G3.sceneryH=(x,z)=>{const i=Math.floor((x-HX0)/HC),j=Math.floor((z-HZ0)/HC);return (i<0||j<0||i>=HNX||j>=HNZ?0:HM[j*HNX+i])+(G3.terrainH?G3.terrainH(x,z):0);};
    const NB=G3.navBoxes=[];
    // claim a footprint: keep-out, camera floor, and (inside the yard) a walker obstacle at the trunk
    function claim(x,z,r,h,trunk){kMark(x-r,x+r,z-r,z+r,3);hMark(x,z,r,h);if(trunk&&x>-62&&x<88&&z>-52&&z<53)NB.push([x-trunk,x+trunk,z-trunk,z+trunk]);}
    const place=(x,z,r,water)=>kFree(x,z,r,water);
    // where the utilities and features ended up (zen camera shots, the brownout's substation): name -> [x, z, height]
    const UTIL={};const note=(k,x,z,h)=>{UTIL[k]=[+x.toFixed(1),+z.toFixed(1),h];};
    // graphics tier: scenery density (Low 0.5 ... Ultra 1.4); the yard and the utilities are the same at every tier
    const DEN=G3.GFX&&G3.GFX.scenery!=null?G3.GFX.scenery:1;
    /* ---------- noise for natural clustering ---------- */
    const NG=[];for(let k=0;k<40*32;k++)NG.push(RNG());
    function noise(x,z,s=60){const fx=(x+420)/s,fz=(z+320)/s,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,g=(a,b)=>NG[((b%32+32)%32)*40+((a%40+40)%40)];
      const su=u*u*(3-2*u),sv=v*v*(3-2*v);return (g(i,j)*(1-su)+g(i+1,j)*su)*(1-sv)+(g(i,j+1)*(1-su)+g(i+1,j+1)*su)*sv;}
    /* ---------- terrain (v4.1 pass 3): gentle relief outside the fence, flat corridors for the river, rail and roads,
       flat pads under the features; everything placed through add() stands on it ---------- */
    const RELIEF=0,   /* (v6.1 t7: flat paper ground on every map; was rural 11 m, desert 5.5 m of relief) */PADS=[],CORR=[];
    const sstep=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
    const dFence=(x,z)=>{const dx=Math.max(F.x0-x,0,x-F.x1),dz=Math.max(F.z0-z,0,z-F.z1);return Math.hypot(dx,dz);};
    const dSeg=(x,z,a,b)=>{const vx=b[0]-a[0],vz=b[1]-a[1],L=vx*vx+vz*vz||1e-6,t=Math.max(0,Math.min(1,((x-a[0])*vx+(z-a[1])*vz)/L));return Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t);};
    // v14: on the bayou the mill stands on a raised dry pad (PLAT); the wetland lies 1.4 m lower beyond its graded edge,
    // the canal levee and the roads (causeways) stay at the pad's level
    const PLAT={x0:-172,x1:178,z0:-60,z1:100};
    function hBase(x,z){let h;
      if(ENVK==="swamp"){const dx=Math.max(PLAT.x0-x,0,x-PLAT.x1),dz=Math.max(PLAT.z0-z,0,z-PLAT.z1);h=-1.4*sstep(2,14,Math.hypot(dx,dz));if(!h)return 0;}
      else{if(!RELIEF)return 0;const f=sstep(100,230,dFence(x,z));if(f<=0)return 0;
        let n=ENVK==="desert"?noise(x*0.55,z*1.7,52)*1.1+noise(x,z,140)*0.6-0.55:noise(x,z,95)*1.35+noise(x,z,38)*0.45-0.62;
        n=Math.max(0,n);h=RELIEF*f*n*(ENVK==="desert"?1.15:1.0);}
      // the river and its banks stay level, rising over 10 m from 12 m beyond the water; the rail line out west likewise
      // (v13: measured from the site's river line)
      {const d=rDist(x,z);if(d<22)h*=sstep(12,22,d);}
      if(x<-124&&z>-46&&z<-12)h*=sstep(0,6,Math.max(-40-z,z+18));
      for(let k=0;k<CORR.length;k++){const c=CORR[k];for(let i=1;i<c.length;i++){const d=dSeg(x,z,c[i-1],c[i]);if(d<44){h*=sstep(14,44,d);if(h===0)return 0;}}}
      return h;}
    // a pad: flat ground of radius r at (x,z), blended into the slope over the next 18 m (features, lakes, big utilities)
    function pad(x,z,r){PADS.push([x,z,r,hBase(x,z)]);}
    // (v4.1 pass 5: the river band is levelled again after the pads: a pad's blend could lift the ground over the water)
    function hAt(x,z){let h=hBase(x,z);for(let k=0;k<PADS.length;k++){const p=PADS[k],d=Math.hypot(x-p[0],z-p[1]);if(d<p[2]+18){const b=1-sstep(p[2],p[2]+18,d);h=h+(p[3]-h)*b;}}
      if(h){const d=rDist(x,z);if(d<22)h*=sstep(12,22,d);}
      // (v13: and the roads stay level through a pad's blend too)
      if(h)for(let k=0;k<CORR.length;k++){const c=CORR[k];for(let i=1;i<c.length;i++){const d=dSeg(x,z,c[i-1],c[i]);if(d<44){h*=sstep(14,44,d);if(h===0)return 0;}}}if(h&&x<-124&&z>-46&&z<-12)h*=sstep(0,6,Math.max(-40-z,z+18));return h;}
    G3.terrainH=hAt;
    /* ---------- assets ---------- */
    const GREEN=["#6fa76b","#5f9a63","#7cb072","#8ab879","#5b8f5c","#4f8257","#94bf6e","#6a9a4f","#7aa88a"],AUT=["#c9a24a","#d08a3c","#b9673a"],BARK=["#7a5a3c","#6b4f36","#8a6a4a"];
    /* v6.1 t7: paper-card trees. The camera never turns, so a tree is a flat standee facing it: a crown polygon and a trunk
       strip, a few triangles in the same vertex-coloured scenery mesh (lighter at the top, darker at the base), instead of a
       3D crown and trunk. CR/CU are the camera's right and the card's up (world up); cards wind toward the camera. */
    const CR=[Math.SQRT1_2,0,Math.SQRT1_2],CRF=[CR,[Math.SQRT1_2,0,-Math.SQRT1_2]],_cc=new THREE.Color(),_cc2=new THREE.Color();
    function card(x,y0,z,pts,hex,shade=0.3,fwd=0,hexLo){const S2=SEC[secOf(x,z)];const yb=y0+hAt(x,z);x-=Math.SQRT1_2*fwd;z+=Math.SQRT1_2*fwd;   /* (fwd: a crown sits a hair in front of its trunk) */_cc.set(G3.palQ(hex)).convertSRGBToLinear();_cc2.set(G3.palQ(hexLo||hex)).convertSRGBToLinear();
      let lo=1e9,hi=-1e9;for(const p of pts){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);}const span=Math.max(1e-6,hi-lo);
      // (v6.12 free camera: two crossed cards, each with both faces, so a tree reads as a tree from any side)
      for(const B of (G3.geomFree?CRF:[CR]))for(const back of (G3.geomFree?[false,true]:[false])){const P=(u,v)=>[x+B[0]*u,yb+v,z+B[2]*u];
        for(let i=1;i<pts.length-1;i++)for(const p of (back?[pts[0],pts[i+1],pts[i]]:[pts[0],pts[i],pts[i+1]])){const w=P(p[0],p[1]);S2.p.push(w[0],w[1],w[2]);const t=(p[1]-lo)/span,k=1-shade*(1-t);
          S2.c.push((_cc2.r+(_cc.r-_cc2.r)*t)*k,(_cc2.g+(_cc.g-_cc2.g)*t)*k,(_cc2.b+(_cc.b-_cc2.b)*t)*k);}
        S2.n+=pts.length-2;}}
    const ring=(cx,cy,rx,ry,n,j)=>{const o=[];for(let i=0;i<n;i++){const a=Math.PI/2-i/n*Math.PI*2,k=1+(j?(RNG()-0.5)*j:0);o.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k]);}return o.reverse();};
    function trunk(x,z,w,h,hex){card(x,0,z,[[-w/2,0],[w/2,0],[w/2,h],[-w/2,h]],hex,0.15);}
    function broadleaf(x,z,s,far,tight){if(!place(x,z,(tight?0.7:1.6)*s))return false;const c=RNG()<0.06?pick(AUT):pick(GREEN);
      trunk(x,z,0.45*s,2.6*s,pick(BARK));card(x,0,z,ring(0,3.6*s,1.9*s,1.75*s,7,0.25),c,0.35,0.08);claim(x,z,(tight?0.75:1.7)*s,5.2*s,0.3*s);return true;}
    function conifer(x,z,s,tight){if(!place(x,z,(tight?0.55:1.3)*s))return false;const c=pick(["#3f6f4f","#4a7a55","#557f58","#3d6a52"]);trunk(x,z,0.4*s,1.6*s,pick(BARK));
      card(x,0,z,[[-1.7*s,1.1*s],[1.7*s,1.1*s],[0,4.5*s]],c,0.3,0.08);card(x,0,z,[[-1.25*s,3.2*s],[1.25*s,3.2*s],[0,6.1*s]],c,0.25,0.16);claim(x,z,(tight?0.6:1.5)*s,6.1*s,0.3*s);return true;}
    function bush(x,z,s,hex){if(!place(x,z,0.9*s))return false;const h=hex||pick(GREEN);card(x,0,z,[[-1.0*s,0],[1.0*s,0],[0.75*s,0.75*s],[0,1.05*s],[-0.75*s,0.75*s]],h,0.3);claim(x,z,0.9*s,1.1*s);return true;}
    function rock(x,z,s,hex){if(!place(x,z,1.1*s))return false;add(T.ico,x,0.2*s,z,1.2*s,0.75*s,1.0*s,RNG()*6,hex,0.25);claim(x,z,1.2*s,1*s);return true;}
    function house(x,z,ry,w,d,h,wall,roof){add(T.box,x,0,z,w,h,d,ry,wall,0.15);add(T.gable,x,h,z,w+0.4,h*0.55,d+0.5,ry,roof,0.05);}
    const NW=[];   // lit windows for the night (urban): [x,y,z,w,h,face] per window, merged into one mesh at the end
    function building(x,z,w,d,h,ry,hex,roofHex){add(T.box,x,0,z,w,h,d,ry,hex,0.2);add(T.box,x,h,z,w*0.98,0.6,d*0.98,ry,roofHex||"#5b6270",0.05);
      const y0=hAt(x,z);
      // window bands: thin darker slabs every 3.5 m on taller buildings; rooftop units and a water tank on some
      if(h>9){const glass=pick(["#3c4a5c","#46576d","#2f3a49"]),st=Math.max(3.5,(h-4)/4);for(let y=2.6;y<h-1.5;y+=st){add(T.box,x,y,z,w+0.08,1.2,d+0.08,ry,glass,0);
          if(DEN>=0.85)for(const f of [0,1,2,3]){const len=f%2?d:w,n=Math.max(1,Math.floor(len/3.6));for(let k=0;k<n;k++){if(RNG()>0.42)continue;const t=(k+0.5)/n-0.5;
            const wx=f===0?x+w/2+0.05:f===2?x-w/2-0.05:x+t*len,wz=f===1?z+d/2+0.05:f===3?z-d/2-0.05:z+t*len;NW.push([wx,y0+y+0.6,wz,1.3,1.0,f]);}}}
        // rooftop plant and the odd water tank (phones: one unit, no tank; sub-pixel at that range anyway)
        for(let k=0,n=DEN<1?1:2+Math.floor(RNG()*3);k<n;k++)add(T.box,x+rr(-w/3,w/3),h+0.6,z+rr(-d/3,d/3),rr(1.2,2.4),rr(0.8,1.6),rr(1.2,2.4),0,"#9aa0a8",0.15);
        if(DEN>=1&&RNG()<0.35){add(T.cyl10,x+rr(-w/4,w/4),h+0.6,z+rr(-d/4,d/4),1.3,2.6,1.3,0,"#7a5a3c",0.15);}}
      else if(DEN>=0.85){for(const f of [0,1,2,3]){const len=f%2?d:w,n=Math.max(1,Math.floor(len/4));for(let k=0;k<n;k++){if(RNG()>0.3)continue;const t=(k+0.5)/n-0.5;
          const wx=f===0?x+w/2+0.05:f===2?x-w/2-0.05:x+t*len,wz=f===1?z+d/2+0.05:f===3?z-d/2-0.05:z+t*len;NW.push([wx,y0+h*0.55,wz,1.6,1.1,f]);}}}}
    function silo(x,z,r,h,hex){add(T.cyl10,x,0,z,r,h,r,0,hex,0.15);add(T.dome,x,h,z,r,r*0.7,r,0,"#9aa0a8",0.05);}
    /* ---------- 2. roads, rail and bridges (v13: laid out after the v13 site maps) ---------- */
    const ROADC=ENVK==="desert"?"#6f6a62":"#5a5f69",LANE=ENVK==="urban"?"#f2f2f2":"#f2c230",SHOULD=ENVK==="desert"?"#c9b791":ENVK==="swamp"?"#7d7457":"#b9b29c";
    const TRACK={rural:"#b8a57f",urban:"#a9a59a",desert:"#ead9b4",swamp:"#a99b74"}[ENVK];
    function road(pts,w,dash,sec){CORR.push(pts);for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),ry=Math.atan2(-dz,dx),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;
        add(T.quad,mx,0.024,mz,L+w*0.6,1,w+1.6,ry,SHOULD,0,sec);add(T.quad,mx,0.03,mz,L+w*0.5,1,w,ry,ROADC,0,sec);
        if(dash)for(let d=2;d<L-2;d+=7){const f=d/L;add(T.quad,a[0]+dx*f,0.036,a[1]+dz*f,3,1,0.22,ry,LANE,0,sec);}
        const n=Math.ceil(L/2);for(let k=0;k<=n;k++){const x=a[0]+dx*k/n,z=a[1]+dz*k/n;kMark(x-w/2-1.5,x+w/2+1.5,z-w/2-1.5,z+w/2+1.5,1);}}}
    // smooth a polyline (Catmull-Rom, a point every ~step m)
    function smooth(pts,step=6){const out=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
        for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>0.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);out.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
      out.push(pts[pts.length-1].slice());return out;}
    // a band of width w (a number, or a function of the distance along it, 0..1) along a smoothed polyline, draped on the terrain: tracks, washes, bayou channels, gravel bars.
    // wob widens and narrows it with the noise; ko marks the keep-out (1 solid, 2 water); returns the smoothed points
    function strip(pts,w,y,hex,ko,wob=0,sec){const P=smooth(pts),S2=SEC[sec==="near"?"near":secOf(P[0][0],P[0][1])];_col.set(hex).convertSRGBToLinear();const L=[],R=[];
      for(let i=0;i<P.length;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
        const hw=(typeof w==="function"?w(i/Math.max(1,P.length-1)):w)/2*(1+wob*(noise(P[i][0]*3,P[i][1]*3,40)-0.5)*2);L.push([P[i][0]-dz*hw,P[i][1]+dx*hw]);R.push([P[i][0]+dz*hw,P[i][1]-dx*hw]);if(ko)kMark(P[i][0]-hw-1,P[i][0]+hw+1,P[i][1]-hw-1,P[i][1]+hw+1,ko);}
      const v=p=>{S2.p.push(p[0],y+hAt(p[0],p[1]),p[1]);S2.c.push(_col.r,_col.g,_col.b);};
      for(let i=1;i<P.length;i++){v(L[i-1]);v(L[i]);v(R[i-1]);v(R[i-1]);v(L[i]);v(R[i]);S2.n+=2;}return P;}
    const track=(pts,w=3.4,hex=TRACK)=>strip(pts,w,0.05,hex,1,0.15);
    // v14: name boards (two posts in the merged mesh, the board itself a small textured plane made at the end)
    const SIGNS=[];function sign(x,z,ry,text,bg,fg){const c=Math.cos(ry),s2=Math.sin(ry);[-1,1].forEach(k=>add(T.box,x+k*3.4*c,0,z-k*3.4*s2,0.22,3.6,0.22,0,"#6b7079",0));SIGNS.push([x,z,ry,text,bg,fg]);}
    const channel=(pts,w,hex)=>{const wf=typeof w==="function"?w:()=>w;const P=strip(pts,t=>wf(t)+4,0.03,ENVK==="swamp"?"#6f6548":"#c9c1a8",2,0.6);strip(pts,wf,0.045,hex,2,0.6);return P;};
    // the highway (west of the gate) and the east road, straight as on the maps; the swamp's highway bends west up north
    const HXr=-158,EX={rural:160,urban:112,desert:144,swamp:160}[ENVK],RZ=x=>riverAt(Math.max(-440,Math.min(440,x)));
    const north=ENVK==="swamp"?[[HXr-22,-320],[HXr-20,-250],[HXr-4,-195]]:[[HXr,-320]],[hz,hw0]=RZ(HXr),[ez,ew0]=RZ(EX);
    const SEA=(RIVERS[ENVK]||{}).kind==="sea";   // the city by the sea: no far bank, so no bridges and no roads beyond
    if(!SEA)road([...north,[HXr,hz-hw0-9]],9,true);road([[HXr,hz+hw0+9],[HXr,-3.8],[HXr,12.5],[HXr,80],[HXr,320]],9,true);road([[-140,-3.8],[HXr,-3.8]],5.6,false,"near");road([[-140,12.5],[HXr,12.5]],5.6,false,"near");
    road([[100,32.5],[EX,32.5]],6,false,"e");if(!SEA)road([[EX,-320],[EX,ez-ew0-9]],7,true);road([[EX,ez+ew0+9],[EX,32.5],[EX,110],[EX,320]],7,true);
    // bridges: deck, parapets and piers across the water and its banks
    function bridge(x,w){const [zc,hw]=RZ(x),L=2*hw+20;add(T.box,x,1.2,zc,w+2,0.5,L,0,"#9a9ea6",0.1);[-1,1].forEach(s2=>add(T.box,x+s2*(w/2+0.5),1.7,zc,0.4,0.9,L,0,"#c8ccd2",0.1));
      for(let z=zc-hw-6;z<=zc+hw+6.1;z+=Math.max(8,(2*hw+12)/Math.ceil((2*hw+12)/16)))add(T.box,x,0,z,w,1.2,1.2,0,"#8a8e96",0.2);add(T.quad,x,1.46,zc,w,1,L,0,ROADC,0);
      if(L>40)for(let d=-L/2+3;d<L/2-3;d+=7)add(T.quad,x,1.48,zc+d,0.22,1,3,0,LANE,0);kMark(x-w/2-3,x+w/2+3,zc-L/2,zc+L/2,1);hMark(x,zc,Math.max(8,L/2),3);}
    if(!SEA){bridge(HXr,9);bridge(EX,7);}
    // rail line from the spur out to the horizon (the train arrives from the west), level crossing at the highway
    {const n=Math.floor((-139+420)/0.8);for(let k=0;k<n;k+=2){const x=-139.4-k*0.8;add(T.box,x,0,-29,0.35,0.14,2.6,0,"#7b5d42",0,x>-110?"near":"w");}
      [-29.7,-28.3].forEach(z=>{for(let x=-139;x>-420;x-=40)add(T.box,x-20,0.14,z,40,0.16,0.12,0,"#8d939c",0,x>-110?"near":"w");});
      add(T.quad,HXr,0.04,-29,10,1,4,0,"#6d6a63",0);[-1,1].forEach(s2=>{add(T.box,HXr+s2*6,0,-29+s2*3,0.25,3.2,0.25,0,"#f2f2f2",0.1);add(T.box,HXr+s2*6,2.6,-29+s2*3,0.9,0.5,0.15,0,"#d6382c",0);});}
    const onRiver=(x,z,m=4)=>{const [zc,hw]=RZ(x);return Math.abs(z-zc)<hw+m;};
    /* ---------- 3. landmarks: fixed spots from the v13 site maps (the seed only varies the details and the fill) ---------- */
    const LM={
      waterTower(x,z){const h=22;pad(x,z,9);[[-2.4,-2.4],[2.4,-2.4],[-2.4,2.4],[2.4,2.4]].forEach(([a,b])=>add(T.box,x+a,0,z+b,0.45,h,0.45,0,"#9aa3ad",0.2));
        add(T.cyl10,x,h,z,5,5,5,0,"#e9ecef",0.15);add(T.cyl10,x,h+3.6,z,5.05,0.5,5.05,0,MILL.brand||"#c92a2a",0);add(T.cone6,x,h+5,z,5.3,2.2,5.3,0,"#c7ccd3",0.05);add(T.cyl6,x,0,z,0.6,h,0.6,0,"#9aa3ad",0.1);
        add(T.quad,x,0.03,z,18,1,18,0,"#c8c6bf",0);claim(x,z,7,h+7,0);note("waterTower",x,z,h+7);},
      substation(x,z,n=3){pad(x,z,13);add(T.quad,x,0.03,z,22,1,18,0,"#b6b3aa",0);for(let k=0;k<n;k++){const tx=x-6+k*6;add(T.box,tx,0,z-2,3.2,3,2.4,0,"#7d8792",0.25);
          add(T.box,tx,3,z-2,0.3,2.2,0.3,0,"#4a4f58",0);add(T.box,tx-1,3,z-2,0.3,1.6,0.3,0,"#4a4f58",0);}
        add(T.box,x+6,0,z+4,4,2.6,3,0,"#c9c4ba",0.15);
        [[-9,-7],[9,-7],[-9,7],[9,7]].forEach(([a,b])=>add(T.box,x+a,0,z+b,0.3,6,0.3,0,"#8d939c",0.1));add(T.box,x,5.8,z-7,18,0.3,0.3,0,"#8d939c",0);add(T.box,x,5.8,z+7,18,0.3,0.3,0,"#8d939c",0);
        [[0,-9,22,0.1],[0,9,22,0.1],[-11,0,0.1,18],[11,0,0.1,18]].forEach(([a,b,w,d])=>add(T.box,x+a,0,z+b,w,2.2,d,0,"#a8b0b8",0.3));claim(x,z,12,7,0);note("substation",x,z,7);return [x,z];},
      // v6.10: the mill's own feeder, wood poles with three wires from the substation to the riser pole at the fence (38c MCC.riser)
      feeder(sub){const M2=G3.MCC;if(!M2||!sub)return;const [rx,rz]=M2.riser,zo=F.z1+8,pts=[[sub[0]+(sub[0]<rx?11:-11),sub[1]]];
        if(Math.abs(sub[1]-zo)>12)pts.push([sub[0]+(sub[0]<rx?11:-11),zo]);pts.push([rx,zo],[rx,rz]);
        const P2=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(L/34));for(let k=i?1:0;k<=n;k++)P2.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}
        const H=9.4;P2.forEach(([x,z],k)=>{if(k===P2.length-1)return;if(onRiver(x,z,1)||inside(x,z,2))return;add(T.cyl6,x,0,z,0.2,H+0.4,0.2,0,"#7b5d42",0.12);
          const nx=P2[k+1]||P2[k-1],ry=Math.atan2(-(nx[1]-z),nx[0]-x)+Math.PI/2;add(T.box,x,H,z,0.14,0.14,2.6,ry,"#7b5d42",0);claim(x,z,0.8,H,0);});
        for(let k=0;k<P2.length-1;k++){const [ax,az]=P2[k],[bx,bz]=P2[k+1],L=Math.hypot(bx-ax,bz-az),ry=Math.atan2(-(bz-az),bx-ax);
          [-1.1,0,1.1].forEach(o=>add(T.box,(ax+bx)/2+Math.cos(ry+Math.PI/2)*o,H+0.1,(az+bz)/2-Math.sin(ry+Math.PI/2)*o,L,0.05,0.05,ry,"#2b2f36",0,"near"));}
        note("feeder",rx,rz,H);},
      // a line of pylons; never inside the fence or on the water
      pylons(from,to){const n=Math.max(2,Math.round(Math.hypot(to[0]-from[0],to[1]-from[1])/55));for(let k=1;k<=n;k++){const x=from[0]+(to[0]-from[0])*k/n,z=from[1]+(to[1]-from[1])*k/n;if(inside(x,z,-8)||onRiver(x,z)||!place(x,z,2.5))continue;
          const ry=Math.atan2(-(to[1]-from[1]),to[0]-from[0])+Math.PI/2;add(T.cone4,x,0,z,1.5,24,1.5,ry,"#7d838c",0.15);add(T.box,x,17,z,0.25,0.35,9,ry,"#7d838c",0);add(T.box,x,20.5,z,0.25,0.3,6,ry,"#7d838c",0);claim(x,z,2,24,0);}},
      mast(x,z,h=52){pad(x,z,16);add(T.quad,x,0.03,z,10,1,10,0,"#b6b3aa",0);add(T.cone4,x,0,z,1.4,h,1.4,0.78,"#d6382c",0.1);for(let y=6;y<h-4;y+=12)add(T.cone4,x,y,z,1.4*(1-y/h)+0.05,4,1.4*(1-y/h)+0.05,0.78,"#f2f2f2",0.05);
        add(T.box,x,h,z,0.3,4,0.3,0,"#f2f2f2",0);add(T.box,x+3,0,z+3,3,2.4,2.4,0,"#c9c4ba",0.15);for(let k=0;k<3;k++){const a=k*2.094;add(T.cyl6,x+Math.cos(a)*14,0,z+Math.sin(a)*14,0.12,0.9,0.12,0,"#8d939c",0);}
        claim(x,z,4,h+4,0);note("mast",x,z,h+4);},
      lake(x,z,r,boat=true){pad(x,z,r*1.25);const pts=[],n=13;for(let k=0;k<n;k++){const a=k/n*6.283,rk=r*(0.7+0.6*noise(x+Math.cos(a)*90,z+Math.sin(a)*90,18));pts.push([x+Math.cos(a)*rk,z+Math.sin(a)*rk*0.85]);}
        poly(pts.map(([px,pz])=>[x+(px-x)*1.12,z+(pz-z)*1.12]),0.025,ENVK==="swamp"?"#6f6548":"#c9c1a8");poly(pts,0.035,ENVK==="swamp"?"#3f5f52":ENVK==="desert"?"#2f8f9c":"#3f6f8c");kMark(x-r*1.1,x+r*1.1,z-r*0.95,z+r*0.95,2);
        for(let k=0;k<18;k++){const a=rr(0,6.28),d=r*rr(0.98,1.14),rx=x+Math.cos(a)*d,rz=z+Math.sin(a)*d*0.85;if(!place(rx,rz,0.7,true))continue;for(let q=0;q<3;q++)add(T.cone4,rx+rr(-0.5,0.5),0,rz+rr(-0.4,0.4),0.12,rr(1.2,2),0.12,RNG(),"#7f8f4f",0.2);claim(rx,rz,0.6,2,0);}
        if(boat){const bx=x+r*1.05,bz=z;add(T.box,bx,0.3,bz,5,3,4,0,"#8a6a4a",0.15);add(T.gable,bx,3.3,bz,5.4,1.6,4.6,0,"#4a4f58",0);add(T.box,bx-5,0.25,bz,6,0.2,1.4,0,"#7b5d42",0);claim(bx,bz,4,5,0);}
        note("lake",x,z,1);},
      // logging yard: rows of log decks, a chip pile with its stacker, a loader shed, gravel all round
      logYard(x0,x1,z0,z1){const cx=(x0+x1)/2,cz=(z0+z1)/2;pad(cx,cz,Math.max(x1-x0,z1-z0)*0.55);add(T.quad,cx,0.022,cz,x1-x0,1,z1-z0,0,"#b9aa8a",0);kMark(x0,x1,z0,z1,3);
        // log decks: logs lying north-south, piled three high
        for(let d=0;d<7;d++){const dx=x0+8+d*8.2;for(let l=0;l<3;l++)for(let k=0;k<6-l;k++)add(T.cyl6,dx-2.4+k*0.95+l*0.47,0.42+l*0.78,z0+10+(z1-z0-20)*0.25,0.44,(z1-z0)*0.42,0.44,0,pick(["#8a6a4a","#7a5a3c","#9a7350","#a8845e"]),0.1,undefined,Math.PI/2,0);}
        for(let d=0;d<4;d++){const dx=x1-26+d*6.2;for(let l=0;l<2;l++)for(let k=0;k<5-l;k++)add(T.cyl6,dx-2+k*0.95+l*0.47,0.42+l*0.78,cz-8,0.44,(z1-z0)*0.55,0.44,0,pick(["#8a6a4a","#7a5a3c","#9a7350"]),0.1,undefined,Math.PI/2,0);}
        const px=cx+10,pz=cz+4;add(T.cone6,px,0,pz,22,13,19,RNG()*6,"#d9c39a",0.3);add(T.cone6,px+16,0,pz+12,10,6,9,RNG()*6,"#c9ab78",0.3);
        add(T.box,px-14,6,pz-12,2,0.8,26,0.8,"#8d939c",0.1,undefined,0.42,0);add(T.box,px-22,0,pz-20,3,7,3,0,"#e2c230",0.15);
        add(T.box,x1-12,0,z0+8,14,6,9,0,"#8a8f98",0.2);add(T.gable,x1-12,6,z0+8,14.4,2.2,9.6,0,"#5b6270",0);add(T.box,x0+6,0,z1-6,4,3,3,0,"#e2c230",0.15);
        hMark(cx,cz,Math.max(x1-x0,z1-z0)/2,14);note("chipPile",px,pz,13);note("logging",x0+30,z0+20,4);},
      farm(x,z,ry=0){pad(x,z,22);house(x,z,ry,12,8,6,"#a8322c","#5a3a2e");house(x+(ry?10:0),z+(ry?0:13),ry,8,7,4.5,"#f1ede4","#4a4f58");add(T.box,x+14,0,z-4,10,3.4,6,ry,"#9aa0a8",0.2);
        silo(x-10,z-7,2.4,12,"#c9ced6");silo(x-15,z-7,2.4,10,"#c9ced6");add(T.quad,x,0.02,z+3,30,1,22,ry,"#c2b48c",0);claim(x,z,18,15,0);note("farm",x,z,15);},
      // a field of crop rows (w along x, d along z), hay bales on the stubble ones
      field(x,z,w,d,c1,bales){pad(x,z,Math.max(w,d)/2);for(let k=0;k<d;k+=4)add(T.quad,x,0.02,z-d/2+k+1,w,1,2,0,k%8?c1:"#9a8a5a",0);kMark(x-w/2,x+w/2,z-d/2,z+d/2,3);
        if(bales)for(let k=0;k<7;k++){const bx=x+rr(-w/2+3,w/2-3),bz=z+rr(-d/2+3,d/2-3);add(T.cyl10,bx,0.75,bz,0.75,1.5,0.75,0,"#d6b65a",0.1,undefined,Math.PI/2);}
        // hedgerow round it
        for(let a=0;a<4;a++){const n=Math.floor((a%2?d:w)/5);for(let k=0;k<n;k++){if(RNG()<0.45)continue;const t=(k+0.5)/n-0.5,hx=a%2?x+(a===1?1:-1)*(w/2+2):x+t*w,hz=a%2?z+t*d:z+(a===0?-1:1)*(d/2+2);broadleaf(hx,hz,rr(0.6,0.9),false,true);}}},
      orchard(x,z,nx,nz){pad(x,z,Math.max(nx,nz)*3.4);add(T.quad,x,0.021,z,nx*6+4,1,nz*6+4,0,"#9cbc6e",0);for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const tx=x-(nx-1)*3+i*6,tz=z-(nz-1)*3+j*6;
          add(T.tri3,tx,0,tz,0.2,1.3,0.2,0,"#7a5a3c",0.1);add(T.ico,tx,2,tz,1.7,1.4,1.7,RNG()*6,pick(["#5f9a53","#6fa76b","#7cb072"]),0.3);}
        kMark(x-nx*3-2,x+nx*3+2,z-nz*3-2,z+nz*3+2,3);hMark(x,z,nx*3,3.5);note("orchard",x,z,3);},
      recycler(x,z){pad(x,z,18);add(T.quad,x,0.025,z,34,1,32,0,"#9a9ea6",0);add(T.box,x-6,0,z-6,18,7,12,0,"#a9b0ba",0.2);add(T.gable,x-6,7,z-6,18.4,2.2,12.6,0,"#6f7a88",0.05);
        for(let i=0;i<7;i++)for(let l=0;l<3;l++)add(T.box,x-12+i*2.2,l*1.1,z+7,2,1.05,1.8,0,pick(["#b07a43","#a7784a","#8f6a45","#c9c4ba","#5b8de4"]),0.1);
        for(let i=0;i<4;i++)add(T.box,x+8+(i%2)*4,0,z+(i<2?-8:2),3,2.2,6,0,pick(["#d6382c","#2a5aa8","#1f9254"]),0.15);add(T.box,x-6,7.4,z-12.3,10,1.4,0.2,0,"#2a5aa8",0);claim(x,z,16,10,0);note("recycler",x,z,10);},
      // rail yard: sidings either side of the main line, strings of boxcars and tank cars
      // rail yard: sidings either side of the main line, fanned off it by a ladder track with turnouts at the east end
      // (v14), buffer stops at the west end, strings of boxcars and tank cars; siding -18.5 is kept clear for the shunter
      railyard(x0,x1){const cx=(x0+x1)/2;pad(cx,-28,(x1-x0)/2);add(T.quad,cx,0.02,-28,x1-x0,1,34,0,"#a59d8c",0,"w");
        const rail=(ax,az,bx,bz)=>{const L=Math.hypot(bx-ax,bz-az),ry=Math.atan2(-(bz-az),bx-ax),nx=Math.sin(ry),nz=Math.cos(ry);
          [-0.7,0.7].forEach(o=>add(T.box,(ax+bx)/2+nx*o,0.14,(az+bz)/2+nz*o,L,0.16,0.12,ry,"#8d939c",0,"w"));for(let d=1;d<L;d+=1.6){const f=d/L;add(T.box,ax+(bx-ax)*f,0.02,az+(bz-az)*f,0.35,0.12,2.6,ry,"#7b5d42",0,"w");}};
        const LX=x1-6,SL=3;   // ladders leave the main line at LX, 1 m across for every 3 m along
        [[-34,-39,-44],[-23.5,-18.5,-13.5]].forEach(side=>{const far=side[2];rail(LX,-29,LX-SL*Math.abs(far+29),far);
          side.forEach(zz=>{const xk=LX-SL*Math.abs(zz+29);rail(x0+2,zz,xk,zz);add(T.box,x0+1.5,0,zz,0.8,1.2,3,0,"#d6382c",0.1,"w");
            for(let x=x0+10;x<xk-12;x+=15){if(RNG()<0.3||(zz===-18.5&&x>x0+40))continue;const tank=Math.abs(zz)===34||Math.abs(zz)===18.5?RNG()<0.6:false;
              if(tank)add(T.cyl10,x+6,1.0,zz,1.4,12,1.4,0,pick(["#2f3a49","#e9ecef","#5b6270"]),0.15,"w",0,Math.PI/2);
              else add(T.box,x,0.9,zz,13,3.3,2.8,0,pick(["#9b3d2a","#3d5f8c","#5b6270","#7a4a3a","#2f7d4f","#c9a24a"]),0.2,"w");}});});
        G3.actSpots=G3.actSpots||{};G3.actSpots.shunter={z:-18.5,xa:x0+50,xb:LX-SL*10.5-16};
        add(T.box,x1-20,0,-6,16,6,8,0,"#a5543f",0.2);add(T.gable,x1-20,6,-6,16.4,2,8.6,0,"#5b6270",0);kMark(x0,x1,-48,-8,3);hMark(cx,-28,(x1-x0)/2,5);note("railyard",cx,-28,5);},
      solarFarm(x,z,rows,cols){pad(x,z,Math.max(rows*5.6,cols*12)/2+6);add(T.quad,x,0.022,z,cols*12+8,1,rows*5.6+8,0,"#d8c79d",0);
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const px=x-cols*6+6+c*12,pz=z-rows*2.8+2.8+r*5.6;add(T.box,px,1.0,pz,11,0.12,2.8,0,"#2c3e63",0,undefined,-0.45);add(T.box,px,0,pz+0.6,0.2,1.2,0.2,0,"#8d939c",0);}
        // v14: a maintenance track round the field, an inverter skid in every other aisle, the transformer pad where the line leaves
        {const hx=cols*6+5,hz=rows*2.8+5;track([[x-hx,z-hz],[x+hx,z-hz],[x+hx,z+hz],[x-hx,z+hz],[x-hx,z-hz]],3.4,"#e3d1aa");G3.actSpots=G3.actSpots||{};G3.actSpots.pickup={x,z,hx,hz};}
        for(let r=1;r<rows;r+=2){add(T.box,x-cols*6-1.5,0,z-rows*2.8+r*5.6+0.2,1.8,1.6,1.2,0,"#e2e5e9",0.15);add(T.box,x-cols*6-1.5,1.6,z-rows*2.8+r*5.6+0.2,2,0.15,1.4,0,"#8d939c",0);}
        add(T.quad,x-cols*6-12,0.03,z+rows*2.8-4,9,1,8,0,"#c8c6bf",0);add(T.box,x-cols*6-12,0,z+rows*2.8-4,3.6,3,2.6,0,"#6f7a88",0.2);add(T.box,x-cols*6-12,3,z+rows*2.8-4,0.3,2,0.3,0,"#4a4f58",0);
        [[0,-5],[0,5],[-5,0],[5,0]].forEach(([a,b])=>add(T.box,x-cols*6-12+a,0,z+rows*2.8-4+b,a?0.1:10,2,a?10:0.1,0,"#a8b0b8",0.3));
        add(T.box,x+cols*6+3,0,z,3,2.4,6,0,"#e2e5e9",0.2);kMark(x-cols*6-4,x+cols*6+4,z-rows*2.8-4,z+rows*2.8+4,3);hMark(x,z,cols*6,2);note("solarFarm",x,z,2);G3.solarTx=[x-cols*6-12,z+rows*2.8-4];},
      waterTanks(x,z){pad(x,z,14);add(T.quad,x,0.025,z,26,1,22,0,"#d8cfb8",0);[[-5,0,5.5,7],[6,1,4.5,6]].forEach(([a,b,r,h])=>{add(T.cyl10,x+a,0,z+b,r,h,r,0,"#eceae4",0.15);add(T.dome,x+a,h,z+b,r,r*0.25,r,0,"#dcd9d0",0.05);});claim(x,z,11,8,0);note("waterTanks",x,z,8);},
      // a lined reservoir: a dark rectangle in a concrete rim
      reservoir(x,z,w,d){pad(x,z,Math.max(w,d)/2+4);add(T.box,x,0,z,w+2,0.6,d+2,0,"#c9c4ba",0.1);add(T.quad,x,0.62,z,w,1,d,0,"#1f5f6a",0);kMark(x-w/2-2,x+w/2+2,z-d/2-2,z+d/2+2,3);hMark(x,z,Math.max(w,d)/2,1);},
      windpump(x,z){pad(x,z,4);add(T.cone4,x,0,z,1.4,9,1.4,0.6,"#8a8f98",0.2);add(T.cyl6,x,9,z+0.4,1.6,0.1,1.6,0,"#c9ced6",0,undefined,Math.PI/2);add(T.cyl10,x+3,0,z+2,1.6,1,1.6,0,"#8a8f98",0.1);claim(x,z,2,10,0);note("windpump",x,z,10);},
      oasis(x,z){pad(x,z,18);const pts=[];for(let k=0;k<9;k++){const a=k/9*6.283,rk=rr(6,10);pts.push([x+Math.cos(a)*rk,z+Math.sin(a)*rk*0.8]);}poly(pts,0.03,"#3fa0b2");kMark(x-10,x+10,z-8,z+8,2);
        for(let k=0;k<12;k++){const a=rr(0,6.28),d=rr(9,16),tx=x+Math.cos(a)*d,tz=z+Math.sin(a)*d*0.8,s=rr(0.8,1.2);if(!place(tx,tz,1.2,true))continue;add(T.cyl6,tx,0,tz,0.25*s,6*s,0.25*s,0,"#8a6a4a",0.15);for(let f=0;f<6;f++)add(T.box,tx+Math.cos(f*1.05)*1.6*s,6*s,tz+Math.sin(f*1.05)*1.6*s,3.2*s,0.12,0.7*s,-f*1.05,"#5f8a4e",0.1,undefined,0,-0.5);claim(tx,tz,1.2,7*s,0.3);}
        note("oasis",x,z,7);},
      ranch(x,z){pad(x,z,28);add(T.quad,x,0.02,z,46,1,34,0,"#d8c08e",0);house(x,z,0,10,8,4,"#d9c8a8","#7a4a3a");add(T.box,x+15,0,z+2,10,6,8,0,"#a8322c",0.15);add(T.gable,x+15,6,z+2,10.4,2.6,8.6,0,"#5a3a2e",0);
        for(let k=0;k<14;k++){const a=k/14*6.283;add(T.box,x-15+Math.cos(a)*9,0,z+6+Math.sin(a)*7,0.2,1.3,0.2,0,"#8a6a4a",0);}add(T.cyl6,x-15,1.3,z+6,9,0.08,7,0,"#8a6a4a",0);
        add(T.box,x+4,0,z-10,6,2.4,4,0,"#c9c4ba",0.15);for(let k=0;k<4;k++)broadleaf(x+rr(-18,18),z+rr(-14,-8),rr(0.7,1),false,true);claim(x,z,22,8,0);note("ranch",x,z,8);},
      bargeDock(x,z){add(T.box,x,0.4,z,30,0.5,5,0,"#8a8e96",0.1);for(let k=-14;k<=14;k+=4)add(T.cyl6,x+k,-0.6,z-2.2,0.25,1.6,0.25,0,"#5c4632",0);
        add(T.box,x-10,0,z+0.5,1.2,12,1.2,0,"#e2c230",0.1);add(T.box,x-10,11,z-4,1,1,12,0,"#e2c230",0.05);
        for(let i=0;i<6;i++)for(let l=0;l<2;l++)add(T.box,x+2+i*2.2,0.65+l*1.0,z+0.6,1.9,0.95,1.6,0,pick(["#b07a43","#a7784a","#8f6a45"]),0.15);
        add(T.box,x+2,0.1,z-8,30,1.4,8,0,"#5b4a3a",0.3);for(let i=0;i<9;i++)add(T.box,x-8+i*2.6,1.5,z-8,2.2,0.95,6,0,pick(["#b07a43","#a7784a","#8f6a45"]),0.15);
        claim(x,z,1,1,0);hMark(x,z-4,16,12);note("bargeDock",x,z,6);},
      // a moored barge and its towboat
      barge(x,z,len){add(T.box,x,-0.2,z,len,1.8,9,0,"#7a4a32",0.3);add(T.box,x,1.6,z,len-4,0.3,7.4,0,"#5b4a3a",0.1);for(let i=0;i<Math.floor((len-6)/5);i++)add(T.box,x-len/2+5+i*5,1.9,z,4,1.2,6,0,pick(["#b07a43","#a7784a"]),0.15);
        add(T.box,x+len/2+6,-0.2,z,10,2,7,0,"#e9e4da",0.2);add(T.box,x+len/2+7,1.8,z,5,3,5,0,"#e9e4da",0.15);add(T.box,x+len/2+7,4.8,z,5.4,0.3,5.4,0,"#d6382c",0);hMark(x,z,len/2+12,6);note("barge",x,z,6);},
      shack(x,z){pad(x,z,6);[[-2,-2],[2,-2],[-2,2],[2,2]].forEach(([a,b])=>add(T.cyl6,x+a,0,z+b,0.2,1.8,0.2,0,"#5c4632",0));add(T.box,x,1.8,z,5,2.6,5,RNG()*0.3,"#7d6a52",0.15);add(T.gable,x,4.4,z,5.6,1.6,5.6,0,"#4f5560",0);
        const [zc]=RZ(x),dir=Math.sign(zc-z);add(T.box,x,1.6,z+dir*6,1.4,0.15,8,0,"#7b5d42",0);add(T.box,x+2.5,0.1,z+dir*10,1.4,0.5,4,0.2,"#5b8de4",0.2);claim(x,z,5,7,0);if(!UTIL.shack)note("shack",x,z,7);},
      // a boardwalk along a polyline to a lookout at its end
      boardwalk(pts){const P=smooth(pts,4);for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],ry=Math.atan2(-(b[1]-a[1]),b[0]-a[0]),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;add(T.box,mx,0.8,mz,Math.hypot(b[0]-a[0],b[1]-a[1])+0.3,0.14,1.8,ry,"#8a6a4a",0.1);
          if(i%2)[-0.8,0.8].forEach(s2=>add(T.cyl6,mx+Math.sin(ry)*s2,0,mz+Math.cos(ry)*s2,0.1,0.8,0.1,0,"#5c4632",0));kMark(mx-1.5,mx+1.5,mz-1.5,mz+1.5,3);}
        const e=P[P.length-1];add(T.box,e[0],0.8,e[1],6,0.14,6,0,"#8a6a4a",0.1);[[-2.5,-2.5],[2.5,-2.5],[-2.5,2.5],[2.5,2.5]].forEach(([a,b])=>add(T.cyl6,e[0]+a,0,e[1]+b,0.15,3.6,0.15,0,"#5c4632",0));add(T.gable,e[0],3.6,e[1],6.6,1.4,6.6,0,"#4f5560",0);
        claim(e[0],e[1],4,5,0);note("boardwalk",e[0],e[1],5);},
      // a mesa: lumpy oval lobes in three sandstone bands, a talus apron round the foot
      // a mesa (v14): a chain of lobes along its long axis that shrinks toward one end, so no two outlines match; spurs
      // running out low from the body, broken ledges jutting from the cliff, talus cones and boulders on the slopes
      mesa(x,z,w,d,h,ry){pad(x,z,Math.max(w,d)*0.6);const c=Math.cos(ry),s=Math.sin(ry),n=4+Math.floor(RNG()*3),dir=RNG()<0.5?1:-1,at=(u,v)=>[x+u*c-v*s,z+u*s+v*c];
        for(let k=0;k<n;k++){const t=n>1?k/(n-1)-0.5:0,f=1-0.5*(t*dir+0.5),[lx,lz]=at(t*w*0.66+rr(-4,4),rr(-0.18,0.18)*d),a=w*0.3*f*rr(0.85,1.15),b=d*0.42*f*rr(0.7,1.1),lh=h*(0.7+0.35*f)*rr(0.92,1.05),r=ry+rr(-0.35,0.35);
          add(T.cyl10,lx,0,lz,a*1.22,lh*0.22,b*1.22,r,"#d49a6a",0.15);add(T.cyl10,lx,lh*0.18,lz,a,lh*0.5,b,r,"#c46f45",0.3);add(T.cyl10,lx,lh*0.66,lz,a*rr(0.98,1.06),lh*0.1,b*rr(0.98,1.06),r,"#dda274",0.05);
          add(T.cyl10,lx,lh*0.76,lz,a*rr(0.88,0.96),lh*0.24,b*rr(0.88,0.96),r+rr(-0.2,0.2),"#b45f3a",0.12);}
        for(let k=0,m=1+Math.floor(RNG()*3);k<m;k++){const a2=rr(0,6.28),L=Math.max(w,d)*rr(0.5,0.7),sx2=x+Math.cos(a2)*L*0.75,sz2=z+Math.sin(a2)*L*0.75,sh=h*rr(0.25,0.5);
          add(T.cyl10,sx2,0,sz2,L*0.32,sh,L*0.12,-a2,"#c46f45",0.3);add(T.cyl10,sx2,sh,sz2,L*0.28,sh*0.18,L*0.1,-a2,"#b45f3a",0.1);add(T.cone6,sx2+Math.cos(a2)*L*0.3,0,sz2+Math.sin(a2)*L*0.3,rr(5,9),rr(3,6),rr(5,9),RNG()*6,"#d49a6a",0.25);}
        for(let k=0;k<8;k++){const a2=rr(0,6.28),[lx,lz]=at(Math.cos(a2)*w*0.36,Math.sin(a2)*d*0.42);add(T.box,lx,h*rr(0.3,0.62),lz,rr(4,10),rr(0.8,1.6),rr(3,6),-a2,pick(["#d08a5a","#c97c4f","#b86a42"]),0.15);}
        for(let k=0;k<11;k++){const a2=rr(0,6.28),tx=x+Math.cos(a2)*w*rr(0.42,0.55),tz=z+Math.sin(a2)*d*rr(0.42,0.55);add(T.cone6,tx,0,tz,rr(5,12),rr(2.5,7),rr(5,12),RNG()*6,pick(["#d49a6a","#c98b5a","#dba57a"]),0.25);}
        for(let k=0;k<26;k++){const a2=rr(0,6.28),tx=x+Math.cos(a2)*w*rr(0.5,0.7),tz=z+Math.sin(a2)*d*rr(0.5,0.7);add(T.ico,tx,0,tz,rr(0.8,2.6),rr(0.6,1.8),rr(0.8,2.4),RNG()*6,pick(["#b9774a","#a56a42","#c98b5a"]),0.25);}
        for(let k=0;k<9;k++){const [lx,lz]=at(rr(-0.3,0.3)*w,rr(-0.25,0.25)*d);add(T.cyl10,lx,h*rr(0.88,1.0),lz,w*rr(0.05,0.12),rr(0.8,2.5),d*rr(0.05,0.12),RNG()*6,pick(["#a85a36","#c97c4f","#9a5232","#d38c5c"]),0.2);}
        kMark(x-w*0.6,x+w*0.6,z-d*0.6,z+d*0.6,3);hMark(x,z,Math.max(w,d)*0.55,h);},
      // a stock pond (v14, high desert): an earthen tank behind a berm, the windmill that fills it, a trough and some cattle
      stockPond(x,z){pad(x,z,22);add(T.mound,x,-0.4,z,17,2.2,14,0,"#b89a6e",0.2);const pts=[];for(let k=0;k<11;k++){const a=k/11*6.283,rk=rr(8.5,11);pts.push([x+Math.cos(a)*rk,z+Math.sin(a)*rk*0.8]);}
        poly(pts,2.26,"#7d8f86");poly(pts.map(([px,pz])=>[x+(px-x)*1.12,z+(pz-z)*1.12]),2.22,"#8a7458");kMark(x-18,x+18,z-15,z+15,3);
        LM.windpump(x+20,z-6);add(T.box,x+16,0,z+4,4,0.7,1,0,"#8d939c",0.1);
        for(let k=0;k<5;k++){const cx=x+rr(-26,26),cz=z+rr(14,24),ry=rr(0,6.28),col=pick(["#5a3a2a","#7a4a32","#2f2a26","#a0714a"]);add(T.box,cx,0.7,cz,2.2,1.1,0.9,ry,col,0.2);add(T.box,cx+Math.cos(ry)*1.3,1.2,cz-Math.sin(ry)*1.3,0.7,0.6,0.5,ry,col,0.2);
          [[-0.8,-0.3],[0.8,-0.3],[-0.8,0.3],[0.8,0.3]].forEach(([a,b])=>add(T.box,cx+Math.cos(ry)*a+Math.sin(ry)*b,0,cz-Math.sin(ry)*a+Math.cos(ry)*b,0.18,0.7,0.18,ry,col,0));}
        note("stockPond",x,z,4);}};
    /* ---------- 4. environment kits (v13: each follows its site map) ---------- */
    // scatter helper: n tries over a box, kept where the mask passes; fn(x,z) places one thing
    function scatter(n,x0,x1,z0,z1,mask,fn){let k=0;n=Math.round(n*DEN);for(let t=0;t<n;t++){const x=rr(x0,x1),z=rr(z0,z1);if(mask&&!mask(x,z))continue;if(fn(x,z))k++;}return k;}
    const inMap=(x,z)=>x>-415&&x<415&&z>-315&&z<315&&!inside(x,z,-4);
    // open ground: circles [x,z,r] and boxes [x0,x1,z0,z1] where the fill leaves no trees
    // (v14: ragged edges: each clearing's outline wanders with the noise, so no clearing is a clean circle or box)
    const OPEN=[],openAt=(x,z)=>{const e=(noise(x*2.3,z*2.3,26)-0.5);for(const o of OPEN){if(o.length===3?Math.hypot(x-o[0],z-o[1])<o[2]*(1+e*0.5):x>o[0]-e*14&&x<o[1]+e*14&&z>o[2]-e*14&&z<o[3]+e*14)return true;}return false;};
    if(ENVK==="rural"){
      // Forest valley: a wide river winding through wooded hills. South of the fence a concrete service court joins the
      // mill to two yards: the neighbouring Valley Timber Co. (log decks, chip pile, its own fence) and the mill's covered
      // cardboard (OCC) bale store with a truck unloading; the farm, fields and orchard beyond, the lake to the south-east,
      // the substation and the deep woods west of the highway with a radio mast in a clearing
      // the service court: concrete between the fence and the yards, an asphalt lane out to the east road
      add(T.quad,30,0.03,69,150,1,10,0,"#c9c6bd",0);kMark(-45,105,64,74,1);road([[104,77],[EX,77]],6,false,"near");
      // Valley Timber Co. (the neighbour): gravel, log decks, a chip pile, the loader shed, a fence round it and its sign
      {const x0=-84,x1=8,z0=75,z1=142,cx=(x0+x1)/2,cz=(z0+z1)/2;pad(cx,cz,52);add(T.quad,cx,0.022,cz,x1-x0,1,z1-z0,0,"#a99c80",0);kMark(x0,x1,z0,z1,3);
        for(let d=0;d<6;d++){const dx=x0+9+d*8.4,len=rr(18,30),dz=z0+14+rr(0,8);for(let l=0;l<3;l++)for(let k=0;k<6-l;k++)add(T.cyl6,dx-2.4+k*0.95+l*0.47,0.42+l*0.78,dz,0.44,len,0.44,0,pick(["#8a6a4a","#7a5a3c","#9a7350","#a8845e"]),0.1,undefined,Math.PI/2,0);}
        add(T.cone6,x0+22,0,z1-14,13,8,11,RNG()*6,"#d9c39a",0.3);add(T.cone6,x0+36,0,z1-10,7,4.5,6,RNG()*6,"#c9ab78",0.3);add(T.box,x0+14,4,z1-20,1.6,0.7,16,0.7,"#8d939c",0.1,undefined,0.42,0);
        add(T.box,x1-12,0,z1-10,14,6,10,0,"#8a8f98",0.2);add(T.gable,x1-12,6,z1-10,14.4,2.2,10.6,0,"#5b6270",0);
        [[x0,z0,x1,z0],[x0,z1,x1,z1],[x0,z0,x0,z1],[x1,z0,x1,z1]].forEach(([a,b,c,e])=>{const L=Math.hypot(c-a,e-b);add(T.box,(a+c)/2,0,(b+e)/2,a===c?0.08:L,1.8,a===c?L:0.08,0,"#8d939c",0.3);});
        sign(x0+30,z0-1.5,0,"VALLEY TIMBER CO.","#2f5d3a","#f2efe6");hMark(cx,cz,46,8);note("timber",cx,cz,8);note("chipPile",x0+22,z1-14,8);}
      // the mill's covered OCC store: a long open-sided shed over bale stacks, more stacks outside, a truck unloading
      {const x0=20,x1=104,z0=75,z1=142,cx=(x0+x1)/2;pad(cx,(z0+z1)/2,48);add(T.quad,cx,0.022,(z0+z1)/2,x1-x0,1,z1-z0,0,"#c9c6bd",0);kMark(x0,x1,z0,z1,3);
        const sx=cx-6,sz=z0+24,SW=58,SD=26;for(let x=sx-SW/2;x<=sx+SW/2+0.1;x+=SW/6)[sz-SD/2,sz+SD/2].forEach(z=>add(T.box,x,0,z,0.4,7,0.4,0,"#8d939c",0.1));
        add(T.box,sx,7,sz,SW+2,0.4,SD+2,0,"#8a929c",0.1);add(T.gable,sx,7.4,sz,SW+2.4,2,SD+2.6,0,"#9ba2a9",0.05);   // (v20: galvanised, not the trim colour)
        for(let i=0;i<9;i++)for(let j=0;j<4;j++){const n=2+Math.floor(RNG()*3);for(let l=0;l<n;l++)add(T.box,sx-SW/2+4+i*6.2,l*1.15,sz-SD/2+4+j*5.6,1.6,1.1,1.25,0,pick(["#a7784a","#b07a43","#8f6a45","#9c7b55"]),0.15);}
        for(let i=0;i<6;i++)for(let j=0;j<2;j++)for(let l=0;l<2;l++)add(T.box,x0+10+i*7,l*1.15,z1-14+j*5,1.6,1.1,1.25,0,pick(["#a7784a","#b07a43","#8f6a45"]),0.15);
        // the truck: tractor, flatbed with bales, a forklift taking them off
        const tx=x1-12,tz=sz+4;add(T.box,tx,0.5,tz-9,2.6,2.6,4,0,"#d6382c",0.15);add(T.box,tx,1.0,tz+2,2.6,0.4,14,0,"#5b6270",0.1);for(let k=0;k<5;k++)add(T.box,tx,1.4,tz-3+k*2.4,1.6,1.1,1.25,0,"#a7784a",0.15);
        [[-1.4,-9],[1.4,-9],[-1.4,4],[1.4,4],[-1.4,7],[1.4,7]].forEach(([a,b])=>add(T.cyl10,tx+a,0.5,tz+b,0.5,0.4,0.5,0,"#2f3a49",0,undefined,0,Math.PI/2));
        add(T.box,tx-4.5,0.3,tz,1.4,1.6,2.2,0,"#e2c230",0.15);add(T.box,tx-3.4,0.4,tz,0.2,2.2,1.2,0,"#4a4f58",0);add(T.box,tx-3.0,0.9,tz,1.6,1.1,1.25,0,"#a7784a",0.15);
        sign(x0+16,z0-1.5,0,"OCC BALE STORE","#f2efe6","#2f3a49");hMark(cx,sz,40,10);note("occStore",sx,sz,10);}
      LM.feeder(LM.substation(-121,96,2));LM.pylons([-121,96],[-420,150]);LM.pylons([F.x1+40,-40],[F.x1+250,-300]);
      LM.farm(-30,214,0);LM.field(-92,190,52,40,"#a6c46a",false);LM.field(-92,250,52,46,"#d6c27a",true);LM.field(-28,268,44,34,"#8fb85c",false);
      LM.orchard(118,236,10,9);LM.lake(246,104,26);LM.mast(-262,128,48);
      track([[-30,196],[-30,160],[-30,146]]);track([[-118,214],[HXr+5,214]]);track([[104,108],[EX-4,108]]);track([[HXr-5,120],[-200,126],[-245,128]]);road([[-84,100],[HXr,100]],5,false);
      track([[EX+4,170],[205,190],[260,250],[300,315]]);track([[-30,232],[60,236],[95,232]]);track([[246,135],[200,160],[EX+4,165]]);
      track([[HXr-5,-180],[-110,-200],[-60,-214],[-10,-250],[20,-315]]);track([[EX+4,-210],[230,-190],[300,-215],[415,-230]]);
      OPEN.push([-90,110,64,146],[-130,40,150,300],[84,152,204,268],[246,104,44],[-262,128,24],[-50,-215,48],[300,-235,40],[235,262,38],[-335,-40,30],[-60,30,146,190],[-180,-60,28],[110,-200,26],[330,40,30]);
      // rapids: white water over boulders where the river narrows, each run different; gravel bars on the insides of bends
      [[-330,0.4],[-262,-0.6],[-205,0.3],[150,-0.5],[205,0.4],[330,-0.4],[395,0.6]].forEach(([x,o],ri)=>{const [zc,hw]=RZ(x),n=Math.round(rr(8,34)),sp=rr(10,30),foam=rr(0.3,0.75);
        for(let k=0;k<n;k++){const fx=x+rr(-sp,sp),fz=zc+rr(-hw*0.85,hw*0.85);if(RNG()>foam)add(T.ico,fx,-0.4,fz,rr(0.8,2.8),rr(0.5,1.5),rr(0.8,2.4),RNG()*6,pick(["#8f9496","#a3a7a8","#7d8385","#9b9488"]),0.3);
          else{const pts=[],m=5+Math.floor(RNG()*4),ex=rr(1.5,5),ez=rr(0.6,2.2);for(let q=0;q<m;q++){const a=q/m*6.283;pts.push([fx+Math.cos(a)*ex*rr(0.6,1.2),fz+Math.sin(a)*ez*rr(0.6,1.2)]);}poly(pts,0.05,pick(["#e6eef0","#d8e4e8","#f2f6f7"]));}}
        if(ri%2===0||RNG()<0.5){const L=rr(25,60),W=rr(5,12);strip([-L,-L/2,0,L/2,L].map(dx=>{const [z2,h2]=RZ(x+dx);return [x+dx,z2+Math.sign(o)*(h2+W*0.4-Math.abs(dx)/L*W*0.6)];}),w=>W*(0.35+0.65*Math.sin(Math.PI*w)),0.04,pick(["#cfc7b4","#c4bba6","#d6cfbd"]),2,0.6);}});
      // the banks: willows, alder and reeds in patches along both sides, thinning and thickening with the noise
      for(let x=-415;x<415;x+=3.5){const [zc,hw]=RZ(x);for(const s2 of [-1,1]){const n=noise(x*2,s2*90,30);if(n<0.42)continue;const z=zc+s2*(hw+rr(3.5,8));
        if(RNG()<0.45)broadleaf(x+rr(-1.5,1.5),z,rr(0.6,1.3),false,true);else if(RNG()<0.6)bush(x,z,rr(0.6,1.2),pick(["#7aa064","#8fbf6a","#6f9a5c"]));
        else if(place(x,z-s2*2,0.5,true)){for(let q=0;q<3;q++)add(T.cone4,x+rr(-0.5,0.5),0,z-s2*2+rr(-0.4,0.4),0.12,rr(1.2,2),0.12,RNG(),"#7f8f4f",0.2);claim(x,z-s2*2,0.5,2,0);}}}
      // the deep wood: old, tall forest west of the highway round the mast's clearing (filled first, so it is dense)
      {const wx=-228,wz=118,ax=150,az=115,inW=(x,z)=>{const u=(x-wx)/ax,v=(z-wz)/az;return u*u+v*v<1-0.25*noise(x,z,30);};
        const n=scatter(5200,wx-ax,wx+ax,wz-az,wz+az,(x,z)=>inMap(x,z)&&x<HXr-8&&inW(x,z)&&!openAt(x,z),(x,z)=>RNG()<0.68?conifer(x,z,rr(1.6,2.9),true):broadleaf(x,z,rr(1.4,2.6),true,true));
        if(n>40)note("deepwood",wx,wz,22);}
      // forest edges: a ragged fringe of young trees and shrubs round every clearing, so the edge steps down into the open
      OPEN.forEach(o=>{const ring=o.length===3?[...Array(Math.round(o[2]*1.4))].map((_,k,A)=>{const a=k/A.length*6.283+rr(-0.1,0.1);return [o[0]+Math.cos(a)*o[2],o[1]+Math.sin(a)*o[2]];}):
          [...Array(Math.round((o[1]-o[0]+o[3]-o[2])/3))].map(()=>{const t=RNG()*4,u=t%1;return t<1?[o[0]+u*(o[1]-o[0]),o[2]]:t<2?[o[1],o[2]+u*(o[3]-o[2])]:t<3?[o[0]+u*(o[1]-o[0]),o[3]]:[o[0],o[2]+u*(o[3]-o[2])];});
        ring.forEach(([x,z])=>{const d=rr(-4,9),a=RNG()*6.283,px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;if(!inMap(px,pz)||dFence(px,pz)<16||!place(px,pz,0.8))return;const r=RNG();
          if(r<0.35)bush(px,pz,rr(0.7,1.4),pick(["#7aa064","#6f9a5c","#8ab879"]));else if(r<0.75)broadleaf(px,pz,rr(0.7,1.3),false,true);else conifer(px,pz,rr(0.7,1.2),true);});});
      // the forest everywhere else: dense, mixed, sizes from saplings to tall crowns; conifers on the far hills
      scatter(16000,-415,415,-315,315,(x,z)=>inMap(x,z)&&dFence(x,z)>20&&!openAt(x,z)&&noise(x,z,70)>0.24,(x,z)=>{const d=Math.hypot(x,z),g=1+0.35*sstep(110,260,d),big=RNG()<0.2?1.3:1;
        return RNG()<(d>170?0.55:0.35)?conifer(x,z,rr(0.95,1.9)*g*big,true):broadleaf(x,z,rr(0.9,1.9)*g*big,d>200,true);});
      // rocky outcrops: grey slabs on the eastern ridge and in the south-west
      [[372,-40,60,110],[-372,262,50,60],[355,170,40,50]].forEach(([x,z,w,d])=>{for(let k=0;k<40;k++){const rx=x+rr(-w/2,w/2),rz=z+rr(-d/2,d/2);rock(rx,rz,rr(2,5),pick(["#9a9a92","#a8a79e","#8c8c84"]));}});
      scatter(260,F.x0,F.x1,F.z0,F.z1,null,(x,z)=>broadleaf(x,z,rr(0.75,1.3),false));
      scatter(90,-410,410,-310,310,inMap,(x,z)=>bush(x,z,rr(0.8,1.4)));
      for(let k=0;k<7;k++){const a=rr(0,6.28),d=rr(360,420),x=Math.cos(a)*d,z=Math.sin(a)*d*0.8;if(!place(x,z,12))continue;add(T.mound,x,-3,z,rr(60,100),rr(9,18),rr(45,75),RNG()*6,pick(["#6f9a5c","#5f8a50","#7aa064"]),0.25);}}
    if(ENVK==="urban"){
      // City by the sea (v13 pass 2): the sea runs from the mill's back wall to the horizon. A seafront boulevard either side
      // of the mill; the beach with its boardwalk, pier and lifeguard towers to the west; the container port with gantry
      // cranes and a moored ship to the east, its breakwater and lighthouse out in the bay; ships at anchor offshore.
      // Inland a street grid on 45 m blocks (the highway and the east avenue are on it) with houses, apartments, shops
      // and parks; the rail yard west, and the water tower, recycling yard, substation and radio mast south of the mill.
      const GP=45,xs=[];for(let x=HXr-GP*6;x<=430;x+=GP)xs.push(x);
      const [rzc,rhw]=RZ(0),shore=rzc+rhw,sBank=shore+2.4,BLV=-51.5;   // the sea wall at -57.6, the boulevard just inland
      const zsS=[-8,37,82];while(zsS[zsS.length-1]+GP<330)zsS.push(zsS[zsS.length-1]+GP);
      const MILLX=[HXr,EX],RAILZ=[-50,-8];
      const streetRaw=(cx,cz,len,along,w=6)=>{add(T.quad,cx,0.025,cz,along?len:w,1,along?w:len,0,ROADC,0);
        [-1,1].forEach(s2=>add(T.quad,cx+(along?0:s2*(w/2+0.9)),0.028,cz+(along?s2*(w/2+0.9):0),along?len:1.8,1,along?1.8:len,0,"#c8c6bf",0));
        if(DEN>=1||Math.hypot(cx,cz)<200)for(let d=-len/2+3;d<len/2-3;d+=7)add(T.quad,cx+(along?d:0),0.03,cz+(along?0:d),along?3:0.2,1,along?0.2:3,0,"#f2f2f2",0);
        kMark(cx-(along?len/2:w/2+1.8),cx+(along?len/2:w/2+1.8),cz-(along?w/2+1.8:len/2),cz+(along?w/2+1.8:len/2),1);
        for(let d=-len/2+6;d<len/2-6;d+=11)if(RNG()<0.55){const s2=RNG()<0.5?-1:1,tx=cx+(along?d:s2*(w/2+2.4)),tz=cz+(along?s2*(w/2+2.4):d);if(kFree(tx,tz,0.9))broadleaf(tx,tz,rr(0.8,1.1),true,true);}};
      const palm=(x,z,s,wet)=>{if(!place(x,z,1.2*s,wet))return false;add(T.cyl6,x,0,z,0.25*s,7*s,0.25*s,0,"#8a6a4a",0.15,undefined,rr(-0.08,0.08),rr(-0.08,0.08));
        for(let f=0;f<7;f++)add(T.box,x+Math.cos(f*0.9)*1.7*s,7*s,z+Math.sin(f*0.9)*1.7*s,3.4*s,0.12,0.7*s,-f*0.9,"#5f8a4e",0.1,undefined,0,-0.5);claim(x,z,1.2*s,8*s,0.3);return true;};
      // the seafront boulevard, west and east of the mill, with palms along its inland side
      streetRaw((HXr-430)/2,BLV,430+HXr,true,7);streetRaw((EX+430)/2,BLV,430-EX,true,7);
      for(let x=EX+8;x<415;x+=12)palm(x+rr(-1,1),BLV+6,rr(0.85,1.1));
      // north-south streets south of the shore: from the boulevard east of the mill, off the rail yard west, from z 82 between
      xs.forEach(x=>{if(x===HXr||x===EX)return;const z0=x>HXr&&x<EX?82:x<HXr?-8:BLV;streetRaw(x,(z0+330)/2,330-z0,false);});
      zsS.forEach(z=>{if(z<82){streetRaw((HXr-430)/2,z,430+HXr,true);streetRaw((EX+430)/2,z,430-EX,true);}else streetRaw(0,z,860,true,z===82?9:6);});
      /* --- the beach (west): sand below the sea wall, a boardwalk, the pier, lifeguard towers, umbrellas, palms --- */
      {const X0=-418,X1=HXr-14,Z0=shore-1,Z1=shore-34,cx=(X0+X1)/2;
        // sand and the shallows with a wavy waterline, a thin surf line along it
        const edge=(x,o)=>Z1+o+4*Math.sin(x/23)+5*(noise(x,Z1,40)-0.5),band=(o0,o1,y,hex)=>{const pts=[];for(let x=X0;x<=X1;x+=8)pts.push([x,edge(x,o1)]);for(let x=X1;x>=X0;x-=8)pts.push([x,o0===null?Z0:edge(x,o0)]);poly(pts,y,hex);};
        band(-2,-26,0.02,"#6aa6bb");band(null,0,0.03,"#e8d9b0");band(1.2,0,0.034,"#f2f6f4");
        add(T.box,cx,0,shore-3.2,X1-X0,0.5,4,0,"#a07a52",0.1);                                                  // boardwalk along the foot of the wall
        for(let x=X0+20;x<X1-10;x+=26)palm(x+rr(-3,3),shore-7+rr(-1,1),rr(0.9,1.2),true);
        // the pier: deck on piles out into the bay, a pavilion and lamps at its end
        const PX=-292,PL=125;add(T.box,PX,2.0,shore-PL/2,6,0.5,PL,0,"#a07a52",0.1);[-1,1].forEach(s2=>add(T.box,PX+s2*2.9,2.5,shore-PL/2,0.2,0.9,PL,0,"#e9e4da",0));
        for(let z=shore-4;z>shore-PL;z-=7)[-1,1].forEach(s2=>add(T.cyl6,PX+s2*2.4,-1,z,0.3,3.1,0.3,0,"#6b5440",0));for(let z=shore-10;z>shore-PL;z-=18)add(T.box,PX+2.6,2.5,z,0.15,4,0.15,0,"#4a4f58",0);
        add(T.box,PX,2.5,shore-PL-5,16,4.5,11,0,"#f1ede4",0.15);add(T.gable,PX,7,shore-PL-5,16.6,2.6,11.6,0,"#2f7fb8",0);add(T.box,PX,2.0,shore-PL-5,20,0.5,15,0,"#a07a52",0.1);
        hMark(PX,shore-PL/2,PL/2,8);note("pier",PX,shore-PL-5,9);
        // lifeguard towers, umbrellas and towels on the sand
        [-382,-226].forEach(x=>{[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>add(T.cyl6,x+a,0,shore-20+b,0.12,2.6,0.12,0,"#e9e4da",0));add(T.box,x,2.6,shore-20,3,2.2,3,0,"#d6382c",0.1);add(T.gable,x,4.8,shore-20,3.4,1,3.4,0,"#f2f2f2",0);add(T.box,x,2.4,shore-22.5,1,0.15,3,0,"#e9e4da",0,undefined,0.6);note("lifeguard",x,shore-20,6);});
        for(let k=0;k<Math.round(60*DEN);k++){const x=rr(X0+6,X1-6),z=rr(Z1+4,shore-11);if(Math.abs(x-PX)<6)continue;const c=pick(["#d6382c","#f2c230","#2a5aa8","#1f9254","#f27a30","#ffffff"]);
          add(T.cyl6,x,0,z,0.06,2.2,0.06,0,"#e9e4da",0);add(T.cone6,x,1.9,z,1.6,0.6,1.6,RNG(),c,0.1);if(RNG()<0.7)add(T.quad,x+rr(-2,2),0.04,z+rr(1.5,2.5),1,1,2,RNG(),pick(["#f2f2f2","#e46b5b","#5b8de4","#f2c230"]),0);}
        // sailboats off the beach
        for(let k=0;k<7;k++){const x=rr(-410,-180),z=rr(shore-80,shore-220),ry=rr(0,6.28);add(T.box,x,-0.2,z,5,0.9,1.8,ry,"#f2f2f2",0.2);add(T.cone4,x,0.7,z,0.12,7,1.6,ry+Math.PI/4,"#f7f7f2",0.05);}
        kMark(X0,X1,Z1-22,shore,3);}
      /* --- the port (east): a container terminal on reclaimed land, gantry cranes on the quay, a ship alongside --- */
      {const X0=EX+22,X1=420,ZQ=shore-92,cx=(X0+X1)/2,cz=(shore+ZQ)/2;
        add(T.box,cx,-1,cz,X1-X0,2.2,shore-ZQ,0,"#b8b6ae",0.25);add(T.box,cx,1.2,ZQ+0.6,X1-X0,0.4,1.2,0,"#e2c230",0);                 // the deck and the quay edge
        for(let x=X0+6;x<X1;x+=12)add(T.cyl6,x,1.2,ZQ+1.2,0.35,0.6,0.35,0,"#2f3a49",0);
        [-1,0.4].forEach(o=>add(T.box,cx,1.22,ZQ+12+o*4,X1-X0-6,0.1,0.25,0,"#8d939c",0));                                                   // crane rails
        // container stacks in blocks
        for(let bx=X0+14;bx<X1-30;bx+=34)for(let bz=shore-14;bz>ZQ+28;bz-=17)for(let r=0;r<2;r++)for(let c=0;c<6;c++){const n=1+Math.floor(RNG()*4);for(let l=0;l<n;l++)add(T.box,bx+c*3.0,1.2+l*2.6,bz-r*6.4,2.5,2.55,6.1,0,pick(["#d6382c","#2a5aa8","#1f9254","#e2c230","#e9ecef","#8a4a2c","#5b6270","#f27a30"]),0.15);}
        // gantry cranes: legs on the rails, a girder reaching out over the ship, the machinery house on top
        [X0+40,X0+100,X0+160].forEach(x=>{const cz2=ZQ+12,col=pick(["#c92a2a","#2a5aa8"]);[[-8,-6],[8,-6],[-8,6],[8,6]].forEach(([a,b])=>add(T.box,x+a,1.2,cz2+b,1.2,30,1.2,0,col,0.15));
          [-8,8].forEach(a=>add(T.box,x+a,30,cz2,1.4,1.6,14,0,col,0.1));add(T.box,x,31.6,cz2-14,3,2.2,62,0,col,0.1);add(T.box,x,33.8,cz2,7,4,8,0,"#f2f2f2",0.1);add(T.box,x,26,cz2-30,1.2,5,1.2,0,"#2f3a49",0);});
        add(T.box,X1-26,1.2,shore-30,22,10,30,0,"#c9c4ba",0.2);add(T.gable,X1-26,11.2,shore-30,22.4,2.4,30.6,Math.PI/2,"#6f7a88",0);add(T.box,X0+6,1.2,shore-8,8,7,8,0,"#e9e4da",0.15);
        kMark(X0-4,X1,ZQ,shore,3);hMark(cx,cz,(X1-X0)/2,34);note("port",X0+100,ZQ+12,34);
        // the ship alongside: hull with a red waterline, container bays, the bridge and funnel aft
        const SX=X0+100,SZ=ZQ-15,SL=176;add(T.box,SX,-2,SZ,SL,2.6,26,0,"#a8322c",0.1);add(T.box,SX,0.6,SZ,SL,7,26,0,"#1f2d44",0.15);add(T.box,SX-SL/2-4,0.6,SZ,10,7,16,0,"#1f2d44",0.15,undefined,0,0);
        for(let b=0;b<11;b++)for(let r=0;r<7;r++){const n=1+Math.floor(RNG()*3);for(let l=0;l<n;l++)add(T.box,SX-SL/2+12+b*12.4,7.6+l*2.6,SZ-10.5+r*3.5,12,2.55,3.2,0,pick(["#d6382c","#2a5aa8","#1f9254","#e2c230","#e9ecef","#8a4a2c","#f27a30"]),0.15);}
        add(T.box,SX+SL/2-14,7.6,SZ,12,14,22,0,"#f2f2f2",0.15);add(T.box,SX+SL/2-14,21.6,SZ,13,1.6,26,0,"#f2f2f2",0.05);add(T.cyl10,SX+SL/2-6,7.6,SZ,2,18,2,0,"#2f3a49",0.1);
        hMark(SX,SZ,SL/2,28);note("ship",SX,SZ,24);
        // two tugs
        [[SX-SL/2-24,SZ+8],[SX-30,SZ-26]].forEach(([x,z])=>{add(T.box,x,-0.4,z,14,2.4,5.5,0.3,"#c92a2a",0.15);add(T.box,x+1,2,z,5,3,4,0.3,"#f2f2f2",0.1);add(T.cyl6,x+3,2,z,0.5,4,0.5,0,"#2f3a49",0);});
        /* --- the breakwater from the port's corner out into the bay, with the lighthouse at its head --- */
        const BW=[[X0+4,ZQ-6],[X0-20,ZQ-40],[X0-62,ZQ-72],[X0-110,ZQ-88]];strip(BW,10,1.0,"#8f8f88",3,0.2);
        smooth(BW,5).forEach(([x,z],i)=>{for(const s2 of [-1,1])add(T.ico,x+rr(-2,2),-0.6,z+s2*rr(4,6),rr(1.6,2.8),rr(1,1.8),rr(1.6,2.6),RNG()*6,pick(["#8c8c84","#9a9a92","#7d7d76"]),0.3);if(i%3===0)add(T.box,x,1.0,z,4,0.5,4,RNG(),"#9a9a92",0.1);});
        const [lx,lz]=BW[BW.length-1];add(T.cyl10,lx,0,lz,6,2.2,6,0,"#9a9a92",0.2);
        for(let k=0;k<6;k++){const r=2.6-k*0.22;add(T.cyl10,lx,2.2+k*3.4,lz,r,3.4,r,0,k%2?"#f2f2f2":"#c92a2a",0.08);}
        add(T.cyl10,lx,22.6,lz,2.6,0.5,2.6,0,"#2f3a49",0);add(T.cyl10,lx,23.1,lz,1.4,2.6,1.4,0,"#f6e7a1",0);add(T.dome,lx,25.7,lz,1.6,1.4,1.6,0,"#c92a2a",0.05);
        hMark(lx,lz,6,28);note("lighthouse",lx,lz,27);}
      /* --- v14: who goes where. The port is fenced off from the boulevard with one gated freight entrance (gatehouse, barrier,
         a hedge and trees between the fence and the pavement); the beach is public: stairs down from the promenade, a hedge
         between the promenade and the rail yard. --- */
      {const X0=EX+22,FZ=shore+1.2,GX=X0+40;for(const [a,b] of [[X0,GX-7],[GX+7,420]]){add(T.box,(a+b)/2,0,FZ,b-a,2.4,0.1,0,"#8d939c",0.3);for(let x=a;x<=b;x+=4)add(T.box,x,0,FZ,0.12,2.6,0.12,0,"#6b7079",0);
          add(T.box,(a+b)/2,0,FZ+2.2,b-a,1.1,1.4,0,"#4f7a45",0.25);for(let x=a+5;x<b-3;x+=10)broadleaf(x,FZ+3.2,rr(0.6,0.85),false,true);}
        add(T.box,GX-9,0,FZ+3,3,2.8,3,0,"#e9e4da",0.15);add(T.box,GX-9,2.8,FZ+3,3.4,0.3,3.4,0,MILL.brand||"#c92a2a",0);add(T.box,GX,1,FZ+1,12,0.2,0.2,0,"#d6382c",0);
        add(T.quad,GX,0.03,(FZ+BLV)/2,12,1,Math.abs(BLV-FZ)+2,0,"#9a9ea6",0);sign(GX+12,FZ+3.5,0,"PORT · FREIGHT ONLY","#2f3a49","#f2efe6");note("portGate",GX,FZ,4);
        for(let x=-412;x<HXr-16;x+=46){add(T.box,x,0,shore-1.6,4,1.1,3,0,"#c8c6bf",0.1);add(T.box,x,0,shore-3.6,4,0.5,1.6,0,"#c8c6bf",0.1);}   // beach stairs
        add(T.box,(HXr-14-418)/2,0,BLV+4.4,HXr-14+418,1.2,1.4,0,"#4f7a45",0.25);sign(-300,BLV-4.6,0,"PUBLIC BEACH","#f2c230","#2f3a49");}
      // the mill's water: town water arrives by a main from the south (blue pipe on low saddles) into a fresh-water tank by
      // the fence; the treated effluent leaves by the outfall pipe, marked out to sea by a line of buoys to the diffuser
      {const px=-20;for(let z=82;z>F.z1+1;z-=1)if(z%6===0)add(T.box,px,0,z,0.8,0.5,0.4,0,"#8d939c",0);add(T.cyl10,px,0.9,F.z1+1.5,0.35,82-F.z1-1.5,0.35,0,"#3b7dd8",0.1,"near",Math.PI/2,0);
        add(T.cyl10,px-14,0,74,4.2,7,4.2,0,"#3b7dd8",0.15);add(T.dome,px-14,7,74,4.2,1,4.2,0,"#e9ecef",0);add(T.box,px-6,0,74,3,2.4,2.4,0,"#e9e4da",0.15);
        add(T.cyl10,px-6,0.9,74,0.3,8,0.3,0,"#3b7dd8",0.1,"near",0,Math.PI/2);sign(px-14,79.5,0,"TOWN WATER","#3b7dd8","#ffffff");claim(px-14,74,5,8,0);note("townWater",px-14,74,8);
        const of=ENV.outfall||[32,0.2,-61];for(let k=1;k<=6;k++){const bz=of[2]-k*14;add(T.cyl10,of[0],-0.2,bz,0.6,1.1,0.6,0,k===6?"#e2c230":"#f27a30",0.1);}
        add(T.box,of[0],0,of[2]-90,3,0.6,3,0,"#e2c230",0.1);note("outfall",of[0],of[2]-60,2);}
      // ships at anchor offshore
      [[-90,shore-300,150,0.15],[260,shore-380,190,-0.1],[-330,shore-430,120,0.3]].forEach(([x,z,L2,ry])=>{add(T.box,x,-1.6,z,L2,2.2,L2*0.14,ry,"#a8322c",0.1);add(T.box,x,0.6,z,L2,5.5,L2*0.14,ry,pick(["#1f2d44","#2f3a49","#4a2f2f"]),0.15);
        add(T.box,x+Math.cos(ry)*L2*0.38,6.1,z-Math.sin(ry)*L2*0.38,L2*0.07,10,L2*0.13,ry,"#f2f2f2",0.15);for(let b=0;b<6;b++)add(T.box,x+Math.cos(ry)*(-L2*0.38+b*L2*0.11),6.1,z-Math.sin(ry)*(-L2*0.38+b*L2*0.11),L2*0.09,2.6*(1+Math.floor(RNG()*2)),L2*0.12,ry,pick(["#d6382c","#2a5aa8","#1f9254","#e2c230","#e9ecef"]),0.15);});
      // landmark blocks
      LM.railyard(-415,HXr-10);LM.waterTower(-1,104);LM.recycler(-91,104);LM.feeder(LM.substation(89,104,3));LM.mast(44,150,46);
      // a trailer lot between the highway and the gate
      {add(T.quad,-130,0.022,46,40,1,44,0,"#9a9ea6",0);for(let i=0;i<5;i++)for(let j=0;j<2;j++)add(T.box,-142+i*6,0,36+j*20,2.6,3.4,13,0,pick(["#e9ecef","#d6382c","#2a5aa8","#e9ecef"]),0.15);kMark(-150,-110,24,68,3);hMark(-130,46,22,4);}
      // the blocks: houses round the edge with gardens, small apartment blocks, corner shops, a park here and there
      const zsAll=[BLV,...zsS,330];
      for(let i=0;i<xs.length-1;i++)for(let j=0;j<zsAll.length-1;j++){const xa=xs[i]+5,xb=xs[i+1]-5,za=zsAll[j]+5,zb=zsAll[j+1]-5;if(xb-xa<20||zb-za<20)continue;
        const cx=(xa+xb)/2,cz=(za+zb)/2;if(cx>MILLX[0]&&cx<MILLX[1]&&cz>sBank&&cz<82)continue;if(cx<HXr&&cz>RAILZ[0]&&cz<RAILZ[1])continue;
        if(!kFree(cx,cz,6))continue;const d=Math.hypot(cx,cz),r=RNG();
        // v14: the blocks nearest the mill are industrial: warehouses with truck yards, service depots, scrap and bale yards
        if(Math.hypot(cx+5,(cz-15)*1.3)<185){const W=xb-xa,D=zb-za,k=RNG();add(T.quad,cx,0.022,cz,W,1,D,0,pick(["#a3a39b","#9a9ea6","#b0aca2"]),0);kMark(xa,xb,za,zb,3);
          if(k<0.55){const bw=W*rr(0.55,0.85),bd=D*rr(0.45,0.65),bh=rr(7,12),bz=cz-D/2+bd/2+1.5;add(T.box,cx,0,bz,bw,bh,bd,0,pick(["#b8bcc4","#c9c4ba","#a9b0ba","#d6cfc0"]),0.2);
            if(RNG()<0.5)add(T.gable,cx,bh,bz,bw+0.4,rr(1.4,2.4),bd+0.4,0,pick(["#6f7a88","#8a8f98","#5b6270"]),0.05);else add(T.box,cx,bh,bz,bw,0.5,bd,0,pick(["#8a8f98","#9aa0a8"]),0.05);
            for(let q=0;q<Math.floor(bw/6);q++)add(T.box,cx-bw/2+3+q*6,0,bz+bd/2+0.05,3.4,4,0.1,0,"#5b6270",0.1);
            for(let q=0;q<2+Math.floor(RNG()*3);q++){const tx=cx-bw/2+4+q*6,tz=bz+bd/2+8;add(T.box,tx,0,tz,2.5,3.4,10,0,pick(["#e9ecef","#d6382c","#2a5aa8"]),0.15);}claim(cx,cz,Math.min(W,D)/2,bh+2,0);}
          else if(k<0.8){for(let q=0;q<10;q++)add(T.box,cx+rr(-W/2+4,W/2-4),0,cz+rr(-D/2+4,D/2-4),rr(2.4,6),rr(1.2,2.8),rr(2.4,6),pick([0,Math.PI/2]),pick(["#a7784a","#8f6a45","#c9c4ba","#2a5aa8","#d6382c","#7a7a72"]),0.15);
            add(T.box,cx+W/2-8,0,cz-D/2+6,10,5,7,0,"#c9c4ba",0.2);[[0,-D/2],[0,D/2]].forEach(([a,b])=>add(T.box,cx+a,0,cz+b,W,2,0.1,0,"#8d939c",0.3));claim(cx,cz,Math.min(W,D)/2,5,0);}
          else{add(T.box,cx-W/4,0,cz,W/2-2,rr(4,6),D-8,0,"#a5543f",0.2);add(T.box,cx-W/4,5,cz,W/2-2,0.4,D-8,0,"#6d6a63",0.05);for(let q=0;q<5;q++)add(T.box,cx+W/4+rr(-6,6),0,cz+rr(-D/3,D/3),2.2,2.2,4.5,RNG(),pick(["#f2f2f2","#e2c230","#5b6270"]),0.15);claim(cx,cz,Math.min(W,D)/2,7,0);}
          continue;}
        if(r<0.07){add(T.quad,cx,0.022,cz,xb-xa,1,zb-za,0,"#8fbf6a",0);for(let k=0;k<10;k++)broadleaf(cx+rr(-15,15),cz+rr(-15,15),rr(0.8,1.2),true,true);add(T.quad,cx,0.026,cz,xb-xa-4,1,1.6,0.6,"#d9cfb8",0);kMark(xa,xb,za,zb,3);continue;}
        // seafront blocks get apartments and hotels more often; a few towers far out
        if(r<0.27||(cz<0&&r<0.6)||(d>300&&r<0.45)||(d<260&&r<0.5)){
          const tall=(d>300||cz<0)&&RNG()<0.5,h=tall?rr(18,36):d<260?rr(10,22):rr(9,15),body=pick(["#a5543f","#b8654d","#c9c4ba","#b9bfc8","#d6cfc0","#7fa3c4","#e9e4da"]);
          if(tall){building(cx,cz,rr(18,26),rr(18,26),h,0,body,pick(["#8a8f98","#6d737c","#9aa0a8"]));claim(cx,cz,13,h+1,0);}
          else{[-1,1].forEach(s2=>{if(kFree(cx,cz+s2*8,4)){building(cx,cz+s2*8.5,xb-xa-6,11,h,0,body,pick(["#8a8f98","#9aa0a8","#7d7a72","#a5543f"]));claim(cx,cz+s2*8.5,6,h+1,0);}});}
          continue;}
        // houses facing the north and south streets, gardens behind with a tree or two
        const nH=RNG()<0.6?4:3;for(const s2 of [-1,1])for(let k=0;k<nH;k++){const hx=xa+(k+0.5)*(xb-xa)/nH+rr(-0.6,0.6),hz=cz+s2*((zb-za)/2-5.5);if(!kFree(hx,hz,3))continue;
          const shop=k===0&&RNG()<0.12;if(shop){building(hx,hz,9,8,rr(4,6),0,pick(["#b8bcc4","#c9c4ba"]),"#6d737c");add(T.box,hx,3,hz+s2*4.06,7,0.9,0.08,0,pick(["#2a5aa8","#d6382c","#1f9254","#f2c230"]),0);}
          else house(hx,hz,RNG()<0.8?0:Math.PI/2,nH>3?rr(6.2,7.4):rr(7.5,9.5),rr(6.5,8),rr(3.2,5),pick(["#e9e4da","#d8c8b0","#c9d2d6","#e2d2c2","#b9c4b0","#d9b8a0"]),pick(["#7a4a3a","#5a5f69","#6d5a4a","#8a8f98","#4a4f58"]));
          claim(hx,hz,nH>3?3.6:4.5,6,0);for(let q=0;q<2;q++)if(RNG()<0.8)broadleaf(hx+rr(-3.5,3.5),hz-s2*rr(6,10),rr(0.95,1.4),true,true);}}
      scatter(40,F.x0,F.x1,F.z0,F.z1,null,(x,z)=>broadleaf(x,z,rr(0.6,1),false));
      scatter(160,-410,410,-310,310,inMap,(x,z)=>broadleaf(x,z,rr(0.6,0.95),true,true));
      {const z=60,x=HXr+10;if(place(x,z,4)){add(T.box,x,0,z,0.4,7,0.4,0,"#6b7079",0);add(T.box,x,7,z,0.4,3.2,8,0,"#f2c230",0.1);claim(x,z,4,11,0);}}}
    if(ENVK==="desert"){
      // Desert flats: a concrete canal past the mill; red mesas on every side, dry washes and dirt tracks across the
      // flats; the solar farm, water tanks and a reservoir east, a windpump and the substation west, an oasis, a ranch
      LM.solarFarm(206,86,10,7);LM.waterTanks(64,117);LM.reservoir(104,120,18,24);LM.reservoir(112,4,14,34);LM.windpump(-207,109);LM.stockPond(98,196);LM.mast(240,156,44);LM.ranch(232,-14);
      const sub=LM.substation(-88,156,2);LM.feeder(sub);LM.pylons(sub,[-420,250]);LM.pylons([F.x1+30,60],G3.solarTx||[200,46]);
      [[-300,-205,130,82,38,0.3],[255,-245,112,72,32,-0.4],[368,12,92,74,30,0.9],[-362,122,96,86,34,0.2],[208,284,120,72,36,-0.2],[395,-150,46,40,22,0.5],[-402,-40,40,44,18,0],[-240,300,60,30,20,0.1]].forEach(m=>LM.mesa(...m));
      // a tank-car siding off the main line by the highway, a trailer lot by the gate
      {[-36.4,-35].forEach(z=>add(T.box,-192,0.14,z,56,0.16,0.12,0,"#8d939c",0,"w"));for(let k=0;k<4;k++)add(T.cyl10,-212+k*13.5,1.0,-35.7,1.4,12,1.4,0,"#e9ecef",0.15,"w",0,Math.PI/2);kMark(-222,-164,-40,-32,3);
        add(T.quad,-130,0.022,46,40,1,40,0,"#cdbf9f",0);for(let i=0;i<6;i++)add(T.box,-146+i*6,0,46,2.6,3.4,13,0,pick(["#e9ecef","#e9ecef","#c2255c"]),0.15);kMark(-150,-110,26,66,3);hMark(-130,46,20,4);}
      // dry washes: pale sandy beds with brush along their banks
      const W=[[[-215,-320],[-205,-250],[-196,-190],[-205,-128],[-200,-80]],[[-420,205],[-330,190],[-252,150],[-176,146]],[[28,330],[48,282],[90,246],[128,252],[138,330]],[[-40,-320],[-12,-262],[18,-200],[30,-130],[22,-80]],[[420,-120],[350,-110],[300,-95],[250,-100],[185,-80]]];
      // (v14: muted sediment, a narrow darker channel down the middle, widening downstream; short tributaries tapering in;
      // concrete box culverts where a road crosses, a headwall and apron where a wash drops into the canal)
      const culvert=(X,z,w)=>{[-1,1].forEach(s2=>{add(T.box,X+s2*(w/2+2.2),0,z,1.2,1.8,10,0,"#c8c6bf",0.15);add(T.cyl10,X+s2*(w/2+1.4),0.1,z,0.8,1.2,0.8,0,"#3b3a36",0,undefined,0,Math.PI/2);});add(T.quad,X,0.035,z,w+8,1,12,0,"#bdb9ae",0);};
      W.forEach(pts=>{CORR.push(pts);const P=strip(pts,t=>15*(0.4+0.6*t),0.04,"#d9c49c",1,0.45);strip(pts,t=>3.4*(0.35+0.65*t),0.047,"#b99f78",0,0.35);
        P.forEach(([x,z],i)=>{if(i%2)return;for(const s2 of [-1,1])if(RNG()<0.7)bush(x+s2*rr(7,12),z+rr(-3,3),rr(0.6,1.2),pick(["#8a9a5b","#7d8a55","#9aa36a","#6f7f45"]));});
        for(let b=0;b<2;b++){const i=Math.floor(P.length*rr(0.25,0.8)),[bx,bz]=P[i],a=rr(0,6.28),L=rr(45,85);if(!inMap(bx+Math.cos(a)*L,bz+Math.sin(a)*L))continue;
          strip([[bx+Math.cos(a)*L,bz+Math.sin(a)*L],[bx+Math.cos(a+0.35)*L*0.5,bz+Math.sin(a+0.35)*L*0.5],[bx,bz]],t=>1.2+6*t,0.042,"#d9c49c",0,0.3);}
        for(let i=1;i<P.length;i++)for(const X of [HXr,EX])if((P[i-1][0]-X)*(P[i][0]-X)<=0)culvert(X,(P[i-1][1]+P[i][1])/2,X===HXr?9:7);
        const e=P[P.length-1],[zc,hw]=RZ(e[0]);if(Math.abs(e[1]-zc)<hw+30){const bz=e[1]>zc?zc+hw+3.4:zc-hw-3.4;add(T.box,e[0],0,bz,12,1.8,1.2,0,"#c8c6bf",0.15);add(T.quad,e[0],0.04,bz+(e[1]>zc?4:-4),10,1,7,0,"#bdb9ae",0);}});
      // the water utilities joined up (v14): pipes on low saddles from the tanks to the reservoir and on to the mill's east
      // fence, from the east reservoir straight in; a containment berm round the tanks; a service track round the reservoir
      {const run=pts=>{for(let i=1;i<pts.length;i++){const [ax,az]=pts[i-1],[bx,bz]=pts[i],L=Math.hypot(bx-ax,bz-az),along=Math.abs(bx-ax)>Math.abs(bz-az);
          add(T.cyl10,ax,0.8,az,0.35,L,0.35,0,"#6f8fa8",0.1,undefined,along?0:Math.PI/2*Math.sign(bz-az),along?-Math.PI/2*Math.sign(bx-ax):0);for(let d=3;d<L;d+=6){const f=d/L;add(T.box,ax+(bx-ax)*f,0,az+(bz-az)*f,0.7,0.5,0.7,0,"#8d939c",0);}}};
        run([[75,117],[95,117]]);run([[104,107],[104,40],[F.x1+1,40]]);run([[105,4],[F.x1+1,4]]);
        [[64,104.5,26,0.6],[64,129.5,26,0.6],[50.5,117,0.6,25],[77.5,117,0.6,25]].forEach(([bx,bz,w2,d2])=>add(T.box,bx,0,bz,w2,0.9,d2,0,"#c9b58e",0.2));
        track([[92,106],[116,106],[116,134],[92,134],[92,106]],3,"#e3d1aa");}
      // dirt tracks between the roads and the landmarks
      [[[HXr-5,60],[-230,110],[-262,190],[-330,262]],[[EX+4,-14],[205,-14]],[[EX+4,86],[170,86]],[[84,117],[EX-4,117]],[[-88,170],[-120,190],[HXr+5,196]],[[98,180],[90,150],[78,130]],[[240,140],[200,150],[EX+4,152]],
        [[-200,109],[HXr-5,104]],[[HXr-5,-150],[-90,-196],[-40,-250],[0,-315]],[[EX+4,-160],[220,-120],[320,-170],[415,-150]],[[EX+4,250],[250,300],[300,315]],[[-60,90],[-20,140],[-60,200],[-120,240],[HXr+5,250]]].forEach(p=>track(p,3.2));
      // creosote and brush everywhere, saguaros, scattered rock
      scatter(4200,-415,415,-315,315,inMap,(x,z)=>{const r=RNG();if(r<0.07){const s=rr(0.7,1.3);if(!place(x,z,0.8))return false;
          add(T.cyl6,x,0,z,0.35*s,5*s,0.35*s,0,"#5f8a4e",0.2);if(RNG()<0.8){add(T.cyl6,x+0.6*s,1.8*s,z,0.25*s,0.7*s,0.25*s,0,"#5f8a4e",0.1,undefined,0,-1.2);add(T.cyl6,x+1.0*s,2.3*s,z,0.25*s,1.8*s,0.25*s,0,"#5f8a4e",0.1);}
          if(RNG()<0.5){add(T.cyl6,x-0.6*s,1.4*s,z,0.25*s,0.7*s,0.25*s,0,"#5f8a4e",0.1,undefined,0,1.2);add(T.cyl6,x-1.0*s,1.9*s,z,0.25*s,1.5*s,0.25*s,0,"#5f8a4e",0.1);}claim(x,z,1.1*s,5*s,0.35);return true;}
        if(r<0.85)return bush(x,z,rr(0.5,1.1),pick(["#6f7f45","#7d8a55","#5f6f3d","#8a9a5b"]));return rock(x,z,rr(0.8,2.6),pick(["#c98b5a","#b9774a","#a99a86"]));});
      scatter(50,F.x0,F.x1,F.z0,F.z1,null,(x,z)=>bush(x,z,rr(0.6,1),pick(["#8a9a5b","#9aa36a"])));
      for(let k=0;k<12;k++){const a=rr(0,6.28),d=rr(140,330),x=Math.cos(a)*d,z=Math.sin(a)*d;if(place(x,z,20))add(T.mound,x,-0.6,z,rr(20,45),rr(3,7),rr(10,22),RNG()*6,"#ead9b0",0.25);}}
    if(ENVK==="swamp"){
      // Bayou: a straight canal past the mill with the barge dock on the near bank, a moored barge and a towboat west,
      // a riverside shack across the water; winding sloughs and lagoons through dense cypress woods, the radio mast on an
      // island clearing with a boardwalk out to a lookout, the substation east with its line, dirt tracks round the fence
      const [czc,chw]=RZ(0);
      LM.bargeDock(-74,czc+chw+2);LM.barge(-245,czc-1,44);LM.shack(-9,czc-chw-7);LM.shack(-44,czc-chw-6);
      {const x=-200,z=czc+chw+8;add(T.box,x,0,z,8,3.2,6,0,"#c9c4ba",0.15);add(T.gable,x,3.2,z,8.4,1.6,6.6,0,"#5b6270",0);add(T.box,x,0.6,z-7,4,0.3,8,0,"#7b5d42",0.1);claim(x,z,6,5,0);}
      const sub=LM.substation(122,-14,2);LM.feeder(sub);LM.pylons([EX+6,-14],[420,-20]);LM.pylons([F.x1+20,-40],[sub[0],sub[1]]);
      LM.mast(-20,148,46);{const pts=[];for(let k=0;k<16;k++){const a=k/16*6.283;pts.push([-20+Math.cos(a)*24,148+Math.sin(a)*22]);}poly(pts,0.02,"#a3b487");track(pts.concat([pts[0]]),3);OPEN.push([-20,148,30]);}
      LM.boardwalk([[-4,168],[20,196],[56,224],[100,228],[138,226]]);
      // the dry pad's graded edge: riprap on the slope, a drainage swale at its foot (culverted under the two roads)
      {const E=6,X0=PLAT.x0-E,X1=PLAT.x1+E,Z1=PLAT.z1+E,gap=(a,b,xs)=>{const out=[];let s0=a;xs.filter(x=>x>a&&x<b).sort((p,q)=>p-q).forEach(x=>{if(x-9>s0)out.push([s0,x-9]);s0=x+9;});if(b>s0)out.push([s0,b]);return out;};
        strip([[X0,PLAT.z0+2],[X0,Z1]],7,0.06,"#9a9486",0);strip([[X1,PLAT.z0+2],[X1,Z1]],7,0.06,"#9a9486",0);gap(X0,X1,[HXr,EX]).forEach(([a,b])=>strip([[a,Z1],[b,Z1]],7,0.06,"#9a9486",0));
        const SW=8;strip([[X0-SW,PLAT.z0+4],[X0-SW,Z1+SW]],3,0.05,"#3f5f52",2);strip([[X1+SW,PLAT.z0+4],[X1+SW,Z1+SW]],3,0.05,"#3f5f52",2);
        gap(X0-SW,X1+SW,[HXr,EX]).forEach(([a,b])=>strip([[a,Z1+SW],[b,Z1+SW]],3,0.05,"#3f5f52",2));[HXr,EX].forEach(X=>[-1,1].forEach(s2=>add(T.box,X+s2*7,hAt(X,Z1+SW)-0.6,Z1+SW,1,1.4,4,0,"#c8c6bf",0.15)));
        note("dryPad",PLAT.x1,PLAT.z1,3);}
      // contained process water: a lined retention basin on the pad, its sign
      LM.reservoir(125,88,18,12);sign(125,80.5,0,"PROCESS WATER BASIN","#1971c2","#ffffff");
      // dock to receiving: a freight apron along the bank, a marked lane round the west fence and in through the yard gate
      // to the receiving apron; bale stacks waiting on the apron; the crane's hook holding a bundle over the barge
      {const LN=[[-60,-54.4],[-107,-54.4],[-107,-35.5],[-55,-35.5],[-55,-25]];add(T.quad,-84,0.04,-54.5,54,1,5.6,0,"#c9c6bd",0);
        for(let i=1;i<LN.length;i++){const [ax,az]=LN[i-1],[bx,bz]=LN[i],L=Math.hypot(bx-ax,bz-az),ry=Math.atan2(-(bz-az),bx-ax);add(T.quad,(ax+bx)/2,0.045,(az+bz)/2,L+4,1,4,ry,"#b8b6ae",0);
          [-2.1,2.1].forEach(o=>add(T.quad,(ax+bx)/2+Math.sin(ry)*o,0.05,(az+bz)/2+Math.cos(ry)*o,L+4,1,0.18,ry,"#f2c230",0));}
        for(let i=0;i<5;i++)for(let l=0;l<2;l++)add(T.box,-104+i*2.2,0.04+l*1.15,-56.6,1.6,1.1,1.25,0,pick(["#a7784a","#b07a43","#8f6a45"]),0.15);
        add(T.box,-84,10.6,czc+chw-5.5,0.08,4,0.08,0,"#2f3a49",0);for(let l=0;l<2;l++)add(T.box,-84,9.4-l*1.15,czc+chw-5.5,3.2,1.1,1.3,0,"#a7784a",0.15);
        G3.actSpots=G3.actSpots||{};G3.actSpots.fork=LN;sign(-84,-50.2,0,"BARGE DOCK · BALES TO RECEIVING","#2f3a49","#f2efe6");note("dockLane",-107,-45,3);}
      // sloughs and lagoons
      const CH=[[[-322,-320],[-300,-262],[-252,-222],[-238,-168],[-206,-120],[-190,-68]],[[-62,-320],[-40,-262],[-80,-205],[-58,-142],[-10,-104],[20,-68]],
        [[175,-320],[176,-262],[220,-232],[300,-242],[380,-200],[430,-212]],[[220,-232],[198,-160],[230,-112],[222,-68]],[[-430,40],[-362,62],[-300,30],[-250,72],[-232,130],[-298,180],[-382,170]],
        [[-430,240],[-340,262],[-262,240],[-202,282],[-182,330]],[[430,92],[370,62],[300,82],[250,42],[202,62],[172,44]],[[430,250],[362,222],[300,252],[262,300],[242,330]],[[-140,330],[-112,282],[-60,252],[-30,206]],
        [[-330,-80],[-300,-130],[-330,-190],[-400,-210]],[[260,140],[300,180],[360,160],[420,180]]];
      // (v14: the sloughs that meet the canal flare at the mouth and narrow toward their heads; the rest swell and pinch;
      // a branch or two tapering off each; reed clumps along the banks)
      CH.forEach((p,i)=>{const w=i%3===0?16:i%3===1?11:13,mouth=[0,1,3].includes(i),hex=pick(["#3f5f52","#43624f","#3b5a50"]);
        const P=channel(p,mouth?t=>w*(0.4+0.95*t*t):t=>w*(0.7+0.45*Math.sin(Math.PI*t)),hex);
        for(let b=0,nb=1+Math.floor(RNG()*2);b<nb;b++){const j=Math.floor(P.length*rr(0.2,0.8)),[bx,bz]=P[j],q=P[Math.min(P.length-1,j+1)],dir=Math.atan2(q[1]-bz,q[0]-bx)+(RNG()<0.5?1:-1)*rr(0.8,1.4),L=rr(30,65),tx=bx+Math.cos(dir)*L,tz=bz+Math.sin(dir)*L;
          if(inMap(tx,tz)&&dFence(tx,tz)>30)channel([[tx,tz],[bx+Math.cos(dir+0.3)*L*0.5,bz+Math.sin(dir+0.3)*L*0.5],[bx,bz]],t=>w*(0.18+0.5*t),hex);}
        P.forEach(([x,z],k)=>{if(k%3||RNG()>0.4)return;const s2=RNG()<0.5?-1:1,rx=x+s2*rr(w*0.35,w*0.6+2),rz=z+rr(-2,2);for(let q=0;q<4;q++)add(T.cone4,rx+rr(-0.9,0.9),0,rz+rr(-0.9,0.9),0.13,rr(1.2,2.2),0.13,RNG(),pick(["#7f8f4f","#8f9a5a","#a8b07a"]),0.2);});});
      const ponds=[];[[-250,-30,22],[-30,200,12],[-110,-160,16],[90,-170,18],[320,-110,20],[-360,-260,18],[118,172,16],[-120,190,14],[330,300,16],[60,300,14],[-300,300,12]].forEach(([x,z,r])=>{LM.lake(x,z,r,false);ponds.push([x,z,r]);});
      // a dirt loop south of the fence between the two roads, and tracks into the woods
      track([[HXr+5,78],[-100,86],[0,92],[92,86],[132,66],[EX-4,40]],3.6);track([[HXr-5,-150],[-205,-170],[-215,-230],[-190,-262],[HXr-15,-262]],3);track([[EX+4,100],[230,110],[280,96],[330,120]],3);track([[EX+4,230],[200,240],[230,300]],3);
      OPEN.push([-160,140,66,98]);
      G3.ponds=ponds.map(p=>p.slice());
      const cypress=(x,z,s,wet)=>{if(!place(x,z,(wet?1.2:1.0)*s,wet))return false;card(x,0,z,[[-0.9*s,0],[0.9*s,0],[0.3*s,1.6*s],[-0.3*s,1.6*s]],"#6b5440",0.1);trunk(x,z,0.6*s,6.6*s,"#7a6248");
        card(x,0,z,ring(0,7.2*s,2.6*s,0.9*s,6,0.2),pick(["#4f6b3e","#5f7d4a","#57714a","#45603a","#6c8a52"]),0.3,0.08);   /* (v6.1 t7: paper card) */if(RNG()<0.5)add(T.cone4,x+0.8*s,4.8*s,z,0.4*s,1.6*s,0.4*s,0,"#8a9a7a",0,undefined,Math.PI,0);
        claim(x,z,1.1*s,8*s,0.3*s);return true;};
      ponds.forEach(([x,z,r])=>{for(let k=0;k<8;k++){const a=rr(0,6.28),d=r*rr(0.5,1.2);cypress(x+Math.cos(a)*d,z+Math.sin(a)*d*0.8,rr(0.8,1.3),true);}});
      // alligator basking at the first pond
      {const [x,z,r]=ponds[0],gx=x+r*0.7,gz=z;add(T.box,gx,0,gz,3.2,0.35,0.8,0.4,"#3f4a32",0.2);add(T.box,gx+1.9*Math.cos(0.4),0,gz-1.9*Math.sin(0.4),1.2,0.25,0.5,0.4,"#3f4a32",0.2);}
      // dense cypress and hardwood woods; marsh grass in the open patches; cypress standing in the sloughs
      scatter(17000,-415,415,-315,315,(x,z)=>inMap(x,z)&&dFence(x,z)>18&&!openAt(x,z)&&noise(x,z,60)>0.26,(x,z)=>{const r=RNG();if(r<0.55)return cypress(x,z,rr(1.15,1.9),false);
        if(r<0.85)return broadleaf(x,z,rr(1.3,1.95),Math.hypot(x,z)>200,true);return bush(x,z,rr(1.0,1.6),pick(["#4f6b3e","#5f7d4a"]));});
      scatter(1400,-415,415,-315,315,(x,z)=>inMap(x,z)&&KO[kIdx(x,z)]===2&&!onRiver(x,z,2),(x,z)=>RNG()<0.35&&cypress(x,z,rr(0.8,1.2),true));
      // reed beds: mud flats and shallow pools in the open marsh, dense reeds round them
      scatter(260,-415,415,-315,315,(x,z)=>inMap(x,z)&&noise(x,z,60)<=0.26&&dFence(x,z)>40&&kFree(x,z,6),(x,z)=>{const pts=[],r=rr(4,13),m=7;for(let q=0;q<m;q++){const a=q/m*6.283;pts.push([x+Math.cos(a)*r*rr(0.6,1.2),z+Math.sin(a)*r*rr(0.6,1.2)]);}
        poly(pts,0.028,pick(["#6f6548","#7a6e50","#4d6b5c","#557a6a"]));return true;});
      scatter(2200,-415,415,-315,315,(x,z)=>inMap(x,z)&&noise(x,z,60)<=0.28,(x,z)=>{if(!place(x,z,0.6))return false;for(let q=0;q<3;q++)add(T.cone4,x+rr(-0.6,0.6),0,z+rr(-0.5,0.5),0.14,rr(1.0,1.8),0.14,RNG(),pick(["#9aa36a","#8f9a5a","#a8b07a"]),0.2);claim(x,z,0.6,2,0);return true;});
      scatter(70,F.x0,F.x1,F.z0,F.z1,null,(x,z)=>RNG()<0.6?cypress(x,z,rr(0.7,1.1),false):bush(x,z,rr(0.7,1.1)));
      // reeds along the canal banks
      for(let k=0;k<220;k++){const x=rr(-400,400),[zc,hw]=RZ(x),z=RNG()<0.5?zc+hw+rr(0.5,2.5):zc-hw-rr(0.5,2.5);if(!place(x,z,0.5,true))continue;for(let q=0;q<3;q++)add(T.cone4,x+rr(-0.5,0.5),0,z+rr(-0.4,0.4),0.12,rr(1.2,2.2),0.12,RNG(),pick(["#7f8f4f","#8f9a5a"]),0.2);claim(x,z,0.5,2,0);}}
    /* ---------- the ground: a height-field mesh with the environment's tile and large-scale colour variation ---------- */
    {const cs=ENVK==="swamp"?12:(RIVERS[ENVK]||{}).kind==="sea"?16:24,W=840,D=640,   /* (v6.1 t7: flat ground needs few rows: 24 m cells, 12 m where the bayou pad steps down, 16 m by the sea) */nx=Math.round(W/cs),nz=Math.round(D/cs);
      const g=new THREE.PlaneGeometry(W,D,nx,nz);g.rotateX(-Math.PI/2);const pa=g.attributes.position,col=new Float32Array(pa.count*3);
      const base=new THREE.Color(ENVLOOK.ground).convertSRGBToLinear(),tint=new THREE.Color(),mixc=new THREE.Color();
      const PATCH={rural:[["#c9c46c",55,0.6,0.5,500,0],["#b59a6b",40,0.72,0.55,0,500]],urban:[["#9fb585",60,0.6,0.45,500,0],["#b3bd9a",45,0.7,0.35,0,500]],
        desert:[["#ead9b0",52,0.5,0.5,0,0],["#c7b08a",45,0.68,0.5,300,0],["#d9c190",80,0.62,0.35,0,300]],swamp:[["#6f6a4a",45,0.6,0.5,0,0],["#7f9a63",60,0.6,0.5,300,0]]}[ENVK];
      const SEAF=(RIVERS[ENVK]||{}).kind==="sea";for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,hAt(x,z)-(SEAF&&rDist(x,z)<-6?2.5:0));   // (the sea bed sits well under the water: no flicker far out)
        const df=dFence(x,z),near=sstep(16,60,df);tint.copy(base);
        if(near>0){for(const [hex,sc,th,k,ox,oz] of PATCH){const n=noise(x+ox,z+oz,sc);if(n>th)tint.lerp(mixc.set(hex).convertSRGBToLinear(),k*near*Math.min(1,(n-th)/0.12));}
          tint.multiplyScalar(1+(noise(x,z,70)-0.5)*0.16*near);}
        if(G3.palQ){tint.convertLinearToSRGB();tint.set(G3.palQ("#"+tint.getHexString())).convertSRGBToLinear();}   // (v6.1 t8: palette patches, no gradients)
        col[i*3]=tint.r;col[i*3+1]=tint.g;col[i*3+2]=tint.b;}
      g.setAttribute("color",new THREE.BufferAttribute(col,3));g.computeVertexNormals();
      const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*W/26,uv.getY(i)*D/26);
      // the tile: pale, so the vertex colour carries the hue; speckle and strokes per environment, 26 m across
      const gt=texC(256,256,(x,Wd)=>{x.fillStyle="#f2f2ee";x.fillRect(0,0,Wd,Wd);
        if(ENVK==="desert"){for(let y=0;y<Wd;y+=9){x.strokeStyle="rgba(120,100,70,0.10)";x.lineWidth=1.5;x.beginPath();for(let i=0;i<=Wd;i+=6)x.lineTo(i,y+4*Math.sin(i/22+y/9));x.stroke();}
          for(let k=0;k<700;k++){const v=rr(150,230);x.fillStyle=`rgba(${v},${v-20},${v-50},0.35)`;x.fillRect(rr(0,Wd),rr(0,Wd),1.5,1.5);}}
        else if(ENVK==="swamp"){for(let k=0;k<40;k++){const gr=x.createRadialGradient(rr(0,Wd),rr(0,Wd),0,rr(0,Wd),rr(0,Wd),rr(12,40));gr.addColorStop(0,"rgba(70,60,40,0.07)");gr.addColorStop(1,"rgba(70,60,40,0)");x.fillStyle=gr;x.fillRect(0,0,Wd,Wd);}
          for(let k=0;k<1200;k++){x.fillStyle=Math.random()<0.5?"rgba(60,80,40,0.25)":"rgba(220,230,190,0.2)";x.fillRect(rr(0,Wd),rr(0,Wd),1.2,2.2);}}
        else{for(let k=0;k<1500;k++){const g2=Math.random()<0.5;x.fillStyle=g2?`rgba(70,110,50,${rr(0.08,0.2)})`:`rgba(230,240,200,${rr(0.08,0.18)})`;x.fillRect(rr(0,Wd),rr(0,Wd),1,rr(1.5,3.5));}
          for(let k=0;k<5;k++){const gr=x.createRadialGradient(rr(0,Wd),rr(0,Wd),0,rr(0,Wd),rr(0,Wd),rr(30,70));gr.addColorStop(0,"rgba(90,110,60,0.05)");gr.addColorStop(1,"rgba(90,110,60,0)");x.fillStyle=gr;x.fillRect(0,0,Wd,Wd);}}},true);
      // phones (Low/Medium) skip the tile: the vertex colours alone share the scenery's shader, so no extra program is compiled
      const tm=DEN>=1?new StdMat({map:gt,vertexColors:true,roughness:0.95}):new StdMat({vertexColors:true,roughness:0.95,flatShading:true});tm.color.set(0xffffff);
      tm.polygonOffset=true;tm.polygonOffsetFactor=1;tm.polygonOffsetUnits=2;   // the ground sits a hair behind roads, lots and water drawn on it (no flicker)
      const terr=new THREE.Mesh(g,tm);terr.name="terrain";terr.receiveShadow=true;terr.userData.noNav=true;terr.userData.terrain=true;if(!new URLSearchParams(location.search).has("noterr"))scene.add(terr);G3.terrain=terr;}
    // lit windows (urban): one mesh of small quads facing out of each building, shown at night (envUpdate sets the opacity)
    if(NW.length){const P3=[],I3=[],U3=[];NW.forEach(([x,y,z,w,h,f],k)=>{const hw=w/2,hh=h/2,b=k*4;U3.push(0,0,1,0,1,1,0,1);
        if(f===0||f===2){P3.push(x,y-hh,z-hw, x,y-hh,z+hw, x,y+hh,z+hw, x,y+hh,z-hw);}else{P3.push(x-hw,y-hh,z, x+hw,y-hh,z, x+hw,y+hh,z, x-hw,y+hh,z);}
        if(f===0||f===3)I3.push(b,b+2,b+1,b,b+3,b+2);else I3.push(b,b+1,b+2,b,b+2,b+3);});
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(P3,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(U3,2));g.setIndex(I3);g.computeVertexNormals();
      // (v6.1 t13: each lit window is a yellow paper pane: a card with an ink frame and a cross of glazing bars)
      const wt=/[?&]softnight/.test(location.search)?null:(()=>{const c=document.createElement("canvas");c.width=c.height=64;const x=c.getContext("2d");x.fillStyle="#ffe08a";x.fillRect(0,0,64,64);
        x.fillStyle="#fff1c2";x.fillRect(8,8,22,22);x.strokeStyle="#3a2a1a";x.lineWidth=7;x.strokeRect(3.5,3.5,57,57);x.lineWidth=4;x.beginPath();x.moveTo(32,4);x.lineTo(32,60);x.moveTo(4,32);x.lineTo(60,32);x.stroke();
        const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
      const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:wt?0xffffff:lin0("#ffd98a"),map:wt,transparent:true,opacity:0,toneMapped:false,depthWrite:false}));m.visible=false;m.userData.noNav=true;scene.add(m);G3.nightWin=m;}
    // name boards
    SIGNS.forEach(([x,z,ry,text,bg,fg])=>{const c=document.createElement("canvas");c.width=512;c.height=96;const X=c.getContext("2d");X.fillStyle=bg;X.fillRect(0,0,512,96);X.strokeStyle=fg;X.lineWidth=5;X.strokeRect(8,8,496,80);
      X.fillStyle=fg;X.textAlign="center";X.textBaseline="middle";let fs=46;do{X.font=`800 ${fs}px system-ui,sans-serif`;fs-=2;}while(X.measureText(text).width>470&&fs>18);X.fillText(text,256,50);
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(7.4,1.4),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));
      m.position.set(x,hAt(x,z)+2.8,z);m.rotation.y=ry;m.userData.noNav=true;scene.add(m);});
    /* ---------- build the merged meshes ---------- */
    const smat=new StdMat({vertexColors:true,roughness:0.9,flatShading:true});smat.color.set(0xffffff);
    let tris=0;const parts=[];
    // v6.1 t7: the fixed camera never sees a triangle facing away from it (the material is single-sided, so they were only
    // ever transformed and thrown away): keep the ones facing the camera
    if(!G3.geomFree){const th=-Math.PI/4,ph=Math.acos(Math.sqrt(1/3)),vx=Math.sin(ph)*Math.sin(th),vy=Math.cos(ph),vz=Math.sin(ph)*Math.cos(th);let before=0,after=0;   // (v6.12: not with the free camera)
     for(const k in SEC){const S2=SEC[k];if(!S2.n)continue;const P=S2.p,C=S2.c,np=[],nc=[];
       for(let t=0;t<P.length;t+=9){const ux=P[t+3]-P[t],uy=P[t+4]-P[t+1],uz=P[t+5]-P[t+2],wx=P[t+6]-P[t],wy=P[t+7]-P[t+1],wz=P[t+8]-P[t+2];
         if((uy*wz-uz*wy)*vx+(uz*wx-ux*wz)*vy+(ux*wy-uy*wx)*vz<=1e-7)continue;for(let q=0;q<9;q++){np.push(P[t+q]);nc.push(C[t+q]);}}
       before+=S2.n;S2.p=np;S2.c=nc;S2.n=np.length/9;after+=S2.n;}
     diag(`scenery back faces stripped: ${before} -> ${after} triangles`);}
    // v6.1 t10 (?scnmerge): one mesh for every sector
    if(/[?&]scnmerge/.test(location.search)){   /* (measured: one draw saved per sector, but the off-screen sectors' ~25k triangles then always drawn; off by default) */const P=[],C=[];let n=0;for(const k in SEC){const S2=SEC[k];if(!S2.n)continue;for(let i=0;i<S2.p.length;i++){P.push(S2.p[i]);C.push(S2.c[i]);}n+=S2.n;}
      for(const k in SEC)if(SEC[k].n){SEC[k].n0=SEC[k].n;}const all={p:P,c:C,n};for(const k of Object.keys(SEC))if(k!=="near")SEC[k]={n:0,p:[],c:[],n0:SEC[k].n0};SEC.near=all;}
    for(const k in SEC){const S2=SEC[k];if(!S2.n)continue;const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(S2.p,3));g.setAttribute("color",new THREE.Float32BufferAttribute(S2.c,3));
      g.computeVertexNormals();g.computeBoundingSphere();const m=new THREE.Mesh(g,smat);m.name="scenery "+k;m.castShadow=k==="near"||!!(G3.GFX&&G3.GFX.far);m.receiveShadow=k==="near";m.userData.scenery=k;m.userData.noNav=true;scene.add(m);parts.push(m);tris+=S2.n;}
    // v14: landmark names, shown only in the zoomed-out site view (43-3d-frame.js swaps them with the equipment labels)
    {const NM={timber:"Valley Timber Co.",occStore:"OCC bale store",farm:"Farm",orchard:"Orchard",lake:"Lake",mast:"Radio mast",substation:"Substation",deepwood:"Deep woods",
        railyard:"Rail yard",waterTower:"Water tower",recycler:"Recycling yard",pier:"Pier",port:"Container port",lighthouse:"Lighthouse",townWater:"Town water",beach:"Beach",
        solarFarm:"Solar farm",waterTanks:"Water tanks",windpump:"Windpump",stockPond:"Stock pond",ranch:"Ranch",bargeDock:"Barge dock",barge:"Barge",shack:"Fishing shack",boardwalk:"Boardwalk lookout",dockLane:"Bale route to receiving"};
      if(ENVK==="urban")UTIL.beach=[-300,-80,4];
      if(typeof LABELS!=="undefined")for(const k in UTIL){if(!NM[k])continue;const [x,z,h]=UTIL[k],y=hAt(x,z)+Math.min(30,h)+4;LABELS.push({land:1,p:[x,y,z],t:()=>[NM[k],""],lb:lblNew(false),v:new THREE.Vector3(x,y,z)});}}
    // for the clipping check (tools/clipcheck.py): is (x,z) inside a scenery footprint?
    G3.sceneryAt=(x,z)=>{const i=kIdx(x,z);return i>=0&&KO[i]===3;};
    G3.scenery={env:ENVK,seed:SITE.seed,layout:LAYOUT.i,parts,tris,util:UTIL,sectors:Object.fromEntries(Object.entries(SEC).map(([k,v])=>[k,v.n])),navBoxes:NB.length};
    diag(`scenery: ${ENVK} mill #${SITE.seed} (layout ${LAYOUT.i}): ${tris} triangles in ${parts.length} meshes`);}
