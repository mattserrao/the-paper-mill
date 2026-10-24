"""DCS screens (SPOT, WET, DET, UTIL). Replaces tools/dcscheck.py (v6.5 b3 expansion, claude/dcs-expansion-spec.md) and
tools/dcs654check.py (v6.5.4 layout).

  screens   every screen draws its boxes and tags with real values; motors stop their step like an upset and the
            operators restart them after 30 min; a purge left in manual plugs the cleaner; the DCS setpoints move the
            Process flow controls (and stay locked in a season); upsets show on the right screen
  layout    the SPOT picture in process order with the stock chest consistency; boiler and power on UTIL (not DET);
            the 2nd/3rd section steam valves (v6.9: on CAS under QC-300; AUTO over the load over-dries the sheet);
            no row flicker on the setpoint rows; the making-beater alert (banner, WET under the dilution zones, alarms)

Merged: dcs654check's "boiler and grid on UTIL / gone from DET" names what dcscheck's box counts only count, so both stay;
nothing the two scripts asserted was the same test. Fails on any page or console error.
Usage: python3 dcs.py [index.html] [screenshot_prefix]"""
# tier: default
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log
shot = sys.argv[2] if len(sys.argv) > 2 else None

def page(b, html, query, viewport):
    # (open_game inlined so console errors during load are caught too)
    pg = b.new_page(viewport={"width": viewport[0], "height": viewport[1]})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?" + query)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    return pg

