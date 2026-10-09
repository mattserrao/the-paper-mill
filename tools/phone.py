"""Phone emulation (touch, coarse pointer, 390x844 @2x): draws and CPU per frame in normal play after start-up."""
import pathlib,sys,json,statistics as st
from playwright.sync_api import sync_playwright
src=open('bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
FORCE_SH="--shadows" in sys.argv
for path in [a for a in sys.argv[1:] if not a.startswith("--")]:
    html=pathlib.Path(path).read_text()
    if "window.__PM=" not in html:
        i=html.rindex("})();",0,html.rindex("</script>")); html=html[:i]+HOOK+html[i:]
    with sync_playwright() as pw:
        b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
        ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
        pg=ctx.new_page(); pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
        pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)",timeout=180000,polling=500)
        mob=pg.evaluate("()=>matchMedia('(pointer: coarse)').matches")
        pg.evaluate("()=>{const R=__PM.G3.renderer,r=R.render.bind(R);R.render=(a,b)=>{const t=performance.now();r(a,b);__B.cur+=performance.now()-t;};document.getElementById('v2go').click();__PM.C.simSpeed=30;}")
        pg.wait_for_timeout(20000)
        if FORCE_SH:   # same graphics on every build: shadows on at 15 Hz (the low-FPS fallback may have turned them off)
            pg.evaluate("()=>{const G=__PM.G3,R=G.renderer;R.shadowMap.enabled=true;R.shadowMap.needsUpdate=true;G.scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)});G.shadowHz=15;}")
            pg.wait_for_timeout(15000)
        pg.evaluate("()=>{__B.frames=[];__B.render=[];__B.glFrames=[];__B.rec=true}"); pg.wait_for_timeout(15000)
        f,g,heap=pg.evaluate("()=>{__B.rec=false;return [__B.frames,__B.glFrames,performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):0]}")
        geo=pg.evaluate("()=>__PM.G3.renderer.info.memory.geometries")
        b.close()
    print(path.split('/')[-1], json.dumps({"coarse_pointer":mob,"frames":len(f),"cpu_med_ms":round(st.median(f),1),"gl_draws_med":st.median(g) if g else None,"gpu_geometries":geo}))
