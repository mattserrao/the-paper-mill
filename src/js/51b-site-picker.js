// ---- v4.1 site picker: environment (with its pros and cons) and mill seed. The 3D scene is built once per page load,
// so "Build here" saves the choice and reloads; nothing else is kept between page loads anyway.
{const SW={rural:["#b4cf9f","#4f8257"],urban:["#bec7ad","#8a94a3"],desert:["#e3d0a4","#c98b5a"],swamp:["#a3b487","#4f736d"]};
  const WATER={rural:"#7fb0cf",urban:"#76a0b8",desert:"#5fa8bd",swamp:"#4f736d"};
  const swatch=(el,e)=>{el.style.background=`linear-gradient(135deg,${SW[e][0]} 55%,${SW[e][1]} 55%)`;};
  const layName=L=>`Wastewater plant ${L.ww==="east"?"behind the maintenance shop":"behind stock prep"}, clarifier on the ${(L.ww==="east")!==L.flip?"east":"west"} side`;
  // menu row
  function siteRow(){const E=ENVS[SITE.env];$("v2siteN").textContent=E.name;$("v2siteM").textContent=`Mill #${SITE.seed} · layout ${"ABCD"[LAYOUT.i]}`;swatch($("v2siteSw"),SITE.env);}
  siteRow();
  // picker
  const ov=$("siteOv"),envs=$("siteEnvs"),seedIn=$("siteSeed"),prev=$("sitePrev");let pick=SITE.env;
  ENV_IDS.forEach(id=>{const E=ENVS[id],b=document.createElement("button");b.type="button";b.setAttribute("role","radio");b.dataset.env=id;
    b.innerHTML=`<div class="eh"><span class="sw"></span><b>${E.name}</b><small>${E.short}</small></div><p>${E.blurb}</p><ul>${E.pros.map(t=>`<li class="pro">${t}</li>`).join("")}${E.cons.map(t=>`<li class="con">${t}</li>`).join("")}</ul>`;
    swatch(b.querySelector(".sw"),id);b.addEventListener("click",()=>{pick=id;sync();});envs.appendChild(b);});
  envs.addEventListener("keydown",e=>{const k=e.key;if(!["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"].includes(k))return;e.preventDefault();
    const i=ENV_IDS.indexOf(pick),n=ENV_IDS[(i+(k==="ArrowRight"||k==="ArrowDown"?1:ENV_IDS.length-1))%ENV_IDS.length];pick=n;sync();envs.querySelector(`[data-env="${n}"]`).focus();});
  const seedOf=()=>{const v=Math.round(+seedIn.value);return v>=1&&v<=99999?v:SITE.seed;};
  // a small plan of the site: river, roads, fence, the fixed core and where the seeded wastewater plant goes
  function drawPrev(){const x=prev.getContext("2d"),W=prev.width,H=prev.height,k=W/360,X=v=>(v+170)*k,Z=v=>(v+90)*k,L=layoutFor(seedOf());
    x.fillStyle=SW[pick][0];x.fillRect(0,0,W,H);x.fillStyle=WATER[pick];x.fillRect(0,Z(-75),W,18*k);
    x.fillStyle="#5a5f69";x.fillRect(X(-162.5),0,9*k,H);x.fillRect(X(-158),Z(-5.2),58*k,2.8*k);x.fillRect(X(-158),Z(11.2),58*k,2.8*k);x.fillRect(X(92),Z(31.4),70*k,2.4*k);
    x.strokeStyle="rgba(28,34,51,.45)";x.lineWidth=1;x.strokeRect(X(-100),Z(-52),192*k,116*k);
    x.fillStyle="#d6382c";[[-34.4,-8,-23.5,-3],[-27.2,64,-2.9,19.9],[-49,-23.8,14.8,32.2]].forEach(([a,b,c,d])=>x.fillRect(X(a),Z(c),(b-a)*k,(d-c)*k));
    x.fillStyle="#9aa3ad";[[4,47,-25,-2],[70,82,-16,-4],[49,65,-27,-14.5],[66,88,38,56]].forEach(([a,b,c,d])=>x.fillRect(X(a),Z(c),(b-a)*k,(d-c)*k));
    const a=Math.min(L.wx(1),L.wx(46)),b=Math.max(L.wx(1),L.wx(46));x.fillStyle="#1f9254";x.fillRect(X(a),Z(-49),(b-a)*k,18*k);
    x.fillStyle="#bfe3d8";x.beginPath();x.arc(X(L.wx(10)),Z(-40),7*k,0,7);x.fill();const p0=Math.min(L.wx(22),L.wx(42));x.fillRect(X(p0),Z(-46),20*k,12*k);
    $("siteLay").textContent=`Layout ${"ABCD"[L.i]}: ${layName(L)}.`;}
  function sync(){envs.querySelectorAll("button").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.env===pick)));
    envs.querySelectorAll("button").forEach(b=>b.tabIndex=b.dataset.env===pick?0:-1);drawPrev();
    $("siteGo").textContent=pick===SITE.env&&seedOf()===SITE.seed?"Keep this site":"Build here";}
  $("v2siteBtn").addEventListener("click",()=>{pick=SITE.env;seedIn.value=SITE.seed;sync();ov.hidden=false;setTimeout(()=>{const b=envs.querySelector('[aria-checked="true"]');if(b)b.focus();},0);});
  seedIn.addEventListener("input",sync);
  $("siteRoll").addEventListener("click",()=>{seedIn.value=1+Math.floor(Math.random()*99999);sync();});
  $("siteNo").addEventListener("click",()=>{ov.hidden=true;});
  ov.addEventListener("keydown",e=>{if(e.key==="Escape"){ov.hidden=true;$("v2siteBtn").focus();}});
  $("siteGo").addEventListener("click",()=>{const s=seedOf();if(pick===SITE.env&&s===SITE.seed&&SITE.saved){ov.hidden=true;return;}
    siteSave(pick,s);const q=new URLSearchParams(location.search);q.delete("env");q.delete("mill");const qs=q.toString();
    const u=location.pathname+(qs?"?"+qs:"")+location.hash;if(u===location.pathname+location.search+location.hash)location.reload();else location.href=u;});}
