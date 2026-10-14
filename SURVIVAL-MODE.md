# The Paper Mill: survival mode and mill leaders (v5.0.0, 2026-10-13)

Status: released in v5.0.0 Survival (2026-10-13), from the test branch `test/survival-v4.4` (v4.3.0-t1 to v4.4.0-t3). The online survival board
needs `supabase/survival.sql` run once in Supabase; until then survival scores stay on the device.

## The mode

- Main menu: **Survival**, under Play. A survival run is a season with no last day: $2.0M start, the chosen site, a random
  bottleneck, the week's dice, controls on AUTO, one upgrade a day, event cards, planned outages.
- **Waves** are the stretches between planned outages (every 4 days from v4.4.0-t3, was 7; 8 AM, 4 hours, same budget dialog). When an outage
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
not used (and from v4.4.0-t3 seasons don't have it either).

## Where the player sees the multipliers

A chip under the top bar for the whole run (wave, upsets ×, costs ×, time to the next outage); the clock label
("Wave 3 · Day 16"); the outage budget dialog (what the next wave brings); the wave report card that pops when an outage
ends; a banner and a log line at each wave; the Report tab; the game-over dialog.

## 4-day waves (v4.4.0-t3)

Outages, and so waves, come every 4 days instead of 7, with the same steps per wave. With no leader a run lasts about
25 days hands-off and 33–35 days for the saver bot (10 seeds, forest valley). Wave 1 is mostly the quiet start-up (no
upsets on days 1 to 3). A wave is about 10 real minutes at the default speed, so a run is roughly 1 to 1.5 hours.

## Mill leaders (v4.4, redesigned in v4.4.0-t3)

A survival run has one mill leader, picked after the site and before the run starts. Each takes on one survival pressure
and has a cost the player can see. At every planned outage the leader makes one pick in the budget dialog (Dot has none);
it takes effect when the outage ends, and it stays with the mill.

| Leader | Takes on | At each outage (stays with the mill) | Always, while in charge | Cost |
|---|---|---|---|---|
| **Chip Kraftwell**, the dealmaker (business man) | Rising costs | **Fibre lock**: the next wave's fibre at this wave's price (one wave), or a **sales push**: +$7/t on every grade (stays) | | Every deal: wages +5% for good. Call-offs and dock brawls 2× as often |
| **Dot "Doc" Blade**, the millwright (mechanic) | Breakdowns | No pick. **Her fix** (automatic from v5.0.4), once per cycle: each breakdown with a bill of $100k+ has a 50% chance as it starts (v5.0.5); it ends, 60% of its bill comes back, and it's fixed at the root (50% rarer from then on, stacking) | Repairs 10% quicker | Repair bills +5% (+15% before v5.0.4) |
| **Felicity Fourdrinier**, the process engineer | The bottleneck | A **debottlenecking project**: +6.5% capacity for the fibre line (receiving, pulper, screens), the paper machine, or finishing (winder, shipping) | | **Project tie-ins**: every outage overruns 20 min per project done so far (machine down) |
| **Hank Headbox**, the machine tender (operator) | Sheet breaks and hayouts | **Runnability**: breaks and hayouts −15% and back up 20% faster, or **dial in the dryers**: energy −5.5% | | **Runs the sheet heavy**: fibre +2% (basis-weight giveaway) |

**Why the redesign.** With 4-day waves the v4.4.0-t1 leaders came apart: Dot gained about 11 days because her "fixed for
good" breakdowns piled up twice as fast, and Hank's speed did nothing for a mill whose bottleneck is elsewhere. The new set
gives each leader its own pressure, keeps most of the value in what they do while in charge, and replaces costs players
couldn't see (Felicity's payroll) with ones they can (outages that overrun).

**Changing leader.** Once per run, in an outage budget dialog. The new leader takes over as that outage starts, makes
that outage's pick, and has no waiting period. Everything the old leader built stays, with the cost that came with it
(pay settlements, project tie-ins, the fixed-at-the-root list). The while-in-charge effects leave with the old leader.

