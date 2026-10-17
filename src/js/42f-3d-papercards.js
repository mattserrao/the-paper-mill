  /* ---- v6 Paper-craft: cut-out cards for vehicles and big props ----
     Trucks (box, bale and tanker), trailers in the yard, forklifts and clamp trucks, parked and commuting cars, the train
     (locomotive, boxcars, bale flat), the food truck and the water tower are drawn once, at start-up, as hand-drawn side
     views: ink outline, flat colours, a little hatching on the shade side and a white paper rim, like the worker figures and
     the trees. Their 3D parts are hidden, and each is shown as one card standing where it is, turning to face the camera
     and flipping to the way it is going. All cards are one instanced batch (one draw), all their flat paper shadows another.
     Moving pieces hop and tip a little on each stop-motion step, as if pushed along by hand. Forklifts and clamp trucks
     show their load only while they carry one. The game's own positions, headings and visibility are never changed. */
  if(G3.style==="paper"){
    const PXM=40,ATW=2048,ATH=2048,atlas=document.createElement("canvas");atlas.width=ATW;atlas.height=ATH;const AX=atlas.getContext("2d");
    const INK="#2b2320",RIM="#fbf8f1",GLASS="#a9c6dc",TYRE="#2f2b30",HUB="#b8b2a6";
    const rn=(()=>{let q=4242;return()=>{q=(q*1664525+1013904223)>>>0;return q/4294967296;};})();
    const shade=(hex,k)=>{const c=new THREE.Color(hex);c.multiplyScalar(k);return "#"+c.getHexString();};
    const SPR={};let shX=4,shY=4,shH=0;
    /* drawing in metres: x to the right from the back of the piece, y up from the ground; the sprite faces right */
    function sprite(name,wm,hm,draw,pxm=PXM){const pad=8,wp=Math.ceil(wm*pxm)+pad*2,hp=Math.ceil(hm*pxm)+pad*2;
      if(shX+wp>ATW){shX=4;shY+=shH+4;shH=0;}if(shY+hp>ATH){console.warn("paper cards: atlas full",name);return;}
      const t=document.createElement("canvas");t.width=wp;t.height=hp;const c=t.getContext("2d");c.setTransform(pxm,0,0,-pxm,pad,hp-pad);
      c.lineJoin=c.lineCap="round";const K={c,lw:0.075,
        poly(pts,fill,ink=true){c.beginPath();pts.forEach(([x,y],i)=>{const jx=x+(rn()-0.5)*0.03,jy=y+(rn()-0.5)*0.03;i?c.lineTo(jx,jy):c.moveTo(jx,jy);});c.closePath();
          if(fill){c.fillStyle=fill;c.fill();}if(ink){c.strokeStyle=INK;c.lineWidth=K.lw;c.stroke();}},
        rect(x,y,w,h,fill,ink=true){K.poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],fill,ink);},
        line(pts,w=K.lw,col=INK){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.stroke();},
        circ(x,y,r,fill,ink=true){c.beginPath();c.arc(x,y,r,0,7);if(fill){c.fillStyle=fill;c.fill();}if(ink){c.strokeStyle=INK;c.lineWidth=K.lw;c.stroke();}},
        wheel(x,r){K.circ(x,r,r,TYRE);K.circ(x,r,r*0.42,HUB);},
        // pencil hatching over a box (the shade side: the lower part of a body)
        hatch(x,y,w,h,col="rgba(43,35,32,0.28)"){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.strokeStyle=col;c.lineWidth=0.035;for(let k=-h;k<w;k+=0.22){c.beginPath();c.moveTo(x+k,y);c.lineTo(x+k+h,y+h);c.stroke();}c.restore();},
        text(s,x,y,size,col){c.save();c.scale(1,-1);c.fillStyle=col;c.font=`800 ${size}px "Plus Jakarta Sans",system-ui,sans-serif`;c.textAlign="center";c.textBaseline="middle";c.fillText(s,x,-y);c.restore();}};
      draw(K);
      // the cut: the drawing's outline grown by a few pixels in white paper, under the drawing
      const r=document.createElement("canvas");r.width=wp;r.height=hp;const rc=r.getContext("2d");for(let a=0;a<16;a++)rc.drawImage(t,Math.cos(a/16*6.283)*4,Math.sin(a/16*6.283)*4);
      rc.globalCompositeOperation="source-in";rc.fillStyle=RIM;rc.fillRect(0,0,wp,hp);
      AX.drawImage(r,shX,shY);AX.drawImage(t,shX,shY);
      // card rectangle in metres, including the pad, measured from the sprite's own origin
      SPR[name]={u0:shX/ATW,v0:shY/ATH,u1:(shX+wp)/ATW,v1:(shY+hp)/ATH,wm,hm,padm:pad/pxm,wpm:wp/pxm,hpm:hp/pxm};shX+=wp+4;shH=Math.max(shH,hp);}
    const brand=()=>tok("brand")||"#2f7d4f";
    /* ---- the drawings ---- */
    function trailerBody(K,x0,col,stripe){K.rect(x0,0.85,4.2,2.15,col);K.hatch(x0,0.85,4.2,0.6);for(let x=x0+0.5;x<x0+4.1;x+=0.52)K.line([[x,0.9],[x,2.95]],0.025,"rgba(43,35,32,0.35)");
      if(stripe)K.rect(x0+0.1,1.1,4.0,0.16,stripe,false);K.rect(x0,0.62,4.2,0.23,"#3d3843");K.wheel(x0+0.55,0.45);K.wheel(x0+1.5,0.45);}
    function tractor(K,x0){const b=brand();K.rect(x0,0.55,2.2,0.3,"#3d3843");K.rect(x0+0.05,0.85,0.6,1.7,shade(b,0.85));
      K.poly([[x0+0.65,0.7],[x0+1.95,0.7],[x0+2.05,1.0],[x0+2.05,2.55],[x0+1.85,2.95],[x0+0.65,2.95]],b);K.hatch(x0+0.65,0.7,1.4,0.55);
      K.poly([[x0+1.3,2.0],[x0+1.85,2.0],[x0+1.97,2.55],[x0+1.8,2.82],[x0+1.3,2.82]],GLASS);K.rect(x0+1.95,0.55,0.18,0.35,"#cfd3d8");
      K.circ(x0+2.02,1.15,0.09,"#fff3c8");K.line([[x0+0.4,2.55],[x0+0.4,3.35]],0.11);K.wheel(x0+0.55,0.45);K.wheel(x0+1.65,0.45);}
    function liftBase(K,loaded,clamp){const Y="#f5b70f";K.rect(0,0.3,0.32,0.75,"#3d3843");K.poly([[0.3,0.28],[1.32,0.28],[1.32,0.9],[0.3,0.95]],Y);K.hatch(0.3,0.28,1.02,0.3);
      K.line([[0.18,0.95],[0.18,2.0],[1.05,2.0],[1.05,0.95]],0.08);K.rect(0.4,0.95,0.32,0.5,"#ef7d22");K.circ(0.62,1.62,0.15,"#f0cfb2");K.poly([[0.45,1.68],[0.8,1.68],[0.76,1.83],[0.5,1.83]],"#f5b70f");
      K.rect(1.36,0.2,0.1,1.95,"#3d3843");K.circ(1.0,2.08,0.07,"#ff9f1a",false);K.wheel(0.38,0.26);K.wheel(1.1,0.26);
      if(clamp){K.rect(1.46,0.55,0.12,1.0,brand());if(loaded){K.rect(1.58,0.55,0.95,1.0,"#f6f1e4");K.poly([[2.53,0.55],[2.68,0.75],[2.68,1.35],[2.53,1.55]],"#e6dccb");K.line([[1.6,1.05],[2.5,1.05]],0.03,"rgba(43,35,32,0.35)");}}
      else{K.rect(1.46,0.18,0.95,0.07,"#3d3843");if(loaded){K.rect(1.5,0.26,0.86,0.7,"#b07a43");K.hatch(1.5,0.26,0.86,0.25);K.line([[1.5,0.62],[2.36,0.62]],0.04,"#5b3f22");}}}
    function car(K,col){K.poly([[0.05,0.38],[4.1,0.38],[4.25,0.62],[4.15,0.95],[3.25,1.02],[2.75,1.55],[1.15,1.55],[0.75,1.0],[0.08,0.92]],col);K.hatch(0.05,0.38,4.2,0.28);
      K.poly([[1.3,1.05],[1.95,1.05],[1.95,1.46],[1.22,1.46]],GLASS);K.poly([[2.1,1.05],[2.95,1.05],[2.62,1.46],[2.1,1.46]],GLASS);K.circ(4.12,0.75,0.07,"#fff3c8",false);K.wheel(0.9,0.33);K.wheel(3.3,0.33);}
    function loco(K){const b=brand();K.rect(0.2,0.85,13.2,0.35,"#3d3843");K.rect(0.7,1.2,7.9,2.3,b);K.hatch(0.7,1.2,7.9,0.7);
      for(let x=1.2;x<8.4;x+=1.1)K.line([[x,1.35],[x,3.35]],0.03,"rgba(43,35,32,0.35)");K.rect(8.6,1.2,2.5,3.0,b);K.rect(9.0,3.1,1.7,0.75,GLASS);K.rect(8.5,4.2,2.7,0.14,"#3d3843");
      K.rect(11.1,1.2,2.0,1.6,b);K.line([[0.7,1.95],[13.1,1.95]],0.07,"#f2b51d");K.line([[2.3,3.5],[2.3,3.85]],0.18);K.circ(13.1,2.4,0.1,"#fff3c8");
      [[2.6,4.0],[9.7,11.2]].forEach(([a,c])=>{K.rect(a-0.6,0.42,c-a+1.2,0.42,"#3d3843");K.wheel(a,0.42);K.wheel(c,0.42);});}
    function boxcar(K,col){K.rect(0.2,0.9,12.4,0.3,"#3d3843");K.rect(0.4,1.2,12.0,3.3,col);K.hatch(0.4,1.2,12.0,1.0);
      for(let x=0.95;x<12.4;x+=1.1)K.line([[x,1.25],[x,4.45]],0.03,"rgba(43,35,32,0.4)");K.rect(5.1,1.3,2.6,2.75,shade(col,0.62));K.line([[6.4,1.3],[6.4,4.05]],0.04);
      K.rect(0.3,4.5,12.2,0.1,"#3d3843");[[2.0,3.4],[9.4,10.8]].forEach(([a,c])=>{K.rect(a-0.5,0.42,c-a+1.0,0.42,"#3d3843");K.wheel(a,0.42);K.wheel(c,0.42);});}
    function flatcar(K){K.rect(0.2,0.9,12.4,0.3,"#3d3843");K.rect(0.4,1.2,12.0,0.4,"#5b6270");K.rect(0.4,1.6,0.3,2.8,"#5b6270");K.rect(12.1,1.6,0.3,2.8,"#5b6270");
      for(let i=0;i<8;i++)for(let l=0;l<3;l++){const x=0.85+i*1.4,y=1.62+l*0.97;K.rect(x,y,1.3,0.95,["#b07a43","#a0703f","#bd8a52"][(i+l)%3]);K.line([[x,y+0.48],[x+1.3,y+0.48]],0.03,"#5b3f22");}
      [[2.0,3.4],[9.4,10.8]].forEach(([a,c])=>{K.rect(a-0.5,0.42,c-a+1.0,0.42,"#3d3843");K.wheel(a,0.42);K.wheel(c,0.42);});}
    function foodtruck(K,col){K.rect(0,0.45,5.6,2.6,col);K.hatch(0,0.45,5.6,0.7);K.poly([[5.6,0.45],[7.4,0.45],[7.5,1.4],[7.2,2.35],[5.6,2.35]],col);K.poly([[6.3,1.55],[7.15,1.55],[7.0,2.15],[6.3,2.15]],GLASS);
      K.rect(1.0,1.45,3.4,1.05,"#3d3843");K.rect(1.0,1.42,3.4,0.12,"#e9e2d2");for(let k=0;k<6;k++)K.rect(0.9+k*0.6,2.5,0.6,0.32,k%2?"#f6f1e6":"#d6382c");
      K.rect(1.4,3.05,2.6,0.55,"#f6f1e6");K.text("FOOD",2.7,3.33,0.38,"#d6382c");K.wheel(1.1,0.42);K.wheel(6.4,0.42);}
    function tower(K){const H=21,R=4.3,cx=4.8,b=brand();
      [[cx-3.1,cx-3.1],[cx+3.1,cx+3.1]].forEach(([a])=>K.rect(a-0.22,0,0.44,H,"#566a92"));K.rect(cx-0.2,0,0.4,H,"#8ea2bf");
      [6,12.5,19].forEach(y=>{K.line([[cx-3.1,y],[cx+3.1,y]],0.16,"#566a92");});[[0,6],[6,12.5],[12.5,19]].forEach(([y0,y1])=>{K.line([[cx-3.1,y0],[cx+3.1,y1]],0.07,"#566a92");K.line([[cx+3.1,y0],[cx-3.1,y1]],0.07,"#566a92");});
      K.poly([[cx-R,H],[cx+R,H],[cx+2.2,H-1.6],[cx-2.2,H-1.6]],"#8ea2bf");K.rect(cx-R,H,2*R,6.4,"#f3ecdd");K.hatch(cx-R,H,2*R,1.4);
      K.rect(cx-R,H+2.2,2*R,0.32,b,false);K.rect(cx-R,H+5.6,2*R,0.32,b,false);let n=(typeof MILL!=="undefined"&&MILL.name?MILL.name:"MILL").toUpperCase();if(n.length>22)n=n.slice(0,21)+"…";K.text(n,cx,H+3.95,Math.min(1.5,13.2/Math.max(4,n.length)),b);
      K.line([[cx-R-0.6,H+0.15],[cx+R+0.6,H+0.15]],0.18);K.line([[cx-R-0.7,H+1.2],[cx+R+0.7,H+1.2]],0.06);K.poly([[cx-R-0.35,H+6.4],[cx+R+0.35,H+6.4],[cx,H+8.8]],b);
      K.line([[cx,H+8.8],[cx,H+9.6]],0.1);K.circ(cx,H+9.75,0.22,"#d6382c");}
    function drawFixed(){
    sprite("truck_out",6.6,3.4,K=>{trailerBody(K,0,"#f3ecdd",brand());tractor(K,4.35);});
    sprite("truck_in",6.6,3.4,K=>{trailerBody(K,0,"#c9b38a",shade("#c9b38a",0.7));tractor(K,4.35);});
    sprite("truck_chem",6.6,3.4,K=>{K.rect(0,0.62,4.2,0.25,"#3d3843");const p=[];for(let i=0;i<=16;i++){const a=Math.PI/2+i/16*Math.PI;p.push([0.85+Math.cos(a)*0.85,1.75+Math.sin(a)*0.85]);}
      for(let i=0;i<=16;i++){const a=-Math.PI/2+i/16*Math.PI;p.push([3.35+Math.cos(a)*0.85,1.75+Math.sin(a)*0.85]);}K.poly(p,"#d6dbe2");K.hatch(0,0.9,4.2,0.45);
      [1.2,2.1,3.0].forEach(x=>K.line([[x,0.92],[x,2.58]],0.05,"#8f98a6"));K.poly([[2.1,1.25],[2.45,1.6],[2.1,1.95],[1.75,1.6]],"#f5f5f0");K.text("8",2.1,1.6,0.32,INK);
      K.wheel(0.55,0.45);K.wheel(1.5,0.45);tractor(K,4.35);});
    sprite("trailer",4.4,3.1,K=>{trailerBody(K,0,"#f3ecdd",brand());K.line([[4.0,0.62],[4.0,0.15]],0.1);K.rect(3.85,0,0.3,0.12,INK,false);});
    sprite("fork_load",2.7,2.25,K=>liftBase(K,true,false));sprite("fork_empty",2.7,2.25,K=>liftBase(K,false,false));
    sprite("clamp_load",2.8,2.25,K=>liftBase(K,true,true));sprite("clamp_empty",2.8,2.25,K=>liftBase(K,false,true));
    sprite("loco",13.8,4.6,loco);sprite("box_red",12.8,4.7,K=>boxcar(K,"#9b3d2a"));sprite("box_blue",12.8,4.7,K=>boxcar(K,"#3d5f8c"));sprite("flat",12.8,4.6,flatcar);
    sprite("tower",9.6,31,tower,22);
    }
    drawFixed();
    // cars seen nose-on or from behind (parked in the rows, turning in): a front or a back view instead of the side
    function carEnd(K,col,front){K.poly([[0.05,0.35],[1.85,0.35],[1.9,0.95],[1.55,1.05],[1.4,1.55],[0.5,1.55],[0.35,1.05],[0.0,0.95]],col);K.hatch(0.05,0.35,1.8,0.28);
      K.poly([[0.55,1.05],[1.35,1.05],[1.25,1.45],[0.65,1.45]],GLASS);const L=front?"#fff3c8":"#d6382c";K.rect(0.15,0.68,0.32,0.16,L);K.rect(1.43,0.68,0.32,0.16,L);
      K.rect(0.6,0.48,0.7,0.14,front?"#3d3843":"#e9e2d2");K.rect(0.08,0.0,0.32,0.38,TYRE);K.rect(1.5,0.0,0.32,0.38,TYRE);}
    const carSprite=hex=>{const k="car_"+hex;if(!SPR[k]){sprite(k,4.35,1.65,K=>car(K,hex));sprite(k+"_f",1.9,1.6,K=>carEnd(K,hex,true));sprite(k+"_r",1.9,1.6,K=>carEnd(K,hex,false));}return k;};
    const foodSprite=hex=>{const k="food_"+hex;if(!SPR[k])sprite(k,7.6,3.7,K=>foodtruck(K,hex));return k;};
    /* ---- the card batch ---- */
    const tex=new THREE.CanvasTexture(atlas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;G3.paperAtlas=atlas;
    const MAXC=128,geo=new THREE.PlaneGeometry(1,1);geo.translate(0,0.5,0);
    const aRect=new THREE.InstancedBufferAttribute(new Float32Array(MAXC*4),4),aFT=new THREE.InstancedBufferAttribute(new Float32Array(MAXC*2),2);
    aRect.setUsage(THREE.DynamicDrawUsage);aFT.setUsage(THREE.DynamicDrawUsage);geo.setAttribute("iRect",aRect);geo.setAttribute("iFT",aFT);
    const cmat=new THREE.ShaderMaterial({uniforms:{map:{value:tex},stLight:G3.styleU.stLight},
      vertexShader:`attribute vec4 iRect;attribute vec2 iFT;varying vec2 vUv;
void main(){vec3 c=vec3(instanceMatrix[3]);float w=instanceMatrix[0][0],h=instanceMatrix[1][1];
  vec2 q=vec2(position.x*w,position.y*h);float t=iFT.y;q=vec2(q.x*cos(t)-q.y*sin(t),q.x*sin(t)+q.y*cos(t));   // tip about the card's foot
  vec3 r=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);r.y=0.0;r=normalize(r);
  vec3 p=c+r*q.x+vec3(0.0,q.y,0.0);float u=iFT.x>0.0?uv.x:1.0-uv.x;
  vUv=vec2(mix(iRect.x,iRect.z,u),1.0-mix(iRect.w,iRect.y,uv.y));gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);}`,
      fragmentShader:`uniform sampler2D map;uniform vec3 stLight;varying vec2 vUv;
void main(){vec4 t=texture2D(map,vUv);if(t.a<0.04)discard;float a=clamp((t.a-0.5)/max(fwidth(t.a),1e-3)+0.5,0.0,1.0);
  gl_FragColor=vec4(t.rgb*stLight,a);
  #include <colorspace_fragment>
}`,alphaToCoverage:true,side:THREE.DoubleSide});
    cmat.customProgramCacheKey=()=>"pmcards";
    const cards=new THREE.InstancedMesh(geo,cmat,MAXC);cards.count=0;cards.frustumCulled=false;cards.userData.noNav=true;cards.raycast=()=>{};cards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(cards);
    // paper shadows: one rounded rectangle per piece along its heading, offset from the lamp (stencilled like the other shadows)
    const vsc=document.createElement("canvas");vsc.width=vsc.height=64;{const x=vsc.getContext("2d");x.fillStyle="#fff";x.beginPath();if(x.roundRect)x.roundRect(4,10,56,44,14);else x.rect(4,10,56,44);x.fill();}
    const smat=new THREE.MeshBasicMaterial({color:new THREE.Color(INK),alphaMap:new THREE.CanvasTexture(vsc),alphaTest:0.5,transparent:true,opacity:0.36,depthWrite:false,fog:false,
      polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilZPass:THREE.ReplaceStencilOp});
    const sg=new THREE.PlaneGeometry(1,1);sg.rotateX(-Math.PI/2);const shad=new THREE.InstancedMesh(sg,smat,MAXC);shad.count=0;shad.frustumCulled=false;shad.renderOrder=1;shad.userData.noNav=true;shad.raycast=()=>{};scene.add(shad);
    /* ---- the pieces ---- */
    const CARDS=[];G3.paperCards=CARDS;const SEEN=new WeakSet();
    // hide every 3D part of a piece from the camera; the game still sets visible as it likes (kept in __vis)
    function hideParts(o){o.traverse(x=>{if(!(x.isMesh||x.isLineSegments||x.isPoints)||x.__pmHidden)return;x.__pmHidden=true;x.__vis=x.visible;
      Object.defineProperty(x,"visible",{get(){return false;},set(v){this.__vis=v;},configurable:true});});}
    const _inv=new THREE.Matrix4(),_m=new THREE.Matrix4(),_b=new THREE.Box3(),_v=new THREE.Vector3(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_e=new THREE.Euler(0,0,0,"YXZ"),_f=new THREE.Vector3(),_r=new THREE.Vector3();
    function localBox(g){g.updateMatrixWorld(true);_inv.copy(g.matrixWorld).invert();const b=new THREE.Box3();
      g.traverse(o=>{if(!o.isMesh||!o.geometry||o.userData.inkHull)return;const vis=o.__pmHidden?o.__vis:o.visible;if(!vis)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
        b.union(_b.copy(o.geometry.boundingBox).applyMatrix4(_m.multiplyMatrices(_inv,o.matrixWorld)));});return b;}
    function bodyColour(g){let best=null,bv=0;g.traverse(o=>{if(!o.isMesh||!o.geometry||!o.material||Array.isArray(o.material)||!o.material.color||o.userData.inkHull||o.material.side===THREE.BackSide)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
      const s=o.geometry.boundingBox.getSize(_v),vol=s.x*s.y*s.z*Math.abs(o.scale.x*o.scale.y*o.scale.z);if(vol>bv){bv=vol;best=o.material.color;}});
      return best?"#"+best.clone().convertLinearToSRGB().getHexString():"#888888";}
    function add(g,spr,opts={}){if(!SPR[spr]&&typeof spr==="string")return;const b=opts.box||localBox(g);if(b.isEmpty())return;
      const c={g,spr,fwd:opts.fwd||1,box:b,len:b.max.x-b.min.x,depth:b.max.z-b.min.z,flip:1,last:null,moving:0,ph:CARDS.length*1.7,pick:opts.pick||null,fixed:!!opts.fixed};
      hideParts(opts.hide||g);CARDS.push(c);SEEN.add(g);return c;}
    // at start-up: parked cars, yard trailers, the train, the food truck, the water tower
    scene.traverse(o=>{if(!o.isGroup||SEEN.has(o))return;const u=o.userData;
      if(u.car)add(o,carSprite(bodyColour(o)));
      else if(u.food)add(o,foodSprite(bodyColour(o)),{fwd:-1});
      else if(u.train){let kind="loco";if(u.door){const bc=new THREE.Color(bodyColour(o));kind=bc.b>bc.r?"box_blue":"box_red";}else{let inst=false;o.traverse(x=>{if(x.isInstancedMesh)inst=true;});if(inst)kind="flat";}
        add(o,kind);}});
    (G3.yardTr||[]).forEach(g=>{if(!SEEN.has(g))add(g,"trailer",{fwd:-1});});
    // the water tower is loose parts in the scene: gather everything standing within its footprint into one anchor
    if(G3.YP&&G3.YP.tower){const [TX,TZ]=G3.YP.tower,parts=[];scene.children.forEach(o=>{if(!(o.isMesh||o.isLineSegments))return;o.updateWorldMatrix(true,false);if(!o.geometry)return;
        if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();_v.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld);if(Math.hypot(_v.x-TX,_v.z-TZ)<5.6&&_v.y>0.05)parts.push(o);});
      if(parts.length){const anchor=new THREE.Object3D();anchor.position.set(TX,0,TZ);scene.add(anchor);parts.forEach(p=>hideParts(p));
        add(anchor,"tower",{box:new THREE.Box3(new THREE.Vector3(-4.8,0,-4.8),new THREE.Vector3(4.8,31,4.8)),fixed:true,hide:anchor});}}
    // later: trucks and lifts are made when the game first needs them; look for new ones once a second
    function scanNew(){for(const o of scene.children){if(!o.isGroup||SEEN.has(o))continue;const u=o.userData;
      if(u.wheels&&u.kind){add(o,u.kind==="chem"?"truck_chem":u.kind==="in"?"truck_in":"truck_out");}
      else if(u.load){const clamp=!!(u.load.geometry&&u.load.geometry.type==="CylinderGeometry");
        add(o,clamp?"clamp_load":"fork_load",{pick:()=>{const lv=u.load.__pmHidden?u.load.__vis:u.load.visible;return (clamp?"clamp_":"fork_")+(lv?"load":"empty");}});}
      else if(u.car)add(o,carSprite(bodyColour(o)));}}
    function shownW(o){for(let x=o;x;x=x.parent)if(x.visible===false&&!x.__pmHidden)return false;return true;}
    G3.paperCardsStep=step=>{if(step%12===0)scanNew();
      _r.set(camera.matrixWorld.elements[0],0,camera.matrixWorld.elements[2]).normalize();let n=0,ns=0;
      for(const c of CARDS){const g=c.g;if(!g.parent||!shownW(g))continue;if(n>=MAXC)break;
        g.updateWorldMatrix(true,false);g.matrixWorld.decompose(_v,_q,_s);const b=c.box,cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;
        const wp=new THREE.Vector3(cx,0,cz).applyMatrix4(g.matrixWorld);
        // moving? (hop and tip while it goes, settle when it stops)
        if(c.last){const d=Math.hypot(wp.x-c.last.x,wp.z-c.last.z);c.moving=d>0.01?3:Math.max(0,c.moving-1);}c.last=wp.clone();
        _f.set(c.fwd,0,0).applyQuaternion(_q);const dd=_f.x*_r.x+_f.z*_r.z;if(Math.abs(dd)>0.15)c.flip=dd>0?1:-1;
        let name=c.pick?c.pick():c.spr;const S0=SPR[name];if(!S0)continue;const k=c.fixed?1:Math.max(0.7,Math.min(1.4,c.len/S0.wm));
        if(name.startsWith("car_")&&Math.abs(dd)<0.5){const cf=camera.matrixWorld.elements;name+=(_f.x*cf[8]+_f.z*cf[10])>0?"_f":"_r";}   // (nose toward the camera: its front)
        const S=SPR[name]||S0,w=S.wpm*k,h=S.hpm*k;
        const on=c.moving>0,hop=on&&(step+(c.ph|0))%2?0.1:0,tilt=on?((step+(c.ph|0))%2?0.03:-0.03):0;
        // the card's foot sits on the ground at the piece's centre; the pad round the drawing hangs just below ground level
        _m.makeScale(w,h,1);_m.setPosition(wp.x,_v.y-S.padm*k+hop,wp.z);cards.setMatrixAt(n,_m);
        aRect.setXYZW(n,S.u0,S.v0,S.u1,S.v1);aFT.setXY(n,c.flip,tilt);n++;
        // its shadow: along its heading, offset away from the lamp by its height
        _e.setFromQuaternion(_q,"YXZ");_e.x=0;_e.z=0;_q.setFromEuler(_e);const off=S.hm*k*0.35;
        _m.compose(_s.set(wp.x+0.62*off,_v.y+0.06,wp.z+0.42*off),_q,new THREE.Vector3(Math.max(c.len,1)*1.02,1,Math.max(c.depth,0.8)*1.02));shad.setMatrixAt(ns++,_m);}
      cards.count=n;shad.count=ns;cards.instanceMatrix.needsUpdate=true;shad.instanceMatrix.needsUpdate=true;aRect.needsUpdate=true;aFT.needsUpdate=true;};
    // a new mill name or brand colour redraws the drawings that carry them (trucks, locomotive, clamp, water tower)
    {const rb0=G3.rebrand;G3.rebrand=()=>{rb0&&rb0();try{const keep=Object.keys(SPR);AX.clearRect(0,0,ATW,ATH);shX=4;shY=4;shH=0;for(const k in SPR)delete SPR[k];
        drawFixed();for(const k of keep){if(k.startsWith("car_"))carSprite(k.slice(4));else if(k.startsWith("food_"))foodSprite(k.slice(5));}tex.needsUpdate=true;}catch(e){console.error("paper cards redraw",e);}};}
    diag(`paper cards: ${CARDS.length} pieces at start (${Object.keys(SPR).length} drawings)`);
  }
