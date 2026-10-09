"""Long frames (>50 ms CPU) during the first 90 s of play, and which game section caused each."""
import pathlib, sys, json, collections
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
path=sys.argv[1]; phone=len(sys.argv)>2 and sys.argv[2]=="phone"; html=pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i=html.rindex("})();",0,html.rindex("</script>")); html=html[:i]+HOOK+html[i:]
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True) if phone else b.new_context(viewport={"width":800,"height":450})
    pg=ctx.new_page(); pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__B.first!==null",timeout=120000,polling=300)
    # measure from the moment play can start: builds that precompile behind the menu are timed after it finishes
    pg.wait_for_function("!__PM.G3.prewarm||__PM.G3.warm",timeout=180000,polling=200)
    ready_ms=pg.evaluate("()=>Math.round(performance.now())")
    pg.evaluate("""()=>{const G=__PM.G3,PF=G.PF;window.__H=[];window.__T0=performance.now();let prev={};PF.acc={};PF.frames=0;PF.gaps=[];PF.js=[];PF.on=true;
      const raf=requestAnimationFrame;(function k(){const a=PF.acc,d={};let tot=0;for(const s in a){const v=a[s]-(prev[s]||0);if(v>0){d[s]=v;tot+=v;}}prev={...a};
        if(tot>50){const top=Object.entries(d).sort((x,y)=>y[1]-x[1])[0];__H.push([Math.round((performance.now()-__T0)/1000),Math.round(tot),top[0],Math.round(top[1])]);}raf(k);})();
      document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;}""")
    pg.wait_for_timeout(90000)
    H=pg.evaluate("()=>__H"); b.close()
by=collections.defaultdict(lambda:[0,0,0])
for t,tot,sec,ms in H: by[sec][0]+=1; by[sec][1]+=ms; by[sec][2]=max(by[sec][2],ms)
print(f"long frames (>50 ms) in 90 s: {len(H)}; last at {H[-1][0] if H else '-'} s")
for k,(n,s,mx) in sorted(by.items(),key=lambda x:-x[1][1]): print(f"  {n:3} frames, {s:6} ms total, worst {mx:5} ms  <- {k}")
print("JSON", json.dumps({"ready_ms": ready_ms, "long_frames_90s": len(H), "worst_ms": max([h[1] for h in H], default=0), "last_s": H[-1][0] if H else 0}))
