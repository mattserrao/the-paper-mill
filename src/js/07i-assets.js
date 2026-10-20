/* ---- v6.10 The Reliability and Electrical Update (plan: claude/reliability-v610-plan.md) ----
   Ten critical VFD motors, each fed from a drive in one of three lineups in the MCC (the substation feeds the MCC). Each
   asset carries three healths, 0-100: its bearings (vib), its motor (adx) and its drive (dh). They wear while the asset
   runs, faster when it's pushed (refining energy, press load, a thick pulper, a drive over 100% load). Health raises the
   odds of a failure but never sets its time: the dice still decide.
   A bearing or motor fault, once rolled, develops for a lead time (RLY.leadB / leadM) before it fails. Only the shift
   rounds see it: every maintenance tech does one vibration round a shift (two assets, most overdue first) and the
   electrical tech one ADX motor-test round (two motors), unless they're called to an upset first; then the round is
   skipped and that data goes stale (Unknown after RLY.unknown). A round that finds a fault puts it on the Reliability
   screen, where a planned repair costs RLY.fix of the bill with no downtime. Missed, it fails: bearingfail (maintenance
   pair), motorfail (electrical tech). Drives fail with no warning (drivefail, electrical tech), likelier when loaded over
   ~95% or after lightning. Changeouts can be booked for a planned outage (cost and minutes; health back to new).
   The existing upsets tied to an asset (refiner clash, felt, fabric, driveshaft, wrap, winder) get likelier as its
   bearings wear (rlyLinkMul, in freqMul).
   Dice: their own streams ("rel" for the wear ticks and faults, "relx" for chaosTick's per-event draw), three draws an
   asset every RLY.tick sim minutes, so every other upset keeps its timing. Seasons, survival and free play (not zen).
   State: S.rel (saved with the run). ---- */
const RLY={tick:15,leadB:36*60,leadM:72*60,baseB:0.03,baseM:0.02,baseD:1/150,
  stale:24*60,unknown:72*60,
  vib:{at:60,len:120,n:2,stag:12},adx:{at:90,len:150,n:2},
  plan:{b:{cost:15e3,min:15,n:"Bearings"},m:{cost:60e3,min:30,n:"Motor"},d:{cost:25e3,min:10,n:"Drive"}},planCap:90,
  fix:0.2,elecResp:10,dur:{vib:[150,270],adx:[240,420],drv:[60,120]},drvBill:35e3};
const LINEUPS=[["SP","Stock prep lineup","MCC-1"],["PM","Machine sectional lineup","MCC-2"],["WD","Winder lineup","MCC-3"]];
const LINEN=Object.fromEntries(LINEUPS.map(l=>[l[0],l]));
// kw: rated power; stop: what the failure does, in words; ta: the Round area its tell shows in; k: a phase for the load wobble
const ASSETS=[
  {id:"pulp",n:"Pulper rotor",ln:"SP",kw:1100,ta:"pulp",k:1,mods:{pulperDown:1},stop:"The pulper is stopped; the stock chest is draining.",bb:45e3,mb:160e3},
  {id:"refA",n:"Refiner A",ln:"SP",kw:1500,ta:"scr",k:2,mods:{speedCap:0.75},stop:"One refiner left: the machine slows to 75%.",bb:40e3,mb:180e3},
  {id:"refB",n:"Refiner B",ln:"SP",kw:1500,ta:"scr",k:3,mods:{speedCap:0.75},stop:"One refiner left: the machine slows to 75%.",bb:40e3,mb:180e3},
  {id:"fan",n:"Fan pump",ln:"SP",kw:900,ta:"scr",k:4,mods:{pmDown:"fan pump down"},stop:"No stock to the headbox: the machine is down.",bb:35e3,mb:140e3},
  {id:"couch",n:"Couch roll",ln:"PM",kw:600,ta:"wet",k:5,mods:{pmDown:"couch drive down"},stop:"The machine is down.",bb:50e3,mb:120e3},
  {id:"pr1",n:"1st press",ln:"PM",kw:700,ta:"wet",k:6,mods:{pmDown:"1st press drive down"},stop:"The machine is down.",bb:50e3,mb:130e3},
  {id:"pr2",n:"2nd press",ln:"PM",kw:700,ta:"wet",k:7,mods:{pmDown:"2nd press drive down"},stop:"The machine is down.",bb:50e3,mb:130e3},
  {id:"dry",n:"Dryer section",ln:"PM",kw:800,ta:"dry",k:8,mods:{pmDown:"dryer drive down"},stop:"The machine is down.",bb:55e3,mb:150e3},
  {id:"reel",n:"Reel drum",ln:"PM",kw:400,ta:"dry",k:9,mods:{pmDown:"reel drive down"},stop:"The machine is down.",bb:35e3,mb:100e3},
  {id:"wind",n:"Winder drum",ln:"WD",kw:600,ta:"dry",k:10,mods:{winderDown:1},stop:"The winder is down; reels are stacking up.",bb:35e3,mb:110e3}];
