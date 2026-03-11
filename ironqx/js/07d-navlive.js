/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Nav live data, settings, motiv counter
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function renderNavLiveData(pid){
  // Plan card: show "Sem X" badge
  const pt=DB.pt(pid);
  const planEl=G("hnc-plan-live");
  if(planEl&&pt){
    const hasPlan=!!DB.planHtml(pid);
    planEl.innerHTML=hasPlan
      ?`<div class="hnc-live-val" style="color:var(--gold)">Sem ${pt.week||1}</div><div class="hnc-live-lbl">activa</div>`
      :`<div class="hnc-live-pill" style="color:var(--amber);border-color:rgba(232,150,12,.3)">Pendiente</div>`;
  }
  // Progress card: show last weight
  const prog=DB.prog(pid);
  const progEl=G("hnc-prog-live");
  if(progEl){
    const sorted=prog.length?[...prog].sort((a,b)=>new Date(b.date)-new Date(a.date)):[];
    if(sorted.length){
      const diff=sorted.length>=2?parseFloat((sorted[0].weight-sorted[sorted.length-1].weight).toFixed(1)):null;
      const dColor=diff===null?"var(--silver)":diff<0?"var(--green)":"var(--red)";
      progEl.innerHTML=`<div class="hnc-live-val" style="color:var(--blue)">${sorted[0].weight.toFixed(1)}</div><div class="hnc-live-lbl">kg actual</div>`;
    } else {
      progEl.innerHTML=`<div class="hnc-live-pill" style="color:var(--blue);border-color:rgba(85,119,238,.3)">Registrar</div>`;
    }
  }
  // Report card: countdown or status
  const repEl=G("hnc-rep-live");
  if(repEl){
    const day=new Date().getDay(); // 0=Sun
    const rs=reportStatusForPt(pid);
    if(rs.status==="sent"||rs.status==="late"){
      repEl.innerHTML=`<div class="hnc-live-pill" style="color:var(--green);border-color:rgba(46,171,101,.3)">Enviado</div>`;
    } else if(rs.status==="urgent"){
      repEl.innerHTML=`<div class="hnc-live-pill" style="color:var(--red);border-color:rgba(221,68,68,.3)">Hoy!</div>`;
    } else if(day===6){
      repEl.innerHTML=`<div class="hnc-live-pill" style="color:var(--amber);border-color:rgba(232,150,12,.3)">Mañana</div>`;
    } else {
      const daysToSun=day===0?7:7-day;
      repEl.innerHTML=`<div class="hnc-live-val" style="color:var(--txt2)">${daysToSun}</div><div class="hnc-live-lbl">días</div>`;
    }
  }
}

