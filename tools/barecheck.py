"""v5.7.3 Bare graphics: Low vs Bare side by side (same views), draw calls, triangles, shader programs, and no errors
while every upset fires, a Round runs and a knob is moved.
Usage: python3 barecheck.py <index.html> <outdir> [phone]"""
import pathlib, sys, json
exec(open(pathlib.Path(__file__).parent / "tellcheck.py").read().split("with sync_playwright() as pw:")[0])
out = pathlib.Path(sys.argv[2]); out.mkdir(exist_ok=True); phone = len(sys.argv) > 3
VIEWS = {"site": [0, 20, 330, -0.6, 0.75], "mill": [20, 0, 120, -0.2, 0.8], "pulp": [24, -15, 60, -0.2, 0.62]}
res = {}
with sync_playwright() as pw:
    for tier in ("low", "bare"):
        b, pg, errs = boot(pw, "season", phone=phone, q="&gfx=" + tier)
        cons = []; pg.on("console", lambda m: m.type == "error" and cons.append(m.text[:200]))
        pg.evaluate(STEPTO, 4 * 1440 + 30); pg.evaluate(CLR)
        info = {"tier": pg.evaluate("()=>__PM.G3.GFX.tier"), "bare": pg.evaluate("()=>!!__PM.G3.bare")}
        for k, v in VIEWS.items():
            pg.evaluate("v=>{const G=__PM.G3;G.camSet(v);G.lastMove=performance.now();__PM.setRunning(true);}", v); pg.wait_for_timeout(5000)
            pg.screenshot(path=str(out / f"{tier}-{k}.png"))
            info[k] = pg.evaluate("()=>{const R=__PM.G3.diagScene().renderer,i=R.info;return {calls:i.render.calls,tris:i.render.triangles,programs:i.programs.length,shadows:R.shadowMap.enabled}}")
        # stress: every upset at once, then a Round with a tell, then a knob
        pg.evaluate("()=>{const P=__PM;P.S.cash=1e9;P.EVENTS.filter(e=>e.id!=='birdline').forEach(e=>P.trigger(e.id,true));}"); pg.evaluate(CLR)
        pg.evaluate("v=>{const G=__PM.G3;G.camSet(v);__PM.setRunning(true);}", VIEWS["mill"]); pg.wait_for_timeout(5000)
        pg.screenshot(path=str(out / f"{tier}-upsets.png"))
        info["upsets"] = pg.evaluate("()=>{const i=__PM.G3.diagScene().renderer.info;return {calls:i.render.calls,programs:i.programs.length,inc:__PM.S.inc.length}}")
        pg.evaluate("()=>{__PM.S.inc.forEach(i=>i.left=0);__PM.step(__PM.SIM_STEP);}")
        catch_round(pg, "wet", ["felt"], "click")
        info["caught"] = pg.evaluate("()=>__PM.S.tell.n")
        pg.evaluate("()=>{__PM.knob.set('press',140);for(let k=0;k<400;k++)__PM.step(__PM.SIM_STEP);}")
        info["fps_cap"] = pg.evaluate("()=>__PM.G3.cap")
        info["errors"] = errs + [c for c in cons if "Failed to load resource" not in c]
        res[tier] = info; print(tier, json.dumps(info)); b.close()
ok("bare: loaded as bare", res["bare"]["bare"] and res["bare"]["tier"] == "bare")
ok("bare: shadows off", not res["bare"]["mill"]["shadows"])
ok("bare: frame rate capped at 30", res["bare"]["fps_cap"] == 30, res["bare"]["fps_cap"])
for k in VIEWS: ok(f"bare: fewer draw calls ({k})", res["bare"][k]["calls"] < res["low"][k]["calls"], f"{res['low'][k]['calls']} -> {res['bare'][k]['calls']}, tris {res['low'][k]['tris']} -> {res['bare'][k]['tris']}")
ok("bare: fewer shader programs", res["bare"]["upsets"]["programs"] < res["low"]["upsets"]["programs"], f"{res['low']['upsets']['programs']} -> {res['bare']['upsets']['programs']}")
ok("bare: a tell is caught on a Round", res["bare"]["caught"] >= 1)
ok("bare: no errors (all upsets, a Round, a knob)", not res["bare"]["errors"], res["bare"]["errors"][:4])
ok("low: no errors", not res["low"]["errors"], res["low"]["errors"][:4])
fails = [r for r in RES if not r[1]]
print(f"\n{len(RES)-len(fails)}/{len(RES)} passed" + ("" if not fails else "; FAILED: " + ", ".join(f[0] for f in fails)))
