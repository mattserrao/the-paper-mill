"""Item 11: the power house and the wastewater plant (game coords).
Power house: the walls the fixed camera sees (west x0 and south z1) become one baked facade each (windows, louvres, roller
door, sign, ink edges: drawn in the game as a canvas texture, 21-3d-plant.js); this kit adds the parts round it: the roof
parapet, the safety-valve vents and roof fans, a caged ladder, the stack's emissions-test platform and the forced-draft fan.
Wastewater: kits relative to the clarifier centre (CL) and the aeration basin centre (AB), built into a group in the game so
the mirrored layouts (LAYOUT.wx) still work."""
import math
from design import Kit
# ---------------- power house: x 70..82, z -16..-4, h 9; stack at (79, -6.5), r 1.2..1.6, 34 tall ----------------
PH = Kit()
x0, x1, z0, z1, h = 70.0, 82.0, -16.0, -4.0, 9.0
PH.box(x1 - x0 + 0.5, 0.5, 0.25, "ink", (x0 + x1) / 2, h + 0.45, z1 + 0.1)          # parapet capping, the two seen sides
PH.box(0.25, 0.5, z1 - z0 + 0.5, "ink", x0 - 0.1, h + 0.45, (z0 + z1) / 2)
for xs in (72.5, 75.5): PH.cyly(0.12, 4.0, "steel", xs, h + 2.6, -11.2, seg=8); PH.cyly(0.2, 0.4, "steel", xs, h + 4.5, -11.2, seg=8)   # safety-valve vents off the drum
for xs, zs in ((72.0, -6.0), (76.0, -6.0)): PH.cyly(0.7, 0.55, "metal", xs, h + 0.6, zs, seg=12); PH.cyly(0.8, 0.08, "ink", xs, h + 0.92, zs, seg=12)   # roof exhaust fans
PH.box(1.2, 0.3, 1.2, "frame", 80.5, h + 0.55, -14.5)                                 # roof hatch
# caged ladder up the south face, by the west corner
LX = 71.2
for dx in (-0.25, 0.25): PH.box(0.06, h + 1.1, 0.06, "warn", LX + dx, (h + 1.1) / 2, z1 + 0.35)
y = 0.4
while y < h + 0.8: PH.box(0.5, 0.05, 0.05, "warn", LX, y, z1 + 0.35); y += 0.4
for yy in range(3, 10, 2): PH.box(0.75, 0.06, 0.06, "warn", LX, yy, z1 + 0.75)
for dx in (-0.37, 0.37): PH.box(0.05, h - 2.4, 0.05, "warn", LX + dx, 2.4 + (h - 2.4) / 2, z1 + 0.6)
# the stack: a collar where it leaves the roof and the emissions-test (CEMS) platform two thirds up, with its rail
SX, SZ = 79.0, -6.5
PH.cyly(1.85, 0.6, "frame", SX, h + 0.5, SZ, seg=16)
PH.cyly(2.5, 0.12, "steel", SX, 24.0, SZ, seg=16)
for k in range(10):
    a = k / 10 * math.tau; PH.box(0.06, 1.0, 0.06, "warn", SX + math.cos(a) * 2.4, 24.5, SZ + math.sin(a) * 2.4)
    PH.box(1.55, 0.06, 0.06, "warn", SX + math.cos(a + math.pi / 10) * 2.36, 25.0, SZ + math.sin(a + math.pi / 10) * 2.36, ry=-(a + math.pi / 10) - math.pi / 2)
PH.box(0.5, 0.4, 0.5, "ok", SX - 1.2, 24.4, SZ + 1.6)                                  # the analyser box
for k in range(4): PH.box(0.06, 0.06, 0.6, "warn", SX - 1.62, 12 + k * 3, SZ)     # ladder rungs up the stack face (sparse)
PH.box(0.06, 15, 0.06, "warn", SX - 1.62, 16.5, SZ - 0.25); PH.box(0.06, 15, 0.06, "warn", SX - 1.62, 16.5, SZ + 0.25)
# forced-draft fan on a pad by the south wall: inlet box, scroll housing, motor
PH.box(3.2, 0.2, 2.0, "slab", 79.0, 0.1, z1 + 1.4)
PH.box(1.2, 1.6, 1.2, "metal", 78.0, 1.0, z1 + 1.4); PH.box(1.0, 0.9, 0.08, "ink", 78.0, 1.1, z1 + 2.04)
PH.cylz(0.9, 0.7, "steel", 79.6, 1.1, z1 + 1.4, seg=14)
PH.box(0.8, 0.6, 0.6, "stock", 80.5, 0.6, z1 + 1.4); PH.box(0.5, 1.2, 0.5, "steel", 79.6, 2.4, z1 + 0.6)   # motor; duct into the wall
print("power house", len(PH.P), "prims ~", PH.tris(), "tris")

