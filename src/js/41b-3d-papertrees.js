  /* ---- v6 Paper-craft: hand-drawn cut-out trees ----
     Every tree and bush on the site is one flat card (2 triangles) cut from a sheet of hand-drawn trees: inked outline, two
     tones of foliage, a bark trunk and a thin white paper border. All cards are one instanced batch (one draw for the whole
     forest) that turns round its upright axis to face the camera, like a stand-up card on a table. Each card is tinted with
     the colour the 3D tree would have had, and a flat cut-paper shadow lies on the ground beside it (one more draw).
     Before: about 20 triangles per conifer and 14 per broadleaf. Edges stay smooth under MSAA (alpha to coverage). */
  if(G3.style==="paper"){
    const CW=128,CH=192,COLS=4,ROWS=2,ATW=CW*COLS,ATH=CH*ROWS;
    // cells: 0-2 broadleaf, 3-5 conifer, 6-7 bush. Channels: R foliage tone, G foliage mask, B 0 ink / 0.5 bark / 1 paper rim
    const atlas=document.createElement("canvas");atlas.width=ATW;atlas.height=ATH;const ax=atlas.getContext("2d");
    const rn=(()=>{let q=31337;return()=>{q=(q*1664525+1013904223)>>>0;return q/4294967296;};})();
    const INK="rgb(0,0,0)",BARK="rgb(0,0,128)",RIM="rgb(0,0,255)",LEAF=t=>`rgb(${t},255,0)`;
    function wobPath(c,pts){c.beginPath();pts.forEach(([x,y],i)=>{const jx=x+(rn()-0.5)*2,jy=y+(rn()-0.5)*2;i?c.lineTo(jx,jy):c.moveTo(jx,jy);});c.closePath();}
    function blobPts(cx,cy,rx,ry,n,bump){const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=1+(i%2?-bump:bump)*(0.6+rn()*0.6);p.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k]);}return p;}
    function cell(i,draw){const x0=(i%COLS)*CW,y0=Math.floor(i/COLS)*CH;ax.save();ax.beginPath();ax.rect(x0,y0,CW,CH);ax.clip();ax.translate(x0,y0);
      ax.lineJoin=ax.lineCap="round";draw(ax);ax.restore();}
    // one shape drawn three times: thick paper rim, the fill, then the ink line
    function cut(c,pts,fill,ink=3){wobPath(c,pts);c.strokeStyle=RIM;c.lineWidth=ink+7;c.stroke();wobPath(c,pts);c.fillStyle=fill;c.fill();c.strokeStyle=INK;c.lineWidth=ink;c.stroke();}
    function trunk(c,cx,top,bot,w){const p=[[cx-w,bot],[cx-w*0.7,top],[cx+w*0.7,top],[cx+w,bot]];cut(c,p,BARK,2.5);}
    function hatch(c,pts){c.save();wobPath(c,pts);c.clip();c.strokeStyle=LEAF(120);c.lineWidth=2;for(let k=-CH;k<CW+CH;k+=7){c.beginPath();c.moveTo(k,0);c.lineTo(k+CH*0.6,CH);c.stroke();}c.restore();}
    // broadleaf: a lumpy round crown on a short trunk, the shade side hatched
    for(let v=0;v<3;v++)cell(v,c=>{trunk(c,CW/2,CH*0.55,CH-6,7);const crown=blobPts(CW/2,CH*0.38,CW*0.4,CH*0.3,12+v*2,0.07);cut(c,crown,LEAF(215));
      const shade=blobPts(CW/2+CW*0.12,CH*0.44,CW*0.28,CH*0.2,10,0.06);hatch(c,shade);
      c.strokeStyle=INK;c.lineWidth=2;for(let k=0;k<3+v;k++){const a=rn()*6.28,r=CW*0.18*rn();c.beginPath();c.arc(CW/2+Math.cos(a)*r-6,CH*0.33+Math.sin(a)*r,4+rn()*4,3.4,5.6);c.stroke();}});
    // conifer: stacked jagged tiers
    for(let v=0;v<3;v++)cell(3+v,c=>{trunk(c,CW/2,CH*0.78,CH-6,6);const tiers=3+(v%2);
      for(let t=tiers-1;t>=0;t--){const top=CH*(0.06+t*0.2),bot=top+CH*(0.34+0.04*v),hw=CW*(0.2+t*0.07);
        const p=[[CW/2,top],[CW/2+hw*0.55,top+(bot-top)*0.55],[CW/2+hw*0.35,top+(bot-top)*0.6],[CW/2+hw,bot],[CW/2-hw,bot],[CW/2-hw*0.35,top+(bot-top)*0.6],[CW/2-hw*0.55,top+(bot-top)*0.55]];
        cut(c,p,LEAF(t%2?190:215));hatch(c,[[CW/2+2,top+8],[CW/2+hw,bot-2],[CW/2+2,bot-2]]);}});
    // bush: a low scalloped mound
    for(let v=0;v<2;v++)cell(6+v,c=>{const p=blobPts(CW/2,CH*0.78,CW*0.42,CH*0.17,14+v*3,0.08);cut(c,p,LEAF(205));hatch(c,blobPts(CW/2+CW*0.14,CH*0.83,CW*0.25,CH*0.09,10,0.05));});
    const tex=new THREE.CanvasTexture(atlas);tex.colorSpace=THREE.NoColorSpace;tex.anisotropy=4;
    const CELL={0:[0,3],1:[3,3],2:[6,2]},SIZE={0:[3.9,5.3],1:[3.5,6.4],2:[2.2,1.25]};   // card width, height per unit tree scale
    const INKL=new THREE.Color("#2b2320").convertSRGBToLinear(),BARKL=new THREE.Color("#7a5a3c").convertSRGBToLinear(),RIML=new THREE.Color("#fbf8f1").convertSRGBToLinear();
    const tmat=new THREE.ShaderMaterial({uniforms:{map:{value:tex},stLight:G3.styleU.stLight,ink:{value:INKL},bark:{value:BARKL},rim:{value:RIML},
        cell:{value:new THREE.Vector2(CW/ATW,CH/ATH)}},
      vertexShader:`attribute vec3 iCol;attribute vec2 iCell;uniform vec2 cell;varying vec2 vUv;varying vec3 vCol;
void main(){vec3 c=vec3(instanceMatrix[3]);float w=instanceMatrix[0][0],h=instanceMatrix[1][1];
  vec3 r=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);r.y=0.0;r=normalize(r);   // turn to face the camera, stay upright
  vec3 p=c+r*position.x*w+vec3(0.0,position.y*h,0.0);
  vUv=vec2((iCell.x+uv.x)*cell.x,1.0-(iCell.y+1.0-uv.y)*cell.y);vCol=iCol;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);}`,
      fragmentShader:`uniform sampler2D map;uniform vec3 stLight,ink,bark,rim;varying vec2 vUv;varying vec3 vCol;
void main(){vec4 t=texture2D(map,vUv);if(t.a<0.04)discard;
  vec3 other=mix(mix(ink,bark,clamp(t.b*2.0,0.0,1.0)),rim,clamp(t.b*2.0-1.0,0.0,1.0));
  vec3 col=mix(other,vCol*(0.68+0.42*t.r),t.g)*stLight;
  float a=clamp((t.a-0.5)/max(fwidth(t.a),1e-3)+0.5,0.0,1.0);gl_FragColor=vec4(col,a);
  #include <colorspace_fragment>
}`,alphaToCoverage:true,side:THREE.DoubleSide});
    tmat.customProgramCacheKey=()=>"pmtrees";
    G3.paperTreeBatch=(list,hAt)=>{
      const n=list.length,geo=new THREE.PlaneGeometry(1,1);geo.translate(0,0.5,0);
      const col=new Float32Array(n*3),cl=new Float32Array(n*2),_c=new THREE.Color(),_m=new THREE.Matrix4();
      const mesh=new THREE.InstancedMesh(geo,tmat,n);
      // shadows: flat ellipses on the ground, cut from one sheet of shade (stencilled like the mill's paper shadows)
      const sc=document.createElement("canvas");sc.width=sc.height=64;{const x=sc.getContext("2d");x.fillStyle="#fff";x.beginPath();x.ellipse(32,32,30,30,0,0,7);x.fill();}
      const stex=new THREE.CanvasTexture(sc);
      const smat=new THREE.MeshBasicMaterial({color:new THREE.Color("#2b2320"),alphaMap:stex,alphaTest:0.5,transparent:true,opacity:0.36,depthWrite:false,fog:false,
        polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilZPass:THREE.ReplaceStencilOp});
      const sgeo=new THREE.PlaneGeometry(1,1);sgeo.rotateX(-Math.PI/2);const shad=new THREE.InstancedMesh(sgeo,smat,n);
      const LX=0.62,LZ=0.42,LA=Math.atan2(-LZ,LX),_q=new THREE.Quaternion(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_e=new THREE.Euler();let lo=new THREE.Vector3(1e9,1e9,1e9),hi=new THREE.Vector3(-1e9,-1e9,-1e9);
      for(let i=0;i<n;i++){const [x,z,s,hex,k]=list[i],y=hAt(x,z),[cw,ch]=SIZE[k],[c0,cn]=CELL[k];
        const h=ch*s*(0.92+0.16*((i*0.618)%1)),w=cw*s;_m.makeScale(w,h,1);_m.setPosition(x,y-0.05,z);mesh.setMatrixAt(i,_m);
        _c.set(hex).convertSRGBToLinear();col[i*3]=_c.r;col[i*3+1]=_c.g;col[i*3+2]=_c.b;const v=c0+Math.floor(((x*7.13+z*3.71)%cn+cn)%cn);cl[i*2]=v%COLS;cl[i*2+1]=Math.floor(v/COLS);
        const len=k===2?w*0.9:h*0.55+w*0.3;_e.set(0,LA,0);_q.setFromEuler(_e);_v.set(x+LX*h*0.33,y+0.06,z+LZ*h*0.33);_s.set(len,1,w*0.62);_m.compose(_v,_q,_s);shad.setMatrixAt(i,_m);
        lo.min(_v.set(x-w,y,z-w));hi.max(_v.set(x+w,y+h,z+w));}
      geo.setAttribute("iCol",new THREE.InstancedBufferAttribute(col,3));geo.setAttribute("iCell",new THREE.InstancedBufferAttribute(cl,2));
      const bs=new THREE.Sphere();new THREE.Box3(lo,hi).getBoundingSphere(bs);geo.boundingSphere=bs;mesh.boundingSphere=bs.clone();mesh.frustumCulled=false;shad.frustumCulled=false;
      mesh.userData.noNav=true;shad.userData.noNav=true;mesh.raycast=()=>{};shad.raycast=()=>{};shad.renderOrder=1;
      scene.add(mesh,shad);G3.paperTrees={mesh,shad,n};
      diag(`paper trees: ${n} cut-out cards, ${n*2} triangles (+${n*2} shadow), 2 draws`);};
  }
