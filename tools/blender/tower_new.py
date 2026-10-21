"""Item 15: the water tower as the mill's hero landmark (game coords). The tank wall with the mill name, its bottom cone,
the roof cone, the balcony and its rail stay as they are in 39b (the name band is a texture); this replaces the legs,
bracing, riser and ladder and adds the footings, a frost box round the riser, the overflow pipe, a caged ladder on the
camera-side leg, and the roof's finial, vent, hatch and ladder."""
import math
from design import Kit
TX, TZ, H, R = 84.0, -24.0, 21.0, 4.3
K = Kit()
B0, B1 = 3.7, 3.0          # leg spread at the footing and under the balcony (the legs batter in)
lean = math.atan((B0 - B1) / H); BM = (B0 + B1) / 2
LEGS = [(-1, -1), (1, -1), (-1, 1), (1, 1)]
for a, b in LEGS:
    K.box(0.5, H + 0.2, 0.5, "steel", TX + a * BM, H / 2, TZ + b * BM, rx=-b * lean, rz=a * lean, tag="leg")
    K.box(1.3, 0.7, 1.3, "slab", TX + a * B0, 0.35, TZ + b * B0)                   # concrete pier
    K.box(0.8, 0.12, 0.8, "ink", TX + a * B0, 0.76, TZ + b * B0)                    # base plate
# balcony girder ring under the tank, and two struts rings, the faces' tension-rod X bracing between them
def spread(y): return B0 - (B0 - B1) * y / H
for y in (7.0, 14.0, H - 0.4):
    s = spread(y)
    for sgn in (-1, 1):
        K.box(2 * s, 0.2, 0.2, "steel", TX, y, TZ + sgn * s); K.box(0.2, 0.2, 2 * s, "steel", TX + sgn * s, y, TZ)
for y0, y1 in ((0.8, 7.0), (7.0, 14.0), (14.0, H - 0.4)):
    s = spread((y0 + y1) / 2); L = math.hypot(2 * s, y1 - y0); ang = math.atan2(y1 - y0, 2 * s)
    for sgn in (-1, 1):
        for d in (-1, 1):
            K.box(L, 0.07, 0.07, "ink", TX, (y0 + y1) / 2, TZ + sgn * s, rz=d * ang)
            K.box(0.07, 0.07, L, "ink", TX + sgn * s, (y0 + y1) / 2, TZ, rx=-d * ang)
# the riser: wider, with a frost box (a small insulated house) at its foot and a manhole flange
K.cyly(0.75, H - 0.8, "steel", TX, H / 2 + 0.6, TZ, seg=14)
for y in (5.0, 11.0, 17.0): K.cyly(0.82, 0.18, "frame", TX, y, TZ, seg=14)
K.box(2.6, 2.6, 2.6, "white", TX, 1.3, TZ); K.box(2.9, 0.25, 2.9, "brand", TX, 2.72, TZ); K.box(0.9, 1.9, 0.05, "frame", TX - 0.6, 0.95, TZ + 1.31)
# the overflow pipe down the north-east leg to a splash pad
K.cyly(0.16, H - 1.2, "steel", TX + 2.8, (H - 1.2) / 2 + 0.5, TZ - 2.6, seg=8); K.box(1.2, 0.1, 1.2, "slab", TX + 2.8, 0.05, TZ - 2.6)
# caged ladder up the camera-side leg (-x, +z), from 2.4 m to the balcony
LX, LZ = TX - B1 - 0.35, TZ + B1 + 0.35
for dx in (-0.25, 0.25): K.box(0.05, H - 0.4, 0.05, "warn", LX + dx * 0.7, (H - 0.4) / 2, LZ + dx * 0.7)
y = 0.6
while y < H: K.box(0.5, 0.05, 0.05, "warn", LX, y, LZ, ry=math.pi / 4); y += 0.6
for y in range(4, int(H) + 1, 2):
    for d in (-1, 1): K.box(0.05, 0.05, 0.8, "warn", LX - 0.4 * 0.7 + d * 0.3, y, LZ + 0.4 * 0.7 + d * 0.3, ry=math.pi / 4)
    K.box(0.9, 0.05, 0.05, "warn", LX - 0.55, y, LZ + 0.55, ry=math.pi / 4)
# the roof: finial, vent, hatch and a ladder from the balcony up the wall and up the cone
RY = H + 6.4
K.cyly(0.35, 0.5, "steel", TX, RY + 2.55, TZ, seg=10); K.cyly(0.18, 0.5, "bad", TX, RY + 3.05, TZ, seg=8)
K.cyly(0.35, 0.6, "steel", TX + 1.3, RY + 1.0, TZ + 1.0, seg=8); K.cyly(0.5, 0.12, "ink", TX + 1.3, RY + 1.35, TZ + 1.0, seg=8)
K.box(0.9, 0.12, 0.9, "frame", TX - 1.3, RY + 1.05, TZ + 1.3, rx=-0.55, rz=0.0)
lx, lz = TX - (R + 0.1) * math.cos(math.pi / 4), TZ + (R + 0.1) * math.sin(math.pi / 4)
for y in [H + 0.6 + 0.5 * k for k in range(12)]: K.box(0.5, 0.05, 0.05, "ink", lx, y, lz, ry=math.pi / 4)
for d in (-1, 1): K.box(0.05, 6.4, 0.05, "ink", lx + d * 0.18, H + 3.4, lz + d * 0.18)
print(len(K.P), "prims ~", K.tris(), "tris")
CTX = Kit()      # the parts that stay (for the review)
CTX.cyly(R, 6.4, "white", TX, H + 3.2, TZ, seg=28); CTX.cyly(R, 1.6, "steel", TX, H - 0.8, TZ, seg=28, r2=2.2)
CTX.cyly(R + 0.35, 2.4, "brand", TX, H + 7.6, TZ, seg=28, r2=0.05); CTX.cyly(R + 0.55, 0.1, "steel", TX, H + 0.15, TZ, seg=28)
CTX.box(4, 0.8, 0.1, "brand", TX - 2.0, H + 3.2, TZ + R + 0.05)
