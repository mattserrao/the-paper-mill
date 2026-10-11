/* ---- generative music and sound effects (Web Audio, no files) ---- */
const AUDIO=(()=>{
  const AMOB=matchMedia("(pointer: coarse)").matches,LOOK=AMOB?0.5:0.3;let AUDIO_VIS=0,ctx=null,master,comp,musicBus,sfxBus,chillG,intG,crackleG,mcG,verb,noiseBuf,timer=null,on=false,vol=0.7,target="chill",calmSince=0,switchedAt=0,warm,envG,echoIn,echoInt;
  const mtof=m=>440*Math.pow(2,(m-69)/12),last={};
  function nz(t,dur,bus,v,type,f,q=0.8,attack=0.002){const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t);fl.Q.value=q;
    const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+attack);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(bus);s.start(t,Math.random()*1.5);s.stop(t+dur+0.05);return {s,fl,g};}
  function tone(t,bus,type,f,dur,v,attack=0.005,f2=null){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+attack);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+0.05);return {o,g};}
  // instruments
  const kick=(t,bus,v)=>tone(t,bus,"sine",130,0.42,v,0.002,42);
  function snare(t,bus,v,lofi){nz(t,lofi?0.22:0.17,bus,v,"bandpass",lofi?1500:2100,0.7);tone(t,bus,"triangle",lofi?170:200,0.11,v*0.6);}
  const hat=(t,bus,v,open)=>nz(t,open?0.22:0.045,bus,v,"highpass",7500,0.6);
  function ep(t,bus,m,len,v){const f=mtof(m),lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1700;lp.connect(bus);
    [["sine",f,1],["sine",f*2,0.22],["triangle",f*1.003,0.18]].forEach(([ty,fr,a])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=ty;o.frequency.value=fr;
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v*a,t+0.012);g.gain.exponentialRampToValueAtTime(v*a*0.45,t+0.35);g.gain.exponentialRampToValueAtTime(0.0001,t+len);o.connect(g);g.connect(lp);o.start(t);o.stop(t+len+0.05);});}
  const bell=(t,bus,m,v)=>{tone(t,bus,"sine",mtof(m),1.3,v,0.004);tone(t,bus,"sine",mtof(m)*3.01,0.45,v*0.18,0.004);};
  function bassNote(t,bus,m,len,v,saw){const o=ctx.createOscillator(),g=ctx.createGain(),lp=ctx.createBiquadFilter();o.type=saw?"sawtooth":"triangle";o.frequency.value=mtof(m);
    lp.type="lowpass";lp.frequency.setValueAtTime(saw?1400:600,t);lp.frequency.exponentialRampToValueAtTime(saw?220:400,t+len);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+len);
    o.connect(lp);lp.connect(g);g.connect(bus);o.start(t);o.stop(t+len+0.05);}
  function pad(t,bus,notes,len,v){const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.setValueAtTime(900,t);lp.frequency.linearRampToValueAtTime(2200,t+len*0.5);lp.connect(bus);
    notes.forEach(m=>[-7,7].forEach(c=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="sawtooth";o.frequency.value=mtof(m);o.detune.value=c;
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.03);g.gain.exponentialRampToValueAtTime(0.0001,t+len);o.connect(g);g.connect(lp);o.start(t);o.stop(t+len+0.05);}));}
  const arp=(t,bus,m,v)=>{const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=2600;lp.connect(bus);const o=ctx.createOscillator(),g=ctx.createGain();o.type="square";o.frequency.value=mtof(m);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.004);g.gain.exponentialRampToValueAtTime(0.0001,t+0.09);o.connect(g);g.connect(lp);o.start(t);o.stop(t+0.12);};
  const tom=(t,bus,f,v)=>tone(t,bus,"sine",f,0.3,v,0.002,f*0.55);
  // songs: chill lofi in C (Dm9 G13 Cmaj9 Am9), intense drive in A minor
  const CH=[{c:[62,65,69,72,76],b:38},{c:[59,65,69,71,76],b:43},{c:[60,64,67,71,74],b:36},{c:[57,60,64,67,71],b:45}];
  const PENTA=[72,74,76,79,81,84,86];
  function playChill(step,t,s){const bus=warm,beat=60/s.bpm/4,sw=(step%4===2)?beat*0.32:0,st=step%16,bar=Math.floor(step/16),ch=CH[bar%4],T=t+sw;
    if(st===0)ch.c.forEach((m,k)=>ep(T+k*0.012,bus,m,beat*13,0.075));
    if(st===6)ch.c.slice(1,4).forEach(m=>ep(T,bus,m,beat*3,0.045));
    if(st===0||st===7||st===10)bassNote(T,bus,st===10?ch.b+7:ch.b,beat*(st===0?5:2.5),0.32,false);
    if(bar%8!==7||st<8){if(st===0||st===10||(st===7&&bar%2))kick(T,bus,0.5);if(st===4||st===12)snare(T,bus,0.16,true);}
    if(st%2===0&&Math.random()>0.12)hat(T,bus,st%4===0?0.05:0.03,false);
    if(st%2===0&&Math.random()<0.2)bell(T,bus,PENTA[Math.floor(Math.random()*PENTA.length)],0.045);
    if(Math.random()<0.08)nz(t,0.02,crackleG,0.05+Math.random()*0.08,"highpass",3000);}
  // quiet, sparse piano and celesta pieces in the spirit of a sandbox-game soundtrack, with a long hall reverb
  function voice(t,m,len,v,parts,bright,send,bus=mcG){const f=mtof(m),out=ctx.createGain();out.connect(bus);const sd=ctx.createGain();sd.gain.value=bus===mcG?send:0;out.connect(sd);sd.connect(verb);
    const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.setValueAtTime(700+2200*bright,t);lp.frequency.exponentialRampToValueAtTime(420,t+Math.min(len,4));lp.connect(out);
    parts.forEach(([ty,mul,a,dec])=>{const o=ctx.createOscillator(),g=ctx.createGain(),d=Math.min(dec,len+1.4);o.type=ty;o.frequency.value=f*mul;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v*a,t+0.007);
      g.gain.exponentialRampToValueAtTime(v*a*0.35,t+0.45);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(lp);o.start(t);o.stop(t+d+0.05);});}
  const piano=(t,m,len,v,br=0.6,bus)=>voice(t,m,len,v,[["triangle",1,0.55,5],["sine",1,0.7,5],["sine",2,0.12,2.5],["sine",3.003,0.04,1.2]],br,0.55,bus);
  const celesta=(t,m,v,bus)=>voice(t,m,1.6,v,[["sine",1,0.8,1.8],["sine",4.01,0.16,0.5],["triangle",2,0.1,0.9]],1,0.8,bus);
  function softPad(t,notes,len,v){const out=ctx.createGain();out.connect(mcG);const sd=ctx.createGain();sd.gain.value=0.7;out.connect(sd);sd.connect(verb);const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1100;lp.connect(out);
    notes.forEach(m=>[-5,5].forEach(c=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o.frequency.value=mtof(m);o.detune.value=c;
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+1.6);g.gain.setValueAtTime(v,t+len*0.7);g.gain.exponentialRampToValueAtTime(0.0001,t+len+1.2);o.connect(g);g.connect(lp);o.start(t);o.stop(t+len+1.3);}));}
  const MC=[
    {name:"Wet End Morning",bpm:70,lead:"piano",alt:"celesta",oct2:12,pad:false,arp:[0,null,null,1,null,null,2,null,3,null,null,2,null,null,1,null],
     prog:[{b:38,c:[54,57,61,64]},{b:35,c:[54,57,59,62]},{b:43,c:[55,59,62,66]},{b:45,c:[52,57,62,66]},{b:42,c:[57,61,64,69]},{b:40,c:[55,59,62,66]},{b:43,c:[54,59,61,66]},{b:45,c:[52,57,61,64]}],
     mel:[[[0,78,6],[6,76,2],[8,73,8]],[[0,74,10],[12,71,4]],[[0,74,4],[4,76,4],[8,78,8]],[[0,76,12]],[[0,81,6],[6,78,2],[8,76,4],[12,78,4]],[[0,79,8],[8,78,4],[12,74,4]],[[0,73,6],[6,74,2],[8,76,8]],[[0,73,16]]]},
    {name:"Felt Moss",bpm:62,lead:"celesta",alt:"piano",oct2:-12,pad:true,arp:[0,null,1,null,2,null,3,null,2,null,1,null,null,null,null,null],
     prog:[{b:41,c:[57,60,64,71]},{b:43,c:[59,62,64,67]},{b:40,c:[55,59,62,64]},{b:45,c:[55,59,60,64]},{b:38,c:[53,57,60,64]},{b:41,c:[53,57,60,64]},{b:43,c:[55,60,62,67]},{b:43,c:[55,59,62,67]}],
     mel:[[[0,83,6],[6,84,6],[12,88,4]],[[2,86,14]],[[0,83,8],[8,79,8]],[[4,84,12]],[[0,81,4],[4,77,4],[8,81,8]],[[0,88,6],[6,84,10]],[[0,86,8],[8,84,4],[12,83,4]],[[0,79,16]]]},
    {name:"Night Shift Stars",bpm:56,lead:"piano",alt:"piano",oct2:12,pad:true,arp:[0,null,null,null,1,null,null,null,2,null,null,null,3,null,null,null],
     prog:[{b:33,c:[57,59,60,64]},{b:41,c:[53,57,60,64]},{b:43,c:[55,60,64,67]},{b:40,c:[55,59,62,64]},{b:45,c:[57,60,64,69]},{b:38,c:[53,57,60,62]},{b:41,c:[57,60,64,67]},{b:40,c:[52,56,59,62]}],
     mel:[[[0,76,8],[8,72,8]],[[0,74,4],[4,72,4],[8,69,8]],[[0,67,12],[12,72,4]],[[0,71,16]],[[0,76,6],[6,79,6],[12,76,4]],[[0,77,8],[8,76,8]],[[0,72,8],[8,74,8]],[[0,71,8],[8,68,8]]]},
    // v4.1 pass 4: a fourth, lighter piece for the valley: celesta arpeggios over major sevenths, the tune high and airy
    {name:"Canopy Light",bpm:74,lead:"celesta",alt:"piano",oct2:12,pad:true,arp:[0,null,1,null,2,null,3,null,2,null,1,null,3,null,2,null],
     prog:[{b:36,c:[55,59,64,67]},{b:45,c:[55,60,64,67]},{b:41,c:[57,60,64,69]},{b:43,c:[55,59,62,67]},{b:40,c:[55,59,62,67]},{b:45,c:[57,60,64,67]},{b:38,c:[53,57,60,64]},{b:43,c:[55,59,62,65]}],
     mel:[[[0,83,4],[4,84,4],[8,88,8]],[[0,86,6],[6,84,2],[8,83,8]],[[0,81,4],[4,83,4],[8,84,8]],[[0,79,16]],[[0,88,4],[4,86,4],[8,84,4],[12,83,4]],[[0,81,8],[8,84,8]],[[0,86,6],[6,84,2],[8,81,8]],[[0,79,16]]]}];
  // each piece: 4 bars of chords, the tune twice (second time in another register or voice), 4 bars to fade out
  function playMC(so,step,t){const st=step%16,bar=Math.floor(step/16),bars=24;if(bar>=bars)return;const ch=so.prog[bar%8],beat=60/so.bpm/4,hum=()=>Math.random()*0.012,
      fade=bar>=bars-4?Math.max(0.15,(bars-bar)/5):bar<1?0.7:1,inTune=bar>=4&&bar<bars-4;
    if(st===0){piano(t+hum(),ch.b+12,beat*16,0.075*fade,0.25);if(so.pad)softPad(t,ch.c,beat*15,0.006*fade);}
    const ai=so.arp[st];if(ai!=null&&(bar>=1||st===0))piano(t+hum(),ch.c[ai],beat*7,(0.03+Math.random()*0.012)*fade,0.45);
    if(inTune){const mb=(bar-4)%8,pass=Math.floor((bar-4)/8),ins=pass?so.alt:so.lead,sh=pass?so.oct2:0;
      for(const [s0,m,l] of so.mel[mb])if(s0===st){const v=0.07+Math.random()*0.015;if(ins==="celesta")celesta(t+hum(),m+sh,v*0.9);else piano(t+hum(),m+sh,beat*l,v,0.8);}}}
  /* ---- v4.1 pass 4: music by environment. Each site has its own calm pieces and its own upset piece; the lofi break-room
     tune plays everywhere (the break room is inside the mill). The pieces below are generative: chords, rhythm templates
     and short motifs with the rest left to dice, so no two plays are the same. New pieces go through envG (brighter than the
     3.2 kHz "warm" bus the lofi and piano pieces use) with a hall send (desktop) and a tape echo (every platform). ---- */
  const envKey=()=>(typeof SITE!=="undefined"&&SITE&&SITE.env)||"rural",R1=Math.random,ch1=a=>a[Math.floor(R1()*a.length)];
  // an output: dry to a bus, with sends to the hall and to that bus's echo
  function mkOut(bus,send=0,ech=0){const g=ctx.createGain();g.connect(bus);if(send>0&&verb&&bus!==intG){const s=ctx.createGain();s.gain.value=send;g.connect(s);s.connect(verb);}
    const e=bus===intG?echoInt:echoIn;if(ech>0&&e){const x=ctx.createGain();x.gain.value=ech;g.connect(x);x.connect(e);}return g;}
  function mkEcho(dest,time,fb,cut){const inp=ctx.createGain(),dl=ctx.createDelay(1),f=ctx.createGain(),lp=ctx.createBiquadFilter();dl.delayTime.value=time;f.gain.value=fb;lp.type="lowpass";lp.frequency.value=cut;
    inp.connect(dl);dl.connect(lp);lp.connect(f);f.connect(dl);lp.connect(dest);return inp;}
  // -- instruments --
  // a wide analogue pad: three detuned voices per note, a slow filter sweep (Blade Runner's string machines)
  function synthPad(t,bus,notes,len,v,cut=700,sweep=2.4,det=9,att=1.2){const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.setValueAtTime(cut,t);lp.frequency.linearRampToValueAtTime(cut*sweep,t+len*0.55);lp.frequency.linearRampToValueAtTime(cut*0.9,t+len+0.5);lp.Q.value=1.4;
    const out=mkOut(bus,0.55,0.22);lp.connect(out);
    notes.forEach(m=>[-det,0,det].forEach((c,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i===1?"square":"sawtooth";o.frequency.value=mtof(m);o.detune.value=c;const a=i===1?0.3:1;
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v*a,t+Math.min(att,len*0.3));g.gain.setValueAtTime(v*a,t+len*0.72);g.gain.exponentialRampToValueAtTime(0.0001,t+len+0.9);o.connect(g);g.connect(lp);o.start(t);o.stop(t+len+1);}));}
  // a brass lead with portamento and late vibrato (the CS-80 sound): saw + soft square, filter opens on the attack
  function synthLead(t,bus,m,len,v,from,bright=1){const f=mtof(m),out=mkOut(bus,0.5,0.35),lp=ctx.createBiquadFilter();lp.type="lowpass";lp.Q.value=2;lp.frequency.setValueAtTime(900,t);lp.frequency.exponentialRampToValueAtTime(1400+1600*bright,t+0.35);lp.frequency.exponentialRampToValueAtTime(800,t+len+0.4);lp.connect(out);
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=5.2;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(9,t+0.7);lfo.connect(lg);lfo.start(t);lfo.stop(t+len+0.6);
    [["sawtooth",0,1],["square",-6,0.28]].forEach(([ty,dt,a])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=ty;o.detune.value=dt;o.frequency.setValueAtTime(from?mtof(from):f*0.985,t);o.frequency.exponentialRampToValueAtTime(f,t+(from?0.16:0.05));lg.connect(o.detune);
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v*a,t+0.09);g.gain.setValueAtTime(v*a,t+len);g.gain.exponentialRampToValueAtTime(0.0001,t+len+0.5);o.connect(g);g.connect(lp);o.start(t);o.stop(t+len+0.6);});}
  // a wisp: filtered noise that drifts up or down through the mix
  function wisp(t,bus,len,v,f0,f1,q=6){const out=mkOut(bus,0.6,0.3),w=nz(t,len,out,v,"bandpass",f0,q,len*0.45);w.fl.frequency.exponentialRampToValueAtTime(f1,t+len);}
  // a plucked string: a few decaying partials behind a closing filter; bright and short for a banjo, warmer and longer with a
  // little pitch dip ("twang") for a guitar; trem adds a tremolo for held notes
  function pluck(t,bus,m,len,v,o={}){const f=mtof(m),br=o.bright??0.5,out=mkOut(bus,o.send??0.35,o.echo??0.25),lp=ctx.createBiquadFilter();lp.type="lowpass";lp.Q.value=0.8;
    lp.frequency.setValueAtTime(1200+5500*br,t);lp.frequency.exponentialRampToValueAtTime(420+700*br,t+Math.min(len,1.6));lp.connect(out);
    if(o.trem){const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=o.trem;lg.gain.value=0.45;out.gain.value=0.55;lfo.connect(lg);lg.connect(out.gain);lfo.start(t+0.25);lfo.stop(t+len+0.3);}
    const tw=o.twang||0;[["triangle",1,0.75,1],["sawtooth",1,0.18+0.2*br,0.45],["sine",2.004,0.22,0.6],["sine",3.01,0.05+0.08*br,0.3],["sine",4.02,0.04*br,0.2]].forEach(([ty,mul,a,dk])=>{const osc=ctx.createOscillator(),g=ctx.createGain(),d=Math.max(0.12,len*dk);osc.type=ty;
      osc.frequency.setValueAtTime(f*mul*(1+0.014*tw),t);osc.frequency.exponentialRampToValueAtTime(f*mul,t+0.045);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v*a,t+0.004);g.gain.exponentialRampToValueAtTime(v*a*0.3,t+d*0.35);g.gain.exponentialRampToValueAtTime(0.0001,t+d);osc.connect(g);g.connect(lp);osc.start(t);osc.stop(t+d+0.05);});
    if(br>0.7)nz(t,0.012,out,v*0.35,"highpass",2500);}
  const banjo=(t,bus,m,v,len=0.7)=>pluck(t,bus,m,len,v,{bright:0.92,send:0.25,echo:0.12});
  const guitar=(t,bus,m,len,v,trem)=>pluck(t,bus,m,len,v,{bright:0.45,twang:1,trem:trem?5.2:0,send:0.5,echo:0.4});
  // a whistled line: a sine with breath, late vibrato and a slide in from the last note
  function whistle(t,bus,m,len,v,from){const f=mtof(m),out=mkOut(bus,0.6,0.4),o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(from?mtof(from):f*0.97,t);o.frequency.exponentialRampToValueAtTime(f,t+(from?0.14:0.06));
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=5.6;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(14,t+0.5);lfo.connect(lg);lg.connect(o.detune);lfo.start(t);lfo.stop(t+len+0.4);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.07);g.gain.setValueAtTime(v,t+len*0.85);g.gain.exponentialRampToValueAtTime(0.0001,t+len+0.3);o.connect(g);g.connect(out);o.start(t);o.stop(t+len+0.4);
    nz(t,len+0.2,out,v*0.12,"bandpass",f,12,0.08);}
  // a harmonica: two reeds slightly apart through a formant, with a slow tremolo
  function harmonica(t,bus,notes,len,v){const out=mkOut(bus,0.45,0.2),bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=1150;bp.Q.value=0.9;const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=3000;bp.connect(lp);lp.connect(out);
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=4.6;lg.gain.value=0.22;out.gain.value=0.78;lfo.connect(lg);lg.connect(out.gain);lfo.start(t+0.3);lfo.stop(t+len+0.5);
    notes.forEach(m=>[-7,7].forEach(c=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="sawtooth";o.frequency.value=mtof(m);o.detune.value=c;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.16);g.gain.setValueAtTime(v,t+len*0.8);g.gain.exponentialRampToValueAtTime(0.0001,t+len+0.35);o.connect(g);g.connect(bp);o.start(t);o.stop(t+len+0.4);}));}
  // a fiddle-ish bowed drone: two detuned saws, slow bow attack, vibrato
  function bowed(t,bus,m,len,v){const out=mkOut(bus,0.5,0.1),lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1900;lp.Q.value=1.1;lp.connect(out);const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=5.8;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(7,t+0.8);lfo.connect(lg);lfo.start(t);lfo.stop(t+len+0.5);
    [-6,6].forEach(c=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="sawtooth";o.frequency.value=mtof(m);o.detune.value=c;lg.connect(o.detune);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.5);g.gain.setValueAtTime(v,t+len*0.8);g.gain.exponentialRampToValueAtTime(0.0001,t+len+0.4);o.connect(g);g.connect(lp);o.start(t);o.stop(t+len+0.5);});}
  // a low drone: sine and a quiet saw an octave up, under a slow filter
  function drone(t,bus,m,len,v){const out=mkOut(bus,0.3,0),lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.setValueAtTime(220,t);lp.frequency.linearRampToValueAtTime(420,t+len*0.5);lp.frequency.linearRampToValueAtTime(200,t+len);lp.connect(out);
    [["sine",1,1],["sawtooth",2.002,0.22],["sawtooth",0.999,0.18]].forEach(([ty,mul,a])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=ty;o.frequency.value=mtof(m)*mul;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v*a,t+1.5);g.gain.setValueAtTime(v*a,t+len*0.8);g.gain.exponentialRampToValueAtTime(0.0001,t+len+1);o.connect(g);g.connect(lp);o.start(t);o.stop(t+len+1.1);});}
  // percussion
  const shaker=(t,bus,v)=>nz(t,0.05,bus,v,"bandpass",6000,2.5,0.008);
  const rattle=(t,bus,v)=>{for(let k=0;k<16;k++)nz(t+k*(0.028+k*0.004),0.02,bus,v*(1-k/20),"bandpass",5200+R1()*1500,3,0.004);};
  const clap=(t,bus,v)=>{for(let k=0;k<3;k++)nz(t+k*0.011,0.07,bus,v*(k?0.5:1),"bandpass",1300,1);nz(t+0.03,0.25,bus,v*0.5,"bandpass",1000,0.8,0.01);};
  const stomp=(t,bus,v)=>{tone(t,bus,"sine",80,0.32,v,0.002,36);nz(t,0.12,bus,v*0.5,"lowpass",220,0.7);};
  const deepKick=(t,bus,v)=>tone(t,bus,"sine",64,0.5,v,0.002,34);
  const whip=(t,bus,v)=>{nz(t,0.05,bus,v,"highpass",2500);tone(t,bus,"sine",1800,0.08,v*0.3,0.002,300);};
  const tik=(t,bus,v)=>nz(t,0.012,bus,v,"highpass",9000,0.5,0.002);
  const woodblock=(t,bus,v)=>tone(t,bus,"sine",900,0.07,v,0.002,600);
  // -- the pieces -- each is {name,bpm,bars,play(st,t,s)}; st counts 16th steps from the start of the piece
  const bar16=st=>[st%16,Math.floor(st/16)];
  // urban: Blade Runner. Wide pads on slow changes, a brass lead that slides into its notes, wisps of noise, a heartbeat kick
  const SYNP=[[{b:36,c:[63,67,70,74]},{b:32,c:[60,63,67,72]},{b:29,c:[63,65,68,72]},{b:31,c:[62,65,67,71]}],
    [{b:39,c:[62,67,70,74]},{b:36,c:[60,63,67,70]},{b:32,c:[60,63,67,70]},{b:34,c:[60,65,70,72]}],
    [{b:33,c:[60,64,67,71]},{b:38,c:[60,62,65,69]},{b:31,c:[59,62,67,71]},{b:36,c:[55,60,63,67]}]];
  const SYNL=[[[0,67,6],[6,70,4],[10,72,6],[16,75,14]],[[0,74,8],[8,72,4],[12,70,4],[16,67,14]],[[4,75,6],[10,74,2],[12,72,4],[16,70,8],[24,67,8]],[[0,70,12],[12,72,4],[16,74,14]],[[2,79,10],[12,77,4],[16,75,8],[24,74,6]],[]];
  const SYNL2=[[[0,69,8],[8,72,4],[12,71,4],[16,76,14]],[[0,74,10],[10,72,2],[12,71,4],[16,69,14]],[[4,76,8],[12,74,4],[16,72,8],[24,71,8]],[[0,67,12],[12,69,4],[16,72,14]],[]];   // A minor, for Tears in the Mist
  function playSynth(so,st,t,s){const [k,bar]=bar16(st),beat=60/s.bpm/4,P=so.P,ch=P[Math.floor(bar/so.hold)%P.length],fade=bar>=so.bars-4?Math.max(0.12,(so.bars-bar)/5):bar<1?0.6:1,bus=envG;
    if(k===0&&bar%so.hold===0)synthPad(t,bus,ch.c,beat*16*so.hold,0.024*fade*so.padV,so.cut,2.4,so.det,so.hold>1?2.2:1.2);
    if(k===0&&bar%so.hold===0)bassNote(t,bus,ch.b,beat*16*so.hold*0.95,0.1*fade,false);
    if(so.seq&&k%2===0&&bar>=2)bassNote(t+0.002,bus,ch.b+12+[0,0,12,0,0,7,0,12][(k/2)%8],beat*1.7,0.06*fade,true);
    if(so.beat&&bar>=4&&bar<so.bars-3){if(k===0||k===8)deepKick(t,bus,0.3*fade);if(k===4||k===12)tik(t,bus,0.05);if(k===12&&R1()<0.3)nz(t,0.2,bus,0.05,"bandpass",900,1,0.01);}
    if(k%8===so.wispAt&&bar%2===so.wispBar&&R1()<0.8){const up=R1()<0.55;wisp(t,bus,beat*12,0.05*fade,up?300:2600,up?2800:260,5);}
    if(so.lead&&bar>=4&&bar<so.bars-4&&(bar-4)%2===0&&k===0){so.ph=R1()<0.22?[]:ch1(so.lead===true?SYNL:so.lead);so.phFrom=so.phLast;}
    if(so.lead&&bar>=4&&bar<so.bars-4){const rel=((bar-4)%2)*16+k,sh=Math.floor((bar-4)/8)%2?-12:0;for(const [s0,m,l] of so.ph||[])if(s0===rel){synthLead(t,bus,m+sh,beat*l*0.9,0.05*fade,so.phFrom?so.phFrom+sh:null,so.bright);so.phFrom=null;so.phLast=m;}}
    if(so.bells&&k%4===2&&R1()<0.3){const m=ch1(ch.c)+24;tone(t,mkOut(bus,0.6,0.5),"sine",mtof(m),1.6,0.03*fade,0.004);}}
  const SYN=[{name:"Neon Rain",bpm:62,bars:28,P:SYNP[0],hold:1,padV:1,cut:650,det:9,lead:true,bright:1,beat:true,wispAt:4,wispBar:0,bells:false,play(st,t,s){playSynth(this,st,t,s);}},
    {name:"Rooftop Static",bpm:70,bars:28,P:SYNP[1],hold:2,padV:0.85,cut:520,det:12,seq:true,lead:true,bright:0.6,beat:false,wispAt:0,wispBar:1,bells:true,play(st,t,s){playSynth(this,st,t,s);}},
    {name:"Tears in the Mist",bpm:56,bars:24,P:SYNP[2],hold:2,padV:1.15,cut:420,det:14,lead:SYNL2,bright:1.2,beat:false,wispAt:0,wispBar:0,bells:true,play(st,t,s){playSynth(this,st,t,s);}}];
  // desert: sparse and desolate. A drone, a guitar that takes its time, a whistled line, a rattle now and then
  const PENT=[62,65,67,69,72,74,77,79],DCH=[[50,57,62,69],[48,55,60,67],[46,53,58,65],[45,52,57,64]];
  function playWest(so,st,t,s){const [k,bar]=bar16(st),beat=60/s.bpm/4,fade=bar>=so.bars-4?Math.max(0.12,(so.bars-bar)/5):1,bus=envG;
    if(k===0&&bar%4===0)drone(t,bus,so.droneM,beat*67,0.035*fade);
    if(so.strum&&k===0&&bar%2===0&&bar>=2){const c=DCH[so.ci%DCH.length];so.ci+=R1()<0.6?1:3;c.forEach((m,i)=>guitar(t+i*0.03,bus,m,beat*22,0.07*fade*(i?0.8:1),i===3));}
    if(so.pick&&bar>=1&&[0,6,8,12].includes(k)&&R1()<so.pick){const step=R1()<0.65?(R1()<0.5?1:-1):(R1()<0.5?2:-3);so.mi=Math.max(0,Math.min(PENT.length-1,so.mi+step));const long=R1()<0.3;
      guitar(t,bus,PENT[so.mi],beat*(long?14:5),0.1*fade,long);if(long&&R1()<0.5)guitar(t+beat*8,bus,PENT[so.mi]-12,beat*6,0.05*fade,false);}
    if(so.whistle&&bar>=4&&bar<so.bars-3&&(bar%4===0||bar%4===1)){if(k===0&&bar%4===0)so.wph=R1()<0.3?[]:ch1(so.whistle);const rel=(bar%4)*16+k;for(const [s0,m,l] of so.wph||[])if(s0===rel){whistle(t,bus,m,beat*l*0.9,0.06*fade,so.wlast);so.wlast=m;}}
    if(so.harm&&k%4===2&&R1()<0.22)pluck(t,bus,ch1(PENT)+24,1.6,0.06*fade,{bright:0.2,send:0.7,echo:0.5});
    if(k===0&&bar%4===3&&R1()<0.45)rattle(t+beat*R1()*8,bus,0.08*fade);
    if(k===0&&bar%4===2&&R1()<0.5)tom(t+beat*ch1([0,6,10]),bus,70,0.25*fade);
    if(so.wind&&k===8&&bar%3===0)wisp(t,bus,beat*20,0.045*fade,200,R1()<0.5?700:160,2.5);
    if(k%4===2&&R1()<so.shake)shaker(t,bus,0.03*fade);}
  const WHIS=[[[0,74,8],[8,72,4],[12,69,8],[20,67,12]],[[2,69,6],[8,72,6],[16,74,16]],[[0,77,10],[10,74,4],[14,72,4],[18,69,14]],[[4,67,8],[12,69,4],[16,65,12]]];
  const WEST=[{name:"Dry Wash",bpm:60,bars:24,droneM:38,pick:0.5,mi:3,wind:true,shake:0,play(st,t,s){playWest(this,st,t,s);}},
    {name:"High Noon Haze",bpm:66,bars:24,droneM:38,strum:true,ci:0,whistle:WHIS,pick:0.18,mi:4,shake:0.25,play(st,t,s){playWest(this,st,t,s);}},
    {name:"Mesa Wind",bpm:54,bars:22,droneM:33,harm:true,wind:true,pick:0.22,mi:2,shake:0,play(st,t,s){playWest(this,st,t,s);}}];
  // swamp: folksy. Banjo rolls over chords that wander (each chord picks the next from its neighbours), a thumb bass, a
  // harmonica or a fiddle drone, and a tune that meanders up and down the pentatonic
  const GCH={G:{b:43,c:[55,59,62,67],g:1,to:["C","C","Em","D"]},C:{b:48,c:[60,64,67,72],g:1,to:["G","G","D","Am"]},D:{b:50,c:[57,62,66,69],to:["G","G","Em"]},Em:{b:52,c:[55,59,64,67],g:1,to:["C","C","D","G"]},Am:{b:45,c:[57,60,64,69],to:["D","D","C"]}};   // g: the fifth-string G rings over it
  const GPENT=[67,69,71,74,76,79,81,83],ROLLS=[[0,1,2,0,1,2,0,3],[0,2,1,3,0,2,1,3],[0,1,3,1,0,2,3,2]];
  function playFolk(so,st,t,s){const [k,bar]=bar16(st),beat=60/s.bpm/4,fade=bar>=so.bars-4?Math.max(0.12,(so.bars-bar)/5):1,bus=envG,sw=so.swing&&k%4===2?beat*0.3:0,T=t+sw;
    if(k===0){if(bar%2===0){so.ch=so.ch?ch1(GCH[so.ch].to):"G";so.roll=ch1(ROLLS);}if(so.fiddle&&bar%2===0)bowed(T,bus,GCH[so.ch].c[1]+12,beat*31,0.028*fade);if(so.harm&&bar%2===0&&R1()<0.7)harmonica(T+beat*2,bus,[GCH[so.ch].c[0]+12,GCH[so.ch].c[2]+12],beat*20,0.03*fade);}
    const C=GCH[so.ch];
    if(so.rollV&&k%2===0&&bar>=1){const i=so.roll[(k/2)%8],m=i===3&&C.g?79:C.c[i]+12;banjo(T,bus,m,so.rollV*fade*(k%4===0?1:0.7),0.6);}
    if(so.sparse&&bar>=1&&k%4===0&&R1()<0.5)banjo(T,bus,C.c[Math.floor(R1()*4)]+12,0.05*fade,0.9);
    if(k===0||k===8)bassNote(T,bus,k?C.b+7:C.b,beat*6,0.14*fade,false);
    if(so.tune&&bar>=3&&bar<so.bars-3&&(k%4===0||(k%4===2&&R1()<0.35))&&R1()<so.tune){const step=R1()<0.7?(R1()<0.5?1:-1):(R1()<0.5?2:-2);so.mi=Math.max(0,Math.min(GPENT.length-1,so.mi+step));if(R1()<0.12)so.mi=ch1([2,3,4]);
      banjo(T+0.004,bus,GPENT[so.mi],0.075*fade,1.1);}
    if(so.brush&&(k===4||k===12))nz(T,0.09,bus,0.028*fade,"bandpass",1500,1,0.01);
    if(so.wash&&k%2===1)nz(T,0.03,bus,(k%4===3?0.035:0.02)*fade,"highpass",5000,0.8,0.004);
    if(so.frogs&&k===6&&R1()<0.25)tone(T,mkOut(bus,0.5,0.3),"sine",170,0.16,0.08*fade,0.004,95);
    if(so.block&&(k===2||k===10)&&R1()<0.5)woodblock(T,bus,0.05*fade);}
  const FOLK=[{name:"Cypress Roll",bpm:92,bars:28,rollV:0.045,tune:0.75,mi:3,brush:true,play(st,t,s){playFolk(this,st,t,s);}},
    {name:"Slow Water",bpm:74,bars:24,sparse:true,harm:true,tune:0.4,mi:2,frogs:true,block:true,play(st,t,s){playFolk(this,st,t,s);}},
    {name:"Porch Swing",bpm:100,bars:28,swing:true,rollV:0.04,fiddle:true,tune:0.6,mi:4,wash:true,play(st,t,s){playFolk(this,st,t,s);}}];
  // the rotations: the site's own pieces with the lofi break-room tune as every fourth piece
  const LOFI={name:"Lofi Break Room",bpm:76,bars:32,lofi:true,play:(st,t,s)=>playChill(st,t,s)};
  const MCROT=MC.map(m=>({name:m.name,bpm:m.bpm,bars:24,play:(st,t)=>playMC(m,st,t)}));
  const ENVROT={rural:[...MCROT.slice(0,3),LOFI,MCROT[3]],urban:[...SYN,LOFI],desert:[...WEST,LOFI],swamp:[...FOLK,LOFI]};
  const rot=()=>ENVROT[envKey()]||ENVROT.rural;
  // ?song=<part of a name> starts with that piece and ?upset=<drive|pulse|gallop|stomp|strings> fixes the upset piece (listening tests)
  const MQ=new URLSearchParams(location.search),SONGQ=(MQ.get("song")||"").toLowerCase(),UPQ=MQ.get("upset");
  let rotI=-1;
  function playRot(step,t,s){const L=rot();if(rotI<0||rotI>=L.length){rotI=Math.floor(R1()*(L.length-1));if(SONGQ){const i=L.findIndex(x=>x.name.toLowerCase().includes(SONGQ));if(i>=0)rotI=i;}}const so=L[rotI];if(s.local==null){s.local=0;s.bpm=so.bpm;songStarted(so);}
    if(s.local>=so.bars*16){s.rest=(s.rest||0)+1;if(s.rest>=Math.round(7*s.bpm/15)){rotI=(rotI+1)%L.length;s.local=0;s.rest=0;s.bpm=L[rotI].bpm;songStarted(L[rotI]);}return;}
    so.play(s.local,t,s);s.local++;}
  function songStarted(so){if(crackleG)crackleG.gain.setTargetAtTime(so.lofi?1:0.2,ctx.currentTime,1.5);so.ph=null;so.wph=null;so.ch=null;const b=document.getElementById("v2sound");if(b)b.title="Now playing: "+so.name;AUDIO_NOW=so.name;}
  let AUDIO_NOW="";
  /* ---- upsets: one piece per site plus the old drive, each with two chord sets, fills every fourth bar and a build over the
     first bars, so the alarm music is never quite the same twice ---- */
  const IN=[[{c:[57,60,64],b:45},{c:[53,57,60],b:41},{c:[55,59,62],b:43},{c:[52,55,59],b:40}],[{c:[50,53,57],b:38},{c:[46,50,53],b:34},{c:[48,52,55],b:36},{c:[45,49,52],b:33}]];
  function playDrive(so,step,t,s){const bus=intG,beat=60/s.bpm/4,[st,bar]=bar16(step),ch=so.P[bar%4],build=Math.min(1,0.5+bar*0.15);
    if(st%4===0)kick(t,bus,0.6);if(st===4||st===12)snare(t,bus,0.22,false);hat(t,bus,st%2?0.025:0.05,st===14);
    if(st%2===0)bassNote(t,bus,ch.b+(st%4===2?12:0),beat*1.8,0.22,true);
    if(st===0&&bar>=1)pad(t,bus,ch.c,beat*15,0.03*build);
    if(bar>=1)arp(t,bus,ch.c[(st)%3]+12+(st>=8?12:0),0.045*build);
    if(bar%4===3&&st>=12){if(so.fill)tom(t,bus,[180,150,120,95][st-12],0.35);else snare(t,bus,0.18,false);}}
  // urban: a sequencer pulse under a dark pad, risers every four bars, clap on the backbeat
  const PULSE=[[{b:36,c:[60,63,67,70]},{b:32,c:[60,63,68,72]},{b:29,c:[60,65,68,72]},{b:31,c:[59,62,67,71]}],[{b:38,c:[62,65,69,72]},{b:34,c:[62,65,70,74]},{b:31,c:[62,67,70,74]},{b:33,c:[61,64,69,73]}]];
  function playPulse(so,step,t,s){const bus=intG,beat=60/s.bpm/4,[st,bar]=bar16(step),ch=so.P[bar%4],build=Math.min(1,0.4+bar*0.2);
    if(st%4===0)deepKick(t,bus,0.45);if(bar>=1&&(st===4||st===12))clap(t,bus,0.16);if(st%2===1)tik(t,bus,0.04);
    if(st%2===0)bassNote(t,bus,ch.b+12+[0,0,12,0,0,7,0,12][(st/2)%8],beat*1.6,0.12*build,true);
    if(st===0&&bar%2===0)synthPad(t,bus,[ch.c[0],ch.c[0]+1,ch.c[2],ch.c[3]],beat*31,0.03*build,500,3,10,0.6);
    if(bar%4===0&&st===0&&bar>=2)wisp(t,bus,beat*30,0.06,250,3200,4);
    if(bar>=2&&(st===6||st===14)&&R1()<0.45)synthLead(t,bus,ch.c[Math.floor(R1()*4)]+12,beat*1.5,0.075,null,1.3);
    if(bar%4===3&&st>=12)clap(t,bus,0.12+0.04*(st-12));}
  // desert: a gallop on the toms, tremolo guitar chords, a whip crack on the backbeat
  const GAL=[[[62,65,69],[58,62,65],[55,58,62],[57,61,64]],[[57,60,64],[53,57,60],[55,58,62],[52,56,59]]],GALB=[[38,34,31,33],[33,29,31,28]];
  function playGallop(so,step,t,s){const bus=intG,beat=60/s.bpm/4,[st,bar]=bar16(step),c=so.P[bar%4],b=so.B[bar%4],build=Math.min(1,0.5+bar*0.15);
    if(st%4===0)tom(t,bus,105,0.36);if(st%4===2||st%4===3)tom(t,bus,st%4===2?150:165,0.17);if(st===4||st===12)whip(t,bus,0.4);
    if(st%2===0)bassNote(t,bus,b+(st%8===6?7:0),beat*1.7,0.16,true);
    if(st===0||st===8){c.forEach((m,i)=>guitar(t+i*0.02,bus,m,beat*7,0.13*build,true));}
    if(bar>=2&&st===10&&R1()<0.35)whistle(t,bus,ch1([74,77,79]),beat*5,0.06,null);
    if(bar%4===3&&st===8)rattle(t,bus,0.12);
    if(bar%4===3&&st>=12)tom(t,bus,[180,150,120,95][st-12],0.4);}
  // swamp: a stomp and clap, fast banjo rolls, a walking bass, a harmonica shriek at the turn
  const STOMP=[[{b:40,c:[52,55,59,64]},{b:36,c:[48,52,55,60]},{b:43,c:[55,59,62,67]},{b:35,c:[47,51,54,57]}],[{b:45,c:[57,60,64,69]},{b:41,c:[53,57,60,65]},{b:43,c:[55,59,62,67]},{b:40,c:[52,56,59,64]}]];
  function playStomp(so,step,t,s){const bus=intG,beat=60/s.bpm/4,[st,bar]=bar16(step),ch=so.P[bar%4],build=Math.min(1,0.5+bar*0.2);
    if(st===0||st===8)stomp(t,bus,0.5);if(st===4||st===12)clap(t,bus,0.18);if(st%2===1)nz(t,0.03,bus,st%4===3?0.04:0.02,"highpass",5000,0.8,0.004);
    if(bar>=1&&st%2===0){const i=so.roll[(st/2)%8],m=ch.c[i]+12;banjo(t,bus,m,0.095*build*(st%4===0?1:0.7),0.4);}
    if(st%2===0)bassNote(t,bus,[ch.b,ch.b,ch.b+7,ch.b+7,ch.b,ch.b+5,ch.b+7,ch.b+10][st/2],beat*1.5,0.16,false);
    if(bar%4===3&&st===12)harmonica(t,bus,[ch.c[2]+12,ch.c[3]+12],beat*4,0.09);
    if(bar%4===3&&st>=12&&st%2===0)stomp(t,bus,0.4);}
  // forest: urgent plucked octaves, piano stabs, a rising line every fourth bar
  const STR=[[{b:45,c:[57,60,64]},{b:41,c:[53,57,60]},{b:38,c:[50,53,57]},{b:40,c:[52,56,59]}],[{b:36,c:[48,51,55]},{b:32,c:[44,48,51]},{b:29,c:[41,44,48]},{b:31,c:[43,47,50]}]];
  function playStrings(so,step,t,s){const bus=intG,beat=60/s.bpm/4,[st,bar]=bar16(step),ch=so.P[bar%4],build=Math.min(1,0.5+bar*0.15);
    if(st%2===0)pluck(t,bus,ch.b+(st%8===6?12:0),0.25,0.2,{bright:0.3,send:0,echo:0});if(st===0||st===10)ch.c.forEach((m,i)=>piano(t+i*0.006,m+12,beat*4,0.06*build,0.9,bus));
    if(st%4===0)tom(t,bus,st===0?95:120,st===0?0.45:0.25);if(st===4||st===12)snare(t,bus,0.16,false);hat(t,bus,st%2?0.02:0.04,false);
    if(bar%4===3&&st>=8)pluck(t,bus,ch.b+12+(st-8),0.2,0.22,{bright:0.5,send:0,echo:0});
    if(bar>=2&&st===14&&R1()<0.4)celesta(t,ch1(ch.c)+24,0.05,bus);}
  const INTENSE={drive:{bpm:138,P:IN,play:playDrive},pulse:{bpm:118,P:PULSE,play:playPulse},gallop:{bpm:126,P:GAL,B:GALB,play:playGallop},stomp:{bpm:150,P:STOMP,play:playStomp},strings:{bpm:132,P:STR,play:playStrings}};
  const ENVINT={rural:"strings",urban:"pulse",desert:"gallop",swamp:"stomp"};
  function pickIntense(){const key=UPQ&&INTENSE[UPQ]?UPQ:R1()<0.72?(ENVINT[envKey()]||"drive"):"drive",v=INTENSE[key],pi=Math.floor(R1()*v.P.length);
    return {name:key,bpm:v.bpm,play:v.play,P:v.P[pi],B:v.B?v.B[pi]:null,fill:R1()<0.5,roll:ch1(ROLLS)};}
  function playIntense(step,t,s){if(!s.cur)s.cur=pickIntense();s.cur.play(s.cur,step,t,s);}
  const seqs={chill:{bpm:76,next:0,step:0,play:playRot},intense:{bpm:138,next:0,step:0,play:playIntense}};
  function tick(){const now=ctx.currentTime,ahead=now+LOOK;
    if(!paNext)paNext=now+35+Math.random()*40;else if(now>paNext){if(zoomK>0.5){paNext=now+100+Math.random()*120;paAnnounce(now+0.05);}else paNext=now+8;}
    ambTick(now);
    for(const k in seqs){const s=seqs[k],live=target===k||now-switchedAt<1.5;if(s.next<now-LOOK)s.next=now+0.05;
      while(s.next<ahead){if(live)s.play(s.step,s.next,s);s.next+=60/s.bpm/4;s.step++;}}}
  function startCrackle(){const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;const lp=ctx.createBiquadFilter();lp.type="bandpass";lp.frequency.value=2400;lp.Q.value=0.4;
    const g=ctx.createGain();g.gain.value=0.012;s.connect(lp);lp.connect(g);g.connect(crackleG);s.start();}
  function init(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    // iPhone: play through the silent switch like a music app
    try{if(navigator.audioSession)navigator.audioSession.type="playback";}catch(e){}
    ctx=new AC();ctxBorn=performance.now();diag("audio: new context "+ctx.sampleRate+" Hz");
    {const c=ctx;c.onstatechange=()=>{diag("audio state "+c.state+(document.hidden?" (page hidden)":""));if(c===ctx&&on&&c.state!=="running"&&!document.hidden){hurt=true;wake();}};}
    unlocked=0;
    comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3;master=ctx.createGain();master.gain.value=vol;comp.connect(master);master.connect(ctx.destination);
    musicBus=ctx.createGain();musicBus.gain.value=0.6;musicBus.connect(comp);sfxBus=ctx.createGain();sfxBus.gain.value=0.85;sfxBus.connect(comp);
    // calm music: chillG (faded against intG) holds the warm 3.2 kHz bus for the lofi and piano pieces and the brighter envG
    // for the site pieces (v4.1 pass 4), each with its own tape echo; the hall (desktop) returns through the warm bus
    chillG=ctx.createGain();chillG.gain.value=1;chillG.connect(musicBus);
    warm=ctx.createBiquadFilter();warm.type="lowpass";warm.frequency.value=3200;warm.connect(chillG);crackleG=ctx.createGain();crackleG.gain.value=1;crackleG.connect(warm);
    mcG=ctx.createGain();mcG.gain.value=1.15;mcG.connect(warm);
    envG=ctx.createGain();envG.gain.value=1;const envLP=ctx.createBiquadFilter();envLP.type="lowpass";envLP.frequency.value=6500;envG.connect(envLP);envLP.connect(chillG);
    if(AMOB){verb=ctx.createGain();verb.gain.value=0;verb.connect(warm);}
    else{verb=ctx.createConvolver();const len=Math.floor(ctx.sampleRate*1.5),b=ctx.createBuffer(2,len,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8);}
     verb.buffer=b;const vg=ctx.createGain();vg.gain.value=0.5;verb.connect(vg);vg.connect(warm);}
    intG=ctx.createGain();intG.gain.value=0;intG.connect(musicBus);
    echoIn=mkEcho(envG,0.36,0.38,2200);echoInt=mkEcho(intG,0.28,0.3,2600);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    if(!AMOB){startCrackle();ambInit();}for(const k in seqs)seqs[k].next=ctx.currentTime+0.1;paNext=0;return true;}
  // ---- area ambience when zoomed in: dryer rumble and steam hiss, wet-end and stock-prep water, winder whir, forklifts, birds outside ----
  let zoomK=0,ambG=null;const AMB={};const lv={dryer:0,wet:0,stock:0,winder:0,fork:0,out:0};let birdAt=0;
  function loopNoise(type,f,q,g0){const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ctx.createGain();g.gain.value=g0;s.connect(fl);fl.connect(g);s.start(0,Math.random()*1.5);return {g,fl};}
  function ambInit(){ambG=ctx.createGain();ambG.gain.value=0.9;ambG.connect(sfxBus);
    const mk=(name,parts)=>{const g=ctx.createGain();g.gain.value=0;g.connect(ambG);parts.forEach(p=>p.g.connect(g));AMB[name]=g;return parts;};
    mk("dryer",[loopNoise("lowpass",170,0.7,0.9),loopNoise("bandpass",3200,0.9,0.12)]);
    {const [a]=mk("wet",[loopNoise("bandpass",900,0.45,0.5),loopNoise("highpass",2400,0.5,0.1)]);const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=0.35;lg.gain.value=300;lfo.connect(lg);lg.connect(a.fl.frequency);lfo.start();}
    mk("stock",[loopNoise("bandpass",420,0.6,0.6),loopNoise("lowpass",120,0.8,0.5)]);
    {const o=ctx.createOscillator();o.type="sawtooth";o.frequency.value=118;const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=380;const og=ctx.createGain();og.gain.value=0.05;o.connect(lp);lp.connect(og);o.start();mk("winder",[{g:og},loopNoise("highpass",5000,0.6,0.05)]);}
    {const o=ctx.createOscillator();o.type="square";o.frequency.value=52;const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=0.7;lg.gain.value=9;lfo.connect(lg);lg.connect(o.frequency);lfo.start();
      const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=260;const og=ctx.createGain();og.gain.value=0.07;o.connect(lp);lp.connect(og);o.start();mk("fork",[{g:og}]);}
    mk("out",[loopNoise("bandpass",600,0.3,0.06)]);}
  let ambSeen=0,ambMuted=false;
  function ambTick(now){if(!ambG)return;
    // levels go stale when the 3D view stops refreshing them (paused, a card open, menu): fade the ambience out instead of
    // repeating the last spot's sounds forever
    if(performance.now()-ambSeen>1000){for(const k in lv)lv[k]=0;if(!ambMuted){ambMuted=true;for(const k in AMB)AMB[k].gain.setTargetAtTime(0,now,0.6);}}
    // v2.9.1: no forklift / truck sounds (reversing beeper and engine hum removed)
    if(lv.out>0.25&&now>birdAt){birdAt=now+1.5+Math.random()*4;const f=2400+Math.random()*1800;for(let k=0;k<2+Math.floor(Math.random()*3);k++)tone(now+0.05+k*0.13,ambG,"sine",f*(1+Math.random()*0.15),0.09,0.03*lv.out,0.005,f*1.25);}}
  const AMBON={},AMBQ={};
  function ambient(levels,zk){zoomK=zk;ambSeen=performance.now();ambMuted=false;if(!ambG)return;const t=ctx.currentTime;for(const k in AMB){const v=(levels[k]||0);lv[k]=v;
      if(v>0.001){AMBQ[k]=0;if(AMBON[k]===false){AMB[k].connect(ambG);AMBON[k]=true;}}
      else if(AMBON[k]!==false){AMBQ[k]=AMBQ[k]||t;if(t-AMBQ[k]>3){AMB[k].disconnect();AMBON[k]=false;}}
      AMB[k].gain.setTargetAtTime(v*({dryer:0.55,wet:0.45,stock:0.5,winder:0.5,fork:0.6,out:0.7}[k]),t,0.4);}}
  function setOn(v){const was=on,fresh=!ctx;if(v&&!ctx&&!init())return false;on=v;if(!ctx)return on;
    // switching sound back on always starts a brand-new audio context: the sure way out of an iOS context that went silent
    if(on&&!was&&!fresh&&AUDIO_VIS){rebuildAudio();return on;}
    if(v&&fresh)unlock();
    if(!AUDIO_VIS){AUDIO_VIS=1;document.addEventListener("visibilitychange",()=>{diag("page "+(document.hidden?"hidden":"visible"));if(!ctx)return;if(document.hidden)ctx.suspend();else if(on){hurt=true;wake();}});
      // phones (iOS above all) suspend or "interrupt" the audio on calls, lock screen, app switches or other audio, and only let it
      // resume from a tap: so every tap/key wakes it, and it also tries on focus, pageshow and whenever the state changes
      ["pointerdown","pointerup","touchend","keydown","click"].forEach(ev=>document.addEventListener(ev,wake,{capture:true,passive:true}));
      window.addEventListener("focus",wake);window.addEventListener("pageshow",wake);
      }
    if(on){ctx.resume();if(!timer)timer=setInterval(tick,25);master.gain.setTargetAtTime(vol,ctx.currentTime,0.1);}
    else{master.gain.setTargetAtTime(0.0001,ctx.currentTime,0.08);setTimeout(()=>{if(!on&&ctx){clearInterval(timer);timer=null;ctx.suspend();}},400);}return on;}
  // bring a suspended or interrupted context back; if the clock is frozen while "running" (an iOS quirk), bounce it
  let lastCT=-1,stuckSince=0;
  let hurt=false,unlocked=0,ctxBorn=0;
  function unlock(){try{const b=ctx.createBuffer(1,1,ctx.sampleRate),s=ctx.createBufferSource();s.buffer=b;s.connect(ctx.destination);s.start(0);unlocked=performance.now();}catch(e){}}
  function rebuildAudio(){try{clearInterval(timer);timer=null;}catch(e){}const old=ctx;try{old.close();}catch(e){}
    ctx=null;ambG=null;for(const k in AMB)delete AMB[k];for(const k in AMBON)delete AMBON[k];for(const k in AMBQ)delete AMBQ[k];
    if(!init())return;master.gain.value=vol;timer=setInterval(tick,25);try{ctx.resume();}catch(e){}unlock();hurt=false;diag("audio: context rebuilt (in a tap)");}
  function wake(e){const fromTap=!!(e&&e.type&&/pointer|touch|key|click/.test(e.type));if(!ctx||!on||document.hidden)return;
    // in a tap after an interruption (or a stuck clock): start a fresh context right here, inside the gesture
    // Safari only counts touchend / click / pointerup / keydown as a real gesture for audio (not touchstart / pointerdown)
    const act=!!(e&&e.type&&/touchend|click|pointerup|keydown/.test(e.type));
    // one tap fires pointerup, touchend and click: a context made in the last second is still starting, so it is
    // resumed rather than replaced again (iPhone used to rebuild it three times on the first tap)
    const young=performance.now()-ctxBorn<1000;
    if(act&&!young&&(hurt||ctx.state!=="running"||(stuckSince&&performance.now()-stuckSince>1500))){stuckSince=0;rebuildAudio();return;}
    if(act&&!unlocked)unlock();
    try{if(ctx.state!=="running"){const p=ctx.resume();if(p&&p.catch)p.catch(()=>{});}
      else if(fromTap&&stuckSince&&performance.now()-stuckSince>1500){stuckSince=0;ctx.suspend().then(()=>ctx.resume()).catch(()=>{});}
      if(!timer)timer=setInterval(tick,25);master.gain.setTargetAtTime(vol,ctx.currentTime,0.1);}catch(e){}}
  function watchdog(){if(!ctx||!on||document.hidden)return;
    if(ctx.state!=="running"){wake();return;}
    const ct=ctx.currentTime;if(ct===lastCT){if(!stuckSince)stuckSince=performance.now();}else stuckSince=0;lastCT=ct;}
  function setVol(v){vol=v;if(ctx&&on)master.gain.setTargetAtTime(vol,ctx.currentTime,0.05);}
  function fadeTo(k){target=k;switchedAt=ctx.currentTime;const t=ctx.currentTime;
    if(k==="intense"){const v=pickIntense();seqs.intense.cur=v;seqs.intense.bpm=v.bpm;seqs.intense.step=0;seqs.intense.next=t+0.05;const b=document.getElementById("v2sound");if(b)b.title="Now playing: upset ("+v.name+")";}
    else{seqs.chill.step=Math.ceil(seqs.chill.step/64)*64;const b=document.getElementById("v2sound");if(b&&AUDIO_NOW)b.title="Now playing: "+AUDIO_NOW;}
    chillG.gain.setTargetAtTime(k==="chill"?1:0.0001,t,k==="chill"?1.2:0.35);intG.gain.setTargetAtTime(k==="intense"?1:0.0001,t,k==="intense"?0.3:1.2);}
  // switch to intense as soon as something goes wrong; ease back to chill after a few calm seconds
  function update(intense){if(!ctx||!on)return;watchdog();const now=performance.now();
    if(intense){calmSince=0;if(target!=="intense")fadeTo("intense");}
    else if(target==="intense"){if(!calmSince)calmSince=now;if(now-calmSince>4000)fadeTo("chill");}}
  // sound effects
  const FX={
    alarm:t=>{for(let k=0;k<3;k++){tone(t+k*0.32,sfxBus,"square",880,0.14,0.08);tone(t+k*0.32+0.16,sfxBus,"square",660,0.14,0.08);}},
    fire:t=>{const w=nz(t,1.6,sfxBus,0.35,"bandpass",300,0.6,0.25);w.fl.frequency.exponentialRampToValueAtTime(1800,t+1.2);for(let k=0;k<10;k++)nz(t+Math.random()*1.8,0.03,sfxBus,0.1+Math.random()*0.2,"highpass",2500);FX.alarm(t+0.2);},
    clunk:t=>{tone(t,sfxBus,"sine",90,0.5,0.6,0.002,40);[220,331,467].forEach(f=>tone(t+0.01,sfxBus,"triangle",f,1.1,0.08));const g=nz(t+0.1,1.4,sfxBus,0.18,"bandpass",900,4);g.fl.frequency.linearRampToValueAtTime(400,t+1.4);},
    snap:t=>{nz(t,0.08,sfxBus,0.5,"highpass",3000);tone(t+0.02,sfxBus,"sine",110,0.25,0.4,0.002,50);tone(t+0.3,sfxBus,"square",988,0.12,0.06);tone(t+0.45,sfxBus,"square",988,0.12,0.06);},
    hayout:t=>{const f=nz(t,1.8,sfxBus,0.4,"bandpass",500,1.5,0.05);f.fl.frequency.exponentialRampToValueAtTime(4000,t+1.0);
      nz(t+0.05,0.25,sfxBus,0.35,"highpass",1800);for(let k=0;k<6;k++)nz(t+0.3+Math.random()*1.4,0.05,sfxBus,0.08,"bandpass",2500+Math.random()*2000,3);},
    water:t=>{nz(t,0.9,sfxBus,0.35,"bandpass",1100,0.7,0.02);for(let k=0;k<10;k++){const s=t+0.1+Math.random()*0.8,f=300+Math.random()*500;tone(s,sfxBus,"sine",f,0.08,0.06,0.003,f*1.8);}},
    steam:t=>{nz(t,0.25,sfxBus,0.4,"highpass",1200);const a=nz(t+0.05,4.2,sfxBus,0.55,"bandpass",2600,0.45,0.08);a.fl.frequency.setValueAtTime(2600,t+2.5);a.fl.frequency.exponentialRampToValueAtTime(1300,t+4.2);
      nz(t+0.05,4.0,sfxBus,0.3,"lowpass",500,0.6,0.1);tone(t,sfxBus,"sine",70,0.6,0.4,0.004,40);},
    siren:t=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";for(let k=0;k<4;k++){o.frequency.setValueAtTime(650,t+k*0.6);o.frequency.linearRampToValueAtTime(1250,t+k*0.6+0.3);o.frequency.linearRampToValueAtTime(650,t+k*0.6+0.6);}
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.09,t+0.05);g.gain.setValueAtTime(0.09,t+2.2);g.gain.exponentialRampToValueAtTime(0.0001,t+2.5);o.connect(g);g.connect(sfxBus);o.start(t);o.stop(t+2.6);},
    thunder:t=>{nz(t,0.12,sfxBus,0.7,"highpass",1500);const r=nz(t+0.05,3.2,sfxBus,0.8,"lowpass",900,0.5,0.03);r.fl.frequency.exponentialRampToValueAtTime(80,t+3.2);tone(t+0.05,sfxBus,"sine",55,2.0,0.5,0.01,30);},
    wind:t=>{const w=nz(t,4.5,sfxBus,0.4,"bandpass",350,3,0.8);for(let k=0;k<6;k++)w.fl.frequency.linearRampToValueAtTime(k%2?900:300,t+0.7*(k+1));},
    chomp:t=>{for(let k=0;k<4;k++){tone(t+k*0.22,sfxBus,"sine",140,0.12,0.4,0.002,60);nz(t+k*0.22,0.1,sfxBus,0.25,"bandpass",1800,1.5);}},
    whistle:t=>{for(let k=0;k<2;k++)for(let j=0;j<(k?14:7);j++)tone(t+k*0.42+j*0.036,sfxBus,"sine",j%2?2750:3080,0.045,0.11);nz(t,0.9,sfxBus,0.05,"bandpass",3000,2);},
    cash:t=>{tone(t,sfxBus,"sine",1318,0.35,0.15);tone(t+0.08,sfxBus,"sine",1760,0.5,0.15);nz(t,0.06,sfxBus,0.15,"highpass",5000);},
    win:t=>{[60,64,67,72,76,79,84].forEach((m,k)=>tone(t+k*0.11,sfxBus,"triangle",mtof(m),0.5,0.14));},
    lose:t=>{[[55,0.5],[54,0.5],[53,0.5],[52,1.4]].reduce((tt,[m,d])=>{const o=tone(tt,sfxBus,"sawtooth",mtof(m),d,0.08,0.02);if(d>1)o.o.frequency.linearRampToValueAtTime(mtof(m)*0.97,tt+d);return tt+d;},t);},
  };
  const EVSFX={refclash:"snap",fogfan:"clunk",shaft:"clunk",fabric:"clunk",felt:"clunk",winderdown:"clunk",lwplug:"clunk",cscreen:"clunk",fscreen:"clunk",lcplug:"water",hdblow:"water",boiler:"steam",steamjoint:"steam",permit:"alarm",thkblow:"water",wrap:"snap",flares:"fire",ragger:"clunk",dryerfire:"fire",balefire:"fire",overflow:"water",chestover:"water",roof:"water",fight:"siren",highway:"siren",lightning:"thunder",tornado:"wind",beaver:"chomp",runner:"whistle"};
  // plant PA: a two-tone chime, then a muffled voice (formant-filtered babble through a band-limited, slightly overdriven horn speaker with a hall echo)
  const VOW=[[730,1090],[270,2290],[530,1840],[570,840],[440,1020],[300,870],[660,1720],[490,1350]];
  function paAnnounce(t){const out=ctx.createGain();out.gain.value=0.55;const hp=ctx.createBiquadFilter();hp.type="highpass";hp.frequency.value=450;const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1900;lp.Q.value=1.2;
    const ws=ctx.createWaveShaper(),cv=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cv[i]=Math.tanh(2.6*x);}ws.curve=cv;
    const dl=ctx.createDelay(1),fb=ctx.createGain(),wet=ctx.createGain();dl.delayTime.value=0.21;fb.gain.value=0.36;wet.gain.value=0.5;
    out.connect(hp);hp.connect(ws);ws.connect(lp);lp.connect(sfxBus);lp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(sfxBus);
    const chime=(tt,f)=>{tone(tt,lp,"sine",f,1.3,0.22,0.01);tone(tt,lp,"sine",f*2,0.6,0.05,0.01);};chime(t,784);chime(t+0.5,622);
    let tt=t+1.7;const phrases=1+Math.floor(Math.random()*2);
    for(let ph=0;ph<phrases;ph++){const words=4+Math.floor(Math.random()*5);let f0=150+Math.random()*30;
      for(let w=0;w<words;w++){const syl=1+Math.floor(Math.random()*3);
        for(let k=0;k<syl;k++){const d=0.09+Math.random()*0.12,v=VOW[Math.floor(Math.random()*VOW.length)],f=f0*(1+(Math.random()-0.5)*0.08)*(k===0&&w%3===0?1.08:1);
          const o=ctx.createOscillator();o.type="sawtooth";o.frequency.setValueAtTime(f,tt);o.frequency.linearRampToValueAtTime(f*0.94,tt+d);
          const g=ctx.createGain();g.gain.setValueAtTime(0.0001,tt);g.gain.exponentialRampToValueAtTime(0.5,tt+0.02);g.gain.setValueAtTime(0.5,tt+d*0.7);g.gain.exponentialRampToValueAtTime(0.0001,tt+d+0.04);
          v.forEach((F,j)=>{const b=ctx.createBiquadFilter();b.type="bandpass";b.frequency.value=F*(0.95+Math.random()*0.1);b.Q.value=j?9:6;const bg=ctx.createGain();bg.gain.value=j?0.6:1;o.connect(b);b.connect(bg);bg.connect(g);});
          g.connect(out);o.start(tt);o.stop(tt+d+0.06);
          if(Math.random()<0.45)nz(tt-0.03,0.05,out,0.18,"bandpass",2800+Math.random()*1500,1.2,0.005);
          tt+=d+0.015;}
        tt+=0.05+Math.random()*0.09;f0*=0.985;}
      tt+=0.35;}}
  FX.pa=paAnnounce;let paNext=0;
  function sfx(name,gap=1200){if(!ctx||!on||!FX[name])return;const now=performance.now();if(now-(last[name]||0)<gap||now-(last._any||0)<250)return;last[name]=now;last._any=now;FX[name](ctx.currentTime+0.02);}
  // tools/musictest.py: schedule every piece's every step (exceptions surface here, not in a player's session) and read the output level
  let meter=null;function level(){if(!ctx)return -1;if(!meter){meter=ctx.createAnalyser();meter.fftSize=2048;master.connect(meter);const z=ctx.createGain();z.gain.value=0;meter.connect(z);z.connect(ctx.destination);}const a=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(a);let q=0;for(let i=0;i<a.length;i++)q+=a[i]*a[i];return Math.sqrt(q/a.length);}
  function selfTest(){if(!ctx&&!init())return {error:"no audio"};const out=[],t0=ctx.currentTime+0.3;
    for(const env in ENVROT)for(const so of ENVROT[env]){const s={bpm:so.bpm,local:0};const beat=60/so.bpm/4;try{songStarted(so);for(let st=0;st<so.bars*16;st++)so.play(st,t0+st*beat*0.02,s);out.push(env+": "+so.name+" ok");}catch(e){out.push(env+": "+so.name+" ERROR "+e.message);}}
    for(const key in INTENSE){const v=INTENSE[key];for(let pi=0;pi<v.P.length;pi++){const cur={name:key,bpm:v.bpm,play:v.play,P:v.P[pi],B:v.B?v.B[pi]:null,fill:pi%2===0,roll:ROLLS[pi%ROLLS.length]},s={bpm:v.bpm},beat=60/v.bpm/4;
      try{for(let st=0;st<64;st++)cur.play(cur,st,t0+st*beat*0.02,s);out.push("upset "+key+"/"+pi+" ok");}catch(e){out.push("upset "+key+"/"+pi+" ERROR "+e.message);}}}
    return out;}
  return {setOn,setVol,update,sfx,ambient,event:id=>sfx(EVSFX[id]||"alarm"),selfTest,level,get ctx(){return ctx;},get master(){return master;},get on(){return on;},get now(){return target==="intense"?"upset: "+(seqs.intense.cur?seqs.intense.cur.name:"")+" / "+AUDIO_NOW:AUDIO_NOW;},get info(){return ctx?ctx.state+" t="+ctx.currentTime.toFixed(1)+(stuckSince?" (clock stuck)":"")+(hurt?" (needs a tap)":"")+(unlocked?" unlocked "+((performance.now()-unlocked)/1000).toFixed(0)+"s ago":" never unlocked"):"none";}};
})();

const GRADES={ "23m":{sp:2736,bw:24.55}, "26m":{sp:2433,bw:26.06}, "30m":{sp:2222,bw:30.05}, "33HT":{sp:2084,bw:33.08} };
// cost mix per grade: heavier, high-test grades need more strong DLK fiber, more starch and more drying steam (steam from PM3
// 3rd-section steam by grade), and break less. Balanced so no grade earns more than ~5% over another at base level.
// mix = campaign size range in tons; the market-driven planner runs the real grade wheel at roughly the PM3 grade mix.
const GCOST={"23m":{dlk:0,steam:1,chem:0,brk:1.15,mix:[2600,3600]},"26m":{dlk:0.1,steam:1.02,chem:0,brk:1.25,mix:[80,160]},
  "30m":{dlk:0.25,steam:1.14,chem:10,brk:0.75,mix:[150,350]},"33HT":{dlk:0.55,steam:1.11,chem:75,brk:0.55,mix:[800,1300]}};
const OCCG={occ11:{p:160,y:0.88},dlk:{p:215,y:0.93}};
const WHEEL=["23m","26m","30m","33HT","30m"];
