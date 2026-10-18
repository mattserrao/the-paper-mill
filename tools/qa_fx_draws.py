import pathlib, sys, json, collections
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
html = html.replace("window.__PM={", "window.__PM={trigger:(i,q)=>trigger(i,q),", 1)
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
CNT = r"""(id)=>new Promise(res=>{const G=__PM.G3,R=G.renderer,orig=R.renderBufferDirect.bind(R);const g=id?G.FX[id].g:null;const c={all:0,fx:0,kinds:{}};let on=false;
  R.renderBufferDirect=function(cam,sc,geo,mat,obj,grp){if(on&&obj.layers.mask===1){c.all++;if(g){let x=obj;for(;x;x=x.parent)if(x===g)break;if(x){c.fx++;const k=(obj.isBatchedMesh?'BM ':obj.isInstancedMesh?'IM ':'')+mat.type+(mat.transparent?'(T)':'')+(mat.map?'(map)':'');c.kinds[k]=(c.kinds[k]||0)+1;}}}return orig(cam,sc,geo,mat,obj,grp);};
  G.lastMove=performance.now();requestAnimationFrame(()=>{on=true;requestAnimationFrame(()=>{on=false;R.renderBufferDirect=orig;res(c);});});})"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 600, "height": 400})
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{__PM.G3.camSet([-14,5,380,-0.785,0.955]);__PM.setRunning(false);}"); pg.wait_for_timeout(6000)
    print("base", pg.evaluate(CNT, None)["all"])
    for id in ["flood","roof","hdblow","calloff","fight","fleet","slime","icedintake","overflow","dryerfire","tornado"]:
        pg.evaluate("id=>{__PM.setRunning(true);__PM.C.simSpeed=1;__PM.trigger(id,true);}", id); pg.wait_for_timeout(6000); pg.evaluate("()=>{const c=document.querySelector('#evc:not([hidden]) button');if(c)c.click();document.querySelectorAll('.overlay:not([hidden])').forEach(o=>{});}")
        c = pg.evaluate(CNT, id); print(id, "all", c["all"], "fx draws", c["fx"], c["kinds"])
        pg.evaluate("id=>{__PM.S.inc=__PM.S.inc.filter(i=>i.id!==id);}", id); pg.wait_for_timeout(3000)
    b.close()
