import pathlib, sys
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text(); out=sys.argv[2]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width":1100,"height":760})
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
    pg.goto("http://bench.local/"); pg.wait_for_function("window.__B&&__B.first!==null", timeout=240000); pg.wait_for_timeout(800)
    pg.evaluate("()=>document.getElementById('v2go').click()")
    pg.wait_for_function("!!document.querySelector('#leadOv:not([hidden]) .ldcard')", timeout=240000)
    pg.evaluate("()=>{document.querySelector('#leadOv .ldcard[data-l=hank]').click();document.getElementById('ld-go').click();}")
    pg.wait_for_function("__PM.S.lead&&__PM.S.season&&__PM.S.season.on", timeout=240000)
    pg.evaluate("()=>{const P=__PM;P.G3.on=false;P.S.cards.next=1e12;for(let i=0;i<4*60*24*7;i++){P.step(0.25);if(P.S.cards.open)P.S.cards.open=null;}P.S.profitRate=-181000;P.S.cash=1234567;}")
    for w in (360,):
        pg.set_viewport_size({"width":w,"height":844}); pg.wait_for_timeout(2500); pg.evaluate("()=>{const g=document.querySelector('#v2stats .gbadge');g.hidden=false;g.innerHTML='<b>C</b><small>grade</small>'}"); pg.wait_for_timeout(300)
        r = pg.evaluate("""()=>{const o={};document.querySelectorAll('#v2stats .st b').forEach((b,i)=>o[i]=[b.textContent,b.scrollWidth>b.clientWidth+1]);
          const g=document.querySelector('#v2stats .gbadge');o.gb=g&&!g.hidden;o.cv=[...document.querySelectorAll('.civbar .cv')].map(c=>Math.round(c.getBoundingClientRect().right));return o}""")
        print(w, r); pg.screenshot(path=f"{out}-{w}.png", clip={"x":0,"y":0,"width":w,"height":170})
