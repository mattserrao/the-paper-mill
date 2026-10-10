# Changelog

## v4.1.0 (test build `test/v11_env`, 2026-10-10)

Environments, seeded mills and a bottleneck. The core line (receiving, stock prep, machine hall, winder, roll handling,
warehouse) is unchanged; everything around it now depends on where you build and on the mill seed.

### Your site
- **Four environments**, chosen from the menu (Change site) with their pros and cons listed:
  - **Forest valley** (rural, the default): clean river (wastewater fines 40% rarer), local crews (−$4/h), hydro power
    (−$5/t energy); long OCC haul (+$12/t), hard winters (snow 2×), wildlife (beavers, birds 2×).
  - **City mill** (urban): city cardboard (OCC −$5/t), customers nearby (+$4/t); peak-rate power (+$8/t), city wages
    (+$4/h), strict sewer permit (fines 1.6×), city life (highway closures 2×, dock fights 1.2×).
  - **Desert flats**: solar power (−$12/t energy), clear weather, cheap land (−$250/h overhead); scarce water (+$9/t),
    long haul to customers (−$7/t), dust (screens and cleaners plug 1.5×), dry bale yard (bale fires 2×).
  - **Bayou** (swamp): endless water (−$5/t chemicals), cheap land (−$190/h), barge OCC (−$3/t); humidity (slime 1.8×,
    more rain and fog), soft roads (inbound trucks 12% slower), storms (lightning, roof leaks 1.6×), beavers 3×.
- **Mill seed** (1–99999, or roll one): sets the layout of the auxiliary plant (the wastewater plant sits behind stock prep
  or behind the maintenance shop, either way round; four layouts) and all the scenery. The picker shows a plan of the site.
- **A new layout every visit** unless you tick "Keep this layout between visits"; **Surprise me** rolls a different
  environment every visit too. Changing site reloads the game (the 3D scene is built once per load).
- **One upset of its own per environment**, with its own effect, repair bill and listing in Upsets (tagged with the site):
  - Forest valley: **River intake iced over** (fresh water short, stock prep at 60%; 4× as likely in snow): ice floes jam the
    intake, maintenance breaks them up. Repair $20k.
  - City mill: **Grid brownout** (speed capped at 80%, pulper at 85%): arcs at the substation, the mill's lights sag. $10k.
  - Desert flats: **Dust storm** (trucks and clamp trucks slowed, more sheet breaks, speed 90%): tan haze over the whole
    site, blowing dust, dust rolling across the yard. $25k.
  - Bayou: **Bayou flood** (unloading at 50%, loading at 60%; 3× as likely in rain): water rises over the yard and the
    roads, not inside the buildings, with ripples and floating debris, then drains away. $60k.

### The world around the mill
- New scenery for each environment, placed from the seed: forests, farms, hills, a chip pile and a hydro line (rural);
  city blocks, houses, a water tower, a substation and a cardboard depot (urban); mesas, cacti, dunes, a solar farm,
  water tanks and a wind pump (desert); ponds, cypress, reeds, shacks on stilts and a barge dock (swamp).
- **Features**: two or three per visit from each environment's pool, so the land is never the same twice: a lake with a
  boathouse, a village with a church, a logging camp, wind turbines, an orchard, a radio mast (rural); a park, a stadium,
  a rail yard, a gas station on the highway (urban); an airstrip, an open-pit mine, an oasis, a ranch (desert); a fishing
  camp, a boardwalk, a cane field (swamp).
- The city stays low near the mill (houses, warehouses, lots); towers only beyond 230 m, so the mill stays the focus.
- Trucks use a highway with a river bridge; staff cars come in on an east road; the rail line runs to the horizon.
- The river becomes a concrete channel in the city and desert, and a dark bayou in the swamp.
- **No clipping by construction:** scenery is placed on a 2 m keep-out grid built from every mesh in the mill (plus roads,
  river, rail, the food-truck pitch), and each placed object claims its own footprint. Walkers path round scenery trunks
  inside the yard, and the camera (including zen shots) stays at least 3 m above any scenery.
  `tools/clipcheck.py` found no person, vehicle, car or train inside scenery in 4 environments (90 s each, every upset on,
  zen mode for the last 60 s), and the camera never dipped into scenery.

### Bottleneck
- Every run has one **bottleneck area**, drawn from the run's seed (a season week gives every player the same one):
  receiving docks, pulper, screens & cleaners, winder or shipping docks. It starts at 70–82% of what the machine needs
  (about 25–28 t/h against 35 t/h on 23m), set per area so a hands-off season loses about the same with each.
- A banner names it at the start; its section label is outlined in red; Upgrades opens with a bottleneck card and a
  **Line capacity** chart (each area's t/h against the machine's).
