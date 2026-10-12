// ---- v4.1 site picker: environment (with its pros and cons); the layout is fixed per environment (pass 6). The 3D scene is built once per page load,
// so "Build here" saves the choice and reloads; nothing else is kept between page loads anyway.
{const SW={rural:["#b4cf9f","#4f8257"],urban:["#bec7ad","#8a94a3"],desert:["#e3d0a4","#c98b5a"],swamp:["#a3b487","#4f736d"]};
  const WATER={rural:RIVERS.rural.water,urban:RIVERS.urban.water,desert:RIVERS.desert.water,swamp:RIVERS.swamp.water};
  const swatch=(el,e)=>{el.style.background=`linear-gradient(135deg,${SW[e][0]} 55%,${SW[e][1]} 55%)`;};
  const layName=L=>`Wastewater plant ${L.ww==="east"?"behind the maintenance shop":"behind stock prep"}, clarifier on the ${(L.ww==="east")!==L.flip?"east":"west"} side`;
  // menu row
  function siteRow(){const E=ENVS[SITE.env];$("v2siteN").textContent=E.name+(SITE.choice==="any"?" (surprise)":"");
    $("v2siteM").textContent=E.pros[0].split(":")[0]+" · "+E.cons[0].split(":")[0];swatch($("v2siteSw"),SITE.env);}
  siteRow();
  // picker
  const ov=$("siteOv"),envs=$("siteEnvs"),det=$("siteDet"),anyBtn=$("siteAny");let pick=SITE.env,any=SITE.choice==="any";
  // v4.2.4: compact picker. Four small tiles (name and the headline pro and con); the picked site's story and its full
  // list of pros and cons sit in one panel underneath. (The site plan preview is gone.)
  const tag=t=>t.split(":")[0];
  ENV_IDS.forEach(id=>{const E=ENVS[id],b=document.createElement("button");b.type="button";b.setAttribute("role","radio");b.dataset.env=id;
    b.innerHTML=`<div class="eh"><span class="sw"></span><b>${E.name}</b></div><small><i class="pro">+</i> ${tag(E.pros[0])}<br><i class="con">−</i> ${tag(E.cons[0])}</small>`;
    swatch(b.querySelector(".sw"),id);b.addEventListener("click",()=>{pick=id;sync();});envs.appendChild(b);});
  function detail(){const E=ENVS[pick];det.innerHTML=`<p>${E.blurb}</p><div class="pc"><ul>${E.pros.map(t=>`<li class="pro">${t}</li>`).join("")}</ul><ul>${E.cons.map(t=>`<li class="con">${t}</li>`).join("")}</ul></div>`;}
  envs.addEventListener("keydown",e=>{const k=e.key;if(!["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"].includes(k))return;e.preventDefault();
    const i=ENV_IDS.indexOf(pick),n=ENV_IDS[(i+(k==="ArrowRight"||k==="ArrowDown"?1:ENV_IDS.length-1))%ENV_IDS.length];pick=n;sync();envs.querySelector(`[data-env="${n}"]`).focus();});
  anyBtn.addEventListener("click",()=>{any=!any;sync();});
  function sync(){envs.querySelectorAll("button").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.env===pick)));
    envs.querySelectorAll("button").forEach(b=>b.tabIndex=b.dataset.env===pick?0:-1);envs.classList.toggle("any",any);
    anyBtn.setAttribute("aria-pressed",String(any));anyBtn.querySelector("b").textContent=any?"Surprise me: on":"Surprise me";detail();
    const same=(any?SITE.choice==="any":pick===SITE.env&&SITE.choice!=="any");
    $("siteGo").textContent=same&&SITE.saved?"Keep this site":"Build here";}
  $("v2siteBtn").addEventListener("click",()=>{pick=SITE.env;any=SITE.choice==="any";sync();ov.hidden=false;setTimeout(()=>{const b=envs.querySelector('[aria-checked="true"]');if(b)b.focus();},0);});
  $("siteNo").addEventListener("click",()=>{ov.hidden=true;});
  ov.addEventListener("keydown",e=>{if(e.key==="Escape"){ov.hidden=true;$("v2siteBtn").focus();}});
  $("siteGo").addEventListener("click",()=>{if($("siteGo").textContent==="Keep this site"){ov.hidden=true;return;}
    siteSave(any?"any":pick);const q=new URLSearchParams(location.search);q.delete("env");q.delete("mill");const qs=q.toString();
    const u=location.pathname+(qs?"?"+qs:"")+location.hash;if(u===location.pathname+location.search+location.hash)location.reload();else location.href=u;});}
