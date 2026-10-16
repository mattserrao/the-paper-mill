"""v5.7: phone screenshots of the Round card, the walk strip and the outage prep card.
Usage: python3 telluishots.py <index.html> <outdir>"""
import pathlib, sys
exec(open(pathlib.Path(__file__).parent / "tellcheck.py").read().split("with sync_playwright() as pw:")[0])
out = pathlib.Path(sys.argv[2]); out.mkdir(exist_ok=True)
with sync_playwright() as pw:
    b, pg, errs = boot(pw, "season", phone=True)
    pg.evaluate(STEPTO, 4 * 1440 + 30); pg.evaluate(CLR)
    pg.evaluate("()=>{const P=__PM,S=P.S;S.up.reliab=1;S.tell.day=-1;S.tell.q=[{id:'felt',due:S.t+600,born:S.t,area:'wet'},{id:'ragger',due:S.t+2000,born:S.t,area:'pulp'}];P.setRunning(true);}")
    pg.wait_for_timeout(2500); pg.click("#v2round"); pg.wait_for_timeout(1500); pg.screenshot(path=str(out / "ui-card.png"))
    pg.click("#tellOv .tarea[data-a='wet']"); pg.wait_for_function("()=>!!__PM.G3.tellScreen('felt')", timeout=30000)
    pg.evaluate("()=>{const G=__PM.G3,p=G.tellPos('felt'),c=G.camGet();G.tellHold();G.camSet([p[0],p[1],58,c[3],0.62]);}"); pg.wait_for_timeout(8000)
    pg.screenshot(path=str(out / "ui-walk.png"))
    pg.evaluate("()=>{__PM.G3.tellRoundStop();__PM.setRunning(false);}")
    pg.evaluate(STEPTO, 7 * 1440 + 120 - 30 * 60); pg.evaluate(CLR); pg.evaluate("()=>{__PM.tell.prepDo('parts','wait');__PM.tell.prepDo('crew');__PM.setRunning(true)}")
    pg.wait_for_timeout(2500); pg.screenshot(path=str(out / "ui-topbar.png"), clip={"x": 0, "y": 0, "width": 390, "height": 140})
    pg.evaluate("()=>__PM.G3.prepOpen()"); pg.wait_for_timeout(1500); pg.screenshot(path=str(out / "ui-prep.png"), full_page=False)
    print("errors", errs); b.close()
