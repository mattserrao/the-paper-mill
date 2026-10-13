"""Survival mode check (v4.3): drives a survival run from the menu to the leaderboard and fails on any page error or
wrong result. Usage: python3 survcheck.py <index.html> [screenshot_dir]

  1 start from the first menu: the run is a survival run, the wave chip shows, the clock says "Wave 1"
  2 the first outage dialog names the wave and the next wave's multipliers; the wave report card pops when the outage ends
  3 wave 2: the multipliers are applied (P.costMul, the OCC price, the energy cost, upsetMul) and shown (chip)
  4 save, reload, Continue: the same run comes back (wave, costs, cash)
  5 outages 2-5 with the 3D view running for outage 5: the major jobs go round again (outage 5 = job 1) with no errors
  6 the Report tab renders in a late wave; bankruptcy ends the run on the survival dialog ("Menu" instead of "one more
    turn", Escape does not close it); the score is the time survived; with no online table (404) it is saved on the device and the
    Survival tab lists it
  7 a new run starts clean; free play abandons the run and the costs go back; a season is still a season
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])

html = pathlib.Path(sys.argv[1]).read_text()
shots = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else None
if shots: shots.mkdir(parents=True, exist_ok=True)
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
html = html.replace("window.__PM={", "window.__PM={get P(){return P},get SURV(){return SURV},get OUT(){return OUT},energyCost:()=>energyCost(),upsetMul:()=>upsetMul(),", 1)
fails = []
def ok(name, cond, got=None):
    print(("ok   " if cond else "FAIL ") + name + ("" if cond else f"   got: {json.dumps(got)[:300]}"))
    if not cond: fails.append(name)

# the sim, stepped by hand with the 3D view off; stops when `until` (a JS expression over S, P) is true. Event cards are declined.
RUNTO = r"""([until,max])=>{const P=__PM,S=P.S,G=P.G3,f=new Function('S','P','return '+until);let n=0;P.setRunning(false);
  while(n<max&&!f(S,P)){G.on=false;P.step(0.25);n++;const o=S.cards.open;if(o&&o.c){document.getElementById('deal-no').click();}P.setRunning(false);}
  G.on=true;return {n,t:S.t,day:Math.floor(S.t/1440)+1,k:S.outg.k,cash:Math.round(S.cash),open:S.cards.open?Object.keys(S.cards.open).join():null};}"""
STATE = r"""()=>{const P=__PM,S=P.S,t=id=>{const e=document.getElementById(id);return e?e.textContent:null};
  return {surv:!!(S.season&&S.season.surv),on:!!(S.season&&S.season.on),k:S.outg&&S.outg.k,t:S.t,cash:Math.round(S.cash),costMul:P.P.costMul,occ:P.P.occPrice,energy:P.energyCost(),up:P.upsetMul(),
    chip:!document.getElementById('survChip').hidden,svW:t('svW'),svU:t('svU'),svC:t('svC'),clock:t('v2clockL'),lock:document.body.classList.contains('season-lock')};}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    ctx = b.new_context(viewport={"width": 1000, "height": 700}); pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text[:300]))
    base = route_for(html)
    # the survival table does not exist online in this test: the game has to fall back to the scores on the device
    pg.route("**/*", lambda r: r.fulfill(status=404, body='{"message":"not found"}', content_type="application/json") if "/rest/v1/survival" in r.request.url else base(r))
    pg.add_init_script(INIT)
    def load():
        pg.goto("http://bench.local/"); pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000); pg.wait_for_timeout(500)
    # the top bar and the chip are written by the UI tick (every 0.2 s of frames): let a few frames pass before reading them
    def state():
        pg.evaluate("()=>new Promise(r=>{let n=0;const f=()=>{if(++n>=6)r();else requestAnimationFrame(f);};requestAnimationFrame(f);})"); return pg.evaluate(STATE)
    def shot(n):
        if shots: pg.screenshot(path=str(shots / (n + ".png")))
    load()

    # 1 start
    ok("menu: Survival button under Play", pg.evaluate("()=>!document.getElementById('v2surv').hidden&&document.getElementById('v2sub').hidden"))
    pg.evaluate("()=>document.getElementById('v2surv').click()")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000, polling=200); pg.wait_for_timeout(700); pg.evaluate("()=>__PM.setRunning(false)")
    s = state()
    ok("start: a survival run, wave 1, locked like a season", s["surv"] and s["on"] and s["k"] == 1 and s["lock"], s)
    ok("start: chip shows wave 1 at ×1.00", s["chip"] and s["svW"] == "Wave 1" and s["svU"] == "×1.00" and s["svC"] == "×1.00", s)
    ok("start: clock says Wave 1 · Day 1", s["clock"] == "Wave 1 · Day 1", s)
    ok("start: costs are exactly ×1", s["costMul"] == 1, s)
    occ1, en1 = s["occ"], s["energy"]; shot("1-start")

    # 2 first outage dialog and the wave report card
    r = pg.evaluate(RUNTO, ["S.cards.open&&S.cards.open.outage", 400000])
    txt = pg.evaluate("()=>document.getElementById('outOv').innerText")
    ok("outage 1: the dialog opens the day before", r["open"] == "outage" and r["day"] == 6, r)
    ok("outage 1: it names the wave and what wave 2 brings", "WAVE 1" in txt.upper() and "wave 2" in txt and "×1.20" in txt and "×1.10" in txt, txt[:400]); shot("2-outage-plan")
    pg.evaluate("()=>document.getElementById('out-ok').click()")
    r = pg.evaluate(RUNTO, ["S.cards.open&&S.cards.open.report", 400000])
    txt = pg.evaluate("()=>document.getElementById('rcOv').innerText")
    ok("wave 1 ends with its outage: report card", r["open"] == "report" and r["k"] == 2, r)
    ok("wave report card names the wave and the next multipliers", "WAVE 1 REPORT CARD" in txt.upper() and "Wave 2 starts now" in txt and "×1.20" in txt, txt[:300]); shot("3-wave-card")
    pg.evaluate("()=>{document.getElementById('rc-ok').click();__PM.setRunning(false);}")

    # 3 wave 2: applied and shown
    pg.wait_for_timeout(500); s = state()
    ok("wave 2: costs ×1.10 applied", abs(s["costMul"] - 1.1) < 1e-9, s)
    ok("wave 2: chip shows ×1.20 and ×1.10", s["svW"] == "Wave 2" and s["svU"] == "×1.20" and s["svC"] == "×1.10", s)
    ok("wave 2: upset rate is base 0.5 × 1.20 after the first week", abs(pg.evaluate("()=>{const S=__PM.S,t=S.t;S.t=8*1440;const v=__PM.upsetMul();S.t=t;return v;}") - 0.6) < 1e-9)
    cash2 = s["cash"]; t2 = s["t"]

    # 4 save, reload, continue
    ok("save: written", pg.evaluate("()=>__PM.G3.save.save('test')"))
    load()
    lab = pg.evaluate("()=>{const b=document.getElementById('v2cont');return b?b.innerText:null}")
    ok("continue: the button says survival and the wave", bool(lab) and "Continue survival" in lab and "wave 2" in lab, lab)
    pg.evaluate("()=>document.getElementById('v2cont').click()")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000, polling=200); pg.evaluate("()=>__PM.setRunning(false)"); pg.wait_for_timeout(500)
    s = state()
    ok("continue: the same run (survival, wave 2, cash, costs ×1.10)", s["surv"] and s["k"] == 2 and abs(s["cash"] - cash2) < 2000 and abs(s["costMul"] - 1.1) < 1e-9 and s["chip"], s)

    # 5 outages 2-5; the jobs go round again
    jobs = []
    for k in (2, 3, 4, 5):
        r = pg.evaluate(RUNTO, ["S.cards.open&&S.cards.open.outage", 400000])
        txt = pg.evaluate("()=>document.getElementById('outOv').innerText")
        jobs.append(txt.split("Major job:")[1].split(",")[0].strip() if "Major job:" in txt else "?")
        pg.evaluate("()=>document.getElementById('out-ok').click()")
        if k < 5:
            pg.evaluate(RUNTO, ["S.cards.open&&S.cards.open.report", 400000]); pg.evaluate("()=>{document.getElementById('rc-ok').click();__PM.setRunning(false);}")
    out = pg.evaluate("()=>__PM.OUT.jobs")
    ok("outage jobs 2, 3, 4, then 1 again", jobs == [out[1], out[2], out[3], out[0]], jobs)
    # outage 5 with the 3D view running: the last of the staging the day before, then the outage itself (the game holds
    # it at 5 sim min/s). Stepped by hand to 3 sim hours before the start; cards that pop are declined.
    pg.evaluate(RUNTO, ["S.t>=(7*5-1)*1440+120-180", 400000])
    pg.evaluate("()=>{const P=__PM;P.C.simSpeed=P.C.spdPref=120;P.G3.on=true;P.setRunning(true);}")
    def live(until, secs):
        for _ in range(secs * 2):
            st = pg.evaluate("([u])=>{const P=__PM,S=P.S,o=S.cards.open;if(o&&o.c)document.getElementById('deal-no').click();if(new Function('S','return '+u)(S))return {done:1};if(!S.cards.open)P.setRunning(true);return {t:Math.round(S.t),run:P.running,open:o?Object.keys(o).join():null,on:S.outg.on,k:S.outg.k};}", [until])
            if st.get("done"): return True
            pg.wait_for_timeout(500)
        print("   (timed out waiting for " + until + ")", st); return False
    ok("outage 5 starts with the 3D view on", live("S.outg.on", 240)); pg.wait_for_timeout(6000); shot("4-outage5-3d")
    # (the rest of the outage with the picture off: the crews and jobs still run every frame, without the software renderer's wait)
    pg.evaluate("()=>{__PM.G3.EXP.noRender=true;}")
    ok("outage 5 ends and wave 6 starts", live("S.outg.k===6", 300)); pg.evaluate("()=>{__PM.setRunning(false);__PM.G3.EXP.noRender=false;}")
    ok("outage 5 ran in 3D without errors", not errs, errs[:3])
    pg.evaluate("()=>{const o=__PM.S.cards.open;if(o&&o.report)document.getElementById('rc-ok').click();__PM.setRunning(false);}")
    s = state()
    ok("wave 6: ×2.49 upsets, ×1.61 costs", s["svW"] == "Wave 6" and s["svU"] == "×2.49" and s["svC"] == "×1.61" and abs(s["costMul"] - 1.1 ** 5) < 1e-9, s)

    # 6 report tab, then bankruptcy
    pg.evaluate("()=>{document.querySelector('.v2tabs [data-tab=stats]').click();__PM.setRunning(false);}"); pg.wait_for_timeout(1500)
    rep = pg.evaluate("()=>document.getElementById('rep').innerText")
    ok("report tab: survival strip, waves and this wave", "Survival" in rep and "Wave 6" in rep and "This wave so far" in rep and "×2.49" in rep, rep[:300]); shot("5-report")
    pg.evaluate("()=>{const d=document.getElementById('repDays');if(d)d.open=true;}"); pg.wait_for_timeout(1300); shot("5b-report-days")
    pg.evaluate("()=>document.getElementById('v2close').click()")
    r = pg.evaluate("()=>{const P=__PM,S=P.S;S.cash=-1.6e6;P.G3.on=false;P.step(0.25);P.G3.on=true;return {t:S.t,season:S.season,ov:!document.getElementById('seasonOv').hidden,txt:document.getElementById('seasonOv').innerText,more:document.getElementById('so-more').textContent};}")
    m = int(r["t"]); want = f"{m // 1440}d {m % 1440 // 60}h {m % 60}m"
    ok("bankrupt: the run ends on the survival dialog", r["ov"] and r["season"]["done"] and not r["season"]["on"] and "Survival over" in r["txt"], r["txt"][:200])
    ok("bankrupt: the score is the time survived (" + want + ")", r["season"]["result"]["minutes"] == m and want in r["txt"] and r["season"]["result"]["wave"] == 6, r["season"].get("result"))
    ok("bankrupt: 'Menu' instead of 'One more turn', and the new-run button says survival", r["more"] == "Menu" and "One more turn" not in r["txt"] and "New survival run" in r["txt"], r["txt"][-200:]); shot("6-game-over")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    ok("bankrupt: Escape leaves the dialog up", pg.evaluate("()=>!document.getElementById('seasonOv').hidden&&!__PM.running"))
    pg.evaluate("()=>{document.getElementById('so-name').value='Tester';document.getElementById('so-submit').click();}"); pg.wait_for_timeout(1200)
    r = pg.evaluate("()=>({msg:document.getElementById('so-msg').textContent,local:JSON.parse(localStorage.getItem('paper-mill-local-survival')||'[]'),best:+localStorage.getItem('paper-mill-survival-best'),season:localStorage.getItem('paper-mill-local-scores')})")
    ok("submit with no online table: kept on the device, said so", "Saved on this device" in r["msg"] and len(r["local"]) == 1 and r["local"][0]["minutes"] == m and r["best"] == m and not r["season"], r)
    pg.evaluate("()=>document.getElementById('so-board').click()"); pg.wait_for_timeout(1200)
    r = pg.evaluate("()=>({tab:document.querySelector('#lb-tabs button[aria-pressed=true]').dataset.t,txt:document.getElementById('lb-list').innerText,sub:document.getElementById('lb-sub').textContent})")
    ok("leaderboard: opens on the Survival tab with the device's score", r["tab"] == "surv" and "Tester" in r["txt"] and want in r["txt"] and "wave 6" in r["txt"], r); shot("7-board-survival")
    pg.evaluate("()=>document.querySelector('#lb-tabs button[data-t=season]').click()"); pg.wait_for_timeout(1000)
    r = pg.evaluate("()=>({tab:document.querySelector('#lb-tabs button[aria-pressed=true]').dataset.t,txt:document.getElementById('lb-list').innerText,sub:document.getElementById('lb-sub').textContent})")
    ok("leaderboard: the Season tab is the season board", r["tab"] == "season" and "Tester" not in r["txt"] and "30-day seasons" in r["sub"], r); shot("8-board-season")
    pg.evaluate("()=>document.getElementById('lb-close').click()")

    # 7 a new run, free play, a season
    pg.evaluate("()=>{document.getElementById('so-new').click();__PM.setRunning(false);}"); pg.wait_for_timeout(600); s = state()
    ok("new survival run: clean start (wave 1, ×1, $2.0M)", s["surv"] and s["on"] and s["k"] == 1 and s["costMul"] == 1 and s["cash"] == 2000000 and s["t"] < 60 and abs(s["occ"] - occ1) < 1e-9, s)
    pg.evaluate("()=>{__PM.S.outg.k=4;__PM.setBn(__PM.S.bn);}"); s = state()
    ok("costs follow the wave (wave 4 = ×1.331 on fibre and energy)", abs(s["costMul"] - 1.331) < 1e-9 and abs(s["occ"] / occ1 - 1.331) < 1e-9 and abs(s["energy"] / en1 - 1.331) < 1e-9, s)
    pg.evaluate("()=>{document.getElementById('v2pause').click();document.getElementById('v2free').click();__PM.setRunning(false);}"); pg.wait_for_timeout(600); s = state()
    ok("free play abandons the run: no wave costs, no chip, no locks", not s["surv"] and s["costMul"] == 1 and not s["chip"] and not s["lock"], s)
    pg.evaluate("()=>{document.getElementById('v2pause').click();document.getElementById('v2free').click();document.getElementById('v2pause').click();document.getElementById('v2season').click();__PM.setRunning(false);}"); pg.wait_for_timeout(600); s = state()
    ok("a season is still a season (30 days, no chip, ×1)", s["on"] and not s["surv"] and s["clock"] == "Day 1 of 30" and not s["chip"] and s["costMul"] == 1 and pg.evaluate("()=>__PM.S.season.end") == 30 * 1440, s)
    pg.evaluate("()=>{document.getElementById('v2pause').click();}"); pg.wait_for_timeout(400)
    ok("pause menu: New season, New survival, Reset; no big Survival button", pg.evaluate("()=>document.getElementById('v2surv').hidden&&!document.getElementById('v2sub').hidden&&!!document.getElementById('v2survNew')")); shot("9-pause-menu")
    pg.evaluate("()=>{document.getElementById('v2survNew').click();__PM.setRunning(false);}"); pg.wait_for_timeout(500); s = state()
    ok("New survival from the pause menu starts a run", s["surv"] and s["on"] and s["k"] == 1 and s["chip"], s)
    r = pg.evaluate("()=>{const P=__PM,S=P.S;S.cash=-1.6e6;P.G3.on=false;P.step(0.25);P.G3.on=true;document.getElementById('so-more').click();return {ov:document.getElementById('seasonOv').hidden,menu:!document.getElementById('v2menu').hidden,run:P.running,season:!!P.S.season,cash:P.S.cash};}")
    ok("game over: Menu goes back to the menu on a fresh mill", r["ov"] and r["menu"] and not r["run"] and not r["season"] and r["cash"] == 2000000, r)
    b.close()
ok("no page errors", not errs, errs[:5])
print("SURVIVAL CHECK " + ("PASSED" if not fails else f"FAILED ({len(fails)}): " + "; ".join(fails)))
sys.exit(1 if fails else 0)
