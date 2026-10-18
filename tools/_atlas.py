import pathlib, sys, json, base64
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
out=sys.argv[2]; phone=sys.argv[3]=="phone"; wait=int(sys.argv[4]) if len(sys.argv)>4 else 8000
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1"
JS="""i=>{const G=__PM.G3,A=G.CUT.atl[i],{renderer}=G.diagScene(),w=2048,h=A.h,px=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(A.rt,0,0,w,h,px);
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),im=x.createImageData(w,h);
 for(let y=0;y<h;y++)for(let k=0;k<w*4;k++)im.data[(h-1-y)*w*4+k]=px[y*w*4+k];x.putImageData(im,0,0);
 const c2=document.createElement('canvas');c2.width=w;c2.height=h;const x2=c2.getContext('2d');x2.fillStyle='#7a9';x2.fillRect(0,0,w,h);x2.drawImage(c,0,0);return c2.toDataURL('image/png');}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True,user_agent=UA) if phone else b.new_context(viewport={"width":900,"height":640})
    pg=ctx.new_page()
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg); pg.evaluate("()=>{__PM.setRunning(true);__PM.G3.noFallback=true;}")
    pg.wait_for_timeout(wait)
    for i in [0,1]:
        d=pg.evaluate(JS,i); open(f"{out}-atlas{i}.png","wb").write(base64.b64decode(d.split(",")[1]))
    print(pg.evaluate("()=>__PM.G3.CUT.stats()")); b.close()
