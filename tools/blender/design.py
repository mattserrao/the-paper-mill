"""Primitive design kit: one list of primitives (GAME coords: x along the machine, y up, z cross-machine, tending side +z)
-> Blender build code (for review renders) and -> game JS (box()/cylZ()/mesh calls) for the port."""
import json, zlib, base64, math
PAL = {"frame": "#646f86", "ink": "#1c2233", "metal": "#98a2b4", "warn": "#975f00", "brand": "#2e7d4f", "stock": "#3b7fa8",
       "ok": "#1a7b47", "bad": "#d6382c", "slab": "#f4f5f9", "wall": "#ffffff", "felt": "#6c7891", "wire": "#3d8f9c",
       "paper": "#b98d61", "kraft": "#b07a43", "glass": "#2b3346", "lane": "#f2b51d", "white": "#f4f2ec", "steel": "#646f86"}
class Kit:
    def __init__(s): s.P = []
    def box(s, w, h, d, m, x, y, z, rx=0, ry=0, rz=0, tag=None): s.P.append(dict(k="box", a=[w, h, d], m=m, p=[x, y, z], r=[rx, ry, rz], tag=tag)); return s
    def cylz(s, r, L, m, x, y, z, seg=16, r2=None, tag=None): s.P.append(dict(k="cyl", ax="z", a=[r, r if r2 is None else r2, L], seg=seg, m=m, p=[x, y, z], r=[0, 0, 0], tag=tag)); return s
    def cylx(s, r, L, m, x, y, z, seg=16, r2=None, tag=None): s.P.append(dict(k="cyl", ax="x", a=[r, r if r2 is None else r2, L], seg=seg, m=m, p=[x, y, z], r=[0, 0, 0], tag=tag)); return s
    def cyly(s, r, L, m, x, y, z, seg=16, r2=None, tag=None): s.P.append(dict(k="cyl", ax="y", a=[r, r if r2 is None else r2, L], seg=seg, m=m, p=[x, y, z], r=[0, 0, 0], tag=tag)); return s
    def ext(s, prof, depth, m, z0, tag=None): s.P.append(dict(k="ext", prof=prof, d=depth, m=m, z0=z0, tag=tag)); return s
    def pipe(s, pts, r, m, seg=10):
        n0 = len(s.P)
        for a, b in zip(pts, pts[1:]):
            d = [b[i] - a[i] for i in range(3)]; c = [(a[i] + b[i]) / 2 for i in range(3)]; L = math.sqrt(sum(v * v for v in d))
            ax = max(range(3), key=lambda i: abs(d[i]))
            [s.cylx, s.cyly, s.cylz][ax](r, L + r * 0.0, m, *c, seg=seg)
        for p in s.P[n0:]: p["skipjs"] = True
        s.P[n0]["js"] = "pipe(%s,%g,%s);" % (json.dumps([[round(v, 3) for v in q] for q in pts]), r, "@M:" + m)
        return s
    def to_js(s, MJ):
        """MJ: material token -> JS expression. Tags: 'LIP' -> HB.lip=..., tags listed in EDGE get edges()."""
        f = lambda v: ("%.3f" % v).rstrip("0").rstrip(".") if isinstance(v, float) else str(v)
        out = []
        for p in s.P:
            if p.get("js"): out.append(p["js"].replace("@M:" + p["m"], MJ[p["m"]])); continue
            if p.get("skipjs"): continue
            m = MJ[p["m"]]; t = p.get("tag")
            if p["k"] == "box":
                w, h, d = p["a"]; x, y, z = p["p"]; e = "box(%s,%s,%s,%s,%s,%s,%s,scene,false)" % (f(w), f(h), f(d), m, f(x), f(y), f(z))
                rx, ry, rz = p["r"]
                if t == "LIP": e = "HB.lip=" + e
                if rz or rx or ry: e = "{const o=%s;o.rotation.set(%s,%s,%s);}" % (e, f(rx), f(ry), f(rz))
                out.append(e + ";")
            elif p["k"] == "cyl":
                r1, r2, L = p["a"]; x, y, z = p["p"]
                if p["ax"] == "z" and r1 == r2: out.append("cylZ(%s,%s,%s,%s,%s,%s,%d);" % (f(r1), f(L), m, f(x), f(y), f(z), p["seg"]))
                else:
                    rot = {"z": "g.rotateX(Math.PI/2);", "x": "g.rotateZ(-Math.PI/2);", "y": ""}[p["ax"]]
                    # CylG(top,bottom): top is +y; after rotateX(PI/2) top is +z, after rotateZ(-PI/2) top is +x
                    out.append("{const g=new CylG(%s,%s,%s,%d);%sconst o=new THREE.Mesh(g,%s);o.position.set(%s,%s,%s);o.castShadow=true;scene.add(o);%s}" % (f(r2), f(r1), f(L), p["seg"], rot, m, f(x), f(y), f(z), "edges(o,undefined,30);" if t == "header" else ""))
            else:
                out.append("{const o=mk(%s,%s,%s,%s);edges(o,undefined,20);}" % (json.dumps(p["prof"]), f(p["d"]), m, f(p["z0"])))
        return out
    # ---------- Blender ----------
    def blender_code(s, coll, x0=0):
        z = base64.b85encode(zlib.compress(json.dumps({"P": s.P, "PAL": PAL}, separators=(",", ":")).encode(), 9)).decode()
        return BL_TMPL.replace("@COLL@", coll).replace("@DATA@", z)
    def tris(s):
        n = 0
        for p in s.P:
            if p["k"] == "box": n += 12
            elif p["k"] == "cyl": n += p["seg"] * 4
            else: n += len(p["prof"]) * 2 + (len(p["prof"]) - 2) * 2
        return n
