"""Process checks: the dryers, quality specs, dewatering, water and fiber balance, the winder, the order book, the v6.8
process relationships and the v6.9.2 refiners. One section per old script; replaces tools/dryercheck.py, qualcheck.py,
dewatercheck.py, watercheck.py, windercheck.py, ordercheck.py, relcheck.py and refcheck.py. Fails on any page error.

- dryer (v6.5 b5, claude/dryer-limit-spec.md): at standard running the 3rd section sits at the grade's base and moisture
  is 8%; more speed raises demand ~2.9 kPa per t/h (24); past the ceiling the sheet goes wet, fails the spec (paper to
  the beater), the crew slows the machine until it's back in spec, then speed recovers; the shoe press gives ~16% of the
  water term back; the DET screen shows it (screenshot only with a prefix).
- qual (v6.5.3): every grade has a weight, moisture and color spec; paper made outside it goes onto the reel as beater,
  the winder cuts beater rolls (not finished rolls), they wait in the beater bay and are repulped into the stock chest.
  Untouched running stays in spec on every grade.
- dewater (v6.5.5): jet (slice) and forming vacuum each have a best point with less water removed either side; couch
  solids carry into press solids; press load raises press solids until it crushes the sheet; the press solids set the
  steam the dryers need, both ways. The slice is in the saved state.
- water (v6.5.6 mass balance): over a season stretch with upsets on, fresh + bale water + beater water (+ any shortfall)
  = evaporation + paper + rejects + sludge + outfall + the change in the white water chest, the storage chest's water and
  (v6.8) the white water silo; the per-ton numbers (v6.8.3, showers 1.65 m3/t: ~3.9 in, ~2.7 out; before ~9.9 / 8.4).
  A machine stop draws the white water chest down and fresh water makes up; with the intake iced as well it runs dry and
  the stock runs thick (weight off spec). Fiber: hayout broke goes to the beater bay; soaked or burned bales, chest
  spills and scrapped rolls show in the process flow's waste.
- winder (v6.5.7, 3D): reel storage while the winder is down (the sim's storage against the 3D stands), the two-roll set,
  tied rolls and sheet-break steam venting. Screenshots of the dry end with a prefix.
- order (v6.6): the order book, base-load energy while the machine is stopped, and bale grading at receiving; a season
  through the sim (no 3D), each mechanic against the books, then zen (unchanged behaviour).
- rel (v6.8, 07g): headbox at 0.8% and the fan pump dilution, the basis weight loop and its dead time, the white water
  silo (overflow, draw-down, cavitation break), refining energy -> freeness, couch solids and ring crush, a lighter
  setpoint sold by area (v6.11.2; the v6.8 lightweight premium before), bale water in the pulper, and pressure drop -> rejects. Since v6.10 AUTO-LW
  (07g weTick) trims the basis weight setpoint down while ring crush is over 1.03 x spec, so the untouched weight sits a
  little under the grade's target and extra refining shows up mostly as a lighter sheet rather than more ring crush.
- ref (v6.9.2): a refiner plate clash stops forward flow, the machine runs the machine chest down and trips on low level,
  the stock chest isn't drawn while it does, and once the refiners are back the chest refills and the machine comes
  back; "run on one refiner" ends the trip with the machine held at 75%; the relationship map has the new links.

Usage: python3 process.py [index.html] [shot_prefix]"""
# tier: default
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log
shot = sys.argv[2] if len(sys.argv) > 2 else None

# the warmed-up snapshot most sections run from (a season started, a day played with upsets off)
SNAP = """()=>{const P=__PM;P.setRunning(false);P.CH.on=false;const S=P.S;while(S.t<1440)P.step(P.SIM_STEP);%s
  window.__SNAP=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});}"""

# (the season's bottleneck is rolled with Math.random at season start (09 startSeason, "cosmetic"), and how many randoms
#  the page has used by then depends on boot timing and the graphics tier, so it changed from one load to the next: the
#  same snapshot runs gave 32 / 2 beater rolls (agitator off / press loading low) with "recv" and 8 / 0 with "winder",
#  where the winder backlog holds the off-spec reels unwound past the 12 h window. Pinned to "recv", the mill the old
#  full-tier checks happened to get in the recorded v6.10.1 run.)
PIN_BN = "()=>__PM.setBn('recv')"

def boot_season(pw, query, viewport=(900, 600), html=None, leader="hank", console=False):
    b = launch(pw); pg = open_game(b, html or html_arg(), query, viewport=viewport, errs=errs, wait=False)
    if console: pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg, leader); pg.evaluate(PIN_BN)
    return b, pg


def dryer(pw):
    C.sec("dryer")
    html = html_arg(extra="ups:o=>{Object.assign(S.up,o);applyUpgrades();S.M=mods();},")
    b = launch(pw); pg = open_game(b, html, "nobf&" + LITE, errs=errs); pg.wait_for_timeout(600)
    pg.evaluate("()=>document.getElementById('v2free').click()"); pg.wait_for_timeout(600)
    steps = lambda m: pg.evaluate("m=>{__PM.setRunning(false);for(let i=0;i<m*4;i++){if(__PM.S.cards)__PM.S.cards.open=null;__PM.S.inc.length=0;__PM.step(0.25)}}", m)
    D = lambda: pg.evaluate("()=>{const D=__PM.S.dry;return {dem:+D.dem.toFixed(1),m:+D.m.toFixed(2),trim:+D.trim.toFixed(3),wet:D.wet,sp:Math.round(__PM.S.pmSpeed),g:__PM.C.grade,steam:+D.steam.toFixed(1),pm:__PM.S.pm}}")
    pg.evaluate("()=>{__PM.C.grade='24';__PM.CH.on=false;}"); steps(120)
    d = D(); ok("standard 24: 3rd section at its base (~120 kPa), 8% moisture", abs(d["dem"] - 120) < 4 and abs(d["m"] - 8) < 0.2, str(d))   # (v6.5.3: the setpoint is 8%, was 7%)
    ok("steam ~50 t/h at standard (1.3 t per t of water)", 45 < d["steam"] < 56, str(d))
    pg.evaluate("()=>{__PM.C.pmSp.auto=false;__PM.C.pmSp.v=3300;}"); steps(60)
    d2 = D(); slope = (d2["dem"] - d["dem"]) / ((d2["sp"] - d["sp"]) / 2632 * 34.8)
    ok("more speed: ~2.9 kPa per extra t/h on 24", 2.5 < slope < 3.3, f"{slope:.2f} {d2}")
    pg.evaluate("()=>{__PM.C.pmSp.v=4600;}"); steps(25)
    d3 = D(); off = pg.evaluate("()=>__PM.S.tot.broke")
    ok("past the ceiling the sheet goes wet", d3["m"] > 9 and d3["dem"] > 180, str(d3))
    steps(30); d4 = D()
    ok("wet sheet fails the spec: the crew slows the machine", d4["trim"] > 0.05 and d4["sp"] < d3["sp"], str(d4))
    ok("off-spec paper to the beater while wet", pg.evaluate("()=>__PM.S.tot.broke") > off)
    if shot:
        pg.evaluate("()=>__PM.G3.openStation('DET','dcs')"); pg.wait_for_timeout(2500); pg.screenshot(path=f"{shot}-wet.png", clip={"x": 250, "y": 0, "width": 780, "height": 470})
        pg.evaluate("()=>__PM.G3.closeKnobUI()")
    steps(120); d5 = D()
    ok("back in spec under the trimmed speed", d5["m"] < 9.5 and not d5["wet"], str(d5))
    pg.evaluate("()=>{__PM.C.pmSp.v=2632;}"); steps(240); d6 = D()
    ok("speed recovers once there's headroom", d6["trim"] < d4["trim"], str(d6))
    pg.evaluate("()=>{__PM.C.pmSp.v=3600;}"); steps(60); a = D()["dem"]
    pg.evaluate("()=>__PM.ups({shoe:1})"); steps(60); bb = D()["dem"]
    ok("shoe press lowers dryer demand", bb < a - 8, f"{a} -> {bb}")
    b.close()


