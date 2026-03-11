/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Create patient, plan upload, settings, templates
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

// FIX Bug9+10: helper para escapar strings antes de insertar en innerHTML
function _esc(s){if(s==null)return"";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}

function createPt(){
  const name=G("np-name").value.trim(),goal=G("np-goal").value;
  const weight=parseDecimal(G("np-w").value),week=parseInt(G("np-wk").value)||1;
  const nacimiento=G("np-nacimiento").value.trim(),expDate=G("np-exp").value;
  const username=nameToUser(name);
  if(!name){toast("⚠️","Nombre es obligatorio");return}
  if(!nacimiento){toast("⚠️","Fecha de nacimiento es obligatoria");return}
  if(isNaN(weight)||weight<10){toast("⚠️","Peso inválido (ej. 70.5)");return}
  // FIX: en lugar de bloquear al Dr., generar username único con sufijo numérico
  let finalUsername=username,_uSuffix=2;
  while(DB.pts().find(p=>p.username===finalUsername)){finalUsername=username+_uSuffix;_uSuffix++;}
  // Password derived from birth date DDMM
  // Parse YYYY-MM-DD directly to avoid UTC timezone shift (bug: getDate() returned day-1)
  const [,nacMes,nacDia]=nacimiento.split("-");
  const password=nacDia+nacMes;
  // FIX: normalizar coma→punto en todos los campos decimales del formulario
  const altura=G("np-altura").value.replace(',','.');
  const grasa=G("np-grasa").value.replace(',','.');
  const pesoMeta=G("np-pesoMeta")?.value.replace(',','.')||"";
  const now=new Date().toISOString();
  const ficha={
    nacimiento:nacimiento,
    edad:calcEdadFromNac(nacimiento),
    altura:altura,
    peso:String(weight),
    pesoInicial:String(weight),
    pesoMeta:pesoMeta,
    fechaInicial:now,
    grasa:grasa,
    patologias:G("np-patologias").value.trim(),
    restricciones:G("np-restricciones").value.trim(),
    lesiones:G("np-lesiones").value.trim(),
    medicamentos:G("np-medicamentos").value.trim(),
    notas:G("np-notas").value.trim(),
    _updated:now
  };
  const id="p_"+Date.now();
  DB.savePts([...DB.pts(),{id,name,username:finalUsername,password,goal,weight,week,expDate:expDate||null,planHtml:null,ficha,createdAt:now}]);
  // Save initial composition snapshot
  DB.addFichaSnap(id,{date:now,peso:String(weight),grasa:grasa});
  // Seed initial weight in progress log so chart renders from day 1
  DB.saveProg(id,[{date:now,weight:weight,fat:grasa?parseFloat(grasa):null,note:"Peso inicial"}]);
  // FIX Bug3: limpiar form usando función reutilizable
  resetNpForm();
  closeM("m-newpt");refreshAdmin();
  // Mostrar credenciales en modal propio para que no se pierdan
  _showCredModal(name,finalUsername,password,ficha);
}

// FIX Bug3: limpieza del formulario de nuevo paciente — se llama al crear Y al cancelar
function resetNpForm(){
  ["np-name","np-nacimiento","np-w","np-pesoMeta","np-altura","np-grasa","np-exp",
   "np-patologias","np-restricciones","np-lesiones","np-medicamentos","np-notas"
  ].forEach(function(fId){if(G(fId))G(fId).value="";});
  G("np-wk").value="1";G("np-user").value="";
  var nd=G("np-edad-display");if(nd)nd.classList.remove("has-val");
  var nv=G("np-edad-val");if(nv)nv.textContent="—";
  var nu=G("np-edad-unit");if(nu)nu.textContent="";
  var avC=G("np-av-circle");if(avC)avC.textContent="?";
  var avN=G("np-av-name");if(avN)avN.textContent="Nombre del paciente";
  var avU=G("np-av-user");if(avU)avU.textContent="usuario.apellido";
  var chip=G("np-goal-chip");if(chip){chip.innerHTML="";if(G("np-goal"))npGoalChip(G("np-goal"));}
  var fill=G("np-prog-fill");if(fill)fill.style.width="0%";
}

/* ── PLAN ── */
function triggerUpload(){G("plan-inp").click()}

