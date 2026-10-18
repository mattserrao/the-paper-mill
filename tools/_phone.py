import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
out=sys.argv[2]; views=json.loads(sys.argv[3]); phone=sys.argv[4]=="phone"; q=sys.argv[5] if len(sys.argv)>5 else ""
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1"
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True,user_agent=UA) if phone else b.new_context(viewport={"width":900,"height":640})
    pg=ctx.new_page(); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.on("console", lambda m: errs.append("c:"+m.text[:200]) if m.type=="error" and "ERR_FAILED" not in m.text else None)
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?"+q)
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg); pg.evaluate("()=>{__PM.setRunning(true);__PM.G3.noFallback=true;}")
    pg.wait_for_timeout(6000)
    for i,v in enumerate(views):
        pg.evaluate("()=>{document.querySelectorAll('#evc:not([hidden]) button').forEach((x,i)=>{if(i===0)x.click();});const c=document.querySelector('#civOv .civbtn');if(c&&!document.getElementById('civOv').hidden)c.click();}")
        pg.evaluate("v=>__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955])",v); pg.wait_for_timeout(3500)
        pg.screenshot(path=f"{out}-{i}.jpg",type="jpeg",quality=80)
    print("TS",pg.evaluate("()=>({on:__PM.G3.TS&&__PM.G3.TS.on,tier:__PM.G3.GFX.tier,pr:__PM.G3.diagScene().renderer.getPixelRatio(),cut:__PM.G3.CUT.stats()})"))
    print("errors",errs[:4]); b.close()