# run from the warmed-up snapshot with upsets and random breaks off; `setup` is JS run first; returns the tallies
QRUN = """(a)=>{const P=__PM,[setup,mins]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
  const S=P.S,t0=S.t,good0=S.tot.prodT,rolls0=S.tot.rolls,br0=S.tot.beatRolls||0,rep0=S.tot.repulped||0,off0=S.q.off;
  (new Function('P','S','G',setup))(P,S,G);let outMin=0,maxBank=0,why={};
  let leak=0;while(S.t-t0<mins){const g1=S.tot.prodT;P.step(P.SIM_STEP);const q=G.qual();if(S.pm==="run"&&q.out.length){outMin+=P.SIM_STEP;q.out.forEach(k=>why[k]=1);leak+=S.tot.prodT-g1;}maxBank=Math.max(maxBank,S.q.bank);}
  return {good:+(S.tot.prodT-good0).toFixed(1),rolls:S.tot.rolls-rolls0,beatRolls:(S.tot.beatRolls||0)-br0,repulped:+((S.tot.repulped||0)-rep0).toFixed(1),
    off:+(S.q.off-off0).toFixed(1),outMin:Math.round(outMin),why:Object.keys(why),maxBank:+maxBank.toFixed(1),bank:+S.q.bank.toFixed(1),grade:P.C.grade,q:G.qual(),leak:+leak.toFixed(2)};}"""

def qual(pw):
    C.sec("qual")
    b, pg = boot_season(pw, "notitle&nosave&nobf&" + LITE)
    pg.evaluate(SNAP % "")
    # ---- the spec sheet ----
    spec = pg.evaluate("()=>{const out={};for(const g of ['24','28','31','34Super']){__PM.C.grade=g;const q=__PM.G3.qual();out[g]=q.spec;}return out}")
    ok("a spec for every grade (weight, moisture, color)", all(spec[g] and len(spec[g]["bw"]) == 2 and len(spec[g]["m"]) == 2 and spec[g]["shade"] for g in spec), json.dumps(spec))
    ok("weight specs bracket each grade's target", pg.evaluate("()=>{const G={'24':25.52,'28':28.03,'31':31.10,'34Super':34.01};return Object.entries(G).every(([g,v])=>{__PM.C.grade=g;const s=__PM.G3.qual().spec.bw;return s[0]<v&&v<s[1]&&Math.abs((s[1]-s[0])/2/v-0.03)<0.002})}"))
    # ---- untouched: in spec on every grade, no beater rolls ----
    for g in ["24", "28", "31", "34Super"]:
        r = pg.evaluate(QRUN, [f"P.C.grade='{g}';", 240])
        ok(f"untouched {g}: in spec, no beater rolls", r["outMin"] == 0 and r["beatRolls"] == 0 and r["rolls"] > 0, json.dumps({k: r[k] for k in ("outMin", "rolls", "beatRolls", "why")}))
    # ---- color: dye trouble ----
    r = pg.evaluate(QRUN, ["P.CH.on=true;P.trigger('dye');", 720])   # (the paper waits a few hours in the winder buffer)
    ok("dye trouble: color out of spec", "shade" in r["why"] and r["outMin"] >= 50, json.dumps({k: r[k] for k in ("why", "outMin")}))
    ok("dye trouble: wound into beater rolls", r["beatRolls"] >= 3, f'{r["beatRolls"]} beater rolls, {r["off"]} t off spec')
    ok("beater rolls go through the bay and are repulped into the chest", r["maxBank"] >= 12 and r["repulped"] >= 12, json.dumps({k: r[k] for k in ("maxBank", "repulped", "bank")}))
    # (v6.5.7: was a comparison against a second 720-min run, which flaked: the runs aren't identical from one launch to
    # the next. Now: while the spec is out, no paper at all is booked as good)
    ok("beater paper isn't counted as good paper", r["off"] > 20 and r["leak"] < 0.05, f'{r["off"]} t off spec, {r["leak"]} t booked as good while out of spec')
    # ---- color: dye pump stopped from the DCS ----
    r = pg.evaluate(QRUN, ["if(__PM.G3.dcsMot)__PM.G3.dcsMot('dye','off');else{S.dcs=S.dcs||{mot:{}};S.dcs.mot=S.dcs.mot||{};S.dcs.mot.dye='off';}", 60])
    ok("dye pump stopped: color out of spec", "shade" in r["why"], json.dumps({k: r[k] for k in ("why", "outMin")}))
    # ---- weight: chest agitator off swings the basis weight ----
    r = pg.evaluate(QRUN, ["P.knob.set('agit',0);", 720])
    ok("agitator off: weight out of spec (part of the time)", "bw" in r["why"] and r["outMin"] > 20 and r["beatRolls"] >= 1 and r["off"] / max(1, r["beatRolls"]) <= 12.5 * 1.99, json.dumps({k: r[k] for k in ("why", "outMin", "beatRolls")}))
    # ---- moisture: low press loading (wet) and 1st section high + refiner open (dry) ----
    r = pg.evaluate(QRUN, ["P.knob.set('press',55);", 720])
    ok("press loading low: moisture out of spec (wet)", "m" in r["why"] and r["beatRolls"] >= 1, json.dumps({k: r[k] for k in ("why", "outMin", "beatRolls")}))
    r = pg.evaluate(QRUN, ["P.knob.set('st1',250);P.knob.set('ref',0.95);", 720])
    ok("1st section high + refiner open: moisture out of spec (dry)", "m" in r["why"] and r["q"]["m"] is not None, json.dumps({k: r[k] for k in ("why", "outMin", "beatRolls")}))
    # ---- grade change: transition tons are beater rolls ----
    r = pg.evaluate(QRUN, ["S.chg={left:12.5,total:12.5,from:P.C.grade,to:P.C.grade};", 720])
    ok("grade change transition tons become beater rolls", r["beatRolls"] >= 1 and r["off"] >= 12, json.dumps({k: r[k] for k in ("off", "beatRolls")}))
    # ---- the QCS screen shows the spec and the violation ----
    pg.evaluate("()=>{const P=__PM;P.G3.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=true;P.trigger('dye');for(let i=0;i<20;i++)P.step(0.25);P.G3.openStation('DET','qcs');}")
    pg.wait_for_timeout(600)
    pg.evaluate("()=>{for(let i=0;i<4;i++)__PM.step(0.25)}"); pg.wait_for_timeout(1500)
    t = pg.evaluate("()=>[document.getElementById('qcsSt').textContent,document.getElementById('qcsV').textContent,!!document.querySelector('#qcsV .qout')]")
    ok("QCS status names the color violation", "OFF SPEC" in t[0] and "color" in t[0], t[0])
    ok("QCS shows spec ranges and flags the reading", "spec" in t[1] and t[2], t[1][:160])
    b.close()


# from the warmed-up snapshot (no upsets or random breaks), set knobs, run, and read the wet end and the dryers
DRUN = """(a)=>{const P=__PM,[setup,mins]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
  const S=P.S;(new Function('P','S','G',setup))(P,S,G);const t0=S.t;while(S.t-t0<mins)P.step(P.SIM_STEP);const r=P.knob.read(),K=S.knob,D=S.dry;
  return {cs:+r.couchSol.toFixed(2),ps:+r.pressSol.toFixed(2),W:K&&K.any?+K.W.toFixed(3):1,steam:+D.steam.toFixed(2),st3:+D.st3.toFixed(1),m:+D.m.toFixed(2),sf:K&&K.any?+K.sf.toFixed(3):1,crush:K&&K.x?+(K.x.cr||0).toFixed(3):0,pm:S.pm,speed:Math.round(S.pmSpeed)};}"""

