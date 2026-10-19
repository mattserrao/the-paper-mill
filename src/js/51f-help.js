/* ---------- v5.7.2 Help: one page, two tabs (Guide and Glossary), opened from the title screen (? next to the cog) and
   the pause menu (Help). Replay the tutorial: in a running game it closes Help and the menu and runs the quick-start
   cards at once; anywhere else (the title screen, before a run) it switches the tutorial on for the next run. ---------- */
{const HG=[
  ["The goal","goal",`<p>Your mill turns old corrugated boxes (OCC) into new paperboard. Trucks bring bales in, the paper machine makes giant reels, the winder cuts them into rolls and trucks take them away. You earn money on every ton shipped.</p>
    <ul><li><b>Season:</b> 30 days. Make as much profit as you can. Your profit is your score on the season leaderboard.</li>
    <li><b>Survival:</b> no last day. Each wave (4 days, ending with a planned outage) brings more upsets and higher costs. The run ends when cash falls below −$1.5M; your time survived is your score.</li>
    <li><b>Free Play:</b> no clock, free upgrades and no leaderboard. Good for trying things out.</li>
    <li><b>Zen Mode:</b> sit back and watch the mill run.</li></ul>`],
  ["Fiber in, paper out","flow",`<ol><li><b>Receiving:</b> trucks unload bales of OCC into the bale yard.</li><li><b>Stock prep:</b> the pulper turns bales back into pulp; cleaners, screens and the disk thickener strip out sand, staples and plastic; the stock chest stores clean pulp; the refiners strengthen the fibers.</li>
    <li><b>Paper machine:</b> the headbox sprays pulp onto the forming fabric, the presses squeeze water out, the dryer cans dry the sheet and the reel winds it up.</li><li><b>Winder:</b> cuts each reel into customer rolls.</li><li><b>Warehouse and shipping:</b> rolls are stored, then loaded onto trucks.</li></ol>
    <p>In a season or survival run the controls run on AUTO; in free play you can set them yourself in Settings.</p>`],
  ["The bottleneck and upgrades","up",`<p>The mill can only run as fast as its narrowest step. Every mill starts with one bottleneck: the <b>Upgrades</b> tab names it, and upgrades that fix it are 25% off. Fix it first.</p>
    <ul><li>One upgrade a day in a season or survival run; the day turns over at 6 AM. Free play has no limit.</li><li><b>Line capacity</b>, at the bottom of the Upgrades tab, shows every step's tons per hour, so you can see what holds the mill back next.</li></ul>`],
  ["Upsets","upsets",`<p>Breakdowns, sheet breaks, hayouts, storms and the odd pigeon. Each costs a repair bill and often downtime.</p>
    <ul><li>A red tag marks each one; tap it to fly there. The <b>Upsets</b> tab lists what's down.</li><li>Paper machine jobs go to the machine crew one at a time. Maintenance techs work in pairs. More techs and spare parts make repairs faster.</li>
    <li>Many upsets ask you to choose how to deal with them (see Civics).</li><li>Event cards offer deals and trials: a cost now for a chance at a gain.</li></ul>`],
  ["Daily rounds and tells","rounds",`<p>Failures show before they happen. Equipment that is about to fail has a <b>tell</b> in its area for 1.5 in-game days (less in later survival waves): a red-hot motor, a pump shaking loose, a leaking flange, a hissing steam joint, pallets against a heater.</p>
    <ul><li>Tap <b>Round</b> in the dock once a day and pick an area. An operator walks it for about 15 seconds while the game keeps running.</li><li>Tap anything failing. Caught: a planned repair at 40% of the bill, no downtime, Machinery and Labor go up. Missed: it breaks down as usual.</li>
    <li>An area with nothing wrong still nudges Labor or Community.</li><li>The <b>Vibration Report</b> shows which areas are climbing. It comes with the Reliability program (Upgrades → Maintenance) or with Dot.</li>
    <li>Acts of nature, people problems and supply trouble come without warning.</li></ul>`],
  ["Planned outages","outages",`<p>The mill comes down on purpose for a 4-hour shutdown: in a season on days 7, 14, 21 and 28, in survival every 4 days.</p>
    <ul><li>24 hours before, you set a maintenance budget for stock prep, the wet end and the dry end. More money means fewer breakdowns until the next outage.</li>
    <li><b>Outage prep checklist</b> (3 days before; tap the outage countdown under the clock, or open it from the Round card): four items unlock at 72, 48, 24 and 8 hours out. Each one done shortens the outage and returns 5% of the budget.</li>
    <li>"Watch the crews" on the outage notice slows the clock so you can see the work.</li></ul>`],
  ["Civics","civics",`<p>Four meters under the top bar, 0 to 100: <b>Economy</b> (customers and prices), <b>Labor</b> (the crew), <b>Machinery</b> (the equipment) and <b>Community</b> (the town and permits).</p>
    <ul><li>Bands: Crisis (under 20), Strained, Steady, Strong and Excellent (over 80). Low meters hurt more than high ones help.</li>
    <li>Many upsets offer two or three choices with different costs and effects on the meters. Tick "Always do this" to set a standing order for that area.</li>
    <li>A meter falling gives a warning, then a crisis; reaching Excellent gives a reward card. Meters drift back toward the middle over time.</li><li>Seasons and survival; not free play or zen.</li></ul>`],
  ["Mill leaders","leaders",`<p>You pick a leader when a season or survival run starts. Each is strong on one side of the mill and costs something on another. Tap their face in the top bar to see their card.</p>
    <ul><li><b>Chip Kraftwell</b> (businessman): fiber price locks or sales pushes; pay settlements and labor trouble.</li><li><b>Dot "Doc" Blade</b> (mechanic): faster repairs, may fix a big breakdown on her own, brings the Vibration Report; dearer repair bills.</li>
    <li><b>Felicity Fourdrinier</b> (engineer): capacity projects that stay with the mill; outages overrun.</li><li><b>Hank Headbox</b> (operator): fewer breaks and less steam; runs the sheet heavy.</li></ul>
    <p>At each outage the leader makes one pick that stays with the mill. You can change leader once per run, in an outage budget dialog.</p>`],
  ["Fiddly knobs","knobs",`<p>Red knobs around the mill do nothing until you touch them. Move one and trouble may turn up later, sometimes somewhere else. The crew traces it back in the end.</p>
    <ul><li>Tap the red hardware, or open the <b>DCS screens</b> from the operator consoles (SPOT for stock prep, WET and DET on the machine floor).</li><li>The game slows to 1 min/s while a knob panel or DCS screen is open.</li><li>The DCS covers the whole machine: SPOT (stock prep, from the bale conveyor to the fan pump), WET, DET (through the winder and roll conveyor) and UTIL (water, effluent, rejects). Setpoints there are the same as Process flow's controls: AUTO and locked in a season.</li><li><b>Motors</b> (bale conveyor, ragger, junk trap, screen rotors, dye pump, fog fan): OFF stops that step like a breakdown, and the operators start it again after 30 minutes. <b>Reject purges</b> left in MANUAL build pressure until the cleaners plug.</li><li><b>Settings → View → Fiddly knobs view</b> greys out the mill and shows only the knobs.</li></ul>`],
  ["Process flow","pflow",`<p><b>Settings → View → Process flow</b> draws the whole mill for today's mill day (6am to 6am), or yesterday: what goes in (fiber, energy, chemicals and water, labor, maintenance, overhead), the areas it passes through, and what comes out (paper, waste, profit).</p>
    <ul><li>The blue band grows as money is spent, area by area, and meets the day's revenue at the end.</li><li>Waste is in tons: rejects to landfill, fiber lost in the effluent, and broke that goes round again.</li><li>Today, Yesterday, 7 d or Run: the run includes the 14 days before you took over (switch them off with Prior days).</li><li>Tap any area, input or output for its panel: trends over time (24 h, 7 d or the whole run; tap a chart to read it), costs, and for areas uptime and quality.</li><li><b>The dryers have a limit.</b> More speed, a heavier grade or a wetter sheet from the wet end means more water to dry. Past the 3rd section's limit the sheet comes off wet, fails the moisture spec and goes to the beater, and the crew slows the machine until it's dry again. The shoe press gives the dryers more headroom. Watch DRYER LOAD on the DET screen.</li><li>Each area's controls (truck arrivals, crews, pulper feed, machine speed and grade, winder, loaders) are in its panel under <b>Controls</b>: AUTO and locked in a season or survival run, yours in Free Play.</li><li>Freight in and Freight out move with a weekly diesel price, the weather and detours.</li><li>Tap any box or band for its breakdown. The mill keeps running while it's open, so the numbers update live.</li></ul>`],
  ["Controls","controls",`<ul><li><b>Speed:</b> tap the top bar to open it, then − and +. Pause is the button on the far left.</li><li><b>Camera:</b> a fixed isometric view. Drag to pan; pinch, scroll or + and − to zoom one step at a time. On a keyboard: arrows or WASD to move. Roofs lift off as you zoom in (Settings → View → Cutaway).</li>
    <li><b>Go to:</b> the buttons above the dock fly to each area. Tap a label or a red tag to fly to it.</li><li><b>Labels</b> in the top bar shows or hides equipment labels.</li><li>The game pauses while a bottom panel is open.</li></ul>`],
  ["Scores and saving","score",`<ul><li>A season or survival run saves on this device as you play; <b>Continue</b> on the title screen picks it up.</li><li>Season and survival each have their own leaderboard. The end screen also shows your grade, civics and upsets caught early.</li></ul>`]];
  // glossary: [term, definition]  (kept in plain words; the game's own names where it has them)
  const GL=[
    ["Agitator","A mixer in a chest or pit that keeps fiber from settling. One of the fiddly knobs."],
    ["Basis weight","How heavy the paper is per area (lb per 1,000 ft²). Each grade has a target; running heavy wastes fiber."],
    ["Beater / broke","Paper that didn't make it (off-spec, trimmed, or lost in a break or hayout), sent back to be repulped."],
    ["Bale yard","Where OCC bales are stored before the pulper."],
    ["Bottleneck","The slowest step in the mill. It sets how much the whole mill can make."],
    ["Civics","The four meters: Economy, Labor, Machinery and Community."],
    ["Clamp truck","A lift truck that grips paper rolls from the sides, used in the warehouse and at the shipping docks."],
    ["Cleaners (HD, LC, lightweight)","Cone-shaped separators that spin out heavy dirt (high-density), sand (low-consistency) and light plastic and wax (lightweight)."],
    ["Consistency","How much fiber is in the water, as a percentage. Pulp is mostly water."],
    ["Couch pit","The pit under the end of the forming section that catches trimmed and broken sheet."],
    ["DCS","Distributed control system: the operator screens (SPOT, WET, DET) with live readings, alarms and trends."],
    ["Deckle / trim","The usable width of the sheet. A wider trim makes more tons at the same speed."],
    ["Disk thickener","Removes water from the pulp before it goes to the stock chest."],
    ["DLK","Double-lined kraft clippings: stronger, dearer fiber used in heavier grades."],
    ["Draw","The small speed difference between sections that keeps the sheet tight. Too tight snaps it; too slack wrinkles it."],
    ["Dryer cans","Steam-heated cylinders that dry the sheet."],
    ["Felt","A fabric belt that carries the sheet through the presses and soaks up the water squeezed out."],
    ["Forming fabric (wire)","The moving mesh the pulp lands on; water drains through it and the sheet forms on top."],
    ["fpm","Feet per minute: paper machine speed."],
    ["GEMBA","Going to where the work is done to see it for yourself. The daily round is a GEMBA walk."],
    ["Grade","The product on the machine: 23m, 26m and 30m are corrugating medium of different weights; 33HT is high-test liner. The market sets which grade runs."],
    ["Hayout","A winder blow-up: the set of rolls tears apart and paper flies everywhere."],
    ["Headbox","Sprays an even jet of pulp across the full width of the forming fabric."],
    ["Headbox slice","The adjustable lip of the headbox that sets the jet across the machine."],
    ["Machine chest","The chest that feeds the paper machine with pulp at a steady consistency."],
    ["Mill leader","The person in charge of your run: Chip, Dot, Felicity or Hank."],
    ["OCC","Old corrugated containers: used cardboard boxes, the mill's raw material."],
    ["Off-spec","Paper outside its grade's spec (basis weight ±3%, moisture 8 ±2%, the mill's color) or with defects like streaks and crush marks. It's wound into beater rolls, which go back to the pulper to be repulped (the QCS screen shows the spec)."],
    ["Outage","A planned shutdown for maintenance, every 7 days in a season and every 4 days in survival."],
    ["Outage prep","The four-item checklist before an outage that shortens and cheapens it."],
    ["Press section","Rolls that squeeze water out of the wet sheet through the felts."],
    ["Pulper","A giant blender that turns bales and water into pulp."],
    ["QCS","Quality control system: scanners that measure the sheet's weight and moisture across and along the reel."],
    ["Ragger","A rope that collects wire, plastic and string from the pulper. If its tail breaks, the pulper stops."],
    ["Reel","The giant roll the paper machine winds up (about 100 tons)."],
    ["Refiner","Grinds fibers between plates so they bond into stronger paper. Plates set too close can clash."],
    ["Rethread","Feeding the sheet back through the machine after a break."],
    ["Round","Your once-a-day walk through one area to catch tells before they fail."],
    ["Screens (coarse, fine)","Pressurized baskets with holes or slots that let fiber through and hold back trash."],
    ["Sheet break","The paper tears on the machine. Nothing is made until the crew rethreads it. The boiler stays at load and the steam the dryers don't need is vented through the roof, so a break still costs steam."],
    ["Standing order","A rule you set for how upsets in an area are handled, so you aren't asked every time."],
    ["Steam joint","The rotating seal that brings steam into a dryer can."],
    ["Stock","Pulp: fiber in water."],
    ["Stock chest","A big tank of clean pulp between stock prep and the paper machine. A full chest keeps the machine running when stock prep stops."],
    ["t/h","Tons per hour."],
    ["Tell","The visible sign that a piece of equipment is about to fail. Only seen on a Round."],
    ["Tied rolls","A set that comes off the winder with its two rolls stuck together where the slitter didn't cut clean. They're sawn apart and both go to the beater."],
    ["Upset","Anything that goes wrong: a breakdown, a break, a storm, a fine."],
    ["Vibration Report","The Round card's trend arrows: which areas have something about to fail."],
    ["Wave","In survival, the stretch between planned outages. Each wave is rougher and costlier than the last."],
    ["Wet end / dry end","The wet end is the headbox, forming section and presses; the dry end is the dryers, reel and winder."],
    ["Winder","Unwinds each reel and slits and rewinds it into customer rolls, two side by side in each set. Up to four full reels wait on the storage stands when it falls behind."]];
  let ov=null,tab="guide";
  function render(){const q=(ov.querySelector("#helpQ")||{value:""}).value||"";
    ov.innerHTML=`<div class="modal help" role="dialog" aria-modal="true" aria-labelledby="help-h">
      <div class="hhead"><h2 id="help-h">Help</h2><button type="button" class="hx" id="help-x" aria-label="Close help">✕</button></div>
      <div class="htabs" role="tablist"><button role="tab" id="htGuide" aria-selected="${tab==="guide"}" data-t="guide">Game guide</button><button role="tab" id="htGlos" aria-selected="${tab==="glos"}" data-t="glos">Glossary</button></div>
      <div class="hbody" id="helpBody">${tab==="guide"?guide():glossary(q)}</div>
      <div class="hfoot"><button type="button" id="helpTut">${inRun()?"Replay the tutorial":"Show the tutorial next run"}</button><span id="helpTutN" role="status"></span></div></div>`;
    ov.querySelector("#help-x").addEventListener("click",close);
    ov.querySelectorAll(".htabs button").forEach(b=>b.addEventListener("click",()=>{tab=b.dataset.t;render();const f=ov.querySelector(tab==="glos"?"#helpQ":".htabs [aria-selected=true]");if(f)f.focus({preventScroll:true});}));
    const qi=ov.querySelector("#helpQ");if(qi){qi.value=q;qi.addEventListener("input",()=>{ov.querySelector("#helpList").innerHTML=glossRows(qi.value);});}
    ov.querySelector("#helpTut").addEventListener("click",tutorial);}
  const guide=()=>HG.map(([h,id,b],i)=>`<details class="hsec"${i===0?" open":""} id="hg-${id}"><summary>${h}</summary><div class="hsb">${b}</div></details>`).join("");
  const glossRows=q=>{const k=q.trim().toLowerCase(),rows=GL.filter(([t,d])=>!k||t.toLowerCase().includes(k)||d.toLowerCase().includes(k));
    return rows.length?rows.map(([t,d])=>`<div class="hterm"><dt>${escHTML(t)}</dt><dd>${escHTML(d)}</dd></div>`).join(""):`<p class="hnone">No terms match “${escHTML(q)}”.</p>`;};
  const glossary=q=>`<input type="search" id="helpQ" class="hq" placeholder="Filter terms" aria-label="Filter the glossary" autocomplete="off"><dl class="hgl" id="helpList">${glossRows(q)}</dl>`;
  // a run is going (or paused behind the menu) and the 3D mill is there to tour
  const inRun=()=>!!(S&&!S.zen&&!S.over&&((S.season&&S.season.on)||S.free)&&!G3.first&&!document.body.classList.contains("titleon"));
  function tutorial(){const n=ov.querySelector("#helpTutN");
    if(inRun()&&G3.tut){close();const m=document.getElementById("v2menu");if(m&&!m.hidden&&G3.play)G3.play();setTimeout(()=>G3.tut.open(),80);return;}
    try{localStorage.setItem("paper-mill-tutorial","on");}catch(e){}const ts=document.getElementById("tsTut");if(ts)ts.checked=true;
    if(n)n.textContent="The tutorial will show when your next season or survival run starts.";}
  let held=false;
  function open(){if(!ov){ov=document.createElement("div");ov.className="overlay helpov";ov.id="helpOv";ov.hidden=true;document.body.appendChild(ov);
      ov.addEventListener("click",e=>{if(e.target===ov)close();});ov.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();close();}});}
    held=running;running=false;tab="guide";render();ov.hidden=false;ov.querySelector(".htabs [aria-selected=true]").focus({preventScroll:true});}
  function close(){if(!ov)return;ov.hidden=true;const m=document.getElementById("v2menu");if(held&&!(m&&!m.hidden))running=true;held=false;}
  G3.helpOpen=open;G3.helpClose=close;
  // the pause menu tile
  {const b=document.getElementById("v2help");if(b)b.addEventListener("click",open);}
  // the title screen: a ? beside the settings cog
  {const cog=document.getElementById("tCog");if(cog){const b=document.createElement("button");b.className="tround";b.id="tHelp";b.type="button";b.setAttribute("aria-label","Help");
      b.innerHTML=`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.3a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.5-2.7 4"/><path d="M12 17.3v.2"/></svg>`;
      const wrap=document.createElement("span");wrap.className="tleft";cog.parentNode.insertBefore(wrap,cog);wrap.appendChild(cog);wrap.appendChild(b);b.addEventListener("click",open);}}
}
