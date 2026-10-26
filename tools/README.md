# The Paper Mill: tools

Everything here runs the built game (`index.html`) in headless Chromium, offline: `lib.py` serves the page and three.js
locally and answers the leaderboard with an empty list.

**Setup (once):** Python 3 with Playwright (Chromium), then in `tools/`:
`npm i three@0.128.0` (old builds only) and `mkdir t186 && cd t186 && npm i three@0.186.1` (current builds).
Lint (release review): `npx -y eslint@8 --no-eslintrc -c eslintrc.json <game.js>`.

## Regression checks: `run_checks.py` and `checks/`

```
python3 run_checks.py                      # every default check against ../index.html, 2 at a time
python3 run_checks.py --build              # rebuild index.html from src/ first
python3 run_checks.py --tier=quick         # smoke, determinism, save, basics: after any change
python3 run_checks.py --tier=full          # also the slow ones (music, in-game autotest): before a release
python3 run_checks.py --only=dcs,process   # just these
python3 checks/dcs.py ../index.html        # one check on its own (add a folder to some for screenshots)
```

One line per check, then a summary; exit code 0 only when every check passed. Full output of each check is in
`check-logs/<check>.log`. Keep `-j 2` on a 2-CPU machine: more slows the real-time waits past their limits.

| Check | Tier | Covers | Replaced (old scripts) |
|---|---|---|---|
| `smoke` | quick | every menu and panel, a full 30-day season, zen, free play, leaderboard, rename, reset | smoke, smoke51 |
| `determinism` | quick | two loads of the same season week play out identically | determinism |
| `save` | quick | save and continue: exact continuation, Continue button, hidden page, bad saves | savecheck, savecheck51 |
| `basics` | quick | every element id the code looks up exists; three.js unreachable shows the no-3D screen | idcheck, nothree |
| `speed` | default | player's speed through outages, Watch the crews, Settings tab, season locks | speedcheck, v506check, settingscheck |
| `regressions` | default | standing QA fixes (v4 repair/pricing, v5.1 QA rounds) | fixcheck, fixcheck2, econfix |
| `civics` | default | civics meters, choice cards, leaders in seasons | civcheck |
| `survival_mode` | default | a survival run from the menu to the leaderboard | survcheck |
| `tells` | default | tells, daily Round, Vibration Report, outage prep | tellcheck |
| `help` | default | help page, glossary, tutorial link | helpcheck |
| `knobs` | default | every fiddly knob and the pairs; no late shader compiles | knobcheck, knobshaders |
| `dcs` | default | SPOT / WET / DET / UTIL screens, making-beater alerts | dcscheck, dcs654check |
| `control` | default | control room screens, trends, relationship map | controlcheck, relmapcheck |
| `pflow` | default | process flow overview books and views | pflowcheck |
| `popout` | default | second-screen pop-outs | popoutcheck |
| `process` | default | dryer limit, quality specs, dewatering chain, mass balance, winder, orders and bales, process relationships, refiners | dryercheck, qualcheck, dewatercheck, watercheck, windercheck, ordercheck, relcheck, refcheck |
| `valves` | default | the six control loops, tuning, bump tests | valvecheck |
| `reliability` | default | motors and drives, rounds, MCC, drive faults | rlycheck |
| `steamsheet` | default | v6.13: dryer cans and syphons, PDC-304, the hood and fog fan, energy, J/W and STFI, broke chest, turn-ups, break risk, profile, the new screens | |
| `zen` | default | every scripted zen shot runs | zencheck |
| `music` | slow | every piece schedules and is audible | musictest |
| `autotest` | slow | the in-game `?autotest` page headless | autotest |

**Writing a check:** start from any file in `checks/`: `from lib import *`, `C = Checks()`, one function per area that
opens its own page with `open_game()`, assertions with `C.ok(name, cond, detail)`, and `C.done()` at the end (prints the
`RESULT:` line `run_checks.py` reads and sets the exit code). Sim-only sections boot with `LITE` in the query
(low graphics, no static batching: ~2 s instead of ~9 s). Add assertions to the check for the feature you changed;
don't add a new version-named check.

## Other tools

- `perf/`: `quick.py` (quick phone performance test and sim checksum), `bench.py` (timing benchmark), `fpsbench.py` +
  `pmbench.py` (before/after frame cost), `latecompile.py` (shader programs compiled after start-up; should be 0),
  `drawcost.py` (what each draw costs), `allocprof.py` (what allocates).
- `balance/`: `qa_balance.py` (scripted play styles over many seasons, or survival runs with `--mode=survival`; it
  answers civics cards, deals and outage budgets through the real dialogs), `qa_v610.py` (full Season / Survival playthroughs through
  the real UI, optionally posting to the live boards).
- `util/`: `titleart.py` (packs the title backgrounds into `src/js/50a-title-art.js`), `topview.py` / `gridview.py`
  (top-down layout renders), `clipcheck.py` (nothing stands inside scenery), `sightshots.py` (rare-sight stills),
  `musicrec.py` (records the music), `tellprobe.py` (run a JS snippet against a started game).