const ASSETN=Object.fromEntries(ASSETS.map(a=>[a.id,a]));
const VIBST={good:["Good","ok","Smooth: nothing in the spectrum"],imbal:["Imbalance","warn","1× running speed peak: imbalance; it loads the bearings"],misal:["Misalignment","warn","2× running speed and axial peaks: the coupling is out of line"],
  outer:["Outer race defect","warn","Bearing defect peaks (BPFO): a spall on the outer race; weeks to months left"],inner:["Inner race defect","bad","Inner race defect (BPFI) with sidebands: the bearing is wearing fast"],
  imm:["Imminent failure","bad","Broadband noise and harmonics everywhere: the bearing is failing; days left"]};
const ADXST={good:["Good","ok"],watch:["Watch","warn"],alarm:["Alarm","bad"],imm:["Imminent failure","bad"]};
const ADXMODE={ins:"insulation resistance to ground falling",bar:"a broken rotor bar signature",con:"phase resistance imbalance at a connection"},
  ADXFAIL={ins:"a winding shorted to ground",bar:"broken rotor bars",con:"a connection burnt open"};
// the upsets that wear with an asset's bearings
const RLY_LINK={refclash:["refA","refB"],felt:["pr1","pr2"],fabric:["couch"],shaft:["dry"],wrap:["dry"],winderdown:["wind"],tiedrolls:["wind"]};
const RLY_EV={bearingfail:{k:"vib",name:"Bearing failure"},motorfail:{k:"adx",name:"Motor failure"},drivefail:{k:"drv",name:"Drive failure"}};
const RLY_ID={vib:"bearingfail",adx:"motorfail",drv:"drivefail"};
// the three failures join EVENTS (never rolled by chaosTick: an endless MTBF on their own stream; knob:true keeps them out
// of the Upsets panel's switches, the tornado and the machine crew's queue)
for(const id in RLY_EV){const d=RLY_EV[id];const e={id,g:"machine",knob:true,stream:"relx",name:d.name,dur:[60,60],mtbf:1e12,mods:{},rly:d.k,end:i=>rlyFixed(i)};
  Object.defineProperty(e,"head",{get:()=>rlyHead(id),enumerable:true});EVENTS.push(e);EV[id]=e;CH.en[id]=true;}
// bearings go to a maintenance pair; motors, drives and the blackouts to the electrical tech (v6.10: lightning and the
// bird on the line were maintenance jobs)
MSET.delete("lightning");MSET.delete("birdline");MSET.add("bearingfail");
const ESET=new Set(["motorfail","drivefail","lightning","birdline"]),ENEED=id=>ESET.has(id);
MAINT.push("bearingfail","motorfail","drivefail");FM_MAINT=null;FM_REL.add("bearingfail");FM_REL.add("motorfail");   // (RCFA, PM and the Reliability program cut them too)