def screens(pw):
    C.sec("screens")
    html = html_arg()
    b = launch(pw); pg = page(b, html, "nobf&" + LITE, (1280, 900)); pg.wait_for_timeout(1000)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg); pg.wait_for_timeout(500)
    pg.evaluate("()=>{__PM.setRunning(false);if(__PM.S.cards)__PM.S.cards.open=null;for(let i=0;i<4*120;i++)__PM.step(0.25)}")
    steps = lambda m: pg.evaluate("m=>{for(let i=0;i<m*4;i++){if(__PM.S.cards)__PM.S.cards.open=null;__PM.step(0.25)}}", m)
    want = {"SPOT": 16, "WET": 7, "DET": 6, "UTIL": 8}   # (v6.11.2: the DE pulper is drawn on DET but is not a page group) (v6.5.4: boiler and power moved from DET to UTIL; v6.5.6: the white water chest on SPOT)
    for a, n in want.items():
        pg.evaluate(f"()=>__PM.G3.openStation('{a}','dcs')"); pg.wait_for_timeout(400)
        st = pg.evaluate("()=>{const o=document.getElementById('dcsOv');const tags=[...o.querySelectorAll('[data-tag]')].map(t=>t.textContent);return {eq:o.querySelectorAll('.mimic .pg-bg').length,tags:tags.length,bad:tags.filter(t=>/undefined|NaN|^–?$/.test(t)&&t!=='–')}}")
        ok(f"{a}: {n} boxes drawn", st["eq"] == n, str(st["eq"]))
        ok(f"{a}: every tag has a value", st["tags"] >= 6 and not st["bad"], str(st))
        if shot: pg.screenshot(path=f"{shot}-{a}.png", full_page=False)
    # ---- motors: OFF stops the step like its upset, operators restart after 30 min ----
    pg.evaluate("()=>__PM.G3.openStation('SPOT','dcs')"); pg.wait_for_timeout(300)
    pg.evaluate("()=>document.querySelector('[data-dm=\"conv\"] [data-mv=\"off\"]').click()"); pg.wait_for_timeout(200)
    try: pg.wait_for_function("()=>[...document.querySelectorAll('#dcsAl li')].some(l=>l.textContent.includes('BALE CONVEYOR'))", timeout=10000)
    except Exception: pass
    s = pg.evaluate("()=>({inc:__PM.S.inc.some(i=>i.id==='m_conv'),feed:__PM.S.M.feedMul,st:__PM.G3.dcs.motStatus('conv'),al:[...document.querySelectorAll('#dcsAl li')].map(l=>l.textContent)})")
    ok("bale conveyor OFF: stops the feed like an upset", s["inc"] and s["feed"] == 0 and s["st"] == "off", str(s))
    ok("bale conveyor OFF: alarm on SPOT with the restart countdown", any("BALE CONVEYOR STOPPED" in t for t in s["al"]), str(s["al"]))
    steps(31)
    s = pg.evaluate("()=>({inc:__PM.S.inc.some(i=>i.id==='m_conv'),st:__PM.G3.dcs.motStatus('conv'),mode:__PM.S.dcs.mot.conv})")
    ok("operators restart it after 30 min (back to AUTO)", not s["inc"] and s["st"] == "run" and s["mode"] == "auto", str(s))
    pg.evaluate("()=>__PM.G3.dcs.motSet('fscr','off')"); steps(5); pg.evaluate("()=>__PM.G3.dcs.motSet('fscr','on')"); steps(1)
    s = pg.evaluate("()=>({inc:__PM.S.inc.some(i=>i.id==='m_fscr'),st:__PM.G3.dcs.motStatus('fscr'),pd:__PM.S.M.pulperDown})")
    ok("starting a motor early from the DCS clears it at once", not s["inc"] and s["st"] == "run", str(s))
    pg.evaluate("()=>__PM.G3.dcs.motSet('fog','off')"); steps(1)
    ok("fog fan OFF shows on WET, not SPOT", pg.evaluate("()=>__PM.G3.dcs.dcsArea('m_fog')") == "WET")
    pg.evaluate("()=>__PM.G3.dcs.motSet('fog','auto')")
    # ---- purges: manual builds pressure until it plugs ----
    pg.evaluate("()=>__PM.G3.dcs.purgeSet('lc','manual')"); steps(60)
    dp = pg.evaluate("()=>__PM.S.dcs.pg.lc.dp")
    pg.evaluate("()=>__PM.G3.dcs.purgeNow('lc')")
    ok("LC flush in manual: pressure builds, purge resets it", dp > 65 and pg.evaluate("()=>__PM.S.dcs.pg.lc.dp") == 60, f"{dp:.1f}")
    steps(420)
    s = pg.evaluate("()=>({plug:__PM.S.inc.some(i=>i.id==='lcplug')||__PM.S.tot.incidents>0,mode:__PM.S.dcs.pg.lc.m,ev:(__PM.S.evc||{}).lcplug||0})")
    ok("LC flush left in manual plugs the cleaners (and goes back to AUTO)", s["ev"] >= 1 and s["mode"] == "auto", str(s))
    # ---- setpoints move the Process flow controls; locked in a season ----
    s = pg.evaluate("()=>{const r=document.querySelector('#dcsOv [data-ds=\"cvsp\"] [data-dsv]');return {dis:r.disabled,lock:document.body.classList.contains('season-lock')}}")
    ok("season: DCS setpoints locked like Process flow", s["dis"] and s["lock"], str(s))
    pg.evaluate("()=>{__PM.S.free=true;document.querySelectorAll('#cards .row[data-key] input,#cards .row[data-key] button.auto').forEach(e=>e.disabled=false);document.body.classList.remove('season-lock');}")
    pg.evaluate("()=>{__PM.G3.openStation('SPOT','dcs');const r=document.querySelector('#dcsOv [data-ds=\"lvt\"] [data-dsv]');r.value=55;r.dispatchEvent(new Event('input',{bubbles:true}))}")
    ok("chest level target set on SPOT moves the Process flow control", pg.evaluate("()=>__PM.C.lvlTarget.v") == 55, str(pg.evaluate("()=>__PM.C.lvlTarget.v")))
    pg.evaluate("()=>{__PM.G3.openStation('WET','dcs');const r=document.querySelector('#dcsOv [data-ds=\"wsp\"] [data-dsv]');r.value=2500;r.dispatchEvent(new Event('input',{bubbles:true}))}")
    w = pg.evaluate("()=>[__PM.C.pmSp.v,__PM.C.pmSp.auto]")
    ok("wire speed on WET sets the reel by the draws (and goes MANUAL)", 2550 < w[0] < 2650 and w[1] is False, str(w))
    pg.evaluate("()=>{__PM.G3.openStation('DET','dcs')}"); pg.wait_for_timeout(200)
    d = pg.evaluate("()=>document.querySelector('#dcsOv [data-ds=\"wsp\"] [data-dsv]').value")
    ok("DET shows the same wire speed", abs(float(d) - 2500) < 10, str(d))
    # ---- upsets on the right screen ----
    pg.evaluate("()=>{__PM.trigger('slime');__PM.trigger('shaft');__PM.trigger('permit')}"); steps(1)
    for a, txt in [("WET", "SLIME"), ("DET", "DRIVESHAFT"), ("UTIL", "PERMIT")]:
        pg.evaluate(f"()=>__PM.G3.openStation('{a}','dcs')"); pg.wait_for_timeout(250)
        al = pg.evaluate("()=>[...document.querySelectorAll('#dcsAl li')].map(l=>l.textContent).join(' | ')")
        ok(f"{a}: shows its upset ({txt})", txt in al.upper(), al)
    pg.evaluate("()=>__PM.G3.openStation('SPOT','dcs')"); pg.wait_for_timeout(250)
    al = pg.evaluate("()=>[...document.querySelectorAll('#dcsAl li')].map(l=>l.textContent).join(' | ')")
    ok("SPOT doesn't show machine upsets", "SLIME" not in al and "DRIVESHAFT" not in al, al)
    if shot:
        pg.evaluate("()=>{const o=document.getElementById('dcsOv');o.querySelector('.dcsb').scrollTop=520}"); pg.wait_for_timeout(200); pg.screenshot(path=f"{shot}-SPOT-rows.png")
        pg.set_viewport_size({"width": 390, "height": 844}); pg.wait_for_timeout(300)
        for a in ["SPOT", "DET"]:
            pg.evaluate(f"()=>__PM.G3.openStation('{a}','dcs')"); pg.wait_for_timeout(400); pg.screenshot(path=f"{shot}-{a}-phone.png")
    b.close()

