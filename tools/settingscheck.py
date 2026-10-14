"""v4.2.1 checks: Settings tab on the right, area controls folded and locked on AUTO in a season,
and the player's speed coming back after a planned outage (slowing down during it keeps the old speed; speeding up makes the new speed stick, v5.0.1).
Usage: python3 settingscheck.py <index.html>"""
import pathlib,sys
from playwright.sync_api import sync_playwright
src=open(pathlib.Path(__file__).parent/'bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text()
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=b.new_context(viewport={"width":800,"height":450});errs=[]
    pg=ctx.new_page();pg.on("pageerror",lambda e:errs.append(str(e)[:200]));pg.route("**/*",route_for(html));pg.add_init_script(INIT)
    pg.goto("http://bench.local/");pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=240000,polling=300)
    print("tabs:",pg.evaluate("()=>[...document.querySelectorAll('.v2tabs button')].map(b=>b.textContent.trim())"))
    print("folded:",pg.evaluate("()=>{const d=document.getElementById('areactl');return d?!d.open:null}"))
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;}")
    print("season locks:",pg.evaluate("""()=>{const C=__PM.C,ins=[...document.querySelectorAll('#cards .row[data-key] input,#cards .row[data-key] button.auto')];
      return {season:!!(__PM.S.season&&__PM.S.season.on),allDisabled:ins.every(e=>e.disabled),n:ins.length,allAuto:['inRate','drivers','pulper','pmSp','wdr','loaders','outRate'].every(k=>C[k].auto),paperFree:!document.querySelector('#paperColor button').disabled}}"""))
    # pick 30 min/s, run to the outage, touch the speed during it, run to the end
    r=pg.evaluate("""()=>{const P=__PM,f=document.getElementById('v2fast'),s=document.getElementById('v2slow');
      while(P.C.simSpeed<30)f.click();const pick=P.C.simSpeed;let k=0;
      const clr=()=>{const o=P.S.cards.open;if(o&&o.c){const y=document.getElementById('deal-yes');if(y)y.click();}const ok=document.getElementById('out-ok');if(ok&&ok.offsetParent)ok.click();};while(!P.S.outg.on&&k++<9*1440*4){P.step(0.25);clr();}const inOut=P.S.outg.on,capped=P.C.simSpeed;
      s.click();s.click();const touched=P.C.simSpeed;k=0;while(P.S.outg.on&&k++<1440*4){P.step(0.25);clr();}
      return {pick,inOut,capped,touched,after:P.C.simSpeed,day:Math.floor(P.S.t/1440)+1}}""")
    print("outage speed:",r,"OK" if r["after"]==r["pick"] else "FAIL")
    # v5.0.1: speeding up during the next outage makes that the speed to come back to
    r2=pg.evaluate("""()=>{const P=__PM,f=document.getElementById('v2fast');let k=0;
      const clr=()=>{const o=P.S.cards.open;if(o&&o.c){const y=document.getElementById('deal-yes');if(y)y.click();}const ok=document.getElementById('out-ok');if(ok&&ok.offsetParent)ok.click();const rc=document.getElementById('rc-ok');if(o&&o.report&&rc)rc.click();};
      while(!P.S.outg.on&&k++<9*1440*4){P.step(0.25);clr();}const capped=P.C.simSpeed;while(P.C.simSpeed<60)f.click();const picked=P.C.simSpeed;k=0;
      while(P.S.outg.on&&k++<1440*4){P.step(0.25);clr();}return {capped,picked,after:P.C.simSpeed,day:Math.floor(P.S.t/1440)+1}}""")
    print("outage speed, sped up during it:",r2,"OK" if r2["after"]==r2["picked"]==60 and r2["capped"]==5 else "FAIL")
    print("page errors:",errs)
