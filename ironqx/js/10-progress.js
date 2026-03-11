/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Progress screen, weight log, motivational banner
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function loadProgScreen(pid){
  if(!pid)return;
  const log=DB.prog(pid);
  const pt=DB.pt(pid);
  const goalWeight=pt&&pt.ficha&&parseFloat(pt.ficha.pesoMeta)?parseFloat(pt.ficha.pesoMeta):null;
  renderProgLog(log);drawChart("chart-main",log,148,goalWeight);
  // Peso inicial: primero del log, luego ficha.pesoInicial, luego pt.weight
  const _pesoIniF = pt?.ficha?.pesoInicial ? parseFloat(pt.ficha.pesoInicial) : null;
  const _pesoIniFallback = _pesoIniF || (pt?.weight ? parseFloat(pt.weight) : null);

  if(log.length>=2){
    const sortedLog=[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const f=sortedLog[0].weight,l=sortedLog[sortedLog.length-1].weight,diff=l-f;
    G("ch-s").textContent=f.toFixed(1)+" kg";G("ch-c").textContent=l.toFixed(1)+" kg";G("ch-d").textContent=(diff>0?"+":"")+diff.toFixed(1)+" kg";
    const _chdc=weightDeltaColor(diff,pt?.goal,pt?.ficha);G("ch-d").style.color=_chdc.color;
  }
  else if(log.length===1){
    const _cur=log[0].weight;
    // Mostrar peso inicial desde ficha si existe, sino el mismo registro
    const _ini=_pesoIniFallback||_cur;
    const _diff=_cur-_ini;
    G("ch-s").textContent=_ini.toFixed(1)+" kg";
    G("ch-c").textContent=_cur.toFixed(1)+" kg";
    G("ch-d").textContent=(_diff!==0?((_diff>0?"+":"")+_diff.toFixed(1)+" kg"):"—");
    if(_diff!==0){const _chdc=weightDeltaColor(_diff,pt?.goal,pt?.ficha);G("ch-d").style.color=_chdc.color;}
  }
  else{
    // Sin registros — mostrar peso inicial de ficha si existe
    ["ch-s","ch-d","ch-c"].forEach(id=>G(id).textContent="—");
    if(_pesoIniFallback)G("ch-s").textContent=_pesoIniFallback.toFixed(1)+" kg";
  }
  renderMotivBanner(pid);
  renderPhotosInProg(pid);
  renderBeforeAfter(pid);
  renderBodyComp(pid);
  // Double RAF ensures display:none→block reflow is complete before canvas measures clientWidth
  // FIX: double RAF + 300ms timeout como fallback por si el canvas aun tiene width=0
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    drawGcChart(pid,'chart-gc','gc-s','gc-d','gc-c','bc-hist-sl','bc-hist-card');
    drawCompChart(pid);drawDonut(pid);
    // Segundo intento tras transicion CSS
    setTimeout(()=>{
      drawChart('chart-main',log,148,goalWeight);
      drawGcChart(pid,'chart-gc','gc-s','gc-d','gc-c','bc-hist-sl','bc-hist-card');
    },350);
  }));
  renderLogros(pid);
  renderMonthHeatmap(pid);
  setTimeout(()=>initChartTooltip('chart-main',log),200);
  // Feature 2 — Meta alcanzada: fire once per patient
  if(goalWeight&&log.length){
    const _sortedG=[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const _lastW=_sortedG[_sortedG.length-1].weight;
    const _dir=weightGoalDir(pt?.goal,pt?.ficha);
    const _reached=(_dir==="down"&&_lastW<=goalWeight)||(_dir==="up"&&_lastW>=goalWeight)||(_dir==="neutral"&&Math.abs(_lastW-goalWeight)<=0.3);
    const _flagKey="iq_goal_"+pid;
    if(_reached&&!STORAGE.get(_flagKey)){
      STORAGE.set(_flagKey,"1");
      setTimeout(()=>{
        fireConfetti(window.innerWidth*0.25,window.innerHeight*0.3);
        setTimeout(()=>fireConfetti(window.innerWidth*0.75,window.innerHeight*0.25),120);
        setTimeout(()=>fireConfetti(window.innerWidth*0.5,window.innerHeight*0.2),260);
        toast("🏆","¡Meta alcanzada! "+goalWeight+" kg logrados");
      },400);
    } else if(!_reached){
      STORAGE.remove(_flagKey); // reset flag if weight moves away from goal
    }
  }
}

