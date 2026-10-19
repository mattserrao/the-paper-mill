/* ---- v6.7 process flow additions: each area's capacity against its throughput (the bottleneck marked), the $/ton and
   tons views, today against the 7 days before, the OEE strip, replaying a range hour by hour, the "where the money went"
   waterfall on Profit, and links from each area to its DCS screen (50c). Read-only: all from the hourly history (11c). ---- */
const PF_CAPK={yard:"recv",pulper:"pulper",stock:"screens",pm:"pm",winder:"winder",ship:"ship"};
// an area's throughput in paper tons an hour (the same measure lineCaps uses), now or averaged over the range
function pfThru(a,D,live){const R=S.rates||{},y=P.yieldF,k=P.pmLoss,rw=C.rollW?C.rollW.v:12.5;
  if(live)return {yard:(R.unload||0)*y*k,pulper:(R.feed||0)*y*k,stock:(R.fiberIn||0)*k,pm:R.prod||0,winder:R.cut||0,ship:(R.load||0)*rw}[a];
  const W=D.W||{},h=Math.max(1,D.h||1);return {yard:(W.in||0)*y*k,pulper:(W.feed||0)*y*k,stock:((W.feed||0)-(W.rej||0))*k,pm:(D.made||0)+(W.broke||0),winder:D.made||0,ship:D.shipT||0}[a]/h;}
function pfCapSVG(a,D,live,x,y,w,h){const ck=PF_CAPK[a];if(!ck)return "";const caps=lineCaps(),c=caps.find(q=>q[0]===ck);if(!c||!(c[2]>0))return "";
  const bn=caps.reduce((m,q)=>q[2]<m[2]?q:m,caps[0])[0]===ck,u=pfThru(a,D,live)/c[2],bx=x+10,bw=w-20,by=y+h-11;
  const col=u>0.95?"#ffb02e":u<0.5?"#8ea4c4":"#4fd18b";
  return `<rect x="${bx}" y="${by}" width="${bw}" height="5" rx="2.5" class="pfcapt"/><rect x="${bx}" y="${by}" width="${(bw*clamp(u,0,1)).toFixed(1)}" height="5" rx="2.5" fill="${col}"/>`+
    `<title>${Math.round(u*100)}% of what it can do (${Math.round(c[2])} t/h)${bn?" · the mill's bottleneck":""}</title>`+(bn?`<text x="${x+8}" y="${y+13}" class="pfbn">BOTTLENECK</text>`:"");}

/* ---- the range's hourly rows (or the replayed hour) ---- */
const pfDayN=()=>S.pf?S.pf.d:Math.floor(S.t/1440);
function pfRpWin(){const n=pfNowH()+1,d=pfDayN(),H=S.hist,first=H&&H.rows.length?H.rows[0][0]:0,pr=PFUI.prior?first:Math.max(0,first);
  if(PFUI.mode==="y")return [(d-1)*24,d*24];if(PFUI.mode==="w")return [Math.max(pr,n-168),n];if(PFUI.mode==="r")return [Math.min(pr,n-1),n];return [d*24,n];}
function pfRangeRows(){if(PFUI.rp!=null)return histRows(PFUI.rp,PFUI.rp+1,true);const [h0,h1]=pfRpWin();return histRows(h0,h1,PFUI.mode==="w"||PFUI.mode==="r"?PFUI.prior:true);}
function pfRpD(){const rows=histRows(PFUI.rp,PFUI.rp+1,true);if(!rows.length)return null;const D=histSum(rows,PFUI.rp*60,PFUI.rp*60+60);D.h=1;D.day=Math.floor(PFUI.rp/24)+1;return D;}
// the replay bar: built once, then kept in step (a rebuilt slider would drop the drag)
function pfRepHTML(){const el=$("pfRep");if(!el)return;const [h0,h1]=pfRpWin(),has=S.hist&&S.hist.rows.length&&h1-h0>1;
  if(!has){if(el._h!=="none"){el._h="none";el.innerHTML="";}return;}
  if(el._h!=="bar"){el._h="bar";el.innerHTML=`<button type="button" data-rp="play" class="pfrb"></button><input type="range" id="pfRpS" step="1" aria-label="Replay hour"/><span id="pfRpL"></span><button type="button" data-rp="live" class="pfrb" id="pfRpX">Back to live</button>`;}
  const sl=el.querySelector("#pfRpS"),act=sl.ownerDocument.activeElement===sl;if(sl.min!==String(h0))sl.min=h0;if(sl.max!==String(h1-1))sl.max=h1-1;if(!act){const v=String(PFUI.rp!=null?PFUI.rp:h1-1);if(sl.value!==v)sl.value=v;}
  const b=el.querySelector("[data-rp=play]"),t=PFUI.play?"❚❚ Pause":"▶ Replay";if(b.textContent!==t)b.textContent=t;
  const l=el.querySelector("#pfRpL"),lt=PFUI.rp!=null?pfHourLbl(PFUI.rp):`Replay ${PF_RNAME[PFUI.mode]} hour by hour`;if(l.textContent!==lt)l.textContent=lt;
  const x=el.querySelector("#pfRpX");if(x.hidden!==(PFUI.rp==null))x.hidden=PFUI.rp==null;}

