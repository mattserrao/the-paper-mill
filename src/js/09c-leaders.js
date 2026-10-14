/* ---------- v4.4 survival mode: mill leaders (roster, picker, card, outage pick, change, Dot's fix) ----------
   Numbers and effects are in 03d-leaders.js. The portraits are in 09c-leader-art.js (leadArt). */
const LEADERS={
  chip:{name:"Chip Kraftwell",title:"The dealmaker",role:"Business man",say:"Everything's negotiable.",
    plus:()=>`Each outage, one deal: lock the next wave's fibre at this wave's price, or a sales push that stays (+$${LEAD.sales}/t on every grade).`,
    minus:()=>`Labour relations: every deal ends in a pay settlement (wages +${pct1(LEAD.wage)}% for good), and call-offs and dock brawls come ${LEAD.strife0}× as often while he's in charge.`},
  dot:{name:'Dot "Doc" Blade',title:"The millwright",role:"Mechanic",say:"If it turns, I can fix it.",
    plus:()=>`Repairs ${pct1(LEAD.rep)}% quicker. Once per outage cycle she fixes a breakdown on her own (${pct1(LEAD.autoFix)}% chance as each one starts): it ends on the spot, ${LEAD.refund>=1?"its repair bill":pct1(LEAD.refund)+"% of its repair bill"} comes back, and it's fixed at the root (${pct1(LEAD.fixCut)}% rarer from then on).`,
    minus:()=>`Gold-plates every job: repair bills cost ${pct1(LEAD.bills-1)}% more while she's in charge.`},
  fel:{name:"Felicity Fourdrinier",title:"The process engineer",role:"Engineer",say:"I have a spreadsheet for that.",
    plus:()=>`Each outage, one debottlenecking project that stays: +${pct1(LEAD.cap)}% capacity for the fibre line, the paper machine or finishing.`,
    minus:()=>`Project tie-ins: every outage overruns ${LEAD.overrun} minutes for each project done so far.`},
  hank:{name:"Hank Headbox",title:"The machine tender",role:"Operator",say:"She'll tell you what she wants.",
    plus:()=>`Each outage, one gain that stays: runnability (sheet breaks and hayouts −${pct1(LEAD.clean)}%, and back up ${pct1(LEAD.rethread)}% faster) or dial in the dryers (steam −${pct1(LEAD.steam)}%).`,
    minus:()=>`Runs the sheet heavy: fibre +${pct1(LEAD.heavy)}% while he's in charge (basis-weight giveaway).`}};
