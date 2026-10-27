/* ---------- v5.7 Catching failures early: the model (tells, the daily Round, the Area Trend Report, outage prep) ----------
   Design: failures are visible before they occur. A tellable upset that the dice pick is not fired; it is queued with a
   lead time (TELL.lead days; survival loses TELL.step a wave down to TELL.min). Until it is due, its tell (an exaggerated,
   clearly failing piece of equipment, 31c-3d-tells.js) sits in its round area, visible only while an operator walks that
   area on a Round. Caught: planned repair at TELL.cut of the bill, no downtime, Machinery and Labor up. Missed: it fires
   through trigger() exactly as before (bills, Dot, the civics card, the effect). Non-tellable upsets roll and fire as before.
   The dice are the same draws as before (one per upset per step on its own stream); only the firing time moves. The
   opening of a run pre-rolls one lead window on its own stream ("tell0") so the first upsets aren't held back by the lead.
   Seasons, survival and free play; not zen (tellsOn). Numbers are first guesses (no balancing yet).
   State: S.tell={q:[{id,due,born,area}], pre, day, n, saved, savedMin, cn:{id:n}, prep:{k,...}} (saved with the run). */
const TELL={lead:4.5,step:0.12,min:1,   /* (v6.9.2 balance: 4.5 days of warning, was 3.5 (v6.5), 2.5, (t20) 1.5: rounds are the biggest boost) */          // lead time in days: seasons and free play; survival −step per wave, at least min
  cut:0.05,                                   // planned repair: share of the upset's repair bill (v6.9.2 balance: was 0.1 (v6.5), 0.25; t20: 0.4)
  roundS:15,                                  // a Round's walk, real seconds
  catchCiv:{M:1,L:1/3},                       // caught: Machinery +3, Labor +1 (meter points = weight × CIV.unit)
  cleanCiv:{plant:{L:1/3},town:{C:1/3}},      // a clean walk: Labor +1 (plant areas) or Community +1 (yard, utilities)
  relCiv:{M:2}};                              // buying the Reliability program (level 1) unlocks the report: Machinery +6
// the round areas: key, name, camera jump, the upsets whose tells live there, and which civic a clean walk nudges
const TAREAS=[
  {k:"yard",n:"Yard & warehouse",j:"recv",ids:["balefire","fleet","roof"],cv:"town"},
  {k:"pulp",n:"Pulper & cleaners",j:"pulp",ids:["ragger","overflow","hdblow","lwplug","lcplug"],cv:"plant"},
  {k:"scr",n:"Screens & refiners",j:"pulp",ids:["cscreen","fscreen","refclash","thkblow","dye"],cv:"plant"},
  {k:"wet",n:"Wet end",j:"pm",ids:["fabric","felt","slime","fogfan"],cv:"plant"},
  {k:"dry",n:"Dry end & winder",j:"pm",ids:["shaft","dryerfire","wrap","steamjoint","syphon","winderdown","tiedrolls"],cv:"plant"},
  {k:"util",n:"Utilities",j:"shop",ids:["boiler","permit","icedintake","brownout"],cv:"town"}];
const TAREA={},TELLABLE=new Set();TAREAS.forEach(a=>a.ids.forEach(id=>{TAREA[id]=a.k;TELLABLE.add(id);}));
const TAREAK=Object.fromEntries(TAREAS.map(a=>[a.k,a]));
// what each tell looks like, in words (the log and the catch toast)
const TELLTXT={balefire:"pallets stacked against a space heater at the bale yard",fleet:"a forklift dripping hydraulic oil on a bald tire",roof:"a roof seam over the roll warehouse lifting in the wind",
  ragger:"the ragger winch smoking and the rope fraying",overflow:"the pulper level probe stuck and the floor already wet",hdblow:"a weeping flange on the HD cleaner",lwplug:"the lightweight cleaner reject line backing up",lcplug:"sand pouring out of the LC cleaner rejects",
  cscreen:"the coarse screen rotor shaking on its base",fscreen:"a fine screen basket rattling",refclash:"the refiner motor surging and the housing shaking",thkblow:"the disk thickener leaking at the vat seal",dye:"off-color stock in the dye pump sight glass",
  fabric:"a forming fabric guide roll bearing glowing hot",felt:"a press felt seam starting to lift",slime:"slime streaks building on the forming board",fogfan:"the fog fan motor smoking",
  shaft:"the dryer driveshaft wobbling at the coupling",dryerfire:"lint and broke piled under the dryer hood",wrap:"a doctor blade chattering on a dryer can",steamjoint:"a dryer steam joint hissing",syphon:"a dryer can running cold on the IR gun: its syphon is failing",winderdown:"a slitter drive overheating on the winder",tiedrolls:"a dull bottom slitter blade leaving the set's middle edge torn and fuzzy",
  boiler:"the boiler feed pump shaking and smoking",permit:"the wastewater outfall running discolored",icedintake:"ice building up on the river intake screen",brownout:"the substation panel flickering"};
