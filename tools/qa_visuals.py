import pathlib, sys
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text().replace("window.__PM={", "window.__PM={trigger:(i,q)=>trigger(i,q),", 1)
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
SP="/tmp/claude-0/-home-claude/1d0fb052-7a76-5766-bfa8-faf7676d4b04/scratchpad/qa13/vis-"
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2surv').click()"); pick_leader(pg)
    def go(name, cam, setup="()=>{}", wait=6000):
        pg.evaluate(setup); pg.evaluate("v=>{__PM.setRunning(true);__PM.C.simSpeed=1;__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955]);}", cam); pg.wait_for_timeout(wait)
        for _ in range(3):
            pg.evaluate("()=>{document.querySelectorAll('#evc:not([hidden]) button').forEach((x,i)=>{if(i===0)x.click();});const c=document.querySelector('#civOv .civbtn');if(c&&!document.getElementById('civOv').hidden)c.click();const d=document.getElementById('dealOv');if(d&&!d.hidden){const n=document.getElementById('deal-no');if(n)n.click();}}"); pg.wait_for_timeout(400)
        pg.evaluate("()=>{__PM.setRunning(true);}"); pg.wait_for_timeout(1500)
        pg.screenshot(path=SP+name+".jpg", type="jpeg", quality=80)
    go("trucks", [-62, 2, 118])
    go("basin", [32, -40, 63])
    go("dryerfire", [30, -10, 95], "()=>__PM.trigger('dryerfire',true)", 7000)
    pg.evaluate("()=>{__PM.S.inc=[];}")
    go("lightning", [40, -20, 127], "()=>__PM.trigger('lightning',true)", 1200)
    pg.evaluate("()=>{__PM.S.inc=[];}")
    go("duststorm", [-10, -20, 127], "()=>__PM.trigger('duststorm',true)", 7000)
    pg.evaluate("()=>{__PM.S.inc=[];}")
    go("rain", [10, 5, 190], "()=>{__PM.S.wx='rain';__PM.S.wxLeft=999;}", 7000)
    go("snow", [10, 5, 190], "()=>{__PM.S.wx='snow';__PM.S.wxLeft=999;}", 7000)
    go("fog", [10, 5, 190], "()=>{__PM.S.wx='fog';__PM.S.wxLeft=999;}", 7000)
    pg.evaluate("()=>{__PM.S.wx='clear';}")
    go("night", [10, 5, 190], "()=>{const S=__PM.S;S.t=Math.floor(S.t/1440)*1440+16*60;}", 7000)
    go("nightclose", [-20, 20, 95], "()=>{}", 3000)
    go("dusk", [10, 5, 190], "()=>{const S=__PM.S;S.t=Math.floor(S.t/1440)*1440+13.2*60+1440;}", 5000)
    go("wetend", [48, 6, 63], "()=>{const S=__PM.S;S.t=Math.floor(S.t/1440)*1440+6*60+1440;}", 5000)
    go("balefire", [-20, -20, 95], "()=>__PM.trigger('balefire',true)", 7000)
    print("errors", errs[:3]); b.close()
