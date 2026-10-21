"""Shared test harness for every tool in tools/ (checks/, perf/, balance/ and the utilities).

    import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))   # (from a subfolder)
    from lib import *

Gives: route_for (serves the page and three.js locally, offline), INIT (seeded Math.random, no tutorial or sound,
frame and draw counters), HOOK (window.__PM test hook for older builds), pick_leader, launch, open_game, lite pages
for sim-only checks, and Checks (one pass/fail log, the RESULT line and the exit code every check ends with).
Replaces the old pattern of exec()-ing a slice of bench.py's source.
"""
import functools, json, statistics, sys, time, pathlib, os   # (json, statistics, time: re-exported for the tools)
from playwright.sync_api import sync_playwright              # (re-exported: every check uses it)


HERE = pathlib.Path(__file__).resolve().parent          # tools/ (node_modules and t186 live here)
_R128 = HERE / "node_modules/three/build/three.min.js"          # r128 (v3.3.4 and early v4)
T186 = HERE / "t186/node_modules/three/build"                                    # r186 (v4 after the upgrade)

def route_for(html):
    """Serve the page and its three.js locally; answer the leaderboard with an empty list; block everything else."""
    def route(r):
        u = r.request.url
        if u.startswith("http://bench.local/"): return r.fulfill(body=html, content_type="text/html")
        if "three@0.186" in u:
            f = "three.core.js" if u.endswith("three.core.js") else "three.module.js"
            return r.fulfill(body=(T186 / f).read_text(), content_type="application/javascript", headers={"Access-Control-Allow-Origin": "*"})
        if "three" in u and u.endswith(".js"): return r.fulfill(body=r128(), content_type="application/javascript")
        if "supabase" in u: return r.fulfill(body="[]", content_type="application/json")
        return r.abort()
    return route

INIT = r"""
(()=>{let s=123456789;Math.random=function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
try{localStorage.setItem("paper-mill-tutorial","off");localStorage.setItem("paper-mill-sound","off");}catch(e){}
window.__PM_NOTITLE=true;   // v5.2: the tools start from the old menu, not the title screen
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


# v5.6: since v5.1 a season starts Select mode -> (map) -> leader picker; the tools that click Season (#v2go) pick a
# leader here so the season really starts (shared by every tool that loads this prelude)
def pick_leader(pg, who="hank", timeout=90000):
    try: pg.wait_for_function("()=>{const o=document.getElementById('leadOv');return o&&!o.hidden}", timeout=timeout)
    except Exception: return False
    pg.evaluate("w=>{document.querySelector('#leadOv .ldcard[data-l=\"'+w+'\"]').click();document.getElementById('ld-go').click()}", who)
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=60000, polling=50)
    return True


@functools.lru_cache(None)
def r128():
    """three.js r128 for old builds (v3.3.4 to early v4). Read only when a page asks for it, so it isn't required for
    current builds (which load r186 from t186/)."""
    return _R128.read_text()

GPU_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
LITE = "gfx=low&nosm"   # sim-only checks: low tier, no static batching (boots ~2 s instead of ~9 s; the sim is unchanged)

def launch(pw, *extra):
    return pw.chromium.launch(args=GPU_ARGS + list(extra))

def read_html(path, extra=""):
    """The built page with the test hook. extra: more members for window.__PM, e.g. 'ups:o=>{...},'."""
    html = pathlib.Path(path).read_text()
    if "window.__PM=" not in html or extra:
        i = html.rindex("})();", 0, html.rindex("</script>"))
        html = html[:i] + (HOOK.replace("trigger:", extra + "trigger:") if extra else HOOK) + html[i:]
    return html

def open_game(b, html, query="", viewport=(1280, 900), errs=None, init=INIT, wait=True):
    """New page on the game: local routing, INIT, page errors into errs, waits for the first frame."""
    pg = b.new_page(viewport={"width": viewport[0], "height": viewport[1]})
    if errs is not None: pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(init)
    pg.goto("http://bench.local/" + (("?" + query.lstrip("?")) if query else ""))
    if wait: pg.wait_for_function("window.__B&&__B.first!==null", timeout=120000)
    return pg

def html_arg(i=1, extra=""):
    """The page under test: argv[i], else $PM_HTML, else ../index.html (the built game)."""
    p = sys.argv[i] if len(sys.argv) > i and not sys.argv[i].startswith("-") else os.environ.get("PM_HTML") or str(HERE.parent / "index.html")
    return read_html(p, extra)

class Checks:
    """One log for a check: ok() records PASS/FAIL lines, errs collects page errors, done() prints the uniform
    RESULT line and exits 1 on any failure or page error (run_checks.py reads both)."""
    def __init__(self, name=None):
        self.name = name or pathlib.Path(sys.argv[0]).stem; self.log, self.errs, self.section = [], [], ""
    def ok(self, name, cond, detail=""):
        self.log.append(("PASS " if cond else "FAIL ") + (f"[{self.section}] " if self.section else "") + str(name)
                        + (f"  ({detail})" if detail not in ("", None) else "")); return bool(cond)
    def note(self, *a): self.log.append("     " + " ".join(str(x) for x in a))
    def sec(self, s): self.section = s
    @property
    def fails(self): return [l for l in self.log if l.startswith("FAIL")]
    def done(self):
        n = sum(l.startswith(("PASS", "FAIL")) for l in self.log); f = self.fails
        print("\n".join(self.log))
        for e in self.errs[:10]: print(e)
        bad = len(f) + (1 if self.errs else 0)
        print(f"RESULT: {'PASS' if not bad else 'FAIL'} {n - len(f)}/{n} checks" + (f", {len(self.errs)} page errors" if self.errs else ""))
        sys.exit(1 if bad else 0)
