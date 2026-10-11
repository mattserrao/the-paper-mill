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
| `01–11` | Game: mill name and colors, audio, model constants and seeded random streams, the site (`03b`: environments, mill seed and layout, bottleneck), upsets, event cards, outages and state, the sim `step()`, UI wiring, seasons and leaderboard, report cards, Stats trend chart |
| `20–43` | 3D view, one file per area of the mill: setup, plant, floors, rejects, stock prep, vehicles, labels, camera, upset effects and particles, people, fire response, the sky (`35b`), ambient life, janitorial, techs, upgrades, the yard props (`39b`: water tower, bales, gate sign), static-mesh merge, outage jobs, zen camera, the seeded scenery and terrain around the mill (`42b`), and the per-frame update (`43-3d-frame.js`) |
| `50–53` | Side panels (slice, spider, Uncle Brian), app shell (top bar, sheets, menu, tutorial), the site picker (`51b`), main loop, the device autotest (`52b`, only active with `?autotest`), diagnostics panel and the `window.__PM` test hook |

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

## Site, mill seed and bottleneck (v4.1)

- **`SITE`** (`03b-site.js`) is the environment (`rural`, `urban`, `desert`, `swamp`) and mill seed the page was loaded
  with: from `?env=&mill=` (tests), else the saved choice (`paper-mill-site`: `{env|"any", seed, pin}`), else rural. The
  seed is rolled fresh on every load unless pinned (`Math.random` here is the one allowed use outside cosmetics: it picks
  the world before the run starts, not luck during play); `?autotest` always gets mill #1. The 3D scene is built once
  from it, so the site picker saves and reloads.
- **Environment upsets** (`env:` on an event in `04-upsets.js`): `trigger()` refuses another site's upset, `siteFreq()`
  returns 0 for it, the Upsets panel lists only this site's, and `10-report-cards.js` tolerates the missing buttons. The
  dice are still drawn for every event everywhere (chaosTick), so the streams stay in step across sites. Their effects
  set `G3.dustK` / `G3.brownK` / `G3.floodK`, which `envUpdate` (36) reads for the sky, fog, lights and weather points;
  31's frame tail resets them when the upset is over.
- **Environment gameplay** goes through `applySite()` (called from `applyUpgrades`): `P.siteOcc`, `sitePrice`, `siteEnergy`,
  `siteWage`, `siteOver`, `siteIn` (inbound trucks), `siteWx` (weather thresholds; still one `rand("wx")` draw) and
  `siteFreq(id)` (upset frequency, inside `freqMul`, shown as "site" under Reliability). Keep each environment's
  hands-off season near break-even: `econ.py index.html 15 --env=X`.
- **`LAYOUT`** (`layoutFor(seed)`): where the auxiliary plant sits. Only the wastewater plant moves (two slots, either way
  round); code that places or points at it uses `LAYOUT.wx(x)` on its v4.0 coordinates (21 plant, 31 permit effect and pin,
  42 zen shot). The power house stays: the steam rack ties it to the dryers.
- **Bottleneck:** `S.bn` comes from the run's seed (`bnFor`, a hash, no stream drawn), so a season week shares it.
  `applySite()` sets the capacities it can cut (`P.doorRate`, `pulperMax`, `screenMax`, `winderMax`, `doorRolls`) from
  `BNK[area]` × what the machine needs on 23m. Upgrades that fix it (`BN[area].ups`) cost `upCost()` (25% off) and do
  more for that area. `lineCaps()` gives every area's t/h (Line capacity chart, bottleneck card, labels).
- **Scenery** (`42b-3d-scenery.js`) runs after every other static object exists: a 2 m keep-out grid from every mesh and
  instance, off-site roads and rail, then the environment kit and its utilities, merged into one vertex-coloured mesh per
  map sector (not batched: the colour attribute keeps them out of the static merge). Anything that must stay clear of
  scenery but is hidden at build time (like the food truck) needs a `kMark` there. `G3.navBoxes` adds scenery trunks to the
  walkers' grid; `G3.sceneryH(x,z)` keeps the camera above scenery (`placeCam`); `G3.sceneryAt(x,z)` is for tests.
- **Features** (`FEAT` in 42b): each environment has a pool; `features()` builds two or three per visit from the seed.
  Every utility and feature records its position in `G3.scenery.util` (`name -> [x, z, height]`) for the zen "landmark"
  shot and the brownout's substation pin.
- **Graphics tiers** (`GFX_TIERS` / `G3.GFX` in `20-3d-setup.js`): Auto picks from the device; `?gfx=` or
  `paper-mill-gfx` pins one. `G3.setGfx()` (29) applies what can change live (pixel ratio, shadow map size and radius,
  shadow Hz, weather points, far-sector shadows); `GFX.lambert` (material model) and `GFX.scenery` (density) need a reload.
  New visual features should scale with the tier where it makes sense. Phone emulation in the tools is the Medium tier.
- Don't name a 3D-closure variable `SITE`: it shadows the global (the fence rectangle is `FENCE`).

### The look (v4.1 pass 3)

