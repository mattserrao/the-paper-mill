"""Top-down map of the whole site (orthographic), for checking layouts and clipping.
Usage: python3 topview.py index.html out.png [query] [--half=W] [--persp]
query is appended to the page URL (e.g. "?env=desert&layout=1234"). --half sets the half-width in metres (default 230)."""
import pathlib, sys, base64
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
args = [a for a in sys.argv[1:] if not a.startswith("--")]
fl = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:] if a.startswith("--")}
path, out = args[0], args[1]; q = args[2] if len(args) > 2 else ""
half = float(fl.get("--half", 230))
html = pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1400, "height": 1000}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:300]))
    base = route_for(html)
    pg.route("**/*", lambda r: r.fulfill(body=html, content_type="text/html") if r.request.url.startswith("http://bench.local/") else base(r))
    pg.add_init_script(INIT); pg.goto("http://bench.local/" + q)
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>{document.getElementById('v2go').click();}"); pg.wait_for_timeout(4000)
    url = pg.evaluate("""([half,persp])=>{__PM.setRunning(false);const D=__PM.G3.diagScene(),T=__PM.THREE,R=D.renderer;const W=R.domElement.width,H=R.domElement.height,a=W/H;
      let cam;if(persp){cam=new T.PerspectiveCamera(30,a,1,3000);cam.position.set(-160,170,220);cam.lookAt(0,0,0);}
      else{cam=new T.OrthographicCamera(-half,half,half/a,-half/a,1,2000);cam.position.set(0,600,0);cam.up.set(0,0,-1);cam.lookAt(0,0,0);}
      R.shadowMap.needsUpdate=true;R.render(D.scene,cam);return R.domElement.toDataURL('image/png');}""", [half, bool(fl.get("--persp"))])
    pathlib.Path(out).write_bytes(base64.b64decode(url.split(",", 1)[1]))
    b.close()
print("saved", out, "errors:", errs[:5])
