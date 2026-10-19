/* ---- v6.5 b3 the DCS expansion (claude/dcs-expansion-spec.md): bigger SPOT / WET / DET pictures and a UTIL screen ----
   The pictures (MIMIC, 50b) are replaced here: every box the game has an upset or a control for. Readings only read the
   sim (no dice). Setpoints that exist in Process flow > Controls are driven through those same controls (the card inputs),
   so the two stay in step and keep their season lock; the fiddly knobs' field panels (slice, spider valve) still work.
   Motors and reject purges: 07c-motors.js. */
const DCS_DRAW=()=>1.015*(1+knobVal("draw")/100)*1.01;   // wire -> presses, press-to-dryer draw (the knob), dryers -> reel
const wob2=(f,k)=>Math.sin(S.t*f+k)*0.6+Math.sin(S.t*f*2.7+k*2)*0.4;
const dcsOn=id=>active(id);
const DV={
  cvsp:()=>Math.round(C.pulper.v/Math.max(1,P.pulperMax)*100)+"%",cvst:()=>({run:C.pulper.auto?"AUTO":"HAND",off:"STOP",trip:"TRIP"})[motStatus("conv")],
  hddp:()=>Math.round(purgeDp("hd")+(dcsOn("hdblow")?40:0)+wob2(0.07,1))+" kPa",lcdp:()=>Math.round(purgeDp("lc")+(dcsOn("lcplug")?50:0)+wob2(0.05,2))+" kPa",
  lwdp:()=>Math.round(purgeDp("lw")+(dcsOn("lwplug")?45:0)+wob2(0.06,3))+" kPa",lcrow:()=>(LV("clean")>0?2:1)+" of "+(LV("clean")>0?2:1),
  csdp:()=>motStatus("cscr")!=="run"?"0 kPa":Math.round(18+S.rates.feed/Math.max(1,P.pulperMax)*14+wob2(0.08,4))+" kPa",csrj:()=>(2.5+(dcsOn("badocc")?2:0)+wob2(0.03,5)*0.3).toFixed(1)+"%",
  fsdp:()=>motStatus("fscr")!=="run"?"0 kPa":Math.round(22+S.rates.fiberIn/Math.max(1,P.screenMax)*20+wob2(0.09,6))+" kPa",fsld:()=>Math.round(S.rates.fiberIn/Math.max(1,P.screenMax)*100)+"%",
  thf:()=>{const D=G3.SPD;return D?(D.tl>150?"DIRTY":"CLEAR")+" "+Math.round(D.tl):"–";},thv:()=>{const D=G3.SPD;return D?Math.round(D.v*100)+"%":"–";},
  lvsp:()=>Math.round(C.lvlTarget.v)+"%",dyef:()=>{const b=document.querySelector('#paperColor button[aria-pressed="true"]');return motStatus("dye")!=="run"||(b&&b.dataset.c==="white")?"0%":"62%";},
  jw:()=>{const D=G3.SLC;return D?(0.985+0.02*D.v).toFixed(3):"–";},slc:()=>{const D=G3.SLC;return D?(12+3*D.v).toFixed(1)+" mm":"–";},
  wsp:()=>Math.round(S.pmSpeed/DCS_DRAW())+" fpm",psp:()=>Math.round(S.pmSpeed/DCS_DRAW()*1.015)+" fpm",dsp:()=>Math.round(S.pmSpeed/1.01)+" fpm",
  wwl:()=>Math.round(clamp(68+(S.pm==="run"?0:14)+wob2(0.02,7)*3,0,100))+"%",hum:()=>Math.round(clamp(62+(motStatus("fog")!=="run"||dcsOn("fogfan")?24:0)+wob2(0.01,8)*3,0,100))+"%",
  dr1:()=>S.pm==="run"&&!dcsOn("shaft")?Math.round(48+S.pmSpeed/3300*34+wob2(0.12,9)*1.5)+"%":"0%",dr2:()=>S.pm==="run"&&!dcsOn("shaft")?Math.round(52+S.pmSpeed/3300*36+wob2(0.11,10)*1.5)+"%":"0%",
  spool:()=>Math.round(S.reel)+" / "+P.jumbo+" t",store:()=>reelsAtWinder()+" of "+P.storeReels,tu:()=>String(S.tot.turnups||0),
  wdr:()=>Math.round(C.wdr.v)+" t/h",wdt:()=>Math.round(S.rates.cut||0)+" t/h",hay:()=>String(S.tot.hayouts||0),rolls:()=>Math.round(S.conv||0)+" of "+P.convCap,
  grid:()=>SITE.env==="urban"&&dcsOn("brownout")?"BROWNOUT":"NORMAL",
  ifl:()=>Math.round((S.rates.prod||0)*9.9)+" m³/h",ice:()=>SITE.env!=="rural"?"–":dcsOn("icedintake")?"ICED":"CLEAR",twl:()=>Math.round(clamp(82+wob2(0.004,11)*6-(dcsOn("icedintake")?25:0),0,100))+"%",
  wuse:()=>"9.9 m³/t",tss:()=>Math.round(tssNow())+" mg/L",perm:()=>dcsOn("permit")?"EXCEEDED":"OK",ofl:()=>Math.round((S.rates.prod||0)*8.4)+" m³/h",
  rej:()=>((S.rates.feed||0)*(1-P.yieldF*((S.M&&S.M.yieldMul)||1))).toFixed(1)+" t/h"};
