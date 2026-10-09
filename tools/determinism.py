"""Two independent loads of the same season week must play out identically (same upsets, breaks, hayouts, cash)."""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
def run(seed_math):
    init = INIT.replace("let s=123456789", f"let s={seed_math}")   # different cosmetic randomness each load
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        pg = b.new_page(viewport={"width": 640, "height": 400})
        pg.route("**/*", route_for(html)); pg.add_init_script(init); pg.goto("http://bench.local/")
        pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=60000)
        pg.evaluate("()=>document.getElementById('v2go').click()")
        pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=120000, polling=200); pg.wait_for_timeout(300)
        r = pg.evaluate("""()=>{const P=__PM,S=P.S,h=P.SIM_STEP||0.5;P.setRunning(false);const log=[];let seen=0;
            while(S.t<9*1440-1e-9){P.step(h);if(S.tot.incidents>seen){seen=S.tot.incidents;log.push(Math.round(S.t)+":"+S.inc.map(x=>x.id).join("+"));}}
            return {t:S.t,cash:Math.round(S.cash),inc:S.tot.incidents,breaks:S.tot.breaks,hay:S.tot.hayouts||0,first:log.slice(0,8)};}""")
        b.close(); return r
a, b2 = run(111), run(987654)
print(json.dumps(a)); print(json.dumps(b2)); print("DETERMINISTIC" if a == b2 else "DIFFERENT")
