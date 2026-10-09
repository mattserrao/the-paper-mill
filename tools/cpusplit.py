"""Steady phone play: median ms per frame for dbTick, renderer.render (with/without a shadow refresh), and the rest."""
import pathlib,sys,json,statistics as st
from playwright.sync_api import sync_playwright
src=open('bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i=html.rindex("})();",0,html.rindex("</script>")); html=html[:i]+HOOK+html[i:]
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=ctx.new_page();pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)&&(!__PM.G3.SM||__PM.G3.SM.done)",timeout=180000,polling=300)
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setFps(true);__PM.C.simSpeed=30;}")
    pg.wait_for_timeout(30000)
    if len(sys.argv)>2:   # force shadows on (the fallback may have switched them off) and keep them on
        pg.evaluate("()=>{const G=__PM.G3,R=G.renderer;R.shadowMap.enabled=true;R.shadowMap.needsUpdate=true;G.scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)});G.shadowHz=15;}")
        pg.wait_for_timeout(15000)
    if len(sys.argv)>3:   # moving batches off
        pg.evaluate("()=>{const G=__PM.G3,D=G.DB;G.dbTick=null;D.list.forEach(r=>{if(r.o.layers.mask===1<<30)r.o.layers.set(0)});D.bms.forEach(b=>b.visible=false);D.n=0;}")
        pg.wait_for_timeout(3000)
    r=pg.evaluate("""async()=>{const G=__PM.G3,R=G.renderer,SM=R.shadowMap;const db=[],rs=[],rn=[],fr=[];let cur=null;
      const odb=G.dbTick;if(odb)G.dbTick=()=>{const t=performance.now();odb();db.push(performance.now()-t);};
      const orr=R.render.bind(R);let sh=false;const osr=SM.render;SM.render=(...a)=>{if(SM.enabled&&(SM.autoUpdate||SM.needsUpdate))sh=true;return osr.apply(SM,a);};
      R.render=(a,c)=>{sh=false;const t=performance.now();orr(a,c);(sh?rs:rn).push(performance.now()-t);};
      const raf=requestAnimationFrame;const t0=performance.now();await new Promise(res=>{let l=performance.now();(function k(){const n=performance.now();fr.push(n-l);l=n;if(n-t0<12000)raf(k);else res();})();});
      const sc=G.scene;let tu=0;for(let i=0;i<20;i++){const t=performance.now();sc.updateMatrixWorld();tu+=performance.now()-t;}
      let nodes=0,autoM=0,autoW=0;sc.traverse(o=>{nodes++;if(o.matrixAutoUpdate)autoM++;if(o.matrixWorldAutoUpdate)autoW++;});
      R.render=orr;SM.render=osr;if(odb)G.dbTick=odb;const md=a=>a.length?+(a.slice().sort((x,y)=>x-y)[a.length>>1]).toFixed(2):null;
      return {frames:fr.length,dbTick:md(db),renderWithShadow:md(rs),renderNoShadow:md(rn),shadowFrames:rs.length,plainFrames:rn.length,shadowsOn:SM.enabled,pixelRatio:R.getPixelRatio(),
        programs:R.info.programs.length,updateMatrixWorldMs:+(tu/20).toFixed(2),nodes,autoM,autoW};}""")
    b.close()
print(sys.argv[1].split('/')[-1], json.dumps(r))
