/* ---- v6.5.3 quality specs: every grade has a basis weight, moisture and shade spec; paper made outside it is beater ----
   QSPEC below is the spec sheet. Each sim step qualTick() measures the reel the way the QCS scanner would (basis weight
   from the grade and the machine chest's consistency swings, 07b; moisture from the dryers, 07d; shade from the dye
   system) and checks it. While any of the three is out, everything the machine makes goes onto the reel as beater
   (07-sim-step.js), the winder cuts it into beater rolls, and they go round the beater process: staged in the warehouse
   bay, trucked back to receiving and repulped into the stock chest (the fiber comes back; the energy, time and winder
   capacity don't). A grade change's transition tons count as a weight violation the same way. The other fiddly-knob
   defects (CD streaks, crush marks, felt stripes, wrinkles) still send their share to the beater on top (07b knobOff). */
const QSPEC={   // basis weight lb/1000 ft² (target ±3%), reel moisture % (8 ±2), shade
  "23m": {bw:[23.81,25.29],m:[6.0,10.0],shade:"mill shade"},
  "26m": {bw:[25.28,26.84],m:[6.0,10.0],shade:"mill shade"},
  "30m": {bw:[29.15,30.95],m:[6.0,10.0],shade:"mill shade"},
  "33HT":{bw:[32.09,34.07],m:[6.0,10.0],shade:"mill shade"}};
const QWHY={bw:"weight",m:"moisture",shade:"color",chg:"weight (grade change)"};
// the latest check (derived each step, not saved): measured values, what's out, the share of production going to the beater
const QNOW={bw:0,m:8,shade:true,out:[],why:"",off:0};
// what the scanner reads now (no dice: the swings are smooth functions of time, like the DCS readings)
function qualMeasure(){const g=C.grade,G=GRADES[g]||GRADES["23m"],K=S.knob,t=S.t;
  const wob=(f,k)=>Math.sin(t*f+k)*0.6+Math.sin(t*f*2.7+k*2)*0.4,sw=K&&K.any&&K.x?K.x.sw:0;
  const bw=G.bw*(1+sw*0.08*wob(0.21,3))+wob(0.11,5)*0.12;
  const m=S.dry?S.dry.m:DRY.m0;
  // shade: the dye system is in trouble (an upset, or the dye pump stopped from the DCS)
  const shade=!(active("dye")||active("m_dye")||motState("dye")==="off");
  return {bw,m,shade};}
function qualTick(){const Q=QNOW,sp=QSPEC[C.grade]||QSPEC["23m"];if(Q.S!==S){Q.S=S;Q.out=[];Q.why="";Q.logT=Q.endT=null;}
  const r=qualMeasure();Q.bw=r.bw;Q.m=r.m;Q.shade=r.shade;
  if(S.pm!=="run"||S.zen){Q.off=0;return Q;}   // (no sheet, nothing to judge: the last verdict stands until it runs again)
  const out=[];if(r.bw<sp.bw[0]||r.bw>sp.bw[1])out.push("bw");
  // (any other off-spec spell, like civics' "moisture drifting", is a moisture violation whatever the dryers say)
  if(r.m<sp.m[0]||r.m>sp.m[1]||(S.M&&S.M.offSpec&&r.shade))out.push("m");
  if(!r.shade)out.push("shade");
  const was=Q.out.length>0,why=out.map(k=>QWHY[k]).join(", ");Q.out=out;Q.why=why;Q.off=out.length?1:0;
  // the log notes each spell once (a swinging weight dips in and out; it's noted again after a quiet half hour)
  if(out.length){if(!was&&!(S.t-(Q.logT??-1e9)<30))qualAlert(`${why} out of spec on ${C.grade}`);Q.logT=S.t;}
  else if(was)Q.endT=S.t;
  if(!out.length&&Q.endT!=null&&S.t-Q.endT>=30&&Q.logT!=null&&Q.logT<Q.endT){log(`QCS: ${C.grade} back in spec (weight, moisture, color).`,"ok");Q.endT=null;Q.logT=null;}
  return Q;}
// v6.5.4: the alert when the reel starts going to the beater: a banner over the mill, the log, and the DCS (WET under
// the headbox dilution zones, and every screen's alarm list)
function qualAlert(what){log(`QCS: ${what}. The reel is going to the beater.`,"warn");
  BANNERS.push({text:`Making beater: ${what}. The rolls are going back to the pulper.`,t:null,tag:"BEATER"});while(BANNERS.length>3)BANNERS.splice(1,1);}
// the reel's status for the QCS screen: the spec check first, then the grade change, then the other knob defects
function qualStatus(){const K=S.knob,ko=K&&K.any?K.off:0;
  if(QNOW.out.length)return {off:1,why:QNOW.why};
  if(S.chg)return {off:1,why:QWHY.chg};
  if(ko>0.005)return {off:ko,why:KOFFN[K.offWhy]||"off spec"};
  return {off:0,why:""};}
// ---- the beater process: beater rolls wait in the warehouse bay (S.q.bank, tons) and are repulped into the stock chest ----
// The broke pulper takes about two rolls an hour while the chest has room; the fiber goes straight to stock (no rejects:
// it's clean paper). A broker can buy what's waiting in the bay instead (05-event-cards.js "seconds").
const QBEAT={rate:25};   // t/h repulped
function beaterTick(dt){const b=S.q.bank||0;if(b<=1e-6)return;const room=P.tankCap*0.98-S.tank;if(room<=0)return;
  const t=Math.min(b,QBEAT.rate*dt/60,room);S.q.bank=b-t;S.tank+=t;S.tot.repulped=(S.tot.repulped||0)+t;}
