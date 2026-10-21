"""Winder update (after v6.11 items 1-15): a two-drum winder that reads as one (winder-local coords: +x toward the unwind,
y up, z across, frames at z +-2.75; the group sits at (-18.7, 0, zc)).
The web: unwind stand (brake = tension) -> guide roll on load cells -> bowed spreader roll -> slitter section (top knives over
bottom band knives: two edge trims and one centre slit, the sim's set of 2) -> down and over the rear drum into the nip ->
the set builds on the rear and front drums under the rider roll, which rides up on its guide columns as the set grows.
The unwind moved 2 m out (x 2.6 -> 4.6) and the pass line up (2.2 -> 3.3) so the winder operator can walk in under the web
between the unwind and the slitters to inspect the sheet.
STATIC holds the frames; the moving parts (unwind, drums, set, cores, rider roll and carriage, the web) are built in the
game (32-3d-winder.js) from the constants below; DYN is a mid-build proxy of them for the Blender review."""
import math
from design import Kit
UX, UY = 4.6, 2.4                 # unwind centre (parent roll r 0.35..2.0)
GX, GY, GR = 2.3, 3.35, 0.16      # guide roll on load cells
BX, BY, BR = 1.5, 3.3, 0.12       # bowed spreader roll
SLX, PASS = 0.6, 3.3              # slitter line and the pass line
RDX, FDX, DY, DR = -1.3, -2.4, 0.75, 0.5   # rear / front drum
SX = -1.85                        # set centre x
RIDR = 0.26                       # rider roll radius
ZF = 2.75
K = Kit()
for s in (-1, 1):
    z = s * ZF
    # unwind A-frame stand, bearing housing, and (drive side) the brake disc + caliper and the brake motor
    K.box(2.2, 0.12, 0.9, "ink", UX, 0.06, z)
    K.box(0.3, 2.3, 0.45, "steel", UX - 0.65, 1.15, z, rz=-0.208); K.box(0.3, 2.3, 0.45, "steel", UX + 0.65, 1.15, z, rz=0.208)
    K.box(0.7, 0.7, 0.55, "ink", UX, UY, z)
    # guide-roll and spreader brackets on short posts outside the web, the load cells (green) under the guide roll bearings
    K.box(0.22, GY - 0.1, 0.3, "steel", GX, (GY - 0.1) / 2, s * 2.0); K.box(0.36, 0.2, 0.36, "ok", GX, GY - 0.22, s * 2.0); K.box(0.3, 0.26, 0.3, "ink", GX, GY, s * 2.0)
    K.box(0.22, BY - 0.1, 0.3, "steel", BX, (BY - 0.1) / 2, s * 2.0); K.box(0.28, 0.24, 0.28, "ink", BX, BY, s * 2.0)
    # slitter section frames (raised): two posts and a top beam each side
    K.box(0.3, 4.05, 0.35, "steel", -0.15, 2.02, z); K.box(0.3, 4.05, 0.35, "steel", 1.2, 2.02, z); K.box(1.75, 0.3, 0.4, "steel", 0.52, 4.05, z)
    # drum side frames, drum bearings, rider guide columns, crosshead
    K.box(3.0, 1.45, 0.3, "steel", SX, 0.72, z)
    K.box(0.55, 0.55, 0.4, "ink", RDX, DY, z); K.box(0.55, 0.55, 0.4, "ink", FDX, DY, z)
    K.box(0.25, 3.8, 0.35, "steel", SX - 0.55, 1.9, z); K.box(0.25, 3.8, 0.35, "steel", SX + 0.55, 1.9, z)
    K.box(1.5, 0.35, 0.45, "steel", SX, 3.95, z)
    K.cyly(0.13, 1.0, "frame", SX, 3.5, z, seg=10)                                   # rider cylinder barrel (rod in game)