async function handleUpload(e){
  const file=e.target.files[0];if(!file)return;
  if(!file.name.endsWith(".html")){toast("⚠️","Solo .html");return}
  if(file.size>20*1024*1024){toast("⚠️","Archivo muy grande (máx 20MB)");return}

  toast("⏳","Subiendo plan...");
  G("upsub").textContent="Subiendo a la nube...";

  try{
    // ── Subir archivo a Supabase Storage (bucket "plans") ──────────────────
    const s=_getSupa();
    if(!s)throw new Error("Sin conexión a Supabase");

    // Nombre de archivo: pid_timestamp.html para evitar colisiones
    const fname=S.selPid+"_"+Date.now()+".html";

    // Convertir file a ArrayBuffer para upload binario (sin tocar localStorage)
    const buf=await file.arrayBuffer();

    const{data:upData,error:upErr}=await s.storage
      .from("plans")
      .upload(fname, buf, {contentType:"text/html;charset=utf-8", upsert:true});

    if(upErr)throw upErr;

    // ── Obtener URL pública permanente ─────────────────────────────────────
    const{data:urlData}=s.storage.from("plans").getPublicUrl(fname);
    const planUrl=urlData.publicUrl;

    // ── Guardar URL en Supabase patients.plan_html ─────────────────────────
    const{error:dbErr}=await s.from("patients")
      .update({plan_html:planUrl})
      .eq("id",S.selPid)
      .eq("coach_email",ADMIN.email);
    if(dbErr)throw dbErr;

    // ── Guardar URL en local (solo 40 bytes, cero freeze) ──────────────────
    STORAGE.set("iq_plan_"+S.selPid, planUrl);
    const hist=DB.plans(S.selPid);
    hist.unshift({html:planUrl,note:file.name.replace(".html",""),date:new Date().toISOString()});
    if(hist.length>20)hist.pop();
    try{STORAGE.set("iq_planhist_"+S.selPid,JSON.stringify(hist));}catch(ex){}

    // ── Notificar al paciente ──────────────────────────────────────────────
    DB.addNotif(S.selPid,"Tu plan IRONQx ha sido actualizado. ¡Revísalo en la app!");

    // ── Actualizar UI admin ────────────────────────────────────────────────
    const _delBtn=G("ptd-plan-del");if(_delBtn)_delBtn.style.display="flex";
    G("ptd-plan-t").textContent="Plan vinculado ✓";
    G("ptd-plan-s").textContent="Alojado en nube · el paciente lo abre en browser";
    G("ptd-plan-b").textContent="Activo";
    G("ptd-plan-b").style.cssText="background:var(--green-bg);color:var(--green);border-color:var(--green-brd)";
    G("upsub").textContent=file.name;
    refreshAdmin();
    toast("✅","Plan subido · v"+DB.plans(S.selPid).length);

  }catch(err){
    console.error("[IQ] handleUpload error:",err);
    toast("❌","Error al subir: "+(err.message||"Revisa conexión"));
    G("upsub").textContent="Error — intenta de nuevo";
  }
  e.target.value="";
}
function showPlanHistory(){
  const vers=DB.plans(S.selPid),wrap=G("plan-vers-list");
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  if(!vers.length){wrap.innerHTML=`<div class="empty" style="padding:16px"><div class="ei">${icon('document','muted')}</div><div class="et">Sin historial</div></div>`;return}
  wrap.innerHTML=vers.map((v,i)=>{const d=new Date(v.date);return`<div class="ver-item"><div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--gold);min-width:32px">v${vers.length-i}</div><div class="f1"><div style="font-size:13px;font-weight:700">${v.note||"Plan"}</div><div class="fxs tm mt4">${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}</div></div><button class="btn btn-xs btn-out" onclick="restoreVersion(${i})">Restaurar</button></div>`}).join("");
}
function restoreVersion(i){const v=DB.plans(S.selPid);if(!v[i])return;DB.updPt(S.selPid,{planHtml:v[i].html});closeM("m-planvers");toast("✅","Plan v"+(DB.plans(S.selPid).length-i)+" restaurado")}
// Abre un plan: si es URL de Supabase Storage usa SDK (sin CORS),
// si es cualquier otra URL la carga directamente en el iframe del portal.
async function openPlanUrl(url){
  const portal=G("plan-fs-portal");
  const fsFrame=G("plan-fs-frame");
  if(!portal||!fsFrame){toast("❌","Error interno");return}

  // Abrir portal con spinner INMEDIATAMENTE (llamada síncrona — iOS no bloquea)
  fsFrame.srcdoc="<html><body style='background:#080a0d;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><div style='font-family:sans-serif;color:rgba(212,146,14,.7);font-size:14px;letter-spacing:2px;text-transform:uppercase'>Cargando plan…</div></body></html>";
  portal.style.display="flex";

  // Detectar si es URL de Supabase Storage (bucket "plans")
  const isSupaStorage=url.includes("/storage/v1/object/public/plans/")||url.includes("/storage/v1/object/sign/plans/");

  if(isSupaStorage){
    try{
      const s=_getSupa();
      if(!s)throw new Error("Sin Supabase");
      // Extraer nombre del archivo — quitar query strings (?token=...)
      const fname=url.split("/plans/").pop().split("?")[0];
      if(!fname)throw new Error("URL inválida");
      // Descargar via SDK de Supabase (maneja CORS y auth automáticamente)
      const{data,error}=await s.storage.from("plans").download(fname);
      if(error)throw error;
      // Blob → texto → srcdoc
      const html=await data.text();
      fsFrame.srcdoc=html;
    }catch(err){
      console.error("[IQ] openPlanUrl (storage):",err);
      // Fallback: cargar URL directamente en iframe
      console.warn("[IQ] Fallback: cargando URL directo en iframe");
      fsFrame.srcdoc="";
      fsFrame.src=url;
    }
  }else{
    // URL externa (Canva, Google Docs, CDN externo, etc.) — cargar directo en iframe
    fsFrame.srcdoc="";
    fsFrame.src=url;
  }
}

