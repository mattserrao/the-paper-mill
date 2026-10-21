"""Item 6: Pope reel and winder with one mechanical look (stands with base plates, dark bearing housings, blue drive motors
on the drive side, capped rails). Moving parts (spools, arms, drums, set rolls, crane) are untouched; paper stays scaled in code."""
from design import Kit
zc, CD = 9.1, 6.4
DX, DY, DR, RM, R0 = -5.6, 4.2, 0.9, 2.2, 0.45
KX = DX - (DR + RM) - 2.6; ZJ = CD / 2 + 0.45
# ---- Pope reel (world coords) ----
R = Kit()
for z in (zc - ZJ, zc + ZJ):
    R.box(1.9, 0.12, 0.8, "ink", DX, 0.06, z)                                # base plate
    for dx in (-0.55, 0.55): R.box(0.32, DY - 0.3, 0.5, "frame", DX + dx, (DY - 0.3) / 2, z)   # stand legs
    R.box(1.45, 0.3, 0.55, "frame", DX, DY - 0.45, z)                         # stand head
    R.box(0.8, 0.8, 0.62, "ink", DX, DY, z, tag="bearing")                    # reel drum bearing
    R.box(DX - (KX - 1.4), 0.08, 0.32, "metal", (DX + KX - 1.4) / 2 - 0.3, DY - 0.2, z)    # reel rail cap
    x = DX - 0.6
    while x >= KX - 1: R.box(0.7, 0.1, 0.7, "ink", x, 0.05, z); x -= 3         # rail post base plates
R.cylz(0.48, 1.1, "stock", DX, DY, zc - ZJ - 0.95, seg=14, tag="motor")       # reel drum drive (drive side)
R.box(0.7, 0.7, 0.6, "frame", DX, DY, zc - ZJ - 0.15)                         # gearbox
R.box(1.0, DY - 0.35, 0.9, "frame", DX, (DY - 0.35) / 2, zc - ZJ - 0.95)      # motor pedestal
# ---- winder (local to the wd group at x -18.7, z zc) ----
W = Kit()
for z in (-2.75, 2.75):
    s = 1 if z > 0 else -1
    W.box(3.0, 1.45, 0.3, "frame", -1.85, 0.72, z, tag="drumframe")            # drum side frame
    for x in (-1.3, -2.4): W.box(0.55, 0.55, 0.4, "ink", x, 0.75, z)          # drum bearings
    W.box(2.2, 0.12, 0.9, "ink", 2.6, 0.06, z)                                 # unwind stand base
    for dx in (-0.65, 0.65): W.box(0.3, 2.3, 0.45, "frame", 2.6 + dx, 1.15, z, rz=dx * 0.32)   # A-frame legs
    W.box(0.7, 0.7, 0.55, "ink", 2.6, 2.4, z)                                  # unwind bearing
    for x in (-0.15, 1.35): W.box(0.3, 2.9, 0.35, "frame", x, 1.45, z)          # slitter frame posts
    W.box(1.8, 0.3, 0.4, "frame", 0.6, 3.0, z)                                 # slitter frame head
W.box(0.4, 0.3, 5.9, "metal", 0.6, 2.75, 0, tag="slitter")                     # slitter beam (top knives)
for zk in (-1.45, 0.0, 1.45): W.box(0.16, 0.4, 0.22, "ink", 0.6, 2.45, zk)      # knife holders: 2 rolls a set
W.box(0.4, 0.22, 5.9, "metal", 0.6, 1.95, 0)                                   # anvil beam under the web
W.cylz(0.72, 0.12, "ink", 2.6, 2.4, -3.1, seg=16)                              # unwind brake disc
W.box(0.5, 0.9, 0.3, "frame", 2.6, 1.95, -3.25)                                # brake caliper bracket
W.cylz(0.42, 0.9, "stock", -1.85, 0.75, -3.5, seg=14, tag="motor")             # drum drive
W.box(0.9, 0.75, 0.9, "frame", -1.85, 0.37, -3.5)
print(len(R.P), "+", len(W.P), "prims ~", R.tris() + W.tris(), "tris")
# ---- context only: drums, set rolls, unwind roll, reel drum, rails ----
CR = Kit()
CR.cylz(DR, CD, "metal", DX, DY, zc, seg=24); CR.cylz(R0 + 1.2, CD, "paper", KX, DY, zc, seg=24)
for z in (zc - ZJ, zc + ZJ): CR.box(DX - (KX - 1.4), 0.35, 0.5, "frame", (DX + KX - 1.4) / 2 - 0.3, DY - 0.42, z)
CW = Kit()
CW.cylz(1, 4.8, "paper", 2.6, 2.4, 0, seg=22); [CW.cylz(0.5, 5, "metal", x, 0.75, 0, seg=12) for x in (-1.3, -2.4)]
[CW.cylz(1, 1.4, "paper", -1.85, 1.75, z, seg=24) for z in (0.725, -0.725)]
CW.box(4.6, 0.02, 4.6, "white", 0.4, 2.2, 0)
