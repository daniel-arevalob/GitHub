/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Donut adherence chart
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function drawDonut(pid){
  const adh=DB.adh(pid);
  const entries=Object.values(adh);
  const done=entries.filter(v=>v==="done").length;
  const part=entries.filter(v=>v==="part").length;
  const miss=entries.filter(v=>v==="miss").length;
  const total=entries.length||1;
  const pct=Math.round(((done+part*.5)/total)*100);
  const canvas=G("chart-donut");if(!canvas)return;
  const dpr=window.devicePixelRatio||1;
  canvas.width=110*dpr;canvas.height=110*dpr;
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  const cx=55,cy=55,r=44,lw=10;
  ctx.clearRect(0,0,110,110);
  // Background ring
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle="rgba(255,255,255,.05)";ctx.lineWidth=lw;ctx.stroke();
  // Segments
  const segments=[
    {val:done,color:"#2eab65"},
    {val:part*.5,color:"#e8960c"},
    {val:miss,color:"rgba(221,68,68,.5)"}
  ];
  // Animated draw
  let animProg=0;
  const animDur=700,animStart=performance.now();
  const totalSweep=Math.PI*2*((done+part*.5+miss)/total);

  function animateDonut(ts){
    const elapsed=ts-animStart;
    animProg=Math.min(1,elapsed/animDur);
    const ease=1-Math.pow(1-animProg,3);
    ctx.clearRect(0,0,110,110);
    // Background ring
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle="rgba(255,255,255,.05)";ctx.lineWidth=lw;ctx.stroke();
    // Segments animated
    let angle=-Math.PI/2;
    segments.forEach(seg=>{
      if(!seg.val)return;
      const fullSweep=(seg.val/total)*Math.PI*2;
      const sweep=fullSweep*ease;
      ctx.beginPath();ctx.arc(cx,cy,r,angle,angle+sweep);
      ctx.strokeStyle=seg.color;ctx.lineWidth=lw;ctx.lineCap="round";
      ctx.shadowColor=seg.color;ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;
      angle+=fullSweep; // advance by full amount so segments don't overlap at end
    });
    // Center text
    ctx.fillStyle="#eceef2";ctx.font=`900 22px 'Barlow Condensed',sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(Math.round(pct*ease)+"%",cx,cy);
    if(animProg<1)requestAnimationFrame(animateDonut);
    else{
      // Final static draw
      ctx.clearRect(0,0,110,110);
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle="rgba(255,255,255,.05)";ctx.lineWidth=lw;ctx.stroke();
      let a2=-Math.PI/2;
      segments.forEach(seg=>{if(!seg.val)return;const sw=(seg.val/total)*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,a2,a2+sw);ctx.strokeStyle=seg.color;ctx.lineWidth=lw;ctx.lineCap="round";ctx.shadowColor=seg.color;ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;a2+=sw;});
      ctx.fillStyle="#eceef2";ctx.font=`900 22px 'Barlow Condensed',sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(pct+"%",cx,cy);
    }
  }
  requestAnimationFrame(animateDonut);
  // Legend
  const legendEl=G("donut-legend"),pctEl=G("donut-pct");
  if(pctEl)pctEl.textContent=pct+"%";
  if(legendEl)legendEl.innerHTML=[
    {c:"var(--green)",l:`${done} días completos`},
    {c:"var(--amber)",l:`${part} días parciales`},
    {c:"rgba(221,68,68,.7)",l:`${miss} días sin cumplir`},
    {c:"var(--muted)",l:`${total} días registrados`}
  ].map(s=>`<div style="display:flex;align-items:center;gap:6px"><div style="width:7px;height:7px;border-radius:50%;background:${s.c};flex-shrink:0"></div><span class="fxs" style="color:var(--txt2)">${s.l}</span></div>`).join("");
}

/* ══════════════════════════════════════
   FEATURE 3 — MACROS DE REFERENCIA
══════════════════════════════════════ */
