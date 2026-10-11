  /* ---- v14 activity scenes: one or two small working machines per site, going about a job on a loop, so the land round
     the mill has a little life without pulling the eye from the mill. Built once here (their materials made at start-up,
     so the precompile covers them); G3.actTick moves them every frame (43-3d-frame.js). Purely visual: no sim streams.
     Valley: a wheel loader carrying logs across the Valley Timber yard to the log truck. City: a shunter pushing wagons
     along a siding in the rail yard, and a straddle carrier running containers between the quay and the stacks.
     Desert: the solar crew's pickup on its maintenance track, a dust trail behind it. Bayou: a forklift taking bales from
     the barge dock round the fence to receiving. ---- */
  {const CYLG=new THREE.CylinderGeometry(1,1,1,12),ACT=[],AS=G3.actSpots||{},AM={},am=(k,hex)=>AM[k]||(AM[k]=new StdMat({color:lin0(hex),roughness:0.7}));
    const part=(g,w,h,d,x,y,z,k,hex)=>{const m=new THREE.Mesh(cubeG,am(k,hex));m.scale.set(w,h,d);m.position.set(x,y+h/2,z);m.castShadow=true;g.add(m);return m;};
    const wheel=(g,x,z,r,w)=>{const m=new THREE.Mesh(CYLG,am("tyre","#2f3a49"));m.scale.set(r,w,r);m.rotation.x=Math.PI/2;m.position.set(x,r,z);g.add(m);return m;};
    const H=(x,z)=>G3.terrainH?G3.terrainH(x,z):0;
    // follow a polyline back and forth at v m/s, waiting `wait` s at each end; fn(state) shows or hides loads
    function shuttle(g,pts,v,wait,fn){const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));const tot=L[L.length-1];
      const st={s:0,dir:1,w:wait*0.5};ACT.push(rdt=>{if(st.w>0){st.w-=rdt;return;}st.s+=st.dir*v*rdt;if(st.s>=tot||st.s<=0){st.s=Math.max(0,Math.min(tot,st.s));st.dir=-st.dir;st.w=wait;if(fn)fn(st);}
        let i=1;while(i<L.length-1&&L[i]<st.s)i++;const f=(st.s-L[i-1])/Math.max(1e-6,L[i]-L[i-1]),x=pts[i-1][0]+(pts[i][0]-pts[i-1][0])*f,z=pts[i-1][1]+(pts[i][1]-pts[i-1][1])*f;
        g.position.set(x,H(x,z),z);g.rotation.y=Math.atan2(-(pts[i][1]-pts[i-1][1]),pts[i][0]-pts[i-1][0])+(st.dir<0?Math.PI:0);});if(fn)fn(st);return st;}
    const grp=()=>{const g=new THREE.Group();g.userData.act=true;scene.add(g);return g;};
    if(SITE.env==="rural"){
      // the loader: body, cab, engine, a boom with a grapple carrying three logs east, back empty
      const g=grp();part(g,4.2,1.4,2.2,0,0.6,0,"loader","#e2a823");part(g,1.6,1.6,1.9,-0.6,2.0,0,"loader","#e2a823");part(g,1.4,1.0,1.7,-0.6,2.1,0,"glass","#46576d");
      part(g,1.4,1.2,2.0,-2.4,1.3,0,"loader","#e2a823");[[-1.5,-1.1],[-1.5,1.1],[1.4,-1.1],[1.4,1.1]].forEach(([a,b])=>wheel(g,a,b,0.75,0.5));
      part(g,2.6,0.35,0.35,2.6,1.6,-0.7,"steel","#5b6270");part(g,2.6,0.35,0.35,2.6,1.6,0.7,"steel","#5b6270");part(g,0.4,1.2,2.2,3.9,1.0,0,"steel","#5b6270");
      const logs=new THREE.Group();g.add(logs);for(let k=0;k<3;k++){const m=new THREE.Mesh(CYLG,am("log","#8a6a4a"));m.scale.set(0.36,6,0.36);m.rotation.x=Math.PI/2;m.position.set(4.1,1.6+(k%2)*0.6,(k-1)*0.55);logs.add(m);}
      shuttle(g,[[-64,84],[-34,84],[-16,92]],3.2,4,st=>{logs.visible=st.dir>0;});
      // the log truck waiting by the shed
      {const t=grp();t.position.set(-12,H(-12,104),104);part(t,2.6,2.6,4,0,0.6,-9,"truck","#2a5aa8");part(t,2.6,0.4,13,0,1.0,1,"steel","#5b6270");for(let k=0;k<6;k++){const m=new THREE.Mesh(CYLG,am("log","#8a6a4a"));m.scale.set(0.4,12,0.4);m.rotation.x=Math.PI/2;m.position.set(-0.8+(k%3)*0.8,1.9+Math.floor(k/3)*0.7,1);t.add(m);}
        [[-1.4,-9],[1.4,-9],[-1.4,4],[1.4,4],[-1.4,6.5],[1.4,6.5]].forEach(([a,b])=>wheel(t,a,b,0.55,0.4));}}
    if(SITE.env==="urban"){
      // the shunter and two wagons up and down the clear siding
      if(AS.shunter){const S2=AS.shunter,g=grp();part(g,11,2.6,2.8,0,0.9,0,"shunter","#f27a30");part(g,3.2,1.8,2.9,-3.2,3.5,0,"shunter","#f27a30");part(g,3.3,0.8,2.95,-3.2,4.4,0,"glass","#46576d");
        part(g,0.4,0.8,3.2,5.6,0.6,0,"steel","#2f3a49");[-14,-28].forEach((x,k)=>{part(g,13,3.3,2.8,x,0.9,0,"wagon"+k,k?"#3d5f8c":"#9b3d2a");part(g,0.6,0.4,0.4,x+7,1.2,0,"steel","#2f3a49");});
        shuttle(g,[[S2.xb,S2.z],[S2.xa,S2.z]],2.2,6);}
      // the straddle carrier with a container, between the quay and the stacks
      {const [zc,hw]=riverAt(0),shore=zc+hw,X=112+22+40,g=grp(),c=part(g,2.4,2.5,6,0,8.6,0,"box","#d6382c");
        [[-1.6,-3.4],[1.6,-3.4],[-1.6,3.4],[1.6,3.4]].forEach(([a,b])=>part(g,0.4,11,0.4,a,0,b,"straddle","#e2c230"));part(g,3.8,0.6,7.6,0,11,0,"straddle","#e2c230");part(g,1.6,1.4,1.6,0,11.6,3,"glass","#46576d");
        [[-1.6,-3.4],[1.6,-3.4],[-1.6,3.4],[1.6,3.4]].forEach(([a,b])=>wheel(g,a,b,0.6,0.5));g.rotation.y=Math.PI/2;
        const st=shuttle(g,[[X,shore-12],[X,shore-90]],4,5,s=>{c.visible=s.dir<0;});ACT.push(()=>{g.position.y=1.2;});st.s=20;}}
    if(SITE.env==="desert"&&AS.pickup){
      const P=AS.pickup,g=grp();part(g,4.6,1.0,2.0,0,0.6,0,"pickup","#f2f2f2");part(g,1.8,0.9,1.9,0.4,1.6,0,"pickup","#f2f2f2");part(g,1.6,0.6,1.8,0.4,1.75,0,"glass","#46576d");
      part(g,0.3,0.25,1.4,0.6,2.5,0,"beacon","#f2a33a");[[-1.5,-1],[-1.5,1],[1.5,-1],[1.5,1]].forEach(([a,b])=>wheel(g,a,b,0.4,0.3));
      shuttle(g,[[P.x-P.hx,P.z+P.hz],[P.x+P.hx,P.z+P.hz],[P.x+P.hx,P.z-P.hz],[P.x-P.hx,P.z-P.hz]],6,3);
      // the dust trail: soft tan puffs left behind, growing and fading
      const dm=new THREE.MeshBasicMaterial({color:lin0("#d9c49c"),transparent:true,opacity:0.35,depthWrite:false}),puffs=[];
      for(let k=0;k<10;k++){const m=new THREE.Mesh(sphereG,dm.clone());m.visible=false;scene.add(m);puffs.push({m,age:9});}
      let acc=0,i=0,lx=0,lz=0;ACT.push(rdt=>{acc+=rdt;const moved=Math.hypot(g.position.x-lx,g.position.z-lz)>0.01;lx=g.position.x;lz=g.position.z;
        if(moved&&acc>0.35){acc=0;const p=puffs[i++%puffs.length];p.age=0;p.m.position.set(g.position.x-Math.cos(g.rotation.y)*2.6,g.position.y+0.6,g.position.z+Math.sin(g.rotation.y)*2.6);p.m.visible=true;}
        for(const p of puffs){if(p.age>=3){p.m.visible=false;continue;}p.age+=rdt;const s=0.8+p.age*1.4;p.m.scale.set(s,s*0.6,s);p.m.position.y+=rdt*0.4;p.m.material.opacity=0.35*Math.max(0,1-p.age/3);}});}
    if(SITE.env==="swamp"&&AS.fork){
      // the forklift: out empty to the dock, back round the fence to receiving with two bales on the forks
      const g=grp();part(g,2.4,1.1,1.4,0,0.3,0,"fork","#e2c230");part(g,1.2,1.0,1.2,-0.3,1.4,0,"glass","#46576d");part(g,0.2,2.6,1.2,1.3,0.2,0,"steel","#4a4f58");
      const load=part(g,1.6,2.2,1.3,2.1,0.3,0,"bale","#a7784a");[[-0.8,-0.6],[-0.8,0.6],[0.8,-0.6],[0.8,0.6]].forEach(([a,b])=>wheel(g,a,b,0.35,0.25));
      shuttle(g,AS.fork.slice().reverse(),3,5,st=>{load.visible=st.dir<0;});}
    G3.actTick=rdt=>{if(!(rdt>0))return;rdt=Math.min(rdt,0.1);for(let k=0;k<ACT.length;k++)ACT[k](rdt);};
    G3.act=ACT.length;}
