"""Performance audit: machine-independent counts plus a per-section CPU split.
Usage: python3 audit.py <index.html> [phone]
Desktop = 800x450 @1x; phone = 390x844 @2x, touch, coarse pointer (the game's phone path)."""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])

AUDIT = r"""async()=>{
const P=__PM,THREE=P.THREE,G=P.G3,R=G.renderer,sc=G.scene,gl=R.getContext(),out={};
const frame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
let cam=null;sc.traverse(o=>{});const D=G.diagScene?G.diagScene():null;cam=D&&D.camera;
// --- scene graph
let nodes=0,auto=0,hiddenLayer=0,meshes=0,draws=0;const byMat={},casters=[],transp=[];
sc.traverse(o=>{nodes++;if(o.matrixAutoUpdate)auto++;if(o.layers.mask!==1&&(o.isMesh||o.isLine))hiddenLayer++;});
sc.traverseVisible(o=>{if(!(o.isMesh||o.isLine||o.isSprite||o.isPoints))return;if(o.layers.mask!==1)return;draws++;
  const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{byMat[m.type]=(byMat[m.type]||0)+1;if(m.transparent)transp.push(o);});
  if(o.castShadow)casters.push(o);});
out.scene={nodes,matrixAutoUpdate:auto,hiddenOriginalsStillInGraph:hiddenLayer,visibleDrawables:draws,byMaterial:byMat,
  shadowCasters:casters.length,transparentDrawables:transp.length,lights:(()=>{const L=[];sc.traverse(o=>{if(o.isLight)L.push(o.type+(o.castShadow?"(shadow "+o.shadow.mapSize.x+")":"")+(o.intensity?"":"(off)"));});return L;})()};
// --- passes: draws and triangles in the main pass vs the shadow pass
let gd=0;const wrapGL=(k)=>{const f=gl[k].bind(gl);gl[k]=(...a)=>{gd++;return f(...a);};return()=>gl[k]=f;};
const un=["drawElements","drawArrays","drawElementsInstanced","drawArraysInstanced"].map(wrapGL);
const md=gl.getExtension("WEBGL_multi_draw");const unm=[];if(md){["multiDrawElementsWEBGL","multiDrawArraysWEBGL"].forEach(k=>{const f=md[k];md[k]=function(...a){gd++;return f.apply(this,a);};unm.push(()=>md[k]=f);});}
const SM=R.shadowMap,orig=SM.render.bind(SM);let shD=0,shT=0,shRuns=0;
SM.render=(...a)=>{const d0=gd,t0=R.info.render.triangles;const will=SM.enabled&&(SM.autoUpdate||SM.needsUpdate);orig(...a);if(will){shRuns++;shD+=gd-d0;shT+=R.info.render.triangles-t0;}};
let tot=0,tris=0,fr=0;const t0=performance.now();
while(performance.now()-t0<3000){const g0=gd;await frame();tot+=gd-g0;tris+=R.info.render.triangles;fr++;}
// shadow pass cost with shadows forced on for one refresh (the game turns them off on slow devices)
let shOnD=0,shOnT=0;{const se=SM.enabled;SM.enabled=true;SM.needsUpdate=true;const d0=gd;let inD=0,inT=0;const o2=SM.render;
  SM.render=(...a)=>{const a0=gd,t0=R.info.render.triangles;orig(...a);inD+=gd-a0;inT+=R.info.render.triangles-t0;};await frame();SM.render=o2;shOnD=inD;shOnT=inT;SM.enabled=se;}
SM.render=orig;un.forEach(u=>u());unm.forEach(u=>u());
out.passes={frames:fr,glDrawsPerFrame:Math.round(tot/fr),shadowRefreshesPerSec:+(shRuns/3).toFixed(1),shadowDrawsPerRefresh:shRuns?Math.round(shD/shRuns):0,
  shadowTrisPerRefresh:shRuns?Math.round(shT/shRuns):0,mainDrawsPerFrame:Math.round((tot-shD)/fr),trianglesPerFrameReported:Math.round(tris/fr),
  shadowEnabled:SM.enabled,shadowDrawsWhenOn:shOnD,shadowTrisWhenOn:shOnT,shadowType:SM.type,pixelRatio:R.getPixelRatio(),drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],
  antialias:gl.getContextAttributes().antialias,programs:R.info.programs.length};
// --- overdraw: how many surfaces cover each pixel (no depth rejection), all meshes vs transparent only
if(cam){const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight,rt=new THREE.WebGLRenderTarget(W,H);const ov=new THREE.MeshBasicMaterial({color:0x010101,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,transparent:true});
  const hid=[];sc.traverse(o=>{const g=o.geometry,bad=g&&g.attributes&&Object.values(g.attributes).some(v=>!v);if((o.isSprite||bad||(o.material&&o.material.isShaderMaterial))&&o.visible){hid.push(o);o.visible=false;}});
  const bg=sc.background,fog=sc.fog;sc.background=null;sc.fog=null;const se=SM.enabled;SM.enabled=false;
  const measure=()=>{R.setRenderTarget(rt);R.setClearColor(0,0);R.clear();sc.overrideMaterial=ov;
    for(let k=0;k<50;k++){try{R.render(sc,cam);break;}catch(e){let culprit=null;sc.traverseVisible(o=>{if(!culprit&&o.isInstancedMesh){culprit=o;}});if(!culprit)break;culprit.visible=false;hid.push(culprit);R.clear();}}sc.overrideMaterial=null;
    const px=new Uint8Array(W*H*4);R.readRenderTargetPixels(rt,0,0,W,H,px);R.setRenderTarget(null);let s=0,cov=0,hi=0;for(let i=0;i<px.length;i+=4){const v=px[i];s+=v;if(v)cov++;if(v>=4)hi++;}
    return {avgLayers:+(s/(W*H)).toFixed(2),coveredPct:+(100*cov/(W*H)).toFixed(1),pct4plus:+(100*hi/(W*H)).toFixed(1)};};
  const all=measure();const op=[];sc.traverseVisible(o=>{if((o.isMesh||o.isLine)&&o.material&&!(Array.isArray(o.material)?o.material.some(m=>m.transparent):o.material.transparent)){op.push(o);o.visible=false;}});
  const tr=measure();op.forEach(o=>o.visible=true);hid.forEach(o=>o.visible=true);sc.background=bg;sc.fog=fog;SM.enabled=se;rt.dispose();ov.dispose();
  out.overdraw={allSurfaces:all,transparentOnly:tr};}
// --- textures: estimated GPU bytes
{const seen=new Set();let bytes=0,n=0,big=[];const add=t=>{if(!t||seen.has(t))return;seen.add(t);const im=t.image;if(!im)return;const w=im.width||0,h=im.height||0;const b=w*h*4*(t.generateMipmaps!==false&&!t.isDataTexture?1.33:1);bytes+=b;n++;if(b>1e6)big.push([w,h]);};
  sc.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{for(const k in m){const v=m[k];if(v&&v.isTexture)add(v);}if(m.uniforms)for(const k in m.uniforms){const v=m.uniforms[k].value;if(v&&v.isTexture)add(v);}});
    if(o.isBatchedMesh){["_matricesTexture","_indirectTexture","_colorsTexture"].forEach(k=>add(o[k]));}});
  const sm=SM.enabled?1024*1024*4:0;out.textures={count:n,estMB:+((bytes+sm)/1e6).toFixed(1),over1MB:big};}
// --- CPU: per-section JS (game profiler), scene matrix update, allocation rate
{const PF=G.PF;PF.acc={};PF.frames=0;PF.gaps=[];PF.js=[];PF.on=true;await new Promise(r=>setTimeout(r,4000));PF.on=false;const n=Math.max(1,PF.frames);
  out.cpuSections=Object.fromEntries(Object.entries(PF.acc).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>[k,+(v/n).toFixed(2)]));}
{const t=performance.now();for(let i=0;i<20;i++)sc.updateMatrixWorld(true);out.updateMatrixWorldMs=+((performance.now()-t)/20).toFixed(2);}
if(performance.memory){const m=[];const t1=performance.now();let gcs=0,last=performance.memory.usedJSHeapSize,grow=0;
  while(performance.now()-t1<5000){await frame();const u=performance.memory.usedJSHeapSize;if(u<last-2e5)gcs++;else grow+=Math.max(0,u-last);last=u;}
  out.alloc={MBperSec:+(grow/5/1e6).toFixed(2),gcPer5s:gcs};}
// --- DOM / compositor
{const lbl=[...document.querySelectorAll(".lbl")].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=="hidden");
  const blur=[...document.querySelectorAll("body *")].filter(e=>{if(!e.getClientRects().length)return false;const cs=getComputedStyle(e);const b=cs.backdropFilter||cs.webkitBackdropFilter;return b&&b!=="none";});
  let writes=0;const mo=new MutationObserver(l=>writes+=l.length);mo.observe(document.body,{attributes:true,attributeFilter:["style","class","hidden"],subtree:true,childList:true,characterData:true});
  await new Promise(r=>setTimeout(r,2000));mo.disconnect();
  out.dom={visibleLabels:lbl.length,elementsWithBackdropBlur:blur.length,blurOn:[...new Set(blur.map(e=>e.className.split(" ")[0]||e.id))].slice(0,12),domMutationsPerSec:Math.round(writes/2),totalElements:document.getElementsByTagName("*").length};}
return out;}"""

path = sys.argv[1]; phone = len(sys.argv) > 2 and sys.argv[2] == "phone"
html = pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-precise-memory-info"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True) if phone else b.new_context(viewport={"width": 800, "height": 450})
    pg = ctx.new_page(); pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.SM||__PM.G3.SM.done)", timeout=120000, polling=500)
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;}")
    pg.wait_for_timeout(30000)
    res = pg.evaluate(AUDIT)
    b.close()
print(json.dumps({"build": path.split("/")[-2] + "/" + path.split("/")[-1], "device": "phone" if phone else "desktop", **res}, indent=1))
