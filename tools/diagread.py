import pathlib,sys
from playwright.sync_api import sync_playwright
src=open('bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text()
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=ctx.new_page();pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=180000,polling=300)
    pg.evaluate("()=>{document.getElementById('v2go').click()}");pg.wait_for_timeout(20000)
    pg.evaluate("()=>window.__openDiag()");pg.wait_for_timeout(300)
    t=pg.evaluate("()=>document.getElementById('diagTxt').textContent");b.close()
print("\n".join(t.split("\n")[:14]))
