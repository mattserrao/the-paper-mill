  /* ---- ambient life: office, tours, managers, office walkers, birds, food truck (no effect on the game) ---- */
  // v3.3: facade textures for the office and the maintenance shop: framed windows on a regular grid (lined up with the doors),
  // glass with a sky reflection, mullions and transoms, half-drawn blinds, sills, and the building sign, all on one plane per wall
  G3.winMats=G3.winMats||[];
  function facade(W,H,wins,sign,doorX){const ppm=48,c=document.createElement("canvas");c.width=Math.round(W*ppm);c.height=Math.round(H*ppm);const x=c.getContext("2d"),Y=v=>c.height-v*ppm;
    wins.forEach(([cx,y0,w,h],k)=>{const L=cx*ppm-w*ppm/2,T=Y(y0+h),Wp=w*ppm,Hp=h*ppm,f=0.07*ppm;
      x.fillStyle="#2b3240";x.fillRect(L-f,T-f,Wp+2*f,Hp+2*f);                                         // frame
      const g=x.createLinearGradient(L,T,L+Wp,T+Hp);g.addColorStop(0,"#9fc3dd");g.addColorStop(0.45,"#cfe3f0");g.addColorStop(0.55,"#7fa6c4");g.addColorStop(1,"#5d7f9c");x.fillStyle=g;x.fillRect(L,T,Wp,Hp);
      x.fillStyle="rgba(255,255,255,0.35)";x.beginPath();x.moveTo(L+Wp*0.15,T);x.lineTo(L+Wp*0.32,T);x.lineTo(L+Wp*0.12,T+Hp);x.lineTo(L,T+Hp);x.lineTo(L,T+Hp*0.75);x.closePath();x.fill();   // reflection
      const bl=0.25+0.35*((k*37)%10)/10;x.fillStyle="rgba(238,236,228,0.92)";x.fillRect(L,T,Wp,Hp*bl);x.strokeStyle="rgba(150,148,140,0.6)";x.lineWidth=1;for(let yy=T+3;yy<T+Hp*bl;yy+=4){x.beginPath();x.moveTo(L,yy);x.lineTo(L+Wp,yy);x.stroke();}
      x.fillStyle="#2b3240";x.fillRect(L+Wp/2-f*0.45,T,f*0.9,Hp);x.fillRect(L,T+Hp*0.32-f*0.4,Wp,f*0.8);                 // mullion + transom
      x.fillStyle="#e9ebee";x.fillRect(L-f*1.6,T+Hp+f,Wp+f*3.2,f*1.3);x.fillStyle="rgba(0,0,0,0.25)";x.fillRect(L-f*1.6,T+Hp+f*2.3,Wp+f*3.2,f*0.5);   // sill
      });
    if(doorX!=null){x.fillStyle="#2b3240";x.fillRect(doorX*ppm-0.85*ppm,Y(2.42),1.7*ppm,0.12*ppm);}                // door head trim
    if(sign){const [sx,sy,sw,sh,txt]=sign;x.fillStyle="#1c2233";x.fillRect(sx*ppm-sw*ppm/2,Y(sy+sh),sw*ppm,sh*ppm);x.fillStyle="#ffffff";x.font=`800 ${Math.round(sh*ppm*0.62)}px "Plus Jakarta Sans",system-ui,sans-serif`;x.textAlign="center";x.textBaseline="middle";x.fillText(txt,sx*ppm,Y(sy+sh/2)+1);}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
    const m=new THREE.MeshStandardMaterial({map:t,alphaTest:0.5,roughness:0.35,metalness:0.1,emissiveMap:t,emissive:new THREE.Color(0)});G3.winMats.push(m);
    return new THREE.Mesh(new THREE.PlaneGeometry(W,H),m);}
  const OFF={x0:49,x1:61,z0:24,z1:30,door:[53,23.7]};
  {const ow=mat("g-wall",{roughness:0.6}),oh=4.4;const o=box(OFF.x1-OFF.x0,oh,OFF.z1-OFF.z0,ow,(OFF.x0+OFF.x1)/2,oh/2,(OFF.z0+OFF.z1)/2);edges(o);blob((OFF.x0+OFF.x1)/2,(OFF.z0+OFF.z1)/2,8);
    box(OFF.x1-OFF.x0+0.4,0.35,OFF.z1-OFF.z0+0.4,M.brand,(OFF.x0+OFF.x1)/2,oh+0.17,(OFF.z0+OFF.z1)/2);
    // windows on a 2.2 m grid centred on the door (x 53), so front and back line up; at the front the door takes one bay and the vending machine another
    {const W=OFF.x1-OFF.x0,H=oh-0.1,X=[50.8,53,55.2,57.4,59.6],win=(xs)=>xs.map(wx=>[wx-OFF.x0,1.2,1.4,1.1]);
     const fr=facade(W,H,win(X.filter(v=>v!==53&&v!==50.8)).map(([cx,...r])=>[W-cx,...r]),[W-(56.3-OFF.x0),3.05,3.2,0.72,"OFFICE"],W-(OFF.door[0]-OFF.x0));fr.rotation.y=Math.PI;fr.position.set((OFF.x0+OFF.x1)/2,H/2,OFF.z0-0.035);scene.add(fr);
     const bk=facade(W,H,win(X),[(OFF.x0+OFF.x1)/2-OFF.x0,3.05,3.2,0.72,"OFFICE"]);bk.position.set((OFF.x0+OFF.x1)/2,H/2,OFF.z1+0.035);scene.add(bk);}
    box(1.5,2.3,0.12,M.ink,OFF.door[0],1.15,OFF.z0-0.05,scene,false);box(2.4,0.12,1.2,M.brand,OFF.door[0],2.55,OFF.z0-0.6,scene,false);
    box(1.6,0.04,OFF.z0-20.1,M.slab,OFF.door[0],0.06,(OFF.z0+20.1)/2,scene,false);}
  // vending machine by the office door
  const VEND={x:50.4,z:23.1,user:-1};
  {box(1.1,2.0,0.8,cloth0("#d8343b"),VEND.x,1.0,VEND.z+0.35);const pn=new THREE.Mesh(new THREE.PlaneGeometry(0.7,1.3),new THREE.MeshBasicMaterial({color:lin0("#cfe8ff"),toneMapped:false}));
    pn.position.set(VEND.x-0.1,1.15,VEND.z-0.06);pn.rotation.y=Math.PI;scene.add(pn);box(0.25,0.5,0.05,M.ink,VEND.x+0.35,1.2,VEND.z-0.06,scene,false);box(0.7,0.18,0.05,M.ink,VEND.x-0.1,0.3,VEND.z-0.06,scene,false);}
  const whiteHat=mat("panel"),cloth=h=>new StdMat({color:lin0(h),roughness:0.8});
  const STUDENT=["#e46b5b","#5b8de4","#59b98a","#e4b85b","#a57be0","#e47fb3","#4fb3c4"].map(cloth),SUIT=cloth("#2a2f3c"),OFFICE=[cloth("#8fb4d8"),cloth("#d9d2c4"),cloth("#b9c99b")];
  function cloth0(h){return new StdMat({color:lin0(h),roughness:0.6});}
  const pool=[];
  function person(suit,hat,phone){let w=pool.find(p=>!p.visible&&!p.userData.busy&&p.userData.suit===suit);
    if(!w){w=worker(suit,hat);w.userData.suit=suit;pool.push(w);if(suit===SUIT)tailor(w);if(phone){const ph=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.2,0.11),M.ink);ph.position.set(0.05,1.0,0.36);w.userData.torso.add(ph);w.userData.phoneM=ph;}}
    w.userData.busy=true;w.visible=true;w.position.set(OFF.door[0],0,OFF.door[1]);return w;}
  // managers: slimmer jacket over a white shirt, red tie, charcoal trousers and black shoes (instead of a plain dark block)
  const shirtM=cloth("#f4f2ee"),tieM=cloth("#b3262d"),trouM=cloth("#3a3f4b"),shoeM=cloth("#141518");
  function tailor(w){const u=w.userData,T=u.torso;u.body.scale.set(0.36,0.8,0.56);u.body.position.y=0.44;
    const sh=new THREE.Mesh(cubeG,shirtM);sh.scale.set(0.02,0.36,0.2);sh.position.set(0.185,0.64,0);T.add(sh);
    const tie=new THREE.Mesh(cubeG,tieM);tie.scale.set(0.025,0.4,0.075);tie.position.set(0.2,0.6,0);T.add(tie);
    [-1,1].forEach(sd=>{const l=new THREE.Mesh(cubeG,SUIT);l.scale.set(0.02,0.32,0.06);l.position.set(0.19,0.7,sd*0.105);l.rotation.x=sd*0.35;T.add(l);});
    const col=new THREE.Mesh(cubeG,shirtM);col.scale.set(0.3,0.06,0.34);col.position.set(0.02,0.85,0);T.add(col);
    u.legs.forEach(l=>{l.children[0].material=trouM;l.children[0].scale.set(0.2,0.9,0.2);const sh2=new THREE.Mesh(cubeG,shoeM);sh2.scale.set(0.32,0.1,0.18);sh2.position.set(0.06,-0.86,0);l.add(sh2);});
    u.armM.forEach(m=>m.scale.x=m.scale.z=0.15);}
  function free(w){w.visible=false;w.userData.busy=false;}
  const AIS=16.5,parties=[];let ambT={tour:25,mgr:45,office:8,birds:15,food:35};
  // a party walks a path [x,z,stop seconds,act]; followers keep formation behind the leader and gather round at the stops
  function party(kind,members,path,walk){parties.push({kind,members,path,i:0,wait:0,walk});}
  G3.mgrLead=()=>{for(const P2 of parties)if(P2.kind==="mgr"&&!P2.home&&P2.members[0]&&P2.members[0].visible)return P2.members[0];return null;};
  function mgrNear(x,z,r){for(const P2 of parties)if(P2.kind==="mgr")for(const m of P2.members)if(m.visible&&Math.hypot(m.position.x-x,m.position.z-z)<r)return true;return false;}
  function startTour(){const lead=person(M.brand,whiteHat),n=5+Math.floor(Math.random()*2),st=[];
    for(let k=0;k<n;k++)st.push(person(STUDENT[k%STUDENT.length],whiteHat));
    party("tour",[lead,...st],[[OFF.door[0],AIS,0],[48,AIS,4,"point"],[34.5,AIS,4,"point"],[18,AIS,4,"point"],[-6,AIS,4,"point"],[-14,AIS,3,"point"],[20,AIS+0.6,0],[OFF.door[0],AIS+0.6,0],[OFF.door[0],OFF.door[1],0]],"walk");}
  function startMgr(){const a=person(SUIT,whiteHat),b=person(SUIT,whiteHat);
    party("mgr",[a,b],[[OFF.door[0],AIS-0.3,0],[30,AIS-0.3,3,"point"],[-8,AIS-0.3,2.5,"inspect"],[OFF.door[0],AIS+0.3,0],[OFF.door[0],OFF.door[1],0]],"walk");}
  function startOffice(){const c=CONSOLES[Math.floor(Math.random()*CONSOLES.length)],w=person(OFFICE[Math.floor(Math.random()*3)],whiteHat);
    party("office",[w],[[OFF.door[0],AIS,0],[c+(Math.random()<0.5?-1.6:1.6),14.6,3.5,"inspect"],[OFF.door[0],AIS,0],[OFF.door[0],OFF.door[1],0]],"walk");}
  function partyUpdate(P2,rdt,now){const L=P2.members[0],pt=P2.path[P2.i];
    if(!pt){P2.members.forEach(free);return false;}
    let stopped=false;
    if(moveP(L,pt[0],pt[1],P2.kind==="mgr"?1.9:1.7,rdt)){if(P2.wait<(pt[2]||0)){P2.wait+=rdt;stopped=true;}else{P2.i++;P2.wait=0;}}
    const a=L.rotation.y,fx=Math.cos(a),fz=-Math.sin(a);
    if(stopped){face(L,L.position.x,zc,rdt);pose(L,pt[3]==="phone"?"phoneS":(pt[3]||"idle"),now);}else pose(L,P2.walk,now);
    P2.members.slice(1).forEach((m,k)=>{let tx,tz;
      if(P2.kind==="mgr"){tx=L.position.x-fz*1.0;tz=L.position.z+fx*1.0;}
      else if(stopped){const ang=(k/(P2.members.length-2||1)-0.5)*2.2;tx=L.position.x+Math.sin(ang)*2.1;tz=L.position.z+0.9+Math.cos(ang)*0.9;}
      else{const row=Math.floor(k/2)+1,side=k%2?0.55:-0.55;tx=L.position.x-fx*row*1.0-fz*side;tz=L.position.z-fz*row*1.0+fx*side;}
      const arr=moveP(m,tx,tz,P2.kind==="mgr"?2.2:2.6,rdt);
      if(arr&&stopped){face(m,L.position.x+(P2.kind==="tour"?0:0),zc,rdt);pose(m,P2.kind==="mgr"?"phoneS":(k%3===0?"inspect":"idle"),now);}
      else if(arr&&P2.kind==="mgr"){m.rotation.y=L.rotation.y;pose(m,"phoneS",now);}else pose(m,P2.walk==="phone"?"phone":"walk",now);});
    return true;}
  // birds: a little flock crossing the hall under the roof
  const BIRDS=[];let flock=null;const birdM=new StdMat({color:lin0("#3b3f4a"),roughness:0.8,side:THREE.DoubleSide});
  for(let k=0;k<6;k++){const g=new THREE.Group();const b=new THREE.Mesh(sphereG,birdM);b.scale.set(0.32,0.13,0.13);g.add(b);
    const wg=new THREE.PlaneGeometry(0.22,0.55);wg.translate(0,0,0.28);const w1=new THREE.Mesh(wg,birdM),w2=new THREE.Mesh(wg,birdM);w2.rotation.y=Math.PI;
    const p1=new THREE.Group(),p2=new THREE.Group();p1.add(w1);p2.add(w2);g.add(p1,p2);w1.rotation.x=-Math.PI/2;w2.rotation.x=-Math.PI/2;g.userData={p1,p2,ph:Math.random()*6};g.visible=false;scene.add(g);BIRDS.push(g);}
  function startBirds(){const n=3+Math.floor(Math.random()*4),dir=Math.random()<0.5?-1:1;flock={x:dir<0?72:-26,dir,z:4+Math.random()*10,n,offs:BIRDS.map(()=>[Math.random()*3,Math.random()*2.5-1.2,Math.random()*1.5])};}
  // food truck parks out front; operators drift over for food
  const FOOD=G3.FOOD={open:false,id:0,x:33,z:32.5,state:"off",t:0,spot(i){return [this.x-2.2+(i%4)*1.5,35.2+(i>=4?1.0:0)];}};
  const truck=new THREE.Group();scene.add(truck);truck.visible=false;
  {const cols=["#f2b51d","#e4572e","#2ec4b6","#e84393"],bc=cloth(cols[Math.floor(Math.random()*cols.length)]);
    box(5.6,2.6,2.4,bc,0.4,1.75,0,truck);box(1.9,1.9,2.3,bc,-3.1,1.4,0,truck);box(0.1,0.9,2.0,M.wind,-4.06,1.8,0,truck,false);
    box(3.0,1.1,0.1,M.ink,0.6,2.05,1.22,truck,false);const aw=box(3.6,0.08,1.3,M.bad,0.6,2.85,1.75,truck,false);aw.rotation.x=0.35;box(3.0,0.1,0.5,M.steel,0.6,1.45,1.45,truck,false);
    [[-3,1],[-3,-1],[2.2,1],[2.2,-1]].forEach(([x,z])=>cylZ(0.42,0.3,M.ink,x,0.42,z*1.1,16,truck));
    const c=document.createElement("canvas");c.width=256;c.height=64;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,256,64);x.fillStyle="#1c2233";x.font='800 38px "Plus Jakarta Sans",system-ui,sans-serif';x.textAlign="center";x.textBaseline="middle";
    x.fillText(["TACOS","BBQ","PIEROGI","BURGERS","PHO"][Math.floor(Math.random()*5)],128,34);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(3,0.75),new THREE.MeshBasicMaterial({map:t}));sg.position.set(0.6,3.45,0.2);truck.add(sg);box(3.1,0.85,0.08,M.ink,0.6,3.45,0.13,truck,false);}
  const FL={seen:null,until:0};
  const pigeon=BIRDS[5],PG={seen:null,t0:0};
  // weather particles around the camera target
  const WXP=(()=>{const n=2600,g=new THREE.BufferGeometry(),pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=R()*80;pos[i*3+1]=Math.random()*40;pos[i*3+2]=R()*80;}
    g.setAttribute("position",new THREE.BufferAttribute(pos,3));const m=new THREE.PointsMaterial({color:0xffffff,size:0.7,transparent:true,opacity:0.8,depthWrite:false});
    const p=new THREE.Points(g,m);p.frustumCulled=false;p.visible=false;scene.add(p);
    const rg=new THREE.BufferGeometry(),rp=new Float32Array(n*6);rg.setAttribute("position",new THREE.BufferAttribute(rp,3));
    const rm=new THREE.LineBasicMaterial({color:lin0("#d6e2ee"),transparent:true,opacity:0.6,depthWrite:false});const rl=new THREE.LineSegments(rg,rm);rl.frustumCulled=false;rl.visible=false;scene.add(rl);
    const wxN=Math.min(n,(G3.GFX&&G3.GFX.wx)||1000);g.setDrawRange(0,wxN);rg.setDrawRange(0,wxN*2);G3.wxRange=k=>{const q=Math.min(n,k);g.setDrawRange(0,q);rg.setDrawRange(0,q*2);};return {p,g,pos,m,n,rg,rp,rm,rl};})();
  scene.fog=new THREE.Fog(0xb3bbcb,600,3000);
  const SKY_DAY=new THREE.Color(),SKY_NIGHT=lin0("#232b44"),SKY_RAIN=lin0("#8c94a2"),SKY_FOG=lin0("#c9ced6"),SKY_DUST=lin0("#c9a86b"),tmpC=new THREE.Color();let fogK=0,wxK=0,envAcc=0,dustK=0;
  function envUpdate(rdt,now){const out=S.inc.some(i=>i.id==="lightning");
    const hr=((S.t+360)/60)%24,ss=v=>v*v*(3-2*v),day=hr<12?ss(clamp((hr-5.2)/1.6,0,1)):ss(clamp((20.2-hr)/1.6,0,1));
    const wx=S.wx||"clear";fogK+=((wx==="fog"?0.45:wx==="snow"?0.12:wx==="rain"?0.06:0)-fogK)*Math.min(1,rdt*0.8+0.01);
    wxK+=((wx==="rain"||wx==="snow"?1:0)-wxK)*Math.min(1,rdt*0.6+0.01);
    // v4.1: a desert dust storm (G3.dustK) and a city brownout (G3.brownK) colour the sky and sag the lights
    dustK+=((G3.dustK||0)-dustK)*Math.min(1,rdt*0.7+0.01);const bk=G3.brownK==null?1:G3.brownK;
    if(!out){hemi.intensity=LEG*baseHemi*(0.3+0.7*day)*(1-0.05*wxK)*(1-0.25*dustK);sun.intensity=LEG*baseSun*(0.1+0.9*day)*(1-0.18*Math.max(wxK,fogK))*(1-0.55*dustK);
      SKY_DAY.set(skyHex).convertSRGBToLinear();tmpC.copy(SKY_DAY).lerp(wx==="fog"?SKY_FOG:SKY_RAIN,Math.max(wxK*0.25,fogK*0.5)).lerp(SKY_NIGHT,1-day).lerp(SKY_DUST,dustK*(0.35+0.5*day));
      if(scene.background&&scene.background.isColor)scene.background.copy(tmpC);else scene.background=tmpC.clone();scene.fog.color.copy(tmpC);}
    {const d=camera.position.distanceTo(target);scene.fog.near=d*(0.9+4*(1-fogK))*(1-0.92*dustK);scene.fog.far=d*(3.4+8*(1-fogK))*(1-0.86*dustK);if(G3.zen&&document.body.dataset.zs!=="none"){scene.fog.near*=0.45;scene.fog.far*=0.55;}}
    const night=1-day;if(!G3.nightL){
      // v2.8.4: no point lights (every pixel paid for all 10 of them, day and night); each fixture throws a soft additive pool of light on the floor instead
      const gT=spriteTex((x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.35,"rgba(255,255,255,0.55)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,w);});
      G3.nightL=[[-10,11,9.1],[12,11,9.1],[34,11,9.1],[56,11,9.1],[31.2,PH+4.25,-17.5],[39,PH+4.25,-12.5],[16,9,-18],[-21,7,-13],[-36,7,23],[57,5,-22]].map(([x,y,z],i)=>{
        const deck=i===4||i===5,D=deck?11:i<4?16:13,fy=deck?PH+0.14:0.07;
        const p=new THREE.Mesh(new THREE.PlaneGeometry(D,D),new THREE.MeshBasicMaterial({map:gT,color:0xffd9a0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,opacity:0}));
        p.rotation.x=-Math.PI/2;p.position.set(x,fy,z);p.renderOrder=2;p.visible=false;scene.add(p);
        const f=new THREE.Mesh(new CylG(0.5,0.7,0.3,12),new THREE.MeshBasicMaterial({color:0xfff1cf}));f.position.set(x,y+0.2,z);f.visible=false;scene.add(f);return {p,f,k:deck?0.55:i<4?0.22:0.35};});}
    G3.nightL.forEach(l=>{l.p.material.opacity=l.k*night*bk;l.p.visible=night>0.05;l.f.visible=night>0.2;});G3.nightK=night;
    // v3.2.0: red aviation beacons on top of the boiler stack and the fog fan stack; small lamps on the disk thickener
    if(!G3.beacons){const gl=spriteTex((x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.3,"rgba(255,255,255,0.5)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,w);},64);
      const lamp=(x,y,z,col,rb,sz)=>{const b=new THREE.Mesh(new THREE.SphereGeometry(rb,10,8),new THREE.MeshBasicMaterial({color:col,toneMapped:false}));b.position.set(x,y,z);b.visible=false;scene.add(b);
        const h=new THREE.Sprite(new THREE.SpriteMaterial({map:gl,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,opacity:0}));h.scale.set(sz,sz,1);h.position.set(x,y,z);h.visible=false;scene.add(h);return {b,h};};
      const fan=G3.fogFan?G3.fogFan.top:[49.5,20.2,-4.2];
      G3.beacons=[lamp(ENV.stack[0],ENV.stack[1]+0.25,ENV.stack[2],0xff1a10,0.3,6),lamp(fan[0],fan[1]-0.05,fan[2]+1.25,0xff1a10,0.2,4),lamp(fan[0],fan[1]-0.05,fan[2]-1.25,0xff1a10,0.2,4)];
      // thickener: warm lamps along both rails of the vat, plus a green "running" lamp and an amber one at the drive end
      const TY2=PH+2.6+0.12;G3.thkL=[];[31.8,33.3,34.8,36.3].forEach(x=>[-1,1].forEach(sd=>G3.thkL.push(lamp(x,TY2,-15+sd*2.05,0xffd58a,0.09,1.5))));
      G3.thkL.push(lamp(37.7,PH+1.25,-15.6,0x4cff7a,0.1,1.6),lamp(37.7,PH+1.25,-14.4,0xffa62e,0.1,1.6));}
    {const on=night>0.25,bl=0.5+0.5*Math.sin(performance.now()/1000*Math.PI*0.9),k=night*(0.25+0.75*bl*bl);
      G3.beacons.forEach(l=>{l.b.visible=l.h.visible=on;l.h.material.opacity=k;l.b.material.color.setRGB(0.4+0.6*bl,0.02+0.05*bl,0.02);});
      const run=S.M.pulperDown?0.25:1;G3.thkL.forEach((l,i)=>{l.b.visible=l.h.visible=on;l.h.material.opacity=night*(i<8?1:run);});}
    if(G3.fogFan&&rdt>0){const F=G3.fogFan,down=S.inc.some(i=>i.id==="fogfan"),k=down?0:(S.pm==="run"?1:0.35);F.spin+=(k-F.spin)*Math.min(1,rdt*0.8);F.rot.rotation.y+=rdt*F.spin*14;
      if(Math.random()<rdt*9*k)emitA("steam",F.top[0]+R()*0.5,F.top[1],F.top[2]+R()*0.5,R()*0.7+0.5,3.0+Math.random()*1.8,R()*0.7,3.4,2.0+Math.random()*1.6,"#f4f6f8",0.6);}G3.spiderFrame&&G3.spiderFrame(rdt);M.wind.emissive=M.wind.emissive||new THREE.Color();M.wind.emissive.copy(lin0("#ffcf7a")).multiplyScalar(0.85*night*bk);if(G3.winMats)G3.winMats.forEach(m=>m.emissive.copy(M.wind.emissive).multiplyScalar(0.7));
    ENV.lampHead.color.copy(lin0("#9aa3b2")).lerp(lin0("#fff2c4"),night*bk);ENV.lampPool.opacity=0.32*night*bk;
    ENV.pudM.opacity=0.55*(S.wet||0);ENV.riverTex.offset.x=(ENV.riverTex.offset.x-rdt*0.02)%1;
    ENV.bridge.rotation.y-=rdt*0.12;
    // steam plume grows with production and dies when the boiler trips
    const boil=S.inc.some(i=>i.id==="boiler"),pr=clamp((S.rates.prod||0)/35,0,1.4);if(!boil&&G3.POP)G3.POP.lever.rotation.z=0;
    if(!boil&&rdt>0&&Math.random()<rdt*(2+10*pr))emitA("steam",ENV.stack[0]+R()*0.6,ENV.stack[1],ENV.stack[2]+R()*0.6,1.2+R(),2.5+Math.random()*1.5,R()*0.6,4+3*pr,3+4*pr,"#ffffff",0.55);
    if(rdt>0){for(const [x,z] of ENV.aer)if(Math.random()<rdt*6)emitA("steam",x+R()*0.6,1.4,z+R()*0.6,R()*1.5,1.5,R()*1.5,0.8,0.8,"#ffffff",0.6);
      if(Math.random()<rdt*8)emitA("drop",ENV.outfall[0]+R()*0.3,ENV.outfall[1]+0.5,ENV.outfall[2],R(),1.5,-1.5,0.6,0.28,"#9ec3d6",0.8);}
    const perm=S.inc.some(i=>i.id==="permit");ENV.wwM.color.copy(perm?ENV.wwBad:ENV.wwBase);if(ENV.wwM2)ENV.wwM2.color.copy(ENV.wwM.color);
    // parking fills for the day shift and thins out at night
    carsUpdate(rdt,hr);
    // the train: arrives, sits while the cars are unloaded, then leaves
    // the train eases in, spots its cars at the mill, opens the boxcar doors, then pulls back out
    const tr=ENV.train;if(rdt>0){tr.t-=rdt;tr.v=tr.v||0;const STOP=-17,AW=-200;
      if(tr.state==="away"&&tr.t<=0){tr.state="in";tr.g.position.x=AW;tr.v=8;}
      else if(tr.state==="in"){const d=STOP-tr.g.position.x;tr.v=Math.min(8,Math.sqrt(Math.max(0,2*1.1*d))+0.15);tr.g.position.x=Math.min(STOP,tr.g.position.x+tr.v*rdt);if(d<0.02){tr.state="wait";tr.t=35;tr.v=0;}}
      else if(tr.state==="wait"&&tr.t<=0)tr.state="outb";
      else if(tr.state==="outb"){tr.v=Math.min(8,tr.v+1.2*rdt);tr.g.position.x-=tr.v*rdt;if(tr.g.position.x<AW-5){tr.state="away";tr.t=80+Math.random()*80;}}
      const sp=tr.state==="outb"?-tr.v:tr.state==="in"?tr.v:0;ENV.trainWheels.forEach(w=>w.rotation.z-=sp*rdt/0.42);
      const door=tr.state==="wait"?Math.min(1,(35-tr.t)/3)*(tr.t>3?1:tr.t/3):0;ENV.trainCars.forEach(c=>{if(c.userData.door)c.userData.door.position.x=-2.7*door;});
      if(tr.state!=="away"&&Math.random()<rdt*(sp!==0?10:2.5))emit("smoke",tr.g.position.x+ENV.locoStack[0],ENV.locoStack[1],-29,R()*0.5-sp*0.2,2+Math.abs(sp)*0.2,R()*0.5,2.2,1.2+Math.abs(sp)*0.12,"#7d828c",0.5);}
    tr.g.visible=tr.state!=="away";
    G3.wasteFrame&&G3.wasteFrame(rdt);
    // weather particles
    const P2=WXP,snow=wx==="snow",dust=dustK>0.05&&!(wxK>0.05&&snow);   // (v4.1: the points double as blowing dust in a desert storm)
    P2.p.visible=(wxK>0.05&&snow)||dust;P2.rl.visible=wxK>0.05&&wx==="rain";
    if(P2.dust!==dust){P2.dust=dust;P2.m.color.set(dust?0xd8b985:0xffffff);P2.m.size=dust?1.5:0.7;}
    if((P2.p.visible||P2.rl.visible)&&rdt>0){P2.m.opacity=dust?0.42*dustK:0.45*wxK;P2.rm.opacity=0.25*wxK;P2.p.position.set(target.x,0,target.z);P2.rl.position.set(target.x,0,target.z);
      const a=P2.pos,r=P2.rp;for(let i=0;i<P2.n;i++){const j=i*3;if(dust){a[j]+=rdt*(14+(i%7)*2);a[j+1]+=Math.sin(now/300+i)*rdt*2.5;if(a[j+1]>14||a[j+1]<0.2)a[j+1]=0.3+Math.random()*10;}else if(snow){a[j+1]-=rdt*(2.5+(i%5)*0.3);a[j]+=Math.sin(now/900+i)*rdt*0.8;}else{a[j+1]-=rdt*34;a[j]+=rdt*4;}
        if(a[j+1]<0){a[j+1]+=40;a[j]=R()*80;a[j+2]=R()*80;}if(a[j]>40)a[j]-=80;
        if(P2.rl.visible){const k=i*6;r[k]=a[j];r[k+1]=a[j+1];r[k+2]=a[j+2];r[k+3]=a[j]-0.14;r[k+4]=a[j+1]+1.3;r[k+5]=a[j+2];}}
      P2.g.attributes.position.needsUpdate=true;if(P2.rl.visible)P2.rg.attributes.position.needsUpdate=true;}
    // slow-changing signs
    envAcc+=rdt;if(envAcc>1){envAcc=0;
      const q=S.inQ&&S.inQ[0],txt=q?(14.6+(q.load||0)).toFixed(1)+" t":"-- . - t";const sc=ENV.scale;if(txt!==sc.last){sc.last=txt;const x=sc.ctx;x.fillStyle="#101418";x.fillRect(0,0,256,80);x.fillStyle="#ff5a3c";x.font='700 46px "IBM Plex Mono",monospace';x.textAlign="center";x.textBaseline="middle";x.fillText(txt,128,42);sc.tex.needsUpdate=true;}
      // v2.9.13: the yard board shows the daily production record (best 6am-6am day) and today's tons so far
      const pd=S.pd||{start:0,rec:0},today=Math.max(0,S.tot.prodT-pd.start),best=Math.max(pd.rec,today),isNew=pd.rec>0&&today>pd.rec,
        fmt=v=>Math.round(v).toLocaleString("en-US"),bt=fmt(best)+"|"+fmt(today)+"|"+isNew;const bd=ENV.board;
      if(bt!==bd.last){bd.last=bt;const x=bd.ctx;x.fillStyle="#ffffff";x.fillRect(0,0,512,256);x.fillStyle=isNew?"#c77d00":"#1f8a4c";x.fillRect(0,0,512,64);
        x.fillStyle="#fff";x.font='800 36px "Plus Jakarta Sans",system-ui,sans-serif';x.textAlign="center";x.textBaseline="middle";x.fillText(isNew?"NEW PRODUCTION RECORD":"PRODUCTION RECORD",256,34);
        x.fillStyle="#1c2233";x.font='800 96px "Plus Jakarta Sans",system-ui,sans-serif';x.fillText(fmt(best)+" t",256,160);
        bd.tex.needsUpdate=true;}}}

