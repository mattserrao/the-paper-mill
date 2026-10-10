// ---- diagnostics snapshot + panel ----
(()=>{let lastN=0,lastT=performance.now();
  const snap=()=>{try{const t=performance.now(),fps=((frame.n||0)-lastN)/((t-lastT)/1000);lastN=frame.n||0;lastT=t;const R=G3.renderer,I=R&&R.info;
    diag(`snap fps=${fps.toFixed(0)} running=${running} day=${(S.t/1440).toFixed(2)} pm=${S.pm} wd=${S.wd} inc=[${S.inc.map(i=>i.id).join(",")}] audio=${AUDIO.info} on=${AUDIO.on}`+
      (I?` calls=${I.render.calls} tris=${I.render.triangles} geo=${I.memory.geometries} tex=${I.memory.textures} prog=${I.programs?I.programs.length:"?"}`:"")+
      (G3.SM?` watched=${G3.SM.list.length} batches=${G3.SM.bms.length} handedBack=${G3.SM.handedBack}${G3.SM.done?"":" (merging)"}`:"")+(performance.memory?` heap=${(performance.memory.usedJSHeapSize/1e6).toFixed(0)}MB`:"")+(G3.lost?" GL-LOST":"")+
      (()=>{const F=G3.FT,p=F&&F.pct();return p?` ft p50=${p.p50.toFixed(1)} p95=${p.p95.toFixed(1)} p99=${p.p99.toFixed(1)}ms >50ms=${F.over50}/${F.total}`:"";})());}catch(e){diag("snap failed "+e.message);}};
  setInterval(snap,15000);setTimeout(snap,3000);
  function header(){let gl="";try{const g=G3.renderer.getContext(),ext=g.getExtension("WEBGL_debug_renderer_info");
      gl=`three r${THREE_VER} WebGL2 ${ext?g.getParameter(ext.UNMASKED_RENDERER_WEBGL):""} maxTex=${g.getParameter(g.MAX_TEXTURE_SIZE)} fragUnif=${g.getParameter(g.MAX_FRAGMENT_UNIFORM_VECTORS)} lost=${g.isContextLost()}`;}catch(e){gl="no GL info";}
    return `Paper Mill ${APP_VER} · ${new Date().toISOString()}\n${navigator.userAgent}\nscreen ${screen.width}x${screen.height} dpr=${devicePixelRatio} · ${gl}\n`+frameTimes();}
  // frame times while playing: the last ~10 s and everything since play started, with the graphics settings in force
  function frameTimes(){const F=G3.FT,R=G3.renderer;if(!F)return "";const p=F.pct(),mins=((performance.now()-(F.since||performance.now()))/60000).toFixed(1);
    const set=R?`pixel ratio ${R.getPixelRatio()} · shadows ${R.shadowMap.enabled?(G3.shadowHz||"every frame")+" Hz":"off"} · cap ${FRAME_CAP?FRAME_CAP+" FPS":"none"} · draws ${R.info.render.calls}`:"";
    if(!p)return `\nFRAME TIMES: none yet (start playing)\n  ${set}\n`;
    const pc=v=>F.total?(100*v/F.total).toFixed(1)+"%":"0%";
    return `\nFRAME TIMES (last ${F.n} frames · since play started ${mins} min ago)\n`+
      `  ${p.fps.toFixed(1)} fps · p50 ${p.p50.toFixed(1)} ms · p95 ${p.p95.toFixed(1)} ms · p99 ${p.p99.toFixed(1)} ms\n`+
      `  since start: ${F.total} frames · over 33 ms ${F.over33} (${pc(F.over33)}) · over 50 ms ${F.over50} (${pc(F.over50)}) · worst ${F.worst.toFixed(0)} ms\n  ${set}\n`;}

  // ---- v2.9.11 performance test: a scene census, then 8 short phases that switch one thing off at a time ----
  let perfReport="";
  function census(){const D=G3.diagScene&&G3.diagScene();if(!D)return ["no 3D view"];const {scene,renderer,parts}=D,L=[];
    const gl=renderer.getContext(),ca=gl.getContextAttributes(),db=[gl.drawingBufferWidth,gl.drawingBufferHeight];
    L.push(`canvas ${db[0]}x${db[1]} (${(db[0]*db[1]/1e6).toFixed(2)} MP) pixelRatio=${renderer.getPixelRatio()} devicePixelRatio=${devicePixelRatio} antialias=${ca.antialias} frameCap=${G3.cap||"none"} simSpeed=${C.simSpeed}`);
    L.push(`shadows enabled=${renderer.shadowMap.enabled} type=${renderer.shadowMap.type} autoUpdate=${renderer.shadowMap.autoUpdate} refresh=${G3.shadowHz||"every frame"}Hz`);
    const c={mesh:0,inst:0,instN:0,line:0,sprite:0,cast:0,transp:0,lights:[],mats:new Map()};const groups=new Map();
    scene.traverseVisible(o=>{let top=o;while(top.parent&&top.parent!==scene)top=top.parent;
      const draw=(o.isMesh||o.isLine||o.isSprite||o.isPoints)&&o.layers.mask===1;
      if(o.isLight)c.lights.push(o.type.replace("Light","")+(o.intensity?"":"(off)"));
      if(!draw)return;
      if(o.isInstancedMesh){c.inst++;c.instN+=o.count;}else if(o.isMesh)c.mesh++;else if(o.isLine)c.line++;else if(o.isSprite)c.sprite++;
      if(o.castShadow&&o.isMesh)c.cast++;
      (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(!m)return;if(m.transparent)c.transp++;c.mats.set(m.type,(c.mats.get(m.type)||0)+1);});
      const key=top===o?(o.isSprite?"particles / sprites":o.isInstancedMesh?"instanced: "+(o.geometry.type||""):"loose "+o.type):(top.name||Object.keys(top.userData||{}).slice(0,3).join("|")||top.type);
      groups.set(key,(groups.get(key)||0)+1);});
    const I=renderer.info;
    L.push(`visible drawables: ${c.mesh} meshes, ${c.inst} instanced (${c.instN} instances), ${c.line} lines, ${c.sprite} sprites · shadow casters ${c.cast} · transparent ${c.transp}`);
    L.push(`materials in view: ${[...c.mats].map(([k,v])=>k.replace("Material","")+" "+v).join(", ")} · lights: ${c.lights.join(", ")}`);
    L.push(`gpu memory objects: ${I.memory.geometries} geometries, ${I.memory.textures} textures, ${I.programs?I.programs.length:"?"} shader programs · last frame ${I.render.calls} draw calls, ${I.render.triangles} triangles`);
    L.push(`particles alive ${parts.filter(p=>p.alive).length} / pool ${parts.length} · HTML labels ${document.querySelectorAll(".lbl").length} (${[...document.querySelectorAll(".lbl")].filter(e=>!e.hidden&&e.offsetParent).length} shown) · DOM nodes ${document.getElementsByTagName("*").length}`);
    L.push("biggest groups (visible drawables): "+[...groups].sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>`${k}=${v}`).join(" · "));
    return L;}
  const PHASES=[
    {name:"as you play (current frame-rate mode)",on:()=>{},off:()=>{}},
    {name:"uncapped baseline",on:()=>{G3.capOff=true;},off:()=>{}},
    {name:"shadows OFF",on:()=>{const D=G3.diagScene();D.renderer.shadowMap.enabled=false;D.MATS.forEach(m=>m.needsUpdate=true);},off:()=>{const D=G3.diagScene();D.renderer.shadowMap.enabled=true;D.renderer.shadowMap.needsUpdate=true;D.MATS.forEach(m=>m.needsUpdate=true);}},
    {name:"half resolution",on:()=>{const D=G3.diagScene();PHASES._pr=D.renderer.getPixelRatio();D.renderer.setPixelRatio(PHASES._pr*0.5);D.resize();},off:()=>{const D=G3.diagScene();D.renderer.setPixelRatio(PHASES._pr);D.resize();}},
    {name:"particles OFF",on:()=>{G3.EXP.noParts=true;},off:()=>{G3.EXP.noParts=false;}},
    {name:"people + vehicles hidden",on:()=>{G3.EXP.noMovers=true;},off:()=>{G3.EXP.noMovers=false;}},
    {name:"HTML labels hidden",on:()=>{document.body.classList.add("diagNoLbl");},off:()=>{document.body.classList.remove("diagNoLbl");}},
    {name:"3D render skipped (CPU-only ceiling)",on:()=>{G3.EXP.noRender=true;},off:()=>{G3.EXP.noRender=false;}}];
  function runPerf(done){if(!G3.PF){done("no 3D view");return;}const st=document.createElement("style");st.textContent=".diagNoLbl .lbl{display:none!important}";document.head.appendChild(st);
    const wasRunning=running;if(!running){running=true;}
    const ban=document.createElement("div");ban.style.cssText="position:fixed;left:16px;right:16px;top:70px;z-index:410;background:#111c;color:#fff;border-radius:10px;padding:10px 12px;font:600 13px system-ui;text-align:center;pointer-events:none";document.body.appendChild(ban);
    const out=["PERF census:",...census().map(x=>"  "+x),"PERF phases (settle 1.5 s, measure 3 s each):"];let base=null,i=0;
    const PF=G3.PF;
    const next=()=>{if(i>=PHASES.length){G3.capOff=false;running=wasRunning;ban.remove();st.remove();
        // section breakdown from the uncapped baseline
        out.push("PERF time per frame by section (uncapped baseline, ms/frame):");
        Object.entries(base.acc).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>out.push(`  ${(v/Math.max(1,base.frames)).toFixed(2).padStart(6)}  ${k}`));
        out.push(`  ${(base.jsAvg).toFixed(2).padStart(6)}  = total JavaScript per frame (sim + 3D + UI)`);
        perfReport=out.join("\n");diag("performance test finished");done(perfReport);return;}
      const ph=PHASES[i];ban.textContent=`Performance test ${i+1}/${PHASES.length}: ${ph.name} - please don't touch the screen`;ph.on();
      setTimeout(()=>{PF.acc={};PF.frames=0;PF.calls=0;PF.tris=0;PF.gaps=[];PF.js=[];PF.lastNow=0;PF.on=true;
        setTimeout(()=>{PF.on=false;const g=PF.gaps.slice(1).sort((a,b)=>a-b),n=g.length,avg=n?g.reduce((a,b)=>a+b,0)/n:0,p90=n?g[Math.floor(n*0.9)]:0,
            js=PF.js.length?PF.js.reduce((a,b)=>a+b,0)/PF.js.length:0,fps=n?1000/avg:0,calls=PF.frames?PF.calls/PF.frames:0,tris=PF.frames?PF.tris/PF.frames:0;
          if(i===1)base={acc:{...PF.acc},frames:PF.frames,jsAvg:js};
          out.push(`  ${String(i+1)}. ${ph.name.padEnd(36)} ${fps.toFixed(1).padStart(5)} fps · frame ${avg.toFixed(1)} ms (p90 ${p90.toFixed(1)}) · JS ${js.toFixed(1)} ms · ${calls.toFixed(0)} draws · ${(tris/1000).toFixed(0)}k tris`);
          ph.off();i++;setTimeout(next,300);},3000);},1500);};
    next();}
  function open(){snap();let d=document.getElementById("diagOv");if(!d){d=document.createElement("div");d.id="diagOv";
      d.style.cssText="position:fixed;inset:12px;z-index:400;background:var(--panel,#fff);color:var(--ink,#111);border:1px solid var(--line,#ccc);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.3);display:flex;flex-direction:column;padding:10px;gap:8px";
      d.innerHTML='<div style="display:flex;gap:8px;align-items:center"><b style="flex:1;font:700 15px system-ui">Diagnostics</b><button id="diagPerf">Performance test (25 s)</button><button id="diagCopy">Copy</button><button id="diagClose">Close</button></div><pre id="diagTxt" style="flex:1;overflow:auto;margin:0;font:11px/1.35 ui-monospace,monospace;white-space:pre-wrap;word-break:break-word"></pre>';
      document.body.appendChild(d);d.querySelector("#diagClose").onclick=()=>d.hidden=true;
      d.querySelector("#diagCopy").onclick=()=>{const t=d.querySelector("#diagTxt").textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{d.querySelector("#diagCopy").textContent="Copied";},()=>{const r=document.createRange();r.selectNodeContents(d.querySelector("#diagTxt"));const s=getSelection();s.removeAllRanges();s.addRange(r);});};}
    d.querySelector("#diagCopy").textContent="Copy";d.querySelector("#diagTxt").textContent=header()+(perfReport?"\n"+perfReport+"\n":"")+"\n"+DIAG.slice().reverse().join("\n");d.hidden=false;
    d.querySelector("#diagPerf").onclick=()=>{d.hidden=true;runPerf(()=>open());};}
  {const seg=document.createElement("div");seg.className="seg";seg.id="fpsSeg";seg.setAttribute("role","group");seg.setAttribute("aria-label","Frame rate");
    seg.innerHTML=`<button data-fps="saver" aria-pressed="${FRAME_CAP===30}" title="30 fps: cooler phone, longer battery">Battery saver</button><button data-fps="smooth" aria-pressed="${FRAME_CAP!==30}" title="Full frame rate: smoother, uses more battery">Smooth</button>`;
    seg.querySelectorAll("button").forEach(x=>x.addEventListener("click",()=>setFpsMode(x.dataset.fps==="smooth")));
    const row0=document.getElementById("v2ctlrow");if(row0)row0.appendChild(seg);}
  {const l=document.createElement("label");l.className="check";l.innerHTML='<input id="showFps" type="checkbox"/> Show FPS';
    const row0=document.getElementById("v2ctlrow");if(row0)row0.appendChild(l);
    l.querySelector("input").addEventListener("change",e=>setShowFps(e.target.checked));
    let on=false;try{on=localStorage.getItem("paper-mill-showfps")==="1";}catch(e){}if(on)setShowFps(true);}
  const b=document.createElement("button");b.id="diagBtn";b.textContent="Diagnostics";b.addEventListener("click",open);
  const row=document.getElementById("v2ctlrow");if(row)row.appendChild(b);else document.body.appendChild(b);
  window.__openDiag=open;})();
// test and benchmark hook (read-only views plus a few controls); used by the benchmark harness and smoke tests
window.__PM={get THREE(){return THREE},get S(){return S},get C(){return C},get G3(){return G3},get EVENTS(){return EVENTS},get CH(){return CH},SIM_STEP,
  trigger:(...a)=>trigger(...a),step:h=>step(h),reseed:k=>seedRun(k),setFps:v=>setFpsMode(v),setRunning:v=>{running=v},get running(){return running}};
})();
