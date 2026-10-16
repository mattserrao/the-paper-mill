"""What does each part of the picture cost? A/B experiments on one loaded page (phone emulation, normal play):
apply a change, measure GPU ms (read-back wait), submission ms, draws and triangles per frame, revert.
Usage: python3 gpuexp.py <index.html> [--engine=chromium|webkit] [--secs=8] [--dpr=1.25] [--half]
The baseline is measured first and again at the end (drift). GPU ms is the emulated GPU's; compare the savings between
rows, not the absolute ms. --half runs every variant at half the pixel ratio too (fragment-side vs vertex-side)."""
import json, sys, pathlib
from playwright.sync_api import sync_playwright
import pmbench as PB
args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:] if a.startswith("--")}
html = PB.load_html(args[0]); eng = flags.get("--engine", "chromium"); SECS = float(flags.get("--secs", 8)); DPR = float(flags.get("--dpr", 1.25))

HIDE = "(pred)=>{const S=__PM.G3.scene,L=window.__hid=window.__hid||[];S.traverse(o=>{if(pred(o)&&o.layers.mask!==(1<<30)){L.push([o,o.layers.mask]);o.layers.set(30);}});return L.length;}"
SHOW = "()=>{(window.__hid||[]).forEach(([o,m])=>{o.layers.mask=m;});window.__hid=[];}"
MATS = "()=>{__PM.G3.scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);});}"
V = [
 ("baseline", "()=>{}", "()=>{}"),
 ("shadows off (no pass, no sampling)", "()=>{const R=__PM.G3.renderer;R.shadowMap.enabled=false;(" + MATS + ")();}", "()=>{const R=__PM.G3.renderer;R.shadowMap.enabled=true;R.shadowMap.needsUpdate=true;(" + MATS + ")();}"),
 ("no tone mapping", "()=>{const R=__PM.G3.renderer;window.__tm=R.toneMapping;R.toneMapping=__PM.THREE.NoToneMapping;(" + MATS + ")();}", "()=>{const R=__PM.G3.renderer;R.toneMapping=window.__tm;(" + MATS + ")();}"),
 ("edge outlines hidden (lines)", "()=>(" + HIDE + ")(o=>o.isLine)", SHOW),
 ("static batches hidden (BatchedMesh + baked)", "()=>(" + HIDE + ")(o=>o.isBatchedMesh||(o.userData&&o.userData.smBatch&&!o.isLine))", SHOW),
 ("instanced meshes hidden (bales, rolls, ...)", "()=>(" + HIDE + ")(o=>o.isInstancedMesh)", SHOW),
 ("transparent meshes hidden", "()=>(" + HIDE + ")(o=>o.material&&!o.isLine&&(Array.isArray(o.material)?o.material:[o.material]).some(m=>m.transparent||m.opacity<1))", SHOW),
 ("sprites + points hidden (particles)", "()=>(" + HIDE + ")(o=>o.isSprite||o.isPoints)", SHOW),
 ("multi-material meshes hidden", "()=>(" + HIDE + ")(o=>o.isMesh&&Array.isArray(o.material))", SHOW),
 ("plain single meshes hidden (not batched, not instanced)", "()=>(" + HIDE + ")(o=>o.isMesh&&!o.isInstancedMesh&&!o.isBatchedMesh&&!Array.isArray(o.material)&&!(o.userData&&o.userData.smBatch)&&o.layers.mask===1)", SHOW),
 ("sky hidden", "()=>(" + HIDE + ")(o=>o.material&&o.material.isShaderMaterial&&o.geometry&&o.geometry.boundingSphere&&o.geometry.boundingSphere.radius>300)", SHOW),
 ("everything hidden (empty frame: pass overhead)", "()=>(" + HIDE + ")(o=>o!==__PM.G3.scene&&(o.isMesh||o.isLine||o.isSprite||o.isPoints))", SHOW),
 ("baseline again", "()=>{}", "()=>{}"),
]
with sync_playwright() as pw:
    b = PB.launch(pw, eng); ctx = PB.phone_context(b, DPR); pg = ctx.new_page(); errs = []
    PB.start_game(pg, html, errs=errs)
    hz = pg.evaluate("()=>__PM.G3.shadowHz"); pg.evaluate("(n)=>{__PM.G3.shadowHz=0;__F.shEvery=n;}", max(1, round(60 / (hz or 15))))
    pg.wait_for_timeout(5000)
    pr = pg.evaluate("()=>__PM.G3.renderer.getPixelRatio()")
    rows = []
    for name, on, off in V:
        n = pg.evaluate(on); r = PB.phase(pg, 2000, int(SECS * 1000))
        row = {"variant": name, "hidden": n if isinstance(n, int) else None, "gpu_ms": r["gpu_ms"], "submit_ms": r["submit_ms"], "draws": r["draws_main"], "draws_shadow": r["draws_shadow"], "tris_k": r["tris_k"], "programs": r["programs"]}
        if "--half" in flags:
            pg.evaluate("(p)=>__F.setPr(p)", pr / 2); h = PB.phase(pg, 1500, int(SECS * 1000)); pg.evaluate("(p)=>__F.setPr(p)", pr)
            row["gpu_half_ms"] = h["gpu_ms"]; row["fragment_ms"] = round(max(0, (r["gpu_ms"] - h["gpu_ms"]) / 0.75), 1); row["vertex_ms"] = round(r["gpu_ms"] - row["fragment_ms"], 1)
        pg.evaluate(off); rows.append(row)
        base = rows[0]
        print(f"{name:58s} gpu {row['gpu_ms']:7.1f} ({row['gpu_ms'] - base['gpu_ms']:+7.1f})  submit {row['submit_ms']:5.1f} ({row['submit_ms'] - base['submit_ms']:+5.1f})  draws {row['draws']:4d} ({row['draws'] - base['draws']:+4d})  tris {row['tris_k']:4d}k ({row['tris_k'] - base['tris_k']:+4d})"
              + (f"  frag {row['fragment_ms']:6.1f} vert {row['vertex_ms']:6.1f}" if "--half" in flags else "") + (f"  [{n} objects]" if isinstance(n, int) else ""), flush=True)
    print("errors", errs[:3]); b.close()
    pathlib.Path(PB.HERE / "gpuexp.json").write_text(json.dumps(rows, indent=1))