function renderMotivBanner(pid){
  const wrap=G('prog-motiv-banner');if(!wrap)return;
  const pt=DB.pt(pid);if(!pt)return;
  const adh=DB.adh(pid);
  const log=DB.prog(pid);
  const streak=calcStreak(adh);
  const doneDays=Object.values(adh).filter(v=>v==="done").length;

  let type,emoji,title,sub;

  if(streak>=14){
    type="streak";emoji="🔥";title=`${streak} días seguidos — ¡Imparable!`;
    sub="Llevas más de 2 semanas sin fallar un solo día.";
  } else if(streak>=7){
    type="streak";emoji="⚡";title=`Racha de ${streak} días activa`;
    sub="Una semana completa de consistencia. ¡Sigue así!";
  } else if(streak>=3){
    type="streak";emoji="💪";title=`${streak} días en racha`;
    sub="Estás construyendo el hábito. No lo rompas.";
  } else {
    // Check weight progress
    const sorted=log.length?[...log].sort((a,b)=>new Date(a.date)-new Date(b.date)):[];
    if(sorted.length>=2){
      const diff=parseFloat((sorted[0].weight-sorted[sorted.length-1].weight).toFixed(1));
      if(diff>=3){
        type="progress";emoji="🏆";title=`${diff} kg menos desde el inicio`;
        sub="Tu transformación es real. Los números no mienten.";
      } else if(diff>=1){
        type="progress";emoji="📉";title=`-${diff} kg desde el inicio`;
        sub="Cada décima cuenta. Vas en la dirección correcta.";
      } else if(doneDays>=10){
        type="progress";emoji="💎";title=`${doneDays} días de entrenamiento acumulados`;
        sub="La constancia es tu superpoder.";
      } else {
        type="start";emoji="🎯";title=`Semana ${pt.week||1} — ${pt.goal||"Objetivo activo"}`;
        sub="Registra tu peso y sube a la siguiente semana.";
      }
    } else {
      type="start";emoji="👋";title=`Bienvenido a tu espacio, ${pt.name.split(" ")[0]}`;
      sub="Empieza registrando tu peso para ver tu progreso.";
    }
  }

  wrap.innerHTML=`<div class="prog-motiv ${type}">
    <div class="prog-motiv-emoji">${emoji}</div>
    <div class="prog-motiv-text">
      <div class="prog-motiv-title">${title}</div>
      <div class="prog-motiv-sub">${sub}</div>
    </div>
  </div>`;
}
/* ── BODY COMPOSITION ── */
function imcClass(imc){
  if(!imc||imc<10)return{cls:"",tag:"—"};
  if(imc<18.5)return{cls:"bc-blue",tag:"Bajo peso"};
  if(imc<25)  return{cls:"bc-green",tag:"Normal"};
  if(imc<30)  return{cls:"bc-amber",tag:"Sobrepeso"};
  return{cls:"bc-red",tag:"Obesidad"};
}
function gcClass(gc){
  if(!gc||gc<0)return{cls:"",tag:"—"};
  if(gc<12)   return{cls:"bc-blue",tag:"Bajo"};
  if(gc<20)   return{cls:"bc-green",tag:"Atlético"};
  if(gc<28)   return{cls:"bc-amber",tag:"Promedio"};
  return{cls:"bc-red",tag:"Alto"};
}
function mmClass(mm,peso){
  if(!mm||mm<1)return{cls:"",tag:"—"};
  if(!peso)return{cls:"bc-gold",tag:"—"};
  const pct=(mm/peso)*100;
  if(pct>=45)return{cls:"bc-green",tag:"Óptima"};
  if(pct>=38)return{cls:"bc-gold",tag:"Buena"};
  return{cls:"bc-amber",tag:"Mejorable"};
}
function setBcCard(cardId,valId,tagId,val,unit,cls,tag,animate){
  const card=G(cardId),valEl=G(valId),tagEl=G(tagId);
  if(!card)return;
  ["bc-green","bc-amber","bc-red","bc-blue","bc-gold"].forEach(c=>card.classList.remove(c));
  // Remove old ring if present
  const oldRing=card.querySelector('.bc-ring-wrap');if(oldRing)oldRing.remove();
  if(val===null||val===undefined||val===""||isNaN(val)){
    valEl.innerHTML=`<span style="font-size:14px;opacity:.4">Sin datos</span>`;
    tagEl.textContent="—";tagEl.style.display="none";
    return;
  }
  valEl.textContent=unit==="imc"?Number(val).toFixed(1):Number(val).toFixed(1);
  if(cls)card.classList.add(cls);
  tagEl.textContent=tag;tagEl.style.display="inline-block";
  if(animate){card.classList.remove("bc-updated");void card.offsetWidth;card.classList.add("bc-updated")}
  // Inject mini ring — pct represents position in healthy range
  const ringPct=_bcRingPct(val,unit);
  if(ringPct!==null){
    const r=9,circ=2*Math.PI*r,offset=circ*(1-ringPct);
    const ringEl=document.createElement('div');ringEl.className='bc-ring-wrap';
    ringEl.innerHTML=`<svg width="26" height="26" viewBox="0 0 26 26">
      <circle class="bc-ring-track" cx="13" cy="13" r="${r}"/>
      <circle class="bc-ring-fill" cx="13" cy="13" r="${r}"
        stroke-dasharray="${circ.toFixed(1)}"
        stroke-dashoffset="${circ.toFixed(1)}"
        transform="rotate(-90 13 13)"/>
    </svg>`;
    card.appendChild(ringEl);
    // Animate after paint
    setTimeout(()=>{
      const fill=ringEl.querySelector('.bc-ring-fill');
      if(fill)fill.style.strokeDashoffset=offset.toFixed(1);
    },80);
  }
}
function _bcRingPct(val,unit){
  // Returns 0-1 position in healthy/reference range, null if not applicable
  const v=parseFloat(val);if(isNaN(v))return null;
  if(unit==="imc"){return Math.min(1,Math.max(0,(v-10)/(35-10)));}
  if(unit==="%")  {return Math.min(1,Math.max(0,(v-5)/(50-5)));}
  return null;
}
