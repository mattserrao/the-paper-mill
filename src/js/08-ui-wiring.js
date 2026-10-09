/* ---------- UI wiring ---------- */
const $=id=>document.getElementById(id);
const gradeSel=$("grade");
Object.keys(GRADES).forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=`${k} · ${GRADES[k].bw} lb · $${ECON.price[k]}/t`;gradeSel.appendChild(o);});
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
    if(dragging!==key && document.activeElement!==inp) inp.value=C[key].v;
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
function paintSound(){const s=AUDIO.on,b=$("v2sound");if(b){b.textContent=s?"Sound on":"Sound off";b.setAttribute("aria-pressed",String(s));}}
function setSound(v){AUDIO.setOn(v);soundPref=v?"on":"off";try{localStorage.setItem("paper-mill-sound",soundPref);}catch(e){}paintSound();}
{let vv=70;try{vv=+(localStorage.getItem("paper-mill-vol")||70);}catch(e){}AUDIO.setVol(vv/100);}
// Safari only accepts audio from a completed tap (touchend / click / pointerup / keydown), not from pointerdown:
// starting it on pointerdown made iOS mark the first context "interrupted" straight away
const GESTURES=["pointerup","touchend","click","keydown"];
const firstGesture=()=>{GESTURES.forEach(t=>window.removeEventListener(t,firstGesture,true));if(soundPref==="on"&&!AUDIO.on)setSound(true);};
GESTURES.forEach(t=>window.addEventListener(t,firstGesture,{capture:true,passive:true}));
paintSound();
const PAPER={brown:"#b98d61",white:"#fbfbfd"};
function setPaper(c){if(!PAPER[c])c="brown";document.documentElement.style.setProperty("--paperc",PAPER[c]);
  document.querySelectorAll("#paperColor button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.c===c)));try{localStorage.setItem("paper-mill-paper",c);}catch(e){}}
document.querySelectorAll("#paperColor button").forEach(b=>b.addEventListener("click",()=>setPaper(b.dataset.c)));
{let pc="brown";try{pc=localStorage.getItem("paper-mill-paper")||"brown";}catch(e){}setPaper(pc);}
$("balance").addEventListener("click",()=>{AUTOKEYS.forEach(k=>C[k].auto=true);});
let running=true;
// everything the UI refreshes 5 times a second, called from the main loop with a tick counter (no separate timers)
const UI_TICKS=[];
// sim speed in sim-minutes per real second; every speed change goes through here
function setSimSpeed(v){C.simSpeed=Math.max(1,Math.min(120,Math.round(+v)||1));}

const cgrid=$("chaosgrid");
GROUPS.forEach(([g,lab])=>{const d=document.createElement("div");d.className="grp";const h=document.createElement("h3");h.textContent=lab;d.appendChild(h);
  EVENTS.filter(e=>e.g===g).forEach(e=>{const r=document.createElement("div");r.className="ev";
    r.innerHTML=`<button class="trig" id="ev-${e.id}" aria-pressed="false"><span>${e.name}</span><small></small></button><label><input type="checkbox" id="en-${e.id}" checked> random</label>`;
    d.appendChild(r);
    r.querySelector("button").addEventListener("click",()=>{if(S.season&&S.season.on)return;if(active(e.id))clearIncident(e.id);else trigger(e.id);updateChaos();});
    r.querySelector("input").addEventListener("change",ev=>{CH.en[e.id]=ev.target.checked;});});
  cgrid.appendChild(d);});
$("chaosOn").addEventListener("change",e=>CH.on=e.target.checked);
// collapsed by default: simple view first, "Show more" for fine control
function moreToggle(sec,btn,key,onSet){let open=false;try{open=localStorage.getItem(key)==="1";}catch(e){}
  const set=v=>{open=v;$(sec).classList.toggle("collapsed",!v);$(btn).textContent=v?"Show less":"Show more";$(btn).setAttribute("aria-expanded",v);if(onSet)onSet(v);try{localStorage.setItem(key,v?"1":"0");}catch(e){}};
  $(btn).addEventListener("click",()=>set(!open));return set;}
$("chaosLvl").addEventListener("input",e=>{CH.lvl=+e.target.value;$("chaosLvlv").textContent=CH.lvl+"×";});
$("chaosRandom").addEventListener("click",()=>{if(S.season&&S.season.on)return;const pool=EVENTS.filter(e=>!active(e.id));if(pool.length)trigger(pool[Math.floor(Math.random()*pool.length)].id);updateChaos();});
$("chaosClear").addEventListener("click",()=>{if(S.season&&S.season.on)return;S.inc.forEach(i=>i.left=0);});
function applyName(){$("pm-title").textContent=NAME;$("pmname").value=NAME;}
$("pmname").addEventListener("input",e=>{NAME=e.target.value.trim()||"PM";$("pm-title").textContent=NAME;try{localStorage.setItem("mill-twin-name",NAME);}catch(err){}});
applyName();
const ugrid=$("ugrid");
UGROUPS.forEach(([g,lab])=>{const d=document.createElement("div");d.className="ugrp closed";d.dataset.g=g;const h=document.createElement("h3");h.textContent=lab;
  const sm=document.createElement("span");sm.className="usum";sm.id="usum-"+g;h.appendChild(sm);h.setAttribute("role","button");h.tabIndex=0;h.setAttribute("aria-expanded","false");
  const tog=()=>{d.classList.toggle("closed");h.setAttribute("aria-expanded",!d.classList.contains("closed"));};h.addEventListener("click",tog);h.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();tog();}});d.appendChild(h);
  UPS.filter(u=>u.g===g).forEach(u=>{const el=document.createElement("div");el.className="up";el.id="up-"+u.id;
    el.innerHTML=`<div class="uh"><b>${u.name}</b><span class="pips">${u.lv.map(()=>"<i></i>").join("")}</span></div><p>${u.desc}</p><button class="buy" id="buy-${u.id}"></button>`;
    el.querySelector("button").addEventListener("click",()=>buy(u.id));d.appendChild(el);});
  ugrid.appendChild(d);});
