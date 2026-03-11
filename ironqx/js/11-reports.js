/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Weekly report tab, submit, render
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function renderReportTab(pid){
  const wrap=G("reporte-content");if(!wrap||!pid)return;
  const rs=reportStatusForPt(pid),pt=DB.pt(pid),week=pt?.week||1;
  // Already sent this week
  if(rs.status==="sent"||rs.status==="late"){
    const r=rs.report;
    const allReps=DB.reports(pid);
    const olderReps=allReps.slice(1); // skip index 0 = current week
    const M2=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const olderHTML=olderReps.length?`
      <div class="report-section" style="padding-top:0">
        <div class="report-section-title" style="margin-bottom:8px">${icon('clock','sm')} Reportes anteriores</div>
        ${olderReps.map((or,oi)=>{
          const od=new Date(or.date);
          const orDays=Object.keys(or.adherence||{}).sort();
          const dn=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
          const orGrid=orDays.map(k=>{const st=or.adherence[k]||"none";const cls=st==="done"?"done":st==="part"?"part":st==="miss"?"miss":"";const dd=new Date(k);return`<div class="ra-day ${cls}" style="pointer-events:none;transform:scale(.82);margin:-1px"><span class="ra-n">${dd.getDate()}</span><span class="ra-lbl">${dn[dd.getDay()]}</span></div>`}).join("");
          return`<div style="border:1px solid var(--line);border-radius:var(--rs);overflow:hidden;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:10px;padding:10px 13px;cursor:pointer;background:var(--bg2)" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.rh-arr').style.transform=this.nextElementSibling.style.display==='none'?'':'rotate(180deg)'">
              <div class="rc-dot ${or.drReply?"read":or.late?"late":"unread"}" style="flex-shrink:0"></div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:700">Semana ${or.week} · ${od.getDate()} ${M2[od.getMonth()]}</div>
                <div style="font-size:10px;color:var(--muted);font-family:'Inter',sans-serif;margin-top:1px">${or.adherencePct}% adh${or.late?" · Tardío":""}${or.drReply?" · Respondido":""}</div>
              </div>
              <span class="badge ${or.drReply?"b-green":or.late?"b-purple":"b-amber"}" style="font-size:7.5px">${or.drReply?"✓ Resp.":or.late?"Tardío":"—"}</span>
              <span class="rh-arr iq-ic sm" data-ic="chevron-down" style="color:var(--muted);transition:transform .2s;flex-shrink:0"></span>
            </div>
            <div style="display:none;padding:10px 13px;background:var(--bg3);border-top:1px solid var(--line)">
              <div class="report-adh" style="margin-bottom:8px;pointer-events:none">${orGrid}</div>
              <div style="font-size:12px;color:var(--txt2);line-height:1.65;margin-bottom:8px">${or.comment}</div>
              ${or.drReply?`<div class="dr-reply" style="margin-top:0"><div class="dr-reply-hd">${icon('stethoscope','sm')} Dr. Arévalo</div><div class="dr-reply-txt">${or.drReply}</div></div>`:`<div style="font-size:11px;color:var(--muted);font-family:'Inter',sans-serif">Sin respuesta aún</div>`}
            </div>
          </div>`;
        }).join("")}
      </div>`:"";
    wrap.innerHTML=sentReportHTML(r,week,rs.status,pid)+olderHTML;
    paintIcons(wrap);
    return;
  }
  // Form
  RPT_ADH={};RPT_PHOTOS={};
  const days=getWeekDays();
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const adh=DB.adh(pid);
  // Pre-fill adh from existing adh data for this week
  days.forEach(d=>{const k=d.toISOString().slice(0,10);RPT_ADH[k]=adh[k]||"none"});
  const dayNames=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  // FIX Bug4: isLate = lunes a viernes de la semana SIGUIENTE al domingo de cierre
  // El reporte es puntual solo el domingo (getDay()===0) o el sábado (getDay()===6)
  const isLate=new Date().getDay()>=1&&new Date().getDay()<=5;
  wrap.innerHTML=`
    ${isLate?`<div class="report-banner late" style="margin-bottom:16px"><div class="rb-tag late">Entrega tardía</div><div class="rb-header"><div class="rb-icon">${icon('note')}</div><div><div class="rb-title">Reporte tardío</div><div class="rb-sub">El plazo fue el domingo. Puedes enviarlo igual — quedará marcado como tardío.</div></div></div></div>`:`<div class="report-banner ${new Date().getDay()===0?"urgent":"pending"}" style="margin-bottom:16px"><div class="rb-tag ${new Date().getDay()===0?"urgent":"pending"}">${new Date().getDay()===0?"Ultimo dia":"Mañana vence"}</div><div class="rb-header"><div class="rb-icon">${icon('note')}</div><div><div class="rb-title">Reporte Semana ${week}</div><div class="rb-sub">Cuéntale al Dr. cómo fue tu semana.</div></div></div></div>`}
    
    <div class="report-section">
      <div class="report-section-title">${icon('check-circle','sm')} Adherencia de la semana</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Toca cada día para marcar tu cumplimiento</div>
      <div class="report-adh" id="rpt-adh-grid"></div>
      <div class="rowb"><div style="display:flex;gap:7px;flex-wrap:wrap"><span class="fxs" style="color:var(--green)">● Completo</span><span class="fxs" style="color:var(--gold)">● Parcial</span><span class="fxs" style="color:var(--red)">● No cumplí</span></div><span class="fsm tg fb" id="rpt-adh-pct">—</span></div>
    </div>

    <div class="report-section">
      <div class="report-section-title">${icon('camera','sm')} Fotos de la semana</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Frente · Lateral · Posterior</div>
      <div class="photo-strip">
        <div class="photo-slot photo-slot-empty" id="rpz-front" onclick="triggerRptPhoto('front')"><div class="ps-ic">${icon('camera')}</div><div class="ps-lb">Frente</div></div>
        <div class="photo-slot photo-slot-empty" id="rpz-side" onclick="triggerRptPhoto('side')"><div class="ps-ic">${icon('camera')}</div><div class="ps-lb">Lateral</div></div>
        <div class="photo-slot photo-slot-empty" id="rpz-back" onclick="triggerRptPhoto('back')"><div class="ps-ic">${icon('camera')}</div><div class="ps-lb">Posterior</div></div>
      </div>
      <input type="file" id="rpt-photo-inp" accept="image/*" style="display:none" onchange="handleRptPhoto(event)">
    </div>

    <div class="report-section">
      <div class="report-section-title">${icon('chat','sm')} Tu autoevaluación</div>
      <div class="field"><label class="flbl">¿Cómo fue tu semana? ¿Lo hiciste bien? ¿Por qué no?</label><textarea id="rpt-comment" placeholder="ej. Cumplí de lunes a jueves perfecto, el fin de semana me costó más por una reunión familiar. La energía estuvo buena y noté menos retención. Creo que mejoré bastante en la constancia..." style="min-height:110px"></textarea></div>
    </div>

    <button class="btn btn-gold" onclick="submitReport()">Enviar reporte →</button>
    <div style="height:12px"></div>
  `;
  renderRptAdhGrid(days,dayNames);
}

