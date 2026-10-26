/* ---- v6.13.1 easter egg: the vending machine by the office door ----
   Tap it: buy a soda, or buy your last soda. The last soda drops the sim to 1 min/s and the camera follows the operator
   nearest the machine (34-3d-hayout): he buys it, carries it to the aisle by the presses, thinks it over, walks a slow
   circle and throws it at the machine. Where it lands: the forming fabric runs off, the press felts blow, the fog fan
   trips, a steam joint blows out and the dryer hood catches fire (the ordinary upsets, their bills and cards included).
   The player's own speed comes back at the hit. With the 3D view off (or if the scene never finishes) the sim lands the
   can itself after SODA.wait sim minutes. Not in zen (no upsets there). Nothing is saved: a reload mid-scene cancels it. */
const SODA={on:false,slow:false,hold:false,S:null,t0:0,hitT:0,who:-1,ph:"",pt:0,wait:60,n:0};G3.soda=SODA;
const SODA_EV=["fabric","felt","fogfan","steamjoint","dryerfire"];
function vendPanel(){let p=$("vend");if(p)return p;
  p=kEl("div","spider",`<div class="spih"><b id="vend-h">Vending machine</b><span>by the office door · $1.50</span><button aria-label="Close" id="vendClose">✕</button></div>
    <div id="vendTxt" style="font-size:13px;line-height:1.4"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="vendBuy">Buy a soda</button><button id="vendLast">Buy your last soda</button></div>`);
  p.id="vend";p.hidden=true;p.setAttribute("role","dialog");p.setAttribute("aria-labelledby","vend-h");($("view3d")||document.body).appendChild(p);
  $("vendClose").addEventListener("click",()=>{p.hidden=true;});
  $("vendBuy").addEventListener("click",()=>{p.hidden=true;SODA.n++;G3.vendCall=true;log(SODA.n>1?`Another soda from the vending machine (${SODA.n} today). Cold, at least.`:"A soda from the vending machine. Cold, at least.","ok");});
  $("vendLast").addEventListener("click",()=>{p.hidden=true;sodaLast();});
  return p;}
function vendOpen(){if(!S)return;const p=vendPanel();["spider","slice","brian"].forEach(k=>{const e=$(k);if(e)e.hidden=true;});
  const busy=SODA.on,zen=S.zen,over=!!(S.season&&S.season.done);
  $("vendTxt").textContent=busy?"Someone is already at it.":zen?"Cold drinks. The diet button is taped over. (Zen mode: nothing here is anyone's last soda.)":"Cold drinks. The diet button is taped over.";
  $("vendLast").disabled=busy||zen||over;$("vendBuy").disabled=busy;p.hidden=false;}
function sodaLast(){if(!S||S.zen||SODA.on)return;
  Object.assign(SODA,{on:true,slow:true,S,t0:S.t,who:-1,ph:"",pt:0,at:false,c:null,fly:null});
  log("An operator walks to the vending machine for his last soda.","warn");
  if(!(G3.on&&G3.frame))sodaHit();}   // (no 3D view: straight to the ending)
// the can lands (34 calls it; the sim calls it if the scene never got there)
function sodaHit(){if(!SODA.slow||SODA.S!==S)return;SODA.slow=false;
  log("He threw his last soda at the paper machine.","bad");
  SODA.hold=true;SODA.hitT=S.t;for(const id of SODA_EV)if(EV[id])trigger(id);   // (their cards wait for the 3D scene's last few seconds: sodaDone)
  if(!(G3.on&&G3.frame)){SODA.on=false;sodaDone();}}
// the scene is over: the upsets' cards can come up
function sodaDone(){const Z=G3.soda;if(!Z||!Z.hold)return;Z.hold=false;if(S&&S.civ&&S.civ.q.length&&!(S.cards&&S.cards.open)&&!outOn())civNext();}
G3.sodaDone=sodaDone;
G3.sodaHit=sodaHit;
// every sim step: a new run or a load ends the scene; the fallback ending
// (through G3: the sim can step before this file's const is set up)
function sodaTick(){const Z=G3.soda;if(!Z||!Z.on&&!Z.slow&&!Z.hold)return;if(Z.S!==S||S.zen){Z.on=Z.slow=Z.hold=false;Z.who=-1;if(G3.folObj&&G3.followObj)G3.followObj(null);return;}
  if(Z.slow&&S.t-Z.t0>Z.wait)sodaHit();
  if(Z.hold&&S.t-Z.hitT>Z.wait)sodaDone();}   // (the 3D scene stalled: don't keep the cards back for good)
G3.vendOpen=vendOpen;   // (the checks open it without a tap)
