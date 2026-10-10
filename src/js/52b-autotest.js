// ---- autotest (v4.0.1): open the page with ?autotest to run a fixed, hands-free performance test on a real device ----
// Starts a season on a fixed seed with no tutorial, measures steady play, three diagnostic phases and an all-upsets
// stress phase, replays 3 sim days as a correctness checksum, then shows a results page with a "Copy results" button
// (JSON). Nothing is saved: no settings, scores or tutorial flags are written. Does nothing without ?autotest.
// URL options: scale=0.5 (shorter phases), speed=10 (sim min/s), seed=N, expect=<checksum>, fallback (keep the
// low-FPS fallback on; by default it's off so builds compare at the same graphics settings).
(()=>{const Q=new URLSearchParams(location.search);if(!Q.has("autotest"))return;
  const SCALE=Math.max(0.05,+Q.get("scale")||1),SPEED=+Q.get("speed")||10,SEED=(+Q.get("seed")||20261009)>>>0,
    EXPECT=(Q.get("expect")||"").toLowerCase(),CHECK_DAYS=3,sec=s=>s*1000*SCALE,wait=ms=>new Promise(r=>setTimeout(r,ms));
  const R={schema:"pm-autotest/1",app:APP_VER,build:location.pathname,ts:new Date().toISOString(),ua:navigator.userAgent,
    screen:{w:screen.width,h:screen.height,dpr:devicePixelRatio},options:{scale:SCALE,speed:SPEED,seed:SEED,fallback:Q.has("fallback")},
    phases:{},errors:[],pauses:0,hidden:0};
  const err=m=>{if(R.errors.length<20)R.errors.push(String(m).slice(0,200));};
  addEventListener("error",e=>err(e.message||e));addEventListener("unhandledrejection",e=>err("promise: "+(e.reason&&e.reason.message||e.reason)));
  {const ce=console.error;console.error=(...a)=>{err(a.map(x=>x&&x.message||x).join(" "));ce.apply(console,a);};}
  document.addEventListener("visibilitychange",()=>{if(document.hidden)R.hidden++;});
  // ---- the "test running" banner ----
  const ban=document.createElement("div");ban.id="atBan";
  ban.style.cssText="position:fixed;left:12px;right:12px;top:12px;z-index:600;background:#1c2233e6;color:#fff;border-radius:10px;padding:10px 14px;font:600 15px system-ui;text-align:center;pointer-events:none";
  let lastSay="";const say=t=>{ban.textContent="Autotest · "+t+" · please don't touch";const k=t.replace(/ · \d+ s$/,"");if(k!==lastSay){lastSay=k;diag("autotest: "+k);}};
  document.body.appendChild(ban);say("loading");
  const q=(a,p)=>a.length?a[Math.min(a.length-1,Math.floor(p*a.length))]:0,r1=v=>Math.round(v*10)/10;
  const D=()=>G3.diagScene(),programs=()=>{const I=D().renderer.info;return I.programs?I.programs.length:0;};
  // v4.0.1: shader programs compiled after the start-up precompile, with what needed them. The two flag words of
  // three.js r186's program key are decoded by name (bit order from WebGLPrograms.getProgramCacheKeyBooleans).
  const F1=["instancing","instancingColor","instancingMorph","matcap","envMap","normalMapOS","normalMapTS","clearcoat","iridescence","alphaTest",
    "vertexColors","vertexAlphas","uv1","uv2","uv3","tangents","anisotropy","alphaHash","batching","dispersion","batchingColor","gradientMap","packedNormalMap","vertexNormals","retroreflection"];
  const F2=["fog","useFog","flatShading","logDepth","reversedDepth","skinning","morphTargets","morphNormals","morphColors","premultipliedAlpha",
    "shadowMap","doubleSided","flipSided","depthPacking","dithering","transmission","sheen","opaque","pointsUvs","videoTex","videoTexEmissive","alphaToCoverage","lightProbeGrids","position"];
  let P0=null;const lateSeen=new Set();R.late_programs=[];
  function noteLate(phaseName){if(!P0)return;const d=D(),Rr=d.renderer;for(const p of Rr.info.programs){if(P0.has(p.id)||lateSeen.has(p.id))continue;lateSeen.add(p.id);
      if(/^Shadows off/.test(phaseName)){R.late_shadows_off=(R.late_shadows_off||0)+1;continue;}   // expected: the phase itself recompiles
      const k=String(p.cacheKey||"").split(","),w=k.filter(x=>/^\d+$/.test(x)&&+x>=8388608).map(Number),bits=(v,N)=>N.filter((n,i)=>v>>i&1);
      const who=[];d.scene.traverse(o=>{if(who.length>=4||!o.material)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{const mp=Rr.properties.get(m);
        if(mp&&mp.currentProgram===p&&who.length<4)who.push((o.name||o.type)+(o.isBatchedMesh?" [batch]":"")+(o.parent&&o.parent.name?" in "+o.parent.name:"")+" / "+(m.name||m.type)+(m.map?" +map":""));});});
      if(R.late_programs.length<12)R.late_programs.push({phase:phaseName,type:k[0],flags:w.length>=2?bits(w[0],F1).concat(bits(w[1],F2)).filter(n=>n!=="vertexNormals"&&n!=="position"&&n!=="opaque"):[],who});}}
  const setShadows=on=>{const d=D();d.renderer.shadowMap.enabled=on;d.renderer.shadowMap.needsUpdate=true;d.MATS.forEach(m=>m.needsUpdate=true);};
  // one measured phase: switch something on, settle, record every frame through the existing profiler (G3.PF), switch it off
  async function phase(key,name,settleS,measureS,on,off,keepGaps){const PF=G3.PF;if(on)on();say(name+" (settling)");await wait(sec(settleS));noteLate(name+" (settling)");
    const p0=programs();PF.acc={};PF.frames=0;PF.calls=0;PF.tris=0;PF.gaps=[];PF.js=[];PF.lastNow=0;PF.on=true;
    const end=performance.now()+sec(measureS);
    while(performance.now()<end){if(!running){R.pauses++;running=true;}say(`${name} · ${Math.max(1,Math.ceil((end-performance.now())/1000))} s`);await wait(250);}
    PF.on=false;const gaps=PF.gaps.slice(1),g=gaps.slice().sort((a,b)=>a-b),n=g.length,sum=g.reduce((a,b)=>a+b,0),js=PF.js.slice().sort((a,b)=>a-b);
    const d=D(),gl=d.renderer.getContext();
    const o={fps:n?r1(1000*n/sum):0,frames:n,p50:r1(q(g,0.5)),p95:r1(q(g,0.95)),p99:r1(q(g,0.99)),worst:r1(n?g[n-1]:0),
      over33:g.filter(v=>v>33.4).length,over50:g.filter(v=>v>50).length,
      js_mean:r1(js.length?js.reduce((a,b)=>a+b,0)/js.length:0),js_p95:r1(q(js,0.95)),
      draws:PF.frames?Math.round(PF.calls/PF.frames):0,tris_k:PF.frames?Math.round(PF.tris/PF.frames/1000):0,
      canvas:[gl.drawingBufferWidth,gl.drawingBufferHeight],pixel_ratio:d.renderer.getPixelRatio(),
      shadows:d.renderer.shadowMap.enabled?(G3.shadowHz||"every frame"):"off",programs:[p0,programs()],
      heap_mb:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null,
      sections:Object.fromEntries(Object.entries(PF.acc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,+(v/Math.max(1,PF.frames)).toFixed(2)]))};
    if(keepGaps)o.gaps=gaps.map(r1);
    noteLate(name);if(off)off();R.phases[key]=o;return o;}
  // FNV-1a over the key season numbers after a fixed replay: any change to the sim's logic changes it
  const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,"0");};
  function checksum(){running=false;startSeason();seedRun(SEED);running=false;const t0=performance.now();
    while(S.t<CHECK_DAYS*1440-1e-9)step(SIM_STEP);
    const ms=(performance.now()-t0)/CHECK_DAYS;running=false;
    const v={t:Math.round(S.t),cash:Math.round(S.cash),incidents:S.tot.incidents,breaks:S.tot.breaks,hayouts:S.tot.hayouts||0,
      tons:Math.round(S.tot.prodT||0),yard:Math.round(S.yard),fg:Math.round(S.fg)};
    const hash=fnv(JSON.stringify(v));
    return {sim_days:CHECK_DAYS,hash,ms_per_sim_day:r1(ms),values:v,expect:EXPECT||null,pass:EXPECT?hash===EXPECT:null};}
  // which limit the frame rate hits, from how the diagnostic phases moved it
  function verdict(){const P=R.phases,n=P.normal,h=P.half_res,c=P.no_render,hz=R.display_hz_est;if(!n||!n.fps)return "no data";
    if(hz&&n.fps>=hz*0.95)return `display-locked at ${hz} Hz: the phone has headroom`;
    if(h&&h.fps>=n.fps*1.15)return "GPU, pixels (fill rate): half resolution was clearly faster";
    if(n.js_mean>=0.8*1000/n.fps)return "CPU (JavaScript): JS uses most of each frame";
    if(c&&c.fps>=n.fps*1.15)return "GPU, scene (draws, shaders, shadows): skipping the render was clearly faster";
    return "unclear: no single switch moved the frame rate";}
  async function run(){
    // wait for the 3D view and the start-up precompile (the same wait the first Play does)
    const t=performance.now();
    while(!(G3.ok&&G3.prewarm&&G3.diagScene&&G3.play)){if(G3.ok===false){R.fatal="no 3D (WebGL unavailable)";return finish();}
      if(performance.now()-t>120000){R.fatal="the 3D view never became ready";return finish();}await wait(200);}
    say("getting the mill ready");await G3.prewarm();
    const nav=performance.getEntriesByType("navigation")[0];
    R.startup={dcl_ms:nav?Math.round(nav.domContentLoadedEventEnd):null,ready_ms:Math.round(performance.now()),programs:programs()};P0=new Set(D().renderer.info.programs.map(p=>p.id));
    try{const gl=D().renderer.getContext(),x=gl.getExtension("WEBGL_debug_renderer_info");R.gpu=String(x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));}catch(e){R.gpu="?";}
    try{if(navigator.getBattery){const b=await navigator.getBattery();R.battery={level:Math.round(b.level*100),charging:b.charging};}}catch(e){}
    let wl=null;try{if(navigator.wakeLock)wl=await navigator.wakeLock.request("screen");}catch(e){}
    // a season on a fixed seed, at the display's frame rate, with no tutorial, event cards or leaderboard; nothing saved
    FRAME_CAP=0;G3.cap=0;G3.noFallback=!Q.has("fallback");setSimSpeed(SPEED);
    startSeason();seedRun(SEED);S.cards.next=1e12;G3.play();
    await phase("normal","Normal play",8,20,null,null,true);
    await phase("shadows_off","Shadows off",2.5,5,()=>setShadows(false),()=>setShadows(true));
    let pr=1;await phase("half_res","Half resolution",2,5,()=>{const d=D();pr=d.renderer.getPixelRatio();d.renderer.setPixelRatio(pr*0.5);d.resize();},()=>{const d=D();d.renderer.setPixelRatio(pr);d.resize();});
    await phase("no_render","3D render skipped",1.5,5,()=>{G3.EXP.noRender=true;},()=>{G3.EXP.noRender=false;});
    // the display's refresh rate: with nothing to draw, frames arrive at it (60, 90, 120 Hz)
    {const f=R.phases.no_render.p50;R.display_hz_est=f?[30,60,90,120,144].reduce((b,hz)=>Math.abs(1000/f-hz)<Math.abs(1000/f-b)?hz:b,60):null;}
    await phase("stress","All upsets at once",3,15,()=>{CH.on=true;EVENTS.forEach(e=>{try{trigger(e.id,true);}catch(_){}});},null,true);
    say("checking the simulation");await wait(50);
    try{R.check=checksum();}catch(e){R.check={error:String(e&&e.message||e)};}
    if(wl)try{wl.release();}catch(e){}
    finish();}
  function finish(){running=false;G3.noFallback=false;ban.remove();R.verdict=verdict();R.total_s=Math.round(performance.now()/1000);
    window.__AUTOTEST=R;document.title="Autotest done · "+APP_VER;diag("autotest finished");showResults();}
  // ---- results page ----
  function showResults(){const P=R.phases,n=P.normal||{},s=P.stress||{},C=R.check||{},json=JSON.stringify(R);
    const el=document.createElement("div");el.id="atRes";
    const css=`#atRes{position:fixed;inset:0;z-index:700;overflow:auto;background:var(--bg,#eef0f6);color:var(--ink,#1c2233);font:15px/1.4 system-ui,sans-serif;padding:16px}
      #atRes .w{max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
      #atRes h1{font:800 24px system-ui;margin:0}#atRes .sub{color:var(--muted,#687087);font-size:13px;word-break:break-word}
      #atRes .g{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #atRes .t{background:var(--panel,#fff);border:1px solid var(--line,#e1e4ee);border-radius:12px;padding:12px 14px;min-width:0}
      #atRes .k{font:700 12px system-ui;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#687087)}
      #atRes .v{font:800 34px/1.1 system-ui;font-variant-numeric:tabular-nums;margin:2px 0;overflow-wrap:anywhere}#atRes .v.code{font:800 24px/1.4 ui-monospace,monospace}
      #atRes .s{font-size:13px;color:var(--muted,#687087);font-variant-numeric:tabular-nums}
      #atRes .ok{color:var(--ok,#1f9254)}#atRes .bad{color:var(--bad,#d6382c)}
      #atRes .verdict{font-weight:700}
      #atRes button{font:700 16px system-ui;padding:14px;border-radius:10px;border:1px solid var(--line,#e1e4ee);background:var(--panel,#fff);color:inherit}
      #atRes #atCopy{background:var(--ink,#1c2233);color:#fff;font-size:20px;padding:18px}
      #atRes .row{display:flex;gap:10px}#atRes .row button{flex:1}
      #atRes pre{background:var(--panel,#fff);border:1px solid var(--line,#e1e4ee);border-radius:10px;padding:10px;font:11px/1.35 ui-monospace,monospace;white-space:pre-wrap;word-break:break-all;max-height:30vh;overflow:auto;margin:0}`;
    const tile=(k,v,sub,cls)=>`<div class="t"><div class="k">${k}</div><div class="v ${cls||""}">${v}</div><div class="s">${sub}</div></div>`;
    const hz=R.display_hz_est,chk=C.error?["error","bad",C.error]:C.pass===true?["PASS","ok",`checksum ${C.hash} as expected`]:C.pass===false?["FAIL","bad",`got ${C.hash}, expected ${C.expect}`]:[C.hash||"-","",`${C.sim_days||CHECK_DAYS} sim days · ${C.ms_per_sim_day||"-"} ms per day`];
    const errs=R.errors.length+(R.fatal?1:0);
    el.innerHTML=`<style>${css}</style><div class="w">
      <div><h1>Autotest results</h1><div class="sub">${APP_VER} · ${R.build} · ${new Date().toLocaleString()}<br>${R.gpu||""} · ${R.screen.w}x${R.screen.h} @${R.screen.dpr} · display ~${hz||"?"} Hz${R.battery?` · battery ${R.battery.level}%${R.battery.charging?" charging":""}`:""}</div></div>
      ${R.fatal?`<div class="t bad"><b>Test could not run:</b> ${R.fatal}</div>`:""}
      <button id="atCopy">Copy results</button>
      <div class="g">
        ${tile("Normal play FPS",n.fps??"-",`p50 ${n.p50??"-"} · p95 ${n.p95??"-"} · p99 ${n.p99??"-"} ms`,hz&&n.fps>=hz*0.95?"ok":"")}
        ${tile("Slow frames",`${n.over33??"-"}`,`over 33 ms (over 50: ${n.over50??"-"}) · worst ${n.worst??"-"} ms`,n.over50?"bad":"")}
        ${tile("All upsets FPS",s.fps??"-",`p95 ${s.p95??"-"} ms · over 50 ms: ${s.over50??"-"}`)}
        ${tile("JS per frame",`${n.js_mean??"-"} ms`,`p95 ${n.js_p95??"-"} ms · upsets ${s.js_mean??"-"} ms`)}
        ${tile("Draws per frame",n.draws??"-",`${n.tris_k??"-"}k triangles · ${n.canvas?n.canvas.join("x"):"-"} px`)}
        ${tile("Sim checksum",chk[0],chk[2],"code "+chk[1])}
      </div>
      <div class="t"><div class="k">Limited by</div><div class="verdict">${R.verdict}</div>
        <div class="s">Shadows off ${P.shadows_off?P.shadows_off.fps:"-"} fps · half resolution ${P.half_res?P.half_res.fps:"-"} fps · render skipped ${P.no_render?P.no_render.fps:"-"} fps</div></div>
      <div class="t"><div class="k">Problems</div><div class="${errs?"bad":"ok"}">${errs?errs+" error"+(errs>1?"s":""):"No errors"}${R.pauses?` · game paused ${R.pauses}x`:""}${R.hidden?` · page hidden ${R.hidden}x`:""}${R.late_programs.length?` · ${R.late_programs.length} shader${R.late_programs.length>1?"s":""} compiled during the test`:""}</div>
        ${R.errors.length?`<div class="s">${R.errors.slice(0,3).map(e=>e.replace(/[&<>]/g,"")).join("<br>")}</div>`:""}</div>
      <div class="row"><button id="atAgain">Run again</button><button id="atExit">Exit test</button></div>
      <pre id="atJson"></pre></div>`;
    document.body.appendChild(el);el.querySelector("#atJson").textContent=json;
    const copy=el.querySelector("#atCopy");
    copy.onclick=()=>{const done=()=>{copy.textContent="Copied ✓";},fallback=()=>{const ta=document.createElement("textarea");ta.value=json;ta.style.cssText="position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand("copy");}catch(e){}ta.remove();if(ok)done();else copy.textContent="Copy failed: select the text below";};
      if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(json).then(done,fallback);else fallback();};
    el.querySelector("#atAgain").onclick=()=>location.reload();
    el.querySelector("#atExit").onclick=()=>{const u=new URL(location.href);u.search="";location.href=u.toString();};}
  run().catch(e=>{R.fatal="test crashed: "+(e&&e.message||e);finish();});
})();
