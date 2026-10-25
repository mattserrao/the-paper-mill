/* ---- v6.13 Steam and Sheet: the headbox jet, fiber orientation and STFI, stickies deposits, the broke chest, the reel
   turn-up, the break risk and the machine profile (plan: claude/v613-steam-sheet-plan.md, parts A1 and C) ----
   The headbox. The fan pump's speed sets the headbox pressure and so the jet's speed: the WET DCS's J/W setpoint (fan pump
   on AUTO holds it; standard 0.985). The slice opening (B) sets the jet's thickness, so at a held J/W a wider slice
   passes more flow and the headbox consistency falls (more water to drain, better formation); a narrower one runs it
   thick (worse formation). The lip still sets the jet's angle. Untouched (J/W 0.985, B standard) it is exactly v6.12.
   Fiber orientation. Rush or drag lines the fibers up with the machine: the MD/CD tensile ratio is least near J/W 1 and
   climbs faster with drag than with rush. STFI CD (short-span compression across the machine, what box plants buy on)
   falls as the ratio climbs, and is a spec: 95% of the grade's standard (ring crush is 97%). AUTO-LW trims to the
   tighter of the two.
   Stickies deposits (0-100) build on the forming fabric, the pick-up felt and the first dryer cans with the stickies in
   the stock and the tons, and the showers, oscillator and doctors clean them back to an equilibrium (40 on standard
   bales). Over it: holes (breaks), pick-outs on the first cans (beater) and a filled felt (lower press solids). A new
   fabric or felt starts clean, and a planned outage's wash-up cleans them all.
   The broke chest. The trim, the sheet on a break (the wet end keeps forming at threading speed into the couch pit or
   the dry-end pulper) and repulped beater all go to the broke chest; a pump meters it back into the stock chest as a
   share of the machine's furnish (AUTO by the chest's level; MANUAL a fixed ratio on the SPOT DCS). Over 15% broke in
   the furnish the sheet drains slower and is weaker, and breaks more. A full broke chest overflows to the sewer.
   The reel. A turn-up onto a new spool can fail (faster than the grade's standard and a wet sheet, more often): a short
   reel break. The reel drum's nip load sets the reel's hardness: soft reels telescope and tie together at the winder,
   hard ones crack and break there more. Standard is today's odds exactly.
   Breaks. The odds come from the process: R, a product of named contributors (the open draw's tension against the
   wet sheet's strength at its press solids, stickies and holes, wet streaks, broke, stock swings, clothing, the dryers
   and hood). The dice still say when; R (times RCAL, so a hands-off mill breaks as often as v6.12 on average) says how
   likely, and the contributors say where. Seasons, survival and free play; zen keeps the plain model. ---- */
const HB={jw0:0.985,jwMin:0.965,jwMax:1.005,b0:12,bK:3};
const SH={stfiSpec:0.95,tsr0:1.6,tsrD:400,tsrR:300,dep0:40,depG:6,depC:0.15,bkCap:150,bkTrk:0.30,bkHi:0.7,bkLim:0.20,turnP:0.012,nip0:2,hard0:60,hardK:12,
  rcal:1};
