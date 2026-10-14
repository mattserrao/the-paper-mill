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
// v5.0.3: the mill name goes to the public boards, so it gets the same banned words as player names (supabase/leaderboard.sql)
const BANNED_WORDS=["fuck","shit","cunt","bitch","nazi","hitler"];
// v5.0.5: matched after folding look-alike characters (1/!→i, 0→o, 3→e, 4/@→a, $/5→s, 7→t) and dropping spaces and punctuation,
// so "Sh1t" and "f u c k" are caught; a few real words that contain one ("Scunthorpe") are allowed first
const NAME_OK_WORDS=["scunthorpe","shiitake","shitake"];
// v5.0.6: Unicode too: full-width and styled letters fold through NFKD (accents dropped), and Greek/Cyrillic look-alikes
// map to the Latin letter they imitate ("fυck", "ｆｕｃｋ", "ѕhіt" are caught)
const NAME_CONFUSE={"а":"a","α":"a","в":"b","β":"b","с":"c","ϲ":"c","е":"e","ε":"e","ё":"e","һ":"h","н":"h","η":"n","і":"i","ι":"i","ї":"i","ј":"j","к":"k","κ":"k","м":"m","о":"o","ο":"o","σ":"o","р":"p","ρ":"p","ѕ":"s","т":"t","τ":"t","υ":"u","μ":"u","ν":"v","ш":"w","ω":"w","х":"x","χ":"x","у":"y","γ":"y","з":"3","ч":"4","ı":"i"};
const nameFold=v=>String(v||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\x00-\x7f]/g,c=>NAME_CONFUSE[c]||c).replace(/[1!|]/g,"i").replace(/0/g,"o").replace(/3/g,"e").replace(/[4@]/g,"a").replace(/[$5]/g,"s").replace(/7/g,"t");
const nameOk=v=>{let l=nameFold(v);NAME_OK_WORDS.forEach(w=>{l=l.split(w).join(" ");});const tight=l.replace(/[^a-z]/g,"");return !BANNED_WORDS.some(w=>tight.includes(w));};
function renameMill(v){v=String(v||"").replace(/\s+/g," ").trim().slice(0,32).trim();if(!v)return;if(!nameOk(v))return false;MILL.name=v;try{if(G3.rebrand)G3.rebrand();}catch(e){}}
