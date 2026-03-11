// FIX Bug17: helper de escape HTML para prevenir XSS
function _e(s){if(s==null)return"";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}

/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Macros card, form, calculator
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function renderMacrosCard(pid){
  const wrap=G("macros-card-wrap");if(!wrap)return;
  const m=DB.macros(pid);
  if(!m||(!m.kcal&&!m.prot)){wrap.innerHTML="";return}

  const prot=m.prot||0,carbs=m.carbs||0,fat=m.fat||0;
  const kcalFromMacros=(prot*4)+(carbs*4)+(fat*9);
  const total=prot+carbs+fat||1;
  const pctProt=Math.round((prot/total)*100);
  const pctCarbs=Math.round((carbs/total)*100);
  const pctFat=100-pctProt-pctCarbs;

  wrap.innerHTML=`
  <div class="sl" style="margin-top:4px"><span class="iq-ic gold" data-ic="activity" style="width:14px;height:14px"></span>Macros de referencia</div>
  <div class="macros-card">

    <!-- KCAL banner -->
    <div class="mcrd-kcal-row">
      <div>
        <div class="macros-kcal">${m.kcal||Math.round(kcalFromMacros)}</div>
        <div class="macros-kcal-unit">kcal / día</div>
      </div>
      ${m.nota?`<div class="macros-nota">${_e(m.nota)}</div>`:'<div class="macros-nota">Referencial</div>'}
    </div>

    <!-- DONUT + legend side by side -->
    <div class="mcrd-body">
      <div class="mcrd-donut-wrap">
        <canvas id="macros-donut-canvas" width="100" height="100" style="width:100px;height:100px"></canvas>
      </div>
      <div class="mcrd-legend">
        <div class="mcrd-leg-row">
          <div class="mcrd-leg-dot prot"></div>
          <div class="mcrd-leg-info">
            <span class="mcrd-leg-lbl">Proteína</span>
            <span class="mcrd-leg-val prot">${prot}g <span class="mcrd-leg-pct">${pctProt}%</span></span>
          </div>
        </div>
        <div class="mcrd-leg-row">
          <div class="mcrd-leg-dot carb"></div>
          <div class="mcrd-leg-info">
            <span class="mcrd-leg-lbl">Carbohidratos</span>
            <span class="mcrd-leg-val carb">${carbs}g <span class="mcrd-leg-pct">${pctCarbs}%</span></span>
          </div>
        </div>
        <div class="mcrd-leg-row">
          <div class="mcrd-leg-dot fat"></div>
          <div class="mcrd-leg-info">
            <span class="mcrd-leg-lbl">Grasas</span>
            <span class="mcrd-leg-val fat">${fat}g <span class="mcrd-leg-pct">${pctFat}%</span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Disclaimer -->
    <div class="mcrd-disclaimer">
      <span style="font-size:11px;opacity:.7">⚠️</span>
      Valores de referencia · El Dr. Arévalo los ajusta según tu respuesta individual y tu plan específico
    </div>
  </div>`;

  paintIcons(wrap);
  // Draw donut after DOM is ready
  requestAnimationFrame(()=>_drawMacrosDonut(prot,carbs,fat));
}

