"""v6.10 reliability and electrical (07i, 38c, 50l): the asset model, the shift rounds (done, skipped when the tech is
called away, stale data), faults found and planned repairs, the three failures and who fixes them, outage changeouts,
the Reliability and Drives screens, the drive load tags, the upset card's reliability line, the MCC in 3D and the
electrical tech, zen without any of it. Fails on any page error.
Usage: python3 rlycheck.py <index.html> [shot_prefix]"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text(); shot = sys.argv[2] if len(sys.argv) > 2 else None
errs, log = [], []
def ok(name, cond, extra=""):
    log.append(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1280, "height": 860})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave&nobf")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{const t=document.getElementById('tut');if(t)t.hidden=true;__PM.setRunning(false);__PM.S.cards.next=1e12;}")
    def J(s):
        try: return pg.evaluate(s)
        except Exception as e:
            print("\n".join(log)); print("STEP FAILED:", s[:120], str(e)[:300]); raise
    def answer():   # answer any civics cards waiting (the camera pull can hold one back a few seconds)
        for _ in range(12):
            if not pg.evaluate("()=>!!(__PM.S.civ&&(__PM.S.civ.cur||__PM.S.civ.q.length||__PM.S.civ.pending))"): return
            pg.wait_for_timeout(600); pg.evaluate("()=>{const b=document.querySelector('#civOv:not([hidden]) .civbtn');if(b)b.click();const t=document.querySelector('#civToast:not([hidden])');if(t&&__PM.S.civ.pending){}}")
            pg.evaluate("()=>{const V=__PM.S.civ;if(V&&V.pending&&!V.cur){V.pending=null;const t=document.getElementById('civToast');if(t)t.hidden=true;}}")

    r = J("()=>{const P=__PM,R=P.rly.state();return {n:P.rly.ASSETS.length,ok:P.rly.ASSETS.every(A=>{const a=R.a[A.id];return a.vib>0&&a.adx>0&&a.dh>0}),on:P.rly.on(),e:!!P.manShift(0).elec}}")
    ok("ten assets with bearing, motor and drive health; on in a season; an electrical tech on the roster", r["n"] == 10 and r["ok"] and r["on"] and r["e"], json.dumps(r))

    # one shift: every tech's vibration round and the ADX round run (nothing else going on)
    r = J("""()=>{const P=__PM,S=P.S;P.CH.on=false;while(S.t<720+400)P.step(P.SIM_STEP);const L=S.rel.rd.list;
      return {n:L.length,done:L.filter(x=>x.st==='done').length,vib:L.filter(x=>x.k==='vib').length,adx:L.filter(x=>x.k==='adx').length,read:Object.values(S.rel.a).filter(a=>a.lv).length,ard:Object.values(S.rel.a).filter(a=>a.la).length,techs:P.manShift(1).nt}}""")
    ok("a quiet shift: every tech's vibration round and the ADX round are done", r["done"] == r["n"] and r["vib"] == r["techs"] and r["adx"] == 1 and r["read"] >= 2*r["techs"] and r["ard"] >= 2, json.dumps(r))

    # skipped: a maintenance job holding the first pair and an electrical job when the rounds start
    r = J("""()=>{const P=__PM,S=P.S;while(S.t<1440+40)P.step(P.SIM_STEP);P.trigger('cscreen');P.rly.fail('wind','drv');
      while(S.t<1440+260)P.step(P.SIM_STEP);const L=S.rel.rd.list;return L.map(x=>[x.who,x.st,x.why])}""")
    st = {w: s for w, s, _ in r}
    answer()
    ok("a tech called to an upset skips the round (and says why)", st.get("t0") in ("skip", "abandon") and st.get("e") in ("skip", "abandon") and all(x[2] for x in r if x[1] in ("skip", "abandon")), json.dumps(r))
    r = J("()=>{const P=__PM,S=P.S;const i=S.inc.find(x=>x.id==='drivefail');return {e:P.rly.ENEED('drivefail'),m:P.rly.MNEED('drivefail'),eg:i?!!i.eGo:null,b:P.rly.MNEED('bearingfail'),l:P.rly.ENEED('lightning')&&!P.rly.MNEED('lightning')}}")
    ok("drive and motor failures and blackouts go to the electrical tech; bearings to maintenance", r["e"] and not r["m"] and r["b"] and r["l"], json.dumps(r))
    J("()=>{const P=__PM,S=P.S;S.inc.forEach(i=>i.left=0);P.step(P.SIM_STEP);}")

    # stale data: nothing measured for 3 days reads Unknown

    # a fault found on a round, then a planned repair: no failure, 20% of the bill
    r = J("""()=>{const P=__PM,S=P.S,R=S.rel;R.pend.push({a:'refB',k:'vib',due:S.t+5000,born:S.t});R.a.refB.pin='vib';
      const s0=Math.floor(S.t/720);while(Math.floor(S.t/720)<s0+1)P.step(P.SIM_STEP);while(!R.rd.list.some(x=>x.k==='vib'&&x.a.includes('refB')&&x.st==='done')&&S.t<(s0+2)*720)P.step(P.SIM_STEP);
      const v=R.a.refB.lv;const c0=S.cash,f=P.rly.fix('refB','vib'),c1=S.cash;return {st:v&&v.st,fix:f,paid:Math.round(c0-c1),pend:R.pend.some(p=>p.a==='refB'&&p.k==='vib'),caught:R.caught,h:Math.round(R.a.refB.vib)}}""")
    ok("a pinned round finds the failing bearing (imminent) and the planned repair clears it", r["st"] == "imm" and r["fix"] and r["paid"] > 0 and not r["pend"] and r["caught"] >= 1 and r["h"] >= 90, json.dumps(r))

    # missed: it fails, the machine stops, and the bearing is new afterwards
    r = J("""()=>{const P=__PM,S=P.S,R=S.rel;P.CH.on=true;while(S.t<4*1440)P.step(P.SIM_STEP);R.pend.push({a:'couch',k:'vib',due:S.t+1,born:S.t});const t0=S.t;let seen=null;
      while(S.t<t0+120&&!seen){P.step(P.SIM_STEP);seen=S.inc.find(i=>i.id==='bearingfail');}
      const pm=S.M.pmDown;const cite=seen&&seen.cite;let n=0;while(S.inc.some(i=>i.id==='bearingfail')&&n++<20000)P.step(P.SIM_STEP);P.CH.on=false;return {seen:!!seen,asset:seen&&seen.asset,pm,cite,h:Math.round(R.a.couch.vib),fails:R.fails}}""")
    ok("a missed fault fails: bearing failure at the couch roll stops the machine, quotes the last reading, and the bearing is new after", r["seen"] and r["asset"] == "couch" and r["pm"] and r["cite"] and r["h"] >= 90, json.dumps(r))

    r = J("""()=>{const P=__PM,S=P.S;P.rly.fail('refA','adx');const i=S.inc.find(x=>x.id==='motorfail');const sc=S.M.speedCap,hd=P.EVENTS.find(e=>e.id==='motorfail').head;let n=0;while(S.inc.some(x=>x.id==='motorfail')&&n++<30000)P.step(P.SIM_STEP);
      return {asset:i&&i.asset,cap:sc,head:hd,adx:Math.round(S.rel.a.refA.adx)}}""")
    ok("a motor failure on refiner A leaves one refiner (75% speed) and the motor is new after", r["asset"] == "refA" and abs(r["cap"] - 0.75) < 1e-6 and "Refiner A" in (r["head"] or "") and r["adx"] >= 90, json.dumps(r))

    # loads and tags
    r = J("""()=>{const P=__PM,S=P.S;for(let i=0;i<200;i++)P.step(P.SIM_STEP);const L=P.rly.ASSETS.map(A=>P.rly.load(A.id));const t=P.G3.ctl.tagNow('dl_dry'),k=P.G3.ctl.tagNow('mcckw');return {L:L.map(Math.round),t,k}}""")
    ok("drive loads are live (machine running) and trend as tags", all(0 <= v < 140 for v in r["L"]) and sum(1 for v in r["L"] if v > 20) >= 6 and r["t"] and r["k"] and r["k"] > 1000, json.dumps(r))

    # the screens
    J("()=>document.querySelector('.v2tabs button[data-tab=stats]').click()"); pg.wait_for_timeout(300)
    ok("Report > Control room has Reliability and Drives", J("()=>!!document.querySelector('#ctlRoom [data-cr=REL]')&&!!document.querySelector('#ctlRoom [data-cr=DRV]')"))
    J("()=>{__PM.S.rel.a.reel.lv={t:__PM.S.t-4*1440,st:'good',v:1,by:'t0'}}")
    J("()=>document.querySelector('#ctlRoom [data-cr=REL]').click()"); pg.wait_for_timeout(1200)
    r = J("()=>{const o=document.getElementById('dcsOv');return {open:!o.hidden,rows:o.querySelectorAll('#rlyTab tbody tr').length,unk:(o.querySelector('#rlyTab tr[data-rsel=reel]')||{}).textContent,rd:o.querySelectorAll('#rlyRd .rrd').length,top:o.querySelector('#rlyTop').textContent.slice(0,80)}}")
    ok("Reliability: ten rows, this shift's rounds, a stale machine reads Unknown", r["open"] and r["rows"] == 10 and r["rd"] >= 2 and "Unknown" in (r["unk"] or ""), json.dumps(r))
    if shot: pg.screenshot(path=f"{shot}-rel.png")
    r = J("""()=>{const o=document.getElementById('dcsOv');o.querySelector('tr[data-rsel=fan]').click();const b=o.querySelector('[data-rpin="fan:adx"]');b.click();
      const pin=__PM.S.rel.a.fan.pin;const c=o.querySelector('[data-rchg="fan:m"]');if(c)c.click();return {det:o.querySelector('#rlyDet').textContent.slice(0,40),pin,chg:JSON.stringify(__PM.S.rel.chg)}}""")
    ok("tap a row: its detail; pin it to the next ADX test; tick a motor changeout", "Fan pump" in r["det"] and r["pin"] == "adx" and '"fan":{"m":1}' in r["chg"], json.dumps(r))
    J("()=>document.querySelector('#dcsOv [data-a=DRV]').click()"); pg.wait_for_timeout(1200)
    r = J("()=>{const o=document.getElementById('dcsOv');return {bars:o.querySelectorAll('#drvL .dbar').length,top:o.querySelector('#drvTop').textContent.slice(0,60),al:o.querySelector('#dcsAl').textContent.slice(0,60)}}")
    ok("Drives: a load bar for each of the ten drives, MCC power, alarms", r["bars"] == 10 and "kW" in r["top"], json.dumps(r))
    J("()=>document.querySelector('#dcsOv .dbar[data-trk=dl_pr1]').click()"); pg.wait_for_timeout(300)
    ok("tap a drive's load: it goes on the trend", J("()=>__PM.G3.ctl.trPens().includes('dl_pr1')"))
    if shot: pg.screenshot(path=f"{shot}-drv.png")
    J("()=>document.getElementById('dcsClose').click()")

    answer()
    # the outage plan lists changeouts; booked ones are paid, lengthen the outage and renew the part
    J("()=>{__PM.S.rel.a.fan.adx=30;__PM.CH.on=false;}")
    for _ in range(40):
        st = J("()=>{const P=__PM,S=P.S,st=(7-1)*1440+120;while(S.t<st-1440+5&&!(S.cards.open))P.step(P.SIM_STEP);return S.outg.noticed?'plan':S.cards.open?'card':'time'}")
        if st == "plan": break
        answer(); J("()=>{const o=__PM.S.cards.open;if(o&&!o.civ&&!o.outage){const d=document.querySelector('#dealOv button');if(d)d.click();}}")
    r = J("()=>({plan:!!document.querySelector('#out-rly .rplan'),rows:document.querySelectorAll('#out-rly .prow').length})")
    ok("the outage plan shows the changeouts", r["plan"] and r["rows"] >= 1, json.dumps(r))
    if shot: pg.screenshot(path=f"{shot}-outage.png")
    r = J("""()=>{const P=__PM,S=P.S,c0=S.cash;document.getElementById('out-ok').click();const o=S.outg,pl=o.plan&&o.plan.rly;const paid=Math.round(c0-S.cash);
      while(!o.on)P.step(P.SIM_STEP);const len=o.end-S.t;while(o.on)P.step(P.SIM_STEP);return {pl,paid,len:Math.round(len),adx:Math.round(S.rel.a.fan.adx),chg:JSON.stringify(S.rel.chg)}}""")
    ok("approved: the motor changeout is paid, the outage runs longer, the fan pump motor comes back new", r["pl"] and r["pl"].get("fan", {}).get("m") and r["len"] > 240 and r["adx"] >= 99 and r["chg"] == "{}", json.dumps(r))

    # the upset card quotes the reliability data
    J("()=>{const P=__PM;P.setRunning(false);P.rly.fail('pulp','drv');}")
    try: pg.wait_for_function("()=>!!document.querySelector('#rlyOv:not([hidden]) [data-rc=reset]')", timeout=15000)
    except Exception: pass
    r = J("()=>{const c=document.querySelector('#rlyOv:not([hidden]) .cvrly');return {card:!!document.querySelector('#rlyOv:not([hidden]) [data-rc=reset]'),rly:c?c.textContent:''}}")
    ok("a drive fault opens its own card (Reset and go / Investigate) with the reliability data", r["card"] and "Reliability data" in r["rly"], json.dumps(r))
    J("()=>{const b=document.querySelector('#rlyOv:not([hidden]) [data-rc=reset]');if(b)b.click();}")

    # 3D: the MCC, its cabinets and the electrical tech
    r = J("()=>{const G=__PM.G3;return {mcc:!!G.MCC,et:!!(G.ET&&G.ET.w),spots:Object.keys(G.ASPOT||{}).length,bad:Object.values(G.ASPOT).map(s=>G.navCheck([[s[0],s[1]],[s[0]+0.01,s[1]]],G.NAVW)).filter(v=>v>0).length}}")
    ok("3D: the MCC and the electrical tech are built; every round spot is walkable", r["mcc"] and r["et"] and r["spots"] == 10 and r["bad"] == 0, json.dumps(r))
    r = J("""()=>{const P=__PM,S=P.S,E=P.G3.ET;S.inc.forEach(i=>i.left=0);P.step(P.SIM_STEP);P.CH.on=false;const s=Math.floor(S.t/720)+1;while(S.t<s*720+RLY_AT())P.step(P.SIM_STEP);return 1;function RLY_AT(){return P.rly.RLY.adx.at+20}}""")
    r = J("""()=>{const P=__PM,E=P.G3.ET;let now=performance.now();const x0=E.w.position.x,z0=E.w.position.z;for(let i=0;i<700;i++){now+=100;P.G3.navPump&&P.G3.navPump();P.G3.elecUpdate(0.1,now);}
      return {from:[x0,z0].map(Math.round),to:[E.w.position.x,E.w.position.z].map(Math.round),cart:Math.hypot(E.cart.position.x-E.w.position.x,E.cart.position.z-E.w.position.z)<1.5}}""")
    ok("the electrical tech walks out of the MCC to the ADX round with the cart", r["to"][1] < 20 and r["cart"], json.dumps(r))

    # v6.10 t2: drive fault decisions
    r = J("""()=>{const P=__PM,S=P.S;S.inc.forEach(i=>i.left=0);P.step(P.SIM_STEP);S.rel.a.pr2.dh=20;P.rly.fail('pr2','drv');const i=S.inc.find(x=>x.id==='drivefail');
      const held=i.stage;for(let k=0;k<160;k++)P.step(P.SIM_STEP);const still=S.inc.some(x=>x.id==='drivefail'&&x.stage==='wait');
      P.rly.decide('pr2','inv');let n=0;while(S.inc.some(x=>x.id==='drivefail'&&x.stage==='inv')&&n++<8000)P.step(P.SIM_STEP);const j=S.inc.find(x=>x.id==='drivefail');
      const found=j&&j.stage,cause=j&&j.cause;P.rly.decide('pr2','patch');n=0;while(S.inc.some(x=>x.id==='drivefail')&&n++<8000)P.step(P.SIM_STEP);
      return {held,still,found,cause,patch:S.rel.a.pr2.patch,booked:!!(S.rel.chg.pr2&&S.rel.chg.pr2.d),q:S.rel.q.length,cur:!!S.rel.cur}}""")
    J("()=>{__PM.CH.en.drivefail=false}")
    ok("a drive fault waits on the player's call (an hour, then the crew decides); Investigate finds a cause; Run to outage patches it and books the replacement", r["held"] == "wait" and r["still"] and r["found"] == "found" and r["cause"] and r["patch"] and r["booked"], json.dumps(r))
    J("()=>{const R=__PM.S.rel;R.q.length=0;R.cur=null;const o=document.getElementById('rlyOv');if(o)o.hidden=true;__PM.S.cards.open=null;}")
    r = J("""()=>{const P=__PM,S=P.S;S.inc.forEach(i=>{if(i.id==='drivefail')i.left=0});P.step(P.SIM_STEP);let k=0;while(S.inc.some(i=>i.id==='drivefail'||i.id==='bearingfail'||i.id==='motorfail')&&k++<9000)P.step(P.SIM_STEP);P.CH.en.drivefail=false;S.rel.rep.length=0;S.rel.a.reel.dh=5;let rep=0;for(let k=0;k<6;k++){P.rly.fail('reel','drv');P.rly.decide('reel','reset');let n=0;while(S.inc.some(x=>x.id==='drivefail')&&n++<2000)P.step(P.SIM_STEP);}
      rep=S.rel.rep.filter(p=>p.a==='reel').length;const r2=S.rel.rep.length;S.rel.rep.length=0;S.rel.q.length=0;S.rel.cur=null;S.cards.open=null;
      P.rly.fail('wind','drv');P.rly.decide('wind','repl');let n=0;while(S.inc.some(x=>x.id==='drivefail')&&n++<8000)P.step(P.SIM_STEP);return {rep,dh:Math.round(S.rel.a.wind.dh)}}""")
    ok("Reset and go on a worn drive sets up repeats; Replace now makes the drive new", r["rep"] >= 2 and r["dh"] == 100, json.dumps(r))
    J("()=>{const R=__PM.S.rel;R.q.length=0;R.cur=null;const o=document.getElementById('rlyOv');if(o)o.hidden=true;__PM.S.cards.open=null;}")

    # the power chain and a rectifier fault
    r = J("""()=>{const P=__PM,S=P.S,T=P.G3.ctl;for(let k=0;k<20;k++)P.step(P.SIM_STEP);const mv=T.tagNow('mvkv'),dc=T.tagNow('dc_PM');P.rly.fail(null,'rect',{ln:'PM'});for(let k=0;k<20;k++)P.step(P.SIM_STEP);
      const r={mv,dc,dc2:T.tagNow('dc_PM'),dcSP:T.tagNow('dc_SP'),pm:S.M.pmDown,st:P.rly.drv('dry'),ne:P.rly.ENEED('rectfail')};S.inc.forEach(i=>{if(i.id==='rectfail')i.left=0});P.step(P.SIM_STEP);return r}""")
    ok("13.8 kV feeder and ~650 V DC buses; a rectifier fault drops its lineup's bus and stops the machine (electrical tech)", abs(r["mv"] - 13.8) < 0.3 and 620 < r["dc"] < 680 and r["dc2"] == 0 and r["dcSP"] > 600 and r["pm"] and r["st"] == "nodc" and r["ne"], json.dumps(r))
    answer()

    # AUTO-LW: more refining, the weight comes down; back to standard, it goes back up
    r = J("""()=>{const P=__PM,S=P.S;S.inc.forEach(i=>i.left=0);P.CH.on=false;const run=m=>{let n=0;while(n<m/P.SIM_STEP){P.step(P.SIM_STEP);if(!S.chg&&S.pm==='run')n++;}};P.knob.set('ref',85);run(600);const chg=!!S.chg,lo=S.we.trim;P.knob.set('ref',60);run(700);return {lo,back:S.we.trim,chg}}""")
    ok("AUTO-LW trims the weight down with ring crush to spare and back up without it", r["lo"] < -0.05 and r["back"] > -0.01 and r["back"] <= 0, json.dumps(r))

    # click for info
    r = J("""()=>{const D=__PM.G3.diagScene(),T=__PM.THREE,rc=D.renderer.domElement.getBoundingClientRect(),sc=(x,y,z)=>{const v=new T.Vector3(x,y,z).project(D.camera);return [rc.left+(v.x+1)/2*rc.width,rc.top+(1-v.y)/2*rc.height];};
      const g=__PM.G3.camGet();__PM.G3.camSet([20,0,90,g[3],g[4]]);return 1}""")
    pg.wait_for_timeout(1500)
    r = J("""()=>{const D=__PM.G3.diagScene(),T=__PM.THREE,rc=D.renderer.domElement.getBoundingClientRect(),sc=(x,y,z)=>{const v=new T.Vector3(x,y,z).project(D.camera);return {clientX:rc.left+(v.x+1)/2*rc.width,clientY:rc.top+(1-v.y)/2*rc.height};};
      const f=__PM.G3.followable()[0];__PM.G3.infoTap(sc(f.position.x,1.1,f.position.z));const a=document.getElementById('infoPop').textContent;
      __PM.G3.infoTap(sc(60.6,3,-11));const b=document.getElementById('infoPop').textContent;return {a:a.slice(0,90),b:b.slice(0,120)}}""")
    ok("click for info: an operator (name, team) and the refiners (readings and reliability)", "operator" in r["a"] and "team" in r["a"] and "Refiner" in r["b"] and "kWh/t" in r["b"], json.dumps(r))
    if shot: pg.screenshot(path=f"{shot}-info.png")

    # arc-flash PPE: the electrical tech walks in from outside and is suited inside the MCC
    r = J("""()=>{const P=__PM,E=P.G3.ET;P.G3.elecSuit(false);E.w.position.set(2,0,20);let now=performance.now(),door=false;for(let i=0;i<500;i++){now+=100;P.G3.navPump&&P.G3.navPump();P.G3.elecUpdate(0.1,now);if(E.suited&&E.w.position.x>2&&E.w.position.x<5.6&&Math.abs(E.w.position.z-27.5)<0.6)door=true;}
      const S=P.S,I=S.inc.length;P.rly.fail('pr1','drv');P.step(P.SIM_STEP);for(let i=0;i<300;i++){now+=100;P.G3.elecUpdate(0.1,now);}const job=!!E.suited;S.inc.forEach(i=>{if(i.id==='drivefail')i.left=0});S.inc=S.inc.filter(i=>i.id!=='drivefail');S.rel.q.length=0;S.rel.cur=null;S.cards.open=null;
      for(let i=0;i<300;i++){now+=100;P.G3.elecUpdate(0.1,now);}
      return {in:E.w.position.x>4&&E.w.position.z>24,door,job,desk:!E.suited}}""")
    ok("arc-flash PPE: on at the MCC door, on for a drive job that starts while he's inside, off back at the desk", r["in"] and r["door"] and r["job"] and r["desk"], json.dumps(r))

    # zen: none of it
    r = J("()=>{const P=__PM;P.S.zen=true;const on=P.rly.on();P.S.zen=false;return on}")
    ok("zen has no reliability rounds", r is False)
    ok("no page errors", not errs, errs[:3])
    b.close()
print("\n".join(log)); print("FAILED" if any(l.startswith("FAIL") for l in log) else "ALL PASS")
