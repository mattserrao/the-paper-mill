"""Game speed, outages and settings. Replaces tools/speedcheck.py (v5.0.1/v5.0.6), tools/v506check.py (v5.0.6) and
tools/settingscheck.py (v4.2.1).

The player's speed is the only speed and nothing overwrites it (v5.0.1). A planned outage runs at the player's speed;
the cap is the opt-in "Watch the crews" (v5.0.6), which runs the outage at 5 min/s until the outage ends or the player
taps − or + (the first tap only hands the speed back). Zen runs at 1. When either ends the game is back at the
player's speed with nothing to restore.

  speed     (speedcheck) season: the speed buttons during an outage, Watch the crews and the readout, a save and
            Continue in the middle of an outage while watching, zen during an outage, and an old (pre-v5.0.1) save that
            kept the slowed speed
  survival  (v506check) survival run: the Watch the crews notice (shown, closes on Watch, + hands the speed back,
            shown again next outage, gone when the outage ends, no button at 5 min/s), and the v5.0.6 QA-report fixes:
            report card Deals row, film/VIP cards, name filter on Submit, one post per run, board highlight, card hint,
            Fiber spelling, leader short name, cash-below-zero banner, rename counter, game-over text
            (Supabase is mocked: nothing is posted)
  settings  (settingscheck) Settings tab on the right, area controls folded, and locked on AUTO in a season

Dropped as duplicates: v506check's "outage runs at the player's speed", "watching slows the clock to 5 and keeps the
player's 60", "speed label while watching" and "watch ends with the outage" (speed covers each; the notice-closes check
here still confirms watching is at 5); settingscheck's two outage-speed printouts (the player's speed survives an outage
and a tap during it sticks: speed covers both; on v6.10.1 its first run never even reached the outage, inOut False).
Usage: python3 speed.py [index.html]"""
# tier: default
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log
Q = "?" + LITE   # sim and DOM only: nothing here reads the 3D view

# ---------------------------------------------------------------- speed (tools/speedcheck.py)
SPX = "window.__PM={simRate:()=>simRate(),setZen:v=>setZen(v),"
CLR = "const clr=()=>{const o=P.S.cards.open;if(!o)return;if(o.c)document.getElementById('deal-no').click();else if(o.outage)document.getElementById('out-ok').click();else if(o.report)document.getElementById('rc-ok').click();if(P.S.cards.open)P.S.cards.open=null;if(P.S.civ){P.S.civ.cur=null;P.S.civ.pending=null;if(P.S.civ.q)P.S.civ.q.length=0;}P.setRunning(false);};"   # (v5.6: v5.1 civics choices hold the outage notice back too)
TO_OUT = "()=>{const P=__PM;" + CLR + "let k=0;while(!P.S.outg.on&&k++<9*1440*4){P.step(0.25);clr();}P.setRunning(false);return P.S.outg.on}"
TO_END = "()=>{const P=__PM;" + CLR + "let k=0;while(P.S.outg.on&&k++<1440*4){P.step(0.25);clr();}P.setRunning(false);return !P.S.outg.on}"
def txt(pg, want):
    try: pg.wait_for_function("(w)=>document.getElementById('v2speed').textContent.includes(w)", arg=want, timeout=20000, polling=100); return True
    except Exception: return False
ST = "()=>({c:__PM.C.simSpeed,rate:__PM.simRate(),on:__PM.S.outg.on,k:__PM.S.outg.k,txt:document.getElementById('v2speed').textContent})"

