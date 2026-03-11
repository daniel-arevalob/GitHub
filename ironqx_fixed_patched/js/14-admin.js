// FIX Bug17: helper de escape HTML para prevenir XSS
function _e(s){if(s==null)return"";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}

/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Admin panel, patient list, detail, tabs
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function loadAdmin(){showNav(false);refreshAdmin();show("scr-admin")}
function refreshAdmin(){
  const pts=DB.ptsPublic();
  const tot=pts.length;
  const act=pts.filter(p=>{const s=payStatus(p).status;return s==="on"||s==="trial"}).length;
  const off=pts.filter(p=>payStatus(p).status==="off").length;
  const wk=weekKey();
  const pendingRep=pts.filter(p=>DB.reports(p.id).find(r=>r.weekKey===wk&&!r.drReply)).length;

  // KPI values
  G("a-tot").textContent=tot;
  G("a-act").textContent=act;
  G("a-off").textContent=off;
  G("a-pend-rep").textContent=pendingRep;

  // KPI bar fills (animate after paint)
  requestAnimationFrame(()=>{
    const f=t=>Math.round((t/Math.max(tot,1))*100)+"%";
    const fa=G("kpi-fill-act");if(fa)fa.style.width=f(act);
    const fo=G("kpi-fill-off");if(fo)fo.style.width=f(off);
    const fr=G("kpi-fill-rep");if(fr)fr.style.width=pendingRep>0?"100%":"0%";
  });

  // Urgent highlight on report card
  const repCard=G("kpi-rep");
  if(repCard)repCard.classList.toggle("kpi-urgent",pendingRep>0);
  const repLbl=G("kpi-rep-lbl");
  if(repLbl)repLbl.textContent=pendingRep===0?"Al día":"Pendientes";

  // Hero date + greeting
  const now=new Date();
  const days=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const months=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const dateEl=G("adm-date");
  if(dateEl)dateEl.textContent=`${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const h=now.getHours();
  const greetEl=G("adm-greet");
  if(greetEl)greetEl.textContent=h<12?"Buenos días, Dr.":h<19?"Buenas tardes, Dr.":"Buenas noches, Dr.";

  // Status sub — solo muestra reportes pendientes, nada más
  const statusEl=G("adm-status-lbl");
  if(statusEl){
    if(pendingRep>0)statusEl.textContent=`${pendingRep} reporte${pendingRep>1?"s":""} pendiente${pendingRep>1?"s":""}`;
    else statusEl.textContent="";
  }

  // Inbox badge
  const allPending=DB.allPendingReports();
  const dot=G("inbox-dot");
  if(dot){if(allPending.length>0){dot.classList.add("on");dot.textContent=allPending.length}else dot.classList.remove("on")}

  renderSemaforo();

  const wrap=G("pt-list");
  if(!pts.length){wrap.innerHTML=`<div class="empty"><div class="ei">${icon('user','muted')}</div><div class="et">Sin pacientes</div></div>`;return}

  wrap.innerHTML=pts.map(p=>{
    const prog=DB.prog(p.id);
    const last=prog.length?[...prog].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]:null;
    const hp=!!DB.planHtml(p.id),pay=payStatus(p);
    const reps=DB.reports(p.id),thisW=reps.find(r=>r.weekKey===wk);

    // Report status
    let repColor="var(--muted)",repLabel="";
    if(thisW&&thisW.drReply){repColor="var(--green)";repLabel=`✓ Respondido · ${thisW.adherencePct}% adh`;}
    else if(thisW&&!thisW.drReply){repColor="var(--amber)";repLabel=`⚑ Sin responder · ${thisW.adherencePct}% adh`;}
    else if(new Date().getDay()===0){repColor="var(--red)";repLabel="✕ No entregó reporte";}

    // Adherence ring
    const adh=DB.adh(p.id);
    // FIX: usar _na para normalizar valores object (post-Supabase) y limitar a las últimas 8 semanas
    const _8wAgo=new Date();_8wAgo.setDate(_8wAgo.getDate()-56);
    const _8wStr=_8wAgo.toISOString().slice(0,10);
    const _recentAdh=Object.entries(adh).filter(([k])=>k>=_8wStr);
    const adhDone=_recentAdh.filter(([,v])=>_na(v)==="done").length;
    const adhTotal=Math.max(_recentAdh.length,1);
    const adhPct=Math.round((adhDone/adhTotal)*100);
    const rR=20,rC=2*Math.PI*rR;
    const rOff=rC*(1-adhPct/100);
    const rCol=adhPct>=80?"#2eab65":adhPct>=50?"#e8960c":"#dd4444";
    const ringBg=adhPct>=80?"rgba(46,171,101,.1)":adhPct>=50?"rgba(232,150,12,.1)":"rgba(221,68,68,.1)";
    const avStyle=goalAvatarStyle(p.goal)||`background:${ringBg};`;

    // Card accent class
    const cardCls=pay.status==="off"?"ptcard ptc-off":repLabel&&repLabel.startsWith("⚑")?"ptcard ptc-warn":"ptcard";

    // Last weight change
    const sorted=[...prog].sort((a,b)=>new Date(a.date)-new Date(b.date));


    // ── Tendencia semanal de peso (últimos 7 días)
    const now=new Date();
    const week7=sorted.filter(e=>new Date(e.date)>= new Date(now-7*86400000));
    let trendHtml="";
    const _trendCls=(tw)=>weightDeltaClass(tw,p.goal,p.ficha,p.weight); // goal-aware + pesoMeta-aware
    const _trendArrow=(tw)=>tw<-0.05?"↓":tw>0.05?"↑":"→";
    if(week7.length>=2){
      const tw=week7[week7.length-1].weight-week7[0].weight;
      trendHtml=`<span class="ptcard-trend ${_trendCls(tw)}">${_trendArrow(tw)} ${(tw>0?"+":"")+tw.toFixed(1)}kg <span style="opacity:.6;font-size:7.5px">7d</span></span>`;
    } else if(sorted.length>=2){
      const tw=sorted[sorted.length-1].weight-sorted[0].weight;
      trendHtml=`<span class="ptcard-trend ${_trendCls(tw)}">${_trendArrow(tw)} ${(tw>0?"+":"")+tw.toFixed(1)}kg <span style="opacity:.6;font-size:7.5px">total</span></span>`;
    }
    // ── Última actividad
    const allAdhKeys=Object.keys(adh).sort().reverse();
    const lastActive=allAdhKeys.find(k=>_na(adh[k])==="done"||_na(adh[k])==="part"); // FIX: normalizar _na
    let actLabel="",actCls="";
    if(lastActive){
      const daysAgo=Math.round((new Date()-new Date(lastActive))/(1000*60*60*24));
      if(daysAgo===0){actLabel="Activo hoy";actCls="ptc-act-hot";}
      else if(daysAgo<=3){actLabel=`Hace ${daysAgo}d`;actCls="ptc-act-hot";}
      else if(daysAgo<=7){actLabel=`Hace ${daysAgo}d`;actCls="ptc-act-warm";}
      else{actLabel=`${daysAgo}d sin actividad`;actCls="ptc-act-cold";}
    }else{actLabel="Sin actividad";actCls="ptc-act-cold";}

    // ── Días en programa
    const _startDate=p.ficha?.fechaInicial||(sorted.length?sorted[0].date:null);
    const _daysInProg=_startDate?Math.round((new Date()-new Date(_startDate))/(864e5)):null;
    const _daysStr=_daysInProg!==null?(_daysInProg>=365?Math.floor(_daysInProg/365)+"a "+Math.floor((_daysInProg%365)/30)+"m":_daysInProg>=30?Math.floor(_daysInProg/30)+"m "+(_daysInProg%30)+"d":_daysInProg+"d"):null;

    return `<div class="${cardCls}" data-pid="${p.id}" data-status="${pay.status}" data-hasrep="${thisW?"true":"false"}" onclick="openPt('${p.id}')">
      <div class="ptcard-top">
        <div class="ptcard-av-wrap">
          <svg class="ptcard-ring-svg" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="${rR}" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="2.5"/>
            <circle cx="28" cy="28" r="${rR}" fill="none" stroke="${rCol}" stroke-width="2.5"
              stroke-linecap="round" stroke-dasharray="${rC.toFixed(1)}" stroke-dashoffset="${rOff.toFixed(1)}"
              transform="rotate(-90 28 28)"/>
          </svg>
          <div class="ptcard-av" style="${avStyle}">${initials(p.name)}</div>
        </div>
        <div class="ptcard-info">
          <div class="ptcard-name">${_e(p.name)}</div>
          <div class="ptcard-meta">${_e(p.goal)}</div>
        </div>
        <div class="ptcard-badges">
          <span class="sp ${pay.cls}"><span class="sp-dot"></span>${pay.label}</span>
          <span class="ptcard-activity ${actCls}">${actLabel}</span>
        </div>
      </div>
      <div class="ptcard-divider"></div>
      <div class="ptcard-bottom">
        <div class="ptc-stat-row" style="flex:1">
          <span>Sem <b>${p.week}</b></span>
          ${_daysStr?`<span style="color:var(--line2)">·</span><span style="color:var(--muted)">${_daysStr}</span>`:""}
          <span style="color:var(--line2)">·</span>
          <span><b>${last?last.weight.toFixed(1)+" kg":"—"}</b></span>
          ${trendHtml?`<span style="color:var(--line2)">·</span>${trendHtml}`:""}
          <span style="color:var(--line2)">·</span>
          <span style="color:${rCol};font-weight:700">${adhPct}% adh</span>
          ${hp?`<span style="color:var(--line2)">·</span><span class="badge b-green" style="font-size:7.5px">Plan ✓</span>`:''}
        </div>
        ${repLabel?`<div style="width:100%;margin-top:5px;padding-top:5px;border-top:1px solid var(--line);font-family:'Barlow',sans-serif;font-size:10px;font-weight:600;color:${repColor}">${repLabel}</div>`:""}
      </div>
      ${(()=>{const notes=DB.drNotes(p.id);const last=notes[0];return notes.length?`<div class="ptcard-note" onclick="event.stopPropagation();editDrNote('${p.id}')"><span class="ptcard-note-ic">📌</span><span class="ptcard-note-txt">${_e(last.text)}</span>${notes.length>1?`<span class="badge b-amber" style="font-size:7px;margin-left:4px">${notes.length}</span>`:""}</div>`:`<div class="ptcard-note" onclick="event.stopPropagation();editDrNote('${p.id}')"><span class="ptcard-note-add">+ Añadir nota clínica</span></div>`})()}
    </div>`;
  }).join("");
  filterPatients();
}

/* ── ADMIN TIMELINE ── */
function buildAdmTimeline(pid){
  const wrap=G("adm-timeline");if(!wrap)return;
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const fmt=function(iso){const d=new Date(iso);return`${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`};
  const fmtHour=function(iso){const d=new Date(iso);return`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
  const events=[];
  // Pesajes
  (DB.prog(pid)||[]).forEach(e=>events.push({date:e.date,type:"peso",icon:"activity",cls:"tl-gold",title:`Pesaje: ${e.weight} kg`,sub:e.note||""}));
  // Ficha snapshots
  (DB.fichaHistory(pid)||[]).forEach(e=>events.push({date:e.date,type:"ficha",icon:"edit",cls:"tl-blue",title:`Medición clínica`,sub:`Peso ${e.peso||"—"} kg · Grasa ${e.grasa||"—"}%`}));
  // Reportes enviados
  (DB.reports(pid)||[]).forEach(r=>{const d=r.weekKey||r.date||"";if(d)events.push({date:d,type:"reporte",icon:"note",cls:"tl-green",title:`Reporte ${r.weekKey||""}`,sub:r.mood?`Estado: ${r.mood}`:"Enviado"})});
  // Fotos subidas (cada set)
  (DB.photos(pid)||[]).filter(s=>s.date).forEach(s=>events.push({date:s.date,type:"foto",icon:"camera",cls:"tl-purple",title:`Fotos registradas`,sub:Object.keys(s).filter(k=>k!=="date"&&s[k]).length+" ángulo(s)"}));
  // Mensajes del Dr.
  (DB.notifs(pid)||[]).forEach(n=>{if(n.date)events.push({date:n.date,type:"msg",icon:"bell",cls:"tl-amber",title:`Mensaje del Dr.`,sub:(n.msg||"").slice(0,60)})});
  // Notas clínicas del Dr.
  (DB.drNotes(pid)||[]).forEach(n=>events.push({date:n.date,type:"nota",icon:"note",cls:"tl-blue",title:`Nota clínica`,sub:(n.text||"").slice(0,60)}));
  // Sort newest first
  events.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const MAX=30;
  const show=events.slice(0,MAX);
  if(!show.length){wrap.innerHTML=`<div class="tl-empty">Sin actividad registrada</div>`;return}
  const icons_map={activity:"activity",edit:"edit",note:"note",camera:"camera",bell:"bell"};
  wrap.innerHTML=show.map((ev,i)=>{
    const isLast=(i===show.length-1);
    return`<div class="tl-item">
      <div class="tl-left">
        <div class="tl-dot ${ev.cls}">${icon(ev.icon)}</div>
        ${!isLast?`<div class="tl-line"></div>`:""}
      </div>
      <div class="tl-content">
        <div class="tl-date">${fmt(ev.date)} · ${fmtHour(ev.date)}</div>
        <div class="tl-title">${ev.title}</div>
        ${ev.sub?`<div class="tl-sub">${ev.sub}</div>`:""}
      </div>
    </div>`;
  }).join("")+(events.length>MAX?`<div class="tl-empty">+${events.length-MAX} eventos anteriores</div>`:"");
  paintIcons(wrap);
}
/* ── ADMIN PATIENT DETAIL ── */
function openPt(id){
  S.selPid=id;const pt=DB.pt(id);if(!pt)return;
  G("ptd-hd-name").textContent=pt.name.split(" ")[0];G("ptd-hd-goal").textContent=pt.goal;
  G("ptd-av").textContent=initials(pt.name);G("ptd-name").textContent=pt.name;G("ptd-goal").textContent=pt.goal;
  G("ptd-meta").textContent=`Sem ${pt.week} · ${pt.username||pt.code||"—"}`;G("ptact-name").textContent=pt.name;
  G("week-inp").value=pt.week;G("exp-inp").value=pt.expDate||"";
  G("user-inp").value=pt.username||pt.code||"";G("pass-inp").value=pt.password||pt.code||"";
  // Mostrar la contraseña actual como recordatorio visual
  const _hint=document.getElementById("pass-hint");
  if(_hint){
    const _pw=pt.password||pt.code||"";
    _hint.textContent=_pw?"ACTUAL: "+_pw:"sin contraseña";
  }
  const pay=payStatus(pt);
  G("ptd-pay").innerHTML=`<div class="pay-c ${pay.status}"><div class="rowb"><div><div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase">${pay.status==="on"?"Membresía activa":pay.status==="off"?"Membresía vencida":"Demo/Trial"}</div><div style="font-family:'Inter',sans-serif;font-size:11px;color:var(--muted);margin-top:3px">${pt.expDate?(parseDateLocal(pt.expDate)<new Date()?"Venció el ":"Activa hasta ")+fmtDate(pt.expDate):"Sin fecha de vencimiento"}</div></div>${pay.status==="on"?icon("check-circle","green"):pay.status==="off"?icon("lock","red"):icon("spark","amber")}</div></div>`;
  renderFicha(pt);
  renderAdminBodyComp(id);
  renderPtdReportes(id);
  {
    const _hp=DB.planHtml(S.selPid);
    const _isUrl=_hp&&(_hp.startsWith("http://")||_hp.startsWith("https://"));
    const _delBtn=G("ptd-plan-del");
    if(_hp){
      G("ptd-plan-t").textContent="Plan cargado ✓";
      G("ptd-plan-s").textContent=_isUrl?"Alojado en nube · el paciente lo ve en la app":"HTML embebido · el paciente lo ve en la app";
      G("ptd-plan-b").textContent="Activo";G("ptd-plan-b").style.cssText="background:var(--green-bg);color:var(--green);border-color:var(--green-brd)";
      G("upsub").textContent="Toca para subir nueva versión";
      if(_delBtn)_delBtn.style.display="flex";
    }else{
      G("ptd-plan-t").textContent="Sin plan";G("ptd-plan-s").textContent="Paciente ve pantalla de espera";
      G("ptd-plan-b").textContent="Sin plan";G("ptd-plan-b").style.cssText="background:var(--red-bg);color:var(--red);border-color:var(--red-brd)";
      G("upsub").textContent="Selecciona el HTML generado por Claude";
      if(_delBtn)_delBtn.style.display="none";
    }
  }
  renderPtdFotos(id);
  renderAdmAdhHist(id);
  buildAdmTimeline(id);
  renderAdmTimeline(id);
  loadMacrosForm(id);
  loadDrNote(id);
  renderSchedList(id);
  show("scr-ptd");
  admTab('res');  // resets tab UI + triggers chart draw via double RAF
  // Fix ②: admTab's RAF races with the 280ms screen transition; re-paint diff after it settles
  setTimeout(()=>{
    const _lg=DB.prog(id),_ss=[..._lg].sort((a,b)=>new Date(a.date)-new Date(b.date));
    if(_ss.length>=2){
      const _f=_ss[0].weight,_l=_ss[_ss.length-1].weight,_d=parseFloat((_l-_f).toFixed(1));
      const _es=G("adm-ch-s"),_ed=G("adm-ch-d"),_ec=G("adm-ch-c");
      if(_es)_es.textContent=_f.toFixed(1)+" kg";
      if(_ec)_ec.textContent=_l.toFixed(1)+" kg";
      if(_ed){_ed.textContent=(_d>0?"+":"")+_d+" kg";_ed.style.color=weightDeltaColor(_d,pt?.goal||"",pt?.ficha,pt?.weight).color;}
    } else if(_ss.length===1){const _ec0=G("adm-ch-c");if(_ec0)_ec0.textContent=_ss[0].weight.toFixed(1)+" kg";}
  },300);
}
/* ── ADMIN TABS ── */
function admTab(t){
  document.querySelectorAll('.adm-tab').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.adm-tp').forEach(p=>p.style.display='none');
  const tab=G('atab-'+t);if(tab)tab.classList.add('on');
  const panel=G('atp-'+t);if(panel)panel.style.display='block';
  // Repaint icons in newly visible panel
  if(panel)paintIcons(panel);
  // Redraw charts when Resumen tab activates (canvas needs visible parent)
  if(t==='res'&&S.selPid){
    const id=S.selPid;
    const log=DB.prog(id);
    const _admPt=DB.pt(id);const _admGw=_admPt&&_admPt.ficha&&parseFloat(_admPt.ficha.pesoMeta)?parseFloat(_admPt.ficha.pesoMeta):null;
    const sorted=[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      drawChart("chart-adm",log,148,_admGw);
      setTimeout(()=>initChartTooltip('chart-adm',log),50);
      if(sorted.length>=2){
        const f=sorted[0].weight,l=sorted[sorted.length-1].weight,diff=parseFloat((l-f).toFixed(1));
        const es=G("adm-ch-s"),ed=G("adm-ch-d"),ec=G("adm-ch-c");
        if(es)es.textContent=f.toFixed(1)+" kg";
        if(ec)ec.textContent=l.toFixed(1)+" kg";
        if(ed){ed.textContent=(diff>0?"+":"")+diff+" kg";const _adc2=weightDeltaColor(diff,DB.pt(id)?.goal||"",DB.pt(id)?.ficha,DB.pt(id)?.weight);ed.style.color=_adc2.color;}
      } else if(sorted.length===1){
        const ec0=G("adm-ch-c");if(ec0)ec0.textContent=sorted[0].weight.toFixed(1)+" kg";
      }
      drawCompChart(id,{gcCanvasId:"chart-gc-adm",statsS:"adm-gc-s",statsD:"adm-gc-d",statsC:"adm-gc-c",listId:"adm-comp-snap-list",cardId:"adm-gc-card",slId:"adm-gc-sl"});
    }));
  }
}
function backAdmin(){refreshAdmin();show("scr-admin")}

