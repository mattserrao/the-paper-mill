# The Paper Mill: source layout (v4)

`index.html` is a build output. Edit the files in `src/`, then run:

```
python3 build.py            # writes index.html
```

The build concatenates, in order: `head.html`, `styles.css`, `body.html`, every `js/*.js` in file-name order,
then `tail.html`. All game code runs inside **one shared closure** (opened in `01-brand.js`, closed at the end of
`53-diagnostics-panel.js`), so a file can use anything declared in an earlier file. The 3D view is a second closure,
`init3D`, opened in `20-3d-setup.js` and closed at the end of `43-3d-frame.js`.

## Files

| Range | What lives there |
|---|---|
| `00` | `APP_VER`, the rolling diagnostics log, and the three.js loader (r186.1 as an ES module via top-level `await`; outside the closure, so errors during start-up are caught) |
| `01–11` | Game: mill name and colors, audio, model constants and seeded random streams, upsets, event cards, outages and state, the sim `step()`, UI wiring, seasons and leaderboard, report cards, Stats trend chart |
| `20–43` | 3D view, one file per area of the mill: setup, plant, floors, rejects, stock prep, vehicles, labels, camera, upset effects and particles, people, fire response, ambient life, janitorial, techs, upgrades, static-mesh merge, outage jobs, zen camera, and the per-frame update (`43-3d-frame.js`) |
| `50–53` | Side panels (slice, spider, Uncle Brian), app shell (top bar, sheets, menu, tutorial), main loop, diagnostics panel and the `window.__PM` test hook |

## Conventions

- **Running state:** set `running` directly; nothing else mirrors it.
- **Sim speed:** always call `setSimSpeed(v)`.
- **UI refresh:** anything that redraws 5 times a second registers with `UI_TICKS.push(fn)`; the main loop calls it with a tick counter. Don't add `setInterval` timers.
- **Randomness that affects play** uses `rand(stream)` (`03-model.js`), never `Math.random()`. Each kind of luck has its own stream, seeded per season week in `seedRun`. `step()` draws its dice every step, so seasons replay identically. Cosmetic randomness (particles, idle animation) may use `Math.random()`.
- **The sim** advances in fixed `SIM_STEP` (0.25 sim-minute) steps in `52-main-loop.js`.
- **Particles:** `emit()` / `emitA()` feed one instanced draw per texture (`31-3d-upset-fx.js`).
- **Frame rate:** Smooth (full display rate) by default, Battery saver (30 FPS) opt-in, remembered (`paper-mill-fps`). The low-FPS fallback lowers the pixel ratio first, then refreshes shadows at 5 Hz. It never switches shadows off, because that recompiles every shader.
- **Start-up precompile:** `G3.prewarm()` (`31-3d-upset-fx.js`) builds every upset effect and compiles every shader while the start menu is up. The first Play waits for it ("Getting the mill ready…"). Don't compile or create materials mid-play.
- **Frame times** are recorded while playing (`G3.FT`, `52-main-loop.js`) and shown at the top of Controls → Diagnostics (p50/p95/p99, frames over 33/50 ms, worst) and in the 15 s snapshot lines.
- **Batches draw with their own copy of the source material** (`bmMat`), synced every frame; never share one material between a batch and a plain mesh, because three.js then re-derives the shader on every switch.
- **No backdrop blur over the 3D view.** It's recomputed every frame. Use near-opaque fills; only the pause menu blurs.
- **Moving things** (people, vehicles, loads, any single-material opaque mesh drawn on its own) are drawn through dynamic BatchedMeshes, one per look (`G3.dbTick`, `40-3d-static-merge.js`). Their originals live on layer 30 and are still animated by the game. `dbTick` updates world matrices once before the render, and the render skips its own pass.
- **Shadows:** static casters go through two merged shadow-proxy meshes, shown only during the shadow pass; the sun never moves. Moving things cast their own.
- **Static scenery** is batched on the first frame with three.js BatchedMesh (`40-3d-static-merge.js`, phones too): one batch per look (material + shadow flags + vertex layout), single-object looks left alone. Edge outlines, mirrored meshes and roof parts use the older bake path. Anything that later moves, hides or changes material is handed back automatically. A new object that should never be batched goes in `SM.dyn` before the first frame.

## three.js (r186) notes

- **Color management is off** (`THREE.ColorManagement.enabled=false`) to keep r128's color behavior. Code that wants an sRGB color in linear space converts it itself (`lin()`, `convertSRGBToLinear`). Textures set `colorSpace=THREE.SRGBColorSpace`.
- **Light intensities are multiplied by `LEG` (π)** because r155+ removed the legacy light units. Any new light or intensity change needs it too.
- **`renderer.debug.checkShaderErrors` is false.** Otherwise first-draw error-log reads stall the GPU (a 2.4 s freeze when upsets first appear). Turn it on temporarily when editing a shader.
- **Draw-call stats now include the shadow pass.** The benchmark counts raw WebGL draws so numbers compare across versions.

## Tools (`tools/`)

Needs Python 3 with Playwright (Chromium), and Node with `eslint@8`, `three@0.128.0` (for older builds) and `three@0.186.1` (in `t186/`) installed next to the scripts. The scripts serve three.js locally, so tests run offline.

- `suite.py index.html <label>`: the performance scorecard (~10 min). It runs `calib.py`, `audit.py` (desktop and phone), `hitches.py`, `phone.py` and `steady_high.py`. Add the result as a column in the project doc `paper-mill-benchmarks.md`.
- `latecompile.py index.html phone`: shader programs compiled after the start-up precompile (should be 0).
- `audiotap.py index.html`: audio contexts created on the first tap (Chromium can't reproduce iOS interruptions).
- `diagread.py index.html`: prints the top of the Diagnostics panel after 20 s of play.
- `phone.py a.html b.html … --shadows`: phone CPU and draws per frame, with shadows forced on so builds compare on equal graphics.
- `experiments.py index.html`: applies one change at a time (no blur, no labels, single-pass transparency, actors hidden, outlines hidden, shadows on), measures, then reverts.
- `allocprof.py index.html phone`: which functions allocate the most JS memory during play.
- `bench.py index.html <label> 3`: the older timing benchmark (also provides the shared test hook and local three.js routing the other scripts use).
- `smoke.py index.html`: drives every menu and panel plus a full 30-day season; fails on any page error.
- `determinism.py index.html`: two loads of the same season week must play out identically.
- `balance.py index.html 40`: average outcomes over 40 seasons, to confirm balance after sim changes.
- `idcheck.py index.html`: every element ID the code looks up exists.
- `nothree.py index.html`: with three.js unreachable, the page shows the no-3D screen without errors.
