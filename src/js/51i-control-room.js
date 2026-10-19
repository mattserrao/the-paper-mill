/* ---- v6.7 Report > Control room: one place for the mill's screens (the process flow, the DCS, planning, quality, water
   and trends). The DCS still opens from the operator consoles in the mill too; the process flow left Settings. ---- */
{const CR=[["pf","Process flow","Money and tons through the mill"],["dcs","DCS","Stock prep, wet end, dry end, utilities"],["PLAN","Planning","Orders, inventory, trucks"],
    ["QCS","Quality","Specs, off-spec log, beater"],["WATER","Water","Fresh water and the water balance"],["TREND","Trends","Trend anything, find what moves together"]];
  const el=$("ctlRoom");
  if(el){el.innerHTML=`<div class="crh"><b>Control room</b><small id="crNote">The mill's screens. The DCS screens also open from the operator consoles in the mill.</small></div>
      <div class="crg">${CR.map(([k,l,d])=>`<button type="button" data-cr="${k}"><b>${l}</b><small>${d}</small></button>`).join("")}<button type="button" data-cr="pop" id="crPop" hidden><b>⧉ Second screen</b><small>DCS and process flow in their own window</small></button></div>`;
    el.addEventListener("click",e=>{const b=e.target.closest("[data-cr]");if(!b||b.disabled)return;const k=b.dataset.cr;
      const x=document.querySelector('#v2sheet header button[aria-label="Close panel"]');if(x)x.click();
      if(k==="pf")pfOpen();else if(k==="pop")popOpen("both");else openStation(k==="dcs"?(KUI.last||"SPOT"):k,"dcs");});}
  UI_TICKS.push(()=>{if(!el)return;const z=!!S.zen;el.querySelectorAll("[data-cr]").forEach(b=>{if(b.dataset.cr==="pf"||b.dataset.cr==="pop")return;if(b.disabled!==z)b.disabled=z;});
    const n=$("crNote"),t=z?"Zen mode: the process flow only. The DCS, planning, quality, water and trend screens are in the other modes.":"The mill's screens. The DCS screens also open from the operator consoles in the mill.";if(n&&n.textContent!==t)n.textContent=t;
    const p=$("crPop"),h=!POPOK()||POP.on;if(p&&p.hidden!==h)p.hidden=h;});}
