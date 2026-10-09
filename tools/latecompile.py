"""Which shader programs get compiled after the start-up precompile? Plays 60 s normally, then triggers every upset."""
import pathlib,sys,json,collections
from playwright.sync_api import sync_playwright
src=open('bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text();phone="phone" in sys.argv
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True) if phone else b.new_context(viewport={"width":800,"height":450})
    pg=ctx.new_page();pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=180000,polling=300)
    # record every program as it is created, with the material and object that caused it
    pg.evaluate("""()=>{const R=__PM.G3.renderer;window.__P0=new Set(R.info.programs.map(p=>p.id));window.__late=[];
      const sc=__PM.G3.scene;const seen=new Set(R.info.programs.map(p=>p.id));
      const orr=R.render.bind(R);R.render=(a,c)=>{orr(a,c);for(const p of R.info.programs){if(seen.has(p.id))continue;seen.add(p.id);
        __late.push({t:Math.round(performance.now()/1000),name:p.name,key:p.cacheKey.split(',').filter(x=>x&&x!=='false'&&x!=='0').slice(0,40).join(',')});}};}""")
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;}")
    pg.wait_for_timeout(60000)
    pg.evaluate("()=>{__PM.CH.on=true;__PM.EVENTS.forEach(e=>{try{__PM.trigger(e.id,true)}catch(_){}})}")
    pg.wait_for_timeout(20000)
    L=pg.evaluate("()=>__late"); n0=pg.evaluate("()=>__P0.size"); b.close()
print("programs at warm:",n0,"compiled later:",len(L))
for x in L: print(x["t"],"s",x["name"][:40],"|",x["key"][:300])
