"""Item 5: baked dryer-hood cutaway (game coords). A closed hood is drawn as an architectural cutaway that never changes:
full back (drive-side) wall, the back half of the roof, stepped end walls and a low tending-side skirt, with the cut edges
inked dark, so the cans stay in view from the fixed iso camera. Fits under the crossover bridge (y 8.8) and inside the
tending-side catwalk (z 12.75)."""
from design import Kit
zc, CD = 9.1, 6.4
K = Kit()
X0, X1 = -5.0, 29.0; L = X1 - X0; XC = (X0 + X1) / 2
ZD, ZT = 5.05, 12.55          # hood walls (frame posts at 5.9 / 12.3 stay inside)
H, ZR = 8.0, 8.6              # roof height; the roof is cut at z ZR (back part kept)
SK = 1.2                      # tending-side skirt height
T = 0.14
# back wall + panel seams (on the inside face, seen through the cut) and a plinth
K.box(L, H, T, "metal", XC, H / 2, ZD, tag="hoodwall")
x = X0 + 2.0
while x < X1 - 0.5: K.box(0.07, H - 0.3, 0.03, "frame", x, H / 2, ZD + T / 2 + 0.015); x += 2.0
K.box(L, 0.35, T + 0.06, "frame", XC, 0.175, ZD)
# roof: the back part, panel seams across it, a dark cut edge along the front
K.box(L + 0.2, 0.18, ZR - ZD + T, "metal", XC, H + 0.09, (ZD + ZR) / 2, tag="hoodroof")
x = X0 + 2.0
while x < X1 - 0.5: K.box(0.07, 0.03, ZR - ZD, "frame", x, H + 0.195, (ZD + ZR) / 2); x += 2.0
K.box(L + 0.2, 0.22, 0.1, "ink", XC, H + 0.09, ZR + 0.02, tag="cut")
# stepped end walls: full height behind the roof cut, then a low step to the skirt
for xe, s in ((X0, -1), (X1, 1)):
    K.box(T, H, ZR - ZD, "metal", xe, H / 2, (ZD + ZR) / 2)
    K.box(T, 3.6, ZT - ZR, "metal", xe, 1.8, (ZR + ZT) / 2)
    K.box(T + 0.04, 0.1, ZT - ZR, "ink", xe, 3.6, (ZR + ZT) / 2, tag="cut")             # cut edges
    K.box(T + 0.04, H - 3.6, 0.1, "ink", xe, (H + 3.6) / 2, ZR, tag="cut")
# the sheet slot in the wet end wall, and a door in the dry end wall
K.box(T + 0.02, 0.5, CD + 0.2, "ink", X1 + 0.01, 3.9, zc)
K.box(T + 0.02, 2.2, 1.2, "frame", X0 - 0.01, 1.1, (ZD + ZR) / 2)
# tending-side skirt with its cut edge and access-door frames
K.box(L, SK, T, "metal", XC, SK / 2, ZT)
K.box(L, 0.1, T + 0.04, "ink", XC, SK, ZT, tag="cut")
for xd in (1.0, 13.0, 25.0): K.box(1.4, 0.06, 0.04, "frame", xd, SK - 0.2, ZT + T / 2 + 0.02)
# exhaust stacks and supply-air duct on the roof, a dew-point sensor box
for xs in (4.0, 20.0):
    K.cyly(0.6, 0.9, "metal", xs, H + 0.63, 6.6, seg=12); K.cyly(0.7, 0.12, "ink", xs, H + 1.1, 6.6, seg=12)
K.box(10.0, 0.42, 0.8, "frame", 12.0, H + 0.39, 6.0)
K.box(0.5, 0.4, 0.2, "ok", 10.0, 5.6, ZD + 0.17)
print(len(K.P), "prims ~", K.tris(), "tris")
# ---- context only (not exported): the cans and the hood frame, for the Blender review ----
CTX = Kit()
for i in range(10):
    CTX.cylz(1.3, CD, "paper", (872 - i * 32 - 600) / 10, 5.4, zc, seg=16); CTX.cylz(1.3, CD, "paper", (856 - i * 32 - 600) / 10, 2.4, zc, seg=16)
for z in (zc - CD / 2 - 0.6, zc + CD / 2 + 0.6):
    for xx in range(-6, 31, 6): CTX.box(0.35, 7.4, 0.35, "frame", xx, 3.7, z)
    CTX.box(37, 0.35, 0.35, "frame", 12, 7.4, z)
CTX.box(31.5, 0.1, 1.1, "metal", 12.75, 4.2, 13.3)          # tending-side catwalk
CTX.box(1.0, 0.1, 8.75, "metal", 14, 8.8, 8.4)              # crossover bridge