// effluent suspended solids: fiber lost to the white water and broke push it up; 50 mg/L is the permit
function tssNow(){return clamp(28+(S.knob&&S.knob.off?S.knob.off*30:0)+(S.pm==="run"?0:6)+(dcsOn("permit")?30:0)+wob2(0.015,12)*3,5,120);}
const MIMIC_KNOB={SPOT:MIMIC.SPOT,WET:MIMIC.WET,DET:MIMIC.DET};
const MT=(x,y,k,t,f)=>[x,y,k,t,f];
MIMIC.SPOT={title:"PM3 · STOCK PREP",h:300,trends:MIMIC_KNOB.SPOT.trends,
  eq:[[8,66,76,40,"CONVEYOR"],[100,56,110,60,"PULPER"],[100,8,52,26,"RAGGER","s"],[158,8,52,26,"JUNK","s"],[228,66,78,40,"HD CLEANER"],[324,66,78,40,"COARSE SCR"],[420,66,88,40,"LW CLEANERS"],
    [524,66,86,40,"THICKENER"],[525,196,80,60,"STOCK CHEST"],[430,206,80,40,"REFINERS"],[320,196,90,60,"MACHINE CHEST"],[330,160,70,24,"DYE","s"],[212,206,90,40,"LC CLEANERS"],[104,206,90,40,"FINE SCR"],[8,206,80,40,"FAN PUMP"]],
  ln:[["M84 86 H100"],["M210 86 H228"],["M306 86 H324"],["M402 86 H420"],["M508 86 H524"],["M565 106 V196"],["M525 226 H510"],["M430 226 H410"],["M320 226 H302"],["M212 226 H194"],["M104 226 H88"],["M8 226 H0"],
    ["M126 34 V56",1],["M184 34 V56",1],["M365 184 V196",1]],
  tags:[MT(46,124,"cvsp","SPD",DV.cvsp),MT(46,138,"cvst","",DV.cvst),MT(155,124,"cp","CONS",r=>kf(r.cp)+"%"),MT(155,138,"amps","ROTOR",r=>Math.round(r.amps)+" A"),MT(155,152,"pulpLvl","LEVEL",r=>Math.round(r.pulpLvl)+"%"),
    MT(267,124,"hddp","ΔP",DV.hddp),MT(363,124,"csdp","ΔP",DV.csdp),MT(363,138,"csrj","REJ",DV.csrj),MT(461,124,"lwdp","ΔP",DV.lwdp),MT(575,124,"thf","FILT",DV.thf),MT(575,138,"thv","SPIDER",DV.thv),
    MT(565,272,"lvl","LEVEL",()=>Math.round(S.tank/P.tankCap*100)+"%"),MT(565,286,"lvsp","SP",DV.lvsp),MT(470,190,"csf","CSF",r=>Math.round(r.csf)+" mL"),MT(470,262,"gap","GAP",r=>kf(r.gap,2)+" mm"),MT(470,276,"refkw","LOAD",r=>Math.round(r.refkw)+" kW"),
    MT(365,272,"mcCons","CONS",r=>kf(r.mcCons,2)+"%"),MT(365,286,"agit","AGIT",r=>r.agit+"%"),MT(445,176,"dyef","DYE",DV.dyef),MT(257,262,"lcdp","ΔP",DV.lcdp),MT(257,276,"lcrow","ROWS",DV.lcrow),
    MT(149,262,"fsdp","ΔP",DV.fsdp),MT(149,276,"fsld","LOAD",DV.fsld),MT(48,262,"flow","FLOW",()=>S.pm==="run"?Math.round(S.pmSpeed*1.9)+" L/s":"0 L/s")]};