def dewater(pw):
    C.sec("dewater")
    b, pg = boot_season(pw, "notitle&nosave&nobf&" + LITE)
    pg.evaluate(SNAP % "")
    R = lambda setup, mins=90: pg.evaluate(DRUN, [setup, mins])
    base = R("", 90)
    ok("untouched: couch 19%, press 44%, water factor 1", abs(base["cs"] - 19) < 0.01 and abs(base["ps"] - 44) < 0.01 and base["W"] == 1, json.dumps(base))
    # ---- 1. jet: best at the standard slice, less water off the table either way (opening B and lip L) ----
    jp, jn = R("P.G3.slcSet('v',0.6);"), R("P.G3.slcSet('v',-0.6);")
    lp, ln = R("P.G3.slcSet('h',0.6);"), R("P.G3.slcSet('h',-0.6);")
    ok("jet: slice opened or closed both lower couch solids", jp["cs"] < base["cs"] - 0.5 and jn["cs"] < base["cs"] - 0.5, f'open {jp["cs"]} closed {jn["cs"]} vs {base["cs"]}')
    ok("jet angle: lip forward or back both lower couch solids", lp["cs"] < base["cs"] - 0.2 and ln["cs"] < base["cs"] - 0.2, f'fwd {lp["cs"]} back {ln["cs"]}')
    ok("slice saved with the game (in the knob state)", pg.evaluate("()=>{const P=__PM;P.G3.save.restore(JSON.parse(window.__SNAP));P.G3.slcSet('v',0.4);const d=JSON.parse(JSON.stringify({v:1,S:P.S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:P.S.cash}));P.G3.save.restore(JSON.parse(window.__SNAP));P.G3.save.restore(d);return P.S.knob.v.sv===0.4}"))
    # ---- 2. vacuum: best at 30 kPa, less water off either way (more so below) ----
    v15, v45 = R("P.knob.set('vac',15);"), R("P.knob.set('vac',45);")
    ok("vacuum: 15 and 45 kPa both lower couch solids than 30", v15["cs"] < base["cs"] - 0.5 and v45["cs"] < base["cs"] - 0.2 and v15["cs"] < v45["cs"], f'15: {v15["cs"]}  45: {v45["cs"]}')
    # ---- 3. couch solids carry into press solids ----
    ok("couch solids carry into press solids (same load)", v15["ps"] < base["ps"] - 0.5 and abs((base["ps"] - v15["ps"]) - (base["cs"] - v15["cs"])) < 0.3, f'cs {v15["cs"]} -> ps {v15["ps"]}')
    # ---- 4. press load: more load, drier, until it crushes ----
    p80, p120, p130, p145 = R("P.knob.set('press',80);"), R("P.knob.set('press',120);"), R("P.knob.set('press',130);"), R("P.knob.set('press',145);", 180)
    ok("press load raises press solids (80 < 100 < 120 < 130)", p80["ps"] < base["ps"] < p120["ps"] < p130["ps"], f'{p80["ps"]} {base["ps"]} {p120["ps"]} {p130["ps"]}')
    ok("too much load crushes: solids fall past 130 and crush builds", p145["ps"] < p130["ps"] and p145["crush"] > 0.05, f'145: ps {p145["ps"]} crush {p145["crush"]}')
    # ---- 5. press solids -> dryer steam, both ways ----
    ok("drier sheet into the dryers: less steam, lower 3rd section, steam cost down", p120["steam"] < base["steam"] and p120["st3"] < base["st3"] and p120["sf"] < 1, f'steam {p120["steam"]} vs {base["steam"]}, st3 {p120["st3"]} vs {base["st3"]}, sf {p120["sf"]}')
    ok("wetter sheet: more steam, higher 3rd section, steam cost up", p80["steam"] > base["steam"] and p80["st3"] > base["st3"] and p80["sf"] > 1, f'steam {p80["steam"]}, st3 {p80["st3"]}, sf {p80["sf"]}')
    ok("moisture held at 8% inside the auto loop's reach", abs(p120["m"] - 8) < 0.2 and abs(p80["m"] - 8) < 0.2, f'{p120["m"]} {p80["m"]}')
    sb = R("P.G3.slcSet('v',0.8);", 150)
    ok("the chain end to end: a bad jet costs steam too", sb["steam"] > base["steam"] and sb["ps"] < base["ps"], json.dumps({k: sb[k] for k in ("cs", "ps", "W", "steam")}))
    b.close()


WRUN = """(a)=>{const P=__PM,[setup,mins,chaos]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=!!chaos;P.C.breaks=!!chaos;P.C.hays=!!chaos;
  const S=P.S;(new Function('P','S','G',setup))(P,S,G);const w0=JSON.parse(JSON.stringify(S.wat||null)),sw=100/4.2-1,inv0=(S.wat?S.wat.L:0)+sw*S.tank+(S.we?S.we.L:0),t0=S.t,good0=S.tot.prodT;
  let minL=1e9,maxShort=0,bwOut=0,maxFresh=0;
  while(S.t-t0<mins){P.step(P.SIM_STEP);if(S.cards&&S.cards.open)S.cards.open=null;const W=S.wat;minL=Math.min(minL,W.L);maxShort=Math.max(maxShort,W.shortK);maxFresh=Math.max(maxFresh,W.r.fresh);if(S.pm==="run"&&G.qual().out.includes("bw"))bwOut+=P.SIM_STEP;}
  const W=S.wat,T=W.tot,T0=w0?w0.tot:{},d=k=>T[k]-(T0[k]||0),inv1=W.L+sw*S.tank+(S.we?S.we.L:0);   // (v6.8: and the white water silo, 07g)
  return {in:d("fresh")+d("bale")+d("rep")+d("short"),out:d("evap")+d("prod")+d("rej")+d("sludge")+d("out"),dinv:inv1-inv0,parts:Object.fromEntries(Object.keys(T).map(k=>[k,+d(k).toFixed(1)])),
    good:S.tot.prodT-good0,minL,maxShort,bwOut,maxFresh,L:W.L,r:W.r,bank:S.q.bank,W:S.pf?S.pf.W:null};}"""

def water(pw):
    C.sec("water")
    b, pg = boot_season(pw, "notitle&nosave&nobf&env=rural&" + LITE)
    pg.evaluate(SNAP % "")
    R = lambda setup, mins, chaos=False: pg.evaluate(WRUN, [setup, mins, chaos])
    # ---- closure over 6 days with upsets, breaks and hayouts on ----
    r = R("", 6 * 1440, True)
    res = r["in"] - r["out"] - r["dinv"]
    ok("water balance closes over 6 days with upsets (in - out - dInventory ~ 0)", abs(res) < 1e-3 * max(1, r["in"]), f'in {r["in"]:.0f} out {r["out"]:.0f} dinv {r["dinv"]:.0f} residual {res:.3f}; {json.dumps(r["parts"])}')
    per = lambda k: r["parts"][k] / max(1, r["parts"]["paper"])   # (a ton of paper made, beater included)
    ok("fresh water 3-6 m3 a ton (v6.8.3: showers 1.65 m3/t; was ~9.9 with 8)", 3.0 < per("fresh") < 6.0, f'{per("fresh"):.2f} m3/t')
    ok("outfall 2-5 m3 a ton (v6.8.3; was ~8.4)", 2.0 < per("out") < 5.0, f'{per("out"):.2f} m3/t')
    ok("dryer evaporation about 1.1 m3 a ton", 0.95 < per("evap") < 1.25, f'{per("evap"):.2f} m3/t')
    # ---- steady running: chest overflows a little to the sewer, no makeup ----
    s = R("", 240)
    # (v6.11: the DE pulper repulps the trim with white water, so the chest runs at or just under its overflow, not over it)
    ok("steady: the white water chest sits at its overflow, no fresh makeup", s["r"]["make"] < 1 and abs(s["L"] / 2000 - 0.7) < 0.08, json.dumps({**{k: round(v) for k, v in s["r"].items()}, "L": round(s["L"])}))
    # ---- a machine stop: stock prep keeps pulping, the chest draws down, fresh water makes up ----
    d = R("S.tank=60;P.trigger('shaft');", 120)   # (a low storage chest, so stock prep keeps pulping)
    ok("machine down: fresh makeup flows (intake doesn't drop to zero)", d["maxFresh"] > 200 and d["r"]["fresh"] > 60, f'max fresh {d["maxFresh"]:.0f} m3/h, chest low {d["minL"]:.0f} m3')
    # ---- iced intake and a machine stop: no makeup, the chest runs dry, stock thick, weight out of spec ----
    # (v6.11.2: a short stop: the driveshaft's 4-8 h repair plus the rethread could outlast the window, so the restart was never
    #  seen. 60 min of repair still drains the chest dry (~105 min) before the machine is back)
    e = R("S.tank=60;P.trigger('shaft');S.inc.find(i=>i.id==='shaft').left=60;P.trigger('icedintake');", 420)
    ok("iced intake + machine down: the white water chest runs dry", e["minL"] < 1 and e["maxShort"] > 0.5, f'low {e["minL"]:.0f} m3, shortK {e["maxShort"]:.2f}')
    ok("...and the thick stock puts the weight out of spec when it restarts", e["bwOut"] > 5, f'{e["bwOut"]:.0f} min out on weight')
    # ---- fiber accounting fixes ----
    h = pg.evaluate("()=>{const P=__PM;P.G3.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);const S=P.S,b0=S.q.bank,w0=S.pf.W.broke;S.winderBuf=Math.max(S.winderBuf,20);S.winderAcc=Math.max(S.winderAcc,4);P.G3.hayout();return {bank:S.q.bank-b0,broke:S.pf.W.broke-w0}}")
    ok("hayout broke goes to the beater bay and the books", h["bank"] > 1 and abs(h["bank"] - h["broke"]) < 1e-6, json.dumps(h))
    up = pg.evaluate("""()=>{const P=__PM,G=P.G3;const out={};for(const [id,k] of [['chestover','spill'],['balefire','bale'],['overflow','bale']]){G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);const S=P.S;if(id==='chestover')S.tank=200;const w0=S.pf.W[k]||0;P.CH.on=true;P.CH.en[id]=true;try{P.trigger(id);}catch(e){out[id]='ERR '+e.message;continue;}out[id]=+(S.pf.W[k]-w0).toFixed(1);}return out}""")
    ok("chest spill, bale fire and the flooded bale yard are booked as waste", all(isinstance(v, (int, float)) and v > 0 for v in up.values()), json.dumps(up))
    b.close()


