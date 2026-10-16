"""Precise A/B of one switch on one loaded page: alternates A, B, A, B ... (default 4 pairs) and reports the mean CPU
submission and GPU (read-back) ms per frame of each, so a 0.1 ms CPU or 3% GPU difference shows through the emulator's noise.
Usage: python3 abtest.py <index.html> <name> "<js to switch on>" "<js to switch off>" [--pairs=4] [--secs=6] [--engine=chromium|webkit]
Both JS snippets are arrow functions, e.g. "()=>{__PM.G3.SM.bms.forEach(b=>b.perObjectFrustumCulled=true)}"."""
import sys, json, statistics as st
from playwright.sync_api import sync_playwright
import pmbench as PB
args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:] if a.startswith("--")}
html = PB.load_html(args[0]); name = args[1]; ON, OFF = args[2], args[3]
pairs = int(flags.get("--pairs", 4)); secs = float(flags.get("--secs", 6)); eng = flags.get("--engine", "chromium")
with sync_playwright() as pw:
    b = PB.launch(pw, eng); ctx = PB.phone_context(b); pg = ctx.new_page(); errs = []
    PB.start_game(pg, html, errs=errs)
    hz = pg.evaluate("()=>__PM.G3.shadowHz"); pg.evaluate("(n)=>{__PM.G3.shadowHz=0;__F.shEvery=n;}", max(1, round(60 / (hz or 15))))
    pg.wait_for_timeout(5000)
    A, B = [], []
    for i in range(pairs):
        pg.evaluate(ON); A.append(PB.phase(pg, 1500, int(secs * 1000)))
        pg.evaluate(OFF); B.append(PB.phase(pg, 1500, int(secs * 1000)))
    def m(rs, k): return round(st.fmean(r[k] for r in rs), 2)
    keys = ["submit_mean_ms", "submit_ms", "gpu_mean_ms", "gpu_ms", "draws_main", "draws_shadow", "tris_k"]
    print(f"{name}: {pairs} pairs x {secs} s each ({eng})")
    print("  " + " ".join(f"{k:>16s}" for k in keys))
    print("  ON  " + " ".join(f"{m(A, k):16}" for k in keys))
    print("  OFF " + " ".join(f"{m(B, k):16}" for k in keys))
    print("  per pair ON/OFF submit:", [(r["submit_mean_ms"], s["submit_mean_ms"]) for r, s in zip(A, B)], " gpu:", [(r["gpu_mean_ms"], s["gpu_mean_ms"]) for r, s in zip(A, B)])
    print("  errors", errs[:2]); b.close()
