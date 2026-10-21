"""Dump part of the game's 3D scene for Blender (the Blender redesign work).

Usage: python3 bl_dump.py <index.html> <out.json> x0 x1 y0 y1 z0 z1 [shot.png]

Loads the game headless with ?nosm (no static batching, originals stay in the scene), starts a season and dumps every
visible mesh whose world bounding box centre is inside the box: world-space triangles, material colour, the source
geometry type, plus the iso camera (world matrix, ortho frustum) so Blender can match the game's view.
"""
import json, sys, pathlib
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
import sys as _s; _s.path.insert(0, str(HERE))
from lib import route_for, INIT, HOOK, pick_leader   # v6.10.2: the shared harness (tools/lib.py)
html = pathlib.Path(sys.argv[1]).read_text()
out = sys.argv[2]; box = [float(v) for v in sys.argv[3:9]]; shot = sys.argv[9] if len(sys.argv) > 9 else None
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
DUMP = r"""(B)=>{const T=__PM.THREE,G=__PM.G3,sc=G.scene,res=[],v=new T.Vector3(),bb=new T.Box3(),c=new T.Vector3();
 sc.updateMatrixWorld(true);
 sc.traverse(o=>{if(!o.isMesh||o.isInstancedMesh&&!o.count)return;let x=o,vis=true;for(;x;x=x.parent)if(!x.visible){vis=false;break;}if(!vis)return;
  const g=o.geometry;if(!g||!g.attributes.position)return;if(!g.boundingBox)g.computeBoundingBox();bb.copy(g.boundingBox).applyMatrix4(o.matrixWorld);bb.getCenter(c);
  if(c.x<B[0]||c.x>B[1]||c.y<B[2]||c.y>B[3]||c.z<B[4]||c.z>B[5])return;
  const p=g.attributes.position,idx=g.index,P=[],F=[];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);P.push(+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4));}
  if(idx)for(let i=0;i<idx.count;i++)F.push(idx.getX(i));else for(let i=0;i<p.count;i++)F.push(i);
  const m=Array.isArray(o.material)?o.material[0]:o.material,col=m&&m.color?'#'+m.color.getHexString():'#888888';
  res.push({name:o.name||'',type:g.type,params:g.parameters||null,color:col,tok:m&&m.userData&&m.userData.token||'',line:!!(o.isLineSegments||o.isLine),P,F});});
 return {objs:res};}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    pg.on("console", lambda m: m.type == "error" and print("CONSOLE", m.text[:200]))
    pg.route("**/*", route_for(html)); pg.add_init_script(INIT); pg.goto("http://bench.local/?nosm")
    pg.wait_for_function("window.__PM&&__PM.G3&&__PM.G3.scene&&!!__PM.G3.camSet", timeout=300000, polling=500)
    pg.evaluate("()=>document.getElementById('v2go').click()"); pick_leader(pg)
    pg.wait_for_timeout(4000)
    d = pg.evaluate(DUMP, box)
    pathlib.Path(out).write_text(json.dumps(d))
    print(len(d["objs"]), "meshes", sum(len(o["F"]) // 3 for o in d["objs"]), "tris")
    if shot:
        cx,cz=(box[0]+box[1])/2,(box[4]+box[5])/2
        pg.evaluate("c=>{__PM.C.simSpeed=1;__PM.G3.camSet(c);}",[cx,cz,760/(float(__import__("os").environ.get("ZK","12"))),-0.785398,0.955317,(box[2]+box[3])/2]); pg.wait_for_timeout(3000)
        pg.screenshot(path=shot)
    b.close()
