/* ---- v6.5.6 the water balance, and the white water chest in stock prep that balances the consistencies ----
   Every step the sim notes what moved (WQ, filled in by step(), the beater and the upsets) and waterTick() moves the
   water that goes with it. Tons are t/h of water (m³). Nothing here uses dice.
   - The white water chest (WAT.cap) collects the machine's long-circuit white water and supplies the dilution: the
     pulper and thickener (stock goes to the storage chest at WAT.cs %) and the machine chest (down to 3.2 %). Net, stock
     prep draws WAT.sw t of water for every t of fiber it sends to storage, and the machine hands the same back for every
     t of fiber it takes, plus its fresh showers (WAT.shower t a ton of paper), less the water the sheet carries into the
     dryers. So it's in balance while the machine runs at the pulper's rate; above WAT.hi it overflows to the save-all and
     the sewer, below WAT.lo fresh water makes up (not while the river intake is iced). Run dry, and stock prep can't
     dilute: the machine chest runs thick and the basis weight goes up (07e weight spec).
   - Out of the mill: dryer evaporation (from the press solids, 07b / 07d), the water in the paper, the rejects (50 %
     solids) and the clarifier sludge (30 % solids) to landfill, and the treated outfall. In: fresh water (showers, seal
     water WAT.base, makeup), the bales' own water (10 %) and the water in repulped beater paper.
   - S.wat.tot keeps the running totals; in - out = the change in the water chest plus the water in the storage chest's
     stock (tools/watercheck.py closes it). Before v6.5.6 the intake and outfall were fixed 9.9 / 8.4 m³ a ton of good
     paper, zero whenever the machine stopped. */
// (v6.8.3: shower 1.65 m³ a ton of paper, about 250 gpm at 35 t/h; it was 8, over 1,000 gpm)
const WAT={cap:2000,lo:0.4,hi:0.7,shower:1.65,base:60,cs:4.2,makeMax:1000,baleW:0.10,rejS:0.5,sludgeS:0.3,clar:0.9971};   // (v6.11.1: the clarifier catches 99.71% of the solids, so a normal run is in permit, ~25 mg/L; it was 98.8%, ~120)
WAT.sw=100/WAT.cs-1;   // water a ton of fiber carries at storage consistency
const WQ={f:0,fi:0,rej:0,u:0,p:0,rep:0,spill:0,clip:0,bw:0};   // (v6.6 bw: bale water over the standard 10%)   // this step's flows (t)
function watState(){if(!S.wat)S.wat={L:WAT.cap*0.55,short:0,shortK:0,r:{fresh:0,out:0,evap:0,over:0,make:0,p:0,eff:0},
    tot:{fresh:0,bale:0,rep:0,short:0,evap:0,prod:0,rej:0,sludge:0,out:0,paper:0}};return S.wat;}
// stock that leaves the storage chest any other way (a spill to the floor drains) goes to the sewer with its water
function wSpill(t){if(t>0)WQ.spill+=t;}
function waterTick(dt){const W=watState(),h=dt/60,T=W.tot,q=WQ;
  const K=S.knob,ps=K&&K.any&&K.x&&K.x.ps!=null?K.x.ps:psStd(),dry=1-DRY.m0/100,m=(S.dry?S.dry.m:DRY.m0)/100;
  const wIn=q.p*dry*(100/ps-1),prodW=Math.min(wIn,q.p*m),evap=wIn-prodW;   // the sheet's water into the dryers: most of it goes up the stack
  const rejW=q.rej*(1-WAT.rejS)/WAT.rejS,baleW=q.f*WAT.baleW+q.bw,repW=q.rep*DRY.m0/100,shw=q.p*WAT.shower,base=WAT.base*h;
  // the white water chest: the machine's return, less stock prep's draw (net per ton of fiber to and from storage)
  // v6.8: the silo's water (07g) is held out of (or given back to) the long circuit; its overflow, the seal pit and the press water are the return
  const dSilo=weFlow(dt,q.u);T.silo=(T.silo||0)+dSilo;
  let L=W.L+shw+baleW+repW-wIn-rejW-WAT.sw*(q.fi+q.rep-q.u)-WAT.sw*q.clip-dSilo;
  const over=Math.max(0,L-WAT.cap*WAT.hi);L-=over;
  const iced=active("icedintake"),make=!iced&&L<WAT.cap*WAT.lo?Math.min(WAT.cap*WAT.lo-L,WAT.makeMax*h):0;L+=make;
  const short=L<0?-L:0;if(short>0)L=0;W.L=L;W.short=short;
  if(short>0&&W.shortK<0.05)log("The white water chest is empty: stock prep can't dilute, so the stock is running thick.","bad");
  // the stock made without its dilution sits thick in the storage chest until the machine has worked through it
  if(short>0)W.shortK=ease(W.shortK,1,dt,6);else if(W.shortK>0){W.shortK*=Math.max(0,1-q.u/Math.max(30,S.tank));if(W.shortK<0.01)W.shortK=0;}
  // the sewer: the overflow, the seal water and any spilled stock, through the clarifier
  const fib=Math.max(0,q.u-q.p)+q.spill+q.clip,sewer=over+base+WAT.sw*(q.spill+q.clip),sludge=fib*(1-WAT.sludgeS)/WAT.sludgeS,out=Math.max(0,sewer-sludge);
  const fresh=shw+base+make;pfW("fw",fresh);   // (v6.7: m³ of fresh water, by the hour)
  T.paper=(T.paper||0)+q.p;T.fresh+=fresh;T.bale+=baleW;T.rep+=repW;T.short+=short;T.evap+=evap;T.prod+=prodW;T.rej+=rejW;T.sludge+=Math.min(sludge,sewer);T.out+=out;
  const R=W.r,k=v=>v/h;R.fresh=ease(R.fresh,k(fresh),dt,6);R.out=ease(R.out,k(out),dt,6);R.evap=ease(R.evap,k(evap),dt,6);R.over=ease(R.over,k(over),dt,6);R.make=ease(R.make,k(make),dt,6);
  R.p=ease(R.p,k(q.p),dt,6);R.eff=ease(R.eff,k(fib),dt,6);
  q.f=q.fi=q.rej=q.u=q.p=q.rep=q.spill=q.clip=q.bw=0;}
// effluent suspended solids after the clarifier (mg/L), from the fiber actually going to the sewer and the flow it's in
function tssWater(){const W=S.wat;if(!W||W.r.out<1)return 28;return W.r.eff*(1-WAT.clar)/W.r.out*1e6;}
