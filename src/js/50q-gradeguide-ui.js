/* ---- v6.14 the grade change coach on the WET DCS (free play; the model is 07r) ---- */
function ggBox(){const w=kEl("div","dcsrow wide ggbox");w.dataset.ord="gg";w.id="ggBox";
  w.addEventListener("click",e=>{const t=e.target.closest("[data-gg]");if(!t)return;const a=t.dataset.gg;
    if(a==="start"){const s=w.querySelector("[data-ggto]");if(s)ggStart(s.value);}else if(a==="next")ggNext();else if(a==="crew")ggEnd("auto");ggSync(true);});
  return w;}
function ggSync(force){const w=$("ggBox");if(!w||!S)return;const G=S.gg;
  if(!G){const L=S.ggLast&&S.ggLast.res,key="idle"+C.grade+(L?L.off:"");if(!force&&w._k===key)return;w._k=key;
    w.innerHTML=`<div class="dcsn"><b>Guided grade change</b><small>Free play: walk the machine to another grade yourself, speed and weight together in steps</small></div>
      <div class="ggrow"><select data-ggto aria-label="Grade to change to">${Object.keys(GRADES).filter(g=>g!==C.grade).map(g=>`<option value="${g}">${g} · ${GRADES[g].bw} lb</option>`).join("")}</select>
      <button type="button" class="reroll vpri" data-gg="start"${S.chg?" disabled":""}>Start</button></div>
      ${L?`<p class="ggres">Last change ${S.ggLast.from} → ${S.ggLast.to}: ${L.off.toFixed(1)} t to the beater in ${L.mins} min (the crew's automatic change: about ${L.auto.toFixed(0)} t).</p>`:""}`;return;}
  const st=ggSettled(),sp=QSPEC[C.grade]||QSPEC["24"],m=S.dry?S.dry.m:DRY.m0,off=Math.max(0,(S.q.off||0)-G.off0);
  const rows=[];for(let k=0;k<=G.n;k++){const s=k?ggStepOf(G,k):{bw:G.bw0,sp:G.sp0};rows.push(`<tr class="${k===G.k?"cur":k<G.k?"done":""}"><td>${k?k===G.n?`${k} · ${G.to}`:k:"start"}</td><td>${s.bw.toFixed(2)} lb</td><td>${Math.round(s.sp).toLocaleString()} fpm</td><td>${Math.round(P.K*s.sp*s.bw)} t/h</td></tr>`);}
  const ck=(ok,t)=>`<li class="${ok?"ok":"wait"}">${ok?"✓":"…"} ${t}</li>`;
  const html=`<div class="dcsn"><b>Guided grade change ${G.from} → ${G.to}</b><small>Step ${G.k} of ${G.n}: speed and weight move together so the tons an hour hold and the dryers keep up</small></div>
    <table class="ggt"><thead><tr><th>Step</th><th>Weight</th><th>Speed</th><th>Tons</th></tr></thead><tbody>${rows.join("")}</tbody></table>
    <ul class="ggck">${ck(st.bw,`Weight on the QCS ${bwMeas().toFixed(2)} lb vs ${G.bw.toFixed(2)} setpoint (the scanner reads ${WE.dead} min late)`)}${ck(st.m,`Moisture ${m.toFixed(1)}% · ${C.grade} spec ${sp.m[0]}–${sp.m[1]}%`)}${ck(st.t,`Settling: ${Math.min(GG.settle,Math.round(S.t-G.ts))} of ${GG.settle} min on this step`)}</ul>
    <p class="ggres">${off.toFixed(1)} t to the beater so far · the crew's automatic change: about ${G.auto.toFixed(0)} t. ${G.k<G.n?`The machine is still on ${G.from}: paper between grades fails its spec, so keep the steps moving once each settles.`:"Last step: done when weight and moisture settle on the new grade."}</p>
    <div class="ggrow">${G.k<G.n?`<button type="button" class="reroll${st.ok?" vpri":""}" data-gg="next">${st.ok?"Next step":"Next step now (not settled)"}</button>`:""}<button type="button" class="reroll" data-gg="crew">Hand back to the crew</button></div>`;
  if(force||w._h!==html){w._h=html;w._k="";w.innerHTML=html;}}
UI_TICKS.push(()=>{const o=$("dcsOv");if(o&&!o.hidden&&KUI.st==="WET")ggSync();});
G3.gg={start:ggStart,next:ggNext,settled:ggSettled,end:ggEnd,step:ggStepOf,bwMeas:()=>bwMeas(),on:ggOn};   // (test hook)
