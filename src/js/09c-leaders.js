/* ---------- v4.4 survival mode: mill leaders (roster, picker, card, outage pick, change, Dot's fix) ----------
   Numbers and effects are in 03d-leaders.js. The portraits are in 09c-leader-art.js (leadArt). */
const LEADERS={
  chip:{name:"Chip Kraftwell",title:"The dealmaker",role:"Businessman",say:"Everything's negotiable.",
    plus:()=>`Each outage, one deal: ${leadSv()?"lock the next wave's fiber at this wave's price":"hold the fiber market at this outage's price until the next one (never above the market)"}, or a sales push that stays (+$${LEAD.sales}/t on every grade).`,
    minus:()=>`Labor relations: every deal ends in a pay settlement (wages +${pct1(LEAD.wage)}% for good), and call-offs and dock brawls come ${LEAD.strife0}× as often while he's in charge.`},
  dot:{name:'Dot "Doc" Blade',title:"The millwright",role:"Mechanic",say:"If it turns, I can fix it.",
    plus:()=>`Repairs ${pct1(LEAD.rep)}% quicker. Once per outage cycle she may fix a big breakdown (${money(LEAD.autoMin)}+) on her own: ${LEAD.refund>=1?"the bill":pct1(LEAD.refund)+"% of the bill"} comes back and it's ${pct1(LEAD.fixCut)}% rarer from then on.`,
    minus:()=>`Gold-plates every job: repair bills cost ${pct1(LEAD.bills-1)}% more while she's in charge.`},
  fel:{name:"Felicity Fourdrinier",title:"The process engineer",role:"Engineer",say:"I have a spreadsheet for that.",
    plus:()=>`Each outage, one debottlenecking project that stays: +${pct1(LEAD.cap)}% capacity for the fiber line, the paper machine or finishing.`,
    minus:()=>`Project tie-ins: every outage overruns ${LEAD.overrun} minutes for each project done so far.`},
  hank:{name:"Hank Headbox",title:"The machine tender",role:"Operator",say:"She'll tell you what she wants.",
    plus:()=>`An old hand at threading: breaks and hayouts clear ${pct1(LEAD.thread)}% faster while he's in charge. Each outage, one gain that stays: runnability (sheet breaks and hayouts −${pct1(LEAD.clean)}%, and back up ${pct1(LEAD.rethread)}% faster) or dial in the dryers (steam −${pct1(LEAD.steam)}%).`,
    minus:()=>`Runs the sheet heavy: fiber +${pct1(LEAD.heavy)}% while he's in charge (basis-weight giveaway).`}};
