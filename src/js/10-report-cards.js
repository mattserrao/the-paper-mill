/* ---------- v3.3: 10-day report cards (season mode) ----------
   Each period (days 1-10, 11-20, 21-30) gathers money in and out, cost per ton, what caused downtime, how reliable each
   section was (planned outage time left out) and which step held the mill back. Cards pop up at the start of day 11 and
   day 21 (sim paused) and the days 21-30 card is shown in the season summary. Each card also shows the season so far. */
const RC_STEPS=["Receiving","Pulper","Machine at full speed","Machine down","Winder","Shipping"],RC_SEC=[["recv","Receiving"],["pulper","Stock prep"],["machine","Paper machine"],["winder","Winder"],["ship","Shipping"]];
function rcAcc(){return {t0:S.t,L0:{...S.ledger},prod0:S.tot.prodT,ship0:S.shipT||0,rolls0:S.tot.rolls,brk0:S.tot.breaks,hay0:S.tot.hayouts,min:0,plan:0,up:{recv:0,pulper:0,machine:0,winder:0,ship:0},dn:{},bn:{}};}
function rcTick(dt){const se=S.season;if(!se||!se.on||se.done||dt<=0)return;
  if(!S.rc)S.rc={i:0,p:rcAcc(),s:rcAcc(),cards:[]};const R=S.rc,M=S.M||{},planned=!!(S.outg&&S.outg.on);
  const up={recv:!(M.noIn||M.docksClosed||M.recvMul===0),pulper:!M.pulperDown,machine:S.pm==="run",winder:S.wd==="run"&&!M.winderDown,ship:!(M.noOut||M.clampMul===0)};
  // downtime causes: every active upset by name, plus machine/winder stops that no upset explains
  const add=(a,k,v)=>{a.dn[k]=(a.dn[k]||0)+v;};
  [R.p,R.s].forEach(a=>{a.min+=dt;if(planned){a.plan+=dt;return;}for(const k in up)if(up[k])a.up[k]+=dt;
    S.inc.forEach(i=>{const e=EV[i.id];if(e&&i.id!=="runner"&&i.id!=="birdhay")add(a,e.name,dt);});
    if(S.pm==="break")add(a,"Sheet breaks",dt);else if(S.pm==="down"&&!M.pmDown)add(a,"Ran out of stock",dt);else if(S.pm==="full")add(a,"Warehouse full",dt);else if(S.pm==="spools")add(a,"Reel storage full",dt);
    if(S.wd==="hayout")add(a,"Winder hayouts",dt);});
  // what limited production, sampled every 10 sim minutes: the machine when it runs flat out or is down; upstream when it is
  // starved (empty bale yard = receiving, otherwise the pulper); the winder when reels back up; shipping when the warehouse is full
  R.bt=(R.bt||0)+dt;if(R.bt>=10){if(!planned){const k=rcLimit();[R.p,R.s].forEach(a=>{a.bn[k]=(a.bn[k]||0)+R.bt;});}R.bt=0;}
  // period boundaries: start of day 11 and day 21
  const pi=Math.floor(S.t/14400);if(pi>R.i&&pi<3){const card=rcMake(R.p,R.i);R.cards.push(card);R.i=pi;R.p=rcAcc();R.pend=card;}
  if(R.pend&&!(S.cards&&S.cards.open)&&!S.over){const c=R.pend;R.pend=null;rcOpen(c);}}
function rcLimit(){const M=S.M||{},starved=()=>S.yard<P.yardCap*0.04||M.noIn||M.docksClosed?"Receiving":"Pulper";
  if(S.pm==="full")return "Shipping";if(S.pm==="spools")return "Winder";if(S.pm==="down")return M.pmDown?"Machine down":starved();if(S.pm!=="run")return "Machine down";
  if(S.pmSpeed<C.pmSp.v*0.97*(M.speedCap||1)&&S.tank<P.tankCap*0.3)return starved();return "Machine at full speed";}
