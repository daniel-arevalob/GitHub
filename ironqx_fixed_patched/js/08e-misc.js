/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Weekly summary, before/after, player card
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function renderWeeklySummary(pid){
  const wrap=G("week-sum-wrap");if(!wrap)return;
  const pt=DB.pt(pid);if(!pt)return;
  const adh=DB.adh(pid),prog=DB.prog(pid);
  // FIX Bug26: normalizar valores de adh por si tienen formato legado de objeto (tras sync Supabase)
  const _nv=v=>{if(!v)return'none';if(typeof v==='string')return v;if(typeof v==='object')return v.notes||'none';return'none';};
  // Calc current week adherence
  const today=new Date(),dow=today.getDay();
  const diffToMon=dow===0?-6:1-dow;
  const mon=new Date(today);mon.setDate(today.getDate()+diffToMon);
  let done=0,total=0;
  for(let i=0;i<7;i++){
    const d=new Date(mon);d.setDate(mon.getDate()+i);
    const key=d.toISOString().slice(0,10);
    if(key>today.toISOString().slice(0,10))break;
    total++;
    if(_nv(adh[key])==="done")done++;
  }
  const adhPct=total?Math.round((done/total)*100):0;
  // Weight delta (last 2 entries)
  const sorted=prog.length?[...prog].sort((a,b)=>new Date(a.date)-new Date(b.date)):[];
  const lastW=sorted.length?sorted[sorted.length-1].weight:null;
  const prevW=sorted.length>=2?sorted[sorted.length-2].weight:null;
  const wDiff=lastW&&prevW?parseFloat((lastW-prevW).toFixed(1)):null;
  // Streak
  const streak=calcStreak(adh);
  // Emoji + message
  let emoji,msg;
  if(adhPct===100){emoji="🔥";msg="Semana perfecta — cumpliste todos los días.";}
  else if(adhPct>=71){emoji="💪";msg="Buena semana. Mantén el ritmo los días que quedan.";}
  else if(adhPct>=43){emoji="⚡";msg="Semana aceptable. Puedes mejorar la consistencia.";}
  else if(adhPct>0){emoji="🎯";msg="Semana difícil. Cada día que te levantes cuenta.";}
  else{emoji="👋";msg="Registra tu adherencia diaria para ver tu progreso.";}
  // Goal-aware weight message
  if(wDiff!==null&&Math.abs(wDiff)>=0.1){
    const _wDir=weightGoalDir(pt?.goal,pt?.ficha);
    const _wGood=(_wDir==="down"&&wDiff<0)||(_wDir==="up"&&wDiff>0)||(_wDir==="neutral"&&Math.abs(wDiff)<=0.5);
    if(_wGood){
      if(_wDir==="up") msg+=" Ganaste "+Math.abs(wDiff)+" kg esta semana — vas en la dirección correcta.";
      else if(_wDir==="neutral") msg+=" Peso estable — exactamente lo que buscamos.";
      else msg+=" Tu peso bajó "+Math.abs(wDiff)+" kg esta semana — excelente.";
    } else {
      if(_wDir==="up") msg+=" Bajaste "+Math.abs(wDiff)+" kg — puede afectar el objetivo de volumen. Revísalo.";
      else if(_wDir==="neutral") msg+=" Cambio de "+Math.abs(wDiff)+" kg — revisa con el Dr. si persiste.";
      else msg+=" Subiste "+wDiff+" kg — revísalo con el Dr.";
    }
  }
  // Adherence color
  const adhColor=adhPct>=70?"var(--green)":adhPct>=40?"var(--amber)":"var(--red)";
  const _wdc=weightDeltaColor(wDiff,pt?.goal,pt?.ficha);
  const wColor=wDiff===null?"var(--muted)":_wdc.color;
  const wTxt=wDiff===null?"—":(wDiff>0?"+":"")+wDiff+" kg";
  wrap.innerHTML=`
  <div class="sl" style="margin-top:4px"><span class="iq-ic" data-ic="activity" style="width:14px;height:14px;color:var(--silver2)"></span>Esta semana</div>
  <div class="week-sum">
    <div class="week-sum-hd">
      <div class="week-sum-title">Resumen semanal</div>
      <div class="week-sum-badge">Sem ${pt.week||1}</div>
    </div>
    <div class="week-sum-grid">
      <div class="wsg-item">
        <div class="wsg-val" style="color:${adhColor}">${adhPct}%</div>
        <div class="wsg-lbl">Adherencia</div>
      </div>
      <div class="wsg-item">
        <div class="wsg-val" style="color:${wColor}">${wTxt}</div>
        <div class="wsg-lbl">Peso Δ</div>
      </div>
      <div class="wsg-item">
        <div class="wsg-val" style="color:${streak>0?"var(--amber)":"var(--muted)"}">${streak}</div>
        <div class="wsg-lbl">Racha días</div>
      </div>
    </div>
    <div class="week-sum-msg">
      <div class="week-sum-emoji">${emoji}</div>
      <div class="week-sum-txt">${msg}</div>
    </div>
    ${(()=>{
      const pesoMeta=parseFloat(pt?.ficha?.pesoMeta);
      const pesoIni=parseFloat(pt?.ficha?.peso);
      if(!pesoMeta||!lastW||!pesoIni||pesoIni===pesoMeta)return"";
      const _dir=weightGoalDir(pt?.goal,pt?.ficha);
      const total=Math.abs(pesoMeta-pesoIni);
      const done2=_dir==="up"?(lastW-pesoIni):(pesoIni-lastW);
      const pct=Math.min(100,Math.max(0,Math.round((done2/total)*100)));
      const reached=(_dir==="down"&&lastW<=pesoMeta)||(_dir==="up"&&lastW>=pesoMeta)||(_dir==="neutral"&&Math.abs(lastW-pesoMeta)<=0.3);
      const barColor=reached?"var(--green)":pct>=60?"var(--gold)":pct>=30?"var(--amber)":"var(--blue)";
      return`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <span style="font-size:10px;font-family:'Barlow Condensed',sans-serif;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase">Meta ${pesoMeta} kg</span>
          <span style="font-size:11px;font-family:'Inter',sans-serif;font-weight:700;color:${barColor}">${reached?"✓ Alcanzada":pct+"%"}</span>
        </div>
        <div style="height:5px;background:var(--bg3);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width .6s cubic-bezier(.32,1,.36,1)"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:3px">
          <span style="font-size:9px;color:var(--muted);font-family:'Inter',sans-serif">${pesoIni} kg ini.</span>
          <span style="font-size:9px;color:var(--txt2);font-family:'Inter',sans-serif">Actual: ${lastW?.toFixed(1)} kg</span>
        </div>
      </div>`;
    })()}
  </div>`;
  paintIcons(wrap);
}

