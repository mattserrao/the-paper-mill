import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
JS="""a=>{const {scene,camera}=__PM.G3.diagScene(),T=__PM.THREE,rc=new T.Raycaster();rc.layers.enableAll();const out=[];
 for(const [px,py] of a){rc.setFromCamera(new T.Vector2(px/800*2-1,1-py/560*2),camera);const hs=rc.intersectObjects(scene.children,true).filter(h=>{for(let x=h.object;x;x=x.parent)if(!x.visible)return false;return true;}).slice(0,6);
  out.push([px,py,hs.map(h=>{const o=h.object,m=Array.isArray(o.material)?o.material[0]:o.material;let c='';if(o.isBatchedMesh)c='batch';else if(o.isInstancedMesh&&o.instanceColor){const cc=new T.Color();o.getColorAt(h.instanceId,cc);c='inst#'+cc.getHexString();}
   return [o.name||o.type,m&&m.type,m&&m.color?m.color.getHexString():'',c,h.point.toArray().map(v=>+v.toFixed(2)),o.layers.mask,h.batchId??h.instanceId??''];})]);}return out;}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560})
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?tilt=0")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2free').click()"); pg.wait_for_timeout(2000)
    pg.evaluate("()=>__PM.G3.camSet([-12.6,15.6,25,-0.785,0.955])"); pg.wait_for_timeout(2500)
    pg.screenshot(path="/tmp/claude-0/-home-claude/1d0fb052-7a76-5766-bfa8-faf7676d4b04/scratchpad/can/ray.jpg")
    for r in pg.evaluate(JS,json.loads(sys.argv[2])): print(r)
    print(pg.evaluate('''()=>{const G=__PM.G3,T=__PM.THREE;const L=G.SM.list||[];const hits=L.filter(r=>r.iid===1726||(r.bm&&r.iid===1726));
      return hits.map(r=>{const o=r.o,m=o.material,bb=new T.Box3().setFromObject(o);let path=[];for(let x=o;x&&path.length<6;x=x.parent)path.push((x.name||x.type)+(x.userData&&Object.keys(x.userData).length?JSON.stringify(Object.keys(x.userData)):''));
        return {geo:o.geometry.type,par:o.geometry.parameters,col:m.color&&m.color.getHexString(),mt:m.type,bb:[bb.min.toArray(),bb.max.toArray()].map(a=>a.map(v=>+v.toFixed(2))),path,key:r.key};});}'''))
    b.close()
