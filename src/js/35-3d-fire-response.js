  /* ---- fire response: hoses and extinguishers ---- */
  const DRYFIRE=[];for(let i=0;i<10;i++)DRYFIRE.push([(872-i*32-600)/10,6.4,zc+(i%2?1.2:-1.2)]);
  const BALEFIRE=[];for(let k=0;k<10;k++)BALEFIRE.push([-29+k*2,1.6+(k%3)*0.9,-7.5-(k%4)*3]);
  const HYD={pm:[12,17.8],recv:[-4,-1.8]};
  Object.values(HYD).forEach(([x,z])=>{const h=new THREE.Group();const b=new THREE.Mesh(new CylG(0.28,0.34,0.9,14),M.bad);b.position.y=0.45;b.castShadow=true;
    const cap=new THREE.Mesh(new SphG(0.3,14,8,0,Math.PI*2,0,Math.PI/2),M.bad);cap.position.y=0.9;h.add(b,cap);h.position.set(x,0,z);scene.add(h);});
  const hoseM=mat("bad",{roughness:0.6});
  function hoseLine(){const m=new THREE.Mesh(new CylG(0.07,0.07,1,8),hoseM);m.visible=false;scene.add(m);return m;}
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
  function stretch(m,ax,ay,az,bx,by,bz){_a.set(ax,ay,az);_b.set(bx,by,bz);const d=_b.clone().sub(_a),L=d.length();m.position.copy(_a).add(_b).multiplyScalar(0.5);m.scale.set(1,L,1);m.quaternion.setFromUnitVectors(_up,d.normalize());m.visible=true;}
  function stretch2(m,ax,ay,az,bx,by,bz){stretch(m,ax,ay,az,bx,by,bz);}
  function nozzlePos(w){const a=w.rotation.y;return [w.position.x+Math.cos(a)*0.95,1.45,w.position.z-Math.sin(a)*0.95];}
  // spray: droplets on a ballistic arc that lands on the target
  function spray(w,tgt,kind){const [nx,ny,nz]=nozzlePos(w),t=0.75,dx=tgt[0]+R()*1.2-nx,dy=tgt[1]-ny,dz=tgt[2]+R()*1.2-nz;
    if(kind==="hose")emit("drop",nx,ny,nz,dx/t,dy/t+8*t,dz/t,t+0.15,0.34,"#3d8fd6",0.9);
    else emit("steam",nx,ny,nz,dx/t*0.7,dy/t+1,dz/t*0.7,0.9,1.2,"#ffffff",0.85);}
  const nearest=(list,x)=>list.reduce((b,s)=>Math.abs(s[0]-x)<Math.abs(b[0]-x)?s:b,list[0]);
  // machine crew spots during a dryer fire: five on hoses at the front aisle, two with extinguishers at the back
  const FIRESPOT=[[24,14.4,"hose"],[18,14.4,"hose"],[12,14.4,"hose"],[6,14.4,"hose"],[0,14.4,"hose"],[20,4.0,"ext"],[8,4.0,"ext"]];
  G3.crewSpots=()=>({HOME,HAY,RT,BRKSPOT,FIRESPOT,SITES});
  const crewHose=FIRESPOT.map(()=>hoseLine());
  // bale yard fire brigade: four firefighters with red helmets spray over the receiving wall
  const brigade=[0,1,2,3].map(k=>{const w=worker(M.warn,M.bad);w.visible=false;w.userData.home=[-4,-0.6];w.userData.spot=[-6.4,-6-k*4];w.userData.hose=hoseLine();w.position.set(-4,0,-0.6);return w;});
  function fireCrew(w,i,rdt,now,on){const s=FIRESPOT[i];const arrived=moveP(w,s[0],s[1],10,rdt);
    const tgt=nearest(DRYFIRE,s[0]);if(arrived)face(w,tgt[0],tgt[2],rdt);pose(w,arrived?s[2]:"run",now);
    if(s[2]==="hose"){const [nx,,nz]=nozzlePos(w);stretch(crewHose[i],HYD.pm[0],0.35,HYD.pm[1],nx-Math.cos(w.rotation.y)*0.6,1.05,nz+Math.sin(w.rotation.y)*0.6);}
    if(arrived)for(let k=0;k<2;k++)if(Math.random()<rdt*(s[2]==="hose"?26:14))spray(w,tgt,s[2]);}
  function brigadeUpdate(rdt,now){const on=S.inc.some(i=>i.id==="balefire");
    brigade.forEach((w,k)=>{const u=w.userData;
      if(on){if(!w.visible){w.visible=true;w.position.set(u.home[0],0,u.home[1]);}
        const a=moveP(w,u.spot[0],u.spot[1],10,rdt);const tgt=BALEFIRE[(k*3+((now/1500)|0))%BALEFIRE.length];if(a)face(w,tgt[0],tgt[2],rdt);pose(w,a?(k===3?"ext":"hose"):"run",now);
        const [nx,,nz]=nozzlePos(w);if(k<3)stretch(u.hose,HYD.recv[0],0.35,HYD.recv[1],nx-Math.cos(w.rotation.y)*0.6,1.05,nz+Math.sin(w.rotation.y)*0.6);else u.hose.visible=false;
        if(a)for(let j=0;j<2;j++)if(Math.random()<rdt*(k===3?14:26))spray(w,[tgt[0],tgt[1]+1.5,tgt[2]],k===3?"ext":"hose");}
      else if(w.visible){u.hose.visible=false;if(moveP(w,u.home[0],u.home[1],8,rdt))w.visible=false;else pose(w,"run",now);}});}

