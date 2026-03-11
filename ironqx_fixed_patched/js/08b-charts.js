/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   GC chart, sparkline
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

/* ── Helper: construye timeline unificada de peso + %grasa
   fusionando fichaHistory (mediciones clínicas completas)
   y prog (registros de peso, con fat opcional).
   Si dos entradas caen en el mismo día, fichaHistory tiene prioridad.
   Devuelve array ordenado cronológicamente con: { date, peso, grasa } ──*/
function _buildCompositionHistory(pid){
  var fHist = DB.fichaHistory(pid) || [];
  var prog  = DB.prog(pid) || [];

  // índice de fichaHistory por fecha (YYYY-MM-DD)
  var fichaByDate = {};
  fHist.forEach(function(h){
    var k = h.date ? h.date.slice(0,10) : null;
    if(k) fichaByDate[k] = h;
  });

  // prog entries que NO están ya cubiertas por fichaHistory
  var merged = fHist.slice(); // copia
  prog.forEach(function(p){
    var k = p.date ? p.date.slice(0,10) : null;
    if(!k) return;
    if(!fichaByDate[k]){
      // añadir como entrada de peso (grasa puede ser null)
      merged.push({
        date:  p.date,
        peso:  p.weight != null ? String(p.weight) : null,
        grasa: p.fat    != null ? String(p.fat)    : null,
        _fromProg: true
      });
    }
  });

  // ordenar cronológicamente
  merged.sort(function(a,b){ return new Date(a.date) - new Date(b.date); });
  return merged;
}

function drawGcChart(pid, canvasId, sId, dId, cId, slId, cardId){
  var hist = _buildCompositionHistory(pid); // FIX: incluye prog + fichaHistory
  var sl=G(slId), card=G(cardId);
  if(!sl||!card)return;
  // Para el gráfico de %GC necesitamos al menos 2 entradas con grasa
  var valid=hist.filter(function(h){return parseFloat(h.grasa);});
  if(valid.length<1){sl.style.display="none";card.style.display="none";return;}
  sl.style.display="flex"; card.style.display="block";
  if(valid.length<2){return;} // show section but no chart yet
  var chrono=valid.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  var n=chrono.length;
  var M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  var canvas=G(canvasId);
  if(!canvas)return;
  var dpr=window.devicePixelRatio||1;
  var _pw=canvas.parentElement?canvas.parentElement.getBoundingClientRect().width||canvas.parentElement.clientWidth:0;
  var cssW=_pw>10?_pw:(window.innerWidth-28)||320;
  var cssH=120;
  canvas.style.width=cssW+"px"; canvas.style.height=cssH+"px";
  canvas.width=cssW*dpr; canvas.height=cssH*dpr;
  var ctx=canvas.getContext("2d"); ctx.scale(dpr,dpr);
  var W=cssW, H=cssH;
  var gcVals=chrono.map(function(h){return parseFloat(h.grasa)||null;});
  var filled=gcVals.filter(function(v){return v!==null;});
  if(!filled.length)return;
  var mn=Math.min.apply(null,filled)-2, mx=Math.max.apply(null,filled)+2;
  var PL=38,PR=10,PT=14,PB=26;
  var cW=W-PL-PR, cH=H-PT-PB;
  var tx=function(i){return PL+(i/(n-1))*cW;};
  var ty=function(v){return PT+cH-((v-mn)/(mx-mn))*cH;};
  ctx.clearRect(0,0,W,H);
  // grid
  ctx.strokeStyle="rgba(255,255,255,0.04)"; ctx.lineWidth=1;
  [0,.5,1].forEach(function(t){
    var y=PT+cH*(1-t);
    ctx.beginPath(); ctx.moveTo(PL,y); ctx.lineTo(W-PR,y); ctx.stroke();
    ctx.fillStyle="#3a3f4e"; ctx.font="500 10px 'Inter',sans-serif"; ctx.textAlign="right";
    ctx.fillText((mn+t*(mx-mn)).toFixed(1)+"%",PL-4,y+3.5);
  });
  // x labels
  ctx.fillStyle="#3a3f4e"; ctx.font="600 9px 'Barlow',sans-serif"; ctx.textAlign="center";
  chrono.forEach(function(h,i){
    var d=new Date(h.date);
    ctx.fillText(d.getDate()+"/"+(d.getMonth()+1), tx(i), H-5);
  });
  // fill area
  var grad=ctx.createLinearGradient(0,PT,0,H-PB);
  grad.addColorStop(0,"rgba(232,93,117,0.22)");
  grad.addColorStop(.7,"rgba(232,93,117,0.04)");
  grad.addColorStop(1,"rgba(232,93,117,0)");
  ctx.beginPath(); ctx.moveTo(tx(0),ty(gcVals[0]));
  for(var i=1;i<n;i++){
    if(gcVals[i]==null)continue;
    var cx2=(tx(i-1)+tx(i))/2;
    ctx.bezierCurveTo(cx2,ty(gcVals[i-1]),cx2,ty(gcVals[i]),tx(i),ty(gcVals[i]));
  }
  ctx.lineTo(tx(n-1),H-PB); ctx.lineTo(tx(0),H-PB); ctx.closePath();
  ctx.fillStyle=grad; ctx.fill();
  // line
  ctx.beginPath(); ctx.moveTo(tx(0),ty(gcVals[0]));
  for(var i=1;i<n;i++){
    if(gcVals[i]==null)continue;
    var cx2=(tx(i-1)+tx(i))/2;
    ctx.bezierCurveTo(cx2,ty(gcVals[i-1]),cx2,ty(gcVals[i]),tx(i),ty(gcVals[i]));
  }
  ctx.strokeStyle=FAT_COLOR; ctx.lineWidth=2.5; ctx.lineJoin="round"; ctx.lineCap="round";
  ctx.shadowColor="rgba(232,93,117,0.4)"; ctx.shadowBlur=8; ctx.stroke(); ctx.shadowBlur=0;
  // dots + value labels
  gcVals.forEach(function(v,i){
    if(v==null)return;
    ctx.beginPath(); ctx.arc(tx(i),ty(v),7,0,Math.PI*2);
    ctx.fillStyle="rgba(232,93,117,0.12)"; ctx.fill();
    ctx.beginPath(); ctx.arc(tx(i),ty(v),4,0,Math.PI*2);
    ctx.fillStyle=FAT_COLOR; ctx.fill();
    ctx.strokeStyle="#0a0a0b"; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=FAT_COLOR; ctx.font="700 9px 'Inter',sans-serif"; ctx.textAlign="center";
    ctx.fillText(v.toFixed(1)+"%", tx(i), ty(v)-10);
  });
  // stats
  var first=filled[0], last=filled[filled.length-1];
  var diff=parseFloat((last-first).toFixed(1));
  var es=G(sId), ed=G(dId), ec=G(cId);
  if(es)es.textContent=first.toFixed(1)+"%";
  if(ec)ec.textContent=last.toFixed(1)+"%";
  if(ed){ed.textContent=(diff>0?"+":"")+diff+"%"; ed.style.color=diff<=0?"var(--green)":"var(--red)";}
}
