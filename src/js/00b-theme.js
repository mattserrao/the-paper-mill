/* ---------- v5.3 dark mode ----------
   The game's panels, cards, sheets and menus follow the device's light/dark setting by default (prefers-color-scheme),
   and Settings → Appearance can pin Light or Dark (saved on the device). Only the interface changes: the dark palette
   lives on body.dark, so the 3D world, which reads its colours from :root, looks the same in both. */
let THEME_PREF="auto";try{const v=localStorage.getItem("paper-mill-theme");if(v==="light"||v==="dark")THEME_PREF=v;}catch(e){}
const THEME_MQ=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
function themeDark(){return THEME_PREF==="dark"||(THEME_PREF==="auto"&&!!(THEME_MQ&&THEME_MQ.matches));}
function applyTheme(){const d=themeDark(),b=document.body;if(!b)return;if(b.classList.contains("dark")!==d)b.classList.toggle("dark",d);
  let m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m);}m.content=d?"#14181f":"#eef0f6";
  document.querySelectorAll("[data-theme-pick]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.themePick===THEME_PREF)));}
function setTheme(v){THEME_PREF=v==="light"||v==="dark"?v:"auto";try{if(THEME_PREF==="auto")localStorage.removeItem("paper-mill-theme");else localStorage.setItem("paper-mill-theme",THEME_PREF);}catch(e){}applyTheme();}
// the Auto / Light / Dark buttons, for both settings panels (title and in-game)
const themeSegHTML=cls=>`<div class="${cls}" role="group" aria-label="Appearance">${[["auto","Auto","Follow the device setting"],["light","Light",""],["dark","Dark",""]].map(([k,t,ti])=>`<button type="button" data-theme-pick="${k}" aria-pressed="${THEME_PREF===k}"${ti?` title="${ti}"`:""}>${t}</button>`).join("")}</div>`;
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-theme-pick]");if(b)setTheme(b.dataset.themePick);});
if(THEME_MQ){try{THEME_MQ.addEventListener("change",applyTheme);}catch(e){try{THEME_MQ.addListener(applyTheme);}catch(_){}}}
if(document.body)applyTheme();else document.addEventListener("DOMContentLoaded",applyTheme);
