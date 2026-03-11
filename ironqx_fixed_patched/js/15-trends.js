// FIX Bug17: helper de escape HTML para prevenir XSS
function _e(s){if(s==null)return"";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}

/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Week trends, weight delta helpers
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function calcWeekTrend(prog,goal,ficha){
  if(!prog||prog.length<2)return null;
  const sorted=[...prog].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const now=new Date();
  const w7=new Date(now-7*864e5);
  const recent=sorted.filter(e=>new Date(e.date)>=w7);
  const before=sorted.filter(e=>new Date(e.date)<w7);
  if(!recent.length||!before.length)return null;
  const first=before[before.length-1].weight;
  const last=recent[recent.length-1].weight;
  const delta=parseFloat((last-first).toFixed(1));
  if(Math.abs(delta)<0.1)return{arrow:"→",val:"0.0",cls:"trend-flat"};
  const goodCls=weightDeltaClass(delta,goal||"",ficha); // goal+ficha-aware
  return{arrow:delta<0?"↓":"↑",val:Math.abs(delta).toFixed(1),cls:"trend-"+goodCls};
}

/* ── GOAL-AWARE WEIGHT DELTA HELPER ── */
// Determina la dirección óptima de peso según el objetivo declarado Y el pesoMeta.
// Prioridad: 1) pesoMeta vs peso actual (más preciso), 2) texto del objetivo.
function weightGoalDir(goal, ficha, currentWeight){
  // Fuente primaria: pesoMeta en ficha (el Dr. lo estableció explícitamente)
  if(ficha){
    const meta=parseFloat(ficha.pesoMeta);
    // Usar peso actual pasado como argumento, o ficha.peso como fallback
    const actual=parseFloat(currentWeight)||parseFloat(ficha.peso);
    if(meta && actual && Math.abs(meta-actual)>0.3){
      // La dirección real es hacia el pesoMeta, sin importar el texto del objetivo
      return meta < actual ? "down" : "up";
    }
    // Si meta ≈ actual (±0.3 kg) → ya está en meta → neutral/mantener
    if(meta && actual && Math.abs(meta-actual)<=0.3) return "neutral";
  }
  // Fallback: texto del objetivo cuando no hay pesoMeta definido
  if(!goal) return "down"; // default clínico conservador
  const g=(goal||"").toLowerCase();
  if(/volumen|masa|ganar|muscul|bulk|hipertrofia|ganancia/.test(g)) return "up";
  if(/manteni|manten|recomp/.test(g)) return "neutral";
  return "down"; // corte, grasa, definición, pérdida, etc.
}
function weightDeltaColor(delta, goal, ficha, currentWeight){
  // Returns {color, bg} CSS var strings
  const dir=weightGoalDir(goal, ficha, currentWeight);
  if(delta===null||delta===undefined||isNaN(delta)||delta===0)
    return{color:"var(--muted)",bg:"transparent"};
  let good;
  if(dir==="neutral") good=Math.abs(delta)<=0.5;
  else if(dir==="up")  good=delta>0;
  else                  good=delta<0;
  return{color:good?"var(--green)":"var(--red)",bg:good?"var(--green-bg)":"var(--red-bg)"};
}
function weightDeltaClass(delta, goal, ficha, currentWeight){
  // Returns CSS class suffix: "down"=green, "up"=red (for ptc-trend classes)
  const dir=weightGoalDir(goal, ficha, currentWeight);
  if(!delta||Math.abs(delta)<0.05) return "flat";
  let good;
  if(dir==="neutral") good=Math.abs(delta)<=0.5;
  else if(dir==="up")  good=delta>0;
  else                  good=delta<0;
  return good?"down":"up"; // down=green, up=red in CSS
}
/* ── NOTAS CLÍNICAS DEL DR. (historial) ── */
function saveDrNote(){
  const el=G("dr-note-inp");if(!el)return;
  const val=el.value.trim();
  if(!val){toast("⚠️","Escribe una nota primero");return}
  DB.addDrNote(S.selPid,val);
  el.value="";
  renderDrNotes(S.selPid);
  toast("✅","Nota guardada");
}
function deleteDrNote(noteId){
  if(!confirm("¿Eliminar esta nota?"))return;
  DB.deleteDrNote(S.selPid,noteId);
  renderDrNotes(S.selPid);
}
function renderDrNotes(pid){
  const wrap=G("dr-notes-log");if(!wrap)return;
  const notes=DB.drNotes(pid);
  if(!notes.length){wrap.innerHTML=`<div class="dr-notes-empty">Sin notas clínicas aún</div>`;return}
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  wrap.innerHTML=notes.map(n=>{
    const d=new Date(n.date);
    const ds=`${d.getDate()} ${M[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    return`<div class="dr-note-item">
      <div class="dr-note-date">${_e(ds)}</div>
      <div class="dr-note-txt">${_e(n.text)}</div>
      <button class="dr-note-del" onclick="deleteDrNote('${_e(n.id)}')" title="Eliminar"><span class="iq-ic sm" data-ic="x" style="width:12px;height:12px"></span></button>
    </div>`;
  }).join("");
  paintIcons(wrap);
}
function loadDrNote(pid){
  const el=G("dr-note-inp");if(el)el.value="";
  renderDrNotes(pid);
}
/* Compatibilidad: ptcard "añadir nota" ahora abre detalle en tab ajustes */
function editDrNote(pid){
  openPt(pid);
  setTimeout(()=>admTab('cfg'),120);
}

/* ── CHIPS DE RESPUESTA RÁPIDA ── */
function insertChip(text){
  const ta=G("reply-txt");if(!ta)return;
  const cur=ta.value.trim();
  ta.value=cur?cur+" "+text:text;
  ta.focus();
  ta.dispatchEvent(new Event('input'));
}

/* ── SWIPE TABS ── */
