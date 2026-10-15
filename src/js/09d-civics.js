/* ---------- v5.1 (offline): civics, the play (choice cards, new upsets, meter-triggered upsets, standing orders, the bar) ----------
   The model and the numbers are in 03e-civics.js, the upset and card data in 03e-civics-data.js.
   - When an upset with choices starts (EVENTS upsets in 04, or one of the new civic upsets below), the sim pauses on a choice
     card: each choice has a cash cost, changes how often the upset comes back, moves the meters, and may do something
     special (CIVFX). The new civic upsets have a base effect (CIVNEW); a Fix-properly choice ends it, a Cheap fix halves
     what's left, a Shortcut leaves it.
   - Standing orders: per area, by fix type, set with the card's checkbox. They still ask the first time an upset appears,
     for any $$$ choice, and always for meter-triggered upsets and rewards. When an order answers, a toast says so, with a
     Change button for 5 seconds (or 2 sim hours) before the choice is made.
   - Meter-triggered: a warning when a meter enters Strained (under 40), a crisis within a day of entering Crisis (under 20,
     then every 4 days while it stays there), a reward card on reaching Excellent (over 80, again after falling below 70).
   Everything here is data on S.civ (saved with the run); timers are {left, act, ...} records, not closures. */
// the new civic upsets: how often (days between, before the meters and odds), what they say, and their base effect
const CIVNEW={
  odor:{head:"Neighbours are complaining about the smell from stock prep."},
  council:{head:"The town council will vote on banning mill trucks from Main Street."},
  reporter:{head:"A local reporter is at the gate asking about the mill."},
  sponsor:{head:"The town fair is looking for a main sponsor."},
  hothall:{head:"The machine hall is sweltering: the crew is wilting.",fx:{left:1440,mods:{breakMul:1.2}}},
  retire:{head:"Your senior machine tender is retiring at the end of the week.",fx:{left:3*1440,mods:{breakMul:1.1}}},
  nearmiss:{head:"The dock equipment failed a guard audit.",fx:{left:720,mods:{clampMul:0.8}}},
  complaint:{head:"A customer says a load arrived with curl and wants credit.",fx:{left:3*1440,price:{all:-5}}},
  rush:{head:"A box plant needs 900 t in a hurry and will pay a premium."},
  pricecut:{head:"Riverside Paper, the competing mill, just cut its price.",fx:{left:5*1440,price:{all:-10}}},
  green:{head:"A big customer wants recycled-content certification."},
  occshort:{head:"Your OCC supplier is short this week.",fx:{left:720,mods:{recvMul:0.5}}},
  chemlate:{head:"The retention aid delivery is late.",fx:{left:720,mods:{breakMul:1.4}}},
  energyspike:{head:"Power prices just spiked.",fx:{left:2*1440,energy:15}},
  flu:{head:"Flu is running through the crew.",fx:{left:2*1440,mods:{breakMul:1.15,clampMul:0.85}}},
  poach:{head:"A competitor is poaching your operators.",fx:{left:3*1440,mods:{breakMul:1.15}}},
  inspector:{head:"A state safety inspector has arrived."},
  dcs:{head:"The control system crashed! The machine is down.",fx:{left:90,mods:{pmDown:"control system crash"}}},
  moisture:{head:"Moisture is drifting off spec on the reel.",fx:{left:180,mods:{offSpec:1}}},
  freight:{head:"Freight rates just jumped.",fx:{left:3*1440,price:{all:-8}}},
  noise:{head:"The neighbours are complaining about night noise from the yard."},
  fishkill:{head:"Dead fish downstream, and people are blaming the mill."}};
