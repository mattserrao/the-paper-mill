"""v6.11.1 the dryer hood's front (game coords), reviewed in Blender and built in code in 25-3d-fog-fan.js.
Closes the v6.11 cutaway (hood_new.py) on the tending side: a fascia over the door opening, a fixed panel under the
crossover bridge (x 13.5-14.5), the front half of the roof, the upper end walls, door guides at every seam (the two beside
the bridge stop under its deck at 8.6), and a header with a drive shaft and gear motor along the top of the guides.
Six lifting doors hang from it on chains: up 4.6 m on a sheet break or with the machine down, and with the fiddly knob
(07b "hood") the doors and the front section then fly away like the roofs, 2 s after the doors are up.
Tags: 'front' flies away, 'door' lifts (and flies away with the front), 'chain' shortens as the doors lift.
The doors sit in front of the hood wall (z 12.62-12.70), inside the frame posts (z 12.72) and the catwalk (z 12.75)."""
from design import Kit
HX0, HX1, ZF, ZD0, ZD1, DY0, DY1, LIFTD, HDR = -5, 29, 12.55, 12.62, 12.70, 1.25, 6.15, 4.6, 10.95
SEAMS = [-5, 1.2, 7.4, 13.5, 14.5, 19.3, 24.1, 29]
DOORS = [[-4.92, 1.12], [1.28, 7.32], [7.48, 13.42], [14.58, 19.22], [19.38, 24.02], [24.18, 28.92]]
K = Kit()
def bx(m, x0, x1, y0, y1, z0, z1, tag):
    K.box(x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, tag=tag)
# ---- the fixed front ----
bx("metal", HX0, HX1, DY1 + 0.05, 8.0, ZF - 0.07, ZD0, "front")                 # fascia over the doors
bx("metal", 13.5, 14.5, 1.2, DY1 + 0.05, ZF - 0.07, ZD0, "front")               # fixed panel under the crossover bridge
bx("metal", HX0 - 0.1, HX1 + 0.1, 8.0, 8.18, 8.6, ZD0 + 0.02, "front")          # front half of the roof
bx("ink", HX0, HX1, DY1, DY1 + 0.1, ZF - 0.07, ZD0 + 0.02, "front")
bx("ink", HX0 - 0.1, HX1 + 0.1, 7.95, 8.2, ZD0 - 0.04, ZD0 + 0.06, "front")
x = HX0 + 2
while x < HX1 - 0.5: bx("steel", x - 0.035, x + 0.035, 8.18, 8.21, 8.6, ZF, "front"); x += 2
for xe in (HX0, HX1):
    bx("metal", xe - 0.07, xe + 0.07, 3.6, 8.0, 8.6, ZF, "front")               # upper end walls over the v6.11 step
    bx("ink", xe - 0.09, xe + 0.09, 0, 8.0, ZF - 0.05, ZF + 0.05, "front")
for x in SEAMS:
    top = 8.6 if 13 < x < 15 else HDR
    bx("steel", x - 0.08, x + 0.08, 1.2, top, ZD0, ZD1 + 0.05, "front"); bx("ink", x - 0.1, x + 0.1, top - 0.06, top, ZD0, ZD1 + 0.07, "front")
bx("steel", HX0 - 0.15, HX1 + 0.15, HDR, HDR + 0.22, ZD0 - 0.02, ZD1 + 0.12, "front")   # header + drive shaft
bx("ink", HX0 - 0.15, HX1 + 0.15, HDR + 0.2, HDR + 0.26, ZD0 - 0.02, ZD1 + 0.12, "front")
bx("warn", 27.6, 28.6, HDR + 0.26, HDR + 0.86, ZD0, ZD1 + 0.2, "front")               # gear motor
bx("ink", 26.9, 27.6, HDR + 0.36, HDR + 0.76, ZD0 + 0.05, ZD1 + 0.15, "front")
for a, b in DOORS:
    for xc in (a + 0.45, b - 0.45): bx("ink", xc - 0.025, xc + 0.025, DY1 + 0.16, HDR, ZD0 + 0.02, ZD0 + 0.06, "chain")
# ---- the doors ----
for a, b in DOORS:
    c = (a + b) / 2
    bx("metal", a, b, DY0, DY1, ZD0, ZD1, "door")
    bx("ink", a, b, DY1 - 0.1, DY1, ZD0 - 0.01, ZD1 + 0.02, "door"); bx("ink", a, b, DY0, DY0 + 0.1, ZD0 - 0.01, ZD1 + 0.02, "door")
    for y in (2.85, 4.45): bx("steel", a + 0.15, b - 0.15, y - 0.05, y + 0.05, ZD1, ZD1 + 0.05, "door")
    bx("steel", c - 0.56, c + 0.56, 3.24, 4.01, ZD1, ZD1 + 0.03, "door"); bx("ink", c - 0.48, c + 0.48, 3.32, 3.93, ZD1, ZD1 + 0.045, "door")
    bx("warn", c - 0.7, c + 0.7, 1.6, 1.7, ZD1, ZD1 + 0.06, "door"); bx("warn", a + 0.25, a + 0.75, 5.4, 5.75, ZD1, ZD1 + 0.03, "door")
    for xl in (a + 0.45, b - 0.45): bx("ink", xl - 0.09, xl + 0.09, DY1, DY1 + 0.16, ZD0 + 0.01, ZD1 - 0.01, "door")
print(len(K.P), "prims ~", K.tris(), "tris")
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1: open(sys.argv[1], "w").write(K.blender_code("hood_front"))
