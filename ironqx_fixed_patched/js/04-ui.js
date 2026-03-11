/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Navigation, show/hide, toast, modal helpers
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));const el=G(id);if(el)el.classList.add("active")}
function showNav(v){G("bnav").style.display=v?"flex":"none"}
function setNav(t){document.querySelectorAll(".ni").forEach(n=>n.classList.remove("on"));const el=G("ni-"+t);if(el)el.classList.add("on")}
let _planFsTimer=null; // reservado (no usado — auto-FS eliminado)

function goTab(t){
  S.tab=t;setNav(t);haptic('light');
  if(_planFsTimer){clearTimeout(_planFsTimer);_planFsTimer=null;}
  // Seguridad: siempre restaurar scroll al navegar entre tabs (iOS-safe)
  if(typeof _bodyUnlock==="function")_bodyUnlock();
  else{document.body.style.overflow="";document.body.style.position="";}
  if(t==="home")show("scr-home");
  else if(t==="plan"){
    show("scr-plan");
    // Sin auto-fullscreen — el paciente pulsa el botón manualmente
  }
  else if(t==="prog"){
    show("scr-prog");
    requestAnimationFrame(()=>requestAnimationFrame(()=>loadProgScreen(S.pid)));
  }
  else if(t==="reporte"){
    const _repScroll=document.querySelector("#scr-reporte .scroll");
    if(_repScroll)_repScroll.scrollTop=0;
    renderReportTab(S.pid);show("scr-reporte");
  }
}

/* ── LOGIN ── */