// v5.7: tells only in a running season, survival run or free play; never in zen, a lost run or the start menu
const tellsOn=()=>!!(S&&!S.zen&&!S.over&&((S.season&&S.season.on)||S.free));
function tellLead(){const w=survOn()?survWave():1;return Math.max(TELL.min,TELL.lead-(survOn()?TELL.step*(w-1):0))*1440;}
function tellState(){if(!S.tell)S.tell={q:[],pre:false,day:-1,n:0,saved:0,savedMin:0,cn:{},prep:null};return S.tell;}
const tellPending=id=>{const q=S.tell&&S.tell.q;if(!q)return false;for(let k=0;k<q.length;k++)if(q[k].id===id)return true;return false;};
// is a planned outage running at sim time t? (nothing rolls into an outage, as before nothing rolled during one)
function outAt(t){const o=S.outg;if(!o||!S.season||!S.season.on||S.zen)return false;
  if(o.on)return t<o.end;const st=outStart(o.k);return t>=st&&t<st+OUT.len;}
// queue a hit from the dice; true = the caller must not fire it
function tellQueue(id){const T=tellState(),due=S.t+tellLead();if(outAt(due))return true;   // (rolled into an outage: dropped, as a roll during one used to be)
  T.q.push({id,due,born:S.t,area:TAREA[id]});return true;}
// every step from chaosTick: fire what is due (waiting while the same upset is still running or an outage is on), and
// pre-roll the opening window the first time the dice are live
function tellTick(um){const T=tellState();
  if(!T.pre&&tellsOn()&&CH.on&&um>0){T.pre=true;tellPre(um);}
  for(let k=0;k<T.q.length;k++){const p=T.q[k];if(p.due>S.t)continue;
    if(!CH.on||!CH.en[p.id]||(EV[p.id].env&&EV[p.id].env!==SITE.env)){T.q.splice(k--,1);continue;}   // (switched off since, or another site's)
    if(active(p.id)||outOn())continue;
    T.q.splice(k--,1);trigger(p.id);}}
// the opening: one lead window rolled at once, on its own stream, each hit due somewhere inside the window
function tellPre(um){if(S.rng.tell0==null)S.rng.tell0=(S.seed^0x3c6ef372)|0;const L=tellLead(),h=15;
  for(let t=0;t<L;t+=h)for(const e of EVENTS){if(!TELLABLE.has(e.id))continue;const r=rand("tell0");
    if(CH.en[e.id]&&!tellPending(e.id)&&r<h/60/e.mtbf*CH.lvl*freqMul(e.id)*0.75*um){const due=S.t+t+rand("tell0")*h;if(!outAt(due))S.tell.q.push({id:e.id,due,born:S.t,area:TAREA[e.id]});}}
  S.tell.q.sort((a,b)=>a.due-b.due);}