def speed(pw):
    C.sec("speed")
    html = html_arg().replace("window.__PM={", SPX, 1)
    b = launch(pw)
    ctx = b.new_context(viewport={"width": 800, "height": 450})   # one context: the pages share localStorage
    def page():
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:200])); pg.route("**/*", route_for(html))
        pg.add_init_script(INIT); pg.goto("http://bench.local/" + Q)
        pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300); return pg
    pg = page()
    pg.evaluate("()=>{document.getElementById('v2go').click()}"); ok("season starts", pick_leader(pg))   # (v5.6: the v5.1 leader picker)
    pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;const f=document.getElementById('v2fast');while(__PM.C.simSpeed<120)f.click();}")
    ok("the player picks 120", pg.evaluate(ST)["c"] == 120)
    ok("reached outage 1", pg.evaluate(TO_OUT)); t = txt(pg, "120 min/s"); s = pg.evaluate(ST)
    ok("outage 1 (v5.0.6): runs at the player's 120, not capped", s["on"] and s["rate"] == 120 and s["c"] == 120 and t, s)
    pg.evaluate("()=>{const b=document.getElementById('out-watch');clearTimeout(document.getElementById('outOv')._t);if(b)b.click();else __PM.S.outg.watch=true;}"); t = txt(pg, "Watching crews · 5 min/s"); s = pg.evaluate(ST)
    ok("outage 1: Watch the crews runs it at 5, the player's 120 untouched, the readout says so", s["on"] and s["rate"] == 5 and s["c"] == 120 and t, s)
    pg.evaluate("()=>document.getElementById('v2slow').click()"); s = pg.evaluate(ST)
    ok("outage 1: the first tap of slower stops watching (back to 120), the speed itself unchanged", s["c"] == 120 and s["rate"] == 120 and not pg.evaluate("()=>__PM.S.outg.watch"), s)
    pg.evaluate("()=>document.getElementById('v2slow').click()"); s = pg.evaluate(ST)
    ok("outage 1: the next tap changes the speed (60)", s["c"] == 60 and s["rate"] == 60, s)
    pg.evaluate("()=>{__PM.S.outg.watch=true}"); s = pg.evaluate(ST)
    ok("outage 1: watching again runs at 5", s["rate"] == 5 and s["c"] == 60, s)
    # save in the middle of the outage, reload, Continue
    pg.evaluate("()=>{__PM.G3.save.save('test');window.__sv=localStorage.getItem('paper-mill-save');__PM.G3.saveOff=true;}")
    sv = pg.evaluate("()=>window.__sv"); pg.close()
    pg = page(); pg.evaluate("(v)=>localStorage.setItem('paper-mill-save',v)", sv); pg.close(); pg = page()
    pg.evaluate("()=>{document.getElementById('v2cont').click();__PM.setRunning(false);}"); pg.wait_for_timeout(300); s = pg.evaluate(ST)
    ok("continue mid-outage while watching: still in the outage at 5, the player's speed is 60", s["on"] and s["rate"] == 5 and s["c"] == 60, s)
    pg.evaluate(TO_END); t = pg.evaluate("()=>{__PM.setRunning(true);return 1}") and txt(pg, "60 min/s") and not pg.evaluate("()=>document.getElementById('v2speed').textContent.includes('Watching')"); pg.evaluate("()=>__PM.setRunning(false)"); s = pg.evaluate(ST)
    ok("outage 1 ends: back at 60 with nothing restored, watching over", not s["on"] and s["rate"] == 60 and s["c"] == 60 and t and "Watching" not in s["txt"] and not pg.evaluate("()=>__PM.S.outg.watch"), s)
    # zen in the middle of outage 2
    pg.evaluate(TO_OUT); pg.evaluate("()=>__PM.setZen(true)"); s = pg.evaluate(ST)
    ok("zen: runs at 1, the player's speed untouched", s["rate"] == 1 and s["c"] == 60, s)
    pg.evaluate("()=>__PM.setZen(false)"); s = pg.evaluate(ST)
    ok("zen off: back to the player's 60 (zen ended the season, so no outage)", s["rate"] == 60 and s["c"] == 60, s)
    pg.close()
    # an old save from before v5.0.1: slowed speed in C.simSpeed, the player's in C.spdPref
    old = json.loads(sv); old["C"]["simSpeed"] = 5; old["C"]["spdPref"] = 90
    old["S"]["outg"].pop("watch", None)   # (pre-v5.0.6 saves have no watch flag: the outage runs at the player's speed)
    pg = page(); pg.evaluate("(v)=>localStorage.setItem('paper-mill-save',v)", json.dumps(old)); pg.close(); pg = page()
    pg.evaluate("()=>{document.getElementById('v2cont').click();__PM.setRunning(false);}"); pg.wait_for_timeout(300); s = pg.evaluate(ST)
    ok("old save: the player's speed (90) comes back, the outage runs at it (v5.0.6: no cap unless watching)", s["c"] == 90 and s["rate"] == 90 and pg.evaluate("()=>!('spdPref' in __PM.C)"), s)
    pg.evaluate(TO_END); s = pg.evaluate(ST)
    ok("old save: the outage ends at 90", s["rate"] == 90, s)
    pg.close(); b.close()

