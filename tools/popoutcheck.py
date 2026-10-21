"""v6.5.1 second screen check: the DCS and the process flow pop out into their own window, keep refreshing from the
game, take clicks there (knob moves, flow taps, the area controls), don't slow the game, follow the mill's console taps,
survive the pause menu, and come back to the game window when the window closes or on Dock back. Also: the button is
hidden on a phone, and a blocked pop-up leaves the game as it was. Fails on any page error.
Usage: python3 popoutcheck.py <index.html> [screenshot_prefix]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])

html = pathlib.Path(sys.argv[1]).read_text()
shot = sys.argv[2] if len(sys.argv) > 2 else None
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK.replace("trigger:", "simRate:()=>simRate(),KUI:()=>KUI,PFUI:()=>PFUI,trigger:") + html[i:]
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
def watch(p, tag):
    p.on("pageerror", lambda e: errs.append(tag + " PAGEERROR " + str(e)[:300]))
    p.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(tag + " CONSOLE " + m.text[:300]))

with sync_playwright() as pw:
    b = pw.chromium.launch(args=ARGS)
    ctx = b.new_context(viewport={"width": 1280, "height": 760})
    pg = ctx.new_page(); watch(pg, "main")
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
    pg.goto("http://bench.local/?nosave")
    pg.wait_for_function("window.__B&&__B.first!==null", timeout=90000); pg.wait_for_timeout(1500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg); pg.wait_for_timeout(800)
    pg.wait_for_function("()=>__PM.S.hist&&__PM.S.hist.bf", timeout=240000)
    pg.evaluate("()=>{__PM.setRunning(true)}")

    # ---- the DCS opens here as before, slowed, with the Second screen button showing (desktop) ----
    pg.evaluate("()=>__PM.G3.openStation('SPOT','dcs')"); pg.wait_for_timeout(500)
    ok("DCS opens in the game window and slows the game", pg.evaluate("()=>!document.getElementById('dcsOv').hidden&&__PM.G3.simRate()===1"))
    ok("Second screen button shows on the DCS (desktop)", pg.evaluate("()=>{const b=document.querySelector('#dcsOv [data-popout]');return !!b&&!b.hidden}"))
    ok("Second screen button in Settings > View", pg.evaluate("()=>{const b=document.getElementById('popBtn');return !!b&&!b.hidden}"))

    # ---- pop out ----
    with ctx.expect_page() as ev:
        pg.evaluate("()=>document.querySelector('#dcsOv [data-popout]').click()")
    pp = ev.value; watch(pp, "popup"); pp.wait_for_timeout(800)
    ok("window opened with both screens in it", pp.evaluate("()=>!!document.getElementById('dcsOv')&&!!document.getElementById('pfOv')&&document.body.classList.contains('pmpop')"))
    ok("both screens left the game window", pg.evaluate("()=>!document.getElementById('dcsOv')&&!document.getElementById('pfOv')"))
    ok("stylesheet copied (DCS panel is dark blue)", pp.evaluate("()=>getComputedStyle(document.querySelector('.dcs')).backgroundColor")=="rgb(22, 35, 58)")
    ok("opened on the DCS view (from the DCS's own button)", pp.evaluate("()=>document.getElementById('popMain').dataset.v")=="dcs")
    ok("popped-out DCS doesn't slow the game", pg.evaluate("()=>__PM.G3.simRate()===__PM.C.simSpeed&&!__PM.G3.knobUI"), str(pg.evaluate("()=>[__PM.G3.simRate(),__PM.C.simSpeed]")))
    ok("footer says the mill keeps running", "keeps running" in pp.evaluate("()=>document.getElementById('dcsSlow').textContent"))
    ok("close buttons hidden in the window", pp.evaluate("()=>getComputedStyle(document.getElementById('dcsClose')).display==='none'&&getComputedStyle(document.getElementById('pfClose')).display==='none'"))
    c0 = pp.evaluate("()=>document.getElementById('dcsClock').textContent")
    pg.evaluate("()=>{for(let i=0;i<240;i++)__PM.step(0.25)}")
    try: pp.wait_for_function("c=>document.getElementById('dcsClock').textContent!==c", arg=c0, timeout=60000)   # (the headless frame loop is slow)
    except Exception: pass
    c1 = pp.evaluate("()=>document.getElementById('dcsClock').textContent")
    ok("DCS keeps refreshing from the game", c0 != c1 and c1 != "", f"{c0} -> {c1}")
    ok("DCS tags show live values", pp.evaluate("()=>[...document.querySelectorAll('[data-tag]')].filter(t=>t.textContent!=='–').length>5"))
    ok("DCS trend canvas drawn (v6.7: the trend pane)", pp.evaluate("()=>{const c=document.getElementById('trCv');if(!c)return false;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]>60)n++;return n>200}"))

    # ---- a knob moved in the window moves the game's knob ----
    k0 = pg.evaluate("()=>__PM.S.knob?JSON.stringify(__PM.S.knob.v):null")
    moved = pp.evaluate("()=>{const r=document.querySelector('#dcsOv .dcsctl [data-kv]');if(!r)return null;r.value=String(+r.min+(+r.max-+r.min)*0.8);r.dispatchEvent(new Event('input',{bubbles:true}));return r.getAttribute('aria-label')}")
    k1 = pg.evaluate("()=>__PM.S.knob?JSON.stringify(__PM.S.knob.v):null")
    ok("knob moved from the second screen reaches the game", moved is not None and k0 != k1, str(moved))
    pp.evaluate("()=>{const b=document.querySelector('#dcsOv .kstd');b&&b.click()}")

    # ---- area tabs and QCS work in the window ----
    pp.evaluate("()=>document.querySelector('#dcsOv [data-a=\"DET\"]').click()"); pp.wait_for_timeout(300)
    ok("area tab click in the window switches to DET", "DRY END" in pp.evaluate("()=>document.getElementById('dcs-h').textContent"))
    pp.evaluate("()=>document.querySelector('#dcsOv [data-a=\"QCS\"]').click()"); pp.wait_for_timeout(300)
    ok("QCS tab in the window", pp.evaluate("()=>!!document.getElementById('qcsSt')&&document.getElementById('qcsSt').textContent.length>0"))
    pp.evaluate("()=>document.querySelector('#dcsOv [data-a=\"DET\"]').click()")

    # ---- a console tap in the mill switches the second screen ----
    pg.evaluate("()=>__PM.G3.knobTap({k:'station',a:'WET'})"); pp.wait_for_timeout(300)
    ok("console tap in the game shows WET on the second screen", "WET END" in pp.evaluate("()=>document.getElementById('dcs-h').textContent") and pg.evaluate("()=>!document.getElementById('dcsOv')"))
    ok("still not slowed after the tap", pg.evaluate("()=>__PM.G3.simRate()===__PM.C.simSpeed"))

    # ---- process flow: Settings opens it on the second screen ----
    pg.evaluate("()=>document.querySelector('#ctlRoom [data-cr=pf]').click()"); pp.wait_for_timeout(600)
    ok("Report > Control room > Process flow switches the window to the flow", pp.evaluate("()=>document.getElementById('popMain').dataset.v")=="pf")
    ok("flow picture drawn in the window", pp.evaluate("()=>!!document.querySelector('#pfMap svg')"))
    pp.evaluate("()=>document.querySelector('[data-pf=\"node:pm\"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); pp.wait_for_timeout(500)
    ok("tap an area in the window opens its panel", pp.evaluate("()=>!document.getElementById('pfPanel').hidden&&document.querySelectorAll('#pfPanel canvas[data-ch]').length>0"))
    ok("panel charts drawn at the window's size", pp.evaluate("()=>{const c=document.querySelector('#pfPanel canvas[data-ch]');return c.width>100}"))
    pp.evaluate("()=>{const c=document.querySelector('#pfPanel canvas[data-ch]'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:r.left+r.width*0.6,clientY:r.top+40}))}")
    ok("chart crosshair readout in the window", ":" in pp.evaluate("()=>document.querySelector('#pfPanel [data-chr]').textContent"))
    pp.evaluate("()=>document.querySelector('[data-ptab=\"ct\"]').click()"); pp.wait_for_timeout(400)
    ok("area controls move into the window's Controls tab", pp.evaluate("()=>!!document.querySelector('#pfCtl #cards')") and pg.evaluate("()=>!document.getElementById('cards')"))
    ok("$() finds the controls in the window (the game's own lookup)", pg.evaluate("()=>!!__PM.G3.popOpen&&document.getElementById('cards')===null"))
    pp.keyboard.press("Escape"); pp.wait_for_timeout(300)
    ok("Escape in the window closes the details", pp.evaluate("()=>document.getElementById('pfPanel').hidden") and pg.evaluate("()=>!!document.getElementById('cards')"))

    # ---- v6.8.3: the window is the whole control room: home tiles, an app per view, "← Control room" back ----
    pp.evaluate("()=>document.getElementById('popBack').click()"); pp.wait_for_timeout(400)
    ok("back button returns to the control room home", pp.evaluate("()=>document.getElementById('popMain').dataset.v==='home'&&document.getElementById('popBack').hidden&&document.querySelectorAll('#popHome [data-pa]').length===10"))   # (v6.10: + Reliability and Drives)
    if shot: pp.set_viewport_size({"width": 1600, "height": 900}); pp.wait_for_timeout(500); pp.screenshot(path=f"{shot}-home.png")
    for k, v, title in (("QCS", "dcs", "Quality"), ("PLAN", "dcs", "Planning"), ("rm", "rm", "Relationship map"), ("man", "man", "Manning"), ("pf", "pf", "Process flow")):
        pp.evaluate(f"()=>document.querySelector('[data-pa=\"{k}\"]').click()"); pp.wait_for_timeout(500)
        ok(f"tile {k} opens {title} full window with the back button", pp.evaluate(f"()=>document.getElementById('popMain').dataset.v==='{v}'&&!document.getElementById('popBack').hidden&&document.getElementById('popApp').textContent==='{title}'"),
           pp.evaluate("()=>document.getElementById('popMain').dataset.v+' / '+document.getElementById('popApp').textContent"))
        if k == "rm": ok("relationship map drawn in the window", pp.evaluate("()=>document.querySelectorAll('#rmSvg .rmn').length>20"))
        if k == "man": ok("manning list drawn in the window", pp.evaluate("()=>document.querySelectorAll('#manB .manl li').length>5"))
        pp.evaluate("()=>document.getElementById('popBack').click()"); pp.wait_for_timeout(300)
    pp.evaluate("()=>document.querySelector('[data-pa=\"rm\"]').click()"); pp.wait_for_timeout(300); pp.keyboard.press("Escape"); pp.wait_for_timeout(300)
    ok("Escape in an app goes back to the control room", pp.evaluate("()=>document.getElementById('popMain').dataset.v")=="home")
    pg.evaluate("()=>document.querySelector('#ctlRoom [data-cr=man]').click()"); pp.wait_for_timeout(500)
    ok("Manning from the game's control room opens on the second screen", pp.evaluate("()=>document.getElementById('popMain').dataset.v")=="man" and pg.evaluate("()=>!document.getElementById('manOv')"))
    pg.evaluate("()=>__PM.G3.openStation('SPOT','dcs')"); pp.wait_for_timeout(300)
    ok("a console tap switches the window to the DCS", pp.evaluate("()=>document.getElementById('popMain').dataset.v")=="dcs")

    # ---- the pause menu doesn't close the flow ----
    pg.evaluate("()=>{const m=document.getElementById('v2menu');if(__PM.G3.showMenu)__PM.G3.showMenu();else m.hidden=false}"); pg.wait_for_timeout(1200)
    ok("pause menu leaves the second screen up", pg.evaluate("()=>__PM.G3.popState().pf") and pp.evaluate("()=>!document.getElementById('pfOv').hidden"))
    pg.evaluate("()=>{const m=document.getElementById('v2menu');m.hidden=true;__PM.setRunning(true)}")

    # ---- closing the window docks both screens back ----
    pp.close(); pg.wait_for_timeout(800)
    ok("closing the window docks both screens back", pg.evaluate("()=>{const a=document.getElementById('dcsOv'),b=document.getElementById('pfOv');return !!a&&!!b&&a.hidden&&b.hidden&&a.ownerDocument===document}"))
    ok("area controls back home in the game window", pg.evaluate("()=>{const c=document.getElementById('cards');return !!c&&c.parentNode.id==='pfHold'}"))
    ok("game at the player's speed after docking", pg.evaluate("()=>__PM.G3.simRate()===__PM.C.simSpeed&&!__PM.G3.popState().st&&!__PM.G3.popState().pf"))
    pg.evaluate("()=>__PM.G3.openStation('DET','dcs')"); pg.wait_for_timeout(400)
    ok("DCS works in the game window again (opens, slows)", pg.evaluate("()=>!document.getElementById('dcsOv').hidden&&__PM.G3.simRate()===1"))
    pg.evaluate("()=>document.getElementById('dcsClose').click()")
    ok("and closes", pg.evaluate("()=>document.getElementById('dcsOv').hidden&&__PM.G3.simRate()===__PM.C.simSpeed"))

    # ---- open again from Settings (Both), then Dock back ----
    with ctx.expect_page() as ev:
        pg.evaluate("()=>document.getElementById('popBtn').click()")
    pp = ev.value; watch(pp, "popup2"); pp.wait_for_timeout(800)
    ok("reopens from Settings > View", pp.evaluate("()=>!!document.getElementById('dcsOv')&&!!document.getElementById('pfOv')"))
    pp.evaluate("()=>document.querySelector('[data-pf=\"node:yard\"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); pp.wait_for_timeout(200)
    pp.evaluate("()=>document.querySelector('[data-ptab=\"ct\"]').click()"); pp.wait_for_timeout(300)
    pp.evaluate("()=>document.getElementById('popDock').click()"); pg.wait_for_timeout(800)
    ok("Dock back closes the window", pp.is_closed())
    ok("Dock back brings everything home (controls included)", pg.evaluate("()=>{const c=document.getElementById('cards');return !!c&&c.parentNode.id==='pfHold'&&document.getElementById('dcsOv').hidden&&document.getElementById('pfOv').hidden}"))

    # ---- zen: the window stays on the flow ----
    with ctx.expect_page() as ev:
        pg.evaluate("()=>__PM.G3.popOpen('dcs')")
    pp = ev.value; watch(pp, "popup3"); pp.wait_for_timeout(600)
    pg.evaluate("()=>{__PM.S.zen=true;document.body.classList.add('zen')}")
    try: pp.wait_for_function("()=>document.getElementById('popMain').dataset.v==='home'", timeout=60000)
    except Exception: pass
    ok("zen: window leaves the DCS for the control room, DCS tiles disabled", pp.evaluate("()=>document.getElementById('popMain').dataset.v==='home'&&document.querySelector('[data-pa=\"dcs\"]').disabled&&!document.querySelector('[data-pa=\"pf\"]').disabled"))
    pg.evaluate("()=>{__PM.S.zen=false;document.body.classList.remove('zen')}")
    try: pp.wait_for_function("()=>!document.querySelector('[data-pa=dcs]').disabled", timeout=60000)
    except Exception: pass
    ok("zen off: DCS tiles back", pp.evaluate("()=>!document.querySelector('[data-pa=\"dcs\"]').disabled"))

    # ---- leaving the game page closes the window ----
    pg.goto("about:blank"); pg.wait_for_timeout(500)
    ok("leaving the game closes the window", pp.is_closed())
    ctx.close()

    # ---- a phone: no button; a blocked pop-up: nothing breaks ----
    ctx2 = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    pg = ctx2.new_page(); watch(pg, "phone")
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.add_init_script("window.open=()=>null")
    pg.goto("http://bench.local/?nosave")
    pg.wait_for_function("window.__B&&__B.first!==null", timeout=90000); pg.wait_for_timeout(1500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg); pg.wait_for_timeout(800)
    pg.evaluate("()=>__PM.G3.openStation('SPOT','dcs')"); pg.wait_for_timeout(500)
    ok("phone: no Second screen button", pg.evaluate("()=>{const b=document.querySelector('#dcsOv [data-popout]'),s=document.getElementById('popBtn');return b.hidden&&s.hidden}"))
    r = pg.evaluate("()=>__PM.G3.popOpen('dcs')")
    ok("blocked pop-up: returns false and the DCS stays in the game", r is False and pg.evaluate("()=>!document.getElementById('dcsOv').hidden&&document.getElementById('dcsOv').ownerDocument===document"))
    ctx2.close(); b.close()

ok("no page errors", not errs, "; ".join(errs[:5]))
print("\n".join(log))
fails = [l for l in log if l.startswith("FAIL")]
print(f"\n{len(log) - len(fails)}/{len(log)} passed")
sys.exit(1 if fails else 0)
