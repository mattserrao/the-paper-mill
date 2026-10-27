/* ---- v6.7 the tag list: every reading the control room can show, with its area, units and history ----
   One registry for the DCS pictures' trends, the Trends screen, relationship analysis and the planning, water and quality
   screens. Each tag: [id, name, area, unit, reader(r) -> number or null, long-history column (11c HA, hourly) or ""].
   r is knobRead() for the sample (one read per sample). History: a reading every 2 sim minutes for 48 h in ring buffers,
   outside S (saves don't grow; a new game or a loaded save starts it fresh), read-only on the sim. Longer ranges use the
   hourly history (S.hist) for tags that have a column there. Units: water and stock flows in US gallons a minute,
   volumes in gallons (v6.7: they were m³/h, L/s and m³). */
const GPM=m3h=>m3h*4.40287,GAL=m3=>m3*264.172,LS_GPM=ls=>ls*15.8503;
// v6.14 units: motors in horsepower (the electricity side stays kW / kWh), temperatures in °F
const HPK=1.34102,HP=kw=>kw*HPK,fmtHp=kw=>Math.round(HP(kw)).toLocaleString()+" hp";
const hpRate=kw=>{const h=HP(kw);return (h>=500?Math.round(h/50)*50:Math.round(h/25)*25).toLocaleString()+" hp";};   // (a nameplate-looking rating)
const degF=c=>c*9/5+32,fmtF=c=>Math.round(degF(c))+" °F";
const MCHEST_GAL=60000;                                // the machine chest
const fmtGal=g=>{const a=Math.abs(g),s=g<0?"−":"";return s+(a>=1e6?(a/1e6).toFixed(2)+"M gal":a>=1e4?Math.round(a/1e3)+"k gal":Math.round(a).toLocaleString()+" gal");};
const fmtGpm=g=>(g>=1e4?(g/1e3).toFixed(1)+"k":Math.round(g).toLocaleString())+" gpm";
const TAG_INT=new Set(["orders","trucks","rolls","t","A","kW","hp","fpm","mL CSF","V","rpm"]);
const TAG_AREA={SPOT:"Stock prep",WET:"Wet end",DET:"Dry end",STM:"Steam & air",UTIL:"Utilities",WATER:"Water",QCS:"Quality",PLAN:"Planning & yard",DRV:"Drives (MCC)"};
const _R=()=>S.rates||{};
const wr=()=>S.wat&&S.wat.r;
const TAGS=[
  // stock prep
  ["feed","Bales fed","SPOT","t/h",()=>_R().feed,"a.feed"],["fiber","Fiber out of the pulper","SPOT","t/h",()=>_R().fiberIn,"a.fiber"],
  ["yield","Pulper yield","SPOT","%",()=>P.yieldF*((S.M&&S.M.yieldMul)||1)*dpYield()*100,"a.yield"],["cp","Pulper consistency","SPOT","%",r=>r.cp,""],
  ["amps","Pulper rotor","SPOT","A",r=>r.amps,"a.amps"],["pulpLvl","Pulper level","SPOT","%",r=>r.pulpLvl,""],
  ["rejt","Rejects","SPOT","t/h",()=>(_R().feed||0)*(1-P.yieldF*((S.M&&S.M.yieldMul)||1)*dpYield()),""],
  ["hddp","HD cleaner ΔP","SPOT","psi",()=>purgeDp("hd")+(active("hdblow")?PURGE.add.hd:0),""],["lcdp","LC cleaners ΔP","SPOT","psi",()=>purgeDp("lc")+(active("lcplug")?PURGE.add.lc:0),""],
  ["lwdp","LW cleaners ΔP","SPOT","psi",()=>purgeDp("lw")+(active("lwplug")?PURGE.add.lw:0),""],
  ["fsld","Fine screen load","SPOT","%",()=>(_R().fiberIn||0)/Math.max(1,P.screenMax)*100,""],["fsdp","Fine screen ΔP","SPOT","psi",()=>S.we?S.we.fs:null,""],
  ["chest","Stock chest level","SPOT","%",()=>S.tank/P.tankCap*100,"a.chest"],["chestg","Stock chest volume","SPOT","gal",()=>S.tank/(WAT.cs/100)*264.172,""],
  ["kwh","Refining energy","SPOT","kWh/t",r=>r.kwh,"a.kwh"],["refkw","Refiner load","SPOT","hp",r=>r.run?HP(r.refkw):null,"a.refkw",HPK],["gap","Refiner plate gap","SPOT","mm",r=>r.gap,""],["csf","Freeness","SPOT","mL CSF",r=>r.csf,"a.csf"],
  ["refq","Refined stock flow","SPOT","% of std",r=>r.refq,""],["mcLvl","Machine chest level","SPOT","%",r=>r.mcLvl,""],["mcg","Machine chest volume","SPOT","gal",r=>MCHEST_GAL*r.mcLvl/100,""],
  ["mcCons","Machine chest consistency","SPOT","%",r=>r.mcCons,""],["agit","Machine chest agitator","SPOT","%",r=>r.agit,""],
  ["fan","Fan pump flow (headbox)","SPOT","gpm",()=>S.we?GPM(S.we.f.hb||0):0,""],["dil","Fan pump dilution","SPOT","gpm",()=>S.we?GPM(S.we.f.dil||0):0,""],
  // wet end
  ["hbc","Headbox consistency","WET","%",()=>S.pm==="run"&&S.we?S.we.hbc:null,"a.hbc"],["bwv","Basis weight valve","WET","%",()=>S.we?S.we.v:null,""],
  ["bwsp","Basis weight setpoint","WET","lb/1000 ft²",()=>bwSp(),""],
  ["drain","Table and couch drainage","WET","gpm",()=>S.we?GPM(S.we.f.drain||0):0,""],["seal","Vacuum box water (seal pit)","WET","gpm",()=>S.we?GPM(S.we.f.seal||0):0,""],
  ["pressw","Press water (to the save-all)","WET","gpm",()=>S.we?GPM(S.we.f.press||0):0,""],["wwov","White water silo overflow (to the WW chest, by design)","WET","gpm",()=>S.we?GPM(S.we.f.over||0):0,""],
  ["wsp","Wire speed","WET","fpm",()=>S.pmSpeed/DCS_DRAW(),""],["jw","Jet-to-wire ratio","WET","",()=>dcsJw(),""],["rd","Rush / drag (+ rush, − drag)","WET","fpm",()=>S.pm==="run"?dcsRD():null,"a.rd"],["gbox","Gravity box vacuum","WET","inHg",r=>r.gbox,""],["lvac","Low vacuum boxes","WET","inHg",r=>r.lvac,""],["vac","Flatbox vacuum","WET","inHg",r=>r.vacIn,""],["vpkw","Vacuum pump","WET","hp",r=>r.run?HP(r.vpkw):null,""],["couchSol","Couch solids","WET","%",r=>r.run?r.couchSol:null,""],
  ["pl","Press load","WET","kN/m",r=>r.pl,""],["pressSol","Press solids","WET","%",r=>r.run?r.pressSol:null,""],["edge","Fabric edge","WET","mm",r=>r.edge,""],
  ["gtrav","Guide travel used","WET","%",r=>r.gm?Math.min(1,r.gtrav)*100:null,""],["osc","Felt shower oscillator","WET","%",r=>r.osc,""],
  ["wwl","White water silo level","WET","%",()=>S.we?S.we.L/WE.silo*100:null,"a.wwl"],["wwg","White water silo volume","WET","gal",()=>S.we?GAL(S.we.L):null,""],
  // v6.11.1 wet-end chemicals (07l)
  
  ["poldose","Retention polymer dose","WET","kg/t",()=>S.pm==="run"?chemE("pol"):null,""],["polflow","Retention polymer pump","WET","kg/h",()=>chemFlow("pol"),""],
  ["fpr","First pass retention","WET","%",()=>S.pm==="run"?fprNow():null,""],
  ["hum","Machine room humidity","WET","%",()=>clamp((S.stm&&!S.zen?S.stm.hum:62+(motStatus("fog")!=="run"||active("fogfan")?24:0))+wob2(0.01,8)*3,0,100),""],   // (v6.13: the machine room's air, 07m)
  // dry end
  ["speed","Reel speed","DET","fpm",r=>r.speed,"a.speed"],["prod","Paper made","DET","t/h",()=>_R().prod,"a.prod"],["st1","1st section steam","DET","psig",r=>r.st1,""],
  ["st3","3rd section steam","DET","psig",r=>r.run?r.st3:null,""],["steam","Dryer steam flow","DET","t/h",r=>r.steam>0.5?r.steam:null,"a.steam"],
  ["dryl","Dryer load","DET","% of limit",()=>S.dry&&S.pm==="run"?S.dry.load*100:null,"a.dryl"],["moist","Reel moisture","DET","%",r=>r.run?r.moist:null,"a.moist"],
  ["bw","Basis weight","DET","lb/1000 ft²",r=>r.run?r.bw:null,"a.bw"],["tension","Draw tension","DET","kN/m",r=>r.run?r.tension:null,""],["draw","Open draw","DET","%",r=>r.draw,""],
  ["reel","Paper waiting at the winder","DET","t",()=>S.winderBuf+S.reel,"a.reel"],["cut","Winder","DET","t/h",()=>_R().cut,"a.cut"],["conv","Rolls on the conveyor","DET","rolls",()=>S.conv||0,""],
  ["delvl","DE pulper level","DET","%",()=>S.zen?null:depLvl(),""],["decons","DE pulper consistency","DET","%",()=>S.zen?null:depCons(),""],["defin","DE pulper fiber in","DET","t/h",()=>S.zen||!S.dep?null:S.dep.fin,""],
  ["rollw","Roll width (twin set)","QCS","in",()=>S.zen?null:S.wdW||windW(C.grade),""],["trimp","Trim","QCS","%",()=>S.zen?null:(S.trimNow!=null?S.trimNow:trimFrac(windW(C.grade)))*100,""],["trimt","Trim to the DE pulper","QCS","t/h",()=>S.zen?null:_R().trim||0,""],
  ["cdspan","CD moisture spread (worst zone)","QCS","%",()=>S.zen||!S.cd||S.pm!=="run"?null:Math.max(...S.cd.dv.map(Math.abs)),""],["sbout","Steam box output","QCS","%",()=>S.zen||!S.cd||!sbHave()?null:S.cd.sb.reduce((a,v)=>a+v,0)/12*100,""],["spout","Spray boom output","QCS","%",()=>S.zen||!S.cd?null:S.cd.sp.reduce((a,v)=>a+v,0)/12*100,""],   // (v6.11)
  // utilities
  ["boiler","Steam header","UTIL","% of full",r=>r.boiler*100,""],["vent","Steam vented","UTIL","t/h",()=>S.dry&&S.dry.vent>0.05?S.dry.vent:0,""],
  ["tss","Effluent TSS","UTIL","mg/L",()=>tssNow(),""],["energyt","Energy","UTIL","$/t",()=>Math.max(0,energyCost()-pfChemT()),"a.energyt"],
  // water (v6.7 in gallons)
  ["fresh","Fresh water","WATER","gpm",()=>wr()?GPM(wr().fresh):null,""],["evap","Dryer evaporation","WATER","gpm",()=>wr()?GPM(wr().evap):null,""],
  ["outfall","Outfall","WATER","gpm",()=>wr()?GPM(wr().out):null,""],["wwover","White water to sewer","WATER","gpm",()=>wr()?GPM(wr().over):null,""],
  ["makeup","Makeup water","WATER","gpm",()=>wr()?GPM(wr().make):null,""],["shower","Machine showers","WATER","gpm",()=>GPM((wr()?wr().p:_R().prod||0)*WAT.shower),""],
  ["wcl","White water chest level","WATER","%",()=>S.wat?S.wat.L/WAT.cap*100:null,""],["wcg","White water chest volume","WATER","gal",()=>S.wat?GAL(S.wat.L):null,""],
  ["wuse","Fresh water per ton","WATER","gal/ton",()=>{const W=wr();return W&&W.p>1?GAL(W.fresh/W.p):null;},""],
  // quality
  ["off","Reel to the beater","QCS","%",r=>r.run?r.off*100:null,""],["rct","Ring crush","QCS","lbf/6 in",()=>S.pm==="run"?QNOW.rct:null,"a.rct"],["prem","Weight credit (sold by area)","QCS","%",()=>S.zen?null:(areaQcs()-1)*100,""],["cdsp","CD moisture 2σ","QCS","%",r=>r.run?cd2s(r.zones):null,""],
  ["bank","Beater bay waiting","QCS","t",()=>S.q?S.q.bank||0:0,""],
  // planning and the yard
  ["yard","Bale yard","PLAN","t",()=>S.yard,"a.yard"],["unload","Unloading","PLAN","t/h",()=>_R().unload,"a.unload"],["occp","OCC price","PLAN","$/t",()=>P.occPrice,"a.occp"],
  ["balem","Bale moisture","PLAN","%",()=>S.bq&&!S.zen?S.bq.m*100:null,"a.balem"],["stk","Stickies at the machine","PLAN","%",()=>S.bq&&!S.zen?S.bq.ck*100:null,"a.stk"],
  ["inq","Trucks waiting to unload","PLAN","trucks",()=>S.inQ.length,""],["fg","Warehouse","PLAN","% full",()=>S.fg/P.fgCap*100,"a.fgp"],
  ["load","Loading","PLAN","rolls/h",()=>_R().load,"a.load"],["outq","Trucks waiting to load","PLAN","trucks",()=>S.outQ.length,""],
  ["openo","Open orders","PLAN","orders",()=>S.ord&&!S.zen?S.ord.list.filter(o=>o.st==="open").length:null,"a.openo"],
  ["lateo","Late orders","PLAN","orders",()=>S.ord&&!S.zen?S.ord.list.filter(o=>o.st==="open"&&S.t>o.due+ORD.grace).length:null,"a.lateo"],
  ["price","Paper price (grade on the machine)","PLAN","$/t",()=>priceOf(C.grade),"a.price"],["profit","Profit rate","PLAN","$/day",()=>S.profitRate||0,""],
  // v6.9 the control loops (07h): each one's PV and output, and the moisture controller's steam setpoint
  ["nv101pv","NV-101 pulper consistency (PV)","SPOT","%",()=>vlvView("NV-101").pv,""],["nv101op","NV-101 dilution valve","SPOT","% open",()=>vlvView("NV-101").pos,"a.v101"],
  ["lv104pv","LV-104 machine chest level (PV)","SPOT","%",()=>vlvView("LV-104").pv,""],["lv104op","LV-104 machine chest valve","SPOT","% open",()=>vlvView("LV-104").pos,"a.v104"],
  ["fv201pv","FV-201 basis weight (PV)","WET","lb",()=>S.pm==="run"?vlvView("FV-201").pv:null,""],["fv201op","FV-201 basis weight valve","WET","% open",()=>vlvView("FV-201").pos,"a.v201"],
  ["lv202pv","LV-202 white water silo level (PV)","WET","%",()=>vlvView("LV-202").pv,""],["lv202op","LV-202 silo makeup valve","WET","% open",()=>vlvView("LV-202").pos,"a.v202"],
  ["qc300pv","QC-300 reel moisture (PV)","DET","%",()=>S.pm==="run"?vlvView("QC-300").pv:null,""],["qc300op","QC-300 steam setpoint out","DET","psig",()=>vlvView("QC-300").op*VD["QC-300"].out.k,""],
  ["pv302pv","PV-302 2nd section steam (PV)","DET","psig",()=>vlvView("PV-302").pv,""],["pv302op","PV-302 steam valve","DET","% open",()=>vlvView("PV-302").pos,"a.v302"],
  ["pv303pv","PV-303 3rd section steam (PV)","DET","psig",()=>vlvView("PV-303").pv,""],["pv303op","PV-303 steam valve","DET","% open",()=>vlvView("PV-303").pos,"a.v303"],
  // v6.10 the drives in the MCC (07i): each one's load, % of its rated power, and the MCC's total
  ["dl_pulp","Pulper rotor drive load","DRV","%",r=>rlyLoad("pulp",r),""],["dl_refA","Refiner A drive load","DRV","%",r=>rlyLoad("refA",r),""],["dl_refB","Refiner B drive load","DRV","%",r=>rlyLoad("refB",r),""],
  ["dl_fan","Fan pump drive load","DRV","%",r=>rlyLoad("fan",r),""],["dl_couch","Couch roll drive load","DRV","%",r=>rlyLoad("couch",r),""],["dl_pr1","1st press drive load","DRV","%",r=>rlyLoad("pr1",r),""],
  ["dl_pr2","2nd press drive load","DRV","%",r=>rlyLoad("pr2",r),""],["dl_dry","Dryer section drive load","DRV","%",r=>rlyLoad("dry",r),""],["dl_reel","Reel drum drive load","DRV","%",r=>rlyLoad("reel",r),""],
  ["dl_wind","Winder drum drive load","DRV","%",r=>rlyLoad("wind",r),""],["mcckw","MCC drive power","DRV","kW",r=>rlyMccKw(r),""],
  ["mvkv","13.8 kV feeder","DRV","kV",()=>rlyMV(),""],["lv480","MCC 480 V bus (main incomer)","DRV","V",()=>rlyLV(),""],["dc_SP","MCC-1 DC bus","DRV","V",()=>rlyDC("SP"),""],["dc_PM","MCC-2 DC bus","DRV","V",()=>rlyDC("PM"),""],["dc_WD","MCC-3 DC bus","DRV","V",()=>rlyDC("WD"),""]];
