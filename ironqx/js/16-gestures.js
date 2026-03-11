/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Swipe tabs, photo compare, dr notes
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function initSwipeTabs(){
  const tabs=['home','plan','prog','reporte'];
  const ids=['scr-home','scr-plan','scr-prog','scr-reporte'];
  let sx=0,sy=0,dragging=false;
  ids.forEach(id=>{
    const el=G(id);if(!el)return;
    el.addEventListener('touchstart',e=>{
      sx=e.touches[0].clientX;sy=e.touches[0].clientY;dragging=true;
    },{passive:true});
    el.addEventListener('touchend',e=>{
      if(!dragging)return;dragging=false;
      // FIX Bug2: no cambiar de tab si hay un modal abierto
      if(document.querySelector('.mover.open'))return;
      const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
      if(Math.abs(dx)<50||Math.abs(dy)>Math.abs(dx)*0.8)return;
      // No navegar si hay un input/textarea activo (teclado abierto en iOS)
      const active=document.activeElement;
      if(active&&(active.tagName==='INPUT'||active.tagName==='TEXTAREA'||active.tagName==='SELECT'))return;
      const cur=tabs.indexOf(S.tab);
      if(dx<-50&&cur<tabs.length-1)goTab(tabs[cur+1]);
      else if(dx>50&&cur>0)goTab(tabs[cur-1]);
    },{passive:true});
  });
}

/* ── PHOTO COMPARE ── */
let _cmpPid=null;
function openPhotoCompare(pid){
  _cmpPid=pid;
  const sets=DB.photos(pid);
  if(sets.length<2){toast('⚠️','Necesitas al menos 2 sets de fotos');return;}
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const wrap=G('cmp-sel-wrap');
  // Build selection — default first=newest, second=oldest
  let sel=[0,sets.length-1];
  function buildSel(){
    wrap.innerHTML=`
      <div>
        <div class="cmp-sel-lbl">Antes</div>
        ${sets.map((s,i)=>{
          const d=new Date(s.date);
          return`<div class="cmp-sel-btn ${sel[0]===i?'on':''}" onclick="_cmpSelect(0,${i})">${d.getDate()} ${M[d.getMonth()]} · ${s.note}</div>`;
        }).join('')}
      </div>
      <div>
        <div class="cmp-sel-lbl">Después</div>
        ${sets.map((s,i)=>{
          const d=new Date(s.date);
          return`<div class="cmp-sel-btn ${sel[1]===i?'on':''}" onclick="_cmpSelect(1,${i})">${d.getDate()} ${M[d.getMonth()]} · ${s.note}</div>`;
        }).join('')}
      </div>`;
  }
  window._cmpSel=sel;
  window._cmpSelect=function(slot,idx){
    sel[slot]=idx;buildSel();buildCompare();
  };
  function buildCompare(){
    const s1=sets[sel[0]],s2=sets[sel[1]];
    const img1=s1.front||s1.side||s1.back;
    const img2=s2.front||s2.side||s2.back;
    const cc=G('compare-content');if(!cc)return;
    if(!img1||!img2){cc.innerHTML=`<div class="empty" style="padding:16px"><div class="et">Faltan fotos en uno de los sets</div></div>`;return;}
    const d1=new Date(s1.date),d2=new Date(s2.date);
    cc.innerHTML=`
      <div class="compare-wrap" id="cmp-wrap">
        <img src="${img1}" class="compare-img" id="cmp-bef" style="object-fit:cover">
        <img src="${img2}" class="compare-img after" id="cmp-aft" style="clip-path:inset(0 50% 0 0);object-fit:cover">
        <div class="compare-divider" id="cmp-div" style="left:50%"></div>
        <div class="compare-handle" id="cmp-hdl" style="left:50%;top:50%;transform:translate(-50%,-50%)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5l-5 7 5 7M16 5l5 7-5 7"/></svg>
        </div>
        <span class="compare-lbl before">${d1.getDate()} ${M[d1.getMonth()]}</span>
        <span class="compare-lbl after">${d2.getDate()} ${M[d2.getMonth()]}</span>
      </div>
      <div style="font-size:11px;color:var(--muted);text-align:center;margin-top:7px;font-family:'Inter',sans-serif;letter-spacing:.5px">← Desliza para comparar →</div>`;
    // Wire drag
    const cmpW=G('cmp-wrap'),aft=G('cmp-aft'),div=G('cmp-div'),hdl=G('cmp-hdl');
    if(!cmpW)return;
    function setPos(pct){
      pct=Math.max(3,Math.min(97,pct));
      div.style.left=pct+'%';hdl.style.left=pct+'%';
      aft.style.clipPath=`inset(0 ${100-pct}% 0 0)`;
    }
    function onMove(cx){const r=cmpW.getBoundingClientRect();setPos(((cx-r.left)/r.width)*100);}
    cmpW.addEventListener('touchstart',e=>{e.stopPropagation();onMove(e.touches[0].clientX);},{passive:true});
    cmpW.addEventListener('touchmove',e=>{e.stopPropagation();onMove(e.touches[0].clientX);},{passive:true});
    let mdActive=false;
    cmpW.addEventListener('mousedown',e=>{mdActive=true;onMove(e.clientX);});
    window.addEventListener('mousemove',e=>{if(mdActive)onMove(e.clientX);});
    window.addEventListener('mouseup',()=>mdActive=false);
  }
  buildSel();buildCompare();
  showM('m-compare');
}

/* ══════════════════════════════════════
   END FEATURES v1.0
══════════════════════════════════════ */

/* ── WIRING ── */
// np-name input handled by npLivePreview() via oninput attribute
// Initialize goal chip on load
if(G("np-goal"))npGoalChip(G("np-goal"));
G("i-pass")?.addEventListener("keydown",e=>{if(e.key==="Enter")doLogin()});

/* ── BIOMETRIC AUTH (WebAuthn / Passkeys) ── */
