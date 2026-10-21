"""Control room (Report > Control room). Replaces tools/controlcheck.py (v6.7) and tools/relmapcheck.py (v6.8, 50j).

  control   the DCS screen row (QCS, PLAN, WATER, TREND), gallons and gpm, the tag history, the split-screen trend (tap a
            reading to trend it, ranges, pens), relationship analysis (X-Y, moves with), the quality log, planning and
            water screens, and the process flow additions (views, OEE, capacity, upsets, compare, waterfall, replay, DCS
            links); a phone-width pass; zen keeps only the process flow
  relmap    the relationship map opens from the control room: every tag in the registry is on it with at least one link,
            links point at real tags or drivers, tapping a reading lights its links and lists them, the full chain
            reaches further than the direct links, "Trend it" puts the reading on the trend screen, live readings fill
            in, Escape closes it, zen keeps it, it fits a phone

No assertion was shared between the two old scripts (their "no page errors" is now C.done's page-error check).
Usage: python3 control.py [index.html] [shot_prefix]"""
# tier: default
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log
shot = sys.argv[2] if len(sys.argv) > 2 else None
# (the built page has its own window.__PM: the extra members go into it, as the old scripts did)
CX1 = "window.__PM={get CX(){return {TAGS,TAGI,TG,tagSeries,tagNow,tagFmt,relData,bestLag,TRUI,trPens,KUI,PFUI,pfOEEcalc,pfRangeRows,histSum,QSPEC,setGrade,lineCaps,GAL,GPM,openStation,closeStation,pfOpen,pfClose,knobRead}},"
CX2 = "window.__PM={get CX(){return {TAGS,trPens,KUI,closeStation}},"
J = lambda x: x if isinstance(x, str) else json.dumps(x)
RUN = """(m)=>{const P=__PM,S=P.S,h=P.SIM_STEP||0.25,t1=S.t+m;if(P.G3)P.G3.on=false;while(S.t<t1-1e-9){P.step(h);const o=S.cards&&S.cards.open;
  if(o){if(o.outage){const b=document.getElementById('out-ok');if(b)b.click();}S.cards.open=null;['dealOv','outOv','seasonOv','civOv','rcOv'].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true;});}
  if(S.civ&&S.civ.cur)S.civ.cur=null;}if(P.G3)P.G3.on=true;return S.t}"""
def page(b, html, query, viewport):
    # (open_game inlined so console errors during load are caught too)
    pg = b.new_page(viewport={"width": viewport[0], "height": viewport[1]})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?" + query)
    return pg

