/* ---- v6.6 realism pass: the order book, base-load energy while the machine is stopped, and bale grading at receiving ----
   All three run in Season, Survival and Free Play; Zen keeps the old behaviour (every roll sells at list, no idle energy,
   every bale the same). Dice come from two new streams ("ord", "bale"), so every other stream keeps its timing.

   ORDER BOOK. Customers order paper by the roll. Each production campaign the planner starts (06 planTick) books orders
   for ORD.cover of its tons, split into orders of ORD.minR-ORD.maxR rolls, each due when its rolls should be made (at
   ORD.eff of the grade's standard rate) plus 0.8-2.2 days to ship. The rest of the campaign is unsold and goes to the
   spot market. An outbound truck docks only when it has a job: the earliest-due open order with its rolls in the
   warehouse (a part load when that grade isn't on the machine any more), or else a spot load of surplus paper (a full
   truck of one grade, or a part load once the warehouse is 80% full). A truck carries one grade. On departure:
     order:  list price (each grade's own) less a late chargeback of ORD.late $/t per day late (after a 2 h grace,
             capped at ORD.lateCap); an order still not shipped ORD.cancel days after its due date is cancelled and its
             paper goes to the spot market;
     spot:   list less ORD.spot $/t.
   A truck that waits ORD.dryWait in the queue with nothing to load leaves empty and the carrier bills a dry run (freight
   out). The auto truck rate calls trucks for what is ready to ship, so dry runs come from calling trucks by hand.

   BASE LOAD. A stopped machine isn't free: vacuum pumps, agitators, fans and drives keep turning and the boiler is kept
   banked. Every step the machine isn't making paper, a share of the running power bill (by area, PF_POWER) and of the
   steam bill is charged: BASEL.brk on a sheet break (the machine still turning; the break's steam is already paid as
   venting, 07d), BASEL.stop for any other stop (no stock, warehouse full, winder backed up, an upset), BASEL.out during a
   planned outage (locked out).

   BALE GRADING. Every inbound load gets a grade at the gate (A clean, B some prohibitives: plastic, wax, tape; C heavy
   contamination) and a moisture. C loads are rejected and go back to the supplier (no fiber, no cost). The mill pays for
   air-dry weight: a load over BALE.allow moisture is paid as if it were dry to that level. The yard is a mix: its
   moisture and contamination are the tonnage-weighted mix of what was unloaded, and bales in the open soak up rain and
   dry out slowly. At the pulper, water over the standard 10% is not fiber (it goes into the water balance, 07f), and
   contamination costs yield (more rejects) and, once it has worked through the stock chest, sheet breaks (stickies). */
const ORD={cover:0.92,minR:6,maxR:36,slack:[0.8,2.2],eff:0.85,spot:45,late:15,lateCap:60,grace:120,cancel:4,dryRun:300,dryWait:6*60,full:0.8,keep:40};
const CUST=["Harbor Corrugated","Tri-County Box","Midvale Packaging","Northgate Containers","Keystone Sheet Plant","Prairie Box Works","Lakeshore Display","Summit Carton"];
const BALE={m0:0.085,mSpread:0.04,rain:0.06,snow:0.025,allow:0.12,std:0.10,pB:0.27,pC:0.04,ky:0.05,kb:0.8,wetMax:0.20,snowMax:0.14,tauRain:900,tauSnow:2880,tauDry:2880};
/* v6.8.3 OCC recipe: three kinds of bale. A bales (clean, above market), C bales (market) and Mixed Waste (below market,
   dirty). dp: $/t over the market OCC price; rej: the share of a bale the pulper rejects; k: contamination (stickies),
   the same for all three. The planner sets a recipe in bales per feed cycle (at least one of each) and the conveyor
   feeds them in that order, spread evenly; each kind has its own pile in the yard, and inbound trucks bring whichever
   kind is furthest below its share. REC0 averages the same rejects (11.8 %) and price as before the recipe. */
