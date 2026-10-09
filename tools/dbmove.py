import pathlib,sys,json
from playwright.sync_api import sync_playwright
src=open('bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text()
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":640,"height":400});pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=180000,polling=300)
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.C.simSpeed=30;}");pg.wait_for_timeout(15000)
    r=pg.evaluate("""async()=>{const D=__PM.G3.DB,T=__PM.THREE,m=new T.Matrix4();const pick=D.list.filter(r=>{let x=r.o;for(;x;x=x.parent)if(x.userData&&(x.userData.legs||x.userData.load))return true;return false;}).filter(r=>r.vis).slice(0,40);
      const a=pick.map(r=>{r.bm.getMatrixAt(r.iid,m);return m.elements.slice();});await new Promise(r=>setTimeout(r,3000));
      let moved=0,match=0;pick.forEach((r,i)=>{r.bm.getMatrixAt(r.iid,m);if(m.elements.some((v,k)=>Math.abs(v-a[i][k])>1e-4))moved++;if(m.elements.every((v,k)=>Math.abs(v-r.o.matrixWorld.elements[k])<1e-4))match++;});
      return {actorsInBatches:pick.length,movedIn3s:moved,matchOriginal:match};}""")
    b.close()
print(r)
