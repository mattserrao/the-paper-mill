// ---- autotest (v4.0.1): open the page with ?autotest to run a fixed, hands-free performance test on a real device ----
// Starts a season on a fixed seed with no tutorial, measures steady play, three diagnostic phases and an all-upsets
// stress phase, replays 3 sim days as a correctness checksum, then shows a results page with a "Copy results" button
// (JSON). Nothing is saved: no settings, scores or tutorial flags are written. Does nothing without ?autotest.
// URL options: scale=0.5 (shorter phases), speed=10 (sim min/s), seed=N, expect=<checksum>, fallback (keep the
// low-FPS fallback on; by default it's off so builds compare at the same graphics settings), quick (~30 s: normal play,
// all upsets with and without the HTML overlays, a short GPU probe and the checksum; skips the diagnostic phases).
(()=>{const Q=new URLSearchParams(location.search);if(!Q.has("autotest"))return;
  const SCALE=Math.max(0.05,+Q.get("scale")||1),SPEED=+Q.get("speed")||10,SEED=(+Q.get("seed")||20261009)>>>0,
    EXPECT=(Q.get("expect")||"").toLowerCase(),QUICK=Q.has("quick"),CHECK_DAYS=3,sec=s=>s*1000*SCALE,wait=ms=>new Promise(r=>setTimeout(r,ms));
  const R={schema:"pm-autotest/1",app:APP_VER,build:location.pathname,ts:new Date().toISOString(),ua:navigator.userAgent,
    screen:{w:screen.width,h:screen.height,dpr:devicePixelRatio},options:{scale:SCALE,speed:SPEED,seed:SEED,fallback:Q.has("fallback"),quick:QUICK},
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
    // v4.0.2: what each slow frame (over 25 ms) was spent on: code sections, GPU uploads and shader compiles that frame
    {const t0=performance.now(),I=D().renderer.info;let last=0,prev={},pg=programs(),geo=I.memory.geometries,tex=I.memory.textures,nJs=0;
      const tick=now=>{if(!PF.on||now>end)return;requestAnimationFrame(tick);const gap=last?now-last:0;last=now;
        const acc=PF.acc,d={};for(const k in acc){const v=acc[k]-(prev[k]||0);if(v>=0.5)d[k]=+v.toFixed(1);}prev={...acc};
        const pN=programs(),gN=I.memory.geometries,xN=I.memory.textures,js=PF.js.length>nJs?PF.js[PF.js.length-1]:0;nJs=PF.js.length;
        if(gap>25){const SF=R.slow_frames||(R.slow_frames=[]),mine=SF.filter(f=>f.phase===name),low=mine.length<6?null:mine.reduce((a,b)=>a.gap_ms<=b.gap_ms?a:b);
          if(low&&low.gap_ms>=gap){}else{if(low)SF.splice(SF.indexOf(low),1);SF.push({phase:name,t_s:+((now-t0)/1000).toFixed(2),gap_ms:Math.round(gap),js_ms:+js.toFixed(1),
          sections:Object.fromEntries(Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,4)),new_programs:pN-pg,new_geometries:gN-geo,new_textures:xN-tex,
          sim_min:Math.round(S.t),upsets:S.inc.length,moving_batches:G3.DB?G3.DB.bms.length:null,pending_batches:G3.DB?(G3.DB.pending||0)+(G3.DB.q?G3.DB.q.size:0):null});}}
        pg=pN;geo=gN;tex=xN;};requestAnimationFrame(tick);}
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
  /* ---- v4.0.3 GPU probe: what the upsets cost the GPU ----
     At 60 FPS the frame rate can't show GPU cost (the phone waits for the display either way). Here every 3D render
     is followed by a 1-pixel read-back, which makes the CPU wait until the GPU has finished that frame, so the time
     from the start of render() to the read-back is the frame's draw submission + GPU work. Measured with every upset
     active: the baseline, then one thing switched off at a time; "saves" = baseline minus that configuration. */
  async function gpuProbe(){const d=D(),Rr=d.renderer,gl=Rr.getContext(),px=new Uint8Array(4),orig=Rr.render;let buf=null;
    Rr.render=function(sc,cam){const t=performance.now();orig.call(this,sc,cam);if(buf){gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);buf.push(performance.now()-t);}};
    // at least 30 frames (or 3x the time), so slow phones still get a real sample; fewer than 8 frames reports null
    const meas=async(label,settleS,measS)=>{say("GPU probe · "+label);await wait(sec(settleS));buf=[];const t0=performance.now();
      while(performance.now()-t0<sec(measS)||(buf.length<30&&performance.now()-t0<sec(measS*3)))await wait(50);
      const a=buf.slice().sort((x,y)=>x-y);buf=null;
      if(a.length<8)return {ms:null,n:a.length};return {ms:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),med:+a[Math.floor(a.length/2)].toFixed(2),p90:+a[Math.floor(a.length*0.9)].toFixed(2),n:a.length};};
    const saves=m=>G.base.ms==null||m.ms==null?null:+(G.base.ms-m.ms).toFixed(2);
    const G={};R.gpu=G;const EXP=G3.EXP;
    try{
      // particles alive per batch (each batch is one texture, shared by the particle types listed)
      const names=new Map();for(const k in G3.PT){const m=G3.PT[k].map;names.set(m,(names.get(m)||[]).concat(k));}
      const pbs=[...G3.PB.entries()].map(([map,b])=>({b,name:(names.get(map)||["?"]).join("+")}));
      G.base=await meas("baseline",1,2);G.base.particles=Object.fromEntries(pbs.map(x=>[x.name,x.b.list.length]));
      EXP.noParts=true;G.no_particles=await meas("particles off",1.5,1.5);EXP.noParts=false;
      G.particle_types=[];if(!QUICK)for(const x of pbs){if(!x.b.list.length)continue;EXP.hidePB=x.b;const m=await meas("no "+x.name,0.6,1.2);EXP.hidePB=null;
        G.particle_types.push({type:x.name,alive:x.b.list.length,saves_ms:saves(m)});}
      {const pr=Rr.getPixelRatio();Rr.setPixelRatio(pr*0.5);d.resize();const m=await meas("half resolution",1,1.5);Rr.setPixelRatio(pr);d.resize();G.half_res=m;}
      // shadows: one refresh's cost = every frame minus never (normal play refreshes at 15 Hz, a quarter of frames)
      {const hz=G3.shadowHz;G3.shadowHz=1000;const a=await meas("shadows every frame",0.6,1.2);G3.shadowHz=0;const b=await meas("shadows never refreshed",0.6,1.2);G3.shadowHz=hz;
        G.shadow_refresh_ms=a.ms==null||b.ms==null?null:+(a.ms-b.ms).toFixed(2);G.shadows_at_15hz_ms=G.shadow_refresh_ms==null?null:+(G.shadow_refresh_ms*15/60).toFixed(2);}
      // each upset's own effect (its 3D objects and the particles it emits), hidden one at a time
      const ids=QUICK?[]:S.inc.map(i=>i.id).filter((v,i,a)=>a.indexOf(v)===i&&G3.FX[v]);G.effects=[];
      for(let i=0;i<ids.length;i++){const id=ids[i];EXP.hideFX=id;const m=await meas(`effect ${i+1}/${ids.length}: ${(EVENTS.find(e=>e.id===id)||{}).name||id}`,1.2,0.8);EXP.hideFX=null;
        G.effects.push({id,name:(EVENTS.find(e=>e.id===id)||{}).name||id,saves_ms:saves(m)});}
      G.effects.sort((a,b)=>(b.saves_ms??-1e9)-(a.saves_ms??-1e9));
      G.base_again=await meas("baseline again",1,2);   // drift check: random particles and phone state vary
      G.no_particles.saves_ms=saves(G.no_particles);G.half_res.saves_ms=saves(G.half_res);
      G.particle_types.sort((a,b)=>(b.saves_ms??-1e9)-(a.saves_ms??-1e9));
    }catch(e){G.error=String(e&&e.message||e);}
    finally{Rr.render=orig;EXP.noParts=false;EXP.hidePB=null;EXP.hideFX=null;}}
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
    if(QUICK){await phase("normal","Normal play",4,8,null,null,true);R.display_hz_est=null;}
    else{await phase("normal","Normal play",8,20,null,null,true);
    await phase("shadows_off","Shadows off",2.5,5,()=>setShadows(false),()=>setShadows(true));
    let pr=1;await phase("half_res","Half resolution",2,5,()=>{const d=D();pr=d.renderer.getPixelRatio();d.renderer.setPixelRatio(pr*0.5);d.resize();},()=>{const d=D();d.renderer.setPixelRatio(pr);d.resize();});
    await phase("no_render","3D render skipped",1.5,5,()=>{G3.EXP.noRender=true;},()=>{G3.EXP.noRender=false;});
    // the display's refresh rate: with nothing to draw, frames arrive at it (60, 90, 120 Hz)
    {const f=R.phases.no_render.p50;R.display_hz_est=f?[30,60,90,120,144].reduce((b,hz)=>Math.abs(1000/f-hz)<Math.abs(1000/f-b)?hz:b,60):null;}}
    await phase("stress","All upsets at once",QUICK?2:3,QUICK?10:15,()=>{CH.on=true;EVENTS.forEach(e=>{try{trigger(e.id,true);}catch(_){}});},null,true);
    // the browser's own per-frame work (style, layout, compositing of the HTML overlays) is in neither the JS nor the
    // GPU numbers: the same all-upsets scene with the labels, chips and banner hidden shows its share
    {let st=null;await phase("stress_no_html","All upsets, HTML labels hidden",QUICK?1:1.5,QUICK?4:6,()=>{st=document.createElement("style");st.textContent="#labels3d,#chips3d,.banner3d{display:none!important}";document.head.appendChild(st);},()=>{if(st)st.remove();});}
    if(Q.get("gpu")!=="0")await gpuProbe();
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
      ${R.gpu&&R.gpu.base?(()=>{const g=R.gpu,f=v=>v==null?"–":v.toFixed(1)+" ms",top=(g.effects||[]).filter(e=>e.saves_ms!=null).slice(0,5),pt=(g.particle_types||[]).slice(0,3);
        return `<div class="t"><div class="k">Upsets on the GPU (draw + GPU per frame, all upsets)</div><div class="verdict">${f(g.base.ms)} per frame${g.base_again&&g.base_again.ms!=null?` (again at the end: ${f(g.base_again.ms)})`:""}</div>
        <div class="s">Saves: particles off ${f(g.no_particles&&g.no_particles.saves_ms)} · half resolution ${f(g.half_res&&g.half_res.saves_ms)} · one shadow refresh costs ${f(g.shadow_refresh_ms)}</div>
        <div class="s">Particle types: ${pt.map(x=>`${x.type} ${f(x.saves_ms)} (${x.alive})`).join(" · ")||"–"}</div>
        <div class="s">Costliest effects: ${top.map(x=>`${x.name} ${f(x.saves_ms)}`).join(" · ")||"–"}</div>
        ${P.stress_no_html?`<div class="s">All upsets with HTML labels hidden: ${P.stress_no_html.fps} fps, p50 ${P.stress_no_html.p50} ms (with labels: ${s.fps} fps, p50 ${s.p50} ms)</div>`:""}</div>`;})():""}
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
