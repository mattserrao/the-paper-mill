/* ---------- v5.7.4 Version notes: tap the version number at the bottom of the title screen three times quickly
   (within 700 ms per tap) and a list of every version's one-line note pops up, newest first. The list comes from
   VERSION-NOTES.txt at the repo root: build.py swaps it in for the placeholder below, so adding a line there with each
   release keeps the pop-up current (build.py warns when APP_VER has no line). ---------- */
{const VNOTES=/*@VERSION_NOTES@*/[];
  let ov=null,held=false;
  function render(){
    const cur=APP_VER.replace(/^v/i,""),rows=VNOTES.slice().reverse().map(([v,n])=>
      `<div class="hterm${v===cur?" vcur":""}"><dt>${escHTML(v)}</dt><dd>${escHTML(n)}</dd></div>`).join("");
    ov.innerHTML=`<div class="modal help vnotes" role="dialog" aria-modal="true" aria-labelledby="vn-h">
      <div class="hhead"><h2 id="vn-h">Version notes</h2><button type="button" class="hx" id="vn-x" aria-label="Close version notes">✕</button></div>
      <div class="hbody"><dl class="hgl">${rows||`<p class="hnone">No version notes in this build.</p>`}</dl></div></div>`;
    ov.querySelector("#vn-x").addEventListener("click",close);}
  function open(){if(!ov){ov=document.createElement("div");ov.className="overlay helpov";ov.id="vnOv";ov.hidden=true;document.body.appendChild(ov);
      ov.addEventListener("click",e=>{if(e.target===ov)close();});ov.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();close();}});}
    held=running;running=false;render();ov.hidden=false;ov.querySelector("#vn-x").focus({preventScroll:true});}
  function close(){if(!ov||ov.hidden)return;ov.hidden=true;const m=document.getElementById("v2menu");if(held&&!(m&&!m.hidden))running=true;held=false;
    const v=document.querySelector(".title .tver");if(v&&!v.closest("[hidden]"))v.focus({preventScroll:true});}
  G3.vnOpen=open;G3.vnClose=close;G3.VNOTES=VNOTES;
  // three quick taps on the title screen's version number (Enter or Space three times works for keyboards too)
  const v=document.querySelector(".title .tver");
  if(v){v.tabIndex=0;v.setAttribute("role","button");v.setAttribute("aria-label",`Version ${APP_VER}. Tap three times for version notes`);
    let n=0,last=0;const hit=()=>{const t=performance.now();n=t-last<700?n+1:1;last=t;if(n>=3){n=0;open();}};
    v.addEventListener("click",hit);v.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();hit();}});}
}