function previewPlan(){
  const raw=DB.planHtml(S.selPid);if(!raw){toast("⚠️","Sin plan");return}
  // Siempre usar el portal fullscreen — funciona para URL y para HTML embebido
  if(raw.startsWith("http://")||raw.startsWith("https://")){openPlanUrl(raw);return}
  // HTML embebido legado: directo al portal
  const fsFrame=G("plan-fs-frame"),portal=G("plan-fs-portal");
  if(fsFrame&&portal){fsFrame.srcdoc=raw;portal.style.display="flex";}
}

async function savePlanUrl(){
  const raw=(G("plan-url-inp").value||"").trim();
  if(!raw){toast("⚠️","Pega el link del plan");return}
  if(!raw.startsWith("http://")&&!raw.startsWith("https://")){toast("⚠️","El link debe comenzar con https://");return}
  // Guardar URL como si fuera el contenido del plan (detección por "http" al leer)
  STORAGE.set("iq_plan_"+S.selPid, raw);
  // Historial de versiones (guardamos la URL como "html")
  const hist=DB.plans(S.selPid);
  hist.unshift({html:raw,note:"Link externo",date:new Date().toISOString()});
  if(hist.length>20)hist.pop();
  try{STORAGE.set("iq_planhist_"+S.selPid,JSON.stringify(hist));}catch(ex){}
  // FIX: Sincronizar a Supabase con AWAIT — antes era fire-and-forget sin confirmación.
  // Si Supabase falla, el plan se guarda local pero el paciente no lo ve en otros dispositivos.
  try{
    if(typeof supaUploadPlan==="function")await supaUploadPlan(S.selPid,raw);
  }catch(ex){
    console.warn("[IQ] savePlanUrl cloud sync error:",ex);
    toast("⚠️","Plan guardado local. Error al sincronizar a la nube — intenta de nuevo");
    return;
  }
  // Notificar al paciente
  DB.addNotif(S.selPid,"Tu plan IRONQx ha sido actualizado. ¡Revísalo en la app!");
  // Actualizar UI
  const _delBtn=G("ptd-plan-del");if(_delBtn)_delBtn.style.display="flex";
  G("plan-url-inp").value="";
  G("ptd-plan-t").textContent="Plan vinculado ✓";
  G("ptd-plan-s").textContent="El paciente puede ver su plan";
  G("ptd-plan-b").textContent="Activo";
  G("ptd-plan-b").style.cssText="background:var(--green-bg);color:var(--green);border-color:var(--green-brd)";
  G("upsub").textContent="Toca para cambiar el link";
  refreshAdmin();
  toast("✅","Plan vinculado · v"+DB.plans(S.selPid).length);
}