BL_TMPL = r'''
import bpy, json, zlib, base64, math, bmesh, pmtools
D = json.loads(zlib.decompress(base64.b85decode(r"""@DATA@""")))
C = pmtools.coll("@COLL@")
G = lambda x, y, z: (x, -z, y)          # game -> Blender
for i, p in enumerate(D["P"]):
    m = pmtools.paper_mat(D["PAL"].get(p["m"], "#ff00ff"), "pk_" + p["m"])
    bm = bmesh.new()
    if p["k"] == "box":
        bmesh.ops.create_cube(bm, size=1); w, h, d = p["a"]
        for v in bm.verts: v.co.x *= w; v.co.y *= d; v.co.z *= h
    elif p["k"] == "cyl":
        r1, r2, L = p["a"]; bmesh.ops.create_cone(bm, cap_ends=True, segments=p["seg"], radius1=r1, radius2=r2, depth=L)
        # Blender cone axis = Blender z (game y). Re-aim: game z -> Blender -y ; game x -> Blender x
        if p["ax"] == "z": bmesh.ops.rotate(bm, verts=bm.verts, matrix=__import__("mathutils").Matrix.Rotation(math.pi / 2, 3, "X"))
        if p["ax"] == "x": bmesh.ops.rotate(bm, verts=bm.verts, matrix=__import__("mathutils").Matrix.Rotation(math.pi / 2, 3, "Y"))
    else:
        pts = p["prof"]; z0 = p["z0"]; d = p["d"]
        vb = [bm.verts.new(G(x, y, z0)) for x, y in pts]; vf = [bm.verts.new(G(x, y, z0 + d)) for x, y in pts]
        bm.faces.new(vb); bm.faces.new(vf[::-1]); n = len(pts)
        for k in range(n): bm.faces.new([vb[k], vb[(k + 1) % n], vf[(k + 1) % n], vf[k]])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("p%03d" % i); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new("%03d_%s_%s%s" % (i, p["k"], p["m"], ("_" + p["tag"]) if p.get("tag") else ""), me); me.materials.append(m)
    if p["k"] != "ext":
        import mathutils
        ob.location = G(*p["p"]); rx, ry, rz = p["r"]
        ob.rotation_euler = (mathutils.Matrix.Rotation(rx, 4, "X") @ mathutils.Matrix.Rotation(ry, 4, "Z") @ mathutils.Matrix.Rotation(-rz, 4, "Y")).to_euler()
    C.objects.link(ob)
print(len(D["P"]), "prims into @COLL@")
'''
