/* ---- v6.5 b3 the DCS expansion (claude/dcs-expansion-spec.md): bigger SPOT / WET / DET pictures and a UTIL screen ----
   The pictures (MIMIC, 50b) are replaced here: every box the game has an upset or a control for. Readings only read the
   sim (no dice). Setpoints that exist in Process flow > Controls are driven through those same controls (the card inputs),
   so the two stay in step and keep their season lock; the fiddly knobs' field panels (slice, spider valve) still work.
   Motors and reject purges: 07c-motors.js. */
const DCS_DRAW=()=>1.015*(1+knobVal("draw")/100)*1.01;   // wire -> presses, press-to-dryer draw (the knob), dryers -> reel
const wob2=(f,k)=>Math.sin(S.t*f+k)*0.6+Math.sin(S.t*f*2.7+k*2)*0.4;
const dcsOn=id=>active(id);
// jet-to-wire ratio from the slice opening (the saved slice, so it reads the same with or without the 3D view)
const dcsJw=()=>0.985+0.02*slcGet().v;
const dcsRD=()=>(dcsJw()-1)*S.pmSpeed/DCS_DRAW();
const DV={
  rgt:()=>motStatus("ragger")!=="run"?"0 kN":(14+wob2(0.05,13)*1.5+(S.rates.feed||0)/10).toFixed(1)+" kN",jdc:()=>String(Math.floor(((S.pf&&S.pf.W.feed)||0)/40)),
  thl:()=>{const D=G3.SPD;return D?Math.round(clamp(55+(D.lc||0)*20+wob2(0.03,14)*2,0,100))+"%":"–";},
  cvsp:()=>Math.round(C.pulper.v/Math.max(1,P.pulperMax)*100)+"%",cvst:()=>({run:C.pulper.auto?"AUTO":"HAND",off:"STOP",trip:"TRIP"})[motStatus("conv")],
  hddp:()=>Math.round(purgeDp("hd")+(dcsOn("hdblow")?40:0)+wob2(0.07,1))+" kPa",lcdp:()=>Math.round(purgeDp("lc")+(dcsOn("lcplug")?50:0)+wob2(0.05,2))+" kPa",
  lwdp:()=>Math.round(purgeDp("lw")+(dcsOn("lwplug")?45:0)+wob2(0.06,3))+" kPa",lcrow:()=>(LV("clean")>0?2:1)+" of "+(LV("clean")>0?2:1),
  csdp:()=>motStatus("cscr")!=="run"?"0 kPa":Math.round(18+S.rates.feed/Math.max(1,P.pulperMax)*14+wob2(0.08,4))+" kPa",csrj:()=>(2.5+(dcsOn("badocc")?2:0)+wob2(0.03,5)*0.3).toFixed(1)+"%",
  fsdp:()=>motStatus("fscr")!=="run"?"0 kPa":Math.round((S.we?S.we.fs:WE.fs0)+wob2(0.09,6))+" kPa",fsld:()=>Math.round(S.rates.fiberIn/Math.max(1,P.screenMax)*100)+"%",
  thf:()=>{const D=G3.SPD;return D?(D.tl>150?"DIRTY":"CLEAR")+" "+Math.round(D.tl):"–";},thv:()=>{const D=G3.SPD;return D?Math.round(D.v*100)+"%":"–";},
  lvsp:()=>Math.round(C.lvlTarget.v)+"%",stc:()=>(4.2+((S.knob&&S.knob.any&&S.knob.x?S.knob.x.cp:5)-5)*0.12+wob2(0.04,15)*0.06).toFixed(2)+"%",dyef:()=>{const b=document.querySelector('#paperColor button[aria-pressed="true"]');return motStatus("dye")!=="run"||(b&&b.dataset.c==="white")?"0%":"62%";},
  jw:()=>dcsJw().toFixed(3),
  // v6.9.1: rush / drag, fpm: (jet-to-wire - 1) x wire speed. Jet faster than the wire is rush, slower is drag
  rd:()=>{if(S.pm!=="run")return "–";const v=dcsRD(),a=Math.round(Math.abs(v));return a<0.5?"0 fpm SQUARE":(v>0?"+":"−")+a+" fpm "+(v>0?"RUSH":"DRAG");},slc:()=>{const D=G3.SLC;return D?(12+3*D.v).toFixed(1)+" mm":"–";},
  wsp:()=>Math.round(S.pmSpeed/DCS_DRAW())+" fpm",psp:()=>Math.round(S.pmSpeed/DCS_DRAW()*1.015)+" fpm",dsp:()=>Math.round(S.pmSpeed/1.01)+" fpm",
  wwl:()=>S.we?Math.round(S.we.L/WE.silo*100)+"%":"–",wwg:()=>S.we?fmtGal(GAL(S.we.L)):"–",hbc:()=>S.pm==="run"&&S.we?S.we.hbc.toFixed(2)+"%":"–",
  bwv:()=>S.we?Math.round(S.we.v)+"% "+(S.we.m==="auto"?"AUTO":"MAN"):"–",dil:()=>fmtGpm(GPM(S.we?S.we.f.dil||0:0)),drn:()=>fmtGpm(GPM(S.we?S.we.f.drain||0:0)),pw:()=>fmtGpm(GPM(S.we?S.we.f.press||0:0)),hum:()=>Math.round(clamp(62+(motStatus("fog")!=="run"||dcsOn("fogfan")?24:0)+wob2(0.01,8)*3,0,100))+"%",
  dr1:()=>S.pm==="run"&&!dcsOn("shaft")?Math.round(48+S.pmSpeed/3300*34+wob2(0.12,9)*1.5)+"%":"0%",dr2:()=>S.pm==="run"&&!dcsOn("shaft")?Math.round(52+S.pmSpeed/3300*36+wob2(0.11,10)*1.5)+"%":"0%",
  spool:()=>Math.round(S.reel)+" / "+P.jumbo+" t",store:()=>Math.max(0,reelsAtWinder()-1)+" of "+P.storeReels,tu:()=>String(S.tot.turnups||0),
  wdr:()=>Math.round(C.wdr.v)+" t/h",wdt:()=>Math.round(S.rates.cut||0)+" t/h",hay:()=>String(S.tot.hayouts||0),rolls:()=>Math.round(S.conv||0)+" of "+P.convCap,
  dryl:()=>S.dry?Math.round(S.dry.load*100)+"%":"–",stm:()=>S.dry?Math.round(S.dry.steam/DRY.boiler*100)+"%":"–",
  grid:()=>SITE.env==="urban"&&dcsOn("brownout")?"BROWNOUT":"NORMAL",
  ifl:()=>fmtGpm(GPM(S.wat?S.wat.r.fresh:0)),evap:()=>fmtGpm(GPM(S.wat?S.wat.r.evap:0)),wcl:()=>S.wat?Math.round(S.wat.L/WAT.cap*100)+"%":"–",
  wcf:()=>{const W=S.wat;if(!W)return "–";return W.short>0?"EMPTY":W.r.make>5?"MAKEUP "+fmtGpm(GPM(W.r.make)):W.r.over>5?"OVERFLOW "+fmtGpm(GPM(W.r.over)):"BALANCED";},ice:()=>SITE.env!=="rural"?"–":dcsOn("icedintake")?"ICED":"CLEAR",twl:()=>Math.round(clamp(82+wob2(0.004,11)*6-(dcsOn("icedintake")?25:0),0,100))+"%",
  wuse:()=>{const W=S.wat;return W&&W.r.p>1?Math.round(GAL(W.r.fresh/W.r.p)).toLocaleString()+" gal/ton":"– gal/ton";},tss:()=>Math.round(tssNow())+" mg/L",perm:()=>dcsOn("permit")?"EXCEEDED":"OK",ofl:()=>fmtGpm(GPM(S.wat?S.wat.r.out:0)),wcv:()=>S.wat?fmtGal(GAL(S.wat.L)):"–",chv:()=>fmtGal(S.tank/(WAT.cs/100)*264.172),mcv:()=>fmtGal(MCHEST_GAL*knobRead().mcLvl/100),
  rej:()=>((S.rates.feed||0)*(1-P.yieldF*((S.M&&S.M.yieldMul)||1)*dpYield())).toFixed(1)+" t/h"};
