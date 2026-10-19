import pathlib,sys,json
from playwright.sync_api import sync_playwright
src=open(pathlib.Path(__file__).parent/"bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html=pathlib.Path(sys.argv[1]).read_text()
i=html.rindex("})();",0,html.rindex("</script>"));html=html[:i]+HOOK+html[i:]
errs=[]
with sync_playwright() as pw:
  b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]);pg=b.new_page(viewport={"width":1280,"height":760})
  pg.on("pageerror",lambda e:errs.append(str(e)[:300]));pg.on("console",lambda m:m.type=="error" and errs.append(m.text[:300]))
  pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/")
  pg.wait_for_function("window.__B&&__B.first!==null",timeout=120000);pg.wait_for_timeout(1000)
  pg.evaluate("()=>document.getElementById('v2go').click()");pick_leader(pg)
  pg.wait_for_function("()=>__PM.S.hist&&__PM.S.hist.bf",timeout=180000)
  print(pg.evaluate("()=>{const H=__PM.S.hist;return {rows:H.rows.length,first:H.rows[0][0],last:H.rows[H.rows.length-1][0],ev:H.ev.length,ms:H.bfMs,cpu:H.bfCpu,t:__PM.S.t,cash:__PM.S.cash,bytes:JSON.stringify(H).length}}"))
  pg.evaluate("()=>{__PM.setRunning(false);for(let i=0;i<4*60*30;i++)__PM.step(0.25)}")
  print(pg.evaluate("()=>{const H=__PM.S.hist,r=H.rows,HCI=null;return {rows:r.length,last:r[r.length-1][0],sample:r[r.length-1].slice(0,8),tail:r[r.length-1].slice(-34)}}"))
  print("errs",errs[:5])
  b.close()
