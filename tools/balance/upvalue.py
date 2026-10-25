"""What does each upgrade earn in a 30-day season? For each upgrade (its first level) and each (site, week) pair: the same
seeded season played hands-off twice, once with the upgrade bought at t 0, once without. Return = (cash with - cash without)
+ price, i.e. what it earned back; ratio = return / price (>1 pays back inside the season).
Usage: python3 upvalue.py <index.html> <out.jsonl> <ids,comma|all> [bn]"""
import sys, json, pathlib, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
EXTRA = "get ECON(){return ECON},buy:id=>buy(id),get UPS(){return UPS},upCost:(u,l)=>upCost(u,l),setLv:(id,l)=>{S.up[id]=l;applyUpgrades();},"
html = read_html(sys.argv[1]).replace("window.__PM={", "window.__PM={" + EXTRA, 1)
html = html.replace("seedRun(Math.floor(Date.now()/6048e5)", "seedRun(Math.floor((Date.now()+(window.__WK||0)*6048e5)/6048e5)", 1)
out = sys.argv[2]; ids = sys.argv[3]; BNP = sys.argv[4] if len(sys.argv) > 4 else None
CASES = [("rural", 3), ("desert", 11)]
import os
PRE = [x for x in os.environ.get("PRE", "").split(",") if x]
PLAY = """async ([id,bn])=>{const P=__PM,S=P.S,h=P.SIM_STEP||0.25;if(bn)P.setBn(bn);
  {const pl={};for(const pre of (window.__PRE||[]))pl[pre]=(pl[pre]||0)+1;for(const k in pl)P.setLv(k,pl[k]);}   // (set, not bought, in every run of the pair: the one-a-day rule would block the measured buy)
  let price=0;if(id){const u=P.UPS.find(q=>q.id===id);price=P.upCost(u,0);const c0=S.cash;P.buy(id);if(!(S.up[id]>0))return {err:'not bought'};price=c0-S.cash;}
  const c=id=>{const b=document.getElementById(id);if(b&&!b.disabled)b.click();};let n=0;
  while(S.season&&S.season.on){P.step(h);n++;const o=S.cards&&S.cards.open;
    if(o){if(o.c)c('deal-no');else if(o.civ){const b=document.querySelector('#civOv .civbtn');if(b)b.click();}else if(o.outage)c('out-ok');else if(o.report)c('rc-ok');
      if(S.cards.open===o&&!o.rly){S.cards.open=null;}const d=document.getElementById('dealOv');if(d){clearTimeout(d._t);d.hidden=true;}}
    if(S.rel&&S.rel.q&&S.rel.q.length){const q=S.rel.q[0];P.rly.decide(q.a,q.step==='fault'?'reset':'patch');S.rel.q.shift();}
    P.setRunning(false);if(n%4000===0)await new Promise(r=>setTimeout(r,0));}
  return {cash:Math.round(S.cash),start:P.ECON.start,price,bn:S.bn,tons:Math.round(S.tot.prodT),inc:S.tot.incidents};}"""
def season(pw, env, wk, id):
    b = launch(pw); pg = b.new_page(viewport={"width": 800, "height": 500})
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT + f";window.__WK={wk};window.__PRE={json.dumps(PRE)};")
    pg.goto(f"http://bench.local/?env={env}&nobf&notitle&nosave&{LITE}")
    pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()")
    pg.wait_for_function("()=>{const o=document.getElementById('leadOv');return o&&!o.hidden}", timeout=60000)
    pg.evaluate("()=>{window.__held=[];window.__raf=window.requestAnimationFrame;window.requestAnimationFrame=cb=>{window.__held.push(cb);return 0;};}")
    pg.wait_for_function("()=>window.__held.length>0", timeout=10000, polling=20)
    pg.evaluate("()=>{document.querySelector('#leadOv .ldcard[data-l=\"hank\"]').click();document.getElementById('ld-go').click()}")
    pg.wait_for_function("()=>__PM.S.season&&__PM.S.season.on", timeout=60000, polling=50)
    pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;window.requestAnimationFrame=window.__raf;const h=window.__held;window.__held=[];h.forEach(cb=>window.requestAnimationFrame(cb));}")
    r = pg.evaluate(PLAY, [id, BNP]); b.close(); return r
with sync_playwright() as pw:
    allids = None
    for env, wk in CASES:
        todo = ids.split(",")
        for id in todo:
            t0 = time.time(); r = season(pw, env, wk, None if id == "none" else id); r.update(id=id, env=env, wk=wk, bnp=BNP, wall=round(time.time() - t0))
            with open(out, "a") as f: f.write(json.dumps(r) + "\n")
            print(json.dumps(r), flush=True)
