"""v6.5.4 DCS check: the making-beater alert (banner, WET under the dilution zones, alarm lists), the SPOT picture in
process order with the stock chest consistency, boiler and power on UTIL (not DET), the 2nd/3rd section steam control
(AUTO / MANUAL moves the moisture), and no row flicker on the setpoint rows. Fails on any page error.
Usage: python3 dcs654check.py <index.html> [screenshot_prefix]"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
shot = sys.argv[2] if len(sys.argv) > 2 else None
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1100, "height": 900})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave&nobf&gfx=low")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{const P=__PM;P.setRunning(false);P.CH.on=false;const S=P.S;while(S.t<600)P.step(P.SIM_STEP);}")
    refresh = lambda: pg.evaluate("()=>{const a=__PM.G3;a.openStation(document.getElementById('dcs-h')?(document.querySelector('#dcsOv [data-a][aria-pressed=true]')||{}).dataset.a||'SPOT':'SPOT');}")

    # ---- SPOT: process order, stock chest consistency ----
    pg.evaluate("()=>__PM.G3.openStation('SPOT','dcs')"); pg.wait_for_timeout(500)
    order = pg.evaluate("()=>[...document.querySelectorAll('#dcsOv .mimic [data-pg] title')].map(t=>t.textContent)")
    want = ["CONVEYOR", "PULPER", "RAGGER", "JUNK", "HD CLEANER", "COARSE SCR", "LC CLEANERS", "FINE SCR", "LW CLEANERS", "THICKENER", "STOCK CHEST", "REFINERS", "MACHINE CHEST", "DYE", "FAN PUMP", "WATER CHEST"]   # (v6.5.6: the white water chest, top right)
    ok("SPOT picture in process order (coarse → LC cleaners → fine screen …; stock chest → refiners → machine chest → fan pump)", order == want, str(order))
    xs = pg.evaluate("()=>Object.fromEntries([...document.querySelectorAll('#dcsOv .mimic [data-pg]')].map(g=>[g.querySelector('title').textContent,+g.querySelector('.pg-bg').getAttribute('x')]))")
    ok("bottom row runs right to left: stock chest, refiners, machine chest, fan pump", xs["STOCK CHEST"] > xs["REFINERS"] > xs["MACHINE CHEST"] > xs["FAN PUMP"], json.dumps(xs))
    stc = pg.evaluate("()=>{const t=document.querySelector('#dcsOv [data-tag=stc]');return t&&t.textContent}")
    ok("stock chest consistency on SPOT", bool(stc) and stc.endswith("%") and 3.5 < float(stc[:-1]) < 5, stc)
    if shot: pg.screenshot(path=f"{shot}-spot.png")

    # ---- flicker: setpoint rows don't toggle between refreshes ----
    pg.evaluate("""()=>{window.__L={};const o=document.getElementById('dcsOv');new MutationObserver(ms=>{for(const m of ms)if(m.attributeName==='class'&&m.target.matches&&m.target.matches('[data-ds]')){const k=m.target.dataset.ds;__L[k]=(__L[k]||0)+1;}}).observe(o,{subtree:true,attributes:true});__PM.setRunning(true);}""")
    pg.wait_for_timeout(6000)
    fl = pg.evaluate("()=>__L"); pg.evaluate("()=>__PM.setRunning(false)")
    ok("no setpoint row flicker (class changes on refresh)", not fl, json.dumps(fl))

    # ---- DET: no boiler/grid; 2nd/3rd steam control ----
    pg.evaluate("()=>__PM.G3.openStation('DET','dcs')"); pg.wait_for_timeout(400)
    det = pg.evaluate("()=>[...document.querySelectorAll('#dcsOv .mimic [data-pg] title')].map(t=>t.textContent)")
    ok("boiler and grid gone from DET", "BOILER" not in det and "GRID" not in det, str(det))
    ok("DET has the 2nd/3rd section steam valves on CAS under QC-300 (v6.9)", pg.evaluate("()=>!!document.querySelector('#dcsOv [data-vlv=PV-303]')&&__PM.G3.vlv.view('PV-303').m==='CAS'&&__PM.G3.vlv.view('QC-300').m==='AUTO'"))
    ok("DET still has the 1st section steam control", pg.evaluate("()=>!!document.querySelector('#dcsOv .kctl[data-k=st1]')"))
    m0 = pg.evaluate("()=>__PM.S.dry.m")
    pg.evaluate("()=>{const V=__PM.G3.vlv;for(const id of ['PV-302','PV-303'])V.setMode(id,'AUTO');V.setSP('PV-303',160);V.setSP('PV-302',128);for(let i=0;i<240;i++)__PM.step(0.25);}")
    st = pg.evaluate("()=>({m:__PM.S.dry.m,st3:__PM.S.dry.st3,dem:__PM.S.dry.dem,q:__PM.G3.qual(),qc:__PM.G3.vlv.view('QC-300').m})")
    ok("steam valves on AUTO at 160 kPa (well over the load) over-dry the sheet (moisture spec out), QC-300 on IMAN", st["m"] < m0 - 3 and "m" in st["q"]["out"] and st["qc"] == "IMAN", json.dumps({k: st[k] for k in ("m", "st3", "dem", "qc")}))
    pg.evaluate("()=>{const V=__PM.G3.vlv;V.revert('QC-300');for(let i=0;i<240;i++)__PM.step(0.25);}")
    st = pg.evaluate("()=>({m:__PM.S.dry.m,p3:__PM.G3.vlv.view('PV-303').m})")
    ok("back on standard tuning (CAS): moisture back at 8%", st["p3"] == "CAS" and abs(st["m"] - 8) < 0.3, json.dumps(st))
    if shot: pg.screenshot(path=f"{shot}-det.png")

    # ---- UTIL: boiler and power ----
    pg.evaluate("()=>__PM.G3.openStation('UTIL','dcs')"); pg.wait_for_timeout(400)
    ut = pg.evaluate("()=>[...document.querySelectorAll('#dcsOv .mimic [data-pg] title')].map(t=>t.textContent)")
    ok("boiler and grid on UTIL", "BOILER" in ut and "GRID" in ut, str(ut))
    ok("UTIL boiler readings (header, steam)", pg.evaluate("()=>['boiler','stm','grid'].every(k=>{const t=document.querySelector('#dcsOv [data-tag='+k+']');return t&&t.textContent!=='–'})"))
    ok("boiler upset shows on UTIL", pg.evaluate("()=>__PM.G3.dcs.dcsArea('boiler')")=="UTIL")
    if shot: pg.screenshot(path=f"{shot}-util.png")

    # ---- making beater: banner, WET alert under the dilution zones, alarms ----
    pg.evaluate("()=>{const P=__PM;P.CH.on=true;P.trigger('dye');for(let i=0;i<8;i++)P.step(0.25);P.G3.openStation('WET','dcs');}"); pg.wait_for_timeout(500)
    pg.evaluate("()=>{__PM.G3.openStation('WET','dcs')}"); pg.wait_for_timeout(300)
    ban = pg.evaluate("()=>{const t=document.body.innerText;return t.includes('Making beater')}")
    ok("banner: making beater", ban or pg.evaluate("()=>__PM.S.feed.slice(0,10).some(f=>f.text.includes('going to the beater'))"))
    bt = pg.evaluate("()=>{const b=document.getElementById('dcsBeat');const z=document.querySelector('#dcsOv .kctl[data-k=zones]');return {shown:!!b&&!b.hidden,t:b&&b.textContent,after:!!(b&&z&&(z.closest('.dcsrow').compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING))}}")
    ok("WET DCS: making-beater alert under the headbox dilution zones", bt["shown"] and bt["after"] and "BEATER" in (bt["t"] or ""), json.dumps(bt))
    ok("WET alarm list: MAKING BEATER first", pg.evaluate("()=>{const l=document.querySelector('#dcsAl li');return !!l&&l.textContent.startsWith('MAKING BEATER')}"))
    if shot: pg.screenshot(path=f"{shot}-wet.png")
    b.close()
ok("no page errors", not errs, "; ".join(errs[:5]))
print("\n".join(log)); fails = [l for l in log if l.startswith("FAIL")]
print(f"\n{len(log) - len(fails)}/{len(log)} passed"); sys.exit(1 if fails else 0)
