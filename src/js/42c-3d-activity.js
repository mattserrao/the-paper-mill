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
       across the city bay, a gator bites the hand off an operator on the bayou bank (an Amos Moses nod). Purely visual: random timing (not the sim's
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
            focus(){const r=rs.find(r=>r.g.visible)||rs[0];return [r.g.position.x,1.5,r.g.position.z,40];},stop(){rs.forEach(r=>r.g.visible=false);puffs.forEach(p=>p.m.visible=false);}};},
        // Bigfoot steps out of the trees between the highway and the gate, ambles along the edge, stops to look at the mill, and goes back in
        rural:()=>{const g=grp(),F={l:[-1,1].map(s=>part(g,0.45,1.3,0.45,0,0,s*0.32,"bigfoot","#4a3426")),b:part(g,0.9,1.6,1.25,0,1.25,0,"bigfoot","#4a3426"),
              a:[-1,1].map(s=>part(g,0.32,1.5,0.32,0,1.1,s*0.8,"bigfoot","#4a3426")),h:part(g,0.6,0.62,0.6,0.1,2.85,0,"bigfoot","#4a3426")};part(g,0.12,0.25,0.4,0.42,2.95,0,"skin","#8a6a52");g.visible=false;
          const P=[[-152,74],[-142,58],[-131,44],[-128,32],[-140,22],[-153,26]],T=plen(P);
          return {t:0,tick(rdt){this.t+=rdt;const look=this.t>12&&this.t<18,s=Math.min(T,(this.t<12?this.t:look?12:this.t-6)*2.6);const [x,z,ry]=pathAt(P,s);
              g.visible=true;g.position.set(x,H(x,z),z);g.rotation.y=look?Math.atan2(-(5-z),-14-x):ry;swing(F,look?0:this.t*4.2,look?0:1);F.h.rotation.y=look?Math.sin(this.t*1.3)*0.4:0;return s<T;},
            focus(){return [g.position.x,2.2,g.position.z,24];},stop(){g.visible=false;}};},
        // a tug steams in from sea, runs along the waterfront past the mill and the pier, and heads back out, a wake behind it
        urban:()=>{const g=grp();part(g,13,2.2,5,0,-0.6,0,"tug","#c92a2a");part(g,5,2.4,3.6,-1,1.6,0,"tugw","#f2f2f2");part(g,2.6,1.2,3,-1,4,0,"glass","#46576d");part(g,0.8,3,0.8,-3.6,1.6,0,"dark","#2f3a49");
          part(g,0.9,0.5,0.9,-3.6,4.6,0,"tug","#c92a2a");const wk=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.45,depthWrite:false}));wk.rotation.x=-Math.PI/2;wk.scale.set(26,6,1);scene.add(wk);
          const [zc,hw]=riverAt(0),sh=zc+hw,P=[[260,sh-260],[170,sh-150],[60,sh-26],[-60,sh-24],[-180,sh-40],[-292,sh-150],[-380,sh-300]],T=plen(P);g.visible=false;wk.visible=false;
          return {t:0,tick(rdt){this.t+=rdt;const s=Math.min(T,this.t*9);const [x,z,ry]=pathAt(P,s);g.visible=wk.visible=true;g.position.set(x,0.05+Math.sin(this.t*1.6)*0.12,z);g.rotation.y=ry;
              g.rotation.z=Math.sin(this.t*1.1)*0.03;wk.position.set(x-Math.cos(ry)*18,0.06,z+Math.sin(ry)*18);wk.rotation.z=ry;return s<T;},focus(){return [g.position.x,1,g.position.z,55];},stop(){g.visible=wk.visible=false;}};},
        // v4.2.2 (an Amos Moses nod): an operator in a hard hat and hi-vis walks the canal bank east of the intake with a
        // sample bottle, crouches at the edge and reaches down to fill it. A gator has been gliding in, eyes and back
        // just breaking the surface; it lunges, jaws wide, and snaps off the operator's right hand (no gore, just gone),
        // then death-rolls and sinks with it. The operator sits down hard, stares at the stump, throws the other arm up, gets up
        // and runs off along the bank waving it; the bottle bobs off on the water. The gator surfaces again out in the canal, burps
        // and slides away, while a one-armed Cajun poles his pirogue past up the canal. Everything is a function of the
        // scene clock, so any moment can be shown (G3.sightSeek, tests and screenshots).
        swamp:()=>{const [zc,hw]=riverAt(50),bank=zc+hw,EX=48,EZ=bank+1.2,ez=k=>k<=0?0:k>=1?1:k*k*(3-2*k),cl=(t,a,b)=>ez((t-a)/(b-a)),
            bx=(p,w,h,d,x,y,z,k,hex)=>{const m=new THREE.Mesh(cubeG,am(k,hex));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;p.add(m);return m;},
            piv=(p,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;},
            ball=(p,r,x,y,z,k,hex,sy=1)=>{const m=new THREE.Mesh(sphereG,am(k,hex));m.scale.set(r,r*sy,r);m.position.set(x,y,z);p.add(m);return m;};
          const FOC_R=60,SK="#e0b48c",CV="#2f4a6b",GB="#39432e",GS="#4b5739",GL="#b9b38a",GD="#2a3222",TE="#f2eedb";
          // ---- the operator (local +x forward, +z their right) ----
          const op=grp(),hip=piv(op,0,0.92,0);
          const L=[-1,1].map(s=>{const l=piv(hip,0,0,s*0.13);bx(l,0.22,0.44,0.23,0,-0.21,0,"cover",CV);const k=piv(l,0,-0.42,0);bx(k,0.2,0.42,0.21,0,-0.2,0,"cover",CV);bx(k,0.32,0.16,0.25,0.05,-0.42,0,"boot","#4a3424");l.userData.k=k;return l;});
          const up=piv(hip,0,0,0);bx(up,0.32,0.66,0.5,0,0.33,0,"cover",CV);bx(up,0.36,0.46,0.54,0,0.43,0,"vest","#d8ea2c");
          [0.3,0.52].forEach(y=>bx(up,0.37,0.05,0.55,0,y,0,"refl","#e4e8ee"));bx(up,0.34,0.06,0.52,0,0.04,0,"boot","#4a3424");bx(up,0.06,0.15,0.08,0.2,0.56,-0.15,"dark","#2f3a49");
          const hd=piv(up,0,0.72,0);bx(hd,0.11,0.08,0.11,0,0,0,"skin",SK);bx(hd,0.28,0.3,0.27,0,0.19,0,"skin",SK);
          [-1,1].forEach(s=>bx(hd,0.02,0.04,0.04,0.145,0.23,s*0.07,"dark","#1e232b"));bx(hd,0.03,0.04,0.15,0.145,0.13,0,"hair","#5a3a22");
          const hh=piv(hd,0,0.33,0);ball(hh,0.17,0,0.02,0,"hhat","#e2c230",0.72);bx(hh,0.44,0.03,0.38,0.03,0,0,"hhat","#e2c230");
          const A=[-1,1].map(s=>{const a=piv(up,0,0.64,s*0.33);bx(a,0.15,0.6,0.15,0,-0.3,0,"cover",CV);bx(a,0.165,0.06,0.165,0,-0.6,0,"cuff","#24384f");
            const hand=bx(a,0.12,0.14,0.12,0,-0.69,0,"skin",SK);return {a,hand};});
          const bt=piv(A[1].a,0.07,-0.74,0);{const m=new THREE.Mesh(CYLG,am("bottle","#eef2f4"));m.scale.set(0.055,0.18,0.055);bt.add(m);bx(bt,0.07,0.05,0.07,0,0.11,0,"cap","#2a5aa8");}
          const fb=piv(scene,0,0,0);{const m=new THREE.Mesh(CYLG,am("bottle","#eef2f4"));m.scale.set(0.055,0.18,0.055);fb.add(m);bx(fb,0.07,0.05,0.07,0,0.11,0,"cap","#2a5aa8");}
          op.visible=fb.visible=false;
          // ---- the gator (local +x forward): body, belly, flanks, two rows of back scutes, five tail segments with a
          // crest, splayed legs with toes, a head with eye bumps, nostrils, and upper and lower jaws full of teeth ----
          const gt=grp(),gb=piv(gt,0,0,0);
          bx(gb,2.6,0.46,1.1,0,0,0,"gator",GB);bx(gb,2.5,0.3,1.2,0,-0.06,0,"gatorS",GS);bx(gb,2.4,0.14,1.0,0,-0.26,0,"gatorL",GL);
          bx(gb,1.0,0.4,0.92,1.55,0,0,"gator",GB);bx(gb,0.7,0.36,0.82,2.0,0,0,"gator",GB);bx(gb,0.8,0.4,0.95,-1.5,0,0,"gator",GB);
          for(let i=0;i<10;i++){const x=-1.75+i*0.38;[-1,1].forEach(s=>{bx(gb,0.22,0.12+(i%2)*0.05,0.16,x,0.27,s*0.2,"gatorD",GD);if(i%2)bx(gb,0.16,0.08,0.12,x,0.22,s*0.42,"gatorD",GD);});}
          const hd2=piv(gb,2.25,0.03,0);bx(hd2,0.75,0.36,0.78,0.3,0,0,"gator",GB);
          [-1,1].forEach(s=>{ball(hd2,0.13,0.42,0.22,s*0.24,"gator",GB);ball(hd2,0.065,0.47,0.26,s*0.29,"gatorEye","#e8c840");bx(hd2,0.03,0.09,0.03,0.525,0.26,s*0.3,"dark","#1e232b");});
          const uj=piv(hd2,0.62,0.02,0);bx(uj,1.5,0.18,0.56,0.75,0.05,0,"gator",GB);bx(uj,0.45,0.16,0.46,1.6,0.04,0,"gator",GB);
          [-1,1].forEach(s=>{ball(uj,0.055,1.72,0.14,s*0.1,"gatorD",GD);for(let i=0;i<8;i++)bx(uj,0.05,0.1,0.05,0.15+i*0.2,-0.07,s*(i<6?0.25:0.19),"teeth",TE);});
          const lj=piv(hd2,0.62,-0.1,0);bx(lj,1.5,0.13,0.52,0.75,-0.04,0,"gatorL",GL);bx(lj,0.42,0.12,0.42,1.58,-0.04,0,"gatorL",GL);bx(lj,1.45,0.02,0.36,0.76,0.035,0,"gum","#c98473");
          [-1,1].forEach(s=>{for(let i=0;i<7;i++)bx(lj,0.05,0.09,0.05,0.25+i*0.2,0.07,s*(i<5?0.22:0.17),"teeth",TE);});
          const mh=bx(uj,0.12,0.14,0.12,1.0,-0.12,0.08,"skin",SK);mh.visible=false;const bite=piv(uj,1.0,-0.1,0);
          const tail=[];{let tp=gb;[0.82,0.66,0.52,0.38,0.25].forEach((w,k)=>{const s=piv(tp,k?-0.74:-1.9,0,0);bx(s,0.8,0.36-k*0.05,w,-0.4,0,0,"gator",GB);bx(s,0.78,0.08,w*0.9,-0.4,-0.17+k*0.02,0,"gatorL",GL);
              if(k<3)[-1,1].forEach(z=>bx(s,0.3,0.15,0.07,-0.4,0.22-k*0.03,z*w*0.24,"gatorD",GD));else bx(s,0.34,0.15,0.07,-0.4,0.18-k*0.03,0,"gatorD",GD);tail.push(s);tp=s;});}
          const legs=[[1.15,-1],[1.15,1],[-1.15,-1],[-1.15,1]].map(([lx,s])=>{const l=piv(gb,lx,-0.1,s*0.5);bx(l,0.24,0.2,0.5,0,0,s*0.22,"gatorS",GS);const f=piv(l,0,0,s*0.46);
            bx(f,0.2,0.34,0.2,0,-0.15,0,"gatorS",GS);bx(f,0.36,0.06,0.3,0.06,-0.32,0,"gatorS",GS);for(let q=0;q<3;q++)bx(f,0.12,0.04,0.05,0.28,-0.33,(q-1)*0.1,"gatorL",GL);l.userData.s=s;return l;});
          gt.scale.setScalar(0.55);gt.visible=false;
          // ---- the one-armed Cajun in his pirogue, poling past on the far side ----
          const pr=grp();bx(pr,3.6,0.3,0.78,0,0.1,0,"pirogue","#6b4a2f");[-1,1].forEach(s=>{const m=bx(pr,0.56,0.3,0.56,s*1.8,0.1,0,"pirogue","#6b4a2f");m.rotation.y=Math.PI/4;m.scale.set(0.56,0.3,0.56);const n=bx(pr,0.3,0.26,0.3,s*2.1,0.14,0,"pirogue","#6b4a2f");n.rotation.y=Math.PI/4;});bx(pr,3.3,0.06,0.62,0,0.27,0,"pirogueIn","#4a3424");
          const cj=figure(pr,"#7a6a4a","#3a2a20","wide",0.28);cj.a[0].visible=false;
          const pole=new THREE.Mesh(CYLG,am("pole","#8a6a4a"));pole.scale.set(0.04,5.2,0.04);const pp=piv(pr,0.1,1.15,0.38);pp.add(pole);pole.position.y=-1.6;pr.visible=false;
          // ---- water: rings and droplets ----
          const RM=[...Array(7)].map(()=>{const m=new THREE.Mesh(new THREE.RingGeometry(0.8,1,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);return m;});
          const DM=new THREE.MeshBasicMaterial({color:lin0("#dfeee8"),transparent:true,opacity:0.8,depthWrite:false}),
            DR=[...Array(16)].map((_,i)=>{const m=new THREE.Mesh(sphereG,DM);m.scale.setScalar(0.07+((i*37)%5)*0.015);m.visible=false;scene.add(m);const a=i*2.4;
              return {m,t0:i<9?13.8:14.6,v:[Math.cos(a)*(0.8+(i%3)*0.5),2.6+(i%4)*0.7,Math.sin(a)*(0.8+(i%3)*0.5)]};});
          // ---- poses, all from the scene clock ----
          const P0=new THREE.Vector3(EX+0.3,-0.1,bank-4.6),W=new THREE.Vector3(),W2=new THREE.Vector3();let fit=null;
          function poseOp(t){op.rotation.set(0,0,0);hip.position.y=0.92;up.rotation.set(0,0,0);hd.rotation.set(0,0,0);hh.position.y=0.33;L.forEach(l=>{l.rotation.set(0,0,0);l.userData.k.rotation.set(0,0,0);});const K=l=>l.userData.k.rotation;A.forEach(a=>a.a.rotation.set(0,0,0));
            let x=EX,z=EZ;const ar=A[1].a,al=A[0].a;
            if(t<8){x=EX+16-16*t/8;op.rotation.y=Math.PI;const w=Math.sin(t*6);L[0].rotation.z=w*0.5;L[1].rotation.z=-w*0.5;K(L[0]).z=-Math.max(0,-w)*0.7;K(L[1]).z=-Math.max(0,w)*0.7;al.rotation.z=-w*0.4;ar.rotation.z=w*0.4;hip.position.y=0.92+Math.abs(w)*0.03;}
            else if(t<19){op.rotation.y=Math.PI+(Math.PI/2-Math.PI)*cl(t,8,9);
              const c=cl(t,9,10.5),r=cl(t,13.9,14.7);
              hip.position.y=0.92-0.38*c-0.36*r;z=EZ+0.9*r;L[0].rotation.z=1.4*c+0.1*r;K(L[0]).z=-1.4*c*(1-r);L[1].rotation.z=0.35*c*(1-r)+1.5*r;K(L[1]).z=-1.9*c*(1-r);up.rotation.z=-0.6*c+0.95*r;
              ar.rotation.z=1.6*c+0.75*r+(t>10.5&&t<13.9?Math.sin(t*3)*0.08:0)+(t>14.7?Math.sin(t*7)*0.15:0);al.rotation.z=0.8*c-1.4*r+3.3*cl(t,16.5,17.5);al.rotation.x=-0.5*cl(t,16.5,17.5);
              hh.position.y=0.33+0.22*Math.sin(Math.PI*r);hd.rotation.y=-0.45*cl(t,14.8,15.4);hd.rotation.z=0.2*cl(t,14.8,15.4);
              if(t>17.5)hh.rotation.y=Math.sin(t*9)*0.08;}
            else{const g=cl(t,19,20.2),T=Math.max(0,t-20.2),dx=0.995,dz=0.1;op.rotation.y=Math.PI/2+(-0.1-Math.PI/2)*g;
              hip.position.y=0.18+0.74*g;z=EZ+0.9;L.forEach(l=>{l.rotation.z=1.5*(1-g)+0.9*g*(1-cl(t,19.8,20.2));K(l).z=-1.6*g*(1-cl(t,19.8,20.2));});up.rotation.z=0.35*(1-g)+0.15*g;
              x=EX+dx*3.4*T;z+=dz*3.4*T;if(T>0){const w=Math.sin(T*11);L[0].rotation.z=w*0.8;L[1].rotation.z=-w*0.8;K(L[0]).z=-Math.max(0,-w)*1.2;K(L[1]).z=-Math.max(0,w)*1.2;al.rotation.z=-w*0.6;hip.position.y=0.92+Math.abs(w)*0.06;}
              ar.rotation.z=2.35*(1-g)+(2.95+Math.sin(t*9)*0.3)*g;hd.rotation.y=-0.45*(1-g);}
            op.position.set(x,H(x,z),z);A[1].hand.visible=t<13.9;bt.visible=t<13.9;op.visible=t<29.5;}
          function poseGator(t){gt.visible=true;gt.rotation.set(0,-Math.PI/2,0);gb.rotation.set(0,0,0);hd2.rotation.set(0,0,0);uj.rotation.z=0;lj.rotation.z=0;mh.visible=false;
            const tuck=k=>legs.forEach(l=>{l.rotation.y=-l.userData.s*1.0*k;});tail.forEach((s,k)=>{s.rotation.y=Math.sin(t*2.2-k*0.7)*(t<13.2||t>20?0.25:0.1);});
            if(t<13.2){const z=bank-18+13.4*ez(Math.min(1,t/12)),x=EX+0.3+Math.sin(t*0.4)*0.6*(1-cl(t,10,12));gt.position.set(x,-0.1,z);tuck(1);return;}
            if(!fit){poseOp(13.2);op.updateMatrixWorld(true);A[1].hand.getWorldPosition(W);
              gt.position.copy(P0);gb.rotation.z=0.15;hd2.rotation.z=0.15;uj.rotation.z=0.05;gt.updateMatrixWorld(true);bite.getWorldPosition(W2);fit={d:W.clone().sub(W2),h:W.clone()};gb.rotation.z=hd2.rotation.z=0;poseOp(t);}
            if(t<15.8){const k=cl(t,13.2,13.9),j=cl(t,13.9,14.02),r=cl(t,14.4,15.8);
              gb.rotation.z=0.15*k*(1-r);hd2.rotation.z=0.15*k*(1-r)+(t>14.02&&t<14.4?Math.sin(t*40)*0.06:0);uj.rotation.z=(0.62*k)*(1-j)+0.05*j;lj.rotation.z=-0.28*k*(1-j);tuck(1-k);
              gt.position.copy(P0).addScaledVector(fit.d,k*(1-r));gb.rotation.x=r*4*Math.PI;mh.visible=t>=13.9;return;}
            if(t<17.5){gt.position.set(P0.x,-0.1-1.1*cl(t,15.8,17.5),P0.z);tuck(1);mh.visible=true;return;}
            if(t<21){gt.visible=false;return;}
            const k=cl(t,21,28.5);gt.position.set(EX-3-9*k,-0.1-1.2*cl(t,27.5,29),bank-9-5*k);gt.rotation.y=-Math.PI/2-0.9;tuck(1);gt.visible=t<29;}
          function rings(t,gx,gz){const ev=[];
            if(t<12.6)for(let a=Math.max(0,Math.floor((t-2.4)/0.9))*0.9;a<=t;a+=0.9){const z=bank-18+13.4*ez(Math.min(1,a/12))+1.7;ev.push([a,EX+0.3,z,1.6,2.4]);}
            [[12.6,0.6,1.6],[13.6,2.2,2],[14.5,2.6,2.2],[15.2,2.4,2.2],[16.2,1.4,2]].forEach(([a,s,d])=>ev.push([a,P0.x,P0.z+1.6,s,d]));
            for(let a=21;a<28.5;a+=1.3){const k=cl(a,21,28.5);ev.push([a,EX-3-9*k+1.2,bank-9-5*k+1.6,1.2,2.4]);}ev.push([24.4,EX-3-9*cl(24.4,21,28.5)+1.4,bank-9-5*cl(24.4,21,28.5)+2.2,2.2,2.6]);
            let n=0;for(const [a,x,z,s,d] of ev){if(t<a||t>a+d||n>=RM.length)continue;const m=RM[n++],k=(t-a)/d;m.visible=true;m.position.set(x,0.08,z);m.scale.set(0.4+s*k*2,0.4+s*k*2,1);m.material.opacity=0.55*(1-k);}
            for(;n<RM.length;n++)RM[n].visible=false;}
          function drops(t){const o=fit?fit.h:null;for(const d of DR){const dt=t-d.t0;if(!o||dt<0||dt>1.2){d.m.visible=false;continue;}const y=0.1+d.v[1]*dt-4.9*dt*dt;if(y<0){d.m.visible=false;continue;}
              d.m.visible=true;d.m.position.set(o.x+d.v[0]*dt,y,o.z-1+d.v[2]*dt);}}
          function bottle(t){if(t<13.9||!fit){fb.visible=false;return;}fb.visible=t<31;const k=cl(t,13.9,14.3),T=Math.max(0,t-14.3);
            fb.position.set(fit.h.x+T*0.18+Math.sin(t*1.3)*0.05,fit.h.y*(1-k)+0.03*k+Math.sin(t*2.6)*0.03*k,fit.h.z-0.4*k-T*0.12);fb.rotation.set(1.3*k+Math.sin(t*1.7)*0.2*k,0,0.4*k);}
          function pirogue(t){pr.visible=true;const x=EX-6-20*t/11.5,z=zc+hw*0.1;pr.position.set(x,0.02+Math.sin(t*1.4)*0.04,z);pr.rotation.y=Math.PI;pr.rotation.x=Math.sin(t*1.1)*0.02;
            const c=Math.sin(t*1.2);pp.rotation.z=-0.35+c*0.35;cj.a[1].rotation.z=-0.5+c*0.4;}
          // v4.2.2 t4: the cut is short (11.5 s). The scene clock (tau) maps onto the choreography's clock (t): it opens with the
          // operator already at the edge and the gator close, plays the bite at full speed, and hurries the aftermath
          const MAP=[[0,9],[1.2,10.5],[3.2,13.2],[6,16],[7.5,19],[8.7,20.2],[11.5,23]],tm=u=>{for(let i=1;i<MAP.length;i++)if(u<=MAP[i][0]){const a=MAP[i-1],b=MAP[i];return a[1]+(u-a[0])/(b[0]-a[0])*(b[1]-a[1]);}return 23;},END=11.5;
          return {t:0,tick(rdt){const u=(this.t+=rdt),t=tm(u);if(u<0.3)fit=null;poseOp(t);poseGator(t);rings(t);drops(t);bottle(t);pirogue(u);return u<END;},
            // a wide, low shot of the mill from across the canal, held still: the bite happens small in the lower third,
            // as if it were caught in frame by chance ([x,y,z,dist,orbit angle,elevation]: the zen camera keeps the angle)
            focus(){return [EX-2,7,bank+3,FOC_R,2.25,1.36];},
            stop(){op.visible=gt.visible=fb.visible=pr.visible=false;RM.forEach(m=>m.visible=false);DR.forEach(d=>d.m.visible=false);fit=null;}};}};
      // (built once at start-up, hidden, so nothing is created or compiled when one happens; rewound each time)
      const one=SIGHTS[SITE.env]?SIGHTS[SITE.env]():null;let wait=FAST?3:rr2(240,600);G3.sight=()=>{wait=0;};G3.sightSeek=t=>{if(sight)sight.t=t;};   // (G3.sight(): show one now, for tests)
      if(one)ACT.push(rdt=>{G3.sightT=sight?sight.t:-1;if(sight){if(G3.sightHold!=null){sight.t=G3.sightHold;sight.tick(0);return;}if(!sight.tick(rdt)){sight.stop();sight=null;wait=FAST?40:rr2(240,600);}return;}if(G3.zen&&!FAST&&wait>110)wait=rr2(50,110);wait-=rdt;if(wait<=0){one.t=0;sight=one;}});
      // (zen: a sight every minute or two, and the zen camera cuts to it and follows it: 43-3d-frame.js)
      G3.sightFocus=()=>sight&&sight.focus?sight.focus():null;}
    G3.actTick=rdt=>{if(!(rdt>0))return;rdt=Math.min(rdt,0.1);for(let k=0;k<ACT.length;k++)ACT[k](rdt);};
    G3.act=ACT.length;}
