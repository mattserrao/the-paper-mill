"""v7.0 site: the zone frames put everything where the v7 site draws it.
  taps     every fiddly knob, DCS console, the spider valve and the headbox slice opens from a tap on where it is drawn,
           in the normal view and in the fiddly knobs view (their tap targets live outside the scene and are never zoned)
  places   every drawn mesh, and every instance of an instanced mesh, stands at the site point of its logical spot
           (catches parts zoned by their origin: meshes baked after the pass, stock that fills in later, empty holders)
  rail     the rail spur stops at the bale yard (baked after the pass, it once ran on past stock prep)
  pins     every upset fired at once: each effect's pin is drawn within 5 m of its upset's spot
  routes   (t5) people can walk between the consoles, the round spots and the maintenance spots of every block without a
           jump on screen, and no trike route falls back to the old lane routes in a run
Usage: python3 site.py [index.html]"""
# tier: default
import sys, json, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log

TARGETS = """()=>{const G=__PM.G3;window.__tap=[];G.knobTap=h=>{__tap.push(JSON.stringify(h));};
 const L=[];for(const id in G.KX)L.push({name:'knob:'+id,at:G.KX[id].at,want:'"id":"'+id+'"'});
 L.push({name:'SPOT',at:[6.4,1.6,-22.9],want:'"a":"SPOT"',kv:false},{name:'WET',at:[58,1.6,13.4],want:'"a":"WET"'},{name:'DET',at:[26,1.6,13.4],want:'"a":"DET"',kv:false},{name:'DET (2)',at:[-5,1.6,13.4],want:'"a":"DET"'});
 if(G.MCC)L.push({name:'DRV',at:[G.MCC.desk[0],1.0,G.MCC.desk[1]-0.45],want:'"a":"DRV"',kv:false});
 const mid=a=>{const T=__PM.THREE,b=new T.Box3();a.forEach(o=>{o.updateWorldMatrix(true,false);b.expandByObject(o)});const c=b.getCenter(new T.Vector3());return [c.x,c.y,c.z];};
 L.push({name:'spider',c:mid(G.spiderHit.slice(1)),want:'spider',kv:false},{name:'slice',c:mid(G.sliceHit),want:'slice',kv:false});return L;}"""
TAP = """([it,kv])=>{const G=__PM.G3,T=__PM.THREE,cam=G.camIso;const v=it.c?new T.Vector3(...it.c):G.siteV(new T.Vector3(it.at[0],it.at[1]+(kv?2.2:0),it.at[2]));
 v.project(cam);const c=G.renderer.domElement,r=c.getBoundingClientRect(),x=r.left+(v.x+1)/2*r.width,y=r.top+(1-v.y)/2*r.height;
 __tap.length=0;['spider','slice'].forEach(i=>{const e=document.getElementById(i);if(e)e.hidden=true;});
 const o={clientX:x,clientY:y,pointerId:1,bubbles:true,isPrimary:true,button:0};c.dispatchEvent(new PointerEvent('pointerdown',o));c.dispatchEvent(new PointerEvent('pointerup',o));
 return __tap.join(' ')+(document.getElementById('spider').hidden?'':' spider')+(document.getElementById('slice').hidden?'':' slice');}"""
