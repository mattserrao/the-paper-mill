"""three.js unreachable: the page must show the no-3D screen and raise no errors."""
import pathlib,sys
from playwright.sync_api import sync_playwright
src=open('bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text();errs=[]
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":800,"height":450})
    pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
    def route(r):
        u=r.request.url
        if u.startswith("http://bench.local/"): return r.fulfill(body=html,content_type="text/html")
        return r.abort()
    pg.route("**/*",route); pg.goto("http://bench.local/"); pg.wait_for_timeout(5000)
    shown=pg.evaluate("()=>{const e=document.getElementById('no3d');return !!e&&!e.hidden}")
    menu=pg.evaluate("()=>{const e=document.getElementById('v2menu');return !!e&&!e.hidden}")
    b.close()
print("no3d shown:",shown,"menu:",menu,"errors:",errs or "none")
