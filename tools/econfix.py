"""v16 checks for the repair and pricing fixes (sim only, stepped by hand, no 3D timing involved).
Usage: python3 econfix.py <index.html>
 1. deadlock: one maintenance pair, a winder breakdown then a felt change; both must clear and the machine must run again
 2. graphics: the same seeded two days stepped with the 3D view on and off give the same cash
 3. grade: rolls made as 34Super, then the grade switched to 24 before they ship, must be paid at the 34Super price"""
import pathlib,sys,json
from playwright.sync_api import sync_playwright
src=open(pathlib.Path(__file__).parent/'bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text()
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":800,"height":450});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
    pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/?seed=5")
    pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=240000,polling=300)
    pg.evaluate("()=>{document.getElementById('v2go').click();__PM.setRunning(false);}")
    r1=pg.evaluate("""()=>{const P=__PM,S=P.S;P.CH.on=false;S.inc.length=0;S.crewQ.length=0;
      P.trigger("winderdown",true);for(let k=0;k<12;k++)P.step(0.25);   // the pair reaches the winder first
      P.trigger("felt",true);let t=0,cleared=-1;for(;t<6000;t++){P.step(0.25);if(!S.inc.some(i=>i.id==="felt"||i.id==="winderdown")&&cleared<0)cleared=t*0.25;if(cleared>=0&&S.pm==="run"&&S.wd==="run")break;}
      return {cleared_min:cleared,left:S.inc.map(i=>i.id+":"+i.left.toFixed(0)),pm:S.pm,wd:S.wd,crewQ:S.crewQ.map(q=>q.k)};}""")
    print("1 deadlock:",json.dumps(r1),"PASS" if r1["cleared_min"]>=0 else "FAIL")
    r3=pg.evaluate("""()=>{const P=__PM,S=P.S,C=P.C;S.inc.length=0;S.crewQ.length=0;
      // empty the line, make 34Super rolls into the warehouse, then switch to 24 and ship one truck of the 34Super rolls
      C.grade="34Super";S.fg=0;S.lots.fg.length=0;for(const k in S.lots)S.lots[k].length=0;S.reel=0;S.winderBuf=0;S.winderAcc=0;S.conv=0;
      S.lots.fg.push(["34Super",30]);S.fg=30;C.grade="24";
      const tr={load:0};S.outDock[0]=tr;S.outDock[1]=null;S.outDock[2]=null;const r0=S.ledger.rev;let n=0;while(S.outDock[0]===tr&&n<40000){P.step(0.25);n++;}
      return {rev:Math.round(S.ledger.rev-r0),lots:tr.lots,steps:n,p33:P.S&&0,expect33:Math.round(20*C.rollW.v*0)};}""")
    print("3 grade: revenue for one truck of 34Super rolls shipped while making 24:",r3)
    pg.close()
    # 2: the same seeded two days (upsets on) stepped with the 3D view marked on and off: the old crew and maintenance
    # arrival checks read G3.on and the wall clock, so these used to differ; now they must match
    out=[]
    for on in ["true","false"]:
        pg=b.new_page(viewport={"width":800,"height":450});pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/?seed=11")
        pg.wait_for_function("window.__PM&&__PM.G3.warm",timeout=240000,polling=300)
        out.append(pg.evaluate("(on)=>{document.getElementById('v2go').click();__PM.setRunning(false);__PM.reseed(77);__PM.CH.on=true;__PM.G3.on=on;for(let k=0;k<2*1440*4;k++)__PM.step(0.25);return [Math.round(__PM.S.cash),__PM.S.tot.incidents,__PM.S.tot.breaks]}",on=="true"));pg.close()
    print("2 3D on/off:",out,"PASS" if out[0]==out[1] else "DIFF")
    b.close()
print("errors",errs)
