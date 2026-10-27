"""Help page (v5.7.2). Replaces tools/helpcheck.py.
  title  the title screen ? opens Help on the guide; tabs, the glossary filter, Escape; the tutorial button switches it on
         for the next run
  game   in a running season: the pause menu Help tile opens the same page with the game paused; "Replay the tutorial"
         replays it at once (menu and Help close); the close button gives the game back
Each on desktop and phone. Shared helpers (boot) are in checks/_kit.py (tells.py uses them too). Screenshots only when a
folder is given.
Usage: python3 help.py [index.html] [outdir]"""
# tier: default
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1])); sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from lib import *
from _kit import boot
C = Checks(); ok, errs, log = C.ok, C.errs, C.log
out = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else None
if out: out.mkdir(exist_ok=True)
def shot(pg, name):
    if out: pg.screenshot(path=str(out / name))

def title_boot(pw, html, phone, errs):
    b = launch(pw)
    vp = {"width": 390, "height": 760} if phone else {"width": 1100, "height": 700}
    pg = b.new_page(viewport=vp, has_touch=phone, is_mobile=phone)
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    init = INIT.replace("window.__PM_NOTITLE=true;", "")   # (this one starts on the title screen)
    pg.route("**/*", route_for(html)); pg.add_init_script(init); pg.goto("http://bench.local/?nosave&" + LITE)
    pg.wait_for_selector("#tHelp", state="visible", timeout=240000)
    return b, pg

def title(pw):
    C.sec("title")
    html = html_arg()
    for phone in (False, True):
        tag = "phone" if phone else "desktop"; errs = []
        b, pg = title_boot(pw, html, phone, errs)
        pg.evaluate("()=>{try{localStorage.setItem('paper-mill-tutorial','off')}catch(e){}}")
        pg.click("#tHelp"); pg.wait_for_selector("#helpOv:not([hidden])")
        ok(f"{tag} title: ? opens Help on the guide", pg.evaluate("()=>document.querySelectorAll('#helpOv .hsec').length") >= 10)
        shot(pg, f"help-title-{tag}.png")
        pg.click("#htGlos"); pg.fill("#helpQ", "pulp")
        r = pg.evaluate("()=>[...document.querySelectorAll('#helpList dt')].map(d=>d.textContent)")
        ok(f"{tag} glossary: filter 'pulp'", "Pulper" in r and "Stock" in r and len(r) < 24, r)   # (v6.14: more entries mention the pulper)
        pg.fill("#helpQ", ""); n = pg.evaluate("()=>document.querySelectorAll('#helpList dt').length")
        ok(f"{tag} glossary: about 50 terms", n >= 45, n)
        shot(pg, f"help-glossary-{tag}.png")
        pg.click("#helpTut")
        ok(f"{tag} title: tutorial switched on for the next run", pg.evaluate("()=>localStorage.getItem('paper-mill-tutorial')==='on'&&document.getElementById('helpTutN').textContent.includes('next')"))
        pg.keyboard.press("Escape")
        ok(f"{tag} Escape closes it", pg.evaluate("()=>document.getElementById('helpOv').hidden"))
        ok(f"{tag} title: no page errors", not errs, errs[:3]); b.close()

def game(pw):
    # in a running season: the pause menu tile, paused while open, replay the tutorial
    C.sec("game")
    html = html_arg()
    for phone in (False, True):
        tag = "phone" if phone else "desktop"; errs = []
        b, pg = boot(pw, html, "season", phone=phone, q="&" + LITE, errs=errs)
        pg.evaluate("()=>{__PM.setRunning(true);__PM.G3.showMenu();}")
        pg.wait_for_selector("#v2menu:not([hidden]) #v2help")
        shot(pg, f"help-menu-{tag}.png")
        pg.click("#v2help"); pg.wait_for_selector("#helpOv:not([hidden])")
        ok(f"{tag} menu: Help tile opens it, game paused", not pg.evaluate("()=>__PM.running"))
        ok(f"{tag} in a run: 'Replay the tutorial'", pg.evaluate("()=>document.getElementById('helpTut').textContent.includes('Replay')"))
        shot(pg, f"help-game-{tag}.png")
        pg.click("#helpTut"); pg.wait_for_timeout(1200)
        r = pg.evaluate("()=>({tut:!!document.getElementById('tut')&&!document.getElementById('tut').hidden,menu:document.getElementById('v2menu').hidden,help:document.getElementById('helpOv').hidden})")
        ok(f"{tag} replay: tutorial up, menu and Help closed", r["tut"] and r["menu"] and r["help"], r)
        pg.click("#tutSkip"); pg.wait_for_timeout(300)
        # from the dock-less game (no menu): open, close with the button, the game runs again
        pg.evaluate("()=>{__PM.setRunning(true);__PM.G3.helpOpen();}"); pg.click("#help-x")
        ok(f"{tag} close button: back to running", pg.evaluate("()=>__PM.running&&document.getElementById('helpOv').hidden"))
        ok(f"{tag} game: no page errors", not errs, errs[:3]); b.close()

with sync_playwright() as pw:
    for f in (title, game):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()