MIMIC.WET={title:"PM3 · WET END",h:260,trends:MIMIC_KNOB.WET.trends,
  eq:[[520,8,104,30,"FOG FAN"],[14,80,74,70,"HEADBOX"],[104,105,190,25,"FORMING TABLE"],[110,214,100,26,"WW SILO","s"],[308,90,64,50,"COUCH"],[388,90,104,50,"PICK-UP FELT"],[508,80,118,70,()=>LV("shoe")?"SHOE PRESS":"TWIN PRESS"]],
  ln:[["M88 115 H104"],["M294 117 H308"],["M372 115 H388"],["M492 115 H508"],["M160 130 V214",1]],
  tags:[MT(51,172,"zones","ZONES",()=>(S.knob?S.knob.z.filter(v=>v).length:0)+"/12"),MT(51,194,"slc","SLICE",DV.slc),MT(51,70,"jw","J/W",DV.jw),MT(140,72,"wsp","WIRE",DV.wsp),
    MT(240,172,"vac","VAC",r=>kf(r.vac)+" kPa"),MT(240,88,"edge","EDGE",r=>(r.edge>=0?"+":"")+Math.round(r.edge)+" mm"),MT(240,194,"gtrav","GUIDE",r=>r.gm?"AUTO "+Math.round(Math.min(1,r.gtrav)*100)+"%":"MAN"),
    MT(340,172,"couchSol","SOL",r=>kf(r.couchSol)+"%"),MT(340,194,"cs","PIT",r=>r.couch?"RUN":"STOP"),MT(440,172,"osc","OSC",r=>Math.round(r.osc)+"%"),
    MT(567,172,"pl","LOAD",r=>Math.round(r.pl)+" kN/m"),MT(567,194,"pressSol","SOL",r=>kf(r.pressSol)+"%"),MT(567,66,"psp","SPD",DV.psp),MT(260,232,"wwl","LEVEL",DV.wwl),MT(572,54,"hum","RH",DV.hum)]};
MIMIC.DET={title:"PM3 · DRY END",h:280,trends:MIMIC_KNOB.DET.trends,
  eq:[[440,10,90,36,"GRID"],[546,10,80,36,"BOILER"],[14,96,80,50,"OPEN DRAW"],[112,80,130,80,"1ST SECTION"],[260,80,170,80,"2ND / 3RD SECTION"],[448,90,74,60,"REEL"],[546,90,84,60,"WINDER"],[546,214,84,30,"ROLL CONV","s"]],
  ln:[["M94 121 H112"],["M242 120 H260"],["M430 120 H448"],["M522 120 H546"],["M630 120 H636 V229 H630"],["M620 46 V66 H177 V80 M345 66 V80",1]],
  tags:[MT(54,172,"draw","DRAW",r=>kf(r.draw)+"%"),MT(54,194,"tension","TENS",r=>r.run?kf(r.tension,2):"–"),MT(177,176,"st1","STEAM",r=>Math.round(r.st1)+" kPa"),MT(177,192,"dr1","DRV",DV.dr1),MT(177,208,"dsp","SPD",DV.dsp),
    MT(345,176,"st3","AUTO",r=>Math.round(r.st3)+" kPa"),MT(345,192,"steam","FLOW",r=>r.run?kf(r.steam)+" t/h":"–"),MT(345,208,"dr2","DRV",DV.dr2),
    MT(485,166,"moist","MOIST",r=>r.run?kf(r.moist)+"%":"–"),MT(485,180,"bw","BW",r=>r.run?kf(r.bw,2):"–"),MT(485,194,"spool","SPOOL",DV.spool),MT(485,208,"store","STORE",DV.store),MT(485,222,"tu","TURN-UPS",DV.tu),MT(485,84,"speed","SPEED",r=>Math.round(r.speed)+" fpm"),
    MT(588,166,"wdr","SP",DV.wdr),MT(588,180,"wdt","CUT",DV.wdt),MT(588,194,"hay","HAYOUTS",DV.hay),MT(588,262,"rolls","ROLLS",DV.rolls),MT(485,58,"grid","",DV.grid),MT(586,60,"boiler","HDR",r=>Math.round(r.boiler*100)+"%")]};
