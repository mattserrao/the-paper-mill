  /* ---- v6 Paper-craft (prototype, ?style=paper): hand-drawn ink lines and pop-up scenery ----
     Ink: the scene renders into an off-screen target, then one full-screen pass draws wobbly ink where depth creases (object
     outlines, folds between walls and floors) or where the flat shade bands meet (fold lines on the card). The line positions
     wobble with a slowly changing noise seed (a few redraws a second: "line boil", like a hand-drawn cartoon), and the stroke
     darkness varies along the line like pen pressure. The same pass lays a faint paper-fibre grain over everything, figures
     and effects included, so the whole picture sits on one sheet. Cost: one extra full-screen pass, no extra scene draws. */
  if(G3.style==="paper"){
    // (no MSAA on the target: its multisample resolve cannot target the XR-flagged colour format; the ink lines hide the stair-steps)
    const rt=new THREE.WebGLRenderTarget(4,4,{depthTexture:new THREE.DepthTexture(4,4)});
    rt.texture.minFilter=rt.texture.magFilter=THREE.NearestFilter;rt.texture.generateMipmaps=false;rt.texture.colorSpace=THREE.SRGBColorSpace;
    // three.js tone-maps and sRGB-encodes only when drawing to the screen (or an XR target). Flagging the target as XR makes
    // every material shade exactly as it does on screen (same shaders, no recompiles, effects blend as before), and the
    // target stores the finished 8-bit colours, which the ink pass then reads and writes unchanged.
    rt.isXRRenderTarget=true;
    const U={tC:{value:rt.texture},tD:{value:rt.depthTexture},px:{value:new THREE.Vector2(1,1)},seed:{value:0},cn:{value:camera.near},cf:{value:camera.far},
      ink:{value:new THREE.Color("#2b2320")},on:{value:1}};
    const post=new THREE.ShaderMaterial({uniforms:U,depthTest:false,depthWrite:false,toneMapped:false,
      vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}",
      fragmentShader:`#include <packing>
uniform sampler2D tC,tD;uniform vec2 px;uniform float seed,cn,cf,on;uniform vec3 ink;varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float vz(vec2 uv){return -perspectiveDepthToViewZ(texture2D(tD,uv).x,cn,cf);}
float lu(vec2 uv){return dot(texture2D(tC,uv).rgb,vec3(0.2126,0.7152,0.0722));}
void main(){
  vec3 c=texture2D(tC,vUv).rgb;
  if(on>0.5){
    vec2 q=vUv/px;   // pixel coordinates
    vec2 w=(vec2(n(q*0.045+seed),n(q*0.045+seed+17.3))-0.5)*px*2.2;   // hand wobble, ~1 px
    vec2 uv=vUv+w,o=px*1.15;
    float z=vz(uv),zl=vz(uv-vec2(o.x,0.)),zr=vz(uv+vec2(o.x,0.)),zd=vz(uv-vec2(0.,o.y)),zu=vz(uv+vec2(0.,o.y));
    // second difference: flat or sloping surfaces give 0, silhouettes and folds give a spike
    float dz=(abs(zl+zr-2.0*z)+abs(zd+zu-2.0*z))/max(z,1.0);
    float sil=max(max(abs(zl-z),abs(zr-z)),max(abs(zd-z),abs(zu-z)))/max(z,1.0);
    float de=max(smoothstep(0.006,0.02,dz),smoothstep(0.03,0.08,sil));
    float l=lu(uv),dl=max(max(abs(lu(uv-vec2(o.x,0.))-l),abs(lu(uv+vec2(o.x,0.))-l)),max(abs(lu(uv-vec2(0.,o.y))-l),abs(lu(uv+vec2(0.,o.y))-l)));
    float ce=smoothstep(0.09,0.2,dl/(l+0.15))*0.6;
    float fade=1.0-smoothstep(480.0,950.0,z);   // far scenery keeps fewer lines, like a lighter pen
    float e=max(de,ce)*fade*(0.6+0.4*n(q*vec2(0.08,0.05)+seed*3.1));
    c=mix(c,ink,clamp(e,0.0,1.0)*0.9);
    float g=n(q*0.9)*0.55+n(q*0.23)*0.45;   // paper fibre over the whole sheet
    c*=0.965+0.06*g;
  }
  gl_FragColor=vec4(c,1.0);
}`});
    const qs=new THREE.Scene(),qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),post);quad.frustumCulled=false;qs.add(quad);
    const sz=new THREE.Vector2();let boilT=0;
    G3.paperInk=U;
    G3.paperRender=()=>{renderer.getDrawingBufferSize(sz);
      if(rt.width!==sz.x||rt.height!==sz.y){rt.setSize(sz.x,sz.y);U.px.value.set(1/sz.x,1/sz.y);}
      const now=performance.now();if(now-boilT>220){boilT=now;U.seed.value=(U.seed.value+3.7)%97;}   // line boil, ~4.5 redraws a second
      if(G3.paperDollTick)G3.paperDollTick(now);
      if(G3.styleU)G3.styleU.stDay.value=Math.max(0,Math.min(1,(hemi.intensity/(LEG*baseHemi)-0.35)/0.5));   // hatching fades out at night
      U.cn.value=camera.near;U.cf.value=camera.far;
      renderer.setRenderTarget(rt);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(qs,qc);};
    diag("paper ink pass on");
  
    /* paper effects: flames become layered torn-paper cut-outs and smoke/steam puffs become cotton-wool card clouds, each with
       an inked edge. Same particle system and textures, just redrawn, so no new draws or shaders. */
    {const rn=(()=>{let q=7;return()=>{q=(q*1664525+1013904223)>>>0;return q/4294967296;};})(),INK="#2b2320";
      const redo=(t,draw)=>{const c=t.image,x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);draw(x,c.width,c.height);t.needsUpdate=true;};
      // a teardrop flame tongue; three stacked (orange, yellow, cream) make one cut-paper flame
      const flame=(x,cx,by,w,h,col,ink)=>{x.beginPath();x.moveTo(cx,by-h);x.bezierCurveTo(cx+w*0.25,by-h*0.62,cx+w,by-h*0.42,cx+w*0.62,by-h*0.1);
        x.quadraticCurveTo(cx,by+h*0.06,cx-w*0.62,by-h*0.1);x.bezierCurveTo(cx-w,by-h*0.42,cx-w*0.25,by-h*0.62,cx,by-h);x.closePath();x.fillStyle=col;x.fill();
        if(ink){x.strokeStyle=INK;x.lineWidth=2.5;x.lineJoin="round";x.stroke();}};
      if(TX&&TX.flame)redo(TX.flame,(x,w,h)=>{flame(x,w/2,h*0.95,w*0.44,h*0.9,"#ee6328",true);flame(x,w/2,h*0.93,w*0.3,h*0.62,"#ffb43c",false);flame(x,w/2,h*0.92,w*0.15,h*0.34,"#fff0c6",false);});
      if(TX&&TX.puff)redo(TX.puff,(x,w)=>{const bl=[];for(let k=0;k<7;k++){const a=k/7*Math.PI*2;bl.push([w/2+Math.cos(a)*w*0.2,w/2+Math.sin(a)*w*0.16,w*(0.15+rn()*0.06)]);}bl.push([w/2,w/2,w*0.22]);
        x.lineWidth=5;x.strokeStyle="rgba(43,35,32,0.55)";bl.forEach(([a,b,r])=>{x.beginPath();x.arc(a,b,r,0,7);x.stroke();});
        x.fillStyle="#fbf8f1";bl.forEach(([a,b,r])=>{x.beginPath();x.arc(a,b,r,0,7);x.fill();});
        x.fillStyle="rgba(170,160,150,0.35)";bl.forEach(([a,b,r])=>{x.beginPath();x.arc(a+r*0.25,b+r*0.3,r*0.6,0,7);x.fill();});});}
  }
