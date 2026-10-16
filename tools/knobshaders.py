"""v5.6: turning on the fiddly knobs view, opening a knob and the DCS must not compile any shader mid-play
(the start-up precompile covers them). Usage: python3 knobshaders.py <index.html>"""
import pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 800, "height": 500}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?nosave")
    pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.wait_for_timeout(3000)
    n0 = pg.evaluate("()=>__PM.G3.diagScene().renderer.info.programs.length")
    pg.evaluate("()=>{__PM.G3.setKnobView(true);__PM.knob.set('osc',0);__PM.knob.set('vac',10)}"); pg.wait_for_timeout(2500)
    pg.evaluate("()=>__PM.G3.camSet([40,10,60,-0.2,0.9,0])"); pg.wait_for_timeout(1500)
    pg.evaluate("()=>{__PM.G3.setKnobView(false);__PM.knob.panel('pulp')}"); pg.wait_for_timeout(1000)
    pg.evaluate("()=>{__PM.knob.open('WET','dcs')}"); pg.wait_for_timeout(1000)
    n1 = pg.evaluate("()=>__PM.G3.diagScene().renderer.info.programs.length")
    b.close()
print("programs after start-up:", n0, "after the knob view, panel and DCS:", n1, "errors:", errs)
print("RESULT:", "OK" if n1 <= n0 and not errs else "FAIL (late shader compiles)")
