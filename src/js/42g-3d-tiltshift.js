  /* ---- v6.1 t18 tilt-shift (experiment): the diorama look ----
     A real miniature photographed close up has a thin band in focus and blurs above and below it. The scene is drawn
     into an offscreen picture exactly as it would be drawn to the screen (tone mapping and colour output included: the
     target is flagged like a headset's so three.js treats it as the screen), a half-size copy is blurred in two
     separable passes whose reach grows with the distance from the band, and the two are mixed onto the screen with a
     touch more colour. The band sits across the middle of the view (where the camera looks); the blur is strongest at
     the whole-site zoom and softer close in. Settings > Graphics > Tilt-shift, ?tilt=0 / ?tilt=1. Off on the low tier
     by default (three extra passes). */
  {const TS=G3.TS={on:false,band:0.13,ramp:0.30,maxR:1.7,sat:1.1,ms:0};
    let pref=null;try{pref=localStorage.getItem("paper-mill-tilt");}catch(e){}
    {const q=new URLSearchParams(location.search).get("tilt");if(q!=null)pref=q==="0"?"off":"on";}
    TS.on=pref?pref==="on":!(G3.GFX&&(G3.GFX.tier==="low"||G3.GFX.tier==="bare"));
    G3.setTilt=on=>{TS.on=!!on;try{localStorage.setItem("paper-mill-tilt",on?"on":"off");}catch(e){}};
    let RT=null,RA=null,RB=null,W=0,H=0;const sz=new THREE.Vector2();
    const VS="varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}";
    const BL=new THREE.ShaderMaterial({uniforms:{src:{value:null},dir:{value:new THREE.Vector2(1,0)},px:{value:new THREE.Vector2()},fy:{value:0.5},band:{value:TS.band},ramp:{value:TS.ramp},r:{value:1}},
      vertexShader:VS,fragmentShader:`uniform sampler2D src;uniform vec2 dir;uniform vec2 px;uniform float fy;uniform float band;uniform float ramp;uniform float r;varying vec2 vUv;
        void main(){float k=smoothstep(band,band+ramp,abs(vUv.y-fy))*r;vec2 o=dir*px*k;
          vec4 c=texture2D(src,vUv)*0.2270;c+=(texture2D(src,vUv+o*1.3846)+texture2D(src,vUv-o*1.3846))*0.3162;c+=(texture2D(src,vUv+o*3.2308)+texture2D(src,vUv-o*3.2308))*0.0703;gl_FragColor=c;}`,
      depthTest:false,depthWrite:false,toneMapped:false});
    const CO=new THREE.ShaderMaterial({uniforms:{sharp:{value:null},blur:{value:null},fy:{value:0.5},band:{value:TS.band},ramp:{value:TS.ramp},sat:{value:TS.sat}},
      vertexShader:VS,fragmentShader:`uniform sampler2D sharp;uniform sampler2D blur;uniform float fy;uniform float band;uniform float ramp;uniform float sat;varying vec2 vUv;
        void main(){vec3 s=texture2D(sharp,vUv).rgb,b=texture2D(blur,vUv).rgb;float k=smoothstep(band*0.6,band+ramp*0.7,abs(vUv.y-fy));vec3 c=mix(s,b,k);
          float l=dot(c,vec3(0.299,0.587,0.114));gl_FragColor=vec4(clamp(mix(vec3(l),c,sat),0.0,1.0),1.0);}`,
      depthTest:false,depthWrite:false,toneMapped:false});
    const tri=new THREE.BufferGeometry();tri.setAttribute("position",new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));tri.setAttribute("uv",new THREE.Float32BufferAttribute([0,0,2,0,0,2],2));
    const quad=new THREE.Mesh(tri,BL);quad.frustumCulled=false;const qs=new THREE.Scene();qs.add(quad);const qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    function ensure(){renderer.getDrawingBufferSize(sz);if(RT&&sz.x===W&&sz.y===H)return;W=sz.x;H=sz.y;[RT,RA,RB].forEach(r=>r&&r.dispose());
      const aa=renderer.getContext().getContextAttributes().antialias&&renderer.capabilities.isWebGL2!==false;
      RT=new THREE.WebGLRenderTarget(W,H,{depthBuffer:true,stencilBuffer:true,samples:aa?4:0});RT.texture.colorSpace=THREE.SRGBColorSpace;RT.texture.internalFormat="RGBA8";RT.isXRRenderTarget=true;   // (drawn exactly as to the screen)
      const w2=Math.max(1,W>>1),h2=Math.max(1,H>>1);RA=new THREE.WebGLRenderTarget(w2,h2,{depthBuffer:false});RB=new THREE.WebGLRenderTarget(w2,h2,{depthBuffer:false});
      BL.uniforms.px.value.set(1/w2,1/h2);}
    const pass=(mat,to)=>{quad.material=mat;renderer.setRenderTarget(to);renderer.render(qs,qc);};
    // in place of renderer.render(scene,camera) (43-3d-frame.js): false if it didn't draw (off, or it failed and switched itself off)
    G3.tiltRender=()=>{if(!TS.on||G3.zenNoTilt)return false;const t0=performance.now();
      try{ensure();const R=G3.camR||190,zk=Math.max(0.45,Math.min(1,(R-60)/320));
        renderer.setRenderTarget(RT);renderer.render(scene,camera);
        BL.uniforms.r.value=TS.maxR*zk;BL.uniforms.src.value=RT.texture;BL.uniforms.dir.value.set(1,0);pass(BL,RA);
        BL.uniforms.src.value=RA.texture;BL.uniforms.dir.value.set(0,1);pass(BL,RB);
        BL.uniforms.r.value=TS.maxR*zk*2.2;BL.uniforms.src.value=RB.texture;BL.uniforms.dir.value.set(1,0);pass(BL,RA);
        BL.uniforms.src.value=RA.texture;BL.uniforms.dir.value.set(0,1);pass(BL,RB);
        CO.uniforms.sharp.value=RT.texture;CO.uniforms.blur.value=RB.texture;pass(CO,null);}
      catch(e){TS.on=false;renderer.setRenderTarget(null);console.error("tilt-shift failed, off",e);return false;}
      TS.ms=TS.ms*0.95+(performance.now()-t0)*0.05;return true;};}
