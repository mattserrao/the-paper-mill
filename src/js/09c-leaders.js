/* ---------- v4.4 survival mode: mill leaders (roster, portraits, picker, card, outage pick, change, Dot's fix) ----------
   Numbers and effects are in 03d-leaders.js. The portraits are flat inline SVG on a 120 x 140 card, drawn so that the
   square 30,26 to 90,86 frames the face (the avatar on the wave chip). Mill kit (caps, vests) takes the mill's colour. */
const LEADERS={
  chip:{name:"Chip Kraftwell",title:"The dealmaker",role:"Business man",say:"Everything's negotiable.",
    plus:()=>`Each outage, one deal that stays: fibre −${pct1(LEAD.fibre)}% or +$${LEAD.sales}/t on every grade.`,
    minus:()=>`Labour relations: every deal ends in a pay settlement (wages +${pct1(LEAD.wage)}% for good), and call-offs and dock brawls come ${LEAD.strife0}× as often while he's in charge.`},
  dot:{name:'Dot "Doc" Blade',title:"The millwright",role:"Mechanic",say:"If it turns, I can fix it.",
    plus:()=>"Fix it now: once per outage cycle, end one breakdown on the spot and get its repair bill back. Fixed for good: that breakdown never returns.",
    minus:()=>`Gold-plates every job: repair bills cost ${pct1(LEAD.bills-1)}% more while she's in charge.`},
  fel:{name:"Felicity Fourdrinier",title:"The process engineer",role:"Engineer",say:"I have a spreadsheet for that.",
    plus:()=>`Each outage, one project that stays: stock prep (fibre −${pct1(LEAD.pyield)}%), wet end (sheet breaks −${pct1(LEAD.pwetB)}%) or dry end (energy −${pct1(LEAD.pdryE)}%). Each also cuts that area's breakdowns ${pct1(LEAD.proj)}%.`,
    minus:()=>`Project staff: every project adds $${LEAD.payroll}/h to the payroll for good.`},
  hank:{name:"Hank Headbox",title:"The machine tender",role:"Operator",say:"She'll tell you what she wants.",
    plus:()=>`Each outage, one gain that stays: +${LEAD.speed} fpm top speed, or sheet breaks and hayouts −${pct1(LEAD.clean)}%.`,
    minus:()=>`Runs it hot and heavy: energy +${pct1(LEAD.hot0)}% and fibre +${pct1(LEAD.heavy)}% while he's in charge.`}};