const rlyOn=()=>!!(S&&!S.zen&&!S.over&&((S.season&&S.season.on)||S.free));
function rlyState(){if(S.rel&&S.rel.v===1)return S.rel;const sd=S.seed>>>0,R={v:1,a:{},pend:[],rd:{s:null,list:[]},hist:[],k:-1,caught:0,saved:0,fails:0,done:0,skip:0,chg:{},next:null};
  for(const A of ASSETS){const h=manH("rly",sd,A.id);R.a[A.id]={vib:55+h()*40,adx:60+h()*37,dh:75+h()*25,wv:1.0+h()*1.4,wm:0.4+h()*0.7,vm:h()<0.5?"imbal":"misal",am:["ins","bar","con"][Math.floor(h()*3)],lv:null,la:null,hv:[],ha:[],pin:""};}
  if(S.rng&&S.rng.rel==null)S.rng.rel=(S.seed^0x2545f491)|0;
  return S.rel=R;}
const rlyPend=(id,k)=>{const q=S.rel&&S.rel.pend;if(!q)return false;for(const p of q)if(p.a===id&&p.k===k)return true;return false;};
const rlyF=h=>0.08+2.6*Math.pow(1-clamp(h,0,100)/100,2);   // fault odds against health: ~0.1 new, 1 at 40, 2.7 worn out
const rlyIncOf=id=>{for(const i of S.inc)if(i.asset===id&&i.kind)return i;return null;};
const rlyBill=(id,k)=>((k==="vib"?ASSETN[id].bb:k==="adx"?ASSETN[id].mb:RLY.drvBill)||0)*P.repairMul;

/* ---- drive loads (% of rated), from the process; read-only on the sim ---- */
function rlyLoad(id,r){if(!S||outOn()||rlyIncOf(id))return 0;r=r||knobRead();const A=ASSETN[id],run=S.pm==="run",M=S.M||{},w=Math.sin(S.t*0.021+A.k)*0.7+Math.sin(S.t*0.057+A.k*2)*0.5;
  switch(id){
    case "pulp":return M.pulperDown?0:r.amps/500*100+w;
    case "refA":case "refB":return r.refkw>0?r.refkw/2/A.kw*100*(id==="refB"?0.97:1.03)+w:0;
    case "fan":return run?48+30*S.pmSpeed/3000+w:M.pmDown?0:30+w;
    case "couch":return run?38+r.vac*1.05+w:M.pmDown?0:12;
    case "pr1":return run?42+r.pl*0.27+w:M.pmDown?0:12;
    case "pr2":return run?38+r.pl*0.24+w:M.pmDown?0:12;
    case "dry":return run?46+S.pmSpeed/3000*26+w:M.pmDown?0:14;
    case "reel":return run?34+r.tension*26+w:M.pmDown?0:8;
    case "wind":{const c=(S.rates&&S.rates.cut)||0;return M.winderDown||c<0.5?(S.wd==="run"?6:0):28+c/Math.max(1,P.winderMax)*62+w;}}
  return 0;}
// drive status: run, idle (stopped by the process), trip (its motor or bearing failed), fault (the drive itself), off (outage)
function rlyDrvSt(id,L){if(outOn())return "off";const i=rlyIncOf(id);if(i)return i.kind==="drv"?"fault":"trip";return (L!=null?L:rlyLoad(id))>3?"run":"idle";}
const rlyTemp=(id,L)=>{const a=S.rel&&S.rel.a[id];return 27+(L||0)*0.38+(a?(100-a.dh)*0.12:0);};
function rlyMccKw(r){r=r||knobRead();let k=0;for(const A of ASSETS)k+=Math.max(0,rlyLoad(A.id,r))/100*A.kw;return k;}
function rlyStressV(id,r,L){let s=1;if(id==="pulp"&&r.amps>460)s+=(r.amps-460)/40;if((id==="refA"||id==="refB")&&r.kwh>80)s+=(r.kwh-80)/25;if((id==="pr1"||id==="pr2")&&r.pl>120)s+=(r.pl-120)/15;if(L>100)s+=(L-100)/20;return Math.min(4,s);}
const rlyStressM=L=>L>100?Math.min(4,1+(L-100)/15):1;

