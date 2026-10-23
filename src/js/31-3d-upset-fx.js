  /* ---- step 3 (restyled): chaos effects in the clean isometric look ---- */
  function basic(token,opts={}){const m=new THREE.MeshBasicMaterial(opts);m.userData.token=token;MATS.push(m);return m;}
  const FM0={slime:mat("slime",{roughness:0.3}),beaver:mat("beaver",{roughness:0.8}),white:mat("panel"),water:mat("water",{transparent:true,opacity:0.55,roughness:0.08,metalness:0.2,depthWrite:false}),pulp:mat("pulp",{transparent:true,opacity:0.82,roughness:0.2,metalness:0.05,depthWrite:false}),
    rain:basic("water",{transparent:true,opacity:0.55}),scab:mat("beaver",{roughness:0.9}),cone:mat("fire",{roughness:0.5}),belly:mat("kraft",{roughness:0.85})};
  // v6.1 t13: flood water and spilled stock as layered paper: cut-strip texture, nearly opaque (they were glossy see-through sheets)
  const FM=FM0;if(G3.papWater){const wt=G3.paperWater(false);wt.repeat.set(4,4);FM.water.map=wt;FM.water.opacity=0.88;const pt=G3.paperWater(false);pt.repeat.set(3,3);FM.pulp.map=pt;FM.pulp.opacity=0.92;}
  const sphereG=new SphG(1,20,14),cubeG=new THREE.BoxGeometry(1,1,1);
  const lin=c=>new THREE.Color(c).convertSRGBToLinear();
  function spriteTex(draw,w=128,h=w){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
  const TX={
    puff:spriteTex((x,w)=>{for(let k=0;k<8;k++){const cx=w/2+(Math.random()-0.5)*w*0.32,cy=w/2+(Math.random()-0.5)*w*0.32,r=w*(0.2+Math.random()*0.14),g=x.createRadialGradient(cx,cy,0,cx,cy,r);
      g.addColorStop(0,"rgba(255,255,255,0.85)");g.addColorStop(0.6,"rgba(255,255,255,0.45)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,w);}}),
    /* v6.1 t13: flames cut from paper: a red outer shape with an ink line, orange and yellow cut inside it; four shapes in
       a 2x2 sheet that each flame swaps between (stop-motion flicker). ?softfire = the old glowing flames */
    flame:/[?&]softfire/.test(location.search)?spriteTex((x,w,h)=>{const g=x.createRadialGradient(w/2,h*0.7,2,w/2,h*0.62,w*0.55);g.addColorStop(0,"rgba(255,252,230,1)");g.addColorStop(0.25,"rgba(255,214,90,0.95)");
      g.addColorStop(0.62,"rgba(244,104,30,0.8)");g.addColorStop(1,"rgba(244,104,30,0)");x.fillStyle=g;x.beginPath();x.moveTo(w/2,3);x.bezierCurveTo(w*0.98,h*0.45,w*0.92,h*0.97,w/2,h-3);x.bezierCurveTo(w*0.08,h*0.97,w*0.02,h*0.45,w/2,3);x.fill();},96,128)
     :spriteTex((x,W)=>{const T=W/2;x.clearRect(0,0,W,W);
      const shape=(ox,oy,s,v,lean)=>{const w=T*s,h=T*0.94*s,cx=ox+T/2+lean*T*0.06,by=oy+T*0.97;x.beginPath();x.moveTo(cx+lean*w*0.12,by-h);
        x.bezierCurveTo(cx+w*0.2,by-h*0.72,cx+w*(0.52+0.06*v),by-h*0.55,cx+w*0.4,by-h*0.18);x.quadraticCurveTo(cx+w*0.3,by,cx,by);x.quadraticCurveTo(cx-w*0.3,by,cx-w*0.42,by-h*0.2);
        x.bezierCurveTo(cx-w*(0.5-0.05*v),by-h*0.5,cx-w*0.12,by-h*(0.62+0.05*v),cx-w*0.06,by-h*(0.78-0.04*v));x.quadraticCurveTo(cx+w*0.02,by-h*0.82,cx+lean*w*0.12,by-h);x.closePath();};
      for(let k=0;k<4;k++){const ox=(k%2)*T,oy=Math.floor(k/2)*T,v=[0,1,-1,0.5][k],ln=[0,1,-1,0.4][k];
        x.lineJoin="round";shape(ox,oy,0.86,v,ln);x.fillStyle="#d63a24";x.fill();x.lineWidth=T*0.045;x.strokeStyle="#2b1d12";x.stroke();
        x.save();x.translate(ox+T/2,oy+T*0.97);x.scale(0.68,0.66);x.translate(-(ox+T/2),-(oy+T*0.97));shape(ox,oy,0.86,-v,-ln*0.6);x.fillStyle="#f28a1e";x.fill();x.restore();
        x.save();x.translate(ox+T/2,oy+T*0.97);x.scale(0.38,0.4);x.translate(-(ox+T/2),-(oy+T*0.97));shape(ox,oy,0.86,v,ln*0.5);x.fillStyle="#ffd23f";x.fill();x.restore();}},256),
    dot:spriteTex((x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.45,"rgba(255,255,255,0.95)");g.addColorStop(0.7,"rgba(255,255,255,0.35)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,w);},32),
    drop:spriteTex((x,w)=>{x.fillStyle="#ffffff";x.beginPath();x.moveTo(w/2,2);x.bezierCurveTo(w*0.85,w*0.5,w*0.8,w*0.95,w/2,w-2);x.bezierCurveTo(w*0.2,w*0.95,w*0.15,w*0.5,w/2,2);x.fill();},32),
    /* v6.1 t12: the smoke stack's plume as paper cut-outs: a cloud cut from card, ink line round the edge, a shaded lower
       half like a fold, the same finish as the cut-out people */
    paper:spriteTex((x,w)=>{const B=[[0.5,0.56,0.25],[0.3,0.6,0.18],[0.7,0.6,0.19],[0.4,0.4,0.19],[0.62,0.41,0.17],[0.5,0.7,0.17]];
      const blob=(grow,fill)=>{x.fillStyle=fill;x.beginPath();for(const [cx,cy,r] of B){x.moveTo(cx*w+r*w+grow,cy*w);x.arc(cx*w,cy*w,r*w+grow,0,Math.PI*2);}x.fill();};
      x.clearRect(0,0,w,w);blob(w*0.035,"#2b1d12");blob(0,"#fbf6ea");
      x.save();x.globalCompositeOperation="source-atop";const g=x.createLinearGradient(0,w*0.35,0,w*0.9);g.addColorStop(0,"rgba(255,255,255,0)");g.addColorStop(0.55,"rgba(214,204,186,0.0)");g.addColorStop(0.56,"rgba(214,204,186,0.55)");g.addColorStop(1,"rgba(190,178,158,0.7)");
      x.fillStyle=g;x.fillRect(0,0,w,w);x.restore();
      x.save();x.globalCompositeOperation="source-atop";x.fillStyle="rgba(255,255,255,0.6)";x.beginPath();x.arc(w*0.38,w*0.36,w*0.06,0,Math.PI*2);x.fill();x.restore();},256),
    // v6.1 t13: warning and status lamps as paper discs with an ink ring (tinted by each lamp's colour), not glows
    disc:spriteTex((x,w)=>{x.clearRect(0,0,w,w);x.fillStyle="#ffffff";x.beginPath();x.arc(w/2,w/2,w*0.33,0,7);x.fill();x.strokeStyle="#2b1d12";x.lineWidth=w*0.07;x.beginPath();x.arc(w/2,w/2,w*0.35,0,7);x.stroke();
      x.fillStyle="rgba(255,255,255,0.7)";x.beginPath();x.arc(w*0.42,w*0.42,w*0.08,0,7);x.fill();},64),
    // v6.1 t13: the lightning bolt cut from yellow card with an ink line
    bolt:spriteTex((x,w,h)=>{x.clearRect(0,0,w,h);const P=[[0.62,0.0],[0.2,0.46],[0.48,0.48],[0.24,1.0],[0.86,0.38],[0.56,0.36],[0.8,0.0]];x.beginPath();P.forEach(([a,b],i)=>{const X=w*(0.08+a*0.84),Y=h*(0.02+b*0.96);i?x.lineTo(X,Y):x.moveTo(X,Y);});x.closePath();
      x.fillStyle="#ffd23f";x.fill();x.lineJoin="round";x.lineWidth=w*0.05;x.strokeStyle="#2b1d12";x.stroke();x.save();x.clip();x.fillStyle="rgba(255,255,255,0.55)";x.fillRect(w*0.45,0,w*0.08,h);x.restore();},128,256),
    chip:spriteTex((x,w)=>{x.fillStyle="#b07a43";x.fillRect(w*0.15,w*0.15,w*0.7,w*0.7);x.fillStyle="#f4efe6";x.fillRect(w*0.4,w*0.15,w*0.08,w*0.7);},32),
    stripes:spriteTex((x,w)=>{x.clearRect(0,0,w,w);x.fillStyle="rgba(214,56,44,0.6)";for(let i=-w;i<w*2;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i+15,0);x.lineTo(i+15-w,w);x.lineTo(i-w,w);x.fill();}}),
    barrier:spriteTex((x,w)=>{x.fillStyle="#ffffff";x.fillRect(0,0,w,w);x.fillStyle="#d6382c";for(let i=-w;i<w*2;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i+16,0);x.lineTo(i+16-w,w);x.lineTo(i-w,w);x.fill();}}),
  };
  TX.stripes.wrapS=TX.stripes.wrapT=THREE.RepeatWrapping;
  /* v6.1 t14: upset props and particles as paper. Cut-out cards: a drawing on card (flat colours, an ink line, the lower part a
     shade darker like a fold), shown as a camera-facing sprite; animated ones swap between two drawings (stop-motion) and
     have a mirrored copy so they face the way they move. ?softfx = the old 3D props and soft particles */
  const INK="#2b1d12",SOFTFX=/[?&]softfx/.test(location.search);
  /* v6.1 t16: paper props dim at night like the cut-out people (to 38% at full night; flags to 55%): each registered
     material keeps its own colour and is scaled from it whenever the night level moves. Flames, sparks, lamps and the
     lightning bolt stay bright. */
  const PAPM=[];let papL=-1;
  function papReg(m,k=0.62){if(m&&m.color){m.userData.c0=m.color.clone();m.userData.dk=k;PAPM.push(m);papL=-1;}return m;}
  function papTick(){const nk=G3.nightK||0;if(Math.abs(nk-papL)<0.004)return;papL=nk;for(const m of PAPM)m.color.copy(m.userData.c0).multiplyScalar(1-m.userData.dk*nk);}
  G3.papReg=papReg;
  function cardTex(draw,w,h){return spriteTex((x,W,H)=>{x.clearRect(0,0,W,H);x.lineJoin="round";x.lineCap="round";draw(x,W,H);
      x.save();x.globalCompositeOperation="source-atop";x.fillStyle="rgba(70,45,20,0.11)";x.fillRect(0,H*0.64,W,H);x.restore();},w,h);}
  function mirrorTex(t){const s=t.image,c=document.createElement("canvas");c.width=s.width;c.height=s.height;const x=c.getContext("2d");x.translate(s.width,0);x.scale(-1,1);x.drawImage(s,0,0);
    const m=new THREE.CanvasTexture(c);m.colorSpace=THREE.SRGBColorSpace;return m;}
  // fill a path, then its ink line
  function ink(x,path,fill,lw){path();if(fill){x.fillStyle=fill;x.fill();}x.lineWidth=lw;x.strokeStyle=INK;x.stroke();}
  const poly=(x,P,u)=>()=>{x.beginPath();P.forEach(([a,b],i)=>i?x.lineTo(a*u,b*u):x.moveTo(a*u,b*u));x.closePath();};
  const ell=(x,cx,cy,rx,ry,u,rot=0)=>()=>{x.beginPath();x.ellipse(cx*u,cy*u,rx*u,ry*u,rot,0,Math.PI*2);};
  function cardSprite(tex,w,h,base){const s=new THREE.Sprite(papReg(new THREE.SpriteMaterial({map:tex,alphaTest:0.5,transparent:false,toneMapped:false})));s.scale.set(w,h,1);if(base)s.center.set(0.5,0);return s;}
  // which way something moving along v from p goes across the screen (+1 right, -1 left)
  const _sa=new THREE.Vector3(),_sb=new THREE.Vector3();
  const screenDir=(p,v)=>{_sa.copy(p).project(camera);_sb.copy(p).add(v).project(camera);return _sb.x>=_sa.x?1:-1;};
  // a card with drawings facing right (r) and their mirror images (l); frame(k, dir) picks one
  function animCard(texs,w,h,base){const r=texs,l=texs.map(mirrorTex),s=cardSprite(r[0],w,h,base);s.frame=(k,dir)=>{const t=(dir<0?l:r)[k];if(s.material.map!==t)s.material.map=t;};return s;}
  // the pigeon, side on, facing right: 0 wings up, 1 wings down, 2 folded (diving)
  const pigeonTex=wing=>cardTex((x,W)=>{const u=W/256,lw=5*u;
    ink(x,poly(x,[[72,104],[16,94],[20,126],[74,122]],u),"#7d8494",lw);x.strokeStyle="#3a3f48";x.lineWidth=7*u;x.beginPath();x.moveTo(30*u,98*u);x.lineTo(32*u,122*u);x.stroke();
    if(wing===1)ink(x,poly(x,[[118,108],[150,104],[150,150],[128,186],[96,178],[104,140]],u),"#959cab",lw);
    ink(x,ell(x,122,110,60,32,u),"#a3aab8",lw);
    if(wing===0){ink(x,poly(x,[[112,100],[96,26],[130,6],[160,30],[156,96]],u),"#b8bfcc",lw);x.strokeStyle="#3a3f48";x.lineWidth=8*u;x.beginPath();x.moveTo(110*u,52*u);x.lineTo(146*u,46*u);x.moveTo(116*u,72*u);x.lineTo(150*u,66*u);x.stroke();}
    if(wing===2){ink(x,poly(x,[[78,100],[150,90],[172,104],[150,118],[92,124]],u),"#b8bfcc",lw);x.strokeStyle="#3a3f48";x.lineWidth=7*u;x.beginPath();x.moveTo(104*u,100*u);x.lineTo(104*u,120*u);x.moveTo(124*u,96*u);x.lineTo(124*u,118*u);x.stroke();}
    if(wing===1){x.strokeStyle="#3a3f48";x.lineWidth=8*u;x.beginPath();x.moveTo(108*u,150*u);x.lineTo(140*u,146*u);x.stroke();}
    ink(x,ell(x,164,94,22,20,u),"#5d8a78",lw);ink(x,ell(x,184,76,24,23,u),"#8d93a0",lw);
    ink(x,poly(x,[[204,70],[226,80],[204,86]],u),"#e0a030",4*u);ink(x,ell(x,190,70,6,6,u),"#d4602a",3*u);x.fillStyle=INK;x.beginPath();x.arc(191*u,70*u,2.5*u,0,7);x.fill();},256,200);
  const PIG=SOFTFX?null:[pigeonTex(0),pigeonTex(1),pigeonTex(2)];
  G3.pigeonCard=()=>PIG?animCard(PIG,1.0,0.78):null;
  // the beaver, side on, facing right, holding a log: 0 teeth down, 1 chewing (mouth open)
  /* the beaver, side on, facing right, holding a log: 0 teeth down, 1 chewing. (t14 rework) One cut-out: every part is
     drawn as a single silhouette with one ink line round the outside (no outlines between the parts), the details
     drawn on top: the belly, the tail's crosshatch, the eye, nose and teeth. */
  const beaverTex=open=>cardTex((x,W)=>{const u=W/320,E=(cx,cy,rx,ry,r=0)=>{x.ellipse(cx*u,cy*u,rx*u,ry*u,r,0,Math.PI*2);x.closePath();};
    const sil=()=>{x.beginPath();E(56,190,54,20,-0.28);E(154,150,96,72);E(118,218,24,12);E(206,222,24,12);E(232,62,13,13);E(250,108,50,46);E(290,128,27,21);E(236,192,16,11);
      x.moveTo(244*u,182*u);x.lineTo(316*u,176*u);x.lineTo(318*u,200*u);x.lineTo(246*u,206*u);x.closePath();E(316,188,7,12,-0.08);};
    // the one outline: the whole silhouette stroked fat, then filled body colour over its inner half
    sil();x.lineWidth=14*u;x.strokeStyle=INK;x.stroke();x.fillStyle="#8a5a32";x.fill("nonzero");
    const F=(c,f)=>{x.fillStyle=c;x.beginPath();f();x.fill();};
    F("#4a3a2e",()=>E(56,190,54,20,-0.28));x.strokeStyle="rgba(255,255,255,0.3)";x.lineWidth=3*u;for(let k=0;k<4;k++){x.beginPath();x.moveTo((26+k*18)*u,(190-k*3)*u);x.lineTo((40+k*18)*u,(208-k*3)*u);x.stroke();}
    F("#5e3d22",()=>{E(118,218,24,12);E(206,222,24,12);});F("#b98a5a",()=>E(182,180,52,36));F("#b98a5a",()=>E(292,130,24,18));F("#6e4626",()=>E(232,62,7,7));
    F("#c8a070",()=>{x.moveTo(244*u,182*u);x.lineTo(316*u,176*u);x.lineTo(318*u,200*u);x.lineTo(246*u,206*u);x.closePath();});F("#e9d2a8",()=>E(316,188,6,10,-0.08));
    x.strokeStyle="#8a6a44";x.lineWidth=2.5*u;x.beginPath();x.arc(316*u,188*u,4*u,0,7);x.stroke();
    F("#8a5a32",()=>E(236,192,15,10));
    if(open)F(INK,()=>E(290,150,13,8));F("#fbf6ea",()=>x.rect(279*u,(open?140:144)*u,18*u,(open?32:22)*u));x.strokeStyle=INK;x.lineWidth=3*u;x.beginPath();x.moveTo(288*u,(open?140:144)*u);x.lineTo(288*u,(open?172:166)*u);x.stroke();
    F(INK,()=>E(310,118,9,7));F("#fbf6ea",()=>E(262,94,9,9));F(INK,()=>E(264,95,5,5));},320,256);
  const BEAV=SOFTFX?null:[beaverTex(0),beaverTex(1)];
  // the car at the brawl (a white car with a light bar), side on
  const carTex=SOFTFX?null:cardTex((x,W)=>{const u=W/320,lw=6*u;
    ink(x,poly(x,[[92,72],[118,36],[214,36],[242,72]],u),"#f4f1ea",lw);ink(x,poly(x,[[106,70],[124,44],[162,44],[162,70]],u),"#a9cbe0",4*u);ink(x,poly(x,[[172,70],[172,44],[208,44],[228,70]],u),"#a9cbe0",4*u);
    ink(x,()=>{x.beginPath();x.roundRect(16*u,70*u,290*u,56*u,16*u);},"#f4f1ea",lw);ink(x,poly(x,[[18,100],[304,100],[304,116],[18,116]],u),"#2f3a49",4*u);
    ink(x,poly(x,[[140,24],[165,24],[165,36],[140,36]],u),"#e8392e",4*u);ink(x,poly(x,[[165,24],[190,24],[190,36],[165,36]],u),"#2f6bff",4*u);
    ink(x,ell(x,296,84,8,6,u),"#ffd23f",3*u);ink(x,ell(x,24,84,6,6,u),"#d63a24",3*u);
    for(const cx of [82,238]){ink(x,ell(x,cx,128,25,25,u),"#2f3a49",lw);ink(x,ell(x,cx,128,10,10,u),"#c9ced6",3*u);}},320,160);
  // highway: a striped barrier on legs, a traffic cone, the tipped tanker
  const barrierTex=SOFTFX?null:cardTex((x,W)=>{const u=W/256,lw=5*u;for(const lx of [44,200]){ink(x,poly(x,[[lx,64],[lx+12,64],[lx+12,118],[lx,118]],u),"#5b6270",4*u);ink(x,poly(x,[[lx-14,114],[lx+26,114],[lx+26,124],[lx-14,124]],u),"#5b6270",4*u);}
    const bd=()=>{x.beginPath();x.rect(10*u,16*u,236*u,50*u);};bd();x.fillStyle="#fbf6ea";x.fill();x.save();bd();x.clip();x.fillStyle="#d6382c";for(let i=-60;i<300;i+=40){x.beginPath();x.moveTo(i*u,16*u);x.lineTo((i+20)*u,16*u);x.lineTo((i-30)*u,66*u);x.lineTo((i-50)*u,66*u);x.fill();}x.restore();
    ink(x,bd,null,lw);},256,128);
  const coneTex=SOFTFX?null:cardTex((x,W)=>{const u=W/96,lw=4*u;ink(x,poly(x,[[6,112],[90,112],[90,124],[6,124]],u),"#d65a14",lw);ink(x,poly(x,[[42,8],[54,8],[78,112],[18,112]],u),"#f2701e",lw);
    ink(x,poly(x,[[33,46],[63,46],[69,70],[27,70]],u),"#fbf6ea",3*u);},96,128);
  const tankerTex=SOFTFX?null:cardTex((x,W,H)=>{const u=W/384,lw=6*u;x.translate(W/2,H/2);x.rotate(-0.2);x.translate(-W/2,-H/2);
    ink(x,()=>{x.beginPath();x.roundRect(40*u,46*u,240*u,90*u,44*u);},"#c9ced6",lw);x.strokeStyle="rgba(255,255,255,0.7)";x.lineWidth=8*u;x.beginPath();x.moveTo(80*u,70*u);x.lineTo(240*u,70*u);x.stroke();
    for(const bx of [110,200]){x.strokeStyle=INK;x.lineWidth=4*u;x.beginPath();x.moveTo(bx*u,48*u);x.lineTo(bx*u,134*u);x.stroke();}
    ink(x,poly(x,[[160,78],[178,96],[160,114],[142,96]],u),"#ffd23f",3*u);
    ink(x,poly(x,[[284,64],[330,64],[352,98],[352,140],[284,140]],u),"#2f6bff",lw);ink(x,poly(x,[[294,72],[326,72],[342,98],[294,98]],u),"#a9cbe0",4*u);
    ink(x,poly(x,[[36,132],[352,132],[352,146],[36,146]],u),"#5b6270",4*u);for(const cx of [80,128,236,318]){ink(x,ell(x,cx,150,20,20,u),"#2f3a49",lw);ink(x,ell(x,cx,150,7,7,u),"#c9ced6",3*u);}},384,192);
  // junk from a bad OCC load: a glass bottle, a foam block, a plastic bag, a tangle of wire
  const junkTex=SOFTFX?null:[cardTex((x,W)=>{const u=W/128;ink(x,()=>{x.beginPath();x.moveTo(56*u,8*u);x.lineTo(72*u,8*u);x.lineTo(72*u,38*u);x.quadraticCurveTo(92*u,48*u,92*u,66*u);x.lineTo(92*u,118*u);x.lineTo(36*u,118*u);x.lineTo(36*u,66*u);x.quadraticCurveTo(36*u,48*u,56*u,38*u);x.closePath();},"#5fae6e",5*u);
      x.fillStyle="rgba(255,255,255,0.55)";x.fillRect(44*u,64*u,8*u,44*u);ink(x,poly(x,[[40,72],[88,72],[88,96],[40,96]],u),"#fbf6ea",3*u);},128,128),
    cardTex((x,W)=>{const u=W/128;ink(x,poly(x,[[14,40],[96,28],[116,52],[112,104],[30,114],[10,88]],u),"#f6f4ee",5*u);x.fillStyle="#c9c4b8";for(let k=0;k<9;k++){x.beginPath();x.arc((30+(k*37)%76)*u,(52+(k*23)%50)*u,4*u,0,7);x.fill();}},128,128),
    cardTex((x,W)=>{const u=W/128;ink(x,()=>{x.beginPath();x.moveTo(22*u,40*u);x.quadraticCurveTo(10*u,90*u,30*u,116*u);x.lineTo(100*u,116*u);x.quadraticCurveTo(120*u,80*u,104*u,40*u);x.closePath();},"#e3ecf2",5*u);
      for(const hx of [34,80]){x.strokeStyle=INK;x.lineWidth=5*u;x.beginPath();x.ellipse((hx+8)*u,30*u,10*u,16*u,0,Math.PI,Math.PI*2);x.stroke();}x.strokeStyle="#9fb0bd";x.lineWidth=3*u;x.beginPath();x.moveTo(40*u,64*u);x.lineTo(56*u,96*u);x.moveTo(78*u,58*u);x.lineTo(86*u,100*u);x.stroke();},128,128),
    cardTex((x,W)=>{const u=W/128;x.strokeStyle=INK;x.lineWidth=9*u;x.beginPath();for(let k=0;k<5;k++)x.ellipse(64*u,70*u,(40-k*5)*u,(26-k*3)*u,k*0.6,0,Math.PI*2);x.stroke();x.strokeStyle="#b56a2e";x.lineWidth=4*u;x.beginPath();for(let k=0;k<5;k++)x.ellipse(64*u,70*u,(40-k*5)*u,(26-k*3)*u,k*0.6,0,Math.PI*2);x.stroke();},128,128)];
  // the snapped driveshaft: a steel bar with a coupling at one end and a jagged break at the other
  const shaftTex=SOFTFX?null:cardTex((x,W)=>{const u=W/256;ink(x,poly(x,[[30,22],[204,22],[214,14],[220,28],[232,20],[226,36],[238,44],[204,42],[30,42]],u),"#b9c0cc",4*u);x.fillStyle="rgba(255,255,255,0.7)";x.fillRect(36*u,25*u,160*u,5*u);
    ink(x,poly(x,[[8,8],[30,8],[30,56],[8,56]],u),"#5b6270",4*u);for(const by of [16,48]){x.fillStyle="#c9ced6";x.beginPath();x.arc(19*u,by*u,3*u,0,7);x.fill();}},256,64);
  // paper ice: floes cut from pale blue card with ink cracks, and the shelf along the bank (its jagged edge to the river)
  const iceTex=k=>cardTex((x,W)=>{let s=17+k*31;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};const n=7+(k%3),P=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rnd()*0.4,r=W*(0.34+rnd()*0.12);P.push([W/2+Math.cos(a)*r,W/2+Math.sin(a)*r]);}
    ink(x,poly(x,P,1),"#e6f2fa",W*0.035);x.strokeStyle="#8fb3c9";x.lineWidth=W*0.02;for(let j=0;j<3;j++){x.beginPath();let px=W*(0.3+rnd()*0.4),py=W*(0.3+rnd()*0.4);x.moveTo(px,py);for(let q=0;q<3;q++){px+=(rnd()-0.5)*W*0.25;py+=(rnd()-0.5)*W*0.25;x.lineTo(px,py);}x.stroke();}
    x.fillStyle="rgba(255,255,255,0.8)";x.beginPath();x.ellipse(W*0.4,W*0.38,W*0.08,W*0.04,-0.5,0,7);x.fill();},128,128);
  const shelfTex=SOFTFX?null:cardTex((x,W,H)=>{let s=5;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};const P=[[2,H-2],[2,H*0.3]];for(let i=1;i<=24;i++)P.push([W*i/24,H*(0.08+rnd()*0.32)]);P.push([W-2,H-2]);
    ink(x,poly(x,P,1),"#e6f2fa",5);x.strokeStyle="#8fb3c9";x.lineWidth=3;for(let j=0;j<10;j++){x.beginPath();let px=rnd()*W,py=H*(0.45+rnd()*0.45);x.moveTo(px,py);for(let q=0;q<3;q++){px+=(rnd()-0.5)*50;py+=(rnd()-0.5)*30;x.lineTo(px,py);}x.stroke();}},512,128);
  // a dye splat (white: each is tinted its dye colour)
  const splatTex=SOFTFX?null:cardTex((x,W)=>{const c=W/2;x.beginPath();for(let i=0;i<=40;i++){const a=i/40*Math.PI*2,r=W*(0.26+0.06*Math.sin(a*5)+0.05*Math.sin(a*9+1));i?x.lineTo(c+Math.cos(a)*r,c+Math.sin(a)*r):x.moveTo(c+Math.cos(a)*r,c+Math.sin(a)*r);}x.closePath();
    const p=new Path2D();for(const [dx,dy,r] of [[0.38,-0.1,0.06],[-0.36,0.2,0.05],[0.1,0.4,0.045],[-0.15,-0.4,0.05]]){p.moveTo(c+dx*W+r*W,c+dy*W);p.arc(c+dx*W,c+dy*W,r*W,0,7);}
    x.fillStyle="#ffffff";x.fill();x.fill(p);x.lineWidth=W*0.03;x.strokeStyle=INK;x.stroke();x.stroke(p);x.fillStyle="rgba(255,255,255,0.0)";},128,128);
  // particle sheets (2x2, one shape per particle): paper sparks (stars and zigzags), confetti and torn scraps
  const sheet4=(draw)=>spriteTex((x,W)=>{const T=W/2;x.clearRect(0,0,W,W);x.lineJoin="round";for(let k=0;k<4;k++){x.save();x.translate((k%2)*T,Math.floor(k/2)*T);draw(x,T,k);x.restore();}},128);
  TX.star=sheet4((x,T,k)=>{x.beginPath();if(k<2){const n=k?4:5;for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2-Math.PI/2,r=i%2?T*0.17:T*0.42;x.lineTo(T/2+Math.cos(a)*r,T/2+Math.sin(a)*r);}}
    else{const P=k===2?[[0.2,0.15],[0.6,0.35],[0.42,0.48],[0.85,0.85],[0.38,0.6],[0.55,0.5]]:[[0.5,0.08],[0.62,0.4],[0.92,0.5],[0.62,0.6],[0.5,0.92],[0.38,0.6],[0.08,0.5],[0.38,0.4]];P.forEach(([a,b])=>x.lineTo(a*T,b*T));}
    x.closePath();x.fillStyle="#ffffff";x.fill();x.lineWidth=T*0.07;x.strokeStyle=INK;x.stroke();});
  TX.conf=sheet4((x,T,k)=>{x.beginPath();if(k===0)x.rect(T*0.3,T*0.18,T*0.4,T*0.64);else if(k===1){for(let i=0;i<10;i++){const a=i/10*Math.PI*2-Math.PI/2,r=i%2?T*0.16:T*0.38;x.lineTo(T/2+Math.cos(a)*r,T/2+Math.sin(a)*r);}}
    else if(k===2)x.arc(T/2,T/2,T*0.3,0,7);else{[[0.15,0.35],[0.4,0.3],[0.55,0.4],[0.85,0.3],[0.8,0.62],[0.5,0.7],[0.3,0.62],[0.18,0.68]].forEach(([a,b])=>x.lineTo(a*T,b*T));}
    x.closePath();x.fillStyle="#ffffff";x.fill();x.lineWidth=T*0.06;x.strokeStyle=INK;x.stroke();});
  TX.pdrop=spriteTex((x,w)=>{x.clearRect(0,0,w,w);x.beginPath();x.moveTo(w/2,w*0.06);x.bezierCurveTo(w*0.82,w*0.5,w*0.78,w*0.92,w/2,w*0.92);x.bezierCurveTo(w*0.22,w*0.92,w*0.18,w*0.5,w/2,w*0.06);x.closePath();
    x.fillStyle="#ffffff";x.fill();x.lineWidth=w*0.08;x.strokeStyle=INK;x.stroke();x.fillStyle="rgba(255,255,255,0.75)";x.beginPath();x.ellipse(w*0.42,w*0.62,w*0.06,w*0.12,0.3,0,7);x.fill();},48);
  TX.feather=spriteTex((x,w)=>{x.clearRect(0,0,w,w);x.beginPath();x.moveTo(w*0.5,w*0.06);x.quadraticCurveTo(w*0.82,w*0.42,w*0.56,w*0.9);x.lineTo(w*0.44,w*0.9);x.quadraticCurveTo(w*0.18,w*0.42,w*0.5,w*0.06);x.closePath();
    x.fillStyle="#ffffff";x.fill();x.lineWidth=w*0.06;x.strokeStyle=INK;x.stroke();x.beginPath();x.moveTo(w*0.5,w*0.12);x.lineTo(w*0.5,w*0.96);x.stroke();},64);
  // pooled camera-facing particles: soft smoke and steam, glowing fire, sparks, droplets, bale chips
  const PT={smoke:{map:TX.puff,blend:THREE.NormalBlending,grow:true,grav:-0.5,drag:0.5},steam:{map:TX.puff,blend:THREE.NormalBlending,grow:true,grav:-1.2,drag:0.4},
    fire:{map:TX.flame,blend:THREE.NormalBlending,grav:-3,tall:1.35,glow:true,sheet:!/[?&]softfire/.test(location.search)},spark:{map:TX.dot,blend:THREE.NormalBlending,grav:14,glow:true},
    drop:{map:TX.drop,blend:THREE.NormalBlending,grav:16},paper:{map:TX.paper,blend:THREE.NormalBlending,grav:0,drag:0,paper:true},chip:{map:TX.chip,blend:THREE.NormalBlending,grav:12},
    // (t14 paper: a jet of paper cloud puffs that slows and swells; paper sparks; confetti and torn scraps; paper drops; feathers)
    pjet:{map:TX.paper,grav:-1.2,drag:1.3,grow:true,flat:true,pfade:true},pspark:{map:TX.star,grav:14,tiles:true,spinK:3},conf:{map:TX.conf,grav:2.6,drag:1.8,tiles:true,spinK:5,keep:true},
    pdrop:{map:TX.pdrop,grav:16},feather:{map:TX.feather,grav:1.4,drag:2.6,spinK:1.6,keep:true}};
  /* v4: particles are drawn as one instanced batch per look (puff, flame, dot, drop, chip) instead of one sprite and
     one draw call each. Each batch is a camera-facing quad with per-instance position, size, color, opacity and
     spin; puffs are depth-sorted so smoke still layers correctly. Same emit/update rules as before. */
  const parts=[],pFree=[],PCAP=1500;let liveN=0;
  const PVS=`attribute vec3 iPos;attribute vec2 iScl;attribute vec3 iCol;attribute float iAlp;attribute float iRot;attribute float iVar;
    varying vec2 vUv;varying vec3 vCol;varying float vAlp;
    #include <fog_pars_vertex>
    void main(){vUv=iVar<0.0?uv:uv*0.5+vec2(mod(iVar,2.0),floor(iVar/2.0))*0.5;vCol=iCol;vAlp=iAlp;vec4 mvPosition=modelViewMatrix*vec4(iPos,1.0);
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
    // (v6.1 t10: the five per-particle values are interleaved in one buffer: one upload a frame per batch instead of five)
    const IB=new THREE.InstancedInterleavedBuffer(new Float32Array(PCAP*11),11,1);IB.setUsage(THREE.DynamicDrawUsage);
    const at=(n,k,o)=>{const a=new THREE.InterleavedBufferAttribute(IB,k,o);g.setAttribute(n,a);return a;};
    at("iPos",3,0);at("iScl",2,3);at("iCol",3,5);at("iAlp",1,8);at("iRot",1,9);at("iVar",1,10);
    const b={g,sort,ib:IB,rng:{start:0,count:0},list:[],n:0,dim:!glow&&map!==TX.star};   // (t16: paper and smoke dim at night; flames, sparks and paper stars don't)g.instanceCount=0;
    const m=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:null}}]),vertexShader:PVS,fragmentShader:PFS,
      transparent:true,depthWrite:false,fog:!glow,toneMapped:!glow});m.uniforms.map.value=map;
    b.mesh=new THREE.Mesh(g,m);b.mesh.frustumCulled=false;b.mesh.renderOrder=order;scene.add(b.mesh);PB.set(map,b);return b;}
  // smoke/steam puffs are sorted back to front; flames and sparks glow over them
  pBatch(TX.drop,false,false,1);pBatch(TX.chip,false,false,1);pBatch(TX.puff,false,true,2);pBatch(TX.paper,false,true,2).mesh.material.toneMapped=false;   /* (t12: paper white, like the cut-out people, not tone-mapped grey) */pBatch(TX.flame,true,false,3);pBatch(TX.dot,true,false,4);
  for(const t of [TX.pdrop,TX.feather,TX.star,TX.conf])pBatch(t,false,false,t===TX.pdrop?1:4).mesh.material.toneMapped=false;   // (t14 paper particles: card white, like the people)
  for(const k in PT)PT[k].b=PB.get(PT[k].map);   // (v5.2: each particle type knows its batch: no Map lookup per particle)
  const PCOL=new Map(),pcol=c=>{let v=PCOL.get(c);if(!v){v=lin(c);PCOL.set(c,v);}return v;};
  // background ambience (plume, aerators, outfall) is capped so it can never crowd out fires, sparks and disaster effects
  function emitA(type,x,y,z,vx,vy,vz,life,size,color,op){if(liveN<600)emit(type,x,y,z,vx,vy,vz,life,size,color,op);}   // (named arguments: a rest array per call was a steady allocation)
  function emit(type,x,y,z,vx,vy,vz,life,size,color,op=1){if(ZON){const k=zoneOf(x,z);if(zoneMir(k))vx=-vx;x=siteX(k,x);}let p=pFree.pop();   // (v7.0: effects are aimed in logical coordinates, drawn in the site)
    if(!p){if(parts.length>=PCAP)return;p={v:[0,0,0]};parts.push(p);}
    const c=pcol(color);p.type=type;p.t=PT[type];p.alive=true;p.x=x;p.y=y;p.z=z;p.v[0]=vx;p.v[1]=vy;p.v[2]=vz;p.life=p.max=life;p.size=size;p.op=op;
    p.r=c.r;p.g=c.g;p.b=c.b;p.rot=Math.random()*6.28;p.spin=(Math.random()-0.5)*2;p.ph=Math.random()*6.28;p.fl=1;p.tile=p.t.tiles?(Math.random()*4)|0:-1;if(p.t.flat){p.rot=(Math.random()-0.5)*0.5;p.fl=Math.random()<0.5?-1:1;}if(type==="paper"){p.rot=(Math.random()-0.5)*0.5;p.r0=p.rot;p.fl=Math.random()<0.5?-1:1;}if(type==="fire"&&p.t.sheet){p.rot=(Math.random()-0.5)*0.3;p.spin=(Math.random()-0.5)*0.25;p.fl=Math.random()<0.5?-1:1;}liveN++;}
  // (v4.1 pass 3: no allocation per frame here: the per-batch lists keep their length and a count, the sort is an in-place
  // insertion sort over the live entries, and each attribute reuses one update-range object; the old version's list resets,
  // closures and range objects were a steady 0.3 MB/s on a phone)
  const PBL=[];PB.forEach(b=>PBL.push(b));const pbReg=PB.set.bind(PB);PB.set=(k,b)=>{PBL.push(b);return pbReg(k,b);};
  const BKC=new Int32Array(48),BKT=[];
  function stepParts(rdt){liveN=0;for(let k=0;k<PBL.length;k++)PBL[k].n=0;
    for(let q=0;q<parts.length;q++){const p=parts[q];if(!p.alive)continue;p.life-=rdt;if(p.life<=0){p.alive=false;pFree.push(p);continue;}liveN++;
      const t=p.t,f=p.life/p.max;
      // paper puffs: rise in little hops (bop), sway side to side, rock, swell a touch, and fade only at the end
      if(t.paper){const age=p.max-p.life,hop=Math.max(0,Math.sin(age*4.2+p.ph));p.y+=p.v[1]*(0.25+1.9*hop*hop)*rdt;p.x+=(p.v[0]+Math.sin(age*1.3+p.ph)*0.9)*rdt;p.z+=(p.v[2]+Math.cos(age*1.1+p.ph)*0.5)*rdt;
        p.rot=p.r0+Math.sin(age*2.4+p.ph)*0.22;p.s1=p.size*(0.55+0.45*Math.min(1,age*1.5)+0.25*(1-f));p.a=p.op*Math.min(1,f/0.35)*Math.min(1,age*4);const b=t.b;b.list[b.n++]=p;continue;}
      p.v[1]-=t.grav*rdt;if(t.drag){p.v[0]*=1-t.drag*rdt;p.v[2]*=1-t.drag*rdt;}
      p.x+=p.v[0]*rdt;p.y+=p.v[1]*rdt;p.z+=p.v[2]*rdt;if(p.y<0.05&&p.v[1]<0){p.y=0.05;p.v[1]=0;p.v[0]*=0.5;p.v[2]*=0.5;}
      p.s1=t.grow?p.size*(0.45+(1-f)*1.7):t.keep?p.size:p.size*(0.35+0.65*f);
      p.a=p.op*(t.pfade?Math.min(1,f/0.35)*Math.min(1,(1-f)*p.max*6):t.grow?Math.min(1,(1-f)*5)*f:Math.min(1,f*1.6));p.rot+=p.spin*rdt*(t.grow?0.3:(t.spinK||1));const b=t.b;b.list[b.n++]=p;}
    const vm=camera.matrixWorldInverse.elements,NL=1-0.62*(G3.nightK||0);
    for(let k=0;k<PBL.length;k++){const b=PBL[k],L=b.list,n=b.n,lt=b.dim?NL:1;
      if(b.sort&&n>1){for(let i=0;i<n;i++){const p=L[i];p.d=vm[2]*p.x+vm[6]*p.y+vm[10]*p.z;}
        // (v15: big batches — fires, storms — go through 48 depth buckets instead: linear time, and back-to-front is only
        // needed to the nearest bucket for soft smoke; small ones keep the exact insertion sort)
        if(n<=96){for(let i=1;i<n;i++){const p=L[i],d=p.d;let j=i-1;while(j>=0&&L[j].d>d){L[j+1]=L[j];j--;}L[j+1]=p;}}
        else{let lo=1e9,hi=-1e9;for(let i=0;i<n;i++){const d=L[i].d;if(d<lo)lo=d;if(d>hi)hi=d;}const K=48,sc=(K-1e-6)/Math.max(1e-6,hi-lo),C=BKC.fill(0),T=BKT;
          for(let i=0;i<n;i++)C[((L[i].d-lo)*sc)|0]++;for(let k2=1;k2<K;k2++)C[k2]+=C[k2-1];for(let i=n-1;i>=0;i--){const p=L[i];T[--C[((p.d-lo)*sc)|0]]=p;}for(let i=0;i<n;i++)L[i]=T[i];}}
      const D=b.ib.array;
      for(let i=0;i<n;i++){const p=L[i],o=i*11;D[o]=p.x;D[o+1]=p.y;D[o+2]=p.z;D[o+3]=p.s1*(p.fl||1);D[o+4]=p.s1*(p.t.tall||1);
        D[o+5]=p.r*lt;D[o+6]=p.g*lt;D[o+7]=p.b*lt;D[o+8]=p.a;D[o+9]=p.rot;D[o+10]=p.t.sheet?((((p.max-p.life)*7+p.ph*2)|0)%4):p.tile;}
      b.g.instanceCount=n;b.mesh.visible=n>0&&!(G3.EXP&&(G3.EXP.noParts||G3.EXP.hidePB===b));
      if(n){const r=b.rng;r.count=n*11;if(!b.ib.updateRanges.length)b.ib.updateRanges.push(r);b.ib.needsUpdate=true;}}}
  const R=()=>Math.random()-0.5,EZ=k=>k<=0?0:k>=1?1:k*k*(3-2*k);
  // big fires: dense flames, a white-hot core, embers, and a flickering orange light that washes over the scene
  const fireLight=new THREE.PointLight(0xff7a1f,0,45,0);scene.add(fireLight);let fireL=0,fireLpos=new THREE.Vector3();
  function fireGlow(x,y,z,k){fireL=Math.max(fireL,k);fireLpos.set(x,y,z);}
  // v2.8.9 fire "pop": a flickering orange pool of light on the floor under the fire, and a flash-over burst when it starts
  const fireFloor=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:spriteTex((x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.4,"rgba(255,255,255,0.6)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,w);}),color:0xff6a1a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,opacity:0}));
  // v4.2.4: the glow texture is made up front (it used to be added on the first fire, which compiled a new shader mid-play)
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
      const r=new THREE.Mesh(new RingG(G3.papWater?0.7:0.85,1,36),m);   /* (t13: wider paper rings) */r.rotation.x=-Math.PI/2;r.userData.ph=Math.random();r.userData.p=[x0+Math.random()*(x1-x0),z0+Math.random()*(z1-z0)];r.position.set(r.userData.p[0],y,r.userData.p[1]);g.add(r);rs.push(r);}
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
  /* v6.1 t13: incidents are marked with a paper flag on an ink stick (the icon on a white disc on the flag), which
     flutters by swapping between two cut shapes. ?softfx = the old map pins */
  const FLAGT={},PAPF=!/[?&]softfx/.test(location.search);
  function flagTex(kind,v){const k=kind+v;if(FLAGT[k])return FLAGT[k];const ic=iconTex(kind).image;
    return FLAGT[k]=spriteTex((x,w,h)=>{x.clearRect(0,0,w,h);const wav=(t)=>v?Math.sin(t*Math.PI*2)*h*0.05:Math.sin(t*Math.PI)*h*0.025;x.beginPath();
      x.moveTo(w*0.04,h*0.1);for(let t=0;t<=1.0001;t+=0.1)x.lineTo(w*(0.04+0.92*t),h*0.1+wav(t));x.lineTo(w*0.8,h*0.5+wav(1)*0.5);
      for(let t=1;t>=-0.0001;t-=0.1)x.lineTo(w*(0.04+0.92*t),h*0.9+wav(t));x.closePath();
      x.fillStyle="#d6382c";x.fill();x.lineJoin="round";x.lineWidth=w*0.035;x.strokeStyle="#2b1d12";x.stroke();
      x.save();x.clip();x.fillStyle="rgba(0,0,0,0.12)";x.fillRect(0,h*0.55,w,h);x.restore();
      const r=h*0.29,cx=w*0.36,cy=h*0.5+wav(0.36);x.fillStyle="#fbf6ea";x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.lineWidth=w*0.02;x.stroke();x.drawImage(ic,cx-r*0.86,cy-r*0.86,r*1.72,r*1.72);},128,80);}
  function pinAt(g,x,y,z,kind){const p=new THREE.Group();let head=null,flag=null,fm=null;
    if(PAPF){fm=papReg(new THREE.MeshBasicMaterial({map:flagTex(kind,0),transparent:true,alphaTest:0.5,depthTest:false,toneMapped:false,side:THREE.DoubleSide}),0.45);
      const fg=new THREE.PlaneGeometry(3.2,2);fg.translate(1.6,-1,0);flag=new THREE.Mesh(fg,fm);flag.renderOrder=10;flag.position.set(0,1.0,0);p.add(flag);
      flag.onBeforeRender=()=>{const mir=!!(p.parent&&p.parent.matrixWorld.determinant()<0);flag.quaternion.copy(camera.quaternion);if(mir){flag.quaternion.y=-flag.quaternion.y;flag.quaternion.z=-flag.quaternion.z;}if(p.parent)flag.quaternion.premultiply(_pq.copy(p.quaternion).invert());flag.scale.x=mir?-1:1;flag.updateMatrixWorld();};   /* (v7.0: in the mirrored hall block the flag is turned and flipped back, so it faces the camera and reads) */}
    else{head=new THREE.Mesh(pinGeo,pinMat);head.castShadow=true;p.add(head);
    const ic=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex(kind),depthTest:false,transparent:true,toneMapped:false}));ic.renderOrder=10;ic.position.set(0,2.15,0);ic.scale.setScalar(1.3);p.add(ic);}
    p.position.set(x,y,z);g.add(p);
    const rm=new THREE.MeshBasicMaterial({color:lin(tok("bad")),transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    const ring=new THREE.Mesh(new RingG(0.85,1,40),rm);ring.rotation.x=-Math.PI/2;ring.position.set(x,0.13,z);g.add(ring);
    const sm=PAPF?new THREE.MeshBasicMaterial({color:lin("#2b1d12")}):new THREE.MeshBasicMaterial({color:lin(tok("bad")),transparent:true,opacity:0.5});const stem=new THREE.Mesh(new CylG(PAPF?0.09:0.05,PAPF?0.09:0.05,1,6),sm);g.add(stem);
    const o={p,ring,stem,x,y,z,move(nx,nz){this.x=nx;this.z=nz;},update(now){const b=PAPF?0:Math.sin(now/320)*0.35;p.position.set(this.x,this.y+b,this.z);if(!PAPF)p.rotation.y=now/1500;else{const v=((now/260)|0)%2;fm.map=flagTex(kind,v);}
      const ph=(now/1600)%1;ring.position.set(this.x,0.13,this.z);ring.scale.setScalar(1+ph*5);rm.opacity=0.85*(1-ph);stem.position.set(this.x,(this.y+b+(PAPF?1:0))/2,this.z);stem.scale.y=this.y+b+(PAPF?1:0);}};return o;}
  const _pq=new THREE.Quaternion();
  const PINS={icedintake:[-30,6,-55.5,"!"],duststorm:[-21,12,-13,"!"],flood:[-62,7,4,"water"],refclash:[60.6,8,-11,"!"],steamjoint:[11.2,9.5,4.6,"!"],fogfan:[49.5,22,-4.2,"!"],shaft:[12,10,15.6,"!"],dryerfire:[12,13,zc,"fire"],fabric:[48,9,zc,"!"],felt:[34.5,11,zc,"!"],slime:[4,11,zc,"!"],ragger:[16,9,-13.5,"!"],overflow:[-21,10,-13,"water"],chestover:[34.5,21,-15,"water"],lwplug:[11.2,9,ZL,"!"],cscreen:[15.2,8,ZL,"!"],fscreen:[19.2,9,ZL,"!"],lcplug:[26.6,8,ZL,"water"],hdblow:[25.8,13,-10.6,"water"],boiler:[76,14,-10,"!"],permit:[LAYOUT.wx(22),10,-40,"water"],thkblow:[34.5,22,-15,"water"],birdhay:[-18.7,9,zc,"!"],wrap:[12,12,zc,"!"],flares:[16,10,-13.5,"fire"],dye:[24,11,zc,"!"],winderdown:[-18.7,9,zc,"!"],tiedrolls:[-22.9,5,zc-0.7,"!"],
    badocc:[-17,10,-11,"!"],balefire:[-25,11,-12,"fire"],fleet:[-29,10,-16,"!"],calloff:[-36,10,23,"!"],fight:[-38,7,-21,"!"],roof:[-32,10,24,"water"],highway:[-72,7,4,"!"],
    lightning:[34.5,16,-15,"bolt"],bearingfail:[40,8,0,"!"],motorfail:[40,8,0,"!"],planbrg:[40,8,0,"!"],planmot:[40,8,0,"!"],drivefail:[11,9,27.5,"bolt"],tornado:[0,26,0,"!"],beaver:[-30,10,-16.5,"!"]};
  // a small lift truck (counterbalance forklift) for the yard upsets: body, overhead guard, mast and forks, nobody aboard
  function liftTruck(group,x,z,ry){const f=new THREE.Group();f.position.set(x,0,z);f.rotation.y=ry;group.add(f);box(1.8,0.9,1.1,M.warn,0,0.75,0,f);box(0.7,0.7,1.0,M.ink,-0.75,0.85,0,f);
    [[-0.3,0.5],[-0.3,-0.5],[0.6,0.5],[0.6,-0.5]].forEach(([a,b])=>box(0.06,1.3,0.06,M.ink,a,1.85,b,f,false));box(1.0,0.06,1.06,M.ink,0.15,2.5,0,f,false);
    box(0.12,2.4,0.9,M.ink,1.0,1.2,0,f);[-0.28,0.28].forEach(b=>box(1.0,0.06,0.12,M.metal,1.5,0.12,b,f,false));[[0.55,0.58],[0.55,-0.58],[-0.55,0.58],[-0.55,-0.58]].forEach(([a,b])=>cylZ(0.28,0.22,M.ink,a,0.28,b,12,f));return f;}
  function fxPerson(group,m,x,z){const w=worker(m,M.warn);w.position.set(x,0,z);group.add(w);return w;}
  // v4.1: the brownout's pin sits on the substation the scenery placed (or the power house when there is none)
  const _bkv=new THREE.Vector3();
  const subPos=()=>{const u=G3.scenery&&G3.scenery.util&&G3.scenery.util.substation;return u?[u[0],u[1]]:[74,-10];};
  Object.defineProperty(PINS,"birdline",{get(){const [x,z]=subPos();return [x,x===74?14:9,z,"!"];}});Object.defineProperty(PINS,"brownout",{get(){const [x,z]=subPos();return [x,x===74?14:9,z,"!"];}});
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
      if(!SOFTFX){if(Math.random()<rdt*14)emit("pdrop",x+R()*w*0.6,h,z+R(),R()*3,1+Math.random()*2,R()*3,1.0,0.42,"#8a6440",1);if(Math.random()<rdt*2.5)emit("paper",x+R(),h+0.4,z,R()*0.3,1.1,R()*0.3,2.4,1.3,"#c09a72",1);return;}   // (t14: paper drops and brown paper puffs)
      if(Math.random()<rdt*14)emit("drop",x+R()*w*0.6,h,z+R(),R()*3,1+Math.random()*2,R()*3,1.0,0.32,"#7a5636",0.9);if(Math.random()<rdt*3)emit("steam",x+R(),h+0.4,z,0,1.2,0,1.6,1.2,"#a4805c",0.35);};}
  const FXDEF={
    // v6.10 (07i): a failed bearing smokes and screeches sparks at its machine; a burnt motor smokes; a faulted drive flickers in the MCC
    bearingfail:g=>(now,rdt,inc)=>{const s=inc&&G3.ASPOT&&G3.ASPOT[inc.asset];if(!s||rdt<=0)return;const x=s[2],z=s[3];
      if(Math.random()<rdt*7)emit("spark",x+R(),1.2,z+R(),R()*4,2+Math.random()*3,R()*4,0.4,0.22,"#ffb23e",1);if(Math.random()<rdt*3)emit("smoke",x,1.8,z,R()*0.5,1.4,R()*0.5,2.4,1.4,"#5b5f66",0.55);},
    motorfail:g=>(now,rdt,inc)=>{const s=inc&&G3.ASPOT&&G3.ASPOT[inc.asset];if(!s||rdt<=0)return;const x=s[2],z=s[3];
      if(Math.random()<rdt*5)emit("smoke",x+R(),1.6,z+R(),R()*0.6,1.6,R()*0.6,3.0,1.8,"#3e4148",0.7);if(Math.random()<rdt*1.5)emit("spark",x,1.3,z,R()*3,2,R()*3,0.3,0.2,"#7fd0ff",1);},
    drivefail:g=>(now,rdt,inc)=>{const M2=G3.MCC;if(!M2||rdt<=0)return;if(Math.random()<rdt*2)emit("smoke",(M2.x0+M2.x1)/2+R()*3,M2.h+0.6,(M2.z0+M2.z1)/2+R()*2,R()*0.4,1.2,R()*0.4,2.2,1.4,"#6b707a",0.45);},
    refclash:g=>{const z=zone(g,56,66,-16.4,-5.6);
      return (now,rdt,inc)=>{z(now);const zs=inc&&inc.both?[-14,-8]:[-14];zs.forEach(zz=>{if(Math.random()<rdt*10)emit("spark",60.6+0.95,2.0,zz+R()*1.2,R()*5+2,3+Math.random()*4,R()*5,0.5+Math.random()*0.3,0.3,"#ffb23e",1);
        if(Math.random()<rdt*4)emit("smoke",60.6,3.4,zz,R()*0.6,1.6,R()*0.6,2.6,1.6,"#7e848e",0.5);});};},
    shaft:g=>{const z=zone(g,4,20,12.9,16.6);const motor=box(2.2,1.8,1.8,M.steel,12,0.9,14.8,g);
      // (t14: the two broken halves are cut-out cards, and the sparks paper stars)
      let s1,s2;if(shaftTex){s1=cardSprite(shaftTex,3.8,0.95);s2=cardSprite(mirrorTex(shaftTex),3.8,0.95);s1.position.set(9.6,1.2,14.0);s2.position.set(14.4,0.9,14.6);g.add(s1,s2);}
      else{s1=cylZ(0.22,2.6,M.metal,10.6,1.0,14.0,12,g);s2=cylZ(0.22,2.6,M.metal,13.4,0.6,14.2,12,g);s1.rotation.y=0.5;s2.rotation.y=-0.7;s2.rotation.x=0.4;}
      return (now,rdt)=>{z(now);motor.rotation.y=Math.sin(now/40)*0.06;
        if(shaftTex){s1.material.rotation=0.32+Math.sin(now/45)*0.05;s2.material.rotation=-0.45+Math.sin(now/52+1)*0.06;s1.position.y=1.2+Math.abs(Math.sin(now/90))*0.08;
          for(let k=0;k<2;k++)if(Math.random()<rdt*70)emit("pspark",12,1.4,14.2,R()*9,4+Math.random()*6,R()*7+1.5,0.6+Math.random()*0.3,0.55,k?"#ffd23f":"#ff8a1f",1);}
        else for(let k=0;k<4;k++)emit("spark",12,1.4,14.2,R()*9,4+Math.random()*6,R()*7+1.5,0.55+Math.random()*0.3,0.36,"#ff8a1f",1);
        if(Math.random()<rdt*3)emit("smoke",12,2,14.5,R(),1.6,0.4,2.4,1.8,"#a0a6b2",0.5);};},
    dryerfire:g=>{const spots=[];for(let i=0;i<10;i++)spots.push([(872-i*32-600)/10,6.4,zc+(i%2?1.2:-1.2)]);const fire=fireAt(spots,22,2.9),smoke=smokeCol(-3,27,9,zc-2,zc+2,26,"#6f7684",0.62,5.2);const z=zone(g,-6,30,4.4,13.8);
      return (now,rdt,inc)=>{const k0=Math.max(0.2,Math.min(1,inc.left/inc.total*1.4));fire(rdt,k0);smoke(rdt);z(now);for(let k=0;k<3;k++)if(Math.random()<rdt*30)emit("drop",-4+Math.random()*32,12.6,zc+R()*6,0,-6,0,0.9,0.28,"#3d8fd6",0.85);};},
    // (t14: torn paper scraps flutter off the section while the cloth is off)
    fabric:g=>{const z=zone(g,39,56,5,13.2);return (now,rdt)=>{z(now);if(!SOFTFX&&rdt>0&&Math.random()<rdt*9)emit("conf",40+Math.random()*15,1.5+Math.random()*2.5,zc+CD/2+R(),R()*2,1+Math.random()*2,1+Math.random()*2,2.4,0.55,Math.random()<0.6?"#8fa3ad":"#d9dfe2",1);};},
    felt:g=>{const z=zone(g,29,40.5,5,13.2);return (now,rdt)=>{z(now);if(!SOFTFX&&rdt>0&&Math.random()<rdt*9)emit("conf",30+Math.random()*10,1.5+Math.random()*3,zc+CD/2+R(),R()*2,1+Math.random()*2,1+Math.random()*2,2.4,0.55,Math.random()<0.6?"#cdb98e":"#8a7a5c",1);};},
    slime:g=>{const blobs=[];for(let k=0;k<34;k++){const b=new THREE.Mesh(sphereG,FM.scab);const i=k%10,top=k%2;b.position.set((top?872:856)/10-60-i*3.2+R(),top?6.75:1.05,zc+R()*5.5);
        b.userData.s=0.18+Math.random()*0.3;b.scale.set(b.userData.s*1.4,b.userData.s*0.45,b.userData.s);g.add(b);blobs.push(b);}
      return now=>blobs.forEach((b,k)=>{const f=1+0.18*Math.sin(now/300+k);b.scale.set(b.userData.s*1.4*f,b.userData.s*0.45,b.userData.s*f);});},
    ragger:g=>{
      const rm=new THREE.MeshBasicMaterial({color:lin(tok("bad")),transparent:true,toneMapped:false,side:THREE.DoubleSide});const ring=new THREE.Mesh(new RingG(5,5.6,48),rm);ring.rotation.x=-Math.PI/2;ring.position.set(16,0.12,-13.5);g.add(ring);
      return now=>{rm.opacity=0.45+0.4*Math.sin(now/250);};},
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
        if(!SOFTFX){   // (t14: a jet of paper cloud puffs, and paper clouds billowing up over the hood)
          for(let q=0;q<2;q++)if(Math.random()<rdt*30*k)emit("pjet",JX+R()*0.15,JY+R()*0.15,JZ-0.3,R()*1.4,R()*1.4+0.6,-(9+Math.random()*5)*k,1.5,0.9+Math.random()*0.6,"#ffffff",1);
          if(Math.random()<rdt*7*k)emitA("paper",JX+R()*6,JY+Math.random()*3,JZ-2+R()*3,R()*0.6,1.2+Math.random(),-0.3+R()*0.6,4.5,3+Math.random()*2.5,Math.random()<0.5?"#eef1f4":"#dfe4ea",1);return;}
        for(let q=0;q<3;q++)if(Math.random()<rdt*55*k)emit("steam",JX+R()*0.15,JY+R()*0.15,JZ-0.3,R()*1.4,R()*1.4+0.6,-(7+Math.random()*4)*k,1.6,1.2+Math.random()*1.2,"#ffffff",0.85);
        // the billow: grey-white puffs that pile up over the drive side and roll up over the dryer hood
        for(let q=0;q<4;q++)if(Math.random()<rdt*24*k)emitA("smoke",JX+R()*6,JY+Math.random()*5,JZ-2+R()*3,R()*1.2,1.6+Math.random()*2.2,-0.3+R()*0.8,6,6+Math.random()*6,q&1?"#dfe4ea":"#c9d0d9",0.7);
        if(Math.random()<rdt*8*k)emitA("smoke",JX+R()*9,1+Math.random()*2,JZ-1.5+R()*3,R()*0.8,0.5,R()*0.8,5,6+Math.random()*4,"#d7dde4",0.5);};},
    boiler:g=>{const z=zone(g,68,84,-18,-2),P=G3.POP;
      return (now,rdt,inc)=>{z(now);const k=inc&&inc.total?inc.left/inc.total:1,lift=k>0.35?1:k/0.35,flick=0.75+0.25*Math.sin(now/37)*Math.sin(now/91);
        P.lever.rotation.z=0.35*lift;if(lift<0.05)return;
        if(!SOFTFX){for(let q=0;q<2;q++)if(Math.random()<rdt*26*lift)emit("pjet",P.x+0.75+R()*0.3,16.7,P.z+R()*0.3,R()*1.6,(7+Math.random()*4)*lift*flick,R()*1.6,2.2,1.6+Math.random()*1.2,"#ffffff",1);
          if(Math.random()<rdt*5*lift)emitA("pjet",P.x+0.5,10.5,P.z,R()*2,1+Math.random(),R()*2,0.9,0.5,"#ffffff",1);return;}   // (t14: a jet of paper puffs)
        for(let q=0;q<3;q++)if(Math.random()<rdt*60*lift)emit("steam",P.x+0.75+R()*0.3,16.7,P.z+R()*0.3,R()*1.6,(5.5+Math.random()*3.5)*lift*flick,R()*1.6,2.6,2.6+Math.random()*2.0,"#ffffff",0.9);
        if(Math.random()<rdt*8*lift)emitA("steam",P.x+0.5,10.5,P.z,R()*2,1+Math.random(),R()*2,0.8,0.5,"#ffffff",0.5);};},
    permit:g=>{const W=LAYOUT.wx,z=zone(g,Math.min(W(1),W(46)),Math.max(W(1),W(46)),-49,-31),p0=Math.min(W(22),W(42));return (now,rdt)=>{z(now);if(Math.random()<rdt*10)emit("smoke",p0+Math.random()*20,1.2,-46+Math.random()*12,R(),0.6,R(),2.2,1.6,"#e9e2cf",0.7);};},
    // (t14: the failed slitter drive throws paper sparks in bursts and a little paper smoke)
    winderdown:g=>{const z=zone(g,-24.5,-13,4.6,13.6);let nb=0;return (now,rdt)=>{z(now);if(SOFTFX||rdt<=0)return;
      if(now>nb){nb=now+900+Math.random()*1400;for(let k=0;k<12;k++)emit("pspark",-18.7+R()*2,2.6,zc+R()*2,R()*7,3+Math.random()*5,R()*7,0.7+Math.random()*0.4,0.5,k%2?"#ffd23f":"#ff8a1f",1);}
      if(Math.random()<rdt*2)emit("paper",-18.7+R()*2,3,zc+R(),R()*0.3,1,R()*0.3,2.6,1.4,"#9aa1ad",1);};},
    // v6.5.7 rolls tied together: the set lies on the upender and the transfer table with the two rolls stuck at the join
    // (a ragged band of paper wrapped across both). Once the crew is working, a portable band saw feeds down through the
    // join, throwing paper dust; when it's through the two rolls go off to the beater as a set (27-3d starts them here).
    tiedrolls:g=>{const z=zone(g,-25.4,-21.4,zc-2.5,zc+1.1),X=-22.9,Y=0.5+0.62,ZJ=zc-0.725;
      const tm=new StdMat({color:lin0("#cdbf9f"),roughness:0.85});
      [zc,zc-1.45].forEach(zz=>{const r=new THREE.Mesh(rollGeo,tm);r.rotation.x=Math.PI/2;r.position.set(X,Y,zz);r.castShadow=true;g.add(r);});
      const band=cylZ(0.66,0.42,M.paper,X,Y,ZJ,20,g);band.rotation.z=0.3;   // the web that wound across the slit
      for(let k=0;k<5;k++){const t=box(0.34,0.03,0.22,M.paper,X+Math.cos(k*1.3)*0.66,Y+Math.sin(k*1.3)*0.66,ZJ+(k%2?0.24:-0.24),g,false);t.rotation.z=k*1.3+0.4;}   // torn tails
      const kerf=box(1.3,1,0.05,M.ink,X,Y,ZJ,g,false);kerf.visible=false;
      // the band saw: a C-frame on a carriage, the blade running down the open side, two handles out to the operators
      const saw=new THREE.Group();g.add(saw);
      box(0.18,0.18,0.2,M.warn,-0.95,0,0,saw);box(0.18,0.18,0.2,M.warn,0.95,0,0,saw);box(2.08,0.2,0.2,M.warn,0,0.62,0,saw);
      box(0.18,0.62,0.2,M.warn,-0.95,0.31,0,saw,false);box(0.18,0.62,0.2,M.warn,0.95,0.31,0,saw,false);
      const blade=box(1.72,0.03,0.02,M.metal,0,0,0,saw,false);box(0.4,0.3,0.34,M.ink,-0.95,0.62,0,saw,false);
      [-0.45,0.45].forEach(dz=>{box(0.5,0.06,0.06,M.ink,-1.24,0.5,dz*0.7,saw,false);});
      return (now,rdt,inc)=>{z(now);G3.tiedSeen=performance.now();const go=!!(inc&&inc.go),p=go&&inc.total?clamp(1-inc.left/inc.total,0,1):0;
        const top=Y+0.7,bot=Y-0.66,yb=go?top+(bot-top)*p:top+0.25;saw.position.set(X-0.1,yb,ZJ);saw.rotation.z=go?0.03*Math.sin(now/45):0;
        blade.position.x=go?0.02*Math.sin(now/12):0;kerf.visible=go&&p>0.02;if(kerf.visible){const h=Math.max(0.02,top-yb);kerf.scale.y=h;kerf.position.y=top-h/2;}
        if(go&&rdt>0&&!SOFTFX)for(let q=0;q<2;q++)if(Math.random()<rdt*14)emit("chip",X+0.65*(Math.random()<0.5?-1:1),yb,ZJ+R()*0.2,R()*2.2,1+Math.random()*1.6,R()*1.4,1.1,0.22,"#efe7d4",1);
        if(go&&rdt>0&&Math.random()<rdt*6)emit("paper",X+R()*0.8,yb,ZJ,R()*0.6,0.6,R()*0.6,1.8,0.9,"#e9e2cf",0.9);};},
    // (t14) dye trouble: splats of dye on the floor along the tending side, and puffs of the colour coming off the sheet
    dye:g=>{if(SOFTFX)return ()=>{};const sp=[];for(let k=0;k<12;k++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),papReg(new THREE.MeshBasicMaterial({map:splatTex,alphaTest:0.5,toneMapped:false,color:lin(DYE[k%DYE.length])})));
        m.position.set(16+Math.random()*16,0.1+k*0.004,zc+CD/2+1.2+Math.random()*2.4);m.rotation.y=Math.random()*6;m.userData.s=1+Math.random()*1.4;m.userData.d=k*0.05;g.add(m);sp.push(m);}
      return (now,rdt,inc)=>{const p=inc&&inc.total?1-inc.left/inc.total:0.5;sp.forEach(m=>{const k=EZ((p-m.userData.d)/0.12)*(p>0.9?1-EZ((p-0.9)/0.1):1);m.visible=k>0.02;m.scale.setScalar(Math.max(0.01,m.userData.s*k));});
        if(rdt>0&&Math.random()<rdt*5)emit("paper",16+Math.random()*16,1.6,zc+CD/2,R()*0.4,1.2,0.4,2.4,1.3,DYE[((now/1400)|0)%DYE.length],1);};},
    runner:g=>()=>{if(FX.runner&&RUN.on)FX.runner.pinPos=[RUN.x,RUN.z];},
    chestover:g=>{const cr=chestR,cx=34.5,cz=-15;const pud=new THREE.Mesh(new RingG(cr*0.98,cr+6.5,48,6),FM.pulp);pud.rotation.x=-Math.PI/2;pud.position.set(cx,0.1,cz);g.add(pud);
      const top=new THREE.Mesh(new CircG(cr*0.95,40),FM.pulp);top.rotation.x=-Math.PI/2;top.position.set(cx,10.08,cz);g.add(top);
      const sheet=new THREE.Mesh(new CylG(cr*1.03,cr*1.06,9.9,40,1,true,Math.PI*0.15,Math.PI*0.9),FM.pulp);sheet.position.set(cx,5.05,cz);g.add(sheet);
      const rp=ripples(g,7,cx-cr-5,cx+cr+5,cz+cr*0.3,cz+cr+5,0.14);
      return (now,rdt,inc)=>{rp(now);pud.scale.setScalar(0.55+0.45*Math.min(1,(1-inc.left/inc.total)*5));for(let k=0;k<4;k++)if(Math.random()<rdt*25){const a=Math.PI*(0.15+Math.random()*0.9)+Math.PI/2;
        emit("drop",cx+Math.sin(a)*cr*1.05,10.1,cz+Math.cos(a)*cr*1.05,Math.sin(a)*1.4,0.6,Math.cos(a)*1.4,1.2,0.34,"#7a5636",0.95);}};},
    // (t14: the junk as cut-out cards: bottles, foam, bags and wire, lying through the bale yard)
    badocc:g=>{if(junkTex){for(let k=0;k<24;k++){const t=k%4,sz=[1.0,1.2,1.3,1.1][t]*(0.85+Math.random()*0.3),s=cardSprite(junkTex[t],sz,sz);s.position.set(-30+Math.random()*19,0.4+sz*0.4+Math.random()*1.6,-17+Math.random()*10);g.add(s);}return ()=>{};}
      const m4=new THREE.Matrix4(),add=(geo,mt,n,sx,sy,sz)=>{const im=new THREE.InstancedMesh(geo,instMat(mt),n);for(let k=0;k<n;k++){const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random()*3,Math.random()*3,Math.random()*3));
        m4.compose(new THREE.Vector3(-30+Math.random()*19,1.1+Math.random()*2.4,-17+Math.random()*10),q,new THREE.Vector3(sx,sy,sz));im.setMatrixAt(k,m4);}im.castShadow=true;g.add(im);};
      add(new CylG(0.13,0.13,0.5,10),mat("water",{roughness:0.2}),24,1,1,1);add(rboxGeo(0.5,0.25,0.4),FM.white,18,1,1,1);add(sphereG,FM.slime,16,0.22,0.12,0.2);
      return ()=>{};},
    balefire:g=>{const spots=[];for(let k=0;k<10;k++)spots.push([-29+k*2,1.6+(k%3)*0.9,-7.5-(k%4)*3]);const fire=fireAt(spots,20,3.0),smoke=smokeCol(-30,-12,5,-18,-6,24,"#6f7684",0.62,5.4);
      return (now,rdt,inc)=>{fire(rdt,Math.max(0.2,Math.min(1,inc.left/inc.total*1.4)));smoke(rdt);if(Math.random()<rdt*12)emit("spark",-21+R()*14,2,-12+R()*8,R()*3,6+Math.random()*4,R()*3,0.8,0.3,"#ff8a1f",1);};},
    fight:g=>{const a=fxPerson(g,M.warn,-38.6,-21),b=fxPerson(g,M.stock,-37.2,-21);a.rotation.y=0;b.rotation.y=Math.PI;
      const car=new THREE.Group();if(carTex){const cs=cardSprite(carTex,4.4,2.2,true);car.add(cs);}else{box(3.4,0.75,1.7,M.wall,0,0.62,0,car);box(1.9,0.62,1.5,M.wall,-0.25,1.3,0,car);box(1.8,0.42,1.52,M.wind,-0.25,1.36,0,car,false);box(3.42,0.22,1.72,M.ink,0,0.5,0,car,false);
      [-1.1,1.1].forEach(x=>[-0.78,0.78].forEach(z=>cylZ(0.34,0.24,M.ink,x,0.34,z,16,car)));box(0.9,0.14,1.0,M.ink,-0.25,1.68,0,car,false);}   // (t14: the car is a cut-out card)
      const red=new THREE.Sprite(new THREE.SpriteMaterial({map:(/[?&]softfx/.test(location.search)?TX.dot:TX.disc),color:lin("#ff3b30"),transparent:true,depthWrite:false,toneMapped:false})),blue=new THREE.Sprite(new THREE.SpriteMaterial({map:(/[?&]softfx/.test(location.search)?TX.dot:TX.disc),color:lin("#2f6bff"),transparent:true,depthWrite:false,toneMapped:false}));
      red.position.set(-0.25,1.85,-0.35);blue.position.set(-0.25,1.85,0.35);if(carTex){red.position.set(-0.25,1.9,0);blue.position.set(0.25,1.9,0);}car.add(red,blue);car.position.set(-43,0,-15.5);car.rotation.y=0.6;g.add(car);
      const bub=new THREE.Sprite(new THREE.SpriteMaterial({map:spriteTex((x,w,h)=>{x.fillStyle="#fff";x.strokeStyle="#1c2233";x.lineWidth=5;x.beginPath();x.roundRect(6,6,w-12,h-34,22);x.fill();x.stroke();
        x.beginPath();x.moveTo(w*0.42,h-29);x.lineTo(w*0.36,h-6);x.lineTo(w*0.56,h-29);x.fill();x.fillStyle="#d6382c";x.font="900 54px system-ui,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText("#@%!",w/2,(h-28)/2+4);},192,128),transparent:true,depthTest:false,toneMapped:false}));
      bub.position.set(-37.9,3.6,-21);bub.scale.set(3.3,2.2,1);bub.renderOrder=9;g.add(bub);
      return (now,rdt)=>{const j=Math.sin(now/70)*0.25;a.position.x=-38.6+j;b.position.x=-37.2-j;pose(a,"rethread",now);pose(b,"rethread",now+300);
        const on=((now/220)|0)%2,hi=carTex?0.85:2.4,lo=carTex?0.3:0.6;red.scale.setScalar(on?hi:lo);blue.scale.setScalar(on?lo:hi);bub.position.y=3.6+Math.sin(now/200)*0.15;};},
    // v5.2: the two yard upsets that had only a pin. Forklifts red-tagged: two lift trucks parked in a taped-off bay with
    // red tags swinging on the masts. Drivers call off: three lift trucks parked by the roll warehouse with nobody on them,
    // a supervisor on the phone trying to find drivers, and a "drivers needed" board.
    fleet:g=>{const zn=zone(g,-33,-25,-20,-12.5),tags=[];
      [[-31,-17.5,0.3],[-27.2,-15,-0.4]].forEach(([x,z,ry])=>{const f=liftTruck(g,x,z,ry);const t=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.5,0.04),M.bad);t.position.set(1.05,1.8,0.3);f.add(t);tags.push(t);});
      return now=>{zn(now);tags.forEach((t,i)=>t.rotation.z=Math.sin(now/260+i)*0.35);};},
    calloff:g=>{[-55,-51.5,-48].forEach((x,i)=>liftTruck(g,x,33.2,Math.PI/2+(i-1)*0.12));const sup=fxPerson(g,M.warn,-45.2,33.3);sup.rotation.y=Math.PI*0.9;
      const c=document.createElement("canvas");c.width=256;c.height=128;const x=c.getContext("2d");x.fillStyle="#ffe066";x.fillRect(0,0,256,128);x.strokeStyle="#1c2233";x.lineWidth=8;x.strokeRect(4,4,248,120);
      x.fillStyle="#1c2233";x.font='800 40px "Plus Jakarta Sans",system-ui,sans-serif';x.textAlign="center";x.textBaseline="middle";x.fillText("DRIVERS",128,44);x.fillText("NEEDED",128,88);
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const bd=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.2),new THREE.MeshBasicMaterial({map:t,toneMapped:false}));bd.position.set(-58.6,1.6,33.4);g.add(bd);
      [-1,1].forEach(s=>box(0.08,1.6,0.08,M.ink,-58.6+s*1.05,0.8,33.3,g,false));
      return now=>{pose(sup,"phone",now);};},
    roof:g=>{const drops=[];if(!SOFTFX){const pud=new THREE.Mesh(new CircG(5.5,40),FM.water);pud.rotation.x=-Math.PI/2;pud.position.set(-35,0.08,23);g.add(pud);const rp=ripples(g,6,-39,-31,20,26,0.1);
        // (t14: paper drops falling through the leak instead of streaks)
        return (now,rdt)=>{rp(now);if(rdt>0)for(let k=0;k<3;k++)if(Math.random()<rdt*14){const c=Math.random()<0.6;emit("pdrop",c?-35+R()*7:-48+Math.random()*24,7,c?23+R()*5:15.5+Math.random()*16,0,-3,0,1.0,0.45,"#8fb7dd",1);}};}
      for(let k=0;k<90;k++){const d=new THREE.Mesh(cubeG,FM.rain);d.scale.set(0.05,0.7,0.05);d.position.set(-48+Math.random()*24,Math.random()*7,15.5+Math.random()*16);g.add(d);drops.push(d);}
      const pud=new THREE.Mesh(new CircG(5.5,40),FM.water);pud.rotation.x=-Math.PI/2;pud.position.set(-35,0.08,23);g.add(pud);const rp=ripples(g,6,-39,-31,20,26,0.1);
      return (now,rdt)=>{rp(now);drops.forEach(d=>{d.position.y-=rdt*16;if(d.position.y<0)d.position.y+=7;});};},
    highway:g=>{const bm=new StdMat({map:TX.barrier,roughness:0.6});const amb=[];
      if(barrierTex){   // (t14: barriers, cones and the tipped tanker as cut-out cards; the amber lamps as before)
        [[-72,-3.8],[-72,12.5]].forEach(([x,z])=>{const b=cardSprite(barrierTex,3.8,1.9,true);b.position.set(x,0,z);g.add(b);
          [-2.3,2.3].forEach(dz=>{const c=cardSprite(coneTex,0.9,1.2,true);c.position.set(x+1.6,0,z+dz);g.add(c);});
          [-1.4,1.4].forEach(dz=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.disc,color:lin("#ffb000"),transparent:true,depthWrite:false,toneMapped:false}));s.position.set(x,2.1,z+dz);g.add(s);amb.push(s);});});
        const tk=cardSprite(tankerTex,10,5,true);tk.position.set(-84,0,4);g.add(tk);
        return now=>amb.forEach((s,k)=>s.scale.setScalar(((now/300+k)|0)%2?1.8:0.4));}
      [[-72,-3.8],[-72,12.5]].forEach(([x,z])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.75,3.6),bm);b.position.set(x,0.95,z);box(0.12,0.6,0.12,M.ink,x,0.3,z-1.5,g,false);box(0.12,0.6,0.12,M.ink,x,0.3,z+1.5,g,false);box(0.9,0.08,0.3,M.ink,x,0.04,z-1.5,g,false);box(0.9,0.08,0.3,M.ink,x,0.04,z+1.5,g,false);b.castShadow=true;g.add(b);
        [-2.3,2.3].forEach(dz=>{const c=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.95,16),FM.cone);c.position.set(x+1.6,0.48,z+dz);c.castShadow=true;g.add(c);box(0.7,0.08,0.7,FM.cone,x+1.6,0.04,z+dz,g,false);});
        [-1.4,1.4].forEach(dz=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:(/[?&]softfx/.test(location.search)?TX.dot:TX.disc),color:lin("#ffb000"),transparent:true,depthWrite:false,toneMapped:false}));s.position.set(x,1.5,z+dz);g.add(s);amb.push(s);});});
      const tanker=new THREE.Group();box(1.4,1.7,1.9,M.brand,3.4,1.15,0,tanker);const tank=cylZ(1.05,4.6,M.metal,0,1.55,0,24,tanker);tank.rotation.y=Math.PI/2;tanker.position.set(-84,0,4);tanker.rotation.y=0.9;tanker.rotation.z=0.22;g.add(tanker);
      return now=>amb.forEach((s,k)=>s.scale.setScalar(((now/300+k)|0)%2?1.8:0.4));},
    lightning:g=>{const pts=[[40,40,-13],[36,32,-16],[39,26,-14],[34,19,-15],[37,14,-15],[34.5,10.5,-15]].map(p=>new THREE.Vector3(...p));
      const softB=/[?&]softfx/.test(location.search);let bolt;
      if(softB){bolt=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,"catmullrom",0),40,0.28,6,false),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));g.add(bolt);}
      else{const a=pts[0],b=pts[pts.length-1];bolt=new THREE.Mesh(new THREE.PlaneGeometry(13,a.distanceTo(b)*1.08),new THREE.MeshBasicMaterial({map:TX.bolt,transparent:true,alphaTest:0.5,toneMapped:false,side:THREE.DoubleSide}));
        bolt.position.copy(a).add(b).multiplyScalar(0.5);bolt.renderOrder=6;g.add(bolt);bolt.onBeforeRender=()=>{bolt.quaternion.copy(camera.quaternion);bolt.updateMatrixWorld();};}
      const glows=pts.map(p=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#9fc3ff"),transparent:true,depthWrite:false,toneMapped:false}));s.position.copy(p);s.scale.setScalar(7);g.add(s);return s;});
      const beacons=[[-34.4,4.9,-23.5],[-8,4.9,-3],[-49,4.9,14.8],[-23.8,4.9,32.2],[64,5.4,2.4],[-2,5.4,2.4]].map(p=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:(/[?&]softfx/.test(location.search)?TX.dot:TX.disc),color:lin("#ff3b30"),transparent:true,depthWrite:false,toneMapped:false}));s.position.set(...p);g.add(s);return s;});
      const flash=$("flash3d");
      return (now,rdt,inc)=>{const age=(now-inc.real)/1000,on=age<1.4?((now/80)|0)%2===0:(now%2600)<110;bolt.visible=on;glows.forEach(s=>s.visible=on&&softB);
        flash.style.opacity=age<0.12?0.9:age<0.3?0.0:age<0.42?0.6:on&&age>1.4?0.35:0;beacons.forEach((s,k)=>s.scale.setScalar(1.2+2.2*Math.max(0,Math.sin(now/180+k))));
        if(age<0.4)shake=Math.max(shake,1.4);};},
    /* v6.1 t13: the tornado is a paper cut-out a child might have made: wobbly grey bands narrowing to a point, a fat uneven
       crayon outline and white scribbles, on one card that faces the camera, sways, and swaps between two drawings (boil).
       Roofs it passes over blow off and settle back (22). The flying debris and dust stay as they were. ?softtornado = before */
    tornado:/[?&]softtornado/.test(location.search)?(g=>{const fun=new THREE.Group();g.add(fun);const N=54,puffs=[];for(let k=0;k<N;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.puff,transparent:true,depthWrite:false,color:lin("#b9bfcb"),opacity:0.6}));fun.add(s);puffs.push(s);}
      const deb=[];for(let k=0;k<16;k++){const d=k%3===0?new THREE.Mesh(rollGeo,ROLLM[0]):new THREE.Mesh(cubeG,k%3===1?M.bale:mat("kraft"));d.scale.setScalar(k%3===0?0.8:0.75);d.castShadow=true;fun.add(d);deb.push(d);}   /* (t12: one material per roll, so the debris instances) */
      return (now,rdt,inc)=>{const age=(now-inc.real)/1000;fun.visible=age<12;const fx=-95+age/12*170,fz=-6+Math.sin(age*0.9)*10;fun.position.set(fx,0,fz);FX.tornado.pinPos=[fx,fz];
        puffs.forEach((s,k)=>{const h=(k/N)*30,a=now/160*(1.6-h/40)+k*2.4,r=1+h*0.5+Math.sin(now/400+k)*0.3;s.position.set(Math.cos(a)*r+Math.sin(now/300+h/6)*h*0.05,h,Math.sin(a)*r);s.scale.setScalar(3.4+h*0.22);});
        deb.forEach((d,k)=>{const a=now/170+k,rad=3+k*0.75;d.position.set(Math.cos(a)*rad,1.5+k*1.3,Math.sin(a)*rad);d.rotation.set(a,a*1.3,0);});
        if(fun.visible&&Math.random()<rdt*14)emit("smoke",fx+R()*6,0.3,fz+R()*6,R()*4,0.6,R()*4,1.6,3,"#c9ced8",0.6);if(age<1)shake=Math.max(shake,0.8);};})
     :g=>{const fun=new THREE.Group();g.add(fun);
      const draw=(seed)=>spriteTex((x,W,H)=>{let s=seed;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};x.clearRect(0,0,W,H);
        const N=7,cx=W/2,bands=[];for(let k=0;k<N;k++){const t=k/(N-1),y=H*0.06+t*H*0.84,hw=W*(0.44-0.36*Math.pow(t,0.8))*(0.92+rnd()*0.16),off=(rnd()-0.5)*W*0.06+Math.sin(t*3.2)*W*0.05;bands.push([y,hw,off]);}
        const shape=()=>{x.beginPath();x.moveTo(cx+bands[0][2]-bands[0][1],bands[0][0]);
          bands.forEach(([y,hw,o],k)=>{const wob=(rnd()-0.5)*W*0.03;x.lineTo(cx+o-hw+wob,y);});x.lineTo(cx+bands[N-1][2]+W*0.02,H*0.97);
          for(let k=N-1;k>=0;k--){const [y,hw,o]=bands[k],wob=(rnd()-0.5)*W*0.03;x.lineTo(cx+o+hw+wob,y);}
          x.quadraticCurveTo(cx,bands[0][0]-H*0.05,cx+bands[0][2]-bands[0][1],bands[0][0]);x.closePath();};
        x.lineJoin="round";x.lineCap="round";shape();x.fillStyle="#9aa3b1";x.fill();
        // the bands: alternating paper greys, each its own wobbly strip
        x.save();shape();x.clip();const cols=["#8a94a3","#b4bcc8","#7d8796","#a6afbc"];
        for(let k=0;k<N-1;k++){const [y0]=bands[k],[y1]=bands[k+1];x.beginPath();x.moveTo(0,y0+(rnd()-0.5)*8);x.quadraticCurveTo(cx,y0+H*0.03*(rnd()-0.3),W,y0+(rnd()-0.5)*8);x.lineTo(W,y1);x.quadraticCurveTo(cx,y1+H*0.03*(rnd()-0.3),0,y1);x.closePath();x.fillStyle=cols[k%4];x.fill();}
        // white crayon scribbles round the funnel
        x.strokeStyle="rgba(255,255,255,0.85)";for(let k=0;k<9;k++){const t=0.1+rnd()*0.8,y=H*(0.06+t*0.84),hw=W*(0.44-0.36*Math.pow(t,0.8));x.lineWidth=2+rnd()*3;x.beginPath();
          x.moveTo(cx-hw*0.8,y);x.bezierCurveTo(cx-hw*0.3,y+H*0.02,cx+hw*0.3,y-H*0.02,cx+hw*0.85,y+H*0.01*(rnd()-0.5));x.stroke();}
        x.restore();
        // the fat crayon outline, drawn twice a little off for that hand-cut look
        shape();x.strokeStyle="#22181a";x.lineWidth=W*0.022;x.stroke();x.lineWidth=W*0.01;x.strokeStyle="rgba(34,24,26,0.6)";x.save();x.translate(2,-2);shape();x.stroke();x.restore();
        // a few paper scraps caught in it
        for(let k=0;k<6;k++){const t=0.15+rnd()*0.7,y=H*(0.06+t*0.84),hw=W*(0.44-0.36*Math.pow(t,0.8)),px=cx+(rnd()<0.5?-1:1)*hw*(1.05+rnd()*0.2);
          x.save();x.translate(px,y);x.rotate(rnd()*6);x.fillStyle=["#c8a879","#e9e2d0","#8c6a43"][k%3];x.fillRect(-W*0.025,-W*0.018,W*0.05,W*0.036);x.strokeStyle="#22181a";x.lineWidth=2;x.strokeRect(-W*0.025,-W*0.018,W*0.05,W*0.036);x.restore();}},256,384);
      const TXS=[draw(11),draw(29)],cm=papReg(new THREE.MeshBasicMaterial({map:TXS[0],transparent:true,alphaTest:0.5,toneMapped:false,side:THREE.DoubleSide}));
      const card=new THREE.Mesh(new THREE.PlaneGeometry(22,33),cm);card.position.y=16.5;fun.add(card);
      const deb=[];for(let k=0;k<16;k++){const d=k%3===0?new THREE.Mesh(rollGeo,ROLLM[0]):new THREE.Mesh(cubeG,k%3===1?M.bale:mat("kraft"));d.scale.setScalar(k%3===0?0.8:0.75);fun.add(d);deb.push(d);}
      let swapT=0,cur=0;
      return (now,rdt,inc)=>{const age=(now-inc.real)/1000;fun.visible=age<12;const fx=-95+age/12*170,fz=-6+Math.sin(age*0.9)*10;fun.position.set(fx,0,fz);FX.tornado.pinPos=[fx,fz];
        if(fun.visible){card.quaternion.copy(camera.quaternion);card.rotateZ(Math.sin(now/260)*0.07);card.scale.set((1+0.06*Math.sin(now/170))*(cur?-1:1),1+0.04*Math.sin(now/230+1),1);
          if(now>swapT){swapT=now+140;cur^=1;cm.map=TXS[cur];}
          if(G3.roofGust)G3.roofGust(fx,fz,14);}
        deb.forEach((d,k)=>{const a=now/170+k,rad=3+k*0.75;d.position.set(Math.cos(a)*rad,1.5+k*1.3,Math.sin(a)*rad);d.rotation.set(a,a*1.3,0);});
        if(fun.visible&&Math.random()<rdt*14)emit("smoke",fx+R()*6,0.3,fz+R()*6,R()*4,0.6,R()*4,1.6,3,"#c9ced8",0.6);if(age<1)shake=Math.max(shake,0.8);};},
    // (t14: a cut-out beaver, two drawings it swaps between as it chews the log, bobbing; the chips as before)
    beaver:g=>{if(BEAV){const bv=animCard(BEAV,7,5.6,true);bv.position.set(-24,0,-12.5);g.add(bv);let dir=0;
        return (now,rdt)=>{if(!dir)dir=screenDir(bv.position,new THREE.Vector3(1,0,0));bv.frame(((now/180)|0)%2,dir);bv.position.y=Math.abs(Math.sin(now/400))*0.25;bv.material.rotation=Math.sin(now/260)*0.03;
          for(let k=0;k<2;k++)if(Math.random()<rdt*14)emit("chip",-21.1,2.6,-12.5,1+Math.random()*3,3+Math.random()*3,R()*4,1.1,0.4,"#ffffff",1);};}
      const bv=new THREE.Group(),E=(sx,sy,sz,m,x,y,z)=>{const o=new THREE.Mesh(sphereG,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.castShadow=true;bv.add(o);return o;};
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
    // v4.2.4 marquee site upsets (visuals only). Each plays in three acts over the incident (p = share of it gone):
    // a warning, the peak, and a recovery with a clear finish.
    // forest: the river intake ices over. Frost creeps over the intake house, an ice shelf grows out from the bank with
    // floes locking in, icicles hang off the outfall pipe and snow flurries come in; while maintenance works, chips fly
    // and a steam lance puffs; at the end the shelf breaks up and the floes drift off downstream and melt.
    icedintake:g=>{const IX=-30,IZ=-55.5,[rz,rhw]=riverAt(IX),BANK=rz+rhw,ice=new StdMat({color:lin0("#e8f3fb"),roughness:0.35});
      // (t14 paper ice: the shelf and the floes are flat cards of pale blue paper with ink cracks, lying on the water)
      const PAPI=!!shelfTex,flatG=PAPI?new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2):null,iceT=PAPI?[0,1,2,3].map(iceTex):null;
      const shelf=PAPI?new THREE.Mesh(flatG,papReg(new THREE.MeshBasicMaterial({map:shelfTex,alphaTest:0.5,toneMapped:false}))):new THREE.Mesh(cubeG,new StdMat({color:lin0("#dfeef7"),roughness:0.25,metalness:0.05}));shelf.scale.set(26,0.22,1);shelf.position.set(IX,0.1,BANK);shelf.castShadow=!PAPI;g.add(shelf);
      const iceM=PAPI?iceT.map(t=>papReg(new THREE.MeshBasicMaterial({map:t,alphaTest:0.5,toneMapped:false}))):null;
      const floes=[...Array(16)].map((_,fi)=>{const m=PAPI?new THREE.Mesh(flatG,iceM[fi%4]):new THREE.Mesh(cubeG,ice);const w=1.2+Math.random()*2.4,d=1+Math.random()*1.8;m.scale.set(w,0.26,d);m.castShadow=true;
        m.userData={x:IX-12+Math.random()*24,z:BANK-3-Math.random()*8,r:Math.random()*3,v:0.6+Math.random()*0.8,w:w*1.3,d:d*1.3};g.add(m);return m;});
      const frost=new THREE.Mesh(new THREE.BoxGeometry(4.12,3.12,4.12),new StdMat({color:lin0("#ffffff"),transparent:true,opacity:0,roughness:0.95,depthWrite:false}));frost.position.set(IX,1.5,IZ);g.add(frost);
      const icM=new StdMat({color:lin0("#eaf6ff"),roughness:0.15,transparent:true,opacity:0.92}),icicles=[...Array(9)].map((_,i)=>{const m=new THREE.Mesh(new THREE.ConeGeometry(0.09,1,6),icM);m.rotation.x=Math.PI;
        m.position.set(IX-1.2+i*0.3,1.15,IZ-2.2-(i%2)*0.15);m.userData.l=0.4+((i*37)%5)*0.15;g.add(m);return m;});
      // the steam lance: a hose to the shelf and puffs while the crew works
      return (now,rdt,inc)=>{const k=inc&&inc.total?inc.left/inc.total:1,p=1-k,t=now/1000;
        const grow=EZ(p/0.15),brk=p<0.85?0:EZ((p-0.85)/0.15);G3.iceK=p<0.12?EZ(p/0.12):p<0.88?1:1-EZ((p-0.88)/0.12);
        frost.material.opacity=0.42*grow*(1-brk);frost.visible=frost.material.opacity>0.01;
        shelf.visible=grow>0.02&&brk<0.98;shelf.scale.z=Math.max(0.01,9*grow*(1-brk));shelf.position.z=BANK-shelf.scale.z/2;shelf.position.y=PAPI?0.11:0.08;
        icicles.forEach((m,i)=>{const L=m.userData.l*EZ(grow*1.4-i*0.04)*(1-brk);m.visible=L>0.02;m.scale.set(1,Math.max(0.01,L),1);m.position.y=1.15-L/2;});
        floes.forEach((m,i)=>{const u=m.userData,lock=EZ(grow*1.2-i*0.02);if(lock<0.01){m.visible=false;return;}m.visible=true;
          const drift=brk*brk*(18+u.v*12),melt=1-EZ((brk-0.5)/0.5);m.position.set(u.x+drift,0.06+Math.sin(t*0.9+i)*0.03*(brk>0?1:0.3),u.z-(1-lock)*6);m.rotation.y=u.r+brk*u.v*1.5;
          m.scale.y=0.26*Math.max(0.05,melt);m.visible=melt>0.05;if(PAPI){const mk=Math.max(0.05,melt);m.scale.set(u.w*mk,1,u.d*mk);m.position.y=0.12+i*0.003;}});
        if(inc&&inc.mGo&&rdt>0){if(Math.random()<rdt*10)emit("chip",IX+R()*3,1.0,BANK-1+R()*2,R()*3,2+Math.random()*3,R()*3,0.9,0.4,"#ffffff",1);
          if(Math.random()<rdt*6)emitA("steam",IX+2+R(),0.6,BANK-1.5+R(),R()*0.8,1.6+Math.random(),R()*0.8,2.2,1.6,"#ffffff",0.6);}};},
    // city: a grid brownout. An arc flash at the substation with a white flash of the screen opens it; during it the arcs
    // crackle on a steady beat, the mill's lights and windows sag and its steam plume shrinks; a utility bucket truck
    // arrives, a lineman goes up to the transformer in sparks, and the power comes back with a bright "lights up".
    brownout:g=>{const [px,pz]=subPos(),py=px===74?9.5:3.4,arcs=[];
      for(let k=0;k<3;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#bfe3ff"),transparent:true,depthWrite:false,toneMapped:false}));s.position.set(px-6+k*6,py,pz-2);s.scale.setScalar(3.2);g.add(s);arcs.push(s);}
      const big=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:lin("#e8f4ff"),transparent:true,depthWrite:false,toneMapped:false}));big.position.set(px,py+1,pz-2);g.add(big);
      // the bucket truck (white, orange stripe) with a two-part boom, a bucket and a lineman
      const tr=new THREE.Group();g.add(tr);const W=new StdMat({color:lin0("#f2f2f2"),roughness:0.6}),O=new StdMat({color:lin0("#f27a30"),roughness:0.6}),D=new StdMat({color:lin0("#2f3a49"),roughness:0.8});
      const tb=(w,h,d,x,y,z,m,par=tr)=>{const b=new THREE.Mesh(cubeG,m);b.scale.set(w,h,d);b.position.set(x,y,z);b.castShadow=true;par.add(b);return b;};
      tb(2,1.9,2.3,2.6,1.35,0,W);tb(2.05,0.25,2.35,2.6,1.0,0,O);tb(1.8,0.8,2.1,2.7,1.9,0,D);tb(5.6,0.35,2.3,-1.2,0.8,0,W);tb(5.6,0.2,2.32,-1.2,1.0,0,O);
      [[2.6,-1.1],[2.6,1.1],[-0.6,-1.1],[-0.6,1.1],[-2.8,-1.1],[-2.8,1.1]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.35,14),D);w.rotation.x=Math.PI/2;w.position.set(x,0.5,z);tr.add(w);});
      const amb=[-1,1].map(s=>{const a=new THREE.Sprite(new THREE.SpriteMaterial({map:(/[?&]softfx/.test(location.search)?TX.dot:TX.disc),color:lin("#ffb020"),transparent:true,depthWrite:false,toneMapped:false}));a.position.set(3.2,2.45,s*0.8);a.scale.setScalar(0.8);tr.add(a);return a;});
      const b1=new THREE.Group();b1.position.set(-2.6,1.2,0);tr.add(b1);tb(4.6,0.3,0.3,2.3,0,0,W,b1);const b2=new THREE.Group();b2.position.set(4.6,0,0);b1.add(b2);tb(4.2,0.25,0.25,2.1,0,0,W,b2);
      const bk=new THREE.Group();bk.position.set(4.2,0,0);b2.add(bk);tb(0.9,0.9,0.9,0,0.2,0,O,bk);const lm=new THREE.Group();lm.position.set(0,0.7,0);bk.add(lm);tb(0.3,0.5,0.4,0,0.1,0,O,lm);tb(0.24,0.24,0.24,0,0.5,0,new StdMat({color:lin0("#e0b48c")}),lm);
      {const h=new THREE.Mesh(sphereG,new StdMat({color:lin0("#f2f2f2")}));h.scale.set(0.16,0.11,0.16);h.position.set(0,0.66,0);lm.add(h);}
      const TX0=px+30,TX1=px+9,TZ=pz+9;tr.visible=false;
      return (now,rdt,inc)=>{const k=inc&&inc.total?inc.left/inc.total:1,p=1-k,t=now/1000;
        // act 1: the arc flash (first ~3% of the brownout, about a second at normal speed)
        const fa=p<0.035?Math.sin(p/0.035*Math.PI):0;big.visible=fa>0.02;big.scale.setScalar(4+22*fa);G3.bFlash=p<0.012?0.85:p<0.02?0:p<0.026?0.5:0;if(fa>0.5)shake=Math.max(shake,0.8);
        // act 2: arcs on a beat, lights sag; act 3 (p > 0.9): power comes back with a bright pulse
        const beat=((t*1.25)|0),ph=(t*1.25)%1,fl=ph<0.12&&p>0.035&&p<0.9;arcs.forEach((s,i)=>{s.visible=fl&&i===beat%3;s.scale.setScalar(3+2*(1-ph/0.12));});
        if(p>0.035&&p<0.9&&rdt>0&&Math.random()<rdt*5)emitA("smoke",px+R()*2,py+1.5,pz-2+R()*2,R()*0.6,1.6+Math.random(),R()*0.6,3.5,2.5+Math.random()*2,"#3a3f48",0.55);
        if(fl&&rdt>0&&Math.random()<rdt*40)emit("spark",px-6+(beat%3)*6,py,pz-2,R()*3,1+Math.random()*2,R()*3,0.4,0.2,"#9fd0ff",1);
        const back=p<0.9?0:EZ((p-0.9)/0.06);G3.brownK=p<0.035?1-0.45*EZ(p/0.035):(0.55+0.2*Math.sin(t*4.3)*Math.sin(t*14))*(1-back)+back*(1+0.5*Math.sin(Math.min(1,(p-0.9)/0.1)*Math.PI));
        {const sag=Math.max(0,1-G3.brownK);G3.tint=G3.brownK>1?["#fff6d8",0.35*(G3.brownK-1)]:["#141a2c",0.7*sag];}
        // the bucket truck: drives in (p 0.45-0.55), boom up (0.55-0.62), works (to 0.9), boom down and away (0.92-1)
        const din=EZ((p-0.45)/0.1),dout=EZ((p-0.93)/0.07);tr.visible=p>0.45&&dout<1;tr.position.set(TX0+(TX1-TX0)*din+(TX0-TX1)*dout*1.3,0,TZ);tr.rotation.y=Math.PI;
        const up=EZ((p-0.55)/0.07)*(1-EZ((p-0.9)/0.03));b1.rotation.z=0.15+0.75*up;b2.rotation.z=-0.2-0.5*up;bk.rotation.z=-(b1.rotation.z+b2.rotation.z);lm.rotation.y=Math.sin(t*1.3)*0.4;
        amb.forEach((a,i)=>{a.visible=tr.visible&&((t*2.5+i*0.5)%1)<0.5;});
        if(tr.visible&&up>0.95&&p<0.9&&rdt>0&&Math.random()<rdt*14){tr.updateMatrixWorld();const wv=bk.getWorldPosition(_bkv);emit("spark",wv.x+R(),wv.y+1.2,wv.z+R(),R()*2,1+Math.random()*2,R()*2,0.35,0.18,"#ffe08a",1);}};},
    // desert: a haboob. A wall of dust hundreds of metres wide rolls in from the north over the flats and swallows the
    // mill; inside it the sky goes orange-brown (envUpdate reads G3.dustK), dust streams across the site and tumbleweeds
    // bounce through; at the end it thins out and a film of dust on the ground fades away.
    duststorm:g=>{const WALL=[];for(let i=0;i<60;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.puff,color:lin("#c49a5e"),transparent:true,opacity:0.8,depthWrite:false}));
        s.userData={x:-320+(i%30)*22+Math.random()*10,y:i<30?14+Math.random()*8:36+Math.random()*12,s:i<30?44+Math.random()*16:38+Math.random()*16,ph:Math.random()*6,dz:Math.random()*14};g.add(s);WALL.push(s);}
      const TW=new THREE.MeshBasicMaterial({color:lin0("#8a6a3e"),wireframe:true}),weeds=[...Array(7)].map((_,i)=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(0.55+Math.random()*0.3,1),TW);
        m.userData={z:-40+i*17+Math.random()*8,v:7+Math.random()*5,o:Math.random()*400,b:1.5+Math.random()};g.add(m);return m;});
      const film=new THREE.Mesh(new THREE.CircleGeometry(230,40),new THREE.MeshBasicMaterial({color:lin0("#c9a86b"),transparent:true,opacity:0,depthWrite:false}));film.rotation.x=-Math.PI/2;film.position.set(-10,0.05,10);film.renderOrder=1;g.add(film);
      return (now,rdt,inc)=>{const k=inc&&inc.total?inc.left/inc.total:1,p=1-k,t=now/1000;
        // the wall: from 420 m north to past the mill over the first 14% of the storm
        const a=EZ(p/0.14),wz=-460+560*a,wv=p<0.15;WALL.forEach((s,i)=>{const u=s.userData;s.visible=wv;if(!wv)return;const b=1+0.08*Math.sin(t*0.7+u.ph);s.position.set(u.x+Math.sin(t*0.3+u.ph)*4,u.y,wz+u.dz);s.scale.setScalar(u.s*b);s.material.opacity=0.8*(p>0.12?1-(p-0.12)/0.03:1);});
        G3.dustK=p<0.1?0:p<0.15?EZ((p-0.1)/0.05):p<0.85?1:1-EZ((p-0.85)/0.15);
        G3.tint=["#b98a4e",0.42*G3.dustK*(0.9+0.1*Math.sin(t*1.7))];
        for(let q=0;q<3;q++)if(rdt>0&&Math.random()<rdt*40*G3.dustK)emitA("smoke",-95+Math.random()*190,0.6+Math.random()*4,-55+Math.random()*120,10+Math.random()*6,0.2,R()*1.5,3.2,7+Math.random()*6,"#c9a86b",0.55);
        weeds.forEach((m,i)=>{const u=m.userData,on=G3.dustK>0.6;m.visible=on;if(!on)return;const x=-170+((t*u.v+u.o)%340);m.position.set(x,0.6+Math.abs(Math.sin(t*u.b*2+i))*1.4,u.z+Math.sin(t*0.5+i)*3);m.rotation.set(t*u.v*0.9,0,-t*u.v*0.9);});
        const fo=p<0.6?0:p<0.85?EZ((p-0.6)/0.25)*0.22:0.22*(1-EZ((p-0.88)/0.12));film.visible=fo>0.01;film.material.opacity=fo;};},
    // swamp: water over the yard and the roads (not inside the buildings). v4.2.4 (the bayou flood as a marquee upset,
    // visuals only): the canal swells and spills, a muddy front with a foam line spreads south across the yard, rain
    // sets in, sandbag walls go up at the doors, bales, pallets, drums and a tyre float and drift, forklifts and clamp
    // trucks throw spray, a gator cruises through the yard once, and at the end the water drains back to the canal
    // and leaves dark wet ground that dries out. The pulper overflow (same effect) keeps the plain version.
    flood:g=>{const sh=new THREE.Shape(),Z0=-52,Z1=66,X0=LAYOUT6?-150:FENCE7.x0-2,X1=LAYOUT6?96:FENCE7.x1+4;sh.moveTo(X0,Z0);sh.lineTo(X1,Z0);sh.lineTo(X1,Z1);sh.lineTo(X0,Z1);sh.closePath();
      const HOLES=[[-27.2,64,-2.9,19.85],[-34.4,-8,-23.5,-3],[-49,-23.8,14.8,32.2],[4,47,-25,-2],[49,65,-27,-14.5],[70,82,-16,-4],[49,61,24,30]];
      // (v7.0: the sheet is drawn in site coordinates, round the whole v7 site, with each building's hole where it now stands)
      const SH=LAYOUT6?HOLES:HOLES.map(([x0,x1,z0,z1])=>{const k=zoneOf((x0+x1)/2,(z0+z1)/2),a=siteX(k,x0),b=siteX(k,x1);return [Math.min(a,b),Math.max(a,b),z0,z1];});
      SH.forEach(([x0,x1,z0,z1])=>{const h=new THREE.Path();h.moveTo(x0,z0);h.lineTo(x1,z0);h.lineTo(x1,z1);h.lineTo(x0,z1);h.closePath();sh.holes.push(h);});
      const inHole=(x,z)=>HOLES.some(([x0,x1,z0,z1])=>x>x0-0.8&&x<x1+0.8&&z>z0-0.8&&z<z1+0.8);
      const geo=new THREE.ShapeGeometry(sh);geo.rotateX(Math.PI/2);geo.translate(0,0,-Z0);   // (north edge at z 0, so the sheet spreads south by scaling z)
      const wm=new StdMat({color:lin0("#7b6a47"),transparent:true,opacity:0,roughness:0.04,metalness:0.3,depthWrite:false,side:THREE.DoubleSide});
      if(G3.papWater){const t=G3.paperWater(false);t.repeat.set(1/12,1/12);wm.map=t;wm.color.copy(lin0("#9a8a62"));wm.roughness=0.9;wm.metalness=0;}   // (t14: paper water, cut strips, nearly opaque)
      const w=new THREE.Mesh(geo,wm);w.position.set(0,0.09,Z0);w.renderOrder=1;g.add(w);
      if(!LAYOUT6){w.frustumCulled=false;w.matrixWorldAutoUpdate=false;w.onBeforeRender=()=>{w.updateMatrix();w.matrixWorld.copy(w.matrix);};}   // (v7.0: not moved with the effect's zone)
      const wetM=new THREE.MeshBasicMaterial({color:lin0("#3e3a2c"),transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
      const wet=new THREE.Mesh(geo,wetM);wet.position.set(0,0.06,Z0);wet.renderOrder=1;g.add(wet);
      // the foam line at the front, and the swollen canal
      const foamM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}),foam=new THREE.Mesh(new THREE.PlaneGeometry(X1-X0,3.2),foamM);foam.rotation.x=-Math.PI/2;foam.renderOrder=2;g.add(foam);
      const [czc,chw]=riverAt(0),canalM=new StdMat({color:lin0("#6e6244"),transparent:true,opacity:0,roughness:0.1,metalness:0.2,depthWrite:false}),canal=new THREE.Mesh(new THREE.PlaneGeometry(700,chw*2+6),canalM);if(G3.papWater){const t=G3.paperWater(false);t.repeat.set(60,1);canalM.map=t;canalM.roughness=0.9;canalM.metalness=0;}
      canal.rotation.x=-Math.PI/2;canal.position.set(0,0.1,czc+1);canal.renderOrder=1;g.add(canal);
      // ripples that only show on the water
      const RG=new RingG(0.85,1,36),rings=[...Array(36)].map(()=>{const r=new THREE.Mesh(RG,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.userData.ph=Math.random();r.visible=false;g.add(r);return r;});
      // the current: long faint streaks of foam drifting east across the water
      const stM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}),streaks=[...Array(12)].map(()=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),stM);m.rotation.x=-Math.PI/2;m.userData={x:Math.random(),z:Z0+3+Math.random()*(Z1-Z0-6),l:6+Math.random()*10,v:0.6+Math.random()*0.6};m.scale.set(m.userData.l,0.6,1);m.renderOrder=2;g.add(m);return m;});
      // sandbag walls along the receiving and shipping door walls (two courses of bags)
      const bagM=new StdMat({color:lin0("#b9a27a"),roughness:0.95}),walls=[[-35.5,-13.2,17,Math.PI/2],[-50,23.5,15,Math.PI/2]].map(([x,z,L,ry])=>{const wg=new THREE.Group();wg.position.set(x,0,z);wg.rotation.y=ry;g.add(wg);
        for(let row=0;row<2;row++)for(let i=0;i<Math.round(L/0.62);i++){const b=new THREE.Mesh(cubeG,bagM);b.scale.set(0.58,0.26,0.4);b.position.set(-L/2+0.31+i*0.62+(row?0.3:0),0.13+row*0.25,0);b.rotation.y=(Math.random()-0.5)*0.15;b.castShadow=true;wg.add(b);}return wg;});
      // floating debris: bales, pallets, drums, a tyre
      const dm=k=>new StdMat({color:lin0(k),roughness:0.8}),debris=[];
      const addD=(o,y,ax)=>{o.userData={x:X0+20+Math.random()*(X1-X0-40),z:Z0+4+Math.random()*44,y,ax,ph:Math.random()*6,v:0.25+Math.random()*0.35,r:Math.random()*6};g.add(o);debris.push(o);};
      for(let k=0;k<9;k++){const o=new THREE.Mesh(cubeG,M.kraft);o.scale.set(1.3,0.85,1.0);addD(o,0.2,0);}
      for(let k=0;k<4;k++){const o=new THREE.Group();for(let s=0;s<4;s++){const p=new THREE.Mesh(cubeG,dm("#a07a4a"));p.scale.set(1.2,0.05,0.18);p.position.set(0,0.12,-0.4+s*0.27);o.add(p);}
        for(let s=0;s<3;s++){const p=new THREE.Mesh(cubeG,dm("#8a6a42"));p.scale.set(1.2,0.1,0.1);p.position.set(0,0.05,-0.42+s*0.42);o.add(p);}addD(o,0.06,0);}
      [["#2a5aa8"],["#a8322c"]].forEach(([c])=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.9,14),dm(c));o.rotation.z=Math.PI/2;addD(o,0.12,1);});
      {const o=new THREE.Mesh(new THREE.TorusGeometry(0.42,0.16,8,18),dm("#2f3a49"));o.rotation.x=Math.PI/2;addD(o,0.08,2);}
      // the gator: cruises through the flooded yard once, eyes and back just out of the water
      const gm=dm("#39432e"),gd=dm("#2a3222"),gtr=new THREE.Group();g.add(gtr);
      const gb=(w,h,d,x,y,z,m)=>{const b=new THREE.Mesh(cubeG,m||gm);b.scale.set(w,h,d);b.position.set(x,y,z);gtr.add(b);return b;};
      gb(1.5,0.26,0.6,0,0,0);gb(0.9,0.2,0.34,1.1,0.0,0);[-1,1].forEach(s=>gb(0.1,0.1,0.1,0.8,0.15,s*0.13,gd));for(let i=0;i<6;i++)gb(0.12,0.08,0.08,-0.6+i*0.22,0.16,0,gd);
      const gt1=new THREE.Group();gt1.position.set(-0.75,0,0);gtr.add(gt1);{const b=new THREE.Mesh(cubeG,gm);b.scale.set(1.3,0.18,0.3);b.position.x=-0.6;gt1.add(b);}gtr.scale.setScalar(1.35);gtr.visible=false;
      let lastL=new Map();
      return (now,rdt,inc)=>{const k=inc&&inc.total?inc.left/inc.total:1,big=!!(inc&&inc.id==="flood"),p=1-k;
        // s: how far south the water has spread; lv: water level; dry: the wet ground fading at the end
        let s,lv,cl,wt;if(!big){lv=k>0.85?(1-k)/0.15:k<0.25?k/0.25:1;s=1;cl=0;wt=0;}
        else{s=p<0.14?EZ(p/0.14):p<0.86?1:1-EZ((p-0.86)/0.1);lv=p<0.14?0.4+0.6*EZ(p/0.14):p<0.86?1:Math.max(0,1-(p-0.86)/0.1);cl=p<0.1?EZ(p/0.1):p<0.86?1:1-EZ((p-0.86)/0.12);wt=p<0.84?0:p<0.96?EZ((p-0.84)/0.06):1-EZ((p-0.96)/0.04);}
        const sz=Math.max(0.001,s),front=Z0+(Z1-Z0)*sz;
        w.visible=s>0.002&&lv>0.01;w.scale.z=sz;wm.opacity=(G3.papWater?0.95:big?0.88:0.72)*lv;w.position.y=0.03+0.07*lv;G3.floodK=big?Math.min(1,cl*1.2):0;
        wet.visible=wt>0.01;wetM.opacity=0.32*wt;
        foam.visible=big&&s>0.01&&s<0.99;foam.position.set((X0+X1)/2,w.position.y+0.04,front);foamM.opacity=0.95*(0.75+0.25*Math.sin(now/180))*(p<0.5?1:0.5);if(rdt>0&&Math.random()<rdt*40)emitA("drop",X0+Math.random()*(X1-X0),0.3,front,R()*1.5,1+Math.random()*1.5,1+Math.random(),0.6,0.35,"#e6efe9",0.8);
        canal.visible=big&&cl>0.01;canalM.opacity=(G3.papWater?0.9:0.55)*cl;canal.position.y=0.05+0.25*cl;
        for(const r of rings){const ph=(now/1500+r.userData.ph)%1;if(ph<0.03||!r.userData.p){r.userData.p=[X0+10+Math.random()*(X1-X0-20),Z0+2+Math.random()*(Z1-Z0-4)];}
          const [rx,rz]=r.userData.p,on=lv>0.2&&rz<front-1&&!inHole(rx,rz);r.visible=on;if(on){r.position.set(rx,w.position.y+0.02,rz);r.scale.setScalar(0.6+ph*5.5);r.material.opacity=0.75*(1-ph)*lv;}}
        stM.opacity=0.42*lv;for(const m of streaks){const u=m.userData,x=X0+((u.x*(X1-X0)+now/1000*u.v)%(X1-X0));const on=lv>0.2&&u.z<front-2&&!inHole(x,u.z)&&!inHole(x+u.l/2,u.z)&&!inHole(x-u.l/2,u.z);m.visible=on;if(on)m.position.set(x,w.position.y+0.02,u.z);}
        // sandbags go up during the warning and come down after the water has gone
        const sb=big?(p<0.04?0:p<0.12?EZ((p-0.04)/0.08):p<0.97?1:1-EZ((p-0.97)/0.03)):0;walls.forEach((wg,i)=>{wg.visible=sb>0.01;wg.scale.y=Math.max(0.01,EZ(sb*1.6-i*0.12));});
        for(const d of debris){const u=d.userData,t=now/1000;const x=X0+10+((u.x-X0-10+t*u.v)%(X1-X0-20)+(X1-X0-20))%(X1-X0-20),z=u.z+Math.sin(t*0.2+u.ph)*1.5;
          const on=lv>0.3&&z<front-1.5&&!inHole(x,z);d.visible=on;if(!on)continue;d.position.set(x,w.position.y+u.y+Math.sin(t*1.4+u.ph)*0.04,z);
          if(u.ax===1){d.rotation.y=u.r+t*0.1;}else if(u.ax===2){d.rotation.z=Math.sin(t+u.ph)*0.1;}else{d.rotation.set(Math.sin(t*1.1+u.ph)*0.05,u.r+t*0.05,Math.sin(t*0.9+u.ph)*0.05);}}
        // the gator's cruise (p 0.42-0.62): north-west to south-east across the yard
        const gp=big?(p-0.42)/0.2:-1;gtr.visible=gp>0&&gp<1&&lv>0.5;if(gtr.visible){const ax=-105,az=-47,bx=-35,bz=-46,x=ax+(bx-ax)*gp,z=az+(bz-az)*gp+Math.sin(gp*9)*1.2;
          gtr.position.set(x,w.position.y-0.1,z);gtr.rotation.y=Math.atan2(-(bz-az),bx-ax);gt1.rotation.y=Math.sin(now/300)*0.35;}
        // forklifts and clamp trucks in the water throw spray
        if(big&&lv>0.5&&rdt>0){for(const L of [G3.liftObjs,G3.loaderObjs])if(L)for(const o of L){if(!o||!o.visible)continue;const x=o.position.x,z=o.position.z,q=lastL.get(o);lastL.set(o,[x,z]);
            if(!q||z>front||inHole(x,z))continue;const mv=Math.hypot(x-q[0],z-q[1]);if(mv>0.004&&Math.random()<rdt*24)emitA("drop",x+R()*1.2,0.35,z+R()*1.2,R()*2,1.2+Math.random()*1.4,R()*2,0.55,0.3,"#dfe9e6",0.85);}}};},
  };
  const blackEl=$("blackout3d");let lastIncTxt=0;
  function makeFX(id){const def=FXDEF[id]||FXDEF[MOT_FXDEF[id]];const g=new THREE.Group();scene.add(g);const pp=PINS[id]||PINS[MOT_PIN[id]]||[0,10,0,"!"];/* (v6.5 b3: a stopped DCS motor uses its upset's spot, 07c) */if(G3.zSetAt)G3.zSetAt(g,pp[0],pp[2]);   /* (v7.0: the effect is drawn in its upset's zone) */const f=FX[id]={g,up:null,pin:pinAt(g,pp[0],pp[1],pp[2],pp[3]),lb:lblNew(true,id)};
    f.up=def?def(g):()=>{};try{if(!/[?&]nofxinst/.test(location.search))f.inst=fxInst(g);}catch(e){console.error("effect instancing failed",id,e);}return f;}
  /* v6.1 t12: an effect's many look-alike parts (rain streaks, ripples, splash blobs, tornado puffs and debris) draw as one
     instanced mesh per shape and look instead of one draw each (the roof leak was ~100 draws, the tornado ~75). The effect
     code keeps animating its own objects; they sit on a hidden layer and each frame the instanced copy takes their world
     matrices, colours, opacities and visibility. A sprite becomes a camera-facing card (the camera never turns). */
  const FXI_LAYER=27,_fxu=new THREE.Vector3(),_fxr=new THREE.Vector3(),_fm=new THREE.Matrix4(),_fq=new THREE.Quaternion(),_fp=new THREE.Vector3(),_fs=new THREE.Vector3(),_fc=new THREE.Color();
  const geoSig=g=>g.type+":"+(g.parameters?JSON.stringify(g.parameters):g.uuid);
  const SPRG=new THREE.PlaneGeometry(1,1);
  function fxMat(m,sprite){const c=sprite?new THREE.MeshBasicMaterial({map:m.map,alphaTest:m.alphaTest,transparent:m.transparent,depthWrite:m.depthWrite,depthTest:m.depthTest,blending:m.blending,toneMapped:m.toneMapped,fog:m.fog}):m.clone();
    c.color&&c.color.setRGB(1,1,1);c.opacity=1;if(m.transparent)c.transparent=true;
    c.onBeforeCompile=sh=>{sh.vertexShader="attribute float iAlpha;varying float vIA;\n"+sh.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvIA=iAlpha;");
      sh.fragmentShader="varying float vIA;\n"+sh.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );","vec4 diffuseColor = vec4( diffuse, opacity*vIA );");};
    c.customProgramCacheKey=()=>"fxinst";return c;}
  function fxInst(g){const groups=new Map();
    g.traverse(o=>{if(o===g||!(o.isMesh||o.isSprite)||o.isInstancedMesh||o.isBatchedMesh||o.isSkinnedMesh)return;const m=o.material;if(!m||Array.isArray(m))return;
      if(o.isMesh&&!["MeshBasicMaterial","MeshLambertMaterial","MeshStandardMaterial"].includes(m.type))return;if(o.isMesh&&o.geometry.morphAttributes&&Object.keys(o.geometry.morphAttributes).length)return;
      if(o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender||o.layers.mask!==1)return;
      const k=[o.isSprite?"S":geoSig(o.geometry),m.type,m.map?m.map.uuid:"",m.blending,m.side,m.transparent?1:0,m.depthWrite?1:0,m.toneMapped?1:0,m.vertexColors?1:0,o.renderOrder].join("|");
      let L=groups.get(k);if(!L)groups.set(k,L=[]);L.push(o);});
    const out=[];
    for(const L of groups.values()){if(L.length<4)continue;const o0=L[0],sprite=!!o0.isSprite,geo=sprite?SPRG:o0.geometry;
      const im=new THREE.InstancedMesh(geo,fxMat(o0.material,sprite),L.length);const al=new THREE.InstancedBufferAttribute(new Float32Array(L.length).fill(1),1);al.setUsage(THREE.DynamicDrawUsage);
      im.geometry=geo.clone();im.geometry.setAttribute("iAlpha",al);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.setColorAt(0,_fc.set(1,1,1));im.frustumCulled=false;im.renderOrder=o0.renderOrder;im.name="effect parts";im.userData.smBatch=true;im.matrixAutoUpdate=false;im.matrixWorldAutoUpdate=false;im.matrixWorld.identity();   /* (v7.0: its instances are world matrices already, so it must not take the effect group's zone on top) */
      g.add(im);L.forEach(o=>o.layers.set(FXI_LAYER));out.push({im,L,al,sprite});}
    return out.length?out:null;}
  // each frame, for a showing effect: the instanced copies follow their originals
  G3.fxSync=()=>{const q=camera.quaternion;for(const id in FX){const f=FX[id];if(!f.inst||!f.g.visible)continue;f.g.updateMatrixWorld();
      for(const e of f.inst){const {im,L,al}=e;for(let i=0;i<L.length;i++){const o=L[i];let v=true;for(let x=o;x&&x!==f.g;x=x.parent)if(!x.visible){v=false;break;}
          if(!v){_fm.makeScale(0,0,0);al.array[i]=0;}
          else if(e.sprite){o.matrixWorld.decompose(_fp,_fq,_fs);const c=o.center;if(c.x!==0.5||c.y!==0.5){_fxu.set(0,1,0).applyQuaternion(q);_fxr.set(1,0,0).applyQuaternion(q);_fp.addScaledVector(_fxu,(0.5-c.y)*_fs.y).addScaledVector(_fxr,(0.5-c.x)*_fs.x);}   /* (t14: base-anchored cards) */
            _fm.compose(_fp,q,_fs);al.array[i]=o.material.opacity;}
          else{_fm.copy(o.matrixWorld);al.array[i]=o.material.opacity;}
          im.setMatrixAt(i,_fm);const c=o.material.color;if(c)im.setColorAt(i,c);}
        im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;al.needsUpdate=true;}}};
  /* v4: every upset effect is built, and every shader compiled, while the start menu is up: a few effects per frame
     (about 8 ms of work each frame), then one compileAsync pass, which compiles in parallel where the browser supports
     it. Nothing compiles mid-play. (r186's compile() walks the whole scene however much is hidden, so v3's
     one-effect-at-a-time warm-up during play cost a whole-scene pass every 1.5-4 s.) */
  let warm=null;
  G3.prewarm=()=>warm||(warm=new Promise(res=>{const ids=EVENTS.map(e=>e.id).filter(k=>!FX[k]);
    const done=()=>{G3.warm=true;diag("shaders precompiled: "+renderer.info.programs.length+" programs");res();};
    const stepW=()=>{if(!SM.done){requestAnimationFrame(stepW);return;}const t=performance.now();
      while(ids.length&&performance.now()-t<8){const id=ids.shift();try{makeFX(id).g.visible=false;}catch(e){diag(`prewarm: upset effect "${id}" failed: ${String(e&&e.message||e).slice(0,100)}`);}}
      if(ids.length){requestAnimationFrame(stepW);return;}
      if(G3.civBuildStep&&!G3.civBuildStep(t)){requestAnimationFrame(stepW);return;}   // (v5.2: the civics scenes, a few per frame)
      // one off-screen render with every effect showing and a shadow refresh: this also compiles the shadow-pass
      // (depth) shaders, which compile() doesn't cover. The moving-thing batches are built first so theirs are included.
      try{if(G3.civBuild)G3.civBuild();if(G3.dbForce)G3.dbForce();const shown=[];   // (v5.2: the civics scenes are built here too, 31b)
        // stand-in batches for the shadow-pass variants that moving things may need later (single/double-sided,
        // with/without a texture), so a new batch made mid-play never compiles a shader
        const tex=TX.puff,stand=[];for(const side of [THREE.FrontSide,THREE.DoubleSide])for(const map of [null,tex]){
          const g=new THREE.BoxGeometry(0.01,0.01,0.01),bm=new THREE.BatchedMesh(1,g.attributes.position.count,g.index.count,new THREE.MeshLambertMaterial({side,map}));
          {const ii=bm.addInstance(bm.addGeometry(G3.DBCOL?g:G3.vcGeo(g,new THREE.Color(1,1,1))));if(G3.DBCOL&&!G3.DBMAT&&!G3.MROW)bm.setColorAt(ii,new THREE.Color(1,1,1));}/* per-object colors, as moving batches use */bm.perObjectFrustumCulled=false;bm.castShadow=true;bm.frustumCulled=false;bm.position.set(0,-50,0);bm.updateMatrixWorld();scene.add(bm);stand.push([bm,g]);}
        // v4.1 pass 3: the shadow pass shares one depth material and re-derives its shader only when it steps from a plain
        // mesh to an instanced or batched one (or back); it then takes the side and texture of whatever it draws next. So
        // every combination is drawn here in exactly that order (the scene is traversed in insertion order), and a batch or
        // a textured caster that turns up mid-play (the train's bales, a repair job's sign, the felt) finds its depth shader
        // compiled. Plain meshes get a no-op dispose so the clean-up below treats them like the batches.
        {const tiny=new THREE.BoxGeometry(0.01,0.01,0.01),dbl=new THREE.MeshLambertMaterial({side:THREE.DoubleSide}),dblT=new THREE.MeshLambertMaterial({side:THREE.DoubleSide,map:tex});
          const put=o=>{o.castShadow=true;o.frustumCulled=false;o.position.set(0,-50,0);o.updateMatrixWorld();if(!o.dispose)o.dispose=()=>{};scene.add(o);stand.push([o,null]);return o;};
          const plain=m=>put(new THREE.Mesh(tiny,m)),inst=(m,col)=>{const im=new THREE.InstancedMesh(tiny,m,1);im.setMatrixAt(0,new THREE.Matrix4());if(col)im.setColorAt(0,new THREE.Color(1,1,1));return put(im);};
          const batch=m=>{const bm=new THREE.BatchedMesh(1,tiny.attributes.position.count,tiny.index.count,m);{const ii=bm.addInstance(bm.addGeometry(tiny));if(G3.DBCOL&&!G3.DBMAT&&!G3.MROW)bm.setColorAt(ii,new THREE.Color(1,1,1));}bm.perObjectFrustumCulled=false;return put(bm);};
          for(const m of [M.ink,dbl,M.bale,dblT]){batch(M.ink);plain(m);}                                   // plain casters: one/two-sided, plain/textured, each right after a batch
          for(const m of [M.ink,dbl,M.bale,dblT]){plain(M.ink);batch(m);}                                   // batched casters, the same four, each right after a plain mesh
          for(const m of [instMat(M.ink),instMat(M.bale)])for(const col of [false,true]){plain(M.ink);inst(m,col);}   // instanced casters, with and without per-instance colour (own copies, see instMat)
          stand.push([{material:null,dispose(){}},tiny]);}
        // v4.0.1: one stand-in per look a moving batch could ever use (effects included), drawn white with a per-object color
        // exactly as dbNew builds them, so a batch made mid-play reuses a compiled shader
        {const seen=new Set();scene.traverse(o=>{if(o.isBatchedMesh||!dbOK(o))return;const k=dbKey(o);if(seen.has(k))return;seen.add(k);
          const g=o.geometry,c=o.material.clone();c.color.setRGB(1,1,1);if(!G3.DBCOL)c.vertexColors=true;if(G3.MROW)G3.mrowMat(c);
          const bm=new THREE.BatchedMesh(1,g.attributes.position.count,Math.max(g.index?g.index.count:0,1),c);{const ii=bm.addInstance(bm.addGeometry(G3.DBCOL?g:G3.vcGeo(g,new THREE.Color(1,1,1))));if(G3.DBCOL&&!G3.DBMAT&&!G3.MROW)bm.setColorAt(ii,o.material.color);}
          bm.perObjectFrustumCulled=false;bm.sortObjects=false;bm.frustumCulled=false;bm.castShadow=o.castShadow;bm.receiveShadow=o.receiveShadow;scene.add(bm);stand.push([bm,null]);});}
        // ...one per material in the scene that a moving batch could use (objects made or freed later reuse these)...
        {const mats=new Map();scene.traverse(o=>{if(!o.isMesh||o.isBatchedMesh||o.isInstancedMesh||Array.isArray(o.material))return;const m=o.material;
            if(!m||!DBOK.has(m.type)||m.transparent||m.opacity<1)return;const k=mats.get(m)||0;mats.set(m,k|(o.receiveShadow?2:1));});
          const g=new THREE.BoxGeometry(0.01,0.01,0.01);
          mats.forEach((fl,m)=>{for(const recv of [false,true]){if(!(fl&(recv?2:1)))continue;const c=m.clone();c.color.setRGB(1,1,1);if(!G3.DBCOL)c.vertexColors=true;if(G3.MROW)G3.mrowMat(c);
            const bm=new THREE.BatchedMesh(1,g.attributes.position.count,g.index.count,c);{const ii=bm.addInstance(bm.addGeometry(G3.DBCOL?g:G3.vcGeo(g,new THREE.Color(1,1,1))));if(G3.DBCOL&&!G3.DBMAT&&!G3.MROW)bm.setColorAt(ii,m.color);}
            bm.perObjectFrustumCulled=false;bm.frustumCulled=false;bm.castShadow=true;bm.receiveShadow=recv;scene.add(bm);stand.push([bm,null]);}});
          stand.push([{material:null,dispose(){}},g]);}
        // ...and a per-object-color twin of every static scenery batch's material: a look first drawn in the scenery can
        // later turn up on moving things, and their batch then needs the color variant of the same shader
        for(const sb of SM.bms){const g=new THREE.BoxGeometry(0.01,0.01,0.01),c=sb.material.clone();c.color.setRGB(1,1,1);if(!G3.DBCOL)c.vertexColors=true;if(G3.MROW)G3.mrowMat(c);
          const bm=new THREE.BatchedMesh(1,g.attributes.position.count,g.index.count,c);{const ii=bm.addInstance(bm.addGeometry(G3.DBCOL?g:G3.vcGeo(g,new THREE.Color(1,1,1))));if(G3.DBCOL&&!G3.DBMAT&&!G3.MROW)bm.setColorAt(ii,new THREE.Color(1,1,1));}
          bm.perObjectFrustumCulled=false;bm.frustumCulled=false;bm.castShadow=sb.castShadow;bm.receiveShadow=sb.receiveShadow;scene.add(bm);stand.push([bm,g]);}
        for(const id in FX){if(!FX[id].g.visible){FX[id].g.visible=true;shown.push(FX[id].g);}}if(G3.civShowAll)G3.civShowAll(shown);if(G3.warmShow)G3.warmShow(shown);if(G3.tellWarm)G3.tellWarm(shown);   /* (v5.6: the fiddly knobs view, 40b) */if(!fireFloor.visible){fireFloor.visible=true;shown.push(fireFloor);}
        // v4.1 pass 3: the sky, terrain, clouds and mist never appear with an effect-only shader, and they already compiled for the
        // screen on the first frame; keeping them out of this off-screen pass saves their render-target shader variants
        const wld=[G3.terrain,G3.SKY&&G3.SKY.dome,G3.SKY&&G3.SKY.clouds&&G3.SKY.clouds.mesh,G3.SKY&&G3.SKY.mist&&G3.SKY.mist.mesh,G3.nightWin].filter(Boolean),wv=wld.map(o=>o.visible);wld.forEach(o=>o.visible=false);
        // v4.1 pass 3: drawn to the screen behind a 1 px scissor rather than into a render target: a target has its own output
        // colour space, and every material drawn there compiled a second program that play never uses (about 30 of them)
        if(G3.dbTick)G3.dbTick();
        // v5.2: the roofs drawn half-faded too, so the transparent roof shaders the first zoom-in needs are compiled now, not mid-play
        const rf=G3.roofFade&&G3.camGet?G3.camGet()[2]:null;if(rf!=null)G3.roofFade(120);if(G3.hoodWarm)G3.hoodWarm(true);   /* (v6.11.1: the dryer hood front half faded too, 25) */
        renderer.shadowMap.needsUpdate=true;renderer.setScissorTest(true);renderer.setScissor(0,0,1,1);renderer.render(scene,camera);if(rf!=null)G3.roofFade(rf);if(G3.hoodWarm)G3.hoodWarm(false);
        renderer.setScissorTest(false);shown.forEach(g=>g.visible=false);wld.forEach((o,i)=>o.visible=wv[i]);renderer.shadowMap.needsUpdate=true;
        // v4.0.1: the stand-ins' materials are kept, not disposed: three.js deletes a shader program once no material uses it,
        // which threw away every shader compiled only for a stand-in
        G3.keepMats=stand.map(([bm])=>bm.material).filter(Boolean);stand.forEach(([bm,g])=>{if(bm.isObject3D)scene.remove(bm);bm.dispose();if(g)g.dispose();});}catch(e){console.error("warm render failed",e);}
      try{if(G3.cutWarm)G3.cutWarm();}catch(e){}   // v6.1 t2: the cut-out pictures' shaders (42f)
      try{renderer.compileAsync(scene,camera).then(done,done);}catch(e){done();}};
    requestAnimationFrame(stepW);}));
  let clothMs=null;
  function fxUpdate(rdt,now){
    for(const id in FX){FX[id].g.visible=false;FX[id].on=false;}   // v4.0.1: labels are hidden after the loop, and only if shown
    for(const m of (clothMs||(clothMs=[wireLoop,...feltMeshes]))){m.scale.z=1;m.visible=true;}clothTick(now,rdt);   // (v4.2.5: one list, built once)
    const doTxt=now-lastIncTxt>200;if(doTxt)lastIncTxt=now;const w=G3.vw||host.clientWidth,hh=G3.vh||host.clientHeight;
    S.inc.forEach((inc,i)=>{let f=FX[inc.id];
      if(!f)f=makeFX(inc.id);
      if(G3.EXP&&G3.EXP.hideFX===inc.id){f.g.visible=false;return;}   // autotest GPU probe: this effect off (no drawing, no new particles)
      f.g.visible=true;f.on=true;f.up(now,rdt,inc);if(inc.asset&&inc.kind!=="drv"&&G3.ASPOT&&G3.ASPOT[inc.asset]){const q=G3.ASPOT[inc.asset];f.pinPos=[q[2],q[3]];}   /* (v6.10: the failed machine, 07i) */if(f.pinPos)f.pin.move(f.pinPos[0],f.pinPos[1]);f.pin.update(now);
      {const zp=!G3.zen&&!G3.cineOn;f.pin.p.visible=f.pin.ring.visible=f.pin.stem.visible=zp;}   // v3.0.1: zen mode shows events without the red pins
      tmp.set(f.pin.x,f.pin.p.position.y+3.4,f.pin.z).project(camera);const vis=!G3.zen&&tmp.z<1&&Math.abs(tmp.x)<1.1&&Math.abs(tmp.y)<1.1;f.lb.vis=vis;
      if(vis){f.lb.x=Math.round((tmp.x+1)/2*w);f.lb.y=Math.round((1-tmp.y)/2*hh);
        if(doTxt||f.lb.a==null){const st=incState(inc),hold=inc.stage==="wait"||inc.stage==="found",b=`${st?st+" · ":""}${hold?"awaiting decision":(inc.left/60).toFixed(1)+" h left"}${inc.note?" · "+inc.note.split(" · ")[0]:""}`;lblSet(f.lb,EV[inc.id].name,b,true);}}});
    for(const id in FX){const f=FX[id];if(!f.on)f.lb.vis=false;}
    papTick();stepParts(rdt);fireLight.position.copy(fireLpos);fireFloorK=Math.max(0,fireFloorK-rdt*1.5);
    {const fl=0.9*Math.sin(performance.now()/60)+0.6*Math.sin(performance.now()/23),on=fireFloor.userData.on||0;fireLight.intensity=fireL>0?LEG*0.75*fireL*(3.4+fl+fireFloorK*3):0;
      fireFloor.visible=on>0;if(on>0){fireFloor.material.opacity=Math.min(1,on*(0.42+0.1*fl+fireFloorK*0.25));}fireFloor.userData.on=0;}fireL=0;
    if(!S.inc.some(i=>i.id==="brownout")){G3.brownK=1;G3.bFlash=0;}{const el=$("tint3d"),T=S.inc.some(i=>i.id==="brownout"||i.id==="duststorm")&&G3.tint?G3.tint:null,c=T?T[0]:"#000",o=T?String(Math.round(T[1]*100)/100):"0";if(el){if(el.style.background!==c&&T)el.style.background=c;if(el.style.opacity!==o)el.style.opacity=o;}if(!T)G3.tint=null;}if(!S.inc.some(i=>i.id==="icedintake"))G3.iceK=0;if(!S.inc.some(i=>i.id==="duststorm"))G3.dustK=0;if(!S.inc.some(i=>i.id==="flood"))G3.floodK=0;
    const out=S.inc.some(i=>i.id==="lightning"||(i.id==="birdline"&&!G3.cineHold));if(blackEl.hidden!==!out)blackEl.hidden=!out;
    if(out){const bt=S.inc.some(i=>i.id==="lightning")?"Lightning hit the substation. Backup generators starting…":"A bird flew into the substation. Backup generators starting…",sp=blackEl.querySelector("span");if(sp&&sp.textContent!==bt)sp.textContent=bt;}if(!out){const fl=$("flash3d"),v=String(G3.bFlash||0);if(fl.style.opacity!==v)fl.style.opacity=v;}
  }

