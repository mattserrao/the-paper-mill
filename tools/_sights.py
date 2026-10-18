import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
out=sys.argv[2]; envs=sys.argv[3].split(","); extra=sys.argv[4] if len(sys.argv)>4 else ""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    for env in envs:
        pg = b.new_page(viewport={"width": 800, "height": 560}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.on("console", lambda m: errs.append("console:"+m.text[:160]) if m.type=="error" and "ERR_FAILED" not in m.text else None)
        pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.add_init_script("try{localStorage.setItem('paper-mill-site',JSON.stringify({env:'%s'}))}catch(e){}"%env)
        pg.goto("http://bench.local/?sight=1"+extra)
        pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
        pg.evaluate("()=>{__PM.G3.noFallback=true;document.getElementById('v2free').click()}")
        pg.wait_for_function("__PM.G3.sightT>=0", timeout=60000, polling=200)
        for t in [2.5,5,8]:
            pg.evaluate("t=>{const G=__PM.G3;G.sightHold=t;const f=G.sightFocus();if(f)G.camSet([f[0],f[2],Math.min(95,f[3]),-0.785,0.955]);}", t)
            pg.wait_for_timeout(2500)
            st=pg.evaluate("()=>({live:__PM.G3.CUT.live.map(l=>!!l.cell),caps:__PM.G3.CUT.caps})")
            print(env,t,json.dumps(st)); pg.screenshot(path=f"{out}-{env}-{t}.jpg",type="jpeg",quality=80)
        print(env,"errors",errs[:3]); pg.close()
    b.close()
