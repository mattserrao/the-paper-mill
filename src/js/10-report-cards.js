/* ---------- v3.3: 10-day report cards (season mode) ----------
   Each period (days 1-10, 11-20, 21-30) gathers money in and out, cost per ton, what caused downtime, how reliable each
   section was (planned outage time left out) and which step held the mill back. Cards pop up at the start of day 11 and
   day 21 (sim paused) and the days 21-30 card is shown in the season summary. Each card also shows the season so far. */
const RC_STEPS=["Receiving","Pulper","Machine at full speed","Machine down","Winder","Shipping"],
  RC_LBL={"Machine at full speed":"Paper machine (speed limited)","Machine down":"Paper machine (machine down)"},   // v5.0.2: shown names (the keys stay: saves count by them)
  RC_SEC=[["recv","Receiving"],["pulper","Stock prep"],["machine","Paper machine"],["winder","Winder"],["ship","Shipping"]];
function rcAcc(){return {t0:S.t,L0:{...S.ledger},prod0:S.tot.prodT,ship0:S.shipT||0,rolls0:S.tot.rolls,brk0:S.tot.breaks,hay0:S.tot.hayouts,off0:S.tot.broke||0,occ:0,fib:0,min:0,plan:0,up:{recv:0,pulper:0,machine:0,winder:0,ship:0},dn:{},bn:{}};}
const RC_UP={recv:false,pulper:false,machine:false,winder:false,ship:false},RC_ACC=[null,null,null],rcAdd=(a,k,v)=>{a.dn[k]=(a.dn[k]||0)+v;};
function rcTick(dt){const se=S.season;if(!se||!se.on||se.done||dt<=0)return;
  if(!S.rc)S.rc={i:0,p:rcAcc(),s:rcAcc(),cards:[]};const R=S.rc,M=S.M||{},planned=!!(S.outg&&S.outg.on);
  const up=RC_UP;up.recv=!(M.noIn||M.docksClosed||M.recvMul===0);up.pulper=!M.pulperDown;up.machine=S.pm==="run";up.winder=S.wd==="run"&&!M.winderDown;up.ship=!(M.noOut||M.clampMul===0);
  // downtime causes: every active upset by name, plus machine/winder stops that no upset explains
  const add=rcAdd;
  if(!R.dd){R.dd=rcAcc();R.day=Math.floor(S.t/1440);}
  // v4.2.4 (Mill report): the day's grades are kept at each midnight, with the day's biggest downtime cause
  if(Math.floor(S.t/1440)>R.day){const c=rcMake(R.p,R.i),top=Object.entries(R.dd.dn).sort((x,y)=>y[1]-x[1])[0];(R.days||(R.days=[])).push({d:R.day+1,g:c.g,o:c.overall,top:top?[top[0],Math.round(top[1])]:null});if(se.surv&&R.days.length>60)R.days.shift();R.day=Math.floor(S.t/1440);R.dd=rcAcc();}
  const feedT=(S.rates.feed||0)*dt/60,fibT=feedT*P.yieldF*(M.yieldMul||1);
  // (v5.2: plain loops, no per-step arrays or closures; same order, so the sums are identical)
  RC_ACC[0]=R.p;RC_ACC[1]=R.s;RC_ACC[2]=R.dd;
  for(let n=0;n<3;n++){const a=RC_ACC[n];a.min+=dt;if(planned){a.plan+=dt;continue;}a.occ+=feedT;a.fib+=fibT;for(const k in up)if(up[k])a.up[k]+=dt;
    for(const i of S.inc){const e=EV[i.id];if(e&&i.id!=="runner"&&i.id!=="birdhay")add(a,e.name,dt);}
    if(S.pm==="break")add(a,"Sheet breaks",dt);else if(S.pm==="down"&&!M.pmDown)add(a,"Ran out of stock",dt);else if(S.pm==="full")add(a,"Warehouse full",dt);else if(S.pm==="spools")add(a,"Reel storage full",dt);
    if(S.wd==="hayout")add(a,"Winder hayouts",dt);}
  // what limited production, sampled every 10 sim minutes: the machine when it runs flat out or is down; upstream when it is
  // starved (empty bale yard = receiving, otherwise the pulper); the winder when reels back up; shipping when the warehouse is full
  R.bt=(R.bt||0)+dt;if(R.bt>=10){if(!planned){const k=rcLimit();[R.p,R.s].forEach(a=>{a.bn[k]=(a.bn[k]||0)+R.bt;});}R.bt=0;}
  // period boundaries: start of day 11 and day 21. v4.3 survival: a period is a wave, its card pops when its outage ends,
  // and only the last few cards are kept (a run has no fixed length)
  const pi=se.surv?survWave()-1:Math.floor(S.t/14400);if(pi>R.i&&(se.surv||pi<3)){const card=rcMake(R.p,R.i);if(se.surv)card.next=true;R.cards[R.i]=card;R.i=pi;R.p=rcAcc();R.pend=card;if(se.surv&&pi>4)R.cards[pi-5]=null;}
  if(R.pend&&!(S.cards&&S.cards.open)&&!S.over&&!(S.civ&&S.civ.pending)){   /* (v5.1 QA2: waits for a standing-order toast to commit) */const c=R.pend;R.pend=null;rcOpen(c);}}
function rcLimit(){const M=S.M||{},starved=()=>S.yard<P.yardCap*0.04||M.noIn||M.docksClosed?"Receiving":"Pulper";
  if(S.pm==="full")return "Shipping";if(S.pm==="spools")return "Winder";if(S.pm==="down")return M.pmDown?"Machine down":starved();if(S.pm!=="run")return "Machine down";
  if(S.pmSpeed<C.pmSp.v*0.97*(M.speedCap||1)&&S.tank<P.tankCap*0.3)return starved();return "Machine at full speed";}
