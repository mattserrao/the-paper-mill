// ---- v4.1 the site: environment (chosen by the player, with pros and cons) and the mill seed (layout of the auxiliary
// buildings and the scenery). The core line (receiving, stock prep, machine hall, winder, roll handling, warehouse) never
// moves. The 3D scene is built once per page load from SITE, so changing site saves it and reloads the page.
// Each run also has one bottleneck area (BN), picked from the run's seed: a season week gives every player the same one.
const ENVS={
  urban:{name:"City mill",short:"Urban",blurb:"An old riverside mill hemmed in by the city. Cardboard and customers are next door; power, labour and the sewer authority are not cheap.",
    pros:["City cardboard next door: OCC $5/t cheaper","Customers close by: paper sells for $4/t more"],
    cons:["Peak-rate power: energy $8/t dearer","City wages: $4/h more per worker","Strict sewer permit: wastewater fines 60% more often","Traffic: highway closures twice as often"],
    occ:-5,price:4,energy:8,wage:4,over:0,chem:0,wx:[0.55,0.76,0.9],inMul:1,
    freq:{permit:1.6,highway:2,fight:1.2}},
  rural:{name:"Forest valley",short:"Rural",blurb:"A mill on a clean river in wooded hills. Quiet, local crews and hydro power, but the cardboard has a long haul and winters bite.",
    pros:["Clean river water: wastewater fines 40% rarer","Local crews: wages $4/h lower","Hydro power: energy $5/t cheaper"],
    cons:["Long OCC haul: $12/t dearer","Hard winters: snow twice as often","Wildlife: beavers and birds in the mill twice as often"],
    occ:12,price:0,energy:-5,wage:-4,over:0,chem:0,wx:[0.5,0.66,0.78],inMul:1,
    freq:{permit:0.6,beaver:2,birdhay:2}},
  desert:{name:"Desert flats",short:"Desert",blurb:"A dry, sunny site beside a concrete canal and a solar farm. Power is cheap and the trucks always get through; water is precious and dust gets into everything.",
    pros:["Solar farm next door: energy $12/t cheaper","Dry and clear: trucks almost never slowed by weather","Cheap land: overhead $250/h lower"],
    cons:["Scarce water: chemicals and water $9/t dearer","Long haul to customers: paper sells for $7/t less","Dust: screens and cleaners plug 50% more often","Tinder-dry bale yard: bale fires twice as often"],
    occ:0,price:-7,energy:-12,wage:0,over:-250,chem:9,wx:[0.88,0.94,0.985],inMul:1,
    freq:{cscreen:1.5,fscreen:1.5,lwplug:1.5,lcplug:1.5,balefire:2}},
  swamp:{name:"Bayou",short:"Swamp",blurb:"Low, wet ground on a slow bayou. Water and land cost next to nothing and barges bring cheap cardboard, but the humidity, storms and soft roads take their toll.",
    pros:["Endless water: chemicals $5/t cheaper","Cheap land: overhead $190/h lower","Barge cardboard: OCC $3/t cheaper"],
    cons:["Humid: slime breaks 80% more often, more rain and fog","Soft roads: inbound trucks 12% slower","Storms: lightning and roof leaks 60% more often","Beavers: three times as often"],
    occ:-3,price:0,energy:0,wage:0,over:-190,chem:-5,wx:[0.4,0.7,0.92],inMul:0.88,
    freq:{slime:1.8,lightning:1.6,roof:1.6,beaver:3}}};
const ENV_IDS=["rural","urban","desert","swamp"];
// the site the 3D scene was built for: URL (?env=&mill=) first (tests), then the player's saved choice, then the default
const SITE=(()=>{const q=new URLSearchParams(location.search);let s=null;
  // the device autotest ignores the saved site, so every phone measures the same scene (rural, mill #1) unless the URL says
  if(!q.has("autotest"))try{s=JSON.parse(localStorage.getItem("paper-mill-site")||"null");}catch(e){}
  const env=ENVS[q.get("env")]?q.get("env"):s&&ENVS[s.env]?s.env:"rural";
  const ms=q.has("mill")?parseInt(q.get("mill"),10):s&&s.seed>=1?s.seed:1;
  return {env,seed:(ms>>>0)%100000||1,saved:!!s};})();
