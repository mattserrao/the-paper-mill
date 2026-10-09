"""Average outcomes over N full seasons (sim only): checks that game balance is unchanged between builds.
Usage: balance.py index.html N [step]"""
import pathlib, sys, json, statistics as st
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text(); N = int(sys.argv[2]); STEP = sys.argv[3] if len(sys.argv) > 3 else "null"
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 480, "height": 320})
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=60000)
    pg.evaluate("()=>document.getElementById('v2go').click()")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=120000, polling=200); pg.wait_for_timeout(300)
    res = []
    for k in range(N):
        r = pg.evaluate("""([k,step])=>{const P=__PM;document.getElementById('v2season').click();P.setRunning(false);if(P.reseed)P.reseed(1000+k*7919);
            const S=P.S,h=step||P.SIM_STEP||0.5;let n=0;while(S.season&&S.season.on&&n<400000){P.step(h);n++;}
            const ov=document.getElementById('seasonOv');if(ov)ov.hidden=true;
            return {days:S.t/1440,cash:S.cash,inc:S.tot.incidents,breaks:S.tot.breaks,hay:S.tot.hayouts||0,tons:S.shipT||0};}""", [k, None if STEP == "null" else float(STEP)])
        res.append(r)
    b.close()
out = {k: (round(st.fmean(x[k] for x in res), 1), round(st.stdev(x[k] for x in res), 1)) for k in res[0]}
print(json.dumps({"build": sys.argv[1].split('/')[-2], "N": N, "step": STEP, "mean_sd": out}))
