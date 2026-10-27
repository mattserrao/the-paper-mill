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
// v6.13.2-t3: the 1st section knob's share of the drying, 40 psig standard on 0-100: the same reach both ends as t1's 0-150
// (full open takes 0.485 of the load off the 3rd section, shut adds 0.188)
const st1D=p=>(p-40)/(p>40?60/0.485:40/0.188);
const KNOB_IDEAL={pulp:50,ref:60,agit:100,gbox:1,lvac:5,vac:30,press:100,osc:100,couch:1,cbox:-6,draw:1.5,st1:40,gm:1,gt:0,incomer:1,hood:0,tcv:100,puv:10,sqz:0,kos:250};   // (v6.14: puv, sqz, kos)
const KNOBS=[
  {id:"pulp",name:"Pulper dilution valve",area:"SPOT",where:"Pulper, stock prep",field:true,unit:"% open",min:0,max:100,step:1,
    tip:"Dilution water into the pulper tub: NV-101, which holds the consistency on AUTO. Moving it here puts NV-101 on MAN at that opening."},
  {id:"ref",name:"Refining energy",area:"SPOT",where:"Twin refiners, behind the headbox",field:true,unit:"kWh/t",min:20,max:130,step:1,
    tip:"Specific refining energy: the plate gap closes to put it in. More refining makes stronger paper (so a lighter sheet can pass on strength) but it drains slower on the table. Standard is 60 kWh/t."},
  {id:"agit",name:"Machine chest agitator",area:"SPOT",where:"Machine chest, stock prep",field:true,unit:"% speed",min:0,max:100,step:5,
    tip:"Keeps the refined stock in the machine chest mixed. Normally runs flat out."},
  {id:"zones",name:"Headbox dilution zones",area:"WET",where:"Wet end DCS",dcs:true,
    tip:"Twelve dilution valves across the headbox trim the cross-direction profile. All zones normally sit at 0%."},
  // v6.12.1-t7 the forming table's vacuum zones, headbox to couch: the forming board (blades, no vacuum), the gravity boxes,
  // the low vacuum boxes and the high vacuum flatboxes, all on one vacuum pump through their own control valves (PV-311..313).
  // Vacuum reads in inHg; the high vacuum knob keeps its kPa inside (dk: shown x 1/3.386) so saves and the model don't move
  {id:"gbox",name:"Gravity box vacuum",area:"WET",where:"Wet end DCS · PV-311",dcs:true,unit:"inHg",min:0,max:5,step:0.1,dp:1,
    tip:"A light vacuum on the wet suction boxes just after the forming board, where the sheet is mostly water. Too little and the early drainage is lost; too much seals the sheet and drags on the fabric. Standard is 1.0 inHg."},
  {id:"lvac",name:"Low vacuum boxes",area:"WET",where:"Wet end DCS · PV-312",dcs:true,unit:"inHg",min:2,max:10,step:0.1,dp:1,
    tip:"The low vacuum boxes in the middle of the table, as the sheet sets. Too little leaves water for the flatboxes; too much drags on the fabric and wears it. Standard is 5.0 inHg."},
  {id:"vac",name:"High vacuum flatboxes",area:"WET",where:"Wet end DCS · PV-313",dcs:true,unit:"inHg",dk:1/3.386,min:5,max:60,step:1,dp:1,
    tip:"The high vacuum flatboxes at the dry end of the table pull the last free water out before the couch. Standard is 8.9 inHg; above 13 inHg they wear the fabric out."},
  {id:"press",name:"Press loading",area:"WET",where:"Wet end DCS",dcs:true,unit:"kN/m",min:50,max:150,step:1,
    tip:"Nip load in the twin press. Standard is 100 kN/m."},
  {id:"guide",name:"Fabric guide roll",area:"WET",where:"Forming section, tending side",field:true,
    tip:"Keeps the forming fabric tracking down the middle of the rolls. Normally on AUTO with no trim."},
  {id:"couch",name:"Couch pit agitator",area:"WET",where:"Couch pit, under the wire",field:true,
    tip:"Keeps the broke in the couch pit moving. Normally running."},
  {id:"cbox",name:"Couch suction box",area:"WET",where:"Couch roll, tending side",field:true,unit:"°",min:-15,max:15,step:1,
    tip:"Turns the vacuum box inside the suction couch roll, which sets where on the roll the suction zone sits under the wire. Rotated to its best position the box seals best and pulls the most vacuum; turned either way it seals worse, the vacuum falls and the sheet leaves the couch wetter. Standard is −6°."},
  // v6.14 the suction pick-up roll (lifts the sheet off the wire onto the pick-up felt), the couch trim squirts and the
  // knock-off shower (07b tick: PUR)
  {id:"puv",name:"Pick-up roll vacuum",area:"WET",where:"Suction pick-up roll, tending side",field:true,unit:"inHg",min:0,max:20,step:0.5,dp:1,
    tip:"Vacuum in the suction pick-up roll's transfer zone, which lifts the sheet off the forming fabric onto the pick-up felt. Too little and the sheet stays on the wire and breaks at the transfer; too much and the holes mark the sheet through the felt. Standard is 10 inHg."},
  {id:"sqz",name:"Trim squirts",area:"WET",where:"Wet end DCS · couch trim squirts",dcs:true,unit:"in a side",min:-3,max:3,step:0.25,dp:2,
    tip:"The two high-pressure water jets at the couch that cut the sheet's edges and set its width. 0 follows the deckle and the trim plan. In (−) cuts more off each edge: that fiber goes back down the couch pit, so fewer tons reach the reel. Out (+) leaves the thin, ragged deckle edge on the sheet: edge defects at the winder and edge breaks."},
  {id:"kos",name:"Knock-off shower",area:"WET",where:"Wet end DCS · couch",dcs:true,unit:"psi",min:0,max:400,step:10,
    tip:"A shower just after the trim squirts that knocks the cut edge trim off the wire into the couch pit. Standard is 250 psi. Too weak and the trim rides on with the sheet into the first press nip."},
  {id:"osc",name:"Pick-up felt oscillator",area:"WET",where:"Pick-up felt showers, 1st press top felt",field:true,unit:"% stroke speed",min:0,max:100,step:5,
    tip:"Sweeps the felt-cleaning shower back and forth across the pick-up felt. Normally 100%."},
  {id:"incomer",name:"MCC main incomer",area:"DRV",where:"MCC, the incoming 480 V section",field:true,
    tip:"The main 480 V breaker that feeds all three drive lineups. It stays closed. Opening it under load draws an arc."},
  {id:"draw",name:"Press-to-dryer draw",area:"DET",where:"Dry end DCS",dcs:true,unit:"%",min:0,max:4,step:0.05,dp:2,
    tip:"Speed difference between the presses and the first dryers, which keeps the open draw taut. Standard is 1.5%. More draw stretches the sheet and lowers ring crush; less lets it flutter and break more often."},
  {id:"st1",name:"1st section steam",area:"DET",where:"Dry end DCS",dcs:true,unit:"psig",min:0,max:100,step:2,
    tip:"Steam pressure in the first dryer section. The 3rd section is on automatic moisture control. Standard is 40 psig."},
  // v6.13: the thermocompressor's motive steam hand valve, in the dryer basement (07m): pinched, PDC-304 can't hold the
  // 3rd section's syphon ΔP and the cans flood from the back of the section forward
  {id:"tcv",name:"Thermocompressor motive valve",area:"STM",where:"Dryer basement, the motive steam line to TC-304",field:true,unit:"% open",min:0,max:100,step:5,
    tip:"The hand valve on the motive steam line to the thermocompressor. Normally wide open: PDC-304 throttles the motive steam itself. Pinch it and the thermocompressor can't hold the syphons' differential pressure, and the dryer cans start to fill with condensate."},
  {id:"hood",name:"Dryer hood doors",area:"DET",where:"Dryer hood, tending side",field:true,
    tip:"The lifting doors on the front of the dryer hood. They go up on their own on a sheet break or whenever the machine is down, and drop again once the sheet is back on. Raised here, they stay up while the machine runs: you can see the cans, but the hood leaks heat and the dryers burn more steam."},
];
// v6.11.1: the dryer hood doors raised on the knob while the machine runs (the 3D front section lifts off 2 s later, 25-3d):
// the hood leaks its hot air, so the dryers use 4% more steam per ton (cost, the DCS steam reading and the boiler's load)
const HOOD_STEAM=0.04;
// v6.12.1-t7 the open draw has to rise with speed: 1.5 % at the grade's standard speed (2,632 fpm on 24 lb) and 0.1 % more
// for every 100 fpm faster (less when slower). drawBrk: the break multiplier under what the speed needs (mods, 04), as
// v6.8.3 had it under 1.5 %. t8: a speed upgrade raises the draw with it (buy, 08: drawUpg), so its standard, drawStd(), is
// 1.5 % plus what the upgrades' speed needs (S.drawUp); the knob, its reset and the ring crush reference all use that
const DRAWV={d0:1.5,k:0.1};
const drawStd=()=>DRAWV.d0+(S&&S.drawUp||0);
const drawReq=sp=>Math.max(0.5,DRAWV.d0+DRAWV.k*((sp??(S.pm==="run"?S.pmSpeed:C.pmSp.v))-(GRADES[C.grade]||GRADES["24"]).sp)/100);
// a purchase that made the machine faster (P.spBonus up by db fpm): the draw goes up to match, and the log says so
function drawUpg(db){if(!(db>0)||S.zen)return;const d=Math.round(DRAWV.k*db/100*100)/100;S.drawUp=(S.drawUp||0)+d;
  const K=S.knob;if(K&&K.v.draw!=null)K.v.draw=Math.round((K.v.draw+d)*100)/100;
  log(`Open draw raised to ${knobVal("draw").toFixed(2)}% for the faster machine (+${Math.round(db)} fpm needs +${d.toFixed(2)}%).`,"ok");}