- The upgrades that fix it are 25% off and marked: pulper rotor (+30 t/h per level), screens & cleaners (+18 t/h of
  screen capacity per level), winder rebuild (+30 t/h), extra dock doors (+1 door each), electric forklifts (+25%
  unloading per door), robotic roll handling (+35% loading per door). One level fixes most of them.

### Graphics tiers
- **Low / Medium / High / Ultra**, chosen automatically from the device (phones: Medium, or Low with under 4 GB; desktops:
  High, or Ultra on a discrete GPU) and pinnable in Controls. Tiers set the pixel ratio (1 / 1.25 / 2 / 2), shadow map
  (1024 / 1024 / 2048 / 4096) and softness, shadow refresh (10 / 15 / 30 / 60 Hz), weather particles, scenery density
  (0.5 / 0.85 / 1 / 1.4) and whether far scenery casts shadows (Ultra). Pixel ratio, shadows and particles change live;
  the lighting model and scenery density on the next load. `?gfx=` forces a tier for tests.
- The low-FPS fallback has a third step after pixel ratio 1 and 5 Hz shadows: the far scenery sectors are hidden.
- Medium on a phone is exactly v4.0.2's settings, so the benchmarks still compare.

### Zen mode
- Nine new shots of the land: a long approach from a random direction ("over the forest" / "over the rooftops" /
  "across the flats" / "over the bayou"), a half-orbit of one of the seeded landmarks, the highway bridge, a drift along
  the river (canal, bayou), and one signature shot per environment: forest canopy, city skyline, mesa horizon, bayou mist.
  The camera is clamped above scenery, so a sweep over city blocks or mesas rises over them.

### Economy
- Paper prices go back up to $713 / $733 / $753 / $813 per ton (23m / 26m / 30m / 33HT; v4.0.2: $625–725) because every
  run now starts with a bottleneck. A hands-off season still breaks even with the environment upsets in: 15 seasons per
  environment average −$95k (rural), +$13k (urban), −$38k (desert), −$22k (swamp). No bankruptcies.
