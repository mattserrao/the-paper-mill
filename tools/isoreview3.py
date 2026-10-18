import pathlib, sys, json, collections
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1"
PROBE = r"""()=>new Promise(res=>{const G=__PM.G3,R=G.renderer,gl=R.getContext(),sc=G.scene;const out={tex:{},cb:[],attrs:{}};
 const texOwner=new Map();sc.traverse(o=>{const nm=(o.name||o.type)+(o.parent&&o.parent!==sc?'<'+(o.parent.name||o.parent.type):'');
   if(o.isBatchedMesh){texOwner.set(o._matricesTexture,'BM matrices '+nm);if(o._colorsTexture)texOwner.set(o._colorsTexture,'BM colors '+nm);if(o._indirectTexture)texOwner.set(o._indirectTexture,'BM indirect '+nm);}
   const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of ms)for(const k of ['map','alphaMap'])if(m[k])texOwner.set(m[k],'map of '+nm+' '+m.type);
   if(o.material&&o.material.uniforms)for(const u in o.material.uniforms){const v=o.material.uniforms[u].value;if(v&&v.isTexture)texOwner.set(v,'uniform '+u+' of '+nm);}});
 const ver=new Map();for(const t of texOwner.keys())ver.set(t,t.version);
 const av=new Map();sc.traverse(o=>{const g=o.geometry;if(!g)return;for(const k in g.attributes){let pp=o.parent,ch=[];for(let q=0;q<3&&pp;q++,pp=pp.parent)ch.push((pp.name||pp.type)+(Object.keys(pp.userData||{}).slice(0,3).join('+')));av.set(g.attributes[k],[(o.name||o.type)+'.'+k+' ['+g.type+' v'+g.attributes[k].count+' '+(o.material&&o.material.type)+'] <'+ch.join('<'),g.attributes[k].version]);}if(o.isInstancedMesh){av.set(o.instanceMatrix,[(o.name||'inst')+'.instanceMatrix',o.instanceMatrix.version]);if(o.instanceColor)av.set(o.instanceColor,[(o.name||'inst')+'.instanceColor',o.instanceColor.version]);}});
 const cb=gl.createBuffer.bind(gl);gl.createBuffer=()=>{out.cb.push(new Error().stack.split('\n').slice(2,14).map(s=>s.trim()).join(' | '));return cb();};
 let n=0;G.lastMove=performance.now();requestAnimationFrame(function f(){
   for(const [t,v] of ver){if(t.version!==v){const k=texOwner.get(t);out.tex[k]=(out.tex[k]||0)+1;ver.set(t,t.version);}}
   for(const [a,x] of av){if(a.version!==x[1]){out.attrs[x[0]]=(out.attrs[x[0]]||0)+1;x[1]=a.version;}}
   if(++n<31)requestAnimationFrame(f);else{gl.createBuffer=cb;
     const nb={};sc.traverse(o=>{const g=o.geometry;if(!g)return;for(const k in g.attributes){if(!av.has(g.attributes[k])){let pp=o.parent,ch=[];for(let q=0;q<4&&pp;q++,pp=pp.parent)ch.push((pp.name||pp.type)+'{'+Object.keys(pp.userData||{}).slice(0,4).join('+')+'}');const kk=(o.name||o.type)+'.'+k+' ['+g.type+' v'+g.attributes[k].count+' '+(o.material&&(o.material.type+' #'+(o.material.color?o.material.color.getHexString():'')))+'] <'+ch.join('<');nb[kk]=(nb[kk]||0)+1;}}});out.newAttrs=nb;res(out);}});})"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{__PM.setFps('max');__PM.C.simSpeed=20;}")
    pg.evaluate("v=>{__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955]);}", [10, 5, 190]); pg.wait_for_timeout(15000)
    c0 = pg.evaluate("()=>[__PM.G3.cullN||0,__PM.G3.renderer.info.render.frame,__PM.G3.renderer.shadowMap.needsUpdate,__PM.G3.renderer.shadowMap.enabled]")
    r = pg.evaluate(PROBE)
    print("cull", c0, pg.evaluate("()=>[__PM.G3.cullN||0,__PM.G3.renderer.info.render.frame]"))
    b.close()
print("textures updated (over 30 frames):"); [print(f"  {n:3d} {k}") for k, n in sorted(r["tex"].items(), key=lambda x: -x[1])[:20]]
print("attributes updated:"); [print(f"  {n:3d} {k}") for k, n in sorted(r["attrs"].items(), key=lambda x: -x[1])[:25]]
print("new attributes after 30 frames:"); [print("  ",n,k) for k,n in r["newAttrs"].items() if k.split(".")[1].startswith("position")]
print("createBuffer:", len(r["cb"])); 
c = collections.Counter(r["cb"]); [print(f"  {n:3d} {k[:600]}") for k, n in c.most_common(4)]
print("errors", errs[:3])
