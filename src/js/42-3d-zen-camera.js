  // ---- v2.9.16 zen camera moves: scripted shots that drive the camera every frame ----
  // each returns [tx,ty,tz, r, th, ph] or null when finished (th: 0 = looking from +z, ph: 0 = straight down, PI/2 = level)
  const ease=u=>u<0?0:u>1?1:u*u*(3-2*u),mix=(a,b,u)=>a+(b-a)*u,_zv=new THREE.Vector3();
  let zenMovesCache=null;
  function zenMoves(){if(zenMovesCache)return zenMovesCache;const LEND=PLEN[PLEN.length-1],TUB=[16,1.2,-13.5];
    zenMovesCache=[
      // ride a bale down the walking floor, under the guillotine, up the incline and into the pulper tub
      {name:"bale ride",look:["gold","none"],dur:22,ok:()=>S.rates.feed>0.3&&!S.M.pulperDown,
        start:()=>({d:Math.max(LEND*0.45,wfOff%2.6+2.6),hold:0}),
        at:(t,mv,rdt)=>{const st=mv.st,sp=Math.min(2.2,0.35+S.rates.feed*0.03);if(S.rates.feed>0.3)st.d+=rdt*sp;
          if(st.d<=LEND)pathAt(st.d,_zv);else{const e=Math.min(1,(st.d-LEND)/3);_zv.set(mix(cB.x,TUB[0],e),mix(cB.y+0.6,TUB[1],e),mix(cB.z,TUB[2],e));st.hold+=st.d>LEND+3?rdt:0;}
          if(st.hold>2.5||t>22)return null;const up=clamp(st.d/LEND,0,1);
          return [_zv.x,_zv.y,_zv.z,mix(48,62,up),Math.PI-0.45+0.2*Math.sin(t*0.15),mix(1.0,0.88,up)];}},
      // low dolly down the forming section: headbox, wire and forming table, into the presses
      {name:"forming sweep",look:["airy","none"],dur:12,ok:()=>true,
        at:(t)=>{if(t>12)return null;const u=ease(t/12);return [mix(58,31,u),2.4,zc,mix(40,52,u),mix(0.25,0.75,u),1.1];}},
      // bird's eye: straight down over receiving, then swoop along the line and settle low over the dryers
      {name:"bird's eye swoop",look:["airy","none"],dur:14,ok:()=>true,
        at:(t)=>{if(t>14)return null;const u=ease(t/14),v=ease((t-3)/11);return [mix(-24,14,u),mix(0,3,v),mix(-8,zc,u),mix(300,110,v),mix(-0.2,0.7,u),mix(0.1,1.02,v)];}},
      // v2.9.17 ---------------------------------------------------------------------------------------------
      // ride along with the overhead crane while it carries a reel or a spool
      {name:"crane ride",rare:1,look:["hc","none"],dur:14,ok:()=>!!(CR.j||CR.jobs.length),
        at:(t)=>{if(t>14||(t>4&&!CR.j&&!CR.jobs.length))return null;return [CR.x,Math.max(2,CR.y-3),CR.z,55,0.9+t*0.02,0.95];}},
      // a finished roll: off the winder, onto the upender, along the conveyor until a clamp truck takes it
      {name:"roll's journey",rare:1,look:["gold","none"],dur:20,ok:()=>{const RV=G3.rollVis;return !!(RV&&RV.list.some(r=>r.d<4&&r.wp));},
        start:()=>{const RV=G3.rollVis,r=RV.list.filter(r=>r.d<4&&r.wp).sort((a,b)=>a.d-b.d)[0];return {r,last:r.wp.slice(),hold:0};},
        at:(t,mv,rdt)=>{const st=mv.st,RV=G3.rollVis;if(RV&&RV.list.includes(st.r)&&st.r.wp)st.last=st.r.wp.slice();else st.hold+=rdt;
          if(st.r){st.still=Math.abs(st.r.d-(st.ld??-99))<0.01?(st.still||0)+rdt:0;st.ld=st.r.d;}if(st.hold>2.5||st.still>4||t>20)return null;return [st.last[0],1,st.last[2],46,Math.PI/2+0.35+0.15*Math.sin(t*0.2),1.0];}},
      // slow, low pass along the dryer section at can height
      {name:"dryer dolly",look:["dusk","gold"],dur:14,ok:()=>true,
        at:(t)=>{if(t>14)return null;const u=ease(t/14);return [mix(30,-6,u),4.5,zc,42,mix(0.05,0.3,u),1.25];}},
      // tilt up the fog fan stack from its base to the vapour plume
      {name:"fog fan tilt-up",look:["airy","none"],dur:12,ok:()=>true,
        at:(t)=>{if(t>12)return null;const u=ease(t/12);return [49.5,mix(2,21,u),-4.2,mix(55,70,u),0.55,mix(1.42,1.15,u)];}},
      // one slow lap around the whole mill
      {name:"slow orbit",look:["dusk","none"],dur:20,ok:()=>true,start:()=>({th:Math.random()*6.28}),
        at:(t,mv)=>{if(t>20)return null;return [12,2,0,240,mv.st.th+Math.PI*2*t/30,0.92];}},
      // close orbit of the disk thickener, spider valve and the two seal chests
      {name:"thickener orbit",look:["hc","none"],dur:14,ok:()=>true,
        at:(t)=>{if(t>14)return null;const u=ease(t/14);return [29,mix(10,6,u),-15.5,mix(50,58,u),mix(-0.7,1.0,u),0.95];}},
      // the OCC train rolling in along the spur (or pulling out)
      {name:"train pass",rare:1,look:["bw","gold"],dur:18,ok:()=>ENV.train&&ENV.train.state!=="away",
        at:(t)=>{const tr=ENV.train;if(t>18||tr.state==="away")return null;return [tr.g.position.x+6,2,-29,70,Math.PI-0.45,0.85];}},
      // shift change: cars in the lot and staff at the office door (only around 6 am / 6 pm)
      {name:"shift change",rare:1,look:["gold","dusk"],dur:14,ok:()=>{const hr=((S.t+360)/60)%24;return (hr>5.6&&hr<6.8)||(hr>17.5&&hr<18.7);},
        at:(t)=>{if(t>14)return null;const u=ease(t/14);return [mix(78,54,u),0,mix(47,25,u),mix(75,55,u),-0.5,0.9];}},
      // drift over the clarifier and transfer tank out toward the river
      {name:"clarifier to river",look:["airy","none"],dur:14,ok:()=>true,
        at:(t)=>{if(t>14)return null;const u=ease(t/14);const wx=ENV.ww[0];return [mix(wx+2,wx-2,u),mix(1.5,0,u),mix(-38,-64,u),mix(70,95,u),mix(0.2,0.6,u),mix(0.85,1.05,u)];}},
      // v3.2.0 ----------------------------------------------------------------------------------------------
      // start high over the pulper and spiral down into the vortex
      {name:"pulper vortex dive",look:["hc","none"],dur:14,ok:()=>!S.M.pulperDown&&S.rates.feed>0.3,start:()=>({th:Math.random()*6.28}),
        at:(t,mv)=>{if(t>14)return null;const u=ease(t/14);return [TUB[0],TUB[1],TUB[2],mix(150,34,u),mv.st.th+u*2.6,mix(0.75,0.12,u)];}},
      // low along the slice: the headbox jet lands on the wire and the sheet forms as we drift down the table
      {name:"headbox to wire",look:["airy","none"],dur:13,ok:()=>S.pm==="run",
        at:(t)=>{if(t>13)return null;const u=ease(t/13);return [mix(52,43,u),mix(2.0,1.6,u),zc,mix(28,24,u),mix(0.8,0.65,u),mix(1.3,1.22,u)];}},
      // sit on the reel and wait for the turn-up: the full reel is kicked down the rails and the new spool takes the sheet
      {name:"reel turn-up",look:["gold","none"],rare:1,dur:26,
        ok:()=>{if(S.pm!=="run"||!(S.rates.prod>1))return false;const w=(P.jumbo-S.reel)/S.rates.prod*60/Math.max(0.1,C.simSpeed);return w>1.5&&w<14;},
        start:()=>({n:S.tot.turnups,at:-1}),
        at:(t,mv)=>{const st=mv.st;if(st.at<0&&S.tot.turnups>st.n)st.at=t;if((st.at>=0&&t-st.at>7)||t>26||(st.at<0&&S.pm!=="run"))return null;
          const u=ease(t/20);return [DX-2.2,DY-0.6,zc,mix(40,32,u),mix(-0.55,-0.35,u),mix(1.18,1.25,u)];}},
      // low sideways track past the twin refiners, doors in the foreground
      {name:"refiner yard pass",look:["hc","none"],dur:13,ok:()=>true,
        at:(t)=>{if(t>13)return null;const u=ease(t/13);return [61,2.2,mix(-16,-7,u),40,mix(0.2,0.45,u),0.98];}},
      // follow a loaded truck from the dock out past the gate
      {name:"truck departure",look:["dusk","none"],rare:1,dur:18,
        ok:()=>cam.r<TRUCK_FAR*2&&truckPool.out.some(g=>g.visible&&g.userData.busy&&(g.userData.phase==="leave"||(g.userData.phase==="dock"&&(g.userData.frac||0)>0.85))),
        start:()=>{const L=truckPool.out.filter(g=>g.visible&&g.userData.busy);const g=L.find(g=>g.userData.phase==="leave")||L.sort((a,b)=>(b.userData.frac||0)-(a.userData.frac||0))[0];return {g,p:g.position.clone()};},
        at:(t,mv)=>{const st=mv.st,g=st.g;if(g.visible&&g.userData.busy)st.p.lerp(g.position,0.15);else st.gone=(st.gone||0)+0.02;
          if(t>18||st.gone>0.5||st.p.x<-140||(t>12&&g.userData.phase==="dock"))return null;return [st.p.x,1.5,st.p.z,mix(55,68,ease(t/18)),-0.95+t*0.02,1.02];}},
      // peek over an operator's shoulder at the console: the game is on, until a manager walks by
      {name:"control room peek",look:["none"],rare:1,dur:18,
        ok:()=>!!(G3.tvOn&&G3.tvOn.some(Boolean)),
        start:()=>({ci:Math.max(0,G3.tvOn.findIndex(Boolean)),th:(Math.random()<0.5?-1:1)*(0.25+Math.random()*0.2)}),
        at:(t,mv)=>{const st=mv.st;if(!st.ext&&mgrNear(CONSOLES[st.ci],13.4,14))st.ext=1;if(t>(st.ext?18:12))return null;const u=ease(t/14);return [CONSOLES[st.ci],1.5,13.5,mix(23,19,u),st.th,mix(1.0,1.08,u)];}},
      // tag along with a manager on their rounds
      {name:"manager walkabout",look:["bw","none"],rare:1,dur:15,ok:()=>!!(G3.mgrLead&&G3.mgrLead()),
        start:()=>{const m=G3.mgrLead();return {m,p:m.position.clone(),th:m.rotation.y+Math.PI/2+0.6};},
        at:(t,mv)=>{const st=mv.st;if(!st.m.visible||t>15)return null;st.p.lerp(st.m.position,0.08);return [st.p.x,0.8,st.p.z,38,st.th+t*0.03,1.08];}},
      // high, slow pass over the lit mill at night
      {name:"night lights flyover",look:["none","hc"],rare:1,dur:22,ok:()=>(G3.nightK||0)>0.8,start:()=>({d:Math.random()<0.5?1:-1}),
        at:(t,mv)=>{if(t>22)return null;const u=ease(t/22),d=mv.st.d;return [mix(-45*d+15,75*d+15,u),0,mix(-10,5,u),mix(210,170,u),0.35*d+0.25,mix(0.62,0.78,u)];}},
      // long establishing push: from far beyond the river, over the trees, into the mill
      {name:"long establishing shot",look:["dusk","gold"],dur:20,ok:()=>true,
        at:(t)=>{if(t>20)return null;const u=ease(t/20);return [mix(10,14,u),mix(0,2,u),mix(-80,-4,u),mix(420,170,u),Math.PI+0.25-0.2*u,mix(1.25,0.95,u)];}},
      // v3.3 ------------------------------------------------------------------------------------------------
      // night: chase the hall scrubber from behind, low, beacon flashing and the wet trail behind it
      {name:"scrubber ride-along",look:["none","dusk"],rare:1,dur:9,ok:()=>!!(G3.scrubbers&&G3.scrubbers[0].st==="run"),
        start:()=>({th:null}),
        at:(t,mv,rdt)=>{const R=G3.scrubbers[0];if(t>9||R.st!=="run")return null;const g=R.g,a=g.rotation.y,want=Math.atan2(-Math.cos(a),Math.sin(a));
          mv.st.th=mv.st.th==null?want:lerpAng(mv.st.th,want,Math.min(1,rdt*1.5));return [g.position.x,0.8,g.position.z,13,mv.st.th,1.18];}},
      // night: the janitor on their rounds, closer while a can is emptied
      {name:"janitor's rounds",look:["none","gold"],rare:1,dur:8,ok:()=>!!(G3.janitor&&G3.janitor.jan.visible),start:()=>({th:Math.random()*6.28,r:13}),
        at:(t,mv,rdt)=>{const {jan,J}=G3.janitor;if(t>8||!jan.visible)return null;const at=J.tgt&&J.tgt.c&&J.t>0;mv.st.r+=((at?8:13)-mv.st.r)*Math.min(1,rdt*1.2);
          return [jan.position.x,0.9,jan.position.z,mv.st.r,mv.st.th+t*0.08,1.08];}},
      // a slow push in on the fullest overflowing trash can
      {name:"litter check",look:["airy","none"],rare:1,dur:6,ok:()=>!!(G3.janitor&&G3.janitor.cans.some(c=>c.f>1.1)),
        start:()=>({c:G3.janitor.cans.slice().sort((a,b)=>b.f-a.f)[0],th:(Math.random()-0.5)*2}),
        at:(t,mv)=>{if(t>6)return null;const u=ease(t/6),c=mv.st.c;return [c.x,0.5,c.z,mix(15,8,u),mv.st.th+u*0.3,mix(1.0,1.15,u)];}},
      // lunch at the food truck and the picnic tables
      {name:"lunch rush",look:["gold","airy"],rare:1,dur:8,ok:()=>!!(G3.FOOD&&G3.FOOD.open&&G3.followable&&G3.followable().some(w=>w.userData.lunch)),
        at:(t)=>{if(t>8)return null;const u=ease(t/8);return [33,0.8,mix(34.2,35.4,u),mix(24,18,u),mix(0.35,0.75,u),mix(1.12,1.2,u)];}},
      // floor-level dolly under the forming table, across the tiled white-water silo
      {name:"under the wire",look:["hc","none"],dur:6,ok:()=>true,
        at:(t)=>{if(t>6)return null;const u=ease(t/6);return [mix(53,43,u),0.6,9.1,9,mix(0.25,-0.1,u),1.45];}},
      // follow the feed: fan pump, up, over the hall wall and down into the headbox header
      {name:"fan pump to headbox",look:["none","airy"],dur:8,ok:()=>true,
        at:(t)=>{if(t>8)return null;const P=[[47.6,1.5,-9.3],[47.6,7.6,-9.3],[47.6,7.6,3.6],[60.75,7.6,3.6],[60.75,2.2,5.85]],L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1],P[i][2]-P[i-1][2]));
          const d=ease(t/8)*L[L.length-1];let i=1;while(i<L.length-1&&L[i]<d)i++;const k=(d-L[i-1])/(L[i]-L[i-1]),a=P[i-1],b=P[i];
          return [mix(a[0],b[0],k),mix(a[1],b[1],k),mix(a[2],b[2],k),17,mix(-0.95,-0.5,t/8),1.0];}},
      // tight on the dryer can heads turning, manways sweeping round
      {name:"can heads",look:["hc","none"],dur:5,ok:()=>S.pm==="run",
        at:(t)=>{if(t>5)return null;const u=ease(t/5);return [mix(23,17.5,u),2.5,12.4,9,0.15,1.43];}},
      // the L/B gauge, then out to the jet and the wavy wet line on the wire
      {name:"slice and wet line",look:["airy","none"],dur:7,ok:()=>S.pm==="run",
        at:(t)=>{if(t>7)return null;const u=ease(Math.max(0,(t-2.2)/4.8)),g=G3.SLC?G3.SLC.geo():{wet:50};
          return [mix(57.15,mix(g.wet,54,0.35),u),mix(2.95,2.9,u),mix(12.4,9.1,u),mix(5.5,15,u),mix(0.08,0.55,u),mix(1.5,0.92,u)];}}];
    return zenMovesCache;}
