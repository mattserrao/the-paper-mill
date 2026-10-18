  /* ---- v6.1 iso: a limited palette per season and a time-of-day colour shift ----
     Season (spring, summer, autumn, winter): each Season run gets one, rolled when it starts (like the bottleneck: cosmetic,
     no sim stream); survival moves on one every wave; free play and Zen turn every 7 game days. The trees, bushes and grass
     (the scenery's and the ground's vertex colours) are recoloured once when it changes: fresh yellow-greens with a few
     blossoms in spring, oranges, reds and golds in autumn, bare branches, dark conifers and snow in winter.
     Time of day: one full-screen multiply (one draw, no render target) tints the whole picture: warm at dawn, clean by day,
     rose at dusk, blue at night, on top of the season's own cast. The lights still dim at night as before (36). */
  {const PALS=["spring","summer","autumn","winter"];G3.PALS=PALS;
   const SEASON_TINT={spring:[1.0,0.975,0.975],summer:[1,0.99,0.95],autumn:[1.0,0.94,0.86],winter:[0.92,0.95,1.0]};
   const gq=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({vertexShader:"void main(){gl_Position=vec4(position.xy,0.0,1.0);}",
     fragmentShader:"uniform vec3 uTint;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){vec2 q=gl_FragCoord.xy;float g=0.55*n(q*0.35)+0.3*n(q*vec2(0.08,0.9))+0.15*h(q);gl_FragColor=vec4(uTint*(0.955+0.06*g),1.0);}",uniforms:{uTint:{value:new THREE.Vector3(1,1,1)}},
     blending:THREE.MultiplyBlending,premultipliedAlpha:true,transparent:true,depthTest:false,depthWrite:false,fog:false,toneMapped:false}));
   gq.frustumCulled=false;gq.renderOrder=9995;gq.name="time of day grade";gq.userData.smBatch=true;scene.add(gq);(G3.dynLater||(G3.dynLater=[])).push(gq);
   const ut=gq.material.uniforms.uTint.value;
   // which season is showing
   function palNow(){if(!S)return 1;const base=S.pal!=null?S.pal:1;
     if(S.season&&S.season.surv)return (base+survWave()-1)%4;if(S.season&&S.season.on)return base;return (base+Math.floor((S.t||0)/1440/7))%4;}
   // recolour the scenery and the ground (originals kept, so any season can follow any other)
   const ORIG=new Map(),_c=new THREE.Color(),hsl={h:0,s:0,l:0};
   const hh=(x,z)=>{const v=Math.sin(Math.floor(x/2.5)*12.9898+Math.floor(z/2.5)*78.233)*43758.5453;return v-Math.floor(v);};
   function recolour(mesh,pal,ground,i0=0,i1=Infinity){const g=mesh&&mesh.geometry;if(!g||!g.attributes.color)return 0;const ca=g.attributes.color,pa=g.attributes.position;
     let o=ORIG.get(mesh);if(!o){o=Float32Array.from(ca.array);ORIG.set(mesh,o);}
     const a=ca.array,st=ca.itemSize;let n=0;mesh.updateMatrixWorld();const e=mesh.matrixWorld.elements;
     for(let i=i0,ie=Math.min(ca.count,i1);i<ie;i++){const j=i*st;_c.setRGB(o[j],o[j+1],o[j+2]);_c.getHSL(hsl);
       const veg=hsl.h>0.16&&hsl.h<0.47&&hsl.s>0.1&&hsl.l>0.06&&hsl.l<0.85;
       if(!veg){a[j]=o[j];a[j+1]=o[j+1];a[j+2]=o[j+2];continue;}
       const lx=pa.getX(i),lz=pa.getZ(i),wx=e[0]*lx+e[8]*lz+e[12],wz=e[2]*lx+e[10]*lz+e[14],r=hh(wx,wz);n++;
       // (v6.1 t12: spring and summer pulled apart: spring is pale yellow-green with blossom (pink and cream) on a fifth of
       // the trees; summer is deep, saturated green on darker grass)
       if(pal===0){if(!ground&&r<0.2)_c.setHSL(r<0.12?0.95:0.11,r<0.12?0.6:0.45,Math.min(0.86,hsl.l*1.4+0.3));else _c.setHSL(0.2+0.03*r,Math.min(1,hsl.s*0.95+0.12),Math.min(0.88,hsl.l*1.18+0.06));}
       else if(pal===1){_c.setHSL(0.31+0.03*(r-0.5),Math.min(1,hsl.s*1.2+0.05),Math.max(0.1,hsl.l*(ground?0.86:0.8)));}
       else if(pal===2){if(ground)_c.setHSL(0.15+0.03*r,hsl.s*0.85,hsl.l*0.97);
         else{const pick=r<0.38?[0.075,0.85]:r<0.62?[0.015,0.7]:r<0.86?[0.12,0.8]:[hsl.h,hsl.s];_c.setHSL(pick[0],Math.max(hsl.s,pick[1]*0.8),Math.min(0.75,hsl.l*1.05+0.02));}}
       else{if(ground)_c.setHSL(0.6,0.12,Math.min(0.93,0.78+hsl.l*0.15));
         else if(r<0.45)_c.setHSL(hsl.h,hsl.s*0.55,hsl.l*0.7);   // conifers and evergreens: darker, duller
         else _c.setHSL(0.07,0.14,Math.min(0.5,hsl.l*0.75+0.08));}   // bare branches
       a[j]=_c.r;a[j+1]=_c.g;a[j+2]=_c.b;}
     if(i1>=ca.count)ca.needsUpdate=true;return n;}   // (uploaded once, when its last chunk is done)
   let shownPal=-1,chkT=0;   /* (t12: summer is a recolour too now, so nothing counts as shown until the first one) */G3.palShown=()=>PALS[shownPal];
   // v6.1 t3: one mesh per frame instead of all at once (no single long frame when a season starts)
   let palQ=[],palN=0;
   G3.setPal=p=>{p=((p%4)+4)%4;if(p===shownPal&&ORIG.size)return;shownPal=p;palN=0;
     palQ=[...(G3.scenery&&G3.scenery.parts||[]).map(m=>[m,false,0]),...(G3.terrain?[[G3.terrain,true,0]]:[])];if(!ORIG.size)ORIG.set(gq,null);};
   function palStep(){const CH=3000,t0=performance.now();   // (v6.1 t12: as many 3,000-vertex chunks as fit in 3 ms a frame: a season turns in a few frames, not a slow wipe)
     while(palQ.length&&performance.now()-t0<3){const it=palQ[0];
     try{const g=it[0].geometry,cnt=g&&g.attributes.color?g.attributes.color.count:0;palN+=recolour(it[0],shownPal,it[1],it[2],it[2]+CH);it[2]+=CH;if(it[2]>=cnt)palQ.shift();}catch(e){palQ.shift();console.error("palette failed",e);}}
     if(!palQ.length)diag(`palette: ${PALS[shownPal]} (${palN} vertices recoloured)`);}
   // every frame: the time-of-day grade; once a second, the season
   G3.palTick=now=>{if(palQ.length)palStep();if(now>chkT){chkT=now+1000;const p=palNow();if(p!==shownPal||!ORIG.size&&p!==1)G3.setPal(p);}
     const hr=S?((S.t+360)/60)%24:12,bump=(c,w)=>Math.max(0,1-Math.abs(((hr-c+36)%24)-12)/w);
     const dawn=bump(6.6,1.6),dusk=bump(19.2,1.5),night=G3.nightK!=null?G3.nightK:0,st=SEASON_TINT[PALS[shownPal]]||SEASON_TINT.summer;
     let r=st[0],g=st[1],b=st[2];
     g*=1-0.06*dawn;b*=1-0.14*dawn;      // dawn: peach
     g*=1-0.12*dusk;b*=1-0.04*dusk;     // dusk: rose
     r*=1-0.3*night;g*=1-0.22*night;b*=1-0.02*night;  // night: blue
     ut.set(r,g,b);gq.visible=true;};}   // (v6.1 t8: always on: it carries the paper grain too)
