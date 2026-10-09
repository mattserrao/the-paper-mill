// seeded random streams (plan, cards) so every player in the same season week sees the same market and the same cards
function rand(k){const r=S.rng;r[k]=(r[k]+0x6D2B79F5)|0;let t=r[k];t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
const P={truckLoad:220,doors:3,driverRate:30,doorRate:450,yieldF:0.88,tankCap:300,yardCap:2000,yardTarget:800,
  fgCap:225,fgTarget:40,convCap:3,jumbo:100,storeReels:1,rollsPerReel:8,loaderRate:9,truckRolls:20,doorRolls:112.5,shipDoors:3,
  K:34.8/(2736*24.55),minSpeed:1200,ramp:150,pmLoss:0.98,maxQueue:8};
const UNITS={inRate:v=>v.toFixed(1)+" trucks/h",drivers:v=>Math.round(v)+" drivers",pulper:v=>v.toFixed(1)+" t/h",
  lvlTarget:v=>Math.round(v)+" %",lowLevel:v=>Math.round(v)+" %",pmSp:v=>Math.round(v).toLocaleString()+" fpm",
  rollW:v=>v.toFixed(1)+" t",wdr:v=>Math.round(v)+" t/h",loaders:v=>Math.round(v)+" loaders",outRate:v=>v.toFixed(1)+" trucks/h"};
const AUTOKEYS=["inRate","drivers","pulper","pmSp","wdr","loaders","outRate"];

let C,S;
const BASE={...P};
const ECON={price:{"23m":714,"26m":734,"30m":754,"33HT":814},energy:95,chem:25,wage:45,robot:15,overhead:3400,start:2e6,bankrupt:-1.5e6,goal:25e6};
const REPAIR={refclash:140e3,steamjoint:90e3,fogfan:35e3,shaft:250e3,dryerfire:400e3,fabric:90e3,felt:45e3,slime:30e3,ragger:15e3,overflow:120e3,chestover:60e3,lwplug:25e3,cscreen:45e3,fscreen:60e3,lcplug:30e3,hdblow:55e3,boiler:60e3,permit:120e3,thkblow:70e3,birdhay:0,wrap:15e3,dye:20e3,flares:0,winderdown:40e3,runner:0,badocc:0,balefire:150e3,fleet:40e3,calloff:10e3,fight:5e3,roof:80e3,highway:0,lightning:200e3,tornado:500e3,beaver:25e3};
const UGROUPS=[["machine","Paper machine"],["stock","Stock prep"],["yard","Warehouse & logistics"],["maint","Maintenance"],["mgmt","Management"]];
const MAINT=["steamjoint","fogfan","shaft","fabric","felt","winderdown","hdblow","lwplug","cscreen","fscreen","lcplug","boiler","thkblow","ragger","overflow","fleet","roof","lightning"];
const UPS=[
 {id:"drive",g:"machine",name:"Drive & gearbox rebuild",lv:[400e3,900e3,1.8e6],desc:"+150 fpm max speed per level."},
 {id:"deckle",g:"machine",name:"Wider trim (deckle)",lv:[1.2e6,2.5e6],desc:"+6% tons at the same speed per level."},
 {id:"shoe",g:"machine",name:"Shoe press",lv:[3e6],desc:"+100 fpm and 12% less energy per ton."},
 {id:"winder",g:"machine",name:"Winder rebuild",lv:[450e3,1e6],desc:"+30 t/h winder speed and 40% fewer hayouts per level."},
 {id:"monitor",g:"machine",name:"Fabric & felt monitoring",lv:[350e3,800e3],desc:"Machine failures 40% rarer and fewer sheet breaks, per level."},
 {id:"refiner",g:"machine",name:"Refiner power upgrade",lv:[900e3],desc:"Bigger motors and new plates on the twin refiners between the chest and the headbox. Stronger bonding: $22/t less energy and chemicals."},
 {id:"fire",g:"machine",name:"Fire suppression",lv:[500e3],desc:"Dryer and bale yard fires 60% rarer and half as long."},
 {id:"pulper",g:"stock",name:"Pulper rotor upgrade",lv:[600e3,1.4e6],desc:"+25 t/h pulper capacity per level."},
 {id:"clean",g:"stock",name:"Screens & cleaners",lv:[450e3,1e6],desc:"+3 points of pulper yield and 40% fewer screen and cleaner breakdowns per level. Adds a second row of LC cleaners."},
 {id:"chest",g:"stock",name:"Bigger stock chest",lv:[300e3,700e3],desc:"+150 t of chest storage per level."},
 {id:"detrash",g:"stock",name:"Detrashing automation",lv:[400e3],desc:"Ragger and overflow incidents 60% rarer. Junk OCC hurts half as much."},
 {id:"feedconv",g:"stock",name:"Automatic bale feed",lv:[900e3],desc:"The conveyor feeds itself. Drivers only unload trucks."},
 {id:"forklift",g:"yard",name:"Electric forklift fleet",lv:[350e3,750e3],desc:"+25% tons per driver-hour per level. Red-tag outages rarer."},
 {id:"docks",g:"yard",name:"Extra dock doors",lv:[250e3,600e3],desc:"+1 receiving and +1 shipping door per level."},
 {id:"agv",g:"yard",name:"Robotic roll handling",lv:[800e3,1.6e6,3e6],desc:"+2 robot loaders per level. $15/h each, never call off."},
 {id:"wh",g:"yard",name:"Warehouse extension",lv:[500e3,1.1e6],desc:"+112 rolls (1,400 t) of storage per level."},
 {id:"safety",g:"yard",name:"Safety & HR program",lv:[200e3],desc:"Dock fights and call-offs half as often."},
 {id:"maintcrew",g:"maint",name:"Maintenance techs",lv:[250e3,500e3,900e3],desc:"+2 techs on yellow scooters per level. Repairs finish 20% faster per level."},
 {id:"rcfa",g:"maint",name:"Root cause analysis (RCFA)",lv:[300e3,700e3],desc:"Every breakdown is investigated: repeat failures 25% rarer per level."},
 {id:"reliab",g:"maint",name:"Reliability program",lv:[500e3,1.1e6],desc:"Vibration and oil analysis: drive, felt and fabric failures 40% rarer and repair bills 15% lower per level."},
 {id:"pmprog",g:"maint",name:"Preventive maintenance",lv:[200e3,450e3,800e3],desc:"Planned shutdown work: all breakdowns 20% rarer and fewer sheet breaks per level. Costs $400/h per level."},
 {id:"stores",g:"maint",name:"Spare parts storeroom",lv:[400e3],desc:"Parts on the shelf: repairs finish 25% faster."},
 {id:"apc",g:"mgmt",name:"Advanced process control",lv:[700e3,1.5e6],desc:"+2% tons and 8% less energy per level."},
 {id:"contract",g:"mgmt",name:"Long-term OCC contract",lv:[400e3,900e3],desc:"OCC costs $20/t less per level."},
 {id:"sales",g:"mgmt",name:"Sales team",lv:[500e3,1.2e6],desc:"Paper sells for $25/t more per level."},
 {id:"insure",g:"mgmt",name:"Insurance policy",lv:[150e3],desc:"Repair bills cut 60%. Premium $1,500/h."},
];
const UP=Object.fromEntries(UPS.map(u=>[u.id,u]));
const LV=id=>(S&&S.up&&S.up[id])||0;
function applyUpgrades(){
  applyGrade();
  P.K=BASE.K*Math.pow(1.06,LV("deckle"))*(1+0.02*LV("apc"));
  P.spBonus=150*LV("drive")+100*LV("shoe");
  P.energyMul=(1-0.12*LV("shoe"))*(1-0.08*LV("apc"));P.refSave=22*LV("refiner");
  P.pulperMax=70+25*LV("pulper"); P.yieldF=P.blendY+0.03*LV("clean"); P.tankCap=BASE.tankCap+150*LV("chest");
  P.driverRate=BASE.driverRate*(1+0.25*LV("forklift")); P.doors=3+LV("docks"); P.shipDoors=3+LV("docks");
  P.robots=2*LV("agv"); P.fgCap=BASE.fgCap+112*LV("wh"); P.autoFeed=LV("feedconv")>0;
  P.occPrice=P.blendP+((S&&S.plan)?S.plan.mkt:0)-20*LV("contract"); P.priceAdd=25*LV("sales"); P.repairMul=(LV("insure")?0.4:1)*(1-0.15*LV("reliab"));P.techs=2+2*LV("maintcrew");P.pmCost=400*LV("pmprog"); P.premium=LV("insure")?1500:0;
  P.breakBase=Math.pow(0.7,LV("monitor"))*Math.pow(0.9,LV("pmprog"));
  P.winderMax=45+30*LV("winder")+((S&&S.perk&&S.perk.winder)||0);P.hayBase=Math.pow(0.6,LV("winder"));const wr=document.getElementById("s-wdr");if(wr)wr.max=P.winderMax;
  const sp=document.getElementById("s-pmSp"),pu=document.getElementById("s-pulper");
  if(sp)sp.max=3300+P.spBonus; if(pu)pu.max=P.pulperMax;
}
// the OCC blend, energy, chemicals and break rate follow the grade on the machine
function applyGrade(){const g=(typeof C!=="undefined"&&C&&C.grade)||"23m",c=GCOST[g],d=c.dlk;
  P.blendP=OCCG.occ11.p*(1-d)+OCCG.dlk.p*d;P.blendY=OCCG.occ11.y*(1-d)+OCCG.dlk.y*d;
  P.steamMul=c.steam;P.chemAdd=c.chem-((S&&S.perk)?S.perk.chem:0);P.gradeBrk=c.brk;}
function energyCost(){return Math.max(0,ECON.energy*P.steamMul*P.energyMul+ECON.chem+P.chemAdd-(P.refSave||0)-((S&&S.perk&&S.perk.energy)||0));}
function priceOf(g){let v=ECON.price[g]+P.priceAdd;if(S&&S.perk)v+=S.perk.price[g]||0;if(S&&S.fx)for(const f of S.fx)if(f.price)v+=(f.price[g]||0)+(f.price.all||0);return v;}
function freqMul(id){let m=1;
  if(["lwplug","cscreen","fscreen","lcplug"].includes(id))m*=Math.pow(0.6,LV("clean"));
  if(MAINT.includes(id))m*=Math.pow(0.75,LV("rcfa"))*Math.pow(0.8,LV("pmprog"));
  if(["shaft","felt","fabric"].includes(id))m*=Math.pow(0.6,LV("reliab"));
  if(["shaft","fabric","felt","dryerfire","slime"].includes(id))m*=Math.pow(0.6,LV("monitor"));
  if(id==="dryerfire"||id==="balefire")m*=LV("fire")?0.4:1;
  if(id==="ragger"||id==="overflow")m*=LV("detrash")?0.4:1;
  if(id==="fleet")m*=Math.pow(0.6,LV("forklift"));
  if(id==="fight"||id==="calloff")m*=LV("safety")?0.5:1;
  if(OUT.area[id])m*=outRel(OUT.area[id]);
  if(S&&S.fx)for(const f of S.fx){if(f.freq&&EV[id]&&(EV[id].g==="machine"||EV[id].g==="stock"))m*=f.freq;if(f.scab&&id==="slime")m*=f.scab;if(f.evf&&f.evf[id])m*=f.evf[id];}
  return m;}
// v3.3.3: reliability of an outage area = 1 / its average breakdown rate, split into upgrades, outage budget and temporary events
function areaRel(a){const ids=OUT.ev[a]||[];if(!ids.length)return {tot:1,up:1,out:1,fx:1};let up=0,fx=0;const out=outRel(a);
  ids.forEach(id=>{let f=1;if(S&&S.fx)for(const x of S.fx){if(x.freq&&EV[id]&&(EV[id].g==="machine"||EV[id].g==="stock"))f*=x.freq;if(x.scab&&id==="slime")f*=x.scab;if(x.evf&&x.evf[id])f*=x.evf[id];}
    fx+=f;up+=freqMul(id)/(out*f);});
  up/=ids.length;fx/=ids.length;return {tot:1/(up*out*fx),up:1/up,out:1/out,fx:1/fx};}
function durMul(id){let d=(id==="dryerfire"||id==="balefire")&&LV("fire")?0.5:1;if(MAINT.includes(id))d*=Math.pow(0.8,LV("maintcrew"))*(LV("stores")?0.75:1);return d;}
function spend(v,k){if(S.free&&k==="upgrades"){S.ledger[k]+=0;return;}S.cash-=v;S.ledger[k]+=v;}
function earn(v){S.cash+=v;S.ledger.rev+=v;}
function money(v){const a=Math.abs(v),sg=v<0?"−":"";return a>=1e6?`${sg}$${(a/1e6).toFixed(2)}M`:a>=1e4?`${sg}$${Math.round(a/1e3)}k`:`${sg}$${Math.round(a).toLocaleString()}`;}
function inY(d){const n=P.doors;return n<=3?[130,185,240][d]:118+d*150/(n-1);}
function outY(d){const n=P.shipDoors;return n<=3?[500,555,610][d]:495+d*120/(n-1);}
const CH={on:true,lvl:1,en:{}};
let NAME="PM1"; try{NAME=localStorage.getItem("mill-twin-name")||"PM1";}catch(e){}
const BANNERS=[];
const GROUPS=[["machine","Paper machine"],["stock","Stock prep"],["yard","Warehouse & trucks"],["god","Acts of nature"]];
