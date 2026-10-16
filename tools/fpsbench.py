"""The Paper Mill frame-cost benchmark (v5.5): a before/after measure that a 60 Hz display cap can't hide.

Usage:
  python3 fpsbench.py <index.html> <label> [--engine=chromium|webkit|both] [--repeat=3] [--secs=12] [--dpr=1.25]
                      [--leader=hank] [--mode=season|survival] [--gfx=medium] [--profile] [--out=DIR]
  python3 fpsbench.py --compare before.json after.json [more.json ...]       # markdown table, % change vs the first

Why not FPS: on a phone the display locks the game at 60 FPS while the frame is only part-full, so FPS stops moving long
before the work does. This measures the work inside each frame instead, in phone emulation (390x844 CSS px, touch,
DPR 1.25 = the iPhone's drawing-buffer density, the game's Auto/medium tier), seeded, at 30 sim-min/s in normal play:

  cpu_ms        main-thread time per frame = sim_scene_ms + submit_ms
    sim_scene_ms  sim step + scene update + overlays, measured with renderer.render skipped so the loop runs at the display
                  rate and time-based work (panel refreshes, route planning, batch checks) is amortized as on a phone
    submit_ms     three.js draw submission (renderer.render, CPU side)
  gpu_ms        GPU time per frame: how long a 1-pixel read-back waits after the render, shadows refreshed every nth frame
                as the tier would at 60 FPS (emulated GPU: software rasterizer, see below)
    fragment_ms   the part that scales with pixels (the same scene measured again at half the pixel ratio: gpu = vertex + fragment * pr^2)
    vertex_ms     the part that doesn't (vertex processing, per-draw and per-pass overhead)
  shadow_refresh_ms  one shadow-map refresh (every frame vs never), and its share per frame at the tier's refresh rate
  frame_ms      cpu_ms + gpu_ms: the frame cost. unlocked_fps = 1000 / frame_ms, what FPS would be with no display cap
  counts        draws (main pass / per shadow refresh), triangles, shader programs, geometries, textures, texture MB,
                page writes, overlay nodes, JS heap growth: machine-independent, compare across sessions directly
  sections      the game's own per-section profiler (G3.PF): ms per frame by part of the 3D frame (no-render phase)

Engines: chromium (V8 + SwiftShader software GPU) is the default; webkit (JavaScriptCore, Safari's engine, software WebGL,
1 ms timer resolution) is a second opinion for the CPU side. GPU ms values come from software rasterizers, so they are only
meaningful as ratios between builds measured in the same session on the same machine; the --compare table shows % change.
Counts transfer across sessions. With --repeat, each metric is the median of the runs and the spread (min-max) is kept.
--profile adds 8 s CPU sampling profiles (chromium): self time per function and per source file (from src/ line offsets).
Writes bench-<label>.json (chromium) or bench-<label>-webkit.json next to this script (or in --out) and prints a summary."""
import json, pathlib, sys, statistics as st, time
from playwright.sync_api import sync_playwright
import pmbench as PB
HERE = pathlib.Path(__file__).parent

args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:] if a.startswith("--")}

# ---------------------------------------------------------------------------------------------------------------------
def load(p): return json.loads(pathlib.Path(p).read_text())
def fmt(v):
    if v is None: return "–"
    if isinstance(v, float): return f"{v:,.2f}" if abs(v) < 100 else f"{v:,.0f}"
    return f"{v:,}" if isinstance(v, int) else str(v)
def pct(a, b):
    try:
        if a in (None, 0) or b is None: return ""
        return f" ({(b - a) / abs(a) * 100:+.0f}%)"
    except Exception: return ""
