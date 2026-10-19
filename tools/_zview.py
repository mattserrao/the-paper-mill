import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
out=sys.argv[2]; q=sys.argv[3] if len(sys.argv)>3 else ""
VIEWS=json.loads(sys.argv[4]) if len(sys.argv)>4 else [[-20,0,-40,140,2.6,0.85]]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 390, "height": 760},device_scale_factor=2)
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?zenstay&"+q)
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>{__PM.G3.noFallback=true;document.getElementById('v2zen').click()}")
    pg.wait_for_timeout(3000)
    for k,v in enumerate(VIEWS):
        pg.evaluate("v=>{const Z=__PM.G3.zenS;Z.len=1e9;Z.t=0;Z.dis=1e9;document.body.dataset.zs='none';Z.mv={t:0,st:null,m:{name:'probe',at:()=>v}};}", v)
        pg.wait_for_timeout(3500); pg.screenshot(path=f"{out}-{k}.jpg",type="jpeg",quality=80)
    b.close()
