/* ---------- v5.2 title screen ----------
   Shown on every page load, over the 3D mill while it builds and precompiles. One of five backgrounds (TITLE_ART,
   50a) is picked at random per load, with a slow drift, a tilt-shift (bokeh) blur top and bottom, floating light
   orbs and a vignette. The flow is Mode → Map → Leader:
     Season / Survival: map step, then the leader picker (09c), then the run.
     Free play: map step, then straight into the mill.
     Zen: straight in (zen tours every map on its own).
   A different map reloads the page (the 3D scene is built once per load): the choice is kept in sessionStorage
   (paper-mill-start) with the same background, and the next load opens the leader picker (or free play) at once.
   The pause menu's "Main menu" and leaving zen come back here; Continue goes back to the run in progress, or to a
   saved run (the menu's Continue button, 51c). Skipped for tests (?env=, ?autotest, ?notitle, or window.__PM_NOTITLE from tools/bench.py) and zen's own reloads
   (?zen=1). Its theme music is "Morning at the Mill" (02-audio.js). */
function titleSoundPaint(){const b=document.getElementById("tSnd");if(!b)return;const on=soundPref==="on";b.setAttribute("aria-pressed",String(on));b.setAttribute("aria-label",on?"Sound on. Turn sound off":"Sound off. Turn sound on");
  b.innerHTML=on?'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
    :'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 6 6M22 9l-6 6"/></svg>';}