const drawBrk=()=>S.pm==="run"?1+1.2*Math.pow(Math.max(0,drawReq()-knobVal("draw")),1.3):1;
const hoodUp=()=>{const K=S.knob;return !!(K&&K.any&&!S.zen&&K.v.hood);};
const KNOBN=Object.fromEntries(KNOBS.map(k=>[k.id,k]));
// v6.5.5: the headbox slice (opening B and lip position L, -1..1, kept in the knob state as sv / sh so it's saved and
// replayed) is a knob for the crew's tracing too; its own panel and the WET DCS set it (50-view-spider.js, 50d)
KNOBN.slice={id:"slice",name:"Headbox slice",area:"WET",where:"Headbox L/B gauge"};
function slcGet(){const K=S.knob;return {v:(K&&K.v.sv)||0,h:(K&&K.v.sh)||0};}
function slcSet(k,val){if(S.zen)return;const K=knobState();K.v[k==="v"?"sv":"sh"]=clamp(+val,-1,1);K.any=true;K.moved.slice=S.t;
  if(G3.SLC){G3.SLC[k]=K.v[k==="v"?"sv":"sh"];G3.SLC.dirty=true;}}
/* ---- v6.5.5 the dewatering chain: jet → forming table → vacuum → couch → presses → dryers ----
   Couch solids start from 19% and lose ground when the jet (J/W and its angle: the slice) is off its best point, when
   the forming vacuum is off its best point either way (much more below it than above), or when tight refining slows
   drainage (open refining drains a little faster). Press solids start from the couch solids (point for point) on
   44% (48% with the shoe press) and rise with nip load: 0.2 a kN/m below the 100 standard, 0.08 above it, and past
   130 the nip crushes the sheet and they fall away (crush marks already show from 115). Water into the dryers per ton is
   0.93 / press solids - 1, against the standard's: W, the wet end's water factor the dryers use (07d). Drier in, less
   steam; wetter, more, both ways (before v6.5.5 no knob ever saved steam). Untouched, every factor is exactly 1. */
/* v6.12.1-t6 the couch suction box (cb, degrees, -15..+15): best at CBOX.best (-6), where it pulls CBOX.v0 kPa; the
   vacuum falls with the square of the angle off best, CBOX.dv kPa at the far end of the range (21 degrees off), and couch
   solids fall in step, CBOX.dcs points at the far end (19 > 16.5 %). Untouched it is exactly 1. */