/* ---- OEE: availability x performance x quality for the machine ---- */
function pfOEEcalc(rows){const s=k=>rows.reduce((a,r)=>a+(hv(r,k)||0),0),run=s("m.pmrun"),brk=s("m.pmbrk"),down=s("m.pmdown"),held=s("m.pmheld"),out=s("m.out"),made=s("made"),broke=s("w.broke"),pot=s("w.pot");
  const total=run+brk+down+held,planned=Math.min(out,down);if(total<30||!(pot>0))return null;const rate=pot/total,potRun=rate*run;
  const A=run/Math.max(1,total-planned),Pf=potRun>0?Math.min(1.2,(made+broke)/potRun):0,Q=made+broke>0?made/(made+broke):1;return {A,P:Pf,Q,O:A*Pf*Q,run,brk,down,held,planned,total};}
function pfOEE(){const o=pfOEEcalc(pfRangeRows()),pc=v=>Math.round(v*100)+"%";
  if(!o)return `<div class="pfoeeb"><b>OEE</b><small>collecting the first hour…</small></div>`;
  return `<div class="pfoeeb" title="Availability: running time out of the time it should run (planned outages left out). Performance: tons made against the setpoint speed while running. Quality: good paper out of all paper made."><b>OEE ${pc(o.O)}</b><span>Availability <em>${pc(o.A)}</em></span><i>×</i><span>Performance <em>${pc(o.P)}</em></span><i>×</i><span>Quality <em>${pc(o.Q)}</em></span><small>${PFUI.rp!=null?"that hour":PF_RNAME[PFUI.mode]}</small></div>`;}

/* ---- today (or yesterday) against the 7 days before it, per ton made ---- */
function pfBase(D){if(PFUI.rp!=null||!(PFUI.mode==="t"||PFUI.mode==="y")||!(D.made>5))return null;const d=pfDayN()-(PFUI.mode==="y"?1:0),key=[d,PFUI.mode,Math.floor(S.t/60)].join("|");
  if(PFUI.base&&PFUI.base.key===key)return PFUI.base.v;
  const per=rows=>{if(!rows.length)return null;const X=histSum(rows,0,0);if(!(X.made>50))return null;const c={};PF_CATS.forEach(([k])=>c[k]=X.cat[k]/X.made);c.cost=X.cost/X.made;return c;};
  const c=per(histRows(d*24-168,d*24,true)),y=PFUI.mode==="t"?per(histRows((d-1)*24,d*24,true)):null,v=c?{c,y:y?{c:y}:null}:null;PFUI.base={key,v};return v;}
function pfChip(B,c,v,t){if(!B||!(t>5))return "";const cur=v/t,b=B.c[c];if(!(b>0.5))return "";const d=(cur-b)/b;if(Math.abs(d)<0.05)return "";
  const yb=B.y&&B.y.c[c];return ` <em class="pfchip ${d>0?"bad":"ok"}" title="Per ton made: ${money(cur)} against ${money(b)} over the 7 days before${yb?`; yesterday ${money(yb)}`:""}">${d>0?"▲":"▼"}${Math.round(Math.abs(d)*100)}%</em>`;}