/* ---- every step (07): the rounds, then wear and the dice every RLY.tick minutes ---- */
function rlyTick(dt){if(!rlyOn())return;const R=rlyState();rlyRounds(R);
  const k=Math.floor(S.t/RLY.tick);if(k===R.k)return;const first=R.k<0;R.k=k;if(first)return;
  if(S.rng.rel==null)S.rng.rel=(S.seed^0x2545f491)|0;
  const r=knobRead(),out=outOn(),um=upsetMul(),live=CH.on&&um>0&&!out,h=RLY.tick/1440,u=um*2*CH.lvl;
  for(const A of ASSETS){const a=R.a[A.id],L=rlyLoad(A.id,r);
    const r1=rand("rel"),r2=rand("rel"),r3=rand("rel");   // (three draws an asset a tick, whatever happens)
    if(!out&&L>5){a.vib=Math.max(0,a.vib-a.wv*h*rlyStressV(A.id,r,L));a.adx=Math.max(0,a.adx-a.wm*h*rlyStressM(L));a.dh=Math.max(0,a.dh-0.25*h*(L>100?1+(L-100)/10:1));}
    if(!live)continue;
    if(CH.en.bearingfail&&!rlyPend(A.id,"vib")&&!rlyIncOf(A.id)&&r1<RLY.baseB*h*rlyF(a.vib)*freqMul("bearingfail")*u)R.pend.push({a:A.id,k:"vib",due:S.t+RLY.leadB,born:S.t});
    if(CH.en.motorfail&&!rlyPend(A.id,"adx")&&!rlyIncOf(A.id)&&r2<RLY.baseM*h*rlyF(a.adx)*freqMul("motorfail")*u)R.pend.push({a:A.id,k:"adx",due:S.t+RLY.leadM,born:S.t});
    if(CH.en.drivefail&&L>5&&!rlyIncOf(A.id)&&r3<RLY.baseD*h*(1+Math.max(0,L-95)/10)*(1+(100-a.dh)/50)*freqMul("drivefail")*u)rlyFail(A.id,"drv");}
  if(!live)return;
  for(let i=0;i<R.pend.length;i++){const p=R.pend[i];if(p.due>S.t)continue;if(active(RLY_ID[p.k])||rlyIncOf(p.a))continue;R.pend.splice(i--,1);rlyFail(p.a,p.k);}}
// a failure: like trigger() (04), without its dice (their own stream sets the length)
function rlyFail(a,kind){const id=RLY_ID[kind];if(active(id)||rlyIncOf(a))return false;
  const A=ASSETN[a],R=rlyState(),d0=RLY.dur[kind];R.next={a,kind};
  const dur=(d0[0]+rand("rel")*(d0[1]-d0[0]))*durMul(id),inc={id,left:dur,total:dur,real:performance.now(),note:"",asset:a,kind,mods:A.mods};
  S.inc.push(inc);(S.evc||(S.evc={}))[id]=(S.evc[id]||0)+1;S.lastInc=S.t;S.tot.incidents++;AUDIO.event(id);
  inc.cite=rlyCite(id,inc);const head=rlyHead(id,inc);BANNERS.push({text:head,t:null,id});while(BANNERS.length>3)BANNERS.splice(1,1);
  const bill=S.zen?0:rlyBill(a,kind);if(bill>0){spend(bill,"repairs");pfRepair(id,bill);inc.bill=bill;inc.note=`repair bill ${money(bill)}`;}
  log(head+(inc.note?` (${inc.note})`:""),"bad");R.next=null;R.fails++;
  S.M=mods();leadAuto(inc);civOnUpset(inc);return true;}
function rlyHead(id,inc){inc=inc||(S&&S.inc?S.inc.find(x=>x.id===id):null);const a=(inc&&inc.asset)||(S&&S.rel&&S.rel.next&&S.rel.next.a),A=ASSETN[a];
  if(!A)return {bearingfail:"A bearing failed on one of the critical drives.",motorfail:"One of the critical motors failed.",drivefail:"A drive in the MCC faulted and won't reset."}[id];
  if(id==="bearingfail")return `${A.n}: a motor bearing has failed. ${A.stop} Maintenance is changing it.`;
  if(id==="motorfail")return `${A.n}: the motor has failed (${ADXFAIL[S.rel.a[a].am]}). ${A.stop} The electrical tech is fitting the spare.`;
  return `${A.n}: its drive faulted in the ${LINEN[A.ln][1].toLowerCase()}. ${A.stop} The electrical tech is changing the drive.`;}
