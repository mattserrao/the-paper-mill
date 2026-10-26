"""Save/continue checks (v4.2 save test): a saved run continues exactly (same cash, upsets, breaks, clock, pending card
outcomes and felt grade two days later as the uninterrupted run), the menu offers Continue, a hidden page saves and
pauses (and shows "Welcome back" on return), and a corrupt or old-version save is ignored (no Continue button).
Replaces tools/savecheck.py (which only printed; tools/savecheck51.py was an outdated copy).
Usage: python3 save.py [index.html]"""
# tier: quick
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log

STEP = "(n)=>{const P=__PM;for(let k=0;k<n;k++)P.step(0.25);const S=P.S;return [Math.round(S.cash),S.tot.incidents,S.tot.breaks,Math.round(S.t),S.cards.pend.length,Math.round(S.fg)]}"
Q = "?" + LITE   # sim-only: the save/continue path does not depend on the 3D tier

def save(pw):
    C.sec("save")
    html = html_arg()
    b = launch(pw)
    ctx = b.new_context(viewport={"width": 800, "height": 450})   # one context: the pages share localStorage
    def page():
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:200]))
        pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/" + Q)
        pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300); return pg
    pg = page()
    pg.evaluate("()=>{document.getElementById('v2go').click()}")
    ok("season starts", pick_leader(pg))   # (v5.6: the v5.1 leader picker)
    pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;}")
    # play 3 days with upsets and accept every card that comes up, so pending outcomes exist
    pg.evaluate("""()=>{const P=__PM;for(let k=0;k<3*1440*4;k++){if(k%1500===0)P.S.cards.next=P.S.t;P.step(0.25);const o=P.S.cards.open;if(o&&o.c){document.getElementById('deal-yes').click();P.setRunning(false);}else if(o)P.S.cards.open=null;}}""")
    st = pg.evaluate("()=>[__PM.S.cards.pend.map(p=>p.h),__PM.S.fx.map(f=>f.id),Math.round(__PM.S.t)]")
    C.note("before save: pending", st)
    ok("pending card outcomes exist before the save (so the save carries them)", len(st[0]) > 0, st[0])
    # save and play on in one evaluate: a live frame between the two (autosave or UI tick) could shift the run under load
    ms = pg.evaluate("(n)=>{const ok=__PM.G3.save.save('test');window.__sv=localStorage.getItem('paper-mill-save');const ms=__PM.G3.saveMs;return [ok,ms,window.__sv.length,(" + STEP + ")(n)]}", 2 * 1440 * 4)
    ok("save succeeds", ms[0] is True and ms[2] > 1000, f"ok={ms[0]} {ms[1]:.1f} ms {ms[2]} bytes")
    a = ms[3]; C.note("uninterrupted day 5:", a)
    pg.evaluate("()=>{__PM.G3.saveOff=true;localStorage.setItem('paper-mill-save',window.__sv);}")   # (the autosave has moved on since: put the test save back)
    pg.close()

    pg = page()
    has = pg.evaluate("()=>!!document.getElementById('v2cont')&&document.getElementById('v2cont').textContent")
    ok("menu shows a Continue button", bool(has) and "Continue" in has, has)
    # click and pause in one go: waiting for running===true first let a frame or two of sim slip in (a flaky DIFFER)
    r = pg.evaluate("(n)=>{document.getElementById('v2cont').click();const was=__PM.running;__PM.setRunning(false);return [was,(" + STEP + ")(n)]}", 2 * 1440 * 4)
    ok("Continue starts the game", r[0] is True)
    bb = r[1]; C.note("restored day 5:", bb)
    ok("restored run continues exactly like the uninterrupted one", a == bb, f"{a} vs {bb}")

    # hidden page: save + pause + welcome back
    # run + hide in one evaluate: a live frame in between could open a card and pause, so the hide would not count as a pause
    # read the result in the same evaluate: a UI tick in between (paused or not) may write its own "tick" save over it
    h = pg.evaluate("()=>{__PM.S.cards.next=1e12;__PM.S.cards.open=null;__PM.setRunning(true);Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));return [__PM.running,JSON.parse(localStorage.getItem('paper-mill-save')).why]}")
    ok("hidden page pauses", h[0] is False)
    ok("hidden page saves (why=hidden)", h[1] == "hidden", h[1])
    w = pg.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));return [!document.getElementById('v2menu').hidden,document.getElementById('v2state').textContent]}")
    ok("back on the page: menu shown with Welcome back", w[0] and "Welcome back" in w[1], w)
    pg.close()

    # a corrupt save and an old version: the game must start normally with no Continue
    for bad in ['"{not json"', 'JSON.stringify({v:0,S:{}})']:
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:200]))
        pg.route("**/*", route_for(html)); pg.goto("http://bench.local/" + Q)
        pg.evaluate(f"()=>localStorage.setItem('paper-mill-save',{bad})"); pg.reload()
        pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300)
        ok(f"bad save {bad[:22]} -> game starts, no Continue button", not pg.evaluate("()=>!!document.getElementById('v2cont')"))
        pg.close()
    b.close()