moreToggle("chaosSec","chaosMore","paper-mill-chaos-more")(false||(()=>{try{return localStorage.getItem("paper-mill-chaos-more")==="1";}catch(e){return false;}})());
moreToggle("shopSec","shopMore","paper-mill-shop-more",v=>document.querySelectorAll(".ugrp").forEach(d=>{d.classList.toggle("closed",!v);d.querySelector("h3").setAttribute("aria-expanded",v);}))((()=>{try{return localStorage.getItem("paper-mill-shop-more")==="1";}catch(e){return false;}})());
function buy(id){const u=UP[id],l=LV(id);if(l>=u.lv.length)return;const cost=u.lv[l];if(!S.free&&S.cash<cost)return;
  spend(cost,"upgrades");AUDIO.sfx("cash",150);S.up[id]=l+1;applyUpgrades();
  BANNERS.push({text:`${u.name}${u.lv.length>1?" level "+(l+1):""} is online.`,t:null,kind:"good"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Installed ${u.name}${u.lv.length>1?" level "+(l+1):""} (${money(cost)})`,"ok");updateShop();}
const LEDGER=[["rev","Paper sales",1],["occ","OCC purchases",-1],["energy","Energy & chemicals",-1],["labor","Wages & robots",-1],["overhead","Mill overhead",-1],["repairs","Disaster repairs",-1],["premium","Insurance premium",-1],["upgrades","Upgrades bought",-1],["deals","Deals & trials",1]];
function updateRel(){const rn=document.getElementById("relnow"),lg=$("ledger"),tg=rn||lg;if(rn)rn.replaceChildren();else{const h0=document.createElement("h3");h0.textContent="Reliability now";lg.appendChild(h0);}const pct=v=>(v>=0?"+":"")+Math.round(v*100)+"%";
    [["stock","Stock prep"],["wet","Wet end"],["dry","Dry end"]].forEach(([a,n])=>{const r=areaRel(a),d=document.createElement("div"),sum=[r.up,r.out,r.fx].reduce((t,v)=>t+(Math.abs(v-1)>0.005?v-1:0),0);d.className="stat "+(sum>0.005?"pos":sum<-0.005?"neg":"");
      const bits=[["upgrades",r.up],["outage budget",r.out],["events",r.fx]].filter(([,v])=>Math.abs(v-1)>0.005).map(([k,v])=>k+" "+pct(v-1));
      d.innerHTML=`<span>${n}<small style="display:block;color:var(--muted);font-size:11.5px;font-weight:500">${bits.length?bits.join(" · "):"standard"}</small></span><b>${Math.abs(sum)<0.005?"–":pct(sum)}</b>`;tg.appendChild(d);});}
function updateShop(){
  $("u-cash").textContent=money(S.cash);
  UGROUPS.forEach(([g])=>{const us=UPS.filter(u=>u.g===g),own=us.reduce((a,u)=>a+LV(u.id),0),tot=us.reduce((a,u)=>a+u.lv.length,0),can=us.filter(u=>LV(u.id)<u.lv.length&&(S.free||S.cash>=u.lv[LV(u.id)])).length;
    const el=$("usum-"+g);if(el)el.innerHTML=`${own}/${tot} bought${can?` · <b>${can} affordable</b>`:""}`;});
  UPS.forEach(u=>{const l=LV(u.id),el=$("up-"+u.id),b=$("buy-"+u.id),max=l>=u.lv.length;
    el.classList.toggle("max",max);el.querySelectorAll(".pips i").forEach((p,k)=>p.classList.toggle("on",k<l));
    if(max){b.disabled=true;b.textContent="Maxed";}
    else{const c=u.lv[l];b.disabled=!S.free&&S.cash<c;b.textContent=S.free?"Add (free play)":S.cash<c?`Need ${money(c)}`:`Buy ${money(c)}`;}});
  const lg=$("ledger");lg.replaceChildren();
  // v3.3.3: how reliable each section is right now, against a mill with no upgrades and a standard outage budget
  updateRel();
  const h=document.createElement("h3");h.textContent="Books since start";lg.appendChild(h);
  let net=0;LEDGER.forEach(([k,lab,sg])=>{const v=S.ledger[k]*sg;net+=v;if((k==="premium"||k==="repairs"||k==="deals")&&!S.ledger[k])return;
    const d=document.createElement("div");d.className="stat "+(v>=0?"pos":"neg");d.innerHTML=`<span>${lab}</span><b>${money(v)}</b>`;lg.appendChild(d);});
  const n=document.createElement("div");n.className="stat net "+(net>=0?"pos":"neg");n.innerHTML=`<span>Net</span><b>${money(net)}</b>`;lg.appendChild(n);
  const m=document.createElement("div");m.className="stat";const t=S.shipT||0;
  m.innerHTML=`<span>Operating margin per ton shipped</span><b>${t>0?money(net/t+S.ledger.upgrades/t):"–"}</b>`;lg.appendChild(m);
}
// random upsets run at half the original rate. Seasons script the pressure: a quiet start-up (days 1-3), normal running,
// then a rough patch on days 15-16 at 4x the normal rate, then normal again to the end.
function upsetMul(){const base=0.5,d=Math.floor(S.t/1440)+1;let m=base;
  if(S.season&&S.season.on){if(d<=3)return 0;if(d===15||d===16)m=base*4;}
  if(d<=7)m*=0.75;   // v3.3.3: the first week is 25% calmer (seasons and free play)
  return m;}
function roughPatch(){running=false;$("overlay").hidden=false;$("overlay").style.zIndex="160";AUDIO.sfx("alarm",100);
  $("ov-h").textContent="Rough patch";$("ov-p").textContent="The Mill is going through a rough patch. Batten down the hatches.";
  $("ov-a").textContent="Batten down";$("ov-b").hidden=true;$("ov-a").focus();log("Day 15: the mill hits a rough patch. Upsets are four times as likely for two days.","bad");}
function showOverlay(kind){running=false;
  const ov=$("overlay");ov.hidden=false;
  AUDIO.sfx(kind==="bankrupt"?"lose":"win",100);
  if(kind==="bankrupt"){$("ov-h").textContent="Chapter 11";$("ov-p").textContent=`${NAME} ran out of money on ${hhmm(S.t)}. The mill has been sold to a private equity firm, which is already "exploring strategic options".`;
    $("ov-a").textContent="New game";$("ov-b").hidden=true;}
  else{$("ov-h").textContent="Mill of the Year";$("ov-p").textContent=`${NAME} reached $25M cash on ${hhmm(S.t)}, having made ${f0(S.tot.prodT)} t of paper and survived ${S.tot.incidents} disasters.`;
    $("ov-a").textContent="One more turn";$("ov-b").textContent="New game";$("ov-b").hidden=false;}
  $("ov-a").focus();}
$("ov-a").addEventListener("click",()=>{$("overlay").hidden=true;$("overlay").style.zIndex="";const dc=document.getElementById("dealOv");if(S.over){newGame();}else if(dc&&!dc.hidden&&!dc.classList.contains("dealres")){}else{running=true;}});
$("ov-b").addEventListener("click",()=>{$("overlay").hidden=true;newGame();});
function newGame(){const sp=C.simSpeed;initCtrl();C.simSpeed=sp;initState();BANNERS.length=0;running=true;seasonLocks(false);}
