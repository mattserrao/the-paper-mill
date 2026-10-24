  /* ---- maintenance techs: break room, yellow three-wheel scooters, repairs ---- */
  // v6.12.1: the shop moved from behind stock prep (x 50.5..63, z -25..-19.2) to the lawn south of the machine hall, west of
  // the MCC (38c): the same building, benches and trike slots slid by (-68.5, +49), so the door and the MAINTENANCE sign still
  // face +z (the camera), with the trike apron in front and a 9.5 m yard to the MCC's door. Shop + MCC make one maintenance
  // and electrical block; the shift relief walks in along the front of the hall from the parking lot (38b).
  const SHOP={x0:-18,x1:-5.5,z0:24,z1:29.8,door:[-12.5,30.6]};
  slab(-19.5,-3.5,23,34.5,M.slab,0.03);box2(SHOP.x0,SHOP.x1,SHOP.z0,SHOP.z1,1.4);
  // (v6.11.2: the front wall has a real doorway at the door (it was solid, with the door drawn on it, so the techs walked through
  //  the wall to their benches): two wall runs and a header over a 1.6 m opening)
  {const dx0=SHOP.door[0]-0.85,dx1=SHOP.door[0]+0.85;ribWall(dx0-SHOP.x0,3.3,0.3,(SHOP.x0+dx0)/2,1.65,SHOP.z1);ribWall(SHOP.x1-dx1,3.3,0.3,(dx1+SHOP.x1)/2,1.65,SHOP.z1);ribWall(dx1-dx0,1.0,0.3,SHOP.door[0],2.8,SHOP.z1);}
  ribWall(SHOP.x1-SHOP.x0,3.3,0.3,(SHOP.x0+SHOP.x1)/2,1.65,SHOP.z0);
  ribWall(0.3,3.3,SHOP.z1-SHOP.z0,SHOP.x0,1.65,(SHOP.z0+SHOP.z1)/2);ribWall(0.3,3.3,SHOP.z1-SHOP.z0,SHOP.x1,1.65,(SHOP.z0+SHOP.z1)/2);
  {const rm=mat("brand",{transparent:true,roughness:0.55}),rg=new THREE.Group();scene.add(rg);
   const roof=new THREE.Mesh(new THREE.BoxGeometry(SHOP.x1-SHOP.x0+0.6,0.35,SHOP.z1-SHOP.z0+0.6),rm);roof.position.set((SHOP.x0+SHOP.x1)/2,3.45,(SHOP.z0+SHOP.z1)/2);roof.castShadow=true;rg.add(roof);
   rg.userData.mats=[rm];roofs.push(rg);
   {const d=box(0.12,2.3,1.0,M.ink,SHOP.door[0]-0.82,1.15,SHOP.z1-0.55,scene,false);d.userData.noNav=true;}   /* (v6.11.2: the door stands open against the inside wall) */{const W=SHOP.x1-SHOP.x0,H=2.95,wx=[1.1,2.9,7.9,9.6,11.3].map(v=>[v,1.05,1.3,0.95]);   /* (window centres from the west wall) */
     const fs=facade(W,H,wx,[SHOP.door[0]-SHOP.x0,2.22,4.6,0.62,"MAINTENANCE"],SHOP.door[0]-SHOP.x0);fs.position.set((SHOP.x0+SHOP.x1)/2,H/2,SHOP.z1+0.17);fs.userData.noNav=true;scene.add(fs);}}
  const SLOTS=[-17,-15.6,-14.2,-12.8,-10,-8.6,-7.2,-5.8].map(x=>[x,32.4]);   // (the trike apron in front of the door)
  // shop floor: workbenches with pumps on them along the back wall (z0, the north wall), rebuild stands, parts racks, a break table
  const BENCH=[];
  {const wood=M.kraft;[-16.4,-13.6,-10.8,-8].forEach(x=>{box(2.3,0.12,1.0,wood,x,0.95,24.8,scene,false);[-1,1].forEach(sx=>box(0.1,0.9,0.9,M.steel,x+sx*1.05,0.45,24.8,scene,false));
      box(2.2,1.3,0.06,M.steel,x,2.0,24.2,scene,false);for(let k=0;k<5;k++)box(0.07,0.32,0.05,k%2?M.bad:M.ink,x-0.8+k*0.4,2.0,24.26,scene,false);
      const pm=pumpModel();pm.scale.setScalar(0.42);pm.position.set(x,1.01,24.85);pm.rotation.y=0.3;BENCH.push({p:[x,25.75],l:[x,24.6]});});
    [[-16.2,28.4],[-7.2,28.4]].forEach(([x,z],k)=>{box(1.4,0.5,0.9,M.steel,x,0.25,z,scene);const pm=pumpModel();pm.scale.setScalar(0.5);pm.position.set(x,0.5,z);pm.rotation.y=k?Math.PI:0;
      BENCH.push({p:[x+(k?-1.25:1.25),z],l:[x,z]});BENCH.push({p:[x,z+0.95],l:[x,z]});});
    box(0.5,2.4,4.6,M.steel,-17.55,1.2,26.9,scene);for(let k=0;k<4;k++)box(0.48,0.06,4.5,M.ink,-17.55,0.4+k*0.6,26.9,scene,false);
    for(let k=0;k<6;k++)box(0.3,0.3,0.4,k%2?M.stock:M.warn,-17.55,0.6+(k%3)*0.6,25.2+k*0.7,scene,false);
    box(1.0,0.08,0.8,M.panel,-10.1,0.78,28.3,scene,false);box(0.12,0.74,0.12,M.steel,-10.1,0.37,28.3,scene,false);}
  const techM=mat("g-tech");
  function trike(){const g=new THREE.Group();
    box(1.3,0.42,0.7,M.fork,0,0.55,0,g);box(0.5,0.5,0.62,M.fork,-0.62,0.86,0,g);box(0.42,0.12,0.5,M.ink,-0.15,0.85,0,g,false);
    box(0.08,0.75,0.08,M.ink,0.62,0.95,0,g,false);box(0.08,0.08,0.75,M.ink,0.62,1.32,0,g,false);
    cylZ(0.3,0.16,M.ink,0.78,0.3,0,16,g);cylZ(0.3,0.16,M.ink,-0.55,0.3,-0.45,16,g);cylZ(0.3,0.16,M.ink,-0.55,0.3,0.45,16,g);
    box(0.04,1.4,0.04,M.ink,-0.82,1.5,0.25,g,false);const flag=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.26),new THREE.MeshBasicMaterial({color:lin(tok("fire")),side:THREE.DoubleSide}));flag.position.set(-0.6,2.08,0.25);g.add(flag);
    g.userData.trike=true;scene.add(g);return g;}
  const MAINT_SPOT={birdline:[40,-8],refclash:[58.2,-11],steamjoint:[11.2,3.4],fogfan:[47.2,-5.4],shaft:[12,16.4],fabric:[53.5,14.6],felt:[40.5,14.6],overflow:[-5,-10.5],chestover:[29.5,-9.6],hdblow:[24.2,-9.4],boiler:[68.6,-10],thkblow:[41.6,-10.4],lwplug:[11.2,-20.3],cscreen:[15.2,-20.6],fscreen:[19.2,-20.4],lcplug:[26.6,-20.7],winderdown:[-14.6,14.6],fleet:[-6.3,-14],roof:[-21.6,24],lightning:[40,-8],icedintake:[-30,-50]};
  function lane(p){return p[1]>2.4?"F":"C";}
  // v2.9.19: maintenance trikes path-find around buildings and equipment. A 0.5 m ground grid is built once from every
  // static mesh that reaches into the 0.25-1.9 m band (walls, tanks, skids, pumps, trees, posts), grown by 0.75 m for the
  // trike, then A* + line-of-sight smoothing. Falls back to the old two-lane route if no path is found.
  // v2.9.19/20: path-finding on 0.5 m ground grids built once from every static mesh that reaches into the 0.25-1.9 m band
  // (walls, tanks, skids, pumps, stairs, trees, posts). Trikes use a grid grown by 0.35 m, people one grown by 0.22 m.
  // A* + line-of-sight smoothing; anything that can't be routed falls back to the old behaviour.
  const NAV={x0:-62,z0:-52,cs:0.5,nx:300,nz:210,g:null,inf:0.35},NAVW={x0:-62,z0:-52,cs:0.5,nx:300,nz:210,g:null,inf:0.22};
  function navBuild(G){const g=new Uint8Array(G.nx*G.nz),bb=new THREE.Box3(),INF=G.inf;scene.updateMatrixWorld(true);
    const navCb=o=>{if(!o.isMesh||o.isInstancedMesh||o.userData.smBatch||!o.geometry)return;
      for(let x=o;x&&x!==scene;x=x.parent){const u=x.userData||{};if(!x.visible&&x!==o)return;if(u.legs||u.wheels||u.load||u.cj||u.trike||u.stack||u.noNav)return;}   // (v6.11.2: no longer skips a roof group (u.mats): the machine hall's shell walls live in one, so walkers at a shift change cut through them; the roofs themselves are over 1.9 m and skipped below)
      if(!o.visible&&o.layers.mask===1)return;
      const gb=o.geometry.boundingBox||(o.geometry.computeBoundingBox(),o.geometry.boundingBox);bb.copy(gb).applyMatrix4(o.matrixWorld);
      if(bb.min.y>1.9||bb.max.y<0.25)return;if((bb.max.x-bb.min.x)*(bb.max.z-bb.min.z)>900)return;
      const i0=Math.max(0,Math.floor((bb.min.x-INF-G.x0)/G.cs)),i1=Math.min(G.nx-1,Math.floor((bb.max.x+INF-G.x0)/G.cs)),
        j0=Math.max(0,Math.floor((bb.min.z-INF-G.z0)/G.cs)),j1=Math.min(G.nz-1,Math.floor((bb.max.z+INF-G.z0)/G.cs));
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)g[j*G.nx+i]=1;};
    scene.traverse(navCb);if(G3.SM&&G3.SM.holder)G3.SM.holder.traverse(navCb);   // (static things parked out of the scene graph (40) still block the way)
    // v4.1: scenery trunks and posts inside the yard (merged into one mesh, so not seen above)
    (G3.navBoxes||[]).forEach(([x0,x1,z0,z1])=>{const i0=Math.max(0,Math.floor((x0-INF-G.x0)/G.cs)),i1=Math.min(G.nx-1,Math.floor((x1+INF-G.x0)/G.cs)),
      j0=Math.max(0,Math.floor((z0-INF-G.z0)/G.cs)),j1=Math.min(G.nz-1,Math.floor((z1+INF-G.z0)/G.cs));for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)g[j*G.nx+i]=1;});
    G.g=g;}
  const navC=(G,p)=>[clamp(Math.floor((p[0]-G.x0)/G.cs),0,G.nx-1),clamp(Math.floor((p[1]-G.z0)/G.cs),0,G.nz-1)];
  const navFree=(G,i,j)=>i>=0&&j>=0&&i<G.nx&&j<G.nz&&!G.g[j*G.nx+i];
  function navNearest(G,c){if(navFree(G,c[0],c[1]))return c;for(let r=1;r<16;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;if(navFree(G,c[0]+di,c[1]+dj))return [c[0]+di,c[1]+dj];}return null;}
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
    const h=i=>{const x=i%G.nx,z=(i/G.nx)|0,dx=Math.abs(x-t[0]),dz=Math.abs(z-t[1]);return Math.max(dx,dz)+0.414*Math.min(dx,dz);};
    touch(si);touch(ti);gs[si]=0;push(h(si),si);let it=0,done=false;
    const finish=()=>{if(came[ti]<0&&si!==ti)return null;
      const cells=[];for(let i=ti;i>=0;i=came[i]){cells.push([G.x0+((i%G.nx)+0.5)*G.cs,G.z0+(((i/G.nx)|0)+0.5)*G.cs]);if(i===si)break;}cells.reverse();
      const out=[cells[0]];let k=0;while(k<cells.length-1){let j=cells.length-1;while(j>k+1&&!navLOS(G,cells[k],cells[j]))j--;out.push(cells[j]);k=j;}
      out.push(to);return out;};
    return {step(deadline){if(done)return {path:null};
      while(hn&&it++<maxIt){if((it&255)===0&&performance.now()>deadline){it--;return undefined;}
        const i=pop();if(i===ti)break;if(closed[i])continue;closed[i]=1;const x=i%G.nx,z=(i/G.nx)|0;
        for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(!navFree(G,nx,nz))continue;if(dx&&dz&&(!navFree(G,x+dx,z)||!navFree(G,x,z+dz)))continue;
          const ni=nz*G.nx+nx;touch(ni);const ng=gs[i]+(dx&&dz?1.414:1);if(ng<gs[ni]){gs[ni]=ng;came[ni]=i;push(ng+h(ni),ni);}}}
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
      let path=r.path;if(path){let L=0;for(let i=1;i<path.length;i++)L+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);if(L>j.d*3+25)path=null;}
      if(j.p.userData.wpKey===j.key){j.p.userData.wp=path?path.slice(1,-1):null;j.p.userData.wpPend=false;}}}
  G3.navPump=navPump;G3.navDbg={NAVW,NAV,navPath,navBuild,navC,navFree};   // (v6.11.2: tests)
  G3.navCheck=(pts,G=NAV)=>{if(!G.g)navBuild(G);let bad=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(d/0.25));
      for(let k=0;k<=n;k++){const c=navC(G,[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);if(G.g[c[1]*G.nx+c[0]])bad++;}}return bad;};
  G3.NAV=NAV;G3.NAVW=NAVW;
  function route(from,to){let p=null;try{p=navPath(NAV,from,to);}catch(e){}return p||routeLanes(from,to);}
  // v6.12.1: a point on the lawn south of the hall (the shop's apron) joins the front lane through the roll-up door at x 33
  const DOORX=33,south=p=>p[1]>20.5;
  function routeLanes(from,to){const pts=[],lf=lane(from),lt=lane(to);
    if(south(from))pts.push([DOORX,23.5]);
    pts.push(lf==="F"?[south(from)?DOORX:from[0],17.6]:[Math.max(from[0],-5.5),-0.6]);
    if(lf!==lt)pts.push(...(lf==="C"?[[67,-0.6],[67,17.6]]:[[67,17.6],[67,-0.6]]));
    pts.push(lt==="F"?[south(to)?DOORX:to[0],17.6]:[Math.max(to[0],-5.5),-0.6]);
    if(south(to))pts.push([DOORX,23.5]);pts.push(to);return pts;}
  const techs=[];G3.shopDbg={SHOP,SLOTS,BENCH,MAINT_SPOT,get techs(){return techs;}};   // (v6.12.1: tests)
  function ensureTechs(){while(techs.length<Math.min(8,P.techs)){const k=techs.length,s=SLOTS[k],w=worker(techM,M.hatBlue,{vest:HIVIS.yellow,radio:true}),t=trike();
      t.position.set(s[0],0,s[1]);t.rotation.y=Math.PI/2;const b=BENCH[k];w.position.set(b.p[0],0,b.p[1]);techs.push({w,t,k,slot:s,bench:b,state:"home",path:null,inc:null,onSite:0,walk:null});}}
  function walkTo(T,pts,speed,rdt,now){while(T.walk&&T.walk.length){if(moveP(T.w,T.walk[0][0],T.walk[0][1],speed,rdt))T.walk.shift();else{pose(T.w,"run",now);return false;}}return true;}
  function drive(T,rdt){const p=T.path[0],dx=p[0]-T.t.position.x,dz=p[1]-T.t.position.z,d=Math.hypot(dx,dz),s=Math.min(d,22*rdt);
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
          if(want){T.inc=want.id;T.rnd=null;T.spot=mSpot(want);T.state="exit";T.next="mount";T.walk=[[SHOP.door[0],SHOP.z1-0.9],[SHOP.door[0],SHOP.z1+1.1]];break;}
          if(rnd){T.inc=null;T.rnd=rnd.a;T.spot=ASPOT[rnd.a];T.state="exit";T.next="mount";T.walk=[[SHOP.door[0],SHOP.z1-0.9],[SHOP.door[0],SHOP.z1+1.1]];break;}   // v6.10 a vibration round
          if(RUN.on&&k<2&&k<P.techs&&T.ran!==RUN.t0){T.ran=RUN.t0;T.state="exit";T.next="cmount";T.walk=[[SHOP.door[0],SHOP.z1-0.9],[SHOP.door[0],SHOP.z1+1.1]];break;}
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
        case "inside":if(!T.walk)T.walk=[[SHOP.door[0],SHOP.z1+1.1],[SHOP.door[0],SHOP.z1-0.9],T.bench.p];if(walkTo(T,null,5,rdt,now)){T.walk=null;T.state="home";T.inc=null;T.rnd=null;}break;
      }
      T.t.visible=k<P.techs;});}

