// FIX Bug17: helper de escape HTML para prevenir XSS
function _e(s){if(s==null)return"";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}

/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Ficha clinica (render + modal)
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

/* ── RENDER: muestra la ficha en el panel admin del paciente ── */
function renderFicha(pt){
  const f=pt.ficha||{};
  const _progAll=DB.prog(pt.id)||[];
  const _progSorted=[..._progAll].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const _deltaKg=_progSorted.length>=2?parseFloat((_progSorted[_progSorted.length-1].weight-_progSorted[0].weight).toFixed(1)):null;
  const _deltaColor=_deltaKg!==null?weightDeltaColor(_deltaKg,pt.goal,f,_progSorted.length?_progSorted[_progSorted.length-1].weight:f.peso).color:"var(--muted)";
  const _deltaStr=_deltaKg!==null?((_deltaKg>0?"+":"")+_deltaKg+" kg"):"—";
  const edadStr=f.edad?f.edad+" años":(f.nacimiento?calcEdadFromNac(f.nacimiento)+" años":"—");
  const _h=parseDecimal(f.altura),_w=parseDecimal(f.peso);
  const imcVal=(_h>0&&_w>0)?(_w/((_h/100)**2)):null;
  const imcStr=imcVal?imcVal.toFixed(1):"—";
  const imcCat=imcVal?(imcVal<18.5?"Bajo peso":imcVal<25?"Normal":imcVal<30?"Sobrepeso":"Obesidad"):"";

  const clinico=[
    ["Patologías",   f.patologias  ],
    ["Lesiones",     f.lesiones    ],
    ["Alergias / intolerancias", f.restricciones],
    ["Medicamentos", f.medicamentos],
  ].filter(([,v])=>v&&v.trim()).map(([k,v])=>[k,_e(v)]); // FIX Bug17a: escapar datos clínicos

  const antro=[
    ["Fecha nac.",  f.nacimiento?fmtDate(f.nacimiento):"—"],
    ["Edad",        edadStr],
    ["Talla",       f.altura?f.altura+" cm":"—"],
    ["Peso ini.",   (f.pesoInicial?f.pesoInicial+" kg":"—")+(f.fechaInicial?" · "+fmtDate(f.fechaInicial):"")],
    ["Peso actual", f.peso?f.peso+" kg":"—"],
    ["Cambio",      `<span style="color:${_deltaColor};font-weight:700">${_deltaStr}</span>`],
    ["% Grasa",     f.grasa?f.grasa+"%":"—"],
    ["IMC",         imcVal?`${imcStr} <span style="font-size:10px;color:var(--muted)">${imcCat}</span>`:"—"], // NOTE Bug23: HTML intencional — imcStr y imcCat son valores calculados (números+texto estático), no datos de usuario
    ["Obj. peso",   f.pesoMeta?f.pesoMeta+" kg":"—"],
    ["Objetivo",    pt.goal||"—"],
  ].filter(([,v])=>v!=="—"&&v);

  const notaStr=_e((f.notas||"").trim()); // FIX Bug17a: escapar notas del Dr.
  const hasAntro=antro.length>0, hasClin=clinico.length>0, hasNotas=!!notaStr;

  if(!hasAntro&&!hasClin&&!hasNotas){
    G("ptd-ficha").innerHTML=`
      <div style="text-align:center;padding:14px 8px">
        <div style="font-size:28px;margin-bottom:8px">📋</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--txt2);margin-bottom:4px">Ficha incompleta</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:12px;line-height:1.5">Completa los datos del paciente para activar todas las funcionalidades.</div>
        <button class="btn btn-gold" style="font-size:11px;padding:7px 16px" onclick="showM('m-ficha')">
          <span class="iq-ic sm" data-ic="edit"></span> Completar datos
        </button>
      </div>`;
    paintIcons(G("ptd-ficha"));
    return;
  }

  let html="";

  if(hasAntro){
    html+=`<div class="ficha-section-lbl">Antropométrico</div><div class="ficha-grid">`;
    html+=antro.map(([k,v])=>`<div class="ficha-cell"><div class="ficha-cell-k">${k}</div><div class="ficha-cell-v">${v}</div></div>`).join("");
    html+=`</div>`;
  }
  if(hasClin){
    html+=`<div class="ficha-section-lbl" style="margin-top:12px">Clínico</div><div class="ficha-grid">`;
    html+=clinico.map(([k,v])=>`<div class="ficha-cell wide"><div class="ficha-cell-k">${k}</div><div class="ficha-cell-v">${v}</div></div>`).join("");
    html+=`</div>`;
  }
  if(hasNotas){
    html+=`<div class="ficha-section-lbl" style="margin-top:12px">Notas</div><div class="ficha-grid"><div class="ficha-cell wide"><div class="ficha-cell-k">Notas del Dr.</div><div class="ficha-cell-v">${notaStr}</div></div></div>`;
  }

  G("ptd-ficha").innerHTML=html;
}