// v6.13 Steam and Sheet (07m, 07n): the cans and the cascade, the hood air, energy, the headbox, the sheet's strength, the
// deposits, the broke chest, the reel and the break risk
{const T3=()=>S.stm&&!S.zen?S.stm:null,run=()=>S.pm==="run";TAGS.push(
  ["dp1","1st section syphon ΔP","STM","psi",()=>T3()?T3().dp[0]:null,""],["dp2","2nd section syphon ΔP","STM","psi",()=>T3()?T3().dp[1]:null,""],["dp3","3rd section syphon ΔP","STM","psi",()=>T3()?T3().dp[2]:null,"a.dp3"],
  ["dpneed","3rd section ΔP needed","STM","psi",()=>T3()&&run()?stmNeed(2):null,""],["pdc304op","PDC-304 motive steam valve","STM","% open",()=>T3()?vlvView("PDC-304").pos:null,""],
  ["bt3","3rd section blow-through","STM","% of steam",()=>T3()&&run()?T3().bt[2]*100:null,""],
  ["btwaste","Blow-through to the condenser","STM","t/h",()=>T3()?T3().waste:null,""],["hoodH","Hood exhaust humidity","STM","g/kg",()=>T3()&&run()?T3().H:null,"a.hoodH"],
  ["exh","Hood exhaust fan","STM","%",()=>T3()?T3().exh:null,""],["sup","Hood supply fan","STM","%",()=>T3()?T3().sup:null,""],["airst","Supply air coil steam","STM","t/h",()=>T3()?T3().air:null,""],
  ["cret","Condensate return","STM","%",()=>T3()?T3().ret*100:null,"a.cret"],["mkup","Boiler makeup water","STM","gpm",()=>T3()?GPM(T3().mk):null,""],
  ["stpt","Steam per ton","STM","t/t",()=>T3()&&run()?T3().kpi.st:null,"a.stpt"],["kwht","Power per ton","STM","kWh/t",()=>T3()&&run()?T3().kpi.kwh:null,"a.kwht"],["usdt","Energy per ton","STM","$/t",()=>T3()&&run()?T3().kpi.usd:null,""],
  ["jwsp","J/W setpoint (fan pump)","WET","",()=>S.zen?null:hbJwSp(),""],["hbpsi","Headbox pressure","WET","psi",()=>S.zen||!run()?null:hbPsi(),""],["hbth","Headbox total head (TAPPI)","WET","psi",()=>S.zen||!run()?null:hbThPsi(),""],
  // v6.13.3 the fan pump on its curve (07p)
  ["fanrpm","Fan pump speed","SPOT","rpm",()=>S.fp&&S.fp.st!=="off"?S.fp.n*FP.rpm:null,""],["fantdh","Fan pump total dynamic head","SPOT","ft",()=>S.fp&&S.fp.st==="run"?S.fp.h:null,""],
  ["fankw","Fan pump power","SPOT","hp",()=>S.fp?HP(S.fp.kw):null,""],["faneff","Fan pump efficiency","SPOT","%",()=>S.fp&&S.fp.st==="run"?S.fp.eff*100:null,""],
  // v6.14 the bales' own variability (05b), sheet flutter (07n), the pick-up roll (07b) and the headbox door seal (07q)
  ["bvm","Bale moisture (on the conveyor)","SPOT","%",()=>bvNow()&&S.bq?(S.bq.m+bvNow().dm)*100:null,""],["bvq","Bale fiber quality (at the machine)","SPOT","",()=>baleOn()&&S.bq&&!S.zen?S.bq.fqm||0:null,""],
  ["flt","Sheet flutter","DET","%",()=>S.zen?null:fltIdx()*100,""],["puv","Pick-up roll vacuum","WET","inHg",r=>S.zen?null:r.puv,""],["hbdw","Headbox door seal wear","WET","%",()=>S.hbd&&!S.zen?S.hbd.w*100:null,""],
  ["scrdp","Machine screen ΔP","SPOT","psi",()=>S.fp&&S.fp.st==="run"?fpScrDp():null,""],["npsh","Fan pump NPSH margin","SPOT","ft",()=>fpNpshM(),""],["slcb","Slice opening","WET","mm",()=>S.zen?null:slcB(),""],
  ["form","Formation index","QCS","",()=>S.zen||!run()?null:formIdx(),""],["tsr","MD/CD tensile ratio","QCS","",()=>S.zen?null:tsrNow(),""],
  ["stfi","STFI CD","QCS","kN/m",()=>S.zen||!run()?null:QNOW.stfi,"a.stfi"],["hard","Reel hardness","DET","",()=>S.zen?null:reelHard(),""],["nip","Reel drum nip","DET","kN/m",()=>S.zen?null:reelNip(),""],
  ["depfab","Stickies on the forming fabric","WET","/100",()=>S.stk&&!S.zen?S.stk.fab:null,""],["depfelt","Stickies on the pick-up felt","WET","/100",()=>S.stk&&!S.zen?S.stk.felt:null,""],["depcan","Stickies on the first cans","DET","/100",()=>S.stk&&!S.zen?S.stk.can:null,"a.depcan"],
  ["bklvl","Broke chest level","SPOT","%",()=>S.bk&&!S.zen?bkLvl()*100:null,"a.bklvl"],["bkr","Broke ratio (metered)","SPOT","%",()=>S.bk&&!S.zen?S.bk.r*100:null,""],["tbf","Broke in the furnish","SPOT","%",()=>S.zen?null:(S.tbf||0)*100,"a.tbf"],
  ["brkr","Break risk","DET","× standard",()=>S.zen||!run()?null:brkRisk().R*SH.rcal,"a.brkr"]);}
