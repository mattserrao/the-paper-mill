/* ---- v6.3 process flow overview: today's money and material through the mill (model side; the screen is 50c-pflow-ui.js) ----
   The game's books are unchanged. S.pf only notes WHERE money that spend() already booked went (by area), splits the
   energy bill into energy and chemicals, and counts waste tons. A mill day runs 6am to 6am (S.t=0 is 6am). Each input's
   day total is read from the ledger itself, so the screen always adds up to the real cash change (upgrades aside):
   anything the tracker didn't place lands on "Site & admin". At the day roll the finished day is kept as S.pf.prev. */
const PF_AREAS=[["yard","Bale yard","Receiving & bale yard"],["pulper","Pulper","Pulper"],["stock","Stock prep","Stock prep"],["pm","Paper machine","Paper machine"],
  ["winder","Winder","Winder"],["ship","Warehouse","Warehouse & shipping"],["site","Site & admin","Site & admin"]];
const PF_CATS=[["fiber","Fiber (OCC)","#c08a4a"],["frin","Freight in","#e07b39"],["frout","Freight out","#9b7fd6"],["energy","Energy","#ffb02e"],["chem","Chemicals & water","#3fc6d6"],["labor","Labor","#4fd18b"],
  ["maint","Maintenance","#ff7a8a"],["over","Overhead","#a7b4cf"]];
const PF_POWER={pulper:0.2,stock:0.35,pm:0.45};   // electricity by area: pulper rotor; refiners, screens and pumps; the machine's drives, vacuum and fans
const PF_STEAMSH=0.6;   // steam's share of the energy bill (the same share the knobs' extra dryer steam uses, 07b)
const PF_RA={balefire:"yard",badocc:"yard",ragger:"pulper",rotortrip:"pulper",winderdown:"winder",tiedrolls:"winder",wrap:"winder",birdhay:"winder"};
function pfRepArea(id){if(PF_RA[id])return PF_RA[id];const g=EV[id]&&EV[id].g;return g==="stock"?"stock":g==="machine"?"pm":g==="yard"?"ship":"site";}
function pfNew(){return {d:Math.floor(S.t/1440),h:Math.floor(S.t/60),L0:Object.assign({},S.ledger),cash0:S.cash,ship0:S.shipT||0,prod0:S.tot.prodT,A:{},
  W:{feed:0,rej:0,bale:0,eff:0,broke:0,val:0,fine:0,fines:0,spill:0,scrap:0,in:0,fw:0,pot:0,chg:0,spotd:0,idle:0,trim:0}};}   /* (v6.11: trim) */   // (v6.7: in, fw, pot, chg, spotd, idle)
// (v6.5: every note goes to the day (S.pf) and to the hour (S.ph, 11c-hist.js) alike)
function pfAdd(k,a,v){if(!v)return;for(const f of [S.pf,S.ph]){if(!f)continue;const o=f.A[k]||(f.A[k]={});o[a]=(o[a]||0)+v;}}
function pfW(k,v){if(!v)return;if(S.pf)S.pf.W[k]=(S.pf.W[k]||0)+v;if(S.ph)S.ph.W[k]=(S.ph.W[k]||0)+v;}
// called at the top of step(): the first call starts the day; a new mill day keeps the finished one as prev
function pfDay(){const d=Math.floor(S.t/1440);if(!S.pf){S.pf=pfNew();return;}if(d!==S.pf.d){const y=pfCalc(S.pf,true);S.pf=pfNew();S.pf.prev=y;}}
// the chemicals and water part of the per-ton energy bill (the rest is energy); refiner savings come off chemicals
// (stronger bonding, less starch)
function pfChemT(){return Math.max(0,ECON.chem+P.chemAdd+(P.siteChem||0)-(P.refSave||0))*(P.costMul||1);}
function pfEnergy(prod,ec){if(!(ec>0))return;const ch=Math.min(ec,prod*pfChemT()),en=ec-ch;
  pfAdd("chem","stock",ch*0.5);pfAdd("chem","pm",ch*0.5);pfAdd("steam","pm",en*PF_STEAMSH);for(const a in PF_POWER)pfAdd("power",a,en*(1-PF_STEAMSH)*PF_POWER[a]);}
