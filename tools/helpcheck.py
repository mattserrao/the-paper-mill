"""v5.7.2 Help page check: the title screen ? and the pause menu Help tile open the same page; tabs, the glossary
filter, Escape and the close button; the tutorial button (title: on for the next run; in a run: replays at once);
the game stays paused while Help is open. Phone and desktop screenshots go to <outdir>.
Usage: python3 helpcheck.py <index.html> <outdir>"""
import pathlib, sys
exec(open(pathlib.Path(__file__).parent / "tellcheck.py").read().split("with sync_playwright() as pw:")[0])
out = pathlib.Path(sys.argv[2]); out.mkdir(exist_ok=True)
def title_boot(pw, phone):
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    vp = {"width": 390, "height": 760} if phone else {"width": 1100, "height": 700}
    pg = b.new_page(viewport=vp, has_touch=phone, is_mobile=phone); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:300]))
    init = INIT.replace("window.__PM_NOTITLE=true;", "")
    pg.route("**/*", route_for(html)); pg.add_init_script(init); pg.goto("http://bench.local/?nosave")
    pg.wait_for_selector("#tHelp", state="visible", timeout=240000)
    return b, pg, errs
with sync_playwright() as pw:
    for phone in (False, True):
        tag = "phone" if phone else "desktop"
        b, pg, errs = title_boot(pw, phone)
        pg.evaluate("()=>{try{localStorage.setItem('paper-mill-tutorial','off')}catch(e){}}")
        pg.click("#tHelp"); pg.wait_for_selector("#helpOv:not([hidden])")
        ok(f"{tag} title: ? opens Help on the guide", pg.evaluate("()=>document.querySelectorAll('#helpOv .hsec').length")>=10)
        pg.screenshot(path=str(out / f"help-title-{tag}.png"))
        pg.click("#htGlos"); pg.fill("#helpQ", "pulp")
        r = pg.evaluate("()=>[...document.querySelectorAll('#helpList dt')].map(d=>d.textContent)")
        ok(f"{tag} glossary: filter 'pulp'", "Pulper" in r and "Stock" in r and len(r) < 20, r)
        pg.fill("#helpQ", ""); n = pg.evaluate("()=>document.querySelectorAll('#helpList dt').length")
        ok(f"{tag} glossary: about 50 terms", n >= 45, n)
        pg.screenshot(path=str(out / f"help-glossary-{tag}.png"))
        pg.click("#helpTut")
        ok(f"{tag} title: tutorial switched on for the next run", pg.evaluate("()=>localStorage.getItem('paper-mill-tutorial')==='on'&&document.getElementById('helpTutN').textContent.includes('next')"))
        pg.keyboard.press("Escape")
        ok(f"{tag} Escape closes it", pg.evaluate("()=>document.getElementById('helpOv').hidden"))
        ok(f"{tag} title: no page errors", not errs, errs[:3]); b.close()
    # in a running season: the pause menu tile, paused while open, replay the tutorial
    for phone in (False, True):
        tag = "phone" if phone else "desktop"
        b, pg, errs = boot(pw, "season", phone=phone)
        pg.evaluate("()=>{__PM.setRunning(true);__PM.G3.showMenu();}")
        pg.wait_for_selector("#v2menu:not([hidden]) #v2help")
        pg.screenshot(path=str(out / f"help-menu-{tag}.png"))
        pg.click("#v2help"); pg.wait_for_selector("#helpOv:not([hidden])")
        ok(f"{tag} menu: Help tile opens it, game paused", not pg.evaluate("()=>__PM.running"))
        ok(f"{tag} in a run: 'Replay the tutorial'", pg.evaluate("()=>document.getElementById('helpTut').textContent.includes('Replay')"))
        pg.screenshot(path=str(out / f"help-game-{tag}.png"))
        pg.click("#helpTut"); pg.wait_for_timeout(1200)
        r = pg.evaluate("()=>({tut:!!document.getElementById('tut')&&!document.getElementById('tut').hidden,menu:document.getElementById('v2menu').hidden,help:document.getElementById('helpOv').hidden})")
        ok(f"{tag} replay: tutorial up, menu and Help closed", r["tut"] and r["menu"] and r["help"], r)
        pg.click("#tutSkip"); pg.wait_for_timeout(300)
        # from the dock-less game (no menu): open, close with the button, the game runs again
        pg.evaluate("()=>{__PM.setRunning(true);__PM.G3.helpOpen();}"); pg.click("#help-x")
        ok(f"{tag} close button: back to running", pg.evaluate("()=>__PM.running&&document.getElementById('helpOv').hidden"))
        ok(f"{tag} game: no page errors", not errs, errs[:3]); b.close()
fails = [r for r in RES if not r[1]]
print(f"\n{len(RES)-len(fails)}/{len(RES)} passed" + ("" if not fails else "; FAILED: " + ", ".join(f[0] for f in fails)))
sys.exit(1 if fails else 0)