function leadStart(id){if(!LEADERS[id])return;S.lead={id,st:{fibre:0,sales:0,rethread:0,clean:0,pstock:0,pwet:0,pdry:0},changed:false,was:null,fixW:0,fixed:[],lockW:0};applyUpgrades();
  if(S.civ&&S.t<1&&typeof civSetStart==="function")civSetStart();   // v5.1 civics: the leader's starting meters
  try{localStorage.setItem("paper-mill-leader",id);}catch(e){}
  BANNERS.push({text:`${LEADERS[id].name} runs the mill. "${LEADERS[id].say}"`,t:null,kind:"good",tag:"LEADER"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`${LEADERS[id].name}, ${LEADERS[id].title.toLowerCase()}, takes charge of the mill.`,"ok");}
// what the mill has kept so far, in words (the leader card and the outage dialog)
function leadTally(who){const L=S.lead,out=[];if(!L)return out;const W=who===false?null:(who||L.id);const n=k=>L.st[k]||0,pc=v=>(v>=0?"+":"−")+Math.abs(Math.round(v*1000)/10)+"%";
  if(L.lockW&&L.lockW===survWave()&&survWave()>1){if(survRun())out.push(["Fiber lock (this wave)",`fiber ${pc(leadLock()-1)}`]);
    else{const mk=S.plan?S.plan.mkt:0,held=Math.min(L.lockMkt||0,mk);out.push(["Fiber lock (until next outage)",`market held at ${held>=0?"+":"−"}$${Math.abs(held)}/t`+(held<mk?` (market ${mk>=0?"+":"−"}$${Math.abs(mk)})`:" (no saving now)"),held<mk?0:2]);}}
  if(n("sales"))out.push([`${n("sales")} sales push${n("sales")>1?"es":""}`,`+$${LEAD.sales*n("sales")}/t`]);
  if(leadDeals())out.push(["Pay settlements",`wages ${pc(leadWage()-1)}`,1]);
  [["pstock","fiber line"],["pwet","paper machine"],["pdry","finishing"]].forEach(([k,a])=>{if(n(k))out.push([`${n(k)} ${a} project${n(k)>1?"s":""}`,`capacity ${pc(leadCap(k)-1)}`]);});
  if(leadProjects())out.push(["Project tie-ins",`outages +${leadOverrun()} min`,1]);
  if(n("rethread"))out.push([`${n("rethread")} runnability gain${n("rethread")>1?"s":""}`,`breaks ${pc(leadClean()-1)} · rethreads ${pc(1/leadRethread()-1)}`]);
  if(n("clean"))out.push([`${n("clean")} dryer tuning${n("clean")>1?"s":""}`,`steam ${pc(leadEnergy()-1)}`]);
  // v5.1 QA2: what the leader in charge costs or gives (W), not kept: the outage dialog shows the incoming leader's, the card lists them apart
  if(W==="hank")out.push(["Fiber (runs heavy)",pc(LEAD.heavy),1,1]);
  if(W==="dot")out.push(["Repairs",`${pct1(LEAD.rep)}% quicker`,0,1]);
  if(W==="dot")out.push(["Repair bills",pc(LEAD.bills-1),1,1]);
  if(W==="chip")out.push(["Labor relations",`call-offs and brawls ${xf(LEAD.strife0)}`,1,1]);
  if(L.fixed&&L.fixed.length){const c={};L.fixed.forEach(x=>c[x]=(c[x]||0)+1);
    out.push([`Fixed ×${L.fixed.length}`,Object.entries(c).map(([x,k])=>`${EV[x]?EV[x].name:x} ${pc(Math.pow(1-LEAD.fixCut,k)-1)}`).join(", ")]);}
  return out;}
const leadTallyRows=t=>t.length?`<div class="ldtally">${t.map(([a,b,bad])=>`<div${bad===1?' class="bad"':bad===2?' class="flat"':""}><span>${a}</span><b>${b}</b></div>`).join("")}</div>`:"";
const leadTallyHTML=who=>leadTallyRows(leadTally(who));

/* ---- the picker: after the site, before the run starts (menu, pause menu, game over) ---- */
let leadPickEl=null;
// v5.2 QA: one line each for the compact phone picker (the full text shows on the picked card)
const LEAD_PICK={chip:["Fiber deals or a price push","Pay settlements, more strife"],dot:["Faster repairs, fixes big breakdowns","Repair bills cost more"],
  fel:["A capacity project each outage","Outages run longer"],hank:["Fewer sheet breaks or cheaper steam","Runs heavy: more fiber"]};
function leadCardHTML(id,tag="button",extra=""){const L=LEADERS[id],sh=LEAD_PICK[id];
  return `<${tag} class="ldcard" data-l="${id}"${tag==="button"?' type="button" role="radio" aria-checked="false"':""}>${leadArt(id)}<span class="ldbody"><small>${L.role}</small><b>${escHTML(L.name)}</b><em>${L.title}</em>${tag==="button"&&sh?`<span class="ldshort"><span class="pro">${sh[0]}</span><span class="con">${sh[1]}</span></span>`:""}
    <span class="pro">${L.plus()}</span><span class="con">${L.minus()}</span>${tag==="button"&&typeof CIV!=="undefined"&&CIV.lead[id]?`<span class="ldstart">Starts: ${CIVK.map(k=>CIV.names[k]+" "+Math.max(CIV.startMin,CIV.lead[id][k]+((CIV.site[SITE.env]||{})[k]||0))).join(" · ")}</span>`:""}<i>“${L.say}”</i>${extra}</span></${tag}>`;}
function leadPickOpen(done,wait,mode){const sv=mode!=="season";leadMode=sv?"surv":"season";let sel=null;try{const v=localStorage.getItem("paper-mill-leader");if(LEADERS[v])sel=v;}catch(e){}
  if(!leadPickEl){leadPickEl=document.createElement("div");leadPickEl.className="overlay top";leadPickEl.id="leadOv";leadPickEl.hidden=true;document.body.appendChild(leadPickEl);}
  const el=leadPickEl,back=document.activeElement;
  el.innerHTML=`<div class="modal ldpick" role="dialog" aria-modal="true" aria-labelledby="ld-h"><span class="dk">${sv?"Survival":"Season"} · ${escHTML((ENVX()&&ENVX().name)||"your site")}</span><h2 id="ld-h">Choose your mill leader</h2>
    <p class="muted small">Each one is strong on one side of the mill and costs you on another. What they build stays with the mill. You can change leader once per ${sv?"run":"season"}, at an outage.</p>
    <div class="ldgrid" role="radiogroup" aria-label="Mill leader">${LEAD_IDS.map(id=>leadCardHTML(id)).join("")}</div>
    <div class="btns"><button class="primary" id="ld-go" disabled>Start the run</button><button id="ld-no">Back</button></div></div>`;
  const paint=()=>{el.querySelectorAll(".ldcard").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.l===sel)));const g=el.querySelector("#ld-go");g.disabled=!sel;g.textContent=sel?`Start ${sv?"the run":"the season"} with ${LEADERS[sel].name.split(" ")[0]}`:"Pick a leader to start";};
  const close=()=>{el.hidden=true;leadMode=null;document.removeEventListener("keydown",key,true);if(back&&back.focus)back.focus();};
  const key=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}};
  el.querySelectorAll(".ldcard").forEach(b=>b.addEventListener("click",()=>{sel=b.dataset.l;paint();more();if(innerWidth<=640)requestAnimationFrame(()=>b.scrollIntoView({block:"nearest",behavior:"smooth"}));}));
  const md=el.querySelector(".modal"),more=()=>md.classList.toggle("more",md.scrollHeight-md.scrollTop-md.clientHeight>24);md.addEventListener("scroll",more,{passive:true});
  el.querySelector("#ld-no").addEventListener("click",close);
  el.querySelector("#ld-go").addEventListener("click",()=>{if(!sel)return;const g=el.querySelector("#ld-go"),w=wait&&wait();
    if(w&&w.then){g.disabled=true;g.setAttribute("aria-busy","true");g.textContent="Getting the mill ready…";w.then(()=>{close();done(sel);});}else{close();done(sel);}});
  document.addEventListener("keydown",key,true);paint();el.hidden=false;el.querySelector(".modal").scrollTop=0;more();{const s=el.querySelector('.ldcard[aria-checked="true"]'),m=el.querySelector(".modal");if(s)s.focus();else{m.tabIndex=-1;m.focus({preventScroll:true});}}}   // (v5.1 QA: no card looks picked before a pick)

