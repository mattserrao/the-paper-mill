"""v6.5.6 mass balance check. Water: over a season stretch with upsets on, fresh + bale water + beater water (+ any
shortfall) = evaporation + paper + rejects + sludge + outfall + the change in the white water chest and the storage
chest's water; the per-ton numbers sit where the old fixed ones did (≈9.9 in, ≈8.4 out). The white water chest: a
machine stop draws it down and fresh water makes up; with the intake iced as well it runs dry and the stock runs thick
(weight off spec). Fiber: hayout broke goes to the beater bay; soaked or burned bales, chest spills and scrapped rolls
show in the process flow's waste. Fails on any page error.
Usage: python3 watercheck.py <index.html>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
SNAPRUN = """(a)=>{const P=__PM,[setup,mins,chaos]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=!!chaos;P.C.breaks=!!chaos;P.C.hays=!!chaos;
  const S=P.S;(new Function('P','S','G',setup))(P,S,G);const w0=JSON.parse(JSON.stringify(S.wat||null)),sw=100/4.2-1,inv0=(S.wat?S.wat.L:0)+sw*S.tank,t0=S.t,good0=S.tot.prodT;
  let minL=1e9,maxShort=0,bwOut=0,maxFresh=0;
  while(S.t-t0<mins){P.step(P.SIM_STEP);if(S.cards&&S.cards.open)S.cards.open=null;const W=S.wat;minL=Math.min(minL,W.L);maxShort=Math.max(maxShort,W.shortK);maxFresh=Math.max(maxFresh,W.r.fresh);if(S.pm==="run"&&G.qual().out.includes("bw"))bwOut+=P.SIM_STEP;}
  const W=S.wat,T=W.tot,T0=w0?w0.tot:{},d=k=>T[k]-(T0[k]||0),inv1=W.L+sw*S.tank;
  return {in:d("fresh")+d("bale")+d("rep")+d("short"),out:d("evap")+d("prod")+d("rej")+d("sludge")+d("out"),dinv:inv1-inv0,parts:Object.fromEntries(Object.keys(T).map(k=>[k,+d(k).toFixed(1)])),
    good:S.tot.prodT-good0,minL,maxShort,bwOut,maxFresh,L:W.L,r:W.r,bank:S.q.bank,W:S.pf?S.pf.W:null};}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 900, "height": 600})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave&nobf&env=rural")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("""()=>{const P=__PM;P.setRunning(false);P.CH.on=false;const S=P.S;while(S.t<1440)P.step(P.SIM_STEP);
      window.__SNAP=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});}""")
    R = lambda setup, mins, chaos=False: pg.evaluate(SNAPRUN, [setup, mins, chaos])

    # ---- closure over 6 days with upsets, breaks and hayouts on ----
    r = R("", 6 * 1440, True)
    res = r["in"] - r["out"] - r["dinv"]
    ok("water balance closes over 6 days with upsets (in − out − Δinventory ≈ 0)", abs(res) < 1e-3 * max(1, r["in"]), f'in {r["in"]:.0f} out {r["out"]:.0f} Δinv {r["dinv"]:.0f} residual {res:.3f}; {json.dumps(r["parts"])}')
    per = lambda k: r["parts"][k] / max(1, r["parts"]["paper"])   # (a ton of paper made, beater included)
    ok("fresh water near 9.9 m³ a ton (was the fixed figure)", 8.5 < per("fresh") < 11.5, f'{per("fresh"):.2f} m³/t')
    ok("outfall near 8.4 m³ a ton", 7.0 < per("out") < 10.0, f'{per("out"):.2f} m³/t')
    ok("dryer evaporation about 1.1 m³ a ton", 0.95 < per("evap") < 1.25, f'{per("evap"):.2f} m³/t')

    # ---- steady running: chest overflows a little to the sewer, no makeup ----
    s = R("", 240)
    ok("steady: the white water chest sits at its overflow, no fresh makeup", s["r"]["make"] < 1 and s["r"]["over"] > 50 and abs(s["L"] / 2000 - 0.7) < 0.02, json.dumps({k: round(v) for k, v in s["r"].items()}))

    # ---- a machine stop: stock prep keeps pulping, the chest draws down, fresh water makes up ----
    d = R("S.tank=60;P.trigger('shaft');", 120)   # (a low storage chest, so stock prep keeps pulping)
    ok("machine down: fresh makeup flows (intake doesn't drop to zero)", d["maxFresh"] > 200 and d["r"]["fresh"] > 60, f'max fresh {d["maxFresh"]:.0f} m³/h, chest low {d["minL"]:.0f} m³')

    # ---- iced intake and a machine stop: no makeup, the chest runs dry, stock thick, weight out of spec ----
    e = R("S.tank=60;P.trigger('shaft');P.trigger('icedintake');", 420)
    ok("iced intake + machine down: the white water chest runs dry", e["minL"] < 1 and e["maxShort"] > 0.5, f'low {e["minL"]:.0f} m³, shortK {e["maxShort"]:.2f}')
    ok("…and the thick stock puts the weight out of spec when it restarts", e["bwOut"] > 5, f'{e["bwOut"]:.0f} min out on weight')

    # ---- fiber accounting fixes ----
    h = pg.evaluate("()=>{const P=__PM;P.G3.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);const S=P.S,b0=S.q.bank,w0=S.pf.W.broke;S.winderBuf=Math.max(S.winderBuf,20);S.winderAcc=Math.max(S.winderAcc,4);P.G3.hayout();return {bank:S.q.bank-b0,broke:S.pf.W.broke-w0}}")
    ok("hayout broke goes to the beater bay and the books", h["bank"] > 1 and abs(h["bank"] - h["broke"]) < 1e-6, json.dumps(h))
    up = pg.evaluate("""()=>{const P=__PM,G=P.G3;const out={};for(const [id,k] of [['chestover','spill'],['balefire','bale'],['overflow','bale']]){G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);const S=P.S;if(id==='chestover')S.tank=200;const w0=S.pf.W[k]||0;P.CH.on=true;P.CH.en[id]=true;try{P.trigger(id);}catch(e){out[id]='ERR '+e.message;continue;}out[id]=+(S.pf.W[k]-w0).toFixed(1);}return out}""")
    ok("chest spill, bale fire and the flooded bale yard are booked as waste", all(isinstance(v, (int, float)) and v > 0 for v in up.values()), json.dumps(up))
    b.close()
ok("no page errors", not errs, "; ".join(errs[:5]))
print("\n".join(log)); fails = [l for l in log if l.startswith("FAIL")]
print(f"\n{len(log) - len(fails)}/{len(log)} passed"); sys.exit(1 if fails else 0)