function rcGrade(v,cut){return ["A","B","C","D","F"][cut.findIndex(c=>v>=c)<0?4:cut.findIndex(c=>v>=c)];}
function rcSum(a){const L=S.ledger,d=k=>(L[k]||0)-(a.L0[k]||0),prod=S.tot.prodT-a.prod0,ship=(S.shipT||0)-a.ship0,run=Math.max(1,a.min-a.plan),days=Math.max(0.1,a.min/1440);
  const ops=["occ","frin","frout","energy","labor","overhead","premium"].reduce((t,k)=>t+d(k),0),spent={Fiber:d("occ"),Energy:d("energy"),Labour:d("labor"),Overhead:d("overhead"),"Freight & insurance":d("premium")+d("frin")+d("frout"),"Repairs & outages":d("repairs"),Upgrades:d("upgrades")};
  const rev=d("rev"),deals=d("deals");spent["Deals & trials"]=Math.max(0,-deals);const cv=d("civ");spent.Civics=Math.max(0,cv);   // v5.0.6: a net cost from event cards gets its own row, so the rows add up to Net
  const earned=rev+Math.max(0,deals)+Math.max(0,-cv),spentT=Object.values(spent).reduce((t,v)=>t+v,0),net=earned-spentT;
  const rel={};RC_SEC.forEach(([k])=>rel[k]=a.up[k]/run);const relAvg=RC_SEC.reduce((t,[k])=>t+rel[k],0)/RC_SEC.length;
  const dn=Object.entries(a.dn).sort((x,y)=>y[1]-x[1]).slice(0,5),bnT=Object.values(a.bn).reduce((t,v)=>t+v,0)||1,bn=RC_STEPS.map(k=>[k,(a.bn[k]||0)/bnT]).sort((x,y)=>y[1]-x[1]);
  const price=priceOf(C.grade),cpt=prod>0?(ops+d("repairs"))/prod:0,margin=earned>0?(earned-(spentT-spent.Upgrades))/earned:0;
  const off=(S.tot.broke||0)-(a.off0||0),onspec=prod+off>0?prod/(prod+off):1,yld=a.occ>0?a.fib/a.occ:null;
  return {days,prod,ship,rev,deals,earned,spent,spentT,net,ops,cpt,price,margin,rel,relAvg,avail:rel.machine,dn,bn,breaks:S.tot.breaks-a.brk0,hay:S.tot.hayouts-a.hay0,rolls:S.tot.rolls-a.rolls0,plan:a.plan,off,onspec,yld};}
function rcMake(a,i){const p=rcSum(a),s=rcSum(S.rc.s);
  const g={Profit:rcGrade(p.margin,[0.30,0.22,0.14,0.06]),"Cost / ton":rcGrade(p.price>0?1-p.cpt/p.price:0,[0.32,0.25,0.18,0.10]),Downtime:rcGrade(p.avail,[0.95,0.91,0.86,0.80]),Reliability:rcGrade(p.relAvg,[0.96,0.92,0.88,0.82])};
  const gp={A:4,B:3,C:2,D:1,F:0},avg=Object.values(g).reduce((t,v)=>t+gp[v],0)/4,overall=avg>=3.5?"A":avg>=2.5?"B":avg>=1.5?"C":avg>=0.75?"D":"F";
  // one tip, aimed at the weakest spot
  const worst=Object.entries(g).sort((x,y)=>gp[x[1]]-gp[y[1]])[0][0],top=p.dn[0],bn=p.bn[0],lowSec=RC_SEC.map(([k,n])=>[n,p.rel[k]]).sort((x,y)=>x[1]-y[1])[0];
  const hrs=m=>(m/60).toFixed(m<600?1:0)+" h";
  let tip;
  if(worst==="Profit"){const rep=p.spent["Repairs & outages"]||0,pf=p.spent["Freight & insurance"]||p.spent["Premium freight"]||0;
    tip=rep>p.earned*0.1?`Repairs and outage budgets took ${money(rep)}. Fewer breakdowns means fewer bills, so keep the machine and its crews ahead of trouble.`:pf>p.earned*0.05?`Freight and insurance cost ${money(pf)}. ${LV("insure")?"Insurance is part of it, and pays back in smaller repair bills.":"Keep the warehouse moving so trucks don't need rushing."}`:`You kept ${Math.round(p.margin*100)}% of sales. Fiber and energy are your biggest costs, so every hour of downtime hurts.`;}
  else if(worst==="Downtime"&&top)tip=`${top[0]} cost you ${hrs(top[1])} this period. Respond fast when it hits, and give its area a bigger budget at the next outage.`;
  else if(worst==="Reliability")tip=`${lowSec[0]} was the least reliable section (${Math.round(lowSec[1]*100)}% up). Look at its upgrades and outage budget.`;
  else if(worst==="Cost / ton")tip=`Each ton cost ${money(p.cpt)} to make against a ${money(p.price)} price. Efficiency upgrades and fewer breaks bring that down.`;
  else if(bn&&bn[1]>0.4)tip=bn[0]==="Machine at full speed"?`The paper machine ran flat out ${Math.round(bn[1]*100)}% of the time, so it sets your output. Speed and drive upgrades pay back fastest.`:bn[0]==="Machine down"?`The machine being down held the mill back ${Math.round(bn[1]*100)}% of the time. Cut breaks and breakdowns first.`:`The ${bn[0].toLowerCase()} held the mill back ${Math.round(bn[1]*100)}% of the time. That's where an upgrade pays back fastest.`;
  else tip=overall==="A"?"Great running. Keep the machine up and the buffers healthy.":`Profit margin was ${Math.round(p.margin*100)}%. Shorter downtime is the quickest way to lift it.`;
  const cm=civOn()?Object.assign({},S.civ.m):null;   // v5.1 QA2: the meters when the card was made
  if(survRun())return {i,wave:i+1,from:i?i*OUT.every+1:1,to:(i+1)*OUT.every,p,s,g,overall,tip,cm};   // v4.3: a wave's card (a wave runs from one outage day to the next)
  return {i,from:i*10+1,to:i*10+10,p,s,g,overall,tip,cm};}
