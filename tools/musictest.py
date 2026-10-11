"""Music check: every calm piece of every site and every upset piece is scheduled step by step inside the page (an
exception in any step shows up here instead of in a player's session), then each site's first piece and its upset piece
play for real for a few seconds and the output level is read, so a silent piece is caught too.
Usage: python3 musictest.py ../test/vN/index.html [--listen=8]   (seconds each piece plays for the level check)"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
args = [a for a in sys.argv[1:] if not a.startswith("--")]; flags = {a.split("=")[0]: a.split("=", 1)[1] if "=" in a else True for a in sys.argv[1:] if a.startswith("--")}
html = pathlib.Path(args[0]).read_text(); listen = float(flags.get("--listen", 8))
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
PIECES = {"rural": ["Wet End", "Felt Moss", "Night Shift", "Lofi", "Canopy"], "urban": ["Neon", "Rooftop", "Tears", "Lofi"],
          "desert": ["Dry Wash", "High Noon", "Mesa", "Lofi"], "swamp": ["Cypress", "Slow Water", "Porch", "Lofi"]}
UPSETS = ["strings", "pulse", "gallop", "stomp", "drive"]
fails = 0
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--autoplay-policy=no-user-gesture-required", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 800, "height": 450}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?env=rural&mill=1")
    pg.wait_for_function("window.__PM&&__B.first!==null", timeout=120000, polling=300)
    rep = pg.evaluate("()=>__PM.AUDIO.selfTest()")
    for line in rep:
        print(("  " if " ok" in line else "FAIL ") + line); fails += " ok" not in line
    pg.close()
    # listening checks: real time, output level
    for env, names in PIECES.items():
        for name in names[:2] + ([names[-1]] if env == "rural" else []):
            pg = b.new_page(viewport={"width": 800, "height": 450}); pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
            pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto(f"http://bench.local/?env={env}&mill=1&song={name.split()[0].lower()}")
            pg.wait_for_function("window.__PM&&__B.first!==null", timeout=120000, polling=300)
            pg.evaluate("()=>{__PM.AUDIO.setOn(true);__PM.AUDIO.setVol(0.8);__PM.AUDIO.level();}")   # (level() once now: the meter needs time to fill)
            pg.wait_for_timeout(listen * 1000)
            r = pg.evaluate("()=>({now:__PM.AUDIO.now,level:__PM.AUDIO.level(),state:__PM.AUDIO.info})")
            ok = name.lower() in r["now"].lower() and r["level"] > 0.002
            fails += not ok; print(("  " if ok else "FAIL ") + f"{env}: {r['now']}  level {r['level']:.4f}  ({r['state']})")
            pg.close()
    for up in UPSETS:
        pg = b.new_page(viewport={"width": 800, "height": 450}); pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto(f"http://bench.local/?env=rural&mill=1&upset={up}")
        pg.wait_for_function("window.__PM&&__B.first!==null", timeout=120000, polling=300)
        pg.evaluate("()=>{__PM.AUDIO.setOn(true);__PM.AUDIO.setVol(0.8);__PM.AUDIO.level();}"); pg.wait_for_timeout(1500)
        pg.evaluate("()=>{setInterval(()=>__PM.AUDIO.update(true),100);}"); pg.wait_for_timeout(listen * 1000)   # (the main loop calls update(false) five times a second)
        r = pg.evaluate("()=>({now:__PM.AUDIO.now,level:__PM.AUDIO.level()})")
        ok = up in r["now"] and r["level"] > 0.002
        fails += not ok; print(("  " if ok else "FAIL ") + f"upset {up}: {r['now']}  level {r['level']:.4f}")
        pg.close()
    b.close()
print("page errors:", errs or "none")
print("RESULT:", "OK" if not fails and not errs else f"{fails} fails, {len(errs)} errors")