function _drawMacrosDonut(prot,carbs,fat){
  const canvas=G("macros-donut-canvas");if(!canvas)return;
  const dpr=window.devicePixelRatio||1;
  const SIZE=100;
  canvas.width=SIZE*dpr;canvas.height=SIZE*dpr;
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  const cx=SIZE/2,cy=SIZE/2,r=38,lw=11;
  const total=prot+carbs+fat||1;

  // Colors matching existing CSS vars
  const segments=[
    {val:prot, color:"#5577ee", glow:"rgba(85,119,238,.5)"},   // blue – protein
    {val:carbs,color:"#e8960c", glow:"rgba(232,150,12,.5)"},   // amber – carbs
    {val:fat,  color:"#2eab65", glow:"rgba(46,171,101,.5)"},   // green – fat
  ].filter(s=>s.val>0);

  let animProg=0;
  const animDur=600,animStart=performance.now();

  function draw(ts){
    animProg=Math.min(1,(ts-animStart)/animDur);
    const ease=1-Math.pow(1-animProg,3);
    ctx.clearRect(0,0,SIZE,SIZE);
    // Track
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle="rgba(255,255,255,.05)";ctx.lineWidth=lw;ctx.stroke();
    // Segments
    let angle=-Math.PI/2;
    segments.forEach(seg=>{
      const fullSweep=(seg.val/total)*Math.PI*2;
      const sweep=fullSweep*ease;
      ctx.beginPath();ctx.arc(cx,cy,r,angle,angle+sweep);
      ctx.strokeStyle=seg.color;ctx.lineWidth=lw;ctx.lineCap="round";
      ctx.shadowColor=seg.glow;ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;
      angle+=fullSweep;
    });
    // Center label
    ctx.fillStyle="rgba(236,238,242,.9)";
    ctx.font=`700 9px 'Inter',sans-serif`;
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText("MACROS",cx,cy-6);
    ctx.fillStyle="rgba(212,146,14,.85)";
    ctx.font=`900 13px 'Barlow Condensed',sans-serif`;
    ctx.fillText((total+"g"),cx,cy+7);
    if(animProg<1)requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
function saveMacros(){
  const pid=S.selPid;
  const m={kcal:parseInt(G("mc-kcal").value)||0,prot:parseInt(G("mc-prot").value)||0,carbs:parseInt(G("mc-carbs").value)||0,fat:parseInt(G("mc-fat").value)||0,nota:G("mc-nota").value.trim()};
  DB.saveMacros(pid,m);
  // If viewing as this patient, refresh
  if(S.pid===pid)renderMacrosCard(pid);
  toast("✅","Macros guardados · el paciente los verá en Home");
}
function loadMacrosForm(pid){
  const m=DB.macros(pid);
  const pt=DB.pt(pid);const f=pt?.ficha||{};
  // Pre-fill calculator from ficha always
  if(G("mc-c-peso"))G("mc-c-peso").value=f.peso||"";
  if(G("mc-c-gc"))G("mc-c-gc").value=f.grasa||"";
  if(G("mc-c-alt"))G("mc-c-alt").value=f.altura||"";
  // Set goal dropdown based on patient goal text
  const goalEl=G("mc-c-goal");
  if(goalEl&&pt?.goal){
    const g=pt.goal.toLowerCase();
    if(g.includes("corte")||g.includes("grasa")||g.includes("corte"))goalEl.value="cut_mild";
    else if(g.includes("volumen")||g.includes("masa")||g.includes("muscul"))goalEl.value="bulk_mild";
    else if(g.includes("recomp"))goalEl.value="maint";
    else goalEl.value="maint";
  }
  if(m&&(m.kcal||m.prot)){
    // Macros already saved — load them
    if(G("mc-kcal"))G("mc-kcal").value=m.kcal||"";
    if(G("mc-prot"))G("mc-prot").value=m.prot||"";
    if(G("mc-carbs"))G("mc-carbs").value=m.carbs||"";
    if(G("mc-fat"))G("mc-fat").value=m.fat||"";
    if(G("mc-nota"))G("mc-nota").value=m.nota||"";
    // Macros are confirmed — hide the "starting point" banner
    const b=G("mc-ref-banner");if(b)b.style.display="none";
  } else {
    // No saved macros — auto-calculate as starting point
    const peso=parseFloat(f.peso)||0;
    const gc=parseFloat(f.grasa)||0;
    const alt=parseFloat(f.altura)||0;
    const act=1.55; // default moderado
    const goalKey=goalEl?.value||"maint";
    if(peso&&alt){
      const age=f.edad||f.nacimiento?calcEdadFromNac(f.nacimiento):30;
      const bmr=10*peso+6.25*alt-5*(parseInt(age)||30)+5;
      const tdee=Math.round(bmr*act);
      const adj={cut:-500,cut_mild:-300,maint:0,bulk_mild:200,bulk:400}[goalKey]||0;
      const kcal=tdee+adj;
      const mm=gc>0?parseFloat((peso*(1-gc/100)).toFixed(1)):peso*0.8;
      const prot=Math.round(mm*2.2);
      const fat=Math.round(peso*1.0);
      const carbs=Math.max(0,Math.round((kcal-(prot*4)-(fat*9))/4));
      if(G("mc-kcal"))G("mc-kcal").value=kcal;
      if(G("mc-prot"))G("mc-prot").value=prot;
      if(G("mc-carbs"))G("mc-carbs").value=carbs;
      if(G("mc-fat"))G("mc-fat").value=fat;
      if(G("mc-nota"))G("mc-nota").value="";
    }
  }
  if(G("mc-calc-preview"))G("mc-calc-preview").style.display="none";
}
function calcMacrosAuto(){
  const peso=parseFloat(G("mc-c-peso")?.value)||0;
  const gc=parseFloat(G("mc-c-gc")?.value)||0;
  const alt=parseFloat(G("mc-c-alt")?.value)||0;
  const act=parseFloat(G("mc-c-act")?.value)||1.55;
  const goalKey=G("mc-c-goal")?.value||"maint";
  if(!peso||!alt){toast("⚠️","Completa peso y altura");return}
  // Mifflin-St Jeor (estimamos hombre por defecto en app clínica)
  const bmr=10*peso+6.25*alt-5*30+5; // edad fija 30 aprox
  const tdee=Math.round(bmr*act);
  const adj={cut:-500,cut_mild:-300,maint:0,bulk_mild:200,bulk:400}[goalKey]||0;
  const kcal=tdee+adj;
  // Proteína alta (2.2g/kg masa magra)
  const mm=gc>0?parseFloat((peso*(1-gc/100)).toFixed(1)):peso*0.8;
  const prot=Math.round(mm*2.2);
  const fat=Math.round(peso*1.0); // 1g/kg
  const carbKcal=kcal-(prot*4)-(fat*9);
  const carbs=Math.max(0,Math.round(carbKcal/4));
  // Fill form
  if(G("mc-kcal"))G("mc-kcal").value=kcal;
  if(G("mc-prot"))G("mc-prot").value=prot;
  if(G("mc-carbs"))G("mc-carbs").value=carbs;
  if(G("mc-fat"))G("mc-fat").value=fat;
  // Show preview
  const prev=G("mc-calc-preview");
  if(prev){
    prev.style.display="block";
    const goalLbl={cut:"Corte agresivo",cut_mild:"Corte moderado",maint:"Mantenimiento",bulk_mild:"Volumen limpio",bulk:"Volumen"}[goalKey];
    prev.innerHTML=`TDEE base: ${tdee} kcal · ${goalLbl}<br>Masa magra est.: ${mm} kg · Prot: ${prot}g · Grasas: ${fat}g · Carbos: ${carbs}g`;
  }
  toast("✅","Macros calculados → revisa y guarda");
}

/* ══════════════════════════════════════
   FEATURE 4 — TIMELINE DE HITOS
══════════════════════════════════════ */
/* ══════════════════════════════════════
   LOGROS — ACHIEVEMENTS SYSTEM
══════════════════════════════════════ */
/* ── helpers compartidos ── */
function _sortedLog(log){return[...log].sort((a,b)=>new Date(a.date)-new Date(b.date));}
function _doneKeys(adh){return Object.keys(adh).filter(k=>adh[k]==="done").sort();}
function _weightDiff(log,pt){
  const s=_sortedLog(log);
  const ini=s.length?s[0].weight:(pt?pt.weight:null);
  const best=s.length?Math.min(...s.map(e=>e.weight)):ini;
  return ini&&best?parseFloat((ini-best).toFixed(1)):0;
}
function _maxStreak(adh){
  const keys=_doneKeys(adh);if(!keys.length)return 0;
  let max=1,cur=1;
  for(let i=1;i<keys.length;i++){
    const prev=new Date(keys[i-1]),cur_=new Date(keys[i]);
    if((cur_-prev)/864e5===1)cur++;else cur=1;
    if(cur>max)max=cur;
  }
  return max;
}

