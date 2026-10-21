/* ---- v6.8 Report > Control room > Relationship map: every trendable tag (11d TAGS) wired cause → effect by how the sim
   computes it (07, 07b-07g, 05b), drawn as a process map left to right. Tap a tag to light up what drives it and what it
   moves, with the mechanism; "Full chain" follows the links all the way up and down. Live readings on each box. Read
   only: the sim and its dice are untouched, and the game keeps running at the player's speed while it is open.
   Keep RM_E in step with the sim when a relationship changes (tools/relmapcheck.py fails on a tag with no entry). ---- */
const RM_DRV=[["x:weather","Weather",""],["x:bales","Bale grade mix",""],["x:pulpset","Pulper feed setpoint",""],["x:dilv","Pulper dilution valve","knob"],["x:slice","Headbox slice","knob"],["x:guide","Fabric guide roll","knob"],["x:zones","Headbox dilution zones","knob"],["x:spset","Machine speed setpoint",""],["x:grade","Grade on the machine",""],["x:dye","Dye system",""],["x:market","Market & leader effects",""],["x:power","Substation power",""],["x:incomer","MCC main incomer","knob"],["x:hood","Dryer hood doors","knob"],["x:orders","Customer orders",""],["x:upsets","Upsets & DCS motors",""]];
const RM_COL={"YARD":["inq","unload","yard","balem","stk","occp"],"SPOT":["feed","cp","nv101pv","nv101op","amps","pulpLvl","yield","fiber","rejt","hddp","lcdp","lwdp","fsld","fsdp","kwh","dil","chest","chestg","gap","refkw","csf","agit","refq","mcCons","mcLvl","lv104pv","lv104op","mcg","fan"],"WET":["wsp","jw","rd","vac","couchSol","pl","pressSol","gtrav","edge","osc","hbc","bwv","fv201pv","fv201op","bwsp","drain","seal","pressw","wwl","lv202pv","lv202op","wwg","wwov","hum"],"DET":["speed","prod","st1","st3","pv302pv","pv302op","pv303pv","pv303op","steam","dryl","moist","qc300pv","qc300op","bw","draw","tension"],"QCS":["off","rct","prem","cdsp","bank","reel","cut","rollw","trimp","trimt","cdspan","sbout","spout","conv"],"UTIL":["boiler","vent","energyt","shower","evap","wcl","wcg","makeup","fresh","wuse","wwover","outfall","tss"],"SHIP":["fg","load","outq","openo","lateo","price","profit"],"DRV":["mvkv","lv480","dc_SP","dc_PM","dc_WD","dl_pulp","dl_refA","dl_refB","dl_fan","dl_couch","dl_pr1","dl_pr2","dl_dry","dl_reel","dl_wind","mcckw"]};
const RM_E=[
 ["x:weather","balem","p","Rain and snow soak the bales in the yard and on inbound loads"],
 ["x:weather","unload","n","Snow and fog slow inbound trucks"],
 ["x:bales","stk","p","Grade B/C loads carry contamination that reaches the machine as stickies"],
 ["x:bales","fiber","n","Contamination is rejected instead of making fiber"],
 ["inq","unload","p","Queued trucks dock and unload"],
 ["unload","yard","p","Unloaded bales go to the yard"],
 ["yard","unload","n","A full yard stops unloading"],
 ["unload","profit","n","OCC and inbound freight are paid as bales are unloaded"],
 ["occp","profit","n","Fiber cost per ton"],
 ["x:market","occp","p","Blend price, leader fiber deals, contracts"],
 ["x:pulpset","feed","p","Pulper feed rate setpoint"],
 ["yard","feed","p","An empty yard starves the pulper"],
 ["chest","feed","n","Over 97% the pulper is throttled to what the machine uses"],
 ["fsld","feed","n","Fine screens cap the fiber the pulper can send"],
 ["cp","feed","p","Below 4% the thin pulper feeds less"],
 ["feed","yard","n","Bales fed come out of the yard"],
 ["feed","fiber","p","Fiber = bales fed × yield"],
 ["yield","fiber","p","Fiber = bales fed × yield"],
 ["balem","fiber","n","Bale water over 10% isn't fiber"],
 ["x:upsets","yield","x","Upsets and upgrades change the yield multiplier"],
 ["feed","rejt","p","Rejects = bales fed − fiber"],
 ["yield","rejt","n","Better yield, fewer rejects"],
 ["fiber","fsld","p","Screen load = fiber ÷ screen capacity"],
 ["fiber","chest","p","Fiber fills the stock chest"],
 ["prod","chest","n","The machine draws stock from the chest"],
 ["bank","chest","p","Beater rolls are repulped back into the chest"],
 ["openo","rollw","p","The winder runs the width the earliest-due order still short of rolls wants (twin rolls)"],
 ["rollw","trimp","n","Narrower twin rolls leave more of the web as trim"],
 ["trimp","trimt","p","The trim share of what the winder cuts goes down the trim ducts"],
 ["cut","trimt","p","The more the winder cuts, the more trim"],
 ["trimt","chest","p","The dry-end pulper sends the trim back to the stock chest"],
 ["trimp","profit","n","Trim is never sold: it is made, repulped and made again"],
 ["x:zones","cdspan","p","Dilution zones moved off zero put weight streaks in the CD profile"],
 ["sbout","cdspan","n","The steam box dries out wet zones and wet edges"],
 ["spout","cdspan","n","The spray boom brings dry zones back up"],
 ["cdspan","off","p","A zone out of spec sends the roll under it to the beater (its twin ships)"],
 ["sbout","couchSol","p","The steam box heats the sheet so it drains better"],
 ["sbout","steam","p","The steam box uses steam"],
 ["chest","chestg","s","Same chest, in gallons"],
 ["chest","stk","x","Chest residence time delays how fast stickies reach the machine"],
 ["stk","speed","n","Stickies raise the sheet-break rate"],
 ["x:dilv","nv101op","x","The field dilution valve is NV-101's: moving it there puts the loop on MAN"],
 // v6.9 the control loops (07h). Untouched each loop is the game's own model; these are the links once a player touches one
 ["nv101op","cp","n","More dilution water thins the tub (a 20-minute tub)"],
 ["balem","cp","n","Wet bales thin the tub; NV-101 closes to take the water back out"],
 ["cp","nv101pv","s","NV-101 measures the pulper consistency, 30 s late"],
 ["nv101pv","nv101op","x","AUTO: thick tub, open the dilution valve (PID)"],
 ["cp","mcCons","x","Pulper consistency swings reach the machine chest through the storage chest (about an hour)"],
 ["chest","refq","p","The refiners are fed from the stock (storage) chest"],
 ["x:upsets","refq","x","Refiner plates clash: the refiners trip until maintenance re-plates them"],
 ["lv104op","refq","p","LV-104, on the stock chest pump, sets the flow through the refiners"],
 ["refq","mcLvl","p","The refiners feed the machine chest"],
 ["gap","refq","x","Plates clashed: the refiners trip and no stock goes forward to the machine chest"],
 ["refq","refkw","p","No flow through the refiners, no refiner load"],
 ["prod","mcLvl","n","The machine draws the chest down"],
 ["mcLvl","lv104pv","s","LV-104 measures the machine chest level"],
 ["lv104pv","lv104op","x","AUTO: low chest, open the valve (PID on an integrating level)"],
 ["mcLvl","speed","x","With the refiners down the machine trips at 10% and comes back over 35%; on LV-104's own model, under 15% it slows and held empty the sheet breaks"],
 ["mcLvl","chest","x","Over 100% refined stock overflows to the sewer and is lost from the chest"],
 ["bwv","fv201op","s","The basis weight valve is FV-201"],
 ["bw","fv201pv","s","FV-201 reads the QCS weight, 3 minutes late"],
 ["fv201pv","fv201op","x","AUTO: PID on the scanner's weight, on top of the speed feed-forward"],
 ["bwsp","fv201pv","x","FV-201's setpoint is the grade's weight (or the lighter trim)"],
 ["lv202op","wwl","p","Makeup through LV-202 fills the silo"],
 ["lv202op","wcl","n","The makeup comes out of the white water chest"],
 ["wwl","lv202pv","s","LV-202 measures the silo level"],
 ["lv202pv","lv202op","x","AUTO: under its setpoint the makeup opens; overflowing, it sits shut"],
 ["moist","qc300pv","s","QC-300 reads reel moisture from the scanner, a minute late"],
 ["qc300pv","qc300op","x","AUTO: wet reel, raise the steam setpoints (PID)"],
 ["qc300op","pv303pv","p","CAS: QC-300's output is PV-303's setpoint"],
 ["qc300op","pv302pv","p","CAS: PV-302's setpoint is 80% of it"],
 ["pv303op","pv303pv","p","Open the steam valve, the section pressure rises (equal-% trim)"],
 ["pv302op","pv302pv","p","Open the steam valve, the section pressure rises (equal-% trim)"],
 ["pv303pv","pv303op","x","AUTO / CAS: low pressure, open the valve (PID)"],
 ["pv302pv","pv302op","x","AUTO / CAS: low pressure, open the valve (PID)"],
 ["dryl","pv303op","p","A heavier drying load needs the valves further open for the same pressure"],
 ["boiler","pv303pv","x","A sagging steam header caps what the valves can make"],
 ["pv303pv","st3","p","The 2nd/3rd section pressure is the two valves' (half each)"],
 ["pv302pv","st3","p","The 2nd/3rd section pressure is the two valves' (half each)"],
 ["st3","moist","n","More pressure than the load needs dries the sheet; less leaves it wet"],
 ["x:dilv","cp","x","Dilution valve sets pulper consistency (lagged)"],
 ["cp","amps","p","Thicker tub, more rotor amps (trips over 7.5%)"],
 ["cp","pulpLvl","n","More dilution water, higher tub level (overflows under 2.2%)"],
 ["x:upsets","amps","x","Pulper down reads zero amps"],
 ["x:upsets","hddp","x","Purges and cleaner upsets"],
 ["x:upsets","lcdp","x","Purges and plugged cleaners"],
 ["x:upsets","lwdp","x","Purges and plugged cleaners"],
 ["gap","csf","p","Tighter gap, lower freeness"],
 ["kwh","gap","n","The plate gap closes to put the energy in (clash near 120 kWh/t)"],
 ["kwh","refkw","p","Refiner power = kWh/t × fiber through the refiners"],
 ["prod","refkw","p","More fiber through, more power at the same kWh/t"],
 ["kwh","profit","n","Refining power above standard is billed as energy"],
 ["csf","couchSol","p","Freer stock drains faster on the table; low freeness, lower couch solids"],
 ["kwh","rct","p","More refining, stronger fibers, more ring crush"],
 ["kwh","couchSol","n","The price of refining: more ring crush, but slower drainage and lower couch solids"],
 ["bw","rct","p","Ring crush scales with the weight"],
 ["stk","rct","n","Stickies weaken the sheet a little"],
 ["rct","off","x","Under the grade's ring crush minimum the reel goes to the beater"],
 ["bwsp","off","x","Weight spec is ±3% around the setpoint"],
 ["rct","bwsp","p","AUTO-LW: ring crush to spare over the spec + 3%, the optimizer trims the setpoint lighter; short of it, back up to the grade target (slowly, through the QCS dead time)"],
 ["bwsp","prem","n","Under the grade's target, on spec: half the trim as a price premium (max 5%)"],
 ["prem","profit","p","Premium paid as on-spec paper is made"],
 ["bwsp","bwv","p","AUTO feed-forward: the valve follows the setpoint"],
 ["speed","bwv","p","AUTO feed-forward: the valve follows speed"],
 ["bw","bwv","x","AUTO trims the valve on the QCS reading, 3 minutes late"],
 ["bwv","hbc","p","More thick stock, more fiber in the headbox"],
 ["mcCons","hbc","p","Thicker machine chest stock delivers more fiber through the same valve"],
 ["dil","hbc","n","Dilution brings the thick stock down to 0.8%"],
 ["hbc","bw","p","Headbox consistency × jet ÷ wire sets the weight"],
 ["hbc","prod","p","Fiber delivered sets the tons made"],
 ["bwsp","prod","p","Tons = K × speed × weight"],
 ["speed","fan","p","Headbox flow follows speed (jet-to-wire ratio)"],
 ["bwsp","fan","p","Headbox flow is sized for the setpoint at 0.8%"],
 ["fan","dil","p","Dilution = headbox flow − thick stock"],
 ["mcCons","dil","n","Thicker stock, less thick-stock water, more dilution needed"],
 ["fan","drain","p","Drainage = headbox water − sheet water at the couch"],
 ["couchSol","drain","p","Drier at the couch, more drained"],
 ["vac","seal","p","More vacuum, more of the drainage to the seal pit"],
 ["drain","seal","p","The vacuum boxes' share of the drainage"],
 ["couchSol","pressw","n","Press water = couch to press solids"],
 ["pressSol","pressw","p","Press water = couch to press solids"],
 ["drain","wwl","p","Table and couch drainage fall to the silo"],
 ["seal","wwl","n","Seal pit water bypasses the silo"],
 ["dil","wwl","n","The fan pump draws dilution from the silo"],
 ["wwl","dil","x","Empty silo starves the dilution"],
 ["wwl","hbc","x","Under 15% the fan pump cavitates: consistency and weight swing"],
 ["wwl","speed","n","Held under 8% the sheet breaks at the wet end"],
 ["wwl","wwov","p","Over 85% it overflows to the white water chest"],
 ["wwl","wwg","s","Same silo, in gallons"],
 ["wwl","wcl","x","Under 25% the silo makes up from the white water chest (LV-202)"],
 ["wwov","wcl","p","Silo overflow goes to the white water chest"],
 ["seal","wcl","p","Seal pit water returns to the white water chest"],
 ["pressw","wcl","p","Press water via the save-all to the white water chest"],
 ["balem","cp","n","Wet bales thin the pulper; dilution control takes it back out over ~20 min"],
 ["x:bales","hddp","p","Dirty bales build pressure drop"],
 ["x:bales","lcdp","p","Dirty bales build pressure drop"],
 ["x:bales","lwdp","p","Dirty bales build pressure drop"],
 ["x:bales","fsdp","p","Dirty bales build pressure drop"],
 ["fiber","fsdp","p","Screen load raises its pressure drop"],
 ["hddp","yield","n","Over 10% above clean, rejects carry good fiber"],
 ["lcdp","yield","n","Over 10% above clean, rejects carry good fiber"],
 ["lwdp","yield","n","Over 10% above clean, rejects carry good fiber"],
 ["fsdp","yield","n","Over 10% above clean, rejects carry good fiber"],
 ["gap","speed","n","Gap over 0.6 mm raises breaks; under 0.15 mm the plates clash"],
 ["agit","mcCons","x","Under 70% the chest stops mixing and consistency swings"],
 ["wcl","mcCons","n","Empty white water chest: no dilution, thick stock"],
 ["mcCons","speed","n","Heavy swings tear the sheet at the couch"],
 ["mcLvl","mcg","s","Same chest, in gallons"],
 ["speed","wsp","p","Wire speed = reel speed ÷ machine draw"],
 ["draw","wsp","n","More draw, slower wire for the same reel speed"],
 ["x:slice","jw","x","Slice opening sets the jet speed: J/W 0.965 to 1.005, 0.985 standard"],
 ["jw","rd","p","Rush / drag = (J/W − 1) × wire speed"],
 ["wsp","rd","x","Same J/W, bigger rush or drag in fpm at a faster wire"],
 ["vac","couchSol","x","Best at 30 kPa; losses either side, worse below"],
 ["x:slice","couchSol","x","Jet off its best angle or ratio loses couch solids"],
 ["couchSol","pressSol","p","Press solids start from couch solids, point for point"],
 ["pl","pressSol","x","Rises with load to 130 kN/m, then the nip crushes"],
 ["pl","off","p","Crush marks above 115 kN/m"],
 ["pl","speed","n","Nip crush breaks above 130 kN/m"],
 ["vac","speed","n","Under 15 kPa the sheet leaves the couch too wet (breaks); over 45 kPa wears the fabric out"],
 ["x:guide","gtrav","x","AUTO trim and the fabric's slow walk use up guide travel"],
 ["x:guide","edge","x","MANUAL holds still while the fabric drifts"],
 ["gtrav","edge","p","Past full travel the fabric walks off center"],
 ["edge","speed","n","Over 50 mm the fabric runs off the rolls: machine down"],
 ["osc","off","n","Under 40% the pick-up felt stripes the sheet"],
 ["x:upsets","hum","x","Fog fan off or failed"],
 ["x:spset","speed","p","Speed setpoint"],
 ["chest","speed","p","Below the low-level setpoint the machine slows to supply; under 5% it stops"],
 ["moist","speed","n","Over 10% the crew slows the machine until it's back under 9%"],
 ["fg","speed","n","A full warehouse stops the machine"],
 ["reel","speed","n","Winder backed up: the machine stops on spools"],
 ["speed","prod","p","Paper = K × speed × basis weight"],
 ["x:grade","prod","p","Grade basis weight sets tons per foot"],
 ["off","prod","n","Off-spec tons go to the beater, not paper made"],
 ["speed","steam","p","More tons, more water to evaporate"],
 ["pressSol","steam","n","Drier off the presses, less steam (and more when wetter)"],
 ["st1","steam","p","1st section above 70 kPa adds steam cost"],
 ["x:hood","steam","p","Hood doors raised while the machine runs: the hood leaks heat, about 4% more steam"],
 ["speed","st3","p","3rd section demand rises with t/h"],
 ["pressSol","st3","n","Wet end water factor scales demand"],
 ["st1","st3","n","1st section takes part of the 3rd's load"],
 ["x:grade","st3","x","Base pressure per grade"],
 ["speed","dryl","p","Load = demand ÷ ceiling"],
 ["pressSol","dryl","n","Wetter sheet, higher load"],
 ["steam","boiler","n","Above 62 t/h the header sags"],
 ["boiler","dryl","n","A sagging header lowers the dryer ceiling"],
 ["dryl","moist","p","Past 100% of the limit the sheet comes off wet"],
 ["st1","moist","n","More 1st section steam dries the sheet"],
 ["speed","moist","x","Below the floor a slow machine over-dries"],
 ["steam","vent","p","On a sheet break the running steam is vented"],
 ["steam","profit","n","Extra steam per ton is billed as energy"],
 ["moist","off","x","Outside the grade's moisture spec the reel goes to the beater"],
 ["bw","off","x","Outside the grade's weight spec"],
 ["x:dye","off","p","Dye trouble fails color"],
 ["x:grade","off","p","Grade-change transition tons"],
 ["x:zones","cdsp","x","Trimmed zones put streaks in the CD profile"],
 ["moist","cdsp","p","Zone readings ride on reel moisture"],
 ["cdsp","off","p","More than 3 zones out sends part of the reel to the beater"],
 ["draw","tension","p","Tension follows draw"],
 ["draw","off","x","Under 1% the reel wrinkles"],
 ["draw","speed","x","Under 1.5% breaks come more often; over 2.4% the sheet snaps in the open draw"],
 ["draw","rct","n","More draw stretches the sheet: lower ring crush"],
 ["prod","reel","p","Good paper builds on the reel"],
 ["off","reel","p","Beater paper is wound too"],
 ["cut","reel","n","The winder takes it off"],
 ["reel","cut","p","Winder runs while there's paper"],
 ["conv","cut","n","A full conveyor blocks the winder"],
 ["cut","conv","p","Each set puts two rolls on the conveyor"],
 ["conv","fg","p","Clamp trucks move rolls into the warehouse"],
 ["fg","conv","n","A full warehouse can't take rolls"],
 ["off","bank","p","Beater rolls wait in the bay"],
 ["prod","shower","p","Showers = gallons per ton of paper"],
 ["shower","fresh","p","Fresh water = showers + seals + makeup"],
 ["makeup","fresh","p","Fresh water = showers + seals + makeup"],
 ["wcl","makeup","n","Below 40% fresh water makes up (not with the intake iced)"],
 ["wcl","wwover","p","Above 70% the chest overflows to the sewer"],
 ["wwover","outfall","p","Overflow goes through the clarifier to the outfall"],
 ["outfall","tss","n","More flow dilutes the suspended solids"],
 ["prod","tss","p","Machine fiber losses reach the sewer"],
 ["prod","evap","p","Water into the dryers per ton"],
 ["pressSol","evap","n","Drier off the presses, less to evaporate"],
 ["moist","evap","n","Water left in the paper isn't evaporated"],
 ["fiber","wcl","n","Stock prep draws dilution water"],
 ["prod","wcl","p","The machine returns white water"],
 ["shower","wcl","p","Shower water joins the white water"],
 ["evap","wcl","n","Water leaving with the sheet doesn't come back"],
 ["wcl","wcg","s","Same chest, in gallons"],
 ["fresh","wuse","p","Fresh water ÷ paper"],
 ["prod","wuse","n","Fresh water ÷ paper"],
 ["x:market","energyt","p","Energy prices, leader, civics, upgrades"],
 ["x:market","price","p","List price, survival multiplier, perks"],
 ["x:grade","price","x","Price of the grade on the machine"],
 ["x:orders","openo","p","New orders booked per campaign"],
 ["x:orders","outq","p","Trucks called for orders"],
 ["fg","load","p","Rolls in stock to load"],
 ["outq","load","p","A docked truck to load"],
 ["openo","load","p","With the order book, trucks dock only for an order"],
 ["load","fg","n","Loaded rolls leave the warehouse"],
 ["load","openo","n","Shipped orders close"],
 ["openo","lateo","p","Open orders past due + grace are late"],
 ["fg","lateo","n","Short stock makes orders late"],
 ["price","profit","p","Revenue per ton"],
 ["load","profit","p","Revenue is booked as trucks leave"],
 ["energyt","profit","n","Energy is paid per ton made"],
 ["lateo","profit","n","Late chargebacks and cancellations"],
 // v6.10 the drives (07i): the substation feeds the MCC; each drive's load follows the work its motor does
 ["x:power","mvkv","p","115 kV from the utility, stepped down to 13.8 kV at the substation; a blackout drops it to zero, a brownout sags it 8%"],
 ["mvkv","lv480","p","The MCC transformer steps 13.8 kV down to 480 V, through the main incomer breaker"],
 ["x:incomer","lv480","x","Open the main incomer under load and it arcs: the 480 V bus is dead until the electrical tech resets it"],
 ["lv480","dc_SP","p","Each lineup's rectifier makes about 650 V DC from the 480 V bus (1.35 × 480 V)"],["lv480","dc_PM","p","480 V → rectifier → about 650 V DC"],["lv480","dc_WD","p","480 V → rectifier → about 650 V DC"],
 ["x:upsets","dc_SP","x","A rectifier fault drops its lineup's DC bus to zero; a planned outage locks the lineups out"],
 ["dc_SP","dl_pulp","x","No DC bus, no drive: MCC-1 feeds the pulper, refiners and fan pump"],["dc_SP","dl_refA","x","No DC bus, no drive"],["dc_SP","dl_refB","x","No DC bus, no drive"],["dc_SP","dl_fan","x","No DC bus, no drive"],
 ["dc_PM","dl_couch","x","No DC bus, no drive: MCC-2 is the machine's sectional drives"],["dc_PM","dl_pr1","x","No DC bus, no drive"],["dc_PM","dl_pr2","x","No DC bus, no drive"],["dc_PM","dl_dry","x","No DC bus, no drive"],["dc_PM","dl_reel","x","No DC bus, no drive"],
 ["dc_WD","dl_wind","x","No DC bus, no drive: MCC-3 is the winder"],
 ["x:power","mcckw","x","The substation feeds the MCC; lightning, a bird on the line or a brownout knock the drives' health down"],
 ["amps","dl_pulp","p","Rotor amps are the pulper drive's load (a thick tub works it harder)"],
 ["refkw","dl_refA","p","Refiner power, split across the two refiner drives"],["refkw","dl_refB","p","Refiner power, split across the two refiner drives"],
 ["kwh","dl_refA","p","More refining energy or more fiber through them, more load: refining energy × fiber rate; 85 kWh/t at 35 t/h, or about 75 kWh/t at 40 t/h, runs them at 100%"],["kwh","dl_refB","p","More refining energy or more fiber through them, more load: refining energy × fiber rate; 85 kWh/t at 35 t/h, or about 75 kWh/t at 40 t/h, runs them at 100%"],
 ["speed","dl_fan","p","Headbox flow follows speed: the fan pump works harder"],["vac","dl_couch","p","More forming vacuum, more drag on the couch roll"],
 ["pl","dl_pr1","p","Press load is torque on the press drives"],["pl","dl_pr2","p","Press load is torque on the press drives"],
 ["speed","dl_dry","p","The dryer section drive's load rises with speed"],["tension","dl_reel","p","Draw tension is torque on the reel drum"],["cut","dl_wind","p","Winding faster loads the winder drum"],
 ["x:upsets","dl_pulp","x","A failed bearing, motor or drive (or the pulper down) reads zero"],["x:upsets","dl_dry","x","A failed bearing, motor or drive, or the machine down, reads zero"],
 ["dl_pulp","mcckw","p","The MCC's power is the drives' loads × their ratings"],["dl_refA","mcckw","p","The MCC's power is the drives' loads × their ratings"],["dl_refB","mcckw","p","The MCC's power is the drives' loads × their ratings"],
 ["dl_fan","mcckw","p","The MCC's power is the drives' loads × their ratings"],["dl_couch","mcckw","p","The MCC's power is the drives' loads × their ratings"],["dl_pr1","mcckw","p","The MCC's power is the drives' loads × their ratings"],
 ["dl_pr2","mcckw","p","The MCC's power is the drives' loads × their ratings"],["dl_dry","mcckw","p","The MCC's power is the drives' loads × their ratings"],["dl_reel","mcckw","p","The MCC's power is the drives' loads × their ratings"],
 ["dl_wind","mcckw","p","The MCC's power is the drives' loads × their ratings"],
 ["dl_refA","speed","x","A drive past ~95% load trips more often; a tripped refiner drive leaves one refiner and the machine slows to 75%"],
 ["dl_pr1","speed","x","Over 100% load wears the motor and the drive faster; a failed press drive stops the machine"],
 ["dl_pulp","feed","x","Over 100% load wears the rotor motor faster; a failed pulper drive stops the pulper"]];
