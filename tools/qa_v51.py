"""QA v5.1 (offline civics build): full playthroughs through the real menu, leader picker, choice cards, event cards,
outage dialogs and the end screen, then Submit to a LOCAL stand-in of the leaderboard (no live posts).
Adapted from claude/qa-tools/qa_survival.py (the QA procedure in qa-playthrough.md); seasons and survival runs.
Usage: python3 qa_v51.py <index.html> <first_k> <last_k> <out.jsonl> [--stride=N]
Run k: mode = season for even k, survival for odd k; site cycles rural/urban/desert/swamp; style cycles
handsoff / buyer / gambler / random (k//2 % 4); leader cycles chip/dot/fel/hank; a third of runs change leader at an
outage; 80 of 100 shift the week seed (different dice), 20 use this week's real dice."""
import json, os, pathlib, sys, time, urllib.parse, re
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
exec((HERE / "bench.py").read_text().split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
args = [a for a in sys.argv[1:] if not a.startswith("--")]
path, k0, k1, out = args[0], int(args[1]), int(args[2]), args[3]
stride = int(next((a.split("=")[1] for a in sys.argv if a.startswith("--stride=")), "1"))
ENVS = ["rural", "urban", "desert", "swamp"]; STYLES = ["handsoff", "buyer", "gambler", "random"]; LEADERS = ["chip", "dot", "fel", "hank"]
base = pathlib.Path(path).read_text()
base = base.replace("window.__PM={", "window.__PM={get ECON(){return ECON},get UPS(){return UPS},get BN(){return BN},buy:id=>buy(id),lineCaps:()=>lineCaps(),get SURV(){return SURV},survUp:w=>survUp(w),survCost:w=>survCost(w),upCost:(u,l)=>upCost(u,l),upLocked:()=>upLocked(),"
                    "get CIV(){return CIV},get CIVU(){return CIVU},civCommit:()=>civCommit(),civBand:v=>civBand(v),civCost:t=>civCost(t),", 1)
base = base.replace("seedRun(Math.floor(Date.now()/6048e5)", "seedRun(Math.floor((Date.now()+(window.__WK||0)*6048e5)/6048e5)", 1)
assert "window.__WK" in base and "civCommit:" in base

# ---- the local stand-in of the two Supabase tables (scores, survival): POST stores, GET lists, HEAD counts ----
DB = {"scores": [], "survival": []}
def standin(r, netlog):
    u = r.request.url; m = r.request.method; p = urllib.parse.urlparse(u); table = p.path.split("/rest/v1/")[-1]; q = urllib.parse.unquote(p.query)
    rows = DB.setdefault(table, []); hd = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    if m == "OPTIONS": return r.fulfill(status=204, headers={**hd, "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*"})
    if m == "POST":
        row = json.loads(r.request.post_data or "{}"); row["id"] = len(rows) + 1; row["created_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        bad = None
        if table == "survival":
            mi, w = row.get("minutes", -1), row.get("wave", 0)
            if not (w <= mi // 5760 + 2 and mi < w * 10080): bad = "violates check constraint survival_wave_fits"
        if not re.fullmatch(r"[A-Za-z0-9 ._'-]{2,16}", row.get("name", "")): bad = "bad name"
        netlog.append({"m": m, "t": table, "body": row, "status": 400 if bad else 201})
        if bad: return r.fulfill(status=400, body=json.dumps({"message": bad}), headers=hd)
        rows.append(row); return r.fulfill(status=201, body="", headers=hd)
    key = "minutes" if table == "survival" else "score"
    if m == "HEAD":
        n = len(rows); mm = re.search(key + r"\.gt\.(-?\d+)", q)
        if mm: n = sum(1 for x in rows if x.get(key, 0) > int(mm.group(1)))
        netlog.append({"m": m, "t": table, "count": n})
        return r.fulfill(status=200, body="", headers={**hd, "Content-Range": f"0-0/{n}", "Access-Control-Expose-Headers": "Content-Range"})
    out = sorted(rows, key=lambda x: (-x.get(key, 0), -x.get("tons", 0)))[:100]
    netlog.append({"m": m, "t": table, "rows": len(out)})
    return r.fulfill(status=200, body=json.dumps(out), headers=hd)
def make_route(html, netlog):
    def route(r):
        if "supabase.co" in r.request.url: return standin(r, netlog)
        return route_for(html)(r)
    return route

PLAY = r"""async ([style,seed,swap,mode])=>{const P=__PM,S=P.S,h=P.SIM_STEP||0.25,K=['E','L','M','C'];let x=seed>>>0;const rnd=()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};
  const click=id=>{const b=document.getElementById(id);if(b&&!b.disabled){b.click();return true;}return false;};
  const vis=id=>{const e=document.getElementById(id);return !!e&&!e.hidden;};
  const lv=id=>(S.up&&S.up[id])||0,log={leader0:S.lead&&S.lead.id,cards:0,acc:0,outs:0,rcs:0,bought:[],nan:false,stuckClosed:0,ovs:{},picks:[],swapped:null,
    civ:{dec:0,auto:0,kinds:{},warn:0,crisis:0,reward:0,ids:{},bad:[]},meters:{min:{},max:{},sum:{},n:0},civPaid:[]};
  K.forEach(k=>{log.meters.min[k]=100;log.meters.max[k]=0;log.meters.sum[k]=0;});
  const bad=t=>{if(log.civ.bad.length<30&&!log.civ.bad.includes(t))log.civ.bad.push(t);};
  let n=0,lastDay=-1,t0=performance.now(),stuck=0;const maxDays=mode==='surv'?150:31;
  const shop=()=>{if(P.upLocked&&P.upLocked())return;const fix=(P.BN[S.bn]?P.BN[S.bn].ups:[]).filter(id=>!lv(id));
    const order=fix.concat(P.UPS.map(u=>u.id).filter(id=>!fix.includes(id)));const pick=style==='random'?order.sort(()=>rnd()-.5):order;
    for(const id of pick){const u=P.UPS.find(q=>q.id===id);if(!u||lv(id)>=u.lv.length)continue;const c=P.upCost(u,lv(id));
      if(S.cash-c>=(style==='random'?0:400e3)){const l0=lv(id),c0=S.cash;P.buy(id);if(lv(id)>l0){log.bought.push(id);if(Math.abs((c0-S.cash)-c)>1)log.costMismatch=(log.costMismatch||[]).concat([[id,c,c0-S.cash]]);}return;}}};
  const leadPlan=()=>{if(!S.lead)return;const q=s=>document.querySelector('#out-lead '+s);
    if(swap&&+swap[1]===S.outg.k&&!S.lead.changed){const c=q('#out-lchg');if(c){c.click();const b=q('.ldswap button[data-to="'+swap[0]+'"]');if(b){b.click();log.swapped=swap.join('@');}else log.ovs.noSwapBtn=1;}else log.ovs.noChangeBtn=1;}
    const btns=[...document.querySelectorAll('#out-lpick button[data-p]')];if(btns.length){const b=btns[Math.floor(rnd()*btns.length)];b.click();log.picks.push(S.outg.k+':'+b.dataset.p);}};
  // the choice card: answer as the style would; check what it shows against the data
  const civPick=()=>{const d=S.civ.cur,id=d.id,bs=[...document.querySelectorAll('#civOv .civbtn')],u=P.CIVU[id];log.civ.dec++;log.civ.kinds[d.kind]=(log.civ.kinds[d.kind]||0)+1;log.civ.ids[id]=(log.civ.ids[id]||0)+1;
    if(id.startsWith('w_'))log.civ.warn++;else if(id.startsWith('c_'))log.civ.crisis++;else if(id.startsWith('r_'))log.civ.reward++;
    const want=id.startsWith('r_')?2:u?u.ch.length:-1;if(bs.length!==want)bad('card '+id+': '+bs.length+' buttons, data has '+want);
    let i=0;if(id.startsWith('r_'))i=style==='handsoff'?1:0;
    else{const t=u.t||'';i=style==='buyer'?Math.max(0,t.indexOf('P')):style==='handsoff'?Math.max(0,t.indexOf('Q')):Math.floor(rnd()*bs.length);
      if(style==='gambler'){const nb=u.ch.map((c,j)=>c[4]?j:-1).filter(j=>j>=0);if(nb.length)i=nb[Math.floor(rnd()*nb.length)];}
      const box=document.getElementById('civ-ord');if(box)box.checked=style==='handsoff';}
    if(i>=bs.length)i=0;
    // shown cost vs cash charged (Dot's discount on proper fixes, the hedge halving and the inspector blitz are the known exceptions)
    const shown=(bs[i].querySelector('.cvcost')||{}).textContent||'',c0=S.cash;bs[i].click();const paid=Math.round(c0-S.cash);
    if(!id.startsWith('r_')&&u){const exp=P.civCost(u.ch[i][1]);if(Math.abs(paid-exp)>1&&!(S.lead&&S.lead.id==='dot')&&id!=='energyspike'&&id!=='inspector')log.civPaid.push([id,i,shown,exp,paid]);}
    if(!vis('civOv')&&S.civ.cur)bad('card '+id+' closed but a decision is still current');};
  while(S.season&&S.season.on&&n<maxDays*1440/h){P.step(h);n++;if(!isFinite(S.cash)||!isFinite(S.t))log.nan=true;
    if(S.civ&&S.civ.pending){log.civ.auto++;if(vis('civOv'))bad('toast and card at once');P.civCommit();}
    const civOpen=S.civ&&S.civ.cur&&vis('civOv');
    if(S.civ&&S.civ.cur&&!civOpen){if(++stuck>2000){bad('decision waiting with no card: '+S.civ.cur.id);stuck=-1e9;}}else if(stuck>0)stuck=0;
    if(civOpen){try{civPick();}catch(e){bad('civ pick threw '+String(e).slice(0,120));}}
    const o=S.cards&&S.cards.open;
    if(o&&!civOpen){if(o.c){log.cards++;const acc=style==='gambler'||(style==='buyer'&&rnd()<.5)||(style==='random'&&rnd()<.5);if(acc){log.acc++;if(!click('deal-yes'))log.ovs.noYes=(log.ovs.noYes||0)+1;}else if(!click('deal-no'))log.ovs.noNo=(log.ovs.noNo||0)+1;
        const d=document.getElementById('dealOv');if(d){clearTimeout(d._t);d.hidden=true;d.classList.remove('dealres');}}
      else if(o.outage){log.outs++;const v=style==='gambler'?0:style==='buyer'&&S.cash>1.5e6?2:style==='random'?null:1;
        document.querySelectorAll('#outOv .orow').forEach(r=>{const vv=v===null?Math.floor(rnd()*3):v;const b=r.querySelector('.seg button[data-v="'+vv+'"]');if(b)b.click();});
        const pr=[...document.querySelectorAll('#outOv .civplan .seg')];if(S.civ&&!pr.length)bad('outage dialog without civics levers');
        pr.forEach(sg=>{const on=[...sg.querySelectorAll('button[aria-pressed="true"]')];if(on.length!==1)bad('outage lever '+sg.dataset.c+' starts with '+on.length+' buttons pressed');
          const b=sg.querySelectorAll('button');if(style==='random')b[Math.floor(rnd()*b.length)].click();if(style==='buyer'&&S.cash>1e6&&sg.dataset.c!=='price')b[b.length-1].click();});
        leadPlan();if(!click('out-ok'))log.ovs.noOutOk=(log.ovs.noOutOk||0)+1;}
      else if(o.report){log.rcs++;if(!click('rc-ok'))log.ovs.noRcOk=(log.ovs.noRcOk||0)+1;}
      if(S.cards.open&&!(S.cards.open.civ)){log.stuckClosed++;S.cards.open=null;}}
    {const r=document.getElementById('rc-ok');if(r&&r.offsetParent)r.click();}
    if(n%240===0&&S.civ){log.meters.n++;for(const k of K){const v=S.civ.m[k];if(!(v>=0&&v<=100))bad('meter '+k+' out of range '+v);log.meters.min[k]=Math.min(log.meters.min[k],v);log.meters.max[k]=Math.max(log.meters.max[k],v);log.meters.sum[k]+=v;}
      if(S.civ.q.length>6)bad('civics queue backs up: '+S.civ.q.length);}
    const d=Math.floor(S.t/1440);if(style!=='handsoff'&&d!==lastDay){lastDay=d;shop();}
    P.setRunning(false);if(n%4000===0)await new Promise(r=>setTimeout(r,0));}
  log.steps=n;log.simSec=+((performance.now()-t0)/1000).toFixed(1);log.day=+(S.t/1440).toFixed(2);log.done=!!(S.season&&S.season.done);log.result=S.season&&S.season.result;
  log.cash=Math.round(S.cash);log.bn=S.bn;log.leaderEnd=S.lead&&S.lead.id;log.leadWas=S.lead&&S.lead.was;log.wage=S.civ&&S.civ.wage||1;
  log.meters.mean=Object.fromEntries(K.map(k=>[k,Math.round(log.meters.sum[k]/Math.max(1,log.meters.n))]));delete log.meters.sum;
  log.ledger=Object.fromEntries(Object.entries(S.ledger||{}).map(([k,v])=>[k,Math.round(v)]));
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const so=document.getElementById('seasonOv');log.summaryShown=!!so&&!so.hidden;log.soH=(document.getElementById('so-h')||{}).textContent;log.soP=(document.getElementById('so-p')||{}).textContent;
  log.stats=[...document.querySelectorAll('#so-stats > div')].map(d=>d.textContent);
  log.otherOverlays=[...document.querySelectorAll('.overlay')].filter(e=>!e.hidden&&e.id!=='seasonOv'&&!e.classList.contains('dealres')&&!e.classList.contains('note')).map(e=>e.id);
  log.toastLeft=vis('civToast');return log;}"""

def check(r, mode):
    iss = []; res = r.get("result") or {}
    if not r["done"]: iss.append(f"run still going after {r['day']} days")
    if not r["summaryShown"]: iss.append("end screen not shown")
    if r["nan"]: iss.append("NaN cash/time")
    if r["otherOverlays"]: iss.append("dialogs left open at the end: " + ",".join(r["otherOverlays"]))
    if r.get("toastLeft"): iss.append("standing-order toast left open at the end")
    if r["stuckClosed"]: iss.append(f"{r['stuckClosed']} card(s) did not close via their button")
    if r["ovs"]: iss.append("UI controls missing: " + json.dumps(r["ovs"]))
    if r.get("costMismatch"): iss.append("upgrade price != cash charged: " + str(r["costMismatch"][:3]))
    if r.get("civPaid"): iss.append("choice cost shown != cash charged: " + str(r["civPaid"][:3]))
    for b in r["civ"]["bad"]: iss.append("civics: " + b)
    if r.get("leaderEnd") and not any("Mill leader" in s for s in r.get("stats", [])): iss.append("end screen without the leader")
    if mode == "surv" and res:
        m, w = res.get("minutes", -1), res.get("wave", 0)
        if not (w <= m // 5760 + 2 and m < w * 10080): iss.append(f"fails survival_wave_fits: wave {w}, minutes {m}")
    return iss

def run(pw, k):
    mode = "season" if k % 2 == 0 else "surv"; env, style = ENVS[(k // 2) % 4], STYLES[(k // 8) % 4]; leader = LEADERS[(k + k // 4) % 4]
    swap = [LEADERS[(LEADERS.index(leader) + 1) % 4], 2 + k % 2] if k % 3 == 0 else None
    wk = 0 if k % 5 == 0 else k; netlog, errs = [], []
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 900, "height": 640})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:300]))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("CONSOLE " + m.text[:300]))
    pg.route("**/*", make_route(base, netlog))
    pg.add_init_script(INIT.replace("let s=123456789", f"let s={1000 + k * 7919}") + f";window.__WK={wk};")
    t0 = time.time(); rec = {"k": k, "mode": mode, "env": env, "style": style, "leader": leader, "swap": swap, "week_offset": wk, "issues": []}
    try:
        pg.goto(f"http://bench.local/?env={env}")
        pg.wait_for_function("window.__PM&&window.__B&&__B.first!==null", timeout=300000)
        pg.evaluate("b=>document.getElementById(b).click()", "v2go" if mode == "season" else "v2surv")
        pg.wait_for_function("()=>{const e=document.getElementById('leadOv');return e&&!e.hidden}", timeout=120000)
        rec["picker"] = pg.evaluate("()=>({cards:document.querySelectorAll('#leadOv .ldcard').length,dk:document.querySelector('#leadOv .dk').textContent,starts:document.querySelectorAll('#leadOv .ldstart').length,checked:document.querySelectorAll('#leadOv [aria-checked=true]').length})")
        if rec["picker"]["cards"] != 4: rec["issues"].append("leader picker without 4 leaders")
        if rec["picker"]["starts"] != 4: rec["issues"].append("leader picker without starting meters")
        pg.evaluate("l=>document.querySelector('#leadOv .ldcard[data-l=\"'+l+'\"]').click()", leader)
        pg.evaluate("()=>document.getElementById('ld-go').click()")
        pg.wait_for_function("__PM.S.season&&__PM.S.season.on", timeout=300000, polling=200)
        pg.evaluate("()=>{__PM.setRunning(false);const t=document.getElementById('tut');if(t)t.hidden=true;}")
        st = pg.evaluate("()=>({surv:!!__PM.S.season.surv,lead:__PM.S.lead&&__PM.S.lead.id,civ:!!__PM.S.civ})")
        if st["surv"] != (mode == "surv"): rec["issues"].append("wrong mode started")
        if st["lead"] != leader: rec["issues"].append("picked leader not applied")
        if not st["civ"]: rec["issues"].append("civics not started")
        pg.evaluate("()=>{const G=__PM.G3;if(G&&G.EXP)G.EXP.noRender=true;G.on=false;}")
        r = pg.evaluate(PLAY, [style, 1000 + k * 7919, swap, mode]); rec.update(r); rec["issues"] += check(r, mode)
        if swap and not r.get("swapped") and (r.get("result") or {}).get("wave", 9) > swap[1] + 1: rec["issues"].append(f"leader change at outage {swap[1]} did not happen")
        name = f"QA Test {k}"
        pg.evaluate("n=>{const i=document.getElementById('so-name');i.value=n;i.dispatchEvent(new Event('input'))}", name)
        try: pg.click("#so-submit", timeout=60000)
        except Exception:
            rec["issues"].append("Submit button not clickable by a real click"); pg.evaluate("()=>document.getElementById('so-submit').click()")
        pg.wait_for_function("()=>{const m=document.getElementById('so-msg').textContent;return m&&m!=='Submitting…'}", timeout=45000)
        msg = pg.evaluate("()=>document.getElementById('so-msg').textContent"); rec["submit_msg"] = msg; rec["submitted"] = "Submitted" in msg
        if not rec["submitted"]: rec["issues"].append("submit failed: " + msg)
        pg.wait_for_timeout(1200)
        rec["board"] = pg.evaluate("()=>({open:!document.getElementById('lbOv').hidden,tab:(document.querySelector('#lb-tabs button[aria-pressed=\"true\"]')||{dataset:{}}).dataset.t,me:!!document.querySelector('#lb-list .lbrow.me')})")
        if rec["submitted"]:
            tbl = "survival" if mode == "surv" else "scores"; row = [x for x in DB[tbl] if x.get("name") == name]; res = r.get("result") or {}
            if not row: rec["issues"].append("row not stored by the stand-in board")
            else:
                for f in ("minutes", "wave", "score", "tons", "incidents", "mill", "version", "env", "days"):
                    if f in res and row[-1].get(f) != res.get(f): rec["issues"].append(f"posted {f}={row[-1].get(f)} != game {res.get(f)}")
            want = "surv" if mode == "surv" else "season"
            if not rec["board"]["open"]: rec["issues"].append("board did not open after submit")
            elif rec["board"]["tab"] != want: rec["issues"].append(f"board opened on tab {rec['board']['tab']}")
            elif not rec["board"]["me"]: rec["issues"].append("own row not highlighted on the board")
    except Exception as e:
        rec["issues"].append("HARNESS/PAGE " + str(e)[:300])
    rec["errors"] = errs[:15]; rec["net"] = netlog[-6:]; rec["wall_s"] = round(time.time() - t0, 1)
    if errs: rec["issues"].append(f"{len(errs)} page/console error(s)")
    b.close(); return rec

with sync_playwright() as pw:
    todo = [int(x) for x in os.environ["QA_TODO"].split(",")] if os.environ.get("QA_TODO") else list(range(k0, k1 + 1, stride))
    for k in todo:
        rec = run(pw, k)
        with open(out, "a") as f: f.write(json.dumps(rec) + "\n")
        print(k, rec["mode"], rec["env"], rec["style"], rec["leader"], "day", rec.get("day"), "submitted", rec.get("submitted"), "wall", rec["wall_s"], "issues", rec["issues"][:3], flush=True)
