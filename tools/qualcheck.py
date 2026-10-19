"""v6.5.3 quality specs check: every grade has a weight, moisture and color spec; paper made outside it goes onto the
reel as beater, the winder cuts beater rolls (not finished rolls), they wait in the beater bay and are repulped into the
stock chest. Untouched running stays in spec on every grade. Fails on any page error.
Usage: python3 qualcheck.py <index.html>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))

# run from the warmed-up snapshot with upsets and random breaks off; `setup` is JS run first; returns the tallies
RUN = """(a)=>{const P=__PM,[setup,mins]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
  const S=P.S,t0=S.t,good0=S.tot.prodT,rolls0=S.tot.rolls,br0=S.tot.beatRolls||0,rep0=S.tot.repulped||0,off0=S.q.off;
  (new Function('P','S','G',setup))(P,S,G);let outMin=0,maxBank=0,why={};
  let leak=0;while(S.t-t0<mins){const g1=S.tot.prodT;P.step(P.SIM_STEP);const q=G.qual();if(S.pm==="run"&&q.out.length){outMin+=P.SIM_STEP;q.out.forEach(k=>why[k]=1);leak+=S.tot.prodT-g1;}maxBank=Math.max(maxBank,S.q.bank);}
  return {good:+(S.tot.prodT-good0).toFixed(1),rolls:S.tot.rolls-rolls0,beatRolls:(S.tot.beatRolls||0)-br0,repulped:+((S.tot.repulped||0)-rep0).toFixed(1),
    off:+(S.q.off-off0).toFixed(1),outMin:Math.round(outMin),why:Object.keys(why),maxBank:+maxBank.toFixed(1),bank:+S.q.bank.toFixed(1),grade:P.C.grade,q:G.qual(),leak:+leak.toFixed(2)};}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 900, "height": 600})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave&nobf")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("""()=>{const P=__PM;P.setRunning(false);P.CH.on=false;const S=P.S;while(S.t<1440)P.step(P.SIM_STEP);
      window.__SNAP=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});}""")

    # ---- the spec sheet ----
    spec = pg.evaluate("()=>{const out={};for(const g of ['24','28','31','34Super']){__PM.C.grade=g;const q=__PM.G3.qual();out[g]=q.spec;}return out}")
    ok("a spec for every grade (weight, moisture, color)", all(spec[g] and len(spec[g]["bw"]) == 2 and len(spec[g]["m"]) == 2 and spec[g]["shade"] for g in spec), json.dumps(spec))
    ok("weight specs bracket each grade's target", pg.evaluate("()=>{const G={'24':25.52,'28':28.03,'31':31.10,'34Super':34.01};return Object.entries(G).every(([g,v])=>{__PM.C.grade=g;const s=__PM.G3.qual().spec.bw;return s[0]<v&&v<s[1]&&Math.abs((s[1]-s[0])/2/v-0.03)<0.002})}"))

    # ---- untouched: in spec on every grade, no beater rolls ----
    for g in ["24", "28", "31", "34Super"]:
        r = pg.evaluate(RUN, [f"P.C.grade='{g}';", 240])
        ok(f"untouched {g}: in spec, no beater rolls", r["outMin"] == 0 and r["beatRolls"] == 0 and r["rolls"] > 0, json.dumps({k: r[k] for k in ("outMin", "rolls", "beatRolls", "why")}))

    # ---- color: dye trouble ----
    r = pg.evaluate(RUN, ["P.CH.on=true;P.trigger('dye');", 720])   # (the paper waits a few hours in the winder buffer)
    ok("dye trouble: color out of spec", "shade" in r["why"] and r["outMin"] >= 50, json.dumps({k: r[k] for k in ("why", "outMin")}))
    ok("dye trouble: wound into beater rolls", r["beatRolls"] >= 3, f'{r["beatRolls"]} beater rolls, {r["off"]} t off spec')
    ok("beater rolls go through the bay and are repulped into the chest", r["maxBank"] >= 12 and r["repulped"] >= 12, json.dumps({k: r[k] for k in ("maxBank", "repulped", "bank")}))
    # (v6.5.7: was a comparison against a second 720-min run, which flaked: the runs aren't identical from one launch to
    # the next. Now: while the spec is out, no paper at all is booked as good)
    ok("beater paper isn't counted as good paper", r["off"] > 20 and r["leak"] < 0.05, f'{r["off"]} t off spec, {r["leak"]} t booked as good while out of spec')

    # ---- color: dye pump stopped from the DCS ----
    r = pg.evaluate(RUN, ["if(__PM.G3.dcsMot)__PM.G3.dcsMot('dye','off');else{S.dcs=S.dcs||{mot:{}};S.dcs.mot=S.dcs.mot||{};S.dcs.mot.dye='off';}", 60])
    ok("dye pump stopped: color out of spec", "shade" in r["why"], json.dumps({k: r[k] for k in ("why", "outMin")}))

    # ---- weight: chest agitator off swings the basis weight ----
    r = pg.evaluate(RUN, ["P.knob.set('agit',0);", 720])
    ok("agitator off: weight out of spec (part of the time)", "bw" in r["why"] and r["outMin"] > 20 and r["beatRolls"] >= 1 and r["off"] / max(1, r["beatRolls"]) <= 12.5 * 1.99, json.dumps({k: r[k] for k in ("why", "outMin", "beatRolls")}))

    # ---- moisture: low press loading (wet) and 1st section high + refiner open (dry) ----
    r = pg.evaluate(RUN, ["P.knob.set('press',55);", 720])
    ok("press loading low: moisture out of spec (wet)", "m" in r["why"] and r["beatRolls"] >= 1, json.dumps({k: r[k] for k in ("why", "outMin", "beatRolls")}))
    r = pg.evaluate(RUN, ["P.knob.set('st1',250);P.knob.set('ref',0.95);", 720])
    ok("1st section high + refiner open: moisture out of spec (dry)", "m" in r["why"] and r["q"]["m"] is not None, json.dumps({k: r[k] for k in ("why", "outMin", "beatRolls")}))

    # ---- grade change: transition tons are beater rolls ----
    r = pg.evaluate(RUN, ["S.chg={left:12.5,total:12.5,from:P.C.grade,to:P.C.grade};", 720])
    ok("grade change transition tons become beater rolls", r["beatRolls"] >= 1 and r["off"] >= 12, json.dumps({k: r[k] for k in ("off", "beatRolls")}))

    # ---- the QCS screen shows the spec and the violation ----
    pg.evaluate("()=>{const P=__PM;P.G3.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=true;P.trigger('dye');for(let i=0;i<20;i++)P.step(0.25);P.G3.openStation('DET','qcs');}")
    pg.wait_for_timeout(600)
    pg.evaluate("()=>{for(let i=0;i<4;i++)__PM.step(0.25)}"); pg.wait_for_timeout(1500)
    t = pg.evaluate("()=>[document.getElementById('qcsSt').textContent,document.getElementById('qcsV').textContent,!!document.querySelector('#qcsV .qout')]")
    ok("QCS status names the color violation", "OFF SPEC" in t[0] and "color" in t[0], t[0])
    ok("QCS shows spec ranges and flags the reading", "spec" in t[1] and t[2], t[1][:160])
    b.close()

ok("no page errors", not errs, "; ".join(errs[:5]))
print("\n".join(log))
fails = [l for l in log if l.startswith("FAIL")]
print(f"\n{len(log) - len(fails)}/{len(log)} passed")
sys.exit(1 if fails else 0)
