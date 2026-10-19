/* ---- v5.6 fiddly knobs ----
   Interactive settings around the mill that start at their ideal position and do nothing unless the player moves one.
   A moved knob works through a slow process model: the trouble surfaces minutes to hours later, often in another area
   (the refiner gap shows up as dryer steam, the couch pit agitator only matters at the next sheet break), so the
   player traces it back on the SPOT / WET / DET DCS and QCS screens. Some knobs act together: refiner gap, vacuum and
   press loading set how much water reaches the dryers, and first-section steam decides with them whether the sheet comes
   off wet or dry. Every consequence costs real money (repair bills, beater, steam, downtime), and the crew always finds
   the cause in the end: a knob-caused incident resets its knob when it is cleared, and anything that only makes off-spec
   paper or breaks is traced and reset by the shift after a few hours, with the log naming the knob.
   Rules: S.knob does not exist until the player changes a knob, and knobTick() returns at once while every knob is at
   its ideal and the process has settled, so an untouched game draws no dice and changes nothing (same checksum).
   Incident durations use their own dice stream ("knob"); the shared upset streams are never touched. Zen: no knobs. */
const KNOB_IDEAL={pulp:50,ref:0.5,agit:100,vac:30,press:100,osc:100,couch:1,draw:1.5,st1:70,gm:1,gt:0};
const KNOBS=[
  {id:"pulp",name:"Pulper dilution valve",area:"SPOT",where:"Pulper, stock prep",field:true,unit:"% open",min:0,max:100,step:1,
    tip:"Dilution water into the pulper tub. Operators leave it at 50% open."},
  {id:"ref",name:"Refiner plate gap",area:"SPOT",where:"Twin refiners, behind the headbox",field:true,unit:"mm",min:0.1,max:1.0,step:0.01,dp:2,
    tip:"How close the refiner plates run. Standard gap is 0.50 mm."},
  {id:"agit",name:"Machine chest agitator",area:"SPOT",where:"Machine chest, stock prep",field:true,unit:"% speed",min:0,max:100,step:5,
    tip:"Keeps the refined stock in the machine chest mixed. Normally runs flat out."},
  {id:"zones",name:"Headbox dilution zones",area:"WET",where:"Wet end DCS",dcs:true,
    tip:"Twelve dilution valves across the headbox trim the cross-direction profile. All zones normally sit at 0%."},
  {id:"vac",name:"Forming table vacuum",area:"WET",where:"Wet end DCS",dcs:true,unit:"kPa",min:5,max:60,step:1,
    tip:"Vacuum under the forming fabric pulls water out before the couch. Standard is 30 kPa."},
  {id:"press",name:"Press loading",area:"WET",where:"Wet end DCS",dcs:true,unit:"kN/m",min:50,max:150,step:1,
    tip:"Nip load in the twin press. Standard is 100 kN/m."},
  {id:"guide",name:"Fabric guide roll",area:"WET",where:"Forming section, tending side",field:true,
    tip:"Keeps the forming fabric tracking down the middle of the rolls. Normally on AUTO with no trim."},
  {id:"couch",name:"Couch pit agitator",area:"WET",where:"Couch pit, under the wire",field:true,
    tip:"Keeps the broke in the couch pit moving. Normally running."},
  {id:"osc",name:"Pick-up felt oscillator",area:"WET",where:"Pick-up felt showers, 1st press top felt",field:true,unit:"% stroke speed",min:0,max:100,step:5,
    tip:"Sweeps the felt-cleaning shower back and forth across the pick-up felt. Normally 100%."},
  {id:"draw",name:"Press-to-dryer draw",area:"DET",where:"Dry end DCS",dcs:true,unit:"%",min:0,max:4,step:0.1,dp:1,
    tip:"Speed difference between the presses and the first dryers, which keeps the open draw taut. Standard is 1.5%."},
  {id:"st1",name:"1st section steam",area:"DET",where:"Dry end DCS",dcs:true,unit:"kPa",min:0,max:250,step:5,
    tip:"Steam pressure in the first dryer section. The 3rd section is on automatic moisture control. Standard is 70 kPa."},
];
const KNOBN=Object.fromEntries(KNOBS.map(k=>[k.id,k]));
const KZONES=12;
function knobState(){if(!S.knob){S.knob={v:Object.assign({},KNOB_IDEAL),z:new Array(KZONES).fill(0),
    x:{cp:5,fr:0.5,ch:0,sw:0,vac:30,pl:100,st:0,d1:0,m:7,dl:0,dt:0,bs:0,z:new Array(KZONES).fill(0)},
    any:false,cs:0,wear:0,gacc:0,gm0:0,H:{},harm:{},off:0,offWhy:"",sf:1,a:1,W:1,feed:1,brk:1,edge:0,gtrav:0,inc:[],warned:{},moved:{}};}
  if(S.knob.pmPrev==null)S.knob.pmPrev=S.pm;if(S.rng&&S.rng.knob==null)S.rng.knob=(S.seed^0x6b9f3c21)|0;return S.knob;}
