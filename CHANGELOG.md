# Changelog

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
