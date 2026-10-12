  /* ---- v4.2.4 Mill report (the Report tab, the grade badge in the top bar, cost and uptime in the dropdown) ----
     One grade system: the report card's four grades (profit, cost per ton, downtime, reliability) and their overall,
     shown live for the current 10-day period, with the finished periods' cards one tap away and a day-by-day history
     (the day's grades are kept at each midnight by rcTick). Cost per ton is split by what it is spent on; the
     chemicals share of the energy line is worked out from today's rates (the books keep them together). Display only:
     nothing here touches the simulation. Outside a season the tab shows totals since the start, without grades. */
  {const el=$("rep"),GP={A:4,B:3,C:2,D:1,F:0},pc=v=>Math.round(v*100)+"%",hrs=m=>(m/60).toFixed(m<600?1:0)+" h";
    let openDays=false,openMoney=false,lastN=-99;
    const chemShare=()=>{const t=energyCost();if(!(t>0))return 0;const c=(ECON.chem||0)+(P.chemAdd||0)+((ENVX()&&ENVX().chem)||0);return Math.max(0,Math.min(1,c/t));};
    const allAcc=()=>({t0:0,L0:{},prod0:0,ship0:0,rolls0:0,brk0:0,hay0:0,off0:0,occ:0,fib:0,min:Math.max(1,S.t),plan:0,up:{recv:0,pulper:0,machine:0,winder:0,ship:0},dn:{},bn:{}});
    const seasonOn=()=>!!(S.season&&(S.season.on||S.season.done)&&S.rc&&!S.free&&!S.zen);
    // the numbers everything below draws from
    function data(){if(seasonOn()){const R=S.rc,live=S.season.done&&R.cards.length>=3?R.cards[2]:rcMake(R.p,R.i),prev=R.i>0?R.cards[R.i-1]:null;return {R,live,prev,p:live.p,season:true};}
      return {p:rcSum(allAcc()),season:false};}
    function costRows(p){const sp=p.spent,cs=chemShare(),e=sp.Energy||0;
      return [["Fibre (OCC)",sp.Fibre||0,"var(--kraft)"],["Energy & steam",e*(1-cs),"var(--stock)"],["Chemicals",e*cs,"var(--pulp)"],["Labour",sp.Labour||0,"var(--machine)"],["Overhead",sp.Overhead||0,"#9aa1b5"],
        ["Repairs",sp["Repairs & outages"]||0,"var(--bad)"],["Premium freight",sp["Premium freight"]||0,"var(--warn)"]].filter(r=>r[1]>0);}
    function tiles(d){const R=d.R,out=[];for(let i=0;i<3;i++){const c=R.cards[i],cur=i===R.i&&!S.season.done,lab=`Days ${i*10+1}–${i*10+10}`;
        if(c&&!cur)out.push(`<button type="button" class="rpt" data-card="${i}"><span class="rcg g${c.overall}">${c.overall}</span><span><b>${lab}</b><small>View card</small></span></button>`);
        else if(cur){const L=d.live.overall,pv=d.prev?d.prev.overall:null,tr=pv==null?"so far":GP[L]>GP[pv]?"rising":GP[L]<GP[pv]?"falling":"steady";
          out.push(`<div class="rpt cur"><span class="rcg g${L}">${L}</span><span><b>${lab}</b><small>${tr}</small></span></div>`);}
        else out.push(`<div class="rpt next"><span class="rcg">–</span><span><b>${lab}</b><small>to come</small></span></div>`);}
      return out.join("");}
    function grades(d){const pv=d.prev;return Object.entries(d.live.g).map(([k,v])=>{const o=pv?pv.g[k]:null,dlt=o==null?"":GP[v]>GP[o]?`<em class="up">▲ from ${o}</em>`:GP[v]<GP[o]?`<em class="dn">▼ from ${o}</em>`:`<em>same</em>`;
      return `<div class="rgr"><span class="rcg g${v}">${v}</span><small>${k}</small>${dlt}</div>`;}).join("");}
    function costBlock(p){if(!(p.prod>0.5))return `<p class="rnone">No paper made yet.</p>`;const rows=costRows(p),tot=rows.reduce((t,r)=>t+r[1],0)/p.prod,price=p.price,sc=Math.max(price,tot)*1.04;
      const bar=rows.map(r=>`<i style="width:${(r[1]/p.prod/sc*100).toFixed(2)}%;background:${r[2]}"></i>`).join(""),m=price-tot;
      return `<div class="rhd"><h3>Cost to make a ton</h3><small class="mono">${money(tot)} of ${money(price)}</small></div>
        <div class="rcbar"><div class="rcbars">${bar}</div><div class="rprice" style="left:${(price/sc*100).toFixed(2)}%"><span>Price ${money(price)}</span></div></div>
        <div class="rmargin ${m>=0?"pos":"neg"}">Margin ${money(m)}/t · ${pc(price>0?m/price:0)}</div>
        <div class="rleg">${rows.map(r=>`<div><i style="background:${r[2]}"></i><span>${r[0]}</span><b class="mono">${money(r[1]/p.prod)}</b></div>`).join("")}</div>`;}
    function upBlock(p){const top=p.dn.slice(0,3).map(([k,m])=>`${k} (${hrs(m)})`).join(" · ");
      return `<div class="rhd"><h3>Uptime</h3><small>this period · outages left out</small></div><div class="rup">${RC_SEC.map(([k,n])=>{const v=p.rel[k]||0,w=v<0.9;
        return `<span${w?' class="w"':""}>${n}</span><div><i style="width:${(v*100).toFixed(1)}%;background:${v<0.9?"var(--warn)":"var(--ok)"}"></i></div><b class="mono${w?" w":""}">${pc(v)}</b>`;}).join("")}</div>
        <p class="rnote">${top?"Biggest losses: "+top+" · ":""}${p.breaks} sheet break${p.breaks===1?"":"s"} · ${p.hay} hayout${p.hay===1?"":"s"}</p>`;}
    function qualBlock(p,season){const eff=S.tot.pot>0?S.tot.prodT/S.tot.pot:1;
      return `<h3>Quality &amp; fibre</h3><div class="rq"><div><small>On spec</small><b class="mono">${(p.onspec*100).toFixed(1)}%</b><small>${Math.round(p.off)} t to the beater</small></div>
        <div><small>Fibre yield</small><b class="mono">${p.yld?pc(p.yld):"–"}</b><small>${p.yld?(1/p.yld).toFixed(2)+" t OCC per t":season?"collecting":"in a season"}</small></div>
        <div><small>Output</small><b class="mono">${pc(eff)}</b><small>of max-speed tons</small></div></div>`;}
    function daysBlock(d){const D=d.R.days||[];if(!D.length)return "";
      const X=v=>22+(v-1)*(326/29),Y=L=>20+(4-GP[L])*28,pts=D.map(x=>`${X(x.d).toFixed(1)},${Y(x.o)}`).join(" ");
      const drops=D.filter((x,i)=>i>0&&GP[x.o]<GP[D[i-1].o]);
      const svg=`<svg class="rchart" viewBox="0 0 358 170" role="img" aria-label="Overall grade at the end of each day"><g class="ax">${["A","B","C","D","F"].map((L,i)=>`<text x="4" y="${24+i*28}">${L}</text><line x1="22" y1="${20+i*28}" x2="350" y2="${20+i*28}"></line>`).join("")}
        <text x="18" y="162">1</text><text x="${X(10)-6}" y="162">10</text><text x="${X(20)-6}" y="162">20</text><text x="${X(30)-6}" y="162">30</text></g>
        <line class="pd" x1="${X(10.5)}" y1="8" x2="${X(10.5)}" y2="144"></line><line class="pd" x1="${X(20.5)}" y1="8" x2="${X(20.5)}" y2="144"></line>
        <polyline class="ln" points="${pts}"></polyline>${D.map(x=>`<circle class="${drops.includes(x)?"drop":"pt"}" cx="${X(x.d).toFixed(1)}" cy="${Y(x.o)}" r="${drops.includes(x)?4.5:3}"></circle>`).join("")}</svg>`;
      const strip=k=>`<span>${k}</span><div class="rstrip">${D.map(x=>`<i class="s${x.g[k]}" title="Day ${x.d}: ${x.g[k]}"></i>`).join("")}</div><b class="rcgt g${D[D.length-1].g[k]}">${D[D.length-1].g[k]}</b>`;
      const moves=[];for(let i=D.length-1;i>0&&moves.length<4;i--){const a=D[i-1],b=D[i];if(a.o===b.o)continue;const up=GP[b.o]>GP[a.o];
        moves.push(`<div><b class="mono">Day ${b.d}</b><span>${up?"Grade up to "+b.o:"Grade down to "+b.o}${b.top&&!up?": "+b.top[0]+" ("+hrs(b.top[1])+")":up?": a cleaner day":""}</span><em class="${up?"mvup":"mvdn"}">${up?"▲":"▼"}</em></div>`);}
      return `<details class="rsub" id="repDays"${openDays?" open":""}><summary><b>Day by day</b><small>your overall grade at the end of each day</small></summary>${svg}
        <div class="rstrips">${Object.keys(D[0].g).map(strip).join("")}</div>${moves.length?`<h4>What moved your grade</h4><div class="rmoves">${moves.join("")}</div>`:""}</details>`;}
    function moneyBlock(d){const p=d.p,s=d.season?d.live.s:null,row=(k,a,b,c)=>`<div class="rcr${c?" "+c:""}"><span>${k}</span><b>${a}</b>${s?`<i>${b}</i>`:""}</div>`;
      return `<details class="rsub" id="repMoney"${openMoney?" open":""}><summary><b>Money</b><small>${s?"this period · season":"since the start"}</small></summary>
        ${row("Earned",money(p.earned),s?money(s.earned):"","pos")}${Object.keys(p.spent).filter(k=>p.spent[k]||(s&&s.spent[k])).map(k=>row(k,money(-p.spent[k]),s?money(-s.spent[k]):"")).join("")}${row("Net",money(p.net),s?money(s.net):"","net "+(p.net>=0?"pos":"neg"))}</details>`;}
    function render(){const d=data(),p=d.p;let h="";
      if(d.season){const day=Math.min(SEASON_DAYS,Math.floor(S.t/1440)+1);
        h+=`<section class="rcard"><div class="rhd"><h3>Season</h3><small class="mono">${S.season.done?"Season complete":"Day "+day+" of "+SEASON_DAYS}</small></div><div class="rtiles">${tiles(d)}</div><div class="rprog"><i style="width:${Math.min(100,S.t/(SEASON_DAYS*1440)*100).toFixed(1)}%"></i></div>${daysBlock(d)}</section>`;
        h+=`<section class="rcard"><div class="rhd"><h3>${S.season.done?"Last period":"This period so far"}</h3><small>days ${d.live.from}–${Math.min(d.live.to,day)}${d.prev?" · vs days "+d.prev.from+"–"+d.prev.to:""}</small></div><div class="rgrades">${grades(d)}</div><p class="rtip"><b>Biggest lever:</b> ${d.live.tip}</p></section>`;}
      else h+=`<section class="rcard"><p class="rnone">Grades, uptime and report cards run during a 30-day season. Here are your totals since the start.</p></section>`;
      h+=`<section class="rcard">${costBlock(p)}</section>`;if(d.season)h+=`<section class="rcard">${upBlock(p)}</section>`;
      h+=`<section class="rcard">${qualBlock(p,d.season)}</section><section class="rcard">${moneyBlock(d)}</section>`;
      el.innerHTML=h;}
    el.addEventListener("click",e=>{const b=e.target.closest("[data-card]");if(b&&S.rc){const c=S.rc.cards[+b.dataset.card];if(c)rcOpen(c,true);}});
    el.addEventListener("toggle",e=>{if(e.target.id==="repDays")openDays=e.target.open;if(e.target.id==="repMoney")openMoney=e.target.open;},true);
    // the top bar: the grade so far, and cost per ton and machine uptime in the dropdown
    const set=(id,v)=>{const e=$(id);if(e&&e.textContent!==v)e.textContent=v;};
    function topBar(){const d=data(),p=d.p,gb=$("v2grade");
      if(d.season){const L=d.live.overall;gb.hidden=false;if(gb.textContent!==L){gb.textContent=L;gb.className="gbadge rcg g"+L;}}else gb.hidden=true;
      if(p.prod>0.5){const cpt=costRows(p).reduce((t,r)=>t+r[1],0)/p.prod;set("v2cpt",money(cpt));set("v2cpt-s",`${money(p.price-cpt)} margin`);}else{set("v2cpt","–");set("v2cpt-s","");}
      if(d.season){set("v2up",pc(p.rel.machine||0));set("v2up-s","this period");}else{set("v2up",pc(S.t>0?1-S.tot.breakMin/S.t:1));set("v2up-s","sheet time");}}
    $("v2rep").addEventListener("click",()=>{const t=document.querySelector('.v2tabs [data-tab="stats"]');if(t&&t.getAttribute("aria-pressed")!=="true")t.click();});
    UI_TICKS.push(n=>{if(n%5)return;try{topBar();if(paneShown(el))render();}catch(e){if(!G3.repErr){G3.repErr=1;console.error("report",e);}}});
    G3.report={render,data};}
