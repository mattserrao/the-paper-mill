"""Regression checks for fixes from QA rounds and the v4 repair/pricing work, each checked directly in the built page.
Replaces tools/fixcheck.py (v5.1 QA fixes), tools/fixcheck2.py (QA round 2 decisions) and tools/econfix.py (v4/v16
repair and pricing fixes, which only printed).

  qa1_civics   (fixcheck, first page) leader picker (no card focused, starting meters on all 4, sticky Start); civics
               chips in meter points and the bar moving the same; repair bill line; free play with a choice card open
  qa1_cards    (fixcheck, second page) standing orders wait on sim time; toast hidden under the pause menu; event cards
               wait behind a pending order; Change over an event card; Tab stays in the choice card; outage levers in
               points; walkout raise; customer walks; rush order; maintenance label; card accents; meter popover
  qa2          (fixcheck2) picker wording (survival vs season); version label = APP_VER; fiber lock cap; option labels;
               cheap fix < proper fix; prices of forklifts and warnings; price lever; Chip's wage; community gains;
               upset cooldown; Civics ledger line; leader card mid-season; outage dialog tally; season chip labels;
               report card Civics rows; mill-name characters; jargon; bird cut-scene hook; overlay stacking
  econ         (econfix) 1 repair deadlock: a winder breakdown then a felt change with one maintenance pair both clear
               and the machine and winder run again; 2 the same seeded two days with the 3D view marked on and off give
               the same cash, upsets and breaks; 3 rolls made as 34Super ship at the 34Super price after the machine
               switched to 24

Dropped: fixcheck2 "version label v5.4.2" (dated: replaced by the APP_VER check above) and fixcheck2 "picker shows
starting meters" (qa1_civics checks the starting meters on all four cards). Each old "no page errors" is C.done's
page-error check. econfix 3 printed a revenue of $14 on v6.10.1 and asserted nothing: since v6.6 a truck docks only with
an order (05b), so its hand-docked empty truck never loaded; it now books a 34Super order and checks that truck's invoice.
Usage: python3 regressions.py [index.html]"""
# tier: default
import sys, os, re, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log

def built_ver():
    p = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else os.environ.get("PM_HTML") or str(HERE.parent / "index.html")
    m = re.search(r'const APP_VER="([^"]+)"', pathlib.Path(p).read_text()); return m.group(1) if m else None
APP_VER = built_ver()   # read from the built page, not hard-coded

# ---------------------------------------------------------------- qa1 (tools/fixcheck.py)
FX1 = "window.__PM={civQueue:(i,k)=>civQueue(i,k),civNext:()=>civNext(),civCommit:()=>civCommit(),openCard:id=>openCard(CARDS.find(c=>c.id===id)),get CIV(){return CIV},maintState:i=>maintState(i),"
QF = "env=rural&nobf&" + LITE

def qa1_civics(pw):
    C.sec("qa1_civics")
    html = html_arg().replace("window.__PM={", FX1, 1)
    b = launch(pw); pg = open_game(b, html, QF, viewport=(1000, 720), errs=errs, wait=False)
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
    fr = ev("()=>{const S=__PM.S;S.cards.next=1e12;S.inc=[];__PM.trigger('shaft');const open=!!(S.cards.open&&S.cards.open.civ);   /* (v6.9.2: the card itself shows after the camera pull) */document.getElementById('v2free').click();return new Promise(r=>setTimeout(()=>{const t0=S.t;setTimeout(()=>r({open,running:__PM.running,card:!(document.getElementById('civOv')||{hidden:true}).hidden,moved:S.t>t0,menu:!document.getElementById('v2menu').hidden}),4000)},300));}")
    ok("free play with a choice card open: card gone, game runs on", fr["open"] and not fr["card"] and fr["moved"], fr)
    b.close()

def qa1_cards(pw):
    C.sec("qa1_cards")
    html = html_arg().replace("window.__PM={", FX1, 1)
    b = launch(pw); pg = open_game(b, html, QF, viewport=(1000, 720), errs=errs, wait=False)
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
    ok("rush order A: 900 t of 34Super queued with a pending outcome", ro["hot"] and ro["q"]["t"] == 900 and ro["pend"], ro)
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
    b.close()

