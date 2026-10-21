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
  log(`Wave ${w-1} done. ${t} (fiber, energy and chemicals, wages).`,"warn");
  const c=$("survChip");if(c){c.classList.remove("pulse");void c.offsetWidth;c.classList.add("pulse");}}
// v5.2: the outage countdown under the clock, and survival's wave multipliers at the top of the expanded panel
UI_TICKS.push(()=>{const cd=$("v2cd"),wv=$("v2wave");if(!cd)return;const on=!!(S.season&&S.season.on)&&!S.zen,sv=on&&survOn();let t="",wt="";
  if(on){const k=survWave(),more=sv||(k<=4&&outStart(k)+OUT.len<=S.season.end),left=more?Math.max(0,outStart(k)-S.t):0,d=Math.floor(left/1440),h=Math.floor(left%1440/60);
    t=!more?"no more outages":S.outg&&S.outg.on?"outage under way":left<60?"outage within the hour":`outage in ${d?d+"d ":""}${h}h`;
    {const f=typeof prepFor==="function"&&prepFor();if(f){const pr=prepState(f.k),tl=prepTally(pr),nw=PREP.items.some(X=>prepUnlocked(X,f.left)&&!pr.it[X.k]);t+=` · prep ${tl.n}/4`;if(cd.classList.contains("prepnew")!==nw)cd.classList.toggle("prepnew",nw);}else if(cd.classList.contains("prepnew"))cd.classList.remove("prepnew");}   // v5.7 outage prep
    if(sv)wt=`Wave ${k} · upsets ${xf(survUp(k))} · costs ${xf(survCost(k))}`;}
  {const t0=t.replace(/ · prep \d\/4$/,""),ts=!t0?"":t0.startsWith("outage in ")?"⏱\uFE0E "+t0.slice(10):t0==="outage under way"?"⏱\uFE0E now":t0.startsWith("outage within the hour")?"⏱\uFE0E <1h":t0;   /* (v5.7: phones leave out the prep tally: a dot shows a new item) */if(cd.dataset.s!==ts)cd.dataset.s=ts;}   // (phones show the short form)
  if(cd.textContent!==t)cd.textContent=t;if(cd.hidden===!!t)cd.hidden=!t;if(wv.textContent!==wt)wv.textContent=wt;if(wv.hidden===!!wt)wv.hidden=!wt;});
// the chip under the top bar: the wave and its multipliers, for the whole run (v5.2: kept for the tools, hidden by styles.css)
// v5.1 (offline): a season with a leader shows the chip too, without the wave multipliers (class "season" hides them)
UI_TICKS.push(()=>{const c=$("survChip");if(!c)return;const sea=!survOn()&&leadOn(),on=(survOn()||sea)&&!S.zen;if(c.hidden===on){c.hidden=!on;document.body.classList.toggle("surv",on);}if(!on)return;
  if(c.classList.contains("season")!==sea)c.classList.toggle("season",sea);
  if(sea){const k=survWave(),set=(id,v)=>{const e=$(id);if(e.textContent!==v)e.textContent=v;},more=k<=4&&outStart(k)+OUT.len<=S.season.end,left=more?Math.max(0,outStart(k)-S.t):0,d=Math.floor(left/1440),h=Math.floor(left%1440/60);
    set("svW",more?`Outage ${k} of 4`:"Season");$("svW").dataset.s=more?`Outage ${k}/4`:"Season";   /* v5.1 QA2: "O1" read as "01" */set("svN",!more?`day ${Math.floor(S.t/1440)+1} of ${SEASON_DAYS}`:S.outg&&S.outg.on?"outage under way":left<60?"outage within the hour":`outage in ${d?d+"d ":""}${h}h`);return;}
  const w=survWave(),set=(id,v)=>{const e=$(id);if(e.textContent!==v)e.textContent=v;},left=Math.max(0,outStart(w)-S.t),d=Math.floor(left/1440),h=Math.floor(left%1440/60);
  set("svW","Wave "+w);set("svU",xf(survUp(w)));set("svC",xf(survCost(w)));
  set("svN",S.outg&&S.outg.on?"outage under way":left<60?"outage within the hour":`outage in ${d?d+"d ":""}${h}h`);
  // v5.0.4: short forms for phones (styles.css shows data-s under 420 px), so the countdown fits there too
  const sa=(id,v)=>{const e=$(id);if(e&&e.dataset.s!==v)e.dataset.s=v;};sa("svW","Wave "+w);
  sa("svN",S.outg&&S.outg.on?"⏱\uFE0E now":left<60?"⏱\uFE0E <1h":`⏱\uFE0E ${d?d+"d ":""}${h}h`);});
