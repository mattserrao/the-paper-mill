"""Shared pieces for the v5.5 benchmark tools (fpsbench.py, gpuexp.py): page routing, the v5 start sequence
(leader pick), and the per-frame sampler that times CPU submission and GPU completion of every render."""
import pathlib, time
HERE = pathlib.Path(__file__).parent
_src = (HERE / "bench.py").read_text()
exec(_src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])   # route_for, INIT, HOOK

def load_html(path):
    html = pathlib.Path(path).read_text()
    if "window.__PM=" not in html:
        i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
    return html

CHROMIUM_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-precise-memory-info"]
def launch(pw, engine="chromium"):
    return pw.webkit.launch() if engine == "webkit" else pw.chromium.launch(args=CHROMIUM_ARGS)

def phone_context(b, dpr=1.25):
    return b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=dpr, is_mobile=True, has_touch=True)

def start_game(pg, html, mode="season", leader="hank", gfx="", errs=None):
    """Load the page (seeded, no title screen), start a season or survival run with the given leader, Smooth FPS, 30 sim-min/s,
    low-FPS fallback off. Returns seconds spent loading and precompiling."""
    if errs is not None: pg.on("pageerror", lambda e: errs.append((str(e) + " | " + str(getattr(e, "stack", "")))[:700]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
    t0 = time.time(); pg.goto("http://bench.local/?notitle" + (f"&gfx={gfx}" if gfx else ""))
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    warm = round(time.time() - t0, 1)
    btn = "v2surv" if mode == "survival" else "v2go"
    pg.evaluate(f"()=>document.getElementById('{btn}').click()"); pg.wait_for_function("()=>!document.getElementById('leadOv').hidden", timeout=60000)
    pg.evaluate("(l)=>{document.querySelector('#leadOv .ldcard[data-l=\"'+l+'\"]').click();document.getElementById('ld-go').click()}", leader)
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=60000)
    pg.evaluate("()=>{__PM.setFps(true);__PM.C.simSpeed=30;__PM.G3.noFallback=true;}")
    pg.evaluate(SAMPLER)
    return warm

# Wraps renderer.render: times the CPU submission, then waits for the GPU with a 1-pixel read-back (F.stall) so the frame's
# GPU work is measured even when the display would otherwise hide it. The rAF wrapper from INIT (__B.frames) times the whole
# frame callback; cpu = callback - GPU wait. F.shEvery=n refreshes the shadow map every nth render (the game's own timer
# can't be trusted when the emulator runs at a few FPS). F.noRender(true) skips renderer.render so the loop runs at the
# display rate: the sim + scene-update cost per frame as a phone would amortize it.
SAMPLER = r"""()=>{const G=__PM.G3,R=G.renderer,gl=R.getContext(),SM=R.shadowMap,B=__B,T=__PM.THREE;
 if(window.__F)return;const F=window.__F={on:false,stall:true};
 const px=new Uint8Array(4);const r0=R.render.bind(R);F.shEvery=0;F.renders=0;
 const sm0=SM.render.bind(SM);SM.render=(...a)=>{const will=SM.enabled&&(SM.autoUpdate||SM.needsUpdate);const g0=B.gl;sm0(...a);if(will&&F.on){F.shRuns++;F.shDraws+=B.gl-g0;}};
 // the shadow refresh schedule is applied before the game's frame runs (as the game's own timer would), so frame code
 // that looks at shadowMap.needsUpdate sees it
 const fb=G.frameBody;G.frameBody=function(...a){F.renders++;if(F.shEvery)SM.needsUpdate=(F.renders%F.shEvery===0);return fb.apply(this,a);};
 R.render=(s,c)=>{const g0=B.gl;const a=performance.now();r0(s,c);const b=performance.now();
   B.cur+=b-a;if(F.stall){gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}const d=performance.now();
   if(F.on){F.n++;F.sub.push(b-a);F.gpu.push(d-b);F.draws+=B.gl-g0;F.tris+=R.info.render.triangles;}};
 const orig=requestAnimationFrame;let lastHeap=0;
 (function k(){if(F.on&&performance.memory){const u=performance.memory.usedJSHeapSize;if(u>lastHeap&&lastHeap)F.grow+=u-lastHeap;lastHeap=u;}orig(k);})();
 F.mo=new MutationObserver(l=>{if(F.on)F.writes+=l.length;});
 F.mo.observe(document.body,{attributes:true,attributeFilter:["style","class","hidden"],subtree:true,childList:true,characterData:true});
 F.setPr=pr=>{G.prFixed=pr||0;R.setPixelRatio(pr||G.prFor(innerWidth,innerHeight));window.dispatchEvent(new Event("resize"));};
 // the INIT rAF wrapper records a callback only when B.cur>0 (something rendered); in the no-render phase count every game callback
 const EXP=G.EXP;F.noRender=on=>{EXP.noRender=!!on;if(on){const fb=G.frameBody;if(!F.fb0){F.fb0=fb;G.frameBody=function(...a){B.cur+=1e-6;return F.fb0.apply(this,a);};}}else if(F.fb0){G.frameBody=F.fb0;F.fb0=null;}};
 F.start=()=>{Object.assign(F,{n:0,sub:[],gpu:[],draws:0,tris:0,shRuns:0,shDraws:0,writes:0,grow:0,t0:performance.now(),on:true});
   B.frames=[];B.render=[];B.gaps=[];B.last=0;B.rec=true;if(G.PF){const P=G.PF;P.acc={};P.frames=0;P.calls=0;P.tris=0;P.rf=0;P.mup=0;P.gaps=[];P.js=[];P.lastNow=0;P.on=true;}};
 F.stop=()=>{F.on=false;B.rec=false;if(G.PF)G.PF.on=false;const s=(performance.now()-F.t0)/1000,I=R.info;
   const q=(x,p)=>{if(!x.length)return 0;const y=x.slice().sort((a,b)=>a-b);return +y[Math.min(y.length-1,Math.floor(p*y.length))].toFixed(2);};
   const mean=x=>x.length?+(x.reduce((a,b)=>a+b,0)/x.length).toFixed(2):0;
   const cpu=B.frames.map((v,i)=>Math.max(0,v-(F.gpu[i]||0)));const nf=F.n||B.frames.length;
   const tex=new Set();let bytes=0;G.scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
     ms.forEach(m=>{for(const k in m){const v=m[k];if(v&&v.isTexture&&!tex.has(v)){tex.add(v);const im=v.image||{};bytes+=(im.width||0)*(im.height||0)*4*(v.generateMipmaps!==false&&!v.isDataTexture?1.33:1);}}});});
   const vis=[...document.querySelectorAll("#labels3d *,#chips3d *,.banner3d")].filter(e=>e.childElementCount===0&&e.getClientRects().length&&getComputedStyle(e).visibility!=="hidden").length;
   const dw=R.getDrawingBufferSize(new T.Vector2());const sec={};if(G.PF&&G.PF.frames)for(const k in G.PF.acc)sec[k]=+(G.PF.acc[k]/G.PF.frames).toFixed(3);
   return {secs:+s.toFixed(1),frames:nf,fps_here:+(nf/s).toFixed(1),cpu_ms:q(cpu,0.5),cpu_p95_ms:q(cpu,0.95),cpu_mean_ms:mean(cpu),
     over33_pct:cpu.length?+(100*cpu.filter(x=>x>33).length/cpu.length).toFixed(1):0,
     submit_ms:q(F.sub,0.5),submit_mean_ms:mean(F.sub),gpu_ms:q(F.gpu,0.5),gpu_mean_ms:mean(F.gpu),gpu_p95_ms:q(F.gpu,0.95),
     draws_main:F.n?Math.round((F.draws-F.shDraws)/F.n):0,draws_shadow:F.shRuns?Math.round(F.shDraws/F.shRuns):0,shadow_hz:+(F.shRuns/s).toFixed(1),shadow_every:F.shEvery,
     tris_k:F.n?Math.round(F.tris/F.n/1000):0,programs:I.programs?I.programs.length:0,geometries:I.memory.geometries,textures:I.memory.textures,
     tex_MB:+((bytes+(SM.enabled?4194304:0))/1e6).toFixed(1),dom_writes_f:F.n?+(F.writes/F.n).toFixed(2):0,overlay_nodes:vis,
     alloc_MB_s:+(F.grow/s/1e6).toFixed(2),buffer:[dw.x,dw.y],buffer_px_k:Math.round(dw.x*dw.y/1000),pr:+R.getPixelRatio().toFixed(2),
     shadows:SM.enabled,shadow_hz_set:G.shadowHz,gfx:G.GFX?G.GFX.tier:null,multidraw:!!G.multiDraw,sections:sec};};
}"""

def phase(pg, settle_ms, measure_ms):
    pg.wait_for_timeout(settle_ms); pg.evaluate("()=>__F.start()"); pg.wait_for_timeout(measure_ms); return pg.evaluate("()=>__F.stop()")