function deletePlan(){
  if(!DB.planHtml(S.selPid)){toast("⚠️","No hay plan cargado");return}
  if(!confirm("¿Eliminar el plan de este paciente?\nEl paciente verá la pantalla de espera hasta que subas uno nuevo."))return;
  const _oldUrl=DB.planHtml(S.selPid);
  // Borrar local
  STORAGE.remove("iq_plan_"+S.selPid);
  STORAGE.remove("iq_planhist_"+S.selPid);
  // Borrar en Supabase DB + Storage
  (async()=>{
    try{
      const s=typeof _getSupa==="function"?_getSupa():null;
      if(s){
        await s.from("patients").update({plan_html:null}).eq("id",S.selPid).eq("coach_email",ADMIN.email);
        // Si era un archivo en Storage, borrarlo también
        if(_oldUrl&&_oldUrl.includes("/storage/v1/object/public/plans/")){
          const fname=_oldUrl.split("/plans/").pop();
          await s.storage.from("plans").remove([fname]);
        }
      }
    }catch(e){console.warn("[IQ] deletePlan cloud error:",e);}
  })();
  // Actualizar UI
  G("ptd-plan-t").textContent="Sin plan";
  G("ptd-plan-s").textContent="Paciente ve pantalla de espera";
  G("ptd-plan-b").textContent="Sin plan";
  G("ptd-plan-b").style.cssText="background:var(--red-bg);color:var(--red);border-color:var(--red-brd)";
  G("upsub").textContent="Selecciona el HTML generado por Claude";
  const delBtn=G("ptd-plan-del");if(delBtn)delBtn.style.display="none";
  toast("🗑️","Plan eliminado");
}

/* ── SETTINGS ── */
function saveSettings(){
  const week=parseInt(G("week-inp").value),exp=G("exp-inp").value;
  const user=G("user-inp").value.trim().toLowerCase(),pass=G("pass-inp").value.trim();
  if(isNaN(week)||week<1||week>52){toast("⚠️","Semana inválida");return}
  if(!user||!pass){toast("⚠️","Usuario y contraseña son obligatorios");return}
  const other=DB.pts().find(p=>p.username===user&&p.id!==S.selPid);
  if(other){toast("⚠️","Ese usuario ya existe");return}
  DB.updPt(S.selPid,{week,expDate:exp||null,username:user,password:pass});
  openPt(S.selPid);toast("✅","Cambios guardados");
}
/* ══ PLANTILLAS DE MENSAJES ══ */
let _tplTarget="notif-msg";
function openMsgTemplates(targetId="notif-msg"){
  _tplTarget=targetId;
  renderMsgTemplates();
  showM("m-msgtpl");
}
function renderMsgTemplates(){
  const wrap=G("tpl-list");if(!wrap)return;
  const tpls=DB.msgTemplates();
  if(!tpls.length){wrap.innerHTML=`<div class="tpl-empty">Sin plantillas guardadas.<br>Crea una arriba.</div>`;return}
  // FIX Bug15: usar data-id en lugar de onclick inline con ID interpolado
  wrap.innerHTML=tpls.map(t=>`<div class="tpl-item" data-tpl-id="${_esc(t.id)}">
    <div class="tpl-name">${_esc(t.name)}</div>
    <div class="tpl-preview">${_esc(t.msg)}</div>
    <div class="tpl-del" data-del-id="${_esc(t.id)}">✕</div>
  </div>`).join("");
  // Delegar eventos con data-id para evitar onclick inline con IDs interpolados
  wrap.querySelectorAll(".tpl-item").forEach(el=>{
    el.addEventListener("click",function(e){
      if(e.target.classList.contains("tpl-del")){e.stopPropagation();deleteMsgTemplate(e.target.dataset.delId);}
      else{applyTemplate(el.dataset.tplId);}
    });
  });
}
function applyTemplate(id){
  const t=DB.msgTemplates().find(x=>x.id===id);if(!t)return;
  const ta=G(_tplTarget);if(ta){ta.value=t.msg;ta.focus();}
  closeM("m-msgtpl");
  toast("✅","Plantilla aplicada");
}
function saveMsgTemplate(){
  const name=G("tpl-name-inp")?.value.trim();
  const msg=G("tpl-msg-inp")?.value.trim();
  if(!name||!msg){toast("⚠️","Nombre y mensaje requeridos");return}
  DB.saveMsgTemplate(name,msg);
  G("tpl-name-inp").value="";G("tpl-msg-inp").value="";
  renderMsgTemplates();toast("✅","Plantilla guardada");
}
function deleteMsgTemplate(id){
  if(!confirm("¿Eliminar esta plantilla?"))return;
  DB.deleteMsgTemplate(id);
  renderMsgTemplates();toast("🗑️","Plantilla eliminada");
}

function sendNotif(){const msg=G("notif-msg")?.value.trim();if(!msg){toast("⚠️","Escribe un mensaje");return}DB.addNotif(S.selPid,msg);G("notif-msg").value="";toast("✅","Notificación enviada")}
function confirmDelete(){const pt=DB.pt(S.selPid);if(!pt)return;if(confirm(`¿Eliminar a ${pt.name}?`)){DB.savePts(DB.pts().filter(p=>p.id!==S.selPid));backAdmin();toast("🗑️","Paciente eliminado")}}