function knobVal(id){const K=S.knob;return K?K.v[id]:KNOB_IDEAL[id];}
function knobAt(id){const K=S.knob;if(!K)return true;if(id==="zones")return K.z.every(v=>v===0);if(id==="guide")return K.v.gm===1&&K.v.gt===0;return K.v[id]===KNOB_IDEAL[id];}
// the player moves a knob (UI): v is the new value (zones: [i,v]; guide: {gm,gt})
function knobSet(id,v){if(S.zen)return;const K=knobState();
  if(id==="zones"){const [i,z]=v;K.z[i]=clamp(Math.round(z),-10,10);}
  else if(id==="guide"){if(v.gm!=null&&v.gm!==K.v.gm){K.v.gm=v.gm;if(v.gm===0){K.gacc=0;K.gw0=knobWalk();}}if(v.gt!=null)K.v.gt=clamp(Math.round(v.gt),-40,40);}
  else{const d=KNOBN[id];K.v[id]=d&&d.min!=null?clamp(+v,d.min,d.max):+v;}
  K.any=true;K.moved[id]=S.t;}
function knobFmt(id){const K=S.knob,d=KNOBN[id];if(id==="zones"){const z=K?K.z:[];const n=z.filter(v=>v!==0).length;return n?`${n} zone${n>1?"s":""} trimmed`:"all zones 0%";}
  if(id==="guide"){const v=K?K.v:KNOB_IDEAL;return (v.gm?"AUTO":"MANUAL")+(v.gt?` · trim ${v.gt>0?"+":""}${v.gt} mm`:"");}
  if(id==="couch")return knobVal("couch")?"running":"stopped";
  const v=knobVal(id);return `${v.toFixed(d.dp||0)} ${d.unit}`;}
function knobReset(id,quiet){const K=S.knob;if(!K)return;
  if(id==="zones")K.z.fill(0);else if(id==="guide"){K.v.gm=1;K.v.gt=0;K.gacc=0;}else K.v[id]=KNOB_IDEAL[id];
  if(!quiet)K.any=true;}
// which knobs are off their ideal right now (for the knob view, the DCS and the crew's trace)
function knobsOff(){return KNOBS.filter(k=>!knobAt(k.id)).map(k=>k.id);}
// the forming fabric's slow walk across the rolls (mm), the same for everyone: a long slow swing
function knobWalk(){return 18*Math.sin(S.t/1440*Math.PI*2);}
const kLag=(x,t,tau,dt)=>x+(t-x)*(1-Math.exp(-dt/tau));
// the crew resets a knob they traced a problem to, and says so in the log
function knobFix(ids,head,who){const K=S.knob;if(!K)return;ids=ids.filter(id=>!knobAt(id));if(!ids.length)return;
  const parts=ids.map(id=>`${KNOBN[id].name.toLowerCase()} (${knobFmt(id)})`);ids.forEach(id=>{knobReset(id,true);knobSettle(id);});K.any=true;
  const list=parts.length>1?parts.slice(0,-1).join(", ")+" and "+parts[parts.length-1]:parts[0];
  log(`${head} ${who||"The crew"} traced it to the ${list} and set ${ids.length>1?"them":"it"} back to standard.`,"ok");
  BANNERS.push({text:`Traced: ${ids.map(i=>KNOBN[i].name).join(", ")}`,t:null,kind:"good",tag:"FIXED"});while(BANNERS.length>3)BANNERS.splice(1,1);}
