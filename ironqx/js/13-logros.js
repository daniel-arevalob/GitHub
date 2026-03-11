/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Achievement definitions (LOGROS_DEF)
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

const LOGROS_DEF=[
  /* ═══════════════════════════
     CATEGORÍA: PESO
  ═══════════════════════════ */
  {id:"first_log",    cat:"peso",cat_label:"💪 Peso",      tier:"common",    name:"Primera medición",      icon:"weight",
   desc:"Registra tu primer pesaje",
   check(log){const u=log.length>=1;return{unlocked:u,date:u?log[0].date:null,progress:null};}},

  {id:"pesajes5",     cat:"peso",cat_label:"💪 Peso",      tier:"common",    name:"Registro activo",       icon:"chart",
   desc:"5 pesajes registrados",
   check(log){const u=log.length>=5;return{unlocked:u,date:u?_sortedLog(log)[4].date:null,progress:u?null:{cur:log.length,max:5}};}},

  {id:"pesajes10",    cat:"peso",cat_label:"💪 Peso",      tier:"elite",     name:"10 Registros",          icon:"chart",
   desc:"10 pesajes registrados",
   check(log){const u=log.length>=10;return{unlocked:u,date:u?_sortedLog(log)[9].date:null,progress:u?null:{cur:log.length,max:10}};}},

  {id:"pesajes20",    cat:"peso",cat_label:"💪 Peso",      tier:"legendary", name:"Diario de peso",        icon:"note",
   desc:"20 pesajes registrados",
   check(log){const u=log.length>=20;return{unlocked:u,date:u?_sortedLog(log)[19].date:null,progress:u?null:{cur:log.length,max:20}};}},

  {id:"minus1kg",     cat:"peso",cat_label:"💪 Peso",      tier:"common",    name:"Primer kilo menos",     icon:"activity",
   desc:"Baja 1 kg desde tu peso inicial",
   check(log,adh,photos,reports,ficha,pt){
     const d=_weightDiff(log,pt);const u=d>=1;
     const s=_sortedLog(log);const ini=s.length?s[0].weight:(pt?pt.weight:0);
     const entry=u?s.find(e=>ini-e.weight>=1):null;
     return{unlocked:u,date:entry?entry.date:null,progress:u?null:{cur:Math.min(d,1),max:1}};}},

  {id:"minus3kg",     cat:"peso",cat_label:"💪 Peso",      tier:"elite",     name:"Máquina de cambios",    icon:"target",
   desc:"Baja 3 kg desde tu peso inicial",
   check(log,adh,photos,reports,ficha,pt){
     const d=_weightDiff(log,pt);const u=d>=3;
     const s=_sortedLog(log);const ini=s.length?s[0].weight:(pt?pt.weight:0);
     const entry=u?s.find(e=>ini-e.weight>=3):null;
     return{unlocked:u,date:entry?entry.date:null,progress:u?null:{cur:Math.min(d,3),max:3}};}},

  {id:"minus5kg",     cat:"peso",cat_label:"💪 Peso",      tier:"legendary", name:"Transformación total",  icon:"spark",
   desc:"Baja 5 kg desde tu peso inicial",
   check(log,adh,photos,reports,ficha,pt){
     const d=_weightDiff(log,pt);const u=d>=5;
     const s=_sortedLog(log);const ini=s.length?s[0].weight:(pt?pt.weight:0);
     const entry=u?s.find(e=>ini-e.weight>=5):null;
     return{unlocked:u,date:entry?entry.date:null,progress:u?null:{cur:Math.min(d,5),max:5}};}},

  {id:"minus10kg",    cat:"peso",cat_label:"💪 Peso",      tier:"legendary", name:"Renacido",              icon:"spark",
   desc:"Baja 10 kg desde tu peso inicial",
   check(log,adh,photos,reports,ficha,pt){
     const d=_weightDiff(log,pt);const u=d>=10;
     const s=_sortedLog(log);const ini=s.length?s[0].weight:(pt?pt.weight:0);
     const entry=u?s.find(e=>ini-e.weight>=10):null;
     return{unlocked:u,date:entry?entry.date:null,progress:u?null:{cur:Math.min(d,10),max:10}};}},

  {id:"new_min",      cat:"peso",cat_label:"💪 Peso",      tier:"elite",     name:"Nuevo mínimo",          icon:"target",
   desc:"Alcanza un nuevo peso mínimo histórico",
   check(log){
     if(log.length<3)return{unlocked:false,date:null,progress:null};
     const s=_sortedLog(log);
     let found=null;
     for(let i=2;i<s.length;i++){
       if(s[i].weight<Math.min(...s.slice(0,i).map(e=>e.weight))){found=s[i];break;}
     }
     return{unlocked:!!found,date:found?found.date:null,progress:null};}},

  {id:"peso_estable", cat:"peso",cat_label:"💪 Peso",      tier:"elite",     name:"Peso estable",          icon:"check-circle",
   desc:"3 pesajes consecutivos con variación ≤ 0.3 kg",
   check(log){
     const s=_sortedLog(log);if(s.length<3)return{unlocked:false,date:null,progress:{cur:s.length,max:3}};
     let found=null;
     for(let i=2;i<s.length;i++){
       if(Math.abs(s[i].weight-s[i-1].weight)<=0.3&&Math.abs(s[i-1].weight-s[i-2].weight)<=0.3){found=s[i];break;}
     }
     return{unlocked:!!found,date:found?found.date:null,progress:null};}},

  /* ═══════════════════════════
     CATEGORÍA: COMPOSICIÓN
  ═══════════════════════════ */
  {id:"first_ficha",  cat:"comp",cat_label:"📊 Composición",tier:"common",   name:"Primera clínica",       icon:"stethoscope",
   desc:"Primera medición clínica registrada",
   check(log,adh,photos,reports,ficha){
     const u=ficha&&ficha.length>=1;
     return{unlocked:u,date:u?ficha[ficha.length-1].date:null,progress:null};}},

  {id:"fichas3",      cat:"comp",cat_label:"📊 Composición",tier:"elite",    name:"3 Mediciones",          icon:"stethoscope",
   desc:"3 mediciones clínicas registradas",
   check(log,adh,photos,reports,ficha){
     const u=ficha&&ficha.length>=3;
     return{unlocked:u,date:u?ficha[ficha.length-1].date:null,progress:u?null:{cur:(ficha||[]).length,max:3}};}},

  {id:"gc_minus1",    cat:"comp",cat_label:"📊 Composición",tier:"common",   name:"Menos grasa",           icon:"activity",
   desc:"Reduce tu % grasa corporal en 1 punto",
   check(log,adh,photos,reports,ficha){
     const hist=ficha||[];const chrono=hist.slice().reverse();
     if(chrono.length<2)return{unlocked:false,date:null,progress:{cur:0,max:1}};
     const ini=parseFloat(chrono[0].grasa)||null;if(!ini)return{unlocked:false,date:null,progress:{cur:0,max:1}};
     const best=Math.min(...chrono.map(h=>parseFloat(h.grasa)||999).filter(v=>v<999));
     const d=parseFloat((ini-best).toFixed(1));const u=d>=1;
     const entry=u?chrono.find(h=>ini-(parseFloat(h.grasa)||ini)>=1):null;
     return{unlocked:u,date:entry?entry.date:null,progress:u?null:{cur:Math.min(Math.max(d,0),1),max:1}};}},

  {id:"gc_minus2",    cat:"comp",cat_label:"📊 Composición",tier:"elite",    name:"-2% Grasa",             icon:"activity",
   desc:"Reduce tu % grasa corporal en 2 puntos",
   check(log,adh,photos,reports,ficha){
     const hist=ficha||[];const chrono=hist.slice().reverse();
     if(chrono.length<2)return{unlocked:false,date:null,progress:{cur:0,max:2}};
     const ini=parseFloat(chrono[0].grasa)||null;if(!ini)return{unlocked:false,date:null,progress:{cur:0,max:2}};
     const best=Math.min(...chrono.map(h=>parseFloat(h.grasa)||999).filter(v=>v<999));
     const d=parseFloat((ini-best).toFixed(1));const u=d>=2;
     const entry=u?chrono.find(h=>ini-(parseFloat(h.grasa)||ini)>=2):null;
     return{unlocked:u,date:entry?entry.date:null,progress:u?null:{cur:Math.min(Math.max(d,0),2),max:2}};}},

  {id:"gc_minus3",    cat:"comp",cat_label:"📊 Composición",tier:"legendary",name:"Composición élite",     icon:"spark",
   desc:"Reduce tu % grasa corporal en 3 puntos",
   check(log,adh,photos,reports,ficha){
     const hist=ficha||[];const chrono=hist.slice().reverse();
     if(chrono.length<2)return{unlocked:false,date:null,progress:{cur:0,max:3}};
     const ini=parseFloat(chrono[0].grasa)||null;if(!ini)return{unlocked:false,date:null,progress:{cur:0,max:3}};
     const best=Math.min(...chrono.map(h=>parseFloat(h.grasa)||999).filter(v=>v<999));
     const d=parseFloat((ini-best).toFixed(1));const u=d>=3;
     const entry=u?chrono.find(h=>ini-(parseFloat(h.grasa)||ini)>=3):null;
     return{unlocked:u,date:entry?entry.date:null,progress:u?null:{cur:Math.min(Math.max(d,0),3),max:3}};}},

  {id:"gc_minus5",    cat:"comp",cat_label:"📊 Composición",tier:"legendary",name:"Transformación grasa",  icon:"spark",
   desc:"Reduce tu % grasa corporal en 5 puntos",
   check(log,adh,photos,reports,ficha){
     const hist=ficha||[];const chrono=hist.slice().reverse();
     if(chrono.length<2)return{unlocked:false,date:null,progress:{cur:0,max:5}};
     const ini=parseFloat(chrono[0].grasa)||null;if(!ini)return{unlocked:false,date:null,progress:{cur:0,max:5}};
     const best=Math.min(...chrono.map(h=>parseFloat(h.grasa)||999).filter(v=>v<999));
     const d=parseFloat((ini-best).toFixed(1));const u=d>=5;
     const entry=u?chrono.find(h=>ini-(parseFloat(h.grasa)||ini)>=5):null;
     return{unlocked:u,date:entry?entry.date:null,progress:u?null:{cur:Math.min(Math.max(d,0),5),max:5}};}},

  {id:"masa_magra_ok",cat:"comp",cat_label:"📊 Composición",tier:"legendary",name:"Músculo preservado",    icon:"target",
   desc:"Bajaste peso pero tu masa magra se mantuvo o aumentó",
   check(log,adh,photos,reports,ficha){
     const hist=ficha||[];const chrono=hist.slice().reverse();
     if(chrono.length<2)return{unlocked:false,date:null,progress:null};
     const ini=chrono[0];const last=chrono[chrono.length-1];
     const iniP=parseFloat(ini.peso)||null,iniG=parseFloat(ini.grasa)||null;
     const lstP=parseFloat(last.peso)||null,lstG=parseFloat(last.grasa)||null;
     if(!iniP||!iniG||!lstP||!lstG)return{unlocked:false,date:null,progress:null};
     const iniMM=iniP*(1-iniG/100);const lstMM=lstP*(1-lstG/100);
     const u=lstP<iniP&&lstMM>=iniMM;
     return{unlocked:u,date:u?last.date:null,progress:null};}},

  {id:"imc_normal",   cat:"comp",cat_label:"📊 Composición",tier:"elite",    name:"Zona saludable",        icon:"check-circle",
   desc:"IMC en rango normal (18.5 – 24.9)",
   check(log,adh,photos,reports,ficha,pt){
     if(!pt||!pt.ficha)return{unlocked:false,date:null,progress:null};
     const f=pt.ficha;const h=parseFloat(f.altura);const w=parseFloat(f.peso)||parseFloat(pt.weight);
     if(!h||!w)return{unlocked:false,date:null,progress:null};
     const imc=w/((h/100)**2);const u=imc>=18.5&&imc<=24.9;
     return{unlocked:u,date:u?(f._updated||null):null,progress:null};}},

  /* ═══════════════════════════
     CATEGORÍA: CONSISTENCIA
  ═══════════════════════════ */
  {id:"first_day",    cat:"consist",cat_label:"🔥 Consistencia",tier:"common",  name:"Primer día",          icon:"check-circle",
   desc:"Completa tu primer día de entrenamiento",
   check(log,adh){
     const keys=_doneKeys(adh);const u=keys.length>=1;
     return{unlocked:u,date:u?new Date(keys[0]).toISOString():null,progress:null};}},

  {id:"streak3",      cat:"consist",cat_label:"🔥 Consistencia",tier:"common",  name:"En racha",            icon:"spark",
   desc:"Racha de 3 días consecutivos",
   check(log,adh){const s=_maxStreak(adh);return{unlocked:s>=3,date:null,progress:s>=3?null:{cur:s,max:3}};}},

  {id:"streak7",      cat:"consist",cat_label:"🔥 Consistencia",tier:"elite",   name:"Semana de fuego",     icon:"spark",
   desc:"Racha de 7 días consecutivos",
   check(log,adh){const s=_maxStreak(adh);return{unlocked:s>=7,date:null,progress:s>=7?null:{cur:s,max:7}};}},

  {id:"streak14",     cat:"consist",cat_label:"🔥 Consistencia",tier:"legendary",name:"Imparable",           icon:"spark",
   desc:"Racha de 14 días consecutivos",
   check(log,adh){const s=_maxStreak(adh);return{unlocked:s>=14,date:null,progress:s>=14?null:{cur:s,max:14}};}},

  {id:"week_perfect", cat:"consist",cat_label:"🔥 Consistencia",tier:"elite",   name:"Semana perfecta",     icon:"check-circle",
   desc:"7 de 7 días completados en una semana",
   check(log,adh){
     const keys=_doneKeys(adh);if(keys.length<7)return{unlocked:false,date:null,progress:{cur:keys.length,max:7}};
     let found=null;
     for(let i=0;i<=keys.length-7;i++){
       const sl=keys.slice(i,i+7);
       if((new Date(sl[6])-new Date(sl[0]))/864e5<=6){found=sl[6];break;}
     }
     return{unlocked:!!found,date:found?new Date(found).toISOString():null,progress:found?null:{cur:keys.length,max:7}};}},

  {id:"days14",       cat:"consist",cat_label:"🔥 Consistencia",tier:"elite",   name:"14 días acumulados",  icon:"target",
   desc:"Acumula 14 días de entrenamiento completados",
   check(log,adh){const dk=_doneKeys(adh);const u=dk.length>=14;return{unlocked:u,date:u?new Date(dk[13]).toISOString():null,progress:u?null:{cur:dk.length,max:14}};}},

  {id:"days30",       cat:"consist",cat_label:"🔥 Consistencia",tier:"legendary",name:"Modo Bestia",         icon:"target",
   desc:"30 días de entrenamiento acumulados",
   check(log,adh){const dk=_doneKeys(adh);const u=dk.length>=30;return{unlocked:u,date:u?new Date(dk[29]).toISOString():null,progress:u?null:{cur:dk.length,max:30}};}},

  {id:"days50",       cat:"consist",cat_label:"🔥 Consistencia",tier:"legendary",name:"50 Días de élite",    icon:"spark",
   desc:"50 días de entrenamiento acumulados",
   check(log,adh){const dk=_doneKeys(adh);const u=dk.length>=50;return{unlocked:u,date:u?new Date(dk[49]).toISOString():null,progress:u?null:{cur:dk.length,max:50}};}},

  {id:"days100",      cat:"consist",cat_label:"🔥 Consistencia",tier:"legendary",name:"Centenario",          icon:"spark",
   desc:"100 días de entrenamiento acumulados",
   check(log,adh){const dk=_doneKeys(adh);const u=dk.length>=100;return{unlocked:u,date:u?new Date(dk[99]).toISOString():null,progress:u?null:{cur:dk.length,max:100}};}},

  {id:"mon_warrior",  cat:"consist",cat_label:"🔥 Consistencia",tier:"common",  name:"Guerrero del lunes",  icon:"check-circle",
   desc:"Completar entrenamiento 3 lunes consecutivos",
   check(log,adh){
     const monKeys=Object.keys(adh).filter(k=>adh[k]==="done"&&new Date(k).getDay()===1).sort();
     let found=false;
     for(let i=2;i<monKeys.length;i++){
       const d0=new Date(monKeys[i-2]),d2=new Date(monKeys[i]);
       if((d2-d0)/864e5===14){found=true;break;}
     }
     return{unlocked:found,date:null,progress:found?null:{cur:Math.min(monKeys.length,3),max:3}};}},

  {id:"weekend_hero", cat:"consist",cat_label:"🔥 Consistencia",tier:"common",  name:"Héroe del finde",     icon:"spark",
   desc:"Completa un entrenamiento en sábado o domingo",
   check(log,adh){
     const we=Object.keys(adh).filter(k=>adh[k]==="done"&&[0,6].includes(new Date(k).getDay()));
     return{unlocked:we.length>=1,date:we.length?new Date(we[0]).toISOString():null,progress:null};}},

  {id:"perfect_weeks3",cat:"consist",cat_label:"🔥 Consistencia",tier:"legendary",name:"3 Semanas perfectas", icon:"spark",
   desc:"3 semanas con 7/7 días completados",
   check(log,adh){
     const keys=_doneKeys(adh);let weeks=0;
     for(let i=0;i<=keys.length-7;i++){
       const sl=keys.slice(i,i+7);
       if((new Date(sl[6])-new Date(sl[0]))/864e5<=6)weeks++;
     }
     return{unlocked:weeks>=3,date:null,progress:weeks>=3?null:{cur:weeks,max:3}};}},

  /* ═══════════════════════════
     CATEGORÍA: COMPROMISO
  ═══════════════════════════ */
  {id:"first_photo",  cat:"comp2",cat_label:"📋 Compromiso",tier:"common",    name:"Primera foto",          icon:"camera",
   desc:"Sube tu primer set de fotos de progreso",
   check(log,adh,photos){const u=photos.length>=1;return{unlocked:u,date:u?photos[0].date:null,progress:null};}},

  {id:"photos3",      cat:"comp2",cat_label:"📋 Compromiso",tier:"elite",     name:"Evidencia del cambio",  icon:"camera",
   desc:"3 sets de fotos de progreso",
   check(log,adh,photos){const u=photos.length>=3;return{unlocked:u,date:u?photos[2].date:null,progress:u?null:{cur:photos.length,max:3}};}},

  {id:"photos5",      cat:"comp2",cat_label:"📋 Compromiso",tier:"legendary", name:"Archivo visual",        icon:"camera",
   desc:"5 sets de fotos de progreso",
   check(log,adh,photos){const u=photos.length>=5;return{unlocked:u,date:u?photos[4].date:null,progress:u?null:{cur:photos.length,max:5}};}},

  {id:"first_report", cat:"comp2",cat_label:"📋 Compromiso",tier:"common",    name:"Primer reporte",        icon:"note",
   desc:"Envía tu primer reporte semanal al Dr.",
   check(log,adh,photos,reports){const u=reports.length>=1;return{unlocked:u,date:u?reports[0].date:null,progress:null};}},

  {id:"reports4",     cat:"comp2",cat_label:"📋 Compromiso",tier:"elite",     name:"Paciente modelo",       icon:"note",
   desc:"4 reportes semanales enviados",
   check(log,adh,photos,reports){const u=reports.length>=4;return{unlocked:u,date:u?reports[3].date:null,progress:u?null:{cur:reports.length,max:4}};}},

  {id:"reports8",     cat:"comp2",cat_label:"📋 Compromiso",tier:"elite",     name:"8 Reportes",            icon:"stethoscope",
   desc:"8 reportes semanales enviados",
   check(log,adh,photos,reports){const u=reports.length>=8;return{unlocked:u,date:u?reports[7].date:null,progress:u?null:{cur:reports.length,max:8}};}},

  {id:"reports12",    cat:"comp2",cat_label:"📋 Compromiso",tier:"legendary", name:"Año de reportes",       icon:"stethoscope",
   desc:"12 reportes semanales enviados",
   check(log,adh,photos,reports){const u=reports.length>=12;return{unlocked:u,date:u?reports[11].date:null,progress:u?null:{cur:reports.length,max:12}};}},

  {id:"high_adh",     cat:"comp2",cat_label:"📋 Compromiso",tier:"elite",     name:"Adherencia máxima",     icon:"check-circle",
   desc:"Reporte enviado con ≥ 90% de adherencia",
   check(log,adh,photos,reports){
     const high=reports.find(r=>parseInt(r.adherencePct)>=90);
     return{unlocked:!!high,date:high?high.date:null,progress:null};}},

  {id:"dr_replied",   cat:"comp2",cat_label:"📋 Compromiso",tier:"elite",     name:"Diálogo activo",        icon:"stethoscope",
   desc:"El Dr. respondió uno de tus reportes",
   check(log,adh,photos,reports){
     const r=reports.find(rp=>rp.drReply);
     return{unlocked:!!r,date:r?r.date:null,progress:null};}},

  /* ═══════════════════════════
     CATEGORÍA: PLAN
  ═══════════════════════════ */
  {id:"plan_activo",  cat:"plan",cat_label:"📐 Plan",      tier:"common",    name:"Plan asignado",         icon:"clipboard",
   desc:"Tu Dr. te asignó tu primer plan",
   check(log,adh,photos,reports,ficha,pt){const u=!!(pt&&pt.id&&DB.planHtml(pt.id));return{unlocked:u,date:null,progress:null};}},

  {id:"plan_v2",      cat:"plan",cat_label:"📐 Plan",      tier:"elite",     name:"Plan v2",               icon:"clipboard",
   desc:"Recibiste tu segundo plan actualizado",
   check(log,adh,photos,reports,ficha,pt){
     const plans=DB.plans(pt?pt.id:'');const u=plans.length>=2;
     return{unlocked:u,date:null,progress:u?null:{cur:plans.length,max:2}};}},

  {id:"plan_v3",      cat:"plan",cat_label:"📐 Plan",      tier:"elite",     name:"Veterano",              icon:"clipboard",
   desc:"Recibiste 3 o más planes actualizados",
   check(log,adh,photos,reports,ficha,pt){
     const plans=DB.plans(pt?pt.id:'');const u=plans.length>=3;
     return{unlocked:u,date:null,progress:u?null:{cur:plans.length,max:3}};}},

  {id:"macros_ok",    cat:"plan",cat_label:"📐 Plan",      tier:"common",    name:"Macros asignados",      icon:"activity",
   desc:"El Dr. configuró tus macros de referencia",
   check(log,adh,photos,reports,ficha,pt){
     if(!pt)return{unlocked:false,date:null,progress:null};
     const m=pt.macros;const u=!!(m&&(m.kcal||m.prot));
     return{unlocked:u,date:null,progress:null};}},

  {id:"memb_30",      cat:"plan",cat_label:"📐 Plan",      tier:"common",    name:"Membresía activa",      icon:"credit",
   desc:"30 días con membresía activa",
   check(log,adh,photos,reports,ficha,pt){
     if(!pt||!pt.expDate)return{unlocked:false,date:null,progress:null};
     const now=new Date(),exp=new Date(pt.expDate);
     const daysLeft=(exp-now)/864e5;const u=daysLeft>0;
     return{unlocked:u,date:null,progress:null};}},

  {id:"memb_90",      cat:"plan",cat_label:"📐 Plan",      tier:"elite",     name:"Socio comprometido",    icon:"credit",
   desc:"Membresía con fecha extendida ≥ 90 días",
   check(log,adh,photos,reports,ficha,pt){
     if(!pt||!pt.expDate)return{unlocked:false,date:null,progress:null};
     const now=new Date(),exp=new Date(pt.expDate);
     const daysLeft=(exp-now)/864e5;const u=daysLeft>=90;
     return{unlocked:u,date:null,progress:u?null:{cur:Math.round(Math.max(daysLeft,0)),max:90}};}},

  /* ═══════════════════════════
     CATEGORÍA: HITOS
  ═══════════════════════════ */
  {id:"sem1",         cat:"hitos",cat_label:"🏁 Hitos",   tier:"common",    name:"Semana 1",              icon:"calendar",
   desc:"Primera semana del programa",
   check(log,adh,photos,reports,ficha,pt){const u=!!(pt&&pt.week>=1);return{unlocked:u,date:null,progress:null};}},

  {id:"sem4",         cat:"hitos",cat_label:"🏁 Hitos",   tier:"common",    name:"Mes 1 — Semana 4",     icon:"calendar",
   desc:"Completaste el primer mes del programa",
   check(log,adh,photos,reports,ficha,pt){const u=!!(pt&&pt.week>=4);return{unlocked:u,date:null,progress:u?null:{cur:Math.min(pt.week||0,4),max:4}};}},

  {id:"sem8",         cat:"hitos",cat_label:"🏁 Hitos",   tier:"elite",     name:"Mes 2 — Semana 8",     icon:"calendar",
   desc:"Dos meses consecutivos en el programa",
   check(log,adh,photos,reports,ficha,pt){const u=!!(pt&&pt.week>=8);return{unlocked:u,date:null,progress:u?null:{cur:Math.min(pt.week||0,8),max:8}};}},

  {id:"sem12",        cat:"hitos",cat_label:"🏁 Hitos",   tier:"elite",     name:"Mes 3 — Semana 12",    icon:"calendar",
   desc:"Tres meses en el programa",
   check(log,adh,photos,reports,ficha,pt){const u=!!(pt&&pt.week>=12);return{unlocked:u,date:null,progress:u?null:{cur:Math.min(pt.week||0,12),max:12}};}},

  {id:"sem24",        cat:"hitos",cat_label:"🏁 Hitos",   tier:"legendary", name:"6 Meses — Semana 24",  icon:"spark",
   desc:"Seis meses sostenidos en el programa",
   check(log,adh,photos,reports,ficha,pt){const u=!!(pt&&pt.week>=24);return{unlocked:u,date:null,progress:u?null:{cur:Math.min(pt.week||0,24),max:24}};}},

  {id:"sem52",        cat:"hitos",cat_label:"🏁 Hitos",   tier:"legendary", name:"Un año completo",      icon:"spark",
   desc:"52 semanas — un año entero en el programa",
   check(log,adh,photos,reports,ficha,pt){const u=!!(pt&&pt.week>=52);return{unlocked:u,date:null,progress:u?null:{cur:Math.min(pt.week||0,52),max:52}};}},

  {id:"ficha_completa",cat:"hitos",cat_label:"🏁 Hitos",  tier:"common",    name:"Ficha completa",        icon:"stethoscope",
   desc:"Todos los campos de tu ficha clínica están llenos",
   check(log,adh,photos,reports,ficha,pt){
     if(!pt||!pt.ficha)return{unlocked:false,date:null,progress:null};
     const f=pt.ficha;
     const ok=!!(f.nacimiento&&f.altura&&f.peso&&f.grasa);
     return{unlocked:ok,date:null,progress:null};}},

  {id:"total10",      cat:"hitos",cat_label:"🏁 Hitos",   tier:"elite",     name:"Coleccionista",         icon:"spark",
   desc:"Desbloquea 10 logros en total",
   check(){return{unlocked:false,date:null,progress:null};}}, // computed post-pass below

  {id:"total25",      cat:"hitos",cat_label:"🏁 Hitos",   tier:"legendary", name:"Leyenda viva",           icon:"spark",
   desc:"Desbloquea 25 logros en total",
   check(){return{unlocked:false,date:null,progress:null};}} // computed post-pass below
];

