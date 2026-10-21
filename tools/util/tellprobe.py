"""Scratch probe: run a JS snippet against a started season (or survival / free play) and print the JSON result.
Usage: python3 tellprobe.py <index.html> <mode season|surv|free> <js file>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
import sys as _sys, pathlib as _pl; _sys.path.insert(0, str(_pl.Path(__file__).resolve().parents[1]))
from lib import *   # route_for, INIT, HOOK, pick_leader, HERE (= tools/)
html = pathlib.Path(sys.argv[1]).read_text(); mode = sys.argv[2]; js = pathlib.Path(sys.argv[3]).read_text(); extra = sys.argv[4] if len(sys.argv) > 4 else ""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 640, "height": 400}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave" + extra)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    if mode == "free": pg.evaluate("()=>document.getElementById('v2free').click()")
    else:
        pg.evaluate("()=>document.getElementById(%r).click()" % ("v2surv" if mode == "surv" else "v2go"))
        pg.wait_for_function("()=>{const o=document.getElementById('leadOv');return o&&!o.hidden}", timeout=60000)
        pg.evaluate("()=>{document.querySelector('#leadOv .ldcard[data-l=\"hank\"]').click();document.getElementById('ld-go').click()}")
        pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=120000, polling=50)
    pg.evaluate("()=>{__PM.setRunning(false);}")
    r = pg.evaluate(js)
    print(json.dumps(r, indent=1)); print("ERRORS:", errs)
    b.close()
