"""v6.1 iso review: per view, every main-pass draw (name/type/material/tris), plus a CDP CPU profile of steady play.
Usage: python3 isoreview.py index.html outdir"""
import pathlib, sys, json, collections
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
html = pathlib.Path(sys.argv[1]).read_text(); out = pathlib.Path(sys.argv[2])
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
VIEWS = [("site", [-14, 5, 380]), ("mid", [10, 5, 190]), ("close", [-28, -6, 95])]
PROBE = r"""()=>new Promise(res=>{const G=__PM.G3,R=G.renderer,orig=R.renderBufferDirect.bind(R);const L=[];let on=false;
 R.renderBufferDirect=function(cam,scene,geo,mat,obj,group){if(on){const ix=geo.index?geo.index.count:(geo.attributes.position?geo.attributes.position.count:0);
   const cnt=group?group.count:ix;let inst=obj.isInstancedMesh?obj.count:(obj.isBatchedMesh?(obj._multiDrawCount||0):1);
   let p=obj,path=[];for(let k=0;k<4&&p;k++,p=p.parent)path.push(p.name||p.type);
   (window.__DO||(window.__DO=[])).push(obj);L.push({path:path.join("<"),type:obj.type,mat:mat.type+(mat.transparent?"(T)":"")+(mat.map?"(map)":"")+(mat.vertexColors?"(vc)":""),tris:Math.round(cnt/3)*(obj.isInstancedMesh?obj.count:1),inst,ro:obj.renderOrder,layer:obj.layers.mask,prog:mat.name||mat.uuid.slice(0,6)});}
   return orig(cam,scene,geo,mat,obj,group);};
 G.lastMove=performance.now();requestAnimationFrame(()=>{on=true;requestAnimationFrame(()=>{on=false;R.renderBufferDirect=orig;res(L);});});})"""
WHY = r"""()=>{const G=__PM.G3,out={};const seen=new Set();
 for(const o of window.__DO){if(seen.has(o))continue;seen.add(o);if(!o.isMesh||o.isInstancedMesh||o.isBatchedMesh||o.userData.smBatch||o.layers.mask!==1)continue;
  let anc=[];for(let p=o;p&&p!==G.scene;p=p.parent){const ud=Object.keys(p.userData||{}).filter(k=>k!=='fullGeo').join('+');anc.push((p.name||p.type)+(ud?'{'+ud+'}':''));}
  const m=o.material,g=o.geometry;let why=[];
  if(Array.isArray(m))why.push('arrayMat');else{if(m.transparent)why.push('transp');if(o.renderOrder)why.push('ro');if(!['MeshStandardMaterial','MeshLambertMaterial','MeshBasicMaterial'].includes(m.type))why.push(m.type);}
  if(o.onBeforeRender!==__PM.THREE.Object3D.prototype.onBeforeRender)why.push('onBeforeRender');
  for(const k in g.attributes)if(!['position','normal','uv'].includes(k))why.push('attr:'+k);
  if(!g.attributes.normal)why.push('noNormal');if(g.drawRange.count!==Infinity)why.push('drawRange');if(o.matrixWorld.determinant()<=0)why.push('mirrored');
  if(!why.length)why.push('eligible(no batch: <3 same look?)');
  const k=why.join(',')+'  @ '+anc.slice(0,4).join('<')+'  ['+(m.type||'')+' '+(g.type||'')+' v'+(g.attributes.position?g.attributes.position.count:0)+']';out[k]=(out[k]||0)+1;}
 return out;}"""
UA = None
if len(sys.argv) > 3 and sys.argv[3] == "ios": UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1"
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, **({"user_agent": UA} if UA else {}))
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&(!__PM.G3.SM||__PM.G3.SM.done)&&(!__PM.G3.prewarm||__PM.G3.warm)", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.evaluate("()=>{__PM.setFps('max');__PM.C.simSpeed=20;}")
    res = {}
    for name, v in VIEWS:
        pg.evaluate("v=>{__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955]);}", v)
        pg.wait_for_timeout(5000)
        pg.evaluate("()=>{const c=document.querySelector('#evc:not([hidden]) button');if(c)c.click();}")
        pg.evaluate("()=>{window.__DO=[]}"); res[name] = pg.evaluate(PROBE)
        res[name+"_why"] = pg.evaluate(WHY)
    # scene stats
    res["scene"] = pg.evaluate("""()=>{const G=__PM.G3,sc=G.scene;let n=0,vis=0,auto=0,meshes=0,progs=(G.renderer.info.programs||[]).length;sc.traverse(o=>{n++;if(o.matrixAutoUpdate)auto++;if(o.isMesh)meshes++;});sc.traverseVisible(()=>vis++);
      return {nodes:n,visible:vis,auto,meshes,progs,geoms:G.renderer.info.memory.geometries,tex:G.renderer.info.memory.textures,canvas:[G.renderer.domElement.width,G.renderer.domElement.height],pr:G.renderer.getPixelRatio()}}""")
    # CPU profile at mid view, 10 s
    pg.evaluate("v=>{__PM.G3.camSet([v[0],v[1],v[2],-0.785,0.955]);}", VIEWS[1][1]); pg.wait_for_timeout(3000)
    cdp = ctx.new_cdp_session(pg); cdp.send("Profiler.enable"); cdp.send("Profiler.setSamplingInterval", {"interval": 200}); cdp.send("Profiler.start")
    pg.wait_for_timeout(10000)
    prof = cdp.send("Profiler.stop")["profile"]
    b.close()
nodes = {n["id"]: n for n in prof["nodes"]}
dt = collections.Counter(); 
samples, deltas = prof["samples"], prof["timeDeltas"]
for s, d in zip(samples, deltas): dt[s] += d
selft = collections.Counter(); 
for nid, t in dt.items():
    cf = nodes[nid]["callFrame"]; selft[(cf["functionName"] or "(anon)") + ":" + str(cf["lineNumber"])] += t
# inclusive by function
parent = {}
for n in prof["nodes"]:
    for c in n.get("children", []): parent[c] = n["id"]
incl = collections.Counter()
for nid, t in dt.items():
    seen = set(); x = nid
    while x is not None:
        cf = nodes[x]["callFrame"]; k = (cf["functionName"] or "(anon)") + ":" + str(cf["lineNumber"])
        if k not in seen: incl[k] += t; seen.add(k)
        x = parent.get(x)
tot = sum(dt.values())
res["cpu"] = {"total_ms": tot / 1000, "self": [(k, round(v / 1000)) for k, v in selft.most_common(40)], "incl": [(k, round(v / 1000)) for k, v in incl.most_common(60)]}
res["errors"] = errs
(out / "review.json").write_text(json.dumps(res))
for name, _ in VIEWS:
    L = res[name]; c = collections.Counter(); t = collections.Counter()
    for d in L: k = d["path"].split("<")[0] + " | " + d["type"] + " | " + d["mat"]; c[k] += 1; t[k] += d["tris"]
    print(f"== {name}: {len(L)} draws, {sum(d['tris'] for d in L)} tris")
    for k, n in c.most_common(45): print(f"  {n:4d} {t[k]:7d}  {k}")
for name, _ in VIEWS:
    print("-- unbatched", name)
    for k, n in sorted(res[name+"_why"].items(), key=lambda x: -x[1])[:40]: print(f"  {n:3d} {k}")
print(json.dumps(res["scene"])); print("errors", errs[:3])
