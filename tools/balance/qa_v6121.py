"""QA v6.12.1 (copy of qa_v6112, adds the approach system: refiner-clash trips that starve the fan pump, time down on them, and the machine chest level through them) QA v6.11.2 (copy of qa_v6111 for t5: starch gone, so the chemical play is the polymer ratio; the known defects view, beater bay info and DE pulper are read; metered power is logged) QA v6.11.1 (copy of qa_v610 with the wet-end chemicals and the dryer hood knob in play): QA v6.10: full SEASON or SURVIVAL playthroughs through the real menu, leader picker and summary screen, each
submitted to the LIVE leaderboard (QA Test N). Based on the v5.0.2 qa_survival.py / qa_seasons.py, updated for v6.10:
leaders in seasons, civics cards, the drive fault card (reset / investigate / run to outage / replace), and an
"active" style that walks the daily Round (catching every tell in the busiest area) and plans the repairs the shift
rounds find (the active play the economy is meant to reward).
Usage: python3 qa_v610.py <season|surv> <index.html> <first_k> <last_k> <out.jsonl> [--stride=N] [--nopost]
Styles cycle handsoff / buyer / gambler / random / active; sites rural / urban / desert / swamp; leaders chip / dot / fel / hank."""
import json, os, pathlib, ssl, sys, time, fcntl, urllib.request, urllib.error, urllib.parse
from playwright.sync_api import sync_playwright
import sys as _sys, pathlib as _pl; _sys.path.insert(0, str(_pl.Path(__file__).resolve().parents[1]))
from lib import *   # route_for, INIT, HOOK, pick_leader, HERE (= tools/)

args = [a for a in sys.argv[1:] if not a.startswith("--")]
mode, path, k0, k1, out = args[0], args[1], int(args[2]), int(args[3]), args[4]
SURV = mode == "surv"
stride = int(next((a.split("=")[1] for a in sys.argv if a.startswith("--stride=")), "1"))
NOPOST = "--nopost" in sys.argv
GATE = pathlib.Path(os.environ.get("QA_GATE", "/tmp/claude-0/qa/gate"))
CTX = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt")
ENVS = ["rural", "urban", "desert", "swamp"]; STYLES = os.environ.get("QA_STYLES","handsoff,buyer,gambler,random,active").split(","); LEADERS = ["chip", "dot", "fel", "hank"]

base = pathlib.Path(path).read_text()
base = base.replace("window.__PM={", "window.__PM={get ECON(){return ECON},get UPS(){return UPS},get BN(){return BN},buy:id=>buy(id),lineCaps:()=>lineCaps(),leadFix:id=>leadFix(id),leadFixable:id=>leadFixable(id),leadFixReady:()=>leadFixReady(),get SURV(){return SURV},survUp:w=>survUp(w),survCost:w=>survCost(w),upCost:(u,l)=>upCost(u,l),upLocked:()=>upLocked(),",1)
base = base.replace("seedRun(Math.floor(Date.now()/6048e5)", "seedRun(Math.floor((Date.now()+(window.__WK||0)*6048e5)/6048e5)", 1)
assert "window.__WK" in base

def gate():
    GATE.touch(exist_ok=True)
    while True:
        with open(GATE, "r+") as f:
            fcntl.flock(f, fcntl.LOCK_EX); t = float(f.read() or 0); now = time.time()
            if now - t >= 21: f.seek(0); f.truncate(); f.write(str(now)); return
        time.sleep(1)