# v6.13.2 Real Numbers: a save from before (kPa steam, kPa cleaner ΔP, old ring crush, no S.u) is converted once on load
# and carries on exactly as the same run born in the new units. The old save is made by un-converting a new one (07o in
# reverse), with the steam loops touched and a cleaner on manual so every converted field is in play.
UNCONV = """(snap)=>{const d=JSON.parse(snap),S=d.S,k=0.6,KP=0.145038,mul=(o,f,ks)=>{if(o)for(const n of ks)if(typeof o[n]==="number")o[n]/=f;};
  delete S.u;mul(S.dry,k,["st3","dem","dem0","maxDem","man"]);if(S.knob&&S.knob.v&&S.knob.v.st1!=null)S.knob.v.st1/=k;
  if(S.stm){S.stm.dp=S.stm.dp.map(v=>v/KP);if(S.stm.sp4!=null)S.stm.sp4/=KP;}
  const W=S.vlv;if(W&&W.lp){for(const [id,f] of [["PV-302",k],["PV-303",k],["PDC-304",KP]]){const L=W.lp[id];if(!L)continue;mul(L,f,["sp","y","pvm","pvf","pvp"]);L.dq=L.dq.map(v=>v/f);}
    if(W.st3!=null)W.st3/=k;if(W.B){mul(W.B,k,["dem","ceil","st3"]);mul(W.B,KP,["tcmax"]);}}
  const O={hd:[35,95,15,40],lc:[60,120,25,50],lw:[45,105,20,45]};for(const c in S.dcs.pg){const p=S.dcs.pg[c],o=O[c];p.dp=o[0]+(p.dp-o[2])*(o[1]-o[0])/(o[3]-o[2]);}
  if(S.we)S.we.fs/=KP;return JSON.stringify(d);}"""
# (t3: the steam loops restart bumpless on the new span after the conversion, so the 3rd section can drift a few tenths
# of a psig from the run that never converted; tons, moisture and the cleaner stay exact)
# v6.13.2-t3: a t1/t2 save (S.u 2: the 3rd section's number a load on a psig scale) back from a t3 one (07o unitsMigrate3 in reverse)
UNCONV3 = """(snap)=>{const d=JSON.parse(snap),S=d.S,Y=__PM.G3.dryP,D=S.dry;S.u=2;
  D.st3=D.h3;delete D.h3;if(typeof D.man==="number")D.man=Y.hp(D.man);
  {const v=S.knob.v.st1;S.knob.v.st1=v>40?42+(v-40)/60*108:v*42/40;}
  const W=S.vlv;if(W&&W.lp){const mp={"PV-303":v=>Y.hp(v),"PV-302":v=>Y.hp(v,1)*0.8};
    for(const id in mp){const L=W.lp[id];if(!L)continue;const f=mp[id];for(const n of ["sp","y","pvm","pvf"])if(typeof L[n]==="number")L[n]=f(L[n]);L.dq=L.dq.map(f);}
    const Q=W.lp["QC-300"];if(Q)Q.op=Y.hp(Q.op*3)/1.8;if(W.st3!=null)W.st3=Y.hp(W.st3);
    if(W.B){W.B.st3=Y.hp(W.B.st3);W.B.ceil=108;delete W.B.pcap;delete W.B.pcap2;delete W.B.g;}}
  return JSON.stringify(d);}"""
def units(pw):
    C.sec("units")
    b = launch(pw); pg = open_game(b, html_arg(), "notitle&nosave&" + LITE, viewport=(640, 400), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    snap = pg.evaluate("""()=>{const P=__PM,S=P.S,V=P.G3.vlv;P.setRunning(false);P.CH.on=false;while(S.t<1440)P.step(0.25);
      V.touch('PV-303');V.setMode('PV-303','AUTO');V.setSP('PV-303',69);P.knob.set('st1',48);P.G3.dcs.purgeSet('lc','manual');for(let i=0;i<120;i++)P.step(0.25);
      return JSON.stringify({v:1,S,C:P.C,CH:{on:false,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:2,cash:S.cash});}""")
    RUN = """(s)=>{const P=__PM;P.G3.save.restore(JSON.parse(s));P.setRunning(false);P.CH.on=false;const S=P.S,a={u:S.u,st3:S.dry.st3,st1:S.knob.v.st1,sp:S.vlv.lp['PV-303'].sp,dp:S.stm.dp[2],lc:S.dcs.pg.lc.dp};
      for(let i=0;i<4*240;i++)P.step(0.25);return Object.assign(a,{prod:S.tot.prodT,m:S.dry.m,st3b:S.dry.st3,lcb:S.dcs.pg.lc.dp});}"""
    new = pg.evaluate(RUN, snap)
    u2 = pg.evaluate(UNCONV3, snap)
    t2 = pg.evaluate(RUN, u2)
    old = pg.evaluate(RUN, pg.evaluate(UNCONV, u2))
    near = lambda x, y, t=1e-6: abs(x - y) <= t * max(1, abs(y))
    for nm, o in (("a t1/t2 save (S.u 2)", t2), ("a pre-v6.13.2 save (no S.u)", old)):
        ok(f"{nm} is converted once on load (S.u 3), to the same pressures as the new one", o["u"] == 3 and all(near(o[k], new[k]) for k in ("st3", "st1", "sp", "dp", "lc")), json.dumps({k: [o[k], new[k]] for k in ("u", "st3", "st1", "sp", "dp", "lc")}))
        ok(f"{nm}, converted, carries on as the new one: tons, moisture, steam and the cleaner on manual", near(o["prod"], new["prod"], 1e-4) and abs(o["m"] - new["m"]) < 0.02 and near(o["st3b"], new["st3b"], 1e-2) and near(o["lcb"], new["lcb"], 1e-4), json.dumps({k: [o[k], new[k]] for k in ("prod", "m", "st3b", "lcb")}))
    b.close()
with sync_playwright() as pw:
    for f in (save, units):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()      # page errors fail the check