/* ── MODALS ── */
// Mapa de listeners de backdrop para evitar acumulación con {once:true}
const _moverListeners={};
const _moverOpenTs={};  // FIX Bug1: timestamp de apertura para guard anti-scroll
function showM(id){
  const el=G(id);if(!el)return;
  if(id==="m-ficha")showFichaModal();
  if(id==="m-planvers")showPlanHistory();
  if(id==="m-inbox")renderInbox();
  // Re-renderizar contenido fresco al abrir (datos pueden haber cambiado por sync de fondo)
  if(id==="m-notif"&&S.pid&&typeof renderNotifs==="function")renderNotifs(S.pid);
  if(id==="m-logros"&&S.pid&&typeof renderLogros==="function"){renderLogrosPreview(S.pid);renderLogros(S.pid);}
  el.classList.add("open");
  _moverOpenTs[id]=Date.now(); // FIX Bug1: registrar momento de apertura
  // Evitar acumulación de listeners: remover el anterior antes de agregar nuevo
  if(_moverListeners[id]){el.removeEventListener("click",_moverListeners[id]);}
  // FIX Bug1: ignorar clicks dentro de los primeros 400ms de apertura (evita cierre por momentum scroll iOS)
  _moverListeners[id]=function(e){if(e.target===el&&Date.now()-(_moverOpenTs[id]||0)>400)closeM(id);};
  el.addEventListener("click",_moverListeners[id]);
}
function closeM(id){const el=G(id);if(el)el.classList.remove("open")}

/* ── TOAST ── */
let _tt=null;
function toast(ic,tx){const meta=toastIconName(ic),tic=G("t-ic");tic.className=`iq-ic lg ${meta.tone}`;tic.innerHTML=iconSvg(meta.name);G("t-tx").textContent=tx;G("toast").classList.add("show");if(_tt)clearTimeout(_tt);_tt=setTimeout(()=>G("toast").classList.remove("show"),3200)}

/* ── SESSION ── */
function restoreSession(){
  try{
    const s=JSON.parse(STORAGE.get("iq_sess")||"null");if(!s)return false;
    if(s.role==="admin"){
      // FIX: sesión del Dr. expira a los 7 días (antes era infinita)
      const age=s.ts?Date.now()-s.ts:Infinity;
      if(age>7*24*3600*1000){STORAGE.remove("iq_sess");return false;}
      S.role="admin";loadAdmin();return true;
    }
    if(s.role==="patient"&&s.pid){const pt=DB.pt(s.pid);if(pt){S.role="patient";S.pid=s.pid;
      if(STORAGE.get("iq_pin_"+s.pid)){
        const age=s.ts?Date.now()-s.ts:Infinity;
        if(age<8*3600*1000){loadPatient(s.pid);return true;} // sesión reciente (<8h) → sin PIN
        showPinScreen(s.pid,"verify","expired"); // FIX Bug16: pasar reason="expired" para mensaje explicativo
        return true;
      }
      loadPatient(s.pid);return true;}}
  }catch{}return false;
}

/* ══════════════════════════════════════
   FEATURES v1.0
══════════════════════════════════════ */

/* ── COUNTUP ANIMATION ── */
function countUp(el, target, decimals=0, suffix=''){
  if(!el) return;
  const start = parseFloat(el.textContent) || 0;
  if(isNaN(target)) return;
  const dur=600, steps=24, interval=dur/steps;
  let i=0;
  const ease=t=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const timer=setInterval(()=>{
    i++;
    const val=start+(target-start)*ease(i/steps);
    el.textContent=val.toFixed(decimals)+suffix;
    if(i>=steps){clearInterval(timer);el.textContent=target.toFixed(decimals)+suffix;}
  },interval);
}

/* ── HAPTIC FEEDBACK ── */
function haptic(type='light'){
  if(!navigator.vibrate)return;
  const patterns={light:[8],medium:[18],success:[8,50,12],error:[12,40,12,40,12]};
  navigator.vibrate(patterns[type]||[8]);
}

/* ── GOAL → AVATAR GRADIENT ── */
function goalAvatarStyle(goal){
  if(!goal) return '';
  const g=goal.toLowerCase();
  if(g.includes('rendimiento')||g.includes('deport'))
    return 'background:linear-gradient(135deg,#1a2a5a,#2255cc);border-color:rgba(85,119,238,.45);color:#ccd8ff';
  if(g.includes('volumen')||g.includes('muscular')||g.includes('ganancia'))
    return 'background:linear-gradient(135deg,#0c2e18,#177a3e);border-color:rgba(46,171,101,.45);color:#a0efc0';
  if(g.includes('corte')||g.includes('grasa'))
    return 'background:linear-gradient(135deg,#3d0c0c,#b02222);border-color:rgba(221,68,68,.45);color:#ffcccc';
  if(g.includes('metaboli')||g.includes('salud'))
    return 'background:linear-gradient(135deg,#22103e,#6622bb);border-color:rgba(153,102,221,.45);color:#ddb8ff';
  return ''; // default gold
}