const RM_AREA={IN:["Inputs","#a99ad6"],YARD:["Bale yard","#d0a66a"],SPOT:["Stock prep","#5fc497"],WET:["Wet end","#6db2e6"],DET:["Dry end","#ee9667"],
  QCS:["Quality & winding","#e07fb0"],UTIL:["Water & utilities","#8fb3c4"],SHIP:["Shipping & money","#b5c46a"],DRV:["Drives (MCC)","#d9c25a"]};
const RM_ORDER=["IN","YARD","SPOT","WET","DET","DRV","QCS","UTIL","SHIP"];
const RM_SG={p:"+",n:"−",x:"~",s:"="},RM_SC={p:"#4fd18b",n:"#ff7a6e",x:"#ffb02e",s:"#8a9a96"};
const RMUI={open:false,sel:null,mode:"direct",ext:true,P:null,z:1,W:0,H:0};   // (v6.8.3 z: zoom, 0.3-2; W/H: the map at 100%)
// the graph: tags from the registry (names and units live), drivers from RM_DRV
const RM_N=(()=>{const n={};for(const [id,name,unit] of RM_DRV)n[id]={id,name,unit,col:"IN",ext:true,ins:[],outs:[]};
  for(const c in RM_COL)for(const id of RM_COL[c])if(TAGI[id]!=null)n[id]={id,col:c,ext:false,ins:[],outs:[]};
  for(const t of TAGS)if(!n[t[0]])n[t[0]]={id:t[0],col:"UTIL",ext:false,ins:[],outs:[]};   // (a tag added later and not placed yet)
  for(const [a,b,s,h] of RM_E)if(n[a]&&n[b]){n[a].outs.push({o:b,s,h});n[b].ins.push({o:a,s,h});}
  return n;})();
