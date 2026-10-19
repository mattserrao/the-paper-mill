"""v6.5.5 dewatering chain check: jet (slice) and forming vacuum each have a best point with less water removed either
side; couch solids carry into press solids; press load raises press solids until it crushes the sheet; and the press
solids set the steam the dryers need, both ways. The slice is in the saved state now. Fails on any page error.
Usage: python3 dewatercheck.py <index.html>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
# from the warmed-up snapshot (no upsets or random breaks), set knobs, run, and read the wet end and the dryers
RUN = """(a)=>{const P=__PM,[setup,mins]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
  const S=P.S;(new Function('P','S','G',setup))(P,S,G);const t0=S.t;while(S.t-t0<mins)P.step(P.SIM_STEP);const r=P.knob.read(),K=S.knob,D=S.dry;
  return {cs:+r.couchSol.toFixed(2),ps:+r.pressSol.toFixed(2),W:K&&K.any?+K.W.toFixed(3):1,steam:+D.steam.toFixed(2),st3:+D.st3.toFixed(1),m:+D.m.toFixed(2),sf:K&&K.any?+K.sf.toFixed(3):1,crush:K&&K.x?+(K.x.cr||0).toFixed(3):0,pm:S.pm,speed:Math.round(S.pmSpeed)};}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 900, "height": 600})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave&nobf")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("""()=>{const P=__PM;P.setRunning(false);P.CH.on=false;const S=P.S;while(S.t<1440)P.step(P.SIM_STEP);
      window.__SNAP=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});}""")
    R = lambda setup, mins=90: pg.evaluate(RUN, [setup, mins])
    base = R("", 90)
    ok("untouched: couch 19%, press 44%, water factor 1", abs(base["cs"] - 19) < 0.01 and abs(base["ps"] - 44) < 0.01 and base["W"] == 1, json.dumps(base))

    # ---- 1. jet: best at the standard slice, less water off the table either way (opening B and lip L) ----
    jp, jn = R("slcSet('v',0.6);".replace("slcSet", "P.G3.slcSet")), R("P.G3.slcSet('v',-0.6);")
    lp, ln = R("P.G3.slcSet('h',0.6);"), R("P.G3.slcSet('h',-0.6);")
    ok("jet: slice opened or closed both lower couch solids", jp["cs"] < base["cs"] - 0.5 and jn["cs"] < base["cs"] - 0.5, f'open {jp["cs"]} closed {jn["cs"]} vs {base["cs"]}')
    ok("jet angle: lip forward or back both lower couch solids", lp["cs"] < base["cs"] - 0.2 and ln["cs"] < base["cs"] - 0.2, f'fwd {lp["cs"]} back {ln["cs"]}')
    ok("slice saved with the game (in the knob state)", pg.evaluate("()=>{const P=__PM;P.G3.save.restore(JSON.parse(window.__SNAP));P.G3.slcSet('v',0.4);const d=JSON.parse(JSON.stringify({v:1,S:P.S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:P.S.cash}));P.G3.save.restore(JSON.parse(window.__SNAP));P.G3.save.restore(d);return P.S.knob.v.sv===0.4}"))

    # ---- 2. vacuum: best at 30 kPa, less water off either way (more so below) ----
    v15, v45 = R("P.knob.set('vac',15);"), R("P.knob.set('vac',45);")
    ok("vacuum: 15 and 45 kPa both lower couch solids than 30", v15["cs"] < base["cs"] - 0.5 and v45["cs"] < base["cs"] - 0.2 and v15["cs"] < v45["cs"], f'15: {v15["cs"]}  45: {v45["cs"]}')

    # ---- 3. couch solids carry into press solids ----
    ok("couch solids carry into press solids (same load)", v15["ps"] < base["ps"] - 0.5 and abs((base["ps"] - v15["ps"]) - (base["cs"] - v15["cs"])) < 0.3, f'cs {v15["cs"]} → ps {v15["ps"]}')

    # ---- 4. press load: more load, drier, until it crushes ----
    p80, p120, p130, p145 = R("P.knob.set('press',80);"), R("P.knob.set('press',120);"), R("P.knob.set('press',130);"), R("P.knob.set('press',145);", 180)
    ok("press load raises press solids (80 < 100 < 120 < 130)", p80["ps"] < base["ps"] < p120["ps"] < p130["ps"], f'{p80["ps"]} {base["ps"]} {p120["ps"]} {p130["ps"]}')
    ok("too much load crushes: solids fall past 130 and crush builds", p145["ps"] < p130["ps"] and p145["crush"] > 0.05, f'145: ps {p145["ps"]} crush {p145["crush"]}')

    # ---- 5. press solids → dryer steam, both ways ----
    ok("drier sheet into the dryers: less steam, lower 3rd section, steam cost down", p120["steam"] < base["steam"] and p120["st3"] < base["st3"] and p120["sf"] < 1, f'steam {p120["steam"]} vs {base["steam"]}, st3 {p120["st3"]} vs {base["st3"]}, sf {p120["sf"]}')
    ok("wetter sheet: more steam, higher 3rd section, steam cost up", p80["steam"] > base["steam"] and p80["st3"] > base["st3"] and p80["sf"] > 1, f'steam {p80["steam"]}, st3 {p80["st3"]}, sf {p80["sf"]}')
    ok("moisture held at 8% inside the auto loop's reach", abs(p120["m"] - 8) < 0.2 and abs(p80["m"] - 8) < 0.2, f'{p120["m"]} {p80["m"]}')
    sb = R("P.G3.slcSet('v',0.8);", 150)
    ok("the chain end to end: a bad jet costs steam too", sb["steam"] > base["steam"] and sb["ps"] < base["ps"], json.dumps({k: sb[k] for k in ("cs", "ps", "W", "steam")}))
    b.close()
ok("no page errors", not errs, "; ".join(errs[:5]))
print("\n".join(log)); fails = [l for l in log if l.startswith("FAIL")]
print(f"\n{len(log) - len(fails)}/{len(log)} passed"); sys.exit(1 if fails else 0)