CAM = "[-18,5,34,-0.55,0.75,1]"
def winder(pw):
    C.sec("winder")
    # (3D: the storage stands, the crane and the dry-end camera, so the full graphics tier, not LITE)
    b = launch(pw); pg = open_game(b, html_arg(), "", viewport=(1000, 640), errs=errs, wait=False)
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{__PM.CH.on=false;__PM.setFps('max');window.__civ=()=>{const d=document.getElementById('deal-no');if(d&&d.offsetParent)d.click();const b=document.querySelector('#civOv:not([hidden]) .civbtn');if(b){b.click();return true;}return false;};window.__deal=()=>{const d=document.getElementById('deal-no');if(d&&d.offsetParent)d.click();};window.__ff=m=>{for(let i=0;i<m*4;i++)__PM.step(0.25);__civ();if(!__PM.running&&document.getElementById('v2menu').hidden)__PM.setRunning(true);};}")
    # (software rendering is slow: the sim is fast-forwarded in chunks between frames so the 3D still sees every reel)
    def ff(m, wait=300):
        pg.evaluate(f"()=>__ff({m})"); pg.wait_for_timeout(wait)
    # --- 1. winder down: reels go to storage, all four stands fill, then the machine backs up
    pg.evaluate("()=>{__PM.trigger('winderdown',true);const i=__PM.S.inc.find(x=>x.id==='winderdown');i.left=i.total=1e6;__PM.C.simSpeed=120;}")
    pg.evaluate(f"()=>__PM.G3.camSet({CAM})")
    seen = []
    for k in range(200):
        ff(12)
        r = pg.evaluate("""()=>{const S=__PM.S,G=__PM.G3,st=Math.max(0,Math.ceil(S.winderBuf/100-0.005)-1);
          return {stored:st,pm:S.pm,vis:(G.parkedN??-1),turn:S.tot.turnups,buf:+S.winderBuf.toFixed(1)}}""")
        seen.append(r)
        if r["pm"] == "spools" and r["vis"] == r["stored"]: break
    C.note("winder down:", json.dumps(seen[-1]))
    mx = max(s["stored"] for s in seen)
    ok("four reels stored before the machine backs up", mx >= 4, mx)
    ok("machine stops on spools only with storage full", all(s["stored"] >= 4 for s in seen if s["pm"] == "spools"))
    # (the crane animates in real frame time: under load it can still be carrying the last reel, so let it finish first;
    #  v6.11.2: up to 2 min, as two checks side by side can slow the frames past 30 s)
    #  v6.11.2 t6: the crane only moves while the game runs, and a civics card or a deal that pops up meanwhile pauses it, so
    #  under load the crane could freeze mid-move with the last reel and the stands read one short. Slow the sim right down
    #  (the machine is stopped on spools, nothing else changes) and keep answering cards and resuming while it finishes.
    pg.evaluate("()=>{__PM.C.simSpeed=1;}")
    try: pg.wait_for_function("()=>{__civ();__deal();if(!__PM.running&&document.getElementById('v2menu').hidden)__PM.setRunning(true);const C=__PM.G3.CR;return !C.j&&!C.jobs.length}", timeout=120000, polling=250)
    except Exception: C.note("crane:", pg.evaluate("()=>{const C=__PM.G3.CR;const f=j=>j&&({kind:j.kind,fromPark:!!j.fromPark,fromReel:!!j.fromReel,picked:!!j.picked,dropped:!!j.dropped,delay:j.delay,b:j.b});return {j:f(C.j),jobs:C.jobs.map(f),t:C.t,hidePark:C.hidePark,running:__PM.running,cards:__PM.S.cards&&__PM.S.cards.open?Object.keys(__PM.S.cards.open).join():null,ovs:[...document.querySelectorAll('.overlay')].filter(e=>!e.hidden).map(e=>e.id),menu:!document.getElementById('v2menu').hidden,day:(__PM.S.t/1440).toFixed(2)}}"))
    rest = pg.evaluate("()=>({stored:Math.max(0,Math.ceil(__PM.S.winderBuf/100-0.005)-1),vis:(__PM.G3.parkedN??-1),pm:__PM.S.pm})")
    ok("stands match the sim at rest", rest["vis"] == rest["stored"], rest)
    pg.wait_for_timeout(5000)
    r = pg.evaluate("()=>({stored:Math.max(0,Math.ceil(__PM.S.winderBuf/100-0.005)-1),vis:(__PM.G3.parkedN??-1)})")
    ok("stands match the sim after the crane settles", r["vis"] == r["stored"], r)
    if shot: pg.evaluate("()=>{__PM.C.simSpeed=1}"); pg.wait_for_timeout(800); pg.screenshot(path=f"{shot}-storage-full.png")
    # --- 2. winder back: storage drains reel by reel onto the unwind
    # (v6.11.2 t6: on maps and grades where the winder is the bottleneck (~28 t/h against a 35 t/h machine) storage only drains
    #  when a break happens to stop the machine, so the step passed or failed by luck. Slow the machine to 60% while the
    #  winder catches up, so it always can)
    pg.evaluate("()=>{__PM.S.inc.find(x=>x.id==='winderdown').left=0;window.__sp0={v:__PM.C.pmSp.v,a:__PM.C.pmSp.auto};__PM.C.pmSp.auto=false;__PM.C.pmSp.v=Math.round(__PM.C.pmSp.v*0.6);__PM.C.simSpeed=60;}")
    drained = []
    for k in range(200):
        ff(12)
        r = pg.evaluate("()=>{const S=__PM.S,G=__PM.G3;return {stored:Math.max(0,Math.ceil(S.winderBuf/100-0.005)-1),vis:(G.parkedN??-1),pm:S.pm,rolls:S.tot.rolls,wd:S.wd,conv:S.conv,inc:S.inc.map(i=>i.id).join(),run:__PM.running,card:S.cards&&S.cards.open?Object.keys(S.cards.open).join():null,day:+(S.t/1440).toFixed(2)}}")
        drained.append(r)
        if r["stored"] <= 1 and k > 4: break
    pg.evaluate("()=>{__PM.C.pmSp.v=__sp0.v;__PM.C.pmSp.auto=__sp0.a;}")   # (the machine back to its own speed for the rest)
    C.note("drain:", json.dumps(drained[-1]))
    ok("storage drains after the winder is fixed", min(d["stored"] for d in drained) < mx, [d["stored"] for d in drained][-12:])   # (it refills while the machine runs, so the low point, not the last reading)
    if shot:
        pg.evaluate("()=>{__PM.C.simSpeed=1;__PM.G3.camSet([-21,8,16,-0.9,0.7,1])}")
        r0 = pg.evaluate("()=>__PM.S.tot.rolls")
        for k in range(80):
            pg.evaluate("()=>__ff(0.5)")
            if pg.evaluate("()=>__PM.S.tot.rolls") > r0: break
        pg.screenshot(path=f"{shot}-set-0.png")
        for k in range(1, 7): pg.wait_for_timeout(900); pg.screenshot(path=f"{shot}-set-{k}.png")
    # --- 3. two rolls per set
    r0 = pg.evaluate("()=>__PM.S.tot.rolls")
    for k in range(10): ff(12)
    r1 = pg.evaluate("()=>__PM.S.tot.rolls")
    ok("rolls come off in pairs", r1 > r0 and r1 % 2 == 0 and r0 % 2 == 0, (r0, r1))
    # --- 4. rolls tied together
    has = pg.evaluate("()=>__PM.EVENTS.some(e=>e.id==='tiedrolls')")
    ok("tied rolls upset exists", has)
    if has:
        b0 = pg.evaluate("()=>({beat:__PM.S.tot.beatRolls||0,rolls:__PM.S.tot.rolls})")
        pg.evaluate("()=>{__PM.C.simSpeed=6;__PM.trigger('tiedrolls');}")
        pg.evaluate("()=>__PM.G3.camSet([-22,8,15,-0.9,0.7,1])")
        for k in range(4): pg.wait_for_timeout(700); pg.evaluate("()=>__deal()")
        pg.wait_for_timeout(1500)
        if shot: pg.screenshot(path=f"{shot}-tied-card.png")
        ok("tied rolls civics card", pg.evaluate("()=>{const e=document.getElementById('civOv');return !!e&&!e.hidden&&/tied/i.test(e.textContent)}"))
        pg.evaluate("()=>__civ()")
        st = pg.evaluate("()=>{const i=__PM.S.inc.find(x=>x.id==='tiedrolls');return i?{left:i.left,q:i.q,down:__PM.S.M.winderDown}:null}")
        ok("tied rolls stop the winder", st and st["down"], st)
        for k in range(8):
            ff(2, 900)
            if shot and k in (1, 4, 6): pg.screenshot(path=f"{shot}-tied-{k}.png")
        for k in range(60):
            if not pg.evaluate("()=>__PM.S.inc.some(x=>x.id==='tiedrolls')"): break
            ff(2, 150)
        b1 = pg.evaluate("()=>({beat:__PM.S.tot.beatRolls||0,rolls:__PM.S.tot.rolls})")
        ok("both tied rolls go to the beater", b1["beat"] - b0["beat"] == 2, (b0, b1))
    # --- 5. sheet break: steam keeps flowing and is vented
    for k in range(20):
        ff(5, 100)
        if pg.evaluate("()=>__PM.S.pm==='run'&&__PM.S.dry&&__PM.S.dry.steam>10"): break
    run = pg.evaluate("()=>({pm:__PM.S.pm,steam:(__PM.S.dry&&__PM.S.dry.steam)||0})")
    pg.evaluate("()=>{const S=__PM.S;S.pm='break';S.brkType='reel';S.breakLeft=S.breakTotal=400;}")
    ff(10)
    brk = pg.evaluate("()=>({pm:__PM.S.pm,steam:(__PM.S.dry&&__PM.S.dry.steam)||0,vent:(__PM.S.dry&&__PM.S.dry.vent)||0})")
    ok("steam keeps flowing on a sheet break", brk["pm"] == "break" and brk["steam"] > 0.5 * run["steam"], (run, brk))
    ok("steam is vented on a sheet break", brk["vent"] > 0, brk)
    if shot:
        pg.evaluate("()=>{__PM.C.simSpeed=1;__PM.G3.camSet([20,6,60,-0.5,0.55,4])}"); pg.wait_for_timeout(2500)
        pg.screenshot(path=f"{shot}-vent.png")
    b.close()