// what a caught upset would have cost and how long it would have run (mid-range, with the player's repair upgrades)
const tellBill=id=>(REPAIR[id]||0)*P.repairMul;
const tellMins=id=>{const d=EV[id].dur;return (d[0]+d[1])/2*durMul(id);};
// a tap on a tell during a Round: planned repair, no downtime
function tellCatch(id){const T=tellState(),k=T.q.findIndex(p=>p.id===id);if(k<0)return null;T.q.splice(k,1);
  const bill=tellBill(id),cost=bill*TELL.cut,mins=tellMins(id);
  if(cost>0)spend(cost,"repairs");T.n++;T.saved+=bill-cost;T.savedMin+=mins;T.cn[id]=(T.cn[id]||0)+1;
  if(civOn())civAdd(TELL.catchCiv,"Caught early");
  log(`Caught early: ${TELLTXT[id]||EV[id].name}. Planned repair ${money(cost)}, no downtime (${EV[id].name.toLowerCase()} avoided).`,"ok");
  return {id,cost,bill,mins,txt:TELLTXT[id]||EV[id].name};}
// a Round: one per in-game day (the day turns over at 6 AM, like the shop)
const tellDay=()=>Math.floor(S.t/1440);
const tellCan=()=>tellsOn()&&tellState().day!==tellDay();
function tellRoundStart(a){if(!tellCan()||!TAREAK[a])return false;tellState().day=tellDay();log(`Daily round: an operator is walking ${TAREAK[a].n.toLowerCase()}.`,"");return true;}
// the walk is over: nothing in the area at all gives a small nudge (a missed tell gives nothing)
function tellRoundEnd(a,caught){if(a==="dry"&&stmOn())stmIr();if(a==="scr")fpRound();const hbc=a==="wet"?hbdRound():0;   // (v6.14: the headbox door seal, 07q)   // (v6.13.3: the screens round reads the machine screen ΔP, 07p)
   // (v6.13: the dry end round takes an IR survey of the cans, 07m)
const T=tellState(),left=T.q.filter(p=>p.area===a).length;
  if(caught+hbc>0||left>0){if(!caught&&!hbc)log(`Round over: something in ${TAREAK[a].n.toLowerCase()} went unnoticed.`,"warn");return {clean:false,missed:left};}
  const d=TELL.cleanCiv[TAREAK[a].cv];if(civOn())civAdd(d,"Clean walk");else log("Clean walk.","");return {clean:true,missed:0,d};}
// the Area Trend Report: the Reliability program (vibration and oil analysis) or Dot's own kit
const tellRep=()=>LV("reliab")>=1||leadIs("dot");
// per area: 0 steady, 1 climbing (something pending), 2 climbing fast (due within 24 h)
function tellTrend(a){const q=(S.tell&&S.tell.q)||[];let v=0;for(const p of q)if(p.area===a)v=Math.max(v,p.due-S.t<1440?2:1);return Math.max(v,rlyTellTrend(a),fpTrend(a),hbdTrend(a));}   // (v6.10: and what the shift rounds found, 07i)
const tellSummary=()=>{const T=S&&S.tell;if(!T||!T.n)return "";return `Upsets caught early: ${T.n} — saved ${money(T.saved)} and ${tellHrs(T.savedMin)} of downtime.`;};
// the end screens' line: "3 — saved $412k and 9.5 hours of downtime" (null when tells never ran this run)
const tellEndStat=()=>{const T=S&&S.tell;if(!T||!T.pre)return null;return ["Upsets caught early",T.n?`${T.n} — saved ${money(T.saved)} and ${tellHrs(T.savedMin)} of downtime`:"none","wide"];};
const tellHrs=m=>{const h=m/60;return h>=10?Math.round(h)+" hours":h>=1?h.toFixed(1).replace(/\.0$/,"")+(h===1?" hour":" hours"):Math.round(m)+" min";};

/* ---- Outage prep checklist: opens 3 days before each planned outage, four items unlocking across the lead-in ----
   Each completed item shortens the outage and refunds PREP.refund of the approved budget when it ends. Seasons and
   survival (free play has no planned outages). State: S.tell.prep={k, it:{parts,crew,contr,draw}} for outage k. */