ROWS = [("frame_ms", "**Frame cost (cpu + gpu), ms**"), ("unlocked_fps", "**Unlocked-equivalent FPS**"),
        ("cpu_ms", "CPU per frame, ms (sim + scene + submit)"), ("sim_scene_ms", "  sim + scene update + overlays, ms"),
        ("submit_ms", "  three.js submission, ms"), ("cpu_p95_ms", "CPU per frame, p95 ms"),
        ("gpu_ms", "GPU per frame, ms (emulated)"), ("fragment_ms", "  fragment-side (scales with pixels), ms"),
        ("vertex_ms", "  vertex/draw-side, ms"), ("shadow_refresh_ms", "Shadow refresh, ms each"), ("shadow_ms_f", "  shadow share per frame at tier Hz, ms"),
        ("draws_main", "Draws per frame, main pass"), ("draws_shadow", "Draws per shadow refresh"), ("tris_k", "Triangles per frame (k, all passes)"),
        ("programs", "Shader programs"), ("geometries", "GPU geometries"), ("textures", "GPU textures"), ("tex_MB", "Texture memory (MB est.)"),
        ("buffer_px_k", "Drawing buffer (k px)"), ("dom_writes_f", "Page writes per frame"), ("overlay_nodes", "HTML overlay nodes over the 3D view"),
        ("alloc_MB_s", "JS heap growth (MB/s)"), ("over33_pct", "Frames over 33 ms CPU (%)")]
if "--compare" in flags:
    runs = [load(p) for p in args]
    print("| Metric | " + " | ".join(r["label"] + (f" ({r['engine']})" if r.get("engine") else "") for r in runs) + " |")
    print("|---|" + "---|" * len(runs))
    for k, name in ROWS:
        vals = [r.get("median", {}).get(k) for r in runs]
        if all(v is None for v in vals): continue
        print(f"| {name} | " + " | ".join([fmt(vals[0])] + [fmt(v) + pct(vals[0], v) for v in vals[1:]]) + " |")
    secs = [r.get("median", {}).get("sections") or {} for r in runs]
    keys = sorted({k for s in secs for k in s}, key=lambda k: -(secs[0].get(k) or 0))[:14]
    if keys:
        print("\nGame sections, ms per frame (G3.PF, no-render phase):\n")
        print("| Section | " + " | ".join(r["label"] for r in runs) + " |"); print("|---|" + "---|" * len(runs))
        for k in keys:
            vals = [s.get(k) for s in secs]
            print(f"| {k} | " + " | ".join([fmt(vals[0])] + [fmt(v) + pct(vals[0], v) for v in vals[1:]]) + " |")
    for r in runs:
        sp = r.get("spread") or {}
        print(f"\n{r['label']} ({r.get('engine')}): {r.get('runs', 1)} run(s), {r.get('ts', '')}; spread (min–max) frame_ms {sp.get('frame_ms')}, cpu_ms {sp.get('cpu_ms')}, gpu_ms {sp.get('gpu_ms')}")
    sys.exit(0)

# ---------------------------------------------------------------------------------------------------------------------
path = args[0]; label = args[1] if len(args) > 1 else pathlib.Path(path).parent.name or "build"
engine = flags.get("--engine", "chromium"); repeat = int(flags.get("--repeat", 1)); SECS = float(flags.get("--secs", 12))
DPR = float(flags.get("--dpr", 1.25)); leader = flags.get("--leader", "hank"); mode = flags.get("--mode", "season")
gfx = flags.get("--gfx", ""); out_dir = pathlib.Path(flags.get("--out", HERE)); profile = "--profile" in flags
html = PB.load_html(path)

def line_map():
    """index.html line -> src file, from build.py's concatenation order (for the profile's per-file split)."""
    S = HERE.parent / "src"
    if not S.exists(): return None
    parts = [("head.html", S / "head.html"), ("styles.css", S / "styles.css"), ("body.html", S / "body.html")]
    parts += [(p.name, p) for p in sorted((S / "js").glob("*.js"))]; parts.append(("tail.html", S / "tail.html"))
    m, line = [], 0
    for name, p in parts:
        m.append((line, name)); line += p.read_text().count("\n")
    return m
def file_of(m, ln):
    name = "?"
    for start, n in m:
        if ln >= start: name = n
        else: break
    return name