const STFI0={"24":2.6,"28":2.9,"31":3.25,"34Super":3.6};   // kN/m at the grade's target weight and standard refining
const shOn=()=>!!(S&&!S.zen);
// ---- the headbox ----
const hbJw=()=>S&&S.hb&&!S.zen?S.hb.jw:HB.jw0;
const jwDev=()=>(hbJw()-HB.jw0)/0.02;   // (the old slice scale: the dewatering chain's jet term, 07b)
function hbSetJw(v){if(S.zen)return;if(!S.hb)S.hb={jw:HB.jw0};S.hb.jw=Math.round(clamp(+v,HB.jwMin,HB.jwMax)*1000)/1000;const K=knobState();K.any=true;K.moved.slice=S.t;}
// the slice opening (mm) and the headbox consistency it gives at a held J/W
const slcB=()=>HB.b0+HB.bK*((S.knob&&S.knob.x&&S.knob.x.sb)||0);
const hbcSet=()=>S.zen?WE.hbc:WE.hbc*HB.b0/slcB();
// the jet speed (fpm) and the headbox pressure it takes (psi, from the jet's head; Cv 0.97)
const hbJet=()=>hbJw()*S.pmSpeed/DCS_DRAW();
const hbPsi=()=>{const v=hbJet()*0.3048/60;return v*v/(2*9.81)/0.94*1.4219;};
// formation: worse with a thick headbox (a narrow slice) and with rush or drag far from square (1 = standard)
function formF(){if(!shOn())return 1;const x=S.knob&&S.knob.x,sb=x&&x.sb||0,jv=x?(x.jv||0):0;return clamp(1-0.10*Math.max(0,-sb)-0.04*jv*jv,0.6,1);}
const formIdx=()=>Math.round(formF()*100);
// ---- fiber orientation and STFI ----
const tsrOf=jw=>SH.tsr0+(jw<1?SH.tsrD:SH.tsrR)*(jw-1)*(jw-1);
const tsrNow=()=>tsrOf(hbJw());
const stfiSpec=()=>Math.round((STFI0[C.grade]||2.6)*SH.stfiSpec*100)/100;
// strength factors the sheet's other troubles take off both ring crush and STFI (1 = none)
function shStrF(){if(!shOn())return 1;const bf=S.tbf||0;return formF()*(1-0.15*Math.max(0,bf-SH.bkLim));}
function stfiNow(bw){const g=C.grade,x=S.knob&&S.knob.any&&S.knob.x,ps=x&&x.ps!=null?x.ps:psStd()+shPsAdd();
  return (STFI0[g]||2.6)*(bw/bwStd())*(1+0.0035*(kwhNow()-WE.kwh0))*(1+0.004*(ps-psStd()))*Math.sqrt(tsrOf(HB.jw0)/tsrNow())*shStrF();}
// ---- stickies deposits ----
function stkState(){if(!S.stk)S.stk={fab:SH.dep0,felt:SH.dep0,can:SH.dep0};return S.stk;}
// how sticky the furnish is for deposits: the stickies in the stock, by the recipe (A bales 0.6, C 1, Mixed waste 1.8; standard recipe = 1)
function stkFurn(){if(!baleOn()||!S.bq)return 1;const r=S.bq.rec||REC0,n=(r.A||0)+(r.C||0)+(r.M||0)||1,f=((r.A||0)*0.6+(r.C||0)+(r.M||0)*1.8)/n,f0=(REC0.A*0.6+REC0.C+REC0.M*1.8)/(REC0.A+REC0.C+REC0.M);
  return (S.bq.ck/0.1)*f/f0;}
const stkAvg=()=>{const D=S.stk;return D?(D.fab+D.felt+D.can)/3:SH.dep0;};
// (signed: cleaner than the standard 40 takes a little off; dirtier makes holes)
const stkHole=()=>shOn()&&S.stk?clamp((Math.max(S.stk.fab,S.stk.felt,S.stk.can)-SH.dep0)/60,-0.6,1):0;
// press solids lost to a filled felt (points), and the broke's slower drainage (couch points; press follows)
const shPsAdd=()=>shOn()&&S.stk?-1.5*clamp((S.stk.felt-55)/45,0,1):0;   // (a felt well over the normal 40 before it shows)
const shCsAdd=()=>shOn()?-3*Math.max(0,(S.tbf||0)-SH.bkLim):0;
// is any of this off its standard (then the knob model runs, so press solids and steam follow, 07b)
const shOff=()=>shOn()&&(Math.abs(shPsAdd())>1e-6||Math.abs(shCsAdd())>1e-6||Math.abs(hbJw()-HB.jw0)>1e-9);
// pick-outs on the first cans: share of the reel to the beater
const stkOff=()=>shOn()&&S.stk&&S.pm==="run"?0.04*clamp((S.stk.can-50)/50,0,1):0;
function stkTick(dt){const D=stkState(),run=S.pm==="run",h=dt/60;if(!run)return;
  const g=SH.depG*stkFurn()*Math.max(0,(S.rates.prod||0)/35),K=S.knob,st=K&&K.any&&K.x?K.x.st:0,c=SH.depC;
  D.fab=clamp(D.fab+(g-c*D.fab)*h,0,100);D.felt=clamp(D.felt+(g-c*(1-0.8*st)*D.felt)*h,0,100);D.can=clamp(D.can+(g-c*D.can)*h,0,100);}
