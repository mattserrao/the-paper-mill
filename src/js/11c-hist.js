/* ---- v6.5 digital twin history: one row per game hour for the whole run, plus 14 days before the player takes over ----
   S.ph is the hour being written (the same notes as the day's S.pf: 11b), plus readings sampled every 2 sim minutes and
   minutes counted every step. At each new game hour it becomes a compact row in S.hist.rows (numbers rounded, one array
   per hour, columns named in HC). Money rows come from pfCalc, so an hour, a day or the whole run adds up to the ledger.
   S.hist.ev: repair bills and outage budgets [t, id, $] (chart markers and the bills list).
   Prior history (BF): when a run starts (season, survival, free play or zen), the real sim runs 14 game days hands-off in
   a sandbox (its own state, its own seed from the run's seed, no season, cards, civics, leader or outages, no sound or 3D)
   a slice at a time between frames. Its rows are kept at hours -336..-1 and the sandbox is thrown away; the real run
   doesn't step until it's done (52-main-loop.js). The run's own dice, cash and day 1 are untouched.
   Saves: S.hist is kept under its own key, written only when a row was added (51c-save.js). */
const HIST_V=3,HIST_PRIOR=14,HIST_MAX=60*24+HIST_PRIOR*24;   // survival keeps a rolling 60 days (plus the prior ones)
const HC=["h"];const HCI={};
{const add=(...k)=>k.forEach(x=>HC.push(x));
  PF_CATS.forEach(([c])=>add("c."+c));PF_AREAS.forEach(([a])=>PF_CATS.forEach(([c])=>add("b."+a+"."+c)));
  add("rev","deals","s.steam","s.power","s.chs","s.chp","s.drv","s.ldr","s.rep","s.tech","s.pmp","s.prem","s.ovh","s.civ",
    "w.feed","w.rej","w.bale","w.eff","w.broke","w.val","w.fine","w.fines","made","ship",
    "n.in","n.out","n.brk","n.hay","n.rolls",
    "m.yard","m.pulp","m.pmrun","m.pmbrk","m.pmdown","m.pmheld","m.wdrun","m.wdhay","m.wddown","m.wdblk","m.ship","m.out",
    "w.spill","w.scrap");   // (v6.5.6: appended, so older saved rows keep their columns)
  HC.forEach((k,i)=>HCI[k]=i);}
// readings averaged over the hour (sampled every 2 sim minutes); r: only while the machine runs (blank otherwise)
const HA=[["yard",()=>S.yard],["yardp",()=>S.yard/P.yardCap*100],["wet",()=>S.wet*100],["occp",()=>P.occPrice],["unload",()=>S.rates.unload],
  ["feed",()=>S.rates.feed],["fiber",()=>S.rates.fiberIn],["yield",()=>P.yieldF*((S.M&&S.M.yieldMul)||1)*100],["amps",r=>r.amps],["chest",()=>S.tank/P.tankCap*100],
  ["refkw",r=>r.run?r.refkw:null],["csf",r=>r.csf],["speed",()=>S.pmSpeed],["prod",()=>S.rates.prod],["bw",r=>r.run?r.bw:null],["moist",r=>r.run?r.moist:null],
  ["steam",r=>r.steam>0.5?r.steam:null],["energyt",()=>Math.max(0,energyCost()-pfChemT())],["chemt",()=>pfChemT()],["cut",()=>S.rates.cut],["reel",()=>S.winderBuf+S.reel],
  ["fgp",()=>S.fg/P.fgCap*100],["price",()=>priceOf(C.grade)],["load",()=>S.rates.load],["crew",()=>C.drivers.v+C.loaders.v+P.techs],
  ["wage",()=>(ECON.wage+(P.siteWage||0))*(P.costMul||1)*leadWage()*civWage()],
  ["civE",()=>civOn()?S.civ.m.E:null],["civL",()=>civOn()?S.civ.m.L:null],["civM",()=>civOn()?S.civ.m.M:null],["civC",()=>civOn()?S.civ.m.C:null],
  ["mkt",()=>S.plan?S.plan.mkt:0],["haul",()=>frInRate()],["dryl",()=>S.dry&&S.pm==="run"?S.dry.load*100:null],["trim",()=>S.dry?S.dry.trim*C.pmSp.v:0],["moistd",()=>S.dry&&S.pm==="run"?S.dry.m:null],["frout",()=>frOutRate()],["fuel",()=>fuelIdx()],["grade",()=>GRADE_IDS.indexOf(C.grade)]];
