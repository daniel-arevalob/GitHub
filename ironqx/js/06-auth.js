/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Login, logout, session, PIN screen
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

// FIX Bug14: ofuscar contraseña del Dr. en localStorage (no es hashing real,
// pero previene lectura trivial en DevTools y por extensiones básicas)
const _b64e=s=>{try{return btoa(unescape(encodeURIComponent(s)));}catch{return s;}};
const _b64d=s=>{try{return decodeURIComponent(escape(atob(s)));}catch{return s;}};
function _getDrPass(){const raw=STORAGE.get("iq_dr_pass");if(!raw)return null;try{const d=_b64d(raw);return d||raw;}catch{return raw;}}
function _setDrPass(p){STORAGE.set("iq_dr_pass",_b64e(p));}

function doLogin(){
  const user=G("i-user").value.trim().toLowerCase(),pass=G("i-pass").value.trim();
  if(!user&&!pass){toast("⚠️","Ingresa tus credenciales");return}
  G("login-btn").textContent="Ingresando...";
  setTimeout(async()=>{
    G("login-btn").textContent="Ingresar";
    // Contraseña custom tiene prioridad sobre la del config
    const _customPass=_getDrPass();
    const _validPass=_customPass||ADMIN.pass;
    if((user===ADMIN.email||user==="dr"||user==="dr.arevalo")&&pass===_validPass){
      S.role="admin";saveSession({role:"admin"});loadAdmin();
      if(typeof supaLoadAll==="function")supaLoadAll(ADMIN.email);return;
    }
    // ── Fallback Supabase para Dr. en dispositivo nuevo ──────────────────
    // Si el usuario es el Dr. pero la contraseña local no coincidió,
    // se intenta recuperar la contraseña sincronizada desde Supabase.
    if(user===ADMIN.email||user==="dr"||user==="dr.arevalo"){
      try{
        const s=typeof _getSupa==="function"?_getSupa():null;
        if(s){
          G("login-btn").textContent="Verificando...";
          const {data:cfgRows}=await s.from("patients")
            .select("password")
            .eq("coach_email",ADMIN.email)
            .eq("id","_cfg_dr_")
            .limit(1);
          G("login-btn").textContent="Ingresar";
          if(cfgRows&&cfgRows.length&&cfgRows[0].password){
            const remotePass=cfgRows[0].password;
            _setDrPass(remotePass);
            if(pass===remotePass){
              S.role="admin";saveSession({role:"admin"});loadAdmin();
              if(typeof supaLoadAll==="function")supaLoadAll(ADMIN.email);return;
            }
          }
        }
      }catch(e){console.warn("[IQ Auth] Dr remote pass lookup failed:",e);}
      G("login-btn").textContent="Ingresar";
      toast("❌","Credenciales incorrectas");return;
    }
    // ── Buscar paciente en caché local primero (rápido) ──────────────────
    // FIX: Removidas referencias a .code — campo no existe en la tabla patients de Supabase
    let pt=DB.pts().find(p=>p.username&&p.username===user&&p.password===pass);
    // Si no está en local (dispositivo nuevo / caché vacía) → buscar en Supabase
    if(!pt){
      try{
        const s=typeof _getSupa==="function"?_getSupa():null;
        if(s){
          G("login-btn").textContent="Verificando...";
          // NOTA: NO usar .or() con valores que contengan puntos (ej: victor.arevalo)
          // Supabase interpreta el punto como separador de columna y rompe la query.
          // FIX CRÍTICO: Removido 'code' del SELECT — esa columna NO existe en la tabla
          // patients de Supabase y causaba que la query retornara error silencioso (data=null),
          // impidiendo el login en dispositivos nuevos.
          const {data:byUser,error:errUser}=await s.from("patients")
            .select("id,name,username,password,goal,weight,week,exp_date,created_at_app,dr_notes,ficha,plan_html")
            .eq("coach_email",ADMIN.email)
            .eq("username",user);
          if(errUser)console.warn("[IQ Auth] Supabase query error:",errUser.message);
          if(byUser&&byUser.length){
            const local=DB.get();
            const existing=local.patients||[];
            byUser.forEach(row=>{
              if(row.id&&row.id.startsWith("_cfg_"))return;
              const mapped={
                id:row.id,name:row.name,username:row.username,password:row.password,
                goal:row.goal,weight:row.weight,week:row.week,expDate:row.exp_date,
                createdAt:row.created_at_app,drNotes:row.dr_notes||[],ficha:row.ficha||{}
              };
              // Guardar plan_html (URL o HTML) en clave separada — igual que supaLoadAll
              if(row.plan_html&&!row.id.startsWith("_cfg_")){
                STORAGE.set("iq_plan_"+row.id, row.plan_html);
              }
              const idx=existing.findIndex(p=>p.id===mapped.id);
              if(idx>=0)existing[idx]={...existing[idx],...mapped};
              else existing.push(mapped);
            });
            local.patients=existing;
            DB.save(local);
            pt=DB.pts().find(p=>p.username&&p.username===user&&p.password===pass);
          }
        }
      }catch(e){console.warn("[IQ Auth] Supabase fallback failed:",e);}
      G("login-btn").textContent="Ingresar";
    }
    if(pt){
      S.role="patient";S.pid=pt.id;saveSession({role:"patient",pid:pt.id,ts:Date.now()});
      const _localPin=STORAGE.get("iq_pin_"+pt.id);
      const _fichaPin=pt.ficha?._pin||null;
      if(_localPin||_fichaPin){showPinScreen(pt.id,"verify");return}
      // Consultar tabla pins de Supabase para dispositivo nuevo
      (async()=>{
        let hasRemotePin=false;
        try{
          if(typeof DB.supaLoadPin==="function"){
            const rp=await DB.supaLoadPin(pt.id);
            if(rp){STORAGE.set("iq_pin_"+pt.id,rp);hasRemotePin=true;}
          }
        }catch(e){}
        if(hasRemotePin){showPinScreen(pt.id,"verify");}
        else{
          loadPatient(pt.id);
          // Sincronizar métricas en background — no bloquea el acceso
          if(typeof supaLoadPatientData==="function") supaLoadPatientData(pt.id).catch(()=>{});
        }
      })();
      return;
    }
    toast("❌","Credenciales incorrectas");
  },450);
}

