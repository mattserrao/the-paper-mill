/* ---------- v5.1 (offline): civics, the model (meters, effects, odds) ----------
   Four meters, 0-100: Economy (customers, market), Labor (crew), Machinery (equipment), Community (town, permits).
   Players see bands (Crisis, Strained, Steady, Strong, Excellent); the game scales each effect smoothly from 50, steeper
   below 50, full effect at 0 or 100. Cash cost is separate from Economy. Civics run in seasons and survival runs (not free
   play or zen). The choice cards, the new upsets, standing orders, meter-triggered upsets and the bar are in 09d-civics.js.
   Not balanced: every number here is a first guess (the design note: civics-design.md in the project).
   State: S.civ={m:{E,L,M,C}, snap, odds:{id:mul}, orders:{area:tag}, seen:{id}, q:[], cur, tm:[], arm, flags, ...} (saved with the run). */
const CIV={unit:3,           // meter points per design weight (a choice's "+2" is +6 points)
  drift:1.5,                 // points per day back toward 50 (balance round 1: was 1)
  driftHi:3,driftLo:2,       // ...faster above 70 (no pinning at 100) and below 30 (no death spiral)
  cost:{"-1":-25e3,"0":0,"1":10e3,"2":35e3,"3":90e3},    // cash per cost tier ($, $$, $$$; -1 earns) (round 1: was 20k/60k/150k, earns 30k)
  odds:{"-2":0.5,"-1":0.75,"0":1,"1":1.5},             // (round 2: more often = 1.5x, was 1.3x, so shortcuts come back within a season)             // how often the upset comes back, per odds step (stacks, 0.25x to 3x)
  warn:40,crisis:20,reward:80,rearm:65,crisisEvery:7*1440,warnRearm:45,warnCool:3*1440,startMin:42,   // (round 1: crises every 7 days, was 4; warnings re-arm at 45 with a 3-day cooldown; no meter starts below 42)
  newMtbf:45,                // days between each of the new civic upsets (round 1: was 30; survival: x half the wave's extra upset odds, at most 2x)
  lead:{chip:{E:60,L:40,M:50,C:50},dot:{E:50,L:50,M:60,C:40},fel:{E:50,L:45,M:55,C:50},hank:{E:45,L:60,M:50,C:45}},
  site:{urban:{C:-6},rural:{L:-6},desert:{M:-6},swamp:{C:-6}},   // (round 1: was -10)
  names:{E:"Economy",L:"Labor",M:"Machinery",C:"Community"},
  bands:[[81,"Excellent","ex"],[61,"Strong","st"],[40,"Steady","sd"],[20,"Strained","sn"],[0,"Crisis","cr"]]};