// fixed: the failed part is new
function rlyFixed(i){const R=S.rel;if(!R||!i.asset)return;const a=R.a[i.asset];if(!a)return;
  if(i.kind==="vib"){a.vib=96;a.lv={t:S.t,st:"good",v:1.0,by:"new"};R.pend=R.pend.filter(p=>!(p.a===i.asset&&p.k==="vib"));}
  else if(i.kind==="adx"){a.adx=97;a.la={t:S.t,st:"good",h:97,by:"new"};R.pend=R.pend.filter(p=>!(p.a===i.asset&&p.k==="adx"));}
  else a.dh=100;}
// the upset card's line: what the rounds last said about it
function rlyCite(id,inc){const R=S.rel;if(!R)return "";const ago=t=>{const m=S.t-t;return m<90?Math.round(m)+" min ago":m<2880?(m/60).toFixed(m<600?1:0)+" h ago":(m/1440).toFixed(1)+" days ago";};
  const vib=a=>{const x=R.a[a],v=x.lv;return !v?`${ASSETN[a].n}: no vibration reading this run`:S.t-v.t>RLY.unknown?`${ASSETN[a].n}: last vibration reading ${ago(v.t)} (rounds skipped since)`:`${ASSETN[a].n}: ${VIBST[v.st][0].toLowerCase()} on the last vibration round, ${ago(v.t)} (${v.v} mm/s)`;};
  const adx=a=>{const v=R.a[a].la;return !v?`${ASSETN[a].n}: never ADX tested this run`:S.t-v.t>RLY.unknown?`${ASSETN[a].n}: last ADX test ${ago(v.t)}`:`${ASSETN[a].n}: ADX ${ADXST[v.st][0].toLowerCase()} (motor health ${Math.round(v.h)}%), ${ago(v.t)}`;};
  if(inc&&inc.kind==="vib")return vib(inc.asset);
  if(inc&&inc.kind==="adx")return adx(inc.asset);
  if(inc&&inc.kind==="drv"){const a=R.a[inc.asset];return `${ASSETN[inc.asset].n} drive: ${a.dh<60?"its health was low (heat and past lightning)":"no warning: drives fail suddenly"}`;}
  const L=RLY_LINK[id];return L?L.map(vib).join(" · "):"";}

/* ---- the shift rounds ---- */
function rlyRounds(R){const s=manIdx(),st=s*720,D=R.rd;
  if(D.s!==s){if(D.s!=null)rlyShiftEnd(R);D.s=s;D.list=[];const m=manNow();
    for(let k=0;k<m.nt;k++)D.list.push({who:"t"+k,k:"vib",t0:st+RLY.vib.at+k*RLY.vib.stag,len:RLY.vib.len,st:"plan",a:[],why:""});
    D.list.push({who:"e",k:"adx",t0:st+RLY.adx.at,len:RLY.adx.len,st:"plan",a:[],why:""});}
  for(const x of D.list){
    if(x.st==="plan"&&S.t>=x.t0){const b=rlyBusy(x);if(b){x.st="skip";x.why=b;R.skip++;}else{x.st="go";x.a=rlyPick(R,x.k,RLY[x.k].n);x.t1=x.t0+x.len;if(!x.a.length){x.st="done";}}}
    if(x.st==="go"){const b=rlyBusy(x);if(b){x.st="abandon";x.why=b;R.skip++;}else if(S.t>=x.t1){x.st="done";R.done++;rlyRead(R,x);}}}}
function rlyShiftEnd(R){const D=R.rd,c=k=>D.list.filter(x=>x.k===k);
  R.hist.push({s:D.s,vd:c("vib").filter(x=>x.st==="done").length,vn:c("vib").length,ad:c("adx").filter(x=>x.st==="done").length,an:c("adx").length});while(R.hist.length>14)R.hist.shift();}
// why a round can't happen (empty: it can)
function rlyBusy(x){if(outOn())return "on the outage";
  if(x.who==="e"){const j=S.inc.find(i=>ENEED(i.id));return j?`called to ${EV[j.id].name.toLowerCase()}`:"";}
  const k=+x.who.slice(1),m=manNow(),row=m.techs[k];if(row&&!row.who)return "on vacation, not covered";
  const pair=Math.floor(k/2),j=S.inc.find(i=>MNEED(i.id)&&i.mSlot===pair);return j?`called to ${EV[j.id].name.toLowerCase()}`:"";}
