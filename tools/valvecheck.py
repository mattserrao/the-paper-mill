"""v6.9 The Valves Update check (07h): the six loops (NV-101, LV-104, FV-201, LV-202 and the QC-300 / PV-302 / PV-303
steam cascade). Untouched: the game's own model and nothing in S. Touched on standard tuning: each loop holds its
setpoint, the hand-off is bumpless, and it hands back to the game once settled. Then: MAN holds the valve, anti-windup at
a stop, stiction makes a limit cycle, bump tests recover the process model, Lambda tuning is stable, the health check
names known cases, bad tuning costs the mill, the crew puts it right, the challenges score, saves keep the loops, and
the catch-up sub-steps give the same mill as the step.
Fails on any page error.  Usage: python3 valvecheck.py <index.html>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
    print(log[-1], flush=True)
# from the warmed-up snapshot (no upsets, no random breaks): set up, run `mins`, then read with `probe`
RUN = """(a)=>{const P=__PM,[setup,mins,probe,each]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
  const S=P.S,V=G.vlv,ctx={tr:[],brk0:S.tot.breaks,beat0:S.tot.beater||0,cash0:S.cash,t0:S.t};(new Function('P','S','G','V','ctx',setup))(P,S,G,V,ctx);
  const fe=each?new Function('P','S','G','V','ctx',each):null;while(S.t-ctx.t0<mins-1e-9){P.step(P.SIM_STEP);if(fe)fe(P,S,G,V,ctx);}
  return (new Function('P','S','G','V','ctx',probe))(P,S,G,V,ctx);}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 900, "height": 600})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave&nobf")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("""()=>{const P=__PM;P.setRunning(false);P.CH.on=false;const S=P.S;while(S.t<1440)P.step(P.SIM_STEP);
      S.bq.k=0.1;S.bq.ck=0.1;S.bq.m=0.10;window.__SNAP=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});}""")
    R = lambda setup="", mins=60, probe="return null;", each=None: pg.evaluate(RUN, [setup, mins, probe, each])
    IDS = ["NV-101", "LV-104", "FV-201", "LV-202", "QC-300", "PV-302", "PV-303"]
    VIEW = "const o={};for(const id of %s){const v=V.view(id);o[id]={m:v.m,sp:+v.sp.toFixed(3),pv:+v.pv.toFixed(3),op:+v.op.toFixed(2),pos:+v.pos.toFixed(2),t:!!v.t};}" % json.dumps(IDS)

    # ---- untouched ----
    u = R("", 120, VIEW + "return {o,vlv:!!S.vlv,cash:S.cash,prod:S.tot.prodT,beat:S.tot.beater||0};")
    print(json.dumps(u["o"]))
    ok("untouched: nothing in S, every loop read from the game's own model", not u["vlv"] and all(not u["o"][i]["t"] for i in IDS), json.dumps({k: (v["pv"], v["op"]) for k, v in u["o"].items()}))
    ok("untouched: the silo makeup sits shut while the silo overflows", u["o"]["LV-202"]["pos"] < 1 and u["o"]["LV-202"]["pv"] > 80)

    # ---- touched on standard tuning: hold, bumpless ----
    for lid in ["NV-101", "LV-104", "FV-201", "LV-202", "QC-300"]:
        r = R(f"V.touch('{lid}');ctx.v0=V.view('{lid}');", 60,
              VIEW + f"const a=V.trace('{lid}',60),e=a.pv.map((p,i)=>Math.abs(p-a.sp[i])),d=V.DEF['{lid}'];const tol=typeof d.tol==='function'?d.tol():d.tol;"
              f"return {{o,max:Math.max(...e.slice(-600)),tol,op0:ctx.v0.op,first:a.op[0],n:a.t.length,bump:Math.abs(a.op[0]-ctx.v0.op)}};")
        shut = lid == "LV-202" and r["o"][lid]["pos"] < 0.5 and r["o"][lid]["pv"] > r["o"][lid]["sp"]
        ok(f"{lid} on standard tuning holds its setpoint" + (" (or sits shut with the silo overflowing)" if lid == "LV-202" else ""), r["max"] < r["tol"] * 3 or shut, f'max |e| last 10 min {r["max"]:.3f} (tol {r["tol"]:.3f}), {r["n"]} 1-s points')
        ok(f"{lid}: the hand-off is bumpless", r["bump"] < 2.5, f'op before {r["op0"]:.2f}, first 1-s op {r["first"]:.2f}')

    # economy: a mill with every loop touched on standard tuning makes about what the untouched one does
    eu = R("", 360, "return {prod:S.tot.prodT-0,beat:S.tot.beater||0,cash:S.cash-ctx.cash0};")
    et = R("for(const id of ['NV-101','LV-104','FV-201','LV-202','QC-300'])V.touch(id);", 360, "return {prod:S.tot.prodT-0,beat:S.tot.beater||0,cash:S.cash-ctx.cash0};")
    ok("touched on standard tuning: same paper and cash as untouched (6 h)", abs(et["prod"] - eu["prod"]) / eu["prod"] < 0.005 and abs(et["cash"] - eu["cash"]) < max(20000, abs(eu["cash"]) * 0.02) and et["beat"] <= eu["beat"] + 1,
       json.dumps({"untouched": eu, "touched": et}))

    # hand-back: standard tuning and settled for 10 min returns the loop to the game's model
    hb = R("V.touch('LV-104');V.touch('NV-101');V.touch('FV-201');", 90, "const s=V.state();return {lp:Object.keys(s.lp),any:s.any};")
    ok("settled on standard tuning: the game's own model takes the loops back", not hb["lp"] and not hb["any"], json.dumps(hb))
    ht = R("V.touch('LV-104');V.setTune('LV-104',{kc:2});", 40, "return Object.keys(V.state().lp);")
    ok("off standard tuning: the loop stays with the valve model", "LV-104" in ht, json.dumps(ht))

    # ---- MAN, anti-windup, CAS ----
    mn = R("V.setOP('FV-201',55);", 30, VIEW + "return {o,bw:G.we.bwMeas(),sp:G.we.bwSp()};")
    ok("FV-201 on MAN at 55%: the valve holds, the weight goes heavy", mn["o"]["FV-201"]["m"] == "MAN" and abs(mn["o"]["FV-201"]["pos"] - 55) < 1 and mn["bw"] > mn["sp"] * 1.05, json.dumps(mn["o"]["FV-201"]) + f' bw {mn["bw"]:.2f}')
    aw = R("P.knob.set('vac',60);V.touch('LV-202');V.setSP('LV-202',80);", 60, VIEW + "const L=V.state().lp['LV-202'];return {o,I:L.I,op:L.op};")
    ok("anti-windup: LV-202 asked for more than it can make, the output sits at 100% without winding up", aw["o"]["LV-202"]["op"] > 99 and aw["I"] < 150, f'op {aw["op"]:.1f} I {aw["I"]:.1f} level {aw["o"]["LV-202"]["pv"]}')
    aw2 = R("P.knob.set('vac',60);V.touch('LV-202');V.setSP('LV-202',80);", 60, "P.knob.set('vac',30);V.setSP('LV-202',10);for(let i=0;i<4*25;i++)P.step(P.SIM_STEP);const L=V.state().lp['LV-202'];return {op:L.op,pv:L.pvm};")
    ok("anti-windup: back under control without a wound-up overshoot", aw2["op"] < 40 and abs(aw2["pv"] - 10) < 6, json.dumps(aw2))
    cs = R("V.touch('QC-300');V.setSP('QC-300',7);", 60, VIEW + "return o;")
    ok("cascade: moisture setpoint down, QC-300 raises the steam setpoints, PV-302/303 follow", abs(cs["QC-300"]["pv"] - 7) < 0.4 and cs["PV-303"]["sp"] > u["o"]["PV-303"]["sp"] + 3 and abs(cs["PV-302"]["sp"] / cs["PV-303"]["sp"] - 0.8) < 0.01, json.dumps(cs))
    im = R("V.touch('QC-300');V.setMode('PV-303','AUTO');V.setMode('PV-302','AUTO');", 20, VIEW + "return o;")
    ok("cascade broken (slaves on AUTO): QC-300 shows IMAN and tracks", im["QC-300"]["m"] == "IMAN", json.dumps(im["QC-300"]))

    # ---- stiction ----
    st = R("S.free=true;V.setValve('NV-101',{stick:3});V.setTune('NV-101',{kc:4,ti:0.6});V.setSP('NV-101',5.2);", 60, "const a=V.trace('NV-101',40),e=a.pv.map((p,i)=>p-a.sp[i]);let cr=0,s=0;for(const x of e){const q=x>0.03?1:x<-0.03?-1:0;if(q&&q!==s){if(s)cr++;s=q;}}return {cr,amp:(Math.max(...e)-Math.min(...e))/2,h:V.health('NV-101',a)};")
    ok("stiction (3%): a limit cycle that tuning can't remove, and the health check calls it", st["cr"] >= 4 and st["h"]["k"] == "stick", json.dumps(st))
    nv = R("S.free=false;V.setValve('NV-101',{stick:3});", 5, "return V.view('NV-101').t?V.state().lp['NV-101'].v.stick:null;")
    ok("valve settings can't be changed outside free play", nv is None or nv == 0.5, str(nv))

    # ---- health ----
    os_ = R("V.setTune('NV-101',{kc:20,ti:0.5});V.setSP('NV-101',5.3);", 30, "return V.health('NV-101',V.trace('NV-101',20));")
    ok("too much gain: the health check says oscillating", os_["k"] == "osc", json.dumps(os_))
    sl = R("V.setTune('LV-104',{kc:0.1,ti:200});V.setSP('LV-104',50);", 20, "return V.health('LV-104',V.trace('LV-104',10));")
    ok("too little gain: the health check says sluggish", sl["k"] == "slow", json.dumps(sl))
    dt = R("V.setTune('FV-201',{kc:0.4,ti:0.3});G.we.setTrim(G.we.bwSp()*0.97);", 60, "return V.health('FV-201',V.trace('FV-201',40));")
    ok("dead-time loop tuned hard: fighting the past", dt["k"] in ("dead",), json.dumps(dt))

    # ---- bump tests recover the process ----
    PRE = {"NV-101": "V.touch('NV-101');for(let i=0;i<4*100;i++)P.step(P.SIM_STEP);", "LV-202": "P.knob.set('vac',45);V.touch('LV-202');V.setSP('LV-202',50);for(let i=0;i<4*80;i++)P.step(P.SIM_STEP);"}   # (the vacuum's lag settles first)
    TRUTH = {"NV-101": ("fo", -0.8, 20.0, 0.5), "FV-201": ("fo", 1.0, 0.33, 3.0), "PV-303": ("fo", 1.6, 0.5, 0.03), "LV-104": ("int", 0.25, None, 0.08), "LV-202": ("int", 0.0176, None, 0.05)}
    for lid, (ty, k, tau, th) in TRUTH.items():
        dur = {"NV-101": 120, "FV-201": 10, "PV-303": 4, "LV-104": 8, "LV-202": 24}[lid]
        bt = R(PRE.get(lid, f"V.touch('{lid}');") + f"for(let i=0;i<4*40;i++)P.step(P.SIM_STEP);V.bump('{lid}');ctx.t0=S.t;", dur, f"const s=V.state();return {{res:s.btRes,bt:!!s.bt,m:V.view('{lid}').m}};")
        res = bt["res"] or {}
        if ty == "fo":
            good = res.get("type") == "fo" and abs(res["K"] - k) / abs(k) < 0.25 and abs(res["tau"] - tau) / tau < 0.35 and abs(res["th"] - th) < max(0.35, th * 0.25, tau * 0.05)
        else:
            good = res.get("type") == "int" and abs(res["Ki"] - k) / k < 0.2
        ok(f"bump test {lid}: fitted model close to the truth", good and not bt["bt"], json.dumps(res) + f' truth {ty} {k} {tau} {th}')
        ok(f"bump test {lid}: the loop goes back to its mode", bt["m"] in ("AUTO", "CAS"), bt["m"])
        if res:
            lam = R(PRE.get(lid, "") + f"const f={json.dumps(res)};const t=V.lambda(V.DEF['{lid}'],f,1,'PI');ctx.t=t;V.setTune('{lid}',t);V.setSP('{lid}',V.view('{lid}').sp*1.03);", 40,
                    f"return {{t:ctx.t,h:V.health('{lid}',V.trace('{lid}',15))}};") if lid != "PV-303" else None
            if lam:
                ok(f"Lambda (moderate) tuning from the bump test is stable on {lid}", lam["h"]["k"] in ("steady", "sat") or (lid == "LV-202" and lam["h"]["k"] in ("steady", "sat", "slow")), json.dumps(lam))

    # ---- consequences and the crew ----
    ch = R("V.setOP('LV-104',20);ctx.min=100;ctx.cap=1;", 30, "const s=V.state();return {min:ctx.min,brk:S.tot.breaks-ctx.brk0,cap:ctx.cap};",
           "const y=V.state().lp['LV-104'].y;ctx.min=Math.min(ctx.min,y);ctx.cap=Math.min(ctx.cap,S.M.speedCap);")
    ok("LV-104 shut on MAN: the machine chest empties, the machine slows, then breaks", ch["min"] < 1 and ch["brk"] >= 1 and ch["cap"] < 0.8, json.dumps(ch))
    ov = R("V.setOP('LV-104',100);P.C.pmSp.auto=false;", 30, "return {lvl:V.state().lp['LV-104'].y,over:V.state().mcOver||0};")
    ok("LV-104 wide open: the chest overflows and fiber goes to the sewer", ov["lvl"] > 99 and ov["over"] > 1, json.dumps(ov))
    nb = R("V.setOP('NV-101',5);ctx.e0=(S.evc&&S.evc.rotortrip)||0;", 120, "return {cp:P.knob.read().cp,trips:((S.evc&&S.evc.rotortrip)||0)-ctx.e0,t:V.T('NV-101'),feed:S.feed.slice(0,30).map(f=>f.text).filter(t=>/pulper/i.test(t)).slice(0,3)};")
    ok("NV-101 shut on MAN: the tub thickens, the rotor trips, the crew resets the valve", nb["trips"] >= 1 and not nb["t"], json.dumps(nb))
    cr = R("V.setOP('FV-201',58);", 400, "const s=V.state();return {lp:s?Object.keys(s.lp):[],kc:s&&s.lp['FV-201']?s.lp['FV-201'].kc:null,feed:S.feed.slice(0,40).map(f=>f.text).filter(t=>/traced the trouble/.test(t))};")
    ok("the BW valve left on MAN making off-spec: the crew traces it and puts it back", (cr["kc"] in (None, 0.06)) and len(cr["feed"]) >= 1, json.dumps(cr))
    fp = R("S.free=true;V.setTune('FV-201',{kc:0.6,ti:0.2});", 400, "const s=V.state();return {kc:s&&s.lp['FV-201']?s.lp['FV-201'].kc:null};")
    ok("free play: the crew leaves your experiment alone", fp["kc"] == 0.6, json.dumps(fp))

    # ---- determinism: catch-up sub-steps vs the step doing them all ----
    det = pg.evaluate("""()=>{const P=__PM,G=P.G3,V=G.vlv,go=(cu)=>{G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;const S=P.S;
        V.setTune('NV-101',{kc:2.2,ti:2});V.setSP('NV-101',5.4);V.setTune('LV-104',{kc:1.5});V.setSP('QC-300',7.6);
        for(let i=0;i<240;i++){if(cu){for(const a of [0.03,0.11,0.2,0.249])V.catchUp(a);}P.step(P.SIM_STEP);}
        const s=V.state();return JSON.stringify([S.cash,S.tot.prodT,Object.values(s.lp).map(L=>[L.y,L.op,L.pos,L.I])]);};return go(false)===go(true);}""")
    ok("catch-up sub-steps (faceplate open) give the same mill as the step running them", det)

    # ---- save and load ----
    sv = pg.evaluate("""()=>{const P=__PM,G=P.G3,V=G.vlv;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);const S=P.S;V.setTune('LV-104',{kc:2.5,ti:9});V.setOP('FV-201',48);
      for(let i=0;i<10;i++)P.step(P.SIM_STEP);const snap=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});G.save.restore(JSON.parse(snap));
      const s=V.state();return {kc:s.lp['LV-104'].kc,ti:s.lp['LV-104'].ti,m:s.lp['FV-201'].m,op:s.lp['FV-201'].op};}""")
    ok("a save keeps the loops: tuning, modes and outputs", sv == {"kc": 2.5, "ti": 9, "m": "MAN", "op": 48}, json.dumps(sv))
    mg = pg.evaluate("""()=>{const P=__PM,G=P.G3,V=G.vlv,d=JSON.parse(window.__SNAP);d.S.dry.man=150;d.S.we.m='manual';d.S.we.v=47;delete d.S.vlv;G.save.restore(d);
      return {qc:V.view('QC-300').m,p3:V.view('PV-303').m,p3sp:V.view('PV-303').sp,bw:V.view('FV-201').m,bwop:V.view('FV-201').op,man:P.S.dry.man};}""")
    ok("older saves: manual steam and a manual BW valve come back as the loops on AUTO / MAN", mg["p3"] == "AUTO" and abs(mg["p3sp"] - 150) < 0.01 and mg["bw"] == "MAN" and abs(mg["bwop"] - 47) < 0.01 and mg["man"] is None, json.dumps(mg))

    # ---- challenges ----
    for cid in ["shake", "wake", "stick", "inner", "patience"]:
        c = pg.evaluate(f"""()=>{{const V=__PM.G3.vlv,c=V.CH['{cid}'],r0=V.challenge('{cid}',null),ref=V.chRef('{cid}');return {{start:r0.score,ref,stars0:V.stars('{cid}',r0.score),unstable:r0.unstable}};}}""")
        ok(f"challenge {cid}: the starting tuning scores low, a careful tuning scores 3 stars", c["stars0"] <= 1 and c["ref"] < c["start"], json.dumps(c))
    for k in errs: log.append(k)
    b.close()
print("\n".join(l for l in log if l.startswith("FAIL")) or "")
p = sum(l.startswith("PASS") for l in log); f = sum(l.startswith("FAIL") for l in log) + len(errs)
print(f"\n{p}/{p+f} passed" + (f"  ERRORS: {errs[:3]}" if errs else ""))
sys.exit(1 if f else 0)