/* ---- the outage budget dialog: the leader's pick, and the one change of leader ---- */
const LEAD_SHORT={chip:"Fiber lock or a sales push; wages rise",dot:"Faster repairs, fixes one breakdown a cycle",fel:"+capacity each outage; outages run longer",hank:"Fewer breaks or cheaper steam; fiber +2%"};
function leadPlanNew(){if(!leadOn())return null;const p=LEAD_PICKS[S.lead.id];return {to:null,pick:p.length?(p.some(x=>x[0]===S.lead.last)?S.lead.last:p[0][0]):null};}
// v5.0.6: the outage dialog's leader row uses the name without the nickname ("Dot Blade"), so it fits beside the button
const leadShort=id=>LEADERS[id].name.replace(/\s*"[^"]*"/,"");
function leadPlanMount(host,lp){if(!host)return;
  const draw=()=>{const cur=S.lead.id,id=lp.to||cur,L=LEADERS[id],picks=LEAD_PICKS[id],first=L.name.split(" ")[0];
    if(!picks.some(x=>x[0]===lp.pick))lp.pick=picks.length?picks[0][0]:null;
    const choose=lp.choosing?`<div class="ldswap" role="radiogroup" aria-label="New mill leader">${LEAD_IDS.filter(x=>x!==cur).map(x=>`<button type="button" role="radio" aria-checked="${lp.to===x}" data-to="${x}">${leadArt(x,true)}<span><b>${escHTML(leadShort(x))}</b><small>${LEADERS[x].role}</small><small class="ldperk">${LEAD_SHORT[x]}</small></span></button>`).join("")}
        <p class="ldnote">${lp.to?`${escHTML(LEADERS[lp.to].name)} takes over when the outage starts. Everything ${LEADERS[cur].name.split(" ")[0]} built stays with the mill. This is the ${survRun()?"run":"season"}'s one change of leader.`:`Pick who takes over. Everything ${LEADERS[cur].name.split(" ")[0]} built stays with the mill. You can do this once per ${survRun()?"run":"season"}.`}</p>
        <div class="pro">${lp.to?LEADERS[lp.to].plus():""}</div><div class="con">${lp.to?LEADERS[lp.to].minus():""}</div></div>`:"";
    host.innerHTML=`<div class="ldrow"><div class="ldwho">${leadArt(id,true)}<div><b>${escHTML(leadShort(id))}</b><small>${lp.to?"takes over at this outage":L.title}</small></div>
        ${S.lead.changed?"":`<button type="button" class="ghost" id="out-lchg">${lp.choosing?(lp.to?"Keep "+LEADERS[cur].name.split(" ")[0]:"Cancel"):"Change leader"}</button>`}</div>${choose}
      ${picks.length?`<div class="ldq">${first}'s pick for the next cycle${id==="chip"?` <span>· each deal: wages +${pct1(LEAD.wage)}% for good</span>`:id==="fel"?` <span>· each project: outages +${LEAD.overrun} min</span>`:""}</div><div class="seg ldseg" id="out-lpick">${picks.map(([k,lab,what])=>`<button type="button" data-p="${k}" aria-pressed="${lp.pick===k}"><b>${lab}</b><small>${what()}</small></button>`).join("")}</div>`
        :`<div class="ldq">${id==="dot"?"Dot makes no pick: her fix is ready again when the outage ends.":""}</div>`}
      ${leadTallyHTML(lp.to||null)}</div>`;
    host.querySelectorAll("#out-lpick button").forEach(b=>b.addEventListener("click",()=>{lp.pick=b.dataset.p;draw();}));
    const c=host.querySelector("#out-lchg");if(c)c.addEventListener("click",()=>{if(lp.choosing){lp.choosing=false;lp.to=null;}else lp.choosing=true;draw();});
    host.querySelectorAll(".ldswap button").forEach(b=>b.addEventListener("click",()=>{lp.to=b.dataset.to;draw();}));};
  draw();}
function leadChange(to){const L=S.lead;if(!L||L.changed||!LEADERS[to]||to===L.id)return;const old=L.id;L.was=old;L.id=to;L.changed=true;applyUpgrades();
  BANNERS.push({text:`${LEADERS[to].name} takes over from ${LEADERS[old].name}. "${LEADERS[to].say}"`,t:null,kind:"good",tag:"LEADER"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`${LEADERS[to].name} takes over from ${LEADERS[old].name}. What was built stays with the mill.`,"warn");}
// called by endOutage: this outage's pick becomes part of the mill (a tool or an old save may bring no pick: the first one)
function leadOutageEnd(pl){const L=S.lead,picks=LEAD_PICKS[L.id];if(!picks.length)return;const k=pl&&picks.some(x=>x[0]===pl.pick)?pl.pick:picks[0][0],p=picks.find(x=>x[0]===k);
  L.st[k]=(L.st[k]||0)+1;if(k==="fibre"&&L.id==="chip"){L.lockW=S.outg.k+1;L.lockMkt=S.plan?S.plan.mkt:0;}/* (the lock is for the wave this outage starts) */L.last=k;log(`${LEADERS[L.id].name}: ${p[1].toLowerCase()} (${p[2]()}).`,"ok");}

/* ---- Dot's fix ---- */
const leadFixable=id=>MNEED(id)||QINC(id);
const leadFixReady=()=>leadIs("dot")&&leadOn()&&S.lead.fixW!==survWave();
// v5.0.4: Dot fixes on her own. A fixable breakdown that starts while her fix is ready has an LEAD.autoFix chance of being fixed
// on the spot (its own dice stream, "lead", so no other luck changes); then the fix is used until the outage ends.
function leadAuto(inc){if(!inc||S.zen||!leadFixReady()||!leadFixable(inc.id))return;if(S.rng.lead==null)S.rng.lead=(S.seed^0x2c1b3c6d)|0;   // (a save from before v5.0.4)
  if((inc.bill||0)<LEAD.autoMin)return;   // v5.0.5: not on cheap ones (no dice drawn, so nothing else changes)
  if(rand("lead")<LEAD.autoFix&&leadFix(inc.id)){for(let i=BANNERS.length-1;i>=0;i--)if(BANNERS[i].id===inc.id)BANNERS.splice(i,1);}}   // v5.0.5: her FIXED banner replaces the breakdown's own
function leadFix(id){if(!leadFixReady()||!active(id)||!leadFixable(id))return false;const inc=S.inc.find(i=>i.id===id),back=Math.round(((inc&&inc.bill)||0)*LEAD.refund);
  clearIncident(id);if(back>0){spend(-back,"repairs");inc.bill-=back;S.lead.saved=(S.lead.saved||0)+back;}S.lead.fixW=survWave();(S.lead.fixed||(S.lead.fixed=[])).push(id);AUDIO.sfx("clunk",200);
  const ext=EV[id].g==="god"||id==="roof";   // (v5.0.5: weather and the roof are made safer, not "fixed at the root")
  BANNERS.push({text:`${ext?"Dot repaired it and made it safer":"Dot fixed it at the root"}: ${EV[id].name.toLowerCase()}.${back>0?" "+money(back)+" back.":""}`,t:null,kind:"good",tag:"FIXED"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Dot's fix: she ended "${EV[id].name}" on the spot${back>0?" and "+money(back)+" of the repair bill came back":""}. ${ext?"Made safer":"Fixed at the root"}: it's half as likely from now on.`,"ok");return true;}