// the most overdue assets of that kind first (pinned ones ahead of everything), not already on another round
function rlyPick(R,k,n){const key=k==="vib"?"lv":"la",taken=new Set();for(const x of R.rd.list)if(x.st==="go"&&x.k===k)x.a.forEach(id=>taken.add(id));
  const L=ASSETS.filter(A=>!taken.has(A.id)).map((A,i)=>{const a=R.a[A.id];return {id:A.id,pin:a.pin===k?1:0,t:a[key]?a[key].t:-1e9,i};}).sort((p,q)=>q.pin-p.pin||p.t-q.t||p.i-q.i).slice(0,n);
  return L.map(o=>{const a=R.a[o.id];if(a.pin===k)a.pin="";return o.id;});}
const rlyHash=(...x)=>manH("rlyv",(S.seed>>>0),...x)();
function rlyVibSt(id){const a=S.rel.a[id];if(rlyPend(id,"vib"))return "imm";const h=a.vib;return h>=75?"good":h>=60?a.vm:h>=40?"outer":"inner";}
function rlyVibV(st,h,id){const b={good:1.0+(100-h)*0.06,imbal:3+(75-h)*0.1,misal:3.2+(75-h)*0.1,outer:4.6+(60-h)*0.12,inner:6.8+(40-h)*0.06,imm:9.5}[st]||1;return Math.round((b+rlyHash(id,Math.floor(S.t))*0.6)*10)/10;}
function rlyAdxSt(id){if(rlyPend(id,"adx"))return "imm";const h=S.rel.a[id].adx;return h>=75?"good":h>=55?"watch":"alarm";}
function rlyRead(R,x){const who=x.who==="e"?"the electrical tech":"a maintenance tech";
  for(const id of x.a){const a=R.a[id],A=ASSETN[id];
    if(x.k==="vib"){const st=rlyVibSt(id),v=rlyVibV(st,a.vib,id);a.lv={t:S.t,st,v,by:x.who};a.hv.push([Math.round(S.t),v,st]);if(a.hv.length>8)a.hv.shift();
      if(st==="imm"){BANNERS.push({text:`Vibration round: the ${A.n.toLowerCase()} bearing is failing. Plan the repair on the Reliability screen.`,t:null,tag:"RELIAB"});while(BANNERS.length>3)BANNERS.splice(1,1);log(`Vibration round (${who}): ${A.n} bearing failing (${v} mm/s). Plan the repair in Report → Control room → Reliability.`,"warn");}
      else if(st==="inner")log(`Vibration round: ${A.n}, inner race defect (${v} mm/s).`,"warn");}
    else{const st=rlyAdxSt(id),hh=clamp(a.adx+(rlyHash(id,Math.floor(S.t),1)-0.5)*4,0,100);a.la={t:S.t,st,h:Math.round(hh),by:"e"};a.ha.push([Math.round(S.t),Math.round(hh),st]);if(a.ha.length>8)a.ha.shift();
      if(st==="imm"){BANNERS.push({text:`ADX test: the ${A.n.toLowerCase()} motor is about to fail. Plan the repair on the Reliability screen.`,t:null,tag:"RELIAB"});while(BANNERS.length>3)BANNERS.splice(1,1);log(`ADX test: ${A.n} motor about to fail (${ADXMODE[a.am]}). Plan the repair in Report → Control room → Reliability.`,"warn");}
      else if(st==="alarm")log(`ADX test: ${A.n} motor in alarm (${ADXMODE[a.am]}).`,"warn");}}}
