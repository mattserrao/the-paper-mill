/* ---------- event cards: offers the player can accept or decline (v2.2.0) ---------- */
// one card about every 1.5 game days, never two at once; the sim pauses while a card is open.
// odds are shown honestly and shift with upgrades and how the mill is running. Seeded per season week.
function repRate(){let r=1;for(const f of (S.fx||[]))if(f.rep)r*=f.rep;return r;}
function deal(v){S.cash+=v;S.ledger.deals+=v;}
function addFx(f){S.fx.push(f);S.M=mods();}
function pend(id,left,fn){S.cards.pend.push({id,left,fn});}
function pending(id){return S.cards.pend.some(p=>p.id===id)||S.fx.some(f=>f.id===id);}
function effNow(){return S.tot.pot>0?S.tot.prodT/S.tot.pot:0.9;}
function qualNow(){return S.q.made>0?1-S.q.off/S.q.made:1;}
function cardBanner(text,good){BANNERS.push({text,t:null,kind:good?"good":undefined});while(BANNERS.length>3)BANNERS.splice(1,1);log(text,good?"ok":"bad");}
const CARDS=[
 {id:"hot",area:"Sales · Paper machine",title:"Hot order",
  story:()=>"A box plant lost its supplier. They need 900 t of 33HT within 30 hours and will pay $90/t over list.",
  win:()=>"+$81k premium if all 900 t are made on time",lose:()=>"Every ton short costs $40",
  odds:()=>clamp(Math.round(50+(effNow()-0.87)*300),10,95),why:"Depends on how well the machine runs: breaks and downtime cost tons.",
  ok:()=>!S.plan.hot,
  accept(){S.plan.q.unshift({g:"33HT",t:900,i:3});S.plan.left=0;S.plan.hot={made:0};
    pend("hot",30*60,()=>{const m=Math.min(900,S.plan.hot.made);S.plan.hot=null;
      if(m>=900-1e-6){deal(81000);cardBanner("Hot order delivered: 900 t of 33HT on time. +$81k premium.",true);}
      else{const sh=900-m;deal(-sh*40);cardBanner(`Hot order short by ${Math.round(sh)} t: ${money(sh*40)} penalty.`,false);}});
    return "33HT jumps to the front of the queue. Delivery due in 30 hours.";}},
 {id:"chem",area:"Stock prep · Paper machine",title:"Chemical trial",
  story:()=>"A vendor offers a free 3-day trial of a new strength additive.",
  win:()=>"Chemical costs drop $12/t for good",lose:()=>"Deposits: scabs 3× as likely and 1.5× sheet breaks during the trial",
  odds:()=>Math.min(95,65+10*LV("monitor")),why:"Fabric & felt monitoring catches deposits early.",
  ok:()=>!pending("chem")&&S.perk.chem<36,
  accept(c){const w=rand("card")*100<c.o;if(!w)addFx({id:"chem",left:3*1440,mods:{breakMul:1.5},scab:3});
    pend("chem",3*1440,()=>{if(w){S.perk.chem+=12;applyUpgrades();cardBanner("Chemical trial worked: chemicals now $12/t cheaper.",true);}
      else cardBanner("Chemical trial failed: the additive left deposits. Back to the old recipe.",false);});
    return "Trial running for 3 days.";}},
 {id:"eng",area:"Paper machine",title:"Process engineer idea",
  story:()=>"Your process engineer has a new steam profile that could lift 30m speed by 120 fpm. Engineering time costs $60k.",
  win:()=>"+120 fpm on 30m, permanently",lose:()=>"$60k spent and sheet breaks 2× for a day",
  odds:()=>Math.min(95,70+10*LV("rcfa")),why:"Root cause analysis (RCFA) makes trials safer.",
  ok:()=>!pending("eng")&&(S.perk.sp["30m"]||0)<360,
  accept(c){deal(-60000);const w=rand("card")*100<c.o;if(!w)addFx({id:"eng",left:1440,mods:{breakMul:2}});
    pend("eng",1440,()=>{if(w){S.perk.sp["30m"]=(S.perk.sp["30m"]||0)+120;cardBanner("Engineer's steam profile works: 30m runs 120 fpm faster.",true);}
      else cardBanner("Engineer's trial didn't hold up: back to the old steam profile.",false);});
    return "Trial running for a day. $60k spent.";}},
 {id:"cheap",area:"Inbound",title:"Cheap OCC",
  story:()=>"A broker has 600 t of OCC at $45/t under your price. It arrives over the next shift.",
  win:()=>"Saves about $27k on fiber",lose:()=>"It's junk: yield drops 20% and sheet breaks double for about 12 hours",
  odds:()=>Math.min(95,65+20*LV("detrash")),why:"Detrashing automation copes with dirty bales.",
  ok:()=>!S.plan.disc&&!pending("cheap")&&!active("badocc"),
  accept(c){S.plan.disc={t:600,v:45};const w=rand("card")*100<c.o;
    pend("cheap",6*60,()=>{if(w)cardBanner("Cheap OCC checks out: clean bales, about $27k saved.",true);
      else{trigger("badocc");cardBanner("The cheap OCC was junk: wax, plastic and wet bales in the pulper.",false);}});
    return "600 t on the way at $45/t off.";}},
 {id:"grid",area:"Paper machine · Utility",title:"Demand response",
  story:()=>"The power utility will pay $35k to cut the machine to 70% speed for 4 hours.",
  win:()=>"+$35k, back to full speed in 4 hours",lose:()=>"The grid event runs 8 hours at 70%, same payment",
  odds:()=>85,why:"Set by the utility.",
  ok:()=>!pending("grid"),
  accept(c){deal(35000);const w=rand("card")*100<c.o;addFx({id:"grid",left:(w?4:8)*60,mods:{speedCap:0.7}});
    pend("grid",(w?4:8)*60,()=>cardBanner(w?"Demand response over: full speed again.":"Demand response ran 8 hours. Full speed again.",w));
    return "+$35k paid. Machine capped at 70% speed.";}},
 {id:"outage",area:"Maintenance",title:"Contractor outage slot",
  story:()=>"A contractor crew is free for an 8-hour planned shutdown. $80k.",
  win:()=>"Machine and stock prep breakdowns halved for 7 days",lose:()=>"The job overruns: 12 hours down instead of 8",
  odds:()=>Math.min(95,80+10*LV("stores")),why:"A stocked spare parts storeroom keeps jobs on time.",
  ok:()=>!pending("outage")&&!pending("care"),
  accept(c){deal(-80000);const w=rand("card")*100<c.o,h=w?8:12;addFx({id:"outage",left:h*60,mods:{pmDown:"planned outage"}});
    pend("outage",h*60,()=>{addFx({id:"care",left:7*1440,freq:0.5});cardBanner(w?"Planned outage finished on time. Breakdowns halved for 7 days.":"Planned outage overran by 4 hours. Breakdowns halved for 7 days.",w);});
    return "$80k spent. Machine down for planned work.";}},
 {id:"audit",area:"Quality",title:"Customer audit",
  story:()=>"Your biggest 33HT customer will audit your quality for the next 3 days. They want 99% on-spec paper.",
  win:()=>"+$15/t on 33HT for the rest of the game",lose:()=>"−$10/t on 33HT for 7 days",
  odds:()=>clamp(Math.round(70+(qualNow()-0.99)*2000),10,95),why:"Passes if 99% of paper made is on spec: dye trouble and grade changes cost quality.",
  ok:()=>!pending("audit")&&(S.perk.price["33HT"]||0)<45,
  accept(){const m0=S.q.made,o0=S.q.off;
    pend("audit",3*1440,()=>{const m=S.q.made-m0,q=m>0?1-(S.q.off-o0)/m:0;
      if(q>=0.99){S.perk.price["33HT"]=(S.perk.price["33HT"]||0)+15;cardBanner(`Customer audit passed at ${(q*100).toFixed(1)}% on spec: +$15/t on 33HT.`,true);}
      else{addFx({id:"auditfail",left:7*1440,price:{"33HT":-10}});cardBanner(`Customer audit failed at ${(q*100).toFixed(1)}% on spec: −$10/t on 33HT for 7 days.`,false);}});
    return "Audit running for 3 days.";}},
 {id:"seconds",area:"Outbound",title:"Seconds buyer",
  story:()=>`A broker will buy the ${Math.round(S.q.bank)} t of off-spec paper you sent to the beater for $150/t, cash now.`,
  win:()=>`+${money(S.q.bank*150)} now`,lose:()=>"The broker resells it as prime: −$5/t on all paper for 3 days",
  odds:()=>80,why:"Fixed odds.",
  ok:()=>S.q.bank>=20&&!pending("seconds"),
  accept(c){const v=S.q.bank*150;deal(v);S.q.bank=0;const w=rand("card")*100<c.o;
    if(!w)addFx({id:"seconds",left:3*1440,price:{all:-5}});
    pend("seconds",w?1:3*1440,()=>{if(!w)cardBanner("Seconds resold as prime: prices back to normal.",true);});
    return w?`${money(v)} paid. Clean deal.`:`${money(v)} paid, but customers found prime-labeled seconds: −$5/t for 3 days.`;}},
 {id:"intern",area:"Paper machine",title:"Intern project",
  story:()=>"Your summer intern has a plan to retune the 23m speed profile. It costs nothing to try.",
  win:()=>"+60 fpm on 23m, permanently",lose:()=>"The intern trips the machine: 2 hours down",
  odds:()=>75,why:"Fixed odds.",
  ok:()=>!pending("intern")&&(S.perk.sp["23m"]||0)<180,
  accept(c){const w=rand("card")*100<c.o;
    pend("intern",12*60,()=>{if(w){S.perk.sp["23m"]=(S.perk.sp["23m"]||0)+60;cardBanner("The intern's speed profile works: 23m runs 60 fpm faster.",true);}
      else{addFx({id:"intern",left:120,mods:{pmDown:"intern tripped the machine"}});cardBanner("The intern tripped the machine: 2 hours down.",false);}});
    return "Intern trial running for 12 hours.";}},
 {id:"traps",area:"Energy",title:"Steam trap survey",
  story:()=>"A contractor will survey every steam trap in the dryer section for $25k.",
  win:()=>"Energy costs drop $6/t, permanently",lose:()=>"The survey finds nothing worth fixing",
  odds:()=>Math.min(95,65+10*LV("apc")),why:"Advanced process control makes the losses easier to find.",
  ok:()=>!pending("traps")&&S.perk.energy<18,
  accept(c){deal(-25000);const w=rand("card")*100<c.o;
    pend("traps",2*1440,()=>{if(w){S.perk.energy+=6;cardBanner("Steam trap survey paid off: energy $6/t cheaper.",true);}else cardBanner("Steam trap survey found nothing worth fixing.",false);});
    return "$25k spent. Survey results in 2 days.";}},
 {id:"wdrive",area:"Winder",title:"Used winder drive",
  story:()=>"A closing mill is selling a spare winder drive for $150k, half the new price.",
  win:()=>"+15 t/h winder capacity, permanently",lose:()=>"Wrong spec: $150k lost and the winder is down 3 hours",
  odds:()=>80,why:"Fixed odds.",
  ok:()=>!pending("wdrive")&&!S.perk.winder&&S.cash>300000,
  accept(c){deal(-150000);const w=rand("card")*100<c.o;
    pend("wdrive",6*60,()=>{if(w){S.perk.winder=15;applyUpgrades();cardBanner("Used winder drive installed: +15 t/h winder capacity.",true);}
      else{addFx({id:"wdrive",left:180,mods:{winderDown:1}});cardBanner("The used winder drive was the wrong spec: winder down 3 hours.",false);}});
    return "$150k paid. Installing over the next 6 hours.";}},
 {id:"ot",area:"Maintenance",title:"Weekend overtime crew",
  story:()=>"Your maintenance crew offers to work through the weekend on double time: $30k.",
  win:()=>"Repairs finish 40% faster for 3 days",lose:()=>"Fatigue: sheet breaks 1.5× for 3 days",
  odds:()=>75,why:"Fixed odds.",
  ok:()=>!pending("ot"),
  accept(c){deal(-30000);const w=rand("card")*100<c.o;
    addFx(w?{id:"ot",left:3*1440,rep:1/0.6}:{id:"ot",left:3*1440,mods:{breakMul:1.5}});
    pend("ot",3*1440,()=>cardBanner("Weekend overtime is over: crews back to normal shifts.",true));
    return w?"$30k paid. Repairs run 40% faster for 3 days.":"$30k paid, but the crew is worn out: sheet breaks 1.5× for 3 days.";}},
 {id:"feltv",area:"Paper machine",title:"Felt vendor trial",
  story:()=>"A new clothing vendor offers a free press felt to win your business.",
  win:()=>"Felt failures halved for 14 days",lose:()=>"The felt blows within a day: a felt change",
  odds:()=>Math.min(95,70+10*LV("reliab")),why:"The reliability program checks the felt before it goes on.",
  ok:()=>!pending("feltv")&&!active("felt"),
  accept(c){const w=rand("card")*100<c.o;
    if(w){addFx({id:"feltv",left:14*1440,evf:{felt:0.5}});return "New felt on: felt failures halved for 14 days.";}
    pend("feltv",(6+rand("card")*18)*60,()=>{trigger("felt");cardBanner("The trial felt blew: crew pulling a new one.",false);});
    return "New felt on. Fingers crossed.";}},
 {id:"drone",area:"Maintenance",title:"Drone inspection",
  story:()=>"An inspection firm will fly a thermal drone through the dryer hood and drive line for $20k.",
  win:()=>"Dryer fires and driveshaft failures 70% rarer for 10 days",lose:()=>"Nothing found: $20k for a nice video",
  odds:()=>60,why:"Fixed odds.",
  ok:()=>!pending("drone"),
  accept(c){deal(-20000);const w=rand("card")*100<c.o;
    pend("drone",4*60,()=>{if(w){addFx({id:"drone",left:10*1440,evf:{dryerfire:0.3,shaft:0.3}});cardBanner("Drone found hot spots and a worn coupling: fixed before they failed.",true);}
      else cardBanner("Drone inspection found nothing.",false);});
    return "$20k spent. Results in 4 hours.";}},
 {id:"spot",area:"Sales · Warehouse",title:"Spot market sale",
  story:()=>`A spot buyer will take 500 t of ${C.grade} from your warehouse right now at $35/t over list.`,
  win:()=>`+${money(500*(priceOf(C.grade)+35))} for 500 t`,lose:()=>"The buyer rejects 20% as damaged: those 100 t go at the $150/t seconds price",
  odds:()=>70,why:"Fixed odds.",
  ok:()=>S.fg*C.rollW.v>=500&&!pending("spot"),
  accept(c){const w=rand("card")*100<c.o,n=500/C.rollW.v,p=priceOf(C.grade)+35;S.fg=Math.max(0,S.fg-n);S.shipT+=500;S.tot.shipped+=n;
    const v=w?500*p:400*p+100*150;earn(v);pend("spot",1,()=>{});
    return w?`500 t shipped for ${money(v)}.`:`400 t accepted, 100 t rejected and sold as seconds: ${money(v)} in total.`;}},
 {id:"rail",area:"Inbound",title:"Railcar of OCC",
  story:()=>"A broker can send a railcar of 900 t of OCC at $30/t under your price. Unloading it ties up a receiving door for about 18 hours.",
  win:()=>"Saves about $27k on fiber",lose:()=>"The car arrives late: $20k demurrage",
  odds:()=>75,why:"Fixed odds.",
  ok:()=>!pending("rail")&&S.yard<P.yardCap-900,
  accept(c){const w=rand("card")*100<c.o;
    addFx({id:"rail",left:1e9,rail:900,mods:{recvMul:0.67},done:()=>{if(!w)deal(-20000);cardBanner(w?"Railcar unloaded: 900 t of OCC at $30/t off.":"Railcar unloaded, but it came in late: $20k demurrage.",w);}});
    return "Railcar spotted at the bale yard. Unloading at about 50 t/h.";}},

 // ---- v2.8.0 cards ----
 {id:"safety",area:"Safety · Mill-wide",title:"Safety blitz",
  story:()=>"Your safety manager wants $15k for a two-day housekeeping and lockout blitz before the state inspector visits.",
  win:()=>"Clean visit: forklift and dock incidents half as likely for 10 days",lose:()=>"Inspector finds a lockout gap: machine down 3 hours",
  odds:()=>Math.min(95,70+15*LV("safety")),why:"The safety program upgrade means most of the work is already done.",
  ok:()=>true,
  accept(c){deal(-15000);const w=rand("card")*100<c.o;
    pend("safety",2*1440,()=>{if(w){addFx({id:"safety",left:10*1440,evf:{fleet:0.5,fight:0.5,calloff:0.5}});cardBanner("Inspector signed off clean. Yard incidents halved for 10 days.",true);}
      else{addFx({id:"safetyx",left:180,mods:{pmDown:"lockout correction"}});cardBanner("Inspector found a lockout gap: machine down 3 hours to fix it.",false);}});
    return "$15k spent. Inspector arrives in 2 days.";}},
 {id:"shift",area:"Crew",title:"New shift rotation",
  story:()=>"The crew wants to trial a 12-hour rotating schedule for a week. It costs nothing.",
  win:()=>"Rested crews: repairs 25% faster for 7 days",lose:()=>"Confusion over the roster: a crew call-off",
  odds:()=>70,why:"Fixed odds.",
  ok:()=>!active("calloff"),
  accept(c){const w=rand("card")*100<c.o;
    if(w){addFx({id:"shift",left:7*1440,rep:1.25});return "New rotation starts tonight: repairs 25% faster for 7 days.";}
    pend("shift",(4+rand("card")*12)*60,()=>{trigger("calloff");cardBanner("The new roster mixed up the crews: call-offs on nights.",false);});
    return "New rotation starts tonight.";}},
 {id:"insfire",area:"Insurance",title:"Insurer's fire challenge",
  story:()=>"Your insurer will rebate $45k if the mill goes 5 days without a dryer or bale fire.",
  win:()=>"+$45k rebate",lose:()=>"Any fire in 5 days: a $15k surcharge",
  odds:()=>Math.min(95,75+10*LV("reliab")+10*LV("monitor")),why:"Depends on fire breakdowns: reliability and monitoring upgrades help.",
  ok:()=>true,
  accept(){const e=S.evc||(S.evc={}),f0=(e.dryerfire||0)+(e.balefire||0);
    pend("insfire",5*1440,()=>{const f=(e.dryerfire||0)+(e.balefire||0)-f0;
      if(f<=0){deal(45000);cardBanner("Five days without a fire: +$45k insurance rebate.",true);}else{deal(-15000);cardBanner("A fire broke out during the challenge: $15k surcharge.",false);}});
    return "Challenge runs 5 days.";}},
 {id:"drought",area:"Utility · Water",title:"Drought restriction",
  story:()=>"The river authority will pay $30k if you cut fresh water use for 2 days. Less shower water means a slower machine.",
  win:()=>"+$30k, machine capped at 85% speed for 2 days",lose:()=>"Recirculated water builds slime: scabs 3× as likely for the 2 days",
  odds:()=>Math.min(95,65+15*LV("monitor")),why:"Fabric & felt monitoring keeps an eye on deposits.",
  ok:()=>true,
  accept(c){deal(30000);const w=rand("card")*100<c.o;addFx(w?{id:"drought",left:2*1440,mods:{speedCap:0.85}}:{id:"drought",left:2*1440,mods:{speedCap:0.85},scab:3});
    pend("drought",2*1440,()=>cardBanner("Water restriction lifted: full speed again.",true));
    return w?"+$30k paid. Machine at 85% speed for 2 days.":"+$30k paid. Machine at 85% speed, and the white water is getting slimy.";}},
 {id:"grant",area:"Management",title:"Recycling grant",
  story:()=>"The state has a fiber-recovery grant. A consultant will write the application for $40k.",
  win:()=>"+$120k grant in 3 days",lose:()=>"Application rejected: $40k gone",
  odds:()=>Math.min(90,40+15*LV("detrash")+10*LV("apc")),why:"Grants favour mills with modern detrashing and process control.",
  ok:()=>S.cash>80000,
  accept(c){deal(-40000);const w=rand("card")*100<c.o;
    pend("grant",3*1440,()=>{if(w){deal(120000);cardBanner("Recycling grant approved: +$120k.",true);}else cardBanner("Recycling grant rejected.",false);});
    return "$40k paid. Decision in 3 days.";}},
 {id:"hedge",area:"Energy",title:"Power price hedge",
  story:()=>"A trader offers to lock your power price for 14 days for a $20k fee.",
  win:()=>"Energy $10/t cheaper for 14 days",lose:()=>"Power prices fall anyway: the $20k fee buys nothing",
  odds:()=>60,why:"Nobody knows where the power market goes.",
  ok:()=>true,
  accept(c){deal(-20000);const w=rand("card")*100<c.o;
    if(!w){pend("hedge",1440,()=>cardBanner("Power prices fell: the hedge was worth nothing.",false));return "$20k paid.";}
    S.perk.energy+=10;pend("hedge",14*1440,()=>{S.perk.energy-=10;cardBanner("Power hedge expired: energy back to market price.",true);});
    return "$20k paid. Energy $10/t cheaper for 14 days.";}},
 {id:"strike",area:"Sales",title:"Competitor strike",
  story:()=>"A competing mill's crew walked out. Their customers want your paper at $40/t over list on every grade.",
  win:()=>"+$40/t on everything for 5 days",lose:()=>"The strike settles after a day and the buyers squeeze you: −$10/t for 3 days",
  odds:()=>65,why:"Depends on the union talks, not you.",
  ok:()=>true,
  accept(c){const w=rand("card")*100<c.o;
    if(w){addFx({id:"strike",left:5*1440,price:{all:40}});pend("strike",5*1440,()=>cardBanner("The strike is over: prices back to list.",true));return "+$40/t on all grades for 5 days.";}
    addFx({id:"strike",left:1440,price:{all:40}});
    pend("strike",1440,()=>{addFx({id:"strikex",left:3*1440,price:{all:-10}});cardBanner("The strike settled: buyers squeeze you −$10/t for 3 days.",false);});
    return "+$40/t on all grades while the strike lasts.";}},
 {id:"yard",area:"Inbound · Bale yard",title:"Bale yard cleanup",
  story:()=>"A contractor will sweep and re-stack the bale yard for $12k.",
  win:()=>"Bale fires and yard fleet trouble 70% rarer for 10 days",lose:()=>"The crew finds a smouldering bale: a bale fire",
  odds:()=>80,why:"Fixed odds.",
  ok:()=>!active("balefire"),
  accept(c){deal(-12000);const w=rand("card")*100<c.o;
    pend("yard",8*60,()=>{if(w){addFx({id:"yard",left:10*1440,evf:{balefire:0.3,fleet:0.3}});cardBanner("Bale yard swept and re-stacked: fire and fleet risk way down for 10 days.",true);}
      else{trigger("balefire");cardBanner("Cleanup crew found a smouldering bale!",false);}});
    return "$12k spent. Cleanup over the next 8 hours.";}},
 {id:"occlock",area:"Inbound",title:"OCC price lock",
  story:()=>"A broker offers to lock your next 2,000 t of OCC at $15/t under today's price.",
  win:()=>"Saves about $30k on fiber",lose:()=>"OCC prices crash next week: you pay $10/t over market on those 2,000 t",
  odds:()=>60,why:"Fiber markets are a coin toss with a small edge.",
  ok:()=>!S.plan.disc,
  accept(c){const w=rand("card")*100<c.o;S.plan.disc={t:2000,v:w?15:-10};
    return w?"Locked: the next 2,000 t of OCC come in $15/t cheaper.":"Locked in... and then the market fell. The next 2,000 t cost $10/t over market.";}},
 {id:"film",area:"Outbound",title:"New roll wrap film",
  story:()=>"A packaging vendor has a tougher stretch film. Fewer damage claims could lift what customers pay. Changeover costs $25k.",
  win:()=>"+$5/t on every grade, permanently",lose:()=>"The film jams the wrapper: winder down 4 hours",
  odds:()=>75,why:"Fixed odds.",
  ok:()=>true,
  accept(c){deal(-25000);const w=rand("card")*100<c.o;
    pend("film",12*60,()=>{if(w){for(const g of Object.keys(ECON.price))S.perk.price[g]=(S.perk.price[g]||0)+5;cardBanner("New wrap film cut damage claims: +$5/t on every grade.",true);}
      else{addFx({id:"film",left:240,mods:{winderDown:1}});cardBanner("The new film jammed the wrapper: winder down 4 hours.",false);}});
    return "$25k paid. Changeover over 12 hours.";}},
 {id:"rotor",area:"Stock prep",title:"Pulper rotor rebuild",
  story:()=>"The vendor has a rebuild crew free today: $35k and 4 hours with the pulper off. The stock chest has to carry the machine.",
  win:()=>"Ragger and pulper plugs 60% rarer for 14 days",lose:()=>"The rebuild overruns: 8 hours with no pulper",
  odds:()=>Math.min(95,75+10*LV("stores")),why:"A stocked spare parts storeroom keeps jobs on time.",
  ok:()=>S.tank>0.6*P.tankCap&&!active("pulper")&&!active("ragger"),
  accept(c){deal(-35000);const w=rand("card")*100<c.o,h=w?4:8;addFx({id:"rotor",left:h*60,mods:{pulperDown:true}});
    pend("rotor",h*60,()=>{addFx({id:"rotorok",left:14*1440,evf:{ragger:0.4,lcplug:0.4,hdblow:0.4}});cardBanner(w?"Pulper rotor rebuilt on time: plugs 60% rarer for 14 days.":"Pulper rebuild overran to 8 hours, but it's done: plugs 60% rarer for 14 days.",w);});
    return "$35k spent. Pulper off while the rotor is rebuilt.";}},
 {id:"basket",area:"Stock prep",title:"Screen basket trial",
  story:()=>"A vendor offers a free slotted screen basket to trial in your coarse and fine screens.",
  win:()=>"Screen failures halved for 14 days",lose:()=>"The basket cracks: a fine screen failure",
  odds:()=>70,why:"Fixed odds.",
  ok:()=>!active("fscreen")&&!active("cscreen"),
  accept(c){const w=rand("card")*100<c.o;
    if(w){addFx({id:"basket",left:14*1440,evf:{cscreen:0.5,fscreen:0.5}});return "Trial basket in: screen failures halved for 14 days.";}
    pend("basket",(6+rand("card")*18)*60,()=>{trigger("fscreen");cardBanner("The trial basket cracked: fine screen down.",false);});
    return "Trial basket in.";}},
 {id:"vip",area:"Sales · Paper machine",title:"VIP customer tour",
  story:()=>"A big 23m buyer wants to tour the mill tomorrow. Catering and a fresh coat of paint: $8k.",
  win:()=>"+$10/t on 23m, permanently",lose:()=>"They see a sheet break: −$8/t on 23m for 5 days",
  odds:()=>clamp(Math.round(55+(effNow()-0.87)*300),10,95),why:"Depends on how well the machine is running.",
  ok:()=>true,
  accept(c){deal(-8000);const w=rand("card")*100<c.o;
    pend("vip",1440,()=>{if(w){S.perk.price["23m"]=(S.perk.price["23m"]||0)+10;cardBanner("The VIP tour went great: +$10/t on 23m.",true);}
      else{addFx({id:"vipx",left:5*1440,price:{"23m":-8}});cardBanner("The VIPs watched a sheet break: −$8/t on 23m for 5 days.",false);}});
    return "$8k spent. Tour tomorrow.";}},
 {id:"millwright",area:"Maintenance",title:"Retired millwright",
  story:()=>"A legendary retired millwright will coach your crew for a week. $20k.",
  win:()=>"Repairs 35% faster for 7 days",lose:()=>"He and your foreman clash: nothing changes",
  odds:()=>75,why:"Fixed odds.",
  ok:()=>true,
  accept(c){deal(-20000);const w=rand("card")*100<c.o;
    if(w){addFx({id:"millwright",left:7*1440,rep:1.35});return "$20k paid. Repairs 35% faster for 7 days.";}
    pend("millwright",1440,()=>cardBanner("The millwright went home early after a row with the foreman.",false));return "$20k paid.";}},
 {id:"tax",area:"Management",title:"Property tax appeal",
  story:()=>"A lawyer thinks the county over-assessed the mill. The appeal costs $10k.",
  win:()=>"+$60k refund",lose:()=>"Appeal denied: $10k gone",
  odds:()=>40,why:"Fixed odds.",
  ok:()=>true,
  accept(c){deal(-10000);const w=rand("card")*100<c.o;
    pend("tax",4*1440,()=>{if(w){deal(60000);cardBanner("Tax appeal won: +$60k refund.",true);}else cardBanner("Tax appeal denied.",false);});
    return "$10k paid. Ruling in 4 days.";}},
 {id:"backhaul",area:"Outbound",title:"Backhaul freight deal",
  story:()=>"A carrier offers backhaul rates on your outbound loads. Lower freight means a better net price.",
  win:()=>"+$6/t on every grade for 10 days",lose:()=>"Their trucks don't show: no outbound trucks for 6 hours",
  odds:()=>70,why:"Fixed odds.",
  ok:()=>true,
  accept(c){const w=rand("card")*100<c.o;
    if(w){addFx({id:"backhaul",left:10*1440,price:{all:6}});return "+$6/t on every grade for 10 days.";}
    addFx({id:"backhaul",left:6*60,mods:{noOut:true}});pend("backhaul",6*60,()=>cardBanner("Outbound trucks are back on schedule.",true));
    return "The carrier's trucks didn't show: no shipping for 6 hours.";}},
 {id:"starch",area:"Paper machine",title:"Surface starch upgrade",
  story:()=>"A starch supplier says a new size-press recipe will lift 33HT strength. $50k for the trial.",
  win:()=>"+$12/t on 33HT, permanently",lose:()=>"Starch picking: sheet breaks 1.5× for 2 days",
  odds:()=>Math.min(95,65+10*LV("apc")),why:"Advanced process control holds the size press steady.",
  ok:()=>S.cash>100000,
  accept(c){deal(-50000);const w=rand("card")*100<c.o;if(!w)addFx({id:"starch",left:2*1440,mods:{breakMul:1.5}});
    pend("starch",2*1440,()=>{if(w){S.perk.price["33HT"]=(S.perk.price["33HT"]||0)+12;cardBanner("New starch recipe works: +$12/t on 33HT.",true);}else cardBanner("Starch trial over: back to the old recipe.",false);});
    return "$50k spent. Trial runs 2 days.";}},
 {id:"scrap",area:"Yard",title:"Scrap metal buyer",
  story:()=>"A scrap dealer will haul away the old rolls and motors in the boneyard for $25k cash.",
  win:()=>"+$25k now",lose:()=>"Their crane truck blocks the docks for 3 hours",
  odds:()=>80,why:"Fixed odds.",
  ok:()=>true,
  accept(c){deal(25000);const w=rand("card")*100<c.o;
    if(w)return "+$25k. The boneyard is clear.";
    addFx({id:"scrap",left:180,mods:{docksClosed:true}});pend("scrap",180,()=>cardBanner("Scrap truck gone: docks open again.",true));
    return "+$25k, but their crane truck is blocking the docks for 3 hours.";}},
 {id:"boilertune",area:"Energy · Boiler",title:"Boiler tune-up",
  story:()=>"A combustion specialist will tune the boiler burners for $30k.",
  win:()=>"Energy $4/t cheaper for good, boiler trips halved for 14 days",lose:()=>"The boiler trips during tuning",
  odds:()=>Math.min(95,70+10*LV("apc")),why:"Advanced process control makes tuning safer.",
  ok:()=>!active("boiler"),
  accept(c){deal(-30000);const w=rand("card")*100<c.o;
    pend("boilertune",6*60,()=>{if(w){S.perk.energy+=4;addFx({id:"boilertune",left:14*1440,evf:{boiler:0.5}});cardBanner("Boiler tuned: energy $4/t cheaper, trips halved for 14 days.",true);}
      else{trigger("boiler");cardBanner("The boiler tripped during tuning!",false);}});
    return "$30k paid. Tuning over 6 hours.";}},
 {id:"apprent",area:"Crew · Paper machine",title:"Apprentice operators",
  story:()=>"The local college offers two trained apprentices for two weeks, free.",
  win:()=>"Extra hands: sheet breaks 20% rarer for 14 days",lose:()=>"Green operators: sheet breaks 1.3× for 5 days",
  odds:()=>65,why:"Fixed odds.",
  ok:()=>true,
  accept(c){const w=rand("card")*100<c.o;
    addFx(w?{id:"apprent",left:14*1440,mods:{breakMul:0.8}}:{id:"apprent",left:5*1440,mods:{breakMul:1.3}});
    return w?"Apprentices are a help: sheet breaks 20% rarer for 14 days.":"Apprentices are still learning: sheet breaks 1.3× for 5 days.";}},
];
function cardTick(dt){const cs=S.cards;if(!cs)return;
  for(const f of S.fx){f.left-=dt;if(f.rail>0){const u=Math.min(f.rail,50*dt/60,Math.max(0,P.yardCap-S.yard));S.yard+=u;S.tot.inTons+=u;spend(u*Math.max(0,P.occPrice-30),"occ");f.rail-=u;if(f.rail<=1e-6){f.left=0;f.done&&f.done();}}}
  if(S.fx.some(f=>f.left<=0)){S.fx=S.fx.filter(f=>f.left>0);}
  // due callbacks are removed before they run, so one can never fire twice (or forever, if it throws)
  const due=cs.pend.filter(p=>(p.left-=dt)<=0);cs.pend=cs.pend.filter(p=>p.left>0);
  for(const p of due){try{p.fn();}catch(e){console.error("card error",p.id,e);}}
  if(cs.open||S.zen||S.over||(S.season&&S.season.done)||S.t<cs.next||outOn())return;
  cs.next=S.t+1440*(1.2+0.6*rand("card"));
  // every card is shown at most once per game: once dealt it is marked seen and never drawn again
  const seen=cs.seen||(cs.seen={}),pool=CARDS.filter(c=>!seen[c.id]&&c.ok()),pick=pool.length?pool[Math.floor(rand("card")*pool.length)]:null;
  if(pick&&typeof document!=="undefined"&&document.body){seen[pick.id]=true;openCard(pick);}}
