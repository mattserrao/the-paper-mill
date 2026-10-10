"""Economy balance: full 30-day seasons played by a hands-off player, sim only (no rendering).
Usage: python3 econ.py <index.html> [runs] [--price=+0] [--outage=0] [--seed0=1000] [--label=x] [--env=rural] [--bn=winder]

  --price=D    add D $/t to every grade's sales price (ECON.price)
  --outage=K   lower every outage budget level by K $ (OUT.cost [50k,100k,200k] -> [50k-K,100k-K,200k-K])

The hands-off player: declines every event card, approves the default outage budget (Standard in all three areas),
buys no upgrades, and closes report cards.
Crews use the game's non-3D path (G3.on off during the run): they keep their response times but don't walk to the
job in 3D, which in real play adds up to ~6-25 s of wall time per job. So results are slightly optimistic. Seeds are fixed (seed0 + k*7919), so runs repeat exactly and every
condition is tested on the same seasons. Prints per-run results and the mean / SD of the finishing balance
(cash at season end; the season starts with ECON.start = $2M) and of profit (finish - start)."""
import json, pathlib, sys, statistics as st
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
src = (HERE / "bench.py").read_text()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])

args = [a for a in sys.argv[1:] if not a.startswith("--")]
fl = {a.split("=")[0]: a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--") and "=" in a}
path = args[0]; N = int(args[1]) if len(args) > 1 else 10
price = float(fl.get("--price", 0)); outage = float(fl.get("--outage", 0)); seed0 = int(fl.get("--seed0", 1000))
env = fl.get("--env", ""); bn = fl.get("--bn", "")   # v4.1: site environment (URL ?env=) and a forced bottleneck (else the seed's own)
html = pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
# expose the economy constants to the harness (only in this test copy of the page)
html = html.replace("window.__PM={", "window.__PM={get ECON(){return ECON},get OUT(){return OUT},", 1)

RUN = r"""([k,seed0,price,outage,bn])=>{const P=__PM,E=P.ECON,O=P.OUT;
  if(!window.__base){window.__base={price:{...E.price},cost:O.cost.slice()};}
  for(const g in E.price)E.price[g]=__base.price[g]+price;O.cost=__base.cost.map(c=>c-outage);
  document.getElementById('v2season').click();P.setRunning(false);P.reseed(seed0+k*7919);if(bn)P.setBn(bn);const bn0=P.S.bn;
  const S=P.S,h=P.SIM_STEP||0.25,start=S.cash;let n=0,cards=0,outs=0,reports=0,outSpend=0;
  const click=id=>{const b=document.getElementById(id);if(b){b.click();return true;}return false;};
  const G=P.G3;
  while(S.season&&S.season.on&&n<2e6){if(G)G.on=false;P.step(h);n++;const o=S.cards&&S.cards.open;
    if(o){if(o.c){click('deal-no');cards++;}
      else if(o.outage){const c0=S.ledger.repairs;click('out-ok');outSpend+=S.ledger.repairs-c0;outs++;}
      else if(o.report){click('rc-ok');reports++;}
      if(S.cards.open)S.cards.open=null;}   // anything else: close it so the season keeps going
    P.setRunning(false);}
  ['seasonOv','dealOv','outOv'].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true;});
  const L=S.ledger;
  return {seed:seed0+k*7919,bn:bn0,days:+(S.t/1440).toFixed(2),finish:Math.round(S.cash),profit:Math.round(S.cash-start),bust:!!(S.season&&S.season.bust)||S.cash<E.bankrupt,
    rev:Math.round(L.rev),occ:Math.round(L.occ),energy:Math.round(L.energy),labor:Math.round(L.labor),overhead:Math.round(L.overhead),
    repairs:Math.round(L.repairs),outage_budget:Math.round(outSpend),premium:Math.round(L.premium),tons:Math.round(S.shipT||0),
    incidents:S.tot.incidents,breaks:S.tot.breaks,cards,outages:outs,reports};}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 480, "height": 320}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/" + (f"?env={env}" if env else ""))
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=120000)
    pg.evaluate("()=>document.getElementById('v2go').click()")
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=120000, polling=200); pg.wait_for_timeout(300)
    pg.evaluate("()=>{const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;}")   # sim only
    res = [pg.evaluate(RUN, [k, seed0, price, outage, bn]) for k in range(N)]
    b.close()
f = [r["finish"] for r in res]
summary = {"label": fl.get("--label", ""), "env": env or "rural", "bn": bn or "seed", "runs": N, "price_delta": price, "outage_delta": -outage,
           "finish_mean": round(st.fmean(f)), "finish_sd": round(st.stdev(f)) if N > 1 else 0,
           "profit_mean": round(st.fmean(r["profit"] for r in res)), "busts": sum(r["bust"] for r in res),
           "mean": {k: round(st.fmean(r[k] for r in res)) for k in ("rev", "occ", "energy", "labor", "overhead", "repairs", "outage_budget", "premium", "tons", "incidents", "breaks", "outages", "cards")},
           "errors": errs[:5]}
for r in res: print(json.dumps(r))
print("SUMMARY", json.dumps(summary))
