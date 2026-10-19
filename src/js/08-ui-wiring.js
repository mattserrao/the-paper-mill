/* ---------- UI wiring ---------- */
// v6.5.1 second screen: the DCS and the process flow can live in a pop-out window (50e-popout.js). Their elements are then
// in that window's document, so $() looks there when the main page doesn't have the id; actEl() is the focused element
// of whichever window an input is in.
const POP={w:null,on:false,view:"dcs"};
const $=id=>{const e=document.getElementById(id);if(e||!POP.on)return e;try{return POP.w&&!POP.w.closed?POP.w.document.getElementById(id):null;}catch(_){return null;}};
const actEl=el=>el&&el.ownerDocument?el.ownerDocument.activeElement:document.activeElement;
const gradeSel=$("grade");
const GRADE_PLAIN={"23m":"light medium","26m":"medium","30m":"heavy medium","33HT":"high-strength board"};   // v5.1 QA2: the plain names cards use
Object.keys(GRADES).forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=`${k} · ${GRADE_PLAIN[k]||""} · ${GRADES[k].bw} lb · $${ECON.price[k]}/t`;gradeSel.appendChild(o);});
gradeSel.disabled=true;gradeSel.title="Set by the market: the planner schedules grades from customer orders";
const rows=[...document.querySelectorAll(".row[data-key]")];
let dragging=null;
rows.forEach(r=>{
  const key=r.dataset.key, inp=r.querySelector("input"), btn=r.querySelector(".auto");
  inp.addEventListener("pointerdown",()=>dragging=key);
  inp.addEventListener("pointerup",()=>dragging=null);
  inp.addEventListener("blur",()=>dragging=null);
  inp.addEventListener("input",()=>{C[key].v=parseFloat(inp.value); if(btn){C[key].auto=false;}});
  if(btn) btn.addEventListener("click",()=>{C[key].auto=!C[key].auto;});
});
function syncControls(){
  rows.forEach(r=>{const key=r.dataset.key, inp=r.querySelector("input"), btn=r.querySelector(".auto");
    if(dragging!==key && actEl(inp)!==inp) inp.value=C[key].v;
    else if(C[key].auto) inp.value=C[key].v;
    r.querySelector(".val").textContent=UNITS[key](C[key].v);
    if(btn){btn.setAttribute("aria-pressed",C[key].auto?"true":"false");btn.textContent=C[key].auto?"AUTO":"MANUAL";}
  });
  gradeSel.value=C.grade; $("breaks").checked=C.breaks; $("hays").checked=C.hays;
}
$("breaks").addEventListener("change",e=>{if(S.season&&S.season.on){e.target.checked=C.breaks=true;return;}C.breaks=e.target.checked;});
$("hays").addEventListener("change",e=>{if(S.season&&S.season.on){e.target.checked=C.hays=true;return;}C.hays=e.target.checked;});
// sound: on by default, but browsers only allow audio after the first tap or click
let soundPref="on";try{soundPref=localStorage.getItem("paper-mill-sound")||"on";}catch(e){}
function paintSound(){const s=AUDIO.on,b=$("v2sound");if(b){b.textContent=s?"Sound on":"Sound off";b.setAttribute("aria-pressed",String(s));}titleSoundPaint();}
function setSound(v){AUDIO.setOn(v);soundPref=v?"on":"off";try{localStorage.setItem("paper-mill-sound",soundPref);}catch(e){}paintSound();}
{let vv=70;try{vv=+(localStorage.getItem("paper-mill-vol")||70);}catch(e){}AUDIO.setVol(vv/100);}
// Safari only accepts audio from a completed tap (touchend / click / pointerup / keydown), not from pointerdown:
// starting it on pointerdown made iOS mark the first context "interrupted" straight away
const GESTURES=["pointerup","touchend","click","keydown"];
const firstGesture=()=>{GESTURES.forEach(t=>window.removeEventListener(t,firstGesture,true));if(soundPref==="on"&&!AUDIO.on)setSound(true);};
GESTURES.forEach(t=>window.addEventListener(t,firstGesture,{capture:true,passive:true}));
paintSound();
const PAPER={brown:"#b98d61",white:"#fbfbfd"};
function setPaper(c){if(!PAPER[c])c="brown";document.documentElement.style.setProperty("--paperc",PAPER[c]);PAL_V++;
  document.querySelectorAll("#paperColor button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.c===c)));try{localStorage.setItem("paper-mill-paper",c);}catch(e){}}
document.querySelectorAll("#paperColor button").forEach(b=>b.addEventListener("click",()=>setPaper(b.dataset.c)));
{let pc="brown";try{pc=localStorage.getItem("paper-mill-paper")||"brown";}catch(e){}setPaper(pc);}
$("balance").addEventListener("click",()=>{AUTOKEYS.forEach(k=>C[k].auto=true);});
let running=true;
// everything the UI refreshes 5 times a second, called from the main loop with a tick counter (no separate timers)
const UI_TICKS=[];
// sim speed in sim-minutes per real second; every speed change goes through here
function setSimSpeed(v){C.simSpeed=Math.max(1,Math.min(TURBO?960:120,Math.round(+v)||1));}
// v5.0.1: C.simSpeed is the player's chosen speed and nothing else ever changes it. The speed the game actually runs at is
// simRate(): zen runs at 1; a planned outage runs at the player's speed unless they pressed "Watch the crews" on the
// outage notice (S.outg.watch), then at no more than OUT.simCap until it ends or they touch the speed. When the outage
// or zen ends there is nothing to restore: the player's choice was never touched. (v5.0.6: outages used to be capped
// always; playtests found nothing to do in the 48 s and up to half a fast run spent waiting.)
// (Only inside a running season or survival run: zen and free play end the season mid-outage without ending the outage.)
const outCapped=()=>!!(S&&S.outg&&S.outg.on&&S.outg.watch&&S.season&&S.season.on&&!S.zen&&C.simSpeed>OUT.simCap&&!TURBO_FAST(C.simSpeed));
// v5.6: a knob panel or a DCS / QCS screen open runs the game at 1 min/s (G3.knobUI), and closing it is back at the
// player's speed (their choice is never touched)
function simRate(){return S&&S.zen?1:G3.knobUI?1:outCapped()?OUT.simCap:C.simSpeed;}

const cgrid=$("chaosgrid");
GROUPS.forEach(([g,lab])=>{const d=document.createElement("div");d.className="grp";const h=document.createElement("h3");h.textContent=lab;d.appendChild(h);
  EVENTS.filter(e=>e.g===g&&!e.knob&&(!e.env||e.env===SITE.env)).forEach(e=>{const r=document.createElement("div");r.className="ev";
    r.innerHTML=`<button class="trig" id="ev-${e.id}" aria-pressed="false"><span>${e.name}${e.env?' <em class="envtag">'+ENVS[e.env].short+'</em>':""}</span><small></small></button><label><input type="checkbox" id="en-${e.id}" checked> random</label>`;
    d.appendChild(r);
    r.querySelector("button").addEventListener("click",()=>{if(S.season&&S.season.on)return;if(active(e.id))clearIncident(e.id);else{trigger(e.id);if(e.id==="birdline"&&typeof G3!=="undefined"&&G3.on&&$("v2close"))$("v2close").click();}updateChaos();});   // (t17: picking the bird closes the list so its cut-scene plays)
    r.querySelector("input").addEventListener("change",ev=>{CH.en[e.id]=ev.target.checked;});});
  cgrid.appendChild(d);});
$("chaosOn").addEventListener("change",e=>CH.on=e.target.checked);
// collapsed by default: simple view first, "Show more" for fine control
function moreToggle(sec,btn,key,onSet){let open=false;try{open=localStorage.getItem(key)==="1";}catch(e){}
  const set=v=>{open=v;$(sec).classList.toggle("collapsed",!v);$(btn).textContent=v?"Show less":"Show more";$(btn).setAttribute("aria-expanded",v);if(onSet)onSet(v);try{localStorage.setItem(key,v?"1":"0");}catch(e){}};
  $(btn).addEventListener("click",()=>set(!open));return set;}
$("chaosLvl").addEventListener("input",e=>{CH.lvl=+e.target.value;$("chaosLvlv").textContent=CH.lvl+"×";});
$("chaosRandom").addEventListener("click",()=>{if(S.season&&S.season.on)return;const pool=EVENTS.filter(e=>!e.knob&&!active(e.id));if(pool.length)trigger(pool[Math.floor(Math.random()*pool.length)].id);updateChaos();});
$("chaosClear").addEventListener("click",()=>{if(S.season&&S.season.on)return;S.inc.forEach(i=>i.left=0);});
function applyName(){$("pm-title").textContent=NAME;$("pmname").value=NAME;}
$("pmname").addEventListener("input",e=>{NAME=e.target.value.trim()||"PM";$("pm-title").textContent=NAME;try{localStorage.setItem("mill-twin-name",NAME);}catch(err){}});
applyName();
const ugrid=$("ugrid");
UGROUPS.forEach(([g,lab])=>{const d=document.createElement("div");d.className="ugrp closed";d.dataset.g=g;const h=document.createElement("h3");h.textContent=lab;
  const sm=document.createElement("span");sm.className="usum";sm.id="usum-"+g;h.appendChild(sm);h.setAttribute("role","button");h.tabIndex=0;h.setAttribute("aria-expanded","false");
  const tog=()=>{d.classList.toggle("closed");h.setAttribute("aria-expanded",!d.classList.contains("closed"));};h.addEventListener("click",tog);h.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();tog();}});d.appendChild(h);
  UPS.filter(u=>u.g===g).forEach(u=>{const el=document.createElement("div");el.className="up";el.id="up-"+u.id;
    el.innerHTML=`<div class="uh"><b>${u.name}</b><span class="pips">${u.lv.map(()=>"<i></i>").join("")}</span></div><p>${u.desc}</p><p class="fixtag" hidden></p><button class="buy" id="buy-${u.id}"></button>`;
    el.querySelector("button").addEventListener("click",()=>buy(u.id));d.appendChild(el);});
  ugrid.appendChild(d);});
