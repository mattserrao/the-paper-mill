  /* ---- v4.2 test: keep the season on the device (no account, nothing leaves the phone) ----
     The season is saved to localStorage when the page is hidden or closed (switching apps, locking the phone), every
     60 s of play, and after a purchase, a card or a new game day. One slot, versioned; the 3D view isn't saved (it
     rebuilds from the sim). On load, the menu offers "Continue season" when a save from the last 14 days exists; a new
     season or the end of one clears it. A page that comes back without a reload stays paused behind a "Welcome back".
     Seasons only (not free play or zen); off in the autotest and with ?nosave. ---- */
  {const KEY="paper-mill-save",VER=1,MAXAGE=14*86400e3,Q=new URLSearchParams(location.search),OFF=Q.has("nosave")||Q.has("autotest");
    const live=()=>!!(S&&S.season&&S.season.on&&!S.season.done&&!S.free&&!S.zen&&!S.over);
    let lastSave=0,lastDay=-1,lastUp=0,lastHist="";
    function save(why){if(OFF||G3.saveOff||!live())return false;   // (G3.saveOff: tests)
     const t0=performance.now();
      try{const S2=Object.assign({},S);
        // v6.5: the twin's history has its own key, written only when an hour was added (it is the bulk of the save)
        S2.hist=null;if(S.hist){S2.histId=S.hist.id;const hk=S.hist.id+"|"+(S.hist.n||0)+"|"+S.hist.bf;if(hk!==lastHist){localStorage.setItem(KEY+"-hist",JSON.stringify(S.hist));lastHist=hk;}}
        // the open card or dialog is kept by name (the card object holds functions); 3D-only fields are left out
        const op=S.cards&&S.cards.open;S2.cards=Object.assign({},S.cards,{open:op&&op.c?{cid:op.c.id}:op&&op.outage?{outage:true}:null});
        const data={v:VER,app:APP_VER,env:SITE.env,mill:SITE.seed,at:Date.now(),why,S:S2,C,CH:{on:CH.on,lvl:CH.lvl,en:CH.en},
          MILL:{name:MILL.name,brand:MILL.brand},day:Math.floor(S.t/1440)+1,cash:S.cash};
        localStorage.setItem(KEY,JSON.stringify(data));lastSave=performance.now();G3.saveMs=lastSave-t0;return true;}
      catch(e){diag("save failed: "+String(e&&e.message||e).slice(0,80));return false;}}
    // v6.7.1: saves from before the grade set changed carry the old grade ids; they're mapped to the new ones on load
    const GMIG=[["23m","24"],["26m","28"],["30m","31"],["33HT","34Super"]];
    const gmig=t=>t&&GMIG.reduce((a,[o,n])=>a.split('"'+o+'"').join('"'+n+'"'),t);
    function read(){if(OFF)return null;try{const d=JSON.parse(gmig(localStorage.getItem(KEY))||"null");
        if(!d||d.v!==VER||!d.S||Date.now()-d.at>MAXAGE)return null;
        // v4.2.4: a save without the parts restore() needs is thrown away instead of breaking Continue
        const o=x=>!!x&&typeof x==="object";if(!(typeof d.S.t==="number"&&o(d.S.season)&&o(d.S.cards)&&o(d.C)&&o(d.CH))){clear();return null;}
        return d;}catch(e){clear();return null;}}
    function clear(){try{localStorage.removeItem(KEY);localStorage.removeItem(KEY+"-hist");}catch(e){}lastHist="";}
    function restore(d){S=d.S;weMigrate();try{const hh=JSON.parse(gmig(localStorage.getItem(KEY+"-hist"))||"null");S.hist=hh&&hh.id===d.S.histId?hh:null;}catch(e){S.hist=null;}   // (v6.5: no history, or another run's: the prior days are made again)
      for(const k in d.C){if(C[k]&&typeof C[k]==="object"&&d.C[k]&&typeof d.C[k]==="object")Object.assign(C[k],d.C[k]);else C[k]=d.C[k];}
      if(C.spdPref){C.simSpeed=C.spdPref;}else if(S.outg&&S.outg.on&&S.outg.spd){C.simSpeed=S.outg.spd;}delete C.spdPref;   // (v5.0.1: older saves: the player's speed)
      CH.on=d.CH.on;CH.lvl=d.CH.lvl;Object.assign(CH.en,d.CH.en||{});
      if(d.MILL){MILL.name=d.MILL.name;MILL.brand=d.MILL.brand;document.documentElement.style.setProperty("--brand",MILL.brand);PAL_V++;}
      // the open dialog: a card comes back up; an outage plan is asked again
      const op=S.cards.open;S.cards.open=null;
      if(op&&op.outage&&S.outg)S.outg.noticed=false;
      try{vlvMigrate();}catch(e){diag("valves migrate: "+String(e&&e.message||e).slice(0,80));}   // v6.9: manual steam / BW valve / pulper valve from older saves are the new loops
      applyUpgrades();S.M=mods();BANNERS.length=0;seasonLocks(true);
      try{syncControls();}catch(e){}try{updateShop();}catch(e){}try{if(G3.rebrand)G3.rebrand();}catch(e){}
      try{UI_TICKS.forEach(f=>f(0));}catch(e){}   // v5.0.6: the top bar (speed, wave, cash) is right from the first frame, not one UI tick later
      if(op&&op.cid){const c=CARDS.find(x=>x.id===op.cid);if(c)setTimeout(()=>openCard(c),400);}
      if(S.civ&&S.civ.cur)setTimeout(()=>{if(typeof civOpen==="function")civOpen();},450);   // v5.1 civics: an open choice comes back
      if(S.civ&&S.civ.pending){S.civ.q.unshift(S.civ.pending.d);S.civ.pending=null;}
      diag(`save: ${survRun()?"survival run":"season"} restored, day ${d.day}, ${money(d.cash)}`);}
    G3.save={save,read,clear,restore};
    // ---- when to save ----
    document.addEventListener("visibilitychange",()=>{if(document.hidden){if(save("hidden")&&running){G3.saveWasRunning=true;running=false;}}
      else if(G3.saveWasRunning){G3.saveWasRunning=false;welcome();}});
    window.addEventListener("pagehide",()=>save("pagehide"));
    UI_TICKS.push(()=>{if(OFF)return;if(S.season&&S.season.done){if(!S.season.unsaved){S.season.unsaved=1;clear();}return;}if(!live())return;   // v5.0.3: a finished run drops its save (it could be continued and submitted again)
      const now=performance.now(),day=Math.floor(S.t/1440),ups=Object.values(S.up||{}).reduce((a,b)=>a+b,0)+(S.cards?S.cards.pend.length:0);
      if(now-lastSave>60000||day!==lastDay||ups!==lastUp){lastDay=day;lastUp=ups;save("tick");}});
    // ---- coming back without a reload: paused, with a welcome back ----
    function welcome(){if(!live()||!G3.showMenu)return;G3.showMenu();const st=$("v2state");if(st)st.textContent="Welcome back · paused while you were away";}
    // ---- the Continue button on the menu ----
    const d0=read(),go=$("v2go");
    if(d0&&go){const b=document.createElement("button");b.className="primary go";b.id="v2cont";
      const sv0=!!(d0.S.season&&d0.S.season.surv);   // v4.3: the one slot holds a season or a survival run
      b.innerHTML=`<b>Continue ${sv0?"survival":"season"}</b><small>${sv0?`wave ${(d0.S.outg&&d0.S.outg.k)||1} · day ${d0.day}`:`day ${d0.day} of 30`} · ${money(d0.cash)} · ${(ENVS[d0.env]||{name:d0.env}).name}</small>`;
      go.parentNode.insertBefore(b,go);go.classList.remove("primary");go.classList.add("alt");
      b.addEventListener("click",()=>{const d=read();if(!d){b.remove();return;}
        // a save from another map: reload on that map, then continue (?resume=1)
        if(d.env!==SITE.env||d.mill!==SITE.seed){const q=new URLSearchParams(location.search);q.set("env",d.env);q.set("resume","1");location.href=location.pathname+"?"+q+location.hash;return;}
        // v4.2.4: if the save won't load, it is cleared and the page reloads to a clean menu (restore() may have changed state)
        const run=()=>{try{restore(d);}catch(e){diag("save: restore failed, save cleared: "+String(e&&e.message||e).slice(0,80));clear();G3.saveOff=true;   // (or the reload's own pagehide save would write the broken state back)
            b.querySelector("small").textContent="That save couldn't be loaded. Starting fresh…";setTimeout(()=>location.reload(),1500);return;}
          b.remove();go.classList.add("primary");G3.play();if(G3.labelIntro)G3.labelIntro();};
        if(G3.warm||!G3.prewarm)run();else{b.setAttribute("aria-busy","true");b.querySelector("small").textContent="Getting the mill ready…";G3.prewarm().then(run);}});
      if(Q.get("resume")==="1"){try{Q.delete("resume");history.replaceState(null,"",location.pathname+(Q.toString()?"?"+Q:"")+location.hash);}catch(e){}setTimeout(()=>b.click(),300);}}
    // a new season or a reset starts over: the old save goes
    // v5.1: a new season goes through the leader picker, so its old save goes when it really starts (G3.save.drop), not on the click
    ["v2reset"].forEach(id=>{const el=$(id);if(el)el.addEventListener("click",clear,true);});
    // v4.4: a survival run starts from the leader picker, so the old save (and its Continue button) goes when the run
    // really starts, not when the picker opens
    G3.save.drop=()=>{clear();const c=$("v2cont");if(c){c.remove();if(go)go.classList.add("primary");}};
    }   // (v5.1: Play no longer clears the save on the click; the picker's Start does, through G3.save.drop)