function renderRptAdhGrid(days,dayNames){
  const grid=G("rpt-adh-grid");if(!grid)return;
  grid.innerHTML=days.map((d,i)=>{
    const key=d.toISOString().slice(0,10),st=RPT_ADH[key]||"none";
    const cls=st==="done"?"done":st==="part"?"part":st==="miss"?"miss":"";
    return`<div class="ra-day ${cls}" onclick="cycleRptAdh('${key}',this)"><span class="ra-n">${d.getDate()}</span><span class="ra-lbl">${dayNames[i]}</span></div>`;
  }).join("");
  updateRptPct();
}
function cycleRptAdh(key,el){
  const states=["none","done","part","miss"];
  RPT_ADH[key]=states[(states.indexOf(RPT_ADH[key]||"none")+1)%4];
  const s=RPT_ADH[key];el.className=`ra-day ${s==="done"?"done":s==="part"?"part":s==="miss"?"miss":""}`;
  updateRptPct();
}
function updateRptPct(){
  const vals=Object.values(RPT_ADH),done=vals.filter(v=>v==="done").length,total=vals.filter(v=>v!=="none").length||7;
  const pct=Math.round((done/7)*100);const el=G("rpt-adh-pct");if(el)el.textContent=pct+"% adherencia";
}
let RPT_PHOTO_TARGET=null;
function triggerRptPhoto(slot){RPT_PHOTO_TARGET=slot;G("rpt-photo-inp").click()}
function handleRptPhoto(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      // FIX Bug5: reducir MAX y calidad para proteger localStorage (límite ~5MB en iOS)
      // 600px a 0.60 ≈ ~60-80KB por foto vs ~250KB antes — 3 fotos ≈ ~200KB total
      const MAX=600,cvs=document.createElement("canvas");
      let w=img.width,h=img.height;
      if(w>h){if(w>MAX){h=h*MAX/w;w=MAX}}else{if(h>MAX){w=w*MAX/h;h=MAX}}
      cvs.width=w;cvs.height=h;cvs.getContext("2d").drawImage(img,0,0,w,h);
      const b64=cvs.toDataURL("image/jpeg",0.60);
      RPT_PHOTOS[RPT_PHOTO_TARGET]=b64;
      const zone=G("rpz-"+RPT_PHOTO_TARGET);
      zone.className="photo-slot photo-slot-full";
      const lbl=RPT_PHOTO_TARGET==="front"?"Frente":RPT_PHOTO_TARGET==="side"?"Lateral":"Posterior";
      zone.innerHTML=`<img src="${b64}" style="width:100%;height:100%;object-fit:cover"><div class="ps-overlay">${lbl}</div>`;
      e.target.value="";
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
function submitReport(){
  const pid=S.pid,comment=G("rpt-comment")?.value.trim();
  if(!comment||comment.length<10){toast("⚠️","Escribe al menos un breve comentario");return}
  const wk=weekKey(),isLate=new Date().getDay()>=1&&new Date().getDay()<=5; // FIX Bug4: tardío solo Lun-Vie
  const adhSnap={...RPT_ADH};
  const done=Object.values(adhSnap).filter(v=>v==="done").length;
  const pct=Math.round((done/7)*100);
  const report={weekKey:wk,week:DB.pt(pid)?.week||1,date:new Date().toISOString(),adherence:adhSnap,adherencePct:pct,comment,photos:{front:RPT_PHOTOS.front||null,side:RPT_PHOTOS.side||null,back:RPT_PHOTOS.back||null},late:isLate,drReply:null,drReplyDate:null};
  // Save report
  const reps=DB.reports(pid);
  const existing=reps.findIndex(r=>r.weekKey===wk);
  if(existing>=0)reps[existing]=report;else reps.unshift(report);
  // FIX Bug5: guard de cuota — intentar guardar el reporte, capturar error de cuota
  try{DB.saveReports(pid,reps);}catch(e){
    if(e.name==='QuotaExceededError'){toast('⚠️','Almacenamiento lleno — el reporte se guardó sin fotos');report.photos={front:null,side:null,back:null};DB.saveReports(pid,reps);}
  }
  // Also save photos to progress tab if any
  if(RPT_PHOTOS.front||RPT_PHOTOS.side||RPT_PHOTOS.back){
    try{
      const sets=DB.photos(pid);
      sets.unshift({date:new Date().toISOString(),note:`Reporte Sem ${report.week}`,front:RPT_PHOTOS.front||null,side:RPT_PHOTOS.side||null,back:RPT_PHOTOS.back||null});
      DB.savePhotos(pid,sets);
    }catch(e){if(e.name==='QuotaExceededError')console.warn('[IQ] Cuota localStorage llena — fotos de progreso no guardadas');}
  }
  // Also update adherence in main adh store
  const adh=DB.adh(pid);Object.assign(adh,adhSnap);DB.saveAdh(pid,adh);
  toast("✅","Reporte enviado al Dr. Arévalo");
  if(pct===100){
    setTimeout(()=>{
      fireConfetti(window.innerWidth*0.3,window.innerHeight*0.3);
      fireConfetti(window.innerWidth*0.7,window.innerHeight*0.35);
      fireConfetti(window.innerWidth*0.5,window.innerHeight*0.25);
    },300);
  }
  renderReportBanner(pid);
  setTimeout(()=>{renderReportTab(pid)},500);
}

function sentReportHTML(r,week,status,pid){
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const d=new Date(r.date);
  // Use the report's own adherence keys so historical reports display correctly
  const rDays=Object.keys(r.adherence||{}).sort();
  const dayNames=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const adhGrid=rDays.map(k=>{const st=r.adherence[k]||"none";const cls=st==="done"?"done":st==="part"?"part":st==="miss"?"miss":"";const dd=new Date(k);return`<div class="ra-day ${cls}" style="pointer-events:none"><span class="ra-n">${dd.getDate()}</span><span class="ra-lbl">${dayNames[dd.getDay()]}</span></div>`}).join("");
  const photos=[{src:r.photos?.front,lbl:"Frente"},{src:r.photos?.side,lbl:"Lateral"},{src:r.photos?.back,lbl:"Posterior"}];
  const hasPhotos=photos.some(p=>p.src);
  // Feature 3: weight diff block
  let weightBlock="";
  if(pid){
    const _pt=DB.pt(pid);
    const _prog=[...DB.prog(pid)].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const _rDate=new Date(r.date).getTime();
    // Find closest entry at or before the report date
    const _before=_prog.filter(e=>new Date(e.date).getTime()<=_rDate+86400000*2);
    if(_before.length>=1){
      const _cur=_before[_before.length-1];
      const _prev=_before.length>=2?_before[_before.length-2]:null;
      const _ini=_prog[0];
      const _wDiff=_prev?parseFloat((_cur.weight-_prev.weight).toFixed(1)):null;
      const _wTotal=_ini&&_ini!==_cur?parseFloat((_cur.weight-_ini.weight).toFixed(1)):null;
      const _goal=_pt?.goal||"";
      const _ficha=_pt?.ficha||null;
      const _wDiffColor=_wDiff!==null?weightDeltaColor(_wDiff,_goal,_ficha).color:"var(--muted)";
      const _wTotalColor=_wTotal!==null?weightDeltaColor(_wTotal,_goal,_ficha).color:"var(--muted)";
      const _pesoMeta=parseFloat(_pt?.ficha?.pesoMeta);
      const _metaDiff=_pesoMeta?parseFloat((_cur.weight-_pesoMeta).toFixed(1)):null;
      const _metaColor=_metaDiff!==null?(Math.abs(_metaDiff)<0.3?"var(--green)":weightDeltaColor(_metaDiff,_goal,_ficha).color):"var(--muted)";
      weightBlock=`<div class="report-section">
        <div class="report-section-title">${icon('weight','sm')} Composición al entregar</div>
        <div class="sg ${_pesoMeta?"c3":"c2"}" style="margin-top:0">
          <div class="sc"><div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--gold)">${_cur.weight.toFixed(1)}<span style="font-size:12px;margin-left:2px">kg</span></div><div class="su">peso actual</div></div>
          <div class="sc"><div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:${_wDiffColor}">${_wDiff!==null?(_wDiff>0?"+":"")+_wDiff+" kg":"—"}</div><div class="su">vs semana ant.</div></div>
          ${_pesoMeta?`<div class="sc"><div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:${_metaColor}">${_metaDiff!==null?(_metaDiff>0?"+":"")+_metaDiff+" kg":"—"}</div><div class="su">para meta</div></div>`:""}
        </div>
        ${_wTotal!==null?`<div style="text-align:center;font-family:'Inter',sans-serif;font-size:10px;color:var(--muted);margin-top:2px">Total acumulado: <span style="color:${_wTotalColor};font-weight:700">${_wTotal>0?"+":""+(Math.abs(_wTotal)===0?"":"")}${_wTotal} kg</span></div>`:""}
      </div>`;
    }
  }
  return`
    <div class="report-banner ${status}" style="margin-bottom:16px">
      <div class="rb-tag ${status}">${status==="late"?"Tardío":"Entregado"}</div>
      <div class="rb-header"><div class="rb-icon">${r.drReply?icon("chat"):icon("check-circle")}</div><div><div class="rb-title">Reporte Semana ${week}</div><div class="rb-sub">Enviado el ${d.getDate()} ${M[d.getMonth()]} · ${r.adherencePct}% adherencia</div></div></div>
    </div>
    ${weightBlock}
    <div class="report-section">
      <div class="report-section-title">${icon('check-circle','sm')} Adherencia registrada</div>
      <div class="report-adh" style="margin-bottom:8px">${adhGrid}</div>
    </div>
    ${hasPhotos?`<div class="report-section"><div class="report-section-title">${icon('camera','sm')} Fotos enviadas</div><div class="photo-strip">${photos.map(p=>p.src?`<div class="photo-slot photo-slot-full" onclick="openPV('${encodeURIComponent(p.src)}','${p.lbl}')"><img src="${p.src}" style="width:100%;height:100%;object-fit:cover"><div class="ps-overlay">${p.lbl}</div></div>`:`<div class="photo-slot photo-slot-empty" style="cursor:default;opacity:.3"><div class="ps-ic" style="font-size:18px">—</div></div>`).join("")}</div></div>`:""}
    <div class="report-section">
      <div class="report-section-title">${icon('chat','sm')} Tu comentario</div>
      <div class="card"><div class="card-bd"><div style="font-size:13px;color:var(--txt2);line-height:1.7">${r.comment}</div></div></div>
    </div>
    ${r.drReply?`<div class="report-section"><div class="report-section-title" style="color:var(--gold)">${icon('stethoscope','sm')} Respuesta del Dr. Arévalo</div><div class="dr-reply"><div class="dr-reply-hd">${icon('stethoscope','sm')} Dr. Arévalo</div><div class="dr-reply-txt">${r.drReply}</div></div></div>`:`<div style="text-align:center;padding:16px 0"><div class="ei" style="font-size:28px;margin-bottom:8px;opacity:1">${icon('hourglass','muted')}</div><div class="fsm tm">El Dr. revisará tu reporte pronto</div></div>`}
    <div style="height:10px"></div>
  `;
}

/* ─────────────────────────────────────────
   ADMIN — REPORTS
───────────────────────────────────────── */
