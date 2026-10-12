# Changelog

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
