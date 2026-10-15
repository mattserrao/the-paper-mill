"""v5.1 civics balance runs: seasons and survival runs played by one bot style, sim only, fixed seeds.
Usage: python3 civbal.py <index.html> --style=careful --leader=chip --env=rural --seasons=2 --surv=2 [--seed0=1000] [--maxdays=45] [--out=x.json] [--set=CIV.unit=3,...]

Styles (how the bot answers civics choices, event cards, the outage dialog and the shop):
  careful     Fix properly on every upset; accepts rewards; top outage budget when cash > $1.5M; bonus + donation when cash > $1M; buys upgrades
  cheap       Cheap fix on every upset; standard budget; no levers; buys upgrades
  shortcut    Shortcut on every upset; cheapest budget; +$10/t price setting; buys upgrades
  handsoff    first choice it sees for each area becomes a standing order (Cheap fix); declines cards; standard budget; no upgrades
  civic       the choice with the best civics total (ties: cheaper); bonus + donation every outage; −$10/t price; accepts rewards; buys upgrades
  cash        the cheapest choice (earning ones first); +$10/t price; accepts cards with odds >= 70%; buys upgrades
  random      random choices, cards, levers and budgets (seeded); buys upgrades
  economy     best Economy, then cost; −$10/t price; accepts cards with an Economy win; buys upgrades
  crew        best Labor + Machinery, then cost; bonus every outage; top budget; buys upgrades
  gambler     accepts every card and reward; picks choices with a note (gambles, special effects) else random; cheapest budget
Leader: chip, dot, fel, hank or none. Each run records cash, profit, days survived, tons, the four meters (mean, min, max,
time in each band), warnings, crises, rewards, decisions per day, civics spend, and errors."""
import json, pathlib, sys, statistics as st
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
src = (HERE / "bench.py").read_text()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
args = [a for a in sys.argv[1:] if not a.startswith("--")]
fl = {a.split("=")[0]: a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--") and "=" in a}
path = args[0]; style = fl.get("--style", "cheap"); leader = fl.get("--leader", "chip"); leader = None if leader == "none" else leader
env = fl.get("--env", "rural"); NS = int(fl.get("--seasons", 2)); NV = int(fl.get("--surv", 2)); seed0 = int(fl.get("--seed0", 1000)); maxdays = float(fl.get("--maxdays", 45))
sets = dict(x.split("=") for x in fl["--set"].split(",")) if "--set" in fl else {}
html = pathlib.Path(path).read_text()
html = html.replace("window.__PM={", "window.__PM={get ECON(){return ECON},get SURV(){return SURV},get UPS(){return UPS},get BN(){return BN},get CIV(){return CIV},get CIVU(){return CIVU},get CIVCARD(){return CIVCARD},"
                    "buy:id=>buy(id),startSurv:id=>startSurvival(id),startSea:id=>{startSeason();if(id)leadStart(id);},civCommit:()=>civCommit(),civBand:v=>civBand(v),", 1)
ORDER = ["feedconv", "detrash", "safety", "stores", "clean", "fire", "apc", "refiner", "contract", "sales", "drive", "deckle", "shoe",
         "monitor", "rcfa", "reliab", "maintcrew", "pmprog", "winder", "chest", "pulper", "forklift", "docks", "insure", "wh", "agv"]

RUN = r"""([mode,k,seed0,style,leader,maxdays,ORDER,sets])=>{const P=__PM,S0=P.S;
  for(const key in sets){const [o,f]=key.split('.');P[o][f]=+sets[key];}
  if(mode==='surv')P.startSurv(leader);else P.startSea(leader);P.setRunning(false);P.reseed(seed0+k*7919);if(window.__NOCIV)P.S.civ=null;
  const S=P.S,h=P.SIM_STEP||0.25,G=P.G3,K=['E','L','M','C'];let n=0,lastDay=-1,bought=0,rs=(seed0+k*7919+style.length*131)>>>0;
  const rnd=()=>{rs=(rs+0x6D2B79F5)|0;let t=Math.imul(rs^(rs>>>15),rs|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  const click=id=>{const b=document.getElementById(id);if(b){b.click();return true;}return false;};
  const lv=id=>(S.up&&S.up[id])||0,UP=Object.fromEntries(P.UPS.map(u=>[u.id,u]));
  const price=u=>{const c=u.lv[lv(u.id)];return P.BN[S.bn]&&P.BN[S.bn].ups.includes(u.id)?Math.round(c*0.75/1000)*1000:c;};
  const shop=()=>{const fix=(P.BN[S.bn]?P.BN[S.bn].ups:[]).filter(id=>!lv(id)),list=fix.length?fix.slice(0,1):ORDER;
    for(const id of list){const u=UP[id];if(!u||lv(id)>=u.lv.length)continue;if(S.cash-price(u)>=250e3){const l0=lv(id);P.buy(id);if(lv(id)>l0)bought++;return;}}};
  const sum=d=>K.reduce((a,x)=>a+((d&&d[x])||0),0),costOf=c=>P.CIV.cost[String(c[1])]||0;
  const T={dec:0,auto:0,kinds:{},tags:{P:0,Q:0,S:0},ids:{},warn:0,crisis:0,reward:0,cards:0,acc:0,outs:0,civSpend:0,bands:{},mins:{},maxs:{},sums:{},samples:0,bankDay:null,errs:[]};
  K.forEach(x=>{T.bands[x]={Crisis:0,Strained:0,Steady:0,Strong:0,Excellent:0};T.mins[x]=100;T.maxs[x]=0;T.sums[x]=0;});
  const pickCiv=()=>{const d=S.civ.cur,bs=[...document.querySelectorAll('#civOv .civbtn')];if(!bs.length)return;const id=d.id,u=P.CIVU[id];
    T.kinds[d.kind]=(T.kinds[d.kind]||0)+1;T.ids[id]=(T.ids[id]||0)+1;if(id.startsWith('w_'))T.warn++;else if(id.startsWith('c_'))T.crisis++;else if(id.startsWith('r_'))T.reward++;
    let i=0;
    if(id.startsWith('r_')){i=(style==='shortcut'||style==='handsoff'||(style==='cash'&&id==='r_C'))?1:0;}
    else{const ch=u.ch,tags=u.t||'',byTag=t=>{const j=tags.indexOf(t);return j>=0?j:0;},best=f=>ch.map((c,j)=>[f(c),-costOf(c),j]).sort((a,b)=>b[0]-a[0]||b[1]-a[1])[0][2];
      if(style==='careful')i=tags?byTag('P'):best(c=>sum(c[3]));
      else if(style==='cheap'||style==='handsoff')i=tags?byTag('Q'):best(c=>-costOf(c));
      else if(style==='shortcut')i=tags?byTag('S'):best(c=>-costOf(c));
      else if(style==='civic')i=best(c=>sum(c[3]));
      else if(style==='cash')i=best(c=>-costOf(c));
      else if(style==='economy')i=best(c=>(c[3]&&c[3].E)||0);
      else if(style==='crew')i=best(c=>((c[3]&&c[3].L)||0)+((c[3]&&c[3].M)||0));
      else if(style==='gambler'){const nb=ch.map((c,j)=>c[4]?j:-1).filter(j=>j>=0);i=nb.length?nb[Math.floor(rnd()*nb.length)]:Math.floor(rnd()*ch.length);}
      else i=Math.floor(rnd()*ch.length);
      if(i>=bs.length)i=0;const tg=tags[i];if(tg)T.tags[tg]++;
      const box=document.getElementById('civ-ord');if(box){box.checked=style==='handsoff';}}
    const c0=S.cash;bs[i].click();T.dec++;T.civSpend+=Math.max(0,c0-S.cash);};
  const cardPick=o=>{const c=o.c,x=P.CIVCARD[c.id]||{};let yes=false;
    if(style==='gambler')yes=true;else if(style==='handsoff'||style==='shortcut')yes=false;else if(style==='random')yes=rnd()<0.5;
    else if(style==='cash')yes=o.o>=70;else if(style==='economy')yes=!!(x.w&&x.w.E>0)||!!(x.a&&x.a.E>0);
    else if(style==='civic')yes=sum(x.a)+sum(x.w)*o.o/100+sum(x.l)*(1-o.o/100)>sum(x.d);else yes=o.o>=65;
    T.cards++;if(yes){T.acc++;click('deal-yes');}else click('deal-no');};
  const outPick=()=>{T.outs++;const top=(style==='careful'||style==='crew')&&S.cash>1.5e6,low=style==='shortcut'||style==='gambler'||S.cash<0;
    document.querySelectorAll('#outOv .orow .seg').forEach(sg=>{const b=sg.querySelectorAll('button');const v=style==='random'?Math.floor(rnd()*3):top?2:low?0:1;if(b[v])b[v].click();});
    const lev=(name,v)=>{const b=document.querySelector('#outOv .civplan .seg[data-c="'+name+'"] button[data-v="'+v+'"]');if(b)b.click();};
    if(style==='careful'&&S.cash>1e6){lev('bonus',20000);lev('don',20000);}
    if(style==='civic'){lev('bonus',20000);lev('don',20000);lev('price',-5);}
    if(style==='crew')lev('bonus',20000);
    if(style==='shortcut'||style==='cash')lev('price',5);if(style==='economy')lev('price',-5);
    if(style==='random'){lev('price',[-5,0,5][Math.floor(rnd()*3)]);lev('bonus',rnd()<0.5?20000:0);lev('don',rnd()<0.5?20000:0);}
    const b=document.querySelector('#out-lpick button');if(b&&rnd()<0.5){const bs=[...document.querySelectorAll('#out-lpick button')];bs[Math.floor(rnd()*bs.length)].click();}
    click('out-ok');};
  const W=[];let wk=S.outg.k,wc=S.cash;
  while(S.season&&S.season.on&&n<maxdays*1440/h){if(G)G.on=false;try{P.step(h);}catch(e){T.errs.push(String(e).slice(0,160));break;}n++;
    if(S.civ&&S.civ.pending){T.auto++;P.civCommit();}
    const cel=document.getElementById('civOv'),civOpen=S.civ&&S.civ.cur&&!!cel&&!cel.hidden;
    if(civOpen){try{pickCiv();}catch(e){T.errs.push('civ '+String(e).slice(0,160));S.civ.cur=null;S.cards.open=null;}}
    const o=S.cards&&S.cards.open;
    if(o&&!civOpen){if(o.c)cardPick(o);else if(o.outage)outPick();else if(o.report)click('rc-ok');}
    {const r=document.getElementById('rc-ok');if(r&&r.offsetParent)r.click();}
    if(n%240===0&&S.civ){T.samples++;for(const x of K){const v=S.civ.m[x];T.sums[x]+=v;T.mins[x]=Math.min(T.mins[x],v);T.maxs[x]=Math.max(T.maxs[x],v);T.bands[x][P.civBand(v)[1]]++;}}
    if(S.cash<0&&T.bankDay===null)T.bankDay=+(S.t/1440).toFixed(1);
    if(S.outg.k!==wk){W.push(Math.round((S.cash-wc)/1e3));wk=S.outg.k;wc=S.cash;}
    const d=Math.floor(S.t/1440);if(style!=='handsoff'&&d!==lastDay){lastDay=d;shop();}
    P.setRunning(false);}
  ['seasonOv','dealOv','outOv','civOv'].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true;});
  const L=S.ledger,days=S.t/1440,r=S.season&&S.season.result;
  const pct=x=>Object.fromEntries(Object.entries(T.bands[x]).map(([b,v])=>[b,Math.round(v*100/Math.max(1,T.samples))]));
  return {mode,style,leader,seed:seed0+k*7919,bn:S.bn,env:location.search,days:+days.toFixed(2),done:!!(S.season&&S.season.done),bankrupt:mode==='surv'?!!(r):S.cash<-1.5e6,
    cash:Math.round(S.cash),profit:Math.round(S.cash-2e6),wave:S.outg.k,bought,tons:Math.round(S.shipT||0),incidents:S.tot.incidents,
    rev:Math.round(L.rev),repairs:Math.round(L.repairs),deals:Math.round(L.deals),labor:Math.round(L.labor),
    civ:{mean:Object.fromEntries(K.map(x=>[x,Math.round(T.sums[x]/Math.max(1,T.samples))])),min:Object.fromEntries(K.map(x=>[x,Math.round(T.mins[x])])),max:Object.fromEntries(K.map(x=>[x,Math.round(T.maxs[x])])),
      end:Object.fromEntries(K.map(x=>[x,Math.round(S.civ?S.civ.m[x]:50)])),bands:Object.fromEntries(K.map(x=>[x,pct(x)]))},
    decisions:T.dec,auto:T.auto,perDay:+((T.dec+T.auto)/Math.max(1,days)).toFixed(2),kinds:T.kinds,tags:T.tags,warn:T.warn,crisis:T.crisis,reward:T.reward,
    cards:T.cards,accepted:T.acc,outages:T.outs,civSpend:Math.round(T.civSpend),firstRed:T.bankDay,wave_net_k:W,top_ids:Object.entries(T.ids).sort((a,b)=>b[1]-a[1]).slice(0,8),errs:T.errs};}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 480, "height": 320}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?env=" + env)
    pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=600000)
    pg.wait_for_function("__PM.G3.warm||!__PM.G3.prewarm", timeout=600000, polling=500)
    pg.evaluate("()=>{const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;document.getElementById('v2menu').hidden=true;}")
    if fl.get("--nociv"): pg.evaluate("()=>{window.__NOCIV=1;}")
    res = []
    for mode, n in (("season", NS), ("surv", NV)):
        for k in range(n):
            r = pg.evaluate(RUN, [mode, k, seed0, style, leader, maxdays if mode == "surv" else 31, ORDER, sets])
            res.append(r); print(json.dumps(r), flush=True)
    b.close()
def mean(xs): return round(st.fmean(xs), 1) if xs else None
sea = [r for r in res if r["mode"] == "season"]; sv = [r for r in res if r["mode"] == "surv"]
summ = {"nociv": bool(fl.get("--nociv")), "style": style, "leader": leader, "env": env, "set": sets,
        "season": {"runs": len(sea), "profit_mean_k": mean([r["profit"] / 1e3 for r in sea]), "profit_k": [round(r["profit"] / 1e3) for r in sea]},
        "survival": {"runs": len(sv), "days_mean": mean([r["days"] for r in sv]), "days": [r["days"] for r in sv], "capped": sum(1 for r in sv if not r["bankrupt"])},
        "civ_mean": {x: mean([r["civ"]["mean"][x] for r in res]) for x in "ELMC"}, "decisions_per_day": mean([r["perDay"] for r in res]),
        "warn": sum(r["warn"] for r in res), "crisis": sum(r["crisis"] for r in res), "reward": sum(r["reward"] for r in res), "errors": errs[:5] + [e for r in res for e in r["errs"]][:5]}
print("SUMMARY", json.dumps(summ), flush=True)
if "--out" in fl: pathlib.Path(fl["--out"]).write_text(json.dumps({"runs": res, "summary": summ}, indent=1))
