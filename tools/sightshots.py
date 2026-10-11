"""Stills of a rare sight at chosen moments (scene clock seconds), from a fixed camera.
Usage: python3 sightshots.py <index.html> <outdir> <env> "t:x,z,r,th,ph,y;t:..." """
import pathlib,sys
from playwright.sync_api import sync_playwright
src=open(pathlib.Path(__file__).parent/'bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text();out=sys.argv[2];env=sys.argv[3]
shots=[(float(a.split(':')[0]),None if a.split(':')[1]=='f' else [float(v) for v in a.split(':')[1].split(',')]) for a in sys.argv[4].split(';')]   # 't:f' = the scene's own focus
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":900,"height":560});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:300]))
    pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto(f"http://bench.local/?env={env}")
    pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=240000,polling=300)
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.C.simSpeed=1;document.querySelectorAll('#tut').forEach(e=>e.hidden=true);document.querySelectorAll('#labels3d,.v2top,.v2dock,#chips3d,.banner3d,#bn3d').forEach(e=>e.style.visibility='hidden');__PM.S.t=10*60;__PM.G3.sight();}")
    pg.wait_for_timeout(3000);print("errs",errs,pg.evaluate("()=>[typeof __PM.G3.sight,__PM.G3.sightT,__PM.G3.act]"))
    pg.wait_for_function("__PM.G3.sightT>=0",timeout=60000)
    for i,(t,c) in enumerate(shots):
        pg.evaluate(f"()=>{{__PM.G3.sightSeek({t});__PM.G3.sightHold={t};}}");pg.evaluate("()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))))");pg.evaluate(f"()=>{{const c={c if c else 'null'};const q=__PM.G3.sightFocus();__PM.G3.camSet(c||[q[0],q[2],q[3],q[4]??-0.4,q[5]??1.02,q[1]]);}}");pg.evaluate("()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))))")
        f=f"{out}/sight-{i+1:02d}-{t:.1f}s.png";pg.screenshot(path=f);print(f,pg.evaluate("()=>__PM.G3.sightT.toFixed(2)"))
    print("page errors:",errs)