// effluent suspended solids: fiber lost to the white water and broke push it up; 50 mg/L is the permit
// (v6.5.6: from the fiber actually going to the sewer and the flow carrying it, 07f; it was 28 plus the knobs' off-spec)
function tssNow(){return clamp(tssWater()+(dcsOn("permit")?30:0)+wob2(0.015,12)*3,5,120);}
const MIMIC_KNOB={SPOT:MIMIC.SPOT,WET:MIMIC.WET,DET:MIMIC.DET};
const MT=(x,y,k,t,f)=>[x,y,k,t,f];
MIMIC.SPOT={title:"STOCK PREP",h:312,trends:MIMIC_KNOB.SPOT.trends,
  // (v6.5.4: in process order. Top row left to right: conveyor, pulper, HD cleaner, coarse screens, LC cleaners, fine
  // screens. Down, then right to left: LW cleaners, thickener, stock storage chest, refiners, machine chest, fan pump)
  eq:[[8,66,76,40,"CONVEYOR"],[100,56,110,60,"PULPER"],[100,8,52,26,"RAGGER","s"],[158,8,52,26,"JUNK","s"],[228,66,78,40,"HD CLEANER"],[324,66,78,40,"COARSE SCR"],[420,66,88,40,"LC CLEANERS"],
    [524,66,86,40,"FINE SCR"],[525,206,86,40,"LW CLEANERS"],[420,206,88,40,"THICKENER"],[316,196,88,60,"STOCK CHEST"],[212,206,86,40,"REFINERS"],[104,196,92,60,"MACHINE CHEST"],[114,160,70,24,"DYE","s"],[8,206,80,40,"FAN PUMP"],[452,8,104,28,"WATER CHEST","s"]],
  ln:[["M84 86 H100"],["M210 86 H228"],["M306 86 H324"],["M402 86 H420"],["M508 86 H524"],["M610 86 H622 V226 H611"],["M525 226 H508"],["M420 226 H404"],["M316 226 H298"],["M212 226 H196"],["M104 226 H88"],["M8 226 H0"],
    ["M126 34 V56",1],["M184 34 V56",1],["M149 184 V196",1],["M452 22 H330 V66",1]],
  tags:[MT(48,22,"rgt","TENS",DV.rgt),MT(244,22,"jdc","DUMPS",DV.jdc),MT(46,124,"cvsp","SPD",DV.cvsp),MT(46,138,"cvst","",DV.cvst),MT(155,124,"cp","CONS",r=>kf(r.cp)+"%"),MT(155,138,"amps","ROTOR",r=>Math.round(r.amps)+" A"),MT(155,152,"pulpLvl","LEVEL",r=>Math.round(r.pulpLvl)+"%"),
    MT(267,124,"hddp","ΔP",DV.hddp),MT(363,124,"csdp","ΔP",DV.csdp),MT(363,138,"csrj","REJ",DV.csrj),MT(464,124,"lcdp","ΔP",DV.lcdp),MT(464,138,"lcrow","ROWS",DV.lcrow),MT(567,124,"fsdp","ΔP",DV.fsdp),MT(567,138,"fsld","LOAD",DV.fsld),
    MT(568,262,"lwdp","ΔP",DV.lwdp),MT(464,262,"thf","FILT",DV.thf),MT(464,276,"thv","SPIDER",DV.thv),MT(464,290,"thl","VAT",DV.thl),
    MT(360,186,"stc","CONS",DV.stc),MT(360,272,"lvl","LEVEL",()=>Math.round(S.tank/P.tankCap*100)+"%"),MT(360,286,"lvsp","SP",DV.lvsp),
    MT(255,196,"csf","CSF",r=>Math.round(r.csf)+" mL"),MT(255,262,"gap","GAP",r=>kf(r.gap,2)+" mm"),MT(255,276,"refkw","LOAD",r=>Math.round(r.refkw)+" kW"),
    MT(150,272,"mcCons","CONS",r=>kf(r.mcCons,2)+"%"),MT(150,286,"agit","AGIT",r=>r.agit+"%"),MT(212,176,"dyef","DYE",DV.dyef),MT(504,50,"wcl","LVL",DV.wcl),MT(56,262,"flow","FLOW",()=>fmtGpm(GPM(S.we?S.we.f.hb||0:0))),MT(56,276,"dil","DIL",DV.dil),MT(255,290,"kwh","ENERGY",r=>Math.round(r.kwh)+" kWh/t"),
    MT(360,300,"chv","VOL",DV.chv),MT(150,300,"mcv","VOL",DV.mcv),MT(504,62,"wcv","VOL",DV.wcv)]};   // (v6.7: chest volumes in gallons)
MIMIC.WET={title:"WET END",h:282,trends:MIMIC_KNOB.WET.trends,
  eq:[[520,8,104,30,"FOG FAN"],[14,80,74,70,"HEADBOX"],[104,105,190,25,"FORMING TABLE"],[110,214,100,26,"WW SILO","s"],[308,90,64,50,"COUCH"],[388,90,104,50,"PICK-UP FELT"],[508,80,118,70,()=>LV("shoe")?"SHOE PRESS":"TWIN PRESS"]],
  ln:[["M88 115 H104"],["M294 117 H308"],["M372 115 H388"],["M492 115 H508"],["M160 130 V214",1]],
  tags:[MT(51,172,"zones","ZONES",()=>(S.knob?S.knob.z.filter(v=>v).length:0)+"/12"),MT(51,194,"slc","SLICE",DV.slc),MT(51,70,"jw","J/W",DV.jw),MT(140,72,"wsp","WIRE",DV.wsp),MT(126,88,"rd","R/D",DV.rd),
    MT(240,172,"vac","VAC",r=>kf(r.vac)+" kPa"),MT(240,88,"edge","EDGE",r=>(r.edge>=0?"+":"")+Math.round(r.edge)+" mm"),MT(240,194,"gtrav","GUIDE",r=>r.gm?"AUTO "+Math.round(Math.min(1,r.gtrav)*100)+"%":"MAN"),
    MT(340,172,"couchSol","SOL",r=>kf(r.couchSol)+"%"),MT(340,194,"cs","PIT",r=>r.couch?"RUN":"STOP"),MT(440,172,"osc","OSC",r=>Math.round(r.osc)+"%"),
    MT(567,172,"pl","LOAD",r=>Math.round(r.pl)+" kN/m"),MT(567,194,"pressSol","SOL",r=>kf(r.pressSol)+"%"),MT(567,66,"psp","SPD",DV.psp),MT(260,232,"wwl","LEVEL",DV.wwl),MT(260,246,"wwg","VOL",DV.wwg),MT(370,232,"drain","DRAIN",DV.drn),MT(560,232,"pressw","PRESS",DV.pw),
    MT(60,216,"hbc","HBC",DV.hbc),MT(572,54,"hum","RH",DV.hum)]};   // (v6.9: the basis weight valve is FV-201, drawn by 50k)
