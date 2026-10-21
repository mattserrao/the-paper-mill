"""Helpers shared by checks/tells.py and checks/help.py (underscore: not a check, run_checks.py skips it).

    from _kit import boot, CLR, STEPTO

boot() starts a page in a mode (season / surv / free / zen), CLR clears whatever would block the sim (civics, reliability
cards, event cards, overlays other than the Round and prep), STEPTO steps the sim to a minute answering what it asks."""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *

CLR = """()=>{const P=__PM,S=P.S;if(S.civ){S.civ.q=[];S.civ.cur=null;S.civ.pending=null;}if(S.rel){S.rel.q=[];S.rel.cur=null;S.rel.pend=[];S.rel.rep=[];S.inc=S.inc.filter(i=>!i.kind);const o=document.getElementById("rlyOv");if(o)o.hidden=true;}P.CH.en.drivefail=false;P.CH.en.bearingfail=false;P.CH.en.motorfail=false;P.CH.en.rectfail=false;if(S.cards){S.cards.open=null;S.cards.next=1e12;}
  document.querySelectorAll('.overlay').forEach(o=>{if(o.id!=='prepOv'&&o.id!=='tellOv')o.hidden=true});}"""
# step the sim to minute t, answering anything that would block it (civics cards, event cards, the outage budget at its defaults)
STEPTO = """t=>{const P=__PM,S=P.S;let n=0;while(S.t<t&&n<4e6){P.step(P.SIM_STEP);n++;
  if(S.cards&&S.cards.open){if(S.cards.open.outage){const b=document.getElementById('out-ok');if(b)b.click();}else S.cards.open=null;}
  if(S.civ&&(S.civ.cur||S.civ.pending)){S.civ.cur=null;S.civ.pending=null;S.civ.q=[];}}return S.t;}"""


def boot(pw, html, mode, phone=False, q="", errs=None):
    """A page on the game started in `mode` ('season' and 'surv' pick Hank; 'free'; anything else stays on the menu),
    paused. q: more query (e.g. '&zen=1', '&' + LITE). Page errors go into errs. Returns (browser, page)."""
    b = launch(pw)
    vp = {"width": 390, "height": 760} if phone else {"width": 900, "height": 560}
    pg = b.new_page(viewport=vp, device_scale_factor=1, has_touch=phone, is_mobile=phone)
    if errs is not None: pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?notitle&nosave" + q)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=240000, polling=500)
    if mode == "free": pg.evaluate("()=>document.getElementById('v2free').click()")
    elif mode in ("season", "surv"):
        pg.evaluate("()=>document.getElementById(%r).click()" % ("v2surv" if mode == "surv" else "v2go"))
        pick_leader(pg, "hank")
    pg.evaluate("()=>__PM.setRunning(false)")
    return b, pg
