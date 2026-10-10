const EVENTS=[
 {id:"refclash",g:"stock",name:"Refiner plates clash",head:"Refiner plates clashed! Maintenance called to the refiners.",dur:[180,300],mtbf:420,mods:{speedCap:0.75},fx:"refclash",
   // one set clashing slows the machine; both sets clashing takes it down until maintenance has re-plated them
   start:inc=>{inc.both=rand("upx")<0.3;if(inc.both){inc.mods={pmDown:"both refiners clashed"};inc.left=inc.total=inc.left*1.8;inc.note="both refiners: machine down";}else{inc.mods={speedCap:0.75};inc.billMul=0.5;inc.note="one refiner out: machine slowed";}}},
 {id:"shaft",g:"machine",name:"Driveshaft snaps",head:"Dryer driveshaft snaps. Millwrights called in.",dur:[240,480],mtbf:160,mods:{pmDown:"driveshaft"},fx:"shaft"},
 {id:"dryerfire",g:"machine",name:"Fire in the dryers",head:"Fire in the dryer hood! Deluge on, sheet off.",dur:[180,360],mtbf:260,mods:{pmDown:"dryer fire"},fx:"dryerfire"},
 {id:"fabric",g:"machine",name:"Fabric runs off",head:"Forming fabric tracked off the rolls and folded up.",dur:[150,300],mtbf:180,mods:{pmDown:"fabric change"},fx:"fabric"},
 {id:"felt",g:"machine",name:"Press felt blows",head:"Press felt blown. Crew pulling a new felt.",dur:[90,180],mtbf:140,mods:{pmDown:"felt change"},fx:"felt"},
 {id:"slime",g:"machine",name:"Scabs",head:"Scabs in the sheet! Speed cut to 70% and the winder is hayout city.",dur:[300,600],mtbf:150,mods:{speedCap:0.7,breakMul:3,hayMul:20},fx:"slime"},
 {id:"ragger",g:"stock",name:"Ragger tail break",head:"The ragger tail broke off at the wheel. Pulper stopped until an operator restarts the tail with fresh ragger rope.",dur:[90,180],mtbf:140,mods:{pulperDown:1},fx:"ragger"},
 {id:"overflow",g:"stock",name:"Pulper overflows",head:"Pulper overflows and floods the bale yard!",dur:[240,360],mtbf:220,mods:{pulperDown:1,recvMul:0.5},fx:"flood",
   start:i=>{const l=S.yard*0.15;S.yard-=l;i.note=`${Math.round(l)} t of bales soaked`;}},
 {id:"winderdown",g:"machine",name:"Winder breakdown",head:"Winder down: a slitter drive failed. Reels are stacking up at the dry end.",dur:[90,180],mtbf:200,mods:{winderDown:1},fx:"winderdown"},
 {id:"wrap",g:"machine",name:"Dryer can wrap",head:"The sheet wrapped a dryer can! Machine down while the crew spears it free.",dur:[60,120],mtbf:200,mods:{pmDown:"dryer wrap"},fx:"wrap",start:i=>{i.can=2+Math.floor(Math.random()*7);}},
 {id:"dye",g:"stock",name:"Dye trouble",head:"Dye pump hiccup! The sheet is coming out in every color. It's all beater until it's sorted.",dur:[60,120],mtbf:260,mods:{offSpec:1},fx:"dye"},
 {id:"flares",g:"stock",name:"Flares in a bale",head:"Road flares hidden in an OCC bale go off in the pulper! Quite the show, no harm done.",dur:[20,40],mtbf:300,mods:{},fx:"flares"},
 {id:"hdblow",g:"stock",name:"HD cleaner blowout",head:"The HD cleaner blew out! Stock is everywhere. Pulping stopped, and the chest is draining.",dur:[150,270],mtbf:300,mods:{pulperDown:1},fx:"hdblow"},
 {id:"lwplug",g:"stock",name:"Lightweight cleaners plugged",head:"Plastic and wax plugged the lightweight cleaners. Stock prep is stopped; the chest is draining.",dur:[90,180],mtbf:320,mods:{pulperDown:1},fx:"lwplug"},
 {id:"cscreen",g:"stock",name:"Coarse screen down",head:"The coarse screen rotor seized. Stock prep is stopped; the chest is draining.",dur:[120,240],mtbf:300,mods:{pulperDown:1},fx:"cscreen"},
 {id:"fscreen",g:"stock",name:"Fine screen basket failure",head:"A fine screen basket cracked. Stock prep is stopped until it's replaced.",dur:[150,270],mtbf:320,mods:{pulperDown:1},fx:"fscreen"},
 {id:"lcplug",g:"stock",name:"LC cleaners plugged",head:"Sand plugged the LC cleaner rejects. Stock prep is stopped; the chest is draining.",dur:[90,180],mtbf:300,mods:{pulperDown:1},fx:"lcplug"},
 {id:"fogfan",g:"machine",name:"Fog fan down",head:"The fog remediation fan tripped! The machine keeps running, but the machine room is filling with wet-end fog.",dur:[150,300],mtbf:300,mods:{},fx:"fogfan"},
 {id:"thkblow",g:"stock",name:"Thickener blowout",head:"The disk thickener blew out! Stock is spraying all over stock prep. Nothing reaches the chest until it's fixed.",dur:[120,240],mtbf:280,mods:{pulperDown:1},fx:"thkblow"},
 {id:"birdhay",g:"machine",name:"Bird in the winder",head:"A pigeon flew straight into the winder!",dur:[15,25],mtbf:420,mods:{},fx:"birdhay",end:()=>{if(S.wd!=="hayout")hayout();}},
 {id:"steamjoint",g:"machine",name:"Steam joint leak",head:"A dryer steam joint blew out on the drive side! Sheet off back to the wet end until maintenance repacks it.",dur:[150,270],mtbf:320,mods:{pmDown:"steam joint leak"},fx:"steamjoint"},
 {id:"boiler",g:"machine",name:"Boiler trip",head:"The boiler tripped! No steam for the dryers. Machine down.",dur:[90,180],mtbf:260,mods:{pmDown:"no steam"},fx:"boiler"},
 {id:"permit",g:"stock",name:"Wastewater permit exceeded",head:"Effluent over the permit limit! The state fines the mill and stock prep throttles back.",dur:[180,300],mtbf:380,mods:{feedMul:0.7},fx:"permit"},
 {id:"runner",g:"machine",name:"Runner in the hall",head:"A town resident is sprinting through the machine hall! The crew gives chase.",dur:[40,60],mtbf:420,mods:{},fx:"runner"},
 {id:"chestover",g:"stock",name:"Stock chest overflows",head:"Stock chest overflows! A brown river runs across the floor.",dur:[120,240],mtbf:260,mods:{pulperDown:1},fx:"chestover",
   start:i=>{const l=Math.min(S.tank,P.tankCap*0.12);S.tank-=l;i.note=`${Math.round(l)} t of stock on the floor`;}},
 {id:"badocc",g:"stock",name:"Junk OCC delivered",head:"Junk OCC: wax, plastic and wet bales. Yield and runnability drop.",dur:[600,900],mtbf:160,mods:{yieldMul:0.8,breakMul:2},fx:"badocc"},
 {id:"balefire",g:"stock",name:"Bale yard fire",head:"Bale yard fire! Receiving evacuated.",dur:[180,300],mtbf:320,mods:{recvMul:0},fx:"balefire",
   start:i=>{const l=S.yard*0.3;S.yard-=l;i.note=`${Math.round(l)} t of OCC burned`;}},
 {id:"fleet",g:"yard",name:"Forklifts red-tagged",head:"Half the forklift fleet fails inspection. Short trucks for the 12 h shift.",dur:[720,720],mtbf:200,fx:"fleet",
   start:i=>{i.drvCap=Math.max(1,Math.floor(C.drivers.v/2));i.ldrCap=Math.max(1,Math.floor(C.loaders.v/2));i.note=`${i.drvCap} forklifts, ${i.ldrCap} clamp trucks working`;}},
 {id:"calloff",g:"yard",name:"Drivers call off",head:"Drivers call off. The shift runs short.",dur:[720,720],mtbf:150,fx:"calloff",
   start:i=>{const n=1+Math.floor(rand("upx")*3);i.drvCap=Math.max(0,Math.round(C.drivers.v)-n);i.ldrCap=Math.max(1,Math.round(C.loaders.v)-1);i.note=`${n} drivers and 1 loader out`;}},
 {id:"fight",g:"yard",name:"Brawl at the dock",head:"Two truck drivers brawl over a dock door. Police close receiving.",dur:[120,240],mtbf:240,mods:{docksClosed:1},fx:"fight"},
 {id:"roof",g:"yard",name:"Warehouse roof leak",head:"Roof leak over the roll warehouse. Wet rolls culled.",dur:[240,480],mtbf:260,mods:{clampMul:0.6},fx:"roof",
   start:i=>{const l=Math.round(S.fg*0.08);S.fg-=l;i.note=`${l} rolls scrapped`;}},
 {id:"highway",g:"yard",name:"Highway closed",head:"Jack-knifed tanker closes the highway. No trucks in or out.",dur:[360,600],mtbf:300,mods:{noIn:1,noOut:1},fx:"highway"},
 {id:"lightning",g:"god",name:"Lightning strike",head:"Lightning hits the substation. Mill-wide blackout!",dur:[60,180],mtbf:400,mods:{pmDown:"power outage",pulperDown:1,recvMul:0,clampMul:0},fx:"outage"},
 {id:"tornado",g:"god",name:"Tornado",head:"Tornado touches down on the mill site!",dur:[60,120],mtbf:600,fx:"tornado",
   start:i=>{const pool=EVENTS.filter(e=>e.g!=="god"&&!active(e.id));for(let k=0;k<2&&pool.length;k++){const e=pool.splice(Math.floor(rand("upx")*pool.length),1)[0];trigger(e.id,true);}
     const l=Math.round(S.fg*0.05);S.fg-=l;i.note=`${l} rolls blown away`;}},
 {id:"beaver",g:"god",name:"Giant beaver",head:"A giant beaver crawls out of the river and starts eating the bale yard!",dur:[120,240],mtbf:700,mods:{yardEat:120,recvMul:0.3},fx:"beaver"},
];
const EV=Object.fromEntries(EVENTS.map(e=>[e.id,e]));
EVENTS.forEach(e=>CH.en[e.id]=true);
const WXN={clear:"Clear",rain:"Rain",fog:"Fog",snow:"Snow"};
function active(id){return S.inc.some(i=>i.id===id);}
// machine and winder upsets go to the crew one at a time, in the order they happen; nothing gets fixed until a crew is there
const QINC=id=>!!(EV[id]&&((EV[id].g==="machine"&&id!=="runner"&&id!=="birdhay"&&id!=="boiler"&&id!=="fogfan"&&id!=="steamjoint")||id==="ragger"));
const RESP={ragger:6,wrap:4,hay:4,brk:2,dryerfire:3,shaft:8,fabric:6,felt:6,slime:5,winderdown:6};
function enqueue(k){if(!S.crewQ)S.crewQ=[];if(S.crewQ.some(q=>q.k===k))return;S.crewQ.push({k,resp:RESP[k]||6,since:0,here:false,go:false});}
function crewTick(dt){if(!S.crewQ)S.crewQ=[];
  S.crewQ=S.crewQ.filter(q=>q.k==="hay"?S.wd==="hayout":q.k==="brk"?S.pm==="break":active(q.k));
  // v3.2.2: the paper machine comes first. Winder jobs (hayouts, winder down) wait behind any machine job, including the rethread,
  // and if a machine job turns up while the crew is at the winder they leave it and come back to the winder afterwards
  {const WIND=k=>k==="hay"||k==="winderdown",prev=S.crewQ[0];S.crewQ.sort((a,b)=>(WIND(a.k)?1:0)-(WIND(b.k)?1:0));
   if(prev&&S.crewQ[0]!==prev&&WIND(prev.k)){prev.go=false;prev.here=false;prev.since=0;}}
  const h=S.crewQ[0];if(!h)return;const now=performance.now();if(!h.since)h.since=now;
  if(h.resp>0)h.resp-=dt;
  // in the 3D view the job starts when the crew actually gets there (with a safety timeout)
  if(!(G3.on&&G3.ok)||TURBO_FAST(C.simSpeed)||now-h.since>(h.k==="ragger"?25000:6000))h.here=true;
  if(h.resp<=0&&h.here)h.go=true;}
