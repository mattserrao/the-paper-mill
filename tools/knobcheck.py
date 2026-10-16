"""v5.6 fiddly knobs check: every knob, moved on its own (and the interacting pairs), plays out the way it should.
Each scenario starts from the same paused season state with random upsets and random breaks off, moves the knob(s),
runs the sim, and checks: the consequence happens, it happens LATER (not in the first minutes), it costs money, and the
crew traces it back and sets the knob to standard. An untouched run must create no knob state at all.
Usage: python3 knobcheck.py <index.html>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]

# name, knob settings, sim minutes, checks: inc = upset id that must happen; brk = min breaks; off = min off-spec share;
# after = the consequence must not start before this many minutes; fixed = these knobs must be back at standard at the end
SC = [
 ("untouched", {}, 600, {"none": True}),
 ("pulper too thick", {"pulp": 5}, 240, {"inc": "rotortrip", "after": 15, "fixed": ["pulp"]}),
 ("pulper too thin", {"pulp": 98}, 520, {"inc": "overflow", "after": 15, "fixed": ["pulp"]}),
 ("refiner clash", {"ref": 0.12}, 600, {"inc": "refclash", "after": 8, "fixed": ["ref"]}),
 ("press loading low", {"press": 55}, 600, {"inc": "boiler", "off": 0.05, "after": 20, "fixed": ["press"]}),
 ("press loading high", {"press": 145}, 600, {"off": 0.3, "brk": 1, "after": 10, "fixed": ["press"]}),
 ("chest agitator off", {"agit": 0}, 600, {"off": 0.3, "brk": 1, "after": 15, "fixed": ["agit"]}),
 ("oscillator off", {"osc": 0}, 600, {"inc": "oscfail", "off": 0.05, "after": 30, "fixed": ["osc"]}),
 ("vacuum low", {"vac": 6}, 720, {"brk": 1, "steam": 1.15, "after": 20, "fixed": ["vac"]}),
 ("vacuum high", {"vac": 60}, 720, {"inc": "fabric", "after": 120, "fixed": ["vac"]}),
 ("draw tight", {"draw": 3.6}, 600, {"brk": 1, "after": 10, "fixed": ["draw"]}),
 ("draw loose", {"draw": 0.3}, 600, {"off": 0.3, "after": 5, "fixed": ["draw"]}),
 ("dilution zones", {"zones": [[4, 9], [5, 8]]}, 400, {"off": 0.3, "after": 5, "fixed": ["zones"]}),
 ("guide manual", {"guide": {"gm": 0, "gt": 10}}, 900, {"inc": "fabric", "after": 60, "fixed": ["guide"]}),
 ("guide trimmed on auto", {"guide": {"gm": 1, "gt": 28}}, 1600, {"inc": "fabric", "after": 60, "fixed": ["guide"]}),
 ("couch agitator off + break", {"couch": 0, "_break": 90}, 400, {"inc": "couchpit", "after": 60, "fixed": ["couch"]}),
 ("steam1 high + refiner open (dry)", {"st1": 250, "ref": 0.95}, 600, {"off": 0.2, "dry": True, "after": 5, "fixed": ["st1"]}),
 ("steam1 low + refiner tight (wet)", {"st1": 0, "ref": 0.2}, 600, {"off": 0.05, "wet": True, "after": 10}),
 ("steam1 high alone (no off-spec)", {"st1": 200}, 400, {"maxoff": 0.0, "steam": 1.05}),
 ("refiner tight alone (steam only)", {"ref": 0.3}, 400, {"maxoff": 0.0, "steam": 1.1}),
]
RUN = """(a)=>{const P=__PM,[name,set,mins]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
  const S=P.S,t0=S.t,cash0=S.cash,inc0=S.tot.incidents,brk0=S.tot.breaks,beat0=S.tot.beater||0,feed0=S.feed.length;
  const seen=[],brks=[];let maxOff=0,maxSf=1,minM=99,maxM=0,first=null,bk=S.tot.breaks;
  for(const k in set){if(k==="_break")continue;if(k==="zones"){set[k].forEach(z=>P.knob.set("zones",z));}else P.knob.set(k,set[k]);}
  const hasKnob=!!S.knob;let forced=false;
  while(S.t-t0<mins){P.step(P.SIM_STEP);const dt=S.t-t0;
    if(set._break&&!forced&&dt>=set._break&&S.pm==="run"){forced=true;S.pm="break";S.brkType="press";S.breakLeft=60;S.breakTotal=60;S.tot.breaks++;}
    for(const i of S.inc)if(!seen.some(x=>x.real===i.real)){seen.push({id:i.id,real:i.real,t:Math.round(dt),knob:i.knob||null});if(first===null)first=dt;}
    if(S.tot.breaks>bk){bk=S.tot.breaks;brks.push(Math.round(dt));if(first===null&&!(forced&&brks.length===1))first=dt;}
    const K=S.knob;if(K){if(K.off>maxOff){maxOff=K.off;if(first===null&&K.off>0.02)first=dt;}maxSf=Math.max(maxSf,K.sf);if(K.any){minM=Math.min(minM,K.x.m);maxM=Math.max(maxM,K.x.m);}}}
  const logs=S.feed.slice(0,Math.max(0,S.feed.length-feed0)).map(f=>Math.round(f.t-t0)+": "+f.text).reverse();
  return {name,hasKnob,first:first==null?null:Math.round(first),inc:seen,breaks:brks,maxOff:+maxOff.toFixed(3),maxSf:+maxSf.toFixed(3),minM:+minM.toFixed(2),maxM:+maxM.toFixed(2),
    cash:S.cash,good:S.tot.prodT,beater:+((S.tot.beater||0)-beat0).toFixed(1),off:P.knob.off(),any:!!(S.knob&&S.knob.any),
    traced:logs.filter(t=>t.includes("traced")),logs:logs.slice(0,14)};}"""
fails = []
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 640, "height": 400})
    errs = []
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()")
    pg.wait_for_function("()=>{const o=document.getElementById('leadOv');return o&&!o.hidden}", timeout=60000)
    pg.evaluate("()=>{document.querySelector('#leadOv .ldcard[data-l=\"hank\"]').click();document.getElementById('ld-go').click()}")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=120000, polling=50)
    # warm the mill up for a day so the chest, rates and speed are steady, then keep that state for every scenario
    pg.evaluate("""()=>{const P=__PM;P.setRunning(false);P.setBn('pulper');P.CH.on=false;const S=P.S;while(S.t<1440)P.step(P.SIM_STEP);
      window.__SNAP=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});}""")
    ctrl = {}
    import os
    only = os.environ.get('ONLY')
    for name, setv, mins, chk in SC:
        if only and only not in name: continue
        if mins not in ctrl: ctrl[mins] = pg.evaluate(RUN, ["control", {}, mins])
        r = pg.evaluate(RUN, [name, setv, mins])
        # against the same stretch with nothing touched: cash out (repairs, steam) plus good paper not made (at the 23m price)
        r["cost"] = round(ctrl[mins]["cash"] - r["cash"] + (ctrl[mins]["good"] - r["good"]) * 713)
        bad = []
        ids = [x["id"] for x in r["inc"]]
        if chk.get("none"):
            if r["hasKnob"] or r["inc"] or r["breaks"] or r["maxOff"] > 0: bad.append("untouched run changed something")
        if "inc" in chk and chk["inc"] not in ids: bad.append(f"no {chk['inc']} (got {ids})")
        if "inc" in chk and chk["inc"] in ids and not any(x["id"] == chk["inc"] and x["knob"] for x in r["inc"]): bad.append("incident not tagged with its knob")
        if r["breaks"] and len(r["breaks"]) < chk.get("brk", 0): bad.append(f"breaks {r['breaks']}")
        if not r["breaks"] and chk.get("brk", 0): bad.append("no break")
        if r["maxOff"] < chk.get("off", 0): bad.append(f"off-spec only {r['maxOff']}")
        if "maxoff" in chk and r["maxOff"] > chk["maxoff"]: bad.append(f"off-spec {r['maxOff']} (should be none)")
        if r["maxSf"] < chk.get("steam", 0): bad.append(f"steam only {r['maxSf']}")
        if chk.get("dry") and r["minM"] > 4: bad.append(f"never dry (min moisture {r['minM']})")
        if chk.get("wet") and r["maxM"] < 10: bad.append(f"never wet (max moisture {r['maxM']})")
        if "after" in chk and r["first"] is not None and r["first"] < chk["after"]: bad.append(f"too soon: {r['first']} min")
        if "after" in chk and r["first"] is None: bad.append("nothing happened")
        if not chk.get("none") and chk.get("inc") or chk.get("off") or chk.get("brk"):
            if r["cost"] <= 0: bad.append("cost nothing")
        for k in chk.get("fixed", []):
            if k in r["off"]: bad.append(f"{k} not traced and reset")
        print(("PASS " if not bad else "FAIL ") + name, json.dumps({k: r[k] for k in ("first", "breaks", "maxOff", "maxSf", "minM", "maxM", "cost", "beater", "off")}), json.dumps([(x["id"], x["t"]) for x in r["inc"]]))
        for t in r["traced"]: print("     ·", t)
        if bad or os.environ.get("LOGS"): print("     !!", "; ".join(bad)); fails.append(name) if bad else None; print("     log:", "\n          ".join(r["logs"]))
    b.close()
for e in errs: print(e)
print("RESULT:", "OK" if not fails and not errs else f"FAIL {fails} {len(errs)} page errors")
