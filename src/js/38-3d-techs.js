  /* ---- maintenance techs: break room, yellow three-wheel scooters, repairs ---- */
  const SHOP={x0:50.5,x1:63,z0:-25,z1:-19.2,door:[56,-18.4]};
  slab(49,65,-27,-14.5,M.slab,0.03);box2(SHOP.x0,SHOP.x1,SHOP.z0,SHOP.z1,1.4);
  // (v6.11.2: the front wall has a real doorway at the door (it was solid, with the door drawn on it, so the techs walked through
  //  the wall to their benches): two wall runs and a header over a 1.6 m opening)
  {const dx0=SHOP.door[0]-0.85,dx1=SHOP.door[0]+0.85;ribWall(dx0-SHOP.x0,3.3,0.3,(SHOP.x0+dx0)/2,1.65,SHOP.z1);ribWall(SHOP.x1-dx1,3.3,0.3,(dx1+SHOP.x1)/2,1.65,SHOP.z1);ribWall(dx1-dx0,1.0,0.3,SHOP.door[0],2.8,SHOP.z1);}
  ribWall(SHOP.x1-SHOP.x0,3.3,0.3,(SHOP.x0+SHOP.x1)/2,1.65,SHOP.z0);
  ribWall(0.3,3.3,SHOP.z1-SHOP.z0,SHOP.x0,1.65,(SHOP.z0+SHOP.z1)/2);ribWall(0.3,3.3,SHOP.z1-SHOP.z0,SHOP.x1,1.65,(SHOP.z0+SHOP.z1)/2);
  {const rm=mat("brand",{transparent:true,roughness:0.55}),rg=new THREE.Group();scene.add(rg);
   const roof=new THREE.Mesh(new THREE.BoxGeometry(SHOP.x1-SHOP.x0+0.6,0.35,SHOP.z1-SHOP.z0+0.6),rm);roof.position.set((SHOP.x0+SHOP.x1)/2,3.45,(SHOP.z0+SHOP.z1)/2);roof.castShadow=true;rg.add(roof);
   rg.userData.mats=[rm];roofs.push(rg);
   {const d=box(0.12,2.3,1.0,M.ink,SHOP.door[0]-0.82,1.15,SHOP.z1-0.55,scene,false);d.userData.noNav=true;}   /* (v6.11.2: the door stands open against the inside wall) */{const W=SHOP.x1-SHOP.x0,H=2.95,wx=[51.6,53.4,58.4,60.1,61.8].map(v=>[v-SHOP.x0,1.05,1.3,0.95]);
     const fs=facade(W,H,wx,[SHOP.door[0]-SHOP.x0,2.22,4.6,0.62,"MAINTENANCE"],SHOP.door[0]-SHOP.x0);fs.position.set((SHOP.x0+SHOP.x1)/2,H/2,SHOP.z1+0.17);fs.userData.noNav=true;scene.add(fs);}}
  const SLOTS=[51.5,52.9,54.3,55.7,58.5,59.9,61.3,62.7].map(x=>[x,-16.6]);
  // shop floor: workbenches with pumps on them along the back wall, rebuild stands, parts racks, a break table
  const BENCH=[];
  {const wood=M.kraft;[52.1,54.9,57.7,60.5].forEach(x=>{box(2.3,0.12,1.0,wood,x,0.95,-24.2,scene,false);[-1,1].forEach(sx=>box(0.1,0.9,0.9,M.steel,x+sx*1.05,0.45,-24.2,scene,false));
      box(2.2,1.3,0.06,M.steel,x,2.0,-24.8,scene,false);for(let k=0;k<5;k++)box(0.07,0.32,0.05,k%2?M.bad:M.ink,x-0.8+k*0.4,2.0,-24.74,scene,false);
      const pm=pumpModel();pm.scale.setScalar(0.42);pm.position.set(x,1.01,-24.15);pm.rotation.y=0.3;BENCH.push({p:[x,-23.25],l:[x,-24.4]});});
    [[52.3,-20.6],[61.3,-20.6]].forEach(([x,z],k)=>{box(1.4,0.5,0.9,M.steel,x,0.25,z,scene);const pm=pumpModel();pm.scale.setScalar(0.5);pm.position.set(x,0.5,z);pm.rotation.y=k?Math.PI:0;
      BENCH.push({p:[x+(k?-1.25:1.25),z],l:[x,z]});BENCH.push({p:[x,z+0.95],l:[x,z]});});
    box(0.5,2.4,4.6,M.steel,50.95,1.2,-22.1,scene);for(let k=0;k<4;k++)box(0.48,0.06,4.5,M.ink,50.95,0.4+k*0.6,-22.1,scene,false);
    for(let k=0;k<6;k++)box(0.3,0.3,0.4,k%2?M.stock:M.warn,50.95,0.6+(k%3)*0.6,-23.8+k*0.7,scene,false);
    box(1.0,0.08,0.8,M.panel,58.4,0.78,-20.7,scene,false);box(0.12,0.74,0.12,M.steel,58.4,0.37,-20.7,scene,false);}
  const techM=mat("g-tech");
  function trike(){const g=new THREE.Group();
    box(1.3,0.42,0.7,M.fork,0,0.55,0,g);box(0.5,0.5,0.62,M.fork,-0.62,0.86,0,g);box(0.42,0.12,0.5,M.ink,-0.15,0.85,0,g,false);
    box(0.08,0.75,0.08,M.ink,0.62,0.95,0,g,false);box(0.08,0.08,0.75,M.ink,0.62,1.32,0,g,false);
    cylZ(0.3,0.16,M.ink,0.78,0.3,0,16,g);cylZ(0.3,0.16,M.ink,-0.55,0.3,-0.45,16,g);cylZ(0.3,0.16,M.ink,-0.55,0.3,0.45,16,g);
    box(0.04,1.4,0.04,M.ink,-0.82,1.5,0.25,g,false);const flag=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.26),new THREE.MeshBasicMaterial({color:lin(tok("fire")),side:THREE.DoubleSide}));flag.position.set(-0.6,2.08,0.25);g.add(flag);
    g.userData.trike=true;scene.add(g);return g;}
  const MAINT_SPOT={birdline:[40,-8],refclash:[58.2,-11],steamjoint:[11.2,3.4],fogfan:[50.2,-2.6],shaft:[12,16.4],fabric:[53.5,14.6],felt:[40.5,14.6],overflow:[-5,-10.5],chestover:[29.5,-9.6],hdblow:[24.2,-9.4],boiler:[68.6,-10],thkblow:[41.6,-10.4],lwplug:[11.2,-20.3],cscreen:[15.2,-20.6],fscreen:[19.2,-20.4],lcplug:[26.6,-20.7],winderdown:[-14.6,14.6],fleet:[-6.3,-14],roof:[-21.6,24],lightning:[40,-8],icedintake:[-30,-50]};
  function lane(p){return p[1]>2.4?"F":"C";}
  // v2.9.19: maintenance trikes path-find around buildings and equipment. A 0.5 m ground grid is built once from every
  // static mesh that reaches into the 0.25-1.9 m band (walls, tanks, skids, pumps, trees, posts), grown by 0.75 m for the
  // trike, then A* + line-of-sight smoothing. Falls back to the old two-lane route if no path is found.
  // v2.9.19/20: path-finding on 0.5 m ground grids built once from every static mesh that reaches into the 0.25-1.9 m band
  // (walls, tanks, skids, pumps, stairs, trees, posts). Trikes use a grid grown by 0.35 m, people one grown by 0.22 m.
  // A* + line-of-sight smoothing; anything that can't be routed falls back to the old behaviour.
  const NAV={x0:-62,z0:-52,cs:0.5,nx:300,nz:228,g:null,inf:0.35},NAVW={x0:-62,z0:-52,cs:0.5,nx:300,nz:228,g:null,inf:0.22};   // (t5: 9 m further south, for the walkway block, 03b A)
  function navBuild(G){const g=new Uint8Array(G.nx*G.nz),bb=new THREE.Box3(),INF=G.inf;scene.updateMatrixWorld(true);
    const navCb=o=>{if(!o.isMesh||o.isInstancedMesh||o.userData.smBatch||!o.geometry)return;
      for(let x=o;x&&x!==scene;x=x.parent){const u=x.userData||{};if(!x.visible&&x!==o)return;if(u.legs||u.wheels||u.load||u.cj||u.trike||u.stack||u.noNav)return;}   // (v6.11.2: no longer skips a roof group (u.mats): the machine hall's shell walls live in one, so walkers at a shift change cut through them; the roofs themselves are over 1.9 m and skipped below)
      if(!o.visible&&o.layers.mask===1)return;
      const gb=o.geometry.boundingBox||(o.geometry.computeBoundingBox(),o.geometry.boundingBox);const lm=G3.zLogMat?G3.zLogMat(o,_navM):o.matrixWorld;if(!lm)return;bb.copy(gb).applyMatrix4(lm);   // (v7.0: in logical coordinates, where the walkers walk)
      if(bb.min.y>1.9||bb.max.y<0.25)return;if((bb.max.x-bb.min.x)*(bb.max.z-bb.min.z)>900)return;
      const i0=Math.max(0,Math.floor((bb.min.x-INF-G.x0)/G.cs)),i1=Math.min(G.nx-1,Math.floor((bb.max.x+INF-G.x0)/G.cs)),
        j0=Math.max(0,Math.floor((bb.min.z-INF-G.z0)/G.cs)),j1=Math.min(G.nz-1,Math.floor((bb.max.z+INF-G.z0)/G.cs));
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)g[j*G.nx+i]=1;};
    scene.traverse(navCb);if(G3.SM&&G3.SM.holder)G3.SM.holder.traverse(navCb);   // (static things parked out of the scene graph (40) still block the way)
    // v4.1: scenery trunks and posts inside the yard (merged into one mesh, so not seen above)
    (G3.navBoxes||[]).forEach(([x0,x1,z0,z1])=>{if(G3.siteToLogical&&!LAYOUT6){const q=G3.siteToLogical((x0+x1)/2,(z0+z1)/2);if(!q)return;const dx=q[0]-(x0+x1)/2,dz=q[1]-(z0+z1)/2;x0+=dx;x1+=dx;
      if(zoneOf(q[0],q[1])==="S"){const f=(SBAND[1]-SBAND[0])/(SBAND[1]-SBAND[0]+WZ),h=(z1-z0)/2*f;z0=q[1]-h;z1=q[1]+h;}else{z0+=dz;z1+=dz;}}   // (t5: a trunk in the stretched strip is squeezed with it)   // (v7.0: scenery stands in the site: back to logical)
      const i0=Math.max(0,Math.floor((x0-INF-G.x0)/G.cs)),i1=Math.min(G.nx-1,Math.floor((x1+INF-G.x0)/G.cs)),
      j0=Math.max(0,Math.floor((z0-INF-G.z0)/G.cs)),j1=Math.min(G.nz-1,Math.floor((z1+INF-G.z0)/G.cs));for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)g[j*G.nx+i]=1;});
    // v7.0 t5: the blocks are drawn apart (03b ZONES), so a walker who stepped from one block's ground into the next in
    // logical coordinates would jump on screen. Where two neighbouring cells belong to blocks that don't meet in the site,
    // both are walled. The walkers cross between blocks instead where the site joins them: a portal links two free cells
    // of different blocks that are drawn on the same spot (navPortals), and the walker steps from one to the other.
    // And a cell is blocked when anything drawn in the site stands on its site spot, whichever block it belongs to (a
    // block drawn over another block's open ground: the walkers of one don't walk through the other's equipment).
    if(!LAYOUT6){const N=G.nx*G.nz,K=new Uint8Array(N),SX=new Float32Array(N),SZ=new Float32Array(N),KI={W:0,U:1,S:2,H:3,E:4,A:5},KS=["W","U","S","H","E","A"];
      for(let j=0;j<G.nz;j++)for(let i=0;i<G.nx;i++){const x=G.x0+(i+0.5)*G.cs,z=G.z0+(j+0.5)*G.cs,k=zoneOf(x,z),c=j*G.nx+i;K[c]=KI[k];SX[c]=siteX(k,x);SZ[c]=siteZ(k,z);}
      const joined=(a,b)=>a===b||(a===2&&(b===0||b===1))||(b===2&&(a===0||a===1));   // (blocks that can meet edge to edge: W, the strip and U)
      // two neighbouring cells join if they are drawn side by side: the same block, or W / the strip / U where the strip
      // meets them (across the strip a step north-south is drawn several metres long)
      const SSTEP=G.cs*(1+WZ/(SBAND[1]-SBAND[0]))*1.05,meet=(c,d,vert)=>K[c]===K[d]||(joined(K[c],K[d])&&Math.hypot(SX[c]-SX[d],SZ[c]-SZ[d])<=(vert?SSTEP:G.cs*1.6));
      const wall=new Uint8Array(N);
      for(let j=0;j<G.nz;j++)for(let i=0;i<G.nx;i++){const c=j*G.nx+i;if(i+1<G.nx&&!meet(c,c+1,false)){wall[c]=1;wall[c+1]=1;}if(j+1<G.nz&&!meet(c,c+G.nx,true)){wall[c]=1;wall[c+G.nx]=1;}}
      for(let c=0;c<N;c++)if(wall[c])g[c]=1;
      // the fog fan's patch (part of the hall block, standing in the west block's ground) is kept out of
      for(let j=Math.floor((-5.9-G.z0)/G.cs);j<=Math.floor((-3.0-G.z0)/G.cs);j++)for(let i=Math.floor((46.8-G.x0)/G.cs);i<=Math.floor((53.6-G.x0)/G.cs);i++)if(i>=0&&j>=0&&i<G.nx&&j<G.nz)g[j*G.nx+i]=1;
      // what's drawn, in site coordinates: a second grid over the whole site
      const SG={x0:FENCE7.x0-10,z0:FENCE7.z0-10,cs:G.cs},sb=new THREE.Box3();SG.nx=Math.ceil((FENCE7.x1+10-SG.x0)/SG.cs);SG.nz=Math.ceil((FENCE7.z1+10-SG.z0)/SG.cs);const sg=new Uint8Array(SG.nx*SG.nz);
      const siteCb=o=>{if(!o.isMesh||o.isInstancedMesh||o.userData.smBatch||!o.geometry)return;
        for(let x=o;x&&x!==scene;x=x.parent){const u=x.userData||{};if(!x.visible&&x!==o)return;if(u.legs||u.wheels||u.load||u.cj||u.trike||u.stack||u.noNav||u.zMove)return;}
        if(!o.visible&&o.layers.mask===1)return;const gb=o.geometry.boundingBox||(o.geometry.computeBoundingBox(),o.geometry.boundingBox);sb.copy(gb).applyMatrix4(o.matrixWorld);
        if(sb.min.y>1.9||sb.max.y<0.25)return;if((sb.max.x-sb.min.x)*(sb.max.z-sb.min.z)>900)return;
        const i0=Math.max(0,Math.floor((sb.min.x-INF-SG.x0)/SG.cs)),i1=Math.min(SG.nx-1,Math.floor((sb.max.x+INF-SG.x0)/SG.cs)),j0=Math.max(0,Math.floor((sb.min.z-INF-SG.z0)/SG.cs)),j1=Math.min(SG.nz-1,Math.floor((sb.max.z+INF-SG.z0)/SG.cs));
        for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)sg[j*SG.nx+i]=1;};
      scene.traverse(siteCb);if(G3.SM&&G3.SM.holder)G3.SM.holder.traverse(siteCb);
      const sCell=(x,z)=>{const i=Math.floor((x-SG.x0)/SG.cs),j=Math.floor((z-SG.z0)/SG.cs);return i>=0&&j>=0&&i<SG.nx&&j<SG.nz?j*SG.nx+i:-1;};
      for(let c=0;c<N;c++)if(!g[c]){const q=sCell(SX[c],SZ[c]);if(q>=0&&sg[q])g[c]=1;}
      // portals: a free cell, and a free cell of another block (one that doesn't join it) drawn on the same site spot
      const POFF=[[0,0],[0,1],[0,-1],[1,0],[-1,0],[0,1.5],[0,-1.5],[1.5,0],[-1.5,0],[0,2],[0,-2],[2,0],[-2,0]];
      const L=new Map();let nP=0;const link=(a,b)=>{let l=L.get(a);if(!l)L.set(a,l=[]);if(!l.includes(b)){l.push(b);nP++;}};
      // (cells near a seam try the small steps across it; elsewhere only the same spot, where two blocks are drawn over each other)
      const nearW=new Uint8Array(N);for(let j=0;j<G.nz;j++)for(let i=0;i<G.nx;i++){if(!wall[j*G.nx+i])continue;for(let dj=-6;dj<=6;dj++)for(let di=-6;di<=6;di++){const a=i+di,b=j+dj;if(a>=0&&b>=0&&a<G.nx&&b<G.nz)nearW[b*G.nx+a]=1;}}
      const P0=[[0,0]],BX=KS.map(()=>[1e9,-1e9,1e9,-1e9]);for(let c=0;c<N;c++){const b=BX[K[c]];if(SX[c]<b[0])b[0]=SX[c];if(SX[c]>b[1])b[1]=SX[c];if(SZ[c]<b[2])b[2]=SZ[c];if(SZ[c]>b[3])b[3]=SZ[c];}   // (each block's footprint in the site)
      for(let c=0;c<N;c++){if(g[c])continue;const k=K[c],OFF=nearW[c]?POFF:P0;
        for(let k2=0;k2<6;k2++){if(joined(k,k2))continue;const bx=BX[k2];if(SX[c]<bx[0]-2.5||SX[c]>bx[1]+2.5||SZ[c]<bx[2]-2.5||SZ[c]>bx[3]+2.5)continue;
          for(const [ox,oz] of OFF){const q=siteInv(KS[k2],SX[c]+ox,SZ[c]+oz);if(!q)continue;   // (on the same spot, or across the walled seam where two blocks only touch)
            const i=Math.floor((q[0]-G.x0)/G.cs),j=Math.floor((q[1]-G.z0)/G.cs);if(i<0||j<0||i>=G.nx||j>=G.nz)continue;const c2=j*G.nx+i;if(g[c2]||K[c2]!==k2)continue;
            if(Math.hypot(SX[c2]-SX[c],SZ[c2]-SZ[c])>2.3)continue;link(c,c2);link(c2,c);break;}}}
      G.L=L;G.SX=SX;G.SZ=SZ;G.nP=nP;}
    G.g=g;}
  const _navM=new THREE.Matrix4();
  const navC=(G,p)=>[clamp(Math.floor((p[0]-G.x0)/G.cs),0,G.nx-1),clamp(Math.floor((p[1]-G.z0)/G.cs),0,G.nz-1)];
  const navFree=(G,i,j)=>i>=0&&j>=0&&i<G.nx&&j<G.nz&&!G.g[j*G.nx+i];
  // (v7.0 t5: the nearest free cell of the same block as the spot asked for, where there is one: a cell across a seam is
  //  drawn somewhere else, and the last step from it to the spot would jump)
  function navNearest(G,c){if(navFree(G,c[0],c[1]))return c;const K=G.SX&&!LAYOUT6?zoneOf(G.x0+(c[0]+0.5)*G.cs,G.z0+(c[1]+0.5)*G.cs):null;let any=null;
    for(let r=1;r<16;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;if(!navFree(G,c[0]+di,c[1]+dj))continue;
      if(!K||zoneOf(G.x0+(c[0]+di+0.5)*G.cs,G.z0+(c[1]+dj+0.5)*G.cs)===K)return [c[0]+di,c[1]+dj];if(!any)any=[c[0]+di,c[1]+dj];}return any;}
  // v4.0.3: same samples and arithmetic as navC/navFree, without two array allocations per sample (route smoothing
  // calls this hundreds of times per route)
  function navLOS(G,a,b){const ax=a[0],az=a[1],bx=b[0],bz=b[1],d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/(G.cs*0.5)),nx=G.nx,nz=G.nz,g=G.g;
    for(let k=0;k<=n;k++){const i=clamp(Math.floor((ax+(bx-ax)*k/n-G.x0)/G.cs),0,nx-1),j=clamp(Math.floor((az+(bz-az)*k/n-G.z0)/G.cs),0,nz-1);
      if(!(i>=0&&j>=0&&i<nx&&j<nz&&!g[j*nx+i]))return false;}return true;}
  // v4.0.3: same A* as before (same costs, heuristic and heap order, so the same routes), without per-call garbage:
  // the per-cell arrays are kept between calls and reset lazily with a generation stamp instead of 63k-cell fills,
  // and the open list is a binary heap in two typed arrays instead of an array of [f, i] pairs
  // v4.0.4: resumable: navSearch() sets up the search and step(deadline) runs it until done or until performance.now()
  // passes the deadline, so a long route can be spread over several frames. A search owns its scratch arrays (W) until
  // it finishes; navPath() is the run-to-completion form used everywhere else.
  function navScratch(G,N,key){let W=G[key];if(!W||W.N!==N)W=G[key]={N,gs:new Float32Array(N),came:new Int32Array(N),closed:new Uint8Array(N),st:new Uint32Array(N),gen:0,hf:new Float64Array(4096),hi:new Int32Array(4096)};return W;}
  function navSearch(G,from,to,maxIt,key){if(!G.g)navBuild(G);const s=navNearest(G,navC(G,from)),t=navNearest(G,navC(G,to));if(!s||!t)return {step:()=>({path:null})};
    const N=G.nx*G.nz,W=navScratch(G,N,key||"sc");
    const gen=W.gen=(W.gen+1)>>>0||1,gs=W.gs,came=W.came,closed=W.closed,st=W.st,si=s[1]*G.nx+s[0],ti=t[1]*G.nx+t[0];
    const touch=i=>{if(st[i]!==gen){st[i]=gen;gs[i]=1e9;came[i]=-1;closed[i]=0;}};
    let hf=W.hf,hi=W.hi,hn=0;
    const push=(f,i)=>{if(hn===hf.length){const f2=new Float64Array(hn*2),i2=new Int32Array(hn*2);f2.set(hf);i2.set(hi);hf=W.hf=f2;hi=W.hi=i2;}
      let k=hn++;hf[k]=f;hi[k]=i;while(k>0){const p2=(k-1)>>1;if(hf[p2]<=hf[k])break;const a=hf[p2],b=hi[p2];hf[p2]=hf[k];hi[p2]=hi[k];hf[k]=a;hi[k]=b;k=p2;}};
    const pop=()=>{const top=hi[0];hn--;if(hn>0){hf[0]=hf[hn];hi[0]=hi[hn];let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<hn&&hf[l]<hf[m])m=l;if(r<hn&&hf[r]<hf[m])m=r;if(m===k)break;
        const a=hf[m],b=hi[m];hf[m]=hf[k];hi[m]=hi[k];hf[k]=a;hi[k]=b;k=m;}}return top;};
    const SX=G.SX,SZ=G.SZ,LK=G.L,ics=1/G.cs;   // (v7.0 t5: costs and the estimate measured where the cells are drawn, so routes are the short ones on screen)
    const h=SX?i=>Math.hypot(SX[i]-SX[ti],SZ[i]-SZ[ti])*ics:i=>{const x=i%G.nx,z=(i/G.nx)|0,dx=Math.abs(x-t[0]),dz=Math.abs(z-t[1]);return Math.max(dx,dz)+0.414*Math.min(dx,dz);};
    touch(si);touch(ti);gs[si]=0;push(h(si),si);let it=0,done=false;
    const finish=()=>{if(came[ti]<0&&si!==ti)return null;
      const cells=[];for(let i=ti;i>=0;i=came[i]){const c=[G.x0+((i%G.nx)+0.5)*G.cs,G.z0+(((i/G.nx)|0)+0.5)*G.cs],p=came[i];
        if(p>=0&&i!==si&&(Math.abs((p%G.nx)-(i%G.nx))>1||Math.abs(((p/G.nx)|0)-((i/G.nx)|0))>1))c[2]=1;   // (reached through a portal: the walker steps across to it)
        cells.push(c);if(i===si)break;}cells.reverse();
      const out=[cells[0]];let k=0;while(k<cells.length-1){let j=cells.length-1;
        {for(let m=k+1;m<=j;m++)if(cells[m][2]){j=m===k+1?m:m-1;break;}}   // (never smoothed past a portal: up to the cell before it, then the step across)
        while(j>k+1&&!navLOS(G,cells[k],cells[j]))j--;out.push(cells[j]);k=j;}
      out.push(to);return out;};
    return {step(deadline){if(done)return {path:null};
      while(hn&&it++<maxIt){if((it&255)===0&&performance.now()>deadline){it--;return undefined;}
        const i=pop();if(i===ti)break;if(closed[i])continue;closed[i]=1;const x=i%G.nx,z=(i/G.nx)|0;
        for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(!navFree(G,nx,nz))continue;if(dx&&dz&&(!navFree(G,x+dx,z)||!navFree(G,x,z+dz)))continue;
          const ni=nz*G.nx+nx;touch(ni);const ng=gs[i]+(SX?Math.max(0.5,Math.hypot(SX[ni]-SX[i],SZ[ni]-SZ[i])*ics):(dx&&dz?1.414:1));if(ng<gs[ni]){gs[ni]=ng;came[ni]=i;push(ng+h(ni),ni);}}
        const lk=LK&&LK.get(i);if(lk)for(const ni of lk){if(G.g[ni])continue;touch(ni);const ng=gs[i]+0.5+Math.hypot(SX[ni]-SX[i],SZ[ni]-SZ[i])*ics;if(ng<gs[ni]){gs[ni]=ng;came[ni]=i;push(ng+h(ni),ni);}}}
      done=true;return {path:finish()};}};}
  function navPath(G,from,to,maxIt=250000){return navSearch(G,from,to,maxIt).step(Infinity).path;}
  // people: plan a walk only when the straight line is blocked; re-plan when the destination changes
  function walkPlan(p,tx,tz){const u=p.userData,key=(Math.round(tx*4)+2048)*4096+(Math.round(tz*4)+2048);   /* (v5.2: a number, no string per walker per frame) */if(u.wpKey===key)return u.wp;u.wpKey=key;u.wp=null;u.wpPend=false;
    if(!NAVW.g)navBuild(NAVW);const a=[p.position.x,p.position.z],b=[tx,tz],d=Math.hypot(tx-a[0],tz-a[1]);if(d<1.2)return null;
    {const ca=navC(NAVW,a),cb=navC(NAVW,b);const sA=navNearest(NAVW,ca),sB=navNearest(NAVW,cb);if(!sA||!sB)return null;
      const pa=[NAVW.x0+(sA[0]+0.5)*NAVW.cs,NAVW.z0+(sA[1]+0.5)*NAVW.cs],pb=[NAVW.x0+(sB[0]+0.5)*NAVW.cs,NAVW.z0+(sB[1]+0.5)*NAVW.cs];if(navLOS(NAVW,pa,pb))return null;}
    // v4.0.4: queued; navPump() searches ~2 ms per frame and fills u.wp when done (until then the walker steers locally)
    const Q=NAVW.jobs||(NAVW.jobs=[]);for(let k=Q.length-1;k>=0;k--)if(Q[k].p===p&&k>0)Q.splice(k,1);
    Q.push({p,key,a,b,d});u.wpPend=true;return null;}   // (v6.11.2: wpPend: the walker waits for its route instead of steering through the walls, 33 moveP)
  function navPump(){const Q=NAVW.jobs;if(!Q||!Q.length)return;const end=performance.now()+3;
    while(Q.length&&performance.now()<end){const j=Q[0];
      if(j.p.userData.wpKey!==j.key){Q.shift();continue;}   // the walker has a new destination: drop this search
      if(!j.s)try{j.s=navSearch(NAVW,j.a,j.b,120000,"scw");}catch(e){Q.shift();j.p.userData.wpPend=false;continue;}
      let r;try{r=j.s.step(end);}catch(e){r={path:null};}if(!r)return;Q.shift();
      let path=r.path;if(path){let L=0;for(let i=1;i<path.length;i++)if(!path[i][2])L+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);if(L>j.d*3+25)path=null;}
      if(j.p.userData.wpKey===j.key){j.p.userData.wp=path?path.slice(1,-1):null;j.p.userData.wpPend=false;}}}
  G3.navWarm=()=>{if(!NAVW.g)navBuild(NAVW);if(!NAV.g)navBuild(NAV);};
  G3.navPump=navPump;G3.navDbg={NAVW,NAV,navPath,navBuild,navC,navFree};   // (v6.11.2: tests)
  G3.navCheck=(pts,G=NAV)=>{if(!G.g)navBuild(G);let bad=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(d/0.25));
      for(let k=0;k<=n;k++){const c=navC(G,[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);if(G.g[c[1]*G.nx+c[0]])bad++;}}return bad;};
  G3.NAV=NAV;G3.NAVW=NAVW;
  function route(from,to){let p=null;try{p=navPath(NAV,from,to);}catch(e){}if(!p&&!LAYOUT6)try{p=navPath(NAVW,from,to);}catch(e){}   // (v7.0 t5: the people's finer grid next: the lanes don't know the blocks are drawn apart)
    if(!p&&!LAYOUT6){const F=G3.routeFails||(G3.routeFails=[]);if(F.length<40)F.push([from.map(v=>+v.toFixed(1)),to.map(v=>+v.toFixed(1))]);}   // (diagnostics: a route the grids couldn't find)
    return p||routeLanes(from,to);}
  function routeLanes(from,to){const pts=[],lf=lane(from),lt=lane(to);
    pts.push(lf==="F"?[from[0],17.6]:[Math.max(from[0],-5.5),-0.6]);
    if(lf!==lt)pts.push(...(lf==="C"?[[67,-0.6],[67,17.6]]:[[67,17.6],[67,-0.6]]));
    pts.push(lt==="F"?[to[0],17.6]:[Math.max(to[0],-5.5),-0.6]);pts.push(to);return pts;}
  const techs=[];
  function ensureTechs(){while(techs.length<Math.min(8,P.techs)){const k=techs.length,s=SLOTS[k],w=worker(techM,M.hatBlue,{vest:HIVIS.yellow,radio:true}),t=trike();
      t.position.set(s[0],0,s[1]);t.rotation.y=Math.PI/2;const b=BENCH[k];w.position.set(b.p[0],0,b.p[1]);techs.push({w,t,k,slot:s,bench:b,state:"home",path:null,inc:null,onSite:0,walk:null});}}
  function walkTo(T,pts,speed,rdt,now){while(T.walk&&T.walk.length){if(moveP(T.w,T.walk[0][0],T.walk[0][1],speed,rdt))T.walk.shift();else{pose(T.w,"run",now);return false;}}return true;}
  function drive(T,rdt){if(T.path[0]&&T.path[0][2]){const q=T.path.shift();T.t.position.x=q[0];T.t.position.z=q[1];if(!T.path.length)return true;}   // (v7.0 t5: a portal: across in one step)
    const p=T.path[0],dx=p[0]-T.t.position.x,dz=p[1]-T.t.position.z,d=Math.hypot(dx,dz),s=Math.min(d,22*rdt/(d>0.05&&G3.bandK?G3.bandK(T.t.position.x,T.t.position.z,dx/d,dz/d):1));
    if(d>0.05){T.t.position.x+=dx/d*s;T.t.position.z+=dz/d*s;T.t.rotation.y=lerpAng(T.t.rotation.y,Math.atan2(-dz,dx),Math.min(1,rdt*10));}
    if(d<0.25)T.path.shift();
    const a=T.t.rotation.y;T.w.position.set(T.t.position.x-Math.cos(a)*0.15,0,T.t.position.z+Math.sin(a)*0.15);T.w.rotation.y=a;return T.path.length===0;}
  // v6.10: a job's spot (a bearing failure is at its machine, 38c ASPOT) and, for a tech on a vibration round, the machine they're at now
  const mSpot=i=>i.asset&&ASPOT[i.asset]?ASPOT[i.asset]:MAINT_SPOT[i.id];
  const rndAt=k=>{const R=S.rel;if(!R||!R.rd)return null;for(const x of R.rd.list)if(x.who==="t"+k&&x.st==="go"&&x.a.length){const f=(S.t-x.t0)/Math.max(1,x.len),a=x.a[f<0.5?0:Math.min(1,x.a.length-1)];return ASPOT[a]?{x,a}:null;}return null;};
  function techUpdate(rdt,now){ensureTechs();
    const MI=S.inc.filter(i=>mSpot(i)&&i.mSlot>=0).sort((a,b)=>a.mSlot-b.mSlot);
    techs.forEach((T,k)=>{const want=k<P.techs&&MI[Math.floor(k/2)]?MI[Math.floor(k/2)]:null,rnd=!want&&k<P.techs?rndAt(k):null,active=T.inc?S.inc.some(i=>i.id===T.inc):!!(T.rnd&&rnd&&rnd.a===T.rnd);
      switch(T.state){
        case "home":{T.w.visible=k<P.techs;const b=T.bench;
          if(want){T.inc=want.id;T.rnd=null;T.spot=mSpot(want);T.state="exit";T.next="mount";T.walk=[[SHOP.door[0],-20.1],[SHOP.door[0],-18.1]];break;}
          if(rnd){T.inc=null;T.rnd=rnd.a;T.spot=ASPOT[rnd.a];T.state="exit";T.next="mount";T.walk=[[SHOP.door[0],-20.1],[SHOP.door[0],-18.1]];break;}   // v6.10 a vibration round
          if(RUN.on&&k<2&&k<P.techs&&T.ran!==RUN.t0){T.ran=RUN.t0;T.state="exit";T.next="cmount";T.walk=[[SHOP.door[0],-20.1],[SHOP.door[0],-18.1]];break;}
          if(moveP(T.w,b.p[0],b.p[1],3,rdt)){face(T.w,b.l[0],b.l[1],rdt);pose(T.w,"fix",now);T.w.userData.armful.visible=false;
            if(Math.random()<rdt*1.2){const [nx,,nz]=nozzlePos(T.w);for(let j=0;j<2;j++)emit("spark",nx,1.1,nz,R()*2,1.5+Math.random()*2,R()*2,0.3,0.18,"#ff8a1f",1);}}
          else pose(T.w,"walk",now);break;}
        case "exit":if(walkTo(T,null,5,rdt,now))T.state=T.next;break;
        case "cmount":if(moveP(T.w,T.slot[0]+0.2,T.slot[1]+0.7,7,rdt)){T.state="chase";T.path=route(T.slot,[60,17.6]);}else pose(T.w,"run",now);break;
        case "chase":pose(T.w,"ride",now);T.w.position.y=0.12;
          if(!RUN.on){T.state="home2";T.path=route([T.t.position.x,T.t.position.z],T.slot);break;}
          if(T.path.length<=1&&T.t.position.z>15)T.path=[[clamp(RUN.x-RUN.dir*(3.5+k*2.6),-22,66),17.6]];
          if(T.path.length)drive(T,rdt);break;
        case "mount":if(moveP(T.w,T.slot[0]+0.2,T.slot[1]+0.7,6,rdt)){T.state="out";T.path=route(T.slot,(()=>{const s=T.spot||MAINT_SPOT[T.inc];return T.rnd?[s[0]-1.4,s[1]]:[s[0]+((k%3)-1)*1.6,s[1]+(k>2?1.4:0)];})());}else pose(T.w,"run",now);break;
        case "out":pose(T.w,"ride",now);T.w.position.y=0.12;if(drive(T,rdt)){T.state="walk";T.onSite=now;}break;
        case "walk":{const s=T.spot||MAINT_SPOT[T.inc];
          if(T.rnd){   // v6.10: a vibration round: stand at the machine with the analyser's probe on the bearing housing
            if(!active&&now-T.onSite>1500){T.state="back";break;}
            if(moveP(T.w,s[0],s[1],4,rdt)){if(s.length>2)face(T.w,s[2],s[3],rdt);pose(T.w,"inspect",now);T.w.userData.tool.visible=true;}else pose(T.w,"walk",now);break;}
          const fx=s[0]+((k%3)-1)*1.1,fz=s[1]+(lane(s)==="F"?-1.6:1.4)*(k%2?1:-1)*0.6-(lane(s)==="F"?1.0:0);
          if(!active&&now-T.onSite>2500){T.state="back";break;}
          if(moveP(T.w,fx,fz,5,rdt)){face(T.w,s[0],lane(s)==="F"?zc:s[1]-3,rdt);pose(T.w,"fix",now);{const ii=S.inc.find(x=>x.id===T.inc);if(ii)ii.mHere=true;}
            if(Math.random()<rdt*6){const [nx,,nz]=nozzlePos(T.w);for(let j=0;j<3;j++)emit("spark",nx,0.9,nz,R()*4,2+Math.random()*3,R()*4,0.4,0.22,"#ff8a1f",1);}}
          else pose(T.w,"run",now);break;}
        case "back":{const a=T.t.rotation.y;if(moveP(T.w,T.t.position.x-Math.cos(a)*0.15,T.t.position.z+Math.sin(a)*0.15,5,rdt)){
            // v6.10: called to a job, or the round moves on to its next machine: ride straight there instead of going home first
            const nx=want?{i:want,s:mSpot(want)}:rnd&&rnd.a!==T.rnd?{r:rnd.a,s:ASPOT[rnd.a]}:null;
            if(nx){T.inc=nx.i?nx.i.id:null;T.rnd=nx.r||null;T.spot=nx.s;T.state="out";const from=[T.t.position.x,T.t.position.z];T.path=route(from,T.rnd?[nx.s[0]-1.4,nx.s[1]]:[nx.s[0]+((k%3)-1)*1.6,nx.s[1]+(k>2?1.4:0)]);break;}
            T.state="home2";T.rnd=null;T.path=route([T.t.position.x,T.t.position.z],T.slot);}else pose(T.w,"run",now);break;}
        case "home2":pose(T.w,"ride",now);T.w.position.y=0.12;if(drive(T,rdt)){T.t.rotation.y=Math.PI/2;T.state="inside";}break;
        case "inside":if(!T.walk)T.walk=[[SHOP.door[0],-18.1],[SHOP.door[0],-20.1],T.bench.p];if(walkTo(T,null,5,rdt,now)){T.walk=null;T.state="home";T.inc=null;T.rnd=null;}break;
      }
      T.t.visible=k<P.techs;});}

