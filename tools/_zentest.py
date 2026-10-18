import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
out=sys.argv[2]; q=sys.argv[3] if len(sys.argv)>3 else ""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.on("console", lambda m: errs.append("console:"+m.text[:200]) if m.type=="error" else None)
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?"+q)
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2zen').click()")
    for k in range(int(sys.argv[4]) if len(sys.argv)>4 else 8):
        pg.wait_for_timeout(5000)
        info=pg.evaluate("()=>{const G=__PM.G3,c=G.diagScene().camera;return {iso:!!c.isIso,camR:G.camR|0,pos:[c.position.x|0,c.position.y|0,c.position.z|0],calls:G.diagScene().renderer.info.render.calls}}")
        print(k,json.dumps(info)); pg.screenshot(path=f"{out}-{k}.jpg",type="jpeg",quality=75)
    print("errors",errs[:4]); b.close()