function rcGrade(v,cut){return ["A","B","C","D","F"][cut.findIndex(c=>v>=c)<0?4:cut.findIndex(c=>v>=c)];}
function rcSum(a){const L=S.ledger,d=k=>(L[k]||0)-(a.L0[k]||0),prod=S.tot.prodT-a.prod0,ship=(S.shipT||0)-a.ship0,run=Math.max(1,a.min-a.plan),days=Math.max(0.1,a.min/1440);
  const ops=["occ","energy","labor","overhead","premium"].reduce((t,k)=>t+d(k),0),spent={Fibre:d("occ"),Energy:d("energy"),Labour:d("labor"),Overhead:d("overhead"),"Premium freight":d("premium"),"Repairs & outages":d("repairs"),Upgrades:d("upgrades")};
  const rev=d("rev"),deals=d("deals"),earned=rev+Math.max(0,deals),spentT=Object.values(spent).reduce((t,v)=>t+v,0)+Math.max(0,-deals),net=earned-spentT;
  const rel={};RC_SEC.forEach(([k])=>rel[k]=a.up[k]/run);const relAvg=RC_SEC.reduce((t,[k])=>t+rel[k],0)/RC_SEC.length;
  const dn=Object.entries(a.dn).sort((x,y)=>y[1]-x[1]).slice(0,5),bnT=Object.values(a.bn).reduce((t,v)=>t+v,0)||1,bn=RC_STEPS.map(k=>[k,(a.bn[k]||0)/bnT]).sort((x,y)=>y[1]-x[1]);
  const price=priceOf(C.grade),cpt=prod>0?(ops+d("repairs"))/prod:0,margin=earned>0?(earned-(spentT-spent.Upgrades))/earned:0;
  return {days,prod,ship,rev,deals,earned,spent,spentT,net,ops,cpt,price,margin,rel,relAvg,avail:rel.machine,dn,bn,breaks:S.tot.breaks-a.brk0,hay:S.tot.hayouts-a.hay0,rolls:S.tot.rolls-a.rolls0,plan:a.plan};}
function rcMake(a,i){const p=rcSum(a),s=rcSum(S.rc.s);
  const g={Profit:rcGrade(p.margin,[0.30,0.22,0.14,0.06]),"Cost / ton":rcGrade(p.price>0?1-p.cpt/p.price:0,[0.32,0.25,0.18,0.10]),Downtime:rcGrade(p.avail,[0.95,0.91,0.86,0.80]),Reliability:rcGrade(p.relAvg,[0.96,0.92,0.88,0.82])};
  const gp={A:4,B:3,C:2,D:1,F:0},avg=Object.values(g).reduce((t,v)=>t+gp[v],0)/4,overall=avg>=3.5?"A":avg>=2.5?"B":avg>=1.5?"C":avg>=0.75?"D":"F";
  // one tip, aimed at the weakest spot
  const worst=Object.entries(g).sort((x,y)=>gp[x[1]]-gp[y[1]])[0][0],top=p.dn[0],bn=p.bn[0],lowSec=RC_SEC.map(([k,n])=>[n,p.rel[k]]).sort((x,y)=>x[1]-y[1])[0];
  const hrs=m=>(m/60).toFixed(m<600?1:0)+" h";
  let tip;
  if(worst==="Profit"){const rep=p.spent["Repairs & outages"]||0,pf=p.spent["Premium freight"]||0;
    tip=rep>p.earned*0.1?`Repairs and outage budgets took ${money(rep)}. Fewer breakdowns means fewer bills, so keep the machine and its crews ahead of trouble.`:pf>p.earned*0.05?`Premium freight cost ${money(pf)}. Keep the warehouse moving so trucks don't need rushing.`:`You kept ${Math.round(p.margin*100)}% of sales. Fibre and energy are your biggest costs, so every hour of downtime hurts.`;}
  else if(worst==="Downtime"&&top)tip=`${top[0]} cost you ${hrs(top[1])} this period. Respond fast when it hits, and give its area a bigger budget at the next outage.`;
  else if(worst==="Reliability")tip=`${lowSec[0]} was the least reliable section (${Math.round(lowSec[1]*100)}% up). Look at its upgrades and outage budget.`;
  else if(worst==="Cost / ton")tip=`Each ton cost ${money(p.cpt)} to make against a ${money(p.price)} price. Efficiency upgrades and fewer breaks bring that down.`;
  else if(bn&&bn[1]>0.4)tip=bn[0]==="Machine at full speed"?`The paper machine ran flat out ${Math.round(bn[1]*100)}% of the time, so it sets your output. Speed and drive upgrades pay back fastest.`:bn[0]==="Machine down"?`The machine being down held the mill back ${Math.round(bn[1]*100)}% of the time. Cut breaks and breakdowns first.`:`The ${bn[0].toLowerCase()} held the mill back ${Math.round(bn[1]*100)}% of the time. That's where an upgrade pays back fastest.`;
  else tip=overall==="A"?"Great running. Keep the machine up and the buffers healthy.":`Profit margin was ${Math.round(p.margin*100)}%. Shorter downtime is the quickest way to lift it.`;
  return {i,from:i*10+1,to:i*10+10,p,s,g,overall,tip};}
