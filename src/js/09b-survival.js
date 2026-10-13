/* ---------- v4.3 survival mode: start, wave changes, the wave chip, game over ----------
   Constants and the multipliers are in 03c-survival.js. A wave ends when its planned outage ends (endOutage, 06):
   the outage number moves on, survWaveStart() applies the new wave's costs, and the wave's report card pops (rcTick, 10).
   The run ends at bankruptcy (seasonTick, 10), on the season-over dialog with survival figures; the score is the time
   survived, and it goes to its own leaderboard (the Survival tab; the `survival` table, supabase/survival.sql). */
function startSurvival(leader){startSeason(true);if(leader)leadStart(leader);}   // (v4.4: with its mill leader; tools may start a run without one)
// in the outage budget dialog: what the wave after this outage brings
function survPlanNote(k){return `<p class="wavenext">When this outage ends, <b>wave ${k+1}</b> begins: upsets <b>${xf(survUp(k+1))}</b> <small>(now ${xf(survUp(k))})</small>, costs <b>${xf(survCost(k+1))}</b> <small>(now ${xf(survCost(k))})</small>.</p>`;}
// called by endOutage once the outage number has moved on: the new wave's costs take effect now
function survWaveStart(){const w=survWave();applyUpgrades();
  const t=`Wave ${w}: upsets ${xf(survUp(w))} · costs ${xf(survCost(w))}`;
  BANNERS.push({text:t,t:null,tag:"WAVE "+w});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Wave ${w-1} survived. ${t} (fibre, energy and chemicals, wages).`,"warn");
  const c=$("survChip");if(c){c.classList.remove("pulse");void c.offsetWidth;c.classList.add("pulse");}}
// the chip under the top bar: the wave and its multipliers, for the whole run
UI_TICKS.push(()=>{const c=$("survChip");if(!c)return;const on=survOn()&&!S.zen;if(c.hidden===on){c.hidden=!on;document.body.classList.toggle("surv",on);}if(!on)return;
  const w=survWave(),set=(id,v)=>{const e=$(id);if(e.textContent!==v)e.textContent=v;},left=Math.max(0,outStart(w)-S.t),d=Math.floor(left/1440),h=Math.floor(left%1440/60);
  set("svW","Wave "+w);set("svU",xf(survUp(w)));set("svC",xf(survCost(w)));
  set("svN",S.outg&&S.outg.on?"outage under way":left<60?"outage within the hour":`outage in ${d?d+"d ":""}${h}h`);});
// the season-over dialog serves both modes: which buttons it shows and what they say
// (a bankrupt survival run has no "one more turn": that button goes back to the menu instead, on a fresh mill)
function soMode(surv){$("so-more").textContent=surv?"Menu":"One more turn";$("so-new").textContent=surv?"New survival run":"New season";}
function survResult(){return {minutes:Math.floor(S.t),wave:survWave(),tons:Math.round(S.shipT||0),incidents:S.tot.incidents,mill:MILL.name.slice(0,40),version:APP_VER.slice(0,12),env:SITE.env};}
function endSurvival(){const se=S.season,r=survResult(),w=r.wave;se.done=true;se.on=false;se.result=r;running=false;
  if(document.body.classList.contains("fs"))setFS(false);seasonLocks(false);AUDIO.sfx("lose",100);
  let best=0;try{best=+localStorage.getItem(SURV.best)||0;}catch(e){}
  const pb=r.minutes>best;if(pb){try{localStorage.setItem(SURV.best,String(r.minutes));}catch(e){}}
  $("so-h").textContent="Survival over: bankrupt";
  $("so-p").textContent=`${MILL.name} ran out of money in wave ${w}, on day ${Math.floor(S.t/1440)+1}.`;
  const st=[["Time survived",survTime(r.minutes),"big"],["Wave reached",String(w)],["Your best",pb?(best?"New best (was "+survTime(best)+")":"New best"):survTime(best)],
    ["Upsets by the end",xf(survUp(w))],["Costs by the end",xf(survCost(w))],["Tons shipped",f0(r.tons)+" t"],["Upsets survived",String(r.incidents)]];
  if(S.lead)st.splice(3,0,["Mill leader",LEADERS[S.lead.id].name+(S.lead.was?" (after "+LEADERS[S.lead.was].name+")":""),"wide"]);
  $("so-stats").replaceChildren(...st.map(([k,v,c])=>{const d=document.createElement("div");if(c)d.className=c;const a=document.createElement("span");a.textContent=k;const b=document.createElement("b");b.textContent=v;d.append(a,b);return d;}));
  {const box=$("so-rc");if(box)box.hidden=true;}soMode(true);
  let nm="";try{nm=localStorage.getItem("paper-mill-player")||"";}catch(e){}$("so-name").value=nm;
  $("so-submit").disabled=false;$("so-submit").textContent=lbOn()?"Submit score":"Save score";setMsg("");$("seasonOv").hidden=false;$("so-name").focus();}