/* ── FICHA ── */


/* ══════════════════════════════════════
   DR. COMO PACIENTE — perfil propio
   ══════════════════════════════════════
   El Dr. puede tener su propio perfil de paciente bajo el ID "_dr_pt_"
   para llevar control de sus propias métricas. No aparece en la lista
   de pacientes del panel (filtrado por DB.pts()). */
function openDrPatientProfile(){
  const DR_ID="_dr_pt_";
  let drPt=( (DB.get().patients||[]).find(p=>p.id===DR_ID) );
  if(!drPt){
    // Crear perfil del Dr. la primera vez
    if(!confirm("¿Crear tu perfil personal como paciente?\n\nPodrás registrar tus propias métricas, plan y progreso desde la misma app.")){return}
    const now=new Date().toISOString();
    drPt={id:DR_ID,name:"Dr. Daniel Arévalo",username:"dr.arevalo.personal",
      password:STORAGE.get("iq_dr_pass")||ADMIN.pass,
      goal:"rec",weight:null,week:1,expDate:null,planHtml:null,
      ficha:{},createdAt:now,drNotes:[],_isDrProfile:true};
    const db=DB.get();
    if(!db.patients)db.patients=[];
    // Insertar directamente (evitar DB.savePts que filtra _dr_pt_)
    const exists=db.patients.findIndex(p=>p.id===DR_ID);
    if(exists>=0)db.patients[exists]=drPt;else db.patients.push(drPt);
    DB.save(db);
    // Subir a Supabase
    if(typeof _queueSync==="function"&&typeof _upsertPatients==="function"){
      _queueSync(()=>_upsertPatients(db.patients.filter(p=>!p.id.startsWith("_cfg_"))));
    }
    toast("✅","Perfil creado — puedes iniciar sesión como dr.arevalo.personal");
  }
  // Abrir el paciente en el panel de admin para editar ficha, subir plan, etc.
  openPt(DR_ID);
  toast("ℹ️","Este es tu perfil personal — súbete un plan y registra tus métricas");
}

