"""Balance QA: full 30-day seasons played by scripted QA testers with different play styles, many seasons per page
(sim only, the 3D off), through the game's real dialogs (choice cards, deals, outage budgets, report cards).

Usage: python3 qa_balance.py <index.html> <styles> <seeds> [--seed0=1000] [--env=rural|urban|desert|swamp|cycle]
       [--out=file.jsonl] [--lead=cycle|chip|dot|fel|hank]
  styles: comma list of
    handsoff  declines every deal, Standard outages, buys nothing, civics: the "quick" answer + standing orders
    rounds    handsoff, plus a daily Round (rotating areas, the Vibration Report's busiest area once it has one),
              catching every tell it walks past, and the full outage prep checklist
    active    rounds, plus a sensible shop (the bottleneck fix first, then the best-value upgrades, one a day, keeping
              a cash reserve) and the "proper fix" answer on choice cards
    buyer     buys everything in list order with $400k spare, proper fixes, accepts half the deals
    gambler   accepts every deal, Low outages, picks the gamble on choice cards
  seeds: number of seasons per style (the same seeds for every style)
Prints one JSON line per season and a summary per style (mean / median / SD of profit, ledger means)."""
import json, pathlib, sys, statistics as st, time
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
src = (HERE / "bench.py").read_text()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
args = [a for a in sys.argv[1:] if not a.startswith("--")]
fl = {a.split("=")[0]: a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--") and "=" in a}
path, styles, N = args[0], args[1].split(","), int(args[2])
seed0 = int(fl.get("--seed0", 1000)); envf = fl.get("--env", "rural"); out = fl.get("--out"); leadf = fl.get("--lead", "cycle")
ENVS = ["rural", "urban", "desert", "swamp"]; LEADS = ["chip", "dot", "fel", "hank"]
html = pathlib.Path(path).read_text()
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
html = html.replace("window.__PM={", "window.__PM={get ECON(){return ECON},get CIV(){return CIV},get TELL(){return TELL},get PREP(){return PREP},get UPS(){return UPS},get BN(){return BN},upCost:(u,l)=>upCost(u,l),buy:id=>buy(id),upLocked:()=>upLocked(),get CIVU(){return CIVU},civCost:t=>civCost(t),civCommit:()=>civCommit(),get UP(){return UP},", 1) if "get UPS(){return UPS}" not in html else html

PLAY = r"""async ([style,seed])=>{const P=__PM,S=P.S,h=P.SIM_STEP||0.25,T=P.tell;let x=seed>>>0;const rnd=()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};
  const click=id=>{const b=document.getElementById(id);if(b&&!b.disabled){b.click();return true;}return false;};
  const vis=id=>{const e=document.getElementById(id);return !!e&&!e.hidden;};
  const lv=id=>(S.up&&S.up[id])||0,L={bought:[],rounds:0,caught:0,clean:0,prep:0,cards:0,acc:0,civ:0,civCost:0};
  const R=style==='rounds'||style==='active',ACT=style==='active';
  // the active shop: the bottleneck fix, then value for money, one upgrade a day, keeping a reserve
  const ACTLIST=['sales','contract','apc','refiner','reliab','clean','detrash','stores','safety','fire','deckle','shoe','drive','monitor','sales','contract','apc','deckle','rcfa'];
  const UPX=style.startsWith('up_')?style.slice(3):style.startsWith('fx_')?style.slice(3):null;
  const shop=()=>{if(P.upLocked&&P.upLocked())return;
    if(style.startsWith('fx_')){const f=(P.BN[S.bn]?P.BN[S.bn].ups:[])[0];if(f&&!lv(f)){const u=P.UPS.find(q=>q.id===f);P.buy(f);if(lv(f))L.bought.push(f);return;}if(UPX==='none')return;}
    if(UPX){const u=P.UPS.find(q=>q.id===UPX);if(u&&lv(UPX)<u.lv.length){const l0=lv(UPX);P.buy(UPX);if(lv(UPX)>l0)L.bought.push(UPX);}return;}const fix=(P.BN[S.bn]?P.BN[S.bn].ups:[]).slice(0,1).filter(id=>!lv(id));
    const order=ACT?fix.concat(ACTLIST):fix.concat(P.UPS.map(u=>u.id).filter(id=>!fix.includes(id)));
    for(const id of order){const u=P.UPS.find(q=>q.id===id);if(!u||lv(id)>=u.lv.length)continue;const c=P.upCost(u,lv(id));
      const keep=ACT?(fix.includes(id)?150e3:500e3):400e3;if(S.cash-c>=keep){const l0=lv(id);P.buy(id);if(lv(id)>l0)L.bought.push(id);return;}if(ACT)return;}};
  // a daily Round: the busiest area on the Vibration Report if there is one, else the next area in turn
  let rot=Math.floor(rnd()*6);
  const round=()=>{if(!T.can())return;const A=T.areas.map(a=>a.k);let a=A[rot++%A.length];
    if(T.rep()){let best=-1;for(const k of A){const v=T.trend(k);if(v>best){best=v;a=k;}}}
    if(!T.start(a))return;L.rounds++;const ids=(T.T.q||[]).filter(p=>p.area===a).map(p=>p.id);let n=0;for(const id of ids)if(T.catch(id))n++;L.caught+=n;const r=T.end(a,n);if(r&&r.clean)L.clean++;};
  const prep=()=>{const f=T.prepFor();if(!f)return;if(T.prepDo('parts','now'))L.prep++;if(T.prepDo('crew'))L.prep++;if(T.prepDo('contr','in'))L.prep++;if(T.prepDo('draw'))L.prep++;};
  const civPick=()=>{const d=S.civ.cur,id=d.id,bs=[...document.querySelectorAll('#civOv .civbtn')],u=P.CIVU[id];L.civ++;
    let i=0;if(id.startsWith('r_'))i=(style==='handsoff'||style.startsWith('up_')||style.startsWith('fx_'))?1:0;
    else if(u){const t=u.t||'';i=(style==='buyer'||ACT)?Math.max(0,t.indexOf('P')):Math.max(0,t.indexOf('Q'));
      if(style==='gambler'){const nb=u.ch.map((c,j)=>c[4]?j:-1).filter(j=>j>=0);if(nb.length)i=nb[Math.floor(rnd()*nb.length)];}
      const box=document.getElementById('civ-ord');if(box)box.checked=style==='handsoff'||style==='rounds'||style.startsWith('up_')||style.startsWith('fx_');}
    if(i>=bs.length)i=0;const c0=S.cash;bs[i].click();L.civCost+=c0-S.cash;};
  let n=0,lastDay=-1;
  while(S.season&&S.season.on&&n<31*1440/h){P.step(h);n++;
    if(S.civ&&S.civ.pending)P.civCommit();
    const civOpen=S.civ&&S.civ.cur&&vis('civOv');if(civOpen){try{civPick();}catch(e){L.err=String(e).slice(0,120);}}
    const o=S.cards&&S.cards.open;
    if(o&&!civOpen){if(o.c){L.cards++;const acc=style==='gambler'||(style==='buyer'&&rnd()<.5);if(acc){L.acc++;click('deal-yes');}else click('deal-no');
        const d=document.getElementById('dealOv');if(d){clearTimeout(d._t);d.hidden=true;d.classList.remove('dealres');}}
      else if(o.outage){const v=style==='gambler'?0:1;document.querySelectorAll('#outOv .orow').forEach(r=>{const b=r.querySelector('.seg button[data-v="'+v+'"]');if(b)b.click();});click('out-ok');}
      else if(o.report)click('rc-ok');
      if(S.cards.open&&!(S.cards.open.civ))S.cards.open=null;}
    {const r=document.getElementById('rc-ok');if(r&&r.offsetParent)r.click();}
    if(R&&n%8===0){round();prep();}
    const d=Math.floor(S.t/1440);if(d!==lastDay){lastDay=d;if(style!=='handsoff'&&style!=='rounds')shop();}
    P.setRunning(false);if(n%6000===0)await new Promise(r=>setTimeout(r,0));}
  const LG=S.ledger||{};const res=S.season&&S.season.result||{};
  return Object.assign(L,{day:+(S.t/1440).toFixed(2),score:res.score,cash:Math.round(S.cash),bn:S.bn,lead:S.lead&&S.lead.id,tons:res.tons,incidents:res.incidents,
    tells:T.T?{n:T.T.n,saved:Math.round(T.T.saved||0)}:null,meters:S.civ?Object.fromEntries(Object.entries(S.civ.m).map(([k,v])=>[k,Math.round(v)])):null,
    ledger:Object.fromEntries(Object.entries(LG).map(([k,v])=>[k,Math.round(v)]))});}"""

def season(pg, style, seed, lead):
    pg.evaluate("()=>{['seasonOv','dealOv','outOv','civOv'].forEach(i=>{const e=document.getElementById(i);if(e)e.hidden=true;});if(!window.__started){window.__started=1;document.getElementById('v2go').click();}else if(__PM.G3.goSeason)__PM.G3.goSeason();else document.getElementById('v2season').click();}")
    pg.wait_for_function("()=>{const o=document.getElementById('leadOv');return o&&!o.hidden}", timeout=60000)
    pg.evaluate("w=>{document.querySelector('#leadOv .ldcard[data-l=\"'+w+'\"]').click();document.getElementById('ld-go').click()}", lead)
    pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=60000, polling=50)
    pg.evaluate("s=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;__PM.reseed(s);const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;if(G)G.on=false;}", seed)
    return pg.evaluate(PLAY, [style, seed])