# ---------------------------------------------------------------- qa2 (tools/fixcheck2.py)
FX2 = ("get civApply(){return civApply},get civQueue(){return civQueue},get civNext(){return civNext},get civCool(){return civCool},"
       "get civOutageEnd(){return civOutageEnd},get leadPickOpen(){return leadPickOpen},get leadMkt(){return leadMkt},get leadOutageEnd(){return leadOutageEnd},"
       "get LEADERS(){return LEADERS},get LEAD(){return LEAD},get CIVU(){return CIVU},get civCost(){return civCost},get civTagName(){return civTagName},"
       "get APP_VER(){return APP_VER},get renameMill(){return renameMill},get rcMake(){return rcMake},get rcHTML(){return rcHTML},get applyUpgrades(){return applyUpgrades},"
       "get leadTally(){return leadTally},get civTag(){return civTag},get civArea(){return civArea},get CIVCARD(){return CIVCARD},get MILL(){return MILL},get trigger(){return trigger},get EVENTS(){return EVENTS},")

def qa2(pw):
    C.sec("qa2")
    html = html_arg().replace("window.__PM={", "window.__PM={" + FX2, 1)
    b = launch(pw); pg = open_game(b, html, LITE, viewport=(1100, 760), errs=errs, wait=False)
    pg.wait_for_function("window.__B&&__B.first!==null", timeout=240000); pg.wait_for_timeout(800)
    E = pg.evaluate
    # picker wording: survival says "wave", season says the outage price
    E("()=>{__PM.leadPickOpen(()=>{},null,'surv')}")
    t = E("()=>document.querySelector('#leadOv .ldcard[data-l=chip]').textContent")
    ok("survival picker: Chip's fiber lock says 'next wave's fiber'", "next wave's fiber" in t and "next week" not in t, t[:200])
    E("()=>{document.getElementById('ld-no').click();__PM.leadPickOpen(()=>{},null,'season')}")
    t = E("()=>document.querySelector('#leadOv .ldcard[data-l=chip]').textContent")
    ok("season picker: Chip's lock holds the market until the next outage", "until the next" in t and "next wave" not in t, t[:200])
    # start a season with Chip
    E("()=>{document.getElementById('ld-no').click();document.getElementById('v2go').click()}")
    pg.wait_for_function("!!document.querySelector('#leadOv:not([hidden]) .ldcard')", timeout=240000)
    E("()=>{document.querySelector('#leadOv .ldcard[data-l=chip]').click();document.getElementById('ld-go').click();}")
    pg.wait_for_function("__PM.S.lead&&__PM.S.season&&__PM.S.season.on", timeout=240000); pg.wait_for_timeout(1000)
    E("()=>{__PM.G3.on=false;__PM.S.cards.next=1e12;}")
    # (was a hard-coded version number: the label must show the build's own APP_VER)
    vl = E("()=>[__PM.APP_VER,(document.getElementById('v2ver')||{}).textContent||'']")
    ok("version label shows the build's APP_VER", bool(APP_VER) and vl[0] == APP_VER and vl[1] == APP_VER, f"built {APP_VER}, page {vl}")
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
    r = E("()=>[__PM.CIVU.slime.n,__PM.EVENTS.find(e=>e.id==='slime').name,JSON.stringify(__PM.CIVU.rush.ch).includes('34Super')]")
    ok("jargon replaced: 'Slime build-up', no 34Super on the rush card", r == ["Slime build-up", "Slime build-up", False], r)
    # price lever text matches band
    E("()=>{__PM.S.civ.m.E=46}")
    # bird cut-scene: stays paused with a card open
    r = E("""()=>{const S=__PM.S;window.running=undefined;return typeof __PM.G3.birdCine}""")
    ok("bird cut-scene hook present", r == "function", r)
    # pause menu above event card and outage plan
    r = E("()=>{const z=id=>{const e=document.getElementById(id);return e?+getComputedStyle(e).zIndex:null};return [z('dealOv'),z('outOv'),+getComputedStyle(document.getElementById('v2menu')).zIndex]}")
    ok("event card and outage plan draw under the pause menu", (r[0] is None or r[0] < r[2]) and (r[1] is None or r[1] < r[2]), r)
    b.close()

