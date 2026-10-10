const APP_VER="v4.0.1";   // shown in the menu and sent with leaderboard scores (max 12 characters)
/* v2.9.9 diagnostics: a rolling log of errors, warnings (incl. three.js shader / WebGL context messages), audio state changes
   and a stats snapshot every 15 s, shown from Controls > Diagnostics with a Copy button */
const DIAG=[],DIAG_T0=performance.now();
function diag(m){try{DIAG.push(((performance.now()-DIAG_T0)/1000).toFixed(1)+"s "+String(m).slice(0,400));if(DIAG.length>150)DIAG.shift();}catch(e){}}
window.addEventListener("error",e=>diag("ERROR "+(e.message||e)+(e.lineno?" @"+e.lineno+":"+e.colno:"")));
window.addEventListener("unhandledrejection",e=>diag("REJECT "+((e.reason&&e.reason.message)||e.reason)));
/* some embedded viewers (in-app HTML previews) ship a partial console: fill any missing method so logging can't stop the game */
(()=>{const C=(typeof console==="object"&&console)?console:(window.console={}),nop=()=>{},base=typeof C.log==="function"?C.log.bind(C):nop;
  if(typeof C.log!=="function")C.log=nop;["info","warn","error","debug","table","group","groupCollapsed","groupEnd","time","timeEnd"].forEach(k=>{if(typeof C[k]!=="function")C[k]=base;});})();
["error","warn"].forEach(k=>{const f=console[k].bind(console);console[k]=(...a)=>{diag(k.toUpperCase()+" "+a.map(x=>x&&x.stack?x.message+" | "+String(x.stack).split("\n").slice(0,3).join(" < "):String(x)).join(" "));f(...a);};});
document.addEventListener("visibilitychange",()=>diag("page "+(document.hidden?"hidden":"visible")));