const PREP={open:72*60,refund:0.05,minLen:60,
  items:[
    {k:"parts",at:72*60,n:"Order the parts",d:"Rolls, plates and bearings for the major job, on the shelf before the shutdown."},
    {k:"crew",at:48*60,n:"Walk the job plan with the crew",d:"Lockout points, lifts and the job sequence, agreed before anyone picks up a tool."},
    {k:"contr",at:24*60,n:"Contractors",d:"An outside crew can work in parallel with yours."},
    {k:"draw",at:8*60,n:"Draw down ahead of the shutdown",d:"Run the chest and the dry end down so the machine comes off clean and restarts faster."}],
  parts:{now:30e3,wait:12e3,rush:45e3,min:30,odds:0.5},crew:{min:20,civ:{L:1/3}},contr:{cost:25e3,min:45,own:15,civ:{L:-1/3}},draw:{cap:0.85,min:30}};
const prepOn=()=>!!(S&&S.season&&S.season.on&&!S.zen&&!S.free&&S.outg&&!S.outg.on&&!S.over);
// the outage the checklist is for, and how long until it starts (null: none coming up within the window)
function prepFor(){if(!prepOn())return null;const o=S.outg,st=outStart(o.k);if(st+OUT.len>S.season.end)return null;const left=st-S.t;return left<=PREP.open&&left>0?{k:o.k,st,left}:null;}
function prepState(k){const T=tellState();if(!T.prep||T.prep.k!==k)T.prep={k,it:{},seen:{}};return T.prep;}
const prepUnlocked=(it,left)=>left<=it.at;
// how far along: done items, minutes off the outage
function prepTally(pr){const it=pr&&pr.it||{};let n=0,m=0;
  if(it.parts&&it.parts.got){n++;m+=PREP.parts.min;}
  if(it.crew){n++;m+=PREP.crew.min;}
  if(it.contr){n++;m+=it.contr==="in"?PREP.contr.min:PREP.contr.own;}
  if(it.draw){n++;m+=PREP.draw.min;}
  return {n,m};}
const prepLine=(n,m)=>`Prep ${n}/4 — outage shortened ${m>=60?Math.floor(m/60)+" h"+(m%60?" "+m%60+" m":""):m+" min"}`;
// the player's choices
function prepDo(item,ch){const f=prepFor();if(!f)return false;const pr=prepState(f.k),it=pr.it,X=PREP.items.find(i=>i.k===item);if(!X||!prepUnlocked(X,f.left))return false;
  if(item==="parts"){const P2=PREP.parts;
    if(ch==="now"&&!it.parts){spend(P2.now,"repairs");it.parts={how:"now",got:true};log(`Outage prep: parts ordered at full price (${money(P2.now)}).`,"ok");return true;}
    if(ch==="wait"&&!it.parts){spend(P2.wait,"repairs");it.parts={how:"wait",got:false,res:false};log(`Outage prep: waiting for the cheaper lot (${money(P2.wait)}). It may not arrive in time.`,"warn");return true;}
    if(ch==="rush"&&it.parts&&it.parts.res&&!it.parts.got){spend(P2.rush,"repairs");it.parts.got=true;it.parts.how="rush";log(`Outage prep: parts rush-ordered (${money(P2.rush)}).`,"warn");return true;}
    return false;}
  if(item==="crew"&&!it.crew){it.crew=true;if(civOn())civAdd(PREP.crew.civ,"Job plan walked with the crew");else log("Outage prep: job plan walked with the crew.","ok");return true;}
  if(item==="contr"&&!it.contr){if(ch==="in"){spend(PREP.contr.cost,"repairs");it.contr="in";if(civOn())civAdd(PREP.contr.civ,"Contractors booked");else log("Outage prep: contractors booked.","ok");}
    else{it.contr="own";log("Outage prep: your own crew will do it.","ok");}return true;}
  if(item==="draw"&&!it.draw){it.draw=true;addFx({id:"prepdraw",left:Math.max(1,f.left),mods:{speedCap:PREP.draw.cap}});log(`Outage prep: drawing down, machine capped at ${Math.round(PREP.draw.cap*100)}% until the shutdown.`,"warn");return true;}
  return false;}