function camPullOn(){try{return localStorage.getItem("paper-mill-campull")!=="off";}catch(e){return true;}}
(function(){
  const Q=new URLSearchParams(location.search),SKIP=Q.has("env")||Q.has("autotest")||Q.has("notitle")||Q.get("zen")==="1"||!!window.__PM_NOTITLE;   // (__PM_NOTITLE: the test tools, tools/bench.py)
  const KEY="paper-mill-start",ENVART={rural:"forest-valley",urban:"harbour-tug",desert:"desert-cowboys",swamp:"bayou-night"};
  let pend=null;try{pend=JSON.parse(sessionStorage.getItem(KEY)||"null");sessionStorage.removeItem(KEY);}catch(e){}
  if(pend&&!(pend.at&&Date.now()-pend.at<120000&&["season","surv","free"].includes(pend.mode)))pend=null;
  // ---- the background: random per load (never the same scene twice in a row), kept across a map-change reload ----
  let art=0;{let lastA=-1;try{lastA=+(localStorage.getItem("paper-mill-title-art")??-1);}catch(e){}
    // (v5.2 QA: after a map change the background is the new map's own scene, so the picture matches what was picked)
    const own=pend?TITLE_ART.findIndex(a=>a.id===ENVART[SITE.env]):-1;
    if(own>=0)art=own;else if(pend&&TITLE_ART[pend.art])art=pend.art;else{do{art=Math.floor(Math.random()*TITLE_ART.length);}while(TITLE_ART.length>1&&art===lastA);}
    try{localStorage.setItem("paper-mill-title-art",String(art));}catch(e){}}
  // light orbs drift through the blur, tinted to each scene
  const ORB={"bird-cutscene":["#ffe6b0","#bfe3ff","#fff4dc"],"forest-valley":["#ffe7a3","#d9f5b8","#fff6d8"],"bayou-night":["#ffb347","#ffd27a","#ff8f5a"],
    "desert-cowboys":["#ffd59a","#ffe9c4","#ffb87a"],"harbour-tug":["#bfe9ff","#ffe2a8","#d7f2ff"]};
  const MODES=[
    {id:"season",name:"Season",sub:"30 days · most profit · leaderboard",ico:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'},
    {id:"surv",name:"Survival",sub:"outlast the waves · leaderboard",ico:'<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'},
    {id:"free",name:"Free Play",sub:"free upgrades · no clock",ico:'<rect height="4" rx="1" width="18" x="3" y="8"/><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>'},
    {id:"zen",name:"Zen Mode",sub:"sit back and watch",ico:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.2-6"/>'}];
  const svg=p=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const esc=escHTML;
  const el=document.createElement("div");el.className="title";el.id="title";el.hidden=true;
  el.innerHTML=`<div class="tbg" aria-hidden="true"><div class="tdrift"><div class="timg"></div><div class="timg tblur"></div></div><div class="torbs"></div><div class="tvig"></div><div class="tshade"></div></div>
    <div class="tmain" id="tMain">
      <header class="tlogo"><span class="temb" aria-hidden="true"><svg viewBox="0 0 48 48" width="44" height="44"><rect x="6" y="14" width="36" height="22" rx="11" fill="currentColor" opacity=".25"/><ellipse cx="17" cy="25" rx="9" ry="11" fill="none" stroke="currentColor" stroke-width="3"/><ellipse cx="17" cy="25" rx="3.2" ry="4" fill="currentColor"/><path d="M17 14h17a9 11 0 0 1 0 22H17" fill="none" stroke="currentColor" stroke-width="3"/><path d="M34 36h8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span>
        <h1><small>The</small>Paper Mill</h1><p class="twel" id="tWel"></p></header>
      <nav class="tmodes" aria-label="Game mode"><button class="tcont" id="tCont" hidden><span class="tico">${svg('<path d="M8 5v14l11-7z"/>')}</span><span><b>Continue</b><small id="tContS"></small></span></button>
        ${MODES.map(m=>`<button data-mode="${m.id}"><span class="tico">${svg(m.ico)}</span><span><b>${m.name}</b><small>${m.sub}</small></span><i class="tchev" aria-hidden="true">${svg('<path d="m9 6 6 6-6 6"/>')}</i></button>`).join("")}</nav>
    </div>
    <section class="tpanel tmap" id="tMap" hidden role="dialog" aria-modal="true" aria-labelledby="tMapH"><div class="tpk" id="tMapK"></div><h2 id="tMapH">Choose your map</h2>
      <div class="tenvs" id="tEnvs" role="radiogroup" aria-label="Map"></div>
      <button class="tany" id="tAny" type="button" aria-pressed="false"><b>Surprise me</b><small>a different map every visit</small></button>
      <p class="tdet" id="tDet" aria-live="polite"></p>
      <div class="tbtns"><button id="tMapBack" type="button">Back</button><button class="tgo" id="tMapGo" type="button">Next</button></div></section>
    <section class="tpanel tset" id="tSet" hidden role="dialog" aria-modal="true" aria-labelledby="tSetH"><h2 id="tSetH">Settings</h2><div id="tSetBody"></div>
      <div class="tbtns"><button class="tgo" id="tSetDone" type="button">Done</button></div></section>
    <div class="tload" id="tLoad" hidden><span class="tspin" aria-hidden="true"></span><span id="tLoadT">Building your mill…</span></div>
    <footer class="tbar"><button class="tround" id="tCog" type="button" aria-label="Settings">${svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>')}</button>
      <span class="tver">${esc(APP_VER)}</span><button class="tround" id="tSnd" type="button"></button></footer>`;
  document.body.appendChild(el);
  const $t=id=>el.querySelector("#"+id),main=$t("tMain"),mapP=$t("tMap"),setP=$t("tSet");
  // ---- background, picked for the screen's shape (re-picked on rotation, same scene) ----
  const A=TITLE_ART[art],PHONE=matchMedia("(max-aspect-ratio: 9/10)");
  const paintBg=()=>{const u=`url("${PHONE.matches?A.p:A.d}")`;el.querySelectorAll(".timg").forEach(d=>d.style.backgroundImage=u);};
  paintBg();try{PHONE.addEventListener("change",paintBg);}catch(e){}
  el.dataset.art=A.id;
  {const orbs=el.querySelector(".torbs"),cols=ORB[A.id]||ORB["forest-valley"],n=matchMedia("(pointer: coarse)").matches?9:14;
    for(let i=0;i<n;i++){const o=document.createElement("i"),s=24+Math.random()*120,c=cols[i%cols.length];
      o.style.cssText=`left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()<0.5?Math.random()*34:62+Math.random()*38).toFixed(1)}%;width:${s.toFixed(0)}px;height:${s.toFixed(0)}px;`+
        `background:radial-gradient(circle,${c} 0,${c}cc 38%,${c}00 70%);opacity:${(0.16+Math.random()*0.28).toFixed(2)};animation-duration:${(18+Math.random()*24).toFixed(1)}s;animation-delay:${(-Math.random()*30).toFixed(1)}s`;
      orbs.appendChild(o);}}
  // ---- show / hide ----
  let mode=null;
  const welcome=()=>{$t("tWel").textContent="Welcome to "+(MILL.name||"your mill");};
  function contState(){const c=document.getElementById("v2cont"),b=$t("tCont"),s=$t("tContS");
    if(c&&G3.first){b.hidden=false;b.querySelector("b").textContent=c.querySelector("b").textContent;s.textContent=c.querySelector("small").textContent;return;}
    if(!G3.first){const se=S.season&&S.season.on;b.hidden=false;b.querySelector("b").textContent="Continue";
      s.textContent=se?(S.season.surv?`Survival · wave ${survWave()} · day ${Math.floor(S.t/1440)+1}`:`Season · day ${Math.min(30,Math.floor(S.t/1440)+1)} of 30`):S.free?"Free play":"Back to the mill";return;}
    b.hidden=true;}
  // (v5.2 QA: the second tap of a double tap, landing on the same spot within 300 ms of a step change, is ignored, so it
  // can't act on the button that has just appeared under the finger. Other taps go through.)
  let stepAt=0,lastXY=null,stepXY=null;
  el.addEventListener("click",e=>{const xy=e.detail?[e.clientX,e.clientY]:null;
    if(xy&&stepXY&&performance.now()-stepAt<300&&Math.hypot(xy[0]-stepXY[0],xy[1]-stepXY[1])<24){e.stopPropagation();e.preventDefault();return;}lastXY=xy;},true);
  function step(k,nofocus){stepAt=performance.now();stepXY=lastXY;lastXY=null;main.hidden=k!=="main";mapP.hidden=k!=="map";setP.hidden=k!=="set";el.dataset.step=k;
    const f=k==="map"?$t("tEnvs").querySelector('[aria-checked="true"]'):k==="set"?$t("tSetDone"):el.querySelector(".tmodes button:not([hidden])");if(f&&!nofocus)setTimeout(()=>f.focus({preventScroll:true}),30);}
  let hideT=0;
  function show(){clearTimeout(hideT);el.classList.remove("out");running=false;welcome();contState();titleSoundPaint();el.hidden=false;document.documentElement.classList.remove("pm-boot");document.body.classList.add("titleon");
    const m=document.getElementById("v2menu");if(m)m.hidden=true;step("main",true);try{AUDIO.title(true);}catch(e){}}
  function hide(){if(el.hidden)return;el.classList.add("out");document.body.classList.remove("titleon");try{AUDIO.title(false);}catch(e){}
    hideT=setTimeout(()=>{el.hidden=true;el.classList.remove("out");$t("tLoad").hidden=true;},650);}
  G3.titleShow=show;G3.titleHide=hide;
  // while a start waits for the start-up precompile: a "getting ready" note, and further taps are ignored
  const busy=()=>!$t("tLoad").hidden;const wait=()=>{$t("tLoadT").textContent="Getting the mill ready…";$t("tLoad").hidden=false;};
  // ---- modes ----
  let zenArm=0,freeArm=0;
  el.querySelectorAll(".tmodes [data-mode]").forEach(b=>b.addEventListener("click",()=>{const m=b.dataset.mode;
    if(m==="zen"){const run=S.season&&S.season.on,sm=b.querySelector("small");
      if(run&&Date.now()-zenArm>=3000){zenArm=Date.now();sm.textContent=`ends this ${S.season.surv?"survival run":"season"} · tap again`;b.classList.add("warn");setTimeout(()=>{sm.textContent="sit back and watch";b.classList.remove("warn");},3000);return;}
      zenArm=0;G3.goZen();return;}
    if(m==="free"&&S.season&&S.season.on&&!S.free){const sm=b.querySelector("small");
      if(Date.now()-freeArm>=3000){freeArm=Date.now();sm.textContent=`ends this ${S.season.surv?"survival run":"season"} · tap again`;b.classList.add("warn");setTimeout(()=>{sm.textContent="free upgrades · no clock";b.classList.remove("warn");},3000);return;}
      freeArm=0;}
    openMap(m);}));
  $t("tCont").addEventListener("click",()=>{const c=document.getElementById("v2cont");if(c&&G3.first){if(busy())return;if(!G3.warm)wait();c.click();return;}G3.play();});
  // ---- map step ----
  const MODEN={season:"Season",surv:"Survival",free:"Free play"},envs=$t("tEnvs");let pick=SITE.env,any=SITE.choice==="any";
  ENV_IDS.forEach(id=>{const E=ENVS[id],b=document.createElement("button"),th=TITLE_ART.find(a=>a.id===ENVART[id]);b.type="button";b.setAttribute("role","radio");b.dataset.env=id;
    b.innerHTML=`<span class="tth" style="background-image:url('${th?th.t:""}')"></span><b>${esc(E.name)}</b><small><i class="pro">+</i> ${esc(E.pros[0].split(":")[0])}<br><i class="con">−</i> ${esc(E.cons[0].split(":")[0])}</small>`;
    b.addEventListener("click",()=>{pick=id;any=false;paintMap();});envs.appendChild(b);});
  envs.addEventListener("keydown",e=>{const k=e.key;if(!["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"].includes(k))return;e.preventDefault();
    const i=ENV_IDS.indexOf(pick),n=ENV_IDS[(i+(k==="ArrowRight"||k==="ArrowDown"?1:ENV_IDS.length-1))%ENV_IDS.length];pick=n;any=false;paintMap();envs.querySelector(`[data-env="${n}"]`).focus();});
  $t("tAny").addEventListener("click",()=>{any=!any;paintMap();});
  function paintMap(){envs.querySelectorAll("button").forEach(b=>{const on=!any&&b.dataset.env===pick;b.setAttribute("aria-checked",String(on));b.tabIndex=b.dataset.env===pick?0:-1;});
    $t("tAny").setAttribute("aria-pressed",String(any));$t("tAny").querySelector("b").textContent=any?"Surprise me: on":"Surprise me";
    $t("tDet").textContent=any?"A map is rolled each time the game loads. Same paper machine everywhere: the land, utilities and costs change.":ENVS[pick].blurb;
    const reload=any||pick!==SITE.env||SITE.choice==="any";
    $t("tMapGo").textContent=reload?"Build here":mode==="free"?"Start free play":"Choose your leader";}
  function openMap(m){mode=m;pick=SITE.env;any=SITE.choice==="any";$t("tMapK").textContent=MODEN[m];paintMap();step("map");}
  $t("tMapBack").addEventListener("click",()=>step("main"));
  function proceed(m){if(m==="season")G3.goSeason();else if(m==="surv")G3.goSurv();else{if(busy())return;if(!G3.warm)wait();G3.goFree();}}
  $t("tMapGo").addEventListener("click",()=>{const reload=any||pick!==SITE.env||SITE.choice==="any";
    if(!reload){proceed(mode);return;}
    siteSave(any?"any":pick);try{sessionStorage.setItem(KEY,JSON.stringify({mode,art,at:Date.now()}));}catch(e){}
    $t("tLoadT").textContent=`Building your mill${any?"":" in the "+ENVS[pick].name.toLowerCase()}…`;$t("tLoad").hidden=false;mapP.hidden=true;
    const q=new URLSearchParams(location.search);q.delete("env");q.delete("mill");const qs=q.toString(),u=location.pathname+(qs?"?"+qs:"")+location.hash;
    setTimeout(()=>{if(u===location.pathname+location.search+location.hash)location.reload();else location.href=u;},250);});
  // ---- settings ----
  const tog=(id,label,sub,on)=>`<label class="trow"><span><b>${label}</b>${sub?`<small>${sub}</small>`:""}</span><input type="checkbox" class="tsw" id="${id}"${on?" checked":""}/></label>`;
  function paintSet(){let vol=70;try{vol=+(localStorage.getItem("paper-mill-vol")||70);}catch(e){}
    const tut=(()=>{try{return localStorage.getItem("paper-mill-tutorial")!=="off";}catch(e){return true;}})(),sh=$("viewShadows");
    $t("tSetBody").innerHTML=`<div class="tsub">Sound</div>${tog("tsSound","Sound","music and mill sounds",soundPref==="on")}
      <label class="trow"><span><b>Volume</b></span><input type="range" id="tsVol" min="0" max="100" step="5" value="${vol}" aria-label="Volume"/></label>
      <div class="tsub">Play</div>${tog("tsCam","Fly to big moments","the camera visits major upsets and civics crises, then comes back",camPullOn())}
      ${tog("tsTut","Quick-start tutorial","shown when a season or survival run starts",tut)}
      <div class="tsub">Graphics</div>${tog("tsShadow","Shadows","",!sh||sh.checked)}
      <div class="trow"><span><b>Appearance</b><small>Auto follows your device</small></span>${themeSegHTML("tseg")}</div>
      <div class="trow"><span><b>Frame rate</b></span><div class="tseg" role="group" aria-label="Frame rate"><button data-f="saver" aria-pressed="${FPS_MODE==="saver"}">Battery saver</button><button data-f="smooth" aria-pressed="${FPS_MODE!=="saver"}">Smooth</button></div></div>
      <div class="tsub">Your mill</div><div class="tgrid"><button id="tsBoard">Leaderboards</button><button id="tsColors">New colors</button><button id="tsName">Rename</button><button id="tsFs">Fullscreen</button></div>
      <div class="tname" id="tsNameRow" hidden><input id="tsNameIn" maxlength="32" autocomplete="off" spellcheck="false" aria-label="Mill name"/><button class="tgo" id="tsNameOk">Save</button></div><p class="tnote" id="tsNote"></p>`;
    $t("tsSound").addEventListener("change",e=>{setSound(e.target.checked);titleSoundPaint();});
    $t("tsVol").addEventListener("input",e=>{const v=+e.target.value;AUDIO.setVol(v/100);try{localStorage.setItem("paper-mill-vol",String(v));}catch(_){}});
    $t("tsCam").addEventListener("change",e=>{try{localStorage.setItem("paper-mill-campull",e.target.checked?"on":"off");}catch(_){}});
    $t("tsTut").addEventListener("change",e=>{try{localStorage.setItem("paper-mill-tutorial",e.target.checked?"on":"off");}catch(_){}});
    $t("tsShadow").addEventListener("change",e=>{if(sh&&sh.checked!==e.target.checked)sh.click();});
    $t("tSetBody").querySelectorAll(".tseg button[data-f]").forEach(b=>b.addEventListener("click",()=>{setFpsMode(b.dataset.f);$t("tSetBody").querySelectorAll(".tseg button[data-f]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));}));
    $t("tsBoard").addEventListener("click",()=>openBoard());
    $t("tsColors").addEventListener("click",()=>{rollMill();welcome();$t("tsNote").textContent="New colors: "+MILL.name;});
    $t("tsName").addEventListener("click",()=>{$t("tsNameRow").hidden=false;const i=$t("tsNameIn");i.value=MILL.name;i.focus();i.select();});
    const saveName=()=>{const i=$t("tsNameIn"),r=renameMill(i.value);if(r===false||r==="chars"){i.value="";i.placeholder=r==="chars"?"Letters, numbers, spaces and . _ ' - & only":"That name is not allowed";i.focus();return;}
      $t("tsNameRow").hidden=true;welcome();$t("tsNote").textContent="Renamed: "+MILL.name;};
    $t("tsNameOk").addEventListener("click",saveName);$t("tsNameIn").addEventListener("keydown",e=>{if(e.key==="Enter")saveName();});
    $t("tsFs").addEventListener("click",()=>{const d=document.documentElement;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else if(d.requestFullscreen)d.requestFullscreen().catch(()=>{});else $t("tsNote").textContent="On iPhone: tap Share, then Add to Home Screen to play fullscreen.";});}
  $t("tCog").addEventListener("click",()=>{if(setP.hidden){paintSet();step("set");}else step("main");});
  $t("tSetDone").addEventListener("click",()=>step("main"));
  $t("tSnd").addEventListener("click",()=>{setSound(soundPref!=="on");titleSoundPaint();});
  // (v5.2 QA: on the document, not the title, so Esc still works once focus has left it, e.g. after backing out of the
  // leader picker; the picker's own Esc stops the event first. Focus comes back to the map step's button.)
  document.addEventListener("keydown",e=>{if(e.key!=="Escape"||el.hidden||el.classList.contains("out"))return;if(document.querySelector("#leadOv:not([hidden]),#lbOv:not([hidden])"))return;
    if(!mapP.hidden||!setP.hidden){e.preventDefault();step("main");}});
  const refocus=()=>setTimeout(()=>{if(el.hidden||mapP.hidden)return;const a=document.activeElement;if(!a||a===document.body||!el.contains(a))$t("tMapGo").focus({preventScroll:true});},0);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")refocus();},true);document.addEventListener("click",e=>{if(e.target&&e.target.id==="ld-no")refocus();},true);
  // ---- start ----
  if(SKIP){document.documentElement.classList.remove("pm-boot");return;}
  show();
  if(pend){mode=pend.mode;openMap(pend.mode);$t("tLoadT").textContent="Building your mill…";$t("tLoad").hidden=false;mapP.hidden=true;
    const go=()=>{if(!G3.ok){if(G3.ok===false){$t("tLoad").hidden=true;mapP.hidden=false;return;}setTimeout(go,200);return;}$t("tLoad").hidden=true;mapP.hidden=false;paintMap();proceed(pend.mode);};setTimeout(go,300);}
})();
