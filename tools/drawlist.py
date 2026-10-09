"""Main-pass draws actually submitted in one frame, by category (frustum culling included). Usage: drawlist.py index.html [phone]"""
import pathlib,sys,json,collections
from playwright.sync_api import sync_playwright
src=open('bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text();phone=len(sys.argv)>2
if "window.__PM=" not in html:
    i=html.rindex("})();",0,html.rindex("</script>")); html=html[:i]+HOOK+html[i:]
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True) if phone else b.new_context(viewport={"width":800,"height":450})
    pg=ctx.new_page();pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.SM||__PM.G3.SM.done)",timeout=120000,polling=300)
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;}")
    pg.wait_for_timeout(40000)
    r=pg.evaluate("""async()=>{const G=__PM.G3,sc=G.scene,SM=G.SM,T=__PM.THREE;if(G.DB)G.DB.t=1e15;const cnt={},ex={};const hooks=[];
      const top=o=>{let x=o;while(x.parent&&x.parent!==sc)x=x.parent;return x;};
      const cat=o=>{const m=Array.isArray(o.material)?o.material[0]:o.material;if(o.name==="moving batch")return"moving batch";if(o.isBatchedMesh)return"scenery batch";if(o.userData.smBatch)return"baked batch";
        if(o.isInstancedMesh)return"instanced";if(o.isLine)return"line";if(o.isSprite)return"sprite";if(Array.isArray(o.material))return"multi-material";if(m.transparent)return"transparent";
        if(m.isShaderMaterial)return"shader";return"single opaque mesh";};
      sc.traverse(o=>{if(!(o.isMesh||o.isLine||o.isSprite||o.isPoints))return;const c=cat(o),t=top(o),l=(t.name||t.type)+"{"+Object.keys(t.userData||{}).slice(0,2).join(",")+"}";
        const prev=o.onBeforeRender;hooks.push([o,prev]);o.onBeforeRender=function(...a){cnt[c]=(cnt[c]||0)+1;(ex[c]=ex[c]||{})[l]=(ex[c][l]||0)+1;return prev.apply(this,a);};});
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const snap=JSON.parse(JSON.stringify([cnt,ex]));
      hooks.forEach(([o,p])=>o.onBeforeRender=p);return snap;}""")
    b.close()
cnt,ex=r; tot=sum(cnt.values())
print("main-pass draws in 2 frames (incl. per-group draws counted once per object):",tot)
for k,v in sorted(cnt.items(),key=lambda x:-x[1]): print(f"{v:5} {k}  ", sorted(ex[k].items(),key=lambda x:-x[1])[:4])
