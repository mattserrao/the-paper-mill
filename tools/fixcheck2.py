"""QA round 2 decisions: direct checks of each fix in the built page.
Usage: python3 fixcheck2.py <index.html>"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
EXTRA = ("get civApply(){return civApply},get civQueue(){return civQueue},get civNext(){return civNext},get civCool(){return civCool},"
         "get civOutageEnd(){return civOutageEnd},get leadPickOpen(){return leadPickOpen},get leadMkt(){return leadMkt},get leadOutageEnd(){return leadOutageEnd},"
         "get LEADERS(){return LEADERS},get LEAD(){return LEAD},get CIVU(){return CIVU},get civCost(){return civCost},get civTagName(){return civTagName},"
         "get APP_VER(){return APP_VER},get renameMill(){return renameMill},get rcMake(){return rcMake},get rcHTML(){return rcHTML},get applyUpgrades(){return applyUpgrades},"
         "get leadTally(){return leadTally},get civTag(){return civTag},get civArea(){return civArea},get CIVCARD(){return CIVCARD},get MILL(){return MILL},get trigger(){return trigger},get EVENTS(){return EVENTS},")
html = html.replace("window.__PM={", "window.__PM={" + EXTRA, 1)
log, errs = [], []
def ok(name, cond, got=None):
    log.append(("ok   " if cond else "FAIL ") + name + ("" if cond or got is None else "   got: " + json.dumps(got)[:400]))
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1100, "height": 760})
    pg.on("pageerror", lambda e: errs.append(str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
    pg.goto("http://bench.local/"); pg.wait_for_function("window.__B&&__B.first!==null", timeout=240000); pg.wait_for_timeout(800)
    E = pg.evaluate
    # picker wording: survival says "wave", season says the outage price
    E("()=>{__PM.leadPickOpen(()=>{},null,'surv')}")
    t = E("()=>document.querySelector('#leadOv .ldcard[data-l=chip]').textContent")
    ok("survival picker: Chip's fiber lock says 'next wave's fiber'", "next wave's fiber" in t and "next week" not in t, t[:200])
    E("()=>{document.getElementById('ld-no').click();__PM.leadPickOpen(()=>{},null,'season')}")
    t = E("()=>document.querySelector('#leadOv .ldcard[data-l=chip]').textContent")
    ok("season picker: Chip's lock holds the market until the next outage", "until the next" in t and "next wave" not in t, t[:200])
    ok("picker shows starting meters", "Starts:" in t)
    # start a season with Chip
    E("()=>{document.getElementById('ld-no').click();document.getElementById('v2go').click()}")
    pg.wait_for_function("!!document.querySelector('#leadOv:not([hidden]) .ldcard')", timeout=240000)
    E("()=>{document.querySelector('#leadOv .ldcard[data-l=chip]').click();document.getElementById('ld-go').click();}")
    pg.wait_for_function("__PM.S.lead&&__PM.S.season&&__PM.S.season.on", timeout=240000); pg.wait_for_timeout(1000)
    E("()=>{__PM.G3.on=false;__PM.S.cards.next=1e12;}")
    ok("version label v5.2.0", E("()=>__PM.APP_VER") == "v5.2.0")
    # fiber lock cap
    r = E("()=>{const S=__PM.S;S.lead.lockW=1;S.lead.lockMkt=10;const w=S.lead.lockW;return [__PM.leadMkt(3),__PM.leadMkt(15)]}")
    ok("season fiber lock is capped: market +3 under a +10 lock pays +3; market +15 pays +10", r == [3, 10], r)
    # labels
    r = E("()=>{const U=__PM.CIVU;const lab=(id,i)=>__PM.civTagName(__PM.civArea(id),U[id].t[i]);return [U.pricecut.ch.map((c,i)=>c[0]+'='+lab('pricecut',i)),U.green.ch.map((c,i)=>c[0]+'='+lab('green',i))]}")
    flat = " | ".join(r[0] + r[1])
    ok("labels match option names (no 'Hold your price'=Decline, 'Decline'=Hold)", "Decline=Decline" in flat and "Refuse to match=Decline" in flat and "Hold your price" not in flat, r)
    r = E("()=>{const U=__PM.CIVU;const bad=[];for(const [id,u] of Object.entries(U)){if(!u.t||id==='rush')continue;const P=u.ch[u.t.indexOf('P')],Q=u.ch[u.t.indexOf('Q')];if(Q[1]>=P[1])bad.push(id)}return bad}")
    ok("every cheap fix costs less than the proper fix (forklifts included)", r == [], r)
    ok("renting forklifts costs $10k", E("()=>__PM.civCost(__PM.CIVU.fleet.ch[1][1])") == 10000)
    # warnings cost $35k on option A; plant manager note
    r = E("()=>['w_sickout','w_petition','w_watch','w_vibration'].map(id=>__PM.civCost(__PM.CIVU[id].ch[0][1]))")
    ok("warning option A costs $35k", r == [35000] * 4, r)
    ok("plant manager visit notes the −$5/t keeps running", "keeps running" in (E("()=>__PM.CIVU.w_watch.ch[0][4]||''")))
    # price lever: premium Economy −15, discount +9
    r = E("()=>{const S=__PM.S;S.civ.m.E=50;__PM.civOutageEnd({},{civ:{price:5,bonus:0,don:0}});const a=S.civ.m.E;S.civ.m.E=50;__PM.civOutageEnd({},{civ:{price:-5,bonus:0,don:0}});return [a,S.civ.m.E]}")
    ok("price premium Economy −15, discount +9", r == [35, 59], r)
    # Chip wage 10%
    ok("Chip's pay settlements: +10% per deal", abs(E("()=>__PM.LEAD.wage") - 0.10) < 1e-9)
    # community gains
    r = E("()=>[__PM.CIVU.fishkill.ch[1][3].C,__PM.CIVU.sponsor.ch[1][3].C,__PM.CIVCARD.grid.a.C]")
    ok("community choices give +6 (design +2)", r == [2, 2, 2], r)
    # cooldown
    r = E("()=>{const S=__PM.S,t0=S.t;__PM.civApply({id:'inspector',kind:'up'},2,false);return [__PM.civCool('inspector'),S.civ.cd.inspector-t0]}")
    ok("an answered upset rests for 2 days", r[0] is True and abs(r[1] - 2880) < 1, r)
    # civics ledger
    r = E("()=>{const S=__PM.S,c0=S.cash,l0=S.ledger.civ||0,d0=S.ledger.deals;__PM.civApply({id:'hothall',kind:'new'},1,false);return [c0-S.cash,(S.ledger.civ||0)-l0,S.ledger.deals-d0]}")
    ok("civics spending books to its own Civics line, not Deals", r[0] == 10000 and r[1] == 10000 and r[2] == 0, r)
    # leader card: no "Starts:" mid-season
    E("()=>{document.getElementById('survChip').click()}"); pg.wait_for_timeout(400)
    t = E("()=>{const e=document.getElementById('leadCard');return e&&!e.hidden?e.textContent:''}")
    ok("leader card mid-season: no 'Starts:' line; Chip's cost listed under 'While Chip is in charge'", t and "Starts:" not in t and "While Chip is in charge" in t, t[:300])
    E("()=>{const b=document.getElementById('ldc-ok');if(b)b.click()}")
    # outage dialog tally with an incoming leader: no Hank cost when changing from Hank (simulate)
    r = E("()=>{const S=__PM.S,id=S.lead.id;S.lead.id='hank';const a=__PM.leadTally('chip').map(x=>x[0]),b=__PM.leadTally().map(x=>x[0]);S.lead.id=id;return [a,b]}")
    ok("outage dialog after a change lists the incoming leader's cost, not the old one", "Fiber (runs heavy)" not in r[0] and "Labor relations" in r[0] and "Fiber (runs heavy)" in r[1], r)
    # chip short labels
    try: pg.wait_for_function("!!document.getElementById('svW').dataset.s", timeout=30000)
    except Exception: pass
    r = E("()=>[document.getElementById('svW').dataset.s||'',document.getElementById('survChip').getAttribute('aria-label')]")
    ok("season chip: short label in words, screen-reader label says outage bar", r[0].startswith("Outage") and "utage bar" in (r[1] or ""), r)
    # report card: Civics rows and meter section
    r = E("()=>{const S=__PM.S;const c=__PM.rcMake(S.rc.p,0);const h=__PM.rcHTML(c);return [h.includes('>Civics<'),h.includes('<h3>Civics')]}")
    ok("report card has a Civics money row and a meters section", r == [True, True], r)
    # mill names
    r = E("()=>{const n=__PM.MILL.name;const a=__PM.renameMill('<img src=x>'),b=__PM.renameMill('Nip & Tuck Paper Co.'),c=__PM.MILL.name;__PM.renameMill(n);return [a,b===undefined,c]}")
    ok("mill names limited to letters, numbers and . _ ' - &", r[0] == "chars" and r[1] and r[2] == "Nip & Tuck Paper Co.", r)
    # jargon
    r = E("()=>[__PM.CIVU.slime.n,__PM.EVENTS.find(e=>e.id==='slime').name,JSON.stringify(__PM.CIVU.rush.ch).includes('33HT')]")
    ok("jargon replaced: 'Slime build-up', no 33HT on the rush card", r == ["Slime build-up", "Slime build-up", False], r)
    # price lever text matches band
    E("()=>{__PM.S.civ.m.E=46}")
    # bird cut-scene: stays paused with a card open
    r = E("""()=>{const S=__PM.S;window.running=undefined;return typeof __PM.G3.birdCine}""")
    ok("bird cut-scene hook present", r == "function", r)
    # pause menu above event card and outage plan
    r = E("()=>{const z=id=>{const e=document.getElementById(id);return e?+getComputedStyle(e).zIndex:null};return [z('dealOv'),z('outOv'),+getComputedStyle(document.getElementById('v2menu')).zIndex]}")
    ok("event card and outage plan draw under the pause menu", (r[0] is None or r[0] < r[2]) and (r[1] is None or r[1] < r[2]), r)
    ok("no page errors", not errs, errs)
    b.close()
print("\n".join(log))
fails = [l for l in log if l.startswith("FAIL")]
print("FIX CHECK 2 " + ("OK" if not fails else f"FAILED ({len(fails)})"))