def cpu_profile(cdp, pg, secs=8):
    cdp.send("Profiler.enable"); cdp.send("Profiler.setSamplingInterval", {"interval": 500}); cdp.send("Profiler.start")
    pg.wait_for_timeout(int(secs * 1000)); prof = cdp.send("Profiler.stop")["profile"]; cdp.send("Profiler.disable")
    nodes = {n["id"]: n for n in prof["nodes"]}; self_t = {}
    for sid, dt in zip(prof["samples"], prof["timeDeltas"]): self_t[sid] = self_t.get(sid, 0) + dt / 1000
    total = sum(self_t.values()); m = line_map(); by_fn, by_file = {}, {}
    for nid, t in self_t.items():
        cf = nodes[nid]["callFrame"]; fn = cf.get("functionName") or "(anonymous)"; ln = cf.get("lineNumber", -1); url = cf.get("url", "")
        key = fn if fn in ("(idle)", "(program)", "(garbage collector)", "(root)") else f"{fn} @{ln + 1}"
        by_fn[key] = by_fn.get(key, 0) + t
        f = ("(idle/program)" if fn in ("(idle)", "(program)", "(root)") else "(gc)" if fn == "(garbage collector)"
             else file_of(m, ln) if (m and url.startswith("http://bench.local")) else "three.js" if "three" in url else "(native/other)")
        by_file[f] = by_file.get(f, 0) + t
    busy = total - by_fn.get("(idle)", 0)
    top = sorted(((k, v) for k, v in by_fn.items() if k not in ("(idle)", "(program)", "(root)")), key=lambda x: -x[1])[:30]
    return {"secs": secs, "busy_pct": round(100 * busy / max(1, total), 1),
            "by_file_pct_of_busy": {k: round(100 * v / max(1, busy), 1) for k, v in sorted(by_file.items(), key=lambda x: -x[1]) if k != "(idle/program)"},
            "top_self_pct_of_busy": [[k, round(100 * v / max(1, busy), 1)] for k, v in top]}

def one_run(pw, eng):
    b = PB.launch(pw, eng); ctx = PB.phone_context(b, DPR); pg = ctx.new_page(); errs = []
    warm_s = PB.start_game(pg, html, mode, leader, gfx, errs)
    ms = int(SECS * 1000)
    r = {"engine": eng, "warmup_s": warm_s, "leader": leader, "mode": mode, "dpr": DPR}
    cdp = ctx.new_cdp_session(pg) if (profile and eng == "chromium") else None
    hz = pg.evaluate("()=>__PM.G3.shadowHz"); sh_every = max(1, round(60 / (hz or 15)))   # the phone refreshes shadows at hz of its 60 frames
    pg.wait_for_timeout(5000)
    # 1. CPU phase: no renderer.render, the loop runs at the display rate
    pg.evaluate("()=>__F.noRender(true)"); r["cpu"] = PB.phase(pg, 3000, ms)
    if cdp: r["profile_cpu"] = cpu_profile(cdp, pg)
    pg.evaluate("()=>__F.noRender(false)")
    # 2. full phase: rendering with a GPU wait after each frame, shadows refreshed every nth frame as the tier would at 60 FPS
    pg.evaluate("(n)=>{__PM.G3.shadowHz=0;__F.shEvery=n;}", sh_every); r["full"] = PB.phase(pg, 3000, ms)
    if cdp:   # profile the submission without the read-back wait, so the samples show three.js work rather than the GPU stall
        pg.evaluate("()=>{__F.stall=false;}"); r["profile_render"] = cpu_profile(cdp, pg); pg.evaluate("()=>{__F.stall=true;}")
    pr = r["full"]["pr"]
    # 3. the same scene at half the pixel ratio (a quarter of the pixels): separates fragment work from vertex/draw work
    pg.evaluate("(p)=>__F.setPr(p)", pr / 2); r["half"] = PB.phase(pg, 2000, ms)
    pg.evaluate("(p)=>__F.setPr(p)", pr)
    # 4. one shadow refresh's cost: every frame vs never
    pg.evaluate("()=>{__F.shEvery=1;}"); r["shadow_every"] = PB.phase(pg, 2000, int(ms * 0.6))
    pg.evaluate("()=>{__F.shEvery=1e9;__PM.G3.renderer.shadowMap.needsUpdate=false;}"); r["shadow_never"] = PB.phase(pg, 2000, int(ms * 0.6))
    pg.evaluate("(h)=>{__F.shEvery=0;__PM.G3.shadowHz=h;}", hz)
    r["errors"] = errs[:5]
    # derived
    c, f, h = r["cpu"], r["full"], r["half"]
    gpu_f, gpu_h = f["gpu_ms"], h["gpu_ms"]
    frag = max(0.0, (gpu_f - gpu_h) / (1 - (h["pr"] / f["pr"]) ** 2)) if f["pr"] else 0.0
    se, sn = r["shadow_every"], r["shadow_never"]
    sh_each = max(0.0, (se["gpu_ms"] + se["submit_ms"]) - (sn["gpu_ms"] + sn["submit_ms"]))
    cpu = round(c["cpu_ms"] + f["submit_ms"], 2)
    d = {"cpu_ms": cpu, "cpu_p95_ms": round(c["cpu_p95_ms"] + f["submit_ms"], 2), "sim_scene_ms": c["cpu_ms"], "sim_scene_mean_ms": c["cpu_mean_ms"],
         "submit_ms": f["submit_ms"], "submit_mean_ms": f["submit_mean_ms"], "cpu_fps_here": c["fps_here"], "gpu_ms": gpu_f, "gpu_mean_ms": f["gpu_mean_ms"], "gpu_p95_ms": f["gpu_p95_ms"],
         "fragment_ms": round(frag, 2), "vertex_ms": round(max(0.0, gpu_f - frag), 2),
         "shadow_refresh_ms": round(sh_each, 2), "shadow_ms_f": round(sh_each / sh_every, 2),
         "frame_ms": round(cpu + gpu_f, 2), "unlocked_fps": round(1000 / max(0.01, cpu + gpu_f), 1),
         "over33_pct": c["over33_pct"], "sections": c["sections"]}
    for k in ("draws_main", "draws_shadow", "tris_k", "programs", "geometries", "textures", "tex_MB", "buffer_px_k"): d[k] = f[k]
    for k in ("dom_writes_f", "overlay_nodes", "alloc_MB_s"): d[k] = c[k]
    r["summary"] = d
    b.close(); return r

