/* ---- v6.11.1 wet-end chemicals: the retention polymer on the WET DCS (v6.11.2: dry strength starch removed) ----
   The polymer comes out of the chemicals and water budget (ECON.chem, $25/t, unchanged): 0.3 kg/t at $3.50/kg ($1.05/t) at
   standard; the other $23.95/t is everything else (v6.11.2: the starch's $3.30/t folded into it, so the budget is the same).
   AUTO is flow-paced: the pump follows production at a ratio (kg/t: the standard unless the player sets another), so it
   stops on a break, and at the standard it costs exactly what the budget already charges (v6.11.1 QA: the ratio setpoint). MANUAL holds the pump at the operator's kg/h: as the tons move the dose moves with it,
   and on a break or a slow restart the chemical keeps going in (paid for, and an overdose as the sheet comes back).
   What reaches the sheet (e, kg/t) lags the dose by 3 minutes (dosed at the fan pump). Against the standard dose:
   - Polymer: first pass retention (85% at standard; the fines and filler the wire loses go to the white water and on to
     the sewer): the machine's fiber loss scales with g(p) = 0.4 + 0.6 e^(-p/0.2), so cutting it loses fiber (fewer tons
     a ton of fiber and a higher TSS: a normal run is ~25 mg/L, and held over the 50 mg/L permit for an hour while the
     polymer is cut, the state fines the mill), and over 0.5 kg/t it over-flocculates: (dose - 0.5) of the reel goes to the
     beater for poor formation (30% at 0.8 kg/t).
   The crew traces trouble back like a fiddly knob's: flocs for a few hours, or a permit breach, and the process engineer
   puts the polymer back on AUTO. Untouched (S.chem missing, or on AUTO and settled) every factor here is exactly 1 and
   nothing is charged or drawn: seasons replay identically. Zen: no chemicals. Older saves may still hold S.chem.ds: unused. */
const CHM={
  pol:{id:"pol",name:"Retention polymer",short:"POLYMER",std:0.3,max:0.8,step:0.1,rstep:0.02,risk:0.15,fmax:32,price:3.5,tau:3,where:"retention aid at the fan pump"}};
const CHEM_IDS=["pol"];   // (v6.11.2: "ds", dry strength starch, removed)
const CHEM_STD$=CHM.pol.std*CHM.pol.price;   // ($1.05/t of the $25/t)
const chG=p=>0.4+0.6*Math.exp(-p/0.2);
function chemState(){if(!S.chem){S.chem={any:false,H:{}};for(const id of CHEM_IDS)S.chem[id]={m:"auto",f:0,sp:CHM[id].std,e:CHM[id].std,d:CHM[id].std};}return S.chem;}
// anything off standard: a pump on MANUAL, or the sheet still carrying a dose that isn't the standard one
function chemOn(){const X=S.chem;return !!(X&&X.any&&!S.zen);}
function chemE(id){const X=S.chem;return X&&!S.zen?X[id].e:CHM[id].std;}
function chemDose(id){const X=S.chem;return X&&!S.zen?X[id].d:CHM[id].std;}
function chemMode(id){const X=S.chem;return X?X[id].m:"auto";}
// AUTO's ratio setpoint (kg/t)
function chemSp(id){const X=S.chem,v=X&&X[id].sp;return v!=null?v:CHM[id].std;}
// the paper the machine is making (t/h), and the standard rate for the grade (a pump switched to MANUAL while it's down)
function chemTph(){return S.pm==="run"?P.K*S.pmSpeed*(S.we&&S.we.bw||bwStd()):0;}
function chemTstd(){const g=GRADES[C.grade]||GRADES["24"];return P.K*g.sp*g.bw;}
// pump flow (kg/h): AUTO follows production at its ratio
function chemFlow(id){const X=S.chem;if(!X||X[id].m==="auto")return chemSp(id)*chemTph();return X[id].f;}
// the polymer low enough that the outfall is at risk of its permit (the DCS warns)
function chemRisk(){return chemOn()&&(chemMode("pol")==="manual"?chemE("pol")<CHM.pol.risk||(chemDose("pol")!=null&&chemDose("pol")<CHM.pol.risk):chemSp("pol")<CHM.pol.risk);}
// effects (exactly the identity untouched)
function chemLoss(){return chemOn()?chG(chemE("pol"))/chG(CHM.pol.std):1;}              // the machine's fiber loss factor
function pmRet(){return chemOn()?1-(1-P.pmLoss)*chemLoss():P.pmLoss;}                    // fiber into paper (07 step)
function fprNow(){return 100-15*chemLoss();}                                             // first pass retention (%)
function chemFloc(){return chemOn()?clamp((chemE("pol")-0.5)/1.0,0,1):0;}                // share of the reel lost to flocs (07b F.floc)
function chemMods(m){}   // (v6.11.2: nothing since the starch went: it was the deposits' extra breaks)
function chemFreq(id){return 1;}   // (and their slime)
// the player on the DCS (zen: none). MANUAL starts where AUTO's pump is (bumpless); AUTO goes back to the ratio.
function chemSetMode(id,m){if(S.zen||!CHM[id])return;const X=chemState(),c=X[id];if(m===c.m)return;
  if(m==="manual"){const t=chemTph()||chemTstd();c.f=Math.round(chemSp(id)*t/CHM[id].step*10)*CHM[id].step/10;}
  c.m=m;X.any=true;chemWake();log(`${CHM[id].name}: ${m==="auto"?"AUTO, flow-paced at "+chemSp(id)+" kg/t":"MANUAL, pump held at "+c.f.toFixed(1)+" kg/h"}`,"");}
