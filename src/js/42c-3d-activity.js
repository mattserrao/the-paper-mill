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
    {const Q=new URLSearchParams(location.search),FAST=Q.has("sight");
      let sight=null;const rr2=(a,b)=>a+Math.random()*(b-a);
      // a person-shaped figure (operator, rider): legs, body, arms, head, a hat
      const figure=(g,body,hat,hatK,y0=0,big=1)=>{const p={};p.l=[-1,1].map(s=>part(g,0.2*big,0.8*big,0.22*big,0,y0,s*0.14*big,"dark","#2f3a49"));p.b=part(g,0.3*big,0.7*big,0.5*big,0,y0+0.8*big,0,"body"+body,body);
        p.a=[-1,1].map(s=>part(g,0.16*big,0.62*big,0.16*big,0,y0+0.86*big,s*0.33*big,"body"+body,body));p.h=part(g,0.28*big,0.28*big,0.28*big,0,y0+1.52*big,0,"skin","#e0b48c");
        if(hat)p.hat=part(g,hatK==="wide"?0.75:0.36,0.12,hatK==="wide"?0.75:0.36,0,y0+1.78*big,0,"hat"+hat,hat);if(hat&&hatK==="wide")part(g,0.34,0.24,0.34,0,y0+1.86,0,"hat"+hat,hat);return p;};
      // ---- v4.2.3 shared builders for the sights (all built once at start-up, hidden) ----
      const BX=(p,w,h,d,x,y,z,k,hex)=>{const m=new THREE.Mesh(cubeG,am(k,hex));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;p.add(m);return m;},
        PIV=(p,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;},
        BALL=(p,r,x,y,z,k,hex,sy=1)=>{const m=new THREE.Mesh(sphereG,am(k,hex));m.scale.set(r,r*sy,r);m.position.set(x,y,z);p.add(m);return m;},
        EZ=k=>k<=0?0:k>=1?1:k*k*(3-2*k),CL=(t,a,b)=>EZ((t-a)/(b-a));
      // a person (local +x forward, +z their right) with knees, boots, hands and a hat; o: shirt, legs, hat ("cowboy"/"hard"/null), hatc, vest, scarf
      function person(p,o){const SKN=o.skin||"#e0b48c",root=PIV(p,0,0,0),hip=PIV(root,0,0.92,0);
        const L=[-1,1].map(s=>{const l=PIV(hip,0,0,s*0.13);BX(l,0.22,0.44,0.23,0,-0.21,0,"pl"+o.legs,o.legs);const k=PIV(l,0,-0.42,0);BX(k,0.2,0.42,0.21,0,-0.2,0,"pl"+o.legs,o.legs);
          BX(k,0.32,0.16,0.25,0.05,-0.42,0,"boot"+(o.boot||"#4a3424"),o.boot||"#4a3424");l.userData.k=k;return l;});
        const up=PIV(hip,0,0,0);BX(up,0.32,0.66,0.5,0,0.33,0,"ps"+o.shirt,o.shirt);if(o.vest)BX(up,0.36,0.46,0.54,0,0.43,0,"pv"+o.vest,o.vest);BX(up,0.34,0.06,0.52,0,0.04,0,"boot#4a3424","#4a3424");
        if(o.scarf)BX(up,0.1,0.14,0.3,0.15,0.64,0,"scarf"+o.scarf,o.scarf);
        const hd=PIV(up,0,0.72,0);BX(hd,0.11,0.08,0.11,0,0,0,"skin",SKN);BX(hd,0.28,0.3,0.27,0,0.19,0,"skin",SKN);[-1,1].forEach(s=>BX(hd,0.02,0.04,0.04,0.145,0.23,s*0.07,"dark","#1e232b"));
        if(o.hat==="cowboy"){BX(hd,0.64,0.03,0.58,0,0.34,0,"hat"+o.hatc,o.hatc);BX(hd,0.3,0.16,0.27,0,0.43,0,"hat"+o.hatc,o.hatc);}
        else if(o.hat==="hard"){BALL(hd,0.17,0,0.35,0,"hhat"+o.hatc,o.hatc,0.72);BX(hd,0.44,0.03,0.38,0.03,0.33,0,"hhat"+o.hatc,o.hatc);}
        const A=[-1,1].map(s=>{const a=PIV(up,0,0.64,s*0.33);BX(a,0.15,0.6,0.15,0,-0.3,0,"ps"+o.shirt,o.shirt);const hand=BX(a,0.12,0.14,0.12,0,-0.68,0,"skin",SKN);return {a,hand};});
        const K=l=>l.userData.k.rotation;return {root,hip,L,up,hd,A,K};}
      const walkP=(P,ph,k=1)=>{const w=Math.sin(ph);P.L[0].rotation.z=w*0.5*k;P.L[1].rotation.z=-w*0.5*k;P.K(P.L[0]).z=-Math.max(0,-w)*0.7*k;P.K(P.L[1]).z=-Math.max(0,w)*0.7*k;
        P.A[0].a.rotation.z=-w*0.4*k;P.A[1].a.rotation.z=w*0.4*k;P.hip.position.y=0.92+Math.abs(w)*0.03*k;};
      // a pool of soft puffs (dust, smoke) driven from a list of [age, x, y, z] each frame
      // (t18: the sights' dust and smoke are paper clouds, like the stack's plume; ?softfx = the old soft balls)
      const PAPP=!/[?&]softfx/.test(location.search)&&TX&&TX.paper;
      function puffPool(n,hex,op){const out=[...Array(n)].map(()=>{const m=PAPP?new THREE.Sprite(G3.papReg(new THREE.SpriteMaterial({map:TX.paper,color:lin0(hex),transparent:true,opacity:op,depthWrite:false,toneMapped:false}))):new THREE.Mesh(sphereG,new THREE.MeshBasicMaterial({color:lin0(hex),transparent:true,opacity:op,depthWrite:false}));m.visible=false;scene.add(m);return m;});
        out.show=(list,life,s0,s1,op2=op)=>{let i=0;for(const [a,x,y,z] of list){if(i>=n)break;if(a<0||a>life)continue;const m=out[i++],k=a/life,s=s0+(s1-s0)*k;m.visible=true;m.position.set(x,y,z);if(PAPP){m.scale.set(s*1.5,s*1.5,1);m.material.opacity=Math.min(1,(1-k)*2.2);}else{m.scale.set(s,s*0.7,s);m.material.opacity=op2*(1-k);}}for(;i<n;i++)out[i].visible=false;};
        out.hide=()=>out.forEach(m=>m.visible=false);return out;}
      const SIGHTS={
        // v4.2.3 desert: a held shot of the mill from the flats to the south; three cowboys canter across the foreground,
        // dust behind them, the last one swinging a lasso. Detailed horses (neck, head, ears, mane, tail, saddle and
        // blanket, jointed legs with hooves) and riders (hats, bandanas, vests, jointed legs in the stirrups).
        desert:()=>{const Z0=84,X0=40,V=6.2,END=11.5,CX=16;
          function horse(p,col,mane,blanket){const g=PIV(p,0,0,0),bd=PIV(g,0,0,0),dk="#2a2a2a";
            BX(bd,1.9,0.72,0.62,0,1.35,0,"hc"+col,col);BX(bd,0.5,0.62,0.56,0.95,1.38,0,"hc"+col,col);BX(bd,0.55,0.66,0.6,-0.9,1.42,0,"hc"+col,col);BX(bd,1.5,0.14,0.5,0,0.99,0,"hc"+col,col);
            BX(bd,0.72,0.06,0.72,0.02,1.74,0,"bl"+blanket,blanket);BX(bd,0.52,0.12,0.5,0,1.8,0,"saddle","#5a3a22");BX(bd,0.06,0.16,0.06,0.26,1.92,0,"saddle","#5a3a22");
            const nk=PIV(bd,1.05,1.55,0);nk.rotation.z=0.85;BX(nk,0.95,0.36,0.3,0.42,0,0,"hc"+col,col);BX(nk,0.85,0.09,0.09,0.42,0.2,0,"mn"+mane,mane);
            const hp=PIV(nk,0.9,0,0);hp.rotation.z=-1.5;BX(hp,0.62,0.3,0.27,0.3,0,0,"hc"+col,col);BX(hp,0.22,0.24,0.23,0.64,-0.02,0,"mz",dk);
            [-1,1].forEach(s=>{BX(hp,0.06,0.17,0.06,0.02,0.2,s*0.08,"hc"+col,col);BX(hp,0.04,0.05,0.03,0.25,0.06,s*0.14,"dark","#1e232b");});
            const tl=PIV(bd,-1.17,1.62,0);BX(tl,0.12,0.8,0.18,-0.06,-0.38,0,"mn"+mane,mane);
            const legs=[[0.78,-0.2,0],[0.78,0.2,0.18],[-0.75,-0.2,0.5],[-0.75,0.2,0.68]].map(([lx,lz,o])=>{const u=PIV(bd,lx,1.08,lz);BX(u,0.19,0.55,0.19,0,-0.27,0,"hc"+col,col);
              const k=PIV(u,0,-0.54,0);BX(k,0.13,0.5,0.13,0,-0.25,0,"hc"+col,col);BX(k,0.16,0.1,0.18,0.02,-0.52,0,"hoof",dk);return {u,k,o};});
            return {g,bd,nk,hp,tl,legs};}
          const rs=[0,1,2].map(k=>{const h=horse(grp(),["#6b4a2f","#8a5a3a","#c9a26a"][k],["#2a1d14","#3a2a1c","#efe2c2"][k],["#a8322c","#2a5aa8","#c9a24a"][k]);
            const rd=PIV(h.bd,-0.05,0.94,0),P=person(rd,{shirt:["#a8322c","#5b6270","#d9c49c"][k],legs:"#2f4a6b",hat:"cowboy",hatc:["#6b4a2f","#3a2a20","#efe2c2"][k],vest:k===1?"#6b4a2f":null,scarf:["#2a5aa8","#a8322c","#a8322c"][k]});
            P.L.forEach((l,i)=>{l.rotation.z=1.2;l.rotation.x=(i?1:-1)*0.42;P.K(l).z=-1.25;});P.up.rotation.z=-0.12;P.A.forEach(a=>a.a.rotation.z=0.9);
            let lasso=null;if(k===2){lasso=PIV(P.A[1].a,0,-0.7,0);const m=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.025,4,28),am("rope","#c9a26a"));m.rotation.x=Math.PI/2;m.position.y=0.15;lasso.add(m);}
            h.g.parent.visible=false;G3.liveMark&&G3.liveMark(h.g.parent,3.3,1.7);return {h,P,lasso,root:h.g.parent,off:[0,1.6,3.4][k],lat:[0,2.4,-1.8][k]};});
          const dust=puffPool(36,"#b89a6a",0.45);
          const at=(r,u)=>{const s=u*V-r.off*V*0.42;return [X0-s,Z0+r.lat];};
          return {t:0,tick(rdt){const u=(this.t+=rdt);const L=[];
              for(const r of rs){const [x,z]=at(r,u),on=x<X0+2&&x>X0-90;r.root.visible=on;if(!on)continue;r.root.position.set(x,H(x,z),z);r.root.rotation.y=Math.PI;
                const ph=u*9.5+r.off*2;r.h.legs.forEach(l=>{l.u.rotation.z=0.6*Math.sin(ph+l.o*Math.PI*2);l.k.rotation.z=-Math.max(0,Math.sin(ph+l.o*Math.PI*2+1.2))*0.9;});
                r.h.bd.position.y=Math.abs(Math.sin(ph))*0.14;r.h.bd.rotation.z=Math.sin(ph)*0.05;r.h.nk.rotation.z=0.85+Math.sin(ph)*0.1;r.h.tl.rotation.z=-0.7+Math.sin(ph*0.5)*0.15;
                r.P.up.rotation.z=-0.12+Math.sin(ph)*0.05;if(r.lasso){r.P.A[1].a.rotation.z=2.9;r.P.A[1].a.rotation.x=-0.2;r.lasso.rotation.y=u*9;}
                for(let a=0;a<2.4;a+=0.2){const [px,pz]=at(r,u-a);if(px<X0+2)L.push([a+((u*5)%0.2),px+1.2,H(px,pz)+0.3+a*0.3,pz]);}}
              dust.show(L,2.4,0.5,2.2);return u<END;},
            focus(){return [CX,7,Z0-1,60,0.35,1.36];},stop(){rs.forEach(r=>r.root.visible=false);dust.hide();}};},
        // v4.2.3 valley: a held shot of the mill from the far bank of the river. Bigfoot wades across below the mill, away
        // from the camera, rings spreading from his legs; mid-river he turns his head and shoulders to look back straight
        // down the lens without breaking stride (the famous film), then wades on. Two-tone fur, crest, brow, face, long
        // jointed arms, big feet.
        rural:()=>{const g=grp(),FUR="#4a3426",FD="#3a281c",FACE="#7a5a44",root=PIV(g,0,0,0),hip=PIV(root,0,1.15,0);
          const L=[-1,1].map(s=>{const l=PIV(hip,0,0,s*0.24);BX(l,0.42,0.62,0.42,0,-0.3,0,"bf",FUR);const k=PIV(l,0,-0.58,0);BX(k,0.36,0.56,0.36,0,-0.27,0,"bf",FUR);BX(k,0.64,0.14,0.36,0.12,-0.6,0,"bfd",FD);l.userData.k=k;return l;});
          const up=PIV(hip,0,0,0);BX(up,0.75,0.5,0.85,0,0.25,0,"bf",FUR);BX(up,0.85,0.75,1.05,0.05,0.85,0,"bf",FUR);BX(up,0.6,0.32,0.95,-0.1,1.25,0,"bfd",FD);BX(up,0.08,0.5,0.6,0.46,0.8,0,"bfd",FD);
          const hd=PIV(up,0.15,1.36,0);BX(hd,0.5,0.52,0.5,0,0.24,0,"bf",FUR);BX(hd,0.3,0.18,0.3,-0.08,0.56,0,"bfd",FD);BX(hd,0.06,0.3,0.36,0.26,0.18,0,"bfface",FACE);BX(hd,0.1,0.08,0.42,0.27,0.35,0,"bfd",FD);
          [-1,1].forEach(s=>BX(hd,0.03,0.05,0.07,0.3,0.27,s*0.09,"dark","#1e232b"));
          const A=[-1,1].map(s=>{const a=PIV(up,0.05,1.2,s*0.6);BX(a,0.27,0.66,0.27,0,-0.32,0,"bf",FUR);const e=PIV(a,0,-0.62,0);BX(e,0.23,0.62,0.23,0,-0.3,0,"bf",FUR);BX(e,0.2,0.26,0.15,0,-0.7,0,"bfface",FACE);a.userData.e=e;return a;});
          g.visible=false;G3.liveMark&&G3.liveMark(root,2.3,1.6);
          // he wades the river below the mill, north to south, away from the camera on the far bank, and looks back
          const XB=4,[zc,hw]=riverAt(XB),Z0=zc-hw+1.5,Z1=zc+hw+1,END=11.5,V=(Z1-Z0)/END,hy=-Math.PI/2;
          const CAM=[XB+2,zc+3,60,Math.PI-0.3,1.3];   // [x,z,r,th,ph]: from the north bank, looking south across the river at the mill
          const RG=[...Array(6)].map(()=>{const m=new THREE.Mesh(new THREE.RingGeometry(0.8,1,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);return m;});
          const yAt=z=>{const q=(z-zc)/hw;return Math.abs(q)<1?Math.min(H(XB,z),-1.15*Math.sqrt(1-q*q)):H(XB,z);};
          return {t:0,tick(rdt){const u=(this.t+=rdt),z=Z0+u*V,x=XB+Math.sin(u*0.4)*0.6,ph=u*2.6,w=Math.sin(ph),wet=Math.abs((z-zc)/hw)<1;
              g.visible=true;root.position.set(x,yAt(z),z);root.rotation.y=hy;
              L[0].rotation.z=w*0.4;L[1].rotation.z=-w*0.4;L[0].userData.k.rotation.z=-Math.max(0,-w)*0.6;L[1].userData.k.rotation.z=-Math.max(0,w)*0.6;
              A[0].rotation.z=-w*0.5;A[1].rotation.z=w*0.5;A.forEach(a=>{a.userData.e.rotation.z=0.25;a.rotation.x=(a===A[0]?-1:1)*0.18*(wet?1:0.3);});hip.position.y=1.15+Math.abs(w)*0.05;
              // the look: head and shoulders swing round toward the camera, hold, swing back, without breaking stride
              const cx=CAM[0]+Math.sin(CAM[3])*60,cz=CAM[1]+Math.cos(CAM[3])*60;let cy=Math.atan2(-(cz-z),cx-x)-hy;cy=Math.atan2(Math.sin(cy),Math.cos(cy));cy=Math.max(-1.6,Math.min(1.6,cy));
              const lk=CL(u,4.6,5.4)*(1-CL(u,7.4,8.2));up.rotation.set(0,Math.sin(ph)*0.1+lk*cy*0.5,-0.18);hd.rotation.y=lk*cy*0.5;
              // wading: rings spread from his legs
              let n=0;for(let a=0;a<2.4&&n<RG.length;a+=0.5){const a2=a+(u%0.5),zz=Z0+(u-a2)*V,q=(zz-zc)/hw;if(Math.abs(q)>0.97||u-a2<0)continue;const m=RG[n++],k=a2/2.4;
                m.visible=true;m.position.set(x,0.08,zz);m.scale.set(0.6+k*3,0.6+k*3,1);m.material.opacity=0.5*(1-k);}for(;n<RG.length;n++)RG[n].visible=false;return u<END;},
            focus(){return [CAM[0],6,CAM[1],CAM[2],CAM[3],CAM[4]];},stop(){g.visible=false;RG.forEach(m=>m.visible=false);}};},
        // v4.2.3 city: a held shot of the waterfront mill from out in the bay. A harbour tug steams past in the foreground
        // towing a barge of bales toward the mill's quay: black hull and red boot-top, tyre fenders and a bow pudding,
        // white deckhouse and wheelhouse, mast and radar, buff stack with a red band puffing smoke, a deckhand aft, a
        // tow line, and white water at the bow and in the wake.
        urban:()=>{const [zc,hw]=riverAt(0),sh=zc+hw,ZT=sh-26,X0=46,V=3.8,END=11.5,TOW=9,BK="#1e2228",RD="#a8322c",WH="#eef0f2";
          const tug=grp(),hl=PIV(tug,0,0,0);BX(hl,9,1.0,3.6,0,0.25,0,"tugH",BK);{const m=BX(hl,2.55,1.0,2.55,4.5,0.25,0,"tugH",BK);m.rotation.y=Math.PI/4;}
          BX(hl,9.2,0.28,3.66,-0.05,-0.18,0,"tugR",RD);BX(hl,8.6,0.1,3.4,0,0.78,0,"deck","#7a5a44");[-1,1].forEach(s=>BX(hl,8.6,0.26,0.12,0,0.9,s*1.77,"tugW",WH));BX(hl,0.12,0.26,3.5,-4.3,0.9,0,"tugW",WH);BX(hl,0.6,0.7,2.0,5.9,0.25,0,"tyre","#2f3a49");
          for(let i=0;i<6;i++)[-1,1].forEach(s=>{const m=new THREE.Mesh(CYLG,am("tyre","#2f3a49"));m.scale.set(0.34,0.24,0.34);m.rotation.x=Math.PI/2;m.position.set(-3+i*1.2,0.45,s*1.86);hl.add(m);});
          BX(hl,3.6,1.4,2.6,0.8,1.45,0,"tugW",WH);BX(hl,2.3,1.2,2.4,1.4,2.75,0,"tugW",WH);BX(hl,2.35,0.4,2.45,1.4,2.95,0,"glass","#46576d");BX(hl,2.6,0.12,2.7,1.4,3.4,0,"tugR",RD);
          BX(hl,0.12,2.2,0.12,1.2,4.5,0,"steel","#5b6270");BX(hl,0.12,0.08,1.2,1.2,4.3,0,"steel","#5b6270");BX(hl,0.9,0.08,0.14,1.2,5.0,0,"dark","#2f3a49");
          BX(hl,0.8,1.6,1.0,-0.7,2.6,0,"buff","#d9b25a");BX(hl,0.82,0.3,1.02,-0.7,3.0,0,"tugR",RD);BX(hl,0.82,0.22,1.02,-0.7,3.45,0,"tugH",BK);
          BX(hl,0.45,0.6,0.45,-3.6,1.05,0,"steel","#5b6270");{const m=new THREE.Mesh(CYLG,am("rope","#c9a26a"));m.scale.set(0.35,1.2,0.35);m.rotation.x=Math.PI/2;m.position.set(-2.6,1.1,0);hl.add(m);}
          {const m=new THREE.Mesh(new THREE.TorusGeometry(0.3,0.07,6,16),am("buoy","#f27a30"));m.position.set(0.2,1.6,1.31);hl.add(m);}
          const dh=person(PIV(hl,-2.3,0.75,0.8),{shirt:"#2f4a6b",legs:"#2f3a49",hat:"hard",hatc:"#f27a30",vest:"#f27a30"});
          const bg=grp();BX(bg,16,1.2,6.5,0,0.1,0,"barge","#5b6270");BX(bg,16.1,0.3,6.6,0,-0.1,0,"rust","#8a4a2a");
          for(let i=0;i<4;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++){BX(bg,1.6,1.0,1.25,-5.4+i*3.6,1.2+k*1.02,(j-0.5)*2.8,"bale","#a7784a");BX(bg,1.62,0.06,1.27,-5.4+i*3.6,1.2+k*1.02,(j-0.5)*2.8,"dark","#2f3a49");}
          const line=new THREE.Mesh(CYLG,am("rope","#c9a26a"));scene.add(line);
          const wk=[...Array(3)].map((_,i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:[0.5,0.35,0.3][i],depthWrite:false}));m.rotation.x=-Math.PI/2;scene.add(m);return m;});
          const smoke=puffPool(9,"#c8ccd2",0.4);[tug,bg,line,...wk].forEach(o=>o.visible=false);G3.liveMark&&(G3.liveMark(tug,6.4,2.6),G3.liveMark(bg,8.8,1.4));
          const Y=new THREE.Vector3(0,1,0),A0=new THREE.Vector3(),B0=new THREE.Vector3();
          return {t:0,tick(rdt){const u=(this.t+=rdt),x=X0-u*V,bx=x+4.5+TOW+8,bob=Math.sin(u*1.6)*0.1;
              [tug,bg,line,...wk].forEach(o=>o.visible=true);tug.position.set(x,0.05+bob,ZT);tug.rotation.set(0,Math.PI,Math.sin(u*1.1)*0.025);
              bg.position.set(bx,0.1+Math.sin(u*1.3+1)*0.06,ZT+0.4);bg.rotation.set(0,Math.PI,Math.sin(u*0.9)*0.015);
              A0.set(x+4.6,1.1,ZT);B0.set(bx-8,0.9,ZT+0.4);const d=B0.clone().sub(A0),l=d.length();line.position.copy(A0).addScaledVector(d,0.5);line.position.y-=0.35;line.scale.set(0.05,l,0.05);line.quaternion.setFromUnitVectors(Y,d.normalize());
              wk[0].position.set(x+11,0.07,ZT);wk[0].scale.set(14,4.5,1);wk[1].position.set(x-5.4,0.07,ZT);wk[1].scale.set(1.6,4.2,1);wk[2].position.set(bx+12,0.07,ZT+0.4);wk[2].scale.set(10,6.5,1);
              const sm=[];for(let a=0;a<4.5;a+=0.5){const a2=a+(u%0.5),px=x+0.7+a2*V*0.85+a2*0.8;sm.push([a2,px,3.7+a2*1.4,ZT-a2*0.5]);}smoke.show(sm,4.5,0.5,2.6);
              walkP(dh,0,0);dh.A[0].a.rotation.z=0.5+Math.sin(u*2)*0.2;dh.hd.rotation.y=-0.8;return u<END;},
            focus(){return [X0-22,7,ZT+6,64,Math.PI+0.3,1.36];},stop(){[tug,bg,line,...wk].forEach(o=>o.visible=false);smoke.hide();}};},
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
          gt.scale.setScalar(0.55);gt.visible=false;G3.liveMark&&G3.liveMark(gt,3.0,0.2);
          // ---- the one-armed Cajun in his pirogue, poling past on the far side ----
          const pr=grp();bx(pr,3.6,0.3,0.78,0,0.1,0,"pirogue","#6b4a2f");[-1,1].forEach(s=>{const m=bx(pr,0.56,0.3,0.56,s*1.8,0.1,0,"pirogue","#6b4a2f");m.rotation.y=Math.PI/4;m.scale.set(0.56,0.3,0.56);const n=bx(pr,0.3,0.26,0.3,s*2.1,0.14,0,"pirogue","#6b4a2f");n.rotation.y=Math.PI/4;});bx(pr,3.3,0.06,0.62,0,0.27,0,"pirogueIn","#4a3424");
          const cj=figure(pr,"#7a6a4a","#3a2a20","wide",0.28);cj.a[0].visible=false;
          const pole=new THREE.Mesh(CYLG,am("pole","#8a6a4a"));pole.scale.set(0.04,5.2,0.04);const pp=piv(pr,0.1,1.15,0.38);pp.add(pole);pole.position.y=-1.6;pr.visible=false;G3.liveMark&&(G3.liveMark(pr,2.8,1.2),G3.liveMark(op,1.4,1.0));
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
      /* v6.1 t18: each figure of a sight is drawn as a live cut-out (42f): a picture of the model as it stands, retaken 8
         times a second, with the paper edge. Marked here (R: radius of the picture, cy: its centre height); ?softfx = 3D */
      const LIVEK=!/[?&]softfx/.test(location.search);G3.liveMark=(o,R,cy)=>{if(LIVEK&&o){o.userData.cut="live";o.userData.live={R,cy};G3.liveWant=(G3.liveWant||0)+1;}};
      const one=SIGHTS[SITE.env]?SIGHTS[SITE.env]():null;let wait=FAST?3:rr2(240,600),zenSeen=false;/* zen: one sight per map (the zen map rotation reloads the page) */G3.sight=()=>{wait=0;};G3.sightSeek=t=>{if(sight)sight.t=t;};   // (G3.sight(): show one now, for tests)
      if(one)ACT.push(rdt=>{G3.sightT=sight?sight.t:-1;if(sight){if(G3.sightHold!=null){sight.t=G3.sightHold;sight.tick(0);return;}if(!sight.tick(rdt)){if(G3.zen)zenSeen=true;sight.stop();sight=null;wait=FAST?40:rr2(240,600);}return;}if(G3.zen&&!FAST){if(zenSeen)return;if(wait>110)wait=rr2(50,110);}wait-=rdt;if(wait<=0){one.t=0;sight=one;}});
      // (zen: a sight every minute or two, and the zen camera cuts to it and follows it: 43-3d-frame.js)
      G3.sightFocus=()=>sight&&sight.focus?sight.focus():null;}
    G3.actTick=rdt=>{if(!(rdt>0))return;rdt=Math.min(rdt,0.1);for(let k=0;k<ACT.length;k++)ACT[k](rdt);};
    G3.act=ACT.length;}