const CBOX={best:-6,span:21,v0:60,dv:25,dcs:2.5};
const cboxOff=cb=>Math.min(1,((cb??CBOX.best)-CBOX.best)/CBOX.span)**2,cboxVac=cb=>CBOX.v0-CBOX.dv*cboxOff(cb);
/* v6.12.1-t7 the gravity boxes (gb) and low vacuum boxes (lv), inHg, each best at its standard: under it the early drainage
   is lost (couch solids fall, about 1 point at the bottom of the range); over it the sheet seals and the fabric drags
   (about 1 point at the top). Untouched they are exactly 1. Wear on the fabric (07b tick) and the couch drive load (07i)
   rise with vacuum over the standard; FZ.pv() is the pump's power and the valve openings for the DCS */
const FZ={gb:1,lv:5,in:3.386,pv:(gb,lv,hv)=>{const hi=hv/3.386;return {kw:(120+14*gb+16*lv+22*hi)*1.55,   /* (v6.13.2: ~25 kWh/t, real vacuum power; a larger share of the same balance-of-plant power) */gv:clamp(12+gb/5*70,0,100),lv:clamp(10+(lv-2)/8*72,0,100),hv:clamp(8+(hi-1.5)/16.2*78,0,100)};}};
const fzNow=()=>{const x=S.knob&&S.knob.x,gb=x&&x.gb!=null?x.gb:FZ.gb,lv=x&&x.lv!=null?x.lv:FZ.lv,hv=x?x.vac:30;return {gb,lv,hi:hv/FZ.in,kw:FZ.pv(gb,lv,hv).kw};};   // (cheap: the 3D labels)
const eGb=gb=>{const d=((gb??FZ.gb)-FZ.gb)/4;return 1-(d<0?0.8:0.05)*d*d;},eLv=lv=>{const d=((lv??FZ.lv)-FZ.lv)/5;return 1-(d<0?0.12:0.05)*d*d;};
function dewater(fr,vac,pl,jv,jh,cb,gb,lv,sb){
  const eJet=1-0.25*jv*jv-0.15*jh*jh,dv=(vac-30)/30,eVac=1-(dv<0?0.58:0.15)*dv*dv,eRef=eDrain(csfOf(fr)),eBox=1-CBOX.dcs/19*cboxOff(cb),eZ=eGb(gb)*eLv(lv);   // (v6.8: drainage follows freeness, 07g)
  const eSb=1-0.03*Math.max(0,sb||0);   // (v6.13: a wider slice runs a thinner headbox: more water to drain, 07n)
  const cs=clamp(19*eJet*eVac*eRef*eBox*eZ*eSb+CD.sbCouch*LV("steambox")+shCsAdd(),8,27.5),   /* (v6.11: the steam box, 07k; v6.13: broke over 15%, 07n) */pb=44+4*LV("shoe")+shPsAdd();   // (v6.13: a felt filled with stickies)
  const lt=pl<100?0.2*(pl-100):pl<=130?0.08*(pl-100):2.4-0.3*(pl-130);
  const ps=clamp(pb+(cs-19)+lt,30,56),wpt=p=>(1-DRY.m0/100)/(p/100)-1;
  return {cs,ps,W:wpt(ps)/wpt(pb),eJet,eVac,eRef,eBox,eZ};}
/* v6.14 the suction pick-up roll: its transfer zone pulls PUR.v0 inHg (its holding zone about 60% of that) through the
   felt to lift the sheet off the wire. Under PUR.lo the transfer fails more and more (press breaks); over PUR.mark the
   drilled holes print through the felt (a share of the reel to the beater). The trim squirts (in per side, 0 = the
   deckle): in sends 2 x that of the web back down the couch pit (fewer tons at the reel, the fiber kept as broke); out
   leaves the ragged deckle edge on (edge defects, edge breaks). The knock-off shower (psi) under PUR.kosLo lets the
   trim ride into the press. Untouched: none of it. */
const PUR={v0:10,lo:6,mark:13,kos:250,kosLo:120,zones:[["Sealing",0.3],["Transfer",1],["Holding",0.6],["Sealing",0.3]],holes:{d:0.157,pitch:0.5,open:0.22}};
const sqzLoss=()=>{const K=S.knob;if(!K||!K.any||S.zen)return 0;const q=K.v.sqz??0;return q<0?2*(-q)/webW():0;};
const KZONES=12;
function knobState(){if(!S.knob){S.knob={v:Object.assign({},KNOB_IDEAL,{draw:drawStd()}),z:new Array(KZONES).fill(0),
    x:{cp:5,fr:0.5,ch:0,sw:0,vac:30,pl:100,st:0,d1:0,m:8,dl:0,dt:0,bs:0,z:new Array(KZONES).fill(0)},
    any:false,cs:0,wear:0,gacc:0,gm0:0,H:{},harm:{},off:0,offWhy:"",sf:1,a:1,W:1,feed:1,brk:1,edge:0,gtrav:0,inc:[],warned:{},moved:{}};}
  if(S.knob.pmPrev==null)S.knob.pmPrev=S.pm;if(S.rng&&S.rng.knob==null)S.rng.knob=(S.seed^0x6b9f3c21)|0;return S.knob;}
function knobVal(id){if(id==="pulp"){const o=vlvPulpOP();if(o!=null)return o;}const K=S.knob,d=id==="draw"?drawStd():KNOB_IDEAL[id];return K?(K.v[id]??d):d;}   // (v6.9: the pulper dilution valve is NV-101's)
function knobAt(id){const K=S.knob;if(!K)return true;if(id==="pulp"&&vlvT("NV-101"))return false;if(id==="slice")return !K.v.sv&&!K.v.sh&&Math.abs(hbJwSp()-HB.jw0)<1e-9;if(id==="zones")return K.z.every(v=>v===0);if(id==="guide")return K.v.gm===1&&K.v.gt===0;if(id==="draw")return Math.abs((K.v.draw??drawStd())-drawStd())<0.001;return (K.v[id]??KNOB_IDEAL[id])===KNOB_IDEAL[id];}
// the player moves a knob (UI): v is the new value (zones: [i,v]; guide: {gm,gt})
function knobSet(id,v){if(S.zen)return;const K=knobState();
  if(id==="zones"){const [i,z]=v;K.z[i]=clamp(Math.round(z),-10,10);}
  else if(id==="guide"){if(v.gm!=null&&v.gm!==K.v.gm){K.v.gm=v.gm;if(v.gm===0){K.gacc=0;K.gw0=knobWalk();}}if(v.gt!=null)K.v.gt=clamp(Math.round(v.gt),-40,40);}
  else if(id==="pulp"){vlvSetOP("NV-101",clamp(+v,0,100));}   // (v6.9: the field valve puts NV-101 on MAN)
  else{const d=KNOBN[id];K.v[id]=d&&d.min!=null?clamp(+v,d.min,d.max):+v;}
  if(id==="incomer"&&!K.v.incomer)knobArc();   // (v6.10 t5: opened under load: an arc flash, at once)
  K.any=true;K.moved[id]=S.t;}
