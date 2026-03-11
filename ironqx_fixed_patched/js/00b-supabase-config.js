/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Supabase Configuration
   ── EDITA SOLO ESTE ARCHIVO ──
═══════════════════════════════════════════════ */

// Pega aquí tus credenciales de Supabase
// Las encuentras en: Project Settings → API
const SUPA_URL = 'https://kznoefpjgtgvltimnehz.supabase.co';  // ej: 'https://abcxyz.supabase.co'
const SUPA_KEY = 'sb_publishable_HjF60wjhKbgMm_PNeWhnmQ_72_PuLmq';  // anon/public key

// ─────────────────────────────────────────────
// No toques nada de aquí para abajo
// ─────────────────────────────────────────────
const SUPA_ENABLED = !!(SUPA_URL && SUPA_KEY);
