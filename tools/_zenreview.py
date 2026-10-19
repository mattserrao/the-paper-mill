# zen review: every zen shot on one map, sampled at 3 points, with draw stats
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
env=sys.argv[2]; out=sys.argv[3]
errs=[]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 640, "height": 400})
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?zenstay&env="+env)
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>{__PM.G3.noFallback=true;document.getElementById('v2zen').click()}")
    pg.wait_for_timeout(6000)
    pg.evaluate("()=>{__PM.G3.sightFocus=()=>null}")
    names=pg.evaluate("()=>__PM.G3.zenMoves().map(m=>[m.name,m.dur||0,!!m.rare,(()=>{try{return !!m.ok()}catch(e){return 'err'}})()])")
    res=[]
    START=int(sys.argv[4]) if len(sys.argv)>4 else 0
    pg.set_default_timeout(180000)
    for k,(n,dur,rare,ok) in enumerate(names):
        if k<START: continue
        row={"i":k,"name":n,"dur":dur,"rare":rare,"ok":ok,"s":[]}
        try:
            pg.evaluate("k=>{const G=__PM.G3,Z=G.zenS,m=G.zenMoves()[k];Z.dis=1e9;Z.len=1e9;Z.t=0;Z.who=null;Z.goto=null;Z.mv={m,t:0,st:m.start?m.start():null};document.body.dataset.zs='none';}",k)
        except Exception as e:
            row["err"]=str(e)[:150]; res.append(row); continue
        for j,fr in enumerate([0.08,0.5,0.92]):
            st=pg.evaluate("([k,fr])=>{const G=__PM.G3,Z=G.zenS;if(!Z.mv||Z.mv.m!==G.zenMoves()[k])return 'ended';const T=Z.mv.m.dur||10;if(Z.mv.t<fr*T)Z.mv.t=fr*T;return 'ok'}",[k,fr])
            pg.wait_for_timeout(1400)
            info=pg.evaluate("()=>{const G=__PM.G3,{camera,renderer}=G.diagScene(),Z=G.zenS;return {alive:!!Z.mv,y:+camera.position.y.toFixed(1),pos:camera.position.toArray().map(v=>v|0),calls:renderer.info.render.calls,tris:renderer.info.render.triangles,free:!!G.camFree}}")
            info["st"]=st
            pg.screenshot(path=f"{out}/{env}-{k:02d}-{j}.jpg",type="jpeg",quality=72)
            row["s"].append(info)
        res.append(row); print(json.dumps(row),flush=True)
    # also: free shots (POI viewpoints) after shot list
    b.close()
json.dump({"env":env,"start":START,"shots":res,"errs":errs[:20]},open(f"{out}/{env}-{START}.json","w"),indent=1)
print("errs",errs[:5])
