-- ═══════════════════════════════════════════════════════════
-- IRONQX — Schema v2 (columnas corregidas)
-- Ejecuta esto en Supabase → SQL Editor
-- Borra y recrea todas las tablas desde cero
-- ═══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS pins          CASCADE;
DROP TABLE IF EXISTS achievements  CASCADE;
DROP TABLE IF EXISTS macros        CASCADE;
DROP TABLE IF EXISTS reports       CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS adherence     CASCADE;
DROP TABLE IF EXISTS metrics       CASCADE;
DROP TABLE IF EXISTS patients      CASCADE;

CREATE TABLE patients (
  id              TEXT PRIMARY KEY,
  coach_email     TEXT NOT NULL,
  name            TEXT,
  username        TEXT,
  password        TEXT,
  goal            TEXT,
  weight          NUMERIC,
  week            INTEGER DEFAULT 1,
  exp_date        TEXT,
  plan_html       TEXT,
  created_at_app  TEXT,
  dr_notes        JSONB DEFAULT '[]'::jsonb,
  ficha           JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE metrics (
  id          TEXT PRIMARY KEY,
  patient_id  TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  weight      NUMERIC,
  fat         NUMERIC,
  waist       NUMERIC,
  chest       NUMERIC,
  arm         NUMERIC,
  leg         NUMERIC,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE adherence (
  id          TEXT PRIMARY KEY,
  patient_id  TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  week_key    TEXT NOT NULL,
  training    INTEGER,
  nutrition   INTEGER,
  sleep       INTEGER,
  steps       INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id             TEXT PRIMARY KEY,
  patient_id     TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  msg            TEXT,
  date           TEXT,
  pt_reply       TEXT,
  pt_reply_date  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id          TEXT PRIMARY KEY,
  patient_id  TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  week_key    TEXT,
  date        TEXT,
  late        BOOLEAN DEFAULT FALSE,
  data        JSONB,
  dr_reply    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE macros (
  patient_id  TEXT PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  data        JSONB,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE achievements (
  patient_id  TEXT PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  unlocked    JSONB DEFAULT '[]'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patients      DISABLE ROW LEVEL SECURITY;
ALTER TABLE metrics       DISABLE ROW LEVEL SECURITY;
ALTER TABLE adherence     DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports       DISABLE ROW LEVEL SECURITY;
ALTER TABLE macros        DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements  DISABLE ROW LEVEL SECURITY;

CREATE INDEX idx_patients_coach   ON patients(coach_email);
CREATE INDEX idx_metrics_patient  ON metrics(patient_id);
CREATE INDEX idx_adh_patient      ON adherence(patient_id);
CREATE INDEX idx_notifs_patient   ON notifications(patient_id);
CREATE INDEX idx_reports_patient  ON reports(patient_id);

-- ─── TABLA PINS (nueva en v3) ────────────────────────────────────────────────
-- PIN de acceso rápido por paciente. Separado de ficha para queries simples
-- y para que el paciente pueda leerlo sin depender del objeto patients completo.
DROP TABLE IF EXISTS pins CASCADE;
CREATE TABLE pins (
  patient_id  TEXT PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  pin_value   TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pins DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pins_patient ON pins(patient_id);