- **Terrain** (42b, before the assets): `hBase(x,z)` is noise relief outside the fence (`RELIEF` per environment; the river
  band, the rail line and every road corridor stay level), `pad(x,z,r)` flattens a feature's ground, `hAt(x,z)` is the
  final height and is exported as `G3.terrainH`. `add()` and `poly()` add it to everything they place, `G3.sceneryH`
  includes it, and the ground mesh (`G3.terrain`, vertex-coloured, textured on High and Ultra) samples it. Anything placed
  outside the fence by other code must add `G3.terrainH(x,z)` itself.
- **Sky** (`35b-3d-sky.js`): `G3.SKY` holds the dome (a ShaderMaterial band from 11° below the horizon to 35° above, so a
  view of the mill draws no sky), clouds and mist (camera-facing quads, one mesh each, rebuilt per frame when visible).
  `envUpdate` (36) calls `SKY.tick(rdt, now, day, skyColour, dustK)`. The dome and clouds hide when the top of the view
  is below them (`camera.fov` is the vertical field), after 90 ticks so their shaders compile at the start.
- **Yard props** (`39b-3d-yard-props.js`): the water tower (`YP.tower` for the zen camera), bale stacks, pallets, cores,
  dumpsters, compactor, charging bay, flagpoles (`YP.flags`, waved by 36 on High/Ultra) and the gate sign. All static and
  batched; they use the shared materials (`M.steel`, `M.ink`, `M.brand`, `M.ok`, `M.baleG[1]`), because every new
  material is a new static batch (a draw). The tank band and the gate sign share one canvas atlas (`signM`), redrawn
  by `G3.rebrand`.
- **Roles** (33 `worker(suit, hat, role)`, 36 `person(..., role)`): `role.vest` (`HIVIS.orange` / `HIVIS.yellow`) and
  `role.radio`. `HIVIS.orange` keeps `mat()`'s roughness and metalness so it shares the moving batch (a batch's look
  leaves out colour, not roughness). Driver figures (27 `cage()`) use `DRV_HEAD` / `DRV_HAT` and `M.beacon` (one shared
  MeshBasic amber for every vehicle beacon).
- **Rounded boxes** (`rboxGeo`, 20): 316 triangles on High/Ultra, 140 on Medium, 92 on Low (`RBQ`). Anything with all
  three sides ≥ 0.45 m made with `box()` is rounded; use `THREE.BoxGeometry` directly for crates and bales seen in bulk.
- **Textured walls** (`ribWall`, 20): one shared material; the rib pitch is in each wall's uvs. Never clone a texture per
  object to get a different `repeat`: every clone is a material, and every material is a draw.
- **Ground shadings** (`skirt`, `blob`, 20): transparent decals flagged `userData.aoDecal`; the static merge (40) bakes
  them into one mesh per material (map-wide, never culled) instead of a draw each.
- **Program count** (A2 limit 115): the texture colour space, vertex colours, the presence of a normal attribute,
  DoubleSide, instancing and batching are each a program variant, and so is the output colour space: a render target has
  its own, so the prewarm renders to the screen behind a 1 px scissor rather than into one (that alone was 30 programs).
  The sky's clouds, mist and night windows carry a normal attribute and are FrontSide for that reason.
- **Shadow-pass shaders**: three.js shares one depth material across all casters and re-derives its shader only when it
  steps between a plain mesh, an instanced mesh and a batch, taking the side and texture of whatever comes next. The
  prewarm (31) draws every combination in that order (`plain`/`batch`/`inst` stand-ins) so nothing compiles mid-play;
  `sortKinds()` (40) groups the scene's children by kind so a shadow pass switches a few times, not dozens.
- **Materials and instancing**: a material shared between an InstancedMesh and a plain mesh makes three.js re-derive its
  shader parameters on every switch (a few KB of garbage each); give an InstancedMesh its own copy with `instMat(m)` (20;
  arrays too, palette token kept).
- **Per-frame allocation**: the paper sheet (25) is one geometry updated in place; particle batches (31) keep their
  lists, a count and one update-range object per attribute; `SLC.geo()` returns one reused object; the static-merge watch
  compacts its list in place. `tools/allocprof.py` shows what allocates; `quick.py`'s `alloc_MB_s` must stay ≤ 2.
- Debug flags: `?nosky` (no dome, clouds or mist), `?noclouds`, `?noterr` (no ground mesh), `?gfx=low|medium|high|ultra`.

### Music (v4.1 pass 4, `02-audio.js`)

- Two sequencers run at 16 steps a bar: `chill` plays the site's rotation (`ENVROT[env]`: the site's pieces plus the lofi
  break-room tune) and `intense` the upset piece picked by `pickIntense()` on each switch (`ENVINT[env]` three times in four,
  else `drive`), each with two chord sets. `AUDIO.update(intense)` from the main loop fades between them.
- A piece is `{name,bpm,bars,play(st,t,s)}`; `st` counts steps from its start, `s.bpm` is its tempo. Pieces keep their
  own wandering state on the object (`ph`, `wph`, `ch`, `mi`...); `songStarted` clears the phrase state.