# ---------------------------------------------------------------- survival (tools/v506check.py)
VX = "window.__PM={outCapped:()=>outCapped(),get OUT(){return OUT},get ECON(){return ECON},rcSum:a=>rcSum(a),nameOk:v=>nameOk(v),get CARDS(){return CARDS},cardHave:c=>cardHave(c),leadShort:id=>leadShort(id),get BANNERS(){return BANNERS},survUp:w=>survUp(w),survCost:w=>survCost(w),"
# (v5.1 civics: an open civics choice holds the next outage until it's answered, so STEP answers it, as survcheck.py does;
#  and rc-ok is only clicked while a report card is actually open: clicking the hidden one cleared a civics card's hold
#  on S.cards.open and left the outages waiting on a choice that was never shown again)
STEP = "async n=>{const P=__PM;for(let i=0;i<n;i++){P.step(0.25);const o=P.S.cards.open;if(o){if(o.c)document.getElementById('deal-no').click();else if(o.outage)document.getElementById('out-ok').click();else if(o.report)document.getElementById('rc-ok').click();else if(o.civ){const b=document.querySelector('#civOv .civbtn');if(b)b.click();}}if(P.S.outg.on)return true;if(i%4000===0)await new Promise(r=>setTimeout(r,0));}P.setRunning(false);return false}"

