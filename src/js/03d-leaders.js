/* ---------- v4.4 survival mode: mill leaders (numbers and effects; the cards, picker and dialogs are in 09c) ----------
   A survival run has one mill leader, picked when the run starts. Each is strong on one side of the mill and costs
   something on another. At every planned outage the leader makes one pick (Dot has none: her fix recharges instead),
   which takes effect when the outage ends. Picks stack and STAY WITH THE MILL, together with the cost that came with
   each one (Chip's pay settlements, Felicity's project staff). A leader's own trait (the while-in-charge drawback, Dot's
   fix) is only there while that leader is in charge. Tuned with tools/survival.py so that each leader is worth a few days
   over a run with none, and none is far ahead of the others (SURVIVAL-MODE.md has the table).
   The leader can be changed once per run, in an outage budget dialog; the new one takes over when that outage starts.

   State: S.lead={id, st:{fibre,sales,speed,clean,pstock,pwet,pdry}, changed, was, fixW, fixed:[ids]} (saved with the run).
   No leader (a season, free play, a run started by a tool without one): every helper below returns exactly 1 or 0. */
const LEAD={
  fibre:0.015,           // Chip, fibre contract: fibre cost -1.5% per deal
  sales:5,               // Chip, sales push: +$5/t on every grade per deal
  strife0:2,             // Chip, labour relations: call-offs and dock brawls x2 while he is in charge
  wage:0.05,             // Chip, pay settlements: wages +5% with every deal (they stay with the deals)
  bills:1.10,            // Dot, gold-plates every job: repair bills +10% (Fix it now gives that one bill back, and that breakdown never returns)
  proj:0.08,             // Felicity, a project: that area's breakdowns -8%, and the area runs better:
  pyield:0.015,          //   stock prep: better yield, fibre -1.5%
  pwetB:0.08,pwetE:0.01, //   wet end: sheet breaks -8%, a drier sheet off the presses (energy -1%)
  pdryE:0.025,           //   dry end: steam, energy -2.5%
  payroll:40,            // Felicity, project staff: $/h per project (rises with the wave's cost multiplier, like wages)
  speed:70,              // Hank, push for tons: fpm of top speed per pick
  clean:0.15,            // Hank, run it clean: sheet breaks and hayouts -15% per pick
  hot0:0.04,             // Hank, runs it hot: energy +4% while he is in charge
  heavy:0.01};           // Hank, runs the sheet heavy: fibre +1% while he is in charge
const LEAD_IDS=["chip","dot","fel","hank"];
// what each leader picks at an outage: [stack key, button label, what it does]
const LEAD_PICKS={
  chip:[["fibre","Fibre contract",()=>`fibre −${pct1(LEAD.fibre)}%`],["sales","Sales push",()=>`+$${LEAD.sales}/t on every grade`]],
  dot:[],
  fel:[["pstock","Stock prep",()=>`fibre −${pct1(LEAD.pyield)}%`],["pwet","Wet end",()=>`sheet breaks −${pct1(LEAD.pwetB)}%`],["pdry","Dry end",()=>`energy −${pct1(LEAD.pdryE)}%`]],
  hank:[["speed","Push for tons",()=>`+${LEAD.speed} fpm top speed`],["clean","Run it clean",()=>`breaks and hayouts −${pct1(LEAD.clean)}%`]]};
const pct1=v=>+(v*100).toFixed(1);   // 0.015 -> 1.5 (labels)
const leadIs=id=>!!(S&&S.lead&&S.lead.id===id);
const leadN=k=>(S&&S.lead&&S.lead.st[k])||0;
const leadDeals=()=>leadN("fibre")+leadN("sales"),leadProjects=()=>leadN("pstock")+leadN("pwet")+leadN("pdry");
// --- effects (read by applyUpgrades, energyCost, the labour line, freqMul and the outage dialog) ---
const leadFibre=()=>S&&S.lead?Math.pow(1-LEAD.fibre,leadN("fibre"))*Math.pow(1-LEAD.pyield,leadN("pstock"))*(leadIs("hank")?1+LEAD.heavy:1):1;
const leadPrice=()=>LEAD.sales*leadN("sales");
const leadSpeed=()=>LEAD.speed*leadN("speed");
const leadClean=()=>Math.pow(1-LEAD.clean,leadN("clean"));                 // sheet breaks and hayouts (Hank)
const leadBreaks=()=>Math.pow(1-LEAD.pwetB,leadN("pwet"));                 // sheet breaks only (Felicity's wet-end projects)
const leadEnergy=()=>S&&S.lead?(leadIs("hank")?1+LEAD.hot0:1)*Math.pow(1-LEAD.pdryE,leadN("pdry"))*Math.pow(1-LEAD.pwetE,leadN("pwet")):1;
const leadBill=()=>leadIs("dot")?LEAD.bills:1;
const leadPayroll=()=>LEAD.payroll*leadProjects();
const leadStrife=()=>leadIs("chip")?LEAD.strife0:1;
const leadWage=()=>Math.pow(1+LEAD.wage,leadDeals());
const leadArea=a=>Math.pow(1-LEAD.proj,leadN("p"+a));
// a breakdown Dot fixed on the spot is fixed for good: it never comes back (the list stays with the mill)
const leadImmune=id=>!!(S&&S.lead&&S.lead.fixed&&S.lead.fixed.includes(id));
function leadFreq(id){if(!(S&&S.lead))return 1;if(leadImmune(id))return 0;
  let m=1;if(id==="calloff"||id==="fight")m*=leadStrife();if(OUT.area[id])m*=leadArea(OUT.area[id]);return m;}