MIMIC.DET={title:"DRY END",h:280,trends:MIMIC_KNOB.DET.trends,
  eq:[[14,96,80,50,"OPEN DRAW"],[112,80,130,80,"1ST SECTION"],[260,80,170,80,"2ND / 3RD SECTION"],[448,90,74,60,"REEL"],[546,90,84,60,"WINDER"],[546,214,84,30,"ROLL CONV","s"]],
  ln:[["M94 121 H112"],["M242 120 H260"],["M430 120 H448"],["M522 120 H546"],["M630 120 H636 V229 H630"],["M640 66 H177 V80 M345 66 V80",1]],   // (v6.5.4: the steam header comes in from the boiler house, UTIL)
  tags:[MT(54,172,"draw","DRAW",r=>kf(r.draw)+"%"),MT(54,194,"tension","TENS",r=>r.run?kf(r.tension,2):"–"),MT(177,176,"st1","STEAM",r=>Math.round(r.st1)+" kPa"),MT(177,192,"dr1","DRV",DV.dr1),MT(177,208,"dsp","SPD",DV.dsp),
    MT(345,176,"st3","STEAM",r=>Math.round(r.st3)+" kPa "+(S.dry&&S.dry.man!=null?"MAN":"AUTO")),MT(345,192,"steam","FLOW",r=>r.steam>0.5?kf(r.steam)+" t/h":"–"),MT(345,208,"dr2","DRV",DV.dr2),MT(345,224,"dryl","LOAD",DV.dryl),MT(560,58,"hdr","STEAM HDR",r=>Math.round(r.boiler*100)+"%"),
    MT(485,166,"moist","MOIST",r=>r.run?kf(r.moist)+"%":"–"),MT(485,180,"bw","BW",r=>r.run?kf(r.bw,2):"–"),MT(485,194,"spool","SPOOL",DV.spool),MT(485,208,"store","STORE",DV.store),MT(485,222,"tu","TURN-UPS",DV.tu),MT(485,84,"speed","SPEED",r=>Math.round(r.speed)+" fpm"),
    MT(588,166,"wdr","SP",DV.wdr),MT(588,180,"wdt","CUT",DV.wdt),MT(588,194,"hay","HAYOUTS",DV.hay),MT(588,262,"rolls","ROLLS",DV.rolls)]};
MIMIC.UTIL={title:"UTILITIES",h:270,trends:[["steam","Steam flow t/h","#7fb2ff",0,70],["boiler","Steam header (1 = full)","#ffb02e",0.5,1.05]],
  // (v6.5.4: the boiler and the power supply live here; they were on DET)
  eq:[[14,60,96,50,"RIVER INTAKE"],[134,60,96,50,"WATER TOWER"],[254,60,110,50,"MILL"],[388,60,110,50,"WASTEWATER"],[522,60,100,50,"OUTFALL"],[254,196,110,36,"LANDFILL","s"],
    [14,170,96,44,"GRID"],[134,170,96,44,"BOILER"]],
  ln:[["M110 85 H134"],["M230 85 H254"],["M364 85 H388"],["M498 85 H522"],["M309 110 V196",1],["M182 170 V164 H280 V110",1],["M62 170 V156 H270 V110",1]],
  tags:[MT(62,128,"ifl","FLOW",DV.ifl),MT(62,142,"ice","ICE",DV.ice),MT(182,128,"twl","LEVEL",DV.twl),MT(309,30,"wuse","FRESH",DV.wuse),MT(309,44,"evap","EVAP",DV.evap),MT(443,128,"tss","TSS",DV.tss),MT(443,142,"perm","PERMIT",DV.perm),
    MT(572,128,"ofl","FLOW",DV.ofl),MT(309,250,"rej","REJECTS",DV.rej),
    MT(62,232,"grid","POWER",DV.grid),MT(182,232,"boiler","HDR",r=>Math.round(r.boiler*100)+"%"),MT(182,246,"stm","STEAM",DV.stm),MT(182,260,"steam","FLOW",r=>r.steam>0.5?kf(r.steam)+" t/h":"–")]};
AREA_N.UTIL="Utilities";

/* ---- alarms by area (an upset shows on the screen of the equipment it hits) ---- */
const DCS_WET=new Set(["fabric","felt","slime","fogfan","oscfail","couchpit","runner"]),DCS_UTIL=new Set(["permit","icedintake","boiler","brownout"]);
function dcsArea(id){if(MOTEV[id])return MOTEV[id].a;if(DCS_UTIL.has(id))return "UTIL";const g=EV[id]&&EV[id].g;if(g==="stock")return "SPOT";if(g==="machine")return DCS_WET.has(id)?"WET":"DET";return null;}
function dcsAlarms(a,r,L){const al=(on,txt,hi)=>{if(on)L.push([txt,hi]);};vlvAlarms(a,L);   // (v6.9: the control valves, 50k)
  for(const i of S.inc){if(dcsArea(i.id)!==a)continue;const m=MOTEV[i.id];L.push([m?`${m.name.toUpperCase()} STOPPED · RESTART IN ${Math.ceil(i.left)} MIN`:EV[i.id].name.toUpperCase(),true]);}
  if(a==="SPOT"){al(S.tank/P.tankCap>0.92,"STOCK CHEST LEVEL HI",S.tank/P.tankCap>0.98);al(dcsOn("badocc"),"JUNK LOAD HIGH",true);
    {const Wt=S.wat;al(!!(Wt&&Wt.L<WAT.cap*0.25),Wt&&Wt.short>0?"WHITE WATER CHEST EMPTY · STOCK THICK":"WHITE WATER CHEST LEVEL LO",!!(Wt&&Wt.short>0));}
    for(const k of ["hd","lc","lw"]){const dp=purgeDp(k);al(dp>PURGE.base[k]+(PURGE.trip[k]-PURGE.base[k])*0.6,{hd:"HD CLEANER ΔP HI",lc:"LC CLEANERS ΔP HI",lw:"LW CLEANERS ΔP HI"}[k],dp>PURGE.base[k]+(PURGE.trip[k]-PURGE.base[k])*0.85);}}
  else if(a==="WET"){al(motStatus("fog")!=="run","MACHINE ROOM HUMIDITY HI",false);
    al(chemFloc()>0.02,"POLYMER HIGH · FLOCS IN THE SHEET",false);al(chemOn()&&fprNow()<82,"FIRST PASS RETENTION LO",fprNow()<78);al(chemRisk(),"POLYMER LOW · EFFLUENT PERMIT RISK",true);al(chemDep()>0,"STARCH HIGH · DEPOSITS",false);
    al(S.pm!=="run"&&CHEM_IDS.some(id=>chemMode(id)==="manual"&&chemFlow(id)>0),"CHEMICAL PUMP ON MANUAL · MACHINE DOWN",false);
    {const W=S.we;if(W&&S.pm==="run"){al(W.L<WE.silo*WE.makeL,W.cav>0?"WW SILO LOW · FAN PUMP CAVITATING":"WHITE WATER SILO LEVEL LO",W.cav>0);al(W.m==="manual","BASIS WEIGHT ON MANUAL",false);}}}
  else if(a==="DET"){al(S.pm==="break",`SHEET BREAK · ${({reel:"REEL",dryer:"DRYERS",press:"PRESSES"})[S.brkType]||"MACHINE"}`,true);al(S.pm==="spools","REEL STORE FULL: MACHINE HELD BACK",true);
    al(!!S.wdBlocked,"WINDER BLOCKED: CONVEYOR FULL",true);al(S.wd==="hayout","WINDER HAYOUT",true);
    const Dr=S.dry;if(Dr&&S.pm==="run"){al(dryLimited()&&Dr.m>DRY.m0+0.5,"DRYERS AT LIMIT · SHEET WET",true);al(!dryLimited()&&Dr.load>0.95,"DRYER LOAD HI",false);}
    al(!!(Dr&&Dr.trim>0.001),`SPEED TRIMMED ${Dr?Math.round(Dr.trim*100):0}% · DRYING THE SHEET`,!!(Dr&&Dr.wet));al(!!(Dr&&Dr.man!=null),"2ND / 3RD SECTION STEAM ON MANUAL",false);}
  else if(a==="UTIL"){const Dr=S.dry;al(!!(Dr&&Dr.vent>1),"STEAM VENTING (SHEET BREAK)",false);al(tssNow()>45&&!dcsOn("permit"),"EFFLUENT TSS HI",false);al(!!(Dr&&Dr.steam>DRY.boiler*0.95),"BOILER STEAM HI",!!(Dr&&Dr.hdr<0.97));al(!!(Dr&&Dr.hdr<0.8),"STEAM HEADER LO",!!(Dr&&Dr.hdr<0.7));}
  else if(a==="WATER"){const W=S.wat;   // (v6.7 water screen, 50f: the river intake and the permit show here as well as on UTIL)
    al(active("icedintake"),"RIVER INTAKE ICED · NO MAKEUP WATER",true);al(active("permit"),"WASTEWATER PERMIT EXCEEDED",true);
    al(!!(W&&W.short>0),"WHITE WATER CHEST EMPTY · STOCK THICK",true);al(!!(W&&W.short<=0&&W.L<WAT.cap*0.25),"WHITE WATER CHEST LEVEL LO",false);
    al(!!(W&&W.r.over>50),"WHITE WATER OVERFLOWING TO THE SEWER",false);al(tssNow()>45&&!active("permit"),"EFFLUENT TSS HI",false);}}