/* ---- the leader card (tap the wave chip) ---- */
let leadCardEl=null;
function leadCardOpen(){if(!S.lead)return;const was=running;running=false;
  if(!leadCardEl){leadCardEl=document.createElement("div");leadCardEl.className="overlay";leadCardEl.id="leadCard";leadCardEl.hidden=true;document.body.appendChild(leadCardEl);}
  const el=leadCardEl,id=S.lead.id,L=LEADERS[id];
  const close=()=>{el.hidden=true;document.removeEventListener("keydown",key,true);if(was&&!(S.cards&&S.cards.open)&&!S.over&&leadOn())running=true;};
  const key=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}};
  const draw=()=>{const ready=leadFixReady();
    const fix=id!=="dot"?"":`<div class="ldfix"><h3>Dot's fix <small>${ready?"ready":"used this cycle · back when the outage ends"}</small></h3>
        <p class="muted small">${ready?`She has a ${pct1(LEAD.autoFix)}% chance to fix each breakdown with a bill of ${money(LEAD.autoMin)} or more as it starts.`:"She fixed one this cycle."}${(S.lead.fixed||[]).length?` Fixed so far: ${S.lead.fixed.length}${S.lead.saved?`, saving ${money(S.lead.saved)}`:""}.`:""}</p></div>`;
    el.innerHTML=`<div class="modal ldone" role="dialog" aria-modal="true" aria-labelledby="ldc-h"><span class="dk">Mill leader · sim paused</span>
      ${leadCardHTML(id,"div")}${fix}
      ${(()=>{const all=leadTally(),kept=all.filter(x=>!x[3]),now=all.filter(x=>x[3]);return (now.length?`<h3>While ${L.name.split(" ")[0]} is in charge</h3>${leadTallyRows(now)}`:"")+(kept.length?`<h3 id="ldc-h">What the mill has kept</h3>${leadTallyRows(kept)}`:`<h3 id="ldc-h">Nothing built yet</h3><p class="muted small">${LEAD_PICKS[id].length?L.name.split(" ")[0]+" makes the first pick at the next outage.":"Dot makes no picks. She fixes one breakdown on her own once every outage cycle."}</p>`);})()}
      <p class="muted small">${S.lead.changed?`You changed leader once already (${escHTML(LEADERS[S.lead.was].name)} left). ${L.name.split(" ")[0]} stays to the end.`:`You can change leader once per ${survRun()?"run":"season"}, in an outage budget dialog. What was built stays with the mill.`}</p>
      <div class="btns"><button class="primary" id="ldc-ok" style="flex:1">Back to the mill</button></div></div>`;
    el.querySelector("#ldc-ok").addEventListener("click",close);
};
  document.addEventListener("keydown",key,true);draw();el.hidden=false;el.querySelector("#ldc-ok").focus();}
