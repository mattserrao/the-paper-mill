"""v6.5.7 winder check: reel storage while the winder is down, the two-roll set, tied rolls and sheet-break steam venting.
Usage: python3 windercheck.py <index.html> [shot_prefix]
Prints the sim's reel storage against the 3D storage stands, and saves screenshots of the dry end when a prefix is given."""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
src = open(HERE / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
exec("def pick_leader" + src.split("def pick_leader")[1].split("def stats")[0])
html = pathlib.Path(sys.argv[1]).read_text()
shot = sys.argv[2] if len(sys.argv) > 2 else None
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
errs, fails = [], []
def ok(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name + (" " + str(extra) if extra else ""))
    if not cond: fails.append(name)
CAM = "[-18,5,34,-0.55,0.75,1]"
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1000, "height": 640})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{__PM.CH.on=false;__PM.setFps('max');window.__civ=()=>{const d=document.getElementById('deal-no');if(d&&d.offsetParent)d.click();const b=document.querySelector('#civOv:not([hidden]) .civbtn');if(b){b.click();return true;}return false;};window.__deal=()=>{const d=document.getElementById('deal-no');if(d&&d.offsetParent)d.click();};window.__ff=m=>{for(let i=0;i<m*4;i++)__PM.step(0.25);__civ();if(!__PM.running&&document.getElementById('v2menu').hidden)__PM.setRunning(true);};}")
    # (software rendering is slow: the sim is fast-forwarded in chunks between frames so the 3D still sees every reel)
    def ff(m, wait=300):
        pg.evaluate(f"()=>__ff({m})"); pg.wait_for_timeout(wait)
    # --- 1. winder down: reels go to storage, all four stands fill, then the machine backs up
    pg.evaluate("()=>{__PM.trigger('winderdown',true);const i=__PM.S.inc.find(x=>x.id==='winderdown');i.left=i.total=1e6;__PM.C.simSpeed=120;}")
    pg.evaluate(f"()=>__PM.G3.camSet({CAM})")
    seen = []
    for k in range(200):
        ff(12)
        r = pg.evaluate("""()=>{const S=__PM.S,G=__PM.G3,st=Math.max(0,Math.ceil(S.winderBuf/100-0.005)-1);
          return {stored:st,pm:S.pm,vis:(G.parkedN??-1),turn:S.tot.turnups,buf:+S.winderBuf.toFixed(1)}}""")
        seen.append(r)
        if r["pm"] == "spools" and r["vis"] == r["stored"]: break
    print("winder down:", json.dumps(seen[-1]))
    print("running:", pg.evaluate("()=>({run:__PM.running,ov:[...document.querySelectorAll('body *')].filter(e=>/(ov|Ov|card|modal|dlg)/.test(e.id)&&!e.hidden&&e.offsetParent&&getComputedStyle(e).position==='fixed').map(e=>e.id).slice(0,8)})"))
    print("crane:", pg.evaluate("()=>{const C=__PM.G3.CR;const f=j=>j&&({kind:j.kind,fromPark:!!j.fromPark,fromReel:!!j.fromReel,picked:!!j.picked,dropped:!!j.dropped,delay:j.delay,b:j.b});return {j:f(C.j),jobs:C.jobs.map(f),t:C.t,hidePark:C.hidePark,lastPark:C.lastPark,lastTurn:C.lastTurn}}"))
    mx = max(s["stored"] for s in seen)
    ok("four reels stored before the machine backs up", mx >= 4, mx)
    ok("machine stops on spools only with storage full", all(s["stored"] >= 4 for s in seen if s["pm"] == "spools"))
    ok("stands match the sim at rest", seen[-1]["vis"] == seen[-1]["stored"], seen[-1])
    pg.wait_for_timeout(5000)
    r = pg.evaluate("()=>({stored:Math.max(0,Math.ceil(__PM.S.winderBuf/100-0.005)-1),vis:(__PM.G3.parkedN??-1)})")
    ok("stands match the sim after the crane settles", r["vis"] == r["stored"], r)
    if shot: pg.evaluate("()=>{__PM.C.simSpeed=1}"); pg.wait_for_timeout(800); pg.screenshot(path=f"{shot}-storage-full.png")
    # --- 2. winder back: storage drains reel by reel onto the unwind
    pg.evaluate("()=>{__PM.S.inc.find(x=>x.id==='winderdown').left=0;__PM.C.simSpeed=60;}")
    drained = []
    for k in range(200):
        ff(12)
        r = pg.evaluate("()=>{const S=__PM.S,G=__PM.G3;return {stored:Math.max(0,Math.ceil(S.winderBuf/100-0.005)-1),vis:(G.parkedN??-1),pm:S.pm,rolls:S.tot.rolls}}")
        drained.append(r)
        if r["stored"] <= 1 and k > 4: break
        if k % 8 == 0 and r["vis"] != r["stored"]: print("  (crane catching up)", r)
    print("drain:", json.dumps(drained[-1]))
    ok("storage drains after the winder is fixed", drained[-1]["stored"] < mx)
    if shot:
        pg.evaluate("()=>{__PM.C.simSpeed=1;__PM.G3.camSet([-21,8,16,-0.9,0.7,1])}")
        r0 = pg.evaluate("()=>__PM.S.tot.rolls")
        for k in range(80):
            pg.evaluate("()=>__ff(0.5)")
            if pg.evaluate("()=>__PM.S.tot.rolls") > r0: break
        pg.screenshot(path=f"{shot}-set-0.png")
        for k in range(1, 7): pg.wait_for_timeout(900); pg.screenshot(path=f"{shot}-set-{k}.png")
    # --- 3. two rolls per set
    r0 = pg.evaluate("()=>__PM.S.tot.rolls")
    for k in range(10): ff(12)
    r1 = pg.evaluate("()=>__PM.S.tot.rolls")
    ok("rolls come off in pairs", r1 > r0 and r1 % 2 == 0 and r0 % 2 == 0, (r0, r1))
    # --- 4. rolls tied together
    has = pg.evaluate("()=>__PM.EVENTS.some(e=>e.id==='tiedrolls')")
    ok("tied rolls upset exists", has)
    if has:
        b0 = pg.evaluate("()=>({beat:__PM.S.tot.beatRolls||0,rolls:__PM.S.tot.rolls})")
        pg.evaluate("()=>{__PM.C.simSpeed=6;__PM.trigger('tiedrolls');}")
        pg.evaluate("()=>__PM.G3.camSet([-22,8,15,-0.9,0.7,1])")
        for k in range(4): pg.wait_for_timeout(700); pg.evaluate("()=>__deal()")
        pg.wait_for_timeout(1500)
        if shot: pg.screenshot(path=f"{shot}-tied-card.png")
        ok("tied rolls civics card", pg.evaluate("()=>{const e=document.getElementById('civOv');return !!e&&!e.hidden&&/tied/i.test(e.textContent)}"))
        pg.evaluate("()=>__civ()")
        st = pg.evaluate("()=>{const i=__PM.S.inc.find(x=>x.id==='tiedrolls');return i?{left:i.left,q:i.q,down:__PM.S.M.winderDown}:null}")
        ok("tied rolls stop the winder", st and st["down"], st)
        for k in range(8):
            ff(2, 900)
            if shot and k in (1, 4, 6): pg.screenshot(path=f"{shot}-tied-{k}.png")
        for k in range(60):
            if not pg.evaluate("()=>__PM.S.inc.some(x=>x.id==='tiedrolls')"): break
            ff(2, 150)
        b1 = pg.evaluate("()=>({beat:__PM.S.tot.beatRolls||0,rolls:__PM.S.tot.rolls})")
        ok("both tied rolls go to the beater", b1["beat"] - b0["beat"] == 2, (b0, b1))
    # --- 5. sheet break: steam keeps flowing and is vented
    for k in range(20):
        ff(5, 100)
        if pg.evaluate("()=>__PM.S.pm==='run'&&__PM.S.dry&&__PM.S.dry.steam>10"): break
    run = pg.evaluate("()=>({pm:__PM.S.pm,steam:(__PM.S.dry&&__PM.S.dry.steam)||0})")
    pg.evaluate("()=>{const S=__PM.S;S.pm='break';S.brkType='reel';S.breakLeft=S.breakTotal=400;}")
    ff(10)
    brk = pg.evaluate("()=>({pm:__PM.S.pm,steam:(__PM.S.dry&&__PM.S.dry.steam)||0,vent:(__PM.S.dry&&__PM.S.dry.vent)||0})")
    print("steam running:", run, "on a break:", brk)
    ok("steam keeps flowing on a sheet break", brk["pm"] == "break" and brk["steam"] > 0.5 * run["steam"], (run, brk))
    ok("steam is vented on a sheet break", brk["vent"] > 0, brk)
    if shot:
        pg.evaluate("()=>{__PM.C.simSpeed=1;__PM.G3.camSet([20,6,60,-0.5,0.55,4])}"); pg.wait_for_timeout(2500)
        pg.screenshot(path=f"{shot}-vent.png")
    b.close()
for e in errs[:10]: print(e)
ok("no page errors", not errs, len(errs))
print("RESULT", "ok" if not fails else "FAILED: " + ", ".join(fails))
