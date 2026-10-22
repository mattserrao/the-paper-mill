/* ---- v6.11 the cross-direction (CD) profile, quality per roll, the steam box and the remoisturizing spray boom ----
   (plan: claude/trim-cd-plan.md) The QCS scanner reads the sheet in 12 CD zones across the web (zone 1 on the drive side).
   Each zone's moisture is the reel average plus its own deviation: dry edges, a slow travelling wave, now and then a wet
   streak, and wet bands under a filled-in pick-up felt (07b). Each zone's basis weight deviates by a small natural streak
   plus the headbox dilution zones (07b knob).
   Three CD actuators level the profile, each AUTO (the default: it holds the profile and there is nothing to touch) or MAN
   (the player sets each zone):
     headbox dilution zones  -> basis weight streaks (the auto trim; the fiddly knob's own zone moves come on top)
     steam box (an upgrade)  -> wet streaks and wet edges: steam heats the sheet in that zone so it drains better; the
                                whole box also adds CD.sbCouch points of couch solids (07b dewater) and some machine speed
     spray boom (standard)   -> dry streaks: water nozzles after the dryers bring a dry zone back up
   Quality per roll: the two twin rolls each cover their span of the web (03g). A zone out of spec (moisture outside the
   grade's band, or weight more than CD.bwTol off the setpoint) sends the roll under it to the beater; its twin ships. A
   zone mostly in the trim costs nothing. A wet edge narrower than the edge trim is slit off with it. Problems across the
   whole sheet (average weight, ring crush, color, a grade change) still beater the whole set (07e).
   No dice: the disturbances are smooth functions of time, like the DCS readings, so every stream keeps its timing.
   Season, survival and free play; zen keeps the old whole-reel checks. ---- */
const CD={n:12,lag:6,spMax:2.6,sbMax:2.4,sbCouch:1.5,sbSteam:0.1,bwTol:0.03,edgeA:3.6,edgeB:1.0,cover:0.25};
const cdOn=()=>!!(S&&!S.zen);
// standard couch and press solids (%), with the steam box's extra drainage (used wherever the knobs haven't moved, 07b/d/f/g)
function csStd(){return 19+CD.sbCouch*LV("steambox");}
function psStd(){return 44+4*LV("shoe")+CD.sbCouch*LV("steambox");}
const sbHave=()=>LV("steambox")>0;
const z12=v=>Array(12).fill(v);
function cdState(){if(!S.cd)S.cd={sp:z12(0),sb:z12(0),dil:z12(0),dv:z12(0),bw:z12(0),man:{sp:false,sb:false,dil:false},ms:{sp:z12(0),sb:z12(0),dil:z12(0)},
    edge:[0,0],off:[[],[]],spell:["",""]};return S.cd;}
// natural moisture deviation of zone z (% points)
function cdDist(z,t){let d=(z===0||z===11)?-1.3:(z===1||z===10)?-0.45:0;
  d+=1.5*Math.sin(t/211+z*1.31)*Math.sin(t/857+z*0.73);
  const k=Math.floor((t/1440*1.7)%12),w=Math.max(0,Math.sin(t/313)),on=Math.max(0,Math.sin(t/2311+0.6));if(z===k)d+=2.6*w*w*on*on;   // now and then (on), a wet streak that wanders across the machine
  return d;}
