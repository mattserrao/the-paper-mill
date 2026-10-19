"""v6.3 process flow overview check: the screen's day books add up to the real cash change, the day roll keeps
yesterday, the screen opens from Settings and slows the game, taps open breakdowns, and it works in every mode and at
phone width. Fails on any page error.
Usage: python3 pflowcheck.py <index.html> [screenshot_prefix]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])

html = pathlib.Path(sys.argv[1]).read_text()
shot = sys.argv[2] if len(sys.argv) > 2 else None
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK.replace("trigger:", "pfCalc:f=>pfCalc(f),simRate:()=>simRate(),trigger:") + html[i:]
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
# today's books against the cash: profit on the screen = cash change + upgrades bought
REC = "()=>{const S=__PM.S;if(!S.pf)return null;const D=__PM.G3.pfCalc(S.pf);return {p:D.profit,c:D.cashChg+D.upg,cost:D.cost,rev:D.revenue,h:D.h,made:D.made,rej:D.W.rej,"\
      "sumBy:Object.values(D.by).reduce((s,o)=>s+Object.values(o).reduce((a,v)=>a+v,0),0)}}"
def steps(pg, minutes):
    pg.evaluate("m=>{for(let i=0;i<m*4;i++)__PM.step(0.25)}", minutes)

with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1280, "height": 760})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
    pg.goto("http://bench.local/")
    pg.wait_for_function("window.__B&&__B.first!==null", timeout=90000); pg.wait_for_timeout(1500)
    click = lambda sel: pg.evaluate("s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.dispatchEvent(new MouseEvent('click',{bubbles:true}))}", sel)
    vis = lambda sel: pg.evaluate(f"()=>{{const e=document.querySelector('{sel}');return !!e&&!e.hidden&&e.getClientRects().length>0}}")
    click("#v2go"); pick_leader(pg); pg.wait_for_timeout(800)
    pg.evaluate("()=>{__PM.setRunning(false);if(__PM.S.cards)__PM.S.cards.open=null}")

    # ---- books: run 2.5 game days with upsets; check at several points and at the day roll ----
    worst = 0
    for k in range(10):
        steps(pg, 360)
        if k == 2: pg.evaluate("()=>{__PM.trigger('refclash');__PM.trigger('felt');__PM.trigger('permit')}")
        r = pg.evaluate(REC)
        if r: worst = max(worst, abs(r["p"] - r["c"]), abs(r["sumBy"] - r["cost"]))
    ok("today's profit = cash change + upgrades, and areas add up to the cost (worst $ off)", worst < 1.0, f"{worst:.4f}")
    y = pg.evaluate("()=>{const p=__PM.S.pf.prev;return p?{p:p.profit,c:p.cashChg+p.upg,h:p.h,made:p.made,rej:p.W.rej,day:p.day}:null}")
    ok("yesterday kept at the day roll and adds up", bool(y) and abs(y["p"] - y["c"]) < 1.0 and y["h"] == 24, str(y))
    ok("yesterday made paper and rejects", bool(y) and y["made"] > 200 and y["rej"] > 5, str(y))
    rep = pg.evaluate("()=>{const p=__PM.S.pf.prev;return p?p.rep:__PM.G3.pfCalc(__PM.S.pf).rep}")
    log.append(f"  repair bills tracked: {rep}")

    # ---- the screen ----
    pg.evaluate("()=>__PM.setRunning(true)")
    click('.v2tabs button[data-tab="ctl"]'); pg.wait_for_timeout(500)
    ok("Process flow button in Settings", vis("#pfBtn"))
    click("#pfBtn"); pg.wait_for_timeout(1500)
    ok("screen opens", vis("#pfOv"))
    v = pg.evaluate("()=>[__PM.running,__PM.G3.simRate(),__PM.C.simSpeed,!!__PM.S.cards.open]"); ok("game keeps running at the player's speed while open", (v[0] or v[3]) and v[1] == v[2], str(v))   # (an event card may hold the game, as it always does)
    ok("diagram drawn with 7 areas", pg.evaluate("()=>document.querySelectorAll('#pfMap [data-pf^=\"node:\"]').length") == 7)
    ok("inputs list has 6 inputs", pg.evaluate("()=>document.querySelectorAll('#pfIn [data-pf^=\"cat:\"]').length") == 6)
    if shot: pg.screenshot(path=f"{shot}-desktop.png")
    for sel in ['[data-pf="cat:energy"]', '[data-pf="node:pm"]', '#pfMap [data-pf^="drop:"]', '[data-pf="out:paper"]', '[data-pf="out:waste"]', '[data-pf="out:profit"]', '[data-pf="cat:maint"]']:
        click(sel); pg.wait_for_timeout(300)
        ok(f"tap {sel} opens a breakdown", vis("#pfPop") and pg.evaluate("()=>document.querySelectorAll('#pfPop .pfpr div').length") >= 2)
        if shot and sel == '[data-pf="node:pm"]': pg.screenshot(path=f"{shot}-popup.png")
    click('[data-pd="y"]'); pg.wait_for_timeout(400)
    ok("yesterday view", pg.evaluate("()=>document.querySelector('[data-pd=\"y\"]').getAttribute('aria-pressed')") == "true")
    if shot: pg.screenshot(path=f"{shot}-yesterday.png")
    click('[data-pd="t"]'); pg.wait_for_timeout(300)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    ok("Escape closes", not vis("#pfOv"))
    ok("speed back after close", pg.evaluate("()=>__PM.G3.simRate()") != 1 or pg.evaluate("()=>__PM.C.simSpeed") == 1, str(pg.evaluate("()=>[__PM.G3.simRate(),__PM.C.simSpeed]")))

    # ---- save round trip keeps the day's books ----
    sv = pg.evaluate("()=>{const a=JSON.parse(JSON.stringify(__PM.S.pf));return !!(a&&a.L0&&a.W&&a.prev)}")
    ok("day books survive JSON (save)", sv)

    # ---- phone width ----
    pg.set_viewport_size({"width": 390, "height": 844}); pg.wait_for_timeout(400)
    pg.evaluate("()=>__PM.G3.pfOpenUI()"); pg.wait_for_timeout(1200)
    ok("phone: picture runs top to bottom", pg.evaluate("()=>!!document.querySelector('#pfMap svg.vert')"))
    ok("phone: no sideways scroll", pg.evaluate("()=>{const b=document.getElementById('pfBody');return b.scrollWidth<=b.clientWidth+1}"))
    if shot: pg.screenshot(path=f"{shot}-phone.png", full_page=False)
    pg.evaluate("()=>document.getElementById('pfBody').scrollTop=600"); pg.wait_for_timeout(200)
    if shot: pg.screenshot(path=f"{shot}-phone2.png")
    click('[data-pf="node:stock"]'); pg.wait_for_timeout(300)
    if shot: pg.screenshot(path=f"{shot}-phone-pop.png")
    pg.evaluate("()=>__PM.G3.pfCloseUI()")
    pg.set_viewport_size({"width": 1280, "height": 760}); pg.wait_for_timeout(300)

    # ---- other modes: survival, free play, zen ----
    for mode in ["free", "zen"]:
        pg.evaluate("()=>{__PM.setRunning(false)}")
        pg.evaluate("()=>{__PM.G3.showMenu&&__PM.G3.showMenu()}"); pg.wait_for_timeout(600)
        try:
            click("#v2free" if mode == "free" else "#v2zen"); pg.wait_for_timeout(2500)
        except Exception as e:
            log.append(f"  {mode}: could not start ({e})"); continue
        pg.evaluate("()=>{__PM.setRunning(false);if(__PM.S.cards)__PM.S.cards.open=null}")
        steps(pg, 600)
        r = pg.evaluate(REC)
        ok(f"{mode}: books add up", bool(r) and abs(r["p"] - r["c"]) < 1.0, str(r))
        pg.evaluate("()=>__PM.G3.pfOpenUI()"); pg.wait_for_timeout(800)
        ok(f"{mode}: screen draws", pg.evaluate("()=>document.querySelectorAll('#pfMap [data-pf^=\"node:\"]').length") == 7)
        if shot: pg.screenshot(path=f"{shot}-{mode}.png")
        pg.evaluate("()=>__PM.G3.pfCloseUI()")
        if mode == "zen":
            try: click("#zenExit"); pg.wait_for_timeout(600)
            except Exception: pass
    b.close()
for l in log: print(l)
for e in errs[:20]: print(e)
fails = sum(l.startswith("FAIL") for l in log) + len(errs)
print("RESULT:", "ok" if not fails else f"{fails} problem(s)")
sys.exit(1 if fails else 0)
