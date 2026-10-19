"""v6.5 b5 dryer limit check (claude/dryer-limit-spec.md): at standard running the 3rd section sits at the grade's base
and moisture is 8%; more speed raises demand ~3 kPa per t/h (23m); past the ceiling the sheet goes wet, fails the spec
(paper to the beater), the crew slows the machine until it's back in spec, then speed recovers; the shoe press gives
~16% of the water term back; the DET screen shows it. Usage: python3 dryercheck.py <index.html> [screenshot_prefix]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text(); shot = sys.argv[2] if len(sys.argv) > 2 else None
i = html.rindex("})();", 0, html.rindex("</script>"))
html = html[:i] + HOOK.replace("trigger:", "ups:o=>{Object.assign(S.up,o);applyUpgrades();S.M=mods();},trigger:") + html[i:]
errs, log = [], []
def ok(n, c, x=""): log.append(("PASS " if c else "FAIL ") + n + (f"  ({x})" if x else ""))
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?nobf")
    pg.wait_for_function("window.__B&&__B.first!==null", timeout=120000); pg.wait_for_timeout(600)
    pg.evaluate("()=>document.getElementById('v2free').click()"); pg.wait_for_timeout(600)
    steps = lambda m: pg.evaluate("m=>{__PM.setRunning(false);for(let i=0;i<m*4;i++){if(__PM.S.cards)__PM.S.cards.open=null;__PM.S.inc.length=0;__PM.step(0.25)}}", m)
    D = lambda: pg.evaluate("()=>{const D=__PM.S.dry;return {dem:+D.dem.toFixed(1),m:+D.m.toFixed(2),trim:+D.trim.toFixed(3),wet:D.wet,sp:Math.round(__PM.S.pmSpeed),g:__PM.C.grade,steam:+D.steam.toFixed(1),pm:__PM.S.pm}}")
    pg.evaluate("()=>{__PM.C.grade='23m';__PM.CH.on=false;}"); steps(120)
    d = D(); ok("standard 23m: 3rd section at its base (~122 kPa), 8% moisture", abs(d["dem"] - 122) < 4 and abs(d["m"] - 8) < 0.2, str(d))   # (v6.5.3: the setpoint is 8%, was 7%)
    ok("steam ~50 t/h at standard (1.3 t per t of water)", 45 < d["steam"] < 56, str(d))
    pg.evaluate("()=>{__PM.C.pmSp.auto=false;__PM.C.pmSp.v=3300;}"); steps(60)
    d2 = D(); slope = (d2["dem"] - d["dem"]) / ((d2["sp"] - d["sp"]) / 2736 * 34.8)
    ok("more speed: ~3 kPa per extra t/h on 23m", 2.6 < slope < 3.4, f"{slope:.2f} {d2}")
    pg.evaluate("()=>{__PM.C.pmSp.v=4600;}"); steps(25)
    d3 = D(); off = pg.evaluate("()=>__PM.S.tot.broke")
    ok("past the ceiling the sheet goes wet", d3["m"] > 9 and d3["dem"] > 180, str(d3))
    steps(30); d4 = D()
    ok("wet sheet fails the spec: the crew slows the machine", d4["trim"] > 0.05 and d4["sp"] < d3["sp"], str(d4))
    ok("off-spec paper to the beater while wet", pg.evaluate("()=>__PM.S.tot.broke") > off, "")
    if shot:
        pg.evaluate("()=>__PM.G3.openStation('DET','dcs')"); pg.wait_for_timeout(2500); pg.screenshot(path=f"{shot}-wet.png", clip={"x": 250, "y": 0, "width": 780, "height": 470})
        pg.evaluate("()=>__PM.G3.closeKnobUI()")
    steps(120); d5 = D()
    ok("back in spec under the trimmed speed", d5["m"] < 9.5 and not d5["wet"], str(d5))
    pg.evaluate("()=>{__PM.C.pmSp.v=2736;}"); steps(240); d6 = D()
    ok("speed recovers once there's headroom", d6["trim"] < d4["trim"], str(d6))
    pg.evaluate("()=>{__PM.C.pmSp.v=3600;}"); steps(60); a = D()["dem"]
    pg.evaluate("()=>__PM.ups({shoe:1})"); steps(60); bb = D()["dem"]
    ok("shoe press lowers dryer demand", bb < a - 8, f"{a} -> {bb}")
    b.close()
for l in log: print(l)
for e in errs[:10]: print(e)
fails = sum(l.startswith("FAIL") for l in log) + len(errs)
print("RESULT:", "ok" if not fails else f"{fails} problem(s)"); sys.exit(1 if fails else 0)