// the chip: the leader's face, and Dot's fix when a breakdown is waiting for it
UI_TICKS.push(()=>{const f=$("svL");if(!f)return;const id=leadOn()?S.lead.id:"";if(f.dataset.l!==id){f.dataset.l=id;f.innerHTML=id?leadArt(id,true):"";f.hidden=!id;const fb=$("svFold");if(fb)fb.hidden=!id;if(!id)$("survChip").classList.remove("fold");}
  const x=$("svF");if(x){const show=id==="dot",ready=show&&leadFixReady(),t=ready?"Fix ready":"Fix used";
    if(x.hidden===show)x.hidden=!show;if(show){if(x.textContent!==t)x.textContent=t;x.dataset.s=ready?"Fix ready":"Fix used";x.classList.toggle("used",!ready);}}});
// v5.2: the leader's face sits in the main bar (the old chip under the bar is retired); tapping it opens their card.
// Dot's fix shows as a dot on the face: green when ready.
{const b=$("v2lead"),f=$("v2leadF"),x=$("v2leadX");
  if(b){b.addEventListener("click",()=>{if(leadOn()&&!(S.cards&&S.cards.open))leadCardOpen();});
    UI_TICKS.push(()=>{const id=leadOn()&&!S.zen?S.lead.id:"";if(b.dataset.l!==id){b.dataset.l=id;f.innerHTML=id?leadArt(id,true):"";b.hidden=!id;document.body.classList.toggle("lead",!!id);
        if(id){const L=LEADERS[id];b.title=`${L.name}, ${L.title}. Tap for their card.`;b.setAttribute("aria-label",b.title);}}
      const show=id==="dot",ready=show&&leadFixReady();if(x.hidden===show)x.hidden=!show;if(show&&x.classList.contains("used")===ready){x.classList.toggle("used",!ready);x.title=ready?"Fix ready":"Fix used";}});}}
