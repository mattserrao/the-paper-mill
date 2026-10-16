"""v5.0.1 speed check (v5.0.6: outages run at the player's speed; the cap is the opt-in Watch the crews): the player's speed is the only speed and nothing overwrites it. A planned outage only caps the
speed the game runs at (simRate), zen runs at 1, and when either ends the game is back at the player's speed with nothing
to restore. Covers: speed buttons during an outage, a save and Continue in the middle of an outage, zen during an outage,
and an old (pre-v5.0.1) save that kept the slowed speed. Usage: python3 speedcheck.py <index.html>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / 'bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
html = html.replace("window.__PM={", "window.__PM={simRate:()=>simRate(),setZen:v=>setZen(v),", 1)
fails = []
def ok(name, cond, got=None):
    print(("ok   " if cond else "FAIL ") + name + ("" if cond else f"   got: {got}")); (None if cond else fails.append(name))
CLR = "const clr=()=>{const o=P.S.cards.open;if(!o)return;if(o.c)document.getElementById('deal-no').click();else if(o.outage)document.getElementById('out-ok').click();else if(o.report)document.getElementById('rc-ok').click();if(P.S.cards.open)P.S.cards.open=null;if(P.S.civ){P.S.civ.cur=null;P.S.civ.pending=null;if(P.S.civ.q)P.S.civ.q.length=0;}P.setRunning(false);};"   # (v5.6: v5.1 civics choices hold the outage notice back too)
TO_OUT = "()=>{const P=__PM;" + CLR + "let k=0;while(!P.S.outg.on&&k++<9*1440*4){P.step(0.25);clr();}P.setRunning(false);return P.S.outg.on}"
TO_END = "()=>{const P=__PM;" + CLR + "let k=0;while(P.S.outg.on&&k++<1440*4){P.step(0.25);clr();}P.setRunning(false);return !P.S.outg.on}"
def txt(pg, want):
    try: pg.wait_for_function("(w)=>document.getElementById('v2speed').textContent.includes(w)", arg=want, timeout=20000, polling=100); return True
    except Exception: return False
ST = "()=>({c:__PM.C.simSpeed,rate:__PM.simRate(),on:__PM.S.outg.on,k:__PM.S.outg.k,txt:document.getElementById('v2speed').textContent})"
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    ctx = b.new_context(viewport={"width": 800, "height": 450}); errs = []
    def page():
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)[:200])); pg.route("**/*", route_for(html))
        pg.add_init_script(INIT.replace("localStorage.clear()", "0") if "localStorage.clear()" in INIT else INIT); pg.goto("http://bench.local/")
        pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300); return pg
    pg = page()
    pg.evaluate("()=>{document.getElementById('v2go').click()}");pick_leader(pg)   # (v5.6: the v5.1 leader picker)
    pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;const f=document.getElementById('v2fast');while(__PM.C.simSpeed<120)f.click();}")
    ok("the player picks 120", pg.evaluate(ST)["c"] == 120)
    pg.evaluate(TO_OUT); t = txt(pg, "120 min/s"); s = pg.evaluate(ST)
    ok("outage 1 (v5.0.6): runs at the player's 120, not capped", s["on"] and s["rate"] == 120 and s["c"] == 120 and t, s)
    pg.evaluate("()=>{const b=document.getElementById('out-watch');clearTimeout(document.getElementById('outOv')._t);if(b)b.click();else __PM.S.outg.watch=true;}"); t = txt(pg, "Watching crews · 5 min/s"); s = pg.evaluate(ST)
    ok("outage 1: Watch the crews runs it at 5, the player's 120 untouched, the readout says so", s["on"] and s["rate"] == 5 and s["c"] == 120 and t, s)
    pg.evaluate("()=>document.getElementById('v2slow').click()"); s = pg.evaluate(ST)
    ok("outage 1: the first tap of slower stops watching (back to 120), the speed itself unchanged", s["c"] == 120 and s["rate"] == 120 and not pg.evaluate("()=>__PM.S.outg.watch"), s)
    pg.evaluate("()=>document.getElementById('v2slow').click()"); s = pg.evaluate(ST)
    ok("outage 1: the next tap changes the speed (60)", s["c"] == 60 and s["rate"] == 60, s)
    pg.evaluate("()=>{__PM.S.outg.watch=true}"); s = pg.evaluate(ST)
    ok("outage 1: watching again runs at 5", s["rate"] == 5 and s["c"] == 60, s)
    # save in the middle of the outage, reload, Continue
    pg.evaluate("()=>{__PM.G3.save.save('test');window.__sv=localStorage.getItem('paper-mill-save');__PM.G3.saveOff=true;}")
    sv = pg.evaluate("()=>window.__sv"); pg.close()
    pg = page(); pg.evaluate("(v)=>localStorage.setItem('paper-mill-save',v)", sv); pg.close(); pg = page()
    pg.evaluate("()=>{document.getElementById('v2cont').click();__PM.setRunning(false);}"); pg.wait_for_timeout(300); s = pg.evaluate(ST)
    ok("continue mid-outage while watching: still in the outage at 5, the player's speed is 60", s["on"] and s["rate"] == 5 and s["c"] == 60, s)
    pg.evaluate(TO_END); t = pg.evaluate("()=>{__PM.setRunning(true);return 1}") and txt(pg, "60 min/s") and not pg.evaluate("()=>document.getElementById('v2speed').textContent.includes('Watching')"); pg.evaluate("()=>__PM.setRunning(false)"); s = pg.evaluate(ST)
    ok("outage 1 ends: back at 60 with nothing restored, watching over", not s["on"] and s["rate"] == 60 and s["c"] == 60 and t and "Watching" not in s["txt"] and not pg.evaluate("()=>__PM.S.outg.watch"), s)
    # zen in the middle of outage 2
    pg.evaluate(TO_OUT); pg.evaluate("()=>__PM.setZen(true)"); s = pg.evaluate(ST)
    ok("zen: runs at 1, the player's speed untouched", s["rate"] == 1 and s["c"] == 60, s)
    pg.evaluate("()=>__PM.setZen(false)"); s = pg.evaluate(ST)
    ok("zen off: back to the player's 60 (zen ended the season, so no outage)", s["rate"] == 60 and s["c"] == 60, s)
    pg.close()
    # an old save from before v5.0.1: slowed speed in C.simSpeed, the player's in C.spdPref
    old = json.loads(sv); old["C"]["simSpeed"] = 5; old["C"]["spdPref"] = 90
    old["S"]["outg"].pop("watch", None)   # (pre-v5.0.6 saves have no watch flag: the outage runs at the player's speed)
    pg = page(); pg.evaluate("(v)=>localStorage.setItem('paper-mill-save',v)", json.dumps(old)); pg.close(); pg = page()
    pg.evaluate("()=>{document.getElementById('v2cont').click();__PM.setRunning(false);}"); pg.wait_for_timeout(300); s = pg.evaluate(ST)
    ok("old save: the player's speed (90) comes back, the outage runs at it (v5.0.6: no cap unless watching)", s["c"] == 90 and s["rate"] == 90 and pg.evaluate("()=>!('spdPref' in __PM.C)"), s)
    pg.evaluate(TO_END); s = pg.evaluate(ST)
    ok("old save: the outage ends at 90", s["rate"] == 90, s)
    pg.close(); b.close()
ok("no page errors", not errs, errs[:3])
print("SPEED CHECK " + ("PASSED" if not fails else f"FAILED ({len(fails)})"))