// a small seeded generator for anything built from the mill seed (layout, scenery): independent of the sim's streams
function siteRng(seed){let s=(seed>>>0)^0x5bd1e995;return ()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),s|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
// auxiliary layout from the mill seed: the wastewater plant sits behind stock prep (slot "back", x 1..46, z -49..-31,
// its v4.0 spot) or behind the maintenance shop (slot "east", x 46..91), clarifier and aeration pond either way round.
// The power house stays put: the steam rack ties it to the dryers. Utilities that follow the environment (water tower,
// substation, solar farm, barge dock...) take seeded slots around the fence (42b-3d-scenery.js).
const LAYOUTS=[{ww:"back",flip:false},{ww:"east",flip:false},{ww:"back",flip:true},{ww:"east",flip:true}];
function layoutFor(seed){const r=siteRng(seed);const L=LAYOUTS[Math.floor(r()*LAYOUTS.length)];
  // wx/wz map a v4.0 wastewater-plant coordinate to this layout (flip mirrors the plant inside its 1..46 slot)
  const dx=L.ww==="east"?45:0,wx=x=>dx+(L.flip?47-x:x),wz=z=>z;return {...L,dx,wx,wz,i:LAYOUTS.indexOf(L)};}
const LAYOUT=layoutFor(SITE.seed);
function siteSave(env,seed){try{localStorage.setItem("paper-mill-site",JSON.stringify({env,seed}));}catch(e){}}
// gameplay effect of the environment (sim; applied in applyUpgrades). The site of the loaded scene is the one in play.
const ENVX=()=>ENVS[SITE.env]||ENVS.rural;
// ---- bottleneck: one area starts well short of the paper machine's rate. Its capacity is BNK[area] of what the machine
// needs on 23m at standard speed (set per area so a hands-off season loses about the same with each); the upgrades for
// that area are 25% off and fix it (BN[].ups)
const BNK={recv:0.70,pulper:0.82,screens:0.81,winder:0.80,ship:0.80},BN_DISC=0.25;
const BN={
  recv:{name:"Receiving docks",what:"unloading",ups:["docks","forklift"],g:"yard",sec:"recv",
    tip:"Trucks unload slowly: the bale yard runs down and the pulper starves. Extra dock doors or a faster forklift fleet fix it."},
  pulper:{name:"Pulper",what:"pulping",ups:["pulper"],g:"stock",sec:"pulp",
    tip:"The pulper can't slush enough bales to keep the machine full. A pulper rotor upgrade fixes it."},
  screens:{name:"Screens & cleaners",what:"screening",ups:["clean"],g:"stock",sec:"pulp",
    tip:"The screens can't pass enough clean stock. The screens & cleaners upgrade fixes it."},
  winder:{name:"Winder",what:"winding",ups:["winder"],g:"machine",sec:"wd",
    tip:"The winder can't keep up with the reel: spools back up and the machine has to stop. A winder rebuild fixes it."},
  ship:{name:"Shipping docks",what:"loading",ups:["docks","agv"],g:"yard",sec:"wh",
    tip:"Trucks load slowly: the warehouse fills up and the machine has to stop. Extra dock doors or robotic roll handling fix it."}};
const BN_IDS=["recv","pulper","screens","winder","ship"];
// the run's bottleneck follows from its seed (a hash, so no sim stream is drawn)
function bnFor(seed){let h=(seed>>>0)^0x2545f491;h=Math.imul(h^(h>>>16),0x45d9f3b);h=Math.imul(h^(h>>>16),0x45d9f3b);h^=h>>>16;return BN_IDS[(h>>>0)%BN_IDS.length];}
const BNQ=()=>(S&&BN[S.bn])?S.bn:null;
// what the machine needs at standard speed on 23m (t/h of paper), the yardstick for every capacity
const NEED23=()=>BASE.K*GRADES["23m"].sp*GRADES["23m"].bw;
function upCost(u,l){const c=u.lv[l];const b=BNQ();return b&&BN[b].ups.includes(u.id)?Math.round(c*(1-BN_DISC)/1000)*1000:c;}
function upFix(u){const b=BNQ();return !!(b&&BN[b].ups.includes(u.id));}
// capacities that a bottleneck can cut (called from applyUpgrades)
function applySite(){const E=ENVX(),b=BNQ(),need=NEED23(),fiber=need/P.pmLoss,feed=fiber/OCCG.occ11.y;
  P.siteOcc=E.occ;P.sitePrice=E.price;P.siteEnergy=E.energy+E.chem;P.siteWage=E.wage;P.siteOver=E.over;P.siteWx=E.wx;P.siteIn=E.inMul;
  // receiving: unloading per door (t/h); normal docks never limit
  P.doorRate=b==="recv"?BNK.recv*feed/3*(1+0.25*LV("forklift")):BASE.doorRate;
  // pulper feed (t/h of bales)
  P.pulperMax=b==="pulper"?BNK.pulper*feed+30*LV("pulper"):70+25*LV("pulper");
  // screens: accepted fiber (t/h); normal is far above anything the pulper can feed
  P.screenMax=b==="screens"?BNK.screens*fiber+18*LV("clean"):80+15*LV("clean");
  // winder (t/h)
  P.winderMax=(b==="winder"?BNK.winder*need:45)+30*LV("winder")+((S&&S.perk&&S.perk.winder)||0);
  // shipping: rolls loaded per door per hour
  P.doorRolls=b==="ship"?BNK.ship*need/(P.jumbo/P.rollsPerReel)/3*(1+0.35*LV("agv")):BASE.doorRolls;}
