"""Page writes per second during play, by element (phone emulation). Usage: python3 domwrites.py index.html [seconds] [--upsets]"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text(); secs = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 10
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__B.first!==null&&__PM.G3.warm", timeout=180000, polling=500)
    pg.evaluate("()=>{document.getElementById('v2go').click();}"); pg.wait_for_timeout(8000)
    if "--upsets" in sys.argv: pg.evaluate("()=>{__PM.CH.on=true;__PM.EVENTS.forEach(e=>{try{__PM.trigger(e.id,true)}catch(_){}})}"); pg.wait_for_timeout(3000)
    r = pg.evaluate("""(secs)=>new Promise(res=>{const by={};let n=0,f0=0;const key=t=>{const e=t.nodeType===1?t:t.parentElement;if(!e)return '?';
        const host=e.closest('[id]');return (host?'#'+host.id:'')+' '+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:e.tagName.toLowerCase());};
      const mo=new MutationObserver(l=>{for(const m of l){n++;const k=key(m.target)+' '+m.type+(m.attributeName?':'+m.attributeName:'');by[k]=(by[k]||0)+1;}});
      mo.observe(document.body,{attributes:true,subtree:true,childList:true,characterData:true});
      let frames=0;const t0=performance.now();const tick=()=>{frames++;if(performance.now()-t0<secs*1000)requestAnimationFrame(tick);else{mo.disconnect();
        res({per_s:+(n/secs).toFixed(1),frames,top:Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>[k,+(v/secs).toFixed(1)])});}};requestAnimationFrame(tick);})""", secs)
    b.close()
print(json.dumps(r, indent=1))