function leadStart(id){if(!LEADERS[id])return;S.lead={id,st:{fibre:0,sales:0,rethread:0,clean:0,pstock:0,pwet:0,pdry:0},changed:false,was:null,fixW:0,fixed:[],lockW:0};applyUpgrades();
  try{localStorage.setItem("paper-mill-leader",id);}catch(e){}
  BANNERS.push({text:`${LEADERS[id].name} runs the mill. "${LEADERS[id].say}"`,t:null,kind:"good",tag:"LEADER"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`${LEADERS[id].name}, ${LEADERS[id].title.toLowerCase()}, takes charge of the mill.`,"ok");}
// what the mill has kept so far, in words (the leader card and the outage dialog)
function leadTally(){const L=S.lead,out=[];if(!L)return out;const n=k=>L.st[k]||0,pc=v=>(v>=0?"+":"−")+Math.abs(Math.round(v*1000)/10)+"%";
  if(L.lockW&&L.lockW===survWave()&&survWave()>1)out.push(["Fibre lock (this wave)",`fibre ${pc(leadLock()-1)}`]);
  if(n("sales"))out.push([`${n("sales")} sales push${n("sales")>1?"es":""}`,`+$${LEAD.sales*n("sales")}/t`]);
  if(leadDeals())out.push(["Pay settlements",`wages ${pc(leadWage()-1)}`,1]);
  [["pstock","fibre line"],["pwet","paper machine"],["pdry","finishing"]].forEach(([k,a])=>{if(n(k))out.push([`${n(k)} ${a} project${n(k)>1?"s":""}`,`capacity ${pc(leadCap(k)-1)}`]);});
  if(leadProjects())out.push(["Project tie-ins",`outages +${leadOverrun()} min`,1]);
  if(n("rethread"))out.push([`${n("rethread")} runnability gain${n("rethread")>1?"s":""}`,`breaks ${pc(leadClean()-1)} · rethreads ${pc(1/leadRethread()-1)}`]);
  if(n("clean"))out.push([`${n("clean")} dryer tuning${n("clean")>1?"s":""}`,`steam ${pc(leadEnergy()-1)}`]);
  if(leadIs("hank"))out.push(["Fibre (runs heavy)",pc(LEAD.heavy),1]);
  if(leadIs("dot"))out.push(["Repairs",`${pct1(LEAD.rep)}% quicker`]);
  if(leadIs("dot"))out.push(["Repair bills",pc(LEAD.bills-1),1]);
  if(leadIs("chip"))out.push(["Labour relations",`call-offs and brawls ${xf(leadStrife())}`,1]);
  if(L.fixed&&L.fixed.length){const c={};L.fixed.forEach(x=>c[x]=(c[x]||0)+1);
    out.push([`Fixed at the root (${L.fixed.length})`,Object.entries(c).map(([x,k])=>`${EV[x]?EV[x].name:x} ${pc(Math.pow(1-LEAD.fixCut,k)-1)}`).join(", ")]);}
  return out;}
const leadTallyHTML=()=>{const t=leadTally();return t.length?`<div class="ldtally">${t.map(([a,b,bad])=>`<div${bad?' class="bad"':""}><span>${a}</span><b>${b}</b></div>`).join("")}</div>`:"";};

/* ---- the picker: after the site, before the run starts (menu, pause menu, game over) ---- */
let leadPickEl=null;
function leadCardHTML(id,tag="button",extra=""){const L=LEADERS[id];
  return `<${tag} class="ldcard" data-l="${id}"${tag==="button"?' type="button" role="radio" aria-checked="false"':""}>${leadArt(id)}<span class="ldbody"><small>${L.role}</small><b>${escHTML(L.name)}</b><em>${L.title}</em>
    <span class="pro">${L.plus()}</span><span class="con">${L.minus()}</span><i>“${L.say}”</i>${extra}</span></${tag}>`;}
function leadPickOpen(done,wait){let sel=null;try{const v=localStorage.getItem("paper-mill-leader");if(LEADERS[v])sel=v;}catch(e){}
  if(!leadPickEl){leadPickEl=document.createElement("div");leadPickEl.className="overlay top";leadPickEl.id="leadOv";leadPickEl.hidden=true;document.body.appendChild(leadPickEl);}
  const el=leadPickEl,back=document.activeElement;
  el.innerHTML=`<div class="modal ldpick" role="dialog" aria-modal="true" aria-labelledby="ld-h"><span class="dk">Survival · ${escHTML((ENVX()&&ENVX().name)||"your site")}</span><h2 id="ld-h">Choose your mill leader</h2>
    <p class="muted small">Each one is strong on one side of the mill and costs you on another. What they build stays with the mill. You can change leader once per run, at an outage.</p>
    <div class="ldgrid" role="radiogroup" aria-label="Mill leader">${LEAD_IDS.map(id=>leadCardHTML(id)).join("")}</div>
    <div class="btns"><button class="primary" id="ld-go" disabled>Start the run</button><button id="ld-no">Back</button></div></div>`;
  const paint=()=>{el.querySelectorAll(".ldcard").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.l===sel)));const g=el.querySelector("#ld-go");g.disabled=!sel;g.textContent=sel?`Start with ${LEADERS[sel].name.split(" ")[0]}`:"Start the run";};
  const close=()=>{el.hidden=true;document.removeEventListener("keydown",key,true);if(back&&back.focus)back.focus();};
  const key=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}};
  el.querySelectorAll(".ldcard").forEach(b=>b.addEventListener("click",()=>{sel=b.dataset.l;paint();}));
  el.querySelector("#ld-no").addEventListener("click",close);
  el.querySelector("#ld-go").addEventListener("click",()=>{if(!sel)return;const g=el.querySelector("#ld-go"),w=wait&&wait();
    if(w&&w.then){g.disabled=true;g.setAttribute("aria-busy","true");g.textContent="Getting the mill ready…";w.then(()=>{close();done(sel);});}else{close();done(sel);}});
  document.addEventListener("keydown",key,true);paint();el.hidden=false;el.querySelector(".modal").scrollTop=0;(el.querySelector('.ldcard[aria-checked="true"]')||el.querySelector(".ldcard")).focus();}

