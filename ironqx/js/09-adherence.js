/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Adherence grid, cycleAdh, heatmap, streak
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function renderAdh(pid){
  const adh=DB.adh(pid),grid=G("adh-grid"),dayLabels=["D","L","M","X","J","V","S"];
  const today=new Date(),todayStr=today.toISOString().slice(0,10);
  // Semana actual: Lun→Dom
  const dow=today.getDay(); // 0=Dom
  const diffToMon=dow===0?-6:1-dow;
  const mon=new Date(today);mon.setDate(today.getDate()+diffToMon);mon.setHours(0,0,0,0);
  let html="",done=0;
  for(let i=0;i<7;i++){
    const d=new Date(mon);d.setDate(mon.getDate()+i);
    const key=d.toISOString().slice(0,10),st=adh[key]||"none";
    const isFuture=key>todayStr;
    if(!isFuture&&st==="done")done++;
    const cls=(isFuture?"future ":(st==="done"?"done":st==="part"?"part":st==="miss"?"miss":""));
    const click=isFuture?"":`onclick="cycleAdh('${pid}','${key}',this)"`;
    html+=`<div class="adh-d ${cls}" ${click}><span class="adh-n">${d.getDate()}</span><span>${dayLabels[d.getDay()]}</span></div>`;
  }
  grid.innerHTML=html;
  const pct=Math.round((done/7)*100);
  G("adh-pct").textContent=pct+"% adherencia";if(G("st-adh"))G("st-adh").textContent=pct+"%";
  if(G("st-adh"))setTimeout(()=>countUp(G("st-adh"),pct,0,'%'),80);
  renderStreakBadge(pid);
}
function cycleAdh(pid,key,el){
  const adh=DB.adh(pid),states=["none","done","part","miss"];
  const next=states[(states.indexOf(adh[key]||"none")+1)%4];
  adh[key]=next;DB.saveAdh(pid,adh);
  el.className="adh-d "+(next==="done"?"done":next==="part"?"part":next==="miss"?"miss":"");
  // Haptic por estado
  if(next==="done")haptic("medium");
  else if(next==="miss")haptic("error");
  else haptic("light");
  // Recalculate pct from current Mon-Sun window (same as renderAdh)
  const today=new Date(),todayStr=today.toISOString().slice(0,10);
  const dow=today.getDay(),diffToMon=dow===0?-6:1-dow;
  const mon=new Date(today);mon.setDate(today.getDate()+diffToMon);
  let cnt=0;
  for(let i=0;i<7;i++){
    const d=new Date(mon);d.setDate(mon.getDate()+i);
    const k=d.toISOString().slice(0,10);
    if(k<=todayStr&&adh[k]==="done")cnt++;
  }
  const pct=Math.round((cnt/7)*100);
  G("adh-pct").textContent=pct+"% adherencia";if(G("st-adh"))G("st-adh").textContent=pct+"%";
  renderStreakBadge(pid);
  if(cnt===7){
    const r=el.getBoundingClientRect();
    fireConfetti(r.left+r.width/2,r.top);
    setTimeout(()=>fireConfetti(window.innerWidth/2,window.innerHeight*0.35),180);
    toast('✅','¡Semana perfecta! 7/7 días 🔥');
  }
}

/* ── PROGRESS ── */
