"""Steam and sheet (v6.13, claude/v613-steam-sheet-plan.md): the dryer cans and the steam and condensate cascade (PDC-304,
the thermocompressor's hand valve, a broken syphon and the IR survey), the hood air and the fog fan, energy (condensate
return, makeup, heat recovery), the headbox (J/W, slice opening) and STFI CD, stickies deposits, the broke chest, the reel
turn-up and hardness, the break risk and where breaks go, the machine profile, and the new screens (STEAM, PROFILE,
BREAKS, ENERGY, SPC on QCS, the side elevation on WET/DET). Each scenario starts from the same paused season state with
random upsets and breaks off.
Usage: python3 steamsheet.py [index.html]"""
# tier: default
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log

SNAP = """()=>{const P=__PM;P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;const S=P.S;while(S.t<720)P.step(0.25);
  window.__SNAP=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:1,cash:S.cash});}"""
# from the snapshot: setup (JS with P, S, G), run mins, then a probe (JS returning an object); mx: maxima watched each step
RUN = """(a)=>{const P=__PM,[setup,mins,probe]=a,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
  const S=P.S,c0=S.cash,b0=S.tot.breaks,o0=S.q.off,e0=S.ledger.energy,p0=S.tot.prodT;(new Function('P','S','G',setup))(P,S,G);const t0=S.t,T=()=>P.S.stm;
  const mx={fl:0,H:0,hum:0,drip:0,roof:0,waste:0,dl:0,bk:0,tbf:0,m:0,off:0,R:0},mn={ret:1,R:9};const Hs=G.steam;
  while(S.t-t0<mins){P.step(0.25);if(S.cards&&S.cards.open)S.cards.open=null;const Z=T();mx.fl=Math.max(mx.fl,Z.fl.reduce((a,b)=>a+b,0));mx.H=Math.max(mx.H,Z.H);mx.hum=Math.max(mx.hum,Z.hum);
    mx.drip=Math.max(mx.drip,Z.drip);mx.roof=Math.max(mx.roof,Z.roof);mx.waste=Math.max(mx.waste,Z.waste);mx.dl=Math.max(mx.dl,P.rel?0:0);mx.bk=Math.max(mx.bk,S.bk?S.bk.f:0);mx.tbf=Math.max(mx.tbf,S.tbf||0);
    mx.m=Math.max(mx.m,S.dry.m);const R=G.sheet.brk().R;mx.R=Math.max(mx.R,R);mn.R=Math.min(mn.R,R);mn.ret=Math.min(mn.ret,Z.ret);}
  return Object.assign({cash:S.cash-c0,brk:S.tot.breaks-b0,off:S.q.off-o0,energy:S.ledger.energy-e0,prod:S.tot.prodT-p0,mx,mn,feed:S.feed.slice(0,30).map(f=>f.text)},(new Function('P','S','G','return ('+probe+')'))(P,S,G));}"""