const CIVK=["E","L","M","C"];
const civOn=()=>!!(S&&S.civ&&S.season&&S.season.on&&!S.free&&!S.zen);
const civV=k=>civOn()?S.civ.m[k]:50;
const civBand=v=>CIV.bands.find(b=>v>=b[0]);
// -1..+1 from the meter: linear above 50, a slight curve below (20 hurts noticeably more than 40)
function civS(k){const x=(civV(k)-50)/50;return x<0?-Math.pow(-x,1.1):x;}   // (round 2: curve 1.1, was 1.3, so Strained costs more)
// the effect at the meter's value: lo at 0, mid at 50, hi at 100
function civE(k,lo,hi,mid){const s=civS(k);return s<0?mid+(lo-mid)*(-s):mid+(hi-mid)*s;}
// --- effects (read by applyUpgrades, freqMul, chaosTick, the outage and the tick) ---
const civPrice=()=>civE("E",-15,15,0);                 // (round 1: was -20 at 0; round 2: -15)                 // $/t on every grade
const civRepair=()=>civE("L",0.7,1.2,1);               // repair speed
const civBreak=()=>civE("L",1.3,0.8,1);                // sheet breaks and hayouts
const civYard=()=>civE("L",1.5,0.5,1);                 // (round 1: was 2 at 0)                   // yard upsets (forklifts, call-offs, brawls...)
const civOver=()=>Math.round(civE("L",120,-60,0));     // planned outages: minutes over (+) or early (-)
const civMach=()=>civE("M",1.3,0.7,1);                 // (round 1: was 1.5 at 0)                 // stock prep and machine breakdowns
const civSpeed=()=>civE("M",0.92,1.03,1)*(S&&S.civ&&S.civ.runUntil>S.t?1.04:1);   // machine capacity (and a record run week)
const civBill=()=>civE("M",1.2,0.9,1);                 // repair bills
const civComm=()=>civE("C",1.5,0.5,1);                 // (round 1: was 2 at 0)                   // permit and community upsets
const civFine=()=>civE("C",1.5,0.75,1);                // fines
const civRecv=()=>civE("C",0.8,1,1);                   // receiving (truck hours limited)
const civTax=()=>Math.max(0,civS("C"))*2000;           // (round 1: was $1k/day)           // $/day tax break at the top
function civRng(){if(S.rng.civ==null)S.rng.civ=(S.seed^0x7f4a7c15)|0;return rand("civ");}
// the area a standing order covers, for any upset with choices
const CIV_AREA={"Inbound":"Stock prep","Utility":"Machine","Outbound":"Yard","Customer":"Customers"};
const civArea=id=>{const u=CIVU[id];return u?(CIV_AREA[u.a]||u.a):"";};
const civMeterEv=id=>/^[wc]_|^r_/.test(id);
// upset odds: each choice's odds step, and the meters (Labor for the yard, Machinery for stock prep and the machine, Community for the permit)
function civFreq(id){if(!civOn())return 1;let m=(S.civ.odds&&S.civ.odds[id])||1;const g=EV[id]&&EV[id].g;
  if(g==="yard")m*=civYard();if(g==="machine"||g==="stock")m*=civMach();if(id==="permit")m*=civComm();return m;}
function civEnergy(){let v=0;if(S&&S.fx)for(const f of S.fx)if(f.energy)v+=f.energy;return v;}
// start values: 50 each, then the leader's, then the site
function civStart(){S.civ={m:{E:50,L:50,M:50,C:50},snap:{E:50,L:50,M:50,C:50},snapT:0,odds:{},orders:{},seen:{},q:[],cur:null,tm:[],
  arm:{w:{E:1,L:1,M:1,C:1},r:{E:1,L:1,M:1,C:1},c:{E:0,L:0,M:0,C:0}},flags:{},prem:0,taxDay:0,cspend:-1e9,pledgeN:0,pledgeOut:false,pledgeDon:0,newNext:1440,auT:0,log:[]};
  civSetStart();}
function civSetStart(){if(!S.civ)return;const b=(S.lead&&CIV.lead[S.lead.id])||{E:50,L:50,M:50,C:50},sa=CIV.site[SITE.env]||{};
  CIVK.forEach(k=>{S.civ.m[k]=Math.max(CIV.startMin,Math.min(100,b[k]+(sa[k]||0)));S.civ.snap[k]=S.civ.m[k];});applyUpgrades();}
// add a design-weight change ({E:1,C:-2}); returns a short text for logs and toasts
function civAdd(d,why){if(!S.civ||!d)return "";const out=[];
  for(const k of CIVK){const v=d[k];if(!v)continue;const p=v*CIV.unit;S.civ.m[k]=Math.max(0,Math.min(100,S.civ.m[k]+p));out.push(`${CIV.names[k]} ${v>0?"+":"−"}${Math.abs(p)}`);}
  if(d.C>0)S.civ.cspend=S.t;   // (v5.1 QA: anything that raises Community keeps a promise to the town)
  if(out.length){applyUpgrades();if(why)log(`${why}: ${out.join(", ")}`,"");}return out.join(", ");}
const civTxt=d=>CIVK.filter(k=>d&&d[k]).map(k=>`${CIV.names[k]} ${d[k]>0?"+":"−"}${Math.abs(d[k]*CIV.unit)}`).join(", ");   // (in meter points)
const civWage=()=>civOn()&&S.civ.wage||1;   // the walkout settlement's lasting raise