const LEAD_ART={
  chip:`<rect width="120" height="140" fill="#f1dfbd"/><circle cx="24" cy="26" r="30" fill="#f7ecd3"/>
    <path d="M8 140C8 114 28 101 47 97h26c19 4 39 17 39 43z" fill="#7b5028"/>
    <g stroke="#a47a48" stroke-width="1" opacity=".7"><path d="M20 112v28M30 105v35M90 105v35M100 112v28M40 101v39M80 101v39"/></g>
    <path d="M47 97l13 16 13-16z" fill="#fbf8f0"/><path d="M47 97l-9 6 14 24 8-14zM73 97l9 6-14 24-8-14z" fill="#5d3b1c"/>
    <path d="M56 106h8l3 34H53z" fill="#c9903f"/><path d="M55 113l5 3 5-3M54.5 120l5.5 3 5.5-3M54 127l6 3 6-3M53.5 134l6.5 3 6.5-3" fill="none" stroke="#7b5028" stroke-width="1.6"/>
    <path d="M56 106l4 5 4-5z" fill="#a8742e"/>
    <rect x="52" y="78" width="16" height="22" rx="7" fill="#dfae86"/>
    <ellipse cx="39.5" cy="60" rx="4" ry="6" fill="#eec29b"/><ellipse cx="60" cy="58" rx="21" ry="24" fill="#f3c9a3"/>
    <path d="M39 52c0-17 12-22 23-22 10 0 19 6 19 20-6-8-18-9-27-6-6 2-11 4-15 8z" fill="#2a2018"/><path d="M48 37c8-4 18-4 26 2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
    <g transform="rotate(-9 60 30)"><path d="M38 33c0-13 10-20 22-20s22 7 22 20z" fill="#fdfdfb"/><path d="M33 32.5h54a2.6 2.6 0 0 1 0 5.2H33a2.6 2.6 0 0 1 0-5.2z" fill="#e9e9e3"/><path d="M60 13v19.5" stroke="#dcdcd4" stroke-width="2"/>
      <rect x="66" y="19" width="12" height="8" rx="1.5" fill="#f28c28"/><text x="72" y="25.6" font-size="7" font-weight="800" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif">$</text></g>
    <path d="M46 49c3-2.5 7-2.5 9.5-.5M65 47.5c3-2 7-1.5 9.5 1" fill="none" stroke="#2a2018" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="51" cy="55" r="2.3" fill="#2a2018"/><circle cx="69" cy="54.5" r="2.3" fill="#2a2018"/>
    <path d="M60 56c2 4 3 7 1 9-1 .8-2.5 .8-3.5 .2" fill="none" stroke="#c9976f" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M47 67c8 3 18 3 26-1-1 9-7 13-13 13s-12-4-13-12z" fill="#7a2b22"/><path d="M48.5 67.8c8 2.5 16 2.4 23.5-.8l-.8 4.2c-7 2.3-15 2.3-21.7 .4z" fill="#fff"/><rect x="62.5" y="68.6" width="4" height="3.8" fill="#f2c230"/>
    <rect x="80" y="44" width="11" height="30" rx="3.5" fill="#23262d"/><rect x="82" y="47" width="7" height="2" rx="1" fill="#5b6270"/>
    <path d="M78 66c-2-6 2-10 7-9 6 1 9 6 8 12-1 5-6 8-10 6z" fill="#f3c9a3"/><path d="M82 62h8M82 66.5h9M83 71h7" stroke="#dfae86" stroke-width="1.3" stroke-linecap="round"/>`,
  dot:`<rect width="120" height="140" fill="#d5e0ea"/><circle cx="98" cy="24" r="30" fill="#e6eef5"/>
    <path d="M97 138L101 44" stroke="#c23b2e" stroke-width="10" stroke-linecap="round"/><path d="M97 138L98.3 108" stroke="#9c2c22" stroke-width="10" stroke-linecap="round"/>
    <circle cx="100.5" cy="30" r="14" fill="#8a94a1"/><path d="M95 12h11v17a5.5 5.5 0 0 1-11 0z" fill="#e6eef5"/><path d="M90 37a14 14 0 0 0 21 0" fill="none" stroke="#6f7884" stroke-width="2"/>
    <path d="M8 140C8 114 28 101 47 97h26c19 4 39 17 39 43z" fill="#2f4d70"/><path d="M47 97l13 14 13-14 6 3-19 20-19-20z" fill="#24405f"/><path d="M60 117v23" stroke="#24405f" stroke-width="2"/>
    <rect x="68" y="114" width="26" height="13" rx="2.5" fill="#fbf8f0"/><text x="81" y="124" font-size="9" font-weight="800" text-anchor="middle" fill="#c23b2e" font-family="Arial,sans-serif" letter-spacing=".5">DOC</text>
    <rect x="52" y="78" width="16" height="22" rx="7" fill="#b0764a"/>
    <path d="M40 60c-3 10-1 22 6 30M80 60c3 10 1 22-6 30" fill="none" stroke="#f28c28" stroke-width="1.8"/>
    <path d="M38 50c-4 6-4 16 0 22l6-2V52zM82 50c4 6 4 16 0 22l-6-2V52z" fill="#2a1c14"/>
    <ellipse cx="39.5" cy="61" rx="4" ry="6" fill="#bb7f52"/><ellipse cx="80.5" cy="61" rx="4" ry="6" fill="#bb7f52"/><circle cx="39" cy="62" r="2.3" fill="#f28c28"/><circle cx="81" cy="62" r="2.3" fill="#f28c28"/>
    <ellipse cx="60" cy="58" rx="21" ry="24" fill="#c98d5e"/>
    <path d="M38.5 50c0-13 10-19 21.5-19s21.5 6 21.5 19c-13-6-30-6-43 0z" fill="#d2433a"/><path d="M38.5 50c13-6 30-6 43 0l-.6 3.5c-13-5.5-29-5.5-41.8 0z" fill="#b5342c"/>
    <path d="M80 44l11-6-2 9 8 5-12 1z" fill="#d2433a"/><circle cx="81" cy="46" r="3" fill="#b5342c"/>
    <g fill="#fff" opacity=".85"><circle cx="50" cy="38" r="1.3"/><circle cx="60" cy="35.5" r="1.3"/><circle cx="70" cy="38" r="1.3"/><circle cx="55" cy="43" r="1.3"/><circle cx="65" cy="43" r="1.3"/></g>
    <circle cx="51" cy="60" r="2.3" fill="#2a1c14"/><circle cx="69" cy="60" r="2.3" fill="#2a1c14"/>
    <rect x="42.5" y="54" width="16" height="12" rx="4" fill="#bfe3f5" fill-opacity=".4" stroke="#2c3138" stroke-width="2"/><rect x="61.5" y="54" width="16" height="12" rx="4" fill="#bfe3f5" fill-opacity=".4" stroke="#2c3138" stroke-width="2"/><path d="M58.5 59h3M42.5 58l-4-1.5M77.5 58l4-1.5" stroke="#2c3138" stroke-width="2" stroke-linecap="round"/>
    <path d="M45 56.5l4-1.5M64 56.5l4-1.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
    <path d="M60 63c1.5 3 2 5 .5 6.5" fill="none" stroke="#a66f43" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M52 73c4 3 10 3.5 16-1.5" fill="none" stroke="#5a2f1c" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="74" cy="68.5" rx="4.6" ry="2.3" transform="rotate(28 74 68.5)" fill="#1d1d1d" opacity=".38"/><ellipse cx="45" cy="50" rx="2.6" ry="1.3" transform="rotate(-20 45 50)" fill="#1d1d1d" opacity=".3"/>`,
  fel:`<rect width="120" height="140" fill="#d3ebe5"/><circle cx="22" cy="24" r="30" fill="#e4f4f0"/>
    <path d="M36 62c-3 14-1 28 6 36h36c7-8 9-22 6-36z" fill="#8c4a26"/>
    <path d="M8 140C8 114 28 101 47 97h26c19 4 39 17 39 43z" fill="#fbfaf5"/>
    <path d="M47 97l13 18 13-18 5 2-6 41H48l-6-41z" style="fill:var(--brand,#2e7d4f)"/><path d="M44 118l32-0v6H45z" fill="#d9dee3"/><path d="M47 97l13 18 13-18z" fill="#f4e9da"/>
    <path d="M42 99l-8 5 12 36h3zM78 99l8 5-12 36h-3z" fill="#e9e7df"/>
    <rect x="18" y="116" width="15" height="13" rx="1.5" fill="#fbfaf5" stroke="#d2d0c8" stroke-width="1.2"/><path d="M21 110v9M25.5 109v10M30 111v8" stroke-width="2.6" stroke-linecap="round" fill="none" stroke="#2f6fd0"/><path d="M25.5 109v10" stroke="#d2433a" stroke-width="2.6" stroke-linecap="round"/><path d="M30 111v8" stroke="#23262d" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="52" y="78" width="16" height="22" rx="7" fill="#dfb690"/>
    <ellipse cx="39.5" cy="60" rx="4" ry="6" fill="#ecc7a2"/><ellipse cx="80.5" cy="60" rx="4" ry="6" fill="#ecc7a2"/>
    <ellipse cx="60" cy="58" rx="21" ry="24" fill="#f2d0ae"/>
    <path d="M39 56c-1-10 3-17 8-19 8 5 20 6 34 3 1 5 1 11 0 16-2-6-5-9-9-10-9 2-19 1-25-2-4 3-6 7-8 12z" fill="#8c4a26"/>
    <path d="M37 37c0-14 10-22 23-22s23 8 23 22z" fill="#fdfdfb"/><path d="M32 36.5h56a2.7 2.7 0 0 1 0 5.4H32a2.7 2.7 0 0 1 0-5.4z" fill="#e9e9e3"/><path d="M60 15v21.5" stroke="#dcdcd4" stroke-width="2"/>
    <circle cx="48" cy="27" r="4" fill="#f2c230"/><rect x="66" y="21" width="9" height="7" rx="1.5" fill="#2f6fd0"/><path d="M52 33l4-5 4 5z" fill="#d2433a"/><circle cx="72.5" cy="32.5" r="2.4" fill="#3aa66a"/>
    <path d="M77 46l12-9" stroke="#f2c230" stroke-width="3.4" stroke-linecap="round"/><path d="M88.2 37.6l2.3-1.7" stroke="#f08aa0" stroke-width="3.4" stroke-linecap="round"/><path d="M77 46l-1.8 1.3" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round"/>
    <path d="M45 50.5c3-2 7-2 9.5-.5M65.5 50c3-1.5 7-1.5 9.5 .5" fill="none" stroke="#6d371a" stroke-width="2" stroke-linecap="round"/>
    <circle cx="51" cy="59" r="2.2" fill="#2a2018"/><circle cx="69" cy="59" r="2.2" fill="#2a2018"/>
    <circle cx="51" cy="59" r="8.2" fill="#fff" fill-opacity=".25" stroke="#3a3a3a" stroke-width="2"/><circle cx="69" cy="59" r="8.2" fill="#fff" fill-opacity=".25" stroke="#3a3a3a" stroke-width="2"/><path d="M59.2 58.5h1.6M42.8 58l-3.3-1M77.2 58l3.3-1" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round"/>
    <path d="M60 64c1.4 2.6 1.6 4.2 .4 5.4" fill="none" stroke="#cfa27d" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M53 73.5c4 3.5 10 3.5 14 0" fill="none" stroke="#a23f3a" stroke-width="2.4" stroke-linecap="round"/>
    <g transform="rotate(9 92 118)"><rect x="76" y="100" width="32" height="40" rx="3" fill="#a9763f"/><rect x="79" y="105" width="26" height="33" rx="1.5" fill="#fff"/><rect x="86" y="97" width="12" height="6" rx="2" fill="#7d8794"/>
      <path d="M82 131l5-7 4 3 5-10 6 4" fill="none" stroke="#2e9b63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M82 111h20M82 115.5h14" stroke="#c9ccd2" stroke-width="1.6" stroke-linecap="round"/></g>
    <ellipse cx="80" cy="128" rx="6.5" ry="5.5" fill="#f2d0ae"/>`,
  hank:`<rect width="120" height="140" fill="#e8e1cb"/><circle cx="98" cy="24" r="30" fill="#f2edde"/>
    <path d="M8 140C8 114 28 101 47 97h26c19 4 39 17 39 43z" fill="#6c7580"/>
    <path d="M47 97l-17 7c-12 6-20 18-21 36h30l6-36zM73 97l17 7c12 6 20 18 21 36H81l-6-36z" style="fill:var(--brand,#2e7d4f)"/><path d="M14 124h26l-1 7H12zM80 124h26l2 7H81z" fill="#e3e6ea"/>
    <path d="M47 97c3 6 8 9 13 9s10-3 13-9z" fill="#dba77e"/>
    <path d="M44 84c8 8 24 8 32 0" fill="none" stroke="#23262d" stroke-width="5" stroke-linecap="round"/>
    <rect x="52" y="78" width="16" height="22" rx="7" fill="#d39e76"/>
    <rect x="34" y="82" width="13" height="18" rx="5.5" fill="#f28c28"/><rect x="73" y="82" width="13" height="18" rx="5.5" fill="#f28c28"/><rect x="36.5" y="85" width="4" height="12" rx="2" fill="#f6ad5c"/><rect x="75.5" y="85" width="4" height="12" rx="2" fill="#f6ad5c"/>
    <path d="M38.5 50c-3 5-3 12-1 17l5-1V51zM81.5 50c3 5 3 12 1 17l-5-1V51z" fill="#bcc0c6"/>
    <ellipse cx="39.5" cy="61" rx="4" ry="6" fill="#dca680"/><ellipse cx="80.5" cy="61" rx="4" ry="6" fill="#dca680"/>
    <ellipse cx="60" cy="58" rx="21" ry="24" fill="#e7b68e"/><circle cx="46.5" cy="66" r="4.5" fill="#e2917a" opacity=".45"/><circle cx="73.5" cy="66" r="4.5" fill="#e2917a" opacity=".45"/>
    <path d="M38.5 47c0-14 9-22 21.5-22s21.5 8 21.5 22c-13-4-30-4-43 0z" style="fill:var(--brand,#2e7d4f)"/><path d="M38.5 47c13-4 30-4 43 0l0 2.5c-13-3.5-30-3.5-43 0z" fill="#000" opacity=".18"/>
    <path d="M30 51c10-7 30-9 42-5l3 5c-14-2-30 0-43 6z" style="fill:var(--brand,#2e7d4f)"/><path d="M30 51c10-7 30-9 42-5l3 5c-14-2-30 0-43 6z" fill="#000" opacity=".28"/>
    <circle cx="60" cy="35.5" r="6" fill="#fbf8f0"/><circle cx="60" cy="35.5" r="2.2" fill="none" stroke="#6c7580" stroke-width="1.6"/>
    <path d="M44.5 55.5l10 1.5M65.5 57l10-1.5" stroke="#a9adb4" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M47.5 61.5c2-1.3 4.5-1.3 6.5 0M66 61.5c2-1.3 4.5-1.3 6.5 0" fill="none" stroke="#2a2018" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M60 60c2 4 3.5 7.5 1.5 9.5-1.2 1-3 1-4.3 .2" fill="none" stroke="#c98f68" stroke-width="2" stroke-linecap="round"/>
    <path d="M60 70c-5-2.5-13-1-17 6.5 6 1.5 12 1 17-2 5 3 11 3.5 17 2-4-7.5-12-9-17-6.5z" fill="#c9ccd2"/><path d="M47 75c4-2 8-2.5 12-1.5M73 75c-4-2-8-2.5-12-1.5" fill="none" stroke="#a9adb4" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M55 80c3 1.4 7 1.4 10 0" fill="none" stroke="#b7785a" stroke-width="1.8" stroke-linecap="round"/>
    <rect x="12" y="104" width="17" height="36" rx="4" fill="#2f6b4f"/><rect x="12" y="111" width="17" height="3" fill="#24553e"/><rect x="14" y="96" width="13" height="10" rx="2.5" fill="#c9ccd2"/><rect x="16" y="92" width="9" height="5" rx="1.5" fill="#a9adb4"/><rect x="15" y="116" width="3" height="18" rx="1.5" fill="#fff" opacity=".25"/>
    <ellipse cx="29" cy="124" rx="6" ry="7" fill="#e7b68e"/><path d="M26 120h6M25.5 124h7M26 128h6" stroke="#d39e76" stroke-width="1.3" stroke-linecap="round"/>`};
