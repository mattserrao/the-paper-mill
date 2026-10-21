"""Save/continue checks (v4.2 save test): a saved run continues exactly (same cash, upsets, breaks, clock, pending card
outcomes and felt grade two days later as the uninterrupted run), the menu offers Continue, a hidden page saves and
pauses (and shows "Welcome back" on return), and a corrupt or old-version save is ignored (no Continue button).
Replaces tools/savecheck.py (which only printed; tools/savecheck51.py was an outdated copy).
Usage: python3 save.py [index.html]"""
# tier: quick
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log

STEP = "(n)=>{const P=__PM;for(let k=0;k<n;k++)P.step(0.25);const S=P.S;return [Math.round(S.cash),S.tot.incidents,S.tot.breaks,Math.round(S.t),S.cards.pend.length,Math.round(S.fg)]}"
Q = "?" + LITE   # sim-only: the save/continue path does not depend on the 3D tier

def save(pw):
    C.sec("save")
    html = html_arg()
    b = launch(pw)
    ctx = b.new_context(viewport={"width": 800, "height": 450})   # one context: the pages share localStorage
    def page():
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:200]))
        pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/" + Q)
        pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300); return pg
    pg = page()
    pg.evaluate("()=>{document.getElementById('v2go').click()}")
    ok("season starts", pick_leader(pg))   # (v5.6: the v5.1 leader picker)
    pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;}")
    # play 3 days with upsets and accept every card that comes up, so pending outcomes exist
    pg.evaluate("""()=>{const P=__PM;for(let k=0;k<3*1440*4;k++){if(k%1500===0)P.S.cards.next=P.S.t;P.step(0.25);const o=P.S.cards.open;if(o&&o.c){document.getElementById('deal-yes').click();P.setRunning(false);}else if(o)P.S.cards.open=null;}}""")
    st = pg.evaluate("()=>[__PM.S.cards.pend.map(p=>p.h),__PM.S.fx.map(f=>f.id),Math.round(__PM.S.t)]")
    C.note("before save: pending", st)
    ok("pending card outcomes exist before the save (so the save carries them)", len(st[0]) > 0, st[0])
    ms = pg.evaluate("()=>{const ok=__PM.G3.save.save('test');window.__sv=localStorage.getItem('paper-mill-save');return [ok,__PM.G3.saveMs,window.__sv.length]}")
    ok("save succeeds", ms[0] is True and ms[2] > 1000, f"ok={ms[0]} {ms[1]:.1f} ms {ms[2]} bytes")
    a = pg.evaluate(STEP, 2 * 1440 * 4); C.note("uninterrupted day 5:", a)
    pg.evaluate("()=>{__PM.G3.saveOff=true;localStorage.setItem('paper-mill-save',window.__sv);}")   # (the autosave has moved on since: put the test save back)
    pg.close()

    pg = page()
    has = pg.evaluate("()=>!!document.getElementById('v2cont')&&document.getElementById('v2cont').textContent")
    ok("menu shows a Continue button", bool(has) and "Continue" in has, has)
    # click and pause in one go: waiting for running===true first let a frame or two of sim slip in (a flaky DIFFER)
    r = pg.evaluate("()=>{document.getElementById('v2cont').click();const was=__PM.running;__PM.setRunning(false);return was}")
    ok("Continue starts the game", r is True)
    bb = pg.evaluate(STEP, 2 * 1440 * 4); C.note("restored day 5:", bb)
    ok("restored run continues exactly like the uninterrupted one", a == bb, f"{a} vs {bb}")

    # hidden page: save + pause + welcome back
    pg.evaluate("()=>__PM.setRunning(true)")
    pg.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));}")
    h = pg.evaluate("()=>[__PM.running,JSON.parse(localStorage.getItem('paper-mill-save')).why]")
    ok("hidden page pauses", h[0] is False)
    ok("hidden page saves (why=hidden)", h[1] == "hidden", h[1])
    pg.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));}")
    w = pg.evaluate("()=>[!document.getElementById('v2menu').hidden,document.getElementById('v2state').textContent]")
    ok("back on the page: menu shown with Welcome back", w[0] and "Welcome back" in w[1], w)
    pg.close()

    # a corrupt save and an old version: the game must start normally with no Continue
    for bad in ['"{not json"', 'JSON.stringify({v:0,S:{}})']:
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:200]))
        pg.route("**/*", route_for(html)); pg.goto("http://bench.local/" + Q)
        pg.evaluate(f"()=>localStorage.setItem('paper-mill-save',{bad})"); pg.reload()
        pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300)
        ok(f"bad save {bad[:22]} -> game starts, no Continue button", not pg.evaluate("()=>!!document.getElementById('v2cont')"))
        pg.close()
    b.close()

with sync_playwright() as pw:
    for f in (save,):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()      # page errors fail the check
