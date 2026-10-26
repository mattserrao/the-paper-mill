/* ---- v6.5 b3 DCS motors and reject purges (the DCS expansion, claude/dcs-expansion-spec.md) ----
   Motors: On / Off / Auto from the DCS. On and Auto both run (On is the operator's hand, Auto the mill's logic); Off
   stops that step the way its upset does (a motor upset, m_*, with the same mods), and the operators start it again
   after MOT_RESTART sim-minutes (the upset's countdown); starting it sooner from the DCS clears it at once. Free in every
   mode except zen, like the fiddly knobs: the cost is the lost production.
   Purges (HD cleaner, LC and lightweight cleaner reject flush): Auto keeps the pressure drop at its normal level; in
   Manual it climbs until someone purges, and past PURGE.trip the cleaner plugs (its own upset, with its bill). The crew
   puts it back in Auto when they clear it. No dice: the run replays identically. */
const MOT_RESTART=30;
const MOTORS=[
  {id:"conv",a:"SPOT",name:"Bale conveyor",ev:"m_conv",like:"rotortrip",pin:"rotortrip",mods:{feedMul:0},head:"The bale conveyor is stopped: no bales to the pulper."},
  {id:"ragger",a:"SPOT",name:"Ragger",ev:"m_ragger",like:"ragger",mods:{pulperDown:1},head:"The ragger is stopped: the pulper is shut down until it runs."},
  {id:"junk",a:"SPOT",name:"Junk trap",ev:"m_junk",like:"badocc",pin:"ragger",mods:{yieldMul:0.8,breakMul:2},head:"The junk trap is stopped: junk is reaching the screens."},
  {id:"cscr",a:"SPOT",name:"Coarse screen rotor",ev:"m_cscr",like:"cscreen",mods:{pulperDown:1},head:"The coarse screen rotor is stopped: stock prep is down."},
  {id:"fscr",a:"SPOT",name:"Fine screen rotor",ev:"m_fscr",like:"fscreen",mods:{pulperDown:1},head:"The fine screen rotor is stopped: stock prep is down."},
  {id:"dye",a:"SPOT",name:"Dye pump",ev:"m_dye",like:"dye",mods:{offSpec:1},head:"The dye pump is stopped: the shade is off and paper goes to the beater."},
  {id:"fog",a:"WET",name:"Fog fan",ev:"m_fog",like:"fogfan",mods:{},head:"The fog fan is stopped: fog is building in the machine room."}];
const MOTN=Object.fromEntries(MOTORS.map(m=>[m.id,m])),MOTEV=Object.fromEntries(MOTORS.map(m=>[m.ev,m]));
// where each stopped motor's tag shows in 3D: its upset's spot (31-3d-upset-fx.js); the fog fan also shows the fog
const MOT_PIN=Object.fromEntries(MOTORS.map(m=>[m.ev,m.pin||m.like])),MOT_FXDEF={m_fog:"fogfan"};
// v6.13.2 Real Numbers: ΔP in psi at the cleaners' design levels (they were 35/60/45 kPa, about a third of real); the climb in
// manual and the plug points scale with them, so a cleaner left in manual still plugs after the same ~400 min
const PURGE_OLD={hd:{b:35,t:95},lc:{b:60,t:120},lw:{b:45,t:105}};
const PURGE={base:{hd:15,lc:25,lw:20},rise:0.0625,trip:{hd:40,lc:50,lw:45},add:{hd:17,lc:21,lw:20},up:{hd:"hdblow",lc:"lcplug",lw:"lwplug"},
  name:{hd:"HD cleaner reject purge",lc:"LC cleaner reject flush",lw:"Lightweight cleaner reject flush"}};
// the motor upsets join EVENTS (03/04 load order: this file runs after 04-upsets.js, so they are added here). Never rolled
// at random: their own dice stream ("motor") and an endless MTBF, so every other upset keeps its timing; knob:true keeps
// them out of the Upsets panel, the tornado and the crew queue.
MOTORS.forEach(m=>{const e={id:m.ev,g:m.a==="SPOT"?"stock":"machine",knob:true,stream:"motor",name:m.name+" stopped",head:m.head,dur:[MOT_RESTART,MOT_RESTART],mtbf:1e12,mods:m.mods,
  end:()=>{const D=S.dcs;if(D&&D.mot[m.id]==="off"){D.mot[m.id]="auto";log(`Operators started the ${m.name.toLowerCase()} again`,"ok");}}};
  EVENTS.push(e);EV[e.id]=e;CH.en[e.id]=true;});
function dcsState(){if(!S.dcs){S.dcs={mot:{},pg:{}};MOTORS.forEach(m=>S.dcs.mot[m.id]="auto");["hd","lc","lw"].forEach(k=>S.dcs.pg[k]={m:"auto",dp:PURGE.base[k]});}
  if(S.rng&&S.rng.motor==null)S.rng.motor=(S.seed^0x4cf5ad43)|0;return S.dcs;}
const motState=id=>(S.dcs&&S.dcs.mot[id])||"auto";
// running, stopped by the operator, or tripped (its own upset is on)
function motStatus(id){const m=MOTN[id];if(motState(id)==="off")return "off";if(active(m.like)&&m.like!=="rotortrip")return "trip";return "run";}
function motSet(id,v){if(S.zen)return;const D=dcsState(),m=MOTN[id],was=D.mot[id];if(was===v)return;D.mot[id]=v;
  if(v==="off"){if(!active(m.ev)){S.inc.push({id:m.ev,left:MOT_RESTART,total:MOT_RESTART,real:performance.now(),note:"stopped from the DCS",motor:1});S.lastInc=S.t;}
    log(`${m.name} stopped from the DCS. The operators will start it again in ${MOT_RESTART} min.`,"warn");}
  else if(was==="off"){const i=S.inc.find(x=>x.id===m.ev);if(i)i.left=0;log(`${m.name} started from the DCS`,"ok");}
  S.M=mods();}
function purgeSet(k,mode){if(S.zen)return;const p=dcsState().pg[k];p.m=mode;}
function purgeNow(k){if(S.zen)return;const p=dcsState().pg[k];p.dp=PURGE.base[k];log(`${PURGE.name[k]}: purged by hand`,"ok");}
// every step (07-sim-step.js): cheap, and nothing at all until the DCS has been touched
function dcsTick(dt){const D=S.dcs;if(!D||S.zen)return;
  for(const k in D.pg){const p=D.pg[k],up=PURGE.up[k];
    if(active(up)){p.m="auto";p.dp=PURGE.base[k];continue;}   // the crew clears it and puts it back in Auto
    if(p.m==="auto"){p.dp+=(PURGE.base[k]*weDirt()-p.dp)*Math.min(1,dt/30);continue;}   // (v6.8: dirty bales run it higher between purges, 07g)
    if(!S.M.pulperDown)p.dp+=PURGE.rise*dt*weDirt();
    if(p.dp>=PURGE.trip[k]){p.dp=PURGE.base[k];log(`${PURGE.name[k]} was left in manual: the rejects plugged`,"bad");trigger(up);}}}
const purgeDp=k=>{const p=S.dcs&&S.dcs.pg&&S.dcs.pg[k];if(p)return p.dp;return PURGE.base[k]*weDirt();};
const purgeMode=k=>(S.dcs&&S.dcs.pg&&S.dcs.pg[k]&&S.dcs.pg[k].m)||"auto";