// meter-triggered warnings and crises: the meter, the base effect, and what each choice (A, B, C) does beyond cost and civics
const CIVMETER={
  w_sickout:{k:"L",head:"A sick-out: half the crew called in sick. Short shifts today.",fx:{left:1440,mods:{breakMul:1.2,clampMul:0.8}},ch:[{},{end:1},{end:1,flag:"L"}]},
  w_petition:{k:"C",head:"A petition against the mill is going round town hall.",fx:{left:3*1440,comm:1.5},ch:[{},{promise:1},{flag:"C"}]},
  w_watch:{k:"E",head:"Your key customer has put you on watch: −$5/t until things improve.",fx:{left:7*1440,price:{all:-5}},ch:[{},{end:1},{}]},
  w_vibration:{k:"M",head:"Vibration alarms on the machine: top speed −5% until it's fixed.",fx:{left:"outage",mods:{speedCap:0.95}},ch:[{end:1,down:120},{},{end:1,flag:"M"}]},
  c_walkout:{k:"L",head:"Walkout! The yard has stopped, and the machine will run dry in about 6 hours.",fx:{left:720,mods:{recvMul:0,clampMul:0}},ch:[{end:1},{left:360},{after:{L:2}}]},
  c_protest:{k:"C",head:"Protesters are blocking the gate. No trucks in or out.",fx:{left:720,mods:{noIn:1,noOut:1}},ch:[{end:1,pledge:1},{},{left:120}]},
  c_custwalk:{k:"E",head:"Your key customer has walked: one grade loses $10/t for 5 days.",fx:{left:5*1440,grade:-10},ch:[{left:2880},{swap:-10},{end:1}]},
  c_shutdown:{k:"M",head:"The insurer has ordered a 12-hour shutdown.",fx:{left:720,mods:{pmDown:"insurer shutdown"}},ch:[{},{left:360,recheck:1},{appeal:1}]}};
// reward cards (Excellent): accept or decline
const CIVREWARD={
  r_L:{k:"L",n:"Crew pledge",head:"The crew offers to make the next planned outage finish early, with no overrun.",win:"Next outage: no overrun, 1 h early. Free the first time; each later one costs Labor −3."},
  r_C:{k:"C",n:"Town tax break",head:"The town offers a property tax break if the mill pays into the school fund.",win:"Pay $60k now; running costs −$3k a day for good."},
  r_E:{k:"E",n:"Long-term contract",head:"A big customer offers a long-term contract.",win:"+$8/t on every grade for 14 days. You must hit a weekly tonnage target or pay $40 per ton short."},
  r_M:{k:"M",n:"Record run week",head:"The machine is in great shape. Push it for a record week?",win:"Top speed +4% for 7 days, then Machinery −5 from the wear."}};
// special effects of particular choices ("id:index")
const CIVFX={"shaft:0":{ext:180},"fabric:0":{ext:120},"hdblow:0":{ext:60},"cscreen:0":{ext:60},"fscreen:0":{ext:60},"boiler:0":{ext:180},"chestover:0":{ext:60},
  "hdblow:2":{band:"stock"},"fscreen:2":{band:"stock"},"thkblow:2":{band:"stock"},"steamjoint:2":{band:"dry"},"nearmiss:2":{band:"dock"},
  "shaft:2":{retry:1/3},"fabric:2":{favor:30e3},"felt:2":{warranty:1},"cscreen:2":{slow:2},
  "rush:1":{grade:60},"runner:2":{posts:60},"reporter:1":{gamble:1},"energyspike:0":{hedge:1}};
const civCost=t=>CIV.cost[String(t)]||0;
const civTag=(id,i)=>{const t=CIVU[id]&&CIVU[id].t;return t?t[i]:null;};
const CIVTAGN={P:"Fix properly",Q:"Cheap fix",S:"Shortcut"};
const civHead=id=>CIVNEW[id]?CIVNEW[id].head:CIVMETER[id]?CIVMETER[id].head:CIVREWARD[id]?CIVREWARD[id].head:EV[id]?EV[id].head:"";
const civName=id=>CIVREWARD[id]?CIVREWARD[id].n:CIVU[id]?CIVU[id].n:id;
const civUntilOutage=()=>{const o=S.outg;if(!o)return 3*1440;const end=outStart(o.k)+OUT.len;return end>S.t&&end<=S.season.end?end-S.t:3*1440;};
function civFxAdd(id,f){const left=f.left==="outage"?civUntilOutage():f.left;const x={id,left,civ:1};if(f.mods)x.mods=f.mods;if(f.price)x.price=f.price;if(f.energy)x.energy=f.energy;
  if(f.grade)x.price={[C.grade]:f.grade};S.fx=S.fx.filter(q=>q.id!==id);S.fx.push(x);S.M=mods();applyUpgrades();return x;}
