# The Paper Mill: survival mode (v4.3.0-t1, 2026-10-13)

Status: built and checked on a local branch (`survival-mode`). Not released, not pushed. The online survival board
needs `supabase/survival.sql` run once in Supabase; until then survival scores stay on the device.

## The mode

- Main menu: **Survival**, under Play. A survival run is a season with no last day: $2.0M start, the chosen site, a random
  bottleneck, the week's dice, controls on AUTO, one upgrade a day, event cards, planned outages.
- **Waves** are the stretches between planned outages (every 7 days, 8 AM, 4 hours, same budget dialog). When an outage
  ends, the next wave starts.
- **Each wave** upsets are 20% more likely and fibre, energy and chemicals, and wages 10% dearer than the wave before.
  The steps compound, so the early waves change little.
- **The end** is bankruptcy at −$1.5M. **The score** is the time survived, shown as days, hours and minutes.
- **The four outage jobs repeat** after the fourth: press roll, forming fabric, pulper rotor, refiner plates.

| Wave | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|
| Upsets | ×1.00 | ×1.20 | ×1.44 | ×1.73 | ×2.07 | ×2.49 | ×3.58 | ×5.16 | ×7.43 | ×10.70 |
| Costs | ×1.00 | ×1.10 | ×1.21 | ×1.33 | ×1.46 | ×1.61 | ×1.95 | ×2.36 | ×2.85 | ×3.45 |

Wave 1 keeps the season's quiet start: no upsets on days 1 to 3 and a 25% calmer first week. The day-15 rough patch is
not used.

## Where the player sees the multipliers

A chip under the top bar for the whole run (wave, upsets ×, costs ×, time to the next outage); the clock label
("Wave 3 · Day 16"); the outage budget dialog (what the next wave brings); the wave report card that pops when an outage
ends; a banner and a log line at each wave; the Report tab; the game-over dialog.

## What it reuses

| Existing piece | In survival |
|---|---|
| `startSeason()` | `startSeason(true)`: the same start, `S.season.surv`, no end date |
| Outage planner, budgets, reliability, 3D crews | Unchanged. `outJob(k)` wraps the job number after 4 |
| `upsetMul()` | × `survUp()`; no rough patch |
| `applyUpgrades()`, `energyCost()`, labour line | × `P.costMul` (exactly 1 outside survival) |
| 10-day report cards | One card per wave, popped when the wave's outage ends |
| Season-over dialog | Time survived, wave reached, best on this device, final multipliers |
| Save and Continue | The same single slot; "Continue survival · wave N · day D" |
| Event cards | The same deck, dealt again once every card has been seen |
| Leaderboard dialog | Two tabs: Season (unchanged) and Survival (new table) |

New code: `src/js/03c-survival.js` (constants, multipliers) and `src/js/09b-survival.js` (wave change, chip, game over).

## Balance

`tools/survival.py`, whole runs to bankruptcy, sim only, fixed seeds (so every setting plays the same dice). Three players:
**hands-off** (declines cards, standard outage budgets, no upgrades), **buyer** (also buys one upgrade a day whenever it can
keep $250k, every upgrade in the game) and **saver** (the buyer, but it skips the dear capacity upgrades the line doesn't
need and banks the cash). Mean days survived (mean wave reached), 5 seeds each, forest valley:

| Per wave: upsets / costs | Growth | Hands-off | Buyer | Saver |
|---|---|---|---|---|
| +15% / +5% | added | 51 d (8) * | 245 d (36) * | |
| +15% / +10% | added | 44 d (7) | 125 d (18) | |
| +20% / +8% | added | 45 d (7) | 147 d (21) | |
| +25% / +10% | added | 42 d (7) | 121 d (18) | 138 d (20) |
| +30% / +12% | added | 38 d (6) | 101 d (15) | 111 d (16) |
| +15% / +7% | compound | 46 d (7) | 106 d (16) | 122 d (18) |
| +20% / +8% | compound | 41 d (7) | 91 d (13) | 103 d (15) |
| **+20% / +10%** | **compound** | **39 d (6)** | **80 d (12)** | **89 d (13)** |

\* 3 and 4 seeds.

- **Chosen: +20% upsets and +10% costs per wave, compounding.** A hands-off mill lasts about 39 days (35 to 43). A
  well-upgraded one lasts about 80 to 90 days (72 to 94): waves 12 to 14.
- The first plan was +15% / +5% added each wave. A fully upgraded mill then ran for 195 to 308 days, far too long for a
  scored mode, because upgrades roughly double output and cut the cost per ton.
- Costs are what end a run. An upgraded mill goes under once costs reach about ×2.5 to ×3; a hands-off one at about ×1.4 to ×1.6.
  Upsets alone (costs flat, +50% a wave) end a hands-off run in wave 7.
- The upset pressure does build: an upgraded mill sees about 8 incidents in wave 2 and 25 to 30 by waves 12 and 13.
- Other sites, 3 seeds each: hands-off 38 to 39 days, saver 88 days on city, desert and bayou. No site is easier.
- Real time: a wave is 17 minutes at the default 10 sim min/s, under 3 minutes at 60. A 13-wave run is about 3.6 hours
  at the default speed and about 36 minutes at 60, plus the dialogs. Save and Continue carries a run across sittings.

Crews use the non-3D path in these runs, as in `econ.py`, so real play is slightly harder.

## Checks

- Four full hands-off seasons (`econ.py`, fixed seeds) finish with the same books to the dollar as v4.2.5.
- `determinism.py`, `smoke.py`, `savecheck.py`, `settingscheck.py`, `idcheck.py`, `nothree.py` pass.
- `tools/survcheck.py` passes: menu start, chip and clock, first outage dialog, wave report card, multipliers applied
  (OCC price, energy cost, upset rate), save and continue, outages 2 to 5 with the fifth in 3D (job 1 again), Report tab
  in wave 6, bankruptcy, score, no online table (kept on the device), both leaderboard tabs, new run, free play, a
  season afterwards.

## To retune

Change `SURV.up`, `SURV.cost` or `SURV.compound` in `03c-survival.js`, rebuild, then run
`python3 tools/survival.py index.html 5 --bot=handsoff` and `--bot=saver`. `--up`, `--cost` and `--compound` try a
setting without editing. Every run has to end well before `--maxdays`.

## Open points

- Run `supabase/survival.sql` in the Supabase SQL editor to turn the online survival board on.
- The save slot is shared: starting a survival run replaces a saved season, and the other way round.
- Upset growth is softened late in a run by the existing rule that a third upset is 75% less likely while two are active.
- Sheet breaks and hayouts are not multiplied directly; they rise through the upsets that cause them.
- Event-card perks that last for good (price, energy, speed) can be won again on later passes through the deck.
