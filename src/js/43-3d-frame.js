  // v2.9.11 performance profiler: when G3.PF.on, time each section of the 3D frame (ms accumulated per section)
  const PF=G3.PF={on:false,t:0,acc:{},frames:0};const pm=k=>{if(!PF.on)return;const t=performance.now();PF.acc[k]=(PF.acc[k]||0)+(t-PF.t);PF.t=t;};
  G3.EXP={};let moversCache=null;
  // v4.2.5: scratch objects the frame reuses instead of allocating every frame (fewer garbage-collection hitches on phones).
  // placeTruck only reads its role, so one role object serves every truck.
  const WDX=[-0.35,0,0.35];   // (v5.2: bale wire offsets, hoisted)
  const _tr={kind:"in",k:0,docked:false,d:0,leaving:false},TR=(kind,k,docked,d,leaving)=>{_tr.kind=kind;_tr.k=k;_tr.docked=docked;_tr.d=d;_tr.leaving=leaving;return _tr;};
  const q4=new THREE.Quaternion();
  G3.frameBody=function(rdt){if(PF.on){PF.t=performance.now();PF.frames++;}navPump();pm("walker route planning (2 ms/frame max)");
    {const t=performance.now();if(!(t-(G3.ehT||0)<5000)){G3.ehT=t;if(G3.emptyHide)scene.traverse(o=>{if(o.isInstancedMesh)G3.emptyHide(o);});}}   // (v5.5 perf: see G3.emptyHide)
    // v2.8.8: the machine's motion clocks (dryer cans, presses, felts, sheet, pulper swirl, belts) used to be advanced only by the
    // old 2D drawing, which no longer runs when the 3D view is up, so everything stood still
    if(rdt>0){const R=S.rates;if(!S.M.pulperDown)V.swirl+=rdt*(0.4+R.feed*0.06);V.belt=(V.belt+rdt*R.feed*1.4)%30;V.cans+=rdt*S.pmSpeed/700;
      if(S.pm==="run")V.sheet=(V.sheet+rdt*S.pmSpeed/40)%24;V.rollsAnim+=rdt*(0.2+clamp(R.load/Math.max(1,C.loaders.v*P.loaderRate),0,1))*0.5;}
    if(renderer.shadowMap.enabled){const t=performance.now();if(!(t-(G3.shTrim||0)<2000)){G3.shTrim=t;trimShadows();}}pm("shadow trim (every 2 s)");
    // v15: the fallback measures real frame intervals (rdt is clamped to 0.1 s, so a 5 FPS stall used to count as 10 FPS)
    // against the frame budget in use (the cap, or 60), and steps down only after two slow 3-second windows in a row
    {const t=performance.now(),dt=G3.fbLast?t-G3.fbLast:0;G3.fbLast=t;
    if(rdt>0&&!G3.noFallback&&dt>0&&dt<2000){fpsT+=dt/1000;fpsN++;if(fpsT>3){const fps=fpsN/fpsT;fpsT=0;fpsN=0;
      // (G3.noFallback: set by the autotest so every build is measured at the same graphics settings)
      // v4 fallback order, cheapest to undo first: render fewer pixels, then refresh shadows less often. Shadows stay on
      // (switching them off recompiles every shader: a long freeze, the opposite of what a struggling device needs)
      const tgt=G3.cap||60,slow=fps<0.8*tgt;G3.fbSlow=slow?(G3.fbSlow||0)+1:0;
      if(G3.fbSlow>=2){G3.fbSlow=0;
      if(quality===2&&renderer.getPixelRatio()>1){quality=1;G3.prFixed=1;renderer.setPixelRatio(1);resize();diag("quality: pixel ratio 1 ("+fps.toFixed(0)+" fps)");}
      else if(fps<0.72*tgt&&quality>=1&&G3.shadowHz>5){quality=0;G3.shadowHz=5;diag("quality: shadows 5 Hz ("+fps.toFixed(0)+" fps)");}
      // v4.1: still struggling: the far scenery sectors go (the yard and the land round the fence stay)
      else if(fps<0.62*tgt&&quality===0&&G3.scenery&&!G3.scenery.farOff){G3.scenery.farOff=true;G3.scenery.parts.forEach(p=>{if(p.userData.scenery!=="near")p.visible=false;});diag("quality: far scenery hidden ("+fps.toFixed(0)+" fps)");}}}}}pm("low-FPS fallback check");
    {const t=performance.now();if(!(t-(G3.palT||0)<500)){G3.palT=t;applyPalette();}}pm("palette (every 0.5 s)");rebuildDoors();
    const R=S.rates,now=performance.now();pm("setup (palette, doors, shadow trim)");
    // v4.2.3: people and the activity scenes are fenced off, so an error in one no longer skips the rest of every frame
    try{crewUpdate(rdt,now);}catch(e){G3.fErr=(G3.fErr||0)+1;if(G3.fErr<6)console.error("people update",e);}pm("crew + people");try{if(G3.actTick)G3.actTick(rdt);}catch(e){G3.fErr=(G3.fErr||0)+1;if(G3.fErr<6)console.error("activity scenes",e);}pm("activity scenes");
    // trucks
    truckMap.forEach(g=>g.userData.seen=false);
    S.inQ.forEach((t,k)=>placeTruck(t,TR("in",k,false,0,false),rdt));S.inDock.forEach((t,d)=>t&&placeTruck(t,TR("in",0,true,d,false),rdt));
    S.outQ.forEach((t,k)=>placeTruck(t,TR("out",k,false,0,false),rdt));S.outDock.forEach((t,d)=>t&&placeTruck(t,TR("out",0,true,d,false),rdt));
    S.leaving.forEach(t=>placeTruck(t,TR(t.kind,0,false,0,true),rdt));
    // v5.2: a leaving truck that has driven off the map is dropped from the list (the sim never reads it); the ghost pass
    // below then hides it and hands it back to the pool. Before, finished trucks stayed listed and parked off-map, drawn
    // every frame: ~60 extra trucks and over 1,000 extra draws after ten sim days.
    for(let i=S.leaving.length-1;i>=0;i--){const g=truckMap.get(S.leaving[i].id);if(g&&g.userData.done)S.leaving.splice(i,1);}
    // trucks the sim has finished with drive themselves off; capped at 6 and 90 s each so they can never pile up
    let ghosts=0;
    truckMap.forEach((g,t)=>{const u=g.userData;if(u.seen){u.ghost=0;return;}u.ghost=(u.ghost||0)+rdt;
      if(u.phase==="leave"&&!u.done&&u.route.length&&u.ghost<90&&ghosts<6){ghosts++;
        {const L=LANE[u.kind],w=u.route[0];if(w.lock&&L.lock&&L.lock!==g&&L.lock.visible&&(L.lock.userData.route||[]).length)u.route=[{x:g.position.x-2,z:L.outZ},{x:-150,z:L.outZ,end:true,fast:true}];}stepRoute(g,LANE[u.kind],rdt);u.wheels.forEach(w=>w.rotation.z=-(u.spin||0));return;}
      const L=LANE[u.kind];if(L&&L.lock===g)L.lock=null;
      g.visible=false;u.busy=false;u.ghost=0;truckMap.delete(t);});
    pm("trucks");chemUpdate(rdt);beaterUpdate(rdt);pm("tanker + beater trucks");
    {const n=clamp(9+S.inQ.length*3+Math.floor(S.yard/250),5,24);G3.yardTr.forEach((g,i)=>g.visible=i<n);}
    // stock
    {const nB=Math.min(168,Math.ceil(S.yard/12));if(nB!==baleShown){baleShown=nB;bales.reset();for(let i=0;i<nB;i++)bales.put(gradeOf(i*7+1,false),baleM[i]);bales.done();}}
    // conveyor bales
    // bales ride the walking floor, lose their wires under the guillotine, then climb to the pulper
    const run=R.feed>0.3,GAP=2.6;if(run){const o=wfOff;wfOff=(wfOff+rdt*Math.min(2.2,0.35+R.feed*0.03))%GAP;if(wfOff<o)baleCyc++;}if(run&&G3.slats)G3.slats.offset.x=(G3.__sl=((G3.__sl||0)-rdt*Math.min(2.2,0.35+R.feed*0.03)/1.2)%1);
    const LEND=PLEN[PLEN.length-1];let nb=0,nw=0,nc=0,under=false;beltBales.reset();baleChunks.reset();const junk=S.inc.some(i=>i.id==="badocc");
    if(run||S.yard>0){let k=0;for(let d=wfOff;d<LEND+1.7&&nb<24;d+=GAP,k++){const id=baleCyc-k,cut=d-PLEN[1];if(!run&&cut>0)continue;
        const gr=gradeOf(id,junk);
        if(cut<0.35){if(!pathAt(d,v3))break;m4.makeTranslation(v3.x,v3.y,v3.z);beltBales.put(gr,m4);nb++;if(Math.abs(v3.x-CUTX)<0.55&&d<PLEN[2])under=true;
          if(d<PLEN[1]-0.3)for(const dx of WDX){m4.makeTranslation(v3.x+dx,v3.y,v3.z);baleWires.setMatrixAt(nw++,m4);}continue;}
        const f=Math.pow(clamp((cut-0.35)/(LEND-PLEN[1]),0,1),0.65);
        for(let j=0;j<6&&nc<150;j++){const h1=hsh(id*7+j),h2=hsh(id*13+j*3),h3=hsh(id*29+j*5),lay=Math.floor(j/2);
          const along=(j%2?0.29:-0.29)*(1+2.4*f)+(h1-0.5)*1.6*f+lay*0.25*f,across=clamp((h2-0.5)*1.0*f,-0.3,0.3),dd=d+along;
          const yaw=(h3-0.5)*1.4*f,hl=0.14+lay*0.28+((0.14+0.05*lay)-(0.14+lay*0.28))*Math.min(1,f*1.7);
          if(dd<LEND){pathAt(dd,v3);qB.setFromAxisAngle(_yAx,yaw);if(dd>PLEN[2])qB.premultiply(beltQ);v3.y+=-0.425+hl;v3.z+=across;}
          else{const e=dd-LEND,key=id*8+j;v3.set(cB.x+cH.x*e*0.95,cB.y+0.15+hl+0.05-1.7*e*e,cB.z+cH.z*e*0.95+across);
            if(v3.y<3.0){if(run&&!splashed.has(key)){splashed.add(key);if(splashed.size>60)splashed.delete(splashed.values().next().value);splashAt(v3.x,v3.z,gr);}continue;}
            qB.setFromEuler(_eu.set(0,yaw,-e*2.6-(h1-0.5)));qB.premultiply(beltQ);}
          m4.compose(v3,qB,_sc.set(0.85+0.3*h3,1,0.8+0.3*h2));baleChunks.put(gr,m4);nc++;}}}
    splashTick(rdt);
    beltBales.done();baleWires.count=nw;G3.chg(baleWires.instanceMatrix,nw);baleChunks.done();
    if(under&&run&&chop<=0)chop=1;if(chop>0){chop=Math.max(0,chop-rdt*2.2);if(chop>0.55&&chop-rdt*2.2<=0.55)for(let k=0;k<8;k++)emit("spark",CUTX,1.2,WFZ+(Math.random()-0.5)*1.6,(Math.random()-0.5)*3,2+Math.random()*2,(Math.random()-0.5)*3,0.5,0.2,"#e8ecf2",1);}
    const by=chop>0?1.55+2.2*(Math.abs(chop-0.55)/0.55):3.75;blade.position.y=by;rod.position.y=(by+4.3)/2;rod.scale.y=Math.max(0.1,4.3-by);
    rotor.rotation.y=-V.swirl;pulpStock.visible=R.feed>0.3||S.tank>0;G3.ragFrame(rdt,now,R.feed>0.3);
    {const st=G3.SPD?G3.SPD.strain||0:0,k=clamp((st-0.2)/0.8,0,1);   // labouring disks: shudder, surging speed, brown spray and knocking
      disks.position.set(26+(Math.random()-0.5)*0.12*k,TY+(Math.random()-0.5)*0.1*k,TZ+(Math.random()-0.5)*0.12*k);
      if(k>0&&rdt>0){disks.rotation.x+=rdt*0.6*k*Math.sin(now/180);if(Math.random()<rdt*14*k)emitA("drop",31.5+Math.random()*6,PH+TY+1.6,-15+(Math.random()<0.5?0.7:-0.7),(Math.random()-0.5)*2,1.5+Math.random()*2,(Math.random()-0.5)*3,0.9,0.3,"#7a5636",0.95);
        if(Math.random()<rdt*0.5*k)AUDIO.sfx("clunk",2500);}}
    if(!S.M.pulperDown){disks.rotation.x-=rdt*0.35;if(Math.random()<rdt*5)emitA("steam",31.5+Math.random()*6,PH+TY+1.9,-15+(Math.random()<0.5?0.55:-0.55),0,-0.6,0,0.9,0.7,"#ffffff",0.45);}
    // chest
    const cr=4.2*Math.sqrt(P.tankCap/300);if(cr!==chestR){chestR=cr;shell.scale.set(cr,1,cr);shellIn.scale.set(cr,1,cr);shellRim.scale.set(cr,cr,1);baseRing.scale.set(cr,1,cr);bands.forEach(b=>b.scale.set(cr,1,cr));liquid.scale.set(cr,cr,1);
      tileOut.repeat.set(Math.round(14*cr/4.2),5);tileIn.repeat.set(Math.round(14*cr/4.2),5);
      bridge.children.forEach(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose();});bridge.clear();box(cr*2+0.6,0.45,0.9,M.steel,0,10.25,0,bridge);box(1.3,1.1,1.3,M.brand,0,11.0,0,bridge);const sh=new THREE.Mesh(new CylG(0.12,0.12,8,8),M.metal);sh.position.y=6.4;bridge.add(sh);
      gauge.position.set(-cr*0.38,0,cr*0.93);gauge.rotation.y=-0.39;}
    const lvl=S.tank/P.tankCap,h=Math.max(0.06,lvl*9.8);liquid.position.y=h;liquid.rotation.z=-V.swirl*0.3;fill.scale.y=h;fill.position.y=0.25+h/2;
    liquid.material=lvl*100<C.lowLevel.v?surfLow:surfMat;fill.material=lvl*100<C.lowLevel.v?M.bad:M.liquid;ringT.position.y=0.2+C.lvlTarget.v/100*9.8;ringL.position.y=0.2+C.lowLevel.v/100*9.8;
    pm("stock prep (bales, pulper, chest)");
    // machine
    const pmRun=S.pm==="run";
    for(let i=0;i<cansTop.length;i++)cansTop[i].rotation.z=V.cans;for(let i=0;i<cansBot.length;i++)cansBot[i].rotation.z=-V.cans;canInst();
    press[0].rotation.z=-V.cans*1.3;press[1].rotation.z=V.cans*1.3;press[2].rotation.z=-V.cans*1.15;press[3].rotation.z=V.cans*1.15;feltTex.offset.x=-(V.cans*0.35)%1;wireTex.offset.x=(V.cans*0.35)%1;feltGuides.forEach(g=>g.rotation.z=-V.cans*4);wireRolls.forEach(w=>w.rotation.z=V.cans*2.5);
    press.forEach((p,i)=>{p.material=LV("shoe")&&i===3?shoeMat:M.metal;});
    const rr=R0+(RM-R0)*Math.sqrt(clamp(S.reel/P.jumbo,0,1));reelUpdate(rdt,rr);
    if(Math.abs(nipPhi-sheetR)>0.02){sheetR=nipPhi;buildSheet(rr);}
    {let show=pmRun&&!CLOTH.fabric.ep&&!CLOTH.felt.ep,segs=27;
      if(S.tot.breaks!==brkSeen){brkSeen=S.tot.breaks;brkT0=now;}
      if(S.pm==="break"){show=true;const bp={press:2,dryer:5,reel:25}[S.brkType]||5,prog=working("brk")?1-S.breakLeft/Math.max(0.1,S.breakTotal):0,th=clamp((prog-0.55)/0.4,0,1);
        segs=Math.round(bp+(27-bp)*th);const b=BRKPT[S.brkType]||BRKPT.dryer,gr=Math.min(1,(now-brkT0)/1800)*(1-clamp((prog-0.4)/0.5,0,1));
        brokePile.visible=gr>0.03;brokePile.position.set(b[0],0,zc);brokePile.scale.set(1.6*b[1]*gr,0.9*b[1]*gr,2.6*gr);}
      else brokePile.visible=false;
      if(S.inc.some(x=>x.id==="steamjoint")){show=true;segs=2;}
      const wi=S.inc.find(x=>x.id==="wrap");wrapMesh.visible=false;
      if(wi){const k=wi.can||5,prog=wi.go?1-wi.left/wi.total:0,cut=clamp(prog/0.7,0,1),th=clamp((prog-0.72)/0.26,0,1);show=true;segs=Math.round(6+2*k+(20-2*k)*th);
        if(cut<1){wrapMesh.visible=true;const r=1.85-0.5*cut;wrapMesh.position.set(canX(k),5.4,zc);wrapMesh.scale.set(r,r,CD-0.3);wrapMesh.rotation.z=Math.sin(now/90)*0.02*(wi.go?1:0);}}
      // dye trouble: the sheet and the growing reel flash through colors
      const dyeOn=S.M.offSpec;if(dyeOn){const k=Math.floor(now/1400)%DYE.length;if(k!==dyeK){dyeK=k;dyeSheet.color.copy(lin0(DYE[k]));dyeReel.color.copy(lin0(DYE[(k+2)%DYE.length]));}}
      sheetMesh.material=dyeOn?dyeSheet:sheetMat;{/* v6.1 t9: the reel's paper was split by material on the first frame (40c), so it takes one material, not the array */
        const one=!reel.geometry.groups.length,rm=dyeOn?dyeReel:(one?ROLLM[0]:ROLLM);if(reel.material!==rm){reel.material=rm;if(one)for(const c of reel.children)if(c.isMesh)c.material=dyeOn?dyeReel:ROLLM[1];}}
      sheetMesh.visible=show;sheetMesh.geometry.setDrawRange(0,(sheetKey[Math.min(segs,sheetKey.length-1)]||0)*6);G3.sliceFrame(now,show&&segs>=2);}sheetTex.offset.x=-V.sheet/24*1.0;
    pm("paper machine, reel, crane, winder");
    // roll conveyor
    // each finished roll is kicked off the winder, rolls down the ramp, is upended and rides the conveyor to the warehouse;
    // it queues at the end until a clamp truck takes it (the sim's conveyor count)
    const RV=G3.rollVis||(G3.rollVis={list:[],seen:-1});if(RV.seen<0)RV.seen=S.tot.rolls;
    // v2.9.7: d -3.2..-1 rolling down the kick-off ramp (single file), -1..0 tipping up on the upender, >=0 standing on the conveyor.
    // Everything speeds up with the game speed, and if rolls pile up waiting to leave the winder the extra plain ones are skipped.
    const fac=clamp(simRate()/20,1,4);
    if(S.tot.rolls>RV.seen){const n=Math.min(4,S.tot.rolls-RV.seen);RV.seen=S.tot.rolls;for(let k=0;k<n;k++)RV.list.push({d:-3.2-k*1.5,spin:0});
      while(RV.list.filter(r=>r.d<-1&&!r.col).length>2){const k=RV.list.findIndex(r=>r.d<-1&&!r.col);RV.list.splice(k,1);}
      while(RV.list.length>24){const k=RV.list.findIndex(r=>!r.col);if(k<0)break;RV.list.splice(k,1);}}
    {const L1=19.4-zc-UPC,CL=L1+(29.9-22.9),qn=Math.max(0,Math.ceil(S.conv||0)),sp=3*fac;RV.list.sort((a,b)=>b.d-a.d);
      RV.list.forEach((r,k)=>{const lim=k===0?CL:Math.min(CL,RV.list[k-1].d-1.45);const v=r.d<-1?2.6*fac:r.d<0?1.7*fac:sp;
        const nd=Math.max(r.d,Math.min(lim,r.d+rdt*v));if(r.d<-1&&nd>r.d)r.spin+=(nd-r.d)*2.4;r.d=nd;});
      // the clamp tender lifts rolls off the end; if the visual queue runs ahead of the sim, drop plain rolls (never the beater ones)
      while(RV.list.length&&RV.list[0].d>=CL-0.01&&!RV.list[0].col&&RV.list.filter(r=>r.d>=CL-1.45*(qn+3)-0.2).length>qn+3)RV.list.shift();
      if(RV.list.length&&RV.list[0].col&&RV.list[0].d>=CL-0.01&&Math.floor(S.effHum+1e-9)<1){BEAT.bay.push(RV.list.shift().col);}
      RV.CL=CL;}
    let nr=0;
    let upA=0;
    RV.list.forEach(r=>{if(nr>=16)return;let x,y,z;
      if(r.d<-1){const f=clamp((r.d+3.2)/2.2,0,1);x=-20.55+(UPX+20.55)*f;y=1.726+(UPY+0.62-1.726)*f*f;z=zc;q4.setFromEuler(_eu.set(Math.PI/2,0,-r.spin));}
      else if(r.d<0){const a=(r.d+1)*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);upA=Math.max(upA,a);   // tip 90 deg about the plate's hinge
        x=UPX;y=UPY+0.62*c+0.7*sn;z=UPZ-0.7*c+0.62*sn;q4.setFromEuler(_eu.set(Math.PI/2+a,0,0));}
      else{const d=r.d,L1=19.4-zc-UPC;if(d<L1){x=UPX;z=zc+UPC+d;}else{x=UPX-(d-L1);z=19.4;}y=1.2;q4.identity();}
      if(r.wp){r.wp[0]=x;r.wp[1]=y;r.wp[2]=z;}else r.wp=[x,y,z];m4.compose(v3.set(x,y,z),q4,_one);if(r.col)_rc.set(r.col);else _rc.copy(M.paper.color);beltRolls.setColorAt(nr,_rc);beltRolls.setMatrixAt(nr++,m4);});
    upender.rotation.x=upA>0?upA:upender.rotation.x*Math.max(0,1-rdt*6);
    beltRolls.count=nr;G3.chg(beltRolls.instanceMatrix,nr);G3.chg(beltRolls.instanceColor,nr);
    pm("roll conveyor");
    // forklifts (same paths as the 2D view). v2.9.14: their clock used to advance only in the retired 2D view, so in 3D
    // there were none at all; it now runs here. They also stay visible (stopped) when receiving is halted, and idle ones park in the bays.
    {const nL=Math.round(C.drivers.v);while(V.lifts.length<nL)V.lifts.push({p:Math.random()*4,door:V.lifts.length%3});V.lifts.length=nL;
      const busy=clamp((R.feed+R.unload)/Math.max(1,C.drivers.v*P.driverRate),0,1);if(rdt>0&&S.M.recvMul!==0)V.lifts.forEach(L=>{L.p=(L.p+rdt*(0.125+busy*0.45))%4;});}
    ensure(lifts,V.lifts.length,()=>forklift(M.warn));G3.liftObjs=lifts;
    V.lifts.forEach((L,i)=>{const g=lifts[i];
      g.visible=true;
      if(i>=Math.floor(S.effDrv+1e-9)){const k=Math.max(0,i-Math.floor(S.effDrv+1e-9))%4;g.position.set(-14.2-k*2.6,0,-21.7);g.rotation.y=Math.PI/2;g.children[0].material=M.off;g.userData.load.visible=false;return;}
      g.children[0].material=M.fork;if(G3.yardFrozen){g.userData.load.visible=false;return;}
      const dz=W(0,inY(L.door%P.doors))[1],dz2=clamp(dz,-21.5,-5.2),stk=(k,m)=>{const ai=(i*k+m)%3;return [ai===1?-29.4+((i*m*7)%8):-29.4+((i*k*5+m*3)%17),FKA[ai]];};
      const pts=[[-33.2,dz2],stk(2,1),stk(3,2),[-20.3,-11.5]];
      const a=Math.floor(L.p),t=L.p-a,A=pts[a],B=pts[(a+1)%4];
      // legs run door wall lane -> aisle; the dock leg first steps out of the door along the lane
      const [x,z,ry]=fkAt(fkLeg(A,B),t);
      g.position.set(x,0,z);g.rotation.y=ry;g.userData.load.visible=(a===0||a===2);});
    // clamp trucks + robots
    const nLo=Math.round(C.loaders.v);ensure(loaders,nLo,()=>clamp3(M.ok));G3.loaderObjs=loaders;
    for(let i=0;i<nLo;i++){const g=loaders[i];
      if(!g.userData.homed){g.userData.homed=true;g.position.set(-28-i*2.2,0,17);g.rotation.y=Math.PI;}
      g.visible=true;
      if(i>=Math.floor(S.effHum+1e-9)){const k=Math.max(0,i-Math.floor(S.effHum+1e-9))%4;g.position.set(-45.2+k*2,0,15.7);g.rotation.y=Math.PI/2;g.userData.cj=null;g.children[0].material=M.off;g.userData.load.visible=false;continue;}
      g.children[0].material=M.fork;if(G3.yardFrozen){g.userData.load.visible=false;continue;}
      if(S.M.clampMul!==0)clampJob(g,i,rdt);}
    ensure(robots,P.robots,robot);
    robots.forEach((g,r)=>{if(r>=P.robots)return;const ph=S.M.clampMul===0?0.3:(V.rollsAnim*0.45+r*0.29)%2,t=ph<1?ph:2-ph,[x,z]=W(130+t*200,outY(r%P.shipDoors)+(r%2?6:-6));
      g.position.set(x,0,z);{const l=g.userData.light,m=l.userData.bm||(l.userData.bm=l.material=M.stock.clone());m.color.copy((((now/400+r)|0)%2?M.ok:M.stock).color);}});   // (v5.2: blink by colour, see 39)
    pm("forklifts, clamp trucks, robots");
    // blackout dims the plant
    const out=S.inc.some(i=>i.id==="lightning"||(i.id==="birdline"&&!G3.cineHold));if(out){hemi.intensity=0.18*LEG;sun.intensity=0.12*LEG;}
    if(out!==G3.wasOut){G3.wasOut=out;if(out)scene.background=new THREE.Color("#0b0f0e").convertSRGBToLinear();}
    // camera + render
    // zen: a 30 s "shot" at a time. Each shot cuts to a new viewpoint (or locks onto an operator for a stretch of it)
    // and picks a look: half the shots are the plain camera, the rest one of the approved grades
    if(G3.zen){const Z=G3.zenS||(G3.zenS={i:0,t:99,tg:new THREE.Vector3(),r:300,th:-0.2,who:null,fo:0});Z.t+=rdt;Z.age=(Z.age||0)+rdt;
      // v17: a rare sight (cowboys, Bigfoot, the tug, the gator) takes over the camera: cut to it and follow it, slowly
      // circling, until it is over
      {const f=G3.sightFocus&&G3.sightFocus();if(f&&!(Z.mv&&Z.mv.m.sight)){Z.who=null;Z.goto=null;Z.t=0;Z.len=999;document.body.dataset.zs=Math.random()<0.5?"none":"gold";
        Z.mv={t:0,st:{th:-0.4+(Math.random()-0.5)*1.2},m:{name:"rare sight",sight:1,at:(t,mv,rdt2)=>{const q=G3.sightFocus&&G3.sightFocus();if(!q)return null;if(q[4]!=null)return [q[0],q[1],q[2],q[3],q[4]+Math.sin(t*0.12)*0.1,q[5]];mv.st.th+=rdt2*0.05;return [q[0],q[1],q[2],q[3],mv.st.th,1.02];}}};}}
      const POI=[[-14,5,300,-0.2],[20,9,120,-0.5],[24,-10,95,0.4],[-20,14,80,-1.2],[-25,-18,110,0.9],[20,-40,120,2.6],[70,-10,110,-2.2],[-60,10,130,0.1],[10,9,170,2.9],[40,10,70,0.6],[-36,24,90,-0.8]];
      // v3.3: each shot sets its own length (Z.len); free shots run 6-10 s, scripted shots run their own course
      if(Z.t>(Z.len||10)){Z.t=0;Z.len=6+Math.random()*4;Z.mv=null;const ops=G3.followable?G3.followable().filter(w=>w.visible):[];
        const MV=zenMoves();
        // v17: once every everyday scripted shot of this map has played (or 15 minutes have passed and most have), zen moves
        // on to the next map: the page reloads on it and goes straight back into zen (?zen=1). ?zenstay keeps one map.
        {const need=MV.filter(m=>!m.rare).map(m=>m.name),D=Z.done||(Z.done=new Set());
          if(G3.zenNextMap&&!/[?&]zenstay/.test(location.search)&&(need.every(n=>D.has(n))||(Z.age>900&&D.size>=need.length*0.75))){G3.zenNextMap();Z.t=-1e9;}}
        if(!Z.goto&&Math.random()<0.55){const H=Z.hist||(Z.hist=[]);let ok=MV.filter(m=>{try{return m.ok();}catch(e){return false;}});
          // v3.2.0 variety: skip shots played recently; if every ready shot is recent, take the one played longest ago
          const fresh=ok.filter(m=>!H.includes(m.name));if(fresh.length)ok=fresh;else if(ok.length)ok=[ok.reduce((a,b)=>H.indexOf(a.name)<=H.indexOf(b.name)?a:b)];
          if(ok.length){let tw=0;ok.forEach(m=>tw+=m.rare?2.5:1);let r=Math.random()*tw,m=ok[0];for(const c of ok){r-=c.rare?2.5:1;if(r<=0){m=c;break;}}
            Z.mv={m,t:0,st:m.start?m.start():null};Z.who=null;Z.len=m.dur+1;H.push(m.name);Z.done&&Z.done.add(m.name);while(H.length>Math.min(8,MV.length-4))H.shift();G3.zenLast=m.name;
            // v3.2.0: each shot has its own paired looks
            const lk=m.look||["none"],cur2=document.body.dataset.zs,pl2=lk.length>1?lk.filter(l=>l!==cur2):lk;document.body.dataset.zs=pl2[Math.floor(Math.random()*pl2.length)];}}
        if(Z.mv){}
        else if(Z.goto){const g2=Z.goto;Z.goto=null;Z.who=null;const from={x:target.x,y:target.y,z:target.z,r:cam.r,th:cam.th,ph:cam.ph};
          Z.len=11;Z.mv={t:0,st:null,m:{name:"upset swoop",at:(t)=>{if(t>10)return null;const u=ease(t/4);return [mix(from.x,g2[0],u),mix(from.y,0,u),mix(from.z,g2[1],u),mix(from.r,55,u),from.th+(lerpAng(from.th,-0.3,1)-from.th)*u,mix(from.ph,0.85,u)];}}};}
        else if(ops.length&&Math.random()<0.45){Z.who=ops[Math.floor(Math.random()*ops.length)];Z.fo=Z.len;Z.r=34+Math.random()*14;Z.th=(Math.random()-0.5)*2.4;Z.tg.set(Z.who.position.x,0,Z.who.position.z);}
        else{Z.who=null;Z.i=(Z.i+1+Math.floor(Math.random()*(POI.length-1)))%POI.length;const q=POI[Z.i];Z.tg.set(q[0],0,q[1]);Z.r=q[2];Z.th=q[3];}
        // hard cut: jump the camera straight to the new shot
        target.copy(Z.tg);cam.r=Z.r;cam.th=Z.th;cam.ph=0.8;
        // v3.2.0: a scripted shot keeps its own paired look; free shots (viewpoints, operator follows) pick at random
        if(!Z.mv){const looks=["dusk","gold","airy","hc","bw"],cur=document.body.dataset.zs,pool=looks.filter(l=>l!==cur);
          document.body.dataset.zs=Math.random()<0.5?"none":pool[Math.floor(Math.random()*pool.length)];}}
      Z.dis=(Z.dis??40)-rdt;if(Z.dis<=0){Z.dis=60+Math.random()*60;const safe=["fogfan","flares","runner"].filter(id=>!S.inc.some(i=>i.id===id));if(safe.length){const id=safe[Math.floor(Math.random()*safe.length)];trigger(id,true);Z.goto=G3.spotOf(id);Z.t=99;}}
      if(Z.who){Z.fo-=rdt;if(Z.fo<=0){Z.who=null;Z.r=Math.min(140,Z.r*2.6);}else{const p=Z.who.position;Z.tg.set(p.x,0,p.z);}}
      if(Z.mv){goal=null;Z.mv.t+=rdt;const f=Z.mv.m.at(Z.mv.t,Z.mv,rdt);if(!f){Z.mv=null;Z.t=99;Z.len=0;}else{target.set(f[0],f[1],f[2]);cam.r=f[3];cam.th=f[4];cam.ph=f[5];Z.tg.copy(target);Z.r=f[3];Z.th=f[4];}}
      else{const k=Math.min(1,rdt*(Z.who?0.6:0.1));goal=null;target.lerp(Z.tg,k);cam.r+=(Z.r-cam.r)*k*0.5;cam.th=lerpAng(cam.th,Z.th+Math.sin(now/26000)*0.3,k*0.5)+rdt*0.015;cam.ph+=(0.8+0.08*Math.sin(now/31000)-cam.ph)*k;}}
    pm("zen / camera shots");
    if(!G3.zenNextMap)G3.zenNextMap=()=>{const order=["rural","urban","desert","swamp"],nx=order[(order.indexOf(SITE.env)+1)%order.length],q=new URLSearchParams(location.search);
      q.set("env",nx);q.delete("mill");q.set("zen","1");diag("zen: on to "+nx);document.body.classList.add("zen-out");setTimeout(()=>{location.href=location.pathname+"?"+q.toString()+location.hash;},900);};G3.padTick(rdt);if(G3.tutTick)G3.tutTick(now);G3.labelIdle(now);upUpdate(now);pm("upgrade visuals");fxUpdate(rdt,now);if(G3.civTick)G3.civTick(rdt,now);pm("upset effects + particles");
    // area ambience: how close the camera is, and which part of the mill it's looking at
    G3.ambT=(G3.ambT||0)+rdt;if(G3.ambT>0.25){G3.ambT=0;const zk=clamp((150-cam.r)/90,0,1),x=target.x,z=target.z,near=(cx,cz,r)=>zk*clamp(1.3-Math.hypot(x-cx,z-cz)/r,0,1);
      const run=S.pm==="run"?1:0.3,L={dryer:near(12,9,20)*run,wet:near(46,9,16)*run,winder:near(-17,8,13)*(S.wd==="run"?1:0.3),stock:near(24,-15,20)*(S.M.pulperDown?0.3:1),out:0};
      L.out=zk*clamp(1-Math.max(L.dryer,L.wet,L.winder,L.stock)*1.5,0,1);AUDIO.ambient(L,zk);}
    G3.roofFade(cam.r);
    if(G3.shadowHz&&!G3.shadowsOff){const t=performance.now();if(!(t-(G3.shT||0)<1000/G3.shadowHz-3)){G3.shT=t;renderer.shadowMap.needsUpdate=true;}}
    placeCam();if(shake>0){camera.position.x+=(Math.random()-0.5)*shake;camera.position.y+=(Math.random()-0.5)*shake;camera.position.z+=(Math.random()-0.5)*shake;}
    // v2.8.8: zoomed out past the default view, trucks and parked trailers are specks, so they aren't drawn (they keep driving unseen)
    if(cam.r>TRUCK_FAR){truckPool.in.forEach(g=>g.visible=false);truckPool.out.forEach(g=>g.visible=false);if(CHEM.g)CHEM.g.visible=false;if(BT.g)BT.g.visible=false;wTruck.visible=false;G3.yardTr.forEach(g=>g.visible=false);}
    pm("ambience, roofs, camera");
    smTick(performance.now());pm("scenery merge");
    // performance-test switches (Diagnostics > Performance test)
    const EXP=G3.EXP;let hidM=null;
    if(EXP.noMovers){if(!moversCache)moversCache=scene.children.filter(o=>o.userData&&(o.userData.legs||o.userData.wheels||o.userData.load||o.userData.cj));hidM=moversCache.filter(o=>o.visible);hidM.forEach(o=>o.visible=false);}
    try{if(G3.knobFrame)G3.knobFrame(rdt,now);}catch(e){G3.fErr=(G3.fErr||0)+1;if(G3.fErr<6)console.error("knobs",e);}   // v5.6 fiddly knobs (40b)
    try{if(G3.tellFrame)G3.tellFrame(rdt,now);}catch(e){G3.fErr=(G3.fErr||0)+1;if(G3.fErr<6)console.error("tells",e);}   // v5.7 the daily round (33b)
    if(G3.dbTick)G3.dbTick();
    if(G3.fxSync)G3.fxSync();   // v6.1 t12: upset effect parts drawn instanced (31)
    if(G3.smColTick)G3.smColTick();   // v6.1 t12: blinking lights in the merged scenery, every frame (40)
    if(G3.cutTick)G3.cutTick(now);
    if(G3.palTick)G3.palTick(now);
    if(G3.lodSet){const R=G3.camR||999;G3.lodSet(R>=500?0:R>=180?1:-1);}   // v6.1 t10: detail per zoom step (40)   // v6.1 iso: season palette and time-of-day grade (36c)   // v6.1 iso: cut-out pictures and cards (42f)
    /* v5.5 perf: per-object frustum culling of the static batches (40-3d-static-merge.js) costs a pass over every batched
       instance, so it runs only on frames where the camera moved or the shadow map refreshes (the shadow pass builds its
       own list, and the main pass right after it leaves the list the still frames then reuse). */
    if(G3.SM&&G3.SM.bms&&G3.SM.bms.length&&!G3.SM.off){const C=G3.cullCam||(G3.cullCam=new Float64Array(23).fill(NaN)),p=camera.position,q=camera.quaternion,pm=camera.projectionMatrix.elements;
      let moved=false;const v=[p.x,p.y,p.z,q.x,q.y,q.z,q.w];for(let i=0;i<7;i++)if(C[i]!==v[i]){moved=true;C[i]=v[i];}for(let i=0;i<16;i++)if(C[7+i]!==pm[i]){moved=true;C[7+i]=pm[i];}
      const on=!G3.cullOff&&(moved||(renderer.shadowMap.enabled&&renderer.shadowMap.needsUpdate)||!!G3.cullAlways);   /* (t10: needsUpdate stays set with shadow maps off: every batch was re-culled every frame) */if(on)G3.cullN=(G3.cullN||0)+1;for(const b of G3.SM.bms)b.perObjectFrustumCulled=on||(!G3.cullOff&&b._visibilityChanged);}   // (t10: a batch whose visibility changed rebuilds its list: culled, not everything)   // (G3.cullOff / cullAlways: A/B switches for the tools)
    if(!EXP.noRender){scene.matrixWorldAutoUpdate=!G3.DB||!G3.DB.n;if(!(G3.tiltRender&&G3.tiltRender()))renderer.render(scene,camera);scene.matrixWorldAutoUpdate=true;}   // (t18: tilt-shift, 42g)
    if(hidM)hidM.forEach(o=>o.visible=true);
    // (v15: no counting when the render was skipped: renderer.info still holds the last real frame's numbers; and the moving
    // batches' matrix rewrites per frame, the figure the Float32 cache bug inflated)
    if(PF.on){if(!EXP.noRender){PF.calls=(PF.calls||0)+renderer.info.render.calls;PF.tris=(PF.tris||0)+renderer.info.render.triangles;PF.rf=(PF.rf||0)+1;}PF.mup=(PF.mup||0)+((G3.DB&&G3.DB.mup)||0);}
    if(G3.DB)G3.DB.mup=0;
    pm("RENDER (three.js draw submission)");
    // labels follow the 3D anchors
    const w=G3.vw||host.clientWidth,hh=G3.vh||host.clientHeight,doText=now-lastLabel>200;if(doText)lastLabel=now;
    // v14: zoomed out, only the area labels and the landmark names show; closer in, the equipment labels and no landmarks
    const wide=camera.isIso?(G3.camR||999)>=300:(G3.camDist||camera.position.distanceTo(target))>400;   // (t16: in the iso view the whole-site step (380) counts as zoomed out: area labels only)
    // (v5.2: no projecting or text building while the section labels can't show: zen, hidden view, labels off)
    if(G3.kvOn)LABELS.forEach(L=>{L.lb.vis=false;});   // v5.6: the fiddly knobs view shows only the knobs' labels (and upsets')
    else if(!(G3.zen||LB.hid||labelHost.classList.contains("lbl-off")))LABELS.forEach(L=>{const R=L.lb;if(L.land?!wide:(!L.area&&wide)){R.vis=false;return;}tmp.copy(L.v).project(camera);const vis=tmp.z<1&&Math.abs(tmp.x)<1.05&&Math.abs(tmp.y)<1.05;R.vis=vis;
      if(!vis)return;R.x=Math.round((tmp.x+1)/2*w);R.y=Math.round((1-tmp.y)/2*hh);
      if(doText||R.a==null){const [a,b]=L.t();lblSet(R,a,b,!!(L.cls&&L.cls()));}});
    lblPaint(now);
    pm("3D labels");
    // headline + active incidents
    if(doText){const b=G3.tut&&G3.tut.on?null:BANNERS[0];if(banner.hidden!==!b)banner.hidden=!b;if(b){const cn="banner3d "+(b.kind==="good"?"good":""),tg=b.tag||(b.kind==="good"?"INSTALLED":"BREAKING");
      if(banner.className!==cn)banner.className=cn;if(banner._tg!==tg){banner._tg=tg;banner.querySelector("span").textContent=tg;}if(banner._tx!==b.text){banner._tx=b.text;banner.querySelector("b").textContent=b.text;}}
      const ck=S.inc.map(i=>i.id).join("|");if(ck!==chips.dataset.k){chips.dataset.k=ck;chips.replaceChildren(...S.inc.map(i=>{const c=document.createElement("button");c.type="button";c.dataset.id=i.id;c.textContent=EV[i.id].name;c.title="Show "+EV[i.id].name;return c;}));}
      banner.classList.toggle("go",!!(b&&b.id&&G3.spotOf(b.id)));}
  ;pm("HUD text");};
  // the diagnostics needs a few internals for its scene census and switches
  G3.diagScene=()=>({scene,renderer,parts,MATS,resize,camera});
  applyPalette();rebuildDoors();
})();