def order(pw):
    C.sec("order")
    # test copy only: reach the v6.6 functions and constants
    html = html_arg().replace("window.__PM={", "window.__PM={get OX(){return {ORD,BALE,BASEL,ordState,ordAssign,ordDepart,ordFree,ordNeed,fgOf,baleGrade,baleGate,baleUnload,baleFeed,bqState,baseLoadTick,priceOf,energyCost,pfChemT,outOn,ordOn,GRADES,P,C,lotPut,lotTake,lotA,lotValue,msfPerT,pwrTick}},", 1)
    b = launch(pw); pg = open_game(b, html, "notitle&" + LITE, viewport=(900, 640), errs=errs, wait=False)
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=120000, polling=100); pg.evaluate(PIN_BN)
    pg.evaluate("""()=>{const P=__PM;P.setRunning(false);if(P.G3)P.G3.on=false;
      window.__run=(m,f)=>{const S=P.S,h=P.SIM_STEP||0.25,t1=S.t+m;while(S.t<t1-1e-9){P.step(h);if(f)f();const o=S.cards&&S.cards.open;
        if(o){if(o.outage){const b=document.getElementById('out-ok');if(b)b.click();}S.cards.open=null;['dealOv','outOv','seasonOv','civOv','rcOv'].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true;});}
        if(S.civ&&S.civ.cur)S.civ.cur=null;}};}""")
    # --- 1. the book at the start
    r = pg.evaluate("()=>{const O=__PM.S.ord;return {n:O.list.length,open:O.list.filter(o=>o.st==='open').length,g:[...new Set(O.list.map(o=>o.g))],sizes:O.list.map(o=>o.r)}}")
    ok("orders booked for the opening campaign and stock", r["open"] >= 5, r["n"])
    ok("order sizes within the limits", all(6 <= s <= 40 for s in r["sizes"]), r["sizes"][:10])
    # --- 2. a few days: every truck carries one grade; revenue = invoices (list less chargeback, or less the spot discount)
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX;let mixed=0,bad=0,n=0,maxd=0;const seen=new Set();
      const rev0=S.ledger.rev;let inv=0;const od=X.ordDepart;
      __run(6*1440,()=>{for(const tr of S.leaving){if(tr.kind!=='out'||seen.has(tr.id)||!tr.lots)continue;seen.add(tr.id);n++;
        const gs=new Set(tr.lots.map(l=>l[0]));if(gs.size>1)mixed++;}});
      const O=S.ord;return {n,mixed,done:O.k.done,ship:O.k.ship,onT:O.k.onT,lateT:O.k.lateT,spot:O.k.spot,open:O.list.filter(o=>o.st==='open').length,
        ledger:S.ledger.rev-rev0}}""")
    ok("trucks left with paper", r["n"] > 5, r["n"])
    ok("every outbound truck carries one grade", r["mixed"] == 0, json.dumps(r))
    ok("orders delivered", r["done"] > 3, r["done"])
    # --- 3. invoice arithmetic: a late order pays list less the chargeback; a spot load list less the discount
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX,rw=X.C.rollW.v;const g=X.C.grade,pr=X.priceOf(g);
      const O=X.ordState();const o={id:++O.n,c:0,g,r:10,ld:10,sh:0,due:S.t-2.5*1440,t0:S.t-5*1440,st:'open'};O.list.push(o);
      let r0=S.ledger.rev;X.ordDepart({oid:o.id,g,want:10,load:10,spot:false});const late=S.ledger.rev-r0;
      r0=S.ledger.rev;X.ordDepart({oid:0,g,want:10,load:10,spot:true});const spot=S.ledger.rev-r0;
      const o2={id:++O.n,c:1,g,r:10,ld:10,sh:0,due:S.t+1440,t0:S.t,st:'open'};O.list.push(o2);r0=S.ledger.rev;X.ordDepart({oid:o2.id,g,want:10,load:10,spot:false});const ont=S.ledger.rev-r0;
      return {late,spot,ont,exp_late:10*rw*(pr-Math.min(X.ORD.lateCap,X.ORD.late*3)),exp_spot:10*rw*(pr-X.ORD.spot),exp_ont:10*rw*pr,st:o.st,st2:o2.st}}""")
    ok("late order invoiced at list less the chargeback (3 days: $45/t)", abs(r["late"] - r["exp_late"]) < 1, json.dumps(r))
    ok("spot load invoiced at list less the spot discount", abs(r["spot"] - r["exp_spot"]) < 1)
    ok("on-time order at list, and marked delivered", abs(r["ont"] - r["exp_ont"]) < 1 and r["st2"] == "done")
    # --- 3b. v6.11.2 sold by area: lots carry the area ratio, a truck earns list x its ratio, MSF is counted
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX,rw=X.C.rollW.v,g=X.C.grade,pr=X.priceOf(g),O=X.ordState(),bw=X.GRADES[g].bw;
      const L=[];X.lotPut(L,g,1,100,1.05);X.lotPut(L,g,3,100,1);const blend={n:L.length,a:L[0][3]};
      const T=[];X.lotTake(L,2,T);const carried=T[0][3];
      const inv=(lots,spot)=>{const o={id:++O.n,c:0,g,r:10,ld:10,sh:0,due:S.t+1440,t0:S.t,st:'open'};O.list.push(o);const r0=S.ledger.rev,m0=O.k.msf;
        X.ordDepart({oid:spot?0:o.id,g,want:10,load:10,spot,lots});return [S.ledger.rev-r0,O.k.msf-m0];};
      const [light,lm]=inv([[g,10,100,1.05]],false),[heavy]=inv([[g,10,100,0.97]],false),[old]=inv([[g,10]],false),[spot]=inv([[g,10,100,1.05]],true);
      return {blend,carried,light,heavy,old,spot,lm,exp_light:10*rw*pr*1.05,exp_heavy:10*rw*pr*0.97,exp_old:10*rw*pr,exp_spot:10*rw*(pr*1.05-X.ORD.spot),exp_lm:10*rw*2000*1.05/bw,
        val:X.lotValue([[g,2,100,1.04]],rw),exp_val:2*rw*pr*1.04}}""")
    ok("lots merge with a quantity-weighted area ratio, and lotTake carries it", r["blend"]["n"] == 1 and abs(r["blend"]["a"] - 1.0125) < 1e-9 and abs(r["carried"] - 1.0125) < 1e-9, json.dumps(r["blend"]))
    ok("a light truck (+5% area) earns list x 1.05, a heavy one (-3%) list x 0.97", abs(r["light"] - r["exp_light"]) < 1 and abs(r["heavy"] - r["exp_heavy"]) < 1, json.dumps(r))
    ok("lots from an old save (no ratio) sell at list; spot is list x area less the per-ton discount", abs(r["old"] - r["exp_old"]) < 1 and abs(r["spot"] - r["exp_spot"]) < 1)
    ok("MSF shipped counted from tons, grade weight and area ratio; lot value by area", abs(r["lm"] - r["exp_lm"]) < 0.01 and abs(r["val"] - r["exp_val"]) < 1, f'msf {r["lm"]:.1f} vs {r["exp_lm"]:.1f}')
    # --- 4. cancellation: an order 4+ days late is cancelled
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX,O=X.ordState();const o={id:++O.n,c:2,g:'28',r:20,ld:0,sh:0,due:S.t-4.2*1440,t0:S.t-6*1440,st:'open'};O.list.push(o);
      const c0=O.k.canc;__run(5);return {st:o.st,canc:O.k.canc-c0}}""")
    ok("an order 4 days late is cancelled", r["st"] == "cancelled" and r["canc"] == 1, json.dumps(r))
    # --- 5. a truck with nothing to load waits in the queue and leaves on a dry run
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX,O=X.ordState();P.C.outRate.auto=false;P.C.outRate.v=0;
      const keep=S.lots.fg.map(l=>l.slice()),fg=S.fg;S.lots.fg.length=0;S.fg=0;S.outDock.fill(null);S.outQ.length=0;
      // (the machine keeps making paper while the truck waits: since the order book (v6.6) a truck in the queue is sent to a
      //  door as soon as an order or a spot load is ready, so a 6.5 h wait at full speed found a load (or was still loading)
      //  and never ran dry. The warehouse is kept empty for the whole wait; made counts the rolls that would have loaded it)
      let made=0;const fr0=S.ledger.frout,d0=O.k.dry;S.outQ.push({id:99901,load:0});
      __run(X.ORD.dryWait+30,()=>{if(S.fg>0){made+=S.fg;S.lots.fg.length=0;S.fg=0;}});
      const res={dry:O.k.dry-d0,fee:S.ledger.frout-fr0,q:S.outQ.length,made:Math.round(made)};S.lots.fg=keep;S.fg=fg;P.C.outRate.auto=true;return res}""")
    ok("an empty-handed truck leaves after the wait with a dry-run fee", r["dry"] == 1 and r["fee"] >= 299 and r["q"] == 0, json.dumps(r))
    # --- 6. base load: charged while stopped, not while running
    # (v6.11.2: baseLoadTick is the stopped mill's steam only; electricity is metered every step by pwrTick from the drives and
    #  the balance of plant: a break still draws most of it, a stop about a third, running the most)
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX;const pm=S.pm;
      const e=()=>S.ledger.energy;S.pm='run';let a=e();X.baseLoadTick(60);const run=e()-a;
      S.pm='break';a=e();X.baseLoadTick(60);const brk=e()-a;S.pm='down';a=e();X.baseLoadTick(60);const stop=e()-a;
      S.pm='run';a=e();X.pwrTick(60);const pRun=e()-a;S.pm='break';a=e();X.pwrTick(60);const pBrk=e()-a;S.pm='down';a=e();X.pwrTick(60);const pStop=e()-a;S.pm=pm;
      return {run,brk,stop,pRun,pBrk,pStop}}""")
    ok("no base load while running; a break has no idle steam, a stop does", r["run"] == 0 and r["brk"] == 0 and r["stop"] > 0, json.dumps(r))
    ok("metered power: running > a break > a stop > 0 (v6.11.2)", r["pRun"] > r["pBrk"] > r["pStop"] > 0, json.dumps(r))
    ok("a stop draws power and banked-boiler steam, less than running", 0 < r["stop"] + r["pStop"] < 0.5 * r["pRun"] / 0.4, json.dumps(r))   # (v6.11.2: pRun is the power share, 40%, of a running hour)
    r = pg.evaluate("()=>{const S=__PM.S;return {idle:S.tot.idleE||0,pf:S.pf&&S.pf.A&&S.pf.A.power?Object.keys(S.pf.A.power):[]}}")
    ok("idle energy has built up over the season and is placed by area", r["idle"] > 1000, json.dumps(r))
    # --- 7. bale grading
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX;const Q=X.bqState(),wx=S.wx;let cnt={A:0,C:0,M:0},mx=0,rej=0;const r0=Q.rej;
      // (v6.8.3: baleGrade picks the kind furthest below its recipe share, counting the piles and the trucks already in
      //  S.inQ, so each graded load is queued as the game would before the next is drawn; the queue is put back after)
      const q0=S.inQ.length;
      for(let i=0;i<2000;i++){const t=X.baleGrade({id:i,load:220});S.inQ.push(t);cnt[t.q]++;mx+=t.m;if(X.baleGate(t))rej++;}
      S.inQ.length=q0;const rec={...Q.rec},n=rec.A+rec.C+rec.M,dev=Math.max(...['A','C','M'].map(k=>Math.abs(cnt[k]/2000-rec[k]/n)));
      const dry={m:0.10,k:0,pf:1},wet={m:0.18,k:0,pf:(1-0.18)/(1-X.BALE.allow)};
      const o0=S.ledger.occ;Q.m=0.10;Q.k=0;const paidDry=X.baleUnload(dry,100,0);const paidWet=X.baleUnload(wet,100,0);
      Q.m=0.10;const f1=X.baleFeed();Q.m=0.16;const f2=X.baleFeed();Q.k=0.5;const f3=X.baleFeed();
      return {cnt,rec,dev,mean_m:mx/2000,rej,rejC:Q.rej-r0,paidDry,paidWet,sf1:f1.sf,sf2:f2.sf,yk3:f3.yk}}""")
    ok("loads follow the OCC recipe: A, C and Mixed Waste all arrive in the recipe's shares (v6.8.3)", all(r["cnt"].get(k, 0) > 0 for k in "ACM") and sum(r["cnt"].values()) == 2000 and r["dev"] < 0.03, json.dumps({"cnt": r["cnt"], "rec": r["rec"], "dev": r["dev"]}))
    # (v6.8.3: Mixed Waste replaced the old junk C grade and is bought on purpose; baleGate turns nothing away)
    ok("no load turned away at the gate (v6.8.3)", r["rej"] == 0 and r["rejC"] == 0, json.dumps(r))
    ok("a dry load is paid in full; a wet one at air-dry weight", abs(r["paidDry"] - 100) < 1e-6 and abs(r["paidWet"] - 100 * (0.82 / 0.88)) < 1e-6, json.dumps(r))
    ok("water over 10% is not fiber; contamination costs yield", r["sf1"] == 1 and abs(r["sf2"] - 0.94) < 1e-9 and r["yk3"] < 1, json.dumps(r))
    # stickies raise the break odds: compare the mods with clean and dirty stock in the chest
    r = pg.evaluate("""()=>{const S=__PM.S,X=__PM.OX,Q=X.bqState();const k0=Q.ck;Q.ck=0;__run(0.25);const a=S.M.breakMul;Q.ck=0.5;Q.k=0.5;__run(0.25);const b=S.M.breakMul;Q.ck=k0;return {a,b}}""")
    ok("stickies in the chest raise the break odds", r["b"] > r["a"] * 1.3, json.dumps(r))
    # --- 8. the rest of the season plays out, the panel renders
    r = pg.evaluate("""()=>{const S=__PM.S;__run(Math.max(0,S.season.end-S.t-30));const O=S.ord,K=O.k;
      return {day:S.t/1440,done:K.done,onTime:K.onT/Math.max(1,K.onT+K.lateT),spot:K.spot,canc:K.canc,dry:K.dry,fg:S.fg,cash:S.cash}}""")
    pg.wait_for_timeout(1500)
    ok("season played to the last day", r["day"] > 29, json.dumps(r))
    ok("on-time delivery for a hands-off mill is high but not perfect", 0.6 < r["onTime"] <= 1, json.dumps(r))
    # (v6.8.1: the Report tab's Orders & bales panel is retired; the control room's Planning screen shows the order book)
    pg.evaluate("()=>__PM.G3.openStation('PLAN')"); pg.wait_for_timeout(1500)
    h = pg.evaluate("()=>{const b=document.getElementById('planBox');return b?b.innerText:''}")
    pg.evaluate("()=>{const x=document.getElementById('dcsClose');if(x)x.click();}")
    ok("Planning screen shows the order book and the bale yard", "on-time delivery" in h.lower() and "bale yard" in h.lower(), h[:120])
    ok("Planning screen shows area: MSF a roll and MSF shipped (v6.11.2)", "area a roll" in h.lower() and "shipped by area" in h.lower() and "msf/t" in h.lower(), h[:120])
    # --- 9. zen: no orders, no idle energy, no bale effects
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX;S.zen=true;const e0=S.ledger.energy,pm=S.pm;S.pm='down';X.baseLoadTick(60);const idle=S.ledger.energy-e0;S.pm=pm;
      const f=X.baleFeed();const on=X.ordOn();S.zen=false;return {idle,sf:f.sf,yk:f.yk,on}}""")
    ok("zen: no idle energy, standard bales, no order book", r["idle"] == 0 and r["sf"] == 1 and r["yk"] == 1 and not r["on"], json.dumps(r))
    b.close()


