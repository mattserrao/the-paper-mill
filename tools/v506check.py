"""v5.0.6 checks: outages at the player's speed with an opt-in "Watch the crews", and the QA-report fixes
(name filter on Submit, one post per run, board highlight, report card Deals row, game-over text, film/VIP cards).
Usage: python3 v506check.py <index.html>   (Supabase is mocked: nothing is posted)"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
exec((HERE / "bench.py").read_text().split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
html = html.replace("window.__PM={", "window.__PM={simRate:()=>simRate(),outCapped:()=>outCapped(),get OUT(){return OUT},get ECON(){return ECON},rcSum:a=>rcSum(a),nameOk:v=>nameOk(v),get CARDS(){return CARDS},cardHave:c=>cardHave(c),leadShort:id=>leadShort(id),get BANNERS(){return BANNERS},survUp:w=>survUp(w),survCost:w=>survCost(w),", 1)
fails, posts = [], []
def ok(c, msg):
    print(("PASS " if c else "FAIL ") + msg, flush=True)
    if not c: fails.append(msg)
def route(r):
    u = r.request.url
    if "supabase.co" in u:
        if r.request.method == "POST": posts.append(r.request.post_data); return r.fulfill(status=201, body="", headers={"Access-Control-Allow-Origin": "*"})
        if r.request.method == "HEAD": return r.fulfill(status=200, body="", headers={"Content-Range": "0-0/50", "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": "Content-Range"})
        rows = [{"name": "QA Check" if i % 3 == 0 else "Tester", "minutes": 90000 - i * 500, "wave": 9, "tons": 20000, "incidents": 50, "mill": "Old Mill", "created_at": "2026-10-01T00:00:00Z"} for i in range(30)]
        return r.fulfill(status=200, body=json.dumps(rows), headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"})
    return route_for(html)(r)
# (v5.1 civics: an open civics choice holds the next outage until it's answered, so STEP answers it, as survcheck.py does;
#  and rc-ok is only clicked while a report card is actually open: clicking the hidden one cleared a civics card's hold
#  on S.cards.open and left the outages waiting on a choice that was never shown again)
STEP = "async n=>{const P=__PM;for(let i=0;i<n;i++){P.step(0.25);const o=P.S.cards.open;if(o){if(o.c)document.getElementById('deal-no').click();else if(o.outage)document.getElementById('out-ok').click();else if(o.report)document.getElementById('rc-ok').click();else if(o.civ){const b=document.querySelector('#civOv .civbtn');if(b)b.click();}}if(P.S.outg.on)return true;if(i%4000===0)await new Promise(r=>setTimeout(r,0));}P.setRunning(false);return false}"
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1280, "height": 800}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route); pg.add_init_script(INIT)
    pg.goto("http://bench.local/?env=rural"); pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000)
    pg.evaluate("()=>document.getElementById('v2surv').click()"); pg.wait_for_function("()=>!document.getElementById('leadOv').hidden")
    pg.evaluate("()=>{document.querySelector('#leadOv .ldcard[data-l=\"hank\"]').click();document.getElementById('ld-go').click()}")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on&&__PM.S.season.surv", timeout=60000)
    pg.evaluate("()=>{__PM.C.simSpeed=60;__PM.setRunning(false);const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;}")
    # 1 outage at the player's speed, Watch the crews opt-in
    on = pg.evaluate(STEP, 40000); ok(on, "reached the first planned outage")
    pg.wait_for_function("()=>!!document.getElementById('out-watch')", timeout=5000)   # (a card dealt on the same tick holds the notice back until it's answered)
    pg.evaluate("()=>clearTimeout(document.getElementById('outOv')._t)")   # (the notice's 7 s real-time timer runs out under SwiftShader before the checks land)
    st = pg.evaluate("()=>({rate:__PM.simRate(),capped:__PM.outCapped(),btn:!!document.getElementById('out-watch'),note:!document.getElementById('outOv').hidden,txt:document.getElementById('out-watch')&&document.getElementById('out-watch').textContent})")
    ok(st["rate"] == 60 and not st["capped"], f"outage runs at the player's speed (rate {st['rate']})")
    ok(st["btn"] and st["note"] and st["txt"] == "Watch the crews", f"notice shows a Watch the crews button ({st})")
    pg.evaluate("()=>clearTimeout(document.getElementById('outOv')._t)")   # (the notice's 7 s real-time timer runs out under SwiftShader before the click lands)
    pg.click("#out-watch", force=True); pg.wait_for_function("()=>document.getElementById('v2speed').textContent.startsWith('Watching')", timeout=15000)
    st = pg.evaluate("()=>({rate:__PM.simRate(),sp:__PM.C.simSpeed,note:!document.getElementById('outOv').hidden,lab:document.getElementById('v2speed').textContent,w:__PM.S.outg.watch})")
    ok(st["rate"] == 5 and st["sp"] == 60 and st["w"], f"watching slows the clock to 5 and keeps the player's 60 ({st})")
    ok(not st["note"], "the notice closes on Watch the crews")
    ok(st["lab"].startswith("Watching crews"), f"speed label while watching: {st['lab']!r}")
    pg.evaluate("()=>document.getElementById('v2fast').click()"); pg.wait_for_timeout(300)
    st = pg.evaluate("()=>({rate:__PM.simRate(),sp:__PM.C.simSpeed,w:__PM.S.outg.watch,lab:document.getElementById('v2speed').textContent})")
    ok(st["rate"] == 60 and st["sp"] == 60 and not st["w"], f"+ during watching hands the speed back without changing it ({st})")
    pg.evaluate("()=>{__PM.S.outg.watch=true}")
    pg.evaluate("()=>{const P=__PM;for(let i=0;i<2000&&P.S.outg.on;i++)P.step(0.25);P.setRunning(false)}")
    st = pg.evaluate("()=>({on:__PM.S.outg.on,w:__PM.S.outg.watch,rate:__PM.simRate()})")
    ok(not st["on"] and not st["w"] and st["rate"] == 60, f"watch ends with the outage ({st})")
    # second outage: notice shown again, then it closes when the outage ends even inside 7 s
    pg.evaluate("()=>{const r=document.getElementById('rc-ok'),o=__PM.S.cards.open;if(r&&o&&o.report)r.click()}")
    on = pg.evaluate(STEP, 40000); vis = pg.evaluate("()=>!document.getElementById('outOv').hidden&&!!document.getElementById('out-watch')")
    ok(on and vis, "second outage shows the notice again")
    pg.evaluate("()=>{const P=__PM;for(let i=0;i<2000&&P.S.outg.on;i++)P.step(0.25);P.setRunning(false)}")
    ok(pg.evaluate("()=>document.getElementById('outOv').hidden||!document.getElementById('outOv').classList.contains('note')"), "the notice is gone once the outage ends (well inside its 7 s)")
    # at 5 min/s there's nothing to slow: no button
    pg.evaluate("()=>{const r=document.getElementById('rc-ok'),o=__PM.S.cards.open;if(r&&o&&o.report)r.click();__PM.C.simSpeed=5}")
    on = pg.evaluate(STEP, 40000)
    ok(on and not pg.evaluate("()=>!!document.getElementById('out-watch')"), "no Watch button when the player's speed is already 5")
    pg.evaluate("()=>{const P=__PM;for(let i=0;i<2000&&P.S.outg.on;i++)P.step(0.25);P.setRunning(false);P.C.simSpeed=60;const r=document.getElementById('rc-ok'),o=__PM.S.cards.open;if(r&&o&&o.report)r.click()}")
    # report card: a paid card adds a Deals & trials row and the rows add up
    s = pg.evaluate("""()=>{const P=__PM,L=JSON.parse(JSON.stringify(P.S.ledger));const a={L0:L,min:1440,plan:0,up:{},dn:{},bn:{},prod0:P.S.tot.prodT,ship0:P.S.shipT||0,brk0:0,hay0:0,rolls0:0,off0:0,occ:0,fib:0};
      for(const k of ['machine','stock','dry','wet','fin','recv','ship'])a.up[k]=0;P.S.ledger.deals=(P.S.ledger.deals||0)-20000;const r=P.rcSum(a);P.S.ledger.deals+=20000;
      const rows=Object.values(r.spent).reduce((t,v)=>t+v,0);return {deals:r.spent['Deals & trials'],rows,earned:r.earned,net:r.net}}""")
    ok(s["deals"] == 20000 and abs(s["earned"] - s["rows"] - s["net"]) < 1, f"report card rows add up with a paid card ({s})")
    # film / VIP don't come back once won
    c = pg.evaluate("()=>{const P=__PM,f=P.CARDS.find(c=>c.id==='film'),v=P.CARDS.find(c=>c.id==='vip');const a=[f.ok(),v.ok()];P.S.perk.film=1;P.S.perk.vip=1;const b=[f.ok(),v.ok()];P.S.perk.film=0;P.S.perk.vip=0;return [a,b]}")
    ok(c[0] == [True, True] and c[1] == [False, False], f"film and VIP cards are dealt until won, then not again ({c})")
    # name filter
    ok(pg.evaluate("()=>[__PM.nameOk('Sh1t'),__PM.nameOk('fυck'),__PM.nameOk('ｆｕｃｋ'),__PM.nameOk('Scunthorpe Mill'),__PM.nameOk('Café du Papier')]") == [False, False, False, True, True], "name filter folds Unicode look-alikes")
    # polish (v5.0.6): card hint ownership, fiber spelling, leader short name, cash-below-zero banner, rename counter
    h = pg.evaluate("()=>{const c=__PM.CARDS.find(c=>c.id==='cheap');return __PM.cardHave(c)}")
    ok(h in ("You don't have it yet.", "You have it."), f"card hint says whether you have the upgrade: {h!r}")
    s2 = pg.evaluate("()=>{const P=__PM,L=JSON.parse(JSON.stringify(P.S.ledger));const a={L0:L,min:1440,plan:0,up:{machine:0,stock:0,dry:0,wet:0,fin:0,recv:0,ship:0},dn:{},bn:{},prod0:0,ship0:0,brk0:0,hay0:0,rolls0:0,off0:0,occ:0,fib:0};return Object.keys(P.rcSum(a).spent)}")
    ok("Fiber" in s2 and "Fibre" not in s2, f"report rows say Fiber: {s2[:3]}")
    ok(pg.evaluate("()=>__PM.leadShort('dot')") == "Dot Blade", "leader row uses the short name (Dot Blade)")
    pg.evaluate("()=>{const P=__PM;P.S.season.red=0;P.S.cash=-1000;for(let i=0;i<8;i++)P.step(0.25);P.setRunning(false)}")
    bt = pg.evaluate("()=>__PM.BANNERS.map(b=>b.text).find(t=>t.startsWith('Cash is below zero'))")
    ok(bool(bt) and "−$1.50M" in bt, f"one-time banner when cash goes below zero: {bt!r}")
    n2 = pg.evaluate("()=>{const P=__PM;for(let i=0;i<8;i++)P.step(0.25);P.setRunning(false);return P.BANNERS.filter(b=>b.text.startsWith('Cash is below zero')).length}")
    ok(n2 == 1, f"the below-zero banner shows once: {n2}")
    pg.evaluate("()=>{document.getElementById('v2rename').click();const i=document.getElementById('v2name');i.value='x'.repeat(32);i.dispatchEvent(new Event('input'))}")
    ok(pg.evaluate("()=>document.getElementById('v2nameCount').textContent") == "32/32", "rename box shows a 32-character counter")
    pg.evaluate("()=>{document.getElementById('v2nameRow').hidden=true}")
    # bankruptcy: game-over text, name filter on Submit, one post per run
    pg.evaluate("()=>{const P=__PM;P.S.cash=-1.6e6;for(let i=0;i<40&&P.S.season.on;i++)P.step(0.25);P.setRunning(false)}")
    p = pg.evaluate("()=>document.getElementById('so-p').textContent")
    ok("−$1.50M bankruptcy line" in p and "×" in p, f"game-over says why: {p!r}")
    pg.fill("#so-name", "Sh1t"); pg.click("#so-submit"); pg.wait_for_timeout(500)
    ok(not posts and "isn't allowed" in pg.evaluate("()=>document.getElementById('so-msg').textContent"), "banned look-alike player name refused, nothing posted")
    pg.fill("#so-name", "QA Check"); pg.click("#so-submit"); pg.wait_for_function("()=>document.getElementById('so-submit').textContent.startsWith('Submitted')", timeout=10000)
    pg.focus("#so-name"); [pg.keyboard.press("Enter") for _ in range(4)]; pg.wait_for_timeout(800)
    ok(len(posts) == 1, f"one post per run (Enter after Submit sends nothing more): {len(posts)} POST(s)")
    pg.wait_for_timeout(1500)
    marked = pg.evaluate("()=>document.querySelectorAll('#lb-list .lbrow.me').length")
    ok(marked == 1, f"board marks only this run's row: {marked}")
    ok(not errs, "no page errors " + str(errs[:3]))
    b.close()
print("RESULT:", "OK" if not fails else f"{len(fails)} FAIL")
