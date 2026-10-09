"""Side-by-side views of two builds: day overview, paper machine close-up, bale-yard fire, night."""
import pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
A, B, out = sys.argv[1], sys.argv[2], sys.argv[3]
VIEWS = ["day", "pm", "fire", "night"]
def grab(path, tag):
    html = pathlib.Path(path).read_text()
    if "window.__PM=" not in html:
        i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        pg = b.new_page(viewport={"width": 760, "height": 440})
        pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
        pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=180000, polling=500)
        pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setRunning(false);document.querySelectorAll('#tut').forEach(e=>e.hidden=true);document.querySelectorAll('#labels3d,.v2top,.v2dock,#chips3d,.banner3d').forEach(e=>e.style.visibility='hidden')}")
        pg.wait_for_timeout(2500); pg.screenshot(path=f"/tmp/claude-0/rev/{tag}-day.png")
        pg.evaluate("()=>{document.querySelector('#jumps [data-j=\"pm\"]').click()}"); pg.wait_for_timeout(3500); pg.screenshot(path=f"/tmp/claude-0/rev/{tag}-pm.png")
        pg.evaluate("()=>{__PM.trigger('balefire',true);__PM.setRunning(true);document.querySelector('#jumps [data-j=\"recv\"]').click()}"); pg.wait_for_timeout(5000)
        pg.evaluate("()=>__PM.setRunning(false)"); pg.wait_for_timeout(300); pg.screenshot(path=f"/tmp/claude-0/rev/{tag}-fire.png")
        pg.evaluate("()=>{const S=__PM.S;S.inc.forEach(i=>i.left=0);S.t+=15*60;__PM.setRunning(true);document.getElementById('v2pause').click();document.getElementById('v2go').click();__PM.C.simSpeed=1;}")
        pg.wait_for_timeout(1500)
        pg.evaluate("()=>{document.querySelector('#jumps [data-j=\"pm\"]').click()}"); pg.wait_for_timeout(5000)
        pg.evaluate("()=>{__PM.setRunning(false);document.querySelectorAll('#labels3d,.v2top,.v2dock,#chips3d,.banner3d').forEach(e=>e.style.visibility='hidden')}"); pg.wait_for_timeout(500)
        pg.screenshot(path=f"/tmp/claude-0/rev/{tag}-night.png"); b.close()
grab(A, "A"); grab(B, "B")
for v in VIEWS:
    a = Image.open(f"/tmp/claude-0/rev/A-{v}.png"); bb = Image.open(f"/tmp/claude-0/rev/B-{v}.png")
    c = Image.new("RGB", (a.width * 2 + 10, a.height), "white"); c.paste(a, (0, 0)); c.paste(bb, (a.width + 10, 0)); c.save(f"{out}-{v}.png")
print("ok")
