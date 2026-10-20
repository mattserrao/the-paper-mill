"""v6.8 relationship map (Report > Control room, 50j): opens from the control room, every tag in the registry is on it
with at least one link, links point at real tags or drivers, tapping a reading lights its links and lists them, the
full chain reaches further than the direct links, "Trend it" puts the reading on the trend screen, live readings fill
in, Escape closes it, zen keeps it, it fits a phone. Fails on any page error.
Usage: python3 relmapcheck.py <index.html> [shot_prefix]"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text().replace("window.__PM={", "window.__PM={get CX(){return {TAGS,trPens,KUI,closeStation}},",1); shot = sys.argv[2] if len(sys.argv) > 2 else None
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1280, "height": 860})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave&nobf")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{const P=__PM;P.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;const S=P.S;const t0=S.t;while(S.t-t0<240)P.step(P.SIM_STEP);}")

    r = pg.evaluate("""()=>{const X=__PM.CX,R=__PM.G3.rm,ids=new Set(Object.keys(R.N)),bad=R.E.filter(e=>!ids.has(e[0])||!ids.has(e[1])).map(e=>e[0]+'>'+e[1]);
      const miss=X.TAGS.map(t=>t[0]).filter(id=>!R.N[id]||!(R.N[id].ins.length+R.N[id].outs.length));return {n:X.TAGS.length,bad,miss}}""")
    ok("every tag in the registry is on the map with a link", not r["miss"], r["miss"])
    ok("every link joins two readings or drivers", not r["bad"], r["bad"])

    pg.evaluate("()=>document.querySelector('.v2tabs button[data-tab=stats]').click()"); pg.wait_for_timeout(500)
    ok("Report > Control room has the relationship map", pg.evaluate("()=>!!document.querySelector('#ctlRoom [data-cr=rm]')"))
    pg.evaluate("()=>document.querySelector('#ctlRoom [data-cr=rm]').click()"); pg.wait_for_timeout(800)
    r = pg.evaluate("()=>{const o=document.getElementById('rmOv');return {open:!!o&&!o.hidden,nodes:o.querySelectorAll('.rmn').length,edges:o.querySelectorAll('.rme').length,sel:__PM.G3.rm.ui.sel,side:document.getElementById('rmSide').textContent.slice(0,200)}}")
    ok("opens on reel moisture with the map drawn", r["open"] and r["nodes"] >= 80 and r["edges"] >= 150 and r["sel"] == "moist" and "Driven by" in r["side"], json.dumps({k: r[k] for k in ("open", "nodes", "edges", "sel")}))
    ok("the game keeps running underneath (not slowed)", pg.evaluate("()=>!__PM.CX.KUI.st"))
    pg.wait_for_timeout(600)
    r = pg.evaluate("()=>[...document.querySelectorAll('#rmSvg [data-v]')].map(t=>t.textContent).filter(t=>t&&t!=='driver'&&t!=='–').length")
    ok("live readings on the boxes", r >= 50, r)
    if shot: pg.screenshot(path=f"{shot}-desk.png")

    pg.evaluate("()=>document.querySelector('#rmSvg .rmn[data-id=couchSol]').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); pg.wait_for_timeout(200)
    r = pg.evaluate("()=>({sel:__PM.G3.rm.ui.sel,on:document.querySelectorAll('#rmSvg .rme.on').length,ins:[...document.querySelectorAll('#rmSide .rmrel')[0].querySelectorAll('[data-rmgo]')].map(b=>b.dataset.rmgo)})")
    ok("tapping couch solids lights its links and lists its causes", r["sel"] == "couchSol" and r["on"] >= 4 and "vac" in r["ins"] and "csf" in r["ins"], r)
    d = pg.evaluate("()=>document.querySelectorAll('#rmSvg .rmn.on').length")
    pg.evaluate("()=>document.querySelector('#rmOv [data-rmm=chain]').click()"); pg.wait_for_timeout(200)
    c = pg.evaluate("()=>document.querySelectorAll('#rmSvg .rmn.on').length")
    ok("full chain reaches further than the direct links", c > d, f"direct {d}, chain {c}")
    pg.evaluate("()=>document.querySelector('#rmOv [data-rmx=\"0\"]').click()"); pg.wait_for_timeout(200)
    ok("tags only hides the drivers", pg.evaluate("()=>document.querySelectorAll('#rmSvg .rmn.ext').length===0&&document.querySelectorAll('#rmSvg .rmn').length>=80"))
    pg.evaluate("()=>document.querySelector('#rmSide [data-rmgo=pressSol]').click()"); pg.wait_for_timeout(200)
    ok("a listed link jumps to that reading", pg.evaluate("()=>__PM.G3.rm.ui.sel") == "pressSol")
    pg.evaluate("()=>document.querySelector('#rmSide [data-rmtr]').click()"); pg.wait_for_timeout(600)
    r = pg.evaluate("()=>({map:document.getElementById('rmOv').hidden,st:__PM.CX.KUI.st,pens:__PM.CX.trPens?__PM.CX.trPens():null})")
    ok("'Trend it' closes the map and trends the reading", r["map"] and r["st"] == "TREND" and (r["pens"] is None or "pressSol" in r["pens"]), r)
    pg.evaluate("()=>__PM.CX.closeStation()")

    pg.evaluate("()=>__PM.G3.rm.open()"); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    ok("Escape closes it", pg.evaluate("()=>document.getElementById('rmOv').hidden"))
    pg.evaluate("()=>{__PM.S.zen=true;}"); pg.wait_for_timeout(700)
    ok("zen keeps the map", pg.evaluate("()=>!document.querySelector('#ctlRoom [data-cr=rm]').disabled"))
    pg.evaluate("()=>{__PM.S.zen=false;}")

    pg.set_viewport_size({"width": 390, "height": 844}); pg.evaluate("()=>__PM.G3.rm.open()"); pg.wait_for_timeout(500)
    r = pg.evaluate("()=>{const w=document.querySelector('#rmOv .rmw').getBoundingClientRect(),s=document.getElementById('rmSide').getBoundingClientRect();return {w:w.width,right:w.right,side:s.height,doc:document.documentElement.scrollWidth}}")
    ok("fits a phone: map above, details below, no page scroll sideways", r["right"] <= 391 and r["side"] > 150 and r["doc"] <= 391, r)
    if shot: pg.screenshot(path=f"{shot}-phone.png")
    b.close()
ok("no page errors", not errs, "; ".join(errs[:5]))
print("\n".join(log)); fails = [l for l in log if l.startswith("FAIL")]
print(f"\n{len(log) - len(fails)}/{len(log)} passed"); sys.exit(1 if fails else 0)