# from the warmed-up snapshot (no upsets or random breaks): set things up, run, read
RRUN = """(a)=>{const P=__PM,[setup,mins,probe]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
  const S=P.S,W=G.we;(new Function('P','S','G',setup))(P,S,G);const t0=S.t,tr=[];const brk0=S.tot.breaks;
  while(S.t-t0<mins){P.step(P.SIM_STEP);if(probe&&Math.abs((S.t-t0)%1)<1e-6)tr.push((new Function('P','S','G',probe))(P,S,G));}
  const r=P.knob.read(),w=W.state(),q=G.qual();
  return {bw:+w.bw.toFixed(3),meas:+W.bwMeas().toFixed(3),sp:+W.bwSp().toFixed(3),hbc:+w.hbc.toFixed(3),L:+(w.L/(60000/264.172)*100).toFixed(1),cav:+w.cav.toFixed(2),
    hb:Math.round(w.f.hb||0),dil:Math.round(w.f.dil||0),drain:Math.round(w.f.drain||0),seal:Math.round(w.f.seal||0),press:Math.round(w.f.press||0),over:Math.round(w.f.over||0),
    cs:+r.couchSol.toFixed(2),csf:Math.round(r.csf),kwh:Math.round(r.kwh),refkw:Math.round(r.refkw),cp:+r.cp.toFixed(2),rct:+q.rct?.toFixed?.(1)||0,rctq:+(G.we.rct()).toFixed(1),spec:G.we.rctSpec(),
    out:q.out,prem:+((W.areaQcs()-1)*100).toFixed(2),ra:+W.areaNow().toFixed(4),yield:+W.dpYield().toFixed(4),prod:+S.rates.prod.toFixed(2),breaks:S.tot.breaks-brk0,pm:S.pm,
    speed:Math.round(S.pmSpeed),valve:+w.v.toFixed(1),mode:w.m,energy:Math.round(S.ledger.energy),trim:+w.trim.toFixed(4),tr};}"""

