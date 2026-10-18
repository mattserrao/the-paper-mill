import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
pts=json.loads(sys.argv[2])
JS="""P=>{const {scene}=__PM.G3.diagScene(),T=__PM.THREE,out=[];const bb=new T.Box3(),m4=new T.Matrix4(),v=new T.Vector3();
 for(const [x,z] of P){const hits=[];scene.traverse(o=>{if(!(o.isMesh)||!o.geometry)return;const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();
   const test=(mw,id)=>{bb.copy(g.boundingBox).applyMatrix4(mw);if(x>bb.min.x-0.1&&x<bb.max.x+0.1&&z>bb.min.z-0.1&&z<bb.max.z+0.1&&bb.min.y<0.6&&bb.max.x-bb.min.x<6&&bb.max.z-bb.min.z<6){const m=Array.isArray(o.material)?o.material[0]:o.material;
     hits.push([o.name||o.type,o.isInstancedMesh?'inst#'+id:'',m&&m.type,m&&m.color?'#'+m.color.getHexString():'',[bb.min.x,bb.min.y,bb.min.z,bb.max.x,bb.max.y,bb.max.z].map(a=>+a.toFixed(2)),o.visible,o.layers.mask,(o.parent&&o.parent.name)||'']);}};
   if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,m4);m4.premultiply(o.matrixWorld);test(m4,i);}}else test(o.matrixWorld,0);});out.push([x,z,hits.slice(0,25)]);}return out;}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560})
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    for x,z,h in pg.evaluate(JS,pts):
        print("==",x,z)
        for r in h: print(r)
    b.close()
