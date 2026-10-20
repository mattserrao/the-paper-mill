/* ---- v6.9 Report > Control room > Manning: who is on shift now. The team on, each tech and operator with their hat
   colour, who is covering a vacation (overtime pickup or swap, and from which team), any gap left unfilled, and the
   time to the next shift change. The model is 03f-manning.js. ---- */
const MANUI={open:false,key:""};
const MAN_SEAT=k=>k<7?"Machine floor":"Stock prep";
function manOv(){let o=$("manOv");if(o)return o;
  o=kEl("div","overlay top dcsov manov");o.id="manOv";o.hidden=true;
  o.innerHTML=`<div class="dcs manw" role="dialog" aria-modal="true" aria-labelledby="man-h"><div class="dcsh"><b id="man-h">MANNING</b><span class="manclk" id="manClk"></span>
    <button aria-label="Close" class="dcsx" id="manClose">✕</button></div><div class="manb" id="manB" aria-live="polite"></div>
    <div class="dcsf"><span>DuPont 12: four teams, 12-hour shifts, 6 to 6. Vacations are covered by someone off who isn't working the shift before or after.</span></div></div>`;
  document.body.appendChild(o);
  $("manClose").addEventListener("click",()=>manClose());o.addEventListener("click",e=>{if(e.target===o)manClose();});
  return o;}
function manOpen(){const o=manOv();if(G3.closeKnobUI)G3.closeKnobUI();MANUI.open=true;MANUI.key="";o.hidden=false;manDraw();
  setTimeout(()=>{try{$("manClose").focus({preventScroll:true});}catch(_){}},0);}
function manClose(){const o=$("manOv");if(o)o.hidden=true;MANUI.open=false;}
document.addEventListener("keydown",e=>{if(e.key!=="Escape"||!MANUI.open)return;e.preventDefault();e.stopPropagation();manClose();},true);
const manHat=T=>`<i class="manhat" style="background:${MAN.HAT[T]}" title="${T} team"></i>`;
function manRow(r,seat){const h=r.home,w=r.who;
  if(!w)return `<li class="mangap"><i class="manhat manno"></i><span><b>Unfilled</b><small>${seat} · ${h.name} (${h.team}) on vacation</small></span><em class="manbad">Short</em></li>`;
  const note=r.cover?`${seat} · covering for ${h.name}, on vacation`:seat,tag=r.cover?`<em>${r.cover.type==="swap"?"Swap":"Overtime"} · ${w.team} team</em>`:"";
  return `<li${r.cover?' class="mancov"':""}>${manHat(w.team)}<span><b>${w.name}</b><small>${note}</small></span>${tag}</li>`;}
function manDraw(){if(!MANUI.open||!S)return;const s=manIdx(),m=manShift(s),key=s+"|"+m.nt;
  const left=Math.max(0,(s+1)*720-S.t),hh=Math.floor(left/60),mm=Math.floor(left%60),clk=`Next shift change in ${hh} h ${String(mm).padStart(2,"0")} m`;
  const c=$("manClk");if(c&&c.textContent!==clk)c.textContent=clk;
  if(MANUI.key===key)return;MANUI.key=key;
  const nxt=manShift(s+1),cov=[...m.techs,...m.ops].filter(r=>r.cover).length;
  $("manB").innerHTML=`<div class="manteam">${manHat(m.team)}<div><b>${m.team} team · ${m.K==="D"?"Days, 6 AM–6 PM":"Nights, 6 PM–6 AM"}</b>
      <small>${cov?`${cov} covering from other teams`:"Everyone on their own shift"} · next on: ${nxt.team} team</small></div></div>
    ${m.short?`<p class="manwarn">One tech short this shift: maintenance repairs run at ${Math.round(MAN.SLOW*100)}% speed until the next shift change.</p>`:""}
    <h4>Maintenance techs <span>${m.nt-m.short} of ${m.nt}</span></h4><ul class="manl">${m.techs.map(r=>manRow(r,"Maintenance")).join("")}</ul>
    <h4>Operators <span>${m.ops.length}</span></h4><ul class="manl">${m.ops.map((r,k)=>manRow(r,MAN_SEAT(k))).join("")}</ul>
    <div class="manleg">${MAN.TEAMS.map(T=>`<span>${manHat(T)}${T} team</span>`).join("")}</div>`;}
UI_TICKS.push(()=>{if(MANUI.open)manDraw();});