function knobFmt(id){const K=S.knob,d=KNOBN[id];if(id==="slice"){const s=slcGet();return `B ${slcMm(s.v).toFixed(1)} mm · L ${s.h>=0?"+":""}${(4*s.h).toFixed(1)} mm · J/W ${hbJw().toFixed(3)}`;}if(id==="zones"){const z=K?K.z:[];const n=z.filter(v=>v!==0).length;return n?`${n} zone${n>1?"s":""} trimmed`:"all zones 0%";}
  if(id==="guide"){const v=K?K.v:KNOB_IDEAL;return (v.gm?"AUTO":"MANUAL")+(v.gt?` · trim ${v.gt>0?"+":""}${v.gt} mm`:"");}
  if(id==="couch")return knobVal("couch")?"running":"stopped";
  if(id==="incomer")return knobVal("incomer")?"closed":"open";
  if(id==="hood")return knobVal("hood")?"raised":"closed";
  const v=knobVal(id)*(d.dk||1);return `${v.toFixed(d.dp||0)} ${d.unit}`;}
function knobReset(id,quiet){const K=S.knob;if(!K)return;
  if(id==="slice"){K.v.sv=K.v.sh=0;if(S.hb)S.hb.jw=HB.jw0;if(G3.SLC){G3.SLC.v=G3.SLC.h=0;G3.SLC.dirty=true;}}
  else if(id==="zones")K.z.fill(0);else if(id==="guide"){K.v.gm=1;K.v.gt=0;K.gacc=0;}else K.v[id]=id==="draw"?drawStd():KNOB_IDEAL[id];
  if(id==="pulp")vlvRevert("NV-101",quiet);   // (v6.9)
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
  if(id==="pulp"){x.cp=5;vlvSettle("NV-101");}else if(id==="ref"){x.fr=0.5;x.ch=0;}else if(id==="vac"){x.vac=30;K.wear=0;}else if(id==="press"){x.pl=100;x.cr1=x.cr=0;}
  else if(id==="draw"){x.dl1=x.dl=x.dt=0;}else if(id==="st1")x.d1=0;else if(id==="agit")x.sw*=0.3;else if(id==="guide"){K.edge=0;K.gacc=0;}else if(id==="couch")K.cs=0;else if(id==="slice")x.jv=x.jh=x.sb=0;else if(id==="cbox")x.cb=CBOX.best;else if(id==="gbox")x.gb=FZ.gb;else if(id==="lvac")x.lv=FZ.lv;}
// a knob-caused breakdown. Like trigger() but with the "knob" dice for its length, no civics card and no leader auto-fix
// (the knob is the root cause, and the crew resets it when the job is done). Uses the upset's own 3D effect and repair bill.
function knobTrig(id,cause,why){if(active(id))return false;const K=S.knob,e=EV[id];if(S.rng.knob==null)S.rng.knob=(S.seed^0x6b9f3c21)|0;
  const dur=(e.dur[0]+rand("knob")*(e.dur[1]-e.dur[0]))*durMul(id);
  const inc={id,left:dur,total:dur,real:performance.now(),note:"",knob:cause};
  if(id==="refclash"){inc.billMul=0.5;inc.note="refiners down: the machine chest is running down";}   // (v6.9.2: no forward flow, 07g mcTick)
  S.inc.push(inc);(S.evc||(S.evc={}))[id]=(S.evc[id]||0)+1;if(QINC(id))enqueue(id);S.lastInc=S.t;S.tot.incidents++;try{AUDIO.event(id);}catch(_){}
  BANNERS.push({text:why||e.head,t:null,id});while(BANNERS.length>3)BANNERS.splice(1,1);
  if(e.start&&id!=="refclash")e.start(inc);
  const bill=(REPAIR[id]||0)*P.repairMul*(inc.billMul||1);if(bill>0){spend(bill,"repairs");inc.bill=bill;inc.note=(inc.note?inc.note+" · ":"")+`repair bill ${money(bill)}`;}
  log((why||e.head)+(inc.note?` (${inc.note})`:""),"bad");K.inc.push({id,real:inc.real,cause});S.M=mods();return true;}
const KBC={draw:"draw",agit:"stock",vac:"cloth",crush:"cloth",wet:"dry",dry:"dry",pick:"cloth",knock:"cd",edge:"cd"};   // (v6.13 t3: each knob break's cause in the break log, 07n BRKN)
// a knob-caused sheet break (no dice from the break stream: those keep their place for the random breaks)
function knobBreak(type,why,ck){if(S.pm!=="run")return false;S.pm="break";S.brkType=type;const r=rand("knob");
  S.breakLeft=2*(type==="reel"?4+r*6:type==="dryer"?12+r*14:26+r*20);S.breakTotal=S.breakLeft;S.tot.breaks++;enqueue("brk");AUDIO.sfx("snap",2500);
  log(why,"warn");brkNote();brLog1(type,ck||"stock");return true;}
// a break before the presses dumps the whole sheet into the couch pit: with the agitator off, settled fiber lets it overflow
function knobCouch(){const K=S.knob;if(!K||S.zen||S.brkType!=="press"||K.cs<0.5||active("couchpit"))return;
  if(knobTrig("couchpit",["couch"],"Couch pit overflow! Broke from the sheet break is pouring over the pit edge onto the machine floor."))S.breakLeft+=60;}
// v6.10 t5: the MCC main incomer opened under load: an arc flash, every drive loses its supply, the electrical tech
// (suited) has to reset and close it. The knob is put back when the job is done, like every knob-caused breakdown.
function knobArc(){if(S.zen||active("arcflash"))return;
  if(knobTrig("arcflash",["incomer"],"Arc flash at the MCC! The main incomer was opened under load: all 480 V to the drive lineups is lost and every drive has stopped. The electrical tech is on the way to reset it.")&&S.rel){
    for(const A of ASSETS){const a=S.rel.a[A.id];a.dh=Math.max(0,a.dh-4-rlyHash(A.id,Math.floor(S.t),"arc")*6);}}}