/* ---- where the money went: from the profit at full speed and on spec down to the real profit ---- */
function pfWaterfall(){const rows=pfRangeRows();if(!rows.length)return `<p class="pfpn">No history for this range yet.</p>`;
  const s=k=>rows.reduce((a,r)=>a+(hv(r,k)||0),0),X=histSum(rows,0,0),o=pfOEEcalc(rows);if(!o)return `<p class="pfpn">Give it the first hour.</p>`;
  const made=X.made,ship=X.shipT,pot=s("w.pot"),idle=s("w.idle"),chg=s("w.chg"),spotd=s("w.spotd"),rep=s("s.rep");
  const price=made>1?s("w.val")/made:priceOf(C.grade),varT=made>1?(X.cat.fiber+X.cat.frin+X.cat.energy-idle+X.cat.chem)/made:P.occPrice/P.yieldF+frInRate()/P.yieldF+energyCost(),
    frT=ship>1?X.cat.frout/ship:frOutRate(),cm=price-varT-frT,fixed=X.cat.labor+(X.cat.maint-rep)+X.cat.over,rate=pot/o.total;
  const potP=pot*cm-fixed,L=[["Sheet breaks",o.brk*rate*cm],["Planned outages",o.planned*rate*cm],["Machine down (upsets, no stock)",(o.down-o.planned)*rate*cm],["Held back (winder or warehouse full)",o.held*rate*cm],
    ["Below the setpoint speed",Math.max(0,o.run*rate-made-s("w.broke"))*cm],["Off-spec paper to the beater",s("w.broke")*cm],["Repair bills and outage budgets",rep],["Idle energy while stopped",idle],
    ["Late delivery chargebacks",chg],["Spot sales under list",spotd]];
  const act=X.profit,other=potP-L.reduce((a,x)=>a+x[1],0)-act;L.push([other>=0?"Paper not sold yet, deals and the rest":"Stock sold from before, deals and the rest",other]);
  let run=potP,lo=Math.min(0,act,potP),hi=Math.max(potP,act,0);const steps=L.map(([n,v])=>{const a=run,b=run-v;run=b;lo=Math.min(lo,a,b);hi=Math.max(hi,a,b);return [n,v,a,b];});
  const W=v=>((v-lo)/Math.max(1,hi-lo)*100).toFixed(2),bar=(a,b,cls)=>`<i><s class="${cls}" style="left:${W(Math.min(a,b))}%;width:${Math.max(0.4,W(Math.max(a,b))-W(Math.min(a,b)))}%"></s></i>`;
  const row=(n,v,a,b,cls,sign)=>`<div class="wfr ${cls}"><span>${n}</span>${bar(a,b,cls)}<b>${sign}${money(Math.abs(v))}</b></div>`;
  return `<div class="wf">${row("At full speed, all on spec",potP,0,potP,"pot","")}${steps.filter(x=>Math.abs(x[1])>=50).map(([n,v,a,b])=>row(n,v,a,b,v>=0?"loss":"gain",v>=0?"−":"+")).join("")}${row(act>=0?"Actual profit":"Actual loss",act,0,act,act>=0?"act":"act neg",act<0?"−":"")}</div>
    <p class="pfpn">Lost tons are valued at the margin a ton made (${money(price)} paper less ${money(varT+frT)} of fiber, haul, energy, chemicals and freight: ${money(cm)}/t). Labor, overhead and the maintenance crew are fixed, so they come off the top. Revenue lands when trucks leave, so paper made but not shipped shows in the last line.</p>`;}

/* ---- the tons view: what flows through each area, waste off the bottom, the broke loop, fresh water ---- */
function pfInputsT(D){const W=D.W||{},rows=[["Bales unloaded",pfT(W.in||0)],["Bales fed",pfT(W.feed||0)],["Rejects to landfill",pfT(W.rej||0)],["Fiber to the stock chest",pfT((W.feed||0)-(W.rej||0))],
    ["Good paper made",pfT(D.made||0)],["Broke, repulped",pfT(W.broke||0)],["Shipped",pfT(D.shipT||0)],["Fresh water",fmtGal(GAL(W.fw||0))],["Fresh water a ton",D.made>1?Math.round(GAL((W.fw||0)/D.made)).toLocaleString()+" gal":"–"]];
  return `<div class="dcssub">Tons · ${PFUI.rp!=null?"that hour":PF_RNAME[PFUI.mode]}</div>`+rows.map(([k,v])=>`<div class="pfrow"><i></i><span>${k}</span><b>${v}</b><small></small></div>`).join("");}
