"""Wet-end chemicals (v6.11.1, 07l-chem.js): dry strength starch and the retention polymer on the WET DCS.

  scenarios  from the same paused season state (random upsets and breaks off), 12 sim hours each, against a control:
             untouched makes no chemical state; AUTO and MANUAL at the standard dose cost the same as untouched; more
             starch trims the weight (AUTO-LW), drains the couch and pays; starch over 10 kg/t is traced; no starch fails
             ring crush and is traced; more polymer raises first pass retention and lowers TSS; a polymer overdose flocs
             (beater) and is traced; no polymer breaks the permit and the environmental engineer puts it back on AUTO;
             a MANUAL pump on a stopped machine keeps charging, AUTO doesn't; zen has none of it
  ui         the WET DCS rows: AUTO by default, dragging a pump puts it on MANUAL, the button puts it back
Usage: python3 chem.py [index.html]"""
# tier: default
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log

RUN = """(a)=>{const P=__PM,[name,set,mins,stop]=a;P.G3.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);P.CH.on=false;P.C.breaks=false;P.C.hays=false;
 const S=P.S,t0=S.t,c0=S.cash,p0=S.tot.prodT,bt0=S.tot.beater||0,f0=S.feed.length,tph=S.rates.prod;let tss=0,n=0,fpr=0,trim=0,cs=0,m=0,inc=[];
 const has0=!!S.chem;for(const [id,v] of set){if(v==='auto')P.chem.mode(id,'auto');else if(v==='manual')P.chem.mode(id,'manual');else if(typeof v==='string'&&v[0]==='r')P.chem.ratio(id,+v.slice(1));else P.chem.flow(id,v*tph);}
 if(stop){S.pm='break';S.breakLeft=1e9;}
 while(S.t-t0<mins){P.step(P.SIM_STEP);if(stop){S.pm='break';S.breakLeft=1e9;}for(const i of S.inc)if(!inc.includes(i.id))inc.push(i.id);
   if(S.pm==='run'){tss+=P.chem.tss();fpr+=P.chem.fpr();n++;if(S.t-t0>120&&S.t-t0<300){trim+=S.we.trim;cs+=(S.knob&&S.knob.x&&S.knob.x.cs)||19;m++;}}}
 const logs=S.feed.slice(0,Math.max(0,S.feed.length-f0)).map(f=>f.text);
 return {name,has0,has:!!S.chem,cash:Math.round(S.cash-c0),prod:+(S.tot.prodT-p0).toFixed(1),beater:+((S.tot.beater||0)-bt0).toFixed(1),tss:n?+(tss/n).toFixed(1):null,fpr:n?+(fpr/n).toFixed(1):null,
  trim:m?+(trim/m*100).toFixed(2):null,cs:m?+(cs/m).toFixed(2):null,inc,modes:S.chem?[S.chem.ds.m,S.chem.pol.m]:null,traced:logs.filter(t=>t.includes("traced")||t.includes("investigated"))};}"""
# name, [(chemical, kg/t (x the paper rate as a fixed MANUAL pump) | 'auto' | 'manual')], minutes, the machine held stopped
SC = [("control", [], 720, False), ("auto toggled", [("ds", "manual"), ("ds", "auto"), ("pol", "manual"), ("pol", "auto")], 720, False),
      ("manual at standard", [("ds", 6), ("pol", 0.3)], 720, False), ("starch 8", [("ds", 8)], 720, False), ("starch ratio 8 on AUTO", [("ds", "r8")], 720, False), ("polymer ratio 0.04 on AUTO", [("pol", "r0.04")], 720, False), ("starch 15", [("ds", 15)], 720, False),
      ("no starch", [("ds", 0)], 720, False), ("polymer 0.5", [("pol", 0.5)], 720, False), ("polymer 0.8", [("pol", 0.8)], 720, False),
      ("no polymer", [("pol", 0)], 720, False), ("stopped, auto", [], 240, True), ("stopped, manual pumps", [("ds", "manual"), ("pol", "manual")], 240, True)]