PLACES = """()=>{const T=__PM.THREE,G=__PM.G3,s=G.scene;s.updateMatrixWorld(true);const out={},lm=new T.Matrix4(),im=new T.Matrix4(),a=new T.Matrix4(),b=new T.Matrix4(),c0=new T.Vector3(),p=new T.Vector3(),lp=new T.Vector3();let tot=0;
 const vis=o=>{for(let x=o;x;x=x.parent)if(!x.visible)return false;return true;};
 const topOf=o=>{let t=o;while(t.parent&&t.parent!==s&&!t.parent.__zcont&&!(G.SM&&t.parent===G.SM.holder))t=t.parent;return t;};
 const FAM=new Set(['W','S','U']);
 const skip=t=>{const u=t.userData||{};return u.cut||u.load||u.cj||t.name==='mobileCrane';};   // (forklifts draw as cut-outs; the crane works beside the pulper with its boom over the line)
 // a part's own centre (its geometry's middle), in logical coordinates and where it is drawn
 const chk=(o,t,mw,lw,kind)=>{p.copy(c0).applyMatrix4(mw);lp.copy(c0).applyMatrix4(lw);const q=G.sitePt(lp.x,lp.z);tot++;
   if(Math.hypot(p.x-q[0],p.z-q[1])>1.5&&!(FAM.has(G.zoneAt(lp.x,lp.z))&&t.__zz&&FAM.has(t.__zz.k))){   // (W, the strip and U are one family: a part of a group in one of them may reach into the next)const k=kind+' '+(t.name||t.type)+' zone '+(t.__zz?t.__zz.k:t.__zdyn?'moving':'-');const r=out[k]=out[k]||{n:0,ex:null};r.n++;
    if(!r.ex)r.ex='logical '+lp.x.toFixed(1)+','+lp.z.toFixed(1)+' drawn '+p.x.toFixed(1)+' want '+q[0].toFixed(1);}};
 const one=o=>{if(!o.isMesh||o.isBatchedMesh||o.userData.smBatch||!o.geometry||!o.geometry.attributes.position)return;const t=topOf(o);if(skip(t)||t.__zz===null&&!t.__zdyn)return;if(!G.zLogMat(o,lm))return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();o.geometry.boundingBox.getCenter(c0);
  if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,im);a.multiplyMatrices(o.matrixWorld,im);b.multiplyMatrices(lm,im);chk(o,t,a,b,'instance of');}return;}
  chk(o,t,o.matrixWorld,lm,'mesh in');};
 s.traverse(o=>{if(vis(o))one(o);});
 if(G.SM)for(const r of G.SM.list){const o=r.o;let x=o;while(x.parent)x=x.parent;if(x!==s)one(o);}   // (batched originals are taken out of the scene)
 return {tot,bad:Object.entries(out).map(([k,v])=>k+': '+v.n+' ('+v.ex+')')};}"""

def site(pw):
    C.sec("site")
    html = html_arg()
    b = launch(pw)
    pg = open_game(b, html, viewport=(1280, 800), errs=errs)
    pg.wait_for_timeout(1500)
    pg.evaluate("()=>document.getElementById('v2free').click()"); pg.wait_for_timeout(5000)
    pg.evaluate("()=>{__PM.setRunning(false);document.querySelectorAll('.overlay').forEach(o=>{if(o.id!=='v2menu')o.hidden=true})}")
    L = pg.evaluate(TARGETS)
    for kv in (False, True):
        if kv: pg.evaluate("()=>__PM.G3.knobView(true)")
        miss = []
        for it in L:
            if kv and it.get("kv") is False: continue
            c = it.get("c") or it["at"]
            pg.evaluate("([x,z,s])=>{const q=s?(__PM.G3.siteToLogical(x,z)||[x,z]):[x,z];__PM.G3.camTo(q[0],q[1],46)}", [c[0], c[2], bool(it.get("c"))])
            pg.wait_for_timeout(1500)
            got = pg.evaluate(TAP, [it, kv])
            if it["want"] not in got: miss.append(f"{it['name']} -> {got or 'nothing'}")
        ok(("knobs view: " if kv else "") + "every knob, console, spider valve and slice opens from a tap where it is drawn", not miss, "; ".join(miss))
    pg.evaluate("()=>__PM.G3.knobView(false)")
    # placement and the rail, measured on the batched build (the bug paths run on the batching pass): every original
    # stays in the scene on a hidden layer with its world matrix
    pg.wait_for_function("()=>!__PM.G3.SM||__PM.G3.SM.done", timeout=120000)
    r = pg.evaluate(PLACES)
    ok("every drawn part stands at the site point of its logical spot", not r["bad"], f"{r['tot']} parts; " + " | ".join(r["bad"][:8]))
    rail = pg.evaluate("""()=>{const T=__PM.THREE,G=__PM.G3,s=G.scene;s.updateMatrixWorld(true);let mx=-1e9;const b=new T.Box3(),RZ=G.sitePt(-75,-29)[1];const L=[];   // (the spur's line, where the west block draws it)
      s.traverse(o=>L.push(o));if(G.SM)G.SM.list.forEach(r=>L.push(r.o));
      L.forEach(o=>{if(!o.isMesh||o.isBatchedMesh||!o.geometry||!o.geometry.attributes.position)return;const n=o.isInstancedMesh?o.count*o.geometry.attributes.position.count:o.geometry.attributes.position.count;if(n<2000)return;
        if(o.isInstancedMesh){o.computeBoundingBox();b.copy(o.boundingBox).applyMatrix4(o.matrixWorld);}else{if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);}
        if(b.min.z>RZ-2&&b.max.z<RZ+2&&b.max.y<0.5&&b.max.x-b.min.x>60)mx=Math.max(mx,b.max.x);});return mx;}""")
    log.append(f"     rail spur ends at site x {rail:.1f}")
    ok("the rail spur stops at the bale yard, west of stock prep", -1e8 < rail < -50, f"ends at x {rail:.1f}")
    b.close()