function pfSVGt(D,live){const vert=pfVert(),NU=104,NV=112,GAP=30,PAD=vert?24:10,n=PF_AREAS.length,U=PAD*2+n*NU+(n-1)*GAP+36,v0=vert?120:150,v1=v0+NV,vc=v0+NV/2,wE=v1+46,V=vert?wE+150:wE+66;
  const X=(u,v)=>vert?[v,u]:[u,v],o=[],W=D.W||{};
  const poly=pts=>pts.map(p=>X(p[0],p[1]).map(q=>q.toFixed(1)).join(",")).join(" ");
  const txt=(x,y,s,cls,anc)=>`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}"${anc?` style="text-anchor:${anc}"`:""}>${s}</text>`;
  const uOf=i=>PAD+i*(NU+GAP);
  const stage=[W.in||0,W.feed||0,(W.feed||0)-(W.rej||0),(D.made||0)+(W.broke||0),D.made||0,D.shipT||0,0],flow=[W.feed||0,(W.feed||0)-(W.rej||0),(D.made||0)+(W.broke||0),D.made||0,D.made||0,D.shipT||0];
  const k=(NV-20)/Math.max(1,...stage,...flow);
  o.push(`<svg viewBox="0 0 ${vert?V:U} ${vert?U:V}" class="mimic pfsvg${vert?" vert":""}" role="img" aria-label="Tons through the mill">`);
  o.push(`<defs><marker id="pfArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#8ea4c4"/></marker></defs>`);
  for(let i=0;i<n-1;i++){const w=k*flow[i];if(w<=0.05)continue;const a=uOf(i)+NU,b=i<n-2?uOf(i+1):U-14;
    o.push(`<polygon points="${poly([[a,vc-w/2],[b,vc-w/2],[b,vc+w/2],[a,vc+w/2]])}" class="pfband pfbandt"/>`);
    if(i===n-2)o.push(`<polygon points="${poly([[b,vc-w/2-5],[U-2,vc],[b,vc+w/2+5]])}" class="pfband pfbandt"/>`);}
  // bales come in from the left; fresh water drops in at the machine (not to scale)
  {const w=k*stage[0];o.push(`<polygon points="${poly([[2,vc-w/2],[uOf(0),vc-w/2],[uOf(0),vc+w/2],[2,vc+w/2]])}" class="pfband pfbandt"/>`);}
  {const u=uOf(3)+NU/2;o.push(`<polyline points="${poly([[u,34],[u,v0]])}" class="pfwater" marker-end="url(#pfArr)"/>`);const [x,y]=vert?[4,u-6]:[u,24];o.push(txt(x,y,"Fresh water "+fmtGal(GAL(W.fw||0)),"pfadd pfwt",vert?"start":"middle"));}
  const wl=(i,du,lines,cls)=>{const u=uOf(i)+du;o.push(`<polyline points="${poly([[u,v1],[u,wE]])}" class="pfwaste" marker-end="url(#pfArr)"/>`);
    lines.forEach((s,j)=>{const [x,y]=vert?[wE+6,u-4+j*17]:[u,wE+20+j*17];o.push(txt(x,y,s,j?"pfwv"+(cls?" "+cls:""):"pfwl",vert?"start":"middle"));});};
  wl(1,NU/2-14,["Rejects → landfill",pfT(W.rej||0)]);if((W.bale||0)>0.05)wl(0,NU/2,["Bales lost",pfT(W.bale)]);wl(3,NU-20,["Effluent fiber",pfT(W.eff||0)]);
  {const a=uOf(3)+20,b=uOf(1)+NU-16,vv=v1+26;o.push(`<polyline points="${poly([[a,v1],[a,vv],[b,vv],[b,v1+2]])}" class="pfbroke" marker-end="url(#pfArr)"/>`);
    const uc=uOf(2)+NU/2,[x,y]=vert?[vv+6,uc+4]:[uc,vv+18];o.push(txt(x,y,"Broke "+pfT(W.broke||0)+" repulped","pfwv",vert?"start":"middle"));}
  const NAME={yard:"unloaded",pulper:"fed",stock:"fiber",pm:"made",winder:"wound",ship:"shipped",site:""};
  PF_AREAS.forEach(([a],i)=>{const u=uOf(i),[x,y]=X(u,v0),[w,h]=vert?[NV,NU]:[NU,NV],cx=x+w/2,cy=y+h/2,L=PF_LINES[a],lp=live?pfLamp(a):null,sel=PFUI.sel==="node:"+a,up=live&&(S.inc||[]).some(q=>pfRepArea(q.id)===a);
    let g=`<g data-pf="node:${a}" class="pfhit" tabindex="0" role="button" aria-label="${PF_AN[a][2]}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" class="meq pfnode${sel?" sel":""}${up?" pfup":""}"/>`;
    const top=cy-(L.length>1?32:24);L.forEach((s,j)=>g+=txt(cx,top+j*17,s,"mtl pfnl"));
    g+=txt(cx,cy+(L.length>1?20:14),a==="site"?"–":pfT(stage[i]),"pfnv");if(NAME[a])g+=txt(cx,cy+(L.length>1?37:33),NAME[a],"pfnr");
    g+=pfCapSVG(a,D,live,x,y,w,h);
    if(lp)g+=`<circle cx="${x+w-9}" cy="${y+9}" r="4.5" fill="${PF_LAMP[lp][0]}"><title>${PF_LAMP[lp][1]}</title></circle>`;
    o.push(g+"</g>");});
  o.push("</svg>");o.push(`<p class="pfcap">The band is as wide as the tons going through ${live?"today":"that range"}: bales in at the left, paper out at the right. Waste and the broke loop are drawn thin (not to scale); fresh water is gallons.</p>`);return o.join("");}
