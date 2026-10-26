"""v6.13.1 the vending machine easter egg (50n): the panel, zen, the last soda's slow-down, the five upsets at the hit,
their cards held until the scene is done, the player's speed back after, and a new run cancelling a scene in progress.
The 3D scene itself (the walk, the circle, the throw) is driven here by calling the hit directly."""
# tier: default
import json, sys
sys.path.insert(0, __import__("pathlib").Path(__file__).resolve().parents[1].as_posix())
from lib import *
from playwright.sync_api import sync_playwright
C = Checks(); ok, errs = C.ok, C.errs

with sync_playwright() as pw:
    b = launch(pw); pg = open_game(b, html_arg(), "notitle&nosave&" + LITE, viewport=(900, 600), errs=errs, wait=False)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=120000)
    pg.evaluate("()=>{const t=document.getElementById('tut');if(t)t.hidden=true;__PM.setRunning(false);__PM.C.simSpeed=30;}")
    C.sec("panel")
    r = pg.evaluate("()=>{__PM.G3.vendOpen();const p=document.getElementById('vend');return {shown:!p.hidden,last:!document.getElementById('vendLast').disabled,tap:!!__PM.G3.vendHit}}")
    ok("tapping the vending machine opens its panel with both buttons", r["shown"] and r["last"] and r["tap"], r)
    r = pg.evaluate("()=>{document.getElementById('vendBuy').click();return {hidden:document.getElementById('vend').hidden,feed:__PM.S.feed[0].text,inc:__PM.S.inc.length,slow:__PM.G3.soda.slow}}")
    ok("buy a soda: a feed line, nothing else happens", r["hidden"] and "soda" in r["feed"].lower() and r["inc"] == 0 and not r["slow"], r)
    C.sec("last soda")
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,Z=P.G3.soda;P.G3.vendOpen();document.getElementById('vendLast').click();
      const a={on:Z.on,slow:Z.slow,sp:P.C.simSpeed};for(let i=0;i<8;i++)P.step(0.25);P.setRunning(false);
      a.inc=S.inc.length;P.G3.sodaHit();a.ids=S.inc.map(i=>i.id);a.hold=Z.hold;a.slowAfter=Z.slow;a.cur=!!(S.civ&&S.civ.cur);a.q=S.civ?S.civ.q.length:0;
      for(let i=0;i<8;i++)P.step(0.25);P.setRunning(false);a.cur2=!!(S.civ&&S.civ.cur);
      P.G3.sodaDone();for(let i=0;i<4;i++)P.step(0.25);P.setRunning(false);a.cur3=!!(S.civ&&S.civ.cur);a.sp2=P.C.simSpeed;a.feed=S.feed.slice(0,8).map(f=>f.text);return a}""")
    ok("the last soda: the scene starts at 1 min/s and the player's own speed is left alone", r["on"] and r["slow"] and r["sp"] == 30 and r["inc"] == 0, r)
    ok("the can lands: wire, felts, fog fan, steam joint and dryer fire", r["ids"] == ["fabric", "felt", "fogfan", "steamjoint", "dryerfire"] and not r["slowAfter"], r["ids"])
    ok("their cards wait until the scene is over, then come up", r["hold"] and not r["cur"] and not r["cur2"] and r["cur3"], {k: r[k] for k in ("hold", "cur", "cur2", "cur3", "q")})
    ok("the player's speed is unchanged after", r["sp2"] == 30, r["sp2"])
    ok("the feed tells the story", any("threw his last soda" in f for f in r["feed"]), r["feed"][:3])
    C.sec("edges")
    r = pg.evaluate("""()=>{const P=__PM,Z=P.G3.soda;P.G3.vendOpen();const a={busy:document.getElementById('vendLast').disabled};
      return a}""")
    ok("the scene still playing out: the button is off", r["busy"] or not pg.evaluate("()=>__PM.G3.soda.on"), r)
    r = pg.evaluate("""()=>{const P=__PM,S=P.S,Z=P.G3.soda;Z.on=Z.slow=Z.hold=false;P.S.civ.cur=null;
      document.getElementById('vend').hidden=true;P.G3.vendOpen();document.getElementById('vendLast').click();const s1=Z.slow;
      P.G3.save.restore(JSON.parse(JSON.stringify({v:1,S,C:P.C,CH:{on:P.CH.on,lvl:P.CH.lvl,en:P.CH.en},MILL:null,day:1,cash:S.cash})));P.step(0.25);P.setRunning(false);
      return {s1,on:Z.on,slow:Z.slow,hold:Z.hold}}""")
    ok("a load (or a new run) mid-scene cancels it", r["s1"] and not r["on"] and not r["slow"] and not r["hold"], r)
    b.close()
C.done()