// rated capacity of each area right now, in t/h of paper (for the Line capacity view and the bottleneck banner)
function lineCaps(){const g=GRADES[C.grade],pm=P.K*(g.sp+P.spBonus)*g.bw,y=P.yieldF,k=P.pmLoss,roll=P.jumbo/P.rollsPerReel;
  return [["recv","Receiving",P.doors*P.doorRate*y*k],["pulper","Pulper",P.pulperMax*y*k],["screens","Screens & cleaners",P.screenMax*k],
    ["pm","Paper machine",pm],["winder","Winder",P.winderMax],["ship","Shipping",P.shipDoors*P.doorRolls*roll]];}
function siteFreq(id){const f=ENVX().freq;return (f&&f[id])||1;}
// what each bottleneck-fixing upgrade does for its area (shown on the upgrade card)
const BN_UPTXT={"recv/docks":"Each extra door adds a third more unloading.","recv/forklift":"+25% unloading at every door per level.",
  "pulper/pulper":"+30 t/h of pulping per level.","screens/clean":"+18 t/h of screen capacity per level.","winder/winder":"+30 t/h of winding per level.",
  "ship/docks":"Each extra door adds a third more loading.","ship/agv":"+35% loading at every door per level."};
// Line capacity: each area's rated t/h of paper against the paper machine, the bottleneck flagged
function lineCapView(host){const h=document.createElement("h3");h.textContent="Line capacity";host.appendChild(h);
  const caps=lineCaps(),pm=caps.find(c=>c[0]==="pm")[2],low=caps.reduce((a,c)=>c[2]<a[2]?c:a,caps[0]),top=Math.max(...caps.map(c=>Math.min(c[2],pm*2)));
  const box=document.createElement("div");box.className="lcap";
  caps.forEach(([id,n,v])=>{const d=document.createElement("div"),short=v<pm*0.995,bn=S.bn===id;d.className="lc"+(short?" short":"")+(id==="pm"?" pm":"");
    const w=Math.max(4,Math.min(100,v/top*100));
    d.innerHTML=`<span>${n}${bn?' <em>bottleneck</em>':""}</span><i><u style="width:${w.toFixed(1)}%"></u></i><b>${v>=pm*1.9?"&gt;"+Math.round(pm*1.9):Math.round(v)} t/h</b>`;box.appendChild(d);});
  host.appendChild(box);
  const p=document.createElement("p");p.className="lcnote";
  p.textContent=low[2]<pm*0.995?`${low[1]} limits the line to about ${Math.round(low[2])} t/h; the machine could make ${Math.round(pm)} t/h.`+(S.bn&&low[0]===S.bn?" "+BN[S.bn].tip:""):`Every area keeps up with the machine (${Math.round(pm)} t/h).`;
  host.appendChild(p);}
// at the start of a run: say which area is the bottleneck and what it costs (banner + log)
function bnNotice(){if(!S||!S.bn)return;const b=BN[S.bn],c=lineCaps(),me=c.find(x=>x[0]===S.bn),pm=c.find(x=>x[0]==="pm");
  const t=`Bottleneck: ${b.name}. ${b.what[0].toUpperCase()+b.what.slice(1)} tops out near ${Math.round(me[2])} t/h; the machine can make ${Math.round(pm[2])} t/h. See Upgrades.`;
  for(let k=BANNERS.length-1;k>=0;k--)if(BANNERS[k].id==="bn")BANNERS.splice(k,1);
  BANNERS.push({text:t,t:null,id:"bn",tag:"BOTTLENECK"});while(BANNERS.length>3)BANNERS.splice(1,1);log(t,"warn");}
// is the run's bottleneck still short of the machine? (labels, 5 times a second)
function bnShort(){const b=BNQ();if(!b)return false;const c=lineCaps();return c.find(x=>x[0]===b)[2]<c.find(x=>x[0]==="pm")[2]*0.995;}
// the bottleneck card at the top of Upgrades (shown on phones too, where the ledger is folded away)
function bnCard(){const el=$("bnCard");if(!el)return;const b=BNQ(),short=bnShort();el.hidden=!b;if(!b)return;
  const c=lineCaps(),me=c.find(x=>x[0]===b),pm=c.find(x=>x[0]==="pm"),fix=BN[b].ups.map(id=>UP[id].name).join(" or ");
  const html=short?`<b>Bottleneck: ${BN[b].name}</b><span>${Math.round(me[2])} t/h against the machine's ${Math.round(pm[2])} t/h. ${fix} fixes it, 25% off.</span>`
    :`<b>${BN[b].name}: fixed</b><span>It now keeps up with the machine (${Math.round(me[2])} t/h against ${Math.round(pm[2])} t/h).</span>`;
  if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}el.classList.toggle("ok",!short);}