const GRADE_IDS=Object.keys(GRADES);
HA.forEach(([k])=>{HCI["a."+k]=HC.length;HC.push("a."+k);});
const histR=v=>v==null||v!==v?null:Math.abs(v)>=100?Math.round(v):Math.round(v*100)/100;

function histNew(){const T=S.tot;return Object.assign(pfNew(),{T:{in:T.inTrucks,out:T.outTrucks,brk:T.breaks,hay:T.hayouts||0,rolls:T.rolls},
  m:{},sa:new Array(HA.length).fill(0),sn:new Array(HA.length).fill(0),s2:-1,dn:{}});}
function histInit(){if(!S.hist||S.hist.v!==HIST_V)S.hist={v:HIST_V,rows:[],dn:[],ev:[],bf:false,id:Math.floor(Math.random()*1e9)};return S.hist;}   // (v2: freight columns; older history is made again)
// called at the top of step(), after pfDay
function pfHour(){histInit();const h=Math.floor(S.t/60);if(!S.ph){S.ph=histNew();return;}if(h===S.ph.h)return;
  histPush(histRow(S.ph),S.ph.dn);S.ph=histNew();}
function histPush(row,dn){const H=S.hist;H.rows.push(row);H.dn.push(Object.keys(dn).length?dn:0);
  while(H.rows.length>HIST_MAX){H.rows.shift();H.dn.shift();}H.n=(H.n||0)+1;}
function histEv(id,v){const H=histInit();H.ev.push([Math.round(S.t),id,Math.round(v)]);if(H.ev.length>4000)H.ev.shift();}
// every step: minutes by state, downtime by cause, and a reading every 2 sim minutes
function histTick(dt){const f=S.ph;if(!f)return;const m=f.m,M=S.M||{},add=(k,v)=>{m[k]=(m[k]||0)+v;};
  if(!(M.docksClosed||M.noIn))add("yard",dt);if(!M.pulperDown)add("pulp",dt);
  add(S.pm==="run"?"pmrun":S.pm==="break"?"pmbrk":S.pm==="full"||S.pm==="spools"?"pmheld":"pmdown",dt);
  add(S.wd==="hayout"?"wdhay":M.winderDown?"wddown":S.wdBlocked?"wdblk":"wdrun",dt);if(!M.noOut)add("ship",dt);if(S.outg&&S.outg.on)add("out",dt);
  const dn=f.dn;for(const i of S.inc)dn[i.id]=(dn[i.id]||0)+dt;if(S.pm==="break")dn.brk=(dn.brk||0)+dt;if(S.wd==="hayout")dn.hay=(dn.hay||0)+dt;
  const k=Math.floor(S.t/2);if(k===f.s2)return;f.s2=k;const r=knobRead();
  for(let i=0;i<HA.length;i++){let v;try{v=HA[i][1](r);}catch(e){v=null;}if(v!=null&&v===v){f.sa[i]+=v;f.sn[i]++;}}}