// the crew fixed the root cause: the process it drove is flushed back to normal (stripes on the felt and streaks already
// in the chest still have to work their way out)
function knobSettle(id){const K=S.knob,x=K.x;x.bs=0;x.bk=0;K.H={};
  if(id==="pulp")x.cp=5;else if(id==="ref"){x.fr=0.5;x.ch=0;}else if(id==="vac"){x.vac=30;K.wear=0;}else if(id==="press"){x.pl=100;x.cr1=x.cr=0;}
  else if(id==="draw"){x.dl1=x.dl=x.dt=0;}else if(id==="st1")x.d1=0;else if(id==="agit")x.sw*=0.3;else if(id==="guide"){K.edge=0;K.gacc=0;}else if(id==="couch")K.cs=0;}
// a knob-caused breakdown. Like trigger() but with the "knob" dice for its length, no civics card and no leader auto-fix
// (the knob is the root cause, and the crew resets it when the job is done). Uses the upset's own 3D effect and repair bill.
function knobTrig(id,cause,why){if(active(id))return false;const K=S.knob,e=EV[id];if(S.rng.knob==null)S.rng.knob=(S.seed^0x6b9f3c21)|0;
  const dur=(e.dur[0]+rand("knob")*(e.dur[1]-e.dur[0]))*durMul(id);
  const inc={id,left:dur,total:dur,real:performance.now(),note:"",knob:cause};
  if(id==="refclash"){inc.mods={speedCap:0.75};inc.billMul=0.5;inc.note="one refiner out: machine slowed";}
  S.inc.push(inc);(S.evc||(S.evc={}))[id]=(S.evc[id]||0)+1;if(QINC(id))enqueue(id);S.lastInc=S.t;S.tot.incidents++;try{AUDIO.event(id);}catch(_){}
  BANNERS.push({text:why||e.head,t:null,id});while(BANNERS.length>3)BANNERS.splice(1,1);
  if(e.start&&id!=="refclash")e.start(inc);
  const bill=(REPAIR[id]||0)*P.repairMul*(inc.billMul||1);if(bill>0){spend(bill,"repairs");inc.bill=bill;inc.note=(inc.note?inc.note+" · ":"")+`repair bill ${money(bill)}`;}
  log((why||e.head)+(inc.note?` (${inc.note})`:""),"bad");K.inc.push({id,real:inc.real,cause});S.M=mods();return true;}
// a knob-caused sheet break (no dice from the break stream: those keep their place for the random breaks)
function knobBreak(type,why){if(S.pm!=="run")return false;S.pm="break";S.brkType=type;const r=rand("knob");
  S.breakLeft=2*(type==="reel"?4+r*6:type==="dryer"?12+r*14:26+r*20);S.breakTotal=S.breakLeft;S.tot.breaks++;enqueue("brk");AUDIO.sfx("snap",2500);
  log(why,"warn");brkNote();return true;}
// a break before the presses dumps the whole sheet into the couch pit: with the agitator off, settled fiber lets it overflow
function knobCouch(){const K=S.knob;if(!K||S.zen||S.brkType!=="press"||K.cs<0.5||active("couchpit"))return;
  if(knobTrig("couchpit",["couch"],"Couch pit overflow! Broke from the sheet break is pouring over the pit edge onto the machine floor."))S.breakLeft+=60;}
// mods() calls this last (04-upsets.js): nothing changes while no knob has been touched
function knobMods(m){const K=S.knob;if(!K||!K.any||S.zen)return;if(K.feed<1)m.feedMul*=K.feed;if(K.brk>1)m.breakMul*=K.brk;}
// share of production going to the beater because of a knob (07-sim-step.js)
function knobOff(){const K=S.knob;return K&&K.any&&!S.zen?K.off:0;}
// extra dryer steam per ton (more water into the dryers, or 1st section steam turned up), as energy cost (07-sim-step.js)
function knobSteamCost(prod){const K=S.knob;if(!K||!K.any||S.zen||K.sf===1)return;{const v=prod*ECON.energy*P.energyMul*0.6*(K.sf-1)*(P.costMul||1);spend(v,"energy");pfAdd("steam","pm",v);}}