const TAGI=Object.fromEntries(TAGS.map((t,i)=>[t[0],i]));
const tagName=id=>{const t=TAGS[TAGI[id]];return t?t[1]:id;};
const tagUnit=id=>{const t=TAGS[TAGI[id]];return t?t[3]:"";};
// the ring: 48 h at 2 sim minutes
const TG={S:null,n:1440,i:0,len:0,k:-1,t:new Float64Array(1440),v:TAGS.map(()=>new Float32Array(1440))};
function tagTick(){if(S.zen||(typeof BF!=="undefined"&&BF.real))return;if(TG.S!==S){TG.S=S;TG.i=0;TG.len=0;TG.k=-1;HMQ.i=0;HMQ.len=0;}
  const k=Math.floor(S.t/2);if(k===TG.k)return;TG.k=k;const r=knobRead(),i=TG.i;TG.t[i]=S.t;
  for(let j=0;j<TAGS.length;j++){let v;try{v=TAGS[j][4](r);}catch(e){v=null;}TG.v[j][i]=v==null||v!==v?NaN:v;}
  TG.i=(i+1)%TG.n;TG.len=Math.min(TG.n,TG.len+1);
  // v6.14 the QCS heatmap: each scan's 12 zones of moisture and basis weight (NaN while there's no sheet)
  {const H=HMQ,run=S.pm==="run"&&cdOn()&&S.cd,o=H.i*12;H.t[H.i]=S.t;for(let z=0;z<12;z++){H.m[o+z]=run?QNOW.m+S.cd.dv[z]:NaN;H.w[o+z]=run?QNOW.bw+S.cd.bw[z]:NaN;}H.i=(H.i+1)%H.n;H.len=Math.min(H.n,H.len+1);}}
