/* ---- v6.6 the Orders & bales panel (Report tab): the order book, the bale yard's grade, idle energy. Display only. ---- */
{const box=()=>$("ordBox");let last="";
  const hrsTo=m=>{const a=Math.abs(m),s=a<90?Math.round(a)+" min":a<2880?Math.round(a/60)+" h":(a/1440).toFixed(1)+" d";return m>=0?"due in "+s:s+" late";};
  const pc=v=>Math.round(v*100)+"%";
  function html(){if(!ordOn())return `<p class="rnone">Zen mode: no orders and every bale is the same. The order book runs in Season, Survival and Free Play.</p>`;
    const O=ordState(),K=O.k,Q=bqState(),open=O.list.filter(o=>o.st==="open").sort((a,b)=>a.due-b.due);
    const tons=K.onT+K.lateT,otd=tons>0?K.onT/tons:null,lateN=open.filter(o=>S.t>o.due+ORD.grace).length;
    const row=o=>{const left=o.r-Math.round(o.sh),inStock=Math.floor(ordFree(o.g)),late=S.t>o.due+ORD.grace,risk=!late&&o.due-S.t<360&&inStock<left;
      const st=late?["bad","late"]:o.ld>o.sh+0.5?["ok","loading"]:inStock>=Math.min(left,P.truckRolls)?["ok","ready"]:C.grade===o.g?["","on the machine"]:["","waiting for "+o.g];
      return `<div class="ordr${late?" late":risk?" risk":""}"><span><b>#${o.id} ${ordCust(o)}</b><small>${o.g} · ${Math.round(o.sh)}/${o.r} rolls · ${hrsTo(o.due-S.t)}</small></span><em class="${st[0]}">${st[1]}</em></div>`;};
    const pend=open.slice(0,8).map(row).join("")||`<p class="rnone">No open orders.</p>`;
    const qa=(Q.A||0)+(Q.B||0)+(Q.C||0);
    return `<div class="rq"><div><small>On-time delivery</small><b class="mono">${otd==null?"–":pc(otd)}</b><small>${Math.round(tons)} t on orders</small></div>
      <div><small>Open orders</small><b class="mono">${open.length}</b><small>${lateN?lateN+" late":"none late"}${K.canc?" · "+K.canc+" cancelled":""}</small></div>
      <div><small>Spot market</small><b class="mono">${Math.round(K.spot)} t</b><small>${K.spot?"−"+money(K.spotV)+" under list":"surplus paper"}</small></div></div>
      <p class="rnote">Late chargebacks ${money(K.chg)}${K.dry?" · "+K.dry+" dry run"+(K.dry===1?"":"s")+" ("+money(K.dry*ORD.dryRun)+")":""}. Customers pay list less $${ORD.late}/t a day late (up to $${ORD.lateCap}); after ${ORD.cancel} days they cancel. Unsold paper goes for $${ORD.spot}/t under list.</p>
      <div class="v2sub">Due next</div><div class="ordl">${pend}</div>${open.length>8?`<p class="rnote">+${open.length-8} more</p>`:""}
      <div class="v2sub">Bale yard</div>
      <div class="rq"><div><small>Moisture</small><b class="mono">${(Q.m*100).toFixed(1)}%</b><small>${Q.m>BALE.allow?"wet: less fiber a ton":"paid to "+Math.round(BALE.allow*100)+"%"}</small></div>
      <div><small>Contamination</small><b class="mono">${bqBand(Q.k)}</b><small>stickies at the machine ${pc(Q.ck)}</small></div>
      <div><small>Loads rejected</small><b class="mono">${Q.rej}</b><small>of ${qa} graded</small></div></div>
      <p class="rnote">Graded A ${Q.A||0} · B ${Q.B||0} · C ${Q.C||0} (sent back). Moisture claims saved ${money(Q.ded)}. Idle energy while the machine was stopped ${money(S.tot.idleE||0)}.</p>`;}
  UI_TICKS.push(n=>{const b=box(),d=$("repOrd");if(!b||!d||!d.open||!paneShown(b)||n%5)return;const h=html();if(h!==last){last=h;b.innerHTML=h;}});
  document.addEventListener("toggle",e=>{if(e.target&&e.target.id==="repOrd"&&e.target.open){last="";const b=box();if(b){last=html();b.innerHTML=last;}}},true);}