const leadSvg=(id,face)=>`<svg class="ldart${face?" face":""}" viewBox="${face?"30 26 60 60":"0 0 120 140"}" role="img" aria-label="${escHTML(LEADERS[id].name)}">${LEAD_ART[id]}</svg>`;
function leadStart(id){if(!LEADERS[id])return;S.lead={id,st:{fibre:0,sales:0,speed:0,clean:0,pstock:0,pwet:0,pdry:0},changed:false,was:null,fixW:0,fixed:[]};applyUpgrades();
  try{localStorage.setItem("paper-mill-leader",id);}catch(e){}
  BANNERS.push({text:`${LEADERS[id].name} runs the mill. "${LEADERS[id].say}"`,t:null,kind:"good",tag:"LEADER"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`${LEADERS[id].name}, ${LEADERS[id].title.toLowerCase()}, takes charge of the mill.`,"ok");}
// what the mill has kept so far, in words (the leader card and the outage dialog)
function leadTally(){const L=S.lead,out=[];if(!L)return out;const n=k=>L.st[k]||0,pc=v=>(v>=0?"+":"−")+Math.abs(Math.round(v*1000)/10)+"%";
  if(n("fibre"))out.push([`${n("fibre")} fibre contract${n("fibre")>1?"s":""}`,`fibre ${pc(Math.pow(1-LEAD.fibre,n("fibre"))-1)}`]);
  if(n("sales"))out.push([`${n("sales")} sales push${n("sales")>1?"es":""}`,`+$${LEAD.sales*n("sales")}/t`]);
  if(leadDeals())out.push(["Pay settlements",`wages ${pc(leadWage()-1)}`,1]);
  [["pstock","stock prep",()=>`fibre ${pc(Math.pow(1-LEAD.pyield,n("pstock"))-1)}`],["pwet","wet end",()=>`sheet breaks ${pc(Math.pow(1-LEAD.pwetB,n("pwet"))-1)}`],["pdry","dry end",()=>`energy ${pc(Math.pow(1-LEAD.pdryE,n("pdry"))-1)}`]]
    .forEach(([k,a,what])=>{if(n(k))out.push([`${n(k)} ${a} project${n(k)>1?"s":""}`,`${what()} · breakdowns ${pc(Math.pow(1-LEAD.proj,n(k))-1)}`]);});
  if(leadProjects())out.push(["Project staff",`+$${leadPayroll()}/h payroll`,1]);
  if(n("speed"))out.push([`${n("speed")} push${n("speed")>1?"es":""} for tons`,`+${leadSpeed()} fpm`]);
  if(n("clean"))out.push([`${n("clean")} clean-run gain${n("clean")>1?"s":""}`,`breaks and hayouts ${pc(leadClean()-1)}`]);
  if(leadIs("hank"))out.push(["Energy (runs it hot)",pc(LEAD.hot0),1]);
  if(leadIs("hank"))out.push(["Fibre (runs heavy)",pc(LEAD.heavy),1]);
  if(leadIs("dot"))out.push(["Repair bills",pc(LEAD.bills-1),1]);
  if(leadIs("chip"))out.push(["Labour relations",`call-offs and brawls ${xf(leadStrife())}`,1]);
  if(L.fixed&&L.fixed.length)out.push([`Fixed for good (${L.fixed.length})`,L.fixed.map(x=>EV[x]?EV[x].name:x).join(", ")]);
  return out;}
const leadTallyHTML=()=>{const t=leadTally();return t.length?`<div class="ldtally">${t.map(([a,b,bad])=>`<div${bad?' class="bad"':""}><span>${a}</span><b>${b}</b></div>`).join("")}</div>`:"";};

/* ---- the picker: after the site, before the run starts (menu, pause menu, game over) ---- */
let leadPickEl=null;
function leadCardHTML(id,tag="button",extra=""){const L=LEADERS[id];
  return `<${tag} class="ldcard" data-l="${id}"${tag==="button"?' type="button" role="radio" aria-checked="false"':""}>${leadSvg(id)}<span class="ldbody"><small>${L.role}</small><b>${escHTML(L.name)}</b><em>${L.title}</em>
    <span class="pro">${L.plus()}</span><span class="con">${L.minus()}</span><i>“${L.say}”</i>${extra}</span></${tag}>`;}
function leadPickOpen(done,wait){let sel=null;try{const v=localStorage.getItem("paper-mill-leader");if(LEADERS[v])sel=v;}catch(e){}
  if(!leadPickEl){leadPickEl=document.createElement("div");leadPickEl.className="overlay top";leadPickEl.id="leadOv";leadPickEl.hidden=true;document.body.appendChild(leadPickEl);}
  const el=leadPickEl,back=document.activeElement;
  el.innerHTML=`<div class="modal ldpick" role="dialog" aria-modal="true" aria-labelledby="ld-h"><span class="dk">Survival · ${escHTML((ENVX()&&ENVX().name)||"your site")}</span><h2 id="ld-h">Choose your mill leader</h2>
    <p class="muted small">Each one is strong on one side of the mill and costs you on another. What they build stays with the mill. You can change leader once per run, at an outage.</p>
    <div class="ldgrid" role="radiogroup" aria-label="Mill leader">${LEAD_IDS.map(id=>leadCardHTML(id)).join("")}</div>
    <div class="btns"><button class="primary" id="ld-go" disabled>Start the run</button><button id="ld-no">Back</button></div></div>`;
  const paint=()=>{el.querySelectorAll(".ldcard").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.l===sel)));const g=el.querySelector("#ld-go");g.disabled=!sel;g.textContent=sel?`Start with ${LEADERS[sel].name.split(" ")[0]}`:"Start the run";};
  const close=()=>{el.hidden=true;document.removeEventListener("keydown",key,true);if(back&&back.focus)back.focus();};
  const key=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}};
  el.querySelectorAll(".ldcard").forEach(b=>b.addEventListener("click",()=>{sel=b.dataset.l;paint();}));
  el.querySelector("#ld-no").addEventListener("click",close);
  el.querySelector("#ld-go").addEventListener("click",()=>{if(!sel)return;const g=el.querySelector("#ld-go"),w=wait&&wait();
    if(w&&w.then){g.disabled=true;g.setAttribute("aria-busy","true");g.textContent="Getting the mill ready…";w.then(()=>{close();done(sel);});}else{close();done(sel);}});
  document.addEventListener("keydown",key,true);paint();el.hidden=false;el.querySelector(".modal").scrollTop=0;(el.querySelector('.ldcard[aria-checked="true"]')||el.querySelector(".ldcard")).focus();}

