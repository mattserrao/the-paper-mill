"""Zen checks (v17): every scripted shot of each map runs start-to-finish without an error and keeps the camera off the
ground; ?zen=1 goes straight into zen; a rare sight takes the zen camera; the map rotation reloads onto the next map.
Usage: python3 zencheck.py <index.html> [env,env...]"""
import pathlib,sys,json
from playwright.sync_api import sync_playwright
src=open(pathlib.Path(__file__).parent/'bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text();envs=(sys.argv[2] if len(sys.argv)>2 else "rural,urban,desert,swamp").split(",")
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    for env in envs:
        pg=b.new_page(viewport={"width":800,"height":450});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
        pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto(f"http://bench.local/?env={env}&zen=1&sight=1&zenstay")
        pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=240000,polling=300)
        pg.wait_for_function("__PM.G3.zen===true",timeout=30000,polling=200)
        shots=pg.evaluate("""()=>{const MV=__PM.G3.zenMoves(),out=[];for(const m of MV){let ok=false,err=null,n=0,low=0;try{ok=m.ok();}catch(e){err=String(e);}
            if(ok){try{const mv={m,t:0,st:m.start?m.start():null};for(let t=0;t<60;t+=0.25){mv.t=t;const f=m.at(t,mv,0.25);if(!f)break;n++;if(!(f[3]>0)||f.some(v=>!isFinite(v)))low++;}}catch(e){err=String(e).slice(0,120);}}
            out.push([typeof m.name==="string"?m.name:JSON.stringify(m.name),ok,n*0.25,m.dur,err,low]);}return out;}""")
        bad=[s for s in shots if s[4] or s[5]]
        pg.wait_for_function("__PM.G3.zenS&&__PM.G3.zenS.mv&&__PM.G3.zenS.mv.m.sight",timeout=200000,polling=200)
        print(env,"shots:",len(shots),"ready now:",sum(1 for s in shots if s[1]),"errors:",bad,"| sight followed by the zen camera: yes","| page errors",errs[:2])
        for s in shots:print("   ",s[0][:32].ljust(32),"ok" if s[1] else "--",f"{s[2]:5.1f}s / {s[3]}s")
        if env==envs[-1]:
            pg.evaluate("()=>__PM.G3.zenNextMap()");pg.wait_for_url("**/*zen=1*",timeout=30000);u=pg.url
            pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=240000,polling=300);pg.wait_for_function("__PM.G3.zen===true",timeout=30000,polling=200)
            print("rotation:",u,"->",pg.evaluate("()=>__PM.SITE.env"),"zen on:",pg.evaluate("()=>__PM.G3.zen"))
        pg.close()
    b.close()