/* ══════════════════════════════════════
   EXPORTAR DATOS — backup JSON completo
   ══════════════════════════════════════ */
function exportAllData(){
  try{
    const db=DB.get();
    // Incluir también los plan_html almacenados por separado
    const pts=(db.patients||[]).filter(p=>!p.id.startsWith("_cfg_"));
    pts.forEach(p=>{
      const plan=STORAGE.get("iq_plan_"+p.id);
      if(plan)p._planHtml=plan;
    });
    const payload={
      exportDate:new Date().toISOString(),
      version:"IronQx v4",
      patients:pts,
      prog:db.prog||{},
      adh:db.adh||{},
      notifs:db.notifs||{},
      reports:db.reports||{},
      macros:db.macros||{},
      ach:db.ach||{},
      // FIX: campos que antes se omitían y se perdían al restaurar un backup
      fichaHistory:db.fichaHistory||{},
      schedNotifs:db.schedNotifs||{},
      deletedDemoIds:db.deletedDemoIds||[]
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    // FIX Bug19: advertir si el backup es grande (fotos base64 lo inflan mucho)
    const _mb=(blob.size/1048576).toFixed(1);
    if(blob.size>10*1048576&&!confirm(`El backup pesa ${_mb} MB (incluye fotos). ¿Continuar descarga?`)){return;}
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="ironqx-backup-"+new Date().toISOString().slice(0,10)+".json";
    // FIX Bug19: revocar ObjectURL siempre, no sólo en camino feliz
    try{a.click();}finally{setTimeout(()=>URL.revokeObjectURL(url),5000);}
    toast("✅",`Backup descargado · ${_mb} MB`);
  }catch(e){
    console.error(e);
    toast("❌","Error al exportar");
  }
}