// the player's actions (the Reliability screen)
function rlyPin(id,k){const R=rlyState(),a=R.a[id];if(!a)return;a.pin=a.pin===k?"":k;}
// a planned repair of a fault the rounds found: a share of the bill, no downtime
function rlyFix(id,k){if(!rlyOn())return false;const R=rlyState(),a=R.a[id],A=ASSETN[id],v=k==="vib"?a.lv:a.la;if(!v||v.st!=="imm"||rlyIncOf(id))return false;
  const bill=rlyBill(id,k),cost=bill*RLY.fix,p=R.pend.findIndex(x=>x.a===id&&x.k===k);spend(cost,"repairs");pfRepair(RLY_ID[k],cost);
  if(p>=0){R.pend.splice(p,1);R.caught++;R.saved+=bill-cost;if(civOn())civAdd(TELL.catchCiv,"Caught early");}
  if(k==="vib"){a.vib=95;a.lv={t:S.t,st:"good",v:1.1,by:"fix"};}else{a.adx=96;a.la={t:S.t,st:"good",h:96,by:"fix"};}
  log(`Planned repair: ${A.n} ${k==="vib"?"bearings changed":"motor swapped for the spare"} for ${money(cost)}, no downtime (a ${money(bill)} failure avoided).`,"ok");return true;}
const rlyFixCost=(id,k)=>rlyBill(id,k)*RLY.fix;

/* ---- outage changeouts: booked on the outage plan (24 h before), done during the outage ---- */
function rlyChg(id,k){const R=rlyState(),o=R.chg[id]||(R.chg[id]={});if(o[k])delete o[k];else o[k]=1;if(!Object.keys(o).length)delete R.chg[id];}
function rlyPlanTally(chg){let c=0,m=0,n=0;for(const id in chg||{})for(const k in chg[id])if(chg[id][k]&&RLY.plan[k]){c+=RLY.plan[k].cost;m+=RLY.plan[k].min;n++;}return {c,m:Math.min(RLY.planCap,m),n};}
const rlyPlanCost=()=>S&&S.rel?rlyPlanTally(S.rel.chg).c:0;
// approved: the list goes on the outage's plan and the wish list is cleared
function rlyPlanBook(o){const R=S.rel;if(!R)return 0;const t=rlyPlanTally(R.chg);if(!t.n)return 0;o.plan.rly=JSON.parse(JSON.stringify(R.chg));R.chg={};spend(t.c,"repairs");
  log(`Outage ${o.k}: ${t.n} changeout${t.n>1?"s":""} booked (${money(t.c)}, +${t.m} min).`,"warn");return t.c;}
function rlyOutageBegin(o){const t=rlyPlanTally(o.plan&&o.plan.rly);if(!t.m)return;o.end+=t.m;const p=S.fx.find(f=>f.id==="pout");if(p)p.left+=t.m;log(`Changeouts: the outage runs ${t.m} min longer.`,"warn");}
function rlyOutageEnd(o,pl){const R=S.rel;if(!R)return;const done=[];
  // the outage's major job renews what it touches
  const J={1:[["pr1",100]],2:[["couch",25]],3:[["pulp",100]],4:[["refA",20],["refB",20]]}[outJob(o.k)]||[];
  for(const [id,v] of J){const a=R.a[id];a.vib=v>=100?100:Math.min(100,a.vib+v);if(v>=100){R.pend=R.pend.filter(p=>!(p.a===id&&p.k==="vib"));a.lv={t:S.t,st:"good",v:0.9,by:"new"};}}
  for(const id in (pl&&pl.rly)||{}){const a=R.a[id],c=pl.rly[id];if(!a)continue;
    if(c.b){a.vib=100;a.lv={t:S.t,st:"good",v:0.9,by:"new"};R.pend=R.pend.filter(p=>!(p.a===id&&p.k==="vib"));done.push(ASSETN[id].n+" bearings");}
    if(c.m){a.adx=100;a.la={t:S.t,st:"good",h:100,by:"new"};R.pend=R.pend.filter(p=>!(p.a===id&&p.k==="adx"));done.push(ASSETN[id].n+" motor");}
    if(c.d){a.dh=100;done.push(ASSETN[id].n+" drive");}}
  if(done.length)log(`Outage ${o.k} changeouts done: ${done.join(", ")}.`,"ok");}

