  /* ---- v6.9 shift change (manning model: 03f). Techs and operators wear their team's hard hat: A blue, B green,
     C orange, D white; whoever is covering from another team wears their own team's colour. At 6 a.m. and 6 p.m. the
     incoming crew walks in from the parking lot, each to the person they relieve (a tech's bench in the shop; an
     operator wherever they are), stops for a word, and the outgoing person walks back out to the lot. In the mill the
     two simply trade places: the figure that stays takes the new hat and the walker leaves in the old one. A tech out
     on a job is relieved when they get back to the shop. A load, a reseed, zen, a jump of more than an
     hour, or the next change arriving first all skip the walk and change the hats on the spot. Cosmetic only. ---- */
  const SHC={s:null,pool:{t:[],o:[],sp:[]},live:[],PARK:[63.6,34.4]};G3.SHC=SHC;   // (G3.SHC: tests)
  function setHat(w,m){const h=w.userData&&w.userData.hats;if(!h||!m||h[0].material===m)return;for(const x of h)x.material=m;}
  // every figure that works the rotation: techs[k] are MAN techs k; crew (machine floor, 7) and spOps (stock prep, 2) are ops 0-8
  let shcF=null,shcN=-1;
  function shcFigs(){if(shcF&&shcN===techs.length)return shcF;shcN=techs.length;const out=shcF=[];techs.forEach((T,k)=>out.push({w:T.w,kind:"t",i:k,T,to:()=>T.bench.p,ok:()=>T.state==="home"}));
    crew.forEach((w,k)=>out.push({w,kind:"o",i:k,to:()=>shcBeside(w),ok:()=>true}));
    spOps.forEach((w,k)=>out.push({w,kind:"sp",i:7+k,to:()=>shcBeside(w),ok:()=>true}));return out;}
  // v6.11.2: where the relief stands: beside the operator on open floor (the walking grid, 38). It used to be a fixed 0.9 m
  // right and 0.6 m south, which for an operator by the hall's tending-side wall was inside the wall, so the walker's last
  // straight steps took them through it
  const SHB=[[0.9,0.6],[0.9,-0.6],[-0.9,0.6],[-0.9,-0.6],[0,0.9],[0,-0.9],[1.2,0],[-1.2,0]];
  function shcBeside(w){const x=w.position.x,z=w.position.z;if(!NAVW.g)navBuild(NAVW);
    for(const [dx,dz] of SHB){const c=navC(NAVW,[x+dx,z+dz]);if(navFree(NAVW,c[0],c[1]))return [x+dx,z+dz];}
    const n=navNearest(NAVW,navC(NAVW,[x,z]));return n?[NAVW.x0+(n[0]+0.5)*NAVW.cs,NAVW.z0+(n[1]+0.5)*NAVW.cs]:[x,z];}
  function shcWant(m,f){const row=f.kind==="t"?m.techs[f.i]:m.ops[f.i];if(!row)return null;const p=row.who||row.home;return M.hatTeam[p.team];}
  // a walker that looks like the person it relieves (same suit and vest), from a small pool kept for reuse
  function shcWalker(f,hatM){const P0=SHC.pool[f.kind];let c=P0.pop();
    if(!c){const role=f.kind==="t"?{vest:HIVIS.yellow,radio:true}:f.kind==="sp"?{vest:HIVIS.orange,radio:true}:{radio:true};c=worker(f.w.userData.body.material,hatM,role);}
    setHat(c,hatM);c.visible=true;c.userData.wp=null;c.userData.wpKey=null;return c;}
  function shcDone(L){L.c.visible=false;SHC.pool[L.f.kind].push(L.c);}
  // finish every walk still going: the hats change at once and the walkers leave the floor
  function shcFlush(){for(const L of SHC.live){setHat(L.f.w,L.newM);shcDone(L);}SHC.live.length=0;}
  G3.shiftUpdate=(rdt,now)=>{if(!S||!M.hatTeam)return;const s=manIdx(),m=manShift(s),figs=shcFigs();
    if(s!==SHC.s){const prev=SHC.s;SHC.s=s;shcFlush();
      const walk=prev===s-1&&S.t-s*720<60&&!S.zen;
      figs.forEach((f,n)=>{const newM=shcWant(m,f);if(!newM)return;const oldM=f.w.userData.hats[0].material;
        if(!walk||!f.w.visible||oldM===newM){setHat(f.w,newM);return;}
        const c=shcWalker(f,newM);c.position.set(SHC.PARK[0]+(n%4)*0.7,0,SHC.PARK[1]+Math.floor(n/4)*0.7);
        SHC.live.push({f,c,newM,oldM,st:"in",wait:0.6+n*0.35,talk:0,give:0});});}
    // outside a walk, the hats follow the model (new techs from an upgrade, a P.techs change mid-shift)
    for(const f of figs){if(SHC.live.length&&SHC.live.some(L=>L.f.w===f.w))continue;setHat(f.w,shcWant(m,f));}
    if(!SHC.live.length)return;
    const sp=2.2*clamp(simRate()/20,1,4);
    for(let k=SHC.live.length-1;k>=0;k--){const L=SHC.live[k],c=L.c;
      if(L.st==="in"){if(L.wait>0){L.wait-=rdt;pose(c,"idle",now);continue;}
        // (v6.11.2: the target is held while the person stays put: it used to follow them every frame, so a walker's route search
        //  (38 walkPlan) restarted every frame, never finished, and the walker steered straight at them through the walls)
        const w=L.f.w;if(!L.tgt||Math.hypot(w.position.x-L.ax,w.position.z-L.az)>3){L.tgt=L.f.to();L.ax=w.position.x;L.az=w.position.z;}const [tx,tz]=L.tgt;
        if(moveP(c,tx,tz,sp,rdt)){L.st="wait";}else pose(c,"walk",now);}
      else if(L.st==="wait"){face(c,L.f.w.position.x,L.f.w.position.z,rdt);pose(c,"idle",now);L.give+=rdt;
        // the person being relieved has to be free (a tech back in the shop); after 40 s the change happens anyway
        if(L.f.ok()||L.give>40){L.st="talk";L.talk=1.6;}}
      else if(L.st==="talk"){face(c,L.f.w.position.x,L.f.w.position.z,rdt);pose(c,"idle",now);L.talk-=rdt;
        if(L.talk<=0){setHat(L.f.w,L.newM);setHat(c,L.oldM);c.userData.wp=null;c.userData.wpKey=null;L.st="out";}}
      else if(L.st==="out"){if(moveP(c,SHC.PARK[0],SHC.PARK[1],sp,rdt)){shcDone(L);SHC.live.splice(k,1);}else pose(c,"walk",now);}}};