function rcHTML(c){const W=c.wave,per=W?"this wave":"these 10 days",all=W?"run so far":"season so far";const p=c.p,s=c.s,pc=v=>Math.round(v*100)+"%",hrs=m=>(m/60).toFixed(m<600?1:0)+" h",gc=x=>"rcg g"+x;
  const row=(k,a,b,cls)=>`<div class="rcr${cls?" "+cls:""}"><span>${k}</span><b>${a}</b><i>${b}</i></div>`;
  const bar=(k,v,lab,hot)=>`<div class="rcb${hot?" hot":""}"><span>${k}</span><div><em style="width:${Math.max(2,Math.round(v*100))}%"></em></div><b>${lab}</b></div>`;
  const maxDn=p.dn.length?p.dn[0][1]:1;
  return `<div class="rchead"><div><span class="dk">${W?`Wave ${W} report card`:"Report card"} · <span class="nw">days ${c.from}–${c.to}</span></span><h2 id="rc-h">${escHTML(MILL.name)}</h2></div><div class="${gc(c.overall)} big" aria-label="Overall grade ${c.overall}">${c.overall}</div></div>
    <div class="rcgrades">${Object.entries(c.g).map(([k,v])=>`<div><div class="${gc(v)}">${v}</div><small>${k}</small></div>`).join("")}</div>
    <p class="rctip"><b>Tip</b> ${c.tip}</p>${W&&c.next?`<p class="wavenext"><b>Wave ${W} done.</b> Wave ${W+1} starts now: upsets <b>${xf(survUp(W+1))}</b>, costs <b>${xf(survCost(W+1))}</b>.</p>`:""}
    <h3>Money <small>${per} · ${all}</small></h3>
    ${row("Earned (paper sales"+(p.deals>0?" + deals":"")+")",money(p.earned),money(s.earned),"pos")}
    ${Object.keys(p.spent).filter(k=>p.spent[k]||s.spent[k]).map(k=>row(k,money(-p.spent[k]),money(-s.spent[k]))).join("")}
    ${row("Net",money(p.net),money(s.net),"net "+(p.net>=0?"pos":"neg"))}
    ${c.cm?`<h3>Civics <small>at the end of ${per}</small></h3>${CIVK.map(k=>row(CIV.names[k],Math.round(c.cm[k])+"/100",civBand(c.cm[k])[1])).join("")}`:""}
    <h3>Cost per ton <small>${per} · ${all}</small></h3>
    ${row("Cost to make a ton",money(p.cpt),money(s.cpt))}${row("Selling price",money(p.price),money(s.price))}${row("Profit margin (before upgrades)",pc(p.margin),pc(s.margin))}
    ${row("Tons made",Math.round(p.prod).toLocaleString("en-US")+" t",Math.round(s.prod).toLocaleString("en-US")+" t")}
    <h3>Downtime <small>biggest issues, ${W?"this wave":"last 10 days"}</small></h3>
    ${p.dn.length?p.dn.map(([k,m],i)=>bar(k,m/maxDn,hrs(m),i===0)).join(""):`<p class="rcnone">Nothing went wrong. Remarkable.</p>`}
    <p class="rcnote">${p.breaks} sheet break${p.breaks===1?"":"s"} · ${p.hay} hayout${p.hay===1?"":"s"}${p.plan>0?` · ${hrs(p.plan)} planned outage (not counted)`:""}</p>
    <h3>Reliability <small>time each section was up</small></h3>
    ${RC_SEC.map(([k,n])=>bar(n,p.rel[k],pc(p.rel[k]),p.rel[k]<0.9)).join("")}
    <h3>Bottlenecks <small>% time each step limited the mill</small></h3>
    ${p.bn.filter(([,v])=>v>0.005).map(([k,v],i)=>bar(RC_LBL[k]||k,v,pc(v),i===0)).join("")||`<p class="rcnone">Not enough running time to tell.</p>`}`;}
let rcEl=null;
function rcOpen(c,fromSummary){if(!rcEl){rcEl=document.createElement("div");rcEl.className="overlay";rcEl.id="rcOv";rcEl.style.zIndex="170";document.body.appendChild(rcEl);}
  if(!fromSummary){running=false;S.cards.open={report:true};}
  rcEl.innerHTML=`<div class="modal deal outg rc" role="dialog" aria-modal="true" aria-labelledby="rc-h">${rcHTML(c)}<div class="btns"><button class="primary" id="rc-ok" style="flex:1">${fromSummary?"Close":"Back to the mill"}</button></div></div>`;
  rcEl.hidden=false;AUDIO.sfx(c.overall<="B"?"win":"cash",150);
  document.getElementById("rc-ok").addEventListener("click",()=>{rcEl.hidden=true;if(!fromSummary)closeCard(true);});
  if(!rcEl._esc){rcEl._esc=1;document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!rcEl.hidden){const b=document.getElementById("rc-ok");if(b){e.preventDefault();e.stopPropagation();b.click();}}},true);}   // v5.0.5: Escape closes it
  rcEl.querySelector(".modal").scrollTop=0;document.getElementById("rc-ok").focus({preventScroll:true});}