K.cylz(0.72, 0.12, "ink", UX, UY, -3.1, seg=16); K.box(0.5, 0.9, 0.3, "steel", UX, 1.95, -3.25)
# slitters: top knife beam with three knife holders (edge trims at +-1.45, the centre slit), the bottom band-knife roll under the web
K.box(0.4, 0.3, 5.9, "metal", SLX, 3.78, 0)
for zk in (-1.45, 0.0, 1.45): K.box(0.16, 0.4, 0.22, "ink", SLX, 3.48, zk); K.cylz(0.14, 0.03, "metal", SLX, PASS + 0.08, zk, seg=12)
K.cylz(0.17, 5.4, "metal", SLX, PASS - 0.17, 0, seg=12)
K.box(0.4, 0.22, 5.9, "metal", SLX, 2.75, 0)
# trim removal: an air nozzle under each edge just past the knives, its duct down to the floor and along to the trim fan (drive side)
for s in (-1, 1):
    K.box(0.3, 0.3, 0.3, "steel", SLX - 0.45, 2.7, s * 1.62); K.cyly(0.12, 2.5, "steel", SLX - 0.45, 1.3, s * 1.62, seg=8)
K.box(0.24, 0.24, 1.6, "steel", SLX - 0.45, 0.12, -2.42); K.box(0.24, 0.24, 3.24, "steel", SLX - 0.45, 0.12, 0)
K.box(1.0, 1.0, 0.9, "frame", SLX - 0.45, 0.5, -3.6); K.cylz(0.38, 0.12, "ink", SLX - 0.45, 0.6, -4.1, seg=12)
# drum drives (drive side), the ejector bar along the front drum, the operator's push-button pendant on the tending side
K.cylz(0.42, 0.9, "stock", SX, DY, -3.5, seg=14); K.box(0.9, 0.75, 0.9, "steel", SX, 0.37, -3.5)
K.box(0.12, 0.12, 5.0, "warn", FDX - 0.75, 1.15, 0); K.box(0.2, 0.5, 0.2, "ink", FDX - 0.75, 0.75, -2.45); K.box(0.2, 0.5, 0.2, "ink", FDX - 0.75, 0.75, 2.45)
K.box(0.35, 0.5, 0.2, "warn", -0.6, 1.4, 3.3); K.box(0.04, 1.4, 0.04, "ink", -0.6, 2.4, 3.3)
K.cylz(0.42, 0.9, "stock", UX + 0.9, 1.2, -3.4, seg=14)                               # the unwind's brake / regen motor (drive side)
print("static", len(K.P), "prims ~", K.tris(), "tris")

def set_centre_y(RR):
    return DY + math.sqrt(max(0.01, (DR + RR) ** 2 - ((RDX - FDX) / 2) ** 2))
# mid-build proxy for the review
DYN = Kit(); RU, RR = 1.4, 0.45; yc = set_centre_y(RR)
DYN.cylz(RU, 4.8, "paper", UX, UY, 0, seg=24)
for x in (RDX, FDX): DYN.cylz(DR, 5.0, "metal", x, DY, 0, seg=16)
for z in (0.725, -0.725): DYN.cylz(RR, 1.4, "kraft", SX, yc, z, seg=24); DYN.cylz(0.12, 1.43, "ink", SX, yc, z, seg=10)
ry = yc + RR + RIDR
DYN.cylz(RIDR, 3.1, "steel", SX, ry, 0, seg=14); DYN.box(0.5, 0.3, 5.9, "warn", SX, ry + 0.25, 0)
for s in (-1, 1): DYN.cyly(0.06, 3.3 - (ry + 0.4), "metal", SX, (3.3 + ry + 0.4) / 2 - 0.5 * 0, s * ZF, seg=6)
for x, y, r in ((GX, GY, GR), (BX, BY, BR)): DYN.cylz(r, 3.2, "metal", x, y, 0, seg=12)
DYN.box(UX - RU * 0.3 - GX, 0.02, 3.0, "white", (UX + GX) / 2 - 0.2, GY + 0.3, 0)        # the web (rough, review only)
DYN.box(GX - SLX, 0.02, 3.0, "white", (GX + SLX) / 2, PASS + 0.12, 0)
