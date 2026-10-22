# Changelog

## v6.11.3-t1 (2026-10-22): repo cleanup (test build, test/v6.11.3-cleanup)
Housekeeping only; nothing in the game changes apart from the version-notes pop-up. From the repo audit (`claude/repo-audit-v6112.md` in the Project).
- **Removed:** `test/v5.0.4/index.html` (1.3 MB, referenced by nothing; `test/v0-original/` stays), `ECONOMY-BALANCE.md` and `PERF-LOOP.md` (both frozen at 2026-10-10: `tools/econ.py` and v4 prices, a perf log ending at v4.0.2), `supabase/mill-name-filter.sql` (replaced by `name-filter-v2.sql`) and `supabase/survival-4day-waves.sql` (the same `alter table` is already at the end of `survival.sql`). All still in git history at `416ec77` (main, v6.11.2).
- **QA bot:** `tools/balance/qa_v6112.py` is now `qa_play.py`, edited in place from here on; `qa_v610.py` and `qa_v6111.py` (two older copies, 16 and 23 lines apart) removed.
- **Harness:** `lib.py` no longer serves three.js r128 (only the deleted v5.0.4 build and older needed it); `tools/node_modules/` dropped from `.gitignore` and the `npm i three@0.128.0` step from `tools/README.md`.
- **Changelog:** v4.0.0 to v5.7.4 (39 entries, 87 KB) moved to `CHANGELOG-archive.md`.
- **Version notes:** the 54 test-build lines whose release line exists are dropped from `VERSION-NOTES.txt`, and `build.py` now leaves such lines out of the pop-up from now on (a test build with no release line yet still shows), so the player-facing list is releases only.
- Kept on purpose: `tools/blender/` and `tools/bl_dump.py` (nine model comments in `src/js` cite the `*_new.py` scripts as the design source), `SURVIVAL-MODE.md` (current).

## v6.11.2 (2026-10-22): Sold by Area and Metered Power
Release of v6.11.2-t1 to t6 (below), merged from test/v6.11.2. Full regression suite: 22/22 checks (833 assertions).

