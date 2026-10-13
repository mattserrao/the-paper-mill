(()=>{
/* ---- random brand colors and a wacky paper-themed mill name on every load ---- */
const BRANDS=["#2f5bea","#0c8f7f","#d6336c","#6741d9","#e8590c","#1971c2","#2f9e44","#c2255c","#5f3dc4","#0b7285","#e03131","#9c36b5","#1098ad","#d9480f"];
const NAME_A=["Pulp Fiction","Reel Deal","Big Roll Energy","Ream Team","Corrugation Station","Fourdrinier Fiesta","Kraft Punk","Felt Cute","Nip & Tuck","Caliper Crew","Broke & Proud","Basis Weight Watchers","Fiber Optimist","Paper Trail","Dryer Can-Do","Hayout Heights","Couch Roll Potato","Wet End Wonders","Slitter Glitter","Headbox Heroes","Pulp Friction","Lignin Lounge","Starch Madness","Bale Out","Flute Loop","Tissue Issues","Sheet Show","Fluffy Fiber","Paper Jam","Roll Model","Box Office","Cellulose Encounters","Pulpit Rock","Tear Strength","Doctor Blade","Rewind Time","Ply Me to the Moon","Grain Direction","Fold Standard","Reel Housewives"];
const NAME_B=["Paper Co.","Mills","Paperworks","Board Mill","Containerboard","Fibre Inc.","Pulp & Paper","Paper Products","Mill Works","Corrugated Co."];
const MILL={brand:"",name:""};
// v4.0.1: bumped whenever a palette color variable changes (brand here, paper color in setPaper), so the 3D view
// re-reads the colors only then: reading computed styles forces a full style recalculation mid-frame
let PAL_V=0;
// v13: each site has its own trim colour family (roof trim, signs, the water tower's roof and band), after the v13 site maps:
// green in the valley, red in the city, rose in the desert, blue on the bayou. siteBrand() (03b) sets the first of the
// family once the site is known; "New colors" then rolls within it.
const BRANDS_ENV={rural:["#2f7d4f","#2f9e44","#1f6f5c","#3c8d3a"],urban:["#c92a2a","#e03131","#b5342d","#d9480f"],desert:["#c2255c","#d6336c","#a61e4d","#e8590c"],swamp:["#1971c2","#1864ab","#0b7285","#1c7ed6"]};
function rollMill(){const L=BRANDS_ENV[MILL.env]||BRANDS;let b;do{b=L[Math.floor(Math.random()*L.length)];}while(b===MILL.brand);
  MILL.brand=b;MILL.name=NAME_A[Math.floor(Math.random()*NAME_A.length)]+" "+NAME_B[Math.floor(Math.random()*NAME_B.length)];
  document.documentElement.style.setProperty("--brand",b);PAL_V++;
}
rollMill();
function siteBrand(env){MILL.env=env;const L=BRANDS_ENV[env];if(!L)return;MILL.brand=L[0];document.documentElement.style.setProperty("--brand",L[0]);PAL_V++;}
// rename from the menu: trims, caps at 32 characters, repaints the mill's signs
// escape text (such as the player-chosen mill name) before it goes into innerHTML
const escHTML=t=>String(t).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
function renameMill(v){v=String(v||"").replace(/\s+/g," ").trim().slice(0,32).trim();if(!v)return;MILL.name=v;try{if(G3.rebrand)G3.rebrand();}catch(e){}}