res = []
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    envs = ENVS if envf == "cycle" else envf.split(",")
    for env in envs:
        pg = b.new_page(viewport={"width": 900, "height": 640}); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto(f"http://bench.local/?env={env}&tilt=0")
        pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000)
        for k in range(N):
            seed = seed0 + k * 7919; lead = LEADS[k % 4] if leadf == "cycle" else leadf
            for style in styles:
                t0 = time.time()
                try: r = season(pg, style, seed, lead)
                except Exception as e: r = {"err": str(e)[:200]}
                r.update({"style": style, "seed": seed, "env": env, "lead": lead, "wall": round(time.time() - t0, 1), "perrs": errs[-2:]})
                res.append(r); print(json.dumps(r), flush=True)
                if out:
                    with open(out, "a") as f: f.write(json.dumps(r) + "\n")
        pg.close()
    b.close()
for style in styles:
    R = [r for r in res if r.get("style") == style and r.get("score") is not None]
    if not R: continue
    s = [r["score"] for r in R]
    led = {k: round(st.fmean(r["ledger"].get(k, 0) for r in R)) for k in R[0]["ledger"]}
    print("SUMMARY", style, json.dumps({"n": len(R), "mean": round(st.fmean(s)), "median": round(st.median(s)), "sd": round(st.stdev(s)) if len(s) > 1 else 0,
        "min": min(s), "max": max(s), "rounds": round(st.fmean(r["rounds"] for r in R), 1), "caught": round(st.fmean(r["caught"] for r in R), 1),
        "civCost": round(st.fmean(r["civCost"] for r in R)), "bought": round(st.fmean(len(r["bought"]) for r in R), 1), "ledger": led}))
