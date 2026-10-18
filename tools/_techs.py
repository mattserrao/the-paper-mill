import pathlib, sys, json, base64
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
out=sys.argv[2]; phone=sys.argv[3]=="phone"
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1"
FIND="""()=>{const C=__PM.G3.CUT,out=[];for(const a of C.actors){let tech=false,toks=new Set();a.o.traverse(c=>{const m=c.material;if(m&&!Array.isArray(m)&&m.userData&&m.userData.token){toks.add(m.userData.token);if(m.userData.token==='g-tech')tech=true;}});
  if(tech){const p=a.o.getWorldPosition(new __PM.THREE.Vector3());let mats=[];a.o.traverse(c=>{const m=c.material;if(c.isMesh&&m&&!Array.isArray(m))mats.push([m.userData.token||'',m.type,m.color?m.color.getHexString():'',c.layers.mask,c.visible]);});
   out.push({pos:p.toArray().map(v=>+v.toFixed(1)),vis:a.o.visible,cell:a.cell?{r:a.cell.r,a:a.cell.a,key:(a.cell.key||'').slice(0,40)}:null,hid:a.hid,mats:mats.slice(0,12)});}}return out;}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True,user_agent=UA) if phone else b.new_context(viewport={"width":900,"height":640})
    pg=ctx.new_page()
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg); pg.evaluate("()=>{__PM.setRunning(true);__PM.G3.noFallback=true;}")
    pg.wait_for_timeout(5000)
    T=pg.evaluate(FIND); print(json.dumps(T,indent=0)[:3000])
    if T:
        p=T[0]["pos"]; pg.evaluate("v=>__PM.G3.camSet([v[0],v[2],50,-0.785,0.955])",p); pg.wait_for_timeout(3000); pg.screenshot(path=out+"-tech.jpg",type="jpeg",quality=85)
    b.close()