/* ---- setpoint, motor and purge rows ---- */
const DCARD=k=>{const cs=$("cards"),r=cs&&cs.querySelector(`.row[data-key="${k}"]`);return r?{inp:r.querySelector("input"),btn:r.querySelector(".auto")}:null;};
function dcsCardSet(k,v){const c=DCARD(k);if(!c||c.inp.disabled)return;c.inp.value=v;c.inp.dispatchEvent(new Event("input",{bubbles:true}));}
function dcsCardAuto(k){const c=DCARD(k);if(c&&c.btn&&!c.btn.disabled)c.btn.click();}
// each setpoint: [key, name, where, min, max, step, get, set, unit, card key for AUTO and the lock (or null), field note]
function dcsSetDefs(a){const D=()=>DCS_DRAW();
  if(a==="SPOT")return [
    ["cvsp","Bale conveyor speed","drives the pulper feed",0,100,1,()=>C.pulper.v/Math.max(1,P.pulperMax)*100,v=>dcsCardSet("pulper",v/100*P.pulperMax),"%","pulper"],
    ["lvt","Stock chest level target","the auto pulper aims here",20,95,1,()=>C.lvlTarget.v,v=>dcsCardSet("lvlTarget",v),"%","lvlTarget"],
    ["lvl","PM slows below","stock chest level",10,60,1,()=>C.lowLevel.v,v=>dcsCardSet("lowLevel",v),"%","lowLevel"],
    ["spi","Disk thickener spider valve","remote from the DCS · % to the clear side",0,100,1,()=>G3.SPD?G3.SPD.v*100:50,v=>{if(G3.SPD){G3.SPD.v=v/100;}},"%",null,1]];
  if(a==="WET")return [
    ["wsp","Machine speed (wire)","sets the reel by the section draws",Math.round(1200/D()),Math.round((3300+P.spBonus)/D()),5,()=>C.pmSp.v/D(),v=>dcsCardSet("pmSp",Math.round(v*D()/10)*10),"fpm","pmSp"],
    ["slv","Slice opening","remote from the DCS · B",-100,100,1,()=>G3.SLC?G3.SLC.v*100:0,v=>dcsSlice("v",v),"",null,1],
    ["slh","Slice lip position","remote from the DCS · L",-100,100,1,()=>G3.SLC?G3.SLC.h*100:0,v=>dcsSlice("h",v),"",null,1],
    // v6.8 the basis weight loop (07g): the setpoint (the grade's target, trimmed lighter if the strength will carry it) and the valve
    ["bws","Basis weight setpoint",(S.we&&S.we.lw===false)?`MANUAL · grade ${C.grade} target ${bwStd().toFixed(2)} lb · ring crush spec ${rctSpec()} lbf`:`AUTO-LW: holds ring crush ${Math.round((WE.lwM-1)*100)}% over spec (${(rctSpec()*WE.lwM).toFixed(1)} lbf) · grade target ${bwStd().toFixed(2)} lb`,+(bwStd()*(1+WE.trimMin)).toFixed(2),+(bwStd()*(1+WE.trimMax)).toFixed(2),0.05,()=>bwSp(),v=>bwSetTrim(v),"lb",null,0,
      {on:()=>!(S.we&&S.we.lw===false),flip:()=>{if(S.zen)return;const W=weState();W.lw=W.lw===false?true:false;log(`Basis weight setpoint: ${W.lw?"AUTO-LW (the lightweight optimizer)":"MANUAL"}`,"");}}],   // (v6.10 AUTO-LW, 07g)
    // v6.11.1 the wet-end chemicals (07l): AUTO is flow-paced at the standard kg/t; dragging the pump puts it on MANUAL
    // (v6.11.1 QA: on AUTO the slider is the ratio in kg/t; on MANUAL the pump's kg/h; the polymer row warns of the permit)
    ...CHEM_IDS.map((id,i)=>{const k=CHM[id],man=chemMode(id)==="manual",d=chemDose(id),sp=chemSp(id),dp=id==="pol"?2:1,risk=id==="pol"&&chemRisk()?" · PERMIT RISK: the wire is losing fines":"";
      return man?[id+"f",k.name,`MANUAL · pump held at ${chemFlow(id).toFixed(1)} kg/h · ${d==null?"machine down: going to the sewer":d.toFixed(dp)+" kg/t now"}${risk}`,
        0,k.fmax,k.step,()=>chemFlow(id),v=>chemSetFlow(id,v),"kg/h",null,0,{on:()=>false,flip:()=>chemSetMode(id,"auto")},i===0?"Wet-end chemicals":null]
       :[id+"f",k.name,`AUTO · flow-paced at the ratio (standard ${k.std} kg/t) · ${Math.round(chemFlow(id))} kg/h · ${k.where}${risk}`,
        0,k.max,k.rstep,()=>chemSp(id),v=>chemSetRatio(id,v),"kg/t",null,0,{on:()=>true,flip:()=>chemSetMode(id,"manual")},i===0?"Wet-end chemicals":null];})];
  if(a==="DET")return [
    ["wsp","Machine speed (wire)","same setpoint as on WET",Math.round(1200/D()),Math.round((3300+P.spBonus)/D()),5,()=>C.pmSp.v/D(),v=>dcsCardSet("pmSp",Math.round(v*D()/10)*10),"fpm","pmSp"],
    ["wdr","Winder speed","",0,P.winderMax,1,()=>C.wdr.v,v=>dcsCardSet("wdr",v),"t/h","wdr"]];   // (v6.9: the 2nd / 3rd section steam is PV-302 / PV-303 under QC-300: tap them on the picture, 50k)
  return [];}
