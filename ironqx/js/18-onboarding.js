/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Onboarding, plan fullscreen, togglePassVis
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

/* ── ONBOARDING ── */
let _onbIdx=0;
function showOnboarding(){
  const el=G("onb-overlay");if(!el)return;
  el.style.display="flex";_onbIdx=0;onbGoTo(0);
}
function onbGoTo(i){
  _onbIdx=i;
  document.querySelectorAll(".onb-slide").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".onb-dot").forEach(d=>d.classList.remove("active"));
  const sl=document.querySelector(`.onb-slide[data-slide="${i}"]`);
  const dt=document.querySelector(`.onb-dot[data-dot="${i}"]`);
  if(sl)sl.classList.add("active");
  if(dt)dt.classList.add("active");
  const btn=G("onb-next");
  if(btn)btn.textContent=i===3?"Comenzar":"Siguiente";
}
function onbNext(){
  if(_onbIdx<3){onbGoTo(_onbIdx+1);}else{onbFinish();}
}
function onbFinish(){
  STORAGE.set("iq_onb_done","1");
  const el=G("onb-overlay");
  if(el){el.style.opacity="0";el.style.transition="opacity .4s ease";setTimeout(()=>{
    el.style.display="none";el.style.opacity="";el.style.transition="";
    if(S.pid&&!STORAGE.get("iq_pin_"+S.pid))setTimeout(()=>showPinScreen(S.pid,"set"),300);
    else if(S.pid)setTimeout(()=>offerBioReg(S.pid),1000);
  },420);}
}
function togglePassVis(){
  var inp=G("i-pass"),ic=G("pass-eye-ic");if(!inp)return;
  // Usar type real (password/text) para compatibilidad con autocomplete de Safari
  var hidden=inp.type==="password";
  inp.type=hidden?"text":"password";
  if(ic)ic.innerHTML=iconSvg(hidden?"eye-off":"eye");
}
let _hudTimer=null;
function _hudShow(){
  const hud=G("plan-fs-hud");if(!hud)return;
  hud.classList.remove("hud-hidden");
  clearTimeout(_hudTimer);
  _hudTimer=setTimeout(()=>{if(G("plan-fs-portal")?.style.display!=="none")hud.classList.add("hud-hidden");},3000);
}
function togglePlanFS(){
  const portal=G("plan-fs-portal");
  if(!portal)return;
  const isOpen=portal.style.display!=="none"&&portal.style.display!=="";
  if(isOpen){closePlanFS();}else{openPlanFS();}
}
let _scrollY=0; // guardamos la posición antes del lock para iOS

function _bodyLock(){
  _scrollY=window.scrollY||window.pageYOffset||0;
  document.body.style.overflow="hidden";
  document.body.style.position="fixed";
  document.body.style.top=(-_scrollY)+"px";
  document.body.style.width="100%";
}
function _bodyUnlock(){
  document.body.style.overflow="";
  document.body.style.position="";
  document.body.style.top="";
  document.body.style.width="";
  window.scrollTo(0,_scrollY);
}

function openPlanFS(){
  const portal=G("plan-fs-portal");
  const srcFrame=G("plan-frame");
  const fsFrame=G("plan-fs-frame");
  const fsVer=G("plan-fs-ver");
  if(!portal||!fsFrame)return;
  // Mirror srcdoc from the live iframe
  if(srcFrame&&srcFrame.srcdoc)fsFrame.srcdoc=srcFrame.srcdoc;
  const verEl=G("plan-ver-lbl");
  if(fsVer&&verEl)fsVer.textContent=verEl.textContent;
  // Show portal — bloqueo iOS-safe
  portal.style.display="flex";
  _bodyLock();
  // Update btn icon
  const btn=G("plan-fs-btn"),btnIc=btn?.querySelector('.iq-ic');
  if(btnIc)btnIc.innerHTML=iconSvg("shrink");
  paintIcons(portal);
  // Request native fullscreen (Android/desktop)
  const el=portal;
  const req=el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen;
  if(req){
    req.call(el).catch(()=>{}); // silently ignore if denied (iOS)
  }
  // Start HUD auto-hide
  _hudShow();
  // Tap anywhere on portal re-shows HUD
  portal.addEventListener("click",_hudShow,{passive:true});
}
function closePlanFS(){
  const portal=G("plan-fs-portal");
  if(!portal)return;
  // Cancelar cualquier auto-open pendiente
  if(typeof _planFsTimer!=="undefined"&&_planFsTimer){clearTimeout(_planFsTimer);_planFsTimer=null;}
  // Exit native fullscreen if active
  const exitFs=document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen||document.msExitFullscreen;
  if(exitFs&&(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement)){
    exitFs.call(document).catch(()=>{});
  }
  portal.style.display="none";
  portal.removeEventListener("click",_hudShow);
  clearTimeout(_hudTimer);
  const fsFrame=G("plan-fs-frame");
  if(fsFrame)fsFrame.srcdoc="";
  // Desbloqueo iOS-safe — restaura scroll position
  _bodyUnlock();
  const btn=G("plan-fs-btn"),btnIc=btn?.querySelector('.iq-ic');
  if(btnIc)btnIc.innerHTML=iconSvg("expand");
  // Si el paciente estaba viendo el plan, volver al home al salir del fullscreen
  // (No forzar si es admin en su-view — el admin cierra con la X y sigue donde estaba)
  if(S.role==="patient"&&S.tab==="plan"){
    goTab("home");
  }
}
// Sync close if user exits fullscreen via Escape / system gesture
document.addEventListener("fullscreenchange",()=>{
  if(!document.fullscreenElement&&!document.webkitFullscreenElement){
    const portal=G("plan-fs-portal");
    if(portal&&portal.style.display!=="none")closePlanFS();
  }
});
document.addEventListener("webkitfullscreenchange",()=>{
  if(!document.fullscreenElement&&!document.webkitFullscreenElement){
    const portal=G("plan-fs-portal");
    if(portal&&portal.style.display!=="none")closePlanFS();
  }
});
document.querySelectorAll(".msheet").forEach(sh=>{
  let sy=0;
  sh.addEventListener("touchstart",e=>{sy=e.touches[0].clientY},{passive:true});
  sh.addEventListener("touchend",e=>{if(e.changedTouches[0].clientY-sy>60){const ov=sh.closest(".mover");if(ov)ov.classList.remove("open")}},{passive:true});
});