// the season-over dialog serves both modes: which buttons it shows and what they say
// (a bankrupt survival run has no "one more turn": that button goes back to the menu instead, on a fresh mill)
function soMode(surv){$("so-more").textContent=surv?"Menu":"One more turn";$("so-new").textContent=surv?"New survival run":"New season";}
function survResult(){return {minutes:Math.floor(S.t),wave:survWave(),tons:Math.round(S.shipT||0),incidents:S.tot.incidents,mill:MILL.name.slice(0,40),version:APP_VER.slice(0,12),env:SITE.env};}
function endSurvival(){civDrop();const se=S.season,r=survResult(),w=r.wave;se.done=true;se.on=false;se.result=r;running=false;if(G3.save&&G3.save.drop)G3.save.drop();   // v5.0.3: the run is over, so its save goes
  if(document.body.classList.contains("fs"))setFS(false);seasonLocks(false);AUDIO.sfx("lose",100);
  let best=0;try{best=+localStorage.getItem(SURV.best)||0;}catch(e){}
  const pb=r.minutes>best;if(pb){try{localStorage.setItem(SURV.best,String(r.minutes));}catch(e){}}
  $("so-h").textContent="Survival over: bankrupt";
  $("so-p").textContent=`${MILL.name} went under in wave ${w}, on day ${Math.floor(S.t/1440)+1}: cash fell past the ${money(ECON.bankrupt)} bankruptcy line. By then fiber, energy and wages cost ${xf(survCost(w))} what they did at the start, and upsets were ${xf(survUp(w))} as likely.`;   // v5.0.6: says why, and where the line is
  const st=[["Time survived",survTime(r.minutes),"big"],["Wave reached",String(w)],["Your best",pb?(best?"New best (was "+survTime(best)+")":"New best"):survTime(best)],
    ["Upsets by the end",xf(survUp(w))],["Costs by the end",xf(survCost(w))],["Tons shipped",f0(r.tons)+" t"],["Upsets survived",String(r.incidents)]];
  if(S.lead)st.splice(3,0,["Mill leader",LEADERS[S.lead.id].name+(S.lead.was?" (after "+LEADERS[S.lead.was].name+")":""),"wide"]);
  if(S.civ&&S.civ.m)st.push(["Civics",civSummary(S.civ.m),"wide"]);   // v5.1 QA2
  {const ts=tellEndStat();if(ts)st.push(ts);}{const rs=rlyEndStat();if(rs)st.push(rs);}   // v5.7 catching failures early
  if(S.lead&&S.lead.saved)st.splice(4,0,["Dot saved",money(S.lead.saved)+" in repairs ("+S.lead.fixed.length+" fixed)","wide"]);   // v5.0.5
  $("so-stats").replaceChildren(...st.map(([k,v,c])=>{const d=document.createElement("div");if(c)d.className=c;const a=document.createElement("span");a.textContent=k;const b=document.createElement("b");b.textContent=v;d.append(a,b);return d;}));
  {const box=$("so-rc");if(box)box.hidden=true;}soMode(true);
  let nm="";try{nm=localStorage.getItem("paper-mill-player")||"";}catch(e){}$("so-name").value=nm;soCount();
  $("so-submit").disabled=false;$("so-submit").textContent=lbOn()?"Submit score":"Save score";setMsg("");outNoteHide();$("seasonOv").hidden=false;   /* (v6.11.1 QA) */$("seasonOv").scrollTop=0;if(matchMedia("(hover:hover) and (pointer:fine)").matches)$("so-name").focus();else $("so-submit").focus({preventScroll:true});}