const civFxGet=id=>S.fx.find(f=>f.id===id);
function civFxEnd(id){S.fx=S.fx.filter(f=>f.id!==id);S.M=mods();applyUpgrades();}
function civBanner(text,good,tag){BANNERS.push({text,t:null,kind:good?"good":undefined,tag:tag||"CIVICS"});while(BANNERS.length>3)BANNERS.splice(1,1);log(text,good?"ok":"warn");}
function civTimer(t){S.civ.tm.push(t);}

/* ---- the tick: drift, cross-links, timers, meter triggers, the new upsets, the queue ---- */
function civTick(dt){if(!civOn())return;const V=S.civ;
  for(const k of CIVK){const m=V.m[k],d=(m>70?CIV.driftHi:m<30?CIV.driftLo:CIV.drift)/1440*dt;V.m[k]=m<50?Math.min(50,m+d):m>50?Math.max(50,m-d):m;}
  if(V.m.M<25)V.m.L=Math.max(0,V.m.L-0.3/1440*dt);   // (round 1: was under 35, 0.5/day)                    // fighting broken equipment wears the crew down
  if(V.m.C>65&&V.m.L<50)V.m.L=Math.min(50,V.m.L+0.5/1440*dt);           // a good town to hire from
  {const tx=civTax()+(V.taxDay||0);if(tx>0)deal(tx*dt/1440);}           // tax breaks
  if(V.prem>0)spend(V.prem*dt/60,"repairs");                            // the insurer's premium increase
  if(S.t-V.snapT>=360){V.snapT=S.t;V.prev=Object.assign({},V.snap);V.snap=Object.assign({},V.m);}
  if(S.t-V.auT>=60){V.auT=S.t;applyUpgrades();}
  // timers
  if(V.tm.length){const due=V.tm.filter(t=>(t.left-=dt)<=0);V.tm=V.tm.filter(t=>t.left>0);for(const t of due){try{civTimerRun(t);}catch(e){console.error("civics timer",t.act,e);}}}
  // meter triggers (not in the first day, not during an outage)
  if(S.t>1440&&!outOn())for(const k of CIVK){const m=V.m[k],A=V.arm;
    if(m>=CIV.warnRearm&&S.t>=(A.wc&&A.wc[k]||0))A.w[k]=1;else if(A.w[k]&&m<CIV.warn&&m>=CIV.crisis){A.w[k]=0;(A.wc||(A.wc={}))[k]=S.t+CIV.warnCool;civTimer({act:"meter",id:{E:"w_watch",L:"w_sickout",M:"w_vibration",C:"w_petition"}[k],left:60+civRng()*1380});}
    if(m>=CIV.crisis)A.c[k]=0;else if(S.t>=A.c[k]){A.c[k]=S.t+CIV.crisisEvery;civTimer({act:"meter",id:{E:"c_custwalk",L:"c_walkout",M:"c_shutdown",C:"c_protest"}[k],left:V.flags[k]?30:60+civRng()*1380});V.flags[k]=0;}
    if(m<CIV.rearm)A.r[k]=1;else if(A.r[k]&&m>CIV.reward){A.r[k]=0;civTimer({act:"meter",id:"r_"+k,left:60+civRng()*1380});}}
  // the new civic upsets: rolled once a sim hour on their own stream
  if(S.t>=V.newNext){V.newNext=S.t+60;if(!outOn()&&S.t>2*1440){const up=survOn()?Math.min(2,1+(survUp()-1)*0.5):1,pet=V.m&&S.fx.some(f=>f.id==="w_petition")?1.5:1;
    for(const id of Object.keys(CIVNEW)){const r=civRng();let p=60/(CIV.newMtbf*1440)*up*((V.odds[id])||1);
      const a=civArea(id);if(a==="Community")p*=civComm()*pet;if(a==="Crew")p*=civYard();
      if(r<p&&!civFxGet(id)&&!V.q.some(q=>q.id===id)&&!(V.cur&&V.cur.id===id))civQueue(id,"new");}}}
  // the standing-order toast commits after 2 sim hours if the page timer hasn't
  if(V.pending&&S.t-V.pending.t>=120)civCommit();
  if(V.q.length&&!V.cur&&!(S.cards&&S.cards.open)&&!outOn()&&!S.over&&!(S.season&&S.season.done))civNext();}
