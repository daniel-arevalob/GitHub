/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Achievement compute, render, unlock
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function computeLogros(pid){
  const pt=DB.pt(pid);if(!pt)return[];
  const log=DB.prog(pid);
  const adh=DB.adh(pid);
  const photos=DB.photos(pid);
  const reports=DB.reports(pid);
  const fichaHist=DB.fichaHistory(pid);
  // First pass — all except meta-logros
  const results=LOGROS_DEF.map(def=>{
    if(def.id==="total10"||def.id==="total25")return{...def,unlocked:false,date:null,progress:null};
    try{const r=def.check(log,adh,photos,reports,fichaHist,pt);return{...def,...r};}
    catch(e){return{...def,unlocked:false,date:null,progress:null};}
  });
  // Second pass — meta-logros
  const unlockedCount=results.filter(r=>r.unlocked).length;
  return results.map(r=>{
    if(r.id==="total10"){const u=unlockedCount>=10;return{...r,unlocked:u,progress:u?null:{cur:unlockedCount,max:10}};}
    if(r.id==="total25"){const u=unlockedCount>=25;return{...r,unlocked:u,progress:u?null:{cur:unlockedCount,max:25}};}
    return r;
  });
}

// Cache: key = pid, value = {html, count, newOnes}
const _achCache={};

/* ── VISTA COMPACTA DE LOGROS EN MODAL DE PERFIL ── */

/* ══════════════════════════════════════
   LOGROS FULLSCREEN + PREVIEW MODAL
══════════════════════════════════════ */
function openLogros(){
  const pid=S.pid;
  const sub=G("logros-scr-sub");
  const pt=DB.pt(pid);if(!pt)return;
  const data=computeLogros(pid);
  const unlocked=data.filter(a=>a.unlocked).length;
  if(sub)sub.textContent=`${unlocked} / ${data.length} desbloqueados`;
  // ID swap: point logros-wrap at the fullscreen container, render, restore
  const fullWrap=G("logros-full-wrap");
  const modalWrap=G("logros-wrap");
  if(fullWrap&&modalWrap){
    _achCache[pid]=null; // force re-render (fresh for fullscreen)
    modalWrap.id="__lw_hidden";
    fullWrap.id="logros-wrap";
    renderLogros(pid);
    fullWrap.id="logros-full-wrap";
    modalWrap.id="logros-wrap";
  }
  closeM("m-logros");
  show("scr-logros");
}
function closeLogros(){
  // Return to patient home (preserve tab)
  show("scr-home");
  // Reopen profile if needed — just go home
}

function renderLogrosPreview(pid){
  const wrap=G("logros-preview");if(!wrap)return;
  const all=computeLogros(pid);
  const unlocked=all.filter(a=>a.unlocked).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  const preview=unlocked.slice(0,6);

  if(!preview.length){
    wrap.innerHTML=`<div style="text-align:center;padding:18px 0">
      <div style="font-size:28px;margin-bottom:6px">🏆</div>
      <div style="font-family:'Barlow',sans-serif;font-size:11px;font-weight:500;color:var(--muted)">Completa tu primera semana para ganar logros</div>
    </div>`;
    return;
  }

  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const cardHTML=a=>{
    const d=a.date?new Date(a.date):null;
    const dateStr=d?`${d.getDate()} ${M[d.getMonth()]}`:"";
    const tierBg=a.tier==="legendary"?"linear-gradient(160deg,rgba(212,146,14,.11),rgba(12,13,20,.95) 60%)"
                :a.tier==="elite"?"linear-gradient(160deg,rgba(85,119,238,.09),rgba(12,13,20,.95) 60%)"
                :"rgba(22,24,32,.95)";
    const tierBdr=a.tier==="legendary"?"rgba(212,146,14,.4)"
                 :a.tier==="elite"?"rgba(85,119,238,.35)"
                 :"rgba(80,86,104,.5)";
    const tierTop=a.tier==="legendary"?"linear-gradient(90deg,var(--gold),rgba(212,146,14,.3))"
                 :a.tier==="elite"?"linear-gradient(90deg,var(--blue),rgba(85,119,238,.3))"
                 :"rgba(140,150,170,.4)";
    const icoBg=a.tier==="legendary"?"rgba(212,146,14,.14)"
               :a.tier==="elite"?"rgba(85,119,238,.14)"
               :"rgba(80,86,104,.14)";
    const icoBdr=a.tier==="legendary"?"rgba(212,146,14,.3)"
                :a.tier==="elite"?"rgba(85,119,238,.25)"
                :"rgba(80,86,104,.25)";
    const icoClr=a.tier==="legendary"?"var(--gold)"
                :a.tier==="elite"?"var(--blue)"
                :"rgba(140,150,180,.85)";
    const dotClr=a.tier==="legendary"?"#d4920e":a.tier==="elite"?"#5577ee":"rgba(140,150,180,.5)";
    const dotShadow=a.tier==="legendary"?"0 0 8px rgba(212,146,14,.7)":a.tier==="elite"?"0 0 6px rgba(85,119,238,.5)":"none";
    const glow=a.tier==="legendary"?"0 2px 18px rgba(212,146,14,.15)":a.tier==="elite"?"0 0 14px rgba(85,119,238,.1)":"none";

    return`<div class="ach-card ${a.tier} unlocked" style="background:${tierBg};border-color:${tierBdr};box-shadow:${glow}">
      <div class="ach-tier-dot" style="background:${dotClr};box-shadow:${dotShadow}"></div>
      <div class="ach-icon-wrap" style="background:${icoBg};border:1px solid ${icoBdr}">
        <span class="iq-ic" data-ic="${a.icon}" style="color:${icoClr};width:18px;height:18px"></span>
      </div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
      ${dateStr?`<div class="ach-date">${dateStr}</div>`:""}
      <div class="ach-card-shine" style="position:absolute;top:0;left:0;right:0;height:2px;border-radius:12px 12px 0 0;background:${tierTop}"></div>
    </div>`;
  };

  const remaining=unlocked.length-6;
  wrap.innerHTML=`<div class="logros-preview-grid">${preview.map(cardHTML).join("")}</div>
    ${remaining>0||all.filter(a=>!a.unlocked).length>0?`
    <button type="button" class="logros-more-btn" onclick="openLogros()" style="margin-top:8px">
      <span class="iq-ic sm" data-ic="spark" style="color:var(--gold)"></span>
      ${remaining>0?`+${remaining} más · `:""}Ver colección completa
    </button>`:""}`;

  paintIcons(wrap);
  // Trophy dot: gold pulse when has logros
  const tdot=G("trophy-dot");
  if(tdot){const ul2=computeLogros(pid).filter(a=>a.unlocked).length;if(ul2>0){tdot.classList.add("on");tdot.style.background="var(--gold)";tdot.textContent="";}else tdot.classList.remove("on");}
  // Update m-logros header stats
  const mSub=G("mlogros-sub");
  const mFill=G("mlogros-master-fill");
  const allStats=computeLogros(pid);
  const ucnt=allStats.filter(a=>a.unlocked).length;
  const ttl=allStats.length;
  const mpct=Math.round((ucnt/ttl)*100);
  if(mSub)mSub.textContent=`${ucnt} / ${ttl} desbloqueados · ${mpct}%`;
  if(mFill)setTimeout(()=>{mFill.style.width=mpct+"%"},80);
}