/* ── CAMBIO DE CONTRASEÑA DEL DR. ── */
function showChangePass(){
  G("cp-current").value="";G("cp-new").value="";G("cp-confirm").value="";
  showM("m-changepass");
}
async function saveChangePass(){
  const cur=G("cp-current").value.trim();
  const nw=G("cp-new").value.trim();
  const cf=G("cp-confirm").value.trim();
  if(!cur||!nw||!cf){toast("⚠️","Completa todos los campos");return}
  const _customPass=_getDrPass();
  const _validPass=_customPass||ADMIN.pass;
  if(cur!==_validPass){toast("❌","Contraseña actual incorrecta");return}
  if(nw.length<6){toast("⚠️","Mínimo 6 caracteres");return}
  if(nw!==cf){toast("❌","Las contraseñas no coinciden");return}
  // Guardar local
  _setDrPass(nw);
  // FIX: Sincronizar al cloud para que funcione en dispositivos nuevos
  try{
    const s=typeof _getSupa==="function"?_getSupa():null;
    if(s){
      await s.from("patients").upsert({
        id:"_cfg_dr_",
        coach_email:ADMIN.email,
        name:"[config internal]",
        username:"_cfg_dr_",
        password:nw,
        week:1
      },{onConflict:"id"});
    }
  }catch(e){console.warn("[IQ Auth] Dr pass cloud sync failed:",e);}
  closeM("m-changepass");
  toast("✅","Contraseña actualizada");
}
function doLogout(){
  closeM("m-profile");closeM("m-drprofile");closeM("m-settings");
  STORAGE.remove("iq_sess");
  if(window._iqSyncInterval){clearInterval(window._iqSyncInterval);window._iqSyncInterval=null;}
  S={role:null,pid:null,selPid:null,tab:"home"};
  showNav(false);show("scr-login");
  G("i-user").value="";G("i-pass").value="";
}
function saveSession(d){STORAGE.set("iq_sess",JSON.stringify({...d,ts:Date.now()}))}