// v6.14 the QCS heatmap's ring: 24 h of scans at the tags' 2 minutes (outside S, like the tags)
const HMQ={n:720,i:0,len:0,t:new Float64Array(720),m:new Float32Array(720*12),w:new Float32Array(720*12)};
// the latest reading (from the ring; live if nothing recorded yet)
function tagNow(id){const j=TAGI[id];if(j==null)return null;if(TG.len&&TG.S===S){const v=TG.v[j][(TG.i-1+TG.n)%TG.n];return v!==v?null:v;}
  try{const v=TAGS[j][4](knobRead());return v==null||v!==v?null:v;}catch(e){return null;}}
// a tag's points in [t0, t1] (sim minutes): 2-minute readings where the ring has them, hourly history before that
function tagSeries(id,t0,t1){const j=TAGI[id],out={t:[],v:[],hourly:false};if(j==null)return out;
  const ringT0=TG.len&&TG.S===S?TG.t[(TG.i-TG.len+TG.n)%TG.n]:Infinity,col=TAGS[j][5];
  if(t0<ringT0&&col&&S.hist&&HCI[col]!=null){const c=HCI[col];for(const r of S.hist.rows){const tm=r[0]*60+30;if(tm<t0||tm>t1||tm>=ringT0)continue;const v=r[c];if(v!=null&&v===v){out.t.push(tm);out.v.push(v*(TAGS[j][6]||1));out.hourly=true;}}}
  if(TG.S===S)for(let n=0;n<TG.len;n++){const i=(TG.i-TG.len+n+TG.n)%TG.n,tm=TG.t[i];if(tm<t0||tm>t1)continue;const v=TG.v[j][i];if(v===v){out.t.push(tm);out.v.push(v);}}
  return out;}
const tagHasLong=id=>{const t=TAGS[TAGI[id]];return !!(t&&t[5]);};
// format a reading with its unit
function tagFmt(id,v){if(v==null||v!==v)return "–";const u=tagUnit(id);
  if(u==="gal")return fmtGal(v);if(u==="gpm")return fmtGpm(v);if(u==="$/day")return money(v)+"/day";if(u==="$/t")return money(v)+"/t";
  if(TAG_INT.has(u))return Math.round(v).toLocaleString()+" "+u;
  const a=Math.abs(v),s=a>=1000?Math.round(v).toLocaleString():a>=100?Math.round(v)+"":a>=10?v.toFixed(1):v.toFixed(2);return s+(u?" "+u:"");}
