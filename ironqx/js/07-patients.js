/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Patient loading & home screen
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function loadPatient(pid){
  const pt=DB.pt(pid);if(!pt){doLogout();return}
  const prog=DB.prog(pid),last=prog.length?prog[prog.length-1]:null,week=pt.week||1,pay=payStatus(pt);
  G("hero-av").textContent=initials(pt.name);
  const _hr=new Date().getHours();
  const _gr=_hr<13?"Buenos días":_hr<20?"Buenas tardes":"Buenas noches";
  // FIX Bug6: escapar pt.name antes de insertar en innerHTML para evitar XSS
  (function(){const _hn=G("hero-name");_hn.innerHTML='<span style="font-size:10px;font-family:Inter,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:rgba(212,146,14,.5);display:block;margin-bottom:2px">'+_gr+'</span>';const _nameSpan=document.createElement('span');_nameSpan.textContent=pt.name;_hn.appendChild(_nameSpan);})();
  G("hero-goal").textContent=pt.goal;G("hero-meta").textContent=`Semana ${week} · ${pay.label}`;
  // Avatar color by goal
  const avStyle=goalAvatarStyle(pt.goal);
  if(avStyle)G("hero-av").setAttribute('style',avStyle);else G("hero-av").removeAttribute('style');
  // Stat values with countup
  const pesoVal=last?last.weight:pt.weight;
  const diasVal=prog.length*7;
  G("st-peso").textContent=pesoVal.toFixed(1);
  G("st-dias").textContent=diasVal;
  G("st-sem").textContent=week;
  setTimeout(()=>{
    countUp(G("st-peso"),pesoVal,1);
    countUp(G("st-dias"),diasVal,0);
    countUp(G("st-sem"),week,0);
  },120);
  requestAnimationFrame(()=>requestAnimationFrame(()=>drawSparkline(prog)));
  const cp=getCP(week);
  const daysToCP=Math.max(0,(cp.target-week)*7);
  G("st-cp").textContent=cp.target;G("cp-name").textContent=cp.name;G("cp-desc").textContent=cp.desc;
  G("cp-cur").textContent=week;G("cp-tgt").textContent=`Sem ${cp.target}`;
  G("cp-fill").style.width=Math.min(100,Math.round((week/cp.target)*100))+"%";
  // Pay bar — always visible for patient
  const pb=G("pay-bar");
  pb.style.display="block";
  (function(){
    if(pay.status==="off"){
      pb.innerHTML=`<div class="pay-c off">
        <div class="pay-inner">
          <div class="pay-dot-wrap">${icon('lock')}</div>
          <div class="pay-body">
            <div class="pay-title">Membresía vencida</div>
            <div class="pay-sub">Venció el ${pt.expDate?fmtDate(pt.expDate):"—"} · Contacta al Dr. Arévalo</div>
          </div>
          <div class="pay-badge" style="color:var(--red);border-color:rgba(221,68,68,.35)">Vencida</div>
        </div>
      </div>`;
    } else if(pay.status==="on"&&pt.expDate){
      const dl=Math.ceil((new Date(pt.expDate)-new Date())/864e5);
      const isWarn=dl<=14;
      const pct=Math.min(100,Math.max(4,Math.round((dl/30)*100)));
      const cls=isWarn?"trial":"on";
      const badgeTxt=dl<=7?"Vence en "+dl+"d":dl<=14?dl+" días":dl<=30?dl+" días":"+30d";
      const badgeColor=isWarn?"var(--amber)":"var(--green)";
      const badgeBrd=isWarn?"rgba(232,150,12,.35)":"rgba(46,171,101,.35)";
      pb.innerHTML=`<div class="pay-c ${cls}">
        <div class="pay-inner">
          <div class="pay-dot-wrap">${icon(isWarn?'alert':'check-circle')}</div>
          <div class="pay-body">
            <div class="pay-title">Membresía activa</div>
            <div class="pay-sub">Activa hasta el ${fmtDate(pt.expDate)}</div>
          </div>
          <div class="pay-badge" style="color:${badgeColor};border-color:${badgeBrd}">${badgeTxt}</div>
        </div>
        <div class="pay-exp-bar"><div class="pay-exp-fill" style="width:${pct}%;color:${badgeColor}"></div></div>
      </div>`;
    } else {
      // trial / no date
      pb.innerHTML=`<div class="pay-c trial">
        <div class="pay-inner">
          <div class="pay-dot-wrap">${icon('spark')}</div>
          <div class="pay-body">
            <div class="pay-title">Acceso activo</div>
            <div class="pay-sub">Contacta al Dr. Arévalo para renovar</div>
          </div>
          <div class="pay-badge" style="color:var(--amber);border-color:rgba(232,150,12,.35)">Trial</div>
        </div>
      </div>`;
    }
  })();
  renderAdh(pid);
  renderMotivCounter(pid);
  // Plan frame — limpiar estado anterior al cambiar paciente
  const frame=G("plan-frame");
  frame.srcdoc="";frame.src="";frame.style.display="none";
  G("no-plan").style.display="none";G("plan-susp").classList.remove("show");
  const _planLink=G("plan-link-card");if(_planLink)_planLink.style.display="none";
  const _sig=G("plan-signature");if(_sig)_sig.style.display="none";
  G("plan-fs-btn").style.display="";  // reset visibility
  if(pay.status==="off"){G("plan-susp").classList.add("show")}
  else{
    const _raw=DB.planHtml(pid);
    const _isUrl=_raw&&(_raw.startsWith("http://")||_raw.startsWith("https://"));
    const v=DB.plans(pid);
    const _planDate=v.length?new Date(v[0].date):null;
    const _planDateStr=_planDate?`${_planDate.getDate()} ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][_planDate.getMonth()]} ${_planDate.getFullYear()}`:"—";
    if(_isUrl){
      // ── MODO URL: mostrar tarjeta de link ──────────────────────────────
      G("plan-ver-lbl").textContent=v.length?`v${v.length} · ${_planDateStr}`:"Plan activo";
      G("plan-fs-btn").style.display="none"; // fullscreen no aplica para links externos
      if(_planLink){
        _planLink.style.display="flex";
        const _linkBtn=_planLink.querySelector("#plan-open-btn");
        if(_linkBtn)_linkBtn.onclick=()=>openPlanUrl(_raw);
        const _previewBtn=_planLink.querySelector("#plan-preview-btn");
        if(_previewBtn)_previewBtn.onclick=()=>openPlanUrl(_raw);
      }
      if(_sig){_sig.style.display="flex";_sig.querySelector(".plan-sig-date").textContent=_planDateStr;_sig.querySelector(".plan-sig-ver").textContent=v.length?`v${v.length}`:""}
    } else if(_raw){
      // ── MODO HTML embebido (legado) ────────────────────────────────────
      frame.style.display="block";frame.srcdoc=_raw;
      G("plan-ver-lbl").textContent=v.length?`v${v.length} · ${_planDateStr}`:"Plan actual";
      if(_sig){_sig.style.display="flex";_sig.querySelector(".plan-sig-date").textContent=_planDateStr;_sig.querySelector(".plan-sig-ver").textContent=v.length?`v${v.length}`:""}
    } else {
      // ── SIN PLAN ─────────────────────────────
    G("no-plan").style.display="flex";
  }
  }  // close outer else (plan block)
  // Profile modal
  G("mp-av").textContent=initials(pt.name);G("mp-name").textContent=pt.name;G("mp-goal").textContent=pt.goal;
  G("mp-pay-pill").innerHTML=`<span class="sp ${pay.cls}"><span class="sp-dot"></span>${pay.label}</span>`;
  // username shown in settings modal via openSettings()
  // Streak pill in profile modal
  const _adh=DB.adh(pid),_streak=calcStreak(_adh);
  const _spEl=G("mp-streak-pill");
  if(_spEl){const _fire=_streak>=14?"🔥🔥":_streak>=7?"🔥":_streak>=3?"⚡":"";_spEl.innerHTML=_streak>=1?`<span class="badge b-gold" style="font-size:9px">${_fire||"○"} ${_streak}d racha</span>`:""}
  renderLogros(pid);
  renderLogrosPreview(pid);
  renderPlayerCard(pid);
  renderNotifs(pid);

  // Fire scheduled notifications due today
  const fired=DB.deliverScheduled(pid);if(fired)renderNotifs(pid);
  // Report banner on home
  renderReportBanner(pid);
  // Report pip on nav
  updateRepPip(pid);
  // Macros card
  renderMacrosCard(pid);
  // Weekly summary + nav live data
  renderWeeklySummary(pid);
  renderNavLiveData(pid);

  showNav(true);setNav("home");show("scr-home");
  // Stagger card entrances (safe: only animates, never leaves opacity:0)
  setTimeout(()=>{
    document.querySelectorAll("#scr-home .scroll > *").forEach((el,i)=>{
      try{
        el.style.opacity="0";el.style.transform="translateY(8px)";
        setTimeout(()=>{
          try{el.style.transition="opacity .32s ease, transform .32s ease";el.style.opacity="1";el.style.transform="translateY(0)";}
          catch(e){el.style.cssText="";}
        },i*50);
      }catch(e){el.style.cssText="";}
    });
  },100);
  requestAnimationFrame(()=>requestAnimationFrame(()=>loadProgScreen(pid)));
  if(!STORAGE.get("iq_onb_done")){setTimeout(()=>showOnboarding(),600);}
  else if(!STORAGE.get("iq_pin_"+pid)&&!DB.pt(pid)?.ficha?._pin){setTimeout(()=>{S.pid=pid;showPinScreen(pid,"set")},1400);}

  // ── Sincronización silenciosa desde Supabase ────────────────────────────
  // Refresca plan_html, week y expDate del paciente desde la nube en background.
  // Cubre todos los paths: login con caché, restoreSession(), PIN verify.
  // No bloquea el render. Si el plan cambió, actualiza el UI sin recargar todo.
  // FIX: Retry con backoff — 3 intentos: 900ms → 5s → 15s
  // Evita el caso donde Supabase aún no respondió en la primera llamada.
  {
    let _planAttempt=0;
    const _retryDelays=[900,5000,15000];
    const _tryPlanRefresh=()=>{
      _refreshPlanFromCloud(pid).then(found=>{
        if(!found&&_planAttempt<_retryDelays.length-1){
          _planAttempt++;
          setTimeout(_tryPlanRefresh,_retryDelays[_planAttempt]);
        }
      }).catch(()=>{
        if(_planAttempt<_retryDelays.length-1){
          _planAttempt++;
          setTimeout(_tryPlanRefresh,_retryDelays[_planAttempt]);
        }
      });
    };
    setTimeout(_tryPlanRefresh,_retryDelays[0]);
  }

  // ── Auto-refresh silencioso cada 4 minutos ────────────────────────────────
  // Permite que el paciente vea cambios del Dr. (plan, métricas, notificaciones)
  // sin tener que cerrar y reabrir la app. Se cancela al hacer logout.
  if(window._iqSyncInterval)clearInterval(window._iqSyncInterval);
  window._iqSyncInterval=setInterval(()=>{
    // Solo sincronizar si el usuario sigue logueado como este paciente
    if(S.role!=="patient"||S.pid!==pid){clearInterval(window._iqSyncInterval);return;}
    _refreshPlanFromCloud(pid).catch(()=>{});
  },4*60*1000); // 4 minutos
}

