/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Supabase Sync Engine v2
   Carga DESPUÉS de 02-utils.js (DB ya existe)
   ── NO MODIFICAR ──
═══════════════════════════════════════════════ */

// ── Cliente ────────────────────────────────────
let _supaClient = null;

function _getSupa() {
  if (_supaClient) return _supaClient;
  if (!SUPA_ENABLED || !window.supabase) return null;
  _supaClient = window.supabase.createClient(SUPA_URL, SUPA_KEY);
  return _supaClient;
}

// ── Cola de sync ───────────────────────────────
const _Q = [];
let _QRunning = false;

function _queueSync(fn) {
  if (!SUPA_ENABLED) return;
  _Q.push(fn);
  if (!_QRunning) _drainQueue();
}

async function _drainQueue() {
  _QRunning = true;
  while (_Q.length) {
    const fn = _Q.shift();
    try { await fn(); }
    catch (e) { console.warn('[IQ Cloud]', e?.message || e); }
  }
  _QRunning = false;
}

// ── Mapeo: objeto app → fila Supabase ─────────
// Campos reales del objeto paciente en la app:
//   id, name, username, password, goal, weight, week,
//   expDate, planHtml, createdAt, drNotes, ficha{}
function _ptToRow(pt) {
  return {
    id:             pt.id,
    coach_email:    ADMIN.email,
    name:           pt.name          || null,
    username:       pt.username      || null,
    password:       pt.password      || null,
    goal:           pt.goal          || null,
    weight:         pt.weight        || null,
    week:           pt.week          || 1,
    exp_date:       pt.expDate       || null,
    // plan_html omitido del upsert masivo — se sube por separado via supaUploadPlan()
    created_at_app: pt.createdAt     || null,
    dr_notes:       pt.drNotes       || [],
    ficha:          pt.ficha         || {}
  };
}

// ── Mapeo: fila Supabase → objeto app ─────────
function _rowToPt(row) {
  return {
    id:        row.id,
    name:      row.name,
    username:  row.username,
    password:  row.password,
    goal:      row.goal,
    weight:    row.weight,
    week:      row.week,
    expDate:   row.exp_date,
    // planHtml se guarda en iq_plan_{pid} directamente (no en el objeto paciente)
    planHtml:  undefined,  // vacío intencionalmente — ver supaLoadAll
    createdAt: row.created_at_app,
    drNotes:   row.dr_notes  || [],
    ficha:     row.ficha     || {}
  };
}

