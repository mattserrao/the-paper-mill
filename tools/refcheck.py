"""v6.9.2 refiners and the machine chest: a plate clash stops forward flow, the machine runs the machine chest down and
trips on low level, the stock chest isn't drawn while it does, and once the refiners are back the chest refills and the
machine comes back. Also: the knob's clash does the same, the "run on one refiner" choice ends the trip with the machine
held at 75%, and the relationship map has the new links. Usage: python3 refcheck.py <index.html>"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
exec((HERE / "bench.py").read_text().split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
html = html.replace("window.__PM={", "window.__PM={get RMX(){return {e:RM_E,col:RM_COL,tags:TAGS.map(t=>t[0])}},mcLvl:()=>mcLvlNow(),get M(){return S.M},civApply:(d,i)=>civApply(d,i,false),clearIncident:id=>clearIncident(id),", 1)
F = []
def ok(n, c, g=None):
    print(("PASS " if c else "FAIL ") + n + ("" if c else "  got: " + json.dumps(g)[:400]))
    if not c: F.append(n)
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1000, "height": 700}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?env=rural&nobf")
    pg.wait_for_function("window.__PM&&__B.first!==null", timeout=300000)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg, "chip")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000)
    ev = pg.evaluate
    ev("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;}")
    RUN = """(mins)=>{const P=__PM,S=P.S,o=[];S.cards.next=1e12;for(let i=0;i<mins*4;i++){P.step(0.25);if(S.civ&&S.civ.cur){S.civ.cur=null;S.cards.open=null;}if(S.cards.open&&!S.cards.open.civ)S.cards.open=null;
      if(i%4===0)o.push([Math.round(S.t),+P.mcLvl().toFixed(1),S.pm,+S.tank.toFixed(1),!!(S.M&&S.M.refOut)]);}return o;}"""
    ev("()=>{const S=__PM.S;S.inc=[];S.M=__PM.mods?__PM.mods():S.M;}")
    ev(f"({RUN})(60)")   # settle
    ev("()=>{__PM.S.feed.length=0}")
    r = ev("()=>{const S=__PM.S;S.cards.next=1e12;__PM.trigger('refclash');const i=S.inc.find(x=>x.id==='refclash');if(i){i.left=i.total=90;}return {inc:!!i,pm:S.pm,lvl:__PM.mcLvl()}}")
    ok("a clash starts with the machine still running on the machine chest", r["inc"] and r["pm"] == "run", r)
    tr = ev(f"({RUN})(150)")
    lv = [x[1] for x in tr]; pm = [x[2] for x in tr]
    first_down = next((i for i, x in enumerate(tr) if x[2] != "run" and x[4]), None)
    ok("the machine chest runs down while the refiners are out", min(lv) <= 10.5, lv[:20])
    ok("the machine trips on low level a few minutes after the clash (not at once)", first_down is not None and 2 <= first_down <= 15, [first_down, tr[:16]])
    dr = [x for x in tr if x[4] and x[2] == "run"]
    ok("the stock chest isn't drawn while the machine runs on the machine chest", len(dr) < 2 or dr[-1][3] >= dr[0][3] - 0.01, dr[:6])
    back = next((i for i, x in enumerate(tr) if not x[4]), None)
    ok("the refiners come back after the repair", back is not None, tr[-3:])
    after = tr[back:] if back is not None else []
    ok("the chest refills and the machine comes back (rethread)", any(x[1] >= 35 for x in after) and any(x[2] in ("run", "break") for x in after[5:]), after[:30])
    ok("the machine stays down while the refiners are out", all(x[2] != "run" for x in tr[first_down + 1:back]) if first_down is not None and back else False, tr[first_down:back][:10] if first_down else None)
    lg = ev("()=>__PM.S.feed.map(l=>l.text).join(' | ')")
    ok("the trip and the restart are logged", "Machine chest low level" in json.dumps(lg) and "coming back up" in json.dumps(lg), str(lg)[-600:])
    # the shortcut: run on one refiner until the outage
    ev(f"({RUN})(120)")
    r = ev("""()=>{const P=__PM,S=P.S;P.trigger('refclash');const i=S.inc.find(x=>x.id==='refclash');P.civApply({id:'refclash',kind:'up'},2);P.step(0.25);return {inc:S.inc.some(x=>x.id==='refclash'),fx:(S.fx||[]).map(f=>f.id)}}""")
    ok("'Run on one refiner' ends the trip and caps the machine until the outage", not r["inc"] and "band_refclash" in r["fx"], r)
    tr = ev(f"({RUN})(30)")
    ok("...and the machine keeps running", tr[-1][2] in ("run", "break") and tr[-1][1] > 30, tr[-5:])
    # the relationship map
    rm = ev("()=>__PM.RMX")
    keys = {(a, b) for a, b, *_ in rm["e"]}
    need = [("chest", "refq"), ("refq", "mcLvl"), ("gap", "refq"), ("x:upsets", "refq"), ("kwh", "couchSol"), ("kwh", "rct"), ("lv104op", "refq")]
    ok("relationship map: refiners fed from the stock chest, feeding the machine chest, the clash, and refining vs drainage", all(k in keys for k in need), [k for k in need if k not in keys])
    ok("relationship map: refq is a tag in the SPOT column", "refq" in rm["tags"] and "refq" in rm["col"]["SPOT"], None)
    ok("no page errors", not errs, errs)
    print("RESULT:", "OK" if not F else f"FAIL {F}")
