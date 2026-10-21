"""Which draws cost what: every draw submitted in one main-pass frame (and one shadow refresh), with its triangles.
Phone emulation, normal play, ~20 s in. Usage: python3 drawcost.py <index.html> [--top=40]
Wraps renderer.renderBufferDirect, so a BatchedMesh multi-draw counts as one draw with all its triangles."""
import json, sys, pathlib
from playwright.sync_api import sync_playwright
import pmbench as PB
args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:] if a.startswith("--")}
html = PB.load_html(args[0]); TOP = int(flags.get("--top", 40))
LIST = r"""()=>new Promise(res=>{const G=__PM.G3,R=G.renderer,SM=R.shadowMap;const rows=[];let pass="main";
  const rbd=R.renderBufferDirect;R.renderBufferDirect=function(cam,scene,geo,mat,obj,group){const t0=R.info.render.triangles;rbd.call(this,cam,scene,geo,mat,obj,group);
    const tris=R.info.render.triangles-t0;let kind=obj.isBatchedMesh?"batched":obj.isInstancedMesh?"instanced":obj.isLine?"line":obj.isSprite?"sprite":obj.isPoints?"points":obj.userData&&obj.userData.smBatch?"baked":Array.isArray(obj.material)?"multimat":"mesh";
    const m=Array.isArray(obj.material)?obj.material[group?group.materialIndex:0]:obj.material;
    let name=obj.name||"";let p=obj;while(!name&&p.parent&&p.parent!==scene){p=p.parent;name=p.name||"";}
    rows.push({pass,kind,tris,type:m&&m.type,transparent:!!(m&&m.transparent),name:name||(obj.userData&&Object.keys(obj.userData).slice(0,3).join(",")),uuid:obj.uuid.slice(0,8),count:obj.isInstancedMesh?obj.count:obj.isBatchedMesh?obj.instanceCount:1,geo:geo.index?geo.index.count/3:geo.attributes.position.count/3});};
  const sm0=SM.render.bind(SM);SM.render=(...a)=>{pass="shadow";sm0(...a);pass="main";};
  SM.needsUpdate=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{R.renderBufferDirect=rbd;SM.render=sm0;
    const nodes={n:0,auto:0,frozen:0,layerHidden:0,visibleFalse:0,leaves:0};G.scene.traverse(o=>{nodes.n++;if(o.matrixAutoUpdate)nodes.auto++;if(o.matrixWorldAutoUpdate===false)nodes.frozen++;if(o.layers.mask!==1)nodes.layerHidden++;if(!o.visible)nodes.visibleFalse++;if(!o.children.length)nodes.leaves++;});
    res({rows,nodes});}));})"""
with sync_playwright() as pw:
    b = PB.launch(pw); ctx = PB.phone_context(b, 1.25); pg = ctx.new_page(); errs = []
    PB.start_game(pg, html, errs=errs); pg.wait_for_timeout(20000)
    shot = flags.get("--shot");
    if shot: pg.screenshot(path=shot); print("screenshot", shot)
    r = pg.evaluate(LIST); rows = r["rows"]
    print("scene nodes:", json.dumps(r["nodes"]))
    for p in ("main", "shadow"):
        rs = [x for x in rows if x["pass"] == p]
        if not rs: continue
        print(f"\n== {p} pass: {len(rs)} draws, {sum(x['tris'] for x in rs):,} triangles")
        agg = {}
        for x in rs:
            k = x["kind"] + (" transparent" if x["transparent"] else ""); a = agg.setdefault(k, [0, 0]); a[0] += 1; a[1] += x["tris"]
        for k, (n, t) in sorted(agg.items(), key=lambda kv: -kv[1][1]): print(f"  {k:24s} {n:4d} draws {t:9,} tris")
        print(f"  top {TOP} draws by triangles:")
        for x in sorted(rs, key=lambda x: -x["tris"])[:TOP]:
            print(f"    {x['tris']:8,} tris  {x['kind']:10s} {x['type'] or '':22s} x{x['count']:<5} {x['name'][:40]}")
    pathlib.Path(PB.HERE / "drawcost.json").write_text(json.dumps(r, indent=1))
    print("errors", errs[:3]); b.close()