def rel(pw):
    C.sec("rel")
    b, pg = boot_season(pw, "notitle&nosave&nobf&" + LITE)
    pg.evaluate(SNAP % "S.bq.k=0.1;S.bq.ck=0.1;S.bq.m=0.10;")
    R = lambda setup="", mins=90, probe=None: pg.evaluate(RRUN, [setup, mins, probe])
    base = R("", 120)
    # (v6.10: AUTO-LW (07g weTick) trims the setpoint down while ring crush is over 1.03 x spec; untouched, rct 60 against a
    #  59.95 target, so the setpoint creeps slowly lighter (trim about -0.0004 here). The AUTO trim W.c integrates the QCS
    #  reading, which is 3 min old and so a touch over a setpoint that keeps moving down, so the weight settles ~0.001 lb
    #  (0.004%) under it instead of exactly on it as before. Within 0.1% of the setpoint is on target.)
    ok("untouched: weight on the grade's target, headbox at 0.8%", abs(base["bw"] - base["sp"]) <= 1e-3 * base["sp"] and abs(base["hbc"] - 0.8) < 0.005 and base["mode"] == "auto", json.dumps({k: base[k] for k in ("bw", "sp", "trim", "hbc", "prod")}))
    ok("untouched: silo full and overflowing to the water chest", base["L"] >= 84.9 and base["over"] > 50 and base["cav"] == 0, f'level {base["L"]}% overflow {base["over"]} t/h')
    ok("headbox water: drainage > dilution > thick stock, press water to the save-all", base["hb"] > 3000 and base["drain"] > base["dil"] > 0 and base["press"] > 50, json.dumps({k: base[k] for k in ("hb", "dil", "drain", "seal", "press")}))
    ok("untouched: ring crush on spec, no rejects from pressure drop, standard refining", base["rctq"] >= base["spec"] and base["yield"] == 1 and base["kwh"] == 60 and not base["out"], f'rct {base["rctq"]} spec {base["spec"]} out {base["out"]}')

    # ---- refining ----
    r90 = R("P.knob.set('ref',90);", 180)
    ok("more refining: lower freeness, lower couch solids, more refiner power", r90["csf"] < base["csf"] - 40 and r90["cs"] < base["cs"] - 0.5 and r90["refkw"] > base["refkw"] * 1.3, f'csf {r90["csf"]} vs {base["csf"]}, couch {r90["cs"]} vs {base["cs"]}, kW {r90["refkw"]} vs {base["refkw"]}')
    # (design, 07g rctNow: ring crush = RCT0 x (weight / grade weight) x (1 + 0.0045 per kWh/t over 60 ...), so 90 kWh/t is
    #  +13.5% strength at the same weight. Since v6.10 AUTO-LW spends that as a lighter sheet: it trims the weight until ring
    #  crush is back at 1.03 x spec or the trim reaches its -10% stop, so ring crush itself ends only ~+2% (0.9 x 1.135).
    #  Checked: strength per pound up >10% (most of the design 13.5% once the chest's refining lag has passed), ring crush
    #  still up, a lighter sheet, and the bigger energy bill.)
    sw = lambda r: r["rctq"] / r["meas"]
    ok("more refining: stronger paper (per pound, and AUTO-LW still leaves ring crush up), a lighter sheet and a bigger energy bill",
       sw(r90) > sw(base) * 1.10 and r90["rctq"] > base["rctq"] * 1.01 and r90["meas"] < base["meas"] and r90["energy"] > base["energy"],
       f'rct {r90["rctq"]} vs {base["rctq"]}, rct per lb x{sw(r90) / sw(base):.3f}, weight {r90["meas"]} vs {base["meas"]} (trim {r90["trim"]}), energy {r90["energy"]} vs {base["energy"]}')
    r30 = R("P.knob.set('ref',30);", 180)
    ok("less refining: freer stock drains faster but the sheet is weaker", r30["cs"] > base["cs"] and r30["rctq"] < base["rctq"], f'couch {r30["cs"]}, rct {r30["rctq"]}')

    # ---- a lighter setpoint: fails ring crush at standard refining, passes with more, and sells more area a ton ----
    lt = R("G.we.setTrim(G.we.bwSp()*0.95);", 60)
    ok("5% lighter at standard refining: weight on spec, ring crush out, to the beater", "rct" in lt["out"] and "bw" not in lt["out"] and abs(lt["meas"] - lt["sp"]) < 0.05, f'out {lt["out"]} rct {lt["rctq"]} spec {lt["spec"]} bw {lt["meas"]}')
    lr = R("G.we.setTrim(G.we.bwSp()*0.95);P.knob.set('ref',75);", 240)
    ok("5% lighter with 75 kWh/t: on spec, weight credit ~+5%, paper stamped light as it's made", not lr["out"] and lr["prem"] > 4.5 and lr["ra"] > 1.045, f'out {lr["out"]} rct {lr["rctq"]} credit {lr["prem"]}% area ratio {lr["ra"]}')
    hv = R("G.we.setTrim(G.we.bwSp()*1.03);", 120)
    ok("3% heavier: on spec, weight credit ~-3% (sells less a ton), paper stamped heavy", not hv["out"] and -3.3 < hv["prem"] < -2.4 and hv["ra"] < 0.98, f'out {hv["out"]} credit {hv["prem"]}% area ratio {hv["ra"]}')

    # ---- the BW loop: thick stock, dead time, correction; manual doesn't correct ----
    PROBE = "return [+G.we.state().bw.toFixed(3),+G.we.bwMeas().toFixed(3)];"
    th = R("S.wat.shortK=1;", 60, PROBE)
    ok("thick stock: the weight jumps but the QCS sees it 3 min late", th["tr"][0][0] > base["sp"] * 1.1 and abs(th["tr"][1][1] - base["sp"]) < 0.01, f'1 min: true {th["tr"][0][0]} measured {th["tr"][1][1]}')
    ok("AUTO brings the weight back to the setpoint", abs(th["meas"] - th["sp"]) < 0.25, f'after 60 min {th["meas"]} vs {th["sp"]} (valve {th["valve"]}%)')
    tm = R("G.we.setMode('manual');S.wat.shortK=1;", 60)
    ok("MANUAL holds the valve: the thick stock stays in the weight", tm["meas"] > tm["sp"] * 1.1 and tm["mode"] == "manual", f'{tm["meas"]} vs {tm["sp"]}')
    sm = R("G.we.setMode('manual');P.C.pmSp.auto=false;P.C.pmSp.v=Math.round(S.pmSpeed*0.92);", 60)
    ok("MANUAL: slowing down makes the sheet heavier", sm["meas"] > sm["sp"] * 1.04, f'{sm["meas"]} vs {sm["sp"]} at {sm["speed"]} fpm')
    sa = R("P.C.pmSp.auto=false;P.C.pmSp.v=Math.round(S.pmSpeed*0.92);", 60)
    ok("AUTO: the valve follows speed, the weight holds", abs(sa["meas"] - sa["sp"]) < 0.05 and sa["valve"] < base["valve"] * 0.95, f'{sa["meas"]} valve {sa["valve"]}% vs {base["valve"]}%')

    # ---- the silo ----
    sv = R("P.knob.set('vac',50);", 240, "const w=G.we.state();return [+(w.L/(60000/264.172)*100).toFixed(1),Math.round(w.f.seal||0)];")
    lv = [t[0] for t in sv["tr"]]; sl = max(t[1] for t in sv["tr"])
    ok("high vacuum sends more to the seal pit: the silo draws down", min(lv) < 30 and sl > base["seal"] * 1.2, f'lowest {min(lv)}% seal up to {sl} vs {base["seal"]}')
    ok("silo empty: fan pump cavitates and the sheet breaks at the wet end", sv["breaks"] >= 1, f'breaks {sv["breaks"]}, level {sv["L"]}%')

    # ---- bale water in the pulper ----
    bm = R("S.bq.m=0.20;", 90, "return +P.knob.read().cp.toFixed(2);")
    ok("wet bales thin the pulper, then dilution control takes it back out", min(bm["tr"]) < 4.7 and abs(bm["cp"] - 5) < 0.1, f'lowest {min(bm["tr"])}% back to {bm["cp"]}%')

    # ---- pressure drop -> rejects ----
    dr = R("S.bq.k=0.8;S.bq.ck=0.1;", 90)
    ok("dirty bales: higher pressure drop, more rejects (lower yield)", dr["yield"] < 0.99 and dr["prod"] <= base["prod"] + 0.01, f'yield {dr["yield"]}')
    dm = R("G.dcs.purgeSet('hd','manual');", 240)
    ok("an HD cleaner left on manual builds pressure drop and carries off fiber", dm["yield"] < 0.98, f'yield {dm["yield"]}')
    b.close()


