"""Zen checks (v17): every scripted shot of each map runs start-to-finish without an error and keeps the camera off the
ground (every frame finite, height > 0); ?zen=1 goes straight into zen; a rare sight (?sight=1) takes the zen camera;
the map rotation reloads onto the next map, still in zen.
Shots whose ok() is false right now (a train, a truck or a crew that isn't there yet) are listed but not run.
Replaces tools/zencheck.py (which only printed). Full 3D: no LITE (the shots are camera paths over the real scene).
Usage: python3 zen.py [index.html] [env,env...]"""
# tier: default
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log
envs = (sys.argv[2] if len(sys.argv) > 2 else "rural,urban,desert,swamp").split(",")

SHOTS = """()=>{const MV=__PM.G3.zenMoves(),out=[];for(const m of MV){let ok=false,err=null,n=0,low=0;try{ok=m.ok();}catch(e){err=String(e);}
    if(ok){try{const mv={m,t:0,st:m.start?m.start():null};for(let t=0;t<60;t+=0.25){mv.t=t;const f=m.at(t,mv,0.25);if(!f)break;n++;if(!(f[3]>0)||f.some(v=>!isFinite(v)))low++;}}catch(e){err=String(e).slice(0,120);}}
    out.push([typeof m.name==="string"?m.name:JSON.stringify(m.name),ok,n*0.25,m.dur,err,low]);}return out;}"""

def zen(pw):
    html = html_arg()
    b = launch(pw)
    for env in envs:
        C.sec(env)
        pg = open_game(b, html, f"env={env}&zen=1&sight=1&zenstay", viewport=(800, 450), errs=errs, wait=False)
        pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300)
        try: pg.wait_for_function("__PM.G3.zen===true", timeout=30000, polling=200); z = True
        except Exception: z = False
        ok("?zen=1 goes straight into zen", z)
        shots = pg.evaluate(SHOTS)
        ready = [s for s in shots if s[1]]
        ok("the map has scripted shots and some are ready now", len(shots) > 0 and len(ready) > 0, f"{len(ready)} of {len(shots)} ready")
        err = [(s[0], s[4]) for s in shots if s[4]]
        ok("every shot's ok() and every ready shot run start-to-finish without an error", not err, err[:4])
        low = [(s[0], s[5]) for s in shots if s[5]]
        ok("every frame of every ready shot keeps the camera off the ground (finite, height > 0)", not low, low[:4])
        ran0 = [s[0] for s in ready if s[2] <= 0]
        ok("every ready shot gives at least one frame", not ran0, ran0[:4])
        for s in shots: C.note(f"{s[0][:32]:<32} {'ok' if s[1] else '--'} {s[2]:5.1f}s / {s[3]}s")
        try: pg.wait_for_function("__PM.G3.zenS&&__PM.G3.zenS.mv&&__PM.G3.zenS.mv.m.sight", timeout=200000, polling=200); sight = True
        except Exception: sight = False
        ok("a rare sight takes the zen camera", sight)
        if env == envs[-1]:
            C.sec("rotation")
            pg.evaluate("()=>__PM.G3.zenNextMap()"); pg.wait_for_url("**/*zen=1*", timeout=30000); u = pg.url
            pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300)
            try: pg.wait_for_function("__PM.G3.zen===true", timeout=30000, polling=200)
            except Exception: pass
            to = pg.evaluate("()=>[__PM.SITE.env,__PM.G3.zen]")
            ok("the map rotation reloads onto another map, still in zen", to[0] != env and to[1] is True and "zen=1" in u, f"{env} -> {to[0]} ({u}) zen {to[1]}")
        pg.close()
    b.close()

with sync_playwright() as pw:
    for f in (zen,):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()      # page errors fail the check
