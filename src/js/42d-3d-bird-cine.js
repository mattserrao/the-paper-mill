  /* ---- v4.2.4 cut-scene: a bird on the power lines (the "birdline" upset) ----
     When the upset fires in the 3D view the game pauses and the camera cuts away: it rides with a pigeon circling high
     over the mill (a few chirps, the choir starts), chases it down as it folds its wings and dives, then cuts wide on
     the substation as it hits the lines: a blue-white flash, arcs, sparks, a loud bang, the mill goes dark. Feathers
     drift down, the singed bird flaps off trailing smoke, and the camera goes back where it was and the game carries on
     at the speed it had. Everything runs on its own real-time clock (the sim is paused); one bird and one set of
     effects, built once at start-up. Skipped in zen, the autotest and with ?nocine; Skip (or tapping the scene) ends it. */
  {const Q=new URLSearchParams(location.search),NOCINE=Q.has("autotest")||Q.has("nocine"),IMP=10,END=13.4,EZ=k=>k<=0?0:k>=1?1:k*k*(3-2*k);
    const mat=hex=>new StdMat({color:lin0(hex),roughness:0.75}),SPH=new THREE.SphereGeometry(1,14,10),BOX=new THREE.BoxGeometry(1,1,1);
    const part=(p,g,m,sx,sy,sz,x,y,z)=>{const o=new THREE.Mesh(g,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o;};
    // the pigeon (local +x forward), 1.6x life size so it reads on a phone
    const bird=new THREE.Group(),bb=new THREE.Group();bird.add(bb);bird.scale.setScalar(1.6);bird.visible=false;scene.add(bird);
    const GREY=mat("#8d93a0"),NECK=mat("#4f7a6a"),WING=mat("#a3aab8"),BAR=mat("#3a3f48"),BEAK=mat("#e0a030"),EYE=mat("#d4602a");
    part(bb,SPH,GREY,0.3,0.17,0.16,0,0,0);part(bb,SPH,NECK,0.12,0.12,0.12,0.22,0.06,0);part(bb,SPH,GREY,0.09,0.09,0.09,0.32,0.11,0);
    part(bb,new THREE.ConeGeometry(0.03,0.09,6),BEAK,1,1,1,0.43,0.1,0).rotation.z=-Math.PI/2;[-1,1].forEach(s=>part(bb,SPH,EYE,0.018,0.018,0.018,0.36,0.14,s*0.06));
    part(bb,BOX,GREY,0.22,0.03,0.16,-0.36,0,0);part(bb,BOX,BAR,0.06,0.031,0.17,-0.46,0,0);
    const wings=[-1,1].map(s=>{const w=new THREE.Group();w.position.set(0.02,0.06,s*0.1);bb.add(w);part(w,BOX,WING,0.3,0.025,0.5,0,0,s*0.26);part(w,BOX,BAR,0.1,0.027,0.2,-0.08,0,s*0.42);part(w,BOX,BAR,0.06,0.028,0.4,0.04,0,s*0.25);return w;});
    // v6.1 t14: the pigeon is a cut-out card (wings up / down / folded for the dive), turned to face the way it flies
    const card=G3.pigeonCard?G3.pigeonCard():null,_cv=new THREE.Vector3();if(card){card.scale.set(1.25,0.98,1);bird.add(card);bb.visible=false;}
    // the strike: a glow, a halo, jagged arcs, sparks, smoke and feathers
    const gt=(()=>{const c=document.createElement("canvas");c.width=c.height=64;const x=c.getContext("2d"),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.35,"rgba(255,255,255,.55)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
    const spr=(hex,op)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:lin(hex),transparent:true,opacity:op,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}));s.visible=false;scene.add(s);return s;};
    const core=spr("#ffffff",1),halo=spr("#7fb8ff",0.7);
    const arcs=[...Array(7)].map(()=>{const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(new Float32Array(30),3));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:lin("#cfe8ff"),toneMapped:false,transparent:true}));l.visible=false;l.frustumCulled=false;scene.add(l);return l;});
    const sparks=[...Array(40)].map((_,i)=>{const s=spr(i%3?"#bfe3ff":"#ffffff",1);const a=Math.random()*Math.PI*2,e=Math.random()*1.2;s.userData.v=[Math.cos(a)*Math.cos(e)*(4+Math.random()*7),3+Math.random()*8,Math.sin(a)*Math.cos(e)*(4+Math.random()*7)];return s;});
    const smoke=[...Array(8)].map((_,i)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:lin("#4a4f58"),transparent:true,opacity:0,depthWrite:false}));s.visible=false;s.userData.o=[(Math.random()-0.5)*2,(Math.random()-0.5)*2,i*0.25];scene.add(s);return s;});
    const FM=new THREE.MeshBasicMaterial({color:lin0("#c9ced8"),side:THREE.DoubleSide}),feathers=[...Array(10)].map(()=>{const m=new THREE.Mesh(card?new THREE.PlaneGeometry(0.4,0.5):new THREE.PlaneGeometry(0.12,0.4),FM);m.visible=false;m.userData.v=[(Math.random()-0.5)*3,1+Math.random()*2,(Math.random()-0.5)*3,Math.random()*6];scene.add(m);return m;});
    if(card){FM.map=TX.feather;FM.alphaTest=0.5;FM.toneMapped=false;FM.color.copy(lin0("#e4e7ec"));}   // (t14: paper feathers)
    // the overlay: letterbox bars, the flash and a Skip button
    const ov=document.createElement("div");ov.className="cine3d";ov.hidden=true;ov.innerHTML='<i class="lb t"></i><i class="lb b"></i><i class="fl"></i><button type="button" class="skip">Skip</button>';
    ($("view3d")||document.body).appendChild(ov);const fl=ov.querySelector(".fl"),bars=ov.querySelectorAll(".lb");
    let C=null;
    const sub=()=>{const u=G3.scenery&&G3.scenery.util&&G3.scenery.util.substation;return u?[u[0],u[1],3.4]:[74,-10,9.5];};
    function start(){const [sx,sz,sy]=sub(),I=new THREE.Vector3(sx,sy+2.6,sz),cx=-14,cz=5,R=38,away=Math.atan2(cz-sz,cx-sx),a0=away-5.5*0.3;
      // circle high over the mill; at 5.5 s dive from the far side; from 8.5 s a flat run-in over the last 25 m to the lines
      const P5=new THREE.Vector3(cx+Math.cos(away)*R,70,cz+Math.sin(away)*R),d=new THREE.Vector3(I.x-P5.x,0,I.z-P5.z).normalize();
      const A=new THREE.Vector3(I.x-d.x*25,I.y+3,I.z-d.z*25),Pc=new THREE.Vector3(A.x-d.x*12,A.y+6,A.z-d.z*12),wideTh=Math.atan2(-d.z,d.x);
      C={t:0,last:performance.now(),I,A,cx,cz,R,a0,P5,Pc,d,wideTh,was:running,cam:G3.camGet?G3.camGet():null,chirp:[0.8,2.6,4.2],struck:false,arcT:0,pos:new THREE.Vector3(),prev:new THREE.Vector3()};
      running=false;G3.cineHold=true;G3.cineOn=true;document.body.classList.add("cine");ov.hidden=false;bird.visible=true;try{AUDIO.cine.start(IMP);}catch(e){}}
    // where the bird is at time t
    function birdAt(t,out){const c=C;if(t<5.5){const a=c.a0+t*0.3;out.set(c.cx+Math.cos(a)*c.R,70+Math.sin(t*0.9)*2,c.cz+Math.sin(a)*c.R);return 0;}
      if(t<8.5){const u=Math.pow((t-5.5)/3,1.3),v=1-u;out.set(v*v*c.P5.x+2*v*u*c.Pc.x+u*u*c.A.x,v*v*c.P5.y+2*v*u*c.Pc.y+u*u*c.A.y,v*v*c.P5.z+2*v*u*c.Pc.z+u*u*c.A.z);return 1;}
      if(t<IMP){const u=(t-8.5)/(IMP-8.5);out.lerpVectors(c.A,c.I,u);out.y+=Math.sin(u*Math.PI)*0.6;return 1;}
      const k=t-IMP;out.set(c.I.x-c.d.x*(k*5)+Math.sin(k*9)*0.4,c.I.y+0.8+k*2.6+Math.sin(k*13)*0.3,c.I.z-c.d.z*(k*5));return 2;}
    function finish(){if(!C)return;const c=C;C=null;bird.visible=false;[core,halo,...sparks,...smoke,...feathers,...arcs].forEach(o=>o.visible=false);
      ov.hidden=true;fl.style.opacity=0;document.body.classList.remove("cine");G3.cineHold=false;G3.cineOn=false;try{AUDIO.cine.end();}catch(e){}
      if(c.cam&&G3.camSet)G3.camSet(c.cam);if(c.was&&$("v2menu").hidden&&!(S.cards&&S.cards.open)&&!S.over)running=true;}   /* v5.1: stay paused if a card or dialog opened meanwhile */
    ov.querySelector(".skip").addEventListener("click",e=>{e.stopPropagation();if(C&&!C.struck){try{AUDIO.cine.end();AUDIO.cine.strike();}catch(_){}}finish();});
    /* v6.1 t17: set off while a sheet or the stats panel is open (the Upsets list), the cut-scene waits and plays the
       moment it closes, if the bird is still on the lines (it used to be skipped) */
    let pend=0;const SHEETS=".v2sheet.open,.v2top.open";
    G3.birdCine=()=>{if(NOCINE||!G3.on||S.zen||document.hidden||C||afkOn())return;   // (v6.8.3: no cut-scene while the mill is left to run)
  if(document.querySelector(SHEETS)){pend=performance.now();return;}pend=0;   // v5.0.6: not over an open sheet or the stats panel (it hid the panel and ate the clicks); the upset itself still happens
      try{start();}catch(e){console.error("bird cut-scene",e);finish();}};
    const v=new THREE.Vector3();
    G3.cineTick=now=>{if(!C){if(pend&&!document.querySelector(SHEETS)){const t0=pend;pend=0;if(performance.now()-t0<120000&&S.inc.some(i=>i.id==="birdline"))G3.birdCine();}return;}try{const c=C,dt=Math.min(0.1,(now-c.last)/1000);c.last=now;c.t+=dt;const t=c.t;G3.lastMove=performance.now();
        if(c.chirp.length&&t>=c.chirp[0]){c.chirp.shift();try{AUDIO.cine.chirp();}catch(e){}}
        // the bird: position, heading, pitch and wings
        c.prev.copy(c.pos);const ph=birdAt(t,c.pos);birdAt(t+0.05,v);bird.position.copy(c.pos);const vx=v.x-c.pos.x,vy=v.y-c.pos.y,vz=v.z-c.pos.z;
        bird.rotation.set(0,Math.atan2(-vz,vx),0);bb.rotation.z=Math.atan2(vy,Math.hypot(vx,vz))*0.9+(ph===0?Math.sin(t*1.3)*0.05:0);bb.rotation.x=ph===0?-0.35:0;
        const flap=ph===0?(Math.sin(t*7)>0.2?Math.sin(t*14)*0.7:0.1):ph===1?(t<6.3?Math.sin(t*16)*0.6:t<8.5?-1.1:Math.sin(t*18)*0.5):Math.sin(t*24)*0.9;
        wings[0].rotation.x=flap;wings[1].rotation.x=-flap;wings.forEach((w,i)=>{w.rotation.y=ph===1&&t>6.3&&t<8.5?(i?-0.7:0.7):0;});bird.visible=t<IMP+3;if(card){const fold=ph===1&&t>6.3&&t<8.5,dir=screenDir(c.pos,_cv.set(vx,vy,vz));card.frame(fold?2:flap>0?0:1,dir);card.material.rotation=bb.rotation.z*dir;}bird.scale.setScalar(t<8.2?2.2:3);   // (a touch bigger in the wide shot so it reads)
        // the camera: ride along high above the mill, chase the dive, then the wide shot of the lines
        let cam;if(t<5.5){const ox=c.pos.x-c.cx,oz=c.pos.z-c.cz;cam=[c.pos.x,c.pos.z,22,Math.atan2(ox,oz),0.62,c.pos.y];}
        else if(t<8.2){cam=[c.pos.x,c.pos.z,13,Math.atan2(-vx,-vz),0.95,c.pos.y];}
        else{const sk=t>IMP&&t<IMP+0.6?(IMP+0.6-t)*1.2:0;cam=[(c.I.x*2+c.A.x)/3+(Math.random()-0.5)*sk,(c.I.z*2+c.A.z)/3+(Math.random()-0.5)*sk,64,c.wideTh,1.1,4+(Math.random()-0.5)*sk];}
        if(G3.camSet)G3.camSet(cam);
        // letterbox in and out
        const lb=Math.min(EZ(t/0.6),1-EZ((t-(END-0.7))/0.7));bars.forEach(b=>b.style.transform=`scaleY(${lb.toFixed(3)})`);
        // the strike
        if(!c.struck&&t>=IMP){c.struck=true;G3.cineHold=false;try{AUDIO.cine.strike();}catch(e){}}
        const k=t-IMP;fl.style.opacity=k<0?0:k<0.08?1:Math.max(0,0.95*(1-(k-0.08)/0.7)).toFixed(3);
        core.visible=k>=0&&k<1.3;if(core.visible){core.position.copy(c.I);core.scale.setScalar(k<0.15?6+k/0.15*26:32*(1-(k-0.15)/1.15)+4);core.material.opacity=k<0.15?1:Math.max(0,1-(k-0.15)/1.15);}
        halo.visible=k>=0&&k<1.6;if(halo.visible){halo.position.copy(c.I);halo.scale.setScalar(20+k*50);halo.material.opacity=0.75*(1-k/1.6);}
        const arcOn=k>=0&&k<1.4&&((now/55)|0)%3!==0;c.arcT-=dt;
        arcs.forEach((l,i)=>{l.visible=arcOn&&(i<4||k<0.5);if(!l.visible)return;if(c.arcT<=0||k<0.03){const p=l.geometry.attributes.position.array,a=Math.random()*Math.PI*2,r=3+Math.random()*7,ex=c.I.x+Math.cos(a)*r,ez=c.I.z+Math.sin(a)*r,ey=Math.random()*c.I.y;
            for(let q=0;q<10;q++){const f=q/9,j=q===0||q===9?0:1.2;p[q*3]=c.I.x+(ex-c.I.x)*f+(Math.random()-0.5)*j;p[q*3+1]=c.I.y+(ey-c.I.y)*f+(Math.random()-0.5)*j;p[q*3+2]=c.I.z+(ez-c.I.z)*f+(Math.random()-0.5)*j;}l.geometry.attributes.position.needsUpdate=true;}});
        if(c.arcT<=0)c.arcT=0.06;
        sparks.forEach(s=>{const on=k>=0&&k<1.6;s.visible=on;if(!on)return;const u=s.userData.v;s.position.set(c.I.x+u[0]*k,c.I.y+u[1]*k-4.9*k*k,c.I.z+u[2]*k);s.scale.setScalar(0.6+(1-k/1.6)*0.6);s.material.opacity=1-k/1.6;if(s.position.y<0.1)s.visible=false;});
        smoke.forEach(s=>{const u=s.userData.o,kk=k-0.3-u[2];s.visible=kk>0;if(!s.visible)return;s.position.set(c.I.x+u[0]+kk*0.6,c.I.y+kk*2.2,c.I.z+u[1]);s.scale.setScalar(2+kk*3);s.material.opacity=Math.max(0,0.55*(1-kk/3));});
        feathers.forEach(f=>{const u=f.userData.v,kk=k-0.05;f.visible=kk>0&&kk<3.2;if(!f.visible)return;f.position.set(c.I.x+u[0]*kk+Math.sin(kk*3+u[3])*0.4,Math.max(0.05,c.I.y+1+u[1]*kk-0.9*kk*kk*0.6),c.I.z+u[2]*kk);f.rotation.set(kk*3+u[3],kk*2,Math.sin(kk*4+u[3]));});
        if(t>=END)finish();}catch(e){console.error("bird cut-scene",e);finish();}};
    G3.cineSeek=t=>{if(C){C.t=t;C.chirp=C.chirp.filter(x=>x>t);if(t>=IMP&&!C.struck){C.struck=true;G3.cineHold=false;}}};   // (tests and stills)
    G3.cineIMP=IMP;}
