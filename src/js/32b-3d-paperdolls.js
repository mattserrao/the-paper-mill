  /* ---- v6 Paper-craft (prototype, ?style=paper): paper-doll workers ----
     Each worker's 3D figure (about 10 small parts) is hidden and drawn instead as a flat, hand-drawn cut-out card: inked
     outline, flat colours, a white paper border and a little offset shadow, like a pop-up book figure. All cards are one
     instanced mesh (one draw for every worker on site). A card stands upright, turns to face the camera (tipped back a
     little so it still reads from above), flips left or right with the way the worker is walking, and animates like a paper
     puppet: a few drawn poses (stand, two walk steps, work, carry, crouch, reach) switched on "twos" (about 12 a second) with a
     hop and a wobble. The figures are drawn into a texture at start-up, one row of poses per outfit (suit, hard hat, vest). */
  if(G3.style==="paper"){
    const DOLLS=[],CW=96,CH=160,FR=7,ATW=2048,ATH=2048,PER_ROW=Math.floor(ATW/(CW*FR));
    const atlas=document.createElement("canvas");atlas.width=ATW;atlas.height=ATH;const ax=atlas.getContext("2d");
    const tex=new THREE.CanvasTexture(atlas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
    const outfits=new Map();let drawn=false;
    // a hand-drawn stroke: the points get a little jitter and the line a little pressure
    const rnd=(()=>{let s=20261017;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};})();
    function wob(c,pts,close){c.beginPath();pts.forEach(([x,y],i)=>{const jx=x+(rnd()-0.5)*1.4,jy=y+(rnd()-0.5)*1.4;i?c.lineTo(jx,jy):c.moveTo(jx,jy);});if(close)c.closePath();}
    function blob(c,cx,cy,rx,ry,n=10){const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;p.push([cx+Math.cos(a)*rx*(1+(rnd()-0.5)*0.08),cy+Math.sin(a)*ry*(1+(rnd()-0.5)*0.08)]);}return p;}
    // one figure, facing right, feet at (x, y). f = pose: 0 stand, 1 walk A, 2 walk B, 3 work, 4 carry, 5 crouch, 6 reach
    function figure(c,x,y,f,o){const INK="#2b2320";c.lineJoin=c.lineCap="round";
      const crouch=f===5?14:0,lean=f===3?6:f===4?2:0,hy=y-62+crouch,sh=hy-44+(f===5?4:0);   // hip and shoulder heights
      const fill=(pts,col,w=2.2)=>{wob(c,pts,true);c.fillStyle=col;c.fill();c.strokeStyle=INK;c.lineWidth=w;c.stroke();};
      const limb=(a,b,col,w)=>{wob(c,[a,b]);c.strokeStyle=INK;c.lineWidth=w+3.2;c.stroke();wob(c,[a,b]);c.strokeStyle=col;c.lineWidth=w;c.stroke();};
      // legs (trousers in the suit colour, boots in ink)
      const lg=f===1?[[-9,8]]:f===2?[[8,-9]]:f===5?[[-12,14]]:[[-4,4]];const[l1,l2]=lg[0];
      for(const d of [l1,l2]){const fx=x+d+lean*0.3,ky=hy+30;limb([x+lean*0.4,hy+4],[x+d*0.6+lean*0.3,ky-(f===5?10:0)],o.suit,8);limb([x+d*0.6+lean*0.3,ky-(f===5?10:0)],[fx,y-5],o.suit,8);
        fill([[fx-5,y-8],[fx+8,y-8],[fx+9,y],[fx-5,y]],INK,1.4);}
      // back arm (drawn before the body)
      const armB=f===1?[x+10,sh+30]:f===2?[x-10,sh+30]:f===3||f===4?[x+22+lean,sh+18]:f===6?[x+8,sh-26]:[x-6,sh+34];
      limb([x+lean,sh+6],armB,o.suitD,7);
      // body: coverall, with the vest and its reflective band over it
      fill([[x-16+lean,sh],[x+16+lean,sh],[x+15+lean*0.5,hy+6],[x-15+lean*0.5,hy+6]],o.suit);
      if(o.vest){fill([[x-15+lean,sh+4],[x+15+lean,sh+4],[x+14+lean*0.6,hy-6],[x-14+lean*0.6,hy-6]],o.vest,1.8);
        wob(c,[[x-11+lean*0.8,sh+24],[x+11+lean*0.8,sh+24]]);c.strokeStyle="#e8ecef";c.lineWidth=4;c.stroke();}
      // carried bundle
      if(f===4)fill([[x+8,sh+8],[x+34,sh+8],[x+34,sh+30],[x+8,sh+30]],"#f1e9d6",2);
      // head, face and hard hat
      const hx=x+3+lean*1.3,hyy=sh-15;fill(blob(c,hx,hyy,11,12),o.skin,2);
      c.fillStyle=INK;c.beginPath();c.arc(hx+5,hyy-1,1.6,0,7);c.fill();   // eye
      wob(c,[[hx+10,hyy+2],[hx+12,hyy+5],[hx+9,hyy+6]]);c.lineWidth=1.4;c.strokeStyle=INK;c.stroke();   // nose
      wob(c,[[hx+3,hyy+8],[hx+8,hyy+7.5]]);c.stroke();   // mouth
      const hp=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;hp.push([hx+Math.cos(a)*13,hyy-6+Math.sin(a)*11]);}
      fill(hp.concat([[hx+18,hyy-6],[hx+18,hyy-3],[hx-14,hyy-3]]),o.hat,2);
      // front arm and hand
      const armF=f===1?[x-12,sh+30]:f===2?[x+12,sh+30]:f===3?[x+26+lean,sh+14]:f===4?[x+26,sh+22]:f===6?[x+12,sh-30]:[x+4,sh+36];
      limb([x+lean,sh+6],armF,o.suit,7);fill(blob(c,armF[0],armF[1],4.2,4.2,7),o.skin,1.4);}
    // draw one outfit's row of poses: white paper border and a soft offset shadow behind each figure
    function drawOutfit(k,o){const row=Math.floor(k/PER_ROW),col0=(k%PER_ROW)*FR;
      for(let f=0;f<FR;f++){const cx=(col0+f)*CW,cy=row*CH;const t=document.createElement("canvas");t.width=CW;t.height=CH;const tc=t.getContext("2d");
        figure(tc,CW/2-4,CH-14,f,o);
        // the cut: the figure's silhouette grown by ~4 px in white, then its shadow offset down-right
        const sil=document.createElement("canvas");sil.width=CW;sil.height=CH;const sc=sil.getContext("2d");
        for(let a=0;a<16;a++){sc.drawImage(t,Math.cos(a/16*Math.PI*2)*4,Math.sin(a/16*Math.PI*2)*4);}
        sc.globalCompositeOperation="source-in";sc.fillStyle="#fbf8f1";sc.fillRect(0,0,CW,CH);
        ax.save();ax.beginPath();ax.rect(cx,cy,CW,CH);ax.clip();
        ax.globalAlpha=0.28;ax.filter="brightness(0)";ax.drawImage(sil,cx+3,cy+3);ax.filter="none";ax.globalAlpha=1;
        ax.drawImage(sil,cx,cy);ax.drawImage(t,cx,cy);ax.restore();}}
    const hexOf=m=>m&&m.color?"#"+m.color.clone().convertLinearToSRGB().getHexString():"#888888";
    function outfitIndex(d){const key=[d.suit.uuid,d.hat.uuid,d.vest?d.vest.uuid:""].join();let k=outfits.get(key);
      if(k===undefined){k=outfits.size;if(k>=PER_ROW*Math.floor(ATH/CH))k=0;else{outfits.set(key,k);d.k=k;}
        const sc=new THREE.Color(hexOf(d.suit));drawOutfit(k,{suit:hexOf(d.suit),suitD:"#"+sc.clone().multiplyScalar(0.78).getHexString(),hat:hexOf(d.hat),vest:d.vest?hexOf(d.vest):null,skin:hexOf(d.skin)});tex.needsUpdate=true;}
      return k;}
    // the card layer: one instanced quad per worker; its own atlas cell comes in per instance (offset), and the card is lit by
    // a single brightness that follows the daylight, so figures dim at night like everything else
    const MAXD=160,geo=new THREE.PlaneGeometry(1,1);geo.translate(0,0.5,0);
    const cell=new THREE.InstancedBufferAttribute(new Float32Array(MAXD*2),2);cell.setUsage(THREE.DynamicDrawUsage);geo.setAttribute("cell",cell);
    const mat=new THREE.MeshBasicMaterial({map:tex,alphaTest:0.5,side:THREE.DoubleSide,color:0xffffff});
    // canvas rows count from the top and the texture is flipped on upload, so a card's top (uv.y=1) maps to its cell's top row
    mat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace("void main() {","attribute vec2 cell;\nvoid main() {").replace("#include <uv_vertex>",
      `#include <uv_vertex>\nvMapUv=vec2((cell.x+uv.x)*${(CW/ATW).toFixed(6)},1.0-(cell.y+1.0-uv.y)*${(CH/ATH).toFixed(6)});`);};
    mat.customProgramCacheKey=()=>"pmdoll";
    const cards=new THREE.InstancedMesh(geo,mat,MAXD);cards.count=0;cards.frustumCulled=false;cards.userData.noNav=true;cards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(cards);
    const hide=o=>Object.defineProperty(o,"visible",{get:()=>false,set:()=>{},configurable:true});
    G3.paperDoll=(p,suit,hat,role)=>{p.traverse(o=>{if(o.isMesh)hide(o);});DOLLS.push({p,suit,hat,vest:role&&role.vest||null,skin:M.skin,k:-1});};
    const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(0,0,0,"YXZ"),_s=new THREE.Vector3(),_v=new THREE.Vector3(),_r=new THREE.Vector3(),_f=new THREE.Vector3(),_pq=new THREE.Quaternion();
    const POSE={run:1,carry:4,clean:3,fix:3,hose:3,ext:3,pull:3,type:3,dump:3,throw:6,rethread:6,look:6,relax:5,sit:5};
    function shown(o){for(let x=o;x;x=x.parent)if(!x.visible)return false;return true;}
    G3.paperDollTick=now=>{if(!DOLLS.length)return;
      if(!drawn){drawn=true;DOLLS.forEach(d=>d.k=outfitIndex(d));}
      const step=Math.floor(now/83);   // "on twos": a new drawing about 12 times a second
      _r.setFromMatrixColumn(camera.matrixWorld,0);const ce=camera.matrixWorld.elements,yaw=Math.atan2(ce[8],ce[10]);
      const back=-Math.asin(Math.max(-1,Math.min(1,ce[9])))*0.45;   // tip the card back toward a camera that looks down
      let n=0;
      for(const d of DOLLS){const p=d.p;if(n>=MAXD||!p.parent||!shown(p))continue;
        p.updateWorldMatrix(true,false);p.matrixWorld.decompose(_v,_pq,_s);
        const u=p.userData,mode=u.dmode||"",moving=mode==="run"||mode==="carry";
        // which way the figure faces on screen: its +x axis against the camera's right
        _f.set(1,0,0).applyQuaternion(_pq);const face=_f.dot(_r)>=0?1:-1;
        let fr=POSE[mode]||0;if(mode==="run")fr=(step+(d.k*3))%2?1:2;
        const hop=moving?((step%2)?0.09:0):(fr===3||fr===6)&&(step%4<2)?0.04:0;
        const tilt=moving?((step%2)?0.07:-0.07)*face:fr===3?-0.12*face:0;
        const H=2.6*_s.y,Wd=H*CW/CH;
        _e.set(back,yaw,tilt);_q.setFromEuler(_e);_m.compose(_v.set(_v.x,_v.y+hop,_v.z),_q,_s.set(Wd*face,H,1));
        cards.setMatrixAt(n,_m);const k=Math.max(0,d.k);cell.setXY(n,(k%PER_ROW)*FR+fr,Math.floor(k/PER_ROW));n++;}
      cards.count=n;cards.instanceMatrix.needsUpdate=true;cell.needsUpdate=true;
      const day=Math.max(0.28,Math.min(1,hemi.intensity/(LEG*baseHemi)));mat.color.setScalar(day);};
    diag("paper dolls on");
  }
