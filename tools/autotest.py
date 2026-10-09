"""Run the in-game autotest (?autotest) headless, the way a phone would, and check its results page.

Usage: python3 autotest.py index.html [scale] [--desktop] [--expect=<hash>] [--shot=out.png]

Emulates a phone (390x844 @2x, touch) unless --desktop. scale shortens every phase (default 0.3 here; the real
device test uses 1). Prints the summary and the sim checksum, and fails on page errors or a missing results page.
Also clicks "Copy results" and confirms the clipboard holds the same JSON.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])   # route_for, three.js serving

args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:] if a.startswith("--")}
html = pathlib.Path(args[0]).read_text()
scale = args[1] if len(args) > 1 else "0.3"
q = f"?autotest&scale={scale}" + (f"&expect={flags['--expect']}" if "--expect" in flags else "")
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-precise-memory-info"])
    if "--desktop" in flags: ctx = b.new_context(viewport={"width": 1000, "height": 700})
    else: ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin="https://bench.local")
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    base = route_for(html)   # GitHub Pages is https, and the clipboard API needs a secure page, so serve it as https here too
    pg.route("**/*", lambda r: r.fulfill(body=html, content_type="text/html") if r.request.url.startswith("https://bench.local/") else base(r))
    pg.goto("https://bench.local/" + q)
    pg.wait_for_function("window.__AUTOTEST", timeout=600000, polling=1000)
    r = pg.evaluate("()=>window.__AUTOTEST")
    stored = {k: pg.evaluate(f"()=>{{try{{return localStorage.getItem('{k}')}}catch(e){{return 'ERR'}}}}") for k in ("paper-mill-fps", "paper-mill-tutorial", "paper-mill-local-scores")}
    pg.wait_for_selector("#atCopy"); pg.click("#atCopy"); pg.wait_for_timeout(300)
    clip = pg.evaluate("()=>navigator.clipboard.readText()")
    label = pg.inner_text("#atCopy")
    if "--shot" in flags: pg.screenshot(path=flags["--shot"], full_page=False)
    b.close()
summ = {k: r[k] for k in ("app", "build", "gpu", "display_hz_est", "verdict", "total_s", "pauses", "hidden", "errors")}
summ["phases"] = {k: {x: v[x] for x in ("fps", "p50", "p95", "p99", "worst", "over33", "over50", "js_mean", "draws", "tris_k", "canvas", "shadows", "programs")} for k, v in r["phases"].items()}
summ["check"] = r.get("check"); summ["fatal"] = r.get("fatal")
print(json.dumps(summ, indent=1))
print("json bytes", len(json.dumps(r)), "| copy button:", label, "| clipboard matches:", bool(clip) and json.loads(clip) == r)
print("saved settings after the test:", stored)
ok = not errs and not r.get("fatal") and not r["errors"] and clip and json.loads(clip) == r and stored == {"paper-mill-fps": None, "paper-mill-tutorial": None, "paper-mill-local-scores": None}
print("page errors:", errs)
print("AUTOTEST OK" if ok else "AUTOTEST PROBLEM")
sys.exit(0 if ok else 1)
