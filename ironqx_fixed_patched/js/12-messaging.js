// FIX Bug17: helper de escape HTML para prevenir XSS
function _e(s){if(s==null)return"";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}

/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Semaforo, inbox, notifications, replies
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function renderSemaforo(){
  const pts=DB.ptsPublic(),wrap=G("semaforo-wrap");if(!wrap)return;
  if(!pts.length){wrap.innerHTML="";return}
  const wk=weekKey();
  const items=pts.map(pt=>{
    const reps=DB.reports(pt.id),thisW=reps.find(r=>r.weekKey===wk);
    const day=new Date().getDay();
    let sfCls,sfLbl,sfIco;
    if(thisW){if(thisW.drReply){sfCls="sf-green";sfLbl="Respondido";sfIco=icon("chat") }else{sfCls="sf-amber";sfLbl="Pendiente respuesta";sfIco=icon("inbox")}}
    else if(day===0||day===6){sfCls="sf-red";sfLbl="Sin entregar";sfIco=icon("alert")}
    else{sfCls="sf-gray";sfLbl="No es domingo";sfIco=icon("note")}
    return{pt,sfCls,sfLbl,sfIco,hasReport:!!thisW,late:thisW?.late};
  });
  const pending=items.filter(i=>i.hasReport&&!DB.reports(i.pt.id).find(r=>r.weekKey===wk)?.drReply);
  const noReport=items.filter(i=>!i.hasReport&&(new Date().getDay()===0||new Date().getDay()===6));
  if(!pending.length&&!noReport.length){wrap.innerHTML="";return}
  wrap.innerHTML=`<div class="card"><div class="card-hd"><div class="card-ico">${icon('traffic')}</div><div><div class="card-title">Semáforo semanal</div><div class="card-sub">Estado de reportes · ${new Date().toLocaleDateString("es",{weekday:"long",day:"numeric",month:"short"})}</div></div></div><div class="card-bd" style="padding:10px 14px">
    ${items.map(item=>{
      const reps=DB.reports(item.pt.id),thisW=reps.find(r=>r.weekKey===wk);
      let dot,lbl;
      if(thisW&&thisW.drReply){dot="sf-green";lbl="Respondido"}
      else if(thisW&&!thisW.drReply){dot="sf-amber";lbl=thisW.late?"Tardío — sin respuesta":"Pendiente tu respuesta"}
      else if(new Date().getDay()===0){dot="sf-red";lbl="No entregó"}
      else if(new Date().getDay()===6){dot="sf-amber";lbl="Vence mañana"}
      else{dot="sf-gray";lbl="—"}
      return`<div class="rowb" style="padding:7px 0;border-bottom:1px solid var(--line)"><div class="row" style="gap:10px"><div class="semaforo-dot ${dot}"></div><span style="font-size:13px;font-weight:700">${_e(item.pt.name.split(" ")[0])} ${_e(item.pt.name.split(" ")[1]||"")}</span></div><span class="fxs tm">${lbl}${thisW&&!thisW.drReply?` <button class="btn btn-xs btn-gold" onclick="openReplyFromInbox('${item.pt.id}','${thisW.weekKey}')" style="margin-left:6px">Responder</button>`:""}</span></div>`;
    }).join("")}
  </div></div>`;
}
function renderInbox(){
  const pending=DB.allPendingReports(),wrap=G("inbox-list"),dot=G("inbox-dot");
  if(dot){if(pending.length>0){dot.classList.add("on");dot.textContent=pending.length}else dot.classList.remove("on")}
  if(!wrap)return;
  if(!pending.length){wrap.innerHTML=`<div class="empty" style="padding:20px"><div class="ei">${icon('inbox','muted')}</div><div class="et">Bandeja vacía</div><div class="es">No hay reportes pendientes de respuesta.</div></div>`;return}
  wrap.innerHTML=pending.map(item=>{
    const r=item.report,d=new Date(r.date),M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return`<div class="report-card" style="margin-bottom:10px"><div class="report-card-hd" onclick="openReplyFromInbox('${item.pid}','${r.weekKey}')">
      <div class="rc-dot ${r.late?"late":"unread"}"></div>
      <div class="f1"><div style="font-size:14px;font-weight:700">${_e(item.ptName)}</div><div class="fxs tm mt4">Semana ${r.week} · ${d.getDate()} ${M[d.getMonth()]}${r.late?" · Tardío":""}</div></div> <!-- FIX Bug39 -->
      <span class="badge ${r.late?"b-purple":"b-amber"}" style="font-size:8px">${r.late?"Tardío":"Nuevo"}</span>
      <span style="font-size:11px;color:var(--gold);font-weight:700;margin-left:8px">Responder →</span>
    </div></div>`;
  }).join("");
}
function openReplyFromInbox(pid,weekKeyOrIdx){
  REPLY_PID=pid;
  const reps=DB.reports(pid),pt=DB.pt(pid);
  // FIX Bug18: buscar por weekKey para evitar race condition con sync
  const idx=typeof weekKeyOrIdx==="string"?reps.findIndex(r=>r.weekKey===weekKeyOrIdx):weekKeyOrIdx;
  REPLY_IDX=idx;
  const r=reps[idx],weekKey=r?.weekKey;
  if(!r)return;
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],d=new Date(r.date);
  G("reply-sub").textContent=`Semana ${r.week} · ${pt?.name} · ${d.getDate()} ${M[d.getMonth()]}`;
  // Build preview
  const days=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  // Use the report's own adherence keys so historical reports show correctly
  const rDays=Object.keys(r.adherence||{}).sort();
  const adhGrid=rDays.map(k=>{const st=r.adherence[k]||"none";const cls=st==="done"?"done":st==="part"?"part":st==="miss"?"miss":"";const dd=new Date(k);return`<div class="rc-day ${cls}">${dd.getDate()}</div>`}).join("");
  const photos=[{src:r.photos?.front,lbl:"Frente"},{src:r.photos?.side,lbl:"Lateral"},{src:r.photos?.back,lbl:"Posterior"}];
  const hasPhotos=photos.some(p=>p.src);
  G("reply-report-preview").innerHTML=`
    <div class="sg c3" style="margin-bottom:12px">
      <div class="sc"><div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--gold)">${r.adherencePct!=null?r.adherencePct:"—"}%</div><div class="su">adherencia</div> <!-- FIX Bug43 --></div>
      <div class="sc ${r.adherencePct>=70?"gr":r.adherencePct>=40?"am":"rd"}"><div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900">${Object.values(r.adherence||{}).filter(v=>(typeof v==="string"?v:(v&&v.notes)||"none")==="done").length}/7 <!-- FIX Bug43b --></div><div class="su">días completos</div></div>
      <div class="sc"><div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--gold)">${r.week}</div><div class="su">semana</div></div>
    </div>
    <div class="rc-adh-mini">${adhGrid}</div>
    ${hasPhotos?`<div class="rc-photos">${photos.map(p=>p.src?`<div class="rc-photo" onclick="openPV('${encodeURIComponent(p.src)}','${p.lbl}')"><img src="${p.src}" loading="lazy"><div class="rc-photo-lbl">${p.lbl}</div></div>`:`<div class="rc-no-photo">—</div>`).join("")}</div>`:""}
    <div style="background:var(--bg3);border:1px solid var(--line);border-radius:var(--rs);padding:12px 13px;margin-top:4px">
      <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">Comentario del paciente</div>
      <div style="font-size:13px;color:var(--txt2);line-height:1.7">${_e(r.comment)}</div>
    </div>`;
  G("reply-txt").value="";
  closeM("m-inbox");showM("m-reply");
}
function submitReply(){
  const reply=G("reply-txt")?.value.trim();
  if(!reply||reply.length<5){toast("⚠️","Escribe una respuesta");haptic('error');return}
  const reps=DB.reports(REPLY_PID);
  // FIX Bug18: re-buscar el reporte por weekKey en vez de usar índice guardado
  // Evita sobreescribir el reporte equivocado si Supabase sync reordenó el array
  const _savedWk=reps[REPLY_IDX]?.weekKey;
  const _realIdx=_savedWk?reps.findIndex(r=>r.weekKey===_savedWk):REPLY_IDX;
  const _target=reps[_realIdx];
  if(!_target){toast("❌","Reporte no encontrado");return}
  _target.drReply=reply;_target.drReplyDate=new Date().toISOString();
  DB.saveReports(REPLY_PID,reps);
  DB.addNotif(REPLY_PID,`El Dr. Arévalo respondió tu reporte de la semana ${_target.week}: "${reply.slice(0,80)}${reply.length>80?"...":""}"`);
  closeM("m-reply");
  refreshAdmin();toast("✅","Respuesta enviada al paciente");
}