def median_of(runs):
    med, spread = {}, {}
    for k in [k for k in runs[0]["summary"] if k != "sections"]:
        xs = [r["summary"][k] for r in runs if isinstance(r["summary"].get(k), (int, float))]
        if not xs: continue
        med[k] = round(st.median(xs), 2) if isinstance(xs[0], float) else int(st.median(xs)); spread[k] = [min(xs), max(xs)]
    med["sections"] = {k: round(st.median([r["summary"]["sections"].get(k, 0) for r in runs]), 3) for k in runs[0]["summary"].get("sections", {})}
    return med, spread

out_dir.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    for eng in (["chromium", "webkit"] if engine == "both" else [engine]):
        runs = []
        for i in range(repeat):
            t = time.time(); runs.append(one_run(pw, eng)); s = runs[-1]["summary"]
            print(f"[{label} {eng} run {i + 1}/{repeat} {time.time() - t:.0f}s] frame {s['frame_ms']} ms = cpu {s['cpu_ms']} ({s['sim_scene_ms']} + submit {s['submit_ms']}) + gpu {s['gpu_ms']} "
                  f"(fragment {s['fragment_ms']}, vertex {s['vertex_ms']}); draws {s['draws_main']}/{s['draws_shadow']}, tris {s['tris_k']}k, programs {s['programs']}; errors {runs[-1]['errors']}", flush=True)
        med, spread = median_of(runs)
        res = {"label": label, "engine": eng, "build": str(path), "runs": repeat, "secs": SECS, "dpr": DPR, "leader": leader, "mode": mode,
               "ts": time.strftime("%Y-%m-%d %H:%M"), "median": med, "spread": spread, "detail": runs}
        fn = out_dir / f"bench-{label}{'' if eng == 'chromium' else '-' + eng}.json"
        fn.write_text(json.dumps(res, indent=1)); print("wrote", fn)
        print(json.dumps({k: v for k, v in med.items() if k != "sections"}))
        for key in ("profile_cpu", "profile_render"):
            if runs[-1].get(key):
                p = runs[-1][key]; print(f"{key}: busy {p['busy_pct']}% · by file: {json.dumps(dict(list(p['by_file_pct_of_busy'].items())[:12]))}")
                for k, v in p["top_self_pct_of_busy"][:15]: print(f"  {v:5.1f}%  {k}")
