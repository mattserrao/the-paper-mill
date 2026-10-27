/* ---- v6.14 the suction pick-up roll close-up on the WET DCS (the model is 07b: PUR, puv / sqz / kos) ----
   A side view of the roll where the pick-up felt wraps it and touches the forming fabric: the suction box's zones inside
   the drilled shell (sealing, transfer, holding, sealing), each shaded by the vacuum it pulls now, the hole pattern, and
   below it the trim squirts and the knock-off shower with their settings. */
function puPanel(){const w=kEl("div","dcsrow wide pupan");w.dataset.ord="puz";
  const cx=120,cy=92,R=58,arc=(a0,a1,r)=>{const p=a=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];const [x0,y0]=p(a0),[x1,y1]=p(a1);return `M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z`;};
  // zones round the bottom of the roll, where the wire runs under it (angles in radians, 0 = east, clockwise on screen)
  const Z=[[0.25,0.75],[0.75,1.45],[1.45,2.35],[2.35,2.7]];
  const holes=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2;holes.push(`<circle cx="${(cx+(R-5)*Math.cos(a)).toFixed(1)}" cy="${(cy+(R-5)*Math.sin(a)).toFixed(1)}" r="1.4" class="puh"/>`);}
  w.innerHTML=`<div class="dcsn"><b>Suction pick-up roll</b><small>The red knob at the roll sets the vacuum · close-up</small></div>
    <svg viewBox="0 0 420 222" class="pusvg" role="img" aria-label="Pick-up roll vacuum zones">
      <path d="M0 196 H420" class="puw"/><text x="8" y="214" class="put">forming fabric (wire) →</text>
      <path d="M40 30 Q120 4 ${cx+R+4} ${cy-6} L${cx+R+4} ${cy+30} Q${cx+40} ${cy+R+6} ${cx-30} ${cy+R+4}" class="puf"/><text x="40" y="22" class="put">pick-up felt</text>
      <circle cx="${cx}" cy="${cy}" r="${R}" class="pushell"/>${holes.join("")}
      ${Z.map((z,i)=>`<path d="${arc(z[0],z[1],R-10)}" class="puz" data-puz="${i}"/>`).join("")}
      <circle cx="${cx}" cy="${cy}" r="14" class="pubox"/>
      ${Z.map((z,i)=>{const a=(z[0]+z[1])/2,c=Math.cos(a),x=cx+(R+10)*c,y=cy+(R+14)*Math.sin(a)+4;return `<text x="${x.toFixed(0)}" y="${y.toFixed(0)}" class="pul" data-pul="${i}" text-anchor="${c>0.3?"start":c<-0.3?"end":"middle"}">–</text>`;}).join("")}
      <text x="236" y="34" class="put">shell: ${PUR.holes.d}" holes, ${PUR.holes.pitch}" pitch, ${Math.round(PUR.holes.open*100)}% open</text>
      <text x="236" y="54" class="put" data-pus>–</text>
      <g transform="translate(250,96)"><path d="M0 0 V50" class="pusq"/><path d="M40 0 V50" class="pusq"/><text x="-4" y="-6" class="put">squirts</text><text x="20" y="66" class="put" data-psq text-anchor="middle">–</text>
        <path d="M90 0 H150 M100 0 V40 M120 0 V40 M140 0 V40" class="puko"/><text x="96" y="-6" class="put">knock-off</text><text x="120" y="66" class="put" data-pko text-anchor="middle">–</text></g>
    </svg>`;
  return w;}
function puSync(){const o=$("dcsOv");if(!o||o.hidden||KUI.st!=="WET"||!S)return;const p=o.querySelector(".pupan");if(!p)return;const r=knobRead(),v=r.puv;
  PUR.zones.forEach(([n,f],i)=>{const z=p.querySelector(`[data-puz="${i}"]`),l=p.querySelector(`[data-pul="${i}"]`),vz=v*f;if(z)z.style.fillOpacity=String(clamp(vz/16,0.08,0.95));if(l){const t=`${n} ${kf(vz)}`;if(l.textContent!==t)l.textContent=t;}});
  const st=p.querySelector("[data-pus]");if(st){const t=v<PUR.lo?"TRANSFER WEAK: the sheet drops":v>PUR.mark?"VACUUM HIGH: holes mark the sheet":"transfer "+kf(v)+" inHg: lifts cleanly";if(st.textContent!==t)st.textContent=t;st.classList.toggle("pubad",v<PUR.lo||v>PUR.mark);}
  const sq=p.querySelector("[data-psq]");if(sq){const t=r.sqz===0?"on the deckle":(r.sqz<0?"in ":"out ")+kf(Math.abs(r.sqz),2)+'"';if(sq.textContent!==t)sq.textContent=t;}
  const ko=p.querySelector("[data-pko]");if(ko){const t=Math.round(r.kos)+" psi";if(ko.textContent!==t)ko.textContent=t;ko.classList.toggle("pubad",r.kos<PUR.kosLo);}}
UI_TICKS.push(()=>puSync());
