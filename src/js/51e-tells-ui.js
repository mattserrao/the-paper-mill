/* ---------- v5.7 Catching failures early: the UI (the model is 04b-tells.js, the 3D tells and the walk 33b-3d-tells.js) ----------
   One Round button in the dock; its card is the Vibration Report (the areas with trend arrows when the report is
   unlocked) and starting a Round is a tap on an area. While the walk runs, a slim strip counts down. The outage prep
   checklist opens from the outage countdown under the clock, and the same block sits in the 24-hour budget dialog. */
{const TAB=document.querySelector(".v2tabs");let btn=null,ov=null,strip=null,cur=null;
  // ---- the dock button ----
  if(TAB){btn=document.createElement("button");btn.type="button";btn.id="v2round";btn.className="v2round";btn.hidden=true;
    btn.innerHTML=`<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><path d="M9 4h6v3H9z"></path><path d="M9 5.5H6.5V21h11V5.5H15"></path><path d="M9 12l2 2 4-4"></path></svg>Round<i class="rdot" hidden></i>`;
    TAB.appendChild(btn);btn.addEventListener("click",()=>{if(cur)return;tellOpen();});}
  function shell(id){let el=document.getElementById(id);if(!el){el=document.createElement("div");el.className="overlay tellov";el.id=id;el.hidden=true;document.body.appendChild(el);
      el.addEventListener("click",e=>{if(e.target===el)el.hidden=true;});}return el;}
  const ARROW=["→","↗","⇈"],AWORD=["steady","climbing","climbing fast"];
  // ---- the Round card (the Vibration Report) ----
  function tellOpen(){if(!tellsOn())return;ov=shell("tellOv");const can=tellCan(),rep=tellRep();
    ov.innerHTML=`<div class="modal deal tellcard" role="dialog" aria-modal="true" aria-labelledby="tell-h"><span class="dk">Daily round${rep?" · Vibration Report":""}</span>
      <h2 id="tell-h">${can?"Where should the operator walk?":"Today's round is done"}</h2>
      <p>${can?"An operator walks one area for about 15 seconds. Tap any failing equipment you spot: a planned repair now costs far less than the breakdown.":"One round a day. The next one is available at 6 AM."}</p>
      ${rep?"":`<p class="tnorep">Get the Reliability program (Upgrades → Maintenance) to see vibration trends here.</p>`}
      <div class="tareas">${TAREAS.filter(a=>a.ids.some(id=>!EV[id].env||EV[id].env===SITE.env)).map(a=>{const v=rep?tellTrend(a.k):-1;
        return `<button type="button" class="tarea" data-a="${a.k}"${can?"":" disabled"}><span><b>${escHTML(a.n)}</b><small>${escHTML(a.ids.filter(id=>!EV[id].env||EV[id].env===SITE.env).map(id=>EV[id].name.replace(/^(\w)(\w*)/,(m,a,b)=>b&&b===b.toUpperCase()?m:a.toLowerCase()+b)).slice(0,3).join(", "))}…</small></span>${v>=0?`<em class="tv tv${v}" title="${AWORD[v]}">${ARROW[v]}<small>${AWORD[v]}</small></em>`:""}</button>`;}).join("")}</div>
      ${(()=>{const f=prepFor();if(!f)return "";const pr=prepState(f.k),tl=prepTally(pr);return `<button type="button" class="tprep" id="tell-prep"><span><b>Outage ${f.k} prep checklist</b><br><small>${prepLine(tl.n,tl.m)}</small></span><span aria-hidden="true">›</span></button>`;})()}
      <div class="btns"><button type="button" id="tell-x" style="flex:1">Close</button></div></div>`;
    {const pb=ov.querySelector("#tell-prep");if(pb)pb.addEventListener("click",()=>{ov.hidden=true;prepOpen();});}
    ov.querySelectorAll(".tarea").forEach(b=>b.addEventListener("click",()=>{ov.hidden=true;roundGo(b.dataset.a);}));
    ov.querySelector("#tell-x").addEventListener("click",()=>{ov.hidden=true;});ov.hidden=false;const f=ov.querySelector(".tarea:not([disabled])")||ov.querySelector("#tell-x");if(f)f.focus({preventScroll:true});}
  G3.tellOpen=tellOpen;
  // ---- a Round ----
  function roundGo(a){if(!tellRoundStart(a))return;cur={a,n:0};
    if(!strip){strip=document.createElement("div");strip.id="tellStrip";strip.className="tellstrip";strip.setAttribute("role","status");document.body.appendChild(strip);}
    strip.hidden=false;paintStrip();
    const done=()=>{const c=cur;cur=null;strip.hidden=true;if(!c)return;const r=tellRoundEnd(c.a,c.n),n=TAREAK[c.a].n.toLowerCase();
      const text=c.n?`Round done: ${c.n} caught in ${n}.`:r.clean?`Clean walk through ${n}. ${civOn()?civTxt(r.d)+".":""}`:`Round over: something in ${n} went unnoticed.`;
      if(c.n)log(text,"ok");BANNERS.push({text,t:null,kind:c.n||r.clean?"good":undefined,tag:"ROUND"});while(BANNERS.length>3)BANNERS.splice(1,1);};
    if(G3.tellRound&&G3.on!==false&&G3.tellRound(a,TELL.roundS,done))return;
    // no 3D view (tests, ?no3d): the walk still takes its time, with nothing to tap
    cur.no3d=true;let left=TELL.roundS*1000;const tk=setInterval(()=>{if(running)left-=200;if(left<=0){clearInterval(tk);done();}},200);}
  G3.tellRoundUI=roundGo;
  G3.onTellCaught=id=>{if(!cur)return;const r=tellCatch(id);if(!r)return;cur.n++;AUDIO.sfx("cash",150);
    BANNERS.push({text:`Caught: ${r.txt}. Planned repair ${money(r.cost)}, no downtime.`,t:null,kind:"good",tag:"ROUND"});while(BANNERS.length>3)BANNERS.splice(1,1);paintStrip();};
  function paintStrip(){if(!strip||!cur)return;const s=Math.ceil(G3.tellRoundLeft?G3.tellRoundLeft():0),t=`<b>Round · ${escHTML(TAREAK[cur.a].n)}</b><span>${s} s</span><small>${cur.n?`${cur.n} caught · `:""}tap anything failing</small>`;
    if(strip.innerHTML!==t)strip.innerHTML=t;}
  UI_TICKS.push(()=>{if(btn){const on=tellsOn(),can=on&&tellCan()&&!cur;if(btn.hidden===on){btn.hidden=!on;TAB.classList.toggle("r5",on);}
      if(on){const dot=btn.querySelector(".rdot");if(dot.hidden===can)dot.hidden=!can;const tt=cur?"Round under way":can?"Daily round: walk an area":"Today's round is done. Next one at 6 AM";if(btn.title!==tt){btn.title=tt;btn.setAttribute("aria-label",tt);}btn.classList.toggle("used",!can&&!cur);}}
    if(cur){if(!tellsOn()||(G3.tellRoundOn&&!G3.tellRoundOn()&&!cur.no3d)){if(G3.tellRoundStop)G3.tellRoundStop();cur=null;if(strip)strip.hidden=true;}else paintStrip();}});
  // ---- the outage prep checklist ----
  const hm=m=>m>=60?Math.floor(m/60)+" h"+(m%60?" "+Math.round(m%60)+" m":""):Math.max(0,Math.round(m))+" min";
  function prepHTML(f){const pr=prepState(f.k),it=pr.it,P2=PREP.parts,t=prepTally(pr);
    const row=(X,body)=>{const open=prepUnlocked(X,f.left);return `<div class="prow${open?"":" locked"}" data-i="${X.k}"><div><b>${escHTML(X.n)}</b><small>${escHTML(X.d)}</small></div><div class="pact">${open?body:`<em>opens in ${hm(f.left-X.at)}</em>`}</div></div>`;};
    const done=s=>`<em class="pdone">✓ ${s}</em>`;
    const parts=it.parts?(it.parts.got?done(it.parts.how==="now"?"ordered":it.parts.how==="rush"?"rush-ordered":"cheap lot arrived · −"+P2.min+" min"):it.parts.res?`<div class="seg"><button data-c="rush">Rush ${money(P2.rush)}</button></div><small class="pw">The cheap lot didn't make it</small>`:`<em class="pwait">cheap lot on order · arrives or not 24 h out</em>`)
      :`<div class="seg"><button data-c="now">Order now ${money(P2.now)}</button><button data-c="wait">Wait for a cheaper lot ${money(P2.wait)}</button></div><small class="pw">−${P2.min} min. The cheaper lot arrives half the time.</small>`;
    const crew=it.crew?done(`walked · −${PREP.crew.min} min`):`<div class="seg"><button data-c="go">Walk it · free</button></div><small class="pw">−${PREP.crew.min} min, Labor +1</small>`;
    const contr=it.contr?done(it.contr==="in"?`contractors booked · −${PREP.contr.min} min`:`own crew · −${PREP.contr.own} min`):`<div class="seg"><button data-c="in">Bring them in ${money(PREP.contr.cost)}</button><button data-c="own">Own crew · free</button></div><small class="pw">Contractors −${PREP.contr.min} min, Labor −1. Own crew −${PREP.contr.own} min.</small>`;
    const draw=it.draw?done(`drawing down · −${PREP.draw.min} min`):`<div class="seg"><button data-c="go">Draw down</button></div><small class="pw">−${PREP.draw.min} min. The machine runs at ${Math.round(PREP.draw.cap*100)}% until the shutdown.</small>`;
    const B={parts,crew,contr:contr,draw};
    return `<div class="prep"><div class="phead"><b>Outage ${f.k} prep</b><span>${prepLine(t.n,t.m)}</span></div><small class="psub">Each item done shortens the outage and returns ${Math.round(PREP.refund*100)}% of its budget when it ends. Starts in ${hm(f.left)}.</small>${PREP.items.map(X=>row(X,B[X.k])).join("")}</div>`;}
  // mount (and re-mount after every choice) into a host element: the prep card or the budget dialog
  function prepMount(host){if(!host)return;const f=prepFor();if(!f){host.innerHTML="";return;}host.innerHTML=prepHTML(f);
    host.querySelectorAll(".prow").forEach(r=>r.querySelectorAll("button[data-c]").forEach(b=>b.addEventListener("click",()=>{if(prepDo(r.dataset.i,b.dataset.c)){AUDIO.sfx("cash",120);prepMount(host);}})));}
  G3.prepMount=prepMount;
  function prepOpen(){const f=prepFor();if(!f)return false;const el=shell("prepOv");
    el.innerHTML=`<div class="modal deal outg prepcard" role="dialog" aria-modal="true" aria-labelledby="prep-h"><span class="dk">Planned outage ${f.k} · checklist</span><h2 id="prep-h">Outage ${f.k} prep</h2><div id="prep-body"></div><div class="btns"><button type="button" id="prep-x" style="flex:1">Close</button></div></div>`;
    prepMount(el.querySelector("#prep-body"));el.querySelector("#prep-x").addEventListener("click",()=>{el.hidden=true;});el.hidden=false;return true;}
  G3.prepOpen=prepOpen;
  // the countdown under the clock opens it (only while a checklist is open; otherwise the tap expands the top bar as before)
  {const cd=document.getElementById("v2cd");if(cd)cd.addEventListener("click",e=>{if(prepFor()){e.stopPropagation();e.preventDefault();prepOpen();}},true);}
  // keep an open prep card current (items unlock as the clock runs)
  UI_TICKS.push(n=>{if(n%5)return;const el=document.getElementById("prepOv");if(el&&!el.hidden){const b=el.querySelector("#prep-body");if(!prepFor()){el.hidden=true;return;}if(b&&!b.contains(document.activeElement))prepMount(b);}});
}
