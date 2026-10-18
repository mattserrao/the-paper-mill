import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
PROBE="""()=>{const G=__PM.G3,{scene}=G.diagScene();const out={bms:[],big:[]};
 for(const b of (G.SM.bms||[]))out.bms.push([b.name||'',b._multiDrawCount,b.visible,b.perObjectFrustumCulled]);
 let n=0;scene.traverse(o=>{if((o.isMesh||o.isInstancedMesh)&&o.visible){n++;}});out.vis=n;
 out.sm=G.SM.stats?G.SM.stats():null;return out;}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560})
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2zen').click()") if len(sys.argv)<3 else (pg.evaluate("()=>document.getElementById('v2go').click()"),pick_leader(pg))
    pg.wait_for_timeout(8000)
    cam="()=>{const c=__PM.G3.diagScene().camera;return [c.position.toArray().map(v=>v|0),c.zoom,c.left|0,c.right|0,c.top|0,c.bottom|0,c.near,c.far,__PM.G3.cullN]}"
    print("cam",pg.evaluate(cam)); print(json.dumps(pg.evaluate(PROBE)["bms"][:3]))
    pg.evaluate("()=>{__PM.G3.cullAlways=true}"); pg.wait_for_timeout(1500); print("cullAlways",json.dumps(pg.evaluate(PROBE)["bms"][:3]),pg.evaluate(cam))
    b.close()
