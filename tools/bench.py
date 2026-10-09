"""The Paper Mill performance benchmark.

Usage: python3 bench.py <index.html> <label> [runs]

Loads the game in headless Chromium (SwiftShader WebGL, 800x450, DPR 1),
with a seeded Math.random, no network (three.js r128 served locally), and
measures:
  startup   - time to first game frame and until static-mesh merging ends
  normal    - 15 s of a running season at 30 sim-min/s, frame cap off
  high      - the same with shadows forced on and a 2x pixel ratio (higher graphics settings)
  stress    - 15 s with every upset active (fires, smoke, particles)
  sim       - pure game-logic cost: ms per simulated day (no rendering)
Per rendered frame it records the real frame interval (rAF to rAF) and the CPU time inside the frame callback,
split into JS (sim + scene update + UI) and renderer.render() submission.
Headline "frame time" = mean real frame interval, averaged over normal + stress (lower is better).
The small viewport keeps software rasterization from swamping CPU and draw-call costs, which is what
dominates on real GPUs.
Numbers are only comparable to other runs of this same harness.
"""
import json, statistics, sys, time, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
VW, VH = 800, 450
THREE = (HERE / "node_modules/three/build/three.min.js").read_text()          # r128 (v3.3.4 and early v4)
T186 = HERE / "t186/node_modules/three/build"                                    # r186 (v4 after the upgrade)

def route_for(html):
    """Serve the page and its three.js locally; answer the leaderboard with an empty list; block everything else."""
    def route(r):
        u = r.request.url
        if u.startswith("http://bench.local/"): return r.fulfill(body=html, content_type="text/html")
        if "three@0.186" in u:
            f = "three.core.js" if u.endswith("three.core.js") else "three.module.js"
            return r.fulfill(body=(T186 / f).read_text(), content_type="application/javascript", headers={"Access-Control-Allow-Origin": "*"})
        if "three" in u and u.endswith(".js"): return r.fulfill(body=THREE, content_type="application/javascript")
        if "supabase" in u: return r.fulfill(body="[]", content_type="application/json")
        return r.abort()
    return route

INIT = r"""
(()=>{let s=123456789;Math.random=function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
try{localStorage.setItem("paper-mill-tutorial","off");localStorage.setItem("paper-mill-sound","off");}catch(e){}
const B=window.__B={rec:false,frames:[],render:[],gaps:[],cur:0,first:null,last:0,errors:0};
// count real WebGL draw calls (every pass, any three.js version)
B.gl=0;B.glFrames=[];for(const C of [window.WebGL2RenderingContext,window.WebGLRenderingContext])if(C)["drawElements","drawArrays","drawElementsInstanced","drawArraysInstanced"].forEach(k=>{const o=C.prototype[k];if(o)C.prototype[k]=function(...a){B.gl++;return o.apply(this,a);};});
// a multi-draw (BatchedMesh) is one submitted draw call, however many objects it covers
for(const C of [window.WebGL2RenderingContext,window.WebGLRenderingContext])if(C){const ge=C.prototype.getExtension;C.prototype.getExtension=function(n){const e=ge.call(this,n);
  if(e&&n==="WEBGL_multi_draw"&&!e.__counted){e.__counted=true;["multiDrawElementsWEBGL","multiDrawArraysWEBGL","multiDrawElementsInstancedWEBGL","multiDrawArraysInstancedWEBGL"].forEach(k=>{const f=e[k];if(f)e[k]=function(...a){B.gl++;return f.apply(this,a);};});}return e;};}
const raf=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=cb=>raf(t=>{const t0=performance.now();B.cur=0;const g0=B.gl;try{cb(t);}finally{const d=performance.now()-t0;if(B.rec&&B.gl>g0)B.glFrames.push(B.gl-g0);
  if(B.first===null)B.first=t0;if(B.rec&&B.cur>0){B.frames.push(d);B.render.push(B.cur);if(B.last)B.gaps.push(t0-B.last);B.last=t0;}}});
})();
"""

HOOK = ("window.__PM={get THREE(){return THREE},get S(){return S},get C(){return C},get G3(){return G3},get EVENTS(){return EVENTS},get CH(){return CH},"
        "trigger:(...a)=>trigger(...a),step:h=>step(h),setFps:v=>setFpsMode(v),setRunning:v=>{running=v},get running(){return running}};\n")

def stats(xs):
    xs = sorted(xs)
    if not xs: return {"n": 0, "mean": 0, "p95": 0}
    return {"n": len(xs), "mean": round(statistics.fmean(xs), 2), "p95": round(xs[int(len(xs) * .95) - 1], 2)}