function stkClean(k,why){const D=stkState();if(k==="all"){D.fab=D.felt=D.can=10;}else D[k]=10;if(why)log(why,"ok");}
// ---- the broke chest ----
function bkState(){if(!S.bk)S.bk={f:SH.bkCap*0.3,m:"auto",sp:0.10,r:0,in:0,ov:false};return S.bk;}
const bkLvl=()=>S.bk?S.bk.f/SH.bkCap:0.3;
const bkGal=()=>S.bk?S.bk.f/(WAT.cs/100)*264.172:0;
// broke into the chest (t of fiber): what doesn't fit goes over the top to the sewer
function bkIn(t,src){if(!(t>0))return;const B=bkState(),room=SH.bkCap-B.f,a=Math.min(t,room);B.f+=a;B.in+=t;
  if(t>a){wSpill(t-a);if(!B.ov){B.ov=true;log("The broke chest is full: broke is overflowing to the sewer. Meter more broke back (SPOT DCS) or get the sheet back on.","bad");}}}
// broke mixed into the stock chest (the chest's broke share follows)
function bkMix(t){if(!(t>0))return;const tk=Math.max(1e-6,S.tank);S.tbf=clamp(((S.tbf||0)*(tk-t)+t)/tk,0,1);}
// fresh fiber from the pulper dilutes the stock chest's broke share
function bkFresh(t){if(!(t>0)||!S.tbf)return;const tk=Math.max(1e-6,S.tank);S.tbf=clamp(S.tbf*(tk-t)/tk,0,1);}
function bkRatioAuto(){return 0.02+0.13*clamp((bkLvl()-0.25)/0.6,0,1);}   // (2% when it's low, up to 15% as it fills)
function bkTick(dt){const B=bkState(),h=dt/60,run=S.pm==="run";
  // the sheet on a break: the wet end keeps forming at threading speed into the couch pit or the dry-end pulper
  // (only while there's stock to form: with the chest nearly empty the wet end stops too)
  if(S.pm==="break"&&S.tank/P.tankCap>0.08){const t=Math.min(S.tank-P.tankCap*0.08,depSheet()*h);if(t>0){S.tank-=t;bkIn(t,"break");}}
  B.r=B.m==="auto"?bkRatioAuto():B.sp;
  // back into the stock chest as a share of the machine's furnish; with the machine down and the broke chest nearly full, a
  // steady trickle so it doesn't overflow
  {const room=Math.max(0,P.tankCap*0.98-S.tank),use=run?(S.rates.fiberUse||0)*h:0,q=Math.min(B.f,room,run?B.r*use:(bkLvl()>0.9&&(S.tbf||0)<SH.bkTrk?10*h:0));if(q>0){B.f-=q;S.tank+=q;bkMix(q);}}
  if(B.f<SH.bkCap*0.95)B.ov=false;B.inR=ease(B.inR||0,B.in/h,dt,6);B.in=0;}