function renderLogros(pid){
  const wrap=G("logros-wrap");if(!wrap)return;
  const all=computeLogros(pid);
  const total=all.length;
  const unlockedAll=all.filter(a=>a.unlocked);
  const count=unlockedAll.length;
  const pct=Math.round((count/total)*100);

  // Detect new unlocks
  const stored=new Set(DB.achUnlocked(pid));
  const currentUnlocked=new Set(unlockedAll.map(a=>a.id));
  const newOnes=[...currentUnlocked].filter(id=>!stored.has(id));

  if(newOnes.length){
    DB.saveAchUnlocked(pid,[...currentUnlocked]);
    delete _achCache[pid]; // invalidate cache on new unlock
    setTimeout(()=>{
      newOnes.forEach((id,i)=>{
        const def=LOGROS_DEF.find(d=>d.id===id);if(!def)return;
        setTimeout(()=>{
          fireConfetti(window.innerWidth*(.3+Math.random()*.4),window.innerHeight*.35);
          if(def.tier==="legendary"){
            setTimeout(()=>fireConfetti(window.innerWidth*(.2+Math.random()*.6),window.innerHeight*.2),120);
            setTimeout(()=>fireConfetti(window.innerWidth*(.3+Math.random()*.4),window.innerHeight*.45),260);
          }
          const tl=def.tier==="legendary"?"🏆 LEGENDARIO":def.tier==="elite"?"🔵 Élite":"⚪ Logro";
          toast("✅",`${tl}: ${def.name}`);
        },i*650);
      });
    },320);
  } else if(stored.size===0&&count>0){
    DB.saveAchUnlocked(pid,[...currentUnlocked]);
  }

  // Use cache if PID matches AND no new unlocks AND count unchanged
  if(_achCache[pid]&&_achCache[pid].count===count&&!newOnes.length){
    // Only update master bar, don't re-render
    const fill=wrap.querySelector("#ach-master-fill");
    if(fill)fill.style.width=pct+"%";
    return;
  }

  // Build HTML
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const fmtD=iso=>{if(!iso)return"";const d=new Date(iso);return`${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`};

  // Unique categories in order
  const catOrder=["peso","comp","consist","comp2","plan","hitos"];
  const catMeta={
    peso:  {label:"💪 Peso",        pill:"💪 Peso"},
    comp:  {label:"📊 Composición", pill:"📊 Comp"},
    consist:{label:"🔥 Consistencia",pill:"🔥 Ritmo"},
    comp2: {label:"📋 Compromiso",  pill:"📋 Comp"},
    plan:  {label:"📐 Plan",        pill:"📐 Plan"},
    hitos: {label:"🏁 Hitos",       pill:"🏁 Hitos"}
  };

  function cardHTML(a){
    const isNew=newOnes.includes(a.id);
    if(a.unlocked){
      return`<div class="ach-card ${a.tier} unlocked${isNew?" just-unlocked":""}">
        <div class="ach-tier-dot"></div>
        <div class="ach-icon-wrap">${icon(a.icon)}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
        ${a.date?`<div class="ach-date">${fmtD(a.date)}</div>`:""}
      </div>`;
    } else {
      const hasProg=a.progress&&a.progress.max>0;
      const progPct=hasProg?Math.round((Math.min(a.progress.cur,a.progress.max)/a.progress.max)*100):0;
      return`<div class="ach-card ${a.tier} locked">
        <div class="ach-icon-wrap">${icon(a.icon)}</div>
        <div class="ach-name">???</div>
        <div class="ach-desc">${a.desc}</div>
        ${hasProg?`<div class="ach-prog-wrap">
          <div class="ach-prog-track"><div class="ach-prog-fill" style="width:${progPct}%"></div></div>
          <div class="ach-prog-label">${a.progress.cur} / ${a.progress.max}</div>
        </div>`:""}
      </div>`;
    }
  }

  // Pills row
  let pillsHTML=`<button class="ach-pill active" onclick="achFilter(this,'all')">Todos</button>`;
  catOrder.forEach(k=>{
    const items=all.filter(a=>a.cat===k);if(!items.length)return;
    const unlocked=items.filter(a=>a.unlocked).length;
    pillsHTML+=`<button class="ach-pill" onclick="achFilter(this,'${k}')">${catMeta[k].pill} <span style="opacity:.6">${unlocked}/${items.length}</span></button>`;
  });

  // Sections
  let sectionsHTML="";
  catOrder.forEach(k=>{
    const items=all.filter(a=>a.cat===k);if(!items.length)return;
    sectionsHTML+=`<div class="ach-section" data-cat="${k}">
      <div class="ach-cat">${catMeta[k].label}</div>
      <div class="ach-grid">${items.map(cardHTML).join("")}</div>
    </div>`;
  });

  const html=`
  <div class="ach-shell">
    <div class="ach-shell-hd">
      <div class="ach-hd-row">
        <div class="ach-hd-title">${icon('spark','gold')} Logros</div>
        <div class="ach-hd-cnt">${count} / ${total}</div>
      </div>
      <div class="ach-master-bar"><div class="ach-master-fill" style="width:0%" id="ach-master-fill"></div></div>
      <div class="ach-pills">${pillsHTML}</div>
    </div>
    <div class="ach-body">${sectionsHTML}</div>
  </div>`;

  wrap.innerHTML=html;
  paintIcons(wrap);
  _achCache[pid]={count};

  setTimeout(()=>{
    const fill=G("ach-master-fill");
    if(fill)fill.style.width=pct+"%";
  },80);
}