def survival(pw):
    C.sec("survival")
    html = html_arg().replace("window.__PM={", VX, 1)
    posts = []
    base = route_for(html)
    def route(r):
        u = r.request.url
        if "supabase.co" in u:
            if r.request.method == "POST": posts.append(r.request.post_data); return r.fulfill(status=201, body="", headers={"Access-Control-Allow-Origin": "*"})
            if r.request.method == "HEAD": return r.fulfill(status=200, body="", headers={"Content-Range": "0-0/50", "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": "Content-Range"})
            rows = [{"name": "QA Check" if i % 3 == 0 else "Tester", "minutes": 90000 - i * 500, "wave": 9, "tons": 20000, "incidents": 50, "mill": "Old Mill", "created_at": "2026-10-01T00:00:00Z"} for i in range(30)]
            return r.fulfill(status=200, body=json.dumps(rows), headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"})
        return base(r)
    b = launch(pw)
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:200]))
    pg.route("**/*", route); pg.add_init_script(INIT)
    pg.goto("http://bench.local/?env=rural&" + LITE); pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000)
    pg.evaluate("()=>document.getElementById('v2surv').click()"); pg.wait_for_function("()=>!document.getElementById('leadOv').hidden")
    pg.evaluate("()=>{document.querySelector('#leadOv .ldcard[data-l=\"hank\"]').click();document.getElementById('ld-go').click()}")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on&&__PM.S.season.surv", timeout=60000)
    pg.evaluate("()=>{__PM.C.simSpeed=60;__PM.setRunning(false);const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;}")
    # 1 outage at the player's speed, Watch the crews opt-in
    on = pg.evaluate(STEP, 40000); ok("reached the first planned outage", on)
    pg.wait_for_function("()=>!!document.getElementById('out-watch')", timeout=5000)   # (a card dealt on the same tick holds the notice back until it's answered)
    pg.evaluate("()=>clearTimeout(document.getElementById('outOv')._t)")   # (the notice's 7 s real-time timer runs out under SwiftShader before the checks land)
    st = pg.evaluate("()=>({rate:__PM.simRate(),capped:__PM.outCapped(),btn:!!document.getElementById('out-watch'),note:!document.getElementById('outOv').hidden,txt:document.getElementById('out-watch')&&document.getElementById('out-watch').textContent})")
    ok("notice shows a Watch the crews button", st["btn"] and st["note"] and st["txt"] == "Watch the crews", st)
    pg.evaluate("()=>clearTimeout(document.getElementById('outOv')._t)")   # (the notice's 7 s real-time timer runs out under SwiftShader before the click lands)
    pg.click("#out-watch", force=True); pg.wait_for_function("()=>document.getElementById('v2speed').textContent.startsWith('Watching')", timeout=15000)
    st = pg.evaluate("()=>({rate:__PM.simRate(),sp:__PM.C.simSpeed,note:!document.getElementById('outOv').hidden,lab:document.getElementById('v2speed').textContent,w:__PM.S.outg.watch})")
    ok("the notice closes on Watch the crews (and the clock is watching at 5)", not st["note"] and st["w"] and st["rate"] == 5, st)
    pg.evaluate("()=>document.getElementById('v2fast').click()"); pg.wait_for_timeout(300)
    st = pg.evaluate("()=>({rate:__PM.simRate(),sp:__PM.C.simSpeed,w:__PM.S.outg.watch,lab:document.getElementById('v2speed').textContent})")
    ok("+ during watching hands the speed back without changing it (speed_watch tests −)", st["rate"] == 60 and st["sp"] == 60 and not st["w"], st)
    pg.evaluate("()=>{__PM.S.outg.watch=true}")
    pg.evaluate("()=>{const P=__PM;for(let i=0;i<2000&&P.S.outg.on;i++)P.step(0.25);P.setRunning(false)}")
    st = pg.evaluate("()=>({on:__PM.S.outg.on,w:__PM.S.outg.watch,rate:__PM.simRate()})")
    # second outage: notice shown again, then it closes when the outage ends even inside 7 s
    pg.evaluate("()=>{const r=document.getElementById('rc-ok'),o=__PM.S.cards.open;if(r&&o&&o.report)r.click()}")
    on = pg.evaluate(STEP, 40000); vis = pg.evaluate("()=>!document.getElementById('outOv').hidden&&!!document.getElementById('out-watch')")
    ok("second outage shows the notice again", on and vis)
    pg.evaluate("()=>{const P=__PM;for(let i=0;i<2000&&P.S.outg.on;i++)P.step(0.25);P.setRunning(false)}")
    ok("the notice is gone once the outage ends (well inside its 7 s)", pg.evaluate("()=>document.getElementById('outOv').hidden||!document.getElementById('outOv').classList.contains('note')"))
    # at 5 min/s there's nothing to slow: no button
    pg.evaluate("()=>{const r=document.getElementById('rc-ok'),o=__PM.S.cards.open;if(r&&o&&o.report)r.click();__PM.C.simSpeed=5}")
    on = pg.evaluate(STEP, 40000)
    ok("no Watch button when the player's speed is already 5", on and not pg.evaluate("()=>!!document.getElementById('out-watch')"))
    pg.evaluate("()=>{const P=__PM;for(let i=0;i<2000&&P.S.outg.on;i++)P.step(0.25);P.setRunning(false);P.C.simSpeed=60;const r=document.getElementById('rc-ok'),o=__PM.S.cards.open;if(r&&o&&o.report)r.click()}")
    # report card: a paid card adds a Deals & trials row and the rows add up
    s = pg.evaluate("""()=>{const P=__PM,L=JSON.parse(JSON.stringify(P.S.ledger));const a={L0:L,min:1440,plan:0,up:{},dn:{},bn:{},prod0:P.S.tot.prodT,ship0:P.S.shipT||0,brk0:0,hay0:0,rolls0:0,off0:0,occ:0,fib:0};
      for(const k of ['machine','stock','dry','wet','fin','recv','ship'])a.up[k]=0;P.S.ledger.deals=(P.S.ledger.deals||0)-20000;const r=P.rcSum(a);P.S.ledger.deals+=20000;
      const rows=Object.values(r.spent).reduce((t,v)=>t+v,0);return {deals:r.spent['Deals & trials'],rows,earned:r.earned,net:r.net}}""")
    ok("report card rows add up with a paid card", s["deals"] == 20000 and abs(s["earned"] - s["rows"] - s["net"]) < 1, s)
    # film / VIP don't come back once won
    c = pg.evaluate("()=>{const P=__PM,f=P.CARDS.find(c=>c.id==='film'),v=P.CARDS.find(c=>c.id==='vip');const a=[f.ok(),v.ok()];P.S.perk.film=1;P.S.perk.vip=1;const b=[f.ok(),v.ok()];P.S.perk.film=0;P.S.perk.vip=0;return [a,b]}")
    ok("film and VIP cards are dealt until won, then not again", c[0] == [True, True] and c[1] == [False, False], c)
    # name filter
    nm = pg.evaluate("()=>[__PM.nameOk('Sh1t'),__PM.nameOk('fυck'),__PM.nameOk('ｆｕｃｋ'),__PM.nameOk('Scunthorpe Mill'),__PM.nameOk('Café du Papier')]")
    ok("name filter folds Unicode look-alikes", nm == [False, False, False, True, True], nm)
    # polish (v5.0.6): card hint ownership, fiber spelling, leader short name, cash-below-zero banner, rename counter
    h = pg.evaluate("()=>{const c=__PM.CARDS.find(c=>c.id==='cheap');return __PM.cardHave(c)}")
    ok("card hint says whether you have the upgrade", h in ("You don't have it yet.", "You have it."), h)
    s2 = pg.evaluate("()=>{const P=__PM,L=JSON.parse(JSON.stringify(P.S.ledger));const a={L0:L,min:1440,plan:0,up:{machine:0,stock:0,dry:0,wet:0,fin:0,recv:0,ship:0},dn:{},bn:{},prod0:0,ship0:0,brk0:0,hay0:0,rolls0:0,off0:0,occ:0,fib:0};return Object.keys(P.rcSum(a).spent)}")
    ok("report rows say Fiber", "Fiber" in s2 and "Fibre" not in s2, s2[:3])
    ok("leader row uses the short name (Dot Blade)", pg.evaluate("()=>__PM.leadShort('dot')") == "Dot Blade")
    pg.evaluate("()=>{const P=__PM;P.S.season.red=0;P.S.cash=-1000;for(let i=0;i<8;i++)P.step(0.25);P.setRunning(false)}")
    bt = pg.evaluate("()=>__PM.BANNERS.map(b=>b.text).find(t=>t.startsWith('Cash is below zero'))")
    ok("one-time banner when cash goes below zero", bool(bt) and "−$1.50M" in bt, bt)
    n2 = pg.evaluate("()=>{const P=__PM;for(let i=0;i<8;i++)P.step(0.25);P.setRunning(false);return P.BANNERS.filter(b=>b.text.startsWith('Cash is below zero')).length}")
    ok("the below-zero banner shows once", n2 == 1, n2)
    pg.evaluate("()=>{document.getElementById('v2rename').click();const i=document.getElementById('v2name');i.value='x'.repeat(32);i.dispatchEvent(new Event('input'))}")
    ok("rename box shows a 32-character counter", pg.evaluate("()=>document.getElementById('v2nameCount').textContent") == "32/32")
    pg.evaluate("()=>{document.getElementById('v2nameRow').hidden=true}")
    # bankruptcy: game-over text, name filter on Submit, one post per run
    pg.evaluate("()=>{const P=__PM;P.S.cash=-1.6e6;for(let i=0;i<40&&P.S.season.on;i++)P.step(0.25);P.setRunning(false)}")
    p = pg.evaluate("()=>document.getElementById('so-p').textContent")
    ok("game-over says why", "−$1.50M bankruptcy line" in p and "×" in p, p)
    pg.fill("#so-name", "Sh1t"); pg.click("#so-submit"); pg.wait_for_timeout(500)
    ok("banned look-alike player name refused, nothing posted", not posts and "isn't allowed" in pg.evaluate("()=>document.getElementById('so-msg').textContent"))
    pg.fill("#so-name", "QA Check"); pg.click("#so-submit"); pg.wait_for_function("()=>document.getElementById('so-submit').textContent.startsWith('Submitted')", timeout=10000)
    pg.focus("#so-name"); [pg.keyboard.press("Enter") for _ in range(4)]; pg.wait_for_timeout(800)
    ok("one post per run (Enter after Submit sends nothing more)", len(posts) == 1, f"{len(posts)} POST(s)")
    pg.wait_for_timeout(1500)
    marked = pg.evaluate("()=>document.querySelectorAll('#lb-list .lbrow.me').length")
    ok("board marks only this run's row", marked == 1, marked)
    b.close()

