/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Demo data seeding
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

function seedDemo(){
  const pts=DB.pts();
  const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString()};
  const isoDate=n=>{return ago(n).slice(0,10)};
  const exp=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};

  // Build adherence map for a patient: pct = approximate % done over last N days
  function buildAdh(daysBack, pct){
    const adh={};
    const today=new Date(),todayStr=today.toISOString().slice(0,10);
    for(let i=daysBack;i>=0;i--){
      const d=new Date();d.setDate(d.getDate()-i);
      const k=d.toISOString().slice(0,10);
      if(k>todayStr)continue;
      adh[k]=Math.random()*100<pct?"done":Math.random()<0.15?"part":"miss";
    }
    return adh;
  }

  const DEMO_PATIENTS=[
    // 1 — Maria: recomp, semana 8, activa, progreso sólido
    {
      id:"demo",
      name:"María González",username:"maria.gonzalez",password:"1506",
      goal:"Recomposición corporal",weight:66.2,week:8,
      expDate:exp(28),
      ficha:{nacimiento:"1994-06-15",edad:30,altura:"165",peso:"66.2",grasa:"22.8",pesoMeta:"63",patologias:"",restricciones:"Sin lactosa",lesiones:"",medicamentos:"",notas:"Excelente adherencia, bajar grasa y mantener músculo.",_updated:ago(0)},
      prog:[
        {date:ago(56),weight:70.1,note:"Peso inicial"},
        {date:ago(49),weight:69.4,note:"Adaptación OK"},
        {date:ago(42),weight:68.8,note:"Bajando bien"},
        {date:ago(35),weight:68.1,note:"Energía alta"},
        {date:ago(28),weight:67.5,note:"CP-1 superado"},
        {date:ago(21),weight:67.0,note:"Continúa"},
        {date:ago(14),weight:66.7,note:"Buena semana"},
        {date:ago(7), weight:66.2,note:"Progreso constante"}
      ],
      fichaSnaps:[
        {date:ago(56),peso:"70.1",grasa:"26.5"},
        {date:ago(28),peso:"67.5",grasa:"24.1"},
        {date:ago(0), peso:"66.2",grasa:"22.8"}
      ],
      adhPct:88,adhDays:56
    },
    // 2 — Carlos: corte, semana 12, activo, buen déficit
    {
      id:"demo2",
      name:"Carlos Medina",username:"carlos.medina",password:"2203",
      goal:"Corte / pérdida de grasa",weight:81.3,week:12,
      expDate:exp(45),
      ficha:{nacimiento:"1990-03-22",edad:35,altura:"178",peso:"81.3",grasa:"18.4",pesoMeta:"78",patologias:"HTA controlada",restricciones:"",lesiones:"Rodilla izquierda leve",medicamentos:"Losartán 50mg",notas:"Buen perfil metabólico. Cardio 3x/semana.",_updated:ago(0)},
      prog:[
        {date:ago(84),weight:89.0,note:"Inicio"},
        {date:ago(77),weight:88.1,note:"Semana 2"},
        {date:ago(70),weight:87.2,note:"Adaptación"},
        {date:ago(63),weight:86.4,note:"Entrando en déficit"},
        {date:ago(56),weight:85.5,note:"CP-1"},
        {date:ago(49),weight:84.6,note:"Buen ritmo"},
        {date:ago(42),weight:83.8,note:"Semana 7"},
        {date:ago(35),weight:83.1,note:"Deload sem 8"},
        {date:ago(28),weight:82.5,note:"CP-2"},
        {date:ago(21),weight:82.0,note:"Retomando"},
        {date:ago(14),weight:81.7,note:"Semana 11"},
        {date:ago(7), weight:81.3,note:"Constante"}
      ],
      fichaSnaps:[
        {date:ago(84),peso:"89.0",grasa:"24.2"},
        {date:ago(56),peso:"85.5",grasa:"21.8"},
        {date:ago(28),peso:"82.5",grasa:"19.6"},
        {date:ago(0), peso:"81.3",grasa:"18.4"}
      ],
      adhPct:80,adhDays:84
    },
    // 3 — Sofia: volumen, semana 4, activa, ganando bien
    {
      id:"demo3",
      name:"Sofía Vargas",username:"sofia.vargas",password:"1109",
      goal:"Volumen / ganancia muscular",weight:58.4,week:4,
      expDate:exp(60),
      ficha:{nacimiento:"2000-09-11",edad:24,altura:"160",peso:"58.4",grasa:"19.2",pesoMeta:"62",patologias:"",restricciones:"Vegetariana",lesiones:"",medicamentos:"",notas:"Primera experiencia de entrenamiento estructurado. Alta motivación.",_updated:ago(0)},
      prog:[
        {date:ago(28),weight:57.0,note:"Inicio"},
        {date:ago(21),weight:57.4,note:"Adaptación"},
        {date:ago(14),weight:57.9,note:"Ganando bien"},
        {date:ago(7), weight:58.4,note:"CP-1 próximo"}
      ],
      fichaSnaps:[
        {date:ago(28),peso:"57.0",grasa:"20.5"},
        {date:ago(0), peso:"58.4",grasa:"19.2"}
      ],
      adhPct:92,adhDays:28
    },
    // 4 — Diego: rendimiento, semana 6, activo
    {
      id:"demo4",
      name:"Diego Torres",username:"diego.torres",password:"0507",
      goal:"Rendimiento deportivo",weight:74.8,week:6,
      expDate:exp(14),
      ficha:{nacimiento:"1997-07-05",edad:27,altura:"175",peso:"74.8",grasa:"13.1",pesoMeta:"74",patologias:"",restricciones:"",lesiones:"Hombro derecho en recuperación",medicamentos:"Ibuprofeno ocasional",notas:"Triatleta amateur. Próxima competencia en 8 semanas.",_updated:ago(0)},
      prog:[
        {date:ago(42),weight:76.2,note:"Inicio"},
        {date:ago(35),weight:75.8,note:"Bajando bien"},
        {date:ago(28),weight:75.3,note:"Buen trabajo"},
        {date:ago(21),weight:75.0,note:"Hombro mejor"},
        {date:ago(14),weight:74.8,note:"Estable"},
        {date:ago(7), weight:74.8,note:"Mantenimiento pre-comp"}
      ],
      fichaSnaps:[
        {date:ago(42),peso:"76.2",grasa:"14.8"},
        {date:ago(21),peso:"75.0",grasa:"13.8"},
        {date:ago(0), peso:"74.8",grasa:"13.1"}
      ],
      adhPct:75,adhDays:42
    },
    // 5 — Lucía: salud metabólica, membresía VENCIDA, semana 3
    {
      id:"demo5",
      name:"Lucía Herrera",username:"lucia.herrera",password:"2804",
      goal:"Salud metabólica",weight:82.1,week:3,
      expDate:isoDate(5),   // vencida hace 5 días
      ficha:{nacimiento:"1985-04-28",edad:40,altura:"162",peso:"82.1",grasa:"34.5",pesoMeta:"72",patologias:"Hipotiroidismo, pre-diabetes",restricciones:"Sin azúcar refinada",lesiones:"",medicamentos:"Levotiroxina 75mcg, Metformina 500mg",notas:"Caso metabólico complejo. Prioridad: bajar glucosa e inflamación.",_updated:ago(0)},
      prog:[
        {date:ago(21),weight:83.5,note:"Inicio"},
        {date:ago(14),weight:83.0,note:"Adaptación lenta"},
        {date:ago(7), weight:82.1,note:"Mejorando"}
      ],
      fichaSnaps:[
        {date:ago(21),peso:"83.5",grasa:"35.8"},
        {date:ago(0), peso:"82.1",grasa:"34.5"}
      ],
      adhPct:58,adhDays:21
    }
  ];

  // Only seed patients that don't already exist AND haven't been explicitly deleted
  const existingIds=DB.pts().map(p=>p.id);
  const deletedDemoIds=(DB.get().deletedDemoIds||[]);
  const toAdd=DEMO_PATIENTS.filter(p=>!existingIds.includes(p.id)&&!deletedDemoIds.includes(p.id));

  // ── Migration: patch existing demo patients missing pesoMeta ──
  let patched=false;
  const dbM=DB.get();
  if(dbM.patients){
    DEMO_PATIENTS.forEach(dp=>{
      const idx=dbM.patients.findIndex(p=>p.id===dp.id);
    if(idx>=0&&dbM.patients[idx].ficha){
        const f=dbM.patients[idx].ficha;
        if(!f.pesoMeta&&dp.ficha.pesoMeta){f.pesoMeta=dp.ficha.pesoMeta;patched=true;}
        if(!f.pesoInicial&&dp.ficha.pesoInicial){f.pesoInicial=dp.ficha.pesoInicial;patched=true;}
        if(!f.fechaInicial&&dp.ficha.fechaInicial){f.fechaInicial=dp.ficha.fechaInicial;patched=true;}
        // Derive pesoInicial from first prog entry if still missing
        if(!f.pesoInicial&&dbM.prog&&dbM.prog[dp.id]){
          const sorted=[...(dbM.prog[dp.id]||[])].sort((a,b)=>new Date(a.date)-new Date(b.date));
          if(sorted.length){f.pesoInicial=String(sorted[0].weight);f.fechaInicial=sorted[0].date;patched=true;}
        }
      }
    });
    if(patched)DB.save(dbM);
  }

  if(!toAdd.length)return;

  const db=DB.get();
  if(!db.patients)db.patients=[];
  if(!db.prog)db.prog={};
  if(!db.fichaHistory)db.fichaHistory={};
  if(!db.adh)db.adh={};

  toAdd.forEach(p=>{
    // Patient record
    db.patients.push({
      id:p.id,name:p.name,username:p.username,password:p.password,
      goal:p.goal,weight:p.weight,week:p.week,expDate:p.expDate,
      planHtml:null,ficha:p.ficha,createdAt:ago(p.prog.length*7)
    });
    // Progress log
    db.prog[p.id]=p.prog;
    // Ficha history (for %GC chart)
    db.fichaHistory[p.id]=p.fichaSnaps;
    // Adherence
    db.adh[p.id]=buildAdh(p.adhDays,p.adhPct);
  });

  DB.save(db);
}

/* ── SCREENS ── */