const BT={A:{n:"A bales",s:"A",dp:25,rej:0.05,k:0.1},C:{n:"C bales",s:"C",dp:0,rej:0.11,k:0.1},M:{n:"Mixed waste",s:"MW",dp:-45,rej:0.24,k:0.1}},BTK=["A","C","M"];
const REC0={A:3,C:5,M:2},RECMAX=10,BALE_T=0.6,   // tons per bale on the conveyor
  LANDFILL=30,   // $/t to haul the pulper's rejects to landfill
  MW_RATE={ref:0.2,k:0.35};   // pulper rate: −35 % of capacity per unit of Mixed Waste share over 20 %
const recY=r=>{const n=BTK.reduce((a,q)=>a+r[q],0);return BTK.reduce((a,q)=>a+r[q]*(1-BT[q].rej),0)/n;},REC_Y0=recY(REC0);
const BASEL={brk:{pm:0.7,stock:0.5,pulper:0.5,steam:0},stop:{pm:0.25,stock:0.35,pulper:0.35,steam:0.15},out:{pm:0.1,stock:0.15,pulper:0.15,steam:0.05}};
const ordOn=()=>!!(S&&!S.zen);
const baleOn=ordOn;

// ---------- the order book ----------
function ordState(){if(!S.ord){S.ord={n:0,list:[],k:{ship:0,onT:0,lateT:0,late:0,chg:0,spot:0,spotV:0,canc:0,dry:0,done:0,doneOn:0}};
    if(S.rng&&S.rng.ord==null)S.rng.ord=((S.seed||1)^0x51ed270b)>>>0;   // (a save from before v6.6)
    if(S.plan)ordCampaign(C.grade,Math.max(0,S.plan.left||0),S.t);ordCarry();}
  return S.ord;}
// called from seedRun: a fresh book for the run (the warehouse's opening stock already has buyers)
function ordInit(){S.ord=null;S.rng.ord=(S.seed^0x51ed270b)>>>0;S.rng.bale=(S.seed^0x7a3c5e91)>>>0;S.bq=null;ordState();}
function ordCarry(){const O=S.ord;let r=Math.floor(S.fg||0);while(r>=ORD.minR){const n=Math.min(r,P.truckRolls);r-=n;
    O.list.push({id:++O.n,c:Math.floor(rand("ord")*CUST.length),g:C.grade,r:n,ld:0,sh:0,due:Math.round(S.t+(0.4+rand("ord")*0.8)*1440),t0:Math.round(S.t),st:"open"});}}
// a production campaign of `tons` of grade g starting now: book its orders
function ordCampaign(g,tons,t0){const O=S.ord;if(!O)return;const rw=C.rollW.v||12.5,G=GRADES[g],tph=Math.max(5,P.K*G.sp*G.bw)*ORD.eff;
  let rolls=Math.floor(tons*ORD.cover/rw),made=0;
  while(rolls>=ORD.minR){let n=Math.round(ORD.minR+rand("ord")*(ORD.maxR-ORD.minR));if(rolls-n<ORD.minR)n=rolls;rolls-=n;made+=n;
    const due=t0+made*rw/tph*60+(ORD.slack[0]+rand("ord")*(ORD.slack[1]-ORD.slack[0]))*1440;
    O.list.push({id:++O.n,c:Math.floor(rand("ord")*CUST.length),g,r:n,ld:0,sh:0,due:Math.round(due),t0:Math.round(t0),st:"open"});}
  ordPrune();}
