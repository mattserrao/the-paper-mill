import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
out=sys.argv[2]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.on("console", lambda m: errs.append("console:"+m.text[:300]) if m.type in("error","warning") else None)
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?tilt=1")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>{__PM.G3.noFallback=true;document.getElementById('v2free').click()}"); pg.wait_for_timeout(3000)
    for v in [[-14,5,380],[10,-5,190],[20,-10,95]]:
        pg.evaluate("v=>__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955])",v)
        for on in [False,True]:
            pg.evaluate("on=>{__PM.G3.TS.on=on;__PM.G3.lastMove=performance.now();}",on); pg.wait_for_timeout(2500)
            pg.screenshot(path=f"{out}-{v[2]}-{'on' if on else 'off'}.jpg",type="jpeg",quality=85)
    print("TS",pg.evaluate("()=>({on:__PM.G3.TS.on,ms:__PM.G3.TS.ms})")); print("errors",errs[:5]); b.close()
