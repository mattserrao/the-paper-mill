"""Top-down orthographic view of a rectangle of the site with roofs hidden and a labelled metre grid (layout work).
Usage: python3 gridview.py index.html out.png x0 x1 z0 z1 [step]"""
import pathlib, sys, base64, io
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
path, out = sys.argv[1], sys.argv[2]; x0, x1, z0, z1 = map(float, sys.argv[3:7]); step = float(sys.argv[7]) if len(sys.argv) > 7 else 5
html = pathlib.Path(path).read_text()
W = 1400; H = int(W * (z1 - z0) / (x1 - x0))
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    url = pg.evaluate("""([x0,x1,z0,z1])=>{__PM.setRunning(false);__PM.G3.roofFade(0);if(__PM.G3.tellShowAll)__PM.G3.tellShowAll(true);if(__PM.G3.dbForce)__PM.G3.dbForce();if(__PM.G3.dbTick)__PM.G3.dbTick();const D=__PM.G3.diagScene(),T=__PM.THREE,R=D.renderer;
      const cam=new T.OrthographicCamera(x0,x1,-z0,-z1,1,2000);cam.position.set(0,600,0);cam.up.set(0,0,-1);cam.lookAt(0,0,0);
      const fg=D.scene.fog;D.scene.fog=null;R.shadowMap.needsUpdate=true;R.render(D.scene,cam);D.scene.fog=fg;return R.domElement.toDataURL('image/png');}""", [x0, x1, z0, z1])
    b.close()
im = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGB"); w, h = im.size; d = ImageDraw.Draw(im)
X = lambda x: (x - x0) / (x1 - x0) * w; Z = lambda z: (z - z0) / (z1 - z0) * h
import math
x = math.ceil(x0 / step) * step
while x <= x1: d.line([(X(x), 0), (X(x), h)], fill=(255, 0, 255) if x % (step * 2) == 0 else (255, 150, 255), width=1); d.text((X(x) + 2, 2), f"{x:g}", fill=(200, 0, 200)); x += step
z = math.ceil(z0 / step) * step
while z <= z1: d.line([(0, Z(z)), (w, Z(z))], fill=(255, 0, 255) if z % (step * 2) == 0 else (255, 150, 255), width=1); d.text((2, Z(z) + 2), f"{z:g}", fill=(200, 0, 200)); z += step
im.save(out); print("saved", out, im.size)