// natural basis weight streak of zone z (lb)
const cdBwDist=(z,t)=>0.9*Math.sin(t/377+z*2.1)*Math.sin(t/1201+z*0.4);
function cdTick(dt){if(!cdOn())return;const C2=cdState(),t=S.t,K=S.knob,x=K&&K.any?K.x:null,k=Math.min(1,dt/CD.lag);
  const fs=x&&x.st>0.4?(x.st-0.4)/0.4*3.2:0;   // a filled-in pick-up felt: wet bands in zones 5 and 8
  const eRaw=[0,1].map(s=>Math.max(0,CD.edgeA*Math.sin(t/127+s*2.3)*Math.sin(t/509+1+s*1.7)-CD.edgeB));   // the wet edge bands before the steam box
  for(let z=0;z<12;z++){const d=cdDist(z,t)+((z===4||z===7)?fs:0),eN=z===0?eRaw[0]:z===11?eRaw[1]:0;
    const spT=C2.man.sp?C2.ms.sp[z]/100:clamp(-(d-(sbHave()&&!C2.man.sb?CD.sbMax*clamp(eN/3.5,0,1):0))/CD.spMax,0,1),sbT=!sbHave()?0:C2.man.sb?C2.ms.sb[z]/100:clamp(Math.max(d/CD.sbMax,eN/3.5),0,1);
    C2.sp[z]+=(spT-C2.sp[z])*k;C2.sb[z]+=(sbT-C2.sb[z])*k;if(!sbHave())C2.sb[z]=0;
    C2.dv[z]=d+CD.spMax*C2.sp[z]-CD.sbMax*C2.sb[z];
    const bd=cdBwDist(z,t),dT=C2.man.dil?C2.ms.dil[z]/100*1.5:-bd;C2.dil[z]+=(dT-C2.dil[z])*k;
    C2.bw[z]=bd+C2.dil[z]+(x&&x.z?x.z[z]*0.35:0);}
  for(let s=0;s<2;s++)C2.edge[s]=Math.max(0,eRaw[s]-(sbHave()?3.5*C2.sb[s?11:0]:0));
  // the steam box's steam (a share of the dryers' own bill: CD.sbSteam a ton for each zone at full output)
  if(sbHave()&&S.pm==="run"&&(S.rates.prod||0)>0){const u=C2.sb.reduce((a,v)=>a+v,0)/12,v=u*CD.sbSteam*S.rates.prod*dt/60*Math.max(0,energyCostT()-pfChemT());   /* (v6.11.2: steam's rate) */if(v>0){spend(v,"energy");pfAdd("steam","pm",v);}}}
// what each roll of the set has wrong: [[DS roll reasons],[TS roll reasons]] (empty = on spec)
function cdRolls(){const C2=cdState(),W=S.wdW||windW(C.grade),web=webW(),tr=(web-2*W)/2,zw=web/12,mA=QNOW.m,sp=QSPEC[C.grade]||QSPEC["24"],bwT=CD.bwTol*bwSp();
  const R=[[tr,tr+W],[tr+W,tr+2*W]],off=[[],[]];
  for(let z=0;z<12;z++){const a=z*zw,b=a+zw,m=mA+C2.dv[z],why=m>sp.m[1]?"wet streak":m<sp.m[0]?"dry streak":Math.abs(C2.bw[z])>bwT?"weight streak":"";if(!why)continue;
    for(let r=0;r<2;r++)if(Math.min(b,R[r][1])-Math.max(a,R[r][0])>zw*CD.cover)off[r].push(why+" (zone "+(z+1)+")");}
  for(let s=0;s<2;s++)if(C2.edge[s]>tr)off[s].push("wet edge");
  return off;}
const CDSIDE=["DS","TS"];
// the share of the reel to the beater for the CD problems, with the log and the banner once a spell
function cdOff(){if(!cdOn()||S.pm!=="run")return 0;const C2=cdState(),o=cdRolls();C2.off=o;let n=0;
  for(let s=0;s<2;s++){const why=o[s].length?o[s][0]:"";if(why)n++;
    if(why&&!C2.spell[s]){qualAlert(`${CDSIDE[s]} roll ${why}`);}else if(!why&&C2.spell[s])log(`QCS: the ${CDSIDE[s]} roll is back on spec.`,"ok");C2.spell[s]=why;}
  return n/2;}
function cdWhy(){const C2=S.cd;if(!C2)return "";return [0,1].filter(s=>C2.off[s]&&C2.off[s].length).map(s=>CDSIDE[s]+" roll: "+C2.off[s][0]).join(" · ");}
// the player's moves on the QCS CD tab
function cdSetMan(row,on){const C2=cdState();if(row==="sb"&&!sbHave())return;C2.man[row]=!!on;if(on){const src=row==="sp"?C2.sp:row==="sb"?C2.sb:C2.dil;C2.ms[row]=src.map(v=>Math.round(clamp(v*(row==="dil"?100/1.5:100),-100,100)));}}
function cdSetZone(row,z,v){const C2=cdState();if(row==="sb"&&!sbHave())return;C2.man[row]=true;C2.ms[row][z]=Math.round(clamp(v,row==="dil"?-100:0,100));}
