/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Comparison/evolution chart
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function drawCompChart(pid, opts){
  // opts allows reuse for admin view — defaults to patient IDs
  opts=opts||{};
  var gcCanvasId = opts.gcCanvasId||'chart-gc';
  var statsS     = opts.statsS    ||'gc-s';
  var statsD     = opts.statsD    ||'gc-d';
  var statsC     = opts.statsC    ||'gc-c';
  var listId     = opts.listId    ||'comp-snap-list';
  var cardId     = opts.cardId    ||'bc-hist-card';
  var slId       = opts.slId      ||'bc-hist-sl';

  const hist=DB.fichaHistory(pid);
  const card=G(cardId),sl=G(slId),list=G(listId);
  if(!card||!sl||!list)return;
  const valid=hist.filter(function(h){return parseFloat(h.grasa)||parseFloat(h.peso);});
  if(valid.length<1){card.style.display="none";sl.style.display="none";return;}
  if(valid.length<2){
    card.style.display="block";sl.style.display="flex";
    list.innerHTML='<div style="text-align:center;padding:18px 0;color:var(--muted);font-size:12px">Guarda una segunda medición para ver la evolución</div>';
    return;
  }
  card.style.display="block";sl.style.display="flex";
  const M=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const chrono=valid.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);}); // oldest first always
  const n=chrono.length;

  /* ── Draw % Grasa chart ── */
  var canvas=G(gcCanvasId);
  if(canvas){
    var gcVals=chrono.map(function(h){return parseFloat(h.grasa)||null;});
    var filled=gcVals.filter(function(v){return v!==null;});
    if(filled.length>=2){
      var dpr=window.devicePixelRatio||1;
      var _pw=canvas.parentElement?canvas.parentElement.getBoundingClientRect().width||canvas.parentElement.clientWidth:0;
  var cssW=_pw>10?_pw:(window.innerWidth-28)||320;
      var cssH=120;
      canvas.style.width=cssW+"px"; canvas.style.height=cssH+"px";
      canvas.width=cssW*dpr; canvas.height=cssH*dpr;
      var ctx=canvas.getContext("2d"); ctx.scale(dpr,dpr);
      var W=cssW, H=cssH;
      var mn=Math.min.apply(null,filled)-2, mx=Math.max.apply(null,filled)+2;
      var PL=38, PR=10, PT=14, PB=26;
      var cW=W-PL-PR, cH=H-PT-PB;
      var tx=function(i){return PL+(i/(n-1))*cW;};
      var ty=function(v){return PT+cH-((v-mn)/(mx-mn))*cH;};
      ctx.clearRect(0,0,W,H);
      /* grid */
      ctx.strokeStyle="rgba(255,255,255,0.04)"; ctx.lineWidth=1;
      [0,.5,1].forEach(function(t){
        var y=PT+cH*(1-t);
        ctx.beginPath(); ctx.moveTo(PL,y); ctx.lineTo(W-PR,y); ctx.stroke();
        ctx.fillStyle="#3a3f4e"; ctx.font="500 10px 'Inter',sans-serif"; ctx.textAlign="right";
        ctx.fillText((mn+t*(mx-mn)).toFixed(1)+"%",PL-4,y+3.5);
      });
      /* x labels */
      ctx.fillStyle="#3a3f4e"; ctx.font="600 9px 'Barlow',sans-serif"; ctx.textAlign="center";
      chrono.forEach(function(h,i){
        var d=new Date(h.date);
        ctx.fillText(d.getDate()+"/"+(d.getMonth()+1), tx(i), H-5);
      });
      /* area fill */
      var grad=ctx.createLinearGradient(0,PT,0,H-PB);
      grad.addColorStop(0,"rgba(232,93,117,0.22)");
      grad.addColorStop(.7,"rgba(232,93,117,0.04)");
      grad.addColorStop(1,"rgba(232,93,117,0)");
      ctx.beginPath(); ctx.moveTo(tx(0),ty(gcVals[0]));
      for(var i=1;i<n;i++){
        if(gcVals[i]==null)continue;
        var cx2=(tx(i-1)+tx(i))/2;
        ctx.bezierCurveTo(cx2,ty(gcVals[i-1]||gcVals[i]),cx2,ty(gcVals[i]),tx(i),ty(gcVals[i]));
      }
      ctx.lineTo(tx(n-1),H-PB); ctx.lineTo(tx(0),H-PB); ctx.closePath();
      ctx.fillStyle=grad; ctx.fill();
      /* line */
      ctx.beginPath(); ctx.moveTo(tx(0),ty(gcVals[0]));
      for(var i=1;i<n;i++){
        if(gcVals[i]==null)continue;
        var cx2=(tx(i-1)+tx(i))/2;
        ctx.bezierCurveTo(cx2,ty(gcVals[i-1]||gcVals[i]),cx2,ty(gcVals[i]),tx(i),ty(gcVals[i]));
      }
      ctx.strokeStyle=FAT_COLOR; ctx.lineWidth=2.5; ctx.lineJoin="round"; ctx.lineCap="round";
      ctx.shadowColor="rgba(232,93,117,0.45)"; ctx.shadowBlur=8; ctx.stroke(); ctx.shadowBlur=0;
      /* dots + labels */
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
      /* stats */
      var first=filled[0], last=filled[filled.length-1], diff=parseFloat((last-first).toFixed(1));
      var gs=G(statsS), gd=G(statsD), gc_=G(statsC);
      if(gs)gs.textContent=first.toFixed(1)+"%";
      if(gc_)gc_.textContent=last.toFixed(1)+"%";
      if(gd){gd.textContent=(diff>0?"+":"")+diff+"%"; gd.style.color=diff<=0?"var(--green)":"var(--red)";}
    }
  }

  /* ── Snapshot table (scrollable fixed-height card) ── */
  var delta=function(cur,prev,lowerBetter){
    if(cur==null||prev==null)return"";
    var d=parseFloat((cur-prev).toFixed(1));
    if(d===0)return'<span class="csr-delta neu">=</span>';
    var up=d>0, good=lowerBetter?!up:up;
    return'<span class="csr-delta '+(good?"neg":"pos")+'">'+(up?"+":"")+d+'</span>';
  };
  // Sticky header
  var hdr='<div class="snap-scroll-hd">';
  hdr+='<div class="fxs tm" style="text-transform:uppercase;letter-spacing:.5px">Fecha</div>';
  hdr+='<div class="fxs" style="color:#4f8ef7;text-align:right">PESO</div>';
  hdr+='<div class="fxs" style="color:#e85d75;text-align:right">%GC</div>';
  hdr+='<div class="fxs tm" style="text-align:right">KG GRS</div>';
  hdr+='<div class="fxs" style="color:var(--green);text-align:right">KG MAGRA</div>';
  hdr+='</div>';
  // Scrollable body rows
  // Peso: lowerBetter depends on patient goal
  var _admPt=DB.pt(pid);
  var _pesoLB=weightGoalDir(_admPt?.goal||"",_admPt?.ficha)==="up"?false:true; // volumen=false, corte=true
  var rows='<div class="snap-scroll-body">';
  chrono.forEach(function(h,i){
    var prev=i>0?chrono[i-1]:null;
    var d=new Date(h.date);
    var peso=parseFloat(h.peso)||null;
    var gc=parseFloat(h.grasa)||null;
    var mg=peso&&gc?parseFloat((peso*gc/100).toFixed(1)):null;
    var mm=peso&&mg?parseFloat((peso-mg).toFixed(1)):null;
    var pp=prev?parseFloat(prev.peso)||null:null;
    var pg=prev?parseFloat(prev.grasa)||null:null;
    var pm=prev&&pp&&pg?parseFloat((pp*pg/100).toFixed(1)):null;
    var pmm=prev&&pp&&pm?parseFloat((pp-pm).toFixed(1)):null;
    var isLast=(i===chrono.length-1);
    rows+="<div class='snap-row"+(isLast?" snap-latest":"")+"'>";
    rows+="<div class='fxs tm'>"+d.getDate()+" "+M[d.getMonth()]+" "+String(d.getFullYear()).slice(2)+"</div>";
    rows+="<div style='text-align:right'><b style='color:#4f8ef7;font-size:14px'>"+(peso!==null?peso:"—")+"</b> "+delta(peso,pp,_pesoLB)+"</div>";
    rows+="<div style='text-align:right'><b style='color:#e85d75;font-size:14px'>"+(gc!==null?gc+"%":"—")+"</b> "+delta(gc,pg,true)+"</div>";
    rows+="<div style='text-align:right'><b style='font-size:14px'>"+(mg!==null?mg:"—")+"</b> "+delta(mg,pm,true)+"</div>";
    rows+="<div style='text-align:right'><b style='color:var(--green);font-size:14px'>"+(mm!==null?mm:"—")+"</b> "+delta(mm,pmm,false)+"</div>";
    rows+="</div>";
  });
  rows+='</div>';
  list.innerHTML='<div class="snap-scroll-card">'+hdr+rows+'</div>';
  // Auto-scroll to latest (bottom) entry
  var body=list.querySelector('.snap-scroll-body');
  if(body) setTimeout(function(){body.scrollTop=body.scrollHeight;},60);
}


/* ══════════════════════════════════════
   FEATURE 2 — DONUT ADHERENCIA TOTAL
══════════════════════════════════════ */