- The seeded 3-day checksum changes to **`81890238`** (rural, mill #1; the default site and the autotest's). Other
  environments have their own checksums because their weather, costs and upsets differ.

### Performance (quick test, phone emulation = Medium tier, rural mill #1)
- Scenery is merged into six vertex-coloured meshes (one per map sector; only the one around the mill casts shadows):
  10k–25k triangles depending on environment, replacing 300 instanced trees (two draws each pass).
- Main-pass draws 246 normal / 495 all upsets, shadow pass 133 / 89, shader programs 108–110, triangles 231k / 311k.
  Swamp mill #24 (the heaviest scenery): 225 / 464, 202k / 294k.

### Testing
- `tools/quick.py`, `tools/econ.py`: `--env=` and `--mill=` (quick) / `--env=` and `--bn=` (econ) to test any site.
- New `tools/topview.py` (top-down or perspective render of a site) and `tools/clipcheck.py`.
- The autotest ignores a saved site and always measures rural, mill #1 (or `&env=`/`&mill=` from the URL); `quick.py`
  passes `mill=1` so a visit's random layout doesn't move the numbers.

## v4.0.2 (2026-10-10)

Economy rebalance and smoother screens when many upsets happen at once.

### Economy
- A season played hands-off (every offer declined, standard outage budgets, no upgrades) now breaks even instead of
  making about $1.4M. Profit comes from running the mill well. Measured over 15 simulated seasons: average finish
  $2.00M from the $2.0M start (before: $3.43M over 10 seasons).
- Paper sells for $89/t less: 23m $625, 26m $645, 30m $665, 33HT $725 per ton.
- Outage budgets per area are $20k / $70k / $170k (were $50k / $100k / $200k), with the same reliability effects.
- The seeded 3-day checksum changes to `810f617a` (cash is part of it); upsets, breaks and production are unchanged.

### Performance
- The floating labels over the mill (section names and upset labels) are drawn on one canvas instead of as page
  elements. With every upset active (phone emulation): repaints per frame 12.1 → 1.2, browser render work per frame
  2.57 → 1.45 ms, page writes per frame 36.6 → 14.9. On an iPhone this was the cause of frame drops (43–51 FPS) when
  many upsets were active. Labels look and behave the same: tap an upset label to fly there.

## v4.0.1 (2026-10-09)

Performance follow-up to v4.0.0, measured on an iPhone 15 (iOS 18.7, Safari) with the new device autotest across eight
test builds. Gameplay and the simulation are unchanged (same seeded 3-day checksum, `96960821`).

| Measure, iPhone 15 | v4.0.0 | v4.0.1 | Change |
|---|---|---|---|
| Draw calls per frame, normal play (all passes) | 348 | 300 | −14% |
| Game script time per frame, normal play | 3.4 ms | 3.1 ms | −9% |
| Worst frame, normal play | 43 ms | 19 ms | −56% |
| Frames over 33 ms, normal play | 1 | 0 | |
| Draw calls per frame, all upsets at once | 664 | 565 | −15% |
| Longest script frame from walker route planning (all upsets) | 18 ms | ≤0.05 ms per frame | |
| Page style/attribute writes per second, upsets (emulator) | 326 | 77 | −76% |

### Performance
- Upset labels, chips and banner write to the page only when their text or position changes.
- Moving objects are cut out of the merged shadow proxy in place instead of rebuilding it.
- Moving objects of the same shape share one batch whatever their color (per-object color), so far fewer batches.
- Start-up stand-in shaders are kept, and batches made mid-play compile in the background.
- New moving batches are made one per frame instead of all in the same frame.
- Walker route planning is about twice as fast and runs in ~2 ms slices per frame, so long routes no longer stall a
  frame. Routes are identical.
- Palette colors are re-read only when the palette changes.

### Controls
- New **Show FPS** checkbox: a small frame-rate readout in the bottom-right corner, above the bottom bar (hidden
  while a panel is open). Remembered between visits; off by default.

### Fixes
- Scenery no longer fails to load ("scenery baking failed: console.info is not a function") in browsers or in-app
  viewers with a partial console.

### Testing
- Device autotest: open the game with `?autotest` for a hands-free performance test (normal play, three diagnostic
  phases, all upsets at once with and without HTML labels, GPU probe of each upset effect) and a sim checksum,
  ending on a results page with a Copy results button. Normal play is unchanged.

### Known issue
- With every upset active at once, the moving HTML upset labels can drop the iPhone to ~43–51 FPS on some runs (the
  same scene with labels hidden holds 60 FPS). Normal play is unaffected.

## v4.0.0 (2026-10-09)

### Graphics demand: an estimated ~70% reduction versus v3.3.4

| Measure (same scene, same settings) | v3.3.4 | v4.0.0 | Change |
|---|---|---|---|
| Draw calls per frame, phone (main + shadow pass, shadows on) | 1,890 | 387 | **−80%** |
| Draw calls per frame, desktop | 3,043 | 589 | **−81%** |
| Shadow-pass draw calls per refresh | 542 | 106 | **−80%** |
| GPU geometry buffers (phone) | 1,742 | 994 | −43% |
| Blurred overlays recomposited every frame over the 3D view | 20 | 0 | −100% |
| Shader compiles during play (iPhone) | many, with stutters | none in normal play | |
| iPhone frame rate (iOS 18.7) | ~26 FPS | **60 FPS** (p99 frame 18 ms) | +130% |

The ~70% overall figure is an estimate. It weighs the draw-call, shadow-pass and compositing cuts (each roughly −80%
or more) against the triangle count, which is ~60% higher because v4 keeps shadows on where v3.3.4's low-FPS
fallback usually switched them off. Measured in headless Chromium plus a real iPhone; full method and results are in
the project benchmark notes.

### Performance
- Steady 60 FPS on iPhone with shadows on (v3.3.4 ran at ~26 FPS).
- About 80% fewer draw calls. Scenery and moving people and vehicles are batched with three.js BatchedMesh, and
  static shadows go through one merged caster.
- No stutter during play: all shaders and effects are prepared behind the start menu ("Getting the mill ready…").
- Starts at full frame rate; Battery saver (30 FPS) is still in Controls and is remembered.
- Removed the frosted-glass blur over the 3D view, a major cost on phones.
- About 85% less memory churn, so fewer garbage-collection pauses.
- Fixed a v3 bug that left scenery merging almost completely off.

### Gameplay
- Fairer seasons: every player in the same week gets identical luck (upsets, breaks, hayouts, weather). Balance is
  unchanged over 40 test seasons.
- Leaving zen mode returns to the menu.
- Devices without 3D support see a clear message instead of a blank screen.

### Technical
- three.js r128 → r186.1, with lighting and colors matched to the v3 look.
- The low-FPS fallback lowers resolution first and keeps shadows on.
- Sound no longer restarts repeatedly on the first tap on iPhone.
- Controls → Diagnostics shows frame times (p50/p95/p99, slow frames, worst frame).

### Code
- Removed the old hidden UI, dead code and unused CSS; the built file is ~3% smaller despite the new features.
- Source split into 40 named files under `src/`, built into `index.html` by `build.py` (see `src/README.md`).
- Automated tests (full-season smoke, determinism, balance) and a performance benchmark suite in `tools/`.
