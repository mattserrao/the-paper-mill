/* ---- v6.7 Report > Control room: one place for the mill's screens (the process flow, the DCS, planning, quality, water
   and trends). The DCS still opens from the operator consoles in the mill too; the process flow left Settings. ---- */
{const CR=[["pf","Process flow","Money and tons through the mill"],["dcs","DCS","Stock prep, wet end, dry end, utilities"],["PLAN","Planning","Orders, inventory, trucks, OCC recipe"],
    ["QCS","Quality","Specs, off-spec log, beater"],["WATER","Water","Fresh water and the water balance"],["TREND","Trends","Trend anything, find what moves together"],["REL","Reliability","Rounds, vibration and ADX motor tests"],["PROF","Machine profile","Solids from the headbox to the reel"],["BRK","Breaks","The break risk, its causes and the log"],["NRG","Energy","Steam, power and condensate per ton"],["DRV","Drives","The MCC lineups: each drive's load"],["rm","Relationship map","What drives each reading, and what it moves"],["man","Manning","Who's on shift, vacations and cover"]];
  // v6.14 report cleanup: the screens in four groups, smaller tiles, the second screen as a link under them
  const CRG=[["Process",["pf","dcs","PROF","BRK","NRG"]],["Production & quality",["PLAN","QCS","WATER"]],["Equipment & people",["REL","DRV","man"]],["Analysis",["TREND","rm"]]];
  const el=$("ctlRoom");
  if(el){el.innerHTML=`<div class="crh"><b>Control room</b><small id="crNote">The mill's screens. The DCS screens also open from the operator consoles in the mill.</small></div>
      ${CRG.map(([gn,ks])=>`<div class="crgh">${gn}</div><div class="crg">${ks.map(k=>{const c=CR.find(x=>x[0]===k);return `<button type="button" data-cr="${k}"><b>${c[1]}</b><small>${c[2]}</small></button>`;}).join("")}</div>`).join("")}
      <button type="button" class="crpop" data-cr="pop" id="crPop" hidden>⧉ Open the control room on a second screen</button>`;
    el.addEventListener("click",e=>{const b=e.target.closest("[data-cr]");if(!b||b.disabled)return;const k=b.dataset.cr;
      if(POP.on&&k!=="pop"){popOpen(k==="dcs"?"dcs":k);return;}   // (v6.8.3: popped out, every screen opens on the second screen)
      const x=document.querySelector('#v2sheet header button[aria-label="Close panel"]');if(x)x.click();
      if(k==="pf")pfOpen();else if(k==="rm")rmOpen();else if(k==="man")manOpen();else if(k==="pop")popOpen("both");else openStation(k==="dcs"?(KUI.last||"SPOT"):k,"dcs");});}
  UI_TICKS.push(()=>{if(!el)return;const z=!!S.zen;el.querySelectorAll("[data-cr]").forEach(b=>{if(b.dataset.cr==="pf"||b.dataset.cr==="pop"||b.dataset.cr==="rm"||b.dataset.cr==="man")return;if(b.disabled!==z)b.disabled=z;});
    const n=$("crNote"),t=z?"Zen mode: the process flow, the relationship map and manning. The DCS, planning, quality, water and trend screens are in the other modes.":"The mill's screens. The DCS screens also open from the operator consoles in the mill.";if(n&&n.textContent!==t)n.textContent=t;
    const p=$("crPop"),h=!POPOK()||POP.on;if(p&&p.hidden!==h)p.hidden=h;});}
