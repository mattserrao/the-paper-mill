"""Process flow overview (v6.3; v6.5 history and area controls; v6.7 in Report > Control room). Replaces tools/pflowcheck.py.
The screen's day books add up to the real cash change, the 14 prior days of history load before the run and add up to the
ledger, the day roll keeps yesterday, the screen opens from the control room at the player's speed, taps open
breakdowns, the area controls live in its panel (locked in a season), saves keep the books, and it works in free play,
zen and at phone width. Fails on any page or console error.
Usage: python3 pflow.py [index.html] [screenshot_prefix]"""
# tier: default
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log
shot = sys.argv[2] if len(sys.argv) > 2 else None
# today's books against the cash: profit on the screen = cash change + upgrades bought
REC = "()=>{const S=__PM.S;if(!S.pf)return null;const D=__PM.G3.pfCalc(S.pf);return {p:D.profit,c:D.cashChg+D.upg,cost:D.cost,rev:D.revenue,h:D.h,made:D.made,rej:D.W.rej,"\
      "sumBy:Object.values(D.by).reduce((s,o)=>s+Object.values(o).reduce((a,v)=>a+v,0),0)}}"
def steps(pg, minutes):
    pg.evaluate("m=>{for(let i=0;i<m*4;i++)__PM.step(0.25)}", minutes)