moreToggle("chaosSec","chaosMore","paper-mill-chaos-more")(false||(()=>{try{return localStorage.getItem("paper-mill-chaos-more")==="1";}catch(e){return false;}})());
moreToggle("shopSec","shopMore","paper-mill-shop-more",v=>document.querySelectorAll(".ugrp").forEach(d=>{d.classList.toggle("closed",!v);d.querySelector("h3").setAttribute("aria-expanded",v);}))((()=>{try{return localStorage.getItem("paper-mill-shop-more")==="1";}catch(e){return false;}})());
// v4.1 v19: one upgrade a day; the day turns over at 6 am (S.t 0 is 6 am on day 1). Free play is exempt.
const upDay=()=>Math.floor(S.t/1440),upLocked=()=>!S.free&&S.upDay===upDay();
// v5.0.4: the shop day starts at 6 AM on the clock, so after 6 AM the next one is tomorrow's
const UP_NARROW=matchMedia("(max-width:420px)");
const upNext=()=>((S.t+360)/60)%24>=6?"tomorrow 6\u00a0AM":"at 6\u00a0AM";   // v5.0.6: "6 AM" never splits across lines
function buy(id){const u=UP[id],l=LV(id);if(l>=u.lv.length)return;const cost=upCost(u,l);if(!S.free&&S.cash<cost)return;if(upLocked())return;
  S.upDay=upDay();spend(cost,"upgrades");AUDIO.sfx("cash",150);S.up[id]=l+1;applyUpgrades();
  if(id==="reliab"&&l===0&&civOn())civAdd(TELL.relCiv,"Reliability program");   // v5.7: monitoring raises Machinery (and unlocks the Vibration Report)
  BANNERS.push({text:`${u.name}${u.lv.length>1?" level "+(l+1):""} is online.`,t:null,kind:"good"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Installed ${u.name}${u.lv.length>1?" level "+(l+1):""} (${money(cost)})`,"ok");updateShop();}
const LEDGER=[["rev","Paper sales",1],["occ","OCC purchases",-1],["frin","Inbound freight",-1],["frout","Outbound freight",-1],["energy","Energy & chemicals",-1],["labor","Wages & robots",-1],["overhead","Mill overhead",-1],["repairs","Upset repairs",-1],["premium","Insurance premium",-1],["upgrades","Upgrades bought",-1],["deals","Deals & trials",1],["civ","Civics",-1]];
function updateRel(){const tg=$("relnow"),out=document.createElement("div");const pct=v=>(v>=0?"+":"")+Math.round(v*100)+"%";
    [["stock","Stock prep"],["wet","Wet end"],["dry","Dry end"]].forEach(([a,n])=>{const r=areaRel(a),d=document.createElement("div"),sum=[r.up,r.out,r.fx,r.site||1,r.lead||1].reduce((t,v)=>t+(Math.abs(v-1)>0.005?v-1:0),0);d.className="stat "+(sum>0.005?"pos":sum<-0.005?"neg":"");
      const bits=[["upgrades",r.up],["outage budget",r.out],["events",r.fx],["site",r.site||1],["leader",r.lead||1]].filter(([,v])=>Math.abs(v-1)>0.005).map(([k,v])=>k+" "+pct(v-1));
      d.innerHTML=`<span>${n}<small style="display:block;color:var(--muted);font-size:12px;font-weight:500">${bits.length?bits.join(" · "):"standard"}</small></span><b>${Math.abs(sum)<0.005?"–":pct(sum)}</b>`;out.appendChild(d);});
  if(out.innerHTML!==tg.innerHTML)tg.replaceChildren(...out.childNodes);}   // (v5.2: built off-page, swapped in only when it changed)
function updateShop(){const short=bnShort();   // (v5.2: once per tick, not once per upgrade)
  {const e=$("u-cash"),t=money(S.cash);if(e.textContent!==t)e.textContent=t;}
  {const w=document.querySelector(".wallet small"),t=S.free?"Cash on hand":upLocked()?(UP_NARROW.matches?"Next upgrade: "+upNext():"Cash on hand · next upgrade "+upNext()):"Cash on hand · 1 upgrade a day";if(w&&w.textContent!==t)w.textContent=t;}
  UGROUPS.forEach(([g])=>{const us=UPS.filter(u=>u.g===g),own=us.reduce((a,u)=>a+LV(u.id),0),tot=us.reduce((a,u)=>a+u.lv.length,0),can=upLocked()?0:us.filter(u=>LV(u.id)<u.lv.length&&(S.free||S.cash>=upCost(u,LV(u.id)))).length;
    const fix=short&&us.some(upFix);const el=$("usum-"+g),h=`${fix?'<em class="fixg">fix</em> ':""}${own}/${tot} bought${can?` · <b>${can} affordable</b>`:""}`;if(el&&el.innerHTML!==h)el.innerHTML=h;});
  UPS.forEach(u=>{const l=LV(u.id),el=$("up-"+u.id),b=$("buy-"+u.id),max=l>=u.lv.length;
    el.classList.toggle("max",max);if(el.dataset.lv!==String(l)){el.dataset.lv=l;el.querySelectorAll(".pips i").forEach((p,k)=>p.classList.toggle("on",k<l));}
    {const fx=upFix(u),ft=el.querySelector(".fixtag");el.classList.toggle("fix",fx);if(ft){ft.hidden=!fx;if(fx){const t=short?"Fixes the bottleneck · 25% off. "+(BN_UPTXT[S.bn+"/"+u.id]||""):"Bottleneck fixed · still 25% off";   /* v5.1 QA2: no "fixes" once it is fixed */if(ft.textContent!==t)ft.textContent=t;}}}
    let bt,bd;if(max){bd=true;bt="Maxed";}
    else{const c=upCost(u,l),lk=upLocked();bd=lk||(!S.free&&S.cash<c);bt=S.free?"Add (free play)":lk?`${money(c)} · ${upNext()}`:S.cash<c?`Need ${money(c)}`:`Buy ${money(c)}`;}
    if(b.disabled!==bd)b.disabled=bd;if(b.textContent!==bt)b.textContent=bt;});
  // v5.2: the ledger is built off-page and swapped in only when it changed (it used to be rebuilt 5 times a second);
  // the reliability panel it used to refresh here lives in the Stats pane, which refreshes it itself
  const lg0=$("ledger"),lg=document.createElement("div");
  lineCapView(lg);bnCard();
  const h=document.createElement("h3");h.textContent="Books since start";lg.appendChild(h);
  let net=0;LEDGER.forEach(([k,lab,sg])=>{const v=(S.ledger[k]||0)*sg;net+=v;if((k==="premium"||k==="repairs"||k==="deals"||k==="civ")&&!S.ledger[k])return;
    const d=document.createElement("div");d.className="stat "+(v>=0?"pos":"neg");d.innerHTML=`<span>${lab}</span><b>${money(v)}</b>`;lg.appendChild(d);});
  const n=document.createElement("div");n.className="stat net "+(net>=0?"pos":"neg");n.innerHTML=`<span>Net</span><b>${money(net)}</b>`;lg.appendChild(n);
  const m=document.createElement("div");m.className="stat";const t=S.shipT||0;
  m.innerHTML=`<span>Operating margin per ton shipped</span><b>${t>0?money(net/t+S.ledger.upgrades/t):"–"}</b>`;lg.appendChild(m);
  if(lg.innerHTML!==lg0.innerHTML)lg0.replaceChildren(...lg.childNodes);
}
// random upsets run at half the original rate. Seasons script the pressure: a quiet start-up (days 1-3), then normal
// running to the end (v4.4.0-t3: the day-15 rough patch is gone).
function upsetMul(){const base=0.5,d=Math.floor(S.t/1440)+1;let m=base;
  if(S.season&&S.season.on&&d<=3)return 0;
  if(d<=7)m*=0.75;   // v3.3.3: the first week is 25% calmer (seasons and free play)
  if(survOn())m*=survUp();   // v4.3 survival: every wave is rougher than the last
  return m;}
// Bankruptcy is the only end-of-game overlay. There is no cash target any more: the goal is to make as much money as you can.
function showOverlay(){running=false;
  const ov=$("overlay");ov.hidden=false;
  AUDIO.sfx("lose",100);
  $("ov-h").textContent="Chapter 11";$("ov-p").textContent=`${NAME} ran out of money on ${hhmm(S.t)}. The mill has been sold to a private equity firm, which is already "exploring strategic options".`;
  $("ov-a").textContent="New game";$("ov-b").hidden=true;
  $("ov-a").focus();}
$("ov-a").addEventListener("click",()=>{$("overlay").hidden=true;$("overlay").style.zIndex="";const dc=document.getElementById("dealOv");if(S.over){newGame();}else if(dc&&!dc.hidden&&!dc.classList.contains("dealres")){}else{running=true;}});
$("ov-b").addEventListener("click",()=>{$("overlay").hidden=true;newGame();});
function newGame(){const sp=C.simSpeed;initCtrl();C.simSpeed=sp;initState();BANNERS.length=0;running=true;seasonLocks(false);bnNotice();}