def ref(pw):
    C.sec("ref")
    html = html_arg().replace("window.__PM={", "window.__PM={get RMX(){return {e:RM_E,col:RM_COL,tags:TAGS.map(t=>t[0])}},mcLvl:()=>mcLvlNow(),get M(){return S.M},civApply:(d,i)=>civApply(d,i,false),clearIncident:id=>clearIncident(id),", 1)
    b = launch(pw); pg = open_game(b, html, "env=rural&nobf&" + LITE, viewport=(1000, 700), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&__B.first!==null", timeout=300000)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg, "chip")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000); pg.evaluate(PIN_BN)
    ev = pg.evaluate
    ev("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;}")
    RUN = """(mins)=>{const P=__PM,S=P.S,o=[];S.cards.next=1e12;for(let i=0;i<mins*4;i++){P.step(0.25);if(S.civ&&S.civ.cur){S.civ.cur=null;S.cards.open=null;}if(S.cards.open&&!S.cards.open.civ)S.cards.open=null;
      if(i%4===0)o.push([Math.round(S.t),+P.mcLvl().toFixed(1),S.pm,+S.tank.toFixed(1),!!(S.M&&S.M.refOut)]);}return o;}"""
    ev("()=>{const S=__PM.S;S.inc=[];S.M=__PM.mods?__PM.mods():S.M;}")
    ev(f"({RUN})(60)")   # settle
    ev("()=>{__PM.S.feed.length=0}")
    r = ev("()=>{const S=__PM.S;S.cards.next=1e12;__PM.trigger('refclash');const i=S.inc.find(x=>x.id==='refclash');if(i){i.left=i.total=90;}return {inc:!!i,pm:S.pm,lvl:__PM.mcLvl()}}")
    ok("a clash starts with the machine still running on the machine chest", r["inc"] and r["pm"] == "run", json.dumps(r))
    tr = ev(f"({RUN})(150)")
    lv = [x[1] for x in tr]
    first_down = next((i for i, x in enumerate(tr) if x[2] != "run" and x[4]), None)
    ok("the machine chest runs down while the refiners are out", min(lv) <= 10.5, lv[:20])
    ok("the machine trips on low level a few minutes after the clash (not at once)", first_down is not None and 2 <= first_down <= 15, json.dumps([first_down, tr[:16]])[:400])
    dr = [x for x in tr if x[4] and x[2] == "run"]
    ok("the stock chest isn't drawn while the machine runs on the machine chest", len(dr) < 2 or dr[-1][3] >= dr[0][3] - 0.01, dr[:6])
    back = next((i for i, x in enumerate(tr) if not x[4]), None)
    ok("the refiners come back after the repair", back is not None, tr[-3:])
    after = tr[back:] if back is not None else []
    ok("the chest refills and the machine comes back (rethread)", any(x[1] >= 35 for x in after) and any(x[2] in ("run", "break") for x in after[5:]), json.dumps(after[:30])[:400])
    ok("the machine stays down while the refiners are out", all(x[2] != "run" for x in tr[first_down + 1:back]) if first_down is not None and back else False, tr[first_down:back][:10] if first_down else None)
    lg = ev("()=>__PM.S.feed.map(l=>l.text).join(' | ')")
    ok("the trip and the restart are logged", "Machine chest low level" in json.dumps(lg) and "coming back up" in json.dumps(lg), str(lg)[-600:])
    # the shortcut: run on one refiner until the outage
    ev(f"({RUN})(120)")
    r = ev("""()=>{const P=__PM,S=P.S;P.trigger('refclash');const i=S.inc.find(x=>x.id==='refclash');P.civApply({id:'refclash',kind:'up'},2);P.step(0.25);return {inc:S.inc.some(x=>x.id==='refclash'),fx:(S.fx||[]).map(f=>f.id)}}""")
    ok("'Run on one refiner' ends the trip and caps the machine until the outage", not r["inc"] and "band_refclash" in r["fx"], json.dumps(r))
    tr = ev(f"({RUN})(30)")
    ok("...and the machine keeps running", tr[-1][2] in ("run", "break") and tr[-1][1] > 30, tr[-5:])
    # the relationship map
    rm = ev("()=>__PM.RMX")
    keys = {(a, b2) for a, b2, *_ in rm["e"]}
    need = [("chest", "refq"), ("refq", "mcLvl"), ("gap", "refq"), ("x:upsets", "refq"), ("kwh", "couchSol"), ("kwh", "rct"), ("lv104op", "refq")]
    ok("relationship map: refiners fed from the stock chest, feeding the machine chest, the clash, and refining vs drainage", all(k in keys for k in need), [k for k in need if k not in keys])
    ok("relationship map: refq is a tag in the SPOT column", "refq" in rm["tags"] and "refq" in rm["col"]["SPOT"])
    ok("relationship map: weight -> weight credit -> profit (sold by area, v6.11.2)", ("bw", "prem") in keys and ("prem", "profit") in keys and ("bwsp", "prem") not in keys)
    b.close()


with sync_playwright() as pw:
    for f in (dryer, qual, dewater, water, winder, order, rel, ref):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()
