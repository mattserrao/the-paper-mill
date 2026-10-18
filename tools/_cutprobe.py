import pathlib, sys, json, collections
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.wait_for_timeout(8000)
    pg.evaluate("()=>{window.__K0=new Set(__PM.G3.CUT.cells.keys());window.__NEW=[];const C=__PM.G3.CUT,s=C.cells.set.bind(C.cells);C.cells.set=(k,v)=>{if(!__K0.has(k))__NEW.push([performance.now()|0,k]);return s(k,v);};}")
    views=[[-14,5,380],[10,5,190],[-28,-6,95],[30,-10,95],[-20,20,95],[12,9,63],[-40,-18,63]]
    for rep in range(int(sys.argv[2]) if len(sys.argv)>2 else 3):
        for v in views:
            pg.evaluate("()=>{document.querySelectorAll('#evc:not([hidden]) button').forEach((x,i)=>{if(i===0)x.click();});const c=document.querySelector('#civOv .civbtn');if(c&&!document.getElementById('civOv').hidden)c.click();const d=document.getElementById('dealOv');if(d&&!d.hidden){const n=document.getElementById('deal-no');if(n)n.click();}const o=document.getElementById('out-ok');if(o&&o.offsetParent)o.click();__PM.setRunning(true);__PM.C.simSpeed=20;}")
            pg.evaluate("v=>__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955])", v); pg.wait_for_timeout(7000)
    r = pg.evaluate("()=>({n0:__K0.size,cells:__PM.G3.CUT.cells.size,day:__PM.S.t/1440,neu:__NEW})")
    print("stats",pg.evaluate("()=>__PM.G3.CUT.stats()"));print("start",r["n0"],"now",r["cells"],"day",round(r["day"],2),"new",len(r["neu"]),"errors",errs[:2])
    kinds=collections.Counter(k.split(":")[0] for t,k in r["neu"]); print(kinds)
    # pose-only? same base (before |) already present in start set
    base0=set(); 
    allk=pg.evaluate("()=>[...__K0]")
    for k in allk: base0.add(k.split("|")[0].split("#")[0])
    po=sum(1 for t,k in r["neu"] if k.split("|")[0].split("#")[0] in base0); print("pose-only variants of known looks",po)
    for t,k in r["neu"][:40]: print(t,k[:150])
    b.close()
