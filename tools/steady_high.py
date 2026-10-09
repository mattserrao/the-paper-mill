"""Steady-state CPU per frame after the startup shader warm-up (75 s), normal then all upsets."""
import pathlib,sys,json,statistics as st
from playwright.sync_api import sync_playwright
src=open('bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
for path in sys.argv[1:]:
    html=pathlib.Path(path).read_text()
    if "window.__PM=" not in html:
        i=html.rindex("})();",0,html.rindex("</script>")); html=html[:i]+HOOK+html[i:]
    with sync_playwright() as pw:
        b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
        pg=b.new_page(viewport={"width":800,"height":450}); pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
        pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)",timeout=120000,polling=500)
        pg.evaluate("()=>{const R=__PM.G3.renderer,r=R.render.bind(R);R.render=(a,b)=>{const t=performance.now();r(a,b);__B.cur+=performance.now()-t;};document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;}")
        pg.wait_for_timeout(75000); res={}
        HQ="()=>{const G=__PM.G3,R=G.renderer;R.shadowMap.enabled=true;R.shadowMap.needsUpdate=true;G.scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)});R.setPixelRatio(2);}"
        for name,setup,settle in [("normal","()=>{}",8000),("high",HQ,30000)]:
            pg.evaluate(setup); pg.wait_for_timeout(settle)
            pg.evaluate("()=>{__B.frames=[];__B.render=[];__B.glFrames=[];__B.rec=true}"); pg.wait_for_timeout(20000)
            f,r=pg.evaluate("()=>{__B.rec=false;return [__B.frames,__B.render]}")
            js=[a-c for a,c in zip(f,r)]
            res[name]={"n":len(f),"cpu_med":round(st.median(f),1),"js_med":round(st.median(js),1),"render_med":round(st.median(r),1),"cpu_max":round(max(f),1),"programs":pg.evaluate("()=>__PM.G3.renderer.info.programs.length"),"gl":round(st.median(pg.evaluate("()=>__B.glFrames")) if pg.evaluate("()=>__B.glFrames.length") else 0)}
        b.close()
    print(path.split('/')[-1], json.dumps(res))
