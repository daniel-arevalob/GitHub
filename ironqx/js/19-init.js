/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   DOMContentLoaded init, runSplash, restoreSession
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

/* ── INIT ── */
window.addEventListener("DOMContentLoaded",function(){
  paintIcons();
  seedDemo();
  initSwipeTabs();
  runSplash(function(){
    var sp=G("splash");
    var ecg=G("sp-ecg");
    if(ecg){
      ecg.style.opacity="0";
      ecg.style.transition="opacity .15s";
      var ctx=ecg.getContext("2d");
      ctx.clearRect(0,0,ecg.width,ecg.height);
    }
    sp.classList.add("hide");
    setTimeout(function(){sp.style.display="none";},700);
    if(!restoreSession())show("scr-login");
  });
});