function ordPrune(){const L=S.ord.list;let closed=0;for(let i=L.length-1;i>=0;i--)if(L[i].st!=="open"&&++closed>ORD.keep)L.splice(i,1);}
const ordGet=id=>S.ord&&S.ord.list.find(o=>o.id===id);
const ordCust=o=>CUST[o.c]||"Customer";
// rolls of grade g in the warehouse, and what isn't already promised to a truck at a door
function fgOf(g){let s=0;for(const l of S.lots.fg)if(l[0]===g)s+=l[1];return s;}
function ordFree(g){let r=fgOf(g);for(const tr of S.outDock)if(tr&&tr.g===g)r-=Math.max(0,tr.want-tr.load);return Math.max(0,r);}
function ordNeed(g){let n=0;for(const o of S.ord.list)if(o.st==="open"&&o.g===g)n+=o.r-o.ld;return n;}
// take q rolls of grade g from lots L, oldest first
function lotTakeG(L,g,q,out){let got=0;for(let i=0;i<L.length&&q>1e-9;){const h=L[i];if(h[0]!==g){i++;continue;}const k=Math.min(h[1],q);h[1]-=k;q-=k;got+=k;if(out)lotPut(out,g,k);if(h[1]<=1e-9)L.splice(i,1);else i++;}return got;}
// give a truck at the door a job: an order, else a spot load; false if there's nothing to load
function ordAssign(tr){const O=ordState();let best=null,bw=0;
  for(const o of O.list){if(o.st!=="open")continue;const left=o.r-o.ld;if(left<=0)continue;const want=Math.min(P.truckRolls,left),free=Math.floor(ordFree(o.g)+1e-6);
    // a full load, or a part load once that grade is off the machine (the next run of it may be days away)
    const w=free>=want?want:(C.grade!==o.g&&free>=4)?free:0;if(!w)continue;if(!best||o.due<best.due){best=o;bw=w;}}
  if(best){best.ld+=bw;Object.assign(tr,{oid:best.id,g:best.g,want:bw,spot:false,wait:0});return true;}
  const sp=ordSpot();if(sp){Object.assign(tr,{oid:0,g:sp[0],want:sp[1],spot:true,wait:0});return true;}
  return false;}
function ordSpot(){let sg=null,sv=0;for(const g of GRADE_IDS){const s=Math.floor(ordFree(g)-ordNeed(g)+1e-6);if(s>sv){sv=s;sg=g;}}
  if(sg&&(sv>=P.truckRolls||(S.fg>=P.fgCap*ORD.full&&sv>=4)))return [sg,Math.min(P.truckRolls,sv)];return null;}
// rolls that could leave now (what the auto truck rate calls trucks for)
function ordReady(){let n=0;const full=S.fg>=P.fgCap*ORD.full;for(const g of GRADE_IDS){const f=ordFree(g),need=ordNeed(g),s=f-need;n+=Math.min(f,need);if(s>=P.truckRolls||(full&&s>=4))n+=s;}return n;}
function ordAutoRate(){return clamp(ordReady()/P.truckRolls/3-S.outQ.length*0.15,0,10);}
const ordLateD=o=>Math.max(0,(S.t-o.due-ORD.grace)/1440);
// a loaded truck leaves: the invoice, the chargeback, the order's progress
function ordDepart(tr){const O=ordState(),K=O.k,rw=C.rollW.v,tons=tr.load*rw,pr=priceOf(tr.g);let v;
  if(tr.load<=1e-9)return;
  if(tr.spot){v=tons*(pr-ORD.spot);K.spot+=tons;K.spotV+=tons*ORD.spot;pfW("spotd",tons*ORD.spot);}
  else{const o=ordGet(tr.oid),ld=o?ordLateD(o):0,chg=ld>0?Math.min(ORD.lateCap,ORD.late*Math.ceil(ld)):0;v=tons*(pr-chg);K.chg+=tons*chg;if(chg)pfW("chg",tons*chg);
    if(ld>0)K.lateT+=tons;else K.onT+=tons;
    if(o){o.sh+=tr.load;o.ld-=Math.max(0,tr.want-tr.load);if(o.st==="open"&&o.sh>=o.r-1e-6){o.st="done";o.done=Math.round(S.t);K.done++;if(!(ld>0))K.doneOn++;
        log(`Order #${o.id} for ${ordCust(o)} delivered: ${o.r} rolls of ${o.g}${ld>0?`, ${Math.ceil(ld)} day${Math.ceil(ld)===1?"":"s"} late (−$${chg}/t)`:" on time"}`,ld>0?"warn":"ok");}}}
  K.ship+=tons;earn(v);}
