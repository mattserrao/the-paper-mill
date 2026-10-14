"""Survival mode balance: whole survival runs played to bankruptcy, sim only (no rendering).
Usage: python3 survival.py <index.html> [runs] [--bot=handsoff|buyer|saver] [--leader=none|chip|dot|fel|hank]
                           [--swap=<leader>@<wave>] [--chip=N|fibre|sales] [--fel=rotate|stock|wet|dry] [--hank=alt|speed|clean]
                           [--set=key=value,...] [--up=U] [--cost=C] [--compound=0|1]
                           [--seed0=1000] [--env=rural] [--bn=winder] [--maxdays=400] [--label=x]

  --bot=handsoff   declines every event card, approves the standard outage budget, buys no upgrades
  --bot=buyer      also buys one upgrade a day when it can afford it and keep a $250k reserve: the first level of each
                   bottleneck fix, then the first one it can afford on a fixed list (cheap and quick-payback first);
                   takes the top outage budget while cash is above $1.5M
  --bot=saver      the buyer, but it never buys the dear capacity upgrades the line doesn't need (warehouse, robots,
                   chest, pulper, forklifts, docks) unless one fixes the bottleneck: it banks the cash instead

  --leader=X       the mill leader (v4.4). none = no leader, the v4.3 baseline. Every bot plays the leader the same way:
                     chip  sales pushes at the first N outages, fibre locks after (--chip=N, default 3; or all one kind)
                     dot   nothing to play: from v5.0.4 she fixes breakdowns on her own (--dot is ignored)
                     fel   (bn) each project goes to the area that limits the line right now; --fel=rotate takes them in turn
                           (--fel=stock|wet|dry for one area only: fibre line, paper machine, finishing)
                     hank  faster rethreads and run it clean in turn (--hank=rethread|clean for one only)
  --swap=X@W       change leader to X in the budget dialog of outage W (the one change a run allows)
  --set=k=v,...    override leader numbers (LEAD in 03d-leaders.js), e.g. --set=fibre=0.04,sales=9
  --up=U --cost=C --compound=0|1   override the wave steps (SURV in 03c-survival.js)

Crews use the game's non-3D path, as in econ.py, so results are slightly optimistic. Seeds are fixed (seed0 + k*7919), so
runs repeat exactly and every setting is tested on the same dice. Prints each run (days survived, wave reached, the
books, what the leader built) and the mean / min / max. A run still alive after --maxdays is reported as alive: a
survival run has to end, so treat that as a balance failure."""
import json, pathlib, sys, statistics as st
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
src = (HERE / "bench.py").read_text()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])

