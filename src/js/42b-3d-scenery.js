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
    kMark(-420,420,-78,-55,2);                                        // the river and its banks (water plants allowed)
    kMark(-420,-139,-33,-25,1);                                        // the rail line out to the horizon
    if(FD)kMark(FD.x-6,FD.x+6,FD.z-3,FD.z+6,1);                        // food-truck pitch (the truck is hidden until lunch)
    kMark(-150,-95,-8,17,1);                                           // truck roads up to the gate and the turning space
    const inside=(x,z,m=0)=>x>F.x0+m&&x<F.x1-m&&z>F.z0+m&&z<F.z1-m;
    /* ---------- geometry merger: vertex colours, flat normals, one mesh per sector ---------- */
    const SEC={near:{p:[],c:[],n:0}},secOf=(x,z)=>x>-110&&x<100&&z>-60&&z<75?"near":z<-60?(x<20?"nw":"ne"):z>75?"s":x<0?"w":"e";
    ["nw","ne","s","w","e"].forEach(k=>SEC[k]={p:[],c:[],n:0});
    const _v=new THREE.Vector3(),_m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_e=new THREE.Euler(),_col=new THREE.Color();
    const TPL={};
    function tpl(k,make,fix){if(TPL[k])return TPL[k];let g=make();if(g.index)g=g.toNonIndexed();const a=g.attributes.position.array;
      // hand-built shapes: turn every triangle to face away from the shape's axis (x = z = 0, at the triangle's own height)
      if(fix)for(let t=0;t<a.length;t+=9){const ux=a[t+3]-a[t],uy=a[t+4]-a[t+1],uz=a[t+5]-a[t+2],vx=a[t+6]-a[t],vy=a[t+7]-a[t+1],vz=a[t+8]-a[t+2];
        const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,cx=(a[t]+a[t+3]+a[t+6])/3,cy=(a[t+1]+a[t+4]+a[t+7])/3,cz=(a[t+2]+a[t+5]+a[t+8])/3;
        if(nx*cx+ny*(cy-fix)+nz*cz<0)for(let k=0;k<3;k++){const s=a[t+3+k];a[t+3+k]=a[t+6+k];a[t+6+k]=s;}}
      return TPL[k]=a;}
    // add a template with a transform and colour; shade darkens toward the base for a little ambient occlusion
    function add(arr,x,y,z,sx,sy,sz,ry,hex,shade=0.18,sec,rx=0,rz=0){const S2=SEC[sec||secOf(x,z)];_col.set(hex).convertSRGBToLinear();
      _e.set(rx,ry,rz);_q.setFromEuler(_e);_m.compose(_v.set(x,y,z),_q,_s.set(sx,sy,sz));const e=_m.elements;
      let lo=1e9,hi=-1e9;for(let i=1;i<arr.length;i+=3){lo=Math.min(lo,arr[i]);hi=Math.max(hi,arr[i]);}const span=Math.max(1e-6,hi-lo);
      for(let i=0;i<arr.length;i+=3){const ax=arr[i],ay=arr[i+1],az=arr[i+2];
        S2.p.push(e[0]*ax+e[4]*ay+e[8]*az+e[12],e[1]*ax+e[5]*ay+e[9]*az+e[13],e[2]*ax+e[6]*ay+e[10]*az+e[14]);
        const k=1-shade*(1-(ay-lo)/span);S2.c.push(_col.r*k,_col.g*k,_col.b*k);}S2.n+=arr.length/9;}
    // templates (unit size, base at y=0, no hidden bottom faces)
    const T={box:tpl("box",()=>{const g=new THREE.BoxGeometry(1,1,1);g.translate(0,0.5,0);const ng=g.toNonIndexed(),a=ng.attributes.position.array,keep=[];
        for(let t=0;t<a.length;t+=9){const ys=[a[t+1],a[t+4],a[t+7]];if(ys.every(y=>y<1e-6))continue;for(let k=0;k<9;k++)keep.push(a[t+k]);}
        const out=new THREE.BufferGeometry();out.setAttribute("position",new THREE.Float32BufferAttribute(keep,3));return out;}),
      ico:tpl("ico",()=>new THREE.IcosahedronGeometry(1,0)),oct:tpl("oct",()=>new THREE.OctahedronGeometry(1,0)),
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
    function poly(pts,y,hex,sec){const S2=SEC[sec||secOf(pts[0][0],pts[0][1])];_col.set(hex).convertSRGBToLinear();let cx=0,cz=0;pts.forEach(p=>{cx+=p[0];cz+=p[1];});cx/=pts.length;cz/=pts.length;
      for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];S2.p.push(cx,y,cz,b[0],y,b[1],a[0],y,a[1]);for(let k=0;k<3;k++)S2.c.push(_col.r,_col.g,_col.b);S2.n++;}}
    // camera height floor and walker obstacles
    const HC=8,HNX=106,HNZ=80,HX0=-424,HZ0=-320,HM=new Float32Array(HNX*HNZ);
    function hMark(x,z,r,h){const i0=Math.max(0,Math.floor((x-r-HX0)/HC)),i1=Math.min(HNX-1,Math.floor((x+r-HX0)/HC)),j0=Math.max(0,Math.floor((z-r-HZ0)/HC)),j1=Math.min(HNZ-1,Math.floor((z+r-HZ0)/HC));
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)HM[j*HNX+i]=Math.max(HM[j*HNX+i],h);}
    G3.sceneryH=(x,z)=>{const i=Math.floor((x-HX0)/HC),j=Math.floor((z-HZ0)/HC);return i<0||j<0||i>=HNX||j>=HNZ?0:HM[j*HNX+i];};
    const NB=G3.navBoxes=[];
    // claim a footprint: keep-out, camera floor, and (inside the yard) a walker obstacle at the trunk
    function claim(x,z,r,h,trunk){kMark(x-r,x+r,z-r,z+r,3);hMark(x,z,r,h);if(trunk&&x>-62&&x<88&&z>-52&&z<53)NB.push([x-trunk,x+trunk,z-trunk,z+trunk]);}
    const place=(x,z,r,water)=>kFree(x,z,r,water);
    // where the utilities and features ended up (zen camera shots, the brownout's substation): name -> [x, z, height]
    const UTIL={};const note=(k,x,z,h)=>{UTIL[k]=[+x.toFixed(1),+z.toFixed(1),h];};
    // graphics tier: scenery density (Low 0.5 ... Ultra 1.4); the yard and the utilities are the same at every tier
    const DEN=(G3.GFX&&G3.GFX.scenery)||1;
    /* ---------- noise for natural clustering ---------- */
    const NG=[];for(let k=0;k<40*32;k++)NG.push(RNG());
    function noise(x,z,s=60){const fx=(x+420)/s,fz=(z+320)/s,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,g=(a,b)=>NG[((b%32+32)%32)*40+((a%40+40)%40)];
      const su=u*u*(3-2*u),sv=v*v*(3-2*v);return (g(i,j)*(1-su)+g(i+1,j)*su)*(1-sv)+(g(i,j+1)*(1-su)+g(i+1,j+1)*su)*sv;}
    /* ---------- assets ---------- */
    const GREEN=["#6fa76b","#5f9a63","#7cb072","#8ab879","#5b8f5c","#4f8257","#94bf6e","#6a9a4f","#7aa88a"],AUT=["#c9a24a","#d08a3c","#b9673a"],BARK=["#7a5a3c","#6b4f36","#8a6a4a"];
    function broadleaf(x,z,s,far){if(!place(x,z,1.6*s))return false;const c=RNG()<0.06?pick(AUT):pick(GREEN);add(T.tri3,x,0,z,0.28*s,2.3*s,0.28*s,RNG()*6,pick(BARK),0.1);
      add(far?T.oct:T.ico,x,3.4*s,z,1.9*s,(far?1.9:1.5)*s,1.9*s,RNG()*6,c,0.35);claim(x,z,1.7*s,5.2*s,0.3*s);return true;}
    function conifer(x,z,s){if(!place(x,z,1.3*s))return false;const c=pick(["#3f6f4f","#4a7a55","#557f58","#3d6a52"]);add(T.tri3,x,0,z,0.25*s,1.6*s,0.25*s,RNG()*6,pick(BARK),0.1);
      add(T.cone6,x,1.1*s,z,1.7*s,3.4*s,1.7*s,RNG()*6,c,0.3);add(T.cone6,x,3.2*s,z,1.2*s,2.9*s,1.2*s,RNG()*6,c,0.25);claim(x,z,1.5*s,6.1*s,0.3*s);return true;}
    function bush(x,z,s,hex){if(!place(x,z,0.9*s))return false;add(T.oct,x,0.35*s,z,1.0*s,0.7*s,1.0*s,RNG()*6,hex||pick(GREEN),0.3);claim(x,z,0.9*s,1.1*s);return true;}
    function rock(x,z,s,hex){if(!place(x,z,1.1*s))return false;add(T.ico,x,0.2*s,z,1.2*s,0.75*s,1.0*s,RNG()*6,hex,0.25);claim(x,z,1.2*s,1*s);return true;}
    function house(x,z,ry,w,d,h,wall,roof){add(T.box,x,0,z,w,h,d,ry,wall,0.15);add(T.gable,x,h,z,w+0.4,h*0.55,d+0.5,ry,roof,0.05);}
    function building(x,z,w,d,h,ry,hex,roofHex){add(T.box,x,0,z,w,h,d,ry,hex,0.2);add(T.box,x,h,z,w*0.98,0.6,d*0.98,ry,roofHex||"#5b6270",0.05);
      // window bands: thin darker slabs every 3.5 m on taller buildings
      if(h>9){const glass=pick(["#3c4a5c","#46576d","#2f3a49"]),st=Math.max(3.5,(h-4)/4);for(let y=2.6;y<h-1.5;y+=st)add(T.box,x,y,z,w+0.08,1.2,d+0.08,ry,glass,0);}}
    function silo(x,z,r,h,hex){add(T.cyl10,x,0,z,r,h,r,0,hex,0.15);add(T.dome,x,h,z,r,r*0.7,r,0,"#9aa0a8",0.05);}
    /* ---------- 2. off-site roads and rail ---------- */
    const ROADC=ENVK==="desert"?"#6f6a62":"#5a5f69",LANE=ENVK==="urban"?"#f2f2f2":"#f2c230",SHOULD=ENVK==="desert"?"#c9b791":ENVK==="swamp"?"#7d7457":"#b9b29c";
    function road(pts,w,dash,sec){for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),ry=Math.atan2(-dz,dx),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;
        add(T.quad,mx,0.024,mz,L+w*0.6,1,w+1.6,ry,SHOULD,0,sec);add(T.quad,mx,0.03,mz,L+w*0.5,1,w,ry,ROADC,0,sec);
        if(dash)for(let d=2;d<L-2;d+=7){const f=d/L;add(T.quad,a[0]+dx*f,0.036,a[1]+dz*f,3,1,0.22,ry,LANE,0,sec);}
        const n=Math.ceil(L/2);for(let k=0;k<=n;k++){const x=a[0]+dx*k/n,z=a[1]+dz*k/n;kMark(x-w/2-1.5,x+w/2+1.5,z-w/2-1.5,z+w/2+1.5,1);}}}
    // the highway: north-south just west of the gate, bending gently away from the mill, bridging the river
    const HXr=-158,bend=()=>rr(-30,30),b1=bend(),b2=bend(),b3=bend(),b4=bend();
    road([[HXr+b1,-320],[HXr+b2*0.6,-160],[HXr,-82]],9,true);road([[HXr,-50],[HXr,-3.8],[HXr,12.5],[HXr,80],[HXr+b3*0.7,170],[HXr+b4,320]],9,true);road([[-140,-3.8],[HXr,-3.8]],5.6,false,"near");road([[-140,12.5],[HXr,12.5]],5.6,false,"near");
    // bridge deck and parapets over the river and the banks
    add(T.box,HXr,1.2,-66,11,0.5,26,0,"#9a9ea6",0.1);[-1,1].forEach(s2=>add(T.box,HXr+s2*5.3,1.7,-66,0.4,0.9,26,0,"#c8ccd2",0.1));
    [-74,-58].forEach(z=>add(T.box,HXr,0,z,9,1.2,1.2,0,"#8a8e96",0.2));add(T.quad,HXr,1.46,-66,9,1,26,0,ROADC,0);kMark(HXr-8,HXr+8,-80,-52,1);hMark(HXr,-66,8,3);
    // the east access road the staff cars use, then a local road north-south
    const EX=Math.round(rr(128,165)),er=[[100,32.5],[EX,32.5]];road(er,6,false,"e");
    const e1=rr(-12,12),e2=rr(-20,20);road([[EX+e1,-320],[EX,-82]],7,true);road([[EX,-50],[EX,32.5],[EX,110],[EX+e2,320]],7,true);
    add(T.box,EX,1.2,-66,8,0.5,26,0,"#9a9ea6",0.1);add(T.quad,EX,1.46,-66,7,1,26,0,ROADC,0);[-1,1].forEach(s2=>add(T.box,EX+s2*4,1.7,-66,0.35,0.8,26,0,"#c8ccd2",0.1));kMark(EX-7,EX+7,-80,-52,1);hMark(EX,-66,7,3);
    // rail line from the spur out to the horizon (the train arrives from the west), level crossing at the highway
    {const n=Math.floor((-139+420)/0.8);for(let k=0;k<n;k+=2){const x=-139.4-k*0.8;add(T.box,x,0,-29,0.35,0.14,2.6,0,"#7b5d42",0,x>-110?"near":"w");}
      [-29.7,-28.3].forEach(z=>{for(let x=-139;x>-420;x-=40)add(T.box,x-20,0.14,z,40,0.16,0.12,0,"#8d939c",0,x>-110?"near":"w");});
      add(T.quad,HXr,0.04,-29,10,1,4,0,"#6d6a63",0);[-1,1].forEach(s2=>{add(T.box,HXr+s2*6,0,-29+s2*3,0.25,3.2,0.25,0,"#f2f2f2",0.1);add(T.box,HXr+s2*6,2.6,-29+s2*3,0.9,0.5,0.15,0,"#d6382c",0);});}
    /* ---------- 3. utilities that follow the site's pros and cons, in seeded spots near the fence ---------- */
    // a spot: random point in a band 8-70 m outside the fence whose footprint is free
    function spot(r,near=8,far=70,tries=400){for(let t=0;t<tries;t++){const side=Math.floor(RNG()*4);let x,z;
        if(side===0){x=rr(F.x0-far,F.x0-near);z=rr(F.z0,F.z1+far);}else if(side===1){x=rr(F.x1+near,F.x1+far);z=rr(F.z0,F.z1+far);}
        else if(side===2){x=rr(F.x0,F.x1);z=rr(F.z1+near,F.z1+far);}else{x=rr(F.x0-far,F.x1+far);z=rr(F.z1+near*2,F.z1+far+40);}
        if(place(x,z,r))return [x,z];}return null;}
    const UT={
      waterTower(){const p=spot(7);if(!p)return;const [x,z]=p,h=rr(18,24);[[-2.4,-2.4],[2.4,-2.4],[-2.4,2.4],[2.4,2.4]].forEach(([a,b])=>add(T.box,x+a,0,z+b,0.45,h,0.45,0,"#9aa3ad",0.2));
        add(T.cyl10,x,h,z,5,5,5,0,"#e9ecef",0.15);add(T.cone6,x,h+5,z,5.3,2.2,5.3,0,"#c7ccd3",0.05);add(T.cyl6,x,0,z,0.6,h,0.6,0,"#9aa3ad",0.1);claim(x,z,6,h+7,0);note("waterTower",x,z,h+7);},
      substation(n=3){const p=spot(11);if(!p)return;const [x,z]=p;add(T.quad,x,0.03,z,20,1,16,0,"#b6b3aa",0);for(let k=0;k<n;k++){const tx=x-6+k*6;add(T.box,tx,0,z-2,3.2,3,2.4,0,"#7d8792",0.25);
          add(T.box,tx,3,z-2,0.3,2.2,0.3,0,"#4a4f58",0);add(T.box,tx-1,3,z-2,0.3,1.6,0.3,0,"#4a4f58",0);}
        [[-9,-7],[9,-7],[-9,7],[9,7]].forEach(([a,b])=>add(T.box,x+a,0,z+b,0.3,6,0.3,0,"#8d939c",0.1));add(T.box,x,5.8,z-7,18,0.3,0.3,0,"#8d939c",0);add(T.box,x,5.8,z+7,18,0.3,0.3,0,"#8d939c",0);
        // fence (thin, see-through look approximated by a low wall of mesh colour)
        [[0,-8,20,0.1],[0,8,20,0.1],[-10,0,0.1,16],[10,0,0.1,16]].forEach(([a,b,w,d])=>add(T.box,x+a,0,z+b,w,2.2,d,0,"#a8b0b8",0.3));claim(x,z,11,7,0);note("substation",x,z,7);return [x,z];},
      // a line of pylons; never inside the fence or on the river (the mill's own line is the power house)
      pylons(from,to){const n=Math.max(2,Math.round(Math.hypot(to[0]-from[0],to[1]-from[1])/55));for(let k=0;k<=n;k++){const x=from[0]+(to[0]-from[0])*k/n,z=from[1]+(to[1]-from[1])*k/n;if(inside(x,z,-8)||(z>-80&&z<-52)||!place(x,z,2.5))continue;
          const ry=Math.atan2(-(to[1]-from[1]),to[0]-from[0])+Math.PI/2;add(T.cone4,x,0,z,1.5,24,1.5,ry,"#7d838c",0.15);add(T.box,x,17,z,0.25,0.35,9,ry,"#7d838c",0);add(T.box,x,20.5,z,0.25,0.3,6,ry,"#7d838c",0);claim(x,z,2,24,0);}},
      solarFarm(){const w=70,d=44;let p=null;for(let t=0;t<60&&!p;t++){const q=spot(30,14,110);if(q&&place(q[0],q[1],32))p=q;}if(!p)return;const [x,z]=p;
        for(let r=0;r<8;r++)for(let c=0;c<6;c++){const px=x-w/2+5+c*11.5,pz=z-d/2+3+r*5.4;add(T.box,px,1.0,pz,10.5,0.12,2.6,0,"#2c3e63",0,undefined,-0.45);add(T.box,px,0,pz+0.6,0.2,1.2,0.2,0,"#8d939c",0);}
        add(T.box,x+w/2-3,0,z+d/2-2,3,2.2,2,0,"#e2e5e9",0.2);kMark(x-w/2,x+w/2,z-d/2,z+d/2,3);hMark(x,z,36,2);note("solarFarm",x,z,2);return [x,z];},
      waterTanks(){const p=spot(10);if(!p)return;const [x,z]=p;[[-4,0,5,7],[5,1,4,6]].forEach(([a,b,r,h])=>add(T.cyl10,x+a,0,z+b,r,h,r,0,"#e7e2d6",0.15));
        [[-9,-8],[8,-9],[10,7]].forEach(([a,b])=>{if(place(x+a,z+b,1.5)){add(T.box,x+a,0,z+b,1.4,1.2,1.4,0,"#9aa0a8",0.2);add(T.box,x+a,1.2,z+b,0.3,2.5,0.3,0,"#6b7079",0);claim(x+a,z+b,1.5,4,0);}});claim(x,z,9,8,0);note("waterTanks",x,z,8);},
      windpump(){const p=spot(3,10,90);if(!p)return;const [x,z]=p;add(T.cone4,x,0,z,1.4,9,1.4,0.6,"#8a8f98",0.2);add(T.cyl6,x,9,z+0.4,1.6,0.1,1.6,0,"#c9ced6",0,undefined,Math.PI/2);claim(x,z,1.6,10,0);note("windpump",x,z,10);},
      bargeDock(){const x=rr(-90,60),z=-63;add(T.box,x,0.4,z+4,22,0.4,4,0,"#7b5d42",0.1);for(let k=-10;k<=10;k+=5)add(T.cyl6,x+k,-0.6,z+5.5,0.25,1.6,0.25,0,"#5c4632",0);
        add(T.box,x+2,0.1,z-2.5,26,1.1,7,0,"#4f5560",0.3);for(let i=0;i<9;i++)for(let l=0;l<2;l++)add(T.box,x-8+i*2.5,1.2+l*1.0,z-2.5+(i%2?0.9:-0.9),1.9,0.95,1.6,0,pick(["#b07a43","#a7784a","#8f6a45"]),0.15);claim(x,z,1,1,0);hMark(x,z,14,4);note("bargeDock",x,z,4);},
      recycler(){const p=spot(14,10,80);if(!p)return;const [x,z]=p;add(T.box,x,0,z,18,7,12,0,"#a9b0ba",0.2);add(T.gable,x,7,z,18.4,2.2,12.6,0,"#6f7a88",0.05);
        for(let i=0;i<6;i++)for(let l=0;l<3;l++)add(T.box,x-8+i*2.2,l*1.1,z+9.5,2,1.05,1.8,0,pick(["#b07a43","#a7784a","#8f6a45"]),0.1);
        add(T.box,x,7.4,z-6.3,10,1.4,0.2,0,"#2a5aa8",0);claim(x,z,14,10,0);note("recycler",x,z,10);},
      chipPile(){const p=spot(10,10,60);if(!p)return;const [x,z]=p;add(T.cone6,x,0,z,9,7,9,RNG()*6,"#c9a46c",0.3);add(T.cone6,x+8,0,z+3,6,4.5,6,RNG()*6,"#b98f5a",0.3);
        for(let k=0;k<5;k++)add(T.cyl6,x-12,0.4+(k%2)*0.7,z-6+k*0.75,0.35,7,0.35,0,"#8a6a4a",0.1,undefined,0,Math.PI/2);claim(x,z,12,8,0);note("chipPile",x,z,8);},
      farm(){const p=spot(16,40,170);if(!p)return;const [x,z]=p,ry=RNG()<0.5?0:Math.PI/2;house(x,z,ry,12,8,6,"#a8322c","#5a3a2e");house(x+(ry?10:0),z+(ry?0:12),ry,8,7,4.5,"#f1ede4","#4a4f58");
        silo(x-10,z-6,2.4,12,"#c9ced6");silo(x-15,z-6,2.4,10,"#c9ced6");claim(x,z,18,15,0);if(!UTIL.farm)note("farm",x,z,15);
        // fields: striped crop rows
        const fx=x+rr(30,50)*(RNG()<0.5?-1:1),fz=z+rr(-20,20),fw=rr(40,70),fd=rr(30,50),c1=pick(["#a6c46a","#c9c06a","#8fb85c","#d6c27a"]);
        if(place(fx,fz,Math.min(fw,fd)/2)){for(let k=0;k<fd;k+=4)add(T.quad,fx,0.02,fz-fd/2+k+1,fw,1,2,0,k%8?c1:"#9a8a5a",0);kMark(fx-fw/2,fx+fw/2,fz-fd/2,fz+fd/2,3);
          for(let k=0;k<6;k++){const bx=fx+rr(-fw/2+3,fw/2-3),bz=fz+rr(-fd/2+3,fd/2-3);add(T.cyl10,bx,0.75,bz,0.75,1.5,0.75,0,"#d6b65a",0.1,undefined,Math.PI/2);}}},
      shack(){let p=null;for(let t=0;t<200&&!p;t++){const x=rr(-300,300),z=rr(-90,-80);if(place(x,z,5,true))p=[x,z];}if(!p)return;const [x,z]=p;
        [[-2,-2],[2,-2],[-2,2],[2,2]].forEach(([a,b])=>add(T.cyl6,x+a,0,z+b,0.2,1.8,0.2,0,"#5c4632",0));add(T.box,x,1.8,z,5,2.6,5,RNG(),"#7d6a52",0.15);add(T.gable,x,4.4,z,5.6,1.6,5.6,0,"#4f5560",0);
        add(T.box,x,1.6,z+5,1.4,0.15,6,0,"#7b5d42",0);claim(x,z,5,7,0);if(!UTIL.shack)note("shack",x,z,7);}};
    /* ---------- features: a few per visit from each environment's pool, so the land is never the same twice ---------- */
    const FEAT={
      // a lake with a boathouse, reeds round the edge
      lake(){let p=null;for(let t=0;t<120&&!p;t++){const q=spot(34,30,170);if(q)p=q;}if(!p)return;const [x,z]=p,r=rr(22,32),pts=[],n=11;
        for(let k=0;k<n;k++){const a=k/n*6.283,rk=r*rr(0.7,1.1);pts.push([x+Math.cos(a)*rk,z+Math.sin(a)*rk*0.75]);}poly(pts,0.03,ENVK==="swamp"?"#4f736d":"#7fb0cf");kMark(x-r,x+r,z-r*0.75,z+r*0.75,2);
        for(let k=0;k<14;k++){const a=rr(0,6.28),d=r*rr(0.98,1.12),rx=x+Math.cos(a)*d,rz=z+Math.sin(a)*d*0.75;if(!place(rx,rz,0.7,true))continue;for(let q=0;q<3;q++)add(T.cone4,rx+rr(-0.5,0.5),0,rz+rr(-0.4,0.4),0.12,rr(1.2,2),0.12,RNG(),"#7f8f4f",0.2);claim(rx,rz,0.6,2,0);}
        const bx=x+r*1.02,bz=z;if(place(bx,bz,4,true)){add(T.box,bx,0.3,bz,5,3,4,0,"#8a6a4a",0.15);add(T.gable,bx,3.3,bz,5.4,1.6,4.6,0,"#4a4f58",0);add(T.box,bx-4,0.25,bz,4,0.2,1.4,0,"#7b5d42",0);claim(bx,bz,4,5,0);}
        for(let k=0;k<8;k++){const a=rr(0,6.28),d=r*rr(1.1,1.4);broadleaf(x+Math.cos(a)*d,z+Math.sin(a)*d*0.75,rr(0.8,1.3),true);}note("lake",x,z,1);},
      // a village: a dozen houses round a green with a church
      village(){let p=null;for(let t=0;t<120&&!p;t++){const q=spot(40,40,190);if(q)p=q;}if(!p)return;const [x,z]=p,ry=RNG()<0.5?0:Math.PI/2;
        add(T.quad,x,0.025,z,70,1,6,ry,ROADC,0);for(let k=0;k<12;k++){const side=k%2?1:-1,hx=x+(k-6)*5.8+rr(-1,1),hz=z+side*(7+rr(0,3)),rx=ry?x+side*(7+rr(0,3)):hx,rz=ry?z+(k-6)*5.8:hz;
          if(!place(rx,rz,3.6))continue;house(rx,rz,ry+(RNG()<0.5?0:Math.PI/2),rr(6,8.5),rr(5,7),rr(3,4.2),pick(["#f1ede4","#e2d2c2","#d9c8a8","#c9d2d6","#b9c4b0"]),pick(["#7a4a3a","#4a4f58","#5a5f69"]));claim(rx,rz,4,6,0);
          if(RNG()<0.5)broadleaf(rx+rr(-5,5),rz+rr(-5,5),rr(0.6,0.9),true);}
        const cx=x+(ry?16:0),cz=z+(ry?0:16);if(place(cx,cz,7)){add(T.box,cx,0,cz,9,6,14,ry,"#e9e4da",0.15);add(T.gable,cx,6,cz,14.4,3.4,9.4,ry+Math.PI/2,"#4a4f58",0);add(T.box,cx+(ry?0:-4),0,cz+(ry?-4:0),3.2,13,3.2,0,"#e9e4da",0.1);add(T.cone4,cx+(ry?0:-4),13,cz+(ry?-4:0),2.6,5,2.6,Math.PI/4,"#4a4f58",0);claim(cx,cz,8,18,0);}
        note("village",x,z,8);},
      // logging camp: log decks, a loader shed and a skidder trail
      logging(){const p=spot(16,10,120);if(!p)return;const [x,z]=p;for(let d=0;d<3;d++)for(let l=0;l<4;l++)for(let k=0;k<5-l;k++)add(T.cyl6,x-8+d*7,0.35+l*0.62,z-4+k*0.75+l*0.37,0.36,9,0.36,0,pick(["#8a6a4a","#7a5a3c","#9a7350"]),0.1,undefined,0,Math.PI/2);
        add(T.box,x+8,0,z+6,8,4,6,0,"#8a8f98",0.2);add(T.gable,x+8,4,z+6,8.4,1.6,6.6,0,"#5b6270",0);add(T.quad,x,0.02,z+12,34,1,4,0,"#9a8a6a",0);claim(x,z,16,6,0);note("logging",x,z,6);},
      // three wind turbines on the skyline (merged, so the blades stand still)
      turbines(){const a0=rr(0,6.28);for(let k=0;k<3;k++){const a=a0+k*0.25,d=rr(200,330),x=Math.cos(a)*d,z=Math.sin(a)*d*0.85;if(!place(x,z,6))continue;
          add(T.cyl10,x,0,z,1.6,42,1.6,0,"#eef0f2",0.1);add(T.box,x,41,z,4,2.4,2.2,0,"#eef0f2",0.05);for(let b=0;b<3;b++)add(T.box,x+1.8,42,z,0.5,19,1.2,0,"#eef0f2",0,undefined,b*2.094+0.3,0);claim(x,z,3,62,0);if(!UTIL.turbines)note("turbines",x,z,62);}},
      // an orchard: a grid of small round trees
      orchard(){const p=spot(26,20,150);if(!p)return;const [x,z]=p;for(let i=0;i<9;i++)for(let j=0;j<6;j++){const tx=x-20+i*5,tz=z-12.5+j*5;if(!place(tx,tz,1.2))continue;add(T.tri3,tx,0,tz,0.2,1.3,0.2,0,"#7a5a3c",0.1);add(T.ico,tx,2,tz,1.5,1.3,1.5,RNG()*6,pick(["#6fa76b","#7cb072","#8ab879"]),0.3);claim(tx,tz,1.3,3.3,0.2);}note("orchard",x,z,3);},
      // a city park: lawn, winding path, a pond and benches
      park(){const p=spot(30,14,120);if(!p)return;const [x,z]=p;add(T.quad,x,0.022,z,56,1,42,0,"#9fc27a",0);kMark(x-28,x+28,z-21,z+21,3);const pts=[];for(let k=0;k<8;k++){const a=k/8*6.283;pts.push([x+Math.cos(a)*rr(6,9),z+Math.sin(a)*rr(5,7)]);}poly(pts,0.03,"#7fb0cf");
        for(let k=0;k<7;k++){const a=k/7*6.283;add(T.quad,x+Math.cos(a)*17,0.026,z+Math.sin(a)*13,9,1,1.6,-a+Math.PI/2,"#d9cfb8",0);}
        for(let k=0;k<16;k++){const a=rr(0,6.28),d=rr(11,24);const tx=x+Math.cos(a)*d,tz=z+Math.sin(a)*d*0.75;add(T.tri3,tx,0,tz,0.25,2.4,0.25,0,"#7a5a3c",0.1);add(T.ico,tx,3.4,tz,2,1.7,2,RNG()*6,pick(["#6fa76b","#5f9a63","#7cb072"]),0.3);hMark(tx,tz,2,6);}
        hMark(x,z,30,6);note("park",x,z,6);},
      // a stadium bowl
      stadium(){let p=null;for(let t=0;t<80&&!p;t++){const q=spot(42,40,200);if(q)p=q;}if(!p)return;const [x,z]=p;add(T.cyl10,x,0,z,46,14,34,0,"#c9c4ba",0.25);add(T.cyl10,x,14,z,48,1.2,36,0,"#5b6270",0);add(T.cyl10,x,0.2,z,38,14.2,26,0,"#6fa76b",0);
        kMark(x-48,x+48,z-36,z+36,3);hMark(x,z,48,16);note("stadium",x,z,16);},
      // a rail yard beside the line: sidings and boxcars
      railyard(){const x=rr(-330,-200),z=-29;for(let k=0;k<3;k++){const zz=z-4-k*4;[zz-0.7,zz+0.7].forEach(zr=>add(T.box,x,0.14,zr,80,0.16,0.12,0,"#8d939c",0,"w"));for(let c=0;c<4;c++){if(RNG()<0.35)continue;add(T.box,x-30+c*18+k*5,0.9,zz,12,3.3,2.8,0,pick(["#9b3d2a","#3d5f8c","#5b6270","#7a4a3a"]),0.2,"w");}}
        kMark(x-42,x+42,z-18,z-2,3);hMark(x,z-9,42,5);note("railyard",x,z-8,5);},
      // a gas station on the highway
      gas(){const z=rr(40,110)*(RNG()<0.5?-1:1)+(RNG()<0.5?0:-150),x=HXr+12;if(!place(x+6,z,10))return;add(T.quad,x+6,0.024,z,16,1,22,0,"#9a9ea6",0);add(T.box,x+10,0,z-6,8,4,6,0,"#e9e4da",0.15);
        [[x+4,z-3],[x+4,z+3]].forEach(([a,b])=>{add(T.box,a,0,b,0.5,3.6,0.5,0,"#8d939c",0);add(T.box,a,0,b,1,1.6,0.6,0,"#d6382c",0.1);});add(T.box,x+4,3.6,z,8,0.5,10,0,"#f2c230",0.05);
        add(T.box,x+13,0,z+6,0.4,7,0.4,0,"#6b7079",0);add(T.box,x+13,7,z+6,3,1.6,0.3,0,"#d6382c",0);claim(x+6,z,10,8,0);note("gas",x+6,z,8);},
      // an airstrip with a hangar and windsock
      airstrip(){let p=null;for(let t=0;t<80&&!p;t++){const q=spot(70,40,200);if(q)p=q;}if(!p)return;const [x,z]=p,ry=rr(0,3.14);add(T.quad,x,0.024,z,170,1,14,ry,"#9a9ea6",0);for(let k=-7;k<=7;k++)add(T.quad,x+Math.cos(ry)*k*11,0.03,z-Math.sin(ry)*k*11,5,1,0.6,ry,"#f2f2f2",0);
        const hx=x+Math.sin(ry)*16,hz=z+Math.cos(ry)*16;add(T.box,hx,0,hz,14,6,12,ry,"#c9c4ba",0.2);add(T.gable,hx,6,hz,14.4,3,12.6,ry,"#8d939c",0);add(T.box,hx+Math.sin(ry)*10,0,hz+Math.cos(ry)*10,0.2,5,0.2,0,"#8d939c",0);add(T.cone4,hx+Math.sin(ry)*10,5,hz+Math.cos(ry)*10,0.6,2.4,0.6,0,"#f27a30",0,undefined,0,-1.3);
        kMark(x-90,x+90,z-90,z+90,3);hMark(x,z,90,9);note("airstrip",x,z,9);},
      // an open-pit mine: terraced pit, headframe, tailings
      mine(){let p=null;for(let t=0;t<80&&!p;t++){const q=spot(40,60,220);if(q)p=q;}if(!p)return;const [x,z]=p;["#c98b5a","#b9774a","#a56a42"].forEach((c,i)=>add(T.cyl10,x,-1-i*3,z,36-i*9,3,30-i*8,0,c,0.2));
        add(T.cone4,x+30,0,z-10,4,16,4,0,"#5b6270",0.15);add(T.box,x+30,15,z-10,6,2,3,0,"#5b6270",0);add(T.cone6,x+34,0,z+20,16,9,16,RNG()*6,"#d9b589",0.3);add(T.box,x+14,0,z-22,12,5,8,0,"#a9b0ba",0.2);kMark(x-40,x+40,z-30,z+30,3);hMark(x,z,42,18);note("mine",x,z,18);},
      // an oasis: palms round a pool
      oasis(){const p=spot(16,20,160);if(!p)return;const [x,z]=p,pts=[];for(let k=0;k<9;k++){const a=k/9*6.283,rk=rr(6,10);pts.push([x+Math.cos(a)*rk,z+Math.sin(a)*rk*0.8]);}poly(pts,0.03,"#5fa8bd");kMark(x-10,x+10,z-8,z+8,2);
        for(let k=0;k<10;k++){const a=rr(0,6.28),d=rr(9,15),tx=x+Math.cos(a)*d,tz=z+Math.sin(a)*d*0.8,s=rr(0.8,1.2);if(!place(tx,tz,1.2,true))continue;add(T.cyl6,tx,0,tz,0.25*s,6*s,0.25*s,0,"#8a6a4a",0.15);for(let f=0;f<6;f++)add(T.box,tx+Math.cos(f*1.05)*1.6*s,6*s,tz+Math.sin(f*1.05)*1.6*s,3.2*s,0.12,0.7*s,-f*1.05,"#5f8a4e",0.1,undefined,0,-0.5);claim(tx,tz,1.2,7*s,0.3);}
        note("oasis",x,z,7);},
      // a ranch: house, barn, corrals, a water trough
      ranch(){const p=spot(18,30,160);if(!p)return;const [x,z]=p;house(x,z,0,10,8,4,"#d9c8a8","#7a4a3a");add(T.box,x+14,0,z+2,10,6,8,0,"#a8322c",0.15);add(T.gable,x+14,6,z+2,10.4,2.6,8.6,0,"#5a3a2e",0);
        for(let k=0;k<12;k++){const a=k/12*6.283;add(T.box,x-14+Math.cos(a)*9,0,z+Math.sin(a)*7,0.2,1.3,0.2,0,"#8a6a4a",0);}add(T.cyl6,x-14,1.3,z,9,0.08,7,0,"#8a6a4a",0);claim(x,z,24,8,0);note("ranch",x,z,8);},
      // a fishing camp on the bank: dock, two skiffs, a cabin on stilts
      fishcamp(){const x=rr(-120,120)+(RNG()<0.5?0:-200),z=-58;if(!place(x,z+6,6,true))return;add(T.box,x,0.6,z+3,3,0.3,8,0,"#7b5d42",0.1);for(let k=-3;k<=3;k+=2)add(T.cyl6,x,-0.5,z+k,0.2,1.3,0.2,0,"#5c4632",0);
        [[x-3,z-1],[x+3,z-2]].forEach(([a,b])=>{add(T.box,a,0.1,b,1.4,0.5,4,0.2,pick(["#e9e4da","#5b8de4","#e46b5b"]),0.2);});[[-2,-2],[2,-2],[-2,2],[2,2]].forEach(([a,b])=>add(T.cyl6,x+a,0,z+8+b,0.2,2,0.2,0,"#5c4632",0));add(T.box,x,2,z+8,5,2.6,5,0,"#8a7a62",0.15);add(T.gable,x,4.6,z+8,5.6,1.6,5.6,0,"#4f5560",0);
        claim(x,z+8,4,7,0);note("fishcamp",x,z,7);},
      // a boardwalk out over the marsh to a lookout
      boardwalk(){const p=spot(6,30,160);if(!p)return;const [x,z]=p,ry=rr(0,3.14);for(let k=0;k<12;k++){const px=x+Math.cos(ry)*k*4,pz=z-Math.sin(ry)*k*4;add(T.box,px,0.8,pz,4.2,0.14,1.6,ry,"#7b5d42",0.1);[-0.7,0.7].forEach(s2=>add(T.cyl6,px+Math.sin(ry)*s2,0,pz+Math.cos(ry)*s2,0.1,0.8,0.1,0,"#5c4632",0));}
        const ex=x+Math.cos(ry)*48,ez=z-Math.sin(ry)*48;add(T.box,ex,0.8,ez,5,0.14,5,ry,"#7b5d42",0.1);[[-2,-2],[2,-2],[-2,2],[2,2]].forEach(([a,b])=>add(T.cyl6,ex+a,0,ez+b,0.15,3.6,0.15,0,"#5c4632",0));add(T.gable,ex,3.6,ez,5.6,1.4,5.6,ry,"#4f5560",0);note("boardwalk",ex,ez,5);},
      // a sugar cane field
      cane(){const p=spot(28,20,170);if(!p)return;const [x,z]=p,w=rr(40,60),d=rr(30,46);for(let k=0;k<d;k+=2.5)add(T.quad,x,0.02,z-d/2+k+1,w,1,1.6,0,k%5?"#8fb85c":"#6f9a45",0);kMark(x-w/2,x+w/2,z-d/2,z+d/2,3);
        for(let k=0;k<40;k++){const bx=x+rr(-w/2+2,w/2-2),bz=z+rr(-d/2+2,d/2-2);add(T.cone4,bx,0,bz,0.6,rr(2.2,3.2),0.6,RNG(),"#9fc27a",0.25);}hMark(x,z,Math.max(w,d)/2,3);note("cane",x,z,3);},
      // a lattice radio mast with its guy lines
      mast(){const p=spot(5,20,160);if(!p)return;const [x,z]=p,h=rr(40,60);add(T.cone4,x,0,z,1.4,h,1.4,0.78,"#d6382c",0.1);add(T.box,x,h,z,0.3,4,0.3,0,"#f2f2f2",0);for(let k=0;k<3;k++){const a=k*2.094;add(T.cyl6,x+Math.cos(a)*14,0,z+Math.sin(a)*14,0.08,0.9,0.08,0,"#8d939c",0);}claim(x,z,2,h+4,0);note("mast",x,z,h+4);}};
    const POOL={rural:["lake","village","logging","turbines","orchard","mast"],urban:["park","stadium","railyard","gas","mast","village"],desert:["airstrip","mine","oasis","ranch","turbines","mast"],swamp:["fishcamp","boardwalk","cane","lake","mast","village"]};
    function features(){const pool=POOL[ENVK].slice(),n=2+Math.floor(RNG()*2);for(let k=0;k<n&&pool.length;k++){const f=pool.splice(Math.floor(RNG()*pool.length),1)[0];try{FEAT[f]();}catch(e){diag("scenery feature "+f+" failed: "+e.message);}}}
    /* ---------- environment kits ---------- */
    // scatter helper: n tries over a box, kept where the noise mask passes; fn(x,z) places one thing
    function scatter(n,x0,x1,z0,z1,mask,fn){let k=0;n=Math.round(n*DEN);for(let t=0;t<n;t++){const x=rr(x0,x1),z=rr(z0,z1);if(mask&&!mask(x,z))continue;if(fn(x,z))k++;}return k;}
    const farOK=(x,z)=>Math.hypot(x+5,z-5)<330&&!inside(x,z,-4);
    if(ENVK==="rural"){
      UT.pylons([F.x1+40,-50],[F.x1+260,-300]);features();const sub=UT.substation(2);if(sub)UT.pylons(sub,[sub[0]*3.2,sub[1]*3.2]);
      UT.chipPile();UT.farm();if(RNG()<0.7)UT.farm();
      // forest belts: dense where the noise is high, conifers on the far hills
      scatter(3400,-410,410,-310,310,(x,z)=>farOK(x,z)&&noise(x,z)>0.44+0.25*Math.max(0,1-Math.hypot(x+5,z-5)/160),(x,z)=>{const d=Math.hypot(x,z),far=d>170;return RNG()<(d>150?0.55:0.3)?conifer(x,z,rr(0.85,1.3)):broadleaf(x,z,rr(0.8,1.4),far);});
      scatter(320,F.x0,F.x1,F.z0,F.z1,null,(x,z)=>broadleaf(x,z,rr(0.75,1.3),false));
      scatter(80,-410,410,-310,310,farOK,(x,z)=>bush(x,z,rr(0.8,1.4)));
      // far hills
      for(let k=0;k<7;k++){const a=rr(0,6.28),d=rr(330,400),x=Math.cos(a)*d,z=Math.sin(a)*d*0.8;if(!place(x,z,12))continue;add(T.mound,x,-3,z,rr(60,100),rr(9,18),rr(45,75),RNG()*6,pick(["#8fb27c","#86ab76","#94b683"]),0.25);}}
    if(ENVK==="urban"){
      UT.waterTower();UT.substation(3);UT.recycler();features();
      // city blocks across the highway, beyond the east road, across the river and south of the mill
      const blocks=[[-410,HXr-12,-310,310],[EX+10,410,-310,310],[HXr+12,EX-10,-310,-85],[HXr+12,EX-10,F.z1+16,310]];
      blocks.forEach(([x0,x1,z0,z1])=>{const bw=rr(34,42);for(let bx=x0+6;bx<x1-10;bx+=bw+10)for(let bz=z0+6;bz<z1-10;bz+=bw+8){
        const dmill=Math.hypot(bx+5,bz-5),downtown=dmill>230&&(noise(bx,bz,140)>0.45||dmill>300);
        // streets between blocks
        if(bz+bw+8<z1-10&&RNG()<0.9){const zz=bz+bw+4;if(place(bx+bw/2,zz,2))add(T.quad,bx+bw/2,0.025,zz,bw+10,1,6,0,ROADC,0);}
        const lots=downtown?1+Math.floor(RNG()*2):3+Math.floor(RNG()*2);
        for(let l=0;l<lots;l++){const lw=bw/(downtown?1:2)-4,lx=bx+(downtown?bw/2:(l%2?bw*0.75:bw*0.25)),lz=bz+(downtown?(l?bw*0.75:bw*0.3):(l<2?bw*0.25:bw*0.75)),r=lw/2;
          if(!place(lx,lz,r))continue;
          if(downtown){const h=rr(12,dmill>300?52:30),w=rr(lw*0.6,lw),d=rr(lw*0.6,lw);building(lx,lz,w,d,h,0,pick(["#c9c4ba","#b9bfc8","#d6cfc0","#a9b4c2","#c7b39b"]),pick(["#5b6270","#6d6a63","#4a4f58"]));claim(lx,lz,r,h+1,0);}
          else if(RNG()<0.6){house(lx,lz,RNG()<0.5?0:Math.PI/2,rr(7,10),rr(6,8),rr(3,5),pick(["#e9e4da","#d8c8b0","#c9d2d6","#e2d2c2","#b9c4b0"]),pick(["#7a4a3a","#5a5f69","#6d5a4a"]));
            if(RNG()<0.7)broadleaf(lx+rr(-r,r),lz+rr(-r,r),rr(0.6,0.9),true);claim(lx,lz,r,6,0);}
          else if(RNG()<0.75){building(lx,lz,rr(lw*0.7,lw),rr(lw*0.7,lw),rr(5,9),0,pick(["#b8bcc4","#c9c4ba","#a7aeb8"]),"#6d737c");claim(lx,lz,r,10,0);}
          else{add(T.quad,lx,0.024,lz,lw,1,lw,0,"#9a9ea6",0);for(let q=0;q<4;q++)add(T.box,lx-lw/3+q*lw/4.5,0,lz+rr(-lw/3,lw/3),2.4,2.6,6,0,pick(["#d6382c","#2a5aa8","#f2c230","#5b6270"]),0.15);claim(lx,lz,r,3,0);}}}});
      // street trees and a billboard by the highway
      scatter(260,-410,410,-310,310,farOK,(x,z)=>noise(x,z,40)>0.6&&broadleaf(x,z,rr(0.6,0.95),true));
      scatter(40,F.x0,F.x1,F.z0,F.z1,null,(x,z)=>broadleaf(x,z,rr(0.6,1),false));
      {const z=rr(30,70),x=HXr+10;if(place(x,z,4)){add(T.box,x,0,z,0.4,7,0.4,0,"#6b7079",0);add(T.box,x,7,z,0.4,3.2,8,0,"#f2c230",0.1);claim(x,z,4,11,0);}}}
    if(ENVK==="desert"){
      UT.solarFarm();UT.waterTanks();UT.windpump();features();const sub=UT.substation(2);if(sub)UT.pylons(sub,[sub[0]*3.2,sub[1]*3.2]);
      // mesas and buttes on the skyline: stacked prisms in sandstone bands
      for(let k=0;k<12;k++){const a=rr(0,6.28),d=rr(230,400),x=Math.cos(a)*d,z=Math.sin(a)*d*0.85;if(!place(x,z,25))continue;const w=rr(30,80),dd=rr(25,60),h=rr(18,42),ry=RNG()*6;
        add(T.box,x,0,z,w*1.12,h*0.18,dd*1.12,ry,"#d9a06b",0.15);add(T.box,x,h*0.18,z,w,h*0.62,dd,ry,"#c98b5a",0.25);add(T.box,x,h*0.8,z,w*0.97,h*0.2,dd*0.97,ry,"#b9774a",0.1);claim(x,z,Math.max(w,dd)/2,h,0);}
      scatter(500,-410,410,-310,310,farOK,(x,z)=>{const r=RNG();if(r<0.4){const s=rr(0.7,1.3);if(!place(x,z,0.8))return false;
          add(T.cyl6,x,0,z,0.35*s,5*s,0.35*s,0,"#5f8a4e",0.2);if(RNG()<0.8){add(T.cyl6,x+0.6*s,1.8*s,z,0.25*s,0.7*s,0.25*s,0,"#5f8a4e",0.1,undefined,0,-1.2);add(T.cyl6,x+1.0*s,2.3*s,z,0.25*s,1.8*s,0.25*s,0,"#5f8a4e",0.1);}
          if(RNG()<0.5){add(T.cyl6,x-0.6*s,1.4*s,z,0.25*s,0.7*s,0.25*s,0,"#5f8a4e",0.1,undefined,0,1.2);add(T.cyl6,x-1.0*s,1.9*s,z,0.25*s,1.5*s,0.25*s,0,"#5f8a4e",0.1);}claim(x,z,1.1*s,5*s,0.35);return true;}
        if(r<0.75)return bush(x,z,rr(0.6,1.2),pick(["#8a9a5b","#9aa36a","#7d8a55"]));return rock(x,z,rr(0.8,2.6),pick(["#c98b5a","#b9774a","#a99a86"]));});
      scatter(50,F.x0,F.x1,F.z0,F.z1,null,(x,z)=>bush(x,z,rr(0.6,1),pick(["#8a9a5b","#9aa36a"])));
      for(let k=0;k<14;k++){const a=rr(0,6.28),d=rr(140,330),x=Math.cos(a)*d,z=Math.sin(a)*d;if(place(x,z,20))add(T.mound,x,-0.6,z,rr(20,45),rr(3,7),rr(10,22),RNG()*6,"#e8d6aa",0.25);}}
    if(ENVK==="swamp"){
      UT.bargeDock();UT.shack();UT.shack();features();const sub=UT.substation(2);if(sub)UT.pylons(sub,[sub[0]*3.2,sub[1]*3.2]);
      // ponds and sloughs: irregular water patches with cypress and reeds round the edges
      const ponds=[];for(let t=0;t<220&&ponds.length<26;t++){const x=rr(-400,400),z=rr(-300,300),r=rr(8,26);if(!farOK(x,z)||!place(x,z,r+2))continue;
        const pts=[],n=9;for(let k=0;k<n;k++){const a=k/n*6.283,rk=r*rr(0.65,1.15);pts.push([x+Math.cos(a)*rk,z+Math.sin(a)*rk*0.8]);}
        poly(pts,0.035,pick(["#4f736d","#557a70","#4a6c66"]));kMark(x-r,x+r,z-r*0.8,z+r*0.8,2);ponds.push([x,z,r]);}
      const cypress=(x,z,s,wet)=>{if(!place(x,z,1.6*s,wet))return false;add(T.cone6,x,0,z,0.9*s,1.6*s,0.9*s,RNG()*6,"#6b5440",0.1);add(T.cyl6,x,0,z,0.3*s,6.5*s,0.3*s,0,"#7a6248",0.1);
        add(T.ico,x,6.8*s,z,2.6*s,0.9*s,2.6*s,RNG()*6,pick(["#5f7d4a","#6c8a52","#57714a","#7a8f5a"]),0.3);if(RNG()<0.5)add(T.cone4,x+0.8*s,4.8*s,z,0.4*s,1.6*s,0.4*s,0,"#8a9a7a",0,undefined,Math.PI,0);
        claim(x,z,1.6*s,8*s,0.3*s);return true;};
      ponds.forEach(([x,z,r])=>{for(let k=0;k<8;k++){const a=rr(0,6.28),d=r*rr(0.5,1.2);cypress(x+Math.cos(a)*d,z+Math.sin(a)*d*0.8,rr(0.8,1.3),true);}
        for(let k=0;k<10;k++){const a=rr(0,6.28),d=r*rr(0.85,1.15),rx=x+Math.cos(a)*d,rz=z+Math.sin(a)*d*0.8;if(!place(rx,rz,0.7,true))continue;
          for(let q=0;q<3;q++)add(T.cone4,rx+rr(-0.5,0.5),0,rz+rr(-0.5,0.5),0.12,rr(1.2,2.0),0.12,RNG(),pick(["#7f8f4f","#8f9a5a","#6f7f45"]),0.2);claim(rx,rz,0.6,2,0);}});
      // alligator basking at one pond
      if(ponds.length){const [x,z,r]=ponds[0],gx=x+r*0.7,gz=z;add(T.box,gx,0,gz,3.2,0.35,0.8,0.4,"#3f4a32",0.2);add(T.box,gx+1.9*Math.cos(0.4),0,gz-1.9*Math.sin(0.4),1.2,0.25,0.5,0.4,"#3f4a32",0.2);}
      scatter(900,-410,410,-310,310,farOK,(x,z)=>{const r=RNG();if(r<0.45)return cypress(x,z,rr(0.8,1.3),false);if(r<0.7){if(!place(x,z,0.6))return false;add(T.cyl6,x,0,z,0.25,rr(4,7),0.25,0,"#8a7f6a",0.1);add(T.box,x,rr(2.5,4),z,1.8,0.15,0.15,RNG()*3,"#8a7f6a",0);claim(x,z,0.8,6,0.25);return true;}
        if(r<0.85)return broadleaf(x,z,rr(0.8,1.2),Math.hypot(x,z)>170);return bush(x,z,rr(0.8,1.4),pick(["#6c8a52","#5f7d4a"]));});
      scatter(70,F.x0,F.x1,F.z0,F.z1,null,(x,z)=>RNG()<0.6?cypress(x,z,rr(0.7,1.1),false):bush(x,z,rr(0.7,1.1)));
      // reeds along the bayou banks
      for(let k=0;k<160;k++){const x=rr(-400,400),z=RNG()<0.5?rr(-58,-55.5):rr(-77.5,-75);if(!place(x,z,0.5,true))continue;for(let q=0;q<3;q++)add(T.cone4,x+rr(-0.5,0.5),0,z+rr(-0.4,0.4),0.12,rr(1.2,2.2),0.12,RNG(),pick(["#7f8f4f","#8f9a5a"]),0.2);claim(x,z,0.5,2,0);}}
    /* ---------- build the merged meshes ---------- */
    const smat=new StdMat({vertexColors:true,roughness:0.9,flatShading:true});smat.color.set(0xffffff);
    let tris=0;const parts=[];
    for(const k in SEC){const S2=SEC[k];if(!S2.n)continue;const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(S2.p,3));g.setAttribute("color",new THREE.Float32BufferAttribute(S2.c,3));
      g.computeVertexNormals();g.computeBoundingSphere();const m=new THREE.Mesh(g,smat);m.castShadow=k==="near"||!!(G3.GFX&&G3.GFX.far);m.receiveShadow=k==="near";m.userData.scenery=k;m.userData.noNav=true;scene.add(m);parts.push(m);tris+=S2.n;}
    // for the clipping check (tools/clipcheck.py): is (x,z) inside a scenery footprint?
    G3.sceneryAt=(x,z)=>{const i=kIdx(x,z);return i>=0&&KO[i]===3;};
    G3.scenery={env:ENVK,seed:SITE.seed,layout:LAYOUT.i,parts,tris,util:UTIL,sectors:Object.fromEntries(Object.entries(SEC).map(([k,v])=>[k,v.n])),navBoxes:NB.length};
    diag(`scenery: ${ENVK} mill #${SITE.seed} (layout ${LAYOUT.i}): ${tris} triangles in ${parts.length} meshes`);}
