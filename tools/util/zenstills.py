"""Zen stills (v6.13.2-t2, claude/zen-v6132-plan.md): every scripted zen shot of a map at 10%, 50% and 90% of its run,
saved as PNGs (and a contact sheet), so the framing can be reviewed. Rare sights are held off and the far scenery kept
on (the headless browser is slow enough to trip the low-FPS fallback that hides it). Not a check: it only saves pictures.
Usage: python3 zenstills.py [index.html] [env] [out folder] [shot name|shot name...] [--force]   (--force: rare shots too)"""
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
args = [a for a in sys.argv[1:] if a != "--force"]; force = "--force" in sys.argv
path = args[0] if args else str(HERE.parent / "index.html"); env = args[1] if len(args) > 1 else "rural"
out = pathlib.Path(args[2] if len(args) > 2 else "zen-stills"); out.mkdir(exist_ok=True)
only = args[3].split("|") if len(args) > 3 else None
with sync_playwright() as pw:
    b = launch(pw); errs = []
    pg = open_game(b, read_html(path), f"env={env}&zen=1&zenstay&gfx=high", viewport=(960, 540), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=300000, polling=300)
    pg.wait_for_function("__PM.G3.zen===true", timeout=60000, polling=200); pg.wait_for_timeout(3000)
    pg.evaluate("()=>{const G=__PM.G3;G.sightFocus=()=>null;if(G.scenery){G.scenery.farOff=true;G.scenery.parts.forEach(p=>p.visible=true);}}")
    shots = pg.evaluate("()=>__PM.G3.zenMoves().map((m,i)=>[i,typeof m.name==='string'?m.name:JSON.stringify(m.name),(()=>{try{return m.ok()}catch(e){return false}})(),m.dur])")
    done = []
    for i, n, ready, dur in shots:
        if (not ready and not force) or (only and n not in only): continue
        files = []
        for f in (0.1, 0.5, 0.9):
            try: pg.evaluate("([i,t])=>{const Z=__PM.G3.zenS,m=__PM.G3.zenMoves()[i];if(!Z.mv||Z.mv.m!==m)Z.mv={m,t:0,st:m.start?m.start():null};Z.mv.t=t;Z.t=0;Z.len=999;Z.dis=999;}", [i, dur * f])
            except Exception: break
            pg.wait_for_timeout(700); fn = out / f"{env}-{i:02d}-{int(f*10)}.png"; pg.screenshot(path=str(fn)); files.append(fn)
        if files: done.append((i, n, files))
    try:
        from PIL import Image, ImageDraw
        W, H = 320, 180; sh = Image.new("RGB", (W * 3, (H + 16) * max(1, len(done))), "black"); d = ImageDraw.Draw(sh)
        for r, (i, n, fs) in enumerate(done):
            for c, fn in enumerate(fs): sh.paste(Image.open(fn).resize((W, H)), (c * W, r * (H + 16) + 16))
            d.text((4, r * (H + 16) + 2), f"{i} {n}", fill="yellow")
        sh.save(out / f"{env}-sheet.png")
    except ImportError: pass
    print(f"{len(done)} shots saved to {out}", errs[:3])
