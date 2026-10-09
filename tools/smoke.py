"""Smoke test: drives the menu, tutorial, every sheet tab, top-bar controls, upsets, a full 30-day season,
zen mode, free play, leaderboard, rename, recolor and reset. Fails on any page error.
Usage: python3 smoke.py <index.html> [screenshot_prefix]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])

html = pathlib.Path(sys.argv[1]).read_text()
shot = sys.argv[2] if len(sys.argv) > 2 else None
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
INIT2 = INIT.replace('localStorage.setItem("paper-mill-tutorial","off");', '')
errs, log = [], []
def ok(name, cond):
    log.append(("PASS " if cond else "FAIL ") + name)
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 900, "height": 640})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT2)
    pg.goto("http://bench.local/")
    pg.wait_for_function("window.__B&&__B.first!==null", timeout=60000)
    pg.wait_for_timeout(1500)
    vis = lambda sel: pg.evaluate(f"()=>{{const e=document.querySelector('{sel}');return !!e&&!e.hidden&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'}}")
    click = lambda sel: pg.evaluate("s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click()}", sel)
    ok("menu visible on load", vis("#v2menu"))
    if shot: pg.screenshot(path=f"{shot}-menu.png")
    click("#v2go")
    try: pg.wait_for_function("()=>{const e=document.getElementById('tut');return !!e&&!e.hidden}", timeout=8000)
    except Exception: pass
    ok("tutorial opens", vis("#tut"))
    for _ in range(20):
        if not vis("#tutNext"): break
        click("#tutNext"); pg.wait_for_timeout(120)
    ok("tutorial closes", not vis("#tut"))
    ok("running after tutorial", pg.evaluate("()=>__PM.running"))
    ok("season on", pg.evaluate("()=>!!(__PM.S.season&&__PM.S.season.on)"))
    for tab in ("shop", "chaos", "ctl", "stats"):
        click(f'.v2tabs button[data-tab="{tab}"]'); pg.wait_for_timeout(500)
        ok(f"sheet {tab} opens", pg.evaluate("()=>document.getElementById('v2sheet').classList.contains('open')"))
        if shot and tab == "stats": pg.screenshot(path=f"{shot}-stats.png")
        click("#v2close"); pg.wait_for_timeout(200)
    sp0 = pg.evaluate("()=>__PM.C.simSpeed")
    click("#v2fast"); pg.wait_for_timeout(100)
    ok("faster", pg.evaluate("()=>__PM.C.simSpeed") > sp0)
    click("#v2slow"); click("#v2slow"); pg.wait_for_timeout(100)
    ok("slower", pg.evaluate("()=>__PM.C.simSpeed") < sp0)
    click("#v2sound"); click("#v2lblBtn"); click("#v2stats"); pg.wait_for_timeout(300); click("#v2stats")
    click("#v2pause"); pg.wait_for_timeout(300)
    ok("pause shows menu", vis("#v2menu") and not pg.evaluate("()=>__PM.running"))
    click("#v2go"); pg.wait_for_timeout(300)
    ok("resume", pg.evaluate("()=>__PM.running"))
    pg.evaluate("()=>{__PM.CH.on=true;__PM.EVENTS.forEach(e=>{try{__PM.trigger(e.id,true)}catch(_){}})}")
    pg.wait_for_timeout(2500)
    if shot: pg.screenshot(path=f"{shot}-upsets.png")
    pg.evaluate("""()=>{const S=__PM.S;let n=0;while(S.season&&S.season.on&&n<200000){__PM.step(0.5);n++;}return n}""")
    pg.wait_for_timeout(800)
    ok("season ended", pg.evaluate("()=>!!(__PM.S.season&&__PM.S.season.done)"))
    ok("season summary shown", vis("#seasonOv"))
    if shot: pg.screenshot(path=f"{shot}-summary.png")
    click("#so-more"); pg.wait_for_timeout(300)
    st = pg.evaluate("()=>({run:__PM.running,cards:JSON.stringify(Object.keys(__PM.S.cards&&__PM.S.cards.open||{})),ovs:[...document.querySelectorAll('.overlay')].filter(o=>!o.hidden).map(o=>o.id),menu:!document.getElementById('v2menu').hidden})")
    ok("one more turn runs (or an event card paused it)", st["run"] or "dealOv" in st["ovs"]); log.append("  after one-more-turn: " + str(st))
    click("#v2pause"); pg.wait_for_timeout(200)
    click("#v2zen"); pg.wait_for_timeout(2000)
    ok("zen on", pg.evaluate("()=>!!__PM.S.zen"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(600)
    zs = pg.evaluate("()=>!!__PM.S.zen"); log.append(f"  zen after Esc={zs} menu={vis('#v2menu')}")
    if zs: click("#zenExit"); pg.wait_for_timeout(600)
    ok("zen off -> menu", not pg.evaluate("()=>!!__PM.S.zen") and vis("#v2menu"))
    click("#v2board"); pg.wait_for_timeout(500)
    ok("leaderboard opens", vis("#lbOv")); click("#lb-close"); pg.wait_for_timeout(200)
    click("#v2rename"); pg.evaluate("()=>{document.getElementById('v2name').value='Smoke Test Mill'}"); pg.evaluate("()=>document.getElementById('v2name').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))"); pg.wait_for_timeout(500)
    ok("rename", pg.evaluate("()=>document.getElementById('v2mt').textContent") == "Smoke Test Mill")
    click("#v2colors"); pg.wait_for_timeout(200)
    click("#v2free"); pg.wait_for_timeout(300)
    ok("free play", pg.evaluate("()=>!!__PM.S.free") and pg.evaluate("()=>__PM.running"))
    click("#v2pause"); click("#v2reset"); click("#v2reset"); pg.wait_for_timeout(500)
    ok("reset", pg.evaluate("()=>__PM.S.t") < 60 and pg.evaluate("()=>__PM.running"))
    pg.wait_for_timeout(1500)
    if shot: pg.screenshot(path=f"{shot}-end.png")
    b.close()
fails = [l for l in log if l.startswith("FAIL")]
print("\n".join(log)); print("ERRORS:", errs[:12] or "none")
print("RESULT:", "OK" if not fails and not errs else f"{len(fails)} fails, {len(errs)} errors")