def one_run(pw, html):
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
                                 "--ignore-gpu-blocklist", "--enable-precise-memory-info"])
    pg = b.new_page(viewport={"width": VW, "height": VH}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text[:200]))
    pg.route("**/*", route_for(html))
    pg.add_init_script(INIT)
    t0 = time.time()
    pg.goto("http://bench.local/", wait_until="load")
    pg.wait_for_function("window.__B&&__B.first!==null", timeout=60000)
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)", timeout=90000, polling=200)
    startup = pg.evaluate("""()=>({first_frame_ms:Math.round(__B.first),merge_done_ms:Math.round(performance.now()),
        dcl_ms:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd)})""")
    pg.evaluate("""()=>{const R=__PM.G3.renderer,r=R.render.bind(R);R.render=(a,b)=>{const t=performance.now();r(a,b);__B.cur+=performance.now()-t;};
        document.getElementById('v2go').click();__PM.setFps(true);
        __PM.C.simSpeed=30;const el=document.getElementById('simspeed');if(el){el.value=30;el.dispatchEvent(new Event('input'));}}""")
    out = {"startup": startup}
    def scenario(name, setup):
        pg.evaluate(setup)
        pg.wait_for_timeout(3000)
        pg.evaluate("()=>{__B.frames=[];__B.render=[];__B.gaps=[];__B.glFrames=[];__B.last=0;__B.rec=true;}")
        pg.wait_for_timeout(15000)
        r = pg.evaluate("""()=>{__B.rec=false;const {G3,S}=__PM,I=G3.renderer.info;let live=0;G3.scene.traverse(o=>{if(o.isSprite&&o.visible)live++;});
            return {frames:__B.frames,render:__B.render,gaps:__B.gaps,gl:__B.glFrames.length?Math.round(__B.glFrames.reduce((a,b)=>a+b,0)/__B.glFrames.length):0,calls:I.render.calls,tris:I.render.triangles,geo:I.memory.geometries,tex:I.memory.textures,
              programs:I.programs?I.programs.length:0,sprites:live,heap_mb:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):0,
              running:__PM.running,day:+(S.t/1440).toFixed(2),inc:S.inc.length}}""")
        js = [f - g for f, g in zip(r["frames"], r["render"])]
        out[name] = {"fps": round(len(r["frames"]) / 15, 1), "frame_ms": stats(r["gaps"]), "total_ms": stats(r["frames"]), "js_ms": stats(js),
                     "render_ms": stats(r["render"]), "gl_draws": r["gl"], **{k: r[k] for k in ("calls", "tris", "geo", "tex", "programs", "sprites", "heap_mb", "day", "inc", "running")}}
    scenario("normal", "()=>{}")
    # high settings: shadows forced back on (the game's own low-FPS fallback turns them off) and 2x pixel ratio
    HQ = "(on)=>{const G=__PM.G3,R=G.renderer;R.shadowMap.enabled=on;R.shadowMap.needsUpdate=true;G.scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)});R.setPixelRatio(on?2:1);}"
    scenario("high", "()=>(" + HQ + ")(true)")
    pg.evaluate("()=>(" + HQ + ")(false)")
    scenario("stress", "()=>{__PM.CH.on=true;__PM.EVENTS.forEach(e=>{try{__PM.trigger(e.id,true);}catch(_){}});}")
    out["sim"] = pg.evaluate("""()=>{__PM.setRunning(false);const n=2880*2,t=performance.now();for(let i=0;i<n;i++)__PM.step(0.5);
        return {ms_per_sim_day:+((performance.now()-t)/2).toFixed(1)};}""")
    out["errors"] = errs[:10]
    out["wall_s"] = round(time.time() - t0, 1)
    b.close()
    return out

def med(runs, path):
    vals = []
    for r in runs:
        v = r
        for k in path: v = v[k]
        vals.append(v)
    return round(statistics.median(vals), 2)

def main():
    html_path, label = sys.argv[1], sys.argv[2]
    n = int(sys.argv[3]) if len(sys.argv) > 3 else 3
    html = pathlib.Path(html_path).read_text()
    if "window.__PM=" not in html:   # older builds: expose the same benchmark hook the v4 code ships with
        i = html.rindex("})();", 0, html.rindex("</script>"))
        html = html[:i] + HOOK + html[i:]
    with sync_playwright() as pw:
        runs = [one_run(pw, html) for _ in range(n)]
    s = {"label": label, "runs": n, "bytes": len(html.encode())}
    s["frame_time_ms"] = round((med(runs, ["normal", "frame_ms", "mean"]) + med(runs, ["stress", "frame_ms", "mean"])) / 2, 2)
    s["cpu_ms_per_frame"] = round((med(runs, ["normal", "total_ms", "mean"]) + med(runs, ["stress", "total_ms", "mean"])) / 2, 2)
    for sc in ("normal", "high", "stress"):
        s[sc] = {k: med(runs, [sc, *k.split(".")]) for k in
                 ("fps", "frame_ms.mean", "frame_ms.p95", "total_ms.mean", "total_ms.p95", "js_ms.mean", "js_ms.p95", "render_ms.mean", "gl_draws", "calls", "tris", "geo", "tex", "programs", "sprites", "heap_mb")}
    s["startup"] = {k: med(runs, ["startup", k]) for k in ("dcl_ms", "first_frame_ms", "merge_done_ms")}
    s["sim_ms_per_day"] = med(runs, ["sim", "ms_per_sim_day"])
    s["errors"] = sorted({e for r in runs for e in r["errors"]})
    s["checks"] = [{k: r[sc][k] for sc in ("normal", "high", "stress") for k in ("day", "inc", "running")} for r in runs][:1]
    print(json.dumps(s, indent=1))
    (HERE / f"result-{label}.json").write_text(json.dumps({"summary": s, "runs": runs}, indent=1))

if __name__ == "__main__":
    main()