// ── Upsert: pacientes ──────────────────────────
async function _upsertPatients(pts) {
  const s = _getSupa(); if (!s) return;
  const rows = pts.map(_ptToRow);
  const { error } = await s.from('patients').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

async function _deletePatient(pid) {
  const s = _getSupa(); if (!s) return;
  const { error } = await s.from('patients').delete().eq('id', pid);
  if (error) throw error;
}

// ── Upload plan HTML por separado (evita requests de 3-5MB en upsert masivo) ──
async function supaUploadPlan(pid, html) {
  const s = _getSupa(); if (!s || !html) return;
  const { error } = await s.from('patients')
    .update({ plan_html: html })
    .eq('id', pid)
    .eq('coach_email', ADMIN.email);
  if (error) console.warn('[IQ Cloud] plan upload error:', error.message);
  else console.log('[IQ Cloud] ✓ Plan subido para paciente', pid);
}

// ── Upsert: métricas / progreso ────────────────
// FIX: reemplaza DELETE+INSERT (race condition) con upsert atómico.
// FIX campo: app usa .note (singular), Supabase espera .notes.
async function _upsertMetrics(pid, log) {
  const s = _getSupa(); if (!s || !pid) return;
  if (!log || !log.length) {
    await s.from('metrics').delete().eq('patient_id', pid);
    return;
  }
  // IDs siempre con prefijo del pid — evita colisiones entre pacientes en Supabase
  const rows = log.map(m => ({
    id:         (m.id && m.id.startsWith(pid + '_m_')) ? m.id : (pid + '_m_' + new Date(m.date).getTime()),
    patient_id: pid,
    date:       m.date,
    weight:     m.weight  || null,
    fat:        m.fat     || null,
    waist:      m.waist   || null,
    chest:      m.chest   || null,
    arm:        m.arm     || null,
    leg:        m.leg     || null,
    notes:      m.note || m.notes || null
  }));
  const { error } = await s.from('metrics').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  // Limpiar huérfanos: obtener todos los IDs en Supabase para este paciente y borrar los que ya no existen localmente
  try {
    const keepIds = new Set(rows.map(r => r.id));
    const { data: remote } = await s.from('metrics').select('id').eq('patient_id', pid);
    if (remote && remote.length) {
      const staleIds = remote.filter(r => !keepIds.has(r.id)).map(r => r.id);
      if (staleIds.length) await s.from('metrics').delete().eq('patient_id', pid).in('id', staleIds);
    }
  } catch(cleanErr) { console.warn('[IQ Cloud] metrics cleanup:', cleanErr?.message); }
}

// ── Upsert: adherencia ─────────────────────────
// FIX: upsert atómico sin DELETE previo — evita race condition.
// La adherencia nunca se borra individualmente en el UI, solo crece.
async function _upsertAdherence(pid, adhMap) {
  const s = _getSupa(); if (!s) return;
  // Filtrar entradas vacías — "none" es el estado por defecto, no hace falta almacenarlo
  const entries = Object.entries(adhMap || {}).filter(([,v]) => v && v !== 'none');
  if (!entries.length) {
    await s.from('adherence').delete().eq('patient_id', pid);
    return;
  }
  const rows = entries.map(([week_key, v]) => {
    // v puede ser string ('done','miss','part') o objeto {training,nutrition,...}
    if (typeof v === 'string') {
      return { id: pid + '_' + week_key, patient_id: pid, week_key,
               training: null, nutrition: null, sleep: null, steps: null, notes: v };
    }
    return {
      id:         pid + '_' + week_key,
      patient_id: pid,
      week_key,
      training:   v.training  ?? null,
      nutrition:  v.nutrition ?? null,
      sleep:      v.sleep     ?? null,
      steps:      v.steps     ?? null,
      notes:      v.notes     || null
    };
  });
  const { error } = await s.from('adherence').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

// ── Upsert: notificaciones ─────────────────────
// FIX: upsert por id + limpieza de huérfanos — evita DELETE+INSERT race.
async function _upsertNotifs(pid, notifs) {
  const s = _getSupa(); if (!s) return;
  if (!notifs || !notifs.length) {
    await s.from('notifications').delete().eq('patient_id', pid);
    return;
  }
  const rows = notifs.map(n => ({
    id:            n.id,
    patient_id:    pid,
    msg:           n.msg,
    date:          n.date,
    pt_reply:      n.ptReply      || null,
    pt_reply_date: n.ptReplyDate  || null
  }));
  const { error } = await s.from('notifications').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  // Limpiar notificaciones borradas localmente
  const keepIds = rows.map(r => r.id);
  const { data: stale } = await s.from('notifications').select('id')
    .eq('patient_id', pid).not('id', 'in', '(' + keepIds.map(i => '"' + i + '"').join(',') + ')');
  if (stale && stale.length) {
    await s.from('notifications').delete().in('id', stale.map(r => r.id));
  }
}

// ── Upsert: reportes ───────────────────────────
// FIX: upsert puro sin DELETE previo.
async function _upsertReports(pid, reports) {
  const s = _getSupa(); if (!s) return;
  if (!reports || !reports.length) {
    await s.from('reports').delete().eq('patient_id', pid);
    return;
  }
  const rows = reports.map(r => {
    // Los campos del reporte viven en el top-level del objeto JS local.
    // El campo "data" en Supabase agrupa todo excepto los índices primarios.
    // Las fotos base64 se excluyen del upload (hasta 1.5MB c/u → body HTTP enorme).
    // Se conserva la referencia a fotos del set de progreso que ya se guardó por separado.
    const dataPayload = {
      week:          r.week          || 1,
      adherence:     r.adherence     || {},
      adherencePct:  r.adherencePct  || 0,
      comment:       r.comment       || '',
      // Fotos: solo guardar indicador de existencia, no el base64
      hasPhotos: !!(r.photos && (r.photos.front || r.photos.side || r.photos.back)),
      drReplyDate:   r.drReplyDate   || null,
    };
    return {
      id:         r.id || (pid + '_r_' + r.weekKey),
      patient_id: pid,
      week_key:   r.weekKey,
      date:       r.date,
      late:       r.late    || false,
      data:       dataPayload,
      dr_reply:   r.drReply || null
    };
  });
  const { error } = await s.from('reports').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

// ── Upsert: macros ─────────────────────────────
async function _upsertMacros(pid, macros) {
  const s = _getSupa(); if (!s) return;
  const { error } = await s.from('macros').upsert(
    { patient_id: pid, data: macros },
    { onConflict: 'patient_id' }
  );
  if (error) throw error;
}

// ── Upsert: logros ─────────────────────────────
async function _upsertAch(pid, arr) {
  const s = _getSupa(); if (!s) return;
  const { error } = await s.from('achievements').upsert(
    { patient_id: pid, unlocked: arr },
    { onConflict: 'patient_id' }
  );
  if (error) throw error;
}

// ── Upsert: PIN de acceso ─────────────────────
// Tabla dedicada para el PIN — no embebido en ficha ni en patients.
// Separada para que sea accesible con una query mínima desde el dispositivo del paciente.
async function _upsertPin(pid, pinValue) {
  const s = _getSupa(); if (!s) return;
  if (!pinValue) {
    await s.from('pins').delete().eq('patient_id', pid);
    return;
  }
  const { error } = await s.from('pins').upsert(
    { patient_id: pid, pin_value: pinValue, updated_at: new Date().toISOString() },
    { onConflict: 'patient_id' }
  );
  if (error) throw error;
}

// Carga el PIN de un paciente desde Supabase (para login en dispositivo nuevo)
async function _loadPin(pid) {
  const s = _getSupa(); if (!s) return null;
  const { data, error } = await s.from('pins')
    .select('pin_value')
    .eq('patient_id', pid)
    .maybeSingle();
  if (error || !data) return null;
  return data.pin_value || null;
}

// ── Carga inicial desde Supabase ───────────────
async function supaLoadAll(coachEmail) {
  const s = _getSupa();
  if (!s) return;

  // Mostrar indicador de sincronización
  const _showSyncBadge = (msg, done) => {
    let badge = document.getElementById('iq-sync-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'iq-sync-badge';
      badge.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(18,20,28,.97);border:1px solid rgba(212,146,14,.25);border-radius:20px;padding:6px 14px;font-family:"Inter",sans-serif;font-size:10px;letter-spacing:.8px;color:var(--muted,#888);z-index:9000;transition:opacity .4s;display:flex;align-items:center;gap:7px;white-space:nowrap;pointer-events:none';
      document.body.appendChild(badge);
    }
    badge.style.opacity = '1';
    badge.innerHTML = done
      ? `<span style="color:#52c97a;font-size:12px">✓</span> ${msg}`
      : `<span style="display:inline-block;width:10px;height:10px;border:1.5px solid rgba(212,146,14,.5);border-top-color:var(--gold,#d4920e);border-radius:50%;animation:iq-spin .7s linear infinite"></span> ${msg}`;
    if (done) setTimeout(() => { badge.style.opacity = '0'; setTimeout(() => badge.remove(), 450); }, 1800);
  };

  // Inyectar keyframe si no existe
  if (!document.getElementById('iq-sync-style')) {
    const st = document.createElement('style');
    st.id = 'iq-sync-style';
    st.textContent = '@keyframes iq-spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(st);
  }

  _showSyncBadge('Sincronizando datos...', false);
  console.log('[IQ Cloud] Cargando datos...');
  try {
    const { data: pts, error: pErr } = await s
      .from('patients').select('*').eq('coach_email', coachEmail);

    if (pErr) throw pErr;
    if (!pts || !pts.length) { console.log('[IQ Cloud] Sin pacientes en nube'); return; }

    const pids = pts.map(p => p.id);
    const db = DB.get();

    // ── FIX: MERGE en lugar de wipe total ─────────────────────────────────
    // Supabase es fuente de verdad para pacientes que ya están allí.
    // Pacientes locales no encontrados en Supabase (ej: _dr_pt_ aún sin subir) se preservan.
    // Nunca se destruyen datos locales que aún no llegaron a la nube.
    if (!db.patients) db.patients = [];
    pts.forEach(row => {
      if (row.id.startsWith('_cfg_')) return; // ignorar filas internas
      const mapped = _rowToPt(row);
      const localIdx = db.patients.findIndex(p => p.id === mapped.id);
      if (localIdx >= 0) {
        // Merge: Supabase gana en campos que trajo, se preservan los locales para el resto
        db.patients[localIdx] = { ...db.patients[localIdx], ...mapped };
      } else {
        db.patients.push(mapped);
      }
    });

    // Plan HTML: guardar en claves separadas iq_plan_{pid}
    pts.forEach(row => {
      if (row.plan_html && !row.id.startsWith('_cfg_')) {
        STORAGE.set('iq_plan_' + row.id, row.plan_html);
      }
    });

    // fichaHistory: merge por paciente — no wipe global
    if (!db.fichaHistory) db.fichaHistory = {};
    db.patients.forEach(pt => {
      if (!pt.id || pt.id.startsWith('_cfg_')) return;
      if (pt.ficha && pt.ficha._snapshots && pt.ficha._snapshots.length) {
        const supaSnaps = pt.ficha._snapshots;
        const localSnaps = db.fichaHistory[pt.id] || [];
        if (!localSnaps.length) {
          // Sin historial local → tomar Supabase directamente
          db.fichaHistory[pt.id] = supaSnaps.slice();
        } else {
          // Merge sin duplicar: combinar por fecha única y mantener el más completo
          const byDate = {};
          localSnaps.forEach(s => { byDate[s.date] = s; });
          supaSnaps.forEach(s => { if (!byDate[s.date]) byDate[s.date] = s; });
          const merged = Object.values(byDate).sort((a, b) => new Date(b.date) - new Date(a.date));
          db.fichaHistory[pt.id] = merged.slice(0, 20);
        }
      }
    });

    // Métricas (prog): merge por paciente — no wipe global
    const { data: metrics } = await s.from('metrics').select('*').in('patient_id', pids).order('date');
    if (metrics) {
      if (!db.prog) db.prog = {};
      // Agrupar métricas de Supabase por paciente — nunca mezclar entre pids
      const supaProgByPid = {};
      metrics.forEach(m => {
        if (!m.patient_id || m.patient_id.startsWith('_cfg_')) return;
        if (!supaProgByPid[m.patient_id]) supaProgByPid[m.patient_id] = [];
        supaProgByPid[m.patient_id].push({
          id: m.id, date: m.date, weight: m.weight, fat: m.fat,
          waist: m.waist, chest: m.chest, arm: m.arm, leg: m.leg,
          note: m.notes || null
        });
      });
      // Para cada paciente en Supabase, reemplazar SOLO su slice — nunca tocar otros pids
      pids.forEach(pid => {
        if (pid.startsWith('_cfg_')) return;
        if (supaProgByPid[pid]) {
          // Supabase tiene datos → reemplazar el slice de este paciente
          db.prog[pid] = supaProgByPid[pid];
        }
        // Si Supabase no tiene datos para este pid → preservar local (no sobrescribir con [])
      });
    }

    const { data: adh } = await s.from('adherence').select('*').in('patient_id', pids);
    if (adh) {
      // FIX Bug27: merge por pid en lugar de wipe total (db.adh = {} borraba datos locales de pids no incluidos)
      if (!db.adh) db.adh = {};
      // FIX Bug24+29: normalizar el valor de adherencia al string simple que espera el UI
      // Round-trip: local string "done" → Supabase columna notes="done" → objeto {notes:"done"} → normalizar de vuelta a string
      const _normAdh = v => {
        if (!v) return 'none';
        if (typeof v === 'string') return v; // ya es string, ok
        // Es objeto {training, nutrition, sleep, steps, notes} — extraer notes como valor canónico
        if (typeof v === 'object') return v.notes || 'none';
        return 'none';
      };
      // Agrupar por pid los datos de Supabase
      const _supaAdhByPid = {};
      adh.forEach(a => {
        if (!_supaAdhByPid[a.patient_id]) _supaAdhByPid[a.patient_id] = {};
        _supaAdhByPid[a.patient_id][a.week_key] = _normAdh(a.notes || a);
      });
      // Merge: solo reemplazar el slice de cada pid que Supabase trajo — nunca tocar otros pids
      pids.forEach(pid => {
        if (_supaAdhByPid[pid]) {
          db.adh[pid] = _supaAdhByPid[pid];
        }
        // Si Supabase no tiene datos para este pid → preservar local
      });
    }

    // Notifs, reports, macros, ach: merge por pid — nunca wipe global
    if (!db.notifs) db.notifs = {};
    if (!db.reports) db.reports = {};
    if (!db.macros) db.macros = {};
    if (!db.ach) db.ach = {};

    const { data: notifs } = await s.from('notifications').select('*').in('patient_id', pids).order('date', { ascending: false });
    if (notifs) {
      const supaNotifsByPid = {};
      notifs.forEach(n => {
        if (!supaNotifsByPid[n.patient_id]) supaNotifsByPid[n.patient_id] = [];
        supaNotifsByPid[n.patient_id].push({ id: n.id, msg: n.msg, date: n.date, ptReply: n.pt_reply, ptReplyDate: n.pt_reply_date });
      });
      pids.forEach(pid => { if (supaNotifsByPid[pid]) db.notifs[pid] = supaNotifsByPid[pid]; });
    }

    const { data: reports } = await s.from('reports').select('*').in('patient_id', pids).order('date', { ascending: false });
    if (reports) {
      const supaReportsByPid = {};
      reports.forEach(r => {
        if (!supaReportsByPid[r.patient_id]) supaReportsByPid[r.patient_id] = [];
        const _rd = r.data || {};
        supaReportsByPid[r.patient_id].push({
          id:            r.id,
          weekKey:       r.week_key,
          date:          r.date,
          late:          r.late,
          drReply:       r.dr_reply,
          drReplyDate:   _rd.drReplyDate || null,
          week:          _rd.week || 1,
          adherence:     _rd.adherence || {},
          adherencePct:  _rd.adherencePct || 0,
          comment:       _rd.comment || '',
          photos:        {}, // fotos no se sincronizan — viven localmente
        });
      });
      pids.forEach(pid => { if (supaReportsByPid[pid]) db.reports[pid] = supaReportsByPid[pid]; });
    }

    const { data: macros } = await s.from('macros').select('*').in('patient_id', pids);
    if (macros) {
      macros.forEach(m => { db.macros[m.patient_id] = m.data; });
    }

    const { data: ach } = await s.from('achievements').select('*').in('patient_id', pids);
    if (ach) {
      ach.forEach(a => { db.ach[a.patient_id] = a.unlocked; });
    }

    // Cargar PINs desde tabla dedicada → guardar en localStorage por paciente
    const { data: pinsData } = await s.from('pins').select('patient_id,pin_value').in('patient_id', pids);
    if (pinsData) {
      pinsData.forEach(row => {
        if (row.pin_value) {
          STORAGE.set('iq_pin_' + row.patient_id, row.pin_value);
        }
      });
    }

    DB.save(db);
    console.log('[IQ Cloud] ✓ Datos sincronizados (' + pts.length + ' pacientes)');
    _showSyncBadge('Datos al día · ' + pts.length + ' pacientes', true);
    if (typeof refreshAdmin === 'function') refreshAdmin();

  } catch (e) {
    console.warn('[IQ Cloud] Error carga:', e?.message || e);
    _showSyncBadge('Sin conexión — datos locales', true);
  }
}

// ── Carga datos de un paciente individual desde Supabase ──────
// Se llama en background DESPUÉS de loadPatient() — no bloquea el acceso.
async function supaLoadPatientData(pid) {
  const s = _getSupa();
  if (!s || !pid || pid.startsWith('_cfg_')) return;
  try {
    const db = DB.get();
    // Métricas
    const { data: metrics, error: mErr } = await s.from('metrics').select('*').eq('patient_id', pid).order('date');
    if (!mErr && metrics && metrics.length) {
      if (!db.prog) db.prog = {};
      db.prog[pid] = metrics.map(m => ({
        id: m.id, date: m.date, weight: m.weight, fat: m.fat,
        waist: m.waist, chest: m.chest, arm: m.arm, leg: m.leg, note: m.notes || null
      }));
      DB.save(db);
      console.log('[IQ Cloud] ✓ Métricas sincronizadas para', pid);
    }
    // Adherencia
    const { data: adh, error: aErr } = await s.from('adherence').select('*').eq('patient_id', pid);
    if (!aErr && adh && adh.length) {
      const db2 = DB.get(); if (!db2.adh) db2.adh = {};
      // FIX BugAdh: MERGE en lugar de REEMPLAZAR — proteger semana actual
      const _nAdh=v=>{if(!v)return'none';if(typeof v==='string')return v;if(typeof v==='object')return v.notes||'none';return'none';};
      const localAdh2 = db2.adh[pid] || {};
      const remoteAdh2 = {};
      adh.forEach(a => { remoteAdh2[a.week_key] = _nAdh(a.notes||a); });
      // Calcular rango de semana actual
      const _t2=new Date(),_dow2=_t2.getDay();
      const _mon2=new Date(_t2);_mon2.setDate(_t2.getDate()-(_dow2===0?6:_dow2-1));
      const _monStr2=_mon2.toISOString().slice(0,10);
      const _sun2=new Date(_mon2);_sun2.setDate(_mon2.getDate()+6);
      const _sunStr2=_sun2.toISOString().slice(0,10);
      const merged2={...remoteAdh2};
      Object.keys(localAdh2).forEach(k=>{
        if(k>=_monStr2&&k<=_sunStr2){merged2[k]=localAdh2[k];}
        else if(!(k in remoteAdh2)){merged2[k]=localAdh2[k];}
      });
      db2.adh[pid] = merged2;
      DB.save(db2);
    }
    // Notificaciones
    const { data: notifs, error: nErr } = await s.from('notifications').select('*').eq('patient_id', pid).order('date', { ascending: false });
    if (!nErr && notifs) {
      const db3 = DB.get(); if (!db3.notifs) db3.notifs = {};
      db3.notifs[pid] = notifs.map(n => ({ id: n.id, msg: n.msg, date: n.date, ptReply: n.pt_reply, ptReplyDate: n.pt_reply_date }));
      DB.save(db3);
    }
  } catch(e) { console.warn('[IQ Cloud] supaLoadPatientData:', e?.message || e); }
}

// ── Patch del objeto DB ────────────────────────
(function patchDB() {
  if (!SUPA_ENABLED) return;

  const _savePts = DB.savePts.bind(DB);
  DB.savePts = function(nuevaLista) {
    // Detectar eliminaciones antes de guardar
    const idsAntes   = DB.pts().map(p => p.id);
    const idsDespues = nuevaLista.map(p => p.id);
    const eliminados = idsAntes.filter(id => !idsDespues.includes(id));
    _savePts(nuevaLista);
    _queueSync(() => _upsertPatients(nuevaLista));
    eliminados.forEach(pid => _queueSync(() => _deletePatient(pid)));
  };

  const _updPt = DB.updPt.bind(DB);
  DB.updPt = function(id, u) {
    _updPt(id, u);
    if (u.planHtml !== undefined) {
      // Plan HTML se sube en request separado para evitar body request de 3-5MB
      if (u.planHtml) _queueSync(() => supaUploadPlan(id, u.planHtml));
      // Upsert del resto de datos del paciente (sin planHtml, ligero)
      const ptsLight = DB.pts(); // planHtml ya fue extraído por DB.save()
      _queueSync(() => _upsertPatients(ptsLight));
    } else {
      _queueSync(() => _upsertPatients(DB.pts()));
    }
  };

  const _addDrNote = DB.addDrNote.bind(DB);
  DB.addDrNote = function(pid, text) {
    _addDrNote(pid, text);
    _queueSync(() => _upsertPatients(DB.pts()));
  };

  const _deleteDrNote = DB.deleteDrNote.bind(DB);
  DB.deleteDrNote = function(pid, noteId) {
    _deleteDrNote(pid, noteId);
    _queueSync(() => _upsertPatients(DB.pts()));
  };

  const _saveProg = DB.saveProg.bind(DB);
  DB.saveProg = function(pid, log) {
    _saveProg(pid, log);
    _queueSync(() => _upsertMetrics(pid, log));
  };

  const _saveAdh = DB.saveAdh.bind(DB);
  DB.saveAdh = function(pid, d) {
    _saveAdh(pid, d);
    _queueSync(() => _upsertAdherence(pid, d));
  };

  const _addNotif = DB.addNotif.bind(DB);
  DB.addNotif = function(pid, msg) {
    _addNotif(pid, msg);
    _queueSync(() => _upsertNotifs(pid, DB.notifs(pid)));
  };

  const _saveNotifReply = DB.saveNotifReply.bind(DB);
  DB.saveNotifReply = function(pid, nid, reply) {
    _saveNotifReply(pid, nid, reply);
    _queueSync(() => _upsertNotifs(pid, DB.notifs(pid)));
  };

  const _saveReports = DB.saveReports.bind(DB);
  DB.saveReports = function(pid, reps) {
    _saveReports(pid, reps);
    _queueSync(() => _upsertReports(pid, reps));
  };

  const _saveMacros = DB.saveMacros.bind(DB);
  DB.saveMacros = function(pid, m) {
    _saveMacros(pid, m);
    _queueSync(() => _upsertMacros(pid, m));
  };

  const _saveAch = DB.saveAchUnlocked.bind(DB);
  DB.saveAchUnlocked = function(pid, arr) {
    _saveAch(pid, arr);
    _queueSync(() => _upsertAch(pid, arr));
  };

  // FIX: addFichaSnap modifica ficha._snapshots dentro del paciente.
  // Sin este parche, el historial de composición corporal nunca sube a Supabase.
  const _addFichaSnap = DB.addFichaSnap.bind(DB);
  DB.addFichaSnap = function(pid, snap) {
    _addFichaSnap(pid, snap);
    // ficha._snapshots ya fue actualizado por _addFichaSnap → subir paciente completo
    _queueSync(() => _upsertPatients(DB.pts()));
  };

  // Exponer _upsertPin y _loadPin para que auth.js los use directamente
  DB.supaUpsertPin = function(pid, pinValue) {
    _queueSync(() => _upsertPin(pid, pinValue));
  };
  DB.supaLoadPin = async function(pid) {
    return await _loadPin(pid);
  };

  // ── Patch saveSchedNotifs — sincronizar notificaciones programadas ─────────
  // Se almacenan dentro de patients.ficha._schedNotifs para evitar nueva tabla.
  const _saveSchedNotifs = DB.saveSchedNotifs.bind(DB);
  DB.saveSchedNotifs = function(pid, arr) {
    _saveSchedNotifs(pid, arr);
    // Embeber en ficha._schedNotifs y sincronizar el paciente completo
    const pt = DB.pt(pid);
    if (pt) {
      const ficha = { ...(pt.ficha || {}), _schedNotifs: arr };
      const _updRaw = DB.updPt.bind(DB);
      // Llamar updPt directamente para que también suba a Supabase
      DB.updPt(pid, { ficha });
    }
  };

  // ── Restaurar schedNotifs desde ficha._schedNotifs al cargar ─────────────
  // supaLoadAll ya descarga ficha → al restaurar pacientes, extraer _schedNotifs
  const _origSupaLoadAll = supaLoadAll;
  // Parche post-carga: después de supaLoadAll, restaurar schedNotifs en db local
  const _restoreSchedNotifs = (db) => {
    (db.patients || []).forEach(pt => {
      const sn = pt.ficha && pt.ficha._schedNotifs;
      if (sn && sn.length) {
        if (!db.schedNotifs) db.schedNotifs = {};
        if (!db.schedNotifs[pt.id] || !db.schedNotifs[pt.id].length) {
          db.schedNotifs[pt.id] = sn;
        }
      }
    });
    return db;
  };
  // Hook into supaLoadAll completion — wrap the function
  window.supaLoadAll = async function(email) {
    await _origSupaLoadAll(email);
    const db = _restoreSchedNotifs(DB.get());
    DB.save(db);
  };

  console.log('[IQ Cloud] Supabase sync engine v3 activo — tabla pins + schedNotifs activos');
})();