/* ---- the electrical tech: one job at a time, the blackouts first ---- */
function rlyElecTick(dt){let L=null;for(const i of S.inc)if(ENEED(i.id))(L||(L=[])).push(i);if(!L)return;
  const pri=id=>id==="lightning"||id==="birdline"?0:1;L.sort((a,b)=>pri(a.id)-pri(b.id));
  L.forEach((i,k)=>{i.eQ=k;if(k>0){if(i.eSlot===0){i.eSince=0;i.eGo=false;}i.eSlot=-1;return;}i.eSlot=0;if(!i.eSince){i.eSince=1;i.eResp=RLY.elecResp;}if(i.eResp>0)i.eResp-=dt;if(i.eResp<=0)i.eGo=true;});}
function elecState(i){if(!ENEED(i.id))return "";if(i.eGo)return "electrician working";if(i.eSlot===0)return "electrician on the way";return i.eQ>0?`waiting for the electrician (${i.eQ} ahead)`:"waiting for the electrician";}
// trigger() (04) calls this for every upset: the card's reliability line, and what a blackout does to the drives
function rlyOnTrigger(inc){if(!S.rel||!rlyOn())return;const R=S.rel;
  if(RLY_LINK[inc.id])inc.cite=rlyCite(inc.id,inc);
  const hit=inc.id==="lightning"||inc.id==="birdline"?[8,18]:inc.id==="brownout"?[3,6]:null;
  if(hit)for(const A of ASSETS){const a=R.a[A.id];a.dh=Math.max(0,a.dh-hit[0]-rlyHash(A.id,Math.floor(S.t),inc.id)*hit[1]);}}
// freqMul (03): the upsets tied to an asset get likelier as its bearings wear (about 0.6 new, 1 at 50, 2 worn out)
function rlyLinkMul(id){const L=RLY_LINK[id];if(!L||!S||!S.rel||!rlyOn())return 1;let h=0;for(const a of L)h+=S.rel.a[a].vib;h/=L.length;return 0.55+1.6*Math.pow(1-h/100,1.6);}
// the Round card's Vibration Report arrows (04b tellTrend): a known fault in the area counts too
function rlyTellTrend(area){const R=S&&S.rel;if(!R)return 0;let v=0;for(const A of ASSETS){if(A.ta!==area)continue;const a=R.a[A.id],f=x=>x&&S.t-x.t<RLY.unknown?x.st:"";
  const s=f(a.lv),t=f(a.la);if(s==="imm"||t==="imm")v=2;else if(s==="inner"||s==="outer"||t==="alarm")v=Math.max(v,1);}return v;}
// end screens: "Reliability rounds" line
const rlyEndStat=()=>{const R=S&&S.rel;if(!R||!(R.done+R.skip))return null;return ["Reliability rounds",`${R.done} done, ${R.skip} skipped · ${R.caught} fault${R.caught===1?"":"s"} caught, ${R.fails} failure${R.fails===1?"":"s"}`,"wide"];};
// how old a reading is, and whether it still counts
function rlyAge(x){if(!x)return {cls:"unk",txt:"never"};const m=S.t-x.t,txt=m<90?Math.max(0,Math.round(m))+" min":m<2880?(m/60).toFixed(m<600?1:0)+" h":(m/1440).toFixed(1)+" d";return {cls:m>RLY.unknown?"unk":m>RLY.stale?"stale":"",txt};}
// the civics choices for the three failures (03e's format: [label, cost tier, odds step, civics, note]; tags P proper, Q cheap, S shortcut)
CIVU.bearingfail={n:"Bearing failure",a:"Machine",ch:[["New bearings and a vibration route review",2,-1,{M:2}],["Swap the bearing, nothing more",1,0,{}],["Grease the new one and restart cold",0,1,{M:-1,L:-1}]],t:"PQS"};
CIVU.motorfail={n:"Motor failure",a:"Machine",ch:[["New motor from the vendor, with an ADX baseline",3,-1,{M:2}],["Rewind the old one as the spare",1,0,{M:1}],["Run a borrowed motor",0,1,{M:-1,E:1}]],t:"PQS"};
CIVU.drivefail={n:"Drive failure",a:"Machine",ch:[["New drive and a lineup cooling check",2,-1,{M:1,L:1}],["Fit the spare drive",1,0,{}],["Reset it and run it hot",0,1,{M:-1}]],t:"PQS"};