function civTimerRun(t){const V=S.civ;
  if(t.act==="meter"){civQueue(t.id,"meter");return;}
  if(t.act==="retrigger"){if(!active(t.id)){trigger(t.id);civBanner(`The used part didn't hold: ${EV[t.id].name.toLowerCase()} again.`,false);}return;}
  if(t.act==="favor"){deal(-t.v);civBanner(`The sister mill calls in its favor: ${money(t.v)}.`,false);return;}
  if(t.act==="promise"){if(V.cspend<t.t0)civAdd({C:-5},"Broken promise to the town");else log("The town saw your community spending: promise kept.","ok");return;}
  if(t.act==="recheck"){if(V.m.M<CIV.crisis)civQueue("c_shutdown","meter");else log("The insurer rechecked the mill and signed it off.","ok");return;}
  if(t.act==="after"){civAdd(t.d,civName(t.id));return;}
  if(t.act==="walkdry"){if(civFxGet("c_walkout"))civFxAdd("c_walkout2",{left:Math.max(10,civFxGet("c_walkout").left),mods:{pmDown:"walkout: no stock"}});return;}
  if(t.act==="contract"){const short=Math.max(0,t.target-(S.shipT-t.ship0));t.ship0=S.shipT;if(short>0){deal(-short*40);civBanner(`Contract week ${t.n}: ${f0(short)} t short, ${money(short*40)} penalty.`,false);}else civBanner(`Contract week ${t.n}: target met.`,true);
    if(t.n<2)civTimer(Object.assign({},t,{left:7*1440,n:t.n+1}));return;}
  if(t.act==="runend"){civAdd({M:-5},"Record run week over: wear");return;}}
function civQueue(id,kind){const V=S.civ;if(V.q.some(q=>q.id===id))return;V.q.push({id,kind,t:S.t});}
// the next decision: an upset that has already cleared is skipped (its choices no longer matter)
function civNext(){const V=S.civ;while(V.q.length){const d=V.q.shift();
  if(d.kind==="up"&&!active(d.id))continue;
  if(d.kind==="new"||d.kind==="meter"){const nf=CIVNEW[d.id]||CIVMETER[d.id];if(nf&&nf.fx){civFxAdd(d.id,nf.fx);if(d.id==="c_walkout")civTimer({act:"walkdry",left:360});}
    if(d.kind==="new")(S.evc||(S.evc={}))[d.id]=(S.evc[d.id]||0)+1;
    civBanner(civHead(d.id),false,d.id.startsWith("c_")?"CRISIS":d.id.startsWith("w_")?"WARNING":d.id.startsWith("r_")?"REWARD":"UPSET");}
  // a standing order may answer it
  if(d.kind!=="meter"&&civOrder(d))return;
  V.cur=d;civOpen();return;}}
// an EVENTS upset that has choices: queue it (04's trigger calls this)
function civOnUpset(inc){if(!civOn()||!inc||inc.left<=0||!CIVU[inc.id])return;
  if(inc.id==="permit"&&inc.bill)spend(inc.bill*(civFine()-1),"repairs");   // fines follow Community
  civQueue(inc.id,"up");if(!(S.cards&&S.cards.open)&&!S.civ.cur&&!outOn())civNext();}

/* ---- standing orders ---- */
// (round 1: an order also answers an upset of its area the player hasn't seen yet; the order was set on a card from that area)
function civOrder(d){const V=S.civ,a=civArea(d.id),o=V.orders[a];if(!o)return false;
  const t=CIVU[d.id].t||"",i=t.indexOf(o);if(i<0)return false;const c=CIVU[d.id].ch[i];if(!c||c[1]>=3)return false;
  V.pending={d,i,t:S.t};civToast(d,i);return true;}