// every step: late orders, cancellations, dry runs (cheap: the book is a few dozen orders)
function ordTick(dt){if(!ordOn())return;const O=ordState(),K=O.k;
  for(const o of O.list){if(o.st!=="open")continue;
    if(!o.lw&&S.t>o.due+ORD.grace){o.lw=true;K.late++;log(`Order #${o.id} for ${ordCust(o)} is late: ${Math.round(o.sh)} of ${o.r} rolls of ${o.g} shipped`,"warn");}
    if(S.t>o.due+ORD.cancel*1440){o.st="cancelled";o.done=Math.round(S.t);K.canc++;
      for(const tr of S.outDock)if(tr&&tr.oid===o.id)tr.spot=true;   // a truck already loading it takes it to the spot market
      log(`Order #${o.id} cancelled by ${ordCust(o)}: ${o.r-Math.round(o.sh)} rolls of ${o.g} never shipped. They go to the spot market.`,"bad");
      BANNERS.push({text:`Order cancelled: ${ordCust(o)} gave up waiting for ${o.g}`,t:null,tag:"ORDER"});while(BANNERS.length>3)BANNERS.splice(1,1);}}
  for(let i=S.outQ.length-1;i>=0;i--){const tr=S.outQ[i];if(tr.tq==null)tr.tq=S.t;if(S.t-tr.tq>ORD.dryWait){S.outQ.splice(i,1);spend(ORD.dryRun,"frout");K.dry++;
      S.leaving.push({...tr,ty:outY(0),kind:"out"});if(S.leaving.length>24)S.leaving.shift();
      if(K.dry===1||K.dry%5===0)log(`A truck waited ${Math.round(ORD.dryWait/60)} h with nothing to load and left empty: dry-run fee ${money(ORD.dryRun)}`,"warn");}}}
// the outbound docks in order mode (replaces the old any-roll loading in step; zen keeps it)
function ordDocks(dt,lcap){let loaded=0;
  for(let d=0;d<P.shipDoors;d++)if(!S.outDock[d]&&S.outQ.length){const tr=S.outQ[0];if(!ordAssign(tr))break;S.outQ.shift();S.outDock[d]=tr;}
  let pool=S.bn==="ship"?P.shipDoors*P.doorRolls*dt/60:Infinity;
  for(let d=0;d<P.shipDoors;d++){const tr=S.outDock[d];if(!tr)continue;
    const have=fgOf(tr.g),l=Math.max(0,Math.min(tr.want-tr.load,pool===Infinity?P.doorRolls*dt/60:pool,lcap,have));
    if(l>0){pool-=l;lcap-=l;loaded+=l;tr.load+=l;S.fg-=lotTakeG(S.lots.fg,tr.g,l,tr.lots||(tr.lots=[]));tr.wait=0;}else tr.wait=(tr.wait||0)+dt;
    const done=tr.load>=tr.want-1e-6,stuck=tr.wait>90&&have<0.5;
    if(done||(stuck&&tr.load>0.5)){S.leaving.push({...tr,ty:outY(d),kind:"out"});if(S.leaving.length>24)S.leaving.shift();S.outDock[d]=null;
      S.tot.shipped+=tr.load;const tons=tr.load*C.rollW.v;S.shipT+=tons;spend(tons*frOutRate(),"frout");ordDepart(tr);}
    else if(stuck){const o=!tr.spot&&ordGet(tr.oid);if(o)o.ld-=tr.want;S.outDock[d]=null;tr.oid=0;tr.g=null;tr.want=0;S.outQ.unshift(tr);}}   // nothing to load after all: back to the queue
  return loaded;}