args = [a for a in sys.argv[1:] if not a.startswith("--")]
fl = {a.split("=")[0]: a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--") and "=" in a}
path = args[0]; N = int(args[1]) if len(args) > 1 else 5
bot = fl.get("--bot", "handsoff"); seed0 = int(fl.get("--seed0", 1000)); env = fl.get("--env", ""); bn = fl.get("--bn", "")
up = float(fl["--up"]) if "--up" in fl else None; cost = float(fl["--cost"]) if "--cost" in fl else None
maxdays = int(fl.get("--maxdays", 400)); compound = fl.get("--compound")
leader = fl.get("--leader", "none"); leader = None if leader == "none" else leader
swap = fl["--swap"].split("@") if "--swap" in fl else None
sets = {k: float(v) for k, v in (x.split("=") for x in fl["--set"].split(","))} if "--set" in fl else {}
pol = {"chip": fl.get("--chip", "3"), "fel": fl.get("--fel", "bn"), "hank": fl.get("--hank", "alt"), "dot": fl.get("--dot", "120")}
html = pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
html = html.replace("window.__PM={", "window.__PM={get ECON(){return ECON},get SURV(){return SURV},get LEAD(){return LEAD},get UPS(){return UPS},get BN(){return BN},"
                    "lineCaps:()=>lineCaps(),buy:id=>buy(id),startSurv:id=>startSurvival(id),leadFix:id=>leadFix(id),leadFixable:id=>leadFixable(id),leadFixReady:()=>leadFixReady(),", 1)

ORDER = ["feedconv", "detrash", "safety", "stores", "clean", "fire", "apc", "refiner", "contract", "sales", "drive", "deckle", "shoe",
         "monitor", "rcfa", "reliab", "maintcrew", "pmprog", "winder", "chest", "pulper", "forklift", "docks", "insure", "wh", "agv"]
SAVER_SKIP = ["wh", "agv", "chest", "pulper", "forklift", "docks"]   # dear capacity the line doesn't need once the bottleneck is fixed

RUN = r"""([k,seed0,bn,bot,up,cost,maxdays,ORDER,compound,leader,swap,sets,pol])=>{const P=__PM,E=P.ECON,V=P.SURV;
  if(up!=null)V.up=up;if(cost!=null)V.cost=cost;if(compound!=null)V.compound=compound==="1";for(const key in sets)P.LEAD[key]=sets[key];
  P.startSurv(leader);P.setRunning(false);P.reseed(seed0+k*7919);if(bn)P.setBn(bn);const bn0=P.S.bn;
  const S=P.S,h=P.SIM_STEP||0.25,G=P.G3;let n=0,cards=0,outs=0,lastDay=-1,bought=0,fixes=0;
  const click=id=>{const b=document.getElementById(id);if(b){b.click();return true;}return false;};
  const lv=id=>(S.up&&S.up[id])||0,UP=Object.fromEntries(P.UPS.map(u=>[u.id,u]));
  const price=u=>{const c=u.lv[lv(u.id)];return P.BN[S.bn]&&P.BN[S.bn].ups.includes(u.id)?Math.round(c*0.75/1000)*1000:c;};
  // one upgrade a day: the first level of each bottleneck fix (waiting for it if need be), then the first one on the list it can afford
  const shop=()=>{const fix=(P.BN[S.bn]?P.BN[S.bn].ups:[]).filter(id=>!lv(id)),list=fix.length?fix.slice(0,1):ORDER;
    for(const id of list){const u=UP[id];if(!u||lv(id)>=u.lv.length)continue;if(S.cash-price(u)>=250e3){const l0=lv(id);P.buy(id);if(lv(id)>l0)bought++;return;}}};
  // the leader's part of the outage dialog: the one change of leader, then this outage's pick
  const leadPlan=()=>{if(!S.lead)return;const q=s=>document.querySelector('#out-lead '+s);
    if(swap&&+swap[1]===S.outg.k&&!S.lead.changed){const c=q('#out-lchg');if(c){c.click();const b=q('.ldswap button[data-to="'+swap[0]+'"]');if(b)b.click();}}
    const who=(swap&&+swap[1]===S.outg.k)?swap[0]:S.lead.id,st=S.lead.st;let want=null;
    if(who==='chip')want=pol.chip==='fibre'||pol.chip==='sales'?pol.chip:(st.sales<+pol.chip?'sales':'fibre');
    if(who==='fel')want=pol.fel==='bn'?(()=>{const c=P.lineCaps().filter(x=>x[0]!=='pm'||true),lo=c.reduce((a,b)=>b[2]<a[2]?b:a);return {recv:'pstock',pulper:'pstock',screens:'pstock',pm:'pwet',winder:'pdry',ship:'pdry'}[lo[0]];})():pol.fel==='rotate'?['pdry','pstock','pwet'][(st.pdry+st.pstock+st.pwet)%3]:pol.fel==='stockdry'?['pstock','pdry'][(st.pdry+st.pstock)%2]:'p'+pol.fel;
    if(who==='hank')want=pol.hank==='alt'?['rethread','clean'][((st.rethread||0)+st.clean)%2]:pol.hank;
    if(want){const b=q('#out-lpick button[data-p="'+want+'"]');if(b)b.click();}};
  const waves=[],incW=[],dnW=[];let wk=1,c0=S.cash,i0=0,dn0=0,dn=0;
  while(S.season&&S.season.on&&n<maxdays*1440/h){if(G)G.on=false;P.step(h);n++;const o=S.cards&&S.cards.open;
    if(o){if(o.c){click('deal-no');cards++;}
      else if(o.outage){if(bot!=='handsoff'&&S.cash>1.5e6)document.querySelectorAll('#outOv .orow .seg button[data-v="2"]').forEach(b=>b.click());leadPlan();click('out-ok');outs++;}
      else if(o.report){click('rc-ok');}
      if(S.cards.open)S.cards.open=null;}
    // (v5.0.4: Dot fixes on her own, as each breakdown starts; the bot no longer presses a button)
    if(S.pm!=="run")dn+=h;
    if(S.outg.k!==wk){incW.push(S.tot.incidents-i0);i0=S.tot.incidents;dnW.push(Math.round((dn-dn0)/60));dn0=dn;waves.push(Math.round((S.cash-c0)/1e3));wk=S.outg.k;c0=S.cash;}
    const d=Math.floor(S.t/1440);if(bot!=='handsoff'&&d!==lastDay){lastDay=d;shop();}
    P.setRunning(false);}
  const alive=!!(S.season&&S.season.on),r=S.season&&S.season.result;
  ['seasonOv','dealOv','outOv','rcOv'].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true;});
  const L=S.ledger;
  return {seed:seed0+k*7919,bn:bn0,alive,days:+(S.t/1440).toFixed(2),wave:S.outg.k,minutes:r?r.minutes:null,cash:Math.round(S.cash),bought,
    leader:S.lead?S.lead.id:null,was:S.lead?S.lead.was:null,built:S.lead?S.lead.st:null,fixes:S.lead&&S.lead.fixed?S.lead.fixed.length:0,
    rev:Math.round(L.rev),occ:Math.round(L.occ),energy:Math.round(L.energy),labor:Math.round(L.labor),overhead:Math.round(L.overhead),repairs:Math.round(L.repairs),
    upgrades:Math.round(L.upgrades),tons:Math.round(S.shipT||0),incidents:S.tot.incidents,breaks:S.tot.breaks,cards,outages:outs,wave_net_k:waves,wave_incidents:incW,wave_down_h:dnW};}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 480, "height": 320}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/" + (f"?env={env}" if env else ""))
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000)
    pg.evaluate("()=>document.getElementById('v2go').click()")   # leaves the menu once the start-up precompile is done; each run then starts its own survival run
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000, polling=200); pg.wait_for_timeout(300)
    pg.evaluate("()=>{const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;}")   # sim only
    res = []
    for k in range(N):
        r = pg.evaluate(RUN, [k, seed0, bn, bot, up, cost, maxdays, [x for x in ORDER if x not in SAVER_SKIP] if bot == "saver" else ORDER, compound, leader, swap, sets, pol])
        res.append(r); print(json.dumps(r), flush=True)
    b.close()
d = [r["days"] for r in res]
print("SUMMARY", json.dumps({"label": fl.get("--label", ""), "bot": bot, "leader": leader or "none", "swap": fl.get("--swap", ""), "set": sets, "env": env or "rural", "bn": bn or "seed", "runs": N,
      "up": up, "cost": cost, "compound": compound, "days_mean": round(st.fmean(d), 1), "days_min": min(d), "days_max": max(d),
      "wave_mean": round(st.fmean(r["wave"] for r in res), 1), "alive": sum(r["alive"] for r in res), "errors": errs[:5]}))