- Buses: `chillG` (faded) holds `warm` (3.2 kHz lowpass: lofi, piano, crackle, hall return) and `envG` (6.5 kHz: the site
  pieces, with its tape echo `echoIn`); `intG` has its own echo `echoInt`. `mkOut(bus, hallSend, echoSend)` makes an
  instrument output. Nothing here allocates per frame in the 3D sense; the scheduler builds nodes 0.3–0.5 s ahead.
- `Math.random` is allowed in this file (music); the sim never reads it. `?song=` and `?upset=` are listening aids.
- Checks: `tools/musictest.py` (schedules every step of every piece in the page, then plays each site's first pieces and
  the upset pieces for a few seconds and reads the output level) and `tools/musicrec.py` (records a piece to MP3).

## Device autotest (`?autotest`)

Open any build with `?autotest` (for example `index.html?autotest`) to run a hands-free performance test, about
70 s on a phone. It starts a season on a fixed seed (no tutorial, event cards or leaderboard; nothing is saved),
turns the low-FPS fallback off so builds compare at the same settings, then measures:

- **Normal play** (20 s after 8 s settling): FPS, p50/p95/p99 frame times, frames over 33/50 ms, worst frame, JS ms
  per frame, draws, triangles, shader programs before and after (should not grow), and time per frame section.
- **Shadows off, half resolution, 3D render skipped** (5 s each): which limit the phone hits. Render skipped also
  gives the display's refresh rate.
- **All upsets at once** (15 s): the worst case.
- **Sim checksum:** replays 3 sim days on the fixed seed and hashes the results. It only changes when the sim's
  logic changes; `&expect=<hash>` shows PASS or FAIL.

The results page has a **Copy results** button (the full JSON, including every frame time for normal play and
upsets). Options: `scale=0.5` shortens every phase, `speed=` sim minutes per second (default 10, the game's
default), `seed=`, `fallback` keeps the low-FPS fallback on. `tools/autotest.py index.html` runs it headless.

## three.js (r186) notes

- **Color management is off** (`THREE.ColorManagement.enabled=false`) to keep r128's color behavior. Code that wants an sRGB color in linear space converts it itself (`lin()`, `convertSRGBToLinear`). Textures set `colorSpace=THREE.SRGBColorSpace`.
- **Light intensities are multiplied by `LEG` (π)** because r155+ removed the legacy light units. Any new light or intensity change needs it too.
- **`renderer.debug.checkShaderErrors` is false.** Otherwise first-draw error-log reads stall the GPU (a 2.4 s freeze when upsets first appear). Turn it on temporarily when editing a shader.
- **Draw-call stats now include the shadow pass.** The benchmark counts raw WebGL draws so numbers compare across versions.

## Tools (`tools/`)

Music: `musictest.py` and `musicrec.py` (see above). Needs Python 3 with Playwright (Chromium), and Node with `eslint@8`, `three@0.128.0` (for older builds) and `three@0.186.1` (in `t186/`) installed next to the scripts. The scripts serve three.js locally, so tests run offline.

- `suite.py index.html <label>`: the performance scorecard (~10 min). It runs `calib.py`, `audit.py` (desktop and phone), `hitches.py`, `phone.py` and `steady_high.py`. Add the result as a column in the project doc `paper-mill-benchmarks.md`.
- `latecompile.py index.html phone`: shader programs compiled after the start-up precompile (should be 0).
- `audiotap.py index.html`: audio contexts created on the first tap (Chromium can't reproduce iOS interruptions).
- `diagread.py index.html`: prints the top of the Diagnostics panel after 20 s of play.
- `phone.py a.html b.html … --shadows`: phone CPU and draws per frame, with shadows forced on so builds compare on equal graphics.
- `experiments.py index.html`: applies one change at a time (no blur, no labels, single-pass transparency, actors hidden, outlines hidden, shadows on), measures, then reverts.
- `allocprof.py index.html phone`: which functions allocate the most JS memory during play.
- `autotest.py index.html [scale] [--desktop] [--expect=hash]`: runs the in-page `?autotest` headless (phone emulation) and checks the results page, the Copy button and that nothing was saved.
- `quick.py index.html <label> [--env=urban] [--mill=7]`: the quick performance test (counts and timings, phone emulation, checksum).
- `clipcheck.py index.html [env] [mill] [seconds]`: runs a site with every upset and zen mode and fails if any person, vehicle,
  car or train stands inside scenery, or the camera dips into it.
- `topview.py index.html out.png "?env=desert&mill=7" [--half=330] [--persp]`: a top-down (or overview) render of a site.
- `econ.py index.html 15 [--env=swamp] [--bn=winder]`: hands-off seasons for a site, optionally with a forced bottleneck.
- `bench.py index.html <label> 3`: the older timing benchmark (also provides the shared test hook and local three.js routing the other scripts use).
- `smoke.py index.html`: drives every menu and panel plus a full 30-day season; fails on any page error.
- `determinism.py index.html`: two loads of the same season week must play out identically.
- `balance.py index.html 40`: average outcomes over 40 seasons, to confirm balance after sim changes.
- `idcheck.py index.html`: every element ID the code looks up exists.
- `nothree.py index.html`: with three.js unreachable, the page shows the no-3D screen without errors.
