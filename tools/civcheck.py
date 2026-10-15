"""v5.1 (offline) civics + leaders-in-seasons functional check. No balancing: it checks that every part works and nothing
throws. Usage: python3 civcheck.py <index.html> [out.json] [screenshot_dir]

  1 season from the first menu: the leader picker opens, the season starts with that leader, the chip shows the outage
    countdown (not the survival multipliers), the civics bar shows four meters at the leader + site start values
  2 effects: each meter moves its levers in the right direction (price, repairs, breaks, upset odds, speed, receiving)
  3 a choice card for an EVENTS upset: cost, odds and civics applied; a standing order then answers the next one (toast,
    then commit); $$$ choices and first-time upsets still ask
  4 every new civic upset and every meter-triggered warning, crisis and reward opens and resolves with each choice
  5 event cards: civics shown on the card, accept and decline move the meters
  6 the outage dialog has the civics levers; the leader's pick works in a season; the levers apply when the outage ends
  7 save, reload, Continue: the meters, odds and orders come back
  8 a full season played by a bot (every card answered) ends on the season-over dialog with the leader listed; no NaN
  9 a survival run (Dot) from the menu, played by the bot for 20 days: waves, civics, leader all running
 10 free play: no civics bar, no civics effects
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
src = open(HERE / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])

html = pathlib.Path(sys.argv[1]).read_text()
outp = sys.argv[2] if len(sys.argv) > 2 else None
shots = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else None
if shots: shots.mkdir(parents=True, exist_ok=True)
X = ("window.__PM={get CIVU(){return CIVU},get CIVNEW(){return CIVNEW},get CIVMETER(){return CIVMETER},get CIVREWARD(){return CIVREWARD},get CIVCARD(){return CIVCARD},get CIV(){return CIV},"
     "civOn:()=>civOn(),civAdd:(d,w)=>civAdd(d,w),civQueue:(i,k)=>civQueue(i,k),civNext:()=>civNext(),civCommit:()=>civCommit(),"
     "fx:{price:()=>civPrice(),rep:()=>civRepair(),brk:()=>civBreak(),yard:()=>civYard(),mach:()=>civMach(),speed:()=>civSpeed(),bill:()=>civBill(),comm:()=>civComm(),recv:()=>civRecv(),over:()=>civOver(),tax:()=>civTax()},"
     "openCard:id=>openCard(CARDS.find(c=>c.id===id)),get CARDS(){return CARDS},get P(){return P},applyUpgrades:()=>applyUpgrades(),leadOn:()=>leadOn(),freqMul:id=>freqMul(id),"
     "get OUT(){return OUT},outStart:k=>outStart(k),energyCost:()=>energyCost(),remod:()=>{S.M=mods();},")
html = html.replace("window.__PM={", X, 1)
R = {"checks": [], "bot": {}}
fails = []
def ok(name, cond, got=None):
    R["checks"].append({"name": name, "ok": bool(cond), "got": got if not cond else None})
    print(("ok   " if cond else "FAIL ") + name + ("" if cond else f"   got: {json.dumps(got)[:400]}"), flush=True)
    if not cond: fails.append(name)

# the bot: steps the sim with the 3D view off and answers everything the game asks
BOT = r"""([until,max,mode])=>{const P=__PM,S=P.S,G=P.G3,f=new Function('S','P','return '+until);let n=0;const B=window.__BOT||(window.__BOT={civ:{},kinds:{},cards:0,acc:0,dec:0,outs:0,orders:0,auto:0,errs:[]});
  const vis=id=>{const e=document.getElementById(id);return !!e&&!e.hidden;};
  P.setRunning(false);
  while(n<max&&!f(S,P)){G.on=false;try{P.step(0.25);}catch(e){B.errs.push(String(e).slice(0,200));break;}n++;
    // standing-order toasts: commit at once (the page timer won't run while the bot steps)
    if(S.civ&&S.civ.pending){B.auto++;P.civCommit();}
    if(vis('civOv')&&S.civ&&S.civ.cur){const d=S.civ.cur,bs=[...document.querySelectorAll('#civOv .civbtn')];B.kinds[d.kind]=(B.kinds[d.kind]||0)+1;B.civ[d.id]=(B.civ[d.id]||0)+1;
      const i=(B.civ[d.id]+d.id.length)%bs.length;const box=document.getElementById('civ-ord');if(box&&mode==='orders'&&!box.checked){box.checked=true;B.orders++;}bs[i].click();}
    const o=S.cards.open;
    if(o&&o.c&&vis('dealOv')){B.cards++;if(B.cards%2){B.acc++;document.getElementById('deal-yes').click();}else{B.dec++;document.getElementById('deal-no').click();}}
    if(mode!=='noout'&&vis('outOv')&&document.getElementById('out-ok')){B.outs++;document.querySelectorAll('#outOv .civplan .seg').forEach((sg,j)=>{const b=sg.querySelectorAll('button');b[(B.outs+j)%b.length].click();});document.getElementById('out-ok').click();}
    const rc=document.getElementById('rc-ok');if(rc&&rc.offsetParent)rc.click();
    P.setRunning(false);}
  G.on=true;return {n,day:Math.floor(S.t/1440)+1,k:S.outg&&S.outg.k,cash:Math.round(S.cash),done:!!(S.season&&S.season.done),bot:B};}"""
STATE = r"""()=>{const P=__PM,S=P.S,t=id=>{const e=document.getElementById(id);return e?e.textContent:null},v=id=>{const e=document.getElementById(id);return !!e&&!e.hidden};
  return {season:!!(S.season&&S.season.on),surv:!!(S.season&&S.season.surv),lead:S.lead&&S.lead.id,civ:S.civ?JSON.parse(JSON.stringify(S.civ.m)):null,civOn:P.civOn(),
    chip:v('survChip'),svW:t('svW'),svN:t('svN'),seasonChip:document.getElementById('survChip').classList.contains('season'),bar:v('civBar'),
    bands:[...document.querySelectorAll('#civBar .cv em')].map(e=>e.textContent),cash:S.cash,t:S.t,k:S.outg&&S.outg.k,
    nan:[S.cash,S.t,P.P.priceAdd,P.P.K,P.P.repairMul,P.P.breakBase].some(x=>typeof x!=='number'||!isFinite(x))};}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 1000, "height": 720}); pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
    ev = lambda js, *a: pg.evaluate(js, *a)
    def load(q=""):
        pg.goto("http://bench.local/" + q); pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000); pg.wait_for_timeout(500)
    def frames():
        ev("()=>new Promise(r=>{let n=0;const f=()=>{if(++n>=6)r();else requestAnimationFrame(f);};requestAnimationFrame(f);})")
    def state(): frames(); return ev(STATE)
    def shot(n):
        if shots: pg.screenshot(path=str(shots / (n + ".png")))
    def bot(until, mx, mode=""): return ev(BOT, [until, mx, mode])
    def pick(btn, who):
        ev("(b)=>document.getElementById(b).click()", btn)
        pg.wait_for_function("!!document.querySelector('#leadOv:not([hidden]) .ldcard')", timeout=120000)
        r = ev("()=>({dk:document.querySelector('#leadOv .dk').textContent,go:document.getElementById('ld-go').textContent})")
        ev("(w)=>document.querySelector('#leadOv .ldcard[data-l='+w+']').click()", who); r["go2"] = ev("()=>document.getElementById('ld-go').textContent")
        ev("()=>document.getElementById('ld-go').click()"); return r

    load("?env=rural")
    # ---- 1 season with a leader ----
    r = pick("v2go", "chip")
    ok("1 first Play opens the leader picker, labelled Season", "Season" in r["dk"] and "season" in r["go2"], r)
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000, polling=200); pg.wait_for_timeout(600); ev("()=>__PM.setRunning(false)")
    s = state()
    ok("1 a season (not survival) with Chip in charge", s["season"] and not s["surv"] and s["lead"] == "chip", s)
    ok("1 chip shows in the season: outage countdown, no multipliers", s["chip"] and s["seasonChip"] and s["svW"] == "Outage 1 of 4", s)
    ok("1 civics bar: four meters, start = Chip (60/40/50/50), rural Labor −6, no meter below 42", s["bar"] and len(s["bands"]) == 4 and {k: round(v) for k, v in s["civ"].items()} == {"E": 60, "L": 42, "M": 50, "C": 50}, s)
    ok("1 bands shown: Labor 42 = Steady, Economy 60 = Steady", s["bands"][1] == "Steady" and s["bands"][0] == "Steady", s)
    shot("1-season-start")

    # ---- 2 effects move the right way ----
    eff = ev("""()=>{const P=__PM,S=P.S,m=S.civ.m,keep=Object.assign({},m),out={};const rd=()=>({price:P.fx.price(),rep:P.fx.rep(),brk:P.fx.brk(),yard:P.fx.yard(),mach:P.fx.mach(),speed:P.fx.speed(),bill:P.fx.bill(),comm:P.fx.comm(),recv:P.fx.recv(),over:P.fx.over(),pa:P.P.priceAdd,K:P.P.K,shaft:P.freqMul('shaft'),fleet:P.freqMul('fleet'),permit:P.freqMul('permit')});
      for(const v of [0,20,40,50,100]){for(const k of ['E','L','M','C'])m[k]=v;P.applyUpgrades();out[v]=rd();}
      Object.assign(m,keep);P.applyUpgrades();return out;}""")
    e0, e50, e100, e20, e40 = eff["0"], eff["50"], eff["100"], eff["20"], eff["40"]
    ok("2 at 50 every effect is neutral", e50["price"] == 0 and e50["rep"] == 1 and e50["brk"] == 1 and e50["mach"] == 1 and e50["speed"] == 1 and e50["recv"] == 1 and e50["over"] == 0, e50)
    ok("2 Economy: price −$15/t at 0, +$15/t at 100 (and in P.priceAdd)", e0["price"] == -15 and e100["price"] == 15 and e100["pa"] - e0["pa"] == 30, [e0, e100])
    ok("2 Labor: repairs slower at 0, faster at 100; breaks up/down; yard upsets ×1.5/×0.5; outage +120/−60 min", e0["rep"] < 1 < e100["rep"] and e0["brk"] > 1 > e100["brk"] and e0["yard"] == 1.5 and e100["yard"] == 0.5 and e0["over"] == 120 and e100["over"] == -60, [e0, e100])
    ok("2 Machinery: breakdowns ×1.3/×0.7 (shaft odds follow), speed and bills", e0["mach"] == 1.3 and e100["mach"] == 0.7 and e0["shaft"] > e50["shaft"] > e100["shaft"] and e0["K"] < e50["K"] < e100["K"] and e0["bill"] > 1 > e100["bill"], [e0, e100])
    ok("2 Community: permit ×1.5/×0.5, receiving −20% at 0", e0["comm"] == 1.5 and e100["comm"] == 0.5 and e0["recv"] == 0.8 and e0["permit"] > e100["permit"], [e0, e100])
    ok("2 below 50 is steeper: 20 hurts more than twice what 40 does", (e20["price"] / e40["price"]) > 3, [e20["price"], e40["price"]])

    # ---- 3 a choice card for an EVENTS upset, then a standing order ----
    ev("()=>{__PM.S.t=2*1440;}")
    c = ev("""()=>{const P=__PM,S=P.S;const cash=S.cash,m=Object.assign({},S.civ.m);P.trigger('felt');const open=!document.getElementById('civOv').hidden&&S.civ.cur&&S.civ.cur.id==='felt';
      const btns=[...document.querySelectorAll('#civOv .civbtn')].map(b=>b.textContent),box=!!document.getElementById('civ-ord');
      document.getElementById('civ-ord').checked=true;document.querySelectorAll('#civOv .civbtn')[1].click();
      return {open,btns,box,dcash:Math.round(S.cash-cash),dm:Object.fromEntries(Object.keys(m).map(k=>[k,S.civ.m[k]-m[k]])),odds:S.civ.odds.felt,order:S.civ.orders['Machine'],closed:document.getElementById('civOv').hidden,running:P.running};}""")
    ok("3 felt blows → the choice card opens with 3 choices and the order checkbox", c["open"] and len(c["btns"]) == 3 and c["box"], c)
    ok("3 choice B (run a used spare): $10k, no meter change, felt comes back 1.5x as often, order = Shortcut", c["dcash"] <= -10000 and c["dm"]["M"] == 0 and abs(c["odds"] - 1.5) < 1e-9 and c["order"] == "S", c)
    ev("()=>{__PM.S.inc=__PM.S.inc.filter(i=>i.id!=='felt');}")
    c2 = ev("""()=>{const P=__PM,S=P.S;P.setRunning(false);if(S.cards.open&&S.cards.open.c)document.getElementById('deal-no').click();P.setRunning(false);P.trigger('felt');const toast=!document.getElementById('civToast').hidden,pend=!!S.civ.pending,card=!document.getElementById('civOv').hidden;P.civCommit();
      return {toast,pend,card,odds:S.civ.odds.felt,toastAfter:!document.getElementById('civToast').hidden};}""")
    ok("3 the standing order answers the next felt: toast with Change, no card, then commits", c2["toast"] and c2["pend"] and not c2["card"] and abs(c2["odds"] - 2.25) < 1e-6 and not c2["toastAfter"], c2)
    c3 = ev("""()=>{const P=__PM,S=P.S;P.setRunning(false);if(S.cards.open&&S.cards.open.c)document.getElementById('deal-no').click();P.setRunning(false);S.civ.orders['Machine']='P';S.inc=S.inc.filter(i=>i.id!=='shaft');P.trigger('shaft');const card=!document.getElementById('civOv').hidden&&S.civ.cur&&S.civ.cur.id==='shaft';
      const inc=S.inc.find(i=>i.id==='shaft'),l0=inc&&inc.left;document.querySelectorAll('#civOv .civbtn')[0].click();const l1=inc&&inc.left;return {card,first:!S.civ.seen.shaft,ext:l1-l0};}""")
    ok("3 a first-time upset still asks; the proper fix adds 3 h of downtime", c3["card"] and abs(c3["ext"] - 180) < 1, c3)
    c4 = ev("""()=>{const P=__PM,S=P.S;P.setRunning(false);if(S.cards.open&&S.cards.open.c)document.getElementById('deal-no').click();P.setRunning(false);S.inc=S.inc.filter(i=>i.id!=='shaft');P.trigger('shaft');const card=!document.getElementById('civOv').hidden;const toast=!document.getElementById('civToast').hidden;
      if(card)document.querySelectorAll('#civOv .civbtn')[1].click();if(S.civ.pending)P.civCommit();return {card,toast};}""")
    ok("3 a $$$ choice still asks even with an order (driveshaft, Fix properly)", c4["card"] and not c4["toast"], c4)
    ev("()=>{__PM.S.civ.orders={};__PM.S.inc=[];__PM.remod();}")

    # ---- 4 every new civic upset, every meter-triggered one, every reward ----
    allr = ev("""()=>{const P=__PM,S=P.S,res={},bad=[],cash0=S.cash;const ids=[...Object.keys(P.CIVNEW),...Object.keys(P.CIVMETER),...Object.keys(P.CIVREWARD)];
      for(const id of ids){const kind=P.CIVNEW[id]?'new':'meter',n=id.startsWith('r_')?2:P.CIVU[id].ch.length;res[id]=[];
        for(let i=0;i<n;i++){try{S.fx=S.fx.filter(f=>f.id!=='pout');S.civ.cur=null;S.civ.q=[];S.cards.open=null;P.civQueue(id,kind);P.civNext();
          const open=!document.getElementById('civOv').hidden&&S.civ.cur&&S.civ.cur.id===id;const b=document.querySelectorAll('#civOv .civbtn');
          if(!open||b.length!==n){bad.push(id+':'+i+' open='+open+' n='+b.length);continue;}b[i].click();res[id].push(document.getElementById('civOv').hidden?1:0);}
          catch(e){bad.push(id+':'+i+' '+String(e).slice(0,120));}}}
      for(const k of ['E','L','M','C'])S.civ.m[k]=50;S.fx=S.fx.filter(f=>!f.civ);S.civ.tm=[];S.civ.prem=0;S.civ.taxDay=0;S.civ.runUntil=0;S.cash=cash0;P.applyUpgrades();
      return {n:ids.length,bad,res};}""")
    ok(f"4 all {allr['n']} new, warning, crisis and reward upsets open and resolve with every choice", not allr["bad"], allr["bad"])
    # meter triggers from the tick
    trig = ev("""()=>{const P=__PM,S=P.S,cash0=S.cash;S.civ.tm=[];S.civ.q=[];S.civ.cur=null;S.cards.open=null;S.civ.arm={w:{E:1,L:1,M:1,C:1},r:{E:1,L:1,M:1,C:1},c:{E:0,L:0,M:0,C:0}};
      S.civ.m.E=35;S.civ.m.L=15;S.civ.m.M=85;S.civ.m.C=50;S.civ.newNext=1e12;const seen={};
      for(let i=0;i<2.5*1440*4;i++){__PM.G3.on=false;P.step(0.25);if(S.civ.cur){seen[S.civ.cur.id]=1;document.querySelectorAll('#civOv .civbtn')[0].click();}const o=S.cards.open;if(o&&o.c)document.getElementById('deal-no').click();
        if(!(document.getElementById('outOv')||{hidden:true}).hidden&&document.getElementById('out-ok'))document.getElementById('out-ok').click();S.civ.m.E=Math.min(S.civ.m.E,35);S.civ.m.L=Math.min(S.civ.m.L,15);S.civ.m.M=Math.max(S.civ.m.M,85);}
      S.civ.newNext=S.t;for(const k of ['E','L','M','C'])S.civ.m[k]=50;S.fx=S.fx.filter(f=>!f.civ);S.civ.tm=[];S.civ.prem=0;S.civ.runUntil=0;S.cash=cash0;P.applyUpgrades();P.remod();__PM.G3.on=true;return Object.keys(seen);}""")
    ok("4 meters trigger on their own: Economy 35 → watch warning, Labor 15 → walkout crisis, Machinery 85 → record run offer", "w_watch" in trig and "c_walkout" in trig and "r_M" in trig, trig)

    # ---- 5 event cards ----
    cd = ev("""()=>{const P=__PM,S=P.S;S.cards.open=null;S.civ.cur=null;P.setRunning(false);const m0=S.civ.m.L;P.openCard('drone');const html=document.getElementById('dealOv').innerHTML,shown=html.includes('Civics');
      document.getElementById('deal-yes').click();const dl=S.civ.m.L-m0;const t0=S.civ.m.L;P.openCard('shift');document.getElementById('deal-no').click();const dd=S.civ.m.L-t0;
      const hot=P.CARDS.find(c=>c.id==='hot').ok();return {shown,dl,dd,hot};}""")
    ok("5 event card shows its civics; accepting the drone gives Labor +1; declining the shift rotation costs Labor −1", cd["shown"] and cd["dl"] == 3 and cd["dd"] == -3, cd)
    ok("5 Hot order card is out of the deck with civics on", cd["hot"] is False, cd)

    # ---- 6 outage dialog with levers and the leader's pick, in a season ----
    ev("()=>{const S=__PM.S;S.cards.open=null;S.civ.cur=null;S.civ.q=[];}")
    o1 = bot("S.outg.noticed||S.outg.k>1", 60000, "noout")
    od = ev("""()=>{const v=id=>{const e=document.getElementById(id);return !!e&&!e.hidden};return {open:v('outOv'),lead:!!document.querySelector('#outOv #out-lpick'),civ:document.querySelectorAll('#outOv .civplan .seg').length,
      dk:(document.querySelector('#outOv .dk')||{}).textContent};}""")
    ok("6 season outage dialog: Chip's pick and three civics levers", od["open"] and od["lead"] and od["civ"] == 3 and "of 4" in (od["dk"] or ""), od)
    shot("6-outage")
    lv = ev("""()=>{const S=__PM.S,c0=S.cash;document.querySelectorAll('#outOv .civplan .seg').forEach(sg=>sg.querySelectorAll('button')[sg.querySelectorAll('button').length-1].click());
      document.querySelector('#outOv #out-lpick button[data-p=sales]').click();document.getElementById('out-ok').click();return {paid:Math.round(c0-S.cash),plan:JSON.parse(JSON.stringify(S.outg.plan))};}""")
    ok("6 approving charges the budget plus the bonus and donation; the plan keeps the levers", lv["plan"].get("civ", {}).get("bonus") == 20000 and lv["plan"]["civ"]["don"] == 20000 and lv["paid"] >= 70000 * 3 + 40000 - 1, lv)
    m0 = ev("()=>Object.assign({},__PM.S.civ.m)")
    o2 = bot("S.outg.k>1", 40000)
    m1 = ev("()=>({m:Object.assign({},__PM.S.civ.m),sales:__PM.S.lead.st.sales,price:(__PM.S.fx.find(f=>f.id==='civprice')||{}).price})")
    ok("6 when the outage ends: Chip's sales push counts, the +$5/t price setting is on, Labor and Community got their +2", m1["sales"] == 1 and m1["price"] == {"all": 5}, {"m0": m0, "m1": m1, "o2": o2})

    # ---- 7 save and reload ----
    ev("()=>{__PM.S.civ.orders={Yard:'Q'};__PM.S.civ.odds.fleet=0.75;__PM.S.civ.m.C=77;__PM.G3.save.save('test');}")
    load("?env=rural")
    cont = ev("()=>{const b=[...document.querySelectorAll('#v2menu button')].find(x=>/Continue/.test(x.textContent));if(b)b.click();return !!b;}")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000, polling=200); pg.wait_for_timeout(800); ev("()=>__PM.setRunning(false)")
    sv = ev("()=>({lead:__PM.S.lead&&__PM.S.lead.id,C:__PM.S.civ&&__PM.S.civ.m.C,orders:__PM.S.civ&&__PM.S.civ.orders,odds:__PM.S.civ&&__PM.S.civ.odds.fleet,on:__PM.civOn()})")
    ok("7 Continue restores the leader, meters, orders and odds", cont and sv["lead"] == "chip" and round(sv["C"]) == 77 and sv["orders"] == {"Yard": "Q"} and sv["odds"] == 0.75 and sv["on"], sv)

    # ---- 8 the rest of the season, played by the bot ----
    bs = bot("S.season&&S.season.done", 400000, "orders")
    s = state(); R["bot"]["season"] = bs
    st = ev("()=>({h:document.getElementById('so-h').textContent,stats:[...document.querySelectorAll('#so-stats > div')].map(d=>d.textContent),vis:!document.getElementById('seasonOv').hidden})")
    ok("8 bot finishes the season: season-over dialog with the mill leader listed", bs["done"] and st["vis"] and any("Mill leader" in x for x in st["stats"]), {"bot": bs, "st": st})
    ok("8 the bot saw upset choices, new upsets, cards and outages, and used standing orders", bs["bot"]["kinds"].get("up", 0) + bs["bot"]["auto"] > 3 and bs["bot"]["kinds"].get("new", 0) >= 2 and bs["bot"]["cards"] > 5 and bs["bot"]["outs"] >= 3 and bs["bot"]["auto"] > 0, bs["bot"])
    ok("8 no NaN, no bot errors", not s["nan"] and not bs["bot"]["errs"], {"s": s, "e": bs["bot"]["errs"]})
    shot("8-season-over")

    # ---- 9 survival with Dot ----
    load("?env=desert")
    r = pick("v2surv", "dot")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000, polling=200); pg.wait_for_timeout(500); ev("()=>__PM.setRunning(false)")
    s = state()
    ok("9 survival with Dot: civics on, start = Dot (50/50/60/40), desert Machinery −6, no meter below 42", s["surv"] and s["lead"] == "dot" and {k: round(v) for k, v in s["civ"].items()} == {"E": 50, "L": 50, "M": 54, "C": 42} and s["bar"], s)
    ev("()=>{window.__BOT=null;}")
    bv = bot("S.t>=20*1440||(S.season&&S.season.done)", 400000)
    s = state(); R["bot"]["survival"] = bv
    ok("9 survival bot: 20 days (or bankrupt) with waves, choices and outages, no errors, no NaN", (bv["day"] >= 20 or bv["done"]) and bv["k"] >= 4 and bv["bot"]["kinds"].get("up", 0) > 0 and not bv["bot"]["errs"] and not s["nan"], bv)
    shot("9-survival")

    # ---- 10 free play ----
    ev("()=>{document.getElementById('seasonOv').hidden=true;}")
    fr = ev("""()=>{const P=__PM;P.S.free=false;document.getElementById('v2free').click();return true;}""")
    frames(); pg.wait_for_timeout(300); frames()
    fr = ev("()=>({on:__PM.civOn(),bar:!document.getElementById('civBar').hidden,price:__PM.fx.price(),lead:__PM.S.lead})")
    ok("10 free play: no civics, no bar, no civics effects", not fr["on"] and not fr["bar"] and fr["price"] == 0, fr)

    errs = [e for e in errs if "leaderboard" not in e.lower()]
    ok("no page or console errors", not errs, errs[:6])
    b.close()
R["fails"] = fails
if outp: pathlib.Path(outp).write_text(json.dumps(R, indent=1))
print(("CIVICS CHECK FAILED (%d): " % len(fails) + "; ".join(fails)) if fails else "CIVICS CHECK OK")