/* ── PIN ── */
function pkPrevent(e){e.preventDefault();}  // prevents virtual keyboard on PIN taps
function showPinScreen(pid,mode,reason){
  PIN_BUF="";PIN_MODE=mode;S.pid=pid;
  G("pin-title").textContent=mode==="set"?"Crear PIN de acceso":"Acceso rápido";
  // FIX Bug16: mensaje explicativo cuando la sesión expiró
  const _sub=mode==="set"?"Elige un PIN de 4 dígitos":reason==="expired"?"Tu sesión expiró · Ingresa tu PIN para continuar":"Ingresa tu PIN de 4 dígitos";
  G("pin-sub").textContent=_sub;
  G("pin-skip").textContent=mode==="set"?"Omitir por ahora":"Usar contraseña";
  [0,1,2,3].forEach(i=>G("pd"+i).className="pd");
  // Blur any focused input to prevent keyboard from opening on top of PIN screen
  if(document.activeElement&&document.activeElement.tagName==="INPUT")document.activeElement.blur();
  G("pin-screen").classList.add("open");
  setTimeout(()=>initBioBtn(),100);
}
// FIX Bug8: contador de intentos fallidos de PIN
let _pinFailCount=0;
let _pinLockUntil=0;
function pkPress(n){
  // Bloqueo temporal tras 5 intentos fallidos
  if(Date.now()<_pinLockUntil){
    const secs=Math.ceil((_pinLockUntil-Date.now())/1000);
    toast("🔒","Bloqueado "+secs+"s por seguridad");
    return;
  }
  if(PIN_BUF.length>=4)return;
  haptic('light');
  PIN_BUF+=n;
  [0,1,2,3].forEach(i=>G("pd"+i).classList.toggle("fill",i<PIN_BUF.length));
  if(PIN_BUF.length===4)setTimeout(pinComplete,120);
}
function pkDel(){if(!PIN_BUF.length)return;PIN_BUF=PIN_BUF.slice(0,-1);[0,1,2,3].forEach(i=>G("pd"+i).classList.toggle("fill",i<PIN_BUF.length))}
function pinComplete(){
  if(PIN_MODE==="verify"){
    // Verificar PIN — prioridad: localStorage → tabla pins → ficha._pin (legacy)
    const _localPin=STORAGE.get("iq_pin_"+S.pid);
    const _fichaPin=DB.pt(S.pid)?.ficha?._pin||null;

    const _tryPin=(pinToCheck)=>{
      if(pinToCheck&&PIN_BUF===pinToCheck){
        _pinFailCount=0;_pinLockUntil=0; // FIX Bug8: resetear contador en éxito
        if(!_localPin)STORAGE.set("iq_pin_"+S.pid,pinToCheck);
        G("pin-screen").classList.remove("open");
        saveSession({role:"patient",pid:S.pid,ts:Date.now()});
        loadPatient(S.pid);
        // Sincronizar métricas en background — no bloquea el acceso
        if(typeof supaLoadPatientData==="function") supaLoadPatientData(S.pid).catch(()=>{});
        return true;
      }
      return false;
    };

    if(_localPin){
      // PIN en caché local — verificación inmediata
      if(!_tryPin(_localPin)){
        _pinFailCount++;
        // FIX Bug8: bloquear 30s tras 5 intentos fallidos
        if(_pinFailCount>=5){_pinLockUntil=Date.now()+30000;_pinFailCount=0;toast("🔒","5 intentos fallidos · bloqueado 30s");haptic("error");}
        else{toast("❌","PIN incorrecto ("+(5-_pinFailCount)+" intentos restantes)");}
        [0,1,2,3].forEach(i=>{G("pd"+i).className="pd err"});
        setTimeout(()=>{PIN_BUF="";[0,1,2,3].forEach(i=>G("pd"+i).className="pd")},700);
      }
    } else {
      // Sin PIN local — consultar tabla pins de Supabase (dispositivo nuevo)
      const _loadBtn=G("pin-btn-0");if(_loadBtn)_loadBtn.style.opacity=".4";
      (async()=>{
        let remotePin=null;
        try{
          if(typeof DB.supaLoadPin==="function")remotePin=await DB.supaLoadPin(S.pid);
        }catch(e){}
        if(_loadBtn)_loadBtn.style.opacity="";
        // Intentar con tabla pins, luego con ficha._pin (legacy)
        const pinToTry=remotePin||_fichaPin;
        if(!_tryPin(pinToTry)){
          _pinFailCount++;
          if(_pinFailCount>=5){_pinLockUntil=Date.now()+30000;_pinFailCount=0;toast("🔒","5 intentos fallidos · bloqueado 30s");haptic("error");}
          else{toast("❌","PIN incorrecto ("+(5-_pinFailCount)+" intentos restantes)");}
          [0,1,2,3].forEach(i=>{G("pd"+i).className="pd err"});
          setTimeout(()=>{PIN_BUF="";[0,1,2,3].forEach(i=>G("pd"+i).className="pd")},700);
        }
      })();
    }
  }else{
    // Guardar PIN en:
    //   1. localStorage (acceso local inmediato)
    //   2. tabla pins de Supabase (fuente de verdad cross-device)
    //   3. ficha._pin (legacy fallback para dispositivos sin sync)
    STORAGE.set("iq_pin_"+S.pid,PIN_BUF);
    // Tabla pins (nueva — fuente principal)
    if(typeof DB.supaUpsertPin==="function")DB.supaUpsertPin(S.pid,PIN_BUF);
    // Ficha._pin (legacy fallback — mantener para compatibilidad)
    const _pt=DB.pt(S.pid);
    if(_pt){
      const _ficha={...(_pt.ficha||{}),_pin:PIN_BUF};
      DB.updPt(S.pid,{ficha:_ficha});
    }
    G("pin-screen").classList.remove("open");
    toast("✅","PIN guardado · activo en todos tus dispositivos");
  }
}
function pinSkip(){
  G("pin-screen").classList.remove("open");
  if(PIN_MODE==="set"){
    // Paciente omite setup de PIN: ok, entrar sin PIN
    loadPatient(S.pid);
  } else {
    // Verificacion: NO permitir bypass — forzar login con contrasena
    S={role:null,pid:null,selPid:null,tab:"home"};
    STORAGE.remove("iq_sess");
    showNav(false);show("scr-login");
    G("i-user").value="";G("i-pass").value="";
    toast("ℹ️","Ingresa tu contraseña completa");
  }
}


/* ── LOAD PATIENT ── */
