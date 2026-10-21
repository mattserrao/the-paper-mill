"""Item 13: fork-trucks, clamp trucks and the tractor-trailers (local coords, +x forward). Shapes that read at cut-out size:
on the lifts an LPG bottle across the counterweight, a rounded counterweight, bigger drive wheels, the mast cross-heads
and a hydraulic cylinder, steps; on the trucks trailer side skirts, red/white conspicuity tape, cab roof marker lights
and a sun visor."""
from design import Kit
LIFT = Kit()
LIFT.cylz(0.3, 0.86, "ink", -0.62, 0.62, 0, seg=14)                                  # rounded counterweight (back face)
LIFT.cylz(0.17, 0.62, "white", -0.74, 1.1, 0, seg=12); LIFT.cyly(0.05, 0.12, "ink", -0.74, 1.3, 0.2, seg=6)   # LPG bottle + valve
for z in (-0.25, 0.25): LIFT.box(0.36, 0.05, 0.06, "frame", -0.74, 0.95, z)            # its cradle
for x in (0.35,):
    for z in (-0.45, 0.45): LIFT.cylz(0.28, 0.2, "ink", x, 0.28, z, seg=14); LIFT.cylz(0.13, 0.22, "steel", x, 0.28, z * 1.03, seg=8)   # drive wheels
for y in (0.55, 1.35, 1.85): LIFT.box(0.08, 0.08, 0.64, "ink", 0.66, y, 0)          # mast cross-heads
LIFT.box(0.1, 1.2, 0.1, "steel", 0.6, 0.95, 0)                                       # lift cylinder
for z in (-0.46, 0.46): LIFT.box(0.3, 0.05, 0.14, "frame", -0.05, 0.34, z)           # steps
LIFT.box(0.04, 0.5, 0.5, "glass", 0.29, 1.62, 0)                                     # front guard screen (dark)
print("lift", len(LIFT.P), "prims ~", LIFT.tris(), "tris")
TRK = Kit()     # added to every box trailer (the trailer is x -3.05 .. 0.95, sides at z +-0.92) and the tractor
for z in (-0.93, 0.93):
    TRK.box(1.8, 0.42, 0.04, "frame", -0.95, 0.56, z * 0.97)                        # side skirt between the landing gear and the bogie
    for k in range(10): TRK.box(0.2, 0.05, 0.02, "bad" if k % 2 == 0 else "white", -2.95 + k * 0.4 + 0.1, 0.98, z * 1.012)   # conspicuity tape
for z in (-0.5, 0, 0.5): TRK.box(0.08, 0.06, 0.1, "lane", 2.82, 2.36, z)               # cab roof marker lights
TRK.box(0.22, 0.05, 1.7, "ink", 2.92, 2.26, 0)                                       # sun visor
print("truck", len(TRK.P), "prims ~", TRK.tris(), "tris")
CTX = Kit()      # the existing lift, for the review
CTX.box(1.15, 0.62, 0.85, "warn", 0, 0.55, 0); CTX.box(0.3, 0.55, 0.82, "ink", -0.62, 0.62, 0)
for x, z in ((-0.45, -0.36), (-0.45, 0.36), (0.3, -0.36), (0.3, 0.36)): CTX.box(0.07, 1.0, 0.07, "ink", x, 1.4, z)
CTX.box(0.85, 0.07, 0.8, "ink", -0.07, 1.92, 0); CTX.box(0.08, 1.8, 0.08, "ink", 0.66, 1.0, -0.28); CTX.box(0.08, 1.8, 0.08, "ink", 0.66, 1.0, 0.28)
CTX.box(0.75, 0.06, 0.12, "ink", 1.02, 0.22, -0.2); CTX.box(0.75, 0.06, 0.12, "ink", 1.02, 0.22, 0.2); CTX.box(0.72, 0.62, 0.72, "kraft", 1.02, 0.58, 0)
CTX.box(0.3, 0.36, 0.3, "bad", -0.12, 1.3, 0)
for x, z in ((-0.35, -0.42), (-0.35, 0.42)): CTX.cylz(0.2, 0.16, "ink", x, 0.2, z, seg=12)
