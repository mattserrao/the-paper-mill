"""v6.8 process relationships check (07g): headbox at 0.8% and the fan pump dilution, the basis weight loop and its dead
time, the white water silo (overflow, draw-down, cavitation break), refining energy -> freeness, couch solids and ring
crush, a lighter setpoint with the lightweight premium, bale water in the pulper, and pressure drop -> rejects.
Fails on any page error.  Usage: python3 relcheck.py <index.html>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
# from the warmed-up snapshot (no upsets or random breaks): set things up, run, read
RUN = """(a)=>{const P=__PM,[setup,mins,probe]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
  const S=P.S,W=G.we;(new Function('P','S','G',setup))(P,S,G);const t0=S.t,tr=[];const brk0=S.tot.breaks;
  while(S.t-t0<mins){P.step(P.SIM_STEP);if(probe&&Math.abs((S.t-t0)%1)<1e-6)tr.push((new Function('P','S','G',probe))(P,S,G));}
  const r=P.knob.read(),w=W.state(),q=G.qual();
  return {bw:+w.bw.toFixed(3),meas:+W.bwMeas().toFixed(3),sp:+W.bwSp().toFixed(3),hbc:+w.hbc.toFixed(3),L:+(w.L/(60000/264.172)*100).toFixed(1),cav:+w.cav.toFixed(2),
    hb:Math.round(w.f.hb||0),dil:Math.round(w.f.dil||0),drain:Math.round(w.f.drain||0),seal:Math.round(w.f.seal||0),press:Math.round(w.f.press||0),over:Math.round(w.f.over||0),
    cs:+r.couchSol.toFixed(2),csf:Math.round(r.csf),kwh:Math.round(r.kwh),refkw:Math.round(r.refkw),cp:+r.cp.toFixed(2),rct:+q.rct?.toFixed?.(1)||0,rctq:+(G.we.rct()).toFixed(1),spec:G.we.rctSpec(),
    out:q.out,prem:+(W.premShare()*100).toFixed(2),premT:Math.round(S.tot.prem||0),yield:+W.dpYield().toFixed(4),prod:+S.rates.prod.toFixed(2),breaks:S.tot.breaks-brk0,pm:S.pm,
    speed:Math.round(S.pmSpeed),valve:+w.v.toFixed(1),mode:w.m,energy:Math.round(S.ledger.energy),tr};}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 900, "height": 600})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave&nobf")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("""()=>{const P=__PM;P.setRunning(false);P.CH.on=false;const S=P.S;while(S.t<1440)P.step(P.SIM_STEP);
      S.bq.k=0.1;S.bq.ck=0.1;S.bq.m=0.10;window.__SNAP=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});}""")
    R = lambda setup="", mins=90, probe=None: pg.evaluate(RUN, [setup, mins, probe])
    base = R("", 120)
    ok("untouched: weight on the grade's target, headbox at 0.8%", abs(base["bw"] - base["sp"]) < 1e-9 and abs(base["hbc"] - 0.8) < 0.005 and base["mode"] == "auto", json.dumps({k: base[k] for k in ("bw", "sp", "hbc", "prod")}))
    ok("untouched: silo full and overflowing to the water chest", base["L"] >= 84.9 and base["over"] > 50 and base["cav"] == 0, f'level {base["L"]}% overflow {base["over"]} t/h')
    ok("headbox water: drainage > dilution > thick stock, press water to the save-all", base["hb"] > 3000 and base["drain"] > base["dil"] > 0 and base["press"] > 50, json.dumps({k: base[k] for k in ("hb", "dil", "drain", "seal", "press")}))
    ok("untouched: ring crush on spec, no rejects from pressure drop, standard refining", base["rctq"] >= base["spec"] and base["yield"] == 1 and base["kwh"] == 60 and not base["out"], f'rct {base["rctq"]} spec {base["spec"]} out {base["out"]}')

    # ---- refining ----
    r90 = R("P.knob.set('ref',90);", 180)
    ok("more refining: lower freeness, lower couch solids, more refiner power", r90["csf"] < base["csf"] - 40 and r90["cs"] < base["cs"] - 0.5 and r90["refkw"] > base["refkw"] * 1.3, f'csf {r90["csf"]} vs {base["csf"]}, couch {r90["cs"]} vs {base["cs"]}, kW {r90["refkw"]} vs {base["refkw"]}')
    ok("more refining: stronger paper and a bigger energy bill", r90["rctq"] > base["rctq"] * 1.05 and r90["energy"] > base["energy"], f'rct {r90["rctq"]} vs {base["rctq"]}, energy {r90["energy"]} vs {base["energy"]}')
    r30 = R("P.knob.set('ref',30);", 180)
    ok("less refining: freer stock drains faster but the sheet is weaker", r30["cs"] > base["cs"] and r30["rctq"] < base["rctq"], f'couch {r30["cs"]}, rct {r30["rctq"]}')

    # ---- a lighter setpoint: fails ring crush at standard refining, passes with more, and earns the premium ----
    lt = R("G.we.setTrim(G.we.bwSp()*0.95);", 60)
    ok("5% lighter at standard refining: weight on spec, ring crush out, to the beater", "rct" in lt["out"] and "bw" not in lt["out"] and abs(lt["meas"] - lt["sp"]) < 0.05, f'out {lt["out"]} rct {lt["rctq"]} spec {lt["spec"]} bw {lt["meas"]}')
    lr = R("G.we.setTrim(G.we.bwSp()*0.95);P.knob.set('ref',75);", 240)
    ok("5% lighter with 75 kWh/t: on spec, lightweight premium paid", not lr["out"] and lr["prem"] > 2 and lr["premT"] > 0, f'out {lr["out"]} rct {lr["rctq"]} prem {lr["prem"]}% paid {lr["premT"]}')

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
ok("no page errors", not errs, "; ".join(errs[:5]))
print("\n".join(log)); fails = [l for l in log if l.startswith("FAIL")]
print(f"\n{len(log) - len(fails)}/{len(log)} passed"); sys.exit(1 if fails else 0)