/* ══════════════════════════════════════════════════════════
   SINCRONIZACIÓN COMPLETA DESDE SUPABASE — lado paciente
   ══════════════════════════════════════════════════════════
   Descarga TODO lo que el Dr. pudo haber modificado:
   plan_html · week · exp_date · ficha · dr_notes · métricas
   · adherencia · notificaciones · macros · logros
   Luego refresca el UI activo sin recargar la pantalla.
   Retorna true si encontró datos (para lógica de retry). */
async function _refreshPlanFromCloud(pid){
  try{
    const s=typeof _getSupa==="function"?_getSupa():null;
    if(!s)return false;

    // ── 1. Datos del paciente (fila principal) ──────────────────────────
    const {data,error}=await s.from("patients")
      .select("plan_html,week,exp_date,ficha,dr_notes,weight")
      .eq("coach_email",ADMIN.email)
      .eq("id",pid)
      .single();

    if(error||!data)return false;

    // ── 2. Tablas relacionadas (parallel fetch) ─────────────────────────
    const [metricsRes,adhRes,notifsRes,macrosRes,achRes,reportsRes]=await Promise.all([
      s.from("metrics").select("*").eq("patient_id",pid).order("date"),
      s.from("adherence").select("*").eq("patient_id",pid),
      s.from("notifications").select("*").eq("patient_id",pid).order("date",{ascending:false}),
      s.from("macros").select("*").eq("patient_id",pid).maybeSingle(),
      s.from("achievements").select("*").eq("patient_id",pid).maybeSingle(),
      s.from("reports").select("*").eq("patient_id",pid).order("date",{ascending:false})
    ]);

    // ── 3. Merge al localStorage ────────────────────────────────────────
    const db=DB.get();

    // Paciente: week, expDate, ficha, drNotes, weight
    const ps=db.patients||[];
    const idx=ps.findIndex(p=>p.id===pid);
    let patientChanged=false;
    if(idx>=0){
      if(data.week!==undefined&&data.week!==ps[idx].week){ps[idx].week=data.week;patientChanged=true;}
      if(data.exp_date!==undefined&&data.exp_date!==ps[idx].expDate){ps[idx].expDate=data.exp_date;patientChanged=true;}
      if(data.weight!=null&&parseFloat(data.weight)!==(ps[idx].weight)){ps[idx].weight=parseFloat(data.weight);patientChanged=true;}
      if(data.ficha&&JSON.stringify(data.ficha)!==JSON.stringify(ps[idx].ficha||{})){
        ps[idx].ficha=data.ficha;
        // Restaurar schedNotifs desde ficha._schedNotifs (Dr. las configura)
        if(data.ficha._schedNotifs&&data.ficha._schedNotifs.length){
          if(!db.schedNotifs)db.schedNotifs={};
          if(!(db.schedNotifs[pid]||[]).length)
            db.schedNotifs[pid]=data.ficha._schedNotifs;
        }
        // Reconstruir fichaHistory desde _snapshots si vienen embebidos
        if(data.ficha._snapshots&&data.ficha._snapshots.length){
          if(!db.fichaHistory)db.fichaHistory={};
          db.fichaHistory[pid]=data.ficha._snapshots;
        }
        patientChanged=true;
      }
      if(data.dr_notes&&JSON.stringify(data.dr_notes)!==JSON.stringify(ps[idx].drNotes||[])){ps[idx].drNotes=data.dr_notes;patientChanged=true;}
    }

    // Métricas (prog)
    let metricsChanged=false;
    if(metricsRes.data){
      const newProg=metricsRes.data.map(m=>({
        id:m.id,date:m.date,weight:m.weight,fat:m.fat,
        waist:m.waist,chest:m.chest,arm:m.arm,leg:m.leg,
        note:m.notes||null
      }));
      const oldProg=JSON.stringify(db.prog&&db.prog[pid]||[]);
      const newProgStr=JSON.stringify(newProg);
      if(oldProg!==newProgStr){
        if(!db.prog)db.prog={};
        db.prog[pid]=newProg;
        metricsChanged=true;
        // Actualizar peso raíz del paciente al más reciente
        if(newProg.length&&idx>=0){
          const sorted=[...newProg].sort((a,b)=>new Date(a.date)-new Date(b.date));
          ps[idx].weight=sorted[sorted.length-1].weight;
          patientChanged=true;
        }
      }
    }

    // Adherencia (adh)
    let adhChanged=false;
    if(adhRes.data&&adhRes.data.length){
      const newAdh={};
      adhRes.data.forEach(a=>{
        // Detectar formato: notes como string de estado ('done','miss','part') o null
        if(a.notes&&(a.notes==="done"||a.notes==="miss"||a.notes==="part")){
          newAdh[a.week_key]=a.notes;
        } else {
          newAdh[a.week_key]={training:a.training,nutrition:a.nutrition,sleep:a.sleep,steps:a.steps,notes:a.notes};
        }
      });
      const oldAdh=JSON.stringify(db.adh&&db.adh[pid]||{});
      if(JSON.stringify(newAdh)!==oldAdh){
        if(!db.adh)db.adh={};
        db.adh[pid]=newAdh;
        adhChanged=true;
      }
    }

    // Notificaciones
    let notifsChanged=false;
    if(notifsRes.data){
      const newNotifs=notifsRes.data.map(n=>({
        id:n.id,msg:n.msg,date:n.date,ptReply:n.pt_reply,ptReplyDate:n.pt_reply_date
      }));
      const oldNotifs=JSON.stringify(db.notifs&&db.notifs[pid]||[]);
      if(JSON.stringify(newNotifs)!==oldNotifs){
        if(!db.notifs)db.notifs={};
        db.notifs[pid]=newNotifs;
        notifsChanged=true;
      }
    }

    // Macros
    if(macrosRes.data){
      if(!db.macros)db.macros={};
      db.macros[pid]=macrosRes.data.data;
    }

    // Reportes (para ver drReply actualizado)
    let reportsChanged=false;
    if(reportsRes.data){
      const newReps=reportsRes.data.map(r=>({
        id:r.id,weekKey:r.week_key,date:r.date,
        late:r.late,data:r.data,drReply:r.dr_reply,
        adherence:(r.data&&r.data.adherence)||{},
        adherencePct:(r.data&&r.data.adherencePct)||0,
        comment:(r.data&&r.data.comment)||"",
        photos:(r.data&&r.data.photos)||{},
        week:(r.data&&r.data.week)||1
      }));
      const oldRepsStr=JSON.stringify(db.reports&&db.reports[pid]||[]);
      if(JSON.stringify(newReps)!==oldRepsStr){
        if(!db.reports)db.reports={};
        db.reports[pid]=newReps;
        reportsChanged=true;
      }
    }

    // Logros
    if(achRes.data){
      if(!db.ach)db.ach={};
      db.ach[pid]=achRes.data.unlocked||[];
    }

    // PIN — refrescar desde tabla pins si no está en local
    if(!STORAGE.get("iq_pin_"+pid)){
      try{
        if(typeof DB.supaLoadPin==="function"){
          const rp=await DB.supaLoadPin(pid);
          if(rp)STORAGE.set("iq_pin_"+pid,rp);
        }
      }catch(e){}
    }

    // Plan HTML — guardar en clave separada (no en iq_db)
    let planChanged=false;
    if(data.plan_html){
      const current=STORAGE.get("iq_plan_"+pid);
      if(data.plan_html!==current){
        STORAGE.set("iq_plan_"+pid,data.plan_html);
        planChanged=true;
        // Historial mínimo si el dispositivo no tiene ninguno
        const histKey="iq_planhist_"+pid;
        const histExisting=STORAGE.get(histKey);
        if(!histExisting||histExisting==="[]"){
          try{STORAGE.set(histKey,JSON.stringify([{html:data.plan_html,note:"Plan actual",date:new Date().toISOString()}]));}catch(ex){}
        }
      }
    }

    // Guardar todo al localStorage de una vez
    if(patientChanged||metricsChanged||adhChanged||notifsChanged){
      db.patients=ps;
      DB.save(db);
    }

    const anyChange=patientChanged||metricsChanged||adhChanged||notifsChanged||reportsChanged||planChanged;
    if(!anyChange)return !!data.plan_html; // sin cambios — aun ok si hay plan

    console.log("[IQ] Datos actualizados desde nube para",pid,
      {patientChanged,metricsChanged,adhChanged,notifsChanged,planChanged});

    // ── 4. Refrescar UI del paciente activo ────────────────────────────
    if(S.pid!==pid||S.role!=="patient")return true;

    // Siempre actualizar nav y datos en vivo
    if(typeof renderNavLiveData==="function")renderNavLiveData(pid);
    if(typeof renderWeeklySummary==="function")renderWeeklySummary(pid);
    if(typeof updateRepPip==="function")updateRepPip(pid);

    // Refrescar el hero del home si hay cambios de paciente o métricas
    if(patientChanged||metricsChanged){
      const _pt=DB.pt(pid);
      if(_pt){
        const _prog=DB.prog(pid);
        const _last=_prog.length?[..._prog].sort((a,b)=>new Date(a.date)-new Date(b.date)).pop():null;
        const _pesoEl=G("st-peso");
        if(_pesoEl&&_last){_pesoEl.textContent=_last.weight.toFixed(1);}
        const _wkEl=G("st-sem");
        if(_wkEl)_wkEl.textContent=_pt.week||1;
      }
    }

    // Tab activo
    const _tab=S.tab||"home";

    if(_tab==="home"||adhChanged||notifsChanged){
      if(typeof renderAdh==="function")renderAdh(pid);
      if(typeof renderNotifs==="function")renderNotifs(pid);
      if(typeof renderReportBanner==="function")renderReportBanner(pid);
      if(typeof renderMacrosCard==="function")renderMacrosCard(pid);
      if(typeof renderMotivCounter==="function")renderMotivCounter(pid);
    }

    if(_tab==="prog"||metricsChanged){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(typeof loadProgScreen==="function")loadProgScreen(pid);
      }));
    }

    if(_tab==="reporte"&&(notifsChanged||reportsChanged)){
      if(typeof renderReportTab==="function")renderReportTab(pid);
    }

    // Refrescar plan en UI si cambió
    if(planChanged&&data.plan_html){
      const raw=data.plan_html;
      const isUrl=raw.startsWith("http://")||raw.startsWith("https://");
      const frame=G("plan-frame"),noPlan=G("no-plan"),planSusp=G("plan-susp");
      const planLink=G("plan-link-card"),sig=G("plan-signature"),fsBtnEl=G("plan-fs-btn");
      if(noPlan)noPlan.style.display="none";
      if(planSusp)planSusp.classList.remove("show");
      const v=DB.plans(pid);
      const _pDate=v.length?new Date(v[0].date):null;
      const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      const _pDateStr=_pDate?`${_pDate.getDate()} ${M[_pDate.getMonth()]} ${_pDate.getFullYear()}`:"—";
      if(isUrl){
        if(frame){frame.srcdoc="";frame.src="";frame.style.display="none";}
        if(fsBtnEl)fsBtnEl.style.display="none";
        if(planLink){
          planLink.style.display="flex";
          const ob=planLink.querySelector("#plan-open-btn");if(ob)ob.onclick=()=>openPlanUrl(raw);
          const pb=planLink.querySelector("#plan-preview-btn");if(pb)pb.onclick=()=>openPlanUrl(raw);
        }
        if(sig){sig.style.display="flex";
          const sd=sig.querySelector(".plan-sig-date");if(sd)sd.textContent=_pDateStr;
          const sv=sig.querySelector(".plan-sig-ver");if(sv)sv.textContent=v.length?`v${v.length}`:"";
        }
        const vlEl=G("plan-ver-lbl");if(vlEl)vlEl.textContent=v.length?`v${v.length} · ${_pDateStr}`:"Plan activo";
      }else{
        if(planLink)planLink.style.display="none";
        if(frame){frame.style.display="block";frame.srcdoc=raw;}
        if(fsBtnEl)fsBtnEl.style.display="";
        if(sig){sig.style.display="flex";
          const sd=sig.querySelector(".plan-sig-date");if(sd)sd.textContent=_pDateStr;
          const sv=sig.querySelector(".plan-sig-ver");if(sv)sv.textContent=v.length?`v${v.length}`:"";
        }
        const vlEl=G("plan-ver-lbl");if(vlEl)vlEl.textContent=v.length?`v${v.length} · ${_pDateStr}`:"Plan actual";
      }
      toast("✅","Tu plan fue actualizado");
    } else if(anyChange){
      // Cambio silencioso — notificación discreta solo si hubo algo real
      if(metricsChanged)toast("📊","Métricas actualizadas por el Dr.");
      else if(adhChanged)toast("📅","Adherencia actualizada");
      else if(patientChanged)toast("🔄","Tu perfil fue actualizado");
    }

    // Actualizar label de última sincronización
    STORAGE.set("iq_last_sync_"+pid,new Date().toISOString());
    const _syncLbl=G("last-sync-lbl");
    if(_syncLbl){const _n=new Date();_syncLbl.textContent=`Sync ${String(_n.getHours()).padStart(2,"0")}:${String(_n.getMinutes()).padStart(2,"0")}`;}

    return true;

  }catch(e){
    console.warn("[IQ] _refreshPlanFromCloud error:",e);
    return false;
  }
}
function getCP(w){
  if(w<=4)return{name:"CP-1 · Semana 4",target:4,desc:"Foto + peso + fuerza base"};
  if(w<=8)return{name:"CP-2 · Semana 8",target:8,desc:"Lab + deload + ajuste macros"};
  if(w<=12)return{name:"CP-3 · Semana 12",target:12,desc:"Evaluación intermedia + fotos"};
  return{name:"CP Final · Sem 22",target:22,desc:"Evaluación total + nueva fase"};
}
function updateRepPip(pid){
  const rs=reportStatusForPt(pid),pip=G("ni-rep-pip");
  if(pip)pip.classList.toggle("on",rs.status==="urgent"||rs.status==="pending");
}

/* ── ADHERENCE ── */
