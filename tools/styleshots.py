"""Fixed-view screenshots for art-style review (v6).

Usage: python3 styleshots.py <index.html> <out_prefix> [query] [--phone]
  query  extra URL query, e.g. "style=paper" or "style=dusk&gfx=high"
Views: site overview, paper machine, stock prep, receiving with a bale-yard fire, warehouse, night at the paper machine.
Writes <out_prefix>-<view>.png and <out_prefix>-sheet.png (all views on one sheet)."""
import pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
args = [a for a in sys.argv[1:] if not a.startswith("--")]
path, out = args[0], args[1]
query = args[2] if len(args) > 2 else ""
phone = "--phone" in sys.argv
VW, VH = (390, 700) if phone else (960, 540)
HIDE = "document.querySelectorAll('.modal').forEach(m=>{m.parentElement.style.display='none'});document.querySelectorAll('#tut,#labels3d,.v2top,.v2dock,#chips3d,.banner3d,#bn3d').forEach(e=>e.style.visibility='hidden')"
html = pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
shots = []
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": VW, "height": VH}, device_scale_factor=1, has_touch=phone, is_mobile=phone)
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
    pg.goto("http://bench.local/" + ("?" + query if query else ""))
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>{document.getElementById('v2go').click();const lc=document.querySelector('.ldcard');if(lc){lc.click();const g=document.querySelector('#ld-go');g&&g.click();}__PM.G3.noFallback=true;__PM.setRunning(false);" + HIDE + "}")
    def snap(name, wait=3000):
        pg.wait_for_timeout(wait); pg.evaluate("()=>{" + HIDE + "}"); pg.wait_for_timeout(300)
        f = f"{out}-{name}.png"; pg.screenshot(path=f); shots.append((name, f))
    def jump(j): pg.evaluate(f"()=>document.querySelector('#jumps [data-j=\"{j}\"]').click()")
    jump("site"); snap("overview", 4000)
    # close-up on a group of workers (the first visible figure near the paper machine floor)
    pg.evaluate("""()=>{const G=__PM.G3;let best=null;G.scene.traverse(o=>{if(o.userData&&o.userData.legs&&o.parent){let v=true;for(let x=o;x;x=x.parent)if(x.visible===false)v=false;
      if(v){const w=new o.position.constructor();o.getWorldPosition(w);if(!best||Math.abs(w.x)+Math.abs(w.z)<Math.abs(best.x)+Math.abs(best.z))best=w;}}});
      if(best)G.camSet([best.x,best.z,38,-0.35,0.85,0]);}""")
    snap("workers", 2500)
    jump("pm"); snap("papermachine", 4000)
    jump("pulp"); snap("stockprep", 4000)
    pg.evaluate("()=>{__PM.trigger('balefire',true);__PM.setRunning(true)}"); jump("recv"); pg.wait_for_timeout(4000)
    pg.evaluate("()=>__PM.setRunning(false)"); snap("fire", 300)
    jump("wh"); snap("warehouse", 4000)
    pg.evaluate("()=>{__PM.C.simSpeed=20;__PM.setRunning(true)}"); jump("trucks"); pg.wait_for_timeout(9000); pg.evaluate("()=>__PM.setRunning(false)"); snap("trucks", 600)
    pg.evaluate("()=>{const S=__PM.S;S.inc.forEach(i=>i.left=0);S.t+=15*60;__PM.C.simSpeed=1;__PM.setRunning(true)}")
    jump("pm"); pg.wait_for_timeout(5000); pg.evaluate("()=>__PM.setRunning(false)"); snap("night", 500)
    b.close()
print("errors:", errs[:5])
cols = 2 if not phone else 3
ims = [Image.open(f) for _, f in shots]
w, h = ims[0].size
sheet = Image.new("RGB", (cols * w + (cols - 1) * 8, ((len(ims) + cols - 1) // cols) * (h + 8)), "white")
for k, ((n, _), im) in enumerate(zip(shots, ims)):
    x, y = (k % cols) * (w + 8), (k // cols) * (h + 8)
    sheet.paste(im, (x, y)); ImageDraw.Draw(sheet).text((x + 8, y + 6), n, fill="white")
sheet.save(f"{out}-sheet.png"); print("sheet", f"{out}-sheet.png")