function knobTick(dt){const K=S.knob;if(!K||!K.any||S.zen)return;
  const v=K.v,x=K.x,L=(a,t,tau)=>kLag(a,t,tau,dt),H=K.H,run=S.pm==="run";
  // ---- knob incidents that cleared: the crew resets the cause ----
  for(let i=K.inc.length-1;i>=0;i--){const ki=K.inc[i];if(S.inc.some(n=>n.real===ki.real&&n.id===ki.id))continue;K.inc.splice(i,1);
    const who={rotortrip:"Stock prep",overflow:"Stock prep",refclash:"Maintenance",boiler:"The engineers",fabric:"The wet-end crew",oscfail:"Maintenance",couchpit:"The wet-end crew"}[ki.id];
    const head={rotortrip:"Pulper back on line.",overflow:"Pulper overflow cleaned up.",refclash:"Refiner re-plated.",boiler:"Steam is back.",fabric:"New forming fabric on.",oscfail:"Oscillator restarted: the felt will clean up over the next hour.",couchpit:"Couch pit cleaned out."}[ki.id];
    if(ki.id==="couchpit")K.cs=0;
    knobFix(ki.cause,head,who);}
  // ---- stock prep ----
  x.cp=L(x.cp,5+(50-v.pulp)*0.08,25);                                  // pulper consistency (%)
  x.fr=L(x.fr,v.ref,40);                                                // refining the stock in the chest has seen (gap, mm)
  x.ch=L(x.ch,v.ref<=0.15?1:0,10);                                      // plates heating up as they run together
  x.sw=L(x.sw,v.agit>=70?0:(70-v.agit)/70,60);                          // machine chest consistency swings (0..1)
  // ---- wet end ----
  for(let i=0;i<KZONES;i++)x.z[i]=L(x.z[i],K.z[i],20);
  x.vac=L(x.vac,v.vac,15);x.pl=L(x.pl,v.press,15);
  K.wear=v.vac>45?Math.min(1.2,K.wear+dt/60*(v.vac-45)/15*0.25):Math.max(0,K.wear-dt/60*0.05);   // high vacuum drags on the forming fabric (and a fresh stretch of normal running lets it recover, slowly)
  x.st=L(x.st,v.osc>=40?0:(40-v.osc)/40,v.osc>=40?60:90);              // pick-up felt filling in stripes
  K.cs=clamp(K.cs+dt/60*(v.couch?-2:1),0,3);                            // fiber settled in the couch pit
  if(S.pm==="break"&&K.pmPrev!=null&&K.pmPrev!=="break")knobCouch();K.pmPrev=S.pm;       // any new break before the presses (random ones and rethreads too)
  // guide roll: the fabric walks a little all the time. AUTO soaks it up within its travel; trim uses travel up; MANUAL holds still
  {const walk=knobWalk();
    if(v.gm){const need=v.gt+walk,over=Math.abs(need)>30;K.gtrav=clamp(Math.abs(need)/30,0,1.5);   // out of travel: the fabric starts to walk
      K.edge=over?K.edge+Math.sign(need)*dt/60*15:Math.sign(K.edge)*Math.max(0,Math.abs(K.edge)-dt/60*15);}
    else{K.gacc+=dt/60*8;K.gtrav=0;K.edge=v.gt+(walk-(K.gw0||0))+K.gacc;}}
  // ---- water into the dryers and the steam that dries it ----
  // (only the refiner can make it drier than normal, and then only the moisture moves: no knob ever saves steam)
  const W=1+Math.max(0,0.5-x.fr)*1.0-Math.max(0,x.fr-0.5)*0.4+Math.max(0,30-x.vac)*0.015+Math.max(0,100-x.pl)*0.012;
  x.d1=L(x.d1,(v.st1-70)/130*0.35,8);
  // v6.5 b5: moisture, the 3rd section and the boiler header come from the dryer model (07d), which now also sees speed
  const a0=clamp(W-x.d1,0.7,1.3),Dr=dryState();K.W=W;K.d1x=x.d1;K.a=Dr.st3/(DRY.base[C.grade]||122);
  x.m=Dr.m;                                                             // reel moisture (%)
  K.sf=Math.max(1,a0+Math.max(0,x.d1));                                 // steam load per ton (1 = normal, never less): the cost side
  // boiler header sagging under the load: the boiler's own limit (07d), or (v6.5.2) the knobs holding the dryers' total
  // steam per ton (the 3rd section's share plus the 1st's, a0 + d1) at its 30% top for a while. With the 1st section
  // turned down the 3rd takes its share over, which isn't more steam, so that alone doesn't trip it.
  x.bk=L(x.bk||0,a0+x.d1>=1.29?1:0,40);x.bs=Math.max(clamp((1-Dr.hdr)/0.45,0,1),x.bk);
  x.dl1=L(x.dl1||0,Math.max(0,1.0-v.draw),10);x.dl=L(x.dl,x.dl1,10);   // (two stages: the reel has to build a few wraps before the wrinkles show)
  x.cr1=L(x.cr1||0,Math.max(0,x.pl-115)/30,10);x.cr=L(x.cr||0,x.cr1,10);x.dt=L(x.dt,Math.max(0,v.draw-2.4),10);
  // ---- consequences: off-spec ----
  const nz=x.z.filter(z=>Math.abs(z)>4).length;
  const F={wet:x.m>10?(x.m-10)/4:0,dry:x.m<4?(4-x.m)/2:0,cd:nz/3,bw:x.sw>0.3?(x.sw-0.3)/0.6:0,crush:x.cr>0.05?(x.cr-0.05)/0.6:0,stripes:x.st>0.4?(x.st-0.4)/0.4:0,wrinkles:x.dl>0.15?(x.dl-0.15)/0.6:0};
  // (v6.5.3: weight and moisture are judged against the grade's spec by the QCS check, 07e; F.wet, dry and bw stay for
  // the screens and the crew's tracing, and only the other defects send a share of the reel to the beater from here)
  let keep=1,top="",tv=0;for(const k in F){const f=clamp(F[k],0,1);F[k]=f;if(k==="wet"||k==="dry"||k==="bw")continue;keep*=1-f;if(f>tv){tv=f;top=k;}}
  const off=1-keep;
  if(off>0.02&&K.off<=0.02&&run)log(`QCS: the reel is going to the beater (${KOFFN[top]}).`,"warn");
  if(off<=0.02&&K.off>0.02)log("QCS: the reel is back on spec.","ok");
  K.off=off>0.005?off:0;K.offWhy=tv>0.005?top:"";K.F=F;
  K.feed=x.cp<4?clamp(x.cp/4,0.5,1):1;
  K.brk=1+Math.max(0,x.fr-0.6)*4;
  // ---- consequences: breaks (deterministic: a hazard builds and the sheet goes when it is full) ----
  const haz=(k,rate,type,why,hk)=>{if(rate<=0){H[k]=Math.max(0,(H[k]||0)-dt/120);return;}H[k]=(H[k]||0)+dt/60*rate;if(H[k]>=1&&run){H[k]=0;knobBreak(type,why);const h=hk||k;(K.harm[h]||(K.harm[h]={t:0,n:0})).n++;}};
  haz("draw",x.dt*3,"dryer","Sheet break in the open draw: the sheet snapped going into the dryers.");
  haz("agit",x.sw>0.7?(x.sw-0.7)*4:0,"press","Sheet break at the wet end: a heavy spot in the sheet tore at the couch.");
  haz("vac",x.vac<15?(15-x.vac)/10*1.5:0,"press","Sheet break at the wet end: the sheet left the couch too wet to hold together.");
  haz("crush",x.pl>130?(x.pl-130)/20*1.5:0,"press","Sheet break in the presses: the sheet was crushed in the nip.");
  haz("wet",x.m>13?(x.m-13)*0.8:0,"dryer","Sheet break in the dryers: the sheet was too wet to hold.","moist");
  haz("dry",x.m<3?(3-x.m)*0.8:0,"reel","Sheet break at the reel: the sheet was dried brittle.","moist");
  // ---- consequences: breakdowns ----
  if(x.cp>7.5&&!active("rotortrip")&&!S.M.pulperDown){if(knobTrig("rotortrip",["pulp"],"The pulper rotor tripped out on high amps! The tub is too thick to turn."))x.cp=5;}
  if(x.cp<2.2&&!active("overflow")){if(knobTrig("overflow",["pulp"],"The pulper is overflowing! Too much water in the tub, and it is pouring over the rim."))x.cp=5;}
  if(x.ch>0.8&&!active("refclash")){if(knobTrig("refclash",["ref"],"Refiner plates clashed! The gap was run in until metal met metal."))x.ch=0;}
  if(x.bs>0.85&&!active("boiler")){const c=knobSteamCulprits();if(knobTrig("boiler",c,"The boiler tripped! The dryers were pulling more steam than it could make.")){x.bs=0;x.bk=0;}}
  if(Math.abs(K.edge)>50&&!active("fabric")){if(knobTrig("fabric",["guide"],"The forming fabric ran off the rolls! It tracked off the tending side and folded up."))K.edge=0;}
  if(K.wear>=1&&!active("fabric")){if(knobTrig("fabric",["vac"],"The forming fabric failed: worn through over the vacuum boxes."))K.wear=0;}
  if(x.st>0.6&&v.osc<40&&!active("oscfail")){knobTrig("oscfail",["osc"],"Stripes on the pick-up felt! Maintenance called to the felt showers.");}
  // ---- off-spec and breaks the shift traces back after a while ----
  const tr=(k,bad,mins,ids,head,who)=>{const h=K.harm[k]||(K.harm[k]={t:0,n:0});if(bad){h.t+=dt;if(h.t>=mins||h.n>=3){h.t=0;h.n=0;knobFix(ids(),head,who);}}else h.t=Math.max(0,h.t-dt*0.5);};
  tr("cd",F.cd>0,90,()=>["zones"],"QCS: streaks in the CD profile.","The wet-end operator");
  tr("agit",F.bw>0||(H.agit||0)>0.2,180,()=>["agit"],"QCS: basis weight swinging up and down.","Stock prep");
  tr("crush",F.crush>0||(H.crush||0)>0.2,180,()=>["press"],"QCS: crush marks in the sheet.","The press operator");
  tr("wrinkles",F.wrinkles>0,180,()=>["draw"],"Wrinkles in the reel.","The dry-end operator");
  tr("draw",(K.harm.draw&&K.harm.draw.n>0)||(H.draw||0)>0.2,240,()=>["draw"],"Breaks going into the dryers.","The dry-end operator");
  tr("vac",(H.vac||0)>0.2,240,()=>["vac"],"Wet-end breaks.","The wet-end operator");
  tr("steam",K.sf>1.08,720,()=>knobSteamCulprits(),"The steam bill is well up on the week.","The energy engineer");
  tr("feed",K.feed<0.95,480,()=>["pulp"],"Stock prep can't keep the chest up: the pulper is running thin.","Stock prep");
  tr("moist",F.wet>0||F.dry>0||(K.harm.moist&&K.harm.moist.n>0),180,()=>F.wet>0?knobSteamCulprits():["st1","ref"].filter(i=>!knobAt(i)),F.wet>0?"QCS: the sheet is coming off the reel wet.":"QCS: the sheet is coming off the reel over-dried.","The process engineer");
  // ---- all back at ideal and settled: stop running ----
  if(!knobsOff().length&&!K.inc.length&&K.cs<0.01&&K.wear<0.001&&Math.abs(x.cp-5)<0.02&&Math.abs(x.fr-0.5)<0.002&&x.ch<0.01&&x.sw<0.005&&Math.abs(x.vac-30)<0.05&&Math.abs(x.pl-100)<0.05&&x.st<0.005&&Math.abs(x.d1)<0.001&&Math.abs(x.m-7)<0.02&&x.bs<0.01&&x.dl<0.002&&(x.dl1||0)<0.002&&(x.cr||0)<0.002&&(x.cr1||0)<0.002&&x.dt<0.002&&x.z.every(z=>Math.abs(z)<0.02)&&K.off===0){
    K.any=false;K.off=0;K.sf=1;K.feed=1;K.brk=1;K.edge=0;K.gtrav=0;K.H={};K.harm={};S.M=mods();}
}
const KOFFN={wet:"sheet too wet",dry:"sheet over-dried",cd:"CD moisture streaks",bw:"basis weight swings",crush:"crush marks",stripes:"stripes from the pick-up felt",wrinkles:"wrinkles in the reel"};
// what is putting the extra water into the dryers (or the extra steam on): the knobs the engineers will trace
function knobSteamCulprits(){const K=S.knob;if(!K)return [];const v=K.v,c=[];
  if(v.ref<0.5)c.push(["ref",(0.5-v.ref)*1.0]);if(v.vac<30)c.push(["vac",(30-v.vac)*0.015]);if(v.press<100)c.push(["press",(100-v.press)*0.012]);if(v.st1!==70)c.push(["st1",Math.abs(v.st1-70)/130*0.35]);
  c.sort((a,b)=>b[1]-a[1]);return c.filter(r=>r[1]>0.02).map(r=>r[0]);}