/* ---- the outage budget dialog: the leader's pick, and the one change of leader ---- */
function leadPlanNew(){if(!S.lead||!survOn())return null;const p=LEAD_PICKS[S.lead.id];return {to:null,pick:p.length?(p.some(x=>x[0]===S.lead.last)?S.lead.last:p[0][0]):null};}
function leadPlanMount(host,lp){if(!host)return;
  const draw=()=>{const cur=S.lead.id,id=lp.to||cur,L=LEADERS[id],picks=LEAD_PICKS[id],first=L.name.split(" ")[0];
    if(!picks.some(x=>x[0]===lp.pick))lp.pick=picks.length?picks[0][0]:null;
    const choose=lp.choosing?`<div class="ldswap" role="radiogroup" aria-label="New mill leader">${LEAD_IDS.filter(x=>x!==cur).map(x=>`<button type="button" role="radio" aria-checked="${lp.to===x}" data-to="${x}">${leadSvg(x,true)}<span><b>${escHTML(LEADERS[x].name)}</b><small>${LEADERS[x].role}</small></span></button>`).join("")}
        <p class="ldnote">${lp.to?`${escHTML(LEADERS[lp.to].name)} takes over when the outage starts. Everything ${LEADERS[cur].name.split(" ")[0]} built stays with the mill. This is the run's one change of leader.`:`Pick who takes over. Everything ${LEADERS[cur].name.split(" ")[0]} built stays with the mill. You can do this once per run.`}</p>
        <div class="pro">${lp.to?LEADERS[lp.to].plus():""}</div><div class="con">${lp.to?LEADERS[lp.to].minus():""}</div></div>`:"";
    host.innerHTML=`<div class="ldrow"><div class="ldwho">${leadSvg(id,true)}<div><b>${escHTML(L.name)}</b><small>${lp.to?"takes over at this outage":L.title}</small></div>
        ${S.lead.changed?"":`<button type="button" class="ghost" id="out-lchg">${lp.choosing?(lp.to?"Keep "+LEADERS[cur].name.split(" ")[0]:"Cancel"):"Change leader"}</button>`}</div>${choose}
      ${picks.length?`<div class="ldq">${first}'s pick for the next cycle${id==="chip"?` <span>· each deal: wages +${pct1(LEAD.wage)}% for good</span>`:id==="fel"?` <span>· each project: +$${LEAD.payroll}/h payroll for good</span>`:""}</div><div class="seg ldseg" id="out-lpick">${picks.map(([k,lab,what])=>`<button type="button" data-p="${k}" aria-pressed="${lp.pick===k}"><b>${lab}</b><small>${what()}</small></button>`).join("")}</div>`
        :`<div class="ldq">${id==="dot"?"Dot makes no pick: Fix it now is ready again when the outage ends.":""}</div>`}
      ${leadTallyHTML()}</div>`;
    host.querySelectorAll("#out-lpick button").forEach(b=>b.addEventListener("click",()=>{lp.pick=b.dataset.p;draw();}));
    const c=host.querySelector("#out-lchg");if(c)c.addEventListener("click",()=>{if(lp.choosing){lp.choosing=false;lp.to=null;}else lp.choosing=true;draw();});
    host.querySelectorAll(".ldswap button").forEach(b=>b.addEventListener("click",()=>{lp.to=b.dataset.to;draw();}));};
  draw();}
function leadChange(to){const L=S.lead;if(!L||L.changed||!LEADERS[to]||to===L.id)return;const old=L.id;L.was=old;L.id=to;L.changed=true;applyUpgrades();
  BANNERS.push({text:`${LEADERS[to].name} takes over from ${LEADERS[old].name}. "${LEADERS[to].say}"`,t:null,kind:"good",tag:"LEADER"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`${LEADERS[to].name} takes over from ${LEADERS[old].name}. What was built stays with the mill.`,"warn");}
// called by endOutage: this outage's pick becomes part of the mill (a tool or an old save may bring no pick: the first one)
function leadOutageEnd(pl){const L=S.lead,picks=LEAD_PICKS[L.id];if(!picks.length)return;const k=pl&&picks.some(x=>x[0]===pl.pick)?pl.pick:picks[0][0],p=picks.find(x=>x[0]===k);
  L.st[k]=(L.st[k]||0)+1;L.last=k;log(`${LEADERS[L.id].name}: ${p[1].toLowerCase()} (${p[2]()}).`,"ok");}

/* ---- Dot's fix ---- */
const leadFixable=id=>MNEED(id)||QINC(id);
const leadFixReady=()=>leadIs("dot")&&survOn()&&S.lead.fixW!==survWave();
function leadFix(id){if(!leadFixReady()||!active(id)||!leadFixable(id))return false;const inc=S.inc.find(i=>i.id===id),back=(inc&&inc.bill)||0;
  clearIncident(id);if(back>0){spend(-back,"repairs");inc.bill=0;}S.lead.fixW=survWave();(S.lead.fixed||(S.lead.fixed=[])).push(id);AUDIO.sfx("clunk",200);
  BANNERS.push({text:`Dot fixed it for good: ${EV[id].name.toLowerCase()}.${back>0?" "+money(back)+" back.":""}`,t:null,kind:"good",tag:"FIXED"});while(BANNERS.length>3)BANNERS.splice(1,1);
  log(`Fix it now: Dot ended "${EV[id].name}" on the spot${back>0?" and the "+money(back)+" repair bill came back":""}. Fixed for good: it won't happen again.`,"ok");return true;}

/* ---- the leader card (tap the wave chip) ---- */
let leadCardEl=null;
function leadCardOpen(){if(!S.lead)return;const was=running;running=false;
  if(!leadCardEl){leadCardEl=document.createElement("div");leadCardEl.className="overlay";leadCardEl.id="leadCard";leadCardEl.hidden=true;document.body.appendChild(leadCardEl);}
  const el=leadCardEl,id=S.lead.id,L=LEADERS[id];
  const close=()=>{el.hidden=true;document.removeEventListener("keydown",key,true);if(was&&!(S.cards&&S.cards.open)&&!S.over&&survOn())running=true;};
  const key=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}};
  const draw=()=>{const fx=S.inc.filter(i=>leadFixable(i.id)&&i.left>0),ready=leadFixReady();   // (a fixed one has left=0 until the next sim step clears it)
    const fix=id!=="dot"?"":`<div class="ldfix"><h3>Fix it now <small>${ready?"ready":"used this cycle · back when the outage ends"}</small></h3>
        ${fx.length?fx.map(i=>`<div class="ldfx"><span><b>${EV[i.id].name}</b><small>${(i.left/60).toFixed(1)} h left${i.bill>0?" · "+money(i.bill)+" bill back":""}</small></span><button type="button" class="primary" data-fix="${i.id}"${ready?"":" disabled"}>Fix now</button></div>`).join(""):`<p class="muted small">No breakdown to fix right now.</p>`}</div>`;
    el.innerHTML=`<div class="modal ldone" role="dialog" aria-modal="true" aria-labelledby="ldc-h"><span class="dk">Mill leader · sim paused</span>
      ${leadCardHTML(id,"div")}${fix}
      ${leadTally().length?`<h3 id="ldc-h">What the mill has kept</h3>${leadTallyHTML()}`:`<h3 id="ldc-h">Nothing built yet</h3><p class="muted small">${LEAD_PICKS[id].length?L.name.split(" ")[0]+" makes the first pick at the next outage.":"Dot makes no picks. Her fix is ready once every outage cycle."}</p>`}
      <p class="muted small">${S.lead.changed?`You changed leader once already (${escHTML(LEADERS[S.lead.was].name)} left). ${L.name.split(" ")[0]} stays to the end.`:"You can change leader once per run, in an outage budget dialog. What was built stays with the mill."}</p>
      <div class="btns"><button class="primary" id="ldc-ok" style="flex:1">Back to the mill</button></div></div>`;
    el.querySelector("#ldc-ok").addEventListener("click",close);
    el.querySelectorAll("[data-fix]").forEach(b=>b.addEventListener("click",()=>{if(leadFix(b.dataset.fix))draw();}));};
  document.addEventListener("keydown",key,true);draw();el.hidden=false;el.querySelector("#ldc-ok").focus();}
// the chip: the leader's face, and Dot's fix when a breakdown is waiting for it
UI_TICKS.push(()=>{const f=$("svL");if(!f)return;const id=S.lead&&survOn()?S.lead.id:"";if(f.dataset.l!==id){f.dataset.l=id;f.innerHTML=id?leadSvg(id,true):"";f.hidden=!id;}
  const x=$("svF");if(x){const show=id==="dot",ready=show&&leadFixReady(),hot=ready&&S.inc.some(i=>leadFixable(i.id)&&i.left>0),t=ready?(hot?"Fix it now":"Fix ready"):"Fix used";
    if(x.hidden===show)x.hidden=!show;if(show){if(x.textContent!==t)x.textContent=t;x.classList.toggle("hot",hot);x.classList.toggle("used",!ready);}}});
{const c=$("survChip");if(c)c.addEventListener("click",()=>{if(S.lead&&survOn()&&!(S.cards&&S.cards.open))leadCardOpen();});}