/* ---- the outage budget dialog: the leader's pick, and the one change of leader ---- */
function leadPlanNew(){if(!S.lead||!survOn())return null;const p=LEAD_PICKS[S.lead.id];return {to:null,pick:p.length?(p.some(x=>x[0]===S.lead.last)?S.lead.last:p[0][0]):null};}
function leadPlanMount(host,lp){if(!host)return;
  const draw=()=>{const cur=S.lead.id,id=lp.to||cur,L=LEADERS[id],picks=LEAD_PICKS[id],first=L.name.split(" ")[0];
    if(!picks.some(x=>x[0]===lp.pick))lp.pick=picks.length?picks[0][0]:null;
    const choose=lp.choosing?`<div class="ldswap" role="radiogroup" aria-label="New mill leader">${LEAD_IDS.filter(x=>x!==cur).map(x=>`<button type="button" role="radio" aria-checked="${lp.to===x}" data-to="${x}">${leadArt(x,true)}<span><b>${escHTML(LEADERS[x].name)}</b><small>${LEADERS[x].role}</small></span></button>`).join("")}
        <p class="ldnote">${lp.to?`${escHTML(LEADERS[lp.to].name)} takes over when the outage starts. Everything ${LEADERS[cur].name.split(" ")[0]} built stays with the mill. This is the run's one change of leader.`:`Pick who takes over. Everything ${LEADERS[cur].name.split(" ")[0]} built stays with the mill. You can do this once per run.`}</p>
        <div class="pro">${lp.to?LEADERS[lp.to].plus():""}</div><div class="con">${lp.to?LEADERS[lp.to].minus():""}</div></div>`:"";
    host.innerHTML=`<div class="ldrow"><div class="ldwho">${leadArt(id,true)}<div><b>${escHTML(L.name)}</b><small>${lp.to?"takes over at this outage":L.title}</small></div>
        ${S.lead.changed?"":`<button type="button" class="ghost" id="out-lchg">${lp.choosing?(lp.to?"Keep "+LEADERS[cur].name.split(" ")[0]:"Cancel"):"Change leader"}</button>`}</div>${choose}
      ${picks.length?`<div class="ldq">${first}'s pick for the next cycle${id==="chip"?` <span>· each deal: wages +${pct1(LEAD.wage)}% for good</span>`:id==="fel"?` <span>· each project: outages +${LEAD.overrun} min</span>`:""}</div><div class="seg ldseg" id="out-lpick">${picks.map(([k,lab,what])=>`<button type="button" data-p="${k}" aria-pressed="${lp.pick===k}"><b>${lab}</b><small>${what()}</small></button>`).join("")}</div>`
        :`<div class="ldq">${id==="dot"?"Dot makes no pick: her fix is ready again when the outage ends.":""}</div>`}
      ${leadTallyHTML()}</div>`;
    host.querySelectorAll("#out-lpick button").forEach(b=>b.addEventListener("click",()=>{lp.pick=b.dataset.p;draw();}));
    const c=host.querySelector("#out-lchg");if(c)c.addEventListener("click",()=>{if(lp.choosing){lp.choosing=false;lp.to=null;}else lp.choosing=true;draw();});
    host.querySelectorAll(".ldswap button").forEach(b=>b.addEventListener("click",()=>{lp.to=b.dataset.to;draw();}));};
  draw();}
function leadChange(to){const L=S.lead;if(!L||L.changed||!LEADERS[to]||to===L.id)return;const old=L.id;L.was=old;L.id=to;L.changed=true;applyUpgrades();
  BANNERS.push({text:`${LEADERS[to].name} takes over from ${LEADERS[old].name}. "${LEADERS[to].say}"`,t:null,kind:"good",tag:"LEADER"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`${LEADERS[to].name} takes over from ${LEADERS[old].name}. What was built stays with the mill.`,"warn");}
// called by endOutage: this outage's pick becomes part of the mill (a tool or an old save may bring no pick: the first one)
function leadOutageEnd(pl){const L=S.lead,picks=LEAD_PICKS[L.id];if(!picks.length)return;const k=pl&&picks.some(x=>x[0]===pl.pick)?pl.pick:picks[0][0],p=picks.find(x=>x[0]===k);
  L.st[k]=(L.st[k]||0)+1;if(k==="fibre"&&L.id==="chip")L.lockW=S.outg.k+1;/* (the lock is for the wave this outage starts) */L.last=k;log(`${LEADERS[L.id].name}: ${p[1].toLowerCase()} (${p[2]()}).`,"ok");}

/* ---- Dot's fix ---- */
const leadFixable=id=>MNEED(id)||QINC(id);
const leadFixReady=()=>leadIs("dot")&&survOn()&&S.lead.fixW!==survWave();
// v5.0.4: Dot fixes on her own. A fixable breakdown that starts while her fix is ready has an LEAD.autoFix chance of being fixed
// on the spot (its own dice stream, "lead", so no other luck changes); then the fix is used until the outage ends.
function leadAuto(inc){if(!inc||S.zen||!leadFixReady()||!leadFixable(inc.id))return;if(S.rng.lead==null)S.rng.lead=(S.seed^0x2c1b3c6d)|0;   // (a save from before v5.0.4)
  if(rand("lead")<LEAD.autoFix)leadFix(inc.id);}
function leadFix(id){if(!leadFixReady()||!active(id)||!leadFixable(id))return false;const inc=S.inc.find(i=>i.id===id),back=Math.round(((inc&&inc.bill)||0)*LEAD.refund);
  clearIncident(id);if(back>0){spend(-back,"repairs");inc.bill-=back;}S.lead.fixW=survWave();(S.lead.fixed||(S.lead.fixed=[])).push(id);AUDIO.sfx("clunk",200);
  BANNERS.push({text:`Dot fixed it at the root: ${EV[id].name.toLowerCase()}.${back>0?" "+money(back)+" back.":""}`,t:null,kind:"good",tag:"FIXED"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Dot's fix: she ended "${EV[id].name}" on the spot${back>0?" and "+money(back)+" of the repair bill came back":""}. Fixed at the root: it's half as likely from now on.`,"ok");return true;}