const rmName=id=>{const n=RM_N[id];return n.ext?n.name:tagName(id);};
function rmOv(){let o=$("rmOv");if(o)return o;
  o=kEl("div","overlay top dcsov rmov");o.id="rmOv";o.hidden=true;
  o.innerHTML=`<div class="dcs rmw" role="dialog" aria-modal="true" aria-labelledby="rm-h"><div class="dcsh"><b id="rm-h">RELATIONSHIP MAP</b>
    <div class="seg" role="group" aria-label="Highlight"><button type="button" data-rmm="direct">Direct</button><button type="button" data-rmm="chain">Full chain</button></div>
    <div class="seg" role="group" aria-label="Drivers"><button type="button" data-rmx="1">Drivers</button><button type="button" data-rmx="0">Tags only</button></div>
    <div class="seg rmzoom" role="group" aria-label="Zoom"><button type="button" data-rmz="-" aria-label="Zoom out">−</button><button type="button" data-rmz="fit" title="Show the whole map">Fit</button><button type="button" data-rmz="+" aria-label="Zoom in">+</button></div>
    <button aria-label="Close" class="dcsx" id="rmClose">✕</button></div>
    <div class="rmleg"><span><i style="border-color:${RM_SC.p}"></i>+ rises with</span><span><i style="border-color:${RM_SC.n}"></i>− falls as it rises</span><span><i style="border-color:${RM_SC.x}"></i>~ optimum, limit or swing</span><span><i style="border-color:${RM_SC.s};border-top-style:dashed"></i>= same reading</span><span>dashed box: a driver, not a tag · H: hourly history</span></div>
    <div class="rmb"><div class="rmmap" id="rmMap"><svg id="rmSvg" role="img" aria-label="Relationship map of the mill's readings"></svg></div><aside class="rmside" id="rmSide" aria-live="polite"></aside></div>
    <div class="dcsf"><span>Structural links from the sim, not measured correlation: Trends → Moves with measures what moved together in this run.</span><span id="rmCnt"></span></div></div>`;
  document.body.appendChild(o);
  $("rmClose").addEventListener("click",()=>rmClose());o.addEventListener("click",e=>{if(e.target===o&&!POP.on)rmClose();});
  o.querySelectorAll("[data-rmm]").forEach(b=>b.addEventListener("click",()=>{RMUI.mode=b.dataset.rmm;rmSync();rmLight();rmSide();}));
  o.querySelectorAll("[data-rmx]").forEach(b=>b.addEventListener("click",()=>{RMUI.ext=b.dataset.rmx==="1";if(!RMUI.ext&&RMUI.sel&&RM_N[RMUI.sel].ext)RMUI.sel=null;rmSync();rmDraw();rmSide();}));
  o.querySelectorAll("[data-rmz]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.rmz;rmZoom(k==="fit"?rmFitZ():RMUI.z*(k==="+"?1.25:0.8));}));
  $("rmSvg").addEventListener("click",e=>{const g=e.target.closest(".rmn");if(g)rmPick(g.dataset.id,false);});
  $("rmSvg").addEventListener("keydown",e=>{const g=e.target.closest&&e.target.closest(".rmn");if(g&&(e.key==="Enter"||e.key===" ")){e.preventDefault();rmPick(g.dataset.id,false);}});
  $("rmSide").addEventListener("click",e=>{const b=e.target.closest("[data-rmgo],[data-rmtr]");if(!b)return;if(b.dataset.rmgo)rmPick(b.dataset.rmgo,true);else rmTrend(b.dataset.rmtr);});
  return o;}
function rmSync(){const o=$("rmOv");if(!o)return;o.querySelectorAll("[data-rmm]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.rmm===RMUI.mode)));
  o.querySelectorAll("[data-rmx]").forEach(b=>b.setAttribute("aria-pressed",String((b.dataset.rmx==="1")===RMUI.ext)));}
function rmOpen(){if(POP.on&&!POP.inApp){popShow("rm");return;}   // (v6.8.3: popped out, it opens on the second screen)
  const o=rmOv();if(G3.closeKnobUI)G3.closeKnobUI();RMUI.open=true;o.hidden=false;if(!RMUI.sel)RMUI.sel="moist";rmSync();rmDraw();rmSide();
  setTimeout(()=>{try{$("rmClose").focus({preventScroll:true});rmScroll(RMUI.sel);}catch(_){}},0);}
function rmClose(){if(POP.on&&!POP.inApp){popShow("home");return;}const o=$("rmOv");if(o)o.hidden=true;RMUI.open=false;}
document.addEventListener("keydown",e=>{if(e.key!=="Escape"||!RMUI.open)return;e.preventDefault();e.stopPropagation();rmClose();},true);
// columns in process order, each ordered by its neighbours' rows (a few sweeps cut the crossings)
function rmLayout(){const cols=RM_ORDER.filter(c=>RMUI.ext||c!=="IN").map(c=>Object.values(RM_N).filter(n=>n.col===c&&(RMUI.ext||!n.ext)));
  const pos={};cols.forEach(c=>c.forEach((n,i)=>pos[n.id]=i));
  for(let it=0;it<8;it++)cols.forEach(c=>{for(const n of c){const nb=[...n.ins,...n.outs].map(r=>pos[r.o]).filter(v=>v!=null);n._k=nb.length?nb.reduce((a,b)=>a+b,0)/nb.length:pos[n.id];}
    c.sort((a,b)=>a._k-b._k);c.forEach((n,i)=>pos[n.id]=i);});
  return cols;}
const RM_W=168,RM_H=32;
function rmDraw(){const svg=$("rmSvg");if(!svg)return;const cols=rmLayout(),CW=208,GY=9,TOP=34,maxN=Math.max(...cols.map(c=>c.length)),H=TOP+maxN*(RM_H+GY)+16,W=cols.length*CW+16,P={};
  cols.forEach((c,ci)=>{const off=(maxN-c.length)*(RM_H+GY)/2;c.forEach((n,i)=>P[n.id]={x:12+ci*CW,y:TOP+off+i*(RM_H+GY),ci});});RMUI.P=P;
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);RMUI.W=W;RMUI.H=H;rmSize();
  const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");let h="";
  cols.forEach((c,ci)=>{if(c.length)h+=`<text class="rmch" x="${12+ci*CW}" y="20">${RM_AREA[c[0].col][0].toUpperCase()}</text>`;});
  for(const [a,b,s] of RM_E){const A=P[a],B=P[b];if(!A||!B)continue;const y1=A.y+RM_H/2,y2=B.y+RM_H/2;let d;
    if(B.ci>A.ci){const x1=A.x+RM_W,x2=B.x,m=(x2-x1)/2;d=`M${x1} ${y1}C${x1+m} ${y1} ${x2-m} ${y2} ${x2} ${y2}`;}
    else if(B.ci<A.ci){const x1=A.x,x2=B.x+RM_W,dy=Math.max(30,Math.abs(y2-y1)*0.2);d=`M${x1} ${y1}C${x1-60} ${y1+dy} ${x2+60} ${y2+dy} ${x2} ${y2}`;}
    else{const x=A.x+RM_W,bw=Math.min(70,18+Math.abs(y2-y1)*0.25);d=`M${x} ${y1}C${x+bw} ${y1} ${x+bw} ${y2} ${x} ${y2}`;}
    h+=`<path class="rme rm-${s}" data-a="${a}" data-b="${b}" d="${d}" marker-end="url(#rmk${s})"/>`;}
  for(const id in P){const n=RM_N[id],p=P[id],nm=rmName(id),t=nm.length>23?nm.slice(0,22)+"…":nm;
    h+=`<g class="rmn${n.ext?" ext":""}" data-id="${id}" tabindex="0" role="button" aria-label="${esc(nm)}" transform="translate(${p.x},${p.y})"><rect width="${RM_W}" height="${RM_H}" rx="4"/><rect class="rmbar" width="4" height="${RM_H}" style="fill:${RM_AREA[n.col][1]}"/>
      <text x="10" y="13">${esc(t)}</text><text class="rmv" x="10" y="26" data-v="${id}">${n.ext?"driver":""}</text>${!n.ext&&tagHasLong(id)?`<text class="rmhl" x="${RM_W-7}" y="13" text-anchor="end">H</text>`:""}</g>`;}
  const mk=s=>`<marker id="rmk${s}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" fill="${RM_SC[s]}"/></marker>`;
  svg.innerHTML=`<defs>${mk("p")}${mk("n")}${mk("x")}${mk("s")}</defs>`+h;
  const c=$("rmCnt");if(c)c.textContent=`${TAGS.length} tags · ${RM_DRV.length} drivers · ${RM_E.length} links`;
  rmLive(true);rmLight();}
function rmReach(id,dir){const seen=new Set([id]),st=[id];while(st.length){const c=st.pop();for(const r of RM_N[c][dir]){if(!RMUI.ext&&RM_N[r.o].ext)continue;if(!seen.has(r.o)){seen.add(r.o);st.push(r.o);}}}return seen;}
function rmLight(){const svg=$("rmSvg");if(!svg)return;const sel=RMUI.sel;svg.classList.toggle("dim",!!sel);
  svg.querySelectorAll(".rmn").forEach(g=>g.classList.remove("on","sel"));svg.querySelectorAll(".rme").forEach(e=>e.classList.remove("on"));if(!sel)return;
  const ch=RMUI.mode==="chain",up=ch?rmReach(sel,"ins"):new Set([sel,...RM_N[sel].ins.map(r=>r.o)]),dn=ch?rmReach(sel,"outs"):new Set([sel,...RM_N[sel].outs.map(r=>r.o)]),on=new Set([...up,...dn]);
  svg.querySelectorAll(".rmn").forEach(g=>{if(on.has(g.dataset.id))g.classList.add("on");if(g.dataset.id===sel)g.classList.add("sel");});
  svg.querySelectorAll(".rme").forEach(e=>{const a=e.dataset.a,b=e.dataset.b;if((up.has(a)&&up.has(b))||(dn.has(a)&&dn.has(b))){if(!ch&&a!==sel&&b!==sel)return;e.classList.add("on");}});}
function rmSide(){const el=$("rmSide");if(!el)return;const sel=RMUI.sel;
  if(!sel){el.innerHTML=`<p class="dcsfield">Tap a reading on the map to see what drives it and what it moves.</p>`;return;}
  const n=RM_N[sel],a=RM_AREA[n.col],z=!!S.zen;
  const li=arr=>arr.length?`<ul class="rmrel">${arr.filter(r=>RMUI.ext||!RM_N[r.o].ext).map(r=>`<li><span class="rmsg" style="color:${RM_SC[r.s]}">${RM_SG[r.s]}</span><span><button type="button" class="linkb" data-rmgo="${r.o}">${rmName(r.o)}</button><small>${r.h}</small></span></li>`).join("")}</ul>`:`<p class="dcsfield">Nothing in the sim.</p>`;
  const ch=RMUI.mode==="chain"?`<p class="dcsfield">Full chain: ${rmReach(sel,"ins").size-1} upstream · ${rmReach(sel,"outs").size-1} downstream</p>`:"";
  el.innerHTML=`<div class="rmhd"><b>${rmName(sel)}</b><div class="rmpills"><span style="color:${a[1]};border-color:${a[1]}">${a[0]}</span>${n.ext?"<span>driver, not a tag</span>":`<span>${tagUnit(sel)||"–"}</span><span>${tagHasLong(sel)?"48 h + hourly":"48 h"}</span>`}</div>
    ${n.ext?"":`<div class="rmnow"><small>Now</small><b data-rmnow>${tagFmt(sel,tagNow(sel))}</b>${z?"":`<button type="button" class="reroll kstd" data-rmtr="${sel}">Trend it</button>`}</div>`}</div>${ch}
    <div class="dcssub">Driven by</div>${li(n.ins)}<div class="dcssub">Moves</div>${li(n.outs)}`;}
function rmPick(id,scroll){if(!RM_N[id])return;if(!RMUI.ext&&RM_N[id].ext){RMUI.ext=true;rmSync();rmDraw();}RMUI.sel=RMUI.sel===id&&!scroll?null:id;rmLight();rmSide();if(RMUI.sel&&scroll)rmScroll(id);}
function rmScroll(id){const box=$("rmMap"),p=RMUI.P&&RMUI.P[id],z=RMUI.z;if(!box||!p)return;box.scrollTo({left:Math.max(0,(p.x+RM_W/2)*z-box.clientWidth/2),top:Math.max(0,p.y*z-box.clientHeight/2),behavior:"smooth"});}
// v6.8.3 zoom: the SVG's drawn size is the map's size times RMUI.z (its viewBox stays the same, so nothing is re-laid out).
// Zooming keeps the point at the middle of the view where it is; Fit shows the whole map.
function rmSize(){const svg=$("rmSvg");if(!svg||!RMUI.W)return;svg.setAttribute("width",Math.round(RMUI.W*RMUI.z));svg.setAttribute("height",Math.round(RMUI.H*RMUI.z));
  const o=$("rmOv");if(o)o.querySelectorAll("[data-rmz]").forEach(b=>{const k=b.dataset.rmz;b.disabled=k==="+"?RMUI.z>=2-1e-6:k==="-"?RMUI.z<=0.3+1e-6:false;});}
function rmFitZ(){const box=$("rmMap");if(!box||!RMUI.W)return 1;return Math.min(1,(box.clientWidth-4)/RMUI.W,(box.clientHeight-4)/RMUI.H);}
function rmZoom(z){const box=$("rmMap");z=clamp(z,0.3,2);if(!box){RMUI.z=z;return;}const z0=RMUI.z,cx=(box.scrollLeft+box.clientWidth/2)/z0,cy=(box.scrollTop+box.clientHeight/2)/z0;
  RMUI.z=z;rmSize();box.scrollLeft=Math.max(0,cx*z-box.clientWidth/2);box.scrollTop=Math.max(0,cy*z-box.clientHeight/2);}
// a tag onto the trend screen (the pen list, as "+ trend" does in Moves with)
function rmTrend(id){if(S.zen||TAGI[id]==null)return;rmClose();openStation("TREND","dcs");const p=trPens();if(!p.includes(id)){if(p.length>=TR_MAX)p.pop();p.push(id);}TRUI.mode="tr";trBuild();trDraw(true);}
// live readings on the boxes and the side panel (5 a second while open)
function rmLive(force){if(!RMUI.open)return;const svg=$("rmSvg");if(!svg)return;
  svg.querySelectorAll("[data-v]").forEach(t=>{const id=t.dataset.v;if(RM_N[id].ext)return;const v=tagFmt(id,tagNow(id));if(force||t.textContent!==v)t.textContent=v;});
  const nw=$("rmSide")&&$("rmSide").querySelector("[data-rmnow]");if(nw&&RMUI.sel&&!RM_N[RMUI.sel].ext){const v=tagFmt(RMUI.sel,tagNow(RMUI.sel));if(nw.textContent!==v)nw.textContent=v;}}
UI_TICKS.push(k=>{if(RMUI.open&&k%2===0)rmLive(false);});
G3.rm={open:()=>rmOpen(),close:()=>rmClose(),N:RM_N,E:RM_E,pick:id=>rmPick(id,true),ui:RMUI};   // (tests: tools/relmapcheck.py)