// mods() calls this last (04-upsets.js): nothing changes while no knob has been touched
function knobMods(m){const K=S.knob;if(!K||!K.any||S.zen)return;if(K.feed<1)m.feedMul*=K.feed;}   // (v6.13: tight refining's breaks are in the break risk's stock swings, 07n)
// share of production going to the beater because of a knob (07-sim-step.js)
function knobOff(){const K=S.knob;return K&&K.any&&!S.zen?K.off:0;}
// extra dryer steam per ton (more water into the dryers, or 1st section steam turned up), as energy cost (07-sim-step.js)
function knobSteamCost(prod){const K=S.knob;if(!K||!K.any||S.zen||Math.abs(K.sf-1)<1e-9)return;{const v=prod*ECON.energy*P.energyMul*0.6*(K.sf-1)*(P.costMul||1);spend(v,"energy");pfAdd("steam","pm",v);}}

function knobTick(dt){const K=S.knob;if(!K||!K.any||S.zen)return;
  const v=K.v,x=K.x,L=(a,t,tau)=>kLag(a,t,tau,dt),H=K.H,run=S.pm==="run";
  // ---- knob incidents that cleared: the crew resets the cause ----
  for(let i=K.inc.length-1;i>=0;i--){const ki=K.inc[i];if(S.inc.some(n=>n.real===ki.real&&n.id===ki.id))continue;K.inc.splice(i,1);
    const who={rotortrip:"Stock prep",overflow:"Stock prep",refclash:"Maintenance",boiler:"The engineers",fabric:"The wet-end crew",oscfail:"Maintenance",couchpit:"The wet-end crew",arcflash:"The electrical tech"}[ki.id];
    const head={rotortrip:"Pulper back on line.",overflow:"Pulper overflow cleaned up.",refclash:"Refiner re-plated.",boiler:"Steam is back.",fabric:"New forming fabric on.",oscfail:"Oscillator restarted: the felt will clean up over the next hour.",couchpit:"Couch pit cleaned out.",arcflash:"Main incomer inspected, reset and closed: the drives are back."}[ki.id];
    if(ki.id==="couchpit")K.cs=0;
    knobFix(ki.cause,head,who);}
  // ---- stock prep ----
  x.cp=vlvT("NV-101")?S.vlv.lp["NV-101"].y:L(x.cp,5+(50-v.pulp)*0.08,25);   // pulper consistency (%) (v6.9: NV-101's model once touched, 07h)
  x.fr=L(x.fr,gapOf(refEff(v.ref)),40);   // (v6.12.1-t7: what the refiners can deliver at this tonnage, 07g refEff)                                         // refining the stock in the chest has seen (gap, mm; v6.8: the gap follows the energy)
  x.ch=L(x.ch,gapOf(v.ref)<=0.15?1:0,10);                                      // plates heating up as they run together
  x.sw=L(x.sw,v.agit>=70?0:(70-v.agit)/70,60);                          // machine chest consistency swings (0..1)
  // ---- wet end ----
  for(let i=0;i<KZONES;i++)x.z[i]=L(x.z[i],K.z[i],20);
  x.vac=L(x.vac,v.vac,15);x.pl=L(x.pl,v.press,15);x.cb=L(x.cb??CBOX.best,v.cbox??CBOX.best,8);x.gb=L(x.gb??FZ.gb,v.gbox??FZ.gb,10);x.lv=L(x.lv??FZ.lv,v.lvac??FZ.lv,12);   // (v6.12.1-t6: the couch box turns in about 8 minutes)
  {const wr=Math.max(0,v.vac-45)/15*0.25+Math.max(0,(v.gbox??FZ.gb)-3)/2*0.15+Math.max(0,(v.lvac??FZ.lv)-8)/2*0.2;   // (v6.12.1-t7: every zone over its limit drags on the fabric)
   K.wear=wr>0?Math.min(1.2,K.wear+dt/60*wr):Math.max(0,K.wear-dt/60*0.05);}   // high vacuum drags on the forming fabric (and a fresh stretch of normal running lets it recover, slowly)
  x.st=L(x.st,v.osc>=40?0:(40-v.osc)/40,v.osc>=40?60:90);
  x.pu=L(x.pu??PUR.v0,v.puv??PUR.v0,5);                                 // (v6.14: the pick-up roll's vacuum, a few minutes to settle)              // pick-up felt filling in stripes
  K.cs=clamp(K.cs+dt/60*(v.couch?-2:1),0,3);                            // fiber settled in the couch pit
  if(S.pm==="break"&&K.pmPrev!=null&&K.pmPrev!=="break")knobCouch();K.pmPrev=S.pm;       // any new break before the presses (random ones and rethreads too)
  // guide roll: the fabric walks a little all the time. AUTO soaks it up within its travel; trim uses travel up; MANUAL holds still
  {const walk=knobWalk();
    if(v.gm){const need=v.gt+walk,over=Math.abs(need)>30;K.gtrav=clamp(Math.abs(need)/30,0,1.5);   // out of travel: the fabric starts to walk
      K.edge=over?K.edge+Math.sign(need)*dt/60*15:Math.sign(K.edge)*Math.max(0,Math.abs(K.edge)-dt/60*15);}
    else{K.gacc+=dt/60*8;K.gtrav=0;K.edge=v.gt+(walk-(K.gw0||0))+K.gacc;}}
  // ---- water into the dryers and the steam that dries it ----
  // (only the refiner can make it drier than normal, and then only the moisture moves: no knob ever saves steam)
  // v6.5.5: the dewatering chain (dewater(), above): the slice's jet, the table, the vacuum, the couch and the presses
  {const s=slcGet();x.jv=L(x.jv||0,jwDev(),5);x.jh=L(x.jh||0,s.h,5);x.sb=L(x.sb||0,s.v,5);}   // (v6.13: the jet's speed is the fan pump's J/W, the slice opening B the headbox consistency, 07n)
  const Dw=dewater(x.fr,x.vac,x.pl,x.jv,x.jh,x.cb,x.gb,x.lv,x.sb),W=Dw.W;x.cs=Dw.cs;x.ps=Dw.ps;
  x.d1=L(x.d1,st1D(v.st1),8);
  // v6.5 b5: moisture, the 3rd section and the boiler header come from the dryer model (07d), which now also sees speed
  const a0=clamp(W-x.d1,0.7,1.3),Dr=dryState();K.W=W;K.d1x=x.d1;K.a=(Dr.h3!=null?Dr.h3:dryB())/dryB();
  x.m=Dr.m;                                                             // reel moisture (%)
  K.sf=a0+Math.max(0,x.d1)+(v.hood&&run?HOOD_STEAM:0);                 // steam load per ton (1 = normal): the cost side (v6.5.5: a drier sheet saves steam; v6.11.1: hood doors up)
  // boiler header sagging under the load: the boiler's own limit (07d), or (v6.5.2) the knobs holding the dryers' total
  // steam per ton (the 3rd section's share plus the 1st's, a0 + d1) at its 30% top for a while. With the 1st section
  // turned down the 3rd takes its share over, which isn't more steam, so that alone doesn't trip it.
  x.bk=L(x.bk||0,a0+x.d1>=1.29?1:0,40);x.bs=Math.max(clamp((1-Dr.hdr)/0.45,0,1),x.bk);
  x.dl1=L(x.dl1||0,Math.max(0,1.0-v.draw),10);x.dl=L(x.dl,x.dl1,10);   // (two stages: the reel has to build a few wraps before the wrinkles show)
  x.cr1=L(x.cr1||0,Math.max(0,x.pl-115)/30,10);x.cr=L(x.cr||0,x.cr1,10);x.dt=L(x.dt,Math.max(0,v.draw-(drawStd()+0.9)),10);
  // ---- consequences: off-spec ----
  const nz=x.z.filter(z=>Math.abs(z)>4).length;
  const F={wet:x.m>10?(x.m-10)/4:0,dry:x.m<6?(6-x.m)/2:0,cd:nz/3,bw:x.sw>0.3?(x.sw-0.3)/0.6:0,crush:x.cr>0.05?(x.cr-0.05)/0.6:0,stripes:x.st>0.4?(x.st-0.4)/0.4:0,wrinkles:x.dl>0.15?(x.dl-0.15)/0.6:0,floc:chemFloc(),mark:x.pu>PUR.mark?(x.pu-PUR.mark)/6:0,edge:(v.sqz??0)>0?(v.sqz??0)/3*0.15:0};   // (v6.11.1 floc: a polymer overdose, 07l)
  // (v6.5.3: weight and moisture are judged against the grade's spec by the QCS check, 07e; F.wet, dry and bw stay for
  // the screens and the crew's tracing, and only the other defects send a share of the reel to the beater from here)
  let keep=1,top="",tv=0;for(const k in F){const f=clamp(F[k],0,1);F[k]=f;if(k==="wet"||k==="dry"||k==="bw")continue;if((k==="cd"||k==="stripes")&&cdOn())continue;   /* (v6.11: they beater the roll under them, 07k) */keep*=1-f;if(f>tv){tv=f;top=k;}}
  const off=1-keep;
  if(off>0.02&&K.off<=0.02&&run)qualAlert(KOFFN[top]);   // (v6.5.4: banner too, 07e)
  if(off<=0.02&&K.off>0.02)log("QCS: the reel is back on spec.","ok");
  K.off=off>0.005?off:0;K.offWhy=tv>0.005?top:"";K.F=F;
  K.feed=x.cp<4?clamp(x.cp/4,0.5,1):1;
    K.brk=1+Math.max(0,x.fr-0.6)*4;   // (v6.12.1-t7: the slack-draw breaks are in mods(), 04: drawBrk(), against the draw the speed needs)
  // ---- consequences: breaks (deterministic: a hazard builds and the sheet goes when it is full) ----
  const haz=(k,rate,type,why,hk)=>{if(rate<=0){H[k]=Math.max(0,(H[k]||0)-dt/120);return;}H[k]=(H[k]||0)+dt/60*rate;if(H[k]>=1&&run){H[k]=0;knobBreak(type,why,KBC[k]);const h=hk||k;(K.harm[h]||(K.harm[h]={t:0,n:0})).n++;}};
  haz("draw",x.dt*3,"dryer","Sheet break in the open draw: the sheet snapped going into the dryers.");
  haz("agit",x.sw>0.7?(x.sw-0.7)*4:0,"press","Sheet break at the wet end: a heavy spot in the sheet tore at the couch.");
  haz("vac",x.vac<15?(15-x.vac)/10*1.5:0,"press","Sheet break at the wet end: the sheet left the couch too wet to hold together.");
  haz("crush",x.pl>130?(x.pl-130)/20*1.5:0,"press","Sheet break in the presses: the sheet was crushed in the nip.");
  haz("wet",x.m>13?(x.m-13)*0.8:0,"dryer","Sheet break in the dryers: the sheet was too wet to hold.","moist");
  haz("dry",x.m<3?(3-x.m)*0.8:0,"reel","Sheet break at the reel: the sheet was dried brittle.","moist");
  // v6.14 the pick-up roll, the trim squirts and the knock-off shower
  haz("pick",x.pu<PUR.lo?(PUR.lo-x.pu)/PUR.lo*2.5:0,"press","Sheet break at the transfer: the pick-up roll's vacuum couldn't lift the sheet off the wire onto the felt.");
  haz("knock",(v.kos??PUR.kos)<PUR.kosLo?(PUR.kosLo-(v.kos??PUR.kos))/PUR.kosLo*2:0,"press","Sheet break in the press: the edge trim wasn't knocked off the wire and rode into the first nip.");
  haz("edge",(v.sqz??0)>1?((v.sqz??0)-1)/2*0.8:0,"dryer","Sheet break: a ragged edge tore and the tear ran across the sheet.");
  // ---- consequences: breakdowns ----
  if(x.cp>7.5&&!active("rotortrip")&&!S.M.pulperDown){if(knobTrig("rotortrip",["pulp"],"The pulper rotor tripped out on high amps! The tub is too thick to turn."))x.cp=5;}
  if(x.cp<2.2&&!active("overflow")){if(knobTrig("overflow",["pulp"],"The pulper is overflowing! Too much water in the tub, and it is pouring over the rim."))x.cp=5;}
  if(x.ch>0.8&&!active("refclash")){if(knobTrig("refclash",["ref"],"Refiner plates clashed! The gap was run in until metal met metal."))x.ch=0;}
  if(x.bs>0.85&&!active("boiler")){const c=knobSteamCulprits();if(knobTrig("boiler",c,"The boiler tripped! The dryers were pulling more steam than it could make.")){x.bs=0;x.bk=0;}}
  if(Math.abs(K.edge)>50&&!active("fabric")){if(knobTrig("fabric",["guide"],"The forming fabric ran off the rolls! It tracked off the tending side and folded up."))K.edge=0;}
  if(K.wear>=1&&!active("fabric")){const wc=[["vac",v.vac>45],["gbox",(v.gbox??FZ.gb)>3],["lvac",(v.lvac??FZ.lv)>8]].filter(c=>c[1]).map(c=>c[0]);if(knobTrig("fabric",wc.length?wc:["vac"],"The forming fabric failed: worn through over the vacuum boxes."))K.wear=0;}
  if(x.st>0.6&&v.osc<40&&!active("oscfail")){knobTrig("oscfail",["osc"],"Stripes on the pick-up felt! Maintenance called to the felt showers.");}
  // ---- off-spec and breaks the shift traces back after a while ----
  const tr=(k,bad,mins,ids,head,who)=>{const h=K.harm[k]||(K.harm[k]={t:0,n:0});if(bad){h.t+=dt;if(h.t>=mins||h.n>=3){h.t=0;h.n=0;knobFix(ids(),head,who);}}else h.t=Math.max(0,h.t-dt*0.5);};
  tr("cd",F.cd>0,90,()=>["zones"],"QCS: streaks in the CD profile.","The wet-end operator");
  tr("agit",F.bw>0||(H.agit||0)>0.2,180,()=>["agit"],"QCS: basis weight swinging up and down.","Stock prep");
  tr("crush",F.crush>0||(H.crush||0)>0.2,180,()=>["press"],"QCS: crush marks in the sheet.","The press operator");
  tr("wrinkles",F.wrinkles>0,180,()=>["draw"],"Wrinkles in the reel.","The dry-end operator");
  tr("draw",(K.harm.draw&&K.harm.draw.n>0)||(H.draw||0)>0.2,240,()=>["draw"],"Breaks going into the dryers.","The dry-end operator");
  tr("vac",(H.vac||0)>0.2,240,()=>["vac"],"Wet-end breaks.","The wet-end operator");
  tr("silo",v.vac>30&&!!S.we&&S.we.L<WE.silo*WE.makeL,120,()=>["vac"],"The white water silo keeps running low: the vacuum boxes are pulling too much to the seal pit.","The wet-end operator");   // (v6.8, 07g)
  tr("steam",K.sf>1.08,720,()=>knobSteamCulprits(),"The steam bill is well up on the week.","The energy engineer");
  tr("stfi",!knobAt("slice")&&run&&(()=>{const q=qualMeasure();return q.stfi<stfiSpec()||q.rct<rctSpec();})(),120,()=>["slice"],"QCS: the sheet is weak across the machine (STFI CD, ring crush): the jet is rushing or dragging hard and the fibers line up with the machine.","The process engineer");   // (v6.13, 07n)
  tr("tcv",!knobAt("tcv")&&stmFlooded()>0,120,()=>["tcv"],"Dryer cans flooding: the 3rd section can't hold its syphon ΔP.","The dry-end operator");   // (v6.13, 07m)
  tr("pick",(H.pick||0)>0.2||F.mark>0||(K.harm.pick&&K.harm.pick.n>0),180,()=>["puv"],F.mark>0?"QCS: suction roll hole marks in the sheet.":"Breaks at the pick-up.","The press operator");   // (v6.14)
  tr("trim",(H.knock||0)>0.2||(H.edge||0)>0.2||F.edge>0||(K.harm.knock&&K.harm.knock.n>0)||(K.harm.edge&&K.harm.edge.n>0),180,()=>["sqz","kos"].filter(i=>!knobAt(i)),"Trouble at the sheet's edges: ragged edges and trim carrying over.","The wet-end operator");
  tr("feed",K.feed<0.95,480,()=>["pulp"],"Stock prep can't keep the chest up: the pulper is running thin.","Stock prep");
  tr("moist",F.wet>0||F.dry>0||(K.harm.moist&&K.harm.moist.n>0),180,()=>F.wet>0?knobSteamCulprits():["st1","ref"].filter(i=>!knobAt(i)),F.wet>0?"QCS: the sheet is coming off the reel wet.":"QCS: the sheet is coming off the reel over-dried.","The process engineer");
  // ---- all back at ideal and settled: stop running ----
  if(!knobsOff().length&&!chemOn()&&!K.inc.length&&K.cs<0.01&&K.wear<0.001&&Math.abs(x.cp-5)<0.02&&Math.abs(x.fr-0.5)<0.002&&x.ch<0.01&&x.sw<0.005&&Math.abs(x.vac-30)<0.05&&Math.abs(x.pl-100)<0.05&&Math.abs((x.cb??CBOX.best)-CBOX.best)<0.05&&Math.abs((x.gb??FZ.gb)-FZ.gb)<0.01&&Math.abs((x.lv??FZ.lv)-FZ.lv)<0.02&&knobAt("slice")&&Math.abs(x.jv||0)<0.005&&Math.abs(x.jh||0)<0.005&&Math.abs(x.sb||0)<0.005&&knobAt("tcv")&&!shOff()&&x.st<0.005&&Math.abs((x.pu??PUR.v0)-PUR.v0)<0.05&&Math.abs(x.d1)<0.001&&Math.abs(x.m-DRY.m0)<0.02&&x.bs<0.01&&x.dl<0.002&&(x.dl1||0)<0.002&&(x.cr||0)<0.002&&(x.cr1||0)<0.002&&x.dt<0.002&&x.z.every(z=>Math.abs(z)<0.02)&&K.off===0){
    K.any=false;K.off=0;K.sf=1;K.feed=1;K.brk=1;K.edge=0;K.gtrav=0;K.H={};K.harm={};S.M=mods();}
}
const KOFFN={mark:"suction roll marks from the pick-up",edge:"ragged edges (trim squirts out)",wet:"sheet too wet",dry:"sheet over-dried",cd:"CD moisture streaks",bw:"basis weight swings",crush:"crush marks",stripes:"stripes from the pick-up felt",wrinkles:"wrinkles in the reel",floc:"flocs in the sheet (poor formation)"};
// what is putting the extra water into the dryers (or the extra steam on): the knobs the engineers will trace
function knobSteamCulprits(){const K=S.knob;if(!K)return [];const v=K.v,c=[];
  // (v6.5.5: each knob's share of the extra water, from the dewatering chain with that knob put back to standard)
  const sl=slcGet(),jd=jwDev(),cb=v.cbox??CBOX.best,gb=v.gbox??FZ.gb,lv=v.lvac??FZ.lv,W0=dewater(gapOf(refEff(v.ref)),v.vac,v.press,jd,sl.h,cb,gb,lv,sl.v).W,dW=(o)=>W0-dewater(o.fr??gapOf(refEff(v.ref)),o.vac??v.vac,o.pl??v.press,o.jv??jd,o.jh??sl.h,o.cb??cb,o.gb??gb,o.lv??lv,o.sb??sl.v).W;
  if(!knobAt("ref"))c.push(["ref",dW({fr:0.5})]);if(!knobAt("vac"))c.push(["vac",dW({vac:30})]);if(!knobAt("press"))c.push(["press",dW({pl:100})]);if(!knobAt("slice"))c.push(["slice",dW({jv:0,jh:0,sb:0})]);if(!knobAt("cbox"))c.push(["cbox",dW({cb:CBOX.best})]);if(!knobAt("gbox"))c.push(["gbox",dW({gb:FZ.gb})]);if(!knobAt("lvac"))c.push(["lvac",dW({lv:FZ.lv})]);
  if(v.st1!==40)c.push(["st1",Math.abs(st1D(v.st1))]);if(v.hood)c.push(["hood",HOOD_STEAM]);
  c.sort((a,b)=>b[1]-a[1]);return c.filter(r=>r[1]>0.02).map(r=>r[0]);}