// ---------- base load while the machine is stopped ----------
function baseLoadTick(dt){if(S.zen||S.pm==="run")return;const g=GRADES[C.grade],tph=P.K*g.sp*g.bw,en=Math.max(0,energyCost()-pfChemT());if(!(en>0&&tph>0))return;
  const B=outOn()?BASEL.out:S.pm==="break"?BASEL.brk:BASEL.stop,h=dt/60,pw=en*(1-PF_STEAMSH)*tph*h,st=en*PF_STEAMSH*tph*h*B.steam;let v=st;
  for(const a in PF_POWER){const x=pw*PF_POWER[a]*B[a];v+=x;pfAdd("power",a,x);}if(st>0)pfAdd("steam","pm",st);
  if(v>0){spend(v,"energy");S.tot.idleE=(S.tot.idleE||0)+v;pfW("idle",v);}}

// ---------- bale grading ----------
function bqState(){if(!S.bq)S.bq={m:BALE.std,k:0.1,ck:0.1,rej:0,rejT:0,ded:0,A:0,C:0,M:0,day:-1,dRej:0,
    rec:{...REC0},y:{A:0,C:0,M:0},fed:0,fy:REC_Y0,lf:0,bt:{A:0,C:0,M:0}};
  else if(!S.bq.rec)Object.assign(S.bq,{rec:{...REC0},y:{A:0,C:0,M:0},fed:0,fy:REC_Y0,lf:0,bt:{A:0,C:0,M:0}});   // (a save from before v6.8.3)
  return S.bq;}
const recN=r=>BTK.reduce((a,q)=>a+r[q],0);
const recShare=(r,q)=>r[q]/recN(r);
// the feed cycle: the recipe's bales spread evenly (3 A : 5 C : 2 MW → C A C M C A C M C A ...)
function recSeq(r){const N=recN(r),out=[],put={A:0,C:0,M:0};for(let j=0;j<N;j++){let best=null,bv=-1e9;for(const q of BTK){const v=r[q]*(j+1)/N-put[q];if(v>bv+1e-9){bv=v;best=q;}}put[best]++;out.push(best);}return out;}
let REC_SQ=null,REC_SK="";
function recSeqC(r){const k=r.A+"|"+r.C+"|"+r.M;if(k!==REC_SK){REC_SK=k;REC_SQ=recSeq(r);}return REC_SQ;}
// the piles follow S.yard (rail deliveries, a bale fire, the opening stock and loads all change it outside the trucks):
// tons that appear are split by the recipe, tons that vanish come off every pile in proportion
function recPiles(){const Q=bqState(),Y=Q.y,sum=Y.A+Y.C+Y.M,d=S.yard-sum;if(Math.abs(d)<1e-6)return Y;
  if(d>0)for(const q of BTK)Y[q]+=d*recShare(Q.rec,q);else if(sum>1e-9){const f=Math.max(0,S.yard)/sum;for(const q of BTK)Y[q]*=f;}else for(const q of BTK)Y[q]=0;return Y;}
// take t tons from the piles in feed order (a kind that has run out is skipped); eases the pulper's yield to what went in
// (Q.fed counts bales: whole bales plus the part of the current one already fed, so it never sticks on a float boundary)
function recTake(t,dt){if(!baleOn())return;const Q=bqState(),Y=recPiles(),sq=recSeqC(Q.rec),N=sq.length;let left=t,ys=0,tot=0,skip=0,it=0;
  if(Q.fed>1e6)Q.fed%=N;
  while(left>1e-9&&skip<N&&it++<64){const b=Math.floor(Q.fed+1e-9),q=sq[b%N],room=(b+1-Q.fed)*BALE_T;
    if(Y[q]<=1e-9||room<1e-9){Q.fed=b+1;if(Y[q]<=1e-9)skip++;continue;}   // none of that kind (or this bale is done): on to the next bale
    const u=Math.min(left,room,Y[q]);Y[q]-=u;left-=u;Q.fed=Math.min(b+1,Q.fed+u/BALE_T);ys+=u*(1-BT[q].rej);tot+=u;Q.bt[q]+=u;skip=0;}
  if(tot>0)Q.fy=ease(Q.fy,ys/tot,dt,20);}