// readings for the DCS and QCS screens. With S.knob missing everything reads at its standard value.
// Base values follow PM3's own run data: reel speed, basis weight and 3rd section steam by grade, the stock prep level.
function knobRead(){const K=S.knob,x=K?K.x:null,g=GRADES[C.grade]||GRADES["23m"],bw=g.bw,run=S.pm==="run";
  const z=x?x.z:new Array(KZONES).fill(0),sw=x?x.sw:0,t=S.t;
  const wob=(f,k)=>Math.sin(t*f+k)*0.6+Math.sin(t*f*2.7+k*2)*0.4;   // smooth stand-in for process noise (no dice)
  const Dr=S.dry,st3=Dr?Dr.st3:(DRY.base[C.grade]||122);   // (v6.5 b5: the dryer model, 07d)
  const m=Dr?Dr.m:7,cp=x?x.cp:5;
  return {run,cp,amps:410*(0.55+cp/5*0.45)*(S.M.pulperDown?0:1),pulpLvl:clamp(62+(5-cp)*9+wob(0.05,1)*1.5,0,110),
    gap:x?x.fr:0.5,refkw:run?2100*(1+Math.max(0,0.5-(x?x.fr:0.5))*1.6-Math.max(0,(x?x.fr:0.5)-0.5)*0.8):0,csf:450+((x?x.fr:0.5)-0.5)*380,
    mcLvl:69+wob(0.02,2)*3,mcCons:3.2+sw*0.9*wob(0.21,3),agit:knobVal("agit"),
    vac:x?x.vac:30,couchSol:19+((x?x.vac:30)-30)*0.18,pl:x?x.pl:100,pressSol:44+((x?x.pl:100)-100)*0.09,
    edge:K?K.edge:0,gtrav:K?K.gtrav:0,gm:knobVal("gm"),stripes:x?x.st:0,cs:K?K.cs:0,couch:knobVal("couch"),osc:knobVal("osc"),wear:K?K.wear:0,
    st1:knobVal("st1"),st3,steam:run?(Dr?Dr.steam:50.5*S.pmSpeed/2736):0,boiler:Dr?Dr.hdr:1,moist:run?m+wob(0.13,4)*0.25:0,
    bw:run?bw*(1+sw*0.08*wob(0.21,3))+wob(0.11,5)*0.12:0,draw:knobVal("draw"),tension:run?1.0+(knobVal("draw")-1.5)*0.42:0,
    zones:z.map((v,i)=>m+v*0.35+Math.sin(i*1.7+t*0.01)*0.12),off:qualStatus().off,why:qualStatus().why,F:K&&K.F||{},speed:S.pmSpeed};}