def layout(pw):
    C.sec("layout")
    html = html_arg()
    b = launch(pw); pg = page(b, html, "notitle&nosave&nobf&" + LITE, (1100, 900))
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{const P=__PM;P.setRunning(false);P.CH.on=false;const S=P.S;while(S.t<600)P.step(P.SIM_STEP);}")

    # ---- SPOT: process order, stock chest consistency ----
    pg.evaluate("()=>__PM.G3.openStation('SPOT','dcs')"); pg.wait_for_timeout(500)
    order = pg.evaluate("()=>[...document.querySelectorAll('#dcsOv .mimic [data-pg] title')].map(t=>t.textContent)")
    want = ["CONVEYOR", "PULPER", "RAGGER", "JUNK", "HD CLEANER", "COARSE SCR", "LC CLEANERS", "FINE SCR", "LW CLEANERS", "THICKENER", "STOCK CHEST", "REFINERS", "MACHINE CHEST", "DYE", "FAN PUMP", "WATER CHEST"]   # (v6.5.6: the white water chest, top right)
    ok("SPOT picture entries in their fixed order (status lamps index for index; the bottom row's positions are checked next)", order == want, str(order))
    xs = pg.evaluate("()=>Object.fromEntries([...document.querySelectorAll('#dcsOv .mimic [data-pg]')].map(g=>[g.querySelector('title').textContent,+g.querySelector('.pg-bg').getAttribute('x')]))")
    ok("bottom row runs right to left: stock chest, machine chest, refiners, fan pump (v6.12.1 approach system)", xs["STOCK CHEST"] > xs["MACHINE CHEST"] > xs["REFINERS"] > xs["FAN PUMP"], json.dumps(xs))
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
    ok("boiler upset shows on UTIL", pg.evaluate("()=>__PM.G3.dcs.dcsArea('boiler')") == "UTIL")
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

