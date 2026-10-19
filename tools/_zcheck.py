import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
env=sys.argv[2]; out=sys.argv[3]; shots=json.loads(sys.argv[4]); errs=[]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 640, "height": 400}); pg.set_default_timeout(180000); pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?zenstay&env="+env)
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>{__PM.G3.noFallback=true;document.getElementById('v2zen').click()}"); pg.wait_for_timeout(5000)
    print(env,"names",pg.evaluate("()=>__PM.G3.zenMoves().map(m=>m.name).join(' | ')"))
    # rare sight, framed by zen
    pg.evaluate("()=>{__PM.G3.sight()}"); pg.wait_for_timeout(2500)
    for j,t in enumerate([1,3.2,4.6,6,8,10]):
        pg.evaluate("t=>{__PM.G3.sightSeek(t)}",t); pg.wait_for_timeout(1200)
        print("sight",t,pg.evaluate("()=>[__PM.G3.zenS.mv&&__PM.G3.zenS.mv.m.name,__PM.G3.sightT|0,__PM.G3.diagScene().renderer.info.render.calls]"),flush=True)
        pg.screenshot(path=f"{out}/s-{env}-{j}.jpg",type="jpeg",quality=72)
    pg.wait_for_timeout(4000); pg.evaluate("()=>{__PM.G3.sightFocus=()=>null}")
    for n in shots:
        pg.evaluate("n=>{const G=__PM.G3,Z=G.zenS,m=G.zenMoves().find(m=>m.name===n);Z.dis=1e9;Z.len=1e9;Z.t=0;Z.who=null;Z.mv={m,t:0,st:m.start?m.start():null};document.body.dataset.zs='none';}",n)
        for j,fr in enumerate([0.08,0.5,0.92]):
            pg.evaluate("fr=>{const Z=__PM.G3.zenS;if(Z.mv){const T=Z.mv.m.dur||10;if(Z.mv.t<fr*T)Z.mv.t=fr*T;}}",fr); pg.wait_for_timeout(1300)
            pg.screenshot(path=f"{out}/c-{env}-{n.replace(' ','_')}-{j}.jpg",type="jpeg",quality=72)
        print("shot",n,pg.evaluate("()=>__PM.G3.diagScene().renderer.info.render.calls"),flush=True)
    # natural zen for 4 minutes at fast sim: picker, bag, no errors
    pg.evaluate("()=>{const Z=__PM.G3.zenS;Z.mv=null;Z.t=99;Z.len=0;Z.dis=40}")
    seen=[]
    for k in range(48):
        pg.wait_for_timeout(5000); seen.append(pg.evaluate("()=>[__PM.G3.zenLast,(__PM.G3.zenS.bag||[]).length]"))
    print("picker",json.dumps(seen))
    b.close()
print("errs",errs[:5])