MIMIC.UTIL={title:"PM3 · UTILITIES",h:210,trends:[],
  eq:[[14,60,96,50,"RIVER INTAKE"],[134,60,96,50,"WATER TOWER"],[254,60,110,50,"MILL"],[388,60,110,50,"WASTEWATER"],[522,60,100,50,"OUTFALL"],[254,150,110,36,"LANDFILL","s"]],
  ln:[["M110 85 H134"],["M230 85 H254"],["M364 85 H388"],["M498 85 H522"],["M309 110 V150",1]],
  tags:[MT(62,128,"ifl","FLOW",DV.ifl),MT(62,142,"ice","ICE",DV.ice),MT(182,128,"twl","LEVEL",DV.twl),MT(309,44,"wuse","USE",DV.wuse),MT(443,128,"tss","TSS",DV.tss),MT(443,142,"perm","PERMIT",DV.perm),
    MT(572,128,"ofl","FLOW",DV.ofl),MT(436,172,"rej","REJECTS",DV.rej)]};
AREA_N.UTIL="Utilities";

/* ---- alarms by area (an upset shows on the screen of the equipment it hits) ---- */
const DCS_WET=new Set(["fabric","felt","slime","fogfan","oscfail","couchpit","runner"]),DCS_UTIL=new Set(["permit","icedintake"]);
function dcsArea(id){if(MOTEV[id])return MOTEV[id].a;if(DCS_UTIL.has(id))return "UTIL";const g=EV[id]&&EV[id].g;if(g==="stock")return "SPOT";if(g==="machine")return DCS_WET.has(id)?"WET":"DET";return null;}
function dcsAlarms(a,r,L){const al=(on,txt,hi)=>{if(on)L.push([txt,hi]);};
  for(const i of S.inc){if(dcsArea(i.id)!==a)continue;const m=MOTEV[i.id];L.push([m?`${m.name.toUpperCase()} STOPPED · RESTART IN ${Math.ceil(i.left)} MIN`:EV[i.id].name.toUpperCase(),true]);}
  if(a==="SPOT"){al(S.tank/P.tankCap>0.92,"STOCK CHEST LEVEL HI",S.tank/P.tankCap>0.98);al(dcsOn("badocc"),"JUNK LOAD HIGH",true);
    for(const k of ["hd","lc","lw"]){const dp=purgeDp(k);al(dp>PURGE.base[k]+(PURGE.trip[k]-PURGE.base[k])*0.6,{hd:"HD CLEANER ΔP HI",lc:"LC CLEANERS ΔP HI",lw:"LW CLEANERS ΔP HI"}[k],dp>PURGE.base[k]+(PURGE.trip[k]-PURGE.base[k])*0.85);}}
  else if(a==="WET"){al(motStatus("fog")!=="run","MACHINE ROOM HUMIDITY HI",false);}
  else if(a==="DET"){al(S.pm==="break",`SHEET BREAK · ${({reel:"REEL",dryer:"DRYERS",press:"PRESSES"})[S.brkType]||"MACHINE"}`,true);al(S.pm==="spools","REEL STORE FULL: MACHINE HELD BACK",true);
    al(!!S.wdBlocked,"WINDER BLOCKED: CONVEYOR FULL",true);al(S.wd==="hayout","WINDER HAYOUT",true);}
  else if(a==="UTIL"){al(tssNow()>45&&!dcsOn("permit"),"EFFLUENT TSS HI",false);}}