function rcFinal(){const R=S.rc;if(!R)return null;const c=rcMake(R.p,R.i);R.cards.push(c);return c;}
function seasonTick(){const se=S.season;if(!se||!se.on||se.done)return;
  if(!se.red&&S.cash<0){se.red=1;const r=S.profitRate<0?(S.cash-ECON.bankrupt)/-S.profitRate:Infinity;   // v5.0.6: once a run, the first time cash goes below zero
    const t=`Cash is below zero. Bankrupt at ${money(ECON.bankrupt)}${isFinite(r)?`, about ${Math.max(1,Math.round(r))} days away at this rate`:""}.`;
    BANNERS.push({text:t,t:null,tag:"CASH"});while(BANNERS.length>3)BANNERS.splice(1,1);log(t,"warn");}
  if(se.surv){if(S.cash<ECON.bankrupt)endSurvival();return;}   // v4.3 survival: no last day, only bankruptcy
  if(S.t>=se.end||S.cash<ECON.bankrupt)endSeason(S.cash<ECON.bankrupt);}
function seasonResult(){return {score:Math.round(S.cash-ECON.start),tons:Math.round(S.shipT||0),incidents:S.tot.incidents,mill:MILL.name.slice(0,40),version:APP_VER.slice(0,12),days:SEASON_DAYS};}
function endSeason(bust){const se=S.season;civDrop();se.done=true;se.on=false;running=false;if(G3.save&&G3.save.drop)G3.save.drop();   // v5.0.3: the season is over, so its save goes
  if(document.body.classList.contains("fs"))setFS(false);seasonLocks(false);
  const r=seasonResult();se.result=r;AUDIO.sfx(r.score>0?"win":"lose",100);
  soMode(false);$("so-h").textContent=bust?"Season over: bankrupt":"Season complete";
  $("so-p").textContent=bust?`${MILL.name} ran out of money before day ${SEASON_DAYS}.`:`${SEASON_DAYS} days at ${MILL.name}${/[.!?]$/.test(MILL.name)?"":"."}`;   // (v4.2.5: no "Co.." when the name ends in a full stop)
  const eff=S.tot.pot>0?S.tot.prodT/S.tot.pot:1,sg=S.rc&&S.rc.s?rcMake(S.rc.s,S.rc.i).overall:null,g=sg?RATINGS.find(x=>x[1]===sg):RATINGS.find(x=>eff>=x[0]);
  const st=[["Net profit",money(r.score),"big"],["Tons shipped",f0(r.tons)+" t"],["Upsets survived",String(r.incidents)],["Rolls made",String(S.tot.rolls)],["Season grade",g[1]+" · "+g[2]],["Output",Math.round(eff*100)+"% of max-speed tons"]];
  if(S.civ&&S.civ.m&&!S.free&&civSummary(S.civ.m))st.push(["Civics",civSummary(S.civ.m),"wide"]);   // v5.1 QA2
  if(S.lead)st.push(["Mill leader",LEADERS[S.lead.id].name+(S.lead.was?" (after "+LEADERS[S.lead.was].name+")":""),"wide"]);   // v5.1: seasons have leaders too
  {const ts=tellEndStat();if(ts)st.push(ts);}   // v5.7 catching failures early
  $("so-stats").replaceChildren(...st.map(([k,v,c])=>{const d=document.createElement("div");if(c)d.className=c;const a=document.createElement("span");a.textContent=k;const b=document.createElement("b");b.textContent=v;d.append(a,b);return d;}));
  {const c=bust?null:rcFinal(),box=$("so-rc");if(box){if(c){box.hidden=false;box.innerHTML=`<div class="rcmini"><div class="rcg g${c.overall}">${c.overall}</div><div><b><span class="nw">Days ${c.from}–${c.to}</span> report card</b><small>${Object.entries(c.g).map(([k,v])=>k+" "+v).join(" · ")}</small><p>${c.tip}</p></div></div><button id="so-rcbtn" class="ghost">Open the full report card</button>`;
      $("so-rcbtn").addEventListener("click",()=>rcOpen(c,true));}else box.hidden=true;}}
  let nm="";try{nm=localStorage.getItem("paper-mill-player")||"";}catch(e){}$("so-name").value=nm;soCount();
  $("so-submit").disabled=false;$("so-submit").textContent=lbOn()?"Submit score":"Save score";setMsg("");$("seasonOv").hidden=false;$("seasonOv").scrollTop=0;if(matchMedia("(hover:hover) and (pointer:fine)").matches)$("so-name").focus();else $("so-submit").focus({preventScroll:true});}
// v5.0.4: the name box shows how many of its 16 characters are used
function soCount(){const i=$("so-name"),c=$("so-count");if(!i||!c)return;const n=i.value.length;c.textContent=n+"/16";c.classList.toggle("full",n>=16);}
{const i=document.getElementById("so-name");if(i)i.addEventListener("input",soCount);}
function setMsg(t,c){const m=$("so-msg");m.textContent=t;m.className="somsg"+(c?" "+c:"");if(t)try{m.scrollIntoView({block:"nearest"});}catch(e){}}
function saveLocal(r,name,sv){const key=sv?SURV.local:"paper-mill-local-scores";try{const L=JSON.parse(localStorage.getItem(key)||"[]");L.push({...r,name,created_at:new Date().toISOString(),local:1});
  L.sort(sv?(a,b)=>b.minutes-a.minutes||b.tons-a.tons:(a,b)=>b.score-a.score||b.tons-a.tons);localStorage.setItem(key,JSON.stringify(L.slice(0,20)));}catch(e){}}
