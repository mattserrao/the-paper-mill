import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.on("framenavigated", lambda f: print("NAV", f.url))
    pg.on("console", lambda m: m.type in ("error","warning") and print("CONSOLE", m.text[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{__PM.setFps('max');__PM.C.simSpeed=20;__PM.G3.camSet([10,5,190,-0.785,0.955]);}"); pg.wait_for_timeout(9000)
    print(pg.evaluate("""()=>new Promise(res=>{const G=__PM.G3,cam=G.camera,L=[];let n=0;requestAnimationFrame(function f(){const b=G.SM.bms[0];L.push([cam.position.x,cam.position.y,cam.position.z,cam.top,cam.quaternion.x,b&&b.perObjectFrustumCulled,G.SM.bms.length].map(v=>typeof v==='number'?+v.toFixed(6):v).join(','));if(++n<8)requestAnimationFrame(f);else res(L);});})"""))
    b.close()
