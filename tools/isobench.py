"""v6.1 iso: frame-cost comparison for the fixed-view builds (works on main too).
Usage: python3 isobench.py <index.html> [phone] [--stopmo=off]
For each view (whole site, mid, close) it runs a season at 20 min/s for 8 s and reports, per second of play:
  frames drawn, main-scene renders, ms of JS per frame (whole rAF callback), ms in renderer.render for the main scene,
  draw calls and triangles per render. Desktop = 800x450 @1x; phone = 390x844 @2x touch."""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
args = [a for a in sys.argv[1:] if not a.startswith("--")]
fl = {a.split("=")[0]: a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--") and "=" in a}
html = pathlib.Path(args[0]).read_text(); phone = len(args) > 1 and args[1] == "phone"
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
init = INIT + ("" if fl.get("--stopmo") != "off" else "\ntry{localStorage.setItem('paper-mill-stopmo','off')}catch(e){}\n")
VIEWS = [("site", [-14, 5, 380]), ("mid", [10, 5, 190]), ("close", [-28, -6, 95])]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    UA = {"user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1"} if "--ios" in sys.argv else {}
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, **UA) if phone else b.new_context(viewport={"width": 800, "height": 450}, device_scale_factor=1)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(init); pg.goto("http://bench.local/"+fl.get("--q",""))
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("""()=>{const G=__PM.G3,R=G.renderer,r=R.render.bind(R);window.__IB={n:0,ms:0,calls:0,tris:0};
      R.render=(s,c)=>{const t=performance.now();r(s,c);__B.cur+=performance.now()-t;if(s===G.scene){const I=window.__IB;I.n++;I.ms+=performance.now()-t;I.calls+=R.info.render.calls;I.tris+=R.info.render.triangles;}};
      __PM.setFps('max');__PM.C.simSpeed=20;}""")
    out = {}
    if fl.get("--warm"): pg.evaluate("v=>{__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955]);}", VIEWS[0][1]); pg.wait_for_timeout(int(fl["--warm"]) * 1000)
    for name, v in VIEWS:
        pg.evaluate("v=>{__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955]);}", v)
        pg.wait_for_timeout(4000)
        pg.evaluate("()=>{const c=document.querySelector('#evc:not([hidden]) button');if(c)c.click();Object.assign(window.__IB,{n:0,ms:0,calls:0,tris:0});__B.frames=[];__B.rec=true;__B.cur=0;}")
        pg.wait_for_timeout(8000)
        r = pg.evaluate("()=>{__B.rec=false;const I=window.__IB,f=__B.frames;return {frames:f.length,js:f.length?f.reduce((a,b)=>a+b,0)/f.length:0,renders:I.n,renderMs:I.n?I.ms/I.n:0,calls:I.n?I.calls/I.n:0,tris:I.n?I.tris/I.n:0}}")
        out[name] = {k: round(x, 2) for k, x in r.items()}
        out[name]["renders_per_s"] = round(r["renders"] / 8, 1); out[name]["frames_per_s"] = round(r["frames"] / 8, 1)
        out[name]["js_ms_per_s"] = round(r["js"] * r["frames"] / 8, 1)
    print(json.dumps(out))
    print("errors:", errs[:4] or "none")
    b.close()
