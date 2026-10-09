// three.js r186, loaded as an ES module. jsDelivr serves a pre-bundled minified build; unpkg is the fallback.
// If neither loads, THREE stays null and the game shows the "3D graphics are off" screen instead of a blank page.
const THREE_VER="0.186.1";
let THREE=null;
for(const u of [`https://cdn.jsdelivr.net/npm/three@${THREE_VER}/+esm`,`https://unpkg.com/three@${THREE_VER}/build/three.module.js`]){
  try{THREE=await import(u);break;}catch(e){diag("three.js load failed: "+u+" "+(e&&e.message||e));}}
// keep r128's color behavior: the game converts sRGB colors itself (lin(), convertSRGBToLinear) where it needs to
if(THREE)THREE.ColorManagement.enabled=false;
// Draw transparent double-sided materials in one pass, as r128 did. r150+ draws them twice (back faces, then front) and
// flags the material for a full shader re-check on each pass: two extra draws and ~25 KB of garbage per object per frame.
if(THREE)Object.defineProperty(THREE.Material.prototype,"forceSinglePass",{get(){return true;},set(){},configurable:true});
