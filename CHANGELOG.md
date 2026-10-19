# Changelog


## v6.5.3 (2026-10-19): quality specs
Built on test/v6.5.3-specs, merged into main.
- **A spec sheet for every grade** (`QSPEC`, new 07e-quality.js): basis weight target ±3% (23m 23.81–25.29, 26m
  25.28–26.84, 30m 29.15–30.95, 33HT 32.09–34.07 lb/1000 ft²), reel moisture 8 ±2% (6.0–10.0%), and the mill's
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
  hard-coded PM3.
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
- **Paper sells for $15/t less** (23m $642, 26m $662, 30m $680, 33HT $741): inactive play is punished most.
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
  demand is calibrated on PM3 data: each grade's median pressure at its standard rate (23m 122, 26m 126, 30m 138,
  33HT 135 kPa), +3.0 kPa per extra t/h on 23m, scaled by basis weight for the other grades.
- **Ceiling 180 kPa** (PM3's 3rd section tops out at 171; raised so the game runs: hands-off seasons peak at 139, a
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
- **Paper prices** lowered by what that saves per ton, so profit is unchanged: 23m $657, 26m $677, 30m $695, 33HT $756.
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

## v5.7.4 (2026-10-17): version notes
- **Version notes:** tap the version number at the bottom of the title screen three times quickly (or press Enter three
  times on it) and a list of every version's one-line note pops up, newest first, with the current version marked.
  Escape, ✕ or a tap outside closes it.
- The notes live in `VERSION-NOTES.txt` at the repo root; `build.py` embeds them and warns if `APP_VER` has no line, so
  add a line there with every release.

## v5.7.3 (2026-10-16): Bare graphics
- **Graphics quality → Bare**: the bones only, for weak phones and long sessions on battery. Flat unlit colours, plain
  boxes, no shadows or outlines, no sky, clouds or weather, nothing outside the fence but the ground and roads, no
  ambient life (tours, managers, janitor, scrubbers, birds, food truck), no civics scenery, token puffs for upsets (tags
  and labels as usual), and 30 FPS at most. Crews, trucks, forklifts, tells, rounds and knobs all work as before.
- The player's choice only (Auto never picks it); changing to or from Bare takes a reload, offered as before.
- Measured in phone emulation against Low: frame cost −44%, GPU −45%, CPU −21%, triangles −61%, no shadow pass,
  shader programs 81 → 67, texture memory −40%.
- Tools: `barecheck.py` (Low vs Bare screenshots, counts, and an error-free run with every upset, a Round and a knob).

## v5.7.2 (2026-10-16): help page
- **Help**, from a new ? button on the title screen (next to the settings cog) and a Help tile in the pause menu: one page
  with two tabs.
- **Game guide:** short sections on the goal and modes, the flow from truck to warehouse, the bottleneck and upgrades,
  upsets, daily rounds and tells, planned outages and prep, civics, mill leaders, fiddly knobs, controls, and scores
  and saving.
- **Glossary:** 51 game and mill terms (OCC, pulper, ragger, headbox, hayout, basis weight, tell, wave...) with a filter.
- **Tutorial:** in a run, "Replay the tutorial" closes Help and runs the quick-start cards; on the title screen it turns
  the tutorial on for your next run. The game stays paused while Help is open.
- Tools: `helpcheck.py`.

## v5.7.1 (2026-10-16): dock order
- The bottom menu reads Upgrades · Upsets · Report · Round · Settings: Settings is back on the far right.

## v5.7.0 (2026-10-16): catching failures early
New design principle: failures are visible before they occur. Mills that walk the floor and invest in monitoring pay
less and lose less time. Every number is a first guess (balancing comes later).
- **Tells.** Equipment and property upsets (stock prep, wet end, dry end and winder, yard and warehouse, utilities: 27 in
  all) are pre-rolled: the same dice as before, but a hit is queued and fires 1.5 in-game days later (survival: 0.1 day
  less each wave, at least 1 day). Until then a clearly failing piece of equipment sits at the spot: a red-hot motor,
  a pump shaking itself loose, a weeping flange, a hissing steam joint, pallets stacked against a heater, a forklift
  dripping oil. Acts of nature, people and supply events, the chest overflow, knob breakdowns and civic upsets still
  come without warning.
- **Daily Round.** A Round button in the dock, once per in-game day (the day turns over at 6 AM). Pick an area and an
  operator walks it for about 15 seconds while the game keeps running; the camera follows. Tells only show during a
  Round, in the area being walked. Tap one: planned repair at 40% of the bill, no downtime, Machinery +3, Labor +1.
  Miss it and it fires as usual. A walk through an area with nothing wrong still gives Labor +1 (plant) or Community +1
  (yard, utilities). Tap targets are sized for phones.
- **Vibration Report.** The Round card lists the six areas; with the report each shows steady, climbing or climbing fast
  (due within a day). It comes with the Reliability program (level 1, which now also gives Machinery +6) or with Dot.
- **Outage prep checklist.** Opens 3 days before each planned outage, from the outage countdown or the Round card, and in
  the 24-hour budget dialog. Four items unlock at 72, 48, 24 and 8 hours out: order the parts (now at full price, or a
  cheaper lot that arrives half the time, with a rush order if it doesn't), walk the job plan with the crew, contractors
  or your own crew, and drawing down (the machine runs at 85% until the shutdown). Each completed item takes minutes off
  the outage (never under an hour) and returns 5% of its budget when it ends. The countdown and the "Outage has begun"
  notice show the tally ("Prep 3/4 — outage shortened 1 h 35 m").
- **Visible:** the end screens (season and survival) and the mill report show "Upsets caught early: N — saved $X and Y
  hours of downtime".
- Seasons and survival get everything; free play gets tells, Rounds and the report (no planned outages, so no
  checklist); zen has none of it.
- The seeded run changes (upsets now land 1.5 days after their roll); hands-off runs still replay identically.
- Tools: `tellcheck.py` (45 checks), `tellshots.py`, `telluishots.py`, `gridview.py` (top-down layout view with a grid).

## v5.6.0 (2026-10-16): fiddly knobs
Red knobs all over the mill that do nothing until you touch them. Move one and the trouble turns up later, often
somewhere else, and you trace it back on the new DCS and QCS screens. Every knob starts at standard; a game where
nobody touches them plays exactly as before (same seeded checksum `272b1f02`, determinism unchanged).
- **Ten new knobs.** Stock prep: pulper dilution valve (too thick trips the rotor, too thin overflows the pulper and
  starves the chest), refiner plate gap (run in too far and the plates clash), machine chest agitator (consistency
  swings, off-spec, then a wet-end break). Wet end: headbox dilution zones (CD streaks, reels rejected until the
  operator finds them), forming table vacuum (low: wetter sheet, more steam, wet-end breaks; high: wears the fabric out),
  press loading (high: crushing; low: the dryers pull more steam until the boiler trips), fabric guide roll (manual
  drifts; trimmed on AUTO works until it runs out of travel, then the fabric walks off and needs changing), couch pit
  agitator (fiber settles, and the next wet-end break overflows the pit onto the floor), pick-up felt oscillator
  (stripes, off-spec, maintenance restarts it). Dry end: press-to-dryer draw (tight snaps, slack wrinkles the reel and
  the draw flutters) and 1st section steam.
- **Knobs act together.** Refiner gap, vacuum and press loading set how much water reaches the dryers; with
  1st section steam they decide whether the sheet comes off wet (off-spec, dryer breaks, a boiler trip) or over-dried
  (brittle reel breaks). Dryer steam shows up in the energy bill and as steam off the dryer roof.
- **Real costs:** repair bills, paper to the beater, steam, breaks and downtime. The crew always traces a problem back
  in the end and sets the knob to standard, and the log names it.
- **DCS and QCS screens** for SPOT (stock prep), WET (wet end) and DET (dry end): a process picture with live tags,
  alarms, setpoints and 6-hour trends; QCS shows the reel's status, basis weight and moisture trends, the CD moisture
  profile and web inspection counts. Open them from the operator consoles (a new one in stock prep, the three on the
  machine floor). Field knobs open their own panel when you tap the red hardware.
- **The game slows to 1 min/s** while a knob panel or DCS screen is open (and the spider valve and slice panels), and is
  back at your speed when you close it.
- **Fiddly knobs view** (Settings → View): the mill washes out and only the red knobs and their labels stay, including
  the spider valve and the headbox slice. Tap one to open it.
- Base values on the screens follow PM3 run data (reel speed, basis weight and 3rd section steam by grade).
- Season, survival and free play; not in zen mode.
- Tools: `knobcheck.py` (new); `smoke.py`, `settingscheck.py`, `savecheck.py`, `speedcheck.py` follow the v5.1 start
  flow again (leader picker; civics choices cleared while waiting for an outage).

## v5.5.0 (2026-10-16): performance
Less work per frame in normal play, measured with the new frame-cost benchmark (`tools/fpsbench.py`, phone emulation,
main v5.4.2 vs this build run alternately): frame cost −12% (Chromium) / −14% (WebKit, Safari's engine), GPU −12–13%,
triangles per frame −24%, shadow-pass draws −28%. Gameplay unchanged (same seeded checksum `272b1f02`, determinism, smoke).
- Nodes that haven't moved no longer have their matrices recomputed every frame.
- Off-screen scenery in the merged batches is culled, only on frames where the camera moved or shadows refresh.
- Frozen scenery originals at the top of the scene are parked outside the scene graph, so three.js stops walking them.
- Phone tiers (Low/Medium) take 3 shadow samples per pixel instead of 5: very slightly grainier shadow edges (`?taps=5` restores).
- The disc filter's 11 disks draw in 2 calls instead of 33; empty bale and roll meshes are skipped.
- Tools: `fpsbench.py` (frame cost that a 60 Hz display can't hide; `--ab` for interleaved before/after), `abtest.py`,
  `gpuexp.py`, `drawcost.py`; `determinism.py` follows the v5 start flow. See PERF-LOOP.md.

## v5.4.2 (2026-10-15): graphics quality on the title screen
- Title screen → Settings → Graphics now has **Graphics quality** (Auto, Low, Medium, High, Ultra), the same setting as in-game Settings → Graphics; Auto names the tier picked for the device. Changes apply at once; lighting and scenery detail need a reload, offered with a **Reload now** button.

## v5.4.1 (fix, 2026-10-15): no old-menu flash on load
- The game script waits for the 3D library (three.js) before it runs, and until then the page showed its static markup: the old pause menu, for as long as the download took. A dark "The Paper Mill" splash with a loading bar now stands in until the title screen is built, and nothing else on the page shows behind it. Test links that skip the title (`?env=`, `?autotest`, `?notitle`, `?zen=1`) are unchanged.
- three.js starts downloading from the top of the page (modulepreload), so the wait is shorter.
- The browser bar colour starts dark to match.

## v5.4.0 (release, 2026-10-15): title screen, civics world, dark mode
Released to main. Brings in everything from the v5.1–v5.4 test builds (v5.1.0 civics and leaders in seasons are released with it).

- **Title screen (v5.2):** Mode → Map → Leader. Season, Survival, Free Play and Zen Mode, a settings cog and a sound toggle. One of five painted backgrounds per load with bokeh and vignette (after a map change, that map's own scene), and its own welcoming theme, "Morning at the Mill". Main menu in the pause menu returns to it; Continue resumes the run.
- **Civics in the world (v5.2):** meter levels change the mill and town (lit windows, the car park, signs, protests, a barbecue, beacons and more); civic events and upsets that had no animation got one.
- **Camera pulls (v5.2, v5.4):** major civic events and upsets fly the camera there and back; a touch or key cancels. For a major upset the camera flies there first, then its choice card opens. Settings → "Fly to big moments" turns it off.
- **Top bar (v5.2):** the leader's face sits in the bar (tap for their card), the outage countdown is under the clock, the civics meters are slim colour bars with icons; the mill name moved to the expanded panel and the pause menu.
- **Dark mode (v5.3, v5.4):** the interface follows the device's light/dark setting, live; Settings → Appearance pins Auto, Light or Dark. The mill keeps its own brand colour (lifted for dark panels), the trend chart and 3D labels follow the theme; the 3D world is unchanged.
- **Performance (v5.2 review):** DOM writes cut from ~183/s to ~6/s and browser render time per frame from 6.4 to 3.8 ms; finished trucks no longer pile up in the scene; civics scenes build a few per frame during start-up; nothing is drawn behind the title screen. Dead code removed. The simulation is bit-identical.
- **QA (three rounds, 100 scripted runs each, plus agent players):**
  - Bugs fixed: the season-start banner said INSTALLED; Esc didn't close the meter popup; the tutorial pointed under the top bar; the open stats panel covered the meters; Esc on the title's map step after backing out of the leader picker; major upsets usually lost their camera pull; the trend chart ignored dark mode.
  - Phones: 44 px touch targets throughout; a compact leader picker (one line each for strength and drawback, the picked card opens fully); cash and profit fit beside the grade (the grade badge lives in the Report tab on phones); sharp trend-chart text; the title Settings Done button stays in view.
  - Polish: banners wait while the tutorial is open; a double tap can't act on the next title step; the title's "THE" and focus rings; dark-mode dialog edges, outage picks, pips and panel.
- **Tools:** `tools/qa_v52.py` (100-run QA with title-screen starts, top-bar, civics-scene and theme checks; half the runs in dark mode); `tools/titleart.py` packs the title backgrounds.

## v5.1.0 (test build, 2026-10-15): civics, leaders in seasons, two QA rounds
Test branch only, not released. Four civics meters (Economy, Labor, Machinery, Community, 0–100) run in seasons and survival; mill leaders now run seasons too.

- **Civics:** upsets offer 2–3 choices with a cost, odds and meter effects; new customer, crew, community and supply upsets; warnings under 40, crises under 20, rewards over 80. Players see bands; effects scale underneath. Standing orders answer an area's upsets for you, with a toast and a Change button.
- **Leaders in seasons:** the leader picker opens before a season; one change of leader per season at an outage.
- **QA round 1 (100 runs + review):** free play drops an open card; the standing-order toast commits on sim time; Change queues behind open dialogs; outage levers default to None; meter chips show points; walkout raise and rush order are real; the phone bar is one row; Tab stays in the card.
- **QA round 2 (100 runs + four agent players):**
  - Bugs: the bird cut-scene stays paused if a card or dialog opened; phone meter chips show a ▲/▼ trend; Invest/Hold/Decline labels match the option names; renting forklifts is $10k; the survival picker words Chip's lock for waves; Chip's season fiber lock never costs more than the market and re-prices when it ends; version v5.1.0; phone cash and profit fit beside the grade badge.
  - Balance: price premium Economy −15, discount +9; warning fixes cost $35k; Chip's pay settlements +10% per deal; community choices give +6; an answered upset can't return for 2 days; a cheap fix always costs one tier less than the proper fix.
  - Screens: event cards and the outage plan draw under the pause menu, and its keys work over a card; the report card waits for a pending toast; a tutorial card for the leader and the meters; 44 px tap targets; the leader card and outage dialog list only the current or incoming leader's running cost; a Civics row and meter summary on report cards and the end screen; perks on the Change-leader panel; dock upgrade text once the bottleneck is fixed; mill names use letters, numbers, spaces and . _ ' - &.
  - Wording: fiber lock line, price setting band, plant-manager note, season chip label, plain short labels on the chip, no line break after a minus sign, plain words for "Scabs", "30m" and "33HT" on cards (the grade picker shows both).

## v5.0.6 (release, 2026-10-14): fixes and polish from the 100-run survival QA
From the v5.0.5 QA report (100 bot runs and four agent players). Online, run `supabase/name-filter-v2.sql` once so the boards fold look-alike names too.

- **Outages run at your speed.** The 5 min/s outage clock is now opt-in: the "Outage has begun" notice has a **Watch the crews** button that slows the clock to 5 min/s and flies the camera to the job. Pressing − or + while watching hands your speed straight back, and watching ends with the outage. Playtests found nothing to do in the old 48 s (no upsets or cards can start during an outage) and at 60 min/s it was a third of a run. The notice now closes when the outage ends, so it never outlives a fast one. The speed readout says "Watching crews · 5 min/s" while you watch.
- **Leaderboard names:** the player name now goes through the same banned-word filter as the mill name (a look-alike name reached the board); the filter also folds Unicode look-alikes, full-width letters and accents ("fυck", "ｆｕｃｋ"). `supabase/name-filter-v2.sql` does the same folding on the server.
- **One post per run:** pressing Enter in the name box after Submit no longer posts the score again.
- **Board highlight:** after you submit, only this run's row is marked, not every row with your name.
- **Survival outage budgets rebalanced:** the cheapest budget was the best one by about 6 days and the top one the worst. Survival budgets per area are now $40k (35% more breakdowns), $70k (unchanged) and $120k (25% fewer). Ten matched runs, buyer bot, desert, Chip: cheapest 40.2 days, standard 42.6, top when cash is over $1.5M 45.0 (was 50.6 / 42.6 / 40.1). Seasons keep $20k / $70k / $170k. The dialog and the outage-complete banner take their percentages from the table.
- **Wave report card:** a net cost from event cards now has its own "Deals & trials" row, so the money rows add up to Net.
- **Game over** says why: the −$1.5M bankruptcy line and how far costs and upsets had climbed. The survival tutorial names the line too.
- **Event cards:** "New roll wrap film" and "VIP customer tour" are no longer dealt again once won, so their permanent price bonuses can't stack when the survival deck reshuffles.
- **Tutorial:** speed and sound are in the panel that opens from the stats bar (it said "the top bar").

### Polish (reviewed item by item)
- **Cash below zero:** a one-time banner the first time cash drops under $0 in a run, with the −$1.5M line and roughly how many days are left at that rate.
- **Report card:** "Wave 6 done." instead of "Wave 6 survived." (the wave may have lost money).
- **Event cards:** when the odds depend on upgrades, the hint line says whether you have them ("You don't have it yet.", "You have both.").
- **Spelling:** "fiber" everywhere the player sees it (it was "fibre" except on one card).
- **Phone top bar:** the clock keeps its width; cash and profit give way, so "W6 · D23" is never cut off.
- **Outage dialog:** the leader row uses the short name ("Dot Blade") and the tally values don't wrap.
- **Upgrades:** "6 AM" never splits across lines; on narrow phones the header reads "Next upgrade: tomorrow 6 AM".
- **Outage notice** waits until an event card's result has closed, so it never lands on top of it.
- **Bird cut-scene** doesn't play over an open sheet or the stats panel (it hid the panel and ate the clicks); the upset still happens.
- **Rename:** the mill-name box shows a 32-character counter.
- **Continue:** the top bar (speed, wave, cash) is right on the first frame.
- **Leaderboard:** a run pinned below the top 100 shows the date too.

- Checks: `tools/v506check.py` (new) covers all of the above; `tools/speedcheck.py` updated for the opt-in cap.

## v5.0.5 (release, 2026-10-14): polish rounds from two survival playtests
The first feature-lock release: it gathers v5.0.3 and v5.0.4 below (not released on their own) and this second polish round. Online, run `supabase/mill-name-filter.sql` once so both boards refuse banned mill names too.

### Second polish round (from the v5.0.4 playtest)
- **Bug fixes:** Resume no longer runs the game behind the leader card or the tutorial; an outage notice now waits until an open event card is answered instead of covering its buttons; the "Chapter 11" dialog no longer opens (hidden, with focus on New game) under the results at the end of every season or survival run.
- **Leaderboard:** after Submit you see your rank ("Submitted: #127 of 412"), the board scrolls to your row and marks it, and a run outside the top 100 is pinned at the bottom. Board rows list wave, tons, upsets and date before the mill name, and wrap instead of cutting off; the subtitle says "Loading…" while a tab loads.
- **Disabled buttons look disabled:** greyed out, and the leader picker's button says "Pick a leader to start"; Submit reads "Submitted ✓" afterwards.
- **Escape** closes the report card.
- **Dot:** she only rolls on breakdowns with a repair bill of $100k or more (no dice drawn for cheaper ones), her FIXED banner replaces the breakdown's own, and what she saves shows on her card ("saving $179k") and the game-over screen. Weather and the roof leak say "repaired it and made it safer" instead of "fixed at the root".
- **Hank:** dryer tunings after the 4th cut steam by half as much (2.75%); the outage dialog shows the current amount.
- **33HT** no longer sells at a loss late in a survival run: its premium over 23m rises with the wave's cost multiplier (seasons unchanged).
- **Profit per day** is averaged over the last 3 days, and in survival the label turns into "~8d left" (days to bankruptcy at that rate) once it's under 15 days.
- **Top-bar grade** shows the last report card's grade until the new period has a day of data.
- **Desktop:** the mill name gives way, so the clock and wave/day are never cut off.
- **Tutorial:** the survival card describes Dot correctly (she makes no picks).
- **Small fixes:** wave report cards no longer overlap days (wave 2 is days 5–8); the day range never splits across lines; the leader tally says "Fixed ×5"; the Upgrades sheet opens at the top; the mill-name filter folds look-alike characters and spacing ("Sh1t", "f u c k") and allows real words like Scunthorpe.
- Balance (10 bot runs each, days survived hands-off / buyer): no leader 24.8 / 35.1, Dot 26.3 / 41.1, Hank 25.6 / 39.9 (v5.0.4: 24.5 / 34.9, 25.6 / 40.6, 25.1 / 37.3).

## v5.0.4 (test, released in v5.0.5): playtest review
- **Dot fixes on her own.** No more Fix it now button: once per outage cycle, each breakdown she can fix has a 50% chance of being fixed as it starts. It ends on the spot, 60% of its bill comes back and it's fixed at the root, as before; a banner says so, and the chip shows "Fix ready" or "Fix used". Her drawback is now repair bills **+5%** (was +15%). At 25% and +15% she tested no better than no leader; at 50% and +5% she survives 25.6 days hands-off and 40.6 days for the buyer bot (10 runs each; she was 25.9 and 38.8 with the button, no leader is 24.5 and 34.9). (Her roll has its own dice, so nothing else in a run changes.)
- **Profit per day** in the top bar is now the real cash change over the last 24 hours, repairs and outage budgets included (upgrades aside). It used to leave out repairs, so it read positive while survival waves lost money.
- **Shipping bottleneck:** the dock doors' combined rate now loads one truck at a time instead of every truck crawling in parallel. Same tons per hour and the same dock upgrade, but the first truck leaves around hour 14 instead of hour 32, and the opening cash dip is about $210k instead of $450k (shipping-bottleneck seasons finish about $155k better).
- Outage budgets start at the cheapest option when cash is below zero.
- Zen mode asks first when it would end a season or survival run (tap again within 3 s), and leaving a run for zen or free play drops its save (a reload used to bring the abandoned run back).
- An event card dealt while an outage notice is on screen waits until the notice closes, instead of hiding under it.
- The outage dialog opens at the top, so its heading and the "What's an outage?" intro show.
- Tab stays inside an open event card.
- Report card: "Premium freight" is now **Freight & insurance** (the insurance premium is booked there), and its tip mentions insurance when you have it.
- The first report card of a run starts with the run, so upgrades bought before the first minute count.
- Hank's "Dial in the dryers" now says **steam −5.5%** (it cuts steam, not chemicals), on his card, the outage dialog and the tally.
- Spot market sale card shows the real gain (the $35/t over list, about +$18k), not the whole sale, and what the risk costs against list.
- Phones: the wave chip keeps the outage countdown (short forms: W10, Up, $, ⏱ 2d 20h, Fix ✓) and nothing is cut off; the clock label is "W13 · D50" and drops the weekday under 400 px; the grade letter in the top bar is labelled.
- Shop: "next at 6 AM" now says "tomorrow 6 AM" once it's past 6 AM.
- The leaderboard name box shows a character counter (13/16).
- Leader picker: a focused card has a dashed ring, so it no longer looks picked.

## v5.0.3 (test, released in v5.0.5): fixes from the survival playtest
- A finished run can no longer be continued: after bankruptcy (or the end of a season) the save is now cleared, so a reload no longer offers "Continue survival" and the same run can't be replayed and submitted again. (The old clear sat behind a check that skipped finished runs, so it never ran.)
- **Resume** in the pause menu no longer restarts the game behind an open event card, outage budget or report card. The game stays paused until the card is answered, so an outage can't start on the default budget before you approve it.
- Mill names get the same banned-word check as player names: renaming to a banned word is refused ("That name is not allowed"), and a banned mill name from an older save is sent to the board as "Unnamed mill". Online, run `supabase/mill-name-filter.sql` once so the boards refuse it too.

## v5.0.2 (release): report card labels
- Report card, Bottlenecks: "Machine at full speed" is now **Paper machine (speed limited)** and "Machine down" is **Paper machine (machine down)**, so the two machine rows read as a pair, and the subtitle is now "% time each step limited the mill" (it was cut off on phones). (Saved report cards keep their numbers: only the shown names changed.)

## v5.0.1 (fixes)
- Season and survival end: the results dialog was taller than a phone screen and couldn't scroll, so **Submit score** sat off the bottom (and the keyboard, opened for the name field, covered the rest). The dialog now scrolls, its buttons stay pinned to the bottom of the screen, and on phones the keyboard only opens when you tap the name field.
- Game speed and planned outages, rebuilt: your chosen speed is now the only speed setting and nothing ever overwrites it. During a planned outage the game simply runs at no more than 5 min/s (so the crews can be watched), and zen runs at 1; when either ends you're straight back at your speed, with nothing to restore. Before, the outage lowered your speed setting and tried to put it back afterwards, which could fail (players went in at 120 and came out slower). The speed readout shows both during an outage ("5 min/s · 120 after"), and the speed buttons set the speed you'll come back to. Saves from earlier versions taken mid-outage get the player's speed back. New check: `tools/speedcheck.py`.

## v5.0.0 Survival (release, 2026-10-13)
The survival release: a second scored mode with mill leaders, painted portraits, and a round of fixes and polish. It
gathers the three test builds below (v4.3.0-t1, v4.4.0-t1 to t3).
- **Survival mode**: outlast the waves. An outage every 4 days starts a rougher, dearer wave; the score is the time
  survived (days, hours, minutes), on its own leaderboard.
- **Mill leaders**: Chip, Dot, Felicity and Hank, each taking on one survival pressure, with painted portraits.
- **Seasons**: no more day-15 rough patch. Grades from day 4, profit per day as a 24-hour average, a six-card tutorial,
  one word for upsets, a cleaner menu and top bar.
- Online survival board: run `supabase/survival.sql` on a new project, or `supabase/survival-4day-waves.sql` on a table made
  by an earlier version. Until then scores stay on the device.
- Open: with the rough patch gone, a hands-off season finishes about +$240k (10 seeds) against the break-even target;
  a price or outage-budget trim would bring it back. Sim checksum changed (the rough patch was part of the sim).

## v4.4.0-t3 (test, not released): fixes
- Seasons: the day-15 rough patch is gone. Days 1 to 3 stay quiet and the first week 25% calmer; after that, upsets run at the normal rate to the end.
- Main menu: Season and Survival are two equal choices; neither is highlighted. (Continue and Resume stay the main button when they are there.) "Play" is now "Season".
- The two managers on their rounds walk side by side in step. The second one used to chase its spot, flicking between walking and standing and sliding along.
- Top bar: cash and profit keep their full width; the clock column gives way. On phones the survival label is short ("W3 · Day 16").
- Grades wait for day 4: the top-bar badge, the Report tab's grades and the day-by-day chart start once three days have run (start-up is too noisy to judge). Cost per ton waits for the end of day 1.
- Profit per day is the average over the last 24 game hours (it was the last 12, and jumpy early on). It shows "–" until the first day is done.
- Survival: a planned outage, and so a new wave, every 4 days (was 7). The per-wave steps are unchanged (+20% upsets, +10% costs), so runs are shorter: about 25 days hands-off and 35–46 with upgrades (6 seeds, forest valley).
- Survival leaderboard: the table's wave check assumed 7-day waves. `supabase/survival-4day-waves.sql` swaps it (run once); until then the game keeps the score on the device and says the board needs an update.
- Tutorial: six cards (welcome and goal, fibre in, paper out, bottleneck, upsets, outages), numbered "1 of 6". Survival gets its own goal and outage cards (waves, leader).
- One word for upsets: "disasters" and "incidents" are gone from the game's text (breakdowns, sheet breaks and hayouts keep their names as kinds of upset).
- Settings: "Balance all" is hidden; the areas stay on automatic.
- **Mill leaders redesigned** for 4-day waves: each takes on one survival pressure, with a cost you can see. Chip: a fibre lock (next wave's fibre at this wave's price) or a sales push (+$7/t); wages +5% per deal, call-offs and brawls 2×. Dot: repairs 10% quicker; Fix it now returns 60% of the bill and fixes the breakdown at the root (50% rarer, stacking); repair bills +15%. Felicity: a debottlenecking project, +6.5% capacity for the fibre line, the paper machine or finishing; every outage overruns 20 min per project. Hank: runnability (breaks and hayouts −15%, back up 20% faster) or dial in the dryers (energy −5.5%); fibre +2% while he's in charge. Saver bot, 10 seeds: +3.6 to +6.3 days each (was −0.3 to +10.8).
- `build.py` now syntax-checks the game script with Node.js when it's installed (a stray mid-line `//` comment broke the page twice in this version).
- Wave bar: an arrow at its right end slides it away to the left, leaving only the leader's face; tap the face to bring it back. The choice is remembered on the device. While folded, the face gets a red ring when Dot's fix is waiting.
- Survival leaderboard: no leader names. Scores carry no leader, the board doesn't show one, and `supabase/survival.sql` is back to the v4.3 table. The leader still shows on the game-over dialog.
- Fixed: the Rename box on the menu wasn't hidden again when the menu reopened (v4.3 regression).

## v4.4.0-t2 (test, not released): painted leader portraits
- The four mill leaders have new portraits: realistic, gritty, hand-inked paintings in place of the flat cartoon drawings. Same people, same props (Chip's phone and hard hat, Dot's wrench, Felicity's clipboard, Hank's thermos and ear muffs).
- The portraits are embedded images (WebP, about 33 KB each), so the game is still one file; it is about 180 KB larger. Mill kit keeps a fixed green and no longer follows the mill's colour.
- Code: `09c-leader-art.js` holds the images and the face squares for the round avatars; `leadArt()` replaces `leadSvg()`. No change to the sim: the books, the leader numbers and saves are untouched.

## v4.4.0-t1 (test, not released): survival mode gets mill leaders
- New in survival: a **mill leader**, picked after the site and before the run starts (the picker opens when you choose Survival). Each one is strong on one side of the mill and costs you on another. Their card has a portrait, name, title, what they do and what they cost.
- **Chip Kraftwell**, the dealmaker (business man). At every outage he signs one deal that stays with the mill: a fibre contract (fibre −1.5%) or a sales push (+$5/t on every grade). Labour relations pay for it: every deal ends in a pay settlement (wages +5% for good), and call-offs and dock brawls come twice as often while he's in charge.
- **Dot "Doc" Blade**, the millwright (mechanic). Fix it now: once per outage cycle she ends one breakdown on the spot, gets its repair bill back, and that breakdown never returns. She gold-plates every job: repair bills cost 10% more while she's in charge.
- **Felicity Fourdrinier**, the process engineer. At every outage she builds one project that stays: stock prep (fibre −1.5%), wet end (sheet breaks −8%) or dry end (energy −2.5%); each also cuts that area's breakdowns 8%. Every project adds $40/h of project staff to the payroll for good.
- **Hank Headbox**, the machine tender (operator). At every outage one gain that stays: push for tons (+70 fpm top speed) or run it clean (sheet breaks and hayouts −15%). He runs it hot and heavy: energy +4% and fibre +1% while he's in charge.
- The leader's pick is a row in the outage budget dialog (the last pick is offered again); it takes effect when the outage ends. Dot makes no pick: her fix recharges.
- **One change of leader per run**, made in an outage budget dialog. The new leader takes over as that outage starts, with no waiting period, and makes that outage's pick. Everything the old leader built stays with the mill, with the cost that came with it (Chip's pay settlements, Felicity's project staff, Dot's fixed-for-good list). Their while-in-charge drawback leaves with them.
- The wave chip shows the leader's face; tap it for the leader card: who they are, what the mill has kept so far, and Dot's fix list (the chip turns red with "Fix it now" when a breakdown is waiting for her). The Reliability view shows the leader's share. The game-over dialog, the saved score and the Survival leaderboard name the leader in charge at the end.
- Balance (tools/survival.py, 10 fixed seeds each, forest valley; days survived against the same runs with no leader). A mill that buys its upgrades and banks cash: 84 days with no leader; Chip +3, Dot +2, Felicity +4, Hank +5. A hands-off mill: 38 days with no leader; Chip +1, Dot +8, Felicity +2, Hank −1. Dot is the forgiving pick for a mill with no upgrades (big uninsured bills come back); Hank needs a mill that can use the speed.
- What the simulations changed from the first plan: reliability-only boosts turned out to be worth almost nothing late in a run (upsets crowd each other out), and extra tons are worth little once costs pass the sales price. So Felicity's projects also save fibre or energy, Dot's fix returns the bill and is permanent, Hank's numbers are larger with a flat drawback, and Chip's labour trouble became pay settlements that grow with his deals.
- Code: `03d-leaders.js` (numbers and effects) and `09c-leaders.js` (portraits, picker, card, outage row, change, fix). Without a leader every factor is exactly 1: four hands-off seasons still match v4.2.5 to the dollar, and a survival run without a leader matches v4.3.
- Menu: Survival now opens the picker at once; its Start button waits for the start-up precompile if needed. An old save (and its Continue button) is dropped when the run really starts, not when the picker opens.
- tools/survival.py: `--leader=`, `--swap=<leader>@<wave>`, per-leader play policies and `--set=` to try other leader numbers. tools/survcheck.py also covers the picker, the outage pick, the change of leader, Fix it now, and the leader in the score.

## v4.3.0-t1 (test, not released): survival mode
- New mode on the main menu: **Survival**. A survival run is a season with no last day: the same $2.0M start, site, bottleneck, weekly dice, AUTO locks, upgrades, event cards and planned outages. It ends at bankruptcy (−$1.5M), and the score is the time survived, shown as days, hours and minutes.
- Waves: a wave is the stretch between two planned outages (every 7 days, as in a season). When an outage ends the next wave starts, with upsets 20% more likely and fibre, energy and chemicals, and wages 10% dearer than the wave before (the steps compound, so the first waves change little: wave 2 is ×1.20 / ×1.10, wave 6 ×2.49 / ×1.61, wave 12 ×7.43 / ×2.85). The day-15 rough patch is not used.
- The multipliers are always on show: a chip under the top bar (wave, upsets ×, costs ×, time to the next outage), the clock label ("Wave 3 · Day 16"), the outage budget dialog (what the next wave brings), a banner and a log line at each wave, the Report tab and the game-over dialog.
- Outages repeat: after the fourth, the major jobs go round again (press roll, forming fabric, pulper rotor, refiner plates), with their staging and 3D crews. The budget dialog and the reliability rules are unchanged.
- Report cards are per wave in survival: the card pops when the wave's outage ends and says what the next wave brings. The Report tab shows the time survived, the multipliers, the last two waves and the current one, and the last 30 days of grades.
- Event cards: in survival the deck is dealt again once every card has been seen.
- Game over: the season-over dialog with survival figures (time survived, wave reached, your best on this device, final multipliers, tons, disasters). "One more turn" becomes "Menu", and Escape leaves the dialog up so an unsent score isn't lost.
- Leaderboard: two tabs, Season and Survival. Survival is a new board ranked by time survived (new table `survival`, see `supabase/survival.sql`; it has to be run once in Supabase). Until the table exists, survival scores are kept on the device and the tab lists those.
- Save and Continue: the one save slot holds a season or a survival run; the menu button reads "Continue survival · wave N · day D".
- Menu: Survival sits under Play on the first menu; once a run is on, "New survival" is next to "New season". The tutorial's goal page explains survival when it opens on a survival run.
- Code: the mode is in `03c-survival.js` (constants, multipliers) and `09b-survival.js` (wave changes, chip, game over); the hooks elsewhere multiply by exactly 1 outside survival. Checked: four full hands-off seasons play out to the same dollar as v4.2.5, and determinism.py passes.
- Balance (tools/survival.py, 5 fixed seeds each, forest valley): a hands-off mill lasts about 39 days (wave 6); a mill that buys every upgrade about 80 days (wave 12); one that skips the dear capacity upgrades and banks the cash about 89 days (wave 13).
- tools/survival.py: whole survival runs played to bankruptcy by a hands-off, an upgrade-buying or a cash-banking player, with per-wave profit, incidents and downtime; `--up`, `--cost` and `--compound` try other settings. tools/survcheck.py: drives a survival run from the menu to the leaderboard (waves, multipliers, save and continue, the fifth outage in 3D, bankruptcy, score, both boards, free play and a season afterwards).

## v4.2.5 (release): batch of minor improvements
- Seasons: the bottleneck is now random for every season instead of being shared by the whole week. The week's upsets, cards and weather are unchanged. tools/determinism.py pins the bottleneck so its two runs still compare.
- Accessibility: no text smaller than 12px (64 sizes raised), and descriptive body text at least 13px (11 rules). `--ok` and `--warn` darkened to #1a7b47 and #975f00, which pass 4.5:1 on white and on the grey backgrounds.
- Accessibility: Tab and Shift+Tab stay inside the menu, the tutorial and the season-over dialog, and Escape closes them (menu: Resume, tutorial: Skip, season over: One more turn). Escape does nothing on the menu before the first Play.
- Leaderboard: it takes keyboard focus when it opens and gives it back when it closes, and Escape closes it even while the name field has focus.
- Settings layout: three labelled groups (Run the mill, View, Performance) with even spacing. The machine name has a visible label and a styled field; Shadows and Show FPS sit with Whole mill; Frame rate and Graphics each get a label above a full-width choice (Graphics no longer runs off the edge on phones); controls are 40px tall; Area controls are set apart by a divider.
- Graphics: the Auto choice reads "Auto" with the device's tier underneath, so the row stays one line high.
- Season over: a mill name ending in a full stop ("… Co.") no longer gets a second one. Renaming the mill no longer leaves a trailing space when a long name is cut to 32 characters.
- Tidy-ups: removed an unused bale texture, a throwaway canvas gradient and a duplicate steel material (20-3d-setup.js). The frame loop reuses its quaternion, truck role object, roll positions and cloth mesh list, and no longer joins the dryer-can arrays every frame. Batching and prewarm failures are written to Diagnostics instead of being swallowed (first 5, then a count).
- tools/savecheck.py: clicks Continue and pauses in one step (waiting for the game to start first let a frame of sim slip in, a flaky DIFFER).

## v4.2.4 (release): quick fixes
- No more $25M goal: the aim is simply to make as much money as you can. The Cash box now shows how much you've made (or lost) since the start instead of "% of the $25M goal", and the "Mill of the Year" win screen is gone. Bankruptcy still ends a free game.
- Shadows switch: turning shadows off or on no longer recompiles every shader (a long freeze on phones). It fades the sun's shadow out and stops refreshing the shadow map.
- Fire: the floor glow's texture is made at start-up and compiled with everything else, so the first fire no longer stalls the frame.
- Continue season: a broken or incomplete save is cleared instead of breaking the button for up to 14 days; if a save fails to load, the page says so and reloads to a clean menu.
- The mill name is escaped on the report card (it was inserted as HTML). One shared escape helper (`escHTML`, 01-brand.js).

## v4.2.3 (release)
Everything since v4.2.2:
- Laptop battery: the 3D view now asks the browser for its default GPU instead of the high-performance one, so dual-GPU laptops stay on the integrated graphics and use much less battery. Pinning Ultra graphics (then reloading) still asks for the high-performance GPU. Phones are unaffected. Diagnostics shows the GPU preference.

## v4.2.2 (release)
Everything since v4.2.1:
- Rare sights: all four reworked (detail, 11.5 s, a wide held shot of the mill with the event small in frame); zen plays each map's sight once and moves on after it (fix: the zen shot was left at 999 s).
- Fix: a walker crash (the side-detour and the path planner shared one field) that stopped part of every 3D frame (people frozen or missing, sights that never ended); people and scene updates are now fenced off.
- Marquee site upsets (visuals only): bayou flood, desert dust storm, city brownout, forest iced intake.
- Bird on the power lines: a new upset (same outage as lightning, its own dice stream) with a cut-scene: game paused, high follow, dive, wide shot, strike; operatic score, chirps, bang; camera and speed restored.
- Mill report (Report tab): live period grades, season strip and day-by-day history, cost per ton split, uptime, quality and fibre, money; grade badge and cost/uptime in the top bar; one grade system.
- Free play: set off any upset by hand from the Upsets panel (locked in a season).
- Labels on for the first 5 s of a season or free play, then off with the Labels button flashing twice.
- Compact site picker; the site plan preview removed.

## v4.2.3-t (test v28): the other three rare sights, reworked like the gator
- All four sights now share the gator's rules: 11.5 s, a held wide shot of the mill (60-64 m, low elevation, telephoto) with the action small in the lower third, more detail, and a scene that is a pure function of its clock (stills via G3.sightSeek/G3.sightHold). Shared builders: person (knees, boots, hands, hats), puff pool.
- Desert: three cowboys canter across the flats south of the mill, in front of the roll warehouse and crane. Horses with neck, head, ears, muzzle, mane, tail, saddle and blanket, jointed legs and hooves, cantering gait; riders with cowboy hats, bandanas, a vest, legs in the stirrups; the last one swings a lasso. Dust trails.
- Valley: Bigfoot wades the river below the mill, away from the camera on the far bank, waist-deep, rings spreading from his legs; mid-river he turns head and shoulders to look back down the lens without breaking stride. Two-tone fur, crest, brow, face, long jointed arms, big feet.
- City: a harbour tug steams past the waterfront towing a barge of bales: black hull, red boot-top, deck and rails, tyre fenders, bow pudding, deckhouse and wheelhouse, mast and radar, buff stack with a red band and smoke, a deckhand, a tow line, bow wave and wake.
- tools/sightshots.py turns off the low-FPS fallback (it was hiding far scenery in headless stills).

## v4.2.2-t5 (test v27): one sight per map in zen
- Zen plays the map's rare sight once; after it, no more sights on that map. The zen map rotation reloads the page on each map, so each map plays its sight once per visit. Outside zen the 4-10 minute random timing is unchanged.
- tools/zenonce.py: forces the sight's wait to zero repeatedly in zen and counts starts (v26: 2, v27: 1).

## v4.2.2-t4 (test v26): the gator cut, short and wide
- Scene cut from 31 s to 11.5 s: it opens with the operator already at the edge and the gator close, plays the bite at full speed, and hurries the aftermath (a time map from the scene clock onto the choreography).
- Camera pulled out to 60 m and held still on the mill (orbit 2.25, elevation 1.36, look-at 7 m up): a mill shot in which the bite happens small in the lower third.
- The pirogue now poles up the near side of the canal past the scene.

## v4.2.2-t3 (test v25): gator riff removed, wide incidental framing
- The bass riff is gone (synth code removed).
- The gator scene's camera is now a wide, low shot from across the canal (30 m, orbit 2.25, elevation 1.42): the action sits in the lower third with the mill (clarifier, pipe racks, buildings) filling the background, as if caught in frame by chance. It follows the operator along the bank. The zen camera keeps this angle (a slow ±0.1 rad sway) when a sight supplies one.
- tools/sightshots.py: "t:f" uses the scene's own framing; waits for rendered frames.

## v4.2.2-t2 (test v24): the gator riff
- A palm-muted electric bass riff (E E B G E E B A G, even eighths at 140 bpm, low E string) plays as the bayou gator scene opens and again as it closes (scene t 28.9 s, finishing with the scene). Plays in zen too; the music ducks under it. Silent when sound is off.
- AUDIO.riff() / AUDIO.riffRender() (offline render); tools/riffrender.py writes it to WAV.

## v4.2.2-t (test v23): the bayou gator, reworked (an Amos Moses nod)
- Gator rebuilt at a believable size (~4.7 m): belly, flanks, two rows of back scutes, five-segment swaying tail with a crest, splayed legs with toes, eye bumps with slit pupils, nostrils, hinged upper and lower jaws with teeth.
- Operator rebuilt with knees, boots, coveralls, hi-vis vest with reflective bands, radio, moustache, hard hat with brim, hands, and a sample bottle.
- New 31 s scene: walk the bank, kneel to take a sample, gator glides in (eyes and scutes at the surface, wake rings), lunges, snaps off the right hand only (no gore), death-rolls and sinks; operator sits down hard, stares at the stump, runs off along the bank waving it; the bottle floats away; the gator resurfaces and burps; a one-armed Cajun poles a pirogue past.
- Scene is a pure function of its clock: G3.sightSeek / G3.sightHold for stills. New tool: tools/sightshots.py.
- Still visual only: random timing, no cost, production or log effect.

## v4.2.1 (release, from test v22)
Release on main. Adds save/continue (v4.2.0-s), the Settings panel and the outage speed fix.

### test v22 notes
- Bottom bar: Stats and Controls swapped; Controls renamed **Settings** and now sits far right.
- Settings: "Area controls" folds away (collapsed by default). In a season every area control runs on AUTO and is locked (Balance all too); paper colour stays free (look only). Free play keeps full control.
- Fix: after a planned outage the game speed goes back to the speed the player picked. Before, touching the speed during an outage (or a new season / zen started during one) left it stuck at the outage speed. The chosen speed is now kept as `C.spdPref` (saved with the season).
- Includes the v4.2.0-s save/continue test. New check: tools/settingscheck.py.

## v4.2.0-s (save test, local only: `test/v21`, not published)

- The season is kept on the device, no account: saved to the browser's storage when the page is hidden or closed, every
  60 s of play, and after a purchase, a card or a new game day (one slot, versioned, ~24 KB, <1 ms per save). The menu
  offers "Continue season · day N · cash · map" when a save from the last 14 days exists (a save from another map
  reloads on it first); Play (a new season), New season and Reset clear it, and so does the end of a season. A page
  that comes back without a reload is paused behind "Welcome back". Seasons only (not free play or zen); off in the
  autotest and with ?nosave.
- Pending event-card outcomes are data now (handler key + values, PENDH in 05-event-cards.js) instead of closures, and the
  railcar's finish is a key, so everything in a season can be saved. An open card comes back up on Continue; an open
  outage plan is asked again.
- tools/savecheck.py: save at day 4 with six pending card outcomes, continue to day 6, and the cash, incidents, breaks
  and rolls match an uninterrupted run exactly; the hidden page saves and pauses; corrupt or old saves are ignored.

## v4.2.0 (released 2026-10-11 from test `test/v20`)

Everything in the v4.1.0 work below, through pass 18 (test v20): four redesigned site maps (the city now on the sea),
working yards, activity scenes and rare sights, the whole-site view, zen map rotation, the iPhone batching fix and
performance round, the economics fixes (repair deadlock, sim-time repairs, grade-true pricing), new upgrade prices with
one upgrade a day, galvanised roofs and surface wear.

## v4.1.0 (test builds `test/v11_env` and, with the music, `test/v12`, 2026-10-10)

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

### The look (pass 3)
- **Ground**: the flat slab is gone. A height-field mesh carries each environment's ground colour with large patches of a
  second and third tone (dry grass and bare earth in the valley, sand tones on the flats, moss and peat in the bayou,
  paving greys in the city) and, on High and Ultra, a tiled texture (speckle, wind strokes on the sand, leaf litter).
- **Relief**: gentle hills outside the fence in the valley (up to 11 m) and on the flats (5 m), a hint of it in the city,
  none in the bayou. The yard, the roads, the rail line, the river banks and every feature sit on flat pads blended into
  the slope; trees stand on the slope. The camera floor and the keep-out grid follow the terrain.
- **Sky**: a gradient dome from horizon to zenith with a glow around the sun, orange at dawn and dusk, deep blue at night,
  tan in a dust storm; drifting clouds (none on Low, 4 on Medium, 10 on High, 14 on Ultra); mist banks over the bayou
  ponds and along the valley river at dawn (and in fog).
- **The city at night**: windows light up across the blocks (one merged mesh, faded in with dusk, dimmed by a brownout).
- **The mill's own landmark**: a branded water tower in the yard (legs, bracing, ladder, catwalk, the mill's name round
  the tank, a red beacon at night), and a **gate sign** with the mill's name outside the fence. Both redraw on a rename.
- **Yard clutter that says paper mill**: OCC bale stacks by the rail spur, pallet stacks and a pile of empty roll cores
  south of the warehouse, dumpsters, an OCC compactor and a recycling cage by the office, a forklift charging bay off the
  receiving apron, two flagpoles (the flags wave on High and Ultra).
- **People with jobs**: hard hats with brims in role colours (yellow operators, blue maintenance, white managers, green
  visitors), hi-vis vests with a reflective band on crews, techs, bale-yard hands and tour leads, a radio on the belt of
  anyone who'd carry one. Forklifts and clamp trucks have a driver (seat, vest, hat) and an amber beacon.
- **The mobile crane** has its detail back: cab glazing with frames, mirrors, a beacon, an exhaust stack, hazard stripes
  on the bumpers, counterweight and outrigger pads, handrails, a sheave head and a boom hoist ram.
- **City streets**: asphalt with a dashed centre line and sidewalks on a grid between the blocks, street trees, and
  downtown façades in brick, concrete, glass and stone (plinths, window bands, mullions on glass towers, rooftop plant
  and tanks); low-rise blocks keep houses, warehouses with sign bands and roller doors, and parking lots.
- **Water sparkle** on the river and ponds on High and Ultra (a slow-moving additive layer; none on phones).
- **Mobile budget**: phones get a coarser rounded box (140 triangles on Medium, 92 on Low, 316 on High and Ultra: a third
  off the mill's static and moving geometry at phone size), one far scenery mesh instead of five, no mullions, rooftop
  tanks or far street dashes, plain boxes for the bales, and the sky and clouds are skipped when the camera looks down at
  the mill. The water tower's tank band and the gate sign share one texture atlas (one draw).

### Music (pass 4, test v12)
Every site has its own calm pieces and its own upset piece, all generative (chords, rhythm templates and short motifs
with the rest left to dice), so no two plays are alike. The lofi "Break Room" tune still plays everywhere as every fourth
piece; the three sandbox-style piano pieces are the valley's.
- **Forest valley**: *Wet End Morning*, *Felt Moss*, *Night Shift Stars* and a new, airier *Canopy Light* (celesta
  arpeggios over major sevenths). Upset: **Strings**, urgent plucked octaves, piano stabs, timpani, a rising line.
- **City mill** (Blade Runner): *Neon Rain* (wide detuned pads, a brass lead that slides into its notes, wisps of filtered
  noise, a heartbeat kick), *Rooftop Static* (a sequencer pulse under two-bar chords, bells with echo), *Tears in the
  Mist* (the slowest, darkest, in A minor). Upset: **Pulse**, a bass sequence under a cluster pad, risers, claps.
- **Desert flats** (sparse western): *Dry Wash* (a low drone, a twanging guitar that takes its time, tremolo on the long
  notes, a rattle now and then), *High Noon Haze* (open-fifth strums, a whistled line, a shaker), *Mesa Wind* (wind, high
  harmonics, the odd strum). Upset: **Gallop**, toms in a gallop, tremolo guitar chords, a whip crack, a rattle.
- **Bayou** (folksy): *Cypress Roll* (banjo forward rolls over chords that wander from one to the next, a thumb bass, a tune
  that meanders up and down the pentatonic), *Slow Water* (harmonica, sparse banjo, a frog, a woodblock), *Porch Swing*
  (a swing feel, a fiddle drone, washboard). Upset: **Stomp**, a stomp and clap, fast rolls, a walking bass, a harmonica
  shriek at the turn.
- The upset music had one pattern; it now has five pieces with two chord sets each, fills every fourth bar and a build
  over the first bars. The site's own piece plays about three times in four, the old **Drive** otherwise.
- New instruments, all synthesised in Web Audio as before: analogue-style pads, a portamento lead, plucked strings
  (banjo and guitar), whistle, harmonica, a bowed drone, a tape echo on every platform (the hall reverb stays
  desktop-only). The new pieces run through a brighter bus (6.5 kHz) than the 3.2 kHz lofi/piano bus.
- Listening aids: `?song=<part of a name>` starts a given piece, `?upset=strings|pulse|gallop|stomp|drive` fixes the upset
  piece; the sound button's tooltip names what is playing. `tools/musictest.py` schedules every step of every piece and
  checks the output level; `tools/musicrec.py` records any piece to MP3.

### Roofs, surface wear, trash cans (pass 18, test v20)
- Roofs: the sawtooth roofs (receiving, warehouse, machine hall) are galvanised steel sheet with standing seams, a faded,
  dirt-streaked surface, rust runs from the fixings and the odd replaced panel, instead of the brand colour; the small
  buildings (gatehouse, scale house, intake, power house, office, yard booth, fog fan house) have grey membrane flat roofs
  with ponding stains and patched seams. The fascia, door frames and the water tower keep the site's trim colour. The
  valley's OCC store shed roof is galvanised too.
- Surface wear: concrete gains a coarser layer (polished traffic lanes, tyre scuffs, big stains); asphalt gets its own
  32 m wear tile (tyre tracks, oil drips, a patched trench, cracks, sun-faded patches).
- Trash cans: the contents were wider than the tapered can's base and showed through as a pale band round the bottom of
  every can; they now sit inside it.

### Upgrade prices and one upgrade a day (pass 17, test v19)
- New prices (L1 / L2 / L3): Drive rebuild $120k / $105k / $95k; Wider trim $125k / $105k; Shoe press $140k; Fabric & felt
  monitoring $170k / $115k; Refiner $110k; Fire suppression $90k; Screens & cleaners $60k / $60k; Detrashing $30k;
  Automatic bale feed $30k; Safety program $10k; RCFA $155k / $75k; Reliability program $195k / $125k; Spare parts
  storeroom $35k; Advanced process control $80k / $80k; OCC contract $120k / $120k; Sales team $120k / $120k. Other
  upgrades unchanged. The bottleneck discount (25% off) still applies on top.
- One upgrade a day: after a purchase the shop's buttons read "next at 6 AM" until the day turns over at 6 am; the
  wallet line says "1 upgrade a day". Free play is exempt.

### Zen mode (pass 16, test v18)
- Map rotation: once every everyday scripted shot of the map has played (or after 15 minutes, with most of them played),
  zen fades out and moves on to the next map (valley -> city -> desert -> bayou -> valley): the page reloads on it with
  ?zen=1 and goes straight back into zen (the flag is then dropped from the address). ?zenstay keeps one map.
- Scripted shots now come up 55% of the time (was 40%), so a map's shot list is worked through sooner.
- Shot review, map by map: every shot runs start to finish without errors on all four maps (tools/zencheck.py). New
  landscape-and-mill shots that start on a place and pull back to the mill, or look across from a place to the mill:
  valley - timber yard, bale store, farm, lake, rapids to the mill; city - pier, container port, lighthouse, rail yard,
  water tower; desert - solar field, stock pond, ranch, water works, mesa to the mill; bayou - barge dock, boardwalk,
  radio mast island, bale route, dry pad edge. "Bayou mist" (mist removed) is now "bayou channels". The landmark
  half-orbit runs 15 s (was 13).
- Rare sights in zen: one every minute or two, and the zen camera cuts to it and follows it, slowly circling, until it
  is over.

### Rare sights (pass 15, test v17)
- Now and then (every 4-10 minutes of play, at random) something odd happens on the site for about half a minute:
  cowboys ride across the desert flats in a little dust, Bigfoot steps out of the valley woods by the gate and stops to
  stare at the mill, a tugboat steams in across the city bay along the waterfront and back out, and on the bayou bank a
  gator takes an operator under (splash, a hard hat bobbing, the gator slides off).
- Purely visual: random timing outside the sim, no costs, no production effect, nothing logged; built once at start-up
  and hidden, so nothing compiles when one happens (late shader compiles: 0). `?sight=1` shows one a few seconds in, then
  every 40 s.

### Economics fixes (pass 14, test v16)
- Repair deadlock: maintenance pairs now go first to the job the PM crew is on, then to jobs that need no crew, and last
  to jobs still waiting for the crew; a pair working on a crew job gives it up if the crew is called away. Before, a
  winder breakdown could hold the only pair while the crew was at a felt or fabric change that also needed it, and
  production stopped for good (reproduced on v15: winder down + felt change never cleared; on v16 both clear in 338 min).
- Repair timing on sim time only: crew and maintenance start work when their travel time (sim minutes) runs out. The
  wall-clock timeouts and the wait for the 3D crew to arrive are gone, so game speed, frame rate and the 3D view no longer
  change downtime (the 3D crew still walks over; it is just not waited for). A crew pulled off a winder job walks back.
- Grade-true pricing: paper carries its grade from the reel through the winder, the conveyor and the warehouse to the
  truck (first-in first-out lots); each truck is paid roll by roll at its own grade's price, and the spot-buyer card sells
  the warehouse's oldest rolls at their grades. Losses (hayouts, scrapped or blown-away rolls) come off the same lots.
- Checks: tools/econfix.py (deadlock, 3D on/off, grade). Autotest checksum unchanged (81890238); 5-season economy mean
  +$295k (v15 +$344k, same seeds).

### Performance round (pass 13, test v15), from the v14 graphics performance review
- Moving batches: the matrix cache is Float64 (a Float32 copy never compared equal to the world matrix, so still things
  were rewritten every frame and their batch's matrix texture re-uploaded, and the every-4th-frame idle check never
  applied). Measured in a phone-emulated run: 453 -> 331 setMatrixAt calls per frame. The perf test now reports batch
  matrix writes per frame.
- iOS: colour-keyed moving batches instead of drawing moving things one by one. The batch material carries the colour,
  exactly like the static batches (which draw correctly on the iPhone); no per-object colour method is used; a colour
  change moves the object to another batch. Simulated iPhone stress: 1245 -> 510 draws, 0 late shader compiles.
  `?dbios=off` restores one-by-one. Needs a check on a real iPhone.
- Diagnostics report WEBGL_multi_draw support (without it three.js draws each batched object separately) and antialias.
- Graphics defaults: each tier has a rendered-pixel budget (Low 0.9, Medium 1.6, High 2.4, Ultra 4.2 MP) that lowers
  the pixel ratio; Auto never picks Ultra and gives desktops without a known discrete GPU a 1.9 MP budget and 1024
  shadows; High refreshes shadows at 24 Hz; no MSAA on screens with a pixel ratio of 1.5 or more.
- Frame rate: Battery saver 30 / Smooth 60 (new default; 120 Hz screens no longer draw twice the frames) / Max.
- Quality fallback measures real frame intervals (not the clamped sim step) against the frame budget in use and steps
  down after two slow 3-second windows (80% / 72% / 62% of target). Changing the graphics tier restores far scenery and
  offers "Reload to apply all" for what needs a rebuild.
- Scenery: outside the mill's ring the land is cut into ~210 m chunks (up to 12 meshes) so off-screen chunks are culled;
  only Low folds them into one. Phone-emulated rural: 269k -> 210k triangles, shadow draws 95 -> 84.
- Particles: batches over 96 particles are depth-sorted with 48 buckets (linear time) instead of insertion sort.
- Perf test fixes: no draw/triangle counts for the render-skipped phase (they were the last real frame's), the particle
  phase is named for what it does (drawing off, still updated), the button says ~40 s.

### Design round 2 (pass 12, test v14)
- Forest valley: the timber yard is now the neighbouring Valley Timber Co. (own fence, sign, log decks, chip pile, loader
  shed) beside the mill's covered OCC bale store (open-sided shed, bale stacks, a truck unloading); a concrete service
  court joins them to the fence, an asphalt lane runs out to the east road and the highway. Rapids differ run to run,
  gravel bars taper and vary, willow/alder/reed patches along the banks, ragged clearings with a fringe of young trees,
  a wider spread of tree sizes.
- City mill: industrial blocks (warehouses with truck yards, depots, scrap and bale yards) round the mill, mid-rise
  further out, houses beyond; the port is fenced from the boulevard with one gated freight entrance, a hedge and trees;
  public beach stairs and a hedge between the promenade and the rail yard; town water arrives by a blue main into a tank
  by the fence, the outfall is buoyed out to its diffuser; the rail yard's sidings fan off ladder tracks with buffer
  stops at the far end.
- Desert flats: washes in muted sediment with a darker channel, widening downstream, tapering tributaries, box culverts
  at the roads and headwalls at the canal; mesas built as asymmetric lobe chains with spurs, broken ledges, talus and
  boulders; pipes on saddles join the tanks, reservoirs and the mill, with a containment berm and service track; the
  solar field has a maintenance track, inverter skids and a fenced transformer feeding the line; the palm oasis is now a
  stock pond with a windmill, trough and cattle.
- Bayou: the mill stands on a raised dry pad 1.4 m above the wetland, roads on causeways, a riprap edge and drainage
  swales culverted under the roads, a lined process-water basin; sloughs flare at their mouths and taper to their
  heads, with branches and reed clumps; open reed beds with mud flats and shallow pools; a marked bale route from the
  barge dock round the fence to receiving, bales waiting on the apron and a bundle on the crane hook.
- Activity: a wheel loader carrying logs to a log truck (valley), a shunter with two wagons and a straddle carrier with
  a container (city), the solar crew's pickup with a dust trail (desert), a forklift taking bales from the dock to
  receiving (bayou). 42c-3d-activity.js; visual only.
- Site view: "Whole site" in Go to flies out over the whole map; zoom reaches 760 m and panning widens when zoomed out.
  Zoomed out, only the area labels and the landmark names show; closer in, the equipment labels return.
- Fix: the bottleneck tag on the section labels (lost when the numbers came off).

### City by the sea (pass 11, test v13 updated)
- City mill only: the far side of the river is now the open sea, out to the horizon (`RIVERS.urban` kind "sea"; the
  sea bed drops under the water so it never flickers). No bridges; the highway and east avenue end at a seafront
  boulevard either side of the mill.
- West: a beach below the sea wall with a wavy waterline and shallows, boardwalk, palms, umbrellas, two lifeguard
  towers and a pier with a pavilion; sailboats offshore. East: a container port on reclaimed land with three gantry
  cranes, container stacks, a warehouse and a container ship alongside with two tugs; a curved breakwater with a red and
  white lighthouse at its head. Three ships at anchor in the bay. Seafront blocks favour apartments and hotels.
- Zen shots renamed and moved for the city: "seafront boulevard" and "seafront run". Sea is a static colour.

### Map redesign after the v13 site maps (pass 10, test v13)
- Each site's water now follows its map: a winding valley river with rapids and gravel bars that touches the mill at the
  intake and swings north elsewhere, a broad walled city river, a narrow concrete desert canal, a straight bayou canal
  (`RIVERS` / `riverAt` in 03b; the plant, scenery, terrain, dawn mist, zen shots and site picker all use it).
- Landmarks in fixed spots from the maps: valley log and chip yard, farm and fields, orchard, lake, substation, radio
  mast in a deep-wood clearing; city street grid on 45 m blocks with houses, apartments, shops and parks, rail yard,
  water tower, recycling yard, substation, mast; desert mesas, dry washes, dirt tracks, solar farm, water tanks and
  reservoirs, windpump, oasis, ranch, tank-car siding; bayou sloughs and lagoons, barge dock, moored barge, shacks,
  mast island with boardwalk, substation and line, dirt loop. Denser forest in the valley and the bayou.
- The mill is unchanged except its trim and water tower colour, now per site (green, red, rose, blue); "New colors"
  rolls within the site's family. City terrain is flat.
- Performance was not a goal of this pass (scenery triangles on Medium: valley ~105k, bayou ~149k).

### iPhone colours, iOS fallback (pass 9, test v12 updated)
- The pass 8 self-test passed on the iPhone (both methods "ok") but the scene was still grey, so the probe cannot catch it.
  On iPhone and iPad, moving things (people, forklifts, trucks, equipment) are now drawn one by one, the same as
  `?nodb`, which showed correct colours there. Diagnostics reads "-> iOS: moving things drawn one by one".
  `?dbcol=0` / `?dbcol=1` still force the batches on for testing. Desktop and Android are unchanged.

### iPhone colours, self-test (pass 8, test v12 updated)
- Pass 7's vertex colours did not fix the grey on the iPhone either, and no engine available here reproduces it. The game
  now tests itself at start-up: two cubes (red, green) are drawn off-screen as one batch with each colour method and the
  pixels read back; the first method that comes out right is used, and if neither does, moving things are drawn one by
  one (the `?nodb` look that showed correct colours on the phone). The result is in Controls → Diagnostics as
  "batch colours: vertex ok/FAIL, texture ok/FAIL -> …".

### iPhone colours (pass 7, test v12 updated)
- **Fixed: people, forklifts, machine frames and railings drawn grey on iPhone.** Moving things are drawn in shared batches
  (one draw per look), and each object's colour came from a small float texture read in the vertex shader; on iPhone
  Safari that lookup came out white. Each object now carries its colour as vertex colours on its own copy of its shape
  inside the batch (still one draw per look). Colour changes (New colors, blinking lights) write straight into the batch's
  colour buffer, and a slot freed by an object that leaves is reused by the next one of the same shape.
- It is also lighter everywhere, so it is the default on every device: main-pass draws 231 → ~198 on the phone benchmark,
  shadow draws 132 → ~112, sampled JS allocation 13.7 → 11.7 MB per 10 s. `?dbcol=1` brings back the old colour texture.
- The upset tick no longer builds two new arrays every sim step (compacted in place); the material sync loop no longer
  destructures. Same results: checksums unchanged.

### One layout per site (pass 6, test v12 updated)
- The mill seed is gone from the game: no seed box, dice or "keep this layout" in the site picker, and no new layout each
  visit. Each environment has one fixed layout (valley 21, city 22, desert 23, bayou 24: the four checked for clipping);
  the seed still lays out the scenery internally. `?mill=` still overrides it for tests. The menu's site line now shows
  the site's headline pro and con. Saved sites from earlier builds keep their environment; their seed and pin are ignored.
- Device checks: `?nodb` draws moving things (people, forklifts) one by one instead of in shared batches, `?nosm` turns
  all batching off. For tracking down colours missing on iPhone.
- `tools/quick.py` now measures the layout players see (rural 21) unless `--mill=` is given. Checksum unchanged.

### Fixes (pass 5, test v12 updated)
- **Hard hats** look like hard hats: a dome seated over the head, a full brim all round with a longer peak at the front,
  and the moulded ridge (they were a half-sphere with a cap-like visor on one side).
- **City streets stop at the river** instead of running across the water.
- **The river no longer disappears under the hills** away from the mill: the terrain's river (and rail) levelling was
  inverted, flattening the band's edges and leaving its middle at full hill height. Ground next to lots and features
  could also rise over the water through their flat pads; the band is levelled again after the pads.
- **No flicker on roads and water when zoomed out**: the camera's near plane now follows the zoom (2 m close up, up to
  30 m far out), which gives the depth buffer ~15× more precision at a distance; the ground also sits a hair behind
  whatever is drawn on it (polygon offset).
- **Forest valley**: trees grow taller away from the mill (up to ~45% at 240 m), and each valley has one **deep wood**,
  an ellipse of old forest 200–270 m out in a seeded direction, packed into a closed canopy of 13–20 m conifers with
  broadleaf among them. The zen "forest canopy" shot now sweeps low along its edge.

### Under the hood (pass 3)
- **Draw calls**: the 22 ribbed building walls had a texture clone each (one draw each); they now share one material and
  carry the rib pitch in their uvs, so they batch into one draw. The soft ground shadings under walls and machines
  (transparent decals, one draw each) are baked into one mesh per material by the static merge.
- **Shader programs 109 → 79**: the start-up precompile rendered into an off-screen target, and a target has its own
  output colour space, so every material drawn there compiled a second program that play never used. It now renders to
  the screen behind a 1 px scissor.
- **Late shader compiles 3–4 → 0**: three.js's shadow pass shares one depth material and only re-derives its shader when it
  steps between a plain mesh, an instanced mesh and a batch, taking the side and texture of whatever comes next; the
  precompile now draws every combination in exactly that order, so a batch or textured caster that turns up mid-play
  (the train's bales, a repair sign, the felt) finds its shadow shader ready. The felt's own batch shader is compiled at
  the start too, so nothing compiles in the background any more.
- **Allocation −30%**: materials shared between instanced meshes and plain meshes (bales, rolls, ink trim, metal posts)
  made three.js re-derive their shader parameters about six times a frame; instanced meshes now get their own copy
  (`instMat`). The paper sheet is one geometry updated in place as the reel grows (it was rebuilt from scratch every
  0.02 rad of nip angle). Particle batches keep their lists and update ranges, the static-merge watch compacts in place,
  and the scene's children are grouped by kind (plain, instanced, batched) so the shadow pass switches shaders a few
  times instead of dozens.

### Performance (quick test, phone emulation = Medium tier, rural mill #1)
- Scenery is merged into vertex-coloured meshes (one per map sector on desktops, two on phones; only the one around the
  mill casts shadows): 10k–25k triangles depending on environment, replacing 300 instanced trees (two draws each pass).
- Pass 3, with everything above: main-pass draws 237 normal / 450 all upsets, shadow pass 140 / 90, shader programs
  79, triangles 200k / 279k, texture memory 19.4 MB, JS allocation 1.4 MB/s, late shader compiles 0 / 0
  (pass 2: 246 / 495, 133 / 89, 108–110, 231k / 311k, 17.7 MB, 1.6 MB/s, 0 / 3).
  Other sites: urban 230 / 442 and 212k / 299k; desert 228 / 455 and 185k / 270k; swamp 237 / 455 and 206k / 297k.

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