function dcsSlice(k,v){const D=G3.SLC;if(!D||G3.slcFix||S.zen)return;slcSet(k,v/100);const g=D.geo();if(g.lipX-g.wet>=6.8&&typeof slcBreak==="function")slcBreak();}
function dcsSetRows(a,cs){const defs=dcsSetDefs(a);
  if(a==="UTIL")cs.appendChild(kEl("p","dcsfield","Monitoring only: water, effluent and rejects. The permit and the river intake show here when they act up. The full water balance is on WATER."));
  if(a==="WATER")cs.appendChild(kEl("p","dcsfield","Monitoring only: fresh water comes in for the showers and seal water and to top up the white water chest; the chest feeds stock prep's dilution; what's left goes through the clarifier to the outfall."));
  if(a==="SPOT"||a==="WET"){const row=kEl("div","dcsrow dcsx");
    if(a==="SPOT"){row.innerHTML=`<div class="dcsn"><b>Dye: paper color</b><small>dye pump on the machine chest</small></div><div class="seg kseg" role="group" aria-label="Paper color"><button type="button" data-dye="brown">BROWN</button><button type="button" data-dye="white">WHITE</button></div>`;
      row.querySelectorAll("[data-dye]").forEach(b=>b.addEventListener("click",()=>{const pc=document.querySelector(`#paperColor button[data-c="${b.dataset.dye}"]`);if(pc)pc.click();dcsSync();}));}
    else{row.innerHTML=`<div class="dcsn"><b>Grade</b><small>set by the market planner from customer orders</small></div><select disabled data-dgrade aria-label="Grade">${Object.keys(GRADES).map(g=>`<option value="${g}">${g} · ${GRADES[g].bw} lb</option>`).join("")}</select>`;}
    cs.appendChild(row);}
  for(const d of defs){const [k,name,where,mn,mx,st,,,,card]=d,row=kEl("div","dcsrow dcsx");row.dataset.ds=k;if(d[12])cs.appendChild(kEl("div","dcssub",d[12]));
    row.innerHTML=`<div class="dcsn"><b>${name}</b><small>${where}</small></div><label class="spis"><input type="range" min="${mn}" max="${mx}" step="${st}" data-dsv aria-label="${name}"/></label><div class="kval"><b data-dsb></b></div>${card||d[11]?`<button type="button" class="reroll kstd" data-dsa>AUTO</button>`:""}`;
    const cur=()=>dcsSetDefs(a).find(x=>x[0]===k)||d;   // (v6.11.1: a row can change what it sets, e.g. a chemical pump's ratio on AUTO, kg/h on MANUAL)
    row.querySelector("[data-dsv]").addEventListener("input",e=>{cur()[7](+e.target.value);dcsSync();});
    if(card)row.querySelector("[data-dsa]").addEventListener("click",()=>{dcsCardAuto(card);dcsSync();});
    else if(d[11])row.querySelector("[data-dsa]").addEventListener("click",()=>{cur()[11].flip();dcsSync();});
    cs.appendChild(row);}}
function dcsMotRows(a,b){const ms=MOTORS.filter(m=>m.a===a),pg=a==="SPOT"?["hd","lc","lw"]:[];if(!ms.length&&!pg.length)return;
  const box=kEl("div","dcsctl");box.appendChild(kEl("div","dcssub","Motors"+(pg.length?" and reject purges":"")));
  ms.forEach(m=>{const row=kEl("div","dcsrow dcsx dcsm");row.dataset.dm=m.id;
    row.innerHTML=`<div class="dcsn"><b>${m.name}</b><small data-dms></small></div><div class="seg kseg" role="group" aria-label="${m.name}"><button type="button" data-mv="on">ON</button><button type="button" data-mv="off">OFF</button><button type="button" data-mv="auto">AUTO</button></div>`;
    row.querySelectorAll("[data-mv]").forEach(x=>x.addEventListener("click",()=>{motSet(m.id,x.dataset.mv);kuiRefresh();}));box.appendChild(row);});
  pg.forEach(k=>{const row=kEl("div","dcsrow dcsx dcsm");row.dataset.dp=k;
    row.innerHTML=`<div class="dcsn"><b>${PURGE.name[k]}</b><small data-dps></small></div><div class="seg kseg" role="group" aria-label="${PURGE.name[k]}"><button type="button" data-pv="auto">AUTO</button><button type="button" data-pv="manual">MANUAL</button></div><button type="button" class="reroll kstd" data-pp>PURGE</button>`;
    row.querySelectorAll("[data-pv]").forEach(x=>x.addEventListener("click",()=>{purgeSet(k,x.dataset.pv);kuiRefresh();}));row.querySelector("[data-pp]").addEventListener("click",()=>{purgeNow(k);kuiRefresh();});box.appendChild(row);});
  if(a==="SPOT")box.appendChild(kEl("p","dcsfield",`OFF stops that step like a breakdown; the operators start it again after ${MOT_RESTART} min. A purge left in MANUAL builds pressure until the rejects plug.`));
  b.appendChild(box);}
// keep every row on this screen in step with the sim and the Process flow controls
function dcsSync(){const o=$("dcsOv");if(!o||o.hidden||!KUI.st)return;const a=KUI.st,defs=dcsSetDefs(a);
  o.querySelectorAll("[data-ds]").forEach(row=>{const d=defs.find(x=>x[0]===row.dataset.ds);if(!d)return;const inp=row.querySelector("[data-dsv]"),c=d[9]?DCARD(d[9]):null,lock=!!(c&&c.inp.disabled)||!!S.zen;
    if(inp.max!==String(d[4]))inp.max=d[4];if(inp.min!==String(d[3]))inp.min=d[3];if(inp.step!==String(d[5]))inp.step=d[5];if(actEl(inp)!==inp)inp.value=d[6]();inp.disabled=lock||(d[10]&&!G3[d[0]==="spi"?"SPD":"SLC"]);
    const bv=row.querySelector("[data-dsb]"),t=`${(+d[6]()).toFixed(d[5]<0.1?2:d[5]<1?1:0)} ${d[8]}`;if(bv.textContent!==t)bv.textContent=t;
    if(d[11]){const ab=row.querySelector("[data-dsa]"),au=d[11].on();ab.textContent=au?"AUTO":"MANUAL";ab.setAttribute("aria-pressed",String(au));ab.disabled=S.zen;
      const sm=row.querySelector(".dcsn small");if(sm&&sm.textContent!==d[2])sm.textContent=d[2];}
    const ab=row.querySelector("[data-dsa]");if(ab&&c){const au=C[d[9]].auto,txt=c.btn?(au?"AUTO":"MANUAL"):"";ab.hidden=!c.btn;ab.textContent=txt;ab.setAttribute("aria-pressed",String(!!au));ab.disabled=lock;}
    row.classList.toggle("locked",lock);});
  const pc=(document.querySelector('#paperColor button[aria-pressed="true"]')||{}).dataset;o.querySelectorAll("[data-dye]").forEach(b=>b.setAttribute("aria-pressed",String(!!pc&&b.dataset.dye===pc.c)));
  const gs=o.querySelector("[data-dgrade]");if(gs&&gs.value!==C.grade)gs.value=C.grade;
  o.querySelectorAll("[data-dm]").forEach(row=>{const id=row.dataset.dm,st=motState(id),ms=motStatus(id),i=S.inc.find(x=>x.id===MOTN[id].ev);
    row.querySelectorAll("[data-mv]").forEach(x=>{x.setAttribute("aria-pressed",String(x.dataset.mv===st));x.disabled=S.zen;});
    const t=ms==="off"?`STOPPED · operators restart in ${i?Math.ceil(i.left):0} min`:ms==="trip"?"TRIPPED · "+EV[MOTN[id].like].name.toLowerCase():st==="on"?"RUNNING · hand":"RUNNING · auto",s=row.querySelector("[data-dms]");if(s.textContent!==t)s.textContent=t;row.classList.toggle("bad",ms!=="run");});
  o.querySelectorAll("[data-dp]").forEach(row=>{const k=row.dataset.dp,m=purgeMode(k),dp=purgeDp(k);row.querySelectorAll("[data-pv]").forEach(x=>{x.setAttribute("aria-pressed",String(x.dataset.pv===m));x.disabled=S.zen;});
    row.querySelector("[data-pp]").disabled=m!=="manual"||S.zen;const t=`ΔP ${Math.round(dp)} kPa · plugs at ${PURGE.trip[k]}`+(m==="manual"?" · purge before it plugs":""),s=row.querySelector("[data-dps]");if(s.textContent!==t)s.textContent=t;
    row.classList.toggle("bad",dp>PURGE.base[k]+(PURGE.trip[k]-PURGE.base[k])*0.6);});}
G3.dcs={motSet,purgeSet,purgeNow,motStatus,dcsArea};
G3.we={state:weState,bwTrue,bwMeas,bwSp,setMode:bwSetMode,setValve:bwSetValve,setTrim:bwSetTrim,rct:()=>rctNow(bwMeas()),rctSpec,dpYield,kwhNow,cpBale,premShare,gapOf,csfOf};   // (v6.8 tests: tools/relcheck.py)   // (tests: tools/dcscheck.py)