/* ── STREAK BADGE ── */
function calcStreak(adh){
  const today=new Date();
  const todayStr=today.toISOString().slice(0,10);
  // Límite: solo la semana actual (Lun-Dom)
  const dow=today.getDay(); // 0=Dom,1=Lun...
  const diffToMon=dow===0?-6:1-dow;
  const weekStart=new Date(today);
  weekStart.setDate(today.getDate()+diffToMon);
  weekStart.setHours(0,0,0,0);
  // Array Lun→hoy
  const days=[];
  const dd=new Date(weekStart);
  while(dd.toISOString().slice(0,10)<=todayStr){
    days.push(dd.toISOString().slice(0,10));
    dd.setDate(dd.getDate()+1);
  }
  // Contar consecutivos desde hoy hacia atrás
  // Si hoy no está marcado y aún no empezamos a contar, lo omitimos (el día no terminó)
  let streak=0;
  for(let i=days.length-1;i>=0;i--){
    const key=days[i],val=adh[key];
    if(val==='done'||val==='part'){
      streak++;
    }else if(key===todayStr&&streak===0){
      continue; // hoy sin marcar todavía — omitir
    }else{
      break; // hueco real → cortar
    }
  }
  return streak;
}
function renderStreakBadge(pid){
  const wrap=G('streak-wrap');if(!wrap)return;
  const adh=DB.adh(pid),streak=calcStreak(adh);
  const isZero=streak===0;
  const fire=streak>=7?'🔥':streak>=3?'⚡':'○';
  const lbl=streak>=14?'¡Imparable!':(streak>=7?'¡Racha activa!':(streak>=3?'¡Bien seguido!':'Empieza hoy'));
  wrap.innerHTML=`<div class="streak-badge ${isZero?'streak-zero':''}">
    <div class="streak-fire">${fire}</div>
    <div class="f1">
      <div style="display:flex;align-items:baseline;gap:6px">
        <span class="streak-count">${streak}</span>
        <span class="streak-label">días seguidos</span>
      </div>
      <div class="streak-sub">${lbl}</div>
    </div>
    ${streak>=7?`<span class="badge b-gold" style="flex-shrink:0">Racha ${streak}d</span>`:''}
  </div>`;
}

/* ── MONTHLY HEATMAP ── */
function renderMonthHeatmap(pid){
  const wrap=G('month-heatmap-wrap');if(!wrap)return;
  const adh=DB.adh(pid);
  const now=new Date(),year=now.getFullYear(),month=now.getMonth();
  const todayStr=now.toISOString().slice(0,10);
  const firstDow=new Date(year,month,1).getDay(); // 0=Sun
  const daysInMonth=new Date(year,month+1,0).getDate();
  const M=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dayLabels=['D','L','M','X','J','V','S'];
  let cells='';
  for(let i=0;i<firstDow;i++) cells+=`<div class="mhm-cell empty"></div>`;
  let done=0,part=0,miss=0;
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isFuture=dateStr>todayStr,isToday=dateStr===todayStr;
    const st=adh[dateStr]||'none';
    if(!isFuture&&st==='done')done++;
    if(!isFuture&&st==='part')part++;
    if(!isFuture&&st==='miss')miss++;
    const cls=isFuture?'future':(st==='done'?'done':st==='part'?'part':st==='miss'?'miss':'');
    cells+=`<div class="mhm-cell ${cls}${isToday?' today':''}">${d}</div>`;
  }
  const total=done+part+miss;
  const pctStr=total?Math.round(((done+part*.5)/total)*100)+'%':'—';
  wrap.innerHTML=`
    <div class="sl"><span class="iq-ic" data-ic="calendar"></span>Adherencia — ${M[month]}</div>
    <div class="card"><div class="card-bd">
      <div class="mhm-header">
        <div class="mhm-month">${M[month]} ${year}</div>
        <span class="badge b-gold" style="font-size:9px">${pctStr} adherencia</span>
      </div>
      <div class="mhm-day-row">${dayLabels.map(d=>`<div class="mhm-day-lbl">${d}</div>`).join('')}</div>
      <div class="mhm-grid">${cells}</div>
      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
        <span class="fxs" style="color:var(--green)">● ${done} completos</span>
        <span class="fxs" style="color:var(--gold)">● ${part} parciales</span>
        <span class="fxs" style="color:var(--red)">● ${miss} sin cumplir</span>
      </div>
    </div></div>`;
  paintIcons(wrap);
}