function rcHTML(c){const p=c.p,s=c.s,pc=v=>Math.round(v*100)+"%",hrs=m=>(m/60).toFixed(m<600?1:0)+" h",gc=x=>"rcg g"+x;
  const row=(k,a,b,cls)=>`<div class="rcr${cls?" "+cls:""}"><span>${k}</span><b>${a}</b><i>${b}</i></div>`;
  const bar=(k,v,lab,hot)=>`<div class="rcb${hot?" hot":""}"><span>${k}</span><div><em style="width:${Math.max(2,Math.round(v*100))}%"></em></div><b>${lab}</b></div>`;
  const maxDn=p.dn.length?p.dn[0][1]:1;
  return `<div class="rchead"><div><span class="dk">Report card · days ${c.from}–${c.to}</span><h2 id="rc-h">${MILL.name}</h2></div><div class="${gc(c.overall)} big" aria-label="Overall grade ${c.overall}">${c.overall}</div></div>
    <div class="rcgrades">${Object.entries(c.g).map(([k,v])=>`<div><div class="${gc(v)}">${v}</div><small>${k}</small></div>`).join("")}</div>
    <p class="rctip"><b>Tip</b> ${c.tip}</p>
    <h3>Money <small>these 10 days · season so far</small></h3>
    ${row("Earned (paper sales"+(p.deals>0?" + deals":"")+")",money(p.earned),money(s.earned),"pos")}
    ${Object.keys(p.spent).filter(k=>p.spent[k]||s.spent[k]).map(k=>row(k,money(-p.spent[k]),money(-s.spent[k]))).join("")}
    ${row("Net",money(p.net),money(s.net),"net "+(p.net>=0?"pos":"neg"))}
    <h3>Cost per ton <small>these 10 days · season so far</small></h3>
    ${row("Cost to make a ton",money(p.cpt),money(s.cpt))}${row("Selling price",money(p.price),money(s.price))}${row("Profit margin (before upgrades)",pc(p.margin),pc(s.margin))}
    ${row("Tons made",Math.round(p.prod).toLocaleString("en-US")+" t",Math.round(s.prod).toLocaleString("en-US")+" t")}
    <h3>Downtime <small>biggest issues, last 10 days</small></h3>
    ${p.dn.length?p.dn.map(([k,m],i)=>bar(k,m/maxDn,hrs(m),i===0)).join(""):`<p class="rcnone">Nothing went wrong. Remarkable.</p>`}
    <p class="rcnote">${p.breaks} sheet break${p.breaks===1?"":"s"} · ${p.hay} hayout${p.hay===1?"":"s"}${p.plan>0?` · ${hrs(p.plan)} planned outage (not counted)`:""}</p>
    <h3>Reliability <small>time each section was up</small></h3>
    ${RC_SEC.map(([k,n])=>bar(n,p.rel[k],pc(p.rel[k]),p.rel[k]<0.9)).join("")}
    <h3>Bottlenecks <small>share of time each step limited the mill</small></h3>
    ${p.bn.filter(([,v])=>v>0.005).map(([k,v],i)=>bar(k,v,pc(v),i===0)).join("")||`<p class="rcnone">Not enough running time to tell.</p>`}`;}
