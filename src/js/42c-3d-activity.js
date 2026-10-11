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
    /* ---- v17 rare sights: now and then (every 4-10 minutes of play, at random) something odd happens out on the site
       for half a minute: cowboys ride across the desert flats, Bigfoot steps out of the valley woods, a tugboat steams
       across the city bay, a gator takes an operator on the bayou bank. Purely visual: random timing (not the sim's
       dice), no costs, no production effect, nothing logged. ?sight=1 shows one a few seconds in, then every 40 s. ---- */
    {const Q=new URLSearchParams(location.search),FAST=Q.has("sight"),pathAt=(P,s)=>{let i=1,L=0;for(;i<P.length;i++){const d=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);if(L+d>=s||i===P.length-1){const f=Math.min(1,(s-L)/Math.max(1e-6,d));
          return [P[i-1][0]+(P[i][0]-P[i-1][0])*f,P[i-1][1]+(P[i][1]-P[i-1][1])*f,Math.atan2(-(P[i][1]-P[i-1][1]),P[i][0]-P[i-1][0])];}L+=d;}return [P[0][0],P[0][1],0];},
        plen=P=>{let L=0;for(let i=1;i<P.length;i++)L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);return L;};
      let sight=null;const pick2=a=>a[Math.floor(Math.random()*a.length)],rr2=(a,b)=>a+Math.random()*(b-a);
      // a person-shaped figure (operator, rider): legs, body, arms, head, a hat
      const figure=(g,body,hat,hatK,y0=0,big=1)=>{const p={};p.l=[-1,1].map(s=>part(g,0.2*big,0.8*big,0.22*big,0,y0,s*0.14*big,"dark","#2f3a49"));p.b=part(g,0.3*big,0.7*big,0.5*big,0,y0+0.8*big,0,"body"+body,body);
        p.a=[-1,1].map(s=>part(g,0.16*big,0.62*big,0.16*big,0,y0+0.86*big,s*0.33*big,"body"+body,body));p.h=part(g,0.28*big,0.28*big,0.28*big,0,y0+1.52*big,0,"skin","#e0b48c");
        if(hat)p.hat=part(g,hatK==="wide"?0.75:0.36,0.12,hatK==="wide"?0.75:0.36,0,y0+1.78*big,0,"hat"+hat,hat);if(hat&&hatK==="wide")part(g,0.34,0.24,0.34,0,y0+1.86,0,"hat"+hat,hat);return p;};
      const swing=(p,t,k=1)=>{if(p.l){p.l[0].rotation.z=Math.sin(t)*0.5*k;p.l[1].rotation.z=-Math.sin(t)*0.5*k;}if(p.a){p.a[0].rotation.z=-Math.sin(t)*0.6*k;p.a[1].rotation.z=Math.sin(t)*0.6*k;}};
      const SIGHTS={
        // three riders cross the flats south of the mill at a canter, kicking up a little dust
        desert:()=>{const P=[[300,150],[180,128],[60,150],[-60,130],[-180,150],[-330,170]],T=plen(P),rs=[0,1,2].map(k=>{const g=grp();
            const col=pick2(["#6b4a2f","#8a5a3a","#3a2a20","#b08a5a"]),horse={b:part(g,2.2,0.9,0.75,0,1.1,0,"horse"+col,col),n:part(g,0.5,0.9,0.4,1.1,1.6,0,"horse"+col,col),hd:part(g,0.8,0.38,0.36,1.45,2.3,0,"horse"+col,col),
              legs:[[-0.8,-0.25],[-0.8,0.25],[0.8,-0.25],[0.8,0.25]].map(([a,b])=>part(g,0.16,1.1,0.16,a,0,b,"horse"+col,col))};
            const rider=figure(g,pick2(["#a8322c","#2a5aa8","#c9a24a","#5b6270"]),"#6b4a2f","wide",1.55);rider.l.forEach(l=>{l.rotation.x=0.9;});g.visible=false;return {g,horse,rider,off:k*7+rr2(0,3),lat:(k-1)*3.2};});
          const dm=new THREE.MeshBasicMaterial({color:lin0("#d9c49c"),transparent:true,opacity:0.3,depthWrite:false}),puffs=[...Array(12)].map(()=>{const m=new THREE.Mesh(sphereG,dm.clone());m.visible=false;scene.add(m);return {m,a:9};});let pi=0,pt=0;
          return {t:0,tick(rdt){this.t+=rdt;const v=7;let live=false;pt+=rdt;
              for(const r of rs){const s=this.t*v-r.off;if(s<0||s>T){r.g.visible=false;continue;}live=true;const [x,z,ry]=pathAt(P,s),gx=x+Math.sin(ry)*r.lat,gz=z+Math.cos(ry)*r.lat;
                r.g.visible=true;r.g.position.set(gx,H(gx,gz)+Math.abs(Math.sin(this.t*6+r.off))*0.25,gz);r.g.rotation.y=ry;r.horse.legs.forEach((l,i)=>{l.rotation.z=Math.sin(this.t*12+i*1.6)*0.6;});
                if(pt>0.25){const p=puffs[pi++%puffs.length];p.a=0;p.m.position.set(gx-Math.cos(ry)*1.6,r.g.position.y+0.4,gz+Math.sin(ry)*1.6);p.m.visible=true;}}
              if(pt>0.25)pt=0;for(const p of puffs){if(p.a>=2.5){p.m.visible=false;continue;}p.a+=rdt;const s2=0.6+p.a*1.2;p.m.scale.set(s2,s2*0.6,s2);p.m.material.opacity=0.3*(1-p.a/2.5);}
              return live||this.t*v<20;},
            stop(){rs.forEach(r=>r.g.visible=false);puffs.forEach(p=>p.m.visible=false);}};},
        // Bigfoot steps out of the trees between the highway and the gate, ambles along the edge, stops to look at the mill, and goes back in
        rural:()=>{const g=grp(),F={l:[-1,1].map(s=>part(g,0.45,1.3,0.45,0,0,s*0.32,"bigfoot","#4a3426")),b:part(g,0.9,1.6,1.25,0,1.25,0,"bigfoot","#4a3426"),
              a:[-1,1].map(s=>part(g,0.32,1.5,0.32,0,1.1,s*0.8,"bigfoot","#4a3426")),h:part(g,0.6,0.62,0.6,0.1,2.85,0,"bigfoot","#4a3426")};part(g,0.12,0.25,0.4,0.42,2.95,0,"skin","#8a6a52");g.visible=false;
          const P=[[-152,74],[-142,58],[-131,44],[-128,32],[-140,22],[-153,26]],T=plen(P);
          return {t:0,tick(rdt){this.t+=rdt;const look=this.t>12&&this.t<18,s=Math.min(T,(this.t<12?this.t:look?12:this.t-6)*2.6);const [x,z,ry]=pathAt(P,s);
              g.visible=true;g.position.set(x,H(x,z),z);g.rotation.y=look?Math.atan2(-(5-z),-14-x):ry;swing(F,look?0:this.t*4.2,look?0:1);F.h.rotation.y=look?Math.sin(this.t*1.3)*0.4:0;return s<T;},
            stop(){g.visible=false;}};},
        // a tug steams in from sea, runs along the waterfront past the mill and the pier, and heads back out, a wake behind it
        urban:()=>{const g=grp();part(g,13,2.2,5,0,-0.6,0,"tug","#c92a2a");part(g,5,2.4,3.6,-1,1.6,0,"tugw","#f2f2f2");part(g,2.6,1.2,3,-1,4,0,"glass","#46576d");part(g,0.8,3,0.8,-3.6,1.6,0,"dark","#2f3a49");
          part(g,0.9,0.5,0.9,-3.6,4.6,0,"tug","#c92a2a");const wk=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.45,depthWrite:false}));wk.rotation.x=-Math.PI/2;wk.scale.set(26,6,1);scene.add(wk);
          const [zc,hw]=riverAt(0),sh=zc+hw,P=[[260,sh-260],[170,sh-150],[60,sh-26],[-60,sh-24],[-180,sh-40],[-292,sh-150],[-380,sh-300]],T=plen(P);g.visible=false;wk.visible=false;
          return {t:0,tick(rdt){this.t+=rdt;const s=Math.min(T,this.t*9);const [x,z,ry]=pathAt(P,s);g.visible=wk.visible=true;g.position.set(x,0.05+Math.sin(this.t*1.6)*0.12,z);g.rotation.y=ry;
              g.rotation.z=Math.sin(this.t*1.1)*0.03;wk.position.set(x-Math.cos(ry)*18,0.06,z+Math.sin(ry)*18);wk.rotation.z=ry;return s<T;},stop(){g.visible=wk.visible=false;}};},
        // an operator walks the canal bank east of the intake, stops at the edge; a gator glides in, lunges and takes them
        // under; a splash, a hard hat bobbing on the water, and the gator slides off
        swamp:()=>{const [zc,hw]=riverAt(50),bank=zc+hw,op=grp(),O=figure(op,"#f27a30","#e2c230","",0);op.visible=false;
          const gt=grp();part(gt,3.4,0.42,0.95,0,0,0,"gator","#3f4a32");part(gt,1.6,0.3,0.6,2.4,0.05,0,"gator","#3f4a32");const jaw=part(gt,1.4,0.16,0.56,2.4,-0.05,0,"gator","#56603f");part(gt,2.4,0.3,0.4,-2.8,0,0,"gator","#3f4a32");
          [[0.8,-0.5],[0.8,0.5],[-0.8,-0.5],[-0.8,0.5]].forEach(([a,b])=>part(gt,0.3,0.25,0.3,a,-0.1,b,"gator","#3f4a32"));gt.visible=false;
          const hat=new THREE.Mesh(sphereG,am("hat#e2c230","#e2c230"));hat.scale.set(0.3,0.18,0.3);hat.visible=false;scene.add(hat);
          const ring=new THREE.Mesh(new THREE.RingGeometry(0.8,1,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.6,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
          const EX=48,EZ=bank+1.2;
          return {t:0,tick(rdt){const t=(this.t+=rdt);op.visible=t<15.6;gt.visible=true;
              if(t<9){const x=EX+22-t*22/9;op.position.set(x,H(x,EZ),EZ);op.rotation.y=Math.PI;swing(O,t*5);}else{swing(O,0,0);op.rotation.y=Math.PI/2*(t<12?1:1);}
              // the gator: glides in under the surface, raises its head, lunges
              const gz=t<10?bank-14+t*1.0:t<14.5?bank-4+Math.min(1,(t-10)/4.5)*(t>14?3:1.5):t<15.6?bank-0.5:bank-0.5-(t-15.6)*1.6;
              gt.position.set(EX+(t<15.6?0:-(t-15.6)*0.8),t<12?-0.35:-0.1,gz);gt.rotation.y=Math.PI/2;jaw.rotation.z=t>13.8&&t<15.6?-0.5*Math.abs(Math.sin((t-13.8)*9)):0;
              if(t>14.6&&t<15.6){const k=(t-14.6);op.position.set(EX,H(EX,EZ)-k*2.2,EZ-k*1.8);op.rotation.x=-k*1.2;}
              if(t>15&&t<19){ring.visible=true;const k=t-15;ring.position.set(EX,0.08,bank-1.2);ring.scale.set(1+k*2.2,1+k*2.2,1);ring.material.opacity=0.6*(1-k/4);}else ring.visible=false;
              if(t>16&&t<24){hat.visible=true;hat.position.set(EX+Math.sin(t)*0.4,0.05+Math.sin(t*2.4)*0.06,bank-1.6-(t-16)*0.25);}else hat.visible=false;
              if(t>15.6)gt.visible=t<30;return t<30;},
            stop(){op.visible=gt.visible=hat.visible=ring.visible=false;op.rotation.x=0;}};}};
      // (built once at start-up, hidden, so nothing is created or compiled when one happens; rewound each time)
      const one=SIGHTS[SITE.env]?SIGHTS[SITE.env]():null;let wait=FAST?3:rr2(240,600);G3.sight=()=>{wait=0;};   // (G3.sight(): show one now, for tests)
      if(one)ACT.push(rdt=>{G3.sightT=sight?sight.t:-1;if(sight){if(!sight.tick(rdt)){sight.stop();sight=null;wait=FAST?40:rr2(240,600);}return;}wait-=rdt;if(wait<=0){one.t=0;sight=one;}});}
    G3.actTick=rdt=>{if(!(rdt>0))return;rdt=Math.min(rdt,0.1);for(let k=0;k<ACT.length;k++)ACT[k](rdt);};
    G3.act=ACT.length;}