function pfLabor(dt){const w=(ECON.wage+(P.siteWage||0))*(P.costMul||1)*leadWage()*civWage(),m=dt/60;
  pfAdd("labor","yard",C.drivers.v*w*m);pfAdd("labor","ship",(C.loaders.v*w+P.robots*ECON.robot)*m);pfAdd("mlab","techs",(P.techs+(P.elec||0))*w*m);if(P.pmCost)pfAdd("mlab","pmprog",P.pmCost*m);}
function pfRepair(id,bill){if(!bill)return;pfAdd("rep",pfRepArea(id),bill);pfAdd("repid",id,bill);if(id==="permit"){pfW("fine",bill);pfW("fines",1);}histEv(id,bill);}

// the day's numbers as plain data (also what is kept for yesterday)
function pfCalc(f,whole){const L=S.ledger,d=k=>(L[k]||0)-(f.L0[k]||0),A=f.A,sum=o=>o?Object.values(o).reduce((s,v)=>s+v,0):0;
  const chem=sum(A.chem),steam=sum(A.steam),power=sum(A.power),energy=d("energy")-chem,mlab=sum(A.mlab),repairs=d("repairs"),premium=d("premium");
  const cat={fiber:d("occ"),frin:d("frin"),frout:d("frout"),energy,chem,labor:d("labor")-mlab,maint:mlab+repairs+premium,over:d("overhead")+d("civ")};
  const et=steam+power,es=et>0?energy/et:0;
  const sub={energy:{Steam:steam*es,Power:power*es},chem:{"Stock prep":(A.chem&&A.chem.stock)||0,"Wet end":(A.chem&&A.chem.pm)||0},
    labor:{"Forklift drivers":(A.labor&&A.labor.yard)||0,"Loaders and robots":(A.labor&&A.labor.ship)||0},
    maint:{"Repair bills and outage budgets":repairs,"Maintenance and electrical techs":(A.mlab&&A.mlab.techs)||0,"Preventive maintenance program":(A.mlab&&A.mlab.pmprog)||0,"Insurance premium":premium},
    over:{"Site overhead":d("overhead"),"Civics":d("civ")},fiber:{"OCC bales":d("occ")},frin:{"Inbound haul":d("frin")},frout:{"Outbound freight":d("frout")}};
  // by area: what each input added there today
  const by={};PF_AREAS.forEach(([a])=>by[a]={});const put=(c,a,v)=>{if(v)by[a][c]=(by[a][c]||0)+v;};
  put("fiber","yard",cat.fiber);put("frin","yard",cat.frin);put("frout","ship",cat.frout);
  if(et>0){for(const a in A.steam||{})put("energy",a,A.steam[a]*es);for(const a in A.power||{})put("energy",a,A.power[a]*es);}else put("energy","pm",energy);
  let c0=0;for(const a in A.chem||{}){put("chem",a,A.chem[a]);c0+=A.chem[a];}put("chem","site",chem-c0);
  let l0=0;for(const a in A.labor||{}){put("labor",a,A.labor[a]);l0+=A.labor[a];}put("labor","site",cat.labor-l0);
  let r0=0;for(const a in A.rep||{}){if(a==="site")continue;put("maint",a,A.rep[a]);r0+=A.rep[a];}put("maint","site",cat.maint-r0);
  put("over","site",cat.over);
  const cost=PF_CATS.reduce((s,[k])=>s+cat[k],0),rev=d("rev"),deals=d("deals"),revenue=rev+deals;
  return {h:whole?24:Math.max(0,(S.t-f.d*1440)/60),day:f.d+1,cat,sub,by,cost,rev,deals,revenue,profit:revenue-cost,
    shipT:(S.shipT||0)-f.ship0,made:S.tot.prodT-f.prod0,W:Object.assign({},f.W),rep:Object.assign({},A.repid||{}),
    cashChg:S.cash-f.cash0,upg:S.free?0:d("upgrades")};}