/* ══════════════════════════════════════
   BEFORE / AFTER SLIDER
══════════════════════════════════════ */
let _baAngle="front";
function renderBeforeAfter(pid, wrapId="ba-slider-wrap"){
  const wrap=G(wrapId);if(!wrap)return;
  const sets=DB.photos(pid);
  if(sets.length<2){wrap.innerHTML="";return}
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  // First = oldest (last in array since unshift used), last = most recent (first)
  const first=sets[sets.length-1], latest=sets[0];
  const d1=new Date(first.date),d2=new Date(latest.date);
  const angles=["front","side","back"];
  const labels={front:"Frente",side:"Lateral",back:"Posterior"};
  const angleBtns=angles.map(a=>`<button type="button" class="ba-angle-btn${a===_baAngle?" on":""}" onclick="setBAAngle('${a}','${pid}','${wrapId}')">${labels[a]}</button>`).join("");
  const beforeSrc=first[_baAngle], afterSrc=latest[_baAngle];
  wrap.innerHTML=`<div class="ba-wrap">
    <div class="ba-header">
      <div class="ba-title"><span class="iq-ic sm gold" data-ic="camera"></span>Antes vs Ahora</div>
      <div class="ba-dates">${d1.getDate()} ${M[d1.getMonth()]} → ${d2.getDate()} ${M[d2.getMonth()]} ${d2.getFullYear()}</div>
    </div>
    <div class="ba-angle-row">${angleBtns}</div>
    ${beforeSrc&&afterSrc?`
    <div class="ba-container" id="ba-container-${wrapId}" style="height:260px">
      <img class="ba-img-before" src="${beforeSrc}" draggable="false">
      <img class="ba-img-after" id="ba-after-${wrapId}" src="${afterSrc}" draggable="false" style="clip-path:inset(0 50% 0 0)">
      <div class="ba-divider" id="ba-div-${wrapId}" style="left:50%"></div>
      <div class="ba-handle" id="ba-handle-${wrapId}" style="left:50%">
        <svg viewBox="0 0 20 20" fill="none" style="width:16px;height:16px">
          <path d="M6 8l-3 3 3 3M14 8l3 3-3 3" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="ba-label-before">Inicio</div>
      <div class="ba-label-after">Ahora</div>
    </div>`:`<div class="ba-no-angle">Sin fotos de este ángulo en ambos sets</div>`}
  </div>`;
  paintIcons(wrap);
  if(beforeSrc&&afterSrc)initBASlider(wrapId);
}
function setBAAngle(angle,pid,wrapId){
  _baAngle=angle;
  renderBeforeAfter(pid,wrapId);
}
function initBASlider(wrapId){
  const cont=G("ba-container-"+wrapId);
  const after=G("ba-after-"+wrapId);
  const div=G("ba-div-"+wrapId);
  const handle=G("ba-handle-"+wrapId);
  if(!cont||!after||!div)return;
  let dragging=false;
  function setPos(pct){
    pct=Math.max(5,Math.min(95,pct));
    const pctStr=pct.toFixed(1)+"%";
    after.style.clipPath=`inset(0 ${(100-pct).toFixed(1)}% 0 0)`;
    div.style.left=pctStr;
    if(handle)handle.style.left=pctStr;
  }
  function getX(e){return e.touches?e.touches[0].clientX:e.clientX}
  cont.addEventListener("mousedown",e=>{dragging=true;e.preventDefault()});
  cont.addEventListener("touchstart",e=>{dragging=true},{passive:true});
  function onMove(e){
    if(!dragging)return;
    const r=cont.getBoundingClientRect();
    const pct=((getX(e)-r.left)/r.width)*100;
    setPos(pct);
  }
  function onEnd(){dragging=false}
  // Remove any previous listeners before adding new ones
  if(window._baCleanup) window._baCleanup();
  window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onEnd);
  window.addEventListener("touchmove",onMove,{passive:true});window.addEventListener("touchend",onEnd);
  window._baCleanup=function(){
    window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onEnd);
    window.removeEventListener("touchmove",onMove);window.removeEventListener("touchend",onEnd);
    window._baCleanup=null;
  };
}

