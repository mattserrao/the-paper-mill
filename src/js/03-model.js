// seeded random streams (plan, cards) so every player in the same season week sees the same market and the same cards
function rand(k){const r=S.rng;r[k]=(r[k]+0x6D2B79F5)|0;let t=r[k];t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
const P={truckLoad:220,doors:3,driverRate:30,doorRate:450,yieldF:0.88,tankCap:300,yardCap:2000,yardTarget:800,
  fgCap:225,fgTarget:40,convCap:3,jumbo:100,storeReels:4,rollsPerReel:8,loaderRate:9,truckRolls:20,doorRolls:112.5,shipDoors:3,
  K:34.8/(GRADES["24"].sp*GRADES["24"].bw),minSpeed:1200,ramp:150,pmLoss:0.98,maxQueue:8};
const UNITS={inRate:v=>v.toFixed(1)+" trucks/h",drivers:v=>Math.round(v)+" drivers",pulper:v=>v.toFixed(1)+" t/h",
  lvlTarget:v=>Math.round(v)+" %",lowLevel:v=>Math.round(v)+" %",pmSp:v=>Math.round(v).toLocaleString()+" fpm",
  rollW:v=>v.toFixed(1)+" t",wdr:v=>Math.round(v)+" t/h",loaders:v=>Math.round(v)+" loaders",outRate:v=>v.toFixed(1)+" trucks/h"};
const AUTOKEYS=["inRate","drivers","pulper","pmSp","wdr","loaders","outRate"];

let C,S;
const BASE={...P};
const ECON={price:{"24":658,"28":679,"31":697,"34Super":760},   /* (v6.11.0-t2 balance: +2.5% on every grade, for the trim) */   /* (v6.5 balance: -$15/t, inactive play is punished most) */   // (v6.5: +$30/t: outbound freight is its own cost now, FR; b2: less what the cheaper OCC and energy save per ton, ~$82-84, and $4 for paper made but not yet sold; measured on 12 hands-off seasons)
  energy:68,   // (b2: was 95; a recycled mill buying its power, 2026 prices)
  chem:25,wage:45,robot:15,overhead:2400,start:2e6,bankrupt:-1.5e6};
const REPAIR={syphon:30e3,rotortrip:20e3,oscfail:12e3,couchpit:25e3,birdline:200e3,refclash:140e3,steamjoint:90e3,fogfan:35e3,shaft:250e3,dryerfire:400e3,fabric:90e3,felt:45e3,slime:30e3,ragger:15e3,overflow:120e3,chestover:60e3,lwplug:25e3,cscreen:45e3,fscreen:60e3,lcplug:30e3,hdblow:55e3,boiler:60e3,permit:120e3,thkblow:70e3,birdhay:0,wrap:15e3,dye:20e3,flares:0,winderdown:40e3,runner:0,badocc:0,balefire:150e3,fleet:40e3,calloff:10e3,fight:5e3,roof:80e3,highway:0,lightning:200e3,tornado:500e3,beaver:25e3,icedintake:20e3,brownout:10e3,duststorm:25e3,flood:60e3};
const UGROUPS=[["machine","Paper machine"],["stock","Stock prep"],["yard","Warehouse & logistics"],["maint","Maintenance"],["mgmt","Management"]];
const MAINT=["birdline","steamjoint","fogfan","shaft","fabric","felt","winderdown","hdblow","lwplug","cscreen","fscreen","lcplug","boiler","thkblow","ragger","overflow","fleet","roof","lightning","icedintake"];
// v4.1 v19: prices reset after the payback review (most upgrades now pay back within days, not months)
// t20 balance: the capacity and maintenance upgrades re-priced (40-60% cheaper) so they can pay back inside a season
// v6.9.2 balance: every upgrade 30% dearer (rounded to $5k) so the daily Round is the biggest boost; missed failures 20% dearer (REPAIR_K); overhead $2,400/h (was $3,400) so most mills still profit
const REPAIR_K=1.05;   // (v6.11.2 t6 QA: was 1.2; repair bills 12.5% lower, hands-off paid ~$3.4M a season)
const UPS=[
 {id:"drive",ck:0.75,g:"machine",name:"Drive & gearbox rebuild",lv:[115e3,105e3,90e3],desc:"+150 fpm max speed per level, if the dryers can keep up (heavy grades and a wet sheet reach their limit first)."},   // (v6.5 b5: 25% cheaper: the dryer limit can cap it)
 {id:"deckle",ck:0.75,g:"machine",name:"Wider trim (deckle)",lv:[160e3,135e3],desc:"+3\" of web per level (+1.5% tons at the same speed) and rolls up to 1.5\" wider, so wide rolls cost less trim."},
 {id:"steambox",ck:0.75,g:"machine",name:"Steam box",lv:[165e3],desc:"A 12-zone steam box at the end of the forming table: +1.5 points couch solids and +40 fpm, and the CD loop can dry out wet streaks and wet edges (costs some steam)."},
 {id:"shoe",ck:0.75,g:"machine",name:"Shoe press",lv:[180e3],desc:"+100 fpm and 12% less energy per ton. A drier sheet into the dryers: about 16% more drying headroom."},
 {id:"winder",ck:0.75,g:"machine",name:"Winder rebuild",lv:[285e3,520e3],desc:"+30 t/h winder speed and 40% fewer hayouts per level."},
 {id:"monitor",g:"machine",name:"Fabric & felt monitoring",lv:[220e3,150e3],desc:"Machine failures 40% rarer and fewer sheet breaks, per level."},
 {id:"refiner",g:"machine",name:"Refiner power upgrade",lv:[145e3],desc:"Bigger motors and drives (+30% rating) and new plates on the twin refiners between the stock chest and the machine chest. Stronger bonding: $10/t less energy and chemicals."},
 {id:"heatrec",g:"machine",name:"Hood heat recovery",lv:[30e3],desc:"An air-to-air exchanger on the dryer hood's exhaust preheats the supply air: the supply air coils use 55% less steam, about 6.6% off the dryers' steam bill."},   // (v6.13, 07m: priced to pay back in about a third of a season)
 {id:"fire",g:"machine",name:"Fire suppression",lv:[115e3],desc:"Dryer and bale yard fires 60% rarer and half as long."},
 {id:"pulper",g:"stock",name:"Pulper rotor upgrade",lv:[325e3,585e3],desc:"+25 t/h pulper capacity per level."},
 {id:"clean",g:"stock",name:"Screens & cleaners",lv:[80e3,80e3],desc:"+3 points of pulper yield and 40% fewer screen and cleaner breakdowns per level. Adds a second row of LC cleaners."},
 {id:"chest",g:"stock",name:"Bigger stock chest",lv:[130e3,260e3],desc:"+150 t of chest storage per level."},
 {id:"detrash",g:"stock",name:"Detrashing automation",lv:[40e3],desc:"Ragger and overflow upsets 60% rarer. Junk OCC hurts half as much."},
 {id:"feedconv",g:"stock",name:"Automatic bale feed",lv:[40e3],desc:"The conveyor feeds itself. Drivers only unload trucks."},
 {id:"forklift",g:"yard",name:"Electric forklift fleet",lv:[195e3,390e3],desc:"+25% tons per driver-hour per level. Red-tag outages rarer."},
 {id:"docks",g:"yard",name:"Extra dock doors",lv:[235e3,455e3],desc:"+1 receiving and +1 shipping door per level."},
 {id:"agv",g:"yard",name:"Robotic roll handling",lv:[390e3,715e3,1040e3],desc:"+2 robot loaders per level. $15/h each, never call off."},
 {id:"wh",g:"yard",name:"Warehouse extension",lv:[195e3,390e3],desc:"+112 rolls (1,400 t) of storage per level."},
 {id:"safety",g:"yard",name:"Safety & HR program",lv:[15e3],desc:"Dock fights and call-offs half as often."},
 {id:"maintcrew",g:"maint",name:"Maintenance techs",lv:[130e3,235e3,340e3],desc:"+2 techs on yellow scooters per level. Repairs finish 20% faster and repair bills are 10% lower per level (in-house work instead of contractors). Every tech also does a vibration round each shift when not called to an upset."},
 {id:"rcfa",g:"maint",name:"Root cause analysis (RCFA)",lv:[200e3,100e3],desc:"Every breakdown is investigated: repeat failures 25% rarer per level."},
 {id:"reliab",g:"maint",name:"Reliability program",lv:[255e3,160e3],desc:"Vibration and oil analysis: drive, felt and fabric failures 40% rarer and repair bills 15% lower per level. Level 1 adds the Area Trend Report to your daily rounds. Covers the new bearing and motor failures too."},
 {id:"pmprog",g:"maint",name:"Preventive maintenance",lv:[115e3,235e3,365e3],desc:"Planned shutdown work: all breakdowns 20% rarer and fewer sheet breaks per level. Costs $150/h per level."},
 {id:"stores",g:"maint",name:"Spare parts storeroom",lv:[45e3],desc:"Parts on the shelf: repairs finish 25% faster."},
 {id:"apc",ck:0.75,g:"mgmt",name:"Advanced process control",lv:[105e3,105e3],desc:"+2% tons and 4% less energy per level."},
 {id:"contract",g:"mgmt",name:"Long-term OCC contract",lv:[155e3,155e3],desc:"OCC costs $10/t less per level."},
 {id:"sales",g:"mgmt",name:"Sales team",lv:[155e3,155e3],desc:"Paper sells for $12/t more per level."},
 {id:"insure",g:"mgmt",name:"Insurance policy",lv:[195e3],desc:"Repair bills cut 60%. Premium $900/h."},
];
const UP=Object.fromEntries(UPS.map(u=>[u.id,u]));
const LV=id=>(S&&S.up&&S.up[id])||0;
function applyUpgrades(){
  applyGrade();
  P.K=BASE.K*(1+3/205*LV("deckle"))*   /* (v6.11: the deckle widens the web 3" a level, 07j; was +6%) */(1+0.02*LV("apc"))*leadCap("pwet")*civSpeed();   // (v5.1: civics, Machinery)
  P.spBonus=150*LV("drive")+100*LV("shoe")+40*LV("steambox");   /* (v6.11: steam box) */
  P.energyMul=(1-0.12*LV("shoe"))*(1-0.04*LV("apc"));P.refSave=10*LV("refiner");   /* (v6.5 balance: apc 8%, refiner $22: per-ton upgrades paid back 3-4x in a season) */
  P.yieldF=P.blendY+0.03*LV("clean"); P.tankCap=BASE.tankCap+150*LV("chest");
  P.driverRate=BASE.driverRate*(1+0.25*LV("forklift")); P.doors=3+LV("docks"); P.shipDoors=3+LV("docks");
  P.robots=2*LV("agv"); P.fgCap=BASE.fgCap+112*LV("wh"); P.autoFeed=LV("feedconv")>0;
  applySite();{const a=leadCap("pstock"),f=leadCap("pdry");P.doorRate*=a;P.pulperMax*=a;P.screenMax*=a;P.winderMax*=f;P.doorRolls*=f;}   // v4.4.0-t3: Felicity's projects
  P.doorRate*=civRecv();   // v5.1 civics: a low Community limits truck hours
  P.costMul=survOn()?survCost():1;   // v4.3 survival: fiber, energy and chemicals, and wages cost more every wave (exactly 1 otherwise)
  P.occPrice=(P.blendP+((S&&S.plan)?leadMkt(S.plan.mkt):0)-10*LV("contract")+P.siteOcc)*P.costMul*leadFibre();   // (v4.4: the leader's fiber deals; Hank runs heavy)
  P.priceAdd=12*LV("sales")+P.sitePrice+leadPrice()+civPrice(); P.repairMul=REPAIR_K*(LV("insure")?0.4:1)*(1-0.15*LV("reliab"))*(1-0.1*LV("maintcrew"))*leadBill()*civBill();P.techs=2+2*LV("maintcrew");P.elec=1;P.pmCost=150*LV("pmprog"); P.premium=LV("insure")?900:0;   // (t20 balance: $400/h and $1,500/h)
  P.breakBase=Math.pow(0.7,LV("monitor"))*Math.pow(0.9,LV("pmprog"))*leadClean()*civBreak();
  P.hayBase=Math.pow(0.6,LV("winder"))*leadClean()*civBreak();
  // the sliders' limits follow the upgrades (v5.2: written only when they change; this runs hourly from the sim)
  const lim=(id,v)=>{const e=document.getElementById(id),t=String(v);if(e&&e.max!==t)e.max=t;};
  lim("s-wdr",P.winderMax);lim("s-pmSp",3300+P.spBonus);lim("s-pulper",Math.floor(Math.min(P.pulperMax,P.screenMax/P.yieldF)));
}
// the OCC blend, energy, chemicals and break rate follow the grade on the machine
function applyGrade(){const g=(typeof C!=="undefined"&&C&&C.grade)||"24",c=GCOST[g],d=c.dlk;
  P.blendP=OCCG.occ11.p*(1-d)+OCCG.dlk.p*d;P.blendY=OCCG.occ11.y*(1-d)+OCCG.dlk.y*d;
  P.steamMul=c.steam;P.chemAdd=c.chem-((S&&S.perk)?S.perk.chem:0);P.gradeBrk=c.brk;}
// v6.11.2: the bill per ton is now steam and chemicals (plus the site's and civics' adjustments): ECON.energy's steam share
// (PF_STEAMSH). Electricity is metered from the drives and the balance of plant every step (07i pwrTick), so energyCost()
// (what a ton costs now, for the screens) adds the metered $/t at today's rate.
function energyCostT(){return Math.max(0,ECON.energy*PF_STEAMSH*P.steamMul*P.energyMul*leadEnergy()+ECON.chem+P.chemAdd+(P.siteEnergy||0)-(P.refSave||0)-((S&&S.perk&&S.perk.energy)||0)+civEnergy())*(P.costMul||1);}
function energyCost(){return energyCostT()+pwrT();}
/* ---- v6.5 freight: inbound haul per ton of bales unloaded, outbound freight per ton shipped. Each = (base + site) x the
   diesel share of a truck rate (26%; diesel a weekly seeded walk, $2.40-6.80/gal, b2) x weather (normalised so the site's average weather is 1) x detours (flood,
   dust storm), plus card and civics effects (fx.fr, $/t on outbound). Survival's cost multiplier and the leader's fiber factor
   apply to the haul. */
const FR={inBase:18,outBase:30,outK:1.065,fuelSh:0.26,dieselBase:4.0,wx:{clear:1,rain:1.03,fog:1.05,snow:1.15},ev:{flood:1.25,duststorm:1.2}};
const fuelIdx=()=>(S&&S.fuel)||1;   // diesel against normal ($4.00/gal = 1)
const frFuel=()=>1-FR.fuelSh+FR.fuelSh*fuelIdx();   // what diesel does to a truck rate: fuel is ~26% of it (DAT, Sep 2026)
function frWx(){const w=P.siteWx||[0.55,0.75,0.87],E=w[0]+(w[1]-w[0])*FR.wx.rain+(w[2]-w[1])*FR.wx.fog+(1-w[2])*FR.wx.snow;return (FR.wx[(S&&S.wx)||"clear"]||1)/E;}
function frEv(){let m=1;if(S&&S.inc)for(const i of S.inc)if(FR.ev[i.id])m=Math.max(m,FR.ev[i.id]);return m;}
function frFx(){let v=0;if(S&&S.fx)for(const f of S.fx)if(f.fr)v+=f.fr;return v;}
function frInRate(){return Math.max(0,(FR.inBase+(P.siteHaul||0))*frFuel()*frWx()*frEv())*(P.costMul||1)*leadFibre();}   // (the leader's fiber factor, as when the haul was in the OCC price)
function frOutRate(){return Math.max(0,(FR.outBase+(P.siteFreight||0))*FR.outK*frFuel()*frWx()*frEv()+frFx());}
// (outK: trucks ship less in snow and fog, when the rate is highest, so the shipped average ran ~6% under the base; measured on 12 hands-off seasons)
// the diesel index moves once a game week: a walk that is a fixed function of the run's seed and the week, so the 14
// prior days (weeks -2 and -1, 11c) lead into the run's own weeks, and seasons replay identically (no stream is drawn)
function fuelAt(seed,wk){let x=1;for(let w=-3;w<=wk;w++){let h=Math.imul((seed>>>0)^Math.imul(w+101,0x9e3779b1),0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;
  x=clamp(1+(x-1)*0.7+((h>>>0)/4294967296-0.5)*0.5,0.6,1.7);}return x;}   // (b2: diesel itself, $2.40-6.80/gal; it rose 68% in the year to Sep 2026)
function fuelTick(){const wk=Math.floor(S.t/10080)+(S.fuelOff||0);if(S.fuelW===wk)return;S.fuelW=wk;S.fuel=fuelAt(S.fuelSeed!=null?S.fuelSeed:S.seed,wk);}
function priceOf(g){let v=ECON.price[g]+P.priceAdd;if(g==="34Super"&&P.costMul>1)v+=(ECON.price["34Super"]-ECON.price["24"])*(P.costMul-1);/* v5.0.5: survival only (costMul is 1 elsewhere) */if(S&&S.perk)v+=S.perk.price[g]||0;if(S&&S.fx)for(const f of S.fx)if(f.price)v+=(f.price[g]||0)+(f.price.all||0);return v;}
// (v5.2: the id lists are Sets built once; freqMul runs for every upset on every sim step)
const FM_CLEAN=new Set(["lwplug","cscreen","fscreen","lcplug"]),FM_REL=new Set(["shaft","felt","fabric"]),FM_MON=new Set(["shaft","fabric","felt","dryerfire","slime"]);let FM_MAINT=null;
function freqMul(id){let m=1;const MS=FM_MAINT||(FM_MAINT=new Set(MAINT));
  if(FM_CLEAN.has(id))m*=Math.pow(0.6,LV("clean"));
  if(MS.has(id))m*=Math.pow(0.75,LV("rcfa"))*Math.pow(0.8,LV("pmprog"));
  if(FM_REL.has(id))m*=Math.pow(0.6,LV("reliab"));
  if(FM_MON.has(id))m*=Math.pow(0.6,LV("monitor"));
  if(id==="dryerfire"||id==="balefire")m*=LV("fire")?0.4:1;
  if(id==="ragger"||id==="overflow")m*=LV("detrash")?0.4:1;
  if(id==="fleet")m*=Math.pow(0.6,LV("forklift"));
  if(id==="fight"||id==="calloff")m*=LV("safety")?0.5:1;
  if(OUT.area[id])m*=outRel(OUT.area[id]);
  m*=siteFreq(id);
  m*=chemFreq(id);   // v6.11.1 spare dry-strength starch feeds slime (07l)
  m*=shFreq(id);   // v6.13 soft reels tie together at the winder; a flooded can wraps (07n)
  m*=civFreq(id);   // v5.1 civics: each choice's odds, and the meters
  m*=rlyLinkMul(id);   // v6.10: the upsets tied to an asset's bearings wear with them (07i)
  m*=leadFreq(id);   // v4.4 survival leaders: Chip's labour trouble, Felicity's projects, the upset Dot just fixed
  if(S&&S.fx)for(const f of S.fx){if(f.freq&&EV[id]&&(EV[id].g==="machine"||EV[id].g==="stock"))m*=f.freq;if(f.scab&&id==="slime")m*=f.scab;if(f.evf&&f.evf[id])m*=f.evf[id];}
  return m;}
// v3.3.3: reliability of an outage area = 1 / its average breakdown rate, split into upgrades, outage budget and temporary events
function areaRel(a){const ids=OUT.ev[a]||[];if(!ids.length)return {tot:1,up:1,out:1,fx:1,site:1,lead:1};let up=0,fx=0,st=0;const out=outRel(a),ld=1;
  ids.forEach(id=>{let f=1;if(S&&S.fx)for(const x of S.fx){if(x.freq&&EV[id]&&(EV[id].g==="machine"||EV[id].g==="stock"))f*=x.freq;if(x.scab&&id==="slime")f*=x.scab;if(x.evf&&x.evf[id])f*=x.evf[id];}
    const sf=siteFreq(id);fx+=f;st+=sf;up+=freqMul(id)/(out*f*sf*ld);});
  up/=ids.length;fx/=ids.length;st/=ids.length;return {tot:1/(up*out*fx*st*ld),up:1/up,out:1/out,fx:1/fx,site:1/st,lead:1/ld};}
function durMul(id){let d=(id==="dryerfire"||id==="balefire")&&LV("fire")?0.5:1;if(MAINT.includes(id))d*=Math.pow(0.8,LV("maintcrew"))*(LV("stores")?0.75:1);return d;}
function spend(v,k){if(S.free&&k==="upgrades")return;S.cash-=v;S.ledger[k]+=v;}
function earn(v){S.cash+=v;S.ledger.rev+=v;}
function moneyX(v){const a=Math.abs(v);return `${v<0?"−":""}$${Math.round(a).toLocaleString()}`;}   // (exact, for prices on buttons)
function money(v){const a=Math.abs(v),sg=v<0?"−":"";return a>=1e6?`${sg}$${(a/1e6).toFixed(2)}M`:a>=1e4?`${sg}$${Math.round(a/1e3)}k`:`${sg}$${Math.round(a).toLocaleString()}`;}
function inY(d){const n=P.doors;return n<=3?[130,185,240][d]:118+d*150/(n-1);}
function outY(d){const n=P.shipDoors;return n<=3?[500,555,610][d]:495+d*120/(n-1);}
const CH={on:true,lvl:1,en:{}};
let NAME="PM1"; try{NAME=localStorage.getItem("mill-twin-name")||"PM1";}catch(e){}
const BANNERS=[];
const GROUPS=[["machine","Paper machine"],["stock","Stock prep"],["yard","Warehouse & trucks"],["god","Acts of nature"]];