// maintenance: techs work in pairs, oldest job first; a job's repair clock only runs once its pair is on site
const MJOBS=["refclash","steamjoint","fogfan","shaft","fabric","felt","winderdown","hdblow","lwplug","cscreen","fscreen","lcplug","boiler","thkblow","overflow","chestover","fleet","roof","lightning"];
const MNEED=id=>MJOBS.includes(id);
function maintTick(dt){const crews=Math.max(1,Math.floor(P.techs/2)),list=S.inc.filter(i=>MNEED(i.id)),now=performance.now();
  list.forEach((i,k)=>{i.mSlot=k<crews?k:-1;i.mQ=k-crews+1;if(i.mSlot<0)return;if(!i.mSince){i.mSince=now;i.mResp=8;}
    if(i.mResp>0)i.mResp-=dt;if(!(G3.on&&G3.ok)||TURBO_FAST(C.simSpeed)||now-i.mSince>9000)i.mHere=true;if(i.mResp<=0&&i.mHere)i.mGo=true;});}
function maintState(i){if(!MNEED(i.id))return "";if(i.mGo)return "maintenance working";if(i.mSlot>=0)return "maintenance on the way";return `waiting for maintenance (${i.mQ} ahead)`;}
function incState(i){const a=QINC(i.id)&&!working(i.id)?crewState(i.id):"",b=MNEED(i.id)&&!i.mGo?maintState(i):"";return [a,b].filter(Boolean).join(" · ");}
function working(k){const h=S.crewQ&&S.crewQ[0];return !!(h&&h.k===k&&h.go);}
function crewState(k){const q=S.crewQ||[],i=q.findIndex(x=>x.k===k);if(i<0)return "";if(i>0)return `waiting for crew (${i} ahead)`;return q[0].go?"crew working":"crew on the way";}
function baseMods(){return {pmDown:null,pulperDown:false,speedCap:1,breakMul:1,yieldMul:1,recvMul:1,clampMul:1,drvCap:99,ldrCap:99,docksClosed:false,noIn:false,noOut:false,yardEat:0,hayMul:1,crewAtPM:false,winderDown:false,offSpec:false,feedMul:1};}
function mods(){const m=baseMods();
  for(const i of S.inc){const e=i.mods||EV[i.id].mods||{};
    if(e.pmDown)m.pmDown=e.pmDown; if(e.winderDown)m.winderDown=true; if(e.offSpec)m.offSpec=true; if(e.feedMul)m.feedMul*=e.feedMul; if(e.pulperDown)m.pulperDown=true; if(e.docksClosed)m.docksClosed=true; if(e.noIn)m.noIn=true; if(e.noOut)m.noOut=true;
    if(e.hayMul)m.hayMul*=e.hayMul; if(e.speedCap)m.speedCap=Math.min(m.speedCap,e.speedCap); if(e.breakMul)m.breakMul*=e.breakMul; if(e.yieldMul)m.yieldMul*=(i.id==="badocc"&&LV("detrash"))?0.9:e.yieldMul;
    if(e.recvMul!==undefined)m.recvMul*=e.recvMul; if(e.clampMul!==undefined)m.clampMul*=e.clampMul; if(e.yardEat)m.yardEat+=e.yardEat;
    if(i.drvCap!==undefined)m.drvCap=Math.min(m.drvCap,i.drvCap); if(i.ldrCap!==undefined)m.ldrCap=Math.min(m.ldrCap,i.ldrCap);}
  for(const f of (S.fx||[])){const e=f.mods||{};if(e.pmDown)m.pmDown=e.pmDown;if(e.speedCap)m.speedCap=Math.min(m.speedCap,e.speedCap);if(e.breakMul)m.breakMul*=e.breakMul;if(e.winderDown)m.winderDown=true;if(e.recvMul!==undefined)m.recvMul*=e.recvMul;if(e.pulperDown)m.pulperDown=true;if(e.docksClosed)m.docksClosed=true;if(e.noOut)m.noOut=true;if(e.noIn)m.noIn=true;if(e.yieldMul)m.yieldMul*=e.yieldMul;}
  if(S.wx==="rain")m.yieldMul*=0.97;
  if(S.pm==="break"&&S.brkType!=="reel"&&working("brk")){m.recvMul=0;m.clampMul=0;m.crewAtPM=true;}
  return m;}