function bkSet(m,v){if(S.zen)return;const B=bkState();if(m==="auto"){B.m="auto";return;}B.m="manual";if(v!=null)B.sp=clamp(+v,0,0.3);}
// ---- the reel ----
const reelNip=()=>S&&S.reelNip!=null?S.reelNip:SH.nip0;
function reelSetNip(v){if(S.zen)return;S.reelNip=Math.round(clamp(+v,0.5,5)*10)/10;}
const reelHard=()=>SH.hard0+SH.hardK*(reelNip()-SH.nip0);
// the winder: soft reels tie together and telescope (the tiedrolls odds), hard ones crack and break (hayouts)
function shFreq(id){if(!shOn())return 1;const H=reelHard();
  if(id==="tiedrolls")return H<55?1+(55-H)/8:1;
  if(id==="wrap")return S.stm&&S.stm.syph>=0?2:1;   // (a flooded can in the 2nd or 3rd section: the sheet sticks to it)
  return 1;}
function shMods(m){if(!shOn())return;const H=reelHard();if(H>70)m.hayMul*=1+(H-70)/10;}
// a turn-up: the sheet onto a new spool (its own dice, only when a reel is turned up). Fails: a short break at the reel.
function turnupRoll(){if(!shOn()||S.pm!=="run")return;if(S.rng.turnup==null)S.rng.turnup=(S.seed^0x2f6b8c1d)|0;const r=rand("turnup"),r2=rand("turnup");
  const g=GRADES[C.grade]||GRADES["24"],m=S.dry?S.dry.m:DRY.m0,p=SH.turnP*(1+Math.max(0,(S.pmSpeed-g.sp)/600))*(1+0.5*Math.max(0,m-9));
  S.tot.tuFail=S.tot.tuFail||0;if(r>=p)return;
  S.pm="break";S.brkType="reel";S.breakLeft=2*(4+r2*6);S.breakTotal=S.breakLeft;S.tot.breaks++;S.tot.tuFail++;enqueue("brk");AUDIO.sfx("snap",2500);
  log("Turn-up failed: the sheet tore going onto the new spool. Short break at the reel.","warn");brkNote();
  brLog("reel",[["turnup","Turn-up failed",1]],brkRisk());}

/* ---- the break risk: R and its contributors. Each: [key, name, factor, where it breaks] ---- */
let BRR={R:1,parts:[],ev:0};   // (the last risk the break check worked out; the screens work out their own)
const BRKN={draw:"Open draw tension vs wet strength",stk:"Stickies and holes",cd:"Wet streaks and edges",broke:"Broke in the furnish",stock:"Stock swings",cloth:"Fabric and felt",dry:"Dryers and hood",turnup:"Turn-up failed"};
const BRKM={draw:"Method",stk:"Material",cd:"Measurement",broke:"Material",stock:"Machine",cloth:"Machine",dry:"Environment",ev:"Crew & events",turnup:"Machine"};
// (v6.13 t3: worked out once a step: the sim checks it, the tags and screens read the same one)
const BRKC={S:null,t:-1,v:null};
function brkRisk(){const tm=S.t;if(BRKC.S===S&&BRKC.t===tm)return BRKC.v;BRKC.S=S;BRKC.t=tm;return BRKC.v=brkRisk0();}
function brkRisk0(){if(!shOn())return {R:1,parts:[],ev:Math.max(0,(S.M&&S.M.breakMul||1)-1)};
  const K=S.knob,x=K&&K.any&&K.x?K.x:null,ps=x&&x.ps!=null?x.ps:psStd()+shPsAdd()+shCsAdd(),run=S.pm==="run";
  // (tension: the DCS's reading; slack under what the speed needs is drawBrk's. Wet strength against a plain twin press's 44%:
  //  the shoe press and the steam box send a stronger sheet into the open draw, a wet one out of the presses a weaker one)
  const T=Math.max(0.7,1+0.42*(knobVal("draw")-drawStd())),ws=Math.exp(0.05*(ps-44)),q=T/ws;
  const parts=[];
  parts.push(["draw",BRKN.draw,drawBrk()*clamp(q*q,0.5,3),"dryer"]);
  const ck=baleOn()&&S.bq?S.bq.ck:0;parts.push(["stk",BRKN.stk,(1+0.8*ck)/(1+0.8*0.1)*(1+0.5*stkHole()),"press"]);   // (1 on standard bales: their stickies are in the calibration)
  {let n=0,edge=0;const C2=S.cd;if(C2&&cdOn()&&run){const sp=QSPEC[C.grade]||QSPEC["24"];const mA=S.dry?S.dry.m:DRY.m0;for(let z=0;z<12;z++)if(mA+C2.dv[z]>sp.m[1])n++;
      const W=S.wdW||windW(C.grade),tr=(webW()-2*W)/2;edge=(C2.edge[0]>tr?1:0)+(C2.edge[1]>tr?1:0);}
    parts.push(["cd",BRKN.cd,1+0.06*n+0.12*edge,"dryer"]);}
  parts.push(["broke",BRKN.broke,1+1.5*Math.max(0,(S.tbf||0)-SH.bkLim),"press"]);
  {const sw=x?x.sw:0,cav=S.we?S.we.cav:0,kb=K&&K.any?Math.max(1,K.brk||1):1;parts.push(["stock",BRKN.stock,(1+1.5*sw*sw+2*cav)*kb,"press"]);}
  {const wear=K?K.wear||0:0,st=x?x.st:0;parts.push(["cloth",BRKN.cloth,1+0.5*wear+0.6*Math.max(0,st-0.2),"press"]);}
  {const T2=S.stm,D=S.dry,wet=D&&!(K&&K.any)&&D.m>13?(D.m-13)*0.8:0;parts.push(["dry",BRKN.dry,1+(T2?0.03*stmFloodSum()+1.5*T2.drip+T2.roof:0)+wet,"dryer"]);}
  let R=1;for(const p of parts)R*=p[2];return {R,parts,ev:Math.max(0,(S.M&&S.M.breakMul||1)-1)};}