let civToastEl=null;
function civToast(d,i){if(typeof document==="undefined")return;const c=CIVU[d.id].ch[i];
  if(!civToastEl){civToastEl=document.createElement("div");civToastEl.className="civtoast";civToastEl.id="civToast";civToastEl.hidden=true;document.body.appendChild(civToastEl);}
  const el=civToastEl;el.innerHTML=`<span><b>Standing order</b> · ${escHTML(CIVU[d.id].n)}: ${escHTML(c[0])}${c[1]>0?" ("+"$".repeat(c[1])+")":""}</span><button type="button" id="civ-chg">Change</button><i></i>`;
  el.hidden=false;el.querySelector("#civ-chg").addEventListener("click",()=>{const P=S.civ.pending;if(!P)return;S.civ.pending=null;el.hidden=true;S.civ.cur=P.d;civOpen();});
  clearTimeout(el._t);el._t=setTimeout(()=>civCommit(),5000);}
function civCommit(){const P=S.civ&&S.civ.pending;if(civToastEl){clearTimeout(civToastEl._t);civToastEl.hidden=true;}if(!P)return;S.civ.pending=null;civApply(P.d,P.i,true);}

/* ---- applying a choice ---- */
function civApply(d,i,auto){const V=S.civ,id=d.id;V.seen[id]=1;
  if(CIVREWARD[id]){civReward(id,i===0);return;}
  const u=CIVU[id],c=u&&u.ch[i];if(!c)return;const tag=civTag(id,i),cost=civCost(c[1]),fx=CIVFX[id+":"+i]||{},mt=CIVMETER[id],mc=mt?mt.ch[i]||{}:{};
  const dot=leadIs("dot")&&tag==="P"&&!!EV[id];   // Dot: proper fixes cost one tier less and skip the extra downtime
  let paid=dot?civCost(Math.max(0,c[1]-1)):cost;if(fx.hedge&&S.cards.pend.some(p=>p.h==="hedge#1"))paid=cost/2;   // the power hedge softens the energy spike
  if(id==="inspector"&&V.flags.blitz){V.flags.blitz=0;if(i===0)paid=Math.max(0,paid-civCost(1));civAdd({L:1},"The safety blitz paid off");}
  if(paid)deal(-paid);   // (a negative cost earns)
  if(c[2])V.odds[id]=Math.max(0.25,Math.min(3,(V.odds[id]||1)*CIV.odds[String(c[2])]));
  let civd=c[3];if(fx.gamble)civd=civRng()<0.5?{L:1,C:1}:{L:1,C:-2};
  const ct=civAdd(civd);
  const inc=S.inc.find(x=>x.id===id);
  // special effects
  if(fx.ext&&inc&&!dot){inc.left+=fx.ext;inc.total+=fx.ext;}
  if(fx.slow&&inc){inc.left*=fx.slow;inc.total*=fx.slow;}
  if(fx.band){if(inc)clearIncident(id);const m=fx.band==="stock"?{feedMul:0.85}:fx.band==="dry"?{speedCap:0.85}:{clampMul:0.85};civFxAdd("band_"+id,{left:"outage",mods:m});}
  if(fx.band&&CIVNEW[id])civFxEnd(id);
  if(fx.retry&&civRng()<fx.retry)civTimer({act:"retrigger",id,left:360+civRng()*720});
  if(fx.favor)civTimer({act:"favor",v:fx.favor,left:5*1440});
  if(fx.warranty){if(civRng()<0.5)log("The vendor gave in: a free felt.","ok");else civFxAdd("civwarranty",{left:2880,mods:{breakMul:1.3}});}
  if(fx.grade)civFxAdd("civgrade",{left:fx.grade,mods:{pmDown:"squeezed-in grade change"}});
  if(fx.posts)civFxAdd("civposts",{left:fx.posts,mods:{speedCap:0.9}});
  // the new upsets' base effect: a proper fix ends it, a cheap fix halves it, a shortcut leaves it
  if(CIVNEW[id]&&civFxGet(id)){if(tag==="P")civFxEnd(id);else if(tag==="Q")civFxGet(id).left/=2;}
  // meter upsets
  if(mt){const f=civFxGet(id);
    if(mc.end){civFxEnd(id);if(id==="c_walkout")civFxEnd("c_walkout2");}
    if(mc.left&&f)f.left=Math.min(f.left,mc.left);
    if(mc.down)civFxAdd("civbalance",{left:mc.down,mods:{pmDown:"balancing the rolls"}});
    if(mc.flag)V.flags[mc.flag]=1;
    if(mc.promise)civTimer({act:"promise",t0:S.t,left:7*1440});
    if(mc.pledge)V.pledgeDon=(V.pledgeDon||0)+10e3;
    if(mc.swap&&f){f.price={all:mc.swap};f.left=7*1440;}
    if(mc.after&&f)civTimer({act:"after",id,d:mc.after,left:f.left});
    if(mc.recheck)civTimer({act:"recheck",left:7*1440});
    if(mc.appeal){if(civRng()<0.5){civFxEnd(id);civBanner("Appeal upheld: no shutdown.",true);}else{V.prem+=500;civBanner("Appeal lost: 12 h down, and the premium goes up $500/h.",false);}}}
  if(V.m)applyUpgrades();S.M=mods();
  log(`${auto?"Standing order":"Decision"} · ${u.n}: ${c[0]}${paid>0?" ("+money(paid)+")":paid<0?" (+"+money(-paid)+")":""}${ct?" · "+ct:""}`,"warn");}
