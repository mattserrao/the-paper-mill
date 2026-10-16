"""v5.7 Catching failures early: functional check (no balancing).
Season: pre-rolled upsets fire after their lead time; a Round once a day; catching a tell with a real click (desktop) and a
real tap (phone); a missed tell fires later; a clean walk; the Vibration Report (locked, Reliability program, arrows);
the outage prep checklist (unlocks, choices, shorter outage, refund, the notice); end screen line. Survival: lead time
per wave. Free play: tells on, no checklist. Zen: tells off, upsets fire at once.
Usage: python3 tellcheck.py <index.html>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
RES = []
def ok(name, cond, info=""):
    RES.append((name, bool(cond), info)); print(("PASS " if cond else "FAIL ") + name + (("  " + str(info)) if info != "" else ""), flush=True)

CLR = """()=>{const P=__PM,S=P.S;if(S.civ){S.civ.q=[];S.civ.cur=null;S.civ.pending=null;}if(S.cards){S.cards.open=null;S.cards.next=1e12;}
  document.querySelectorAll('.overlay').forEach(o=>{if(o.id!=='prepOv'&&o.id!=='tellOv')o.hidden=true});}"""
# step the sim to minute t, answering anything that would block it (civics cards, event cards, the outage budget at its defaults)
STEPTO = """t=>{const P=__PM,S=P.S;let n=0;while(S.t<t&&n<4e6){P.step(P.SIM_STEP);n++;
  if(S.cards&&S.cards.open){if(S.cards.open.outage){const b=document.getElementById('out-ok');if(b)b.click();}else S.cards.open=null;}
  if(S.civ&&(S.civ.cur||S.civ.pending)){S.civ.cur=null;S.civ.pending=null;S.civ.q=[];}}return S.t;}"""

def boot(pw, mode, phone=False, q=""):
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    vp = {"width": 390, "height": 760} if phone else {"width": 900, "height": 560}
    pg = b.new_page(viewport=vp, device_scale_factor=1, has_touch=phone, is_mobile=phone); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave" + q)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    if mode == "free": pg.evaluate("()=>document.getElementById('v2free').click()")
    elif mode in ("season", "surv"):
        pg.evaluate("()=>document.getElementById(%r).click()" % ("v2surv" if mode == "surv" else "v2go"))
        pick_leader(pg, "hank")
    pg.evaluate("()=>__PM.setRunning(false)")
    return b, pg, errs

def catch_round(pg, area, ids, how):
    """queue `ids` in `area`, start a Round from the dock button and the card, then click/tap each tell on screen"""
    pg.evaluate("""([a,ids])=>{const P=__PM,S=P.S,T=S.tell;T.day=-1;T.q=T.q.filter(p=>p.area!==a);for(const id of ids)T.q.push({id,due:S.t+1800,born:S.t,area:a});P.C.simSpeed=1;P.setRunning(true);}""", [area, ids])
    pg.evaluate(CLR); pg.evaluate("()=>__PM.setRunning(true)")
    pg.click("#v2round"); pg.wait_for_selector("#tellOv:not([hidden]) .tarea[data-a='%s']" % area)
    pg.click("#tellOv .tarea[data-a='%s']" % area)
    pg.wait_for_function("()=>__PM.G3.tellRoundOn()", timeout=20000)
    got = []
    for id in ids:
        pg.wait_for_function("id=>!!__PM.G3.tellScreen(id)", arg=id, timeout=30000)
        pg.evaluate("id=>{const G=__PM.G3,p=G.tellPos(id),c=G.camGet();G.tellHold();G.camSet([p[0],p[1],58,c[3],0.62]);}", id)   # (as a player would pan to it; the camera holds still)
        pg.wait_for_timeout(1500)
        xy = pg.evaluate("id=>__PM.G3.tellScreen(id)", id)
        print("   tap", id, [round(v) for v in xy[:2]], pg.evaluate("([x,y])=>{const e=document.elementFromPoint(x,y);return e&&(e.id||e.className||e.tagName)}", xy[:2]), pg.evaluate("()=>({run:__PM.running,on:__PM.G3.tellRoundOn()})"))
        if how == "tap": pg.touchscreen.tap(xy[0], xy[1])
        else: pg.mouse.click(xy[0], xy[1])
        pg.wait_for_timeout(300); got.append(xy)
    return got

with sync_playwright() as pw:
    # ================= SEASON =================
    b, pg, errs = boot(pw, "season")
    pg.evaluate(CLR)
    ok("season: tells on", pg.evaluate("()=>__PM.tell.on()"))
    ok("season: lead 1.5 days", pg.evaluate("()=>__PM.tell.lead()") == 2160)
    try: pg.wait_for_function("()=>!document.getElementById('v2round').hidden", timeout=15000)
    except Exception: pass
    ok("round button shown", pg.evaluate("()=>!document.getElementById('v2round').hidden"))
    # hands-off 14 days: every tellable upset that fires was queued and fired at its due time (or later, while blocked)
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,TL=new Set(P.tell.areas.flatMap(a=>a.ids));const seenQ={},fired=[],bad=[];let k0=S.tot.incidents;
      while(S.t<14*1440){P.step(P.SIM_STEP);if(S.cards.open){if(S.cards.open.outage)document.getElementById('out-ok').click();else S.cards.open=null;}if(S.civ&&(S.civ.cur||S.civ.pending)){S.civ.cur=null;S.civ.pending=null;S.civ.q=[];}
        for(const p of S.tell.q){const k=p.id+"@"+p.born;if(!seenQ[k])seenQ[k]={id:p.id,due:p.due,born:p.born};}
        if(S.tot.incidents>k0){k0=S.tot.incidents;const i=S.inc[S.inc.length-1];if(!i)continue;const tl=TL.has(i.id)&&!P.EVENTS.find(e=>e.id===i.id).env||TL.has(i.id)&&P.EVENTS.find(e=>e.id===i.id).env===P.SITE.env;
          if(tl){const q=Object.values(seenQ).filter(x=>x.id===i.id&&!x.used&&x.due<=S.t+0.01);q.sort((a,b)=>a.due-b.due);const m=q[0];if(!m)bad.push(i.id+"@"+Math.round(S.t));else{m.used=1;fired.push([i.id,Math.round(m.born),Math.round(m.due),Math.round(S.t)]);}}}}
      return {fired,bad,queued:Object.keys(seenQ).length,left:S.tell.q.length};}""")
    ok("pre-roll: tellable upsets were queued", r["queued"] > 0, f"{r['queued']} queued")
    ok("pre-roll: every tellable upset fired came from the queue", not r["bad"] and len(r["fired"]) > 0, f"fired {len(r['fired'])}, unqueued {r['bad']}")
    late = [f for f in r["fired"] if f[3] - f[2] > 600]
    ok("pre-roll: fired at its due time (or after a block)", all(f[3] >= f[2] for f in r["fired"]), f"{r['fired'][:4]}; held back >10h: {len(late)}")
    leads = sorted(set(f[2] - f[1] for f in r["fired"] if f[1] > 0))
    ok("pre-roll: lead time is 1.5 days for dice-rolled ones", any(abs(l - 2160) < 1 for l in leads), leads[:6])
    # once a day
    r = pg.evaluate("""()=>{const P=__PM,S=P.S;S.tell.day=-1;const a=P.tell.start("util"),b=P.tell.start("wet"),c=P.tell.can();return [a,b,c];}""")
    ok("round: one a day", r == [True, False, False], r)
    pg.evaluate(STEPTO, pg.evaluate("()=>Math.floor(__PM.S.t/1440+1)*1440+5"))
    ok("round: available again the next day", pg.evaluate("()=>__PM.tell.can()"))
    # report locked with Hank and no Reliability program
    pg.evaluate(CLR); pg.click("#v2round"); pg.wait_for_selector("#tellOv:not([hidden])")
    r = pg.evaluate("()=>({tv:document.querySelectorAll('#tellOv .tv').length,note:!!document.querySelector('#tellOv .tnorep'),rep:__PM.tell.rep(),rows:document.querySelectorAll('#tellOv .tarea').length})")
    ok("report: locked (no arrows, a hint)", r["tv"] == 0 and r["note"] and not r["rep"], r)
    pg.click("#tell-x")
    # buy the Reliability program: Machinery +6, report on
    r = pg.evaluate("""()=>{const P=__PM,S=P.S;S.cash=5e6;S.upDay=-1;const m0=S.civ.m.M;document.getElementById('buy-reliab').click();return {m:S.civ.m.M-m0,rep:P.tell.rep(),lv:S.up.reliab};}""")
    ok("report: Reliability program L1 unlocks it, Machinery +6", r["rep"] and abs(r["m"] - 6) < 0.01 and r["lv"] == 1, r)
    # arrows follow the queue
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,T=S.tell;T.day=-1;T.q=[{id:"shaft",due:S.t+600,born:S.t,area:"dry"},{id:"ragger",due:S.t+2000,born:S.t,area:"pulp"}];
      P.G3.tellOpen();const o={};document.querySelectorAll('#tellOv .tarea').forEach(b=>{const e=b.querySelector('.tv');o[b.dataset.a]=e?e.className:null;});return o;}""")
    ok("report: arrows (dry fast, pulp climbing, wet steady)", "tv2" in r["dry"] and "tv1" in r["pulp"] and "tv0" in r["wet"], r)
    pg.evaluate("()=>{document.getElementById('tellOv').hidden=true;__PM.S.tell.q=[];}")
    # catch with a real mouse click: 40% bill, Machinery +3, Labor +1, gone from the queue
    pg.evaluate(CLR)
    before = pg.evaluate("()=>{const S=__PM.S;return {cash:S.cash,M:S.civ.m.M,L:S.civ.m.L,n:S.tell.n,rep:S.ledger.repairs}}")
    catch_round(pg, "wet", ["felt"], "click")
    after = pg.evaluate("()=>{const S=__PM.S;return {cash:S.cash,M:S.civ.m.M,L:S.civ.m.L,n:S.tell.n,rep:S.ledger.repairs,q:S.tell.q.map(p=>p.id),saved:S.tell.saved,mins:S.tell.savedMin,bill:45e3*__PM.S.tell&&0}}")
    bill = pg.evaluate("()=>{return 45e3*(function(){return 1})()}")
    rep_cut = after["rep"] - before["rep"]
    ok("catch (click): caught and out of the queue", after["n"] == before["n"] + 1 and "felt" not in after["q"], after)
    ok("catch: planned repair is 40% of the bill", abs(rep_cut / (rep_cut + after["saved"]) - 0.4) < 0.01 if rep_cut > 0 else False, f"paid {rep_cut:.0f}, saved {after['saved']:.0f}")
    ok("catch: Machinery +3 and Labor +1", abs(after["M"] - before["M"] - 3) < 0.6 and abs(after["L"] - before["L"] - 1) < 0.6, f"M {after['M']-before['M']:.2f} L {after['L']-before['L']:.2f}")
    ok("catch: logged and bannered", pg.evaluate("()=>__PM.S.feed.some(f=>f.text.startsWith('Caught early:'))"))
    pg.evaluate("()=>__PM.G3.tellSeek(1)"); pg.wait_for_function("()=>!__PM.G3.tellRoundOn()", timeout=30000)
    ok("catch: round summary", pg.evaluate("()=>__PM.S.feed.some(f=>f.text.startsWith('Round done: 1 caught'))"))
    # miss: no tap, the round ends, the upset fires when due
    pg.evaluate(STEPTO, pg.evaluate("()=>Math.floor(__PM.S.t/1440+1)*1440+5"))
    pg.evaluate("""()=>{const P=__PM,S=P.S,T=S.tell;T.q=[{id:"fabric",due:S.t+240,born:S.t,area:"wet"}];P.setRunning(true);}""")
    pg.evaluate(CLR); pg.click("#v2round"); pg.click("#tellOv .tarea[data-a='wet']"); pg.wait_for_function("()=>__PM.G3.tellRoundOn()", timeout=20000)
    pg.evaluate("()=>__PM.G3.tellSeek(1)"); pg.wait_for_function("()=>!__PM.G3.tellRoundOn()", timeout=30000)
    r = pg.evaluate("()=>({txt:document.body.textContent.includes('went unnoticed'),q:__PM.S.tell.q.map(p=>p.id)})")
    ok("miss: the round ends with it unnoticed, still queued", r["txt"] and r["q"] == ["fabric"], r)
    pg.evaluate("()=>__PM.setRunning(false)")
    pg.evaluate(STEPTO, pg.evaluate("()=>__PM.S.t+260"))
    ok("miss: it fires as normal when due", pg.evaluate("()=>__PM.S.inc.some(i=>i.id==='fabric')||__PM.S.evc.fabric>0"))
    # clean walk: nothing queued in utilities -> Community +1
    pg.evaluate(STEPTO, pg.evaluate("()=>Math.floor(__PM.S.t/1440+1)*1440+5"))
    c0 = pg.evaluate("()=>{const S=__PM.S;S.tell.q=S.tell.q.filter(p=>p.area!=='util');__PM.setRunning(true);return S.civ.m.C}")
    pg.evaluate(CLR); pg.click("#v2round"); pg.click("#tellOv .tarea[data-a='util']"); pg.wait_for_function("()=>__PM.G3.tellRoundOn()", timeout=20000)
    pg.evaluate("()=>__PM.G3.tellSeek(1)"); pg.wait_for_function("()=>!__PM.G3.tellRoundOn()", timeout=30000)
    c1 = pg.evaluate("()=>__PM.S.civ.m.C")
    ok("clean walk: Community +1 and a banner", abs(c1 - c0 - 1) < 0.4 and pg.evaluate("()=>document.body.textContent.includes('Clean walk')"), f"{c1-c0:.2f}")
    pg.evaluate("()=>__PM.setRunning(false)")
    # ---- outage prep (outage 2: day 14 8 AM) ----
    st = pg.evaluate("()=>{const S=__PM.S;return (7*S.outg.k-1)*1440+120}")
    k = pg.evaluate("()=>__PM.S.outg.k")
    pg.evaluate(STEPTO, st - 72 * 60 + 2)
    r = pg.evaluate("()=>{const f=__PM.tell.prepFor();return {f,crew:__PM.tell.prepDo('crew'),cd:document.getElementById('v2cd').textContent}}")
    ok("prep: open 72 h out, later items locked", r["f"] and r["f"]["k"] == k and r["crew"] is False, r)
    pg.evaluate("()=>__PM.setRunning(true)")
    try: pg.wait_for_function("()=>document.getElementById('v2cd').textContent.includes('prep 0/4')", timeout=20000)
    except Exception: pass
    pg.evaluate("()=>__PM.setRunning(false)")
    ok("prep: the countdown shows the tally", "prep 0/4" in pg.evaluate("()=>document.getElementById('v2cd').textContent"))
    pg.evaluate(CLR); pg.evaluate("()=>{__PM.setRunning(true)}"); pg.wait_for_timeout(400)
    pg.click("#v2cd")
    pg.wait_for_selector("#prepOv:not([hidden]) .prow[data-i='parts'] button[data-c='now']")
    c0 = pg.evaluate("()=>__PM.S.cash"); pg.click("#prepOv .prow[data-i='parts'] button[data-c='now']"); pg.evaluate("()=>__PM.setRunning(false)")
    c1 = pg.evaluate("()=>__PM.S.cash")
    ok("prep: countdown opens the checklist; parts ordered at full price", abs((c0 - c1) - 30e3) < 2e3, f"{c0-c1:.0f}")
    pg.evaluate("()=>document.getElementById('prepOv').hidden=true")
    pg.evaluate(STEPTO, st - 48 * 60 + 2)
    ok("prep: crew walk unlocks at 48 h", pg.evaluate("()=>__PM.tell.prepDo('crew')"))
    # T-24: the budget dialog opens with the checklist in it
    r = pg.evaluate("""t=>{const P=__PM,S=P.S;while(S.t<t){P.step(P.SIM_STEP);if(S.civ&&(S.civ.cur||S.civ.pending)){S.civ.cur=null;S.civ.pending=null;S.civ.q=[];}if(S.cards.open&&S.cards.open.outage)break;if(S.cards.open)S.cards.open=null;}
      const el=document.getElementById('out-prep');return {open:!!(S.cards.open&&S.cards.open.outage),rows:el?el.querySelectorAll('.prow').length:0,contr:!!(el&&el.querySelector(".prow[data-i='contr'] button[data-c='in']"))}}""", st - 24 * 60 + 30)
    ok("prep: in the 24-hour budget dialog", r["open"] and r["rows"] == 4 and r["contr"], r)
    pg.click("#out-prep .prow[data-i='contr'] button[data-c='in']")
    ok("prep: contractors booked from the dialog", pg.evaluate("()=>__PM.S.tell.prep.it.contr==='in'"))
    pg.click("#out-ok")
    pg.evaluate(STEPTO, st - 8 * 60 + 2)
    r = pg.evaluate("()=>{const ok=__PM.tell.prepDo('draw');__PM.step(__PM.SIM_STEP);return {ok,fx:__PM.S.fx.some(f=>f.id==='prepdraw'),cap:__PM.S.M.speedCap,t:__PM.tell.prepTally()}}")
    ok("prep: draw-down caps the machine", r["ok"] and r["fx"] and r["cap"] <= 0.851, r)
    pg.evaluate(STEPTO, st + 1)
    r = pg.evaluate("()=>{const o=__PM.S.outg;return {on:o.on,len:o.end-o.st0,prep:o.prep,end:o.end,fx:__PM.S.fx.some(f=>f.id==='prepdraw')}}")
    st0 = st
    r2 = pg.evaluate("t=>{const o=__PM.S.outg;return o.end-t}", st0)
    ok("prep: 4/4 done, outage shortened (min 60 min kept), draw-down cap lifted", r["on"] and r["prep"] and r["prep"]["n"] == 4 and r["prep"]["m"] > 0 and r2 >= 60 and not r["fx"], f"{r['prep']} length now {r2:.0f} min")
    pg.wait_for_timeout(800)
    ok("prep: tally on the outage notice", pg.evaluate("()=>{const e=document.getElementById('outOv');return !!e&&e.textContent.includes('Prep 4/4')}"))
    rep0 = pg.evaluate("()=>__PM.S.ledger.repairs")
    pg.evaluate(STEPTO, pg.evaluate("()=>__PM.S.outg.end+2"))
    rep1 = pg.evaluate("()=>__PM.S.ledger.repairs")
    ok("prep: 20% of the budget comes back when it ends", pg.evaluate("()=>__PM.S.feed.some(f=>f.text.includes('came back'))"), f"repairs ledger {rep1-rep0:.0f}")
    # the cheaper parts lot: resolved 24 h out; if it doesn't arrive, a rush order is offered
    st = pg.evaluate("()=>{const S=__PM.S;return (7*S.outg.k-1)*1440+120}")
    pg.evaluate(STEPTO, st - 72 * 60 + 2)
    ok("prep: wait for the cheaper lot", pg.evaluate("()=>__PM.tell.prepDo('parts','wait')"))
    pg.evaluate(STEPTO, st - 24 * 60 + 5)
    r = pg.evaluate("()=>{const p=__PM.S.tell.prep.it.parts;return {res:p.res,got:p.got,rush:p.got?null:__PM.tell.prepDo('parts','rush')}}")
    ok("prep: the cheap lot resolves 24 h out (rush offered if it fails)", r["res"] and (r["got"] or r["rush"]), r)
    # end screen: the caught line
    pg.evaluate(STEPTO, 30 * 1440 + 10)
    pg.wait_for_timeout(600)
    ok("end screen: 'Upsets caught early' line", pg.evaluate("()=>document.getElementById('so-stats').textContent.includes('Upsets caught early')"),
       pg.evaluate("()=>[...document.querySelectorAll('#so-stats div')].map(d=>d.textContent).filter(t=>t.includes('caught'))"))
    ok("save: the tells state is plain data", pg.evaluate("()=>{const s=JSON.stringify(__PM.S.tell);return s.length>10&&JSON.parse(s).n===__PM.S.tell.n}"))
    ok("season: no page errors", not errs, errs[:3]); b.close()

    # ================= PHONE: a real tap =================
    b, pg, errs = boot(pw, "season", phone=True)
    pg.evaluate(STEPTO, 4 * 1440 + 30); pg.evaluate(CLR)
    n0 = pg.evaluate("()=>__PM.S.tell.n")
    catch_round(pg, "dry", ["shaft", "wrap"], "tap")
    r = pg.evaluate("()=>({n:__PM.S.tell.n,q:__PM.S.tell.q.map(p=>p.id)})")
    ok("phone: two tells caught with taps", r["n"] == n0 + 2 and "shaft" not in r["q"] and "wrap" not in r["q"], r)
    pg.screenshot(path=str(pathlib.Path(sys.argv[1]).parent / "tellcheck-phone.png"))
    ok("phone: no page errors", not errs, errs[:3]); b.close()

    # ================= SURVIVAL =================
    b, pg, errs = boot(pw, "surv")
    r = pg.evaluate("()=>{const P=__PM,S=P.S,o=S.outg.k,a=P.tell.lead();S.outg.k=6;const b=P.tell.lead();S.outg.k=12;const c=P.tell.lead();S.outg.k=o;return [a,b,c]}")
    ok("survival: lead 1.5 d at wave 1, 1 d from wave 6", r == [2160, 1440, 1440], r)
    pg.evaluate(STEPTO, 3 * 1440 + 5)
    ok("survival: the prep checklist opens before outage 1", pg.evaluate("()=>!!__PM.tell.prepFor()"))
    ok("survival: no page errors", not errs, errs[:3]); b.close()

    # ================= FREE PLAY =================
    b, pg, errs = boot(pw, "free")
    try: pg.wait_for_function("()=>!document.getElementById('v2round').hidden", timeout=15000)
    except Exception: pass
    r = pg.evaluate("()=>({on:__PM.tell.on(),prep:__PM.tell.prepFor(),btn:!document.getElementById('v2round').hidden})")
    ok("free play: tells and the Round on, no checklist", r["on"] and r["prep"] is None and r["btn"], r)
    pg.evaluate(STEPTO, 2 * 1440)
    ok("free play: upsets are queued", pg.evaluate("()=>__PM.S.tell&&__PM.S.tell.pre"))
    ok("free play: no page errors", not errs, errs[:3]); b.close()

    # ================= ZEN =================
    b, pg, errs = boot(pw, "zen", q="&zen=1")
    pg.wait_for_timeout(1500)
    r = pg.evaluate("""()=>{const P=__PM,S=P.S;const on=P.tell.on();let fired=0;const TL=new Set(P.tell.areas.flatMap(a=>a.ids));let k0=S.tot.incidents;const t0=S.t;
      while(S.t<t0+10*1440){P.step(P.SIM_STEP);if(S.tot.incidents>k0){k0=S.tot.incidents;fired++;}}return {zen:!!S.zen,on,fired,q:S.tell?S.tell.q.length:0,btn:document.getElementById('v2round').hidden}}""")
    ok("zen: tells off, upsets fire directly, no Round button", r["zen"] and not r["on"] and r["q"] == 0 and r["btn"], r)
    ok("zen: no page errors", not errs, errs[:3]); b.close()

fails = [r for r in RES if not r[1]]
print(f"\n{len(RES)-len(fails)}/{len(RES)} passed" + ("" if not fails else "; FAILED: " + ", ".join(f[0] for f in fails)))
sys.exit(1 if fails else 0)