## v6.11.2-t6 (2026-10-22): QA round (test build, test/v6.11.2)
QA: 50 seasons and 50 survival runs by the bots (5 styles, 4 maps, 4 leaders, not posted): 0 page errors, stuck cards, NaN or ledger mismatches. Same-seed balance against main and per leader. Report: project doc `claude/qa-v6112.md`.
- **Season grade counts the money:** half operations (the report cards), half a profit band (A ≥ +$2M, B ≥ +$1M, C ≥ $0, D ≥ −$1M, F below), rounded toward the worse; the summary shows both parts. QA had an A ("Bonus secured") on a $859k loss and a B on a $2.2M loss.
- **Known defects view:** early-warning findings (imbalance, misalignment, outer race, ADX Watch) get a small faded pin with no pulse, labelled once zoomed in; serious ones (inner race, imminent, ADX Alarm) and tells spotted on rounds keep the full bullseye. The chip and the Rounds button count serious and early apart.
- **DE pulper:** sized to the sheet (25 min of the sheet at threading speed, the outlet pump moves 80% of it; trim goes straight through), so a break fills it at the same pace on any grade. At 85% a high-level alarm (feed line, the DET level reading turns amber, red at 97%); at 97% it overflows to the floor drains: a $12k cleanup and the fiber to the sewer and clarifier. QA: 4–7 alarms and about one overflow a season.
- **Repair bills 12.5% lower** (`REPAIR_K` 1.2 → 1.05).
- **Hank:** while he's in charge, sheet breaks and hayouts are 30% rarer and clear 25% faster; runs heavy now costs fiber +1% (was 2%). Seasons (rounds, same seeds): Hank $2.27M → $2.35M (Dot $2.61M); survival unchanged at ~35 days (Chip 35.6, Dot 37.3, Fel 35.0).
- Checks: dcs (DE pulper alarm, overflow and alarm colour), survival_mode (REPAIR_K, Hank's +1%, the steam bill follows the grade). Harness: `tools/balance/qa_v6112.py`.

## v6.11.2-t5 (2026-10-22): vehicles and polish (test build, test/v6.11.2)
- **New vehicle models** (designed in Blender, rebuilt in code from its profiles; parts merged per material): a step-van **food truck** (raked nose, serving hatch, counter, awning, roof vent); a GP-style **locomotive** (chamfered long hood, taller cab with wrap glazing, raked short hood, fuel tank, brake blister, pilots, handrails) and boxcars with end ladders and a roof walk; **staff cars** as sedans and SUVs with wheels and bumpers; and a Broderson-style **carry-deck crane** for the pulper job (low chassis, cab beside the boom, slewing turret with counterweight, three-section tapered telescopic boom). Meshes: truck 12→6, crane 46→28, train 137→70, cars 72→72 with paint materials 24→10; about +3,600 triangles in all, mostly car wheels.
- **Warehouse annexes** are roofed walls: the props south of the warehouse move out ahead of each annex, the wall between opens, and the robot or clamp forks store rolls in the annex bays.
- **Warehouse door:** a personnel door at the north end of the east wall, with an exit sign.
- **Shift change walkers** no longer cut through walls: path searches finish before they move, the shop has a real doorway, and their targets hold still.
- **Uncle Brian** stays with his scrubber and can be tapped for a ride-along again.
- **MCC room light:** a wall pack on the north-east wall lights the floor.
- **Beater bay** can be tapped for the tons of beater waiting to be repulped and the rolls in the bay. With robot forks the rolls still go to receiving (robots cover the clamp jobs), and the outbound lamp goes dark once outbound is robotic.
- **Known defects view** (Rounds card): greys the plant and drops labelled bullseye pins on tells spotted on rounds and on vibration (mechanical, orange) and ADX (electrical, blue) findings.
- **DE pulper on the DET DCS:** level, consistency and the broke going in (trim plus dryer-section breaks); no operator control.
- Checks: dcs (DE pulper readings; DET still has 6 page boxes, the pulper is plain equipment; its test waits for the machine to be back at speed).

## v6.11.2-t4 (2026-10-22): small improvements (test build, test/v6.11.2)
- **Drives re-rated** for a ~35 t/h recycled linerboard machine: refiners 2,000 kW each (2,600 with the upgrade), dryer section 1,500, couch 400, presses 450, reel 200, winder 750; pulper (1,100) and fan pump (900) unchanged.
- **Electricity is metered** (07i `pwrTick`): the ten drives at their load plus the balance of plant (vacuum, pumps, agitators, fans, air, lighting; 6.4 MW running, 75% on a break, 35% stopped, 15% in an outage) at $0.07/kWh, about 12.5 MW and 390 kWh/t on a normal run. The per-ton bill is now steam and chemicals only. Calibrated to the old flat bill: a calm run $90.4/t vs $90.7; a chaotic week $121.9 vs $123.9 (stops now draw what a stopped mill draws). The separate refining kWh charge is gone (the refiner drives are metered); APC's 4% and survival's cost multiplier apply to power; the shoe press and the leader's dryer tuning stay steam savings. Glossary: Electricity.
- **Dry strength starch removed** (DCS row, tags, ring crush and couch links, deposits, traces, relationship map, help and glossary). The chemicals and water budget stays $25/t; the starch's $3.30/t is part of the base. At its standard dose it changed nothing, so the balance doesn't move.
- **Spare spool stand:** three spools on two rails at their journals, west of the winder on the crane's line, so the crane fetches one by travelling east–west only. The old floor rack reached into the unwind stand and the parked reels.
- **Roll warehouse:** the south wall's top half lifts and fades with the roof in the cutaway, leaving a half wall so the floor and rolls show.
- **Removed** the OCC compactor, its dumpster and the recycling cage west of the office (the production record board stays).
- **Fixed:** the night lamp pools were built before their planes had a position, so all ten were drawn as one upright 16 m warm glow at the world origin (the drive side behind the reel) from dusk to dawn; and a scenery activity vehicle sat at the origin until its first wait ended.
- Checks: chem (polymer only), dcs (WET order), reliability (new ratings), process (metered power by state; the crane gets 2 min to settle).

## v6.11.2-t3 (2026-10-22): test suite green (test build, test/v6.11.2)
- **Fixed: reel storage could read full with only 3 of 4 reels stored.** A turn-up moved the whole reel, including the step's few hundred kilos past 100 t, to the winder, and the reel count (tons ÷ 100, rounded up) then counted a reel too many, so the machine went onto spools a reel early. A turn-up now takes exactly one jumbo; the overshoot starts the next reel.
- **Tornado damage is sudden by design:** its two random upsets still fire at once with no tell, even tellable ones; they are now marked (`by:"tornado"`) so the tells check can tell them apart.
- Checks: tells looks at every new incident (not only the last) and skips tornado damage; the water check uses a 60-minute machine stop so the restart lands in its window; the control check forces one sheet break so speed and tons have something to correlate; the knobs check's 3D taps wait for the camera to settle.

## v6.11.2-t2 (2026-10-22): minor updates (test build, test/v6.11.2)
- **DET DCS: 2nd and 3rd section steam** are on the setpoint list (PV-302 / PV-303). On CAS the reel moisture loop (QC-300) sets them; dragging one takes it off CAS onto AUTO at that pressure, and the CAS button hands it back.
- **Setpoints in process order**, under headings. WET: thick stock to the headbox (grade, dry strength, basis weight, retention polymer), headbox (dilution zones, slice opening, slice lip), forming table (machine speed, vacuum, couch pit agitator), press section (press loading). DET: press to dryers (draw), dryer steam (1st, 2nd, 3rd section), reel and winder.
- **Yard and warehouse crews no longer leave their trucks for a sheet break or a hayout**: receiving and truck loading carry on (before, both stopped while the crew rethreaded).
- **The MCC desk computer** is a tap target that opens the Drives page.
- **The SPOT console** moved from under the wet-end pipe racks to the north-west corner of the stock prep pad, by the effluent transfer tank, where the camera can see it.
- **Cloudy and clear seal chest labels** turned 90° onto the west face; on the south face each chest hid the other's label.

## v6.11.2-t1 (2026-10-22): sold by area (test build, test/v6.11.2)
- **Paper is sold by area (MSF, thousand ft²)**, as box plants buy it. List price ($/t) is for a ton at the grade's target basis weight; a ton made lighter covers more ft² and sells for list × target weight ÷ actual weight, a heavier one for less (full 1:1, no extra heavy penalty). 5% light ≈ +5.3% a ton; 3% heavy ≈ −2.9%.
- Everything the player sees stays in tons. Each lot carries an area ratio stamped at the reel from the true basis weight (`areaNow`, 07g), blended by quantity through reel → winder → conveyor → warehouse → truck (06 `lotPut`/`lotTake`/`lotA`); the invoice applies it when a truck leaves (05b `ordDepart`, the zen truck path and the spot-sale card via `lotValue`). Chargebacks and the spot discount stay per ton. Old saves' lots sell at list.
- **The v6.8 lightweight premium is retired** (half the trim, max 5%, paid as paper was made), so a light ton isn't paid twice. The trim range is unchanged (−10% to +5%).
- **Weight credit** shown on the WET DCS basis weight line, the QCS panel and the `prem` QCS tag (now "Weight credit (sold by area)", can go negative); the KPI strip and process flow show the effective $/t (list kept alongside in the process flow).
- **Planning screen:** "Area a roll" (MSF in the roll being wound, weight credit, effective $/t) and "Shipped by area" (MSF shipped, MSF/t and the average weight credit).
- Relationship map (basis weight → weight credit → profit), help and glossary (MSF, Weight credit; the lightweight premium entries replaced) updated. Economy not yet rebalanced.

## v6.11.1 (2026-10-21): The Dryer Hood and Wet-End Chemicals
Release of v6.11.1-t1 to t4 (below), merged from test/v6.11.1-hood.

## v6.11.1-t4 (2026-10-21): effluent in permit (test build, test/v6.11.1-hood)
- **The clarifier catches 99.71% of the solids** (was 98.8%), so a normal run's effluent is about 25 mg/L TSS (p99 ~35) under the 50 mg/L permit; before, it sat around 120 and the TSS HI alarm stayed lit.
- **The polymer's permit breach follows the reading:** TSS held over 50 mg/L for an hour while the polymer is under its standard (about a third of the standard dose or less) fines the mill; the permit-risk warning shows under 0.15 kg/t.

## v6.11.1-t3 (2026-10-21): QA round (test build, test/v6.11.1-hood)
50 season and 50 survival bot playthroughs (no page errors, every ledger reconciled) and same-seed balance runs against main and v6.10.2 (`claude/qa-v6111.md`).
- **Economy: every upgrade 20% cheaper** (`UP_COSTK`, 03b `upCost`). Since v6.11.0 (the deckle at +1.5% tons a level, trim) smart buying added only ~$0.2M a season over rounds alone; at 80% it adds ~$0.95M again (rounds + shop +$2.39M → +$3.14M a season; hands-off and rounds unchanged; survival active 45.0 → 47.6 days).
- **Chemical pumps: a ratio setpoint on AUTO.** On AUTO the WET DCS slider sets the kg/t the pump is flow-paced at (standard = no extra cost); the button switches to MANUAL (the slider is then the pump's kg/h). A crew trace sets the ratio back to the standard. (QA: a MANUAL pump set to 8 kg/t on day 1 had drifted to ~6 kg/t by day 30 as the tons rose.)
- **Permit-risk warning:** the polymer row and a WET alarm warn when the dose is under 0.2 kg/t.
- **Fixed:** an outage notice could sit over the season summary or the survival game-over screen.

## v6.11.1-t2 (2026-10-21): wet-end chemicals (test build, test/v6.11.1-hood)
- **Dry strength (cationic starch)** and a **retention polymer** on the WET DCS (`07l-chem.js`), in every mode but zen. Both come out of the existing $25/t chemicals and water budget: starch 6 kg/t × $0.55 = $3.30/t and polymer 0.3 kg/t × $3.50 = $1.05/t at standard, so on AUTO nothing changes and nothing extra is charged.
- **AUTO is flow-paced**: the pump follows the tons at the standard kg/t and stops on a break. **MANUAL** (drag the pump, or the AUTO button) holds a fixed kg/h, so the dose moves with the tons; on a break the chemical keeps going to the sewer, and the restart gets an overdose.
- **More starch:** more ring crush (+2.7% at 10 kg/t, +4.3% at 15), so AUTO-LW trims the weight lighter for the lightweight premium, and a drier couch (less steam). Over 10 kg/t: deposits (more breaks and slime). None: ring crush fails. **More polymer:** first pass retention up from 85% (fiber loss to the sewer down, more tons a ton of fiber, lower TSS). Over 0.5 kg/t: flocs, part of the reel to the beater. Under about half the standard for an hour: a permit breach.
- The process engineer traces flocs, deposits and weak paper back and puts that pump on AUTO; the environmental engineer does after a permit breach.
- Tags (dose, pump, first pass retention), WET alarms, relationship map links, help and glossary (dry strength, retention polymer, first pass retention, flow-paced control); new check `tools/checks/chem.py`.

## v6.11.1-t1 (2026-10-21): the dryer hood front (test build, test/v6.11.1-hood)
- **A closed dryer hood** (designed in Blender, `tools/blender/hood_front_new.py`): the tending-side wall, the front half of the roof and the upper end walls now close the v6.11 cutaway, with **six lifting doors** on chains from a header along the top of their guides (two narrower ones each side of the crossover bridge, a fixed panel under it).
- The doors **go up on their own** on a sheet break or whenever the machine is down (incl. outages) with steam rolling out from under them, and drop again once the sheet is back on.
- **New fiddly knob, Dryer hood doors** (station under the tending-side catwalk; Season, Survival and Free Play): RAISED lifts the doors with a hiss, and 2 s after they are up the doors and the whole front section fly away like the roofs, leaving the cutaway view. CLOSED brings the front back, then drops the doors. While the machine runs with them up, the dryers use **4% more steam** (cost, the DCS steam reading and the boiler's load); the energy engineer can trace a high steam bill to it.
- Knobs view, help, glossary ("Dryer hood") and the relationship map (hood doors → steam) updated.

## v6.11.0 (2026-10-21): The Winder, Trim and CD Update
Release of v6.11.0-t1 and v6.11.0-t2 (below), merged from test/v6.11-blender.

## v6.11.0-t2 (2026-10-21): economy rebalance (test build)
- **Prices +2.5%** on every grade, to make up for the trim (v6.11.0-t1): 24 $642 → $658, 28 $662 → $679, 31 $680 → $697, 34Super $741 → $760 a ton.

## v6.11.0-t1 (2026-10-21): Blender redesign, the winder, trim and CD quality (test build, test/v6.11-blender)
**Art (designed and reviewed in Blender, built in the game's own code; kits in `tools/blender/`):**
- Headbox, press section framework and supports, a baked dryer hood cutaway, reel and winder stands, stock prep pipes coloured by what they carry, refiner details, folded-card building walls, the MCC interior, baked power house facades and roof plant, the clarifier and aeration basin, the water tower; workers (boots, gloves, belt, bigger hard hat), fork-trucks (LPG bottle, drive wheels, mast) and trucks (skirts, conspicuity tape, cab markers).
- **The winder:** unwind stand moved 2 m out, guide roll on load cells, bowed spreader roll, slitters (two edge trims and a centre slit) over a 3.3 m pass line, the web down under a lead-in roll and round the rear drum into the nip; twin rolls with wound ends and cores build under a rider roll that rides up its guide columns and lifts at each set change. The winder operator walks in under the running web about every 2 game hours with a flashlight (visual only).
- Fixed on the way: a moving multi-material mesh is split by the batcher; the winder rolls use one material and separate end caps (multi-material rolls washed out the whole mill's colours 30 s in).

**Trim and rolls at width (03g):**
- The web is 205" (+3" a level of the deckle upgrade, which was +6% tons; now +1.5% tons and rolls up to 1.5" wider). Sets are twin rolls of one width, 50"–100"; trim = web − 2 × width, at least 5". Trim goes to a new DE pulper and back to the stock chest; never sold.
- Orders carry a customer width (mostly wide) and an even number of rolls; a roll weighs 12.5 t × width/100. Lots, the warehouse, trucks and orders count standard-roll units, so tons conversions are unchanged. Order trucks load their order's width; spot trucks load surplus widths of a grade. The winder runs the width of the earliest-due order still short of rolls (by width, since orders of one width share their rolls), else the widest roll for spot.
- PLAN: the pattern now (2 × width, trim inches and %, trim t/h) and the widths to come; order rows show width and rolls of that width; inventory in tons. Process flow: a trim stream. Tags: roll width, trim %, trim t/h (relationship map entries).

**Quality per roll across the CD (07k):**
- 12 CD zones (drive side first). Zone moisture: dry edges, a slow wave, an occasional wandering wet streak, wet bands under a filled-in pick-up felt. Zone weight: a small natural streak plus the dilution zones knob.
- A zone out of spec beaters only the roll under it; a wet edge narrower than the edge trim is slit off with it. Whole-sheet problems (average weight, ring crush, color, grade change) still beater the set. CD streaks and felt stripes no longer take a share of the whole reel (outside zen).
- **Spray boom** (standard, after the dryers) brings dry zones up; **steam box** (new upgrade, $165k) dries wet zones and wet edges, +1.5 points couch solids, +40 fpm, uses some steam. Headbox dilution auto-trims weight streaks. Each AUTO by default, MAN per zone on the QCS CD section.
- Sim check over 6 days: about 2.2% of production to the beater from CD problems without the steam box, near 0 with it.

**Checks:** control (order rows have a Width column), process (the DE pulper repulps the trim with white water: the chest runs at or just under its overflow).

## v6.10.2 (2026-10-21): tests and tidy
No gameplay changes intended.
- **Tests:** one runner, `tools/run_checks.py` (`--tier=quick|default|full`, `--build`), over 21 checks in `tools/checks/` that replace 39 scripts; one shared harness, `tools/lib.py`, instead of exec()-ing bench.py. Tools sorted into `perf/`, `balance/` and `util/`; 95 dead or duplicate scripts removed, plus the pre-civics `econ.py` and `survival.py` (their bots never reached an outage). Stale expectations fixed (AUTO-LW weight and refining, the NV-101 trip window, music listening before the prewarm finished); sim checks pin the bottleneck. See `tools/README.md`.
- **Dead code:** the Bare graphics tier's leftovers removed (a saved "bare" pick now loads as Auto), plus unused variables, functions, styles and markup; the built game lints clean (was 42 warnings).

## v6.10.1 (2026-10-21): reliability polish
Release of v6.10.1-t1 (below).

## v6.10.1-t1 (2026-10-21): polish (test build)
Picked by the user from the post-release list.
- **Drive wear:** drives wear slower (base wear 0.15 a day, was 0.25; lightning and the bird on the line knock 3–10% off each drive, was 8–26%; a brownout 1–4%, was 3–9%), so 0% means a drive near its end. Fault odds climb steeply when worn (about 2× at 40%, 4× at 20%, 11× at 0%). Three drives (picked by the run's seed) start part-worn at 35–60%.
- **Refiner power upgrade** fits bigger refiner motors and drives: +30% rating, so the refiner drives run about 75% loaded instead of 93–99% after the throughput upgrades.
- **Relationship map:** a new 480 V bus tag (the main incomer) between the 13.8 kV feeder and the three DC buses, and the main incomer as a knob driver.
- A blank mill rename says "Type a name for your mill" instead of doing nothing.
- civcheck waits for the civics meter bar to draw before checking it (it flaked under load).

## v6.10.0 (2026-10-20): The Reliability and Electrical Update
Release of test builds t1–t5 (below). Plan: claude/reliability-v610-plan.md; QA: claude/qa-v610-t3.md.
- Ten critical VFD motors with bearing, motor and drive health, fed from three drive lineups in a new MCC building (115 kV → 13.8 kV → 480 V → ~650 V DC).
- An electrical tech on every shift; each maintenance tech does a vibration round a shift and the electrical tech an ADX round, skipped when they're called to upsets.
- Reliability and Drives screens in the control room; drive loads trendable; relationship map, help and glossary updated.
- New upsets: bearing, motor and drive failures, rectifier faults, and the arc flash at the MCC main incomer (a new fiddly knob); all in the Upsets tab.
- Drive fault decisions (reset and go, or investigate then run to the outage or replace), planned repairs with downtime, outage changeouts, arc-flash PPE, AUTO-LW basis weight, click for info, and the water tower in the north-east corner.
- Balanced against v6.9.2 over 100 live QA runs and matched balance runs: doing the rounds is the biggest boost, hands-off play is punished harder, most seasons still profit.

## v6.10.0-t5 (2026-10-20): main incomer and the Upsets tab (test build)
- **New fiddly knob: the MCC main incomer.** A red breaker handle on the MCC's incoming 480 V section (tap it, or find it in the fiddly knobs view). Open it and it draws an **arc flash**: sparks and smoke at the MCC, no 480 V, every drive on all three lineups stops (the machine, the pulper and the winder), and a $30,000 bill. The electrical tech suits up, inspects, resets and closes it (about an hour), and the drives take a small knock in health. Drives shows "ARC FLASH · MAIN INCOMER OPEN".
- **The incomer moved to the east end of the MCC** (beside the transformer it's fed from), so the doorway no longer hides it.
- **A much bigger, electric arc flash:** a blinding blue-white fireball, thick jagged arcs crawling over the switchgear and bursting up through the roof, a shower of blue and white sparks, a blue flash over the whole screen while the MCC is in view, then re-strikes for several seconds and smoke out of the door and roof.
- **The new upsets are in the Upsets tab:** bearing failure, motor failure, drive failure and rectifier fault (set off by hand on a machine picked at random, and the random box switches their own dice) and the arc flash (knob only).
- A drive fault waiting on your call can be cleared by hand from the Upsets tab.
- QA Agent C (t4): round banners keep the machine's name as written ("the Refiner A bearing"); Plan repair says what actually stops (a refiner slows the machine, the winder stops only the winder); a planned repair's stop reason names the planned work, not "drive down".
- Help: the main incomer and arc flash on the Reliability and Fiddly knobs pages; glossary entries Main incomer and Arc flash.
- qa_v610: the harness forwards Content-Range, so the leaderboard can pin a run outside the top 100.

## v6.10.0-t4 (2026-10-20): QA review decisions (test build)
Balance and polish the user picked from the t3 QA review (claude/qa-v610-t3.md).
- **Balance:** each vibration round checks one machine (was two), so a full crew no longer sees everything every shift.
- **Balance:** a planned repair takes the machine down 20–40 minutes while the crew works (new jobs: planned bearing change for maintenance, planned motor swap for the electrical tech). An outage changeout is now the no-downtime way. A motor in ADX alarm can be swapped early.
- **Balance:** repeated drive resets get worse: each reset in the same day takes longer (5, 10, 15 min…), wears the drive more and is likelier to repeat; below 20% health a reset may not hold at all, and the card then offers only Investigate.
- Rounds stopped by a planned outage aren't counted as skipped; repairs show as "Repaired" in the reading history.
- Drive health (and patched/reset notes) on the Reliability detail and a Health column on Drives; rectifier health per lineup; brownout and loss-of-supply alarms on Drives.
- A drive fault waiting on your call says "awaiting decision" instead of a frozen countdown; Investigate's cause follows the data (a hot or worn drive, a weak rectifier, a drive over its rating).
- After an upgrade, a warning if the refiner drives now run near their rating; the relationship map's refiner-load note is corrected (energy × fiber rate).
- Click for info: Refiner B and the 2nd press; the MCC can be tapped anywhere on its cabinets, wins over the electrician at a distance, and links to Drives; an MCC chip in Go to; emptied OCC trucks and customer truck grades read correctly; 3D labels stay on screen and clear of the Go to chips.
- Drives load bars show which are trended; outage-plan changeouts are separate check toggles; exact prices on reliability buttons; DCS screens open at the top.
- A tutorial card on rounds and the MCC; the daily card is the "Daily area round" with its "Area Trend Report" (not to be confused with shift vibration rounds); IGBT and Planned repair in the glossary; clearer drive card wording; US spelling throughout.
- Outage complete says "breakdowns … the usual rate" instead of "±0%"; the outage start shows the exact end time; the pulper rotor rebuild deal renews its bearings and the used winder drive renews the winder drive; AUTO-LW starts over at a grade change; the leaderboard marks the run just submitted, not the best older one with the same name.

## v6.10.0-t3 (2026-10-20): QA fixes and balance (test build)
100 live QA runs (50 seasons, 50 survival) on t2, then matched balance runs against main.
- **Fix:** a drive fault card nobody answers no longer holds the machine down. After an hour the default is taken (investigate, then replace) and the card closes.
- **Fix (QA Agent A):** the electrical tech puts the arc-flash suit on for an MCC job that starts while he's already inside (paperwork at the desk), and takes it off back at the desk.
- **Fix (QA Agent A):** changeouts already on an approved outage plan show in the Reliability table (✓) and detail; ticking more then says they go on the outage after.
- **Fix (QA Agent A):** "MCC-3 · 1 drive"; the Control room help page lists the Reliability and Drives screens.
- **Fix (QA Agent C):** a drive card can no longer open over the game-over screen or linger over the menu after a run ends.
- **Fix (QA Agent C):** a faulted drive on a lineup whose DC bus is down shows as a fault, not just No DC.
- **Fix (QA Agent C):** opening the second screen before picking a DCS screen no longer throws on every UI tick.
- **Fix (QA Agent C):** the drive card names the machine as written ("The Refiner A drive", not "refiner a").
- **Fix (QA Agent B):** an outage drive changeout clears the patch, so a replaced drive no longer faults 3× as often for the rest of the run.
- **Fix (QA Agent B):** a repeat drive fault takes half as long again to deal with, as its card says (the longer time was worked out but never used).
- **Fix (QA Agent B):** the process-flow labor line includes the electrical tech's wage ("Maintenance and electrical techs").
- **Fix (QA Agent D):** the Drives power diagram labels were centred by a style rule, so "UTILITY" and "115 kV" were cut off and the lineup labels sat on the bus lines.
- **Fix (QA Agent D):** in a rectifier fault, the Drives "Faulted" count includes drives with no DC bus, and the Reliability screen shows them as "No DC" (it showed a plain 0 %).
- **Fix (QA Agent D):** a planned repair removes the same part's changeout from the outage wish list, so it isn't paid for twice.
- **Fix:** the drive fault card shows the drive's load at the moment it tripped (it showed 0%).
- **Balance:** bearing, motor and drive failures about half as often; rectifier faults a quarter as often; rectifier bill $60k to $40k; motor bills about 25% lower.
  Result (24 seasons per build, same seeds): doing rounds +$2.53M vs main +$2.68M; hands-off -$72k vs main +$551k (7 of 12 still profit).
  Survival: rounds 35.5 days vs main 37.0; hands-off 26.3 vs 28.7.

## v6.10.0-t2 (2026-10-20): The Reliability and Electrical Update (test build)
Built on test/v6.10-reliability. Plan: claude/reliability-v610-plan.md. Seasons, survival and free play (not zen). Functionality first; no balancing yet.
- **Ten critical VFD motors** (`07i-assets.js`): pulper rotor, refiners A and B, fan pump, couch roll, 1st and 2nd press, dryer section, reel drum,
  winder drum. Each has bearing (vibration), motor (ADX) and drive health that wear while it runs, faster when pushed (refining energy, press load,
  a thick pulper, a drive over 100%). Health raises the odds of a fault; the dice decide when. Own dice streams (`rel`, `relx`), so every other upset keeps its timing.
- **Shift rounds:** each maintenance tech does one vibration round a shift (two machines, most overdue first); the new **electrical tech** does one
  ADX motor-test round. A tech called to an upset skips or abandons it and that data goes stale (grey after a day, Unknown after three).
- **Faults found early:** a failing bearing shows on a vibration round ~36 h ahead, a failing motor on an ADX test ~72 h ahead. Planned repair from
  the Reliability screen: 20% of the bill, no downtime. Missed: **bearing failure** (maintenance pair) or **motor failure** (electrical tech).
  **Drive failure** comes with no warning (likelier over ~95% load and after lightning or a brownout). Each has civics choices and a 3D effect.
- **Electrical tech** (manning `03f`, 3D `38c`): one per shift with a team hat and a wage; takes motor and drive failures, lightning and the bird on
  the line (moved off the maintenance queue); walks ADX rounds with a test cart; changes drives at the lineup (the faulted module comes out red, the spare goes in).
- **MCC building** (`38c-3d-mcc.js`): south of the machine hall with the shop's pop-away roof (the south wall lifts with it); three drive lineups
  with live status lights, the 480 V incoming section, a desk and spare drives; a transformer pad, a duct bank to a riser pole, and an overhead feeder from each map's substation (`42b` `LM.feeder`).
- **Reliability screen** (Report → Control room, and on the DCS bar): this shift's rounds and who walks them, every machine's vibration state
  (good, imbalance, misalignment, outer race, inner race, imminent), ADX health, drive load and the reading's age; history, pins, planned repairs and outage changeouts.
- **Drives screen:** each lineup's drives with status, load bar and heat-sink temperature, alarms, MCC power; every drive load is a trend tag (`dl_*`, `mcckw`).
- **Upset cards** quote what the rounds last said about the failed machine (the new failures, and refiner clash, felt, fabric, driveshaft, wrap, winder),
  and those linked upsets get likelier as that machine's bearings wear. The Vibration Report arrows include faults the rounds found.
- **Outage changeouts:** the outage plan lists flagged machines; tick bearings, motor or drive (cost and minutes, back to full health). The outage's major job renews what it touches.
- **Relationship map:** a Drives column and a Substation power driver, linked from rotor amps, refiner power, speed, vacuum, press load, tension and the winder.
- **Help and glossary:** a Reliability and electrical page, outage changeouts, and 12 new terms. End screens show rounds done and skipped, faults caught and failures.
- **Water tower** moved to the north-east corner (84, −24), clear of the new building on all four maps.
- **Power chain:** 115 kV utility → substation (13.8 kV) → feeder → MCC transformer (480 V) → a rectifier per lineup → ~650 V DC bus → the drives' inverters.
  The Drives screen draws it as a live single-line diagram; tags for the 13.8 kV feeder and each DC bus; the voltages follow blackouts, brownouts and outages.
  **Rectifier fault** (new upset, electrical tech): its lineup's DC bus drops and every drive on it stops. Rectifiers and copper DC busbars in the 3D lineups.
- **Drive fault decisions** (replace the civics card): *Reset and go* (back in ~5 min; repeat odds scale with drive health, a repeat runs 1.5× longer) or
  *Investigate* (45–90 min: the cause, a cooling fan, DC bus capacitor, IGBT or loose connection), then *Run it to the outage* (patched, 3× fault odds, replacement
  auto-booked on the outage plan) or *Replace it now* (spare drive, 60–90 min). Free play's Let the mill run picks Investigate → Replace.
- **Arc-flash PPE:** the electrical tech puts on an arc-rated suit, hood and face shield at the MCC door (and takes it off on the way out); +3 min to every MCC job.
- **AUTO-LW basis weight:** the WET DCS setpoint's new default mode trims the weight lighter while ring crush has room, holding it 3% over spec, and back up
  to the grade target when strength falls (slow, through the QCS dead time). Moving the setpoint puts it on MANUAL. On the relationship map.
- **Click for info:** tap a person (name, team, role, what they're doing, covering), a forklift, clamp truck or truck (load, order), or equipment
  (live readings; the ten critical machines add vibration, ADX and drive readings and a link to Reliability).
- **Lights:** the receiving, roll warehouse and shop lamps hung above their roofs; they now hang under them.

## v6.9.2 (2026-10-20): Release review
Built and tested on test/v6.9.2-release.
- **Help and glossary** (`51f-help.js`): about 30 outdated statements corrected (tell lead and caught-repair share, area
  controls now in Process flow, which screens slow the game, DCS row, grade set by the market, camera, save rules), new
  guide pages (Quality and specs, Wet end and drying, Water), 47 new glossary terms (wet end, water, valves and tuning,
  freight). The tutorial's upsets card introduces the daily Round. Rolls per reel label: 8 × 12.5 t.
- **Bug fixes:** code stuck on the end of `//` comments now runs (`S.q.made`: the Customer audit always failed;
  `G3.closeKnobUI`: a field knob panel left open kept the game at 1 min/s; the bird cut-scene's open-sheet check; the
  outage notice cleared after an outage; chart padding; dumpster lid). `build.py` now warns on that pattern. A docked
  truck from a pre-v6.6 save no longer turns cash into NaN. Zen hands touched valve loops back (the white water chest
  drained in the screensaver). Valve faceplates open on the second screen when the DCS is popped out. Challenge reference
  scores precomputed (the first Run froze for ~0.5 s). A refused bump test no longer takes the loop. Event cards,
  choice cards, the outage plan and the pause menu close the DCS / faceplate they used to hide under.
- **Refiners and the machine chest** (`07g` mcTick): the refiners take stock from the stock chest and feed the machine
  chest. Plates clashed: no forward flow, the machine runs the chest down (about 5 min) and trips at 10%; re-plated, the
  refiners refill it and the machine rethreads over 35%. "Run on one refiner until the outage" ends the trip with the
  machine held at 75%. Relationship map: Refined stock flow, the refiner feed chain, the clash, and refining energy ->
  couch solids (the drainage cost) beside -> ring crush. `tools/refcheck.py`.
- **Economy:** tells 4.5 days ahead (was 3.5), a caught repair 5% of the bill (was 10%), missed repair bills +20%,
  every upgrade 30% dearer, overhead $2,400/h (was $3,400). Seasons, 12 seeds a tester over the 4 maps, gain over
  hands-off: rounds +$1.79M, smart upgrades +$1.27M, both +$3.11M, buy-everything -$1.50M; hands-off +$0.44M (58% of
  seeds profit). Survival (10 seeds): rounds +7.4 days, smart upgrades +12.0, both +26.9 — upgrades still lead there.
- **Tests:** controlcheck, fixcheck, ordercheck, knobcheck, v506check and survival.py updated for later versions.

## v6.9.1 (2026-10-20): Wet End Controls
- **Rush / drag on the WET DCS** (`50d-dcs-more.js`): R/D = (J/W − 1) × wire speed, in fpm, under the wire speed
  ("−38 fpm DRAG" at the standard 0.985 J/W; "RUSH" when the jet is faster than the wire). The jet-to-wire ratio now
  reads from the saved slice, so J/W and R/D read the same without the 3D view. Both are trend tags (R/D has hourly
  history) and on the relationship map (slice → J/W → R/D, wire speed → R/D). Glossary: Rush / drag.

## v6.9.0 (2026-10-20): The Valves Update (built and tested on test/v6.9-valves as 6.9.0-t1)
Plan: `claude/valves-v69-plan.md` (project doc). Six control loops with real valves and PID tuning, as a toy model for
learning loop tuning. Untouched, every loop is the game's own v6.8 model and the mill plays and checksums exactly as
before; the first change to a loop hands it to the valve model, and back on standard tuning and settled for 10 minutes
it hands back.
- **The loops** (`07h-valves.js`): NV-101 pulper consistency (dilution water; the field "pulper dilution valve" knob is
  now this valve: moving it puts NV-101 on MAN), LV-104 machine chest level (made real: it was a wobble), FV-201 basis
  weight (the v6.8 loop as a PID with speed feed-forward and the scanner's 3 min dead time), LV-202 white water silo
  level (makeup from the white water chest), and the dryer steam cascade: QC-300 reel moisture sets PV-302 / PV-303,
  the 2nd and 3rd section pressures, on CAS (IMAN when they're not).
- **Real valves:** ISA PID (Kc, Ti, Td in minutes, derivative on PV with a filter, a PV filter, conditional
  anti-windup, bumpless mode and tuning changes), a positioner with deadband and hysteresis, an actuator with a stroke
  time and stick-slip friction, linear or equal-% trim, first-order or integrating processes with dead time and a
  little deterministic noise. 1 s sub-steps, 15 to each sim step, from the step before's boundary: deterministic.
- **Consequences, only when touched:** the knob model's rotor trip / overflow / thin feed (NV-101; pulper swings reach
  the machine chest through the storage chest), an empty machine chest slows then breaks the sheet and an overflowing
  one sends refined stock to the sewer (LV-104), off-spec weight and moisture to the beater (FV-201, QC-300), a dry silo
  cavitates the fan pump (LV-202). In a season or survival run the crew traces a loop that keeps hurting for 4 hours
  and puts it back on standard tuning (free play leaves experiments alone).
- **DCS** (`50k-valve-ui.js`, `50b`, `50d`): ISA valve symbols on SPOT, WET and DET (filled by % open, amber on MAN,
  red when cycling) with their % open and mode, QC-300 as an instrument bubble, a "Control loops" row of buttons under
  each picture, and valve alarms (on manual, oscillating, sticking, at limit). The BW valve and 2nd/3rd section steam
  setpoint rows and the pulper dilution DCS row are replaced by the faceplates.
- **Faceplate and tuning panel:** Operate (MAN / AUTO / CAS, SP, OP, the valve's commanded vs actual position, loop
  health in plain words), Tune (Kc / Ti / Td / PV filter, live or with an Apply button, setpoint steps scored for
  overshoot, settling, IAE and valve travel, with the last step as a ghost), Bump test (MAN, settle, step, fit a
  self-regulating or integrating model, Lambda / SIMC tuning: conservative, moderate or aggressive, PI or PID, "Use
  these"), Valve (characteristic curve and settings; editable in free play), Learn (glossary) and Challenges (five
  tuning puzzles on a sandbox copy of a loop, scored against a careful engineer's tuning, best stars saved per mill).
  **Tuning clock** while it's open: real time, 5×, 20× or 60× (remembered).
- **Trends and history:** PV and output tags for every loop (Report → Control room → Trends), hourly valve openings.
- **Relationship map:** every loop's PV and output wired in (`50j-relmap.js`, 33 links): the valve → process → PV →
  controller → valve circle for each loop, the CAS link from QC-300 to PV-302/303, the field dilution valve as NV-101,
  machine chest level → speed and sewer, makeup out of the white water chest, the steam header capping the pressures,
  and 2nd/3rd section pressure → reel moisture.
- **Help:** a "Control valves and tuning" guide page and glossary terms. Older saves: manual 2nd/3rd section steam, a
  manual BW valve and a moved pulper dilution knob come back as the new loops.
- **Tests:** `tools/valvecheck.py` (52 checks).

## v6.8.3 (2026-10-20): OCC recipe, second screen control room, open draw, map zoom and night light cones
- **Second screen is the whole control room** (`50e-popout.js`). It opens on the same tiles as Report > Control room
  (process flow, DCS, planning, quality, water, trends, relationship map, manning); a tile fills the window with that
  app and "← Control room" in the bar (or Escape) comes back. Opening any of them from the game window while popped
  out (a console in the mill, a control room tile) switches the second screen to it. The DCS + flow "Both" view is
  gone. `tools/popoutcheck.py` checks the tiles, the back button and the routing.
- **Open draw and strength** (`07g-wetend.js`, `07b-knobs.js`). Each % of press-to-dryer draw over the 1.5 % standard
  takes 4 % off ring crush (less draw adds it). Under 1.5 % the sheet flutters into the dryers and breaks come more
  often (×1.5 at 1.0 %, ×2.2 at 0.5 %). The wrinkles under 1 % and the snap over 2.4 % are as before. Both links are on
  the relationship map.
- **Machine hall lights moved over the operators' floor:** the four hall lights slide from over the machine (z 9.1) to
  the tending-side aisle (z 15) where the operators stand and walk; same lights, height and size.
- **Let the mill run** (free play, Settings → Run the mill): event cards are declined for you (logged as "Declined for
  you") and the bird cut-scene is skipped, so nothing pauses the mill and you can leave it. Off again when free play ends.
- **Menu tidy, desktop and phone:** the glossary is A to Z; the Cutaway label sits in its own cell of the switch; the
  OCC recipe table no longer wraps on a phone (Yard column: tons with days of feed under them); Manning's header keeps
  the close button on its row ("Shift change in 11:53"); the Quality screen's six headline tiles are 3 × 2 at every
  width (Reel speed sat alone on a row); the Planning tile mentions the OCC recipe.
- **Help brought up to date** (`51f-help.js`). New guide pages: Control room and second screen (with the OCC recipe and
  map zoom) and Shifts and the crew (DuPont 12, team hard hats, vacation cover, short shifts). New glossary terms:
  A bales / C bales / Mixed Waste, Second screen, Relationship map, Manning, DuPont 12, Hard hats, Ring crush, Showers.
  Updated: Draw (ring crush and breaks), Bale yard, DCS, Control room, Off-spec (ring crush), Fiber in, paper out.
  Fixed: Process flow is under Report → Control room, not Settings.
- **Machine showers 1.65 m³ a ton of paper** (about 250 gpm at 35 t/h), down from 8 (over 1,000 gpm, `07f-water.js`).
- **OCC recipe** (`05b-orders.js`, Planning screen in `50f-control.js`). Three kinds of bale replace the gate grading:
  A bales ($25/t over market, ~5 % pulper rejects), C bales (market, ~11 %) and Mixed Waste ($45/t under, ~24 %).
  The planner sets a recipe in bales per feed cycle (1–10 of each, default 3 : 5 : 2, which matches the old average
  cost and rejects). The conveyor feeds them in that order, spread evenly, and the pulper's yield follows what went in.
  Each kind has its own pile; inbound trucks bring whichever kind is furthest below its share, and a kind that runs
  out is skipped until a truck brings more. Reject tons now cost $30/t to landfill, and Mixed Waste over 2 bales in 10
  slows the pulper's top rate. No more loads turned away at the gate. In 3D, bales are tinted by kind: clean kraft
  A bales, market C bales, grey-blue Mixed Waste, in the yard and on the conveyor. Help: "OCC recipe".
- **Relationship map zoom:** −, Fit and + buttons in the map's header (30% to 200%). Fit shows the whole map; zooming
  keeps the middle of the view where it is, and the zoom holds when the map redraws (`50j-relmap.js`).
- **3D light cones at night.** The flat, camera-facing paper wedges under each mill lamp are replaced by real cones
  (one merged mesh, one draw) whose sides fade toward their edges and toward the floor. They're depth-tested, so
  equipment in front of a lamp now hides its light instead of a wedge cutting through it. The floor pools are soft
  gradients. `?papernight` brings back the v6.1 cut-paper look; `?softnight` the older glows (`36-3d-ambient.js`).

## v6.8.2 (2026-10-20): manning
- **DuPont 12 shifts.** The maintenance techs and the operators (7 machine floor, 2 stock prep) work in four teams
  on the mill-shifts rotation: 28 days of 4 nights, 3 off, 3 days, 1 off, 3 nights, 3 off, 4 days, 7 off, with
  B/C/D running 7/14/21 days behind A. Shifts change at 6 a.m. and 6 p.m. (`03f-manning.js`).
- **Team hard hats:** A blue, B green, C orange, D white. Someone covering from another team wears their own colour.
- **Vacations and cover.** About half of all shifts have someone away (booked for the whole run of days or nights),
  covered by someone from an off team who isn't working the shift before or after: mostly overtime pickups, sometimes
  swaps. Now and then a tech's vacation goes unfilled: that shift runs a tech short, maintenance repairs go at 75%
  speed until the next change, and the upset feed says so. Everything follows from the run's seed through its own
  hash, so seasons still replay identically (`tools/determinism.py`).
- **Shift change in the mill** (`38b-3d-shifts.js`): the incoming crew walks in from the parking lot to the person
  they relieve, has a word, and the outgoing person walks out. A tech on a job is relieved back at the shop.
- **Report > Control room > Manning** (`51j-manning-ui.js`): the team on now, every tech and operator with their hat,
  who is covering for whom (overtime or swap, and which team), any unfilled gap, and the time to the next change.

## v6.8.1 (2026-10-20): report tab tidy
Formatting only; the sim and the control room screens are unchanged.
- **Live mill moves to the top of the Report tab**, above the control room and the season report. Its "Last 24 hours"
  chart is removed (its summary now reads flow & bottleneck · right now · reliability).
- **Quality & fiber card removed** from the report. On-spec, the beater and the specs are on the Quality screen.
- **Orders & bales panel removed** (`51h-orders-ui.js` deleted). The order book, inventory and bale yard are on the
  Planning screen; the help's Order book entry points there. `tools/ordercheck.py` checks the Planning screen instead.

## v6.8.0 (2026-10-19): process relationships
Built on test/v6.8-relations (as 6.8.0-t1 and t2), merged into main. Everything in the two test entries below:
refining energy (kWh/t) with freeness-driven drainage and a ring crush spec, the basis weight setpoint and lightweight
premium, the basis weight loop with QCS dead time, the headbox at 0.8% with fan pump dilution, the white water silo,
machine water to the silo, seal pit and save-all, bale water in the pulper, cleaner and screen pressure drop costing
yield, and Report → Control room → Relationship map. Checks: `tools/relcheck.py`, `tools/relmapcheck.py`.
Not balanced yet.
- **Out-of-date checks updated (tools only, after the release):** `tools/survcheck.py` now runs with civics off (its
  meters move wages, bills, prices and costs, and its choices hold the outages; `civcheck.py` covers civics), answers
  civics choices while stepping, checks the leader's own price push (`leadPrice`), Chip's pay settlements at +10% (QA2),
  seasons with a leader (v5.1), and waits a full UI tick before reading the bar. `tools/windercheck.py` waits for the
  crane to finish before comparing the storage stands, and judges draining by the low point. Both pass under load.

## v6.8.0-t2 (2026-10-19): relationship map in the control room (test)
On test/v6.8-relations, not merged. New code: `src/js/50j-relmap.js`. Check: `tools/relmapcheck.py` (15 checks).
- **Report → Control room → Relationship map.** All 86 trendable readings and 13 drivers (weather, grade, knobs, market,
  orders, upsets) in a DCS-style process map, left to right from inputs to shipping and money, with 187 cause → effect
  links from the sim: + rises with, − falls as it rises, ~ optimum, limit or swing, = same reading.
- **Tap a reading** to light its links and list what drives it and what it moves, each with the mechanism. "Full chain"
  follows the links all the way up and down. Each box shows its live reading; H marks readings with hourly history.
- **Trend it** sends the reading to the trend screen. The game keeps running at the player's speed while the map is open.
  Escape closes it. Zen keeps it. On a phone the details sit under the map.
- Keep `RM_E` in step with the sim when a relationship changes; relmapcheck fails on a tag with no links.

## v6.8.0-t1 (2026-10-19): process relationships (test)
On test/v6.8-relations, not merged. New code: `src/js/07g-wetend.js`. Check: `tools/relcheck.py` (20 checks). Functionality
only, no balancing; a hands-off 12-day seeded run is within 0.2% of v6.7.1 on paper made. No new dice: runs replay identically.
- **Refining is specific energy now (kWh/t, standard 60).** The refiner knob (field and SPOT DCS) sets kWh/t and the plate
  gap follows (clash at about 120). More energy: lower freeness, slower drainage (freeness drives couch solids in the
  dewatering chain), more refiner kW, billed as energy above or below standard, and more ring crush.
- **Ring crush spec per grade** (24 58.2, 28 65.0, 31 72.8, 34Super 81.5 lbf/6 in minimum). Ring crush scales with the
  measured weight and refining (stickies take a little off). Under spec, the reel goes to the beater like any other spec.
- **Basis weight setpoint and the lightweight premium.** The WET DCS sets the BW setpoint from 10% under to 5% over the
  grade's target; the weight spec is ±3% around the setpoint. On-spec paper under the target earns half the trim as a
  price premium (capped at 5%), paid as it is made. A lighter sheet needs more refining to pass ring crush.
- **Basis weight loop with dead time.** The basis weight valve feeds thick stock from the machine chest. AUTO follows speed
  and the setpoint and trims on the QCS reading, which is 3 minutes late, so thick stock or swings show as a weight
  excursion before it is corrected. MANUAL holds the valve %: speed and stock consistency move the weight.
- **Headbox at 0.8%.** The fan pump's flow is sized to carry the setpoint's fiber at 0.8%; white water from the silo
  dilutes the thick stock down to it. Headbox consistency moves with the delivered fiber and drives the weight.
- **Machine water.** Table and couch drainage go to the white water silo, the vacuum boxes' share (more with more
  vacuum) to the seal pit, press water to the save-all and the white water chest. New flows trend in gpm.
- **White water silo is a real level** (60,000 gal). It runs full and overflows to the white water chest; dilution
  demand above what drains in draws it down (high vacuum, thick stock). Under 25% it makes up from the white water
  chest, under 15% the fan pump cavitates (headbox consistency and weight swing), held under 8% the sheet breaks at the
  wet end. The crew traces a low silo to raised vacuum. Refills to 60% while the machine is down.
- **Bale water thins the pulper:** wet bales drop pulper consistency (amps, tub level follow) and the dilution loop takes
  it back out over about 20 minutes.
- **Cleaner and fine screen pressure drop** build with dirty bales (and the screen with its load). Past 10% over clean,
  the rejects carry good fiber: pulper yield falls. A purge left on manual costs yield as it builds. Fine screen ΔP is real.
- **New tags:** refining energy, fine screen ΔP, fan pump dilution, headbox consistency, BW valve, BW setpoint, table and
  couch drainage, seal pit water, press water, silo overflow, silo volume, ring crush, lightweight premium. Fan pump
  flow and silo level are real now. Hourly history adds refining energy, headbox consistency, silo level and ring crush.
- **QCS:** ring crush reading and spec, weight spec around the setpoint, premium shown. WET alarms: silo low or
  cavitating, BW on manual. "Moves with" lists up to 14.
- Saves: an older save's refiner gap converts to kWh/t. Tests updated: knobcheck (refiner in kWh/t, high vacuum now
  breaks through the silo), watercheck (silo in the inventory).

## v6.7.1 (2026-10-19): new grade set
Built on test/v6.7.1-grades (as 6.7.1-t1), merged into main. Check: `tools/migcheck.py` (an older build's save continues on the new grades).
- **Four new grades replace the old set, one for one:** 24 (light medium, 25.52 lb, 2,632 fpm), 28 (medium, 28.03 lb,
  2,262 fpm), 31 (heavy medium, 31.10 lb, 2,147 fpm) and 34Super (high-strength board, 34.01 lb, 2,027 fpm). Each is a
  little heavier than the grade it replaces and runs slower by the same fraction, so tons per hour are unchanged
  (within 0.001%). Prices, cost mix, campaign sizes, cards and civics carry over to the new names.
- **Quality specs follow the new targets** (±3%: 24 24.75–26.29, 28 27.19–28.87, 31 30.17–32.03, 34Super
  32.99–35.03 lb/1000 ft²).
- **Dryer base pressures are game values now:** 24 120, 28 127, 31 136, 34Super 133 kPa at the standard rate, +2.9 kPa
  per extra t/h on 24. Comments and notes describe the model's own values only.
- **Saves carry over:** a season or survival run saved before the update loads with its grades mapped to the new ones.
- The archived builds in `test/` use the same grade set.

## v6.7.0 (2026-10-19): control room
Built on test/v6.7-control (as 6.7.0-t1), merged into main. New code: `src/js/11d-tags.js` (the tag list and its history), `src/js/50f-control.js` (the
trend pane, relationship analysis, the QCS, PLAN and WATER screens), `src/js/50h-pflow-more.js` (the process flow
additions) and `src/js/51i-control-room.js` (the Report tab strip). All read-only: the sim and its dice are unchanged
(determinism matches v6.6.0 to the dollar).
- **Report → Control room.** One strip at the top of the Report tab: Process flow, DCS, Planning, Quality, Water, Trends
  (and Second screen on desktop). The DCS still opens from the operator consoles. The Process flow button left Settings
  (the area-controls note there now points to the control room). Zen keeps the process flow only.
- **One row of DCS screens:** SPOT, WET, DET, UTIL, WATER, QCS, PLAN, TREND (the DCS / QCS toggle is gone; QCS is a
  screen). Only the screens with controls (SPOT, WET, DET) slow the game to 1 min/s; the read-only ones run at the
  player's speed.
- **Split-screen trends.** The trend sits beside the picture on desktop (Trend ◂ hides it) and switches with it on a
  phone (Picture / Trend). Tap any reading on a picture to add it as a pen, or pick from all 73 tags; up to six pens,
  each on its own scale, with its range and the value under the cursor. Ranges 1 h, 6 h, 24 h, 48 h (a reading every
  2 game minutes, kept 48 h, outside the save) and 7 d / Run (the hourly history, for tags that have a column there).
  TREND is the same pane full width.
- **Relationship analysis.** X–Y: any two tags against each other, with r, the fitted line, and the delay at which they
  line up best (up to an hour either way, 12 h on the long ranges). Moves with: every other tag ranked by how strongly
  it rises or falls with the one picked, with its delay ("fan pump flow leads paper made by about 4 min"), and
  + trend to put it on the trend. Same-reading-in-other-units pairs are left out.
- **QCS (quality):** the spec check and readings as before, plus beater and on-spec totals, the spec sheet for all four
  grades, an off-spec log (each spell: when, how long, grade, why, tons to the beater; kept in the save, last 40) and the
  grade changes with their transition tons (last 20).
- **PLAN (planning, read-only):** the production plan (campaign on the machine, tons and hours left, the next grades on
  the wheel), the order book (on-time delivery, every open order with its status, recently closed), inventory (the
  warehouse by grade against what open orders need, surplus or short; bale yard days of supply, bale quality, stock
  chest hours, paper at the winder, beater bay) and trucks (inbound and outbound rates, queues, every door and its job).
- **WATER:** a new picture of the water circuit (intake, fresh water, showers and seals, machine, dryer stack, white
  water chest, stock prep dilution, clarifier, outfall, landfill) with its alarms, and the run's water balance in
  gallons. Monitoring only.
- **Units:** water and stock flows in gpm, chest and tank volumes in gallons, water use in gal/ton (UTIL, SPOT, WATER,
  the spider valve panel). SPOT shows the stock chest, machine chest and white water chest volumes.
- **Process flow:** each area shows its throughput against its capacity, with the bottleneck marked; areas with an
  upset flash red; $, $/ton and Tons views (tons: bales in to paper out, waste, the broke loop and fresh water in
  gallons); each input's cost per ton against the 7 days before (▲▼ chips, yesterday on hover); an OEE strip
  (availability × performance × quality); Replay: drag or play the range hour by hour; Profit opens on "Where it went",
  a waterfall from profit at full speed and on spec down through breaks, outages, downtime, held-back time, speed,
  off-spec, repairs, idle energy, chargebacks and spot sales to the real profit; each area links to its DCS screens.
  History rows gain bales in, fresh water, potential tons, chargebacks, spot discount and idle energy (HIST_V 5).
- Help glossary: control room, trends, moves with, OEE, gallons and gpm.
- `tools/controlcheck.py` (new). Updated for the new screen row and the control room: `knobcheck.py`,
  `popoutcheck.py`, `pflowcheck.py`. Smoke, determinism, knobs, pop-out, process flow, DCS, quality, save, water,
  orders, winder, dryer, tells and help checks pass.

## v6.6.0 (2026-10-19): orders and bales
Built on test/v6.6-orders (as 6.6.0-t1), merged into main. Three realism gaps from the business and process review. All three run in Season, Survival
and Free Play; Zen keeps the old behaviour. New code: `src/js/05b-orders.js` (model) and `src/js/51h-orders-ui.js` (panel).
- **Order book.** Each production campaign books customer orders for 92% of its tons (6–36 rolls each, eight invented
  customers), each due when its rolls should be made plus 0.8–2.2 days. An outbound truck now docks only with a job: the
  earliest-due order whose rolls are in the warehouse (a part load once that grade is off the machine), else a spot load
  of unsold paper (a full truck of one grade, or a part load once the warehouse is 80% full). Every truck carries one
  grade (they used to take any mix, first in first out). Invoices: list price; late orders less $15/t per day late after
  a 2 h grace (capped at $60/t); not shipped 4 days after the due date, the order is cancelled and its paper goes to the
  spot market at $45/t under list. A truck that waits 6 h with nothing to load leaves empty and is billed a $300 dry run
  (freight out). The auto truck rate now calls trucks for what's ready to ship. Report → **Orders & bales**: on-time
  delivery, open orders with their status, spot tons, chargebacks, dry runs.
- **Idle energy.** While the machine isn't making paper it still draws a share of its running power by area (pulper,
  stock prep, machine) and keeps the boiler banked: a sheet break 59% of running power (the break's steam was already
  paid as venting); any other stop 31% of power plus 15% of steam; a planned outage 13% of power plus 5% of steam.
  Booked to energy and placed by area in the process flow.
- **Bale grading.** Every inbound load is graded at the gate (A 69%, B 27% with plastic, wax and tape, C 4% heavy
  contamination) and gets a moisture (8.5–12.5%, more in rain and snow). C loads are rejected and sent back (no cost, no
  fiber). Loads over 12% moisture are paid at air-dry weight. The yard is the tonnage mix of what was unloaded; bales in
  the open soak up rain (toward 20%) and dry slowly. At the pulper, water over 10% isn't fiber (it goes into the water
  balance) and contamination costs up to 5% yield; once it has worked through the stock chest it raises sheet breaks
  (stickies, up to +80% at the worst). Replaces the old flat 3% yield loss while raining. Process flow → Fiber: a bale
  yard quality trend (moisture, stickies). History rows gain bale moisture, stickies, open and late orders (HIST_V 4, so
  older saved history is made again).
- Help glossary: order book, spot market, dry run, idle energy, bale grading.
- `tools/ordercheck.py` (new): orders booked, one grade per truck, invoice arithmetic (late, spot, on time),
  cancellation, dry run, idle energy by state, bale grade mix, gate rejects, air-dry payment, fiber and yield effects,
  stickies and breaks, the panel, zen unchanged. Smoke, determinism, water, quality, save, process flow, winder, dryer,
  knobs and tells pass. `civcheck.py` test 9 and `survcheck.py` fail the same way on main (out of date, not this change).
- **Economy (not rebalanced).** 8 seeds per style, all four maps: season profit vs v6.5.7 hands-off −$343k
  ($719k → $376k), rounds −$471k ($2.01M → $1.54M), active −$422k ($4.05M → $3.63M); survival (rounds, 4 seeds) 35.6 →
  32.8 days. Most of it is fewer tons shipped (paper waiting for its order), wetter bales (more OCC a ton), late
  chargebacks and idle energy.

## v6.5.7 (2026-10-19): winder pass
Built on test/v6.5.7-winder (as 6.5.7-t1), merged into main.
- **Reel storage: four stands.** `P.storeReels` was 1, so only the first of the four storage stands ever held a reel and
  the machine backed up ("down: winder backed up") with three stands empty. It's 4 now: when the winder is down the
  crane parks full reels on all four stands before the machine holds back, and feeds them to the unwind one by one once
  the winder runs again. Two turn-ups landing in the same frame each get their own stand (both were sent to the same
  one). Long-run throughput on a winder-bottleneck mill is unchanged (the winder still caps it); the buffer is just deeper.
- **Two rolls per set.** The winder winds a set of two rolls side by side on the drums (the reel is slit in two) and
  kicks both off together. The first lands on the upender and is stood up; the second waits on a new transfer table
  beside it, slides across, and is stood up after it. In the sim rolls are made in pairs (the conveyor needs room for
  both); beater rolls come in pairs too.
- **Finished rolls were invisible close up**: the roll conveyor's instanced mesh took its bounds once, before any roll
  was placed, so the rolls on the ramp, upender and conveyor disappeared whenever the camera was zoomed in away from the
  map origin. Fixed (never culled; 16 instances).
- **New upset: rolls tied together** (machine, own dice stream "tie", so every other upset keeps its timing; MTBF 300).
  The set comes off with both rolls stuck at the slit: the winder stops, two operators go over with a band saw and cut
  them apart (20–35 min of crew time), and both rolls go to the beater bay and round to the pulper. 3D: the tied pair on
  the upender with a ragged band of paper across the join, the band saw feeding down through it, paper dust. Civics card
  (new slitter blades / swap the bottom blade / saw and keep winding), a tell on the Round (dry end: a dull bottom slitter
  blade), outage prep area "dry", DCS winder trip, process-flow winder area.
- **Sheet breaks keep the steam on.** The boiler isn't backed down on a break: steam keeps flowing at the running rate,
  the cans take 30% to stay hot and the rest is vented through a new header vent (riser, red control valve and silencer
  through the machine hall roof), which blows a plume for the whole break. The steam is paid for (booked to steam in the
  process flow). The boiler stack keeps its plume, the DCS FLOW tags and the steam trend keep reading through the break,
  and UTIL shows a STEAM VENTING alarm.
- Help glossary: winder sets and storage, sheet-break steam, tied rolls.
- `tools/windercheck.py`: storage fill and drain against the stands, pairs, tied rolls, steam on a break.
- Out-of-date tests brought up to date: `tellcheck.py` (lead time 3.5 d, survival step 0.12 d a wave, planned repair 10%,
  from the v6.5 balance; now one set of constants at the top), `dcscheck.py` (box counts after the v6.5.4/v6.5.6 DCS
  changes), `dryercheck.py` (8% moisture setpoint), `qualcheck.py` ("beater paper isn't counted as good paper" compared
  two runs that differ from launch to launch and flaked on main too; it now checks that nothing is booked as good while
  the spec is out). Smoke, civics, DCS, dryer, water, quality, save, knobs, process flow, tells, determinism and
  windercheck all pass.

## v6.5.6 (2026-10-19): mass balance
Built on test/v6.5.6-balance (as 6.5.6-t1), merged into main.
From the fiber and water audit: fiber closed at every stage, but some losses vanished without being booked, and water
wasn't modelled at all.
- **Water balance** (new 07f-water.js). In: fresh water (machine showers 8 m³/t, seal water 60 m³/h, makeup), the
  bales' own water, the water in repulped beater paper. Out: dryer evaporation (from the press solids), the water in
  the paper, rejects and clarifier sludge to landfill, and the outfall. It closes exactly (`tools/watercheck.py`):
  hands-off it lands at about 9.7–10.3 m³/t fresh and 8.7–9.1 out, where the old fixed 9.9 / 8.4 were. Intake and
  outfall keep flowing when the machine stops or makes beater (they dropped to zero before).
- **White water chest in stock prep** (SPOT DCS, top right): collects the machine's white water and supplies the dilution
  for the pulper, thickener and machine chest. Running steady it sits at its overflow and sends the excess to the
  sewer; when the machine stops and stock prep keeps pulping it draws down and fresh water makes up. With the river
  intake iced as well it can run dry: stock prep can't dilute, the storage chest fills with thick stock, and when the
  machine restarts the basis weight runs high (weight spec) until it has worked through it. Alarms: LEVEL LO, EMPTY.
- **Effluent TSS** now follows the fiber actually going to the sewer and the flow carrying it (clarifier 98.8%).
- **Fiber losses booked**: winder hayout broke goes to the beater bay and is repulped (it vanished before); soaked and
  burned bales show as bales lost; chest spills and stock with no room in the chest show as "Stock spilled" (to the
  sewer, with its water); scrapped finished rolls show as "Rolls scrapped". New process-flow waste rows and history
  columns (appended, so saved history keeps its columns).
- **Dryer basis**: the dryers' water and steam use the 8% moisture setpoint (they assumed 7%).
- UTIL DCS: fresh water per ton, intake, outfall and dryer evaporation are live.

## v6.5.5 (2026-10-19): the dewatering chain
Built on test/v6.5.5-dewater (as 6.5.5-t1), merged into main with v6.5.4.
One chain from the headbox to the dryers (`dewater()`, 07b-knobs.js), replacing the old water factor:
- **Jet (slice)**: the slice opening (J/W) and the lip position (jet angle) are best at standard; either way less water
  comes off the table (couch solids −1.7 points at ±0.6 opening, −1.0 at ±0.6 lip). The slice now lives in the saved
  knob state (`sv` / `sh`), so it's saved and replayed and the crew can trace a wet sheet back to it. The 3D view
  follows it.
- **Forming vacuum**: best at the 30 kPa standard; below it couch solids drop fast (15 kPa: −2.7 points), above it more
  gently (45: −0.7), and above 45 the fabric still wears.
- **Couch solids**: 19% at standard, from the jet, the vacuum and the refining (tight plates drain slower, open a
  little faster). Shown on the WET DCS and in the trends.
- **Press solids**: start from the couch solids point for point on 44% (48% with the shoe press), +0.2 a kN/m of nip load
  below the 100 standard, +0.08 above, and past 130 the nip crushes the sheet and solids fall (crush marks from 115
  as before).
- **Dryer steam**: water into the dryers per ton = 0.93 / press solids − 1, against standard. Drier in, less steam and
  a lower 3rd section, and the steam bill goes down (before, no knob ever saved steam); wetter, the reverse, up to
  the boiler trip and the wet sheet.
- `tools/dewatercheck.py` (13 checks); `knobcheck.py` passes unchanged.

## v6.5.4 (2026-10-19): DCS fixes
Built on test/v6.5.4-dcs, merged into main with v6.5.5.
- **Making-beater alert**: when the reel starts going to the beater (a spec violation or a knob defect) a banner goes up
  over the mill ("Making beater: …"), the WET DCS shows a red alert right under the headbox dilution zones, and every
  DCS screen's alarm list leads with MAKING BEATER · what's wrong.
- **SPOT picture in process order**: pulper → HD cleaner → coarse screens → LC cleaners → fine screens → LW cleaners →
  thickener → stock storage chest → refiners → machine chest → fan pump (the stock chest now feeds the refiners). The
  stock storage chest shows its consistency (about 4.2%, following the pulper's).
- **Boiler and power moved to UTIL** with steam header, steam load and steam flow readings, a steam trend, and the
  boiler, steam header and brownout alarms. DET keeps a STEAM HDR reading where the header comes in.
- **2nd / 3rd section steam control** on DET: AUTO is the moisture loop (holds the reel at 8%); moving the slider puts it
  on MANUAL, holding that pressure, so the moisture follows the load (0.15% per kPa short or over). AUTO hands it back.
  The 1st section steam stays where it was (a fiddly knob on DET). An alarm shows while it's on MANUAL.
- **Fixed: DCS setpoint rows flickering.** A row with no area-control card (the spider valve) toggled its "locked"
  styling on every refresh, so the rows around it seemed to flash.
- `tools/dcs654check.py` (17 checks).

## v6.5.3 (2026-10-19): quality specs
Built on test/v6.5.3-specs, merged into main.
- **A spec sheet for every grade** (`QSPEC`, new 07e-quality.js): basis weight target ±3% (24 24.75–26.29, 28
  27.19–28.87, 31 30.17–32.03, 34Super 32.99–35.03 lb/1000 ft²), reel moisture 8 ±2% (6.0–10.0%), and the mill's
  color. The dryers' auto loop now holds 8% (was 7%), the middle of the spec; the DCS low-moisture alarm and the QCS
  and CD profile targets follow it.
- **The QCS checks the reel every step**: weight from the grade and the machine chest's consistency swings, moisture from
  the dryers, color from the dye system (dye trouble, or the dye pump stopped). While any is out, everything made is
  off spec. A grade change's transition tons count as weight. The other knob defects (CD streaks, crush marks, felt
  stripes, wrinkles) still send their share on top. Before, each source sent its own partial share and wet/dry was a
  sliding scale; now a violated spec rejects the whole reel while it lasts.
- **Off-spec paper becomes beater rolls**: it stays on the reel, the winder splices it out of the set and winds it onto
  beater rolls of its own (a short roll at the end of a spell), so finished rolls are always on spec. Beater rolls wait
  in the warehouse bay (the 3D beater flow already drew this), then the broke pulper repulps them into the stock chest
  at about 25 t/h while there's room: the fiber comes back, the energy, machine time and winder time don't. Before,
  off-spec tons simply vanished. The broker's "seconds" card buys what's waiting in the bay.
- **QCS screen** shows each reading against its spec (red when out) and names the violation; the dry end DCS alarms
  BASIS WEIGHT / MOISTURE / COLOR OFF SPEC. The help glossary's "Off-spec" explains it.
- `tools/qualcheck.py` (18 checks); `tools/knobcheck.py` reads off-spec from the spec check for weight and moisture.

## v6.5.2 (2026-10-19): knob fixes
Built on test/v6.5.2-knobs, merged into main.
- **Fiddly knobs bite again under the dryer limit** (07d-dryer.js, 07b-knobs.js). Since b5 the knobs added kPa to the 3rd
  section's demand, and the whole range up to the 180 kPa ceiling soaked them up: on a mill with headroom, press loading
  and the 1st section did nothing but cost steam, while 1st section steam turned up alone over-dried the sheet. Now the
  knobs' load is a ratio of the knob-free demand: the auto loop takes up to ±30% of it, and past that the knobs move
  the moisture (20 points per unit, the v5.6 model). Speed and grade still hit the ceiling as before; the speed floor
  no longer stops a knob from taking load off. The crew's speed trim only answers the part slowing down can fix.
- **Boiler trips on knob overload again**: the dryers' total steam per ton from the knobs (3rd section share plus 1st,
  a0 + d1) held at its 30% top for a while trips it. Turning the 1st section down alone moves load to the 3rd, so it
  doesn't.
- **DCS titles use the machine's name** (Settings, default PM1), as the process flow and the 3D label do; it was a
  hard-coded machine name.
- `tools/knobcheck.py` passes in full again (the three b5 failures: press loading low, 1st section low + refiner tight,
  1st section high alone). Untouched seasons take the same code path as before (no knob state); not re-measured.

## v6.5.1 (2026-10-19): second screen
Built on test/v6.5.1-dual, merged into main.
- **Pop-out window for a second monitor** (desktop only: a mouse and a screen 1100 px or wider; `?popout` forces it).
  A **⧉ Second screen** button in the DCS and process flow headers, and in Settings > View, opens one window with a bar:
  **DCS**, **Process flow** or **Both** side by side, **Move to other monitor** (Chrome/Edge, asks for permission) and
  **Dock back**.
- **Nothing is synced**: the game writes the window and moves the two screens' elements into it. The same code runs them
  from the game page, on the same state, on the same UI ticks. `$()` looks in the window for ids the page doesn't have,
  and focus checks use the input's own window (`actEl`, 08-ui-wiring.js). New file `50e-popout.js`.
- **While popped out**: the DCS no longer slows the game to 1 min/s; neither screen closes (the ✕ is hidden); a console
  tap or Settings > Process flow switches the window to that screen (Both stays Both); the pause menu leaves the flow up;
  knob moves, DCS setpoints and the flow's Controls tab (the area cards move with it) work in the window; Escape there
  closes the flow's details. Zen keeps the window on the flow.
- **Docking**: closing the window, Dock back, or leaving the game page puts both screens and the area controls back in the
  game window, with the old behaviour (the DCS slows the game again while it's open there).
- A blocked pop-up shows a banner and changes nothing. Phones and tablets never see the button.
- `tools/popoutcheck.py`: 43 checks (opening, refresh, knob and control writes from the window, console taps, Both,
  pause menu, close and Dock back, zen, leaving the page, phone, blocked pop-up).

## v6.5.0 (2026-10-19): the digital twin release
Merges test/v6.5-twin (b1-b5 below) with an economy rebalance for the new realism (claude/balance-v65.md).
- **Baseline** (`tools/qa_balance.py`, 50 seeds per mode over the 4 maps, every tester on the same dice): rounds added
  +$0.92M a season over hands-off, smart upgrades +$4.17M; buying everything (-$0.74M) and gambling (-$0.44M) did worse
  than doing nothing (+$0.44M). Survival: hands-off 27.6 days, rounds +2.7, smart upgrades +32.8.
- **Per-ton upgrades halved** (they paid back 3-4x in one season): Sales team +$12/t a level (was $25), OCC contract
  -$10/t (was $20), refiner -$10/t (was $22), APC 4% less energy a level (was 8%).
- **Big-ticket upgrades ~30% cheaper**: robots $300k/$550k/$800k, warehouse $150k/$300k, pulper $250k/$450k, winder
  $220k/$400k, chest $100k/$200k, forklifts $150k/$300k, maintenance techs $100k/$180k/$260k, preventive maintenance
  $90k/$180k/$280k.
- **Paper sells for $15/t less** (24 $642, 28 $662, 31 $680, 34Super $741): inactive play is punished most.
- **Rounds worth more**: 3.5 days of warning (was 2.5; survival still loses 0.12 a wave), a caught repair costs 10% of
  the bill (was 25%).
- Applied on the user's go-ahead; the confirming re-run was stopped early. A partial run (6 seeds) had rounds +$1.35M,
  smart upgrades +$2.33M, hands-off +$0.29M; survival smart upgrades +14 days, rounds +3.2.
- `tools/qa_balance.py`: `--mode=survival`, a `shop` tester (smart upgrades without rounds), `--split=1` (seeds shared
  over the maps), `--patch` (text replacements for experiments), `?nobf`.

## v6.5.0-b5 (2026-10-19): the dryer limit (test branch test/v6.5-twin)
From claude/dryer-limit-spec.md and its review answers.
- **Speed, grade and the wet end now load the dryers** (07d-dryer.js). Water to dry = paper t/h x water per ton (1.11 t/t
  at 44% press solids; the shoe press makes it 48%) x the wet end's water factor (the fiddly knobs). The 3rd section's
  demand starts at each grade's base pressure at its standard rate (24 120, 28 127, 31 136,
  34Super 133 kPa; v6.7.1 values), +2.9 kPa per extra t/h on 24, scaled by basis weight for the other grades.
- **Ceiling 180 kPa** (set so the game runs: hands-off seasons peak at 139, a
  fully upgraded mill with the shoe press at 170). Below it the auto loop holds 7% moisture; above it the sheet goes wet
  (+0.15% per kPa short). Without the shoe press, heavy grades at full speed run damp but inside spec.
- **A wet sheet fails the moisture spec (10%):** the paper goes to the beater and the crew slows the machine (1% a
  minute) until it's back under 9%, then lets the speed recover (0.5% a minute) while there's headroom. No speed trim
  ahead of time. Above 13% the sheet can break in the dryers. In every mode but zen.
- **Boiler limit:** steam = 1.3 t per t of water (~50 t/h at standard); past 62 t/h the header sags and lowers the ceiling.
- **Shown:** DET DRYER LOAD and STEAM tags, the 2nd/3rd section pictogram amber near the limit and red when at it with a
  wet sheet, the boiler amber when steam is high; alarms DRYERS AT LIMIT · SHEET WET, DRYER LOAD HI, SPEED TRIMMED,
  BOILER STEAM HI, 3RD SECTION STEAM AT MAX (was STEAM HI at 150 kPa). QCS gives "sheet too wet" as the reject reason.
  Process flow: paper machine trends for dryer load and speed trim, a "Dryer-limited" lamp; the Mill report's flow view
  caps the machine at what the dryers can take ("Machine (dryers)" when that's the bottleneck). History v3.
- **Drive & gearbox rebuild 25% cheaper** ($90k / $80k / $70k): the dryer limit can cap it. Shoe press text mentions
  the drying headroom.
- Hands-off seasons: no change (the limit never binds; rural +0.9% vs v6.4.0, as in b2).
- `tools/dryercheck.py`: standard running, slope, wet sheet past the ceiling, the crew's slowdown and recovery,
  off-spec to the beater, the shoe press.

## v6.5.0-b4 (2026-10-19): DCS pictograms (test branch test/v6.5-twin)
- Every box on SPOT, WET, DET and UTIL is now drawn as its equipment in the classic coloured DCS style: steel
  vessels and machines, brown stock, blue water, cream paper, green motors (conveyor with bales, pulper tub with rotor,
  ragger drum, junk hopper, HD cleaner cone, pressure screens with baskets, cleaner banks (2 rows with the upgrade),
  disk thickener, double-disc refiners, chests, dye tote and pump, fan pump, headbox, forming table with foils, couch
  roll, felt loop, press nip (shoe once bought), fog fan, open draw, dryer cans, reel spool, winder, roll conveyor
  (filled by the rolls on it), grid pylon, boiler, river intake, water tower, mill, clarifier, outfall, landfill).
- States: grey outline when normal; amber when warning (cleaner ΔP high, chest level high, junk OCC, reel held,
  winder blocked or hayout, effluent TSS high); red when tripped by an upset or a sheet break at that spot; faded with a
  dashed edge when stopped by the operator or idle. Static: nothing moves; vessels show their real level.
- The name sits small along the bottom of each pictogram (hover for a tooltip); tags are where they were.

## v6.5.0-b3 (2026-10-19): DCS expansion (test branch test/v6.5-twin)
From claude/dcs-expansion-spec.md (decided item by item).
- **SPOT** now draws the whole line: bale conveyor, pulper (ragger and junk trap above it), HD cleaner, coarse screen,
  lightweight cleaners, disk thickener, stock chest, refiners, machine chest (dye pump), LC cleaners (1 or 2 rows),
  fine screens, fan pump, with pressure drops, reject rates, screen load and filtrate. Setpoints: bale conveyor speed
  (= pulper feed), stock chest level target and "PM slows below", spider valve (remote; the field panel still works),
  paper colour. Alarms: pulper and chest overflows, chest level high, junk load high, cleaner ΔP high.
- **WET**: headbox slice opening and lip (remote; the field panel still works), jet/wire ratio, wire and press speeds,
  machine speed set at the wire (the reel follows by the section draws), grade (read-only: the planner sets it),
  SHOE PRESS label once bought, white water silo level, fog fan and machine-room humidity, slime alarm.
- **DET**: grid and boiler status, drive load per dryer section, dryer section speed, reel spool weight / spools at the
  winder / turn-ups, winder (speed setpoint, cut, hayouts) and roll conveyor; alarms for sheet break with its location,
  reel store full, winder blocked, hayout, driveshaft, boiler trip, brownout.
- **UTIL** (new screen): river intake (iced on rural), water tower, water use, wastewater TSS and permit, outfall, rejects.
- **Motors** (07c-motors.js): bale conveyor, ragger, junk trap, coarse and fine screen rotors, dye pump, fog fan:
  ON / OFF / AUTO. OFF stops that step like its upset (its own upset, never rolled at random, own dice stream) and
  the operators start it again after 30 min. Free in every mode but zen, like the fiddly knobs.
- **Reject purges** (HD cleaner, LC and lightweight cleaners): AUTO / MANUAL with a PURGE button; left in MANUAL the
  pressure drop climbs until the cleaner plugs (its upset and bill), then the crew puts it back in AUTO.
- Upsets now show on the screen of the equipment they hit (UTIL for the permit and river intake).
- Fixed: an upset multiplier of 0 was ignored (mods merge); needed for the stopped bale conveyor.
- `tools/dcscheck.py`: every screen and tag, motors stop and restart, purges plug, setpoints follow Process flow and
  lock in a season, upsets on the right screen.

## v6.5.0-b2 (2026-10-19): costs aligned with the 2026 market (test branch test/v6.5-twin)
From claude/market-cost-benchmarks.md (OCC indexes, DAT truckload, EIA power and gas, Smurfit/FEFCO mill energy).
- **OCC** at 2026 levels: OCC #11 $95/t (was $142 + haul), double-lined kraft $150 (was $197). The weekly OCC market
  moves up to ±$25 a week within ±$50 (was ±$15 within ±$30): 2026 indexes moved $30-45/t.
- **Energy** $68/t base (was $95): a recycled mill buying its power at 2026 rates. Site, grade and upgrade effects as before.
- **Paper prices** lowered by what that saves per ton, so profit is unchanged: 24 $657, 28 $677, 31 $695, 34Super $756.
- **Diesel** is now diesel: a weekly walk of $2.40-6.80/gal (it rose 68% in the year to Sep 2026), worth 26% of a truck
  rate (DAT's fuel share), so freight rates swing about ±18%. The twin shows diesel in $/gal.
- **Desert** long haul to customers is +$20/t outbound freight (was +$7); cheap land now saves $480/h (was $250).
- **Steam display** at the TAPPI dryer norm (~1.45 t steam per t of paper; was ~1.09). Display only.
- Hands-off seasons (3 seeds per site, Hank, same bottleneck) against v6.4.0 finishing cash: rural +1.1%, urban −0.1%,
  desert −2.0%, swamp +0.8%. Smoke, determinism, save and tools/pflowcheck.py pass.

## v6.5.0-b1 (2026-10-19): digital twin, part B (test branch test/v6.5-twin)
- **Freight is a real cost:** inbound haul per ton of bales unloaded and outbound freight per ton shipped, each (base +
  site) × a weekly diesel index (0.85-1.15, a fixed walk from the run's seed, so the 14 prior days lead into the run) ×
  weather (normalised to the site's average) × detours (flood, dust storm). Survival's cost multiplier applies to the haul.
  Site bases: haul 18 + the site's old OCC adder (urban 13, rural 30, desert 18, swamp 15); outbound 30 − the site's old
  price adder (urban 26, desert 37, rural and swamp 30). The backhaul card is now −$6/t freight; "freight rates jumped" +$8/t.
- **Cost-neutral on average:** OCC grades $18/t cheaper (the haul came out), paper +$30/t (the freight went in). The
  rail car costs the same as before. New ledger lines Inbound / Outbound freight; report cards fold them into Freight.
- **Process flow:** Freight in (joins at the bale yard) and Freight out (warehouse & shipping) as inputs, with trends
  (haul or freight $/t, diesel index, spend) and a breakdown of what sets today's rate. Fiber's trend shows OCC, haul
  and delivered $/t together; the bale yard and warehouse trends show their freight rate.
- **Area controls moved** from Settings into the process flow: tap an area, then Controls. Same rules: AUTO and locked
  in a season or survival run, free in Free Play. Settings keeps a pointer with an "Open process flow" button.

## v6.5.0-a1 (2026-10-19): digital twin, part A (test branch test/v6.5-twin)
- **History:** one row per game hour for the whole run (11c-hist.js): money by input and by area (from the same notes
  as the day books, so any range adds up to the ledger), tons and waste, trucks, breaks and hayouts, minutes by machine
  state, downtime by cause, and hourly averages of ~30 readings (yard, OCC $/t, pulper feed and yield, chest, refiners,
  speed, BW, moisture, steam, energy and chemicals $/t, winder, warehouse, price, crew, wage, civics meters).
- **14 prior days:** when a run starts (all four modes) the real sim runs 14 game days hands-off in a sandbox (own seed
  from the run's, no season, cards, civics, leader, outages, sound or 3D) a slice at a time, while a small "Loading the
  mill's last 14 days" chip shows; the run waits for it. ~2.5 s on desktop. Cash, day 1 and the run's dice are untouched.
- **Process flow ranges:** Today / Yesterday / 7 d / Run, with a "Prior days" switch for 7 d and Run.
- **Detail panel** (side panel; bottom sheet on phones) replaces the pop-up. Areas: Trends, Costs (cost added here over
  time, this range against the run), Uptime & quality (machine/winder time, breaks, broke %, rejects %, downtime by
  cause). Inputs and outputs: Trends and Breakdown (e.g. Fiber: OCC $/t, spend, bales fed, OCC market; Site & admin:
  admin costs, crew, wage, civics). Charts zoom 24 h / 7 d / Run; tap or hover reads a point; bills show as markers;
  the prior days are shaded "before you".
- Saves: the history has its own localStorage key (paper-mill-save-hist), written only when an hour was added.
- No economy change in this build (freight and the controls move are part B).


## v6.4.0 (2026-10-19): zen shot review released to main (was test build zs1)
All four maps reviewed shot by shot under the free zen camera; fixes:
- **Shot order:** a shuffle bag: every everyday shot of a map plays once before any repeats (the old random pick with an
  8-shot memory hit the 15-minute map cut with about 10% of shots unseen). Free shots run 8-11 s (were 6-10).
- **"From" shots:** the camera starts low behind the place, with the place in the foreground and the mill beyond (they
  were 120 m+ out and high, the place rarely in frame, and the desert ones near-identical).
- **Per-map lists:** rural adds past the chip pile; city adds from the beach; desert swaps the stock pond for the windpump
  and drops ranch view and mesa to the mill (neither showed its place); swamp drops dry pad edge and bayou channels (empty
  land) and adds past the moored barge.
- **Generic shots:** the approach starts inside the map (it opened past the edge), and over the forest heads in from the deep
  wood; highway bridge is low over the river, bridge in the foreground, mill beyond; landmark only picks places with height
  that no map shot already features; lake and pond reveals start edge-on; clarifier to river comes from the west (it ended
  inside the fog-fan plume); under the wire and can heads removed (wall and octagonal cans up close); litter check picks a
  side with a clear line to the can (it clipped into the office wall); slice and wet line 9 s, litter check 8 s.
- **Viewpoints:** the 11 free viewpoints each have their own elevation (all were 46 degrees, the iso game view again).
- **Rare sights:** zen holds close on the subject (16-40 m, was 60 m: a few pixels on a phone), from the sight's own angle.
- **Swamp sight:** the gator snaps the sample bottle out of the operator's hand, not the hand (no injuries in the game);
  the bottle pops back up after the roll; the Cajun has both arms.
- **Performance:** in zen, people and vehicles over 130 m from the camera are left out (each 3D part is its own draw).
  Whole-site shots drop from about 380-410 draws to about 110-120 (desktop, software rendering).

## v6.3.0 (2026-10-18): process flow overview released to main (was test builds f1 and f2)
- Settings → View → Process flow: today's (or yesterday's) mill day as inputs, areas and outputs, live while the game runs.
- Regression: smoke, save, settings, help (22/22), determinism and tools/pflowcheck.py pass. survcheck's two fails
  (Chip's sales push, survival continue) fail the same way on v6.2.0 and are unrelated.

## v6.3.0-f2 (2026-10-18): process flow runs live (test branch test/v6.3-flow)
- The game keeps running at the player's speed while the process flow screen is open (f1 slowed it to 1 min/s), so
  the numbers and lamps update live.

## v6.3.0-f1 (2026-10-18): process flow overview (test branch test/v6.3-flow)
- **Settings → View → Process flow:** a control-room picture of the whole mill for today's mill day (6am to 6am), with a
  Yesterday view after the first full day. Inputs on the left (fiber, energy, chemicals and water, labor, maintenance,
  overhead, each with $ and $/t), the seven areas in a row (bale yard, pulper, stock prep, paper machine, winder,
  warehouse and shipping, site and admin), outputs on the right (paper shipped and made, waste, profit).
- Value build-up Sankey: the band through the areas is as wide as the money spent so far; each input drops in where it's
  spent; site-wide costs join at Site & admin. Waste (rejects to landfill, effluent fiber, bales lost, broke repulped) is
  drawn in tons, not to scale. Status lamps and t/h on each area.
- Tap an input, area, band or output for its breakdown (cost parts, where it went, today's repair bills, current rates).
- The game runs at 1 min/s while it's open (like the DCS screens); Escape or ✕ closes. All four modes. On narrow screens
  the picture runs top to bottom.
- No economy change: the books are read from the ledger; the screen only notes where money went (`S.pf`, 11b-pflow.js) and
  splits the per-ton energy charge into energy and chemicals and water. Steam is 60% of energy (as the knobs use);
  power splits pulper 20% / stock prep 35% / machine 45%; chemicals split stock prep / wet end.
- `tools/pflowcheck.py`: the day's profit on the screen equals the cash change plus upgrades (to the cent), the areas add
  up to the cost, the day roll keeps yesterday, taps, Escape, slowdown, save round trip, phone layout, free play and zen.

## v6.2.0 (2026-10-18): zen free camera released to main (was test builds z1 and z2)

### z2
- Zen free camera: the river no longer streaks. The water was 6 mm above the bank sand, which z-fought under the perspective depth buffer; the water now has a depth offset.
- Zen free camera: wider river ripples with anisotropic filtering (iso view unchanged).
- River mist banks only show when the camera looks near level; from above they cut pale bands across the screen.
## v6.2.0-z1 (2026-10-18): zen free camera (test branch test/v6.2-zenfree)
- **Zen mode gets a free camera again:** a perspective camera that follows the zen shots as written (orbits, tilt-ups,
  low dollies, flyovers, ride-alongs), with the sky dome back; the game itself keeps the fixed iso view. The camera
  swaps on entering zen and back on leaving it (to the nearest zoom step). ?zeniso = zen stays isometric.
- While the free camera is on, people and vehicles are their 3D models (the paper pictures are taken from the iso
  direction and would show the wrong side); they go back to paper when zen ends.
- Measured (desktop, software rendering, 10 zen shots each): free camera 126-410 draws, 44-92k triangles; isometric zen
  47-82 draws, 33-58k triangles. Normal play: 6 regression plays clean.

## v6.1.4 (2026-10-18): tilt-shift removed
- The tilt-shift blur (t18 experiment) is gone: the scene draws straight to the screen again, and the Settings switch is
  removed.

## v6.1.3 (2026-10-18): broke hole
- The broke hole by the winder (the black square on the dry-end floor) is now a floor opening that reads as one: broke
  paper in a brown pit, a yellow kick-plate round the edge and a yellow guard rail on three sides.

## v6.1.2 (2026-10-18): iPhone people colours
- People showing as uncoloured 3D figures on an iPhone: when the cut-out self-test reads its first picture back empty
  (some iPhones do while shaders are still compiling), the game falls back to 3D people, and on iPhone the shared
  moving batches lose per-object colours (the old iPhone colour bug). Now the self-test is retried with a fresh picture
  1.5 s and 5 s later and switches the cut-outs back on if it passes; and on iPhone people and vehicles are never put
  in the shared batches, so the 3D fallback keeps its colours. Diagnostics logs "cut-outs: ..." for each step.
  ?cutfail forces the fallback for testing.

## v6.1.1 (2026-10-18): phone fixes
- **Tilt-shift on phones:** on a tall screen the sharp band was a fixed share of the height, so it was a sliver and
  most of the view blurred. The band and its fall-off are now set against the screen's width (wider on tall screens),
  and the blur is 30% softer on phones.
- **Blank cut-out people on iPhone (technicians showing as plain paper figures):** the tilt-shift's offscreen picture
  was 4x multisampled at the phone's full pixel ratio (~80 MB with its depth buffer), which starved the GPU memory the
  cut-out pictures need. Phones now draw it without multisampling (~25 MB).

## v6.1.0 (2026-10-18): release of the isometric paper build (test/v6.1-iso t1-t20) to main
- Everything in v6.1.0-t1 to t20 below: the fixed isometric camera and paper art style, cut-out people and vehicles,
  paper upsets, weather, night, water and rare sights, tilt-shift, performance work, and the t20 balance pass.
- QA before release: 50 full season playthroughs on t20 (4 maps, 4 play styles, 10 phone-sized, 25 dark mode): 50/50
  finished and submitted, 0 issues, 0 errors; balance check 200 seasons per build (tools/qa_balance.py).

## v6.1.0-t20 (2026-10-18): balance (test branch test/v6.1-iso)
Measured with tools/qa_balance.py: scripted testers play full 30-day seasons through the real dialogs (sim only), the
same seeds for every tester, 10 seeds on each of the four maps (200 seasons per comparison), plus every upgrade measured
alone and on top of the bottleneck fix (648 + 520 seasons).
- **Rounds pay more:** problems show 2.5 days ahead (was 1.5; survival still shortens it each wave, now 0.12 days a
  wave), and a problem caught on a round is fixed for 25% of its repair bill (was 40%). A daily round now catches about
  13 problems a season (was 10).
- **Capacity and maintenance upgrades re-priced:** they only pay once the machine is pushed harder, and at $1-3M they
  could not pay back inside a season. Winder rebuild $300k / $550k (was $450k / $1M), pulper rotor $350k / $700k
  ($600k / $1.4M), bigger chest $150k / $300k ($300k / $700k), electric forklifts $200k / $400k ($350k / $750k), extra
  dock doors $180k / $350k ($250k / $600k), robotic roll handling $450k / $800k / $1.2M ($0.8M / $1.6M / $3M), warehouse
  extension $200k / $400k ($500k / $1.1M), maintenance techs $120k / $220k / $350k ($250k / $500k / $900k) and they now
  also cut repair bills 10% a level, preventive maintenance $120k / $250k / $400k ($200k / $450k / $800k) and $150/h a
  level to run ($400/h), insurance premium $900/h ($1,500/h).
- Season profit by tester (mean of 40 seasons, before -> after): hands-off +$0.40M -> +$0.65M; daily rounds and outage
  prep +$1.12M -> +$1.59M; active (rounds, the bottleneck fix and value-for-money upgrades, proper fixes) +$5.79M ->
  +$6.17M; buys everything -$1.06M -> -$0.69M; gambler -$1.04M -> -$0.23M.

## v6.1.0-t19 (2026-10-18): tilt-shift band, winder trash can (test branch test/v6.1-iso)
- **Tilt-shift:** the sharp band across the middle is narrower (blur starts closer to the centre and reaches full
  strength sooner).
- **Winder trash can:** it stood inside the broke hole by the winder (the black square on the floor). Moved to the
  hole's corner, on the floor.

## v6.1.0-t18 (2026-10-18): zen fix, paper rare sights, tilt-shift (test branch test/v6.1-iso)
- **Zen mode: the mill disappeared in close shots.** Zen thickens the fog by scaling its distances, but in the iso view
  those distances include the camera's fixed 1.2 km stand-off, so every shot closer than the whole site was fogged out
  completely: only the cut-out people (drawn without fog) were left on a plain background. The zen fog now thickens from
  the zoom distance, as the normal fog does.
- **Rare sights as paper cut-outs:** the cowboys and horses, Bigfoot, the tug and barge, and the gator, the operator and
  the pirogue keep their full animation but are drawn as cut-out pictures with the paper edge (taken again 8 times a
  second, stop-motion, in a small atlas of their own). Their dust and smoke are paper clouds. ?softfx = 3D.
- **Tilt-shift (experiment):** the scene is drawn offscreen and mixed with a blurred half-size copy: a band across the
  middle stays sharp and the top and bottom soften, strongest at the whole-site zoom, with a touch more colour, for a
  photographed-miniature look. On by default except on the low tier; Settings > Graphics > Tilt-shift, ?tilt=0 / 1.
  Costs one full-size and four half-size passes a frame (not yet measured on a phone).

## v6.1.0-t17 (2026-10-18): bird cut-scene fix (test branch test/v6.1-iso)
- **Bird on the power lines:** set off from the Upsets list, the cut-scene was skipped (it never plays over an open sheet).
  Picking it now closes the list and the cut-scene plays; a bird that strikes while any sheet or the stats panel is open
  waits and plays the moment it closes (if the bird is still on the lines).

## v6.1.0-t16 (2026-10-18): polish from the t15 season QA (test branch test/v6.1-iso)
- **Paper props dim at night** like the cut-out people (to 38% at full night): cut-out cards (beaver, car, highway props,
  junk, shaft halves, pigeon), paper ice, dye splats, the tornado card, paper clouds, smoke, drops, confetti and feathers.
  Incident flags dim to 55% so they still read. Flames, sparks, lamps and the lightning bolt stay bright.
- **Labels never overlap:** placed in order (upsets, red/bottleneck labels, area labels, equipment) and any label that
  would overlap one already placed is left out. In the iso view the whole-site zoom step counts as zoomed out, so only
  the area labels show there.
- **Fewer cut-out pictures:** a truck's or lift's load counts in four steps (empty, a third, two thirds, full) instead of
  bale by bale; a full picture atlas reuses the slot of the picture least recently shown instead of starting over.
  Probe (2.5 min of play at 20x, 7 views): new pictures 274 -> 226, truck pictures 46 -> 26, atlas restarts 1 -> 0
  (109 slots reused). Most of what is left is people: new crews' outfits and walking frames.

## v6.1.0-t15 (2026-10-18): beaver rework (test branch test/v6.1-iso)
- **Beaver:** one cut-out silhouette with a single ink line round the outside (no outlines between body, head, tail and
  log), about half the size (7 m long); its incident flag moved beside it so the stick no longer runs through it;
  smaller bob and wood chips.

## v6.1.0-t14 (2026-10-18): paper upsets (test branch test/v6.1-iso)
- **Cut-out props:** the giant beaver (chews a log, two drawings), the brawl car, the highway barriers, cones and tipped
  tanker, the bad-OCC junk (bottles, foam, bags, wire) and the snapped driveshaft halves are drawn cards with an ink line
  that face the camera.
- **Cut-out pigeon:** bird in the winder and the bird-on-the-power-lines cut-scene use a paper pigeon (wings up, down and
  folded for the dive) that faces the way it flies; paper feathers when it hits.
- **Paper particles:** paper sparks (stars and zig-zags) for the driveshaft and a failed winder drive; paper steam jets
  for the steam joint and boiler trip; paper fireworks for flares in a bale (stars that burst into confetti, pink paper
  puffs); paper drops and brown paper puffs for the screens, cleaners, rotor trip and couch pit; paper drops for the
  warehouse roof leak (were streaks).
- **Paper ice and water:** the iced intake's shelf and floes are flat pale-blue card with ink cracks; the bayou flood and
  swollen canal are paper water.
- **New effects:** torn paper scraps flutter off the section when the fabric runs off or a press felt blows; dye trouble
  splats dye across the tending-side floor and puffs the colour off the sheet.
- Unchanged by choice: refiner clash, slime, ragger, dryer wrap, felt oscillator, fog fan, wastewater permit, brownout,
  forklifts red-tagged, dust storm. ?softfx = the old props and particles.

## v6.1.0-t13 (2026-10-18): paper effects (test branch test/v6.1-iso)
- **Weather visible again:** in the iso view snow and dust were sub-pixel dots, rain faint 1 px lines and fog never reached
  the mill. Flakes and dust are now 3-5 px dots, rain longer blue-grey streaks at 55%, the weather box scales with the zoom,
  and fog, snow and dust storms lay a haze over the mill itself. (Plain particles, no paper styling.)
- **Paper flames:** fires are cut-paper flames (red with an ink line, orange and yellow cut inside) that swap between four
  shapes for a stop-motion flicker. Sparks unchanged. ?softfire = before.
- **Tornado:** a paper cut-out a child might have made (wobbly grey bands, fat crayon outline, white scribbles, paper scraps)
  that faces the camera, sways and boils between two drawings. Roofs it passes over blow off (the cutaway lift and fade)
  and settle back down a couple of seconds after it passes. ?softtornado = before.
- **Night:** lamp light is a crisp paper ellipse on the floor plus a see-through paper cone from each lamp; beacon and
  status lamps are paper discs with an ink ring; lit house windows are yellow paper panes with an ink frame and glazing
  bars. ?softnight = before.
- **Incident flags:** the glossy map pins are paper flags on an ink stick (icon on a white disc), fluttering between two
  cut shapes. Warning lamps on upsets (highway, lightning, police) are paper discs. ?softfx = before.
- **Lightning:** a zig-zag bolt cut from yellow card with an ink line (was a white tube with glows).
- **Paper water:** the aeration pond, clarifier, floods and spilled stock are flat paper with cut lighter strips and darker
  slivers (concentric strips in the clarifier); flood and pulp sheets nearly opaque; wider paper ripple rings. ?softwater = before.

## v6.1.0-t12 (2026-10-18): polish round (test branch test/v6.1-iso)
- **Paper smoke:** the smoke stack's plume is paper cut-out clouds (card fill, ink line, a fold of shade), fewer and
  bigger, that rise in little hops, sway and rock, swell a touch and fade out at the top. ?softplume = the old steam.
  The fog elimination fan's vapour is the same paper clouds, smaller.
- **Blinking lights in time:** a merged static object whose colour changes (beacons, alarm and status lights) is followed
  every frame from its first change on (the watch only looked twice a second).
- **Stronger seasons:** spring is pale yellow-green with pink and cream blossom on a fifth of the trees; summer is deep,
  saturated green (it was the plain colours); slight seasonal tints. A season change recolours in a few frames (3 ms of
  work a frame) instead of a slow wipe.
- **Sharper on phones:** low tier 1.5x and medium 2x pixel ratio within a pixel budget (was 1x / 1.25x); the low-FPS
  fallback still drops to 1x on a struggling device.
- **Less parking churn:** parked cars and activity props go to the moving batches from the start; static groups are
  parked after 30 s. Groups un-parked again: 37 -> 0-6 per run (hand-backs of other static objects little changed, ~270).
- **Upset effects instanced:** an effect's look-alike parts (rain streaks, ripples, splash blobs, tornado puffs and debris)
  draw as one instanced mesh per shape and look; sprites become camera-facing cards. Roof leak ~100 draws -> 6, tornado
  ~75 -> ~6, pulper overflow 19 -> 6. ?nofxinst = before.
- **Cut-out pictures at start:** every actor's look at all 8 headings is pictured behind the start-up screen (up to
  1.5 s), keeping 30% of each atlas free; people get a 2048 square atlas. Pictures taken during play ~35% fewer.

## v6.1.0-t11 (2026-10-18): QA fixes (test branch test/v6.1-iso)
- **Cut-outs never drawn as loose 3D parts:** the moving batches picked up parts of cut-out actors (pooled trucks, new
  workers, loads added later) and drew them with the frozen world matrices the cut-out system leaves on them: bare red and
  blue boxes near the reel (a truck's trailer and cab) and floating limbs. Batches now skip anything under an actor, and an
  actor built mid-play is hidden the moment it is made (picked up on the next frame, not the next 2 s scan).
- **Cut-out fallback:** when the picture self-test fails, actors go back to the drawn layer (they stayed hidden).
- **Roofs per zoom step:** on or off at each step (the fade ramp's midpoint is the switch), eased as before; at step 190 every
  roof but the machine hall was stuck at 29% opacity, lifted 4.6 m.

## v6.1.0-t10 (2026-10-17): draw cut 2 (test branch test/v6.1-iso)
- **Colour in the matrix:** batched objects carry their colour in the unused bottom row of their own instance matrix
  (the per-object channel that works on iPhone). Moving things: one batch per look on every device (iPhone had one per
  colour), shared geometry instead of a coloured copy each, and a move or colour change uploads only that object's 64
  bytes. Static flat things: one BatchedMesh per look with per-object culling everywhere (iPhone used baked 90 m cells).
  ?dbold = previous moving batches; ?flatbake = baked flat batches.
- **Roofs:** each roof's plain parts in one vertex-coloured draw and its outlines in another (they still lift and fade);
  all outline styles elsewhere share one draw (colour and opacity per vertex).
- **Uploads only on change:** instanced sets (bales, rolls, wires, hay, janitorial, beater line) compare before uploading;
  dryer cans no longer re-upload every frame (flat cylinders: the spin can't be seen; ?canspin); cut-out cards upload
  only when something moved; particles use one interleaved buffer (one upload per batch, was five); the headbox jet only
  when the lip moves; the wet line at 12 frames a second.
- **Culling fix:** with shadow maps off, shadowMap.needsUpdate stayed set, so every static batch re-culled every instance
  every frame (and re-uploaded its draw list). Now only when the camera moves or a batch's visibility changes; a batch
  whose visibility changed is re-culled rather than drawn whole.
- **Parked groups:** groups whose every part is a frozen, batched original are taken out of the scene graph (watched for
  movement; anything that moves brings its group back). Pathfinding still sees them.
- **Cut-out pose frames:** people snap to a few fixed pose frames (stop-motion), coarser look keys.
- **Zoom detail:** at the whole-site and mid zoom steps, parts too small to cover a pixel are switched off in their batch.
- **iPhone watch fix:** the static-merge watch read a missing BatchedMesh on baked records and threw on every pass, so
  on iPhone nothing that moved was ever handed back.
- Empty moving batches are skipped; growth check: the scene grows only while the truck and worker pools fill (bounded).

## v6.1.0-t9 (2026-10-17): reel fix (test branch test/v6.1-iso)
- **Reel paper was invisible:** the multi-material split (t2) left the growing reel with paper faces only, and the frame loop
  put the three-material array back on it every frame, so the paper body drew nothing (only the end caps). It now takes
  the single paper material (dye trouble still recolours it, caps included).

## v6.1.0-t8 (2026-10-17): paper palette and draw cut (test branch test/v6.1-iso)
- **A deliberate palette:** 40 colours for the whole world (papers, krafts, slates and inks; greens, earths and waters;
  accents: safety yellow, orange, alarm red, pipe blue, brick). Every lit material, every scenery colour and the ground
  snap to their nearest swatch (Lab distance); the brand colour stays exactly as chosen. The ground becomes posterised
  paper patches instead of smooth gradients. Theme and brand changes re-snap.
- **Flat surfaces:** concrete, asphalt, roof sheet, tank and can metal, ribbed walls, motors, bales and roll ends lose
  their textures for flat colour (the material keeps the texture's average tone). The animated felt, wire and rope and
  the lettered signs keep theirs.
- **Paper grain:** the full-screen colour grade now also lays a fine paper grain over everything (no texture, one pass
  that was already drawn for time of day; now always on).
- **Draws:** bales are one instanced mesh per shape for all three grades (grade = colour); rolls draw with one material;
  static instanced sets (fence posts, rail ties, lamp poles and heads, pallets, extinguishers) are baked into the palette
  batches; the soft floor-shading decals are gone (the drop shadows do that job); glass bands are solid; outlines are one
  batch per line style; the ten lamp-light pools are one mesh. Mid zoom 134 → 90 draws, whole site 157 → 110 (main: 350
  / 365).

## v6.1.0-t7 (2026-10-17): triangle cut (test branch test/v6.1-iso)
- **Paper-card trees:** broadleaf, conifer, cypress and bushes are flat standees facing the camera (a crown polygon and a
  trunk strip, lighter at the top), 4-7 triangles instead of 8-26.
- **Flat ground:** no hills on any map (the bayou keeps its raised mill pad); the ground mesh uses 24 m cells (12 m on
  the bayou, 16 m by the sea): about 1,900 triangles instead of 16,800.
- **Hidden faces removed:** the camera never turns, so every static single-sided shape (mill and scenery) keeps only its
  triangles facing the camera, one stripped copy per shape and orientation; a part that later moves gets its full shape
  back. Mill: 59,800 → 30,300 triangles. `?nostrip` turns it off.
- **Plain boxes** instead of rounded ones (12 triangles, shared per size); **round things** have 6-12 sides (spheres 8 x 6).
- Triangles per frame, 1100 x 700 view: mid zoom 169k → 68k, whole site 220k → 84k. Phone view: whole site 143k → 60k,
  mid 103k → 50k, close 44k → 26k (main: 175k / 152k / 79k).

## v6.1.0-t6 (2026-10-17): iso optimization round (test branch test/v6.1-iso)
Profiled frame by frame (CPU, per drawn frame, phone-sized view). The biggest costs were work done for things nobody can see:
- **Hidden objects skip the world-matrix pass.** The game builds many effect, crew, civics and outage groups up front and
  keeps them hidden (about a third of the scene); three.js still updated all their matrices every frame. A hidden object
  and everything under it now skips that pass and catches up the frame it is shown. Matrix update 4.2 → 1.1 ms.
- **Moving batches stop re-checking hidden parts.** Their per-frame check walked about 2,500 parts, most of them inside
  those hidden groups; a hidden group's parts now cost one check, settled parts are checked every 8th frame instead of
  every 4th, and the cut-out models leave the batches the moment they are found. 11.7 → 4.8 ms.
- **Season recolour** 3,000 vertices a frame (4.7 → 0.9 ms while it runs).
- **Cut-outs** re-read each figure's look every other tick.
- JS per frame (median, software renderer) about 42 → 36 ms; the main render is a little cheaper too (15.5 → 12.2 ms).
  Absolute numbers are from the software renderer, so only the ratios mean anything.

## v6.1.0-t5 (2026-10-17): cut-out edge artifact (test branch test/v6.1-iso)
- Moving cut-outs had a stray patch of ink and paper at their top right. The finishing pass grows the ink line by sampling
  around each pixel; near the picture's top and right edges it read past the picture into the scratch target, where a
  bigger earlier picture (a truck or fork-truck) was still lying, and drew its outline. Samples outside the picture now
  count as empty, and the scratch target is cleared a little past the picture too.

## v6.1.0-t4 (2026-10-17): iso fixes (test branch test/v6.1-iso)
- **Operators, fork-trucks and trucks show again.** t3 stopped updating the hidden models' parts every frame, which also
  stopped them following the model into its picture, so every picture came out empty and the cut-outs vanished. The
  parts are now brought along for each picture. A start-up self-test reads one picture back once: if a device ever
  produces empty pictures, the cut-outs stay off and the 3D models are shown instead of nothing.
- **Less stutter:** stop-motion is now off by default (Settings → Performance to turn it on); pictures are taken one a
  frame (four in the first seconds) and the atlas mipmaps are rebuilt once a frame instead of after every picture; the
  pictures use a plain 8-bit target (lit at half strength, doubled in the finishing pass) that every phone can render;
  the season recolour runs 12,000 vertices a frame instead of a whole mesh.

## v6.1.0-t3 (2026-10-17): iso test, round 3 (test branch test/v6.1-iso)
- **iPhone/iPad get the colour-sharing too:** a BatchedMesh's per-object colour draws grey there, so on those devices
  untextured looks that differ only in colour are baked into plain vertex-coloured meshes per 90 m cell (the method the
  scenery already uses on iOS). `?flatbake=1` forces that path for testing; it renders the same colours.
- **Dryer cans:** the 20 spinning cans are one instanced draw (the game still turns the original cans, now hidden).
- **Sign atlas:** small unlit signs and tags with their own canvas texture are copied into one shared texture on the first
  frame, so they batch into one draw; a sign the game redraws is copied again.
- **Lighter frames:** the hidden cut-out models' parts no longer update their world matrices every frame (about 2,000
  nodes); UI panels refresh 2.5 times a second while no panel is open; the season recolour runs one mesh per frame.
- **Cut-outs:** coarser pose steps (fewer pictures); their card shaders compile at start-up; Zen is stop-motion too.
- Summer's colour grade is neutral, so a midday summer view skips the full-screen tint pass; roofs lift faster.
- Draws per frame at mid zoom, same probe: t2 204 → t3 157 (main 456); whole mill about 176 (main about 520).

## v6.1.0-t2 (2026-10-17): iso test, round 2 (test branch test/v6.1-iso)
- **Cut-outs never fall back to 3D.** t1 switched every cut-out back to its 3D model for good the first time a truck was
  pictured (its trailer sides use two materials, which the look key didn't expect). Now a cut-out is hidden from its first
  frame; until its own picture exists it borrows the nearest one (its last, else one of its kind at that heading); errors
  are counted per picture and never switch the paper look off. An atlas that fills starts over instead of giving up.
- **Pictures are taken on the GPU.** t1 read every picture back with `gl.readPixels`, which stalled the GPU each time
  (about 600 ms per picture in the software renderer; on phones a visible hitch). Now the model is drawn into a small
  float render target and a finishing pass writes it into the atlas (a render target too) with the screen's tone mapping
  and colour encoding, the paper edge and the ink line. Nothing comes back to the CPU. Their shaders compile behind the
  "Getting the mill ready" screen.
- **Stop-motion world** (Settings → Performance, on by default): while the view is still, the mill is updated and drawn
  15 times a second; a pan, zoom or glide draws every frame. Frames in between draw nothing (the last picture stays).
- **Fewer draws:** untextured opaque materials that differ only in colour now share one static batch, each object
  carrying its colour (`?noflat` turns it off); multi-material meshes (deck plates with grating tops, gauge faces) are
  split into single-material parts on the first frame so they batch too; moving-batch looks no longer split by shadow
  flags. Whole-mill view: about 330 → 200 draws.
- **Cheaper shading:** Lambert on every tier (the paper look needs no PBR); no sky dome, clouds or mist (the fixed view
  never shows the sky); the shadow-map proxies and the 2-second shadow trim no longer run.
- Atlases are 2048 × 1024 (half the memory of t1).
- Tools: `isobench.py` (frames, renders, JS and render ms, draws per view; `--stopmo=off`), `isoshots.py` (season and
  time-of-day arguments).

## v6.1.0-t1 (2026-10-17): isometric paper view (test branch test/v6.1-iso)
- **Fixed isometric camera:** orthographic, true iso angle, no turning or tilting. Drag pans 1:1; zoom moves in whole
  steps of the widest view (1x, 2x, 3x, 4x, 6x, 8x, 12x) so the ink lines stay crisp.
- **2D cut-outs** for workers, fork-trucks (and clamp trucks) and delivery trucks only: each is a picture of its 3D model
  from the iso angle (8 headings, its current pose and load), with a paper edge and an ink line, drawn as a flat card at
  12 fps (stop-motion). The 3D models keep running underneath on a hidden layer.
- **Drop shadows** replace shadow maps: one flat dark-paper mesh of every standing object's outline, pushed right and a
  little toward the viewer, darkened once per pixel (stencil). The cut-outs carry their own. Settings → View → Drop shadows.
- **Cutaway buildings:** roofs and the machine hall shell lift off like a box lid as you zoom in. Settings → View →
  Cutaway: Auto (by zoom), On, Off.
- **Season palettes:** spring, summer, autumn or winter per season (rolled at the start, like the bottleneck), one per
  wave in survival, every 7 days in free play and Zen: trees, bushes and grass recoloured once. **Time of day** is a
  single full-screen colour shift (dawn peach, dusk rose, night blue).
- Bare graphics tier removed on this branch; Burg Gretesch was never in the repo, so the four maps are unchanged.

---
Older entries (v4.0.0 to v5.7.4, 2026-10-09 to 2026-10-17): see `CHANGELOG-archive.md`.
