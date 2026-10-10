  /* ---- people ---- */
  const skin=M.skin;
  // v4.1 pass 3: roles. vest: a hi-vis vest material over the torso (with a reflective band); radio: a handset on the belt
  function worker(suit,hatM,role){const p=new THREE.Group();const hip=new THREE.Group();hip.position.y=0.9;p.add(hip);
    const legs=[-0.15,0.15].map(z=>{const l=new THREE.Group();l.position.z=z;const m=new THREE.Mesh(cubeG,M.ink);m.scale.set(0.22,0.9,0.22);m.position.y=-0.45;m.castShadow=true;l.add(m);hip.add(l);return l;});
    const torso=new THREE.Group();hip.add(torso);
    const body=new THREE.Mesh(cubeG,suit);body.scale.set(0.42,0.85,0.6);body.position.y=0.42;body.castShadow=true;torso.add(body);
    const head=new THREE.Mesh(sphereG,skin);head.scale.setScalar(0.23);head.position.y=1.07;torso.add(head);
    const hat=new THREE.Mesh(new SphG(1,10,5,0,Math.PI*2,0,Math.PI/2),hatM);hat.scale.set(0.29,0.24,0.29);hat.position.y=1.13;torso.add(hat);
    const brim=new THREE.Mesh(cubeG,hatM);brim.scale.set(0.2,0.03,0.3);brim.position.set(0.3,1.14,0);torso.add(brim);
    if(role&&role.vest){const v=new THREE.Mesh(cubeG,role.vest);v.scale.set(0.47,0.42,0.65);v.position.y=0.63;torso.add(v);const bd=new THREE.Mesh(cubeG,HIVIS.band);bd.scale.set(0.48,0.06,0.66);bd.position.y=0.56;torso.add(bd);}
    if(role&&role.radio){const r=new THREE.Mesh(cubeG,M.ink);r.scale.set(0.08,0.16,0.1);r.position.set(0.12,0.06,0.33);torso.add(r);const an=new THREE.Mesh(cubeG,M.ink);an.scale.set(0.02,0.14,0.02);an.position.set(0.12,0.2,0.35);torso.add(an);}
    const armM=[],hands=[];const arms=[-0.39,0.39].map(z=>{const a=new THREE.Group();a.position.set(0,0.78,z);const m=new THREE.Mesh(cubeG,suit);m.scale.set(0.17,0.72,0.17);m.position.y=-0.36;a.add(m);armM.push(m);
      const h=new THREE.Mesh(cubeG,skin);h.scale.set(0.13,0.13,0.13);h.position.y=-0.78;a.add(h);hands.push(h);torso.add(a);return a;});
    const armful=new THREE.Mesh(cubeG,paperDS);armful.scale.set(0.7,0.45,0.75);armful.position.set(0.5,0.45,0);armful.visible=false;torso.add(armful);
    const noz=new THREE.Mesh(new CylG(0.07,0.11,0.75,10),M.ink);noz.rotation.z=-Math.PI/2;noz.position.set(0.72,0.62,0);noz.visible=false;torso.add(noz);
    const ext=new THREE.Mesh(new CylG(0.17,0.17,0.62,14),M.bad);ext.position.set(0.48,0.42,0.22);ext.visible=false;torso.add(ext);
    const tool=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.1,0.1),M.metal);tool.position.set(0.55,0.62,-0.3);tool.visible=false;torso.add(tool);
    p.userData={legs,arms,armM,hands,torso,armful,noz,ext,tool,body,ph:Math.random()*6,head:0};scene.add(p);return p;}
  function pose(p,mode,now){const u=p.userData,t=now/1000+u.ph;let leg=0,arm=[0,0],lean=0,bob=0,legB=null;u.armful.visible=false;u.noz.visible=u.ext.visible=u.tool.visible=false;
    if(mode==="run"||mode==="carry"){const s=Math.sin(t*15);leg=0.8*s;arm=mode==="carry"?[-1.3,-1.3]:[-0.9*s,0.9*s];lean=-0.22;bob=Math.abs(s)*0.14;u.armful.visible=mode==="carry";}
    else if(mode==="clean"){const s=Math.sin(t*5),c=Math.cos(t*5);lean=-0.85+0.08*c;arm=[-1.15+0.45*s,-1.0+0.45*s];leg=0.45;bob=-0.08;}
    else if(mode==="dump"){lean=-0.5;arm=[-2,-2];u.armful.visible=Math.sin(t*6)>0;}
    else if(mode==="rethread"){const s=Math.sin(t*7);arm=[-2.7+0.5*s,-2.4-0.5*s];bob=Math.max(0,s)*0.18;}
    else if(mode==="look"){lean=0.45;arm=[-2.9,-2.9];bob=Math.abs(Math.sin(t*12))*0.1;}
    else if(mode==="hose"){arm=[-1.5+0.05*Math.sin(t*20),-1.4];lean=-0.18;leg=0.35;u.noz.visible=true;}
    else if(mode==="ext"){arm=[-1.35+0.08*Math.sin(t*9),-0.5];lean=-0.12;leg=0.25;u.ext.visible=true;}
    else if(mode==="fix"){const ph=Math.floor(t/3.4+u.ph)%3;u.tool.visible=ph!==1;
      if(ph===0){const s=Math.sin(t*6);lean=-0.62;arm=[-1.35+0.22*s,-1.3+0.22*s];leg=0.42;u.tool.rotation.x=s*0.7;bob=-0.05;}            // two-handed ratchet on a bolt
      else if(ph===1){lean=-0.55;arm=[-1.55+0.08*Math.sin(t*2),-0.35];leg=0.62;bob=-0.26;}                                           // crouch and look in
      else{const k=Math.max(0,Math.sin(t*8));lean=-0.5-0.18*k;arm=[-2.5+1.5*k,-1.0];leg=0.4;u.tool.rotation.x=0;}}                 // tap it home
    else if(mode==="relax"){arm=[2.7,2.7];lean=0.5;legB=-1.85;bob=-0.36;}
    else if(mode==="sit"){arm=[-0.9+0.1*Math.sin(t*2),-0.6];lean=0.05;legB=-1.5;bob=-0.36;}
    else if(mode==="smoke"){const s=Math.sin(t*0.9);arm=[s>0.3?-2.5:-0.5,0.05];lean=0.04;}
    else if(mode==="type"){const s=Math.sin(t*14);arm=[-1.05+0.08*s,-1.05-0.08*s];lean=-0.12;}
    else if(mode==="throw"){const ph=(t*1.4)%1,a0=ph<0.55?-0.9-2.1*(ph/0.55):ph<0.7?-3.0+1.8*((ph-0.55)/0.15):-1.2+0.3*((ph-0.7)/0.3);arm=[a0,-0.9];lean=ph<0.55?0.2:-0.35;leg=0.35;u.armful.visible=ph<0.55;}
    else if(mode==="pull"){const s=Math.sin(t*5);arm=[-1.45+0.2*s,-1.45+0.2*s];lean=0.38+0.12*s;leg=0.45;}
    else if(mode==="phone"||mode==="phoneS"){const walkk=mode==="phone",s=walkk?Math.sin(t*7.5):0,texting=((t/5)|0)%2===1;leg=0.42*s;lean=texting?0.12:-0.04;bob=Math.abs(s)*0.04;
      arm=texting?[-1.25+0.04*Math.sin(t*18),-1.25-0.04*Math.sin(t*16)]:[-0.4*s,0];if(!texting)u.call=true;
      if(u.phoneM){if(texting){u.phoneM.position.set(0.52,0.5,0);u.phoneM.rotation.set(0,0,-1.1);}else{u.phoneM.position.set(0.04,1.02,0.27);u.phoneM.rotation.set(0.3,0,0);}}}
    else if(mode==="point"){arm=[-2.1+0.15*Math.sin(t*3),0.05];lean=0.05;}
    else if(mode==="spear"){const s=Math.sin(t*5.7);arm=[-2.05+0.25*s,-1.85+0.25*s];lean=-0.15-0.15*s;leg=0.45;}
    else if(mode==="air"){arm=[-1.45+0.06*Math.sin(t*22),-1.25];lean=-0.12;leg=0.3;u.noz.visible=true;}
    else if(mode==="hi5"){const s=Math.sin(t*12);arm=[-3.0+0.2*s,-0.3];bob=Math.max(0,s)*0.15;lean=0.1;}
    else if(mode==="haul"){const s=Math.sin(t*8);leg=0.4*s;arm=[-2.85,-2.85];bob=Math.abs(s)*0.04;}
    else if(mode==="walk"){const s=Math.sin(t*7.5);leg=0.42*s;arm=[-0.4*s,0.4*s];lean=-0.04;bob=Math.abs(s)*0.04;}
    else if(mode==="inspect"){arm=[-1.55+0.1*Math.sin(t*2),0.05];lean=-0.22;}
    else if(mode==="flail"){const s=Math.sin(t*17);leg=0.95*s;arm=[-2.6+0.9*s,-2.6-0.9*s];lean=-0.3;bob=Math.abs(s)*0.2;}
    else if(mode==="ride"){arm=[-1.15,-1.15];lean=-0.08;legB=-1.25;}
    else{arm=[0.08*Math.sin(t*1.7),-0.08*Math.sin(t*1.7)];}
    u.legs[0].rotation.z=legB!=null?-legB:leg;u.legs[1].rotation.z=legB!=null?-legB:-leg;u.arms[0].rotation.z=-arm[0];u.arms[1].rotation.z=-arm[1];
    // phone to the ear: fold the arm (shortened, swung in toward the head)
    {const c=!!u.call;u.call=false;const L=c?0.33:0.72;u.arms[1].rotation.x=c?2.69:0;u.armM[1].scale.y=L;u.armM[1].position.y=-L/2;u.hands[1].position.y=-L-0.05;}u.torso.rotation.z=lean;p.position.y=bob+(u.ry||0);}
  // walkers steer round the food truck instead of through it: aim for the nearest clear corner first
  const segBox=(ax,az,bx,bz,b)=>{let t0=0,t1=1;const d=[bx-ax,bz-az],o=[ax,az],lo=[b[0],b[2]],hi=[b[1],b[3]];
    for(let k=0;k<2;k++){if(Math.abs(d[k])<1e-9){if(o[k]<lo[k]||o[k]>hi[k])return false;}else{let u0=(lo[k]-o[k])/d[k],u1=(hi[k]-o[k])/d[k];if(u0>u1)[u0,u1]=[u1,u0];t0=Math.max(t0,u0);t1=Math.min(t1,u1);if(t0>t1)return false;}}return true;};
  function avoid(px,pz,tx,tz){const fb=G3.foodBox;if(!fb)return null;const b=[fb[0]-0.5,fb[1]+0.5,fb[2]-0.5,fb[3]+0.5];
    if(px>b[0]&&px<b[1]&&pz>b[2]&&pz<b[3])return null;if(!segBox(px,pz,tx,tz,b))return null;
    let best=null,bd=1e9;for(const cx of [fb[0]-1.1,fb[1]+1.1])for(const cz of [fb[2]-1.1,fb[3]+1.1]){if(Math.hypot(cx-px,cz-pz)<0.3||segBox(px,pz,cx,cz,b))continue;const d=Math.hypot(cx-px,cz-pz)+Math.hypot(tx-cx,tz-cz)+(segBox(cx,cz,tx,tz,b)?20:0);if(d<bd){bd=d;best=[cx,cz];}}
    if(!best){const cx=Math.abs(px-fb[0])<Math.abs(px-fb[1])?fb[0]-1.1:fb[1]+1.1;best=[cx,pz];}return best;}
  function moveP(p,tx,tz,speed,rdt){
    if(p.userData&&p.userData.legs&&rdt>0){const wp=walkPlan(p,tx,tz);if(wp&&wp.length){const q=wp[0],dx=q[0]-p.position.x,dz=q[1]-p.position.z,d=Math.hypot(dx,dz);
        if(d<0.3){wp.shift();}else{const st=Math.min(d,speed*rdt);p.position.x+=dx/d*st;p.position.z+=dz/d*st;p.rotation.y=lerpAng(p.rotation.y,Math.atan2(-dz,dx),Math.min(1,rdt*12));}return false;}}
    const av=avoid(p.position.x,p.position.z,tx,tz);if(av){tx=av[0];tz=av[1];const dx=tx-p.position.x,dz=tz-p.position.z,d=Math.hypot(dx,dz)||1,st=Math.min(d,speed*rdt);
      p.position.x+=dx/d*st;p.position.z+=dz/d*st;p.rotation.y=lerpAng(p.rotation.y,Math.atan2(-dz,dx),Math.min(1,rdt*12));return false;}
    const dx=tx-p.position.x,dz=tz-p.position.z,d=Math.hypot(dx,dz);
    if(d<0.15)return true;const s=Math.min(d,speed*rdt);p.position.x+=dx/d*s;p.position.z+=dz/d*s;p.rotation.y=lerpAng(p.rotation.y,Math.atan2(-dz,dx),Math.min(1,rdt*12));return false;}
  function face(p,x,z,rdt){p.rotation.y=lerpAng(p.rotation.y,Math.atan2(-(z-p.position.z),x-p.position.x),Math.min(1,rdt*8));}
  // operator consoles on the tending-side aisle: wet end, press/dryer, dry end. Each operator's home is a console spot
  const CONSOLES=[58,26,-5];
  {const scC=document.createElement("canvas");scC.width=128;scC.height=80;const x=scC.getContext("2d");x.fillStyle="#13233a";x.fillRect(0,0,128,80);
    x.strokeStyle="#4fd18b";x.lineWidth=2;x.beginPath();for(let i=0;i<=128;i+=8)x.lineTo(i,46+10*Math.sin(i/14));x.stroke();x.strokeStyle="#ffb02e";x.beginPath();for(let i=0;i<=128;i+=8)x.lineTo(i,26+6*Math.cos(i/9));x.stroke();
    x.fillStyle="#9ab3d6";for(let k=0;k<4;k++)x.fillRect(8+k*30,64,22,8);
    const scT=new THREE.CanvasTexture(scC);scT.colorSpace=THREE.SRGBColorSpace;const scMs=CONSOLES.map(()=>new THREE.MeshBasicMaterial({map:scT,toneMapped:false}));
    // v3.0.1: the football game an operator puts on when they kick back at the console in zen mode
    const fbC=document.createElement("canvas");fbC.width=128;fbC.height=80;{const x=fbC.getContext("2d");x.fillStyle="#2f8f3f";x.fillRect(0,0,128,80);
      for(let i=0;i<8;i++){x.fillStyle=i%2?"#2a8239":"#33994a";x.fillRect(i*16,0,16,80);}x.strokeStyle="#ffffff";x.lineWidth=1.5;for(let i=8;i<128;i+=16){x.beginPath();x.moveTo(i,6);x.lineTo(i,74);x.stroke();}
      x.fillStyle="#c33b2c";x.fillRect(0,0,8,80);x.fillStyle="#2c5bc3";x.fillRect(120,0,8,80);
      x.save();x.translate(70,42);x.rotate(-0.4);x.fillStyle="#7a3f17";x.beginPath();x.ellipse(0,0,15,9,0,0,Math.PI*2);x.fill();x.strokeStyle="#fff";x.lineWidth=1.4;x.beginPath();x.moveTo(-6,0);x.lineTo(6,0);x.stroke();
      for(let k=-4;k<=4;k+=2.6){x.beginPath();x.moveTo(k,-2.5);x.lineTo(k,2.5);x.stroke();}x.restore();
      x.fillStyle="rgba(0,0,0,0.55)";x.fillRect(0,0,128,13);x.fillStyle="#fff";x.font="700 10px system-ui,sans-serif";x.fillText("HOME 21  AWAY 17  4Q",6,10);}
    const fbT=new THREE.CanvasTexture(fbC);fbT.colorSpace=THREE.SRGBColorSpace;
    G3.conTV=(ci,on)=>{const m=scMs[ci];if(!m)return;const t=on?fbT:scT;if(m.map!==t){m.map=t;m.needsUpdate=true;}};
    CONSOLES.forEach((cx,ci)=>{const scM=scMs[ci];const g=new THREE.Group();g.position.set(cx,0,13.4);scene.add(g);
      box(2.0,1.0,0.7,M.steel,0,0.5,0,g);const top=box(2.0,0.12,0.75,M.ink,0,1.05,0.05,g,false);top.rotation.x=0.35;
      [-0.5,0.5].forEach(dx=>{box(0.08,0.5,0.08,M.ink,dx,1.35,-0.25,g,false);box(0.85,0.55,0.08,M.ink,dx,1.75,-0.25,g,false);
        const sc=new THREE.Mesh(new THREE.PlaneGeometry(0.76,0.47),scM);sc.position.set(dx,1.75,-0.205);g.add(sc);});
      const bc=new THREE.Mesh(new CylG(0.09,0.09,0.25,10),M.ok);bc.position.set(0.85,1.25,-0.25);g.add(bc);blob(cx,13.4,1.6);});}
  // [station spot, zone x0, zone x1]; the winder operator stays clear of the roll conveyor
  const OPS=[[[57.4,14.3],46,62],[[58.6,14.3],40,56],[[26.6,14.3],29,41],[[25.4,14.3],12,28],[[-4.4,14.3],-1,14],[[-5.6,14.3],-9,3],[[-15.6,14.0],-17.1,-13.2]];
  const HOME=OPS.map(o=>o[0]);
  // paper machine catwalks: tending-side walkway along the dryers with a stair, a crossover bridge, and a headbox platform on the back side
  {const CY=4.2,CZ=13.3;walkway(-3,CZ,28.5,CZ,CY,1.1,[1,1],true);flight([33.6,0,CZ],[28.5,CY,CZ],1.1);
    walkway(14,4.0,14,CZ-0.55,8.8,1.0,[1,1],false);[[13.5,4.0],[14.5,4.0],[13.5,12.8],[14.5,12.8]].forEach(([x,z])=>box(0.16,8.6,0.16,M.steel,x,4.3,z,scene,false));
    [-0.25,0.25].forEach(dx=>box(0.07,4.7,0.07,M.warn,14+dx,CY+2.35,CZ-0.3,scene,false));for(let y=CY+0.3;y<8.8;y+=0.45)box(0.56,0.05,0.06,M.warn,14,y,CZ-0.3,scene,false);
    walkway(53.8,4.9,60.8,4.9,2.4,1.2,[1,0],true);flight([62.6,0,4.9],[60.8,2.4,4.9],1.0);
    G3.pmRoute=[[34.2,0,14.2],[33.6,0,CZ],[28.5,CY,CZ],[20,CY,CZ,3,"inspect"],[8,CY,CZ,3,"inspect"],[-1.5,CY,CZ,2,"look"],[28.5,CY,CZ],[33.6,0,CZ],[34.2,0,14.4]];}
  // chairs at each console; operators kick back when the mill is running sweet
  CONSOLES.forEach(cx=>[-0.6,0.6].forEach(dx=>{const g=new THREE.Group();g.position.set(cx+dx,0,14.75);scene.add(g);box(0.55,0.08,0.55,M.ink,0,0.5,0,g,false);box(0.55,0.6,0.08,M.ink,0,0.85,0.26,g,false);box(0.08,0.5,0.08,M.steel,0,0.25,0,g,false);}));
  // lead ropes for pulling a new forming fabric on from the drive side
  const ropes=[0,1,2,3,4,5,6,7].map(()=>{const m=new THREE.Mesh(new CylG(0.05,0.05,1,6),M.ink);m.visible=false;scene.add(m);return m;});
  const _ra=new THREE.Vector3(),_rb=new THREE.Vector3(),_rup=new THREE.Vector3(0,1,0);
  function rope(m,ax,ay,az,bx,by,bz){_ra.set(ax,ay,az);_rb.set(bx,by,bz);const d=_rb.clone().sub(_ra),L=d.length();m.position.copy(_ra).add(_rb).multiplyScalar(0.5);m.quaternion.setFromUnitVectors(_rup,d.normalize());m.scale.set(1,L,1);m.visible=true;}
  // walk around the headbox end to reach the drive side (and back again) instead of through the machine
  const AROUND=62.5,BACKZ=4.3;
  function goSide(w,gx,gz,sp,rdt){const u=w.userData,tb=gz<6.2,ib=w.position.z<6.2;
    if(u.wp&&u.wpTo!==tb)u.wp=null;
    if(!u.wp&&tb!==ib){u.wpTo=tb;const onLine=Math.abs(w.position.x-AROUND)<0.3;u.wp=tb?[[AROUND,onLine?w.position.z:Math.max(13.8,w.position.z)],[AROUND,BACKZ]]:[[AROUND,onLine?w.position.z:BACKZ],[AROUND,14.8]];}
    while(u.wp&&u.wp.length){if(moveP(w,u.wp[0][0],u.wp[0][1],sp,rdt))u.wp.shift();else return false;}
    u.wp=null;return moveP(w,gx,gz,sp,rdt);}
  const HAY=[[-23.6,14],[-14,13.6],[-24.2,7.5],[-13.2,8.5],[-22.5,4.2],[-15.5,4.2],[-19.5,15.4]];
  const RT=[[27,14.2],[23,14.2],[19,14.2],[15,14.2],[11,14.2],[25,4.1],[17,4.1]];
  const BRKSPOT={reel:[[-8,14.2],[-5.5,14.2],[-3,14.2],[-6.5,4.1],[22,14.2],[17,14.2],[20,4.1]],dryer:RT,
    press:[[40.5,14.2],[38,14.2],[35.5,14.2],[33,14.2],[24,14.2],[19,14.2],[22,4.1]]};
  // follow a fixed list of waypoints (used to walk out round the east end of the hall to stock prep and back)
  // a way round the pulper tub to the foot of the ragger stair
  const ragApproach=w=>{const x=w.position.x,z=w.position.z;if(x<9.5)return [RAG.foot];return z<-11?[[x,-19.6],[RAG.foot[0],-19.6],RAG.foot]:[[x,-7.4],[RAG.foot[0],-7.4],RAG.foot];};
  // walk up (or down) the ragger platform stair; the elevation follows the distance along the flight
  function ragClimb(w,up,rdt){const u=w.userData,[ax,az]=up?RAG.foot:RAG.top,[bx,bz]=up?RAG.top:RAG.foot,L=Math.hypot(bx-ax,bz-az);
    if(up&&!u.ragUp){if(!moveP(w,ax,az,5,rdt))return false;u.ragUp=true;}
    if(!up&&!u.ragUp)return true;
    const done=moveP(w,bx,bz,2.2,rdt),f=clamp(1-Math.hypot(bx-w.position.x,bz-w.position.z)/L,0,1);u.ry=3.4*(up?f:1-f);
    if(done){u.ry=up?3.4:0;if(!up)u.ragUp=false;return true;}return false;}
  function goRoute(w,key,pts,sp,rdt){const u=w.userData;if(u.rk!==key){u.rk=key;u.rp=pts.map(p=>p.slice());}
    while(u.rp.length){if(moveP(w,u.rp[0][0],u.rp[0][1],sp,rdt))u.rp.shift();else return false;}return true;}
  const airHoseM=new StdMat({color:lin0("#d32f2f"),roughness:0.55});
  const airLines=[0,1,2,3,4,5,6].map(()=>{const g=[0,1,2].map(()=>{const m=new THREE.Mesh(new CylG(0.05,0.05,1,8),airHoseM);m.visible=false;scene.add(m);return m;});return g;});
  // a red air hose drooping between the nozzle and the coupling on the machine frame
  function hoseTo(segs,ax,ay,az,bx,by,bz){const P=[[ax,ay,az]];for(const f of [1/3,2/3]){const sag=Math.sin(Math.PI*f)*0.9;P.push([ax+(bx-ax)*f,ay+(by-ay)*f-sag,az+(bz-az)*f]);}P.push([bx,by,bz]);
    segs.forEach((m,i)=>stretch(m,...P[i],...P[i+1]));}
  const hiWho=new Set(),wrapWho=new Set();
  const spears=[0,1,2].map(()=>{const m=new THREE.Mesh(new CylG(0.07,0.07,1,6),M.ink);m.visible=false;scene.add(m);return m;});
  const canX=k=>(872-k*32-600)/10;
  const SITES={shaft:{c:[12,zc],a:"fix",p:[[10,14.4],[12,14.4],[14,14.4],[11,15.4]]},slime:{c:[10,zc],a:"clean",p:[[2,14.2],[8,14.2],[14,14.2],[20,14.2]]},
    winderdown:{c:[-18.7,9.4],a:"fix",p:[[-16.6,12.4],[-16.4,10.4],[-20.9,12.4],[-21,10.4]]}};
  const RTY=[];for(let k=0;k<24;k++)RTY.push([29-(k%12)*2.6,k<12?15.4:3.2]);
  // grawlix speech bubble for the operator who gets the slice wrong
  const slcBubble=(()=>{const c=document.createElement("canvas");c.width=256;c.height=140;const x=c.getContext("2d");
    x.fillStyle="#ffffff";x.strokeStyle="#1c2233";x.lineWidth=6;x.beginPath();x.roundRect?x.roundRect(8,8,240,92,28):x.rect(8,8,240,92);x.fill();x.stroke();
    x.beginPath();x.moveTo(100,98);x.lineTo(118,134);x.lineTo(138,98);x.closePath();x.fill();x.stroke();x.fillStyle="#ffffff";x.fillRect(102,92,34,10);
    x.font="900 44px system-ui,sans-serif";x.textAlign="center";x.textBaseline="middle";const sy="#$%@&!!";[...sy].forEach((ch,k)=>{x.fillStyle=k%2?"#c8281e":"#1c2233";x.fillText(ch,38+k*30,56+(k%2?-5:4));});
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,toneMapped:false}));sp.scale.set(1.9,1.04,1);sp.renderOrder=9;sp.visible=false;scene.add(sp);return sp;})();
  const crew=HOME.map(([x,z])=>{const w=worker(M.stock,M.warn,{radio:true});w.position.set(x,0,z);return w;});G3.followable=()=>crew.concat(spOps||[]);
  const BRK={walk:false,smoke:new Set(),pic:new Set()};
  // follow a 3D route [x,y,z,pauseSeconds,pose]; height is interpolated along each leg, so stairs read as climbing
  function walkRoute(w,R2,st,rdt,now){const u=w.userData;if(!R2||!R2.length)return true;const p=R2[st.ri];if(!p)return true;
    if(st.from===undefined)st.from=[w.position.x,u.ry||0,w.position.z];
    if(st.pt>0){st.pt-=rdt;face(w,p[0],p[2]+(p[4]==="inspect"?-3:0),rdt);pose(w,p[4]||"idle",now);if(st.pt<=0){st.ri++;st.from=[w.position.x,u.ry||0,w.position.z];}return st.ri>=R2.length;}
    const f=st.from,L=Math.hypot(p[0]-f[0],p[2]-f[2])||1e-6,a=moveP(w,p[0],p[2],2.2,rdt),d=Math.hypot(p[0]-w.position.x,p[2]-w.position.z);
    u.ry=a?p[1]:f[1]+(p[1]-f[1])*clamp(1-d/L,0,1);pose(w,"walk",now);
    if(a){if(p[3]){st.pt=p[3];}else{st.ri++;st.from=[p[0],p[1],p[2]];}}return st.ri>=R2.length;}
  const spOps=[0,1].map(k=>{const w=worker(cloth0b("#3f8f62"),M.warn,{vest:HIVIS.orange,radio:true});w.position.set(20+k*3,0,-19.8);return w;});
  const SPGROUND=[[12.5,0,-20.6,3,"inspect"],[15.2,0,-20.8,3,"inspect"],[19.2,0,-20.6,3,"inspect"],[26.6,0,-20.8,4,"inspect"],[24,0,-9.4,3,"look"],[20,0,-19.8]];
  const SPJOB={lwplug:[11.2,-21],cscreen:[15.2,-21],fscreen:[19.2,-21],lcplug:[26.6,-21],hdblow:[23.4,-9.6],thkblow:[42,-21],ragger:[9.4,-7.2],overflow:[20,-17],chestover:[29,-21]};
  // a town resident who sprints down the front aisle, jukes at the winder and runs back out
  const runnerW=worker(new StdMat({color:lin0("#e2508f"),roughness:0.7}),new StdMat({color:lin0("#3a2a1e"),roughness:0.9}));runnerW.visible=false;
  const RUN={on:false,x:0,z:0,dir:-1,t0:0,until:0,seen:null};const RX0=72,RX1=-20,RSP=9;
  const helpers=[];
  const EP={hay:null,brk:null};let seenHay=-1,seenBrk=-1;
  G3.yardFrozen=false;