// v4.4.0-t3: the wave bar slides away to the left (the arrow at its end), leaving the leader's face; tapping the face brings it back
{const c=$("survChip"),fb=$("svFold");let fold=false;
  // v5.1 QA2: a season's chip counts outages, so its screen-reader label says so
  const chipLabel=()=>{if(!c)return;const w=survRun()?"wave bar":"outage bar",t=fold?`Show the ${w}`:`${w[0].toUpperCase()+w.slice(1)}: open your mill leader's card`;if(c.getAttribute("aria-label")!==t)c.setAttribute("aria-label",t);};UI_TICKS.push(chipLabel);try{fold=localStorage.getItem("paper-mill-chip-fold")==="1";}catch(e){}
  const setFold=v=>{fold=v;c.classList.toggle("fold",v);c.setAttribute("aria-expanded",String(!v));chipLabel();try{localStorage.setItem("paper-mill-chip-fold",v?"1":"0");}catch(e){}};
  if(c){setFold(fold);
    c.addEventListener("click",e=>{if(fb&&fb.contains(e.target)){e.stopPropagation();setFold(true);return;}
      if(fold&&S.lead){setFold(false);return;}
      if(leadOn()&&!(S.cards&&S.cards.open))leadCardOpen();});
    c.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target===c){e.preventDefault();c.click();}});}}
// v5.1 QA2: the season fiber lock starting or ending re-prices fiber at once (it used to wait for the next purchase or deal)
{let was=null;UI_TICKS.push(()=>{if(!S||!S.lead||survRun())return;const on=!!(S.lead.lockW&&S.lead.lockW===survWave());if(was!==null&&on!==was)applyUpgrades();was=on;});}