# ---------------------------------------------------------------- econ (tools/econfix.py; sim only, stepped by hand)
EX = "window.__PM={get ORD(){return ORD},priceOf:g=>priceOf(g),ordState:()=>ordState(),"

def econ(pw):
    C.sec("econ")
    html = html_arg().replace("window.__PM={", EX, 1)
    b = launch(pw)
    pg = open_game(b, html, "seed=5&" + LITE, viewport=(800, 450), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300)
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setRunning(false);}")
    r1 = pg.evaluate("""()=>{const P=__PM,S=P.S;P.CH.on=false;S.inc.length=0;S.crewQ.length=0;
      P.trigger("winderdown",true);for(let k=0;k<12;k++)P.step(0.25);   // the pair reaches the winder first
      P.trigger("felt",true);let t=0,cleared=-1;for(;t<6000;t++){P.step(0.25);if(!S.inc.some(i=>i.id==="felt"||i.id==="winderdown")&&cleared<0)cleared=t*0.25;if(cleared>=0&&S.pm==="run"&&S.wd==="run")break;}
      return {cleared_min:cleared,left:S.inc.map(i=>i.id+":"+i.left.toFixed(0)),pm:S.pm,wd:S.wd,crewQ:S.crewQ.map(q=>q.k)};}""")
    ok("1 deadlock: winder breakdown then felt change both clear, machine and winder run again", r1["cleared_min"] >= 0 and r1["pm"] == "run" and r1["wd"] == "run", r1)
    # 3: (v6.6 order book) a 34Super order and 20 rolls of 34Super in the warehouse while the machine makes 24: the
    # truck that carries them must be invoiced at the 34Super price (v16: each roll at its own grade's price)
    r3 = pg.evaluate("""()=>{const P=__PM,S=P.S,C=P.C;S.inc.length=0;S.crewQ.length=0;S.cards.next=1e12;
      C.grade="24";const O=P.ordState();O.list.forEach(o=>o.st="done");S.outQ.length=0;for(let d=0;d<S.outDock.length;d++)S.outDock[d]=null;
      S.lots.fg.length=0;S.lots.fg.push(["34Super",20]);S.fg=20;
      const o={id:++O.n,c:0,g:"34Super",r:20,ld:0,sh:0,due:Math.round(S.t+1440),t0:Math.round(S.t),st:"open"};O.list.push(o);
      let n=0,inv=null;while(o.st==="open"&&n<20000){const r0=S.ledger.rev,s0=o.sh;P.step(0.25);n++;
        if(o.sh>s0+1e-9)inv={rev:S.ledger.rev-r0,tons:(o.sh-s0)*C.rollW.v};if(S.cards.open)S.cards.open=null;if(S.civ){S.civ.cur=null;S.civ.pending=null;}}
      return {st:o.st,n,inv,grade:C.grade,p34:P.priceOf("34Super"),p24:P.priceOf("24")}}""")
    inv = r3["inv"]
    ok("3 grade: 34Super rolls shipped while making 24 are paid at the 34Super price",
       r3["st"] == "done" and bool(inv) and inv["tons"] > 0 and abs(inv["rev"] - inv["tons"] * r3["p34"]) < 1 and r3["grade"] == "24", r3)
    pg.close()
    # 2: the same seeded two days (upsets on) stepped with the 3D view marked on and off: the old crew and maintenance
    # arrival checks read G3.on and the wall clock, so these used to differ; now they must match
    out = []
    for on in (True, False):
        pg = open_game(b, html, "seed=11&" + LITE, viewport=(800, 450), errs=errs, wait=False)
        pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300)
        out.append(pg.evaluate("(on)=>{document.getElementById('v2go').click();__PM.setRunning(false);__PM.reseed(77);__PM.CH.on=true;__PM.G3.on=on;for(let k=0;k<2*1440*4;k++)__PM.step(0.25);return [Math.round(__PM.S.cash),__PM.S.tot.incidents,__PM.S.tot.breaks]}", on)); pg.close()
    ok("2 graphics: two seeded days give the same cash, upsets and breaks with the 3D view on and off", out[0] == out[1], out)
    b.close()

with sync_playwright() as pw:
    for f in (qa1_civics, qa1_cards, qa2, econ):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()      # page errors fail the check