// DCS / QCS trend history: a reading every 2 sim minutes, 6 hours kept. Read-only on the sim (it never writes S), kept
// outside S so saves don't grow; a new game or a loaded save starts it fresh.
const KHIST={S:null,t:-1,a:[]};
function knobHist(){if(KHIST.S!==S){KHIST.S=S;KHIST.a.length=0;KHIST.t=-1;}const k=Math.floor(S.t/2);if(k===KHIST.t)return;KHIST.t=k;
  const r=knobRead(),u=v=>r.run?v:null,row=KHIST.a.length>=180?KHIST.a.shift():[];row.length=0;   // (readings that only exist with a sheet on are left blank while the machine is down)
  row.push(S.t,r.cp,r.amps,r.gap,u(r.refkw),r.mcCons,r.vac,u(r.couchSol),r.pl,u(r.pressSol),r.edge,r.st1,u(r.st3),u(r.steam),r.boiler,u(r.moist),u(r.bw),u(r.tension),r.pulpLvl,r.stripes,r.off);KHIST.a.push(row);}   // (rows reused once 6 h are full)
const KH_COL={cp:1,amps:2,gap:3,refkw:4,mcCons:5,vac:6,couchSol:7,pl:8,pressSol:9,edge:10,st1:11,st3:12,steam:13,boiler:14,moist:15,bw:16,tension:17,pulpLvl:18,stripes:19,off:20};