function achFilter(btn,cat){
  // Update active pill
  btn.closest(".ach-pills").querySelectorAll(".ach-pill").forEach(p=>p.classList.remove("active"));
  btn.classList.add("active");
  // Show/hide sections
  const body=btn.closest(".ach-shell").querySelector(".ach-body");
  body.querySelectorAll(".ach-section[data-cat]").forEach(sec=>{
    sec.classList.toggle("hidden",cat!=="all"&&sec.dataset.cat!==cat);
  });
}

/* ── FUNCIONES LEGACY (mantenidas para compatibilidad, no se llaman desde UI) ── */
function renderTimeline(pid){/* reemplazado por renderLogros */}
/* ── TIMELINE DE EVENTOS (admin) ── */
function renderAdmTimeline(pid,showAll=false){
  const wrap=G("adm-timeline");if(!wrap)return;
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const fmt=d=>{const dt=new Date(d);return`${dt.getDate()} ${M[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`};
  const events=[];
  // Pesajes
  const prog=DB.prog(pid);
  const progSorted=[...prog].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const pt=DB.pt(pid);
  progSorted.forEach((e,i)=>{
    const prev=i>0?progSorted[i-1]:null;
    const d=prev?parseFloat((e.weight-prev.weight).toFixed(1)):null;
    const dStr=d===null?""
      :(()=>{const {color}=weightDeltaColor(d,pt?.goal,pt?.ficha,pt?.weight);
             return`<span style="color:${color}">${d>0?"+":""}${d} kg</span>`})();
    const note=e.note?` · ${e.note}`:"";
    events.push({date:e.date,type:"weight",dot:"tl-blue",icon:"activity",title:`${e.weight.toFixed(1)} kg${note}`,meta:`Pesaje · ${fmt(e.date)} ${dStr}`});
  });
  // Reportes
  DB.reports(pid).forEach(r=>{
    events.push({date:r.date,type:"report",dot:"tl-amber",icon:"note",title:`Reporte Sem ${r.week} · ${r.adherencePct}% adh`,meta:`${fmt(r.date)}${r.drReply?" · Respondido":""}`});
  });
  // Logros desbloqueados
  const logros=computeLogros(pid).filter(a=>a.unlocked&&a.date);
  logros.forEach(a=>{
    events.push({date:a.date,type:"logro",dot:"tl-gold",icon:"trophy",title:`Logro: ${a.name}`,meta:fmt(a.date)});
  });
  // Inicio de programa (primer pesaje)
  const firstProg=prog.length?[...prog].sort((a,b)=>new Date(a.date)-new Date(b.date))[0]:null;
  if(firstProg){
    events.push({date:firstProg.date,type:"start",dot:"tl-purple",icon:"user",title:"Inicio del programa",meta:fmt(firstProg.date),_isStart:true});
  }
  // Sort ascending (oldest first → reads like a journey timeline)
  events.sort((a,b)=>{
    // "start" event always goes first if same date
    if(a._isStart&&!b._isStart&&a.date===b.date)return -1;
    if(b._isStart&&!a._isStart&&a.date===b.date)return 1;
    return new Date(a.date)-new Date(b.date);
  });
  if(!events.length){wrap.innerHTML=`<div class="fxs tm" style="padding:12px 0;text-align:center;color:var(--muted)">Sin eventos aún</div>`;return}
  const LIMIT=8;
  // When not showing all, display the most recent N events (tail of sorted array)
  const visible=showAll?events:events.slice(-LIMIT);
  const hasMore=events.length>LIMIT;
  const toggleBtn=hasMore
    ? showAll
      ? `<button class="tl-show-all" onclick="renderAdmTimeline('${pid}',false);G('adm-timeline').scrollIntoView({behavior:'smooth',block:'nearest'})">↑ Mostrar menos</button>`
      : `<button class="tl-show-all" onclick="renderAdmTimeline('${pid}',true)">Ver todos los eventos (${events.length}) ↓</button>`
    : "";
  wrap.innerHTML=
    (!showAll&&hasMore?`<button class="tl-show-all" style="border-bottom:1px solid var(--line);border-top:none;margin-bottom:4px" onclick="renderAdmTimeline('${pid}',true)">↑ Ver historial completo (${events.length - LIMIT} anteriores)</button>`:"")
    +visible.map((ev,i)=>`
    <div class="tl-item">
      <div class="tl-left">
        <div class="tl-dot ${ev.dot}">${icon(ev.icon,'sm')}</div>
        <div class="tl-connector"></div>
      </div>
      <div class="tl-body">
        <div class="tl-title">${ev.title}</div>
        <div class="tl-meta">${ev.meta}</div>
      </div>
    </div>`).join("")
    +(showAll&&hasMore?toggleBtn:"");
  paintIcons(wrap);
}
function renderProgLog(log,showAll=false){
  const wrap=G("prog-log-list");const cnt=G("prog-log-count");
  if(!wrap)return;
  const pid=S.pid;
  if(!log||!log.length){
    wrap.innerHTML=`<div class="empty" style="padding:20px 0"><div class="ei">${icon('activity','muted')}</div><div class="et">Sin registros</div><div class="es">Añade tu primer pesaje con el botón + Peso.</div></div>`;
    paintIcons(wrap);
    if(cnt)cnt.textContent="0 registros";return}
  // Cronológico: oldest first, newest at bottom
  const sorted=[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const _ptGoal=DB.pt(pid)?.goal||"";
  const _ptFicha=DB.pt(pid)?.ficha||null;
  if(cnt)cnt.textContent=sorted.length+" registros";
  const LIMIT=5;
  // Mostrar los más recientes (cola del array) en orden cronológico
  const items=showAll?sorted:sorted.slice(-LIMIT);
  // Botón "Ver todos" ARRIBA de los items
  const showAllBtn=(sorted.length>LIMIT&&!showAll)
    ?`<button type="button" class="wlog-show-all" onclick="renderProgLog(DB.prog(S.pid),true)">↑ Ver todos los registros (${sorted.length})</button>`
    :(showAll&&sorted.length>LIMIT
      ?`<button type="button" class="wlog-show-all" onclick="renderProgLog(DB.prog(S.pid),false)">↑ Mostrar menos</button>`
      :"");
  const rows=items.map((e,i)=>{
    // Delta vs entrada anterior (más antigua)
    const globalIdx=sorted.findIndex(x=>x.date===e.date&&x.weight===e.weight);
    const prev=globalIdx>0?sorted[globalIdx-1]:null;
    const delta=prev?parseFloat((e.weight-prev.weight).toFixed(1)):null;
    const {color:dColor,bg:dBg}=delta===null?{color:"var(--muted)",bg:"transparent"}:weightDeltaColor(delta,_ptGoal,_ptFicha,_ptFicha?.peso);
    const dStr=delta===null?"":delta===0?"±0":(delta>0?"+":"")+delta.toFixed(1)+" kg";
    const d=new Date(e.date);
    const dateStr=`${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
    const isLatest=(i===items.length-1);
    return`<div class="wlog-item${isLatest?" wlog-latest":""}">
      <div class="wlog-left">
        <span class="wlog-w">${e.weight.toFixed(1)}</span><span class="wlog-unit">kg</span>
        <div class="wlog-date">${dateStr}${isLatest?" · Más reciente":""}</div>
        ${e.note?`<div class="wlog-note">"${_escLog(e.note)}"</div>`:""}
      </div>
      ${dStr?`<div class="wlog-delta" style="color:${dColor};background:${dBg}">${dStr}</div>`:""}
      <div class="wlog-del" onclick="deleteWeight(${globalIdx})" title="Eliminar"><span class="iq-ic sm" data-ic="x" style="width:14px;height:14px"></span></div>
    </div>`;
  }).join("");
  wrap.innerHTML=showAllBtn+rows;
  paintIcons(wrap);
}
function deleteWeight(idx){
  // FIX Bug13: usa índice directo en lugar de buscar por fecha
  // Evita borrar la entrada equivocada si dos registros tienen el mismo timestamp
  const pid=S.pid;
  const log=DB.prog(pid);
  const sorted=[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(!confirm("¿Eliminar este registro de peso?"))return;
  if(idx<0||idx>=sorted.length){toast("⚠️","No se encontró el registro");return}
  const targetDate=sorted[idx].date;
  const realIdx=log.findIndex(x=>x.date===targetDate&&x.weight===sorted[idx].weight);
  if(realIdx===-1){toast("⚠️","No se encontró el registro");return}
  log.splice(realIdx,1);
  DB.saveProg(pid,log);
  // FIX: sincronizar ficha.peso con el pesaje más reciente que quede
  // para que las tarjetas de composición no muestren el peso borrado
  const _ptDel=DB.pt(pid);
  if(_ptDel){
    const _sorted=[...log].sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(_sorted.length){
      const _newW=_sorted[0].weight;
      DB.updPt(pid,{weight:_newW});
      const _fichaUpd={...(_ptDel.ficha||{}),peso:String(_newW),_pesoUpdated:new Date().toISOString()};
      DB.updPt(pid,{ficha:_fichaUpd});
    } else {
      // Log vacío: limpiar peso en ficha para no mostrar dato fantasma
      const _fichaUpd={...(_ptDel.ficha||{}),peso:"",_pesoUpdated:new Date().toISOString()};
      DB.updPt(pid,{ficha:_fichaUpd});
    }
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>loadProgScreen(pid)));
  toast("🗑️","Registro eliminado");
}

/* ══════════════════════════════════════
   FEATURE 5 — NOTIFICACIONES PROGRAMADAS
══════════════════════════════════════ */
function saveSchedNotif(){
  const pid=S.selPid,date=G("sched-date").value,msg=G("sched-msg").value.trim();
  if(!date||!msg){toast("⚠️","Fecha y mensaje requeridos");return}
  const arr=DB.schedNotifs(pid);
  arr.push({id:"sn_"+Date.now(),date,msg,delivered:false});
  DB.saveSchedNotifs(pid,arr);
  G("sched-date").value="";G("sched-msg").value="";
  renderSchedList(pid);toast("✅","Recordatorio programado para el "+date);
}
function renderSchedList(pid){
  const wrap=G("sched-list");if(!wrap)return;
  const arr=DB.schedNotifs(pid);
  if(!arr.length){wrap.innerHTML="";return}
  const today=new Date().toISOString().slice(0,10);
  wrap.innerHTML=arr.slice().reverse().map(n=>`
    <div class="sched-item ${n.delivered?"delivered":""}">
      <div class="sched-date">${n.date}</div>
      <div class="sched-msg">${n.msg}</div>
      ${n.delivered?`<span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:800;color:var(--green);letter-spacing:1px">Enviado</span>`:`<div class="sched-del" onclick="deleteSchedNotif('${pid}','${n.id}')">✕</div>`}
    </div>`).join("");
}
function deleteSchedNotif(pid,id){
  const arr=DB.schedNotifs(pid).filter(n=>n.id!==id);
  DB.saveSchedNotifs(pid,arr);renderSchedList(pid);
}

/* ══════════════════════════════════════
   FEATURE + — CONFETTI MICRO-REWARD
══════════════════════════════════════ */
function fireConfetti(x,y){
  const colors=["#d4920e","#f0b429","#2eab65","#5577ee","#eceef2"];
  for(let i=0;i<18;i++){
    const p=document.createElement("div");p.className="confetti-p";
    p.style.cssText=`left:${x-10+Math.random()*20}px;top:${y}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${.6+Math.random()*.6}s;animation-delay:${Math.random()*.2}s`;
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),1400);
  }
}

function saveProg(){
  const pid=S.pid,w=parseDecimal(G("pw-inp").value),note=G("pn-inp").value.trim();
  if(isNaN(w)||w<30||w>300){toast("⚠️","Peso inválido (ej. 72.5)");haptic("error");return}
  const log=DB.prog(pid);
  // FIX Bug11: verificar si ya existe un registro para hoy — evitar entradas duplicadas
  const _todayStr=new Date().toISOString().slice(0,10);
  const _todayIdx=log.findIndex(x=>x.date.slice(0,10)===_todayStr);
  if(_todayIdx>=0){
    if(!confirm("Ya registraste un peso hoy ("+log[_todayIdx].weight.toFixed(1)+" kg). ¿Quieres sobreescribir el registro de hoy?")){return;}
    log.splice(_todayIdx,1); // eliminar el de hoy antes de agregar el nuevo
  }
  log.push({date:new Date().toISOString(),weight:w,note});
  DB.saveProg(pid,log);DB.updPt(pid,{weight:w});
  // FIX: sincronizar ficha.peso para que las tarjetas de composición y la vista del Dr
  // reflejen el mismo peso que la gráfica de progreso. No tocamos _updated (es para
  // cambios clínicos del Dr.) — usamos un campo separado _pesoUpdated.
  const _ptForSync=DB.pt(pid);
  if(_ptForSync){
    const _fichaSync={...(_ptForSync.ficha||{}),peso:String(w),_pesoUpdated:new Date().toISOString()};
    DB.updPt(pid,{ficha:_fichaSync});
    // Si existe grasa registrada, crear snap en fichaHistory para que la gráfica de grasa
    // tenga un punto asociado al nuevo peso (sin repetir si el peso no cambió)
    const _gc=parseFloat(_fichaSync.grasa)||null;
    if(_gc){
      const _lastSnap=(DB.fichaHistory(pid)||[])[0];
      const _lastSnapPeso=_lastSnap?parseFloat(_lastSnap.peso)||null:null;
      if(!_lastSnap||Math.abs((_lastSnapPeso||0)-w)>=0.1){
        DB.addFichaSnap(pid,{date:new Date().toISOString(),peso:String(w),grasa:String(_gc)});
      }
    }
  }
  haptic("success");
  // Fire confetti BEFORE closing (so element rect is valid)
  fireConfetti(window.innerWidth/2, window.innerHeight*0.45);
  closeM("m-addprog");G("pw-inp").value="";G("pn-inp").value="";
  G("st-peso").textContent=w.toFixed(1);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    loadProgScreen(pid);
    setTimeout(()=>{
      const wl=G("prog-log-list");
      if(wl)wl.scrollIntoView({behavior:"smooth",block:"nearest"});
    },200);
  }));
  toast("✅","Pesaje registrado");
}

/* ── CHART ── */
/* ══════════════════════════════════════
   ADMIN — COMPARATIVA DE PESO (multi-línea)
══════════════════════════════════════ */
let _compDays=30;

const COMP_PALETTE=[
  "#f0b429","#5577ee","#2eab65","#e85d75","#a855f7",
  "#38bdf8","#fb923c","#34d399","#f472b6","#94a3b8"
];

function setCompRange(days,btn){
  _compDays=days;
  document.querySelectorAll('.adm-comp-range').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  requestAnimationFrame(()=>requestAnimationFrame(()=>drawAdminCompChart()));
}

function drawAdminCompChart(){
  const _admCanvas=G("chart-adm-comp");
  if(_admCanvas&&_admCanvas.offsetParent===null)return; // canvas not visible
  const canvas=G("chart-adm-comp");
  const legend=G("adm-comp-legend");
  if(!canvas||!legend)return;

  // Gather active patients with enough data
  const pts=DB.pts().filter(p=>{
    const s=payStatus(p).status;
    return s==="on"||s==="trial";
  });

  const cutoff=new Date();
  cutoff.setDate(cutoff.getDate()-_compDays);

  // Build series: only patients with >=2 points in range
  const series=[];
  pts.forEach((p,i)=>{
    const prog=[...DB.prog(p.id)].sort((a,b)=>new Date(a.date)-new Date(b.date));
    if(!prog.length)return;
    // Include first point before cutoff as baseline, then all within range
    const inRange=prog.filter(e=>new Date(e.date)>=cutoff);
    const baseline=prog.find(e=>new Date(e.date)<cutoff)||prog[0];
    const pts2=baseline?[baseline,...inRange.filter(e=>e!==baseline)]:inRange;
    if(pts2.length<2)return;
    const baseW=pts2[0].weight;
    const color=COMP_PALETTE[series.length%COMP_PALETTE.length];
    series.push({
      name:p.name.split(" ")[0]+" "+((p.name.split(" ")[1]||"")[0]||"")+".",
      color,
      goal:p.goal||"",
      ficha:p.ficha||null,
      baseW,
      points:pts2.map(e=>({
        t:new Date(e.date).getTime(),
        w:e.weight,
        pct:((e.weight-baseW)/baseW)*100
      }))
    });
  });

  // Empty state
  if(series.length===0){
    canvas.style.display="none";
    legend.innerHTML=`<div class="adm-comp-empty">Sin pacientes activos con datos suficientes</div>`;
    return;
  }
  canvas.style.display="block";

  // Canvas sizing
  const dpr=window.devicePixelRatio||1;
  const _pw=canvas.parentElement?.clientWidth||0;
  const cssW=_pw>10?_pw:(window.innerWidth-28)||300;
  const cssH=Math.min(160, Math.max(120, series.length*28));
  canvas.style.width=cssW+"px";
  canvas.style.height=cssH+"px";
  canvas.width=cssW*dpr;
  canvas.height=cssH*dpr;
  const ctx=canvas.getContext("2d");
  ctx.scale(dpr,dpr);
  const W=cssW,H=cssH;
  ctx.clearRect(0,0,W,H);

  // Time range
  const tMin=cutoff.getTime();
  const tMax=Date.now();
  const tRange=tMax-tMin||1;

  // Value range — % change
  const allPcts=series.flatMap(s=>s.points.map(p=>p.pct));
  const rawMin=Math.min(...allPcts,0)-1;
  const rawMax=Math.max(...allPcts,0)+1;
  const pad=Math.max(1,(rawMax-rawMin)*0.12);
  const vMin=rawMin-pad, vMax=rawMax+pad;
  const vRange=vMax-vMin||1;

  const P={t:10,b:22,l:32,r:8};
  const cW=W-P.l-P.r, cH=H-P.t-P.b;
  const tx=t=>P.l+((t-tMin)/tRange)*cW;
  const ty=v=>P.t+cH-((v-vMin)/vRange)*cH;

  // Zero line
  const zy=ty(0);
  ctx.strokeStyle="rgba(255,255,255,0.08)";ctx.lineWidth=1;
  ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(P.l,zy);ctx.lineTo(W-P.r,zy);ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle="rgba(255,255,255,0.18)";
  ctx.font="500 8px 'Inter',sans-serif";ctx.textAlign="right";
  ctx.fillText("0%",P.l-3,zy+3);

  // Grid lines (+ and -)
  [-2,2].forEach(pct=>{
    if(pct>vMin&&pct<vMax){
      const yy=ty(pct);
      ctx.strokeStyle="rgba(255,255,255,0.04)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(P.l,yy);ctx.lineTo(W-P.r,yy);ctx.stroke();
    }
  });

  // Date labels
  ctx.fillStyle="rgba(255,255,255,0.22)";
  ctx.font="500 8px 'Inter',sans-serif";ctx.textAlign="center";
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  [0,0.5,1].forEach(t=>{
    const d=new Date(tMin+t*tRange);
    ctx.fillText(`${d.getDate()} ${M[d.getMonth()]}`,P.l+t*cW,H-5);
  });

  // Draw each series
  series.forEach(s=>{
    if(s.points.length<2)return;
    ctx.beginPath();
    s.points.forEach((p,i)=>{
      const x=tx(p.t),y=ty(p.pct);
      if(i===0)ctx.moveTo(x,y);
      else{
        const prev=s.points[i-1];
        const px=tx(prev.t),py=ty(prev.pct);
        const mx=(px+x)/2;
        ctx.bezierCurveTo(mx,py,mx,y,x,y);
      }
    });
    ctx.strokeStyle=s.color;
    ctx.lineWidth=2;
    ctx.lineJoin="round";
    ctx.lineCap="round";
    ctx.shadowColor=s.color;
    ctx.shadowBlur=4;
    ctx.stroke();
    ctx.shadowBlur=0;

    // Terminal dot
    const last=s.points[s.points.length-1];
    const lx=tx(last.t),ly=ty(last.pct);
    ctx.beginPath();ctx.arc(lx,ly,3.5,0,Math.PI*2);
    ctx.fillStyle=s.color;ctx.fill();
    ctx.strokeStyle="#0a0a0b";ctx.lineWidth=1.5;ctx.stroke();
  });

  // Legend
  legend.innerHTML=series.map(s=>{
    const last=s.points[s.points.length-1];
    const deltaKg=parseFloat((last.w-s.baseW).toFixed(1)); // kg delta for goal-aware coloring
    const deltaPct=last.pct;
    const sign=deltaPct>0?"+":"";
    const {color:deltaColor,bg:deltaBg}=weightDeltaColor(deltaKg,s.goal,s.ficha,s.weight);
    return`<div class="adm-comp-leg-row">
      <div class="adm-comp-leg-dot" style="background:${s.color}"></div>
      <div class="adm-comp-leg-name">${s.name}</div>
      <div class="adm-comp-leg-val">${last.w.toFixed(1)} kg</div>
      <div class="adm-comp-leg-delta" style="color:${deltaColor};background:${deltaBg}">${sign}${deltaPct.toFixed(1)}%</div>
    </div>`;
  }).join("");
}

function _canvasWidth(canvas) {
  // Mide el ancho real del canvas: parentElement > getBoundingClientRect > fallback.
  // Maneja el caso donde el canvas esta en un contenedor display:none (clientWidth=0).
  if (canvas.parentElement) {
    const pw = canvas.parentElement.getBoundingClientRect().width;
    if (pw > 10) return pw;
    const cw = canvas.parentElement.clientWidth;
    if (cw > 10) return cw;
  }
  return (window.innerWidth - 28) || 320;
}
function drawChart(cId,log,cssH=148,goalWeight=null){
  const canvas=G(cId);if(!canvas)return;
  const ctx=canvas.getContext("2d"),dpr=window.devicePixelRatio||1;
  const cssW=_canvasWidth(canvas);
  canvas.style.width=cssW+"px";canvas.style.height=cssH+"px";canvas.width=cssW*dpr;canvas.height=cssH*dpr;ctx.scale(dpr,dpr);
  const W=cssW,H=cssH;ctx.clearRect(0,0,W,H);
  if(log.length<2){ctx.fillStyle="#3a3f4e";ctx.font="600 11px 'Barlow',sans-serif";ctx.textAlign="center";ctx.fillText("Registra al menos 2 pesajes",W/2,H/2);return}
  const sorted=[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const ws=sorted.map(e=>e.weight);
  // Include goal in scale if provided
  const allVals=goalWeight?[...ws,goalWeight]:ws;
  const mn=Math.min(...allVals)-1.5,mx=Math.max(...allVals)+1.5;
  const P={t:14,b:26,l:38,r:10},cW=W-P.l-P.r,cH=H-P.t-P.b;
  const tx=i=>P.l+(i/(sorted.length-1))*cW,ty=w=>P.t+cH-((w-mn)/(mx-mn))*cH;
  ctx.strokeStyle="rgba(255,255,255,0.04)";ctx.lineWidth=1;
  [0,.5,1].forEach(t=>{const y=P.t+cH*(1-t);ctx.beginPath();ctx.moveTo(P.l,y);ctx.lineTo(W-P.r,y);ctx.stroke();ctx.fillStyle="#3a3f4e";ctx.font="500 10px 'Inter',sans-serif";ctx.textAlign="right";ctx.fillText((mn+t*(mx-mn)).toFixed(1),P.l-4,y+3.5)});
  ctx.fillStyle="#3a3f4e";ctx.font="600 9px 'Barlow',sans-serif";ctx.textAlign="center";
  sorted.forEach((e,i)=>{const d=new Date(e.date);ctx.fillText(`${d.getDate()}/${d.getMonth()+1}`,tx(i),H-5)});
  const grad=ctx.createLinearGradient(0,P.t,0,H-P.b);grad.addColorStop(0,"rgba(212,146,14,0.25)");grad.addColorStop(.7,"rgba(212,146,14,0.04)");grad.addColorStop(1,"rgba(212,146,14,0)");
  ctx.beginPath();ctx.moveTo(tx(0),ty(ws[0]));
  for(let i=1;i<sorted.length;i++){const cx=(tx(i-1)+tx(i))/2;ctx.bezierCurveTo(cx,ty(ws[i-1]),cx,ty(ws[i]),tx(i),ty(ws[i]))}
  ctx.lineTo(tx(sorted.length-1),H-P.b);ctx.lineTo(tx(0),H-P.b);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
  ctx.beginPath();ctx.moveTo(tx(0),ty(ws[0]));
  for(let i=1;i<sorted.length;i++){const cx=(tx(i-1)+tx(i))/2;ctx.bezierCurveTo(cx,ty(ws[i-1]),cx,ty(ws[i]),tx(i),ty(ws[i]))}
  ctx.strokeStyle="#d4920e";ctx.lineWidth=2.5;ctx.lineJoin="round";ctx.lineCap="round";ctx.shadowColor="rgba(212,146,14,0.4)";ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;
  sorted.forEach((_,i)=>{ctx.beginPath();ctx.arc(tx(i),ty(ws[i]),7,0,Math.PI*2);ctx.fillStyle="rgba(212,146,14,0.11)";ctx.fill();ctx.beginPath();ctx.arc(tx(i),ty(ws[i]),4,0,Math.PI*2);ctx.fillStyle="#d4920e";ctx.fill();ctx.strokeStyle="#0a0a0b";ctx.lineWidth=2;ctx.stroke()});
  // Goal line
  if(goalWeight&&!isNaN(goalWeight)){
    const gy=ty(goalWeight);
    ctx.save();
    ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.strokeStyle="rgba(46,171,101,.6)";
    ctx.beginPath();ctx.moveTo(P.l,gy);ctx.lineTo(W-P.r,gy);ctx.stroke();
    ctx.setLineDash([]);
    // Label
    ctx.fillStyle="rgba(46,171,101,.85)";ctx.font="700 9px 'Inter',sans-serif";ctx.textAlign="right";
    ctx.fillText("META "+goalWeight.toFixed(1),W-P.r-2,gy-3);
    // Diamond marker on left
    ctx.save();ctx.translate(P.l-3,gy);ctx.rotate(Math.PI/4);
    ctx.fillStyle="rgba(46,171,101,.8)";ctx.fillRect(-4,-4,8,8);
    ctx.restore();
    ctx.restore();
  }
}

/* ── PHOTOS (inside progress tab) ── */
function triggerPhoto(slot){PHOTO_TARGET=slot;G("photo-inp").click()}
function handlePhoto(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const MAX=800,cvs=document.createElement("canvas");
      let w=img.width,h=img.height;
      if(w>h){if(w>MAX){h=h*MAX/w;w=MAX}}else{if(h>MAX){w=w*MAX/h;h=MAX}}
      cvs.width=w;cvs.height=h;cvs.getContext("2d").drawImage(img,0,0,w,h);
      const b64=cvs.toDataURL("image/jpeg",0.72);
      PHOTO_DATA[PHOTO_TARGET]=b64;
      const zone=G("pz-"+PHOTO_TARGET);
      zone.className="photo-slot photo-slot-full";
      zone.innerHTML=`<img src="${b64}" style="width:100%;height:100%;object-fit:cover"><div class="ps-overlay">${PHOTO_TARGET==="front"?"Frente":PHOTO_TARGET==="side"?"Lateral":"Posterior"}</div>`;
      e.target.value="";
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
function savePhotoSet(){
  const pid=S.pid,note=G("foto-note").value.trim();
  if(!PHOTO_DATA.front&&!PHOTO_DATA.side&&!PHOTO_DATA.back){toast("⚠️","Sube al menos una foto");return}
  const sets=DB.photos(pid);
  sets.unshift({date:new Date().toISOString(),note:note||"Sin nota",front:PHOTO_DATA.front||null,side:PHOTO_DATA.side||null,back:PHOTO_DATA.back||null});
  DB.savePhotos(pid,sets);
  closeM("m-addfotos");resetPhotoForm();
  renderPhotosInProg(pid);
  renderTimeline(pid);
  fireConfetti(window.innerWidth/2, window.innerHeight*0.5);
  toast("✅","Fotos guardadas");
}
function resetPhotoForm(){
  PHOTO_DATA={};PHOTO_TARGET=null;G("foto-note").value="";
  ["front","side","back"].forEach(s=>{
    const z=G("pz-"+s);if(!z)return;
    z.className="photo-slot photo-slot-empty";
    const lbl=s==="front"?"Frente":s==="side"?"Lateral":"Posterior";
    z.innerHTML=`<div class="ps-ic">${icon('camera')}</div><div class="ps-lb">${lbl}</div>`;
  });
}
function renderPhotosInProg(pid){
  const sets=DB.photos(pid),wrap=G("fotos-list");if(!wrap)return;
  if(!sets.length){
    wrap.innerHTML=`<div class="empty" style="padding:24px 16px">
      <div class="ei">${icon('camera','muted')}</div>
      <div class="et">Sin fotos aún</div>
      <div class="es">Documenta tu transformación desde el día 1 con un set de fotos.</div>
      <button type="button" class="btn btn-blue" style="margin:14px auto 0;display:flex;gap:6px;align-items:center" onclick="showM('m-addfotos')">
        ${icon('camera','sm')} <span>Subir primer set</span>
      </button>
    </div>`;
    paintIcons(wrap);return;
  }
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  let html=`<div style="text-align:right;margin-bottom:8px;display:flex;justify-content:flex-end;gap:8px">
    ${sets.length>=2?`<button class="btn btn-blue btn-sm" onclick="openPhotoCompare('${pid}')">${icon('eye','sm')} Comparar</button>`:''}
    <button class="btn btn-out btn-sm" onclick="showM('m-addfotos')">+ Set de fotos</button>
  </div>`;
  html+=sets.map(set=>{
    const d=new Date(set.date);
    const thumbs=[{src:set.front,lbl:"Frente"},{src:set.side,lbl:"Lateral"},{src:set.back,lbl:"Posterior"}].map(p=>
      p.src?`<div class="photo-slot photo-slot-full" onclick="openPV('${encodeURIComponent(p.src)}','${p.lbl} · ${fmtShort(set.date)}')"><img src="${p.src}" loading="lazy"><div class="ps-overlay">${p.lbl}</div></div>`
           :`<div class="photo-slot photo-slot-empty" style="cursor:default"><div class="ps-ic" style="opacity:.3;font-size:18px">—</div></div>`
    ).join("");
    return`<div class="card" style="margin-bottom:10px"><div class="card-hd"><div class="card-ico">${icon('camera')}</div><div><div class="card-title" style="font-size:13px">${set.note}</div><div class="card-sub">${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}</div></div></div><div class="card-bd"><div class="photo-strip">${thumbs}</div></div></div>`;
  }).join("");
  wrap.innerHTML=html;
}
function openPV(enc,lbl){G("pv-img").src=decodeURIComponent(enc);G("pv-lbl").textContent=lbl;G("pv-over").classList.add("open")}
function closePV(){G("pv-over").classList.remove("open")}

/* ─────────────────────────────────────────
   REPORTE SEMANAL — PATIENT SIDE
───────────────────────────────────────── */
let RPT_ADH={},RPT_PHOTOS={};

function renderReportBanner(pid){
  const rs=reportStatusForPt(pid),banner=G("report-banner-home"),sub=G("home-rep-sub");
  if(!banner)return;
  if(rs.status==="none"){
    // Saturday special: show pre-emptive reminder
    const _day=new Date().getDay();
    if(_day===6){
      banner.style.display="block";
      banner.innerHTML=`<div class="report-banner pending" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(232,150,12,.5),transparent)"></div>
        <div class="rb-header">
          <div class="rb-icon" style="color:var(--amber)">${icon('alert')}</div>
          <div>
            <div class="rb-title">Reporte vence mañana</div>
            <div class="rb-sub">Mañana es domingo — el Dr. espera tu reporte de la semana.</div>
          </div>
        </div>
        <button class="btn" style="margin-top:10px;width:100%;background:linear-gradient(135deg,rgba(232,150,12,.2),rgba(232,150,12,.08));border:1px solid rgba(232,150,12,.3);color:var(--amber);font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase" onclick="goTab('reporte')">Preparar reporte →</button>
      </div>`;
      if(sub)sub.textContent="Vence mañana domingo";
    } else {
      banner.style.display="none";if(sub)sub.textContent="Entrega tu reporte de la semana";
    }
    return;
  }
  banner.style.display="block";
  if(rs.status==="sent"||rs.status==="late"){
    const r=rs.report,hasReply=!!r.drReply;
    banner.innerHTML=`<div class="report-banner ${rs.status}">
      <div class="rb-header"><div class="rb-icon">${hasReply?icon("chat"):icon("check-circle")}</div><div><div class="rb-title">${hasReply?"Reporte respondido":"Reporte enviado"}</div><div class="rb-sub">Semana ${DB.pt(pid)?.week||"—"} · ${fmtShort(r.date)}${rs.status==="late"?" · Entrega tardía":""}</div></div></div>
      ${hasReply?`<div style="background:var(--gold-bg);border:1px solid var(--gold-brd);border-radius:var(--rs);padding:10px 12px;font-size:12px;color:var(--txt2);line-height:1.65"><span style="font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:900;color:var(--gold);letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:5px">Dr. Arévalo respondió</span>${r.drReply}</div>`:""}
    </div>`;
    if(sub)sub.textContent=hasReply?"Respondido esta semana":"Enviado esta semana";
  }else if(rs.status==="urgent"){
    banner.innerHTML=`<div class="sunday-banner">
      <div class="sunday-banner-top">
        <div class="sunday-banner-ic">${icon('alert','amber')}</div>
        <div>
          <div class="sunday-banner-title">⏰ Hoy es el último día</div>
          <div class="sunday-banner-sub">Es domingo — tu reporte vence hoy. El Dr. está esperándolo.</div>
        </div>
      </div>
      <button class="btn btn-danger" onclick="goTab('reporte')" style="width:100%;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;letter-spacing:1.5px">Entregar reporte ahora →</button>
    </div>`;
    if(sub)sub.textContent="Pendiente — vence hoy";
  }else if(rs.status==="pending"){
    banner.innerHTML=`<div class="report-banner pending">
      <div class="rb-tag pending">Mañana vence</div>
      <div class="rb-header"><div class="rb-icon">${icon('note')}</div><div><div class="rb-title">Reporte semanal</div><div class="rb-sub">Mañana (domingo) debes entregar tu reporte de esta semana.</div></div></div>
      <button class="btn btn-amber" onclick="goTab('reporte')" style="margin-top:4px">Ver reporte</button>
    </div>`;
    if(sub)sub.textContent="Vence mañana (domingo)";
  }
}

