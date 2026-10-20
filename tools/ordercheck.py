"""v6.6 check: the order book, base-load energy while the machine is stopped, and bale grading at receiving.
Usage: python3 ordercheck.py <index.html>
Plays a season through the sim (no 3D) and checks each mechanic against the books, then zen mode (unchanged behaviour)."""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
src = open(HERE / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
exec("def pick_leader" + src.split("def pick_leader")[1].split("def stats")[0])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
# test copy only: reach the v6.6 functions and constants
html = html.replace("window.__PM={", "window.__PM={get OX(){return {ORD,BALE,BASEL,ordState,ordAssign,ordDepart,ordFree,ordNeed,fgOf,baleGrade,baleGate,baleUnload,baleFeed,bqState,baseLoadTick,priceOf,energyCost,pfChemT,outOn,ordOn,GRADES,P,C}},", 1)
errs, fails = [], []
def ok(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name + (" " + json.dumps(extra) if extra != "" else ""))
    if not cond: fails.append(name)
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 900, "height": 640})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=120000, polling=100)
    pg.evaluate("""()=>{const P=__PM;P.setRunning(false);if(P.G3)P.G3.on=false;
      window.__run=(m,f)=>{const S=P.S,h=P.SIM_STEP||0.25,t1=S.t+m;while(S.t<t1-1e-9){P.step(h);if(f)f();const o=S.cards&&S.cards.open;
        if(o){if(o.outage){const b=document.getElementById('out-ok');if(b)b.click();}S.cards.open=null;['dealOv','outOv','seasonOv','civOv','rcOv'].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true;});}
        if(S.civ&&S.civ.cur)S.civ.cur=null;}};}""")

    # --- 1. the book at the start
    r = pg.evaluate("()=>{const O=__PM.S.ord;return {n:O.list.length,open:O.list.filter(o=>o.st==='open').length,g:[...new Set(O.list.map(o=>o.g))],sizes:O.list.map(o=>o.r)}}")
    ok("orders booked for the opening campaign and stock", r["open"] >= 5, r["n"])
    ok("order sizes within the limits", all(6 <= s <= 40 for s in r["sizes"]), r["sizes"][:10])

    # --- 2. a few days: every truck carries one grade; revenue = invoices (list less chargeback, or less the spot discount)
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX;let mixed=0,bad=0,n=0,maxd=0;const seen=new Set();
      const rev0=S.ledger.rev;let inv=0;const od=X.ordDepart;
      __run(6*1440,()=>{for(const tr of S.leaving){if(tr.kind!=='out'||seen.has(tr.id)||!tr.lots)continue;seen.add(tr.id);n++;
        const gs=new Set(tr.lots.map(l=>l[0]));if(gs.size>1)mixed++;}});
      const O=S.ord;return {n,mixed,done:O.k.done,ship:O.k.ship,onT:O.k.onT,lateT:O.k.lateT,spot:O.k.spot,open:O.list.filter(o=>o.st==='open').length,
        ledger:S.ledger.rev-rev0}}""")
    ok("trucks left with paper", r["n"] > 5, r["n"])
    ok("every outbound truck carries one grade", r["mixed"] == 0, r)
    ok("orders delivered", r["done"] > 3, r["done"])

    # --- 3. invoice arithmetic: a late order pays list less the chargeback; a spot load list less the discount
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX,rw=X.C.rollW.v;const g=X.C.grade,pr=X.priceOf(g);
      const O=X.ordState();const o={id:++O.n,c:0,g,r:10,ld:10,sh:0,due:S.t-2.5*1440,t0:S.t-5*1440,st:'open'};O.list.push(o);
      let r0=S.ledger.rev;X.ordDepart({oid:o.id,g,want:10,load:10,spot:false});const late=S.ledger.rev-r0;
      r0=S.ledger.rev;X.ordDepart({oid:0,g,want:10,load:10,spot:true});const spot=S.ledger.rev-r0;
      const o2={id:++O.n,c:1,g,r:10,ld:10,sh:0,due:S.t+1440,t0:S.t,st:'open'};O.list.push(o2);r0=S.ledger.rev;X.ordDepart({oid:o2.id,g,want:10,load:10,spot:false});const ont=S.ledger.rev-r0;
      return {late,spot,ont,exp_late:10*rw*(pr-Math.min(X.ORD.lateCap,X.ORD.late*3)),exp_spot:10*rw*(pr-X.ORD.spot),exp_ont:10*rw*pr,st:o.st,st2:o2.st}}""")
    ok("late order invoiced at list less the chargeback (3 days: $45/t)", abs(r["late"] - r["exp_late"]) < 1, r)
    ok("spot load invoiced at list less the spot discount", abs(r["spot"] - r["exp_spot"]) < 1)
    ok("on-time order at list, and marked delivered", abs(r["ont"] - r["exp_ont"]) < 1 and r["st2"] == "done")

    # --- 4. cancellation: an order 4+ days late is cancelled
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX,O=X.ordState();const o={id:++O.n,c:2,g:'28',r:20,ld:0,sh:0,due:S.t-4.2*1440,t0:S.t-6*1440,st:'open'};O.list.push(o);
      const c0=O.k.canc;__run(5);return {st:o.st,canc:O.k.canc-c0}}""")
    ok("an order 4 days late is cancelled", r["st"] == "cancelled" and r["canc"] == 1, r)

    # --- 5. a truck with nothing to load waits in the queue and leaves on a dry run
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX,O=X.ordState();P.C.outRate.auto=false;P.C.outRate.v=0;
      const keep=S.lots.fg.map(l=>l.slice()),fg=S.fg;S.lots.fg.length=0;S.fg=0;S.outDock.fill(null);S.outQ.length=0;
      // (the machine keeps making paper while the truck waits: since the order book (v6.6) a truck in the queue is sent to a
      //  door as soon as an order or a spot load is ready, so a 6.5 h wait at full speed found a load (or was still loading)
      //  and never ran dry. The warehouse is kept empty for the whole wait; made counts the rolls that would have loaded it)
      let made=0;const fr0=S.ledger.frout,d0=O.k.dry;S.outQ.push({id:99901,load:0});
      __run(X.ORD.dryWait+30,()=>{if(S.fg>0){made+=S.fg;S.lots.fg.length=0;S.fg=0;}});
      const res={dry:O.k.dry-d0,fee:S.ledger.frout-fr0,q:S.outQ.length,made:Math.round(made)};S.lots.fg=keep;S.fg=fg;P.C.outRate.auto=true;return res}""")
    ok("an empty-handed truck leaves after the wait with a dry-run fee", r["dry"] == 1 and r["fee"] >= 299 and r["q"] == 0, r)

    # --- 6. base load: charged while stopped, not while running
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX;const pm=S.pm;
      const e=()=>S.ledger.energy;S.pm='run';let a=e();X.baseLoadTick(60);const run=e()-a;
      S.pm='break';a=e();X.baseLoadTick(60);const brk=e()-a;S.pm='down';a=e();X.baseLoadTick(60);const stop=e()-a;S.pm=pm;
      const g=X.GRADES[X.C.grade],tph=X.P.K*g.sp*g.bw,en=Math.max(0,X.energyCost()-X.pfChemT());return {run,brk,stop,full:en*tph}}""")
    ok("no base load while running", r["run"] == 0, r)
    ok("a sheet break draws power (machine turning) but not idle steam", 0.3 < r["brk"] / r["full"] * 2.5 < 1.0, r)
    ok("a stop draws power and banked-boiler steam, less than running", 0 < r["stop"] < 0.5 * r["full"], r)
    r = pg.evaluate("()=>{const S=__PM.S;return {idle:S.tot.idleE||0,pf:S.pf&&S.pf.A&&S.pf.A.power?Object.keys(S.pf.A.power):[]}}")
    ok("idle energy has built up over the season and is placed by area", r["idle"] > 1000, r)

    # --- 7. bale grading
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX;const Q=X.bqState(),wx=S.wx;let cnt={A:0,C:0,M:0},mx=0,rej=0;const r0=Q.rej;
      // (v6.8.3: baleGrade picks the kind furthest below its recipe share, counting the piles and the trucks already in
      //  S.inQ, so each graded load is queued as the game would before the next is drawn; the queue is put back after)
      const q0=S.inQ.length;
      for(let i=0;i<2000;i++){const t=X.baleGrade({id:i,load:220});S.inQ.push(t);cnt[t.q]++;mx+=t.m;if(X.baleGate(t))rej++;}
      S.inQ.length=q0;const rec={...Q.rec},n=rec.A+rec.C+rec.M,dev=Math.max(...['A','C','M'].map(k=>Math.abs(cnt[k]/2000-rec[k]/n)));
      const dry={m:0.10,k:0,pf:1},wet={m:0.18,k:0,pf:(1-0.18)/(1-X.BALE.allow)};
      const o0=S.ledger.occ;Q.m=0.10;Q.k=0;const paidDry=X.baleUnload(dry,100,0);const paidWet=X.baleUnload(wet,100,0);
      Q.m=0.10;const f1=X.baleFeed();Q.m=0.16;const f2=X.baleFeed();Q.k=0.5;const f3=X.baleFeed();
      return {cnt,rec,dev,mean_m:mx/2000,rej,rejC:Q.rej-r0,paidDry,paidWet,sf1:f1.sf,sf2:f2.sf,yk3:f3.yk}}""")
    ok("loads follow the OCC recipe: A, C and Mixed Waste all arrive in the recipe's shares (v6.8.3)", all(r["cnt"].get(k, 0) > 0 for k in "ACM") and sum(r["cnt"].values()) == 2000 and r["dev"] < 0.03, {"cnt": r["cnt"], "rec": r["rec"], "dev": r["dev"]})
    # (v6.8.3: Mixed Waste replaced the old junk C grade and is bought on purpose; baleGate turns nothing away)
    ok("no load turned away at the gate (v6.8.3)", r["rej"] == 0 and r["rejC"] == 0, r)
    ok("a dry load is paid in full; a wet one at air-dry weight", abs(r["paidDry"] - 100) < 1e-6 and abs(r["paidWet"] - 100 * (0.82 / 0.88)) < 1e-6, r)
    ok("water over 10% is not fiber; contamination costs yield", r["sf1"] == 1 and abs(r["sf2"] - 0.94) < 1e-9 and r["yk3"] < 1, r)
    # stickies raise the break odds: compare the mods with clean and dirty stock in the chest
    r = pg.evaluate("""()=>{const S=__PM.S,X=__PM.OX,Q=X.bqState();const k0=Q.ck;Q.ck=0;__run(0.25);const a=S.M.breakMul;Q.ck=0.5;Q.k=0.5;__run(0.25);const b=S.M.breakMul;Q.ck=k0;return {a,b}}""")
    ok("stickies in the chest raise the break odds", r["b"] > r["a"] * 1.3, r)

    # --- 8. the rest of the season plays out, the panel renders
    r = pg.evaluate("""()=>{const S=__PM.S;__run(Math.max(0,S.season.end-S.t-30));const O=S.ord,K=O.k;
      return {day:S.t/1440,done:K.done,onTime:K.onT/Math.max(1,K.onT+K.lateT),spot:K.spot,canc:K.canc,dry:K.dry,fg:S.fg,cash:S.cash}}""")
    pg.wait_for_timeout(1500)
    ok("season played to the last day", r["day"] > 29, r)
    ok("on-time delivery for a hands-off mill is high but not perfect", 0.6 < r["onTime"] <= 1, r)
    # (v6.8.1: the Report tab's Orders & bales panel is retired; the control room's Planning screen shows the order book)
    pg.evaluate("()=>__PM.G3.openStation('PLAN')"); pg.wait_for_timeout(1500)
    h = pg.evaluate("()=>{const b=document.getElementById('planBox');return b?b.innerText:''}")
    pg.evaluate("()=>{const x=document.getElementById('dcsClose');if(x)x.click();}")
    ok("Planning screen shows the order book and the bale yard", "on-time delivery" in h.lower() and "bale yard" in h.lower(), h[:120])

    # --- 9. zen: no orders, no idle energy, no bale effects
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,X=P.OX;S.zen=true;const e0=S.ledger.energy,pm=S.pm;S.pm='down';X.baseLoadTick(60);const idle=S.ledger.energy-e0;S.pm=pm;
      const f=X.baleFeed();const on=X.ordOn();S.zen=false;return {idle,sf:f.sf,yk:f.yk,on}}""")
    ok("zen: no idle energy, standard bales, no order book", r["idle"] == 0 and r["sf"] == 1 and r["yk"] == 1 and not r["on"], r)
    ok("no page errors", not errs, errs[:5])
    b.close()
print("\nRESULT", "ok" if not fails else "FAILED: " + ", ".join(fails))