/* ── ADMIN PATIENT REPORTES ── */
function renderPtdReportes(pid){
  const reps=DB.reports(pid),wrap=G("ptd-reportes");if(!wrap)return;
  if(!reps.length){wrap.innerHTML=`<div class="empty" style="padding:18px 0"><div class="ei">${icon('note','muted')}</div><div class="et">Sin reportes</div><div class="es">El paciente aún no ha enviado reportes de seguimiento.</div><div><button class="empty ea" onclick="admTab('cfg');setTimeout(()=>{const el=G('notif-msg');if(el){el.focus();el.scrollIntoView({behavior:'smooth',block:'center'});}},200)"><span class="iq-ic sm" data-ic="bell"></span> Enviar recordatorio</button></div></div>`;paintIcons(wrap);return}
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  wrap.innerHTML=reps.map((r,i)=>{
    const d=new Date(r.date),isOpen=i===0;
    // Use dates from the report's own adherence keys so historical reports show correctly
    const rDays=Object.keys(r.adherence||{}).sort();
    const adhGrid=rDays.map(k=>{const st=r.adherence[k]||"none";const cls=st==="done"?"done":st==="part"?"part":st==="miss"?"miss":"";const dd=new Date(k);return`<div class="rc-day ${cls}">${dd.getDate()}</div>`}).join("");
    const photos=[{src:r.photos?.front,lbl:"Frente"},{src:r.photos?.side,lbl:"Lateral"},{src:r.photos?.back,lbl:"Posterior"}];
    const hasPhotos=photos.some(p=>p.src);
    return`<div class="report-card">
      <div class="report-card-hd" onclick="toggleReportCard(this)">
        <div class="rc-dot ${r.drReply?"read":r.late?"late":"unread"}"></div>
        <div class="f1"><div style="font-size:13px;font-weight:700">Semana ${r.week} · ${d.getDate()} ${M[d.getMonth()]}</div><div class="fxs tm mt4">${r.adherencePct}% adherencia${r.late?" · Tardío":""}${r.drReply?" · Respondido":""}</div></div>
        <span class="badge ${r.drReply?"b-green":r.late?"b-purple":"b-amber"}" style="font-size:8px">${r.drReply?"Respondido":r.late?"Tardío":"Sin responder"}</span>
      </div>
      <div class="report-card-bd ${isOpen?"open":""}">
        <div class="rc-adh-mini">${adhGrid}</div>
        ${hasPhotos?`<div class="rc-photos">${photos.map(p=>p.src?`<div class="rc-photo" onclick="openPV('${encodeURIComponent(p.src)}','${p.lbl}')"><img src="${p.src}" loading="lazy"><div class="rc-photo-lbl">${p.lbl}</div></div>`:`<div class="rc-no-photo">—</div>`).join("")}</div>`:""}
        <div style="background:var(--bg3);border:1px solid var(--line);border-radius:var(--rs);padding:11px 13px;margin:8px 0">
          <div class="fmo fxs tm" style="letter-spacing:1.2px;text-transform:uppercase;margin-bottom:5px">Comentario</div>
          <div style="font-size:13px;color:var(--txt2);line-height:1.7">${_e(r.comment)}</div>
        </div>
        ${r.drReply?`<div class="dr-reply"><div class="dr-reply-hd">${icon('stethoscope','sm')} Dr. Arévalo · ${r.drReplyDate?fmtShort(r.drReplyDate):""}</div><div class="dr-reply-txt">${_e(r.drReply)}</div></div>`:`<button class="btn btn-gold" onclick="openReplyFromInbox('${pid}','${r.weekKey}')" style="margin-top:2px">Responder →</button>`}
      </div>
    </div>`;
  }).join("");
}
function toggleReportCard(hd){const bd=hd.nextElementSibling;bd.classList.toggle("open")}

