# Sesiones de cierre — 14/10/2026

Pedido del usuario: una sesión nueva por cada pendiente de cierre. Base de partida:
commit 3126e55, 308 pruebas y avance funcional orientativo 96 %. No equivale a
aceptación formal completa. Todos trabajan en el mismo checkout local.

| Capacidad | Chat | Propiedad y coordinación |
|---|---|---|
| Matriz/plazos bajo reglas vigentes | 01a13937-16ce-7d42-b421-a872e58ea1d8 | contracts sla-settings, settings/sla, feature sla-settings; integra app/main/router/nav/root contracts; closure-sla.md |
| Revisión visual | 01a13937-1d21-7ff3-92d4-376235cae21c | VISUAL.md, evidencia local; único dueño de navegador; closure-visual.md |
| Accesibilidad/móvil | 01a13937-285b-7233-9b95-19047b37d268 | frontend existente salvo AppShell/router y feature sla-settings; ACCESSIBILITY.md; closure-accessibility.md |
| Manuales locales | 01a13937-315f-7e52-83a6-4069287f8da4 | docs/manuals, README, deploy.md; closure-manuals.md |
| Aceptación y QA final | 01a13938-7009-7cd3-8ad4-7f72479a9ebb | ACCEPTANCE.md, PROGRESS, DECISIONS, driver integrado, controles y commits; closure-acceptance.md |

Las primeras cuatro sesiones no ejecutan integración ni commits globales. Deben
dejar lista de archivos, decisiones, validaciones/limitaciones y marcador final
Estado: COMPLETO o Estado: COMPLETO CON LIMITACIÓN en su coordinación.
Aceptación espera esos cuatro marcadores antes recrear helpdesk_test, integrar
pruebas SLA y ejecutar lint/typecheck/test/build. Consolida decisiones, progreso y
commits coherentes; no incorpora secretos ni revierte archivos ajenos.

Visual no modifica código. Accesibilidad no usa navegador y distingue revisión
estática de pruebas dinámicas pendientes. No se certifica visual/teclado si CUA
continúa bloqueado. Matriz/plazos respeta valores no negociables de AGENTS y
documenta contradicciones RF-19 conservadoramente, preservando ciclos existentes.
Manuales coteja fuentes/código/coordinaciones sin inventar pantallas ni producción.

Correo simulado y recuperación de enlaces CSAT tras reinicio mantienen sus límites
de prototipo documentados; no se añaden integraciones reales ni infraestructura.