/* ── ABRIR MODAL: solo datos antropométricos + objetivo ── */
function showFichaModal(){
  const pt=DB.pt(S.selPid);if(!pt)return;const f=pt.ficha||{};
  [["fc-altura",f.altura],["fc-peso",f.peso],["fc-pesoMeta",f.pesoMeta],["fc-grasa",f.grasa]]
    .forEach(([id,v])=>{if(G(id))G(id).value=v||"";});
  const goalSel=G("fc-goal");
  if(goalSel)goalSel.value=pt.goal||"Recomposición corporal";
  fcUpdateImc();
}

/* ── IMC automático en tiempo real ── */
function fcUpdateImc(){
  const h=parseDecimal(G("fc-altura")?.value);
  const w=parseDecimal(G("fc-peso")?.value);
  const valEl=G("fc-imc-val"),unitEl=G("fc-imc-unit"),badge=G("fc-imc-display");
  if(!badge)return;
  if(h>0&&w>0){
    const imc=w/((h/100)**2);
    const cat=imc<18.5?"Bajo peso":imc<25?"Normal":imc<30?"Sobrepeso":"Obesidad";
    if(valEl)valEl.textContent=imc.toFixed(1);
    if(unitEl)unitEl.textContent=cat;
    badge.classList.add("has-val");
  }else{
    if(valEl)valEl.textContent="—";
    if(unitEl)unitEl.textContent="";
    badge.classList.remove("has-val");
  }
}

/* ── GUARDAR: actualiza solo antropométricos, preserva datos clínicos ── */
function saveFicha(){
  const existing=DB.pt(S.selPid)?.ficha||{};
  const _firstProg=(()=>{const log=DB.prog(S.selPid);if(!log.length)return null;return[...log].sort((a,b)=>new Date(a.date)-new Date(b.date))[0]})();
  const _pesoInicial=existing.pesoInicial||((_firstProg)?String(_firstProg.weight):"");
  const _fechaInicial=existing.fechaInicial||((_firstProg)?_firstProg.date:"");

  const ficha={
    // Preservar datos clínicos — no editables en este modal
    nacimiento:   existing.nacimiento||"",
    edad:         existing.edad||null,
    patologias:   existing.patologias||"",
    restricciones:existing.restricciones||"",
    lesiones:     existing.lesiones||"",
    medicamentos: existing.medicamentos||"",
    notas:        existing.notas||"",
    // Datos antropométricos — normalizar coma→punto
    altura:    G("fc-altura").value.replace(",","."),
    peso:      G("fc-peso").value.replace(",","."),
    pesoMeta:  (G("fc-pesoMeta")?.value||"").replace(",","."),
    grasa:     G("fc-grasa").value.replace(",","."),
    // Histórico protegido
    pesoInicial:  _pesoInicial,
    fechaInicial: _fechaInicial,
    _updated: new Date().toISOString()
  };

  const newGoal=G("fc-goal")?.value;
  if(newGoal)DB.updPt(S.selPid,{goal:newGoal});
  DB.updPt(S.selPid,{ficha});

  // Snapshot para gráfica de composición
  if(ficha.grasa||ficha.peso){
    DB.addFichaSnap(S.selPid,{date:ficha._updated,peso:ficha.peso,grasa:ficha.grasa});
  }

  // Sincronizar al log de progreso para que la gráfica de peso se actualice
  if(ficha.peso){
    const newW=parseFloat(ficha.peso);
    const newFat=ficha.grasa?parseFloat(ficha.grasa):null;
    if(!isNaN(newW)&&newW>10){
      const log=DB.prog(S.selPid);
      const sorted=[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));
      const lastEntry=sorted.length?sorted[sorted.length-1]:null;
      if(!lastEntry||Math.abs(lastEntry.weight-newW)>=0.1){
        log.push({date:ficha._updated,weight:newW,fat:newFat,note:"Medición clínica"});
        DB.saveProg(S.selPid,log);
      }
      DB.updPt(S.selPid,{weight:newW});
    }
  }

  renderFicha(DB.pt(S.selPid));
  renderAdminBodyComp(S.selPid);
  closeM("m-ficha");
  admTab('res');
  toast("✅","Medidas guardadas");
}

/* ── CREATE PATIENT ── */