/* ---- the leader card (tap the wave chip) ---- */
let leadCardEl=null;
function leadCardOpen(){if(!S.lead)return;const was=running;running=false;
  if(!leadCardEl){leadCardEl=document.createElement("div");leadCardEl.className="overlay";leadCardEl.id="leadCard";leadCardEl.hidden=true;document.body.appendChild(leadCardEl);}
  const el=leadCardEl,id=S.lead.id,L=LEADERS[id];
  const close=()=>{el.hidden=true;document.removeEventListener("keydown",key,true);if(was&&!(S.cards&&S.cards.open)&&!S.over&&survOn())running=true;};
  const key=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}};
  const draw=()=>{const ready=leadFixReady();
    const fix=id!=="dot"?"":`<div class="ldfix"><h3>Dot's fix <small>${ready?"ready":"used this cycle · back when the outage ends"}</small></h3>
        <p class="muted small">${ready?`She has a ${pct1(LEAD.autoFix)}% chance to fix each breakdown as it starts.`:"She fixed one this cycle."}${(S.lead.fixed||[]).length?` Fixed at the root so far: ${S.lead.fixed.length}.`:""}</p></div>`;
    el.innerHTML=`<div class="modal ldone" role="dialog" aria-modal="true" aria-labelledby="ldc-h"><span class="dk">Mill leader · sim paused</span>
      ${leadCardHTML(id,"div")}${fix}
      ${leadTally().length?`<h3 id="ldc-h">What the mill has kept</h3>${leadTallyHTML()}`:`<h3 id="ldc-h">Nothing built yet</h3><p class="muted small">${LEAD_PICKS[id].length?L.name.split(" ")[0]+" makes the first pick at the next outage.":"Dot makes no picks. She fixes one breakdown on her own once every outage cycle."}</p>`}
      <p class="muted small">${S.lead.changed?`You changed leader once already (${escHTML(LEADERS[S.lead.was].name)} left). ${L.name.split(" ")[0]} stays to the end.`:"You can change leader once per run, in an outage budget dialog. What was built stays with the mill."}</p>
      <div class="btns"><button class="primary" id="ldc-ok" style="flex:1">Back to the mill</button></div></div>`;
    el.querySelector("#ldc-ok").addEventListener("click",close);
};
  document.addEventListener("keydown",key,true);draw();el.hidden=false;el.querySelector("#ldc-ok").focus();}
// the chip: the leader's face, and Dot's fix when a breakdown is waiting for it
UI_TICKS.push(()=>{const f=$("svL");if(!f)return;const id=S.lead&&survOn()?S.lead.id:"";if(f.dataset.l!==id){f.dataset.l=id;f.innerHTML=id?leadArt(id,true):"";f.hidden=!id;const fb=$("svFold");if(fb)fb.hidden=!id;if(!id)$("survChip").classList.remove("fold");}
  const x=$("svF");if(x){const show=id==="dot",ready=show&&leadFixReady(),hot=false,t=ready?"Fix ready":"Fix used";
    if(x.hidden===show)x.hidden=!show;if(show){if(x.textContent!==t)x.textContent=t;x.dataset.s=ready?"Fix ✓":"Fix –";x.classList.toggle("hot",hot);x.classList.toggle("used",!ready);}$("survChip").classList.remove("hot");}});
// v4.4.0-t3: the wave bar slides away to the left (the arrow at its end), leaving the leader's face; tapping the face brings it back
{const c=$("survChip"),fb=$("svFold");let fold=false;try{fold=localStorage.getItem("paper-mill-chip-fold")==="1";}catch(e){}
  const setFold=v=>{fold=v;c.classList.toggle("fold",v);c.setAttribute("aria-expanded",String(!v));c.setAttribute("aria-label",v?"Show the wave bar":"Wave bar: open your mill leader's card");try{localStorage.setItem("paper-mill-chip-fold",v?"1":"0");}catch(e){}};
  if(c){setFold(fold);
    c.addEventListener("click",e=>{if(fb&&fb.contains(e.target)){e.stopPropagation();setFold(true);return;}
      if(fold&&S.lead){setFold(false);return;}
      if(S.lead&&survOn()&&!(S.cards&&S.cards.open))leadCardOpen();});
    c.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target===c){e.preventDefault();c.click();}});}}
