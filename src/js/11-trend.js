/* ---------- theme colors and shared animation phases (v6.8.1: the Report tab's 24-hour trend chart is retired; S.trend is still kept) ---------- */
// chart colors come from the CSS tokens (v5.4: read again when the theme changes)
const col={};
function readColors(){const cs=getComputedStyle(document.body||document.documentElement);   // (v5.4: body, where dark mode sets its colours)
  ["muted","line","stock","machine","kraft","ok"].forEach(k=>col[k]=cs.getPropertyValue("--"+k).trim());}
// animation phases advanced by the 3D frame (conveyor belt, chest swirl, sheet, dryer cans, forklifts)
const V={belt:0,swirl:0,sheet:0,cans:0,lifts:[],rollsAnim:0};
document.addEventListener("pm-theme",()=>{readColors();});   // (v5.4: repaint in the new theme)
