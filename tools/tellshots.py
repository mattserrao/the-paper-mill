"""v5.7: screenshots of every round area with all its tells queued, mid-walk (phone or desktop viewport).
Usage: python3 tellshots.py <index.html> <outdir> [phone]"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text(); out = pathlib.Path(sys.argv[2]); out.mkdir(exist_ok=True)
phone = len(sys.argv) > 3
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    vp = {"width": 390, "height": 760} if phone else {"width": 1000, "height": 640}
    pg = b.new_page(viewport=vp, device_scale_factor=1, has_touch=phone, is_mobile=phone); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:300])); pg.on("console", lambda m: m.type == "error" and errs.append("console: " + m.text[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave")
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()")
    pick_leader(pg, "dot")
    pg.evaluate("()=>{__PM.setRunning(false);const S=__PM.S;S.cards.next=1e12;while(S.t<4*1440)__PM.step(__PM.SIM_STEP);if(S.civ){S.civ.q=[];S.civ.cur=null;}S.cards.open=null;document.querySelectorAll('.overlay').forEach(o=>{if(!o.classList.contains('tellov'))o.hidden=true});__PM.C.simSpeed=1;}")
    for a in json.loads(pg.evaluate("()=>JSON.stringify(__PM.tell.areas.map(a=>a.k))")):
        pg.evaluate("""a=>{const P=__PM,S=P.S,T=S.tell;T.q=T.q.filter(p=>p.area!==a);T.day=-1;
          for(const id of P.tell.areas.find(x=>x.k===a).ids)T.q.push({id,due:S.t+3000,born:S.t,area:a});
          if(S.civ){S.civ.q=[];S.civ.cur=null;S.civ.pending=null;}S.cards.open=null;document.querySelectorAll('.overlay').forEach(o=>o.hidden=true);
          P.setRunning(true);P.G3.tellRoundUI(a);}""", a)
        for i, f in enumerate([0.1, 0.5, 0.9]):
            pg.evaluate("""f=>{const G=__PM.G3;G.tellSeek(f);}""", f); pg.wait_for_timeout(1200)
            pg.evaluate("""()=>{const G=__PM.G3,o=G.tellOp(),c=G.camGet();G.tellHold();G.camSet([o[0],o[1],58,c[3],0.62]);if(__PM.S.civ){__PM.S.civ.q=[];__PM.S.civ.cur=null;}__PM.S.cards.open=null;document.querySelectorAll('.overlay').forEach(o=>o.hidden=true);__PM.setRunning(true);}""")
            pg.wait_for_timeout(9000)
            pg.screenshot(path=str(out / f"round-{a}-{i}.png"))
        r = pg.evaluate("""a=>{const G=__PM.G3;return G.tellKits().filter(id=>__PM.tell.areas.find(x=>x.k===a).ids.includes(id)).map(id=>[id,G.tellScreen(id)])}""", a)
        print(a, json.dumps(r))
        pg.evaluate("()=>{__PM.G3.tellRoundStop();__PM.setRunning(false);}")
        pg.wait_for_timeout(300)
    pg.evaluate("()=>{__PM.S.tell.day=-1;__PM.G3.tellOpen();}")
    pg.wait_for_timeout(500); pg.screenshot(path=str(out / "card.png"))
    print("ERRORS:", errs)
    b.close()
