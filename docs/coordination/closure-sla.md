# Cierre SLA — 14/10/2026

Implementación e integraciones terminadas; controles focales aprobados.

## Fuentes y decisiones para consolidar

Leídos AGENTS.md completo; SPEC-TI-2026-002 v2.0 DOCX mediante extracción OOXML
(RF-19, RN-07/09/11, motor SLA y P-09; no se afirma revisión visual de Word);
ER_2_Catalogos_SLA_y_configuracion.puml; HTML P-09 y su estado de ejemplo;
schema SQL, tipos generados, seed y consumidores vigentes de prioridades/SLA.

RF-19 y P-09 proponen modificar matriz/plazos desde la interfaz. AGENTS sección 9
declara matriz, P1 15/120 CONTINUO, P2 30/240 CONTINUO, P3 120/480 LABORAL,
P4 240/1440 LABORAL y alerta 50% no negociables. Se conserva la opción conservadora:
consulta de configuración real con comparación normativa y administración exclusiva
del nombre de presentación de prioridades. No hay valores libres, activación,
color editable ni restauración de tiempos. **RF-19 tiene cobertura parcial**;
editar metadatos no equivale a aceptar administración libre de matriz/plazos.

P-09 describe horario laboral lunes a sábado; AGENTS exige saltar fines de semana
y la seed vigente usa lunes a viernes. Esta pantalla muestra el modo LABORAL sin
introducir sábados ni cambiar calendarios. Consolidar ambas contradicciones en
DECISIONS.md por la sesión final.

No se cambia el código de prioridad ni las referencias, la matriz, los plazos,
las alertas, los parámetros, calendarios, tickets, pausas, reaperturas, snapshots
ni bitácoras. El nombre no participa en cálculos; no se requiere snapshot nuevo
ni migración. Se conservan las 45 tablas.

## Capacidad entregada

- Pantalla `/administracion/sla`, ruta lazy y enlace «Prioridades y SLA».
- `GET /api/v1/admin/sla`: cuatro prioridades y nueve combinaciones configuradas,
  valores normativos, indicadores de cumplimiento y revisión SHA-256 opaca.
- `PUT /api/v1/admin/sla/prioridades/:codigo`: únicamente `{ nombre,
  revisionAnterior }`; respuesta completa validada por Zod.
- Permiso `parametro.administrar` con grant GLOBAL obligatorio en el service y
  permiso explícito en ambas rutas; CSRF por plugin de la aplicación.
- Request estricto rechaza plazos, modo, matriz, porcentaje, color y activación.
- Transacción con advisory lock dedicado y bloqueo de filas ordenado; revisión
  optimista sobre la configuración completa. Edición obsoleta devuelve 409;
  cambio efectivo escribe `SLA_NOMBRE_EDITADO` en auditoria_sistema dentro de la
  misma transacción. Fallar auditoría revierte nombre. No-op no crea evento.
- El endpoint muestra desvíos válidos del catálogo; registros estructuralmente
  inválidos fallan validación sin sustituir silenciosamente la configuración.
- TanStack Query, RHF + Zod, QueryBoundary con carga/vacío/error/datos,
  labels asociados, mensaje de error, botones de 40 px, grillas responsivas.
  No se afirma validación dinámica de navegador, teclado o contraste.

## Archivos propios creados

- `packages/contracts/src/sla-settings.ts`
- `apps/api/src/modules/settings/sla/index.ts`
- `apps/api/src/modules/settings/sla/sla.routes.ts`
- `apps/api/src/modules/settings/sla/sla.service.ts`
- `apps/api/src/modules/settings/sla/sla.repository.ts`
- `apps/api/src/modules/settings/sla/sla.policies.ts`
- `apps/api/src/modules/settings/sla/sla.mapper.ts`
- `apps/api/test/sla-settings-checks.ts`
- `apps/web/src/features/sla-settings/index.ts`
- `apps/web/src/features/sla-settings/api/sla-settings.api.ts`
- `apps/web/src/features/sla-settings/hooks/useSlaSettings.ts`
- `apps/web/src/features/sla-settings/hooks/useSlaPriorityForm.ts`
- `apps/web/src/features/sla-settings/components/SlaPriorityForm.tsx`
- `apps/web/src/features/sla-settings/components/SlaMatrix.tsx`
- `apps/web/src/features/sla-settings/components/SlaSettingsWorkspace.tsx`
- `apps/web/src/features/sla-settings/pages/SlaSettingsPage.tsx`
- `docs/coordination/closure-sla.md`

Integraciones mínimas: `packages/contracts/src/index.ts`,
`apps/api/src/app.ts`, `apps/api/src/main.ts`,
`apps/web/src/app/router/routes.tsx`,
`apps/web/src/app/layouts/AppShell/AppShell.tsx`.
No se editaron archivos de otras capacidades ni docs globales.

## Pruebas para aceptación final

Registrar `slaSettingsChecks(appDatabase, env)` importándolo desde
`./sla-settings-checks.js` en `apps/api/test/database.integration.test.ts`.
Esta sesión NO edita el driver ni ejecuta integración.

Helper preparado con 8 casos: anónimo/solicitante/auditor; grant GLOBAL;
consulta normativa; CSRF y rechazo de campos libres; edición con auditoría y
comparación íntegra de tickets/bitácora/matriz/campos de prioridad;
concurrencia y formulario obsoleto; rollback de auditoría/no-op;
detección de desvío sin restauración. Se restaura solo catálogo modificado por
cada caso en afterEach. El helper usa el database del driver, sin conexiones
propias ni recreación de base. Requiere ejecución por la sesión final.

Controles focales ejecutados y aprobados: ESLint sobre nuevos archivos y
integraciones, compilación de contracts, TypeScript API (incluye helper) y web.
Pendientes de la sesión final: registrar helper, ejecutar sus 8 casos y
`pnpm check`, revisión visual/dinámica por su propietario, consolidar decisiones
y progreso y realizar commits globales. No se aplicaron migraciones ni se
ejecutó pnpm test/check, no se crearon recursos externos.

Entrega lista para la sesión de aceptación. Las limitaciones son la ejecución
pendiente de integración/controles globales y la cobertura parcial explícita de
RF-19 debido a los valores no negociables; no es un bloqueo técnico ni se afirma
aceptación funcional total. No hay cambios pendientes propios ni migraciones.

Estado: COMPLETO CON LIMITACIÓN
