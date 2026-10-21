# Paper Mill <-> Blender helpers (lives in ~/Documents/paper-mill-blender/pmtools.py)
# game coords (three.js, Y up) -> Blender (Z up): (x, y, z) -> (x, -z, y)
import bpy, json, zlib, base64, math, mathutils
INK = (0.18, 0.12, 0.08)          # dark-brown ink
PAPER_BG = (0.80, 0.74, 0.62)      # construction-paper ground
def coll(name, clear=True):
    C = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if C.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(C)
    if clear:
        for o in list(C.objects): bpy.data.objects.remove(o)
    return C
def hex2rgb(h): return tuple(int(h[i:i+2], 16) / 255 for i in (1, 3, 5))
def srgb2lin(c): return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)
_mats = {}
def paper_mat(h, name=None):
    """Toon paper card: 3 flat shading bands + a faint paper grain. h = '#rrggbb' (sRGB, as the game's palette)."""
    key = name or "pc_" + h
    m = bpy.data.materials.get(key)
    if m: return m
    m = bpy.data.materials.new(key); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    for n in list(N): N.remove(n)
    col = srgb2lin(hex2rgb(h)) + (1,); m.diffuse_color = col
    out = N.new("ShaderNodeOutputMaterial"); dif = N.new("ShaderNodeBsdfDiffuse"); s2r = N.new("ShaderNodeShaderToRGB")
    ramp = N.new("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = "CONSTANT"
    e = ramp.color_ramp.elements; e[0].position = 0.0; e[0].color = (0.62, 0.62, 0.62, 1); e[1].position = 0.12; e[1].color = (0.82, 0.82, 0.82, 1)
    e3 = e.new(0.35); e3.color = (1, 1, 1, 1)
    noise = N.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 60; noise.inputs["Detail"].default_value = 6
    nr = N.new("ShaderNodeMapRange"); nr.inputs["To Min"].default_value = 0.93; nr.inputs["To Max"].default_value = 1.04
    mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 1
    mix2 = N.new("ShaderNodeMix"); mix2.data_type = "RGBA"; mix2.blend_type = "MULTIPLY"; mix2.inputs["Factor"].default_value = 1
    emi = N.new("ShaderNodeEmission")
    L.new(dif.outputs[0], s2r.inputs[0]); L.new(s2r.outputs[0], ramp.inputs[0])
    L.new(noise.outputs["Fac"], nr.inputs["Value"])
    mix.inputs[6].default_value = col; L.new(ramp.outputs[0], mix.inputs[7])
    L.new(mix.outputs[2], mix2.inputs[6]); L.new(nr.outputs[0], mix2.inputs[7])
    L.new(mix2.outputs[2], emi.inputs[0]); L.new(emi.outputs[0], out.inputs[0])
    _mats[key] = m; return m
def import_b85(name, data, style=True):
    objs = json.loads(zlib.decompress(base64.b85decode(data)))
    C = coll(name)
    for i, o in enumerate(objs):
        P = o["P"]; V = [(P[k], -P[k+2], P[k+1]) for k in range(0, len(P), 3)]; F = [tuple(o["F"][k:k+3]) for k in range(0, len(o["F"]) - 2, 3)]
        me = bpy.data.meshes.new(o["n"]); me.from_pydata(V, [], F); me.validate(); me.update()
        ob = bpy.data.objects.new("%03d_%s" % (i, o["n"]), me); ob.data.materials.append(paper_mat(o["c"])); C.objects.link(ob)
    return C
def iso_camera(target, ortho=12.0, name="IsoCam"):
    """The game's fixed view: from the south-west at 45 deg, true-isometric elevation. target in GAME coords."""
    tx, ty, tz = target; t = mathutils.Vector((tx, -tz, ty))
    d = mathutils.Vector((-1, -1, 1)).normalized()
    cam = bpy.data.objects.get(name)
    if not cam:
        cam = bpy.data.objects.new(name, bpy.data.cameras.new(name)); bpy.context.scene.collection.objects.link(cam)
    cam.data.type = "ORTHO"; cam.data.ortho_scale = ortho; cam.data.clip_end = 1000
    cam.location = t + d * 200; cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam; return cam
def paper_look(res=(1280, 800)):
    """Item 2: the paper cut-out render look: flat toon bands, paper grain, bold ink outline + lighter fold lines."""
    sc = bpy.context.scene; sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    w = sc.world or bpy.data.worlds.new("World"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get("Background"); bg.inputs[0].default_value = srgb2lin(PAPER_BG) + (1,); bg.inputs[1].default_value = 1
    sun = bpy.data.objects.get("PaperSun")
    if not sun:
        sun = bpy.data.objects.new("PaperSun", bpy.data.lights.new("PaperSun", "SUN")); sc.collection.objects.link(sun)
    sun.data.energy = 4; sun.rotation_euler = (math.radians(40), math.radians(-25), math.radians(-35))
    for n in ("Light",):
        o = bpy.data.objects.get(n)
        if o: o.hide_render = o.hide_viewport = True
    sc.render.use_freestyle = True; sc.render.line_thickness_mode = "ABSOLUTE"; sc.render.line_thickness = 1.0
    vl = sc.view_layers[0]; fs = vl.freestyle_settings; fs.crease_angle = math.radians(140)
    for ls in list(fs.linesets): fs.linesets.remove(ls)
    def lineset(nm, sil, crease, col, th, alpha):
        ls = fs.linesets.new(nm); ls.select_by_visibility = True; ls.visibility = "VISIBLE"
        ls.select_by_edge_types = True
        for k in ("select_silhouette", "select_border", "select_crease", "select_contour", "select_external_contour", "select_material_boundary"): setattr(ls, k, False)
        ls.select_silhouette = sil; ls.select_border = sil; ls.select_external_contour = sil; ls.select_contour = sil
        ls.select_crease = crease
        st = ls.linestyle; st.color = col; st.thickness = th; st.alpha = alpha; st.caps = "ROUND"
        for m in list(st.geometry_modifiers): st.geometry_modifiers.remove(m)
        st.geometry_modifiers.new("wob", "PERLIN_NOISE_1D").amplitude = th * 0.35   # hand-drawn wobble
        st.geometry_modifiers["wob"].frequency = 18
        st.chaining = "PLAIN"; st.use_chaining = True
        return ls
    lineset("ink_outline", True, False, INK, 2.6, 1.0)
    lineset("fold_lines", False, True, (0.36, 0.27, 0.19), 1.1, 0.75)
def export_prims(collname, origin=(0, 0, 0)):
    """Blender boxes/cylinders -> game-code calls. Objects named 'box:<mat>' (a scaled cube) or 'cylZ:<mat>' (a cylinder
    whose axis is the game's z). Prints box(w,h,d,M.mat,x,y,z) / cylZ(r,len,M.mat,x,y,z,seg) in GAME coords."""
    ox, oy, oz = origin; out = []
    for o in sorted(bpy.data.collections[collname].all_objects, key=lambda o: o.name):
        if ":" not in o.name: continue
        kind, mt = o.name.split(":")[0], o.name.split(":")[1].split(".")[0]
        loc = o.matrix_world.translation; gx, gy, gz = loc.x - ox, loc.z - oy, -loc.y - oz
        d = o.dimensions; rz = o.rotation_euler
        if kind == "box": s = "box(%.3g,%.3g,%.3g,M.%s,%.4g,%.4g,%.4g)" % (d.x, d.z, d.y, mt, gx, gy, gz)
        elif kind == "cylZ": s = "cylZ(%.3g,%.3g,M.%s,%.4g,%.4g,%.4g,%d)" % (d.x / 2, d.y, mt, gx, gy, gz, o.get("seg", 16))
        else: continue
        if abs(rz.y) > 1e-4: s += "  /* rot.z %.4f */" % (-rz.y)
        out.append(s)
    print("\n".join(out)); return out
