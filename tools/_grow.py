import pathlib, sys, json, collections
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
SNAP = """()=>{const G=__PM.G3,c={};const tag=o=>{let k=o.name||o.type;const u=Object.keys(o.userData||{}).filter(x=>x!=='fullGeo').slice(0,3).join('+');return k+(u?'{'+u+'}':'')+(o.geometry?'/'+o.geometry.type:'');};
  const walk=(root,pre)=>root.children.forEach(o=>{let n=0;o.traverse(()=>n++);c[pre+tag(o)]=(c[pre+tag(o)]||0)+n;});walk(G.scene,'');if(G.SM&&G.SM.holder)walk(G.SM.holder,'P:');
  return {t:Math.round(__PM.S.t),geoms:G.renderer.info.memory.geometries,tex:G.renderer.info.memory.textures,c}}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 400, "height": 300})
    pg = ctx.new_page(); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{__PM.setFps('max');__PM.C.simSpeed=60;__PM.G3.camSet([10,5,190,-0.785,0.955]);}")
    pg.wait_for_timeout(20000); a = pg.evaluate(SNAP)
    for i in range(6):
        pg.wait_for_timeout(20000); bb = pg.evaluate(SNAP); print(bb["t"], bb["geoms"], bb["tex"], sum(bb["c"].values()))
    d = {k: bb["c"].get(k, 0) - a["c"].get(k, 0) for k in set(a["c"]) | set(bb["c"])}
    print("from t", a["t"], "to", bb["t"], "geoms", a["geoms"], "->", bb["geoms"])
    for k, v in sorted(d.items(), key=lambda x: -abs(x[1]))[:15]:
        if v: print(f"  {v:+5d} {k}")
    print("errors", errs[:3])
    b.close()
