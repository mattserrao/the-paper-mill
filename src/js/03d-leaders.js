/* ---------- v4.4 survival mode: mill leaders (numbers and effects; the cards, picker and dialogs are in 09c) ----------
   A survival run has one mill leader, picked when the run starts. Each is strong on one side of the mill and costs
   something on another. At every planned outage the leader makes one pick (Dot has none: her fix recharges instead),
   which takes effect when the outage ends. Picks stack and STAY WITH THE MILL, together with the cost that came with
   each one (Chip's pay settlements, Felicity's project staff). A leader's own trait (the while-in-charge drawback, Dot's
   fix) is only there while that leader is in charge. Tuned with tools/survival.py so that each leader is worth a few days
   over a run with none, and none is far ahead of the others (SURVIVAL-MODE.md has the table).
   The leader can be changed once per run, in an outage budget dialog; the new one takes over when that outage starts.

   State: S.lead={id, st:{fibre,sales,rethread,clean,pstock,pwet,pdry}, changed, was, fixW, fixed:[ids], lockW} (saved with the run).
   No leader (a season, free play, a run started by a tool without one): every helper below returns exactly 1 or 0. */
// v4.4.0-t3 redesign: each leader takes on one survival pressure, with a cost the player can see
//   Chip: rising costs (a fibre price lock or a sales push)  ·  Dot: breakdowns  ·  Hank: sheet breaks and hayouts  ·  Felicity: the bottleneck
const LEAD={
  sales:7,               // Chip, sales push: +$/t on every grade per push (stays with the mill)
  lock:1,                // Chip, fibre lock: the next wave's fibre is bought at the wave before's price (1 = the whole step)
  strife0:2,             // Chip, labour relations: call-offs and dock brawls x2 while he is in charge
  wage:0.05,             // Chip, pay settlements: wages +5% with every deal (they stay with the deals)
  fixCut:0.5,            // Dot, Fix it now: ends a breakdown, returns part of its bill, and that breakdown is 50% rarer from then on (stacks)
  refund:0.6,            // Dot, Fix it now: share of that breakdown's repair bill she gets back
  rep:0.10,              // Dot, a good millwright: repair jobs 10% quicker while she is in charge
  bills:1.15,            // Dot, gold-plates every job: repair bills +15% while she is in charge
  cap:0.065,             // Felicity, a project: +6.5% capacity in one area (fibre line, paper machine or finishing), stays with the mill
  overrun:20,            // Felicity, project tie-ins: every outage overruns 20 min per project done so far (machine down)
  rethread:0.20,         // Hank, runnability: time lost to sheet breaks and hayouts -20% per pick...
  clean:0.15,            //   ...and sheet breaks and hayouts -15% per pick
  steam:0.055,           // Hank, dial in the dryers: energy -5.5% per pick (stays with the mill)
  heavy:0.02};           // Hank, runs the sheet heavy (basis-weight giveaway): fibre +2% while he is in charge
const LEAD_IDS=["chip","dot","fel","hank"];
// what each leader picks at an outage: [stack key, button label, what it does]  (keys kept from v4.4.0-t1 so saves still load)
const LEAD_PICKS={
  chip:[["fibre","Fibre lock",()=>"next wave's fibre at this wave's price"],["sales","Sales push",()=>`+$${LEAD.sales}/t on every grade`]],
  dot:[],
  fel:[["pstock","Fibre line",()=>`receiving, pulper, screens +${pct1(LEAD.cap)}%`],["pwet","Paper machine",()=>`machine +${pct1(LEAD.cap)}%`],["pdry","Finishing",()=>`winder and shipping +${pct1(LEAD.cap)}%`]],
  hank:[["rethread","Runnability",()=>`breaks −${pct1(LEAD.clean)}%, rethreads −${pct1(LEAD.rethread)}% time`],["clean","Dial in the dryers",()=>`energy −${pct1(LEAD.steam)}%`]]};
const pct1=v=>+(v*100).toFixed(1);   // 0.015 -> 1.5 (labels)
const leadIs=id=>!!(S&&S.lead&&S.lead.id===id);
const leadN=k=>(S&&S.lead&&S.lead.st[k])||0;
const leadDeals=()=>leadN("fibre")+leadN("sales"),leadProjects=()=>leadN("pstock")+leadN("pwet")+leadN("pdry");
// --- effects (read by applyUpgrades, energyCost, the labour line, freqMul, repairs, breaks and the outage) ---
const leadLock=()=>S&&S.lead&&S.lead.lockW&&S.lead.lockW===survWave()&&survWave()>1?Math.pow(survCost(survWave()-1)/survCost(survWave()),LEAD.lock):1;
const leadFibre=()=>S&&S.lead?leadLock()*(leadIs("hank")?1+LEAD.heavy:1):1;
const leadPrice=()=>LEAD.sales*leadN("sales");
const leadSpeed=()=>0;                                                     // (v4.4.0-t1's push for tons is gone)
const leadClean=()=>Math.pow(1-LEAD.clean,leadN("rethread"));              // sheet breaks and hayouts (Hank's runnability)
const leadBreaks=()=>1;
const leadRethread=()=>1/Math.pow(1-LEAD.rethread,leadN("rethread"));      // how fast break and hayout time runs down (Hank)
const leadEnergy=()=>Math.pow(1-LEAD.steam,leadN("clean"));               // Hank's dryer tuning (key "clean" kept for saves)
const leadBill=()=>leadIs("dot")?LEAD.bills:1;
const leadRep=()=>leadIs("dot")?1/(1-LEAD.rep):1;                           // repair speed (Dot)
const leadPayroll=()=>0;
const leadStrife=()=>leadIs("chip")?LEAD.strife0:1;
const leadWage=()=>Math.pow(1+LEAD.wage,leadDeals());
const leadCap=k=>1+LEAD.cap*leadN(k);                                       // Felicity's capacity (pstock fibre line, pwet machine, pdry finishing)
const leadOverrun=()=>LEAD.overrun*leadProjects();
const leadArea=()=>1;
// a breakdown Dot fixed is fixed at the root: half as likely from then on, and again for each time she fixes it
const leadFixN=id=>S&&S.lead&&S.lead.fixed?S.lead.fixed.filter(x=>x===id).length:0;
const leadImmune=()=>false;
function leadFreq(id){if(!(S&&S.lead))return 1;
  let m=Math.pow(1-LEAD.fixCut,leadFixN(id));if(id==="calloff"||id==="fight")m*=leadStrife();return m;}
