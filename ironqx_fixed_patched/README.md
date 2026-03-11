# IronQx Clinical & Performance Coaching — Modular Structure

## Estructura del proyecto

```
ironqx/
├── index.html              ← Entry point (solo estructura + links)
│
├── css/
│   ├── 01-tokens.css       ← :root variables, design tokens
│   ├── 02-base.css         ← Reset, body, @keyframes, splash, skeleton, screen, scroll
│   ├── 03-layout.css       ← Topbar, bottom nav, section labels
│   ├── 04-components.css   ← Hero, cards, buttons, fields, modals, charts, achievements
│   └── 05-screens.css      ← Login, admin, patient screens, misc utilities
│
└── js/                     ← Carga en orden numérico (classic <script src>, NO modules)
    ├── 00-config.js        ← Constantes, ICONS, FAT_COLOR
    ├── 01-storage.js       ← STORAGE wrapper + DB object
    ├── 02-utils.js         ← fmtDate, initials, payStatus, weekKey...
    ├── 03-seed.js          ← seedDemo(), datos de pacientes demo
    ├── 04-ui.js            ← show(), goTab(), toast, paintIcons, showM/closeM
    ├── 06-auth.js          ← doLogin, doLogout, saveSession, PIN screen
    ├── 07-patients.js      ← loadPatient(), screen home del paciente
    ├── 07b-ficha.js        ← renderFicha, showFichaModal, saveFicha
    ├── 07c-forms.js        ← createPt, plan upload, settings, msg templates
    ├── 07d-navlive.js      ← renderNavLiveData, openSettings, motivCounter
    ├── 08-metrics.js       ← renderBodyComp, bc cards
    ├── 08b-charts.js       ← drawGcChart, sparkline
    ├── 08c-donut.js        ← drawDonut (adherence ring)
    ├── 08d-compchart.js    ← drawCompChart (evolution chart)
    ├── 08e-misc.js         ← Weekly summary, before/after slider, player card
    ├── 08f-macros.js       ← renderMacrosCard, saveMacros, calcMacrosAuto
    ├── 09-adherence.js     ← renderAdh, cycleAdh, heatmap, streak badge
    ├── 10-progress.js      ← loadProgScreen, motivBanner, weight log
    ├── 11-reports.js       ← renderReportTab, submitReport, sentReportHTML
    ├── 12-messaging.js     ← renderSemaforo, renderInbox, sendNotif
    ├── 13-logros.js        ← LOGROS_DEF definitions (40+ achievements)
    ├── 13b-logros.js       ← computeLogros, renderAchievements, unlock flow
    ├── 14-admin.js         ← loadAdmin, refreshAdmin, openPt, admTab, timeline
    ├── 15-trends.js        ← calcWeekTrend, weightGoalDir, delta helpers
    ├── 16-gestures.js      ← initSwipeTabs, openPhotoCompare, drNotes
    ├── 17-biometrics.js    ← WebAuthn: bioRegister, bioVerify, bioAuth
    ├── 18-onboarding.js    ← showOnboarding, plan fullscreen portal
    └── 19-init.js          ← DOMContentLoaded bootstrap
```

## Decisiones técnicas clave

### ¿Por qué NO ES modules (`type="module"`)?
El HTML tiene **153 handlers inline** (`onclick="goTab(...)"`, etc.).
Con `type="module"` las funciones no serían globales y **todo rompería silenciosamente**.
La solución correcta es `classic <script src="">` donde todas las funciones
siguen siendo globales, zero riesgo.

### Orden de carga
Los archivos se nombran con prefijo numérico (`00-`, `01-`...) para que
el orden de carga en `index.html` sea explícito y predecible.
`localStorage` y `DB` deben estar disponibles antes de `seedDemo`,
que debe estar antes de `doLogin`, etc.

### Próximo paso (opcional)
Cuando se quiera modernizar completamente:
1. Migrar los 153 `onclick` inline a `addEventListener`
2. Solo entonces convertir a `type="module"` con imports explícitos
3. O migrar a Alpine.js / Preact para gestión de estado reactiva

