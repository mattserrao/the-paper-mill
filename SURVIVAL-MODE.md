# The Paper Mill: survival mode and mill leaders (v4.4.0-t3, 2026-10-13)

Status: built and checked on the test branch `survival-mode` (not merged into main), with mill leaders added in v4.4.0-t1, painted portraits in v4.4.0-t2 and fixes in v4.4.0-t3. Not released. The online survival board
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
not used (and from v4.4.0-t3 seasons don't have it either).

## Where the player sees the multipliers

A chip under the top bar for the whole run (wave, upsets ×, costs ×, time to the next outage); the clock label
("Wave 3 · Day 16"); the outage budget dialog (what the next wave brings); the wave report card that pops when an outage
ends; a banner and a log line at each wave; the Report tab; the game-over dialog.

## Mill leaders (v4.4)

A survival run has one mill leader, picked after the site and before the run starts. Each is strong on one side of the
mill and costs you on another. At every planned outage the leader makes one pick in the budget dialog; it takes effect
when the outage ends. Picks stack and stay with the mill.

| Leader | Role | At each outage (stays with the mill) | Cost |
|---|---|---|---|
| **Chip Kraftwell**, the dealmaker | Business man | A fibre contract (fibre −1.5%) or a sales push (+$5/t on every grade) | Every deal ends in a pay settlement: wages +5% for good. Call-offs and dock brawls 2× as often while he's in charge |
| **Dot "Doc" Blade**, the millwright | Mechanic | No pick. Fix it now, once per cycle: ends one breakdown on the spot, returns its repair bill, and that breakdown never comes back | Repair bills +10% while she's in charge |
| **Felicity Fourdrinier**, the process engineer | Engineer | A project: stock prep (fibre −1.5%), wet end (sheet breaks −8%) or dry end (energy −2.5%). Each also cuts that area's breakdowns 8% | Every project adds $40/h of project staff for good |
| **Hank Headbox**, the machine tender | Operator | Push for tons (+70 fpm top speed) or run it clean (sheet breaks and hayouts −15%) | Energy +4% and fibre +1% while he's in charge |

**Changing leader.** Once per run, in an outage budget dialog. The new leader takes over as that outage starts, makes
that outage's pick, and has no waiting period. Everything the old leader built stays, with the cost that came with it
(pay settlements, project staff, the fixed-for-good list). The while-in-charge drawback leaves with the old leader.

**Where the player sees it.** The picker (four cards with painted portraits; the images are embedded, in `09c-leader-art.js`), the leader's face on the wave chip, the leader card
(tap the chip: who they are, what the mill has kept, Dot's fix list), the leader row in the outage dialog, the Reliability
view and the game-over dialog. The leader is not on the leaderboard.

**Balance.** `tools/survival.py`, 10 fixed seeds each, forest valley. Days survived, and the gain over the same ten runs
with no leader (standard error of the gain in brackets):

| Leader | Saver bot | Gain | Hands-off bot | Gain |
|---|---|---|---|---|
| none | 84.4 d | | 37.6 d | |
| Chip | 87.4 d | +3.1 (1.7) | 38.9 d | +1.3 (0.6) |
| Dot | 86.5 d | +2.2 (2.2) | 45.5 d | +8.0 (1.2) |
| Felicity | 88.4 d | +4.0 (1.9) | 39.2 d | +1.7 (0.7) |
| Hank | 89.1 d | +4.7 (3.0) | 36.9 d | −0.7 (0.2) |

- For a mill that buys its upgrades, the four are within 2.5 days of each other and each is worth 2 to 5 days.
- For a mill that buys nothing, Dot is far ahead: its repair bills are large and uninsured, so getting one back each
  cycle is worth about a wave. Hank is slightly negative there: a bottlenecked line can't use the speed.
- One change of leader, used well, is worth a little more than staying: Hank then Chip from outage 6 gave +6.5 (3.1);
  Felicity then Chip from outage 7 gave +3.9 (1.6).
- The bots play each leader one fixed way (Chip: three sales pushes then fibre; Felicity and Hank: picks in turn; Dot:
  the first breakdown with a bill of $120k or more). A player who picks well should do somewhat better.

**What simulation changed from the first plan.**
- Reliability-only boosts are worth almost nothing late in a run: upsets crowd each other out (a third upset is 75% less
  likely while two are active), so fewer of one kind makes room for another. Felicity's projects therefore also save
  fibre or energy, and Dot's fix returns the bill and is permanent.
- Extra tons are worth little late: from about wave 11 an upgraded mill's fibre and energy per ton cost more than the
  paper sells for. Hank's gains are large and his drawback is flat, so he pays off in the first two thirds of a run.
- Wages are a small line (about $40k a wave at the start), so Felicity's cost is a fixed payroll per project, and Chip's
  is a percentage that compounds with his deals.
- First numbers tried, saver bot: Chip at fibre −3% / +$7 was +14 days; Felicity at breakdowns −8% only with $120/h per
  project was −12; Hank at +30 fpm / −8% with energy +5% and +2% per pick was −8; Dot with no bill back and +15% on
  bills and outage budgets was −7.

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

Leaders: change `LEAD` in `03d-leaders.js` (or try values with `--set=key=value`), then run
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