let rcEl=null;
function rcOpen(c,fromSummary){if(!rcEl){rcEl=document.createElement("div");rcEl.className="overlay";rcEl.id="rcOv";rcEl.style.zIndex="170";document.body.appendChild(rcEl);}
  if(!fromSummary){running=false;S.cards.open={report:true};}
  rcEl.innerHTML=`<div class="modal deal outg rc" role="dialog" aria-modal="true" aria-labelledby="rc-h">${rcHTML(c)}<div class="btns"><button class="primary" id="rc-ok" style="flex:1">${fromSummary?"Close":"Back to the mill"}</button></div></div>`;
  rcEl.hidden=false;AUDIO.sfx(c.overall<="B"?"win":"cash",150);
  document.getElementById("rc-ok").addEventListener("click",()=>{rcEl.hidden=true;if(!fromSummary)closeCard(true);});rcEl.querySelector(".modal").scrollTop=0;document.getElementById("rc-ok").focus({preventScroll:true});}
function rcFinal(){const R=S.rc;if(!R)return null;const c=rcMake(R.p,R.i);R.cards.push(c);return c;}
function seasonTick(){const se=S.season;if(!se||!se.on||se.done)return;
  if(S.t>=se.end||S.cash<ECON.bankrupt)endSeason(S.cash<ECON.bankrupt);}
function seasonResult(){return {score:Math.round(S.cash-ECON.start),tons:Math.round(S.shipT||0),incidents:S.tot.incidents,mill:MILL.name.slice(0,40),version:APP_VER.slice(0,12),days:SEASON_DAYS};}
function endSeason(bust){const se=S.season;se.done=true;se.on=false;running=false;
  if(document.body.classList.contains("fs"))setFS(false);seasonLocks(false);
  const r=seasonResult();se.result=r;AUDIO.sfx(r.score>0?"win":"lose",100);
  $("so-h").textContent=bust?"Season over: bankrupt":"Season complete";
  $("so-p").textContent=bust?`${MILL.name} ran out of money before day ${SEASON_DAYS}.`:`${SEASON_DAYS} days at ${MILL.name}.`;
  const eff=S.tot.pot>0?S.tot.prodT/S.tot.pot:1,g=RATINGS.find(x=>eff>=x[0]);
  const st=[["Net profit",money(r.score),"big"],["Tons shipped",f0(r.tons)+" t"],["Disasters survived",String(r.incidents)],["Rolls made",String(S.tot.rolls)],["Grade",g[1]+" · "+g[2]]];
  $("so-stats").replaceChildren(...st.map(([k,v,c])=>{const d=document.createElement("div");if(c)d.className=c;const a=document.createElement("span");a.textContent=k;const b=document.createElement("b");b.textContent=v;d.append(a,b);return d;}));
  {const c=bust?null:rcFinal(),box=$("so-rc");if(box){if(c){box.hidden=false;box.innerHTML=`<div class="rcmini"><div class="rcg g${c.overall}">${c.overall}</div><div><b>Days ${c.from}–${c.to} report card</b><small>${Object.entries(c.g).map(([k,v])=>k+" "+v).join(" · ")}</small><p>${c.tip}</p></div></div><button id="so-rcbtn" class="ghost">Open the full report card</button>`;
      $("so-rcbtn").addEventListener("click",()=>rcOpen(c,true));}else box.hidden=true;}}
  let nm="";try{nm=localStorage.getItem("paper-mill-player")||"";}catch(e){}$("so-name").value=nm;
  $("so-submit").disabled=false;$("so-submit").textContent=lbOn()?"Submit score":"Save score";setMsg("");$("seasonOv").hidden=false;$("so-name").focus();}
function setMsg(t,c){const m=$("so-msg");m.textContent=t;m.className="somsg"+(c?" "+c:"");}
function saveLocal(r,name){try{const L=JSON.parse(localStorage.getItem("paper-mill-local-scores")||"[]");L.push({...r,name,created_at:new Date().toISOString(),local:1});
  L.sort((a,b)=>b.score-a.score||b.tons-a.tons);localStorage.setItem("paper-mill-local-scores",JSON.stringify(L.slice(0,20)));}catch(e){}}
