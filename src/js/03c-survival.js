/* ---------- v4.3 survival mode: constants and helpers ----------
   A survival run is a season with no end date (S.season.surv): the same start, site, bottleneck, weekly dice, AUTO locks,
   planned outages, event cards and report cards. It ends at bankruptcy, and the score is the time survived.
   Waves are the gaps between planned outages: the wave being played is the number of the next outage (S.outg.k), so the
   mode keeps no state of its own. Each wave is SURV.up more upset-prone and SURV.cost dearer (fibre, energy and chemicals,
   wages) than the wave before it: the steps compound, so the first waves change little and the pressure builds gradually
   (compound:false adds the steps instead). Tuned with tools/survival.py: at +20% / +10% a hands-off mill lasts about 6
   waves and a well-upgraded one about 12 to 14. The mode starts and ends in 09b-survival.js; the hooks elsewhere are
   one-liners that do nothing in a season or in free play (the multipliers are exactly 1 there). */
const SURV={up:0.20,cost:0.10,compound:true,every:4,table:"survival",local:"paper-mill-local-survival",best:"paper-mill-survival-best"};
const survRun=()=>!!(S&&S.season&&S.season.surv);                 // a survival run, running or just ended
const survOn=()=>!!(S&&S.season&&S.season.surv&&S.season.on);     // ...and still running
const survWave=()=>(S&&S.outg&&S.outg.k)||1;
const survMul=(step,w)=>SURV.compound?Math.pow(1+step,w-1):1+step*(w-1);
const survUp=(w=survWave())=>survMul(SURV.up,w);
const survCost=(w=survWave())=>survMul(SURV.cost,w);
const xf=v=>"×"+v.toFixed(2);
// time survived: sim minutes -> "12d 7h 35m" (the score on the survival leaderboard)
function survTime(t){const m=Math.max(0,Math.floor(t)),d=Math.floor(m/1440),h=Math.floor(m%1440/60);return `${d}d ${h}h ${m%60}m`;}
// when the wave being played began and when it ends (the end of its outage), in sim minutes
function survSpan(w=survWave()){return [w>1?outStart(w-1)+OUT.len:0,outStart(w)+OUT.len];}