# ---------------- clarifier (r 7, wall 2.2 high, centre well r 1 to y 2.5), relative to its centre ----------------
CL = Kit(); r = 7.0
n = 28
for k in range(n):                                                                    # effluent launder: a trough inside the wall
    a = (k + 0.5) / n * math.tau; L = 2 * (r - 0.55) * math.sin(math.pi / n) + 0.05
    CL.box(L, 0.3, 0.45, "steel", math.cos(a) * (r - 0.55), 1.95, math.sin(a) * (r - 0.55), ry=-a - math.pi / 2)
CL.box(2.4, 0.3, 2.4, "steel", 0, 2.65, 0)                                            # centre drive platform
CL.box(0.9, 0.7, 0.9, "stock", 0, 3.15, 0); CL.box(0.5, 0.4, 0.5, "ink", 0, 3.7, 0)  # drive gearbox, motor
for sx in (-1.15, 1.15):
    for sz in (-1.15, 1.15): CL.box(0.05, 0.9, 0.05, "warn", sx, 3.2, sz)
for s in (-1.15, 1.15): CL.box(2.35, 0.05, 0.05, "warn", 0, 3.6, s); CL.box(0.05, 0.05, 2.35, "warn", s, 3.6, 0)
# the effluent box at the launder outlet and the access stair up the outside of the wall (on the -z side, away from the camera's side)
CL.box(1.2, 1.6, 1.0, "metal", 0, 0.8, -r - 0.5)
for k in range(6): CL.box(0.9, 0.08, 0.32, "warn", r + 0.6, 0.37 * (k + 1), 2.4 - k * 0.32 - 1.0)
CL.box(0.06, 1.0, 2.2, "warn", r + 1.05, 1.7, 0.8)
print("clarifier", len(CL.P), "prims ~", CL.tris(), "tris")

# ---------------- aeration basin (20 x 12, walls 1.3 high, water at 1.0), relative to its centre ----------------
AB = Kit(); W, D = 20.0, 12.0
AERO = [(-5, -2), (5, -2), (-5, 2), (5, 2)]          # the game's aerators (WX(27/37), z -42/-38), relative
for ax, az in AERO:
    AB.cyly(1.5, 0.04, "white", ax, 1.03, az, seg=16)                                  # the churned water
    for k in range(3):
        a = k / 3 * math.tau + 0.5; AB.cylx(0.18, 1.3, "warn", ax + math.cos(a) * 1.0, 1.1, az + math.sin(a) * 1.0, seg=8)   # pontoons
    AB.cyly(0.35, 0.6, "stock", ax, 1.65, az, seg=10); AB.cyly(0.2, 0.1, "ink", ax, 2.0, az, seg=8)                      # motor
# catwalk along the camera-side wall (+z) with a rail, and cable runs to each aerator
AB.box(W, 0.06, 1.0, "metal", 0, 1.33, D / 2 + 0.25)
x = -W / 2 + 0.2
while x <= W / 2: AB.box(0.05, 1.0, 0.05, "warn", x, 1.85, D / 2 + 0.72); x += 2.5
AB.box(W, 0.05, 0.05, "warn", 0, 2.35, D / 2 + 0.72); AB.box(W, 0.05, 0.05, "warn", 0, 1.85, D / 2 + 0.72)
# motor control kiosk and the return-sludge pump at the east end
AB.box(2.2, 0.15, 1.6, "slab", W / 2 - 1.5, 0.08, D / 2 + 2.3)
AB.box(1.8, 1.9, 0.9, "frame", W / 2 - 1.5, 1.05, D / 2 + 2.3); AB.box(1.9, 0.08, 1.1, "ink", W / 2 - 1.5, 2.04, D / 2 + 2.3)
AB.box(0.04, 1.5, 0.75, "ink", W / 2 - 1.5, 1.0, D / 2 + 2.76, ry=math.pi / 2)
AB.box(0.9, 0.5, 0.6, "brand", W / 2 - 4.0, 0.4, D / 2 + 2.2); AB.box(0.55, 0.45, 0.45, "ink", W / 2 - 3.3, 0.4, D / 2 + 2.2)
print("basin", len(AB.P), "prims ~", AB.tris(), "tris")