async function submitScore(){const r=S.season&&S.season.result;if(!r||S.free)return;const name=$("so-name").value.replace(/\s+/g," ").trim();
  if(!/^[A-Za-z0-9 ._'-]{2,16}$/.test(name)){setMsg("Use 2–16 letters, numbers, spaces or . _ ' -","bad");return;}
  try{localStorage.setItem("paper-mill-player",name);}catch(e){}
  if(!S.season.saved){S.season.saved=1;saveLocal(r,name);}
  if(!lbOn()){setMsg("Saved on this device. The online leaderboard isn't connected yet.","ok");$("so-submit").disabled=true;return;}
  $("so-submit").disabled=true;setMsg("Submitting…");
  try{const res=await fetch(LB.url.replace(/\/$/,"")+"/rest/v1/scores",{method:"POST",headers:lbHdr({"Content-Type":"application/json",Prefer:"return=minimal"}),body:JSON.stringify({...r,name})});
    if(!res.ok){let msg="Couldn't submit ("+res.status+")";try{const j=await res.json();if(j&&j.message)msg=j.message;}catch(e){}throw new Error(msg);}
    setMsg("Submitted! You're on the board.","ok");S.season.submitted=name;openBoard();}
  catch(e){setMsg(String(e.message||e),"bad");$("so-submit").disabled=false;}}
async function openBoard(){$("lbOv").hidden=false;const L=$("lb-list");L.replaceChildren(Object.assign(document.createElement("div"),{className:"lbempty",textContent:"Loading…"}));
  let rows=[],note="";
  if(lbOn()){try{const res=await fetch(LB.url.replace(/\/$/,"")+"/rest/v1/scores?select=name,score,tons,incidents,mill,created_at&order=score.desc,tons.desc&limit=100&and=(version.not.like.v1.*,version.not.like.v2.0.*,version.not.like.v2.1.*)",{headers:lbHdr()});
      if(!res.ok)throw new Error(res.status);rows=await res.json();}catch(e){note="Couldn't reach the leaderboard. Showing scores saved on this device.";}}
  else note="Online leaderboard not connected yet. Showing scores saved on this device.";
  if(note){try{rows=JSON.parse(localStorage.getItem("paper-mill-local-scores")||"[]").filter(r=>!/^v(1\.|2\.[01]\.)/.test(r.version||""));}catch(e){rows=[];}}
  $("lb-sub").textContent=note||"Top 100 · 30-day seasons · ranked by net profit";
  if(!rows.length){L.replaceChildren(Object.assign(document.createElement("div"),{className:"lbempty",textContent:"No scores yet. Start a season and set the bar."}));return;}
  let me="";try{me=localStorage.getItem("paper-mill-player")||"";}catch(e){}
  L.replaceChildren(...rows.map((r,i)=>{const d=document.createElement("div");d.className="lbrow"+(me&&r.name===me?" me":"");
    const mk=(c,t)=>Object.assign(document.createElement("span"),{className:c,textContent:t});
    const dt=r.created_at?new Date(r.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric"}):"";
    d.append(mk("r",i+1),mk("n",r.name),mk("sc",money(r.score)),mk("m",[r.mill,f0(r.tons)+" t shipped",(r.incidents??"")+" disasters",dt].filter(Boolean).join(" · ")));return d;}));}
function setFree(on){S.free=on;
  if(on&&S.season&&S.season.on){S.season=null;seasonLocks(false);BANNERS.push({text:"Season abandoned: free play scores can't go on the leaderboard.",t:null});}
  if(on)BANNERS.push({text:"Free play: upgrades are free and you can't go bankrupt. No leaderboard.",t:null,kind:"good"});
  updateShop();}
// zen mode: endless, calm screensaver of the mill
let ZEN=null;
// zen film grain: made the first time zen mode starts (encoding it at load cost up to a second)
let grainDone=false;function makeGrain(){if(grainDone)return;grainDone=true;const c=document.createElement("canvas");c.width=c.height=128;const x=c.getContext("2d"),im=x.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}
  x.putImageData(im,0,0);document.documentElement.style.setProperty("--grain",`url(${c.toDataURL()})`);}
function setZen(on){if(on===!!ZEN)return;
  if(on){makeGrain();if(S.season&&S.season.on){S.season=null;seasonLocks(false);}
    ZEN={speed:C.simSpeed,chaos:CH.on,hays:C.hays,breaks:C.breaks,view:G3.on};
    S.inc=[];if(S.wd==="hayout")S.wd="run";if(S.pm==="break"){S.pm="run";}BANNERS.length=0;S.zen=true;
    CH.on=false;$("chaosOn").checked=false;C.hays=false;C.breaks=false;
    setSimSpeed(1);
    document.body.dataset.zs="none";document.body.classList.add("zen");setFS(true);G3.zen=true;G3.zenS=null;
    if(soundPref==="on"&&!AUDIO.on)setSound(true);running=true;zenPoke();}
  else{const z=ZEN;ZEN=null;S.zen=false;G3.zen=false;document.body.classList.remove("zen");
    CH.on=z.chaos;$("chaosOn").checked=z.chaos;C.hays=z.hays;C.breaks=z.breaks;setSimSpeed(z.speed);
    setFS(false);if(G3.showMenu)G3.showMenu();}}
let zenT=0;function zenPoke(){const b=$("zenExit");b.hidden=false;b.classList.add("show");clearTimeout(zenT);zenT=setTimeout(()=>b.classList.remove("show"),2500);}
$("zenExit").addEventListener("click",e=>{e.stopPropagation();setZen(false);});
["pointermove","pointerdown"].forEach(t=>document.addEventListener(t,()=>{if(ZEN)zenPoke();},{passive:true}));
$("so-more").addEventListener("click",()=>{$("seasonOv").hidden=true;running=true;});
$("so-submit").addEventListener("click",submitScore);$("so-name").addEventListener("keydown",e=>{if(e.key==="Enter")submitScore();e.stopPropagation();});
$("so-board").addEventListener("click",openBoard);$("so-new").addEventListener("click",()=>{$("seasonOv").hidden=true;startSeason();});
$("lb-close").addEventListener("click",()=>$("lbOv").hidden=true);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("lbOv").hidden)$("lbOv").hidden=true;});
const RATINGS=[[0.95,"A","Bonus secured"],[0.85,"B","Solid shift"],[0.75,"C","Corporate is asking questions"],[0.6,"D","Mandatory 6 a.m. meeting"],[0,"F","Your parking spot has been reassigned"]];
let feedKey="";
function updateChaos(){
  const days=(S.t-S.lastInc)/1440;$("c-days").textContent=days.toFixed(1);$("c-sign").classList.toggle("hot",S.inc.length>0);
  const eff=S.tot.pot>0?S.tot.prodT/S.tot.pot:1,r=RATINGS.find(x=>eff>=x[0]);
  const g=$("c-grade");g.textContent=r[1];g.className="g "+r[1];$("c-grade-t").textContent=r[2];$("c-grade-s").textContent=`${(eff*100).toFixed(1)}% of max-speed tons made`;
  $("c-lost").textContent=f0(Math.max(0,S.tot.pot-S.tot.prodT))+" t";$("c-count").textContent=S.tot.incidents;
  const act=$("c-active");act.replaceChildren();
  if(!S.inc.length){const s=document.createElement("span");s.className="none";s.textContent="No active incidents.";act.appendChild(s);}
  S.inc.forEach(i=>{const d=document.createElement("div");d.className="it";d.textContent=EV[i.id].name;const sm=document.createElement("small");
    const cs=incState(i)||(MNEED(i.id)?"maintenance working":QINC(i.id)?crewState(i.id):"");sm.textContent=`${(i.left/60).toFixed(1)} h left${cs?" · "+cs:""}${i.note?" · "+i.note:""}`;d.appendChild(sm);act.appendChild(d);});
  EVENTS.forEach(e=>{const b=$("ev-"+e.id),i=S.inc.find(x=>x.id===e.id);if(!b)return;b.setAttribute("aria-pressed",i?"true":"false");
    b.querySelector("small").textContent=i?`${(i.left/60).toFixed(1)} h`:"";b.title=i?"Click to clear this incident":"Click to trigger now";});
  const k=S.feed.length+"|"+(S.feed[0]?S.feed[0].t:"");
  if(k!==feedKey){feedKey=k;const fd=$("c-feed");fd.replaceChildren();
    if(!S.feed.length){const s=document.createElement("span");s.textContent="Incident log is empty.";fd.appendChild(s);}
    S.feed.forEach(x=>{const d=document.createElement("div");d.className=x.cls;const t=document.createElement("span");t.textContent=hhmm(x.t)+"  ";d.appendChild(t);d.append(x.text);fd.appendChild(d);});}
}
function pill(id,text,cls){const el=$(id);el.textContent=text;el.className="pill "+(cls||"");}
const f0=v=>Math.round(v).toLocaleString(), f1=v=>v.toFixed(1);
function hhmm(t){t+=360;const day=Math.floor(t/1440),h=Math.floor((t%1440)/60),base=(S&&S.date0)||new Date().setHours(0,0,0,0);
  const d=new Date(base+day*864e5),h12=h%12||12;return `${d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})} · ${h12} ${h<12?"AM":"PM"}`;}

