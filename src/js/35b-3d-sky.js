  /* ---- v4.1 pass 3: the sky. A gradient dome (zenith to horizon, a glow round the sun) instead of a flat colour,
     a few drifting clouds, and mist banks over the water at dawn. envUpdate (36) drives it every frame through
     G3.skyTick with the sky colour it already computes for the fog. Clouds and mist are camera-facing quads in one
     mesh each (one draw), their corners rewritten per frame; none on the Low tier. ---- */
  const SKY={n:0};G3.SKY=SKY;
  if(!new URLSearchParams(location.search).has("nosky")){const uni={top:{value:new THREE.Color(0.5,0.6,0.8)},hor:{value:new THREE.Color(0.8,0.85,0.9)},sunDir:{value:sun.position.clone().normalize()},glow:{value:new THREE.Color(1,0.85,0.6)},gk:{value:0}};
    const skyMat=new THREE.ShaderMaterial({uniforms:uni,
      vertexShader:"varying vec3 vDir;void main(){vDir=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=vec4(p.xy,p.w*0.99999,p.w);}",
      // the dome is a band from 11 degrees below the horizon to 35 degrees above it: the gradient reaches the clear colour at its
      // top edge, so looking down at the mill (the usual view) draws no sky pixels at all, and the horizon still gets its glow
      fragmentShader:"uniform vec3 top,hor,glow,sunDir;uniform float gk;varying vec3 vDir;void main(){vec3 d=normalize(vDir);float t=clamp(d.y/0.57,0.0,1.0);vec3 c=mix(hor,top,pow(t,0.6));float s=max(dot(d,sunDir),0.0);c+=glow*gk*(pow(s,12.0)*0.55+pow(s,4.0)*0.1);gl_FragColor=vec4(c,1.0);\n#include <colorspace_fragment>\n}",
      side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,toneMapped:false});
    const dome=new THREE.Mesh(new THREE.SphereGeometry(1000,32,6,0,Math.PI*2,0.96,0.8),skyMat);dome.renderOrder=-100;dome.frustumCulled=false;dome.userData.noNav=true;scene.add(dome);
    SKY.dome=dome;SKY.uni=uni;
    // a soft cloud sprite texture (shared by clouds and mist)
    const cT=(()=>{const c=document.createElement("canvas");c.width=256;c.height=128;const x=c.getContext("2d");
      const puff=(px,py,r,a)=>{const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(0.55,`rgba(255,255,255,${a*0.55})`);g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,7);x.fill();};
      for(let k=0;k<18;k++)puff(30+Math.random()*196,48+Math.random()*40,24+Math.random()*32,0.6+Math.random()*0.4);
      puff(128,70,80,0.45);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
    // a set of camera-facing quads in one mesh: list of {x,y,z,w,h,o(pacity),drift}
    function billboards(n,color,opacity){const g=new THREE.BufferGeometry(),pos=new Float32Array(n*12),uv=new Float32Array(n*8),idx=[],nrm=new Float32Array(n*12);
      for(let i=0;i<n;i++){const b=i*4;idx.push(b,b+1,b+2,b,b+2,b+3);uv.set([0,0,1,0,1,1,0,1],i*8);for(let k=0;k<4;k++)nrm[i*12+k*3+1]=1;}
      g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setAttribute("normal",new THREE.BufferAttribute(nrm,3));g.setAttribute("uv",new THREE.BufferAttribute(uv,2));g.setIndex(idx);
      const m=new THREE.MeshBasicMaterial({map:cT,color,transparent:true,opacity,depthWrite:false,fog:true,toneMapped:false});
      const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.visible=false;mesh.userData.noNav=true;scene.add(mesh);
      const items=[];return {mesh,items,pos,update(){const cam=camera,r=_sr.setFromMatrixColumn(cam.matrixWorld,0),u=_su.setFromMatrixColumn(cam.matrixWorld,1);
        for(let i=0;i<items.length;i++){const it=items[i],hw=it.w/2,hh=it.h/2,b=i*12;
          pos[b]=it.x-r.x*hw-u.x*hh;pos[b+1]=it.y-r.y*hw-u.y*hh;pos[b+2]=it.z-r.z*hw-u.z*hh;
          pos[b+3]=it.x+r.x*hw-u.x*hh;pos[b+4]=it.y+r.y*hw-u.y*hh;pos[b+5]=it.z+r.z*hw-u.z*hh;
          pos[b+6]=it.x+r.x*hw+u.x*hh;pos[b+7]=it.y+r.y*hw+u.y*hh;pos[b+8]=it.z+r.z*hw+u.z*hh;
          pos[b+9]=it.x-r.x*hw+u.x*hh;pos[b+10]=it.y-r.y*hw+u.y*hh;pos[b+11]=it.z-r.z*hw+u.z*hh;}
        g.setDrawRange(0,items.length*6);g.attributes.position.needsUpdate=true;g.computeBoundingSphere();}};}
    const _sr=new THREE.Vector3(),_su=new THREE.Vector3();
    const tier=G3.GFX||{},nCloud=new URLSearchParams(location.search).has("noclouds")?0:tier.tier==="low"?0:tier.tier==="medium"?4:tier.tier==="ultra"?14:10;
    const clouds=billboards(Math.max(1,nCloud),0xffffff,0.85),mist=billboards(8,0xf2f7ff,0.5);
    for(let i=0;i<nCloud;i++)clouds.items.push({x:-500+Math.random()*1000,y:150+Math.random()*90,z:-450+Math.random()*900,w:90+Math.random()*120,h:30+Math.random()*24,v:1.2+Math.random()*1.5});
    SKY.clouds=clouds;SKY.mist=mist;SKY.mistOn=tier.tier!=="low"&&(SITE.env==="swamp"||SITE.env==="rural");
    // mist banks: over the ponds in the bayou, along the river in the valley; placed on the first tick (the ponds come from the scenery)
    SKY.placeMist=()=>{if(SKY.mistSet)return;SKY.mistSet=true;const it=mist.items;
      // five overlapping banks along the river either side of the mill, then (bayou) the ponds nearest the mill
      for(let k=0;k<5;k++)it.push({x:-200+k*100+(Math.random()-0.5)*20,y:2.4,z:-66+(Math.random()-0.5)*6,w:115+Math.random()*30,h:9,ph:Math.random()*6});
      if(SITE.env==="swamp"&&G3.ponds&&G3.ponds.length){G3.ponds.slice().sort((a,b)=>Math.hypot(a[0],a[1])-Math.hypot(b[0],b[1])).slice(0,3).forEach(([x,z,r])=>it.push({x,y:2.2,z,w:r*2.6+20,h:7+r*0.2,ph:Math.random()*6}));}
      for(let k=it.length;k<8;k++)it.push({x:-320+k*90+Math.random()*40,y:2.4,z:-66+(Math.random()-0.5)*6,w:70+Math.random()*40,h:8,ph:Math.random()*6});};
    SKY.tick=(rdt,now,day,skyC,dustK)=>{const u=uni,dawn=1-Math.abs(day*2-1);
      // zenith: the fog/sky colour; horizon: paler by day, warm at dawn and dusk, dark blue at night; dust turns everything tan
      u.top.value.copy(skyC);
      u.hor.value.copy(skyC).lerp(_c1.set(0.96,0.95,0.9),0.5*day+0.35*dawn).lerp(_c2.set(1.0,0.62,0.3),0.6*dawn*dawn).lerp(_c3.set(0.07,0.09,0.16),0.6*(1-day)*(1-dawn)).lerp(_c4.set(0.78,0.62,0.38),dustK*0.6);
      u.glow.value.set(1,0.82,0.55).lerp(_c2.set(1,0.5,0.25),dawn*dawn);u.gk.value=(0.5*day+0.9*dawn*dawn)*(1-dustK*0.7);
      dome.position.copy(camera.position);
      // looking down at the mill, the top of the view is below the dome band (and well below the clouds): skip those draws
      // (both stay on for the first ticks so their shaders compile at the start, not on the first tilt up)
      camera.getWorldDirection(_fw);const topEl=SKY.n++<90?9:Math.asin(Math.max(-1,Math.min(1,_fw.y)))+camera.fov*Math.PI/360;
      dome.visible=topEl>-0.33;
      if(nCloud&&clouds.mesh){clouds.mesh.visible=topEl>0.15;if(clouds.mesh.visible){clouds.mesh.material.opacity=(0.8*day+0.12)*(1-dustK);clouds.mesh.material.color.setScalar(0.55+0.45*day);
        for(const c of clouds.items){c.x+=rdt*c.v;if(c.x>560)c.x-=1120;}clouds.update();}}
      if(SKY.mistOn){SKY.placeMist();const hr=((S.t+360)/60)%24,k=Math.max(0,1-Math.abs(hr-6.3)/2.4)*0.85+Math.max(0,1-Math.abs(hr-19.6)/1.6)*0.35,wet=S.wx==="fog"?0.6:S.wx==="rain"?0.2:0;
        const op=Math.min(1,k+wet)*(SITE.env==="swamp"?0.85:0.5);mist.mesh.visible=op>0.02;if(op>0.02){mist.mesh.material.opacity=op;for(const m of mist.items){m.x+=rdt*0.6;m.y=2.2+0.4*Math.sin(now/4000+m.ph);}mist.update();}}};
    const _c1=new THREE.Color(),_c2=new THREE.Color(),_c3=new THREE.Color(),_c4=new THREE.Color(),_fw=new THREE.Vector3();}
