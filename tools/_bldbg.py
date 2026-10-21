import sys,pathlib
sys.path.insert(0,'/home/claude/mattserrao/the-paper-mill/tools')
HERE=pathlib.Path('/home/claude/mattserrao/the-paper-mill/tools')
src=(HERE/"bench.py").read_text()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
from playwright.sync_api import sync_playwright
html=pathlib.Path('../index.html').read_text()
i=html.rindex("})();",0,html.rindex("</script>"));html=html[:i]+HOOK+html[i:]
with sync_playwright() as pw:
  b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
  pg=b.new_page(viewport={"width":1280,"height":800})
  pg.on("console",lambda m:print("C",m.type,m.text[:200]))
  pg.on("pageerror",lambda e:print("ERR",str(e)[:300]))
  pg.on("request",lambda r:print("REQ",r.url[:100]) if 'bench.local' not in r.url else None)
  pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/?nosm")
  pg.wait_for_timeout(20000)
  print(pg.evaluate("()=>[typeof window.__PM, window.__PM&&!!__PM.G3, window.__PM&&__PM.G3&&Object.keys(__PM.G3).length]"))
  pg.screenshot(path='/home/claude/bl/dbg.png');b.close()
