(()=>{
/* ---- random brand colors and a wacky paper-themed mill name on every load ---- */
const BRANDS=["#2f5bea","#0c8f7f","#d6336c","#6741d9","#e8590c","#1971c2","#2f9e44","#c2255c","#5f3dc4","#0b7285","#e03131","#9c36b5","#1098ad","#d9480f"];
const NAME_A=["Pulp Fiction","Reel Deal","Big Roll Energy","Ream Team","Corrugation Station","Fourdrinier Fiesta","Kraft Punk","Felt Cute","Nip & Tuck","Caliper Crew","Broke & Proud","Basis Weight Watchers","Fiber Optimist","Paper Trail","Dryer Can-Do","Hayout Heights","Couch Roll Potato","Wet End Wonders","Slitter Glitter","Headbox Heroes","Pulp Friction","Lignin Lounge","Starch Madness","Bale Out","Flute Loop","Tissue Issues","Sheet Show","Fluffy Fiber","Paper Jam","Roll Model","Box Office","Cellulose Encounters","Pulpit Rock","Tear Strength","Doctor Blade","Rewind Time","Ply Me to the Moon","Grain Direction","Fold Standard","Reel Housewives"];
const NAME_B=["Paper Co.","Mills","Paperworks","Board Mill","Containerboard","Fibre Inc.","Pulp & Paper","Paper Products","Mill Works","Corrugated Co."];
const MILL={brand:"",name:""};
// v4.0.1: bumped whenever a palette color variable changes (brand here, paper color in setPaper), so the 3D view
// re-reads the colors only then: reading computed styles forces a full style recalculation mid-frame
let PAL_V=0;
function rollMill(){let b;do{b=BRANDS[Math.floor(Math.random()*BRANDS.length)];}while(b===MILL.brand);
  MILL.brand=b;MILL.name=NAME_A[Math.floor(Math.random()*NAME_A.length)]+" "+NAME_B[Math.floor(Math.random()*NAME_B.length)];
  document.documentElement.style.setProperty("--brand",b);PAL_V++;
}
rollMill();
// rename from the menu: trims, caps at 32 characters, repaints the mill's signs
function renameMill(v){v=String(v||"").replace(/\s+/g," ").trim().slice(0,32);if(!v)return;MILL.name=v;try{if(G3.rebrand)G3.rebrand();}catch(e){}}
