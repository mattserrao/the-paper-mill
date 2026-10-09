  /* ---- labels (HTML over the canvas) ---- */
  const labelHost=$("labels3d");
  const LABELS=[
    {p:[-70,0,-8],t:()=>["1 Inbound OCC",S.inQ.length?S.inQ.length+" trucks waiting":"road clear"]},
    {p:[-21,2.8,-24],t:()=>["2 Receiving",f0(S.yard)+" t bales"]},
    {p:[16,4.5,-18.5],t:()=>["3 Pulper",f1(S.rates.feed)+" t/h"]},
    {p:[25.8,7.2,-13.2],t:()=>["HD cleaner",S.M.pulperDown?"stopped":"pulling grit & staples"]},
    {p:[34.5,PH+5.0,-15],t:()=>["Disk thickener",S.M.pulperDown?"stopped":"cloudy · clear filtrate"]},
    {p:[11.2,5.4,ZL],t:()=>["Lightweight cleaners",S.inc.some(i=>i.id==="lwplug")?"plugged":"plastics & wax out"]},
    {p:[15.2,4.4,ZL],t:()=>["Coarse screen",S.inc.some(i=>i.id==="cscreen")?"down":"holed basket"]},
    {p:[19.2,5.0,ZL],t:()=>["Fine screens",S.inc.some(i=>i.id==="fscreen")?"down":"slotted baskets"]},
    {p:[26.6,3.9,ZL],t:()=>["LC cleaners",S.inc.some(i=>i.id==="lcplug")?"plugged":"sand & grit out"]},
    {p:[41.2,9.4,-15],t:()=>["4 Stock chest",f0(S.tank/P.tankCap*100)+" %"]},
    {p:[58,5.6,zc],t:()=>{const D=G3.SLC;if(!D)return ["Headbox",""];const g=D.geo();return ["Headbox",G3.slcFix?"resetting the slice":"slice "+(12+3*D.v).toFixed(1)+" mm · wet line "+(g.lipX-g.wet).toFixed(1)+" m"];},cls:()=>!!G3.slcFix},
    {p:[47.6,11.6,-15.0],t:()=>["Machine chest","refined stock"]},
    {p:[49.8,3.6,-9.3],t:()=>["Fan pump",S.pm==="run"?"to the headbox":"idling"]},
    {p:[44,0.6,12.9],t:()=>["Base ply silo","white water under the wire"]},
    {p:[34.5,9.6,zc-1.5],t:()=>["Twin press",LV("shoe")?"shoe in 2nd press":"tandem bottom felt"]},
    {p:[10,8.4,zc],t:()=>["5 "+NAME+(S.pm==="run"?"":" · "+({break:"sheet break "+({reel:"at the reel",dryer:"before the dryers",press:"before the presses"}[S.brkType]||"")+(working("brk")?": rethreading":": crew on the way"),down:"no stock",full:"warehouse full",spools:"winder backed up",incident:S.M.pmDown||"down"}[S.pm]||"")),f0(S.pmSpeed)+" fpm · "+f1(S.rates.prod)+" t/h"],cls:()=>S.pm==="run"?"":"bad"},
    {p:[-10,9.2,zc],t:()=>["Reel",f1(S.reel)+" / "+P.jumbo+" t"]},
    {p:[-20,1.5,zc+4],t:()=>["6 Winder"+(S.wd==="hayout"?" · HAYOUT!":""),S.wd==="hayout"?"crew cleaning up":Math.max(0,reelsAtWinder()-1)+"/"+P.storeReels+" reels stored · "+f1(S.rates.cut)+" t/h"],cls:()=>S.wd==="hayout"},
    {p:[-36.4,3.2,14.8],t:()=>["7 Roll warehouse",f0(S.fg)+" rolls"]},
  ];
  LABELS.forEach(L=>{L.el=document.createElement("div");L.el.className="lbl sec";L.b=document.createElement("b");L.s=document.createElement("span");L.el.append(L.b,L.s);labelHost.appendChild(L.el);L.v=new THREE.Vector3(...L.p);});
  const banner=$("banner3d"),chips=$("chips3d");
  // click a disaster (chip, breaking banner or its floating label) to fly the camera there
  G3.spotOf=id=>id==="hay"?[-17,7]:id==="brk"?[12,9]:PINS[id]?[PINS[id][0],PINS[id][2]]:null;
  G3.flyTo=id=>{const sp=G3.spotOf(id);if(!sp)return;goal={t:new THREE.Vector3(sp[0],0,sp[1]),r:62,th:DEF.th,ph:0.88};};
  chips.addEventListener("click",e=>{const b=e.target.closest("button");if(b)G3.flyTo(b.dataset.id);});
  banner.addEventListener("click",()=>{const b=BANNERS[0];if(b&&b.id)G3.flyTo(b.id);});