/* ---- v6.5 b4 pictograms: each box is drawn as its equipment, in the classic coloured DCS style (steel vessels, blue
   water, brown stock, cream paper). Grey outline when normal; colour only when it isn't: amber = warning, red = tripped
   or down by an upset, faded = stopped by the operator or idle. Static (no motion); vessels show their real level. The
   name sits small along the bottom of the box, so the tags keep their places. ---- */
const PG_ST=s=>({off:"st-off",trip:"st-trip",warn:"st-warn"})[s]||"st-ok";
const stM=id=>{const s=motStatus(id);return s==="off"?"off":s==="trip"?"trip":"ok";};
const stI=(...ids)=>ids.some(dcsOn)?"trip":"ok";
const stDp=k=>purgeDp(k)>PURGE.base[k]+(PURGE.trip[k]-PURGE.base[k])*0.6?"warn":"ok";
const stBrk=w=>S.pm==="break"&&S.brkType===w?"trip":"ok";
const or=(...s)=>s.includes("trip")?"trip":s.includes("off")?"off":s.includes("warn")?"warn":"ok";
// drawing helpers: (x,y,w,h) is the drawing area (the box less the name strip)
const P_={
  tank:(x,y,w,h,lv,media)=>{const tw=Math.min(w*0.62,h*1.1),tx=x+(w-tw)/2,r=tw/2,ry=Math.min(5,h*0.12);
    return `<path class="pe pg-steel" d="M${tx} ${y+ry} V${y+h-ry} A${r} ${ry} 0 0 0 ${tx+tw} ${y+h-ry} V${y+ry} A${r} ${ry} 0 0 0 ${tx} ${y+ry}Z"/>`+
      `<rect class="pg-${media||"stock"}" data-lv="${lv}" x="${tx+2}" y="${y+ry}" width="${tw-4}" height="${h-2*ry}" data-y0="${y+ry}" data-h0="${h-2*ry}"/>`+
      `<ellipse class="pe pg-top" cx="${x+w/2}" cy="${y+ry}" rx="${r}" ry="${ry}"/>`;},
  pump:(cx,cy,r)=>`<circle class="pe pg-motor" cx="${cx}" cy="${cy}" r="${r}"/><path class="pg-mark" d="M${cx-r*0.45} ${cy-r*0.55} L${cx+r*0.6} ${cy} L${cx-r*0.45} ${cy+r*0.55}Z"/>`,
  motor:(x,y,w,h)=>`<rect class="pe pg-motor" x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/><line class="pg-fin" x1="${x+w*0.3}" y1="${y+1}" x2="${x+w*0.3}" y2="${y+h-1}"/><line class="pg-fin" x1="${x+w*0.6}" y1="${y+1}" x2="${x+w*0.6}" y2="${y+h-1}"/>`,
  roll:(cx,cy,r,cls)=>`<circle class="pe ${cls||"pg-steel"}" cx="${cx}" cy="${cy}" r="${r}"/><circle class="pg-hub" cx="${cx}" cy="${cy}" r="${Math.max(1,r*0.25)}"/>`};
