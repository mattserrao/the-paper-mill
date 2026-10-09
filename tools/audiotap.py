"""First tap on a phone: how many audio contexts get created? (expects 1)"""
import pathlib,sys,re
from playwright.sync_api import sync_playwright
src=open('bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
INIT2=INIT.replace('localStorage.setItem("paper-mill-sound","off");','localStorage.setItem("paper-mill-sound","on");')
for path in sys.argv[1:]:
    html=pathlib.Path(path).read_text()
    if "window.__PM=" not in html:
        i=html.rindex("})();",0,html.rindex("</script>")); html=html[:i]+HOOK+html[i:]
    with sync_playwright() as pw:
        b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=user-gesture-required"])
        ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
        pg=ctx.new_page();pg.route("**/*",route_for(html));pg.add_init_script(INIT2);pg.goto("http://bench.local/")
        pg.wait_for_function("window.__PM&&__B.first!==null",timeout=120000,polling=300);pg.wait_for_timeout(1500)
        pg.tap("#v2go");pg.wait_for_timeout(2500)
        pg.evaluate("()=>window.__openDiag&&window.__openDiag()");pg.wait_for_timeout(300)
        t=pg.evaluate("()=>{const e=document.getElementById('diagTxt');return e?e.textContent:''}");b.close()
    print(path.split('/')[-1],"new contexts:",len(re.findall(r'audio: new context',t)),"rebuilds:",len(re.findall(r'context rebuilt',t)),"| states:",re.findall(r'audio state \w+',t)[:6])