// any stop that takes the sheet off the reel (boiler trip, felt or fabric change, no stock...) must be followed by a full
// rethread once the cause is fixed: the machine goes into a press-section break and the crew threads it back to the reel
// v3.3.3: a small notice naming where the sheet broke: at the reel = dryers, before the dryers = presses, before the presses = wet end
function brkNote(){const w={reel:"Dryers",dryer:"Presses",press:"Wet end"}[S.brkType]||"Dryers";BANNERS.push({text:`Sheet break - ${w}`,t:null,tag:"BREAK"});while(BANNERS.length>3)BANNERS.splice(1,1);}
function rethread(why){S.pm="break";S.brkType="press";S.breakLeft=2*(26+rand("brkx")*20);S.breakTotal=S.breakLeft;enqueue("brk");log(`Rethreading the machine ${why}`,"warn");}
function log(text,cls){S.feed.unshift({t:S.t,text,cls});if(S.feed.length>40)S.feed.pop();}
function trigger(id,quiet){
  if(active(id))return;
  const e=EV[id],dur=(e.dur[0]+rand("upx")*(e.dur[1]-e.dur[0]))*durMul(id);
  const inc={id,left:dur,total:dur,real:performance.now(),note:""};
  S.inc.push(inc);(S.evc||(S.evc={}))[id]=(S.evc[id]||0)+1;if(QINC(id))enqueue(id);S.lastInc=S.t;S.tot.incidents++;AUDIO.event(id);
  if(!quiet){BANNERS.push({text:e.head,t:null,id:e.id});while(BANNERS.length>3)BANNERS.splice(1,1);}
  if(e.start)e.start(inc);
  const bill=S.zen?0:(REPAIR[id]||0)*P.repairMul*(inc.billMul||1); if(bill>0){spend(bill,"repairs");inc.note=(inc.note?inc.note+" · ":"")+`repair bill ${money(bill)}`;}
  log(e.head+(inc.note?` (${inc.note})`:""),"bad");
  S.M=mods();
}
function clearIncident(id){const i=S.inc.find(x=>x.id===id);if(i)i.left=0;}
function chaosTick(dt){
  crewTick(dt);
  maintTick(dt);
  for(const i of S.inc){if(QINC(i.id)&&!working(i.id))continue;if(MNEED(i.id)&&!i.mGo)continue;if(QINC(i.id)||MNEED(i.id))i.go=true;i.left-=dt*((QINC(i.id)||MNEED(i.id))?repRate():1);}
  for(const i of S.inc)if(i.left<=0&&EV[i.id].end)EV[i.id].end(i);
  for(const i of S.inc)if(i.left<=0)log(`${EV[i.id].name}: cleared, back to normal`,"ok");
  S.inc=S.inc.filter(i=>i.left>0);
  // v3.3.3: two upsets already running make a third 75% less likely; back to normal once they clear
  const um=upsetMul()*(S.inc.filter(i=>i.id!=="runner"&&i.id!=="birdhay").length>=2?0.25:1);
  {const r=rand("up");if(CH.on&&um>0&&CH.en.chestover&&!active("chestover")&&S.tank>=P.tankCap*0.995&&r<dt/60/25)trigger("chestover");}
  const roll=CH.on&&um>0&&!outOn();
  for(const e of EVENTS){const r=rand("up");if(roll&&CH.en[e.id]&&!active(e.id)&&r<dt/60/e.mtbf*CH.lvl*freqMul(e.id)*0.75*um)trigger(e.id);}
  if(S.season&&S.season.on&&!S.season.rough&&S.t>=14*1440){S.season.rough=true;roughPatch();}
}