/* ══════════════════════════════════════
   PLAYER CARD
══════════════════════════════════════ */
function renderPlayerCard(pid){
  const pt=DB.pt(pid);if(!pt)return;
  const prog=DB.prog(pid);
  const adh=DB.adh(pid);
  const reps=DB.reports(pid);
  const logros=computeLogros(pid);

  // Stats
  const sorted=[...prog].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const kgChange=sorted.length>=2?parseFloat((sorted[sorted.length-1].weight-sorted[0].weight).toFixed(1)):0;
  const doneDays=Object.values(adh).filter(v=>v==="done").length;
  const streak=calcStreak(adh);
  const maxStreak=_maxStreak(adh);
  const reportsSent=reps.length;
  const logrosCount=logros.filter(a=>a.unlocked).length;
  const week=pt.week||1;

  // Ring progress: based on adherence pct
  const allAdh=Object.values(adh).filter(v=>v!=="none");
  const adhPct=allAdh.length?Math.round((Object.values(adh).filter(v=>v==="done").length/allAdh.length)*100):0;
  const circ=238.76;
  const offset=circ*(1-adhPct/100);
  const ring=document.getElementById("pc-ring-circle");
  if(ring)setTimeout(()=>{ring.style.transition="stroke-dashoffset 1s cubic-bezier(.32,1,.36,1)";ring.style.strokeDashoffset=offset},80);

  // Level badge
  const lvl=document.getElementById("pc-level");
  if(lvl)lvl.textContent="Sem "+week;

  // XP bar: weeks progress toward next checkpoint
  const cp=getCP(week);
  const xpPct=Math.min(100,Math.round((week/cp.target)*100));
  const xpFill=G("pc-xp-fill");const xpLbl=G("pc-xp-lbl");
  if(xpLbl)xpLbl.textContent=`Sem ${week} / ${cp.target}`;
  if(xpFill)setTimeout(()=>{xpFill.style.width=xpPct+"%"},120);

  // Stats grid
  const statColor=(val,good)=>val>0&&good?"var(--green)":val<0&&!good?"var(--green)":val===0?"var(--muted)":"var(--red)";
  const kgColor=kgChange<0?"var(--green)":kgChange>0?"var(--red)":"var(--muted)";
  const kgBg=kgChange<0?"var(--green-bg)":kgChange>0?"var(--red-bg)":"var(--bg3)";
  const kgBdr=kgChange<0?"var(--green-brd)":kgChange>0?"var(--red-brd)":"var(--line)";
  const adhColor=adhPct>=80?"var(--green)":adhPct>=50?"var(--gold)":"var(--red)";
  const adhBg=adhPct>=80?"var(--green-bg)":adhPct>=50?"var(--gold-bg)":"var(--red-bg)";
  const adhBdr=adhPct>=80?"var(--green-brd)":adhPct>=50?"var(--gold-brd)":"var(--red-brd)";

  const stats=[
    {ic:"chart",   icBg:"var(--blue-bg)",  icBdr:"var(--blue-brd)",  icClr:"var(--blue)",
     val:(kgChange>0?"+":"")+kgChange.toFixed(1)+" kg", lbl:"cambio de peso",
     vClr:kgColor, bg:kgBg, bdr:kgBdr},
    {ic:"check-circle", icBg:adhBg, icBdr:adhBdr, icClr:adhColor,
     val:adhPct+"%", lbl:"adherencia total",
     vClr:adhColor, bg:adhBg, bdr:adhBdr},
    {ic:"spark",   icBg:"var(--gold-bg)",  icBdr:"var(--gold-brd)",  icClr:"var(--gold)",
     val:streak+"d", lbl:"racha actual",
     vClr:"var(--gold)", bg:"var(--bg3)", bdr:"var(--line)"},
    {ic:"trophy",  icBg:"rgba(212,146,14,.1)",icBdr:"rgba(212,146,14,.25)",icClr:"var(--gold)",
     val:logrosCount, lbl:"logros",
     vClr:"var(--gold)", bg:"var(--bg3)", bdr:"var(--line)"},
    {ic:"note",    icBg:"var(--green-bg)", icBdr:"var(--green-brd)", icClr:"var(--green)",
     val:reportsSent, lbl:"reportes enviados",
     vClr:"var(--txt)", bg:"var(--bg3)", bdr:"var(--line)"},
    {ic:"activity",icBg:"var(--purple-bg,rgba(168,85,247,.1))",icBdr:"rgba(168,85,247,.25)",icClr:"#a855f7",
     val:doneDays+"d", lbl:"días activos totales",
     vClr:"var(--txt)", bg:"var(--bg3)", bdr:"var(--line)"},
  ];

  const grid=G("pc-stats-grid");
  if(grid){
    grid.innerHTML=stats.map(s=>`<div class="pc-stat" style="background:${s.bg};border-color:${s.bdr}">
      <div class="pc-stat-ic" style="background:${s.icBg};border:1px solid ${s.icBdr}">
        <span class="iq-ic sm" data-ic="${s.ic}" style="color:${s.icClr};width:14px;height:14px"></span>
      </div>
      <div class="pc-stat-body">
        <div class="pc-stat-val" style="color:${s.vClr}">${s.val}</div>
        <div class="pc-stat-lbl">${s.lbl}</div>
      </div>
    </div>`).join("");
    paintIcons(grid);
  }
}

