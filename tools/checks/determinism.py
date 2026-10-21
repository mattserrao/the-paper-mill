"""Two independent loads of the same season week must play out identically (same upsets, breaks, hayouts, cash),
even with different cosmetic randomness (Math.random seed) in each load.
Replaces tools/determinism.py (which printed DETERMINISTIC / DIFFERENT).
Usage: python3 determinism.py [index.html]"""
# tier: quick
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log

def run(pw, html, seed_math):
    init = INIT.replace("let s=123456789", f"let s={seed_math}")   # different cosmetic randomness each load
    b = launch(pw)
    pg = open_game(b, html, "notitle&" + LITE, viewport=(640, 400), errs=errs, init=init, wait=False)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    # v5.1+ start flow: Season, then the leader picker; the run is paused the moment it starts and its random
    # bottleneck (v4.2.5) pinned, so both loads step the same sim from the same state
    pg.evaluate("()=>document.getElementById('v2go').click()")
    ok(f"seed {seed_math}: season starts", pick_leader(pg, timeout=60000))
    pg.evaluate("()=>{__PM.setRunning(false);__PM.setBn('pulper');}")
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,h=P.SIM_STEP||0.5;P.setRunning(false);const log=[];let seen=0;
        while(S.t<9*1440-1e-9){P.step(h);if(S.tot.incidents>seen){seen=S.tot.incidents;log.push(Math.round(S.t)+":"+S.inc.map(x=>x.id).join("+"));}}
        return {t:S.t,cash:Math.round(S.cash),inc:S.tot.incidents,breaks:S.tot.breaks,hay:S.tot.hayouts||0,first:log.slice(0,8)};}""")
    b.close(); return r

def determinism(pw):
    C.sec("determinism")
    html = html_arg()
    a, b2 = run(pw, html, 111), run(pw, html, 987654)
    C.note(json.dumps(a)); C.note(json.dumps(b2))
    ok("both loads play the season week identically", a == b2, "" if a == b2 else f"{a} vs {b2}")
    ok("the week reached day 9", a["t"] >= 9 * 1440 - 1, a["t"])

with sync_playwright() as pw:
    for f in (determinism,):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()
