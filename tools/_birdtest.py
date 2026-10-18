import pathlib, sys
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2free').click()"); pg.wait_for_timeout(4000)
    print("season", pg.evaluate("()=>JSON.stringify(__PM.S.season&&__PM.S.season.on)"), "menu hidden", pg.evaluate("()=>document.getElementById('v2menu').hidden"))
    pg.evaluate("()=>{const t=[...document.querySelectorAll('[data-tab]')].find(b=>b.dataset.tab==='chaos');t.click();}"); pg.wait_for_timeout(800)
    print("sheet open", pg.evaluate("()=>!!document.querySelector('.v2sheet.open')"))
    pg.evaluate("()=>document.getElementById('ev-birdline').click()"); pg.wait_for_timeout(1500)
    print("after click: sheet open", pg.evaluate("()=>!!document.querySelector('.v2sheet.open')"), "cineOn", pg.evaluate("()=>!!__PM.G3.cineOn"), "inc", pg.evaluate("()=>__PM.S.inc.map(i=>i.id)"))
    pg.wait_for_timeout(5000); pg.screenshot(path=sys.argv[2])
    print("errors", errs[:3]); b.close()
