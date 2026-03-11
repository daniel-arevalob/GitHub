/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Body composition cards
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function renderBodyComp(pid,animate=false){
  const pt=DB.pt(pid);if(!pt)return;
  const f=pt.ficha||{};
  const prog=DB.prog(pid);
  // FIX: usar el pesaje más reciente entre ficha.peso y el último registro en prog
  // para que las tarjetas sean un espejo exacto de las métricas reales del paciente
  const _sortedProg=prog.length?[...prog].sort((a,b)=>new Date(b.date)-new Date(a.date)):[];
  const _latestEntry=_sortedProg[0]||null;
  const _fichaW=parseFloat(f.peso)||null;
  const _fichaDate=f._updated?new Date(f._updated):null;
  const _progDate=_latestEntry?new Date(_latestEntry.date):null;
  // Preferir el más reciente de los dos; si prog es más nuevo, usarlo
  const peso=(_latestEntry&&(!_fichaDate||_progDate>_fichaDate))
    ?_latestEntry.weight
    :(_fichaW||(_latestEntry?_latestEntry.weight:(pt.weight||null)));
  const altura=parseFloat(f.altura)||null;
  const grasa=parseFloat(f.grasa)||null;
  // IMC
  let imcVal=null;
  if(peso&&altura){imcVal=peso/((altura/100)**2)}
  const imcC=imcClass(imcVal);
  setBcCard("bc-imc","bc-imc-val","bc-imc-tag",imcVal,"imc",imcC.cls,imcC.tag,animate);
  // %GC
  const gcC=gcClass(grasa);
  setBcCard("bc-gc","bc-gc-val","bc-gc-tag",grasa,"%",gcC.cls,gcC.tag,animate);
  // Masa Grasa = peso * %grasa / 100
  let masaGrasa=null;
  if(peso&&grasa){masaGrasa=parseFloat((peso*(grasa/100)).toFixed(1))}
  const mgC=masaGrasa?{cls:"bc-red",tag:masaGrasa>(peso||0)*0.35?"Alto":"Normal"}:{cls:"",tag:"—"};
  setBcCard("bc-mg","bc-mg-val","bc-mg-tag",masaGrasa,"kg",mgC.cls,mgC.tag,animate);
  // Masa Magra (Muscular) = peso - masa grasa
  let musculo=null;
  if(peso&&masaGrasa){musculo=parseFloat((peso-masaGrasa).toFixed(1))}
  const mmC=mmClass(musculo,peso);
  setBcCard("bc-mm","bc-mm-val","bc-mm-tag",musculo,"kg",mmC.cls,mmC.tag,animate);
  // Timestamp
  const tsEl=G("bc-ts");
  if(tsEl){
    const hasData=imcVal||grasa||musculo;
    if(hasData&&f._updated){
      const d=new Date(f._updated);
      const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      tsEl.textContent=`Actualizado ${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
      tsEl.style.display="block";
    } else if(!hasData){
      tsEl.textContent="El Dr. actualizará estos datos";
      tsEl.style.display="block";
    } else {tsEl.style.display="none"}
  }
}
/* ── ADMIN BODY COMP ── */
function renderAdmAdhHist(pid){
  const wrap=G("adm-adh-hist");if(!wrap)return;
  const adh=DB.adh(pid);
  // Build 8-week windows (Mon→Sun), most recent first
  const weeks=[];
  const now=new Date();
  const day=now.getDay(); // 0=Sun
  // Find most recent Monday
  const thisMon=new Date(now);
  thisMon.setDate(now.getDate()-(day===0?6:day-1));
  thisMon.setHours(0,0,0,0);
  for(let w=0;w<8;w++){
    const mon=new Date(thisMon);
    mon.setDate(thisMon.getDate()-w*7);
    const days=[];
    for(let d=0;d<7;d++){
      const dd=new Date(mon);dd.setDate(mon.getDate()+d);
      const k=dd.toISOString().slice(0,10);
      days.push({k,st:adh[k]||"none"});
    }
    const done=days.filter(d=>d.st==="done").length;
    const part=days.filter(d=>d.st==="part").length;
    const miss=days.filter(d=>d.st==="miss").length;
    const total=done+part+miss;
    const pct=total?Math.round(((done+part*0.5)/total)*100):null;
    const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const lbl=w===0?"Esta sem":w===1?"Sem -1":`${mon.getDate()} ${M[mon.getMonth()]}`;
    weeks.push({lbl,days,done,part,miss,total,pct});
  }

  if(weeks.every(w=>w.total===0)){
    wrap.innerHTML=`<div style="text-align:center;padding:12px;font-family:'Inter',sans-serif;font-size:10px;color:var(--muted)">Sin datos de adherencia</div>`;
    return;
  }

  wrap.innerHTML=weeks.map(({lbl,days,pct})=>{
    const pctVal=pct!==null?pct:0;
    const col=pctVal>=80?"#2eab65":pctVal>=50?"#e8960c":"#dd4444";
    const colFaded=pctVal>=80?"rgba(46,171,101,.12)":pctVal>=50?"rgba(232,150,12,.12)":"rgba(221,68,68,.12)";
    const dayDots=days.map(d=>{
      const bg=d.st==="done"?"#2eab65":d.st==="part"?"#e8960c":d.st==="miss"?"rgba(221,68,68,.5)":"rgba(255,255,255,.05)";
      return`<div class="adh-hist-day" style="background:${bg}" title="${d.k}"></div>`;
    }).join("");
    const pctStr=pct!==null?pctVal+"%":"—";
    return`<div class="adh-hist-row">
      <div class="adh-hist-lbl">${lbl}</div>
      <div class="adh-hist-days">${dayDots}</div>
      <div class="adh-hist-bar-wrap" style="max-width:60px">
        <div class="adh-hist-bar-fill" style="width:${pctVal}%;background:${col}"></div>
      </div>
      <div class="adh-hist-pct" style="color:${col}">${pctStr}</div>
    </div>`;
  }).join("");
}

function renderAdminBodyComp(pid){
  const pt=DB.pt(pid);if(!pt)return;
  const f=pt.ficha||{};
  const prog=DB.prog(pid);
  // FIX: mismo criterio que renderBodyComp — usar el peso más reciente entre ficha y prog
  const _sortedProg=prog.length?[...prog].sort((a,b)=>new Date(b.date)-new Date(a.date)):[];
  const _latestEntry=_sortedProg[0]||null;
  const _fichaW=parseFloat(f.peso)||null;
  const _fichaDate=f._updated?new Date(f._updated):null;
  const _progDate=_latestEntry?new Date(_latestEntry.date):null;
  const peso=(_latestEntry&&(!_fichaDate||_progDate>_fichaDate))
    ?_latestEntry.weight
    :(_fichaW||(_latestEntry?_latestEntry.weight:(pt.weight||null)));
  const altura=parseFloat(f.altura)||null;
  const grasa=parseFloat(f.grasa)||null;
  let imcVal=null;if(peso&&altura){imcVal=peso/((altura/100)**2)}
  const imcC=imcClass(imcVal);
  setBcCard("ptd-bc-imc","ptd-bc-imc-val","ptd-bc-imc-tag",imcVal,"imc",imcC.cls,imcC.tag,true);
  const gcC=gcClass(grasa);
  setBcCard("ptd-bc-gc","ptd-bc-gc-val","ptd-bc-gc-tag",grasa,"%",gcC.cls,gcC.tag,true);
  let masaGrasa=null;if(peso&&grasa){masaGrasa=parseFloat((peso*(grasa/100)).toFixed(1))}
  const mgC=masaGrasa?{cls:"bc-red",tag:masaGrasa>(peso||0)*0.35?"Alto":"Normal"}:{cls:"",tag:"—"};
  setBcCard("ptd-bc-mg","ptd-bc-mg-val","ptd-bc-mg-tag",masaGrasa,"kg",mgC.cls,mgC.tag,true);
  let musculo=null;if(peso&&masaGrasa){musculo=parseFloat((peso-masaGrasa).toFixed(1))}
  const mmC=mmClass(musculo,peso);
  setBcCard("ptd-bc-mm","ptd-bc-mm-val","ptd-bc-mm-tag",musculo,"kg",mmC.cls,mmC.tag,true);
  const tsEl=G("ptd-bc-ts");if(!tsEl)return;
  const hasData=imcVal||grasa||musculo;
  if(hasData&&f._updated){
    const d=new Date(f._updated),M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    tsEl.textContent=`Actualizado ${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
  } else { tsEl.textContent="Sin datos de composición en ficha"; }
  tsEl.style.display="block";
}

/* ══════════════════════════════════════
   FEATURE 1 — HISTORIAL COMPOSICIÓN
══════════════════════════════════════ */
