"""Zen plays the map's rare sight once: speeds the waits up and counts how many times it starts.
Usage: python3 zenonce.py <index.html> [env]"""
import pathlib,sys
from playwright.sync_api import sync_playwright
src=open(pathlib.Path(__file__).parent/'bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text();env=sys.argv[2] if len(sys.argv)>2 else "swamp"
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":640,"height":400});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
    pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto(f"http://bench.local/?env={env}&zen=1&zenstay")
    pg.wait_for_function("window.__PM&&__PM.G3.warm&&__PM.G3.zen===true",timeout=240000,polling=300)
    # count starts; G3.sight() forces the next wait to zero, as often as we like
    pg.wait_for_function("typeof __PM.G3.sight===\"function\"",timeout=120000,polling=500);print("zen on",flush=True);starts=0;prev=-1
    for i in range(int(sys.argv[3]) if len(sys.argv)>3 else 900):
        t=pg.evaluate("()=>{const t=__PM.G3.sightT;if(t<0)__PM.G3.sight();return t}")
        if t is not None and t>=0 and (prev is None or prev<0):starts+=1;print("start at poll",i,flush=True)
        prev=t;pg.wait_for_timeout(250)
    r=starts
    print(env,"zen sight starts with the wait forced to zero:",r,"OK" if r==1 else "FAIL","| errors",errs)