// the pulper's top rate with this recipe (t/h)
function recRate(){if(!baleOn())return Infinity;const sh=recShare(bqState().rec,"M");return P.pulperMax*(1-MW_RATE.k*Math.max(0,sh-MW_RATE.ref));}
// an inbound load's grade and moisture (drawn when the truck arrives)
// v6.8.3: the kind is the one furthest below its share of the recipe, counting the yard and the trucks already in
function baleGrade(tr){const r=rand("bale"),a=rand("bale"),b=rand("bale");   // (three draws as before, so the bale stream is unchanged)
  let q="C";if(baleOn()){const Q=bqState(),Y=recPiles(),have={A:Y.A,C:Y.C,M:Y.M};for(const t of S.inQ.concat(S.inDock))if(t&&t.q&&have[t.q]!=null)have[t.q]+=t.load;
    const tot=have.A+have.C+have.M+tr.load;let bv=-1e9;for(const k of BTK){const v=recShare(Q.rec,k)*tot-have[k];if(v>bv){bv=v;q=k;}}}
  let m=BALE.m0+BALE.mSpread*a+(S.wx==="rain"?BALE.rain*(0.5+0.5*S.wet):S.wx==="snow"?BALE.snow:0)+(q==="A"?0:0.01);
  tr.q=q;tr.m=m;tr.k=BT[q].k;tr.pf=m>BALE.allow?(1-m)/(1-BALE.allow):1;return tr;}
// $/t for a kind of bale
const btPrice=q=>Math.max(0,P.occPrice+(BT[q]?BT[q].dp:0)*(P.costMul||1));
// the gate: true if the load is turned away
// (v6.8.3: no more turning loads away: what was the junk grade is now Mixed Waste, bought on purpose. Counts loads by kind.)
function baleGate(tr){if(!baleOn())return false;const Q=bqState();Q[tr.q]=(Q[tr.q]||0)+1;return false;}
// u tons unloaded from truck tr into the yard (y0 tons were there): returns the tons paid for
// (v6.8.3: the tons go on their kind's pile; what's returned is in market-price tons, so A bales count for more, Mixed Waste less)
function baleUnload(tr,u,y0){if(!baleOn()||tr.m==null)return u;const Q=bqState(),w=y0+u;if(w>1e-9){Q.m=(Q.m*y0+tr.m*u)/w;Q.k=(Q.k*y0+tr.k*u)/w;}
  recPiles();if(tr.q&&Q.y[tr.q]!=null)Q.y[tr.q]+=u;
  const paid=u*tr.pf;Q.ded+=(u-paid)*btPrice(tr.q);return P.occPrice>0?paid*btPrice(tr.q)/P.occPrice:paid;}
// the pulper's view of the yard: solids factor (water over the standard 10% isn't fiber) and the contamination yield factor
function baleFeed(){if(!baleOn())return {sf:1,yk:1,e:0};const Q=bqState(),e=Math.max(0,Q.m-BALE.std);return {sf:1-e,yk:(1-BALE.ky*Q.k)*Q.fy/REC_Y0,e};}
function baleTick(dt,fiberIn){if(!baleOn())return;const Q=bqState();
  if(S.wx==="rain")Q.m+=(BALE.wetMax-Q.m)*Math.min(1,dt*(0.3+S.wet)/BALE.tauRain);
  else if(S.wx==="snow"&&Q.m<BALE.snowMax)Q.m+=(BALE.snowMax-Q.m)*Math.min(1,dt/BALE.tauSnow);
  else if(Q.m>BALE.m0+0.02)Q.m-=(Q.m-BALE.m0-0.02)*Math.min(1,dt/BALE.tauDry);
  // stickies reach the machine through the stock chest (its residence time)
  if(fiberIn>0){const tau=Math.max(60,S.tank/Math.max(1,(S.rates.fiberUse||30))*60);Q.ck=ease(Q.ck,Q.k,dt,tau);}}
function bqMods(m){if(!baleOn()||!S.bq)return;m.breakMul*=1+BALE.kb*S.bq.ck;}
const bqBand=k=>k<0.08?"clean":k<0.2?"fair":k<0.35?"poor":"bad";
