"""Clipping check for a site: runs the mill (every upset on, trucks, cars, train, walkers) and samples where every
moving person and vehicle is; any that stands inside a scenery footprint is a clip. Also checks the camera never goes
below scenery during zen mode.
Usage: python3 clipcheck.py index.html [env] [mill seed] [seconds]"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text(); env = sys.argv[2] if len(sys.argv) > 2 else "rural"
mill = sys.argv[3] if len(sys.argv) > 3 else "1"; secs = int(sys.argv[4]) if len(sys.argv) > 4 else 60
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
SAMPLE = r"""()=>{const G=__PM.G3,sc=G.diagScene().scene,out=window.__CLIP||(window.__CLIP={n:0,hits:[],cam:0,camLow:[]});
  sc.traverse(o=>{const u=o.userData;if(!(u&&(u.legs||u.wheels||u.trike||u.car||u.train)))return;let v=true;for(let x=o;x;x=x.parent)if(!x.visible){v=false;break;}if(!v)return;
    const p=new __PM.THREE.Vector3();o.getWorldPosition(p);out.n++;if(G.sceneryAt(p.x,p.z)&&out.hits.length<40)out.hits.push([u.legs?"person":u.trike?"trike":u.car?"car":u.train?"train":"vehicle",+p.x.toFixed(1),+p.z.toFixed(1)]);});
  const c=G.diagScene().camera.position,h=G.sceneryH(c.x,c.z);out.cam++;if(h>0&&c.y<h+2.9&&out.camLow.length<20)out.camLow.push([+c.x.toFixed(0),+c.y.toFixed(1),+c.z.toFixed(0),h]);return out.n;}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 800, "height": 450}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:300]))
    base = route_for(html)
    pg.route("**/*", lambda r: r.fulfill(body=html, content_type="text/html") if r.request.url.startswith("http://bench.local/") else base(r))
    pg.add_init_script(INIT); pg.goto(f"http://bench.local/?env={env}&mill={mill}")
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;}")
    for k in range(secs // 2):
        if k == secs // 6: pg.evaluate("()=>{__PM.CH.on=true;__PM.EVENTS.forEach(e=>{try{__PM.trigger(e.id,true)}catch(_){}})}")
        if k == secs // 3:   # zen mode for the last two thirds: scripted camera shots
            pg.evaluate("()=>{const z=document.getElementById('v2zen');if(z){document.getElementById('v2menu').hidden=false;z.click();}}")
        pg.wait_for_timeout(2000); pg.evaluate(SAMPLE)
    r = pg.evaluate("()=>({...window.__CLIP,scenery:{...__PM.G3.scenery,parts:0},zen:!!__PM.S.zen})"); b.close()
print(json.dumps({"env": env, "mill": mill, "samples": r["n"], "clips": r["hits"], "camera_samples": r["cam"], "camera_low": r["camLow"], "zen": r["zen"], "scenery": r["scenery"], "errors": errs[:5]}))
print("CLIP OK" if not r["hits"] and not r["camLow"] and not errs else "CLIP PROBLEM")