async function submitScore(){const r=S.season&&S.season.result;if(!r||S.free)return;
  if(S.season.submitted||$("so-submit").disabled)return;   // v5.0.6: one post per run (Enter in the name box used to post again after Submit)
  const sv=survRun(),name=$("so-name").value.replace(/\s+/g," ").trim();
  if(!/^[A-Za-z0-9 ._'-]{2,16}$/.test(name)){setMsg(name?"Use 2–16 letters, numbers, spaces or . _ ' -":"Type a name for the leaderboard first.","bad");const n=$("so-name");n.scrollIntoView({block:"center"});n.focus();return;}
  if(!nameOk(name)){setMsg("That name isn't allowed on the leaderboard. Pick another.","bad");const n=$("so-name");n.scrollIntoView({block:"center"});n.focus();return;}   // v5.0.6: the player name gets the mill name's filter ("Sh1t" reached the board)
  try{localStorage.setItem("paper-mill-player",name);}catch(e){}
  if(!S.season.saved){S.season.saved=1;saveLocal(r,name,sv);}
  if(!lbOn()){setMsg("Saved on this device. The online leaderboard isn't connected yet.","ok");$("so-submit").disabled=true;return;}
  $("so-submit").disabled=true;setMsg("Submitting…");
  try{const post=b=>fetch(LB.url.replace(/\/$/,"")+"/rest/v1/"+(sv?SURV.table:"scores"),{method:"POST",headers:lbHdr({"Content-Type":"application/json",Prefer:"return=minimal"}),body:JSON.stringify(b)});
    let res=await post({...r,mill:nameOk(r.mill)?r.mill:"Unnamed mill",name});   // (v5.0.3: a mill name from an older save can still hold a banned word)
    if(sv&&res.status===404){setMsg("Saved on this device. The online survival board isn't set up yet.","ok");return;}   // (the table from supabase/survival.sql)
    if(!res.ok){let msg="Couldn't submit ("+res.status+")";try{const j=await res.json();if(j&&j.message)msg=j.message;}catch(e){}
      if(sv&&/survival_wave_fits/.test(msg)){setMsg("Saved on this device. The online survival board needs an update before it can take this score.","ok");return;}   // (supabase/survival-4day-waves.sql)
      throw new Error(msg);}
    S.season.submitted=name;$("so-submit").textContent="Submitted ✓";
    const rk=await lbRank(sv,r);S.season.rank=rk;   // v5.0.5: where the score landed, so the player can find it
    setMsg(rk?`Submitted: #${rk.rank.toLocaleString("en-US")} of ${rk.total.toLocaleString("en-US")}.${rk.rank>100?" The board shows the top 100; your run is pinned at the bottom.":""}`:"Submitted! You're on the board.","ok");openBoard(sv?"surv":"season");}
  catch(e){setMsg(String(e.message||e),"bad");$("so-submit").disabled=false;}}
// v5.0.5: a submitted run's rank on its board (runs strictly ahead + 1) and the board's size, from two count-only queries
async function lbRank(sv,r){try{const base=LB.url.replace(/\/$/,"")+"/rest/v1/"+(sv?SURV.table:"scores")+"?select=id",
    ver=sv?"":"&and=(version.not.like.v1.*,version.not.like.v2.0.*,version.not.like.v2.1.*)",
    ahead=sv?`&or=(minutes.gt.${r.minutes},and(minutes.eq.${r.minutes},tons.gt.${r.tons}))`:`&or=(score.gt.${r.score},and(score.eq.${r.score},tons.gt.${r.tons}))`;
  const n=async q=>{const res=await fetch(base+q,{method:"HEAD",headers:lbHdr({Prefer:"count=exact",Range:"0-0"})});const m=/\/(\d+)/.exec(res.headers.get("content-range")||"");if(!res.ok||!m)throw 0;return +m[1];};
  const [a,t]=await Promise.all([n(ahead+ver),n(ver)]);return {rank:a+1,total:Math.max(t,a+1)};}catch(e){return null;}}
// v4.2.5: the board takes focus when it opens and gives it back when it closes
let lbBack=null,lbReq=0;
function closeBoard(){$("lbOv").hidden=true;if(lbBack&&lbBack.focus)lbBack.focus();lbBack=null;}
// v4.3: a tab per mode ("season" or "surv"). Opened without one, it shows the board of the mode being played.
async function openBoard(tab){if(tab!=="season"&&tab!=="surv")tab=survRun()?"surv":"season";const sv=tab==="surv",my=++lbReq;
  if($("lbOv").hidden){lbBack=document.activeElement;$("lbOv").hidden=false;$("lb-close").focus();}
  document.querySelectorAll("#lb-tabs button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.t===tab)));
  const L=$("lb-list");L.replaceChildren(Object.assign(document.createElement("div"),{className:"lbempty",textContent:"Loading…"}));$("lb-sub").textContent="Loading…";
  const q=sv?SURV.table+"?select=name,minutes,wave,tons,incidents,mill,created_at&order=minutes.desc,tons.desc&limit=100"
    :"scores?select=name,score,tons,incidents,mill,created_at&order=score.desc,tons.desc&limit=100&and=(version.not.like.v1.*,version.not.like.v2.0.*,version.not.like.v2.1.*)";
  let rows=[],note="";
  if(lbOn()){try{let res=await fetch(LB.url.replace(/\/$/,"")+"/rest/v1/"+q,{headers:lbHdr()});
      if(!res.ok)throw new Error(res.status);rows=await res.json();}catch(e){note="Couldn't reach the leaderboard. Showing scores saved on this device.";}}
  else note="Online leaderboard not connected yet. Showing scores saved on this device.";
  if(my!==lbReq)return;   // another tab was picked while this one loaded
  if(note){try{rows=sv?JSON.parse(localStorage.getItem(SURV.local)||"[]"):JSON.parse(localStorage.getItem("paper-mill-local-scores")||"[]").filter(r=>!/^v(1\.|2\.[01]\.)/.test(r.version||""));}catch(e){rows=[];}}
  $("lb-sub").textContent=note||(sv?"Top 100 · survival runs · ranked by time survived":"Top 100 · 30-day seasons · ranked by net profit");
  if(!rows.length){L.replaceChildren(Object.assign(document.createElement("div"),{className:"lbempty",textContent:sv?"No scores yet. Start a survival run and set the bar.":"No scores yet. Start a season and set the bar."}));return;}
  let me="";try{me=localStorage.getItem("paper-mill-player")||"";}catch(e){}
  const se0=S.season,thisRun=!!(se0&&se0.rank&&se0.result&&se0.submitted&&(tab==="surv")===!!se0.surv);   // v5.0.6: just submitted here → only that run's row is marked (below), not every row with the name
  L.replaceChildren(...rows.map((r,i)=>{const d=document.createElement("div");d.className="lbrow"+(!thisRun&&me&&r.name===me?" me":"");
    const mk=(c,t)=>Object.assign(document.createElement("span"),{className:c,textContent:t});
    const dt=r.created_at?new Date(r.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric"}):"";
    d.append(mk("r",i+1),mk("n",r.name),mk("sc",sv?survTime(r.minutes):money(r.score)),mk("m",[sv?"wave "+r.wave:"",f0(r.tons)+" t shipped",(r.incidents??"")+" upsets",dt,r.mill].filter(Boolean).join(" · ")));return d;}));
  // v5.0.5: this run's row is marked and scrolled into view; outside the top 100 it is pinned at the bottom
  {const se=S.season,rk=se&&se.rank,res=se&&se.result;if(rk&&res&&se.submitted&&(tab==="surv")===!!se.surv){if(rk.rank<=rows.length){const row=L.children[rk.rank-1];if(row){row.classList.add("me","mine");row.scrollIntoView({block:"center"});}}
    else{const d=document.createElement("div");d.className="lbrow me mine pin";const mk=(c,t)=>Object.assign(document.createElement("span"),{className:c,textContent:t});
      d.append(mk("r",rk.rank),mk("n",se.submitted),mk("sc",sv?survTime(res.minutes):money(res.score)),mk("m",[sv?"wave "+res.wave:"",f0(res.tons)+" t shipped",res.incidents+" upsets",new Date().toLocaleDateString(undefined,{month:"short",day:"numeric"}),"your run",res.mill].filter(Boolean).join(" · ")));L.append(d);d.scrollIntoView({block:"center"});}}}}
function setFree(on){S.free=on;if(!on)S.afk=false;if(on)civDrop();   // (v5.1 QA: a choice card would otherwise keep the game paused)
  if(on&&S.season&&S.season.on){const sv=survRun();if(G3.save&&G3.save.drop)G3.save.drop();S.season=null;S.lead=null;applyUpgrades();seasonLocks(false);BANNERS.push({text:(sv?"Survival run":"Season")+" abandoned: free play scores can't go on the leaderboard.",t:null});}
  if(on)BANNERS.push({text:"Free play: upgrades are free and you can't go bankrupt. No leaderboard.",t:null,kind:"good"});
  if(on&&G3.labelIntro)G3.labelIntro();
  updateShop();}
// zen mode: endless, calm screensaver of the mill
let ZEN=null;
// zen film grain: made the first time zen mode starts (encoding it at load cost up to a second)
let grainDone=false;function makeGrain(){if(grainDone)return;grainDone=true;const c=document.createElement("canvas");c.width=c.height=128;const x=c.getContext("2d"),im=x.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}
  x.putImageData(im,0,0);document.documentElement.style.setProperty("--grain",`url(${c.toDataURL()})`);}
function setZen(on){if(on===!!ZEN)return;
  if(on){makeGrain();civDrop();if(S.season&&S.season.on){if(G3.save&&G3.save.drop)G3.save.drop();S.season=null;S.lead=null;applyUpgrades();seasonLocks(false);}
    ZEN={speed:C.simSpeed,chaos:CH.on,hays:C.hays,breaks:C.breaks,view:G3.on};
    if(S.vlv){if(S.vlv.any)vUntouch(Object.keys(S.vlv.lp));S.vlv.cpl=null;S.vlv.bt=null;if(S.vlv.acc)S.vlv.acc={mco:0,make:0,over:0,dL:0};}   // (v6.9.2: valve state left touched kept re-booking its water in zen)
    S.inc=[];if(S.wd==="hayout")S.wd="run";if(S.pm==="break"){S.pm="run";}BANNERS.length=0;S.zen=true;
    CH.on=false;$("chaosOn").checked=false;C.hays=false;C.breaks=false;
    document.body.dataset.zs="none";document.body.classList.add("zen");setFS(true);G3.zen=true;G3.zenS=null;
    if(soundPref==="on"&&!AUDIO.on)setSound(true);running=true;zenPoke();}
  else{const z=ZEN;ZEN=null;S.zen=false;G3.zen=false;document.body.classList.remove("zen");
    CH.on=z.chaos;$("chaosOn").checked=z.chaos;C.hays=z.hays;C.breaks=z.breaks;
    setFS(false);if(G3.titleShow)G3.titleShow();else if(G3.showMenu)G3.showMenu();}}   // v5.2: leaving zen goes back to the title screen
let zenT=0;function zenPoke(){const b=$("zenExit");b.hidden=false;b.classList.add("show");clearTimeout(zenT);zenT=setTimeout(()=>b.classList.remove("show"),2500);}
$("zenExit").addEventListener("click",e=>{e.stopPropagation();setZen(false);});
["pointermove","pointerdown"].forEach(t=>document.addEventListener(t,()=>{if(ZEN)zenPoke();},{passive:true}));
$("so-more").addEventListener("click",()=>{$("seasonOv").hidden=true;if(survRun()){newGame();if(G3.showMenu)G3.showMenu();return;}if(S.season)S.season.more=1;running=true;});   // (v4.3: after a survival run the button is "Menu")
$("so-submit").addEventListener("click",submitScore);$("so-name").addEventListener("keydown",e=>{if(e.key==="Enter")submitScore();e.stopPropagation();});
$("so-board").addEventListener("click",openBoard);$("so-new").addEventListener("click",()=>{if(survRun()){leadPickOpen(id=>{$("seasonOv").hidden=true;startSurvival(id);});return;}leadPickOpen(id=>{$("seasonOv").hidden=true;startSeason();leadStart(id);},null,"season");});   // (v4.4: a new survival run picks its leader first)
document.querySelectorAll("#lb-tabs button").forEach(b=>b.addEventListener("click",()=>openBoard(b.dataset.t)));
$("lb-close").addEventListener("click",closeBoard);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("lbOv").hidden){e.preventDefault();closeBoard();}},true);
const RATINGS=[[0.95,"A","Bonus secured"],[0.85,"B","Solid shift"],[0.75,"C","Corporate is asking questions"],[0.6,"D","Mandatory 6 a.m. meeting"],[0,"F","Your parking spot has been reassigned"]];
let feedKey="";
function updateChaos(){
  const days=(S.t-S.lastInc)/1440;$("c-days").textContent=days.toFixed(1);$("c-sign").classList.toggle("hot",S.inc.length>0);
  const eff=S.tot.pot>0?S.tot.prodT/S.tot.pot:1,r=RATINGS.find(x=>eff>=x[0]);
  const g=$("c-grade");g.textContent=Math.round(eff*100)+"%";g.className="g out "+r[1];$("c-grade-t").textContent="Output: "+r[2].toLowerCase().replace(/^./,c=>c.toUpperCase());$("c-grade-s").textContent=`${(eff*100).toFixed(1)}% of max-speed tons made · grades are in the Report tab`;
  $("c-lost").textContent=f0(Math.max(0,S.tot.pot-S.tot.prodT))+" t";$("c-count").textContent=S.tot.incidents;
  const act=$("c-active");act.replaceChildren();
  if(!S.inc.length){const s=document.createElement("span");s.className="none";s.textContent="No active upsets.";act.appendChild(s);}
  S.inc.forEach(i=>{const d=document.createElement("div");d.className="it";d.textContent=EV[i.id].name;const sm=document.createElement("small");
    const cs=incState(i)||(MNEED(i.id)?"maintenance working":QINC(i.id)?crewState(i.id):"");sm.textContent=`${(i.left/60).toFixed(1)} h left${cs?" · "+cs:""}${i.note?" · "+i.note:""}`;d.appendChild(sm);act.appendChild(d);});
  EVENTS.forEach(e=>{const b=$("ev-"+e.id),i=S.inc.find(x=>x.id===e.id);if(!b)return;b.setAttribute("aria-pressed",i?"true":"false");
    b.querySelector("small").textContent=i?`${(i.left/60).toFixed(1)} h`:"";b.title=i?"Click to clear this upset":"Click to trigger now";});
  const k=S.feed.length+"|"+(S.feed[0]?S.feed[0].t:"");
  if(k!==feedKey){feedKey=k;const fd=$("c-feed");fd.replaceChildren();
    if(!S.feed.length){const s=document.createElement("span");s.textContent="No upsets yet.";fd.appendChild(s);}
    S.feed.forEach(x=>{const d=document.createElement("div");d.className=x.cls;const t=document.createElement("span");t.textContent=hhmm(x.t)+"  ";d.appendChild(t);d.append(x.text);fd.appendChild(d);});}
}
function pill(id,text,cls){const el=$(id),c="pill "+(cls||"");if(el.textContent!==text)el.textContent=text;if(el.className!==c)el.className=c;}
const f0=v=>Math.round(v).toLocaleString(), f1=v=>v.toFixed(1);
function hhmm(t){t+=360;const day=Math.floor(t/1440),h=Math.floor((t%1440)/60),base=(S&&S.date0)||new Date().setHours(0,0,0,0);
  const d=new Date(base+day*864e5),h12=h%12||12;return `${d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})} · ${h12} ${h<12?"AM":"PM"}`;}