/* ── PHOTOS (admin view) ── */
function renderPtdFotos(pid){
  const sets=DB.photos(pid),wrap=G("ptd-fotos");if(!wrap)return;
  if(!sets.length){wrap.innerHTML=`<div class="empty" style="padding:14px 0"><div class="ei">${icon('camera','muted')}</div><div class="et">Sin fotos</div><div class="es">Las fotos aparecerán aquí cuando el paciente las suba.</div></div>`;return}
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  wrap.innerHTML=sets.slice(0,4).map(set=>{
    const d=new Date(set.date);
    const thumbs=[{src:set.front,lbl:"Frente"},{src:set.side,lbl:"Lateral"},{src:set.back,lbl:"Posterior"}].map(p=>
      p.src?`<div class="rc-photo" onclick="openPV('${encodeURIComponent(p.src)}','${p.lbl}')"><img src="${p.src}" loading="lazy"><div class="rc-photo-lbl">${p.lbl}</div></div>`
           :`<div class="rc-no-photo">—</div>`
    ).join("");
    return`<div style="margin-bottom:10px"><div class="rowb mb8"><span class="fxs fb">${set.note}</span><span class="fxs tm">${d.getDate()} ${M[d.getMonth()]}</span></div><div class="rc-photos">${thumbs}</div></div>`;
  }).join("");
}

