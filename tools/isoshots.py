"""v6.1 iso: screenshots of the fixed isometric view, for checking the look.
Usage: python3 isoshots.py index.html out_prefix [env] [shots]
  env: rural | urban | desert | swamp (default rural)
  shots: semicolon list of name=x,z,r[,hour[,season 0-3]] (default: a whole-site, a wet-end close-up and a dusk shot)
Writes out_prefix-<env>-<name>.png and prints page errors and the frame stats the game recorded."""
import pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
path, pre = sys.argv[1], sys.argv[2]
env = sys.argv[3] if len(sys.argv) > 3 else "rural"
DEF = "site=-14,5,380,13;wet=40,9,95,10;dusk=-14,5,253,19.4;night=10,0,190,23"
shots = [s.split("=") for s in (sys.argv[4] if len(sys.argv) > 4 else DEF).split(";")]
html = pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
errs = []
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1100, "height": 700})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
    pg.goto(f"http://bench.local/?env={env}")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.wait_for_timeout(1500)
    pg.evaluate("()=>{document.querySelectorAll('.evcard button, #evCard button').forEach(b=>{});__PM.C.simSpeed=1;}")
    for name, spec in shots:
        v = [float(x) for x in spec.split(",")]
        hr = v[3] if len(v) > 3 else 13
        pal = v[4] if len(v) > 4 else -1
        pg.evaluate("""([x,z,r,hr,pal])=>{const S=__PM.S;S.t=Math.floor(S.t/1440)*1440+((hr-6+24)%24)*60;if(pal>=0)S.pal=pal;__PM.G3.camSet([x,z,r,-0.785,0.955]);}""", v[:3] + [hr, pal])
        pg.wait_for_timeout(2500)
        # close any card that popped up over the view
        pg.evaluate("()=>{const o=document.querySelector('#evc:not([hidden]) button');if(o)o.click();}")
        pg.screenshot(path=f"{pre}-{env}-{name}.png")
    st = pg.evaluate("()=>{const I=__PM.G3.renderer.info;return {calls:I.render.calls,tris:I.render.triangles,progs:(I.programs||[]).length,cut:__PM.G3.CUT?__PM.G3.CUT.stats():null}}")
    print(st)
    b.close()
print("errors:", errs[:8] if errs else "none")
