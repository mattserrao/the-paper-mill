"""Item 4: press section framework and support (game coords). Rolls and felts stay as they are in 25-3d-fog-fan.js;
this replaces the three plain frame boxes per side with real press stands, bearing housings, top-loading cylinders,
a felt-run girder with tie beams, guide-roll bearings and links, lower pedestals, sole plates, Uhle boxes and showers."""
from design import Kit
zc, CD = 9.1, 6.4
K = Kit()
FZ = (zc - CD / 2 - 0.55, zc + CD / 2 + 0.55)      # frame planes (drive side, tending side), outside the roll ends
NIPS = [(37, 4.45, 2.35, 1.05), (32, 4.6, 2.2, 1.2)]   # x, top roll y, bottom roll y, roll radius
UP = [(39.4, 5.6), (39.2, 7.1), (35.2, 7.1), (34.9, 5.6), (34.2, 6.1), (33.8, 7.6), (30.3, 7.6), (29.8, 6.1)]
LOW = [(29.6, 2.4), (29.6, 0.55), (40.6, 0.55), (41.6, 1.7)]
GY = 8.35                                           # felt-run girder height (above the top felt runs, 7.6)
for z in FZ:
    s = 1 if z > zc else -1
    K.box(13.6, 0.16, 0.9, "ink", 35.0, 0.08, z)                                   # sole plate
    for x, yt, yb, r in NIPS:
        for dx in (-r - 0.25, r + 0.25):
            K.box(0.34, GY, 0.42, "frame", x + dx, GY / 2, z, tag="post")           # stand posts up to the girder
        K.box(2 * r + 0.95, 0.45, 0.55, "frame", x, yb - r - 0.05, z)              # lower stand beam under the bottom roll
        K.box(0.78, 0.78, 0.55, "ink", x, yb, z, tag="bearing")                    # bottom roll bearing housing
        K.box(0.78, 0.78, 0.55, "ink", x, yt, z, tag="bearing")                    # top roll bearing housing
        K.cyly(0.22, GY - yt - 0.75, "metal", x, (GY + yt + 0.75) / 2 - 0.1, z, seg=10, tag="loadcyl")   # top-loading cylinder
        K.cyly(0.09, 0.45, "warn", x, yt + 0.7, z, seg=8)                           # piston rod
        K.box(0.7, 0.18, 0.7, "frame", x, GY - 0.25, z)                             # cylinder head bracket
        K.cylz(0.32, 0.08, "metal", x, yb, z + s * 0.35, seg=12)                    # roll journal caps
        K.cylz(0.32, 0.08, "metal", x, yt, z + s * 0.35, seg=12)
    K.box(12.6, 0.4, 0.42, "frame", 34.9, GY, z, tag="girder")                    # felt-run girder
    for x in (30.0, 35.0, 39.8): K.box(0.36, 0.5, 0.36, "frame", x, GY - 0.52, z)  # girder gussets
    for x, y in UP:                                                                # upper guide rolls: bearings + links
        K.box(0.5, 0.5, 0.4, "ink", x, y, z)
        if GY - y > 0.6: K.box(0.18, GY - y - 0.25, 0.18, "metal", x, (GY + y) / 2, z)
    for x, y in LOW:                                                               # lower guide rolls: pedestals
        K.box(0.5, 0.5, 0.4, "ink", x, y, z)
        if y > 0.6: K.box(0.4, y - 0.2, 0.4, "frame", x, (y - 0.2) / 2, z)
# cross-machine ties over the felts, so the press reads as one frame
# (no cross-machine ties over the felts: from the iso camera they hid the felt runs)
# Uhle boxes on the felt runs and felt showers
for x, y in ((37.2, 6.82), (32.0, 7.32)): K.box(0.5, 0.35, CD, "metal", x, y, zc, tag="uhle")
K.box(0.5, 0.35, CD, "metal", 35.0, 0.3, zc, tag="uhle")
for x, y in ((38.6, 7.5), (31.2, 8.0), (34.0, 0.95)): K.cylz(0.07, CD + 0.2, "stock", x, y, zc, seg=8)
# hydraulic power unit on the drive side floor, hoses implied
K.box(1.6, 1.0, 0.9, "stock", 34.5, 0.5, FZ[0] - 1.3); K.box(1.4, 0.06, 0.7, "ink", 34.5, 1.03, FZ[0] - 1.3)
print(len(K.P), "prims ~", K.tris(), "tris")