def pflow(pw):
    C.sec("pflow")
    html = html_arg()   # (the built page has its own window.__PM with pfCalc and simRate under G3)
    b = launch(pw)
    # (open_game inlined so console errors during load are caught too)
    pg = b.new_page(viewport={"width": 1280, "height": 760})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
    pg.goto("http://bench.local/?" + LITE)
    pg.wait_for_function("window.__B&&__B.first!==null", timeout=90000); pg.wait_for_timeout(1500)
    click = lambda sel: pg.evaluate("s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.dispatchEvent(new MouseEvent('click',{bubbles:true}))}", sel)
    vis = lambda sel: pg.evaluate(f"()=>{{const e=document.querySelector('{sel}');return !!e&&!e.hidden&&e.getClientRects().length>0}}")
    click("#v2go"); pick_leader(pg); pg.wait_for_timeout(800)
    # ---- v6.5: the prior history loads before the run steps ----
    pg.wait_for_function("()=>__PM.S.hist&&__PM.S.hist.bf", timeout=240000)
    bf = pg.evaluate("()=>{const H=__PM.S.hist;return {n:H.rows.length,first:H.rows[0][0],ms:H.bfMs,cpu:H.bfCpu,ev:H.ev.length,kb:Math.round(JSON.stringify(H).length/1024),t:__PM.S.t,neg:H.rows.filter(r=>r[0]<0).length}}")
    ok("14 prior days loaded (336 hours before day 1)", bf["neg"] == 336 and bf["first"] == -336, str(bf))
    # (bfCpu: the sim's own time in its 12 ms slices. The wall time, bfMs, also counts the frames drawn between slices,
    # so on a shared 2-CPU machine it swings 9-15 s with the load; it is logged, not asserted)
    # (v6.12.1: was < 10 s, which it sat right on: 9.5 s alone, 10.5 s with another check running, so it flaked under
    #  load. It guards against the backfill getting much slower, not against noise; real speed is the phone autotest's job)
    ok("prior history took under 20 s of sim time here (about 2x its normal 9-10 s)", bf["cpu"] < 20000, f"{bf['cpu']} ms of sim, {bf['ms']} ms wall")
    ok("prior history left the run at its start (cash, day 1)", pg.evaluate("()=>__PM.S.t<30&&Math.abs(__PM.S.cash-2e6)<20000"), str(pg.evaluate("()=>[__PM.S.t,__PM.S.cash]")))
    ok("prior days made paper", pg.evaluate("()=>{const D=__PM.G3.histSum(__PM.G3.histRows(-336,0,true),-20160,0);return D.made>8000&&D.revenue>0}"), str(pg.evaluate("()=>{const D=__PM.G3.histSum(__PM.G3.histRows(-336,0,true),-20160,0);return [D.made,D.revenue,D.cost]}")))
    pg.evaluate("()=>{__PM.setRunning(false);if(__PM.S.cards)__PM.S.cards.open=null}")

    # ---- books: run 2.5 game days with upsets; check at several points and at the day roll ----
    worst = 0
    for k in range(10):
        steps(pg, 360)
        if k == 2: pg.evaluate("()=>{__PM.trigger('refclash');__PM.trigger('felt');__PM.trigger('permit')}")
        r = pg.evaluate(REC)
        if r: worst = max(worst, abs(r["p"] - r["c"]), abs(r["sumBy"] - r["cost"]))
    ok("today's profit = cash change + upgrades, and areas add up to the cost (worst $ off)", worst < 1.0, f"{worst:.4f}")
    # ---- v6.5: the hourly history adds up to the books since day 1 (rows are rounded to the dollar) ----
    hr = pg.evaluate("()=>{const S=__PM.S,D=__PM.G3.histSum(__PM.G3.histRows(0,1e9,false),0,1e9),L=S.ledger,cost=L.occ+(L.frin||0)+(L.frout||0)+L.energy+L.labor+L.overhead+L.repairs+L.premium+(L.civ||0),rows=S.hist.rows.filter(r=>r[0]>=0).length;return {d:D.cost-cost,r:D.revenue-(L.rev+L.deals),rows,h:Math.floor(S.t/60)}}")
    ok("history since day 1 = the ledger (within rounding)", abs(hr["d"]) < hr["rows"] * 6 + 5 and abs(hr["r"]) < hr["rows"] * 2 + 5, str(hr))
    ok("one row per finished hour", hr["rows"] == hr["h"], str(hr))
    y = pg.evaluate("()=>{const p=__PM.S.pf.prev;return p?{p:p.profit,c:p.cashChg+p.upg,h:p.h,made:p.made,rej:p.W.rej,day:p.day}:null}")
    ok("yesterday kept at the day roll and adds up", bool(y) and abs(y["p"] - y["c"]) < 1.0 and y["h"] == 24, str(y))
    ok("yesterday made paper and rejects", bool(y) and y["made"] > 200 and y["rej"] > 5, str(y))
    rep = pg.evaluate("()=>{const p=__PM.S.pf.prev;return p?p.rep:__PM.G3.pfCalc(__PM.S.pf).rep}")
    C.note(f"repair bills tracked: {rep}")

    # ---- the screen ----
    pg.evaluate("()=>__PM.setRunning(true)")
    click('.v2tabs button[data-tab="stats"]'); pg.wait_for_timeout(500)
    ok("Process flow button in Report > Control room (v6.7)", vis("#ctlRoom [data-cr=pf]"))
    click("#ctlRoom [data-cr=pf]"); pg.wait_for_timeout(1500)
    ok("screen opens", vis("#pfOv"))
    v = pg.evaluate("()=>[__PM.running,__PM.G3.simRate(),__PM.C.simSpeed,!!__PM.S.cards.open]"); ok("game keeps running at the player's speed while open", (v[0] or v[3]) and v[1] == v[2], str(v))   # (an event card may hold the game, as it always does)
    ok("diagram drawn with 7 areas", pg.evaluate("()=>document.querySelectorAll('#pfMap [data-pf^=\"node:\"]').length") == 7)
    ok("inputs list has 8 inputs (freight in and out)", pg.evaluate("()=>document.querySelectorAll('#pfIn [data-pf^=\"cat:\"]').length") == 8)
    if shot: pg.screenshot(path=f"{shot}-desktop.png")
    nodata = "()=>[...document.querySelectorAll('#pfPanel canvas[data-ch]')].length+document.querySelectorAll('#pfPanel .wfr').length"   # (v6.7: Profit opens on its waterfall)
    for sel in ['[data-pf="cat:energy"]', '[data-pf="node:pm"]', '#pfMap [data-pf^="drop:"]', '[data-pf="out:paper"]', '[data-pf="out:waste"]', '[data-pf="out:profit"]', '[data-pf="cat:maint"]']:
        pg.evaluate("()=>__PM.G3.pfSel(null)")
        click(sel); pg.wait_for_timeout(400)
        ok(f"tap {sel} opens the panel with charts", vis("#pfPanel") and pg.evaluate(nodata) >= 1, str(pg.evaluate(nodata)))
        click('#pfPanel [data-ptab]:not([aria-selected="true"]):not([data-ptab="tr"])' if sel!='[data-pf="out:profit"]' else '#pfPanel [data-ptab="bk"]'); pg.wait_for_timeout(300)
        ok(f"  {sel}: second tab shows", pg.evaluate("()=>document.querySelectorAll('#pfPanel .pfpr div, #pfPanel canvas, #pfPanel #pfCtl .card').length") >= 2)
    for a in ["yard", "pulper", "stock", "pm", "winder", "ship", "site"]:
        for tab in ["tr", "co", "uq"]:
            if a == "site" and tab == "uq": continue
            for z in ["24h", "7d", "run"]:
                pg.evaluate(f"()=>__PM.G3.pfSel('node:{a}','{tab}','{z}')"); pg.wait_for_timeout(60)
            n = pg.evaluate("()=>document.querySelectorAll('#pfPanel canvas[data-ch]').length")
            ok(f"area {a} tab {tab}: charts drawn", n >= 1, str(n))
            if shot and (a, tab) in [("pm", "tr"), ("pm", "uq"), ("site", "tr"), ("yard", "co")]:
                pg.evaluate("()=>__PM.G3.pfSel(null)"); pg.evaluate(f"()=>__PM.G3.pfSel('node:{a}','{tab}','run')"); pg.wait_for_timeout(300)
                pg.mouse.move(900, 300); pg.wait_for_timeout(200); pg.screenshot(path=f"{shot}-{a}-{tab}.png")
    # ---- v6.5 B: the area controls live in the panel; locked in a season ----
    for a, want in [("yard", 2), ("pulper", 1), ("stock", 1), ("pm", 1), ("winder", 1), ("ship", 1)]:
        pg.evaluate(f"()=>__PM.G3.pfSel('node:{a}','ct')"); pg.wait_for_timeout(150)
        n = pg.evaluate("()=>[...document.querySelectorAll('#pfCtl .card')].filter(c=>getComputedStyle(c).display!=='none').length")
        ok(f"controls {a}: its cards show", n == want, str(n))
    pg.evaluate("()=>__PM.G3.pfSel('node:pm','ct')"); pg.wait_for_timeout(300)
    lk = pg.evaluate("()=>{const i=document.getElementById('s-pmSp');return {dis:i.disabled,lock:document.body.classList.contains('season-lock'),inPanel:!!i.closest('#pfPanel')}}")
    ok("controls: speed slider in the panel, locked in a season", lk["dis"] and lk["lock"] and lk["inPanel"], str(lk))
    if shot: pg.screenshot(path=f"{shot}-controls.png")
    pg.evaluate("()=>__PM.G3.pfSel('node:site','tr')"); pg.wait_for_timeout(200)
    ok("controls go home when another tab shows", pg.evaluate("()=>!!document.querySelector('#pfHold #cards')"))
    ok("Settings has the pointer, not the old controls", pg.evaluate("()=>!!document.getElementById('pfCtlGo')&&!document.querySelector('.v2pane #cards')"))
    fr = pg.evaluate("()=>{const L=__PM.S.ledger;return {frin:Math.round(L.frin),frout:Math.round(L.frout),fuel:__PM.S.fuel}}")
    ok("freight booked (in and out)", fr["frin"] > 0 and fr["frout"] > 0, str(fr))
    pg.evaluate("()=>__PM.G3.pfSel('cat:frin','tr','run')"); pg.wait_for_timeout(300)
    if shot: pg.screenshot(path=f"{shot}-freight.png")
    pg.evaluate("()=>__PM.G3.pfSel('cat:fiber','tr','run')"); pg.wait_for_timeout(300)
    if shot: pg.screenshot(path=f"{shot}-fiber.png")
    for m in ["w", "r", "t"]:
        pg.evaluate(f"()=>__PM.G3.pfMode('{m}')"); pg.wait_for_timeout(200)
        ok(f"range {m}: flow draws", pg.evaluate("()=>document.querySelectorAll('#pfMap [data-pf^=\"node:\"]').length") == 7)
        if shot and m == "r": pg.evaluate("()=>__PM.G3.pfSel(null)"); pg.wait_for_timeout(200); pg.screenshot(path=f"{shot}-run.png")
    pg.evaluate("()=>__PM.G3.pfSel('node:pm','tr','7d')"); pg.wait_for_timeout(200)
    if shot: pg.screenshot(path=f"{shot}-popup.png")
    click('[data-pd="y"]'); pg.wait_for_timeout(400)
    ok("yesterday view", pg.evaluate("()=>document.querySelector('[data-pd=\"y\"]').getAttribute('aria-pressed')") == "true")
    if shot: pg.screenshot(path=f"{shot}-yesterday.png")
    click('[data-pd="t"]'); pg.wait_for_timeout(300)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    ok("Escape closes", not vis("#pfOv"))
    ok("speed back after close", pg.evaluate("()=>__PM.G3.simRate()") != 1 or pg.evaluate("()=>__PM.C.simSpeed") == 1, str(pg.evaluate("()=>[__PM.G3.simRate(),__PM.C.simSpeed]")))

    # ---- save round trip keeps the day's books ----
    sv = pg.evaluate("()=>{const a=JSON.parse(JSON.stringify(__PM.S.pf));return !!(a&&a.L0&&a.W&&a.prev)}")
    ok("day books survive JSON (save)", sv)
    hs = pg.evaluate("()=>{if(!__PM.G3.save)return 'nosave';__PM.G3.save.save('test');const raw=localStorage.getItem('paper-mill-save-hist');const m=JSON.parse(localStorage.getItem('paper-mill-save')||'null');return raw?{kb:Math.round(raw.length/1024),match:JSON.parse(raw).id===(m&&m.S.histId),inMain:!!(m&&m.S.hist)}:'nohist'}")
    ok("history saved under its own key, not inside the save", isinstance(hs, dict) and hs["match"] and not hs["inMain"], str(hs))

    # ---- phone width ----
    pg.set_viewport_size({"width": 390, "height": 844}); pg.wait_for_timeout(400)
    pg.evaluate("()=>__PM.G3.pfOpenUI()"); pg.wait_for_timeout(1200)
    ok("phone: picture runs top to bottom", pg.evaluate("()=>!!document.querySelector('#pfMap svg.vert')"))
    ok("phone: no sideways scroll", pg.evaluate("()=>{const b=document.getElementById('pfBody');return b.scrollWidth<=b.clientWidth+1}"))
    if shot: pg.screenshot(path=f"{shot}-phone.png", full_page=False)
    pg.evaluate("()=>document.getElementById('pfBody').scrollTop=600"); pg.wait_for_timeout(200)
    if shot: pg.screenshot(path=f"{shot}-phone2.png")
    click('[data-pf="node:stock"]'); pg.wait_for_timeout(400)
    ok("phone: the panel is a bottom sheet", pg.evaluate("()=>{const r=document.getElementById('pfPanel').getBoundingClientRect();return getComputedStyle(document.getElementById('pfPanel')).position==='fixed'&&Math.abs(r.bottom-innerHeight)<2&&r.width>=innerWidth-1}"))
    if shot: pg.screenshot(path=f"{shot}-phone-pop.png")
    pg.evaluate("()=>__PM.G3.pfCloseUI()")
    pg.set_viewport_size({"width": 1280, "height": 760}); pg.wait_for_timeout(300)

    # ---- other modes: survival, free play, zen ----
    for mode in ["free", "zen"]:
        pg.evaluate("()=>{__PM.setRunning(false)}")
        pg.evaluate("()=>{__PM.G3.showMenu&&__PM.G3.showMenu()}"); pg.wait_for_timeout(600)
        try:
            click("#v2free" if mode == "free" else "#v2zen"); pg.wait_for_timeout(2500)
        except Exception as e:
            ok(f"{mode}: starts", False, repr(e)[:200]); continue
        pg.evaluate("()=>{__PM.setRunning(false);if(__PM.S.cards)__PM.S.cards.open=null}")
        steps(pg, 600)
        r = pg.evaluate(REC)
        ok(f"{mode}: books add up", bool(r) and abs(r["p"] - r["c"]) < 1.0, str(r))
        pg.evaluate("()=>__PM.G3.pfOpenUI()"); pg.wait_for_timeout(800)
        ok(f"{mode}: screen draws", pg.evaluate("()=>document.querySelectorAll('#pfMap [data-pf^=\"node:\"]').length") == 7)
        if shot: pg.screenshot(path=f"{shot}-{mode}.png")
        pg.evaluate("()=>__PM.G3.pfCloseUI()")
        if mode == "zen":
            try: click("#zenExit"); pg.wait_for_timeout(600)
            except Exception: pass
    b.close()

with sync_playwright() as pw:
    for f in (pflow,):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()