/* ---- setpoint, motor and purge rows ---- */
const DCARD=k=>{const r=document.querySelector(`#cards .row[data-key="${k}"]`);return r?{inp:r.querySelector("input"),btn:r.querySelector(".auto")}:null;};
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
    ["slh","Slice lip position","remote from the DCS · L",-100,100,1,()=>G3.SLC?G3.SLC.h*100:0,v=>dcsSlice("h",v),"",null,1]];
  if(a==="DET")return [
    ["wsp","Machine speed (wire)","same setpoint as on WET",Math.round(1200/D()),Math.round((3300+P.spBonus)/D()),5,()=>C.pmSp.v/D(),v=>dcsCardSet("pmSp",Math.round(v*D()/10)*10),"fpm","pmSp"],
    ["wdr","Winder speed","",0,P.winderMax,1,()=>C.wdr.v,v=>dcsCardSet("wdr",v),"t/h","wdr"]];
  return [];}
function dcsSlice(k,v){const D=G3.SLC;if(!D||G3.slcFix||S.zen)return;D[k]=v/100;D.dirty=true;const g=D.geo();if(g.lipX-g.wet>=6.8&&typeof slcBreak==="function")slcBreak();}
function dcsSetRows(a,cs){const defs=dcsSetDefs(a);
  if(a==="UTIL")cs.appendChild(kEl("p","dcsfield","Monitoring only: water, effluent and rejects. The permit and the river intake show here when they act up."));
  if(a==="SPOT"||a==="WET"){const row=kEl("div","dcsrow dcsx");
    if(a==="SPOT"){row.innerHTML=`<div class="dcsn"><b>Dye: paper colour</b><small>dye pump on the machine chest</small></div><div class="seg kseg" role="group" aria-label="Paper colour"><button type="button" data-dye="brown">BROWN</button><button type="button" data-dye="white">WHITE</button></div>`;
      row.querySelectorAll("[data-dye]").forEach(b=>b.addEventListener("click",()=>{const pc=document.querySelector(`#paperColor button[data-c="${b.dataset.dye}"]`);if(pc)pc.click();dcsSync();}));}
    else{row.innerHTML=`<div class="dcsn"><b>Grade</b><small>set by the market planner from customer orders</small></div><select disabled data-dgrade aria-label="Grade">${Object.keys(GRADES).map(g=>`<option value="${g}">${g} · ${GRADES[g].bw} lb</option>`).join("")}</select>`;}
    cs.appendChild(row);}
  for(const d of defs){const [k,name,where,mn,mx,st,,,unit,card,field]=d,row=kEl("div","dcsrow dcsx");row.dataset.ds=k;
    row.innerHTML=`<div class="dcsn"><b>${name}</b><small>${where}</small></div><label class="spis"><input type="range" min="${mn}" max="${mx}" step="${st}" data-dsv aria-label="${name}"/></label><div class="kval"><b data-dsb></b></div>${card?`<button type="button" class="reroll kstd" data-dsa>AUTO</button>`:""}`;
    row.querySelector("[data-dsv]").addEventListener("input",e=>{d[7](+e.target.value);dcsSync();});
    if(card)row.querySelector("[data-dsa]").addEventListener("click",()=>{dcsCardAuto(card);dcsSync();});
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
  o.querySelectorAll("[data-ds]").forEach(row=>{const d=defs.find(x=>x[0]===row.dataset.ds);if(!d)return;const inp=row.querySelector("[data-dsv]"),c=d[9]?DCARD(d[9]):null,lock=!!(c&&c.inp.disabled)||S.zen;
    if(inp.max!==String(d[4]))inp.max=d[4];if(inp.min!==String(d[3]))inp.min=d[3];if(document.activeElement!==inp)inp.value=d[6]();inp.disabled=lock||(d[10]&&!G3[d[0]==="spi"?"SPD":"SLC"]);
    const bv=row.querySelector("[data-dsb]"),t=`${(+d[6]()).toFixed(d[5]<1?1:0)} ${d[8]}`;if(bv.textContent!==t)bv.textContent=t;
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
G3.dcs={motSet,purgeSet,purgeNow,motStatus,dcsArea};   // (tests: tools/dcscheck.py)
