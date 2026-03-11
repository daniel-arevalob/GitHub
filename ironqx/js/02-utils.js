/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Utility functions (fmtDate, initials, payStatus...)
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

/* ── UTILS ── */
function calcEdadFromNac(nacStr){
  if(!nacStr)return null;
  const nac=new Date(nacStr),today=new Date();
  let age=today.getFullYear()-nac.getFullYear();
  const m=today.getMonth()-nac.getMonth();
  if(m<0||(m===0&&today.getDate()<nac.getDate()))age--;
  return age>=0?age:null;
}
/* ── FORM HELPERS ── */
function _setEdadBadge(badgeId,valId,unitId,nacVal){
  const badge=G(badgeId),valEl=G(valId),unitEl=G(unitId);
  if(!badge)return;
  if(!nacVal){
    if(valEl)valEl.textContent="—";
    if(unitEl)unitEl.textContent="";
    badge.classList.remove("has-val");return;
  }
  const age=calcEdadFromNac(nacVal);
  if(valEl)valEl.textContent=age!==null?age:"—";
  if(unitEl)unitEl.textContent=age!==null?"años":"";
  badge.classList.toggle("has-val",age!==null);
}
function npUpdateEdad(){_setEdadBadge("np-edad-display","np-edad-val","np-edad-unit",G("np-nacimiento")?.value)}
function updateEdadDisplay(){_setEdadBadge("fc-edad-display","fc-edad-val","fc-edad-unit",G("fc-nacimiento")?.value)}

