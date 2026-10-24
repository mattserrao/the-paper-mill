"""v6.12.1 rendered QA pass: one season per site with the 3D view ON (the bot runs in qa_v6121.py render nothing), at speed
60 for ~3 real minutes each, answering cards with the first choice. Logs page/console errors, slow frames, and screenshots
the new shop, the approach bay, the fan pump yard and the whole site. Usage: python3 qa_render_v6121.py <index.html> <outdir>"""
import sys, pathlib, json, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
html = read_html(sys.argv[1]); OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
ANS = """()=>{const S=__PM.S,o=S.cards&&S.cards.open;if(!o)return '';const c=id=>{const b=document.getElementById(id);if(b&&!b.disabled)b.click();};
  if(o.c)c('deal-no');else if(o.civ){const b=document.querySelector('#civOv .civbtn');if(b)b.click();}else if(o.outage)c('out-ok');else if(o.report)c('rc-ok');
  else if(o.rly){const b=document.querySelector('#rlyOv button');if(b)b.click();}return Object.keys(o).join();}"""
res = []
with sync_playwright() as pw:
    for env, leader in (("rural", "chip"), ("urban", "dot"), ("desert", "fel"), ("swamp", "hank")):
        errs = []; b = launch(pw)
        pg = b.new_page(viewport={"width": 1280, "height": 800})
        pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
        pg.on("console", lambda m: m.type in ("error",) and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:240]))
        pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto(f"http://bench.local/?env={env}&notitle&nosave")
        pg.wait_for_function("window.__PM&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
        pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg, leader)
        pg.evaluate("()=>{const t=document.getElementById('tut');if(t)t.hidden=true;__PM.C.simSpeed=60;__PM.setRunning(true);__B.rec=true;}")
        t0 = time.time(); kinds = {}; shots = 0
        views = [("bay", "()=>__PM.G3.camTo(66,8,40)"), ("shop", "()=>__PM.G3.jump('shop')"), ("fanyard", "()=>__PM.G3.camTo(58,-7,40)"), ("site", "()=>__PM.G3.jump('site')")]
        while time.time() - t0 < 180:
            k = pg.evaluate(ANS)
            if k: kinds[k] = kinds.get(k, 0) + 1
            pg.evaluate("()=>{if(!__PM.running&&!(__PM.S.cards&&__PM.S.cards.open))__PM.setRunning(true);}")
            if shots < len(views) and time.time() - t0 > 30 + shots * 35:
                n, js = views[shots]; pg.evaluate(js); pg.wait_for_timeout(6000); pg.screenshot(path=str(OUT / f"{env}-{n}.png")); shots += 1
            pg.wait_for_timeout(400)
        st = pg.evaluate("""()=>{const B=__B,f=B.frames.slice().sort((a,b)=>a-b),g=B.gaps.slice().sort((a,b)=>a-b),q=(a,p)=>a.length?+a[Math.floor((a.length-1)*p)].toFixed(1):null;
          const S=__PM.S;return {day:+(S.t/1440).toFixed(2),cash:Math.round(S.cash),inc:S.tot.incidents,breaks:S.tot.breaks,frames:f.length,cpu_p50:q(f,.5),cpu_p95:q(f,.95),gap_p50:q(g,.5),gap_p99:q(g,.99),over100:g.filter(x=>x>100).length,
            feedTail:S.feed.slice(0,12).map(l=>l.text)}}""")
        st.update(env=env, leader=leader, cards=kinds, errors=errs[:12]); res.append(st)
        print(json.dumps(st)[:600], flush=True); b.close()
(OUT / "render.json").write_text(json.dumps(res, indent=1))
