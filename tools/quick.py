"""Quick performance test (~2 min). Usage: python3 quick.py <index.html> [label] [--desktop] [--expect=96960821] [--env=rural] [--mill=1]

One phone-emulated load (390x844 @1x, touch: the game's phone path keys on touch, and 1x keeps the software GPU fast enough; --desktop for 800x450), seeded, low-FPS fallback off, at 30 sim-min/s:
  normal  : 10 s settle, 10 s measured
  stress  : every upset at once, 3 s settle, 10 s measured
then a second short load runs the in-game ?autotest checksum (3 sim days on the fixed seed).

Per phase it reports counts that don't depend on machine speed (compare them across sessions directly):
  draws_main / draws_shadow  real WebGL draws per frame (main pass) and per shadow refresh
  shadow_hz                  shadow refreshes per second
  tris_k                     triangles per frame (thousands, all passes)
  programs, geometries, textures, tex_MB   GPU resources held
  dom_writes_f / dom_writes_s page writes per frame / per second (style/class/text/child changes under <body>)
  style_recalcs_f, layouts_f style recalculations and layouts the browser ran, per frame
  paints_f                   paint operations per frame (layers or elements repainted)
  overlay_nodes              HTML labels/chips/banners visible over the 3D view
  alloc_MB_s                 JS heap growth per second
and timing (this machine; only for same-session comparison): cpu_ms (frame callback, median), style_layout_ms_f
(browser style + layout per frame), browser_ms_f (style, layout, paint, layerize, commit per frame), over50 (frames over 50 ms of CPU).
Writes quick-<label>.json next to this script and prints one JSON object."""
import json, pathlib, sys, statistics as st, re
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
src = (HERE / "bench.py").read_text()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])   # route_for, INIT, HOOK

args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:] if a.startswith("--")}
path = args[0]; label = args[1] if len(args) > 1 else pathlib.Path(path).parent.name or "build"
expect = flags.get("--expect", "96960821"); desktop = "--desktop" in flags
site = "".join(f"&{k}={flags.get('--'+k, '1' if k == 'mill' else '')}" for k in ("env", "mill") if "--" + k in flags or k == "mill")   # v4.1: ?env=&mill= (default: rural, mill #1; a visit without ?mill= rolls a new layout)
html = pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]

# per-frame sampler: main vs shadow draws, triangles, CPU in the frame callback, DOM writes, heap growth
SAMPLER = r"""()=>{const G=__PM.G3,R=G.diagScene?G.diagScene().renderer:G.renderer,SM=R.shadowMap,B=__B;
 if(window.__Q)return;const Q=window.__Q={on:false};
 const orig=SM.render.bind(SM);SM.render=(...a)=>{const will=SM.enabled&&(SM.autoUpdate||SM.needsUpdate);const g0=B.gl;orig(...a);if(will&&Q.on){Q.shRuns++;Q.shDraws+=B.gl-g0;}};
 const raf=requestAnimationFrame;let lastGl=B.gl;
 (function k(){if(Q.on){const d=B.gl-lastGl;if(d>0){Q.frames++;Q.draws+=d;Q.tris+=R.info.render.triangles;}}lastGl=B.gl;
   if(Q.on&&performance.memory){const u=performance.memory.usedJSHeapSize;if(u>Q.heap)Q.grow+=u-Q.heap;Q.heap=u;}raf(k);})();
 Q.mo=new MutationObserver(l=>{if(Q.on)Q.writes+=l.length;});
 Q.mo.observe(document.body,{attributes:true,attributeFilter:["style","class","hidden"],subtree:true,childList:true,characterData:true});
 Q.start=()=>{Object.assign(Q,{frames:0,draws:0,tris:0,shRuns:0,shDraws:0,writes:0,grow:0,heap:performance.memory?performance.memory.usedJSHeapSize:0,t0:performance.now(),on:true});
   B.frames=[];B.render=[];B.gaps=[];B.last=0;B.rec=true;};
 Q.stop=()=>{Q.on=false;B.rec=false;const s=(performance.now()-Q.t0)/1000,I=R.info;
   const tex=new Set();let bytes=0;G.diagScene().scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
     ms.forEach(m=>{for(const k in m){const v=m[k];if(v&&v.isTexture&&!tex.has(v)){tex.add(v);const im=v.image||{};bytes+=(im.width||0)*(im.height||0)*4*(v.generateMipmaps!==false&&!v.isDataTexture?1.33:1);}}});});
   const vis=[...document.querySelectorAll("#labels3d *,#chips3d *,.banner3d")].filter(e=>e.childElementCount===0&&e.getClientRects().length&&getComputedStyle(e).visibility!=="hidden").length;
   const f=B.frames.slice().sort((a,b)=>a-b);
   return {secs:+s.toFixed(1),frames:Q.frames,fps_here:+(Q.frames/s).toFixed(1),
     draws_main:Q.frames?Math.round((Q.draws-Q.shDraws)/Q.frames):0,draws_shadow:Q.shRuns?Math.round(Q.shDraws/Q.shRuns):0,shadow_hz:+(Q.shRuns/s).toFixed(1),
     tris_k:Q.frames?Math.round(Q.tris/Q.frames/1000):0,programs:I.programs?I.programs.length:0,geometries:I.memory.geometries,textures:I.memory.textures,
     tex_MB:+((bytes+(SM.enabled?SM.type!==undefined?4194304:0:0))/1e6).toFixed(1),dom_writes_s:Math.round(Q.writes/s),dom_writes_f:Q.frames?+(Q.writes/Q.frames).toFixed(1):0,overlay_nodes:vis,
     alloc_MB_s:+(Q.grow/s/1e6).toFixed(2),cpu_ms:f.length?+f[Math.floor(f.length/2)].toFixed(1):0,over50:f.filter(x=>x>50).length};};
}"""
START = "()=>{__Q.start();}"

