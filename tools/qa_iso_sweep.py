"""v6.1 iso targeted sweep: zoom steps, cutaway modes, seasons, night, dye trouble, colour changes mid-play, LOD on/off.
Usage: python3 qa_iso_sweep.py index.html outdir [env]"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
exec(open(pathlib.Path(__file__).parent / "qa_v61.py").read().split("ISO_CHECK = ")[1].split("def live")[0].join(["ISO_CHECK = ", ""]) if False else "")
html = pathlib.Path(sys.argv[1]).read_text(); out = sys.argv[2]; env = sys.argv[3] if len(sys.argv) > 3 else "rural"
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
q = open(pathlib.Path(__file__).parent / "qa_v61.py").read(); ISO_CHECK = q.split('ISO_CHECK = r"""')[1].split('"""')[0]
res = {}; errs = []
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 900, "height": 640})
    pg.on("pageerror", lambda e: errs.append(str(e)[:200])); pg.on("console", lambda m: m.type == "error" and "Failed to load" not in m.text and errs.append(m.text[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto(f"http://bench.local/?env={env}")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.wait_for_timeout(12000)
    def shot(name, cam=None, wait=2500):
        if cam: pg.evaluate("v=>{__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955]);}", cam)
        pg.wait_for_timeout(wait); pg.evaluate("()=>{const c=document.querySelector('#evc:not([hidden]) button');if(c)c.click();}")
        pg.screenshot(path=f"{out}/{name}.jpg", type="jpeg", quality=70)
        r = pg.evaluate(ISO_CHECK); res[name] = r; return r
    # 1. zoom steps
    for k in [1, 2, 3, 4, 6, 8, 12]: shot(f"zoom{k}", [10, 5, 760 / k])
    # 2. cutaway modes at mid zoom
    for m in ["on", "off", "auto"]:
        pg.evaluate("m=>__PM.G3.setCutaway(m)", m); shot(f"cut-{m}", [10, 5, 190])
    # 3. seasons and night
    for p in range(4):
        pg.evaluate("p=>{__PM.S.pal=p;}", p); shot(f"season{p}", [-14, 5, 380], 9000)
    pg.evaluate("()=>{const S=__PM.S;S.t=Math.floor(S.t/1440)*1440+17*60;}"); shot("night", [10, 5, 190], 4000)
    pg.evaluate("()=>{const S=__PM.S;S.t=Math.floor(S.t/1440)*1440+7*60+1440;}")
    # 4. dye trouble on the reel and sheet
    pg.evaluate("()=>{__PM.S.M.offSpec=true;}"); shot("dye", [-12, 4, 63], 3000); pg.evaluate("()=>{__PM.S.M.offSpec=false;}")
    # 5. colour changes mid-play: new paper colour, new brand
    pg.evaluate("()=>{document.querySelector('#paperColor button[data-c=\"white\"]')&&document.querySelector('#paperColor button[data-c=\"white\"]').click();}")
    shot("paper-white", [-14, 5, 253], 3500)
    pg.evaluate("()=>{rollMill&&rollMill();}") if False else pg.evaluate("()=>{try{document.documentElement.style.setProperty('--brand','#e03131');__PM.bumpPal&&__PM.bumpPal();}catch(e){}}")
    # 6. LOD off vs on at the whole-site step
    shot("lod-on", [-14, 5, 760], 3000); pg.evaluate("()=>{__PM.G3.lodOff=true;__PM.G3.lodSet(-2);}"); shot("lod-off", None, 2000); pg.evaluate("()=>{__PM.G3.lodOff=false;__PM.G3.lodSet(-3);}")
    # 7. follow Uncle Brian for a few seconds
    pg.evaluate("()=>{__PM.G3.follow&&__PM.G3.follow(true);}"); shot("follow", None, 5000); pg.evaluate("()=>{__PM.G3.follow&&__PM.G3.follow(false);}")
    b.close()
json.dump({"res": res, "errs": errs}, open(f"{out}/sweep.json", "w"))
for k, r in res.items(): print(k, r["iss"], {x: r["o"].get(x) for x in ("calls", "tris", "lod", "camR", "colLag", "colLagM")})
print("errors", errs[:5])