/* Live preview while typing new patient name */
function npLivePreview(){
  const raw=G("np-name")?.value||"";
  const user=nameToUser(raw);
  G("np-user").value=user;
  const ini=initials(raw)||"?";
  const avEl=G("np-av-circle");if(avEl)avEl.textContent=ini;
  const nameEl=G("np-av-name");if(nameEl)nameEl.textContent=raw||"Nombre del paciente";
  const userEl=G("np-av-user");if(userEl)userEl.textContent=user||"usuario.apellido";
  // Update progress bar
  npProgressBar();
}
const GOAL_CHIPS={
  rec:{cls:"rec",label:"⚡ Recomposición"},
  cut:{cls:"cut",label:"🔥 Corte"},
  vol:{cls:"vol",label:"💪 Volumen"},
  dep:{cls:"dep",label:"🏃 Rendimiento"},
  sal:{cls:"sal",label:"💎 Salud metabólica"}
};
function npGoalChip(sel){
  const wrap=G("np-goal-chip");if(!wrap)return;
  const opt=sel.options[sel.selectedIndex];
  const chipKey=opt?.dataset?.chip||"rec";
  const meta=GOAL_CHIPS[chipKey]||GOAL_CHIPS.rec;
  wrap.innerHTML=`<span class="goal-chip ${meta.cls}">${meta.label}</span>`;
  npProgressBar();
}
function npProgressBar(){
  const fields=["np-name","np-nacimiento","np-w","np-altura","np-grasa"];
  const filled=fields.filter(id=>{const el=G(id);return el&&el.value.trim()!=="";}).length;
  const pct=Math.round((filled/fields.length)*100);
  const fill=G("np-prog-fill");if(fill)fill.style.width=pct+"%";
}
function nameToUser(n){const p=n.trim().split(/\s+/);if(p.length<2)return p[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");return(p[0]+"."+p[1]).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function initials(n){return n.split(" ").slice(0,2).map(w=>w[0]?.toUpperCase()||"").join("")}
// FIX: Normaliza coma a punto antes de parseFloat (teclados con locale español usan coma).
// Úsalo en lugar de parseFloat() directo para todos los campos de peso/grasa/medidas.
function parseDecimal(val){
  if(val===null||val===undefined)return NaN;
  return parseFloat(String(val).trim().replace(',','.'));
}
// FIX: Strings con solo fecha "YYYY-MM-DD" se parsean como UTC midnight en JS.
// En zonas UTC-N eso desplaza el día un día atrás (ej. "2024-03-15" → 14 Mar a las 19:00 UTC-5).
// parseDateLocal detecta este formato y lo fuerza a medianoche local, evitando el desfase.
function parseDateLocal(str){
  if(!str)return null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(str)){const[y,m,d]=str.split('-').map(Number);return new Date(y,m-1,d);}
  return new Date(str);
}
function fmtDate(iso){if(!iso)return"—";const d=parseDateLocal(iso),M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];return`${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`}
function fmtShort(iso){if(!iso)return"—";const d=parseDateLocal(iso),M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];return`${d.getDate()} ${M[d.getMonth()]}`}
function payStatus(pt){
  if(!pt.expDate)return{status:"trial",label:"Sin fecha",cls:"sp-trial"};
  // FIX: usar parseDateLocal para que "YYYY-MM-DD" se interprete en hora local, no UTC
  const exp=parseDateLocal(pt.expDate);exp.setHours(23,59,59);
  const _now=new Date();
  if(_now>exp)return{status:"off",label:"Vencida",cls:"sp-off"};
  const _dl=Math.ceil((exp-_now)/864e5);
  return{status:"on",label:_dl<=7?"Vence en "+_dl+"d":"Activa",cls:"sp-on"};
}
// Get current week's monday (start) and sunday (end)
function weekRange(){
  const now=new Date(),day=now.getDay(),diff=day===0?-6:1-day;
  const mon=new Date(now);mon.setDate(now.getDate()+diff);mon.setHours(0,0,0,0);
  const sun=new Date(mon);sun.setDate(mon.getDate()+6);sun.setHours(23,59,59,999);
  return{mon,sun};
}
function weekKey(date){
  // FIX Bug12: algoritmo ISO 8601 estricto con UTC para evitar desfases de zona horaria
  // La semana pertenece al año de su JUEVES. Usa UTC internamente para consistencia.
  const d=date||new Date();
  const utc=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  utc.setUTCDate(utc.getUTCDate()+4-(utc.getUTCDay()||7)); // mover al jueves de la semana
  const jan1=new Date(Date.UTC(utc.getUTCFullYear(),0,1));
  const wn=Math.ceil((((utc-jan1)/86400000)+1)/7);
  return`${utc.getUTCFullYear()}-W${String(wn).padStart(2,"0")}`;
}
function getWeekDays(){
  const{mon}=weekRange(),days=[];
  for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);days.push(d);}
  return days;
}
function isReportWeek(){
  // Show banner from Saturday (day 6) and allow late submission always
  const day=new Date().getDay();
  return day===0||day===6; // sat or sun
}
function reportStatusForPt(pid){
  const wk=weekKey(),reps=DB.reports(pid);
  const thisWeek=reps.find(r=>r.weekKey===wk);
  if(thisWeek)return{status:thisWeek.late?"late":"sent",report:thisWeek};
  const day=new Date().getDay();
  if(day===0)return{status:"urgent",report:null}; // Sunday = urgent
  if(day===6)return{status:"pending",report:null}; // Saturday = pending
  return{status:"none",report:null};
}