// where a break goes: the old split for the base and the events, each contributor's excess at its own place
function brkWhere(B,r){const w={reel:0.25,dryer:0.40,press:0.35},tot={reel:w.reel,dryer:w.dryer,press:w.press};
  for(const p of B.parts)if(p[2]>1)tot[p[3]]+=Math.log(p[2]);
  const s=tot.reel+tot.dryer+tot.press;let u=r*s;for(const k of ["reel","dryer","press"]){u-=tot[k];if(u<0)return k;}return "press";}
// the break log (last 40): where, the top three causes with their shares, R at the time
function brLog(loc,top,B){if(S.zen)return;const L=S.brl||(S.brl=[]);
  L.push({t:Math.round(S.t),loc,R:Math.round((B?B.R:1)*100)/100,top,c:B?Object.fromEntries(B.parts.map(p=>[p[0],Math.round(p[2]*1000)/1000])):{},ev:B?Math.round(B.ev*100)/100:0});while(L.length>40)L.shift();}
function brLog1(loc,k,lab){brLog(loc,[[k,lab||BRKN[k]||k,1]],brkRisk());}   // (v6.13 t3: knob, valve, silo and spider breaks)
// the top causes of a break from the risk now: each contributor's log-share of everything that made it likelier
function brTop(B){const xs=B.parts.filter(p=>p[2]>1.005).map(p=>[p[0],p[1],Math.log(p[2])]);if(B.ev>0.005)xs.push(["ev","Upsets and events",Math.log(1+B.ev)]);
  const s=xs.reduce((a,p)=>a+p[2],0);if(s<=0)return [["base","Normal running",1]];return xs.sort((a,b)=>b[2]-a[2]).slice(0,3).map(p=>[p[0],p[1],Math.round(p[2]/s*100)/100]);}