def metrics(cdp):
    return {m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}

RENDER_EV = {"UpdateLayoutTree": "style", "Layout": "layout", "PrePaint": "prepaint", "UpdateLayerTree": "prepaint", "Paint": "paint",
             "Layerize": "layerize", "Commit": "commit", "RasterTask": "raster"}
def browser_work(trace, frames):
    """Main-thread style/layout/paint work of the renderer, from a devtools.timeline trace: ms per frame, paints per frame."""
    ev = json.loads(trace).get("traceEvents", [])
    pid = None
    for e in ev:
        if e.get("name") == "TracingStartedInBrowser":
            fr = (e.get("args", {}).get("data", {}).get("frames") or [{}])
            pid = fr[0].get("processId"); break
    ms = {}; paints = 0
    for e in ev:
        k = RENDER_EV.get(e.get("name"))
        if not k or e.get("ph") != "X" or (pid and e.get("pid") != pid and k != "raster"): continue
        ms[k] = ms.get(k, 0) + e.get("dur", 0) / 1000
        if k == "paint": paints += 1
    n = max(1, frames)
    return {"paints_f": round(paints / n, 1), "browser_ms_f": round(sum(v for k, v in ms.items() if k != "raster") / n, 2),
            "browser_split_ms_f": {k: round(v / n, 2) for k, v in sorted(ms.items(), key=lambda x: -x[1])}}

def phase(pg, cdp, settle_ms, measure_ms):
    pg.wait_for_timeout(settle_ms)
    m0 = metrics(cdp); BR.start_tracing(page=pg, categories=["devtools.timeline", "disabled-by-default-devtools.timeline"])
    pg.evaluate(START); pg.wait_for_timeout(measure_ms)
    r = pg.evaluate("()=>__Q.stop()"); m1 = metrics(cdp); n = max(1, r["frames"])
    r.update(browser_work(BR.stop_tracing(), r["frames"]))
    d = lambda k: m1.get(k, 0) - m0.get(k, 0)
    r["style_recalcs_f"] = round(d("RecalcStyleCount") / n, 2); r["layouts_f"] = round(d("LayoutCount") / n, 2)
    r["style_layout_ms_f"] = round(1000 * (d("RecalcStyleDuration") + d("LayoutDuration")) / n, 2)
    return r

def ctx_for(b):
    if desktop: return b.new_context(viewport={"width": 800, "height": 450})
    return b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1, is_mobile=True, has_touch=True)

out = {"label": label, "device": "desktop" if desktop else "phone"}
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-precise-memory-info"])
    BR = b; ctx = ctx_for(b); pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/" + ("?" + site[1:] if site else ""))
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    cdp = ctx.new_cdp_session(pg); cdp.send("Performance.enable")
    pg.evaluate("()=>{const G=__PM.G3,R=G.renderer,r=R.render.bind(R);R.render=(a,b)=>{const t=performance.now();r(a,b);__B.cur+=performance.now()-t;};document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;G.noFallback=true;}")
    pg.evaluate(SAMPLER)
    out["normal"] = phase(pg, cdp, 8000, 12000)
    pg.evaluate("()=>{__PM.CH.on=true;__PM.EVENTS.forEach(e=>{try{__PM.trigger(e.id,true)}catch(_){}})}")
    out["stress"] = phase(pg, cdp, 3000, 12000)
    ctx.close()
    # correctness: the in-game autotest's sim checksum, phases shrunk to almost nothing
    ctx = ctx_for(b); pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    base = route_for(html)
    pg.route("**/*", lambda r: r.fulfill(body=html, content_type="text/html") if r.request.url.startswith("http://bench.local/") else base(r))
    pg.goto(f"http://bench.local/?autotest&scale=0.05&gpu=0&expect={expect}{site}")
    pg.wait_for_function("window.__AUTOTEST", timeout=300000, polling=1000)
    c = pg.evaluate("()=>window.__AUTOTEST.check||{}")
    out["checksum"] = c.get("hash"); out["checksum_pass"] = c.get("pass")
    b.close()
out["errors"] = errs[:5]
(HERE / f"quick-{label}.json").write_text(json.dumps(out, indent=1))
print(json.dumps(out))
