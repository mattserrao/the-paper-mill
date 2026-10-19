"""v6.7.1 grade-set check: a season saved by a build with the old grade ids continues on this build with the new ones.
Usage: python3 migcheck.py <old index.html> <new index.html>
The old build plays two days on its heavy board grade, takes a rush order and a price perk, and saves; the new build
continues that save. Every grade id in the restored state must be one of the new set, and two more days must play
without a page error."""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
def hook(h):
    # (always: the page may carry its own __PM without GRADES; this one, added last, wins)
    i = h.rindex("})();", 0, h.rindex("</script>")); return h[:i] + HOOK.replace("trigger:", "get GRADES(){return GRADES},trigger:") + h[i:]
old, new = (hook(pathlib.Path(a).read_text()) for a in sys.argv[1:3])
log, errs = [], []
def ok(n, c, x=""): log.append(("PASS " if c else "FAIL ") + n + (f"  ({x})" if x else ""))
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    ctx = b.new_context(viewport={"width": 800, "height": 450})
    def page(html):
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
        pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300); return pg
    pg = page(old)
    pg.evaluate("()=>{document.getElementById('v2go').click()}"); pick_leader(pg)
    pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;}")
    g0 = pg.evaluate("""()=>{const P=__PM,S=P.S,ids=Object.keys(P.GRADES||{});const hv=ids[ids.length-1];
      P.C.grade=hv;S.perk.price[hv]=15;S.perk.sp[ids[0]]=60;S.plan.q.unshift({g:hv,t:900,i:3});
      for(let k=0;k<2*1440*4;k++){P.step(0.25);if(P.S.cards.open)P.S.cards.open=null;}
      __PM.G3.save.save('test');return [ids,P.C.grade,localStorage.getItem('paper-mill-save').length]}""")
    print("old build grades, running, save bytes:", g0)
    sv = pg.evaluate("()=>[localStorage.getItem('paper-mill-save'),localStorage.getItem('paper-mill-save-hist')]")
    pg.close()
    oldIds = g0[0]
    ok("the old save carries the old grade ids", any(f'"{g}"' in sv[0] for g in oldIds))
    pg = page(new)
    pg.evaluate("s=>{localStorage.setItem('paper-mill-save',s[0]);if(s[1])localStorage.setItem('paper-mill-save-hist',s[1]);}", sv)
    pg.reload(); pg.wait_for_function("window.__PM&&__PM.G3.warm", timeout=240000, polling=300)
    ok("Continue is offered for the old save", pg.evaluate("()=>!!document.getElementById('v2cont')"))
    pg.evaluate("()=>{__PM.G3.saveOff=true;document.getElementById('v2cont').click();__PM.setRunning(false);}")
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,ids=Object.keys(P.GRADES);const j=JSON.stringify({S:Object.assign({},S,{hist:null}),C:P.C});
      return {ids,grade:P.C.grade,price:S.perk.price,sp:S.perk.sp,q0:S.plan.q[0]&&S.plan.q[0].g,
        lots:[...new Set(Object.values(S.lots).flat().map(x=>x[0]))],str:j}}""")
    ids = r["ids"]
    ok("running grade mapped to the new set", r["grade"] == ids[-1], r["grade"])
    ok("price and speed perks follow the grade", r["price"].get(ids[-1]) == 15 and r["sp"].get(ids[0]) == 60, f'{r["price"]} {r["sp"]}')
    ok("queued order follows the grade", r["q0"] in ids, r["q0"])
    ok("roll lots carry new grade ids", all(g in ids or g == "beater" for g in r["lots"]), r["lots"])
    ok("no old grade id left in the restored state", not any(f'"{g}"' in r["str"] for g in oldIds))
    a = pg.evaluate("""()=>{const P=__PM;const t0=P.S.tot.prodT;for(let k=0;k<2*1440*4;k++){P.step(0.25);if(P.S.cards.open)P.S.cards.open=null;}
      return [Math.round(P.S.tot.prodT-t0),Math.round(P.S.cash),P.C.grade]}""")
    ok("two more days play on the new build", a[0] > 500, a)
    b.close()
ok("no page errors", not errs, errs[:3])
print("\n".join(log)); print(f"{sum(l.startswith('PASS') for l in log)}/{len(log)} passed")
