"""A/B experiments on one loaded page: apply a change, measure, revert. Phone emulation.
Measures per variant: CPU ms inside the frame callback (median), delivered frame interval (median),
WebGL draws per frame, JS allocation rate.
Usage: python3 experiments.py <index.html> [desktop]"""
import pathlib, sys, json, statistics as st
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
path = sys.argv[1]; desktop = len(sys.argv) > 2 and sys.argv[2] == "desktop"
html = pathlib.Path(path).read_text()

ACTORS = "o=>o.userData&&(o.userData.legs||o.userData.load||o.userData.wheels||o.userData.cargo||o.userData.stack)"
VARIANTS = [
 ("baseline", "()=>{}", "()=>{}"),
 ("no backdrop blur (CSS)", "()=>{const s=document.createElement('style');s.id='xb';s.textContent='*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';document.head.appendChild(s)}", "()=>document.getElementById('xb').remove()"),
 ("no HTML labels", "()=>{document.getElementById('labels3d').style.display='none'}", "()=>{document.getElementById('labels3d').style.display=''}"),
 ("transparent double-sided drawn in one pass", "()=>{const T=__PM.THREE;window.__fs=[];__PM.G3.scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{if(m.transparent&&m.side===T.DoubleSide&&!m.forceSinglePass){m.forceSinglePass=true;__fs.push(m);}})})}", "()=>{__fs.forEach(m=>m.forceSinglePass=false)}"),
 ("people + vehicles hidden (instancing upper bound)", "()=>{window.__hid=[];__PM.G3.scene.children.forEach(t=>{if((" + ACTORS + ")(t))t.traverse(o=>{__hid.push([o,o.layers.mask]);o.layers.set(30);})})}", "()=>{__hid.forEach(([o,m])=>o.layers.mask=m)}"),
 ("edge outlines hidden", "()=>{window.__ln=[];__PM.G3.scene.traverse(o=>{if(o.isLine&&o.layers.mask===1){o.layers.set(30);__ln.push(o);}})}", "()=>{__ln.forEach(o=>o.layers.set(0))}"),
 ("shadows on (game turned them off)", "()=>{const R=__PM.G3.renderer;window.__sh=R.shadowMap.enabled;R.shadowMap.enabled=true;R.shadowMap.needsUpdate=true;__PM.G3.scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)})}", "()=>{__PM.G3.renderer.shadowMap.enabled=__sh;__PM.G3.scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)})}"),
]
MEASURE = """async(ms)=>{__B.frames=[];__B.gaps=[];__B.glFrames=[];__B.last=0;__B.rec=true;const m0=performance.memory?performance.memory.usedJSHeapSize:0;let grow=0,last=m0;
  const t0=performance.now();while(performance.now()-t0<ms){await new Promise(r=>requestAnimationFrame(r));if(performance.memory){const u=performance.memory.usedJSHeapSize;if(u>last)grow+=u-last;last=u;}}
  __B.rec=false;return [__B.frames,__B.gaps,__B.glFrames,grow/(ms/1000)/1e6];}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-precise-memory-info"])
    ctx = b.new_context(viewport={"width": 800, "height": 450}) if desktop else b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.SM||__PM.G3.SM.done)", timeout=120000, polling=500)
    pg.evaluate("()=>{const R=__PM.G3.renderer,r=R.render.bind(R);R.render=(a,b)=>{const t=performance.now();r(a,b);__B.cur+=performance.now()-t;};document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;__PM.G3.capOff=true;}")
    pg.wait_for_timeout(70000)
    rows = []
    for name, on, off in VARIANTS:
        pg.evaluate(on); pg.wait_for_timeout(4000)
        f, g, d, a = pg.evaluate(MEASURE, 12000)
        pg.evaluate(off); pg.wait_for_timeout(1500)
        rows.append((name, round(st.median(f), 1) if f else 0, round(st.median(g), 0) if g else 0, round(st.median(d)) if d else 0, round(a, 2), len(f)))
    b.close()
print(f"{'variant':52} {'cpu ms':>7} {'frame ms':>9} {'draws':>6} {'alloc MB/s':>10} {'n':>4}")
for r in rows: print(f"{r[0]:52} {r[1]:7} {r[2]:9} {r[3]:6} {r[4]:10} {r[5]:4}")
