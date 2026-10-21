"""Item 10: the MCC interior (game coords). Static detail added round the v6.10 lineups (the cabinets, doors, lights and
drive modules stay as they are in 38c: they move). Same cabinet layout as the game: rectifier 0.92 m, drives 0.72 m,
0.3 m between lineups, the 480 V incoming pair at the east end; cabinet fronts at z 24.86."""
from design import Kit
K = Kit()
X0, X1, Z0, Z1, H = 4.0, 18.0, 24.0, 31.0, 4.4
CABZ = Z0 + 0.55; FRONT = CABZ + 0.31
LINE = [("SP", 4), ("PM", 5), ("WD", 1)]
cabs = []                                  # (centre x, width, kind)
x = X0 + 0.6
for ln, n in LINE:
    cabs.append((x + 0.43, 0.86, "rect")); x += 0.92
    for k in range(n): cabs.append((x + 0.34, 0.68, "drv")); x += 0.72
    x += 0.3
for k in range(2): cabs.append((x + 0.39 + k * 0.8, 0.78, "main"))
XE = x + 1.6
# plinths under every cabinet, and louvred vents in the top of each drive door frame (on the cabinet body, above the door)
for cx, w, kd in cabs:
    K.box(w + 0.02, 0.1, 0.66, "ink", cx, 0.05, CABZ - 0.02)
    if kd == "drv":
        for j in range(3): K.box(0.44, 0.03, 0.02, "ink", cx, 2.18 + j * 0.05, FRONT + 0.005)
# the cable tray along the back wall over the lineups, on wall brackets, with a drop into the top of every cabinet
L = XE - (X0 + 0.4); XC = (X0 + 0.4 + XE) / 2
K.box(L, 0.06, 0.42, "steel", XC, 3.45, Z0 + 0.38, tag="tray")
K.box(L, 0.14, 0.03, "steel", XC, 3.52, Z0 + 0.59)
for xb in [X0 + 0.7 + 1.6 * k for k in range(int(L / 1.6) + 1)]: K.box(0.06, 0.32, 0.4, "frame", xb, 3.3, Z0 + 0.36)
for cx, w, kd in cabs: K.box(0.14, 0.9, 0.12, "ink", cx, 2.96, CABZ - 0.12)
# conduit from the transformer's cable bus (east wall) to the incoming section
K.box(X1 - XE + 0.2, 0.22, 0.22, "ink", (XE + X1) / 2, 3.1, Z0 + 1.6)
K.box(0.22, 0.7, 0.22, "ink", XE - 0.1, 2.75, Z0 + 1.6)
# arc-flash floor: a black rubber mat along the fronts and the yellow approach boundary painted on the floor
K.box(XE - X0 - 0.8, 0.02, 0.9, "ink", (X0 + 0.6 + XE) / 2, 0.06, FRONT + 0.5)
for zz in (FRONT + 1.35,): K.box(XE - X0 - 0.6, 0.012, 0.09, "lane", (X0 + 0.6 + XE) / 2, 0.055, zz)
for xx in (X0 + 0.55, XE - 0.05): K.box(0.09, 0.012, 1.35, "lane", xx, 0.055, FRONT + 0.67)
# the spare-drive rack: a two-bay steel shelf with three shelves (the spare modules stay as the game's own green boxes)
RX, RZ = X1 - 0.6, Z1 - 3.3
for dz in (-0.9, 0.0, 0.9):
    K.box(0.06, 2.1, 0.06, "frame", RX - 0.25, 1.05, RZ + dz); K.box(0.06, 2.1, 0.06, "frame", RX + 0.25, 1.05, RZ + dz)
for y in (0.3, 0.92, 1.54, 2.08): K.box(0.56, 0.04, 1.86, "steel", RX, y, RZ)
K.box(0.5, 0.3, 0.06, "white", RX - 0.28, 1.85, RZ - 0.95)           # the spares label board
# the desk: a monitor (no chair: the tech stands there); a CO2 extinguisher and the arc-flash PPE locker by the door
DX, DZ = 15.4, 29.7
K.box(0.5, 0.32, 0.04, "ink", DX + 0.3, 1.05, DZ - 0.75); K.box(0.06, 0.2, 0.06, "ink", DX + 0.3, 0.9, DZ - 0.75)
K.cyly(0.13, 0.7, "bad", X0 + 0.45, 0.45, 30.5, seg=10); K.box(0.12, 0.08, 0.12, "ink", X0 + 0.45, 0.84, 30.5)
K.box(0.45, 1.9, 0.7, "stock", X0 + 0.5, 0.95, 29.6); K.box(0.02, 0.4, 0.5, "white", X0 + 0.74, 1.5, 29.6)
print(len(K.P), "prims ~", K.tris(), "tris")
# ---- context only: the existing cabinets as boxes, for the Blender review ----
CTX = Kit()
for cx, w, kd in cabs:
    CTX.box(w, 2.3 if kd == "drv" else 2.4, 0.6 if kd == "drv" else 0.68, "frame" if kd != "rect" else "metal", cx, 1.2, CABZ)
CTX.box(X1 - X0, 0.04, Z1 - Z0, "slab", (X0 + X1) / 2, 0.02, (Z0 + Z1) / 2)
CTX.box(X1 - X0, H, 0.3, "white", (X0 + X1) / 2, H / 2, Z0); CTX.box(0.3, H, Z1 - Z0, "white", X1, H / 2, (Z0 + Z1) / 2)
CTX.box(1.6, 0.08, 0.8, "kraft", DX, 0.78, DZ - 0.45)
