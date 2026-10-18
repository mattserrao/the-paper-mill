import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
out=sys.argv[2]
P="""()=>{const G=__PM.G3,{scene,camera,renderer}=G.diagScene();const b=G.SM.bms[0];let sc=0,scv=0;scene.traverse(o=>{if(o.name&&o.name.startsWith('scenery')){sc++;if(o.visible)scv++;}});
 return {t:performance.now()|0,r:G.camR|0,pos:camera.position.toArray().map(v=>v|0),lr:[camera.left|0,camera.top|0],b0:b._multiDrawCount,cullN:G.cullN,calls:renderer.info.render.calls,sc,scv,pg:G.SM.pg?G.SM.pg.size:null,lod:G.lodNow}}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560})
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?"+(sys.argv[3] if len(sys.argv)>3 else ""))
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>{__PM.G3.noFallback=true;document.getElementById('v2zen').click()}")
    for k in range(16):
        pg.wait_for_timeout(2500); print(json.dumps(pg.evaluate(P))); pg.screenshot(path=f"{out}-{k}.jpg",type="jpeg",quality=70)
    b.close()