/* ---- every step (07-sim-step), after the machine has made its paper ---- */
function shTick(dt){if(!shOn())return;if(!S.hb)S.hb={jw:HB.jw0};   // (a run from v6.13 always has it: an older save without it gets its slice migrated, 07g)
  stkTick(dt);bkTick(dt);
  // a planned outage just ended: the wash-up cleaned the clothing and the first cans
  const on=!!(S.outg&&S.outg.on);if(S.shOut&&!on){stkClean("all","Outage wash-up: the forming fabric, the felts and the first dryer cans are clean of stickies.");stmOutage();}S.shOut=on;
  if(shOff()){const K=knobState();K.any=true;}}
// new clothing starts clean (04 upsets' end)
function shOnEnd(id){if(!shOn())return;if(id==="fabric")stkClean("fab");if(id==="felt")stkClean("felt");}

/* ---- the machine profile: consistency and solids, headbox to reel (stations for the screens and the sheet camera) ---- */
// [x (m from the slice), section, equipment, consistency or solids %]
function profNow(std){const K=S.knob,x=!std&&K&&K.any&&K.x?K.x:null,run=S.pm==="run";
  const hbc=std?WE.hbc:(run&&S.we?S.we.hbc:hbcSet()),cs=x&&x.cs!=null?x.cs:csStd()+(std?0:shCsAdd()),ps=x&&x.ps!=null?x.ps:psStd()+(std?0:shPsAdd()+shCsAdd()),m=std?DRY.m0:(S.dry?S.dry.m:DRY.m0);
  const gb=x&&x.gb!=null?x.gb:FZ.gb,lv=x&&x.lv!=null?x.lv:FZ.lv,hv=x?x.vac:30,e1=std?1:eGb(gb),e2=std?1:eLv(lv),e3=std?1:clamp(1-((hv-30)/30<0?0.58:0.15)*((hv-30)/30)**2,0.3,1);
  // forming board, gravity, low vacuum and flatboxes split the way to the couch on a log scale, each zone's factor moving its share
  // (the couch takes the last step: its vacuum and the felt pick-up)
  const l0=Math.log(hbc),lc=Math.log(cs),seg=[0.10,0.22,0.25,0.30,0.13].map((s,i)=>s*[1,e1,e2,e3,1][i]),ss=seg.reduce((a,b)=>a+b,0),pts=[];let acc=0;
  for(let i=0;i<4;i++){acc+=seg[i]/ss;pts.push(Math.exp(l0+(lc-l0)*acc));}
  const L=dryLost3(),d1=1-(100-m)/100,dw=(c,f)=>100/((100/c-1)*(1-f)+1);   // (the dryers: water out by section share)
  const wIn=100/ps-1,wOut=m/(100-m),out=k=>100/(1+wIn-(wIn-wOut)*k);
  const fr=[STM.share[0]*(1-L[0]),STM.share[1]*(1-L[1]),STM.share[2]*(1-L[2])],ft=fr[0]+fr[1]+fr[2],k1=fr[0]/ft,k2=(fr[0]+fr[1])/ft;
  // (distances in metres from the slice, as the 3D machine has them: the slice at x 55, the reel drum at x -6)
  return [[0,"Headbox","Slice",hbc],[1,"Forming","Forming board",pts[0]],[4,"Forming","Gravity boxes",pts[1]],[7,"Forming","Low vacuum boxes",pts[2]],[11,"Forming","Flatboxes",pts[3]],
    [15,"Couch","Suction couch",cs],[19,"Presses","1st press",cs+(ps-cs)*0.55],[22,"Presses",LV("shoe")?"Shoe press":"2nd press",ps],[25,"Open draw","Press to dryers",ps],
    [36,"Dryers","1st section",out(k1)],[45.5,"Dryers","2nd section",out(k2)],[58.5,"Dryers","3rd section",100-m],[61,"Reel","Reel drum",100-m]];}
// share of each section's drying lost to flooded cans (for the profile)
function dryLost3(){const T=S.stm,o=[0,0,0];if(!T)return o;for(let s=0;s<3;s++){const [a,b]=STM.sec[s];let f=0;for(let j=a;j<b;j++)f+=T.fl[j];o[s]=f/(b-a);}return o;}