/* ── DB ── */
const DB={
  // ── STORAGE ENGINE ─────────────────────────────────────────────────────────
  // FIX CRÍTICO: planHtml (400-700KB por paciente) ya NO se embebe en iq_db.
  // Se guarda en claves separadas: iq_plan_{pid} e iq_planhist_{pid}.
  // Esto reduce iq_db de ~5MB a ~80KB, eliminando el freeze de scroll en iPhone
  // causado por JSON.parse/stringify del blob gigante en cada operación de DB.
  // ────────────────────────────────────────────────────────────────────────────
  get(){try{return JSON.parse(STORAGE.get("iq_db")||"{}")}catch{return{}}},
  save(db){
    // Extraer planHtml de cada paciente → clave separada iq_plan_{pid}
    const light={...db};
    if(light.patients){
      light.patients=light.patients.map(pt=>{
        if(pt.planHtml!==undefined){
          if(pt.planHtml)STORAGE.set("iq_plan_"+pt.id,pt.planHtml);
          const{planHtml,...rest}=pt;return rest;
        }
        return pt;
      });
    }
    // Extraer planHistory → clave separada iq_planhist_{pid}
    if(light.planHistory){
      Object.entries(light.planHistory).forEach(([pid,vers])=>{
        try{STORAGE.set("iq_planhist_"+pid,JSON.stringify(vers));}catch(e){}
      });
      delete light.planHistory;
    }
    STORAGE.set("iq_db",JSON.stringify(light));
  },
  pts(){return(this.get().patients||[]).filter(p=>p.id&&!p.id.startsWith('_cfg_'))},
  // ptsPublic: lista sin el perfil privado del Dr.
  ptsPublic(){return this.pts().filter(p=>p.id!=='_dr_pt_')},
  savePts(p){
    const db=this.get();
    // Track deleted demo patients so seedDemo() doesn't re-insert them
    const DEMO_IDS=['demo','demo2','demo3','demo4','demo5'];
    const prevIds=(db.patients||[]).map(pt=>pt.id);
    const newIds=p.map(pt=>pt.id);
    const removed=prevIds.filter(id=>!newIds.includes(id)&&DEMO_IDS.includes(id));
    if(removed.length){
      if(!db.deletedDemoIds)db.deletedDemoIds=[];
      removed.forEach(id=>{if(!db.deletedDemoIds.includes(id))db.deletedDemoIds.push(id);});
    }
    db.patients=p;
    this.save(db);
  },
  pt(id){return this.pts().find(p=>p.id===id)||null},
  updPt(id,u){const ps=this.pts(),i=ps.findIndex(p=>p.id===id);if(i>=0){ps[i]={...ps[i],...u};this.savePts(ps)}},
  // Getter dedicado para plan HTML — evita leer el blob en operaciones normales
  planHtml(pid){return STORAGE.get("iq_plan_"+pid)||null},
  drNotes(pid){return(this.pt(pid)||{}).drNotes||[]},
  addDrNote(pid,text){const ps=this.pts(),i=ps.findIndex(p=>p.id===pid);if(i<0)return;if(!ps[i].drNotes)ps[i].drNotes=[];ps[i].drNotes.unshift({id:'dn_'+Date.now(),date:new Date().toISOString(),text:text.trim()});if(ps[i].drNotes.length>30)ps[i].drNotes=ps[i].drNotes.slice(0,30);this.savePts(ps)},
  deleteDrNote(pid,noteId){const ps=this.pts(),i=ps.findIndex(p=>p.id===pid);if(i<0)return;ps[i].drNotes=(ps[i].drNotes||[]).filter(n=>n.id!==noteId);this.savePts(ps)},
  prog(pid){return(this.get().prog||{})[pid]||[]},
  saveProg(pid,log){const db=this.get();if(!db.prog)db.prog={};db.prog[pid]=log;this.save(db)},
  notifs(pid){return(this.get().notifs||{})[pid]||[]},
  addNotif(pid,msg){const db=this.get();if(!db.notifs)db.notifs={};if(!db.notifs[pid])db.notifs[pid]=[];db.notifs[pid].unshift({id:'n'+Date.now(),msg,date:new Date().toISOString(),ptReply:null,ptReplyDate:null});this.save(db)},
  saveNotifReply(pid,nid,reply){const db=this.get();const ns=(db.notifs||{})[pid]||[];const n=ns.find(x=>x.id===nid);if(n){n.ptReply=reply;n.ptReplyDate=new Date().toISOString();}db.notifs[pid]=ns;this.save(db)},
  adh(pid){return(this.get().adh||{})[pid]||{}},
  saveAdh(pid,d){const db=this.get();if(!db.adh)db.adh={};db.adh[pid]=d;this.save(db)},
  photos(pid){return(this.get().photos||{})[pid]||[]},
  savePhotos(pid,sets){const db=this.get();if(!db.photos)db.photos={};db.photos[pid]=sets;this.save(db)},
  plans(pid){try{return JSON.parse(STORAGE.get("iq_planhist_"+pid)||"[]");}catch{return[];}},
  addPlan(pid,html,note){
    // Plan actual → clave separada (no contamina iq_db)
    if(html)STORAGE.set("iq_plan_"+pid,html);
    // Historial con HTML completo para restauración de versiones
    const hist=this.plans(pid);
    hist.unshift({html,note,date:new Date().toISOString()});
    if(hist.length>10)hist.pop();
    try{STORAGE.set("iq_planhist_"+pid,JSON.stringify(hist));}catch(e){console.warn("[IQ] planHistory storage full:",e);}
  },
  reports(pid){return(this.get().reports||{})[pid]||[]},
  saveReports(pid,reps){const db=this.get();if(!db.reports)db.reports={};db.reports[pid]=reps;this.save(db)},
  allPendingReports(){
    const res=[];
    this.ptsPublic().forEach(pt=>{
      const reps=this.reports(pt.id);
      reps.forEach((r,i)=>{if(!r.drReply)res.push({pid:pt.id,ptName:pt.name,report:r,idx:i});});
    });
    return res.sort((a,b)=>new Date(b.report.date)-new Date(a.report.date));
  },
  fichaHistory(pid){
    // Fuente primaria: fichaHistory local.
    // Fallback: ficha._snapshots (sincronizado con Supabase vía campo ficha JSONB)
    const local=(this.get().fichaHistory||{})[pid]||[];
    if(local.length)return local;
    const pt=this.pt(pid);
    return(pt&&pt.ficha&&pt.ficha._snapshots)||[];
  },
  addFichaSnap(pid,snap){
    const db=this.get();
    // Guardar en fichaHistory local
    if(!db.fichaHistory)db.fichaHistory={};
    if(!db.fichaHistory[pid])db.fichaHistory[pid]=[];
    db.fichaHistory[pid].unshift(snap);
    if(db.fichaHistory[pid].length>20)db.fichaHistory[pid]=db.fichaHistory[pid].slice(0,20);
    // Espejo en ficha._snapshots → se sincroniza con Supabase via campo ficha JSONB del paciente
    const ptIdx=db.patients?db.patients.findIndex(p=>p.id===pid):-1;
    if(ptIdx>-1){
      if(!db.patients[ptIdx].ficha)db.patients[ptIdx].ficha={};
      db.patients[ptIdx].ficha._snapshots=db.fichaHistory[pid];
    }
    this.save(db);
  },  macros(pid){return(this.get().macros||{})[pid]||null},
  saveMacros(pid,m){const db=this.get();if(!db.macros)db.macros={};db.macros[pid]=m;this.save(db)},
  schedNotifs(pid){return(this.get().schedNotifs||{})[pid]||[]},
  saveSchedNotifs(pid,arr){const db=this.get();if(!db.schedNotifs)db.schedNotifs={};db.schedNotifs[pid]=arr;this.save(db)},
  msgTemplates(){return this.get().msgTemplates||[]},
  saveMsgTemplate(name,msg){const db=this.get();if(!db.msgTemplates)db.msgTemplates=[];db.msgTemplates.push({id:'t'+Date.now(),name,msg});this.save(db)},
  deleteMsgTemplate(id){const db=this.get();db.msgTemplates=(db.msgTemplates||[]).filter(t=>t.id!==id);this.save(db)},
  deliverScheduled(pid){
    // Check scheduled notifs and fire any due today or past
    const today=new Date().toISOString().slice(0,10);
    const arr=this.schedNotifs(pid);let fired=false;
    arr.forEach(n=>{if(!n.delivered&&n.date<=today){this.addNotif(pid,n.msg);n.delivered=true;fired=true;}});
    if(fired)this.saveSchedNotifs(pid,arr);
    return fired;
  },
  achUnlocked(pid){return(this.get().ach||{})[pid]||[]},
  saveAchUnlocked(pid,arr){const db=this.get();if(!db.ach)db.ach={};db.ach[pid]=arr;this.save(db)}
};

/* ── SEED ── */