// AUTO's ratio (kg/t): moving it puts a MANUAL pump back on AUTO
function chemSetRatio(id,v){if(S.zen||!CHM[id])return;const X=chemState(),c=X[id],k=CHM[id];if(c.m!=="auto"){c.m="auto";log(`${k.name}: AUTO`,"");}
  c.sp=Math.round(clamp(+v,0,k.max)/k.rstep)*k.rstep;c.sp=Math.round(c.sp*100)/100;X.any=true;chemWake();}
function chemSetFlow(id,v){if(S.zen||!CHM[id])return;const X=chemState(),c=X[id];if(c.m!=="manual")chemSetMode(id,"manual");c.f=clamp(+v,0,CHM[id].fmax);X.any=true;chemWake();}
// the wet end's dewatering chain lives in the knob model (07b): keep it running while a chemical is off standard
function chemWake(){const K=knobState();if(!K.any){K.any=true;S.M=mods();}}
// the crew puts a chemical back on AUTO
function chemFix(id,head,who){const X=S.chem;if(!X||(X[id].m==="auto"&&chemSp(id)===CHM[id].std))return;const was=X[id].m==="auto"?`AUTO at ${chemSp(id)} kg/t`:"MANUAL";X[id].m="auto";X[id].sp=CHM[id].std;
  log(`${head} ${who} traced it to the ${CHM[id].name.toLowerCase()} (${was}) and set it back to AUTO at the standard ${CHM[id].std} kg/t.`,"ok");
  BANNERS.push({text:`Traced: ${CHM[id].name}`,t:null,kind:"good",tag:"FIXED"});while(BANNERS.length>3)BANNERS.splice(1,1);}
// every step, after the machine made paper (07 step): what went in, its cost against the budget's share, the lags, the traces
function chemTick(dt,prod){const X=S.chem;if(!X||S.zen)return;const h=dt/60,run=S.pm==="run"&&prod>0,tph=run?prod/h:0;
  let d$=0;
  for(const id of CHEM_IDS){const c=X[id],k=CHM[id],sp=c.sp!=null?c.sp:k.std,kg=c.m==="auto"?sp*prod:c.f*h;
    d$+=(kg-k.std*prod)*k.price;
    if(run){c.d=kg/prod;c.e=kLag(c.e,c.d,k.tau,dt);}else c.d=c.m==="auto"?sp:null;   /* (MANUAL on a stopped machine: chemical going in with no paper to put it in) */
    if(c.m==="auto"&&Math.abs(c.e-sp)<1e-3)c.e=sp;}
  if(d$&&!S.zen){const v=d$*(P.costMul||1);spend(v,"energy");pfAdd("chem","pm",v);}
  // ---- the crew's traces ----
  const H=X.H,tr=(k,bad,mins,id,head,who)=>{if(bad){H[k]=(H[k]||0)+dt;if(H[k]>=mins){H[k]=0;chemFix(id,head,who);}}else H[k]=Math.max(0,(H[k]||0)-dt*0.5);};
  tr("floc",run&&chemFloc()>0.02,180,"pol","QCS: flocs and poor formation in the sheet.","The process engineer");
  // ---- held over the permit by the fiber the wire is losing: the state fines the mill ----
  // (v6.11.1 t4: the outfall's TSS over the 50 mg/L permit while the polymer is under its standard: a normal run sits at ~25
  // mg/L, so it takes about a third of the standard dose or less, i.e. the wire losing 50% more fines, to hold it over)
  const low=chemE("pol")<CHM.pol.std-1e-6&&tssWater()>50;
  if(low&&!active("permit")){H.tss=(H.tss||0)+dt/60;if(H.tss>=1){H.tss=0;
    if(knobTrig("permit",[],"Effluent over the permit! The wire is losing fines without the retention polymer and the clarifier can't keep up."))X.permit=S.inc[S.inc.length-1].real;}}
  else if(!low)H.tss=Math.max(0,(H.tss||0)-dt/120);
  if(X.permit&&!S.inc.some(n=>n.real===X.permit)){X.permit=null;chemFix("pol","Permit breach investigated.","The environmental engineer");}
  // all back on AUTO and the sheet carrying the standard doses: stop running
  if(X.any&&CHEM_IDS.every(id=>X[id].m==="auto"&&chemSp(id)===CHM[id].std&&X[id].e===CHM[id].std)&&!X.permit){X.any=false;X.H={};}}
