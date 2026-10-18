import pathlib, sys
from playwright.sync_api import sync_playwright
src = open("bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text().replace("window.__PM={", "window.__PM={trigger:(i,q)=>trigger(i,q),", 1)
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
import os
SP=os.environ.get("SHOTP","/tmp/claude-0/-home-claude/1d0fb052-7a76-5766-bfa8-faf7676d4b04/scratchpad/qa18/v-")
shots = sys.argv[2].split(",")
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 800, "height": 560}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?"+(sys.argv[3] if len(sys.argv)>3 else ""))
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    def clear():
        for _ in range(3):
            pg.evaluate("()=>{document.querySelectorAll('#evc:not([hidden]) button').forEach((x,i)=>{if(i===0)x.click();});const c=document.querySelector('#civOv .civbtn');if(c&&!document.getElementById('civOv').hidden)c.click();const d=document.getElementById('dealOv');if(d&&!d.hidden){const n=document.getElementById('deal-no');if(n)n.click();}const o=document.getElementById('out-ok');if(o&&o.offsetParent)o.click();}"); pg.wait_for_timeout(300)
        pg.evaluate("()=>{__PM.setRunning(true);}")
    SPEC = {
      "rain": ([10,5,190], "()=>{__PM.S.wx='rain';__PM.S.wxLeft=999;}", 7000),
      "snow": ([10,5,190], "()=>{__PM.S.wx='snow';__PM.S.wxLeft=999;}", 7000),
      "fog": ([10,5,190], "()=>{__PM.S.wx='fog';__PM.S.wxLeft=999;}", 8000),
      "dust": ([-10,-10,190], "()=>{__PM.S.wx='clear';__PM.trigger('duststorm',true);}", 8000),
      "clear": ([10,5,190], "()=>{__PM.S.wx='clear';__PM.S.inc=[];}", 6000),
      "fire": ([30,-10,95], "()=>{__PM.S.inc=[];__PM.trigger('dryerfire',true);}", 6000),
      "balefire": ([-25,-12,95], "()=>{__PM.S.inc=[];__PM.trigger('balefire',true);}", 6000),
      "tornado": ([-40,-10,190], "()=>{__PM.S.inc=[];__PM.trigger('tornado',true);}", 9000),
      "tornado2": ([10,-5,190], "()=>{}", 5000),
      "lightning": ([40,-20,127], "()=>{__PM.S.inc=[];__PM.trigger('lightning',true);}", 900),
      "night": ([10,5,190], "()=>{__PM.S.inc=[];const S=__PM.S;S.t=Math.floor(S.t/1440)*1440+16*60;}", 7000),
      "nightclose": ([-20,20,95], "()=>{}", 3000),
      "nightthk": ([34,-15,63], "()=>{}", 3000),
      "basin": ([32,-40,95], "()=>{const S=__PM.S;S.t=Math.floor(S.t/1440)*1440+1440+7*60;}", 5000),
      "flood": ([-62,4,127], "()=>{__PM.S.inc=[];__PM.trigger('flood',true);}", 7000),
      "overflow": ([-15,-12,95], "()=>{__PM.S.inc=[];__PM.trigger('overflow',true);}", 7000),
      "roofleak": ([-35,23,95], "()=>{__PM.S.inc=[];__PM.trigger('roof',true);}", 7000),
      "shaft": ([12,14,63], "()=>{__PM.S.inc=[];__PM.trigger('shaft',true);}", 4000),
      "steamjoint": ([11,5,95], "()=>{__PM.S.inc=[];__PM.trigger('steamjoint',true);}", 5000),
      "boiler": ([74,-10,95], "()=>{__PM.S.inc=[];__PM.trigger('boiler',true);}", 5000),
      "birdhay": ([-12,9,63], "()=>{__PM.S.inc=[];__PM.trigger('birdhay',true);}", 700),
      "badocc": ([-20,-12,95], "()=>{__PM.S.inc=[];__PM.trigger('badocc',true);}", 3000),
      "flares": ([16,-13,95], "()=>{__PM.S.inc=[];__PM.trigger('flares',true);}", 3000),
      "iced": ([-30,-55,95], "()=>{__PM.S.inc=[];__PM.trigger('icedintake',true);__PM.C.simSpeed=30;}", 9000),
      "beaver": ([-22,-12,95], "()=>{__PM.S.inc=[];__PM.trigger('beaver',true);}", 3000),
      "cscreen": ([15,-23,63], "()=>{__PM.S.inc=[];__PM.trigger('cscreen',true);}", 4000),
      "fight": ([-40,-18,63], "()=>{__PM.S.inc=[];__PM.trigger('fight',true);}", 3000),
      "highway": ([-76,4,95], "()=>{__PM.S.inc=[];__PM.trigger('highway',true);}", 3000),
      "fabric": ([47,10,95], "()=>{__PM.S.inc=[];__PM.trigger('fabric',true);}", 4000),
      "winder": ([-18,9,63], "()=>{__PM.S.inc=[];__PM.trigger('winderdown',true);}", 4000),
      "dye": ([24,12,95], "()=>{__PM.S.inc=[];__PM.trigger('dye',true);}", 6000),
      "shaftclose": ([12,14,25], "()=>{__PM.S.inc=[];__PM.trigger('shaft',true);}", 2500),
      "iced50": ([-30,-55,95], "()=>{__PM.S.inc=[];__PM.S.inc.push({id:'icedintake',left:600,total:1200,real:performance.now(),note:''});}", 3000),
      "flood50": ([-62,4,127], "()=>{__PM.S.inc=[];__PM.S.inc.push({id:'flood',left:600,total:1200,real:performance.now(),note:''});}", 3000),
      "dye50": ([24,12,63], "()=>{__PM.S.inc=[];__PM.trigger('dye',true);const i=__PM.S.inc.find(x=>x.id==='dye');i.left=i.total*0.5;}", 3000),
      "beaverfar": ([-14,5,380], "()=>{__PM.S.inc=[];__PM.trigger('beaver',true);}", 3000),
      "beavermid": ([-14,-5,190], "()=>{}", 1500),
      "nightbeaver": ([-22,-12,95], "()=>{__PM.S.inc=[];const S=__PM.S;S.t=Math.floor(S.t/1440)*1440+16*60;__PM.trigger('beaver',true);}", 6000),
      "nighthwy": ([-76,4,95], "()=>{__PM.S.inc=[];__PM.trigger('highway',true);}", 3000),
      "nightfight": ([-40,-18,63], "()=>{__PM.S.inc=[];__PM.trigger('fight',true);}", 3000),
      "nightflares": ([16,-13,95], "()=>{__PM.S.inc=[];__PM.trigger('flares',true);}", 3000),
      "nightsteam": ([11,5,95], "()=>{__PM.S.inc=[];__PM.trigger('steamjoint',true);}", 4000),
      "lbl380": ([-14,5,380], "()=>{__PM.S.inc=[];document.getElementById('labels3d').classList.remove('lbl-off','lbl-idle');}", 2500),
      "lbl253": ([10,-5,253], "()=>{document.getElementById('labels3d').classList.remove('lbl-off','lbl-idle');}", 2500),
      "lbl190": ([10,-5,190], "()=>{document.getElementById('labels3d').classList.remove('lbl-off','lbl-idle');}", 2500),
      "lbl127": ([20,-10,127], "()=>{document.getElementById('labels3d').classList.remove('lbl-off','lbl-idle');__PM.trigger('cscreen',true);}", 2500),
      "t380": ([-14,5,380], "()=>{__PM.S.inc=[];}", 2500),
      "t190": ([10,-5,190], "()=>{}", 2500),
      "t95": ([20,-10,95], "()=>{}", 2500),
      "birdline": ([10,5,190], "()=>{__PM.S.inc=[];__PM.trigger('birdline',true);}", 4000),
      "birdline2": ([10,5,190], "()=>{}", 4500),
    }
    for n in shots:
        cam, setup, wait = SPEC[n]
        pg.evaluate(setup); clear(); pg.evaluate("v=>{__PM.C.simSpeed=1;__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955]);}", cam); pg.wait_for_timeout(wait); clear(); pg.wait_for_timeout(600)
        pg.screenshot(path=SP+n+".jpg", type="jpeg", quality=80)
    print("errors", errs[:3]); b.close()