**Where the player sees it.** The picker (four cards with painted portraits; the images are embedded, in `09c-leader-art.js`), the leader's face on the wave chip, the leader card
(tap the chip: who they are, what the mill has kept, Dot's fix list), the leader row in the outage dialog, the Reliability
view and the game-over dialog. The leader is not on the leaderboard.

**Balance.** `tools/survival.py`, 10 fixed seeds each, forest valley, 4-day waves. Days survived, and the gain over the same
ten runs with no leader (standard error of the gain in brackets):

| Leader | Saver bot | Gain | Hands-off bot | Gain |
|---|---|---|---|---|
| none | 32.7 d | | 24.5 d | |
| Chip | 38.0 d | +5.3 (1.1) | 25.3 d | +0.8 (0.4) |
| Dot | 39.0 d | +6.3 (1.6) | 25.9 d | +1.4 (0.6) |
| Felicity | 38.5 d | +5.8 (1.7) | 25.0 d | +0.5 (0.3) |
| Hank | 36.3 d | +3.6 (0.7) | 24.7 d | +0.2 (0.1) |

- For a mill that buys its upgrades the four are within about 3 days of each other (inside the noise of 10 runs), each
  worth 3.5 to 6.5 days. For a mill that buys nothing, every leader is worth 0 to 1.5 days: leaders reward playing.
- The bots play each leader one fixed way. Chip: three sales pushes, then fibre locks. Felicity: each project goes to the
  area limiting the line at that moment. Hank: runnability and dryers in turn. Dot: the first breakdown with a bill of
  $120k or more. A player who picks well should do somewhat better.
- Tuning steps, saver bot gain: first draft (Dot full refund, repairs 15% quicker; Hank faster rethreads and run it clean,
  energy +4%; Felicity +5% / 45 min) gave Dot +7.6, Chip +4.6, Felicity +3.1, Hank −1.7. Halving Dot's refund cut her to
  +2.9; Hank only moved once he got a cost lever (dryer tuning) in place of a second break pick.
- Extra tons are worth less late in a run (fibre and energy per ton climb every wave), so Felicity's capacity matters most
  in the first half and her overruns cost more later.

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

With 10 seeds instead of 5, the chosen setting gives 37.6 days hands-off and 84.4 days for the saver (the baseline the
leader table above is measured against).

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
- `tools/survcheck.py` passes (it now starts through the leader picker and covers the outage pick, the change of leader,
  Fix it now, and no leader in the score): menu start, chip and clock, first outage dialog, wave report card, multipliers applied
  (OCC price, energy cost, upset rate), save and continue, outages 2 to 5 with the fifth in 3D (job 1 again), Report tab
  in wave 6, bankruptcy, score, no online table (kept on the device), both leaderboard tabs, new run, free play, a
  season afterwards.

## To retune

Leaders: change `LEAD` in `03d-leaders.js` (or try values with `--set=key=value`, e.g. `--set=refund=0.5,steam=0.04`), then run
`python3 tools/survival.py index.html 10 --bot=saver --leader=chip` for each leader and for `--leader=none`, and the same
with `--bot=handsoff`. Compare runs seed by seed; with 10 seeds a difference under about 4 days is noise.

Waves: change `SURV.up`, `SURV.cost` or `SURV.compound` in `03c-survival.js`, rebuild, then run
`python3 tools/survival.py index.html 5 --bot=handsoff` and `--bot=saver`. `--up`, `--cost` and `--compound` try a
setting without editing. Every run has to end well before `--maxdays`.

## Open points

- Run `supabase/survival.sql` in the Supabase SQL editor to turn the online survival board on (no leader column). Until
  then survival scores stay on the device.
- Dot is much the strongest leader for a mill that buys no upgrades (+8 days against +1 to +2). Halving the bill she
  returns would narrow that, at the cost of making her the weakest for an upgraded mill.
- Hank's speed gains are permanent, and in the last waves of a run extra tons lose money.
- The save slot is shared: starting a survival run replaces a saved season, and the other way round.
- Upset growth is softened late in a run by the existing rule that a third upset is 75% less likely while two are active.
- Sheet breaks and hayouts are not multiplied directly; they rise through the upsets that cause them.
- Event-card perks that last for good (price, energy, speed) can be won again on later passes through the deck.
