# IRONQX → Supabase: Guía de migración

## Resumen

Lo que ya está hecho (en el código):
- Motor de sincronización en segundo plano (`02b-supabase-sync.js`)
- Todos los métodos de escritura del DB ya sincronizan a Supabase automáticamente
- Al hacer login como admin, los datos se cargan desde Supabase

Lo que **tú tienes que hacer**: 4 pasos en tu computador.

---

## PASO 1 — Crear tu proyecto Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión (es gratis)
2. Click en **"New project"**
3. Ponle nombre: `ironqx`
4. Elige una región cercana (ej: US East o South America)
5. Define una contraseña para la base de datos (guárdala)
6. Espera ~2 minutos a que se cree el proyecto

---

## PASO 2 — Crear las tablas

1. En tu proyecto Supabase, ve a **SQL Editor** (ícono de base de datos en la barra lateral)
2. Click en **"New query"**
3. Abre el archivo `supabase-schema.sql` que está en la raíz del proyecto
4. Copia todo el contenido y pégalo en el editor
5. Click en **"Run"** (o Ctrl+Enter)
6. Deberías ver: "Success. No rows returned"

---

## PASO 3 — Copiar tus credenciales

1. En Supabase, ve a **Project Settings** → **API**
2. Copia:
   - **Project URL** (algo como `https://abcxyz.supabase.co`)
   - **anon / public key** (la llave larga que empieza con `eyJ...`)

3. Abre el archivo `js/00b-supabase-config.js` en tu editor de código
4. Pega los valores:

```js
const SUPA_URL = 'https://TU-PROYECTO.supabase.co';
const SUPA_KEY = 'eyJhbGci...TU_ANON_KEY...';
```

5. Guarda el archivo

---

## PASO 4 — Subir y probar

1. Sube los archivos a Cloudflare Pages como siempre
   (arrastra la carpeta `ironqx/` al dashboard de Cloudflare)

2. Abre la app en el navegador y abre la consola del navegador (F12)

3. Haz login como administrador

4. En la consola deberías ver:
   ```
   [IQ Cloud] Supabase sync engine activo
   [IQ Cloud] Cargando datos...
   [IQ Cloud] ✓ Datos sincronizados desde nube
   ```

5. Crea un paciente nuevo o edita uno existente

6. Ve a Supabase → **Table Editor** → tabla `patients`
   y verifica que el paciente aparece allí

✅ Si aparece, la integración está funcionando.

---

## ¿Qué sincroniza automáticamente?

| Acción en la app | Se sincroniza en Supabase |
|---|---|
| Crear / editar paciente | tabla `patients` |
| Registrar peso / medidas | tabla `metrics` |
| Marcar adherencia | tabla `adherence` |
| Enviar notificación | tabla `notifications` |
| Guardar reporte semanal | tabla `reports` |
| Configurar macros | tabla `macros` |
| Desbloquear logro | tabla `achievements` |

---

## ¿Qué NO sincroniza (por ahora)?

- **Fotos** (before/after): son base64 pesadas, necesitan Supabase Storage (siguiente fase)
- **Planes de alimentación**: HTML pesado, idem
- **PIN de acceso**: dato del dispositivo, se queda en local
- **Sesión activa**: se queda en local
- **Biometría WebAuthn**: específica del dispositivo, debe ser local

---

## Si algo falla

Abre la consola del navegador (F12). Busca mensajes `[IQ Cloud]`.

Error común: `"new row violates row-level security policy"`
→ Solución: asegúrate de haber ejecutado el SQL completo con los `DISABLE ROW LEVEL SECURITY`

Error: `Failed to fetch`
→ Verifica que `SUPA_URL` y `SUPA_KEY` estén bien copiados en `00b-supabase-config.js`

---

## Siguiente fase (cuando quieras)

- Activar **Supabase Auth** para reemplazar el login hardcodeado
- Subir fotos a **Supabase Storage**
- Activar **RLS** para seguridad clínica real
- PWA: agregar `manifest.json` + service worker
