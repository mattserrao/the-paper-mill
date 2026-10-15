"""Save/continue checks (v4.2 save test): exact continuation, Continue button, hidden page, bad saves.
Usage: python3 savecheck.py <index.html>"""
import pathlib,sys,json
from playwright.sync_api import sync_playwright
src=open(pathlib.Path(__file__).parent/'bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text()
STEP="(n)=>{const P=__PM;for(let k=0;k<n;k++){P.step(0.25);const o=P.S.cards.open;if(o&&o.civ){const b=document.querySelector('#civOv .civbtn');if(b)b.click();P.setRunning(false);}}const S=P.S;return [Math.round(S.cash),S.tot.incidents,S.tot.breaks,Math.round(S.t),S.cards.pend.length,Math.round(S.fg)]}"
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=b.new_context(viewport={"width":800,"height":450});errs=[]
    def page():
        pg=ctx.new_page();pg.on("pageerror",lambda e:errs.append(str(e)[:200]));pg.route("**/*",route_for(html));pg.add_init_script(INIT.replace("localStorage.clear()","0") if "localStorage.clear()" in INIT else INIT);pg.goto("http://bench.local/")
        pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=240000,polling=300);return pg
    pg=page()
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;}")
    pg.wait_for_function("!!document.querySelector('#leadOv:not([hidden]) .ldcard')",timeout=120000);pg.evaluate("()=>{document.querySelector('#leadOv .ldcard[data-l=fel]').click();document.getElementById('ld-go').click();}");pg.wait_for_function("__PM.S.season&&__PM.S.season.on",timeout=300000);pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;}")
    # play 3 days with upsets and accept every card that comes up, so pending outcomes exist
    pg.evaluate("""()=>{const P=__PM;for(let k=0;k<3*1440*4;k++){if(k%1500===0)P.S.cards.next=P.S.t;P.step(0.25);const o=P.S.cards.open;if(o&&o.c){document.getElementById('deal-yes').click();P.setRunning(false);}else if(o&&o.civ){document.querySelector('#civOv .civbtn').click();P.setRunning(false);}else if(o)P.S.cards.open=null;if(P.S.civ&&P.S.civ.pending)P.S.civ.pending=null;}}""")
    st=pg.evaluate("()=>[__PM.S.cards.pend.map(p=>p.h),__PM.S.fx.map(f=>f.id),Math.round(__PM.S.t)]");print("before save: pending",st)
    ms=pg.evaluate("()=>{const ok=__PM.G3.save.save('test');window.__sv=localStorage.getItem('paper-mill-save');return [ok,__PM.G3.saveMs,window.__sv.length]}");print("save ok, ms, bytes:",ms)
    a=pg.evaluate(STEP,2*1440*4);print("uninterrupted day 5:",a)
    pg.evaluate("()=>{__PM.G3.saveOff=true;localStorage.setItem('paper-mill-save',window.__sv);}")   # (the autosave has moved on since: put the test save back)
    pg.close()
    pg=page()
    has=pg.evaluate("()=>!!document.getElementById('v2cont')&&document.getElementById('v2cont').textContent");print("continue button:",has)
    # click and pause in one go: waiting for running===true first let a frame or two of sim slip in (a flaky DIFFER)
    r=pg.evaluate("()=>{document.getElementById('v2cont').click();const was=__PM.running;__PM.setRunning(false);return was}");print("continue started the game:",r)
    bb=pg.evaluate(STEP,2*1440*4);print("restored day 5:",bb,"MATCH" if a==bb else "DIFFER")
    # hidden page: save + pause + welcome back
    pg.evaluate("()=>__PM.setRunning(true)")
    pg.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));}")
    h=pg.evaluate("()=>[__PM.running,JSON.parse(localStorage.getItem('paper-mill-save')).why]")
    pg.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));}")
    w=pg.evaluate("()=>[!document.getElementById('v2menu').hidden,document.getElementById('v2state').textContent]");print("hidden: running",h[0],"saved because",h[1],"| back: menu shown",w)
    pg.close()
    # a corrupt save and an old version: the game must start normally with no Continue
    for bad in ['"{not json"','JSON.stringify({v:0,S:{}})']:
        pg=ctx.new_page();pg.on("pageerror",lambda e:errs.append(str(e)[:200]));pg.route("**/*",route_for(html));pg.goto("http://bench.local/")
        pg.evaluate(f"()=>localStorage.setItem('paper-mill-save',{bad})");pg.reload();pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=240000,polling=300)
        print("bad save",bad[:20],"-> continue shown:",pg.evaluate("()=>!!document.getElementById('v2cont')"));pg.close()
    b.close()
print("page errors:",errs)