/* ── INTERACTIVE CHART TOOLTIP ── */
function initChartTooltip(cId, log){
  const canvas=G(cId);if(!canvas||log.length<2)return;
  const tip=G('chart-tip-el'),tipVal=G('ctt-val'),tipDate=G('ctt-date');
  if(!tip)return;
  const sorted=[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const ws=sorted.map(e=>e.weight),mn=Math.min(...ws)-1.5,mx=Math.max(...ws)+1.5;
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  let hideTimer=null;

  function getNearest(clientX){
    const rect=canvas.getBoundingClientRect();
    const cssW=rect.width,cssH=rect.height;
    const P={t:14,b:26,l:38,r:10},cW=cssW-P.l-P.r;
    const relX=clientX-rect.left;
    let best=0,bestDist=Infinity;
    sorted.forEach((_,i)=>{
      const px=P.l+(i/(sorted.length-1))*cW;
      const dist=Math.abs(relX-px);
      if(dist<bestDist){bestDist=dist;best=i;}
    });
    if(bestDist>50)return null;
    const py=P.t+(cssH-P.t-P.b)-((ws[best]-mn)/(mx-mn))*(cssH-P.t-P.b);
    return{entry:sorted[best],screenX:rect.left+P.l+(best/(sorted.length-1))*cW,screenY:rect.top+py};
  }

  function showAt(pt){
    if(!pt){tip.classList.remove('show');return;}
    const d=new Date(pt.entry.date);
    tipVal.textContent=pt.entry.weight.toFixed(1)+' kg';
    tipDate.textContent=`${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
    const tx=Math.max(10,Math.min(pt.screenX-40,window.innerWidth-130));
    const ty=Math.max(10,pt.screenY-72);
    tip.style.left=tx+'px';tip.style.top=ty+'px';
    tip.classList.add('show');
  }

  canvas.addEventListener('touchstart',e=>{clearTimeout(hideTimer);showAt(getNearest(e.touches[0].clientX));},{passive:true});
  canvas.addEventListener('touchmove',e=>{clearTimeout(hideTimer);showAt(getNearest(e.touches[0].clientX));},{passive:true});
  canvas.addEventListener('touchend',()=>{hideTimer=setTimeout(()=>tip.classList.remove('show'),1500);},{passive:true});
  canvas.addEventListener('mousemove',e=>showAt(getNearest(e.clientX)));
  canvas.addEventListener('mouseleave',()=>tip.classList.remove('show'));
}

/* ── ADMIN PATIENT SEARCH ── */
let _ptFilter='all';
const _kpiActiveClasses=['kpi-active-gold','kpi-active-green','kpi-active-red','kpi-active-amber'];
function _clearKpiActive(){['kpi-all','kpi-act','kpi-off','kpi-rep'].forEach(id=>{const el=G(id);if(el)_kpiActiveClasses.forEach(c=>el.classList.remove(c))});}
function setFilterKpi(f,kpiId,kpiCls){
  // Sync tab pill
  const tabMap={all:'all',act:'act',off:'off',rep:'rep'};
  document.querySelectorAll('.pt-ftab').forEach(b=>b.classList.remove('on'));
  const matchTab=document.querySelector(`.pt-ftab[data-filter="${tabMap[f]}"]`);
  if(matchTab)matchTab.classList.add('on');
  // Highlight KPI card
  _clearKpiActive();
  const kpiEl=G(kpiId);if(kpiEl)kpiEl.classList.add(kpiCls);
  // Scroll to list
  const listEl=G('pt-list');if(listEl)listEl.scrollIntoView({behavior:'smooth',block:'nearest'});
  _ptFilter=f;filterPatients();haptic('light');
}
function setFilter(f,btn){
  _ptFilter=f;
  document.querySelectorAll('.pt-ftab').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  // Sync KPI active state
  _clearKpiActive();
  const kpiSync={all:['kpi-all','kpi-active-gold'],act:['kpi-act','kpi-active-green'],off:['kpi-off','kpi-active-red'],rep:['kpi-rep','kpi-active-amber']};
  if(kpiSync[f]){const el=G(kpiSync[f][0]);if(el)el.classList.add(kpiSync[f][1]);}
  filterPatients();
}
function filterPatients(){
  const q=(G('pt-search')?.value||'').toLowerCase().trim();
  const wk=weekKey();
  const rows=document.querySelectorAll('#pt-list .ptcard');
  let visible=0;
  rows.forEach(row=>{
    const text=row.textContent.toLowerCase();
    const pid=row.dataset.pid;
    const status=row.dataset.status; // "on","off","trial"
    const hasRep=row.dataset.hasrep==="true";
    let passFilter=true;
    if(_ptFilter==='act') passFilter=status==='on'||status==='trial';
    else if(_ptFilter==='off') passFilter=status==='off';
    else if(_ptFilter==='rep') passFilter=hasRep;
    const show=passFilter&&(!q||text.includes(q));
    row.style.display=show?'':'none';
    if(show)visible++;
  });
  let noRes=G('pt-no-results');
  if(!noRes){noRes=document.createElement('div');noRes.id='pt-no-results';noRes.className='empty';noRes.style.display='none';noRes.innerHTML=`<div class="ei">${icon('search','muted')}</div><div class="et">Sin resultados</div><div class="es">No se encontró ningún paciente.</div>`;G('pt-list').after(noRes);}
  noRes.style.display=!visible?'block':'none';
}

/* ── TENDENCIA SEMANAL DE PESO ── */

/* ── MODAL DE CREDENCIALES ── */
function _showCredModal(name,username,password,ficha){
  // Crear modal flotante con las credenciales del paciente recién creado
  // FIX: acepta ficha opcional para mostrar resumen médico relevante
  const medItems=[];
  if(ficha){
    if(ficha.patologias&&ficha.patologias.trim())medItems.push({lbl:"Patologías",val:ficha.patologias.trim()});
    if(ficha.medicamentos&&ficha.medicamentos.trim())medItems.push({lbl:"Medicamentos",val:ficha.medicamentos.trim()});
    if(ficha.restricciones&&ficha.restricciones.trim())medItems.push({lbl:"Restricciones",val:ficha.restricciones.trim()});
    if(ficha.lesiones&&ficha.lesiones.trim())medItems.push({lbl:"Lesiones",val:ficha.lesiones.trim()});
  }
  const medHtml=medItems.length?`
    <div style="background:#0b0d14;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px 16px;margin-bottom:16px;text-align:left">
      <div style="font-size:9px;color:var(--muted);font-family:'Inter',sans-serif;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Notas clínicas</div>
      ${medItems.map(i=>`<div style="display:flex;gap:8px;margin-bottom:5px;font-size:11px;font-family:'Inter',sans-serif"><span style="color:var(--muted);flex-shrink:0">${_esc(i.lbl)}:</span><span style="color:var(--txt2)">${_esc(i.val)}</span></div>`).join("")}
    </div>`:"";
  const overlay=document.createElement("div");
  overlay.style.cssText="position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)";
  const box=document.createElement("div");
  box.style.cssText="background:#12141c;border:1px solid rgba(212,146,14,.35);border-radius:20px;padding:28px 24px;width:100%;max-width:360px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.7)";
  box.innerHTML=`
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:4px">Paciente creado</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;letter-spacing:1px;color:var(--txt);margin-bottom:20px">${_esc(name)}</div>
    <div style="background:#080a0d;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px 20px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:10px;color:var(--muted);font-family:'Inter',sans-serif;letter-spacing:1px">USUARIO</div>
        <div style="font-size:15px;font-weight:700;color:var(--txt);font-family:'Inter',sans-serif;letter-spacing:1px">${_esc(username)}</div>
      </div>
      <div style="height:1px;background:rgba(255,255,255,.06);margin-bottom:10px"></div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:10px;color:var(--muted);font-family:'Inter',sans-serif;letter-spacing:1px">CONTRASEÑA</div>
        <div style="font-size:22px;font-weight:900;color:var(--gold);font-family:'Barlow Condensed',monospace;letter-spacing:3px">${_esc(password)}</div>
      </div>
    </div>
    ${medHtml}
    <div style="font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:20px">Comparte estas credenciales con el paciente.<br>La contraseña es su fecha de nacimiento <b style="color:var(--txt2)">DDMM</b>.</div>
    <button onclick="this.closest('.iq-cred-overlay').remove()" style="width:100%;padding:13px;background:linear-gradient(135deg,#d4920e,#a36b08);border:none;border-radius:12px;color:#fff;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:14px;letter-spacing:2px;text-transform:uppercase;cursor:pointer">Entendido</button>
  `;
  overlay.classList.add("iq-cred-overlay");
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  // Cerrar al hacer tap fuera del box
  overlay.addEventListener("click",(e)=>{if(e.target===overlay)overlay.remove();});
}
