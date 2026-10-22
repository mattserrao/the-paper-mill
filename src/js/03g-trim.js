/* ---- v6.11 trim and rolls at width (plan: claude/trim-cd-plan.md) ----
   The web at the reel is TRIM.web0 inches wide (+TRIM.perLv a level of the deckle upgrade). The winder slits it into a set
   of two TWIN rolls of the same width W (customers order widths; every order is an even number of rolls), so the trim is
   web - 2W, at least TRIM.minTrim (2.5" an edge). The widest roll is TRIM.maxW0 (+TRIM.maxPerLv a deckle level), so a
   mill with the upgrade can run wider rolls. The trim (fiber and its water) is blown down the trim ducts to the dry-end
   pulper under the winder and goes back to the stock chest, like the broke hole: paid for again in energy and winder time,
   not lost, but never sold.
   A roll has the same diameter whatever its width, so it weighs C.rollW.v x W/100. Lots, the warehouse, trucks and orders
   count rolls in standard-roll units (a 100" roll is 1, a 90" roll 0.9), so every tons conversion stays units x C.rollW.v.
   Width dice have their own stream ("wid"). Season, survival and free play; zen keeps 100" rolls and no trim. ---- */
const TRIM={web0:205,perLv:3,maxW0:100,maxPerLv:1.5,minW:50,minTrim:5,bookTrim:0.07,
  // customer widths and how often they're ordered (%): mostly wide, a few narrow ones that cost real trim
  W:[[100,30],[98,22],[96,18],[93,12],[90,8],[86,5],[80,3],[72,1.5],[60,0.5]]};
const trimOn=()=>!!(S&&!S.zen);
const webW=()=>TRIM.web0+TRIM.perLv*LV("deckle");
const maxRollW=()=>Math.min(TRIM.maxW0+TRIM.maxPerLv*LV("deckle"),(webW()-TRIM.minTrim)/2);
const rollT=w=>C.rollW.v*(w||100)/100;                  // tons in one roll of width w
const trimFrac=w=>trimOn()?Math.max(0,(webW()-2*(w||100))/webW()):0;
const wFmt=w=>(Math.round((w||100)*10)/10)+'"';
function wRand(){if(S.rng.wid==null)S.rng.wid=((S.seed||1)^0x2c1b3a5f)>>>0;const x=rand("wid")*100;let a=0;for(const [w,p] of TRIM.W){a+=p;if(x<a)return w;}return 100;}
// a customer's width: with the deckle upgrade, half the full-width customers take the wider roll the mill can now make
function orderWidth(){const m=maxRollW();let w=wRand();if(w>=100&&m>100&&rand("wid")<0.5)w=m;return Math.max(TRIM.minW,Math.min(w,m));}
// rolls of grade g, width w still to wind: what open orders of that width have left to ship, less what is already wound
// (in the warehouse, on the conveyor, on trucks at the doors). Orders of one width share their rolls, so it's by width.
function windShort(g,w){const O=S.ord;if(!O)return 0;let n=0;for(const o of O.list)if(o.st==="open"&&o.g===g&&(o.w||100)===w)n+=o.r-o.sh;if(n<=1e-9)return 0;
  n-=fgOf(g,w);for(const l of S.lots.conv)if(l[0]===g&&(l[2]||100)===w)n-=l[1];for(const tr of S.outDock)if(tr&&tr.g===g&&tr.w===w&&!tr.spot)n-=tr.load;return Math.max(0,n);}
// the width the winder runs for grade g now: the earliest-due open order of g whose width is still short, else the widest (spot)
function windW(g){if(!trimOn())return 100;const O=S.ord;if(O){let best=null;for(const o of O.list)if(o.st==="open"&&o.g===g&&o.w&&(!best||o.due<best.due)&&windShort(g,o.w)>1e-6)best=o;if(best)return best.w;}return maxRollW();}
// a set of width w came off the winder: shown on the order (how much of it has been wound)
function windCredit(g,w,u){const O=S.ord;if(!O||!trimOn())return;for(const o of O.list)if(o.st==="open"&&o.g===g&&o.w===w&&(o.wd||0)<o.r-1e-6){o.wd=(o.wd||0)+u;return;}}
// the trim of this step's winding goes to the dry-end pulper and on into the stock chest (overflow waits in the beater bay)
function trimTo(t){if(!(t>0))return;const room=Math.max(0,P.tankCap*0.98-S.tank),a=Math.min(t,room);S.tank+=a;if(t>a)S.q.bank+=t-a;
  if(typeof WQ!=="undefined")WQ.rep+=t;S.tot.trim=(S.tot.trim||0)+t;pfW("trim",t);}

/* ---- v6.11.2 the dry-end pulper (read only on the DET DCS) ----
   A tub under the winder and the dry end: the edge trim is blown into it all the time, and on a dryer or reel break the sheet
   goes down the hole into it too (a press break goes to the couch pit). White water dilutes what comes in to about 4%, up to
   the dilution header's limit; a pump sends it back to the stock chest at a rate set by the tub level. On a break more comes
   in than the pump can take, so the level climbs; near the top the dilution is cut back, so the consistency climbs as well.
   Display only: the tons it handles are already counted (trim and broke go back to the stock chest), so nothing here changes
   the mass balance. S.dep = {m: slurry in the tub (t), f: fiber in it (t), fin: fiber coming in (t/h)}. Not in zen. */
const DEP={cap:300,c0:4.0,dil:900,pump:600,lo:0.35,span:0.5};
function depState(){if(!S.dep)S.dep={m:DEP.cap*0.42,f:DEP.cap*0.42*DEP.c0/100,fin:0};return S.dep;}
function depTick(dt,trimT){if(S.zen)return;const D=depState(),h=dt/60;if(!(h>0))return;
  let fin=(trimT||0)/h;if(S.pm==="break"&&S.brkType!=="press")fin+=P.K*Math.max(S.pmSpeed,P.minSpeed*0.5)*bwSp();
  const L=D.m/DEP.cap,win=Math.min(DEP.dil,fin*(100/DEP.c0-1))*clamp((0.97-L)/0.07,0,1),q=DEP.pump*clamp((L-DEP.lo)/DEP.span,0,1),c=D.m>1e-6?D.f/D.m:0;
  D.m=clamp(D.m+(fin+win-q)*h,0.5,DEP.cap);D.f=clamp(D.f+(fin-q*c)*h,0,D.m);D.fin=fin;D.q=q;}
const depLvl=()=>S.dep?S.dep.m/DEP.cap*100:42;
const depCons=()=>S.dep&&S.dep.m>0?S.dep.f/S.dep.m*100:DEP.c0;