/* ── SPLASH QRS ── */
function runSplash(done){
  var cvs=G("sp-ecg");
  if(!cvs){done();return;}
  var dpr=window.devicePixelRatio||1;
  var W=window.innerWidth,H=window.innerHeight;
  cvs.width=W*dpr;cvs.height=H*dpr;
  cvs.style.width=W+"px";cvs.style.height=H+"px";
  var ctx=cvs.getContext("2d");
  ctx.scale(dpr,dpr);

  // ECG shape: array of [xFraction, yFraction] — x across screen width, y normalized amplitude
  var shape=[
    [0,0],[.08,0],[.11,.05],[.14,0],[.18,0],   // baseline + P wave
    [.22,0],[.25,-.04],                          // Q dip
    [.28,.88],[.31,0],                           // R spike (peak)
    [.33,-.1],[.36,0],                           // S dip
    [.42,0],[.46,.11],[.51,.14],[.56,.1],[.6,0], // ST + T wave
    [.72,0],[1,0]                                // flat to end
  ];

  var midY=H*0.5;
  var amp=H*0.25;
  var DURATION=1300; // ms total
  var REVEAL=680;    // ms — when R spike is reached, show logo
  var t0=null;
  var revealed=false;
  var rafId=null;

  function frame(ts){
    if(!t0)t0=ts;
    var elapsed=ts-t0;
    var prog=Math.min(1,elapsed/DURATION);

    ctx.clearRect(0,0,W,H);

    // ECG paper grid
    ctx.lineWidth=0.6;
    ctx.strokeStyle="rgba(212,146,14,0.06)";
    var gh=amp*0.5;
    for(var y=midY-amp*2;y<midY+amp*2.5;y+=gh){
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    }
    var gw=W/10;
    for(var x=0;x<W+gw;x+=gw){
      ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
    }

    // Build trace up to current progress
    // x=0..W maps to shape x fraction 0..1
    var headX=prog*W;
    var trailLen=W*0.5;

    ctx.beginPath();
    var penDown=false;
    for(var i=0;i<shape.length-1;i++){
      var sx0=shape[i][0]*W,   sy0=midY-shape[i][1]*amp;
      var sx1=shape[i+1][0]*W, sy1=midY-shape[i+1][1]*amp;
      if(sx1<headX-trailLen)continue; // behind trail
      if(sx0>headX)break;             // ahead of head
      // partial last segment
      if(sx1>headX){
        var r=(headX-sx0)/(sx1-sx0);
        sx1=headX; sy1=sy0+(sy1-sy0)*r;
      }
      if(!penDown){ctx.moveTo(sx0,sy0);penDown=true;}
      ctx.lineTo(sx1,sy1);
    }

    // Glow stroke with fade-in trail
    if(penDown){
      ctx.save();
      ctx.shadowColor="rgba(212,146,14,0.9)";
      ctx.shadowBlur=10;
      ctx.strokeStyle="rgba(212,146,14,0.9)";
      ctx.lineWidth=2;
      ctx.lineJoin="round";ctx.lineCap="round";
      ctx.stroke();
      ctx.restore();

      // Bright dot at head
      if(headX>0&&headX<W){
        var headY=getShapeY(prog,midY,amp);
        ctx.save();
        ctx.beginPath();
        ctx.arc(headX,headY,4.5,0,Math.PI*2);
        ctx.fillStyle="rgba(212,146,14,1)";
        ctx.shadowColor="rgba(212,146,14,1)";ctx.shadowBlur=18;
        ctx.fill();
        ctx.restore();
      }
    }

    // Reveal logo when R spike passes
    if(!revealed&&elapsed>=REVEAL){
      revealed=true;
      var el=G("sp-logo"),et=G("sp-tag"),ev=G("sp-ver");
      if(el)el.classList.add("show");
      if(et)et.classList.add("show");
      if(ev)ev.classList.add("show");
    }

    if(prog<1){
      rafId=requestAnimationFrame(frame);
    } else {
      setTimeout(done,400);
    }
  }

  // Interpolate Y at current progress fraction
  function getShapeY(p,mY,a){
    var tx=p;
    for(var i=0;i<shape.length-1;i++){
      if(shape[i][0]<=tx&&shape[i+1][0]>=tx){
        var t=(tx-shape[i][0])/(shape[i+1][0]-shape[i][0]);
        var yv=shape[i][1]+(shape[i+1][1]-shape[i][1])*t;
        return mY-yv*a;
      }
    }
    return mY;
  }

  requestAnimationFrame(frame);
}