def rows(pw):
    # v6.11.2: the setpoint rows follow the stock through the machine; the 2nd and 3rd section steam on DET; the yard and
    # warehouse crews keep working through a sheet break
    C.sec("rows")
    b = launch(pw); pg = page(b, html_arg(), "nobf&" + LITE, (1280, 900)); pg.wait_for_timeout(800)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg); pg.wait_for_timeout(500)
    pg.evaluate("()=>{__PM.setRunning(false);for(let i=0;i<4*60;i++){if(__PM.S.cards)__PM.S.cards.open=null;__PM.step(0.25)}}")
    order = lambda a: pg.evaluate("a=>{__PM.G3.openStation(a,'dcs');const c=[...document.querySelectorAll('#dcsOv .dcsctl')].find(e=>e.querySelector('[data-ord]'));return [...c.children].map(e=>e.classList.contains('dcssub')?'#'+e.textContent:e.dataset.ord||'').filter(Boolean)}", a)
    w = order("WET")
    want = ["#Thick stock to the headbox", "grade", "bws", "polf", "#Headbox", "zones", "beat", "slv", "slh", "#Forming table", "wsp", "vac", "couch", "#Press section", "press"]
    ok("WET rows in process order: thick stock, headbox, forming table, press", w == want, w)
    d = order("DET")
    ok("DET rows: draw, 1st / 2nd / 3rd section steam, reel and winder", d == ["#Press to dryers", "draw", "#Dryer steam", "st1", "st2sp", "st3sp", "#Reel and winder", "wsp", "wdr"], d)
    r = pg.evaluate("""()=>{const q=s=>document.querySelector(s),V=()=>({m3:q('[data-ds="st3sp"] [data-dsa]').textContent,m2:q('[data-ds="st2sp"] [data-dsa]').textContent});
      const a=V();const inp=q('[data-ds="st3sp"] [data-dsv]');inp.value=150;inp.dispatchEvent(new Event('input',{bubbles:true}));
      for(let i=0;i<4*3;i++)__PM.step(0.25);const v3=__PM.S.vlv.lp['PV-303'];const b={...V(),sp:v3.sp,m:v3.m,pv:Math.round(v3.pvm)};
      q('[data-ds="st3sp"] [data-dsa]').click();const c={...V(),m:__PM.S.vlv.lp['PV-303'].m};return {a,b,c}}""")
    ok("2nd and 3rd section steam start on CAS (the moisture loop)", r["a"] == {"m3": "CAS", "m2": "CAS"}, r["a"])
    ok("dragging 3rd section steam takes PV-303 off CAS onto AUTO at that pressure", r["b"]["m"] == "AUTO" and r["b"]["sp"] == 150 and r["b"]["m3"] == "AUTO" and r["b"]["pv"] > 130, r["b"])
    ok("the CAS button hands it back to the moisture loop", r["c"]["m"] == "CAS" and r["c"]["m3"] == "CAS", r["c"])
    r = pg.evaluate("""()=>{const P=__PM,S=P.S;__PM.G3.closeStation&&__PM.G3.closeStation();S.pm='break';S.brkType='press';S.breakLeft=60;S.breakTotal=60;S.crewQ=[{k:'brk',resp:0,since:0,here:true,go:true}];let rec=[],clamp=[],at=0;
      for(let i=0;i<4*30;i++){if(S.cards)S.cards.open=null;P.step(0.25);if(S.pm==='break'){rec.push(S.M.recvMul);clamp.push(S.M.clampMul);if(S.M.crewAtPM)at++;}}
      return {n:rec.length,rec:Math.min(...rec),clamp:Math.min(...clamp),at}}""")
    ok("sheet break: the yard keeps receiving and the warehouse keeps loading (no crew to the PM)", r["n"] > 0 and r["rec"] > 0 and r["clamp"] > 0 and r["at"] == 0, r)
    # v6.11.2 the dry-end pulper on DET: trim keeps it ticking over; a dryer break fills it and thickens it
    r = pg.evaluate("""()=>{const P=__PM,S=P.S;let ok=0;for(let i=0;i<4*60*12&&ok<4*45;i++){if(S.cards)S.cards.open=null;P.step(0.25);ok=(S.pm==='run'&&S.dep&&S.dep.fin>0.5)?ok+1:0;}   // (back up to speed after the earlier break, then 45 min of trim)
      const D=S.dep,a={L:D.m/D.cap*100,c:D.f/D.m*100,fin:D.fin};
      S.pm='break';S.brkType='dryer';S.breakLeft=60;S.breakTotal=60;S.crewQ=[{k:'brk',resp:0,since:0,here:true,go:true}];for(let i=0;i<4*30;i++){if(S.cards)S.cards.open=null;P.step(0.25);}
      const b={L:D.m/D.cap*100,c:D.f/D.m*100,fin:D.fin};__PM.G3.openStation('DET','dcs');const t=[...document.querySelectorAll('#dcsOv [data-tag=delvl],#dcsOv [data-tag=decons],#dcsOv [data-tag=defin]')].map(e=>e.textContent);return {a,b,t}}""")
    ok("DE pulper: trim alone keeps it low (30–55%) at ~4% consistency", 30 < r["a"]["L"] < 55 and 3.5 < r["a"]["c"] < 4.5 and r["a"]["fin"] > 0.5, r["a"])
    ok("DE pulper: a dryer break sends the sheet in: level climbs", r["b"]["L"] > r["a"]["L"] + 10 and r["b"]["fin"] > 5 * max(1, r["a"]["fin"]), r["b"])
    ok("DE pulper readings on the DET screen", len(r["t"]) == 3 and all(x not in ("–", "") for x in r["t"]), r["t"])
    # t6: a long break at full speed: the high-level alarm, then the overflow (cleanup booked, fiber to the sewer), level tag in alarm colour
    r = pg.evaluate("""()=>{const P=__PM,S=P.S;S.pm='break';S.brkType='dryer';S.breakLeft=120;S.breakTotal=120;const r0=S.ledger.repairs;let al=0,ov=0;
      for(let i=0;i<4*100;i++){if(S.cards)S.cards.open=null;if(S.pm!=='break'){S.pm='break';S.brkType='dryer';S.breakLeft=60;}P.step(0.25);if(S.dep.al&&!al)al=i/4;if(S.dep.ov&&!ov)ov=i/4;}
      const f=S.feed.slice(0,40).map(x=>x.text);__PM.G3.openStation('DET','dcs');const tg=document.querySelector('#dcsOv [data-tag=delvl]');
      return {al,ov,cost:S.ledger.repairs-r0,L:S.dep.m/400*100,alLine:f.some(t=>/pulper high level/.test(t)),ovLine:f.some(t=>/pulper overflowed/.test(t)),tagCls:tg?tg.getAttribute('class'):null}}""")
    ok("DE pulper: a long break sets off the high-level alarm, then overflows with a cleanup", r["al"] > 0 and r["ov"] > r["al"] and r["cost"] >= 12000 and r["alLine"] and r["ovLine"], r)
    ok("DE pulper: the level reading is in alarm colour when it's that high", r["tagCls"] and "tal" in r["tagCls"], r["tagCls"])
    b.close()

with sync_playwright() as pw:
    for f in (screens, layout, rows):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()
