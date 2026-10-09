"""Sampling allocation profile of steady play: which functions allocate the most JS memory."""
import pathlib, sys, json, collections
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
path=sys.argv[1]; phone=len(sys.argv)>2 and sys.argv[2]=="phone"
html=pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i=html.rindex("})();",0,html.rindex("</script>")); html=html[:i]+HOOK+html[i:]
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True) if phone else b.new_context(viewport={"width":800,"height":450})
    pg=ctx.new_page(); pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.SM||__PM.G3.SM.done)",timeout=120000,polling=500)
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;}")
    pg.wait_for_timeout(70000)
    cdp=ctx.new_cdp_session(pg); cdp.send("HeapProfiler.enable"); cdp.send("HeapProfiler.startSampling",{"samplingInterval":4096,"includeObjectsCollectedByMajorGC":True,"includeObjectsCollectedByMinorGC":True})
    pg.wait_for_timeout(10000)
    prof=cdp.send("HeapProfiler.stopSampling")["profile"]; b.close()
agg=collections.Counter(); 
def walk(n):
    cf=n["callFrame"]; self_=sum(s["size"] for s in prof["samples"] if s["nodeId"]==n["id"]) if False else n.get("selfSize",0)
    agg[f'{cf["functionName"] or "(anon)"} [{cf["url"].split("/")[-1][:14]}:{cf["lineNumber"]+1}]']+=self_
    for c in n.get("children",[]): walk(c)
walk(prof["head"]); tot=sum(agg.values())
print(f"sampled allocations over 10 s: {tot/1e6:.1f} MB")
for k,v in agg.most_common(16): print(f"{v/1e6:7.2f} MB  {100*v/tot:5.1f}%  {k}")
