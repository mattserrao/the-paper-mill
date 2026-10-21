"""Run the in-game autotest (?autotest) headless, the way a phone would, and check its results page (~10 min).

Emulates a phone (390x844 @2x, touch) unless --desktop. scale shortens every phase (default 0.3 here; the real
device test uses 1). Prints the summary and the sim checksum, and fails on page errors, a fatal or in-test error, a
missing results page, a "Copy results" clipboard that does not hold the same JSON, or settings left behind in storage.
Replaces tools/autotest.py.
Usage: python3 autotest.py [index.html] [scale] [--desktop] [--expect=<hash>] [--shot=out.png]"""
# tier: slow
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log

args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:] if a.startswith("--")}
scale = args[1] if len(args) > 1 else "0.3"
q = f"?autotest&scale={scale}" + (f"&expect={flags['--expect']}" if "--expect" in flags else "")

def autotest(pw):
    C.sec("autotest")
    html = html_arg()   # (the autotest runs on the page as built: no INIT, no test hook needed)
    b = launch(pw, "--enable-precise-memory-info")
    if "--desktop" in flags: ctx = b.new_context(viewport={"width": 1000, "height": 700})
    else: ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin="https://bench.local")
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:200]))
    base = route_for(html)   # GitHub Pages is https, and the clipboard API needs a secure page, so serve it as https here too
    pg.route("**/*", lambda r: r.fulfill(body=html, content_type="text/html") if r.request.url.startswith("https://bench.local/") else base(r))
    pg.goto("https://bench.local/" + q)
    pg.wait_for_function("window.__AUTOTEST", timeout=900000, polling=1000)
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
    C.note("json bytes", len(json.dumps(r)), "| copy button:", label)
    ok("results page reached with no fatal error", not r.get("fatal"), r.get("fatal"))
    ok("no errors recorded inside the autotest", not r["errors"], r["errors"][:3] if r["errors"] else "")
    ok("Copy results puts the same JSON on the clipboard", bool(clip) and json.loads(clip) == r, label)
    ok("the test leaves no settings behind in storage", stored == {"paper-mill-fps": None, "paper-mill-tutorial": None, "paper-mill-local-scores": None}, stored)
    if "--expect" in flags:
        ok("sim checksum matches --expect", (r.get("check") or {}).get("pass") is True, r.get("check"))

with sync_playwright() as pw:
    for f in (autotest,):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()      # page errors fail the check
