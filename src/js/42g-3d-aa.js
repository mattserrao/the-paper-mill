  /* ---- v6.14 anti-aliasing: the FXAA post pass (the setting is read in 20-3d-setup) ----
     With FXAA on, the scene renders into an off-screen target that three.js treats like the canvas (the XR flag: each
     material's own tone mapping, toneMapped:false kept, and sRGB output, so the picture in it is exactly the screen's), and
     a full-screen triangle copies it to the canvas through FXAA (the console variant: 4 corner taps for the edge
     direction, 2-4 taps along it). Nothing else changes: the off-screen passes (shadows, cut-outs, the whole-site picture) run as
     before. One extra full-screen pass; the target follows the drawing buffer's size. */
  {const aaOn=()=>G3.aaPick==="fxaa"||(G3.aaPick==="auto"&&!G3.aaDesk);
   let rt=null;const sz=new THREE.Vector2();
   const mat=new THREE.ShaderMaterial({uniforms:{tDiffuse:{value:null},res:{value:new THREE.Vector2(1,1)}},depthTest:false,depthWrite:false,toneMapped:false,
     vertexShader:"varying vec2 vUv;void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,0.0,1.0);}",
     fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 res;varying vec2 vUv;
      vec3 tx(vec2 u){return texture2D(tDiffuse,u).rgb;}
      float lu(vec3 c){return dot(c,vec3(0.299,0.587,0.114));}
      void main(){vec2 px=1.0/res;vec3 nw=tx(vUv+vec2(-1.0,-1.0)*px),ne=tx(vUv+vec2(1.0,-1.0)*px),sw=tx(vUv+vec2(-1.0,1.0)*px),se=tx(vUv+vec2(1.0,1.0)*px),m=tx(vUv);
        float lnw=lu(nw),lne=lu(ne),lsw=lu(sw),lse=lu(se),lm=lu(m);
        float lmin=min(lm,min(min(lnw,lne),min(lsw,lse))),lmax=max(lm,max(max(lnw,lne),max(lsw,lse)));
        vec2 d=vec2(-((lnw+lne)-(lsw+lse)),(lnw+lsw)-(lne+lse));
        float red=max((lnw+lne+lsw+lse)*0.03125,0.0078125),rc=1.0/(min(abs(d.x),abs(d.y))+red);
        d=clamp(d*rc,vec2(-8.0),vec2(8.0))*px;
        vec3 a=0.5*(tx(vUv+d*(1.0/3.0-0.5))+tx(vUv+d*(2.0/3.0-0.5)));
        vec3 b=a*0.5+0.25*(tx(vUv-d*0.5)+tx(vUv+d*0.5));
        float lb=lu(b);gl_FragColor=vec4((lb<lmin||lb>lmax)?a:b,1.0);
      }`});
   const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
   const quad=new THREE.Mesh(g,mat);quad.frustumCulled=false;const qs=new THREE.Scene();qs.add(quad);const qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
   G3.aaPost=(sc,cam)=>{if(!aaOn())return false;renderer.getDrawingBufferSize(sz);const w=Math.max(1,sz.x|0),h=Math.max(1,sz.y|0);
     if(!rt){rt=new THREE.WebGLRenderTarget(w,h,{type:THREE.UnsignedByteType,colorSpace:THREE.SRGBColorSpace,depthBuffer:true,stencilBuffer:true,generateMipmaps:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});rt.isXRRenderTarget=true;mat.uniforms.tDiffuse.value=rt.texture;}
     if(rt.width!==w||rt.height!==h)rt.setSize(w,h);mat.uniforms.res.value.set(w,h);
     const r0=renderer.getRenderTarget(),ar=renderer.info.autoReset;renderer.setRenderTarget(rt);renderer.render(sc,cam);renderer.setRenderTarget(r0);renderer.info.autoReset=false;renderer.render(qs,qc);renderer.info.autoReset=ar;return true;};   // (the frame's counts keep the scene's draws, plus the one for the pass)
   G3.aaInfo=()=>({pick:G3.aaPick,ctx:renderer.getContext().getContextAttributes().antialias,post:aaOn()});
   // the setting: FXAA is live; to or from MSAA (the context's own) needs a reload
   G3.setAA=p=>{if(!["auto","off","fxaa","msaa"].includes(p))return;G3.aaPick=p;try{localStorage.setItem("paper-mill-aa",p);}catch(e){}
     const want=p==="msaa"||(p==="auto"&&G3.aaDesk);G3.aaReload=want!==G3.aaCtx;if(!aaOn()&&rt){rt.dispose();rt=null;}
     diag(`anti-aliasing: ${p}${G3.aaReload?" (reload to apply)":""}`);
     document.querySelectorAll("button[data-aa]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.aa===p)));
     document.querySelectorAll("[data-aarl]").forEach(b=>b.hidden=!G3.aaReload);};}