// readings for the DCS and QCS screens. With S.knob missing everything reads at its standard value.
// Base values follow each grade's standard: reel speed, basis weight and 3rd section steam, and the stock prep level.
function knobRead(){const K=S.knob,x=K?K.x:null,g=GRADES[C.grade]||GRADES["24"],bw=g.bw,run=S.pm==="run";
  const z=x?x.z:new Array(KZONES).fill(0),t=S.t;
  const wob=(f,k)=>Math.sin(t*f+k)*0.6+Math.sin(t*f*2.7+k*2)*0.4;   // smooth stand-in for process noise (no dice)
  const Dr=S.dry,st3=Dr?Dr.st3:dryPh(dryB());   // (v6.5 b5: the dryer model, 07d)
  const m=Dr?Dr.m:DRY.m0;let cp=x?x.cp:5;
  const cpb=cpBale();cp+=cpb;
  return {run,cp,amps:410*(0.55+cp/5*0.45)*(S.M.pulperDown?0:1),pulpLvl:clamp(62+(5-cp)*9+wob(0.05,1)*1.5,0,110),
    gap:x?x.fr:gapOf(refEff(knobVal("ref"))),refcap:refCap(),refset:knobVal("ref"),hpdt:kwhNow()/HPDT,refkw:run&&!(S.M&&S.M.refOut)?kwhNow()*Math.max(0,S.rates.fiberUse||0):0,kwh:kwhNow(),csf:csfOf(x?x.fr:gapOf(refEff(knobVal("ref"))))+25*bvFq(),   /* (v6.14: the bales' fiber quality, 05b) */   // (v6.8: refiner power = specific energy x fiber)
    mcLvl:vlvT("LV-104")?S.vlv.lp["LV-104"].pvm:S.mcl!=null?S.mcl:69+wob(0.02,2)*3,refq:!run&&S.refq==null?0:S.refq==null?100*Math.max(0,S.rates.fiberUse||0)/Math.max(1e-6,weUstd()):S.refq*100,mcCons:mcCons(),agit:knobVal("agit"),
    vac:x?x.vac:30,vacIn:(x?x.vac:30)/FZ.in,gbox:x&&x.gb!=null?x.gb:FZ.gb,lvac:x&&x.lv!=null?x.lv:FZ.lv,...(()=>{const p=FZ.pv(x&&x.gb!=null?x.gb:FZ.gb,x&&x.lv!=null?x.lv:FZ.lv,x?x.vac:30);return {vpkw:run?p.kw+wob(0.09,7)*3:0,gbv:p.gv,lvv:p.lv,hvv:p.hv};})(),cbox:x&&x.cb!=null?x.cb:CBOX.best,cvac:cboxVac(x?x.cb:CBOX.best)+(run?wob(0.07,5)*0.4:0),cvacIn:(cboxVac(x?x.cb:CBOX.best)+(run?wob(0.07,5)*0.4:0))/FZ.in,couchSol:x&&x.cs!=null?x.cs:csStd(),pl:x?x.pl:100,pressSol:x&&x.ps!=null?x.ps:psStd(),
    puv:x&&x.pu!=null?x.pu:knobVal("puv"),sqz:knobVal("sqz"),kos:knobVal("kos"),edge:K?K.edge:0,gtrav:K?K.gtrav:0,gm:knobVal("gm"),stripes:x?x.st:0,cs:K?K.cs:0,couch:knobVal("couch"),osc:knobVal("osc"),wear:K?K.wear:0,
    st1:knobVal("st1"),st3,steam:run?(Dr?Dr.steam:50.5*P.K*S.pmSpeed*bw/34.8):S.pm==="break"&&Dr?Dr.steam:0,boiler:Dr?Dr.hdr:1,moist:run?m+wob(0.13,4)*0.25:0,
    bw:run?qualMeasure().bw:0,hbc:S.we?S.we.hbc:WE.hbc,draw:knobVal("draw"),tension:run?1.0+(knobVal("draw")-drawStd())*0.42:0,
    zones:cdOn()&&S.cd?S.cd.dv.map(d=>m+d):z.map((v,i)=>m+v*0.35+Math.sin(i*1.7+t*0.01)*0.12),   /* (v6.11: the CD profile, 07k) */off:qualStatus().off,why:qualStatus().why,F:K&&K.F||{},speed:S.pmSpeed};}
