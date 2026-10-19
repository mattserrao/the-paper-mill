"""v6.5 b3 DCS expansion check (claude/dcs-expansion-spec.md): every screen (SPOT, WET, DET, UTIL) draws its boxes and
tags with real values; motors stop their step like an upset and the operators restart them after 30 min; a purge left
in manual plugs the cleaner; the DCS setpoints move the Process flow controls (and stay locked in a season); upsets show
on the right screen. Screenshots of each screen (desktop and phone) when a prefix is given. Fails on any page error.
Usage: python3 dcscheck.py <index.html> [screenshot_prefix]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
shot = sys.argv[2] if len(sys.argv) > 2 else None
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
errs, log = [], []
def ok(name, cond, extra=""): log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?nobf")
    pg.wait_for_function("window.__B&&__B.first!==null", timeout=120000); pg.wait_for_timeout(1000)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg); pg.wait_for_timeout(500)
    pg.evaluate("()=>{__PM.setRunning(false);if(__PM.S.cards)__PM.S.cards.open=null;for(let i=0;i<4*120;i++)__PM.step(0.25)}")
    steps = lambda m: pg.evaluate("m=>{for(let i=0;i<m*4;i++){if(__PM.S.cards)__PM.S.cards.open=null;__PM.step(0.25)}}", m)
    want = {"SPOT": 15, "WET": 7, "DET": 8, "UTIL": 6}
    for a, n in want.items():
        pg.evaluate(f"()=>__PM.G3.openStation('{a}','dcs')"); pg.wait_for_timeout(400)
        st = pg.evaluate("()=>{const o=document.getElementById('dcsOv');const tags=[...o.querySelectorAll('[data-tag]')].map(t=>t.textContent);return {eq:o.querySelectorAll('.mimic rect').length,tags:tags.length,bad:tags.filter(t=>/undefined|NaN|^–?$/.test(t)&&t!=='–')}}")
        ok(f"{a}: {n} boxes drawn", st["eq"] == n, str(st["eq"]))
        ok(f"{a}: every tag has a value", st["tags"] >= 6 and not st["bad"], str(st))
        if shot: pg.screenshot(path=f"{shot}-{a}.png", full_page=False)
    # ---- motors: OFF stops the step like its upset, operators restart after 30 min ----
    pg.evaluate("()=>__PM.G3.openStation('SPOT','dcs')"); pg.wait_for_timeout(300)
    pg.evaluate("()=>document.querySelector('[data-dm=\"conv\"] [data-mv=\"off\"]').click()"); pg.wait_for_timeout(200)
    try: pg.wait_for_function("()=>[...document.querySelectorAll('#dcsAl li')].some(l=>l.textContent.includes('BALE CONVEYOR'))", timeout=10000)
    except Exception: pass
    s = pg.evaluate("()=>({inc:__PM.S.inc.some(i=>i.id==='m_conv'),feed:__PM.S.M.feedMul,st:__PM.G3.dcs.motStatus('conv'),al:[...document.querySelectorAll('#dcsAl li')].map(l=>l.textContent)})")
    ok("bale conveyor OFF: stops the feed like an upset", s["inc"] and s["feed"] == 0 and s["st"] == "off", str(s))
    ok("bale conveyor OFF: alarm on SPOT with the restart countdown", any("BALE CONVEYOR STOPPED" in t for t in s["al"]), str(s["al"]))
    steps(31)
    s = pg.evaluate("()=>({inc:__PM.S.inc.some(i=>i.id==='m_conv'),st:__PM.G3.dcs.motStatus('conv'),mode:__PM.S.dcs.mot.conv})")
    ok("operators restart it after 30 min (back to AUTO)", not s["inc"] and s["st"] == "run" and s["mode"] == "auto", str(s))
    pg.evaluate("()=>__PM.G3.dcs.motSet('fscr','off')"); steps(5); pg.evaluate("()=>__PM.G3.dcs.motSet('fscr','on')"); steps(1)
    s = pg.evaluate("()=>({inc:__PM.S.inc.some(i=>i.id==='m_fscr'),st:__PM.G3.dcs.motStatus('fscr'),pd:__PM.S.M.pulperDown})")
    ok("starting a motor early from the DCS clears it at once", not s["inc"] and s["st"] == "run", str(s))
    pg.evaluate("()=>__PM.G3.dcs.motSet('fog','off')"); steps(1)
    ok("fog fan OFF shows on WET, not SPOT", pg.evaluate("()=>__PM.G3.dcs.dcsArea('m_fog')") == "WET")
    pg.evaluate("()=>__PM.G3.dcs.motSet('fog','auto')")
    # ---- purges: manual builds pressure until it plugs ----
    pg.evaluate("()=>__PM.G3.dcs.purgeSet('lc','manual')"); steps(60)
    dp = pg.evaluate("()=>__PM.S.dcs.pg.lc.dp")
    pg.evaluate("()=>__PM.G3.dcs.purgeNow('lc')")
    ok("LC flush in manual: pressure builds, purge resets it", dp > 65 and pg.evaluate("()=>__PM.S.dcs.pg.lc.dp") == 60, f"{dp:.1f}")
    steps(420)
    s = pg.evaluate("()=>({plug:__PM.S.inc.some(i=>i.id==='lcplug')||__PM.S.tot.incidents>0,mode:__PM.S.dcs.pg.lc.m,ev:(__PM.S.evc||{}).lcplug||0})")
    ok("LC flush left in manual plugs the cleaners (and goes back to AUTO)", s["ev"] >= 1 and s["mode"] == "auto", str(s))
    # ---- setpoints move the Process flow controls; locked in a season ----
    s = pg.evaluate("()=>{const r=document.querySelector('#dcsOv [data-ds=\"cvsp\"] [data-dsv]');return {dis:r.disabled,lock:document.body.classList.contains('season-lock')}}")
    ok("season: DCS setpoints locked like Process flow", s["dis"] and s["lock"], str(s))
    pg.evaluate("()=>{document.getElementById('v2free')&&0;__PM.S.free=true;document.querySelectorAll('#cards .row[data-key] input,#cards .row[data-key] button.auto').forEach(e=>e.disabled=false);document.body.classList.remove('season-lock');}")
    pg.evaluate("()=>{__PM.G3.openStation('SPOT','dcs');const r=document.querySelector('#dcsOv [data-ds=\"lvt\"] [data-dsv]');r.value=55;r.dispatchEvent(new Event('input',{bubbles:true}))}")
    ok("chest level target set on SPOT moves the Process flow control", pg.evaluate("()=>__PM.C.lvlTarget.v") == 55, str(pg.evaluate("()=>__PM.C.lvlTarget.v")))
    pg.evaluate("()=>{__PM.G3.openStation('WET','dcs');const r=document.querySelector('#dcsOv [data-ds=\"wsp\"] [data-dsv]');r.value=2500;r.dispatchEvent(new Event('input',{bubbles:true}))}")
    w = pg.evaluate("()=>[__PM.C.pmSp.v,__PM.C.pmSp.auto]")
    ok("wire speed on WET sets the reel by the draws (and goes MANUAL)", 2550 < w[0] < 2650 and w[1] is False, str(w))
    pg.evaluate("()=>{__PM.G3.openStation('DET','dcs')}"); pg.wait_for_timeout(200)
    d = pg.evaluate("()=>document.querySelector('#dcsOv [data-ds=\"wsp\"] [data-dsv]').value")
    ok("DET shows the same wire speed", abs(float(d) - 2500) < 10, str(d))
    # ---- upsets on the right screen ----
    pg.evaluate("()=>{__PM.trigger('slime');__PM.trigger('shaft');__PM.trigger('permit')}"); steps(1)
    for a, txt in [("WET", "SLIME"), ("DET", "DRIVESHAFT"), ("UTIL", "PERMIT")]:
        pg.evaluate(f"()=>__PM.G3.openStation('{a}','dcs')"); pg.wait_for_timeout(250)
        al = pg.evaluate("()=>[...document.querySelectorAll('#dcsAl li')].map(l=>l.textContent).join(' | ')")
        ok(f"{a}: shows its upset ({txt})", txt in al.upper(), al)
    pg.evaluate("()=>__PM.G3.openStation('SPOT','dcs')"); pg.wait_for_timeout(250)
    al = pg.evaluate("()=>[...document.querySelectorAll('#dcsAl li')].map(l=>l.textContent).join(' | ')")
    ok("SPOT doesn't show machine upsets", "SLIME" not in al and "DRIVESHAFT" not in al, al)
    if shot:
        pg.evaluate("()=>{const o=document.getElementById('dcsOv');o.querySelector('.dcsb').scrollTop=520}"); pg.wait_for_timeout(200); pg.screenshot(path=f"{shot}-SPOT-rows.png")
        pg.set_viewport_size({"width": 390, "height": 844}); pg.wait_for_timeout(300)
        for a in ["SPOT", "DET"]:
            pg.evaluate(f"()=>__PM.G3.openStation('{a}','dcs')"); pg.wait_for_timeout(400); pg.screenshot(path=f"{shot}-{a}-phone.png")
    b.close()
for l in log: print(l)
for e in errs[:20]: print(e)
fails = sum(l.startswith("FAIL") for l in log) + len(errs)
print("RESULT:", "ok" if not fails else f"{fails} problem(s)")
sys.exit(1 if fails else 0)