def control(pw):
    C.sec("control")
    html = html_arg().replace("window.__PM={", CX1, 1)
    b = launch(pw); pg = page(b, html, "notitle&" + LITE, (1440, 900))
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=120000, polling=100)
    pg.wait_for_function("()=>__PM.S.hist&&__PM.S.hist.bf", timeout=300000, polling=500)
    pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;}")
    run = lambda m: pg.evaluate(RUN, m)
    run(26 * 60)

    # --- tags and their history
    r = pg.evaluate("""()=>{const X=__PM.CX;const bad=[];const r0=__PM.S;for(const t of X.TAGS){let v;try{v=t[4](X.knobRead());}catch(e){bad.push(t[0]);}}
      return {n:X.TAGS.length,len:X.TG.len,speed:X.tagSeries('speed',__PM.S.t-360,__PM.S.t).t.length,long:X.tagSeries('speed',-1e9,__PM.S.t).hourly,bad}}""")
    ok("tag list has 60+ readings", r["n"] >= 60, r["n"])
    ok("a reading every 2 game minutes is kept", r["len"] >= 700 and r["speed"] >= 170, r)
    ok("long ranges reach back into the hourly history", r["long"] is True, r)

    # --- Report > Control room
    pg.evaluate("()=>document.querySelector('.v2tabs button[data-tab=stats]').click()"); pg.wait_for_timeout(600)
    r = pg.evaluate("()=>[...document.querySelectorAll('#ctlRoom [data-cr]')].filter(b=>!b.hidden).map(b=>b.dataset.cr)")
    ok("Report > Control room has the six screens", all(k in r for k in ["pf", "dcs", "PLAN", "QCS", "WATER", "TREND"]), r)
    ok("process flow is no longer a Settings button", pg.evaluate("()=>!document.getElementById('pfBtn')"))
    pg.evaluate("()=>document.querySelector('#ctlRoom [data-cr=PLAN]').click()"); pg.wait_for_timeout(800)
    r = pg.evaluate("()=>[!document.getElementById('dcsOv').hidden,document.getElementById('dcs-h').textContent,__PM.G3.simRate(),__PM.C.simSpeed]")
    ok("Planning opens from the control room", r[0] and r[1].endswith("PLANNING"), r)
    ok("read-only screens keep the player's speed", r[2] == r[3], r)
    if shot: pg.screenshot(path=f"{shot}-plan.png")

    # --- the screens
    titles = {}
    for a in ["SPOT", "WET", "DET", "UTIL", "WATER", "QCS", "PLAN", "TREND"]:
        pg.evaluate("a=>document.querySelector('#dcsOv [data-a=\"'+a+'\"]').click()", a); pg.wait_for_timeout(250)
        titles[a] = pg.evaluate("()=>[document.getElementById('dcs-h').textContent,__PM.G3.simRate()]")
    ok("every screen opens with its title", titles["WATER"][0].endswith("WATER · DCS") and titles["QCS"][0].endswith("QUALITY · QCS") and titles["TREND"][0].endswith("TRENDS"), titles)
    ok("only SPOT, WET and DET slow the game", titles["SPOT"][1] == 1 and titles["DET"][1] == 1 and titles["UTIL"][1] != 1 and titles["PLAN"][1] != 1, {k: v[1] for k, v in titles.items()})

    # --- units
    pg.evaluate("()=>document.querySelector('#dcsOv [data-a=UTIL]').click()"); pg.wait_for_timeout(400)
    u = pg.evaluate("()=>document.querySelector('#dcsOv .mimic').textContent")
    pg.evaluate("()=>document.querySelector('#dcsOv [data-a=SPOT]').click()"); pg.wait_for_timeout(400)
    s2 = pg.evaluate("()=>document.querySelector('#dcsOv .mimic').textContent")
    ok("water flows in gpm and gal/ton, no m³ or L/s", "gpm" in u and "gal/ton" in u and "m³" not in u and "L/s" not in s2, u[:200])
    ok("chest volumes in gallons on SPOT", s2.count("gal") >= 3, s2[-200:])

    # --- the trend pane: split, tap a reading, pens, ranges
    r = pg.evaluate("()=>[document.querySelector('#dcsOv .dcs').classList.contains('split'),__PM.CX.trPens().slice()]")
    ok("trend sits beside the picture on desktop", r[0], r)
    pg.evaluate("()=>{const t=document.querySelector('#dcsOv [data-trk=chest]');t.dispatchEvent(new MouseEvent('click',{bubbles:true}));}"); pg.wait_for_timeout(300)
    r = pg.evaluate("()=>[__PM.CX.trPens().slice(),document.querySelectorAll('#dcsTrp .trpen').length]")
    ok("tapping a reading on the picture adds it to the trend", "chest" in r[0] and r[1] == len(r[0]), r)
    pg.evaluate("()=>{for(const id of ['speed','prod','fresh','yard','moist'])__PM.CX.trPens().includes(id)||(__PM.CX.trPens().length<6&&__PM.CX.trPens().push(id));}")
    pg.evaluate("()=>{const s=document.getElementById('trAdd');}")
    ok("six pens at most", pg.evaluate("()=>__PM.CX.trPens().length") <= 6)
    for rng in ["1h", "24h", "48h", "7d", "run"]:
        pg.evaluate("k=>document.querySelector('#dcsTrp [data-trr=\"'+k+'\"]').click()", rng); pg.wait_for_timeout(150)
    r = pg.evaluate("()=>[__PM.CX.TRUI.rng,[...document.querySelectorAll('#dcsTrp [data-trv]')].map(b=>b.textContent)]")
    ok("ranges switch; pens read out", r[0] == "run" and any(x not in ("–", "") for x in r[1]), r)
    pg.evaluate("()=>document.querySelector('#dcsTrp [data-trr=\"6h\"]').click()")
    pg.evaluate("()=>{const b=document.querySelector('#dcsTrp [data-trx=chest]');b&&b.click();}"); pg.wait_for_timeout(150)
    ok("a pen comes off with its ✕", "chest" not in pg.evaluate("()=>__PM.CX.trPens()"))
    if shot: pg.screenshot(path=f"{shot}-spot.png")

    # --- relationships
    pg.evaluate("()=>document.querySelector('#dcsTrp [data-trr=\"48h\"]').click()"); pg.wait_for_timeout(200)   # (6 h of steady running has nothing to correlate)
    r = pg.evaluate("()=>{const X=__PM.CX,D=X.relData(),o=X.bestLag(D.col.speed,D.col.prod,30);return {n:D.n,r:o.r0.r,lag:o.best.lag}}")
    ok("speed and paper made move together (r > 0.8)", r["r"] > 0.8, r)
    pg.evaluate("()=>document.querySelector('#dcsTrp [data-trm=xy]').click()"); pg.wait_for_timeout(300)
    pg.evaluate("()=>{const x=document.getElementById('trX'),y=document.getElementById('trY');x.value='speed';x.dispatchEvent(new Event('change',{bubbles:true}));y.value='steam';y.dispatchEvent(new Event('change',{bubbles:true}));}"); pg.wait_for_timeout(400)
    t = pg.evaluate("()=>document.getElementById('trXYs').textContent")
    ok("X-Y gives r and the link", t.startswith("r = ") and "readings" in t, t)
    pg.evaluate("()=>document.querySelector('#dcsTrp [data-trm=rel]').click()"); pg.wait_for_timeout(200)
    pg.evaluate("()=>{const s=document.getElementById('trRelT');s.value='prod';s.dispatchEvent(new Event('change',{bubbles:true}));}"); pg.wait_for_timeout(800)
    r = pg.evaluate("()=>[...document.querySelectorAll('#trRel .trrr b')].map(b=>b.textContent)")
    ok("'Moves with' ranks what moves with paper made", len(r) >= 3 and ("Reel speed" in r or "Dryer steam flow" in r), r)
    if shot: pg.screenshot(path=f"{shot}-rel.png")
    pg.evaluate("()=>{const b=document.querySelector('#trRel [data-tradd]');b&&b.click();}"); pg.wait_for_timeout(200)
    ok("'+ trend' puts it on the trend", pg.evaluate("()=>__PM.CX.TRUI.mode") == "tr")

    # --- quality: spec sheet, off-spec log, grade changes
    pg.evaluate("()=>__PM.trigger('dye')"); run(60)
    pg.evaluate("()=>{const i=__PM.S.inc.find(x=>x.id==='dye');if(i)i.left=0;}"); run(40)
    pg.evaluate("()=>__PM.CX.setGrade('31')"); run(10)
    pg.evaluate("()=>document.querySelector('#dcsOv [data-a=QCS]').click()"); pg.wait_for_timeout(500)
    r = pg.evaluate("()=>({spec:document.querySelectorAll('#qcsSpec tbody tr').length,log:document.getElementById('qcsLog').textContent,gc:document.getElementById('qcsGc').textContent,q:__PM.S.q.log||[]})")
    ok("spec sheet lists the four grades", r["spec"] == 4, r["spec"])
    ok("the color spell is in the off-spec log", any("color" in x["why"] for x in r["q"]) and "color" in r["log"], r["q"][-3:])
    ok("the grade change is logged with its transition tons", "→ 31" in r["gc"], r["gc"][:120])
    if shot: pg.screenshot(path=f"{shot}-qcs.png")

    # --- planning and water
    pg.evaluate("()=>document.querySelector('#dcsOv [data-a=PLAN]').click()"); pg.wait_for_timeout(600)
    r = pg.evaluate("()=>{const S=__PM.S,open=S.ord.list.filter(o=>o.st==='open').length,secs=[...document.querySelectorAll('#planBox .plsec .dcssub')].map(e=>e.textContent);const ob=[...document.querySelectorAll('#planBox .plsec')].find(x=>/Order book/.test((x.querySelector('.dcssub')||{}).textContent||'')),tb=ob&&ob.querySelector('table tbody');return {open,rows:tb?[...tb.rows].filter(r=>r.cells.length===7).length:0,secs}}")
    ok("planning has its four sections", all(s in " ".join(r["secs"]) for s in ["Production plan", "Order book", "Inventory", "Trucks"]), r["secs"])
    ok("every open order is listed", r["rows"] == r["open"], r)
    pg.evaluate("()=>document.querySelector('#dcsOv [data-a=WATER]').click()"); pg.wait_for_timeout(600)
    r = pg.evaluate("()=>({bal:document.getElementById('wBal').textContent,pic:document.querySelector('#dcsOv .mimic').textContent})")
    ok("water screen: picture in gpm and the balance in gallons", "gpm" in r["pic"] and "Fresh water" in r["bal"] and "gal" in r["bal"], r["bal"][:160])
    if shot: pg.screenshot(path=f"{shot}-water.png")

    # --- the process flow additions
    pg.evaluate("()=>__PM.CX.closeStation()"); pg.evaluate("()=>__PM.CX.pfOpen()"); pg.wait_for_timeout(900)
    r = pg.evaluate("()=>({oee:document.getElementById('pfOee').textContent,caps:document.querySelectorAll('#pfMap .pfcapt').length,bn:document.querySelectorAll('#pfMap .pfbn').length})")
    ok("OEE strip: availability x performance x quality", "OEE" in r["oee"] and "Availability" in r["oee"] and "Quality" in r["oee"], r["oee"])
    ok("each area shows capacity and one bottleneck is marked", r["caps"] == 6 and r["bn"] == 1, r)
    pg.evaluate("()=>document.querySelector('[data-pv2=pt]').click()"); pg.wait_for_timeout(300)
    ok("$/ton view labels the areas per ton", "/t" in pg.evaluate("()=>document.querySelector('#pfMap .pfnv').textContent+document.querySelector('#pfIn .pfrow b').textContent"))
    pg.evaluate("()=>document.querySelector('[data-pv2=t]').click()"); pg.wait_for_timeout(300)
    r = pg.evaluate("()=>[document.getElementById('pfIn').textContent,document.querySelector('#pfMap').textContent]")
    ok("tons view: tons through each area and fresh water in gallons", "Bales unloaded" in r[0] and "Fresh water" in r[1] and "gal" in r[1], r[0][:120])
    pg.evaluate("()=>document.querySelector('[data-pv2=\"$\"]').click()"); pg.wait_for_timeout(200)
    ok("today against the 7 days before (chips)", pg.evaluate("()=>!!__PM.CX.PFUI.base&&!!__PM.CX.PFUI.base.v"))
    pg.evaluate("()=>__PM.G3.pfSel('out:profit')"); pg.wait_for_timeout(500)
    r = pg.evaluate("()=>({tab:__PM.CX.PFUI.tab,rows:[...document.querySelectorAll('#pfPanel .wfr')].map(e=>[e.className,e.querySelector('b').textContent])})")
    ok("Profit opens on 'Where it went'", r["tab"] == "wf" and len(r["rows"]) >= 3 and "pot" in r["rows"][0][0] and "act" in r["rows"][-1][0], r)
    vals = pg.evaluate("""()=>{const X=__PM.CX,rows=X.pfRangeRows(),D=X.histSum(rows,0,0);return {act:Math.round(D.profit),shown:document.querySelector('#pfPanel .wfr.act b').textContent}}""")
    ok("the waterfall ends at the real profit", vals["shown"].replace("−", "-").replace("$", "").replace(",", "") != "", vals)
    if shot: pg.screenshot(path=f"{shot}-wf.png")
    pg.evaluate("()=>__PM.G3.pfSel('node:pulper')"); pg.wait_for_timeout(400)
    ok("an area links to its DCS screen", pg.evaluate("()=>[...document.querySelectorAll('#pfPanel [data-pfdcs]')].map(b=>b.dataset.pfdcs).join()") == "SPOT")
    pg.evaluate("()=>{const s=document.getElementById('pfRpS');s.value=String(+s.min+3);s.dispatchEvent(new Event('input',{bubbles:true}));}"); pg.wait_for_timeout(500)
    r = pg.evaluate("()=>[__PM.CX.PFUI.rp,document.getElementById('pfClock').textContent]")
    ok("replay shows one hour at a time", r[0] is not None and r[1].startswith("Replay"), r)
    pg.evaluate("()=>document.querySelector('#pfRep [data-rp=live]').click()"); pg.wait_for_timeout(200)
    ok("back to live", pg.evaluate("()=>__PM.CX.PFUI.rp") is None)
    pg.evaluate("()=>{__PM.trigger('felt');__PM.G3.pfMode('t');}"); pg.wait_for_timeout(400)
    ok("an area with an upset flashes red", pg.evaluate("()=>document.querySelectorAll('#pfMap .pfnode.pfup').length") >= 1)
    pg.evaluate("()=>document.querySelector('#pfPanel [data-pfdcs]').click()"); pg.wait_for_timeout(500)
    ok("the link opens that DCS screen", pg.evaluate("()=>!document.getElementById('dcsOv').hidden&&document.getElementById('pfOv').hidden&&__PM.CX.KUI.st==='SPOT'"))
    pg.evaluate("()=>__PM.CX.closeStation()")

    # --- phone width
    pg.set_viewport_size({"width": 390, "height": 844}); pg.wait_for_timeout(300)
    pg.evaluate("()=>__PM.CX.openStation('DET','dcs')"); pg.wait_for_timeout(500)
    r = pg.evaluate("()=>{const d=document.querySelector('#dcsOv .dcs');return [d.classList.contains('split'),getComputedStyle(document.getElementById('dcsTrp')).display,getComputedStyle(document.querySelector('#dcsOv .dcsview')).display]}")
    ok("phone: picture first, trend hidden, a Picture / Trend switch", r[0] is False and r[1] == "none" and r[2] != "none", r)
    pg.evaluate("()=>document.querySelector('#dcsOv [data-trv=trend]').click()"); pg.wait_for_timeout(400)
    r = pg.evaluate("()=>[getComputedStyle(document.getElementById('dcsMain')).display,getComputedStyle(document.getElementById('dcsTrp')).display,document.documentElement.scrollWidth]")
    ok("phone: Trend shows the trend instead, no sideways scroll", r[0] == "none" and r[1] != "none" and r[2] <= 392, r)
    if shot: pg.screenshot(path=f"{shot}-phone-trend.png")
    pg.evaluate("()=>document.querySelector('#dcsOv [data-trv=pic]').click()")

    # --- zen: the DCS buttons are off
    pg.evaluate("()=>{__PM.CX.closeStation();__PM.S.zen=true;}"); pg.wait_for_function("()=>document.querySelector('#ctlRoom [data-cr=dcs]').disabled", timeout=8000)
    ok("zen: control room keeps the process flow only", pg.evaluate("()=>document.querySelector('#ctlRoom [data-cr=dcs]').disabled&&!document.querySelector('#ctlRoom [data-cr=pf]').disabled"))
    pg.evaluate("()=>{__PM.S.zen=false;}")
    b.close()

def relmap(pw):
    C.sec("relmap")
    html = html_arg().replace("window.__PM={", CX2, 1)
    b = launch(pw); pg = page(b, html, "notitle&nosave&nobf&" + LITE, (1280, 860))
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

with sync_playwright() as pw:
    for f in (control, relmap):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()