function civReward(id,yes){const V=S.civ,r=CIVREWARD[id];if(!yes){log(`Declined: ${r.n}`,"");return;}
  if(id==="r_L"){V.pledgeOut=true;V.pledgeN=(V.pledgeN||0)+1;if(V.pledgeN>1)civAdd({L:-3},"Crew pledge again");}
  if(id==="r_C"){deal(-60e3);V.taxDay=(V.taxDay||0)+3000;V.cspend=S.t;}
  if(id==="r_E"){civFxAdd("r_contract",{left:14*1440,price:{all:8}});const day=Math.max(1,S.t/1440),rate=(S.shipT||0)/day;civTimer({act:"contract",target:rate*7*0.9,ship0:S.shipT||0,n:1,left:7*1440});}
  if(id==="r_M"){V.runUntil=S.t+7*1440;civTimer({act:"runend",left:7*1440});applyUpgrades();}
  civBanner(`Accepted: ${r.n}. ${r.win}`,true,"REWARD");}

/* ---- the choice card ---- */
let civEl=null;
const civOdds=s=>s<=-2?"much rarer":s<0?"rarer":s>0?"more often":"";
const civChips=d=>CIVK.filter(k=>d&&d[k]).map(k=>`<span class="cvc ${d[k]>0?"up":"dn"}">${CIV.names[k]} ${d[k]>0?"+":"−"}${Math.abs(d[k])}</span>`).join("");
function civOpen(){const V=S.civ,d=V.cur;if(!d||typeof document==="undefined")return;running=false;S.cards.open={civ:true};
  if(!civEl){civEl=document.createElement("div");civEl.className="overlay";civEl.id="civOv";civEl.hidden=true;document.body.appendChild(civEl);}
  const id=d.id,rw=CIVREWARD[id],u=CIVU[id],mt=CIVMETER[id],area=civArea(id),ord=V.orders[area];
  const kind=rw?"Reward · "+CIV.names[rw.k]:mt?(id.startsWith("c_")?"Crisis · ":"Warning · ")+CIV.names[mt.k]:"Upset · "+area;
  const choices=rw?[["Accept",0,0,null,rw.win],["Decline",0,0,null,"Nothing changes."]]:u.ch;
  civEl.innerHTML=`<div class="modal deal civ" role="dialog" aria-modal="true" aria-labelledby="civ-h"><span class="dk">${escHTML(kind)} · sim paused</span>
    <h2 id="civ-h">${escHTML(civName(id))}</h2><p>${escHTML(civHead(id))}</p>
    <div class="civch">${choices.map((c,i)=>{const tag=!rw&&civTag(id,i);const cost=c[1]<0?'<span class="cvcost earn">earns '+money(-civCost(c[1]))+'</span>':c[1]>0?`<span class="cvcost">${money(civCost(c[1]))}</span>`:rw?"":'<span class="cvcost free">free</span>';
      return `<button type="button" class="civbtn" data-i="${i}"><span class="cvl">${"ABC"[i]}</span><span class="cvb"><b>${escHTML(c[0])}</b>${tag&&!mt?`<em class="cvtag">${CIVTAGN[tag]}</em>`:""}
        <span class="cvrow">${cost}${c[2]?`<span class="cvodds ${c[2]<0?"up":"dn"}">${civOdds(c[2])}</span>`:""}${civChips(c[3])}</span>${c[4]?`<small>${escHTML(c[4])}</small>`:""}</span></button>`;}).join("")}</div>
    ${!mt&&!rw?`<label class="civord"><input type="checkbox" id="civ-ord"${ord?" checked":""}> Always do this for ${escHTML(area)} upsets${ord?` <small>(now: ${CIVTAGN[ord]})</small>`:""}</label>`:""}</div>`;
  civEl.hidden=false;
  civEl.querySelectorAll(".civbtn").forEach(b=>b.addEventListener("click",()=>{const i=+b.dataset.i,box=civEl.querySelector("#civ-ord");
    if(box){if(box.checked){const t=civTag(id,i);if(t)V.orders[area]=t;}else delete V.orders[area];}
    civEl.hidden=true;V.cur=null;S.cards.open=null;civApply(d,i,false);
    const menu=document.getElementById("v2menu");running=!(menu&&!menu.hidden);
    if(V.q.length)civNext();}));
  const f=civEl.querySelector(".civbtn");if(f)f.focus({preventScroll:true});civEl.querySelector(".modal").scrollTop=0;AUDIO.sfx("cash",150);}

