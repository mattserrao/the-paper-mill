"""Music check: every calm piece of every site and every upset piece is scheduled step by step inside the page (an
exception in any step shows up here instead of in a player's session), then each site's first pieces and every upset
piece play for real and the output level is read, so a silent piece is caught too.

Why v6.10.1's run read near-silent (level 0.0003 for 7 of 9 calm pieces): not a silence bug in 02-audio.js and not the
audio clock (it kept pace with the wall clock throughout). The old test started listening at the first frame, while the
shader prewarm (G3.prewarm, seconds of main-thread work under SwiftShader, longer with another Chromium on the 2 CPUs)
was still running. The music scheduler is a 25 ms setInterval on that same main thread that schedules notes 0.3 s
ahead, so a starved scheduler has nothing queued and the output really is quiet; the old test then read the level once,
at the end, from a 46 ms analyser window. Upsets passed because they listened 1.5 s later. Fixes:
  - listen only after G3.warm (+1 s), with the sim paused and the 3D frame not drawn (LITE + G3.EXP.noRender): the
    music needs neither
  - poll the level every 100 ms through the whole listen and pass on the peak (the loud share is logged)
  - a listen with too few polls (main thread starved) or an audio clock under 70% of the wall time fails with that
    reason, not as "silent"
Replaces tools/musictest.py.
Usage: python3 music.py [index.html] [--listen=8]   (seconds each piece plays for the level check)"""
# tier: slow
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log
flags = {a.split("=")[0]: a.split("=", 1)[1] if "=" in a else True for a in sys.argv[1:] if a.startswith("--")}
listen = float(flags.get("--listen", 8))

PIECES = {"rural": ["Wet End", "Felt Moss", "Night Shift", "Lofi", "Canopy"], "urban": ["Neon", "Rooftop", "Tears", "Lofi"],
          "desert": ["Dry Wash", "High Noon", "Mesa", "Lofi"], "swamp": ["Cypress", "Slow Water", "Porch", "Lofi"]}
UPSETS = ["strings", "pulse", "gallop", "stomp", "drive"]
LOUD = 0.002
MIN_READS = 30   # of the ~80 polls in an 8 s listen
# poll the output level through the listen: peak, share of loud reads, audio clock vs wall clock
POLL = "()=>{const A=__PM.AUDIO;window.__LV={l:[],c0:A.ctx.currentTime,w0:performance.now()};A.level();window.__LVt=setInterval(()=>window.__LV.l.push(A.level()),100);}"
READ = f"""()=>{{clearInterval(window.__LVt);const A=__PM.AUDIO,V=window.__LV,l=V.l;return {{now:A.now,info:A.info,n:l.length,peak:Math.max(0,...l),
  loud:l.filter(x=>x>{LOUD}).length,clock:A.ctx.currentTime-V.c0,wall:(performance.now()-V.w0)/1000}}}}"""

def boot(b, html, q):
    pg = open_game(b, html, q + "&" + LITE, viewport=(800, 450), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=300)
    pg.wait_for_timeout(1000)   # (the shader prewarm after the first frame starves the music scheduler: listen after it)
    # the sim and the 3D frames share the main thread with the music scheduler too; the music needs neither
    pg.evaluate("()=>{__PM.setRunning(false);const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;}")
    return pg

def judge(label, r, want):
    behind = r["wall"] > 1 and r["clock"] < 0.7 * r["wall"]
    few = r["n"] < max(MIN_READS * listen / 8, 5)
    good = want(r["now"]) and r["peak"] > LOUD and not behind and not few
    why = f"{r['now']}  peak {r['peak']:.4f}, {r['loud']}/{r['n']} reads loud, audio clock {r['clock']:.1f} s in {r['wall']:.1f} s ({r['info']})"
    ok(label + (": audio clock fell behind the wall clock (starved machine)" if behind else ": too few level reads (main thread starved)" if few else ""), good, why)

def selftest(pw):
    C.sec("schedule")
    html = html_arg(); b = launch(pw, "--autoplay-policy=no-user-gesture-required")
    pg = boot(b, html, "env=rural&mill=1")
    rep = pg.evaluate("()=>__PM.AUDIO.selfTest()")
    ok("selfTest returns a report", isinstance(rep, list) and len(rep) > 0, rep if not isinstance(rep, list) else len(rep))
    for line in (rep if isinstance(rep, list) else []): ok(line, " ok" in line)
    b.close()

def calm(pw):
    C.sec("calm")
    html = html_arg(); b = launch(pw, "--autoplay-policy=no-user-gesture-required")
    for env, names in PIECES.items():
        for name in names[:2] + ([names[-1]] if env == "rural" else []):
            pg = boot(b, html, f"env={env}&mill=1&song={name.split()[0].lower()}")
            pg.evaluate("()=>{__PM.AUDIO.setOn(true);__PM.AUDIO.setVol(0.8);}"); pg.evaluate(POLL)
            pg.wait_for_timeout(listen * 1000)
            judge(f"{env}: {name} plays and is heard", pg.evaluate(READ), lambda now, n=name: n.lower() in now.lower())
            pg.close()
    b.close()

def upsets(pw):
    C.sec("upset")
    html = html_arg(); b = launch(pw, "--autoplay-policy=no-user-gesture-required")
    for up in UPSETS:
        pg = boot(b, html, f"env=rural&mill=1&upset={up}")
        pg.evaluate("()=>{__PM.AUDIO.setOn(true);__PM.AUDIO.setVol(0.8);__PM.AUDIO.level();}"); pg.wait_for_timeout(1500)
        pg.evaluate("()=>{setInterval(()=>__PM.AUDIO.update(true),100);}")   # (the main loop calls update(false) five times a second)
        pg.evaluate(POLL); pg.wait_for_timeout(listen * 1000)
        judge(f"upset {up} plays and is heard", pg.evaluate(READ), lambda now, u=up: u in now)
        pg.close()
    b.close()

with sync_playwright() as pw:
    for f in (selftest, calm, upsets):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()      # page errors fail the check