SPOTS = {"spot":[7.5,-21],"wet":[58,13.4],"det":[-5,13.4],"mcc":[10,23],"shop":[56,-22],"receiving":[-40,-15],"clarifier":[10,-36],
         "aeration":[30,-37],"boiler":[68.6,-10],"powerhouse":[73,-18],"winder":[-18,10],"felt":[40.5,14.6],"chest":[29.5,-9.6],"fogfan":[50.2,-2.6]}
ROUTES = """(P)=>{const G=__PM.G3,D=G.navDbg,N=D.NAVW;G.navWarm&&G.navWarm();for(const [k,s] of Object.entries(G.ASPOT||{}))P['round '+k]=[s[0],s[1]];
 const bad=[],K=Object.keys(P),from=P.wet;
 for(const k of K){if(k==='wet')continue;const p=D.navPath(N,from,P[k]);if(!p){bad.push(k+': no route');continue;}
  let big=0;for(let i=1;i<p.length;i++){if(p[i][2])continue;const n=Math.ceil(Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1])/0.25);let q0=G.sitePt(p[i-1][0],p[i-1][1]);
   for(let m=1;m<=n;m++){const x=p[i-1][0]+(p[i][0]-p[i-1][0])*m/n,z=p[i-1][1]+(p[i][1]-p[i-1][1])*m/n,q=G.sitePt(x,z),st=Math.hypot(q[0]-q0[0],q[1]-q0[1]);if(G.zoneAt(x,z)!=='S')big=Math.max(big,st);q0=q;}}
  if(big>2)bad.push(k+': a '+big.toFixed(1)+' m step on screen');}
 return {n:K.length,bad};}"""
PINS = """()=>{const G=__PM.G3,T=__PM.THREE,v=new T.Vector3(),bad=[];let n=0;
 for(const [id,f] of Object.entries(G.FX)){if(!f.on||!f.pin||!f.pin.p.visible)continue;n++;f.pin.p.updateWorldMatrix(true,false);f.pin.p.getWorldPosition(v);const q=G.sitePt(f.pin.x,f.pin.z),d=Math.hypot(v.x-q[0],v.z-q[1]);
  if(d>5)bad.push(id+' '+d.toFixed(0)+' m off');}
 return {n,bad};}"""

def more(pw):
    C.sec("site")
    html = html_arg()
    b = launch(pw)
    pg = open_game(b, html, viewport=(1280, 800), errs=errs)
    pg.wait_for_timeout(1500)
    pg.evaluate("()=>document.getElementById('v2free').click()"); pg.wait_for_timeout(4000)
    r = pg.evaluate(ROUTES, SPOTS)
    ok("people walk between the consoles, round spots and maintenance spots of every block without a jump", not r["bad"], f"{r['n']} spots; " + "; ".join(r["bad"][:8]))
    # every upset at once, then the pins
    pg.evaluate("()=>{__PM.CH.on=true;__PM.EVENTS.forEach(e=>{try{__PM.trigger(e.id,true)}catch(_){}})}")
    pg.wait_for_timeout(3000)
    r = pg.evaluate(PINS)
    ok("every upset's pin is drawn at its spot", r["n"] > 20 and not r["bad"], f"{r['n']} pins; " + "; ".join(r["bad"][:8]))
    # a run of the mill at speed: the trikes' routes
    pg.evaluate("()=>{__PM.CH.on=false;__PM.S.inc.forEach(i=>i.left=0);document.querySelectorAll('.overlay').forEach(o=>{if(o.id!=='v2menu')o.hidden=true});if(__PM.S.cards)__PM.S.cards.open=null;__PM.setRunning(true)}")
    for _ in range(3): pg.evaluate("()=>document.getElementById('v2fast').click()")
    for _ in range(6):
        pg.wait_for_timeout(8000)
        pg.evaluate("()=>{document.querySelectorAll('.overlay').forEach(o=>{if(o.id!=='v2menu'&&!o.hidden)o.hidden=true});if(__PM.S.cards)__PM.S.cards.open=null;__PM.setRunning(true)}")
    r = pg.evaluate("()=>({fails:(__PM.G3.routeFails||[]).slice(0,6),t:Math.round(__PM.S.t)})")
    ok("no trike route falls back to the lane routes", not r["fails"], f"{r['t']} sim minutes; {r['fails']}")
    b.close()

with sync_playwright() as pw:
    site(pw)
    more(pw)
C.done()
