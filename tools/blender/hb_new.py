"""Item 3: headbox redesign (game coords). Same footprint and slice-lip position as v6.10.1 (lip 55.0-55.33, y 3.13).
Chunky paper-card read: a stand you can see, a clear tapered header -> tube bank -> converging nozzle -> slice."""
from design import Kit
zc, CD = 9.1, 6.4
ZD, ZT = zc - CD / 2, zc + CD / 2           # drive side (back, -z), tending side (front, +z, faces the camera)
K = Kit()
# ---- stand: two side frames + cross beams, the body sits on them ----
for z in (ZD - 0.35, ZT + 0.35):
    K.box(4.0, 0.12, 0.7, "ink", 58.0, 0.06, z)                         # base plate
    for x in (56.5, 59.5): K.box(0.45, 0.85, 0.45, "frame", x, 0.55, z)  # legs
    K.box(3.9, 0.3, 0.55, "frame", 58.0, 1.05, z)                        # side beam
    for x in (56.5, 59.5): K.box(0.6, 0.12, 0.6, "metal", x, 1.26, z)    # jacking pads
for x in (56.5, 59.5): K.box(0.5, 0.35, CD + 1.2, "frame", x, 1.05, zc)  # cross beams
# ---- body: one extruded side profile, nozzle converging to the slice ----
prof = [[59.6, 1.2], [59.6, 3.35], [59.25, 3.7], [57.5, 3.7], [55.55, 3.22], [55.15, 3.12], [55.15, 2.98], [55.45, 2.95], [56.35, 2.45], [56.75, 1.2]]
K.ext(prof, CD, "frame", ZD, tag="body")
# side plates, proud and dark, with a bolt line along the nozzle
big = [[x + (0.06 if x > 59 else -0.02 if x < 55.6 else 0), y + (0.06 if y > 3.6 else -0.05 if y < 1.3 else 0)] for x, y in prof]
for z0 in (ZD - 0.14, ZT): K.ext(big, 0.14, "ink", z0, tag="sideplate")
for k in range(7):
    t = k / 6; x = 59.2 - t * (59.2 - 55.8); y = 3.62 - t * (3.62 - 3.2)
    K.cylz(0.05, 0.04, "metal", x, y - 0.18, ZT + 0.16, seg=6)
# tube bank: the block behind the body, with three flange ribs
K.box(0.5, 2.1, CD - 0.2, "metal", 59.85, 2.25, zc, tag="tubebank")
for y in (1.35, 2.25, 3.15): K.box(0.58, 0.1, CD - 0.1, "ink", 59.85, y, zc)
# ---- tapered inlet header: inlet on the drive side, recirculation out on the tending side ----
K.cylz(0.75, CD + 0.4, "frame", 60.75, 1.75, zc, seg=14, r2=0.38, tag="header")   # r at drive side end, r2 tending (three: radiusTop=+y -> see port)
K.cylz(0.95, 0.18, "ink", 60.75, 1.75, ZD - 0.32, seg=14)                     # inlet flange
# (the fan pump discharge already drops into the top of the header at the drive-side end, 25-3d-fog-fan.js)
K.cylz(0.48, 0.14, "ink", 60.75, 1.75, ZT + 0.48, seg=12)                     # recirc flange
K.pipe([[60.75, 1.75, ZT + 0.5], [60.75, 1.75, ZT + 1.1], [60.75, 0.4, ZT + 1.1]], 0.26, "stock", seg=10)
K.cylx(0.28, 0.06, "warn", 61.05, 1.75, ZT + 1.1, seg=10)                     # recirc valve handwheel
# header saddles onto the stand
for z in (ZD + 0.6, zc, ZT - 0.6): K.box(0.7, 0.55, 0.3, "frame", 60.6, 0.95, z)
# ---- slice: beam, actuators, lip, apron ----
import math
ang = math.atan2(3.7 - 3.22, 57.5 - 55.55)
K.box(2.0, 0.28, CD + 0.1, "metal", 56.55, 3.6, zc, rz=ang, tag="slicebeam")
for k in range(10):
    z = ZD + 0.45 + k * (CD - 0.9) / 9
    K.box(0.34, 0.5, 0.34, "ink", 56.25, 3.95, z, rz=ang)                     # spindle housing
    K.cyly(0.12, 0.35, "metal", 56.3, 4.35, z, seg=8)                         # motor cap
K.box(0.08, 0.08, CD, "warn", 56.25, 4.22, zc)                                # signal tray
K.box(0.42, 0.1, CD + 0.04, "metal", 55.33, 3.13, zc, tag="LIP")               # the moving slice lip (HB.lip)
K.box(0.55, 0.06, CD, "metal", 55.22, 2.93, zc, tag="apron")                   # lower lip / apron over the breast roll
# ---- top deck: grating, handrails, toe boards, ladder on the tending side ----
K.box(1.75, 0.06, CD + 0.5, "metal", 58.4, 3.76, zc)
for z in (ZD - 0.2, ZT + 0.2):
    for x in (57.6, 58.45, 59.3): K.box(0.06, 1.0, 0.06, "warn", x, 4.29, z)
    K.box(1.8, 0.06, 0.06, "warn", 58.45, 4.79, z); K.box(1.8, 0.06, 0.06, "warn", 58.45, 4.29, z)
    K.box(1.8, 0.14, 0.04, "warn", 58.45, 3.86, z)
for x in (59.55, 60.05): K.box(0.06, 3.9, 0.06, "warn", x, 1.95, ZT + 0.75)    # ladder rails
for k in range(9): K.box(0.5, 0.04, 0.05, "warn", 59.8, 0.4 + k * 0.42, ZT + 0.75)
# ---- brand stripe on the top edge, inspection hatches, local control station ----
K.box(0.16, 0.1, CD + 0.2, "brand", 59.45, 3.66, zc)
K.box(0.7, 0.5, 0.04, "ink", 58.75, 2.3, ZT + 0.16)                          # inspection hatch
K.box(1.1, 0.84, 0.08, "ink", 57.15, 2.95, ZT + 0.18, tag="LBframe"); K.box(1.0, 0.75, 0.02, "white", 57.15, 2.95, ZT + 0.23, tag="LBchart")   # L/B gauge (kept, canvas)
# (no local control station: the operator console already stands on the tending side here)
print(len(K.P), "prims ~", K.tris(), "tris")