// once a step from the sim: unlock notices and the cheap parts lot arriving (or not) at T−24 h
function prepTick(){const f=prepFor();if(!f)return;const pr=prepState(f.k),it=pr.it;
  for(const X of PREP.items)if(prepUnlocked(X,f.left)&&!pr.seen[X.k]){pr.seen[X.k]=1;
    if(X.k==="parts"){BANNERS.push({text:`Outage ${f.k} prep checklist is open: tap the outage countdown.`,t:null,tag:"PREP"});}
    else BANNERS.push({text:`Outage prep: “${X.n}” is ready.`,t:null,tag:"PREP"});while(BANNERS.length>3)BANNERS.splice(1,1);}
  if(it.parts&&it.parts.how==="wait"&&!it.parts.res&&f.left<=24*60){it.parts.res=true;if(S.rng.tell==null)S.rng.tell=(S.seed^0x1b873593)|0;
    it.parts.got=rand("tell")<PREP.parts.odds;
    if(it.parts.got)log("Outage prep: the cheaper parts lot arrived on time.","ok");
    else{BANNERS.push({text:"Outage prep: the cheaper parts lot won't make it. Rush-order or go without.",t:null,tag:"PREP"});while(BANNERS.length>3)BANNERS.splice(1,1);log("Outage prep: the cheaper parts lot won't arrive in time.","warn");}}}
// the outage starts: take the minutes off (never shorter than PREP.minLen); the draw-down cap ends
function prepBegin(o,st){const pr=S.tell&&S.tell.prep;S.fx=S.fx.filter(f=>f.id!=="prepdraw");if(!pr||pr.k!==o.k){o.prep=null;return;}
  const t=prepTally(pr),len0=o.end-st,cut=Math.max(0,Math.min(t.m,len0-PREP.minLen));o.end-=cut;const p=S.fx.find(f=>f.id==="pout");if(p)p.left=Math.max(1,p.left-cut);
  o.prep={n:t.n,m:cut};if(cut>0)log(`Outage prep ${t.n}/4: the outage is ${cut} min shorter.`,"ok");S.M=mods();}
// the outage ends: refund on the approved budget
function prepEnd(o,budget){const p=o.prep;if(!p||!p.n||!(budget>0))return;const r=budget*PREP.refund*p.n;S.cash+=r;S.ledger.repairs-=r;log(`Outage prep ${p.n}/4: ${money(r)} of the outage budget came back.`,"ok");}

/* ---- v6.11.2 known defects: what the mill knows is going wrong, for the Rounds screen's known defects view ----
   Tells an operator walked past on a Round (shown, not tapped: still there until caught or failed), and the last vibration
   (mechanical) and ADX (electrical) readings of each critical machine that came back worse than Good. Each: {k:"m"|"e", at:[x,z],
   a: what, b: the finding}. Electrical tells: the ones on electrical gear. */
const DEF_ELEC=new Set(["brownout","boiler"]);
/* (t6: early = an early-warning finding (imbalance, misalignment, outer race, ADX Watch): a small faded pin) */
function knownDefects(){const out=[];if(!S||S.zen)return out;
  for(const p of (S.tell&&S.tell.q)||[])if(p.seen){const at=G3.tellPos?G3.tellPos(p.id):null;if(at)out.push({k:DEF_ELEC.has(p.id)?"e":"m",at,a:EV[p.id].name,b:"spotted on a round: "+(TELLTXT[p.id]||"failing"),id:"t:"+p.id,early:false});}
  if(S.rel&&typeof ASSETS!=="undefined")for(const A of ASSETS){const a=S.rel.a[A.id],sp=G3.ASPOT&&G3.ASPOT[A.id];if(!a||!sp)continue;
    if(a.lv&&a.lv.st&&a.lv.st!=="good")out.push({k:"m",at:[sp[0],sp[1]],a:A.n,b:VIBST[a.lv.st][0]+" (vibration)",id:"v:"+A.id,early:VIBST[a.lv.st][1]!=="bad"});
    if(a.la&&a.la.st&&a.la.st!=="good")out.push({k:"e",at:[sp[0]+1.2,sp[1]+0.8],a:A.n,b:ADXST[a.la.st][0]+" (ADX)",id:"a:"+A.id,early:ADXST[a.la.st][1]!=="bad"});}
  return out;}
