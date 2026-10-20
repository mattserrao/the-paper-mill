/* ---- v6.9 manning: the maintenance techs and the operators work in four teams, A–D, on a DuPont 12 rotation
   (the same 28-day pattern as mill-shifts: 4 nights, 3 off, 3 days, 1 off, 3 nights, 3 off, 4 days, 7 off; B, C and D
   run 7, 14 and 21 days behind A). Shift k runs from S.t = 720k: even k is days (6 a.m.–6 p.m.), odd k nights.
   Nothing here is stored. The roster, every shift's team, its vacations and who covers them follow from S.seed, S.t
   and P.techs alone, through their own hash (not rand(): the sim's luck streams draw exactly as before), so seasons
   still replay identically.
   Vacations are booked per work block (a person is off for their whole run of nights or days). Each shift, a gap is
   filled by someone from an off team who isn't working the shift before or after (12 h rest): mostly a pickup on
   overtime, sometimes a swap. Now and then a tech's gap goes unfilled, and that shift runs one tech short: maintenance
   repairs go at MAN.SLOW of their usual rate until the next shift change. ---- */
const MAN={PAT:"NNNNOOODDDONNNOOODDDDOOOOOOO",TEAMS:["A","B","C","D"],OFF:{A:0,B:7,C:14,D:21},ANCH:7,   // ANCH: day 0 is A's first day shift
  HAT:{A:"#3b7fa8",B:"#1a7b47",C:"#ff7a1a",D:"#f2f0ea"},NT:8,NO:9,   // NO: the 7 machine-floor operators and the 2 stock prep operators
  VAC:0.5,VAC2:0.15,SHORT:0.25,SWAP:0.3,SLOW:0.75,seed:null,ros:null,cache:new Map(),seen:null};
const MAN_FIRST=["Al","Ana","Bea","Ben","Bo","Cal","Cass","Dee","Dale","Dev","Eli","Emma","Faye","Finn","Gus","Gwen","Hank","Hope","Ian","Ida","Jay",
  "Jo","Kai","Kate","Lee","Liv","Mac","Mae","Max","Mia","Ned","Nia","Otis","Pam","Pete","Quinn","Ray","Rosa","Sal","Sam","Tess","Theo","Uma","Val",
  "Vic","Wes","Wren","Yara","Zack","Zoe","Abe","Bri","Cy","Dot","Ed","Flo","Gil","Hal","Ivy","Jen","Kit","Lou","Moe","Nell","Ollie","Ruth","Stu","Ty"];
const MAN_INIT="ABCDEFGHJKLMNOPRSTVWY";
// a small seeded generator per question asked (FNV-1a over the arguments, then the same mixer as rand())
function manH(...a){let h=0x811c9dc5;for(const v of a){const s=String(v);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}h^=0x7c;h=Math.imul(h,16777619);}
  return ()=>{h=(h+0x6D2B79F5)|0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function manRoster(){const sd=(S&&S.seed)>>>0;if(MAN.ros&&MAN.seed===sd)return MAN.ros;MAN.seed=sd;MAN.cache.clear();
  const r=manH("roster",sd),used=new Set(),ros={};
  MAN.TEAMS.forEach(T=>{const mk=(role,k)=>{let n;do{n=MAN_FIRST[Math.floor(r()*MAN_FIRST.length)]+" "+MAN_INIT[Math.floor(r()*MAN_INIT.length)]+".";}while(used.has(n));used.add(n);
      return {id:T+role+k,team:T,role,k,name:n};};
    ros[T]={t:Array.from({length:MAN.NT},(_,k)=>mk("t",k)),o:Array.from({length:MAN.NO},(_,k)=>mk("o",k))};});
  return MAN.ros=ros;}
const manCyc=(T,d)=>(((d+MAN.ANCH-MAN.OFF[T])%28)+28)%28;
const manKind=s=>(((s%2)+2)%2)?"N":"D";
function manTeam(s){const d=Math.floor(s/2),K=manKind(s);return MAN.TEAMS.find(T=>MAN.PAT[manCyc(T,d)]===K);}
// a team's letter for a calendar day: "D", "N" or "O" (off)
function manDay(T,d){return MAN.PAT[manCyc(T,d)];}
// who works shift s: {team, techs:[{home, who, vac, cover}], ops:[...], short}. who is null for an unfilled gap;
// cover is {type:"OT"|"swap", from:team}. Cached; the cache is dropped with the roster when the run is reseeded.
function manShift(s){manRoster();const nt=Math.max(1,Math.min(MAN.NT,P.techs|0)),key=s*16+nt;let m=MAN.cache.get(key);if(m)return m;
  const d=Math.floor(s/2),K=manKind(s),T=manTeam(s),c=manCyc(T,d);let c0=c;while(c0>0&&MAN.PAT[c0-1]===K)c0--;const d0=d-(c-c0);
  const R=MAN.ros[T],techs=R.t.slice(0,nt).map(p=>({home:p,who:p,vac:false,cover:null})),ops=R.o.map(p=>({home:p,who:p,vac:false,cover:null}));
  // vacations: decided once for the whole block, so the same people are away every shift of it
  const pool=[...techs,...ops],rv=manH("vac",MAN.seed,T,d0,K,nt),gone=[];
  if(rv()<MAN.VAC){gone.push(pool[Math.floor(rv()*pool.length)]);if(rv()<MAN.VAC2){const g2=pool[Math.floor(rv()*pool.length)];if(!gone.includes(g2))gone.push(g2);}}
  // cover: someone from a team that's off now and not on the shift before or after
  const near=new Set([manTeam(s-1),T,manTeam(s+1)]),free=MAN.TEAMS.filter(x=>!near.has(x)),rc=manH("cover",MAN.seed,s,nt);let short=0;
  for(const row of gone){row.vac=true;const tech=row.home.role==="t";
    if(tech&&rc()<MAN.SHORT){row.who=null;short++;continue;}
    const from=free.length?free[Math.floor(rc()*free.length)]:MAN.TEAMS[(MAN.TEAMS.indexOf(T)+2)%4],list=MAN.ros[from][tech?"t":"o"];
    row.who=list[Math.floor(rc()*list.length)];row.cover={type:rc()<MAN.SWAP?"swap":"OT",from};}
  m={s,d,K,team:T,techs,ops,short,nt};if(MAN.cache.size>96)MAN.cache.clear();MAN.cache.set(key,m);return m;}
const manIdx=()=>Math.floor((S&&S.t||0)/720);
function manNow(){return manShift(manIdx());}
// maintenance repair rate this shift (chaosTick, 04): slower when a tech's vacation went unfilled
function manRep(){return manNow().short?MAN.SLOW:1;}
// called every sim step: a short shift goes in the upset feed (only when play runs straight into it, not on a load or
// reseed). Ordinary shift changes and covers are on Report > Control room > Manning, not in the feed.
function manTick(){const s=manIdx();if(s===MAN.seen)return;const prev=MAN.seen;MAN.seen=s;if(prev!==s-1||S.zen)return;
  const m=manNow();if(m.short)log(`Shift change: ${m.team} team on ${m.K==="D"?"days":"nights"}, one tech short (a vacation went unfilled). Maintenance repairs are slower until the next shift.`,"warn");}
