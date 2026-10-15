/* ---------- v5.3 dark mode ----------
   The game's panels, cards, sheets and menus follow the device's light/dark setting by default (prefers-color-scheme),
   and Settings → Appearance can pin Light or Dark (saved on the device). Only the interface changes: the dark palette
   lives on body.dark, so the 3D world, which reads its colours from :root, looks the same in both. */
let THEME_PREF="auto";try{const v=localStorage.getItem("paper-mill-theme");if(v==="light"||v==="dark")THEME_PREF=v;}catch(e){}
const THEME_MQ=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
function themeDark(){return THEME_PREF==="dark"||(THEME_PREF==="auto"&&!!(THEME_MQ&&THEME_MQ.matches));}
// v5.4: dark mode keeps the mill's own brand colour, lifted 20% toward white so it reads on dark panels (set as a hex value
// on body so the canvas labels and charts can use it; re-done when the brand changes on :root)
function themeBrand(){const b=document.body;if(!b)return;if(!themeDark()){b.style.removeProperty("--brand");return;}
  const r=getComputedStyle(document.documentElement).getPropertyValue("--brand").trim(),m=/^#?([0-9a-f]{6})$/i.exec(r);if(!m)return;
  const n=parseInt(m[1],16),c=s=>Math.round(((n>>s)&255)*0.8+255*0.2).toString(16).padStart(2,"0"),h="#"+c(16)+c(8)+c(0);
  if(b.style.getPropertyValue("--brand")!==h)b.style.setProperty("--brand",h);}
try{new MutationObserver(()=>{themeBrand();}).observe(document.documentElement,{attributes:true,attributeFilter:["style"]});}catch(e){}
function applyTheme(){const d=themeDark(),b=document.body;if(!b)return;if(b.classList.contains("dark")!==d)b.classList.toggle("dark",d);themeBrand();
  let m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m);}m.content=d?"#14181f":"#eef0f6";
  if(applyTheme.was!==d){applyTheme.was=d;document.dispatchEvent(new Event("pm-theme"));}
  document.querySelectorAll("[data-theme-pick]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.themePick===THEME_PREF)));}
function setTheme(v){THEME_PREF=v==="light"||v==="dark"?v:"auto";try{if(THEME_PREF==="auto")localStorage.removeItem("paper-mill-theme");else localStorage.setItem("paper-mill-theme",THEME_PREF);}catch(e){}applyTheme();}
// the Auto / Light / Dark buttons, for both settings panels (title and in-game)
const themeSegHTML=cls=>`<div class="${cls}" role="group" aria-label="Appearance">${[["auto","Auto","Follow the device setting"],["light","Light",""],["dark","Dark",""]].map(([k,t,ti])=>`<button type="button" data-theme-pick="${k}" aria-pressed="${THEME_PREF===k}"${ti?` title="${ti}"`:""}>${t}</button>`).join("")}</div>`;
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-theme-pick]");if(b)setTheme(b.dataset.themePick);});
if(THEME_MQ){try{THEME_MQ.addEventListener("change",applyTheme);}catch(e){try{THEME_MQ.addListener(applyTheme);}catch(_){}}}
if(document.body)applyTheme();else document.addEventListener("DOMContentLoaded",applyTheme);
