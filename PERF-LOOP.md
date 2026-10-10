# The Paper Mill: performance loop (from 2026-10-10)

Goal: industry-leading graphics resource use on phones. Each iteration: pick the biggest gap, let 2–3 agents compete
on it in separate worktrees, judge with the quick test plus correctness checks, ship the winner as `test/vN/`, record
it here. The live game (`index.html` at the root of main) stays v4.0.1; only `test/vN/` folders go to main. Source
changes live on branch `perf-loop`.

## Quick test

```
cd tools && python3 quick.py <index.html> <label>      # ~2 min, phone emulation; writes quick-<label>.json
```
One phone-emulated load (390x844 @1x, touch; seeded; low-FPS fallback off; 30 sim-min/s). Normal play (8 s settle,
12 s measured), then every upset at once (3 s settle, 12 s measured), then the in-game sim checksum (must be
`96960821`). Counts (draws, programs, paints, page writes, overlay nodes) compare across sessions directly; ms values
are this machine only, so compare them within one session.

Device version: `https://mattserrao.github.io/the-paper-mill/test/vN/?autotest&quick&expect=96960821` (~30 s on a
phone: normal 8 s, all upsets 10 s, all upsets with HTML overlays hidden 4 s, short GPU probe, checksum).

## Targets

| Metric | v4.0.1 | Target |
|---|---|---|
| Paints per frame, all upsets | 12.1 | ≤ 1 |
| Browser render work per frame, all upsets (ms, here) | 2.57 | ≤ normal play (~1.0) |
| Main-pass draws, normal / all upsets | 254 / 491 | ≤ 150 / ≤ 250 |
| Shadow-pass draws per refresh | 141 | ≤ 60 |
| Shader programs | 104 | ≤ 60 |
| Phone, all upsets | 43–60 FPS (iPhone, labels shown) | steady 60, p99 ≤ 18 ms |

## Trend (quick test, all-upsets phase unless noted)

| Build | Change | Paints / frame | Browser ms / frame | Page writes / frame | Overlay nodes | Draws main (normal / upsets) | Shadow draws | Programs | Checksum | Device |
|---|---|---|---|---|---|---|---|---|---|---|
| v4.0.1 | live game, baseline | 12.1 | 2.57 | 36.6 | 60 | 254 / 491 | 141 | 104–106 | PASS | iPhone v8: 43–60 FPS upsets |
| **v9** | moving labels drawn on one Canvas2D overlay (candidate B) | **1.2** | **1.45** | **14.9** | 32 | 246 / 496 | 140 | 107 | PASS | not run ¹ |

1. The Pixel 8 over scrcpy wasn't reachable: this chat wasn't linked to a computer.

## Iteration log

### v9 (2026-10-10): HTML overlay cost

Three approaches competed:

| Candidate | Approach | Paints / frame | Browser ms / frame | Page writes / frame | Checks | Result |
|---|---|---|---|---|---|---|
| A | keep DOM labels, give each a compositor layer; fix a page-wide `:has()` restyle; diff the chips row; no bob or shake on labels | 1.4–1.6 | 1.6–1.8 | 20–23 | all pass | runner-up |
| **B** | one Canvas2D overlay for section and incident labels; cached pills; tap hit-test | **1.3** | **1.5** | **15.5** | all pass | **shipped** |
| C | WebGL sprite labels, one draw | 1.5 | 1.44 | – | checksum only | stopped (unfinished) |

What caused the cost (A's trace): incident labels followed the bobbing pins, so every label moved and repainted every
frame; each inline style write restyled the whole page through `html:has(body.app)`; the chips row was rebuilt on
each change; the banner rewrote its class every 200 ms. B removes the moving labels from the DOM entirely. A's
`:has()`, chips and banner fixes still apply to the HTML that remains and are on branch
`worktree-agent-a9257bb7a15f32def` (commit 3cd8b60) for a later build.

v9 checks on the shipped file: quick test, `?autotest&quick` (headless), smoke, determinism: all pass. Live page
unchanged (738,351 bytes, v4.0.1).

**Next:** draws with every upset active (246 → 496), then the shadow pass and shader programs.

## Release v4.0.2 (2026-10-10)

Live at the root (merge cebb966): v9's canvas labels plus the v10 economy, with test features off (`TURBO=false`,
speed max 120; autotest only behind `?autotest`). Checksum `810f617a`; smoke, determinism, id check, no-3D screen
pass. Device run still pending.