function updateText(){
  // v5.2: compare before writing, and only fill what is on screen: the top bar's mirrored figures always (51-app-shell
  // copies them), the Stats pane's figures while it is open, the area cards while they show in the process flow Controls tab (v6.5)
  const R=S.rates,level=S.tank/P.tankCap*100,days=Math.max(S.t/1440,1/1440);
  const txt=(id,v)=>{const e=$(id);if(e.textContent!==v)e.textContent=v;};
  txt("k-prod",f1(R.prod)+" t/h");
  txt("k-prod-s",`${f0(S.tot.prodT)} t made · ${f0(S.tot.prodT/days)} t/day`);
  if(paneShown($("repLive"))&&$("repLive").open){
    txt("k-clock",hhmm(S.t)+(S.wx&&S.wx!=="clear"?" · "+WXN[S.wx]:""));
    txt("k-clock-s",`${simRate()} sim min per second`);
    txt("k-speed",f0(S.pmSpeed)+" fpm");
    txt("k-speed-s",`max ${f0(C.pmSp.v)} · ${C.grade}`);
    txt("k-cash",money(S.cash));$("k-cash-box").classList.toggle("neg",S.cash<0);
    txt("k-cash-s",S.cash<0?`bankrupt at ${money(ECON.bankrupt)}`:(d=>d>=0?`${money(d)} made so far`:`${money(-d)} down so far`)(S.cash-ECON.start));
    {const t=S.t>=1440?money(S.profitRate)+"/day":"after day 1";txt("k-profit",t);$("k-profit").style.color=/^[−-]/.test(t)?"var(--bad)":"var(--ink)";}
    txt("k-profit-s",`operating, last 12 h · ${money(priceOf(C.grade))}/t`);
  }
  txt("k-tank",f0(level)+" %");
  const net=R.fiberIn-R.fiberUse;
  txt("k-tank-s",`${net>=0?"+":"−"}${f1(Math.abs(net))} t/h ${Math.abs(net)<0.5?"balanced":net>0?"building":"draining"}`);
  txt("k-yard",f0(S.yard)+" t");
  txt("k-yard-s",R.feed>0.5?`${f1(S.yard/R.feed)} h of pulper feed`:"pulper not feeding");
  txt("k-fg",f0(S.fg)+" rolls");
  txt("k-fg-s",`${f0(S.tot.shipped)} shipped`);

  if(!G3.pfCtlOn)return;   // v6.5: the area cards refresh while they show in the process flow Controls tab
  // pills + readouts
  pill("p-in",S.tot.turned?`${S.tot.turned} turned away`:S.inQ.length>2?`${S.inQ.length} waiting`:"flowing",S.tot.turned?"bad":S.inQ.length>2?"warn":"ok");
  txt("r-in",`${S.tot.inTrucks} trucks · ${f0(S.tot.inTons)} t received · queue ${S.inQ.length} · at doors ${S.inDock.filter(Boolean).length}/${P.doors}`);
  const recCap=S.effDrv*P.driverRate*S.M.recvMul, recUse=(P.autoFeed?0:R.feed)+R.unload;
  pill("p-rec",S.M.crewAtPM?"crew at the PM":S.yard<1?"yard empty":recUse>recCap*0.95?"crew maxed":S.yard>=P.yardCap-1?"yard full":"ok",S.M.crewAtPM?"warn":S.yard<1?"bad":recUse>recCap*0.95||S.yard>=P.yardCap-1?"warn":"ok");
  txt("r-rec",`${S.effDrv<C.drivers.v?`Only ${S.effDrv} of ${C.drivers.v} working · `:""}Crew ${f0(recUse)}/${f0(recCap)} t/h busy · feeding ${f1(R.feed)} · unloading ${f1(R.unload)} t/h`);
  const pulHold=level>97, pulStarve=R.feed<C.pulper.v*0.9&&C.pulper.v>1&&!pulHold;
  pill("p-pul",S.M.pulperDown?"down: upset":pulHold?"hold: chest full":pulStarve?"short of bales":C.pulper.v<0.5?"off":"running",S.M.pulperDown?"bad":pulHold||pulStarve?"warn":C.pulper.v<0.5?"":"ok");
  txt("r-pul",`Fed ${f1(R.feed)} t/h OCC → ${f1(R.fiberIn)} t/h fiber (88% yield)`);
  pill("p-tank",level<5?"empty":level<C.lowLevel.v?"low":level>95?"full":"ok",level<C.lowLevel.v?"bad":level>95?"warn":"ok");
  txt("r-tank",`${f0(S.tank)} of ${P.tankCap} t · in ${f1(R.fiberIn)} · out ${f1(R.fiberUse)} t/h`);
  const pmTxt={run:S.pmSpeed<C.pmSp.v-40&&level<C.lowLevel.v?"slowed: low stock":S.pmSpeed<C.pmSp.v-40?"ramping":"at max speed",break:"sheet break",down:"down: no stock",full:"down: warehouse full",spools:"down: winder backed up",incident:"down: "+(S.M.pmDown||"upset")}[S.pm];
  pill("p-pm",pmTxt,S.pm==="run"?(pmTxt==="at max speed"?"ok":"warn"):"bad");
  const eff=S.t>0?100*(1-S.tot.breakMin/S.t):100;
  txt("r-pm",`${f1(R.prod/C.rollW.v)} rolls/h · ${S.tot.turnups} reels turned up · ${S.tot.breaks} breaks · ${f0(eff)}% sheet time`);
  const reelsW=Math.max(0,reelsAtWinder()-1);
  pill("p-wd",S.wd==="hayout"?"hayout: "+(working("hay")?"crew cleaning":crewState("hay")||"crew cleaning"):S.M.winderDown?"winder down":S.wdBlocked?"roll conveyor full":reelsW>=P.storeReels?"storage full":R.cut>0.5?"winding":"waiting for reel",S.wd==="hayout"||S.M.winderDown||S.wdBlocked?"bad":reelsW>=P.storeReels?"warn":R.cut>0.5?"ok":"");
  txt("r-wd",`${reelsW}/${P.storeReels} reels in storage · ${Math.floor(S.conv||0)}/${P.convCap} rolls on the conveyor · cutting ${f1(R.cut)} t/h · ${S.tot.hayouts} hayouts · ${f1(S.tot.broke)} t broke`);
  const shipCap=S.effLd*P.loaderRate*S.M.clampMul;
  pill("p-ship",S.M.crewAtPM?"crew at the PM":S.fg>=P.fgCap-1?"warehouse full":S.conv>P.convCap*0.7?"rolls waiting for clamps":S.outQ.length>2?`${S.outQ.length} trucks waiting`:S.fg<5&&S.outDock.some(Boolean)?"no rolls":"ok",S.M.crewAtPM?"warn":S.fg>=P.fgCap-1?"bad":S.outQ.length>2||(S.fg<5&&S.outDock.some(Boolean))?"warn":"ok");
  txt("r-ship",`${S.effLd<C.loaders.v?`Only ${S.effLd} of ${C.loaders.v} loaders · `:""}Putting away ${f1(R.put||0)} rolls/h · loading ${f1(R.load)} of ${f0(shipCap)} rolls/h · ${S.outDock.filter(Boolean).length}/${P.shipDoors} doors · ${S.tot.shipped/P.truckRolls} trucks out`);
}