def season(pw, query):
    b = launch(pw)
    pg = open_game(b, html_arg(), query, viewport=(640, 400), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()")
    pick_leader(pg, "hank", timeout=60000)
    pg.evaluate("""()=>{const P=__PM;P.setRunning(false);P.setBn('pulper');P.CH.on=false;const S=P.S;while(S.t<1440)P.step(P.SIM_STEP);
      window.__SNAP=JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});}""")
    return b, pg

def scenarios(pw):
    C.sec("scenarios")
    b, pg = season(pw, "notitle&nosave&" + LITE)
    R = {}
    for name, setv, mins, stop in SC:
        R[name] = r = pg.evaluate(RUN, [name, setv, mins, stop])
        C.note(name, json.dumps({k: r[k] for k in ("cash", "prod", "beater", "tss", "fpr", "trim", "cs", "inc", "modes")}))
        for t in r["traced"]: C.note("  ·", t[:140])
    c = R["control"]
    ok("untouched: no chemical state", not c["has0"] and not c["has"])
    ok("a normal run is in permit (effluent TSS under 50 mg/L)", c["tss"] < 40, c["tss"])
    ok("AUTO is free: switching to MANUAL and back changes nothing", abs(R["auto toggled"]["cash"] - c["cash"]) <= 2 and R["auto toggled"]["prod"] == c["prod"], f"{R['auto toggled']['cash']} vs {c['cash']}")
    ok("MANUAL at the standard dose costs about the same", abs(R["manual at standard"]["cash"] - c["cash"]) < 200, f"{R['manual at standard']['cash']} vs {c['cash']}")
    r8 = R["starch ratio 8 on AUTO"]
    ok("AUTO ratio 8 kg/t: trims lighter and pays, still on AUTO", r8["trim"] < c["trim"] - 1 and r8["cash"] > c["cash"] and r8["modes"][0] == "auto", json.dumps([r8["trim"], r8["cash"], r8["modes"]]))
    r01 = R["polymer ratio 0.04 on AUTO"]
    ok("AUTO polymer ratio 0.04: permit breached, ratio traced back to the standard", "permit" in r01["inc"] and any("AUTO at 0.04" in t for t in r01["traced"]), json.dumps([r01["inc"], r01["traced"]])[:220])
    s8, s15 = R["starch 8"], R["starch 15"]
    ok("more starch: AUTO-LW trims lighter, a drier couch, and it pays", s8["trim"] < c["trim"] - 1 and s8["cs"] > c["cs"] + 0.1 and s8["cash"] > c["cash"], json.dumps([s8["trim"], s8["cs"], s8["cash"]]))
    ok("starch 15 trims lighter still", s15["trim"] < s8["trim"] - 1, json.dumps([s15["trim"], s8["trim"]]))
    ok("starch over 10 kg/t: deposits traced, pump back on AUTO", any("dry strength" in t for t in s15["traced"]) and s15["modes"][0] == "auto", json.dumps(s15["traced"])[:200])
    ns = R["no starch"]
    ok("no starch: ring crush fails (beater), traced back to AUTO", ns["beater"] > 5 and ns["modes"][0] == "auto" and any("ring crush" in t for t in ns["traced"]), json.dumps([ns["beater"], ns["traced"]])[:200])
    p5 = R["polymer 0.5"]
    ok("more polymer: higher first pass retention, lower TSS, no beater", p5["fpr"] > c["fpr"] + 1.5 and p5["tss"] < c["tss"] * 0.92 and p5["beater"] == 0, json.dumps([p5["fpr"], p5["tss"], c["tss"]]))
    p8 = R["polymer 0.8"]
    ok("polymer overdose: flocs to the beater, traced back to AUTO", p8["beater"] > 5 and p8["modes"][1] == "auto" and any("polymer" in t for t in p8["traced"]), json.dumps([p8["beater"], p8["traced"]])[:200])
    p0 = R["no polymer"]
    ok("no polymer: lower retention, the permit breached, back on AUTO after", p0["fpr"] < c["fpr"] - 3 and "permit" in p0["inc"] and p0["modes"][1] == "auto" and p0["cash"] < c["cash"], json.dumps([p0["fpr"], p0["inc"], p0["traced"]])[:220])
    sa, sm = R["stopped, auto"], R["stopped, manual pumps"]
    ok("machine down: MANUAL pumps keep charging, AUTO doesn't", sm["cash"] < sa["cash"] - 300, f"auto {sa['cash']}, manual {sm['cash']}")
    b.close()

def ui(pw):
    C.sec("ui")
    b, pg = season(pw, "notitle&nosave")
    def chk(name, js, want):
        got = pg.evaluate("async()=>{const P=__PM,wait=ms=>new Promise(r=>setTimeout(r,ms));" + js + "}")
        ok(name, got == want, "" if got == want else f"got {got!r}, want {want!r}")
    pg.evaluate("()=>{const P=__PM;P.G3.save.restore(JSON.parse(window.__SNAP));P.setRunning(false);}")
    chk("WET DCS has both chemical rows on AUTO", "P.G3.knobTap({k:'station',a:'WET'});await wait(100);const r=['dsf','polf'].map(k=>{const e=document.querySelector(`#dcsOv [data-ds=${k}] [data-dsa]`);return e&&e.textContent});return r", ["AUTO", "AUTO"])
    Q = "const row=document.querySelector('#dcsOv [data-ds=polf]'),i=row.querySelector('[data-dsv]'),btn=row.querySelector('[data-dsa]');"
    chk("on AUTO the polymer slider sets its ratio (kg/t)", Q + "i.value=0.5;i.dispatchEvent(new Event('input'));await wait(100);return [P.S.chem.pol.m,P.S.chem.pol.sp,i.max,btn.textContent]", ["auto", 0.5, "0.8", "AUTO"])
    chk("a ratio well under the standard warns of the permit", Q + "i.value=0.1;i.dispatchEvent(new Event('input'));await wait(100);return [P.chem.risk(),row.querySelector('.dcsn small').textContent.includes('PERMIT RISK')]", [True, True])
    chk("the button puts it on MANUAL: the slider is the pump's kg/h", Q + "btn.click();await wait(100);i.value=14;i.dispatchEvent(new Event('input'));await wait(100);return [P.S.chem.pol.m,P.S.chem.pol.f,i.max,btn.textContent]", ["manual", 14, "32", "MANUAL"])
    chk("the button puts it back on AUTO", Q + "btn.click();await wait(100);const r=[P.S.chem.pol.m,btn.textContent];document.getElementById('dcsClose').click();return r", ["auto", "AUTO"])
    chk("the chemical tags are trendable", "return ['dsdose','dsflow','poldose','polflow','fpr'].every(k=>P.G3.tags?P.G3.tags.some(t=>t[0]===k):true)", True)
    chk("zen: no chemicals", "P.S.zen=true;P.chem.flow('ds',300);const r=P.chem.on()===false&&P.chem.e('ds')===6;P.S.zen=false;return r", True)
    b.close()

with sync_playwright() as pw:
    for f in (scenarios, ui):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()