function updateText(){
  const R=S.rates,level=S.tank/P.tankCap*100,days=Math.max(S.t/1440,1/1440);
  $("k-clock").textContent=hhmm(S.t)+(S.wx&&S.wx!=="clear"?" · "+WXN[S.wx]:"");
  $("k-clock-s").textContent=`${C.simSpeed} sim min per second`;
  $("k-speed").textContent=f0(S.pmSpeed)+" fpm";
  $("k-speed-s").textContent=`max ${f0(C.pmSp.v)} · ${C.grade}`;
  $("k-prod").textContent=f1(R.prod)+" t/h";
  $("k-prod-s").textContent=`${f0(S.tot.prodT)} t made · ${f0(S.tot.prodT/days)} t/day`;
  $("k-cash").textContent=money(S.cash);$("k-cash-box").classList.toggle("neg",S.cash<0);
  $("k-cash-s").textContent=S.cash<0?`bankrupt at ${money(ECON.bankrupt)}`:`${(100*Math.max(0,S.cash)/ECON.goal).toFixed(1)}% of the $25M goal`;
  {const t=money(S.profitRate)+"/day";$("k-profit").textContent=t;$("k-profit").style.color=/^[−-]/.test(t)?"var(--bad)":"var(--ink)";}
  $("k-profit-s").textContent=`operating, last 12 h · ${money(priceOf(C.grade))}/t`;
  $("k-tank").textContent=f0(level)+" %";
  const net=R.fiberIn-R.fiberUse;
  $("k-tank-s").textContent=`${net>=0?"+":"−"}${f1(Math.abs(net))} t/h ${Math.abs(net)<0.5?"balanced":net>0?"building":"draining"}`;
  $("k-yard").textContent=f0(S.yard)+" t";
  $("k-yard-s").textContent=R.feed>0.5?`${f1(S.yard/R.feed)} h of pulper feed`:"pulper not feeding";
  $("k-fg").textContent=f0(S.fg)+" rolls";
  $("k-fg-s").textContent=`${f0(S.tot.shipped)} shipped`;

  // pills + readouts
  pill("p-in",S.tot.turned?`${S.tot.turned} turned away`:S.inQ.length>2?`${S.inQ.length} waiting`:"flowing",S.tot.turned?"bad":S.inQ.length>2?"warn":"ok");
  $("r-in").textContent=`${S.tot.inTrucks} trucks · ${f0(S.tot.inTons)} t received · queue ${S.inQ.length} · at doors ${S.inDock.filter(Boolean).length}/${P.doors}`;
  const recCap=S.effDrv*P.driverRate*S.M.recvMul, recUse=(P.autoFeed?0:R.feed)+R.unload;
  pill("p-rec",S.M.crewAtPM?"crew at the PM":S.yard<1?"yard empty":recUse>recCap*0.95?"crew maxed":S.yard>=P.yardCap-1?"yard full":"ok",S.M.crewAtPM?"warn":S.yard<1?"bad":recUse>recCap*0.95||S.yard>=P.yardCap-1?"warn":"ok");
  $("r-rec").textContent=`${S.effDrv<C.drivers.v?`Only ${S.effDrv} of ${C.drivers.v} working · `:""}Crew ${f0(recUse)}/${f0(recCap)} t/h busy · feeding ${f1(R.feed)} · unloading ${f1(R.unload)} t/h`;
  const pulHold=level>97, pulStarve=R.feed<C.pulper.v*0.9&&C.pulper.v>1&&!pulHold;
  pill("p-pul",S.M.pulperDown?"down: incident":pulHold?"hold: chest full":pulStarve?"short of bales":C.pulper.v<0.5?"off":"running",S.M.pulperDown?"bad":pulHold||pulStarve?"warn":C.pulper.v<0.5?"":"ok");
  $("r-pul").textContent=`Fed ${f1(R.feed)} t/h OCC → ${f1(R.fiberIn)} t/h fiber (88% yield)`;
  pill("p-tank",level<5?"empty":level<C.lowLevel.v?"low":level>95?"full":"ok",level<C.lowLevel.v?"bad":level>95?"warn":"ok");
  $("r-tank").textContent=`${f0(S.tank)} of ${P.tankCap} t · in ${f1(R.fiberIn)} · out ${f1(R.fiberUse)} t/h`;
  const pmTxt={run:S.pmSpeed<C.pmSp.v-40&&level<C.lowLevel.v?"slowed: low stock":S.pmSpeed<C.pmSp.v-40?"ramping":"at max speed",break:"sheet break",down:"down: no stock",full:"down: warehouse full",spools:"down: winder backed up",incident:"down: "+(S.M.pmDown||"incident")}[S.pm];
  pill("p-pm",pmTxt,S.pm==="run"?(pmTxt==="at max speed"?"ok":"warn"):"bad");
  const eff=S.t>0?100*(1-S.tot.breakMin/S.t):100;
  $("r-pm").textContent=`${f1(R.prod/C.rollW.v)} rolls/h · ${S.tot.turnups} reels turned up · ${S.tot.breaks} breaks · ${f0(eff)}% sheet time`;
  const reelsW=Math.max(0,reelsAtWinder()-1);
  pill("p-wd",S.wd==="hayout"?"hayout: "+(working("hay")?"crew cleaning":crewState("hay")||"crew cleaning"):S.M.winderDown?"winder down":S.wdBlocked?"roll conveyor full":reelsW>=P.storeReels?"storage full":R.cut>0.5?"winding":"waiting for reel",S.wd==="hayout"||S.M.winderDown||S.wdBlocked?"bad":reelsW>=P.storeReels?"warn":R.cut>0.5?"ok":"");
  $("r-wd").textContent=`${reelsW}/${P.storeReels} reels in storage · ${Math.floor(S.conv||0)}/${P.convCap} rolls on the conveyor · cutting ${f1(R.cut)} t/h · ${S.tot.hayouts} hayouts · ${f1(S.tot.broke)} t broke`;
  const shipCap=S.effLd*P.loaderRate*S.M.clampMul;
  pill("p-ship",S.M.crewAtPM?"crew at the PM":S.fg>=P.fgCap-1?"warehouse full":S.conv>P.convCap*0.7?"rolls waiting for clamps":S.outQ.length>2?`${S.outQ.length} trucks waiting`:S.fg<5&&S.outDock.some(Boolean)?"no rolls":"ok",S.M.crewAtPM?"warn":S.fg>=P.fgCap-1?"bad":S.outQ.length>2||(S.fg<5&&S.outDock.some(Boolean))?"warn":"ok");
  $("r-ship").textContent=`${S.effLd<C.loaders.v?`Only ${S.effLd} of ${C.loaders.v} loaders · `:""}Putting away ${f1(R.put||0)} rolls/h · loading ${f1(R.load)} of ${f0(shipCap)} rolls/h · ${S.outDock.filter(Boolean).length}/${P.shipDoors} doors · ${S.tot.shipped/P.truckRolls} trucks out`;
}