def sim(pw):
    C.sec("sim")
    b = launch(pw); pg = open_game(b, html_arg(), "notitle&nosave&" + LITE, viewport=(900, 600), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate(SNAP)
    R = lambda setup, mins, probe="{}": pg.evaluate(RUN, [setup, mins, probe])
    base = R("", 180, "{dp:S.stm.dp.slice(),need:G.steam.need(2),demF:G.steam.demF(),prof:G.sheet.prof(),cs:P.knob.read().couchSol,ps:P.knob.read().pressSol,m:S.dry.m,hbc:S.we.hbc,R:G.sheet.brk().R,stfi:G.sheet.stfi(),spec:G.sheet.stfiSpec(),hum:S.stm.hum,ret:S.stm.ret,kpi:S.stm.kpi,knob:!!(S.knob&&S.knob.any)}")
    ok("untouched: no flooded cans, demand factor 1, ΔP on AUTO's schedule over what the speed needs", base["mx"]["fl"] == 0 and base["demF"] == 1 and abs(base["dp"][2] - base["need"] - 12) < 0.6, json.dumps({k: base[k] for k in ("dp", "need", "demF")}))
    ok("untouched: hood at 160 g/kg, no drips, room 62% RH, condensate back 85%, no waste", 150 < base["mx"]["H"] < 172 and base["mx"]["drip"] == 0 and base["mx"]["roof"] == 0 and base["mn"]["ret"] > 0.849 and base["mx"]["waste"] == 0, json.dumps({k: base["mx"][k] for k in ("H", "drip", "roof", "waste")}))
    ok("untouched: no knob state, break risk about 1, STFI over spec", not base["knob"] and 0.95 < base["R"] < 1.15 and base["stfi"] > base["spec"], json.dumps({k: base[k] for k in ("knob", "R", "stfi", "spec")}))
    k = base["kpi"]; ok("energy KPIs in the real range: 1.3-2.2 t steam/t, 250-700 kWh/t", 1.3 < k["st"] < 2.2 and 250 < k["kwh"] < 700, json.dumps(k))
    pf = base["prof"]
    ok("profile: headbox, couch, press and reel stations match the sim", abs(pf[0][3] - base["hbc"]) < 0.01 and abs(pf[5][3] - base["cs"]) < 0.05 and abs(pf[7][3] - base["ps"]) < 0.05 and abs(pf[-1][3] - (100 - base["m"])) < 0.05
       and all(pf[i][3] <= pf[i + 1][3] + 1e-9 for i in range(len(pf) - 1)), json.dumps([[p[2], round(p[3], 2)] for p in pf]))
    # ---- the cascade ----
    tv = R("P.knob.set('tcv',30);", 240, "{off:P.knob.off?0:0,traced:S.knob.v.tcv}")
    ok("TC hand valve pinched: the 3rd section floods, the dryer drive works harder; the crew traces it", tv["mx"]["fl"] > 1.5 and any("thermocompressor motive valve" in f for f in tv["feed"]) and tv["traced"] == 100, json.dumps({"fl": tv["mx"]["fl"], "traced": tv["traced"]}))
    hi = R("P.G3.vlv.setSP('PDC-304',62);", 120, "{sp:G.steam.sp()}")
    ok("PDC-304 fixed high: steam blows through to the condenser, condensate return falls, it costs", hi["mx"]["waste"] > 0.3 and hi["mn"]["ret"] < 0.845 and hi["energy"] / 120 > base["energy"] / 180, json.dumps({"waste": hi["mx"]["waste"], "ret": hi["mn"]["ret"], "e/min": [hi["energy"] / 120, base["energy"] / 180]}))
    lo = R("P.G3.vlv.setSP('PDC-304',12);", 120, "{fl:G.steam.flooded()}")
    ok("PDC-304 fixed under what the speed needs: cans flood", lo["mx"]["fl"] > 1, lo["mx"]["fl"])
    sy = R("P.trigger('syphon');", 150, "{inc:S.inc.map(i=>i.id),pmd:S.M.pmDown,pm:S.pm,cold:S.stm.cold,ir:(G.steam.ir(),S.stm.ir.c.slice())}")
    sy2 = R("S.stm.cold=3;P.trigger('syphon');", 150, "{pmd:S.M.pmDown,inc:S.inc.map(i=>i.id)}")
    sy60 = R("P.trigger('syphon');", 60, "{can:S.inc.find(i=>i.id==='syphon').can,ir:(G.steam.ir(),S.stm.ir.c.slice()),fl:S.stm.fl.slice()}")
    cold = sy60["ir"][sy60["can"]]; others = [v for j, v in enumerate(sy60["ir"]) if j != sy60["can"] and abs(j - sy60["can"]) > 0 and (j < 12) == (sy60["can"] < 12)]
    ok("broken syphon: its can floods and the IR survey shows it cold", sy60["fl"][sy60["can"]] > 0.9 and cold < min(others) - 20, json.dumps({"can": sy60["can"], "cold": cold, "others": min(others) if others else None}))
    ok("broken syphon: after about 2 h the crew valves the can off and runs on to the outage", sy["pmd"] != "syphon change" and sy["cold"] >= 0 and sy["ir"][sy["cold"]] < min(sy["ir"]) + 1 and any("valved off" in f for f in sy["feed"]) and not any("Broken syphon: cleared" in f for f in sy["feed"]), json.dumps({"pmd": sy["pmd"], "cold": sy["cold"], "inc": sy["inc"], "feed": [f for f in sy["feed"] if "yphon" in f or "valved" in f][:3]}))
    ok("a second broken syphon with a can already valved off stops the machine to change both", sy2["pmd"] == "syphon change", json.dumps(sy2))
    # ---- the hood and the machine room ----
    ex = R("P.G3.steam.setFan('exh',40);", 180, "{}")
    ok("too little hood exhaust: humid hood, condensate drips, beater spots, more break risk", ex["mx"]["H"] > 200 and ex["mx"]["drip"] > 0.3 and ex["off"] > 0.5 and ex["mx"]["R"] > 1.2, json.dumps({"H": ex["mx"]["H"], "drip": ex["mx"]["drip"], "off": ex["off"], "R": ex["mx"]["R"]}))
    sp = R("P.G3.steam.setFan('sup',100);P.G3.steam.setFan('exh',60);", 120, "{}")
    ok("supply over exhaust: the hood spills into the machine room", sp["mx"]["hum"] > 75, sp["mx"]["hum"])
    fg = R("P.G3.dcs.motSet('fog','off');", 25, "{}")
    ok("fog fan stopped: the machine room's humidity climbs and the roof drips", fg["mx"]["hum"] > 74 and fg["mx"]["roof"] > 0, json.dumps({"hum": fg["mx"]["hum"], "roof": fg["mx"]["roof"]}))
    hr = R("S.up.heatrec=1;", 180, "{}")
    ok("heat recovery: a lower energy bill for the same paper", hr["energy"] < base["energy"] * 0.985 and abs(hr["prod"] - base["prod"]) < 2, json.dumps({"e": [round(hr["energy"]), round(base["energy"])]}))
    # ---- the headbox and the sheet's strength ----
    jw = R("P.G3.sheet.setJw(0.965);", 240, "{stfi:G.sheet.stfi(),spec:G.sheet.stfiSpec(),tsr:G.sheet.tsr(),jw:G.sheet.jw()}")
    ok("hard drag (J/W 0.965): the fibers line up with the machine, STFI CD under spec, rolls to the beater; traced back", jw["off"] > 5 and any("STFI" in f for f in jw["feed"]) and any("headbox slice" in f for f in jw["feed"]) and abs(jw["jw"] - 0.985) < 1e-9,
       json.dumps({"off": jw["off"], "jw": jw["jw"], "tsr": jw["tsr"]}))
    # ---- the broke chest ----
    bk = R("S.pm='break';S.brkType='press';S.breakLeft=60;S.breakTotal=60;", 30, "{bk:S.bk.f,tank:S.tank}")
    ok("a break: the wet end keeps forming into the couch pit and the broke chest fills", bk["mx"]["bk"] > base["mx"]["bk"] + 2, json.dumps({"bk": bk["mx"]["bk"], "base": base["mx"]["bk"]}))
    bm = R("S.bk.f=58;P.G3.sheet.bkSet('manual',0.3);", 120, "{tbf:S.tbf}")
    ok("broke metered in at 30%: the stock chest's broke share climbs", bm["mx"]["tbf"] > base["mx"]["tbf"] + 0.04, json.dumps({"tbf": bm["mx"]["tbf"], "base": base["mx"]["tbf"]}))
    bf = R("S.tbf=0.4;", 20, "{R:G.sheet.brk().R,cs:P.knob.read().couchSol,stfi:G.sheet.stfi()}")
    ok("40% broke in the furnish: slower drainage, a weaker sheet, more break risk", bf["mx"]["R"] > base["R"] * 1.2 and bf["cs"] < base["cs"] - 0.3 and bf["stfi"] < base["stfi"] * 0.99, json.dumps({"R": bf["mx"]["R"], "cs": bf["cs"], "stfi": bf["stfi"]}))
    # ---- the reel ----
    tu = pg.evaluate("()=>{const P=__PM,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));const S=P.S;let n=0;for(let i=0;i<2000;i++){S.pm='run';const b=S.tot.breaks;G.sheet.turnup();if(S.tot.breaks>b)n++;}S.pm='run';return n/2000}")
    ok("turn-ups fail about 1 in 80 at standard", 0.004 < tu < 0.025, tu)
    hd = pg.evaluate("()=>{const P=__PM,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));G.sheet.reelSetNip(0.8);const a=[G.sheet.hard(),P.ev?0:0];G.sheet.reelSetNip(2);return [a[0],G.sheet.hard()]}")
    ok("a light reel drum nip winds a soft reel (standard 60)", hd[0] < 55 and hd[1] == 60, hd)
    # ---- breaks: the risk follows the process, the location follows the cause ----
    pr = R("P.knob.set('press',75);", 60, "{R:G.sheet.brk().R}")
    pr2 = R("P.knob.set('press',112);", 60, "{R:G.sheet.brk().R}")
    ok("a wetter sheet out of the presses breaks more; a drier one less", pr["R"] > base["R"] * 1.1 and pr2["R"] < base["R"] * 0.97, json.dumps({"75": pr["R"], "112": pr2["R"], "100": base["R"]}))
    wh = pg.evaluate("()=>{const G=__PM.G3;const B={parts:[['draw','',3,'dryer']],ev:0,R:3};const n={reel:0,dryer:0,press:0};for(let i=0;i<1000;i++)n[G.sheet.where(B,i/1000)]++;return n}")
    ok("breaks go where their cause is: a slack draw breaks mostly into the dryers", wh["dryer"] > wh["reel"] and wh["dryer"] > wh["press"], wh)
    # ---- save and continue keep it all ----
    sv = pg.evaluate("()=>{const P=__PM,G=P.G3;G.save.restore(JSON.parse(window.__SNAP));const S=P.S;P.knob.set('tcv',40);G.sheet.setJw(0.99);G.sheet.reelSetNip(2.6);G.sheet.bkSet('manual',0.12);for(let i=0;i<40;i++)P.step(0.25);const d=JSON.parse(JSON.stringify({v:1,S:P.S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:1,cash:S.cash}));G.save.restore(JSON.parse(window.__SNAP));G.save.restore(d);const T=P.S;return [T.knob.v.tcv,T.hb.jw,T.reelNip,T.bk.m,T.bk.sp,T.stm.fl.length,!!T.stk]}")
    ok("the new state saves and continues", sv == [40, 0.99, 2.6, "manual", 0.12, 20, True], sv)
    b.close()

def ui(pw):
    C.sec("ui")
    b = launch(pw); pg = open_game(b, html_arg(), "notitle&nosave&" + LITE, viewport=(1280, 900), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{const P=__PM;P.setRunning(false);P.CH.on=false;for(let i=0;i<4*600;i++){P.step(0.25);if(P.S.cards.open)P.S.cards.open=null;}const G=P.G3,B=G.sheet.brk();G.sheet.log('dryer',G.sheet.top(B),B);P.G3.steam.ir();}")
    for a, sel in (("STM", "#dcsOv [data-vlv='PDC-304']"), ("PROF", "#prCv"), ("BRK", "#brCv"), ("NRG", "#ngV div"), ("QCS", "#spcCv"), ("WET", "#dcsOv canvas[data-shs]"), ("DET", "#dcsOv [data-ds='nip']"), ("SPOT", "#dcsOv [data-ds='bkr']"), ("REL", "#rlyIr")):
        pg.evaluate(f"()=>__PM.G3.openStation('{a}','dcs')"); pg.wait_for_timeout(500)
        ok(f"{a} screen opens and shows its new part", pg.evaluate(f"()=>!!document.querySelector(\"{sel}\")"), a)
    pg.evaluate("()=>__PM.G3.openStation('BRK','dcs')"); pg.wait_for_timeout(500)
    lg = pg.evaluate("()=>document.querySelector('#brLog')&&document.querySelector('#brLog').textContent")
    ok("the break log lists the break with its causes", lg and ("into the dryers" in lg or "at the" in lg), (lg or "")[:160])
    ok("the PDC-304 faceplate opens from the STEAM screen", pg.evaluate("()=>{__PM.G3.openStation('STM','dcs');const v=document.querySelector(\"#dcsOv [data-vlv='PDC-304']\");v.dispatchEvent(new MouseEvent('click',{bubbles:true}));return !!document.querySelector('#vlvOv:not([hidden]), .vlvp:not([hidden])')}"))
    b.close()

with sync_playwright() as pw:
    for f in (sim, ui):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()
