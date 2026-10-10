  /* ---- step 3 (restyled): chaos effects in the clean isometric look ---- */
  function basic(token,opts={}){const m=new THREE.MeshBasicMaterial(opts);m.userData.token=token;MATS.push(m);return m;}
  const FM={slime:mat("slime",{roughness:0.3}),beaver:mat("beaver",{roughness:0.8}),white:mat("panel"),water:mat("water",{transparent:true,opacity:0.55,roughness:0.08,metalness:0.2,depthWrite:false}),pulp:mat("pulp",{transparent:true,opacity:0.82,roughness:0.2,metalness:0.05,depthWrite:false}),
    rain:basic("water",{transparent:true,opacity:0.55}),fabric:mat("water",{roughness:0.5}),scab:mat("beaver",{roughness:0.9}),cone:mat("fire",{roughness:0.5}),belly:mat("kraft",{roughness:0.85})};
  const sphereG=new SphG(1,20,14),cubeG=new THREE.BoxGeometry(1,1,1);
  const lin=c=>new THREE.Color(c).convertSRGBToLinear();
  function spriteTex(draw,w=128,h=w){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
  const TX={
    puff:spriteTex((x,w)=>{for(let k=0;k<8;k++){const cx=w/2+(Math.random()-0.5)*w*0.32,cy=w/2+(Math.random()-0.5)*w*0.32,r=w*(0.2+Math.random()*0.14),g=x.createRadialGradient(cx,cy,0,cx,cy,r);
      g.addColorStop(0,"rgba(255,255,255,0.85)");g.addColorStop(0.6,"rgba(255,255,255,0.45)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,w);}}),
    flame:spriteTex((x,w,h)=>{const g=x.createRadialGradient(w/2,h*0.7,2,w/2,h*0.62,w*0.55);g.addColorStop(0,"rgba(255,252,230,1)");g.addColorStop(0.25,"rgba(255,214,90,0.95)");
      g.addColorStop(0.62,"rgba(244,104,30,0.8)");g.addColorStop(1,"rgba(244,104,30,0)");x.fillStyle=g;x.beginPath();x.moveTo(w/2,3);x.bezierCurveTo(w*0.98,h*0.45,w*0.92,h*0.97,w/2,h-3);x.bezierCurveTo(w*0.08,h*0.97,w*0.02,h*0.45,w/2,3);x.fill();},96,128),
    dot:spriteTex((x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.45,"rgba(255,255,255,0.95)");g.addColorStop(0.7,"rgba(255,255,255,0.35)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,w);},32),
    drop:spriteTex((x,w)=>{x.fillStyle="#ffffff";x.beginPath();x.moveTo(w/2,2);x.bezierCurveTo(w*0.85,w*0.5,w*0.8,w*0.95,w/2,w-2);x.bezierCurveTo(w*0.2,w*0.95,w*0.15,w*0.5,w/2,2);x.fill();},32),
    chip:spriteTex((x,w)=>{x.fillStyle="#b07a43";x.fillRect(w*0.15,w*0.15,w*0.7,w*0.7);x.fillStyle="#f4efe6";x.fillRect(w*0.4,w*0.15,w*0.08,w*0.7);},32),
    stripes:spriteTex((x,w)=>{x.clearRect(0,0,w,w);x.fillStyle="rgba(214,56,44,0.6)";for(let i=-w;i<w*2;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i+15,0);x.lineTo(i+15-w,w);x.lineTo(i-w,w);x.fill();}}),
    barrier:spriteTex((x,w)=>{x.fillStyle="#ffffff";x.fillRect(0,0,w,w);x.fillStyle="#d6382c";for(let i=-w;i<w*2;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i+16,0);x.lineTo(i+16-w,w);x.lineTo(i-w,w);x.fill();}}),
  };
  TX.stripes.wrapS=TX.stripes.wrapT=THREE.RepeatWrapping;
  // pooled camera-facing particles: soft smoke and steam, glowing fire, sparks, droplets, bale chips
  const PT={smoke:{map:TX.puff,blend:THREE.NormalBlending,grow:true,grav:-0.5,drag:0.5},steam:{map:TX.puff,blend:THREE.NormalBlending,grow:true,grav:-1.2,drag:0.4},
    fire:{map:TX.flame,blend:THREE.NormalBlending,grav:-3,tall:1.35,glow:true},spark:{map:TX.dot,blend:THREE.NormalBlending,grav:14,glow:true},
    drop:{map:TX.drop,blend:THREE.NormalBlending,grav:16},chip:{map:TX.chip,blend:THREE.NormalBlending,grav:12}};
  /* v4: particles are drawn as one instanced batch per look (puff, flame, dot, drop, chip) instead of one sprite and
     one draw call each. Each batch is a camera-facing quad with per-instance position, size, color, opacity and
     spin; puffs are depth-sorted so smoke still layers correctly. Same emit/update rules as before. */
  const parts=[],pFree=[],PCAP=1500;let liveN=0;
  const PVS=`attribute vec3 iPos;attribute vec2 iScl;attribute vec3 iCol;attribute float iAlp;attribute float iRot;
    varying vec2 vUv;varying vec3 vCol;varying float vAlp;
    #include <fog_pars_vertex>
    void main(){vUv=uv;vCol=iCol;vAlp=iAlp;vec4 mvPosition=modelViewMatrix*vec4(iPos,1.0);
      vec2 p=position.xy*iScl;float c=cos(iRot),s=sin(iRot);mvPosition.xy+=vec2(c*p.x-s*p.y,s*p.x+c*p.y);
      gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`;
  const PFS=`uniform sampler2D map;varying vec2 vUv;varying vec3 vCol;varying float vAlp;
    #include <fog_pars_fragment>
    void main(){vec4 t=texture2D(map,vUv);float a=t.a*vAlp;if(a<0.003)discard;gl_FragColor=vec4(vCol*t.rgb,a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }`;
  const PB=new Map();   // texture -> batch
  function pBatch(map,glow,sort,order){const base=new THREE.PlaneGeometry(1,1),g=new THREE.InstancedBufferGeometry();
    g.index=base.index;g.setAttribute("position",base.attributes.position);g.setAttribute("uv",base.attributes.uv);
    const at=(n,k)=>{const a=new THREE.InstancedBufferAttribute(new Float32Array(PCAP*k),k);a.setUsage(THREE.DynamicDrawUsage);g.setAttribute(n,a);return a;};
    const b={g,sort,pos:at("iPos",3),scl:at("iScl",2),col:at("iCol",3),alp:at("iAlp",1),rot:at("iRot",1),list:[],n:0};g.instanceCount=0;
    b.attrs=[b.pos,b.scl,b.col,b.alp,b.rot];b.attrs.forEach(x=>{x.rng={start:0,count:0};});   // one range object each, reused every frame (three.js empties the list after each upload)
    const m=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:null}}]),vertexShader:PVS,fragmentShader:PFS,
      transparent:true,depthWrite:false,fog:!glow,toneMapped:!glow});m.uniforms.map.value=map;
    b.mesh=new THREE.Mesh(g,m);b.mesh.frustumCulled=false;b.mesh.renderOrder=order;scene.add(b.mesh);PB.set(map,b);return b;}
  // smoke/steam puffs are sorted back to front; flames and sparks glow over them
  pBatch(TX.drop,false,false,1);pBatch(TX.chip,false,false,1);pBatch(TX.puff,false,true,2);pBatch(TX.flame,true,false,3);pBatch(TX.dot,true,false,4);
  const PCOL=new Map(),pcol=c=>{let v=PCOL.get(c);if(!v){v=lin(c);PCOL.set(c,v);}return v;};
  // background ambience (plume, aerators, outfall) is capped so it can never crowd out fires, sparks and disaster effects
  function emitA(type,x,y,z,vx,vy,vz,life,size,color,op){if(liveN<600)emit(type,x,y,z,vx,vy,vz,life,size,color,op);}   // (named arguments: a rest array per call was a steady allocation)
  function emit(type,x,y,z,vx,vy,vz,life,size,color,op=1){let p=pFree.pop();
    if(!p){if(parts.length>=PCAP)return;p={v:[0,0,0]};parts.push(p);}
    const c=pcol(color);p.type=type;p.t=PT[type];p.alive=true;p.x=x;p.y=y;p.z=z;p.v[0]=vx;p.v[1]=vy;p.v[2]=vz;p.life=p.max=life;p.size=size;p.op=op;
    p.r=c.r;p.g=c.g;p.b=c.b;p.rot=Math.random()*6.28;p.spin=(Math.random()-0.5)*2;liveN++;}
  // (v4.1 pass 3: no allocation per frame here: the per-batch lists keep their length and a count, the sort is an in-place
  // insertion sort over the live entries, and each attribute reuses one update-range object; the old version's list resets,
  // closures and range objects were a steady 0.3 MB/s on a phone)
  const PBL=[];PB.forEach(b=>PBL.push(b));const pbReg=PB.set.bind(PB);PB.set=(k,b)=>{PBL.push(b);return pbReg(k,b);};
  function stepParts(rdt){liveN=0;for(let k=0;k<PBL.length;k++)PBL[k].n=0;
    for(let q=0;q<parts.length;q++){const p=parts[q];if(!p.alive)continue;p.life-=rdt;if(p.life<=0){p.alive=false;pFree.push(p);continue;}liveN++;
      const t=p.t,f=p.life/p.max;p.v[1]-=t.grav*rdt;if(t.drag){p.v[0]*=1-t.drag*rdt;p.v[2]*=1-t.drag*rdt;}
      p.x+=p.v[0]*rdt;p.y+=p.v[1]*rdt;p.z+=p.v[2]*rdt;if(p.y<0.05&&p.v[1]<0){p.y=0.05;p.v[1]=0;p.v[0]*=0.5;p.v[2]*=0.5;}
      p.s1=t.grow?p.size*(0.45+(1-f)*1.7):p.size*(0.35+0.65*f);
      p.a=p.op*(t.grow?Math.min(1,(1-f)*5)*f:Math.min(1,f*1.6));p.rot+=p.spin*rdt*(t.grow?0.3:1);const b=PB.get(t.map);b.list[b.n++]=p;}
    const vm=camera.matrixWorldInverse.elements;
    for(let k=0;k<PBL.length;k++){const b=PBL[k],L=b.list,n=b.n;
      if(b.sort&&n>1){for(let i=0;i<n;i++){const p=L[i];p.d=vm[2]*p.x+vm[6]*p.y+vm[10]*p.z;}
        for(let i=1;i<n;i++){const p=L[i],d=p.d;let j=i-1;while(j>=0&&L[j].d>d){L[j+1]=L[j];j--;}L[j+1]=p;}}
      const P=b.pos.array,Sc=b.scl.array,Co=b.col.array,A=b.alp.array,R=b.rot.array;
      for(let i=0;i<n;i++){const p=L[i];P[i*3]=p.x;P[i*3+1]=p.y;P[i*3+2]=p.z;Sc[i*2]=p.s1;Sc[i*2+1]=p.s1*(p.t.tall||1);
        Co[i*3]=p.r;Co[i*3+1]=p.g;Co[i*3+2]=p.b;A[i]=p.a;R[i]=p.rot;}
      b.g.instanceCount=n;b.mesh.visible=n>0&&!(G3.EXP&&(G3.EXP.noParts||G3.EXP.hidePB===b));
      if(n){const at=b.attrs;for(let i=0;i<at.length;i++){const x=at[i],r=x.rng;r.count=n*x.itemSize;if(!x.updateRanges.length)x.updateRanges.push(r);x.needsUpdate=true;}}}}
  const R=()=>Math.random()-0.5;
  // big fires: dense flames, a white-hot core, embers, and a flickering orange light that washes over the scene
  const fireLight=new THREE.PointLight(0xff7a1f,0,45,0);scene.add(fireLight);let fireL=0,fireLpos=new THREE.Vector3();
  function fireGlow(x,y,z,k){fireL=Math.max(fireL,k);fireLpos.set(x,y,z);}
  // v2.8.9 fire "pop": a flickering orange pool of light on the floor under the fire, and a flash-over burst when it starts
  const fireFloor=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xff6a1a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,opacity:0}));
  fireFloor.rotation.x=-Math.PI/2;fireFloor.renderOrder=3;fireFloor.visible=false;scene.add(fireFloor);let fireFloorK=0;
  function fireAt(spots,rate,size=1.7){let last=-1e9;return (rdt,mult=1)=>{let cx=0,cy=0,cz=0;
    const nowF=performance.now();if(nowF-last>3000&&rdt>0){spots.forEach(([x,y,z])=>{for(let k=0;k<4;k++)emit("fire",x+R()*1.2,y+Math.random()*0.5,z+R()*1.2,R()*2.5,3+Math.random()*3,R()*2.5,0.7+Math.random()*0.4,size*(1.3+Math.random()*0.7),"#ffffff",1);
        for(let k=0;k<5;k++)emit("spark",x+R(),y+0.6,z+R(),R()*7,7+Math.random()*9,R()*7,1.4+Math.random(),0.26,Math.random()<0.5?"#ffd36a":"#ff5a1f",1);});fireFloorK=2.2;}
    last=nowF;
    spots.forEach(([x,y,z])=>{cx+=x;cy+=y;cz+=z;
      if(Math.random()<rdt*rate*mult*0.7)emit("fire",x+R()*0.4,y+0.2,z+R()*0.4,R()*0.3,1.6+Math.random(),R()*0.3,0.4+Math.random()*0.2,size*0.55,"#fff4c2",1);
      if(Math.random()<rdt*rate*mult*0.5)emit("spark",x+R(),y+0.6,z+R(),R()*3,5+Math.random()*7,R()*3,1.2+Math.random()*0.8,0.22,Math.random()<0.5?"#ffb02e":"#ff5a1f",1);});
    const n=spots.length;fireGlow(cx/n,cy/n+2.5,cz/n,mult);
    {let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;spots.forEach(([x,,z])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);});
      fireFloor.position.set(cx/n,0.09,cz/n);fireFloor.scale.set(x1-x0+16,z1-z0+16,1);fireFloor.userData.on=Math.max(fireFloor.userData.on||0,mult);}
    spots.forEach(([x,y,z])=>{for(let k=0;k<2;k++)if(Math.random()<rdt*rate*mult)emit("fire",x+R()*0.8,y+Math.random()*0.3,z+R()*0.8,R()*0.6,2.2+Math.random()*1.6,R()*0.6,0.55+Math.random()*0.35,size*(0.8+Math.random()*0.5),"#ffffff",0.95);});};}
  function smokeCol(x0,x1,y,z0,z1,rate,color="#8e95a3",op=0.6,size=3.2){return rdt=>{for(let k=0;k<3;k++)if(Math.random()<rdt*rate/3)emit("smoke",x0+Math.random()*(x1-x0),y,z0+Math.random()*(z1-z0),0.7+R()*0.6,2.6+Math.random()*1.4,R()*0.6,3.2+Math.random()*1.6,size*(0.8+Math.random()*0.5),color,op);};}
  // striped hazard zone painted on the floor, with a pulsing outline
  function zone(g,x0,x1,z0,z1){const t=TX.stripes.clone();t.needsUpdate=true;t.repeat.set((x1-x0)/3,(z1-z0)/3);
    const m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false});const p=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),m);p.rotation.x=-Math.PI/2;p.position.set((x0+x1)/2,0.09,(z0+z1)/2);g.add(p);
    const om=new THREE.MeshBasicMaterial({color:lin(tok("bad")),transparent:true,toneMapped:false});
    [[x0,x1,z0,z0],[x0,x1,z1,z1],[x0,x0,z0,z1],[x1,x1,z0,z1]].forEach(([a,b,c,d])=>{const o=new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.2,b-a),0.04,Math.max(0.2,d-c)),om);o.position.set((a+b)/2,0.11,(c+d)/2);g.add(o);});
    return now=>{m.opacity=0.5+0.3*Math.sin(now/260);om.opacity=0.6+0.4*Math.sin(now/260);t.offset.x=-(now/5000)%1;};}
  // expanding ripple rings on water
  function ripples(g,n,x0,x1,z0,z1,y){const rs=[];for(let k=0;k<n;k++){const m=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,side:THREE.DoubleSide});
      const r=new THREE.Mesh(new RingG(0.85,1,36),m);r.rotation.x=-Math.PI/2;r.userData.ph=Math.random();r.userData.p=[x0+Math.random()*(x1-x0),z0+Math.random()*(z1-z0)];r.position.set(r.userData.p[0],y,r.userData.p[1]);g.add(r);rs.push(r);}
    return now=>rs.forEach(r=>{const ph=(now/1500+r.userData.ph)%1;if(ph<0.02){r.position.x=x0+Math.random()*(x1-x0);r.position.z=z0+Math.random()*(z1-z0);}r.scale.setScalar(0.3+ph*2.4);r.material.opacity=0.7*(1-ph);});}
  // map-style incident pins with an icon, a thin stem and a pulsing ground ring
  const pinGeo=new THREE.LatheGeometry([[0,0],[0.22,0.45],[0.5,0.95],[0.78,1.5],[0.95,2.05],[0.92,2.45],[0.72,2.8],[0.42,3.0],[0,3.08]].map(([a,b])=>new THREE.Vector2(a,b)),32);
  const pinMat=mat("bad",{roughness:0.3,metalness:0.05});
  const ICONS={};
  function iconTex(kind){if(ICONS[kind])return ICONS[kind];return ICONS[kind]=spriteTex((x,w)=>{x.fillStyle="#fff";x.beginPath();x.arc(w/2,w/2,w*0.46,0,7);x.fill();x.fillStyle="#d6382c";
    if(kind==="fire"){x.beginPath();x.moveTo(w*.5,w*.18);x.bezierCurveTo(w*.78,w*.42,w*.74,w*.8,w*.5,w*.82);x.bezierCurveTo(w*.26,w*.8,w*.24,w*.52,w*.4,w*.36);x.bezierCurveTo(w*.42,w*.5,w*.5,w*.52,w*.5,w*.18);x.fill();}
    else if(kind==="water"){x.beginPath();x.moveTo(w*.5,w*.16);x.bezierCurveTo(w*.74,w*.45,w*.76,w*.8,w*.5,w*.82);x.bezierCurveTo(w*.24,w*.8,w*.26,w*.45,w*.5,w*.16);x.fill();}
    else if(kind==="bolt"){x.beginPath();x.moveTo(w*.58,w*.14);x.lineTo(w*.28,w*.56);x.lineTo(w*.47,w*.56);x.lineTo(w*.4,w*.88);x.lineTo(w*.72,w*.44);x.lineTo(w*.53,w*.44);x.closePath();x.fill();}
    else{x.font=`900 ${w*0.62}px system-ui,-apple-system,sans-serif`;x.textAlign="center";x.textBaseline="middle";x.fillText("!",w/2,w*0.55);}},64);}
  function pinAt(g,x,y,z,kind){const p=new THREE.Group();const head=new THREE.Mesh(pinGeo,pinMat);head.castShadow=true;p.add(head);
    const ic=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex(kind),depthTest:false,transparent:true,toneMapped:false}));ic.renderOrder=10;ic.position.set(0,2.15,0);ic.scale.setScalar(1.3);p.add(ic);
    p.position.set(x,y,z);g.add(p);
    const rm=new THREE.MeshBasicMaterial({color:lin(tok("bad")),transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    const ring=new THREE.Mesh(new RingG(0.85,1,40),rm);ring.rotation.x=-Math.PI/2;ring.position.set(x,0.13,z);g.add(ring);
    const sm=new THREE.MeshBasicMaterial({color:lin(tok("bad")),transparent:true,opacity:0.5});const stem=new THREE.Mesh(new CylG(0.05,0.05,1,6),sm);g.add(stem);
    const o={p,ring,stem,x,y,z,move(nx,nz){this.x=nx;this.z=nz;},update(now){const b=Math.sin(now/320)*0.35;p.position.set(this.x,this.y+b,this.z);p.rotation.y=now/1500;
      const ph=(now/1600)%1;ring.position.set(this.x,0.13,this.z);ring.scale.setScalar(1+ph*5);rm.opacity=0.85*(1-ph);stem.position.set(this.x,(this.y+b)/2,this.z);stem.scale.y=this.y+b;}};return o;}
  const PINS={icedintake:[-30,6,-55.5,"!"],duststorm:[-21,12,-13,"!"],flood:[-62,7,4,"water"],refclash:[60.6,8,-11,"!"],steamjoint:[11.2,9.5,4.6,"!"],fogfan:[49.5,22,-4.2,"!"],shaft:[12,10,15.6,"!"],dryerfire:[12,13,zc,"fire"],fabric:[48,9,zc,"!"],felt:[34.5,11,zc,"!"],slime:[4,11,zc,"!"],ragger:[16,9,-13.5,"!"],overflow:[-21,10,-13,"water"],chestover:[34.5,21,-15,"water"],lwplug:[11.2,9,ZL,"!"],cscreen:[15.2,8,ZL,"!"],fscreen:[19.2,9,ZL,"!"],lcplug:[26.6,8,ZL,"water"],hdblow:[25.8,13,-10.6,"water"],boiler:[76,14,-10,"!"],permit:[LAYOUT.wx(22),10,-40,"water"],thkblow:[34.5,22,-15,"water"],birdhay:[-18.7,9,zc,"!"],wrap:[12,12,zc,"!"],flares:[16,10,-13.5,"fire"],dye:[24,11,zc,"!"],winderdown:[-18.7,9,zc,"!"],
    badocc:[-17,10,-11,"!"],balefire:[-25,11,-12,"fire"],fleet:[-29,10,-16,"!"],calloff:[-36,10,23,"!"],fight:[-38,7,-21,"!"],roof:[-32,10,24,"water"],highway:[-72,7,4,"!"],
    lightning:[34.5,16,-15,"bolt"],tornado:[0,26,0,"!"],beaver:[-24,12,-12.5,"!"]};
  function fxPerson(group,m,x,z){const w=worker(m,M.warn);w.position.set(x,0,z);group.add(w);return w;}
  // v4.1: the brownout's pin sits on the substation the scenery placed (or the power house when there is none)
  const subPos=()=>{const u=G3.scenery&&G3.scenery.util&&G3.scenery.util.substation;return u?[u[0],u[1]]:[74,-10];};
  Object.defineProperty(PINS,"brownout",{get(){const [x,z]=subPos();return [x,x===74?14:9,z,"!"];}});
  const FX={};G3.FX=FX;G3.PB=PB;G3.PT=PT;   // (read by the autotest's GPU probe)
  // wire / felt run-off: the loop runs off the tending side into a heap in the aisle, the section sits bare,
  // the crew carry a new one out in its long shipping crate and pull it on from the front, and the heap is cleared
  const JOBS={},CLOTH_TUBE=new StdMat({color:lin0("#d8c49b"),roughness:0.85});
  function heapGeo(){const g=new SphG(1,32,14,0,Math.PI*2,0,Math.PI/2),pa=g.attributes.position,a=Math.random()*6;
    for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),n=1+0.16*Math.sin(x*5+a)*Math.cos(z*6-a)+0.1*Math.sin((x+z)*11+y*7)+0.22*Math.sin(Math.atan2(z,x)*5+a)*(1-y);
      pa.setXYZ(i,x*n,y*(0.8+0.3*n),z*n);}g.computeVertexNormals();return g;}
  function clothJob(g,id,x,loops,hm){const HZ=14.1;
    const heap=new THREE.Group();heap.position.set(x,0,HZ);g.add(heap);
    [[0,0,2.7,1.25,1.25],[-1.9,0.3,1.3,0.7,0.9],[1.8,-0.2,1.5,0.8,1.0],[0.6,0.5,1.0,0.55,0.8]].forEach(([dx,dz,sx,sy,sz])=>{const m=new THREE.Mesh(heapGeo(),hm);m.scale.set(sx,sy,sz);m.position.set(dx,0,dz);m.rotation.y=Math.random()*3;m.castShadow=true;m.receiveShadow=true;heap.add(m);});
    for(let k=0;k<4;k++){const f=new THREE.Mesh(new THREE.TorusGeometry(0.7+k*0.2,0.12,6,18,Math.PI*1.3),hm);f.position.set(-1.5+k,0.8+0.15*(k%2),R()*0.6);f.rotation.set(Math.PI/2+R()*0.5,R(),Math.random()*3);heap.add(f);}
    const tube=new THREE.Group();g.add(tube);const TL=CD+1.2;
    {const tg=new CylG(0.42,0.42,TL-0.4,18);tg.rotateZ(Math.PI/2);const tb=new THREE.Mesh(tg,CLOTH_TUBE);tb.castShadow=true;tube.add(tb);tube.userData.roll=tb;
      [-TL/2+0.12,TL/2-0.12].forEach(px=>{box(0.22,1.05,1.05,M.kraft,px,0,0,tube);});
      [-0.42,0.42].forEach(pz=>box(TL,0.16,0.16,M.kraft,0,-0.47,pz,tube,false));[-TL/4,0,TL/4].forEach(px=>box(0.12,1.0,1.0,M.kraft,px,0,0,tube,false));}
    // v3.2.2 press felts: a felt roll per felt run, and the seam line that is pinned across the machine
    const FR=id==="felt"?loops.map(m=>{const rg=new CylG(1,1,CD-0.2,18);rg.rotateX(Math.PI/2);const r=new THREE.Mesh(rg,hm);r.castShadow=true;r.visible=false;g.add(r);
      const core=cylZ(0.17,CD+0.3,M.kraft,0,0,0,10,g);core.visible=false;const sm=box(0.18,0.09,1,new THREE.MeshBasicMaterial({color:0xfff6dc}),0,0,0,g,false);sm.visible=false;return {m,r,core,sm};}):null;
    const pathAt=(P,u)=>{const d=u*P.L;let i=1;while(i<P.acc.length-1&&P.acc[i]<d)i++;const a=P.pts[i-1],b=P.pts[i],t=(d-P.acc[i-1])/Math.max(1e-6,P.acc[i]-P.acc[i-1]);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,i-1+t];};
    const feltInstall=(f)=>{const ss=v=>v*v*(3-2*v);let ph,u=0,sl=0,sea=0;
      if(f<0.67){ph="roll";sl=ss((f-0.62)/0.05);}else if(f<0.88){ph="unroll";u=ss((f-0.67)/0.21);sl=1;}else{ph="seam";u=1;sl=1;sea=Math.min(1,(f-0.88)/0.08);}
      FR.forEach(({m,r,core,sm},k)=>{const P=m.userData.path;m.scale.z=1;
        // new felt appears behind the roll as it travels round the run
        if(ph==="roll"){m.visible=false;}else{m.visible=true;const [, ,seg]=pathAt(P,Math.min(1,u));m.geometry.setDrawRange(0,u>=0.999?Infinity:Math.max(6,Math.floor(seg)*6+6));}
        const [px,py]=pathAt(P,Math.min(0.999,u)),rad=0.55-0.36*u,zIn=zc+(1-sl)*(CD+2.5);
        const rv=ph!=="seam";r.visible=core.visible=rv;if(rv){r.scale.set(rad,rad,1);r.position.set(px,py+rad*0.9,zIn);core.position.set(px,py+rad*0.9,zIn);r.rotation.z=-u*P.L/0.4;}
        // seam: pinned from the tending side across to the drive side, then the line fades into the felt
        const s0=P.pts[0];sm.visible=ph==="seam"&&sea<1;if(sm.visible){const len=Math.max(0.02,sea*(CD-0.2));sm.scale.z=len;sm.position.set(s0[0],s0[1]+0.06,zc+CD/2-0.1-len/2);}});
      return ph;};
    return (now,rdt,f)=>{const J=JOBS[id]||(JOBS[id]={});J.t=now;J.x=x;J.hz=HZ;
      const ss=v=>v*v*(3-2*v);let cov=0,hs=1;tube.visible=f>=0.44;
      if(f<0.16){const k=f/0.16;cov=1-ss(k);hs=Math.max(0.02,ss(k));J.ph="run";if(Math.random()<rdt*14)emit("chip",x+R()*5,2+Math.random()*2,zc+CD/2+0.4,R(),1+Math.random(),2+Math.random()*2,0.8,0.22,"#ffffff",0.8);}
      else if(f<0.44){J.ph="bare";}
      else if(FR&&f>=0.62){tube.visible=false;J.ph=feltInstall(f);J.tube=[x,16.2];cov=1;if(f>0.86)hs=Math.max(0.02,1-(f-0.86)/0.12);heap.scale.setScalar(hs);heap.visible=hs>0.03;J.id=id;J.cov=1;return;}
      else if(f<(FR?0.62:0.64)){const k=ss((f-0.44)/(FR?0.18:0.2));J.ph="carry";J.tube=[x+20-20*k,16.2];tube.position.set(J.tube[0],1.55,J.tube[1]);tube.userData.roll.scale.set(1,1,1);}
      else{const k=Math.min(1,(f-0.67)/0.27);J.ph=f<0.67?"set":"install";J.tube=[x,16.2];tube.position.set(x,0.6,16.2);cov=ss(Math.max(0,k));
        tube.userData.roll.scale.set(1,1-0.65*cov,1-0.65*cov);if(f>0.86)hs=Math.max(0.02,1-(f-0.86)/0.12);}
      heap.scale.setScalar(hs);heap.visible=hs>0.03;
      if(FR)FR.forEach(o=>{o.r.visible=o.core.visible=o.sm.visible=false;o.m.geometry.setDrawRange(0,Infinity);});
      J.id=id;J.cov=cov;loops.forEach(m=>{m.scale.z=Math.max(0.002,cov);m.visible=cov>0.004;});};}
  // the cloth change plays on its own clock (at least ~16 s) so it reads at any sim speed
  const CLOTH={fabric:{g:new THREE.Group(),ep:null},felt:{g:new THREE.Group(),ep:null}};
  CLOTH.fabric.up=clothJob(CLOTH.fabric.g,"fabric",47.7,[wireLoop],mat("g-wire",{roughness:0.6}));CLOTH.felt.up=clothJob(CLOTH.felt.g,"felt",34.8,feltMeshes,M.felt);
  for(const id in CLOTH){CLOTH[id].g.visible=false;scene.add(CLOTH[id].g);}
  function clothTick(now,rdt){for(const id in CLOTH){const c=CLOTH[id],inc=S.inc.find(i=>i.id===id),of=!inc&&G3.outCloth?G3.outCloth(id):null;
      if(of!=null){c.g.visible=true;c.ep=c.ep||{inc:-1,t0:now};c.up(now,rdt,Math.min(0.999,of));continue;}
      if(!inc){if(c.ep&&id==="felt")feltMeshes.forEach(m=>{m.geometry.setDrawRange(0,Infinity);m.scale.z=1;m.visible=true;});c.ep=null;c.g.visible=false;continue;}
      if(!c.ep||c.ep.inc!==inc.real)c.ep={inc:inc.real,t0:now};
      const f=inc.go?0.16+0.84*(1-inc.left/inc.total):Math.min(0.16,(now-c.ep.t0)/2500*0.16);
      c.g.visible=true;c.up(now,rdt,Math.min(0.999,f));}}
  // broke piling up under the sheet break point
  const brokePile=new THREE.Mesh(heapGeo(),mat("paperc",{roughness:0.9}));brokePile.visible=false;brokePile.castShadow=true;scene.add(brokePile);
  const wrapGeo=(()=>{const g=new CylG(1,1,1,28,4,true),pa=g.attributes.position;for(let i=0;i<pa.count;i++){const a=Math.atan2(pa.getZ(i),pa.getX(i)),n=1+0.08*Math.sin(a*7+pa.getY(i)*9)+0.05*Math.sin(a*19);pa.setX(i,pa.getX(i)*n);pa.setZ(i,pa.getZ(i)*n);}
    g.rotateX(Math.PI/2);g.computeVertexNormals();return g;})();
  const wrapMat=mat("paperc",{roughness:0.95,side:THREE.DoubleSide});const wrapMesh=new THREE.Mesh(wrapGeo,wrapMat);wrapMesh.visible=false;wrapMesh.castShadow=true;scene.add(wrapMesh);
  const dyeSheet=sheetMat.clone(),dyeReel=new StdMat({roughness:0.8}),DYE=["#ff5fa2","#3fb0ff","#7ed957","#b57bff","#ffb13d","#29d3c4"];let dyeK=-1;
  const BRKPT={press:[40.6,1],dryer:[28.3,1.15],reel:[-5.5,1.3]};let brkSeen=-1,brkT0=0;
  // stock prep breakdowns: hazard zone, a leak of stock from the unit and a small brown puddle
  function spFx(g,x,z,h,w){const zn=zone(g,x-w/2-1,x+w/2+1,z-2.6,z+2.6);const pud=new THREE.Mesh(new CircG(1,32),FM.pulp);pud.rotation.x=-Math.PI/2;pud.position.set(x,0.1,z+1.2);g.add(pud);
    return (now,rdt,inc)=>{zn(now);const k=Math.min(1,(1-inc.left/inc.total)*4);pud.scale.set(1+w*0.35*k,1+1.6*k,1);
      if(Math.random()<rdt*14)emit("drop",x+R()*w*0.6,h,z+R(),R()*3,1+Math.random()*2,R()*3,1.0,0.32,"#7a5636",0.9);if(Math.random()<rdt*3)emit("steam",x+R(),h+0.4,z,0,1.2,0,1.6,1.2,"#a4805c",0.35);};}
  const FXDEF={
    refclash:g=>{const z=zone(g,56,66,-16.4,-5.6);
      return (now,rdt,inc)=>{z(now);const zs=inc&&inc.both?[-14,-8]:[-14];zs.forEach(zz=>{if(Math.random()<rdt*10)emit("spark",60.6+0.95,2.0,zz+R()*1.2,R()*5+2,3+Math.random()*4,R()*5,0.5+Math.random()*0.3,0.3,"#ffb23e",1);
        if(Math.random()<rdt*4)emit("smoke",60.6,3.4,zz,R()*0.6,1.6,R()*0.6,2.6,1.6,"#7e848e",0.5);});};},
    shaft:g=>{const z=zone(g,4,20,12.9,16.6);const motor=box(2.2,1.8,1.8,M.steel,12,0.9,14.8,g);
      const s1=cylZ(0.22,2.6,M.metal,10.6,1.0,14.0,12,g),s2=cylZ(0.22,2.6,M.metal,13.4,0.6,14.2,12,g);s1.rotation.y=0.5;s2.rotation.y=-0.7;s2.rotation.x=0.4;
      return (now,rdt)=>{z(now);motor.rotation.y=Math.sin(now/40)*0.06;for(let k=0;k<4;k++)emit("spark",12,1.4,14.2,R()*9,4+Math.random()*6,R()*7+1.5,0.55+Math.random()*0.3,0.36,"#ff8a1f",1);
        if(Math.random()<rdt*3)emit("smoke",12,2,14.5,R(),1.6,0.4,2.4,1.8,"#a0a6b2",0.5);};},
    dryerfire:g=>{const spots=[];for(let i=0;i<10;i++)spots.push([(872-i*32-600)/10,6.4,zc+(i%2?1.2:-1.2)]);const fire=fireAt(spots,22,2.9),smoke=smokeCol(-3,27,9,zc-2,zc+2,26,"#6f7684",0.62,5.2);const z=zone(g,-6,30,4.4,13.8);
      return (now,rdt,inc)=>{const k0=Math.max(0.2,Math.min(1,inc.left/inc.total*1.4));fire(rdt,k0);smoke(rdt);z(now);for(let k=0;k<3;k++)if(Math.random()<rdt*30)emit("drop",-4+Math.random()*32,12.6,zc+R()*6,0,-6,0,0.9,0.28,"#3d8fd6",0.85);};},
    fabric:g=>{const z=zone(g,39,56,5,13.2);return now=>z(now);},
    felt:g=>{const z=zone(g,29,40.5,5,13.2);return now=>z(now);},
    slime:g=>{const blobs=[];for(let k=0;k<34;k++){const b=new THREE.Mesh(sphereG,FM.scab);const i=k%10,top=k%2;b.position.set((top?872:856)/10-60-i*3.2+R(),top?6.75:1.05,zc+R()*5.5);
        b.userData.s=0.18+Math.random()*0.3;b.scale.set(b.userData.s*1.4,b.userData.s*0.45,b.userData.s);g.add(b);blobs.push(b);}
      return now=>blobs.forEach((b,k)=>{const f=1+0.18*Math.sin(now/300+k);b.scale.set(b.userData.s*1.4*f,b.userData.s*0.45,b.userData.s*f);});},
    ragger:g=>{const rope={rotation:{}};
      const rm=new THREE.MeshBasicMaterial({color:lin(tok("bad")),transparent:true,toneMapped:false,side:THREE.DoubleSide});const ring=new THREE.Mesh(new RingG(5,5.6,48),rm);ring.rotation.x=-Math.PI/2;ring.position.set(16,0.12,-13.5);g.add(ring);
      return now=>{rope.rotation.z=Math.sin(now/500)*0.03;rm.opacity=0.45+0.4*Math.sin(now/250);};},
    overflow:g=>{const w1=new THREE.Mesh(new THREE.PlaneGeometry(26.4,20.5,24,18),FM.pulp);w1.rotation.x=-Math.PI/2;w1.position.set(-21.2,0.35,-13.25);
      const w2=new THREE.Mesh(new THREE.PlaneGeometry(22,9,16,8),FM.pulp);w2.rotation.x=-Math.PI/2;w2.position.set(3,0.2,-12.5);g.add(w1,w2);
      const rp=ripples(g,10,-33,-9,-22,-4,0.42),rp2=ripples(g,4,-7,13,-16,-9,0.27);
      return (now,rdt)=>{[w1,w2].forEach(w=>{const pa=w.geometry.attributes.position;for(let i=0;i<pa.count;i++)pa.setZ(i,0.1*Math.sin(pa.getX(i)*0.8+now/300)+0.06*Math.cos(pa.getY(i)*0.9+now/410));pa.needsUpdate=true;});
        rp(now);rp2(now);for(let k=0;k<3;k++)if(Math.random()<rdt*20)emit("drop",16+R()*7,3.6,-9.6+R()*2,R()*3,3+Math.random()*2,2+Math.random()*2,0.9,0.32,"#7a5636",0.9);};},
    // HD cleaner blowout: a geyser of stock from the top of the cleaner, a spreading brown floor,
    // and a stock prep clean-up crew with squeegees and a hose working it back down
    hdblow:g=>{const HX=25.8,HZ=-10.6,pud=new THREE.Mesh(new CircG(1,48),FM.pulp);pud.rotation.x=-Math.PI/2;pud.position.set(HX-1,0.09,HZ+0.5);g.add(pud);
      const blobs=[];for(let k=0;k<14;k++){const b=new THREE.Mesh(new CircG(1,20),FM.pulp);b.rotation.x=-Math.PI/2;const a=Math.random()*6.28,r=4+Math.random()*7;
        b.position.set(HX+Math.cos(a)*r,0.1,HZ+Math.sin(a)*r*0.8);b.userData.s=0.6+Math.random()*1.3;g.add(b);blobs.push(b);}
      const rp=ripples(g,6,HX-7,HX+5,HZ-6,HZ+6,0.12);
      const SPOT=[[HX-4.5,HZ+3.2],[HX+3.8,HZ+2.6],[HX-2.2,HZ-4.4],[HX+4.6,HZ-3.6]];
      const crew=SPOT.map((sp,k)=>{const w=worker(M.warn,M.warn);w.position.set(2+k*1.5,0,-1.5);g.add(w);w.userData.home=[2+k*1.5,-1.5];return w;});
      const hose=new THREE.Mesh(new CylG(0.06,0.06,1,6),M.ink);g.add(hose);
      let seen=null;return (now,rdt,inc)=>{if(inc.real!==seen){seen=inc.real;crew.forEach(w=>w.position.set(w.userData.home[0],0,w.userData.home[1]));}rp(now);const k=1-inc.left/inc.total,spray=k<0.35,grow=Math.min(1,k*5),clean=clamp((k-0.35)/0.6,0,1);
        const sz=(3+9*grow)*(1-0.85*clean);pud.scale.setScalar(Math.max(0.3,sz));blobs.forEach(b=>{const s2=b.userData.s*grow*(1-clean);b.visible=s2>0.05;b.scale.setScalar(Math.max(0.01,s2));});
        if(spray){for(let j=0;j<8;j++)if(Math.random()<rdt*45)emit("drop",HX+R()*0.6,7.2,HZ+R()*0.6,R()*16,6+Math.random()*12,R()*16,1.6,0.45,"#7a5636",0.95);
          if(Math.random()<rdt*10)emit("steam",HX+R(),7.4,HZ+R(),R()*2,2.5,R()*2,1.8,2.4,"#a4805c",0.45);}
        else if(Math.random()<rdt*3)emit("drop",HX+R()*0.4,6.4,HZ+R()*0.4,R(),-1,R(),0.8,0.3,"#7a5636",0.9);
        crew.forEach((w,j)=>{const sp=SPOT[j];if(k<0.12){pose(w,"look",now);face(w,HX,HZ,rdt);return;}
          const tx=sp[0]+Math.sin(now/1400+j*2)*1.6*(1-clean*0.6),tz=sp[1]+Math.cos(now/1700+j)*1.1*(1-clean*0.6);
          const ok=moveP(w,tx,tz,k<0.4?7:1.4,rdt);if(ok||k>0.4){face(w,HX,HZ,rdt);pose(w,j===0?"hose":"clean",now);}else pose(w,"run",now);});
        const w0=crew[0];if(k>0.12){const a=w0.rotation.y;stretch(hose,4,0.3,-1.8,w0.position.x+Math.cos(a)*0.3,0.9,w0.position.z-Math.sin(a)*0.3);
          if(Math.random()<rdt*14){const [nx,,nz]=nozzlePos(w0);emit("drop",nx,1.2,nz,Math.cos(a)*7,0.6,-Math.sin(a)*7,0.6,0.26,"#bfe0f0",0.9);}}else hose.visible=false;};},
    lwplug:g=>spFx(g,11.2,ZL,3.6,6),cscreen:g=>spFx(g,15.2,ZL,2.4,4),fscreen:g=>spFx(g,19.2,ZL,3.0,5),lcplug:g=>spFx(g,26.6,ZL,2.0,8),
    fogfan:g=>{const z=zone(g,47.5,51.5,-6,-2.4);const sheets=[];const fm=new THREE.MeshBasicMaterial({color:lin0("#e9edf1"),transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
      for(let k=0;k<5;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(84,1,13),fm);m.position.set(19,1.2+k*2.2,9.5);m.scale.y=2.2;g.add(m);sheets.push(m);}
      return (now,rdt,inc)=>{z(now);const p=inc&&inc.total?1-inc.left/inc.total:0,k=Math.min(1,p*6)*(p>0.85?(1-p)/0.15:1);fm.opacity=0.11*k;
        for(let q=0;q<5;q++)if(Math.random()<rdt*45*k)emitA("steam",-6+Math.random()*64,1+Math.random()*9,3.2+Math.random()*12.5,R()*0.6,0.25+Math.random()*0.4,R()*0.6,5,4.5+Math.random()*4,"#eef1f4",0.5);};},
    thkblow:g=>{const pud=new THREE.Mesh(new CircG(1,40),FM.pulp);pud.rotation.x=-Math.PI/2;pud.position.set(34.5,0.09,-15);g.add(pud);
      const rp=ripples(g,6,27,42,-22,-8,0.12);
      return (now,rdt,inc)=>{rp(now);const k=Math.min(1,(1-inc.left/inc.total)*6);pud.scale.setScalar(5+7*k);
        for(let j=0;j<6;j++)if(Math.random()<rdt*40)emit("drop",34.5+R()*2.5,PH+2.8,-15+R()*1.5,R()*14,4+Math.random()*9,R()*14,1.8,0.42,"#7a5636",0.95);
        if(Math.random()<rdt*8)emit("steam",34.5+R()*2,PH+3.2,-15+R(),R()*2,2,R()*2,1.8,2.2,"#a4805c",0.45);};},
    // v2.9.22: the rotary steam joint on the middle top dryer (can 5, drive side) blows its packing
    steamjoint:g=>{const JX=11.2,JY=5.4,JZ=5.72,z=zone(g,6.5,16,1.6,5.4);
      const ring=new THREE.Mesh(new CylG(0.24,0.24,0.12,12),new THREE.MeshBasicMaterial({color:lin0("#ff4b2b")}));ring.rotation.x=Math.PI/2;ring.position.set(JX,JY,JZ-0.18);g.add(ring);
      return (now,rdt,inc)=>{z(now);const k=inc&&inc.total?(inc.go?Math.max(0.15,Math.min(1,inc.left/inc.total*1.6)):1):1;ring.material.color.setRGB(1,0.25+0.2*Math.sin(now/120),0.1);
        for(let q=0;q<3;q++)if(Math.random()<rdt*55*k)emit("steam",JX+R()*0.15,JY+R()*0.15,JZ-0.3,R()*1.4,R()*1.4+0.6,-(7+Math.random()*4)*k,1.6,1.2+Math.random()*1.2,"#ffffff",0.85);
        // the billow: grey-white puffs that pile up over the drive side and roll up over the dryer hood
        for(let q=0;q<4;q++)if(Math.random()<rdt*24*k)emitA("smoke",JX+R()*6,JY+Math.random()*5,JZ-2+R()*3,R()*1.2,1.6+Math.random()*2.2,-0.3+R()*0.8,6,6+Math.random()*6,q&1?"#dfe4ea":"#c9d0d9",0.7);
        if(Math.random()<rdt*8*k)emitA("smoke",JX+R()*9,1+Math.random()*2,JZ-1.5+R()*3,R()*0.8,0.5,R()*0.8,5,6+Math.random()*4,"#d7dde4",0.5);};},
    boiler:g=>{const z=zone(g,68,84,-18,-2),P=G3.POP;
      return (now,rdt,inc)=>{z(now);const k=inc&&inc.total?inc.left/inc.total:1,lift=k>0.35?1:k/0.35,flick=0.75+0.25*Math.sin(now/37)*Math.sin(now/91);
        P.lever.rotation.z=0.35*lift;if(lift<0.05)return;
        for(let q=0;q<3;q++)if(Math.random()<rdt*60*lift)emit("steam",P.x+0.75+R()*0.3,16.7,P.z+R()*0.3,R()*1.6,(5.5+Math.random()*3.5)*lift*flick,R()*1.6,2.6,2.6+Math.random()*2.0,"#ffffff",0.9);
        if(Math.random()<rdt*8*lift)emitA("steam",P.x+0.5,10.5,P.z,R()*2,1+Math.random(),R()*2,0.8,0.5,"#ffffff",0.5);};},
    permit:g=>{const W=LAYOUT.wx,z=zone(g,Math.min(W(1),W(46)),Math.max(W(1),W(46)),-49,-31),p0=Math.min(W(22),W(42));return (now,rdt)=>{z(now);if(Math.random()<rdt*10)emit("smoke",p0+Math.random()*20,1.2,-46+Math.random()*12,R(),0.6,R(),2.2,1.6,"#e9e2cf",0.7);};},
    winderdown:g=>{const z=zone(g,-24.5,-13,4.6,13.6);return now=>z(now);},
    runner:g=>()=>{if(FX.runner&&RUN.on)FX.runner.pinPos=[RUN.x,RUN.z];},
    chestover:g=>{const cr=chestR,cx=34.5,cz=-15;const pud=new THREE.Mesh(new RingG(cr*0.98,cr+6.5,48,6),FM.pulp);pud.rotation.x=-Math.PI/2;pud.position.set(cx,0.1,cz);g.add(pud);
      const top=new THREE.Mesh(new CircG(cr*0.95,40),FM.pulp);top.rotation.x=-Math.PI/2;top.position.set(cx,10.08,cz);g.add(top);
      const sheet=new THREE.Mesh(new CylG(cr*1.03,cr*1.06,9.9,40,1,true,Math.PI*0.15,Math.PI*0.9),FM.pulp);sheet.position.set(cx,5.05,cz);g.add(sheet);
      const rp=ripples(g,7,cx-cr-5,cx+cr+5,cz+cr*0.3,cz+cr+5,0.14);
      return (now,rdt,inc)=>{rp(now);pud.scale.setScalar(0.55+0.45*Math.min(1,(1-inc.left/inc.total)*5));for(let k=0;k<4;k++)if(Math.random()<rdt*25){const a=Math.PI*(0.15+Math.random()*0.9)+Math.PI/2;
        emit("drop",cx+Math.sin(a)*cr*1.05,10.1,cz+Math.cos(a)*cr*1.05,Math.sin(a)*1.4,0.6,Math.cos(a)*1.4,1.2,0.34,"#7a5636",0.95);}};},
    badocc:g=>{const m4=new THREE.Matrix4(),add=(geo,mt,n,sx,sy,sz)=>{const im=new THREE.InstancedMesh(geo,instMat(mt),n);for(let k=0;k<n;k++){const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random()*3,Math.random()*3,Math.random()*3));
        m4.compose(new THREE.Vector3(-30+Math.random()*19,1.1+Math.random()*2.4,-17+Math.random()*10),q,new THREE.Vector3(sx,sy,sz));im.setMatrixAt(k,m4);}im.castShadow=true;g.add(im);};
      add(new CylG(0.13,0.13,0.5,10),mat("water",{roughness:0.2}),24,1,1,1);add(rboxGeo(0.5,0.25,0.4),FM.white,18,1,1,1);add(sphereG,FM.slime,16,0.22,0.12,0.2);
      return ()=>{};},
    balefire:g=>{const spots=[];for(let k=0;k<10;k++)spots.push([-29+k*2,1.6+(k%3)*0.9,-7.5-(k%4)*3]);const fire=fireAt(spots,20,3.0),smoke=smokeCol(-30,-12,5,-18,-6,24,"#6f7684",0.62,5.4);
      return (now,rdt,inc)=>{fire(rdt,Math.max(0.2,Math.min(1,inc.left/inc.total*1.4)));smoke(rdt);if(Math.random()<rdt*12)emit("spark",-21+R()*14,2,-12+R()*8,R()*3,6+Math.random()*4,R()*3,0.8,0.3,"#ff8a1f",1);};},
    fight:g=>{const a=fxPerson(g,M.warn,-38.6,-21),b=fxPerson(g,M.stock,-37.2,-21);a.rotation.y=0;b.rotation.y=Math.PI;
      const car=new THREE.Group();box(3.4,0.75,1.7,M.wall,0,0.62,0,car);box(1.9,0.62,1.5,M.wall,-0.25,1.3,0,car);box(1.8,0.42,1.52,M.wind,-0.25,1.36,0,car,false);box(3.42,0.22,1.72,M.ink,0,0.5,0,car,false);
      [-1.1,1.1].forEach(x=>[-0.78,0.78].forEach(z=>cylZ(0.34,0.24,M.ink,x,0.34,z,16,car)));box(0.9,0.14,1.0,M.ink,-0.25,1.68,0,car,false);
      const red=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#ff3b30"),transparent:true,depthWrite:false,toneMapped:false})),blue=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#2f6bff"),transparent:true,depthWrite:false,toneMapped:false}));
      red.position.set(-0.25,1.85,-0.35);blue.position.set(-0.25,1.85,0.35);car.add(red,blue);car.position.set(-43,0,-15.5);car.rotation.y=0.6;g.add(car);
      const bub=new THREE.Sprite(new THREE.SpriteMaterial({map:spriteTex((x,w,h)=>{x.fillStyle="#fff";x.strokeStyle="#1c2233";x.lineWidth=5;x.beginPath();x.roundRect(6,6,w-12,h-34,22);x.fill();x.stroke();
        x.beginPath();x.moveTo(w*0.42,h-29);x.lineTo(w*0.36,h-6);x.lineTo(w*0.56,h-29);x.fill();x.fillStyle="#d6382c";x.font="900 54px system-ui,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText("#@%!",w/2,(h-28)/2+4);},192,128),transparent:true,depthTest:false,toneMapped:false}));
      bub.position.set(-37.9,3.6,-21);bub.scale.set(3.3,2.2,1);bub.renderOrder=9;g.add(bub);
      return (now,rdt)=>{const j=Math.sin(now/70)*0.25;a.position.x=-38.6+j;b.position.x=-37.2-j;pose(a,"rethread",now);pose(b,"rethread",now+300);
        const on=((now/220)|0)%2;red.scale.setScalar(on?2.4:0.6);blue.scale.setScalar(on?0.6:2.4);bub.position.y=3.6+Math.sin(now/200)*0.15;};},
    roof:g=>{const drops=[];for(let k=0;k<90;k++){const d=new THREE.Mesh(cubeG,FM.rain);d.scale.set(0.05,0.7,0.05);d.position.set(-48+Math.random()*24,Math.random()*7,15.5+Math.random()*16);g.add(d);drops.push(d);}
      const pud=new THREE.Mesh(new CircG(5.5,40),FM.water);pud.rotation.x=-Math.PI/2;pud.position.set(-35,0.08,23);g.add(pud);const rp=ripples(g,6,-39,-31,20,26,0.1);
      return (now,rdt)=>{rp(now);drops.forEach(d=>{d.position.y-=rdt*16;if(d.position.y<0)d.position.y+=7;});};},
    highway:g=>{const bm=new StdMat({map:TX.barrier,roughness:0.6});const amb=[];
      [[-72,-3.8],[-72,12.5]].forEach(([x,z])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.75,3.6),bm);b.position.set(x,0.95,z);box(0.12,0.6,0.12,M.ink,x,0.3,z-1.5,g,false);box(0.12,0.6,0.12,M.ink,x,0.3,z+1.5,g,false);box(0.9,0.08,0.3,M.ink,x,0.04,z-1.5,g,false);box(0.9,0.08,0.3,M.ink,x,0.04,z+1.5,g,false);b.castShadow=true;g.add(b);
        [-2.3,2.3].forEach(dz=>{const c=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.95,16),FM.cone);c.position.set(x+1.6,0.48,z+dz);c.castShadow=true;g.add(c);box(0.7,0.08,0.7,FM.cone,x+1.6,0.04,z+dz,g,false);});
        [-1.4,1.4].forEach(dz=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#ffb000"),transparent:true,depthWrite:false,toneMapped:false}));s.position.set(x,1.5,z+dz);g.add(s);amb.push(s);});});
      const tanker=new THREE.Group();box(1.4,1.7,1.9,M.brand,3.4,1.15,0,tanker);const tank=cylZ(1.05,4.6,M.metal,0,1.55,0,24,tanker);tank.rotation.y=Math.PI/2;tanker.position.set(-84,0,4);tanker.rotation.y=0.9;tanker.rotation.z=0.22;g.add(tanker);
      return now=>amb.forEach((s,k)=>s.scale.setScalar(((now/300+k)|0)%2?1.8:0.4));},
    lightning:g=>{const pts=[[40,40,-13],[36,32,-16],[39,26,-14],[34,19,-15],[37,14,-15],[34.5,10.5,-15]].map(p=>new THREE.Vector3(...p));
      const bolt=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,"catmullrom",0),40,0.28,6,false),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));g.add(bolt);
      const glows=pts.map(p=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#9fc3ff"),transparent:true,depthWrite:false,toneMapped:false}));s.position.copy(p);s.scale.setScalar(7);g.add(s);return s;});
      const beacons=[[-34.4,4.9,-23.5],[-8,4.9,-3],[-49,4.9,14.8],[-23.8,4.9,32.2],[64,5.4,2.4],[-2,5.4,2.4]].map(p=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#ff3b30"),transparent:true,depthWrite:false,toneMapped:false}));s.position.set(...p);g.add(s);return s;});
      const flash=$("flash3d");
      return (now,rdt,inc)=>{const age=(now-inc.real)/1000,on=age<1.4?((now/80)|0)%2===0:(now%2600)<110;bolt.visible=on;glows.forEach(s=>s.visible=on);
        flash.style.opacity=age<0.12?0.9:age<0.3?0.0:age<0.42?0.6:on&&age>1.4?0.35:0;beacons.forEach((s,k)=>s.scale.setScalar(1.2+2.2*Math.max(0,Math.sin(now/180+k))));
        if(age<0.4)shake=Math.max(shake,1.4);};},
    tornado:g=>{const fun=new THREE.Group();g.add(fun);const N=54,puffs=[];for(let k=0;k<N;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.puff,transparent:true,depthWrite:false,color:lin("#b9bfcb"),opacity:0.6}));fun.add(s);puffs.push(s);}
      const deb=[];for(let k=0;k<16;k++){const d=k%3===0?new THREE.Mesh(rollGeo,ROLLM):new THREE.Mesh(cubeG,k%3===1?M.bale:mat("kraft"));d.scale.setScalar(k%3===0?0.8:0.75);d.castShadow=true;fun.add(d);deb.push(d);}
      return (now,rdt,inc)=>{const age=(now-inc.real)/1000;fun.visible=age<12;const fx=-95+age/12*170,fz=-6+Math.sin(age*0.9)*10;fun.position.set(fx,0,fz);FX.tornado.pinPos=[fx,fz];
        puffs.forEach((s,k)=>{const h=(k/N)*30,a=now/160*(1.6-h/40)+k*2.4,r=1+h*0.5+Math.sin(now/400+k)*0.3;s.position.set(Math.cos(a)*r+Math.sin(now/300+h/6)*h*0.05,h,Math.sin(a)*r);s.scale.setScalar(3.4+h*0.22);});
        deb.forEach((d,k)=>{const a=now/170+k,rad=3+k*0.75;d.position.set(Math.cos(a)*rad,1.5+k*1.3,Math.sin(a)*rad);d.rotation.set(a,a*1.3,0);});
        if(fun.visible&&Math.random()<rdt*14)emit("smoke",fx+R()*6,0.3,fz+R()*6,R()*4,0.6,R()*4,1.6,3,"#c9ced8",0.6);if(age<1)shake=Math.max(shake,0.8);};},
    beaver:g=>{const bv=new THREE.Group(),E=(sx,sy,sz,m,x,y,z)=>{const o=new THREE.Mesh(sphereG,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.castShadow=true;bv.add(o);return o;};
      E(4.2,3.2,3.4,FM.beaver,0,3,0);E(2.6,2.1,2.4,FM.belly,1.9,2.6,0);const head=E(2.2,2,2,FM.beaver,4.4,4.6,0);E(1.0,0.8,1.1,FM.belly,6.0,4.1,0);
      E(0.6,0.6,0.6,FM.beaver,3.8,6.5,-1.2);E(0.6,0.6,0.6,FM.beaver,3.8,6.5,1.2);
      [-0.8,0.8].forEach(z=>{E(0.42,0.42,0.42,FM.white,5.9,5.3,z);E(0.24,0.26,0.24,M.ink,6.25,5.35,z);});E(0.45,0.36,0.5,M.ink,6.75,4.6,0);
      const teeth=new THREE.Group();box(0.25,0.9,0.4,FM.white,0,0,-0.24,teeth,false);box(0.25,0.9,0.4,FM.white,0,0,0.24,teeth,false);teeth.position.set(6.3,3.55,0);bv.add(teeth);
      [-1.6,1.6].forEach(z=>E(0.7,1.1,0.6,FM.beaver,3.4,2.2,z));
      const tail=E(3,0.35,1.7,M.ink,-5.4,0.9,0);tail.rotation.z=0.25;bv.position.set(-24,0,-12.5);bv.rotation.y=-0.4;g.add(bv);
      return (now,rdt)=>{bv.position.y=Math.abs(Math.sin(now/400))*0.4;teeth.position.y=3.55-Math.abs(Math.sin(now/120))*0.3;head.rotation.z=Math.sin(now/120)*0.08;tail.rotation.z=0.25+Math.sin(now/200)*0.3;
        for(let k=0;k<2;k++)if(Math.random()<rdt*14)emit("chip",-18.5,4,-11.5,1+Math.random()*4,4+Math.random()*4,R()*5,1.3,0.55,"#ffffff",1);};},
    // ---- v4.1 environment upsets ----
    // rural: ice floes jammed against the river intake, frost on the pump house; chips fly once maintenance is breaking it up
    icedintake:g=>{const ice=new StdMat({color:lin0("#e8f3fb"),roughness:0.35}),pos=[],nor=[],m4=new THREE.Matrix4();
      for(let k=0;k<15;k++){const f=k<14?[-37+Math.random()*14,-67+Math.random()*7,Math.random()*3,1.2+Math.random()*2.2,1+Math.random()*1.8,0.3]:[-30,-60.5,0,5,3,0.5];
        const bg=new THREE.BoxGeometry(f[3],f[5],f[4]).toNonIndexed();m4.makeRotationY(f[2]).setPosition(f[0],0.1,f[1]);bg.applyMatrix4(m4);pos.push(...bg.attributes.position.array);nor.push(...bg.attributes.normal.array);}
      const fg=new THREE.BufferGeometry();fg.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));fg.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3));
      const floes=new THREE.Mesh(fg,ice);floes.castShadow=true;g.add(floes);
      const frost=new THREE.Mesh(new THREE.BoxGeometry(4.12,3.12,4.12),new StdMat({color:lin0("#ffffff"),transparent:true,opacity:0.38,roughness:0.95,depthWrite:false}));frost.position.set(-30,1.5,-55.5);g.add(frost);
      return (now,rdt,inc)=>{floes.position.y=Math.sin(now/900)*0.035;
        if(inc&&inc.mGo&&Math.random()<rdt*8)emit("chip",-30+R()*3,1.2,-58+R()*2,R()*3,2+Math.random()*3,R()*3,0.9,0.4,"#ffffff",1);};},
    // urban: arc flashes at the substation and the mill's lights sag (envUpdate reads G3.brownK)
    brownout:g=>{const [px,pz]=subPos(),py=px===74?9.5:3.4,arcs=[];
      for(let k=0;k<3;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#bfe3ff"),transparent:true,depthWrite:false,toneMapped:false}));s.position.set(px-6+k*6,py,pz-2);s.scale.setScalar(3.2);g.add(s);arcs.push(s);}
      return (now,rdt)=>{const tick=(now/90)|0,fl=tick%7===0;arcs.forEach((s,k)=>{s.visible=fl&&k===tick%3;});G3.brownK=0.55+0.25*Math.sin(now/230)*Math.sin(now/71);
        if(fl&&Math.random()<rdt*30)emit("spark",px-6+(tick%3)*6,py,pz-2,R()*3,1+Math.random()*2,R()*3,0.4,0.2,"#9fd0ff",1);};},
    // desert: the storm is in the sky (envUpdate reads G3.dustK: tan haze, short fog, blowing dust); here, dust rolling across the ground
    duststorm:g=>{return (now,rdt,inc)=>{const k=inc&&inc.total?inc.left/inc.total:1;G3.dustK=k<0.15?k/0.15:k>0.92?(1-k)/0.08:1;
        for(let q=0;q<3;q++)if(Math.random()<rdt*36*G3.dustK)emitA("smoke",-95+Math.random()*190,0.6+Math.random()*4,-55+Math.random()*120,9+Math.random()*5,0.2,R()*1.5,3.2,7+Math.random()*6,"#c9a86b",0.5);};},
    // swamp: water over the yard and the roads (not inside the buildings), rising as the incident starts and draining away at the end
    flood:g=>{const sh=new THREE.Shape();sh.moveTo(-150,-52);sh.lineTo(96,-52);sh.lineTo(96,66);sh.lineTo(-150,66);sh.closePath();
      [[-27.2,64,-2.9,19.85],[-34.4,-8,-23.5,-3],[-49,-23.8,14.8,32.2],[4,47,-25,-2],[49,65,-27,-14.5],[70,82,-16,-4],[49,61,24,30]].forEach(([x0,x1,z0,z1])=>{const h=new THREE.Path();h.moveTo(x0,z0);h.lineTo(x1,z0);h.lineTo(x1,z1);h.lineTo(x0,z1);h.closePath();sh.holes.push(h);});
      const geo=new THREE.ShapeGeometry(sh);geo.rotateX(Math.PI/2);
      const wm=new StdMat({color:lin0("#5a7f7c"),transparent:true,opacity:0,roughness:0.06,metalness:0.25,depthWrite:false,side:THREE.DoubleSide});
      const w=new THREE.Mesh(geo,wm);w.position.y=0.09;w.renderOrder=1;g.add(w);const rp=ripples(g,10,-90,80,-45,60,0.12);
      const debris=[];for(let k=0;k<8;k++){const d=box(1.6,0.12,0.25,M.kraft,-70+Math.random()*140,0.14,-40+Math.random()*90,g,false);d.rotation.y=Math.random()*3;debris.push(d);}
      return (now,rdt,inc)=>{const k=inc&&inc.total?inc.left/inc.total:1,lvl=k>0.85?(1-k)/0.15:k<0.25?k/0.25:1;wm.opacity=0.72*lvl;w.position.y=0.03+0.07*lvl;G3.floodK=lvl;
        rp(now);debris.forEach((d,q)=>{d.visible=lvl>0.3;d.position.x+=rdt*0.4;d.position.y=w.position.y+0.05+Math.sin(now/700+q)*0.02;if(d.position.x>90)d.position.x=-100;});};},
  };
  const blackEl=$("blackout3d");let lastIncTxt=0;
  function makeFX(id){const def=FXDEF[id];const g=new THREE.Group();scene.add(g);const pp=PINS[id]||[0,10,0,"!"];const f=FX[id]={g,up:null,pin:pinAt(g,pp[0],pp[1],pp[2],pp[3]),lb:lblNew(true,id)};
    f.up=def?def(g):()=>{};return f;}
  /* v4: every upset effect is built, and every shader compiled, while the start menu is up: a few effects per frame
     (about 8 ms of work each frame), then one compileAsync pass, which compiles in parallel where the browser supports
     it. Nothing compiles mid-play. (r186's compile() walks the whole scene however much is hidden, so v3's
     one-effect-at-a-time warm-up during play cost a whole-scene pass every 1.5-4 s.) */
  let warm=null;
  G3.prewarm=()=>warm||(warm=new Promise(res=>{const ids=EVENTS.map(e=>e.id).filter(k=>!FX[k]);
    const done=()=>{G3.warm=true;diag("shaders precompiled: "+renderer.info.programs.length+" programs");res();};
    const stepW=()=>{if(!SM.done){requestAnimationFrame(stepW);return;}const t=performance.now();
      while(ids.length&&performance.now()-t<8){try{makeFX(ids.shift()).g.visible=false;}catch(e){}}
      if(ids.length){requestAnimationFrame(stepW);return;}
      // one off-screen render with every effect showing and a shadow refresh: this also compiles the shadow-pass
      // (depth) shaders, which compile() doesn't cover. The moving-thing batches are built first so theirs are included.
      try{if(G3.dbForce)G3.dbForce();const shown=[];
        // stand-in batches for the shadow-pass variants that moving things may need later (single/double-sided,
        // with/without a texture), so a new batch made mid-play never compiles a shader
        const tex=TX.puff,stand=[];for(const side of [THREE.FrontSide,THREE.DoubleSide])for(const map of [null,tex]){
          const g=new THREE.BoxGeometry(0.01,0.01,0.01),bm=new THREE.BatchedMesh(1,g.attributes.position.count,g.index.count,new THREE.MeshLambertMaterial({side,map}));
          bm.setColorAt(bm.addInstance(bm.addGeometry(g)),new THREE.Color(1,1,1));/* per-object colors, as moving batches use */bm.perObjectFrustumCulled=false;bm.castShadow=true;bm.frustumCulled=false;bm.position.set(0,-50,0);bm.updateMatrixWorld();scene.add(bm);stand.push([bm,g]);}
        // v4.1 pass 3: the shadow pass shares one depth material and re-derives its shader only when it steps from a plain
        // mesh to an instanced or batched one (or back); it then takes the side and texture of whatever it draws next. So
        // every combination is drawn here in exactly that order (the scene is traversed in insertion order), and a batch or
        // a textured caster that turns up mid-play (the train's bales, a repair job's sign, the felt) finds its depth shader
        // compiled. Plain meshes get a no-op dispose so the clean-up below treats them like the batches.
        {const tiny=new THREE.BoxGeometry(0.01,0.01,0.01),dbl=new THREE.MeshLambertMaterial({side:THREE.DoubleSide}),dblT=new THREE.MeshLambertMaterial({side:THREE.DoubleSide,map:tex});
          const put=o=>{o.castShadow=true;o.frustumCulled=false;o.position.set(0,-50,0);o.updateMatrixWorld();if(!o.dispose)o.dispose=()=>{};scene.add(o);stand.push([o,null]);return o;};
          const plain=m=>put(new THREE.Mesh(tiny,m)),inst=(m,col)=>{const im=new THREE.InstancedMesh(tiny,m,1);im.setMatrixAt(0,new THREE.Matrix4());if(col)im.setColorAt(0,new THREE.Color(1,1,1));return put(im);};
          const batch=m=>{const bm=new THREE.BatchedMesh(1,tiny.attributes.position.count,tiny.index.count,m);bm.setColorAt(bm.addInstance(bm.addGeometry(tiny)),new THREE.Color(1,1,1));bm.perObjectFrustumCulled=false;return put(bm);};
          for(const m of [M.ink,dbl,M.bale,dblT]){batch(M.ink);plain(m);}                                   // plain casters: one/two-sided, plain/textured, each right after a batch
          for(const m of [M.ink,dbl,M.bale,dblT]){plain(M.ink);batch(m);}                                   // batched casters, the same four, each right after a plain mesh
          for(const m of [instMat(M.ink),instMat(M.bale)])for(const col of [false,true]){plain(M.ink);inst(m,col);}   // instanced casters, with and without per-instance colour (own copies, see instMat)
          stand.push([{material:null,dispose(){}},tiny]);}
        // v4.0.1: one stand-in per look a moving batch could ever use (effects included), drawn white with a per-object color
        // exactly as dbNew builds them, so a batch made mid-play reuses a compiled shader
        {const seen=new Set();scene.traverse(o=>{if(o.isBatchedMesh||!dbOK(o))return;const k=dbKey(o);if(seen.has(k))return;seen.add(k);
          const g=o.geometry,c=o.material.clone();c.color.setRGB(1,1,1);
          const bm=new THREE.BatchedMesh(1,g.attributes.position.count,Math.max(g.index?g.index.count:0,1),c);bm.setColorAt(bm.addInstance(bm.addGeometry(g)),o.material.color);
          bm.perObjectFrustumCulled=false;bm.sortObjects=false;bm.frustumCulled=false;bm.castShadow=o.castShadow;bm.receiveShadow=o.receiveShadow;scene.add(bm);stand.push([bm,null]);});}
        // ...one per material in the scene that a moving batch could use (objects made or freed later reuse these)...
        {const mats=new Map();scene.traverse(o=>{if(!o.isMesh||o.isBatchedMesh||o.isInstancedMesh||Array.isArray(o.material))return;const m=o.material;
            if(!m||!DBOK.has(m.type)||m.transparent||m.opacity<1)return;const k=mats.get(m)||0;mats.set(m,k|(o.receiveShadow?2:1));});
          const g=new THREE.BoxGeometry(0.01,0.01,0.01);
          mats.forEach((fl,m)=>{for(const recv of [false,true]){if(!(fl&(recv?2:1)))continue;const c=m.clone();c.color.setRGB(1,1,1);
            const bm=new THREE.BatchedMesh(1,g.attributes.position.count,g.index.count,c);bm.setColorAt(bm.addInstance(bm.addGeometry(g)),m.color);
            bm.perObjectFrustumCulled=false;bm.frustumCulled=false;bm.castShadow=true;bm.receiveShadow=recv;scene.add(bm);stand.push([bm,null]);}});
          stand.push([{material:null,dispose(){}},g]);}
        // ...and a per-object-color twin of every static scenery batch's material: a look first drawn in the scenery can
        // later turn up on moving things, and their batch then needs the color variant of the same shader
        for(const sb of SM.bms){const g=new THREE.BoxGeometry(0.01,0.01,0.01),c=sb.material.clone();c.color.setRGB(1,1,1);
          const bm=new THREE.BatchedMesh(1,g.attributes.position.count,g.index.count,c);bm.setColorAt(bm.addInstance(bm.addGeometry(g)),new THREE.Color(1,1,1));
          bm.perObjectFrustumCulled=false;bm.frustumCulled=false;bm.castShadow=sb.castShadow;bm.receiveShadow=sb.receiveShadow;scene.add(bm);stand.push([bm,g]);}
        for(const id in FX){if(!FX[id].g.visible){FX[id].g.visible=true;shown.push(FX[id].g);}}
        // v4.1 pass 3: the sky, terrain, clouds and mist never appear with an effect-only shader, and they already compiled for the
        // screen on the first frame; keeping them out of this off-screen pass saves their render-target shader variants
        const wld=[G3.terrain,G3.SKY&&G3.SKY.dome,G3.SKY&&G3.SKY.clouds&&G3.SKY.clouds.mesh,G3.SKY&&G3.SKY.mist&&G3.SKY.mist.mesh,G3.nightWin].filter(Boolean),wv=wld.map(o=>o.visible);wld.forEach(o=>o.visible=false);
        // v4.1 pass 3: drawn to the screen behind a 1 px scissor rather than into a render target: a target has its own output
        // colour space, and every material drawn there compiled a second program that play never uses (about 30 of them)
        if(G3.dbTick)G3.dbTick();renderer.shadowMap.needsUpdate=true;renderer.setScissorTest(true);renderer.setScissor(0,0,1,1);renderer.render(scene,camera);
        renderer.setScissorTest(false);shown.forEach(g=>g.visible=false);wld.forEach((o,i)=>o.visible=wv[i]);renderer.shadowMap.needsUpdate=true;
        // v4.0.1: the stand-ins' materials are kept, not disposed: three.js deletes a shader program once no material uses it,
        // which threw away every shader compiled only for a stand-in
        G3.keepMats=stand.map(([bm])=>bm.material).filter(Boolean);stand.forEach(([bm,g])=>{if(bm.isObject3D)scene.remove(bm);bm.dispose();if(g)g.dispose();});}catch(e){console.error("warm render failed",e);}
      try{renderer.compileAsync(scene,camera).then(done,done);}catch(e){done();}};
    requestAnimationFrame(stepW);}));
  function fxUpdate(rdt,now){
    for(const id in FX){FX[id].g.visible=false;FX[id].on=false;}   // v4.0.1: labels are hidden after the loop, and only if shown
    [wireLoop,...feltMeshes].forEach(m=>{m.scale.z=1;m.visible=true;});clothTick(now,rdt);
    const doTxt=now-lastIncTxt>200;if(doTxt)lastIncTxt=now;const w=G3.vw||host.clientWidth,hh=G3.vh||host.clientHeight;
    S.inc.forEach((inc,i)=>{let f=FX[inc.id];
      if(!f)f=makeFX(inc.id);
      if(G3.EXP&&G3.EXP.hideFX===inc.id){f.g.visible=false;return;}   // autotest GPU probe: this effect off (no drawing, no new particles)
      f.g.visible=true;f.on=true;f.up(now,rdt,inc);if(f.pinPos)f.pin.move(f.pinPos[0],f.pinPos[1]);f.pin.update(now);
      {const zp=!G3.zen;f.pin.p.visible=f.pin.ring.visible=f.pin.stem.visible=zp;}   // v3.0.1: zen mode shows events without the red pins
      tmp.set(f.pin.x,f.pin.p.position.y+3.4,f.pin.z).project(camera);const vis=!G3.zen&&tmp.z<1&&Math.abs(tmp.x)<1.1&&Math.abs(tmp.y)<1.1;f.lb.vis=vis;
      if(vis){f.lb.x=Math.round((tmp.x+1)/2*w);f.lb.y=Math.round((1-tmp.y)/2*hh);
        if(doTxt||f.lb.a==null){const st=incState(inc),b=`${st?st+" · ":""}${(inc.left/60).toFixed(1)} h left${inc.note?" · "+inc.note.split(" · ")[0]:""}`;lblSet(f.lb,EV[inc.id].name,b,true);}}});
    for(const id in FX){const f=FX[id];if(!f.on)f.lb.vis=false;}
    stepParts(rdt);fireLight.position.copy(fireLpos);fireFloorK=Math.max(0,fireFloorK-rdt*1.5);
    {const fl=0.9*Math.sin(performance.now()/60)+0.6*Math.sin(performance.now()/23),on=fireFloor.userData.on||0;fireLight.intensity=fireL>0?LEG*0.75*fireL*(3.4+fl+fireFloorK*3):0;
      fireFloor.visible=on>0;if(on>0){if(!fireFloor.material.map){fireFloor.material.map=spriteTex((x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.4,"rgba(255,255,255,0.6)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,w);});fireFloor.material.needsUpdate=true;}fireFloor.material.opacity=Math.min(1,on*(0.42+0.1*fl+fireFloorK*0.25));}fireFloor.userData.on=0;}fireL=0;
    if(!S.inc.some(i=>i.id==="brownout"))G3.brownK=1;if(!S.inc.some(i=>i.id==="duststorm"))G3.dustK=0;if(!S.inc.some(i=>i.id==="flood"))G3.floodK=0;
    const out=S.inc.some(i=>i.id==="lightning");if(blackEl.hidden!==!out)blackEl.hidden=!out;if(!out){const fl=$("flash3d");if(fl.style.opacity!=="0")fl.style.opacity=0;}
  }