// an hour accumulator (finished or in progress) as a row
function histRow(f){const D=pfCalc(f,true),row=new Array(HC.length).fill(0),set=(k,v)=>{row[HCI[k]]=v;},T=S.tot;
  set("h",f.h);PF_CATS.forEach(([c])=>set("c."+c,Math.round(D.cat[c])));
  PF_AREAS.forEach(([a])=>PF_CATS.forEach(([c])=>set("b."+a+"."+c,Math.round(D.by[a][c]||0))));
  const sb=D.sub;set("rev",Math.round(D.rev));set("deals",Math.round(D.deals));
  [["s.steam",sb.energy.Steam],["s.power",sb.energy.Power],["s.chs",sb.chem["Stock prep"]],["s.chp",sb.chem["Wet end"]],["s.drv",sb.labor["Forklift drivers"]],
   ["s.ldr",sb.labor["Loaders and robots"]],["s.rep",sb.maint["Repair bills and outage budgets"]],["s.tech",sb.maint["Maintenance techs"]],
   ["s.pmp",sb.maint["Preventive maintenance program"]],["s.prem",sb.maint["Insurance premium"]],["s.ovh",sb.over["Site overhead"]],["s.civ",sb.over.Civics]].forEach(([k,v])=>set(k,Math.round(v||0)));
  for(const k in D.W)set("w."+k,histR(D.W[k]));set("made",histR(D.made));set("ship",histR(D.shipT));
  set("n.in",T.inTrucks-f.T.in);set("n.out",T.outTrucks-f.T.out);set("n.brk",T.breaks-f.T.brk);set("n.hay",(T.hayouts||0)-f.T.hay);set("n.rolls",T.rolls-f.T.rolls);
  for(const k in f.m)if(HCI["m."+k]!=null)set("m."+k,histR(f.m[k]));
  HA.forEach(([k],i)=>set("a."+k,f.sn[i]?histR(f.sa[i]/f.sn[i]):null));
  return row;}
const hv=(row,k)=>row[HCI[k]];
// all rows in [h0, h1) plus the hour in progress (when it falls in the range); prior rows only when asked
function histRows(h0,h1,prior){const H=S.hist;if(!H)return [];const out=[];
  for(const r of H.rows){const h=r[0];if(h<h0||h>=h1)continue;if(h<0&&!prior)continue;out.push(r);}
  if(S.ph&&S.ph.h>=h0&&S.ph.h<h1)out.push(histRow(S.ph));return out;}
// a range of rows summed into the same shape pfCalc gives the screen (cat, sub, by, W, rep, totals)
function histSum(rows,t0,t1){const s=k=>rows.reduce((a,r)=>a+(r[HCI[k]]||0),0);
  const cat={};PF_CATS.forEach(([c])=>cat[c]=s("c."+c));const by={};PF_AREAS.forEach(([a])=>{by[a]={};PF_CATS.forEach(([c])=>{const v=s("b."+a+"."+c);if(v)by[a][c]=v;});});
  const sub={frin:{"Inbound haul":cat.frin},frout:{"Outbound freight":cat.frout},energy:{Steam:s("s.steam"),Power:s("s.power")},chem:{"Stock prep":s("s.chs"),"Wet end":s("s.chp")},labor:{"Forklift drivers":s("s.drv"),"Loaders and robots":s("s.ldr")},
    maint:{"Repair bills and outage budgets":s("s.rep"),"Maintenance techs":s("s.tech"),"Preventive maintenance program":s("s.pmp"),"Insurance premium":s("s.prem")},
    over:{"Site overhead":s("s.ovh"),"Civics":s("s.civ")},fiber:{"OCC bales":cat.fiber}};
  const W={};["feed","rej","bale","eff","broke","val","fine","fines","spill","scrap"].forEach(k=>W[k]=s("w."+k));
  const rep={};if(S.hist)for(const [t,id,v] of S.hist.ev)if(t>=t0&&t<t1)rep[id]=(rep[id]||0)+v;
  const cost=PF_CATS.reduce((a,[c])=>a+cat[c],0),rev=s("rev"),deals=s("deals"),revenue=rev+deals;
  return {h:rows.length,day:Math.floor(t1/1440),cat,sub,by,cost,rev,deals,revenue,profit:revenue-cost,shipT:s("ship"),made:s("made"),W,rep,cashChg:revenue-cost,upg:0,range:true};}

