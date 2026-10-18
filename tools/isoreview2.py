"""v6.1 iso review part 2 (phone, iOS UA optional): true triangles per draw group, texture/buffer uploads per frame with callers, allocation profile, scene-graph cost."""
import pathlib, sys, json, collections
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1" if "ios" in sys.argv else None
VIEW = [float(x) for x in (next((a.split("=")[1] for a in sys.argv if a.startswith("--view=")), "10,5,190")).split(",")]
PROBE = r"""()=>new Promise(res=>{const G=__PM.G3,R=G.renderer,gl=R.getContext(),orig=R.renderBufferDirect.bind(R);const T={},U={tex:{},buf:{},create:0};let on=false;
 R.renderBufferDirect=function(cam,scene,geo,mat,obj,group){const t0=R.info.render.triangles;orig(cam,scene,geo,mat,obj,group);if(on&&obj.layers.mask===1){const k=(obj.name||'(unnamed)')+' | '+mat.type+(mat.transparent?'(T)':'');T[k]=T[k]||[0,0];T[k][0]++;T[k][1]+=R.info.render.triangles-t0;}};
 const st=()=>{const s=new Error().stack.split('\n').slice(2,9).map(l=>l.trim().replace(/^at /,'').replace(/\(.*?:(\d+):\d+\)/,':$1')).filter(l=>!/three|WebGL|upload|setTexture|bindTexture|Textures|Uniform|setValue|setProgram|renderObject|renderBuffer|renderScene|render \(|Attributes|BindingStates|update/i.test(l)).slice(0,3).join(' < ');return st0(s);};const st0=s=>s||'(three internal)';
 const w=(k,b)=>{const f=gl[k].bind(gl);gl[k]=(...a)=>{if(on){const s=st();b[s]=(b[s]||0)+1;}return f(...a);};};
 w('texImage2D',U.tex);w('texSubImage2D',U.tex);w('bufferData',U.buf);w('bufferSubData',U.buf);const cb=gl.createBuffer.bind(gl);gl.createBuffer=()=>{if(on)U.create++;return cb();};
 G.lastMove=performance.now();let n=0;requestAnimationFrame(function f(){on=true;if(++n<31)requestAnimationFrame(f);else{on=false;R.renderBufferDirect=orig;res({T,U,frames:30});}});})"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, **({"user_agent": UA} if UA else {}))
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/"+next((a.split("=",1)[1] for a in sys.argv if a.startswith("--q=")), ""))
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{__PM.setFps('max');__PM.C.simSpeed=20;}")
    pg.evaluate("v=>{__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955]);}", VIEW); pg.wait_for_timeout(15000)
    pg.evaluate("()=>{const c=document.querySelector('#evc:not([hidden]) button');if(c)c.click();}")
    r = pg.evaluate(PROBE)
    g = pg.evaluate("""()=>{const G=__PM.G3,sc=G.scene;const by={};let n=0;sc.traverse(o=>{n++;const k='L'+o.layers.mask+(o.visible?'':'(hidden)')+(o.matrixAutoUpdate?'':' static');by[k]=(by[k]||0)+1;});
      let px=G.renderer.getPixelRatio(),aa=G.renderer.getContext().getContextAttributes();return {n,by,px,aa:aa.antialias}}""")
    cdp = ctx.new_cdp_session(pg); cdp.send("HeapProfiler.enable"); cdp.send("HeapProfiler.startSampling", {"samplingInterval": 4096})
    pg.wait_for_timeout(10000)
    prof = cdp.send("HeapProfiler.stopSampling")["profile"]
    b.close()
tri = sorted(r["T"].items(), key=lambda x: -x[1][1])
print("== mid view, 30 frames: draws/frame, tris/frame by object name | material (main pass only, layer 1)")
tot = sum(v[1] for _, v in tri) / 30; print("total tris/frame", round(tot), "draws/frame", round(sum(v[0] for _, v in tri) / 30))
for k, v in tri[:25]: print(f"  {v[0]/30:6.1f} {v[1]/30:8.0f}  {k}")
print("== uploads over 30 frames: textures"); [print(f"  {n:4d} {k}") for k, n in sorted(r["U"]["tex"].items(), key=lambda x: -x[1])[:10]]
print("== buffers"); [print(f"  {n:4d} {k}") for k, n in sorted(r["U"]["buf"].items(), key=lambda x: -x[1])[:12]]
print("createBuffer calls:", r["U"]["create"])
print("== scene graph", json.dumps(g))
# allocation: self size by function (incl. line)
agg = collections.Counter()
def walk(n):
    cf = n["callFrame"]; agg[(cf["functionName"] or "(anon)") + ":" + str(cf["lineNumber"])] += n["selfSize"]
    for c in n.get("children", []): walk(c)
walk(prof["head"])
print("== allocation (sampled live+dead, 10 s), KB by function")
for k, v in agg.most_common(25): print(f"  {v/1024:8.0f} {k}")
print("errors", errs[:3])