let cardEl=null;
function openCard(c){const o=c.odds();S.cards.open={c,o};running=false;
  if(!cardEl){cardEl=document.createElement("div");cardEl.className="overlay";cardEl.id="dealOv";cardEl.hidden=true;document.body.appendChild(cardEl);}
  const t=s=>String(s).replace(/[&<>]/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[x]));
  cardEl.innerHTML=`<div class="modal deal" role="dialog" aria-modal="true" aria-labelledby="deal-h"><span class="dk">${t(c.area)} · sim paused</span>
    <h2 id="deal-h">${t(c.title)}</h2><p>${t(c.story())}</p>
    <div class="doc"><b class="w">Win</b><span>${t(c.win())}</span><b class="l">Risk</b><span>${t(c.lose())}</span></div>
    <div><div class="dodds"><span>Chance it works</span><b>${o}%</b></div><div class="dbar"><i style="width:${o}%"></i></div><p style="font-size:12.5px;margin-top:4px">${t(c.why)}</p></div>
    <div id="deal-res" class="dres" hidden></div>
    <div class="btns" id="deal-btns"><button id="deal-no">Decline</button><button id="deal-yes" class="primary">Accept</button></div></div>`;
  cardEl.classList.remove("dealres");clearTimeout(cardEl._t);cardEl.hidden=false;AUDIO.sfx("cash",150);
  // one click: the decision resumes play straight away; the outcome stays on screen for 2 s (no backdrop, game running), then fades
  const done=msg=>{const r=document.getElementById("deal-res");r.textContent=msg;r.hidden=false;
    document.getElementById("deal-btns").innerHTML='<div class="dtimer"><i></i></div>';
    closeCard(true);cardEl.classList.add("dealres");cardEl.hidden=false;clearTimeout(cardEl._t);
    const m=cardEl.querySelector(".modal");setTimeout(()=>m.addEventListener("click",()=>{cardEl.hidden=true;cardEl.classList.remove("dealres");},{once:true}),0);
    cardEl._t=setTimeout(()=>{cardEl.hidden=true;cardEl.classList.remove("dealres");},2000);};
  document.getElementById("deal-no").addEventListener("click",()=>{log(`Declined: ${c.title}`,"");closeCard();});
  document.getElementById("deal-yes").addEventListener("click",()=>{const msg=c.accept({o});log(`Accepted: ${c.title} (${o}% chance). ${msg}`,"warn");S.M=mods();done(msg);});
  document.getElementById("deal-yes").focus();}
function closeCard(keep){if(cardEl&&!keep)cardEl.hidden=true;S.cards.open=null;const menuOpen=document.getElementById("v2menu");
  if(menuOpen&&!menuOpen.hidden)return;running=true;}