/* ══ SETTINGS ══ */
function openSettings(){
  const pid=S.pid;
  const hasPIN=!!(pid&&STORAGE.get("iq_pin_"+pid));
  const lbl=G("pin-status-lbl");
  const btn=G("pin-action-btn");
  const userEl=G("settings-user");
  const syncEl=G("last-sync-lbl");
  const pt=DB.pt(pid);
  if(lbl)lbl.textContent=hasPIN?"PIN activo — acceso protegido":"Sin PIN — acceso libre";
  if(btn)btn.textContent=hasPIN?"Cambiar PIN":"Crear PIN";
  if(userEl)userEl.textContent=pt?.username||"—";
  if(syncEl){
    const ts=STORAGE.get("iq_last_sync_"+pid);
    if(ts){const d=new Date(ts);syncEl.textContent=`${d.getDate()}/${d.getMonth()+1} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;}
    else syncEl.textContent="Nunca";
  }
  showM("m-settings");
}
function settingsPinAction(){
  closeM("m-settings");
  showPinScreen(S.pid,"set");
}

function renderMotivCounter(pid){
  const wrap=G("motiv-counter");if(!wrap)return;
  const adh=DB.adh(pid);
  const prog=DB.prog(pid);
  const streak=calcStreak(adh);
  const doneDays=Object.values(adh).filter(v=>v==="done").length;
  const totalDays=Object.values(adh).filter(v=>v!=="none").length;
  // Days in program = days since first weight entry or first adherence entry
  const sorted=prog.length?[...prog].sort((a,b)=>new Date(a.date)-new Date(b.date)):[];
  const startDate=sorted.length?new Date(sorted[0].date):new Date();
  const daysIn=Math.max(1,Math.round((new Date()-startDate)/(1000*60*60*24)));
  // Streak display
  const streakEmoji=streak>=14?"🔥🔥":streak>=7?"🔥":streak>=3?"⚡":streak>=1?"💪":"—";
  const streakLbl=streak>=1?`${streak}d racha`:"Empieza hoy";
  wrap.innerHTML=`<div class="motiv-counter">
    <div class="motiv-counter-stat">
      <div class="motiv-counter-val">${daysIn}</div>
      <div class="motiv-counter-lbl">días en programa</div>
    </div>
    <div class="motiv-counter-div"></div>
    <div class="motiv-counter-stat">
      <div class="motiv-counter-val">${doneDays}</div>
      <div class="motiv-counter-lbl">días completos</div>
    </div>
    <div class="motiv-counter-div"></div>
    <div class="motiv-counter-streak">
      <div class="motiv-streak-emoji">${streakEmoji}</div>
      <div class="motiv-streak-val">${streakLbl}</div>
    </div>
  </div>`;
}

function drawSparkline(log){
  const canvas=G("sparkline-home");if(!canvas)return;
  const sorted=[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(sorted.length<2){canvas.style.display="none";return}
  canvas.style.display="block";
  const dpr=window.devicePixelRatio||1;
  const pw=canvas.parentElement?.clientWidth||canvas.parentElement?.offsetWidth||100;
  const W=Math.max(60,pw-8),H=28;
  canvas.width=W*dpr;canvas.height=H*dpr;
  canvas.style.width=W+"px";canvas.style.height=H+"px";
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);
  const ws=sorted.map(e=>e.weight);
  const mn=Math.min(...ws),mx=Math.max(...ws);
  const rng=mx-mn||1;
  const pad=2;
  const tx=i=>pad+(i/(ws.length-1))*(W-pad*2);
  const ty=w=>H-pad-((w-mn)/rng)*(H-pad*2);
  // Gradient fill
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,"rgba(212,146,14,.35)");grad.addColorStop(1,"rgba(212,146,14,0)");
  ctx.beginPath();ctx.moveTo(tx(0),ty(ws[0]));
  for(let i=1;i<ws.length;i++){const mx2=(tx(i-1)+tx(i))/2;ctx.bezierCurveTo(mx2,ty(ws[i-1]),mx2,ty(ws[i]),tx(i),ty(ws[i]))}
  ctx.lineTo(tx(ws.length-1),H);ctx.lineTo(tx(0),H);ctx.closePath();
  ctx.fillStyle=grad;ctx.fill();
  // Line
  ctx.beginPath();ctx.moveTo(tx(0),ty(ws[0]));
  for(let i=1;i<ws.length;i++){const mx2=(tx(i-1)+tx(i))/2;ctx.bezierCurveTo(mx2,ty(ws[i-1]),mx2,ty(ws[i]),tx(i),ty(ws[i]))}
  ctx.strokeStyle="#d4920e";ctx.lineWidth=1.5;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke();
  // Last dot
  ctx.beginPath();ctx.arc(tx(ws.length-1),ty(ws[ws.length-1]),2.5,0,Math.PI*2);
  ctx.fillStyle="#f0b429";ctx.fill();
}