# ---------------------------------------------------------------- settings (tools/settingscheck.py)
def settings(pw):
    C.sec("settings")
    html = html_arg()
    b = launch(pw)
    pg = open_game(b, html, LITE, viewport=(800, 450), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300)
    tabs = pg.evaluate("()=>[...document.querySelectorAll('.v2tabs button')].map(b=>b.textContent.trim())")
    ok("Settings is the right-most sheet tab", bool(tabs) and tabs[-1] == "Settings", tabs)
    ok("area controls start folded", pg.evaluate("()=>{const d=document.getElementById('areactl');return d?!d.open:null}") is True)
    pg.evaluate("()=>{document.getElementById('v2go').click()}"); ok("season starts", pick_leader(pg))   # (v5.6: the v5.1 leader picker)
    pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;}")
    lk = pg.evaluate("""()=>{const C=__PM.C,ins=[...document.querySelectorAll('#cards .row[data-key] input,#cards .row[data-key] button.auto')];
      return {season:!!(__PM.S.season&&__PM.S.season.on),allDisabled:ins.every(e=>e.disabled),n:ins.length,allAuto:['inRate','drivers','pulper','pmSp','wdr','loaders','outRate'].every(k=>C[k].auto),paperFree:!document.querySelector('#paperColor button').disabled}}""")
    ok("in a season every area control is locked on AUTO (paper colour stays free)", lk["season"] and lk["n"] > 0 and lk["allDisabled"] and lk["allAuto"] and lk["paperFree"], lk)
    b.close()

with sync_playwright() as pw:
    for f in (speed, survival, settings):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()      # page errors fail the check