/* ---- event cards: civics on accept, win, lose and decline (05 calls these) ---- */
function civCardHTML(c){const x=CIVCARD[c.id];if(!civOn()||!x)return "";const p=[["Accept",x.a],["Win",x.w],["Lose",x.l],["Decline",x.d]].filter(q=>civTxt(q[1]));
  return p.length?`<div class="civcard"><span>Civics</span>${p.map(([k,d])=>`<em>${k}</em>${civChips(d)}`).join("")}</div>`:"";}
// w is the card's own first dice roll (05 peeks at it without drawing); win/lose effects wait for the card's outcome when it has one
function civCardAccept(c,w,pend0){const x=CIVCARD[c.id];if(!civOn()||!x)return;civCardBlitz(c,w);civAdd(x.a,c.title);const o=w?x.w:x.l;
  if(c.id==="audit"||c.id==="insfire"){const p=S.cards.pend.slice(pend0).find(q=>q.id===c.id);if(p){p.civ={w:x.w,l:x.l};return;}}
  const p=S.cards.pend.slice(pend0).filter(q=>q.id===c.id).pop();if(p&&civTxt(o)){p.civo=o;return;}
  civAdd(o,c.title+(w?" (won)":" (lost)"));}
function civCardBlitz(c,w){if(c.id==="safety"&&w&&S.civ)S.civ.flags.blitz=1;}   // the safety blitz prepares the next inspector visit
function civCardDecline(c){const x=CIVCARD[c.id];if(civOn()&&x)civAdd(x.d,"Declined "+c.title);}
// a card outcome that is decided later (05's cardTick): audit and the fire challenge decide by result, the others by the roll
function civCardDue(p){if(!civOn())return;if(p.civo){civAdd(p.civo,"Card outcome");return;}if(!p.civ)return;let won;
  if(p.id==="audit"){const m=S.q.made-p.d.m0;won=m>0&&1-(S.q.off-p.d.o0)/m>=0.99;}
  else{const e=S.evc||{};won=((e.dryerfire||0)+(e.balefire||0)-(p.d.f0||0))<=0;}
  civAdd(won?p.civ.w:p.civ.l,"Card outcome");}