const PIC={
  conveyor:(x,y,w,h)=>{const x0=x+4,y0=y+h-4,x1=x+w-6,y1=y+4;let s=`<path class="pe pg-belt" d="M${x0} ${y0} L${x1} ${y1}"/>`+P_.roll(x0,y0,3)+P_.roll(x1,y1,3);
    for(let k=0;k<3;k++){const t=0.2+k*0.28,bx=x0+(x1-x0)*t,by=y0+(y1-y0)*t;s+=`<rect class="pe pg-bale" x="${bx-5}" y="${by-9}" width="10" height="8" transform="rotate(${Math.atan2(y1-y0,x1-x0)*57.3} ${bx} ${by})"/>`;}return s;},
  pulper:(x,y,w,h,lv)=>{const t=y+2,b=y+h-8,l=x+w*0.15,r=x+w*0.85;return `<path class="pe pg-steel" d="M${l} ${t} L${l+6} ${b} H${r-6} L${r} ${t}"/>`+
      `<path class="pg-stock" data-lvp="${lv}" d="M${l+3} ${t+(b-t)*0.4} L${l+7} ${b-2} H${r-7} L${r-3} ${t+(b-t)*0.4}Z"/>`+`<path class="pg-mark" d="M${x+w/2-6} ${b-5} l6 -4 l6 4"/>`+P_.motor(x+w/2-7,b+1,14,6);},
  winch:(x,y,w,h)=>P_.roll(x+w/2,y+h*0.45,Math.min(w,h)*0.32)+`<path class="pe pg-rope" d="M${x+w/2+Math.min(w,h)*0.32} ${y+h*0.45} V${y+h}"/>`,
  hopper:(x,y,w,h)=>`<path class="pe pg-steel" d="M${x+w*0.2} ${y+1} H${x+w*0.8} L${x+w*0.58} ${y+h-1} H${x+w*0.42}Z"/>`,
  cyclone:(x,y,w,h)=>{const cx=x+w/2,cw=Math.min(w*0.32,h*0.5);return `<path class="pe pg-steel" d="M${cx-cw/2} ${y+1} H${cx+cw/2} V${y+h*0.42} L${cx+2} ${y+h-1} H${cx-2} L${cx-cw/2} ${y+h*0.42}Z"/><path class="pe pg-pipe" d="M${cx-cw/2-8} ${y+5} H${cx-cw/2}"/>`;},
  screen:(x,y,w,h)=>{const cx=x+w/2,cw=Math.min(w*0.34,h*0.9);return `<rect class="pe pg-steel" x="${cx-cw/2}" y="${y+1}" width="${cw}" height="${h-8}" rx="4"/><rect class="pg-basket" x="${cx-cw/2+4}" y="${y+5}" width="${cw-8}" height="${h-16}"/>`+P_.motor(cx-6,y+h-7,12,6);},
  cleaners:(x,y,w,h,rows)=>{let s="";const n=6,dw=w*0.7/n,x0=x+w*0.15;rows=rows||1;const rh=(h-2)/rows;
    for(let r=0;r<rows;r++)for(let k=0;k<n;k++){const cx=x0+dw*(k+0.5),t=y+1+r*rh;s+=`<path class="pe pg-steel" d="M${cx-dw*0.35} ${t} H${cx+dw*0.35} L${cx+0.8} ${t+rh-2} H${cx-0.8}Z"/>`;}
    return s+`<path class="pe pg-pipe" d="M${x+w*0.1} ${y+3} H${x+w*0.9}"/>`;},
  thickener:(x,y,w,h)=>{let s=`<rect class="pe pg-steel" x="${x+w*0.1}" y="${y+h*0.3}" width="${w*0.8}" height="${h*0.65}" rx="5"/>`;
    for(let k=0;k<5;k++)s+=`<ellipse class="pe pg-disk" cx="${x+w*0.2+k*w*0.15}" cy="${y+h*0.45}" rx="3" ry="${h*0.42}"/>`;return s+`<path class="pg-mark2" d="M${x+w*0.12} ${y+h*0.45} H${x+w*0.88}"/>`;},
  refiner:(x,y,w,h)=>{const cy=y+h/2;return `<rect class="pe pg-steel" x="${x+w*0.18}" y="${cy-h*0.42}" width="${w*0.34}" height="${h*0.84}" rx="3"/><rect class="pg-disk" x="${x+w*0.31}" y="${cy-h*0.36}" width="3" height="${h*0.72}"/><rect class="pg-disk" x="${x+w*0.37}" y="${cy-h*0.36}" width="3" height="${h*0.72}"/>`+
    `<line class="pe pg-pipe" x1="${x+w*0.52}" y1="${cy}" x2="${x+w*0.6}" y2="${cy}"/>`+P_.motor(x+w*0.6,cy-h*0.3,w*0.24,h*0.6);},
  drum:(x,y,w,h)=>{const dw=Math.min(w*0.32,h*1.1);return `<rect class="pe pg-dye" x="${x+w*0.2}" y="${y+1}" width="${dw}" height="${h-2}" rx="3"/>`+P_.pump(x+w*0.72,y+h/2,Math.min(h*0.42,7));},
  pumpBox:(x,y,w,h)=>P_.pump(x+w*0.38,y+h/2,Math.min(h*0.42,13))+P_.motor(x+w*0.38+Math.min(h*0.42,13)+3,y+h/2-5,w*0.22,10),
  headbox:(x,y,w,h)=>`<path class="pe pg-steel" d="M${x+6} ${y+3} H${x+w*0.62} L${x+w-6} ${y+h*0.55} L${x+w-6} ${y+h*0.7} L${x+w*0.62} ${y+h-3} H${x+6}Z"/><path class="pg-water2" d="M${x+w-6} ${y+h*0.62} H${x+w}"/>`,
  table:(x,y,w,h)=>{let s=`<path class="pe pg-wire" d="M${x+6} ${y+h*0.35} H${x+w-6}"/>`+P_.roll(x+6,y+h*0.35+3,4)+P_.roll(x+w-6,y+h*0.35+3,4);
    for(let k=1;k<9;k++)s+=`<path class="pg-foil" d="M${x+6+k*(w-12)/9-4} ${y+h*0.35+3} h8 l-4 4z"/>`;return s;},
  roll1:(x,y,w,h)=>P_.roll(x+w/2,y+h/2,Math.min(w,h)*0.42)+`<path class="pe pg-steel" d="M${x+w/2-6} ${y+h-2} h12 v-4 h-12z"/>`,
  felt:(x,y,w,h)=>{const r=Math.min(h*0.22,7);return `<rect class="pe pg-felt" x="${x+r}" y="${y+2}" width="${w-2*r}" height="${h-4}" rx="${r}" fill-opacity="0"/>`+P_.roll(x+r+2,y+2+r,r,"pg-steel")+P_.roll(x+w-r-2,y+2+r,r)+P_.roll(x+w/2,y+h-2-r,r);},
  press:(x,y,w,h)=>{const r=Math.min(w*0.2,h*0.24),cx=x+w/2;return P_.roll(cx,y+h/2-r,r)+(LV("shoe")?`<path class="pe pg-steel" d="M${cx-r*1.4} ${y+h/2} Q${cx} ${y+h/2+r*0.5} ${cx+r*1.4} ${y+h/2} V${y+h/2+r*1.2} H${cx-r*1.4}Z"/>`:P_.roll(cx,y+h/2+r,r));},
  fan:(x,y,w,h)=>{const cx=x+w*0.3,cy=y+h/2,r=Math.min(h*0.45,10);let s=`<circle class="pe pg-steel" cx="${cx}" cy="${cy}" r="${r}"/>`;for(let k=0;k<3;k++){const a=k*2.094;s+=`<path class="pg-mark" d="M${cx} ${cy} L${cx+Math.cos(a)*r*0.9} ${cy+Math.sin(a)*r*0.9} L${cx+Math.cos(a+0.6)*r*0.8} ${cy+Math.sin(a+0.6)*r*0.8}Z"/>`;}
    return s+`<path class="pe pg-pipe" d="M${cx+r} ${cy} H${x+w-6} V${y+2}"/>`;},
  draw:(x,y,w,h)=>P_.roll(x+w*0.2,y+h*0.6,6)+P_.roll(x+w*0.8,y+h*0.4,6)+`<path class="pg-sheet" d="M${x+w*0.2} ${y+h*0.6-6} L${x+w*0.8} ${y+h*0.4-6}"/>`,
  dryers:(x,y,w,h,n)=>{let s="";n=n||4;const r=Math.min((w-12)/(n*2.3),h*0.2),st=(w-12-2*r)/(n-0.5);
    for(let k=0;k<n;k++){const cx=x+6+r+k*st;s+=P_.roll(cx,y+h*0.3,r)+P_.roll(cx+st/2,y+h*0.72,r);}
    return `<rect class="pe pg-hood" x="${x+2}" y="${y+1}" width="${w-4}" height="${h-2}" rx="4"/>`+s;},
  reel:(x,y,w,h)=>P_.roll(x+w*0.3,y+h*0.62,Math.min(h*0.22,8))+`<circle class="pe pg-paper" data-spool="1" cx="${x+w*0.65}" cy="${y+h*0.42}" r="${Math.min(h*0.38,w*0.3)}"/><circle class="pg-hub" cx="${x+w*0.65}" cy="${y+h*0.42}" r="2"/>`,
  winder:(x,y,w,h)=>P_.roll(x+w*0.36,y+h*0.72,Math.min(h*0.2,7))+P_.roll(x+w*0.64,y+h*0.72,Math.min(h*0.2,7))+`<circle class="pe pg-paper" cx="${x+w/2}" cy="${y+h*0.38}" r="${Math.min(h*0.3,10)}"/>`,
  rollconv:(x,y,w,h)=>{let s=`<path class="pe pg-belt" d="M${x+4} ${y+h-3} H${x+w-4}"/>`;const n=Math.round(S.conv||0);for(let k=0;k<3;k++)s+=`<circle class="pe ${k<n?"pg-paper":"pg-empty"}" cx="${x+w*0.25+k*w*0.25}" cy="${y+h-3-Math.min(h*0.38,7)}" r="${Math.min(h*0.38,7)}"/>`;return s;},
  grid:(x,y,w,h)=>{const cx=x+w*0.32;return `<path class="pe pg-pylon" d="M${cx-6} ${y+h-1} L${cx} ${y+2} L${cx+6} ${y+h-1} M${cx-5} ${y+h*0.35} H${cx+5} M${cx-3.5} ${y+h*0.6} H${cx+3.5}"/><path class="pg-bolt" d="M${x+w*0.68} ${y+2} l-6 ${h*0.5} h5 l-4 ${h*0.45} l9 -${h*0.6} h-5z"/>`;},
  boiler:(x,y,w,h)=>`<rect class="pe pg-steel" x="${x+w*0.15}" y="${y+2}" width="${w*0.5}" height="${h-4}" rx="4"/><path class="pg-flame" d="M${x+w*0.4} ${y+h-4} q-6 -6 0 -${h*0.55} q6 ${h*0.3} 0 ${h*0.55}z"/><path class="pe pg-pipe" d="M${x+w*0.65} ${y+6} H${x+w-6}"/>`,
  intake:(x,y,w,h)=>`<path class="pg-water2" d="M${x+4} ${y+h*0.7} q6 -4 12 0 t12 0 t12 0 t12 0"/><path class="pe pg-pipe" d="M${x+w*0.35} ${y+h*0.7} V${y+h*0.3} H${x+w-6}"/>`+P_.pump(x+w*0.62,y+h*0.3,Math.min(h*0.22,8)),
  tower:(x,y,w,h,lv)=>P_.tank(x+w*0.2,y,w*0.6,h*0.6,lv,"water")+`<path class="pe pg-pylon" d="M${x+w*0.38} ${y+h*0.6} L${x+w*0.32} ${y+h} M${x+w*0.62} ${y+h*0.6} L${x+w*0.68} ${y+h}"/>`,
  mill:(x,y,w,h)=>`<path class="pe pg-steel" d="M${x+w*0.1} ${y+h-1} V${y+h*0.4} L${x+w*0.3} ${y+h*0.15} V${y+h*0.4} L${x+w*0.5} ${y+h*0.15} V${y+h*0.4} L${x+w*0.7} ${y+h*0.15} V${y+h*0.4} H${x+w*0.9} V${y+h-1}Z"/><rect class="pe pg-steel" x="${x+w*0.78}" y="${y+1}" width="5" height="${h*0.45}"/>`,
  clarifier:(x,y,w,h)=>`<ellipse class="pe pg-steel" cx="${x+w/2}" cy="${y+h/2}" rx="${Math.min(w*0.32,h*0.9)}" ry="${h*0.42}"/><ellipse class="pg-water" cx="${x+w/2}" cy="${y+h/2}" rx="${Math.min(w*0.32,h*0.9)-4}" ry="${h*0.42-3}"/><path class="pg-mark2" d="M${x+w/2} ${y+h/2} L${x+w/2+Math.min(w*0.3,h*0.8)} ${y+h/2-3}"/>`,
  outfall:(x,y,w,h)=>`<path class="pe pg-pipe" d="M${x+4} ${y+h*0.3} H${x+w*0.55} V${y+h*0.55}"/><path class="pg-water2" d="M${x+w*0.3} ${y+h*0.75} q6 -4 12 0 t12 0 t12 0 t12 0"/>`,
  landfill:(x,y,w,h)=>`<path class="pe pg-stock" d="M${x+w*0.12} ${y+h-1} Q${x+w*0.5} ${y-2} ${x+w*0.88} ${y+h-1}Z"/>`};
