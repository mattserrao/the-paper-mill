"""Music check: every calm piece of every site and every upset piece is scheduled step by step inside the page (an
exception in any step shows up here instead of in a player's session), then each site's first pieces and every upset
piece play for real and the output level is read, so a silent piece is caught too.

Level measurement (v6.10.2 tests): AUDIO.level() is the RMS of the analyser's last 2048 samples (~46 ms). The old
musictest.py read it once at the end of the listen, so a sparse piece (Wet End Morning, Felt Moss, Neon Rain...) failed
whenever that one read fell between notes (0.0003 on v6.10.1, while the same piece peaks at ~0.03). It is now polled
every 100 ms through the whole listen and a piece passes on its loudest read; the share of loud reads is logged. The
audio clock's progress against the wall clock is logged too: if a starved machine ever lets it fall behind (under 70%
of the wall time), the piece fails with that reason instead of as "silent". The 3D view is not drawn (LITE, and
G3.EXP.noRender) and the sim is paused while listening: the music depends on neither, and with another Chromium test on
the 2 CPUs they starved the main thread, which also runs the music scheduler (a listen got 0 to 21 of its 80 polls while
the audio clock kept pace): starved scheduler ticks drop notes, which is what read as near-silence. A listen with fewer
than MIN_READS polls still fails, as "too few reads (main thread starved)", not as silent.
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
    pg.wait_for_timeout(1000)   # (the warm-up after the first frame blocks the main thread for seconds: listen after it)
    # the sim and the 3D frames share the main thread with the music scheduler (a 25 ms setInterval that schedules notes
    # 0.3 s ahead): on a busy 2-CPU machine they starved it, notes were dropped and the piece really went quiet. The music
    # needs neither, so the sim is paused and the frame not drawn while listening.
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