/* ---- the outage dialog: steady levers (price setting, crew bonus, community donation) ---- */
function civPlanHTML(){if(!civOn())return "";const V=S.civ;
  const seg=(n,opts)=>`<div class="seg" data-c="${n}">${opts.map(([v,l],i)=>`<button type="button" data-v="${v}" aria-pressed="${i===1||(opts.length===2&&i===0)}">${l}</button>`).join("")}</div>`;
  return `<div class="civplan"><div class="ldq">Civics for the next cycle</div>
    <div class="crow"><div><b>Price setting</b><small>Economy ${V.m.E<50?"is low":"is fine"}: discounts win customers, a premium costs goodwill</small></div>${seg("price",[["-5","−$5/t"],["0","Hold"],["5","+$5/t"]])}</div>
    <div class="crow"><div><b>Crew bonus</b><small>Labor +2 when the outage ends</small></div>${seg("bonus",[["0","None"],["20000","$20k"]])}</div>
    <div class="crow"><div><b>Community donation</b><small>Community +2 when the outage ends${V.pledgeDon?" · pledge: "+money(V.pledgeDon)+" every cycle":""}</small></div>${seg("don",[["0","None"],["20000","$20k"]])}</div></div>`;}
function civPlanWire(host,plan){if(!host)return;plan.civ={price:0,bonus:0,don:0};
  host.querySelectorAll(".civplan .seg").forEach(sg=>sg.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{plan.civ[sg.dataset.c]=+b.dataset.v;sg.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));})));}
function civPlanCost(pc){return pc?(pc.bonus||0)+(pc.don||0):0;}
// at the outage: begin (Labor decides how long it runs), end (the levers take effect)
function civOutageBegin(o,st){if(!civOn())return;const V=S.civ;let d=civOver();if(V.pledgeOut){d=-60;V.pledgeOut=false;log("Crew pledge: the outage will finish an hour early.","ok");}
  o.civOver=d;if(d<0){o.end=st+OUT.len+d;const p=civFxGet("pout");if(p)p.left=OUT.len+d;}}
function civOutageEnd(o,pl){if(!civOn())return;const V=S.civ,pc=pl&&pl.civ;
  if(o.civOver>0){civFxAdd("civover",{left:o.civOver,mods:{pmDown:"outage overran (crew)"}});log(`The crew ran the outage ${o.civOver} min over.`,"warn");}
  if(pc){if(pc.price){civFxAdd("civprice",{left:OUT.every*1440,price:{all:pc.price}});civAdd({E:pc.price<0?2:-3},"Price setting");}   // (round 1: discount −$5/t, was −$10; the premium costs Economy −3)
    if(pc.bonus)civAdd({L:2},"Crew bonus");if(pc.don){civAdd({C:2},"Community donation");V.cspend=S.t;}}
  if(V.pledgeDon){deal(-V.pledgeDon);V.cspend=S.t;log(`Community pledge: ${money(V.pledgeDon)} donated.`,"");}}

/* ---- the bar: four meters under the wave chip ---- */
{const bar=document.createElement("div");bar.className="civbar";bar.id="civBar";bar.hidden=true;
  bar.innerHTML=CIVK.map(k=>`<div class="cv" data-k="${k}"><b>${CIV.names[k]}</b><span class="cvbar"><i></i></span><em></em><u></u></div>`).join("");
  document.body.appendChild(bar);
  UI_TICKS.push(()=>{const on=civOn();if(bar.hidden===on){bar.hidden=!on;document.body.classList.toggle("civ",on);}if(!on)return;
    for(const k of CIVK){const v=S.civ.m[k],b=civBand(v),el=bar.querySelector(`[data-k="${k}"]`),pv=(S.civ.prev||S.civ.snap)[k],tr=v-pv;
      el.className="cv "+b[2];el.querySelector("i").style.width=v.toFixed(0)+"%";const em=el.querySelector("em");if(em.textContent!==b[1])em.textContent=b[1];
      const ar=tr>0.5?"▲":tr<-0.5?"▼":"";const u=el.querySelector("u");if(u.textContent!==ar)u.textContent=ar;
      el.title=`${CIV.names[k]} ${v.toFixed(0)}/100 · ${b[1]}`;}});}
// a choice card or toast left open when the run ends (season over, bankrupt, zen, free play) goes away with it
UI_TICKS.push(()=>{if(civOn()||!S.civ)return;if(civEl&&!civEl.hidden){civEl.hidden=true;if(S.cards&&S.cards.open&&S.cards.open.civ)S.cards.open=null;}if(S.civ.cur)S.civ.cur=null;if(civToastEl&&!civToastEl.hidden){clearTimeout(civToastEl._t);civToastEl.hidden=true;S.civ.pending=null;}});