def make_route(html, netlog):
    def route(r):
        u = r.request.url
        if "supabase.co" in u:
            if NOPOST and r.request.method == "POST": return r.fulfill(status=201, body="[]", headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"})
            req = urllib.request.Request(u, data=r.request.post_data_buffer, method=r.request.method,
                headers={k: v for k, v in r.request.headers.items() if k.lower() in ("apikey", "authorization", "content-type", "prefer", "accept")})
            t0 = time.time()
            try:
                with urllib.request.urlopen(req, context=CTX, timeout=30) as resp: st, body, hd = resp.status, resp.read(), dict(resp.headers)
            except urllib.error.HTTPError as e: st, body, hd = e.code, e.read(), dict(e.headers)
            except Exception as e: st, body, hd = 599, json.dumps({"message": "net " + str(e)}).encode(), {}
            netlog.append({"m": r.request.method, "url": u.split("/rest/v1/")[-1][:160], "status": st, "body": body[:300].decode("utf8", "replace"), "ms": int((time.time() - t0) * 1000)})
            cr = next((v for k, v in hd.items() if k.lower() == "content-range"), None)   # (lbRank reads the count from Content-Range)
            h = {"Content-Type": hd.get("Content-Type", "application/json"), "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": "Content-Range"}
            if cr: h["Content-Range"] = cr
            return r.fulfill(status=st, body=body, headers=h)
        return route_for(html)(r)
    return route

PLAY = r"""async ([style,seed,swap,surv])=>{const P=__PM,S=P.S,h=P.SIM_STEP||0.25;let x=seed>>>0;const rnd=()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};
  const click=id=>{const b=document.getElementById(id);if(b&&!b.disabled){b.click();return true;}return false;};
  const TXT=new Set();const grab=()=>{for(const l of (S.feed||[]).slice(0,12))TXT.add('feed|'+l.text);for(const id of ['dealOv','civOv','outOv','seasonOv','rlyOv']){const e=document.getElementById(id);if(e&&!e.hidden)TXT.add(id+'|'+e.textContent.replace(/\s+/g,' ').slice(0,600));}};
  const lv=id=>(S.up&&S.up[id])||0,log={leader0:S.lead&&S.lead.id,cards:0,acc:0,civ:0,outs:0,rcs:0,bought:[],failedBuys:0,nan:false,stuckClosed:0,minCash:S.cash,ovs:{},waves:[],picks:[],fixes:0,swapped:null,
    rounds:0,tellsCaught:0,refTrips:0,refDownMin:0,refClashes:0,mcMin:100,chem:[],hood:0,rlyFix:0,drvCalls:{},trims:[],prem:[],chg:0,errs:[]};
  let n=0,lastDay=-1,t0=performance.now(),wk=S.outg?S.outg.k:1,c0=S.cash,i0=S.tot.incidents,L0=JSON.parse(JSON.stringify(S.ledger||{}));
  // v6.12.1 'smart': fix the bottleneck, then whatever area is limiting the line now (lineCaps), then the upgrades that
  // measured >1.5x their price back inside a season; never spare capacity; keeps a $400k cushion. Walks the Round too.
  const GOOD=['detrash','stores','fire','maintcrew','reliab','monitor','insure','contract','sales','refiner','shoe','steambox','drive','clean','apc'];
  const AREA={recv:['docks','forklift'],pulper:['pulper'],screens:['clean'],winder:['winder'],ship:['agv','docks'],pm:['shoe','steambox','drive','apc']};
  const smartShop=()=>{if(P.upLocked&&P.upLocked())return;const can=id=>{const u=P.UPS.find(q=>q.id===id);return u&&lv(id)<u.lv.length&&S.cash-P.upCost(u,lv(id))>=400e3;};
    const fix=(P.BN[S.bn]?P.BN[S.bn].ups:[]).filter(id=>!lv(id)||lv(id)<P.UPS.find(q=>q.id===id).lv.length);let want=[];
    try{const c=P.lineCaps(),pm=c.find(x=>x[0]==='pm'),low=c.filter(x=>x[0]!=='pm').sort((a,b)=>a[2]-b[2])[0];if(low&&pm&&low[2]<pm[2]*0.98)want=(AREA[low[0]]||[]);else want=AREA.pm;}catch(e){}
    for(const id of [...fix,...want,...GOOD]){if(can(id)){const l0=lv(id),cc=S.cash,c=P.upCost(P.UPS.find(q=>q.id===id),l0);P.buy(id);if(lv(id)>l0){log.bought.push(id);if(Math.abs((cc-S.cash)-c)>1)log.costMismatch=(log.costMismatch||[]).concat([[id,c,cc-S.cash]]);}else log.failedBuys++;return;}}};
  const shop=()=>{if(style==='smart')return smartShop();if(P.upLocked&&P.upLocked())return;const fix=(P.BN[S.bn]?P.BN[S.bn].ups:[]).filter(id=>!lv(id));
    const order=fix.concat(P.UPS.map(u=>u.id).filter(id=>!fix.includes(id)));const pick=style==='random'?order.sort(()=>rnd()-.5):order;
    for(const id of pick){const u=P.UPS.find(q=>q.id===id);if(!u||lv(id)>=u.lv.length)continue;const c=P.upCost(u,lv(id));
      if(S.cash-c>=(style==='random'?0:surv?400e3:300e3)){const l0=lv(id),cc=S.cash;P.buy(id);if(lv(id)>l0){log.bought.push(id);if(Math.abs((cc-S.cash)-c)>1)log.costMismatch=(log.costMismatch||[]).concat([[id,c,cc-S.cash]]);}else log.failedBuys++;return;}}};
  const leadPlan=()=>{if(!S.lead)return;const q=s=>document.querySelector('#out-lead '+s);
    if(swap&&+swap[1]===S.outg.k&&!S.lead.changed){const c=q('#out-lchg');if(c){c.click();const b=q('.ldswap button[data-to="'+swap[0]+'"]');if(b){b.click();log.swapped=swap.join('@');}else log.ovs.noSwapBtn=1;}}
    const btns=[...document.querySelectorAll('#out-lpick button[data-p]')];if(btns.length){const b=style==='random'?btns[Math.floor(rnd()*btns.length)]:btns[0];b.click();log.picks.push(S.outg.k+':'+b.dataset.p);}};
  // the active player's day: a Round in the area with the most pending tells, every tell caught; planned repairs for what the shift rounds found
  const activeDay=()=>{const T=P.tell;if(T&&T.can&&T.can()){const A=T.areas.map(a=>[a.k,(S.tell&&S.tell.q||[]).filter(p=>p.area===a.k).length]).sort((a,b)=>b[1]-a[1])[0];
      if(A&&T.start(A[0])){log.rounds++;let c=0;for(const p of (S.tell.q||[]).filter(p=>p.area===A[0])){if(T.catch(p.id)){c++;log.tellsCaught++;}}T.end(A[0],c);}}
    if(S.rel)for(const A of P.rly.ASSETS){const a=S.rel.a[A.id];for(const k of ['vib','adx']){const v=k==='vib'?a.lv:a.la;if(v&&v.st==='imm'&&S.t-v.t<4320&&P.rly.fix(A.id,k))log.rlyFix++;}}};
  // v6.11.1: the wet-end chemicals and the hood doors. active: 8 kg/t starch on MANUAL (a real lever); gambler: 12 kg/t
  // (over the deposit line); random: a random pump move or back to AUTO some days, and the hood doors up or down
  const chemDay=()=>{const C=P.chem;if(!C)return;
    if(style==='active'&&!log.chem.includes('r12')){C.ratio('pol',1.2*C.CHM.pol.std);log.chem.push('r12');}
    if(style==='gambler'&&!log.chem.includes('r05')){C.ratio('pol',0.5*C.CHM.pol.std);log.chem.push('r05');}
    if(style==='random'){const r=rnd();if(r<0.15){C.flow('pol',rnd()*0.8*Math.max(10,S.rates.prod||30));log.chem.push('pol?');}else if(r<0.3){C.mode('pol','auto');log.chem.push('auto');}
      if(rnd()<0.2){P.knob.set('hood',S.knob&&S.knob.v.hood?0:1);log.hood++;}
      if(rnd()<0.3&&P.G3.setDefectView){try{const nn=P.G3.setDefectView(true);log.dv=(log.dv||0)+1;log.dvPins=Math.max(log.dvPins||0,nn||0);P.G3.setDefectView(false);}catch(e){log.errs.push('dv '+e.message);}}}
    if(S.dep){log.depMax=Math.max(log.depMax||0,S.dep.m/S.dep.cap*100);log.depMin=Math.min(log.depMin??999,S.dep.m/S.dep.cap*100);if(!isFinite(S.dep.m)||!isFinite(S.dep.f))log.nan=true;}
    if(S.q&&S.q.bank>(log.bankMax||0))log.bankMax=Math.round(S.q.bank);};
  const chemMode0=id=>S.chem?S.chem[id].m:'auto';
  const drvCall=q=>{const a=S.rel.a[q.a],ch=q.step==='fault'?(style==='gambler'?'reset':style==='random'?(rnd()<.5?'reset':'inv'):style==='handsoff'?null:(a.dh<60?'inv':'reset')):(style==='random'?(rnd()<.5?'patch':'repl'):style==='gambler'?'patch':'repl');
    if(!ch)return false;P.rly.decide(q.a,ch);log.drvCalls[ch]=(log.drvCalls[ch]||0)+1;return true;};
  while(S.season&&S.season.on&&n<(surv?400:40)*1440/h){P.step(h);n++;if(!(S.season&&S.season.on))break;if(!isFinite(S.cash)||!isFinite(S.t))log.nan=true;{const tr=!!S.mcTrip;if(tr&&!log._tr)log.refTrips++;log._tr=tr;if(tr)log.refDownMin+=h;if(S.M&&S.M.refOut&&!log._ro)log.refClashes++;log._ro=!!(S.M&&S.M.refOut);const ml=P.knob&&P.knob.read?P.knob.read().mcLvl:null;if(ml!=null&&n%40===0&&ml<log.mcMin)log.mcMin=Math.round(ml);}if(S.cash<log.minCash)log.minCash=S.cash;
    // the drive fault card (it only opens on a UI tick, which doesn't run while the bot steps: answer from the queue the way the card would)
    if(S.rel&&S.rel.q&&S.rel.q.length){const q=S.rel.q[0];if(drvCall(q))S.rel.q.shift();}
    if(n%8===0)grab();const o=S.cards&&S.cards.open;if(o)grab();
    if(o){if(o.c){log.cards++;const acc=style==='gambler'||((style==='buyer'||style==='active'||style==='smart')&&rnd()<.5)||(style==='random'&&rnd()<.5);if(acc){log.acc++;if(!click('deal-yes'))log.ovs.noYes=(log.ovs.noYes||0)+1;}else if(!click('deal-no'))log.ovs.noNo=(log.ovs.noNo||0)+1;
        const d=document.getElementById('dealOv');if(d){clearTimeout(d._t);d.hidden=true;d.classList.remove('dealres');}}
      else if(o.civ){log.civ++;const bs=[...document.querySelectorAll('#civOv .civbtn')];const b=style==='handsoff'?bs[bs.length-1]:style==='random'?bs[Math.floor(rnd()*bs.length)]:style==='gambler'?bs[bs.length-1]:bs[0];if(b)b.click();else log.ovs.noCiv=(log.ovs.noCiv||0)+1;}
      else if(o.outage){log.outs++;const v=style==='gambler'?0:(style==='buyer'||style==='active'||style==='smart')&&S.cash>1.5e6?2:style==='random'?null:1;
        document.querySelectorAll('#outOv .orow').forEach(r=>{const vv=v===null?Math.floor(rnd()*3):v;const b=r.querySelector('.seg button[data-v="'+vv+'"]');if(b)b.click();});
        if(style==='active'||style==='smart'){const bs=[...document.querySelectorAll('#out-rly [data-rpc$=":b"]')].slice(0,2);bs.forEach(b=>{b.click();log.chg++;});}
        leadPlan();if(!click('out-ok'))log.ovs.noOutOk=(log.ovs.noOutOk||0)+1;}
      else if(o.report){log.rcs++;if(!click('rc-ok'))log.ovs.noRcOk=(log.ovs.noRcOk||0)+1;}
      if(S.cards.open&&!S.cards.open.rly&&!(S.cards.open.civ&&S.civ&&S.civ.cur)&&S.cards.open!==o){}else if(S.cards.open&&S.cards.open===o&&!S.cards.open.rly){log.stuckClosed++;log.stuckWhat=Object.keys(S.cards.open).join();S.cards.open=null;}}
    if(surv&&S.lead&&S.lead.id==='dot'&&n%8===0&&S.inc&&S.inc.length&&P.leadFixReady()){const c=S.inc.filter(i=>P.leadFixable(i.id)&&i.left>30&&(i.bill||0)>=120e3)[0];if(c&&P.leadFix(c.id))log.fixes++;}
    if(surv&&S.outg.k!==wk){P.setRunning(false);await new Promise(r=>setTimeout(r,0));const Ld=S.ledger,dl=k=>Math.round(((Ld[k]||0)-(L0[k]||0))/1e3);
      log.waves.push({w:wk,net_k:Math.round((S.cash-c0)/1e3),inc:S.tot.incidents-i0,rev_k:dl('rev'),occ_k:dl('occ'),energy_k:dl('energy'),labor_k:dl('labor'),repairs_k:dl('repairs'),upMul:+P.survUp(S.outg.k).toFixed(3),costMul:+P.survCost(S.outg.k).toFixed(3)});
      wk=S.outg.k;c0=S.cash;i0=S.tot.incidents;L0=JSON.parse(JSON.stringify(Ld));}
    const d=Math.floor(S.t/1440);if(d!==lastDay){lastDay=d;if(S.we){log.trims.push(+S.we.trim.toFixed(4));}if(style!=='handsoff'&&style!=='rounds')shop();if(style==='active'||style==='rounds'||style==='smart')activeDay();chemDay();}
    P.setRunning(false);if(n%4000===0)await new Promise(r=>setTimeout(r,0));}
  log.steps=n;log.simSec=+((performance.now()-t0)/1000).toFixed(1);log.day=+(S.t/1440).toFixed(2);log.done=!!(S.season&&S.season.done);log.result=S.season&&S.season.result;
  log.cash=Math.round(S.cash);log.start=P.ECON.start;log.bn=S.bn;log.leaderEnd=S.lead&&S.lead.id;
  log.ledger=Object.fromEntries(Object.entries(S.ledger||{}).map(([k,v])=>[k,Math.round(v)]));log.evc=S.evc;log.tot={prod:Math.round(S.tot.prodT),breaks:S.tot.breaks,hay:S.tot.hayouts,inc:S.tot.incidents,beater:Math.round(S.tot.broke||0)};
  if(S.rel)log.rel={done:S.rel.done,skip:S.rel.skip,caught:S.rel.caught,saved:Math.round(S.rel.saved),fails:S.rel.fails,hist:S.rel.hist.slice(-4)};
  if(S.tell)log.tell={n:S.tell.n,saved:Math.round(S.tell.saved||0)};if(S.chem)log.chemEnd={pol:[S.chem.pol.m,+S.chem.pol.e.toFixed(3)]};log.whTotal=P.G3.whTotal;log.whLv=lv('wh');log.robots=P.P?P.P.robots:undefined;log.trace=S.feed.filter(f=>/traced|investigated/.test(f.text)&&/pump|hood/.test(f.text)).length;if(S.civ)log.civm=S.civ.m;
  const so=document.getElementById('seasonOv');log.summaryShown=!!so&&!so.hidden;log.soH=(document.getElementById('so-h')||{}).textContent;log.soP=(document.getElementById('so-p')||{}).textContent;
  log.stats=[...document.querySelectorAll('#so-stats > div')].map(d=>d.textContent);
  grab();log.texts=[...TXT];log.otherOverlays=[...document.querySelectorAll('.overlay')].filter(e=>!e.hidden&&e.id!=='seasonOv').map(e=>e.id);return log;}"""

def check(r):
    iss = []; res = r.get("result") or {}
    if not r["done"]: iss.append(("run still alive after %s days" % r["day"]) if SURV else "season did not end")
    if not r["summaryShown"]: iss.append("summary / game-over screen not shown")
    if r["nan"]: iss.append("NaN cash/time")
    if r["otherOverlays"]: iss.append("overlays left open at the end: " + ",".join(r["otherOverlays"]))
    if r["stuckClosed"]: iss.append(f"{r['stuckClosed']} card(s) did not close via their button ({r.get('stuckWhat')})")
    if r["ovs"]: iss.append("UI controls missing: " + json.dumps(r["ovs"]))
    if r.get("costMismatch"): iss.append("charged != shown upgrade price: " + str(r["costMismatch"][:3]))
    if res and SURV:
        m, w = res.get("minutes", -1), res.get("wave", 0)
        if not (0 <= m <= 5256000): iss.append(f"minutes out of range {m}")
        if not (w <= m // 5760 + 2 and m < w * 10080): iss.append(f"fails survival_wave_fits: wave {w}, minutes {m}")
        if res.get("env") not in ENVS: iss.append("bad env " + str(res.get("env")))
    elif res:
        if res.get("score") != r["cash"] - r["start"]: iss.append(f"score {res.get('score')} != cash-start {r['cash']-r['start']}")
        if not (-10_000_000 <= res.get("score", 0) <= 60_000_000): iss.append(f"score out of table range: {res.get('score')}")
        if res.get("days") != 30: iss.append("days != 30")
    if res and (len(res.get("version", "")) > 12 or len(res.get("mill", "")) > 40): iss.append("version/mill too long")
    return iss

def run(pw, k):
    env, style = ENVS[k % 4], STYLES[(k // 4) % len(STYLES)]
    leader = LEADERS[(k // 20 + k) % 4]
    swap = [LEADERS[(LEADERS.index(leader) + 1) % 4], 2 + k % 3] if (k % 3 == 0) else None
    wk = 0 if k % 5 == 0 else k + (500 if SURV else 0)
    html = base; netlog, errs = [], []
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 900, "height": 640})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", make_route(html, netlog))
    pg.add_init_script(INIT.replace("let s=123456789", f"let s={1000 + k * 7919}") + f";window.__WK={wk};")
    t0 = time.time(); rec = {"k": k, "mode": mode, "env": env, "style": style, "leader": leader, "swap": swap, "week_offset": wk}
    try:
        pg.goto(f"http://bench.local/?env={env}&nobf")
        pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000)
        pg.evaluate("id=>document.getElementById(id).click()", "v2surv" if SURV else "v2go")
        pg.wait_for_function("()=>{const e=document.getElementById('leadOv');return e&&!e.hidden}", timeout=60000)
        pg.evaluate("l=>document.querySelector('#leadOv .ldcard[data-l=\"'+l+'\"]').click()", leader)
        pg.evaluate("()=>document.getElementById('ld-go').click()")
        pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000, polling=200)
        rec["load_s"] = round(time.time() - t0, 1)
        if pg.evaluate("()=>!!(__PM.S.lead)&&__PM.S.lead.id") != leader: rec.setdefault("issues", []).append("picked leader not applied")
        pg.evaluate("()=>{const t=document.getElementById('tut');if(t)t.hidden=true;const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;}")
        r = pg.evaluate(PLAY, [style, 1000 + k * 7919, swap if SURV else None, SURV]); rec.update(r); rec["issues"] = rec.get("issues", []) + check(r)
        name = f"QA Test {k + (100 if SURV else 0)}"; rec["name"] = name
        pg.evaluate("n=>{const i=document.getElementById('so-name');i.value=n;i.dispatchEvent(new Event('input'))}", name)
        msg = ""
        for _ in range(4):
            if not NOPOST: gate()
            try: pg.click("#so-submit", timeout=60000)
            except Exception:
                rec["issues"].append("Submit not clickable by a real click"); pg.evaluate("()=>document.getElementById('so-submit').click()")
            pg.wait_for_function("()=>{const m=document.getElementById('so-msg').textContent;return m&&m!=='Submitting…'}", timeout=45000)
            msg = pg.evaluate("()=>document.getElementById('so-msg').textContent")
            rec.setdefault("submit_msgs", []).append(msg)
            if "Too many" not in msg: break
            time.sleep(30)
        rec["submitted"] = "Submitted" in msg
        if not rec["submitted"]: rec["issues"].append("submit did not reach the board: " + msg)
        pg.wait_for_timeout(2500)
        rec["board_open"] = pg.evaluate("()=>!document.getElementById('lbOv').hidden")
        rec["board_tab"] = pg.evaluate("()=>{const b=document.querySelector('#lb-tabs button[aria-pressed=\"true\"]');return b&&b.dataset.t}")
        rec["board_me_row"] = pg.evaluate("()=>{const r=document.querySelector('#lb-list .lbrow.me');return r?r.textContent:null}")
        if rec["submitted"] and not NOPOST:
            q = urllib.parse.quote(name); tbl = "survival" if SURV else "scores"
            sel = "name,minutes,wave,tons,incidents,mill,version,env" if SURV else "name,score,tons,incidents,mill,version,days"
            req = urllib.request.Request(f"https://htlsrhdvloptctzwzbau.supabase.co/rest/v1/{tbl}?select={sel}&name=eq.{q}&order=created_at.desc&limit=1", headers={"apikey": "sb_publishable_BSp3JNLLDR4dYPJf-EgPJg_g5t6VMa6"})
            with urllib.request.urlopen(req, context=CTX, timeout=30) as resp: row = json.loads(resp.read())
            rec["db_row"] = row[0] if row else None; res = r.get("result") or {}
            if not row: rec["issues"].append("row not found in the live table after submit")
            else:
                for f in sel.split(",")[1:]:
                    if row[0].get(f) != res.get(f): rec["issues"].append(f"db {f}={row[0].get(f)} != game {res.get(f)}")
            if rec["board_open"] and not rec["board_me_row"] and (SURV or res.get("score", 0) >= 0): rec["issues"].append("own row not highlighted on the board after submit")
        if not rec["board_open"] and rec["submitted"]: rec["issues"].append("board did not open after submit")
    except Exception as e:
        rec.setdefault("issues", []).append("HARNESS/PAGE " + str(e)[:300])
    rec["errors"] = errs[:15]; rec["net"] = netlog[-6:]; rec["wall_s"] = round(time.time() - t0, 1)
    if errs: rec.setdefault("issues", []).append(f"{len(errs)} page/console error(s)")
    b.close(); return rec

with sync_playwright() as pw:
    todo = [int(x) for x in os.environ["QA_TODO"].split(",")] if os.environ.get("QA_TODO") else list(range(k0, k1 + 1, stride))
    for k in todo:
        rec = run(pw, k)
        with open(out, "a") as f: f.write(json.dumps(rec) + "\n")
        res = rec.get("result") or {}
        print(k, mode, rec["env"], rec["style"], rec.get("leader"), "day", rec.get("day"), "score" if not SURV else "wave", res.get("score") if not SURV else res.get("wave"),
              "rel", rec.get("rel"), "submitted", rec.get("submitted"), "wall", rec["wall_s"], "issues", rec.get("issues", [])[:3], flush=True)