/* ---- prior history: 14 days in a sandbox, a slice at a time ---- */
const BF={busy:false,p:0,sb:null,real:null,stepT:0,ms:0};
const bfLive=()=>!!(S&&((S.season&&S.season.on)||S.free||S.zen));
function bfNeed(){return !BF.busy&&bfLive()&&!(S.hist&&S.hist.bf&&S.hist.v===HIST_V)&&!(typeof location!=="undefined"&&/[?&]nobf\b/.test(location.search));}
// swap the sandbox in (its S, C, chaos settings; P is rebuilt from it) and out again, quietly: no sound, no 3D cut-scenes
function bfIn(){const R=BF.real={S,C,P:Object.assign({},P),CH:{on:CH.on,lvl:CH.lvl},nb:BANNERS.length,ev:AUDIO.event,sfx:AUDIO.sfx,bird:G3.birdCine};
  AUDIO.event=AUDIO.sfx=()=>{};G3.birdCine=undefined;CH.on=true;CH.lvl=1;
  if(!BF.sb){C=JSON.parse(JSON.stringify(R.C));AUTOKEYS.forEach(k=>{if(C[k])C[k].auto=true;});C.breaks=true;C.hays=true;
    initState();seedRun(((R.S.seed||1)^0x5bd1e995)>>>0);S.bn=R.S.bn;S.fuelSeed=R.S.seed;S.fuelOff=-HIST_PRIOR/7;S.cards=null;S.season=null;S.free=true;S.zen=false;S.lead=null;S.civ=null;S.outg=null;
    S.hist={v:HIST_V,rows:[],dn:[],ev:[],bf:true,id:0};applyUpgrades();S.M=mods();BF.sb={S,C};}
  else{S=BF.sb.S;C=BF.sb.C;applyUpgrades();S.M=mods();}}
function bfOut(){const R=BF.real;BF.sb.S=S;BF.sb.C=C;S=R.S;C=R.C;Object.assign(P,R.P);CH.on=R.CH.on;CH.lvl=R.CH.lvl;BANNERS.length=Math.min(BANNERS.length,R.nb);
  AUDIO.event=R.ev;AUDIO.sfx=R.sfx;G3.birdCine=R.bird;BF.real=null;}
function bfStart(){BF.busy=true;BF.p=0;BF.sb=null;BF.ms=0;BF.for=S;const t0=performance.now();bfChip(true);setTimeout(()=>bfSlice(t0),0);}
function bfSlice(t0){if(!BF.busy)return;
  if(BF.for!==S){BF.busy=false;BF.sb=null;bfChip(false);return;}   // a new game started meanwhile: that one gets its own
  const end=HIST_PRIOR*1440,a=performance.now();let done=false;
  bfIn();try{while(performance.now()-a<12){for(let i=0;i<16;i++)step(SIM_STEP);if(S.t>=end){done=true;break;}}BF.p=S.t/end;}
  catch(e){console.error("prior history",e);done=true;BF.err=String(e&&e.message||e);}
  finally{bfOut();}
  BF.ms+=performance.now()-a;bfChip(true);
  if(!done){setTimeout(()=>bfSlice(t0),0);return;}
  // keep the sandbox's rows as hours -336..-1, its bills as events before t=0; then the real run goes on
  const sb=BF.sb.S,H=histInit(),off=HIST_PRIOR*24;   // (the sandbox's last, unfinished hour is dropped)
  const rows=sb.hist.rows.filter(r=>r[0]<off).map(r=>{const c=r.slice();c[0]=r[0]-off;return c;});
  const keep=H.rows.map((r,i)=>[r,H.dn[i]||0]).filter(x=>x[0][0]>=0);H.rows=rows.concat(keep.map(x=>x[0]));H.dn=sb.hist.dn.slice(0,rows.length).concat(keep.map(x=>x[1]));
  H.ev=sb.hist.ev.map(([t,id,v])=>[t-HIST_PRIOR*1440,id,v]).concat(H.ev.filter(e=>e[0]>=0));H.bf=true;H.bfMs=Math.round(performance.now()-t0);H.bfCpu=Math.round(BF.ms);
  BF.sb=null;BF.busy=false;bfChip(false);diag(`prior history: ${HIST_PRIOR} days in ${H.bfMs} ms (${H.bfCpu} ms of sim)`);}
// the little "loading the mill's history" chip (the run waits for it)
function bfChip(on){let c=$("bfChip");if(!c){if(!on)return;c=document.createElement("div");c.id="bfChip";c.className="bfchip";c.setAttribute("role","status");document.body.appendChild(c);}
  c.hidden=!on;if(on)c.innerHTML=`<b>Loading the mill's last ${HIST_PRIOR} days</b><i><s style="width:${Math.round(BF.p*100)}%"></s></i>`;}
UI_TICKS.push(()=>{if(bfNeed())bfStart();});