// per screen, in the order of MIMIC[a].eq: [pictogram, state, extra]
const PGX={
  SPOT:[["conveyor",()=>stM("conv")],["pulper",()=>or(stI("overflow","rotortrip","flares"),G3.dcs&&knobRead().pulpLvl>92?"warn":"ok",motStatus("ragger")==="off"?"off":"ok"),"pulp"],["winch",()=>or(stM("ragger"),stI("ragger"))],["hopper",()=>or(stM("junk"),dcsOn("badocc")?"warn":"ok")],
    // (v6.5.4: in the picture's new process order, index for index with MIMIC.SPOT.eq)
    ["cyclone",()=>or(stI("hdblow"),stDp("hd"))],["screen",()=>or(stM("cscr"),stI("cscreen"))],["cleaners",()=>or(stI("lcplug"),stDp("lc")),"lcrows"],["screen",()=>or(stM("fscr"),stI("fscreen"))],
    ["cleaners",()=>or(stI("lwplug"),stDp("lw"))],["thickener",()=>or(stI("thkblow"),G3.SPD&&G3.SPD.strain>0.05?"warn":"ok")],
    ["tank",()=>or(stI("chestover"),S.tank/P.tankCap>0.92?"warn":"ok"),"chest"],["refiner",()=>stI("refclash")],["tank",()=>{const y=mcLvlNow();return y<MCH.trip+5?"bad":y<40?"warn":"ok";},"mc"],["drum",()=>or(stM("dye"),stI("dye"))],["pumpBox",()=>S.pm==="run"?"ok":"off"],
    ["tank",()=>S.wat&&S.wat.short>0?"trip":S.wat&&S.wat.L<WAT.cap*0.25?"warn":"ok","wwc"]],
  WET:[["fan",()=>or(stM("fog"),stI("fogfan"))],["headbox",()=>"ok"],["table",()=>or(stI("fabric"),dcsOn("slime")?"warn":"ok",stBrk("press"))],["tank",()=>"ok","silo"],
    ["roll1",()=>stI("couchpit")],["felt",()=>stI("felt","oscfail")],["press",()=>stBrk("press")]],
  DET:[["draw",()=>stBrk("dryer")],["dryers",()=>stI("shaft","dryerfire","wrap","steamjoint"),"d4"],["dryers",()=>or(stI("shaft","dryerfire","wrap","steamjoint"),dryLimited()&&S.dry.m>DRY.m0+0.5?"trip":S.dry&&S.pm==="run"&&S.dry.load>0.95?"warn":"ok"),"d6"],
    ["reel",()=>or(stBrk("reel"),S.pm==="spools"?"warn":"ok")],["winder",()=>or(stI("winderdown","birdhay","tiedrolls"),S.wd==="hayout"?"warn":"ok")],["rollconv",()=>S.wdBlocked?"warn":"ok"]],
  UTIL:[["intake",()=>stI("icedintake")],["tower",()=>dcsOn("icedintake")?"warn":"ok","tower"],["mill",()=>S.pm==="run"?"ok":"off"],["clarifier",()=>or(stI("permit"),tssNow()>45?"warn":"ok")],["outfall",()=>"ok"],["landfill",()=>"ok"],
    ["grid",()=>stI("brownout")],["boiler",()=>or(stI("boiler"),S.dry&&S.dry.steam>DRY.boiler*0.95?"warn":"ok")]]};   // (v6.5.4: moved from DET)
// levels (0-1) for the vessels
const PG_LV={pulp:()=>clamp(knobRead().pulpLvl/100,0,1),chest:()=>clamp(S.tank/P.tankCap,0,1),mc:()=>clamp(knobRead().mcLvl/100,0,1),silo:()=>clamp(parseFloat(DV.wwl())/100,0,1),wwc:()=>S.wat?clamp(S.wat.L/WAT.cap,0,1):0.55,tower:()=>clamp(parseFloat(DV.twl())/100,0,1)};
function dcsPic(a,e,i){const pg=PGX[a]&&PGX[a][i];if(!pg)return null;const [x,y,w,h,t,sm]=e,lab=typeof t==="function"?t():t,nh=sm?9:11,dh=h-nh,ex=pg[2];
  let body;const [k]=pg;
  if(k==="tank")body=P_.tank(x,y+1,w,dh-1,ex,ex==="silo"||ex==="tower"||ex==="wwc"?"water":"stock");
  else if(k==="cleaners")body=PIC.cleaners(x,y,w,dh,ex==="lcrows"&&LV("clean")>0?2:1);
  else if(k==="dryers")body=PIC.dryers(x,y,w,dh,ex==="d6"?6:4);
  else body=PIC[k](x,y,w,dh,ex);
  return `<g class="pg ${PG_ST(pg[1]())}" data-pg="${i}"><title>${lab}</title><rect class="pg-bg" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>${body}<text x="${x+w/2}" y="${y+h-2.5}" class="pgn">${lab}</text></g>`;}
// each refresh: state classes and vessel levels
function dcsPicSync(a){const o=$("dcsOv");if(!o||!PGX[a])return;
  o.querySelectorAll(".mimic [data-pg]").forEach(g=>{const pg=PGX[a][+g.dataset.pg];if(!pg)return;let s;try{s=PG_ST(pg[1]());}catch(e){s="st-ok";}if(g.dataset.s!==s){g.dataset.s=s;g.setAttribute("class","pg "+s);}
    g.querySelectorAll("[data-lv]").forEach(r=>{const f=PG_LV[r.dataset.lv];if(!f)return;const v=f(),h0=+r.dataset.h0,y0=+r.dataset.y0,hh=Math.max(0,h0*v);r.setAttribute("y",(y0+h0-hh).toFixed(1));r.setAttribute("height",hh.toFixed(1));});
    g.querySelectorAll("[data-lvp]").forEach(p=>{const f=PG_LV[p.dataset.lvp];if(f)p.style.opacity=(0.35+0.65*f()).toFixed(2);});});}
G3.vlv={view:vlvView,touch:vlvTouch,setMode:vlvSetMode,setSP:vlvSetSP,setOP:vlvSetOP,setTune:vlvSetTune,setValve:vlvSetValve,revert:vlvRevert,bump:vlvBump,bumpStop:vlvBumpStop,
  fit:vFit,lambda:vLambda,health:vlvHealth,trace:vlvTrace,challenge:vlvChallenge,chRef:vlvChRef,stars:vlvStars,isDef:vIsDef,T:vlvT,DEF:VD,CH:VCH,state:()=>S.vlv,catchUp:vlvCatch};   // v6.9 tests (tools/valvecheck.py)