/* ── NOTIFICATIONS ── */
function renderNotifs(pid){
  const notifs=DB.notifs(pid),wrap=G("notif-list"),dot=G("notif-dot");
  if(dot)dot.classList.toggle("on",notifs.length>0);
  if(!wrap)return;
  if(!notifs.length){wrap.innerHTML=`<div class="empty" style="padding:18px"><div class="ei">${icon('bell','muted')}</div><div class="et">Sin mensajes</div><div class="es">El Dr. Arévalo te enviará mensajes de seguimiento aquí. Mantente atento a tus avances.</div></div>`;paintIcons(wrap);return}
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  wrap.innerHTML=notifs.map((n,i)=>{
    const d=new Date(n.date);
    const nid=n.id||("n"+i);
    const rd=n.ptReplyDate?new Date(n.ptReplyDate):null;
    // Botón eliminar disponible en todas las notificaciones (ya fueron leídas al abrir el modal)
    return`<div class="card" style="margin-bottom:8px;position:relative"><div class="card-bd" style="padding:10px 12px 10px">
      <button onclick="deleteNotif('${pid}','${nid}')" title="Eliminar mensaje" style="position:absolute;top:9px;right:9px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:8px;padding:4px 6px;cursor:pointer;opacity:.5;transition:all .2s;line-height:0;display:flex;align-items:center;gap:3px" onmouseenter="this.style.opacity='1';this.style.borderColor='rgba(221,68,68,.4)'" onmouseleave="this.style.opacity='.5';this.style.borderColor='var(--line)'">${icon('trash','sm')}</button>
      <div class="chat-bubble dr">
        <div class="chat-sender">${icon('stethoscope','sm')} Dr. Arévalo</div>
        <div>${_e(n.msg)}</div>
        <div class="chat-time">${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}</div>
      </div>
      ${n.ptReply?`<div class="chat-bubble pt">
        <div class="chat-sender">Tú</div>
        <div>${_e(n.ptReply)}</div>
        <div class="chat-time">${rd?rd.getDate()+" "+M[rd.getMonth()]+" "+rd.getFullYear():""}</div>
      </div>`:`<div class="chat-reply-row">
        <textarea class="chat-reply-inp" id="chat-inp-${nid}" placeholder="Responder al Dr..." rows="1"></textarea>
        <button class="chat-reply-btn" onclick="sendChatReply('${pid}','${nid}')">${icon('send','sm')}</button>
      </div>`}
    </div></div>`;
  }).join("");
  paintIcons(wrap);
}
function sendChatReply(pid,nid){
  const inp=G("chat-inp-"+nid);if(!inp)return;
  const reply=inp.value.trim();
  if(!reply){toast("⚠️","Escribe un mensaje");return}
  // FIX Bug22: verificar que la notificación no tenga ya una respuesta (evita sobreescribir)
  const _existing=DB.notifs(pid).find(n=>(n.id||("n"+DB.notifs(pid).indexOf(n)))===nid);
  if(_existing&&_existing.ptReply){toast("⚠️","Ya respondiste este mensaje");return}
  DB.saveNotifReply(pid,nid,reply);
  renderNotifs(pid);
  haptic('success');toast("✅","Mensaje enviado al Dr.");
}
function deleteNotif(pid,nid){
  const db=DB.get();
  if(!db.notifs)db.notifs={};
  const current=db.notifs[pid]||[];
  db.notifs[pid]=current.filter(n=>n.id!==nid);
  DB.save(db);
  if(typeof _queueSync==="function"&&typeof _upsertNotifs==="function"){
    _queueSync(()=>_upsertNotifs(pid,db.notifs[pid]));
  }
  renderNotifs(pid);
  haptic('light');
}

/* ── ADMIN HOME ── */
