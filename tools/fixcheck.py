"""v5.1 QA fixes: checks each approved bug fix directly. Usage: python3 fixcheck.py <index.html>"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
exec((HERE / "bench.py").read_text().split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text().replace("window.__PM={", "window.__PM={civQueue:(i,k)=>civQueue(i,k),civNext:()=>civNext(),civCommit:()=>civCommit(),openCard:id=>openCard(CARDS.find(c=>c.id===id)),get CIV(){return CIV},maintState:i=>maintState(i),", 1)
F = []
def ok(n, c, g=None):
    print(("ok   " if c else "FAIL ") + n + ("" if c else "  got: " + json.dumps(g)[:300])); 
    if not c: F.append(n)
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1000, "height": 720}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?env=rural")
    pg.wait_for_function("window.__PM&&__B.first!==null", timeout=300000)
    ev = pg.evaluate
    ev("()=>document.getElementById('v2go').click()"); pg.wait_for_function("!!document.querySelector('#leadOv:not([hidden]) .ldcard')", timeout=120000)
    pk = ev("()=>({focusCard:document.activeElement&&document.activeElement.classList.contains('ldcard'),starts:document.querySelectorAll('#leadOv .ldstart').length,startTxt:(document.querySelector('#leadOv .ldstart')||{}).textContent,sticky:getComputedStyle(document.querySelector('#leadOv .btns')).position})")
    ok("picker: no card focused before a pick; starting meters on all 4; sticky Start", not pk["focusCard"] and pk["starts"] == 4 and pk["sticky"] == "sticky", pk)
    ev("()=>{document.querySelector('#leadOv .ldcard[data-l=chip]').click();document.getElementById('ld-go').click();}")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000); pg.wait_for_timeout(500)
    ev("()=>{__PM.setRunning(false);__PM.S.t=2*1440;const t=document.getElementById('tut');if(t)t.hidden=true;}")
    # bug 5: chips in points
    c = ev("()=>{const S=__PM.S;__PM.trigger('felt');const chips=[...document.querySelectorAll('#civOv .cvc')].map(e=>e.textContent),bill=(document.querySelector('#civOv .cvbill')||{}).textContent,ord=document.querySelector('#civOv .civord').textContent;const m0=S.civ.m.M;document.querySelectorAll('#civOv .civbtn')[0].click();return {chips,bill,ord,dM:S.civ.m.M-m0};}")
    ok("chips show meter points (Machinery +3) and the bar moves the same", "Machinery +3" in c["chips"] and abs(c["dM"] - 3) < 0.01, c)
    ok("repair bill line on the card", bool(c["bill"]) and "already paid" in c["bill"], c)
    # bug 1: free play with a card open
    fr = ev("()=>{const S=__PM.S;S.cards.next=1e12;S.inc=[];__PM.trigger('shaft');const open=!(document.getElementById('civOv')||{hidden:true}).hidden;document.getElementById('v2free').click();return new Promise(r=>setTimeout(()=>{const t0=S.t;setTimeout(()=>r({open,running:__PM.running,card:!(document.getElementById('civOv')||{hidden:true}).hidden,moved:S.t>t0,menu:!document.getElementById('v2menu').hidden}),4000)},300));}")
    ok("free play with a choice card open: card gone, game runs on", fr["open"] and not fr["card"] and fr["moved"], fr)
    b.close()
    # fresh page for the rest
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1000, "height": 720}); pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?env=rural")
    pg.wait_for_function("window.__PM&&__B.first!==null", timeout=300000); ev = pg.evaluate
    ev("()=>document.getElementById('v2go').click()"); pg.wait_for_function("!!document.querySelector('#leadOv:not([hidden]) .ldcard')", timeout=120000)
    ev("()=>{document.querySelector('#leadOv .ldcard[data-l=hank]').click();document.getElementById('ld-go').click();}")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000); pg.wait_for_timeout(500)
    ev("()=>{__PM.setRunning(false);__PM.S.t=2*1440;const t=document.getElementById('tut');if(t)t.hidden=true;}")
    # bug 2: toast waits on sim time; hidden under the menu; cards wait
    t = ev("""()=>{const S=__PM.S;S.civ.orders={Machine:'Q'};__PM.trigger('felt');const pend=!!S.civ.pending,card=!(document.getElementById('civOv')||{hidden:true}).hidden;
      return new Promise(r=>setTimeout(()=>{r({pend,card,still:!!S.civ.pending})},6000));}""")
    ok("standing order waits on sim time (still pending after 6 s paused)", t["pend"] and not t["card"] and t["still"], t)
    m = ev("()=>{document.getElementById('v2pause').click();return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>r({menu:!document.getElementById('v2menu').hidden,toast:!document.getElementById('civToast').hidden}),1500))));}")
    ok("toast hidden while the pause menu is up", m["menu"] and not m["toast"], m)
    ev("()=>document.getElementById('v2go').click()"); pg.wait_for_timeout(500); ev("()=>__PM.setRunning(false)")
    w = ev("()=>{const S=__PM.S;S.cards.next=S.t;__PM.step(0.25);return {deal:!!(S.cards.open&&S.cards.open.c),pend:!!S.civ.pending};}")
    ok("event card waits while a standing order is pending", not w["deal"] and w["pend"], w)
    # bug 3: Change over an open event card queues the card behind it
    ch = ev("""()=>{const S=__PM.S;__PM.openCard('drone');const deal=!document.getElementById('dealOv').hidden;document.getElementById('civ-chg').click();
      const civ=!(document.getElementById('civOv')||{hidden:true}).hidden;document.getElementById('deal-no').click();const civ2=!(document.getElementById('civOv')||{hidden:true}).hidden,run=__PM.running,
      box=document.getElementById('civ-ord')&&document.getElementById('civ-ord').checked,lab=(document.querySelector('#civOv .civord')||{}).textContent;
      document.querySelectorAll('#civOv .civbtn')[0].click();return {deal,civ,civ2,run,box,lab,order:S.civ.orders.Machine};}""")
    ok("Change over an event card: card waits, then opens; box unticked; order kept", ch["deal"] and not ch["civ"] and ch["civ2"] and not ch["run"] and not ch["box"] and ch["order"] == "Q", ch)
    # bug 11: Tab stays in the card
    tb = ev("""()=>{const S=__PM.S;S.inc=[];__PM.trigger('fabric');const ids=[];for(let i=0;i<7;i++){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));const a=document.activeElement;ids.push(!!a.closest('#civOv'));}
      const z=getComputedStyle(document.getElementById('civOv')).zIndex;document.querySelectorAll('#civOv .civbtn')[2].click();return {ids,z};}""")
    ok("Tab stays inside the choice card; card draws under the pause menu", all(tb["ids"]) and int(tb["z"]) < 120, tb)
    # bug 4 + levers in points
    ev("()=>{const S=__PM.S;S.civ.orders={};S.inc=[];S.fx=S.fx.filter(f=>!f.civ);S.outg.noticed=false;S.t=__PM.outStart?__PM.outStart(1)-1430:5*1440+600;}")
    pg.wait_for_timeout(200)
    ev("()=>{const S=__PM.S;for(let i=0;i<40&&!S.outg.noticed;i++){__PM.step(0.25);const o=S.cards.open;if(o&&o.c)document.getElementById('deal-no').click();if(S.civ.cur)document.querySelectorAll('#civOv .civbtn')[0].click();__PM.setRunning(false);}}")
    lv = ev("()=>{const o=document.getElementById('outOv');return {open:!!o&&!o.hidden,segs:[...document.querySelectorAll('#outOv .civplan .seg')].map(s=>s.querySelectorAll('button[aria-pressed=\"true\"]').length),txt:(document.querySelector('#outOv .civplan')||{}).textContent||''}}")
    ok("outage levers: exactly one button pressed in each; text in points", lv["open"] and lv["segs"] == [1, 1, 1] and "Labor +6" in lv["txt"], lv)
    if lv["open"]: ev("()=>document.getElementById('out-ok').click()")
    # bug 6: walkout raise
    wr = ev("()=>{const S=__PM.S;S.cards.open=null;__PM.civQueue('c_walkout','meter');__PM.civNext();document.querySelectorAll('#civOv .civbtn')[0].click();return S.civ.wage;}")
    ok("walkout settlement raises wages 3% for good", abs(wr - 1.03) < 1e-9, wr)
    # bug 7: customer walks broker = one grade, -5
    cw = ev("()=>{const S=__PM.S;__PM.civQueue('c_custwalk','meter');__PM.civNext();document.querySelectorAll('#civOv .civbtn')[1].click();const f=S.fx.find(x=>x.id==='c_custwalk');return f&&f.price;}")
    ok("customer walks B: one grade at −$5/t", cw and len(cw) == 1 and list(cw.values())[0] == -5, cw)
    # bug 8: rush order creates an order
    ro = ev("()=>{const S=__PM.S;S.plan.hot=null;__PM.civQueue('rush','new');__PM.civNext();document.querySelectorAll('#civOv .civbtn')[0].click();return {hot:!!S.plan.hot,q:S.plan.q[0],pend:S.cards.pend.some(p=>p.h==='rush')};}")
    ok("rush order A: 900 t of 33HT queued with a pending outcome", ro["hot"] and ro["q"]["t"] == 900 and ro["pend"], ro)
    # bug 12
    ms = ev("()=>__PM.maintState({id:'felt'})")
    ok("no 'undefined' in the maintenance label", "undefined" not in ms, ms)
    # accents
    ac = ev("()=>{__PM.civQueue('c_protest','meter');__PM.civNext();const c=document.querySelector('#civOv .modal').className;document.querySelectorAll('#civOv .civbtn')[1].click();__PM.civQueue('odor','new');__PM.civNext();const tag=(document.querySelector('#civOv .cvtag')||{}).textContent,ord=(document.querySelector('#civOv .civord')||{}).textContent;document.querySelectorAll('#civOv .civbtn')[0].click();return {c,tag,ord};}")
    ok("crisis card has the red accent; community card reads Invest/Hold/Decline", "cvx" in ac["c"] and ac["tag"] in ("Invest", "Hold", "Decline") and "community upsets" in ac["ord"], ac)
    # popover
    pg.evaluate("()=>{__PM.setRunning(false)}"); pg.wait_for_timeout(400)
    pp = ev("()=>new Promise(r=>{document.querySelector('#civBar .cv[data-k=L]').click();setTimeout(()=>r({open:!document.getElementById('civPop').hidden,txt:document.getElementById('civPop').textContent}),300);})")
    ok("tap a meter: popover with value, band and effects", pp["open"] and "Labor" in pp["txt"] and "Repairs" in pp["txt"], pp)
    ok("no page errors", not errs, errs[:4])
    b.close()
print("FIX CHECK " + ("OK" if not F else "FAILED (%d): %s" % (len(F), "; ".join(F))))
